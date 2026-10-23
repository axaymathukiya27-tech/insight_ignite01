import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { corsOptions } from "./config/cors";
import { requestIdMiddleware } from "./middleware/request-id.middleware";
import { errorMiddleware } from "./middleware/error.middleware";
import apiRouter from "./routes";
import healthRouter from "./routes/health.routes";
import { sendError } from "./utils/response";
import { env } from "./config/env";

export function createApp(): Application {
  const app = express();

  // Do not trust forwarded IP headers by default to prevent rate limit spoofing
  app.set("trust proxy", false);

  app.use(cors(corsOptions));
  app.use(cookieParser(env.sessionSecret));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestIdMiddleware);

  // Mount API router
  app.use("/api", apiRouter);

  // Top-level aliases for root health probes only
  app.use("/", healthRouter);

  // 404 Handler
  app.use((req: Request, res: Response) => {
    const requestId = req.headers["x-request-id"] as string;
    sendError(res, `Route ${req.method} ${req.path} not found`, 404, "NOT_FOUND", requestId);
  });

  // Global Error Handler
  app.use(errorMiddleware);

  return app;
}
