import { RedisOptions, ClusterOptions, ClusterNode } from 'ioredis';

/**
 * Check if Redis Cluster mode is enabled
 * Default: true (cluster mode enabled)
 */
export const isClusterMode = (): boolean => {
  return process.env.REDIS_CLUSTER_ENABLED !== 'false';
};

/**
 * Parse cluster nodes from environment variable
 * Format: host1:port1,host2:port2,host3:port3
 */
const parseClusterNodes = (): ClusterNode[] => {
  const nodesStr =
    process.env.REDIS_CLUSTER_NODES || 'localhost:6379,localhost:6380,localhost:6381';
  return nodesStr.split(',').map((node) => {
    const [host, port] = node.trim().split(':');
    return {
      host: host || 'localhost',
      port: parseInt(port, 10) || 6379,
    };
  });
};

/**
 * Common Redis options for both standalone and cluster modes
 */
const commonRedisOptions = {
  password: process.env.REDIS_PASSWORD || undefined,
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'app:',
  connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000', 10),
  maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES_PER_REQUEST || '3', 10),
  enableReadyCheck: true,
  enableOfflineQueue: true,
  lazyConnect: false,

  /**
   * Retry strategy for failed connections
   * Implements exponential backoff with max delay
   */
  retryStrategy(times: number): number | void {
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

    if (targetErrors.some((errMsg) => err.message.includes(errMsg))) {
      return true; // Reconnect
    }

    return false;
  },
};

/**
 * Standalone Redis Configuration
 * Used when REDIS_CLUSTER_ENABLED=false
 */
export const redisConfig: RedisOptions = {
  ...commonRedisOptions,
  // Connection settings for standalone mode
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  db: parseInt(process.env.REDIS_DB || '0', 10),
};

/**
 * Redis Cluster Configuration
 * Used when REDIS_CLUSTER_ENABLED=true (default)
 */
export const redisClusterConfig: ClusterOptions = {
  ...commonRedisOptions,
  // Cluster-specific settings
  clusterRetryStrategy(times: number): number | null {
    const delay = Math.min(times * 50, 2000);
    if (times > 20) {
      return null;
    }
    return delay;
  },

  // Enable automatic node discovery
  enableAutoPipelining: process.env.REDIS_CLUSTER_AUTO_PIPELINING !== 'false',

  // Redirect configuration
  maxRedirections: parseInt(process.env.REDIS_CLUSTER_MAX_REDIRECTIONS || '16', 10),

  // Refresh configuration
  enableReadyCheck: true,

  // Scale reads configuration
  scaleReads: (process.env.REDIS_CLUSTER_SCALE_READS as 'master' | 'slave' | 'all') || 'slave',

  // NAT mapping (useful for Docker/Kubernetes)
  natMap: process.env.REDIS_CLUSTER_NAT_MAP
    ? JSON.parse(process.env.REDIS_CLUSTER_NAT_MAP)
    : undefined,

  // Slots refresh configuration
  slotsRefreshTimeout: parseInt(process.env.REDIS_CLUSTER_SLOTS_REFRESH_TIMEOUT || '1000', 10),

  // TLS/SSL support - applied to each node connection
  redisOptions:
    process.env.REDIS_TLS_ENABLED === 'true'
      ? {
          tls: {
            rejectUnauthorized: process.env.REDIS_TLS_REJECT_UNAUTHORIZED !== 'false',
          },
        }
      : undefined,
};

/**
 * Get cluster nodes configuration
 */
export const getClusterNodes = (): ClusterNode[] => {
  return parseClusterNodes();
};

/**
 * Redis TTL Constants (in seconds)
 */
export const RedisTTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 7200, // 2 hours
  DAY: 86400, // 24 hours
  WEEK: 604800, // 7 days
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
