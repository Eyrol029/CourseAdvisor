import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "../../components/Icon";
import { allCourses, curriculum } from "../../data/curriculum";
import { fuzzySystem } from "../../services/fuzzyInference";
import { DomainConfidence } from "../../services/storage";
import { useAppState } from "../../state/AppState";
import { colors, fonts, radius } from "../../theme";

export default function ProfileScreen() {
  const {
    profile,
    setProfile,
    standing,
    setStanding,
    confidence,
    setConfidence,
    completed,
    savedRoadmaps,
    deleteRoadmap,
    resetAllData,
    signOut,
  } = useAppState();

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [idInput, setIdInput] = useState(profile.studentId);

  const handleSignOut = () => {
    setShowSignOutConfirm(true);
  };

  const handleConfirmSignOut = async () => {
    setShowSignOutConfirm(false);
    await signOut();
    router.replace("/auth" as any);
  };

  // Compute progress
  let earnedUnits = 0;
  for (const term of curriculum) {
    for (const c of term.courses) {
      if (completed.has(c.code) && c.counted !== false) {
        earnedUnits += c.units;
      }
    }
  }

  const avgConfidence =
    (confidence.foundations +
      confidence.numeracy +
      confidence.literacy +
      confidence.professional) /
    4;
  const fuzzyAnalysis = fuzzySystem.evaluate(avgConfidence, 6, 23);

  const handleSaveProfile = () => {
    if (!nameInput.trim()) {
      Alert.alert("Name cannot be empty.");
      return;
    }
    setProfile({
      ...profile,
      name: nameInput.trim(),
      studentId: idInput.trim(),
    });
    setShowEditProfile(false);
  };

  const handleResetData = () => {
    Alert.alert(
      "Reset All Academic Data",
      "Are you sure you want to clear your completed courses, saved plans, and return to onboarding? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset Everything",
          style: "destructive",
          onPress: async () => {
            await resetAllData();
          },
        },
      ],
    );
  };

  const updateDomainConfidence = (
    key: keyof DomainConfidence,
    delta: number,
  ) => {
    const curr = confidence[key];
    const nextVal = Math.max(1, Math.min(10, curr + delta));
    setConfidence({
      ...confidence,
      [key]: nextVal,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>STUDENT PROFILE</Text>
            <Text style={styles.headerTitle}>Academic Record</Text>
          </View>
          <Pressable style={styles.signOutHeaderBtn} onPress={handleSignOut}>
            <Icon name="logout" size={15} color="#e11d48" />
            <Text style={styles.signOutHeaderBtnText}>Sign out</Text>
          </Pressable>
        </View>

        {/* Profile Identity Card */}
        <View style={styles.profileCard}>
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
            <Text style={styles.profileName}>{profile.name}</Text>
            <Text style={styles.profileId}>
              Student ID: {profile.studentId}
            </Text>
            <Text style={styles.profileDegree}>{profile.degreeProgram}</Text>
            <Text style={styles.profileUni}>{profile.institution}</Text>
          </View>
          <Pressable
            style={styles.editBtn}
            onPress={() => {
              setNameInput(profile.name);
              setIdInput(profile.studentId);
              setShowEditProfile(true);
            }}
          >
            <Icon name="user" size={16} color={colors.primary} />
          </Pressable>
        </View>

        {/* Academic Standing Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>ACADEMIC STANDING</Text>
          <View style={styles.standingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.standingMain}>
                Year {standing.year} · {standing.semester}
              </Text>
              <Text style={styles.standingCatalog}>{profile.catalogYear}</Text>
            </View>
            <View style={styles.standingPill}>
              <Text style={styles.standingPillText}>Active Regular</Text>
            </View>
          </View>

          {/* Quick Year Selector */}
          <View style={styles.yearButtons}>
            {[1, 2, 3, 4].map((y) => (
              <Pressable
                key={y}
                onPress={() =>
                  setStanding({
                    ...standing,
                    year: y as 1 | 2 | 3 | 4,
                  })
                }
                style={[
                  styles.yearChoiceBtn,
                  standing.year === y && styles.yearChoiceBtnActive,
                ]}
              >
                <Text
                  style={[
                    styles.yearChoiceText,
                    standing.year === y && styles.yearChoiceTextActive,
                  ]}
                >
                  Year {y}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Degree Progress Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>CURRICULUM COMPLETION</Text>
          <View style={styles.metricGrid}>
            <View style={styles.metricBox}>
              <Text style={styles.metricVal}>{earnedUnits}</Text>
              <Text style={styles.metricSub}>Units Earned</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricVal}>{167 - earnedUnits}</Text>
              <Text style={styles.metricSub}>Units Left</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricVal}>{completed.size}</Text>
              <Text style={styles.metricSub}>Passed Subjects</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricVal}>
                {allCourses.length - completed.size}
              </Text>
              <Text style={styles.metricSub}>Remaining</Text>
            </View>
          </View>
        </View>

        {/* Self-Efficacy & Confidence Tuning */}
        <View style={styles.sectionCard}>
          <View style={styles.confidenceHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>CONFIDENCE DOMAIN RATINGS</Text>
              <Text style={styles.confidenceSub}>
                Fine-tune ratings to adjust fuzzy workload limits
              </Text>
            </View>
            <View style={styles.avgBadge}>
              <Text style={styles.avgBadgeText}>
                Avg: {avgConfidence.toFixed(1)}/10
              </Text>
            </View>
          </View>

          {(
            [
              { key: "foundations", label: "Foundations & Gen Ed" },
              { key: "numeracy", label: "Numeracy & Science" },
              { key: "literacy", label: "Literacy & Language" },
              { key: "professional", label: "Professional & Field Study" },
            ] as const
          ).map((dom) => (
            <View key={dom.key} style={styles.domainAdjustRow}>
              <Text style={styles.domainLabel}>{dom.label}</Text>
              <View style={styles.stepperMini}>
                <Pressable
                  style={styles.stepBtnMini}
                  onPress={() => updateDomainConfidence(dom.key, -1)}
                >
                  <Icon name="minus" size={12} color={colors.ink} />
                </Pressable>
                <Text style={styles.stepScoreMini}>{confidence[dom.key]}</Text>
                <Pressable
                  style={styles.stepBtnMini}
                  onPress={() => updateDomainConfidence(dom.key, 1)}
                >
                  <Icon name="plus" size={12} color={colors.ink} />
                </Pressable>
              </View>
            </View>
          ))}

          {/* Live Fuzzy Result Snippet */}
          <View style={styles.fuzzySummaryCard}>
            <Icon name="spark" size={16} color={colors.white} />
            <Text style={styles.fuzzySummaryText}>
              Predicted Semester Stress: {fuzzyAnalysis.stressScore}% (
              {fuzzyAnalysis.stressLevel}) · Max Load:{" "}
              {fuzzyAnalysis.recommendedUnitsMax} Units
            </Text>
          </View>
        </View>

        {/* Saved Roadmaps Count & Management */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            SAVED ROADMAPS ({savedRoadmaps.length})
          </Text>
          {savedRoadmaps.length === 0 ? (
            <Text style={styles.emptySaved}>
              No roadmaps saved yet. Save a plan from the Roadmap tab.
            </Text>
          ) : (
            savedRoadmaps.map((r) => (
              <View key={r.id} style={styles.savedPlanItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.savedPlanName}>{r.name}</Text>
                  <Text style={styles.savedPlanMeta}>
                    {r.createdAt} · {r.terms.length} terms
                  </Text>
                </View>
                <Pressable
                  onPress={() => deleteRoadmap(r.id)}
                  style={styles.deletePlanBtn}
                >
                  <Icon name="close" size={14} color={colors.muted} />
                </Pressable>
              </View>
            ))
          )}
        </View>

        {/* Local Relational Database & Offline-First Storage */}
        <View style={styles.sectionCard}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={styles.sectionTitle}>STORAGE & DATABASE</Text>
            <View style={styles.dbBadge}>
              <View style={styles.dbDot} />
              <Text style={styles.dbBadgeText}>
                100% Offline (Local SQLite)
              </Text>
            </View>
          </View>

          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 13,
              color: colors.muted,
              lineHeight: 18,
            }}
          >
            All curriculum entities, prerequisite DAGs, student progress, and
            roadmap schedules are stored directly on your device storage without
            cloud dependency.
          </Text>

          <View style={styles.dbGrid}>
            <View style={styles.dbGridItem}>
              <Text style={styles.dbGridLabel}>Courses Entity</Text>
              <Text style={styles.dbGridValue}>
                {allCourses.length} Registered
              </Text>
            </View>
            <View style={styles.dbGridItem}>
              <Text style={styles.dbGridLabel}>Prerequisites</Text>
              <Text style={styles.dbGridValue}>29 Graph Edges</Text>
            </View>
            <View style={styles.dbGridItem}>
              <Text style={styles.dbGridLabel}>Query Engine</Text>
              <Text style={styles.dbGridValue}>Recursive SQL CTE</Text>
            </View>
            <View style={styles.dbGridItem}>
              <Text style={styles.dbGridLabel}>Cloud / Network</Text>
              <Text style={styles.dbGridValue}>Disabled (Private)</Text>
            </View>
          </View>
        </View>

        {/* Account & Session */}
        <View style={styles.accountSection}>
          <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
            <Icon name="logout" size={17} color="#e11d48" />
            <Text style={styles.signOutBtnText}>Sign out of CourseAdvisor</Text>
          </Pressable>
        </View>

        {/* System & Storage Reset */}
        <View style={styles.dangerSection}>
          <Pressable style={styles.resetBtn} onPress={handleResetData}>
            <Icon name="warning" size={16} color="#dc3545" />
            <Text style={styles.resetBtnText}>Reset All Application Data</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfile}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditProfile(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>Edit Student Profile</Text>

            <Text style={styles.inputLabel}>FULL NAME</Text>
            <TextInput
              style={styles.dialogInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="e.g. Student Name"
            />

            <Text style={styles.inputLabel}>STUDENT ID NUMBER</Text>
            <TextInput
              style={styles.dialogInput}
              value={idInput}
              onChangeText={setIdInput}
              placeholder="e.g. 1021322"
              keyboardType="number-pad"
            />

            <View style={styles.dialogButtons}>
              <Pressable
                style={[styles.dialogBtn, styles.dialogBtnCancel]}
                onPress={() => setShowEditProfile(false)}
              >
                <Text style={styles.dialogBtnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.dialogBtn, styles.dialogBtnSave]}
                onPress={handleSaveProfile}
              >
                <Text style={styles.dialogBtnSaveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Sign Out Confirmation Modal */}
      <Modal
        visible={showSignOutConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSignOutConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dialogCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "#fee2e2",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="logout" size={20} color="#dc2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.dialogTitle}>Sign out of CourseAdvisor?</Text>
                <Text
                  style={{
                    fontFamily: fonts.regular,
                    fontSize: 12,
                    color: colors.muted,
                    marginTop: 2,
                  }}
                >
                  Active: {profile.name} ({profile.studentId})
                </Text>
              </View>
            </View>

            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 13,
                lineHeight: 19,
                color: colors.ink,
                marginTop: 4,
              }}
            >
              Are you sure you want to sign out? Your academic plan, completed
              courses, and confidence scores are safely stored on your device and
              will be restored when you log back in.
            </Text>

            <View style={styles.dialogButtons}>
              <Pressable
                style={[styles.dialogBtn, styles.dialogBtnCancel]}
                onPress={() => setShowSignOutConfirm(false)}
              >
                <Text style={styles.dialogBtnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.dialogBtn, { backgroundColor: "#dc2626" }]}
                onPress={handleConfirmSignOut}
              >
                <Text style={styles.dialogBtnSaveText}>Sign out</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  scroll: { padding: 20, gap: 16, paddingBottom: 40 },
  header: {
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kicker: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.primary,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.ink,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.white,
  },
  profileName: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
  },
  profileId: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
  },
  profileDegree: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
  },
  profileUni: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.muted,
  },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionCard: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 12,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.muted,
  },
  standingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  standingMain: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
  },
  standingCatalog: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
  },
  standingPill: {
    backgroundColor: "#e8effe",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  standingPillText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primary,
  },
  yearButtons: {
    flexDirection: "row",
    gap: 8,
  },
  yearChoiceBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.sm,
    backgroundColor: "#f4f7fc",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
  },
  yearChoiceBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  yearChoiceText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.ink,
  },
  yearChoiceTextActive: {
    color: colors.white,
  },
  metricGrid: {
    flexDirection: "row",
    gap: 8,
  },
  metricBox: {
    flex: 1,
    backgroundColor: "#f4f7fc",
    padding: 10,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  metricVal: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.primary,
  },
  metricSub: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
    textAlign: "center",
  },
  confidenceHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  confidenceSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  avgBadge: {
    backgroundColor: colors.mint,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  avgBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primary,
  },
  domainAdjustRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  domainLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.ink,
  },
  stepperMini: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepBtnMini: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  stepScoreMini: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.primary,
    minWidth: 18,
    textAlign: "center",
  },
  fuzzySummaryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.deep,
    padding: 10,
    borderRadius: radius.sm,
    marginTop: 4,
  },
  fuzzySummaryText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.white,
  },
  emptySaved: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    fontStyle: "italic",
  },
  savedPlanItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: radius.sm,
    backgroundColor: "#f4f7fc",
  },
  savedPlanName: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.ink,
  },
  savedPlanMeta: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.muted,
  },
  deletePlanBtn: {
    padding: 6,
  },
  dangerSection: {
    paddingTop: 8,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: "#fde8e8",
    borderWidth: 1,
    borderColor: "#f8b4b4",
  },
  resetBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: "#dc3545",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  dialogCard: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 20,
    gap: 12,
  },
  dialogTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.ink,
  },
  inputLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.muted,
    marginTop: 4,
  },
  dialogInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    padding: 10,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  dialogButtons: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
    marginTop: 8,
  },
  dialogBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.sm,
  },
  dialogBtnCancel: {
    backgroundColor: colors.line,
  },
  dialogBtnCancelText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.muted,
  },
  dialogBtnSave: {
    backgroundColor: colors.primary,
  },
  dialogBtnSaveText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.white,
  },
  dbBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  dbDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  dbBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: "#065F46",
  },
  dbGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  dbGridItem: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: colors.paper,
    padding: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
  },
  dbGridLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.muted,
  },
  dbGridValue: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.ink,
    marginTop: 2,
  },
  signOutHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: "#fff1f2",
    borderWidth: 1,
    borderColor: "#fecdd3",
  },
  signOutHeaderBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#e11d48",
  },
  accountSection: {
    marginTop: 6,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: "#fecdd3",
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  signOutBtnText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: "#e11d48",
  },
});
