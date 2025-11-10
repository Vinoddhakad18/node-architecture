const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Check if running in Docker (common indicators)
const isDocker = (() => {
  try {
    return fs.existsSync('/.dockerenv') ||
           process.env.DOCKER_CONTAINER === 'true' ||
           (fs.existsSync('/proc/1/cgroup') &&
            fs.readFileSync('/proc/1/cgroup', 'utf8').includes('docker'));
  } catch (error) {
    return false;
  }
})();

// In Docker with docker-compose, env vars are already loaded via env_file
// So we can skip .env file loading and use process.env directly
if (isDocker && (process.env.DB_HOST || process.env.NODE_ENV)) {
  console.log('Running in Docker container - using environment variables from docker-compose');
} else {
  // Find the project root by looking for package.json
  let currentDir = __dirname;
  let envPath = null;

  // Traverse up the directory tree to find .env file
  while (currentDir !== path.parse(currentDir).root) {
    const potentialEnvPath = path.join(currentDir, '.env');
    const potentialPackageJson = path.join(currentDir, 'package.json');

    if (fs.existsSync(potentialPackageJson)) {
      // Found project root
      envPath = potentialEnvPath;
      break;
    }

    currentDir = path.dirname(currentDir);
  }

  if (envPath && fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('Loaded .env file from:', envPath);
  } else {
    console.log(`Note: .env file not found at ${envPath || 'unknown path'}, using existing environment variables`);
    dotenv.config();
  }
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
  local: {
    ...baseConfig,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    database: process.env.DB_NAME || 'node_app_db',
    username: process.env.DB_USER || process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    logging: process.env.DB_LOGGING === 'true' ? console.log : false,
  },
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
