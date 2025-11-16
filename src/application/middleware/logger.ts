import morgan from 'morgan';
import { Request, RequestHandler } from 'express';
import { stream, logger as winstonLogger } from '../config/logger';
import { config } from '../../config';

/**
 * Custom Morgan token for real IP address
 */
morgan.token('real-ip', (req) => {
  return req.headers['x-forwarded-for'] as string ||
         req.headers['x-real-ip'] as string ||
         req.socket.remoteAddress ||
         'unknown';
});

/**
 * Custom Morgan token for request body (sanitized)
 */
morgan.token('request-body', (req) => {
  const expressReq = req as unknown as Request;
  if (expressReq.body && Object.keys(expressReq.body).length > 0) {
    const sanitized = { ...expressReq.body };
    // Remove sensitive fields
    if (sanitized.password) sanitized.password = '***';
    if (sanitized.token) sanitized.token = '***';
    if (sanitized.apiKey) sanitized.apiKey = '***';
    return JSON.stringify(sanitized);
  }
  return '-';
});

/**
 * Custom Morgan token for process ID
 */
morgan.token('pid', () => process.pid.toString());

/**
 * Custom Morgan token for request ID
 */
morgan.token('request-id', (req) => {
  const expressReq = req as unknown as Request;
  return expressReq.requestId || '-';
});

/**
 * Enhanced Morgan HTTP request logger middleware with Winston integration
 *
 * Logs detailed information including:
 * - HTTP method and URL
 * - Status code and response time
 * - User agent and real IP address
 * - Request body (sanitized)
 * - Content length, process ID, and request ID
 */
const morganFormat = ':real-ip - :method :url :status :res[content-length] - :response-time ms - :user-agent - PID::pid - ReqID::request-id';

/**
 * Morgan middleware with conditional logging based on status code
 * Returns a no-op middleware if HTTP logging is disabled
 */
export const logger: RequestHandler = config.logging.http.enabled
  ? morgan(morganFormat, {
      stream,
      skip: (req, _res) => {
        // Skip logging for health check endpoint
        return req.url === '/health';
      },
    })
  : (_req, _res, next) => next(); // No-op middleware when HTTP logging is disabled

/**
 * Additional Morgan middleware for error logging (4xx and 5xx status codes)
 * Returns a no-op middleware if HTTP logging is disabled
 */
export const errorLogger: RequestHandler = config.logging.http.enabled
  ? morgan(morganFormat, {
      stream: {
        write: (message: string) => {
          winstonLogger.error(message.trim());
        },
      },
      skip: (_req, res) => {
        // Only log errors (4xx and 5xx)
        return res.statusCode < 400;
      },
    })
  : (_req, _res, next) => next(); // No-op middleware when HTTP logging is disabled
