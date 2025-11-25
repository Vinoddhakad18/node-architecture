import { Request, Response, NextFunction } from 'express';
import { logger } from '@config/logger';
import crypto from 'crypto';
import { API_KEY_AUTH } from '../constants';

/**
 * Parse and cache API keys at startup
 * Validates that API keys are configured
 */
const validKeys = new Set<string>(
  (process.env.X_API_KEYS || '')
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean)
);

// Log warning if no API keys are configured
if (validKeys.size === 0) {
  logger.warn(API_KEY_AUTH.WARNING_NO_KEYS_CONFIGURED);
}

/**
 * Constant-time comparison helper to prevent timing attacks
 * Uses crypto.timingSafeEqual for secure comparison
 *
 * @param a - First string to compare
 * @param b - Second string to compare
 * @returns true if strings match, false otherwise
 */
const secureCompare = (a: string, b: string): boolean => {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    // Strings are different lengths or other error occurred
    return false;
  }
};

/**
 * API Key Authentication Middleware
 * Validates incoming API key against configured valid keys
 *
 * Security features:
 * - Constant-time comparison to prevent timing attacks
 * - Keys cached at startup for performance
 * - Graceful handling of missing environment variables
 *
 * @example
 * router.get('/protected', apiKeyAuth, handler);
 */
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
  const incomingKey = req.header('X-API-Key');

  if (!incomingKey) {
    logger.warn(API_KEY_AUTH.LOG_MISSING_KEY);
    res.sendUnauthorized(API_KEY_AUTH.RESPONSE_MISSING_KEY);
    return;
  }

  // Use constant-time comparison to prevent timing attacks
  const isValid = Array.from(validKeys).some((key) => secureCompare(incomingKey, key));

  if (!isValid) {
    logger.warn(API_KEY_AUTH.LOG_INVALID_KEY);
    res.sendForbidden(API_KEY_AUTH.RESPONSE_INVALID_KEY);
    return;
  }

  logger.info(API_KEY_AUTH.LOG_SUCCESS);
  next();
};
