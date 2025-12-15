import {
  createRoleSchema,
  updateRoleSchema,
  getRoleByIdSchema,
  deleteRoleSchema,
  listRolesSchema,
} from '@application/validations/role.schema';
import roleController from '@controllers/role.controller';
import { authenticate, authorize } from '@middleware/auth.middleware';
import { validateRequest } from '@middleware/validateRequest';
import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /roles/active/list:
 *   get:
 *     summary: Get all active roles
 *     description: Retrieve all active roles for dropdowns
 *     tags:
 *       - Roles
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active roles retrieved successfully
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
 *                   example: Active roles retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Role'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/active/list', authenticate, roleController.findAllActive);

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Get all roles
 *     description: Retrieve all roles with pagination and filtering
 *     tags:
 *       - Roles
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
 *         description: Search by name
 *       - in: query
 *         name: status
 *         schema:
 *           type: boolean
 *         description: Filter by status (true = active, false = inactive)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, created_at, updated_at]
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
 *         description: Roles retrieved successfully
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
 *                   example: Roles retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Role'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMeta'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', authenticate, validateRequest(listRolesSchema), roleController.findAll);

/**
 * @swagger
 * /roles/{id}:
 *   get:
 *     summary: Get role by ID
 *     description: Retrieve a role by its ID
 *     tags:
 *       - Roles
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role retrieved successfully
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
 *                   example: Role retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', authenticate, validateRequest(getRoleByIdSchema), roleController.findById);

/**
 * @swagger
 * /roles:
 *   post:
 *     summary: Create a new role
 *     description: Create a new role (Admin only)
 *     tags:
 *       - Roles
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: Role name (unique)
 *                 example: Manager
 *                 minLength: 1
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 description: Role description
 *                 example: Manager role with elevated permissions
 *                 maxLength: 500
 *               status:
 *                 type: boolean
 *                 description: Role status (true = active, false = inactive)
 *                 default: true
 *                 example: true
 *     responses:
 *       201:
 *         description: Role created successfully
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
 *                   example: Role created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Role'
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
  authorize('admin', 'super_admin'),
  validateRequest(createRoleSchema),
  roleController.create
);

/**
 * @swagger
 * /roles/{id}:
 *   put:
 *     summary: Update a role
 *     description: Update an existing role (Admin only)
 *     tags:
 *       - Roles
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Senior Manager
 *                 minLength: 1
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 example: Updated role description
 *                 maxLength: 500
 *               status:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Role updated successfully
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
 *                   example: Role updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Role'
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
  authorize('admin', 'super_admin'),
  validateRequest(updateRoleSchema),
  roleController.update
);

/**
 * @swagger
 * /roles/{id}:
 *   delete:
 *     summary: Delete a role (soft delete)
 *     description: Soft delete a role by setting status to inactive (Admin only)
 *     tags:
 *       - Roles
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role deleted successfully
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
 *                   example: Role deleted successfully
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
  authorize('admin', 'super_admin'),
  validateRequest(deleteRoleSchema),
  roleController.delete
);

export default router;

