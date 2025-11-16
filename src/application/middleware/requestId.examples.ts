/**
 * Request ID Middleware Usage Examples
 *
 * This file demonstrates how to use request IDs for tracing and correlation
 */

import { Request, Response } from 'express';
import { getLoggerWithRequestId } from '../config/logger';

/**
 * Example 1: Basic usage in route handlers
 * The request ID is automatically available on req.requestId
 */
export const exampleRoute1 = async (req: Request, res: Response) => {
  // Access the request ID
  const requestId = req.requestId;

  console.log(`Processing request with ID: ${requestId}`);

  res.json({
    message: 'Success',
    requestId: requestId,
  });
};

/**
 * Example 2: Using request ID with logger
 * Create a child logger that includes the request ID in all logs
 */
export const exampleRoute2 = async (req: Request, res: Response) => {
  // Create a logger with request ID context
  const logger = getLoggerWithRequestId(req.requestId);

  logger.info('User requested data', { action: 'fetch' });
  logger.info('Processing complete');

  // All logs will automatically include the request ID
  res.json({ message: 'Check logs for request ID' });
};

/**
 * Example 3: Tracing through multiple service calls
 * Pass request ID to service methods for complete tracing
 */
export const exampleRoute3 = async (req: Request, res: Response) => {
  const logger = getLoggerWithRequestId(req.requestId);

  logger.info('Starting multi-step operation');

  try {
    // Pass request ID to service layer
    await someServiceMethod(req.requestId);

    logger.info('Operation completed successfully');
    res.json({ success: true });
  } catch (error) {
    logger.error('Operation failed', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Example 4: Client-provided request IDs
 * Clients can provide their own request ID via X-Request-ID header
 */
export const exampleRoute4 = async (req: Request, res: Response) => {
  // If client sent X-Request-ID header, it will be used
  // Otherwise, a new UUID will be generated
  const logger = getLoggerWithRequestId(req.requestId);

  logger.info('Client request ID or auto-generated ID', {
    wasClientProvided: !!req.headers['x-request-id'],
  });

  res.json({ requestId: req.requestId });
};

/**
 * Example service method that accepts request ID for tracing
 */
async function someServiceMethod(requestId?: string): Promise<void> {
  const logger = getLoggerWithRequestId(requestId);

  logger.info('Service method called');

  // Simulate some work
  await new Promise((resolve) => setTimeout(resolve, 100));

  logger.info('Service method completed');
}

/**
 * Example: Error handling with request ID
 */
export const exampleRoute5 = async (req: Request, res: Response) => {
  const logger = getLoggerWithRequestId(req.requestId);

  try {
    throw new Error('Something went wrong');
  } catch (error) {
    logger.error('Error occurred', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return request ID in error response for support purposes
    res.status(500).json({
      error: 'Internal server error',
      requestId: req.requestId,
      message: 'Please provide this request ID to support',
    });
  }
};
