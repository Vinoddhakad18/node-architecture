import { Sequelize, Options } from 'sequelize';
import { config } from '@/config';
import { logger } from '@config/logger';
import redisService from '@helpers/redis.helper';

/**
 * Sequelize Database Configuration - MySQL Only
 * Simple and clean configuration
 */

/**
 * Database connection configuration
 */
const DB_CONNECTION_RETRY_ATTEMPTS = 5;
const DB_CONNECTION_RETRY_DELAY = 5000; // 5 seconds

// Check if replication is enabled
const isReplicationEnabled = process.env.DB_REPLICATION === 'true';

// Build configuration
const sequelizeConfig: Options = {
  dialect: 'mysql',
  logging: process.env.DB_LOGGING === 'true' ? console.log : false,

  // Connection pool
  pool: {
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    min: parseInt(process.env.DB_POOL_MIN || '0', 10),
    acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
    idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10),
  },

  // MySQL specific options
  dialectOptions: {
    charset: process.env.DB_CHARSET || 'utf8mb4',
    connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '10000', 10),
  },

  // Timezone
  timezone: process.env.DB_TIMEZONE || '+00:00',

  // Table naming and timestamps
  define: {
    timestamps: true,
    underscored: process.env.DB_UNDERSCORED === 'true',
    freezeTableName: process.env.DB_FREEZE_TABLE_NAME === 'true',
    paranoid: process.env.DB_PARANOID === 'true',
  },
};

// Add replication or simple connection
if (isReplicationEnabled) {
  // Replication mode (read/write split)
  sequelizeConfig.replication = {
    write: {
      host: process.env.DB_WRITE_HOST || config.database.host,
      port: parseInt(process.env.DB_WRITE_PORT || config.database.port?.toString() || '3306', 10),
      username: process.env.DB_WRITE_USER || config.database.username || process.env.DB_USER,
      password: process.env.DB_WRITE_PASSWORD || config.database.password,
    },
    read: [
      {
        host: process.env.DB_READ_HOST || config.database.host,
        port: parseInt(process.env.DB_READ_PORT || config.database.port?.toString() || '3306', 10),
        username: process.env.DB_READ_USER || config.database.username || process.env.DB_USER,
        password: process.env.DB_READ_PASSWORD || config.database.password,
      },
    ],
  };
} else {
  // Simple connection mode
  sequelizeConfig.host = config.database.host;
  sequelizeConfig.port = config.database.port;
  sequelizeConfig.username = config.database.username || process.env.DB_USER;
  sequelizeConfig.password = config.database.password;
}

// Main Sequelize instance with database
sequelizeConfig.database = config.database.name;
export const sequelize = new Sequelize(sequelizeConfig);

// Sequelize instance without database (for creating database)
const configWithoutDB = { ...sequelizeConfig };
delete configWithoutDB.database;
export const sequelizeWithoutDB = new Sequelize(configWithoutDB);

/**
 * Test database connection
 */
export const testConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('✓ Database connection has been established successfully.');
  } catch (error) {
    logger.error('✗ Unable to connect to the database:', error);
    throw error;
  }
};

/**
 * Connect to database with retry logic
 */
export const connectDatabase = async (
  attempt: number = 1
): Promise<void> => {
  try {
    logger.info(`Attempting to connect to database (attempt ${attempt}/${DB_CONNECTION_RETRY_ATTEMPTS})...`);
    await testConnection();
    logger.info('✓ Database connection established successfully');
  } catch (error) {
    logger.error(`✗ Database connection failed (attempt ${attempt}/${DB_CONNECTION_RETRY_ATTEMPTS}):`, error);

    if (attempt < DB_CONNECTION_RETRY_ATTEMPTS) {
      logger.info(`Retrying in ${DB_CONNECTION_RETRY_DELAY / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, DB_CONNECTION_RETRY_DELAY));
      return connectDatabase(attempt + 1);
    } else {
      logger.error('✗ Failed to connect to database after maximum retry attempts');
      throw new Error('Database connection failed');
    }
  }
};

/**
 * Close database connection
 */
export const closeConnection = async (): Promise<void> => {
  try {
    await sequelize.close();
    logger.info('✓ Database connection has been closed successfully.');
  } catch (error) {
    logger.error('✗ Error closing database connection:', error);
    throw error;
  }
};

/**
 * Graceful shutdown handler
 */
export const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`\n${signal} received. Starting graceful shutdown...`);

  try {
    // Close database connection
    await sequelize.close();
    logger.info('✓ Database connection closed successfully');

    // Close Redis connection
    await redisService.disconnect();
    logger.info('✓ Redis connection closed successfully');

    process.exit(0);
  } catch (error) {
    logger.error('✗ Error during graceful shutdown:', error);
    process.exit(1);
  }
};

/**
 * Sync database models (use with caution in production)
 */
export const syncDatabase = async (options?: { force?: boolean; alter?: boolean }): Promise<void> => {
  try {
    if (config.env === 'production' && options?.force) {
      throw new Error('Force sync is not allowed in production environment');
    }

    await sequelize.sync(options);
    console.log('✓ Database models synchronized successfully.');
  } catch (error) {
    console.error('✗ Error synchronizing database models:', error);
    throw error;
  }
};

// Export default Sequelize instance
export default sequelize;
