import { EventEmitter } from 'events';

import { logger } from '@config/logger';

import { AppEvent, EventPayloadMap } from './event-types';

/**
 * Typed Event Emitter
 * Application-wide event bus with type safety
 */
class AppEventEmitter {
  private emitter: EventEmitter;
  private static instance: AppEventEmitter;

  private constructor() {
    this.emitter = new EventEmitter();
    // Increase max listeners for production use
    this.emitter.setMaxListeners(50);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AppEventEmitter {
    if (!AppEventEmitter.instance) {
      AppEventEmitter.instance = new AppEventEmitter();
    }
    return AppEventEmitter.instance;
  }

  /**
   * Emit an event
   */
  public emit<K extends AppEvent>(event: K, payload: EventPayloadMap[K]): boolean {
    logger.debug(`Event emitted: ${event}`, { event, payload });
    return this.emitter.emit(event, payload);
  }

  /**
   * Subscribe to an event
   */
  public on<K extends AppEvent>(
    event: K,
    handler: (payload: EventPayloadMap[K]) => void | Promise<void>
  ): void {
    this.emitter.on(event, async (payload: EventPayloadMap[K]) => {
      try {
        await handler(payload);
      } catch (error) {
        logger.error(`Error in event handler for ${event}:`, error);
      }
    });
    logger.debug(`Event handler registered: ${event}`);
  }

  /**
   * Subscribe to an event once
   */
  public once<K extends AppEvent>(
    event: K,
    handler: (payload: EventPayloadMap[K]) => void | Promise<void>
  ): void {
    this.emitter.once(event, async (payload: EventPayloadMap[K]) => {
      try {
        await handler(payload);
      } catch (error) {
        logger.error(`Error in one-time event handler for ${event}:`, error);
      }
    });
  }

  /**
   * Unsubscribe from an event
   */
  public off<K extends AppEvent>(event: K, handler: (payload: EventPayloadMap[K]) => void): void {
    this.emitter.off(event, handler);
  }

  /**
   * Remove all listeners for an event
   */
  public removeAllListeners(event?: AppEvent): void {
    if (event) {
      this.emitter.removeAllListeners(event);
    } else {
      this.emitter.removeAllListeners();
    }
  }

  /**
   * Get listener count for an event
   */
  public listenerCount(event: AppEvent): number {
    return this.emitter.listenerCount(event);
  }

  /**
   * Get all registered event names
   */
  public eventNames(): (string | symbol)[] {
    return this.emitter.eventNames();
  }
}

// Export singleton instance
export const appEvents = AppEventEmitter.getInstance();
export default appEvents;
