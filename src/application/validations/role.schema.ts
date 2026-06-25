import { z } from 'zod';

/**
 * Schema for creating a role
 */
export const createRoleSchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: 'Role name is required',
      })
      .min(1, 'Role name cannot be empty')
      .max(100, 'Role name must not exceed 100 characters')
      .trim(),
    description: z
      .string()
      .max(500, 'Description must not exceed 500 characters')
      .trim()
      .optional()
      .nullable(),
    status: z
      .boolean({
        errorMap: () => ({ message: 'Status must be a boolean value' }),
      })
      .optional()
      .default(true),
  }),
});

/**
 * Schema for updating a role
 */
export const updateRoleSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: 'Role ID is required',
      })
      .regex(/^\d+$/, 'Role ID must be a valid number')
      .transform((val) => parseInt(val, 10)),
  }),
  body: z.object({
    name: z
      .string()
      .min(1, 'Role name cannot be empty')
      .max(100, 'Role name must not exceed 100 characters')
      .trim()
      .optional(),
    description: z
      .string()
      .max(500, 'Description must not exceed 500 characters')
      .trim()
      .optional()
      .nullable(),
    status: z
      .boolean({
        errorMap: () => ({ message: 'Status must be a boolean value' }),
      })
      .optional(),
  }),
});

/**
 * Schema for getting a role by ID
 */
export const getRoleByIdSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: 'Role ID is required',
      })
      .regex(/^\d+$/, 'Role ID must be a valid number')
      .transform((val) => parseInt(val, 10)),
  }),
});

/**
 * Schema for deleting a role
 */
export const deleteRoleSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: 'Role ID is required',
      })
      .regex(/^\d+$/, 'Role ID must be a valid number')
      .transform((val) => parseInt(val, 10)),
  }),
});

/**
 * Schema for listing roles
 */
export const listRolesSchema = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a valid number')
      .transform((val) => parseInt(val, 10))
      .optional()
      .default('1'),
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a valid number')
      .transform((val) => parseInt(val, 10))
      .optional()
      .default('10'),
    search: z.string().trim().optional(),
    status: z
      .string()
      .transform((val) => val === 'true')
      .optional(),
    sortBy: z
      .enum(['id', 'name', 'created_at', 'updated_at'], {
        errorMap: () => ({ message: 'Sort by must be one of: name, created_at, updated_at' }),
      })
      .optional()
      .default('name'),
    sortOrder: z
      .enum(['ASC', 'DESC'], {
        errorMap: () => ({ message: 'Sort order must be ASC or DESC' }),
      })
      .optional()
      .default('ASC'),
  }),
});
