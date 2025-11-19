import redisService from '../helpers/redis.helper';
import { RedisTTL, RedisKeys } from '../config/redis';
import { logger } from '../config/logger';

/**
 * Redis Usage Examples
 * Demonstrates common Redis operations and patterns
 */

/**
 * Example 1: Basic String Operations
 */
export async function basicStringOperations() {
  logger.info('=== Basic String Operations ===');

  try {
    // SET and GET
    await redisService.set('user:name', 'John Doe');
    const name = await redisService.get('user:name');
    logger.info(`Name: ${name}`);

    // SET with expiration (5 minutes)
    await redisService.set('session:abc123', 'session-data', RedisTTL.MEDIUM);
    logger.info('Session data stored with 5 minute expiration');

    // Check TTL
    const ttl = await redisService.ttl('session:abc123');
    logger.info(`Session TTL: ${ttl} seconds`);

    // Check if key exists
    const exists = await redisService.exists('user:name');
    logger.info(`Key exists: ${exists}`);

    // Delete key
    await redisService.del('user:name');
    logger.info('Key deleted');
  } catch (error) {
    logger.error('Basic operations error:', { error });
  }
}

/**
 * Example 2: Storing and Retrieving Objects
 */
export async function objectOperations() {
  logger.info('=== Object Operations ===');

  try {
    interface User {
      id: number;
      name: string;
      email: string;
      role: string;
    }

    const user: User = {
      id: 1,
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'admin',
    };

    // Store object with 1 hour TTL
    const userKey = RedisKeys.userProfile(user.id);
    await redisService.set(userKey, user, RedisTTL.LONG);
    logger.info(`User profile stored: ${userKey}`);

    // Retrieve object
    const retrievedUser = await redisService.get<User>(userKey);
    logger.info('Retrieved user:', retrievedUser);

    // Update expiration
    await redisService.expire(userKey, RedisTTL.DAY);
    logger.info('Extended expiration to 1 day');
  } catch (error) {
    logger.error('Object operations error:', { error });
  }
}

/**
 * Example 3: Counter Operations
 */
export async function counterOperations() {
  logger.info('=== Counter Operations ===');

  try {
    const counterKey = 'counter:page:views';

    // Increment counter
    await redisService.incr(counterKey);
    await redisService.incr(counterKey);
    await redisService.incrBy(counterKey, 10);

    const count = await redisService.get(counterKey);
    logger.info(`Page views: ${count}`);

    // Decrement counter
    await redisService.decrBy(counterKey, 5);
    const newCount = await redisService.get(counterKey);
    logger.info(`Page views after decrement: ${newCount}`);

    // Set expiration on counter (reset daily)
    await redisService.expire(counterKey, RedisTTL.DAY);
  } catch (error) {
    logger.error('Counter operations error:', { error });
  }
}

/**
 * Example 4: Hash Operations
 */
export async function hashOperations() {
  logger.info('=== Hash Operations ===');

  try {
    const userKey = 'user:hash:100';

    // Set hash fields
    await redisService.hset(userKey, 'name', 'Alice Johnson');
    await redisService.hset(userKey, 'email', 'alice@example.com');
    await redisService.hset(userKey, 'age', '30');

    // Get single field
    const name = await redisService.hget(userKey, 'name');
    logger.info(`User name: ${name}`);

    // Get all fields
    const userData = await redisService.hgetall(userKey);
    logger.info('All user data:', userData);

    // Delete specific field
    await redisService.hdel(userKey, 'age');
    logger.info('Age field deleted');

    // Set expiration on entire hash
    await redisService.expire(userKey, RedisTTL.LONG);
  } catch (error) {
    logger.error('Hash operations error:', { error });
  }
}

/**
 * Cached user type for example
 */
