/**
 * CourseAdvisor: Database Service Entry
 * Provides platform-independent contracts for TypeScript and bundlers:
 * - Native (iOS/Android): Handled by database.native.ts (expo-sqlite + CTEs)
 * - Web: Handled by database.web.ts (AsyncStorage + CTE algorithms)
 */

export * from "./database.web";
