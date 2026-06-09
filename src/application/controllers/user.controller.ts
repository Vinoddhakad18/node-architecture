'use strict';

import { logger } from '@config/logger';
import { AuthenticatedRequest, getErrorMessage } from '@interfaces/common.interface';
import userService from '@services/user.service';
import { UserResponseDTO, UserSummaryDTO } from '@application/dtos/user.dto';
import { Response } from 'express';

class UserController {
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, email, password, mobile, roleId, branchId } = req.body;
      const userId = req.user?.userId;

      const emailExists = await userService.isEmailExists(email);
      if (emailExists) {
        res.sendConflict(`User with email '${email}' already exists`);
        return;
      }

      if (mobile) {
        const mobileExists = await userService.isMobileExists(mobile);
        if (mobileExists) {
          res.sendConflict(`User with mobile '${mobile}' already exists`);
          return;
        }
      }

      const user = await userService.create(
        { name, email, password, mobile, role_id: roleId, branch_id: branchId } as any,
        userId
      );

      res.sendCreated(UserResponseDTO.fromModel(user), 'User created successfully');
    } catch (error: unknown) {
      logger.error('Error in create user controller:', error);
      res.sendServerError(getErrorMessage(error) || 'Failed to create user');
    }
  }

  async findAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, search, status, sortBy = 'name', sortOrder = 'ASC' } = req.query;
      const result = await userService.findAll({
        page: Number(page),
        limit: Number(limit),
        search: search as string,
        status: status as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'ASC' | 'DESC',
      });

      res.sendSuccess(
        {
          ...result,
          data: UserSummaryDTO.fromModels(result.data),
        },
        'Users retrieved successfully'
      );
    } catch (error: unknown) {
      logger.error('Error in findAll users controller:', error);
      res.sendServerError(getErrorMessage(error) || 'Failed to retrieve users');
    }
  }

  async findById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await userService.findById(Number(id));

      if (!user) {
        res.sendNotFound(`User with id ${id} not found`);
        return;
      }

      res.sendSuccess(UserResponseDTO.fromModel(user), 'User retrieved successfully');
    } catch (error: unknown) {
      logger.error('Error in findById user controller:', error);
      res.sendServerError(getErrorMessage(error) || 'Failed to retrieve user');
    }
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, email, mobile, roleId, branchId, status } = req.body;
      const userId = req.user?.userId;

      if (email) {
        const emailExists = await userService.isEmailExists(email, Number(id));
        if (emailExists) {
          res.sendConflict(`User with email '${email}' already exists`);
          return;
        }
      }

      if (mobile) {
        const mobileExists = await userService.isMobileExists(mobile, Number(id));
        if (mobileExists) {
          res.sendConflict(`User with mobile '${mobile}' already exists`);
          return;
        }
      }

      const user = await userService.update(Number(id), { name, email, mobile, role_id: roleId, branch_id: branchId } as any, userId);

      if (!user) {
        res.sendNotFound(`User with id ${id} not found`);
        return;
      }

      res.sendSuccess(UserResponseDTO.fromModel(user), 'User updated successfully');
    } catch (error: unknown) {
      logger.error('Error in update user controller:', error);
      res.sendServerError(getErrorMessage(error) || 'Failed to update user');
    }
  }

  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const deleted = await userService.delete(Number(id), userId);
      if (!deleted) {
        res.sendNotFound(`User with id ${id} not found`);
        return;
      }

      res.sendSuccess(null, 'User deleted successfully');
    } catch (error: unknown) {
      logger.error('Error in delete user controller:', error);
      res.sendServerError(getErrorMessage(error) || 'Failed to delete user');
    }
  }

  async findAllActive(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const users = await userService.findAllActive();
      res.sendSuccess(UserSummaryDTO.fromModels(users), 'Active users retrieved successfully');
    } catch (error: unknown) {
      logger.error('Error in findAllActive users controller:', error);
      res.sendServerError(getErrorMessage(error) || 'Failed to retrieve active users');
    }
  }
}

export default new UserController();
