import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Icon from "../components/Icon";
import Setup from "../screens/Setup";
import { useAppState } from "../state/AppState";
import { colors, fonts } from "../theme";

export default function Index() {
  const { isLoading, onboarded, finishOnboarding } = useAppState();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.brand}>
          <Icon name="compass" size={36} color={colors.white} />
        </View>
        <Text style={styles.loadingTitle}>CourseAdvisor</Text>
        <Text style={styles.loadingSub}>Loading BEEd Curriculum...</Text>
        <ActivityIndicator
          size="small"
          color={colors.primary}
          style={{ marginTop: 12 }}
        />
      </View>
    );
  }

  if (!onboarded) {
    return <Setup onFinish={finishOnboarding} />;
  }

  return <Redirect href={"/(tabs)" as any} />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.paper,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  brand: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  loadingTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.ink,
  },
  loadingSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
  },
});