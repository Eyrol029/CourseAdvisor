import { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Defs, Path, Pattern, Rect } from "react-native-svg";
import Icon from "../../components/Icon";
import { allCourses, curriculum } from "../../data/curriculum";
import { prerequisiteGraph } from "../../services/prerequisiteGraph";
import {
  RecommendedCourse,
  roadmapGenerator,
  RoadmapTerm,
} from "../../services/roadmapGenerator";
import { SavedRoadmap } from "../../services/storage";
import { useAppState } from "../../state/AppState";
import { colors, fonts, radius } from "../../theme";

type RoadmapTabMode = "plan" | "graph";

const NODE_WIDTH = 145;
const NODE_HEIGHT = 70;
const CANVAS_WIDTH = 910;
const CANVAS_HEIGHT = 840;

// Coordinate positions for each DAG node
const DAG_COORDINATES: Record<string, { x: number; y: number }> = {
  // Tier 0 (Foundations - y: 40)
  "CPE 100": { x: 50, y: 40 },
  "CPE 101": { x: 265, y: 40 },
  "GEC 110": { x: 480, y: 40 },
  "PED 011": { x: 695, y: 40 },

  // Tier 1 (1st Level - y: 175)
  "CPE 104": { x: 20, y: 175 },
  "CPE 102": { x: 195, y: 175 },
  "CPE 105": { x: 370, y: 175 },
  "GED 103": { x: 545, y: 175 },
  "PED 012": { x: 720, y: 175 },

  // Tier 2 (2nd Level - y: 310)
  "CPE 106": { x: 20, y: 310 },
  "CPE 108": { x: 195, y: 310 },
  "CPE 109": { x: 370, y: 310 },
  "CPE 110": { x: 545, y: 310 },
  "CPE 107": { x: 720, y: 310 },

  // Tier 3 (3rd Level - y: 445)
  "CPE 103": { x: 20, y: 445 },
  "GED 105": { x: 195, y: 445 },
  "GED 104": { x: 370, y: 445 },
  "GED 198": { x: 545, y: 445 },
  "PED 014": { x: 720, y: 445 },

  // Tier 4 (Field Studies & Thesis - y: 580)
  "ELC 101": { x: 175, y: 580 },
  "ELC 102": { x: 375, y: 580 },
  "GED 199": { x: 575, y: 580 },

  // Tier 5 (Capstone Internship - y: 715)
  "ELC 197": { x: 275, y: 715 },
};

// Node metadata for the graph
const DAG_NODE_DATA: {
  code: string;
  title: string;
  prereqs: number;
}[] = [
  { code: "CPE 100", title: "Child & Adolescent Learners", prereqs: 0 },
  { code: "CPE 101", title: "The Teaching Profession", prereqs: 0 },
  { code: "GEC 110", title: "History of Muslim Filipinos", prereqs: 0 },
  { code: "PED 011", title: "PATHFit 1: Movement", prereqs: 0 },
  { code: "CPE 104", title: "Learner-Centered Teaching", prereqs: 1 },
  { code: "CPE 102", title: "Teacher & the Community", prereqs: 1 },
  { code: "CPE 105", title: "Assessment in Learning 1", prereqs: 1 },
  { code: "GED 103", title: "Teaching Social Studies", prereqs: 1 },
  { code: "PED 012", title: "PATHFit 2: Fitness", prereqs: 1 },
  { code: "CPE 106", title: "Assessment in Learning 2", prereqs: 1 },
  { code: "CPE 108", title: "Teacher & Curriculum", prereqs: 2 },
  { code: "CPE 109", title: "Building New Literacies", prereqs: 2 },
  { code: "CPE 110", title: "School-Community Linkages", prereqs: 2 },
  { code: "CPE 107", title: "Technology for Teaching 1", prereqs: 1 },
  { code: "CPE 103", title: "Inclusive & Special Education", prereqs: 1 },
  { code: "GED 105", title: "Tech for Teaching Elem", prereqs: 1 },
  { code: "GED 104", title: "Teaching Social Studies 2", prereqs: 1 },
  { code: "GED 198", title: "Research in Education", prereqs: 1 },
  { code: "PED 014", title: "PATHFit 4: Sports", prereqs: 1 },
  { code: "ELC 101", title: "Field Study 1", prereqs: 4 },
  { code: "ELC 102", title: "Field Study 2", prereqs: 4 },
  { code: "GED 199", title: "Undergraduate Thesis", prereqs: 1 },
  { code: "ELC 197", title: "Teaching Internship", prereqs: 2 },
];

