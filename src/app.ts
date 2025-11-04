import express, { Express } from 'express';
import config from '@config/index';
import logger from '@utils/logger';
import { initializeDatabases, closeDatabaseConnections } from '@database/index';
import { configureSecurity } from '@middleware/security';
import { errorHandler, notFoundHandler } from '@middleware/errorHandler';
import { requestDecryptMiddleware, responseEncryptMiddleware } from '@middleware/encryption';
import { setupSwagger } from '@config/swagger';
import { setupGraphQL } from '@graphql/index';
import routes from '@routes/index';

const app: Express = express();
const PORT = config.port;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
configureSecurity(app);

// Encryption middleware (optional - can be enabled per route)
// app.use(requestDecryptMiddleware);
// app.use(responseEncryptMiddleware);

// Swagger documentation
setupSwagger(app);

// REST API routes
app.use('/api', routes);

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Initialize server
const startServer = async (): Promise<void> => {
  try {
    // Initialize database connections
    await initializeDatabases();

    // Setup GraphQL
    await setupGraphQL(app);

    // Start server
    app.listen(PORT, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Node Art API Server                                  ║
║                                                           ║
║   Environment: ${config.env.padEnd(41)} ║
║   Port: ${PORT.toString().padEnd(48)} ║
║                                                           ║
║   📚 API Documentation:                                   ║
║   - Swagger UI: http://localhost:${PORT}/api-docs${' '.repeat(14)} ║
║   - GraphQL Playground: http://localhost:${PORT}/graphql${' '.repeat(7)} ║
║                                                           ║
║   ✅ Server is running and ready to accept requests      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  try {
    await closeDatabaseConnections();
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Promise Rejection:', reason);
  // In production, you might want to exit the process
  // process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  // Exit the process for uncaught exceptions
  process.exit(1);
});

// Start the server
startServer();

export default app;
