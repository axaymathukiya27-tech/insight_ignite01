"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentError = void 0;
exports.getActiveAssessment = getActiveAssessment;
exports.submitAssessment = submitAssessment;
exports.getAssessmentResult = getAssessmentResult;
exports.claimAssessment = claimAssessment;
exports.getUserAssessmentHistory = getUserAssessmentHistory;
const database_1 = require("@insight-ignite/database");
const scoring_service_1 = require("./scoring.service");
Object.defineProperty(exports, "AssessmentError", { enumerable: true, get: function () { return scoring_service_1.AssessmentError; } });
const recommendations_service_1 = require("./recommendations.service");
const token_util_1 = require("./token.util");
/**
 * Public catalog retrieval of the currently active, approved assessment instrument.
 * Excludes internal scoring formulas and question point weights.
 */
async function getActiveAssessment(slug = "parent-growth-self-assessment") {
    const instrument = await database_1.prisma.assessmentInstrument.findFirst({
        where: {
            slug,
            status: database_1.AssessmentStatus.ACTIVE,
        },
        include: {
            versions: {
                where: {
                    status: database_1.AssessmentStatus.ACTIVE,
                },
                include: {
                    factors: {
                        orderBy: { orderIndex: "asc" },
                    },
                    items: {
                        orderBy: { orderIndex: "asc" },
                        include: {
                            factor: true,
                        },
                    },
                },
            },
        },
    });
    if (!instrument || instrument.versions.length === 0) {
        throw new scoring_service_1.AssessmentError("No active published assessment version is currently available.", 404, "NO_ACTIVE_ASSESSMENT");
    }
    const activeVersion = instrument.versions[0];
    const factors = activeVersion.factors.map((f) => ({
        code: f.code,
        name: f.name,
        tagline: f.tagline,
        description: f.description,
        orderIndex: f.orderIndex,
    }));
    const items = activeVersion.items.map((item) => {
        const rawOptions = item.options || [];
        // Strictly strip internal scoring weights before public response
        const publicOptions = rawOptions.map((opt) => ({
            id: opt.id,
            label: opt.label,
            orderIndex: opt.orderIndex,
        }));
        return {
            id: item.id,
            factorCode: item.factor.code,
            itemKey: item.itemKey,
            orderIndex: item.orderIndex,
            prompt: item.prompt,
            contextPrompt: item.contextPrompt,
            options: publicOptions,
            isRequired: item.isRequired,
        };
    });
    return {
        id: instrument.id,
        versionId: activeVersion.id,
        versionNumber: activeVersion.versionNumber,
        slug: instrument.slug,
        title: instrument.title,
        subtitle: instrument.subtitle,
        description: instrument.description,
        disclaimerText: activeVersion.disclaimerText,
        instructionsText: activeVersion.instructionsText,
        factors,
        items,
    };
}
/**
 * Validates responses, calculates scores server-side, saves results,
 * and sets up cryptographic credentials for anonymous or authenticated access.
 */
