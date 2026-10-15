import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon, { IconName } from "../components/Icon";
import PrimaryButton from "../components/PrimaryButton";
import { colors, fonts, radius } from "../theme";
import { s } from "./setup/shared";

const path: { icon?: IconName; num?: string; small: string; text: string }[] = [
  { icon: "check", small: "START", text: "Build your profile" },
  { num: "2", small: "PLAN", text: "Review 167 units" },
  { icon: "spark", small: "FINISH", text: "Teaching Internship" },
];

export default function Welcome({
  onStart,
  onSignOut,
}: {
  onStart: () => void;
  onSignOut?: () => void;
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.brand}>
            <Icon name="compass" size={32} color={colors.white} />
          </View>
          {onSignOut && (
            <Pressable style={styles.signOutBtn} onPress={onSignOut}>
              <Icon name="logout" size={14} color="#e11d48" />
              <Text style={styles.signOutBtnText}>Sign out</Text>
            </Pressable>
          )}
        </View>

        <View style={{ gap: 10 }}>
          <Text style={s.kicker}>COURSEADVISOR</Text>
          <Text style={s.h1}>Your BEEd journey, made clear.</Text>
          <Text style={s.lead}>
            Understand every prerequisite, plan every semester, and move
            confidently toward your teaching degree.
          </Text>
        </View>

        <View style={styles.path}>
          <View style={styles.line} />
          {path.map((item, i) => {
            const filled = i !== 1;
            return (
              <View key={item.small} style={styles.pathItem}>
                <View style={[styles.dot, filled ? styles.dotFilled : styles.dotOutline]}>
                  {item.icon ? (
                    <Icon name={item.icon} size={14} color={colors.white} />
                  ) : (
                    <Text style={styles.dotNum}>{item.num}</Text>
                  )}
                </View>
                <View>
                  <Text style={styles.small}>{item.small}</Text>
                  <Text style={styles.pathText}>{item.text}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton label="Get started" onPress={onStart} />
        <Text style={styles.note}>BEEd Prospectus · Effective A.Y. 2025–2026</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  body: { flex: 1, justifyContent: "center", padding: 24, gap: 28 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: "#fff1f2",
    borderWidth: 1,
    borderColor: "#fecdd3",
  },
  signOutBtnText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: "#e11d48",
  },
  path: { gap: 18, paddingVertical: 4 },
  line: {
    position: "absolute",
    left: 15,
    top: 16,
    bottom: 16,
    width: 2,
    backgroundColor: colors.line,
  },
  pathItem: { flexDirection: "row", alignItems: "center", gap: 14 },
  dot: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  dotFilled: { backgroundColor: colors.primary },
  dotOutline: { backgroundColor: colors.mint, borderWidth: 2, borderColor: colors.primary },
  dotNum: { fontFamily: fonts.bold, fontSize: 13, color: colors.primary },
  small: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.5, color: colors.muted },
  pathText: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  footer: { padding: 24, gap: 12 },
  note: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted, textAlign: "center" },
});