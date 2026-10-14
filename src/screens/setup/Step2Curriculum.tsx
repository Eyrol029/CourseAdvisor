import { StyleSheet, Text, View } from "react-native";
import Icon from "../../components/Icon";
import { curriculum, curriculumUnits } from "../../data/curriculum";
import { colors, fonts, radius } from "../../theme";
import { s } from "./shared";

const yearNames = ["FIRST", "SECOND", "THIRD", "FOURTH"];

export default function Step2Curriculum() {
  return (
    <View style={s.content}>
      <Text style={s.kicker}>BEEd CURRICULUM</Text>
      <Text style={s.h1}>Four years. One clear path.</Text>
      <Text style={s.lead}>
        The official curriculum includes 10 academic terms and two required
        summer terms.
      </Text>

      {[1, 2, 3, 4].map((item) => {
        const terms = curriculum.filter((t) => t.year === item);
        const units = terms.reduce((sum, t) => sum + t.totalUnits, 0);
        const count = terms.reduce((sum, t) => sum + t.courses.length, 0);
        return (
          <View key={item} style={[s.card, styles.yearCard]}>
            <View style={styles.num}>
              <Text style={styles.numText}>0{item}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.small}>{yearNames[item - 1]} YEAR</Text>
              <Text style={styles.units}>{units} units</Text>
              <Text style={styles.sems}>{terms.map((t) => t.semester).join(" · ")}</Text>
            </View>
            <Text style={styles.count}>{count} courses</Text>
          </View>
        );
      })}

      <View style={styles.total}>
        <View style={styles.totalIcon}>
          <Icon name="book" size={21} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.totalSmall}>OFFICIAL PROGRAM TOTAL</Text>
          <Text style={styles.totalMain}>{curriculumUnits} counted units</Text>
        </View>
        <Text style={styles.totalYear}>2025–2026</Text>
      </View>

      <Text style={styles.fine}>
        NST 001 and NST 002 each show (3) units in the prospectus and are
        excluded from semester and curriculum totals.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  yearCard: { flexDirection: "row", alignItems: "center", gap: 12 },
  num: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  numText: { fontFamily: fonts.bold, fontSize: 14, color: colors.primary },
  small: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.5, color: colors.muted },
  units: { fontFamily: fonts.bold, fontSize: 16, color: colors.ink },
  sems: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
  count: { fontFamily: fonts.bold, fontSize: 12, color: colors.primary },
  total: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.deep,
  },
  totalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  totalSmall: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 1.5, color: colors.accent },
  totalMain: { fontFamily: fonts.bold, fontSize: 16, color: colors.white },
  totalYear: { fontFamily: fonts.bold, fontSize: 12, color: colors.accent },
  fine: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 16, color: colors.muted },
});