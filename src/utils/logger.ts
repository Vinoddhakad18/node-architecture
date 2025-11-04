import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import config from '@config/index';
import path from 'path';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format (more readable for development)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaString = '';
    if (Object.keys(meta).length > 0) {
      metaString = '\n' + JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${level}]: ${message}${metaString}`;
  })
);

// Create transports array
const transports: winston.transport[] = [];

// Console transport (for local/dev)
if (config.logging.console) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat
    })
  );
}

// File transports (rotating logs)
if (config.logging.file) {
  const logDirectory = config.logging.directory;

  // Error logs
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDirectory, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat
    })
  );

  // Combined logs
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDirectory, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: logFormat
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports,
  exceptionHandlers: config.logging.file
    ? [
        new DailyRotateFile({
          filename: path.join(config.logging.directory, 'exceptions-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d'
        })
      ]
    : [],
  rejectionHandlers: config.logging.file
    ? [
        new DailyRotateFile({
          filename: path.join(config.logging.directory, 'rejections-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d'
        })
      ]
    : []
});

export default logger;
