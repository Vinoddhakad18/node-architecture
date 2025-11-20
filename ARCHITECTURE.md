# Architecture Documentation

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Folder Structure](#folder-structure)
- [Design Patterns](#design-patterns)
- [Application Layers](#application-layers)
- [Database Architecture](#database-architecture)
- [Authentication & Authorization](#authentication--authorization)
- [Caching Strategy](#caching-strategy)
- [API Structure](#api-structure)
- [Event System](#event-system)
- [File Storage](#file-storage)
- [Middleware Pipeline](#middleware-pipeline)
- [Configuration Management](#configuration-management)
- [Monitoring & Logging](#monitoring--logging)
- [Testing Strategy](#testing-strategy)

---

## Overview

This is a production-ready Node.js application built with TypeScript following clean architecture principles and the MVC pattern. The application is designed for scalability, maintainability, and testability with clear separation of concerns.

### Key Characteristics

- **Clean Architecture**: Layered design with clear responsibility boundaries
- **Type Safety**: Full TypeScript implementation with strict mode
- **API-First**: RESTful APIs with OpenAPI/Swagger documentation
- **Event-Driven**: Decoupled components via typed event emitter
- **Cache-First**: Redis caching for performance optimization
- **Observable**: Prometheus metrics and structured logging

---

## Technology Stack

| Category | Technology | Version |
|----------|------------|---------|
| Runtime | Node.js | >= 24.0.0 |
| Language | TypeScript | 5.x |
| Framework | Express.js | 5.x |
| Database | MySQL | 8.x |
| ORM | Sequelize | 6.x |
| Cache | Redis (ioredis) | 5.x |
| Validation | Zod | 4.x |
| Auth | JWT (jsonwebtoken) | 9.x |
| Logging | Winston | 3.x |
| Metrics | Prometheus (prom-client) | 15.x |
| APM | New Relic | 13.x |
| Testing | Jest + Supertest | 30.x |
| Docs | Swagger (OpenAPI 3.0) | - |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Request                          │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Load Balancer / Nginx                      │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Express Application                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   Middleware Pipeline                    │    │
│  │  Security → Logging → Auth → Validation → Cache → Route │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Controller  │→ │   Service    │→ │  Repository  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │    Model     │  │    Cache     │  │   Events     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
    ┌──────────┐        ┌──────────┐        ┌──────────┐
    │  MySQL   │        │  Redis   │        │   S3     │
    └──────────┘        └──────────┘        └──────────┘
```

---

## Folder Structure

```
src/
├── server.ts                 # Entry point - starts HTTP server
├── app.ts                    # Express app factory & middleware setup
├── config.ts                 # Environment configuration loader
├── swagger.ts                # OpenAPI/Swagger configuration
│
├── application/              # Application layer (main business code)
│   ├── config/               # Configuration modules
│   │   ├── database/         # Sequelize connection & setup
│   │   ├── jwt/              # JWT configuration
│   │   ├── logger/           # Winston logger setup
│   │   ├── metrics/          # Prometheus metrics
│   │   ├── redis/            # Redis connection
│   │   └── storage/          # File storage providers
│   │
│   ├── constants/            # Application constants
│   │   ├── user.constants    # Roles, statuses
│   │   ├── http.constants    # HTTP codes
│   │   ├── cache.constants   # Cache keys & TTL
│   │   └── error.constants   # Error codes
│   │
│   ├── controllers/          # HTTP request handlers
│   │   ├── auth.controller
│   │   ├── country-master.controller
│   │   └── file-upload.controller
│   │
│   ├── databases/            # Database management
│   │   └── sequelize/
│   │       ├── config.js     # CLI configuration
│   │       ├── migrations/   # Schema migrations
│   │       └── seeders/      # Data seeders
│   │
│   ├── dtos/                 # Data Transfer Objects
│   │   ├── user.dto
│   │   ├── auth.dto
│   │   └── pagination.dto
│   │
│   ├── events/               # Event-driven architecture
│   │   ├── event-emitter     # Singleton event bus
│   │   ├── event-types       # Event definitions
│   │   └── handlers/         # Event handlers
│   │
│   ├── helpers/              # Utility helpers
│   │   └── redis.helper      # Redis service wrapper
│   │
│   ├── interfaces/           # TypeScript interfaces
│   │
│   ├── middleware/           # Express middleware
│   │   ├── auth              # JWT authentication
│   │   ├── cache             # Response caching
│   │   ├── errorHandler      # Global error handling
│   │   ├── requestId         # Request tracking
│   │   ├── responseHandler   # Standardized responses
│   │   └── validateRequest   # Zod validation
│   │
│   ├── models/               # Sequelize models
│   │   ├── user-master
│   │   ├── country-master
│   │   └── file-metadata
│   │
│   ├── repositories/         # Data access layer
│   │   ├── base.repository   # Generic CRUD
│   │   ├── user.repository
│   │   └── country.repository
│   │
│   ├── routes/               # API route definitions
│   │   ├── auth.routes
│   │   ├── country-master.routes
│   │   └── file-upload.routes
│   │
│   ├── services/             # Business logic layer
│   │   ├── auth.service
│   │   ├── country-master.service
│   │   └── file-upload.service
│   │
│   ├── utils/                # Utility functions
│   │   ├── jwt.util
│   │   └── uptime
│   │
│   └── validations/          # Zod schemas
│       ├── auth.schema
│       └── country-master.schema
│
├── domain/                   # Domain layer
│   └── errors/
│       └── AppError          # Custom error class
│
├── environment/              # Environment configs
│   ├── local.ts
│   ├── dev.ts
│   └── prod.ts
│
└── __tests__/                # Test suite
    ├── e2e/                  # End-to-end tests
    ├── helpers/              # Test utilities
    └── mocks/                # Test mocks
```

---

## Design Patterns

### 1. Repository Pattern

Abstraction layer between business logic and data access.

```typescript
// Base repository with generic CRUD
class BaseRepository<T> {
  findAll(options): Promise<T[]>
  findById(id): Promise<T | null>
  create(data): Promise<T>
  update(id, data): Promise<T>
  delete(id): Promise<boolean>
  withTransaction(callback): Promise<R>
}

// Specialized repository
class UserRepository extends BaseRepository<UserMaster> {
  findByEmail(email): Promise<UserMaster | null>
  updateLastLogin(id): Promise<void>
}
```

### 2. Service Layer Pattern

Encapsulates business logic, coordinating repositories and caching.

```typescript
class CountryMasterService {
  async create(data, userId) {
    // Transaction wrapper
    const country = await sequelize.transaction(async (t) => {
      return CountryMaster.create(data, { transaction: t });
    });
    // Cache invalidation
    await this.invalidateListCaches();
    return country;
  }
}
```

### 3. Factory Pattern

Storage provider creation based on configuration.

```typescript
class StorageFactory {
  static create(type: string): IStorageProvider {
    switch (type) {
      case 's3': return new S3StorageProvider();
      case 'local': return new LocalStorageProvider();
      default: throw new Error('Invalid storage type');
    }
  }
}
```

### 4. Strategy Pattern

Interchangeable storage implementations.

```typescript
interface IStorageProvider {
  upload(file, path): Promise<string>
  download(path): Promise<Buffer>
  delete(path): Promise<void>
  getSignedUrl(path, expires): Promise<string>
}
```

### 5. Singleton Pattern

Used for shared instances:
- RedisService
- EventEmitter
- Controllers
- Services

### 6. Event-Driven Architecture

Typed events for decoupled communication.

```typescript
// Event types
enum AppEventType {
  USER_CREATED = 'user:created',
  AUTH_LOGIN = 'auth:login',
  FILE_UPLOADED = 'file:uploaded'
}

// Event emission
eventEmitter.emit(AppEventType.USER_CREATED, { userId, email });
```

### 7. DTO Pattern

Data Transfer Objects for input/output structuring.

```typescript
class PaginatedResponseDTO<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
}
```

### 8. Cache-Aside Pattern

Check cache first, query database on miss, then populate cache.

```typescript
async findById(id) {
  const cached = await redis.get(key);
  if (cached) return cached;

  const data = await Model.findByPk(id);
  await redis.set(key, data, TTL);
  return data;
}
```

---

## Application Layers

### Controller Layer

Handles HTTP requests and responses.

```typescript
class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      res.sendSuccess(result, 'Login successful');
    } catch (error) {
      res.sendUnauthorized(getErrorMessage(error));
    }
  }
}
```

**Responsibilities:**
- Extract request data
- Call service methods
- Return standardized responses
- Handle errors with logging

### Service Layer

Contains business logic.

**Responsibilities:**
- Input validation
- Business rule enforcement
- Repository coordination
- Cache management
- Event emission
- Transaction handling

### Repository Layer

Data access abstraction.

**Responsibilities:**
- Database queries
- CRUD operations
- Query building
- Transaction support

### Model Layer

Data structure definitions.

```typescript
class UserMaster extends Model {
  // Hooks
  static hooks = {
    beforeCreate: async (user) => {
      user.password = await bcrypt.hash(user.password, 10);
    }
  }

  // Instance methods
  async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}
```

---

## Database Architecture

### Entity Relationship

```
┌─────────────────┐     ┌─────────────────┐
│   UserMaster    │     │ CountryMaster   │
├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │
│ email           │     │ code            │
│ password        │     │ name            │
│ first_name      │     │ is_active       │
│ last_name       │     │ created_by      │─┐
│ mobile          │     │ updated_by      │ │
│ role            │     └─────────────────┘ │
│ status          │                         │
│ last_login      │◄────────────────────────┘
│ created_at      │
│ updated_at      │     ┌─────────────────┐
│ deleted_at      │     │  FileMetadata   │
└─────────────────┘     ├─────────────────┤
                        │ id (PK)         │
                        │ original_name   │
                        │ storage_path    │
                        │ mime_type       │
                        │ size            │
                        │ uploaded_by     │
                        └─────────────────┘
```

### Migration Management

```bash
# Run all pending migrations
npm run db:migrate

# Rollback last migration
npm run db:migrate:undo

# Rollback all migrations
npm run db:migrate:undo:all

# Check migration status
npm run db:migrate:status

# Run seeders
npm run db:seed

# Reset database (undo all + migrate + seed)
npm run db:reset
```

### Connection Configuration

```typescript
const sequelize = new Sequelize({
  dialect: 'mysql',
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  retry: {
    max: 5
  }
});
```

---

## Authentication & Authorization

### JWT Token Flow

```
┌────────┐     ┌────────┐     ┌────────┐
│ Client │────▶│  API   │────▶│  Auth  │
└────────┘     └────────┘     │Service │
    │              │          └────────┘
    │              │               │
    │◀─────────────┼───────────────┘
    │  Access +    │
    │  Refresh     │
    │  Tokens      │
    ▼              │
┌────────┐         │
│ Client │─────────┘
│ (Token │  Subsequent requests
│  in    │  with Bearer token
│ Header)│
└────────┘
```

### Token Configuration

| Token | Default Expiry | Purpose |
|-------|----------------|---------|
| Access Token | 15 minutes | API authentication |
| Refresh Token | 7 days | Token renewal |

### Authorization Middleware

```typescript
// JWT verification
authenticate(req, res, next)

// Role-based access
authorize('admin', 'super_admin')(req, res, next)

// Resource ownership
checkOwnership('userId')(req, res, next)
```

### Token Blacklist

Invalidated tokens are stored in Redis for:
- Explicit logout
- Password change (invalidates all user tokens)
- Token rotation

---

## Caching Strategy

### Cache Keys Pattern

```
app:country:id:{id}           # Single country
app:country:code:{code}       # Country by code
app:country:list:{params}     # Country list
app:user:id:{id}              # User data
app:auth:blacklist:{token}    # Blacklisted tokens
```

### Cache Operations

```typescript
// Redis helper methods
await redisService.get(key)
await redisService.set(key, value, ttl)
await redisService.delete(key)
await redisService.deletePattern('app:country:*')
```

### Caching Middleware

```typescript
// Cache responses
router.get('/', cacheMiddleware('5m'), controller.list);

// Invalidate on mutations
router.post('/', invalidateCacheMiddleware('country'), controller.create);
```

### TTL Configuration

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| Static Lists | 1 hour | Infrequent changes |
| Entity Data | 15 minutes | Moderate updates |
| Session Data | Token lifetime | Security |

---

## API Structure

### Base URL

```
/api/v1
```

### Endpoints

#### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /auth/login | User login | No |
| POST | /auth/refresh-token | Refresh access token | No |
| POST | /auth/refresh-token-rotate | Rotate refresh token | No |
| POST | /auth/verify-token | Verify token | Yes |
| POST | /auth/logout | Logout user | Yes |
| POST | /auth/change-password | Change password | Yes |

#### Countries

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /countries | List all (paginated) | No |
| GET | /countries/active/list | List active only | No |
| GET | /countries/:id | Get by ID | No |
| GET | /countries/code/:code | Get by code | No |
| POST | /countries | Create | Yes |
| PUT | /countries/:id | Update | Yes |
| DELETE | /countries/:id | Soft delete | Yes |
| DELETE | /countries/:id/permanent | Hard delete | Yes |

#### Files

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /files/upload | Upload single | Yes |
| POST | /files/upload/multiple | Upload multiple | Yes |
| GET | /files | List files | Yes |
| GET | /files/:id | Get metadata | Yes |
| GET | /files/:id/download | Download file | Yes |
| DELETE | /files/:id | Soft delete | Yes |

#### Utility

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /health/migrations | Migration status |
| GET | /metrics | Prometheus metrics |
| GET | /api-docs | Swagger UI |

### Response Format

```typescript
// Success
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "requestId": "uuid"
}

// Error
{
  "success": false,
  "message": "Error message",
  "error": "ERROR_CODE",
  "requestId": "uuid"
}

// Paginated
{
  "success": true,
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

---

## Event System

### Event Types

```typescript
enum AppEventType {
  // User events
  USER_CREATED = 'user:created',
  USER_UPDATED = 'user:updated',
  USER_DELETED = 'user:deleted',

  // Auth events
  AUTH_LOGIN = 'auth:login',
  AUTH_LOGOUT = 'auth:logout',
  AUTH_PASSWORD_CHANGED = 'auth:password_changed',

  // Country events
  COUNTRY_CREATED = 'country:created',
  COUNTRY_UPDATED = 'country:updated',

  // File events
  FILE_UPLOADED = 'file:uploaded',
  FILE_DELETED = 'file:deleted',

  // System events
  SYSTEM_STARTUP = 'system:startup',
  SYSTEM_ERROR = 'system:error'
}
```

### Event Payloads

```typescript
interface UserCreatedPayload {
  userId: number;
  email: string;
  role: string;
  createdBy: number;
}

interface AuthLoginPayload {
  userId: number;
  email: string;
  ipAddress: string;
  userAgent: string;
}
```

### Usage

```typescript
// Emit event
eventEmitter.emit(AppEventType.USER_CREATED, {
  userId: user.id,
  email: user.email,
  role: user.role
});

// Handle event
eventEmitter.on(AppEventType.USER_CREATED, async (payload) => {
  await sendWelcomeEmail(payload.email);
  await createAuditLog('user_created', payload);
});
```

---

## File Storage

### Storage Providers

#### S3 Storage
```typescript
class S3StorageProvider implements IStorageProvider {
  async upload(file, path): Promise<string>
  async download(path): Promise<Buffer>
  async delete(path): Promise<void>
  async getSignedUrl(path, expires): Promise<string>
}
```

#### Local Storage
```typescript
class LocalStorageProvider implements IStorageProvider {
  // Same interface, stores in local filesystem
}
```

### Configuration

```typescript
storage: {
  type: 'local' | 's3',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  s3: {
    bucket: process.env.AWS_S3_BUCKET,
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  local: {
    uploadDir: './uploads'
  }
}
```

---

## Middleware Pipeline

### Request Flow

```
Request
   │
   ▼
┌──────────────┐
│   Security   │  helmet, cors
└──────┬───────┘
       ▼
┌──────────────┐
│   Parsing    │  json, urlencoded
└──────┬───────┘
       ▼
┌──────────────┐
│  Request ID  │  UUID generation
└──────┬───────┘
       ▼
┌──────────────┐
│   Metrics    │  Prometheus counters
└──────┬───────┘
       ▼
┌──────────────┐
│   Logging    │  Morgan HTTP logs
└──────┬───────┘
       ▼
┌──────────────┐
│   Response   │  Handler methods
└──────┬───────┘
       ▼
┌──────────────┐
│ Rate Limit   │  Request throttling
└──────┬───────┘
       ▼
┌──────────────┐
│   Routes     │  API endpoints
└──────┬───────┘
       ▼
┌──────────────┐
│ Not Found    │  404 handler
└──────┬───────┘
       ▼
┌──────────────┐
│    Error     │  Global error handler
└──────────────┘
```

### Route-Level Middleware

```typescript
router.post(
  '/',
  authenticate,                    // JWT verification
  authorize('admin'),              // Role check
  validateRequest(createSchema),   // Input validation
  invalidateCacheMiddleware(),     // Cache invalidation
  controller.create
);

router.get(
  '/',
  cacheMiddleware('5m'),           // Response caching
  controller.list
);
```

---

## Configuration Management

### Environment Files

```
src/environment/
├── local.ts    # Local development
├── dev.ts      # Development server
└── prod.ts     # Production
```

### Configuration Structure

```typescript
interface EnvConfig {
  env: string;
  port: number;
  apiPrefix: string;

  app: {
    name: string;
    version: string;
  };

  database: {
    host: string;
    port: number;
    name: string;
    username: string;
    password: string;
  };

  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };

  redis: {
    enabled: boolean;
    host: string;
    port: number;
  };

  logging: {
    level: string;
    console: boolean;
    file: boolean;
  };

  monitoring: {
    enabled: boolean;
  };

  storage: {
    type: 'local' | 's3';
    // ...
  };
}
```

### Environment Variable Overrides

```bash
# Database
DB_HOST, DB_PORT, DB_NAME, DB_USERNAME, DB_PASSWORD

# JWT
JWT_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_TOKEN_EXPIRY

# Redis
REDIS_ENABLED, REDIS_HOST, REDIS_PORT

# Logging
LOG_LEVEL, LOG_CONSOLE_ENABLED, LOG_FILE_ENABLED

# Storage
STORAGE_TYPE, AWS_S3_BUCKET, AWS_REGION
```

---

## Monitoring & Logging

### Prometheus Metrics

**Endpoint:** `GET /metrics`

**Available Metrics:**
- `http_request_duration_seconds` - Request duration histogram
- `http_requests_total` - Total request count
- `db_query_duration_seconds` - Database query duration
- `cache_hits_total` / `cache_misses_total` - Cache statistics
- `auth_attempts_total` - Authentication attempts

### Winston Logging

**Transports:**
- Console (development)
- Daily rotating files
- Exception file
- Rejection file

**Log Levels:**
```
error: 0
warn: 1
info: 2
http: 3
debug: 4
```

**Structured Log Format:**
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "message": "User login successful",
  "requestId": "uuid",
  "userId": 123,
  "email": "user@example.com"
}
```

### Request ID Tracking

Every request receives a unique UUID (`x-request-id`) for tracing through logs.

---

## Testing Strategy

### Test Types

```
src/__tests__/
├── e2e/                    # End-to-end API tests
│   ├── auth.e2e.test.ts
│   └── country-master.e2e.test.ts
├── helpers/                # Test utilities
└── mocks/                  # Mock implementations
```

### Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# CI mode
npm run test:ci
```

### Test Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '@/*': '<rootDir>/src/*'
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

---

## Quick Reference

### Key Files

| Component | Path |
|-----------|------|
| Entry Point | `src/server.ts` |
| App Factory | `src/app.ts` |
| Config | `src/config.ts` |
| Database | `src/application/config/database/database.ts` |
| Base Repository | `src/application/repositories/base.repository.ts` |
| Auth Service | `src/application/services/auth.service.ts` |
| Auth Middleware | `src/application/middleware/auth.middleware.ts` |
| Error Handler | `src/application/middleware/errorHandler.ts` |
| Redis Helper | `src/application/helpers/redis.helper.ts` |
| Event Emitter | `src/application/events/event-emitter.ts` |

### NPM Scripts

```bash
# Development
npm run dev              # Start with hot reload
npm run dev:fresh        # Migrate, seed, then start

# Production
npm run build            # Compile TypeScript
npm start                # Run compiled app

# Database
npm run db:migrate       # Run migrations
npm run db:seed          # Run seeders
npm run db:reset         # Full reset

# Quality
npm run lint             # Check linting
npm run lint:fix         # Fix linting
npm run format           # Format code
npm run validate         # Lint + format check

# Docker
npm run docker:dev       # Development mode
npm run docker:prod      # Production mode
```

---

## Related Documentation

- [README.md](./README.md) - Getting started guide
- [DOCKER.md](./DOCKER.md) - Docker setup
- [SWAGGER_GUIDE.md](./SWAGGER_GUIDE.md) - API documentation
- [JWT_IMPLEMENTATION_SUMMARY.md](./JWT_IMPLEMENTATION_SUMMARY.md) - Authentication details
- [LOGGING.md](./LOGGING.md) - Logging configuration
- [MONITORING.md](./MONITORING.md) - Monitoring setup
- [REDIS_INTEGRATION_GUIDE.md](./REDIS_INTEGRATION_GUIDE.md) - Redis caching
