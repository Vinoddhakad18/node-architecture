import { z } from 'zod';

/**
 * Schema for user login
 */
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({
        message: 'Email is required',
      })
      .email({ message: 'Invalid email format' })
      .transform((val) => val.toLowerCase().trim()),
    password: z
      .string({
        message: 'Password is required',
      })
      .min(1, 'Password is required'),
  }),
});

/**
 * Schema for refresh token
 */
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z
      .string({
        message: 'Refresh token is required',
      })
      .min(1, 'Refresh token cannot be empty'),
  }),
});

/**
 * Schema for verify token
 */
export const verifyTokenSchema = z.object({
  body: z.object({
    token: z
      .string({
        message: 'Token is required',
      })
      .min(1, 'Token cannot be empty'),
  }),
});

/**
 * Schema for logout
 */
export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }),
});

/**
 * Schema for change password
 */
export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z
        .string({
          message: 'Current password is required',
        })
        .min(1, 'Current password is required'),
      newPassword: z
        .string({
          message: 'New password is required',
        })
        .min(8, 'New password must be at least 8 characters')
        .regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          'New password must contain at least one uppercase letter, one lowercase letter, and one number'
        ),
      confirmPassword: z.string({
        message: 'Confirm password is required',
      }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }),
});
