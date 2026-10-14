import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { firstTermCodes } from "../data/status";
import {
  AcademicStanding,
  defaultConfidence,
  defaultProfile,
  defaultStanding,
  DomainConfidence,
  SavedRoadmap,
  storage,
  StudentProfile,
} from "../services/storage";

type AppStateValue = {
  isLoading: boolean;
  profile: StudentProfile;
  setProfile: (p: StudentProfile) => void;
  standing: AcademicStanding;
  setStanding: (s: AcademicStanding) => void;
  confidence: DomainConfidence;
  setConfidence: (c: DomainConfidence) => void;
  completed: Set<string>;
  setCompleted: (next: Set<string>) => void;
  toggleCompleted: (code: string) => void;
  onboarded: boolean;
  finishOnboarding: (
    completed: Set<string>,
    standing?: AcademicStanding,
    confidence?: DomainConfidence,
    profile?: StudentProfile,
  ) => void;
  savedRoadmaps: SavedRoadmap[];
  saveCurrentRoadmap: (name: string, terms: any) => Promise<void>;
  deleteRoadmap: (id: string) => Promise<void>;
  resetAllData: () => Promise<void>;
};

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfileState] = useState<StudentProfile>(defaultProfile);
  const [standing, setStandingState] = useState<AcademicStanding>(defaultStanding);
  const [confidence, setConfidenceState] = useState<DomainConfidence>(defaultConfidence);
  const [completed, setCompletedState] = useState<Set<string>>(new Set(firstTermCodes));
  const [onboarded, setOnboardedState] = useState(false);
  const [savedRoadmaps, setSavedRoadmapsState] = useState<SavedRoadmap[]>([]);

  // Load from local database/AsyncStorage on startup
  useEffect(() => {
    async function loadData() {
      try {
        await storage.init();
        const [savedProf, savedStand, savedComp, savedConf, savedOnboard, savedRoads] =
          await Promise.all([
            storage.getProfile(),
            storage.getStanding(),
            storage.getCompleted(),
            storage.getConfidence(),
            storage.getOnboarded(),
            storage.getSavedRoadmaps(),
          ]);

        setProfileState(savedProf);
        setStandingState(savedStand);
        if (savedComp && savedComp.length > 0) {
          setCompletedState(new Set(savedComp));
        }
        setConfidenceState(savedConf);
        setOnboardedState(savedOnboard);
        setSavedRoadmapsState(savedRoads);
      } catch (e) {
        console.error("Failed to load local state:", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const setProfile = (p: StudentProfile) => {
    setProfileState(p);
    storage.setProfile(p);
  };

  const setStanding = (s: AcademicStanding) => {
    setStandingState(s);
    storage.setStanding(s);
  };

  const setConfidence = (c: DomainConfidence) => {
    setConfidenceState(c);
    storage.setConfidence(c);
  };

  const setCompleted = (next: Set<string>) => {
    setCompletedState(next);
    storage.setCompleted(Array.from(next));
  };

  const toggleCompleted = (code: string) => {
    const next = new Set(completed);
    if (next.has(code)) {
      next.delete(code);
    } else {
      next.add(code);
    }
    setCompleted(next);
  };

  const finishOnboarding = (
    done: Set<string>,
    newStanding?: AcademicStanding,
    newConfidence?: DomainConfidence,
    newProfile?: StudentProfile,
  ) => {
    setCompleted(done);
    if (newStanding) setStanding(newStanding);
    if (newConfidence) setConfidence(newConfidence);
    if (newProfile) setProfile(newProfile);
    setOnboardedState(true);
    storage.setOnboarded(true);
  };

  const saveCurrentRoadmap = async (name: string, terms: any) => {
    const newRoadmap: SavedRoadmap = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toLocaleDateString(),
      updatedAt: new Date().toLocaleDateString(),
      standing,
      terms,
    };
    const updated = [newRoadmap, ...savedRoadmaps];
    setSavedRoadmapsState(updated);
    await storage.setSavedRoadmaps(updated);
  };

  const deleteRoadmap = async (id: string) => {
    const updated = savedRoadmaps.filter((r) => r.id !== id);
    setSavedRoadmapsState(updated);
    await storage.setSavedRoadmaps(updated);
  };

  const resetAllData = async () => {
    await storage.clearAll();
    setProfileState(defaultProfile);
    setStandingState(defaultStanding);
    setConfidenceState(defaultConfidence);
    setCompletedState(new Set(firstTermCodes));
    setOnboardedState(false);
    setSavedRoadmapsState([]);
  };

  return (
    <AppStateContext.Provider
      value={{
        isLoading,
        profile,
        setProfile,
        standing,
        setStanding,
        confidence,
        setConfidence,
        completed,
        setCompleted,
        toggleCompleted,
        onboarded,
        finishOnboarding,
        savedRoadmaps,
        saveCurrentRoadmap,
        deleteRoadmap,
        resetAllData,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const value = useContext(AppStateContext);
  if (!value) throw new Error("useAppState must be used inside AppProvider");
  return value;
}