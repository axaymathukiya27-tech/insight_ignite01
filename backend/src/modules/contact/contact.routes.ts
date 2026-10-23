import { Router, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { UserRole } from "@insight-ignite/database";
import { ContactInquirySchema } from "@insight-ignite/shared";
import { createContactInquiry, listContactInquiries } from "./contact.service";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validate.middleware";
import { sendSuccess, sendError } from "../../utils/response";

const router = Router();

const contactRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 inquiries per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const requestId = req.headers["x-request-id"] as string;
    sendError(res, "Too many messages sent. Please try again later.", 429, "RATE_LIMIT_EXCEEDED", requestId);
  },
});

// Public: submit an inquiry from the contact page
router.post(
  "/",
  contactRateLimiter,
  validateRequest({ body: ContactInquirySchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requestId = req.headers["x-request-id"] as string;
      const inquiry = await createContactInquiry(req.body);
      sendSuccess(res, { inquiry }, "Thank you. Your message has been received.", 201, requestId);
    } catch (error) {
      next(error);
    }
  }
);

// Admin: list submitted inquiries
router.get(
  "/admin",
  requireAuth,
  requireRole(UserRole.PLATFORM_ADMIN),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const requestId = req.headers["x-request-id"] as string;
      const inquiries = await listContactInquiries();
      sendSuccess(res, { inquiries }, undefined, 200, requestId);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
