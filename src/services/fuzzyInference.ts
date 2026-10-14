/**
 * Mamdani Fuzzy Inference System for Workload Evaluation and Predicted Academic Stress
 * Specification: Section 3.2 & Section 6 (Dynamic Workload Gauge)
 * 
 * Pipeline:
 * 1. Fuzzification:
 *    - Student Confidence (1–10) -> [Low, Medium, High]
 *    - Subject Difficulty (1–10) -> [Low, Medium, High]
 *    - Credit Units (3–27) -> [Light, Moderate, Heavy]
 * 2. Rule Evaluation: Min (AND) operator across 27 IF-THEN rules
 * 3. Aggregation: Max (OR) operator combining output membership shapes
 * 4. Defuzzification: Centroid Method (Center of Gravity) converting to crisp 0-100 score
 * 5. Dynamic Workload Gauge: Green (Optimal) / Amber (Manageable) / Red (Critical)
 */

export type DynamicGaugeStatus = "green" | "amber" | "red";

export type FuzzyStressResult = {
  stressScore: number;            // 0 - 100 Crisp Stress Index
  stressLevel: "Low" | "Moderate" | "High" | "Critical";
  gaugeStatus: DynamicGaugeStatus; // Green / Amber / Red
  gaugeHex: string;               // Color code for UI gauge
  suitabilityScore: number;       // 0 - 100
  suitability: "Optimal" | "Manageable" | "Strenuous" | "Overloaded";
  recommendedUnitsMax: number;
  explanation: string;
  disclaimer: string;
};

// Triangular membership function: [a, b, c]
function trimf(x: number, a: number, b: number, c: number): number {
  if (x <= a || x >= c) return 0;
  if (x === b) return 1;
  if (x < b) return (x - a) / (b - a);
  return (c - x) / (c - b);
}

// Trapezoidal membership function: [a, b, c, d]
function trapmf(x: number, a: number, b: number, c: number, d: number): number {
  if (x <= a || x >= d) return 0;
  if (x >= b && x <= c) return 1;
  if (x < b) return (x - a) / (b - a);
  return (d - x) / (d - c);
}

export class MamdaniFuzzySystem {
  // Input 1: Confidence (1 - 10)
  private getConfidenceMemberships(c: number) {
    return {
      low: trapmf(c, 1, 1, 3, 5),
      medium: trimf(c, 3.5, 6, 8),
      high: trapmf(c, 6.5, 8.5, 10, 10),
    };
  }

  // Input 2: Perceived Difficulty (1 - 10)
  private getDifficultyMemberships(d: number) {
    return {
      low: trapmf(d, 1, 1, 3, 5),
      medium: trimf(d, 3.5, 6, 8),
      high: trapmf(d, 6.5, 8.5, 10, 10),
    };
  }

  // Input 3: Credit Units (3 - 27)
  private getUnitsMemberships(u: number) {
    return {
      light: trapmf(u, 3, 3, 12, 16),
      moderate: trimf(u, 14, 18.5, 23),
      heavy: trapmf(u, 21, 24, 27, 27),
    };
  }

  // Output 1: Stress Universe [0 - 100]
  private stressMembership(y: number, term: "low" | "moderate" | "high" | "critical"): number {
    switch (term) {
      case "low":
        return trapmf(y, 0, 0, 20, 40);
      case "moderate":
        return trimf(y, 25, 45, 65);
      case "high":
        return trimf(y, 55, 75, 90);
      case "critical":
        return trapmf(y, 75, 90, 100, 100);
    }
  }

  // Output 2: Suitability Universe [0 - 100]
  private suitabilityMembership(y: number, term: "overloaded" | "strenuous" | "manageable" | "optimal"): number {
    switch (term) {
      case "overloaded":
        return trapmf(y, 0, 0, 20, 40);
      case "strenuous":
        return trimf(y, 25, 45, 65);
      case "manageable":
        return trimf(y, 50, 70, 85);
      case "optimal":
        return trapmf(y, 70, 85, 100, 100);
    }
  }

