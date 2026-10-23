"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const logger_1 = require("./config/logger");
const database_1 = require("@insight-ignite/database");
const app = (0, app_1.createApp)();
const server = app.listen(env_1.env.port, () => {
    logger_1.logger.info(`Insight Ignite API server running on port ${env_1.env.port} [${env_1.env.nodeEnv}]`);
    logger_1.logger.info(`Database target: ${(0, env_1.maskConnectionString)(env_1.env.databaseUrl)}`);
});
// Graceful shutdown handling
async function shutdown(signal) {
    logger_1.logger.info(`${signal} signal received: closing HTTP server and database pool`);
    server.close(async () => {
        try {
            await database_1.prisma.$disconnect();
            logger_1.logger.info("Database connection pool disconnected");
        }
        catch (err) {
            logger_1.logger.error("Error disconnecting database pool", err);
        }
        logger_1.logger.info("HTTP server closed");
        process.exit(0);
    });
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
