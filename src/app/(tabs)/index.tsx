import { router } from "expo-router";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "../../components/Icon";
import { allCourses, curriculum } from "../../data/curriculum";
import Step5Prerequisites from "../../screens/setup/Step5Prerequisites";
import { fuzzySystem } from "../../services/fuzzyInference";
import { useAppState } from "../../state/AppState";
import { colors, fonts, radius } from "../../theme";

export default function HomeDashboard() {
  const { profile, standing, completed, confidence } = useAppState();
  const [showDagModal, setShowDagModal] = useState(false);

  // Compute academic metrics
  const totalCourses = allCourses.length;
  const completedCoursesCount = completed.size;

  let earnedUnits = 0;
  for (const term of curriculum) {
    for (const c of term.courses) {
      if (completed.has(c.code) && c.counted !== false) {
        earnedUnits += c.units;
      }
    }
  }

  const totalCurriculumUnits = 167;
  const remainingUnits = Math.max(0, totalCurriculumUnits - earnedUnits);
  const progressPercent = Math.min(
    100,
    Math.round((earnedUnits / totalCurriculumUnits) * 100),
  );

  // Compute fuzzy workload recommendation
  const avgConfidence =
    (confidence.foundations +
      confidence.numeracy +
      confidence.literacy +
      confidence.professional) /
    4;
  const fuzzyAnalysis = fuzzySystem.evaluate(avgConfidence, 6, 23);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header Profile Bar */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeKicker}>WELCOME BACK</Text>
            <Text style={styles.studentName}>{profile.name}</Text>
            <Text style={styles.studentMeta}>
              {profile.degreeProgram} · {standing.year === 1 ? "1st" : standing.year === 2 ? "2nd" : standing.year === 3 ? "3rd" : "4th"} Year, {standing.semester}
            </Text>
          </View>
        </View>

        {/* Primary Academic Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.cardKicker}>DEGREE PROGRESS</Text>
              <Text style={styles.cardTitle}>Bachelor of Elementary Education</Text>
            </View>
            <View style={styles.percentBadge}>
              <Text style={styles.percentText}>{progressPercent}%</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View
              style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
            />
          </View>

          {/* Units and Courses Breakdown */}
          <View style={styles.metricRow}>
            <View style={styles.metricCol}>
              <Text style={styles.metricNumber}>
                {earnedUnits}
                <Text style={styles.metricSub}> / 167</Text>
              </Text>
              <Text style={styles.metricLabel}>UNITS EARNED</Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricCol}>
              <Text style={styles.metricNumber}>{remainingUnits}</Text>
              <Text style={styles.metricLabel}>UNITS REMAINING</Text>
            </View>

            <View style={styles.metricDivider} />

            <View style={styles.metricCol}>
              <Text style={styles.metricNumber}>
                {completedCoursesCount}
                <Text style={styles.metricSub}> / {totalCourses}</Text>
              </Text>
              <Text style={styles.metricLabel}>SUBJECTS PASSED</Text>
            </View>
          </View>
        </View>

        {/* Fuzzy Workload Recommendation Card */}
        <View style={styles.workloadCard}>
          <View style={styles.workloadHead}>
            <View style={styles.sparkIcon}>
              <Icon name="spark" size={18} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.workloadKicker}>MAMDANI FUZZY WORKLOAD MODEL</Text>
              <Text style={styles.workloadTitle}>
                Recommended Load: Max {fuzzyAnalysis.recommendedUnitsMax} Units
              </Text>
            </View>
            <View
              style={[
                styles.stressPill,
                {
                  backgroundColor:
                    fuzzyAnalysis.stressLevel === "Low"
                      ? "#28a745"
                      : fuzzyAnalysis.stressLevel === "Moderate"
                      ? colors.accent
                      : "#dc3545",
                },
              ]}
            >
              <Text style={styles.stressPillText}>
                {fuzzyAnalysis.stressLevel} Stress ({fuzzyAnalysis.stressScore}%)
              </Text>
            </View>
          </View>

          <Text style={styles.workloadDesc}>{fuzzyAnalysis.explanation}</Text>

          <Text style={styles.disclaimerText}>
            {fuzzyAnalysis.disclaimer}
          </Text>
        </View>

        {/* Quick Access Menu */}
        <Text style={styles.sectionTitle}>QUICK NAVIGATION</Text>
        <View style={styles.quickGrid}>
          {/* Go to Roadmap */}
          <Pressable
            style={styles.quickAction}
            onPress={() => router.push("/(tabs)/roadmap")}
          >
            <View style={[styles.actionIcon, { backgroundColor: colors.mint }]}>
              <Icon name="route" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Academic Roadmap</Text>
              <Text style={styles.actionSub}>
                Semester-by-semester personalized schedule
              </Text>
            </View>
            <Icon name="chevron" size={18} color={colors.muted} />
          </Pressable>

          {/* Go to Curriculum */}
          <Pressable
            style={styles.quickAction}
            onPress={() => router.push("/(tabs)/courses")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#e8effe" }]}>
              <Icon name="book" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Official Curriculum</Text>
              <Text style={styles.actionSub}>
                Explore all 53 BEEd prospectus courses
              </Text>
            </View>
            <Icon name="chevron" size={18} color={colors.muted} />
          </Pressable>

          {/* Open Prerequisite DAG */}
          <Pressable
            style={styles.quickAction}
            onPress={() => setShowDagModal(true)}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#fef3e2" }]}>
              <Icon name="compass" size={20} color="#b76e00" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.actionTitle}>Prerequisite DAG Visualizer</Text>
              <Text style={styles.actionSub}>
                Inspect course dependency chains & unlocks
              </Text>
            </View>
            <Icon name="chevron" size={18} color={colors.muted} />
          </Pressable>
        </View>

        {/* Prospectus Meta Footer */}
        <View style={styles.footerNote}>
          <Text style={styles.footerText}>
            MSU-Naawan BEEd Curriculum · A.Y. 2025–2026 · 167 Units
          </Text>
        </View>
      </ScrollView>

      {/* Prerequisite DAG Visualizer Modal */}
      <Modal
        visible={showDagModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDagModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Prerequisite Dependency Graph</Text>
            <Pressable
              onPress={() => setShowDagModal(false)}
              style={styles.modalCloseBtn}
            >
              <Icon name="close" size={18} color={colors.ink} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Step5Prerequisites completed={completed} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  scroll: { padding: 20, gap: 18, paddingBottom: 36 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 6,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.white,
  },
  welcomeKicker: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.primary,
  },
  studentName: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.ink,
  },
  studentMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
  },
  progressCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: 20,
    gap: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardKicker: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.mint,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.white,
    marginTop: 2,
  },
  percentBadge: {
    backgroundColor: colors.deep,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  percentText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.accent,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 8,
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
  },
  metricCol: { alignItems: "center", flex: 1 },
  metricNumber: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.white,
  },
  metricSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.mint,
  },
  metricLabel: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: colors.mint,
    marginTop: 4,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  workloadCard: {
    backgroundColor: colors.deep,
    borderRadius: radius.md,
    padding: 16,
    gap: 10,
  },
  workloadHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sparkIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  workloadKicker: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: colors.accent,
  },
  workloadTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.white,
  },
  stressPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stressPillText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.white,
  },
  workloadDesc: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.mint,
  },
  disclaimerText: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 14,
    color: "rgba(255, 255, 255, 0.5)",
    fontStyle: "italic",
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.muted,
    marginTop: 4,
  },
  quickGrid: {
    gap: 10,
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
  },
  actionSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  footerNote: {
    paddingVertical: 12,
    alignItems: "center",
  },
  footerText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.muted,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
  },
});
