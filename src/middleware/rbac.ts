import { Request, Response, NextFunction } from 'express';
import logger from '@utils/logger';

type Role = 'admin' | 'user' | 'moderator';

/**
 * Role-Based Access Control middleware
 * Checks if user has required role(s)
 */
export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Check if user has required role
      if (!allowedRoles.includes(req.user.role)) {
        logger.warn(
          `Access denied for user ${req.user.email} with role ${req.user.role}. Required: ${allowedRoles.join(', ')}`
        );

        res.status(403).json({
          success: false,
          message: 'Insufficient permissions'
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization failed'
      });
    }
  };
};

/**
 * Check if user is admin
 */
export const isAdmin = authorize('admin');

/**
 * Check if user is moderator or admin
 */
export const isModerator = authorize('admin', 'moderator');

/**
 * Permission-based middleware
 * For more granular control
 */
export const checkPermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Permission matrix
      const rolePermissions: Record<Role, string[]> = {
        admin: ['*'], // Admin has all permissions
        moderator: [
          'user:read',
          'user:update',
          'content:read',
          'content:create',
          'content:update',
          'content:delete'
        ],
        user: ['user:read', 'content:read', 'content:create']
      };

      const userPermissions = rolePermissions[req.user.role] || [];

      // Check if user has permission or wildcard
      if (!userPermissions.includes('*') && !userPermissions.includes(permission)) {
        logger.warn(
          `Permission denied for user ${req.user.email}. Required: ${permission}`
        );

        res.status(403).json({
          success: false,
          message: `Permission denied: ${permission}`
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Permission check failed'
      });
    }
  };
};

/**
 * Ownership middleware
 * Checks if user owns the resource or is admin
 */
export const checkOwnership = (getUserIdFromRequest: (req: Request) => string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
        return;
      }

      // Admin can access all resources
      if (req.user.role === 'admin') {
        next();
        return;
      }

      // Check ownership
      const resourceUserId = getUserIdFromRequest(req);
      if (req.user.id !== resourceUserId) {
        logger.warn(
          `Ownership check failed for user ${req.user.email}. Resource belongs to: ${resourceUserId}`
        );

        res.status(403).json({
          success: false,
          message: 'Access denied: You do not own this resource'
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        message: 'Ownership check failed'
      });
    }
  };
};
