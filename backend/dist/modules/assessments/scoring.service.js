"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovedScoringConfigSchema = exports.FactorGuidanceTemplateSchema = exports.ScoringBandSchema = exports.AssessmentError = void 0;
exports.calculateAssessmentScores = calculateAssessmentScores;
const zod_1 = require("zod");
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
});
exports.ApprovedScoringConfigSchema = zod_1.z.object({
    formula: zod_1.z.enum(["SUM_OF_WEIGHTS", "AVERAGE_WEIGHTS"]).default("SUM_OF_WEIGHTS"),
    bands: zod_1.z.array(exports.ScoringBandSchema).min(1, "At least one scoring band must be defined"),
    strengthsThresholdPct: zod_1.z.number().min(0).max(100).default(70),
    growthThresholdPct: zod_1.z.number().min(0).max(100).default(50),
    guidanceTemplates: zod_1.z.record(zod_1.z.string(), exports.FactorGuidanceTemplateSchema).optional(),
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
    let totalRawSum = 0;
    for (const factor of factors) {
        const factorItems = items.filter((it) => it.factorId === factor.id);
        if (factorItems.length === 0) {
            continue;
        }
        let factorRawSum = 0;
        let factorMaxSum = 0;
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
            const maxOptionValue = Math.max(...options.map((opt) => (typeof opt.value === "number" ? opt.value : 0)));
            factorRawSum += selectedOption.value;
            factorMaxSum += maxOptionValue;
            rawAnswersWithValues.push({
                itemId: item.id,
                selectedOptionId,
                numericValue: selectedOption.value,
            });
        }
        const percentage = factorMaxSum > 0 ? Math.round((factorRawSum / factorMaxSum) * 100) : 0;
        totalRawSum += factorRawSum;
        // Determine band from approved config
        const matchingBand = config.bands.find((b) => percentage >= b.minPercentage && percentage <= b.maxPercentage) || config.bands[0];
        factorScores[factor.code] = {
            factorCode: factor.code,
            factorName: factor.name,
            rawScore: factorRawSum,
            maxScore: factorMaxSum,
            percentage,
            band: matchingBand.name,
            summaryText: matchingBand.description,
        };
        const guidance = config.guidanceTemplates?.[factor.code];
        if (percentage >= config.strengthsThresholdPct) {
            strengths.push({
                factorCode: factor.code,
                factorName: factor.name,
                title: guidance?.strengthTitle || `${factor.name} Foundational Strength`,
                description: factor.description ||
                    `You demonstrate steady awareness and grounded engagement in ${factor.name}.`,
                actionableHabit: guidance?.strengthHabit ||
                    "Continue nurturing this grounded capacity as an emotional anchor during family challenges.",
            });
        }
        else if (percentage <= config.growthThresholdPct) {
            growthAreas.push({
                factorCode: factor.code,
                factorName: factor.name,
                title: guidance?.growthTitle || `Cultivating ${factor.name}`,
                description: factor.description ||
                    `This domain offers an encouraging opportunity to deepen connection and emotional stability.`,
                actionableHabit: guidance?.growthHabit ||
                    "Practice intentional pause and somatic self-regulation in moments of household tension.",
            });
        }
    }
    return {
        factorScores,
        overallScore: totalRawSum,
        strengths,
        growthAreas,
        rawAnswersWithValues,
    };
}
