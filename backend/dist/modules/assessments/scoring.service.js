"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovedScoringConfigSchema = exports.FactorGuidanceTemplateSchema = exports.ScoringBandSchema = exports.AssessmentError = void 0;
exports.calculateAssessmentScores = calculateAssessmentScores;
exports.selectEvidence = selectEvidence;
exports.classifyPercentage = classifyPercentage;
const zod_1 = require("zod");
const report_content_1 = require("./report-content");
class AssessmentError extends Error {
    statusCode;
    code;
    details;
    constructor(message, statusCode = 400, code = "ASSESSMENT_ERROR", details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = "AssessmentError";
    }
}
exports.AssessmentError = AssessmentError;
/**
 * Strict schema for approved scoring configurations.
 * If an assessment version does not contain an approved, validated configuration,
 * the scoring engine safely halts execution rather than inventing scores.
 */
exports.ScoringBandSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Band name is required"),
    minPercentage: zod_1.z.number().min(0).max(100),
    maxPercentage: zod_1.z.number().min(0).max(100),
    classification: zod_1.z.enum(["STRENGTH", "STEADY", "GROWTH_OPPORTUNITY"]),
    description: zod_1.z.string().optional(),
});
exports.FactorGuidanceTemplateSchema = zod_1.z.object({
    strengthTitle: zod_1.z.string(),
    strengthHabit: zod_1.z.string(),
    growthTitle: zod_1.z.string(),
    growthHabit: zod_1.z.string(),
    // Optional richer report wording (authored and approved per dimension)
    strengthExplanation: zod_1.z.string().optional(),
    strengthWhy: zod_1.z.string().optional(),
    growthExplanation: zod_1.z.string().optional(),
    growthBehavior: zod_1.z.string().optional(),
    growthActions: zod_1.z.array(zod_1.z.string().min(1)).min(1).max(5).optional(),
    growthExample: zod_1.z.string().optional(),
    growthGoal: zod_1.z.string().optional(),
    steadyExplanation: zod_1.z.string().optional(),
    steadyTip: zod_1.z.string().optional(),
});
exports.ApprovedScoringConfigSchema = zod_1.z.object({
    formula: zod_1.z.enum(["SUM_OF_WEIGHTS", "AVERAGE_WEIGHTS"]).default("SUM_OF_WEIGHTS"),
    bands: zod_1.z.array(exports.ScoringBandSchema).min(1, "At least one scoring band must be defined"),
    strengthsThresholdPct: zod_1.z.number().min(0).max(100).default(70),
    growthThresholdPct: zod_1.z.number().min(0).max(100).default(50),
    guidanceTemplates: zod_1.z.record(zod_1.z.string(), exports.FactorGuidanceTemplateSchema).optional(),
    // Factor codes where a HIGHER answer means a MORE FREQUENT CONCERNING behaviour.
    // Every item in these factors is reverse-scored (min + max - value) before the
    // factor is classified and before it is added to the overall score.
    reverseScoredFactors: zod_1.z.array(zod_1.z.string().min(1)).default([]),
});
/**
 * Calculates scores server-side strictly against the validated scoring configuration
 * of an approved assessment version.
 */
