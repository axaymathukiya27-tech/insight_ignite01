"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_2 = require("./config/cors");
const request_id_middleware_1 = require("./middleware/request-id.middleware");
const error_middleware_1 = require("./middleware/error.middleware");
const routes_1 = __importDefault(require("./routes"));
const health_routes_1 = __importDefault(require("./routes/health.routes"));
const response_1 = require("./utils/response");
const env_1 = require("./config/env");
function createApp() {
    const app = (0, express_1.default)();
    // Do not trust forwarded IP headers by default to prevent rate limit spoofing
    app.set("trust proxy", false);
    app.use((0, cors_1.default)(cors_2.corsOptions));
    app.use((0, cookie_parser_1.default)(env_1.env.sessionSecret));
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use(request_id_middleware_1.requestIdMiddleware);
    // Mount API router
    app.use("/api", routes_1.default);
    // Top-level aliases for root health probes only
    app.use("/", health_routes_1.default);
    // 404 Handler
    app.use((req, res) => {
        const requestId = req.headers["x-request-id"];
        (0, response_1.sendError)(res, `Route ${req.method} ${req.path} not found`, 404, "NOT_FOUND", requestId);
    });
    // Global Error Handler
    app.use(error_middleware_1.errorMiddleware);
    return app;
}
