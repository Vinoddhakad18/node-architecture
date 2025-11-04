export default {
  env: 'local',
  port: 3000,

  // MySQL Configuration
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    username: process.env.MYSQL_USERNAME || 'root',
    password: process.env.MYSQL_PASSWORD || 'password',
    database: process.env.MYSQL_DATABASE || 'node_art_local',
    dialect: 'mysql' as const,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: console.log
  },

  // MongoDB Configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/node_art_local',
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },

  // Redis Configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0'),
    keyPrefix: 'node_art_local:',
    maxRetriesPerRequest: 3
  },

  // JWT Configuration
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'local-access-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'local-refresh-secret-change-in-production',
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d'
  },

  // Encryption Configuration
  encryption: {
    algorithm: 'aes-256-cbc',
    key: process.env.ENCRYPTION_KEY || '12345678901234567890123456789012', // 32 bytes
    iv: process.env.ENCRYPTION_IV || '1234567890123456' // 16 bytes
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  },

  // Logging Configuration
  logging: {
    level: 'debug',
    console: true,
    file: true,
    directory: 'logs'
  }
};
