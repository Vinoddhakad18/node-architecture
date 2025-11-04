import User from '@models/User';
import { generateTokens, verifyRefreshToken, TokenResponse } from '@utils/jwt';
import UserRepository from '@repositories/UserRepository';
import SessionRepository from '@repositories/SessionRepository';
import logger from '@utils/logger';

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

class AuthService {
  /**
   * Register a new user
   */
  async register(input: RegisterInput): Promise<{ user: User; tokens: TokenResponse }> {
    try {
      // Check if user already exists
      const existingUser = await UserRepository.findByEmail(input.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create new user
      const user = await UserRepository.create({
        email: input.email,
        password: input.password,
        firstName: input.firstName,
        lastName: input.lastName
      });

      // Generate tokens
      const tokens = generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      // Store refresh token in database
      await UserRepository.updateRefreshToken(user.id, tokens.refreshToken);

      // Cache user session in Redis
      await SessionRepository.setSession(user.id, tokens.accessToken);

      logger.info(`User registered successfully: ${user.email}`);

      return { user, tokens };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(input: LoginInput): Promise<{ user: User; tokens: TokenResponse }> {
    try {
      // Find user by email
      const user = await UserRepository.findByEmail(input.email);
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(input.password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate new tokens
      const tokens = generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      // Update user's refresh token
      await UserRepository.updateRefreshToken(user.id, tokens.refreshToken);

      // Update last login timestamp
      await UserRepository.updateLastLogin(user.id);

      // Cache user session in Redis
      await SessionRepository.setSession(user.id, tokens.accessToken);

      logger.info(`User logged in successfully: ${user.email}`);

      return { user, tokens };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Find user
      const user = await UserRepository.findById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify refresh token matches stored token
      if (user.refreshToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      // Update stored refresh token
      await UserRepository.updateRefreshToken(user.id, tokens.refreshToken);

      // Update cached session
      await SessionRepository.setSession(user.id, tokens.accessToken);

      logger.info(`Tokens refreshed for user: ${user.email}`);

      return tokens;
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(userId: string): Promise<void> {
    try {
      // Clear refresh token from database
      await UserRepository.clearRefreshToken(userId);

      // Remove session from Redis
      await SessionRepository.deleteSession(userId);

      logger.info(`User logged out: ${userId}`);
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Get cached user session
   */
  async getUserSession(userId: string): Promise<string | null> {
    try {
      return await SessionRepository.getSession(userId);
    } catch (error) {
      logger.error('Error getting user session:', error);
      return null;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Find user
      const user = await UserRepository.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isValid = await user.comparePassword(currentPassword);
      if (!isValid) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      await UserRepository.updatePassword(userId, newPassword);

      logger.info(`Password changed for user: ${user.email}`);
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }
}

export default new AuthService();
