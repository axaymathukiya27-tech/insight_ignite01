"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.logger = {
    info: (msg, meta) => {
        console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, meta !== undefined ? meta : "");
    },
    warn: (msg, meta) => {
        console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, meta !== undefined ? meta : "");
    },
    error: (msg, error) => {
        const errText = error instanceof Error ? error.stack || error.message : String(error || "");
        console.error(`[ERROR] ${new Date().toISOString()} - ${msg} ${errText}`);
    },
};
