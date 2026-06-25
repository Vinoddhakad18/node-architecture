# Nginx reverse proxy for Node Architecture
FROM nginx:1.27-alpine

# OCI Labels
LABEL org.opencontainers.image.title="Node Architecture Nginx"
LABEL org.opencontainers.image.description="Nginx reverse proxy for Node.js application"
LABEL maintainer="team@example.com"

# Install curl for healthcheck
RUN apk add --no-cache curl && \
    rm -rf /var/cache/apk/*

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy custom configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create directory for SSL certificates (if needed)
RUN mkdir -p /etc/nginx/ssl && \
    chown -R nginx:nginx /etc/nginx/ssl

# Create directory for custom error pages
RUN mkdir -p /usr/share/nginx/html/errors

# Set proper permissions
RUN chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Expose ports
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Run as non-root user
USER nginx

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
