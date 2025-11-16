# Application Monitoring & Observability

This document describes the monitoring and observability setup for the Node Architecture application using Prometheus and Grafana.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Accessing the Dashboards](#accessing-the-dashboards)
- [Available Metrics](#available-metrics)
- [Grafana Dashboards](#grafana-dashboards)
- [Custom Metrics](#custom-metrics)
- [Alerting (Future Enhancement)](#alerting-future-enhancement)
- [Troubleshooting](#troubleshooting)

## Overview

The monitoring stack includes:

- **Prometheus**: Time-series database for metrics collection
- **Grafana**: Visualization and dashboarding platform
- **prom-client**: Node.js Prometheus client library
- **Custom Metrics Middleware**: Application-specific metrics tracking

## Architecture

```
┌─────────────────┐
│   Node.js App   │
│  (Port 3000)    │
│                 │
│  /api/v1/metrics│◄────┐
└─────────────────┘     │
                        │ Scrapes every 10s
                        │
                  ┌─────┴──────┐
                  │ Prometheus │
                  │ (Port 9090)│
                  └─────┬──────┘
                        │
                        │ Queries
                        │
                   ┌────▼─────┐
                   │ Grafana  │
                   │(Port 3001)│
                   └──────────┘
```

## Quick Start

### 1. Start the Monitoring Stack

Start all services including Prometheus and Grafana:

```bash
docker-compose up -d
```

This will start:
- MySQL (Port 3306)
- Node.js Application (Port 3000)
- Prometheus (Port 9090)
- Grafana (Port 3001)

### 2. Verify Services

Check that all services are running:

```bash
docker-compose ps
```

Check service health:

```bash
# Application health
curl http://localhost:3000/health

# Metrics endpoint
curl http://localhost:3000/api/v1/metrics

# Prometheus health
curl http://localhost:9090/-/healthy

# Grafana health
curl http://localhost:3001/api/health
```

### 3. Initial Setup

Wait about 30-60 seconds for:
- Services to start and become healthy
- Prometheus to begin scraping metrics
- Grafana to provision datasources and dashboards

## Accessing the Dashboards

### Prometheus

- **URL**: http://localhost:9090
- **Features**:
  - Query metrics using PromQL
  - View targets and their health status
  - Explore time-series data
  - Test alert rules

**Useful Queries**:
```promql
# Request rate
rate(http_requests_total[5m])

# P95 response time
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))

# Error rate
rate(errors_total[5m])

# Memory usage
nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes
```

### Grafana

- **URL**: http://localhost:3001
- **Default Credentials**:
  - Username: `admin`
  - Password: `admin@123` (change on first login)

**Pre-configured Dashboard**: "Node Architecture - Application Monitoring"

To access:
1. Navigate to http://localhost:3001
2. Login with admin credentials
3. Go to Dashboards → Application Monitoring → Node Architecture

## Available Metrics

### HTTP Metrics

| Metric Name | Type | Description |
|-------------|------|-------------|
| `http_requests_total` | Counter | Total number of HTTP requests by method, route, and status code |
| `http_request_duration_seconds` | Histogram | Request duration in seconds with percentiles (p50, p95, p99) |
| `http_request_size_bytes` | Histogram | Size of HTTP requests in bytes |
| `http_response_size_bytes` | Histogram | Size of HTTP responses in bytes |
| `http_requests_in_progress` | Gauge | Number of HTTP requests currently being processed |

### Database Metrics
s
| Metric Name | Type | Description |
|-------------|------|-------------|
| `db_query_duration_seconds` | Histogram | Database query duration by operation and model |
| `db_queries_total` | Counter | Total number of database queries by operation, model, and status |
| `db_connection_pool_connections` | Gauge | Number of database connections by state |

### Error Metrics

| Metric Name | Type | Description |
|-------------|------|-------------|
| `errors_total` | Counter | Total number of errors by type and status code |

### Authentication Metrics

| Metric Name | Type | Description |
|-------------|------|-------------|
| `auth_attempts_total` | Counter | Authentication attempts by status (success/failure) |

### Business Metrics

| Metric Name | Type | Description |
|-------------|------|-------------|
| `user_operations_total` | Counter | User operations by operation type |

### Cache Metrics

| Metric Name | Type | Description |
|-------------|------|-------------|
| `cache_hits_total` | Counter | Cache hits by cache name |
| `cache_misses_total` | Counter | Cache misses by cache name |

### Node.js Runtime Metrics

| Metric Name | Type | Description |
|-------------|------|-------------|
| `nodejs_heap_size_used_bytes` | Gauge | Heap memory used |
| `nodejs_heap_size_total_bytes` | Gauge | Total heap memory |
| `nodejs_external_memory_bytes` | Gauge | External memory usage |
| `nodejs_process_uptime_seconds` | Counter | Process uptime in seconds |
| `nodejs_eventloop_lag_seconds` | Gauge | Event loop lag |
| `nodejs_gc_duration_seconds` | Histogram | Garbage collection duration |

### Application Info

| Metric Name | Type | Description |
|-------------|------|-------------|
| `app_info` | Gauge | Application metadata (name, version, environment) |

## Grafana Dashboards

The pre-configured dashboard includes the following panels:

### Overview Section
1. **HTTP Request Rate**: Requests per second by method, route, and status
2. **P95 Response Time**: 95th percentile response time gauge
3. **Response Time by Route**: Percentile breakdown (p50, p95, p99) per route
4. **HTTP Status Codes**: Stacked area chart of 2xx, 4xx, 5xx responses

### Performance Section
5. **Memory Usage**: Heap and external memory trends
6. **Active Requests**: In-flight requests by HTTP method
7. **Error Rate**: Error rate by type and status code
8. **Database Query Duration**: P95 query duration by operation

### Summary Stats
9. **Success Rate**: Percentage of successful requests (gauge)
10. **Requests Per Minute**: Total request throughput
11. **Errors Per Minute**: Error throughput
12. **Application Uptime**: Process uptime in seconds

**Dashboard Features**:
- Auto-refresh every 10 seconds
- Time range selector (default: last 1 hour)
- Drill-down capabilities on all panels
- Legend with statistics (mean, last, max)

## Custom Metrics

### Adding Database Query Tracking

Track database operations using the helper function:

```typescript
import { trackDbQuery } from './application/middleware/metrics';

// Example in a service or model
export async function getUserById(id: string) {
  const endTimer = trackDbQuery('SELECT', 'User');

  try {
    const user = await User.findByPk(id);
    endTimer('success');
    return user;
  } catch (error) {
    endTimer('error');
    throw error;
  }
}
```

### Tracking Authentication Events

```typescript
import { trackAuthAttempt } from './application/middleware/metrics';

// In your auth controller
if (isValidCredentials) {
  trackAuthAttempt('success');
  // ... rest of login logic
} else {
  trackAuthAttempt('failure');
  // ... handle failed login
}
```

### Tracking Business Operations

```typescript
import { trackUserOperation } from './application/middleware/metrics';

// Track user registration
trackUserOperation('registration');

// Track profile updates
trackUserOperation('profile_update');

// Track account deletion
trackUserOperation('account_deletion');
```

### Tracking Cache Performance

```typescript
import { trackCacheHit, trackCacheMiss } from './application/middleware/metrics';

const cachedData = await cache.get('user:' + userId);

if (cachedData) {
  trackCacheHit('user_cache');
  return cachedData;
} else {
  trackCacheMiss('user_cache');
  const data = await fetchFromDatabase(userId);
  await cache.set('user:' + userId, data);
  return data;
}
```

### Creating Custom Metrics

Add new metrics in [src/application/config/metrics.ts](src/application/config/metrics.ts):

```typescript
import client from 'prom-client';
import { register } from './metrics';

// Example: Custom counter
export const customEventCounter = new client.Counter({
  name: 'custom_events_total',
  help: 'Total number of custom events',
  labelNames: ['event_type'],
  registers: [register],
});

// Example: Custom gauge
export const customQueueSize = new client.Gauge({
  name: 'queue_size',
  help: 'Current queue size',
  labelNames: ['queue_name'],
  registers: [register],
});

// Usage in your code
customEventCounter.inc({ event_type: 'email_sent' });
customQueueSize.set({ queue_name: 'notifications' }, 42);
```

## Alerting (Future Enhancement)

To add alerting capabilities:

### 1. Create Alert Rules

Create `monitoring/prometheus/alerts/alerts.yml`:

```yaml
groups:
  - name: application_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(errors_total[5m]) > 10
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors/second"

      - alert: HighResponseTime
        expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time detected"
          description: "P95 response time is {{ $value }}s"

      - alert: HighMemoryUsage
        expr: (nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes) > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value | humanizePercentage }}"
```

### 2. Configure Alertmanager

Add to `docker-compose.yml`:

```yaml
alertmanager:
  image: prom/alertmanager:latest
  ports:
    - "9093:9093"
  volumes:
    - ./monitoring/alertmanager/config.yml:/etc/alertmanager/config.yml
  networks:
    - app-network
```

### 3. Update Prometheus Configuration

Uncomment alerting section in `monitoring/prometheus/prometheus.yml`:

```yaml
alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

rule_files:
  - 'alerts/*.yml'
```

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# Grafana
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=your-secure-password

# Application Version (for metrics)
APP_VERSION=1.0.0
```

### Prometheus Scrape Configuration

Edit `monitoring/prometheus/prometheus.yml` to adjust scrape interval or add targets:

```yaml
scrape_configs:
  - job_name: 'node-app'
    scrape_interval: 10s  # Adjust frequency
    metrics_path: '/api/v1/metrics'
    static_configs:
      - targets: ['app:3000']
```

### Grafana Dashboard Customization

Dashboards are auto-provisioned from:
- `monitoring/grafana/provisioning/dashboards/json/`

To customize:
1. Edit the dashboard in Grafana UI
2. Save JSON model
3. Copy to the provisioning directory
4. Restart Grafana

## Troubleshooting

### Metrics Not Appearing

**Problem**: Prometheus shows no data or targets are down

**Solutions**:
1. Check app is running: `docker-compose ps`
2. Verify metrics endpoint: `curl http://localhost:3000/api/v1/metrics`
3. Check Prometheus targets: http://localhost:9090/targets
4. Verify network connectivity: `docker-compose exec prometheus ping app`

### Grafana Dashboard Empty

**Problem**: Dashboard loads but shows no data

**Solutions**:
1. Verify Prometheus is scraping: http://localhost:9090/targets
2. Check datasource connection: Grafana → Configuration → Data Sources
3. Wait 1-2 minutes for initial data collection
4. Check time range in dashboard (default: last 1 hour)

### High Memory Usage in Prometheus

**Problem**: Prometheus consuming too much memory

**Solutions**:
1. Reduce scrape interval in `prometheus.yml`
2. Adjust retention time:
   ```yaml
   command:
     - '--storage.tsdb.retention.time=15d'  # Default: 15 days
   ```
3. Limit metric cardinality (reduce unique label combinations)

### Container Health Check Failing

**Problem**: Services show as unhealthy

**Solutions**:
```bash
# Check logs
docker-compose logs prometheus
docker-compose logs grafana
docker-compose logs app

# Restart services
docker-compose restart prometheus grafana
```

### Metrics Endpoint Returns 404

**Problem**: `/api/v1/metrics` returns 404

**Solutions**:
1. Verify routes are loaded: check `src/application/routes/index.ts`
2. Check API prefix: default is `/api/v1`
3. Rebuild application: `docker-compose up --build app`

## Performance Considerations

### Metric Cardinality

High cardinality (many unique label combinations) can impact performance:

**Good** (low cardinality):
```typescript
httpRequestCounter.inc({ method: 'GET', status_code: '200' });
```

**Bad** (high cardinality):
```typescript
// Don't use unique IDs as labels
httpRequestCounter.inc({ method: 'GET', user_id: '12345' });
```

### Scrape Interval

- **Development**: 10s (current)
- **Production**: 15-30s recommended
- Lower intervals = more metrics = higher storage needs

### Retention

Default Prometheus retention: 15 days
- Increase for long-term analysis
- Decrease to save storage

## Integration with APM Tools

For production, consider integrating additional APM tools:

### New Relic

```bash
npm install newrelic
```

Add to [src/server.ts](src/server.ts:1):
```typescript
require('newrelic');
```

### Datadog

```bash
npm install dd-trace
```

Add to [src/server.ts](src/server.ts:1):
```typescript
import tracer from 'dd-trace';
tracer.init();
```

### Elastic APM

```bash
npm install elastic-apm-node
```

Add to [src/server.ts](src/server.ts:1):
```typescript
require('elastic-apm-node').start();
```

## Next Steps

1. **Set up Alerting**: Configure Alertmanager for notifications
2. **Add Distributed Tracing**: Integrate OpenTelemetry for request tracing
3. **Custom Business Metrics**: Track domain-specific KPIs
4. **SLA Monitoring**: Set up SLO/SLI tracking
5. **Log Aggregation**: Integrate with ELK or Loki for log analysis
6. **Database Monitoring**: Add MySQL exporter for database metrics

## Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [prom-client](https://github.com/siimon/prom-client)
- [PromQL Tutorial](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Grafana Dashboard Best Practices](https://grafana.com/docs/grafana/latest/best-practices/)

## Support

For issues or questions:
1. Check application logs: `docker-compose logs -f app`
2. Check monitoring logs: `docker-compose logs -f prometheus grafana`
3. Review this documentation
4. Open an issue in the project repository
