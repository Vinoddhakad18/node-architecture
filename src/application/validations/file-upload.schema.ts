import { z } from 'zod';

/**
 * Schema for file ID parameter
 */
export const fileIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid file ID'),
  }),
});

/**
 * Schema for file upload
 */
export const uploadFileSchema = z.object({
  body: z.object({
    description: z
      .string()
      .max(500, 'Description must be at most 500 characters')
      .optional(),
    metadata: z.string().optional(), // JSON string
    prefix: z
      .string()
      .max(100, 'Prefix must be at most 100 characters')
      .optional(),
  }),
});

/**
 * Schema for updating file metadata
 */
export const updateFileSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid file ID'),
  }),
  body: z.object({
    description: z
      .string()
      .max(500, 'Description must be at most 500 characters')
      .optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    category: z
      .string()
      .max(50, 'Category must be at most 50 characters')
      .optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

/**
 * Schema for listing files
 */
export const listFilesSchema = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a number')
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a number')
      .optional(),
    category: z
      .enum(['images', 'documents', 'videos', 'audio', 'archives', 'other'])
      .optional(),
    mimeType: z.string().optional(),
    status: z.enum(['active', 'inactive', 'deleted']).optional(),
    sortBy: z
      .enum(['created_at', 'updated_at', 'size', 'original_name'])
      .optional(),
    sortOrder: z.enum(['ASC', 'DESC']).optional(),
  }),
});

/**
 * Schema for getting download URL
 */
export const getDownloadUrlSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid file ID'),
  }),
  query: z.object({
    expiresIn: z
      .string()
      .regex(/^\d+$/, 'ExpiresIn must be a number')
      .optional(),
  }),
});

/**
 * Schema for getting presigned upload URL
 */
export const presignedUploadUrlSchema = z.object({
  body: z.object({
    filename: z
      .string()
      .min(1, 'Filename is required')
      .max(255, 'Filename must be at most 255 characters'),
    mimeType: z
      .string()
      .min(1, 'MIME type is required')
      .max(100, 'MIME type must be at most 100 characters'),
    expiresIn: z.number().min(60).max(86400).optional(),
  }),
});

/**
 * Schema for delete file
 */
export const deleteFileSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid file ID'),
  }),
});

/**
 * Schema for statistics query
 */
export const statisticsSchema = z.object({
  query: z.object({
    forUser: z.enum(['true', 'false']).optional(),
  }),
});
