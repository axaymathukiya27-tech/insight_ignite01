"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("@insight-ignite/database");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const response_1 = require("../../utils/response");
const admin_service_1 = require("./admin.service");
const router = (0, express_1.Router)();
// Platform administrators only: these views contain other people's account details
router.use(auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(database_1.UserRole.PLATFORM_ADMIN));
const handle = (key, fn) => async (req, res, next) => {
    try {
        (0, response_1.sendSuccess)(res, { [key]: await fn() }, undefined, 200, req.headers["x-request-id"]);
    }
    catch (error) {
        next(error);
    }
};
router.get("/overview", handle("overview", admin_service_1.getAdminOverview));
router.get("/users", handle("users", admin_service_1.listAdminUsers));
router.get("/enrollments", handle("enrollments", admin_service_1.listAdminEnrollments));
router.get("/lessons", handle("lessons", admin_service_1.listAdminLessons));
exports.default = router;
