export const logger = {
  info: (msg: string, meta?: unknown) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${msg}`, meta !== undefined ? meta : "");
  },
  warn: (msg: string, meta?: unknown) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`, meta !== undefined ? meta : "");
  },
  error: (msg: string, error?: unknown) => {
    const errText = error instanceof Error ? error.stack || error.message : String(error || "");
    console.error(`[ERROR] ${new Date().toISOString()} - ${msg} ${errText}`);
  },
};
