/**
 * JWT Token Payload Interface
 * Defines the structure of data encoded in JWT tokens
 */
export interface JwtPayload {
  userId: number;
  email: string;
  role?: string;
  iat?: number; // Issued at
  exp?: number; // Expiration time
}

/**
 * JWT Token Pair Interface
 * Contains both access and refresh tokens
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp (in seconds) when the access token expires
}

/**
 * Decoded JWT Token Interface
 * Extends JwtPayload with additional verification data
 */
export interface DecodedToken extends JwtPayload {
  iat: number;
  exp: number;
}

/**
 * JWT Verification Options
 */
export interface JwtVerifyOptions {
  ignoreExpiration?: boolean;
  audience?: string;
  issuer?: string;
}

/**
 * Authenticated Request User Interface
 * Represents the user object attached to request after authentication
 */
export interface AuthenticatedUser {
  userId: number;
  email: string;
  role?: string;
}
