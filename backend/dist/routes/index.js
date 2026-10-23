"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const health_routes_1 = __importDefault(require("./health.routes"));
const auth_routes_1 = __importDefault(require("../modules/auth/auth.routes"));
const courses_routes_1 = __importDefault(require("../modules/courses/courses.routes"));
const assessments_routes_1 = __importDefault(require("../modules/assessments/assessments.routes"));
const admin_assessments_routes_1 = __importDefault(require("../modules/assessments/admin-assessments.routes"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const database_1 = require("@insight-ignite/database");
const response_1 = require("../utils/response");
const auth_service_1 = require("../modules/auth/auth.service");
const apiRouter = (0, express_1.Router)();
apiRouter.use("/", health_routes_1.default);
apiRouter.use("/auth", auth_routes_1.default);
apiRouter.use("/courses", courses_routes_1.default);
apiRouter.use("/assessments", assessments_routes_1.default);
apiRouter.use("/admin/assessments", admin_assessments_routes_1.default);
// Protected learner route (requires authenticated session AND verified email)
apiRouter.get("/learner/profile", auth_middleware_1.requireAuth, auth_middleware_1.requireVerifiedEmail, (req, res) => {
    const requestId = req.headers["x-request-id"];
    (0, response_1.sendSuccess)(res, { user: (0, auth_service_1.toSafeUser)(req.user) }, undefined, 200, requestId);
});
// Protected administrative route
apiRouter.get("/admin/stats", auth_middleware_1.requireAuth, (0, auth_middleware_1.requireRole)(database_1.UserRole.PLATFORM_ADMIN, database_1.UserRole.SCHOOL_ADMIN), (req, res) => {
    const requestId = req.headers["x-request-id"];
    (0, response_1.sendSuccess)(res, {
        adminAccessGranted: true,
        userRole: req.user.role,
        timestamp: new Date().toISOString(),
    }, "Admin authorization verified.", 200, requestId);
});
exports.default = apiRouter;
