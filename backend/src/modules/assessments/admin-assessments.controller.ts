import { Request, Response, NextFunction } from "express";
import {
  listAdminInstruments,
  createDraftInstrument,
  getInstrumentDetail,
  createDraftVersion,
  getAdminVersionDetail,
  updateDraftVersionMetadata,
  createAssessmentFactor,
  updateAssessmentFactor,
  deleteAssessmentFactor,
  createAssessmentItem,
  updateAssessmentItem,
  deleteAssessmentItem,
  updateVersionScoringConfig,
  createCourseMapping,
  deleteCourseMapping,
  checkActivationReadiness,
  approveDraftVersion,
  activateVersion,
} from "./admin-assessments.service";
import { sendSuccess } from "../../utils/response";

export async function handleApproveVersion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const result = await approveDraftVersion(
      req.params.versionId,
      String(req.body?.approverName ?? ""),
      req.user!
    );
    sendSuccess(res, result, result.message, 200, requestId);
  } catch (error) {
    next(error);
  }
}

export async function handleActivateVersion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const result = await activateVersion(req.params.versionId, req.user!);
    sendSuccess(res, result, result.message, 200, requestId);
  } catch (error) {
    next(error);
  }
}

export async function handleListInstruments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const instruments = await listAdminInstruments();
    sendSuccess(res, { instruments }, undefined, 200, requestId);
  } catch (error) {
    next(error);
  }
}

export async function handleCreateInstrument(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const instrument = await createDraftInstrument(req.body, req.user!);
    sendSuccess(
      res,
      { instrument },
      "Draft assessment instrument and initial Version 1 created successfully.",
      201,
      requestId
    );
  } catch (error) {
    next(error);
  }
}

export async function handleGetInstrumentDetail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const { id } = req.params;
    const instrument = await getInstrumentDetail(id);
    sendSuccess(res, { instrument }, undefined, 200, requestId);
  } catch (error) {
    next(error);
  }
}

export async function handleCreateDraftVersion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const { id } = req.params;
    const version = await createDraftVersion(id, req.body, req.user!);
    sendSuccess(
      res,
      { version },
      `Draft Version ${version.versionNumber} created successfully.`,
      201,
      requestId
    );
  } catch (error) {
    next(error);
  }
}

export async function handleGetVersionDetail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const { versionId } = req.params;
    const version = await getAdminVersionDetail(versionId);
    sendSuccess(res, { version }, undefined, 200, requestId);
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateDraftVersionMetadata(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const { versionId } = req.params;
    const version = await updateDraftVersionMetadata(
      versionId,
      req.body,
      req.user!
    );
    sendSuccess(
      res,
      { version },
      "Draft version metadata updated successfully.",
      200,
      requestId
    );
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// Phase 4B: Factors
// ---------------------------------------------------------------------------

export async function handleCreateFactor(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const { versionId } = req.params;
    const factor = await createAssessmentFactor(versionId, req.body, req.user!);
    sendSuccess(
      res,
      { factor },
      "Factor definition created successfully.",
      201,
      requestId
    );
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateFactor(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const { factorId } = req.params;
    const factor = await updateAssessmentFactor(factorId, req.body, req.user!);
    sendSuccess(
      res,
      { factor },
      "Factor definition updated successfully.",
      200,
      requestId
    );
  } catch (error) {
    next(error);
  }
}

export async function handleDeleteFactor(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const { factorId } = req.params;
    const result = await deleteAssessmentFactor(factorId, req.user!);
    sendSuccess(res, result, result.message, 200, requestId);
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// Phase 4B: Questions & Options
// ---------------------------------------------------------------------------

export async function handleCreateItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const { versionId } = req.params;
    const item = await createAssessmentItem(versionId, req.body, req.user!);
    sendSuccess(
      res,
      { item },
      "Question item created successfully.",
      201,
      requestId
    );
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const { itemId } = req.params;
    const item = await updateAssessmentItem(itemId, req.body, req.user!);
    sendSuccess(
      res,
      { item },
      "Question item updated successfully.",
      200,
      requestId
    );
  } catch (error) {
    next(error);
  }
}

export async function handleDeleteItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const { itemId } = req.params;
    const result = await deleteAssessmentItem(itemId, req.user!);
    sendSuccess(res, result, result.message, 200, requestId);
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// Phase 4B: Scoring Configuration
// ---------------------------------------------------------------------------

export async function handleUpdateScoringConfig(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const { versionId } = req.params;
    const result = await updateVersionScoringConfig(
      versionId,
      req.body,
      req.user!
    );
    sendSuccess(res, result, result.message, 200, requestId);
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// Phase 4B: Course Recommendation Mappings
// ---------------------------------------------------------------------------

export async function handleCreateCourseMapping(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const { versionId } = req.params;
    const courseMapping = await createCourseMapping(
      versionId,
      req.body,
      req.user!
    );
    sendSuccess(
      res,
      { courseMapping },
      "Course recommendation mapping created successfully.",
      201,
      requestId
    );
  } catch (error) {
    next(error);
  }
}

export async function handleDeleteCourseMapping(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const { mappingId } = req.params;
    const result = await deleteCourseMapping(mappingId, req.user!);
    sendSuccess(res, result, result.message, 200, requestId);
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// Phase 4B: Pre-Activation Readiness Check (Read-Only)
// ---------------------------------------------------------------------------

export async function handleCheckActivationReadiness(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const { versionId } = req.params;
    const report = await checkActivationReadiness(versionId);
    sendSuccess(
      res,
      { report },
      report.isReadyForActivation
        ? "Assessment version meets all technical and governance prerequisites."
        : "Assessment version is not ready for activation.",
      200,
      requestId
    );
  } catch (error) {
    next(error);
  }
}

