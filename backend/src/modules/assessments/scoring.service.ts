import { z } from "zod";
import {
  AssessmentVersion,
  AssessmentItem,
  AssessmentFactorDefinition,
} from "@insight-ignite/database";
import {
  AssessmentAnswerItem,
  FactorScoreDto,
  AreaSummaryDto,
  ResultClassification,
  ScoringDirection,
} from "@insight-ignite/shared";
import {
  DimensionResult,
  buildGrowthArea,
  buildSteadyArea,
  buildStrength,
  withInterpretation,
} from "./report-content";

export class AssessmentError extends Error {
  constructor(
    message: string,
    public statusCode = 400,
    public code = "ASSESSMENT_ERROR",
    public details?: unknown
  ) {
    super(message);
    this.name = "AssessmentError";
  }
}

/**
 * Strict schema for approved scoring configurations.
 * If an assessment version does not contain an approved, validated configuration,
 * the scoring engine safely halts execution rather than inventing scores.
 */
export const ScoringBandSchema = z.object({
  name: z.string().min(1, "Band name is required"),
  minPercentage: z.number().min(0).max(100),
  maxPercentage: z.number().min(0).max(100),
  classification: z.enum(["STRENGTH", "STEADY", "GROWTH_OPPORTUNITY"]),
  description: z.string().optional(),
});

export const FactorGuidanceTemplateSchema = z.object({
  strengthTitle: z.string(),
  strengthHabit: z.string(),
  growthTitle: z.string(),
  growthHabit: z.string(),
  // Optional richer report wording (authored and approved per dimension)
  strengthExplanation: z.string().optional(),
  strengthWhy: z.string().optional(),
  growthExplanation: z.string().optional(),
  growthBehavior: z.string().optional(),
  growthActions: z.array(z.string().min(1)).min(1).max(5).optional(),
  growthExample: z.string().optional(),
  steadyExplanation: z.string().optional(),
  steadyTip: z.string().optional(),
});

export const ApprovedScoringConfigSchema = z.object({
  formula: z.enum(["SUM_OF_WEIGHTS", "AVERAGE_WEIGHTS"]).default("SUM_OF_WEIGHTS"),
  bands: z.array(ScoringBandSchema).min(1, "At least one scoring band must be defined"),
  strengthsThresholdPct: z.number().min(0).max(100).default(70),
  growthThresholdPct: z.number().min(0).max(100).default(50),
  guidanceTemplates: z.record(z.string(), FactorGuidanceTemplateSchema).optional(),
  // Factor codes where a HIGHER answer means a MORE FREQUENT CONCERNING behaviour.
  // Every item in these factors is reverse-scored (min + max - value) before the
  // factor is classified and before it is added to the overall score.
  reverseScoredFactors: z.array(z.string().min(1)).default([]),
});

export type ApprovedScoringConfig = z.infer<typeof ApprovedScoringConfigSchema>;

export interface RawOptionWithWeight {
  id: string;
  label: string;
  orderIndex: number;
  value: number; // Required for server calculation
}

export interface ComputedAssessmentPayload {
  factorScores: Record<string, FactorScoreDto>;
  overallScore: number;
  strengths: AreaSummaryDto[];
  growthAreas: AreaSummaryDto[];
  steadyAreas: AreaSummaryDto[];
  rawAnswersWithValues: Array<{
    itemId: string;
    selectedOptionId: string;
    numericValue: number;
  }>;
}

/**
 * Calculates scores server-side strictly against the validated scoring configuration
 * of an approved assessment version.
 */
