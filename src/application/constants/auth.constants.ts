/**
 * Authentication-related Constants
 * Messages and constants for authentication middleware
 */

/**
 * API Key Authentication Messages
 */
export const API_KEY_AUTH = {
  // Warning messages
  WARNING_NO_KEYS_CONFIGURED: 'Warning: No API keys configured in X_API_KEYS environment variable',

  // Log messages
  LOG_MISSING_KEY: 'API Key authentication failed: Missing API Key',
  LOG_INVALID_KEY: 'API Key authentication failed: Invalid API Key provided',
  LOG_SUCCESS: 'API Key authentication successful',

  // Response messages
  RESPONSE_MISSING_KEY: 'Missing API Key',
  RESPONSE_INVALID_KEY: 'Invalid API Key',
} as const;
