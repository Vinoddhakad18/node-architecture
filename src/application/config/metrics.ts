import client from 'prom-client';
import { Request, Response } from 'express';
import { config } from '@/config';

// Create a Registry which registers the metrics
export const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({
  register,
  prefix: 'nodejs_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
  labels: {
    app: config.app?.name || 'node-architecture',
    environment: config.app?.env || config.env,
  },
});

// Custom Metrics

// HTTP Request Duration Histogram
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

// HTTP Request Counter
export const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// HTTP Request Size
export const httpRequestSize = new client.Histogram({
  name: 'http_request_size_bytes',
  help: 'Size of HTTP requests in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
  registers: [register],
});

// HTTP Response Size
export const httpResponseSize = new client.Histogram({
  name: 'http_response_size_bytes',
  help: 'Size of HTTP responses in bytes',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [100, 1000, 5000, 10000, 50000, 100000, 500000, 1000000],
  registers: [register],
});

// Active Requests Gauge
export const activeRequests = new client.Gauge({
  name: 'http_requests_in_progress',
  help: 'Number of HTTP requests currently in progress',
  labelNames: ['method'],
  registers: [register],
});

// Database Query Duration
export const dbQueryDuration = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'model'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

// Database Query Counter
export const dbQueryCounter = new client.Counter({
  name: 'db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'model', 'status'],
  registers: [register],
});

// Database Connection Pool Gauge
export const dbConnectionPool = new client.Gauge({
  name: 'db_connection_pool_connections',
  help: 'Number of database connections in the pool',
  labelNames: ['state'],
  registers: [register],
});

// Error Counter
export const errorCounter = new client.Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'status_code'],
  registers: [register],
});

// Authentication Metrics
export const authAttempts = new client.Counter({
  name: 'auth_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['status'],
  registers: [register],
});

// Business Metrics - Example: User Operations
export const userOperations = new client.Counter({
  name: 'user_operations_total',
  help: 'Total number of user operations',
  labelNames: ['operation'],
  registers: [register],
});

// Cache Hit/Miss Metrics
export const cacheHits = new client.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_name'],
  registers: [register],
});

export const cacheMisses = new client.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_name'],
  registers: [register],
});

// Application Info Gauge (for metadata)
export const appInfo = new client.Gauge({
  name: 'app_info',
  help: 'Application information',
  labelNames: ['version', 'environment', 'name'],
  registers: [register],
});

// Set application info
appInfo.set(
  {
    version: config.app?.version || '1.0.0',
    environment: config.app?.env || config.env,
    name: config.app?.name || 'node-architecture',
  },
  1
);

// Helper function to normalize route paths
export const normalizeRoutePath = (req: Request): string => {
  // Get the matched route pattern if available
  if (req.route && req.route.path) {
    return req.baseUrl + req.route.path;
  }

  // For routes without explicit patterns, try to normalize the path
  const path = req.path || req.url;

  // Replace UUIDs, IDs, and other dynamic segments
  return path
    .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
    .replace(/\/\d+/g, '/:id')
    .replace(/\?.*$/, ''); // Remove query parameters
};

// Helper function to get request size
export const getRequestSize = (req: Request): number => {
  return parseInt(req.get('content-length') || '0', 10);
};

// Helper function to calculate response size
export const getResponseSize = (res: Response): number => {
  const contentLength = res.get('content-length');
  if (contentLength) {
    return parseInt(contentLength, 10);
  }

  // Estimate from response body if content-length not set
  if (res.locals.responseBody) {
    return Buffer.byteLength(JSON.stringify(res.locals.responseBody));
  }

  return 0;
};

// Export the registry for the /metrics endpoint
export default register;
