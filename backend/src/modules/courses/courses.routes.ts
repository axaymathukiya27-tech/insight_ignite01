import { Router } from "express";
import {
  handleGetPublicCourses,
  handleGetPublicCourseBySlug,
  handleGetAdminCourses,
  handleGetAdminCourseById,
  handleCreateCourse,
  handleUpdateCourse,
  handlePublishCourse,
  handleUnpublishCourse,
} from "./courses.controller";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validate.middleware";
import { UserRole } from "@insight-ignite/database";
import {
  CreateCourseInputSchema,
  UpdateCourseInputSchema,
} from "@insight-ignite/shared";

const router = Router();

// =============================================================================
// Public Catalog Routes (No Authentication Required)
// Only returns courses where status = PUBLISHED
// =============================================================================
router.get("/", handleGetPublicCourses);
router.get("/:slug", handleGetPublicCourseBySlug);

// =============================================================================
// Protected Admin Course Management Routes
// Strict server-side role check: PLATFORM_ADMIN or SCHOOL_ADMIN
// =============================================================================
router.get(
  "/admin/all",
  requireAuth,
  requireRole(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN),
  handleGetAdminCourses
);

router.get(
  "/admin/:id",
  requireAuth,
  requireRole(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN),
  handleGetAdminCourseById
);

router.post(
  "/admin",
  requireAuth,
  requireRole(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN),
  validateRequest({ body: CreateCourseInputSchema }),
  handleCreateCourse
);

router.patch(
  "/admin/:id",
  requireAuth,
  requireRole(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN),
  validateRequest({ body: UpdateCourseInputSchema }),
  handleUpdateCourse
);

router.patch(
  "/admin/:id/publish",
  requireAuth,
  requireRole(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN),
  handlePublishCourse
);

router.patch(
  "/admin/:id/unpublish",
  requireAuth,
  requireRole(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN),
  handleUnpublishCourse
);

export default router;
