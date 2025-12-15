import { logger } from '@config/logger';
import { AuthenticatedRequest, getErrorMessage } from '@interfaces/common.interface';
import roleService from '@services/role.service';
import { Response } from 'express';

/**
 * Role Controller
 * Handles HTTP requests for role operations
 */
class RoleController {
  /**
   * Create a new role
   * POST /api/v1/roles
   */
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, description, status } = req.body;
      const userId = req.user?.userId;

      // Check if name already exists
      const nameExists = await roleService.isNameExists(name);
      if (nameExists) {
        res.sendConflict(`Role with name '${name}' already exists`);
        return;
      }

      const role = await roleService.create({ name, description, status }, userId);

      res.sendCreated(role, 'Role created successfully');
    } catch (error: unknown) {
      logger.error('Error in create role controller:', error);
      res.sendServerError(getErrorMessage(error) || 'Failed to create role');
    }
  }

  /**
   * Get all roles with pagination
   * GET /api/v1/roles
   */
  async findAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        sortBy = 'name',
        sortOrder = 'ASC',
      } = req.query;

      const result = await roleService.findAll({
        page: Number(page),
        limit: Number(limit),
        search: search as string,
        status: status !== undefined ? status === 'true' || status === true : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'ASC' | 'DESC',
      });

      res.sendSuccess(result, 'Roles retrieved successfully');
    } catch (error: unknown) {
      logger.error('Error in findAll roles controller:', error);
      res.sendServerError(getErrorMessage(error) || 'Failed to retrieve roles');
    }
  }

  /**
   * Get role by ID
   * GET /api/v1/roles/:id
   */
  async findById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const role = await roleService.findById(Number(id));

      if (!role) {
        res.sendNotFound(`Role with id ${id} not found`);
        return;
      }

      res.sendSuccess(role, 'Role retrieved successfully');
    } catch (error: unknown) {
      logger.error('Error in findById role controller:', error);
      res.sendServerError(getErrorMessage(error) || 'Failed to retrieve role');
    }
  }

  /**
   * Update role
   * PUT /api/v1/roles/:id
   */
  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description, status } = req.body;
      const userId = req.user?.userId;

      // Check if name already exists (excluding current record)
      if (name) {
        const nameExists = await roleService.isNameExists(name, Number(id));
        if (nameExists) {
          res.sendConflict(`Role with name '${name}' already exists`);
          return;
        }
      }

      const role = await roleService.update(
        Number(id),
        {
          name,
          description,
          status,
        },
        userId
      );

      if (!role) {
        res.sendNotFound(`Role with id ${id} not found`);
        return;
      }

      res.sendSuccess(role, 'Role updated successfully');
    } catch (error: unknown) {
      logger.error('Error in update role controller:', error);
      res.sendServerError(getErrorMessage(error) || 'Failed to update role');
    }
  }

  /**
   * Delete role (soft delete by setting status to inactive)
   * DELETE /api/v1/roles/:id
   */
  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      const deleted = await roleService.delete(Number(id), userId);

      if (!deleted) {
        res.sendNotFound(`Role with id ${id} not found`);
        return;
      }

      res.sendSuccess(null, 'Role deleted successfully');
    } catch (error: unknown) {
      logger.error('Error in delete role controller:', error);
      res.sendServerError(getErrorMessage(error) || 'Failed to delete role');
    }
  }

  /**
   * Get all active roles (for dropdowns)
   * GET /api/v1/roles/active/list
   */
  async findAllActive(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const roles = await roleService.findAllActive();

      res.sendSuccess(roles, 'Active roles retrieved successfully');
    } catch (error: unknown) {
      logger.error('Error in findAllActive roles controller:', error);
      res.sendServerError(getErrorMessage(error) || 'Failed to retrieve active roles');
    }
  }
}

export default new RoleController();
