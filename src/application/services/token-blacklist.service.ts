import jwtUtil from '@application/utils/jwt.util';
import { logger } from '@config/logger';
import { CacheKeys, CacheTTL } from '@constants/cache.constants';
import redisService from '@helpers/redis.helper';

/**
 * Token Blacklist Service
 * Manages token invalidation for logout, password change, and session management
 */
class TokenBlacklistService {
  /**
   * Add a token to the blacklist
   * @param token - The JWT token to blacklist
   * @param reason - Reason for blacklisting (logout, password_change, security)
   */
  async addToBlacklist(token: string, reason = 'logout'): Promise<void> {
    try {
      // Get token expiration time
      const decoded = jwtUtil.decodeToken(token);
      if (!decoded || !decoded.exp) {
        logger.warn('Cannot blacklist token: unable to decode or missing expiration');
        return;
      }

      // Calculate TTL (time until token naturally expires)
      const currentTime = Math.floor(Date.now() / 1000);
      const ttl = decoded.exp - currentTime;

      // Only blacklist if token hasn't expired yet
      if (ttl > 0) {
        const blacklistKey = CacheKeys.tokenBlacklist(token);
        await redisService.set(
          blacklistKey,
          {
            reason,
            blacklistedAt: new Date().toISOString(),
            userId: decoded.userId,
            email: decoded.email,
          },
          ttl
        );

        logger.info(`Token blacklisted: ${reason}`, {
          userId: decoded.userId,
          email: decoded.email,
          ttl,
        });
      }
    } catch (error) {
      logger.error('Error adding token to blacklist:', error);
      throw new Error('Failed to blacklist token');
    }
  }

  /**
   * Check if a token is blacklisted
   * @param token - The JWT token to check
   * @returns true if blacklisted, false otherwise
   */
  async isBlacklisted(token: string): Promise<boolean> {
    try {
      const blacklistKey = CacheKeys.tokenBlacklist(token);
      const exists = await redisService.exists(blacklistKey);
      return exists;
    } catch (error) {
      logger.error('Error checking token blacklist:', error);
      // In case of Redis error, fail open (allow the request)
      // You might want to fail closed in high-security environments
      return false;
    }
  }

  /**
   * Add both access and refresh tokens to blacklist
   * Used for complete logout
   */
  async blacklistTokenPair(
    accessToken: string,
    refreshToken: string,
    reason = 'logout'
  ): Promise<void> {
    await Promise.all([
      this.addToBlacklist(accessToken, reason),
      this.addToBlacklist(refreshToken, reason),
    ]);
  }

  /**
   * Blacklist all tokens for a user
   * Used when password is changed or account is compromised
   * This stores a timestamp; tokens issued before this time are considered invalid
   */
  async invalidateAllUserTokens(userId: number, reason = 'password_change'): Promise<void> {
    try {
      const userInvalidationKey = `${CacheKeys.tokenBlacklist('user')}:${userId}`;
      const invalidationData = {
        invalidatedAt: Math.floor(Date.now() / 1000),
        reason,
      };

      // Store invalidation timestamp for 7 days (max refresh token lifetime)
      await redisService.set(userInvalidationKey, invalidationData, CacheTTL.WEEK);

      logger.info(`All tokens invalidated for user ${userId}: ${reason}`);
    } catch (error) {
      logger.error('Error invalidating all user tokens:', error);
      throw new Error('Failed to invalidate user tokens');
    }
  }

  /**
   * Check if a token was issued before user's tokens were invalidated
   * @param token - The JWT token to check
   * @returns true if token should be rejected, false otherwise
   */
  async isTokenInvalidatedByUser(token: string): Promise<boolean> {
    try {
      const decoded = jwtUtil.decodeToken(token);
      if (!decoded || !decoded.userId || !decoded.iat) {
        return false;
      }

      const userInvalidationKey = `${CacheKeys.tokenBlacklist('user')}:${decoded.userId}`;
      const invalidationData = await redisService.get<{ invalidatedAt: number; reason: string }>(
        userInvalidationKey
      );

      if (!invalidationData) {
        return false;
      }

      // Token is invalid if it was issued before the invalidation timestamp
      return decoded.iat < invalidationData.invalidatedAt;
    } catch (error) {
      logger.error('Error checking user token invalidation:', error);
      return false;
    }
  }

  /**
   * Remove a token from the blacklist (if needed for testing)
   */
  async removeFromBlacklist(token: string): Promise<void> {
    try {
      const blacklistKey = CacheKeys.tokenBlacklist(token);
      await redisService.del(blacklistKey);
      logger.info('Token removed from blacklist');
    } catch (error) {
      logger.error('Error removing token from blacklist:', error);
      throw new Error('Failed to remove token from blacklist');
    }
  }

  /**
   * Get blacklist info for a token
   */
  async getBlacklistInfo(token: string): Promise<{
    reason: string;
    blacklistedAt: string;
    userId: number;
    email: string;
  } | null> {
    try {
      const blacklistKey = CacheKeys.tokenBlacklist(token);
      return await redisService.get(blacklistKey);
    } catch (error) {
      logger.error('Error getting blacklist info:', error);
      return null;
    }
  }
}

export default new TokenBlacklistService();
