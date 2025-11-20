# Multi-stage Dockerfile for both development and production
# Usage:
#   Development: docker-compose --profile development up
#   Production:  docker-compose --profile production up
#   Or set BUILD_TARGET environment variable

# Build arguments for version pinning
ARG NODE_VERSION=24
ARG ALPINE_VERSION=3.21

# Stage 1: Base stage
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS base

# OCI Labels for better container metadata
LABEL org.opencontainers.image.title="Node Architecture App"
LABEL org.opencontainers.image.description="Node.js application with TypeScript, Express, and Sequelize"
LABEL org.opencontainers.image.vendor="Node Architecture Team"
LABEL org.opencontainers.image.source="https://github.com/your-org/node-architecture"
LABEL org.opencontainers.image.licenses="MIT"
LABEL maintainer="team@example.com"

# Set secure npm configurations
ENV NPM_CONFIG_LOGLEVEL=warn \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false \
    NODE_ENV=production

WORKDIR /app

# Stage 2: Dependencies stage
FROM base AS dependencies

# Install build dependencies for native modules
RUN apk add --no-cache --virtual .build-deps \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./

# Install all dependencies using npm ci for reproducible builds
RUN npm ci --include=dev && \
    npm cache clean --force

# Stage 3: Development stage
FROM dependencies AS development

# Override NODE_ENV for development
ENV NODE_ENV=development

# Copy configuration files
COPY tsconfig.json ./
COPY nodemon.json ./

# Copy source code
COPY src ./src

# Copy Sequelize configuration for migrations
COPY .sequelizerc ./

# Expose port
EXPOSE 3000

# Start development server with migrations and seeding
CMD ["sh", "-c", "npm run db:migrate && npm run db:seed && npm run dev"]

# Stage 4: Test stage
FROM dependencies AS test

ENV NODE_ENV=test

# Copy configuration
COPY tsconfig.json ./
COPY jest.config.js ./

# Copy source code and tests
COPY src ./src

# Run tests
RUN npm run test:ci

# Stage 5: Builder stage (for production)
FROM test AS builder

ENV NODE_ENV=production

# Build TypeScript (tests already passed in previous stage)
RUN npm run build:skip-tests

# Prune dev dependencies after build
RUN npm prune --omit=dev && \
    npm cache clean --force

# Stage 6: Production dependencies (separate for caching)
FROM base AS prod-deps

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev && \
    npm cache clean --force

# Install sequelize-cli globally for migrations (production needs this)
RUN npm install -g sequelize-cli@6

# Stage 7: Production stage
FROM base AS production

# Security: Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs

# Security: Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init tini && \
    rm -rf /var/cache/apk/*

# Copy production dependencies from prod-deps stage
COPY --from=prod-deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=prod-deps --chown=nodejs:nodejs /usr/local/lib/node_modules /usr/local/lib/node_modules
COPY --from=prod-deps --chown=nodejs:nodejs /usr/local/bin/sequelize /usr/local/bin/sequelize
COPY --from=prod-deps --chown=nodejs:nodejs /usr/local/bin/sequelize-cli /usr/local/bin/sequelize-cli

# Copy package files
COPY --chown=nodejs:nodejs package*.json ./

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Copy Sequelize configuration and migration files for production
COPY --chown=nodejs:nodejs .sequelizerc ./
COPY --chown=nodejs:nodejs src/application/databases ./src/application/databases

# Set proper permissions
RUN chmod -R 755 /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check with proper error handling
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "const http = require('http'); const options = { host: 'localhost', port: 3000, path: '/health', timeout: 5000 }; const req = http.request(options, (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }); req.on('error', () => process.exit(1)); req.on('timeout', () => { req.destroy(); process.exit(1); }); req.end();"

# Use dumb-init as PID 1 for proper signal handling
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start the application with migrations and seeding
CMD ["sh", "-c", "npm run db:migrate && npm run db:seed && npm run start"]
