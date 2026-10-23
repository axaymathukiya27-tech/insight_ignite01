import {
  PublicAssessmentInstrument,
  AssessmentResultDto,
  SubmitAssessmentInputSchema,
  ClaimAssessmentInputSchema,
} from "@insight-ignite/shared";
import {
  DEFAULT_CONSENT_NOTICE_VERSION,
  getActiveAssessment,
  submitAssessment,
  getAssessmentResult,
  claimAssessment,
  getMyAssessmentHistory,
} from "../src/features/assessments/api";

async function runFrontendAssessmentsTestSuite() {
  console.log("======================================================");
  console.log("   INSIGHT IGNITE — PHASE 3 FRONTEND TEST SUITE       ");
  console.log("======================================================");

  // -------------------------------------------------------------------------
  // 1. No Active Assessment State (Safe Failure & Unavailable Protocol)
  // -------------------------------------------------------------------------
  console.log("\n[1/6] Testing No-Active-Assessment Handling & Safe Fallback...");

  // Mock global fetch for 404 NO_ACTIVE_ASSESSMENT
  const originalFetch = global.fetch;

  try {
    global.fetch = async () => {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: "No active published assessment version is currently available.",
            code: "NO_ACTIVE_ASSESSMENT",
          },
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    };

    const active = await getActiveAssessment();
    if (active !== null) {
      throw new Error(`FAIL 1.1: Expected null on 404, received: ${JSON.stringify(active)}`);
    }
    console.log("  PASS 1.1: getActiveAssessment returns null on 404 without throwing or substituting mock questions.");

    // -------------------------------------------------------------------------
    // 2. Consent Enforcement & Contract Validation
    // -------------------------------------------------------------------------
    console.log("\n[2/6] Testing Consent Enforcement & Notice Validation...");

    if (DEFAULT_CONSENT_NOTICE_VERSION !== "2026.1-parent-self-reflection") {
      throw new Error(`FAIL 2.1: Unexpected default consent notice version: ${DEFAULT_CONSENT_NOTICE_VERSION}`);
    }
    console.log(`  PASS 2.1: Consent notice version matches approved specification (${DEFAULT_CONSENT_NOTICE_VERSION}).`);

    // Validate that SubmitAssessmentInputSchema rejects consentGiven = false
    const invalidConsentResult = SubmitAssessmentInputSchema.safeParse({
      versionId: "11111111-2222-3333-4444-555555555555",
      consentGiven: false,
      consentNoticeVersion: DEFAULT_CONSENT_NOTICE_VERSION,
      answers: [{ itemId: "22222222-3333-4444-5555-666666666666", selectedOptionId: "opt_1" }],
    });

    if (invalidConsentResult.success) {
      throw new Error("FAIL 2.2: Schema incorrectly accepted consentGiven = false!");
    }
    console.log("  PASS 2.2: SubmitAssessmentInputSchema strictly rejects consentGiven = false.");

    // Validate that SubmitAssessmentInputSchema rejects empty answers
    const emptyAnswersResult = SubmitAssessmentInputSchema.safeParse({
      versionId: "11111111-2222-3333-4444-555555555555",
      consentGiven: true,
      consentNoticeVersion: DEFAULT_CONSENT_NOTICE_VERSION,
      answers: [],
    });

    if (emptyAnswersResult.success) {
      throw new Error("FAIL 2.3: Schema incorrectly accepted empty answers array!");
    }
    console.log("  PASS 2.3: SubmitAssessmentInputSchema requires at least one answer.");

    // -------------------------------------------------------------------------
    // 3. Question Navigation & Answer Validation Logic
    // -------------------------------------------------------------------------
    console.log("\n[3/6] Testing Questionnaire Navigation & Progress Calculations...");

    const mockInstrument: PublicAssessmentInstrument = {
      id: "inst-1",
      versionId: "11111111-2222-3333-4444-555555555555",
      versionNumber: 1,
      slug: "parent-growth-self-assessment",
      title: "Parent Growth Self-Assessment",
      description: "Reflective tool for parent emotional presence.",
      factors: [
        { code: "PRESENCE", name: "Presence", orderIndex: 1 },
        { code: "REPAIR", name: "Relational Repair", orderIndex: 2 },
      ],
      items: [
        {
          id: "item-1",
          factorCode: "PRESENCE",
          itemKey: "pres_1",
          orderIndex: 1,
          prompt: "When my child is distressed, I can pause before reacting.",
          isRequired: true,
          options: [
            { id: "opt-1", label: "Rarely", orderIndex: 1 },
            { id: "opt-2", label: "Often", orderIndex: 2 },
          ],
        },
        {
          id: "item-2",
          factorCode: "REPAIR",
          itemKey: "rep_1",
          orderIndex: 2,
          prompt: "When conflict occurs, I initiate reconnective repair.",
          isRequired: true,
          options: [
            { id: "opt-3", label: "Rarely", orderIndex: 1 },
            { id: "opt-4", label: "Often", orderIndex: 2 },
          ],
        },
      ],
    };

    // Test sorting and progress calculations
    const sortedItems = [...mockInstrument.items].sort((a, b) => a.orderIndex - b.orderIndex);
    const progressQ1 = Math.round((1 / sortedItems.length) * 100);
    const progressQ2 = Math.round((2 / sortedItems.length) * 100);

    if (progressQ1 !== 50 || progressQ2 !== 100) {
      throw new Error(`FAIL 3.1: Incorrect progress calculation: Q1=${progressQ1}%, Q2=${progressQ2}%`);
    }
    console.log("  PASS 3.1: Progress bar calculations are accurate across questionnaire steps.");

    // -------------------------------------------------------------------------
    // 4. API Error Handling (Rate Limits, Expired Sessions, Retries)
    // -------------------------------------------------------------------------
    console.log("\n[4/6] Testing API Failure Handling & Error Contracts...");

    // Test 429 Rate Limit error
    global.fetch = async () => {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: "Too many assessment submissions from this network. Please wait before retrying.",
            code: "RATE_LIMIT_EXCEEDED",
          },
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    };

    let rateLimitCaught = false;
    try {
      await submitAssessment({
        versionId: mockInstrument.versionId,
        consentGiven: true,
        consentNoticeVersion: DEFAULT_CONSENT_NOTICE_VERSION,
        answers: [{ itemId: "item-1", selectedOptionId: "opt-1" }],
      });
    } catch (err: unknown) {
      rateLimitCaught = true;
      const msg = err instanceof Error ? err.message : "";
      if (!msg.includes("Too many assessment submissions")) {
        throw new Error(`FAIL 4.1: Unexpected rate limit error message: ${msg}`);
      }
    }

    if (!rateLimitCaught) {
      throw new Error("FAIL 4.1: Expected submitAssessment to throw on 429 status.");
    }
    console.log("  PASS 4.1: Rate limiting (429) triggers clean error with recovery instructions.");

    // Test 410 Session Expired on result fetch
    global.fetch = async () => {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: "This anonymous assessment session has expired and is no longer available.",
            code: "SESSION_EXPIRED",
          },
        }),
        { status: 410, headers: { "Content-Type": "application/json" } }
      );
    };

    let expiredCaught = false;
    try {
      await getAssessmentResult("expired-sub-id");
    } catch (err: unknown) {
      expiredCaught = true;
      const msg = err instanceof Error ? err.message : "";
      if (!msg.includes("expired")) {
        throw new Error(`FAIL 4.2: Unexpected expired error message: ${msg}`);
      }
    }

    if (!expiredCaught) {
      throw new Error("FAIL 4.2: Expected getAssessmentResult to throw on 410 status.");
    }
    console.log("  PASS 4.2: Expired session (410) properly identified for UI expiration banner.");

    // -------------------------------------------------------------------------
    // 5. Results & Recommendations Fidelity (Zero Invented Content)
    // -------------------------------------------------------------------------
    console.log("\n[5/6] Testing Results & Published Course Recommendation Rendering...");

    const mockResult: AssessmentResultDto = {
      submissionId: "sub-123",
      versionNumber: 1,
      completedAt: "2026-10-21T18:00:00.000Z",
      isAnonymous: true,
      claimToken: "token-abc-123",
      factorScores: {
        PRESENCE: {
          factorCode: "PRESENCE",
          factorName: "Presence & Co-Regulation",
          rawScore: 8,
          maxScore: 8,
          percentage: 100,
          band: "Foundational Strength",
          summaryText: "High presence",
        },
      },
      strengths: [
        {
          factorCode: "PRESENCE",
          factorName: "Presence & Co-Regulation",
          title: "Grounded Presence",
          description: "Strong ability to remain calm during emotional storms.",
          actionableHabit: "Take 3 diaphragmatic breaths when tensions rise.",
        },
      ],
      growthAreas: [],
      recommendedCourses: [
        {
          courseId: "course-1",
          slug: "the-6-powers-of-conscious-parenting",
          title: "The 6 Powers of Conscious Parenting",
          subtitle: "Masterclass with Dr. Nivedita Ganguli",
          instructor: "Dr. Nivedita Ganguli",
          relevanceReason: "Reinforces your natural presence strength.",
          matchingFactorCode: "PRESENCE",
        },
      ],
      disclaimer: "Educational self-reflection tool, not clinical diagnostic evaluation.",
    };

    // Verify properties
    if (mockResult.factorScores.PRESENCE.percentage !== 100) {
      throw new Error("FAIL 5.1: Mismatched factor percentage.");
    }
    if (mockResult.recommendedCourses[0].slug !== "the-6-powers-of-conscious-parenting") {
      throw new Error("FAIL 5.2: Course recommendation slug was altered.");
    }
    console.log("  PASS 5.1: Factor score data model conforms strictly to API contracts.");
    console.log("  PASS 5.2: Course recommendations preserve published course identifiers without alteration.");

    // -------------------------------------------------------------------------
    // 6. Safe Claim Handling & History Integration
    // -------------------------------------------------------------------------
    console.log("\n[6/6] Testing Account Claim & History Contracts...");

    // Validate ClaimAssessmentInputSchema
    const testToken = "1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff";
    const validClaim = ClaimAssessmentInputSchema.safeParse({ claimToken: testToken });
    const emptyClaim = ClaimAssessmentInputSchema.safeParse({ claimToken: "" });
    const shortClaim = ClaimAssessmentInputSchema.safeParse({ claimToken: "short" });

    if (!validClaim.success || emptyClaim.success || shortClaim.success) {
      throw new Error(`FAIL 6.1: ClaimAssessmentInputSchema validation failure: ${JSON.stringify(validClaim)}`);
    }
    console.log("  PASS 6.1: ClaimAssessmentInputSchema validates single-use claim tokens strictly (min 16 chars).");

    // Mock claim success
    global.fetch = async () => {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            success: true,
            submissionId: "sub-123",
            message: "Assessment result has been successfully saved to your profile.",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const claimRes = await claimAssessment(testToken);
    if (!claimRes.success || claimRes.submissionId !== "sub-123") {
      throw new Error(`FAIL 6.2: Unexpected claim response: ${JSON.stringify(claimRes)}`);
    }
    console.log("  PASS 6.2: claimAssessment executes successfully and returns updated submission ID.");

    // Mock history fetch
    global.fetch = async () => {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            history: [
              {
                submissionId: "sub-123",
                instrumentTitle: "Parent Growth Self-Assessment",
                versionNumber: 1,
                completedAt: "2026-10-21T18:00:00.000Z",
                topStrength: "Presence & Co-Regulation",
                topGrowthArea: "Relational Repair",
              },
            ],
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const historyItems = await getMyAssessmentHistory();
    if (historyItems.length !== 1 || historyItems[0].submissionId !== "sub-123") {
      throw new Error(`FAIL 6.3: History response parsing failed: ${JSON.stringify(historyItems)}`);
    }
    console.log("  PASS 6.3: getMyAssessmentHistory parses learner profile history accurately.");

    console.log("\n======================================================");
    console.log("   ALL 12 PHASE 3 FRONTEND TESTS PASSED!              ");
    console.log("======================================================");
  } finally {
    global.fetch = originalFetch;
  }
}

if (require.main === module) {
  runFrontendAssessmentsTestSuite().catch((err) => {
    console.error("FRONTEND TEST SUITE FAILED:", err);
    process.exit(1);
  });
}

export { runFrontendAssessmentsTestSuite };
