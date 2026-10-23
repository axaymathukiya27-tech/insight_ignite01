import {
  AreaSummaryDto,
  FactorScoreDto,
  ResultClassification,
  ScoringDirection,
} from "@insight-ignite/shared";

/**
 * Report wording for one dimension. Text authored in the version's approved scoring
 * configuration (guidanceTemplates) always wins; the fallbacks below are deliberately
 * generic and only describe what the score means in the dimension's own direction, so a
 * dimension is never described with another dimension's text.
 */
export interface DimensionGuidance {
  strengthTitle?: string;
  strengthHabit?: string;
  growthTitle?: string;
  growthHabit?: string;
  strengthExplanation?: string;
  strengthWhy?: string;
  growthExplanation?: string;
  growthBehavior?: string;
  growthActions?: string[];
  growthExample?: string;
  steadyExplanation?: string;
  steadyTip?: string;
}

export interface DimensionResult {
  factorCode: string;
  factorName: string;
  factorDescription: string | null;
  direction: ScoringDirection;
  percentage: number; // as answered
  interpretedPercentage: number; // after reverse-scoring
  band: string;
  classification: ResultClassification;
}

/** One-sentence reading of a score, shown in the Growth Dimension Breakdown. */
export function describeScore(d: DimensionResult): string {
  if (d.direction === "HIGHER_IS_CONCERN") {
    return `This dimension measures how often these behaviours happen, so a lower score is the positive result. Your answers place it at ${d.percentage}% of the maximum frequency (${d.interpretedPercentage}% after reverse-scoring), which falls in the "${d.band}" range.`;
  }
  return `Higher scores mean these behaviours happen more often, which is positive. Your answers place this dimension at ${d.percentage}%, in the "${d.band}" range.`;
}

export function buildStrength(d: DimensionResult, g: DimensionGuidance | undefined): AreaSummaryDto {
  const concern = d.direction === "HIGHER_IS_CONCERN";
  return {
    factorCode: d.factorCode,
    factorName: d.factorName,
    percentage: d.percentage,
    band: d.band,
    direction: d.direction,
    title: g?.strengthTitle || `${d.factorName}: a foundational strength`,
    description:
      g?.strengthExplanation ||
      (concern
        ? `Your answers show that the behaviours described under ${d.factorName} happen rarely in your everyday parenting.`
        : `Your answers show that the behaviours described under ${d.factorName} happen often in your everyday parenting.`),
    whyItMatters:
      g?.strengthWhy ||
      (concern
        ? `On this dimension a low score is the positive pattern. After reverse-scoring, your result falls in the "${d.band}" range of this assessment.`
        : `On this dimension a high score is the positive pattern, and your result falls in the "${d.band}" range of this assessment.`),
    actionableHabit:
      g?.strengthHabit ||
      "Notice the moments when this comes naturally to you and name them to yourself, so the habit stays intentional when life gets busy.",
  };
}

export function buildGrowthArea(d: DimensionResult, g: DimensionGuidance | undefined): AreaSummaryDto {
  const concern = d.direction === "HIGHER_IS_CONCERN";
  const actions =
    g?.growthActions && g.growthActions.length > 0
      ? g.growthActions
      : concern
      ? [
          g?.growthHabit ||
            "Notice when this pattern tends to appear (for example when you are tired or rushed) and pause for a breath before responding.",
          "When you need to correct your child, describe the behaviour and what you would like instead, rather than commenting on who your child is.",
          "Afterwards, repair: briefly acknowledge what happened and reconnect with your child.",
        ]
      : [
          g?.growthHabit ||
            "Choose one ordinary moment each day (a meal, the drive to school, bedtime) to practise this on purpose.",
          "Notice one time this week when it went well, and what helped it go well.",
          "Start small: aim for one more instance a day rather than a big change all at once.",
        ];

  return {
    factorCode: d.factorCode,
    factorName: d.factorName,
    percentage: d.percentage,
    band: d.band,
    direction: d.direction,
    title: g?.growthTitle || `${d.factorName}: an area for growth`,
    description:
      g?.growthExplanation ||
      (concern
        ? `Your answers suggest that the behaviours described under ${d.factorName} happen fairly often right now. This is common, especially under stress, and it can change with practice. It is a reflection, not a diagnosis or a judgement of you as a parent.`
        : `Your answers suggest that the behaviours described under ${d.factorName} happen less often right now than they could. This is an area to build gradually. It is a reflection, not a diagnosis or a judgement of you as a parent.`),
    behaviorFocus:
      g?.growthBehavior ||
      `How often the behaviours described under ${d.factorName} show up in everyday interactions with your child.`,
    actions: actions.slice(0, 3),
    actionableHabit: actions[0],
    example:
      g?.growthExample ||
      (concern
        ? "For example, when you feel frustrated about something your child has done, take a breath, say calmly what you noticed and what you need, and invite your child to help solve it."
        : "For example, the next time a routine moment calls for this, such as getting ready in the morning or talking about the school day, slow down and try one of the actions above."),
  };
}

export function buildSteadyArea(d: DimensionResult, g: DimensionGuidance | undefined): AreaSummaryDto {
  return {
    factorCode: d.factorCode,
    factorName: d.factorName,
    percentage: d.percentage,
    band: d.band,
    direction: d.direction,
    title: `${d.factorName}: developing`,
    description:
      g?.steadyExplanation ||
      `Your result on ${d.factorName} is in the "${d.band}" range: a developing pattern that is neither a clear strength nor a priority area right now.`,
    actionableHabit:
      g?.steadyTip ||
      g?.strengthHabit ||
      "Keep practising what already works, and notice which situations make this easier or harder for you.",
  };
}

/**
 * Rebuilds the "developing" (neither strength nor growth) entries from stored factor
 * scores. Only results that carry a classification take part; legacy results return [].
 */
export function steadyAreasFromScores(
  scores: Record<string, FactorScoreDto>,
  guidanceTemplates: Record<string, DimensionGuidance> | undefined
): AreaSummaryDto[] {
  return Object.values(scores || {})
    .filter((s) => s.classification === "STEADY")
    .map((s) =>
      buildSteadyArea(
        {
          factorCode: s.factorCode,
          factorName: s.factorName,
          factorDescription: s.dimensionDescription ?? null,
          direction: s.direction ?? "HIGHER_IS_POSITIVE",
          percentage: s.percentage,
          interpretedPercentage: s.interpretedPercentage ?? s.percentage,
          band: s.band,
          classification: "STEADY",
        },
        guidanceTemplates?.[s.factorCode]
      )
    );
}

/** Attaches the direction-aware reading to a factor score. */
export function withInterpretation(score: FactorScoreDto, d: DimensionResult): FactorScoreDto {
  return {
    ...score,
    direction: d.direction,
    interpretedPercentage: d.interpretedPercentage,
    classification: d.classification,
    dimensionDescription: d.factorDescription,
    interpretation: describeScore(d),
  };
}