export function calculateAssessmentScores(
  version: AssessmentVersion,
  factors: AssessmentFactorDefinition[],
  items: AssessmentItem[],
  answers: AssessmentAnswerItem[]
): ComputedAssessmentPayload {
  if (!version.scoringConfig) {
    throw new AssessmentError(
      "Assessment version does not have an approved scoring configuration. Scoring cannot be performed.",
      400,
      "SCORING_CONFIG_INVALID"
    );
  }

  const parseResult = ApprovedScoringConfigSchema.safeParse(version.scoringConfig);
  if (!parseResult.success) {
    throw new AssessmentError(
      "The scoring configuration for this assessment version is malformed or invalid.",
      400,
      "SCORING_CONFIG_INVALID",
      parseResult.error.format()
    );
  }

  const config = parseResult.data;

  // Build answer lookup
  const answerMap = new Map<string, string>();
  for (const ans of answers) {
    if (answerMap.has(ans.itemId)) {
      throw new AssessmentError(
        `Duplicate answer provided for item ${ans.itemId}.`,
        400,
        "DUPLICATE_ANSWER"
      );
    }
    answerMap.set(ans.itemId, ans.selectedOptionId);
  }

  // Validate item answers and compute per-item values
  const rawAnswersWithValues: Array<{
    itemId: string;
    selectedOptionId: string;
    numericValue: number;
  }> = [];

  const factorScores: Record<string, FactorScoreDto> = {};
  const strengths: AreaSummaryDto[] = [];
  const growthAreas: AreaSummaryDto[] = [];
  const steadyAreas: AreaSummaryDto[] = [];
  const reverseScored = new Set(config.reverseScoredFactors);
  let totalInterpretedSum = 0;

  for (const factor of factors) {
    const factorItems = items.filter((it) => it.factorId === factor.id);
    if (factorItems.length === 0) {
      continue;
    }

    const direction: ScoringDirection = reverseScored.has(factor.code)
      ? "HIGHER_IS_CONCERN"
      : "HIGHER_IS_POSITIVE";
    let factorRawSum = 0;
    let factorInterpretedSum = 0;
    let factorMaxSum = 0;

    for (const item of factorItems) {
      const selectedOptionId = answerMap.get(item.id);
      if (!selectedOptionId) {
        if (item.isRequired) {
          throw new AssessmentError(
            `Missing answer for required item: ${item.itemKey}`,
            400,
            "MISSING_REQUIRED_ANSWER"
          );
        }
        continue;
      }

      // Parse options
      const options = item.options as unknown as RawOptionWithWeight[];
      if (!Array.isArray(options) || options.length === 0) {
        throw new AssessmentError(
          `Item ${item.itemKey} has no options defined in configuration.`,
          400,
          "ITEM_CONFIGURATION_ERROR"
        );
      }

      const selectedOption = options.find((opt) => opt.id === selectedOptionId);
      if (!selectedOption) {
        throw new AssessmentError(
          `Option '${selectedOptionId}' is not a valid choice for item ${item.itemKey}.`,
          400,
          "INVALID_ANSWER_OPTION"
        );
      }

      if (typeof selectedOption.value !== "number" || isNaN(selectedOption.value)) {
        throw new AssessmentError(
          `Option '${selectedOptionId}' is missing an approved scoring weight.`,
          400,
          "OPTION_WEIGHT_MISSING"
        );
      }

      const optionValues = options.map((opt) => (typeof opt.value === "number" ? opt.value : 0));
      const maxOptionValue = Math.max(...optionValues);
      const minOptionValue = Math.min(...optionValues);

      factorRawSum += selectedOption.value;
      // Reverse-scoring maps the scale onto itself (e.g. 1..5 becomes 5..1)
      factorInterpretedSum +=
        direction === "HIGHER_IS_CONCERN"
          ? minOptionValue + maxOptionValue - selectedOption.value
          : selectedOption.value;
      factorMaxSum += maxOptionValue;

      rawAnswersWithValues.push({
        itemId: item.id,
        selectedOptionId,
        numericValue: selectedOption.value,
      });
    }

    // The bar shows the score as answered; classification uses the reverse-scored value
    // for HIGHER_IS_CONCERN factors, so a high frequency of a concerning behaviour can
    // never be read as a strength.
    const percentage = factorMaxSum > 0 ? Math.round((factorRawSum / factorMaxSum) * 100) : 0;
    const interpretedPercentage =
      factorMaxSum > 0 ? Math.round((factorInterpretedSum / factorMaxSum) * 100) : 0;
    totalInterpretedSum += factorInterpretedSum;

    const { band, classification } = classifyPercentage(interpretedPercentage, config);
    const dimension: DimensionResult = {
      factorCode: factor.code,
      factorName: factor.name,
      factorDescription: factor.description,
      direction,
      percentage,
      interpretedPercentage,
      band: band.name,
      classification,
    };

    factorScores[factor.code] = withInterpretation(
      {
        factorCode: factor.code,
        factorName: factor.name,
        rawScore: factorRawSum,
        maxScore: factorMaxSum,
        percentage,
        band: band.name,
        summaryText: band.description,
      },
      dimension
    );

    const guidance = config.guidanceTemplates?.[factor.code];
    if (classification === "STRENGTH") {
      strengths.push(buildStrength(dimension, guidance));
    } else if (classification === "GROWTH_OPPORTUNITY") {
      growthAreas.push(buildGrowthArea(dimension, guidance));
    } else {
      steadyAreas.push(buildSteadyArea(dimension, guidance));
    }
  }

  // Most pressing growth areas first (lowest interpreted score)
  growthAreas.sort(
    (a, b) =>
      (factorScores[a.factorCode].interpretedPercentage ?? 0) -
      (factorScores[b.factorCode].interpretedPercentage ?? 0)
  );

  return {
    factorScores,
    // Sum after reverse-scoring, as the instrument specification requires for an overall score
    overallScore: totalInterpretedSum,
    strengths,
    growthAreas,
    steadyAreas,
    rawAnswersWithValues,
  };
}

/**
 * Maps a (direction-adjusted) percentage to the approved band. The band's own
 * classification decides the section, so the label shown on a dimension and the section
 * it appears in can never disagree. If the configuration leaves a gap, the approved
 * thresholds are used instead of silently falling back to the first band.
 */
export function classifyPercentage(
  pct: number,
  config: ApprovedScoringConfig
): { band: { name: string; description?: string }; classification: ResultClassification } {
  const band = config.bands.find((b) => pct >= b.minPercentage && pct <= b.maxPercentage);
  if (band) {
    return { band, classification: band.classification };
  }
  if (pct >= config.strengthsThresholdPct) {
    return { band: { name: "Strength" }, classification: "STRENGTH" };
  }
  if (pct <= config.growthThresholdPct) {
    return { band: { name: "Area for Growth" }, classification: "GROWTH_OPPORTUNITY" };
  }
  return { band: { name: "Developing" }, classification: "STEADY" };
}
