/**
 * Test Setup and Global Configuration
 * This file runs before all tests to configure the test environment
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.NOENV = 'true'; // Skip .env file requirement in tests
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '3306';
process.env.DB_NAME = 'node_app_db';
process.env.DB_USERNAME = 'root';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = 'rootpassword';
process.env.REDIS_ENABLED = 'false'; // Disable Redis in tests

// Increase timeout for database operations
jest.setTimeout(10000);

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

/**
 * Global cleanup after all tests complete
 * This ensures all connections are properly closed
 */
afterAll(async () => {
  // Close all active handles and connections
  const closePromises: Promise<void>[] = [];

  // Close Sequelize connections if they exist
  try {
    // Check if sequelize module is in require.cache
    const sequelizeModulePath = Object.keys(require.cache).find(
      (key) => key.includes('config') && key.includes('database') && key.includes('database.ts')
    );

    if (sequelizeModulePath) {
      const databaseModule = require.cache[sequelizeModulePath];
      if (databaseModule && databaseModule.exports && databaseModule.exports.sequelize) {
        const { sequelize } = databaseModule.exports;
        if (sequelize && typeof sequelize.close === 'function') {
          closePromises.push(
            sequelize.close().catch(() => {
              // Ignore errors
            })
          );
        }
      }
    }
  } catch {
    // Ignore if module not loaded
  }

  // Close Redis connections if they exist
  try {
    const redisModulePath = Object.keys(require.cache).find(
      (key) => key.includes('helpers') && key.includes('redis.helper')
    );

    if (redisModulePath) {
      const redisModule = require.cache[redisModulePath];
      if (redisModule && redisModule.exports && redisModule.exports.default) {
        const redisService = redisModule.exports.default;
        if (
          redisService &&
          typeof redisService.isRedisEnabled === 'function' &&
          redisService.isRedisEnabled() &&
          typeof redisService.disconnect === 'function'
        ) {
          closePromises.push(
            redisService.disconnect().catch(() => {
              // Ignore errors
            })
          );
        }
      }
    }
  } catch {
    // Ignore if module not loaded
  }

  // Wait for all connections to close
  await Promise.all(closePromises);

  // Wait a bit for all async operations to complete
  await new Promise((resolve) => setTimeout(resolve, 100));
});
