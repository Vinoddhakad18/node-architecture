/**
 * User-related Constants
 * Enums and constants for user management
 */

/**
 * User Roles Enum
 * Defines all available user roles in the system
 */
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user',
}

/**
 * User Status Enum
 * Defines all available user statuses
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELETED = 'deleted',
}

/**
 * Role hierarchy for permission checks
 * Higher index = more permissions
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 4,
  [UserRole.ADMIN]: 3,
  [UserRole.MANAGER]: 2,
  [UserRole.USER]: 1,
};

/**
 * Password validation constants
 */
export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: true,
  SPECIAL_CHARACTERS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

/**
 * Session constants
 */
export const SESSION_CONSTANTS = {
  MAX_SESSIONS_PER_USER: 5,
  SESSION_TIMEOUT_MINUTES: 30,
};
