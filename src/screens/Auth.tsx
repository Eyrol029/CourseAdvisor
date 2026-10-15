import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "../components/Icon";
import { useAppState } from "../state/AppState";
import { colors, fonts, radius } from "../theme";

export default function AuthScreen() {
  const { login, signUp } = useAppState();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleTabChange = (nextMode: "login" | "signup") => {
    setMode(nextMode);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !studentId.trim()) {
      setError("Both Student Name and Student ID are required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (mode === "login") {
        const res = await login(name, studentId);
        if (!res.success) {
          setError(res.error || "No account found for this name and ID");
        } else {
          if (res.student?.onboarded) {
            router.replace("/(tabs)" as any);
          } else {
            router.replace("/setup" as any);
          }
        }
      } else {
        const res = await signUp(name, studentId);
        if (!res.success) {
          setError(
            res.error ||
              "This Student ID is already registered. Log in instead.",
          );
        } else {
          router.replace("/setup" as any);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSwitchToSignUp = () => {
    setMode("signup");
    setError(null);
  };

  const handleSwitchToLogin = () => {
    setMode("login");
    setError(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header & Brand */}
          <View style={styles.brandContainer}>
            <View style={styles.brandIcon}>
              <Icon name="compass" size={34} color={colors.white} />
            </View>
            <Text style={styles.appName}>CourseAdvisor</Text>
            <Text style={styles.appSubtitle}>
              BEEd Curriculum & Academic Advisor
            </Text>
            <Text style={styles.appInstitution}>
              Mindanao State University at Naawan
            </Text>
          </View>

          {/* Tab / Segmented Toggle */}
          <View style={styles.tabContainer}>
            <Pressable
              style={[styles.tabBtn, mode === "login" && styles.tabBtnActive]}
              onPress={() => handleTabChange("login")}
            >
              <Text
                style={[
                  styles.tabText,
                  mode === "login" && styles.tabTextActive,
                ]}
              >
                Log in
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tabBtn, mode === "signup" && styles.tabBtnActive]}
              onPress={() => handleTabChange("signup")}
            >
              <Text
                style={[
                  styles.tabText,
                  mode === "signup" && styles.tabTextActive,
                ]}
              >
                Sign up
              </Text>
            </Pressable>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>
              {mode === "login" ? "Welcome back" : "Create student account"}
            </Text>
            <Text style={styles.cardLead}>
              {mode === "login"
                ? "Enter your registered name and student ID to access your degree roadmap."
                : "Enter your official student name and ID to personalize your degree trajectory."}
            </Text>

            {/* Error Banner with contextual switch button */}
            {error && (
              <View style={styles.errorBanner}>
                <View style={styles.errorIconRow}>
                  <Icon name="warning" size={18} color="#dc3545" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>

                {mode === "login" && error.includes("No account found") && (
                  <Pressable
                    style={styles.switchPromptBtn}
                    onPress={handleSwitchToSignUp}
                  >
                    <Text style={styles.switchPromptBtnText}>
                      Sign up instead →
                    </Text>
                  </Pressable>
                )}

                {mode === "signup" && error.includes("already registered") && (
                  <Pressable
                    style={styles.switchPromptBtn}
                    onPress={handleSwitchToLogin}
                  >
                    <Text style={styles.switchPromptBtnText}>
                      Log in instead →
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Field: Student Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>STUDENT NAME</Text>
              <View style={styles.inputWrapper}>
                <Icon name="user" size={18} color={colors.primary} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. Student Name"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Field: Student ID */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>STUDENT ID NUMBER</Text>
              <View style={styles.inputWrapper}>
                <Icon name="compass" size={18} color={colors.primary} />
                <TextInput
                  style={styles.input}
                  value={studentId}
                  onChangeText={(val) => {
                    setStudentId(val);
                    if (error) setError(null);
                  }}
                  placeholder="e.g 1021055"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Submit Button */}
            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && { opacity: 0.9 },
                submitting && { opacity: 0.7 },
              ]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>
                    {mode === "login"
                      ? "Log in to CourseAdvisor"
                      : "Create Account & Start"}
                  </Text>
                  <Icon name="arrow" size={18} color={colors.white} />
                </>
              )}
            </Pressable>
          </View>

          {/* Footer Offline Notice */}
          <View style={styles.footerNotice}>
            <Icon name="lock" size={15} color={colors.muted} />
            <Text style={styles.footerNoticeText}>
              100% Offline & Device-Local · No Cloud Dependency
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  scroll: {
    padding: 24,
    paddingBottom: 40,
    justifyContent: "center",
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  brandIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  appName: {
    fontFamily: fonts.bold,
    fontSize: 26,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.muted,
    marginTop: 2,
  },
  appInstitution: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: colors.white,
    padding: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: radius.sm,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.muted,
  },
  tabTextActive: {
    color: colors.white,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 20,
    gap: 16,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.ink,
  },
  cardLead: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
    marginTop: -8,
  },
  errorBanner: {
    backgroundColor: "#fff1f2",
    borderWidth: 1,
    borderColor: "#fecdd3",
    borderRadius: radius.sm,
    padding: 12,
    gap: 8,
  },
  errorIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: "#be123c",
    lineHeight: 18,
  },
  switchPromptBtn: {
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "#fecdd3",
    marginTop: 2,
  },
  switchPromptBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.muted,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.paper,
    borderWidth: 1.5,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    gap: 10,
    height: 50,
  },
  input: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.ink,
    height: "100%",
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.md,
    marginTop: 6,
  },
  submitBtnText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.white,
  },
  footerNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 24,
  },
  footerNoticeText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.muted,
  },
});
