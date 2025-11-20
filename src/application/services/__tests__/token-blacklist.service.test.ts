/**
 * Unit Tests for Token Blacklist Service
 * Tests business logic for token blacklisting operations
 */

import jwtUtil from '@application/utils/jwt.util';
import { CacheTTL } from '@constants/cache.constants';
import redisService from '@helpers/redis.helper';

import tokenBlacklistService from '../token-blacklist.service';

// Mock dependencies
jest.mock('@helpers/redis.helper');
jest.mock('@application/utils/jwt.util');
jest.mock('@config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('TokenBlacklistService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('addToBlacklist', () => {
    const mockToken = 'valid-jwt-token';
    const mockDecodedToken = {
      userId: 1,
      email: 'test@example.com',
      role: 'user',
      exp: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
      iat: Math.floor(Date.now() / 1000),
    };

    it('should add token to blacklist with default reason', async () => {
      // Arrange
      (jwtUtil.decodeToken as jest.Mock).mockReturnValue(mockDecodedToken);
      (redisService.set as jest.Mock).mockResolvedValue(undefined);

      // Act
      await tokenBlacklistService.addToBlacklist(mockToken);

      // Assert
      expect(jwtUtil.decodeToken).toHaveBeenCalledWith(mockToken);
      expect(redisService.set).toHaveBeenCalledWith(
        expect.stringContaining('token:blacklist:'),
        expect.objectContaining({
          reason: 'logout',
          userId: mockDecodedToken.userId,
          email: mockDecodedToken.email,
        }),
        expect.any(Number)
      );
    });

    it('should add token to blacklist with custom reason', async () => {
      // Arrange
      (jwtUtil.decodeToken as jest.Mock).mockReturnValue(mockDecodedToken);
      (redisService.set as jest.Mock).mockResolvedValue(undefined);

      // Act
      await tokenBlacklistService.addToBlacklist(mockToken, 'password_change');

      // Assert
      expect(redisService.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          reason: 'password_change',
        }),
        expect.any(Number)
      );
    });

    it('should not blacklist token if unable to decode', async () => {
      // Arrange
      (jwtUtil.decodeToken as jest.Mock).mockReturnValue(null);

      // Act
      await tokenBlacklistService.addToBlacklist(mockToken);

      // Assert
      expect(redisService.set).not.toHaveBeenCalled();
    });

    it('should not blacklist token if missing expiration', async () => {
      // Arrange
      const tokenWithoutExp = { ...mockDecodedToken, exp: undefined };
      (jwtUtil.decodeToken as jest.Mock).mockReturnValue(tokenWithoutExp);

      // Act
      await tokenBlacklistService.addToBlacklist(mockToken);

      // Assert
      expect(redisService.set).not.toHaveBeenCalled();
    });

    it('should not blacklist already expired token', async () => {
      // Arrange
      const expiredToken = {
        ...mockDecodedToken,
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      };
      (jwtUtil.decodeToken as jest.Mock).mockReturnValue(expiredToken);

      // Act
      await tokenBlacklistService.addToBlacklist(mockToken);

      // Assert
      expect(redisService.set).not.toHaveBeenCalled();
    });

    it('should throw error when Redis fails', async () => {
      // Arrange
      (jwtUtil.decodeToken as jest.Mock).mockReturnValue(mockDecodedToken);
      (redisService.set as jest.Mock).mockRejectedValue(new Error('Redis error'));

      // Act & Assert
      await expect(tokenBlacklistService.addToBlacklist(mockToken)).rejects.toThrow(
        'Failed to blacklist token'
      );
    });
  });

  describe('isBlacklisted', () => {
    const mockToken = 'test-token';

    it('should return true when token is blacklisted', async () => {
      // Arrange
      (redisService.exists as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await tokenBlacklistService.isBlacklisted(mockToken);

      // Assert
      expect(result).toBe(true);
      expect(redisService.exists).toHaveBeenCalledWith(expect.stringContaining('token:blacklist:'));
    });

    it('should return false when token is not blacklisted', async () => {
      // Arrange
      (redisService.exists as jest.Mock).mockResolvedValue(false);

      // Act
      const result = await tokenBlacklistService.isBlacklisted(mockToken);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false on Redis error (fail open)', async () => {
      // Arrange
      (redisService.exists as jest.Mock).mockRejectedValue(new Error('Redis error'));

      // Act
      const result = await tokenBlacklistService.isBlacklisted(mockToken);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('blacklistTokenPair', () => {
    const mockAccessToken = 'access-token';
    const mockRefreshToken = 'refresh-token';
    const mockDecodedToken = {
      userId: 1,
      email: 'test@example.com',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
    };

    it('should blacklist both access and refresh tokens', async () => {
      // Arrange
      (jwtUtil.decodeToken as jest.Mock).mockReturnValue(mockDecodedToken);
      (redisService.set as jest.Mock).mockResolvedValue(undefined);

      // Act
      await tokenBlacklistService.blacklistTokenPair(mockAccessToken, mockRefreshToken);

      // Assert
      expect(jwtUtil.decodeToken).toHaveBeenCalledTimes(2);
      expect(redisService.set).toHaveBeenCalledTimes(2);
    });

    it('should use custom reason for both tokens', async () => {
      // Arrange
      (jwtUtil.decodeToken as jest.Mock).mockReturnValue(mockDecodedToken);
      (redisService.set as jest.Mock).mockResolvedValue(undefined);

      // Act
      await tokenBlacklistService.blacklistTokenPair(mockAccessToken, mockRefreshToken, 'security');

      // Assert
      expect(redisService.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ reason: 'security' }),
        expect.any(Number)
      );
    });
  });

  describe('invalidateAllUserTokens', () => {
    it('should invalidate all tokens for a user', async () => {
      // Arrange
      const userId = 1;
      (redisService.set as jest.Mock).mockResolvedValue(undefined);

      // Act
      await tokenBlacklistService.invalidateAllUserTokens(userId);

      // Assert
      expect(redisService.set).toHaveBeenCalledWith(
        expect.stringContaining(`:${userId}`),
        expect.objectContaining({
          invalidatedAt: expect.any(Number),
          reason: 'password_change',
        }),
        CacheTTL.WEEK
      );
    });

    it('should use custom reason for invalidation', async () => {
      // Arrange
      const userId = 1;
      (redisService.set as jest.Mock).mockResolvedValue(undefined);

      // Act
      await tokenBlacklistService.invalidateAllUserTokens(userId, 'account_compromised');

      // Assert
      expect(redisService.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ reason: 'account_compromised' }),
        expect.any(Number)
      );
    });

    it('should throw error when Redis fails', async () => {
      // Arrange
      (redisService.set as jest.Mock).mockRejectedValue(new Error('Redis error'));

      // Act & Assert
      await expect(tokenBlacklistService.invalidateAllUserTokens(1)).rejects.toThrow(
        'Failed to invalidate user tokens'
      );
    });
  });

  describe('isTokenInvalidatedByUser', () => {
    const mockToken = 'test-token';

    it('should return true when token was issued before invalidation', async () => {
      // Arrange
      const tokenIssuedAt = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const invalidatedAt = Math.floor(Date.now() / 1000); // Now

      (jwtUtil.decodeToken as jest.Mock).mockReturnValue({
        userId: 1,
        iat: tokenIssuedAt,
      });
      (redisService.get as jest.Mock).mockResolvedValue({
        invalidatedAt,
        reason: 'password_change',
      });

      // Act
      const result = await tokenBlacklistService.isTokenInvalidatedByUser(mockToken);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when token was issued after invalidation', async () => {
      // Arrange
      const tokenIssuedAt = Math.floor(Date.now() / 1000); // Now
      const invalidatedAt = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

      (jwtUtil.decodeToken as jest.Mock).mockReturnValue({
        userId: 1,
        iat: tokenIssuedAt,
      });
      (redisService.get as jest.Mock).mockResolvedValue({
        invalidatedAt,
        reason: 'password_change',
      });

      // Act
      const result = await tokenBlacklistService.isTokenInvalidatedByUser(mockToken);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when no invalidation exists', async () => {
      // Arrange
      (jwtUtil.decodeToken as jest.Mock).mockReturnValue({
        userId: 1,
        iat: Math.floor(Date.now() / 1000),
      });
      (redisService.get as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await tokenBlacklistService.isTokenInvalidatedByUser(mockToken);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when token cannot be decoded', async () => {
      // Arrange
      (jwtUtil.decodeToken as jest.Mock).mockReturnValue(null);

      // Act
      const result = await tokenBlacklistService.isTokenInvalidatedByUser(mockToken);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when token missing required fields', async () => {
      // Arrange
      (jwtUtil.decodeToken as jest.Mock).mockReturnValue({
        email: 'test@example.com',
      });

      // Act
      const result = await tokenBlacklistService.isTokenInvalidatedByUser(mockToken);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false on Redis error', async () => {
      // Arrange
      (jwtUtil.decodeToken as jest.Mock).mockReturnValue({
        userId: 1,
        iat: Math.floor(Date.now() / 1000),
      });
      (redisService.get as jest.Mock).mockRejectedValue(new Error('Redis error'));

      // Act
      const result = await tokenBlacklistService.isTokenInvalidatedByUser(mockToken);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('removeFromBlacklist', () => {
    const mockToken = 'test-token';

    it('should remove token from blacklist', async () => {
      // Arrange
      (redisService.del as jest.Mock).mockResolvedValue(undefined);

      // Act
      await tokenBlacklistService.removeFromBlacklist(mockToken);

      // Assert
      expect(redisService.del).toHaveBeenCalledWith(expect.stringContaining('token:blacklist:'));
    });

    it('should throw error when Redis fails', async () => {
      // Arrange
      (redisService.del as jest.Mock).mockRejectedValue(new Error('Redis error'));

      // Act & Assert
      await expect(tokenBlacklistService.removeFromBlacklist(mockToken)).rejects.toThrow(
        'Failed to remove token from blacklist'
      );
    });
  });

  describe('getBlacklistInfo', () => {
    const mockToken = 'test-token';

    it('should return blacklist info when token is blacklisted', async () => {
      // Arrange
      const blacklistInfo = {
        reason: 'logout',
        blacklistedAt: '2024-01-01T00:00:00.000Z',
        userId: 1,
        email: 'test@example.com',
      };
      (redisService.get as jest.Mock).mockResolvedValue(blacklistInfo);

      // Act
      const result = await tokenBlacklistService.getBlacklistInfo(mockToken);

      // Assert
      expect(result).toEqual(blacklistInfo);
    });

    it('should return null when token is not blacklisted', async () => {
      // Arrange
      (redisService.get as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await tokenBlacklistService.getBlacklistInfo(mockToken);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null on Redis error', async () => {
      // Arrange
      (redisService.get as jest.Mock).mockRejectedValue(new Error('Redis error'));

      // Act
      const result = await tokenBlacklistService.getBlacklistInfo(mockToken);

      // Assert
      expect(result).toBeNull();
    });
  });
});
