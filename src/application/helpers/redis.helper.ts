import { logger } from '@config/logger';
import { redisConfig, redisClusterConfig, isClusterMode, getClusterNodes } from '@config/redis';
import Redis, { Cluster } from 'ioredis';

/**
 * Redis Service
 * Singleton class that manages Redis connection and operations
 * Supports both standalone and cluster modes
 */
class RedisService {
  private client: Redis | Cluster | null = null;
  private isConnected = false;
  private isEnabled = false;
  private clusterMode = false;

  constructor() {
    this.isEnabled = process.env.REDIS_ENABLED === 'true';

    if (!this.isEnabled) {
      logger?.info('Redis is disabled via REDIS_ENABLED environment variable');
      return;
    }

    this.clusterMode = isClusterMode();

    try {
      if (this.clusterMode) {
        const clusterNodes = getClusterNodes();
        this.client = new Redis.Cluster(clusterNodes, redisClusterConfig);
        logger?.info('Redis Cluster client initialization started', {
          nodes: clusterNodes,
          nodeCount: clusterNodes.length,
        });
      } else {
        this.client = new Redis(redisConfig);
        logger?.info('Redis standalone client initialization started', {
          host: redisConfig.host,
          port: redisConfig.port,
        });
      }

      this.setupEventHandlers();
      this.bindProcessEvents();
    } catch (err) {
      logger?.error('Failed to initialize Redis client:', err);
      this.client = null;
      this.isEnabled = false;
    }
  }

  /**
   * Setup Redis event handlers for connection monitoring
   */
  private setupEventHandlers(): void {
    if (!this.client) return;

    // CONNECT/READY/ERROR/CLOSE/END/RECONNECTING
    this.client.on('connect', () => {
      logger?.info(`Redis ${this.clusterMode ? 'cluster' : 'standalone'} client connecting...`);
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      if (this.clusterMode) {
        const nodesCount = (() => {
          try {
            const cluster = this.client as Cluster;
            return cluster?.nodes ? cluster.nodes('master').length : undefined;
          } catch {
            return undefined;
          }
        })();

        logger?.info('Redis Cluster client connected and ready', {
          mode: 'cluster',
          nodes: nodesCount,
        });
      } else {
        logger?.info('Redis client connected and ready', {
          mode: 'standalone',
          host: redisConfig.host,
          port: redisConfig.port,
          db: redisConfig.db,
        });
      }
    });

    this.client.on('error', (err: Error) => {
      logger?.error(`Redis ${this.clusterMode ? 'cluster' : 'standalone'} client error:`, {
        error: err.message,
        stack: err.stack,
      });
      this.isConnected = false;
    });

    this.client.on('close', () => {
      logger?.warn(`Redis ${this.clusterMode ? 'cluster' : 'standalone'} connection closed`);
      this.isConnected = false;
    });

    this.client.on('reconnecting', (delay: number) => {
      logger?.info(
        `Redis ${this.clusterMode ? 'cluster' : 'standalone'} client reconnecting in ${delay}ms...`
      );
    });

    this.client.on('end', () => {
      logger?.warn(`Redis ${this.clusterMode ? 'cluster' : 'standalone'} connection ended`);
      this.isConnected = false;
    });

    // Cluster-specific events — guard with clusterMode and runtime cast
    if (this.clusterMode) {
      try {
        const cluster = this.client as Cluster;

        // node error
        cluster.on('node error', (err: Error, address: string) => {
          logger?.error('Redis Cluster node error:', {
            error: err.message,
            address,
          });
        });

        // +node / -node events
        cluster.on('+node', (node: any) => {
          // node.options may be undefined in some versions; guard it
          const host = node?.options?.host;
          const port = node?.options?.port;
          logger?.info('Redis Cluster node added:', { host, port });
        });

        cluster.on('-node', (node: any) => {
          const host = node?.options?.host;
          const port = node?.options?.port;
          logger?.info('Redis Cluster node removed:', { host, port });
        });
      } catch (err) {
        logger?.warn('Failed to attach cluster-specific events (non-fatal):', err);
      }
    }
  }

