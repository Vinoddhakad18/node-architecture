/**
 * Bootstrap configuration
 * New Relic must be the first module loaded if enabled
 * Load environment variables first to check if New Relic should be enabled
 */
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
// dotenv handles missing files gracefully, no need for existence check
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// Conditionally load New Relic APM
// Must be loaded before other imports to properly instrument the application
if (process.env.NEW_RELIC_ENABLED === 'true') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('newrelic');
  // Using console.log here is acceptable as logger is not yet initialized
  // eslint-disable-next-line no-console
  console.log('✓ New Relic APM initialized');
}

import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import routes from './application/routes';
import { errorHandler, notFoundHandler, logger, errorLogger, attachResponseHandlers, requestIdMiddleware } from './application/middleware';
import { metricsMiddleware } from './application/middleware/metrics';
import { connectDatabase } from './application/config/sequelize/database';
import { swaggerSpec, swaggerUiOptions } from './swagger';

/**
 * Rate limiter configuration
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again later.',
});

/**
 * Create and configure Express application
 */
export const createApp = async (): Promise<Application> => {
  await connectDatabase();

  const app: Application = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(cors({
    origin: config.cors.origin,
    credentials: true,
  }));

  // Rate limiting
  app.use(limiter);

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request ID tracking - Must be before logger to include in logs
  app.use(requestIdMiddleware);

  // Metrics middleware - Track request metrics (conditional based on MONITORING_ENABLED)
  if (config.monitoring?.enabled) {
    app.use(metricsMiddleware);
  }

  app.use(logger);
  app.use(errorLogger);
  app.use(attachResponseHandlers);

  // Swagger documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

  // Swagger JSON endpoint
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Health check endpoint
  app.get('/health', (_req, res) => {
    const { getUptimeInfo } = require('./application/utils/uptime');
    const uptimeInfo = getUptimeInfo();

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      serverStartTime: uptimeInfo.startTime,
      uptime: {
        seconds: uptimeInfo.uptimeSeconds,
        formatted: uptimeInfo.uptimeFormatted,
      },
      environment: config.env,
      process: {
        pid: process.pid,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
      },
    });
  });

  // Migration health check endpoint
  app.get('/health/migrations', async (_req, res) => {
    const { checkMigrationHealth, getMigrationStats } = require('./application/utils/migrationHealth');

    try {
      const [healthResult, stats] = await Promise.all([
        checkMigrationHealth(),
        getMigrationStats(),
      ]);

      const httpStatus =
        healthResult.status === 'healthy' ? 200 :
        healthResult.status === 'warning' ? 200 :
        503;

      res.status(httpStatus).json({
        ...healthResult,
        stats,
        timestamp: new Date().toISOString(),
        environment: config.env,
      });
    } catch (error) {
      res.status(503).json({
        status: 'error',
        message: 'Migration health check failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Routes
  app.use(config.apiPrefix, routes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
