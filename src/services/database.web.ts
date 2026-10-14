/**
 * CourseAdvisor: Web Storage & Relational Adapter (Web Platform)
 * Used on Web platform to avoid Metro Web Worker chunk errors from expo-sqlite.
 * 100% Offline-First, runs locally in browser storage without cloud servers.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { allCourses } from "../data/curriculum";
import {
  AcademicStanding,
  defaultConfidence,
  defaultProfile,
  defaultStanding,
  DomainConfidence,
  SavedRoadmap,
  StudentProfile,
} from "./storage";

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

export const localDatabase = {
  async init(): Promise<boolean> {
    return true;
  },

  async getCompletedCourses(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.COMPLETED);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async setCompletedCourses(codes: string[]): Promise<void> {
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
    try {
      const raw = await AsyncStorage.getItem(KEYS.PROFILE);
      return raw ? JSON.parse(raw) : defaultProfile;
    } catch {
      return defaultProfile;
    }
  },

  async setProfile(p: StudentProfile): Promise<void> {
    await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(p));
  },

  async getStanding(): Promise<AcademicStanding> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.STANDING);
      return raw ? JSON.parse(raw) : defaultStanding;
    } catch {
      return defaultStanding;
    }
  },

  async setStanding(s: AcademicStanding): Promise<void> {
    await AsyncStorage.setItem(KEYS.STANDING, JSON.stringify(s));
  },

  async getConfidence(): Promise<DomainConfidence> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.CONFIDENCE);
      return raw ? JSON.parse(raw) : defaultConfidence;
    } catch {
      return defaultConfidence;
    }
  },

  async setConfidence(c: DomainConfidence): Promise<void> {
    await AsyncStorage.setItem(KEYS.CONFIDENCE, JSON.stringify(c));
  },

  async getSavedRoadmaps(): Promise<SavedRoadmap[]> {
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
    await AsyncStorage.setItem(KEYS.SAVED_ROADMAPS, JSON.stringify(updated));
  },

  async deleteRoadmap(id: string): Promise<void> {
    const all = await this.getSavedRoadmaps();
    const filtered = all.filter((r) => r.id !== id);
    await AsyncStorage.setItem(KEYS.SAVED_ROADMAPS, JSON.stringify(filtered));
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  },
};
