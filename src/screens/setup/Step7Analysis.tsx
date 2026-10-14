import { StyleSheet, Text, View } from "react-native";
import Icon from "../../components/Icon";
import { roadmapGenerator } from "../../services/roadmapGenerator";
import { DomainConfidence } from "../../services/storage";
import { colors, fonts, radius } from "../../theme";
import { s } from "./shared";

export default function Step7Analysis({
  completed,
  year,
  semester,
  confidence,
}: {
  completed: Set<string>;
  year: number;
  semester: string;
  confidence: DomainConfidence;
}) {
  const result = roadmapGenerator.generate(
    completed,
    { year, semester },
    confidence,
  );

  const totalTerms = result.roadmap.length;
  const nextTerm = result.roadmap[0];

  return (
    <View style={s.content}>
      <Text style={s.kicker}>ANALYSIS & ROADMAP GENERATION</Text>
      <Text style={s.h1}>Your personalized plan is ready</Text>
      <Text style={s.lead}>
        Using backward chaining, prerequisite verification, and Mamdani fuzzy
        workload modeling, we have drafted your remaining BEEd terms.
      </Text>

      {/* Plan Summary Highlights */}
      <View style={styles.metricsCard}>
        <View style={styles.metricItem}>
          <Text style={styles.metricNum}>{totalTerms}</Text>
          <Text style={styles.metricLabel}>TERMS TO GRADUATION</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricNum}>{167 - result.remainingUnits}</Text>
          <Text style={styles.metricLabel}>UNITS SATISFIED</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricNum}>{result.remainingUnits}</Text>
          <Text style={styles.metricLabel}>REMAINING UNITS</Text>
        </View>
      </View>

      {/* Immediate Next Semester Preview */}
      {nextTerm && (
        <View style={[s.card, styles.nextTermCard]}>
          <View style={styles.nextTermHead}>
            <View>
              <Text style={styles.kickerSmall}>UPCOMING ENROLLMENT</Text>
              <Text style={styles.nextTermTitle}>{nextTerm.label}</Text>
            </View>
            <View style={styles.unitBadge}>
              <Text style={styles.unitBadgeText}>{nextTerm.totalUnits} Units</Text>
            </View>
          </View>

          {/* Fuzzy Stress Meter for next term */}
          <View style={styles.stressBar}>
            <View style={styles.stressInfo}>
              <Text style={styles.stressTitle}>Predicted Semester Stress</Text>
              <Text style={styles.stressBadge}>
                {nextTerm.fuzzyAnalysis.stressScore}% · {nextTerm.fuzzyAnalysis.stressLevel}
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${Math.min(100, nextTerm.fuzzyAnalysis.stressScore)}%`,
                    backgroundColor:
                      nextTerm.fuzzyAnalysis.stressLevel === "Low"
                        ? "#28a745"
                        : nextTerm.fuzzyAnalysis.stressLevel === "Moderate"
                        ? colors.accent
                        : "#dc3545",
                  },
                ]}
              />
            </View>
          </View>

          {/* Recommended Courses Snippet */}
          <Text style={s.fieldLabel}>RECOMMENDED SUBJECTS FOR THIS TERM ({nextTerm.courses.length})</Text>
          <View style={styles.courseMiniList}>
            {nextTerm.courses.slice(0, 4).map((c) => (
              <View key={c.code} style={styles.miniCourseRow}>
                <View style={styles.miniCourseBadge}>
                  <Text style={styles.miniCourseCode}>{c.code}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.miniCourseTitle} numberOfLines={1}>
                    {c.title}
                  </Text>
                  <Text style={styles.miniCourseRationale} numberOfLines={1}>
                    {c.rationale}
                  </Text>
                </View>
                <Text style={styles.miniUnits}>{c.units}u</Text>
              </View>
            ))}
            {nextTerm.courses.length > 4 && (
              <Text style={styles.moreCoursesText}>
                + {nextTerm.courses.length - 4} more subjects scheduled
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Transparent System Notice */}
      <View style={styles.transparentBox}>
        <Icon name="compass" size={18} color={colors.primary} />
        <Text style={styles.transparentText}>
          Every course recommendation is accompanied by an audit trail explaining
          its prerequisite satisfaction and prospectus placement.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  metricsCard: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: 16,
    alignItems: "center",
    justifyContent: "space-between",
  },
  metricItem: { flex: 1, alignItems: "center" },
  metricNum: { fontFamily: fonts.bold, fontSize: 18, color: colors.white },
  metricLabel: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: colors.mint,
    marginTop: 4,
    textAlign: "center",
  },
  metricDivider: { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.2)" },
  nextTermCard: {
    gap: 12,
  },
  nextTermHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  kickerSmall: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.primary,
  },
  nextTermTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
    marginTop: 2,
  },
  unitBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.mint,
  },
  unitBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary,
  },
  stressBar: {
    backgroundColor: "#f4f7fc",
    borderRadius: radius.sm,
    padding: 10,
    gap: 6,
  },
  stressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stressTitle: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.deep,
  },
  stressBadge: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primary,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.line,
    overflow: "hidden",
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
  courseMiniList: {
    gap: 8,
  },
  miniCourseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  miniCourseBadge: {
    backgroundColor: colors.mint,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniCourseCode: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primary,
  },
  miniCourseTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.ink,
  },
  miniCourseRationale: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.muted,
  },
  miniUnits: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.deep,
  },
  moreCoursesText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.primary,
    textAlign: "center",
    paddingTop: 4,
  },
  transparentBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.mint,
    padding: 14,
    borderRadius: radius.md,
  },
  transparentText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.deep,
  },
});
