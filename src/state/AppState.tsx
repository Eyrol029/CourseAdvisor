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
  StudentRecord,
} from "../services/storage";

type AuthResult = {
  success: boolean;
  error?: string;
  student?: StudentRecord;
};

type AppStateValue = {
  isLoading: boolean;
  currentStudentId: string | null;
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
    profile?: StudentProfile
  ) => Promise<void>;
  savedRoadmaps: SavedRoadmap[];
  saveCurrentRoadmap: (name: string, terms: any) => Promise<void>;
  deleteRoadmap: (id: string) => Promise<void>;
  login: (name: string, studentId: string) => Promise<AuthResult>;
  signUp: (name: string, studentId: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetAllData: () => Promise<void>;
};

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
  const [profile, setProfileState] = useState<StudentProfile>(defaultProfile);
  const [standing, setStandingState] = useState<AcademicStanding>(defaultStanding);
  const [confidence, setConfidenceState] = useState<DomainConfidence>(defaultConfidence);
  const [completed, setCompletedState] = useState<Set<string>>(new Set(firstTermCodes));
  const [onboarded, setOnboardedState] = useState(false);
  const [savedRoadmaps, setSavedRoadmapsState] = useState<SavedRoadmap[]>([]);

  // Load from local database on startup
  useEffect(() => {
    async function loadData() {
      try {
        await storage.init();
        const activeId = await storage.getActiveStudentId();

        if (activeId) {
          const student = await storage.findStudent(activeId);
          if (student) {
            setCurrentStudentId(student.studentId);
            setProfileState({
              name: student.name,
              studentId: student.studentId,
              degreeProgram: student.degreeProgram,
              institution: student.institution,
              catalogYear: student.catalogYear,
            });
            setStandingState(student.standing);
            setCompletedState(new Set(student.completed));
            setConfidenceState(student.confidence);
            setOnboardedState(student.onboarded);
            setSavedRoadmapsState(student.savedRoadmaps || []);
          } else {
            await storage.clearSession();
            setCurrentStudentId(null);
          }
        } else {
          setCurrentStudentId(null);
        }
      } catch (e) {
        console.error("Failed to load local state:", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const login = async (name: string, studentId: string): Promise<AuthResult> => {
    const cleanName = name.trim();
    const cleanId = studentId.trim();

    if (!cleanName || !cleanId) {
      return { success: false, error: "Please enter your Student Name and Student ID." };
    }

    try {
      const student = await storage.findStudentByNameAndId(cleanName, cleanId);

      if (!student) {
        return {
          success: false,
          error: "No account found for this name and ID",
        };
      }

      await storage.setActiveStudentId(student.studentId);
      setCurrentStudentId(student.studentId);
      setProfileState({
        name: student.name,
        studentId: student.studentId,
        degreeProgram: student.degreeProgram,
        institution: student.institution,
        catalogYear: student.catalogYear,
      });
      setStandingState(student.standing);
      setCompletedState(new Set(student.completed));
      setConfidenceState(student.confidence);
      setOnboardedState(student.onboarded);
      setSavedRoadmapsState(student.savedRoadmaps || []);

      return { success: true, student };
    } catch (e: any) {
      return { success: false, error: e?.message || "Failed to log in." };
    }
  };

  const signUp = async (name: string, studentId: string): Promise<AuthResult> => {
    const cleanName = name.trim();
    const cleanId = studentId.trim();

    if (!cleanName || !cleanId) {
      return { success: false, error: "Student Name and Student ID are both required." };
    }

    try {
      const existing = await storage.findStudent(cleanId);
      if (existing) {
        return {
          success: false,
          error: "This Student ID is already registered. Log in instead.",
        };
      }

      const newStudent = await storage.createStudent(cleanName, cleanId);
      setCurrentStudentId(newStudent.studentId);
      setProfileState({
        name: newStudent.name,
        studentId: newStudent.studentId,
        degreeProgram: newStudent.degreeProgram,
        institution: newStudent.institution,
        catalogYear: newStudent.catalogYear,
      });
      setStandingState(newStudent.standing);
      setCompletedState(new Set(newStudent.completed));
      setConfidenceState(newStudent.confidence);
      setOnboardedState(false);
      setSavedRoadmapsState([]);

      return { success: true, student: newStudent };
    } catch (e: any) {
      return { success: false, error: e?.message || "Failed to sign up." };
    }
  };

  const signOut = async () => {
    await storage.clearSession();
    setCurrentStudentId(null);
    setProfileState(defaultProfile);
    setStandingState(defaultStanding);
    setConfidenceState(defaultConfidence);
    setCompletedState(new Set(firstTermCodes));
    setOnboardedState(false);
    setSavedRoadmapsState([]);
  };

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

  const finishOnboarding = async (
    done: Set<string>,
    newStanding?: AcademicStanding,
    newConfidence?: DomainConfidence,
    newProfile?: StudentProfile
  ) => {
    const nextCompleted = Array.from(done);
    const nextStanding = newStanding || standing;
    const nextConfidence = newConfidence || confidence;
    const nextProfile = newProfile || profile;

    setCompletedState(done);
    if (newStanding) setStandingState(newStanding);
    if (newConfidence) setConfidenceState(newConfidence);
    if (newProfile) setProfileState(newProfile);
    setOnboardedState(true);

    if (currentStudentId) {
      await storage.updateStudent(currentStudentId, {
        name: nextProfile.name,
        studentId: nextProfile.studentId,
        degreeProgram: nextProfile.degreeProgram,
        institution: nextProfile.institution,
        catalogYear: nextProfile.catalogYear,
        completed: nextCompleted,
        standing: nextStanding,
        confidence: nextConfidence,
        onboarded: true,
      });
    }

    await storage.setCompleted(nextCompleted);
    if (newStanding) await storage.setStanding(nextStanding);
    if (newConfidence) await storage.setConfidence(nextConfidence);
    if (newProfile) await storage.setProfile(nextProfile);
    await storage.setOnboarded(true);
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
    setCurrentStudentId(null);
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
        currentStudentId,
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
        login,
        signUp,
        signOut,
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