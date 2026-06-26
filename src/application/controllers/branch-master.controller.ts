'use strict';

import { logger } from '@config/logger';
import { AuthenticatedRequest, getErrorMessage } from '@interfaces/common.interface';
import branchMasterService from '@services/branch-master.service';
import { Response } from 'express';

/**
 * Branch Master Controller
 */
class BranchMasterController {
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { branch_name, branch_code, address, status } = req.body;
      const userId = req.user?.userId;

      const codeExists = await branchMasterService.isBranchCodeExists(branch_code);
      if (codeExists) {
        res.sendConflict(`Branch with code '${branch_code}' already exists`);
        return;
      }

      const branch = await branchMasterService.create(
        { branch_name, branch_code: branch_code.toUpperCase(), address, status },
        userId
      );

      res.sendCreated(branch, 'Branch created successfully');
    } catch (error: unknown) {
      logger.error({error:error}, 'Error in create branch controller:');
      res.sendServerError(getErrorMessage(error) || 'Failed to create branch');
    }
  }

  async findAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        sortBy = 'branch_name',
        sortOrder = 'ASC',
      } = req.query;

      const result = await branchMasterService.findAll({
        page: Number(page),
        limit: Number(limit),
        search: search as string,
        status: status as 'active' | 'inactive',
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'ASC' | 'DESC',
      });

      res.sendSuccess(result, 'Branches retrieved successfully');
    } catch (error: unknown) {
      logger.error({error: error}, 'Error in findAll branches controller:');
      res.sendServerError(getErrorMessage(error) || 'Failed to retrieve branches');
    }
  }

  async findById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const branch = await branchMasterService.findById(Number(id));

      if (!branch) {
        res.sendNotFound(`Branch with id ${id} not found`);
        return;
      }

      res.sendSuccess(branch, 'Branch retrieved successfully');
    } catch (error: unknown) {
      logger.error({error: error}, 'Error in findById branch controller:');
      res.sendServerError(getErrorMessage(error) || 'Failed to retrieve branch');
    }
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { branch_name, branch_code, address, status } = req.body;
      const userId = req.user?.userId;

      if (branch_code) {
        const codeExists = await branchMasterService.isBranchCodeExists(branch_code, Number(id));
        if (codeExists) {
          res.sendConflict(`Branch with code '${branch_code}' already exists`);
          return;
        }
      }

      const branch = await branchMasterService.update(
        Number(id),
        {
          branch_name,
          branch_code: branch_code?.toUpperCase(),
          address,
          status,
        },
        userId
      );

      if (!branch) {
        res.sendNotFound(`Branch with id ${id} not found`);
        return;
      }

      res.sendSuccess(branch, 'Branch updated successfully');
    } catch (error: unknown) {
      logger.error({error: error}, 'Error in update branch controller:');
      res.sendServerError(getErrorMessage(error) || 'Failed to update branch');
    }
  }

  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const deleted = await branchMasterService.delete(Number(id), userId);
      if (!deleted) {
        res.sendNotFound(`Branch with id ${id} not found`);
        return;
      }

      res.sendSuccess(null, 'Branch deleted successfully');
    } catch (error: unknown) {
      logger.error({error: error}, 'Error in delete branch controller:');
      res.sendServerError(getErrorMessage(error) || 'Failed to delete branch');
    }
  }

  async findAllActive(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const branches = await branchMasterService.findAllActive();
      res.sendSuccess(branches, 'Active branches retrieved successfully');
    } catch (error: unknown) {
      logger.error({error: error}, 'Error in findAllActive branches controller:');
      res.sendServerError(getErrorMessage(error) || 'Failed to retrieve active branches');
    }
  }
}

export default new BranchMasterController();
