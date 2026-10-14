import { Pressable, StyleSheet, Text, View } from "react-native";
import { Course } from "../data/curriculum";
import { statusFor } from "../data/status";
import { colors, fonts, radius } from "../theme";
import StatusPill, { statusStyle } from "./StatusPill";

export default function CourseRow({
  course,
  completed,
  recommended = false,
  onPress,
}: {
  course: Course;
  completed: Set<string>;
  recommended?: boolean;
  onPress?: () => void;
}) {
  const status = statusFor(course, completed, recommended);
  const badge = statusStyle[status];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
        <Text style={[styles.badgeText, { color: badge.fg }]}>
          {course.code.split(" ")[0]}
        </Text>
      </View>

      <View style={styles.main}>
        <Text style={styles.code}>{course.code}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {course.title}
        </Text>
        <Text style={styles.prereq}>
          {course.prerequisites.length
            ? `Prerequisite: ${course.prerequisites.join(" + ")}`
            : "Prerequisite: None"}
        </Text>
      </View>

      <View style={styles.side}>
        <Text style={styles.units}>
          {course.unitLabel ?? course.units}
          <Text style={styles.unitsLabel}> units</Text>
        </Text>
        <StatusPill value={status} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontFamily: fonts.bold, fontSize: 11 },
  main: { flex: 1, gap: 2 },
  code: { fontFamily: fonts.bold, fontSize: 11, color: colors.primary },
  title: { fontFamily: fonts.bold, fontSize: 14, color: colors.ink },
  prereq: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
  side: { alignItems: "flex-end", gap: 6 },
  units: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  unitsLabel: { fontFamily: fonts.regular, fontSize: 10, color: colors.muted },
});