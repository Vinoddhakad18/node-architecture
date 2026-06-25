'use strict';

import { z } from 'zod';

export const createBranchSchema = z.object({
  body: z.object({
    branch_name: z
      .string({
        required_error: 'Branch name is required',
      })
      .min(1, 'Branch name cannot be empty')
      .max(150, 'Branch name must not exceed 150 characters')
      .trim(),
    branch_code: z
      .string({
        required_error: 'Branch code is required',
      })
      .min(1, 'Branch code cannot be empty')
      .max(50, 'Branch code must not exceed 50 characters')
      .trim(),
    address: z
      .string()
      .max(1000, 'Address must not exceed 1000 characters')
      .trim()
      .optional()
      .nullable(),
    status: z
      .enum(['active', 'inactive'], {
        errorMap: () => ({ message: 'Status must be active or inactive' }),
      })
      .optional()
      .default('active'),
  }),
});

export const updateBranchSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: 'Branch ID is required',
      })
      .regex(/^\d+$/, 'Branch ID must be a valid number')
      .transform((val) => parseInt(val, 10)),
  }),
  body: z.object({
    branch_name: z
      .string()
      .min(1, 'Branch name cannot be empty')
      .max(150, 'Branch name must not exceed 150 characters')
      .trim()
      .optional(),
    branch_code: z
      .string()
      .min(1, 'Branch code cannot be empty')
      .max(50, 'Branch code must not exceed 50 characters')
      .trim()
      .optional(),
    address: z
      .string()
      .max(1000, 'Address must not exceed 1000 characters')
      .trim()
      .optional()
      .nullable(),
    status: z
      .enum(['active', 'inactive'], {
        errorMap: () => ({ message: 'Status must be active or inactive' }),
      })
      .optional(),
  }),
});

export const getBranchByIdSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: 'Branch ID is required',
      })
      .regex(/^\d+$/, 'Branch ID must be a valid number')
      .transform((val) => parseInt(val, 10)),
  }),
});

export const deleteBranchSchema = z.object({
  params: z.object({
    id: z
      .string({
        required_error: 'Branch ID is required',
      })
      .regex(/^\d+$/, 'Branch ID must be a valid number')
      .transform((val) => parseInt(val, 10)),
  }),
});

export const listBranchesSchema = z.object({
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
      .enum(['active', 'inactive'])
      .optional(),
    sortBy: z
      .enum(['id', 'branch_name', 'branch_code', 'created_at', 'updated_at'], {
        errorMap: () => ({ message: 'Sort by must be one of: branch_name, branch_code, created_at, updated_at' }),
      })
      .optional()
      .default('branch_name'),
    sortOrder: z
      .enum(['ASC', 'DESC'], {
        errorMap: () => ({ message: 'Sort order must be ASC or DESC' }),
      })
      .optional()
      .default('ASC'),
  }),
});
