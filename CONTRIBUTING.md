# Contributing to Node Art

Thank you for considering contributing to Node Art! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Write clean, maintainable code
- Follow the existing code style
- Write tests for new features
- Document your changes

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/node-art.git
   cd node-art
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### 1. Make Your Changes

- Follow the existing project structure
- Use TypeScript strict mode
- Follow the naming conventions
- Keep functions small and focused

### 2. Code Style

The project uses ESLint and Prettier:

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### 3. Path Aliases

Use path aliases instead of relative imports:

```typescript
// Good
import User from '@models/User';
import logger from '@utils/logger';

// Bad
import User from '../../database/models/User';
import logger from '../../../utils/logger';
```

### 4. Write Tests

All new features should include tests:

```bash
# Run tests
npm test

# Watch mode
npm run test:watch
```

Test files should be placed in `src/tests/` and follow the naming convention:
- `*.test.ts` for unit tests
- `*.spec.ts` for integration tests

### 5. Commit Messages

Follow conventional commit format:

```
type(scope): subject

body

footer
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```bash
git commit -m "feat(auth): add OAuth2 authentication"
git commit -m "fix(user): resolve email validation issue"
git commit -m "docs(readme): update installation instructions"
```

### 6. Pre-commit Hooks

Husky will automatically run linting and tests before commits:

```bash
git add .
git commit -m "your message"
# Husky runs: lint-staged, tests
```

## Project Structure Guidelines

### Adding New Routes

1. Create controller in `src/controllers/`
2. Create service in `src/services/` (business logic)
3. Create repository in `src/repositories/` (data access)
4. Create route in `src/routes/`
5. Add validation schemas in `src/middleware/validation.ts`
6. Update `src/routes/index.ts`

Example:
```typescript
// src/controllers/ProductController.ts
import { Request, Response } from 'express';
import { asyncHandler } from '@middleware/errorHandler';

class ProductController {
  getProducts = asyncHandler(async (req: Request, res: Response) => {
    // Implementation
  });
}

export default new ProductController();
```

### Adding Database Models

#### Sequelize (MySQL)
1. Create model in `src/database/models/`
2. Create migration in `src/database/migrations/`
3. Optionally create seeder in `src/database/seeders/`

#### Mongoose (MongoDB)
1. Create schema in `src/database/models/`
2. Export model

### Adding Middleware

Create middleware in `src/middleware/`:

```typescript
import { Request, Response, NextFunction } from 'express';

export const yourMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Implementation
  next();
};
```

### Adding Utilities

Create utility functions in `src/utils/`:

```typescript
// src/utils/yourUtility.ts
export const yourFunction = (param: string): string => {
  // Implementation
  return result;
};
```

## Testing Guidelines

### Unit Tests

Test individual functions and utilities:

```typescript
import { yourFunction } from '@utils/yourUtility';

describe('yourFunction', () => {
  it('should return expected result', () => {
    const result = yourFunction('test');
    expect(result).toBe('expected');
  });
});
```

### Integration Tests

Test API endpoints:

```typescript
import request from 'supertest';
import app from '@/app';

describe('POST /api/auth/login', () => {
  it('should login successfully', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('tokens');
  });
});
```

## Documentation

### Code Comments

Add JSDoc comments for public functions:

```typescript
/**
 * Generate JWT access token
 * @param payload - Token payload containing user information
 * @returns JWT token string
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  // Implementation
};
```

### Swagger Documentation

Add Swagger annotations to routes:

```typescript
/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/products', ProductController.getProducts);
```

### README Updates

Update README.md if you:
- Add new features
- Change configuration
- Add new dependencies
- Modify setup process

## Pull Request Process

1. **Update Documentation**
   - Update README.md if needed
   - Add/update comments
   - Update Swagger docs

2. **Run Tests**
   ```bash
   npm test
   npm run lint
   ```

3. **Push Your Changes**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create Pull Request**
   - Use a clear title
   - Describe your changes
   - Reference any related issues
   - Include screenshots if applicable

5. **PR Template**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Tests pass locally
   - [ ] Added new tests
   - [ ] Updated existing tests

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-reviewed code
   - [ ] Commented complex code
   - [ ] Updated documentation
   - [ ] No new warnings
   ```

## Security

### Reporting Vulnerabilities

If you discover a security vulnerability:
1. **DO NOT** open a public issue
2. Email security@example.com
3. Include detailed description
4. Wait for response before disclosure

### Security Best Practices

- Never commit sensitive data (keys, passwords, tokens)
- Use environment variables for secrets
- Validate all user inputs
- Use parameterized queries
- Keep dependencies updated
- Follow OWASP guidelines

## Questions?

- Open an issue for bugs or feature requests
- Join our Discord/Slack community
- Check existing issues and discussions
- Read the documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to Node Art!
