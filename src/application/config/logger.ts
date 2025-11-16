import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from '../../config';

/**
 * Winston logger configuration
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, requestId, ...meta }) => {
    let msg = `${timestamp} [${level}]`;
    if (requestId) {
      msg += ` [ReqID: ${requestId}]`;
    }
    msg += `: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

/**
 * Daily rotate file transport configuration for error logs
 */
const errorFileRotateTransport = new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: config.logging.file.datePattern,
  level: 'error',
  maxSize: config.logging.file.maxSize,
  maxFiles: config.logging.file.maxDays,
  format: logFormat,
});

/**
 * Daily rotate file transport configuration for combined logs (all levels)
 */
const combinedFileRotateTransport = new DailyRotateFile({
  filename: 'logs/combined-%DATE%.log',
  datePattern: config.logging.file.datePattern,
  maxSize: config.logging.file.maxSize,
  maxFiles: config.logging.file.maxDays,
  format: logFormat,
});

/**
 * Daily rotate file transport configuration for info logs
 */
const infoFileRotateTransport = new DailyRotateFile({
  filename: 'logs/info-%DATE%.log',
  datePattern: config.logging.file.datePattern,
  level: 'info',
  maxSize: config.logging.file.maxSize,
  maxFiles: config.logging.file.maxDays,
  format: logFormat,
});

/**
 * Daily rotate file transport for exceptions
 */
const exceptionFileRotateTransport = new DailyRotateFile({
  filename: 'logs/exceptions-%DATE%.log',
  datePattern: config.logging.file.datePattern,
  maxSize: config.logging.file.maxSize,
  maxFiles: config.logging.file.maxDays,
  format: logFormat,
});

/**
 * Daily rotate file transport for unhandled rejections
 */
const rejectionFileRotateTransport = new DailyRotateFile({
  filename: 'logs/rejections-%DATE%.log',
  datePattern: config.logging.file.datePattern,
  maxSize: config.logging.file.maxSize,
  maxFiles: config.logging.file.maxDays,
  format: logFormat,
});

/**
 * Build transports array based on configuration
 */
const transports: winston.transport[] = [];

// Add console transport if enabled
if (config.logging.console.enabled) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Add error file transport if enabled
if (config.logging.file.error.enabled) {
  transports.push(errorFileRotateTransport);
}

// Add info file transport if enabled
if (config.logging.file.info.enabled) {
  transports.push(infoFileRotateTransport);
}

// Add combined file transport if enabled
if (config.logging.file.combined.enabled) {
  transports.push(combinedFileRotateTransport);
}

/**
 * Build exception handlers array based on configuration
 */
const exceptionHandlers: winston.transport[] = [];
if (config.logging.exception.enabled) {
  exceptionHandlers.push(exceptionFileRotateTransport);
}

/**
 * Build rejection handlers array based on configuration
 */
const rejectionHandlers: winston.transport[] = [];
if (config.logging.rejection.enabled) {
  rejectionHandlers.push(rejectionFileRotateTransport);
}

/**
 * Create Winston logger instance with conditional transports
 */
export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: {
    service: 'node-architecture',
    pid: process.pid,
  },
  transports,
  exceptionHandlers: exceptionHandlers.length > 0 ? exceptionHandlers : undefined,
  rejectionHandlers: rejectionHandlers.length > 0 ? rejectionHandlers : undefined,
});

/**
 * Stream for Morgan to write to Winston
 */
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

/**
 * Helper function to create a child logger with request ID context
 *
 * @example
 * // In your route handler:
 * const reqLogger = getLoggerWithRequestId(req.requestId);
 * reqLogger.info('User logged in', { userId: user.id });
 *
 * @param requestId - The request ID to include in all logs
 * @returns Winston logger instance with request ID in default metadata
 */
export const getLoggerWithRequestId = (requestId?: string) => {
  if (requestId) {
    return logger.child({ requestId });
  }
  return logger;
};

