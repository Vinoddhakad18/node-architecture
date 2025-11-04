import User from '@models/User';
import { UserCreationAttributes } from '@models/User';
import logger from '@utils/logger';

/**
 * UserRepository - Handles all database operations for User model
 * This layer should only contain database queries (MySQL/Sequelize)
 * No business logic should be placed here
 */
class UserRepository {
  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      return await User.findOne({ where: { email } });
    } catch (error) {
      logger.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  async findById(userId: string): Promise<User | null> {
    try {
      return await User.findByPk(userId);
    } catch (error) {
      logger.error('Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Create a new user
   */
  async create(data: UserCreationAttributes): Promise<User> {
    try {
      return await User.create(data);
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user's refresh token
   */
  async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    try {
      const user = await User.findByPk(userId);
      if (user) {
        user.refreshToken = refreshToken;
        await user.save();
      }
    } catch (error) {
      logger.error('Error updating refresh token:', error);
      throw error;
    }
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    try {
      const user = await User.findByPk(userId);
      if (user) {
        user.lastLogin = new Date();
        await user.save();
      }
    } catch (error) {
      logger.error('Error updating last login:', error);
      throw error;
    }
  }

  /**
   * Update user with custom data
   */
  async update(userId: string, updates: Partial<User>): Promise<User | null> {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        return null;
      }

      Object.assign(user, updates);
      await user.save();
      return user;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, newPassword: string): Promise<void> {
    try {
      const user = await User.findByPk(userId);
      if (user) {
        user.password = newPassword;
        await user.save();
      }
    } catch (error) {
      logger.error('Error updating password:', error);
      throw error;
    }
  }

  /**
   * Clear user's refresh token
   */
  async clearRefreshToken(userId: string): Promise<void> {
    try {
      await this.updateRefreshToken(userId, null);
    } catch (error) {
      logger.error('Error clearing refresh token:', error);
      throw error;
    }
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    try {
      const user = await User.findOne({ where: { email } });
      return user !== null;
    } catch (error) {
      logger.error('Error checking email existence:', error);
      throw error;
    }
  }
}

export default new UserRepository();
