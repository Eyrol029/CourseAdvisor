import { router } from "expo-router";
import Setup from "../screens/Setup";
import {
  AcademicStanding,
  DomainConfidence,
  StudentProfile,
} from "../services/storage";
import { useAppState } from "../state/AppState";

export default function SetupRoute() {
  const { finishOnboarding } = useAppState();

  const handleFinish = async (
    completed: Set<string>,
    standing?: AcademicStanding,
    confidence?: DomainConfidence,
    profile?: StudentProfile
  ) => {
    await finishOnboarding(completed, standing, confidence, profile);
    router.replace("/(tabs)" as any);
  };

  return <Setup onFinish={handleFinish} />;
}
