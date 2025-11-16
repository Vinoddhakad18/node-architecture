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
      res.sendSuccess(tokens, 'Login successful');
    } catch (error: any) {
      logger.error('Error in login controller:', error);
      res.sendUnauthorized(error.message || 'Login failed');
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
        res.sendBadRequest('Refresh token is required');
        return;
      }

      const { accessToken } = await authService.refreshToken(refreshToken);

      res.sendSuccess({ accessToken }, 'Token refreshed successfully');
    } catch (error: any) {
      logger.error('Error in refresh token controller:', error);
      res.sendUnauthorized(error.message || 'Token refresh failed');
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
        res.sendBadRequest('Token is required');
        return;
      }

      const isValid = await authService.verifyToken(token);

      res.sendSuccess(
        { valid: isValid },
        isValid ? 'Token is valid' : 'Token is invalid'
      );
    } catch (error: any) {
      logger.error('Error in verify token controller:', error);
      res.sendBadRequest(error.message || 'Token verification failed');
    }
  }

}

export default new AuthController();
