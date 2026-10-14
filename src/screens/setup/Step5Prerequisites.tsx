import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Icon from "../../components/Icon";
import { allCourses } from "../../data/curriculum";
import { prerequisiteGraph } from "../../services/prerequisiteGraph";
import { colors, fonts, radius } from "../../theme";
import { s } from "./shared";

export default function Step5Prerequisites({
  completed,
}: {
  completed: Set<string>;
}) {
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>("ELC 197");

  // Run cycle detection test
  const cycleResult = prerequisiteGraph.detectCycles();

  // Evaluate status stats
  let availableCount = 0;
  let blockedCount = 0;
  let completedCount = 0;

  for (const course of allCourses) {
    const status = prerequisiteGraph.getCourseStatus(course, completed);
    if (status === "Completed") completedCount++;
    else if (status === "Available") availableCount++;
    else blockedCount++;
  }

  const selectedCourse = allCourses.find((c) => c.code === selectedCourseCode) ?? allCourses[0];
  const backwardPrereqs = prerequisiteGraph.getBackwardChainingRequirements(selectedCourse.code);
  const forwardUnlocks = prerequisiteGraph.getDirectUnlocks(selectedCourse.code);
  const eligibility = prerequisiteGraph.evaluateEligibility(selectedCourse.code, completed);

  // Key gateway courses to spotlight in the DAG
  const gatewayCourses = ["CPE 100", "CPE 101", "CPE 105", "CPE 106", "ELC 101", "ELC 197"];

  return (
    <View style={s.content}>
      <Text style={s.kicker}>PREREQUISITE VISUALIZER</Text>
      <Text style={s.h1}>Your Course Dependency Graph</Text>
      <Text style={s.lead}>
        BEEd subjects are organized as a Directed Acyclic Graph (DAG).
        Prerequisites must be completed before downstream courses unlock.
      </Text>

      {/* DAG Integrity Card */}
      <View style={styles.dagBanner}>
        <Icon name="check" size={18} color={colors.white} />
        <View style={{ flex: 1 }}>
          <Text style={styles.dagTitle}>Directed Acyclic Graph (DAG) Verified</Text>
          <Text style={styles.dagSub}>
            {cycleResult.hasCycle
              ? "Warning: Circular dependencies detected"
              : "53 curriculum nodes verified with 0 circular dependencies."}
          </Text>
        </View>
      </View>

      {/* Status Metrics */}
      <View style={styles.statusGrid}>
        <View style={[styles.statusBox, { backgroundColor: "#eef3fb" }]}>
          <Text style={[styles.statusNum, { color: colors.primary }]}>{completedCount}</Text>
          <Text style={styles.statusLabel}>COMPLETED</Text>
        </View>
        <View style={[styles.statusBox, { backgroundColor: "#eaf7ee" }]}>
          <Text style={[styles.statusNum, { color: "#1e7e34" }]}>{availableCount}</Text>
          <Text style={styles.statusLabel}>AVAILABLE</Text>
        </View>
        <View style={[styles.statusBox, { backgroundColor: "#fff4e5" }]}>
          <Text style={[styles.statusNum, { color: "#b76e00" }]}>{blockedCount}</Text>
          <Text style={styles.statusLabel}>BLOCKED</Text>
        </View>
      </View>

      {/* Quick Spotlight Selector */}
      <Text style={s.fieldLabel}>INSPECT GATEWAY COURSE DEPENDENCIES</Text>
      <View style={styles.gatewayScroll}>
        {gatewayCourses.map((code) => {
          const isSelected = code === selectedCourseCode;
          const isDone = completed.has(code);
          return (
            <Pressable
              key={code}
              onPress={() => setSelectedCourseCode(code)}
              style={[
                styles.gatewayChip,
                isSelected && styles.gatewayChipActive,
                isDone && !isSelected && styles.gatewayChipDone,
              ]}
            >
              <Text
                style={[
                  styles.gatewayChipText,
                  isSelected && { color: colors.white },
                ]}
              >
                {code}
              </Text>
              {isDone && <Icon name="check" size={12} color={isSelected ? colors.white : colors.primary} />}
            </Pressable>
          );
        })}
      </View>

      {/* Course Detail Card */}
      <View style={[s.card, styles.inspectorCard]}>
        <View style={styles.inspectorHead}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inspectorCode}>{selectedCourse.code}</Text>
            <Text style={styles.inspectorTitle}>{selectedCourse.title}</Text>
          </View>
          <View
            style={[
              styles.eligibilityBadge,
              eligibility.isCompleted
                ? styles.badgeCompleted
                : eligibility.isEligible
                ? styles.badgeEligible
                : styles.badgeBlocked,
            ]}
          >
            <Text style={styles.badgeText}>
              {eligibility.isCompleted
                ? "Completed"
                : eligibility.isEligible
                ? "Unlocked"
                : "Blocked"}
            </Text>
          </View>
        </View>

        {/* Backward Chaining Chain */}
        <View style={styles.chainSection}>
          <Text style={styles.chainTitle}>
            BACKWARD CHAINING REQUIREMENTS ({backwardPrereqs.length})
          </Text>
          {backwardPrereqs.length === 0 ? (
            <Text style={styles.chainEmpty}>
              No prerequisites required. Can be taken directly.
            </Text>
          ) : (
            <View style={styles.chainList}>
              {backwardPrereqs.map((req, idx) => {
                const isMet = completed.has(req.code);
                return (
                  <View key={req.code} style={styles.chainItem}>
                    <View style={[styles.chainDot, isMet && styles.chainDotMet]}>
                      <Text style={[styles.chainIdx, isMet && { color: colors.white }]}>
                        {idx + 1}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.chainCode}>
                        {req.code} · <Text style={{ fontFamily: fonts.regular }}>{req.title}</Text>
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.chainStatus,
                        isMet ? { color: "#1e7e34" } : { color: "#b76e00" },
                      ]}
                    >
                      {isMet ? "Satisfied" : "Missing"}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Forward Chaining Unlocks */}
        <View style={styles.chainSection}>
          <Text style={styles.chainTitle}>
            DIRECT UNLOCKS ({forwardUnlocks.length})
          </Text>
          {forwardUnlocks.length === 0 ? (
            <Text style={styles.chainEmpty}>
              Terminal course in this sequence. Does not unlock subsequent subjects.
            </Text>
          ) : (
            <View style={styles.unlockList}>
              {forwardUnlocks.map((u) => (
                <Pressable
                  key={u.code}
                  onPress={() => setSelectedCourseCode(u.code)}
                  style={styles.unlockChip}
                >
                  <Text style={styles.unlockCode}>{u.code}</Text>
                  <Text style={styles.unlockTitle} numberOfLines={1}>
                    {u.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dagBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: radius.md,
  },
  dagTitle: { fontFamily: fonts.bold, fontSize: 13, color: colors.white },
  dagSub: { fontFamily: fonts.regular, fontSize: 11, color: colors.mint },
  statusGrid: {
    flexDirection: "row",
    gap: 8,
  },
  statusBox: {
    flex: 1,
    padding: 12,
    borderRadius: radius.md,
    alignItems: "center",
  },
  statusNum: { fontFamily: fonts.bold, fontSize: 18 },
  statusLabel: { fontFamily: fonts.bold, fontSize: 9, letterSpacing: 1.2, color: colors.muted, marginTop: 2 },
  gatewayScroll: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  gatewayChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  gatewayChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  gatewayChipDone: {
    borderColor: colors.accent,
    backgroundColor: colors.mint,
  },
  gatewayChipText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.ink,
  },
  inspectorCard: {
    gap: 14,
    marginTop: 4,
  },
  inspectorHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  inspectorCode: { fontFamily: fonts.bold, fontSize: 12, color: colors.primary },
  inspectorTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink, marginTop: 2 },
  eligibilityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  badgeCompleted: { backgroundColor: colors.primary },
  badgeEligible: { backgroundColor: "#d4edda" },
  badgeBlocked: { backgroundColor: "#fff3cd" },
  badgeText: { fontFamily: fonts.bold, fontSize: 11, color: colors.ink },
  chainSection: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: 12,
  },
  chainTitle: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.muted,
  },
  chainEmpty: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    fontStyle: "italic",
  },
  chainList: {
    gap: 6,
  },
  chainItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  chainDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  chainDotMet: {
    backgroundColor: colors.primary,
  },
  chainIdx: { fontFamily: fonts.bold, fontSize: 10, color: colors.primary },
  chainCode: { fontFamily: fonts.bold, fontSize: 12, color: colors.ink },
  chainStatus: { fontFamily: fonts.bold, fontSize: 11 },
  unlockList: {
    gap: 6,
  },
  unlockChip: {
    padding: 8,
    borderRadius: radius.sm,
    backgroundColor: "#f4f7fc",
    borderWidth: 1,
    borderColor: colors.line,
  },
  unlockCode: { fontFamily: fonts.bold, fontSize: 11, color: colors.primary },
  unlockTitle: { fontFamily: fonts.regular, fontSize: 12, color: colors.ink },
});
