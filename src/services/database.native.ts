/**
 * CourseAdvisor: Local Relational Database Service (Native iOS & Android SQLite + CTEs)
 * Implements Section 4 (Data Modeling & Storage Strategy) and Section 7 (Offline-First Integrity):
 * - Relational Schema: Courses, Prerequisites, User_Progress, Schedules, User_Profile, Students
 * - Recursive Common Table Expressions (CTEs) for prerequisite chain resolution
 * - 100% Offline, device-local persistence (no cloud dependency)
 * - Multi-student authentication and isolated per-student data records
 */

import * as SQLite from "expo-sqlite";
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

const DB_NAME = "courseadvisor.db";
const ACTIVE_STUDENT_KEY = "@courseadvisor_active_student_id";
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

        CREATE TABLE IF NOT EXISTS students (
          student_id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          degree_program TEXT NOT NULL DEFAULT 'Bachelor of Elementary Education',
          institution TEXT NOT NULL DEFAULT 'Mindanao State University at Naawan',
          catalog_year TEXT NOT NULL DEFAULT 'A.Y. 2025–2026',
          standing_year INTEGER NOT NULL DEFAULT 1,
          standing_semester TEXT NOT NULL DEFAULT 'Second Semester',
          onboarded INTEGER NOT NULL DEFAULT 0,
          confidence_foundations REAL DEFAULT 7.0,
          confidence_numeracy REAL DEFAULT 6.0,
          confidence_literacy REAL DEFAULT 8.0,
          confidence_professional REAL DEFAULT 7.0,
          completed_courses_json TEXT DEFAULT '[]',
          saved_roadmaps_json TEXT DEFAULT '[]',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_prereq_course ON prerequisites(course_id);
        CREATE INDEX IF NOT EXISTS idx_prereq_parent ON prerequisites(prerequisite_course_id);
        CREATE INDEX IF NOT EXISTS idx_progress_completed ON user_progress(is_completed);
      `);

      await seedCurriculumIfEmpty(db);
      await migrateLegacyStudentIfEmpty(db);

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

async function migrateLegacyStudentIfEmpty(db: SQLite.SQLiteDatabase) {
  try {
    const studentCount = await db.getFirstAsync<{ count: number }>(
      "SELECT count(*) as count FROM students;"
    );
    if (studentCount && studentCount.count > 0) return;

    // Check if legacy user_profile exists
    const legacy = await db.getFirstAsync<any>(
      "SELECT * FROM user_profile WHERE id = 1;"
    );
    if (!legacy || !legacy.student_id) return;

    // Get completed courses
    const compRows = await db.getAllAsync<{ course_id: string }>(
      "SELECT course_id FROM user_progress WHERE is_completed = 1;"
    );
    const compCodes = compRows ? compRows.map((r) => r.course_id) : [];

    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT OR IGNORE INTO students (
        student_id, name, degree_program, institution, catalog_year,
        standing_year, standing_semester, onboarded,
        confidence_foundations, confidence_numeracy, confidence_literacy, confidence_professional,
        completed_courses_json, saved_roadmaps_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      legacy.student_id,
      legacy.name,
      legacy.degree_program || "Bachelor of Elementary Education",
      legacy.institution || "Mindanao State University at Naawan",
      legacy.catalog_year || "A.Y. 2025–2026",
      legacy.standing_year || 1,
      legacy.standing_semester || "Second Semester",
      legacy.onboarded || 0,
      legacy.confidence_foundations ?? 7,
      legacy.confidence_numeracy ?? 6,
      legacy.confidence_literacy ?? 8,
      legacy.confidence_professional ?? 7,
      JSON.stringify(compCodes),
      "[]",
      now,
      now
    );
  } catch {
    // Legacy migration ignored
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

function rowToStudentRecord(row: any): StudentRecord {
  let completed: string[] = [];
  try {
    completed = row.completed_courses_json ? JSON.parse(row.completed_courses_json) : [];
  } catch {
    completed = [];
  }

  let savedRoadmaps: SavedRoadmap[] = [];
  try {
    savedRoadmaps = row.saved_roadmaps_json ? JSON.parse(row.saved_roadmaps_json) : [];
  } catch {
    savedRoadmaps = [];
  }

  return {
    studentId: row.student_id,
    name: row.name,
    degreeProgram: row.degree_program || "Bachelor of Elementary Education",
    institution: row.institution || "Mindanao State University at Naawan",
    catalogYear: row.catalog_year || "A.Y. 2025–2026",
    standing: {
      year: (row.standing_year || 1) as 1 | 2 | 3 | 4,
      semester: (row.standing_semester || "Second Semester") as AcademicStanding["semester"],
    },
    completed,
    confidence: {
      foundations: row.confidence_foundations ?? 7,
      numeracy: row.confidence_numeracy ?? 6,
      literacy: row.confidence_literacy ?? 8,
      professional: row.confidence_professional ?? 7,
    },
    onboarded: Boolean(row.onboarded),
    savedRoadmaps,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export const localDatabase = {
  async init(): Promise<boolean> {
    const db = await getDatabase();
    return db !== null;
  },

  async getActiveStudentId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(ACTIVE_STUDENT_KEY);
    } catch {
      return null;
    }
  },

  async setActiveStudentId(studentId: string | null): Promise<void> {
    if (studentId) {
      await AsyncStorage.setItem(ACTIVE_STUDENT_KEY, studentId);
      // Sync user_progress table for CTEs
      const student = await this.findStudent(studentId);
      if (student) {
        await this.syncUserProgressForStudent(student.completed);
      }
    } else {
      await AsyncStorage.removeItem(ACTIVE_STUDENT_KEY);
    }
  },

  async getAllStudents(): Promise<StudentRecord[]> {
    const db = await getDatabase();
    if (!db) return [];

    try {
      const rows = await db.getAllAsync<any>("SELECT * FROM students ORDER BY updated_at DESC;");
      return rows ? rows.map(rowToStudentRecord) : [];
    } catch {
      return [];
    }
  },

  async findStudent(studentId: string): Promise<StudentRecord | null> {
    const db = await getDatabase();
    if (!db) return null;

    try {
      const row = await db.getFirstAsync<any>(
        "SELECT * FROM students WHERE lower(trim(student_id)) = lower(trim(?));",
        studentId
      );
      return row ? rowToStudentRecord(row) : null;
    } catch {
      return null;
    }
  },

  async findStudentByNameAndId(
    name: string,
    studentId: string
  ): Promise<StudentRecord | null> {
    const db = await getDatabase();
    if (!db) return null;

    try {
      const row = await db.getFirstAsync<any>(
        "SELECT * FROM students WHERE lower(trim(student_id)) = lower(trim(?)) AND lower(trim(name)) = lower(trim(?));",
        studentId,
        name
      );
      return row ? rowToStudentRecord(row) : null;
    } catch {
      return null;
    }
  },

  async createStudent(name: string, studentId: string): Promise<StudentRecord> {
    const cleanId = studentId.trim();
    const cleanName = name.trim();
    const now = new Date().toISOString();

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
      createdAt: now,
      updatedAt: now,
    };

    const db = await getDatabase();
    if (db) {
      await db.runAsync(
        `INSERT INTO students (
          student_id, name, degree_program, institution, catalog_year,
          standing_year, standing_semester, onboarded,
          confidence_foundations, confidence_numeracy, confidence_literacy, confidence_professional,
          completed_courses_json, saved_roadmaps_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        cleanId,
        cleanName,
        newStudent.degreeProgram,
        newStudent.institution,
        newStudent.catalogYear,
        newStudent.standing.year,
        newStudent.standing.semester,
        0,
        newStudent.confidence.foundations,
        newStudent.confidence.numeracy,
        newStudent.confidence.literacy,
        newStudent.confidence.professional,
        JSON.stringify(newStudent.completed),
        "[]",
        now,
        now
      );
    }

    await this.setActiveStudentId(cleanId);
    return newStudent;
  },

  async saveStudentRecord(record: StudentRecord): Promise<void> {
    const db = await getDatabase();
    if (!db) return;

    const now = new Date().toISOString();
    try {
      await db.runAsync(
        `INSERT INTO students (
          student_id, name, degree_program, institution, catalog_year,
          standing_year, standing_semester, onboarded,
          confidence_foundations, confidence_numeracy, confidence_literacy, confidence_professional,
          completed_courses_json, saved_roadmaps_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(student_id) DO UPDATE SET
          name = excluded.name,
          degree_program = excluded.degree_program,
          institution = excluded.institution,
          catalog_year = excluded.catalog_year,
          standing_year = excluded.standing_year,
          standing_semester = excluded.standing_semester,
          onboarded = excluded.onboarded,
          confidence_foundations = excluded.confidence_foundations,
          confidence_numeracy = excluded.confidence_numeracy,
          confidence_literacy = excluded.confidence_literacy,
          confidence_professional = excluded.confidence_professional,
          completed_courses_json = excluded.completed_courses_json,
          saved_roadmaps_json = excluded.saved_roadmaps_json,
          updated_at = excluded.updated_at;`,
        record.studentId,
        record.name,
        record.degreeProgram,
        record.institution,
        record.catalogYear,
        record.standing.year,
        record.standing.semester,
        record.onboarded ? 1 : 0,
        record.confidence.foundations,
        record.confidence.numeracy,
        record.confidence.literacy,
        record.confidence.professional,
        JSON.stringify(record.completed),
        JSON.stringify(record.savedRoadmaps || []),
        record.createdAt || now,
        now
      );
    } catch (err) {
      console.warn("Failed to save student record to SQLite:", err);
    }
  },

  async updateStudent(
    studentId: string,
    partial: Partial<StudentRecord>
  ): Promise<StudentRecord | null> {
    const current = await this.findStudent(studentId);
    if (!current) return null;

    const updated: StudentRecord = {
      ...current,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    await this.saveStudentRecord(updated);
    return updated;
  },

  async syncUserProgressForStudent(completedCodes: string[]): Promise<void> {
    const db = await getDatabase();
    if (!db) return;

    try {
      const now = new Date().toISOString();
      await db.runAsync("UPDATE user_progress SET is_completed = 0, status = 'not_taken';");

      for (const code of completedCodes) {
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
      console.warn("Failed to sync user_progress table:", err);
    }
  },

  // Active student accessors
  async getActiveStudent(): Promise<StudentRecord | null> {
    const activeId = await this.getActiveStudentId();
    if (!activeId) return null;
    return await this.findStudent(activeId);
  },

  async getCompletedCourses(): Promise<string[]> {
    const active = await this.getActiveStudent();
    if (active) return active.completed;

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
      return [];
    } catch {
      return [];
    }
  },

  async setCompletedCourses(codes: string[]): Promise<void> {
    const activeId = await this.getActiveStudentId();
    if (activeId) {
      await this.updateStudent(activeId, { completed: codes });
    }
    await this.syncUserProgressForStudent(codes);
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

    const db = await getDatabase();
    if (!db) return defaultProfile;

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
      return defaultProfile;
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
    const active = await this.getActiveStudent();
    if (active) return active.standing;

    const db = await getDatabase();
    if (!db) return defaultStanding;

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
      return defaultStanding;
    } catch {
      return defaultStanding;
    }
  },

  async setStanding(s: AcademicStanding): Promise<void> {
    const activeId = await this.getActiveStudentId();
    if (activeId) {
      await this.updateStudent(activeId, { standing: s });
    }

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
    const active = await this.getActiveStudent();
    if (active) return active.confidence;

    const db = await getDatabase();
    if (!db) return defaultConfidence;

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
      return defaultConfidence;
    } catch {
      return defaultConfidence;
    }
  },

  async setConfidence(c: DomainConfidence): Promise<void> {
    const activeId = await this.getActiveStudentId();
    if (activeId) {
      await this.updateStudent(activeId, { confidence: c });
    }

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

  async getOnboarded(): Promise<boolean> {
    const active = await this.getActiveStudent();
    if (active) return active.onboarded;

    const db = await getDatabase();
    if (!db) return false;

    try {
      const row = await db.getFirstAsync<{ onboarded: number }>(
        "SELECT onboarded FROM user_profile WHERE id = 1;"
      );
      return row ? Boolean(row.onboarded) : false;
    } catch {
      return false;
    }
  },

  async setOnboarded(onboarded: boolean): Promise<void> {
    const activeId = await this.getActiveStudentId();
    if (activeId) {
      await this.updateStudent(activeId, { onboarded });
    }

    const db = await getDatabase();
    if (!db) return;

    try {
      await db.runAsync(
        "UPDATE user_profile SET onboarded = ? WHERE id = 1;",
        onboarded ? 1 : 0
      );
    } catch {
      // Ignored
    }
  },

  async getSavedRoadmaps(): Promise<SavedRoadmap[]> {
    const active = await this.getActiveStudent();
    if (active) return active.savedRoadmaps || [];

    const db = await getDatabase();
    if (!db) return [];

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
      return [];
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
    const activeId = await this.getActiveStudentId();
    if (activeId) {
      await this.updateStudent(activeId, { savedRoadmaps: filtered });
    }

    const db = await getDatabase();
    if (!db) return;

    try {
      await db.runAsync("DELETE FROM schedules WHERE id = ?;", id);
    } catch (err) {
      console.warn("Failed to delete schedule in SQLite:", err);
    }
  },

  async clearAll(): Promise<void> {
    await this.setActiveStudentId(null);
  },
};
