import Redis from 'ioredis';
import { redisConfig } from '../config/redis.config';
import logger from '../config/logger';

/**
 * Redis Service
 * Singleton class that manages Redis connection and operations
 */
class RedisService {
  private client: Redis | null = null;
  private isConnected: boolean = false;
  private isEnabled: boolean = false;

  constructor() {
    // Check if Redis is enabled via environment variable
    this.isEnabled = process.env.REDIS_ENABLED === 'true';

    if (this.isEnabled) {
      this.client = new Redis(redisConfig);
      this.setupEventHandlers();
      logger.info('Redis client initialization started');
    } else {
      logger.info('Redis is disabled via REDIS_ENABLED environment variable');
    }
  }

  /**
   * Setup Redis event handlers for connection monitoring
   */
  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.on('connect', () => {
      logger.info('Redis client connecting...');
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      logger.info('Redis client connected and ready', {
        host: redisConfig.host,
        port: redisConfig.port,
        db: redisConfig.db,
      });
    });

    this.client.on('error', (err: Error) => {
      logger.error('Redis client error:', { error: err.message, stack: err.stack });
      this.isConnected = false;
    });

    this.client.on('close', () => {
      logger.warn('Redis connection closed');
      this.isConnected = false;
    });

    this.client.on('reconnecting', (delay: number) => {
      logger.info(`Redis client reconnecting in ${delay}ms...`);
    });

