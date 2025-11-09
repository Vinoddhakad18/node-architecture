import { z } from 'zod';

/**
 * Schema for user registration
 */
export const registerSchema = z.object({
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
      .min(8, 'Password must be at least 8 characters long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
    name: z
      .string({
        message: 'Name is required',
      })
      .min(2, 'Name must be at least 2 characters long')
      .max(100, 'Name must not exceed 100 characters')
      .trim(),
    confirmPassword: z.string({
      message: 'Password confirmation is required',
    }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

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
 * Schema for forgot password request
 */
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string({
        message: 'Email is required',
      })
      .email({ message: 'Invalid email format' })
      .transform(val => val.toLowerCase().trim()),
  }),
});

/**
 * Schema for reset password
 */
export const resetPasswordSchema = z.object({
  body: z.object({
    token: z
      .string({
        message: 'Reset token is required',
      })
      .min(1, 'Reset token is required'),
    password: z
      .string({
        message: 'Password is required',
      })
      .min(8, 'Password must be at least 8 characters long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
    confirmPassword: z.string({
      message: 'Password confirmation is required',
    }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }),
});

/**
 * Schema for changing password (authenticated user)
 */
export const changePasswordSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'User ID must be a valid number'),
  }),
  body: z.object({
    oldPassword: z
      .string({
        message: 'Old password is required',
      })
      .min(1, 'Old password is required'),
    newPassword: z
      .string({
        message: 'New password is required',
      })
      .min(8, 'Password must be at least 8 characters long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
  }).refine((data) => data.oldPassword !== data.newPassword, {
    message: 'New password must be different from old password',
    path: ['newPassword'],
  }),
});

/**
 * Schema for email verification
 */
export const verifyEmailSchema = z.object({
  body: z.object({
    token: z
      .string({
        message: 'Verification token is required',
      })
      .min(1, 'Verification token is required'),
  }),
});

/**
 * Schema for resending verification email
 */
export const resendVerificationSchema = z.object({
  body: z.object({
    email: z
      .string({
        message: 'Email is required',
      })
      .email({ message: 'Invalid email format' })
      .transform(val => val.toLowerCase().trim()),
  }),
});

/**
 * Schema for getting user profile
 */
export const getProfileSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'User ID must be a valid number'),
  }),
});

/**
 * Schema for updating user profile
 */
export const updateProfileSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'User ID must be a valid number'),
  }),
  body: z.object({
    email: z
      .string()
      .email({ message: 'Invalid email format' })
      .transform(val => val.toLowerCase().trim())
      .optional(),
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters long')
      .max(100, 'Name must not exceed 100 characters')
      .trim()
      .optional(),
    role: z
      .enum(['user', 'admin'], {
        message: 'Role must be either "user" or "admin"',
      })
      .optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  }),
});

/**
 * Schema for deleting user account
 */
export const deleteAccountSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'User ID must be a valid number'),
  }),
});

/**
 * Schema for getting all users with pagination
 */
export const getAllUsersSchema = z.object({
  query: z.object({
    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a valid number')
      .transform(val => parseInt(val))
      .refine(val => val >= 1, 'Page must be at least 1')
      .optional()
      .default('1'),
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a valid number')
      .transform(val => parseInt(val))
      .refine(val => val >= 1 && val <= 100, 'Limit must be between 1 and 100')
      .optional()
      .default('10'),
  }),
});
