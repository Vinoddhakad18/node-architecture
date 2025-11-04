import { createApp } from './app';
import { config } from './config';

/**
 * Start the Express server
 */
const startServer = (): void => {
  const app = createApp();

  app.listen(config.port, () => {
    console.log('=================================');
    console.log(`Server running in ${config.nodeEnv} mode`);
    console.log(`Listening on port ${config.port}`);
    console.log(`API endpoint: http://localhost:${config.port}${config.apiPrefix}`);
    console.log('=================================');
  });
};

// Start the server
startServer();
