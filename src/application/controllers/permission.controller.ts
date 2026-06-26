import { logger } from '@config/logger';
import { UserRole } from '@constants/user.constants';
import { AuthenticatedRequest, getErrorMessage } from '@interfaces/common.interface';
import permissionService from '@services/permission.service';
import rbacService from '@services/rbac.service';
import { Response } from 'express';

/**
 * Permission Controller
 * Handles HTTP requests for permission operations
 */
class PermissionController {
  /**
   * Get permissions for a role
   * GET /api/permissions?roleId=:roleId
   */
  async getRolePermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { roleId } = req.query;

      if (!roleId || typeof roleId !== 'string') {
        res.sendBadRequest('Role ID is required');
        return;
      }

      const roleIdNum = parseInt(roleId, 10);
      if (isNaN(roleIdNum)) {
        res.sendBadRequest('Role ID must be a valid number');
        return;
      }

      const result = await permissionService.getRolePermissions(roleIdNum);

      res.sendSuccess(result, 'Permissions retrieved successfully');
    } catch (error: unknown) {
      logger.error({error:error}, 'Error in getRolePermissions controller');
      const errorMessage = getErrorMessage(error);

      if (errorMessage.includes('not found')) {
        res.sendNotFound(errorMessage);
        return;
      }

      res.sendServerError(errorMessage || 'Failed to retrieve permissions');
    }
  }

  /**
   * Get the authenticated user's own effective permissions.
   * GET /api/permissions/me
   * Drives front-end button gating (UX only; routes remain enforced server-side).
   */
  async getMyPermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const role = req.user?.role;

      if (!role) {
        res.sendUnauthorized('Authentication required');
        return;
      }

      const permissions = await rbacService.getEffectivePermissionMap(role);

      res.sendSuccess(
        {
          role,
          isSuperAdmin: role === UserRole.SUPER_ADMIN,
          permissions,
        },
        'Permissions retrieved successfully'
      );
    } catch (error: unknown) {
      logger.error({error: error}, 'Error in getMyPermissions controller');
      const errorMessage = getErrorMessage(error);
      res.sendServerError(errorMessage || 'Failed to retrieve permissions');
    }
  }

  /**
   * Update permissions for a role
   * PUT /api/permissions?roleId=:roleId
   * OR PUT /api/permissions with { roleId, permissions } in body
   * OR PUT /api/permissions?roleId=:roleId with permissions array directly in body
   */
  async updateRolePermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      let roleId: number | undefined;
      let permissions: any[] | undefined;

      // Check if body is an array (direct permissions array)
      if (Array.isArray(req.body)) {
        permissions = req.body;
        // Get roleId from query params
        const roleIdParam = req.query.roleId;
        if (!roleIdParam || typeof roleIdParam !== 'string') {
          res.sendBadRequest(
            'Role ID is required in query params when sending permissions array directly'
          );
          return;
        }
        roleId = parseInt(roleIdParam, 10);
        if (isNaN(roleId)) {
          res.sendBadRequest('Role ID must be a valid number');
          return;
        }
      } else {
        // Body is an object
        roleId = req.body.roleId;
        permissions = req.body.permissions;

        // If roleId not in body, try query params
        if (!roleId) {
          const roleIdParam = req.query.roleId;
          if (roleIdParam && typeof roleIdParam === 'string') {
            roleId = parseInt(roleIdParam, 10);
            if (isNaN(roleId)) {
              res.sendBadRequest('Role ID must be a valid number');
              return;
            }
          }
        }
      }

      if (!roleId) {
        res.sendBadRequest('Role ID is required (in body or query params)');
        return;
      }

      if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
        res.sendBadRequest('Permissions array is required and must not be empty');
        return;
      }

      const result = await permissionService.updateRolePermissions(
        {
          roleId,
          permissions,
        },
        userId
      );

      res.sendSuccess(result, 'Permissions updated successfully');
    } catch (error: unknown) {
      logger.error({error: error}, 'Error in updateRolePermissions controller');
      const errorMessage = getErrorMessage(error);

      if (errorMessage.includes('not found')) {
        res.sendNotFound(errorMessage);
        return;
      }

      if (errorMessage.includes('Menus not found')) {
        res.sendBadRequest(errorMessage);
        return;
      }

      res.sendServerError(errorMessage || 'Failed to update permissions');
    }
  }
}

export default new PermissionController();
