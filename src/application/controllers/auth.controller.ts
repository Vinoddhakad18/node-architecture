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
      const { tokens } = await authService.login(email, password);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt, // Unix timestamp when access token expires
        },
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
   * Refresh access token
   * POST /api/auth/refresh-token
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        });
        return;
      }

      const { accessToken } = await authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken,
        },
      });
    } catch (error: any) {
      logger.error('Error in refresh token controller:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Token refresh failed',
      });
    }
  }

  /**
   * Verify token
   * POST /api/auth/verify-token
   */
  async verifyToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Token is required',
        });
        return;
      }

      const isValid = await authService.verifyToken(token);

      res.status(200).json({
        success: true,
        message: isValid ? 'Token is valid' : 'Token is invalid',
        data: {
          valid: isValid,
        },
      });
    } catch (error: any) {
      logger.error('Error in verify token controller:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Token verification failed',
      });
    }
  }

}

export default new AuthController();
