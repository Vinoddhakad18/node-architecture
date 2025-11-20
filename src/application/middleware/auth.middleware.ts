import jwtUtil from '@application/utils/jwt.util';
import { logger } from '@config/logger';
import tokenBlacklistService from '@services/token-blacklist.service';
import { Request, Response, NextFunction } from 'express';

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user information to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.sendUnauthorized('Authorization header missing');
      return;
    }

    // Check if header starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      res.sendUnauthorized('Invalid authorization format. Use: Bearer <token>');
      return;
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      res.sendUnauthorized('Token not provided');
      return;
    }

    // Verify token
    const decoded = jwtUtil.verifyAccessToken(token);

    // Check if token is blacklisted
    const isBlacklisted = await tokenBlacklistService.isBlacklisted(token);
    if (isBlacklisted) {
      logger.warn(`Blacklisted token used by user: ${decoded.email}`);
      res.sendUnauthorized('Token has been revoked');
      return;
    }

    // Check if user's tokens have been invalidated (e.g., password change)
    const isUserInvalidated = await tokenBlacklistService.isTokenInvalidatedByUser(token);
    if (isUserInvalidated) {
      logger.warn(`Invalidated token used by user: ${decoded.email}`);
      res.sendUnauthorized('Token has been invalidated. Please login again.');
      return;
    }

    // Attach user information to request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    // Store token in request for potential logout
    req.token = token;

    logger.info(`Authenticated user: ${decoded.email}`);
    next();
  } catch (error) {
    logger.error('Authentication error:', error);

    if (error instanceof Error) {
      if (error.message === 'Token expired') {
        res.sendUnauthorized('Token expired');
        return;
      }

      if (error.message === 'Invalid token') {
        res.sendUnauthorized('Invalid token');
        return;
      }
    }

    res.sendUnauthorized('Authentication failed');
  }
};

/**
 * Optional Authentication Middleware
 * Attaches user info if token is present, but doesn't fail if missing
 */
export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      next();
      return;
    }

    const token = authHeader.substring(7);

    if (token) {
      const decoded = jwtUtil.verifyAccessToken(token);

      // Check blacklist for optional auth as well
      const isBlacklisted = await tokenBlacklistService.isBlacklisted(token);
      const isUserInvalidated = await tokenBlacklistService.isTokenInvalidatedByUser(token);

      if (!isBlacklisted && !isUserInvalidated) {
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role,
        };
        req.token = token;
      }
    }

    next();
  } catch (error) {
    // Token verification failed, but we continue without user
    logger.warn('Optional authentication failed:', error);
    next();
  }
};

/**
 * Role-Based Authorization Middleware
 * Checks if authenticated user has required role
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.sendUnauthorized('Authentication required');
      return;
    }

    if (!req.user.role || !allowedRoles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt by user: ${req.user.email}`);
      res.sendForbidden('Insufficient permissions');
      return;
    }

    next();
  };
};

/**
 * Check Token Ownership Middleware
 * Verifies that the authenticated user matches the requested userId
 */
export const checkOwnership = (userIdParam = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.sendUnauthorized('Authentication required');
      return;
    }

    const requestedUserId = parseInt(req.params[userIdParam]);

    if (req.user.userId !== requestedUserId) {
      logger.warn(`Ownership check failed for user: ${req.user.email}`);
      res.sendForbidden('You can only access your own resources');
      return;
    }

    next();
  };
};
