import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import metricsRoutes from './metrics.routes';
import countryMasterRoutes from './country-master.routes';
import fileUploadRoutes from './file-upload.routes';
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
        files: '/files',
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
 * File Upload routes
 */
router.use('/files', fileUploadRoutes);

/**
 * Metrics route (Prometheus endpoint)
 * Conditionally registered based on MONITORING_ENABLED environment variable
 */
if (config.monitoring?.enabled) {
  router.use('/metrics', metricsRoutes);
}

export default router;
