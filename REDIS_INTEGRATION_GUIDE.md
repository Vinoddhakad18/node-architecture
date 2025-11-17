# Redis Integration Guide

This guide provides complete instructions for using Redis with ioredis in your Node.js TypeScript project.

## Table of Contents

1. [Installation](#installation)
2. [Configuration](#configuration)
3. [Usage](#usage)
4. [Middleware](#middleware)
5. [Production Best Practices](#production-best-practices)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## Installation

### Step 1: Start Redis

#### Option A: Using Docker Compose (Recommended)

The Redis service is already configured in your `docker-compose.yml`. Start it with:

```bash
# Start all services including Redis
docker-compose up -d

# Or start only Redis
docker-compose up -d redis

# Check Redis logs
docker-compose logs -f redis

# Test Redis connection
docker-compose exec redis redis-cli ping
# Should return: PONG
```

#### Option B: Local Installation

**Windows:**
```bash
# Install via WSL2 (recommended)
wsl --install
# Then follow Linux instructions inside WSL

# Or download Windows installer
# https://github.com/microsoftarchive/redis/releases
```

**macOS:**
```bash
brew install redis
brew services start redis
redis-cli ping
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
redis-cli ping
```

### Step 2: Packages Already Installed

The following packages have been installed:
- `ioredis` - Redis client for Node.js
- `@types/ioredis` - TypeScript definitions

---

## Configuration

### Environment Variables

Your `.env` file has been configured with:

```env
# Redis Configuration
REDIS_HOST=localhost                  # Use 'redis' for Docker Compose
REDIS_PORT=6379
REDIS_PASSWORD=redispassword
REDIS_DB=0
REDIS_KEY_PREFIX=nodeapp:
REDIS_CONNECT_TIMEOUT=10000
REDIS_MAX_RETRIES_PER_REQUEST=3
```

**Important:**
- For **local development**: Use `REDIS_HOST=localhost`
- For **Docker Compose**: Use `REDIS_HOST=redis`

### Configuration File

Location: `src/application/config/redis.config.ts`

This file includes:
- Connection settings
- Retry strategy with exponential backoff
- Reconnection logic
- TTL constants
- Key naming patterns

```typescript
// Import configuration
import { redisConfig, RedisTTL, RedisKeys } from './config/redis.config';
```

---

## Usage

### Basic Redis Service

The Redis service is available as a singleton instance.

#### Import the Service

```typescript
import redisService from './application/helpers/redis.helper';
```

#### Basic Operations

**1. SET and GET**

```typescript
// Simple string
await redisService.set('key', 'value');
const value = await redisService.get('key');

// With expiration (TTL in seconds)
await redisService.set('key', 'value', 300); // Expires in 5 minutes

// Store objects (automatically serialized)
const user = { id: 1, name: 'John', email: 'john@example.com' };
await redisService.set('user:1', user, RedisTTL.LONG);

// Retrieve objects (automatically deserialized)
const retrievedUser = await redisService.get<typeof user>('user:1');
```

**2. DELETE**

```typescript
// Delete single key
await redisService.del('key');

// Delete multiple keys
await redisService.del(['key1', 'key2', 'key3']);
```

**3. EXPIRE and TTL**

```typescript
// Set expiration on existing key
await redisService.expire('key', 3600); // 1 hour

// Get remaining TTL
const ttl = await redisService.ttl('key');
// Returns: seconds remaining, -1 (no expiration), or -2 (key doesn't exist)
```

**4. EXISTS**

```typescript
const exists = await redisService.exists('key');
// Returns: true or false
```

**5. Counter Operations**

```typescript
// Increment
await redisService.incr('counter');
await redisService.incrBy('counter', 10);

// Decrement
await redisService.decr('counter');
await redisService.decrBy('counter', 5);
```

**6. Hash Operations**

```typescript
// Set hash fields
await redisService.hset('user:100', 'name', 'Alice');
await redisService.hset('user:100', 'email', 'alice@example.com');

// Get single field
const name = await redisService.hget('user:100', 'name');

// Get all fields
const userData = await redisService.hgetall('user:100');

// Delete field
await redisService.hdel('user:100', 'email');
```

**7. Health Check**

```typescript
// Check if Redis is ready
const isReady = redisService.isReady();

// Ping Redis
const pong = await redisService.ping(); // Returns "PONG"

// Get server info
const info = await redisService.info('server');
```

### Using Key Patterns

```typescript
import { RedisKeys, RedisTTL } from './config/redis.config';

// Store user profile
const userId = 123;
await redisService.set(
  RedisKeys.userProfile(userId),
  { name: 'John', email: 'john@example.com' },
  RedisTTL.LONG
);

// Store cache
await redisService.set(
  RedisKeys.cache('products'),
  productsData,
  RedisTTL.MEDIUM
);

// Rate limiting key
const rateLimitKey = RedisKeys.rateLimit(req.ip);
await redisService.incr(rateLimitKey);
```

### Examples File

Complete examples are available in: `src/application/services/redis.examples.ts`

To run examples:
```typescript
import { runAllExamples } from './application/services/redis.examples';

// Run all examples
await runAllExamples();

// Or run specific examples
import { basicStringOperations, cacheQueryResults } from './application/services/redis.examples';
await basicStringOperations();
await cacheQueryResults();
```

---

## Middleware

### 1. Cache Middleware

Automatically cache GET request responses.

#### Basic Usage

```typescript
import { cacheMiddleware } from './application/middleware/cache.middleware';

// Cache for 5 minutes (default)
app.get('/api/users', cacheMiddleware(), getUsersController);

// Custom TTL
app.get('/api/products', cacheMiddleware({ ttl: 600 }), getProductsController);

// Custom key prefix
app.get('/api/posts', cacheMiddleware({
  ttl: 300,
  keyPrefix: 'posts'
}), getPostsController);

// Custom key generator
app.get('/api/user/:id', cacheMiddleware({
  keyGenerator: (req) => `user:${req.params.id}`
}), getUserController);

// Conditional caching
app.get('/api/data', cacheMiddleware({
  condition: (req) => !req.headers['x-no-cache']
}), getDataController);
```

#### Cache Invalidation

```typescript
import {
  invalidateCacheMiddleware,
  clearCache,
  clearCachePattern
} from './application/middleware/cache.middleware';

// Invalidate cache after POST/PUT/DELETE
app.post('/api/users',
  invalidateCacheMiddleware({ pattern: '/api/users*' }),
  createUserController
);

// Programmatic cache invalidation
await clearCache('/api/users');
await clearCachePattern('/api/users*');
```

### 2. Rate Limiting Middleware

Redis-based rate limiting with sliding window.

#### Basic Usage

```typescript
import {
  redisRateLimitMiddleware,
  RateLimiters
} from './application/middleware/redisRateLimit.middleware';

// Basic rate limit - 100 requests per minute
app.use('/api', redisRateLimitMiddleware({
  windowMs: 60000,
  max: 100
}));

// Strict rate limit for login
app.post('/api/auth/login', redisRateLimitMiddleware({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many login attempts'
}), loginController);

// Custom key generator (by user ID)
app.use('/api/user', redisRateLimitMiddleware({
  windowMs: 60000,
  max: 50,
  keyGenerator: (req) => req.user?.id || req.ip
}));

// Skip rate limiting for certain requests
app.use('/api', redisRateLimitMiddleware({
  windowMs: 60000,
  max: 100,
  skip: (req) => req.user?.role === 'admin'
}));
```

#### Preset Rate Limiters

```typescript
// Strict (5 requests per 15 minutes)
app.post('/api/auth/register', RateLimiters.strict(), registerController);

// Moderate (100 requests per minute)
app.use('/api', RateLimiters.moderate());

// Relaxed (1000 requests per hour)
app.get('/api/public', RateLimiters.relaxed(), publicController);

// Very strict (3 requests per hour)
app.post('/api/admin/critical', RateLimiters.veryStrict(), criticalController);
```

#### Utility Functions

```typescript
import {
  resetRateLimit,
  getRateLimitStatus
} from './application/middleware/redisRateLimit.middleware';

// Reset rate limit for user
await resetRateLimit(userId);

// Get rate limit status
const status = await getRateLimitStatus(userId);
console.log(status);
// { current: 15, ttl: 45, resetAt: Date }
```

---

## Production Best Practices

### 1. Connection Pooling

Your configuration already includes optimal connection settings:
- Automatic reconnection
- Exponential backoff retry strategy
- Connection timeout handling
- Offline queue management

### 2. Error Handling

Always use try-catch blocks:

```typescript
try {
  await redisService.set('key', 'value');
} catch (error) {
  logger.error('Redis operation failed:', error);
  // Fallback logic here
}
```

### 3. Key Naming Conventions

Use consistent prefixes:
```typescript
const keys = {
  user: (id) => `user:${id}`,
  cache: (resource) => `cache:${resource}`,
  session: (token) => `session:${token}`,
};
```

### 4. TTL Strategy

Always set expiration for cached data:
```typescript
// Use predefined TTL constants
import { RedisTTL } from './config/redis.config';

await redisService.set('key', 'value', RedisTTL.MEDIUM); // 5 minutes
await redisService.set('key', 'value', RedisTTL.LONG);   // 1 hour
await redisService.set('key', 'value', RedisTTL.DAY);    // 24 hours
```

### 5. Monitoring

Check Redis health in your application:

```bash
# Health check endpoint
curl http://localhost:3000/health

# Response includes Redis status:
{
  "status": "healthy",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

### 6. Memory Management

Monitor Redis memory usage:

```typescript
const info = await redisService.info('memory');
console.log(info);
```

Configure maxmemory policy in docker-compose.yml:
```yaml
redis:
  command: redis-server --requirepass ${REDIS_PASSWORD:-redispassword} --maxmemory 256mb --maxmemory-policy allkeys-lru
```

### 7. Persistence

Redis is configured with AOF (Append Only File) persistence:
```yaml
redis:
  command: redis-server --requirepass ${REDIS_PASSWORD:-redispassword} --appendonly yes
  volumes:
    - redis-data:/data
```

### 8. Security

- Always use passwords in production
- Use TLS for connections (not configured by default)
- Limit network access with firewall rules
- Don't expose Redis port publicly

---

## Testing

### Start Redis for Testing

```bash
# Using Docker
docker-compose up -d redis

# Verify connection
docker-compose exec redis redis-cli -a redispassword ping
```

### Test Redis Operations

Create a test file: `src/__tests__/redis.test.ts`

```typescript
import redisService from '../application/helpers/redis.helper';

describe('Redis Service', () => {
  beforeAll(async () => {
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    // Clean up and disconnect
    await redisService.flushDb();
    await redisService.disconnect();
  });

  it('should set and get a value', async () => {
    await redisService.set('test:key', 'test-value');
    const value = await redisService.get('test:key');
    expect(value).toBe('test-value');
  });

  it('should handle expiration', async () => {
    await redisService.set('test:expire', 'value', 1);
    await new Promise(resolve => setTimeout(resolve, 1100));
    const value = await redisService.get('test:expire');
    expect(value).toBeNull();
  });

  it('should delete a key', async () => {
    await redisService.set('test:delete', 'value');
    await redisService.del('test:delete');
    const value = await redisService.get('test:delete');
    expect(value).toBeNull();
  });
});
```

Run tests:
```bash
npm test
```

---

## Troubleshooting

### Connection Issues

**Problem:** Cannot connect to Redis

**Solutions:**

1. Check if Redis is running:
   ```bash
   docker-compose ps
   # or
   redis-cli ping
   ```

2. Verify environment variables:
   ```bash
   # Check .env file
   cat .env | grep REDIS
   ```

3. Check Docker network:
   ```bash
   docker-compose logs redis
   ```

4. Test connection manually:
   ```bash
   # From host
   redis-cli -h localhost -p 6379 -a redispassword ping

   # From Docker
   docker-compose exec redis redis-cli -a redispassword ping
   ```

### Authentication Errors

**Problem:** NOAUTH Authentication required

**Solution:** Set password in environment:
```env
REDIS_PASSWORD=redispassword
```

### Memory Issues

**Problem:** OOM (Out of Memory)

**Solution:** Configure maxmemory:
```bash
# Connect to Redis
docker-compose exec redis redis-cli -a redispassword

# Set maxmemory
CONFIG SET maxmemory 256mb
CONFIG SET maxmemory-policy allkeys-lru
```

### Performance Issues

**Problem:** Slow response times

**Solutions:**

1. Check network latency
2. Use connection pooling (already configured)
3. Use pipelines for batch operations
4. Monitor slow queries:
   ```bash
   redis-cli -a redispassword SLOWLOG GET 10
   ```

### Debugging

Enable Redis logging:

```env
# In .env
LOG_LEVEL=debug
```

Check Redis logs:
```bash
docker-compose logs -f redis
```

Check application logs:
```bash
# Redis operations are logged
grep "Redis" logs/combined-*.log
```

---

## Quick Reference

### Common Commands

```bash
# Start Redis
docker-compose up -d redis

# Stop Redis
docker-compose stop redis

# Restart Redis
docker-compose restart redis

# View logs
docker-compose logs -f redis

# Connect to Redis CLI
docker-compose exec redis redis-cli -a redispassword

# Flush all data (DANGER!)
docker-compose exec redis redis-cli -a redispassword FLUSHALL
```

### Redis CLI Commands

```bash
# Inside redis-cli
PING                          # Test connection
INFO                          # Server info
KEYS *                        # List all keys (don't use in production)
GET key                       # Get value
SET key value                 # Set value
DEL key                       # Delete key
TTL key                       # Get TTL
EXPIRE key seconds           # Set expiration
DBSIZE                        # Number of keys
FLUSHDB                       # Delete all keys in current DB
```

### Useful TypeScript Snippets

```typescript
// Quick health check
const isHealthy = redisService.isReady();

// Cache pattern
const cachedData = await redisService.get(key);
if (!cachedData) {
  const data = await fetchFromDB();
  await redisService.set(key, data, RedisTTL.MEDIUM);
  return data;
}
return cachedData;

// Rate limiting pattern
const count = await redisService.incr(rateLimitKey);
if (count === 1) await redisService.expire(rateLimitKey, 60);
if (count > 100) throw new Error('Rate limit exceeded');

// Session management
await redisService.set(sessionKey, sessionData, 3600);
const session = await redisService.get(sessionKey);
if (session) {
  // Valid session
  await redisService.expire(sessionKey, 3600); // Extend
}
```

---

## Summary

You now have a fully integrated Redis setup with:

✅ Redis running in Docker Compose
✅ ioredis client configured with TypeScript
✅ Comprehensive Redis service with all common operations
✅ Cache middleware for automatic response caching
✅ Rate limiting middleware with Redis
✅ Error handling and retry strategies
✅ Production-ready configuration
✅ Health checks and monitoring
✅ Graceful shutdown handling
✅ Extensive examples and documentation

For more information, check:
- [ioredis Documentation](https://github.com/redis/ioredis)
- [Redis Documentation](https://redis.io/documentation)
- Your example files in `src/application/services/redis.examples.ts`

---

**Need help?** Check the example files or review the middleware implementations for practical usage patterns.
