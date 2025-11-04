import crypto from 'crypto';
import config from '@config/index';
import logger from '@utils/logger';

/**
 * Encrypt data using AES-256-CBC
 * @param data - Data to encrypt (object or string)
 * @returns Encrypted string in format: iv:encryptedData
 */
export const encryptData = (data: any): string => {
  try {
    // Convert data to JSON string if it's an object
    const text = typeof data === 'string' ? data : JSON.stringify(data);

    // Create cipher
    const cipher = crypto.createCipheriv(
      config.encryption.algorithm,
      Buffer.from(config.encryption.key, 'utf-8'),
      Buffer.from(config.encryption.iv, 'utf-8')
    );

    // Encrypt the data
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return in format: iv:encryptedData
    return `${config.encryption.iv}:${encrypted}`;
  } catch (error) {
    logger.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt data using AES-256-CBC
 * @param encryptedData - Encrypted string in format: iv:encryptedData
 * @returns Decrypted data (parsed as JSON if possible)
 */
export const decryptData = (encryptedData: string): any => {
  try {
    // Split IV and encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted data format');
    }

    const [iv, encrypted] = parts;

    // Create decipher
    const decipher = crypto.createDecipheriv(
      config.encryption.algorithm,
      Buffer.from(config.encryption.key, 'utf-8'),
      Buffer.from(iv, 'utf-8')
    );

    // Decrypt the data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    // Try to parse as JSON, return as-is if not valid JSON
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch (error) {
    logger.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Generate random encryption key (32 bytes for AES-256)
 */
export const generateEncryptionKey = (): string => {
  return crypto.randomBytes(32).toString('utf-8').substring(0, 32);
};

/**
 * Generate random IV (16 bytes)
 */
export const generateIV = (): string => {
  return crypto.randomBytes(16).toString('utf-8').substring(0, 16);
};

/**
 * Hash data using SHA-256
 */
export const hashData = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Create HMAC signature
 */
export const createSignature = (data: string, secret: string): string => {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
};

/**
 * Verify HMAC signature
 */
export const verifySignature = (data: string, signature: string, secret: string): boolean => {
  const expectedSignature = createSignature(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};
