# Multi-stage Dockerfile for both development and production
# Usage:
#   Development: docker-compose --profile development up
#   Production:  docker-compose --profile production up
#   Or set BUILD_TARGET environment variable

# Stage 1: Base stage
FROM node:24-alpine AS base
WORKDIR /app

# Stage 2: Dependencies stage
FROM base AS dependencies

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (for building)
RUN npm install && \
    npm cache clean --force

# Stage 3: Development stage
FROM dependencies AS development

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

# Copy configuration
COPY tsconfig.json ./
COPY jest.config.js ./

# Copy source code and tests
COPY src ./src

# Run tests
RUN npm run test:ci

# Stage 5: Builder stage (for production)
FROM test AS builder

# Build TypeScript (tests already passed in previous stage)
RUN npm run build:skip-tests

# Stage 6: Production stage
FROM base AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for sequelize-cli)
RUN npm install && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy environment files
COPY .env.* ./

# Copy Sequelize configuration and migration files for production
COPY .sequelizerc ./
COPY src/application/databases ./src/application/databases

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application with migrations and seeding
CMD ["sh", "-c", "npm run db:migrate && npm run db:seed && npm run start"]
