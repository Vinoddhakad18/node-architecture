import { z } from 'zod';

/**
 * Schema for creating a menu
 */
export const createMenuSchema = z.object({
  body: z.object({
    name: z
      .string({
        error: 'Menu name is required',
      })
      .min(1, 'Menu name cannot be empty')
      .max(255, 'Menu name must not exceed 255 characters')
      .trim(),
    route: z
      .string({
        error: 'Route is required',
      })
      .min(1, 'Route cannot be empty')
      .max(255, 'Route must not exceed 255 characters')
      .trim(),
    parent_id: z
      .number()
      .int('Parent ID must be an integer')
      .positive('Parent ID must be a positive number')
      .optional()
      .nullable(),
    sort_order: z
      .number()
      .int('Sort order must be an integer')
      .min(0, 'Sort order must be non-negative')
      .optional()
      .default(0),
    is_active: z.boolean().optional().default(true),
  }),
});

/**
 * Schema for updating a menu
 */
export const updateMenuSchema = z.object({
  params: z.object({
    id: z
      .string({
        error: 'Menu ID is required',
      })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, {
        message: 'Menu ID must be a positive number',
      }),
  }),
  body: z.object({
    name: z
      .string()
      .min(1, 'Menu name cannot be empty')
      .max(255, 'Menu name must not exceed 255 characters')
      .trim()
      .optional(),
    route: z
      .string()
      .min(1, 'Route cannot be empty')
      .max(255, 'Route must not exceed 255 characters')
      .trim()
      .optional(),
    parent_id: z
      .number()
      .int('Parent ID must be an integer')
      .positive('Parent ID must be a positive number')
      .optional()
      .nullable(),
    sort_order: z
      .number()
      .int('Sort order must be an integer')
      .min(0, 'Sort order must be non-negative')
      .optional(),
    is_active: z.boolean().optional(),
  }),
});

/**
 * Schema for getting menu by ID
 */
export const getMenuByIdSchema = z.object({
  params: z.object({
    id: z
      .string({
        error: 'Menu ID is required',
      })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, {
        message: 'Menu ID must be a positive number',
      }),
  }),
});

/**
 * Schema for getting menu by route
 */
export const getMenuByRouteSchema = z.object({
  params: z.object({
    route: z
      .string({
        error: 'Route is required',
      })
      .min(1, 'Route cannot be empty'),
  }),
});

/**
 * Schema for deleting a menu
 */
export const deleteMenuSchema = z.object({
  params: z.object({
    id: z
      .string({
        error: 'Menu ID is required',
      })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, {
        message: 'Menu ID must be a positive number',
      }),
  }),
});

/**
 * Schema for listing menus with pagination and filters
 */
export const listMenusSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .refine((val) => !isNaN(val) && val > 0, {
        message: 'Page must be a positive number',
      }),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .refine((val) => !isNaN(val) && val > 0 && val <= 100, {
        message: 'Limit must be between 1 and 100',
      }),
    search: z.string().optional(),
    is_active: z
      .string()
      .optional()
      .transform((val) => {
        if (val === 'true') {
          return true;
        }
        if (val === 'false') {
          return false;
        }
        return undefined;
      }),
    parent_id: z
      .string()
      .optional()
      .transform((val) => {
        if (val === 'null' || val === '') {
          return null;
        }
        if (val) {
          return parseInt(val, 10);
        }
        return undefined;
      }),
    sortBy: z
      .enum(['name', 'route', 'sort_order', 'created_at', 'updated_at'], {
        error: 'Invalid sort field',
      })
      .optional()
      .default('sort_order'),
    sortOrder: z
      .enum(['ASC', 'DESC'], {
        error: 'Sort order must be ASC or DESC',
      })
      .optional()
      .default('ASC'),
  }),
});

/**
 * Schema for reordering menus
 */
export const reorderMenusSchema = z.object({
  body: z.object({
    menuOrders: z
      .array(
        z.object({
          id: z.number().int().positive('Menu ID must be a positive number'),
          sort_order: z.number().int().min(0, 'Sort order must be non-negative'),
        })
      )
      .min(1, 'At least one menu order is required'),
  }),
});

/**
 * Schema for getting children of a menu
 */
export const getMenuChildrenSchema = z.object({
  params: z.object({
    id: z
      .string({
        error: 'Menu ID is required',
      })
      .transform((val) => parseInt(val, 10))
      .refine((val) => !isNaN(val) && val > 0, {
        message: 'Menu ID must be a positive number',
      }),
  }),
});
