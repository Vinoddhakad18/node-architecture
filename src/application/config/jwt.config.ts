import { config } from '../../config';

/**
 * JWT Configuration
 * Centralizes all JWT-related configuration settings
 */
export const jwtConfig = {
  // JWT Secret Key for signing tokens
  secret: config.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',

  // JWT Refresh Token Secret
  refreshSecret: config.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production',

  // Token expiration times
  accessTokenExpiry: (config.JWT_ACCESS_TOKEN_EXPIRY || '15m') as string, // 15 minutes
  refreshTokenExpiry: (config.JWT_REFRESH_TOKEN_EXPIRY || '7d') as string, // 7 days

  // Token issuer
  issuer: config.JWT_ISSUER || 'node-architecture-app',

  // Token audience
  audience: config.JWT_AUDIENCE || 'node-architecture-users',

  // Algorithm
  algorithm: 'HS256' as 'HS256',
};

/**
 * JWT Token Types
 */
export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
}

/**
 * Validate JWT configuration
 * Ensures all required JWT config values are present
 */
export const validateJwtConfig = (): void => {
  if (!jwtConfig.secret || jwtConfig.secret === 'your-super-secret-jwt-key-change-in-production') {
    console.warn('⚠️  WARNING: Using default JWT secret. Please set JWT_SECRET in environment variables for production!');
  }

  if (!jwtConfig.refreshSecret || jwtConfig.refreshSecret === 'your-super-secret-refresh-key-change-in-production') {
    console.warn('⚠️  WARNING: Using default JWT refresh secret. Please set JWT_REFRESH_SECRET in environment variables for production!');
  }
};
