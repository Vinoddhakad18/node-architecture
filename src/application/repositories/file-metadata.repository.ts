import FileMetadata, {
  FileMetadataAttributes,
  FileMetadataCreationAttributes,
} from '@models/file-metadata.model';
import { FindOptions, WhereOptions } from 'sequelize';

import { BaseRepository } from './base.repository';

/**
 * File Metadata Repository
 * Data access layer for file metadata operations
 */
export class FileMetadataRepository extends BaseRepository<
  FileMetadata,
  FileMetadataAttributes,
  FileMetadataCreationAttributes
> {
  constructor() {
    super(FileMetadata);
  }

  /**
   * Find file by storage key
   */
  async findByStorageKey(storageKey: string): Promise<FileMetadata | null> {
    return this.findOne({
      where: { storage_key: storageKey },
    });
  }

  /**
   * Find files by user (created_by)
   */
  async findByUser(userId: number, options?: FindOptions): Promise<FileMetadata[]> {
    return this.findAll({
      ...options,
      where: {
        ...(options?.where as WhereOptions<FileMetadataAttributes>),
        created_by: userId,
      } as WhereOptions<FileMetadataAttributes>,
    });
  }

  /**
   * Find files by category
   */
  async findByCategory(category: string, options?: FindOptions): Promise<FileMetadata[]> {
    return this.findAll({
      ...options,
      where: {
        ...(options?.where as WhereOptions<FileMetadataAttributes>),
        category,
      } as WhereOptions<FileMetadataAttributes>,
    });
  }

  /**
   * Find files by status
   */
  async findByStatus(status: 'active' | 'inactive' | 'deleted', options?: FindOptions): Promise<FileMetadata[]> {
    return this.findAll({
      ...options,
      where: {
        ...(options?.where as WhereOptions<FileMetadataAttributes>),
        status,
      } as WhereOptions<FileMetadataAttributes>,
    });
  }

  /**
   * Find active files only
   */
  async findAllActive(options?: FindOptions): Promise<FileMetadata[]> {
    return this.findByStatus('active', options);
  }

  /**
   * Find with pagination and complex filtering
   */
  async findWithFilters(
    page = 1,
    limit = 10,
    filters: {
      category?: string;
      mimeType?: string;
      status?: 'active' | 'inactive' | 'deleted';
      createdBy?: number;
    } = {},
    sortBy = 'created_at',
    sortOrder: 'ASC' | 'DESC' = 'DESC'
  ): Promise<{ rows: FileMetadata[]; count: number }> {
    const offset = (page - 1) * limit;
    const where: WhereOptions<FileMetadataAttributes> = {};

    // Apply filters
    if (filters.status) {
      (where as Record<string, unknown>).status = filters.status;
    }
    if (filters.category) {
      (where as Record<string, unknown>).category = filters.category;
    }
    if (filters.mimeType) {
      (where as Record<string, unknown>).mime_type = filters.mimeType;
    }
    if (filters.createdBy) {
      (where as Record<string, unknown>).created_by = filters.createdBy;
    }

    return this.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });
  }

  /**
   * Soft delete file (set status to deleted)
   */
  async softDelete(id: number, updatedBy?: number): Promise<boolean> {
    const result = await this.update(id, {
      status: 'deleted',
      updated_by: updatedBy,
    } as Partial<FileMetadataAttributes>);
    return result !== null;
  }

  /**
   * Update file status
   */
  async updateStatus(
    id: number,
    status: 'active' | 'inactive' | 'deleted',
    updatedBy?: number
  ): Promise<boolean> {
    const result = await this.update(id, {
      status,
      updated_by: updatedBy,
    } as Partial<FileMetadataAttributes>);
    return result !== null;
  }

  /**
   * Check if storage key exists
   */
  async isStorageKeyExists(storageKey: string): Promise<boolean> {
    return this.exists({ where: { storage_key: storageKey } });
  }

  /**
   * Get file statistics by category and user
   */
  async getStatistics(userId?: number): Promise<FileMetadata[]> {
    const where: WhereOptions<FileMetadataAttributes> = { status: 'active' };
    if (userId) {
      (where as Record<string, unknown>).created_by = userId;
    }

    return this.findAll({
      where,
      attributes: ['category', 'size'],
    });
  }

  /**
   * Find by ID with only specific attributes
   */
  async findByIdMinimal(id: number): Promise<FileMetadata | null> {
    return this.model.findByPk(id, {
      attributes: ['id'],
    });
  }
}

// Export singleton instance
export const fileMetadataRepository = new FileMetadataRepository();
export default fileMetadataRepository;
