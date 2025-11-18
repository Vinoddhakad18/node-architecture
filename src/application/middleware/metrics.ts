import { Request, Response, NextFunction } from 'express';
import {
  httpRequestDuration,
  httpRequestCounter,
  httpRequestSize,
  httpResponseSize,
  activeRequests,
  errorCounter,
  normalizeRoutePath,
  getRequestSize,
  getResponseSize,
} from '@config/metrics';

/**
 * Prometheus metrics middleware
 * Tracks HTTP request metrics including duration, count, size, and errors
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Skip metrics for the metrics endpoint itself to avoid recursive tracking
  if (req.path === '/metrics' || req.path === '/health') {
    return next();
  }

  const startTime = Date.now();
  const method = req.method;

  // Increment active requests
  activeRequests.inc({ method });

  // Track request size
  const requestSize = getRequestSize(req);

  // Store original end function
  const originalEnd = res.end;

  // Override res.end to capture metrics when response is sent
  res.end = function (this: Response, chunk?: any, encoding?: any, cb?: any): Response {
    // Restore original end function and call it
    res.end = originalEnd;
    const result = originalEnd.call(this, chunk, encoding, cb);

    // Calculate metrics
    const duration = (Date.now() - startTime) / 1000; // Convert to seconds
    const route = normalizeRoutePath(req);
    const statusCode = res.statusCode.toString();
    const responseSize = getResponseSize(res);

    // Record metrics
    httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
    httpRequestCounter.inc({ method, route, status_code: statusCode });
    httpRequestSize.observe({ method, route }, requestSize);
    httpResponseSize.observe({ method, route, status_code: statusCode }, responseSize);

    // Decrement active requests
    activeRequests.dec({ method });

    // Track errors (4xx and 5xx)
    if (res.statusCode >= 400) {
      const errorType = res.statusCode >= 500 ? 'server_error' : 'client_error';
      errorCounter.inc({ type: errorType, status_code: statusCode });
    }

    return result;
  };

  next();
};

/**
 * Database query metrics helper
 * Use this to track database operation performance
 *
 * Example usage:
 * const endTimer = trackDbQuery('SELECT', 'User');
 * try {
 *   const result = await User.findAll();
 *   endTimer('success');
 *   return result;
 * } catch (error) {
 *   endTimer('error');
 *   throw error;
 * }
 */
import { dbQueryDuration, dbQueryCounter } from '@config/metrics';

export const trackDbQuery = (operation: string, model: string) => {
  const startTime = Date.now();

  return (status: 'success' | 'error') => {
    const duration = (Date.now() - startTime) / 1000;
    dbQueryDuration.observe({ operation, model }, duration);
    dbQueryCounter.inc({ operation, model, status });
  };
};

/**
 * Authentication metrics helper
 * Use this to track login attempts
 *
 * Example usage:
 * trackAuthAttempt('success');
 * trackAuthAttempt('failure');
 */
import { authAttempts } from '@config/metrics';

export const trackAuthAttempt = (status: 'success' | 'failure') => {
  authAttempts.inc({ status });
};

/**
 * User operation metrics helper
 * Use this to track business-specific user operations
 *
 * Example usage:
 * trackUserOperation('registration');
 * trackUserOperation('profile_update');
 */
import { userOperations } from '@config/metrics';

export const trackUserOperation = (operation: string) => {
  userOperations.inc({ operation });
};

/**
 * Cache metrics helpers
 * Use these to track cache performance
 *
 * Example usage:
 * trackCacheHit('user_cache');
 * trackCacheMiss('user_cache');
 */
import { cacheHits, cacheMisses } from '@config/metrics';

export const trackCacheHit = (cacheName: string) => {
  cacheHits.inc({ cache_name: cacheName });
};

export const trackCacheMiss = (cacheName: string) => {
  cacheMisses.inc({ cache_name: cacheName });
};
