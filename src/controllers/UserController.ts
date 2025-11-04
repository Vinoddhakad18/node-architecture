import { Request, Response } from 'express';
import { UserModel, User } from '../models/User';

export class UserController {
  // GET /users - Get all users
  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await UserModel.findAll();
      res.status(200).json({
        success: true,
        data: users,
        count: users.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching users',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // GET /users/:id - Get user by ID
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const user = await UserModel.findById(id);

      if (!user) {
        res.status(404).json({
          success: false,
          message: `User with ID ${id} not found`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching user',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // POST /users - Create new user
  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { name, email } = req.body;

      // Validate input
      if (!User.validate({ name, email })) {
        res.status(400).json({
          success: false,
          message: 'Invalid user data. Name must be at least 2 characters and email must be valid.',
        });
        return;
      }

      const newUser = await UserModel.create(name, email);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: newUser,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating user',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // PUT /users/:id - Update user
  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      // Validate if there are updates
      if (!updates.name && !updates.email) {
        res.status(400).json({
          success: false,
          message: 'No valid fields to update',
        });
        return;
      }

      const updatedUser = await UserModel.update(id, updates);

      if (!updatedUser) {
        res.status(404).json({
          success: false,
          message: `User with ID ${id} not found`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating user',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // DELETE /users/:id - Delete user
  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const deleted = await UserModel.delete(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: `User with ID ${id} not found`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting user',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
