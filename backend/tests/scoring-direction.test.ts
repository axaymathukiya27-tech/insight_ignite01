/**
 * Unit tests for direction-aware scoring and report classification.
 * Pure functions only: synthetic data, no database, no network.
 *
 * Run: npx tsx tests/scoring-direction.test.ts
 */
import {
  calculateAssessmentScores,
  classifyPercentage,
  ApprovedScoringConfigSchema,
} from "../src/modules/assessments/scoring.service";
import {
  selectRecommendationFactors,
  describeRelevance,
} from "../src/modules/assessments/recommendations.service";
import { steadyAreasFromScores } from "../src/modules/assessments/report-content";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) {
    passed++;
    console.log(`  PASS ${name}`);
  } else {
    failed++;
    console.log(`  FAIL ${name}${detail ? " :: " + detail : ""}`);
  }
}

// ---------------------------------------------------------------------------
// Synthetic instrument (structure mirrors the Parent Style Questionnaire:
// four dimensions, five items each, 1..5 scale, one reverse-scored dimension)
// ---------------------------------------------------------------------------
const LIKERT = [1, 2, 3, 4, 5].map((v, i) => ({ id: `o${v}`, label: `L${v}`, orderIndex: i + 1, value: v }));
const BANDS = [
  { name: "Area for Growth", minPercentage: 0, maxPercentage: 49, classification: "GROWTH_OPPORTUNITY" },
  { name: "Developing", minPercentage: 50, maxPercentage: 74, classification: "STEADY" },
  { name: "Strength", minPercentage: 75, maxPercentage: 100, classification: "STRENGTH" },
];
const GUIDANCE = {
  WARMTH: {
    strengthTitle: "Warmth strength",
    strengthHabit: "WARMTH-maintain",
    growthTitle: "Warmth growth",
    growthHabit: "WARMTH-habit",
    growthActions: ["WARMTH-a1", "WARMTH-a2"],
    growthExample: "WARMTH-example",
  },
  CONTROL: {
    strengthTitle: "Control strength",
    strengthHabit: "CONTROL-maintain",
    growthTitle: "Control growth",
    growthHabit: "CONTROL-habit",
    growthActions: ["CONTROL-a1", "CONTROL-a2", "CONTROL-a3"],
    growthExample: "CONTROL-example",
  },
};

const FACTORS = ["WARMTH", "STRUCTURE", "AUTONOMY", "CONTROL"].map((code, i) => ({
  id: `f-${code}`,
  versionId: "v1",
  code,
  name: `${code} dimension`,
  tagline: null,
  description: `Description of ${code}`,
  orderIndex: i + 1,
}));

function items(options = LIKERT, perFactor = 5) {
  const list: any[] = [];
  for (const f of FACTORS) {
    for (let n = 1; n <= perFactor; n++) {
      list.push({
        id: `${f.code}-${n}`,
        versionId: "v1",
        factorId: f.id,
        itemKey: `${f.code}_${n}`,
        orderIndex: list.length + 1,
        prompt: "synthetic",
        contextPrompt: null,
        responseType: "SINGLE_CHOICE",
        options,
        isRequired: true,
      });
    }
  }
  return list;
}

function version(overrides: Record<string, unknown> = {}) {
  return {
    id: "v1",
    scoringConfig: {
      formula: "SUM_OF_WEIGHTS",
      bands: BANDS,
      strengthsThresholdPct: 75,
      growthThresholdPct: 49,
      guidanceTemplates: GUIDANCE,
      reverseScoredFactors: ["CONTROL"],
      ...overrides,
    },
  } as any;
}

/** answers: factor code -> list of chosen values (one per item) */
function answer(itemList: any[], values: Record<string, number[]>) {
  return itemList.map((it) => {
    const code = it.itemKey.split("_")[0];
    const idx = Number(it.itemKey.split("_")[1]) - 1;
    const v = values[code][idx];
    const opt = it.options.find((o: any) => o.value === v);
    return { itemId: it.id, selectedOptionId: opt.id };
  });
}

const all = (v: number) => [v, v, v, v, v];

// ---------------------------------------------------------------------------
console.log("1. Positive dimensions: high = strength, low = growth");
{
  const it = items();
  const r = calculateAssessmentScores(version(), FACTORS as any, it, answer(it, {
    WARMTH: all(5), STRUCTURE: all(1), AUTONOMY: all(3), CONTROL: all(1),
  }));
  check("WARMTH all 5 -> 100% STRENGTH", r.factorScores.WARMTH.percentage === 100 && r.factorScores.WARMTH.classification === "STRENGTH");
  check("STRUCTURE all 1 -> 20% GROWTH", r.factorScores.STRUCTURE.percentage === 20 && r.factorScores.STRUCTURE.classification === "GROWTH_OPPORTUNITY");
  check("positive direction recorded", r.factorScores.WARMTH.direction === "HIGHER_IS_POSITIVE");
  check("positive interpreted == percentage", r.factorScores.WARMTH.interpretedPercentage === 100);
}

