import { z } from 'zod';

/**
 * Schema for creating a country
 */
export const createCountrySchema = z.object({
  body: z.object({
    name: z
      .string({
        error: 'Country name is required',
      })
      .min(1, 'Country name cannot be empty')
      .max(100, 'Country name must not exceed 100 characters')
      .trim(),
    code: z
      .string({
        error: 'Country code is required',
      })
      .min(2, 'Country code must be at least 2 characters')
      .max(3, 'Country code must not exceed 3 characters')
      .transform(val => val.toUpperCase().trim()),
    currency_code: z
      .string()
      .length(3, 'Currency code must be exactly 3 characters')
      .transform(val => val.toUpperCase().trim())
      .optional()
      .nullable(),
    status: z
      .enum(['active', 'inactive'], {
        error: 'Status must be either active or inactive',
      })
      .optional()
      .default('active'),
  }),
});

/**
 * Schema for updating a country
 */
export const updateCountrySchema = z.object({
  params: z.object({
    id: z
      .string({
        error: 'Country ID is required',
      })
      .transform(val => parseInt(val, 10))
      .refine(val => !isNaN(val) && val > 0, {
        message: 'Country ID must be a positive number',
      }),
  }),
  body: z.object({
    name: z
      .string()
      .min(1, 'Country name cannot be empty')
      .max(100, 'Country name must not exceed 100 characters')
      .trim()
      .optional(),
    code: z
      .string()
      .min(2, 'Country code must be at least 2 characters')
      .max(3, 'Country code must not exceed 3 characters')
      .transform(val => val.toUpperCase().trim())
      .optional(),
    currency_code: z
      .string()
      .length(3, 'Currency code must be exactly 3 characters')
      .transform(val => val.toUpperCase().trim())
      .optional()
      .nullable(),
    status: z
      .enum(['active', 'inactive'], {
        error: 'Status must be either active or inactive',
      })
      .optional(),
  }),
});

/**
 * Schema for getting country by ID
 */
export const getCountryByIdSchema = z.object({
  params: z.object({
    id: z
      .string({
        error: 'Country ID is required',
      })
      .transform(val => parseInt(val, 10))
      .refine(val => !isNaN(val) && val > 0, {
        message: 'Country ID must be a positive number',
      }),
  }),
});

/**
 * Schema for getting country by code
 */
export const getCountryByCodeSchema = z.object({
  params: z.object({
    code: z
      .string({
        error: 'Country code is required',
      })
      .min(2, 'Country code must be at least 2 characters')
      .max(3, 'Country code must not exceed 3 characters'),
  }),
});

/**
 * Schema for deleting a country
 */
export const deleteCountrySchema = z.object({
  params: z.object({
    id: z
      .string({
        error: 'Country ID is required',
      })
      .transform(val => parseInt(val, 10))
      .refine(val => !isNaN(val) && val > 0, {
        message: 'Country ID must be a positive number',
      }),
  }),
});

/**
 * Schema for listing countries with pagination and filters
 */
export const listCountriesSchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform(val => (val ? parseInt(val, 10) : 1))
      .refine(val => !isNaN(val) && val > 0, {
        message: 'Page must be a positive number',
      }),
    limit: z
      .string()
      .optional()
      .transform(val => (val ? parseInt(val, 10) : 10))
      .refine(val => !isNaN(val) && val > 0 && val <= 100, {
        message: 'Limit must be between 1 and 100',
      }),
    search: z.string().optional(),
    status: z
      .enum(['active', 'inactive'], {
        error: 'Status must be either active or inactive',
      })
      .optional(),
    sortBy: z
      .enum(['name', 'code', 'created_at', 'updated_at'], {
        error: 'Invalid sort field',
      })
      .optional()
      .default('name'),
    sortOrder: z
      .enum(['ASC', 'DESC'], {
        error: 'Sort order must be ASC or DESC',
      })
      .optional()
      .default('ASC'),
  }),
});
