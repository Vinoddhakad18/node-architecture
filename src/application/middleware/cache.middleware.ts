import { Request, Response, NextFunction } from 'express';
import redisService from '@helpers/redis.helper';
import { logger } from '@config/logger';
import { RedisTTL } from '@config/redis.config';

/**
 * Cache Middleware Options
 */
export interface CacheOptions {
  /** Time to live in seconds (default: 300) */
  ttl?: number;
  /** Key prefix for cache entries (default: 'cache') */
  keyPrefix?: string;
  /** Custom key generator function */
  keyGenerator?: (req: Request) => string;
  /** Condition to determine if request should be cached */
  condition?: (req: Request) => boolean;
}

/**
 * Default cache key generator
 * Generates cache key from request URL and query parameters
 */
const defaultKeyGenerator = (req: Request): string => {
  const baseUrl = req.originalUrl || req.url;
  return baseUrl;
};

/**
 * Cache Middleware
 * Caches GET request responses in Redis
 *
 * @example
 * // Basic usage with default options
 * app.get('/api/users', cacheMiddleware(), getUsersController);
 *
 * @example
 * // Custom TTL and prefix
 * app.get('/api/products', cacheMiddleware({ ttl: 600, keyPrefix: 'products' }), getProductsController);
 *
 * @example
 * // Custom key generator
 * app.get('/api/user/:id', cacheMiddleware({
 *   keyGenerator: (req) => `user:${req.params.id}`
 * }), getUserController);
 */
export const cacheMiddleware = (options: CacheOptions = {}) => {
  const {
    ttl = RedisTTL.MEDIUM,
    keyPrefix = 'cache',
    keyGenerator = defaultKeyGenerator,
    condition = () => true,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Check custom condition
    if (!condition(req)) {
      return next();
    }

    // Check if Redis is ready
    if (!redisService.isReady()) {
      logger.warn('Redis not ready, bypassing cache');
      return next();
    }

    const cacheKey = `${keyPrefix}:${keyGenerator(req)}`;

    try {
      // Try to get cached response
      const cachedData = await redisService.get(cacheKey);

      if (cachedData) {
        logger.info(`Cache hit: ${cacheKey}`, {
          requestId: req.requestId,
          url: req.originalUrl,
        });

        // Return cached response
        return res.json(JSON.parse(cachedData as string));
      }

      logger.debug(`Cache miss: ${cacheKey}`, {
        requestId: req.requestId,
        url: req.originalUrl,
      });

      // Store the original res.json method
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = (data: any) => {
        // Cache the response data
        redisService
          .set(cacheKey, JSON.stringify(data), ttl)
          .then(() => {
            logger.info(`Response cached: ${cacheKey}`, {
              requestId: req.requestId,
              ttl,
            });
          })
          .catch((err) => {
            logger.error('Cache set error:', {
              error: err.message,
              key: cacheKey,
              requestId: req.requestId,
            });
          });

        // Call original json method
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        key: cacheKey,
        requestId: req.requestId,
      });

      // Continue without cache on error (fail-safe)
      next();
    }
  };
};

/**
 * Cache Invalidation Middleware
 * Invalidates cache entries matching a pattern
 *
 * @example
 * // Invalidate cache after POST/PUT/DELETE operations
 * app.post('/api/users', invalidateCacheMiddleware({ pattern: 'cache:/api/users*' }), createUserController);
 */
export const invalidateCacheMiddleware = (options: {
  pattern: string;
  keyPrefix?: string;
}) => {
  const { pattern, keyPrefix = 'cache' } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original send method
    const originalSend = res.send.bind(res);

    // Override send to invalidate cache after response
    res.send = (data: any) => {
      // Invalidate cache asynchronously (don't block response)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const fullPattern = pattern.startsWith(keyPrefix) ? pattern : `${keyPrefix}:${pattern}`;

        redisService
          .keys(fullPattern)
          .then((keys) => {
            if (keys.length > 0) {
              return redisService.del(keys);
            }
            return 0;
          })
          .then((deletedCount) => {
            if (deletedCount > 0) {
              logger.info(`Cache invalidated: ${deletedCount} key(s) deleted`, {
                pattern: fullPattern,
                requestId: req.requestId,
              });
            }
          })
          .catch((err) => {
            logger.error('Cache invalidation error:', {
              error: err.message,
              pattern: fullPattern,
              requestId: req.requestId,
            });
          });
      }

      return originalSend(data);
    };

    next();
  };
};

/**
 * Clear cache for specific key
 * Utility function to clear cache programmatically
 */
export const clearCache = async (key: string, prefix = 'cache'): Promise<number> => {
  try {
    const fullKey = key.startsWith(prefix) ? key : `${prefix}:${key}`;
    const deleted = await redisService.del(fullKey);
    logger.info(`Cache cleared: ${fullKey}`, { deleted });
    return deleted;
  } catch (error) {
    logger.error('Clear cache error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      key,
    });
    throw error;
  }
};

/**
 * Clear all cache entries matching pattern
 * Utility function to clear multiple cache entries
 */
export const clearCachePattern = async (
  pattern: string,
  prefix = 'cache'
): Promise<number> => {
  try {
    const fullPattern = pattern.startsWith(prefix) ? pattern : `${prefix}:${pattern}`;
    const keys = await redisService.keys(fullPattern);

    if (keys.length === 0) {
      logger.info(`No cache entries found for pattern: ${fullPattern}`);
      return 0;
    }

    const deleted = await redisService.del(keys);
    logger.info(`Cache pattern cleared: ${fullPattern}`, {
      deleted,
      keys: keys.length,
    });
    return deleted;
  } catch (error) {
    logger.error('Clear cache pattern error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      pattern,
    });
    throw error;
  }
};
