import { StyleSheet, Text, View } from "react-native";
import { Status } from "../data/status";
import { colors, fonts } from "../theme";
import Icon from "./Icon";

export const statusStyle: Record<Status, { bg: string; fg: string }> = {
  Completed: { bg: colors.primary, fg: colors.white },
  Recommended: { bg: colors.accent, fg: colors.deep },
  Available: { bg: colors.mint, fg: colors.primary },
  "Prerequisite Required": { bg: "#eef1f8", fg: colors.muted },
  Locked: { bg: "#eef1f8", fg: colors.muted },
};

export default function StatusPill({ value }: { value: Status }) {
  const { bg, fg } = statusStyle[value];
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      {value === "Prerequisite Required" && <Icon name="lock" size={10} color={fg} />}
      {value === "Completed" && <Icon name="check" size={10} color={fg} />}
      <Text style={[styles.text, { color: fg }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  text: { fontFamily: fonts.bold, fontSize: 10 },
});