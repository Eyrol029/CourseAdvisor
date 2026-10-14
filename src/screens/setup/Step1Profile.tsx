import { StyleSheet, Text, TextInput, View } from "react-native";
import Icon from "../../components/Icon";
import { colors, fonts, radius } from "../../theme";
import { s } from "./shared";

type Step1ProfileProps = {
  name: string;
  setName: (name: string) => void;
  studentId: string;
  setStudentId: (studentId: string) => void;
};

export default function Step1Profile({
  name,
  setName,
  studentId,
  setStudentId,
}: Step1ProfileProps) {
  // Compute initials dynamically for avatar
  const getInitials = (text: string) => {
    const parts = text.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "ST";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <View style={s.content}>
      <View style={styles.stepIcon}>
        <Icon name="user" size={24} color={colors.primary} />
      </View>
      <Text style={s.kicker}>STUDENT PROFILE</Text>
      <Text style={s.h1}>Let’s personalize your plan</Text>
      <Text style={s.lead}>
        We’ll use your student profile and academic standing to personalize your BEEd degree trajectory.
      </Text>

      {/* Live Profile Preview Badge */}
      <View style={[s.card, styles.profileCard]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.previewName} numberOfLines={1}>
            {name.trim() || "Student Name"}
          </Text>
          <Text style={styles.previewMeta}>
            Student ID · {studentId.trim() || "------"}
          </Text>
          <Text style={styles.previewInstitution}>
            Mindanao State University at Naawan
          </Text>
        </View>
      </View>

      {/* Interactive Name Input Field */}
      <View style={styles.fieldBlock}>
        <Text style={s.fieldLabel}>FULL NAME</Text>
        <View style={styles.inputWrapper}>
          <Icon name="user" size={18} color={colors.primary} />
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter your full name (e.g. Vanisa Lungay)"
            placeholderTextColor={colors.muted}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Interactive Student ID Input Field */}
      <View style={styles.fieldBlock}>
        <Text style={s.fieldLabel}>STUDENT ID NUMBER</Text>
        <View style={styles.inputWrapper}>
          <Icon name="compass" size={18} color={colors.primary} />
          <TextInput
            style={styles.input}
            value={studentId}
            onChangeText={setStudentId}
            placeholder="Enter student ID (e.g. 1021322)"
            placeholderTextColor={colors.muted}
            keyboardType="default"
            autoCorrect={false}
          />
        </View>
      </View>

      {/* Program Information */}
      <Text style={s.fieldLabel}>DEGREE PROGRAM</Text>
      <View style={[s.card, styles.programCard]}>
        <Icon name="book" size={20} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.programTitle}>Bachelor of Elementary Education</Text>
          <Text style={styles.programMeta}>BEEd · Prospectus A.Y. 2025–2026</Text>
        </View>
      </View>

      {/* Official Curriculum Banner */}
      <View style={styles.info}>
        <Icon name="check" size={18} color={colors.primary} />
        <Text style={styles.infoText}>
          <Text style={styles.infoBold}>Official curriculum loaded{"\n"}</Text>
          The attached prospectus contains 167 counted units across 10 terms.
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
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.white,
    borderColor: colors.line,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.white,
  },
  previewName: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
  },
  previewMeta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.primary,
    marginTop: 1,
  },
  previewInstitution: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.muted,
    marginTop: 1,
  },
  fieldBlock: {
    gap: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
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
  programCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  programTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
  },
  programMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  info: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.mint,
    marginTop: 4,
  },
  infoText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.deep,
  },
  infoBold: {
    fontFamily: fonts.bold,
    color: colors.ink,
  },
});