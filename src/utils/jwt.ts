import jwt from 'jsonwebtoken';
import config from '@config/index';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * Generate access token
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn
  });
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn
  });
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokens = (payload: TokenPayload): TokenResponse => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return { accessToken, refreshToken };
};

/**
 * Verify access token
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Decode token without verification (useful for debugging)
 */
export const decodeToken = (token: string): any => {
  return jwt.decode(token);
};