function calculateAssessmentScores(version, factors, items, answers) {
    if (!version.scoringConfig) {
        throw new AssessmentError("Assessment version does not have an approved scoring configuration. Scoring cannot be performed.", 400, "SCORING_CONFIG_INVALID");
    }
    const parseResult = exports.ApprovedScoringConfigSchema.safeParse(version.scoringConfig);
    if (!parseResult.success) {
        throw new AssessmentError("The scoring configuration for this assessment version is malformed or invalid.", 400, "SCORING_CONFIG_INVALID", parseResult.error.format());
    }
    const config = parseResult.data;
    // Build answer lookup
    const answerMap = new Map();
    for (const ans of answers) {
        if (answerMap.has(ans.itemId)) {
            throw new AssessmentError(`Duplicate answer provided for item ${ans.itemId}.`, 400, "DUPLICATE_ANSWER");
        }
        answerMap.set(ans.itemId, ans.selectedOptionId);
    }
    // Validate item answers and compute per-item values
    const rawAnswersWithValues = [];
    const factorScores = {};
    const strengths = [];
    const growthAreas = [];
    const steadyAreas = [];
    const reverseScored = new Set(config.reverseScoredFactors);
    const dimensions = [];
    let totalInterpretedSum = 0;
    for (const factor of factors) {
        const factorItems = items.filter((it) => it.factorId === factor.id);
        if (factorItems.length === 0) {
            continue;
        }
        const direction = reverseScored.has(factor.code)
            ? "HIGHER_IS_CONCERN"
            : "HIGHER_IS_POSITIVE";
        let factorRawSum = 0;
        let factorInterpretedSum = 0;
        let factorMaxSum = 0;
        // Where each answer sits on its own scale after reverse-scoring (0 = least positive, 1 = most)
        const answered = [];
        for (const item of factorItems) {
            const selectedOptionId = answerMap.get(item.id);
            if (!selectedOptionId) {
                if (item.isRequired) {
                    throw new AssessmentError(`Missing answer for required item: ${item.itemKey}`, 400, "MISSING_REQUIRED_ANSWER");
                }
                continue;
            }
            // Parse options
            const options = item.options;
            if (!Array.isArray(options) || options.length === 0) {
                throw new AssessmentError(`Item ${item.itemKey} has no options defined in configuration.`, 400, "ITEM_CONFIGURATION_ERROR");
            }
            const selectedOption = options.find((opt) => opt.id === selectedOptionId);
            if (!selectedOption) {
                throw new AssessmentError(`Option '${selectedOptionId}' is not a valid choice for item ${item.itemKey}.`, 400, "INVALID_ANSWER_OPTION");
            }
            if (typeof selectedOption.value !== "number" || isNaN(selectedOption.value)) {
                throw new AssessmentError(`Option '${selectedOptionId}' is missing an approved scoring weight.`, 400, "OPTION_WEIGHT_MISSING");
            }
            const optionValues = options.map((opt) => (typeof opt.value === "number" ? opt.value : 0));
            const maxOptionValue = Math.max(...optionValues);
            const minOptionValue = Math.min(...optionValues);
            factorRawSum += selectedOption.value;
            // Reverse-scoring maps the scale onto itself (e.g. 1..5 becomes 5..1)
            const interpretedValue = direction === "HIGHER_IS_CONCERN"
                ? minOptionValue + maxOptionValue - selectedOption.value
                : selectedOption.value;
            factorInterpretedSum += interpretedValue;
            factorMaxSum += maxOptionValue;
            if (maxOptionValue > minOptionValue) {
                answered.push({
                    prompt: item.prompt,
                    answerLabel: selectedOption.label,
                    position: (interpretedValue - minOptionValue) / (maxOptionValue - minOptionValue),
                });
            }
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
        const interpretedPercentage = factorMaxSum > 0 ? Math.round((factorInterpretedSum / factorMaxSum) * 100) : 0;
        totalInterpretedSum += factorInterpretedSum;
        const { band, classification } = classifyPercentage(interpretedPercentage, config);
        const dimension = {
            factorCode: factor.code,
            factorName: factor.name,
            factorDescription: factor.description,
            direction,
            percentage,
            interpretedPercentage,
            band: band.name,
            classification,
            evidence: selectEvidence(answered),
        };
        dimensions.push(dimension);
        factorScores[factor.code] = (0, report_content_1.withInterpretation)({
            factorCode: factor.code,
            factorName: factor.name,
            orderIndex: factor.orderIndex,
            rawScore: factorRawSum,
            maxScore: factorMaxSum,
            percentage,
            band: band.name,
            summaryText: band.description,
        }, dimension);
        const guidance = config.guidanceTemplates?.[factor.code];
        if (classification === "STRENGTH") {
            strengths.push((0, report_content_1.buildStrength)(dimension, guidance));
        }
        else if (classification === "GROWTH_OPPORTUNITY") {
            growthAreas.push((0, report_content_1.buildGrowthArea)(dimension, guidance));
        }
        else {
            steadyAreas.push((0, report_content_1.buildSteadyArea)(dimension, guidance));
        }
    }
    // Most pressing growth areas first (lowest interpreted score)
    growthAreas.sort((a, b) => (factorScores[a.factorCode].interpretedPercentage ?? 0) -
        (factorScores[b.factorCode].interpretedPercentage ?? 0));
    const practicePlan = (0, report_content_1.buildPracticePlan)(dimensions, config.guidanceTemplates);
    const practiceRecommendations = (0, report_content_1.buildPracticeRecommendations)(dimensions, config.guidanceTemplates, practicePlan);
    return {
        factorScores,
        // Sum after reverse-scoring, as the instrument specification requires for an overall score
        overallScore: totalInterpretedSum,
        strengths,
        growthAreas,
        steadyAreas,
        practicePlan,
        practiceRecommendations,
        rawAnswersWithValues,
    };
}
/**
 * Picks the parent's own answers that best illustrate a dimension: up to two answers on the
 * positive half of the scale ("supports") and up to two on the other half ("practice").
 * Answers exactly at the midpoint are neutral and never quoted. This only selects which
 * answers to quote; it plays no part in scoring or classification.
 */
function selectEvidence(answered) {
    const supports = answered
        .filter((a) => a.position > 0.5)
        .sort((a, b) => b.position - a.position)
        .slice(0, 2)
        .map((a) => ({ prompt: a.prompt, answerLabel: a.answerLabel, signal: "supports" }));
    const practice = answered
        .filter((a) => a.position < 0.5)
        .sort((a, b) => a.position - b.position)
        .slice(0, 2)
        .map((a) => ({ prompt: a.prompt, answerLabel: a.answerLabel, signal: "practice" }));
    return [...supports, ...practice];
}
/**
 * Maps a (direction-adjusted) percentage to the approved band. The band's own
 * classification decides the section, so the label shown on a dimension and the section
 * it appears in can never disagree. If the configuration leaves a gap, the approved
 * thresholds are used instead of silently falling back to the first band.
 */
function classifyPercentage(pct, config) {
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
