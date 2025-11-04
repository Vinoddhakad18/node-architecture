import { Request, Response } from 'express';
import User from '@models/User';
import { asyncHandler, AppError } from '@middleware/errorHandler';
import logger from '@utils/logger';
import { Op } from 'sequelize';

class UserController {
  /**
   * Get all users (Admin only)
   */
  getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await User.findAndCountAll({
      limit: Number(limit),
      offset,
      order: [[sortBy as string, sortOrder as string]],
      attributes: { exclude: ['password', 'refreshToken'] }
    });

    res.status(200).json({
      success: true,
      data: {
        users: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit))
        }
      }
    });
  });

  /**
   * Get user by ID
   */
  getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password', 'refreshToken'] }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  });

  /**
   * Update user
   */
  updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { firstName, lastName, email } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;

    await user.save();

    logger.info(`User updated: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user: user.toJSON() }
    });
  });

  /**
   * Delete user (Admin only)
   */
  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    await user.destroy();

    logger.info(`User deleted: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  });

  /**
   * Search users
   */
  searchUsers = asyncHandler(async (req: Request, res: Response) => {
    const { query, page = 1, limit = 10 } = req.query;

    if (!query) {
      throw new AppError('Search query is required', 400);
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await User.findAndCountAll({
      where: {
        [Op.or]: [
          { firstName: { [Op.like]: `%${query}%` } },
          { lastName: { [Op.like]: `%${query}%` } },
          { email: { [Op.like]: `%${query}%` } }
        ]
      },
      limit: Number(limit),
      offset,
      attributes: { exclude: ['password', 'refreshToken'] }
    });

    res.status(200).json({
      success: true,
      data: {
        users: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / Number(limit))
        }
      }
    });
  });

  /**
   * Toggle user active status (Admin only)
   */
  toggleUserStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.isActive = !user.isActive;
    await user.save();

    logger.info(`User ${user.email} active status changed to: ${user.isActive}`);

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user: user.toJSON() }
    });
  });
}

export default new UserController();
