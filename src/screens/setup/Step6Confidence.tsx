import { Pressable, StyleSheet, Text, View } from "react-native";
import Icon from "../../components/Icon";
import { fuzzySystem } from "../../services/fuzzyInference";
import { DomainConfidence } from "../../services/storage";
import { colors, fonts, radius } from "../../theme";
import { s } from "./shared";

type DomainKey = keyof DomainConfidence;

const domains: {
  key: DomainKey;
  title: string;
  subtitle: string;
  exampleCourses: string;
}[] = [
  {
    key: "foundations",
    title: "Foundations & General Education",
    subtitle: "Philosophy, Child Development, History & Society",
    exampleCourses: "CPE 100, CPE 101, GEC 101, GEC 105",
  },
  {
    key: "numeracy",
    title: "Numeracy & Elementary Science",
    subtitle: "Primary Math, Intermediate Math, Biology & Chemistry",
    exampleCourses: "GED 109, GED 110, GED 101, GED 102",
  },
  {
    key: "literacy",
    title: "Literacy & Language Arts",
    subtitle: "Beginning Reading, Mother-Tongue, English & Filipino",
    exampleCourses: "GED 115, GED 113, GED 106, GED 116",
  },
  {
    key: "professional",
    title: "Professional Pedagogy & Field Study",
    subtitle: "Assessments, Curriculum Design, Field Study 1 & 2",
    exampleCourses: "CPE 105, CPE 106, ELC 101, ELC 197",
  },
];

export default function Step6Confidence({
  confidence,
  setConfidence,
}: {
  confidence: DomainConfidence;
  setConfidence: (c: DomainConfidence) => void;
}) {
  const updateScore = (key: DomainKey, delta: number) => {
    const curr = confidence[key];
    const nextVal = Math.max(1, Math.min(10, curr + delta));
    setConfidence({
      ...confidence,
      [key]: nextVal,
    });
  };

  const avgConfidence =
    (confidence.foundations +
      confidence.numeracy +
      confidence.literacy +
      confidence.professional) /
    4;

  // Run live Mamdani FIS preview for standard 23-unit semester
  const previewAnalysis = fuzzySystem.evaluate(avgConfidence, 6, 23);

  return (
    <View style={s.content}>
      <Text style={s.kicker}>CONFIDENCE & WORKLOAD ASSESSMENT</Text>
      <Text style={s.h1}>Rate your readiness by domain</Text>
      <Text style={s.lead}>
        Rate your confidence on a scale of 1–10. The Mamdani Fuzzy Inference
        System uses these ratings to tailor recommended semester unit limits.
      </Text>

      {/* Domain Cards */}
      {domains.map((dom) => {
        const score = confidence[dom.key];
        let tag = "Moderate";
        let tagColor = colors.primary;
        if (score <= 4) {
          tag = "Needs Pacing";
          tagColor = "#b76e00";
        } else if (score >= 8) {
          tag = "Strong";
          tagColor = "#1e7e34";
        }

        return (
          <View key={dom.key} style={[s.card, styles.domainCard]}>
            <View style={styles.domainHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.domainTitle}>{dom.title}</Text>
                <Text style={styles.domainSub}>{dom.subtitle}</Text>
              </View>
              <View style={[styles.tag, { backgroundColor: colors.mint }]}>
                <Text style={[styles.tagText, { color: tagColor }]}>{tag}</Text>
              </View>
            </View>

            <Text style={styles.exampleText}>Key subjects: {dom.exampleCourses}</Text>

            {/* Stepper Controls */}
            <View style={styles.stepperRow}>
              <Pressable
                onPress={() => updateScore(dom.key, -1)}
                style={[styles.stepBtn, score <= 1 && styles.stepBtnDisabled]}
                disabled={score <= 1}
              >
                <Icon name="minus" size={16} color={score <= 1 ? colors.muted : colors.ink} />
              </Pressable>

              <View style={styles.scoreDisplay}>
                <Text style={styles.scoreNum}>{score}</Text>
                <Text style={styles.scoreMax}>/ 10</Text>
              </View>

              <Pressable
                onPress={() => updateScore(dom.key, 1)}
                style={[styles.stepBtn, score >= 10 && styles.stepBtnDisabled]}
                disabled={score >= 10}
              >
                <Icon name="plus" size={16} color={score >= 10 ? colors.muted : colors.ink} />
              </Pressable>
            </View>
          </View>
        );
      })}

      {/* Fuzzy Inference Live Preview */}
      <View style={styles.fuzzyPreview}>
        <View style={styles.previewHead}>
          <Icon name="spark" size={18} color={colors.white} />
          <Text style={styles.previewTitle}>Mamdani Fuzzy Workload Estimation</Text>
        </View>
        <Text style={styles.previewScore}>
          Average Confidence: {avgConfidence.toFixed(1)} / 10 · Predicted Stress:{" "}
          {previewAnalysis.stressScore}% ({previewAnalysis.stressLevel})
        </Text>
        <Text style={styles.previewAdvice}>
          Workload Suitability: <Text style={{ fontFamily: fonts.bold }}>{previewAnalysis.suitability}</Text>.{" "}
          {previewAnalysis.explanation}
        </Text>
        <Text style={styles.disclaimerText}>{previewAnalysis.disclaimer}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  domainCard: {
    gap: 10,
  },
  domainHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  domainTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
  },
  domainSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  exampleText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.muted,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f4f7fc",
    borderRadius: radius.sm,
    padding: 6,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnDisabled: {
    opacity: 0.3,
  },
  scoreDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  scoreNum: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.primary,
  },
  scoreMax: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
  },
  fuzzyPreview: {
    backgroundColor: colors.deep,
    borderRadius: radius.md,
    padding: 16,
    gap: 8,
    marginTop: 4,
  },
  previewHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  previewTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.accent,
  },
  previewScore: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.white,
  },
  previewAdvice: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.mint,
  },
  disclaimerText: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 14,
    color: "rgba(255,255,255,0.5)",
    fontStyle: "italic",
    marginTop: 4,
  },
});
