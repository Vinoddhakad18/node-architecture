import { Router } from 'express';
import countryMasterController from '../controllers/country-master.controller';
import { validateRequest } from '../middleware/validateRequest';
import { authenticate } from '../middleware/auth.middleware';
import {
  createCountrySchema,
  updateCountrySchema,
  getCountryByIdSchema,
  getCountryByCodeSchema,
  deleteCountrySchema,
  listCountriesSchema,
} from '../validations/country-master.schema';

const router = Router();

/**
 * @swagger
 * /countries/active/list:
 *   get:
 *     summary: Get all active countries
 *     description: Retrieve all active countries for dropdowns
 *     tags:
 *       - Countries
 *     responses:
 *       200:
 *         description: Active countries retrieved successfully
 */
router.get('/active/list', countryMasterController.findAllActive);

/**
 * @swagger
 * /countries:
 *   get:
 *     summary: Get all countries
 *     description: Retrieve all countries with pagination and filtering
 *     tags:
 *       - Countries
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or code
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, code, created_at, updated_at]
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Countries retrieved successfully
 */
router.get('/', validateRequest(listCountriesSchema), countryMasterController.findAll);

/**
 * @swagger
 * /countries/code/{code}:
 *   get:
 *     summary: Get country by code
 *     description: Retrieve a country by its ISO code
 *     tags:
 *       - Countries
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Country ISO code
 *     responses:
 *       200:
 *         description: Country retrieved successfully
 *       404:
 *         description: Country not found
 */
router.get('/code/:code', validateRequest(getCountryByCodeSchema), countryMasterController.findByCode);

/**
 * @swagger
 * /countries/{id}:
 *   get:
 *     summary: Get country by ID
 *     description: Retrieve a country by its ID
 *     tags:
 *       - Countries
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Country ID
 *     responses:
 *       200:
 *         description: Country retrieved successfully
 *       404:
 *         description: Country not found
 */
router.get('/:id', validateRequest(getCountryByIdSchema), countryMasterController.findById);

/**
 * @swagger
 * /countries:
 *   post:
 *     summary: Create a new country
 *     description: Create a new country record
 *     tags:
 *       - Countries
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *                 description: Country name
 *               code:
 *                 type: string
 *                 description: ISO 3166-1 country code (2-3 characters)
 *               currency_code:
 *                 type: string
 *                 description: ISO 4217 currency code (3 characters)
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: Country status
 *     responses:
 *       201:
 *         description: Country created successfully
 *       409:
 *         description: Country code already exists
 */
router.post('/', authenticate, validateRequest(createCountrySchema), countryMasterController.create);

/**
 * @swagger
 * /countries/{id}:
 *   put:
 *     summary: Update a country
 *     description: Update an existing country record
 *     tags:
 *       - Countries
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Country ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               currency_code:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Country updated successfully
 *       404:
 *         description: Country not found
 *       409:
 *         description: Country code already exists
 */
router.put('/:id', authenticate, validateRequest(updateCountrySchema), countryMasterController.update);

/**
 * @swagger
 * /countries/{id}:
 *   delete:
 *     summary: Delete a country (soft delete)
 *     description: Soft delete a country by setting status to inactive
 *     tags:
 *       - Countries
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Country ID
 *     responses:
 *       200:
 *         description: Country deleted successfully
 *       404:
 *         description: Country not found
 */
router.delete('/:id', authenticate, validateRequest(deleteCountrySchema), countryMasterController.delete);

/**
 * @swagger
 * /countries/{id}/permanent:
 *   delete:
 *     summary: Permanently delete a country
 *     description: Hard delete a country from the database
 *     tags:
 *       - Countries
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Country ID
 *     responses:
 *       200:
 *         description: Country permanently deleted
 *       404:
 *         description: Country not found
 */
router.delete('/:id/permanent', authenticate, validateRequest(deleteCountrySchema), countryMasterController.hardDelete);

export default router;
