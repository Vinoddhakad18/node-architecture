/**
 * User Controller
 * Handles HTTP requests and responses for user-related operations
 */

import { userRepository } from '../models/User.js';

/**
 * Get all users
 * @route GET /api/users
 */
export const getAllUsers = (req, res, next) => {
  try {
    const users = userRepository.findAll();
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user by ID
 * @route GET /api/users/:id
 */
export const getUserById = (req, res, next) => {
  try {
    const user = userRepository.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new user
 * @route POST /api/users
 */
export const createUser = (req, res, next) => {
  try {
    const { name, email, role } = req.body;

    const user = userRepository.create({ name, email, role });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });
  } catch (error) {
    if (error.message.includes('required') || error.message.includes('already exists')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Update user
 * @route PUT /api/users/:id
 */
export const updateUser = (req, res, next) => {
  try {
    const { name, email, role } = req.body;

    const user = userRepository.update(req.params.id, { name, email, role });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user
 * @route DELETE /api/users/:id
 */
export const deleteUser = (req, res, next) => {
  try {
    const deleted = userRepository.delete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Render users list page
 * @route GET /users
 */
export const renderUsersPage = (req, res, next) => {
  try {
    const users = userRepository.findAll();
    res.render('users', {
      title: 'Users',
      users: users
    });
  } catch (error) {
    next(error);
  }
};
