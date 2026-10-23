/**
 * Personalized report content, recommendations and the seven-day plan (pure unit tests,
 * synthetic data only; no database).
 *
 * Run: npx tsx tests/report-personalization.test.ts
 */
import { calculateAssessmentScores, selectEvidence } from "../src/modules/assessments/scoring.service";
import { topicContentFor } from "../src/modules/assessments/guidance-library";

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) { passed++; console.log(`  PASS ${name}`); }
  else { failed++; console.log(`  FAIL ${name}${detail ? " :: " + detail : ""}`); }
}

const LABELS = ["Never", "Rarely", "Sometimes", "Often", "Always"];
const OPTIONS = LABELS.map((label, i) => ({ id: `o${i + 1}`, label, orderIndex: i + 1, value: i + 1 }));

// Factor names as in the Parent Style Questionnaire; codes are synthetic
const FACTORS = [
  { id: "f1", code: "F_WARM", name: "Emotional Warmth and Responsiveness", description: null, orderIndex: 1 },
  { id: "f2", code: "F_STRUCT", name: "Structure and Consistent Boundaries", description: null, orderIndex: 2 },
  { id: "f3", code: "F_AUTO", name: "Autonomy and Independence", description: null, orderIndex: 3 },
  { id: "f4", code: "F_CTRL", name: "Psychological Control and Criticism", description: null, orderIndex: 4 },
];

const ITEMS = FACTORS.flatMap((f, fi) =>
  [1, 2, 3].map((n) => ({
    id: `${f.code}_${n}`,
    factorId: f.id,
    itemKey: `${f.code}_${n}`,
    orderIndex: fi * 3 + n,
    prompt: `Synthetic statement ${n} about ${f.name}.`,
    options: OPTIONS,
    isRequired: true,
  }))
);

function version(reverse: string[] = ["F_CTRL"]) {
  return {
    id: "v",
    scoringConfig: {
      formula: "SUM_OF_WEIGHTS",
      bands: [
        { name: "Area for Growth", minPercentage: 0, maxPercentage: 49, classification: "GROWTH_OPPORTUNITY" },
        { name: "Developing", minPercentage: 50, maxPercentage: 74, classification: "STEADY" },
        { name: "Strength", minPercentage: 75, maxPercentage: 100, classification: "STRENGTH" },
      ],
      strengthsThresholdPct: 75,
      growthThresholdPct: 49,
      reverseScoredFactors: reverse,
    },
  } as any;
}

function run(values: Record<string, number[]>, reverse?: string[]) {
  const answers = ITEMS.map((it) => {
    const code = it.itemKey.split("_").slice(0, 2).join("_");
    const n = Number(it.itemKey.split("_")[2]) - 1;
    return { itemId: it.id, selectedOptionId: `o${values[code][n]}` };
  });
  return calculateAssessmentScores(version(reverse), FACTORS as any, ITEMS as any, answers);
}

// Warmth strength (5,5,4 = 93%), Structure developing (4,3,3 = 67%), Autonomy growth (2,2,1 = 33%),
// Control raw 5,4,4 = 87% -> reversed 1,2,2 = 33% -> growth
const A = run({ F_WARM: [5, 5, 4], F_STRUCT: [4, 3, 3], F_AUTO: [2, 2, 1], F_CTRL: [5, 4, 4] });

console.log("1. Answer evidence");
{
  const warm = A.factorScores.F_WARM.evidence || [];
  check("evidence quotes the real question and the chosen option",
    warm.some((e) => e.signal === "supports" && e.answerLabel === "Always" && e.prompt.startsWith("Synthetic statement 1")));
  const ctrl = A.factorScores.F_CTRL.evidence || [];
  check("high raw answer on a reverse-scored dimension is 'practice', not 'supports'",
    ctrl.length > 0 && ctrl.every((e) => e.signal === "practice") && ctrl.some((e) => e.answerLabel === "Always"));
  const mid = selectEvidence([{ prompt: "p", answerLabel: "Sometimes", position: 0.5 }]);
  check("midpoint answers are never quoted", mid.length === 0);
  const many = selectEvidence([0, 0.25, 0.75, 1, 1, 0].map((p, i) => ({ prompt: `q${i}`, answerLabel: "x", position: p })));
  check("at most two quotes per side", many.filter((e) => e.signal === "supports").length === 2 && many.filter((e) => e.signal === "practice").length === 2);
}

