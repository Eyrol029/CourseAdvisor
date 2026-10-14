import { allCourses, Course, curriculum } from "./curriculum";

export type Status =
  | "Completed"
  | "Prerequisite Required"
  | "Recommended"
  | "Available"
  | "Locked";

export const firstTermCodes = new Set(
  curriculum[0].courses.map((course) => course.code),
);

export function statusFor(
  course: Course,
  completed: Set<string>,
  recommended = false,
): Status {
  if (completed.has(course.code)) return "Completed";
  if (course.prerequisites.some((code) => !completed.has(code)))
    return "Prerequisite Required";
  if (recommended) return "Recommended";
  const prospectusYear = allCourses.find((item) => item.code === course.code)?.year;
  if (course.prerequisites.length === 0 && prospectusYear && prospectusYear > 1)
    return "Locked";
  if (
    course.prerequisites.length === 0 ||
    course.prerequisites.every((code) => completed.has(code))
  )
    return "Available";
  return "Locked";
}