  /**
   * Hook process exit signals to gracefully shutdown redis
   */
  private bindProcessEvents(): void {
    const cleanup = async () => {
      try {
        await this.disconnect();
      } catch (err) {
        // ignore
      }
      // don't call process.exit here — leave to the app
    };

    // best-effort; do not crash on missing process in tests
    if (typeof process !== 'undefined' && process && process.on) {
      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);
      // optional: unhandledRejection/uncaughtException handlers can also disconnect
    }
  }

  public getClient(): Redis | Cluster | null {
    return this.client;
  }

  public isClusterMode(): boolean {
    return this.clusterMode;
  }

  public isRedisEnabled(): boolean {
    return this.isEnabled;
  }

  public isReady(): boolean {
    if (!this.isEnabled || !this.client) return false;
    try {
      // Both Redis and Cluster have status property in ioredis
      // but guard access just in case
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c: any = this.client as any;
      return this.isConnected && c?.status === 'ready';
    } catch {
      return this.isConnected;
    }
  }

  /**
   * Safe stringify with fallback
   */
  private safeStringify(value: unknown): string {
    try {
      if (typeof value === 'string') return value;
      return JSON.stringify(value);
    } catch (err) {
      logger?.warn('Failed to stringify value for redis; falling back to String()', { err });
      try {
        return String(value);
      } catch {
        return '';
      }
    }
  }

  public async set(key: string, value: string | number | object, ttl?: number): Promise<void> {
    if (!this.isEnabled || !this.client) {
      logger?.warn('Redis SET operation skipped - Redis is disabled');
      return;
    }

    try {
      const stringValue = this.safeStringify(value);

      if (typeof ttl === 'number' && ttl > 0) {
        // use SET with EX for atomic set+ttl; fall back to setex when unavailable
        // most ioredis versions support .set(key, value, 'EX', ttl)
        // but keep compatibility
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const c: any = this.client as any;
        if (typeof c.set === 'function') {
          await c.set(key, stringValue, 'EX', ttl);
        } else {
          await c.setex(key, ttl, stringValue);
        }
        logger?.debug(`Redis SET with TTL: ${key} (expires in ${ttl}s)`);
      } else {
        await (this.client as Redis).set(key, stringValue);
        logger?.debug(`Redis SET: ${key}`);
      }
    } catch (error) {
      logger?.error(`Redis SET error for key ${key}:`, { error });
      throw error;
    }
  }

  public async get<T = string>(key: string): Promise<T | null> {
    if (!this.isEnabled || !this.client) {
      logger?.warn('Redis GET operation skipped - Redis is disabled');
      return null;
    }

    try {
      const value = await (this.client as Redis).get(key);

      if (value === null) {
        logger?.debug(`Redis GET: ${key} (not found)`);
        return null;
      }

      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (error) {
      logger?.error(`Redis GET error for key ${key}:`, { error });
      throw error;
    }
  }

  public async del(key: string | string[]): Promise<number> {
    if (!this.isEnabled || !this.client) {
      logger?.warn('Redis DEL operation skipped - Redis is disabled');
      return 0;
    }

    try {
      const keys = Array.isArray(key) ? key.filter(Boolean) : [key];
      if (!keys.length) return 0;

      // ioredis accepts multiple keys; for cluster mode this will route calls appropriately
      const result = await (this.client as Redis).del(...keys);
      logger?.debug(`Redis DEL: ${keys.join(', ')} (deleted ${result} key(s))`);
      return result;
    } catch (error) {
      logger?.error(`Redis DEL error for key(s) ${Array.isArray(key) ? key.join(',') : key}:`, { error });
      throw error;
    }
  }

  public async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.isEnabled || !this.client) {
      logger?.warn('Redis EXPIRE operation skipped - Redis is disabled');
      return false;
    }

    try {
      const result = await (this.client as Redis).expire(key, seconds);
      logger?.debug(`Redis EXPIRE: ${key} (${seconds}s, result: ${result === 1})`);
      return result === 1;
    } catch (error) {
      logger?.error(`Redis EXPIRE error for key ${key}:`, { error });
      throw error;
    }
  }

  public async ttl(key: string): Promise<number> {
    if (!this.isEnabled || !this.client) {
      logger?.warn('Redis TTL operation skipped - Redis is disabled');
      return -2;
    }

    try {
      const ttl = await (this.client as Redis).ttl(key);
      logger?.debug(`Redis TTL: ${key} (${ttl}s)`);
      return ttl;
    } catch (error) {
      logger?.error(`Redis TTL error for key ${key}:`, { error });
      throw error;
    }
  }

  public async exists(key: string): Promise<boolean> {
    if (!this.isEnabled || !this.client) {
      logger?.warn('Redis EXISTS operation skipped - Redis is disabled');
      return false;
    }

    try {
      const result = await (this.client as Redis).exists(key);
      logger?.debug(`Redis EXISTS: ${key} (${result === 1})`);
      return result === 1;
    } catch (error) {
      logger?.error(`Redis EXISTS error for key ${key}:`, { error });
      throw error;
    }
  }

  public async incr(key: string): Promise<number> {
    if (!this.isEnabled || !this.client) {
      logger?.warn('Redis INCR operation skipped - Redis is disabled');
      return 0;
    }

    try {
      const result = await (this.client as Redis).incr(key);
      logger?.debug(`Redis INCR: ${key} (new value: ${result})`);
      return result;
    } catch (error) {
      logger?.error(`Redis INCR error for key ${key}:`, { error });
      throw error;
    }
  }

  public async incrBy(key: string, increment: number): Promise<number> {
    if (!this.isEnabled || !this.client) {
      logger?.warn('Redis INCRBY operation skipped - Redis is disabled');
      return 0;
    }

    try {
      const result = await (this.client as Redis).incrby(key, increment);
      logger?.debug(`Redis INCRBY: ${key} by ${increment} (new value: ${result})`);
      return result;
    } catch (error) {
      logger?.error(`Redis INCRBY error for key ${key}:`, { error });
      throw error;
    }
  }

  public async decr(key: string): Promise<number> {
    if (!this.isEnabled || !this.client) {
      logger?.warn('Redis DECR operation skipped - Redis is disabled');
      return 0;
    }

    try {
      const result = await (this.client as Redis).decr(key);
      logger?.debug(`Redis DECR: ${key} (new value: ${result})`);
      return result;
    } catch (error) {
      logger?.error(`Redis DECR error for key ${key}:`, { error });
      throw error;
    }
  }

  public async decrBy(key: string, decrement: number): Promise<number> {
    if (!this.isEnabled || !this.client) {
      logger?.warn('Redis DECRBY operation skipped - Redis is disabled');
      return 0;
    }

    try {
      const result = await (this.client as Redis).decrby(key, decrement);
      logger?.debug(`Redis DECRBY: ${key} by ${decrement} (new value: ${result})`);
      return result;
    } catch (error) {
      logger?.error(`Redis DECRBY error for key ${key}:`, { error });
      throw error;
    }
  }

  public async hset(key: string, field: string, value: string): Promise<number> {
    if (!this.isEnabled || !this.client) {
      logger?.warn('Redis HSET operation skipped - Redis is disabled');
      return 0;
    }

    try {
      const result = await (this.client as Redis).hset(key, field, value);
      logger?.debug(`Redis HSET: ${key}.${field}`);
      return result;
    } catch (error) {
      logger?.error(`Redis HSET error for key ${key}:`, { error });
      throw error;
    }
  }

  public async hget(key: string, field: string): Promise<string | null> {
    if (!this.isEnabled || !this.client) {
      logger?.warn('Redis HGET operation skipped - Redis is disabled');
      return null;
    }

    try {
      const result = await (this.client as Redis).hget(key, field);
      logger?.debug(`Redis HGET: ${key}.${field} (${result ? 'found' : 'not found'})`);
      return result;
    } catch (error) {
      logger?.error(`Redis HGET error for key ${key}:`, { error });
      throw error;
    }
  }

  public async hgetall(key: string): Promise<Record<string, string>> {
    if (!this.isEnabled || !this.client) {
      logger?.warn('Redis HGETALL operation skipped - Redis is disabled');
      return {};
    }

    try {
      const result = await (this.client as Redis).hgetall(key);
      logger?.debug(`Redis HGETALL: ${key} (${Object.keys(result).length} fields)`);
      return result;
    } catch (error) {
      logger?.error(`Redis HGETALL error for key ${key}:`, { error });
      throw error;
    }
  }

  public async hdel(key: string, ...field: string[]): Promise<number> {
    if (!this.isEnabled || !this.client) {
      logger?.warn('Redis HDEL operation skipped - Redis is disabled');
      return 0;
    }

    try {
      if (!field.length) return 0;
      const result = await (this.client as Redis).hdel(key, ...field);
      logger?.debug(`Redis HDEL: ${key} (deleted ${result} field(s))`);
      return result;
    } catch (error) {
      logger?.error(`Redis HDEL error for key ${key}:`, { error });
      throw error;
    }
  }

  public async keys(pattern: string): Promise<string[]> {
    if (!this.isEnabled || !this.client) {
      logger?.warn('Redis KEYS operation skipped - Redis is disabled');
      return [];
    }

    try {
      const result = await (this.client as Redis).keys(pattern);
      logger?.debug(`Redis KEYS: ${pattern} (found ${result.length} key(s))`);
      return result;
    } catch (error) {
      logger?.error(`Redis KEYS error for pattern ${pattern}:`, { error });
      throw error;
    }
  }

  /**
   * Scan keys matching pattern (better for cluster mode and large datasets)
   */
  public async scan(pattern: string, count = 100): Promise<string[]> {
    if (!this.isEnabled || !this.client) {
      logger?.warn('Redis SCAN operation skipped - Redis is disabled');
      return [];
    }

    try {
      const keys: string[] = [];

      if (this.clusterMode) {
        const cluster = this.client as Cluster;
        const masters = cluster.nodes('master') || [];

        if (!masters.length) {
          logger?.warn('Redis SCAN (cluster) found no master nodes');
        }

        for (const node of masters) {
          let cursor = '0';
          do {
            const res = await node.scan(cursor, 'MATCH', pattern, 'COUNT', String(count));
            cursor = res[0];
            if (Array.isArray(res[1]) && res[1].length) keys.push(...res[1]);
          } while (cursor !== '0');
        }
      } else {
        let cursor = '0';
        const client = this.client as Redis;
        do {
          const res = await client.scan(cursor, 'MATCH', pattern, 'COUNT', String(count));
          cursor = res[0];
          if (Array.isArray(res[1]) && res[1].length) keys.push(...res[1]);
        } while (cursor !== '0');
      }

      const unique = [...new Set(keys)];
      logger?.debug(`Redis SCAN${this.clusterMode ? ' (cluster)' : ''}: ${pattern} (found ${unique.length} unique key(s))`);
      return unique;
    } catch (error) {
      logger?.error(`Redis SCAN error for pattern ${pattern}:`, { error });
      logger?.warn('Falling back to KEYS command for scan');
      return this.keys(pattern);
    }
  }

  /**
   * Flush operations - protected in production
   * Use env FORCE_FLUSH=true to allow in non-production CI scenarios (explicit opt-in)
   */
  public async flushDb(): Promise<void> {
    if (!this.isEnabled || !this.client) {
      logger?.warn('Redis FLUSHDB operation skipped - Redis is disabled');
      return;
    }

    try {
      if (process.env.NODE_ENV === 'production' && process.env.FORCE_FLUSH !== 'true') {
        throw new Error('Cannot flush Redis in production');
      }
      await (this.client as Redis).flushdb();
      logger?.warn('Redis FLUSHDB: All keys deleted from current database');
    } catch (error) {
      logger?.error('Redis FLUSHDB error:', { error });
      throw error;
    }
  }

  public async flushAll(): Promise<void> {
    if (!this.isEnabled || !this.client) {
      logger?.warn('Redis FLUSHALL operation skipped - Redis is disabled');
      return;
    }

    try {
      if (process.env.NODE_ENV === 'production' && process.env.FORCE_FLUSH !== 'true') {
        throw new Error('Cannot flush Redis in production');
      }
      await (this.client as Redis).flushall();
      logger?.warn('Redis FLUSHALL: All keys deleted from all databases');
    } catch (error) {
      logger?.error('Redis FLUSHALL error:', { error });
      throw error;
    }
  }

  public async ping(): Promise<string> {
    if (!this.isEnabled || !this.client) {
      logger?.warn('Redis PING operation skipped - Redis is disabled');
      throw new Error('Redis is disabled');
    }

    try {
      const result = await (this.client as Redis).ping();
      logger?.debug('Redis PING: PONG');
      return result;
    } catch (error) {
      logger?.error('Redis PING error:', { error });
      throw error;
    }
  }

  public async info(section?: string): Promise<string> {
    if (!this.isEnabled || !this.client) {
      logger?.warn('Redis INFO operation skipped - Redis is disabled');
      throw new Error('Redis is disabled');
    }

    try {
      const result = section ? await (this.client as Redis).info(section) : await (this.client as Redis).info();
      logger?.debug(`Redis INFO: ${section || 'all'}`);
      return result;
    } catch (error) {
      logger?.error('Redis INFO error:', { error });
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.isEnabled || !this.client) {
      logger?.info('Redis disconnect skipped - Redis is disabled');
      return;
    }

    try {
      // prefer graceful quit when available
      // cast to any because cluster/redis have different method signatures across versions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const c: any = this.client as any;
      if (typeof c.quit === 'function') {
        await c.quit();
        logger?.info('Redis client disconnected gracefully');
      } else if (typeof c.disconnect === 'function') {
        c.disconnect();
        logger?.info('Redis client disconnected (force)');
      } else {
        logger?.warn('Redis client has no quit/disconnect method; skipping disconnect');
      }
    } catch (error) {
      logger?.error('Redis disconnect error:', { error });
      // attempt force disconnect
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.client as any).disconnect?.();
      } catch {
        // swallow
      }
    } finally {
      this.isConnected = false;
      this.client = null;
    }
  }
}

// Export singleton instance
export default new RedisService();
