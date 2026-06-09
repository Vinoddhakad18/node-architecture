'use strict';

import { logger } from '@config/logger';
import UserMaster, { UserMasterCreationAttributes } from '@models/user-master.model';
import userRepository from '@repositories/user.repository';
import { Transaction } from 'sequelize';

interface UserQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class UserService {
  async create(data: UserMasterCreationAttributes, userId?: number): Promise<UserMaster> {
    try {
      const user = await userRepository.withTransaction(async (transaction: Transaction) => {
        const newUser = await userRepository.create(
          {
            ...data,
            email: data.email.toLowerCase(),
            branch_id: (data as any).branch_id ?? (data as any).branchId ?? null,
            created_by: userId || null,
            updated_by: userId || null,
          },
          { transaction }
        );
        return newUser;
      });

      logger.info(`User created: ${user.email} by user ${userId || 'system'}`);
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async findAll(options: UserQueryOptions = {}): Promise<PaginatedResult<UserMaster>> {
    try {
      const { page = 1, limit = 10, search, status, sortBy = 'name', sortOrder = 'ASC' } = options;
      const { rows, count } = await userRepository.findWithFilters(
        page,
        limit,
        search,
        status,
        sortBy,
        sortOrder as 'ASC' | 'DESC'
      );

      return {
        data: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching users:', error);
      throw error;
    }
  }

  async findById(id: number): Promise<UserMaster | null> {
    try {
      return userRepository.findById(id);
    } catch (error) {
      logger.error(`Error fetching user with id ${id}:`, error);
      throw error;
    }
  }

  async update(id: number, data: Partial<UserMasterCreationAttributes>, userId?: number) {
    try {
      const user = await userRepository.findById(id);
      if (!user) return null;

      const updatedUser = await userRepository.withTransaction(async (transaction: Transaction) => {
        await user.update(
          {
            ...data,
            email: data.email ? (data.email as string).toLowerCase() : user.email,
            branch_id: (data as any).branch_id ?? (data as any).branchId ?? user.branch_id,
            updated_by: userId || user.updated_by,
          },
          { transaction }
        );
        return user;
      });

      logger.info(`User updated: ${updatedUser.email} by user ${userId || 'system'}`);
      return updatedUser;
    } catch (error) {
      logger.error(`Error updating user with id ${id}:`, error);
      throw error;
    }
  }

  async delete(id: number, userId?: number): Promise<boolean> {
    try {
      const user = await userRepository.findById(id);
      if (!user) return false;

      const result = await userRepository.softDelete(id, userId);
      if (result) logger.info(`User deleted (soft): ${user.email}`);
      return result;
    } catch (error) {
      logger.error(`Error deleting user with id ${id}:`, error);
      throw error;
    }
  }

  async findAllActive(): Promise<UserMaster[]> {
    try {
      return userRepository.findAllActive();
    } catch (error) {
      logger.error('Error fetching active users:', error);
      throw error;
    }
  }

  async isEmailExists(email: string, excludeId?: number): Promise<boolean> {
    try {
      return userRepository.isEmailExists(email, excludeId);
    } catch (error) {
      logger.error(`Error checking email ${email}:`, error);
      throw error;
    }
  }

  async isMobileExists(mobile: string, excludeId?: number): Promise<boolean> {
    try {
      return userRepository.isMobileExists(mobile, excludeId);
    } catch (error) {
      logger.error(`Error checking mobile ${mobile}:`, error);
      throw error;
    }
  }
}

export default new UserService();
