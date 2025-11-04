# Quick Setup Guide

## Step-by-Step Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
# Copy environment file
cp .env.example .env

# Edit .env file with your configuration
# For local development, the defaults should work
```

### 3. Start with Docker (Easiest)

```bash
# Start all services (MySQL, MongoDB, Redis, App)
docker-compose up --build

# The API will be available at:
# - REST API: http://localhost:3000/api
# - GraphQL: http://localhost:3000/graphql
# - Swagger Docs: http://localhost:3000/api-docs
```

### 4. Or Run Locally

**Prerequisites:**
- MySQL 8.0+ running on localhost:3306
- MongoDB 7+ running on localhost:27017
- Redis 7+ running on localhost:6379

```bash
# Run database migrations
npm run migrate

# Seed the database with demo users
npm run seed

# Start development server
npm run dev
```

### 5. Test the API

#### Create a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

#### Access Protected Route
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 6. Demo Users (After Seeding)

Three demo users are created when you run `npm run seed`:

1. **Admin User**
   - Email: admin@example.com
   - Password: Password123!
   - Role: admin

2. **Regular User**
   - Email: user@example.com
   - Password: Password123!
   - Role: user

3. **Moderator**
   - Email: moderator@example.com
   - Password: Password123!
   - Role: moderator

### 7. GraphQL Queries

Open http://localhost:3000/graphql and try:

```graphql
# Register a user
mutation {
  register(input: {
    email: "graphql@example.com"
    password: "Test123!@#"
    firstName: "GraphQL"
    lastName: "User"
  }) {
    user {
      id
      email
      firstName
      lastName
    }
    tokens {
      accessToken
      refreshToken
    }
  }
}

# Get user (requires authentication)
query {
  getUser(id: "USER_ID") {
    id
    email
    firstName
    lastName
    role
  }
}
```

### 8. Run Tests

```bash
# Run all tests with coverage
npm test

# Watch mode
npm run test:watch
```

### 9. Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Both will run automatically on git commit (Husky)
```

## Troubleshooting

### Port Already in Use
If port 3000 is in use, change it in your .env file:
```bash
PORT=3001
```

### Database Connection Issues
- Verify MySQL, MongoDB, and Redis are running
- Check credentials in .env file
- Ensure databases are created (migrations will create tables)

### Docker Issues
```bash
# Remove all containers and volumes
docker-compose down -v

# Rebuild
docker-compose up --build
```

### Path Alias Issues
If TypeScript can't resolve path aliases:
```bash
# Ensure tsconfig-paths is installed
npm install --save-dev tsconfig-paths

# Use tsx for development (already in scripts)
npm run dev
```

## Next Steps

1. Review [README.md](README.md) for complete documentation
2. Explore [Swagger Documentation](http://localhost:3000/api-docs)
3. Check [GraphQL Playground](http://localhost:3000/graphql)
4. Review code structure in `src/` directory
5. Add your own routes and models
6. Customize environment configurations

## Production Deployment

Before deploying to production:

1. Generate strong secrets:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

2. Update production .env file with:
   - Strong JWT secrets
   - Strong encryption keys
   - Production database credentials
   - Production Redis password
   - Correct CORS origins

3. Build and deploy:
   ```bash
   npm run build
   npm start
   ```

4. Or use Docker:
   ```bash
   docker-compose --env-file .env.prod up -d
   ```

## Support

For issues or questions, please refer to the main [README.md](README.md) or open an issue on the repository.
