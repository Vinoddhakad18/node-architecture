import { Router } from 'express';
import fileUploadController from '@controllers/file-upload.controller';
import { validateRequest } from '@middleware/validateRequest';
import { authenticate } from '@middleware/auth.middleware';
import { upload } from '@middleware/upload.middleware';
import {
  uploadFileSchema,
  updateFileSchema,
  listFilesSchema,
  getDownloadUrlSchema,
  presignedUploadUrlSchema,
  deleteFileSchema,
  fileIdParamSchema,
  statisticsSchema,
} from '@application/validations/file-upload.schema';

const router = Router();

/**
 * @swagger
 * /files:
 *   get:
 *     summary: List all files
 *     description: Retrieve files with pagination and filtering
 *     tags:
 *       - Files
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
 *         name: category
 *         schema:
 *           type: string
 *           enum: [images, documents, videos, audio, archives, other]
 *         description: Filter by category
 *       - in: query
 *         name: mimeType
 *         schema:
 *           type: string
 *         description: Filter by MIME type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, deleted]
 *         description: Filter by status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [created_at, updated_at, size, original_name]
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Files retrieved successfully
 */
router.get('/', validateRequest(listFilesSchema), fileUploadController.findAll);

/**
 * @swagger
 * /files/my-files:
 *   get:
 *     summary: Get current user's files
 *     description: Retrieve files uploaded by the authenticated user
 *     tags:
 *       - Files
 *     security:
 *       - bearerAuth: []
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
 *         name: category
 *         schema:
 *           type: string
 *           enum: [images, documents, videos, audio, archives, other]
 *         description: Filter by category
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, deleted]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: User files retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/my-files', authenticate, validateRequest(listFilesSchema), fileUploadController.findMyFiles);

/**
 * @swagger
 * /files/statistics:
 *   get:
 *     summary: Get storage statistics
 *     description: Get file storage statistics (total files, size by category)
 *     tags:
 *       - Files
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: forUser
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *         description: Get statistics for current user only
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/statistics', authenticate, validateRequest(statisticsSchema), fileUploadController.getStatistics);

/**
 * @swagger
 * /files/{id}:
 *   get:
 *     summary: Get file by ID
 *     description: Retrieve file metadata by ID
 *     tags:
 *       - Files
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: File ID
 *     responses:
 *       200:
 *         description: File retrieved successfully
 *       404:
 *         description: File not found
 */
router.get('/:id', validateRequest(fileIdParamSchema), fileUploadController.findById);

/**
 * @swagger
 * /files/{id}/download:
 *   get:
 *     summary: Download file
 *     description: Download file content directly
 *     tags:
 *       - Files
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: File ID
 *     responses:
 *       200:
 *         description: File download started
 *       404:
 *         description: File not found
 */
router.get('/:id/download', validateRequest(fileIdParamSchema), fileUploadController.download);

/**
 * @swagger
 * /files/{id}/download-url:
 *   get:
 *     summary: Get presigned download URL
 *     description: Get a temporary presigned URL for downloading
 *     tags:
 *       - Files
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: File ID
 *       - in: query
 *         name: expiresIn
 *         schema:
 *           type: integer
 *         description: URL expiration time in seconds (default 3600)
 *     responses:
 *       200:
 *         description: Download URL generated successfully
 *       404:
 *         description: File not found
 */
router.get('/:id/download-url', validateRequest(getDownloadUrlSchema), fileUploadController.getDownloadUrl);

/**
 * @swagger
 * /files:
 *   post:
 *     summary: Upload a file
 *     description: Upload a single file
 *     tags:
 *       - Files
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload
 *               description:
 *                 type: string
 *                 description: File description
 *               metadata:
 *                 type: string
 *                 description: Additional metadata (JSON string)
 *               prefix:
 *                 type: string
 *                 description: Storage path prefix
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *       400:
 *         description: No file uploaded or invalid file type
 */
router.post(
  '/',
  authenticate,
  upload.single('file'),
  validateRequest(uploadFileSchema),
  fileUploadController.upload
);

/**
 * @swagger
 * /files/multiple:
 *   post:
 *     summary: Upload multiple files
 *     description: Upload multiple files at once (max 10)
 *     tags:
 *       - Files
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - files
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Files to upload
 *               prefix:
 *                 type: string
 *                 description: Storage path prefix
 *     responses:
 *       201:
 *         description: Files uploaded successfully
 *       400:
 *         description: No files uploaded
 */
router.post(
  '/multiple',
  authenticate,
  upload.multiple('files', 10),
  fileUploadController.uploadMultiple
);

/**
 * @swagger
 * /files/presigned-upload:
 *   post:
 *     summary: Get presigned upload URL
 *     description: Get a temporary presigned URL for direct upload to storage
 *     tags:
 *       - Files
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filename
 *               - mimeType
 *             properties:
 *               filename:
 *                 type: string
 *                 description: Original filename
 *               mimeType:
 *                 type: string
 *                 description: File MIME type
 *               expiresIn:
 *                 type: integer
 *                 description: URL expiration in seconds (60-86400)
 *     responses:
 *       200:
 *         description: Upload URL generated successfully
 */
router.post(
  '/presigned-upload',
  authenticate,
  validateRequest(presignedUploadUrlSchema),
  fileUploadController.getPresignedUploadUrl
);

/**
 * @swagger
 * /files/{id}:
 *   put:
 *     summary: Update file metadata
 *     description: Update file metadata (description, category, status)
 *     tags:
 *       - Files
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: File ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               metadata:
 *                 type: object
 *               category:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: File updated successfully
 *       404:
 *         description: File not found
 */
router.put(
  '/:id',
  authenticate,
  validateRequest(updateFileSchema),
  fileUploadController.update
);

/**
 * @swagger
 * /files/{id}:
 *   delete:
 *     summary: Delete file (soft delete)
 *     description: Soft delete a file by marking it as deleted
 *     tags:
 *       - Files
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: File ID
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       404:
 *         description: File not found
 */
router.delete(
  '/:id',
  authenticate,
  validateRequest(deleteFileSchema),
  fileUploadController.delete
);

/**
 * @swagger
 * /files/{id}/permanent:
 *   delete:
 *     summary: Permanently delete file
 *     description: Hard delete file from storage and database
 *     tags:
 *       - Files
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: File ID
 *     responses:
 *       200:
 *         description: File permanently deleted
 *       404:
 *         description: File not found
 */
router.delete(
  '/:id/permanent',
  authenticate,
  validateRequest(deleteFileSchema),
  fileUploadController.hardDelete
);

export default router;
