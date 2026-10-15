export type Course = {
  code: string;
  title: string;
  units: number;
  unitLabel?: string;
  prerequisites: string[];
  counted?: boolean;
  year?: number;
  termId?: string;
  termLabel?: string;
  difficulty?: number; // Historical difficulty coefficient (1 - 10)
};

export type Term = {
  id: string;
  year: 1 | 2 | 3 | 4;
  semester: "First Semester" | "Second Semester" | "Summer";
  label: string;
  totalUnits: number;
  courses: Course[];
};

export const curriculum: Term[] = [
  {
    id: "y1s1", year: 1, semester: "First Semester", label: "First Year, First Semester", totalUnits: 23,
    courses: [
      { code: "GEC 101", title: "Understanding the Self", units: 3, prerequisites: [] },
      { code: "GEC 105", title: "Readings in Philippine History", units: 3, prerequisites: [] },
      { code: "GEC 102", title: "Purposive Communication", units: 3, prerequisites: [] },
      { code: "GEC 103", title: "The Contemporary World", units: 3, prerequisites: [] },
      { code: "CPE 100", title: "The Child and Adolescent Learners and Learning Principles", units: 3, prerequisites: [] },
      { code: "CPE 101", title: "The Teaching Profession", units: 3, prerequisites: [] },
      { code: "GEC 120", title: "Wika at Kultura sa Mapayapang Lipunan", units: 3, prerequisites: [] },
      { code: "PED 011", title: "PATHFit 1: Movement Competency Training", units: 2, prerequisites: [] },
      { code: "NST 001", title: "National Service Training Program 1", units: 3, unitLabel: "(3)", prerequisites: [], counted: false },
    ],
  },
  {
    id: "y1s2", year: 1, semester: "Second Semester", label: "First Year, Second Semester", totalUnits: 23,
    courses: [
      { code: "GEC 110", title: "History of Muslim Filipinos and IPs of MINSUPALA", units: 3, prerequisites: [] },
      { code: "CPE 102", title: "The Teacher and the Community, School Culture and Organizational Leadership", units: 3, prerequisites: ["CPE 101"] },
      { code: "CPE 104", title: "Facilitating Learner-Centered Teaching", units: 3, prerequisites: ["CPE 100"] },
      { code: "GEC 106", title: "Art Appreciation", units: 3, prerequisites: [] },
      { code: "GED 111", title: "Edukasyong Pantahanan at Pangkabuhayan", units: 3, prerequisites: [] },
      { code: "GEC 109", title: "Life and Works of Rizal", units: 3, prerequisites: [] },
      { code: "GED 117", title: "Good Manners and Right Conduct (Edukasyon sa Pagpapakatao)", units: 3, prerequisites: [] },
      { code: "PED 012", title: "PATHFit 2: Exercise-based Fitness Activities", units: 2, prerequisites: ["PED 011"] },
      { code: "NST 002", title: "National Service Training Program 2", units: 3, unitLabel: "(3)", prerequisites: ["NST 001"], counted: false },
    ],
  },
  {
    id: "y2s1", year: 2, semester: "First Semester", label: "Second Year, First Semester", totalUnits: 23,
    courses: [
      { code: "GEC 107", title: "Ethics", units: 3, prerequisites: [] },
      { code: "GEC 108", title: "Science, Technology and Society", units: 3, prerequisites: [] },
      { code: "GEC 104", title: "Mathematics in the Modern World", units: 3, prerequisites: [] },
      { code: "CPE 105", title: "Assessment in Learning 1", units: 3, prerequisites: ["CPE 100"] },
      { code: "CPE 108", title: "The Teacher and the School Curriculum", units: 3, prerequisites: ["CPE 101", "CPE 102"] },
      { code: "GED 103", title: "Teaching Social Studies in the Elementary Grades (Philippine History and Government)", units: 3, prerequisites: ["GEC 110"] },
      { code: "GEC 130", title: "Ekokritisismo at Pagpapahalaga sa Kalikasan", units: 3, prerequisites: [] },
      { code: "PED 013", title: "PATHFit 3: Choice of Individual – Dual Sports, Recreational Games, Traditional Games, Dance, Martial Arts, and Group Exercise", units: 2, prerequisites: ["PED 012"] },
    ],
  },
  {
    id: "y2s2", year: 2, semester: "Second Semester", label: "Second Year, Second Semester", totalUnits: 23,
    courses: [
      { code: "GED 101", title: "Teaching Science in the Elementary Grades (Biology and Chemistry)", units: 3, prerequisites: [] },
      { code: "FIL 103", title: "Inobasyon sa Wikang Filipino", units: 3, prerequisites: [] },
      { code: "CPE 106", title: "Assessment in Learning 2", units: 3, prerequisites: ["CPE 105"] },
      { code: "CPE 109", title: "Building and Enhancing New Literacies Across the Curriculum", units: 3, prerequisites: ["CPE 101", "CPE 102"] },
      { code: "CPE 110", title: "School-Community Linkages", units: 3, prerequisites: ["CPE 101", "CPE 102"] },
      { code: "GED 109", title: "Teaching Math in the Primary Grades", units: 3, prerequisites: [] },
      { code: "GED 115", title: "Teaching Beginning Reading", units: 3, prerequisites: [] },
      { code: "PED 014", title: "PATHFit 4: Choice of Team Sports, Outdoor and Adventure Activities", units: 2, prerequisites: ["PED 012"] },
    ],
  },
  {
    id: "y2su", year: 2, semester: "Summer", label: "Second Year, Summer", totalUnits: 6,
    courses: [
      { code: "GED 106", title: "Pagtuturo and Filipino sa Elementary (I) - Estruktura at Gamit ng Wikang Filipino", units: 3, prerequisites: [] },
      { code: "CPE 107", title: "Technology for Teaching and Learning 1", units: 3, prerequisites: ["CPE 100"] },
    ],
  },
  {
    id: "y3s1", year: 3, semester: "First Semester", label: "Third Year, First Semester", totalUnits: 24,
    courses: [
      { code: "GED 105", title: "Technology for Teaching and Elementary Grades", units: 3, prerequisites: ["CPE 107"] },
      { code: "GED 104", title: "Teaching Social Studies in the Elementary Grades (Culture and Geography)", units: 3, prerequisites: ["GED 103"] },
      { code: "GED 107", title: "Pagtuturo and Filipino sa Elementarya (II) - Panitikan ng Pilipinas", units: 3, prerequisites: ["GED 106"] },
      { code: "GED 108", title: "Teaching PE and Health in the Elementary Grades", units: 3, prerequisites: [] },
      { code: "GED 110", title: "Teaching Math in the Intermediate Grades", units: 3, prerequisites: ["GED 109"] },
      { code: "GED 113", title: "Teaching English in the Elementary Grades (Language Arts)", units: 3, prerequisites: [] },
      { code: "GED 116", title: "Content and Pedagogy for the Mother-Tongue", units: 3, prerequisites: [] },
      { code: "GED 119", title: "Teaching Multi-Grade Classes", units: 3, prerequisites: [] },
    ],
  },
  {
    id: "y3s2", year: 3, semester: "Second Semester", label: "Third Year, Second Semester", totalUnits: 24,
    courses: [
      { code: "CPE 103", title: "Foundation of Inclusive and Special Education", units: 3, prerequisites: ["CPE 100"] },
      { code: "GED 114", title: "Teaching English in the Elementary Grades Through Literature", units: 3, prerequisites: ["GED 113"] },
      { code: "GED 118", title: "Edukasyong Pantahanan at Pangkabuhayan with Entrepreneurship", units: 3, prerequisites: ["GED 111"] },
      { code: "GED 120", title: "Teaching Music in the Elementary Grades", units: 3, prerequisites: [] },
      { code: "GED 102", title: "Teaching Science in the Elementary Grades (Physics, Earth and Space Science)", units: 3, prerequisites: ["GED 101"] },
      { code: "GED 112", title: "Teaching Arts in the Elementary Grades", units: 3, prerequisites: [] },
      { code: "GED 198", title: "Research in Education", units: 3, prerequisites: ["CPE 106"] },
      { code: "FPE 101", title: "Fundamentals of Peace Education", units: 3, prerequisites: [] },
    ],
  },
  {
    id: "y3su", year: 3, semester: "Summer", label: "Third Year, Summer", totalUnits: 6,
    courses: [
      { code: "GEC 123", title: "Gender and Society", units: 3, prerequisites: [] },
      { code: "HAL 101", title: "Fundamentals of Halal", units: 3, prerequisites: [] },
    ],
  },
  {
    id: "y4s1", year: 4, semester: "First Semester", label: "Fourth Year, First Semester", totalUnits: 9,
    courses: [
      { code: "ELC 101", title: "Field Study 1: Observation of Teaching-Learning in Actual School Environment", units: 3, prerequisites: ["CPE 103", "CPE 104", "CPE 106", "CPE 107"] },
      { code: "ELC 102", title: "Field Study 2: Participating and Teaching Assistantship", units: 3, prerequisites: ["CPE 103", "CPE 104", "CPE 106", "CPE 107"] },
      { code: "GED 199", title: "Undergraduate Thesis", units: 3, prerequisites: ["GED 198"] },
    ],
  },
  {
    id: "y4s2", year: 4, semester: "Second Semester", label: "Fourth Year, Second Semester", totalUnits: 6,
    courses: [
      { code: "ELC 197", title: "Teaching Internship", units: 6, prerequisites: ["ELC 101", "ELC 102"] },
    ],
  },
];

