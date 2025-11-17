FROM redis:7-alpine

# Install necessary packages for healthcheck
RUN apk add --no-cache bash

# Create redis user's home directory and set proper permissions
RUN mkdir -p /data && \
    chown -R redis:redis /data

# Copy custom Redis configuration
COPY redis.conf /usr/local/etc/redis/redis.conf

# Create directory for logs
RUN mkdir -p /var/log/redis && \
    chown -R redis:redis /var/log/redis

# Expose Redis port
EXPOSE 6379

# Set working directory
WORKDIR /data

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD redis-cli --raw incr ping || exit 1

# Run Redis with custom configuration
# Password is injected via environment variable
CMD ["sh", "-c", "redis-server /usr/local/etc/redis/redis.conf --requirepass ${REDIS_PASSWORD:-redispassword}"]
