# Node Art - Production-Grade Node.js Backend

A comprehensive, production-ready Node.js 24 LTS backend architecture built with TypeScript, featuring REST APIs, GraphQL, multiple databases, authentication, encryption, and complete enterprise features.

## Features

### Core Technologies
- **Node.js 24 LTS** with **TypeScript** (strict mode)
- **Express.js** for REST API
- **Apollo Server** for GraphQL
- **Sequelize ORM** for MySQL with migrations & seeders
- **Mongoose** for MongoDB
- **Redis** for caching and session storage

### Security
- **JWT Authentication** (access & refresh tokens)
- **Role-Based Access Control (RBAC)** - Admin, User, Moderator
- **bcrypt** password hashing
- **AES-256-CBC** encryption/decryption utilities
- **Helmet** security headers
- **CORS** configuration
- **Rate Limiting** (general & auth-specific)
- **Input Validation** with Zod

### Developer Experience
- **Path aliases** (@routes, @services, @models, etc.)
- **ESLint** & **Prettier** for code quality
- **Husky** & **Lint-Staged** for pre-commit hooks
- **Jest** for testing with coverage
- **Winston** for structured logging
- **Swagger/OpenAPI 3.0** documentation

### DevOps
- **Docker** & **Docker Compose** support
- **Multi-stage builds** for optimized images
- **Health checks** for all services
- **Environment-based configuration** (local, dev, ppd, prod)
- **Graceful shutdown** handling

## Project Structure

```
src/
├── routes/              # API route definitions
├── controllers/         # Request handlers
├── services/            # Business logic
├── repositories/        # Data access layer
├── database/
│   ├── models/         # Sequelize & Mongoose models
│   ├── migrations/     # Database migrations
│   └── seeders/        # Database seeders
├── middleware/          # Custom middleware
│   ├── auth.ts         # JWT authentication
│   ├── rbac.ts         # Role-based access control
│   ├── security.ts     # Security middleware
│   ├── validation.ts   # Request validation
│   ├── encryption.ts   # Encryption middleware
│   └── errorHandler.ts # Error handling
├── utils/               # Utility functions
│   ├── jwt.ts          # JWT utilities
│   ├── encryption.ts   # Encryption utilities
│   └── logger.ts       # Winston logger
├── config/              # Configuration
│   ├── env/            # Environment configs
│   │   ├── local.ts
│   │   ├── dev.ts
│   │   ├── ppd.ts
│   │   └── prod.ts
│   ├── index.ts        # Config loader
│   ├── database.js     # Sequelize config
│   └── swagger.ts      # Swagger setup
├── graphql/
│   ├── schema/         # GraphQL schemas
│   └── resolvers/      # GraphQL resolvers
├── const/              # Constants
├── tests/              # Test files
└── app.ts              # Application entry point
```

## Quick Start

### Prerequisites
- Node.js 24+ and npm 10+
- Docker & Docker Compose (for containerized setup)
- MySQL 8.0+, MongoDB 7+, Redis 7+ (if running locally)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd node-art
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example file
   cp .env.example .env

   # Edit .env with your configuration
   # IMPORTANT: Generate secure secrets for production!
   ```

4. **Run with Docker (Recommended)**
   ```bash
   # Development environment
   docker-compose --env-file .env.dev.example up --build

   # Or for local development
   docker-compose up --build
   ```

5. **Or run locally**
   ```bash
   # Make sure MySQL, MongoDB, and Redis are running locally

   # Run migrations
   npm run migrate

   # Seed database (optional)
   npm run seed

   # Start development server
   npm run dev
   ```

## Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run dev:env          # Start with specific NODE_ENV

# Build
npm run build            # Compile TypeScript to JavaScript

# Production
npm start                # Start production server
npm run start:dev        # Start with dev environment
npm run start:ppd        # Start with pre-prod environment

# Database
npm run migrate          # Run migrations
npm run migrate:undo     # Rollback last migration
npm run seed             # Run seeders
npm run seed:undo        # Undo seeders

# Testing
npm test                 # Run tests with coverage
npm run test:watch       # Run tests in watch mode
npm run test:ci          # Run tests in CI mode

# Code Quality
npm run lint             # Lint code
npm run lint:fix         # Lint and fix
npm run format           # Format code with Prettier
npm run format:check     # Check formatting

# Documentation
npm run docs:generate    # Generate API documentation
```

## Environment Configuration

The application supports multiple environments with dynamic configuration loading:

- **local** - Local development
- **dev** - Development server
- **ppd** - Pre-production
- **production** - Production

Environment variables are loaded from `.env` file and override default values in `src/config/env/`.

### Critical Environment Variables

```bash
# JWT Secrets (MUST be unique and strong in production)
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-key

# Encryption (32 chars for key, 16 for IV)
ENCRYPTION_KEY=your-32-character-encryption-key
ENCRYPTION_IV=your-16-char-iv-k

# Database
MYSQL_HOST=localhost
MYSQL_PASSWORD=your-password
MONGODB_URI=mongodb://localhost:27017/dbname
REDIS_PASSWORD=your-redis-password
```

## API Documentation

### REST API
- **Swagger UI**: `http://localhost:3000/api-docs`
- **OpenAPI Spec**: `http://localhost:3000/api-docs.json`

### GraphQL
- **GraphQL Playground**: `http://localhost:3000/graphql`

### Health Check
- **Endpoint**: `GET /api/health`

## Authentication

The API uses JWT-based authentication with access and refresh tokens.

### Register
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!"
}
```

### Using Protected Routes
```bash
GET /api/auth/profile
Authorization: Bearer <access_token>
```

## Testing

Run tests with coverage:
```bash
npm test
```

The project includes:
- Unit tests for utilities (JWT, encryption)
- Integration tests for API endpoints
- GraphQL resolver tests

## Docker Deployment

### Development
```bash
docker-compose --env-file .env.dev.example up --build
```

### Production
```bash
# Use production environment file
docker-compose --env-file .env.prod up -d
```

### Services
- **app**: Node.js application (port 3000)
- **mysql**: MySQL database (port 3307)
- **mongodb**: MongoDB database (port 27017)
- **redis**: Redis cache (port 6379)

## Security Best Practices

1. **Never commit .env files** - Use .env.example templates
2. **Use strong secrets** - Generate cryptographically secure random strings
3. **Enable HTTPS** in production
4. **Keep dependencies updated** - Run `npm audit` regularly
5. **Use environment variables** for all secrets
6. **Enable rate limiting** - Already configured
7. **Validate all inputs** - Zod schemas provided
8. **Use RBAC** - Implement proper authorization

## Database Migrations

Create a new migration:
```bash
npx sequelize-cli migration:generate --name migration-name
```

Run migrations:
```bash
npm run migrate
```

Rollback:
```bash
npm run migrate:undo
```

## Logging

Logs are stored in the `logs/` directory:
- `error-YYYY-MM-DD.log` - Error logs
- `combined-YYYY-MM-DD.log` - All logs
- Console output (configurable per environment)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT

## Support

For issues and questions, please open an issue on the repository.
