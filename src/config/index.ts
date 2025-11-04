import dotenv from 'dotenv';
import local from './env/local';
import dev from './env/dev';
import ppd from './env/ppd';
import prod from './env/prod';

// Load environment variables from .env file
dotenv.config();

interface Config {
  env: string;
  port: number;
  mysql: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    dialect: 'mysql';
    pool: {
      max: number;
      min: number;
      acquire: number;
      idle: number;
    };
    logging: boolean | ((sql: string) => void);
  };
  mongodb: {
    uri: string;
    options: {
      maxPoolSize: number;
      minPoolSize: number;
      serverSelectionTimeoutMS: number;
      socketTimeoutMS: number;
    };
  };
  redis: {
    host: string;
    port: number;
    password: string;
    db: number;
    keyPrefix: string;
    maxRetriesPerRequest: number;
  };
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessExpiresIn: string;
    refreshExpiresIn: string;
  };
  encryption: {
    algorithm: string;
    key: string;
    iv: string;
  };
  rateLimit: {
    windowMs: number;
    max: number;
    standardHeaders: boolean;
    legacyHeaders: boolean;
  };
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  logging: {
    level: string;
    console: boolean;
    file: boolean;
    directory: string;
  };
}

const configs: Record<string, Config> = {
  local,
  dev,
  ppd,
  production: prod
};

const environment = process.env.NODE_ENV || 'local';
const config = configs[environment];

if (!config) {
  throw new Error(`Configuration for environment "${environment}" not found`);
}

// Validate required secrets in non-local environments
if (environment !== 'local') {
  const requiredSecrets = [
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'ENCRYPTION_KEY',
    'ENCRYPTION_IV'
  ];

  const missingSecrets = requiredSecrets.filter(
    (secret) => !process.env[secret]
  );

  if (missingSecrets.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingSecrets.join(', ')}`
    );
  }
}

export default config;
