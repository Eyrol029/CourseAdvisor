import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Icon from "../../components/Icon";
import { curriculum } from "../../data/curriculum";
import { colors, fonts, radius } from "../../theme";
import { s } from "./shared";

export default function Step4Completed({
  completed,
  onToggle,
  onBatchSelect,
  year,
  semester,
}: {
  completed: Set<string>;
  onToggle: (code: string) => void;
  onBatchSelect: (codes: string[], select: boolean) => void;
  year: number;
  semester: string;
}) {
  const [selectedTermId, setSelectedTermId] = useState<string>("y1s1");

  // Calculate completed units
  let completedUnits = 0;
  for (const term of curriculum) {
    for (const c of term.courses) {
      if (completed.has(c.code) && c.counted !== false) {
        completedUnits += c.units;
      }
    }
  }

  // Quick action: Complete all prior terms based on standing
  const markPriorCompleted = () => {
    const priorCodes: string[] = [];
    const termOrder = ["y1s1", "y1s2", "y2s1", "y2s2", "y2su", "y3s1", "y3s2", "y3su", "y4s1", "y4s2"];
    
    // Find index of current standing
    let targetIndex = 0;
    if (year === 1 && semester === "First Semester") targetIndex = 0;
    else if (year === 1 && semester === "Second Semester") targetIndex = 1;
    else if (year === 2 && semester === "First Semester") targetIndex = 2;
    else if (year === 2 && semester === "Second Semester") targetIndex = 3;
    else if (year === 2 && semester === "Summer") targetIndex = 4;
    else if (year === 3 && semester === "First Semester") targetIndex = 5;
    else if (year === 3 && semester === "Second Semester") targetIndex = 6;
    else if (year === 3 && semester === "Summer") targetIndex = 7;
    else if (year === 4 && semester === "First Semester") targetIndex = 8;
    else targetIndex = 9;

    for (let i = 0; i < targetIndex; i++) {
      const t = curriculum.find((x) => x.id === termOrder[i]);
      if (t) {
        for (const c of t.courses) {
          priorCodes.push(c.code);
        }
      }
    }

    onBatchSelect(priorCodes, true);
  };

  const currentTerm = curriculum.find((t) => t.id === selectedTermId) ?? curriculum[0];
  const termCompletedCount = currentTerm.courses.filter((c) => completed.has(c.code)).length;
  const isTermAllCompleted = termCompletedCount === currentTerm.courses.length;

  const toggleAllInTerm = () => {
    const codes = currentTerm.courses.map((c) => c.code);
    onBatchSelect(codes, !isTermAllCompleted);
  };

  return (
    <View style={s.content}>
      <Text style={s.kicker}>ACADEMIC HISTORY</Text>
      <Text style={s.h1}>Which courses have you completed?</Text>
      <Text style={s.lead}>
        Tap the courses you have passed. CourseAdvisor uses this to trace
        prerequisite unlocks and plan your upcoming semesters.
      </Text>

      {/* Progress Card */}
      <View style={styles.summaryCard}>
        <View style={styles.statCol}>
          <Text style={styles.statNum}>{completed.size}</Text>
          <Text style={styles.statLabel}>COURSES PASSED</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCol}>
          <Text style={styles.statNum}>{completedUnits} / 167</Text>
          <Text style={styles.statLabel}>UNITS EARNED</Text>
        </View>
      </View>

      {/* Quick Autofill Button */}
      <Pressable style={styles.quickFillBtn} onPress={markPriorCompleted}>
        <Icon name="spark" size={16} color={colors.primary} />
        <Text style={styles.quickFillText}>
          Auto-mark all subjects prior to Year {year} {semester}
        </Text>
      </Pressable>

      {/* Term Selector Pills */}
      <Text style={s.fieldLabel}>SELECT SEMESTER TO REVIEW</Text>
      <View style={styles.termScroll}>
        {curriculum.map((term) => {
          const isSelected = term.id === selectedTermId;
          const doneCount = term.courses.filter((c) => completed.has(c.code)).length;
          return (
            <Pressable
              key={term.id}
              style={[styles.termChip, isSelected && styles.termChipActive]}
              onPress={() => setSelectedTermId(term.id)}
            >
              <Text
                style={[
                  styles.termChipText,
                  isSelected && styles.termChipTextActive,
                ]}
              >
                Y{term.year} {term.semester === "Summer" ? "Sum" : term.semester.startsWith("First") ? "S1" : "S2"}
              </Text>
              <View
                style={[
                  styles.chipDot,
                  doneCount === term.courses.length && styles.chipDotDone,
                ]}
              >
                <Text
                  style={[
                    styles.chipDotText,
                    isSelected && { color: colors.white },
                  ]}
                >
                  {doneCount}/{term.courses.length}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Term Header & Select All */}
      <View style={styles.termHeader}>
        <View>
          <Text style={styles.termTitle}>{currentTerm.label}</Text>
          <Text style={styles.termSub}>{currentTerm.totalUnits} Units Total</Text>
        </View>
        <Pressable style={styles.batchBtn} onPress={toggleAllInTerm}>
          <Text style={styles.batchBtnText}>
            {isTermAllCompleted ? "Deselect All" : "Select All"}
          </Text>
        </Pressable>
      </View>

      {/* Course List */}
      <View style={styles.courseList}>
        {currentTerm.courses.map((course) => {
          const isDone = completed.has(course.code);
          return (
            <Pressable
              key={course.code}
              onPress={() => onToggle(course.code)}
              style={[styles.courseRow, isDone && styles.courseRowDone]}
            >
              <View style={[styles.checkbox, isDone && styles.checkboxDone]}>
                {isDone && <Icon name="check" size={14} color={colors.white} />}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.courseCode}>{course.code}</Text>
                <Text style={styles.courseTitle} numberOfLines={2}>
                  {course.title}
                </Text>
                {course.prerequisites.length > 0 && (
                  <Text style={styles.coursePrereq}>
                    Prereq: {course.prerequisites.join(", ")}
                  </Text>
                )}
              </View>

              <Text style={styles.courseUnits}>
                {course.unitLabel ?? course.units}u
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: 16,
    alignItems: "center",
    justifyContent: "space-around",
  },
  statCol: { alignItems: "center" },
  statNum: { fontFamily: fonts.bold, fontSize: 20, color: colors.white },
  statLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.mint,
    marginTop: 4,
  },
  statDivider: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.2)" },
  quickFillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.mint,
    padding: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  quickFillText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.deep,
    flex: 1,
  },
  termScroll: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  termChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  termChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  termChipText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.ink,
  },
  termChipTextActive: {
    color: colors.white,
  },
  chipDot: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    backgroundColor: colors.mint,
  },
  chipDotDone: {
    backgroundColor: colors.accent,
  },
  chipDotText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.deep,
  },
  termHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  termTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
  },
  termSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
  },
  batchBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.mint,
  },
  batchBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary,
  },
  courseList: {
    gap: 8,
    marginTop: 6,
  },
  courseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  courseRowDone: {
    backgroundColor: "#f4f7fc",
    borderColor: colors.accent,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  courseCode: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary,
  },
  courseTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.ink,
  },
  coursePrereq: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  courseUnits: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.deep,
  },
});
