/**
 * CourseAdvisor: Web Storage & Relational Adapter (Web Platform)
 * Used on Web platform to avoid Metro Web Worker chunk errors from expo-sqlite.
 * 100% Offline-First, runs locally in browser storage without cloud servers.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { allCourses } from "../data/curriculum";
import { firstTermCodes } from "../data/status";
import {
  AcademicStanding,
  defaultConfidence,
  defaultProfile,
  defaultStanding,
  DomainConfidence,
  SavedRoadmap,
  StudentProfile,
  StudentRecord,
} from "../types/storage";

export type CourseEntity = {
  code: string;
  title: string;
  units: number;
  unit_label: string | null;
  counted: number;
  year: number;
  semester: string;
  term_id: string;
  term_label: string;
  difficulty: number;
  domain: string;
};

export type PrerequisiteEntity = {
  course_id: string;
  prerequisite_course_id: string;
};

export type UserProgressEntity = {
  course_id: string;
  status: string;
  is_completed: number;
  grade: number | null;
  confidence_score: number;
  completed_at: string | null;
};

export type ScheduleEntity = {
  id: string;
  name: string;
  standing_year: number;
  standing_semester: string;
  plan_json: string;
  stress_score: number;
  stress_category: string;
  created_at: string;
  updated_at: string;
};

export type CTEResultNode = {
  code: string;
  title: string;
  units: number;
  difficulty: number;
  depth: number;
};

const KEYS = {
  STUDENTS_MAP: "@courseadvisor_students_map",
  ACTIVE_STUDENT_ID: "@courseadvisor_active_student_id",
  // Legacy / fallback keys
  PROFILE: "@courseadvisor_profile",
  COMPLETED: "@courseadvisor_completed",
  STANDING: "@courseadvisor_standing",
  CONFIDENCE: "@courseadvisor_confidence",
  SAVED_ROADMAPS: "@courseadvisor_saved_roadmaps",
  ONBOARDED: "@courseadvisor_onboarded",
};

export async function getDatabase(): Promise<any> {
  return null;
}

/**
 * Resolves upstream prerequisite tree recursively matching the SQL CTE specification.
 */
export async function getPrerequisiteChainWithCTE(
  targetCourseCode: string
): Promise<CTEResultNode[]> {
  const result: CTEResultNode[] = [];
  const visited = new Set<string>();

  function traverse(code: string, currentDepth: number) {
    const match = allCourses.find((c) => c.code === code);
    if (!match) return;

    for (const p of match.prerequisites) {
      if (!visited.has(p)) {
        visited.add(p);
        const pCourse = allCourses.find((c) => c.code === p);
        if (pCourse) {
          result.push({
            code: pCourse.code,
            title: pCourse.title,
            units: pCourse.units,
            difficulty: pCourse.difficulty ?? 5,
            depth: currentDepth,
          });
        }
        traverse(p, currentDepth + 1);
      }
    }
  }

  traverse(targetCourseCode, 1);
  return result.sort((a, b) => b.depth - a.depth);
}

/**
 * Resolves downstream unlock tree recursively matching the SQL CTE specification.
 */
export async function getUnlockedChainWithCTE(
  sourceCourseCode: string
): Promise<CTEResultNode[]> {
  const result: CTEResultNode[] = [];
  const visited = new Set<string>();

  function traverse(code: string, currentDepth: number) {
    const unlocked = allCourses.filter((c) => c.prerequisites.includes(code));
    for (const u of unlocked) {
      if (!visited.has(u.code)) {
        visited.add(u.code);
        result.push({
          code: u.code,
          title: u.title,
          units: u.units,
          difficulty: u.difficulty ?? 5,
          depth: currentDepth,
        });
        traverse(u.code, currentDepth + 1);
      }
    }
  }

  traverse(sourceCourseCode, 1);
  return result.sort((a, b) => a.depth - b.depth);
}

