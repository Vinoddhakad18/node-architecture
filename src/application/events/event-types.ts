/**
 * Event Types
 * Define all application events
 */

/**
 * Application Event Names
 */
export enum AppEvent {
  // User Events
  USER_CREATED = 'user:created',
  USER_UPDATED = 'user:updated',
  USER_DELETED = 'user:deleted',
  USER_ACTIVATED = 'user:activated',
  USER_DEACTIVATED = 'user:deactivated',

  // Authentication Events
  AUTH_LOGIN = 'auth:login',
  AUTH_LOGOUT = 'auth:logout',
  AUTH_LOGIN_FAILED = 'auth:login:failed',
  AUTH_PASSWORD_CHANGED = 'auth:password:changed',
  AUTH_PASSWORD_RESET = 'auth:password:reset',
  AUTH_TOKEN_REFRESHED = 'auth:token:refreshed',

  // Country Events
  COUNTRY_CREATED = 'country:created',
  COUNTRY_UPDATED = 'country:updated',
  COUNTRY_DELETED = 'country:deleted',

  // File Events
  FILE_UPLOADED = 'file:uploaded',
  FILE_DELETED = 'file:deleted',

  // Cache Events
  CACHE_CLEARED = 'cache:cleared',
  CACHE_INVALIDATED = 'cache:invalidated',

  // System Events
  SYSTEM_STARTUP = 'system:startup',
  SYSTEM_SHUTDOWN = 'system:shutdown',
  SYSTEM_ERROR = 'system:error',
}

/**
 * Base Event Payload
 */
export interface BaseEventPayload {
  timestamp: Date;
  requestId?: string;
  userId?: number;
}

/**
 * User Event Payloads
 */
export interface UserCreatedPayload extends BaseEventPayload {
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

export interface UserUpdatedPayload extends BaseEventPayload {
  userId: number;
  changes: Record<string, { old: unknown; new: unknown }>;
}

export interface UserDeletedPayload extends BaseEventPayload {
  userId: number;
  deletedBy?: number;
}

/**
 * Authentication Event Payloads
 */
export interface AuthLoginPayload extends BaseEventPayload {
  userId: number;
  email: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthLogoutPayload extends BaseEventPayload {
  userId: number;
}

export interface AuthLoginFailedPayload extends BaseEventPayload {
  email: string;
  reason: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Country Event Payloads
 */
export interface CountryCreatedPayload extends BaseEventPayload {
  country: {
    id: number;
    name: string;
    code: string;
  };
}

export interface CountryUpdatedPayload extends BaseEventPayload {
  countryId: number;
  changes: Record<string, { old: unknown; new: unknown }>;
}

export interface CountryDeletedPayload extends BaseEventPayload {
  countryId: number;
  deletedBy?: number;
}

/**
 * File Event Payloads
 */
export interface FileUploadedPayload extends BaseEventPayload {
  fileId: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy?: number;
}

export interface FileDeletedPayload extends BaseEventPayload {
  fileId: number;
  deletedBy?: number;
}

/**
 * Cache Event Payloads
 */
export interface CacheInvalidatedPayload extends BaseEventPayload {
  keys: string[];
  reason: string;
}

/**
 * System Event Payloads
 */
export interface SystemErrorPayload extends BaseEventPayload {
  error: Error;
  context?: Record<string, unknown>;
}

/**
 * Event Payload Map
 * Maps event names to their payload types
 */
export interface EventPayloadMap {
  [AppEvent.USER_CREATED]: UserCreatedPayload;
  [AppEvent.USER_UPDATED]: UserUpdatedPayload;
  [AppEvent.USER_DELETED]: UserDeletedPayload;
  [AppEvent.USER_ACTIVATED]: UserUpdatedPayload;
  [AppEvent.USER_DEACTIVATED]: UserUpdatedPayload;
  [AppEvent.AUTH_LOGIN]: AuthLoginPayload;
  [AppEvent.AUTH_LOGOUT]: AuthLogoutPayload;
  [AppEvent.AUTH_LOGIN_FAILED]: AuthLoginFailedPayload;
  [AppEvent.AUTH_PASSWORD_CHANGED]: BaseEventPayload;
  [AppEvent.AUTH_PASSWORD_RESET]: BaseEventPayload;
  [AppEvent.AUTH_TOKEN_REFRESHED]: BaseEventPayload;
  [AppEvent.COUNTRY_CREATED]: CountryCreatedPayload;
  [AppEvent.COUNTRY_UPDATED]: CountryUpdatedPayload;
  [AppEvent.COUNTRY_DELETED]: CountryDeletedPayload;
  [AppEvent.FILE_UPLOADED]: FileUploadedPayload;
  [AppEvent.FILE_DELETED]: FileDeletedPayload;
  [AppEvent.CACHE_CLEARED]: BaseEventPayload;
  [AppEvent.CACHE_INVALIDATED]: CacheInvalidatedPayload;
  [AppEvent.SYSTEM_STARTUP]: BaseEventPayload;
  [AppEvent.SYSTEM_SHUTDOWN]: BaseEventPayload;
  [AppEvent.SYSTEM_ERROR]: SystemErrorPayload;
}
