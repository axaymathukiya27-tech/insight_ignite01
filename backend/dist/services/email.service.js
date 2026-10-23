"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationEmail = sendVerificationEmail;
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
const logger_1 = require("../config/logger");
let transporter = null;
function getTransporter() {
    if (!env_1.env.smtp.isConfigured) {
        return null;
    }
    if (!transporter) {
        transporter = nodemailer_1.default.createTransport({
            host: env_1.env.smtp.host,
            port: env_1.env.smtp.port,
            secure: env_1.env.smtp.secure,
            auth: {
                user: env_1.env.smtp.user,
                pass: env_1.env.smtp.pass,
            },
        });
    }
    return transporter;
}
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
async function sendVerificationEmail(to, name, rawToken) {
    const verifyUrl = `${env_1.env.frontendUrl}/verify-email?token=${encodeURIComponent(rawToken)}`;
    const safeName = escapeHtml(name);
    const subject = "Verify your email address — Insight Ignite";
    const textContent = `Hello ${name},\n\nThank you for joining Insight Ignite. Please verify your email address by visiting the following link:\n\n${verifyUrl}\n\nThis verification link expires in 24 hours.\n\nWarm regards,\nDr. Nivedita Ganguli & The Insight Ignite Team`;
    const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #2D241E; background-color: #FAF8F5; border-radius: 16px; border: 1px solid #E4D8CC;">
      <h2 style="color: #8C5E42; font-family: Georgia, serif; margin-bottom: 16px;">Welcome to Insight Ignite</h2>
      <p style="font-size: 15px; line-height: 1.6;">Hello <strong>${safeName}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #5C4D42;">
        Thank you for creating an account with Insight Ignite. Please click the button below to verify your email address and activate your learner access.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${verifyUrl}" style="background-color: #8C5E42; color: #FAF8F5; padding: 12px 28px; text-decoration: none; border-radius: 9999px; font-weight: bold; font-size: 14px; display: inline-block;">Verify Email Address</a>
      </div>
      <p style="font-size: 12px; color: #8A796E; line-height: 1.5;">
        Or paste this link into your browser:<br/>
        <a href="${verifyUrl}" style="color: #8C5E42;">${verifyUrl}</a>
      </p>
      <p style="font-size: 12px; color: #8A796E; margin-top: 24px; border-top: 1px solid #E4D8CC; padding-top: 16px;">
        This single-use link expires in 24 hours. If you did not create an account, please disregard this email.
      </p>
    </div>
  `;
    return sendMailInternal(to, subject, textContent, htmlContent);
}
async function sendPasswordResetEmail(to, name, rawToken) {
    const resetUrl = `${env_1.env.frontendUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
    const safeName = escapeHtml(name);
    const subject = "Reset your password — Insight Ignite";
    const textContent = `Hello ${name},\n\nWe received a request to reset your Insight Ignite account password. Please visit the following link to set a new password:\n\n${resetUrl}\n\nThis single-use link expires in 1 hour.\n\nIf you did not request this, you can safely ignore this message.\n\nWarm regards,\nInsight Ignite Team`;
    const htmlContent = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #2D241E; background-color: #FAF8F5; border-radius: 16px; border: 1px solid #E4D8CC;">
      <h2 style="color: #8C5E42; font-family: Georgia, serif; margin-bottom: 16px;">Reset Your Password</h2>
      <p style="font-size: 15px; line-height: 1.6;">Hello <strong>${safeName}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.6; color: #5C4D42;">
        We received a request to reset the password for your Insight Ignite account. Click the button below to choose a new password.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${resetUrl}" style="background-color: #8C5E42; color: #FAF8F5; padding: 12px 28px; text-decoration: none; border-radius: 9999px; font-weight: bold; font-size: 14px; display: inline-block;">Reset Password</a>
      </div>
      <p style="font-size: 12px; color: #8A796E; line-height: 1.5;">
        Or paste this link into your browser:<br/>
        <a href="${resetUrl}" style="color: #8C5E42;">${resetUrl}</a>
      </p>
      <p style="font-size: 12px; color: #8A796E; margin-top: 24px; border-top: 1px solid #E4D8CC; padding-top: 16px;">
        This single-use link expires in 1 hour. If you did not initiate this request, your account remains secure and no action is required.
      </p>
    </div>
  `;
    return sendMailInternal(to, subject, textContent, htmlContent);
}
async function sendMailInternal(to, subject, text, html) {
    const client = getTransporter();
    if (!client) {
        logger_1.logger.warn(`[EmailService] SMTP credentials not configured. In development, simulating email to ${to} (Subject: ${subject})`);
        logger_1.logger.info(`\n[EmailService DEV] ========== SIMULATED EMAIL ==========`);
        logger_1.logger.info(`To: ${to}`);
        logger_1.logger.info(`Subject: ${subject}`);
        logger_1.logger.info(`Body:\n${text}`);
        logger_1.logger.info(`[EmailService DEV] =======================================\n`);
        return {
            delivered: false,
            simulated: true,
            reason: "SMTP not configured (development simulation mode)",
        };
    }
    try {
        const info = await client.sendMail({
            from: env_1.env.smtp.from,
            to,
            subject,
            text,
            html,
        });
        logger_1.logger.info(`[EmailService] Successfully sent email to ${to} (Message ID: ${info.messageId})`);
        return {
            delivered: true,
            messageId: info.messageId,
        };
    }
    catch (error) {
        logger_1.logger.error(`[EmailService] SMTP delivery failed to ${to}:`, error);
        return {
            delivered: false,
            reason: error instanceof Error ? error.message : "SMTP transport failure",
        };
    }
}