// 29 Actual Prerequisite dependency connections
const DAG_EDGES: { from: string; to: string }[] = [
  { from: "CPE 100", to: "CPE 104" },
  { from: "CPE 100", to: "CPE 105" },
  { from: "CPE 100", to: "CPE 107" },
  { from: "CPE 100", to: "CPE 103" },
  { from: "CPE 101", to: "CPE 102" },
  { from: "CPE 101", to: "CPE 108" },
  { from: "CPE 101", to: "CPE 109" },
  { from: "CPE 101", to: "CPE 110" },
  { from: "CPE 102", to: "CPE 108" },
  { from: "CPE 102", to: "CPE 109" },
  { from: "CPE 102", to: "CPE 110" },
  { from: "GEC 110", to: "GED 103" },
  { from: "GED 103", to: "GED 104" },
  { from: "PED 011", to: "PED 012" },
  { from: "PED 012", to: "PED 014" },
  { from: "CPE 105", to: "CPE 106" },
  { from: "CPE 106", to: "GED 198" },
  { from: "GED 198", to: "GED 199" },
  { from: "CPE 107", to: "GED 105" },
  { from: "CPE 103", to: "ELC 101" },
  { from: "CPE 104", to: "ELC 101" },
  { from: "CPE 106", to: "ELC 101" },
  { from: "CPE 107", to: "ELC 101" },
  { from: "CPE 103", to: "ELC 102" },
  { from: "CPE 104", to: "ELC 102" },
  { from: "CPE 106", to: "ELC 102" },
  { from: "CPE 107", to: "ELC 102" },
  { from: "ELC 101", to: "ELC 197" },
  { from: "ELC 102", to: "ELC 197" },
];

