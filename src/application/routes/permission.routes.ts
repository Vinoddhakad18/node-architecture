import {
  getPermissionsSchema,
  updatePermissionsSchema,
} from '@application/validations/permission.schema';
import permissionController from '@controllers/permission.controller';
import { MenuRoute, PermissionAction } from '@application/constants';
import { attachPermissions, authenticate, requirePermission } from '@middleware/auth.middleware';
import { validateRequest } from '@middleware/validateRequest';
import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /permissions:
 *   get:
 *     summary: Get permissions for a role
 *     description: Retrieve all menu-level permissions for a specific role
 *     tags:
 *       - Permissions
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Permissions retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     roleId:
 *                       type: integer
 *                       example: 1
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           menuId:
 *                             type: integer
 *                             example: 1
 *                           permissions:
 *                             type: object
 *                             properties:
 *                               view:
 *                                 type: boolean
 *                                 example: true
 *                               add:
 *                                 type: boolean
 *                                 example: true
 *                               edit:
 *                                 type: boolean
 *                                 example: false
 *                               delete:
 *                                 type: boolean
 *                                 example: false
 *                               export:
 *                                 type: boolean
 *                                 example: false
 *                               status:
 *                                 type: boolean
 *                                 example: false
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
/**
 * @swagger
 * /permissions/me:
 *   get:
 *     summary: Get the current user's effective permissions
 *     description: Returns the logged-in user's per-menu action flags for front-end UI gating.
 *     tags:
 *       - Permissions
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permissions retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/me', authenticate, permissionController.getMyPermissions);

router.get(
  '/',
  authenticate,
  attachPermissions(MenuRoute.PERMISSIONS),
  requirePermission(MenuRoute.PERMISSIONS, PermissionAction.VIEW),
  validateRequest(getPermissionsSchema),
  permissionController.getRolePermissions
);

/**
 * @swagger
 * /permissions:
 *   put:
 *     summary: Update permissions for a role
 *     description: Update menu-level permissions for a specific role. Supports select-all and applies business logic rules (if view=false, all other permissions are disabled).
 *     tags:
 *       - Permissions
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleId
 *               - permissions
 *             properties:
 *               roleId:
 *                 type: integer
 *                 description: Role ID
 *                 example: 1
 *               permissions:
 *                 type: array
 *                 description: Array of menu permissions
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - menuId
 *                   properties:
 *                     menuId:
 *                       type: integer
 *                       description: Menu ID
 *                       example: 1
 *                     view:
 *                       type: boolean
 *                       description: View permission
 *                       example: true
 *                     add:
 *                       type: boolean
 *                       description: Add permission
 *                       example: true
 *                     edit:
 *                       type: boolean
 *                       description: Edit permission
 *                       example: false
 *                     delete:
 *                       type: boolean
 *                       description: Delete permission
 *                       example: false
 *                     export:
 *                       type: boolean
 *                       description: Export permission
 *                       example: false
 *                     status:
 *                       type: boolean
 *                       description: Status permission
 *                       example: false
 *     responses:
 *       200:
 *         description: Permissions updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Permissions updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     roleId:
 *                       type: integer
 *                       example: 1
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           menuId:
 *                             type: integer
 *                             example: 1
 *                           permissions:
 *                             type: object
 *                             properties:
 *                               view:
 *                                 type: boolean
 *                                 example: true
 *                               add:
 *                                 type: boolean
 *                                 example: true
 *                               edit:
 *                                 type: boolean
 *                                 example: false
 *                               delete:
 *                                 type: boolean
 *                                 example: false
 *                               export:
 *                                 type: boolean
 *                                 example: false
 *                               status:
 *                                 type: boolean
 *                                 example: false
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put(
  '/',
  authenticate,
  requirePermission(MenuRoute.PERMISSIONS, PermissionAction.EDIT),
  validateRequest(updatePermissionsSchema),
  permissionController.updateRolePermissions
);

export default router;
