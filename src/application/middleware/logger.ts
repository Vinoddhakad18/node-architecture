import pinoHttp from 'pino-http';
import { Request } from 'express';

import { logger } from '@config/logger';

import { config } from '@/config';

export const httpLogger = pinoHttp({
  logger,

  enabled: config.logging.http.enabled,

  genReqId(req) {
    return (
      (req.headers['x-request-id'] as string) ||
      (req as Request).requestId ||
      crypto.randomUUID()
    );
  },

  customProps(req) {
    return {
      requestId: (req as Request).requestId,
    };
  },

  customLogLevel(_req, res, err) {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },

  autoLogging: {
    ignore(req) {
      return (
        req.url === '/health' ||
        req.url === '/favicon.ico'
      );
    },
  },

  serializers: {
    req(req) {
      const body =
        req.body && typeof req.body === 'object'
          ? sanitizeBody(req.body)
          : undefined;

      return {
        id: (req as Request).requestId,
        method: req.method,
        url: req.url,
        ip:
          req?.headers['x-forwarded-for'] ||
          req?.headers['x-real-ip'] ||
          req?.socket?.remoteAddress,
        userAgent: req?.headers['user-agent'],
        body,
      };
    },

    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },
});

function sanitizeBody(body: Record<string, unknown>) {
  const clone = { ...body };

  const fields = [
    'password',
    'confirmPassword',
    'token',
    'accessToken',
    'refreshToken',
    'authorization',
    'apiKey',
    'secret',
  ];

  for (const field of fields) {
    if (field in clone) {
      clone[field] = '***';
    }
  }

  return clone;
}