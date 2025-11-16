# Request ID Tracking Implementation

This document describes the request ID tracking feature that enables correlation of logs across distributed requests.

## Overview

Request ID tracking assigns a unique identifier (UUID v4) to each incoming HTTP request, allowing you to trace a request's journey through your application and correlate all related log entries.

## What Was Implemented

### 1. Request ID Middleware
**File:** [src/application/middleware/requestId.ts](src/application/middleware/requestId.ts)

Automatically:
- Generates a UUID v4 for each request
- Accepts client-provided request IDs via `X-Request-ID` header
- Attaches request ID to `req.requestId`
- Sets `X-Request-ID` response header

### 2. TypeScript Type Extensions
**File:** [src/application/types/express.d.ts](src/application/types/express.d.ts)

Extends Express Request interface to include:
- `requestId?: string` - The unique request identifier
- `user?: AuthenticatedUser` - Authenticated user information

### 3. Logger Integration
**Updated:** [src/application/middleware/logger.ts](src/application/middleware/logger.ts)

- Added custom Morgan token `:request-id`
- HTTP logs now include: `ReqID::<uuid>`

**Updated:** [src/application/config/logger.ts](src/application/config/logger.ts)

- Console logs show request ID: `[ReqID: <uuid>]`
- JSON logs include `requestId` field
- Added `getLoggerWithRequestId()` helper function

### 4. Application Integration
**Updated:** [src/app.ts](src/app.ts:48)

Request ID middleware is positioned **before** the logger middleware to ensure all logs include the request ID.

## Usage

### Basic Usage in Route Handlers

```typescript
import { Request, Response } from 'express';

export const myRoute = (req: Request, res: Response) => {
  // Access the request ID
  console.log(`Request ID: ${req.requestId}`);

  res.json({
    message: 'Success',
    requestId: req.requestId
  });
};
```

### Using with Logger

```typescript
import { Request, Response } from 'express';
import { getLoggerWithRequestId } from '../config/logger';

export const myRoute = async (req: Request, res: Response) => {
  // Create a logger with request ID context
  const logger = getLoggerWithRequestId(req.requestId);

  logger.info('Processing user request');
  // Output: [ReqID: abc-123] Processing user request

  logger.info('Database query completed', { rows: 10 });
  // Output: [ReqID: abc-123] Database query completed {"rows":10}
};
```

### Client-Provided Request IDs

Clients can provide their own request IDs for distributed tracing:

```bash
curl -H "X-Request-ID: my-custom-id-123" http://localhost:3000/api/users
```

The middleware will use the client-provided ID instead of generating a new one.

### Error Handling with Request IDs

```typescript
import { Request, Response } from 'express';
import { getLoggerWithRequestId } from '../config/logger';

export const myRoute = async (req: Request, res: Response) => {
  const logger = getLoggerWithRequestId(req.requestId);

  try {
    // Your logic here
  } catch (error) {
    logger.error('Operation failed', { error });

    res.status(500).json({
      error: 'Internal server error',
      requestId: req.requestId,
      message: 'Please provide this request ID to support'
    });
  }
};
```

### Service Layer Integration

Pass request IDs to service methods for complete tracing:

```typescript
// In your route handler
export const createUser = async (req: Request, res: Response) => {
  const logger = getLoggerWithRequestId(req.requestId);

  const user = await userService.create(req.body, req.requestId);

  res.json({ user, requestId: req.requestId });
};

// In your service
export class UserService {
  async create(data: UserData, requestId?: string) {
    const logger = getLoggerWithRequestId(requestId);

    logger.info('Creating user', { email: data.email });

    // Your logic

    logger.info('User created successfully');
  }
}
```

## Log Examples

### HTTP Request Logs

```
2025-01-13 10:30:15 [info]: 192.168.1.1 - GET /api/users 200 1234 - 45 ms - Mozilla/5.0 - PID:12345 - ReqID:550e8400-e29b-41d4-a716-446655440000
```

### Console Logs with Request ID

```
2025-01-13 10:30:15 [info] [ReqID: 550e8400-e29b-41d4-a716-446655440000]: User requested data
2025-01-13 10:30:15 [info] [ReqID: 550e8400-e29b-41d4-a716-446655440000]: Database query completed {"rows":10}
```

### JSON File Logs

```json
{
  "timestamp": "2025-01-13 10:30:15",
  "level": "info",
  "message": "User requested data",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "service": "node-architecture",
  "pid": 12345
}
```

## Benefits

1. **Easier Debugging**: Trace all log entries related to a specific request
2. **Distributed Tracing**: Follow requests across microservices
3. **Customer Support**: Customers can provide request IDs for support tickets
4. **Performance Monitoring**: Track request duration and identify slow requests
5. **Error Correlation**: Link errors to specific user actions

## Testing

Test the implementation by making a request and checking the response headers:

```bash
curl -v http://localhost:3000/api/health
```

Look for the `X-Request-ID` header in the response:

```
< HTTP/1.1 200 OK
< X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
```

## Best Practices

1. **Always use the logger helper**: Use `getLoggerWithRequestId(req.requestId)` instead of the global logger
2. **Include in error responses**: Always return the request ID in error responses for support
3. **Pass to async operations**: Pass request IDs to background jobs and async operations
4. **Client propagation**: When making external API calls, propagate the request ID
5. **Database queries**: Include request ID in database query comments for SQL log correlation

## Examples

See [src/application/middleware/requestId.examples.ts](src/application/middleware/requestId.examples.ts) for comprehensive examples.

## Impact

✅ **Fixed**: No correlation IDs for tracing requests across logs
✅ **Fixed**: Debugging distributed issues is extremely difficult
✅ **Added**: UUID v4 generation for each request
✅ **Added**: X-Request-ID header in responses
✅ **Added**: Request ID in all HTTP and application logs
✅ **Added**: Helper function for creating request-scoped loggers
