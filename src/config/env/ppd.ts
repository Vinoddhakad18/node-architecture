export default {
  env: 'ppd',
  port: parseInt(process.env.PORT || '3000'),

  // MySQL Configuration
  mysql: {
    host: process.env.MYSQL_HOST || '',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    username: process.env.MYSQL_USERNAME || '',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'node_art_ppd',
    dialect: 'mysql' as const,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    },
    logging: false
  },

  // MongoDB Configuration
  mongodb: {
    uri: process.env.MONGODB_URI || '',
    options: {
      maxPoolSize: 50,
      minPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },

  // Redis Configuration
  redis: {
    host: process.env.REDIS_HOST || '',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0'),
    keyPrefix: 'node_art_ppd:',
    maxRetriesPerRequest: 3
  },

  // JWT Configuration
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || '',
    refreshSecret: process.env.JWT_REFRESH_SECRET || '',
    accessExpiresIn: '1h',
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
    max: 500,
    standardHeaders: true,
    legacyHeaders: false
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || ['https://ppd.example.com'],
    credentials: true
  },

  // Logging Configuration
  logging: {
    level: 'warn',
    console: false,
    file: true,
    directory: 'logs'
  }
};
