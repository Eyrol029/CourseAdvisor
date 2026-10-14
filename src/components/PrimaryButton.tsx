import { Pressable, StyleSheet, Text } from "react-native";
import { colors, fonts, radius } from "../theme";
import Icon from "./Icon";

export default function PrimaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
    >
      <Text style={styles.text}>{label}</Text>
      <Icon name="arrow" size={18} color={colors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.md,
  },
  text: { fontFamily: fonts.bold, fontSize: 16, color: colors.white },
});