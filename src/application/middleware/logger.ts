import morgan from 'morgan';
import { Request } from 'express';
import { stream, logger as winstonLogger } from '../config/logger';

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
 * Enhanced Morgan HTTP request logger middleware with Winston integration
 *
 * Logs detailed information including:
 * - HTTP method and URL
 * - Status code and response time
 * - User agent and real IP address
 * - Request body (sanitized)
 * - Content length and process ID
 */
const morganFormat = ':real-ip - :method :url :status :res[content-length] - :response-time ms - :user-agent - PID::pid';

/**
 * Morgan middleware with conditional logging based on status code
 */
export const logger = morgan(morganFormat, {
  stream,
  skip: (req, _res) => {
    // Skip logging for health check endpoint
    return req.url === '/health';
  },
});

/**
 * Additional Morgan middleware for error logging (4xx and 5xx status codes)
 */
export const errorLogger = morgan(morganFormat, {
  stream: {
    write: (message: string) => {
      winstonLogger.error(message.trim());
    },
  },
  skip: (_req, res) => {
    // Only log errors (4xx and 5xx)
    return res.statusCode < 400;
  },
});
