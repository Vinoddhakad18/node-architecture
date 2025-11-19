import FileMetadata, { FileMetadataCreationAttributes } from '../models/file-metadata.model';
import { getStorageProvider } from './storage';
import { generateStorageKey, getFileCategory } from '../middleware/upload.middleware';
import redisService from '../helpers/redis.helper';
import { RedisTTL } from '../config/redis.config';
import { logger } from '../config/logger';

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
  metadata?: Record<string, any>;
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
    userId?: number
  ): Promise<FileMetadata> {
    const storage = getStorageProvider();
    const storageKey = generateStorageKey(input.originalName, input.prefix);
    const category = getFileCategory(input.mimeType);

    try {
      // Upload to storage
      const uploadResult = await storage.upload(storageKey, input.buffer, {
        contentType: input.mimeType,
        metadata: input.metadata as Record<string, string>,
      });

      // Save metadata to database
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

      const file = await FileMetadata.create(fileData);

      // Invalidate cache
      await this.invalidateCache(userId);

      logger.info('File uploaded successfully', {
        fileId: file.id,
        storageKey,
        size: input.size,
      });

      return file;
    } catch (error: any) {
      // Clean up storage if database save fails
      try {
        await storage.delete(storageKey);
      } catch (cleanupError) {
        logger.error('Failed to clean up storage after upload failure:', cleanupError);
      }
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultiple(
    files: FileUploadInput[],
    userId?: number
  ): Promise<FileMetadata[]> {
    const results: FileMetadata[] = [];

    for (const file of files) {
      const result = await this.upload(file, userId);
      results.push(result);
    }

    return results;
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
    const where: any = {};

    if (status) where.status = status;
    if (category) where.category = category;
    if (mimeType) where.mime_type = mimeType;
    if (createdBy) where.created_by = createdBy;

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
   */
  async hardDelete(id: number): Promise<boolean> {
    const file = await FileMetadata.findByPk(id);

    if (!file) {
      return false;
    }

    const storage = getStorageProvider();

    try {
      // Delete from storage
      await storage.delete(file.storage_key);

      // Delete from database
      await file.destroy();

      // Invalidate cache
      await this.invalidateSingleFileCache(id, file.storage_key);
      await this.invalidateCache(file.created_by || undefined);

      logger.info('File hard deleted', { fileId: id, storageKey: file.storage_key });

      return true;
    } catch (error) {
      logger.error('Failed to hard delete file:', error);
      throw error;
    }
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
    const where: any = { status: 'active' };
    if (userId) where.created_by = userId;

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
