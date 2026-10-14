import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "../components/Icon";
import PrimaryButton from "../components/PrimaryButton";
import { firstTermCodes } from "../data/status";
import { AcademicStanding, DomainConfidence, StudentProfile } from "../services/storage";
import { useAppState } from "../state/AppState";
import { colors, fonts, radius } from "../theme";
import Step1Profile from "./setup/Step1Profile";
import Step2Curriculum from "./setup/Step2Curriculum";
import Step3Standing from "./setup/Step3Standing";
import Step4Completed from "./setup/Step4Completed";
import Step5Prerequisites from "./setup/Step5Prerequisites";
import Step6Confidence from "./setup/Step6Confidence";
import Step7Analysis from "./setup/Step7Analysis";
import Welcome from "./Welcome";

const labels = [
  "Profile",
  "Curriculum",
  "Standing",
  "Completed",
  "Prerequisites",
  "Confidence",
  "Analysis",
];

export default function Setup({
  onFinish,
}: {
  onFinish: (
    completed: Set<string>,
    standing?: AcademicStanding,
    confidence?: DomainConfidence,
    profile?: StudentProfile,
  ) => void;
}) {
  const { profile, setProfile } = useAppState();
  const [name, setName] = useState(profile.name || "Vanisa Lungay");
  const [studentId, setStudentId] = useState(profile.studentId || "1021322");
  const [step, setStep] = useState(0);
  const [year, setYear] = useState<1 | 2 | 3 | 4>(1);
  const [semester, setSemester] = useState<
    "First Semester" | "Second Semester" | "Summer"
  >("Second Semester");
  const [completed, setCompleted] = useState<Set<string>>(new Set(firstTermCodes));
  const [confidence, setConfidence] = useState<DomainConfidence>({
    foundations: 7,
    numeracy: 6,
    literacy: 8,
    professional: 7,
  });

  if (step === 0) return <Welcome onStart={() => setStep(1)} />;

  const toggleCompleted = (code: string) => {
    const next = new Set(completed);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setCompleted(next);
  };

  const batchSelectCompleted = (codes: string[], select: boolean) => {
    const next = new Set(completed);
    for (const code of codes) {
      if (select) next.add(code);
      else next.delete(code);
    }
    setCompleted(next);
  };

  const next = () => {
    if (step === 1) {
      setProfile({
        ...profile,
        name: name.trim() || profile.name,
        studentId: studentId.trim() || profile.studentId,
      });
      setStep(step + 1);
    } else if (step === 7) {
      onFinish(
        completed,
        { year, semester },
        confidence,
        {
          ...profile,
          name: name.trim() || profile.name,
          studentId: studentId.trim() || profile.studentId,
        }
      );
    } else {
      setStep(step + 1);
    }
  };

  const buttonLabel =
    step === 7
      ? "Enter CourseAdvisor"
      : step === 6
      ? "Generate Academic Plan"
      : "Continue";

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.head}>
        <Pressable
          style={styles.back}
          onPress={() => setStep(Math.max(0, step - 1))}
        >
          <View style={{ transform: [{ rotate: "180deg" }] }}>
            <Icon name="arrow" size={18} color={colors.ink} />
          </View>
        </Pressable>
        <Text style={styles.stepLabel}>
          STEP {step} OF 7 · {labels[step - 1]}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${(step / 7) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {step === 1 && (
          <Step1Profile
            name={name}
            setName={setName}
            studentId={studentId}
            setStudentId={setStudentId}
          />
        )}
        {step === 2 && <Step2Curriculum />}
        {step === 3 && (
          <Step3Standing
            year={year}
            setYear={(y) => setYear(y as 1 | 2 | 3 | 4)}
            semester={semester}
            setSemester={(s) =>
              setSemester(s as "First Semester" | "Second Semester" | "Summer")
            }
          />
        )}
        {step === 4 && (
          <Step4Completed
            completed={completed}
            onToggle={toggleCompleted}
            onBatchSelect={batchSelectCompleted}
            year={year}
            semester={semester}
          />
        )}
        {step === 5 && <Step5Prerequisites completed={completed} />}
        {step === 6 && (
          <Step6Confidence
            confidence={confidence}
            setConfidence={setConfidence}
          />
        )}
        {step === 7 && (
          <Step7Analysis
            completed={completed}
            year={year}
            semester={semester}
            confidence={confidence}
          />
        )}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton label={buttonLabel} onPress={next} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  stepLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.muted,
  },
  track: {
    height: 4,
    backgroundColor: colors.line,
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 2,
    overflow: "hidden",
  },
  fill: { height: 4, backgroundColor: colors.primary },
  scroll: { padding: 20, paddingBottom: 32 },
  footer: { padding: 20, paddingTop: 8 },
});