# Redis Docker Configuration

This directory contains the Docker configuration for Redis, optimized for the Node.js application.

## Files

- **Dockerfile**: Custom Redis image based on `redis:7-alpine`
- **redis.conf**: Production-ready Redis configuration with optimized settings

## Features

### Persistence
- **RDB (Snapshot)**: Periodic snapshots to disk
  - Every 15 minutes if at least 1 key changed
  - Every 5 minutes if at least 10 keys changed
  - Every 60 seconds if at least 10,000 keys changed

- **AOF (Append Only File)**: Write-ahead log for durability
  - Enabled with `everysec` fsync policy (good balance of performance and safety)
  - Automatic rewrite when file grows by 100%

### Memory Management
- **Max Memory**: 256MB (configurable)
- **Eviction Policy**: `allkeys-lru` (removes least recently used keys)
- Suitable for caching and session storage

### Security
- Password protection (set via `REDIS_PASSWORD` environment variable)
- Protected mode enabled
- Binding to all interfaces (0.0.0.0) for container networking

### Performance Optimization
- TCP keepalive: 300 seconds
- Max clients: 10,000
- Active rehashing enabled
- Lazy freeing for better performance
- Jemalloc background thread enabled

### Monitoring
- Slow log for queries > 10ms
- Logging to `/var/log/redis/redis.log`
- Health check built into Docker container

## Environment Variables

Configure Redis through environment variables in docker-compose.yml:

- `REDIS_PASSWORD`: Redis authentication password (default: `redispassword`)
- `REDIS_PORT`: Redis port (default: `6379`)

## Usage

### Build the Image
```bash
docker-compose build redis
```

### Run Redis
```bash
docker-compose up redis
```

### Connect to Redis CLI
```bash
docker exec -it node-mvc-redis redis-cli -a <password>
```

### View Logs
```bash
docker-compose logs redis
```

### Monitor Redis
```bash
# Inside the container
docker exec -it node-mvc-redis redis-cli -a <password>
> INFO
> INFO memory
> INFO stats
> SLOWLOG GET 10
```

## Customization

### Adjusting Memory Limit
Edit `redis.conf` and modify:
```
maxmemory 256mb
```

### Changing Persistence Settings
- For more frequent snapshots, adjust the `save` directives
- For stronger durability, change `appendfsync` to `always`
- For better performance, change `appendfsync` to `no` (less safe)

### Eviction Policies
Available policies in `redis.conf`:
- `allkeys-lru`: Remove least recently used keys (current)
- `allkeys-lfu`: Remove least frequently used keys
- `volatile-lru`: Remove LRU keys with TTL
- `volatile-ttl`: Remove keys with shortest TTL
- `noeviction`: Return errors when memory is full

## Health Check

The container includes a health check that runs every 30 seconds:
```bash
redis-cli --raw incr ping
```

## Data Persistence

Redis data is persisted in a Docker volume:
- **Volume**: `redis-data`
- **Mount Point**: `/data`
- **Files**: `dump.rdb`, `appendonly.aof`

## Security Best Practices

1. **Always set a strong password** via `REDIS_PASSWORD` environment variable
2. **Don't expose Redis port** directly to the internet
3. **Use Redis within Docker network** (app-network)
4. **Regularly backup** the `redis-data` volume
5. **Monitor logs** for suspicious activity

## Backup and Restore

### Backup
```bash
# Create backup of Redis data
docker exec node-mvc-redis redis-cli -a <password> BGSAVE
docker cp node-mvc-redis:/data/dump.rdb ./backup/dump-$(date +%Y%m%d).rdb
```

### Restore
```bash
# Stop Redis
docker-compose stop redis

# Copy backup file
docker cp ./backup/dump-20250117.rdb node-mvc-redis:/data/dump.rdb

# Start Redis
docker-compose start redis
```

## Troubleshooting

### Redis not starting
- Check logs: `docker-compose logs redis`
- Verify configuration: `docker exec node-mvc-redis cat /usr/local/etc/redis/redis.conf`

### Memory issues
- Check memory usage: `docker exec -it node-mvc-redis redis-cli -a <password> INFO memory`
- Adjust `maxmemory` in redis.conf

### Performance issues
- Monitor slow log: `docker exec -it node-mvc-redis redis-cli -a <password> SLOWLOG GET 100`
- Check connected clients: `docker exec -it node-mvc-redis redis-cli -a <password> CLIENT LIST`

## Resources

- [Redis Official Documentation](https://redis.io/documentation)
- [Redis Docker Hub](https://hub.docker.com/_/redis)
- [Redis Configuration Reference](https://redis.io/docs/management/config/)
