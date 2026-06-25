import fileUploadService, { FileUploadInput, FileListOptions } from '@services/file-upload.service';
import { Request, Response, NextFunction } from 'express';

/**
 * File Upload Controller
 * Handles HTTP requests for file upload operations
 */
class FileUploadController {
  /**
   * List all files with pagination
   */
  async findAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const options: FileListOptions = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
        category: req.query.category as string,
        mimeType: req.query.mimeType as string,
        status: req.query.status as 'active' | 'inactive' | 'deleted',
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'ASC' | 'DESC',
      };

      const result = await fileUploadService.findAll(options);
      res.sendSuccess(result, 'Files retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user's files
   */
  async findMyFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.sendUnauthorized('User not authenticated');
        return;
      }

      const options: FileListOptions = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
        category: req.query.category as string,
        status: req.query.status as 'active' | 'inactive' | 'deleted',
      };

      const result = await fileUploadService.findByUser(userId, options);
      res.sendSuccess(result, 'User files retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get storage statistics
   */
  async getStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.query.forUser === 'true' ? req.user?.userId : undefined;
      const statistics = await fileUploadService.getStatistics(userId);
      res.sendSuccess(statistics, 'Statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get file by ID
   */
  async findById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const file = await fileUploadService.findById(id);

      if (!file) {
        res.sendNotFound('File not found');
        return;
      }

      res.sendSuccess(file, 'File retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download file content
   */
  async download(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const result = await fileUploadService.download(id);

      if (!result) {
        res.sendNotFound('File not found');
        return;
      }

      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${result.file.original_name}"`);
      result.stream.pipe(res);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get presigned download URL
   */
  async getDownloadUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const expiresIn = req.query.expiresIn ? parseInt(req.query.expiresIn as string, 10) : 3600;

      const url = await fileUploadService.getDownloadUrl(id, expiresIn);

      if (!url) {
        res.sendNotFound('File not found');
        return;
      }

      res.sendSuccess({ url, expiresIn }, 'Download URL generated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload a single file
   */
  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.sendBadRequest('No file uploaded');
        return;
      }

      // Parse metadata if provided and not empty
      let parsedMetadata: Record<string, any> | undefined;
      if (req.body.metadata && req.body.metadata.trim()) {
        try {
          parsedMetadata = JSON.parse(req.body.metadata);
        } catch {
          res.sendBadRequest('Invalid metadata format. Must be valid JSON.');
          return;
        }
      }

      const input: FileUploadInput = {
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        description: req.body.description || undefined,
        metadata: parsedMetadata,
        prefix: req.body.prefix || undefined,
      };

      const file = await fileUploadService.upload(input, req.user?.userId);
      res.sendCreated(file, 'File uploaded successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultiple(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        res.sendBadRequest('No files uploaded');
        return;
      }

      const inputs: FileUploadInput[] = files.map((file) => ({
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        prefix: req.body.prefix,
      }));

      const uploadedFiles = await fileUploadService.uploadMultiple(inputs, req.user?.userId);
      res.sendCreated(uploadedFiles, `${uploadedFiles.length} files uploaded successfully`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get presigned upload URL
   */
  async getPresignedUploadUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { filename, mimeType, expiresIn } = req.body;
      const result = await fileUploadService.getPresignedUploadUrl(
        filename,
        mimeType,
        expiresIn || 3600
      );

      res.sendSuccess(result, 'Upload URL generated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update file metadata
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const { description, metadata, category, status } = req.body;

      const file = await fileUploadService.update(
        id,
        { description, metadata, category, status },
        req.user?.userId
      );

      if (!file) {
        res.sendNotFound('File not found');
        return;
      }

      res.sendSuccess(file, 'File updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Soft delete file
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const deleted = await fileUploadService.delete(id, req.user?.userId);

      if (!deleted) {
        res.sendNotFound('File not found');
        return;
      }

      res.sendSuccess(null, 'File deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Hard delete file (permanent)
   */
  async hardDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const deleted = await fileUploadService.hardDelete(id);

      if (!deleted) {
        res.sendNotFound('File not found');
        return;
      }

      res.sendSuccess(null, 'File permanently deleted');
    } catch (error) {
      next(error);
    }
  }
}

export default new FileUploadController();