console.log("2. Negatively oriented dimension (reverse-scored)");
{
  const it = items();
  // The reported case: 84% on Psychological Control and Criticism
  const r = calculateAssessmentScores(version(), FACTORS as any, it, answer(it, {
    WARMTH: all(3), STRUCTURE: all(3), AUTONOMY: all(3), CONTROL: [4, 4, 4, 4, 5],
  }));
  const c = r.factorScores.CONTROL;
  check("CONTROL raw 84% is displayed as answered", c.percentage === 84, `got ${c.percentage}`);
  check("CONTROL reverse-scored to 36%", c.interpretedPercentage === 36, `got ${c.interpretedPercentage}`);
  check("CONTROL 84% is GROWTH, never STRENGTH", c.classification === "GROWTH_OPPORTUNITY");
  check("CONTROL not listed under strengths", !r.strengths.some((s) => s.factorCode === "CONTROL"));
  check("CONTROL listed under growth areas", r.growthAreas.some((g) => g.factorCode === "CONTROL"));
  check("direction HIGHER_IS_CONCERN recorded", c.direction === "HIGHER_IS_CONCERN");

  const low = calculateAssessmentScores(version(), FACTORS as any, it, answer(it, {
    WARMTH: all(3), STRUCTURE: all(3), AUTONOMY: all(3), CONTROL: all(1),
  }));
  check("CONTROL all 1 (rarely) -> raw 20%, interpreted 100%, STRENGTH",
    low.factorScores.CONTROL.percentage === 20 && low.factorScores.CONTROL.interpretedPercentage === 100 &&
    low.factorScores.CONTROL.classification === "STRENGTH");
  const high = calculateAssessmentScores(version(), FACTORS as any, it, answer(it, {
    WARMTH: all(3), STRUCTURE: all(3), AUTONOMY: all(3), CONTROL: all(5),
  }));
  check("CONTROL all 5 (very often) -> raw 100%, interpreted 20%, GROWTH",
    high.factorScores.CONTROL.percentage === 100 && high.factorScores.CONTROL.interpretedPercentage === 20 &&
    high.factorScores.CONTROL.classification === "GROWTH_OPPORTUNITY");
}

console.log("3. Reverse-scored questions: item values are mirrored on their own scale");
{
  const it = items();
  const r = calculateAssessmentScores(version(), FACTORS as any, it, answer(it, {
    WARMTH: all(3), STRUCTURE: all(3), AUTONOMY: all(3), CONTROL: [1, 2, 3, 4, 5],
  }));
  // reversed: 5,4,3,2,1 = 15 -> 60%
  check("mixed answers 1..5 reverse to the same total (60%)", r.factorScores.CONTROL.interpretedPercentage === 60);
  check("raw answers are stored unreversed", r.rawAnswersWithValues.filter((a) => a.itemId.startsWith("CONTROL")).map((a) => a.numericValue).join(",") === "1,2,3,4,5");
  // Non-1 based scale: options 0..4 -> reverse is 4 - v
  const zeroBased = [0, 1, 2, 3, 4].map((v, i) => ({ id: `o${v}`, label: `L${v}`, orderIndex: i + 1, value: v }));
  const it0 = items(zeroBased, 1);
  const r0 = calculateAssessmentScores(version(), FACTORS as any, it0, answer(it0, {
    WARMTH: [4], STRUCTURE: [4], AUTONOMY: [4], CONTROL: [0],
  }));
  check("0..4 scale: CONTROL answer 0 reverses to 4 (100%)", r0.factorScores.CONTROL.interpretedPercentage === 100);
}

