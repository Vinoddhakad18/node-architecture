/**
 * Unit Tests for Request Validation Middleware
 * Tests Zod schema validation for requests
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateRequest } from '../validateRequest';

describe('validateRequest Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {},
    };

    mockResponse = {
      sendBadRequest: jest.fn(),
    };

    nextFunction = jest.fn();
  });

  describe('body validation', () => {
    const schema = z.object({
      body: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
      }),
      query: z.object({}).optional(),
      params: z.object({}).optional(),
    });

    it('should pass validation with valid body', async () => {
      // Arrange
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      const middleware = validateRequest(schema);

      // Act
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.sendBadRequest).not.toHaveBeenCalled();
    });

    it('should fail validation with invalid email', async () => {
      // Arrange
      mockRequest.body = {
        email: 'invalid-email',
        password: 'password123',
      };

      const middleware = validateRequest(schema);

      // Act
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockResponse.sendBadRequest).toHaveBeenCalledWith(
        'Validation failed',
        expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: 'Invalid email format',
          }),
        ])
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should fail validation with short password', async () => {
      // Arrange
      mockRequest.body = {
        email: 'test@example.com',
        password: '123',
      };

      const middleware = validateRequest(schema);

      // Act
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockResponse.sendBadRequest).toHaveBeenCalledWith(
        'Validation failed',
        expect.arrayContaining([
          expect.objectContaining({
            field: 'password',
            message: 'Password must be at least 6 characters',
          }),
        ])
      );
    });

    it('should return multiple validation errors', async () => {
      // Arrange
      mockRequest.body = {
        email: 'invalid',
        password: '123',
      };

      const middleware = validateRequest(schema);

      // Act
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockResponse.sendBadRequest).toHaveBeenCalledWith(
        'Validation failed',
        expect.arrayContaining([
          expect.objectContaining({ field: 'email' }),
          expect.objectContaining({ field: 'password' }),
        ])
      );
    });

    it('should fail validation with missing required fields', async () => {
      // Arrange
      mockRequest.body = {};

      const middleware = validateRequest(schema);

      // Act
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockResponse.sendBadRequest).toHaveBeenCalledWith(
        'Validation failed',
        expect.any(Array)
      );
    });
  });

  describe('query validation', () => {
    const schema = z.object({
      body: z.object({}).optional(),
      query: z.object({
        page: z.string().regex(/^\d+$/, 'Page must be a number'),
        limit: z.string().regex(/^\d+$/, 'Limit must be a number'),
      }),
      params: z.object({}).optional(),
    });

    it('should pass validation with valid query params', async () => {
      // Arrange
      mockRequest.query = {
        page: '1',
        limit: '10',
      };

      const middleware = validateRequest(schema);

      // Act
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should fail validation with invalid query params', async () => {
      // Arrange
      mockRequest.query = {
        page: 'abc',
        limit: '10',
      };

      const middleware = validateRequest(schema);

      // Act
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockResponse.sendBadRequest).toHaveBeenCalledWith(
        'Validation failed',
        expect.arrayContaining([
          expect.objectContaining({
            field: 'page',
            message: 'Page must be a number',
          }),
        ])
      );
    });
  });

  describe('params validation', () => {
    const schema = z.object({
      body: z.object({}).optional(),
      query: z.object({}).optional(),
      params: z.object({
        id: z.string().regex(/^\d+$/, 'ID must be a number'),
      }),
    });

    it('should pass validation with valid params', async () => {
      // Arrange
      mockRequest.params = { id: '123' };

      const middleware = validateRequest(schema);

      // Act
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should fail validation with invalid params', async () => {
      // Arrange
      mockRequest.params = { id: 'abc' };

      const middleware = validateRequest(schema);

      // Act
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockResponse.sendBadRequest).toHaveBeenCalledWith(
        'Validation failed',
        expect.arrayContaining([
          expect.objectContaining({
            field: 'id',
            message: 'ID must be a number',
          }),
        ])
      );
    });
  });

  describe('combined validation', () => {
    const schema = z.object({
      body: z.object({
        name: z.string().min(1, 'Name is required'),
      }),
      query: z.object({
        sort: z.enum(['asc', 'desc']).optional(),
      }),
      params: z.object({
        id: z.string().regex(/^\d+$/, 'ID must be a number'),
      }),
    });

    it('should validate body, query, and params together', async () => {
      // Arrange
      mockRequest.body = { name: 'Test' };
      mockRequest.query = { sort: 'asc' };
      mockRequest.params = { id: '1' };

      const middleware = validateRequest(schema);

      // Act
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should fail with errors from multiple sources', async () => {
      // Arrange
      mockRequest.body = {};
      mockRequest.query = { sort: 'invalid' };
      mockRequest.params = { id: 'abc' };

      const middleware = validateRequest(schema);

      // Act
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockResponse.sendBadRequest).toHaveBeenCalledWith(
        'Validation failed',
        expect.any(Array)
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should pass non-Zod errors to next', async () => {
      // Arrange
      const throwingSchema = {
        parseAsync: jest.fn().mockRejectedValue(new Error('Unknown error')),
      };

      const middleware = validateRequest(throwingSchema as any);

      // Act
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
      expect(mockResponse.sendBadRequest).not.toHaveBeenCalled();
    });
  });

  describe('optional fields', () => {
    const schema = z.object({
      body: z.object({
        required: z.string().min(1, 'Required field'),
        optional: z.string().optional(),
      }),
      query: z.object({}).optional(),
      params: z.object({}).optional(),
    });

    it('should pass validation when optional fields are missing', async () => {
      // Arrange
      mockRequest.body = { required: 'value' };

      const middleware = validateRequest(schema);

      // Act
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should still validate optional fields when present', async () => {
      // Arrange
      mockRequest.body = { required: 'value', optional: 123 }; // optional should be string

      const middleware = validateRequest(schema);

      // Act
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockResponse.sendBadRequest).toHaveBeenCalled();
    });
  });

  describe('nested object validation', () => {
    const schema = z.object({
      body: z.object({
        user: z.object({
          name: z.string().min(1, 'Name is required'),
          address: z.object({
            city: z.string().min(1, 'City is required'),
          }),
        }),
      }),
      query: z.object({}).optional(),
      params: z.object({}).optional(),
    });

    it('should validate nested objects', async () => {
      // Arrange
      mockRequest.body = {
        user: {
          name: 'John',
          address: {
            city: 'New York',
          },
        },
      };

      const middleware = validateRequest(schema);

      // Act
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return correct field paths for nested errors', async () => {
      // Arrange
      mockRequest.body = {
        user: {
          name: 'John',
          address: {
            city: '',
          },
        },
      };

      const middleware = validateRequest(schema);

      // Act
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockResponse.sendBadRequest).toHaveBeenCalledWith(
        'Validation failed',
        expect.arrayContaining([
          expect.objectContaining({
            field: expect.stringContaining('city'),
          }),
        ])
      );
    });
  });

  describe('array validation', () => {
    const schema = z.object({
      body: z.object({
        items: z.array(z.string()).min(1, 'At least one item required'),
      }),
      query: z.object({}).optional(),
      params: z.object({}).optional(),
    });

    it('should validate arrays', async () => {
      // Arrange
      mockRequest.body = { items: ['item1', 'item2'] };

      const middleware = validateRequest(schema);

      // Act
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should fail with empty array when min is required', async () => {
      // Arrange
      mockRequest.body = { items: [] };

      const middleware = validateRequest(schema);

      // Act
      await middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockResponse.sendBadRequest).toHaveBeenCalled();
    });
  });
});