async function submitAssessment(input, user) {
    // Validate version existence and active status
    const version = await database_1.prisma.assessmentVersion.findUnique({
        where: { id: input.versionId },
        include: {
            instrument: true,
            factors: { orderBy: { orderIndex: "asc" } },
            items: { orderBy: { orderIndex: "asc" } },
        },
    });
    if (!version || version.status !== database_1.AssessmentStatus.ACTIVE) {
        throw new scoring_service_1.AssessmentError("The submitted assessment version is not currently active.", 400, "VERSION_NOT_ACTIVE");
    }
    // Calculate scores strictly using version's approved scoring configuration
    const computed = (0, scoring_service_1.calculateAssessmentScores)(version, version.factors, version.items, input.answers);
    // Derive published course recommendations
    const recommendedCourses = await (0, recommendations_service_1.getApprovedCourseRecommendations)(version.id, computed.factorScores);
    // Handle credentials: guest tokens vs authenticated user
    let rawAccessKey;
    let rawClaimToken;
    let accessKeyHash = null;
    let claimTokenHash = null;
    let expiresAt = null;
    if (user) {
        // Authenticated user: linked immediately to account; no expiration
        expiresAt = null;
    }
    else {
        // Anonymous participant: generate cryptographically secure tokens
        rawAccessKey = (0, token_util_1.generateSecureToken)(32);
        rawClaimToken = (0, token_util_1.generateSecureToken)(32);
        accessKeyHash = (0, token_util_1.hashToken)(rawAccessKey);
        claimTokenHash = (0, token_util_1.hashToken)(rawClaimToken);
        expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days retention
    }
    // Persist submission, raw responses, and results inside an atomic transaction
    const submission = await database_1.prisma.$transaction(async (tx) => {
        const sub = await tx.assessmentSubmission.create({
            data: {
                versionId: version.id,
                userId: user ? user.id : null,
                accessKeyHash,
                claimTokenHash,
                status: database_1.AssessmentSubmissionStatus.SUBMITTED,
                completedAt: new Date(),
                expiresAt,
                consentGiven: true,
                consentNoticeVersion: input.consentNoticeVersion,
                consentGivenAt: new Date(),
            },
        });
        // Save individual raw responses
        await tx.assessmentRawResponse.createMany({
            data: computed.rawAnswersWithValues.map((ans) => ({
                submissionId: sub.id,
                itemId: ans.itemId,
                selectedOptionId: ans.selectedOptionId,
                numericValue: ans.numericValue,
            })),
        });
        // Save computed results
        await tx.assessmentResult.create({
            data: {
                submissionId: sub.id,
                versionId: version.id,
                factorScores: computed.factorScores,
                overallScore: computed.overallScore,
                strengths: computed.strengths,
                growthAreas: computed.growthAreas,
                recommendationsSummary: recommendedCourses,
            },
        });
        return sub;
    });
    const resultDto = {
        submissionId: submission.id,
        versionNumber: version.versionNumber,
        completedAt: submission.completedAt ? submission.completedAt.toISOString() : new Date().toISOString(),
        isAnonymous: !user,
        claimToken: rawClaimToken, // Returned once upon initial submission for user to save
        factorScores: computed.factorScores,
        strengths: computed.strengths,
        growthAreas: computed.growthAreas,
        recommendedCourses,
        disclaimer: version.disclaimerText ||
            "This self-assessment is an educational self-reflection tool, not a diagnostic or clinical evaluation.",
    };
    return {
        result: resultDto,
        accessKey: rawAccessKey,
        claimToken: rawClaimToken,
        expiresAt: expiresAt || undefined,
    };
}
/**
 * Retrieves a calculated assessment result with strict authorization checks.
 * Requires either a matching authenticated session or a valid anonymous access key hash.
 */
