import { localDatabase } from "./database";
import {
  AcademicStanding,
  DomainConfidence,
  SavedRoadmap,
  StudentProfile,
  StudentRecord,
} from "../types/storage";

export * from "../types/storage";

/**
 * Offline-first Storage Service.
 * Bridges device SQLite relational database with local storage cache,
 * ensuring 100% offline persistence, multi-student isolation, and instant UI reactivity.
 */
export const storage = {
  async init(): Promise<void> {
    await localDatabase.init();
  },

  async getActiveStudentId(): Promise<string | null> {
    return await localDatabase.getActiveStudentId();
  },

  async setActiveStudentId(id: string | null): Promise<void> {
    await localDatabase.setActiveStudentId(id);
  },

  async getAllStudents(): Promise<StudentRecord[]> {
    return await localDatabase.getAllStudents();
  },

  async findStudent(studentId: string): Promise<StudentRecord | null> {
    return await localDatabase.findStudent(studentId);
  },

  async findStudentByNameAndId(
    name: string,
    studentId: string
  ): Promise<StudentRecord | null> {
    return await localDatabase.findStudentByNameAndId(name, studentId);
  },

  async createStudent(name: string, studentId: string): Promise<StudentRecord> {
    return await localDatabase.createStudent(name, studentId);
  },

  async saveStudentRecord(record: StudentRecord): Promise<void> {
    await localDatabase.saveStudentRecord(record);
  },

  async updateStudent(
    studentId: string,
    partial: Partial<StudentRecord>
  ): Promise<StudentRecord | null> {
    return await localDatabase.updateStudent(studentId, partial);
  },

  async getProfile(): Promise<StudentProfile> {
    return await localDatabase.getProfile();
  },

  async setProfile(profile: StudentProfile): Promise<void> {
    await localDatabase.setProfile(profile);
  },

  async getStanding(): Promise<AcademicStanding> {
    return await localDatabase.getStanding();
  },

  async setStanding(standing: AcademicStanding): Promise<void> {
    await localDatabase.setStanding(standing);
  },

  async getCompleted(): Promise<string[]> {
    return await localDatabase.getCompletedCourses();
  },

  async setCompleted(completedCodes: string[]): Promise<void> {
    await localDatabase.setCompletedCourses(completedCodes);
  },

  async getConfidence(): Promise<DomainConfidence> {
    return await localDatabase.getConfidence();
  },

  async setConfidence(confidence: DomainConfidence): Promise<void> {
    await localDatabase.setConfidence(confidence);
  },

  async getSavedRoadmaps(): Promise<SavedRoadmap[]> {
    return await localDatabase.getSavedRoadmaps();
  },

  async setSavedRoadmaps(roadmaps: SavedRoadmap[]): Promise<void> {
    for (const r of roadmaps) {
      await localDatabase.saveRoadmap(r);
    }
  },

  async getOnboarded(): Promise<boolean> {
    return await localDatabase.getOnboarded();
  },

  async setOnboarded(onboarded: boolean): Promise<void> {
    await localDatabase.setOnboarded(onboarded);
  },

  async clearSession(): Promise<void> {
    await localDatabase.setActiveStudentId(null);
  },

  async clearAll(): Promise<void> {
    await localDatabase.clearAll();
  },
};
