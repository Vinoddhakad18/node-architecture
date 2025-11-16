import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Request ID Middleware
 *
 * Generates a unique request ID for each incoming request to enable tracing
 * across distributed systems and correlating logs.
 *
 * Features:
 * - Generates UUID v4 for each request
 * - Attaches request ID to req.requestId
 * - Sets X-Request-ID header in response
 * - Supports client-provided request IDs via X-Request-ID header
 *
 * @example
 * // In your application:
 * app.use(requestIdMiddleware);
 *
 * // In your route handlers:
 * logger.info('Processing request', { requestId: req.requestId });
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Check if client provided a request ID, otherwise generate a new one
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();

  // Attach request ID to request object
  req.requestId = requestId;

  // Set request ID in response header for client tracking
  res.setHeader('X-Request-ID', requestId);

  next();
};
