import {
  createMenuSchema,
  updateMenuSchema,
  getMenuByIdSchema,
  deleteMenuSchema,
  listMenusSchema,
  reorderMenusSchema,
  getMenuChildrenSchema,
} from '@application/validations/menu.schema';
import menuController from '@controllers/menu.controller';
import { authenticate } from '@middleware/auth.middleware';
import { validateRequest } from '@middleware/validateRequest';
import { Router } from 'express';

const router = Router();

/**
 * @swagger
 * /menus/active/list:
 *   get:
 *     summary: Get all active menus
 *     description: Retrieve all active menus for dropdowns
 *     tags:
 *       - Menus
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active menus retrieved successfully
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
 *                   example: Active menus retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Menu'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/active/list', authenticate, menuController.findAllActive);

/**
 * @swagger
 * /menus/tree:
 *   get:
 *     summary: Get menu tree
 *     description: Retrieve hierarchical menu structure for navigation
 *     tags:
 *       - Menus
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: active_only
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Filter only active menus
 *     responses:
 *       200:
 *         description: Menu tree retrieved successfully
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
 *                   example: Menu tree retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MenuTree'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/tree', authenticate, menuController.findMenuTree);

/**
 * @swagger
 * /menus:
 *   get:
 *     summary: Get all menus
 *     description: Retrieve all menus with pagination and filtering
 *     tags:
 *       - Menus
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
 *         description: Search by name or route
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: parent_id
 *         schema:
 *           type: integer
 *         description: Filter by parent ID (use 'null' for root menus)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, route, sort_order, created_at, updated_at]
 *           default: sort_order
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
 *         description: Menus retrieved successfully
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
 *                   example: Menus retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Menu'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMeta'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', authenticate, validateRequest(listMenusSchema), menuController.findAll);

/**
 * @swagger
 * /menus/{id}/children:
 *   get:
 *     summary: Get children of a menu
 *     description: Retrieve all child menus of a parent menu
 *     tags:
 *       - Menus
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Parent Menu ID
 *     responses:
 *       200:
 *         description: Menu children retrieved successfully
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
 *                   example: Menu children retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Menu'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/:id/children',
  authenticate,
  validateRequest(getMenuChildrenSchema),
  menuController.findChildren
);

/**
 * @swagger
 * /menus/{id}:
 *   get:
 *     summary: Get menu by ID
 *     description: Retrieve a menu by its ID
 *     tags:
 *       - Menus
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Menu ID
 *     responses:
 *       200:
 *         description: Menu retrieved successfully
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
 *                   example: Menu retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Menu'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', authenticate, validateRequest(getMenuByIdSchema), menuController.findById);

/**
 * @swagger
 * /menus:
 *   post:
 *     summary: Create a new menu
 *     description: Create a new menu item
 *     tags:
 *       - Menus
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
 *               - route
 *             properties:
 *               name:
 *                 type: string
 *                 description: Menu name
 *                 example: Dashboard
 *               route:
 *                 type: string
 *                 description: Menu route/path
 *                 example: /dashboard
 *               parent_id:
 *                 type: integer
 *                 nullable: true
 *                 description: Parent menu ID (null for root menus)
 *                 example: null
 *               sort_order:
 *                 type: integer
 *                 description: Display order
 *                 default: 0
 *               is_active:
 *                 type: boolean
 *                 description: Menu active status
 *                 default: true
 *     responses:
 *       201:
 *         description: Menu created successfully
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
 *                   example: Menu created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Menu'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/', authenticate, validateRequest(createMenuSchema), menuController.create);

/**
 * @swagger
 * /menus/reorder:
 *   put:
 *     summary: Reorder menus
 *     description: Update sort order for multiple menus
 *     tags:
 *       - Menus
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
 *               - menuOrders
 *             properties:
 *               menuOrders:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - sort_order
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: Menu ID
 *                     sort_order:
 *                       type: integer
 *                       description: New sort order
 *     responses:
 *       200:
 *         description: Menus reordered successfully
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
 *                   example: Menus reordered successfully
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put(
  '/reorder',
  authenticate,
  validateRequest(reorderMenusSchema),
  menuController.reorderMenus
);

/**
 * @swagger
 * /menus/{id}:
 *   put:
 *     summary: Update a menu
 *     description: Update an existing menu item
 *     tags:
 *       - Menus
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Menu ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Dashboard
 *               route:
 *                 type: string
 *                 example: /dashboard
 *               parent_id:
 *                 type: integer
 *                 nullable: true
 *               sort_order:
 *                 type: integer
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Menu updated successfully
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
 *                   example: Menu updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Menu'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         $ref: '#/components/responses/ConflictError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:id', authenticate, validateRequest(updateMenuSchema), menuController.update);

/**
 * @swagger
 * /menus/{id}:
 *   delete:
 *     summary: Delete a menu (soft delete)
 *     description: Soft delete a menu by setting is_active to false
 *     tags:
 *       - Menus
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Menu ID
 *     responses:
 *       200:
 *         description: Menu deleted successfully
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
 *                   example: Menu deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:id', authenticate, validateRequest(deleteMenuSchema), menuController.delete);

/**
 * @swagger
 * /menus/{id}/permanent:
 *   delete:
 *     summary: Permanently delete a menu
 *     description: Hard delete a menu from the database. This action cannot be undone.
 *     tags:
 *       - Menus
 *     security:
 *       - apiKey: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Menu ID
 *     responses:
 *       200:
 *         description: Menu permanently deleted
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
 *                   example: Menu permanently deleted
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete(
  '/:id/permanent',
  authenticate,
  validateRequest(deleteMenuSchema),
  menuController.hardDelete
);

export default router;
