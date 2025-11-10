import { Router, Request, Response } from 'express';
import { authenticate, authorize, checkOwnership } from '../middleware/auth.middleware';

const router = Router();

/**
 * Example: Public route (no authentication required)
 */
router.get('/public', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'This is a public endpoint',
    data: {
      info: 'Anyone can access this endpoint',
    },
  });
});

/**
 * Example: Protected route (authentication required)
 * User must provide a valid access token
 */
router.get('/protected', authenticate, (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'This is a protected endpoint',
    data: {
      user: req.user,
      info: 'You must be authenticated to access this endpoint',
    },
  });
});

/**
 * Example: Admin only route
 * User must be authenticated and have 'admin' role
 */
router.get('/admin-only', authenticate, authorize('admin'), (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Admin endpoint accessed',
    data: {
      user: req.user,
      info: 'Only admins can access this endpoint',
    },
  });
});

/**
 * Example: Multiple roles allowed
 * User must be authenticated and have 'admin' or 'moderator' role
 */
router.post(
  '/moderation',
  authenticate,
  authorize('admin', 'moderator'),
  (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Moderation action successful',
      data: {
        user: req.user,
        info: 'Admins and moderators can access this endpoint',
      },
    });
  }
);

/**
 * Example: Ownership validation
 * User can only access their own profile
 * The userId parameter in the URL must match the authenticated user's ID
 */
router.get(
  '/users/:userId/profile',
  authenticate,
  checkOwnership('userId'),
  (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'User profile retrieved',
      data: {
        userId: req.params.userId,
        user: req.user,
        info: 'You can only access your own profile',
      },
    });
  }
);

/**
 * Example: Admin can access any user, owner can access their own
 * Combines role check with ownership validation
 */
router.put('/users/:userId/settings', authenticate, (req: Request, res: Response) => {
  const requestedUserId = parseInt(req.params.userId);
  const isOwner = req.user?.userId === requestedUserId;
  const isAdmin = req.user?.role === 'admin';

  if (!isOwner && !isAdmin) {
    res.status(403).json({
      success: false,
      message: 'Access denied. You can only modify your own settings or be an admin.',
    });
    return;
  }

  res.json({
    success: true,
    message: 'Settings updated',
    data: {
      userId: requestedUserId,
      updatedBy: req.user,
      info: 'Owners can update their own settings, admins can update any user settings',
    },
  });
});

export default router;