  /**
   * Evaluates workload and predicted stress using 27 Mamdani rules and Centroid defuzzification.
   */
  public evaluate(confidence: number, difficulty: number, units: number): FuzzyStressResult {
    const c = Math.max(1, Math.min(10, confidence));
    const d = Math.max(1, Math.min(10, difficulty));
    const u = Math.max(3, Math.min(27, units));

    const conf = this.getConfidenceMemberships(c);
    const diff = this.getDifficultyMemberships(d);
    const unts = this.getUnitsMemberships(u);

    type Consequent = {
      stress: "low" | "moderate" | "high" | "critical";
      suitability: "overloaded" | "strenuous" | "manageable" | "optimal";
    };

    const rules: { weight: number; conseq: Consequent }[] = [
      // Low Confidence
      { weight: Math.min(conf.low, diff.low, unts.light), conseq: { stress: "low", suitability: "optimal" } },
      { weight: Math.min(conf.low, diff.low, unts.moderate), conseq: { stress: "moderate", suitability: "manageable" } },
      { weight: Math.min(conf.low, diff.low, unts.heavy), conseq: { stress: "high", suitability: "strenuous" } },
      { weight: Math.min(conf.low, diff.medium, unts.light), conseq: { stress: "moderate", suitability: "manageable" } },
      { weight: Math.min(conf.low, diff.medium, unts.moderate), conseq: { stress: "high", suitability: "strenuous" } },
      { weight: Math.min(conf.low, diff.medium, unts.heavy), conseq: { stress: "critical", suitability: "overloaded" } },
      { weight: Math.min(conf.low, diff.high, unts.light), conseq: { stress: "high", suitability: "strenuous" } },
      { weight: Math.min(conf.low, diff.high, unts.moderate), conseq: { stress: "critical", suitability: "overloaded" } },
      { weight: Math.min(conf.low, diff.high, unts.heavy), conseq: { stress: "critical", suitability: "overloaded" } },

      // Medium Confidence
      { weight: Math.min(conf.medium, diff.low, unts.light), conseq: { stress: "low", suitability: "optimal" } },
      { weight: Math.min(conf.medium, diff.low, unts.moderate), conseq: { stress: "low", suitability: "optimal" } },
      { weight: Math.min(conf.medium, diff.low, unts.heavy), conseq: { stress: "moderate", suitability: "manageable" } },
      { weight: Math.min(conf.medium, diff.medium, unts.light), conseq: { stress: "low", suitability: "optimal" } },
      { weight: Math.min(conf.medium, diff.medium, unts.moderate), conseq: { stress: "moderate", suitability: "manageable" } },
      { weight: Math.min(conf.medium, diff.medium, unts.heavy), conseq: { stress: "high", suitability: "strenuous" } },
      { weight: Math.min(conf.medium, diff.high, unts.light), conseq: { stress: "moderate", suitability: "manageable" } },
      { weight: Math.min(conf.medium, diff.high, unts.moderate), conseq: { stress: "high", suitability: "strenuous" } },
      { weight: Math.min(conf.medium, diff.high, unts.heavy), conseq: { stress: "critical", suitability: "overloaded" } },

      // High Confidence
      { weight: Math.min(conf.high, diff.low, unts.light), conseq: { stress: "low", suitability: "manageable" } },
      { weight: Math.min(conf.high, diff.low, unts.moderate), conseq: { stress: "low", suitability: "optimal" } },
      { weight: Math.min(conf.high, diff.low, unts.heavy), conseq: { stress: "low", suitability: "optimal" } },
      { weight: Math.min(conf.high, diff.medium, unts.light), conseq: { stress: "low", suitability: "manageable" } },
      { weight: Math.min(conf.high, diff.medium, unts.moderate), conseq: { stress: "low", suitability: "optimal" } },
      { weight: Math.min(conf.high, diff.medium, unts.heavy), conseq: { stress: "moderate", suitability: "manageable" } },
      { weight: Math.min(conf.high, diff.high, unts.light), conseq: { stress: "low", suitability: "optimal" } },
      { weight: Math.min(conf.high, diff.high, unts.moderate), conseq: { stress: "moderate", suitability: "manageable" } },
      { weight: Math.min(conf.high, diff.high, unts.heavy), conseq: { stress: "high", suitability: "strenuous" } },
    ];

    // Defuzzification: Centroid Method (Center of Gravity)
    let stressNum = 0;
    let stressDen = 0;
    let suitNum = 0;
    let suitDen = 0;

    for (let y = 0; y <= 100; y += 1) {
      let aggregatedStress = 0;
      let aggregatedSuit = 0;

      for (const rule of rules) {
        if (rule.weight > 0) {
          const sMu = Math.min(rule.weight, this.stressMembership(y, rule.conseq.stress));
          if (sMu > aggregatedStress) aggregatedStress = sMu;

          const wMu = Math.min(rule.weight, this.suitabilityMembership(y, rule.conseq.suitability));
          if (wMu > aggregatedSuit) aggregatedSuit = wMu;
        }
      }

      stressNum += y * aggregatedStress;
      stressDen += aggregatedStress;

      suitNum += y * aggregatedSuit;
      suitDen += aggregatedSuit;
    }

    const stressScore = stressDen > 0 ? Math.round(stressNum / stressDen) : 45;
    const suitabilityScore = suitDen > 0 ? Math.round(suitNum / suitDen) : 55;

    // Dynamic Workload Gauge: Green (Low/Optimal) / Amber (Moderate) / Red (Critical)
    let stressLevel: "Low" | "Moderate" | "High" | "Critical";
    let gaugeStatus: DynamicGaugeStatus;
    let gaugeHex: string;

    if (stressScore <= 35) {
      stressLevel = "Low";
      gaugeStatus = "green";
      gaugeHex = "#10B981"; // Vibrant Emerald Green
    } else if (stressScore <= 65) {
      stressLevel = "Moderate";
      gaugeStatus = "amber";
      gaugeHex = "#F59E0B"; // Amber Gold
    } else if (stressScore <= 82) {
      stressLevel = "High";
      gaugeStatus = "red";
      gaugeHex = "#EF4444"; // Warning Red
    } else {
      stressLevel = "Critical";
      gaugeStatus = "red";
      gaugeHex = "#DC2626"; // Deep Crimson
    }

    let suitability: "Optimal" | "Manageable" | "Strenuous" | "Overloaded";
    if (suitabilityScore >= 75) suitability = "Optimal";
    else if (suitabilityScore >= 50) suitability = "Manageable";
    else if (suitabilityScore >= 30) suitability = "Strenuous";
    else suitability = "Overloaded";

    // Recommended credits range based on Section 3.2 (12 to 18 recommended credits)
    let recommendedUnitsMax = 23;
    if (stressLevel === "Critical" || c <= 3) recommendedUnitsMax = 15;
    else if (stressLevel === "High" || c <= 5) recommendedUnitsMax = 18;
    else if (stressLevel === "Moderate") recommendedUnitsMax = 21;

    let explanation = `With student confidence at ${c}/10 and course difficulty at ${d}/10, a ${u}-unit term yields a predicted stress index of ${stressScore}%. `;
    if (gaugeStatus === "green") {
      explanation += `Pacing is optimal and healthy under the BEEd curriculum.`;
    } else if (gaugeStatus === "amber") {
      explanation += `Workload is manageable with consistent study discipline.`;
    } else {
      explanation += `Workload indicates elevated stress. Recommended credit ceiling: ${recommendedUnitsMax} units.`;
    }

    const disclaimer =
      "Academic Workload Model Notice: This predicted stress and workload suitability estimate is computed via a Mamdani Fuzzy Inference System for curriculum optimization. It is not a clinical or medical diagnosis.";

    return {
      stressScore,
      stressLevel,
      gaugeStatus,
      gaugeHex,
      suitabilityScore,
      suitability,
      recommendedUnitsMax,
      explanation,
      disclaimer,
    };
  }
}

export const fuzzySystem = new MamdaniFuzzySystem();
