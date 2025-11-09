import UserMaster, { UserMasterCreationAttributes } from '../models/user-master.model';
import { logger } from '../config/logger';

/**
 * Authentication Service
 * Handles business logic for authentication operations
 */
class AuthService {
  /**
   * Register a new user
   */
  async register(userData: UserMasterCreationAttributes): Promise<UserMaster> {
    try {
      // Check if user already exists
      const existingUser = await UserMaster.findOne({
        where: { email: userData.email },
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create new user
      const user = await UserMaster.create(userData);

      logger.info(`New user registered: ${user.email}`);
      return user;
    } catch (error) {
      logger.error('Error in register service:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<UserMaster> {
    try {
      // Find user by email
      const user = await UserMaster.findOne({
        where: { email },
      });

      if (!user) {
        throw new Error('Invalid email or password');
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

  /**
   * Get user by ID
   */
  async getUserById(id: number): Promise<UserMaster | null> {
    try {
      const user = await UserMaster.findByPk(id);
      return user;
    } catch (error) {
      logger.error('Error in getUserById service:', error);
      throw error;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<UserMaster | null> {
    try {
      const user = await UserMaster.findOne({
        where: { email },
      });
      return user;
    } catch (error) {
      logger.error('Error in getUserByEmail service:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(id: number, userData: Partial<UserMasterCreationAttributes>): Promise<UserMaster> {
    try {
      const user = await UserMaster.findByPk(id);

      if (!user) {
        throw new Error('User not found');
      }

      // If email is being updated, check if it's already taken
      if (userData.email && userData.email !== user.email) {
        const existingUser = await UserMaster.findOne({
          where: { email: userData.email },
        });

        if (existingUser) {
          throw new Error('Email is already taken');
        }
      }

      // Update user
      await user.update(userData);

      logger.info(`User updated: ${user.email}`);
      return user;
    } catch (error) {
      logger.error('Error in updateUser service:', error);
      throw error;
    }
  }

  /**
   * Delete user (soft delete by deactivating)
   */
  async deleteUser(id: number): Promise<void> {
    try {
      const user = await UserMaster.findByPk(id);

      if (!user) {
        throw new Error('User not found');
      }

      // Soft delete by setting status to deleted
      user.status = 'deleted';
      await user.save();

      logger.info(`User deactivated: ${user.email}`);
    } catch (error) {
      logger.error('Error in deleteUser service:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(id: number, oldPassword: string, newPassword: string): Promise<void> {
    try {
      const user = await UserMaster.findByPk(id);

      if (!user) {
        throw new Error('User not found');
      }

      // Verify old password
      const isPasswordValid = await user.comparePassword(oldPassword);
      if (!isPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      logger.info(`Password changed for user: ${user.email}`);
    } catch (error) {
      logger.error('Error in changePassword service:', error);
      throw error;
    }
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(page: number = 1, limit: number = 10): Promise<{ users: UserMaster[]; total: number; pages: number }> {
    try {
      const offset = (page - 1) * limit;

      const { count, rows } = await UserMaster.findAndCountAll({
        limit,
        offset,
        order: [['created_at', 'DESC']],
      });

      return {
        users: rows,
        total: count,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error('Error in getAllUsers service:', error);
      throw error;
    }
  }
}

export default new AuthService();
