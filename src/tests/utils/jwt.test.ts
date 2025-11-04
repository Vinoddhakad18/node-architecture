import {
  generateAccessToken,
  generateRefreshToken,
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken
} from '@utils/jwt';

describe('JWT Utilities', () => {
  const mockPayload = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    role: 'user' as const
  };

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(mockPayload);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(mockPayload);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('generateTokens', () => {
    it('should generate both access and refresh tokens', () => {
      const tokens = generateTokens(mockPayload);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = verifyAccessToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyAccessToken('invalid-token')).toThrow('Invalid or expired access token');
    });

    it('should throw error for empty token', () => {
      expect(() => verifyAccessToken('')).toThrow('Invalid or expired access token');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = generateRefreshToken(mockPayload);
      const decoded = verifyRefreshToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyRefreshToken('invalid-token')).toThrow('Invalid or expired refresh token');
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = decodeToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
    });

    it('should return null for invalid token', () => {
      const decoded = decodeToken('invalid-token');
      expect(decoded).toBeNull();
    });
  });
});
