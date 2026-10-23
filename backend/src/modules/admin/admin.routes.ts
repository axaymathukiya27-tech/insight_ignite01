import { Router, Request, Response, NextFunction } from "express";
import { UserRole } from "@insight-ignite/database";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { sendSuccess } from "../../utils/response";
import { getAdminOverview, listAdminEnrollments, listAdminLessons, listAdminUsers } from "./admin.service";

const router = Router();

// Platform administrators only: these views contain other people's account details
router.use(requireAuth, requireRole(UserRole.PLATFORM_ADMIN));

const handle =
  <T>(key: string, fn: () => Promise<T>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      sendSuccess(res, { [key]: await fn() }, undefined, 200, req.headers["x-request-id"] as string);
    } catch (error) {
      next(error);
    }
  };

router.get("/overview", handle("overview", getAdminOverview));
router.get("/users", handle("users", listAdminUsers));
router.get("/enrollments", handle("enrollments", listAdminEnrollments));
router.get("/lessons", handle("lessons", listAdminLessons));

export default router;
