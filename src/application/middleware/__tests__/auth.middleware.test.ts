/**
 * Unit Tests for Authentication Middleware
 * Tests JWT validation and authorization logic
 */

import { Request, Response, NextFunction } from 'express';
import { authenticate, optionalAuthenticate, authorize, checkOwnership } from '../auth.middleware';
import jwtUtil from '@application/utils/jwt.util';
import tokenBlacklistService from '@services/token-blacklist.service';

// Mock dependencies
jest.mock('@application/utils/jwt.util');
jest.mock('@services/token-blacklist.service');
jest.mock('@config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      headers: {},
      params: {},
      user: undefined,
      token: undefined,
    };

    mockResponse = {
      sendUnauthorized: jest.fn(),
      sendForbidden: jest.fn(),
    };

    nextFunction = jest.fn();
  });

  describe('authenticate', () => {
    it('should successfully authenticate with valid token', async () => {
      // Arrange
      const validToken = 'valid-access-token';
      const decodedPayload = {
        userId: 1,
        email: 'test@example.com',
        role: 'user',
      };

      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      };

      (jwtUtil.verifyAccessToken as jest.Mock).mockReturnValue(decodedPayload);
      (tokenBlacklistService.isBlacklisted as jest.Mock).mockResolvedValue(false);
      (tokenBlacklistService.isTokenInvalidatedByUser as jest.Mock).mockResolvedValue(false);

      // Act
      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(jwtUtil.verifyAccessToken).toHaveBeenCalledWith(validToken);
      expect(mockRequest.user).toEqual(decodedPayload);
      expect(mockRequest.token).toBe(validToken);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should reject request without authorization header', async () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockResponse.sendUnauthorized).toHaveBeenCalledWith('Authorization header missing');
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject request with invalid authorization format', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'InvalidFormat token',
      };

      // Act
      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockResponse.sendUnauthorized).toHaveBeenCalledWith(
        'Invalid authorization format. Use: Bearer <token>'
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject request with empty token', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer ',
      };

      // Act
      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockResponse.sendUnauthorized).toHaveBeenCalledWith('Token not provided');
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject blacklisted token', async () => {
      // Arrange
      const token = 'blacklisted-token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      (jwtUtil.verifyAccessToken as jest.Mock).mockReturnValue({
        userId: 1,
        email: 'test@example.com',
        role: 'user',
      });
      (tokenBlacklistService.isBlacklisted as jest.Mock).mockResolvedValue(true);

      // Act
      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockResponse.sendUnauthorized).toHaveBeenCalledWith('Token has been revoked');
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject token invalidated by user action', async () => {
      // Arrange
      const token = 'invalidated-token';
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      (jwtUtil.verifyAccessToken as jest.Mock).mockReturnValue({
        userId: 1,
        email: 'test@example.com',
        role: 'user',
      });
      (tokenBlacklistService.isBlacklisted as jest.Mock).mockResolvedValue(false);
      (tokenBlacklistService.isTokenInvalidatedByUser as jest.Mock).mockResolvedValue(true);

      // Act
      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockResponse.sendUnauthorized).toHaveBeenCalledWith(
        'Token has been invalidated. Please login again.'
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject expired token', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer expired-token',
      };

      (jwtUtil.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Token expired');
      });

      // Act
      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockResponse.sendUnauthorized).toHaveBeenCalledWith('Token expired');
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject invalid token', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      (jwtUtil.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockResponse.sendUnauthorized).toHaveBeenCalledWith('Invalid token');
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should handle generic authentication errors', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer some-token',
      };

      (jwtUtil.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Some unknown error');
      });

      // Act
      await authenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockResponse.sendUnauthorized).toHaveBeenCalledWith('Authentication failed');
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuthenticate', () => {
    it('should attach user info when valid token is present', async () => {
      // Arrange
      const validToken = 'valid-token';
      const decodedPayload = {
        userId: 1,
        email: 'test@example.com',
        role: 'user',
      };

      mockRequest.headers = {
        authorization: `Bearer ${validToken}`,
      };

      (jwtUtil.verifyAccessToken as jest.Mock).mockReturnValue(decodedPayload);
      (tokenBlacklistService.isBlacklisted as jest.Mock).mockResolvedValue(false);
      (tokenBlacklistService.isTokenInvalidatedByUser as jest.Mock).mockResolvedValue(false);

      // Act
      await optionalAuthenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockRequest.user).toEqual(decodedPayload);
      expect(mockRequest.token).toBe(validToken);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should continue without user when no authorization header', async () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      await optionalAuthenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should continue without user when invalid format', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'InvalidFormat token',
      };

      // Act
      await optionalAuthenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should continue without user when token is blacklisted', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer blacklisted-token',
      };

      (jwtUtil.verifyAccessToken as jest.Mock).mockReturnValue({
        userId: 1,
        email: 'test@example.com',
        role: 'user',
      });
      (tokenBlacklistService.isBlacklisted as jest.Mock).mockResolvedValue(true);
      (tokenBlacklistService.isTokenInvalidatedByUser as jest.Mock).mockResolvedValue(false);

      // Act
      await optionalAuthenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should continue without user when token verification fails', async () => {
      // Arrange
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      (jwtUtil.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      await optionalAuthenticate(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockRequest.user).toBeUndefined();
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    it('should allow access when user has required role', () => {
      // Arrange
      mockRequest.user = {
        userId: 1,
        email: 'admin@example.com',
        role: 'admin',
      };

      const middleware = authorize('admin', 'superadmin');

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should reject when user is not authenticated', () => {
      // Arrange
      mockRequest.user = undefined;

      const middleware = authorize('admin');

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockResponse.sendUnauthorized).toHaveBeenCalledWith('Authentication required');
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject when user role is not allowed', () => {
      // Arrange
      mockRequest.user = {
        userId: 1,
        email: 'user@example.com',
        role: 'user',
      };

      const middleware = authorize('admin', 'superadmin');

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockResponse.sendForbidden).toHaveBeenCalledWith('Insufficient permissions');
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject when user has no role', () => {
      // Arrange
      mockRequest.user = {
        userId: 1,
        email: 'user@example.com',
        role: undefined,
      } as any;

      const middleware = authorize('admin');

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockResponse.sendForbidden).toHaveBeenCalledWith('Insufficient permissions');
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should allow access when user has one of multiple allowed roles', () => {
      // Arrange
      mockRequest.user = {
        userId: 1,
        email: 'mod@example.com',
        role: 'moderator',
      };

      const middleware = authorize('admin', 'moderator', 'superadmin');

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('checkOwnership', () => {
    it('should allow access when user owns the resource', () => {
      // Arrange
      mockRequest.user = {
        userId: 1,
        email: 'user@example.com',
        role: 'user',
      };
      mockRequest.params = { userId: '1' };

      const middleware = checkOwnership('userId');

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should reject when user is not authenticated', () => {
      // Arrange
      mockRequest.user = undefined;
      mockRequest.params = { userId: '1' };

      const middleware = checkOwnership('userId');

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockResponse.sendUnauthorized).toHaveBeenCalledWith('Authentication required');
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should reject when user does not own the resource', () => {
      // Arrange
      mockRequest.user = {
        userId: 1,
        email: 'user@example.com',
        role: 'user',
      };
      mockRequest.params = { userId: '2' };

      const middleware = checkOwnership('userId');

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(mockResponse.sendForbidden).toHaveBeenCalledWith(
        'You can only access your own resources'
      );
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should use default parameter name when not specified', () => {
      // Arrange
      mockRequest.user = {
        userId: 1,
        email: 'user@example.com',
        role: 'user',
      };
      mockRequest.params = { userId: '1' };

      const middleware = checkOwnership();

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should work with custom parameter name', () => {
      // Arrange
      mockRequest.user = {
        userId: 1,
        email: 'user@example.com',
        role: 'user',
      };
      mockRequest.params = { id: '1' };

      const middleware = checkOwnership('id');

      // Act
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      // Assert
      expect(nextFunction).toHaveBeenCalled();
    });
  });
});
