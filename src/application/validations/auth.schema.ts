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
