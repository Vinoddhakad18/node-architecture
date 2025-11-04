# Docker Configuration Migration Summary

## What Changed

The Docker setup has been unified from separate dev/prod files into a single environment-based configuration.

### Before (Multiple Files)
- Dockerfile (production only)
- Dockerfile.dev (development only)
- docker-compose.yml (production)
- docker-compose.dev.yml (development)

### After (Unified Configuration)
- Dockerfile (unified with 5 stages)
- docker-compose.yml (unified, environment-based)
- .env.development
- .env.production
- .env.example (updated)

## Key Changes

### 1. Unified Dockerfile
Single Dockerfile with 5 stages:
- base: Base Node.js 24 Alpine
- dependencies: Install all dependencies
- development: Dev stage with hot reload
- builder: Build TypeScript for production
- production: Minimal production runtime

### 2. Environment-Based docker-compose.yml
Uses environment variables to switch between modes:
- BUILD_TARGET: Determines which Docker stage to build
- NODE_ENV: Sets the environment mode
- VOLUME_SRC/VOLUME_TARGET: Dynamic volume mounting

### 3. Environment Files
- .env.development: Development configuration
- .env.production: Production configuration
- .env.example: Updated template

### 4. NPM Scripts (Added to package.json)
- npm run docker:dev - Start development
- npm run docker:dev:build - Rebuild and start dev
- npm run docker:dev:down - Stop dev
- npm run docker:prod - Start production
- npm run docker:prod:build - Rebuild and start prod
- npm run docker:prod:down - Stop prod
- npm run docker:logs - View logs
- npm run docker:clean - Clean up everything

## Migration Guide

If you were using the old setup:

### Old Command -> New Command

Development:
```bash
# Old
docker-compose -f docker-compose.dev.yml up

# New
npm run docker:dev
# or
docker-compose --env-file .env.development up
```

Production:
```bash
# Old
docker-compose up -d

# New
npm run docker:prod
# or
docker-compose --env-file .env.production up -d
```

## Benefits of Unified Configuration

1. Single Dockerfile to maintain
2. No code duplication
3. Environment-based switching
4. Easier to add new environments (staging, testing, etc.)
5. Simpler npm scripts
6. Better layer caching
7. Consistent build process

## Testing the Setup

Test development mode:
```bash
npm run docker:dev
```

Test production mode:
```bash
npm run docker:prod
curl http://localhost:3000/api
```

## Rollback (if needed)

The old files were removed. If you need them back, check git history:
```bash
git log --all --full-history -- Dockerfile.dev
git checkout <commit> -- Dockerfile.dev docker-compose.dev.yml
```
