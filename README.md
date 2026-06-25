# Node.js MVC Architecture with TypeScript

A clean and scalable Node.js application built with TypeScript following the MVC (Model-View-Controller) architecture pattern with Sequelize ORM, MySQL database, and comprehensive API documentation.

## Features

### Core Features
- **TypeScript** - Full type safety and modern JavaScript features
- **MVC Architecture** - Clean separation of concerns with layered architecture
- **Express.js 5** - Fast, minimalist web framework
- **Sequelize ORM** - Powerful SQL ORM with MySQL support
- **RESTful API** - Well-structured API endpoints with proper HTTP methods

### Security & Performance
- **Helmet** - Security headers middleware
- **Rate Limiting** - Protect against brute-force attacks (100 requests per 15 minutes)
- **Bcrypt** - Secure password hashing
- **Request Validation** - Zod schema validation for all inputs
- **Error Handling** - Centralized error handling middleware

### Development Experience
- **Hot Reload** - Nodemon with ts-node for development
- **Path Aliases** - Clean imports with TypeScript path mapping
- **Winston Logger** - Structured logging with file rotation
- **Swagger UI** - Interactive API documentation at `/api-docs`
- **Docker Support** - Containerized development and production environments

### Database Features
- **Sequelize CLI** - Database migrations and seeders
- **Connection Pooling** - Optimized database connections
- **Replication Support** - Read/write splitting capability
- **Health Checks** - Database connection monitoring
- **Graceful Shutdown** - Proper cleanup on process termination

## Project Structure

```
node-architecture/
├── src/
│   ├── application/               # Application layer
│   │   ├── config/               # Configuration files
│   │   │   ├── sequelize/        # Sequelize setup & database connection
│   │   │   └── logger.ts         # Winston logger configuration
│   │   ├── controllers/          # Request handlers (Controller layer)
│   │   │   └── auth.controller.ts
│   │   ├── services/             # Business logic layer
│   │   │   └── auth.service.ts
│   │   ├── models/               # Sequelize models (Model layer)
│   │   │   └── user-master.model.ts
│   │   ├── routes/               # Route definitions
│   │   │   ├── index.ts
│   │   │   └── auth.routes.ts
│   │   ├── middleware/           # Custom middleware
│   │   │   ├── errorHandler.ts
│   │   │   ├── validateRequest.ts
│   │   │   └── logger.ts
│   │   ├── validations/          # Zod validation schemas
│   │   │   └── auth.schema.ts
│   │   ├── databases/            # Database-specific files
│   │   │   └── sequelize/
│   │   │       ├── migrations/   # Database migrations
│   │   │       ├── seeders/      # Database seeders
│   │   │       └── config.js     # Sequelize CLI config
│   │   ├── interfaces/           # TypeScript interfaces
│   │   ├── helpers/              # Helper functions
│   │   └── constants/            # Application constants
│   ├── domain/                   # Domain layer
│   │   └── errors/               # Custom error classes
│   ├── environment/              # Environment configurations
│   │   ├── local.ts
│   │   ├── dev.ts
│   │   └── prod.ts
│   ├── config.ts                # Main configuration loader
│   ├── swagger.ts               # Swagger/OpenAPI configuration
│   ├── app.ts                   # Express app setup
│   └── server.ts                # Application entry point
├── dist/                        # Compiled JavaScript (production build)
├── logs/                        # Application logs
├── docker/                      # Docker-related files
├── .env.example                 # Environment variables template
├── .sequelizerc                 # Sequelize CLI configuration
├── docker-compose.yml           # Docker Compose configuration
├── Dockerfile                   # Multi-stage Docker build
├── tsconfig.json                # TypeScript configuration
├── nodemon.json                 # Nodemon configuration
└── package.json                 # Project dependencies & scripts
```

## Prerequisites

### For Local Development
- Node.js >= 24.0.0 (recommended LTS version)
- npm or yarn
- MySQL 8.0+ (or use Docker)

### For Docker Development
- Docker 20.10+
- Docker Compose 2.0+

> See [docker-install.sh](docker-install.sh) for automated Docker installation script

## Installation

### Option 1: Local Development

Run the application directly on your machine:

1. **Clone the repository:**
```bash
git clone https://github.com/Vinoddhakad18/node-architecture.git
cd node-architecture
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**
```bash
cp .env.example .env
```

Edit `.env` file with your MySQL database credentials:
```env
NODE_ENV=local
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=myapp
DB_USER=appuser
DB_PASSWORD=apppassword
```

4. **Run database migrations:**
```bash
npm run db:migrate
```

5. **Seed the database (optional):**
```bash
npm run db:seed
```

6. **Start development server:**
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

**Quick start with fresh database:**
```bash
npm run dev:fresh  # Runs migrations, seeds, and starts dev server
```

### Option 2: Docker Development (Recommended)

Run the application in a Docker container with hot reload:

```bash
# Start development environment
npm run docker:local

