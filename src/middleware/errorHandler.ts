import { Request, Response, NextFunction } from 'express';
import logger from '@utils/logger';
import config from '@config/index';

/**
 * Custom error class
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal server error';

  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    statusCode,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Send error response
  const response: any = {
    success: false,
    message,
    statusCode
  };

  // Include stack trace in development
  if (config.env === 'local' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * Handle 404 errors
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  logger.warn(`Route not found: ${req.method} ${req.path}`);

  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`
  });
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Database error handler
 */
export const handleDatabaseError = (error: any): AppError => {
  // Sequelize validation error
  if (error.name === 'SequelizeValidationError') {
    const messages = error.errors.map((err: any) => err.message).join(', ');
    return new AppError(`Validation error: ${messages}`, 400);
  }

  // Sequelize unique constraint error
  if (error.name === 'SequelizeUniqueConstraintError') {
    const field = error.errors[0]?.path || 'field';
    return new AppError(`${field} already exists`, 409);
  }

  // Sequelize foreign key constraint error
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return new AppError('Foreign key constraint violation', 400);
  }

  // MongoDB validation error
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors)
      .map((err: any) => err.message)
      .join(', ');
    return new AppError(`Validation error: ${messages}`, 400);
  }

  // MongoDB duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || 'field';
    return new AppError(`${field} already exists`, 409);
  }

  return new AppError(error.message || 'Database error', 500);
};
