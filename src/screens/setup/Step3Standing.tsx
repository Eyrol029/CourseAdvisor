import { Pressable, StyleSheet, Text, View } from "react-native";
import Icon from "../../components/Icon";
import { curriculum } from "../../data/curriculum";
import { colors, fonts, radius } from "../../theme";
import { s } from "./shared";

const semesters = ["First Semester", "Second Semester", "Summer"];
const yearWords = ["First", "Second", "Third", "Fourth"];

export default function Step3Standing({
  year,
  setYear,
  semester,
  setSemester,
}: {
  year: number;
  setYear: (year: number) => void;
  semester: string;
  setSemester: (semester: string) => void;
}) {
  return (
    <View style={s.content}>
      <Text style={s.kicker}>ACADEMIC STANDING</Text>
      <Text style={s.h1}>Where are you right now?</Text>
      <Text style={s.lead}>
        Choose your current year and semester. This does not rearrange the
        official curriculum.
      </Text>

      <Text style={s.fieldLabel}>CURRENT YEAR</Text>
      <View style={styles.grid}>
        {[1, 2, 3, 4].map((item) => (
          <Pressable
            key={item}
            onPress={() => setYear(item)}
            style={[styles.yearBtn, year === item && styles.selected]}
          >
            <Text style={styles.yearSmall}>Year</Text>
            <Text style={styles.yearNum}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={s.fieldLabel}>CURRENT TERM</Text>
      {semesters.map((item) => {
        const units = curriculum.find((t) => t.year === year && t.semester === item)?.totalUnits;
        return (
          <Pressable
            key={item}
            onPress={() => setSemester(item)}
            style={[styles.termBtn, semester === item && styles.selected]}
          >
            <View style={[styles.radio, semester === item && { borderColor: colors.primary }]}>
              {semester === item && <View style={styles.radioDot} />}
            </View>
            <View>
              <Text style={styles.termName}>{item}</Text>
              <Text style={styles.termSub}>
                {item === "Summer"
                  ? "Available in Years 2 and 3"
                  : `${units ?? "—"} prospectus units`}
              </Text>
            </View>
          </Pressable>
        );
      })}

      <View style={styles.summary}>
        <Icon name="calendar" size={20} color={colors.white} />
        <View>
          <Text style={styles.sumSmall}>YOUR CURRENT STANDING</Text>
          <Text style={styles.sumMain}>
            {yearWords[year - 1]} Year · {semester}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", gap: 10 },
  yearBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  selected: { borderColor: colors.primary, backgroundColor: colors.mint },
  yearSmall: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
  yearNum: { fontFamily: fonts.bold, fontSize: 22, color: colors.ink },
  termBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.white,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  termName: { fontFamily: fonts.bold, fontSize: 15, color: colors.ink },
  termSub: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  sumSmall: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.5, color: colors.mint },
  sumMain: { fontFamily: fonts.bold, fontSize: 15, color: colors.white },
});