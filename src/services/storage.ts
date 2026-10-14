import AsyncStorage from "@react-native-async-storage/async-storage";

export type StudentProfile = {
  name: string;
  studentId: string;
  degreeProgram: string;
  institution: string;
  catalogYear: string;
};

export type AcademicStanding = {
  year: 1 | 2 | 3 | 4;
  semester: "First Semester" | "Second Semester" | "Summer";
};

export type DomainConfidence = {
  foundations: number;   // 1 - 10
  numeracy: number;      // 1 - 10
  literacy: number;      // 1 - 10
  professional: number;  // 1 - 10
};

export type SavedRoadmap = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  standing: AcademicStanding;
  terms: {
    termId: string;
    label: string;
    year: number;
    semester: string;
    courses: {
      code: string;
      title: string;
      units: number;
      prerequisites: string[];
      rationale: string;
    }[];
    totalUnits: number;
    stressCategory: string;
    stressScore: number;
  }[];
};

const KEYS = {
  PROFILE: "@courseadvisor_profile",
  COMPLETED: "@courseadvisor_completed",
  STANDING: "@courseadvisor_standing",
  CONFIDENCE: "@courseadvisor_confidence",
  SAVED_ROADMAPS: "@courseadvisor_saved_roadmaps",
  ONBOARDED: "@courseadvisor_onboarded",
};

export const defaultProfile: StudentProfile = {
  name: "Vanisa Lungay",
  studentId: "1021322",
  degreeProgram: "Bachelor of Elementary Education",
  institution: "Mindanao State University at Naawan",
  catalogYear: "A.Y. 2025–2026",
};

export const defaultStanding: AcademicStanding = {
  year: 1,
  semester: "Second Semester",
};

export const defaultConfidence: DomainConfidence = {
  foundations: 7,
  numeracy: 6,
  literacy: 8,
  professional: 7,
};

export const storage = {
  async getProfile(): Promise<StudentProfile> {
    try {
      const data = await AsyncStorage.getItem(KEYS.PROFILE);
      return data ? JSON.parse(data) : defaultProfile;
    } catch {
      return defaultProfile;
    }
  },

  async setProfile(profile: StudentProfile): Promise<void> {
    await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  },

  async getStanding(): Promise<AcademicStanding> {
    try {
      const data = await AsyncStorage.getItem(KEYS.STANDING);
      return data ? JSON.parse(data) : defaultStanding;
    } catch {
      return defaultStanding;
    }
  },

  async setStanding(standing: AcademicStanding): Promise<void> {
    await AsyncStorage.setItem(KEYS.STANDING, JSON.stringify(standing));
  },

  async getCompleted(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.COMPLETED);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async setCompleted(completedCodes: string[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.COMPLETED, JSON.stringify(completedCodes));
  },

  async getConfidence(): Promise<DomainConfidence> {
    try {
      const data = await AsyncStorage.getItem(KEYS.CONFIDENCE);
      return data ? JSON.parse(data) : defaultConfidence;
    } catch {
      return defaultConfidence;
    }
  },

  async setConfidence(confidence: DomainConfidence): Promise<void> {
    await AsyncStorage.setItem(KEYS.CONFIDENCE, JSON.stringify(confidence));
  },

  async getSavedRoadmaps(): Promise<SavedRoadmap[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SAVED_ROADMAPS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async setSavedRoadmaps(roadmaps: SavedRoadmap[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.SAVED_ROADMAPS, JSON.stringify(roadmaps));
  },

  async getOnboarded(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(KEYS.ONBOARDED);
      return val === "true";
    } catch {
      return false;
    }
  },

  async setOnboarded(onboarded: boolean): Promise<void> {
    await AsyncStorage.setItem(KEYS.ONBOARDED, onboarded ? "true" : "false");
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  },
};
