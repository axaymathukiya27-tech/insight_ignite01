import {
  AreaSummaryDto,
  AssessmentRecommendationDto,
  AssessmentResultDto,
  FactorScoreDto,
  PracticePlanDayTemplateDto,
  PracticeRecommendationDto,
  ResultClassification,
  ScoringDirection,
} from "@insight-ignite/shared";

/**
 * Turns an assessment result into everything the Parenting Growth Summary shows.
 * The web page and the printed / saved PDF render the same model, so they cannot
 * disagree. Classification always comes from the backend (direction-aware); this
 * file never decides a strength or growth area from a raw percentage, and every
 * count is calculated from the result itself.
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
  measures: string | null; // What This Measures
  indicates: string | null; // What Your Score Indicates
  practise: string | null; // What You Can Practise
}

export interface ReportModel {
  isLegacy: boolean;
  completedDate: string;
  versionNumber: number;
  disclaimer: string;
  summary: string;
  mainOpportunities: string[];
  nextAction: string | null;
  counts: { total: number; strengths: number; growth: number; steady: number };
  dimensions: ReportDimension[];
  strengths: AreaSummaryDto[];
  growthAreas: AreaSummaryDto[];
  steadyAreas: AreaSummaryDto[];
  recommendations: PracticeRecommendationDto[];
  plan: PracticePlanDayTemplateDto[];
  courses: AssessmentRecommendationDto[];
  instrumentSlug: string | null;
}

const TONE: Record<ResultClassification, DimensionTone> = {
  STRENGTH: "strength",
  GROWTH_OPPORTUNITY: "growth",
  STEADY: "steady",
};

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

function listNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** Assessment order when recorded (stored JSON does not preserve key order). */
export function sortScores(scores: FactorScoreDto[]): FactorScoreDto[] {
  return [...scores].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
}

export function buildReportModel(result: AssessmentResultDto): ReportModel {
  const scores = sortScores(Object.values(result.factorScores || {}) as FactorScoreDto[]);
  // A result is "legacy" when it was calculated before scoring direction was recorded
  const isLegacy = scores.length > 0 && scores.some((s) => !s.classification);

  const strengths = result.strengths || [];
  const growthAreas = result.growthAreas || [];
  const steadyAreas = result.steadyAreas || [];
  const areaFor = (code: string) =>
    strengths.find((a) => a.factorCode === code) ||
    growthAreas.find((a) => a.factorCode === code) ||
    steadyAreas.find((a) => a.factorCode === code);

  const dimensions: ReportDimension[] = scores.map((s) => {
    const area = s.classification ? areaFor(s.factorCode) : undefined;
    const tone: DimensionTone = s.classification ? TONE[s.classification] : "neutral";
    return {
      code: s.factorCode,
      name: s.factorName,
      percentage: Math.max(0, Math.min(100, s.percentage)),
      interpretedPercentage: s.interpretedPercentage ?? s.percentage,
      direction: s.direction ?? null,
      band: s.band,
      classification: s.classification ?? null,
      tone,
      measures: s.dimensionDescription || area?.whatItMeasures || null,
      indicates: s.interpretation ?? s.summaryText ?? null,
      practise: area ? (tone === "growth" ? area.actions?.[0] || area.actionableHabit : area.actionableHabit) : null,
    };
  });

  const counts = {
    total: dimensions.length,
    strengths: strengths.length,
    growth: growthAreas.length,
    steady: steadyAreas.length,
  };
  const recommendations = result.practiceRecommendations || [];
  const plan = result.practicePlan || [];
  const mainOpportunities = (growthAreas.length > 0 ? growthAreas : steadyAreas).map((a) => a.factorName);
  const nextAction = plan[0]
    ? `Start Day 1 of your practice plan: ${plan[0].exercise}`
    : recommendations[0]?.what || null;

  let summary: string;
  if (isLegacy || counts.total === 0) {
    summary = `This report covers ${plural(counts.total, "dimension", "dimensions")}. See the breakdown below.`;
  } else {
    const parts = [
      counts.strengths === 0
        ? "none is a clear strength yet"
        : counts.strengths === 1
        ? "1 is a foundational strength"
        : `${counts.strengths} are foundational strengths`,
      counts.growth === 0
        ? "none is currently an area for growth"
        : counts.growth === 1
        ? "1 is an area for growth"
        : `${counts.growth} are areas for growth`,
      ...(counts.steady > 0 ? [`${counts.steady} ${counts.steady === 1 ? "is" : "are"} developing`] : []),
    ];
    const joined = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts[0];
    summary = `You answered questions across ${plural(counts.total, "parenting dimension", "parenting dimensions")}. Of these, ${joined}.`;
    if (mainOpportunities.length > 0) {
      summary += ` Your main opportunity for the next stage of growth is ${listNames(mainOpportunities.slice(0, 2))}.`;
    } else {
      summary += " All of your measured dimensions are currently strengths, so your focus can be on keeping them going.";
    }
  }

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
    mainOpportunities,
    nextAction,
    counts,
    dimensions,
    strengths,
    growthAreas,
    steadyAreas,
    recommendations,
    plan,
    courses: result.recommendedCourses || [],
    instrumentSlug: result.instrumentSlug ?? null,
  };
}

/** "₹1,499" from minor units; null when the catalogue has no price recorded. */
export function formatPrice(amount?: number, currency?: string): string | null {
  if (!amount || amount <= 0 || !currency) return null;
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount / 100);
  } catch {
    return null;
  }
}

export function formatMinutes(total?: number | null): string | null {
  if (!total || total <= 0) return null;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h} h${m ? ` ${m} min` : ""}` : `${m} min`;
}
