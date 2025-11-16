# New Relic APM Integration

This document describes the New Relic Application Performance Monitoring (APM) integration for the Node Architecture application.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Features](#features)
- [Enabling/Disabling New Relic](#enablingdisabling-new-relic)
- [Monitored Metrics](#monitored-metrics)
- [Custom Instrumentation](#custom-instrumentation)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

New Relic APM provides deep performance analytics and monitoring for Node.js applications. This integration:

- **Automatically instruments** Express.js, MySQL, and other frameworks
- **Tracks performance** of HTTP requests, database queries, and external services
- **Provides distributed tracing** across microservices
- **Monitors errors** and exceptions in real-time
- **Collects custom metrics** and business analytics
- **Can be enabled/disabled** via environment variable

## Quick Start

### 1. Get Your New Relic License Key

1. Sign up for a New Relic account at https://newrelic.com
2. Navigate to: Account Settings → API Keys
3. Copy your license key (starts with "NRAL-")

### 2. Configure Environment Variables

Update your `.env` file:

```env
# Enable New Relic APM
NEW_RELIC_ENABLED=true

# Your New Relic license key
NEW_RELIC_LICENSE_KEY=your_actual_license_key_here

# Application name (appears in New Relic dashboard)
NEW_RELIC_APP_NAME=node-architecture-production

# Log level: trace, debug, info, warn, error, fatal
NEW_RELIC_LOG_LEVEL=info

# Enable distributed tracing
NEW_RELIC_DISTRIBUTED_TRACING_ENABLED=true

# Enable New Relic logging
NEW_RELIC_LOGGING_ENABLED=true
```

### 3. Restart Your Application

```bash
# For Docker
docker-compose restart app

# For local development
npm run dev
```

### 4. Verify Integration

Check the application logs for:
```
✓ New Relic APM initialized
```

Then visit your New Relic dashboard at https://one.newrelic.com to see your application data.

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEW_RELIC_ENABLED` | No | `false` | Enable/disable New Relic APM |
| `NEW_RELIC_LICENSE_KEY` | Yes* | - | Your New Relic license key (*required when enabled) |
| `NEW_RELIC_APP_NAME` | No | `node-architecture` | Application name in New Relic |
| `NEW_RELIC_LOG_LEVEL` | No | `info` | Logging verbosity |
| `NEW_RELIC_DISTRIBUTED_TRACING_ENABLED` | No | `true` | Enable distributed tracing |
| `NEW_RELIC_LOGGING_ENABLED` | No | `true` | Enable agent logging to file |

### Configuration File

The New Relic agent is configured via [newrelic.js](newrelic.js) in the project root. This file:

- Loads settings from environment variables
- Configures distributed tracing
- Sets up error collection
- Configures transaction tracing
- Defines attribute filtering (excludes sensitive headers)

**Important**: Most configuration should be done via environment variables. Only modify `newrelic.js` for advanced settings.

## Features

### Automatic Instrumentation

New Relic automatically instruments:

- **HTTP/HTTPS** - Express.js routes and middleware
- **Database** - MySQL queries via Sequelize
- **External Services** - HTTP/HTTPS outbound requests
- **Custom Middleware** - Request/response cycle tracking

### Distributed Tracing

When enabled, distributed tracing:
- Tracks requests across microservices
- Shows complete transaction flow
- Identifies bottlenecks in distributed systems
- Correlates errors across services

### Error Tracking

New Relic captures:
- Uncaught exceptions
- Handled errors
- HTTP error responses (5xx)
- Database query errors

**Ignored Status Codes**: 400, 401, 403, 404 (configurable in newrelic.js)

### Application Logging

Log forwarding sends application logs to New Relic:
- Winston logs are automatically captured
- Logs are correlated with traces
- Searchable in New Relic Logs UI
- Maximum 10,000 log records per minute

### Transaction Tracing

Detailed traces captured for:
- Slow transactions (exceeding apdex_f threshold)
- Top 20 slowest transactions
- Full request/response cycle
- Database query performance

## Enabling/Disabling New Relic

### To Enable New Relic

1. Update `.env`:
```env
NEW_RELIC_ENABLED=true
NEW_RELIC_LICENSE_KEY=your_license_key
```

2. Restart the application:
```bash
docker-compose restart app
# or
npm run dev
```

3. Verify in logs:
```
✓ New Relic APM initialized
New Relic APM: Enabled
```

### To Disable New Relic

1. Update `.env`:
```env
NEW_RELIC_ENABLED=false
```

2. Restart the application:
```bash
docker-compose restart app
# or
npm run dev
```

3. Verify in logs:
```
New Relic APM: Disabled
```

**Note**: When disabled, the New Relic agent is not loaded at all, resulting in zero performance overhead.

## Monitored Metrics

### Application Performance

- **Throughput**: Requests per minute (RPM)
- **Response Time**: Average, median, 95th/99th percentiles
- **Error Rate**: Percentage of failed requests
- **Apdex Score**: User satisfaction metric

### Web Transactions

- **Route Performance**: Response time by endpoint
- **HTTP Methods**: GET, POST, PUT, DELETE breakdown
- **Status Codes**: 2xx, 3xx, 4xx, 5xx distribution
- **External Services**: Third-party API call performance

### Database Performance

- **Query Time**: Average query duration
- **Throughput**: Queries per minute
- **Slow Queries**: Queries exceeding threshold
- **Connection Pool**: Active/idle connections

### System Resources

- **Memory Usage**: Heap size, garbage collection
- **CPU Usage**: Process CPU consumption
- **Event Loop**: Node.js event loop lag
- **Uptime**: Application uptime

## Custom Instrumentation

### Adding Custom Metrics

```typescript
import newrelic from 'newrelic';

// Record a custom metric
newrelic.recordMetric('Custom/Users/Registration', 1);

// Record a custom event
newrelic.recordCustomEvent('UserRegistration', {
  userId: user.id,
  source: 'web',
  timestamp: Date.now()
});
```

### Custom Transaction Naming

```typescript
import newrelic from 'newrelic';

// Set custom transaction name
newrelic.setTransactionName('Custom/ProcessOrder');

// Add custom attributes
newrelic.addCustomAttribute('orderId', orderId);
newrelic.addCustomAttribute('customerId', customerId);
```

### Manual Tracing

```typescript
import newrelic from 'newrelic';

// Create a custom segment
newrelic.startSegment('ProcessPayment', true, async () => {
  // Your code here
  const result = await processPayment();
  return result;
});
```

### Error Tracking

```typescript
import newrelic from 'newrelic';

try {
  await someOperation();
} catch (error) {
  // Manually report error to New Relic
  newrelic.noticeError(error, {
    userId: user.id,
    operation: 'payment'
  });
  throw error;
}
```

## Troubleshooting

### Problem: "Unable to connect to New Relic"

**Possible Causes**:
1. Invalid license key
2. Network/firewall blocking New Relic endpoints
3. License key not set

**Solutions**:
```bash
# Verify license key
echo $NEW_RELIC_LICENSE_KEY

# Check New Relic agent logs
cat newrelic_agent.log

# Test network connectivity
curl -I https://collector.newrelic.com
```

### Problem: No data appearing in New Relic

**Solutions**:
1. Wait 2-3 minutes for initial data collection
2. Verify `NEW_RELIC_ENABLED=true` in .env
3. Check application logs for initialization message
4. Generate some traffic to the application
5. Review `newrelic_agent.log` for errors

### Problem: High memory usage

**Solution**:
Adjust these settings in `newrelic.js`:
```javascript
application_logging: {
  forwarding: {
    max_samples_stored: 5000  // Reduce from 10000
  }
},
custom_insights_events: {
  max_samples_stored: 5000  // Reduce from 10000
}
```

### Problem: Sensitive data in traces

**Solution**:
Update `attributes.exclude` in `newrelic.js`:
```javascript
attributes: {
  exclude: [
    'request.headers.cookie',
    'request.headers.authorization',
    'request.parameters.password',
    'request.parameters.creditCard',
    // Add more sensitive fields
  ]
}
```

## Best Practices

### 1. Use Environment-Specific App Names

```env
# Development
NEW_RELIC_APP_NAME=node-architecture-dev

# Staging
NEW_RELIC_APP_NAME=node-architecture-staging

# Production
NEW_RELIC_APP_NAME=node-architecture-prod
```

This separates data in New Relic dashboards by environment.

### 2. Adjust Log Levels by Environment

```env
# Development - more verbose
NEW_RELIC_LOG_LEVEL=debug

# Production - less verbose
NEW_RELIC_LOG_LEVEL=warn
```

### 3. Monitor Key Business Metrics

Add custom instrumentation for critical business events:
- User registrations
- Order completions
- Payment transactions
- Feature usage

### 4. Set Up Alerts

Configure New Relic alerts for:
- Error rate exceeds threshold (e.g., >1%)
- Response time exceeds threshold (e.g., >500ms)
- Throughput drops significantly
- Apdex score below threshold

### 5. Review Slow Transactions

Regularly review slow transactions in New Relic:
1. Identify bottlenecks
2. Optimize database queries
3. Add caching where appropriate
4. Improve external service calls

### 6. Use Distributed Tracing

For microservices architectures:
- Enable distributed tracing on all services
- Use consistent transaction naming
- Propagate trace context headers

### 7. Protect Sensitive Data

Always exclude sensitive data from traces:
- Passwords
- Credit card numbers
- API keys
- Personal information
- Session tokens

### 8. Monitor in Production Only

Disable New Relic in local development to:
- Reduce noise in dashboards
- Avoid consuming data quota
- Improve local performance

```env
# .env.local
NEW_RELIC_ENABLED=false

# .env.production
NEW_RELIC_ENABLED=true
```

## Performance Impact

When enabled, New Relic has minimal performance impact:

- **CPU**: ~1-2% overhead
- **Memory**: ~10-30MB additional memory
- **Latency**: <1ms per transaction

The overhead is acceptable for production use and provides valuable insights.

## Support and Resources

- **New Relic Docs**: https://docs.newrelic.com/docs/apm/agents/nodejs-agent/
- **Node.js Agent GitHub**: https://github.com/newrelic/node-newrelic
- **Support**: https://support.newrelic.com
- **Community Forum**: https://discuss.newrelic.com

## Related Documentation

- [MONITORING.md](MONITORING.md) - Prometheus + Grafana monitoring
- [LOGGING.md](LOGGING.md) - Application logging with Winston
- [README.md](README.md) - Main application documentation
