export const config = {
  // Server
  PORT: parseInt(process.env.PORT || "3000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",

  // Database
  DATABASE_URL: process.env.DATABASE_URL || "data/app.db",
  FILE_STORAGE_PATH: process.env.FILE_STORAGE_PATH || "data/files",

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || "info",

  // Check if running in production
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
};
