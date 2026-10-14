import { StyleSheet } from "react-native";
import { colors, fonts, radius } from "../../theme";

export const s = StyleSheet.create({
  content: { gap: 12 },
  kicker: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 2, color: colors.primary },
  h1: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 34, color: colors.ink },
  lead: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.muted },
  fieldLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.muted,
    marginTop: 8,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
  },
});