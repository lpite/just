import { config } from "../config";

type LogLevel = "debug" | "info" | "warn" | "error";

const logLevels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLogLevel = logLevels[config.LOG_LEVEL as LogLevel] || 1;

function getTimestamp(): string {
  return new Date().toISOString();
}

function shouldLog(level: LogLevel): boolean {
  return logLevels[level] >= currentLogLevel;
}

export const logger = {
  debug: (message: string, data?: unknown) => {
    if (shouldLog("debug")) {
      console.log(`[${getTimestamp()}] [DEBUG]`, message, data || "");
    }
  },

  info: (message: string, data?: unknown) => {
    if (shouldLog("info")) {
      console.log(`[${getTimestamp()}] [INFO]`, message, data || "");
    }
  },

  warn: (message: string, data?: unknown) => {
    if (shouldLog("warn")) {
      console.warn(`[${getTimestamp()}] [WARN]`, message, data || "");
    }
  },

  error: (message: string, error?: unknown) => {
    if (shouldLog("error")) {
      console.error(`[${getTimestamp()}] [ERROR]`, message);
      if (error instanceof Error) {
        console.error("  Message:", error.message);
        console.error("  Stack:", error.stack);
      } else {
        console.error("  Details:", error);
      }
    }
  },
};
