/**
 * Integration Tests for Authentication Controller
 * Tests HTTP request handling and response formatting
 */

import { Request, Response } from 'express';
import authController from '../auth.controller';
import authService from '../../services/auth.service';
import { mockRequest, mockResponse } from '../../../__tests__/helpers/test-helpers';

// Mock dependencies
jest.mock('../../services/auth.service');
jest.mock('../../config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('AuthController', () => {
  let req: Partial<Request>;
  let res: any;

  beforeEach(() => {
    jest.clearAllMocks();
    res = mockResponse();
  });

  describe('login', () => {
    it('should successfully login and return tokens', async () => {
      // Arrange
      const mockEmail = 'test@example.com';
      const mockPassword = 'password123';
      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: 1234567890,
      };
      const mockUser = {
        id: 1,
        email: mockEmail,
        name: 'Test User',
        role: 'user',
      };

      req = mockRequest({
        body: { email: mockEmail, password: mockPassword },
      });

      (authService.login as jest.Mock).mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
      });

      // Act
      await authController.login(req as Request, res as Response);

      // Assert
      expect(authService.login).toHaveBeenCalledWith(mockEmail, mockPassword);
      expect(res.sendSuccess).toHaveBeenCalledWith(mockTokens, 'Login successful');
    });

    it('should return 401 when credentials are invalid', async () => {
      // Arrange
      const mockEmail = 'test@example.com';
      const mockPassword = 'wrongpassword';

      req = mockRequest({
        body: { email: mockEmail, password: mockPassword },
      });

      (authService.login as jest.Mock).mockRejectedValue(
        new Error('Invalid email or password')
      );

      // Act
      await authController.login(req as Request, res as Response);

      // Assert
      expect(authService.login).toHaveBeenCalledWith(mockEmail, mockPassword);
      expect(res.sendUnauthorized).toHaveBeenCalledWith('Invalid email or password');
    });

    it('should return 401 when user account is deactivated', async () => {
      // Arrange
      const mockEmail = 'test@example.com';
      const mockPassword = 'password123';

      req = mockRequest({
        body: { email: mockEmail, password: mockPassword },
      });

      (authService.login as jest.Mock).mockRejectedValue(
        new Error('Your account has been deactivated. Please contact support.')
      );

      // Act
      await authController.login(req as Request, res as Response);

      // Assert
      expect(res.sendUnauthorized).toHaveBeenCalledWith(
        'Your account has been deactivated. Please contact support.'
      );
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      const mockEmail = 'test@example.com';
      const mockPassword = 'password123';

      req = mockRequest({
        body: { email: mockEmail, password: mockPassword },
      });

      (authService.login as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act
      await authController.login(req as Request, res as Response);

      // Assert
      expect(res.sendUnauthorized).toHaveBeenCalledWith('Database connection failed');
    });

    it('should handle errors without message gracefully', async () => {
      // Arrange
      req = mockRequest({
        body: { email: 'test@example.com', password: 'password123' },
      });

      (authService.login as jest.Mock).mockRejectedValue({});

      // Act
      await authController.login(req as Request, res as Response);

      // Assert
      expect(res.sendUnauthorized).toHaveBeenCalledWith('Login failed');
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh access token', async () => {
      // Arrange
      const mockRefreshToken = 'valid-refresh-token';
      const mockAccessToken = 'new-access-token';

      req = mockRequest({
        body: { refreshToken: mockRefreshToken },
      });

      (authService.refreshToken as jest.Mock).mockResolvedValue({
        accessToken: mockAccessToken,
      });

      // Act
      await authController.refreshToken(req as Request, res as Response);

      // Assert
      expect(authService.refreshToken).toHaveBeenCalledWith(mockRefreshToken);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: mockAccessToken,
        },
      });
    });

    it('should return 400 when refresh token is missing', async () => {
      // Arrange
      req = mockRequest({
        body: {},
      });

      // Act
      await authController.refreshToken(req as Request, res as Response);

      // Assert
      expect(authService.refreshToken).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Refresh token is required',
      });
    });

    it('should return 401 when refresh token is invalid', async () => {
      // Arrange
      const mockRefreshToken = 'invalid-refresh-token';

      req = mockRequest({
        body: { refreshToken: mockRefreshToken },
      });

      (authService.refreshToken as jest.Mock).mockRejectedValue(
        new Error('Invalid refresh token')
      );

      // Act
      await authController.refreshToken(req as Request, res as Response);

      // Assert
      expect(authService.refreshToken).toHaveBeenCalledWith(mockRefreshToken);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid refresh token',
      });
    });

    it('should return 401 when refresh token is expired', async () => {
      // Arrange
      const mockRefreshToken = 'expired-refresh-token';

      req = mockRequest({
        body: { refreshToken: mockRefreshToken },
      });

      (authService.refreshToken as jest.Mock).mockRejectedValue(
        new Error('Failed to refresh token')
      );

      // Act
      await authController.refreshToken(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to refresh token',
      });
    });

    it('should handle errors without message', async () => {
      // Arrange
      req = mockRequest({
        body: { refreshToken: 'some-token' },
      });

      (authService.refreshToken as jest.Mock).mockRejectedValue({});

      // Act
      await authController.refreshToken(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token refresh failed',
      });
    });
  });

  describe('verifyToken', () => {
    it('should return valid status for valid token', async () => {
      // Arrange
      const mockToken = 'valid-token';

      req = mockRequest({
        body: { token: mockToken },
      });

      (authService.verifyToken as jest.Mock).mockResolvedValue(true);

      // Act
      await authController.verifyToken(req as Request, res as Response);

      // Assert
      expect(authService.verifyToken).toHaveBeenCalledWith(mockToken);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Token is valid',
        data: {
          valid: true,
        },
      });
    });

    it('should return invalid status for invalid token', async () => {
      // Arrange
      const mockToken = 'invalid-token';

      req = mockRequest({
        body: { token: mockToken },
      });

      (authService.verifyToken as jest.Mock).mockResolvedValue(false);

      // Act
      await authController.verifyToken(req as Request, res as Response);

      // Assert
      expect(authService.verifyToken).toHaveBeenCalledWith(mockToken);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Token is invalid',
        data: {
          valid: false,
        },
      });
    });

    it('should return 400 when token is missing', async () => {
      // Arrange
      req = mockRequest({
        body: {},
      });

      // Act
      await authController.verifyToken(req as Request, res as Response);

      // Assert
      expect(authService.verifyToken).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token is required',
      });
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      const mockToken = 'some-token';

      req = mockRequest({
        body: { token: mockToken },
      });

      (authService.verifyToken as jest.Mock).mockRejectedValue(
        new Error('Verification service failed')
      );

      // Act
      await authController.verifyToken(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Verification service failed',
      });
    });

    it('should handle errors without message', async () => {
      // Arrange
      req = mockRequest({
        body: { token: 'some-token' },
      });

      (authService.verifyToken as jest.Mock).mockRejectedValue({});

      // Act
      await authController.verifyToken(req as Request, res as Response);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token verification failed',
      });
    });
  });
});
