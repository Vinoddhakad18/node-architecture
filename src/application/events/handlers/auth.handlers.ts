import { appEvents } from '../event-emitter';
import { AppEvent, AuthLoginPayload, AuthLoginFailedPayload } from '../event-types';
import { logger } from '@config/logger';

/**
 * Register authentication event handlers
 */
export function registerAuthHandlers(): void {
  // Handle successful login
  appEvents.on(AppEvent.AUTH_LOGIN, async (payload: AuthLoginPayload) => {
    logger.info('User logged in', {
      userId: payload.userId,
      email: payload.email,
      ipAddress: payload.ipAddress,
      timestamp: payload.timestamp,
    });

    // Add any additional login logic here:
    // - Update user's last login timestamp
    // - Send login notification email
    // - Record login in audit log
    // - Invalidate other sessions if needed
  });

  // Handle failed login attempts
  appEvents.on(AppEvent.AUTH_LOGIN_FAILED, async (payload: AuthLoginFailedPayload) => {
    logger.warn('Login attempt failed', {
      email: payload.email,
      reason: payload.reason,
      ipAddress: payload.ipAddress,
      timestamp: payload.timestamp,
    });

    // Add security measures here:
    // - Track failed attempts for rate limiting
    // - Send alert for suspicious activity
    // - Implement account lockout after X attempts
  });

  // Handle logout
  appEvents.on(AppEvent.AUTH_LOGOUT, async (payload) => {
    logger.info('User logged out', {
      userId: payload.userId,
      timestamp: payload.timestamp,
    });

    // Add logout logic here:
    // - Clear user sessions
    // - Invalidate tokens
    // - Record in audit log
  });

  // Handle password change
  appEvents.on(AppEvent.AUTH_PASSWORD_CHANGED, async (payload) => {
    logger.info('User password changed', {
      userId: payload.userId,
      timestamp: payload.timestamp,
    });

    // Add password change logic:
    // - Send notification email
    // - Invalidate all existing sessions
    // - Record in audit log
  });

  // Handle token refresh
  appEvents.on(AppEvent.AUTH_TOKEN_REFRESHED, async (payload) => {
    logger.debug('Token refreshed', {
      userId: payload.userId,
      timestamp: payload.timestamp,
    });
  });
}