async function getAssessmentResult(submissionId, user, accessKey) {
    const submission = await database_1.prisma.assessmentSubmission.findUnique({
        where: { id: submissionId },
        include: {
            result: true,
            version: {
                include: {
                    instrument: true,
                },
            },
        },
    });
    if (!submission || !submission.result) {
        throw new scoring_service_1.AssessmentError("Assessment result not found.", 404, "NOT_FOUND");
    }
    // Check expiration on anonymous sessions
    if (submission.expiresAt && submission.expiresAt.getTime() <= Date.now()) {
        throw new scoring_service_1.AssessmentError("This anonymous assessment session has expired and is no longer available.", 410, "SESSION_EXPIRED");
    }
    // Authorization check
    if (submission.userId) {
        // Authenticated result: must belong to the logged-in user or an authorized admin
        if (!user || (user.id !== submission.userId && user.role !== database_1.UserRole.PLATFORM_ADMIN)) {
            throw new scoring_service_1.AssessmentError("You do not have permission to view this assessment report.", 403, "FORBIDDEN");
        }
    }
    else {
        // Anonymous result: requires matching access key hash
        if (!accessKey || accessKey.trim() === "") {
            throw new scoring_service_1.AssessmentError("Access credential required to view this anonymous assessment result.", 403, "UNAUTHORIZED");
        }
        const providedHash = (0, token_util_1.hashToken)(accessKey);
        if (providedHash !== submission.accessKeyHash) {
            throw new scoring_service_1.AssessmentError("Invalid access credential for this assessment result.", 403, "FORBIDDEN");
        }
    }
    return {
        submissionId: submission.id,
        versionNumber: submission.version.versionNumber,
        completedAt: submission.completedAt ? submission.completedAt.toISOString() : submission.createdAt.toISOString(),
        isAnonymous: submission.userId === null,
        factorScores: submission.result.factorScores,
        strengths: submission.result.strengths || [],
        growthAreas: submission.result.growthAreas || [],
        recommendedCourses: submission.result.recommendationsSummary || [],
        disclaimer: submission.version.disclaimerText ||
            "This self-assessment is an educational self-reflection tool, not a diagnostic or clinical evaluation.",
    };
}
/**
 * Links an anonymous submission to an authenticated user account.
 * Single-use: invalidates the claim token upon use.
 */
async function claimAssessment(claimToken, user) {
    if (!claimToken || claimToken.trim() === "") {
        throw new scoring_service_1.AssessmentError("A valid claim token is required.", 400, "INVALID_CLAIM_TOKEN");
    }
    const claimTokenHash = (0, token_util_1.hashToken)(claimToken);
    return await database_1.prisma.$transaction(async (tx) => {
        const submission = await tx.assessmentSubmission.findUnique({
            where: { claimTokenHash },
        });
        if (!submission) {
            throw new scoring_service_1.AssessmentError("The provided claim token is invalid, expired, or has already been used.", 400, "INVALID_CLAIM_TOKEN");
        }
        if (submission.userId !== null) {
            throw new scoring_service_1.AssessmentError("This assessment result has already been claimed.", 400, "ALREADY_CLAIMED");
        }
        if (submission.expiresAt && submission.expiresAt.getTime() <= Date.now()) {
            throw new scoring_service_1.AssessmentError("This assessment session has expired and can no longer be claimed.", 410, "SESSION_EXPIRED");
        }
        // Atomically link to user, nullify claim token, and remove retention expiration
        await tx.assessmentSubmission.update({
            where: { id: submission.id },
            data: {
                userId: user.id,
                status: database_1.AssessmentSubmissionStatus.CLAIMED,
                claimTokenHash: null, // Nullify to prevent reuse
                expiresAt: null, // Saved permanently with user profile
            },
        });
        return {
            success: true,
            submissionId: submission.id,
            message: "Assessment result has been successfully saved to your profile.",
        };
    });
}
/**
 * Retrieves assessment submission history for an authenticated participant.
 * Strictly scoped to the authenticated user's ID.
 */
async function getUserAssessmentHistory(userId) {
    const submissions = await database_1.prisma.assessmentSubmission.findMany({
        where: {
            userId,
            status: {
                in: [database_1.AssessmentSubmissionStatus.SUBMITTED, database_1.AssessmentSubmissionStatus.CLAIMED],
            },
        },
        include: {
            version: {
                include: {
                    instrument: true,
                },
            },
            result: true,
        },
        orderBy: { createdAt: "desc" },
    });
    return submissions.map((sub) => {
        const strengths = sub.result?.strengths || [];
        const growthAreas = sub.result?.growthAreas || [];
        return {
            submissionId: sub.id,
            instrumentTitle: sub.version.instrument.title,
            versionNumber: sub.version.versionNumber,
            completedAt: sub.completedAt
                ? sub.completedAt.toISOString()
                : sub.createdAt.toISOString(),
            topStrength: strengths[0]?.factorName,
            topGrowthArea: growthAreas[0]?.factorName,
        };
    });
}
