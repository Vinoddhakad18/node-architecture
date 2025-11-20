import { WhereOptions, Transaction } from 'sequelize';

import { sequelize } from '../config/database/database';
import { logger } from '../config/logger';
import { RedisTTL } from '../config/redis';
import { getStorageProvider } from '../config/storage';
import redisService from '../helpers/redis.helper';
import { generateStorageKey, getFileCategory } from '../middleware/upload.middleware';
import FileMetadata, {
  FileMetadataCreationAttributes,
  FileMetadataAttributes,
} from '../models/file-metadata.model';

// Cache key patterns
const CACHE_KEYS = {
  FILE_BY_ID: (id: number) => `file:id:${id}`,
  FILE_BY_KEY: (key: string) => `file:key:${key}`,
  FILE_LIST: (options: string) => `file:list:${options}`,
  USER_FILES: (userId: number) => `file:user:${userId}`,
};

export interface FileUploadInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
  description?: string;
  metadata?: Record<string, string | number | boolean>;
  prefix?: string;
}

export interface FileListOptions {
  page?: number;
  limit?: number;
  category?: string;
  mimeType?: string;
  status?: 'active' | 'inactive' | 'deleted';
  createdBy?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedFileResult {
  data: FileMetadata[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class FileUploadService {
  /**
   * Upload a file and save metadata
   */
  async upload(
    input: FileUploadInput,
    userId?: number,
    transaction?: Transaction
  ): Promise<FileMetadata> {
    const storage = getStorageProvider();
    const storageKey = generateStorageKey(input.originalName, input.prefix);
    const category = getFileCategory(input.mimeType);

    // Upload to storage first
    const uploadResult = await storage.upload(storageKey, input.buffer, {
      contentType: input.mimeType,
      metadata: input.metadata as Record<string, string>,
    });

    try {
      // Save metadata to database within transaction
      const fileData: FileMetadataCreationAttributes = {
        original_name: input.originalName,
        storage_key: storageKey,
        bucket: uploadResult.bucket,
        mime_type: input.mimeType,
        size: input.size,
        url: uploadResult.url,
        etag: uploadResult.etag || null,
        category,
        description: input.description || null,
        metadata: input.metadata || null,
        created_by: userId || null,
      };

      const file = await FileMetadata.create(fileData, { transaction });

      // Invalidate cache (only if not in a parent transaction, to avoid premature invalidation)
      if (!transaction) {
        await this.invalidateCache(userId);
      }

      logger.info('File uploaded successfully', {
        fileId: file.id,
        storageKey,
        size: input.size,
      });

      return file;
    } catch (error: unknown) {
      // Clean up storage if database save fails
      try {
        await storage.delete(storageKey);
        logger.info('Cleaned up storage after database failure', { storageKey });
      } catch (cleanupError) {
        logger.error('Failed to clean up storage after upload failure:', cleanupError);
      }
      throw error;
    }
  }

  /**
   * Upload multiple files atomically within a transaction
   */
  async uploadMultiple(files: FileUploadInput[], userId?: number): Promise<FileMetadata[]> {
    const storage = getStorageProvider();
    const uploadedKeys: string[] = [];

    return sequelize.transaction(async (transaction) => {
      const results: FileMetadata[] = [];

      try {
        for (const file of files) {
          const result = await this.upload(file, userId, transaction);
          uploadedKeys.push(result.storage_key);
          results.push(result);
        }

        // Invalidate cache after all uploads succeed
        await this.invalidateCache(userId);

        return results;
      } catch (error) {
        // Clean up all uploaded files from storage on failure
        for (const key of uploadedKeys) {
          try {
            await storage.delete(key);
            logger.info('Cleaned up storage during rollback', { storageKey: key });
          } catch (cleanupError) {
            logger.error('Failed to clean up storage during rollback:', cleanupError);
          }
        }
        throw error;
      }
    });
  }

  /**
   * Find file by ID
   */
  async findById(id: number): Promise<FileMetadata | null> {
    const cacheKey = CACHE_KEYS.FILE_BY_ID(id);

    // Try cache first
    const cached = await redisService.get<FileMetadata>(cacheKey);
    if (cached) {
      return new FileMetadata(cached);
    }

    const file = await FileMetadata.findByPk(id);

    if (file) {
      await redisService.set(cacheKey, file.toJSON(), RedisTTL.MEDIUM);
    }

    return file;
  }

  /**
   * Find file by storage key
   */
  async findByStorageKey(storageKey: string): Promise<FileMetadata | null> {
    const cacheKey = CACHE_KEYS.FILE_BY_KEY(storageKey);

    // Try cache first
    const cached = await redisService.get<FileMetadata>(cacheKey);
    if (cached) {
      return new FileMetadata(cached);
    }

    const file = await FileMetadata.findOne({
      where: { storage_key: storageKey },
    });

    if (file) {
      await redisService.set(cacheKey, file.toJSON(), RedisTTL.MEDIUM);
    }

    return file;
  }

  /**
   * List files with pagination and filtering
   */
  async findAll(options: FileListOptions = {}): Promise<PaginatedFileResult> {
    const {
      page = 1,
      limit = 10,
      category,
      mimeType,
      status = 'active',
      createdBy,
      sortBy = 'created_at',
      sortOrder = 'DESC',
    } = options;

    const offset = (page - 1) * limit;
    const where: WhereOptions<FileMetadataAttributes> = {};

    if (status) {
      (where as Record<string, unknown>).status = status;
    }
    if (category) {
      (where as Record<string, unknown>).category = category;
    }
    if (mimeType) {
      (where as Record<string, unknown>).mime_type = mimeType;
    }
    if (createdBy) {
      (where as Record<string, unknown>).created_by = createdBy;
    }

    const { count, rows } = await FileMetadata.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });

    return {
      data: rows,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Update file metadata
   */
  async update(
    id: number,
    data: Partial<Pick<FileMetadata, 'description' | 'metadata' | 'category' | 'status'>>,
    userId?: number
  ): Promise<FileMetadata | null> {
    const file = await FileMetadata.findByPk(id);

    if (!file) {
      return null;
    }

    await file.update({
      ...data,
      updated_by: userId || null,
    });

    // Invalidate cache
    await this.invalidateSingleFileCache(id, file.storage_key);

    logger.info('File metadata updated', { fileId: id });

    return file;
  }

  /**
   * Delete file (soft delete)
   */
  async delete(id: number, userId?: number): Promise<boolean> {
    const file = await FileMetadata.findByPk(id);

    if (!file) {
      return false;
    }

    await file.update({
      status: 'deleted',
      updated_by: userId || null,
    });

    // Invalidate cache
    await this.invalidateSingleFileCache(id, file.storage_key);
    await this.invalidateCache(file.created_by || undefined);

    logger.info('File soft deleted', { fileId: id });

    return true;
  }

  /**
   * Hard delete file (remove from storage and database)
   * Uses transaction to ensure database deletion is atomic
   */
  async hardDelete(id: number): Promise<boolean> {
    const file = await FileMetadata.findByPk(id);

    if (!file) {
      return false;
    }

    const storage = getStorageProvider();
    const storageKey = file.storage_key;
    const createdBy = file.created_by;

    // Use transaction for database operation
    await sequelize.transaction(async (transaction) => {
      // Delete from database first (can be rolled back)
      await file.destroy({ transaction });

      logger.info('File record deleted from database', { fileId: id, storageKey });
    });

    // Delete from storage after database transaction commits
    // This is outside the transaction because storage operations can't be rolled back
    try {
      await storage.delete(storageKey);
      logger.info('File deleted from storage', { storageKey });
    } catch (storageError) {
      // Log error but don't throw - database record is already deleted
      // This may leave orphaned files in storage that need manual cleanup
      logger.error('Failed to delete file from storage after database deletion:', {
        storageKey,
        error: storageError,
      });
    }

    // Invalidate cache
    await this.invalidateSingleFileCache(id, storageKey);
    await this.invalidateCache(createdBy || undefined);

    logger.info('File hard deleted successfully', { fileId: id, storageKey });

    return true;
  }

  /**
   * Get presigned download URL
   */
  async getDownloadUrl(id: number, expiresIn = 3600): Promise<string | null> {
    const file = await this.findById(id);

    if (!file || file.status === 'deleted') {
      return null;
    }

    const storage = getStorageProvider();
    return storage.getPresignedDownloadUrl(file.storage_key, expiresIn);
  }

  /**
   * Get presigned upload URL
   */
  async getPresignedUploadUrl(
    filename: string,
    mimeType: string,
    expiresIn = 3600
  ): Promise<{ uploadUrl: string; storageKey: string }> {
    const storage = getStorageProvider();
    const storageKey = generateStorageKey(filename);

    const uploadUrl = await storage.getPresignedUploadUrl(storageKey, {
      contentType: mimeType,
      expiresIn,
    });

    return { uploadUrl, storageKey };
  }

  /**
   * Download file content
   */
  async download(id: number): Promise<{
    file: FileMetadata;
    stream: NodeJS.ReadableStream;
    contentType: string;
  } | null> {
    const file = await this.findById(id);

    if (!file || file.status === 'deleted') {
      return null;
    }

    const storage = getStorageProvider();
    const result = await storage.download(file.storage_key);

    return {
      file,
      stream: result.body as NodeJS.ReadableStream,
      contentType: result.contentType || file.mime_type,
    };
  }

  /**
   * Get files by user
   */
  async findByUser(
    userId: number,
    options: Omit<FileListOptions, 'createdBy'> = {}
  ): Promise<PaginatedFileResult> {
    return this.findAll({ ...options, createdBy: userId });
  }

  /**
   * Check if file exists
   */
  async exists(id: number): Promise<boolean> {
    const file = await FileMetadata.findByPk(id, {
      attributes: ['id'],
    });
    return !!file;
  }

  /**
   * Get storage statistics
   */
  async getStatistics(userId?: number): Promise<{
    totalFiles: number;
    totalSize: number;
    byCategory: Record<string, { count: number; size: number }>;
  }> {
    const where: WhereOptions<FileMetadataAttributes> = { status: 'active' };
    if (userId) {
      (where as Record<string, unknown>).created_by = userId;
    }

    const files = await FileMetadata.findAll({
      where,
      attributes: ['category', 'size'],
    });

    const byCategory: Record<string, { count: number; size: number }> = {};
    let totalSize = 0;

    for (const file of files) {
      const category = file.category || 'other';
      if (!byCategory[category]) {
        byCategory[category] = { count: 0, size: 0 };
      }
      byCategory[category].count++;
      byCategory[category].size += Number(file.size);
      totalSize += Number(file.size);
    }

    return {
      totalFiles: files.length,
      totalSize,
      byCategory,
    };
  }

  /**
   * Invalidate cache for a single file
   */
  private async invalidateSingleFileCache(id: number, storageKey: string): Promise<void> {
    await Promise.all([
      redisService.del(CACHE_KEYS.FILE_BY_ID(id)),
      redisService.del(CACHE_KEYS.FILE_BY_KEY(storageKey)),
    ]);
  }

  /**
   * Invalidate general cache
   */
  private async invalidateCache(userId?: number): Promise<void> {
    const keys = [CACHE_KEYS.FILE_LIST('*')];
    if (userId) {
      keys.push(CACHE_KEYS.USER_FILES(userId));
    }

    // Note: In production, you might want to use pattern-based deletion
    // This is a simplified version
    for (const key of keys) {
      if (!key.includes('*')) {
        await redisService.del(key);
      }
    }
  }
}

export default new FileUploadService();
