import { logger } from '@config/logger';
import { AuthenticatedRequest, getErrorMessage } from '@interfaces/common.interface';
import permissionService from '@services/permission.service';
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
      logger.error('Error in getRolePermissions controller:', error);
      const errorMessage = getErrorMessage(error);
      
      if (errorMessage.includes('not found')) {
        res.sendNotFound(errorMessage);
        return;
      }

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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/25a74fed-1ea6-42fc-acc6-a7de668f6ad7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'permission.controller.ts:52',message:'Controller entry',data:{bodyType:Array.isArray(req.body)?'array':'object',bodyLength:Array.isArray(req.body)?req.body.length:Object.keys(req.body||{}).length,queryRoleId:req.query.roleId,hasBody:!!req.body},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B'})}).catch(()=>{});
    // #endregion
    try {
      const userId = req.user?.userId;
      let roleId: number | undefined;
      let permissions: any[] | undefined;

      // Check if body is an array (direct permissions array)
      if (Array.isArray(req.body)) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/25a74fed-1ea6-42fc-acc6-a7de668f6ad7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'permission.controller.ts:59',message:'Body is array branch',data:{permissionsCount:req.body.length,queryRoleId:req.query.roleId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        permissions = req.body;
        // Get roleId from query params
        const roleIdParam = req.query.roleId;
        if (!roleIdParam || typeof roleIdParam !== 'string') {
          res.sendBadRequest('Role ID is required in query params when sending permissions array directly');
          return;
        }
        roleId = parseInt(roleIdParam, 10);
        if (isNaN(roleId)) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/25a74fed-1ea6-42fc-acc6-a7de668f6ad7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'permission.controller.ts:67',message:'Invalid roleId in query',data:{roleIdParam},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          res.sendBadRequest('Role ID must be a valid number');
          return;
        }
      } else {
        // Body is an object
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/25a74fed-1ea6-42fc-acc6-a7de668f6ad7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'permission.controller.ts:73',message:'Body is object branch',data:{bodyRoleId:req.body.roleId,hasPermissions:!!req.body.permissions,permissionsIsArray:Array.isArray(req.body.permissions)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
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
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/25a74fed-1ea6-42fc-acc6-a7de668f6ad7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'permission.controller.ts:95',message:'Invalid permissions array',data:{permissions,isArray:Array.isArray(permissions),length:permissions?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        res.sendBadRequest('Permissions array is required and must not be empty');
        return;
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/25a74fed-1ea6-42fc-acc6-a7de668f6ad7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'permission.controller.ts:100',message:'Calling service with data',data:{roleId,permissionsCount:permissions.length,permissions},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      const result = await permissionService.updateRolePermissions(
        {
          roleId,
          permissions,
        },
        userId
      );
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/25a74fed-1ea6-42fc-acc6-a7de668f6ad7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'permission.controller.ts:108',message:'Service returned successfully',data:{resultRoleId:result.roleId,permissionsCount:result.permissions.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      res.sendSuccess(result, 'Permissions updated successfully');
    } catch (error: unknown) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/25a74fed-1ea6-42fc-acc6-a7de668f6ad7',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'permission.controller.ts:109',message:'Controller error caught',data:{errorMessage:error instanceof Error?error.message:String(error),errorStack:error instanceof Error?error.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,D'})}).catch(()=>{});
      // #endregion
      logger.error('Error in updateRolePermissions controller:', error);
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