console.log("4. Every threshold and boundary value (band classification)");
{
  const cfg = ApprovedScoringConfigSchema.parse(version().scoringConfig);
  const expect: Array<[number, string]> = [
    [0, "GROWTH_OPPORTUNITY"], [49, "GROWTH_OPPORTUNITY"], [50, "STEADY"],
    [74, "STEADY"], [75, "STRENGTH"], [100, "STRENGTH"],
  ];
  for (const [pct, cls] of expect) {
    check(`${pct}% -> ${cls}`, classifyPercentage(pct, cfg).classification === cls);
  }
  // Same boundaries through the full engine on a 0..100 single-item scale, both directions
  const scale = Array.from({ length: 101 }, (_, v) => ({ id: `p${v}`, label: `${v}`, orderIndex: v + 1, value: v }));
  const it = items(scale, 1);
  for (const [pct, cls] of expect) {
    const r = calculateAssessmentScores(version(), FACTORS as any, it, answer(it, {
      WARMTH: [pct], STRUCTURE: [pct], AUTONOMY: [pct], CONTROL: [100 - pct],
    }));
    check(`engine positive ${pct}% -> ${cls}`, r.factorScores.WARMTH.classification === cls);
    check(`engine reverse-scored raw ${100 - pct}% (interpreted ${pct}%) -> ${cls}`,
      r.factorScores.CONTROL.interpretedPercentage === pct && r.factorScores.CONTROL.classification === cls);
  }
  // Gap in the bands: thresholds are used rather than the first band
  const gappy = ApprovedScoringConfigSchema.parse({
    ...version().scoringConfig,
    bands: [{ name: "Low", minPercentage: 0, maxPercentage: 30, classification: "GROWTH_OPPORTUNITY" }],
  });
  check("gap: 90% falls back to STRENGTH threshold", classifyPercentage(90, gappy).classification === "STRENGTH");
  check("gap: 60% falls back to STEADY", classifyPercentage(60, gappy).classification === "STEADY");
  check("gap: 45% falls back to GROWTH threshold", classifyPercentage(45, gappy).classification === "GROWTH_OPPORTUNITY");
}

console.log("5. Label and section always agree; steady belongs to neither list");
{
  const it = items();
  const r = calculateAssessmentScores(version(), FACTORS as any, it, answer(it, {
    WARMTH: all(5), STRUCTURE: all(4), AUTONOMY: [3, 3, 3, 3, 3], CONTROL: all(5),
  }));
  for (const s of Object.values(r.factorScores)) {
    const inS = r.strengths.some((x) => x.factorCode === s.factorCode);
    const inG = r.growthAreas.some((x) => x.factorCode === s.factorCode);
    const inD = r.steadyAreas.some((x) => x.factorCode === s.factorCode);
    const ok =
      (s.classification === "STRENGTH" && inS && !inG && !inD) ||
      (s.classification === "GROWTH_OPPORTUNITY" && inG && !inS && !inD) ||
      (s.classification === "STEADY" && inD && !inS && !inG);
    check(`${s.factorCode} (${s.band}) is in exactly the matching section`, ok);
  }
  check("AUTONOMY 60% is Developing, in neither strengths nor growth",
    r.factorScores.AUTONOMY.classification === "STEADY" && r.steadyAreas.length === 1);
}

console.log("6. Multiple strengths / multiple growth areas");
{
  const it = items();
  const many = calculateAssessmentScores(version(), FACTORS as any, it, answer(it, {
    WARMTH: all(5), STRUCTURE: all(4), AUTONOMY: all(4), CONTROL: all(1),
  }));
  check("four strengths (incl. reverse-scored CONTROL at 20%)", many.strengths.length === 4 && many.growthAreas.length === 0);
  const needs = calculateAssessmentScores(version(), FACTORS as any, it, answer(it, {
    WARMTH: all(1), STRUCTURE: all(2), AUTONOMY: all(1), CONTROL: all(5),
  }));
  check("four growth areas", needs.growthAreas.length === 4 && needs.strengths.length === 0);
  const order = needs.growthAreas.map((g) => g.factorCode).join(",");
  check("growth areas ordered by need (lowest interpreted first)", needs.growthAreas[needs.growthAreas.length - 1].factorCode === "STRUCTURE", order);
}

