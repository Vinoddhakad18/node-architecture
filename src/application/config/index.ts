/**
 * Config Barrel Export
 * Centralizes all configuration exports for easy imports
 */

// Logger exports
export { logger, stream, getLoggerWithRequestId } from './logger';

// Redis configuration exports
export {
  redisConfig,
  redisClusterConfig,
  isClusterMode,
  getClusterNodes,
  RedisTTL,
  RedisKeys,
} from './redis.config';

// JWT configuration exports
export { jwtConfig, TokenType, validateJwtConfig } from './jwt.config';

// Metrics exports
export {
  register,
  httpRequestDuration,
  httpRequestCounter,
  httpRequestSize,
  httpResponseSize,
  activeRequests,
  dbQueryDuration,
  dbQueryCounter,
  dbConnectionPool,
  errorCounter,
  authAttempts,
  userOperations,
  cacheHits,
  cacheMisses,
  appInfo,
  normalizeRoutePath,
  getRequestSize,
  getResponseSize,
} from './metrics';
export { default as metricsRegistry } from './metrics';

// Sequelize database exports
export {
  sequelize,
  testConnection,
  closeConnection,
  syncDatabase,
} from './sequelize';
