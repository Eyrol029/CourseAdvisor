/**
 * CourseAdvisor: Local Relational Database Service (Native iOS & Android SQLite + CTEs)
 * Implements Section 4 (Data Modeling & Storage Strategy) and Section 7 (Offline-First Integrity):
 * - Relational Schema: Courses, Prerequisites, User_Progress, Schedules, User_Profile
 * - Recursive Common Table Expressions (CTEs) for prerequisite chain resolution
 * - 100% Offline, device-local persistence (no cloud dependency)
 */

import * as SQLite from "expo-sqlite";
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

const DB_NAME = "courseadvisor.db";
let dbInstance: SQLite.SQLiteDatabase | null = null;
let isDbReady = false;
let initPromise: Promise<SQLite.SQLiteDatabase | null> | null = null;

function getCourseDomain(code: string): string {
  if (code.startsWith("GEC") || code.startsWith("NST") || code.startsWith("PED")) return "foundations";
  if (code.includes("104") || (code.includes("101") && code.startsWith("GED"))) return "numeracy";
  if (code.includes("102") || code.includes("113") || code.includes("114")) return "literacy";
  return "professional";
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase | null> {
  if (isDbReady && dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      dbInstance = db;

      try {
        await db.execAsync(`
          PRAGMA foreign_keys = ON;
          PRAGMA journal_mode = WAL;
        `);
      } catch {
        // Ignored
      }

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS courses (
          code TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          units INTEGER NOT NULL,
          unit_label TEXT,
          counted INTEGER NOT NULL DEFAULT 1,
          year INTEGER NOT NULL,
          semester TEXT NOT NULL,
          term_id TEXT NOT NULL,
          term_label TEXT NOT NULL,
          difficulty REAL NOT NULL DEFAULT 5.0,
          domain TEXT NOT NULL DEFAULT 'foundations'
        );

        CREATE TABLE IF NOT EXISTS prerequisites (
          course_id TEXT NOT NULL,
          prerequisite_course_id TEXT NOT NULL,
          PRIMARY KEY (course_id, prerequisite_course_id),
          FOREIGN KEY (course_id) REFERENCES courses(code) ON DELETE CASCADE,
          FOREIGN KEY (prerequisite_course_id) REFERENCES courses(code) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS user_progress (
          course_id TEXT PRIMARY KEY,
          status TEXT NOT NULL DEFAULT 'not_taken',
          is_completed INTEGER NOT NULL DEFAULT 0,
          grade REAL,
          confidence_score REAL DEFAULT 7.0,
          completed_at TEXT,
          FOREIGN KEY (course_id) REFERENCES courses(code) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS schedules (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          standing_year INTEGER NOT NULL,
          standing_semester TEXT NOT NULL,
          plan_json TEXT NOT NULL,
          stress_score REAL NOT NULL DEFAULT 0,
          stress_category TEXT NOT NULL DEFAULT 'Balanced',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS user_profile (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          name TEXT NOT NULL,
          student_id TEXT NOT NULL,
          degree_program TEXT NOT NULL,
          institution TEXT NOT NULL,
          catalog_year TEXT NOT NULL,
          standing_year INTEGER NOT NULL DEFAULT 1,
          standing_semester TEXT NOT NULL DEFAULT 'Second Semester',
          onboarded INTEGER NOT NULL DEFAULT 0,
          confidence_foundations REAL DEFAULT 7.0,
          confidence_numeracy REAL DEFAULT 6.0,
          confidence_literacy REAL DEFAULT 8.0,
          confidence_professional REAL DEFAULT 7.0,
          updated_at TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_prereq_course ON prerequisites(course_id);
        CREATE INDEX IF NOT EXISTS idx_prereq_parent ON prerequisites(prerequisite_course_id);
        CREATE INDEX IF NOT EXISTS idx_progress_completed ON user_progress(is_completed);
      `);

      await seedCurriculumIfEmpty(db);

      isDbReady = true;
      return db;
    } catch (e) {
      console.warn("SQLite initialization fallback to local storage:", e);
      return null;
    }
  })();

  return initPromise;
}

async function seedCurriculumIfEmpty(db: SQLite.SQLiteDatabase) {
  try {
    const existing = await db.getFirstAsync<{ count: number }>(
      "SELECT count(*) as count FROM courses;"
    );

    if (existing && existing.count >= allCourses.length) {
      return;
    }

    for (const c of allCourses) {
      const countedVal = c.counted === false ? 0 : 1;
      const difficultyVal = c.difficulty ?? 5;
      const domainVal = getCourseDomain(c.code);

      await db.runAsync(
        `INSERT OR REPLACE INTO courses (
          code, title, units, unit_label, counted, year, semester, term_id, term_label, difficulty, domain
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        c.code,
        c.title,
        c.units,
        c.unitLabel || null,
        countedVal,
        c.year || 1,
        c.termLabel?.split(", ")[1] || "First Semester",
        c.termId || "y1s1",
        c.termLabel || "First Year, First Semester",
        difficultyVal,
        domainVal
      );

      for (const prereqCode of c.prerequisites) {
        await db.runAsync(
          `INSERT OR IGNORE INTO prerequisites (course_id, prerequisite_course_id) VALUES (?, ?);`,
          c.code,
          prereqCode
        );
      }
    }
  } catch (err) {
    console.error("Error seeding curriculum to SQLite:", err);
  }
}

export async function getPrerequisiteChainWithCTE(
  targetCourseCode: string
): Promise<CTEResultNode[]> {
  const db = await getDatabase();
  if (!db) {
    return fallbackPrereqTraversal(targetCourseCode);
  }

  try {
    const query = `
      WITH RECURSIVE PrereqChain AS (
        SELECT
          p.course_id,
          p.prerequisite_course_id,
          1 AS depth
        FROM prerequisites p
        WHERE p.course_id = ?

        UNION

        SELECT
          p.course_id,
          p.prerequisite_course_id,
          pc.depth + 1 AS depth
        FROM prerequisites p
        INNER JOIN PrereqChain pc ON p.course_id = pc.prerequisite_course_id
      )
      SELECT DISTINCT
        c.code,
        c.title,
        c.units,
        c.difficulty,
        MAX(pc.depth) as depth
      FROM PrereqChain pc
      JOIN courses c ON c.code = pc.prerequisite_course_id
      GROUP BY c.code, c.title, c.units, c.difficulty
      ORDER BY depth DESC;
    `;

    const rows = await db.getAllAsync<CTEResultNode>(query, targetCourseCode);
    return rows;
  } catch (err) {
    console.warn("CTE query failed, falling back to graph traversal:", err);
    return fallbackPrereqTraversal(targetCourseCode);
  }
}

export async function getUnlockedChainWithCTE(
  sourceCourseCode: string
): Promise<CTEResultNode[]> {
  const db = await getDatabase();
  if (!db) {
    return fallbackUnlockedTraversal(sourceCourseCode);
  }

  try {
    const query = `
      WITH RECURSIVE UnlockedChain AS (
        SELECT
          p.course_id,
          p.prerequisite_course_id,
          1 AS depth
        FROM prerequisites p
        WHERE p.prerequisite_course_id = ?

        UNION

        SELECT
          p.course_id,
          p.prerequisite_course_id,
          uc.depth + 1 AS depth
        FROM prerequisites p
        INNER JOIN UnlockedChain uc ON p.prerequisite_course_id = uc.course_id
      )
      SELECT DISTINCT
        c.code,
        c.title,
        c.units,
        c.difficulty,
        MIN(uc.depth) as depth
      FROM UnlockedChain uc
      JOIN courses c ON c.code = uc.course_id
      GROUP BY c.code, c.title, c.units, c.difficulty
      ORDER BY depth ASC;
    `;

    const rows = await db.getAllAsync<CTEResultNode>(query, sourceCourseCode);
    return rows;
  } catch (err) {
    console.warn("Unlocked CTE failed, falling back:", err);
    return fallbackUnlockedTraversal(sourceCourseCode);
  }
}

function fallbackPrereqTraversal(targetCode: string): CTEResultNode[] {
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

  traverse(targetCode, 1);
  return result.sort((a, b) => b.depth - a.depth);
}

function fallbackUnlockedTraversal(sourceCode: string): CTEResultNode[] {
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

  traverse(sourceCode, 1);
  return result.sort((a, b) => a.depth - b.depth);
}

export const localDatabase = {
  async init(): Promise<boolean> {
    const db = await getDatabase();
    return db !== null;
  },

  async getCompletedCourses(): Promise<string[]> {
    const db = await getDatabase();
    if (!db) {
      const raw = await AsyncStorage.getItem("@courseadvisor_completed");
      return raw ? JSON.parse(raw) : [];
    }

    try {
      const rows = await db.getAllAsync<{ course_id: string }>(
        "SELECT course_id FROM user_progress WHERE is_completed = 1;"
      );
      if (rows && rows.length > 0) {
        return rows.map((r) => r.course_id);
      }
      const raw = await AsyncStorage.getItem("@courseadvisor_completed");
      return raw ? JSON.parse(raw) : [];
    } catch {
      const raw = await AsyncStorage.getItem("@courseadvisor_completed");
      return raw ? JSON.parse(raw) : [];
    }
  },

  async setCompletedCourses(codes: string[]): Promise<void> {
    await AsyncStorage.setItem("@courseadvisor_completed", JSON.stringify(codes));

    const db = await getDatabase();
    if (!db) return;

    try {
      const now = new Date().toISOString();
      await db.runAsync("UPDATE user_progress SET is_completed = 0, status = 'not_taken';");

      for (const code of codes) {
        await db.runAsync(
          `INSERT INTO user_progress (course_id, status, is_completed, completed_at)
           VALUES (?, 'completed', 1, ?)
           ON CONFLICT(course_id) DO UPDATE SET
             status = 'completed',
             is_completed = 1,
             completed_at = ?;`,
          code,
          now,
          now
        );
      }
    } catch (err) {
      console.warn("Failed to sync completed courses to SQLite:", err);
    }
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
    const db = await getDatabase();
    if (!db) {
      const raw = await AsyncStorage.getItem("@courseadvisor_profile");
      return raw ? JSON.parse(raw) : defaultProfile;
    }

    try {
      const row = await db.getFirstAsync<{
        name: string;
        student_id: string;
        degree_program: string;
        institution: string;
        catalog_year: string;
      }>("SELECT name, student_id, degree_program, institution, catalog_year FROM user_profile WHERE id = 1;");

      if (row) {
        return {
          name: row.name,
          studentId: row.student_id,
          degreeProgram: row.degree_program,
          institution: row.institution,
          catalogYear: row.catalog_year,
        };
      }
      const raw = await AsyncStorage.getItem("@courseadvisor_profile");
      return raw ? JSON.parse(raw) : defaultProfile;
    } catch {
      const raw = await AsyncStorage.getItem("@courseadvisor_profile");
      return raw ? JSON.parse(raw) : defaultProfile;
    }
  },

  async setProfile(p: StudentProfile): Promise<void> {
    await AsyncStorage.setItem("@courseadvisor_profile", JSON.stringify(p));

    const db = await getDatabase();
    if (!db) return;

    try {
      await db.runAsync(
        `INSERT INTO user_profile (id, name, student_id, degree_program, institution, catalog_year, updated_at)
         VALUES (1, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           name = excluded.name,
           student_id = excluded.student_id,
           degree_program = excluded.degree_program,
           institution = excluded.institution,
           catalog_year = excluded.catalog_year,
           updated_at = excluded.updated_at;`,
        p.name,
        p.studentId,
        p.degreeProgram,
        p.institution,
        p.catalogYear,
        new Date().toISOString()
      );
    } catch (err) {
      console.warn("Failed to save profile to SQLite:", err);
    }
  },

  async getStanding(): Promise<AcademicStanding> {
    const db = await getDatabase();
    if (!db) {
      const raw = await AsyncStorage.getItem("@courseadvisor_standing");
      return raw ? JSON.parse(raw) : defaultStanding;
    }

    try {
      const row = await db.getFirstAsync<{
        standing_year: number;
        standing_semester: string;
      }>("SELECT standing_year, standing_semester FROM user_profile WHERE id = 1;");

      if (row && row.standing_year) {
        return {
          year: row.standing_year as 1 | 2 | 3 | 4,
          semester: row.standing_semester as AcademicStanding["semester"],
        };
      }
      const raw = await AsyncStorage.getItem("@courseadvisor_standing");
      return raw ? JSON.parse(raw) : defaultStanding;
    } catch {
      const raw = await AsyncStorage.getItem("@courseadvisor_standing");
      return raw ? JSON.parse(raw) : defaultStanding;
    }
  },

  async setStanding(s: AcademicStanding): Promise<void> {
    await AsyncStorage.setItem("@courseadvisor_standing", JSON.stringify(s));

    const db = await getDatabase();
    if (!db) return;

    try {
      await db.runAsync(
        `UPDATE user_profile SET
           standing_year = ?,
           standing_semester = ?,
           updated_at = ?
         WHERE id = 1;`,
        s.year,
        s.semester,
        new Date().toISOString()
      );
    } catch (err) {
      console.warn("Failed to set standing in SQLite:", err);
    }
  },

  async getConfidence(): Promise<DomainConfidence> {
    const db = await getDatabase();
    if (!db) {
      const raw = await AsyncStorage.getItem("@courseadvisor_confidence");
      return raw ? JSON.parse(raw) : defaultConfidence;
    }

    try {
      const row = await db.getFirstAsync<{
        confidence_foundations: number;
        confidence_numeracy: number;
        confidence_literacy: number;
        confidence_professional: number;
      }>(
        `SELECT
           confidence_foundations,
           confidence_numeracy,
           confidence_literacy,
           confidence_professional
         FROM user_profile WHERE id = 1;`
      );

      if (row && row.confidence_foundations !== null) {
        return {
          foundations: row.confidence_foundations,
          numeracy: row.confidence_numeracy,
          literacy: row.confidence_literacy,
          professional: row.confidence_professional,
        };
      }
      const raw = await AsyncStorage.getItem("@courseadvisor_confidence");
      return raw ? JSON.parse(raw) : defaultConfidence;
    } catch {
      const raw = await AsyncStorage.getItem("@courseadvisor_confidence");
      return raw ? JSON.parse(raw) : defaultConfidence;
    }
  },

  async setConfidence(c: DomainConfidence): Promise<void> {
    await AsyncStorage.setItem("@courseadvisor_confidence", JSON.stringify(c));

    const db = await getDatabase();
    if (!db) return;

    try {
      await db.runAsync(
        `UPDATE user_profile SET
           confidence_foundations = ?,
           confidence_numeracy = ?,
           confidence_literacy = ?,
           confidence_professional = ?,
           updated_at = ?
         WHERE id = 1;`,
        c.foundations,
        c.numeracy,
        c.literacy,
        c.professional,
        new Date().toISOString()
      );
    } catch (err) {
      console.warn("Failed to set confidence in SQLite:", err);
    }
  },

  async getSavedRoadmaps(): Promise<SavedRoadmap[]> {
    const db = await getDatabase();
    if (!db) {
      const raw = await AsyncStorage.getItem("@courseadvisor_saved_roadmaps");
      return raw ? JSON.parse(raw) : [];
    }

    try {
      const rows = await db.getAllAsync<{
        id: string;
        name: string;
        standing_year: number;
        standing_semester: string;
        plan_json: string;
        created_at: string;
        updated_at: string;
      }>("SELECT * FROM schedules ORDER BY updated_at DESC;");

      if (rows && rows.length > 0) {
        return rows.map((r) => ({
          id: r.id,
          name: r.name,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          standing: {
            year: r.standing_year as 1 | 2 | 3 | 4,
            semester: r.standing_semester as AcademicStanding["semester"],
          },
          terms: JSON.parse(r.plan_json),
        }));
      }
      const raw = await AsyncStorage.getItem("@courseadvisor_saved_roadmaps");
      return raw ? JSON.parse(raw) : [];
    } catch {
      const raw = await AsyncStorage.getItem("@courseadvisor_saved_roadmaps");
      return raw ? JSON.parse(raw) : [];
    }
  },

  async saveRoadmap(roadmap: SavedRoadmap): Promise<void> {
    const all = await this.getSavedRoadmaps();
    const updated = [roadmap, ...all.filter((r) => r.id !== roadmap.id)];
    await AsyncStorage.setItem("@courseadvisor_saved_roadmaps", JSON.stringify(updated));

    const db = await getDatabase();
    if (!db) return;

    try {
      const stressScore = roadmap.terms[0]?.stressScore ?? 0;
      const stressCategory = roadmap.terms[0]?.stressCategory ?? "Balanced";

      await db.runAsync(
        `INSERT OR REPLACE INTO schedules (
          id, name, standing_year, standing_semester, plan_json, stress_score, stress_category, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        roadmap.id,
        roadmap.name,
        roadmap.standing.year,
        roadmap.standing.semester,
        JSON.stringify(roadmap.terms),
        stressScore,
        stressCategory,
        roadmap.createdAt,
        roadmap.updatedAt
      );
    } catch (err) {
      console.warn("Failed to save schedule to SQLite:", err);
    }
  },

  async deleteRoadmap(id: string): Promise<void> {
    const all = await this.getSavedRoadmaps();
    const filtered = all.filter((r) => r.id !== id);
    await AsyncStorage.setItem("@courseadvisor_saved_roadmaps", JSON.stringify(filtered));

    const db = await getDatabase();
    if (!db) return;

    try {
      await db.runAsync("DELETE FROM schedules WHERE id = ?;", id);
    } catch (err) {
      console.warn("Failed to delete schedule in SQLite:", err);
    }
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([
      "@courseadvisor_profile",
      "@courseadvisor_completed",
      "@courseadvisor_standing",
      "@courseadvisor_confidence",
      "@courseadvisor_saved_roadmaps",
      "@courseadvisor_onboarded",
    ]);

    const db = await getDatabase();
    if (!db) return;

    try {
      await db.runAsync("DELETE FROM user_progress;");
      await db.runAsync("DELETE FROM schedules;");
      await db.runAsync("DELETE FROM user_profile;");
    } catch (err) {
      console.warn("Failed to clear SQLite data:", err);
    }
  },
};