console.log("2. Personalized, dimension-specific wording");
{
  const w = A.strengths.find((s) => s.factorCode === "F_WARM")!;
  check("strength 'what you are doing well' cites the parent's answer", w.indicates!.includes('"Always" to "Synthetic statement'));
  check("strength has what it measures + maintain suggestion", !!w.whatItMeasures && !!w.actionableHabit);
  const g = A.growthAreas.find((s) => s.factorCode === "F_AUTO")!;
  check("growth has behaviour, 2-3 actions, example and small goal",
    !!g.behaviorFocus && (g.actions?.length ?? 0) >= 2 && (g.actions?.length ?? 0) <= 3 && !!g.example && !!g.smallGoal);
  const texts = A.growthAreas.map((x) => x.description);
  check("each growth dimension has its own paragraph", new Set(texts).size === texts.length);
  const ctrl = A.growthAreas.find((s) => s.factorCode === "F_CTRL")!;
  check("control growth addresses shame / comparisons / threats", /comparison/i.test(ctrl.actions!.join(" ")) && /threat/i.test(ctrl.actions!.join(" ")));
  check("growth wording is non-judgemental", ctrl.indicates!.includes("not a diagnosis"));
  check("control topic only used when reverse-scored", topicContentFor("X", "Psychological Control and Criticism", "HIGHER_IS_POSITIVE") === undefined);
  check("unknown dimension falls back to generic text", topicContentFor("X", "Sleep Routines", "HIGHER_IS_POSITIVE") === undefined);
  const s = A.steadyAreas.find((x) => x.factorCode === "F_STRUCT")!;
  check("developing dimension stays out of strengths and growth",
    !!s && !A.strengths.some((x) => x.factorCode === "F_STRUCT") && !A.growthAreas.some((x) => x.factorCode === "F_STRUCT"));
}

console.log("3. Recommendations follow the results");
{
  const recs = A.practiceRecommendations;
  check("growth first, most pressing first, then developing, then strengths",
    recs.map((r) => `${r.kind}:${r.factorCode}`).join(",") === "growth:F_AUTO,growth:F_CTRL,steady:F_STRUCT,strength:F_WARM",
    recs.map((r) => `${r.kind}:${r.factorCode}`).join(","));
  check("every recommendation has what/when/how/example/objective and its finding",
    recs.every((r) => r.what && r.when && r.how && r.example && r.objective && r.finding.includes("%")));
  check("finding uses the actual score and label", recs[0].finding === "Autonomy and Independence: 33%, Area for Growth", recs[0].finding);
  check("recommendations link to plan days", recs[0].planDays.length > 0);
}

console.log("4. Seven-day plan");
{
  const plan = A.practicePlan;
  check("exactly seven days, numbered 1-7", plan.length === 7 && plan.map((d) => d.day).join("") === "1234567");
  check("day 1 targets the most pressing growth area", plan[0].factorCodes.join() === "F_AUTO");
  check("day 3 builds on a strength", plan[2].title === "Build on a Strength" && plan[2].factorCodes.includes("F_WARM"));
  check("day 5 targets the second focus area", plan[4].factorCodes.join() === "F_CTRL");
  check("day 7 is reflect and prepare to reassess", plan[6].title === "Reflect and Prepare to Reassess");
  check("every day has objective, exercise, minutes, example, reflection",
    plan.every((d) => d.objective && d.exercise && d.minutes > 0 && d.example && d.reflection));

  const noStrength = run({ F_WARM: [2, 2, 2], F_STRUCT: [2, 2, 2], F_AUTO: [1, 1, 1], F_CTRL: [5, 5, 5] });
  check("no strengths: no strength is invented", noStrength.strengths.length === 0 && noStrength.practicePlan[2].title === "Try a Second Small Change");

  const allStrong = run({ F_WARM: [5, 5, 5], F_STRUCT: [5, 5, 5], F_AUTO: [5, 5, 5], F_CTRL: [1, 1, 1] });
  check("all strengths: plan still has seven days and recommendations are 'keep going'",
    allStrong.practicePlan.length === 7 && allStrong.practiceRecommendations.every((r) => r.kind === "strength"));

  const B = run({ F_WARM: [1, 2, 1], F_STRUCT: [5, 5, 5], F_AUTO: [4, 4, 4], F_CTRL: [1, 1, 2] });
  check("different answers give a different plan focus (nothing hard-coded)", B.practicePlan[0].factorCodes.join() === "F_WARM");
}

console.log("5. Without reverse-scoring configured, control is not given control-specific text");
{
  const notReversed = run({ F_WARM: [5, 5, 5], F_STRUCT: [5, 5, 5], F_AUTO: [5, 5, 5], F_CTRL: [1, 1, 1] }, []);
  const c = notReversed.growthAreas.find((x) => x.factorCode === "F_CTRL");
  check("classification still follows the configuration (direction not guessed from the name)", !!c);
  check("but no topic text written for the other direction is used", !/comparison/i.test((c?.actions || []).join(" ")));
}

console.log(`\n${failed === 0 ? "ALL" : ""} ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
