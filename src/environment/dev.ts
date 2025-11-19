export default {
  env: 'development',
  port: 3000,
  apiPrefix: '/api/v1',
  app: {
    name: 'node-architecture',
    version: '1.0.0',
    env: 'development',
  },
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
  monitoring: {
    enabled: true,
  },
  newRelic: {
    enabled: false, // Can be enabled via env variable
    licenseKey: '<env:NEW_RELIC_LICENSE_KEY>',
    appName: 'node-architecture-dev',
    logLevel: 'info',
    distributedTracingEnabled: true,
    loggingEnabled: true,
  },
  storage: {
    type: 's3', // Use S3 for dev environment
    maxFileSize: 10 * 1024 * 1024, // 10 MB
    s3: {
      region: '<env:AWS_REGION>',
      bucket: '<env:AWS_S3_BUCKET>',
      accessKeyId: '<env:AWS_ACCESS_KEY_ID>',
      secretAccessKey: '<env:AWS_SECRET_ACCESS_KEY>',
      endpoint: '<env:AWS_S3_ENDPOINT>',
      forcePathStyle: true,
    },
    local: {
      basePath: './uploads',
      baseUrl: 'http://localhost:3000/uploads',
    },
  },
};