export default function RoadmapScreen() {
  const {
    completed,
    standing,
    confidence,
    profile,
    savedRoadmaps,
    saveCurrentRoadmap,
    deleteRoadmap,
  } = useAppState();

  const [activeTab, setActiveTab] = useState<RoadmapTabMode>("graph");
  const [expandedTerms, setExpandedTerms] = useState<Record<string, boolean>>({
    y1s2: true,
    y2s1: true,
  });
  const [zoomScale, setZoomScale] = useState(1);
  const [selectedCourseCode, setSelectedCourseCode] = useState<string | null>(
    null,
  );

  // Active roadmap state (allows student to reorder/move courses with Kahn's validation)
  const defaultRoadmap = useMemo(
    () => roadmapGenerator.generate(completed, standing, confidence).roadmap,
    [completed, standing, confidence],
  );
  const [customRoadmap, setCustomRoadmap] = useState<RoadmapTerm[] | null>(null);
  const currentRoadmap = customRoadmap ?? defaultRoadmap;

  const [movingCourse, setMovingCourse] = useState<{
    course: RecommendedCourse;
    fromTermIndex: number;
  } | null>(null);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSavedListModal, setShowSavedListModal] = useState(false);
  const [planName, setPlanName] = useState("My Primary BEEd Roadmap");

  const toggleTerm = (termId: string) => {
    setExpandedTerms((prev) => ({
      ...prev,
      [termId]: !prev[termId],
    }));
  };

  // Execute course move between terms with topological validation (Section 6 & 7)
  const handleExecuteMove = (destinationTermIndex: number) => {
    if (!movingCourse) return;

    const res = roadmapGenerator.moveCourseBetweenTerms(
      currentRoadmap,
      movingCourse.course.code,
      movingCourse.fromTermIndex,
      destinationTermIndex,
      confidence,
    );

    if (!res.success) {
      Alert.alert("Constraint Violation", res.error ?? "Invalid schedule move.");
    } else if (res.updatedRoadmap) {
      setCustomRoadmap(res.updatedRoadmap);
      setMovingCourse(null);
      Alert.alert("Success", `${movingCourse.course.code} moved successfully.`);
    }
  };

  // Reset to algorithm recommended
  const handleResetToDefault = () => {
    setCustomRoadmap(null);
    Alert.alert("Reset Complete", "Roadmap reset to recommended sequence.");
  };

  const handleSavePlan = async () => {
    if (!planName.trim()) {
      Alert.alert("Please provide a name for this roadmap.");
      return;
    }
    await saveCurrentRoadmap(planName.trim(), currentRoadmap);
    setShowSaveModal(false);
    Alert.alert("Success", "Academic roadmap saved to local storage!");
  };

  // Compute units
  let earnedUnits = 0;
  for (const term of curriculum) {
    for (const c of term.courses) {
      if (completed.has(c.code) && c.counted !== false) {
        earnedUnits += c.units;
      }
    }
  }

  const selectedCourse = selectedCourseCode
    ? allCourses.find((c) => c.code === selectedCourseCode)
    : null;

  const selectedCourseUnlocks = selectedCourse
    ? prerequisiteGraph.getDirectUnlocks(selectedCourse.code)
    : [];

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>PREREQUISITE-SAFE PLAN</Text>
          <Text style={styles.title}>My BEEd Roadmap</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            style={styles.actionIconBtn}
            onPress={() => setShowSavedListModal(true)}
          >
            <Icon name="book" size={18} color={colors.primary} />
          </Pressable>
          <Pressable
            style={[styles.actionIconBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowSaveModal(true)}
          >
            <Icon name="check" size={18} color={colors.white} />
          </Pressable>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(profile.name)}</Text>
            <View style={styles.avatarDot} />
          </View>
        </View>
      </View>

      {/* Segmented Control: Semester plan | Prerequisite graph */}
      <View style={styles.segmentedContainer}>
        <Pressable
          style={[
            styles.segmentBtn,
            activeTab === "plan" && styles.segmentBtnActive,
          ]}
          onPress={() => setActiveTab("plan")}
        >
          <Text
            style={[
              styles.segmentText,
              activeTab === "plan" && styles.segmentTextActive,
            ]}
          >
            Semester plan
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.segmentBtn,
            activeTab === "graph" && styles.segmentBtnActive,
          ]}
          onPress={() => setActiveTab("graph")}
        >
          <Text
            style={[
              styles.segmentText,
              activeTab === "graph" && styles.segmentTextActive,
            ]}
          >
            Prerequisite graph
          </Text>
        </Pressable>
      </View>

      {/* ========================================================= */}
      {/* OPTION 1: SEMESTER PLAN MODE                              */}
      {/* ========================================================= */}
      {activeTab === "plan" && (
        <ScrollView
          contentContainerStyle={styles.planScroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary Card with Dynamic Workload Gauge */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>COMPLETED</Text>
              <Text style={styles.summaryVal}>
                {earnedUnits} <Text style={styles.summarySub}>/ 167 units</Text>
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>PLAN LENGTH</Text>
              <Text style={styles.summaryVal}>
                {currentRoadmap.length} terms remaining
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            <View style={styles.summaryCol}>
              <Text style={styles.summaryLabel}>STATUS</Text>
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusVal}>On track</Text>
              </View>
            </View>
          </View>

          {/* Re-order Guidance Bar */}
          <View style={styles.reorderBar}>
            <Icon name="spark" size={14} color={colors.primary} />
            <Text style={styles.reorderBarText}>
              Tap &apos;Move&apos; on any subject to adjust terms with real-time prerequisite validation.
            </Text>
            <Pressable onPress={handleResetToDefault}>
              <Text style={styles.reorderResetText}>Reset</Text>
            </Pressable>
          </View>

          {/* List of Terms (Accordions) */}
          {currentRoadmap.map((term, index) => {
            const isExpanded = expandedTerms[term.termId] ?? false;
            const termNumber = index + 1;
            const gaugeHex = term.fuzzyAnalysis.gaugeHex;

            return (
              <View key={term.termId} style={styles.termCard}>
                {/* Term Header */}
                <Pressable
                  style={styles.termHead}
                  onPress={() => toggleTerm(term.termId)}
                >
                  <View style={styles.termNumberBadge}>
                    <Text style={styles.termNumberText}>{termNumber}</Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.termKicker}>TERM {termNumber}</Text>
                    <Text style={styles.termTitle}>{term.label}</Text>
                  </View>

                  <View style={styles.termRight}>
                    <Text style={styles.termUnitsText}>
                      {term.totalUnits} units
                    </Text>
                    {/* Dynamic Workload Gauge Meter */}
                    <View style={styles.gaugePill}>
                      <View
                        style={[
                          styles.gaugeCircle,
                          { backgroundColor: gaugeHex },
                        ]}
                      />
                      <Text style={[styles.gaugeText, { color: gaugeHex }]}>
                        {term.fuzzyAnalysis.stressLevel}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.chevron,
                      isExpanded && { transform: [{ rotate: "180deg" }] },
                    ]}
                  >
                    <Icon name="chevron" size={16} color={colors.ink} />
                  </View>
                </Pressable>

                {/* Term Courses List when Expanded */}
                {isExpanded && (
                  <View style={styles.coursesContainer}>
                    {term.courses.map((course: RecommendedCourse) => {
                      const prefix = course.code.split(" ")[0];
                      const isDone = completed.has(course.code);

                      return (
                        <View key={course.code} style={styles.courseRow}>
                          {/* Prefix square badge */}
                          <View style={styles.prefixBadge}>
                            <Text style={styles.prefixText}>{prefix}</Text>
                          </View>

                          {/* Middle content */}
                          <Pressable
                            style={{ flex: 1, gap: 2 }}
                            onPress={() => setSelectedCourseCode(course.code)}
                          >
                            <Text style={styles.courseCode}>{course.code}</Text>
                            <Text style={styles.courseTitle} numberOfLines={2}>
                              {course.title}
                            </Text>
                            <Text style={styles.coursePrereq}>
                              {course.prerequisites.length > 0
                                ? `Prerequisite: ${course.prerequisites.join(" + ")}`
                                : "Prerequisite: None"}
                            </Text>
                            <Text style={styles.rationaleLine} numberOfLines={1}>
                              {course.rationale}
                            </Text>
                          </Pressable>

                          {/* Right units & actions */}
                          <View style={styles.courseRight}>
                            <Text style={styles.courseUnits}>
                              {course.unitLabel ?? course.units} units
                            </Text>
                            <View style={styles.rowActions}>
                              <Pressable
                                style={styles.moveBtn}
                                onPress={() =>
                                  setMovingCourse({
                                    course,
                                    fromTermIndex: index,
                                  })
                                }
                              >
                                <Text style={styles.moveBtnText}>Move</Text>
                              </Pressable>
                              <View
                                style={[
                                  styles.recBadge,
                                  isDone && styles.doneBadge,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.recBadgeText,
                                    isDone && styles.doneBadgeText,
                                  ]}
                                >
                                  {isDone ? "Done" : "Recommended"}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ========================================================= */}
      {/* OPTION 2: PREREQUISITE GRAPH MODE                         */}
      {/* ========================================================= */}
      {activeTab === "graph" && (
        <View style={styles.graphContainer}>
          {/* Legend Row */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: colors.ink }]}
              />
              <Text style={styles.legendText}>Completed</Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: colors.accent }]}
              />
              <Text style={styles.legendText}>Recommended</Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: colors.deep }]}
              />
              <Text style={styles.legendText}>Prerequisite required</Text>
            </View>
          </View>

          {/* Interactive Graph Canvas Card */}
          <View style={styles.canvasCard}>
            {/* Top pill: Drag to pan · tap to inspect */}
            <View style={styles.dragPill}>
              <Icon name="compass" size={14} color={colors.ink} />
              <Text style={styles.dragPillText}>
                Drag to pan · tap to inspect
              </Text>
            </View>

            {/* Scrollable DAG Area */}
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                  width: CANVAS_WIDTH * zoomScale,
                  height: CANVAS_HEIGHT * zoomScale,
                }}
                showsVerticalScrollIndicator={false}
              >
                <View
                  style={{
                    width: CANVAS_WIDTH,
                    height: CANVAS_HEIGHT,
                    transform: [{ scale: zoomScale }],
                    position: "relative",
                  }}
                >
                  {/* SVG Canvas for Grid Dots and Road Lines */}
                  <Svg
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: CANVAS_WIDTH,
                      height: CANVAS_HEIGHT,
                    }}
                  >
                    {/* Dotted Grid Pattern */}
                    <Defs>
                      <Pattern
                        id="dotGrid"
                        x="0"
                        y="0"
                        width="20"
                        height="20"
                        patternUnits="userSpaceOnUse"
                      >
                        <Circle
                          cx="10"
                          cy="10"
                          r="1.2"
                          fill="#cbd5e1"
                          opacity={0.65}
                        />
                      </Pattern>
                    </Defs>

                    {/* Canvas Background with Dotted Pattern */}
                    <Rect width="100%" height="100%" fill="url(#dotGrid)" />

                    {/* Prerequisite Connection Road Lines (Rendered directly) */}
                    {DAG_EDGES.map((edge) => {
                      const pFrom = DAG_COORDINATES[edge.from];
                      const pTo = DAG_COORDINATES[edge.to];
                      if (!pFrom || !pTo) return null;

                      // Start at center bottom of prerequisite node
                      const x1 = pFrom.x + NODE_WIDTH / 2;
                      const y1 = pFrom.y + NODE_HEIGHT;

                      // End at center top of target node
                      const x2 = pTo.x + NODE_WIDTH / 2;
                      const y2 = pTo.y;

                      const dy = y2 - y1;
                      const isDone = completed.has(edge.from);
                      const strokeColor = isDone ? "#31487A" : "#64748B";

                      // Smooth Bezier Curve Path
                      const pathData = `M ${x1} ${y1} C ${x1} ${y1 + dy * 0.45}, ${x2} ${y2 - dy * 0.45}, ${x2} ${y2}`;

                      return (
                        <Path
                          key={`line-${edge.from}-${edge.to}`}
                          d={pathData}
                          stroke={strokeColor}
                          strokeWidth={isDone ? 2.5 : 2}
                          strokeDasharray={[6, 4]}
                          fill="none"
                        />
                      );
                    })}

                    {/* Connector Dots at End Points */}
                    {DAG_EDGES.map((edge) => {
                      const pFrom = DAG_COORDINATES[edge.from];
                      const pTo = DAG_COORDINATES[edge.to];
                      if (!pFrom || !pTo) return null;

                      const x2 = pTo.x + NODE_WIDTH / 2;
                      const y2 = pTo.y;

                      const isDone = completed.has(edge.from);
                      const strokeColor = isDone ? "#31487A" : "#64748B";

                      return (
                        <Circle
                          key={`dot-end-${edge.from}-${edge.to}`}
                          cx={x2}
                          cy={y2}
                          r={4}
                          fill={strokeColor}
                        />
                      );
                    })}
                  </Svg>

                  {/* Render Node Cards placed at Exact Coordinates */}
                  {DAG_NODE_DATA.map((node) => {
                    const pos = DAG_COORDINATES[node.code];
                    if (!pos) return null;

                    const isDone = completed.has(node.code);
                    const isEligible = prerequisiteGraph.evaluateEligibility(
                      node.code,
                      completed,
                    ).isEligible;

                    const statusBadge = isDone
                      ? "Completed"
                      : isEligible
                        ? "Recommended"
                        : "Prerequisite required";

                    return (
                      <Pressable
                        key={node.code}
                        style={[
                          styles.dagNodeCard,
                          {
                            position: "absolute",
                            left: pos.x,
                            top: pos.y,
                            width: NODE_WIDTH,
                            height: NODE_HEIGHT,
                          },
                          isDone && styles.dagNodeDone,
                        ]}
                        onPress={() => setSelectedCourseCode(node.code)}
                      >
                        {/* Top Badges */}
                        <View style={styles.dagNodeHeader}>
                          {node.prereqs > 0 ? (
                            <View style={styles.prereqPill}>
                              <Text style={styles.prereqPillText}>
                                {node.prereqs} prereqs
                              </Text>
                            </View>
                          ) : (
                            <View style={{ width: 10 }} />
                          )}

                          <View
                            style={[
                              styles.nodeStatusPill,
                              isDone
                                ? styles.nodeStatusDone
                                : isEligible
                                  ? styles.nodeStatusRec
                                  : styles.nodeStatusReq,
                            ]}
                          >
                            <Text
                              style={[
                                styles.nodeStatusText,
                                isDone && { color: colors.white },
                              ]}
                            >
                              {isDone ? "✓ Done" : statusBadge}
                            </Text>
                          </View>
                        </View>

                        {/* Node Code & Title */}
                        <Text style={styles.dagNodeCode}>{node.code}</Text>
                        <Text style={styles.dagNodeTitle} numberOfLines={1}>
                          {node.title}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            </ScrollView>

            {/* Bottom-right Zoom Controls */}
            <View style={styles.zoomControls}>
              <Pressable
                style={styles.zoomBtn}
                onPress={() => setZoomScale((z) => Math.min(1.4, z + 0.1))}
              >
                <Icon name="plus" size={16} color={colors.ink} />
              </Pressable>
              <Pressable
                style={styles.zoomBtn}
                onPress={() => setZoomScale((z) => Math.max(0.7, z - 0.1))}
              >
                <Icon name="minus" size={16} color={colors.ink} />
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* ========================================================= */}
      {/* INTERACTIVE CONSTRAINT RE-ORDERING MODAL                  */}
      {/* ========================================================= */}
      <Modal
        visible={!!movingCourse}
        transparent
        animationType="slide"
        onRequestClose={() => setMovingCourse(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dialogCard}>
            {movingCourse && (
              <>
                <Text style={styles.dialogTitle}>Move Course Schedule</Text>
                <Text style={styles.dialogSub}>
                  Select a new semester for{" "}
                  <Text style={{ fontFamily: fonts.bold }}>
                    {movingCourse.course.code} ({movingCourse.course.title})
                  </Text>
                  . Pacing is checked in real-time against prerequisite constraints.
                </Text>

                <ScrollView style={{ maxHeight: 240 }}>
                  {currentRoadmap.map((term, tIdx) => {
                    const isCurrent = tIdx === movingCourse.fromTermIndex;
                    return (
                      <Pressable
                        key={term.termId}
                        style={[
                          styles.termSelectRow,
                          isCurrent && styles.termSelectRowCurrent,
                        ]}
                        onPress={() => handleExecuteMove(tIdx)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.termSelectTitle}>
                            Term {tIdx + 1}: {term.label}
                          </Text>
                          <Text style={styles.termSelectSub}>
                            {term.totalUnits} units current load
                          </Text>
                        </View>
                        {isCurrent ? (
                          <Text style={styles.termCurrentLabel}>Current</Text>
                        ) : (
                          <Icon name="arrow" size={14} color={colors.primary} />
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <Pressable
                  style={[styles.dialogBtn, styles.dialogBtnCancel, { marginTop: 12 }]}
                  onPress={() => setMovingCourse(null)}
                >
                  <Text style={styles.dialogBtnCancelText}>Cancel</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* SAVE ROADMAP MODAL                                        */}
      {/* ========================================================= */}
      <Modal
        visible={showSaveModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>Save Academic Roadmap</Text>
            <Text style={styles.dialogSub}>
              Save this personalized plan to your local device storage.
            </Text>
            <TextInput
              style={styles.dialogInput}
              value={planName}
              onChangeText={setPlanName}
              placeholder="Roadmap Name"
            />
            <View style={styles.dialogButtons}>
              <Pressable
                style={[styles.dialogBtn, styles.dialogBtnCancel]}
                onPress={() => setShowSaveModal(false)}
              >
                <Text style={styles.dialogBtnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.dialogBtn, styles.dialogBtnSave]}
                onPress={handleSavePlan}
              >
                <Text style={styles.dialogBtnSaveText}>Save Plan</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* SAVED PLANS LIST MODAL                                    */}
      {/* ========================================================= */}
      <Modal
        visible={showSavedListModal}
        presentationStyle="pageSheet"
        animationType="slide"
        onRequestClose={() => setShowSavedListModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Saved Roadmaps</Text>
            <Pressable
              onPress={() => setShowSavedListModal(false)}
              style={styles.modalCloseBtn}
            >
              <Icon name="close" size={18} color={colors.ink} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
            {savedRoadmaps.length === 0 ? (
              <Text style={styles.emptySavedText}>
                No saved roadmaps yet. Tap the checkmark icon to save your current plan.
              </Text>
            ) : (
              savedRoadmaps.map((r: SavedRoadmap) => (
                <View key={r.id} style={styles.savedCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.savedCardTitle}>{r.name}</Text>
                    <Text style={styles.savedCardMeta}>
                      Saved on {r.createdAt} · {r.terms.length} terms scheduled
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => deleteRoadmap(r.id)}
                    style={styles.deleteBtn}
                  >
                    <Icon name="close" size={16} color={colors.muted} />
                  </Pressable>
                </View>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ========================================================= */}
      {/* COURSE INSPECTION MODAL                                   */}
      {/* ========================================================= */}
      <Modal
        visible={!!selectedCourse}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedCourseCode(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selectedCourse && (
              <>
                <View style={styles.modalTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalCourseCode}>
                      {selectedCourse.code}
                    </Text>
                    <Text style={styles.modalCourseTitle}>
                      {selectedCourse.title}
                    </Text>
                  </View>
                  <Pressable
                    style={styles.modalCloseBtn}
                    onPress={() => setSelectedCourseCode(null)}
                  >
                    <Icon name="close" size={18} color={colors.ink} />
                  </Pressable>
                </View>

                <Text style={styles.modalUnits}>
                  {selectedCourse.unitLabel ?? selectedCourse.units} Units ·
                  Year {selectedCourse.year} · Historical Difficulty:{" "}
                  {selectedCourse.difficulty ?? 6}/10
                </Text>

                <View style={styles.modalDivider} />

                {/* Backward Requirements */}
                <Text style={styles.sectionTitleModal}>
                  PREREQUISITE DEPENDENCIES (
                  {selectedCourse.prerequisites.length})
                </Text>
                {selectedCourse.prerequisites.length === 0 ? (
                  <Text style={styles.emptyTextModal}>
                    None. This course has no prerequisites.
                  </Text>
                ) : (
                  <View style={styles.modalPrereqList}>
                    {selectedCourse.prerequisites.map((p) => {
                      const isMet = completed.has(p);
                      return (
                        <View key={p} style={styles.modalPrereqRow}>
                          <Icon
                            name={isMet ? "check" : "lock"}
                            size={14}
                            color={isMet ? "#28a745" : "#b76e00"}
                          />
                          <Text style={styles.modalPrereqCode}>{p}</Text>
                          <Text
                            style={[
                              styles.modalPrereqStatus,
                              { color: isMet ? "#28a745" : "#b76e00" },
                            ]}
                          >
                            {isMet ? "Satisfied" : "Unfulfilled"}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Downstream Unlocks */}
                <Text style={[styles.sectionTitleModal, { marginTop: 10 }]}>
                  UNLOCKED COURSES ({selectedCourseUnlocks.length})
                </Text>
                {selectedCourseUnlocks.length === 0 ? (
                  <Text style={styles.emptyTextModal}>
                    Terminal subject in its sequence.
                  </Text>
                ) : (
                  <View style={styles.unlocksMiniList}>
                    {selectedCourseUnlocks.map((u) => (
                      <View key={u.code} style={styles.unlockMiniItem}>
                        <Text style={styles.unlockMiniCode}>{u.code}</Text>
                        <Text style={styles.unlockMiniTitle} numberOfLines={1}>
                          {u.title}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <Pressable
                  style={styles.modalActionBtn}
                  onPress={() => setSelectedCourseCode(null)}
                >
                  <Text style={styles.modalActionBtnText}>Close</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
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
    color: colors.muted,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 26,
    color: colors.ink,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.primary,
  },
  avatarDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.white,
  },
  segmentedContainer: {
    flexDirection: "row",
    backgroundColor: "#e8eff7",
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 14,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.muted,
  },
  segmentTextActive: {
    fontFamily: fonts.bold,
    color: colors.ink,
  },
  planScroll: {
    padding: 20,
    gap: 14,
    paddingBottom: 40,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
  },
  summaryCol: { flex: 1, alignItems: "center" },
  summaryLabel: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: colors.muted,
  },
  summaryVal: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.ink,
    marginTop: 4,
    textAlign: "center",
  },
  summarySub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.muted,
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.line,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  statusVal: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.ink,
  },
  reorderBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.mint,
    padding: 10,
    borderRadius: radius.sm,
  },
  reorderBarText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.deep,
  },
  reorderResetText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primary,
    textDecorationLine: "underline",
  },
  termCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
  },
  termHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  termNumberBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  termNumberText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.deep,
  },
  termKicker: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 1.2,
    color: colors.muted,
  },
  termTitle: {
    fontFamily: fonts.bold,
    fontSize: 15,
    color: colors.ink,
    marginTop: 2,
  },
  termRight: {
    alignItems: "flex-end",
  },
  termUnitsText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
  },
  gaugePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  gaugeCircle: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  gaugeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
  },
  chevron: {
    paddingLeft: 4,
  },
  coursesContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  courseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  prefixBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  prefixText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.primary,
  },
  courseCode: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primary,
  },
  courseTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.ink,
  },
  coursePrereq: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  rationaleLine: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.muted,
    fontStyle: "italic",
    marginTop: 2,
  },
  courseRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  courseUnits: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.ink,
  },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  moveBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: "#e8effe",
  },
  moveBtnText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.primary,
  },
  recBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "#dbe8fa",
  },
  recBadgeText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: "#274b87",
  },
  doneBadge: {
    backgroundColor: "#d4edda",
  },
  doneBadgeText: {
    color: "#155724",
  },
  graphContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 12,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.muted,
  },
  canvasCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
  },
  dragPill: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  dragPillText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.ink,
  },
  dagNodeCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    padding: 9,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  dagNodeDone: {
    borderColor: colors.accent,
    backgroundColor: "#f7faff",
  },
  dagNodeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  prereqPill: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    backgroundColor: colors.mint,
  },
  prereqPillText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    color: colors.primary,
  },
  nodeStatusPill: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nodeStatusRec: {
    backgroundColor: "#dbe8fa",
  },
  nodeStatusReq: {
    backgroundColor: "#eef2f7",
  },
  nodeStatusDone: {
    backgroundColor: colors.primary,
  },
  nodeStatusText: {
    fontFamily: fonts.bold,
    fontSize: 8,
    color: colors.deep,
  },
  dagNodeCode: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primary,
    marginTop: 2,
  },
  dagNodeTitle: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: colors.ink,
  },
  zoomControls: {
    position: "absolute",
    bottom: 16,
    right: 16,
    gap: 8,
    zIndex: 10,
  },
  zoomBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  dialogCard: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 20,
    gap: 12,
  },
  dialogTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.ink,
  },
  dialogSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
  },
  dialogInput: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.sm,
    padding: 12,
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  dialogButtons: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  dialogBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  dialogBtnCancel: {
    backgroundColor: colors.line,
  },
  dialogBtnCancelText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.muted,
  },
  dialogBtnSave: {
    backgroundColor: colors.primary,
  },
  dialogBtnSaveText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.white,
  },
  termSelectRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: radius.sm,
    backgroundColor: "#f4f7fc",
    marginBottom: 8,
  },
  termSelectRowCurrent: {
    backgroundColor: colors.mint,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  termSelectTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.ink,
  },
  termSelectSub: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.muted,
  },
  termCurrentLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primary,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  modalTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
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
  emptySavedText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
    marginTop: 30,
  },
  savedCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  savedCardTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
  },
  savedCardMeta: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 8,
  },
  modalCard: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 20,
    gap: 10,
  },
  modalTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  modalCourseCode: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primary,
  },
  modalCourseTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
    marginTop: 2,
  },
  modalUnits: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
  },
  modalDivider: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: 4,
  },
  sectionTitleModal: {
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.muted,
  },
  emptyTextModal: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    fontStyle: "italic",
  },
  modalPrereqList: {
    gap: 6,
  },
  modalPrereqRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modalPrereqCode: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.ink,
    flex: 1,
  },
  modalPrereqStatus: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  unlocksMiniList: {
    gap: 6,
  },
  unlockMiniItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f4f7fc",
    padding: 6,
    borderRadius: 6,
  },
  unlockMiniCode: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.primary,
  },
  unlockMiniTitle: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.ink,
    flex: 1,
  },
  modalActionBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: radius.sm,
    alignItems: "center",
    marginTop: 10,
  },
  modalActionBtnText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.white,
  },
});
