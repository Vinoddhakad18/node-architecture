import UserMaster, { UserMasterCreationAttributes } from '../models/user-master.model';
import { logger } from '../config/logger';

/**
 * Authentication Service
 * Handles business logic for authentication operations
 */
class AuthService {


  /**
   * Login user
   */
  async login(email: string, password: string): Promise<UserMaster> {
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

      logger.info(`User logged in: ${user.email}`);
      return user;
    } catch (error) {
      logger.error('Error in login service:', error);
      throw error;
    }
  }

}

export default new AuthService();
