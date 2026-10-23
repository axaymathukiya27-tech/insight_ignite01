import { Router } from "express";
import healthRouter from "./health.routes";
import authRouter from "../modules/auth/auth.routes";
import coursesRouter from "../modules/courses/courses.routes";
import assessmentsRouter from "../modules/assessments/assessments.routes";
import adminAssessmentsRouter from "../modules/assessments/admin-assessments.routes";
import contactRouter from "../modules/contact/contact.routes";
import adminRouter from "../modules/admin/admin.routes";
import { requireAuth, requireRole, requireVerifiedEmail } from "../middleware/auth.middleware";
import { UserRole } from "@insight-ignite/database";
import { sendSuccess } from "../utils/response";
import { toSafeUser } from "../modules/auth/auth.service";

const apiRouter = Router();

apiRouter.use("/", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/courses", coursesRouter);
apiRouter.use("/assessments", assessmentsRouter);
apiRouter.use("/admin/assessments", adminAssessmentsRouter);
apiRouter.use("/contact", contactRouter);
apiRouter.use("/admin/platform", adminRouter);

// Protected learner route (requires authenticated session AND verified email)
apiRouter.get("/learner/profile", requireAuth, requireVerifiedEmail, (req, res) => {
  const requestId = req.headers["x-request-id"] as string;
  sendSuccess(res, { user: toSafeUser(req.user!) }, undefined, 200, requestId);
});

// Protected administrative route
apiRouter.get(
  "/admin/stats",
  requireAuth,
  requireRole(UserRole.PLATFORM_ADMIN, UserRole.SCHOOL_ADMIN),
  (req, res) => {
    const requestId = req.headers["x-request-id"] as string;
    sendSuccess(
      res,
      {
        adminAccessGranted: true,
        userRole: req.user!.role,
        timestamp: new Date().toISOString(),
      },
      "Admin authorization verified.",
      200,
      requestId
    );
  }
);

export default apiRouter;
