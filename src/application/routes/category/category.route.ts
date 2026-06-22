import { Router } from 'express';
import { CategoryController } from '@/application/controllers/category/category.controller';
import { attachPermissions, authenticate, requirePermission } from '@middleware/auth.middleware';
import { MenuRoute, PermissionAction } from '@application/constants';

const router = Router();
const controller = new CategoryController();

/**
 * @swagger
 * tags:
 *   name: Category
 *   description: Category Management APIs
 */

/**
 * @swagger
 * /api/category:
 *   post:
 *     summary: Create Category
 *     tags: [Category]
 *     requestBody:
 *       required: true
 *     responses:
 *       201:
 *         description: Created successfully
 */
router.post('/', requirePermission(MenuRoute.CATEGORY, PermissionAction.ADD),
  attachPermissions(MenuRoute.BRANCHES),authenticate, controller.create);

/**
 * @swagger
 * /api/category:
 *   get:
 *     summary: Get all Category
 *     tags: [Category]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', requirePermission(MenuRoute.CATEGORY, PermissionAction.VIEW),
  attachPermissions(MenuRoute.BRANCHES),authenticate, controller.getAll);

/**
 * @swagger
 * /api/category/{id}:
 *   get:
 *     summary: Get Category by ID
 *     tags: [Category]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/:id', requirePermission(MenuRoute.CATEGORY, PermissionAction.VIEW),
  attachPermissions(MenuRoute.BRANCHES),authenticate, controller.getById);

/**
 * @swagger
 * /api/category/{id}:
 *   put:
 *     summary: Update Category
 *     tags: [Category]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Updated successfully
 */
router.put('/:id', requirePermission(MenuRoute.CATEGORY, PermissionAction.EDIT),
  attachPermissions(MenuRoute.BRANCHES),authenticate, controller.update);

/**
 * @swagger
 * /api/category/{id}:
 *   delete:
 *     summary: Delete Category
 *     tags: [Category]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Deleted successfully
 */
router.delete('/:id', requirePermission(MenuRoute.CATEGORY, PermissionAction.DELETE),
  attachPermissions(MenuRoute.BRANCHES),authenticate, controller.delete);

export default router;