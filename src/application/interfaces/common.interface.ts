import { Request } from 'express';
import { WhereOptions, Op } from 'sequelize';

/**
 * Common TypeScript Interfaces
 * Shared types used across the application
 */

// ============= Request Types =============

/**
 * Authenticated User attached to request
 */
export interface AuthenticatedUser {
  userId: number;
  email: string;
  role?: string;
}

/**
 * Authenticated Request extending Express Request
 */
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// ============= Sequelize Types =============

/**
 * Generic where clause for Sequelize queries
 */
export type WhereClause<T = Record<string, unknown>> = WhereOptions<T>;

/**
 * ID-based where clause
 */
export interface IdWhereClause {
  id: number | { [Op.ne]: number };
}

/**
 * Status-based where clause
 */
export interface StatusWhereClause {
  status?: 'active' | 'inactive' | string;
}

/**
 * Code-based where clause with optional ID exclusion
 */
export interface CodeWhereClause {
  code: string;
  id?: { [Op.ne]: number };
}

/**
 * Email-based where clause with optional ID exclusion
 */
export interface EmailWhereClause {
  email: string;
  id?: { [Op.ne]: number };
}

/**
 * Mobile-based where clause with optional ID exclusion
 */
export interface MobileWhereClause {
  mobile: string;
  id?: { [Op.ne]: number };
}

// ============= Response Types =============

/**
 * Standard API response data structure
 */
export interface ResponseData<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ValidationError[] | ErrorDetail;
  meta?: ResponseMeta;
}

/**
 * Response metadata for debugging
 */
export interface ResponseMeta {
  timestamp: string;
  path: string;
  method: string;
}

/**
 * Validation error structure
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Error detail structure
 */
export interface ErrorDetail {
  code?: string;
  message?: string;
  stack?: string;
  [key: string]: unknown;
}

// ============= Pagination Types =============

/**
 * Pagination query parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============= File Upload Types =============

/**
 * File metadata structure
 */
export interface FileMetadata {
  originalName?: string;
  mimeType?: string;
  size?: number;
  uploadedBy?: number;
  entityType?: string;
  entityId?: number;
  [key: string]: string | number | boolean | undefined;
}

// ============= Entity Change Tracking =============

/**
 * Change tracking for audit logs
 */
export interface EntityChange<T = unknown> {
  old: T;
  new: T;
}

/**
 * Record of entity changes
 */
export type EntityChanges = Record<string, EntityChange>;

// ============= Database Configuration =============

/**
 * Sequelize database configuration
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  dialect: 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql';
  logging: boolean | ((sql: string) => void);
  pool?: {
    max: number;
    min: number;
    acquire: number;
    idle: number;
  };
  dialectOptions?: {
    ssl?: boolean | {
      require?: boolean;
      rejectUnauthorized?: boolean;
    };
  };
}

// ============= Error Types =============

/**
 * Application error structure
 */
export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

/**
 * Type guard to check if error is an Error instance
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Type guard to check if error has message property
 */
export function hasMessage(error: unknown): error is { message: string } {
  return typeof error === 'object' && error !== null && 'message' in error;
}

/**
 * Get error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (hasMessage(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
}
