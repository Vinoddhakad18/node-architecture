import { UserResponseDTO } from './user.dto';

/**
 * Login Request DTO
 */
export interface LoginRequestDTO {
  email: string;
  password: string;
}

/**
 * Login Response DTO
 */
export class LoginResponseDTO {
  user: UserResponseDTO;
  tokens: TokenPairDTO;

  constructor(user: UserResponseDTO, tokens: TokenPairDTO) {
    this.user = user;
    this.tokens = tokens;
  }
}

/**
 * Token Pair DTO
 */
export interface TokenPairDTO {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Refresh Token Request DTO
 */
export interface RefreshTokenRequestDTO {
  refreshToken: string;
}

/**
 * Refresh Token Response DTO
 */
export class RefreshTokenResponseDTO {
  tokens: TokenPairDTO;

  constructor(tokens: TokenPairDTO) {
    this.tokens = tokens;
  }
}

/**
 * Register Request DTO
 */
export interface RegisterRequestDTO {
  name: string;
  email: string;
  password: string;
  mobile?: string;
}

/**
 * Change Password Request DTO
 */
export interface ChangePasswordRequestDTO {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Reset Password Request DTO
 */
export interface ResetPasswordRequestDTO {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Forgot Password Request DTO
 */
export interface ForgotPasswordRequestDTO {
  email: string;
}
