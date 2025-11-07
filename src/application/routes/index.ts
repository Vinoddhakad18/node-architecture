import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Root API route
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Welcome to MVC API',
    version: '1.0.0',
    endpoints: {},
  });
});

export default router;
