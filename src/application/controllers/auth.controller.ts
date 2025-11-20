import { logger } from '@config/logger';
import { getErrorMessage } from '@interfaces/common.interface';
import { trackAuthAttempt } from '@middleware/metrics';
import authService from '@services/auth.service';
import { Request, Response } from 'express';

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
      trackAuthAttempt('success');
      res.sendSuccess(tokens, 'Login successful');
    } catch (error: unknown) {
      logger.error('Error in login controller:', error);
      trackAuthAttempt('failure');
      res.sendUnauthorized(getErrorMessage(error) || 'Login failed');
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
    } catch (error: unknown) {
      logger.error('Error in refresh token controller:', error);
      res.sendUnauthorized(getErrorMessage(error) || 'Token refresh failed');
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

      res.sendSuccess({ valid: isValid }, isValid ? 'Token is valid' : 'Token is invalid');
    } catch (error: unknown) {
      logger.error('Error in verify token controller:', error);
      res.sendBadRequest(getErrorMessage(error) || 'Token verification failed');
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const accessToken = req.token;
      const { refreshToken } = req.body;

      if (!accessToken) {
        res.sendBadRequest('No active session');
        return;
      }

      await authService.logout(accessToken, refreshToken);

      res.sendSuccess(null, 'Logged out successfully');
    } catch (error: unknown) {
      logger.error('Error in logout controller:', error);
      res.sendBadRequest(getErrorMessage(error) || 'Logout failed');
    }
  }

  /**
   * Change password
   * POST /api/auth/change-password
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.sendUnauthorized('Authentication required');
        return;
      }

      if (!currentPassword || !newPassword) {
        res.sendBadRequest('Current password and new password are required');
        return;
      }

      await authService.changePassword(userId, currentPassword, newPassword);

      res.sendSuccess(
        null,
        'Password changed successfully. Please login again with your new password.'
      );
    } catch (error: unknown) {
      logger.error('Error in change password controller:', error);
      res.sendBadRequest(getErrorMessage(error) || 'Password change failed');
    }
  }

  /**
   * Refresh token with rotation
   * POST /api/auth/refresh-token-rotate
   */
  async refreshTokenWithRotation(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.sendBadRequest('Refresh token is required');
        return;
      }

      const tokens = await authService.refreshTokenWithRotation(refreshToken);

      res.sendSuccess(tokens, 'Tokens refreshed successfully');
    } catch (error: unknown) {
      logger.error('Error in refresh token rotation controller:', error);
      res.sendUnauthorized(getErrorMessage(error) || 'Token refresh failed');
    }
  }
}

export default new AuthController();
