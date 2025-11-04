export default {
  env: 'dev',
  port: parseInt(process.env.PORT || '3000'),

  // MySQL Configuration
  mysql: {
    host: process.env.MYSQL_HOST || 'mysql-dev',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    username: process.env.MYSQL_USERNAME || 'dev_user',
    password: process.env.MYSQL_PASSWORD || 'dev_password',
    database: process.env.MYSQL_DATABASE || 'node_art_dev',
    dialect: 'mysql' as const,
    pool: {
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    },
    logging: false
  },

  // MongoDB Configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://mongodb-dev:27017/node_art_dev',
    options: {
      maxPoolSize: 20,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },

  // Redis Configuration
  redis: {
    host: process.env.REDIS_HOST || 'redis-dev',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0'),
    keyPrefix: 'node_art_dev:',
    maxRetriesPerRequest: 3
  },

  // JWT Configuration
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || '',
    refreshSecret: process.env.JWT_REFRESH_SECRET || '',
    accessExpiresIn: '30m',
    refreshExpiresIn: '7d'
  },

  // Encryption Configuration
  encryption: {
    algorithm: 'aes-256-cbc',
    key: process.env.ENCRYPTION_KEY || '',
    iv: process.env.ENCRYPTION_IV || ''
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || ['http://localhost:3000', 'https://dev.example.com'],
    credentials: true
  },

  // Logging Configuration
  logging: {
    level: 'info',
    console: true,
    file: true,
    directory: 'logs'
  }
};
