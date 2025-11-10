# Swagger API Documentation Guide

This guide explains how to use Swagger/OpenAPI documentation in your Node.js application.

## Installation Complete

The following packages have been installed:
- `swagger-ui-express` - Serves auto-generated swagger-ui
- `swagger-jsdoc` - Reads JSDoc-annotated source code to generate OpenAPI specification
- `@types/swagger-ui-express` - TypeScript types
- `@types/swagger-jsdoc` - TypeScript types

## Configuration Files

### 1. [src/swagger.ts](src/swagger.ts)
Main Swagger configuration file that defines:
- API information (title, version, description)
- Server URLs (development, production)
- Security schemes (JWT Bearer, API Key)
- Common response schemas
- Tags for organizing endpoints

### 2. [src/app.ts](src/app.ts)
Updated to include Swagger UI middleware:
- `/api-docs` - Interactive Swagger UI interface
- `/api-docs.json` - Raw OpenAPI JSON specification

## Accessing Swagger Documentation

Once your server is running, access the documentation at:
- **Swagger UI**: `http://localhost:<PORT>/api-docs`
- **OpenAPI JSON**: `http://localhost:<PORT>/api-docs.json`

## How to Document Your API Endpoints

### Method 1: In Route Files
Add JSDoc comments with `@swagger` tags above your route definitions:

```typescript
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/users', userController.getAll);
```

### Method 2: In Controller Files
Add JSDoc comments above controller methods:

```typescript
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User found
 */
export const getUserById = async (req: Request, res: Response) => {
  // controller logic
};
```

### Method 3: Separate Documentation Files
Create dedicated `.swagger.ts` files (like [example.swagger.ts](src/application/routes/example.swagger.ts)) containing only documentation.

## Example Documentation

See [src/application/routes/example.swagger.ts](src/application/routes/example.swagger.ts) for comprehensive examples including:
- GET, POST, PUT, DELETE operations
- Request body schemas
- Path and query parameters
- Response schemas
- Authentication requirements
- Reusable component schemas

## Common Swagger Annotations

### Basic Endpoint
```yaml
@swagger
/api/endpoint:
  get:
    summary: Short description
    description: Detailed description
    tags:
      - TagName
    responses:
      200:
        description: Success response
```

### With Authentication
```yaml
@swagger
/api/protected:
  get:
    security:
      - bearerAuth: []
    responses:
      200:
        description: Success
      401:
        $ref: '#/components/responses/UnauthorizedError'
```

### With Request Body
```yaml
@swagger
/api/users:
  post:
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - email
              - name
            properties:
              email:
                type: string
                format: email
              name:
                type: string
```

### With Path Parameters
```yaml
@swagger
/api/users/{id}:
  get:
    parameters:
      - in: path
        name: id
        required: true
        schema:
          type: string
        description: User ID
```

### With Query Parameters
```yaml
@swagger
/api/users:
  get:
    parameters:
      - in: query
        name: page
        schema:
          type: integer
          default: 1
      - in: query
        name: limit
        schema:
          type: integer
          default: 10
```

## Reusable Components

Define reusable schemas in your swagger documentation:

```yaml
@swagger
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        email:
          type: string
          format: email
        name:
          type: string
```

Then reference them in your endpoints:
```yaml
responses:
  200:
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/User'
```

## Pre-configured Security Schemes

Your application includes two authentication methods:

### Bearer Token (JWT)
```yaml
security:
  - bearerAuth: []
```

### API Key
```yaml
security:
  - apiKey: []
```

## Pre-configured Response Templates

Use these reusable responses in your documentation:
- `$ref: '#/components/responses/UnauthorizedError'` - 401 responses
- `$ref: '#/components/responses/BadRequestError'` - 400 responses
- `$ref: '#/components/responses/NotFoundError'` - 404 responses
- `$ref: '#/components/responses/InternalServerError'` - 500 responses

## Tips

1. **Keep it updated**: Document your APIs as you write them
2. **Use tags**: Organize endpoints with tags for better navigation
3. **Add examples**: Include example values to help users understand the API
4. **Describe parameters**: Add clear descriptions for all parameters
5. **Document errors**: Include all possible error responses
6. **Use schemas**: Define reusable schemas for complex objects
7. **Test in Swagger UI**: Use the "Try it out" feature to test your endpoints

## Updating Server URLs

Edit [src/swagger.ts](src/swagger.ts) to update server URLs:
```typescript
servers: [
  {
    url: `http://localhost:${config.port}${config.apiPrefix}`,
    description: 'Development server',
  },
  {
    url: `https://api.yourdomain.com${config.apiPrefix}`,
    description: 'Production server',
  },
],
```

## Customizing Swagger UI

Modify `swaggerUiOptions` in [src/swagger.ts](src/swagger.ts) to customize the UI:
```typescript
export const swaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Your API Docs',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    // ... more options
  },
};
```

## Resources

- [OpenAPI Specification](https://swagger.io/specification/)
- [Swagger JSDoc Documentation](https://github.com/Surnet/swagger-jsdoc)
- [Swagger UI Express](https://github.com/scottie1984/swagger-ui-express)

## Next Steps

1. Start your development server: `npm run dev`
2. Visit `http://localhost:<PORT>/api-docs`
3. Add Swagger comments to your existing routes
4. Update server URLs for production
5. Document all your API endpoints
