# Testing Documentation

This directory contains the test suite for the Node.js MVC Architecture application.

## Directory Structure

```
__tests__/
├── setup.ts                 # Global test setup and configuration
├── helpers/
│   └── test-helpers.ts     # Shared testing utilities
├── mocks/
│   ├── sequelize.mock.ts   # Sequelize mocks for unit tests
│   └── logger.mock.ts      # Logger mocks
└── e2e/
    └── auth.e2e.test.ts    # End-to-end authentication tests

application/
├── services/
│   └── __tests__/
│       └── auth.service.test.ts      # Unit tests for auth service
└── controllers/
    └── __tests__/
        └── auth.controller.test.ts   # Integration tests for auth controller
```

## Test Types

### 1. Unit Tests
Located in `application/services/__tests__/`

Tests individual service methods in isolation with mocked dependencies.

**Run unit tests:**
```bash
npm run test:unit
```

**Example:** [auth.service.test.ts](../application/services/__tests__/auth.service.test.ts)
- Tests login logic
- Tests token refresh
- Tests token verification
- Mocks database and JWT utilities

### 2. Integration Tests
Located in `application/controllers/__tests__/`

Tests controller methods with mocked services to verify HTTP request/response handling.

**Run integration tests:**
```bash
npm run test:integration
```

**Example:** [auth.controller.test.ts](../application/controllers/__tests__/auth.controller.test.ts)
- Tests request validation
- Tests response formatting
- Tests error handling
- Mocks auth service

### 3. End-to-End (E2E) Tests
Located in `__tests__/e2e/`

Tests complete API workflows with real HTTP requests and database interactions.

**Run E2E tests:**
```bash
npm run test:e2e
```

**Example:** [auth.e2e.test.ts](e2e/auth.e2e.test.ts)
- Tests complete authentication flow
- Tests API endpoints with real database
- Tests concurrent requests
- Tests error scenarios

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests for CI/CD
```bash
npm run test:ci
```

## Coverage Goals

The project aims for minimum **70% code coverage** across:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

View coverage report after running:
```bash
npm run test:coverage
```

The HTML coverage report will be available at `coverage/index.html`

## Test Database Setup

### Prerequisites
1. MySQL database running on localhost:3306
2. Create test database:
   ```sql
   CREATE DATABASE node_architecture_test;
   ```

### Environment Variables
Test-specific environment variables are in `.env.test`:
- `NODE_ENV=test`
- `DB_NAME=node_architecture_test`
- `JWT_SECRET=test-jwt-secret-key-change-this-in-production`

### Database Migrations for Tests
E2E tests use `sequelize.sync({ force: true })` to create tables automatically.

## Writing New Tests

### Unit Test Template
```typescript
import serviceModule from '../service-name';
import dependency from '../../dependency';

jest.mock('../../dependency');

describe('ServiceName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should do something', async () => {
      // Arrange
      (dependency.method as jest.Mock).mockResolvedValue('result');

      // Act
      const result = await serviceModule.methodName();

      // Assert
      expect(dependency.method).toHaveBeenCalled();
      expect(result).toBe('result');
    });
  });
});
```

### E2E Test Template
```typescript
import request from 'supertest';
import { createApp } from '../../app';

describe('Feature E2E', () => {
  let app;

  beforeAll(async () => {
    app = await createApp();
  });

  it('should handle API request', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .send({ data: 'value' })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
  });
});
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data in `afterEach` hooks
3. **Descriptive Names**: Use clear, descriptive test names
4. **AAA Pattern**: Arrange, Act, Assert structure
5. **Mock External Dependencies**: Mock databases, APIs, and services in unit tests
6. **Test Edge Cases**: Include error scenarios and boundary conditions
7. **Avoid Test Interdependence**: Tests should not rely on execution order

## Common Issues

### Issue: Database connection errors
**Solution**: Ensure MySQL is running and test database exists

### Issue: Tests failing due to rate limiting
**Solution**: Rate limiting is applied in E2E tests. Consider increasing limits for test environment

### Issue: JWT token errors
**Solution**: Verify JWT secrets are set in `.env.test`

### Issue: Port conflicts
**Solution**: Ensure test port (3001) is not in use

## CI/CD Integration

For continuous integration pipelines, use:
```bash
npm run test:ci
```

This command:
- Runs in CI mode
- Generates coverage reports
- Limits worker threads for stability
- Fails if coverage thresholds are not met

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)
