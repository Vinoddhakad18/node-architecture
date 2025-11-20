import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config';

/**
 * Swagger configuration options
 */
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Node Architecture API',
      version: '1.0.0',
      description: 'Node.js MVC Architecture with TypeScript following MVC pattern',
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC',
      },
      contact: {
        name: 'API Support',
        url: 'https://github.com/Vinoddhakad18/node-architecture',
      },
    },
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
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>',
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for authentication',
        },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operation successful',
            },
            data: {
              type: 'object',
              description: 'Response data payload',
            },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              example: 100,
              description: 'Total number of records',
            },
            page: {
              type: 'integer',
              example: 1,
              description: 'Current page number',
            },
            limit: {
              type: 'integer',
              example: 10,
              description: 'Records per page',
            },
            totalPages: {
              type: 'integer',
              example: 10,
              description: 'Total number of pages',
            },
          },
        },
        Country: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            name: {
              type: 'string',
              example: 'United States',
            },
            code: {
              type: 'string',
              example: 'US',
            },
            currency_code: {
              type: 'string',
              example: 'USD',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive'],
              example: 'active',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        FileMetadata: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            original_name: {
              type: 'string',
              example: 'document.pdf',
            },
            storage_key: {
              type: 'string',
              example: 'uploads/2024/01/document-abc123.pdf',
            },
            mime_type: {
              type: 'string',
              example: 'application/pdf',
            },
            size: {
              type: 'integer',
              example: 1024000,
            },
            url: {
              type: 'string',
              example: 'https://storage.example.com/uploads/document.pdf',
            },
            category: {
              type: 'string',
              example: 'documents',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'deleted'],
              example: 'active',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        TokenPair: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            refreshToken: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
            expiresAt: {
              type: 'integer',
              example: 1704067200,
              description: 'Unix timestamp when access token expires',
            },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            field: {
              type: 'string',
              example: 'email',
            },
            message: {
              type: 'string',
              example: 'Invalid email format',
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  message: {
                    type: 'string',
                    example: 'Unauthorized access',
                  },
                },
              },
            },
          },
        },
        BadRequestError: {
          description: 'Bad request - validation error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  message: {
                    type: 'string',
                    example: 'Invalid input data',
                  },
                  errors: {
                    type: 'array',
                    items: {
                      type: 'object',
                    },
                  },
                },
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  message: {
                    type: 'string',
                    example: 'Resource not found',
                  },
                },
              },
            },
          },
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  message: {
                    type: 'string',
                    example: 'Internal server error',
                  },
                },
              },
            },
          },
        },
        ConflictError: {
          description: 'Resource conflict',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  message: {
                    type: 'string',
                    example: 'Resource already exists',
                  },
                },
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false,
                  },
                  message: {
                    type: 'string',
                    example: 'Validation failed',
                  },
                  errors: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/ValidationError',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints',
      },
      {
        name: 'Authentication',
        description: 'Authentication endpoints',
      },
      {
        name: 'Countries',
        description: 'Country master data management',
      },
      {
        name: 'Files',
        description: 'File upload and management',
      },
      {
        name: 'Monitoring',
        description: 'Application monitoring and metrics',
      },
    ],
  },
  // Paths to files containing OpenAPI definitions
  apis: [
    './src/application/routes/**/*.ts',
    './src/application/controllers/**/*.ts',
    './src/application/models/**/*.ts',
  ],
};

/**
 * Generate Swagger specification
 */
export const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * Swagger UI options
 */
export const swaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Node Architecture API Docs',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
  },
};
