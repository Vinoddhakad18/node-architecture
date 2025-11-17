import { RedisOptions } from 'ioredis';

/**
 * Redis Configuration
 * Configures connection settings, retry strategy, and reconnection logic
 */
export const redisConfig: RedisOptions = {
  // Connection settings
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'app:',

  // Connection timeout
  connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000', 10),

  // Max retries per request
  maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES_PER_REQUEST || '3', 10),

  // Enable ready check
  enableReadyCheck: true,

  // Enable offline queue
  enableOfflineQueue: true,

  // Lazy connect (connect on first command)
  lazyConnect: false,

  /**
   * Retry strategy for failed connections
   * Implements exponential backoff with max delay
   */
  retryStrategy(times: number): number | void {
    const maxRetryTime = 30000; // 30 seconds
    const delay = Math.min(times * 50, 2000);

    if (times > 20) {
      // Stop retrying after 20 attempts
      return undefined;
    }

    return delay;
  },

  /**
   * Reconnect on specific errors
   * Returns true to trigger reconnection
   */
  reconnectOnError(err: Error): boolean | 1 | 2 {
    const targetErrors = ['READONLY', 'ETIMEDOUT', 'ECONNRESET'];

    if (targetErrors.some(errMsg => err.message.includes(errMsg))) {
      return true; // Reconnect
    }

    return false;
  },
};

/**
 * Redis TTL Constants (in seconds)
 */
export const RedisTTL = {
  SHORT: 60,           // 1 minute
  MEDIUM: 300,         // 5 minutes
  LONG: 3600,          // 1 hour
  VERY_LONG: 7200,     // 2 hours
  DAY: 86400,          // 24 hours
  WEEK: 604800,        // 7 days
} as const;

/**
 * Redis Key Patterns
 * Consistent naming conventions for Redis keys
 */
export const RedisKeys = {
  // User related keys
  user: (id: number | string) => `user:${id}`,
  userSession: (id: number | string) => `user:${id}:session`,
  userProfile: (id: number | string) => `user:${id}:profile`,

  // Cache keys
  cache: (resource: string) => `cache:${resource}`,

  // Rate limiting keys
  rateLimit: (identifier: string) => `ratelimit:${identifier}`,

  // Authentication keys
  authToken: (token: string) => `auth:token:${token}`,
  refreshToken: (token: string) => `auth:refresh:${token}`,

  // Temporary data
  temp: (key: string) => `temp:${key}`,
} as const;
