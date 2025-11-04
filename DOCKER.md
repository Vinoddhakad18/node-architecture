# Docker Quick Reference

## Overview

This project uses a unified Docker configuration with a single Dockerfile and docker-compose.yml that automatically adapts between development and production modes based on environment variables.

## Quick Start

### Development Mode (with hot reload)
```bash
npm run docker:dev
```

### Production Mode
```bash
npm run docker:prod
```

## NPM Docker Scripts

| Command | Description |
|---------|-------------|
| npm run docker:dev | Start development environment |
| npm run docker:dev:build | Rebuild and start development |
| npm run docker:dev:down | Stop development environment |
| npm run docker:prod | Start production environment (detached) |
| npm run docker:prod:build | Rebuild and start production |
| npm run docker:prod:down | Stop production environment |
| npm run docker:logs | View container logs |
| npm run docker:clean | Remove all containers, images, and volumes |

## Environment Files

- .env.development - Development configuration (NODE_ENV=development)
- .env.production - Production configuration (NODE_ENV=production)

## Development Workflow

1. Start: npm run docker:dev
2. View logs: npm run docker:logs
3. Rebuild: npm run docker:dev:build
4. Stop: npm run docker:dev:down

## Production Deployment

1. Build and start: npm run docker:prod:build
2. Check status: docker-compose ps
3. View logs: npm run docker:logs
4. Stop: npm run docker:prod:down

## Manual Docker Commands

Build for specific environment:
```bash
docker build --target development -t node-mvc-app:dev .
docker build --target production -t node-mvc-app:prod .
```

Run with docker-compose:
```bash
docker-compose --env-file .env.development up
docker-compose --env-file .env.production up -d
```

## Container Management

Access shell: docker exec -it node-mvc-app-development sh
View logs: docker logs -f node-mvc-app-development
Stop: docker stop node-mvc-app-development
Remove: docker rm node-mvc-app-development

## Troubleshooting

Port in use: Change PORT in .env file
Container restarts: Check logs with npm run docker:logs
Node modules: Rebuild with npm run docker:dev:build --no-cache
Hot reload not working: Ensure volumes are mounted correctly

## Clean Up

Remove project containers: npm run docker:clean
Remove all stopped containers: docker container prune
Remove unused images: docker image prune -a
Complete clean: docker system prune -a --volumes

