import { allCourses, Course, curriculum, Term } from "../data/curriculum";
import { DomainConfidence } from "./storage";
import { fuzzySystem, FuzzyStressResult } from "./fuzzyInference";
import { prerequisiteGraph } from "./prerequisiteGraph";

export type RecommendedCourse = Course & {
  rationale: string;
  isUnlocked: boolean;
  targetMilestone?: string;
};

export type RoadmapTerm = {
  termId: string;
  year: number;
  semester: "First Semester" | "Second Semester" | "Summer";
  label: string;
  courses: RecommendedCourse[];
  totalUnits: number;
  fuzzyAnalysis: FuzzyStressResult;
};

export type RoadmapGenerationResult = {
  success: boolean;
  roadmap: RoadmapTerm[];
  remainingUnits: number;
  unassignedCourses: Course[];
  warnings: string[];
};

export class RoadmapGenerator {
  /**
   * Generates a personalized semester-by-semester roadmap from the student's current state
   * using Goal-Driven Traversal towards Senior Capstone ELC 197.
   */
  public generate(
    completedCodes: Set<string>,
    currentStanding: { year: number; semester: string },
    confidence: DomainConfidence,
  ): RoadmapGenerationResult {
    // 1. Goal-Driven Backward Traversal from Senior Capstone ELC 197
    const { unfulfilledPrerequisites } =
      prerequisiteGraph.resolveGoalTrajectory("ELC 197", completedCodes);

    const uncompletedCourses = allCourses.filter(
      (c) => !completedCodes.has(c.code),
    );

    const avgConfidence =
      (confidence.foundations +
        confidence.numeracy +
        confidence.literacy +
        confidence.professional) /
      4;

    const currentCompleted = new Set<string>(completedCodes);
    const roadmap: RoadmapTerm[] = [];
    const warnings: string[] = [];

    // Identify terms from curriculum that still need courses
    const termsToSchedule: Term[] = [];
    for (const term of curriculum) {
      const hasUncompleted = term.courses.some((c) => !currentCompleted.has(c.code));
      if (hasUncompleted) {
        termsToSchedule.push(term);
      }
    }

    // Schedule term by term
    for (const term of termsToSchedule) {
      const scheduledThisTerm: RecommendedCourse[] = [];
      let termUnits = 0;

      // Filter eligible candidates
      const candidates = uncompletedCourses.filter(
        (c) =>
          !currentCompleted.has(c.code) &&
          !scheduledThisTerm.some((s) => s.code === c.code),
      );

      // Sort prioritizing critical milestone path toward ELC 197
      candidates.sort((a, b) => {
        const aIsCritical = unfulfilledPrerequisites.includes(a.code);
        const bIsCritical = unfulfilledPrerequisites.includes(b.code);
        if (aIsCritical && !bIsCritical) return -1;
        if (!aIsCritical && bIsCritical) return 1;

        const aTerm = allCourses.find((x) => x.code === a.code)?.termId;
        const bTerm = allCourses.find((x) => x.code === b.code)?.termId;
        if (aTerm === term.id && bTerm !== term.id) return -1;
        if (bTerm === term.id && aTerm !== term.id) return 1;
        return (a.year ?? 1) - (b.year ?? 1);
      });

      for (const course of candidates) {
        const { isEligible, satisfiedPrereqs } =
          prerequisiteGraph.evaluateEligibility(course.code, currentCompleted);

        if (!isEligible) continue;

        // Summer offering guard
        const originalTerm = curriculum.find((t) =>
          t.courses.some((c) => c.code === course.code),
        );
        if (term.semester === "Summer" && originalTerm?.semester !== "Summer") {
          continue;
        }

        const courseCountedUnits = course.counted === false ? 0 : course.units;
        const maxTermUnits = term.semester === "Summer" ? 6 : 24;

        if (termUnits + courseCountedUnits <= maxTermUnits) {
          // Transparent Scheduling Explanation (Section 6)
          let rationale = "";
          if (course.prerequisites.length > 0) {
            rationale = `All prerequisites satisfied (${satisfiedPrereqs.join(", ")}). `;
          } else {
            rationale = `Foundational BEEd requirement. `;
          }

          if (course.code === "ELC 197") {
            rationale += `Culminating Senior Teaching Internship Capstone.`;
          } else if (unfulfilledPrerequisites.includes(course.code)) {
            rationale += `Required stepping-stone toward Senior Capstone ELC 197.`;
          } else {
            rationale += `Fulfills degree requirement in regular sequence.`;
          }

          scheduledThisTerm.push({
            ...course,
            rationale,
            isUnlocked: true,
            targetMilestone: "ELC 197",
          });

          termUnits += courseCountedUnits;
        }
      }

      for (const scheduled of scheduledThisTerm) {
        currentCompleted.add(scheduled.code);
      }

      // Mamdani FIS Evaluation
      const avgDifficulty = 6;
      const fuzzyAnalysis = fuzzySystem.evaluate(avgConfidence, avgDifficulty, termUnits);

      roadmap.push({
        termId: term.id,
        year: term.year,
        semester: term.semester,
        label: term.label,
        courses: scheduledThisTerm,
        totalUnits: termUnits,
        fuzzyAnalysis,
      });
    }

    const unassignedCourses = allCourses.filter((c) => !currentCompleted.has(c.code));
    if (unassignedCourses.length > 0) {
      warnings.push(
        `${unassignedCourses.length} course(s) could not be scheduled in regular terms due to prerequisite blocks or unit caps.`,
      );
    }

    const remainingUnits = unassignedCourses.reduce(
      (sum, c) => (c.counted === false ? sum : sum + c.units),
      0,
    );

    return {
      success: unassignedCourses.length === 0,
      roadmap,
      remainingUnits,
      unassignedCourses,
      warnings,
    };
  }

