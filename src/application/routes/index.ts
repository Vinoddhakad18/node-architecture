import { Router, Request, Response } from 'express';

import authRoutes from './auth.routes';
import branchMasterRoutes from './branch-master.routes';
import userRoutes from './user.routes';
import countryMasterRoutes from './country-master.routes';
import fileUploadRoutes from './file-upload.routes';
import menuRoutes from './menu.routes';
import metricsRoutes from './metrics.routes';
import permissionRoutes from './permission.routes';
import roleRoutes from './role.routes';
// HYGEN_IMPORTS
import categoryRoutes from './category/category.route';

import { config } from '@/config';

const router = Router();

/**
 * Root API route
 */
router.get('/', (_req: Request, res: Response) => {
  res.sendSuccess(
    {
      version: '1.0.0',
      endpoints: {
        auth: '/auth',
        countries: '/countries',
        branches: '/branches',
        users: '/users',
        files: '/files',
        menus: '/menus',
        permissions: '/permissions',
        roles: '/roles',
        // HYGEN_ENDPOINTS
        category: '/category',
      
      },
    },
    'Welcome to MVC API'
  );
});

/**
 * Authentication routes
 */
router.use('/auth', authRoutes);

/**
 * Country Master routes
 */
router.use('/countries', countryMasterRoutes);

/**
 * Branch Master routes
 */
router.use('/branches', branchMasterRoutes);
/**
 * User routes
 */
router.use('/users', userRoutes);

/**
 * File Upload routes
 */
router.use('/files', fileUploadRoutes);

/**
 * Menu routes
 */
router.use('/menus', menuRoutes);

/**
 * Permission routes
 */
router.use('/permissions', permissionRoutes);

/**
 * Role routes
 */
router.use('/roles', roleRoutes);

// HYGEN_ROUTES_USE
router.use(
  '/categorys',
  categoryRoutes
);


/**
 * Metrics route (Prometheus endpoint)
 * Conditionally registered based on MONITORING_ENABLED environment variable
 */
if (config.monitoring?.enabled) {
  router.use('/metrics', metricsRoutes);
}

export default router;
