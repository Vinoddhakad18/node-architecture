/**
 * Unit Tests for API Key Authentication Middleware
 * Tests API key validation and security features
 */

import { Request, Response, NextFunction } from 'express';

// Mock logger before importing middleware
jest.mock('@config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('API Key Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      header: jest.fn(),
      headers: {},
    };

    mockResponse = {
      sendUnauthorized: jest.fn(),
      sendForbidden: jest.fn(),
    };

    nextFunction = jest.fn();
  });

  describe('apiKeyAuth', () => {
    beforeEach(() => {
      // Reset modules to allow fresh imports with new env vars
      jest.resetModules();
    });

    it('should successfully authenticate with valid API key', async () => {
      // Arrange
      const validKey = 'test-api-key-123';
      process.env.X_API_KEYS = validKey;

      // Import middleware after setting env var
      const { apiKeyAuth } = await import('../apiKey.middleware');

      (mockRequest.header as jest.Mock).mockReturnValue(validKey);

      // Act
      apiKeyAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(mockRequest.header).toHaveBeenCalledWith('X-API-Key');
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.sendUnauthorized).not.toHaveBeenCalled();
      expect(mockResponse.sendForbidden).not.toHaveBeenCalled();
    });

    it('should authenticate with one of multiple valid API keys', async () => {
      // Arrange
      const validKeys = 'key1,key2,key3';
      const incomingKey = 'key2';
      process.env.X_API_KEYS = validKeys;

      const { apiKeyAuth } = await import('../apiKey.middleware');

      (mockRequest.header as jest.Mock).mockReturnValue(incomingKey);

      // Act
      apiKeyAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.sendForbidden).not.toHaveBeenCalled();
    });

    it('should reject request without API key header', async () => {
      // Arrange
      process.env.X_API_KEYS = 'test-key';
      const { apiKeyAuth } = await import('../apiKey.middleware');

      (mockRequest.header as jest.Mock).mockReturnValue(undefined);

      // Act
      apiKeyAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(mockResponse.sendUnauthorized).toHaveBeenCalledWith('Missing API Key');
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject request with invalid API key', async () => {
      // Arrange
      process.env.X_API_KEYS = 'valid-key-1,valid-key-2';
      const { apiKeyAuth } = await import('../apiKey.middleware');

      (mockRequest.header as jest.Mock).mockReturnValue('invalid-key');

      // Act
      apiKeyAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(mockResponse.sendForbidden).toHaveBeenCalledWith('Invalid API Key');
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle keys with whitespace correctly', async () => {
      // Arrange
      process.env.X_API_KEYS = ' key1 , key2 , key3 ';
      const { apiKeyAuth } = await import('../apiKey.middleware');

      (mockRequest.header as jest.Mock).mockReturnValue('key2');

      // Act
      apiKeyAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.sendForbidden).not.toHaveBeenCalled();
    });

    it('should reject when API keys are not configured', async () => {
      // Arrange
      process.env.X_API_KEYS = '';
      const { apiKeyAuth } = await import('../apiKey.middleware');

      (mockRequest.header as jest.Mock).mockReturnValue('any-key');

      // Act
      apiKeyAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(mockResponse.sendForbidden).toHaveBeenCalledWith('Invalid API Key');
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject when X_API_KEYS env var is undefined', async () => {
      // Arrange
      delete process.env.X_API_KEYS;
      const { apiKeyAuth } = await import('../apiKey.middleware');

      (mockRequest.header as jest.Mock).mockReturnValue('any-key');

      // Act
      apiKeyAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(mockResponse.sendForbidden).toHaveBeenCalledWith('Invalid API Key');
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should use constant-time comparison for security', async () => {
      // Arrange
      process.env.X_API_KEYS = 'secure-key-123';
      const { apiKeyAuth } = await import('../apiKey.middleware');

      // Test with almost matching key (should still be rejected)
      (mockRequest.header as jest.Mock).mockReturnValue('secure-key-124');

      // Act
      apiKeyAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(mockResponse.sendForbidden).toHaveBeenCalledWith('Invalid API Key');
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle empty strings in comma-separated keys', async () => {
      // Arrange
      process.env.X_API_KEYS = 'key1,,key2,,,key3';
      const { apiKeyAuth } = await import('../apiKey.middleware');

      (mockRequest.header as jest.Mock).mockReturnValue('key2');

      // Act
      apiKeyAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should reject keys with different lengths using timingSafeEqual', async () => {
      // Arrange
      process.env.X_API_KEYS = 'short';
      const { apiKeyAuth } = await import('../apiKey.middleware');

      (mockRequest.header as jest.Mock).mockReturnValue('verylongkey');

      // Act
      apiKeyAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(mockResponse.sendForbidden).toHaveBeenCalledWith('Invalid API Key');
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should be case-sensitive for API keys', async () => {
      // Arrange
      process.env.X_API_KEYS = 'SecureKey123';
      const { apiKeyAuth } = await import('../apiKey.middleware');

      (mockRequest.header as jest.Mock).mockReturnValue('securekey123');

      // Act
      apiKeyAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      // Assert
      expect(mockResponse.sendForbidden).toHaveBeenCalledWith('Invalid API Key');
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});
