/**
 * Test Setup and Global Configuration
 */

// Environment Variables
process.env.NODE_ENV = 'test';
process.env.NOENV = 'true';

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

process.env.REDIS_ENABLED = 'false';

// Global timeout
jest.setTimeout(30000);

// Silence console output
jest.spyOn(console, 'log').mockImplementation(() => undefined);
jest.spyOn(console, 'info').mockImplementation(() => undefined);
jest.spyOn(console, 'debug').mockImplementation(() => undefined);
jest.spyOn(console, 'warn').mockImplementation(() => undefined);
jest.spyOn(console, 'error').mockImplementation(() => undefined);

/**
 * Reset mocks before each test
 */
beforeEach(() => {
  jest.clearAllMocks();
});

/**
 * Restore mocks after each test
 */
afterEach(() => {
  jest.restoreAllMocks();
});

/**
 * Cleanup resources after all tests
 */
afterAll(async () => {
  const closePromises: Promise<unknown>[] = [];

  /**
   * Close Sequelize
   */
  try {
    const sequelizeModulePath = Object.keys(require.cache).find(
      (key) =>
        key.includes('database') &&
        (key.includes('database.ts') || key.includes('database.js'))
    );

    if (sequelizeModulePath) {
      const databaseModule = require.cache[sequelizeModulePath];

      const sequelize =
        databaseModule?.exports?.sequelize ||
        databaseModule?.exports?.default;

      if (
        sequelize &&
        typeof sequelize.close === 'function'
      ) {
        closePromises.push(
          sequelize.close().catch(() => undefined)
        );
      }
    }
  } catch {
    // ignore
  }

  /**
   * Close Redis
   */
  try {
    const redisModulePath = Object.keys(require.cache).find(
      (key) =>
        key.includes('redis.helper')
    );

    if (redisModulePath) {
      const redisModule = require.cache[redisModulePath];

      const redisService =
        redisModule?.exports?.default ||
        redisModule?.exports;

      if (
        redisService &&
        typeof redisService.disconnect === 'function'
      ) {
        closePromises.push(
          redisService.disconnect().catch(() => undefined)
        );
      }
    }
  } catch {
    // ignore
  }

  await Promise.allSettled(closePromises);

  // Allow pending promises/events to finish
  await new Promise((resolve) => setTimeout(resolve, 100));
});