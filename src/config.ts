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

// Override JWT configuration from env
if (environmentConfig.jwt) {
  environmentConfig.JWT_SECRET = process.env.JWT_SECRET || environmentConfig.jwt.secret;
  environmentConfig.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || environmentConfig.jwt.refreshSecret;
  environmentConfig.JWT_ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_TOKEN_EXPIRY || environmentConfig.jwt.expiresIn;
  environmentConfig.JWT_REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_TOKEN_EXPIRY || environmentConfig.jwt.refreshExpiresIn;
  environmentConfig.JWT_ISSUER = process.env.JWT_ISSUER || environmentConfig.jwt.issuer;
  environmentConfig.JWT_AUDIENCE = process.env.JWT_AUDIENCE || environmentConfig.jwt.audience;
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
