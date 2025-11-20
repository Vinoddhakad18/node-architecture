/**
 * Unit Tests for Error Handler Middleware
 * Tests global error handling and response formatting
 */

import { Request, Response, NextFunction } from 'express';
import { errorHandler, notFoundHandler } from '../errorHandler';
import { AppError } from '@/domain/errors/AppError';

// Mock logger
jest.mock('@config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {};

    mockResponse = {
      sendCustom: jest.fn(),
      sendNotFound: jest.fn(),
      sendServiceUnavailable: jest.fn(),
    };

    nextFunction = jest.fn();
  });

  describe('errorHandler', () => {
    describe('AppError handling', () => {
      it('should handle AppError with 400 status code', () => {
        // Arrange
        const error = new AppError('Bad request', 400);

        // Act
        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(mockResponse.sendCustom).toHaveBeenCalledWith(
          400,
          null,
          'Bad request',
          false,
          undefined
        );
      });

      it('should handle AppError with 401 status code', () => {
        // Arrange
        const error = new AppError('Unauthorized', 401);

        // Act
        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(mockResponse.sendCustom).toHaveBeenCalledWith(
          401,
          null,
          'Unauthorized',
          false,
          undefined
        );
      });

      it('should handle AppError with 403 status code', () => {
        // Arrange
        const error = new AppError('Forbidden', 403);

        // Act
        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(mockResponse.sendCustom).toHaveBeenCalledWith(
          403,
          null,
          'Forbidden',
          false,
          undefined
        );
      });

      it('should handle AppError with 404 status code', () => {
        // Arrange
        const error = new AppError('Not found', 404);

        // Act
        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(mockResponse.sendCustom).toHaveBeenCalledWith(
          404,
          null,
          'Not found',
          false,
          undefined
        );
      });

      it('should handle AppError with 500 status code', () => {
        // Arrange
        const error = new AppError('Internal server error', 500);

        // Act
        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(mockResponse.sendCustom).toHaveBeenCalledWith(
          500,
          null,
          'Internal server error',
          false,
          undefined
        );
      });

      it('should parse JSON details when present', () => {
        // Arrange
        const validationErrors = [
          { field: 'email', message: 'Invalid email' },
          { field: 'password', message: 'Too short' },
        ];
        const error = new AppError(
          'Validation failed',
          400,
          true,
          JSON.stringify(validationErrors)
        );

        // Act
        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(mockResponse.sendCustom).toHaveBeenCalledWith(
          400,
          null,
          'Validation failed',
          false,
          validationErrors
        );
      });

      it('should handle non-JSON details string', () => {
        // Arrange
        const error = new AppError(
          'Error occurred',
          400,
          true,
          'Some plain text details'
        );

        // Act
        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(mockResponse.sendCustom).toHaveBeenCalledWith(
          400,
          null,
          'Error occurred',
          false,
          undefined
        );
      });

      it('should log stack trace only for server errors (5xx)', () => {
        // Arrange
        const { logger } = require('@config/logger');

        // Client error (4xx) - should not log
        const clientError = new AppError('Bad request', 400);
        errorHandler(
          clientError,
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );
        expect(logger.error).not.toHaveBeenCalled();

        jest.clearAllMocks();

        // Server error (5xx) - should log
        const serverError = new AppError('Server error', 500);
        errorHandler(
          serverError,
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );
        expect(logger.error).toHaveBeenCalledWith(
          'Server error occurred',
          expect.objectContaining({
            message: 'Server error',
            statusCode: 500,
          })
        );
      });
    });

    describe('Generic Error handling', () => {
      it('should handle generic Error', () => {
        // Arrange
        const error = new Error('Something went wrong');

        // Act
        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(mockResponse.sendServiceUnavailable).toHaveBeenCalledWith(
          'An unexpected error occurred'
        );
      });

      it('should log generic errors', () => {
        // Arrange
        const { logger } = require('@config/logger');
        const error = new Error('Unexpected error');

        // Act
        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(logger.error).toHaveBeenCalledWith(
          'Unexpected error occurred',
          expect.objectContaining({
            message: 'Unexpected error',
            name: 'Error',
          })
        );
      });

      it('should handle TypeError', () => {
        // Arrange
        const error = new TypeError('Cannot read property of undefined');

        // Act
        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(mockResponse.sendServiceUnavailable).toHaveBeenCalledWith(
          'An unexpected error occurred'
        );
      });

      it('should handle ReferenceError', () => {
        // Arrange
        const error = new ReferenceError('Variable is not defined');

        // Act
        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(mockResponse.sendServiceUnavailable).toHaveBeenCalled();
      });

      it('should handle SyntaxError', () => {
        // Arrange
        const error = new SyntaxError('Unexpected token');

        // Act
        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(mockResponse.sendServiceUnavailable).toHaveBeenCalled();
      });
    });

    describe('Edge cases', () => {
      it('should handle AppError with empty message', () => {
        // Arrange
        const error = new AppError('', 400);

        // Act
        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(mockResponse.sendCustom).toHaveBeenCalledWith(
          400,
          null,
          '',
          false,
          undefined
        );
      });

      it('should handle AppError with object details in JSON format', () => {
        // Arrange
        const errorDetails = { code: 'VALIDATION_ERROR', field: 'email' };
        const error = new AppError(
          'Validation error',
          400,
          true,
          JSON.stringify(errorDetails)
        );

        // Act
        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(mockResponse.sendCustom).toHaveBeenCalledWith(
          400,
          null,
          'Validation error',
          false,
          errorDetails
        );
      });

      it('should handle errors without stack trace', () => {
        // Arrange
        const error = new Error('No stack');
        delete error.stack;

        // Act
        errorHandler(
          error,
          mockRequest as Request,
          mockResponse as Response,
          nextFunction
        );

        // Assert
        expect(mockResponse.sendServiceUnavailable).toHaveBeenCalled();
      });
    });
  });

  describe('notFoundHandler', () => {
    it('should respond with 404 Not Found', () => {
      // Act
      notFoundHandler(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockResponse.sendNotFound).toHaveBeenCalledWith('Resource not found');
    });
  });
});
