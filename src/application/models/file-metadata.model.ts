import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@config/database';

/**
 * FileMetadata Model Attributes Interface
 */
export interface FileMetadataAttributes {
  id: number;
  original_name: string;
  storage_key: string;
  bucket: string;
  mime_type: string;
  size: number;
  url: string;
  etag: string | null;
  category: string | null;
  description: string | null;
  metadata: Record<string, any> | null;
  status: 'active' | 'inactive' | 'deleted';
  created_by: number | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * FileMetadata Creation Attributes Interface
 * Fields that are optional during creation
 */
export interface FileMetadataCreationAttributes
  extends Optional<
    FileMetadataAttributes,
    | 'id'
    | 'etag'
    | 'category'
    | 'description'
    | 'metadata'
    | 'status'
    | 'created_by'
    | 'updated_by'
    | 'created_at'
    | 'updated_at'
  > {}

/**
 * FileMetadata Model Class
 * Represents file metadata stored in the database
 */
export class FileMetadata
  extends Model<FileMetadataAttributes, FileMetadataCreationAttributes>
  implements FileMetadataAttributes
{
  public id!: number;
  public original_name!: string;
  public storage_key!: string;
  public bucket!: string;
  public mime_type!: string;
  public size!: number;
  public url!: string;
  public etag!: string | null;
  public category!: string | null;
  public description!: string | null;
  public metadata!: Record<string, any> | null;
  public status!: 'active' | 'inactive' | 'deleted';
  public created_by!: number | null;
  public updated_by!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  /**
   * Check if file is active
   */
  public get isActive(): boolean {
    return this.getDataValue('status') === 'active';
  }

  /**
   * Get file extension from original name
   */
  public get extension(): string {
    const parts = this.original_name.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  }

  /**
   * Get human-readable file size
   */
  public get humanReadableSize(): string {
    const bytes = this.size;
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let unitIndex = 0;
    let size = bytes;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}

/**
 * Initialize FileMetadata Model
 */
FileMetadata.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    original_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Original filename as uploaded by user',
    },
    storage_key: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
      comment: 'Storage key/path in the storage provider',
    },
    bucket: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Storage bucket name',
    },
    mime_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'MIME type of the file',
    },
    size: {
      type: DataTypes.BIGINT,
      allowNull: false,
      comment: 'File size in bytes',
    },
    url: {
      type: DataTypes.STRING(1000),
      allowNull: false,
      comment: 'Public URL or path to access the file',
    },
    etag: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'ETag from storage provider for cache validation',
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'File category (e.g., images, documents, videos)',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Optional description of the file',
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional metadata as JSON',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'deleted'),
      allowNull: false,
      defaultValue: 'active',
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'file_metadata',
    modelName: 'FileMetadata',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['storage_key'],
        unique: true,
      },
      {
        fields: ['category'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['created_by'],
      },
      {
        fields: ['mime_type'],
      },
    ],
  }
);

export default FileMetadata;
