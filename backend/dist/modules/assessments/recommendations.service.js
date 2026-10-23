"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectRecommendationFactors = selectRecommendationFactors;
exports.describeRelevance = describeRelevance;
exports.getApprovedCourseRecommendations = getApprovedCourseRecommendations;
exports.refreshCourseRecommendations = refreshCourseRecommendations;
const database_1 = require("@insight-ignite/database");
/**
 * Chooses which dimensions course recommendations should address, using the
 * direction-aware classification rather than the raw percentage:
 *   - growth areas first, most pressing (lowest interpreted score) first;
 *   - if there are none, developing (steady) dimensions;
 *   - never dimensions classified as strengths.
 */
function selectRecommendationFactors(factorScores) {
    const scores = Object.values(factorScores);
    const byNeed = (a, b) => (a.interpretedPercentage ?? a.percentage) - (b.interpretedPercentage ?? b.percentage);
    const growth = scores.filter((s) => s.classification === "GROWTH_OPPORTUNITY").sort(byNeed);
    if (growth.length > 0)
        return growth.map((s) => s.factorCode);
    return scores.filter((s) => s.classification === "STEADY").sort(byNeed).map((s) => s.factorCode);
}
/** Direction-aware sentence explaining why a course is suggested. */
function describeRelevance(score, factorName) {
    if (!score)
        return `Suggested to support your growth in ${factorName}.`;
    const label = score.band ? ` ("${score.band}")` : "";
    return score.direction === "HIGHER_IS_CONCERN"
        ? `Suggested because your answers show the behaviours in ${factorName} happen fairly often${label}; this course offers practical alternatives.`
        : `Suggested to help you build ${factorName}${label} in everyday moments.`;
}
/**
 * Derives published course recommendations based on approved version mappings
 * for the dimensions selected above.
 */
async function getApprovedCourseRecommendations(versionId, factorScores) {
    const candidateFactorCodes = selectRecommendationFactors(factorScores);
    if (candidateFactorCodes.length === 0) {
        return [];
    }
    // Retrieve approved mappings for this version
    const mappings = await database_1.prisma.assessmentCourseMapping.findMany({
        where: {
            versionId,
            factor: {
                code: { in: candidateFactorCodes },
            },
            // Strictly enforce published courses only
            course: {
                status: database_1.CourseStatus.PUBLISHED,
            },
        },
        include: {
            course: true,
            factor: true,
        },
        orderBy: {
            displayOrder: "asc",
        },
    });
    // Order by need (the order of candidateFactorCodes), then by displayOrder
    mappings.sort((a, b) => candidateFactorCodes.indexOf(a.factor.code) - candidateFactorCodes.indexOf(b.factor.code) ||
        a.displayOrder - b.displayOrder);
    const seenCourseIds = new Set();
    const recommendations = [];
    for (const m of mappings) {
        if (seenCourseIds.has(m.courseId)) {
            continue;
        }
        seenCourseIds.add(m.courseId);
        recommendations.push({
            courseId: m.course.id,
            slug: m.course.slug,
            title: m.course.title,
            subtitle: m.course.subtitle,
            instructor: m.course.instructor,
            thumbnailUrl: m.course.thumbnailUrl,
            relevanceReason: m.customGuidance || describeRelevance(factorScores[m.factor.code], m.factor.name),
            matchingFactorCode: m.factor.code,
        });
    }
    return recommendations;
}
/**
 * Re-checks stored course suggestions against the live catalogue when a report is shown:
 * courses that are no longer published are dropped, and real catalogue facts (price,
 * lesson count, total duration when every lesson has one, and whether this parent is
 * already enrolled) are filled in. Nothing is invented when a fact is missing.
 */
async function refreshCourseRecommendations(stored, userId) {
    if (!stored || stored.length === 0)
        return [];
    const courses = await database_1.prisma.course.findMany({
        where: { id: { in: stored.map((c) => c.courseId) }, status: database_1.CourseStatus.PUBLISHED },
        include: {
            lessons: { select: { durationMin: true } },
            enrollments: userId ? { where: { userId }, select: { id: true } } : false,
        },
    });
    const byId = new Map(courses.map((c) => [c.id, c]));
    return stored
        .filter((rec) => byId.has(rec.courseId))
        .map((rec) => {
        const c = byId.get(rec.courseId);
        const durations = c.lessons.map((l) => l.durationMin);
        return {
            ...rec,
            slug: c.slug,
            title: c.title,
            subtitle: c.subtitle,
            instructor: c.instructor,
            thumbnailUrl: c.thumbnailUrl,
            priceAmount: c.priceAmount,
            currency: c.currency,
            lessonCount: c.lessons.length,
            totalDurationMin: durations.length > 0 && durations.every((d) => typeof d === "number")
                ? durations.reduce((a, b) => a + b, 0)
                : null,
            isEnrolled: userId ? (c.enrollments?.length ?? 0) > 0 : undefined,
        };
    });
}
