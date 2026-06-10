'use strict';

import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).min(1).max(100).trim(),
    email: z.string({ required_error: 'Email is required' }).email().max(120).trim(),
    password: z.string({ required_error: 'Password is required' }).min(6).max(128),
    mobile: z.string().max(15).optional().nullable(),
    roleId: z.number().int().positive().optional(),
    branchId: z.number().int().positive().optional(),
    branchIds: z.array(z.number().int().positive()).optional(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'User ID is required' })
      .regex(/^\d+$/, 'User ID must be a valid number')
      .transform((val) => parseInt(val, 10)),
  }),
  body: z.object({
    name: z.string().min(1).max(100).trim().optional(),
    email: z.string().email().max(120).trim().optional(),
    mobile: z.string().max(15).optional().nullable(),
    roleId: z.number().int().positive().optional(),
    branchId: z.number().int().positive().optional(),
    branchIds: z.array(z.number().int().positive()).optional(),
    status: z.string().optional(),
  }),
});

export const getUserByIdSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'User ID is required' })
      .regex(/^\d+$/, 'User ID must be a valid number')
      .transform((val) => parseInt(val, 10)),
  }),
});

export const deleteUserSchema = z.object({
  params: z.object({
    id: z
      .string({ required_error: 'User ID is required' })
      .regex(/^\d+$/, 'User ID must be a valid number')
      .transform((val) => parseInt(val, 10)),
  }),
});

export const listUsersSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform((val) => parseInt(val, 10)).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform((val) => parseInt(val, 10)).optional().default('10'),
    search: z.string().trim().optional(),
    status: z.string().optional(),
    sortBy: z
      .enum(['id', 'name', 'email', 'created_at', 'updated_at'], {
        errorMap: () => ({ message: 'Sort by must be one of: name, email, created_at, updated_at' }),
      })
      .optional()
      .default('name'),
    sortOrder: z.enum(['ASC', 'DESC']).optional().default('ASC'),
  }),
});
