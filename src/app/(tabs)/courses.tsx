import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CourseRow from "../../components/CourseRow";
import Icon from "../../components/Icon";
import { allCourses, Course } from "../../data/curriculum";
import { prerequisiteGraph } from "../../services/prerequisiteGraph";
import { useAppState } from "../../state/AppState";
import { colors, fonts, radius } from "../../theme";

type FilterStatus = "All" | "Completed" | "Available" | "Blocked";

export default function CoursesScreen() {
  const { completed, toggleCompleted } = useAppState();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("All");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Filter courses
  const filteredCourses = allCourses.filter((course) => {
    // Search match
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      course.code.toLowerCase().includes(q) ||
      course.title.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    // Year match
    if (selectedYear !== null && course.year !== selectedYear) return false;

    // Status match
    const status = prerequisiteGraph.getCourseStatus(course, completed);
    if (filterStatus === "Completed" && status !== "Completed") return false;
    if (filterStatus === "Available" && status !== "Available") return false;
    if (filterStatus === "Blocked" && status !== "Blocked") return false;

    return true;
  });

  const selectedCourseStatus = selectedCourse
    ? prerequisiteGraph.getCourseStatus(selectedCourse, completed)
    : "Blocked";


  const selectedCourseUnlocks = selectedCourse
    ? prerequisiteGraph.getDirectUnlocks(selectedCourse.code)
    : [];

  const isSelectedCourseCompleted = selectedCourse
    ? completed.has(selectedCourse.code)
    : false;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>OFFICIAL CURRICULUM</Text>
          <Text style={styles.headerTitle}>BEEd Prospectus (167 Units)</Text>
        </View>
        <View style={styles.unitBadge}>
          <Text style={styles.unitBadgeText}>53 Subjects</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={18} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by course code or title..."
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <Pressable onPress={() => setSearchQuery("")}>
            <Icon name="close" size={16} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      {/* Year Filter Chips */}
      <View style={styles.yearScrollContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.yearScroll}
        >
          <Pressable
            onPress={() => setSelectedYear(null)}
            style={[styles.yearChip, selectedYear === null && styles.yearChipActive]}
          >
            <Text
              style={[
                styles.yearChipText,
                selectedYear === null && styles.yearChipTextActive,
              ]}
            >
              All Years
            </Text>
          </Pressable>

          {[1, 2, 3, 4].map((yr) => (
            <Pressable
              key={yr}
              onPress={() => setSelectedYear(selectedYear === yr ? null : yr)}
              style={[styles.yearChip, selectedYear === yr && styles.yearChipActive]}
            >
              <Text
                style={[
                  styles.yearChipText,
                  selectedYear === yr && styles.yearChipTextActive,
                ]}
              >
                Year {yr}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Status Filter Chips */}
      <View style={styles.statusFilterRow}>
        {(["All", "Available", "Completed", "Blocked"] as FilterStatus[]).map(
          (st) => (
            <Pressable
              key={st}
              onPress={() => setFilterStatus(st)}
              style={[
                styles.statusFilterChip,
                filterStatus === st && styles.statusFilterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.statusFilterText,
                  filterStatus === st && styles.statusFilterTextActive,
                ]}
              >
                {st}
              </Text>
            </Pressable>
          ),
        )}
      </View>

      {/* Course List */}
      <ScrollView contentContainerStyle={styles.listContainer}>
        <Text style={styles.resultCount}>
          SHOWING {filteredCourses.length} OF {allCourses.length} COURSES
        </Text>

        {filteredCourses.length === 0 ? (
          <View style={styles.emptyResults}>
            <Icon name="search" size={32} color={colors.muted} />
            <Text style={styles.emptyTitle}>No matching courses found</Text>
            <Text style={styles.emptySub}>
              Try adjusting your search terms or filter selection.
            </Text>
          </View>
        ) : (
          filteredCourses.map((course) => (
            <CourseRow
              key={course.code}
              course={course}
              completed={completed}
              onPress={() => setSelectedCourse(course)}
            />
          ))
        )}
      </ScrollView>

      {/* Course Detail Modal */}
      <Modal
        visible={!!selectedCourse}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedCourse(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
          {selectedCourse && (
            <>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalKicker}>COURSE SPECIFICATION</Text>
                  <Text style={styles.modalTitle}>{selectedCourse.code}</Text>
                </View>
                <Pressable
                  onPress={() => setSelectedCourse(null)}
                  style={styles.modalCloseBtn}
                >
                  <Icon name="close" size={18} color={colors.ink} />
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={styles.modalContent}>
                <Text style={styles.courseModalTitle}>{selectedCourse.title}</Text>
                <Text style={styles.courseModalMeta}>
                  {selectedCourse.unitLabel ?? selectedCourse.units} Units · Year{" "}
                  {selectedCourse.year} · Official Prospectus
                </Text>

                {/* Status Toggle Card */}
                <View style={styles.toggleCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.toggleStatusLabel}>CURRENT STATUS</Text>
                    <Text style={styles.toggleStatusValue}>
                      {selectedCourseStatus}
                    </Text>
                  </View>
                  <Pressable
                    style={[
                      styles.toggleActionBtn,
                      isSelectedCourseCompleted
                        ? styles.toggleActionBtnDone
                        : styles.toggleActionBtnMark,
                    ]}
                    onPress={() => toggleCompleted(selectedCourse.code)}
                  >
                    <Icon
                      name={isSelectedCourseCompleted ? "close" : "check"}
                      size={14}
                      color={isSelectedCourseCompleted ? colors.deep : colors.white}
                    />
                    <Text
                      style={[
                        styles.toggleActionText,
                        isSelectedCourseCompleted && { color: colors.deep },
                      ]}
                    >
                      {isSelectedCourseCompleted ? "Mark Incomplete" : "Mark Passed"}
                    </Text>
                  </Pressable>
                </View>

                {/* Prerequisites Requirements */}
                <View style={styles.detailSectionBlock}>
                  <Text style={styles.sectionHeader}>
                    PREREQUISITES ({selectedCourse.prerequisites.length})
                  </Text>
                  {selectedCourse.prerequisites.length === 0 ? (
                    <Text style={styles.sectionEmpty}>
                      None. Can be taken directly in sequence.
                    </Text>
                  ) : (
                    selectedCourse.prerequisites.map((p) => {
                      const isMet = completed.has(p);
                      return (
                        <View key={p} style={styles.prereqRow}>
                          <Icon
                            name={isMet ? "check" : "lock"}
                            size={16}
                            color={isMet ? "#28a745" : "#b76e00"}
                          />
                          <Text style={styles.prereqCode}>{p}</Text>
                          <Text
                            style={[
                              styles.prereqStatus,
                              { color: isMet ? "#28a745" : "#b76e00" },
                            ]}
                          >
                            {isMet ? "Satisfied" : "Missing Requirement"}
                          </Text>
                        </View>
                      );
                    })
                  )}
                </View>

                {/* Downstream Unlocks */}
                <View style={styles.detailSectionBlock}>
                  <Text style={styles.sectionHeader}>
                    UNLOCKED SUBSEQUENT COURSES ({selectedCourseUnlocks.length})
                  </Text>
                  {selectedCourseUnlocks.length === 0 ? (
                    <Text style={styles.sectionEmpty}>
                      No further prerequisites depend on this subject.
                    </Text>
                  ) : (
                    selectedCourseUnlocks.map((u) => (
                      <View key={u.code} style={styles.unlockRow}>
                        <Icon name="arrow" size={14} color={colors.primary} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.unlockCodeText}>{u.code}</Text>
                          <Text style={styles.unlockTitleText} numberOfLines={1}>
                            {u.title}
                          </Text>
                        </View>
                        <Text style={styles.unlockUnitsText}>{u.units}u</Text>
                      </View>
                    ))
                  )}
                </View>
              </ScrollView>
            </>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  kicker: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.primary,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.ink,
  },
  unitBadge: {
    backgroundColor: colors.mint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  unitBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.ink,
  },
  yearScrollContainer: {
    marginTop: 10,
  },
  yearScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  yearChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  yearChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  yearChipText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.ink,
  },
  yearChipTextActive: {
    color: colors.white,
  },
  statusFilterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 8,
    gap: 8,
  },
  statusFilterChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  statusFilterChipActive: {
    backgroundColor: colors.mint,
    borderColor: colors.primary,
  },
  statusFilterText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.muted,
  },
  statusFilterTextActive: {
    color: colors.primary,
  },
  listContainer: {
    padding: 20,
    gap: 8,
    paddingBottom: 40,
  },
  resultCount: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.muted,
    marginBottom: 4,
  },
  emptyResults: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 10,
  },
  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
  },
  emptySub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    textAlign: "center",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  modalKicker: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.primary,
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.ink,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  courseModalTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.ink,
  },
  courseModalMeta: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
  },
  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
  },
  toggleStatusLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.2,
    color: colors.muted,
  },
  toggleStatusValue: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
    marginTop: 2,
  },
  toggleActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
  },
  toggleActionBtnMark: {
    backgroundColor: colors.primary,
  },
  toggleActionBtnDone: {
    backgroundColor: colors.mint,
  },
  toggleActionText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.white,
  },
  detailSectionBlock: {
    backgroundColor: colors.white,
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10,
  },
  sectionHeader: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.muted,
  },
  sectionEmpty: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    fontStyle: "italic",
  },
  prereqRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  prereqCode: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.ink,
    flex: 1,
  },
  prereqStatus: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  unlockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  unlockCodeText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary,
  },
  unlockTitleText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.ink,
  },
  unlockUnitsText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.muted,
  },
});
