# Node Art API Documentation

Welcome to the Node Art API documentation. This API provides comprehensive backend services including authentication, user management, and more.

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Base URL

- **Local**: `http://localhost:3000/api`
- **Development**: `https://dev.example.com/api`
- **Production**: `https://api.example.com/api`

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "message": "Success message",
  "data": {
    // Response data
  }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error message",
  "statusCode": 400
}
```

## Rate Limiting

API requests are rate-limited:
- General routes: 100 requests per 15 minutes
- Auth routes: 5 requests per 15 minutes
