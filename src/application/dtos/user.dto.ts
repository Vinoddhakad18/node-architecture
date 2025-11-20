import { UserRole, UserStatus } from '@application/constants';
import { UserMasterAttributes } from '@models/user-master.model';

/**
 * User Response DTO
 * Transforms user model to API response format
 */
export class UserResponseDTO {
  id: number;
  name: string;
  email: string;
  mobile: string | null;
  role: UserRole;
  status: UserStatus;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(user: Omit<UserMasterAttributes, 'password'>) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.mobile = user.mobile;
    this.role = user.role as UserRole;
    this.status = user.status as UserStatus;
    this.lastLogin = user.last_login;
    this.createdAt = user.created_at;
    this.updatedAt = user.updated_at;
  }

  /**
   * Create DTO from user model
   */
  static fromModel(user: Omit<UserMasterAttributes, 'password'>): UserResponseDTO {
    return new UserResponseDTO(user);
  }

  /**
   * Create array of DTOs from user models
   */
  static fromModels(users: Omit<UserMasterAttributes, 'password'>[]): UserResponseDTO[] {
    return users.map((user) => UserResponseDTO.fromModel(user));
  }
}

/**
 * User Summary DTO
 * Minimal user information for listings
 */
export class UserSummaryDTO {
  id: number;
  name: string;
  email: string;
  role: UserRole;

  constructor(user: Omit<UserMasterAttributes, 'password'>) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role as UserRole;
  }

  static fromModel(user: Omit<UserMasterAttributes, 'password'>): UserSummaryDTO {
    return new UserSummaryDTO(user);
  }
}

/**
 * Create User Request DTO
 */
export interface CreateUserRequestDTO {
  name: string;
  email: string;
  password: string;
  mobile?: string;
  role?: UserRole;
}

/**
 * Update User Request DTO
 */
export interface UpdateUserRequestDTO {
  name?: string;
  email?: string;
  mobile?: string;
  role?: UserRole;
  status?: UserStatus;
}
