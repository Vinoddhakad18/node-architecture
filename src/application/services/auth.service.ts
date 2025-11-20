import jwtUtil from '@application/utils/jwt.util';
import { logger } from '@config/logger';
import { TokenPair } from '@interfaces/jwt.interface';
import UserMaster from '@models/user-master.model';
import userRepository from '@repositories/user.repository';
import tokenBlacklistService from '@services/token-blacklist.service';
import bcrypt from 'bcryptjs';

/**
 * Authentication Service
 * Handles business logic for authentication operations
 */
class AuthService {
  /**
   * Login user and generate JWT tokens
   */
  async login(email: string, password: string): Promise<{ user: UserMaster; tokens: TokenPair }> {
    try {
      // Find user by email - explicitly include password for authentication
      const user = await userRepository.findByEmailWithPassword(email);

      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check if password exists in database
      if (!user.getDataValue('password')) {
        logger.error('Password field is missing from user record');
        throw new Error('Invalid password');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Your account has been deactivated. Please contact support.');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Update last login using repository
      await userRepository.updateLastLogin(user.getDataValue('id'));
      logger.info(`User logged in: ${user.getDataValue('email')}`);

      // Generate JWT tokens
      const tokens = jwtUtil.generateTokenPair({
        userId: user.getDataValue('id'),
        email: user.getDataValue('email'),
        role: user.getDataValue('role'),
      });
      return { user, tokens };
    } catch (error) {
      logger.error('Error in login service:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const accessToken = jwtUtil.refreshAccessToken(refreshToken);
      logger.info('Access token refreshed successfully');
      return { accessToken };
    } catch (error) {
      logger.error('Error refreshing token:', error);
      throw new Error('Failed to refresh token');
    }
  }

  /**
   * Verify access token
   */
  async verifyToken(token: string): Promise<boolean> {
    try {
      jwtUtil.verifyAccessToken(token);

      // Also check if token is blacklisted
      const isBlacklisted = await tokenBlacklistService.isBlacklisted(token);
      if (isBlacklisted) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Token verification failed:', error);
      return false;
    }
  }

  /**
   * Logout user and blacklist the token
   */
  async logout(accessToken: string, refreshToken?: string): Promise<void> {
    try {
      // Blacklist the access token
      await tokenBlacklistService.addToBlacklist(accessToken, 'logout');

      // If refresh token provided, blacklist it too
      if (refreshToken) {
        await tokenBlacklistService.addToBlacklist(refreshToken, 'logout');
      }

      const decoded = jwtUtil.decodeToken(accessToken);
      logger.info(`User logged out: ${decoded?.email}`);
    } catch (error) {
      logger.error('Error in logout service:', error);
      throw new Error('Failed to logout');
    }
  }

  /**
   * Change user password and invalidate all existing tokens
   */
  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      // Find user with password using repository
      const user = await userRepository.findByIdWithPassword(userId);

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password using repository
      await userRepository.updatePassword(userId, hashedPassword);

      // Invalidate all existing tokens for this user
      await tokenBlacklistService.invalidateAllUserTokens(userId, 'password_change');

      logger.info(`Password changed for user ${userId}`);
    } catch (error) {
      logger.error('Error changing password:', error);
      throw error;
    }
  }

  /**
   * Refresh tokens with rotation (invalidates old refresh token)
   */
  async refreshTokenWithRotation(refreshToken: string): Promise<TokenPair> {
    try {
      // Verify refresh token
      const decoded = jwtUtil.verifyRefreshToken(refreshToken);

      // Check if refresh token is blacklisted
      const isBlacklisted = await tokenBlacklistService.isBlacklisted(refreshToken);
      if (isBlacklisted) {
        throw new Error('Refresh token has been revoked');
      }

      // Check if user's tokens have been invalidated
      const isUserInvalidated = await tokenBlacklistService.isTokenInvalidatedByUser(refreshToken);
      if (isUserInvalidated) {
        throw new Error('Session has been invalidated. Please login again.');
      }

      // Generate new token pair
      const newTokens = jwtUtil.generateTokenPair({
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      });

      // Blacklist old refresh token (rotation)
      await tokenBlacklistService.addToBlacklist(refreshToken, 'token_rotation');

      logger.info(`Tokens refreshed with rotation for user: ${decoded.email}`);
      return newTokens;
    } catch (error) {
      logger.error('Error refreshing token with rotation:', error);
      throw error;
    }
  }
}

export default new AuthService();