    this.client.on('end', () => {
      logger.warn('Redis connection ended');
      this.isConnected = false;
    });
  }

  /**
   * Get the Redis client instance
   * Returns null if Redis is disabled
   */
  public getClient(): Redis | null {
    return this.client;
  }

  /**
   * Check if Redis is enabled
   */
  public isRedisEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Check if Redis is connected and ready
   * Returns false if Redis is disabled
   */
  public isReady(): boolean {
    if (!this.isEnabled || !this.client) {
      return false;
    }
    return this.isConnected && this.client.status === 'ready';
  }

  /**
   * SET operation with optional expiration (TTL in seconds)
   * @param key - Redis key
   * @param value - Value to store (string, number, or object)
   * @param ttl - Time to live in seconds (optional)
   */
  public async set(
    key: string,
    value: string | number | object,
    ttl?: number
  ): Promise<void> {
    if (!this.isEnabled || !this.client) {
      logger.warn('Redis SET operation skipped - Redis is disabled');
      return;
    }

    try {
      const stringValue = typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);

      if (ttl) {
        await this.client.setex(key, ttl, stringValue);
        logger.debug(`Redis SET with TTL: ${key} (expires in ${ttl}s)`);
      } else {
        await this.client.set(key, stringValue);
        logger.debug(`Redis SET: ${key}`);
      }
    } catch (error) {
      logger.error(`Redis SET error for key ${key}:`, { error });
      throw error;
    }
  }

  /**
   * GET operation
   * @param key - Redis key
   * @returns Parsed value or null if key doesn't exist
   */
  public async get<T = string>(key: string): Promise<T | null> {
    if (!this.isEnabled || !this.client) {
      logger.warn('Redis GET operation skipped - Redis is disabled');
      return null;
    }

    try {
      const value = await this.client.get(key);

      if (value === null) {
        logger.debug(`Redis GET: ${key} (not found)`);
        return null;
      }

      // Try to parse JSON, fallback to string
      try {
        const parsed = JSON.parse(value) as T;
        logger.debug(`Redis GET: ${key} (found, parsed as JSON)`);
        return parsed;
      } catch {
        logger.debug(`Redis GET: ${key} (found, returned as string)`);
        return value as T;
      }
    } catch (error) {
      logger.error(`Redis GET error for key ${key}:`, { error });
      throw error;
    }
  }

  /**
   * DELETE operation
   * @param key - Redis key or array of keys
   * @returns Number of keys deleted
   */
  public async del(key: string | string[]): Promise<number> {
    if (!this.isEnabled || !this.client) {
      logger.warn('Redis DEL operation skipped - Redis is disabled');
      return 0;
    }

    try {
      const keys = Array.isArray(key) ? key : [key];
      const result = await this.client.del(...keys);
      logger.debug(`Redis DEL: ${keys.join(', ')} (deleted ${result} key(s))`);
      return result;
    } catch (error) {
      logger.error(`Redis DEL error for key(s) ${key}:`, { error });
      throw error;
    }
  }

  /**
   * SET EXPIRE (TTL in seconds)
   * @param key - Redis key
   * @param seconds - Time to live in seconds
   * @returns true if timeout was set, false if key doesn't exist
   */
  public async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.isEnabled || !this.client) {
      logger.warn('Redis EXPIRE operation skipped - Redis is disabled');
      return false;
    }

    try {
      const result = await this.client.expire(key, seconds);
      logger.debug(`Redis EXPIRE: ${key} (${seconds}s, result: ${result === 1})`);
      return result === 1;
    } catch (error) {
      logger.error(`Redis EXPIRE error for key ${key}:`, { error });
      throw error;
    }
  }

  /**
   * GET TTL
   * @param key - Redis key
   * @returns TTL in seconds (-1 if no expiration, -2 if key doesn't exist)
   */
  public async ttl(key: string): Promise<number> {
    if (!this.isEnabled || !this.client) {
      logger.warn('Redis TTL operation skipped - Redis is disabled');
      return -2;
    }

    try {
      const ttl = await this.client.ttl(key);
      logger.debug(`Redis TTL: ${key} (${ttl}s)`);
      return ttl;
    } catch (error) {
      logger.error(`Redis TTL error for key ${key}:`, { error });
      throw error;
    }
  }

  /**
   * Check if key exists
   * @param key - Redis key
   * @returns true if key exists, false otherwise
   */
  public async exists(key: string): Promise<boolean> {
    if (!this.isEnabled || !this.client) {
      logger.warn('Redis EXISTS operation skipped - Redis is disabled');
      return false;
    }

    try {
      const result = await this.client.exists(key);
      logger.debug(`Redis EXISTS: ${key} (${result === 1})`);
      return result === 1;
    } catch (error) {
      logger.error(`Redis EXISTS error for key ${key}:`, { error });
      throw error;
    }
  }

  /**
   * Increment value by 1
   * @param key - Redis key
   * @returns New value after increment
   */
  public async incr(key: string): Promise<number> {
    if (!this.isEnabled || !this.client) {
      logger.warn('Redis INCR operation skipped - Redis is disabled');
      return 0;
    }

    try {
      const result = await this.client.incr(key);
      logger.debug(`Redis INCR: ${key} (new value: ${result})`);
      return result;
    } catch (error) {
      logger.error(`Redis INCR error for key ${key}:`, { error });
      throw error;
    }
  }

  /**
   * Increment by specific amount
   * @param key - Redis key
   * @param increment - Amount to increment
   * @returns New value after increment
   */
  public async incrBy(key: string, increment: number): Promise<number> {
    if (!this.isEnabled || !this.client) {
      logger.warn('Redis INCRBY operation skipped - Redis is disabled');
      return 0;
    }

    try {
      const result = await this.client.incrby(key, increment);
      logger.debug(`Redis INCRBY: ${key} by ${increment} (new value: ${result})`);
      return result;
    } catch (error) {
      logger.error(`Redis INCRBY error for key ${key}:`, { error });
      throw error;
    }
  }

  /**
   * Decrement value by 1
   * @param key - Redis key
   * @returns New value after decrement
   */
  public async decr(key: string): Promise<number> {
    if (!this.isEnabled || !this.client) {
      logger.warn('Redis DECR operation skipped - Redis is disabled');
      return 0;
    }

    try {
      const result = await this.client.decr(key);
      logger.debug(`Redis DECR: ${key} (new value: ${result})`);
      return result;
    } catch (error) {
      logger.error(`Redis DECR error for key ${key}:`, { error });
      throw error;
    }
  }

  /**
   * Decrement by specific amount
   * @param key - Redis key
   * @param decrement - Amount to decrement
   * @returns New value after decrement
   */
  public async decrBy(key: string, decrement: number): Promise<number> {
    if (!this.isEnabled || !this.client) {
      logger.warn('Redis DECRBY operation skipped - Redis is disabled');
      return 0;
    }

    try {
      const result = await this.client.decrby(key, decrement);
      logger.debug(`Redis DECRBY: ${key} by ${decrement} (new value: ${result})`);
      return result;
    } catch (error) {
      logger.error(`Redis DECRBY error for key ${key}:`, { error });
      throw error;
    }
  }

  /**
   * Hash SET operation
   * @param key - Redis key
   * @param field - Hash field
   * @param value - Value to store
   * @returns Number of fields added
   */
  public async hset(key: string, field: string, value: string): Promise<number> {
    if (!this.isEnabled || !this.client) {
      logger.warn('Redis HSET operation skipped - Redis is disabled');
      return 0;
    }

    try {
      const result = await this.client.hset(key, field, value);
      logger.debug(`Redis HSET: ${key}.${field}`);
      return result;
    } catch (error) {
      logger.error(`Redis HSET error for key ${key}:`, { error });
      throw error;
    }
  }

  /**
   * Hash GET operation
   * @param key - Redis key
   * @param field - Hash field
   * @returns Field value or null
   */
  public async hget(key: string, field: string): Promise<string | null> {
    if (!this.isEnabled || !this.client) {
      logger.warn('Redis HGET operation skipped - Redis is disabled');
      return null;
    }

    try {
      const result = await this.client.hget(key, field);
      logger.debug(`Redis HGET: ${key}.${field} (${result ? 'found' : 'not found'})`);
      return result;
    } catch (error) {
      logger.error(`Redis HGET error for key ${key}:`, { error });
      throw error;
    }
  }

  /**
   * Hash GET ALL operation
   * @param key - Redis key
   * @returns All fields and values
   */
  public async hgetall(key: string): Promise<Record<string, string>> {
    if (!this.isEnabled || !this.client) {
      logger.warn('Redis HGETALL operation skipped - Redis is disabled');
      return {};
    }

    try {
      const result = await this.client.hgetall(key);
      logger.debug(`Redis HGETALL: ${key} (${Object.keys(result).length} fields)`);
      return result;
    } catch (error) {
      logger.error(`Redis HGETALL error for key ${key}:`, { error });
      throw error;
    }
  }

  /**
   * Hash DELETE operation
   * @param key - Redis key
   * @param field - Hash field(s) to delete
   * @returns Number of fields deleted
   */
  public async hdel(key: string, ...field: string[]): Promise<number> {
    if (!this.isEnabled || !this.client) {
      logger.warn('Redis HDEL operation skipped - Redis is disabled');
      return 0;
    }

    try {
      const result = await this.client.hdel(key, ...field);
      logger.debug(`Redis HDEL: ${key} (deleted ${result} field(s))`);
      return result;
    } catch (error) {
      logger.error(`Redis HDEL error for key ${key}:`, { error });
      throw error;
    }
  }

  /**
   * Get keys matching pattern
   * WARNING: Use with caution in production (can be slow with many keys)
   * @param pattern - Key pattern (e.g., "user:*")
   * @returns Array of matching keys
   */
  public async keys(pattern: string): Promise<string[]> {
    if (!this.isEnabled || !this.client) {
      logger.warn('Redis KEYS operation skipped - Redis is disabled');
      return [];
    }

    try {
      const keys = await this.client.keys(pattern);
      logger.debug(`Redis KEYS: ${pattern} (found ${keys.length} key(s))`);
      return keys;
    } catch (error) {
      logger.error(`Redis KEYS error for pattern ${pattern}:`, { error });
      throw error;
    }
  }

  /**
   * Flush all data from current database
   * USE WITH EXTREME CAUTION!
   */
  public async flushDb(): Promise<void> {
    if (!this.isEnabled || !this.client) {
      logger.warn('Redis FLUSHDB operation skipped - Redis is disabled');
      return;
    }

    try {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Cannot flush Redis in production');
      }
      await this.client.flushdb();
      logger.warn('Redis FLUSHDB: All keys deleted from current database');
    } catch (error) {
      logger.error('Redis FLUSHDB error:', { error });
      throw error;
    }
  }

  /**
   * Flush all data from all databases
   * USE WITH EXTREME CAUTION!
   */
  public async flushAll(): Promise<void> {
    if (!this.isEnabled || !this.client) {
      logger.warn('Redis FLUSHALL operation skipped - Redis is disabled');
      return;
    }

    try {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Cannot flush Redis in production');
      }
      await this.client.flushall();
      logger.warn('Redis FLUSHALL: All keys deleted from all databases');
    } catch (error) {
      logger.error('Redis FLUSHALL error:', { error });
      throw error;
    }
  }

  /**
   * Ping Redis server
   * @returns PONG string
   */
  public async ping(): Promise<string> {
    if (!this.isEnabled || !this.client) {
      logger.warn('Redis PING operation skipped - Redis is disabled');
      throw new Error('Redis is disabled');
    }

    try {
      const result = await this.client.ping();
      logger.debug('Redis PING: PONG');
      return result;
    } catch (error) {
      logger.error('Redis PING error:', { error });
      throw error;
    }
  }

  /**
   * Get Redis server info
   * @param section - Optional info section
   * @returns Redis server information
   */
  public async info(section?: string): Promise<string> {
    if (!this.isEnabled || !this.client) {
      logger.warn('Redis INFO operation skipped - Redis is disabled');
      throw new Error('Redis is disabled');
    }

    try {
      const result = section ? await this.client.info(section) : await this.client.info();
      logger.debug(`Redis INFO: ${section || 'all'}`);
      return result;
    } catch (error) {
      logger.error('Redis INFO error:', { error });
      throw error;
    }
  }

  /**
   * Graceful shutdown - close Redis connection
   */
  public async disconnect(): Promise<void> {
    if (!this.isEnabled || !this.client) {
      logger.info('Redis disconnect skipped - Redis is disabled');
      return;
    }

    try {
      await this.client.quit();
      logger.info('Redis client disconnected gracefully');
    } catch (error) {
      logger.error('Redis disconnect error:', { error });
      // Force disconnect if graceful quit fails
      this.client.disconnect();
    }
  }
}

// Export singleton instance
export default new RedisService();
