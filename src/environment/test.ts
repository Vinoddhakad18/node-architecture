export default {
  env: 'test',
  port: 3001,
  apiPrefix: '/api/v1',
  app: {
    name: 'node-architecture',
    version: '1.0.0',
    env: 'test',
  },
  database: {
    host: 'localhost',
    port: 3306,
    name: 'test_db',
    username: 'test_user',
    password: 'test_password',
  },
  jwt: {
    secret: 'test-jwt-secret-key',
    expiresIn: '15m',
    refreshSecret: 'test-jwt-refresh-secret-key',
    refreshExpiresIn: '7d',
    issuer: 'node-architecture-app',
    audience: 'node-architecture-users',
  },
  cors: {
    origin: 'http://localhost:3001',
  },
  logging: {
    level: 'error',
    console: {
      enabled: false,
    },
    file: {
      error: {
        enabled: false,
      },
      info: {
        enabled: false,
      },
      combined: {
        enabled: false,
      },
      maxSize: '20m',
      maxDays: '14d',
      datePattern: 'YYYY-MM-DD',
    },
    exception: {
      enabled: false,
    },
    rejection: {
      enabled: false,
    },
    http: {
      enabled: false,
    },
  },
  monitoring: {
    enabled: false,
  },
  newRelic: {
    enabled: false,
    licenseKey: '',
    appName: 'node-architecture-test',
    logLevel: 'error',
    distributedTracingEnabled: false,
    loggingEnabled: false,
  },
  storage: {
    type: 'local',
    maxFileSize: 10 * 1024 * 1024, // 10 MB
    s3: {
      region: 'us-east-1',
      bucket: 'test-bucket',
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
      endpoint: '',
      forcePathStyle: true,
    },
    local: {
      basePath: './test-uploads',
      baseUrl: 'http://localhost:3001/uploads',
    },
  },
};