console.log("7. Dimension-to-explanation and dimension-to-recommendation mapping");
{
  const it = items();
  const r = calculateAssessmentScores(version(), FACTORS as any, it, answer(it, {
    WARMTH: all(1), STRUCTURE: all(5), AUTONOMY: all(3), CONTROL: all(5),
  }));
  const warmth = r.growthAreas.find((g) => g.factorCode === "WARMTH")!;
  const control = r.growthAreas.find((g) => g.factorCode === "CONTROL")!;
  check("WARMTH growth uses WARMTH actions only", JSON.stringify(warmth.actions) === JSON.stringify(["WARMTH-a1", "WARMTH-a2"]));
  check("CONTROL growth uses CONTROL actions only", JSON.stringify(control.actions) === JSON.stringify(["CONTROL-a1", "CONTROL-a2", "CONTROL-a3"]));
  check("WARMTH text never mentions CONTROL", !JSON.stringify(warmth).includes("CONTROL"));
  check("CONTROL text never mentions WARMTH", !JSON.stringify(control).includes("WARMTH"));
  check("growth example is the dimension's own", warmth.example === "WARMTH-example" && control.example === "CONTROL-example");
  check("growth area has score + label", control.percentage === 100 && control.band === "Area for Growth");
  const structure = r.strengths.find((s) => s.factorCode === "STRUCTURE")!;
  check("strength has what it measures, what the answers indicate, and a maintain suggestion", !!structure.whatItMeasures && !!structure.indicates && !!structure.actionableHabit);
  check("strength no longer uses the generic 'why this is a strength' text", structure.whyItMatters === undefined);
  check("CONTROL growth wording is non-judgemental", control.indicates!.includes("not a diagnosis"));
  check("growth area has a small goal", !!control.smallGoal && !!warmth.smallGoal);
  // Reverse-scored dimension as a strength uses 'rarely' wording
  const good = calculateAssessmentScores(version(), FACTORS as any, it, answer(it, {
    WARMTH: all(3), STRUCTURE: all(3), AUTONOMY: all(3), CONTROL: all(1),
  }));
  const cStrength = good.strengths.find((s) => s.factorCode === "CONTROL")!;
  check("reverse-scored strength says behaviours happen 'rarely'", cStrength.description.includes("rarely"));
  check("reverse-scored interpretation says lower is better", good.factorScores.CONTROL.interpretation!.includes("lower score is the positive result"));
  check("positive interpretation says higher is positive", good.factorScores.WARMTH.interpretation!.includes("a higher score is the positive result"));
  check("dimension description passed through", good.factorScores.WARMTH.dimensionDescription === "Description of WARMTH");
}

console.log("8. Overall score follows the specification (reverse-score before combining)");
{
  const it = items();
  const r = calculateAssessmentScores(version(), FACTORS as any, it, answer(it, {
    WARMTH: all(5), STRUCTURE: all(5), AUTONOMY: all(5), CONTROL: all(5),
  }));
  // 25 + 25 + 25 + reversed(5 x 5 -> 5 x 1 = 5) = 80
  check("overall = 80 (CONTROL contributes 5, not 25)", r.overallScore === 80, `got ${r.overallScore}`);
}

console.log("9. Course recommendations follow classification, never strengths");
{
  const it = items();
  const r = calculateAssessmentScores(version(), FACTORS as any, it, answer(it, {
    WARMTH: all(5), STRUCTURE: all(2), AUTONOMY: all(3), CONTROL: [4, 4, 4, 4, 5],
  }));
  const picked = selectRecommendationFactors(r.factorScores);
  check("strength WARMTH never recommended against", !picked.includes("WARMTH"));
  check("growth areas recommended, most pressing first", picked.join(",") === "CONTROL,STRUCTURE" || picked.join(",") === "STRUCTURE,CONTROL");
  check("ordered by need", picked[0] === (r.factorScores.CONTROL.interpretedPercentage! <= r.factorScores.STRUCTURE.interpretedPercentage! ? "CONTROL" : "STRUCTURE"));
  const steadyOnly = calculateAssessmentScores(version(), FACTORS as any, it, answer(it, {
    WARMTH: all(5), STRUCTURE: all(3), AUTONOMY: all(5), CONTROL: all(1),
  }));
  check("no growth areas -> developing dimensions recommended", selectRecommendationFactors(steadyOnly.factorScores).join(",") === "STRUCTURE");
  check("relevance text for reverse-scored dimension mentions frequency", describeRelevance(r.factorScores.CONTROL, "Control").includes("happen fairly often"));
  check("relevance text for positive dimension mentions building", describeRelevance(r.factorScores.STRUCTURE, "Structure").includes("build"));
}

console.log("10. Stored results: developing areas rebuilt; legacy results untouched");
{
  const it = items();
  const r = calculateAssessmentScores(version(), FACTORS as any, it, answer(it, {
    WARMTH: all(3), STRUCTURE: all(5), AUTONOMY: all(1), CONTROL: all(1),
  }));
  const rebuilt = steadyAreasFromScores(r.factorScores, GUIDANCE as any);
  check("steady areas rebuilt from stored scores", rebuilt.length === 1 && rebuilt[0].factorCode === "WARMTH");
  const legacy = { X: { factorCode: "X", factorName: "X", rawScore: 21, maxScore: 25, percentage: 84, band: "Strengths" } };
  check("legacy result (no classification) -> no steady areas invented", steadyAreasFromScores(legacy as any, undefined).length === 0);
  const noReverse = ApprovedScoringConfigSchema.parse({ ...version().scoringConfig, reverseScoredFactors: undefined });
  check("configs without reverseScoredFactors default to [] (all positive)", Array.isArray(noReverse.reverseScoredFactors) && noReverse.reverseScoredFactors.length === 0);
}

console.log(`\n${failed === 0 ? "ALL" : ""} ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
