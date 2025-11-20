/**
 * Event Handlers Index
 * Register all event handlers
 */

export * from './auth.handlers';
export * from './user.handlers';

import { logger } from '@config/logger';

import { registerAuthHandlers } from './auth.handlers';
import { registerUserHandlers } from './user.handlers';

/**
 * Initialize all event handlers
 * Call this during application startup
 */
export function initializeEventHandlers(): void {
  logger.info('Initializing event handlers...');

  registerAuthHandlers();
  registerUserHandlers();

  logger.info('Event handlers initialized successfully');
}
