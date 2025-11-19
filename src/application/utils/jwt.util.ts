import jwt, { SignOptions } from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import { JwtPayload, TokenPair, DecodedToken, JwtVerifyOptions } from '../interfaces/jwt.interface';
import { logger } from '../config/logger';

/**
 * JWT Utility Class
 * Handles all JWT token operations including generation, verification, and decoding
 */
class JwtUtil {
  /**
   * Generate Access Token
   * Creates a short-lived access token for API authentication
   */
  generateAccessToken(payload: JwtPayload): string {
    try {
      const options: SignOptions = {
        expiresIn: jwtConfig.accessTokenExpiry as SignOptions['expiresIn'],
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
        algorithm: 'HS256',
      };

      const token = jwt.sign(payload, jwtConfig.secret, options);

      logger.info(`Access token generated for user: ${payload.email}`);
      return token;
    } catch (error) {
      logger.error('Error generating access token:', error);
      throw new Error('Failed to generate access token');
    }
  }

  /**
   * Generate Refresh Token
   * Creates a long-lived refresh token for obtaining new access tokens
   */
  generateRefreshToken(payload: JwtPayload): string {
    try {
      const options: SignOptions = {
        expiresIn: jwtConfig.refreshTokenExpiry as SignOptions['expiresIn'],
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
        algorithm: 'HS256',
      };

      const token = jwt.sign(payload, jwtConfig.refreshSecret, options);

      logger.info(`Refresh token generated for user: ${payload.email}`);
      return token;
    } catch (error) {
      logger.error('Error generating refresh token:', error);
      throw new Error('Failed to generate refresh token');
    }
  }

  /**
   * Generate Token Pair
   * Creates both access and refresh tokens
   */
  generateTokenPair(payload: JwtPayload): TokenPair {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    // Extract expiration timestamp
    const decoded = jwt.decode(accessToken) as DecodedToken;
    const expiresAt = decoded.exp!; // Unix timestamp when token expires

    return {
      accessToken,
      refreshToken,
      expiresAt,
    };
  }

  /**
   * Verify Access Token
   * Validates and decodes an access token
   */
  verifyAccessToken(token: string, options?: JwtVerifyOptions): DecodedToken {
    try {
      const decoded = jwt.verify(token, jwtConfig.secret, {
        issuer: options?.issuer || jwtConfig.issuer,
        audience: options?.audience || jwtConfig.audience,
        ignoreExpiration: options?.ignoreExpiration || false,
      }) as DecodedToken;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn('Access token expired');
        throw new Error('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('Invalid access token');
        throw new Error('Invalid token');
      }
      logger.error('Error verifying access token:', error);
      throw new Error('Token verification failed');
    }
  }

  /**
   * Verify Refresh Token
   * Validates and decodes a refresh token
   */
  verifyRefreshToken(token: string, options?: JwtVerifyOptions): DecodedToken {
    try {
      const decoded = jwt.verify(token, jwtConfig.refreshSecret, {
        issuer: options?.issuer || jwtConfig.issuer,
        audience: options?.audience || jwtConfig.audience,
        ignoreExpiration: options?.ignoreExpiration || false,
      }) as DecodedToken;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn('Refresh token expired');
        throw new Error('Refresh token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('Invalid refresh token');
        throw new Error('Invalid refresh token');
      }
      logger.error('Error verifying refresh token:', error);
      throw new Error('Refresh token verification failed');
    }
  }

  /**
   * Decode Token Without Verification
   * Decodes a token without verifying its signature (use with caution)
   */
  decodeToken(token: string): DecodedToken | null {
    try {
      return jwt.decode(token) as DecodedToken;
    } catch (error) {
      logger.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Check if Token is Expired
   * Determines if a token has expired without throwing an error
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return true;
      }

      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Get Token Expiry Time
   * Returns the expiration timestamp of a token
   */
  getTokenExpiry(token: string): number | null {
    try {
      const decoded = this.decodeToken(token);
      return decoded?.exp || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh Access Token
   * Generates a new access token from a valid refresh token
   */
  refreshAccessToken(refreshToken: string): string {
    try {
      const decoded = this.verifyRefreshToken(refreshToken);

      // Create new access token with same payload (excluding iat and exp)
      const payload: JwtPayload = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };

      return this.generateAccessToken(payload);
    } catch (error) {
      logger.error('Error refreshing access token:', error);
      throw error;
    }
  }
}

export default new JwtUtil();