  /**
   * Interactive Constraint Re-ordering (Section 6 & 7)
   * Validates moving a course from one term to another and executes the swap if valid.
   */
  public moveCourseBetweenTerms(
    currentRoadmap: RoadmapTerm[],
    courseCode: string,
    fromTermIndex: number,
    toTermIndex: number,
    confidence: DomainConfidence,
  ): {
    success: boolean;
    updatedRoadmap?: RoadmapTerm[];
    error?: string;
  } {
    if (fromTermIndex === toTermIndex) {
      return { success: true, updatedRoadmap: currentRoadmap };
    }

    // Build assignment list for validation
    const termAssignments = currentRoadmap.map((t, idx) => ({
      termIndex: idx,
      courseCodes: t.courses
        .filter((c) => (idx === fromTermIndex ? c.code !== courseCode : true))
        .map((c) => c.code),
    }));

    termAssignments[toTermIndex].courseCodes.push(courseCode);

    // Validate with prerequisiteGraph
    const validation = prerequisiteGraph.validateScheduleMove(
      courseCode,
      toTermIndex,
      termAssignments,
    );

    if (!validation.isValid) {
      return {
        success: false,
        error: validation.violationReason,
      };
    }

    // Execute move
    const newRoadmap = currentRoadmap.map((term, idx) => {
      let courses = [...term.courses];
      if (idx === fromTermIndex) {
        courses = courses.filter((c) => c.code !== courseCode);
      } else if (idx === toTermIndex) {
        const movedCourse = currentRoadmap[fromTermIndex].courses.find(
          (c) => c.code === courseCode,
        );
        if (movedCourse) {
          courses.push({
            ...movedCourse,
            rationale: `Manually scheduled in ${term.label}. Prerequisites topologically verified.`,
          });
        }
      }

      const totalUnits = courses.reduce(
        (sum, c) => (c.counted === false ? sum : sum + c.units),
        0,
      );

      const avgConfidence =
        (confidence.foundations +
          confidence.numeracy +
          confidence.literacy +
          confidence.professional) /
        4;
      const fuzzyAnalysis = fuzzySystem.evaluate(avgConfidence, 6, totalUnits);

      return {
        ...term,
        courses,
        totalUnits,
        fuzzyAnalysis,
      };
    });

    return {
      success: true,
      updatedRoadmap: newRoadmap,
    };
  }
}

export const roadmapGenerator = new RoadmapGenerator();
