import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { envInterface } from "./application/interfaces/env.interface";

// Load .env file
const env = process.env.NODE_ENV || "local";
console.log("NODE ENV", env, process.env.NODE_ENV);

const envPath = path.join(__dirname, "../.env");
// Check if we should skip .env file loading (e.g., in Docker with env vars from docker-compose)
if (process.env.NOENV === "true") {
  console.log("Running with environment variables (no .env file required)");
  dotenv.config(); // Still call dotenv.config() to load any existing env vars
} else {
  // In non-Docker environments, require .env file
  if (!fs.existsSync(envPath)) {
    console.log(`Please create env file .env at ${envPath}`);
    process.exit(1);
  }
  dotenv.config({ path: envPath });
}

// Load environment configuration synchronously
let environmentConfig: envInterface;

try {
  // Use require for synchronous loading
  const envModule = require(`./environment/${process.env.NODE_ENV || 'local'}`);
  environmentConfig = envModule.default;
} catch (error) {
  console.error(`Failed to load environment file for ${process.env.NODE_ENV}:`, error);
  process.exit(1);
}

// Override with environment variables
if (environmentConfig.database) {
  environmentConfig.database.host = process.env.DB_HOST || environmentConfig.database.host;
  environmentConfig.database.port = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : environmentConfig.database.port;
  environmentConfig.database.name = process.env.DB_NAME || environmentConfig.database.name;
  environmentConfig.database.username = process.env.DB_USERNAME || environmentConfig.database.username;
  environmentConfig.database.password = process.env.DB_PASSWORD || environmentConfig.database.password;
}

// Override port from env
environmentConfig.port = process.env.PORT ? parseInt(process.env.PORT) : environmentConfig.port;

// Override API prefix from env
environmentConfig.apiPrefix = process.env.API_PREFIX || environmentConfig.apiPrefix;

// Override CORS configuration from env
if (environmentConfig.cors) {
  environmentConfig.cors.origin = process.env.CORS_ORIGIN || environmentConfig.cors.origin;
}

// Override JWT configuration from env
if (environmentConfig.jwt) {
  environmentConfig.JWT_SECRET = process.env.JWT_SECRET || environmentConfig.jwt.secret;
  environmentConfig.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || environmentConfig.jwt.refreshSecret;
  environmentConfig.JWT_ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_TOKEN_EXPIRY || environmentConfig.jwt.expiresIn;
  environmentConfig.JWT_REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_TOKEN_EXPIRY || environmentConfig.jwt.refreshExpiresIn;
  environmentConfig.JWT_ISSUER = process.env.JWT_ISSUER || environmentConfig.jwt.issuer;
  environmentConfig.JWT_AUDIENCE = process.env.JWT_AUDIENCE || environmentConfig.jwt.audience;
}

// Override logging configuration from env
if (environmentConfig.logging) {
  // Override log level
  environmentConfig.logging.level = process.env.LOG_LEVEL || environmentConfig.logging.level;

  // Override console logging
  if (process.env.LOG_CONSOLE_ENABLED !== undefined) {
    environmentConfig.logging.console.enabled = process.env.LOG_CONSOLE_ENABLED === 'true';
  }

  // Override file logging
  if (process.env.LOG_FILE_ERROR_ENABLED !== undefined) {
    environmentConfig.logging.file.error.enabled = process.env.LOG_FILE_ERROR_ENABLED === 'true';
  }
  if (process.env.LOG_FILE_INFO_ENABLED !== undefined) {
    environmentConfig.logging.file.info.enabled = process.env.LOG_FILE_INFO_ENABLED === 'true';
  }
  if (process.env.LOG_FILE_COMBINED_ENABLED !== undefined) {
    environmentConfig.logging.file.combined.enabled = process.env.LOG_FILE_COMBINED_ENABLED === 'true';
  }

  // Override file configuration
  environmentConfig.logging.file.maxSize = process.env.LOG_FILE_MAX_SIZE || environmentConfig.logging.file.maxSize;
  environmentConfig.logging.file.maxDays = process.env.LOG_FILE_MAX_DAYS || environmentConfig.logging.file.maxDays;
  environmentConfig.logging.file.datePattern = process.env.LOG_FILE_DATE_PATTERN || environmentConfig.logging.file.datePattern;

  // Override exception logging
  if (process.env.LOG_EXCEPTION_ENABLED !== undefined) {
    environmentConfig.logging.exception.enabled = process.env.LOG_EXCEPTION_ENABLED === 'true';
  }

  // Override rejection logging
  if (process.env.LOG_REJECTION_ENABLED !== undefined) {
    environmentConfig.logging.rejection.enabled = process.env.LOG_REJECTION_ENABLED === 'true';
  }

  // Override HTTP logging
  if (process.env.LOG_HTTP_ENABLED !== undefined) {
    environmentConfig.logging.http.enabled = process.env.LOG_HTTP_ENABLED === 'true';
  }
}

// Override monitoring configuration from env
if (environmentConfig.monitoring) {
  if (process.env.MONITORING_ENABLED !== undefined) {
    environmentConfig.monitoring.enabled = process.env.MONITORING_ENABLED === 'true';
  }
}

//console.log("LOADED ENV", environmentConfig);

// Export the config as a named export
export const config = environmentConfig;

// Also export default for backward compatibility
export default {
  loadEnvironment: async () => config,
  getCurrentEnvironment: () => config,
  currentEnv: config,
};
