export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator'
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.ADMIN]: 3,
  [UserRole.MODERATOR]: 2,
  [UserRole.USER]: 1
};

export const hasHigherRole = (userRole: UserRole, requiredRole: UserRole): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};
