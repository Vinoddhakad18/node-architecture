import { createApp } from './app';
import { config, logger } from './config';
import { gracefulShutdown } from './application/config/sequelize/database';

/**
 * Start the Express server
 */
const startServer = async (): Promise<void> => {
  try {
    // Step 1: Check database connection before starting server
    logger.info('=================================');
    logger.info('Initializing application...');
    logger.info('=================================');

    // Step 2: Create Express app (includes database connection)
    const app = await createApp();

    // Step 3: Start server
    app.listen(config.port, () => {
      logger.info('=================================');
      logger.info(`✓ Server started successfully`);
      logger.info(`Environment: ${config.env}`);
      logger.info(`Port: ${config.port}`);
      logger.info(`API endpoint: http://localhost:${config.port}${config.apiPrefix}`);
      logger.info(`Health check: http://localhost:${config.port}/health`);
      logger.info('=================================');
    });

    // Step 4: Setup graceful shutdown handlers
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
startServer();
