import { Request, Response } from 'express';
import AuthService from '@services/AuthService';
import { asyncHandler, AppError } from '@middleware/errorHandler';
import logger from '@utils/logger';

class AuthController {
  /**
   * Register a new user
   */
  register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, firstName, lastName } = req.body;

    const result = await AuthService.register({
      email,
      password,
      firstName,
      lastName
    });

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: result.user.toJSON(),
        tokens: result.tokens
      }
    });
  });

  /**
   * Login user
   */
  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const result = await AuthService.login({ email, password });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user.toJSON(),
        tokens: result.tokens
      }
    });
  });

  /**
   * Refresh access token
   */
  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    const tokens = await AuthService.refreshAccessToken(refreshToken);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: tokens
    });
  });

  /**
   * Logout user
   */
  logout = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    await AuthService.logout(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  });

  /**
   * Get current user profile
   */
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    res.status(200).json({
      success: true,
      data: {
        user: req.user.toJSON()
      }
    });
  });

  /**
   * Update user password
   */
  changePassword = asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError('User not authenticated', 401);
    }

    const { currentPassword, newPassword } = req.body;

    await AuthService.changePassword(req.user.id, currentPassword, newPassword);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  });
}

export default new AuthController();
