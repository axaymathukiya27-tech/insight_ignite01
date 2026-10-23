import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import {
  handleGetActiveAssessment,
  handleListActiveAssessments,
  handleSubmitAssessment,
  handleGetResult,
  handleClaimAssessment,
  handleGetMyAssessmentHistory,
  handleGetAssessmentProgress,
  handleGetPracticePlan,
  handleStartPracticePlan,
  handleUpdatePracticeDay,
} from "./assessments.controller";
import { authenticate, requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validate.middleware";
import {
  SubmitAssessmentInputSchema,
  ClaimAssessmentInputSchema,
  UpdatePracticeDayInputSchema,
} from "@insight-ignite/shared";
import { sendError } from "../../utils/response";

const router = Router();

// Rate limiter for assessment submissions: 20 per hour per IP
export const assessmentSubmitRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const requestId = req.headers["x-request-id"] as string;
    sendError(
      res,
      "Too many assessment submissions from this network. Please wait before retrying.",
      429,
      "RATE_LIMIT_EXCEEDED",
      requestId
    );
  },
});

// Rate limiter for claiming: 15 per 15 minutes per IP
export const assessmentClaimRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const requestId = req.headers["x-request-id"] as string;
    sendError(
      res,
      "Too many account claim attempts. Please wait a few minutes before trying again.",
      429,
      "RATE_LIMIT_EXCEEDED",
      requestId
    );
  },
});

/**
 * Public endpoint to retrieve active, published assessment instrument and questions.
 * Strips internal point weights and scoring configs.
 */
router.get("/active", handleGetActiveAssessment);

/**
 * Public list of all published assessments (summary only, no questions or scoring).
 */
router.get("/catalog", handleListActiveAssessments);

/**
 * Submit assessment answers.
 * Supports anonymous guests or authenticated learners.
 * Calculates scores server-side.
 */
router.post(
  "/submit",
  authenticate,
  assessmentSubmitRateLimiter,
  validateRequest({ body: SubmitAssessmentInputSchema }),
  handleSubmitAssessment
);

/**
 * Retrieve assessment result by ID.
 * Protected: Requires either active user session matching submission owner
 * or HTTP-only anonymous access credential cookie.
 */
router.get("/results/:id", authenticate, handleGetResult);

/**
 * Link an anonymous assessment submission to an authenticated user profile.
 * Protected: Requires authentication and single-use claim token.
 */
router.post(
  "/claim",
  requireAuth,
  assessmentClaimRateLimiter,
  validateRequest({ body: ClaimAssessmentInputSchema }),
  handleClaimAssessment
);

/**
 * Retrieve assessment submission history for the authenticated user.
 * Protected: Requires authentication. Restricted strictly to caller's records.
 */
router.get("/my-history", requireAuth, handleGetMyAssessmentHistory);

/**
 * All completed attempts of one assessment for the signed-in parent, with a comparison of
 * directly comparable attempts. Restricted to the caller's own records.
 */
router.get("/my-progress/:slug", requireAuth, handleGetAssessmentProgress);

/**
 * Seven-day practice plan for one completed attempt. Owner only (checked server-side).
 */
router.get("/results/:id/practice-plan", requireAuth, handleGetPracticePlan);
router.post("/results/:id/practice-plan/start", requireAuth, handleStartPracticePlan);
router.put(
  "/results/:id/practice-plan/days/:day",
  requireAuth,
  validateRequest({ body: UpdatePracticeDayInputSchema }),
  handleUpdatePracticeDay
);

export default router;
