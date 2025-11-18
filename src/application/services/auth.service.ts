import UserMaster from '@models/user-master.model';
import { logger } from '@config/logger';
import jwtUtil from '@application/utils/jwt.util';
import { TokenPair } from '@interfaces/jwt.interface';

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
      const user = await UserMaster.findOne({
        where: { email },
        attributes: { include: ['password'] },
      });

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

      // Update last login
      user.last_login = new Date();
      await user.save();
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
      return true;
    } catch (error) {
      logger.error('Token verification failed:', error);
      return false;
    }
  }

}

export default new AuthService();
