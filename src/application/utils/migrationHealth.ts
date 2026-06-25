import { QueryTypes } from 'sequelize';

import { sequelize } from '../config/database';
import { logger } from '../config/logger';

/**
 * Migration health check result interface
 */
export interface MigrationHealthResult {
  status: 'healthy' | 'warning' | 'error';
  database: {
    connected: boolean;
    error?: string;
  };
  migrations: {
    executed: string[];
    count: number;
    lastMigration?: string;
    error?: string;
  };
  recommendations?: string[];
}

/**
 * Check if migrations table exists
 */
const checkMigrationsTableExists = async (): Promise<boolean> => {
  try {
    const result = await sequelize.query<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM information_schema.tables
       WHERE table_schema = DATABASE()
       AND table_name = 'SequelizeMeta'`,
      { type: QueryTypes.SELECT }
    );

    return result[0]?.count > 0;
  } catch (error) {
    logger.error('Error checking migrations table:', error);
    return false;
  }
};

/**
 * Get executed migrations from database
 */
const getExecutedMigrations = async (): Promise<string[]> => {
  try {
    const tableExists = await checkMigrationsTableExists();

    if (!tableExists) {
      logger.warn('SequelizeMeta table does not exist - no migrations have been run');
      return [];
    }

    const migrations = await sequelize.query<{ name: string }>(
      'SELECT name FROM SequelizeMeta ORDER BY name ASC',
      { type: QueryTypes.SELECT }
    );

    return migrations.map((m) => m.name);
  } catch (error) {
    logger.error('Error fetching executed migrations:', error);
    throw error;
  }
};

/**
 * Check migration health status
 */
export const checkMigrationHealth = async (): Promise<MigrationHealthResult> => {
  const result: MigrationHealthResult = {
    status: 'healthy',
    database: {
      connected: false,
    },
    migrations: {
      executed: [],
      count: 0,
    },
    recommendations: [],
  };

  // Check database connectivity
  try {
    await sequelize.authenticate();
    result.database.connected = true;
  } catch (error) {
    result.status = 'error';
    result.database.connected = false;
    result.database.error = error instanceof Error ? error.message : 'Unknown error';
    result.recommendations?.push('Database connection failed');
    return result;
  }

  // Check migrations
  try {
    const tableExists = await checkMigrationsTableExists();

    if (!tableExists) {
      result.status = 'warning';
      result.migrations.error = 'SequelizeMeta table does not exist';
      result.recommendations?.push('No migrations have been executed yet');
      return result;
    }

    const executedMigrations = await getExecutedMigrations();
    result.migrations.executed = executedMigrations;
    result.migrations.count = executedMigrations.length;

    if (executedMigrations.length > 0) {
      result.migrations.lastMigration = executedMigrations[executedMigrations.length - 1];
    } else {
      result.status = 'warning';
      result.recommendations?.push('SequelizeMeta table exists but no migrations recorded');
    }
  } catch (error) {
    result.status = 'error';
    result.migrations.error = error instanceof Error ? error.message : 'Unknown error';
    return result;
  }

  return result;
};

/**
 * Get migration statistics
 */
export const getMigrationStats = async (): Promise<{
  total: number;
  oldest?: string;
  newest?: string;
}> => {
  try {
    const tableExists = await checkMigrationsTableExists();

    if (!tableExists) {
      return { total: 0 };
    }

    const migrations = await getExecutedMigrations();

    return {
      total: migrations.length,
      oldest: migrations[0],
      newest: migrations[migrations.length - 1],
    };
  } catch (error) {
    logger.error('Error getting migration stats:', error);
    return { total: 0 };
  }
};
