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
  foundations: number; // 1 - 10
  numeracy: number; // 1 - 10
  literacy: number; // 1 - 10
  professional: number; // 1 - 10
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

export type StudentRecord = {
  studentId: string;
  name: string;
  degreeProgram: string;
  institution: string;
  catalogYear: string;
  standing: AcademicStanding;
  completed: string[];
  confidence: DomainConfidence;
  onboarded: boolean;
  savedRoadmaps: SavedRoadmap[];
  createdAt: string;
  updatedAt: string;
};

export const defaultProfile: StudentProfile = {
  name: "Student Name",
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
