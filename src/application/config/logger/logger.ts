import fs from 'fs';
import os from 'os';
import path from 'path';

import pino, {
  Level,
  LoggerOptions,
  StreamEntry,
  multistream
} from 'pino';

import { config } from '@/config';



const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
const logDir = path.join(process.cwd(), 'logs', today);

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const streams: StreamEntry[] = [];

/**
 * Console Logger
 */
if (config.logging.console.enabled) {
  streams.push({
    level: config.logging.level as Level,
    stream: pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        singleLine: true,
      },
    }),
  });
}

/**
 * Combined Log
 */
if (config.logging.file.combined.enabled) {
  streams.push({
    level: config.logging.level as Level,
    stream: pino.destination({
      dest: path.join(logDir, 'combined.log'),
      sync: false,
    }),
  });
}

/**
 * Info Log
 */
if (config.logging.file.info.enabled) {
  streams.push({
    level: 'info',
    stream: pino.destination({
      dest: path.join(logDir, 'info.log'),
      sync: false,
    }),
  });
}

/**
 * Error Log
 */
if (config.logging.file.error.enabled) {
  streams.push({
    level: 'error',
    stream: pino.destination({
      dest: path.join(logDir, 'error.log'),
      sync: false,
    }),
  });
}

const loggerOptions: LoggerOptions = {
  level: config.logging.level as Level,

  base: {
    service: 'node-architecture',
    pid: process.pid,
    hostname: os.hostname(),
  },

  timestamp: pino.stdTimeFunctions.isoTime,

  formatters: {
    level(label) {
      return {
        level: label,
      };
    },
  },

  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },

  redact: {
    paths: [
      'password',
      'confirmPassword',
      'accessToken',
      'refreshToken',
      'authorization',
      'headers.authorization',
      'cookie',
      'headers.cookie',
      'apiKey',
      'secret',
    ],
    remove: true,
  },
};

export const logger = pino(
  loggerOptions,
  multistream(streams)
);

/**
 * Morgan Stream
 */
export const stream = {
  write(message: string) {
    logger.info(message.trim());
  },
};

/**
 * Request Logger
 */
export const getLoggerWithRequestId = (
  requestId?: string
) => {
  return requestId
    ? logger.child({
        requestId,
      })
    : logger;
};

/**
 * Graceful Shutdown
 */
const shutdown = (signal: string) => {
  logger.info(`${signal} received. Closing application.`);

  logger.flush();

  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));

process.on('SIGTERM', () => shutdown('SIGTERM'));

/**
 * Uncaught Exception
 */
process.on('uncaughtException', (err) => {
  logger.fatal(
    {
      err,
    },
    'Uncaught Exception'
  );

  logger.flush();

  process.exit(1);
});

/**
 * Unhandled Rejection
 */
process.on('unhandledRejection', (reason) => {
  logger.fatal(
    {
      err: reason,
    },
    'Unhandled Rejection'
  );

  logger.flush();

  process.exit(1);
});