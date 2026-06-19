import { Router } from 'express';
import { CategoryController } from '@/application/controllers/category/category.controller';

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
router.post('/', controller.create);

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
router.get('/', controller.getAll);

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
router.get('/:id', controller.getById);

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
router.put('/:id', controller.update);

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
router.delete('/:id', controller.delete);

export default router;