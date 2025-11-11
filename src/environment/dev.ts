export default {
  env: 'development',
  port: 3000,
  apiPrefix: '/api/v1',
  database: {
    host: 'localhost',
    port: 5432,
    name: 'myapp_dev',
    username: 'postgres',
    password: 'postgres',
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
    origin: '*',
  },
  logging: {
    level: 'debug',
    console: {
      enabled: true,
    },
    file: {
      error: {
        enabled: true,
      },
      info: {
        enabled: true,
      },
      combined: {
        enabled: true,
      },
      maxSize: '20m',
      maxDays: '14d',
      datePattern: 'YYYY-MM-DD',
    },
    exception: {
      enabled: true,
    },
    rejection: {
      enabled: true,
    },
    http: {
      enabled: true,
    },
  },
};
