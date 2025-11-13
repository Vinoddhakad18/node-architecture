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
      .transform(val => val.toLowerCase().trim()),
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
