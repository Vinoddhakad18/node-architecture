import { Router, Request, Response } from 'express';
import userRoutes from './userRoutes';

const router = Router();

/**
 * Root API route
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Welcome to MVC API',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
    },
  });
});

/**
 * Mount route modules
 */
router.use('/users', userRoutes);

export default router;
