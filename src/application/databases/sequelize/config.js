const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const env = process.env.NODE_ENV || 'development';
const envPath = path.join(__dirname, '../../../../', `.env.${env}`);

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('Loaded .env file from:', envPath);
} else {
  console.log(`Warning: .env.${env} file not found, using default .env or process.env`);
  dotenv.config();
}

// Base configuration shared across environments
const baseConfig = {
  dialect: 'mysql',
  dialectOptions: {
    charset: process.env.DB_CHARSET || 'utf8mb4',
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '10000', 10),
  },
  pool: {
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    min: parseInt(process.env.DB_POOL_MIN || '0', 10),
    acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
    idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10),
  },
  timezone: process.env.DB_TIMEZONE || '+00:00',
  define: {
    timestamps: true,
    underscored: process.env.DB_UNDERSCORED === 'true',
    freezeTableName: process.env.DB_FREEZE_TABLE_NAME === 'true',
    paranoid: process.env.DB_PARANOID === 'true',
  },
};

// Environment-specific configurations
module.exports = {
  development: {
    ...baseConfig,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    database: process.env.DB_NAME || 'myapp_dev',
    username: process.env.DB_USER || process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  },
  test: {
    ...baseConfig,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    database: process.env.DB_NAME || 'myapp_test',
    username: process.env.DB_USER || process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    logging: false,
  },
  production: {
    ...baseConfig,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306', 10),
    database: process.env.DB_NAME,
    username: process.env.DB_USER || process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    logging: false,
  },
};
