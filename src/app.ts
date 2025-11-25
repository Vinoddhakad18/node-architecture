/**
 * Bootstrap configuration
 * New Relic must be the first module loaded if enabled
 * Load environment variables first to check if New Relic should be enabled
 */
import path from 'path';

import dotenv from 'dotenv';

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
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec, swaggerUiOptions } from './swagger';

import { config } from '@/config';

import routes from '@routes/index';
import {
  errorHandler,
  notFoundHandler,
  logger,
  errorLogger,
  attachResponseHandlers,
  requestIdMiddleware,
  apiKeyAuth,
} from '@middleware/index';
import { metricsMiddleware } from '@middleware/metrics';
import { connectDatabase } from '@config/database';
import redisService from '@helpers/redis.helper';

/**
 * Rate limiter configuration
 */
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
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
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
    })
  );

  // Rate limiting
  app.use(limiter);

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve static files from uploads directory
  app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

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
  app.get('/health', async (_req, res) => {
    const { getUptimeInfo } = require('./application/utils/uptime');
    const uptimeInfo = getUptimeInfo();

    // Check Redis health
    let redisStatus = 'disconnected';

    if (!redisService.isRedisEnabled()) {
      redisStatus = 'disabled';
    } else {
      try {
        const isReady = redisService.isReady();
        if (isReady) {
          await redisService.ping();
          redisStatus = 'connected';
        }
      } catch (error) {
        redisStatus = 'error';
      }
    }

    res.sendSuccess(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        serverStartTime: uptimeInfo.startTime,
        uptime: {
          seconds: uptimeInfo.uptimeSeconds,
          formatted: uptimeInfo.uptimeFormatted,
        },
        environment: config.env,
        services: {
          database: 'connected',
          redis: redisStatus,
        },
        process: {
          pid: process.pid,
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
        },
      },
      'Health check successful'
    );
  });

  // Migration health check endpoint
  app.get('/health/migrations', async (_req, res) => {
    const {
      checkMigrationHealth,
      getMigrationStats,
    } = require('./application/utils/migrationHealth');

    try {
      const [healthResult, stats] = await Promise.all([
        checkMigrationHealth(),
        getMigrationStats(),
      ]);

      const isHealthy = healthResult.status === 'healthy' || healthResult.status === 'warning';
      const httpStatus = isHealthy ? 200 : 503;

      res.sendCustom(
        httpStatus,
        {
          ...healthResult,
          stats,
          timestamp: new Date().toISOString(),
          environment: config.env,
        },
        healthResult.message || 'Migration health check',
        isHealthy
      );
    } catch (error) {
      res.sendServiceUnavailable('Migration health check failed');
    }
  });

  // Global API Key Authentication
  // Applied to all API routes (but not health checks or docs)
  app.use(config.apiPrefix, apiKeyAuth);

  // Routes
  app.use(config.apiPrefix, routes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
