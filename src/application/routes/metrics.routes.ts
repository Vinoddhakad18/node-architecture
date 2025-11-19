import { Router, Request, Response } from 'express';
import { register } from '../config/metrics';

const router = Router();

/**
 * @swagger
 * /metrics:
 *   get:
 *     summary: Prometheus metrics endpoint
 *     description: Returns metrics in Prometheus format for scraping
 *     tags:
 *       - Monitoring
 *     responses:
 *       200:
 *         description: Metrics in Prometheus format
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.sendServerError('Error collecting metrics', errorMessage);
  }
});

export default router;
