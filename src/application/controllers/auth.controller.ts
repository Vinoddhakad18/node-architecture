import { Request, Response } from 'express';
import authService from '../services/auth.service';
import { logger } from '../config/logger';

/**
 * Authentication Controller
 * Handles HTTP requests for authentication operations
 */
class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name, role } = req.body;

      // Validate required fields
      if (!email || !password || !name) {
        res.status(400).json({
          success: false,
          message: 'Please provide email, password, and name',
        });
        return;
      }

      // Register user
      const user = await authService.register({
        email,
        password,
        name,
        role: role || 'user',
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: user.toJSON(),
      });
    } catch (error: any) {
      logger.error('Error in register controller:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to register user',
      });
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Please provide email and password',
        });
        return;
      }

      // Login user
      const user = await authService.login(email, password);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: user.toJSON(),
      });
    } catch (error: any) {
      logger.error('Error in login controller:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Login failed',
      });
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/profile/:id
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const user = await authService.getUserById(parseInt(id));

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user.toJSON(),
      });
    } catch (error: any) {
      logger.error('Error in getProfile controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch profile',
      });
    }
  }

  /**
   * Update user profile
   * PUT /api/auth/profile/:id
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { email, name, role } = req.body;

      const user = await authService.updateUser(parseInt(id), {
        email,
        name,
        role,
      });

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user.toJSON(),
      });
    } catch (error: any) {
      logger.error('Error in updateProfile controller:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update profile',
      });
    }
  }

  /**
   * Delete user account
   * DELETE /api/auth/profile/:id
   */
  async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await authService.deleteUser(parseInt(id));

      res.status(200).json({
        success: true,
        message: 'Account deactivated successfully',
      });
    } catch (error: any) {
      logger.error('Error in deleteAccount controller:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete account',
      });
    }
  }

  /**
   * Change password
   * POST /api/auth/change-password/:id
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { oldPassword, newPassword } = req.body;

      // Validate required fields
      if (!oldPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Please provide old password and new password',
        });
        return;
      }

      // Validate new password length
      if (newPassword.length < 8) {
        res.status(400).json({
          success: false,
          message: 'New password must be at least 8 characters long',
        });
        return;
      }

      await authService.changePassword(parseInt(id), oldPassword, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error: any) {
      logger.error('Error in changePassword controller:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to change password',
      });
    }
  }

  /**
   * Get all users (admin only)
   * GET /api/auth/users
   */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await authService.getAllUsers(page, limit);

      res.status(200).json({
        success: true,
        data: result.users,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: result.pages,
        },
      });
    } catch (error: any) {
      logger.error('Error in getAllUsers controller:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch users',
      });
    }
  }
}

export default new AuthController();
