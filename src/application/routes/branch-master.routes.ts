'use strict';

import {
  createBranchSchema,
  updateBranchSchema,
  getBranchByIdSchema,
  deleteBranchSchema,
  listBranchesSchema,
} from '@application/validations/branch-master.schema';
import branchMasterController from '@controllers/branch-master.controller';
import { MenuRoute, PermissionAction } from '@application/constants';
import { authenticate, requirePermission } from '@middleware/auth.middleware';
import { validateRequest } from '@middleware/validateRequest';
import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /branches/active/list:
 *   get:
 *     summary: Get all active branches
 *     description: Retrieve all active branches for dropdowns and selection lists
 *     tags:
 *       - Branches
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active branches retrieved successfully
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
 *                   example: Active branches retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       branch_name:
 *                         type: string
 *                       branch_code:
 *                         type: string
 *                       address:
 *                         type: string
 *                       status:
 *                         type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/active/list', authenticate, branchMasterController.findAllActive);

/**
 * @swagger
 * /branches:
 *   get:
 *     summary: Get all branches
 *     description: Retrieve branches with pagination, filtering, and sorting
 *     tags:
 *       - Branches
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by branch name or branch code
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by branch status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [id, branch_name, branch_code, created_at, updated_at]
 *           default: branch_name
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: ASC
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Branches retrieved successfully
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
 *                   example: Branches retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           branch_name:
 *                             type: string
 *                           branch_code:
 *                             type: string
 *                           address:
 *                             type: string
 *                           status:
 *                             type: string
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMeta'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/',
  authenticate,
  requirePermission(MenuRoute.BRANCHES, PermissionAction.VIEW),
  validateRequest(listBranchesSchema),
  branchMasterController.findAll
);

/**
 * @swagger
 * /branches/{id}:
 *   get:
 *     summary: Get a branch by ID
 *     description: Retrieve branch details for the specified ID
 *     tags:
 *       - Branches
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Branch ID
 *     responses:
 *       200:
 *         description: Branch retrieved successfully
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
 *                   example: Branch retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     branch_name:
 *                       type: string
 *                     branch_code:
 *                       type: string
 *                     address:
 *                       type: string
 *                     status:
 *                       type: string
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', authenticate, validateRequest(getBranchByIdSchema), branchMasterController.findById);

/**
 * @swagger
 * /branches:
 *   post:
 *     summary: Create a new branch
 *     description: Create a new branch record
 *     tags:
 *       - Branches
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
 *               - branch_name
 *               - branch_code
 *             properties:
 *               branch_name:
 *                 type: string
 *                 example: Downtown Branch
 *               branch_code:
 *                 type: string
 *                 example: DT001
 *               address:
 *                 type: string
 *                 example: 123 Main St, City
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: active
 *     responses:
 *       201:
 *         description: Branch created successfully
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
 *                   example: Branch created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     branch_name:
 *                       type: string
 *                     branch_code:
 *                       type: string
 *                     address:
 *                       type: string
 *                     status:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/',
  authenticate,
  requirePermission(MenuRoute.BRANCHES, PermissionAction.ADD),
  validateRequest(createBranchSchema),
  branchMasterController.create
);

/**
 * @swagger
 * /branches/{id}:
 *   put:
 *     summary: Update a branch
 *     description: Update an existing branch record
 *     tags:
 *       - Branches
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Branch ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               branch_name:
 *                 type: string
 *                 example: Downtown Branch Updated
 *               branch_code:
 *                 type: string
 *                 example: DT002
 *               address:
 *                 type: string
 *                 example: 456 Center Ave, City
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: active
 *     responses:
 *       200:
 *         description: Branch updated successfully
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
 *                   example: Branch updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     branch_name:
 *                       type: string
 *                     branch_code:
 *                       type: string
 *                     address:
 *                       type: string
 *                     status:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put(
  '/:id',
  authenticate,
  requirePermission(MenuRoute.BRANCHES, PermissionAction.EDIT),
  validateRequest(updateBranchSchema),
  branchMasterController.update
);

/**
 * @swagger
 * /branches/{id}:
 *   delete:
 *     summary: Delete a branch
 *     description: Soft delete a branch by setting its status to inactive
 *     tags:
 *       - Branches
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Branch ID
 *     responses:
 *       200:
 *         description: Branch deleted successfully
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
 *                   example: Branch deleted successfully
 *                 data:
 *                   type: object
 *                   nullable: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission(MenuRoute.BRANCHES, PermissionAction.DELETE),
  validateRequest(deleteBranchSchema),
  branchMasterController.delete
);

export default router;
