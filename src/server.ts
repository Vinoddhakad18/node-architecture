import { createApp } from './app';
import { config, logger } from './config';

/**
 * Start the Express server
 */
const startServer = (): void => {
  const app = createApp();

  app.listen(config.port, () => {
    logger.info('=================================');
    logger.info(`Server running in ${config.env} mode`);
    logger.info(`Listening on port ${config.port}`);
    logger.info(`API endpoint: http://localhost:${config.port}${config.apiPrefix}`);
    logger.info('=================================');
  });
};

// Start the server
startServer();
