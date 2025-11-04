import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Express } from 'express';
import config from '@config/index';
import logger from '@utils/logger';

/**
 * Configure Helmet for security headers
 */
export const configureHelmet = (app: Express): void => {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    })
  );

  logger.info('Helmet security middleware configured');
};

/**
 * Configure CORS
 */
export const configureCORS = (app: Express): void => {
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: config.cors.credentials,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['X-Total-Count', 'X-Page-Number'],
      maxAge: 86400 // 24 hours
    })
  );

  logger.info('CORS middleware configured');
};

/**
 * General rate limiter for all routes
 */
export const generalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: config.rateLimit.standardHeaders,
  legacyHeaders: config.rateLimit.legacyHeaders,
  message: {
    success: false,
    message: 'Too many requests, please try again later'
  },
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later'
    });
  }
});

/**
 * Strict rate limiter for authentication routes
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later'
  },
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again in 15 minutes'
    });
  }
});

/**
 * API rate limiter for general API routes
 */
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'API rate limit exceeded'
  }
});

/**
 * Configure all security middlewares
 */
export const configureSecurity = (app: Express): void => {
  configureHelmet(app);
  configureCORS(app);
  app.use(generalRateLimiter);
  logger.info('All security middlewares configured');
};
