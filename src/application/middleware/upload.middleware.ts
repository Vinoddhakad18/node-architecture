import multer, { FileFilterCallback, StorageEngine } from 'multer';
import { Request } from 'express';
import * as path from 'path';
import * as crypto from 'crypto';
import { config } from '../../config';

// Allowed MIME types by category
export const ALLOWED_MIME_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
  ],
  videos: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
  archives: [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/gzip',
  ],
};

// All allowed MIME types combined
export const ALL_ALLOWED_MIME_TYPES = [
  ...ALLOWED_MIME_TYPES.images,
  ...ALLOWED_MIME_TYPES.documents,
  ...ALLOWED_MIME_TYPES.videos,
  ...ALLOWED_MIME_TYPES.audio,
  ...ALLOWED_MIME_TYPES.archives,
];

// Default file size limits (in bytes)
export const FILE_SIZE_LIMITS = {
  default: 10 * 1024 * 1024, // 10 MB
  images: 5 * 1024 * 1024, // 5 MB
  documents: 20 * 1024 * 1024, // 20 MB
  videos: 100 * 1024 * 1024, // 100 MB
  audio: 50 * 1024 * 1024, // 50 MB
};

/**
 * Generate a unique storage key for uploaded files
 */
export function generateStorageKey(originalName: string, prefix?: string): string {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalName).toLowerCase();
  const sanitizedName = path
    .basename(originalName, extension)
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .substring(0, 50);

  const key = `${sanitizedName}-${timestamp}-${randomBytes}${extension}`;

  if (prefix) {
    return `${prefix.replace(/^\/|\/$/g, '')}/${key}`;
  }

  return key;
}

/**
 * Get file category based on MIME type
 */
export function getFileCategory(mimeType: string): string {
  if (ALLOWED_MIME_TYPES.images.includes(mimeType)) return 'images';
  if (ALLOWED_MIME_TYPES.documents.includes(mimeType)) return 'documents';
  if (ALLOWED_MIME_TYPES.videos.includes(mimeType)) return 'videos';
  if (ALLOWED_MIME_TYPES.audio.includes(mimeType)) return 'audio';
  if (ALLOWED_MIME_TYPES.archives.includes(mimeType)) return 'archives';
  return 'other';
}

/**
 * Create a file filter function for multer
 */
function createFileFilter(allowedTypes?: string[]) {
  return (
    _req: Request,
    file: Express.Multer.File,
    callback: FileFilterCallback
  ): void => {
    const typesToCheck = allowedTypes || ALL_ALLOWED_MIME_TYPES;

    if (typesToCheck.includes(file.mimetype)) {
      callback(null, true);
    } else {
      callback(
        new Error(
          `Invalid file type: ${file.mimetype}. Allowed types: ${typesToCheck.join(', ')}`
        )
      );
    }
  };
}

/**
 * Memory storage configuration for multer
 * Files are stored in memory as Buffer objects
 */
const memoryStorage: StorageEngine = multer.memoryStorage();

export interface UploadConfig {
  maxFileSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
}

/**
 * Create a single file upload middleware
 */
export function uploadSingle(fieldName: string, options?: UploadConfig) {
  const maxFileSize =
    options?.maxFileSize || config.storage?.maxFileSize || FILE_SIZE_LIMITS.default;

  return multer({
    storage: memoryStorage,
    limits: {
      fileSize: maxFileSize,
      files: 1,
    },
    fileFilter: createFileFilter(options?.allowedTypes),
  }).single(fieldName);
}

/**
 * Create a multiple file upload middleware
 */
export function uploadMultiple(
  fieldName: string,
  maxCount: number,
  options?: UploadConfig
) {
  const maxFileSize =
    options?.maxFileSize || config.storage?.maxFileSize || FILE_SIZE_LIMITS.default;

  return multer({
    storage: memoryStorage,
    limits: {
      fileSize: maxFileSize,
      files: options?.maxFiles || maxCount,
    },
    fileFilter: createFileFilter(options?.allowedTypes),
  }).array(fieldName, maxCount);
}

/**
 * Create a field-specific upload middleware
 */
export function uploadFields(
  fields: { name: string; maxCount: number }[],
  options?: UploadConfig
) {
  const maxFileSize =
    options?.maxFileSize || config.storage?.maxFileSize || FILE_SIZE_LIMITS.default;

  return multer({
    storage: memoryStorage,
    limits: {
      fileSize: maxFileSize,
      files: options?.maxFiles || 10,
    },
    fileFilter: createFileFilter(options?.allowedTypes),
  }).fields(fields);
}

/**
 * Pre-configured upload middlewares
 */
export const upload = {
  // Single file uploads
  single: (fieldName = 'file') => uploadSingle(fieldName),

  // Image uploads (with image-specific validation)
  image: (fieldName = 'image') =>
    uploadSingle(fieldName, {
      allowedTypes: ALLOWED_MIME_TYPES.images,
      maxFileSize: FILE_SIZE_LIMITS.images,
    }),

  // Document uploads
  document: (fieldName = 'document') =>
    uploadSingle(fieldName, {
      allowedTypes: ALLOWED_MIME_TYPES.documents,
      maxFileSize: FILE_SIZE_LIMITS.documents,
    }),

  // Video uploads
  video: (fieldName = 'video') =>
    uploadSingle(fieldName, {
      allowedTypes: ALLOWED_MIME_TYPES.videos,
      maxFileSize: FILE_SIZE_LIMITS.videos,
    }),

  // Multiple files
  multiple: (fieldName = 'files', maxCount = 5) => uploadMultiple(fieldName, maxCount),

  // Multiple images
  images: (fieldName = 'images', maxCount = 5) =>
    uploadMultiple(fieldName, maxCount, {
      allowedTypes: ALLOWED_MIME_TYPES.images,
      maxFileSize: FILE_SIZE_LIMITS.images,
    }),

  // Custom configuration
  custom: (fieldName: string, options: UploadConfig) =>
    uploadSingle(fieldName, options),
};

export default upload;
