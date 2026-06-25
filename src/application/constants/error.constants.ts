/**
 * Error-related Constants
 * Error codes and messages
 */

/**
 * Application Error Codes
 * Unique codes for different error types
 */
export enum ErrorCode {
  // Authentication Errors (1000-1099)
  AUTH_INVALID_CREDENTIALS = 'AUTH_1001',
  AUTH_TOKEN_EXPIRED = 'AUTH_1002',
  AUTH_TOKEN_INVALID = 'AUTH_1003',
  AUTH_TOKEN_MISSING = 'AUTH_1004',
  AUTH_REFRESH_TOKEN_EXPIRED = 'AUTH_1005',
  AUTH_REFRESH_TOKEN_INVALID = 'AUTH_1006',
  AUTH_USER_INACTIVE = 'AUTH_1007',
  AUTH_USER_DELETED = 'AUTH_1008',
  AUTH_SESSION_EXPIRED = 'AUTH_1009',

  // Authorization Errors (1100-1199)
  AUTHZ_INSUFFICIENT_PERMISSIONS = 'AUTHZ_1101',
  AUTHZ_RESOURCE_ACCESS_DENIED = 'AUTHZ_1102',
  AUTHZ_ROLE_NOT_ALLOWED = 'AUTHZ_1103',

  // Validation Errors (2000-2099)
  VALIDATION_FAILED = 'VAL_2001',
  VALIDATION_REQUIRED_FIELD = 'VAL_2002',
  VALIDATION_INVALID_FORMAT = 'VAL_2003',
  VALIDATION_INVALID_LENGTH = 'VAL_2004',
  VALIDATION_DUPLICATE_ENTRY = 'VAL_2005',

  // Resource Errors (3000-3099)
  RESOURCE_NOT_FOUND = 'RES_3001',
  RESOURCE_ALREADY_EXISTS = 'RES_3002',
  RESOURCE_CONFLICT = 'RES_3003',
  RESOURCE_LOCKED = 'RES_3004',

  // Database Errors (4000-4099)
  DB_CONNECTION_ERROR = 'DB_4001',
  DB_QUERY_ERROR = 'DB_4002',
  DB_TRANSACTION_ERROR = 'DB_4003',
  DB_CONSTRAINT_VIOLATION = 'DB_4004',

  // File Errors (5000-5099)
  FILE_UPLOAD_ERROR = 'FILE_5001',
  FILE_TOO_LARGE = 'FILE_5002',
  FILE_TYPE_NOT_ALLOWED = 'FILE_5003',
  FILE_NOT_FOUND = 'FILE_5004',
  FILE_STORAGE_ERROR = 'FILE_5005',

  // External Service Errors (6000-6099)
  EXTERNAL_SERVICE_ERROR = 'EXT_6001',
  EXTERNAL_SERVICE_TIMEOUT = 'EXT_6002',
  EXTERNAL_SERVICE_UNAVAILABLE = 'EXT_6003',

  // Rate Limiting Errors (7000-7099)
  RATE_LIMIT_EXCEEDED = 'RATE_7001',

  // Server Errors (9000-9099)
  INTERNAL_ERROR = 'SRV_9001',
  SERVICE_UNAVAILABLE = 'SRV_9002',
  CONFIGURATION_ERROR = 'SRV_9003',
}

/**
 * Error Messages
 * User-friendly error messages
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  // Authentication
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCode.AUTH_TOKEN_EXPIRED]: 'Access token has expired',
  [ErrorCode.AUTH_TOKEN_INVALID]: 'Invalid access token',
  [ErrorCode.AUTH_TOKEN_MISSING]: 'Access token is required',
  [ErrorCode.AUTH_REFRESH_TOKEN_EXPIRED]: 'Refresh token has expired',
  [ErrorCode.AUTH_REFRESH_TOKEN_INVALID]: 'Invalid refresh token',
  [ErrorCode.AUTH_USER_INACTIVE]: 'User account is inactive',
  [ErrorCode.AUTH_USER_DELETED]: 'User account has been deleted',
  [ErrorCode.AUTH_SESSION_EXPIRED]: 'Session has expired',

  // Authorization
  [ErrorCode.AUTHZ_INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions to perform this action',
  [ErrorCode.AUTHZ_RESOURCE_ACCESS_DENIED]: 'Access to this resource is denied',
  [ErrorCode.AUTHZ_ROLE_NOT_ALLOWED]: 'Your role does not allow this action',

  // Validation
  [ErrorCode.VALIDATION_FAILED]: 'Validation failed',
  [ErrorCode.VALIDATION_REQUIRED_FIELD]: 'Required field is missing',
  [ErrorCode.VALIDATION_INVALID_FORMAT]: 'Invalid format',
  [ErrorCode.VALIDATION_INVALID_LENGTH]: 'Invalid length',
  [ErrorCode.VALIDATION_DUPLICATE_ENTRY]: 'Duplicate entry',

  // Resource
  [ErrorCode.RESOURCE_NOT_FOUND]: 'Resource not found',
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: 'Resource already exists',
  [ErrorCode.RESOURCE_CONFLICT]: 'Resource conflict',
  [ErrorCode.RESOURCE_LOCKED]: 'Resource is locked',

  // Database
  [ErrorCode.DB_CONNECTION_ERROR]: 'Database connection error',
  [ErrorCode.DB_QUERY_ERROR]: 'Database query error',
  [ErrorCode.DB_TRANSACTION_ERROR]: 'Database transaction error',
  [ErrorCode.DB_CONSTRAINT_VIOLATION]: 'Database constraint violation',

  // File
  [ErrorCode.FILE_UPLOAD_ERROR]: 'File upload failed',
  [ErrorCode.FILE_TOO_LARGE]: 'File size exceeds limit',
  [ErrorCode.FILE_TYPE_NOT_ALLOWED]: 'File type not allowed',
  [ErrorCode.FILE_NOT_FOUND]: 'File not found',
  [ErrorCode.FILE_STORAGE_ERROR]: 'File storage error',

  // External Service
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'External service error',
  [ErrorCode.EXTERNAL_SERVICE_TIMEOUT]: 'External service timeout',
  [ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE]: 'External service unavailable',

  // Rate Limiting
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests, please try again later',

  // Server
  [ErrorCode.INTERNAL_ERROR]: 'Internal server error',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
  [ErrorCode.CONFIGURATION_ERROR]: 'Configuration error',
};
