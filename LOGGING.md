# Logging Implementation Guide

This project uses **Morgan** and **Winston** for comprehensive logging with date-wise log file generation.

## Features

### 1. Date-wise Log Files
All log files are automatically rotated daily and organized by date:
- **Format**: `logs/[type]-YYYY-MM-DD.log`
- **Retention**: 14 days
- **Max Size**: 20 MB per file

### 2. Log File Types

#### Error Logs
- **Path**: `logs/error-YYYY-MM-DD.log`
- **Contains**: All error-level logs (status codes 4xx and 5xx)

#### Info Logs
- **Path**: `logs/info-YYYY-MM-DD.log`
- **Contains**: All info-level logs

#### Combined Logs
- **Path**: `logs/combined-YYYY-MM-DD.log`
- **Contains**: All log levels (info, warn, error, debug)

#### Exception Logs
- **Path**: `logs/exceptions-YYYY-MM-DD.log`
- **Contains**: Uncaught exceptions

#### Rejection Logs
- **Path**: `logs/rejections-YYYY-MM-DD.log`
- **Contains**: Unhandled promise rejections

### 3. HTTP Request Logging (Morgan)

Each HTTP request is logged with the following information:
```
[IP Address] - [METHOD] [URL] [STATUS] [CONTENT-LENGTH] - [RESPONSE-TIME] ms - [USER-AGENT] - PID:[PROCESS-ID]
```

**Example**:
```
::1 - GET /api/users 200 1234 - 45.3 ms - Mozilla/5.0 - PID:12345
```

#### Features:
- Real IP detection (supports X-Forwarded-For and X-Real-IP headers)
- Automatic error logging for 4xx and 5xx responses
- Health check endpoint `/health` is excluded from logs
- User agent tracking
- Process ID tracking

### 4. Server Uptime Tracking

#### Uptime Logging
- Server uptime is logged every hour
- Format: `[days]d [hours]h [minutes]m [seconds]s`
- Example: `2d 5h 30m 45s`

#### Health Check Endpoint
**Endpoint**: `GET /health`

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-11T10:30:00.000Z",
  "serverStartTime": "2025-11-11T08:00:00.000Z",
  "uptime": {
    "seconds": 9000,
    "formatted": "2h 30m 0s"
  },
  "environment": "development",
  "process": {
    "pid": 12345,
    "memoryUsage": {
      "rss": 50331648,
      "heapTotal": 20971520,
      "heapUsed": 15728640,
      "external": 1048576,
      "arrayBuffers": 524288
    },
    "cpuUsage": {
      "user": 1000000,
      "system": 500000
    }
  }
}
```

### 5. Log Metadata

Each log entry includes:
- **timestamp**: `YYYY-MM-DD HH:mm:ss`
- **level**: Log level (info, warn, error, debug)
- **message**: Log message
- **service**: Application name (node-architecture)
- **pid**: Process ID
- **stack**: Stack trace (for errors)

**Example Log Entry**:
```json
{
  "timestamp": "2025-11-11 10:30:00",
  "level": "info",
  "message": "GET /api/users 200 45.3 ms",
  "service": "node-architecture",
  "pid": 12345
}
```

## Usage

### Import Logger

```typescript
import { logger } from './application/config/logger';
```

### Logging Examples

```typescript
// Info log
logger.info('User successfully logged in', { userId: 123 });

// Error log
logger.error('Database connection failed', { error: err.message });

// Warning log
logger.warn('API rate limit approaching', { requests: 95 });

// Debug log
logger.debug('Debug information', { data: debugData });
```

### Custom Morgan Tokens

#### Real IP
```typescript
morgan.token('real-ip', (req) => {
  return req.headers['x-forwarded-for'] ||
         req.headers['x-real-ip'] ||
         req.socket.remoteAddress ||
         'unknown';
});
```

#### Request Body (Sanitized)
```typescript
morgan.token('request-body', (req) => {
  // Automatically removes sensitive fields:
  // - password
  // - token
  // - apiKey
});
```

#### Process ID
```typescript
morgan.token('pid', () => process.pid.toString());
```

## Configuration

### Log Level
Configure the log level in your environment configuration:
```typescript
// config.ts
logging: {
  level: process.env.LOG_LEVEL || 'info'
}
```

**Available Levels**: error, warn, info, debug

### Retention and Size
Modify in [logger.ts](src/application/config/logger.ts):
```typescript
const errorFileRotateTransport = new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',      // Change file size limit
  maxFiles: '14d',     // Change retention period
});
```

## Uptime Utilities

### Import Uptime Functions
```typescript
import {
  getServerStartTime,
  getServerUptimeInSeconds,
  getFormattedServerUptime,
  getUptimeInfo
} from './application/utils/uptime';
```

### Usage Examples
```typescript
// Get server start time
const startTime = getServerStartTime();

// Get uptime in seconds
const uptimeSeconds = getServerUptimeInSeconds();

// Get formatted uptime
const uptime = getFormattedServerUptime();
// Returns: "2d 5h 30m 45s"

// Get complete uptime info
const info = getUptimeInfo();
// Returns: { startTime, uptimeSeconds, uptimeFormatted }
```

## Security Features

### Sensitive Data Sanitization
The logger automatically sanitizes sensitive fields from request bodies:
- `password` → `***`
- `token` → `***`
- `apiKey` → `***`

### Example
**Request Body**:
```json
{
  "username": "john",
  "password": "secret123",
  "email": "john@example.com"
}
```

**Logged**:
```json
{
  "username": "john",
  "password": "***",
  "email": "john@example.com"
}
```

## Monitoring and Maintenance

### View Logs
```bash
# View today's combined logs
tail -f logs/combined-$(date +%Y-%m-%d).log

# View today's error logs
tail -f logs/error-$(date +%Y-%m-%d).log

# View exceptions
tail -f logs/exceptions-$(date +%Y-%m-%d).log
```

### Log Cleanup
Logs are automatically cleaned up after 14 days. To manually clean logs:
```bash
# Remove logs older than 14 days
find logs/ -name "*.log" -mtime +14 -delete
```

## Troubleshooting

### Logs Directory Not Created
The logs directory is created automatically on first run. If needed:
```bash
mkdir -p logs
```

### Permission Issues
Ensure the application has write permissions:
```bash
chmod 755 logs
```

### Viewing Real-time Logs
For development, logs are also output to the console with colorization.

## Dependencies

- **winston**: ^3.18.3
- **winston-daily-rotate-file**: ^5.0.0
- **morgan**: ^1.10.1
- **@types/morgan**: ^1.9.10

## Best Practices

1. **Use appropriate log levels**:
   - `error`: For errors that need immediate attention
   - `warn`: For warnings that should be investigated
   - `info`: For general application information
   - `debug`: For detailed debugging information

2. **Include context**: Always provide relevant context in log metadata
   ```typescript
   logger.error('Payment failed', {
     userId: user.id,
     amount: payment.amount,
     errorCode: error.code
   });
   ```

3. **Don't log sensitive data**: The sanitizer helps, but be mindful of what you log

4. **Monitor log file sizes**: Although rotation is automatic, monitor in production

5. **Regular log review**: Review error and exception logs regularly
