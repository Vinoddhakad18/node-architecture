/**
 * Cache-related Constants
 * Cache keys, TTL values, and prefixes
 */

/**
 * Cache Key Prefixes
 * Used to namespace cache keys
 */
export const CachePrefix = {
  USER: 'user',
  COUNTRY: 'country',
  SESSION: 'session',
  TOKEN: 'token',
  RATE_LIMIT: 'rate_limit',
  FILE: 'file',
};

/**
 * Cache TTL Values (in seconds)
 */
export enum CacheTTL {
  VERY_SHORT = 60, // 1 minute
  SHORT = 300, // 5 minutes
  MEDIUM = 900, // 15 minutes
  LONG = 3600, // 1 hour
  VERY_LONG = 86400, // 24 hours
  WEEK = 604800, // 7 days
}

/**
 * Cache Key Generators
 * Functions to generate consistent cache keys
 */
export const CacheKeys = {
  // User cache keys
  userById: (id: number) => `${CachePrefix.USER}:id:${id}`,
  userByEmail: (email: string) => `${CachePrefix.USER}:email:${email.toLowerCase()}`,
  userSession: (userId: number, sessionId: string) =>
    `${CachePrefix.SESSION}:${userId}:${sessionId}`,

  // Country cache keys
  countryById: (id: number) => `${CachePrefix.COUNTRY}:id:${id}`,
  countryByCode: (code: string) => `${CachePrefix.COUNTRY}:code:${code.toUpperCase()}`,
  countriesActive: () => `${CachePrefix.COUNTRY}:active`,
  countriesList: (options: string) => `${CachePrefix.COUNTRY}:list:${options}`,

  // Token cache keys
  tokenBlacklist: (token: string) => `${CachePrefix.TOKEN}:blacklist:${token}`,
  refreshToken: (userId: number) => `${CachePrefix.TOKEN}:refresh:${userId}`,

  // Rate limit cache keys
  rateLimit: (key: string) => `${CachePrefix.RATE_LIMIT}:${key}`,

  // File cache keys
  fileMetadata: (id: number) => `${CachePrefix.FILE}:metadata:${id}`,
};
