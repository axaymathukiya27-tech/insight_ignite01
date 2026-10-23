"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const courses_controller_1 = require("./courses.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validate_middleware_1 = require("../../middleware/validate.middleware");
const database_1 = require("@insight-ignite/database");
const shared_1 = require("@insight-ignite/shared");
const router = (0, express_1.Router)();
// =============================================================================
// Public Catalog Routes (No Authentication Required)
// Only returns courses where status = PUBLISHED
// =============================================================================
router.get("/", courses_controller_1.handleGetPublicCourses);
router.get("/:slug", courses_controller_1.handleGetPublicCourseBySlug);
// =============================================================================
// Protected Admin Course Management Routes
// Strict server-side role check: PLATFORM_ADMIN or SCHOOL_ADMIN
// =============================================================================
router.get("/admin/all", auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(database_1.UserRole.PLATFORM_ADMIN, database_1.UserRole.SCHOOL_ADMIN), courses_controller_1.handleGetAdminCourses);
router.get("/admin/:id", auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(database_1.UserRole.PLATFORM_ADMIN, database_1.UserRole.SCHOOL_ADMIN), courses_controller_1.handleGetAdminCourseById);
router.post("/admin", auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(database_1.UserRole.PLATFORM_ADMIN, database_1.UserRole.SCHOOL_ADMIN), (0, validate_middleware_1.validateRequest)({ body: shared_1.CreateCourseInputSchema }), courses_controller_1.handleCreateCourse);
router.patch("/admin/:id", auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(database_1.UserRole.PLATFORM_ADMIN, database_1.UserRole.SCHOOL_ADMIN), (0, validate_middleware_1.validateRequest)({ body: shared_1.UpdateCourseInputSchema }), courses_controller_1.handleUpdateCourse);
router.patch("/admin/:id/publish", auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(database_1.UserRole.PLATFORM_ADMIN, database_1.UserRole.SCHOOL_ADMIN), courses_controller_1.handlePublishCourse);
router.patch("/admin/:id/unpublish", auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(database_1.UserRole.PLATFORM_ADMIN, database_1.UserRole.SCHOOL_ADMIN), courses_controller_1.handleUnpublishCourse);
exports.default = router;
