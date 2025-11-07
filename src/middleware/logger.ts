import morgan from 'morgan';
import { stream } from '../config/logger';

/**
 * Morgan HTTP request logger middleware with Winston integration
 *
 * Format: ':method :url :status :res[content-length] - :response-time ms'
 * Outputs to Winston logger through stream
 */
export const logger = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  { stream }
);
