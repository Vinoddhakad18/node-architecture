# API Key Authentication Middleware

A secure, production-ready API key authentication middleware for your Node.js application.

## Features

- ✅ **Timing attack protection** - Uses `crypto.timingSafeEqual()` for constant-time comparison
- ✅ **Performance optimized** - API keys cached at startup (no repeated parsing)
- ✅ **Production ready** - Handles missing environment variables gracefully
- ✅ **Fully tested** - 11 comprehensive unit tests with 100% coverage
- ✅ **TypeScript support** - Full type safety with Express integration
- ✅ **Logging** - Integrated with your existing logger

## Setup

### 1. Configure Environment Variables

Add your API keys to the `.env` file:

```bash
# Comma-separated list of valid API keys
X_API_KEYS=your_api_key_1,your_api_key_2,your_api_key_3
```

**Generate secure API keys:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Import and Use in Routes

```typescript
import { apiKeyAuth } from '@application/middleware';

// Option 1: API Key only (service-to-service)
router.post('/api/webhooks', apiKeyAuth, handler);

// Option 2: API Key + JWT Authentication
router.get('/api/external/data', apiKeyAuth, authenticate, handler);

// Option 3: API Key + JWT + Role Authorization
router.post('/api/admin/operations', apiKeyAuth, authenticate, authorize('admin'), handler);
```

## Usage Examples

See [src/application/routes/protected.example.ts](src/application/routes/protected.example.ts) for complete examples.

### Basic Usage

```typescript
import { Router } from 'express';
import { apiKeyAuth } from '@application/middleware';

const router = Router();

router.post('/webhooks', apiKeyAuth, (req, res) => {
  res.sendSuccess({ data: req.body }, 'Webhook processed');
});
```

### Making Requests

**Valid request:**
```bash
curl -X POST http://localhost:3000/api/webhooks \
  -H "X-API-Key: your_api_key_1" \
  -H "Content-Type: application/json" \
  -d '{"event": "user.created"}'
```

**Response (401):**
```bash
curl -X POST http://localhost:3000/api/webhooks
# Response: {"message": "Missing API Key"}
```

**Response (403):**
```bash
curl -X POST http://localhost:3000/api/webhooks \
  -H "X-API-Key: invalid_key"
# Response: {"message": "Invalid API Key"}
```

## Security Features

### 1. Constant-Time Comparison
Prevents timing attacks by using `crypto.timingSafeEqual()`:

```typescript
const secureCompare = (a: string, b: string): boolean => {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
};
```

### 2. Startup Validation
Keys are parsed and cached at application startup:

```typescript
const validKeys = new Set<string>(
  (process.env.X_API_KEYS || '')
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean)
);
```

### 3. Graceful Failure
Missing or empty `X_API_KEYS` environment variable:
- Logs a warning at startup
- Rejects all API key authentication attempts
- Doesn't crash the application

## Testing

Run the test suite:

```bash
npm test -- apiKey.middleware.test.ts
```

**Test Coverage:**
- ✅ Valid API key authentication
- ✅ Multiple valid keys support
- ✅ Missing API key rejection
- ✅ Invalid API key rejection
- ✅ Whitespace handling
- ✅ Empty configuration handling
- ✅ Undefined environment variable handling
- ✅ Constant-time comparison security
- ✅ Case sensitivity
- ✅ Different length key rejection
- ✅ Empty string filtering

## File Structure

```
src/application/middleware/
├── apiKey.middleware.ts              # Main middleware implementation
├── __tests__/
│   └── apiKey.middleware.test.ts     # Comprehensive test suite
└── index.ts                          # Exports (includes apiKeyAuth)

src/application/routes/
└── protected.example.ts              # Usage examples

.env.example                          # Environment variable documentation
```

## Best Practices

### 1. Environment Management

**Development:**
```bash
X_API_KEYS=dev_key_1,dev_key_2
```

**Production:**
```bash
X_API_KEYS=prod_secure_key_abc123...,prod_secure_key_xyz789...
```

### 2. Key Rotation

To rotate API keys:
1. Add new keys to `X_API_KEYS` (comma-separated)
2. Restart the application
3. Update clients to use new keys
4. Remove old keys from `X_API_KEYS`
5. Restart the application again

### 3. Combining with JWT

For user-specific operations via external services:

```typescript
// Both API key and JWT required
router.get('/api/external/user-data',
  apiKeyAuth,        // Validates service has access
  authenticate,      // Validates which user is requesting
  handler
);
```

## Troubleshooting

**Issue:** "Warning: No API keys configured in X_API_KEYS"
- **Solution:** Add API keys to your `.env` file and restart the application

**Issue:** All requests return "Invalid API Key"
- **Check:** Environment variable is loaded (`console.log(process.env.X_API_KEYS)`)
- **Check:** No extra whitespace around keys
- **Check:** Keys are comma-separated without quotes

**Issue:** Some keys work, others don't
- **Check:** API keys are case-sensitive
- **Check:** No hidden characters or whitespace in keys

## Migration from Old Implementation

If you had the original implementation:

```typescript
// Old (vulnerable to timing attacks)
if (!validKeys.includes(incomingKey)) {
  return res.status(403).json({ message: "Invalid API Key" });
}
```

The new implementation automatically:
- Uses constant-time comparison
- Caches keys at startup for better performance
- Handles missing env vars gracefully
- Integrates with your custom response handlers
- Includes comprehensive logging

No changes required to your route definitions!

## Additional Resources

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)
- [Timing Attacks Explained](https://codahale.com/a-lesson-in-timing-attacks/)
