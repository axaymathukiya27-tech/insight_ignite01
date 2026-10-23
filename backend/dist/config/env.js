"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
exports.maskConnectionString = maskConnectionString;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const EnvSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().default(5000),
    NODE_ENV: zod_1.z.enum(["development", "test", "production"]).default("development"),
    CORS_ORIGIN: zod_1.z.string().default("http://localhost:3000"),
    FRONTEND_URL: zod_1.z.string().default("http://localhost:3000"),
    DATABASE_URL: zod_1.z.string().default(""),
    SESSION_COOKIE_NAME: zod_1.z.string().default("insight_session"),
    SESSION_SECRET: zod_1.z.string().default("dev-session-secret-insight-ignite-change-in-prod"),
    SESSION_MAX_AGE_DAYS: zod_1.z.coerce.number().default(7),
    // SMTP Configuration
    SMTP_HOST: zod_1.z.string().optional(),
    SMTP_PORT: zod_1.z.coerce.number().default(587),
    SMTP_SECURE: zod_1.z.coerce.boolean().default(false),
    SMTP_USER: zod_1.z.string().optional(),
    SMTP_PASS: zod_1.z.string().optional(),
    SMTP_FROM: zod_1.z.string().default("Insight Ignite <support@insightignite.org>"),
});
const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
    console.error("❌ Invalid environment configuration:", parsed.error.format());
}
const safeData = parsed.success
    ? parsed.data
    : {
        PORT: parseInt(process.env.PORT || "5000", 10),
        NODE_ENV: process.env.NODE_ENV || "development",
        CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
        FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
        DATABASE_URL: process.env.DATABASE_URL || "",
        SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME || "insight_session",
        SESSION_SECRET: process.env.SESSION_SECRET || "dev-session-secret-insight-ignite-change-in-prod",
        SESSION_MAX_AGE_DAYS: parseInt(process.env.SESSION_MAX_AGE_DAYS || "7", 10),
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: parseInt(process.env.SMTP_PORT || "587", 10),
        SMTP_SECURE: process.env.SMTP_SECURE === "true",
        SMTP_USER: process.env.SMTP_USER,
        SMTP_PASS: process.env.SMTP_PASS,
        SMTP_FROM: process.env.SMTP_FROM || "Insight Ignite <support@insightignite.org>",
    };
/**
 * Redacts database credentials from connection strings for safe logging.
 */
function maskConnectionString(rawUrl) {
    if (!rawUrl)
        return "[NOT CONFIGURED]";
    try {
        const url = new URL(rawUrl);
        if (url.password) {
            url.password = "******";
        }
        return url.toString();
    }
    catch {
        return "[MASKED DATABASE URI]";
    }
}
exports.env = {
    port: safeData.PORT,
    nodeEnv: safeData.NODE_ENV,
    corsOrigin: safeData.CORS_ORIGIN,
    frontendUrl: safeData.FRONTEND_URL,
    databaseUrl: safeData.DATABASE_URL,
    isDatabaseConfigured: Boolean(safeData.DATABASE_URL && safeData.DATABASE_URL.trim() !== ""),
    sessionCookieName: safeData.SESSION_COOKIE_NAME,
    sessionSecret: safeData.SESSION_SECRET,
    sessionMaxAgeDays: safeData.SESSION_MAX_AGE_DAYS,
    smtp: {
        host: safeData.SMTP_HOST,
        port: safeData.SMTP_PORT,
        secure: safeData.SMTP_SECURE,
        user: safeData.SMTP_USER,
        pass: safeData.SMTP_PASS,
        from: safeData.SMTP_FROM,
        isConfigured: Boolean(safeData.SMTP_HOST && safeData.SMTP_USER && safeData.SMTP_PASS),
    },
};
