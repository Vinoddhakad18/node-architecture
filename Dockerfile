# Multi-stage build for Node.js 24 LTS application

# Stage 1: Build
FROM node:24-alpine AS builder

# Build argument to control dependency pruning
ARG NODE_ENV=production

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY .sequelizerc ./

# Install all dependencies (including dev dependencies for build)
RUN npm install && \
    npm cache clean --force

# Copy source code
COPY src ./src

# Build TypeScript and conditionally prune dev dependencies
# Only prune for production builds, keep dev dependencies for dev/local environments
RUN npm run build && \
    if [ "$NODE_ENV" = "production" ] || [ "$NODE_ENV" = "ppd" ]; then npm prune --production; fi

# Stage 2: Production
FROM node:24-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/.sequelizerc ./

# Create logs directory
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/app.js"]
