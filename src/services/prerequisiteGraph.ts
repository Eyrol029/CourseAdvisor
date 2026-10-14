import { allCourses, Course } from "../data/curriculum";

export type CourseStatus = "Completed" | "Available" | "Blocked" | "Upcoming";

export type DAGNode = {
  course: Course;
  prerequisites: string[]; // In-degree: courses required before this
  unlocks: string[];       // Out-degree: courses enabled after this
  depth: number;           // Longest prerequisite path length from start
  tier: number;            // Stratified semester depth tier
};

export class KahnLoopException extends Error {
  public cycleNodes: string[];
  constructor(message: string, cycleNodes: string[]) {
    super(message);
    this.name = "KahnLoopException";
    this.cycleNodes = cycleNodes;
  }
}

export class PrerequisiteGraph {
  private nodes: Map<string, DAGNode> = new Map();

  constructor() {
    this.buildGraph();
  }

  private buildGraph() {
    // 1. Initialize nodes
    for (const course of allCourses) {
      this.nodes.set(course.code, {
        course,
        prerequisites: [...course.prerequisites],
        unlocks: [],
        depth: 0,
        tier: 0,
      });
    }

    // 2. Build forward adjacency list (unlocks / out-degree)
    for (const [code, node] of this.nodes) {
      for (const prereqCode of node.prerequisites) {
        const prereqNode = this.nodes.get(prereqCode);
        if (prereqNode) {
          if (!prereqNode.unlocks.includes(code)) {
            prereqNode.unlocks.push(code);
          }
        }
      }
    }

    // 3. Compute depths & semester tiers (Levelization)
    for (const code of this.nodes.keys()) {
      this.computeDepth(code, new Set());
    }

    // Compute Stratified Semester Tiers based on longest path from roots
    for (const [, node] of this.nodes) {
      node.tier = node.depth;
    }
  }

  private computeDepth(code: string, visited: Set<string>): number {
    const node = this.nodes.get(code);
    if (!node) return 0;
    if (visited.has(code)) return node.depth; // Cycle guard
    visited.add(code);

    if (node.prerequisites.length === 0) {
      node.depth = 1;
      return 1;
    }

    let maxPrereqDepth = 0;
    for (const prereqCode of node.prerequisites) {
      const d = this.computeDepth(prereqCode, new Set(visited));
      if (d > maxPrereqDepth) maxPrereqDepth = d;
    }

    node.depth = maxPrereqDepth + 1;
    return node.depth;
  }

  /**
   * Kahn's Algorithm for Topological Ordering & Cycle Detection
   * Executes in-degree analysis as specified in Section 3.1.
   * Raises KahnLoopException if an edge creates a loop.
   */
  public kahnsAlgorithm(courseCodes?: string[]): string[] {
    const subset = courseCodes ? new Set(courseCodes) : new Set(this.nodes.keys());
    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();

    for (const code of subset) {
      inDegree.set(code, 0);
      adj.set(code, []);
    }

    // Compute in-degrees within the subgraph
    for (const code of subset) {
      const node = this.nodes.get(code);
      if (node) {
        for (const prereq of node.prerequisites) {
          if (subset.has(prereq)) {
            adj.get(prereq)?.push(code);
            inDegree.set(code, (inDegree.get(code) ?? 0) + 1);
          }
        }
      }
    }

    // Initialize queue with 0 in-degree nodes
    const queue: string[] = [];
    for (const [code, deg] of inDegree) {
      if (deg === 0) queue.push(code);
    }

    const sorted: string[] = [];
    while (queue.length > 0) {
      const u = queue.shift()!;
      sorted.push(u);

      for (const v of adj.get(u) ?? []) {
        inDegree.set(v, (inDegree.get(v) ?? 1) - 1);
        if (inDegree.get(v) === 0) {
          queue.push(v);
        }
      }
    }

    if (sorted.length !== subset.size) {
      // Loop detected
      const cycleNodes = Array.from(subset).filter((c) => !sorted.includes(c));
      throw new KahnLoopException(
        "Invalid curriculum: circular dependency detected via Kahn's algorithm.",
        cycleNodes,
      );
    }

    return sorted;
  }

  public detectCycles(): { hasCycle: boolean; cyclePath?: string[] } {
    try {
      this.kahnsAlgorithm();
      return { hasCycle: false };
    } catch (e: any) {
      return { hasCycle: true, cyclePath: e.cycleNodes };
    }
  }

