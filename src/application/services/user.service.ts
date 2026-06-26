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
  /**
   * Normalize branchIds input into a unique list of numeric ids.
   * Returns undefined when no branchIds field was provided (so existing
   * assignments are left untouched on update).
   */
  private extractBranchIds(data: unknown): number[] | undefined {
    const raw = (data as any)?.branchIds;
    if (raw === undefined || raw === null) {
      return undefined;
    }
    const ids = (Array.isArray(raw) ? raw : [raw])
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0);
    return Array.from(new Set(ids));
  }

  async create(data: UserMasterCreationAttributes, userId?: number): Promise<UserMaster> {
    try {
      const branchIds = this.extractBranchIds(data);

      const user = await userRepository.withTransaction(async (transaction: Transaction) => {
        const newUser = await userRepository.create(
          {
            ...data,
            email: data.email.toLowerCase(),
            role_id: (data as any).role_id ?? (data as any).roleId ?? null,
            branch_id: (data as any).branch_id ?? (data as any).branchId ?? null,
            created_by: userId || null,
            updated_by: userId || null,
          },
          { transaction }
        );

        // Assign the user to multiple branches (many-to-many)
        if (branchIds) {
          await newUser.setBranches(branchIds, { transaction });
        }

        return newUser;
      });

      logger.info(`User created: ${user.email} by user ${userId || 'system'}`);
      // Reload with associations so role/branch details are present in the response
      return (await userRepository.findById(user.id)) ?? user;
    } catch (error) {
      logger.error({error}, 'Error creating user:');
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
      logger.error({error}, 'Error fetching users:');
      throw error;
    }
  }

  async findById(id: number): Promise<UserMaster | null> {
    try {
      return userRepository.findById(id);
    } catch (error) {
      logger.error({error}, `Error fetching user with id ${id}:`);
      throw error;
    }
  }

  async update(id: number, data: Partial<UserMasterCreationAttributes>, userId?: number) {
    try {
      const user = await userRepository.findById(id);
      if (!user) return null;

      const branchIds = this.extractBranchIds(data);

      await userRepository.withTransaction(async (transaction: Transaction) => {
        await user.update(
          {
            ...data,
            email: data.email ? (data.email as string).toLowerCase() : user.email,
            role_id: (data as any).role_id ?? (data as any).roleId ?? user.role_id,
            branch_id: (data as any).branch_id ?? (data as any).branchId ?? user.branch_id,
            updated_by: userId || user.updated_by,
          },
          { transaction }
        );

        // Replace the user's branch assignments when branchIds is provided
        if (branchIds) {
          await user.setBranches(branchIds, { transaction });
        }

        return user;
      });

      // Reload with associations so role/branch details are fresh in the response
      const updatedUser = await userRepository.findById(id);

      logger.info(`User updated: ${updatedUser?.email ?? user.email} by user ${userId || 'system'}`);
      return updatedUser;
    } catch (error) {
      logger.error({error}, `Error updating user with id ${id}:`);
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
      logger.error({error}, `Error deleting user with id ${id}:`);
      throw error;
    }
  }

  async findAllActive(): Promise<UserMaster[]> {
    try {
      return userRepository.findAllActive();
    } catch (error) {
      logger.error({error}, 'Error fetching active users:');
      throw error;
    }
  }

  async isEmailExists(email: string, excludeId?: number): Promise<boolean> {
    try {
      return userRepository.isEmailExists(email, excludeId);
    } catch (error) {
      logger.error({error}, `Error checking email ${email}:`);
      throw error;
    }
  }

  async isMobileExists(mobile: string, excludeId?: number): Promise<boolean> {
    try {
      return userRepository.isMobileExists(mobile, excludeId);
    } catch (error) {
      logger.error({error}, `Error checking mobile ${mobile}:`);
      throw error;
    }
  }
}

export default new UserService();
