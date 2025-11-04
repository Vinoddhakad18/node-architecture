import { Sequelize } from 'sequelize';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import config from '@config/index';
import logger from '@utils/logger';

// MySQL/Sequelize Connection
export const sequelize = new Sequelize(
  config.mysql.database,
  config.mysql.username,
  config.mysql.password,
  {
    host: config.mysql.host,
    port: config.mysql.port,
    dialect: config.mysql.dialect,
    pool: config.mysql.pool,
    logging: config.mysql.logging,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  }
);

// MongoDB Connection
export const connectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodb.uri, config.mongodb.options);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    throw error;
  }
};

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  logger.info('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  logger.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose disconnected from MongoDB');
});

// Redis Connection
export const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
  keyPrefix: config.redis.keyPrefix,
  maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redisClient.on('connect', () => {
  logger.info('Redis client connected');
});

redisClient.on('error', (err) => {
  logger.error('Redis client error:', err);
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

// Test MySQL Connection
export const testMySQLConnection = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    logger.info('MySQL connection has been established successfully');
    return true;
  } catch (error) {
    logger.error('Unable to connect to MySQL database:', error);
    return false;
  }
};

// Initialize all database connections
export const initializeDatabases = async (): Promise<void> => {
  try {
    // Test MySQL connection
    await testMySQLConnection();

    // Connect to MongoDB
    await connectMongoDB();

    logger.info('All database connections initialized successfully');
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
};

// Graceful shutdown
export const closeDatabaseConnections = async (): Promise<void> => {
  try {
    await sequelize.close();
    await mongoose.connection.close();
    redisClient.disconnect();
    logger.info('All database connections closed successfully');
  } catch (error) {
    logger.error('Error closing database connections:', error);
    throw error;
  }
};
