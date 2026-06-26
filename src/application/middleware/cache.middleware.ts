import { logger } from '@config/logger';
import { RedisTTL } from '@config/redis';
import redisService from '@helpers/redis.helper';
import { Request, Response, NextFunction } from 'express';

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
        logger.info( {
          requestId: req.requestId,
          url: req.originalUrl,
        }, `Cache hit: ${cacheKey}`);

        // Return cached response
        return res.json(JSON.parse(cachedData));
      }

      logger.debug( {
        requestId: req.requestId,
        url: req.originalUrl,
      },`Cache miss: ${cacheKey}`);

      // Store the original res.json method
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = <T>(data: T) => {
        // Cache the response data
        redisService
          .set(cacheKey, JSON.stringify(data), ttl)
          .then(() => {
            logger.info( {
              requestId: req.requestId,
              ttl,
            }, `Response cached: ${cacheKey}`);
          })
          .catch((err) => {
            logger.error({error: err}, 'Cache set error:');
          });

        // Call original json method
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error({
        error: error instanceof Error ? error.message : 'Unknown error',
        key: cacheKey,
        requestId: req.requestId,
      }, 'Cache middleware error:');

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
export const invalidateCacheMiddleware = (options: { pattern: string; keyPrefix?: string }) => {
  const { pattern, keyPrefix = 'cache' } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original send method
    const originalSend = res.send.bind(res);

    // Override send to invalidate cache after response
    res.send = <T>(data: T) => {
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
              logger.info({
                pattern: fullPattern,
                requestId: req.requestId,
              },`Cache invalidated: ${deletedCount} key(s) deleted`);
            }
          })
          .catch((err) => {
            logger.error( {
              error: err.message,
              pattern: fullPattern,
              requestId: req.requestId,
            },'Cache invalidation error:');
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
    logger.info( { deleted },`Cache cleared: ${fullKey}`);
    return deleted;
  } catch (error) {
    logger.error( {
      error: error instanceof Error ? error.message : 'Unknown error',
      key,
    }, 'Clear cache error:');
    throw error;
  }
};

/**
 * Clear all cache entries matching pattern
 * Utility function to clear multiple cache entries
 */
export const clearCachePattern = async (pattern: string, prefix = 'cache'): Promise<number> => {
  try {
    const fullPattern = pattern.startsWith(prefix) ? pattern : `${prefix}:${pattern}`;
    const keys = await redisService.keys(fullPattern);

    if (keys.length === 0) {
      logger.info(`No cache entries found for pattern: ${fullPattern}`);
      return 0;
    }

    const deleted = await redisService.del(keys);
    logger.info( { deleted, keys: keys.length },`Cache pattern cleared: ${fullPattern}`);
    return deleted;
  } catch (error) {
    logger.error( {
      error: error instanceof Error ? error.message : 'Unknown error',
      pattern,
    }, 'Clear cache pattern error:');
    throw error;
  }
};
