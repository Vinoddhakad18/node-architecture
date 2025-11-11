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
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
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
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '14d', // Keep logs for 14 days
  format: logFormat,
});

/**
 * Daily rotate file transport configuration for combined logs (all levels)
 */
const combinedFileRotateTransport = new DailyRotateFile({
  filename: 'logs/combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d', // Keep logs for 14 days
  format: logFormat,
});

/**
 * Daily rotate file transport configuration for info logs
 */
const infoFileRotateTransport = new DailyRotateFile({
  filename: 'logs/info-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'info',
  maxSize: '20m',
  maxFiles: '14d', // Keep logs for 14 days
  format: logFormat,
});

/**
 * Daily rotate file transport for exceptions
 */
const exceptionFileRotateTransport = new DailyRotateFile({
  filename: 'logs/exceptions-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat,
});

/**
 * Daily rotate file transport for unhandled rejections
 */
const rejectionFileRotateTransport = new DailyRotateFile({
  filename: 'logs/rejections-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat,
});

/**
 * Create Winston logger instance
 */
export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: {
    service: 'node-architecture',
    pid: process.pid,
  },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // Daily rotating file transports
    errorFileRotateTransport,
    infoFileRotateTransport,
    combinedFileRotateTransport,
  ],
  exceptionHandlers: [
    exceptionFileRotateTransport,
  ],
  rejectionHandlers: [
    rejectionFileRotateTransport,
  ],
});

/**
 * Stream for Morgan to write to Winston
 */
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
