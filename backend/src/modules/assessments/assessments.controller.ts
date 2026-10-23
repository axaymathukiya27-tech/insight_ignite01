import { Request, Response, NextFunction } from "express";
import {
  getActiveAssessment,
  listActiveAssessments,
  submitAssessment,
  getAssessmentResult,
  claimAssessment,
  getUserAssessmentHistory,
  getAssessmentProgress,
} from "./assessments.service";
import { getPracticePlan, startPracticePlan, updatePracticeDay } from "./practice-plan.service";
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

export async function handleGetAssessmentProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const progress = await getAssessmentProgress(String(req.params.slug), req.user!);
    sendSuccess(res, { progress }, undefined, 200, requestId);
  } catch (error) {
    next(error);
  }
}

export async function handleGetPracticePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const plan = await getPracticePlan(String(req.params.id), req.user!);
    sendSuccess(res, { plan }, undefined, 200, requestId);
  } catch (error) {
    next(error);
  }
}

export async function handleStartPracticePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const plan = await startPracticePlan(String(req.params.id), req.user!);
    sendSuccess(res, { plan }, "Your seven-day practice plan has started.", 200, requestId);
  } catch (error) {
    next(error);
  }
}

export async function handleUpdatePracticeDay(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const plan = await updatePracticeDay(String(req.params.id), Number(req.params.day), req.body, req.user!);
    sendSuccess(res, { plan }, undefined, 200, requestId);
  } catch (error) {
    next(error);
  }
}
