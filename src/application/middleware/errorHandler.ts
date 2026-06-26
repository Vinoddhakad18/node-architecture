import { logger } from '@config/logger';
import { ValidationError, ErrorDetail } from '@interfaces/common.interface';
import { Request, Response, NextFunction } from 'express';

import { AppError } from '@/domain/errors/AppError';

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
      logger.error({
        message: err.message,
        statusCode: err.statusCode,
        stack: err.stack,
        details: err.details,
      },'Server error occurred');
    }

    const responseBody: {
      success: boolean;
      message: string;
      errors?: ValidationError[] | ErrorDetail;
      details?: string;
    } = {
      success: false,
      message: err.message,
    };

    // Include validation details if present
    if (err.details) {
      try {
        responseBody.errors = JSON.parse(err.details) as ValidationError[] | ErrorDetail;
      } catch {
        responseBody.details = err.details;
      }
    }
    res.sendCustom(err.statusCode, null, err.message, false, responseBody.errors);
    return;
  }

  // Handle generic errors - always log these
  logger.error( {
    message: err.message,
    stack: err.stack,
    name: err.name,
  }, 'Unexpected error occurred',);
  res.sendServiceUnavailable('An unexpected error occurred');
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (_req: Request, res: Response, _next: NextFunction): void => {
  res.sendNotFound('Resource not found');
};