# Or manually with docker-compose
docker compose --env-file .env up --build
docker compose up
```

The application will be available at `http://localhost:3000`

To stop:
```bash
npm run docker:dev:down

# Or manually
docker compose down
```

### Option 3: Docker Production

Build and run the production-ready Docker image:

```bash

## Available Scripts

### Development Scripts
- `npm run dev` - Start development server with hot reload
- `npm run dev:fresh` - Run migrations, seed database, and start dev server
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production build
- `npm run start:migrate` - Run migrations and start production server
- `npm run start:fresh` - Run migrations, seed, and start production server
- `npm run clean` - Remove build directory


### Database Scripts (Sequelize CLI)
- `npm run db:migrate` - Run pending migrations
- `npm run db:migrate:undo` - Revert last migration
- `npm run db:migrate:undo:all` - Revert all migrations
- `npm run db:migrate:status` - Check migration status
- `npm run db:seed` - Run all seeders
- `npm run db:seed:undo` - Undo last seeder
- `npm run db:seed:undo:all` - Undo all seeders
- `npm run db:reset` - Reset database (undo all, migrate, seed)
- `npm run migration:create -- --name <migration-name>` - Create new migration
- `npm run seed:create -- --name <seed-name>` - Create new seeder

## API Endpoints

The API is accessible at `http://localhost:3000/api/v1` by default.

