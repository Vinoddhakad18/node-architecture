import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { envInterface } from './application/interfaces/env.interface';

const env = process.env.NODE_ENV || 'dev';
console.log('NODE ENV', env, process.env.NOENV);

// A file should be exist - .env.<envName>
// In production, __dirname points to /app/dist, so we need to go up one level
const envPath = path.join(__dirname, '../', `.env.${env}`);

if (!process.env.NOENV || process.env.NOENV === 'false') {
  if (!fs.existsSync(envPath)) {
    console.log(`Please create env file .env.${env}`);
    process.exit(1);
  }

  dotenv.config({ path: envPath });
  console.log('Loaded .env file from:', envPath);
  console.log('DB_HOST from process.env:', process.env.DB_HOST);
} else {
  console.log('NO .ENV. SPECIFIED');
  dotenv.config();
}

// Export configuration based on environment variables
export const config: envInterface = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || '/api',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'node_app_db',
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  logging: {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'error' : 'debug'),
  },
};

// Export logger for use throughout the application
export { logger, stream } from './application/config/logger';
