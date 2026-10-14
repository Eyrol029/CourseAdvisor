import { StyleSheet, Text, View } from "react-native";
import Icon from "../../components/Icon";
import { colors, fonts, radius } from "../../theme";
import { s } from "./shared";

export default function Step1Profile() {
  return (
    <View style={s.content}>
      <View style={styles.stepIcon}>
        <Icon name="user" size={24} color={colors.primary} />
      </View>
      <Text style={s.kicker}>STUDENT PROFILE</Text>
      <Text style={s.h1}>Let’s personalize your plan</Text>
      <Text style={s.lead}>
        We’ll use your academic standing to show the right part of the BEEd
        curriculum.
      </Text>

      <View style={[s.card, styles.profile]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>AM</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>Vanisa Lungay</Text>
          <Text style={styles.meta}>Student ID · 1021322</Text>
          <Text style={styles.meta}>Mindanao State University at Naawan</Text>
        </View>
      </View>

      <Text style={s.fieldLabel}>PROGRAM</Text>
      <View style={[s.card, styles.program]}>
        <Icon name="book" size={18} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>Bachelor of Elementary Education</Text>
          <Text style={styles.meta}>BEEd · A.Y. 2025–2026</Text>
        </View>
      </View>

      <View style={styles.info}>
        <Icon name="check" size={18} color={colors.primary} />
        <Text style={styles.infoText}>
          <Text style={styles.infoBold}>Official curriculum loaded{"\n"}</Text>
          The attached prospectus contains 167 counted units across four years.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  profile: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: fonts.bold, fontSize: 16, color: colors.white },
  name: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  program: { flexDirection: "row", alignItems: "center", gap: 12 },
  info: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.mint,
  },
  infoText: { flex: 1, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.deep },
  infoBold: { fontFamily: fonts.bold, color: colors.ink },
});