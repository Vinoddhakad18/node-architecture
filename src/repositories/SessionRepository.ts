import { redisClient } from '@database/index';
import logger from '@utils/logger';

/**
 * SessionRepository - Handles all Redis operations for user sessions
 * This layer should only contain Redis queries/operations
 * No business logic should be placed here
 */
class SessionRepository {
  private readonly SESSION_PREFIX = 'session:';
  private readonly DEFAULT_TTL = 86400; // 24 hours in seconds

  /**
   * Generate session key for a user
   */
  private getSessionKey(userId: string): string {
    return `${this.SESSION_PREFIX}${userId}`;
  }

  /**
   * Store user session in Redis
   * @param userId - User ID
   * @param accessToken - Access token to store
   * @param ttl - Time to live in seconds (default: 24 hours)
   */
  async setSession(userId: string, accessToken: string, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const sessionKey = this.getSessionKey(userId);
      await redisClient.setex(sessionKey, ttl, accessToken);
    } catch (error) {
      logger.error('Error storing session in Redis:', error);
      throw error;
    }
  }

  /**
   * Get user session from Redis
   * @param userId - User ID
   * @returns Access token or null if not found
   */
  async getSession(userId: string): Promise<string | null> {
    try {
      const sessionKey = this.getSessionKey(userId);
      return await redisClient.get(sessionKey);
    } catch (error) {
      logger.error('Error retrieving session from Redis:', error);
      throw error;
    }
  }

  /**
   * Delete user session from Redis
   * @param userId - User ID
   */
  async deleteSession(userId: string): Promise<void> {
    try {
      const sessionKey = this.getSessionKey(userId);
      await redisClient.del(sessionKey);
    } catch (error) {
      logger.error('Error deleting session from Redis:', error);
      throw error;
    }
  }

  /**
   * Check if user session exists
   * @param userId - User ID
   * @returns true if session exists, false otherwise
   */
  async sessionExists(userId: string): Promise<boolean> {
    try {
      const sessionKey = this.getSessionKey(userId);
      const exists = await redisClient.exists(sessionKey);
      return exists === 1;
    } catch (error) {
      logger.error('Error checking session existence in Redis:', error);
      throw error;
    }
  }

  /**
   * Update session TTL (extend session expiration)
   * @param userId - User ID
   * @param ttl - New time to live in seconds
   */
  async updateSessionTTL(userId: string, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const sessionKey = this.getSessionKey(userId);
      await redisClient.expire(sessionKey, ttl);
    } catch (error) {
      logger.error('Error updating session TTL in Redis:', error);
      throw error;
    }
  }

  /**
   * Get remaining TTL for a session
   * @param userId - User ID
   * @returns Remaining TTL in seconds, -1 if no expiration, -2 if key doesn't exist
   */
  async getSessionTTL(userId: string): Promise<number> {
    try {
      const sessionKey = this.getSessionKey(userId);
      return await redisClient.ttl(sessionKey);
    } catch (error) {
      logger.error('Error getting session TTL from Redis:', error);
      throw error;
    }
  }
}

export default new SessionRepository();