interface CachedUser {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

/**
 * Example 5: Caching Database Query Results
 */
export async function cacheQueryResults() {
  logger.info('=== Caching Query Results ===');

  try {
    const userId = 123;
    const cacheKey = RedisKeys.cache(`user:${userId}`);

    // Check cache first
    let user = await redisService.get<CachedUser>(cacheKey);

    if (user) {
      logger.info('User found in cache:', user);
    } else {
      logger.info('Cache miss - fetching from database...');

      // Simulate database query
      const dbUser: CachedUser = {
        id: userId,
        name: 'Bob Wilson',
        email: 'bob@example.com',
        createdAt: new Date().toISOString(),
      };

      // Store in cache with 5 minute TTL
      await redisService.set(cacheKey, dbUser, RedisTTL.MEDIUM);
      logger.info('User cached:', dbUser);

      user = dbUser;
    }

    return user;
  } catch (error) {
    logger.error('Cache query error:', { error });
    throw error;
  }
}

/**
 * Example 6: Session Management
 */
export async function sessionManagement() {
  logger.info('=== Session Management ===');

  try {
    const sessionToken = 'sess_abc123xyz';
    const sessionKey = RedisKeys.userSession(sessionToken);

    // Create session
    const sessionData = {
      userId: 456,
      username: 'testuser',
      loginTime: new Date().toISOString(),
      ipAddress: '192.168.1.1',
    };

    // Store session with 1 hour TTL
    await redisService.set(sessionKey, sessionData, RedisTTL.LONG);
    logger.info('Session created:', sessionData);

    // Validate session
    const session = await redisService.get(sessionKey);
    if (session) {
      logger.info('Session valid:', session);

      // Extend session
      await redisService.expire(sessionKey, RedisTTL.LONG);
      logger.info('Session extended');
    } else {
      logger.info('Session expired or invalid');
    }

    // Destroy session
    await redisService.del(sessionKey);
    logger.info('Session destroyed');
  } catch (error) {
    logger.error('Session management error:', { error });
  }
}

/**
 * Example 7: Rate Limiting Pattern
 */
export async function rateLimitingPattern() {
  logger.info('=== Rate Limiting Pattern ===');

  try {
    const clientIp = '192.168.1.100';
    const rateLimitKey = RedisKeys.rateLimit(clientIp);
    const maxRequests = 10;
    const windowSeconds = 60;

    // Increment request counter
    const requestCount = await redisService.incr(rateLimitKey);

    // Set expiration on first request
    if (requestCount === 1) {
      await redisService.expire(rateLimitKey, windowSeconds);
    }

    // Check if rate limit exceeded
    if (requestCount > maxRequests) {
      const ttl = await redisService.ttl(rateLimitKey);
      logger.warn(`Rate limit exceeded. Try again in ${ttl} seconds`);
      return false;
    }

    logger.info(`Request allowed (${requestCount}/${maxRequests})`);
    return true;
  } catch (error) {
    logger.error('Rate limiting error:', { error });
    // On error, allow the request (fail open)
    return true;
  }
}

/**
 * Example 8: Cache Invalidation Pattern
 */
export async function cacheInvalidationPattern() {
  logger.info('=== Cache Invalidation Pattern ===');

  try {
    const userId = 789;

    // Cache keys related to user
    const userProfileKey = RedisKeys.userProfile(userId);
    const userCacheKey = RedisKeys.cache(`user:${userId}`);
    const userSessionKey = RedisKeys.userSession(userId);

    // Invalidate all user-related cache
    const deleted = await redisService.del([
      userProfileKey,
      userCacheKey,
      userSessionKey,
    ]);

    logger.info(`Cache invalidated: ${deleted} key(s) deleted`);
  } catch (error) {
    logger.error('Cache invalidation error:', { error });
  }
}

/**
 * Example 9: Batch Operations
 */
export async function batchOperations() {
  logger.info('=== Batch Operations ===');

  try {
    // Store multiple keys
    const promises = [];
    for (let i = 1; i <= 5; i++) {
      promises.push(
        redisService.set(`batch:key:${i}`, `value-${i}`, RedisTTL.SHORT)
      );
    }
    await Promise.all(promises);
    logger.info('5 keys stored in batch');

    // Retrieve multiple keys
    const keys = await redisService.keys('batch:key:*');
    logger.info(`Found ${keys.length} keys:`, keys);

    // Delete all batch keys
    if (keys.length > 0) {
      const deleted = await redisService.del(keys);
      logger.info(`Deleted ${deleted} keys`);
    }
  } catch (error) {
    logger.error('Batch operations error:', { error });
  }
}

/**
 * Example 10: Health Check
 */
export async function healthCheck() {
  logger.info('=== Redis Health Check ===');

  try {
    // Check connection
    const isReady = redisService.isReady();
    logger.info(`Redis ready: ${isReady}`);

    // Ping Redis
    const pong = await redisService.ping();
    logger.info(`Ping response: ${pong}`);

    // Get server info
    const info = await redisService.info('server');
    logger.info('Redis server info:', info.split('\n')[1]); // First line after header

    return {
      status: 'healthy',
      connected: isReady,
      ping: pong,
    };
  } catch (error) {
    logger.error('Health check error:', { error });
    return {
      status: 'unhealthy',
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  logger.info('========================================');
  logger.info('Running Redis Examples');
  logger.info('========================================');

  await basicStringOperations();
  await objectOperations();
  await counterOperations();
  await hashOperations();
  await cacheQueryResults();
  await sessionManagement();
  await rateLimitingPattern();
  await cacheInvalidationPattern();
  await batchOperations();
  await healthCheck();

  logger.info('========================================');
  logger.info('All examples completed!');
  logger.info('========================================');
}

// Uncomment to run examples
// runAllExamples().catch(console.error);
