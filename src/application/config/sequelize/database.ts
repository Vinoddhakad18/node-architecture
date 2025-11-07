import { Sequelize, Options, Dialect } from 'sequelize';
import { config } from '../../../config';

/**
 * Sequelize Database Configuration
 * Supports multiple environments with dynamic values from env files
 */

// Determine the database dialect based on environment or default to mysql
const dialect: Dialect = (process.env.DB_DIALECT as Dialect) || 'mysql';

// Base Sequelize configuration options
const sequelizeOptions: Options = {
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  username: config.database.username || process.env.DB_USER,
  password: config.database.password,
  dialect,

  // Connection pool configuration for better performance
  pool: {
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    min: parseInt(process.env.DB_POOL_MIN || '0', 10),
    acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10), // 30 seconds
    idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10), // 10 seconds
  },

  // Logging configuration - use custom logger or disable based on environment
  logging: process.env.DB_LOGGING === 'true'
    ? (sql: string) => {
        if (config.logging.level === 'debug') {
          console.log('[Sequelize]:', sql);
        }
      }
    : false,

  // Timezone configuration
  timezone: process.env.DB_TIMEZONE || '+00:00',

  // Define options for table naming and timestamps
  define: {
    timestamps: true, // Enable createdAt and updatedAt
    underscored: process.env.DB_UNDERSCORED === 'true' || false, // Use snake_case instead of camelCase
    freezeTableName: process.env.DB_FREEZE_TABLE_NAME === 'true' || false, // Don't pluralize table names
    paranoid: process.env.DB_PARANOID === 'true' || false, // Enable soft deletes
  },

  // Dialect-specific options
  dialectOptions: {
    // MySQL specific options
    ...(dialect === 'mysql' && {
      charset: process.env.DB_CHARSET || 'utf8mb4',
      collate: process.env.DB_COLLATE || 'utf8mb4_unicode_ci',
      // SSL configuration for production
      ...(config.env === 'production' && process.env.DB_SSL === 'true' && {
        ssl: {
          require: true,
          rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
        },
      }),
      // Connection timeout
      connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '10000', 10),
    }),

    // PostgreSQL specific options (if needed in the future)
    ...(dialect === 'postgres' && {
      ssl: config.env === 'production' && process.env.DB_SSL === 'true'
        ? {
            require: true,
            rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
          }
        : false,
    }),
  },

  // Benchmark queries in development
  benchmark: config.env !== 'production' && process.env.DB_BENCHMARK === 'true',

  // Retry configuration for failed connections
  retry: {
    max: parseInt(process.env.DB_RETRY_MAX || '3', 10),
  },
};

/**
 * Sequelize instance - singleton pattern
 */
export const sequelize = new Sequelize(sequelizeOptions);

/**
 * Test database connection
 */
export const testConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✓ Database connection has been established successfully.');
  } catch (error) {
    console.error('✗ Unable to connect to the database:', error);
    throw error;
  }
};

/**
 * Close database connection
 */
export const closeConnection = async (): Promise<void> => {
  try {
    await sequelize.close();
    console.log('✓ Database connection has been closed successfully.');
  } catch (error) {
    console.error('✗ Error closing database connection:', error);
    throw error;
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
