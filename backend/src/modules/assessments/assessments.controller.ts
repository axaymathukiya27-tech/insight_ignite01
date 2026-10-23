import { Request, Response, NextFunction } from "express";
import {
  getActiveAssessment,
  listActiveAssessments,
  submitAssessment,
  getAssessmentResult,
  claimAssessment,
  getUserAssessmentHistory,
} from "./assessments.service";
import {
  ASSESSMENT_COOKIE_NAME,
  getAssessmentCookieOptions,
  getClearAssessmentCookieOptions,
} from "./token.util";
import { sendSuccess } from "../../utils/response";

export async function handleGetActiveAssessment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const slug = (req.query.slug as string) || undefined;
    const instrument = await getActiveAssessment(slug);
    sendSuccess(res, { instrument }, undefined, 200, requestId);
  } catch (error) {
    next(error);
  }
}

export async function handleListActiveAssessments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const assessments = await listActiveAssessments();
    sendSuccess(res, { assessments }, undefined, 200, requestId);
  } catch (error) {
    next(error);
  }
}

export async function handleSubmitAssessment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const { result, accessKey, claimToken, expiresAt } = await submitAssessment(
      req.body,
      req.user
    );

    // If anonymous, set the secure HTTP-only access cookie
    if (accessKey) {
      res.cookie(
        ASSESSMENT_COOKIE_NAME,
        accessKey,
        getAssessmentCookieOptions(expiresAt)
      );
    }

    sendSuccess(
      res,
      {
        result,
        ...(claimToken ? { claimToken } : {}),
      },
      "Assessment responses submitted and calculated successfully.",
      201,
      requestId
    );
  } catch (error) {
    next(error);
  }
}

export async function handleGetResult(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const { id } = req.params;

    // Retrieve credential from HTTP-only cookie or custom authorization header
    const accessKey =
      (req.cookies?.[ASSESSMENT_COOKIE_NAME] as string | undefined) ||
      (req.headers["x-assessment-access-key"] as string | undefined);

    const result = await getAssessmentResult(id, req.user, accessKey);
    sendSuccess(res, { result }, undefined, 200, requestId);
  } catch (error) {
    next(error);
  }
}

export async function handleClaimAssessment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const { claimToken } = req.body;

    const claimResponse = await claimAssessment(claimToken, req.user!);

    // Clear guest cookie now that the assessment is linked to user's profile
    res.clearCookie(ASSESSMENT_COOKIE_NAME, getClearAssessmentCookieOptions());

    sendSuccess(res, claimResponse, claimResponse.message, 200, requestId);
  } catch (error) {
    next(error);
  }
}

export async function handleGetMyAssessmentHistory(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const history = await getUserAssessmentHistory(req.user!.id);
    sendSuccess(res, { history }, undefined, 200, requestId);
  } catch (error) {
    next(error);
  }
}
