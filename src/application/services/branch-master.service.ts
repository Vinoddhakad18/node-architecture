'use strict';

import { logger } from '@config/logger';
import BranchMaster, { BranchMasterCreationAttributes } from '@models/branch-master.model';
import branchMasterRepository from '@repositories/branch-master.repository';
import { Transaction } from 'sequelize';

interface BranchQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
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

/**
 * BranchMaster Service
 */
class BranchMasterService {
  async create(data: BranchMasterCreationAttributes, userId?: number): Promise<BranchMaster> {
    try {
      const branch = await branchMasterRepository.withTransaction(async (transaction: Transaction) => {
        const newBranch = await branchMasterRepository.create(
          {
            ...data,
            branch_code: data.branch_code.toUpperCase(),
            status: data.status ?? 'active',
            created_by: userId || null,
            updated_by: userId || null,
          },
          { transaction }
        );

        return newBranch;
      });

      logger.info(`Branch created: ${branch.branch_name} (${branch.branch_code})`);
      return branch;
    } catch (error) {
      logger.error('Error creating branch:', error);
      throw error;
    }
  }

  async findAll(options: BranchQueryOptions = {}): Promise<PaginatedResult<BranchMaster>> {
    try {
      const { page = 1, limit = 10, search, status, sortBy = 'branch_name', sortOrder = 'ASC' } = options;
      const { rows, count } = await branchMasterRepository.findWithFilters(
        page,
        limit,
        search,
        status,
        sortBy,
        sortOrder
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
      logger.error('Error fetching branches:', error);
      throw error;
    }
  }

  async findById(id: number): Promise<BranchMaster | null> {
    try {
      return branchMasterRepository.findById(id);
    } catch (error) {
      logger.error(`Error fetching branch with id ${id}:`, error);
      throw error;
    }
  }

  async update(
    id: number,
    data: Partial<BranchMasterCreationAttributes>,
    userId?: number
  ): Promise<BranchMaster | null> {
    try {
      const branch = await branchMasterRepository.findById(id);
      if (!branch) {
        return null;
      }

      const updatedBranch = await branchMasterRepository.withTransaction(async (transaction: Transaction) => {
        await branch.update(
          {
            ...data,
            branch_code: data.branch_code ? data.branch_code.toUpperCase() : branch.branch_code,
            updated_by: userId || branch.updated_by,
          },
          { transaction }
        );
        return branch;
      });

      logger.info(`Branch updated: ${updatedBranch.branch_name} (${updatedBranch.branch_code})`);
      return updatedBranch;
    } catch (error) {
      logger.error(`Error updating branch with id ${id}:`, error);
      throw error;
    }
  }

  async delete(id: number, userId?: number): Promise<boolean> {
    try {
      const branch = await branchMasterRepository.findById(id);
      if (!branch) {
        return false;
      }

      const result = await branchMasterRepository.softDelete(id, userId);
      if (result) {
        logger.info(`Branch deleted (soft): ${branch.branch_name} (${branch.branch_code})`);
      }
      return result;
    } catch (error) {
      logger.error(`Error deleting branch with id ${id}:`, error);
      throw error;
    }
  }

  async findAllActive(): Promise<BranchMaster[]> {
    try {
      return branchMasterRepository.findAllActive();
    } catch (error) {
      logger.error('Error fetching active branches:', error);
      throw error;
    }
  }

  async isBranchCodeExists(branch_code: string, excludeId?: number): Promise<boolean> {
    try {
      return branchMasterRepository.isBranchCodeExists(branch_code, excludeId);
    } catch (error) {
      logger.error(`Error checking branch code ${branch_code}:`, error);
      throw error;
    }
  }
}

export default new BranchMasterService();
