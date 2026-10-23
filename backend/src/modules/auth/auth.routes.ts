import { Router } from "express";
import {
  handleRegister,
  handleVerifyEmail,
  handleResendVerification,
  handleLogin,
  handleGetMe,
  handleLogout,
  handleForgotPassword,
  handleResetPassword,
} from "./auth.controller";
import { validateRequest } from "../../middleware/validate.middleware";
import { requireAuth } from "../../middleware/auth.middleware";
import {
  loginRateLimiter,
  registerRateLimiter,
  forgotPasswordRateLimiter,
} from "../../middleware/rate-limit.middleware";
import {
  RegisterUserInputSchema,
  LoginUserInputSchema,
  VerifyEmailInputSchema,
  ResendVerificationInputSchema,
  ForgotPasswordInputSchema,
  ResetPasswordInputSchema,
} from "@insight-ignite/shared";

const router = Router();

router.post("/register", registerRateLimiter, validateRequest({ body: RegisterUserInputSchema }), handleRegister);
router.post("/verify-email", validateRequest({ body: VerifyEmailInputSchema }), handleVerifyEmail);
router.post("/resend-verification", validateRequest({ body: ResendVerificationInputSchema }), handleResendVerification);
router.post("/login", loginRateLimiter, validateRequest({ body: LoginUserInputSchema }), handleLogin);
router.get("/me", requireAuth, handleGetMe);
router.post("/logout", handleLogout);
router.post("/forgot-password", forgotPasswordRateLimiter, validateRequest({ body: ForgotPasswordInputSchema }), handleForgotPassword);
router.post("/reset-password", validateRequest({ body: ResetPasswordInputSchema }), handleResetPassword);

export default router;
