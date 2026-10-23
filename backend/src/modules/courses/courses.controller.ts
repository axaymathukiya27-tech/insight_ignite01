import { Request, Response, NextFunction } from "express";
import {
  getPublishedCourses,
  getPublishedCourseBySlug,
  getAdminCourses,
  getAdminCourseById,
  createCourse,
  updateCourse,
  setCourseStatus,
} from "./courses.service";
import { sendSuccess, sendError } from "../../utils/response";
import { CourseStatus } from "@insight-ignite/database";

export async function handleGetPublicCourses(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const courses = await getPublishedCourses();
    sendSuccess(res, { courses }, undefined, 200, requestId);
  } catch (error) {
    next(error);
  }
}

export async function handleGetPublicCourseBySlug(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const { slug } = req.params;
    const course = await getPublishedCourseBySlug(slug);

    if (!course) {
      sendError(res, `Course '${slug}' not found or not published`, 404, "NOT_FOUND", requestId);
      return;
    }

    sendSuccess(res, { course }, undefined, 200, requestId);
  } catch (error) {
    next(error);
  }
}

export async function handleGetAdminCourses(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const courses = await getAdminCourses();
    sendSuccess(res, { courses }, undefined, 200, requestId);
  } catch (error) {
    next(error);
  }
}

export async function handleGetAdminCourseById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const { id } = req.params;
    const course = await getAdminCourseById(id);

    if (!course) {
      sendError(res, "Course not found", 404, "NOT_FOUND", requestId);
      return;
    }

    sendSuccess(res, { course }, undefined, 200, requestId);
  } catch (error) {
    next(error);
  }
}

export async function handleCreateCourse(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const course = await createCourse(req.body);
    sendSuccess(res, { course }, "Course created successfully.", 201, requestId);
  } catch (error) {
    next(error);
  }
}

export async function handleUpdateCourse(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const { id } = req.params;
    const course = await updateCourse(id, req.body);
    sendSuccess(res, { course }, "Course updated successfully.", 200, requestId);
  } catch (error) {
    next(error);
  }
}

export async function handlePublishCourse(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const { id } = req.params;
    const course = await setCourseStatus(id, CourseStatus.PUBLISHED);
    sendSuccess(res, { course }, "Course published successfully.", 200, requestId);
  } catch (error) {
    next(error);
  }
}

export async function handleUnpublishCourse(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requestId = req.headers["x-request-id"] as string;
    const { id } = req.params;
    const course = await setCourseStatus(id, CourseStatus.DRAFT);
    sendSuccess(res, { course }, "Course unpublished (set to draft).", 200, requestId);
  } catch (error) {
    next(error);
  }
}
