/**
 * Metrics Configuration Exports
 */
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

export { default } from './metrics';
