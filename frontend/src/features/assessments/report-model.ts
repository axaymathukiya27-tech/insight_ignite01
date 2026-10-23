import {
  AreaSummaryDto,
  AssessmentRecommendationDto,
  AssessmentResultDto,
  FactorScoreDto,
  ResultClassification,
  ScoringDirection,
} from "@insight-ignite/shared";

/**
 * Turns an assessment result into everything the Parenting Growth Summary shows.
 * The web page and the printed / saved PDF render the same model, so they cannot
 * disagree. Classification always comes from the backend (direction-aware); this
 * file never decides a strength or growth area from a raw percentage.
 */

export type DimensionTone = "strength" | "growth" | "steady" | "neutral";

export interface ReportDimension {
  code: string;
  name: string;
  percentage: number; // as answered: the bar width
  interpretedPercentage: number;
  direction: ScoringDirection | null;
  band: string;
  classification: ResultClassification | null;
  tone: DimensionTone;
  interpretation: string | null;
  description: string | null;
  bandDescription: string | null;
}

export interface RecommendationGroup {
  factorCode: string;
  factorName: string;
  kind: "growth" | "steady" | "strength";
  heading: string;
  items: string[];
}

export interface ReportModel {
  isLegacy: boolean;
  completedDate: string;
  versionNumber: number;
  disclaimer: string;
  summary: string;
  dimensions: ReportDimension[];
  strengths: AreaSummaryDto[];
  growthAreas: AreaSummaryDto[];
  steadyAreas: AreaSummaryDto[];
  recommendations: RecommendationGroup[];
  courses: AssessmentRecommendationDto[];
  nextSteps: string[];
}

const TONE: Record<ResultClassification, DimensionTone> = {
  STRENGTH: "strength",
  GROWTH_OPPORTUNITY: "growth",
  STEADY: "steady",
};

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

export function buildReportModel(result: AssessmentResultDto): ReportModel {
  const scores = Object.values(result.factorScores || {}) as FactorScoreDto[];
  // A result is "legacy" when it was calculated before scoring direction was recorded
  const isLegacy = scores.length > 0 && scores.some((s) => !s.classification);

  const dimensions: ReportDimension[] = scores.map((s) => ({
    code: s.factorCode,
    name: s.factorName,
    percentage: Math.max(0, Math.min(100, s.percentage)),
    interpretedPercentage: s.interpretedPercentage ?? s.percentage,
    direction: s.direction ?? null,
    band: s.band,
    classification: s.classification ?? null,
    tone: s.classification ? TONE[s.classification] : "neutral",
    interpretation: s.interpretation ?? null,
    description: s.dimensionDescription ?? null,
    bandDescription: s.summaryText ?? null,
  }));

  const strengths = result.strengths || [];
  const growthAreas = result.growthAreas || [];
  const steadyAreas = result.steadyAreas || [];

  const recommendations: RecommendationGroup[] = [
    ...growthAreas.map((g) => ({
      factorCode: g.factorCode,
      factorName: g.factorName,
      kind: "growth" as const,
      heading: `To build ${g.factorName}`,
      items: (g.actions && g.actions.length > 0 ? g.actions : [g.actionableHabit]).filter(Boolean),
    })),
    ...steadyAreas.map((s) => ({
      factorCode: s.factorCode,
      factorName: s.factorName,
      kind: "steady" as const,
      heading: `To keep developing ${s.factorName}`,
      items: [s.actionableHabit].filter(Boolean),
    })),
    ...strengths.map((s) => ({
      factorCode: s.factorCode,
      factorName: s.factorName,
      kind: "strength" as const,
      heading: `To maintain ${s.factorName}`,
      items: [s.actionableHabit].filter(Boolean),
    })),
  ];

  // Next steps: one concrete action per growth area first, then developing areas,
  // then a strength to keep, up to three.
  const nextSteps: string[] = [];
  for (const g of growthAreas) {
    const first = g.actions?.[0] || g.actionableHabit;
    if (first) nextSteps.push(`${g.factorName}: ${first}`);
  }
  for (const s of steadyAreas) {
    if (nextSteps.length >= 3) break;
    if (s.actionableHabit) nextSteps.push(`${s.factorName}: ${s.actionableHabit}`);
  }
  for (const s of strengths) {
    if (nextSteps.length >= 3) break;
    if (s.actionableHabit) nextSteps.push(`Keep going with ${s.factorName}: ${s.actionableHabit}`);
  }

  const parts = [
    strengths.length ? plural(strengths.length, "foundational strength", "foundational strengths") : null,
    growthAreas.length ? plural(growthAreas.length, "area for growth", "areas for growth") : null,
    steadyAreas.length ? plural(steadyAreas.length, "developing area", "developing areas") : null,
  ].filter(Boolean);
  const summary =
    parts.length > 0
      ? `Across ${plural(dimensions.length, "dimension", "dimensions")}, your answers show ${parts.join(", ")}. Use the strengths as anchors while you practise the next steps below.`
      : `Your answers cover ${plural(dimensions.length, "dimension", "dimensions")}. See the breakdown below.`;

  return {
    isLegacy,
    completedDate: new Date(result.completedAt).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    versionNumber: result.versionNumber,
    disclaimer: result.disclaimer,
    summary,
    dimensions,
    strengths,
    growthAreas,
    steadyAreas,
    recommendations: recommendations.filter((r) => r.items.length > 0),
    courses: result.recommendedCourses || [],
    nextSteps: nextSteps.slice(0, 3),
  };
}
