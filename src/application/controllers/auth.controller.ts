import { Request, Response } from 'express';
import authService from '../services/auth.service';
import { logger } from '../config/logger';

/**
 * Authentication Controller
 * Handles HTTP requests for authentication operations
 */
class AuthController {
  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
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

}

export default new AuthController();
