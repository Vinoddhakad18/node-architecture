import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import logger from '@utils/logger';

/**
 * Validation middleware factory
 * Validates request body, query, or params against a Zod schema
 */
export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const dataToValidate = req[source];
      schema.parse(dataToValidate);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }));

        logger.warn('Validation error:', errors);

        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
        return;
      }

      next(error);
    }
  };
};

// Common validation schemas
export const authSchemas = {
  register: z.object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    firstName: z.string().min(1, 'First name is required').max(100),
    lastName: z.string().min(1, 'Last name is required').max(100)
  }),

  login: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
  }),

  refreshToken: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required')
  })
};

export const userSchemas = {
  updateProfile: z.object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    email: z.string().email().optional()
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
  }),

  userId: z.object({
    id: z.string().uuid('Invalid user ID')
  })
};

export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});
