export default {
  env: 'production',
  port: process.env.PORT || 3000,
  apiPrefix: '/api/v1',
  app: {
    name: 'node-architecture',
    version: process.env.APP_VERSION || '1.0.0',
    env: 'production',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'myapp_prod',
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },
   jwt: {
    secret: '<env:JWT_SECRET>',
    expiresIn: '15m',
    refreshSecret: '<env:JWT_REFRESH_SECRET>',
    refreshExpiresIn: '7d',
    issuer: 'node-architecture-app',
    audience: 'node-architecture-users',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'https://yourapp.com',
  },
  logging: {
    level: 'error',
    console: {
      enabled: false, // Disable console in production
    },
    file: {
      error: {
        enabled: true,
      },
      info: {
        enabled: false, // Disable info logs in production
      },
      combined: {
        enabled: true,
      },
      maxSize: '50m',
      maxDays: '30d',
      datePattern: 'YYYY-MM-DD',
    },
    exception: {
      enabled: true,
    },
    rejection: {
      enabled: true,
    },
    http: {
      enabled: false, // Disable HTTP logging in production for performance
    },
  },
};
