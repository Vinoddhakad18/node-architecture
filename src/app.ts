import express, { Application } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import routes from './application/routes';
import { errorHandler, notFoundHandler, logger, errorLogger, attachResponseHandlers } from './application/middleware';
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

  // Rate limiting
  app.use(limiter);

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
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

  // Routes
  app.use(config.apiPrefix, routes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
