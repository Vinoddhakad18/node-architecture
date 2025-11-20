import { initializeServerStartTime, getFormattedServerUptime } from '@application/utils/uptime';
import { gracefulShutdown } from '@config/database';
import { logger } from '@config/logger';

import { createApp } from './app';

import { config } from '@/config';

/**
 * Start the Express server
 */
const startServer = async (): Promise<void> => {
  try {
    // Step 1: Initialize server start time
    initializeServerStartTime();

    // Step 2: Check database connection before starting server
    logger.info('=================================');
    logger.info('Initializing application...');
    logger.info('=================================');

    // Step 3: Create Express app (includes database connection)
    const app = await createApp();

    // Step 4: Start server
    app.listen(config.port, () => {
      logger.info('=================================');
      logger.info(`✓ Server started successfully`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`Port: ${config.port}`);
      logger.info(`Process ID: ${process.pid}`);
      logger.info(`API endpoint: http://localhost:${config.port}${config.apiPrefix}`);
      logger.info(`Health check: http://localhost:${config.port}/health`);
      logger.info(`Monitoring: ${config.monitoring?.enabled ? 'Enabled' : 'Disabled'}`);
      logger.info(`New Relic APM: ${config.newRelic?.enabled ? 'Enabled' : 'Disabled'}`);
      logger.info('=================================');
    });

    // Step 5: Log uptime every hour
    setInterval(() => {
      logger.info(`Server uptime: ${getFormattedServerUptime()}`);
    }, 3600000); // 1 hour in milliseconds

    // Step 6: Setup graceful shutdown handlers
    process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => void gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error('=================================');
    logger.error('✗ Failed to start server:', error);
    logger.error('=================================');
    process.exit(1);
  }
};

// Start the server
void startServer();
