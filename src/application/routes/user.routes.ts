'use strict';

import {
  createUserSchema,
  updateUserSchema,
  getUserByIdSchema,
  deleteUserSchema,
  listUsersSchema,
} from '@application/validations/user.schema';
import userController from '@controllers/user.controller';
import { MenuRoute, PermissionAction } from '@application/constants';
import { authenticate, requirePermission } from '@middleware/auth.middleware';
import { validateRequest } from '@middleware/validateRequest';
import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /users/active/list:
 *   get:
 *     summary: Get all active users
 *     description: Retrieve all active users for dropdowns and selection lists
 *     tags:
 *       - Users
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active users retrieved successfully
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
 *                   example: Active users retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/active/list',
  authenticate,
  requirePermission(MenuRoute.USERS, PermissionAction.VIEW),
  userController.findAllActive
);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve users with pagination, filtering, and sorting
 *     tags:
 *       - Users
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
 *         description: Search by name or email
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by user status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [id, name, email, createdAt, updatedAt]
 *           default: name
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
 *         description: Users retrieved successfully
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
 *                   example: Users retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
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
  requirePermission(MenuRoute.USERS, PermissionAction.VIEW),
  validateRequest(listUsersSchema),
  userController.findAll
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     description: Retrieve user details for the specified ID
 *     tags:
 *       - Users
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User retrieved successfully
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
 *                   example: User retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/:id',
  authenticate,
  requirePermission(MenuRoute.USERS, PermissionAction.VIEW),
  validateRequest(getUserByIdSchema),
  userController.findById
);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user (Admin or Super Admin only)
 *     tags:
 *       - Users
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
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Alice Smith
 *               email:
 *                 type: string
 *                 format: email
 *                 example: alice@example.com
 *               password:
 *                 type: string
 *                 format: password
 *               mobile:
 *                 type: string
 *                 example: '+1234567890'
 *               roleId:
 *                 type: integer
 *                 example: 1
 *               branchIds:
 *                 type: array
 *                 description: Branch IDs to assign the user to (many-to-many)
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *     responses:
 *       201:
 *         description: User created successfully
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
 *                   example: User created successfully
 *                 data:
 *                   $ref: '#/components/schemas/User'
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
  requirePermission(MenuRoute.USERS, PermissionAction.ADD),
  validateRequest(createUserSchema),
  userController.create
);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user
 *     description: Update an existing user record (Admin or Super Admin only)
 *     tags:
 *       - Users
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               mobile:
 *                 type: string
 *               roleId:
 *                 type: integer
 *               branchId:
 *                 type: integer
 *                 description: Optional primary branch for the user
 *               branchIds:
 *                 type: array
 *                 description: Branch IDs to assign the user to (many-to-many)
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: User updated successfully
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
 *                   example: User updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/User'
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
 *     
 */
router.put(
  '/:id',
  authenticate,
  requirePermission(MenuRoute.USERS, PermissionAction.EDIT),
  validateRequest(updateUserSchema),
  userController.update
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: Soft delete a user by setting its status to inactive
 *     tags:
 *       - Users
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
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
 *                   example: User deleted successfully
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
  requirePermission(MenuRoute.USERS, PermissionAction.DELETE),
  validateRequest(deleteUserSchema),
  userController.delete
);

export default router;
