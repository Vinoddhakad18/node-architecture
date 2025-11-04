import { Request, Response, NextFunction } from 'express';
import { encryptData, decryptData } from '@utils/encryption';
import logger from '@utils/logger';

/**
 * Request decryption middleware
 * Decrypts encrypted request body
 */
export const requestDecryptMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Check if request body has encrypted data
    if (req.body && req.body.encrypted) {
      try {
        const decrypted = decryptData(req.body.encrypted);
        req.body = decrypted;
        logger.debug('Request body decrypted successfully');
      } catch (error) {
        logger.error('Request decryption error:', error);
        res.status(400).json({
          success: false,
          message: 'Invalid encrypted request data'
        });
        return;
      }
    }

    next();
  } catch (error) {
    logger.error('Request decrypt middleware error:', error);
    next(error);
  }
};

/**
 * Response encryption middleware
 * Encrypts response data before sending
 */
export const responseEncryptMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Check if client requests encrypted response
  const acceptEncrypted = req.headers['x-accept-encrypted'] === 'true';

  if (acceptEncrypted) {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method
    res.json = function (data: any): Response {
      try {
        const encrypted = encryptData(data);
        logger.debug('Response encrypted successfully');

        return originalJson({
          encrypted: true,
          data: encrypted
        });
      } catch (error) {
        logger.error('Response encryption error:', error);
        return originalJson({
          success: false,
          message: 'Failed to encrypt response'
        });
      }
    };
  }

  next();
};

/**
 * Selective encryption middleware
 * Encrypts only sensitive fields in response
 */
export const selectiveEncryptMiddleware = (fieldsToEncrypt: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method
    res.json = function (data: any): Response {
      try {
        if (data && typeof data === 'object') {
          // Encrypt specified fields
          fieldsToEncrypt.forEach((field) => {
            if (data[field]) {
              data[field] = encryptData(data[field]);
            }
          });
        }

        return originalJson(data);
      } catch (error) {
        logger.error('Selective encryption error:', error);
        return originalJson(data);
      }
    };

    next();
  };
};

/**
 * Conditional encryption middleware
 * Encrypts response only for specific routes or conditions
 */
export const conditionalEncryptMiddleware = (condition: (req: Request) => boolean) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (condition(req)) {
      responseEncryptMiddleware(req, res, next);
    } else {
      next();
    }
  };
};
