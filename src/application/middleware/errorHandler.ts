import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../domain/errors/AppError';

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle AppError instances
  if (err instanceof AppError) {
    // Only log stack trace for server errors (5xx), not client errors (4xx)
    if (err.statusCode >= 500) {
      console.error('Error:', err.stack);
    }

    const responseBody: any = {
      success: false,
      message: err.message,
    };

    // Include validation details if present
    if (err.details) {
      try {
        responseBody.errors = JSON.parse(err.details);
      } catch {
        responseBody.details = err.details;
      }
    }

    res.status(err.statusCode).json(responseBody);
    return;
  }

  // Handle generic errors - always log these
  console.error('Error:', err.stack);

  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`,
  });
};
