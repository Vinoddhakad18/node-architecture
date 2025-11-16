export default {
  env: 'local',
  port: 3000,
  apiPrefix: '/api/v1',
  app: {
    name: 'node-architecture',
    version: '1.0.0',
    env: 'local',
  },
  database: {
    host: '<env:DB_HOST>',
    port: '<env:DB_PORT>',
    name: '<env:DB_NAME>',
    username: '<env:DB_USERNAME>',
    password: '<env:DB_PASSWORD>',
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
    origin: 'http://localhost:3000',
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
  monitoring: {
    enabled: true,
  },
  newRelic: {
    enabled: false, // Disabled by default in local development
    licenseKey: '<env:NEW_RELIC_LICENSE_KEY>',
    appName: 'node-architecture-local',
    logLevel: 'info',
    distributedTracingEnabled: true,
    loggingEnabled: true,
  },
};
