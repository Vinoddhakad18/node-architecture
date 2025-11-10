import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validateRequest';
import {

  loginSchema,

} from '../validations/auth.schema';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - email
 *         - name
 *         - role
 *       properties:
 *         id:
 *           type: integer
 *           description: User ID
 *           example: 1
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *           example: user@example.com
 *         name:
 *           type: string
 *           description: User full name
 *           example: John Doe
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: User role
 *           example: user
 *         isActive:
 *           type: boolean
 *           description: Whether the user account is active
 *           example: true
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Last login timestamp
 *           example: 2024-01-01T12:00:00.000Z
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: User creation timestamp
 *           example: 2024-01-01T12:00:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: User last update timestamp
 *           example: 2024-01-01T12:00:00.000Z
 *     
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: SecurePassword123!
 *     
 */


/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticate user and return user data
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: Login successful
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid email or password
 */
router.post('/login', validateRequest(loginSchema), authController.login);

export default router;
