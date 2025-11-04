import jwt, { SignOptions } from 'jsonwebtoken';
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
  const options: SignOptions = {
    expiresIn: "30m",
  };
  return jwt.sign(payload, config.jwt.accessSecret, options);
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: "30m",
  };
  return jwt.sign(payload, config.jwt.refreshSecret, options);
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
  } catch {
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
  } catch {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Decode token without verification
 */
export const decodeToken = (token: string): any => jwt.decode(token);
