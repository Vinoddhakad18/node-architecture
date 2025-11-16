# Monitoring Quick Start Guide

Get your monitoring stack up and running in 5 minutes!

## Prerequisites

- Docker and Docker Compose installed
- Node.js application configured (see main README)
- `.env` file configured

## Step 1: Start the Stack (30 seconds)

```bash
# Start all services including monitoring
docker-compose up -d

# Verify all services are running
docker-compose ps
```

Expected output: All services should show "Up" status.

## Step 2: Wait for Health Checks (30-60 seconds)

Services need time to start and become healthy:

```bash
# Watch the logs
docker-compose logs -f prometheus grafana

# Wait for these messages:
# prometheus: "Server is ready to receive web requests"
# grafana: "HTTP Server Listen"
```

Press `Ctrl+C` to stop watching logs.

## Step 3: Verify Metrics Collection (10 seconds)

```bash
# Check metrics endpoint
curl http://localhost:3000/api/v1/metrics

# Should see output like:
# http_requests_total{method="GET",route="/health",status_code="200"} 5
# nodejs_heap_size_used_bytes 25165824
# ... many more metrics
```

## Step 4: Access Prometheus (1 minute)

1. Open http://localhost:9090 in your browser
2. Go to Status → Targets
3. Verify `node-app` target shows "UP" status (green)
4. Click on "Graph" tab
5. Enter a query: `rate(http_requests_total[1m])`
6. Click "Execute"
7. Switch to "Graph" view to see visualization

## Step 5: Access Grafana Dashboard (2 minutes)

1. Open http://localhost:3001 in your browser
2. Login with:
   - Username: `admin`
   - Password: `admin@123`
3. Skip password change (or set a new one)
4. Click "Dashboards" in left sidebar
5. Navigate to: Application Monitoring → Node Architecture
6. You should see the dashboard with real-time metrics!

**If dashboard is empty**: Wait 1-2 minutes for Prometheus to collect initial data, then refresh.

## Step 6: Generate Some Traffic (1 minute)

Generate traffic to see metrics in action:

```bash
# Make some requests
for i in {1..100}; do
  curl http://localhost:3000/health
  curl http://localhost:3000/api/v1/
done

# Trigger some errors (404s)
for i in {1..20}; do
  curl http://localhost:3000/nonexistent
done
```

Go back to Grafana and watch the metrics update in real-time!

## What You Should See

### Prometheus (http://localhost:9090)

- Targets page showing node-app as UP
- Ability to query metrics using PromQL
- Time-series data visualization

### Grafana (http://localhost:3001)

Pre-configured dashboard showing:
- Request rate graphs
- Response time percentiles
- HTTP status code distribution
- Memory usage
- Active requests
- Error rates
- Database query performance
- Success rate gauge
- Uptime stats

## Troubleshooting

### Problem: Metrics endpoint returns 404

**Solution**:
```bash
# Rebuild the application
docker-compose up --build -d app
```

### Problem: Prometheus target shows "DOWN"

**Solution**:
```bash
# Check app is running
docker-compose ps app

# Check app logs
docker-compose logs app

# Restart services
docker-compose restart app prometheus
```

### Problem: Grafana dashboard is empty

**Solutions**:
1. Wait 2-3 minutes for initial data collection
2. Check time range (top right) - should be "Last 1 hour"
3. Verify Prometheus datasource: Configuration → Data Sources → Prometheus
4. Generate some traffic (see Step 6)

### Problem: Can't access Grafana/Prometheus

**Solution**:
```bash
# Check ports are not in use
netstat -ano | findstr "3001"  # Windows
lsof -i :3001                   # Mac/Linux

# If ports are in use, change them in docker-compose.yml
```

## Next Steps

Once everything is working:

1. **Explore the Dashboard**: Click on different panels to see details
2. **Customize Metrics**: See [MONITORING.md](MONITORING.md) for custom metrics
3. **Set Up Alerts**: Configure Alertmanager for notifications
4. **Production Deployment**: Update credentials and secure endpoints

## Quick Reference

| Service | URL | Default Credentials |
|---------|-----|-------------------|
| Application | http://localhost:3000 | N/A |
| Metrics Endpoint | http://localhost:3000/api/v1/metrics | N/A |
| Health Check | http://localhost:3000/health | N/A |
| Prometheus | http://localhost:9090 | None |
| Grafana | http://localhost:3001 | admin / admin |

## Common Commands

```bash
# Start monitoring stack
docker-compose up -d

# Stop monitoring stack
docker-compose down

# View logs
docker-compose logs -f prometheus grafana

# Restart specific service
docker-compose restart prometheus

# Remove all data and start fresh
docker-compose down -v
docker-compose up -d

# Check service health
curl http://localhost:3000/health
curl http://localhost:9090/-/healthy
curl http://localhost:3001/api/health
```

## Need More Help?

See the comprehensive [MONITORING.md](MONITORING.md) documentation for:
- Detailed architecture
- All available metrics
- Custom metrics examples
- Advanced configuration
- Performance tuning
- Integration with APM tools
