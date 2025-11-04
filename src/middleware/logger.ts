import { Request, Response, NextFunction } from 'express';

/**
 * Simple logging middleware
 */
export const logger = (req: Request, _res: Response, next: NextFunction): void => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
};
