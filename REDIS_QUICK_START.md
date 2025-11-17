# Redis Quick Start Guide

Get Redis up and running in 5 minutes!

## 1. Start Redis (Docker)

```bash
# Start all services (including Redis)
docker-compose up -d

# Verify Redis is running
docker-compose ps | grep redis
docker-compose exec redis redis-cli -a redispassword ping
# Should return: PONG
```

## 2. Configure Environment

Your `.env` is already configured! For Docker, update:

```env
REDIS_HOST=redis        # Change from 'localhost' to 'redis' for Docker
REDIS_PORT=6379
REDIS_PASSWORD=redispassword
```

For local development (without Docker):
```env
REDIS_HOST=localhost
```

## 3. Basic Usage Examples

### Example 1: Simple Cache

```typescript
import redisService from './application/services/redis.service';
import { RedisTTL } from './application/config/redis.config';

// In your controller
export const getUsers = async (req, res) => {
  try {
    // Check cache first
    const cachedUsers = await redisService.get('users:all');
    if (cachedUsers) {
      return res.json(cachedUsers);
    }

    // Fetch from database
    const users = await User.findAll();

    // Store in cache for 5 minutes
    await redisService.set('users:all', users, RedisTTL.MEDIUM);

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### Example 2: Add Cache Middleware to Routes

```typescript
import { cacheMiddleware } from './application/middleware/cache.middleware';

// Cache GET requests for 5 minutes
router.get('/users', cacheMiddleware({ ttl: 300 }), getUsersController);
router.get('/products', cacheMiddleware({ ttl: 600 }), getProductsController);
```

### Example 3: Add Rate Limiting

```typescript
import { RateLimiters } from './application/middleware/redisRateLimit.middleware';

// Add to auth routes
router.post('/auth/login', RateLimiters.strict(), loginController);
router.post('/auth/register', RateLimiters.strict(), registerController);

// Add to API routes
router.use('/api', RateLimiters.moderate());
```

## 4. Test the Setup

### Test 1: Check Health

```bash
curl http://localhost:3000/health

# Should show:
{
  "status": "healthy",
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

### Test 2: Test Caching

```bash
# First request (cache miss)
time curl http://localhost:3000/api/users

# Second request (cache hit - should be faster)
time curl http://localhost:3000/api/users
```

### Test 3: Test Rate Limiting

```bash
# Make multiple requests quickly
for i in {1..10}; do curl http://localhost:3000/api/users; done

# Should see rate limit headers:
# RateLimit-Limit: 100
# RateLimit-Remaining: 90
```

## 5. Common Operations

### Store Data

```typescript
// Simple value
await redisService.set('key', 'value');

// With expiration (300 seconds = 5 minutes)
await redisService.set('key', 'value', 300);

// Store object
const user = { id: 1, name: 'John' };
await redisService.set('user:1', user, 3600);
```

### Retrieve Data

```typescript
// Get string
const value = await redisService.get('key');

// Get object
const user = await redisService.get('user:1');
```

### Delete Data

```typescript
// Delete single key
await redisService.del('key');

// Delete multiple keys
await redisService.del(['key1', 'key2', 'key3']);
```

### Counter Operations

```typescript
// Increment page views
await redisService.incr('page:views');

// Get current count
const views = await redisService.get('page:views');
```

## 6. View Logs

```bash
# Redis logs
docker-compose logs -f redis

# Application logs (shows Redis operations)
tail -f logs/combined-*.log | grep Redis
```

## 7. Redis CLI

```bash
# Connect to Redis
docker-compose exec redis redis-cli -a redispassword

# Inside CLI:
PING                    # Test connection
KEYS *                  # List all keys
GET key                 # Get value
SET key value          # Set value
DEL key                # Delete key
TTL key                # Get time to live
DBSIZE                 # Number of keys
```

## 8. Stop Redis

```bash
# Stop Redis
docker-compose stop redis

# Stop and remove
docker-compose down redis

# Stop all services
docker-compose down
```

---

## Troubleshooting

**Problem:** Cannot connect to Redis

```bash
# Check if Redis is running
docker-compose ps | grep redis

# Check logs
docker-compose logs redis

# Restart Redis
docker-compose restart redis
```

**Problem:** Authentication failed

```env
# Verify password in .env matches docker-compose.yml
REDIS_PASSWORD=redispassword
```

**Problem:** Connection timeout

```env
# For Docker, use:
REDIS_HOST=redis

# For local, use:
REDIS_HOST=localhost
```

---

## Next Steps

1. **Read Full Documentation**: See [REDIS_INTEGRATION_GUIDE.md](./REDIS_INTEGRATION_GUIDE.md)
2. **Check Examples**: Review [src/application/services/redis.examples.ts](./src/application/services/redis.examples.ts)
3. **Implement Caching**: Add cache middleware to your routes
4. **Add Rate Limiting**: Protect your endpoints with rate limiters

---

## Quick Reference

| Operation | Code |
|-----------|------|
| Set value | `await redisService.set('key', 'value')` |
| Set with TTL | `await redisService.set('key', 'value', 300)` |
| Get value | `await redisService.get('key')` |
| Delete | `await redisService.del('key')` |
| Check exists | `await redisService.exists('key')` |
| Increment | `await redisService.incr('counter')` |
| Expire | `await redisService.expire('key', 300)` |
| Get TTL | `await redisService.ttl('key')` |
| Ping | `await redisService.ping()` |

---

**You're all set! 🚀** Redis is configured and ready to use in your application.