export const allCourses = curriculum.flatMap((term) =>
  term.courses.map((course) => ({ ...course, termId: term.id, termLabel: term.label, year: term.year })),
);

export const curriculumUnits = curriculum.reduce((sum, term) => sum + term.totalUnits, 0);

export const unlocksFor = (code: string) =>
  allCourses.filter((course) => course.prerequisites.includes(code)).map((course) => course.code);

export function getTermIndexForStanding(year: number, semester: string): number {
  const foundIndex = curriculum.findIndex(
    (t) => t.year === year && t.semester === semester,
  );
  if (foundIndex !== -1) return foundIndex;

  // Fallbacks for edge cases
  if (year === 1) return semester === "Summer" ? 2 : 0;
  if (year === 2) return semester === "Summer" ? 4 : 2;
  if (year === 3) return semester === "Summer" ? 7 : 5;
  if (year >= 4) return semester === "Summer" ? 10 : 8;
  return 0;
}

export function getPriorCourseCodesForStanding(
  year: number,
  semester: string,
): string[] {
  const targetIndex = getTermIndexForStanding(year, semester);
  const codes: string[] = [];
  for (let i = 0; i < targetIndex && i < curriculum.length; i++) {
    for (const course of curriculum[i].courses) {
      codes.push(course.code);
    }
  }
  return codes;
}

export function getTermIdForStanding(year: number, semester: string): string {
  const targetIndex = getTermIndexForStanding(year, semester);
  const safeIndex = Math.min(targetIndex, curriculum.length - 1);
  return curriculum[safeIndex]?.id ?? "y1s1";
}