  /**
   * Goal-Driven Backward Chaining Traversal (Section 3.1)
   * Initiates from target graduation goal (default: ELC 197 Capstone)
   * Recursively explores parent nodes backward.
   * Terminal Stopping Conditions: Nodes present in student's completed catalog stop recursion!
   */
  public resolveGoalTrajectory(
    targetGoalCode = "ELC 197",
    completedCatalog: Set<string>,
  ): {
    trajectory: Course[];
    stratifiedTiers: Map<number, Course[]>;
    unfulfilledPrerequisites: string[];
  } {
    const unfulfilledSet = new Set<string>();
    const visited = new Set<string>();

    const backwardRecurse = (code: string) => {
      if (visited.has(code)) return;
      visited.add(code);

      // Terminal Stopping Condition: already completed by student
      if (completedCatalog.has(code)) {
        return;
      }

      unfulfilledSet.add(code);

      const node = this.nodes.get(code);
      if (!node) return;

      for (const prereq of node.prerequisites) {
        backwardRecurse(prereq);
      }
    };

    backwardRecurse(targetGoalCode);

    // Order trajectory topologically using Kahn's Algorithm
    const unfulfilledList = Array.from(unfulfilledSet);
    let orderedCodes: string[] = [];
    try {
      orderedCodes = this.kahnsAlgorithm(unfulfilledList);
    } catch {
      orderedCodes = unfulfilledList;
    }

    const trajectory = orderedCodes
      .map((c) => this.nodes.get(c)?.course)
      .filter((c): c is Course => !!c);

    // Stratify into semester depth tiers (Levelization)
    const stratifiedTiers = new Map<number, Course[]>();
    for (const c of trajectory) {
      const tier = this.nodes.get(c.code)?.tier ?? 1;
      const list = stratifiedTiers.get(tier) ?? [];
      list.push(c);
      stratifiedTiers.set(tier, list);
    }

    return {
      trajectory,
      stratifiedTiers,
      unfulfilledPrerequisites: unfulfilledList,
    };
  }

  /**
   * Interactive Constraint Re-ordering Validation (Section 6 & 7)
   * Validates if moving a course to a destination semester violates prerequisite DAG ordering.
   */
  public validateScheduleMove(
    courseCode: string,
    destinationTermIndex: number,
    termAssignments: { termIndex: number; courseCodes: string[] }[],
  ): {
    isValid: boolean;
    violationReason?: string;
  } {
    const node = this.nodes.get(courseCode);
    if (!node) return { isValid: true };

    // Check prerequisites: all prerequisites must be in earlier terms (< destinationTermIndex)
    for (const prereq of node.prerequisites) {
      const prereqAssignment = termAssignments.find((t) =>
        t.courseCodes.includes(prereq),
      );
      if (prereqAssignment && prereqAssignment.termIndex >= destinationTermIndex) {
        return {
          isValid: false,
          violationReason: `Prerequisite violation: ${prereq} is required before ${courseCode}, but is scheduled in term ${prereqAssignment.termIndex + 1}.`,
        };
      }
    }

    // Check downstream unlocks: all unlocked courses must be in later terms (> destinationTermIndex)
    for (const unlock of node.unlocks) {
      const unlockAssignment = termAssignments.find((t) =>
        t.courseCodes.includes(unlock),
      );
      if (unlockAssignment && unlockAssignment.termIndex <= destinationTermIndex) {
        return {
          isValid: false,
          violationReason: `Prerequisite violation: ${unlock} requires ${courseCode}, but is scheduled in term ${unlockAssignment.termIndex + 1}.`,
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Evaluates single course eligibility
   */
  public evaluateEligibility(
    code: string,
    completedCodes: Set<string>,
  ): {
    isCompleted: boolean;
    isEligible: boolean;
    satisfiedPrereqs: string[];
    missingPrereqs: string[];
  } {
    if (completedCodes.has(code)) {
      return {
        isCompleted: true,
        isEligible: true,
        satisfiedPrereqs: [],
        missingPrereqs: [],
      };
    }

    const node = this.nodes.get(code);
    if (!node) {
      return {
        isCompleted: false,
        isEligible: false,
        satisfiedPrereqs: [],
        missingPrereqs: [],
      };
    }

    const satisfiedPrereqs: string[] = [];
    const missingPrereqs: string[] = [];

    for (const prereq of node.prerequisites) {
      if (completedCodes.has(prereq)) {
        satisfiedPrereqs.push(prereq);
      } else {
        missingPrereqs.push(prereq);
      }
    }

    return {
      isCompleted: false,
      isEligible: missingPrereqs.length === 0,
      satisfiedPrereqs,
      missingPrereqs,
    };
  }

  public getDirectUnlocks(code: string): Course[] {
    const node = this.nodes.get(code);
    if (!node) return [];
    return node.unlocks
      .map((c) => this.nodes.get(c)?.course)
      .filter((c): c is Course => !!c);
  }

  public getBackwardChainingRequirements(targetCode: string): Course[] {
    const { trajectory } = this.resolveGoalTrajectory(targetCode, new Set());
    return trajectory.filter((c) => c.code !== targetCode);
  }

  public getCourseStatus(
    course: Course,
    completedCodes: Set<string>,
  ): CourseStatus {
    if (completedCodes.has(course.code)) return "Completed";
    const { isEligible } = this.evaluateEligibility(course.code, completedCodes);
    if (isEligible) return "Available";
    return "Blocked";
  }

  public getNode(code: string): DAGNode | undefined {
    return this.nodes.get(code);
  }

  public getAllNodes(): DAGNode[] {
    return Array.from(this.nodes.values());
  }
}

export const prerequisiteGraph = new PrerequisiteGraph();
