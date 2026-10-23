import { createApp } from "./app";
import { env, maskConnectionString } from "./config/env";
import { logger } from "./config/logger";
import { prisma } from "@insight-ignite/database";

const app = createApp();

const server = app.listen(env.port, () => {
  logger.info(`Insight Ignite API server running on port ${env.port} [${env.nodeEnv}]`);
  logger.info(`Database target: ${maskConnectionString(env.databaseUrl)}`);
});

// Graceful shutdown handling
async function shutdown(signal: string) {
  logger.info(`${signal} signal received: closing HTTP server and database pool`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      logger.info("Database connection pool disconnected");
    } catch (err) {
      logger.error("Error disconnecting database pool", err);
    }
    logger.info("HTTP server closed");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