### API Documentation
- **Swagger UI**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **Swagger JSON**: [http://localhost:3000/api-docs.json](http://localhost:3000/api-docs.json)
- **Health Check**: [http://localhost:3000/health](http://localhost:3000/health)

### Authentication API (`/api/v1/auth`)

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register a new user | `{ email, password, name, role? }` |
| POST | `/auth/login` | Login user | `{ email, password }` |
| GET | `/auth/profile/:id` | Get user profile | - |
| PUT | `/auth/profile/:id` | Update user profile | `{ email?, name?, role? }` |
| DELETE | `/auth/profile/:id` | Delete user account | - |
| POST | `/auth/change-password/:id` | Change password | `{ oldPassword, newPassword }` |
| GET | `/auth/users` | Get all users (paginated) | Query: `page`, `limit` |

### Example Requests

```bash
# Register a new user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123",
    "name": "John Doe",
    "role": "user"
  }'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123"
  }'

# Get user profile
curl http://localhost:3000/api/v1/auth/profile/1

# Get all users (with pagination)
curl "http://localhost:3000/api/v1/auth/users?page=1&limit=10"

# Health check
curl http://localhost:3000/health
```

### Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error message",
  "errors": [ ... ]
}
```

## Architecture Overview

This project follows a **layered MVC architecture** with clear separation of concerns:

### 1. Model Layer ([src/application/models/](src/application/models/))
- **Sequelize Models**: Define database schema and relationships
- **Data Validation**: Built-in Sequelize validators
- **Database Operations**: ORM-based queries and mutations
- Example: [user-master.model.ts](src/application/models/user-master.model.ts)

### 2. Controller Layer ([src/application/controllers/](src/application/controllers/))
- **Request Handling**: Process HTTP requests
- **Response Formatting**: Structure API responses
- **Input Validation**: Coordinate with validation layer
- **Error Handling**: Catch and format errors
- Example: [auth.controller.ts](src/application/controllers/auth.controller.ts)

### 3. Service Layer ([src/application/services/](src/application/services/))
- **Business Logic**: Core application logic
- **Data Processing**: Transform and process data
- **External Services**: Third-party API integration
- **Reusability**: Shared logic across controllers
- Example: [auth.service.ts](src/application/services/auth.service.ts)

### 4. Route Layer ([src/application/routes/](src/application/routes/))
- **Endpoint Definitions**: Map URLs to controllers
- **Middleware Chaining**: Apply validation and authentication
- **Route Organization**: Modular route definitions
- Example: [auth.routes.ts](src/application/routes/auth.routes.ts)

### 5. Middleware Layer ([src/application/middleware/](src/application/middleware/))
- **Request Validation**: Zod schema validation
- **Error Handling**: Centralized error processing
- **Logging**: Request/response logging
- **Security**: Authentication and authorization

### 6. Domain Layer ([src/domain/](src/domain/))
- **Custom Errors**: Application-specific error classes
- **Domain Models**: Business domain entities
- **Value Objects**: Immutable domain values

## Technology Stack

### Core Technologies
- **Runtime**: Node.js 24 LTS
- **Language**: TypeScript 5.9
- **Framework**: Express.js 5.1
- **ORM**: Sequelize 6.37
- **Database**: MySQL 8.0+

### Libraries & Tools
- **Validation**: Zod 4.1
- **Authentication**: bcryptjs 3.0
- **Logging**: Winston 3.18
- **API Docs**: Swagger (swagger-jsdoc, swagger-ui-express)
- **Security**: Helmet, express-rate-limit
- **Development**: Nodemon, ts-node

### DevOps
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose
- **Base Image**: Node 24 Alpine Linux

## Environment Configuration

The project supports multiple environments through environment-specific configuration files:

### Environment Files
- `.env.example` - Template with all available variables
- `.env` - Local development (not committed)
- `.env.development` - Docker development
- `.env.production` - Docker production

### Key Environment Variables

```bash
# Application
NODE_ENV=local|development|production
PORT=3000
BUILD_TARGET=local|development|production

# Database Connection
DB_HOST=localhost           # Use 'mysql' for Docker
DB_PORT=3306
DB_NAME=myapp
DB_USER=appuser
DB_PASSWORD=apppassword
DB_DIALECT=mysql

# Database Replication (Optional)
DB_REPLICATION=false
DB_WRITE_HOST=mysql-master
DB_READ_HOSTS=mysql-replica-1,mysql-replica-2

# Database Pool Configuration
DB_POOL_MAX=10
DB_POOL_MIN=0
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000

# Database Options
DB_LOGGING=false
DB_TIMEZONE=+00:00
DB_CHARSET=utf8mb4
```

See [.env.example](.env.example) for complete configuration options.

## Database Management

### Sequelize CLI

This project uses Sequelize CLI for database migrations and seeders.

**Configuration**: [.sequelizerc](.sequelizerc)

### Creating Migrations

```bash
# Create a new migration
npm run migration:create -- --name create-users-table

# This creates: src/application/databases/sequelize/migrations/<timestamp>-create-users-table.js
```

### Creating Seeders

```bash
# Create a new seeder
npm run seed:create -- --name seed-admin-user

# This creates: src/application/databases/sequelize/seeders/<timestamp>-seed-admin-user.js
```

### Migration Workflow

```bash
# Check migration status
npm run db:migrate:status

# Run pending migrations
npm run db:migrate

# Rollback last migration
npm run db:migrate:undo

# Rollback all migrations
npm run db:migrate:undo:all

# Complete database reset
npm run db:reset  # Undo all → Migrate → Seed
```

## Development Workflow

### Local Development
```bash
# Start with hot reload
npm run dev

# Start with fresh database
npm run dev:fresh  # Migrates + Seeds + Starts
```

### Building for Production
```bash
# Clean previous build
npm run clean

# Compile TypeScript
npm run build

# Run production build
npm start

# Or with migrations
npm run start:migrate
```

## Docker Deployment

This project uses a **unified Docker configuration** with multi-stage builds that automatically adapts to development or production environments.

### Docker Files

- [Dockerfile](Dockerfile) - Multi-stage build (development + production)
- [docker-compose.yml](docker-compose.yml) - Unified compose configuration
- [.env.development](.env.development) - Development environment variables
- [.env.production](.env.production) - Production environment variables
- [.dockerignore](.dockerignore) - Excluded files from Docker context
- [docker-install.sh](docker-install.sh) - Automated Docker installation script

### Quick Start with Docker

#### Development Mode (Recommended)
```bash
# Start development environment with MySQL
npm run docker:dev

# Or rebuild and start
npm run docker:dev:build

# View logs
npm run docker:logs

# Stop containers
npm run docker:dev:down
```

**Features:**
- Hot reload enabled (source code mounted as volume)
- MySQL database container included
- Development dependencies included
- Runs as root user for file permissions
- Port 3000 exposed

#### Production Mode
```bash
# Start production environment (detached)
npm run docker:prod

# Or rebuild and start
npm run docker:prod:build

# View logs
npm run docker:logs

# Stop containers
npm run docker:prod:down
```

**Features:**
- Optimized build size (~200-250 MB)
- Only production dependencies
- Runs as non-root user (nodejs)
- Health checks enabled
- Minimal Alpine Linux base

### Docker Installation Script

For automated Docker and Docker Compose installation:

```bash
# Make executable
chmod +x docker-install.sh

# Run installation
./docker-install.sh
```

Supports Ubuntu/Debian systems.

### Environment-Based Configuration

| Feature | Development | Production |
|---------|------------|------------|
| Build Target | `development` | `production` |
| Base Image | node:24-alpine | node:24-alpine |
| Volume Mount | `./src` → `/app/src` | `./logs` → `/app/logs` |
| User | root | nodejs (non-root) |
| Hot Reload | ✅ Yes | ❌ No |
| Dependencies | All (dev + prod) | Production only |
| Health Check | ❌ Disabled | ✅ Enabled |
| Port | 3000 | 3000 |
| Mode | Foreground | Detached (-d) |

### Manual Docker Commands

#### Build Images
```bash
# Development
docker-compose --env-file .env.development build

# Production
docker-compose --env-file .env.production build

# Build specific stage
docker build --target development -t node-mvc-app:dev .
docker build --target production -t node-mvc-app:prod .
```

#### Run Containers
```bash
# Development (interactive)
docker-compose --env-file .env.development up

# Production (detached)
docker-compose --env-file .env.production up -d

# Run with custom env file
docker-compose --env-file .env.custom up
```

#### Container Management
```bash
# Check container status
docker ps -a

# View container logs
docker-compose logs -f app

# Execute command in container
docker-compose exec app npm run db:migrate

# Stop all containers
docker-compose down

# Remove containers, volumes, and images
npm run docker:clean
```

### Docker Health Checks

Production containers include health checks:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"
```

Check health status:
```bash
docker ps
# Look for "healthy" status

docker inspect --format='{{json .State.Health}}' <container_id>
```

### Docker Best Practices Used

1. **Multi-stage builds** - Separate dev and prod stages
2. **Layer caching** - Optimized layer ordering (dependencies first)
3. **Minimal base image** - Alpine Linux for smaller size
4. **Non-root user** - Production runs as nodejs user
5. **Health checks** - Automatic container health monitoring
6. **.dockerignore** - Exclude unnecessary files
7. **Environment-based** - Single configuration for all environments
8. **Volume mounts** - Source code in dev, logs in prod

## Logging

The application uses **Winston** for structured logging with file rotation.

### Log Locations
- **Combined logs**: `logs/combined.log` - All log levels
- **Error logs**: `logs/error.log` - Error level only
- **Console**: Development environment (colorized output)

### Log Configuration

Located in [src/application/config/logger.ts](src/application/config/logger.ts)

```typescript
// Log levels: error, warn, info, http, debug
logger.info('Information message');
logger.error('Error message', error);
logger.warn('Warning message');
logger.debug('Debug message');
```

### Accessing Logs in Docker

```bash
# View application logs
npm run docker:logs

# Or manually
docker-compose logs -f app

# View logs inside container
docker-compose exec app ls -la logs/
docker-compose exec app tail -f logs/combined.log
```

## Swagger API Documentation

Interactive API documentation is available via Swagger UI.

### Accessing Swagger

- **Development**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **Swagger JSON**: [http://localhost:3000/api-docs.json](http://localhost:3000/api-docs.json)

### Features

- **Interactive testing** - Try API endpoints directly from browser
- **Request/Response schemas** - View data structures
- **Authentication** - Bearer token and API key support
- **Export** - Download OpenAPI spec as JSON

### Configuration

Swagger is configured in [src/swagger.ts](src/swagger.ts) with:
- OpenAPI 3.0 specification
- JSDoc comments in routes/controllers
- Reusable components and schemas
- Security schemes (Bearer, API Key)

For detailed Swagger documentation, see [SWAGGER_GUIDE.md](SWAGGER_GUIDE.md)

## TypeScript Path Aliases

The project uses TypeScript path aliases for cleaner imports:

```typescript
// Instead of: import { User } from '../../../application/models/user-master.model'
// Use this:
import { User } from '@models/user-master.model';

// Available aliases (configured in tsconfig.json):
'@/*'              // src/*
'@application/*'   // src/application/*
'@config/*'        // src/application/config/*
'@constants/*'     // src/application/constants/*
'@controllers/*'   // src/application/controllers/*
'@helpers/*'       // src/application/helpers/*
'@interfaces/*'    // src/application/interfaces/*
'@middleware/*'    // src/application/middleware/*
'@models/*'        // src/application/models/*
'@routes/*'        // src/application/routes/*
'@environment/*'   // src/environment/*
```

## Troubleshooting

### Common Issues

#### Database Connection Failed

**Problem**: `Unable to connect to the database`

**Solutions**:
```bash
# Check if MySQL is running (local)
mysql -u root -p

# Check Docker container status
docker ps -a

# Verify environment variables
cat .env | grep DB_

# Test connection manually
docker-compose exec app npm run db:migrate:status
```

#### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions**:
```bash
# Find process using port 3000
lsof -i :3000
# or
netstat -ano | findstr :3000  # Windows

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=3001
```

#### Migration Errors

**Problem**: Migrations fail or don't run

**Solutions**:
```bash
# Check migration status
npm run db:migrate:status

# Manually run migrations
npx sequelize-cli db:migrate

# Reset database (WARNING: deletes data)
npm run db:reset

# Check Sequelize config
cat src/application/databases/sequelize/config.js
```

#### TypeScript Path Alias Not Working

**Problem**: Cannot find module '@models/...'

**Solutions**:
```bash
# Rebuild TypeScript
npm run build

# Check tsconfig.json paths configuration
cat tsconfig.json

# For runtime (ts-node), ensure tsconfig-paths is configured
```

#### Docker Build Issues

**Problem**: Docker build fails or is slow

**Solutions**:
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Check Docker disk space
docker system df

# Remove unused images
docker image prune -a
```

## Additional Resources

### Documentation Files
- [DOCKER.md](DOCKER.md) - Detailed Docker documentation
- [DOCKER-MIGRATION.md](DOCKER-MIGRATION.md) - Docker migration guide
- [SWAGGER_GUIDE.md](SWAGGER_GUIDE.md) - Swagger implementation guide

### Useful Links
- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [Express.js Documentation](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zod Documentation](https://zod.dev/)
- [Winston Logger](https://github.com/winstonjs/winston)
- [Docker Documentation](https://docs.docker.com/)

## Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Follow the coding standards**:
   - Use TypeScript strict mode
   - Follow existing code structure
   - Add proper JSDoc comments
   - Use path aliases for imports
4. **Test your changes**:
   - Ensure no TypeScript errors: `npm run build`
   - Test locally: `npm run dev`
   - Test with Docker: `npm run docker:dev`
5. **Commit your changes**:
   - Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, etc.
   - Example: `git commit -m "feat: add user authentication endpoint"`
6. **Push to your fork**: `git push origin feature/your-feature-name`
7. **Create a Pull Request**

### Code Style

- Use **2 spaces** for indentation
- Use **async/await** over callbacks
- Use **arrow functions** where appropriate
- Keep functions **small and focused**
- Add **error handling** for all async operations
- Use **TypeScript types** (avoid `any` unless necessary)

## Security Considerations

### Implemented Security Measures

- **Helmet** - Sets secure HTTP headers
- **Rate Limiting** - Prevents brute-force attacks
- **Password Hashing** - bcrypt with salt rounds
- **Input Validation** - Zod schema validation
- **SQL Injection Protection** - Sequelize parameterized queries
- **CORS** - Configured for specific origins (in production)
- **Environment Variables** - Sensitive data not hardcoded
- **Non-root Docker User** - Production containers run as nodejs user

### Security Best Practices

1. **Never commit** `.env` files or secrets
2. **Use environment variables** for sensitive configuration
3. **Keep dependencies updated**: `npm audit` and `npm update`
4. **Enable HTTPS** in production (reverse proxy)
5. **Implement authentication** middleware for protected routes
6. **Set strong database passwords** in production
7. **Enable database SSL** in production
8. **Regular security audits**: `npm audit fix`

## Performance Optimization

### Database

- **Connection Pooling** - Configured in Sequelize
- **Indexes** - Add to frequently queried columns
- **Replication** - Read/write splitting capability
- **Query Optimization** - Use `.findOne()` vs `.findAll()` appropriately
- **Eager Loading** - Use `include` to avoid N+1 queries

### Application

- **Caching** - Implement Redis for frequently accessed data (future)
- **Compression** - Add compression middleware (future)
- **Load Balancing** - Multiple instances with PM2 or Kubernetes
- **Static Assets** - Serve via CDN in production
- **Monitoring** - Add APM tools (New Relic, DataDog, etc.)

### Docker

- **Multi-stage builds** - Smaller production images
- **Layer caching** - Optimized Dockerfile layer order
- **Alpine base** - Minimal Linux distribution
- **Health checks** - Automatic container restart on failure

## License

ISC License

Copyright (c) 2024

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

---

**Built with ❤️ using Node.js, TypeScript, and Express.js**

For issues, questions, or contributions, please visit the [GitHub repository](https://github.com/Vinoddhakad18/node-architecture).