async function getStudentsMap(): Promise<Record<string, StudentRecord>> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.STUDENTS_MAP);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveStudentsMap(map: Record<string, StudentRecord>): Promise<void> {
  await AsyncStorage.setItem(KEYS.STUDENTS_MAP, JSON.stringify(map));
}

export const localDatabase = {
  async init(): Promise<boolean> {
    return true;
  },

  async getActiveStudentId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(KEYS.ACTIVE_STUDENT_ID);
    } catch {
      return null;
    }
  },

  async setActiveStudentId(studentId: string | null): Promise<void> {
    if (studentId) {
      await AsyncStorage.setItem(KEYS.ACTIVE_STUDENT_ID, studentId);
    } else {
      await AsyncStorage.removeItem(KEYS.ACTIVE_STUDENT_ID);
    }
  },

  async getAllStudents(): Promise<StudentRecord[]> {
    const map = await getStudentsMap();
    return Object.values(map);
  },

  async findStudent(studentId: string): Promise<StudentRecord | null> {
    const map = await getStudentsMap();
    const cleanId = studentId.trim().toLowerCase();
    for (const id in map) {
      if (id.trim().toLowerCase() === cleanId) {
        return map[id];
      }
    }
    return null;
  },

  async findStudentByNameAndId(
    name: string,
    studentId: string
  ): Promise<StudentRecord | null> {
    const map = await getStudentsMap();
    const cleanName = name.trim().toLowerCase();
    const cleanId = studentId.trim().toLowerCase();

    for (const id in map) {
      const s = map[id];
      if (
        s.studentId.trim().toLowerCase() === cleanId &&
        s.name.trim().toLowerCase() === cleanName
      ) {
        return s;
      }
    }
    return null;
  },

  async createStudent(name: string, studentId: string): Promise<StudentRecord> {
    const map = await getStudentsMap();
    const cleanId = studentId.trim();
    const cleanName = name.trim();

    const newStudent: StudentRecord = {
      studentId: cleanId,
      name: cleanName,
      degreeProgram: "Bachelor of Elementary Education",
      institution: "Mindanao State University at Naawan",
      catalogYear: "A.Y. 2025–2026",
      standing: defaultStanding,
      completed: [...firstTermCodes],
      confidence: defaultConfidence,
      onboarded: false,
      savedRoadmaps: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    map[cleanId] = newStudent;
    await saveStudentsMap(map);
    await this.setActiveStudentId(cleanId);
    return newStudent;
  },

  async saveStudentRecord(record: StudentRecord): Promise<void> {
    const map = await getStudentsMap();
    map[record.studentId.trim()] = {
      ...record,
      updatedAt: new Date().toISOString(),
    };
    await saveStudentsMap(map);
  },

  async updateStudent(
    studentId: string,
    partial: Partial<StudentRecord>
  ): Promise<StudentRecord | null> {
    const student = await this.findStudent(studentId);
    if (!student) return null;

    const updated: StudentRecord = {
      ...student,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    await this.saveStudentRecord(updated);
    return updated;
  },

  // Per-student active helpers
  async getActiveStudent(): Promise<StudentRecord | null> {
    const id = await this.getActiveStudentId();
    if (!id) return null;
    return await this.findStudent(id);
  },

  async getCompletedCourses(): Promise<string[]> {
    const active = await this.getActiveStudent();
    if (active) return active.completed;

    try {
      const raw = await AsyncStorage.getItem(KEYS.COMPLETED);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async setCompletedCourses(codes: string[]): Promise<void> {
    const activeId = await this.getActiveStudentId();
    if (activeId) {
      await this.updateStudent(activeId, { completed: codes });
    }
    await AsyncStorage.setItem(KEYS.COMPLETED, JSON.stringify(codes));
  },

  async toggleCourseCompletion(code: string, isCompleted: boolean): Promise<void> {
    const current = await this.getCompletedCourses();
    const set = new Set(current);
    if (isCompleted) {
      set.add(code);
    } else {
      set.delete(code);
    }
    await this.setCompletedCourses(Array.from(set));
  },

  async getProfile(): Promise<StudentProfile> {
    const active = await this.getActiveStudent();
    if (active) {
      return {
        name: active.name,
        studentId: active.studentId,
        degreeProgram: active.degreeProgram,
        institution: active.institution,
        catalogYear: active.catalogYear,
      };
    }

    try {
      const raw = await AsyncStorage.getItem(KEYS.PROFILE);
      return raw ? JSON.parse(raw) : defaultProfile;
    } catch {
      return defaultProfile;
    }
  },

  async setProfile(p: StudentProfile): Promise<void> {
    const activeId = await this.getActiveStudentId();
    if (activeId) {
      await this.updateStudent(activeId, {
        name: p.name,
        studentId: p.studentId,
        degreeProgram: p.degreeProgram,
        institution: p.institution,
        catalogYear: p.catalogYear,
      });
    }
    await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(p));
  },

  async getStanding(): Promise<AcademicStanding> {
    const active = await this.getActiveStudent();
    if (active) return active.standing;

    try {
      const raw = await AsyncStorage.getItem(KEYS.STANDING);
      return raw ? JSON.parse(raw) : defaultStanding;
    } catch {
      return defaultStanding;
    }
  },

  async setStanding(s: AcademicStanding): Promise<void> {
    const activeId = await this.getActiveStudentId();
    if (activeId) {
      await this.updateStudent(activeId, { standing: s });
    }
    await AsyncStorage.setItem(KEYS.STANDING, JSON.stringify(s));
  },

  async getConfidence(): Promise<DomainConfidence> {
    const active = await this.getActiveStudent();
    if (active) return active.confidence;

    try {
      const raw = await AsyncStorage.getItem(KEYS.CONFIDENCE);
      return raw ? JSON.parse(raw) : defaultConfidence;
    } catch {
      return defaultConfidence;
    }
  },

  async setConfidence(c: DomainConfidence): Promise<void> {
    const activeId = await this.getActiveStudentId();
    if (activeId) {
      await this.updateStudent(activeId, { confidence: c });
    }
    await AsyncStorage.setItem(KEYS.CONFIDENCE, JSON.stringify(c));
  },

  async getOnboarded(): Promise<boolean> {
    const active = await this.getActiveStudent();
    if (active) return active.onboarded;

    try {
      const raw = await AsyncStorage.getItem(KEYS.ONBOARDED);
      return raw === "true";
    } catch {
      return false;
    }
  },

  async setOnboarded(onboarded: boolean): Promise<void> {
    const activeId = await this.getActiveStudentId();
    if (activeId) {
      await this.updateStudent(activeId, { onboarded });
    }
    await AsyncStorage.setItem(KEYS.ONBOARDED, onboarded ? "true" : "false");
  },

  async getSavedRoadmaps(): Promise<SavedRoadmap[]> {
    const active = await this.getActiveStudent();
    if (active) return active.savedRoadmaps || [];

    try {
      const raw = await AsyncStorage.getItem(KEYS.SAVED_ROADMAPS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async saveRoadmap(roadmap: SavedRoadmap): Promise<void> {
    const all = await this.getSavedRoadmaps();
    const updated = [roadmap, ...all.filter((r) => r.id !== roadmap.id)];
    const activeId = await this.getActiveStudentId();
    if (activeId) {
      await this.updateStudent(activeId, { savedRoadmaps: updated });
    }
    await AsyncStorage.setItem(KEYS.SAVED_ROADMAPS, JSON.stringify(updated));
  },

  async deleteRoadmap(id: string): Promise<void> {
    const all = await this.getSavedRoadmaps();
    const filtered = all.filter((r) => r.id !== id);
    const activeId = await this.getActiveStudentId();
    if (activeId) {
      await this.updateStudent(activeId, { savedRoadmaps: filtered });
    }
    await AsyncStorage.setItem(KEYS.SAVED_ROADMAPS, JSON.stringify(filtered));
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  },
};
