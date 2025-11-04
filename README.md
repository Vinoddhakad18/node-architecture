# Node.js MVC Architecture with TypeScript

A clean and scalable Node.js application built with TypeScript following the MVC (Model-View-Controller) architecture pattern.

## Features

- TypeScript for type safety
- MVC architecture pattern
- Express.js framework
- RESTful API design
- Error handling middleware
- Request logging
- Modular structure
- Docker support with Node.js 24 LTS
- Multi-stage Docker builds for optimized production images
- Development and production Docker configurations

## Project Structure

```
src/
├── config/          # Application configuration
├── controllers/     # Request handlers (Controller layer)
├── models/          # Data models and business logic (Model layer)
├── views/           # Response formatting (View layer for APIs)
├── routes/          # Route definitions
├── middleware/      # Custom middleware
├── utils/           # Utility functions
├── app.ts          # Express app configuration
└── server.ts       # Server entry point
```

## Prerequisites

- Node.js 24 LTS (or Node.js >= 18)
- npm or yarn

**OR**

- Docker and Docker Compose (for containerized deployment)

## Installation

### Option 1: Local Development

Run the application directly on your machine:

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

### Option 2: Docker Development (Recommended)

Run the application in a Docker container with hot reload:

```bash
# Start development environment
npm run docker:dev

# Or manually with docker-compose
docker-compose --env-file .env.development up
```

The application will be available at `http://localhost:3000`

To stop:
```bash
npm run docker:dev:down
```

### Option 3: Docker Production

Build and run the production-ready Docker image:

```bash
# Start production environment (detached mode)
npm run docker:prod

# Or manually with docker-compose
docker-compose --env-file .env.production up -d
```

View logs:
```bash
npm run docker:logs
```

Stop the container:
```bash
npm run docker:prod:down
```

## Available Scripts

### Local Development Scripts

- `npm run dev` - Run in development mode with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production build
- `npm run clean` - Clean build directory

### Docker Scripts

- `npm run docker:dev` - Start development environment with Docker
- `npm run docker:dev:build` - Rebuild and start development environment
- `npm run docker:dev:down` - Stop development environment
- `npm run docker:prod` - Start production environment with Docker
- `npm run docker:prod:build` - Rebuild and start production environment
- `npm run docker:prod:down` - Stop production environment
- `npm run docker:logs` - View container logs
- `npm run docker:clean` - Remove all containers, images, and volumes

## API Endpoints

### Users API

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Example Request

```bash
# Get all users
curl http://localhost:3000/api/users

# Create a new user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'
```

## MVC Architecture

### Model Layer
- Contains data structures and business logic
- Handles data validation
- Simulates database operations (in this example)
- Located in: [src/models/](src/models/)

### View Layer
- Formats responses for the client
- Provides consistent API response structure
- Located in: [src/views/](src/views/)

### Controller Layer
- Handles HTTP requests
- Coordinates between Models and Views
- Contains request validation
- Located in: [src/controllers/](src/controllers/)

## Development

Run in development mode with auto-reload:
```bash
npm run dev
```

## Production Build

Build and run for production:
```bash
npm run build
npm start
```

## Docker

This project uses a **unified Docker configuration** that switches between development and production modes based on environment variables.

### Docker Files

- `Dockerfile` - Unified multi-stage Dockerfile for both dev and prod
- `docker-compose.yml` - Unified compose file with environment-based configuration
- `.env.development` - Development environment variables
- `.env.production` - Production environment variables
- `.dockerignore` - Files to exclude from Docker builds

### Quick Start

**Development mode (with hot reload):**
```bash
npm run docker:dev
```

**Production mode:**
```bash
npm run docker:prod
```

### Environment-Based Configuration

The Docker setup automatically adapts based on the `NODE_ENV` variable:

| Environment | Build Target | Volume Mount | User | Hot Reload |
|-------------|-------------|--------------|------|------------|
| Development | `development` | Source code (`./src`) | root | Yes |
| Production | `production` | Logs only (`./logs`) | nodejs (non-root) | No |

### Manual Docker Commands

**Build for specific environment:**
```bash
# Development
docker-compose --env-file .env.development build

# Production
docker-compose --env-file .env.production build
```

**Run container:**
```bash
# Development
docker-compose --env-file .env.development up

# Production
docker-compose --env-file .env.production up -d
```

**Build specific stage manually:**
```bash
# Development image
docker build --target development -t node-mvc-app:dev .

# Production image
docker build --target production -t node-mvc-app:prod .
```

### Docker Features

- **Unified configuration** - Single Dockerfile and docker-compose.yml for all environments
- **Multi-stage build** - Optimized production image size (~200-250 MB)
- **Environment-based** - Automatically switches between dev/prod using env files
- **Non-root user** - Enhanced security in production (runs as nodejs user)
- **Health checks** - Automatic health monitoring in production
- **Alpine Linux** - Minimal base image for smaller footprint
- **Hot reload** - Development mode supports live code changes
- **Layer caching** - Faster builds with optimized layer ordering

## License

ISC
