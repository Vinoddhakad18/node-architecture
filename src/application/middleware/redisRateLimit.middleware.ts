import { Request, Response, NextFunction } from 'express';
import redisService from '../helpers/redis.helper';
import { logger } from '../config/logger';
import { RedisKeys } from '../config/redis.config';

/**
 * Rate Limit Options
 */
export interface RateLimitOptions {
  /** Time window in milliseconds (e.g., 60000 for 1 minute) */
  windowMs: number;
  /** Maximum number of requests per window */
  max: number;
  /** Custom message when rate limit is exceeded */
  message?: string;
  /** HTTP status code when rate limit is exceeded (default: 429) */
  statusCode?: number;
  /** Custom key generator function (default: uses IP address) */
  keyGenerator?: (req: Request) => string;
  /** Skip rate limiting based on condition */
  skip?: (req: Request) => boolean | Promise<boolean>;
  /** Handler called when rate limit is exceeded */
  handler?: (req: Request, res: Response) => void;
  /** Include rate limit info in headers */
  standardHeaders?: boolean;
  /** Include legacy rate limit headers */
  legacyHeaders?: boolean;
}

/**
 * Default key generator - uses client IP address
 */
const defaultKeyGenerator = (req: Request): string => {
  return req.ip || req.socket.remoteAddress || 'unknown';
};

/**
 * Default rate limit exceeded handler
 */
const defaultHandler = (
  _req: Request,
  res: Response,
  options: Required<RateLimitOptions>
) => {
  res.status(options.statusCode).json({
    error: 'Too Many Requests',
    message: options.message,
    retryAfter: Math.ceil(options.windowMs / 1000),
  });
};

/**
 * Redis-based Rate Limiting Middleware
 * Implements sliding window rate limiting using Redis
 *
 * @example
 * // Basic usage - 100 requests per minute
 * app.use('/api', redisRateLimitMiddleware({
 *   windowMs: 60000,
 *   max: 100
 * }));
 *
 * @example
 * // Strict rate limit for authentication endpoints
 * app.post('/api/auth/login', redisRateLimitMiddleware({
 *   windowMs: 15 * 60 * 1000, // 15 minutes
 *   max: 5, // 5 requests
 *   message: 'Too many login attempts, please try again later'
 * }), loginController);
 *
 * @example
 * // Custom key generator based on user ID
 * app.use('/api/user', redisRateLimitMiddleware({
 *   windowMs: 60000,
 *   max: 50,
 *   keyGenerator: (req) => req.user?.id || req.ip
 * }));
 */
export const redisRateLimitMiddleware = (options: RateLimitOptions) => {
  const {
    windowMs,
    max,
    message = `Too many requests, please try again later`,
    statusCode = 429,
    keyGenerator = defaultKeyGenerator,
    skip,
    handler = defaultHandler,
    standardHeaders = true,
    legacyHeaders = true,
  } = options;

  const windowSeconds = Math.floor(windowMs / 1000);

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if rate limiting should be skipped
      if (skip && (await skip(req))) {
        return next();
      }

      // Check if Redis is ready
      if (!redisService.isReady()) {
        logger.warn('Redis not ready, bypassing rate limit');
        return next();
      }

      // Generate rate limit key
      const identifier = keyGenerator(req);
      const key = RedisKeys.rateLimit(identifier);

      // Increment request counter
      const currentCount = await redisService.incr(key);

      // Set expiration on first request
      if (currentCount === 1) {
        await redisService.expire(key, windowSeconds);
      }

      // Get remaining TTL
      const ttl = await redisService.ttl(key);
      const resetTime = Date.now() + ttl * 1000;

      // Set rate limit headers
      if (standardHeaders) {
        res.setHeader('RateLimit-Limit', max.toString());
        res.setHeader('RateLimit-Remaining', Math.max(0, max - currentCount).toString());
        res.setHeader('RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
      }

      if (legacyHeaders) {
        res.setHeader('X-RateLimit-Limit', max.toString());
        res.setHeader('X-RateLimit-Remaining', Math.max(0, max - currentCount).toString());
        res.setHeader('X-RateLimit-Reset', Math.ceil(resetTime / 1000).toString());
      }

      // Check if rate limit exceeded
      if (currentCount > max) {
        logger.warn('Rate limit exceeded', {
          identifier,
          currentCount,
          max,
          ttl,
          requestId: req.requestId,
          url: req.originalUrl,
        });

        res.setHeader('Retry-After', ttl.toString());

        return handler(req, res, {
          windowMs,
          max,
          message,
          statusCode,
          keyGenerator,
          standardHeaders,
          legacyHeaders,
        } as Required<RateLimitOptions>);
      }

      logger.debug('Rate limit check passed', {
        identifier,
        currentCount,
        max,
        remaining: max - currentCount,
        requestId: req.requestId,
      });

      next();
    } catch (error) {
      logger.error('Rate limit middleware error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId: req.requestId,
      });

      // On error, allow the request (fail open)
      next();
    }
  };
};

/**
 * Create a rate limiter factory with preset configurations
 */
export const createRateLimiter = (defaultOptions: RateLimitOptions) => {
  return (overrides?: Partial<RateLimitOptions>) => {
    return redisRateLimitMiddleware({ ...defaultOptions, ...overrides });
  };
};

/**
 * Preset rate limiters for common use cases
 */
export const RateLimiters = {
  /**
   * Strict rate limiter for authentication endpoints
   * 5 requests per 15 minutes
   */
  strict: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Too many attempts, please try again later',
  }),

  /**
   * Moderate rate limiter for API endpoints
   * 100 requests per minute
   */
  moderate: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
  }),

  /**
   * Relaxed rate limiter for public endpoints
   * 1000 requests per hour
   */
  relaxed: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 1000,
  }),

  /**
   * Very strict rate limiter for sensitive operations
   * 3 requests per hour
   */
  veryStrict: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: 'Rate limit exceeded for sensitive operation',
  }),
};

/**
 * Reset rate limit for a specific identifier
 * Utility function to manually reset rate limits
 */
export const resetRateLimit = async (identifier: string): Promise<number> => {
  try {
    const key = RedisKeys.rateLimit(identifier);
    const deleted = await redisService.del(key);
    logger.info(`Rate limit reset for: ${identifier}`, { deleted });
    return deleted;
  } catch (error) {
    logger.error('Reset rate limit error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      identifier,
    });
    throw error;
  }
};

/**
 * Get current rate limit status for an identifier
 */
export const getRateLimitStatus = async (
  identifier: string
): Promise<{
  current: number;
  ttl: number;
  resetAt: Date;
} | null> => {
  try {
    const key = RedisKeys.rateLimit(identifier);
    const exists = await redisService.exists(key);

    if (!exists) {
      return null;
    }

    const currentStr = await redisService.get(key);
    const current = currentStr ? parseInt(currentStr, 10) : 0;
    const ttl = await redisService.ttl(key);
    const resetAt = new Date(Date.now() + ttl * 1000);

    return { current, ttl, resetAt };
  } catch (error) {
    logger.error('Get rate limit status error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      identifier,
    });
    throw error;
  }
};
