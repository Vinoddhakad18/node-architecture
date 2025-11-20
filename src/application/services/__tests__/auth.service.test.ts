/**
 * Unit Tests for Authentication Service
 * Tests business logic for authentication operations
 */

import _bcrypt from 'bcryptjs';

import UserMaster from '../../models/user-master.model';
import jwtUtil from '../../utils/jwt.util';
import authService from '../auth.service';

// Mock dependencies
jest.mock('../../models/user-master.model');
jest.mock('../../utils/jwt.util');
jest.mock('../../config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const mockEmail = 'test@example.com';
    const mockPassword = 'password123';
    const mockHashedPassword = '$2a$10$hashedpassword';

    const mockUser = {
      getDataValue: jest.fn((key: string) => {
        const data: any = {
          id: 1,
          email: mockEmail,
          password: mockHashedPassword,
          role: 'user',
          status: 'active',
        };
        return data[key];
      }),
      isActive: true,
      last_login: null,
      save: jest.fn().mockResolvedValue(true),
      comparePassword: jest.fn(),
    };

    it('should successfully login with valid credentials', async () => {
      // Arrange
      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: 1234567890,
      };

      (UserMaster.findOne as jest.Mock).mockResolvedValue(mockUser);
      mockUser.comparePassword.mockResolvedValue(true);
      (jwtUtil.generateTokenPair as jest.Mock).mockReturnValue(mockTokens);

      // Act
      const result = await authService.login(mockEmail, mockPassword);

      // Assert
      expect(UserMaster.findOne).toHaveBeenCalledWith({
        where: { email: mockEmail },
        attributes: { include: ['password'] },
      });
      expect(mockUser.comparePassword).toHaveBeenCalledWith(mockPassword);
      expect(mockUser.save).toHaveBeenCalled();
      expect(jwtUtil.generateTokenPair).toHaveBeenCalledWith({
        userId: 1,
        email: mockEmail,
        role: 'user',
      });
      expect(result).toEqual({
        user: mockUser,
        tokens: mockTokens,
      });
    });

    it('should throw error when user is not found', async () => {
      // Arrange
      (UserMaster.findOne as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(mockEmail, mockPassword)).rejects.toThrow(
        'Invalid email or password'
      );
      expect(UserMaster.findOne).toHaveBeenCalledWith({
        where: { email: mockEmail },
        attributes: { include: ['password'] },
      });
    });

    it('should throw error when password is missing from user record', async () => {
      // Arrange
      const userWithoutPassword = {
        ...mockUser,
        getDataValue: jest.fn((key: string) => {
          if (key === 'password') {
            return null;
          }
          return mockUser.getDataValue(key);
        }),
      };
      (UserMaster.findOne as jest.Mock).mockResolvedValue(userWithoutPassword);

      // Act & Assert
      await expect(authService.login(mockEmail, mockPassword)).rejects.toThrow('Invalid password');
    });

    it('should throw error when user is not active', async () => {
      // Arrange
      const inactiveUser = {
        ...mockUser,
        isActive: false,
      };
      (UserMaster.findOne as jest.Mock).mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(authService.login(mockEmail, mockPassword)).rejects.toThrow(
        'Your account has been deactivated. Please contact support.'
      );
    });

    it('should throw error when password is invalid', async () => {
      // Arrange
      (UserMaster.findOne as jest.Mock).mockResolvedValue(mockUser);
      mockUser.comparePassword.mockResolvedValue(false);

      // Act & Assert
      await expect(authService.login(mockEmail, mockPassword)).rejects.toThrow(
        'Invalid email or password'
      );
      expect(mockUser.comparePassword).toHaveBeenCalledWith(mockPassword);
    });

    it('should update last_login timestamp on successful login', async () => {
      // Arrange
      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: 1234567890,
      };

      (UserMaster.findOne as jest.Mock).mockResolvedValue(mockUser);
      mockUser.comparePassword.mockResolvedValue(true);
      (jwtUtil.generateTokenPair as jest.Mock).mockReturnValue(mockTokens);

      // Act
      await authService.login(mockEmail, mockPassword);

      // Assert
      expect(mockUser.last_login).toBeInstanceOf(Date);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      (UserMaster.findOne as jest.Mock).mockRejectedValue(dbError);

      // Act & Assert
      await expect(authService.login(mockEmail, mockPassword)).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh access token with valid refresh token', async () => {
      // Arrange
      const mockRefreshToken = 'valid-refresh-token';
      const mockAccessToken = 'new-access-token';
      (jwtUtil.refreshAccessToken as jest.Mock).mockReturnValue(mockAccessToken);

      // Act
      const result = await authService.refreshToken(mockRefreshToken);

      // Assert
      expect(jwtUtil.refreshAccessToken).toHaveBeenCalledWith(mockRefreshToken);
      expect(result).toEqual({ accessToken: mockAccessToken });
    });

    it('should throw error when refresh token is invalid', async () => {
      // Arrange
      const mockRefreshToken = 'invalid-refresh-token';
      (jwtUtil.refreshAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid refresh token');
      });

      // Act & Assert
      await expect(authService.refreshToken(mockRefreshToken)).rejects.toThrow(
        'Failed to refresh token'
      );
      expect(jwtUtil.refreshAccessToken).toHaveBeenCalledWith(mockRefreshToken);
    });

    it('should throw error when refresh token is expired', async () => {
      // Arrange
      const mockRefreshToken = 'expired-refresh-token';
      (jwtUtil.refreshAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Refresh token expired');
      });

      // Act & Assert
      await expect(authService.refreshToken(mockRefreshToken)).rejects.toThrow(
        'Failed to refresh token'
      );
    });
  });

  describe('verifyToken', () => {
    it('should return true for valid access token', async () => {
      // Arrange
      const mockToken = 'valid-access-token';
      (jwtUtil.verifyAccessToken as jest.Mock).mockReturnValue({
        userId: 1,
        email: 'test@example.com',
        role: 'user',
      });

      // Act
      const result = await authService.verifyToken(mockToken);

      // Assert
      expect(jwtUtil.verifyAccessToken).toHaveBeenCalledWith(mockToken);
      expect(result).toBe(true);
    });

    it('should return false for invalid access token', async () => {
      // Arrange
      const mockToken = 'invalid-access-token';
      (jwtUtil.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      const result = await authService.verifyToken(mockToken);

      // Assert
      expect(jwtUtil.verifyAccessToken).toHaveBeenCalledWith(mockToken);
      expect(result).toBe(false);
    });

    it('should return false for expired access token', async () => {
      // Arrange
      const mockToken = 'expired-access-token';
      (jwtUtil.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('Token expired');
      });

      // Act
      const result = await authService.verifyToken(mockToken);

      // Assert
      expect(result).toBe(false);
    });

    it('should handle malformed tokens gracefully', async () => {
      // Arrange
      const mockToken = 'malformed-token';
      (jwtUtil.verifyAccessToken as jest.Mock).mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      // Act
      const result = await authService.verifyToken(mockToken);

      // Assert
      expect(result).toBe(false);
    });
  });
});
