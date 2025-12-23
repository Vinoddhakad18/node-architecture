import { z } from 'zod';

/**
 * Schema for getting permissions by role ID
 */
export const getPermissionsSchema = z.object({
  query: z.object({
    roleId: z
      .string({
        required_error: 'Role ID is required',
      })
      .regex(/^\d+$/, 'Role ID must be a valid number')
      .transform((val) => parseInt(val, 10)),
  }),
});

/**
 * Permission item schema (reusable)
 */
const permissionItemSchema = z.object({
  menuId: z
    .number({
      required_error: 'Menu ID is required',
    })
    .int('Menu ID must be an integer')
    .positive('Menu ID must be positive'),
  view: z.boolean().optional(),
  add: z.boolean().optional(),
  edit: z.boolean().optional(),
  delete: z.boolean().optional(),
  export: z.boolean().optional(),
  status: z.boolean().optional(),
});

/**
 * Schema for updating permissions
 * Supports:
 * 1. { roleId, permissions } in body
 * 2. permissions array in body + roleId in query
 */
export const updatePermissionsSchema = z
  .object({
    query: z
      .object({
        roleId: z
          .string()
          .regex(/^\d+$/, 'Role ID must be a valid number')
          .transform((val) => parseInt(val, 10))
          .optional(),
      })
      .optional(),
    body: z.union([
      // Format 1: Array directly (roleId must be in query)
      z.array(permissionItemSchema).min(1, 'At least one menu permission is required'),
      // Format 2: Object with roleId and permissions
      z.object({
        roleId: z
          .number()
          .int('Role ID must be an integer')
          .positive('Role ID must be positive')
          .optional(),
        permissions: z
          .array(permissionItemSchema)
          .min(1, 'At least one menu permission is required'),
      }),
    ]),
  })
  .superRefine((data, ctx) => {
    // If body is an array, roleId must be in query
    if (Array.isArray(data.body)) {
      if (!data.query?.roleId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Role ID is required in query params when sending permissions array directly',
          path: ['query', 'roleId'],
        });
      }
    } else {
      // If body is an object, roleId must be in body or query
      if (!data.body.roleId && !data.query?.roleId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Role ID is required (in body or query params)',
          path: ['body', 'roleId'],
        });
      }
    }
  });

