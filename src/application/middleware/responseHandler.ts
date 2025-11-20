import { ValidationError, ErrorDetail, ResponseMeta } from '@interfaces/common.interface';
import { Request, Response, NextFunction } from 'express';

/**
 * Response Handler Middleware
 * Provides standardized response methods for all HTTP status codes
 */

interface ResponseData<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ValidationError[] | ErrorDetail | string;
  meta?: ResponseMeta;
}

class ResponseHandler {
  /**
   * Base response method
   */
  private sendResponse<T = unknown>(
    req: Request,
    res: Response,
    data: T | null,
    message: string,
    statusCode: number,
    success: boolean,
    errors?: ValidationError[] | ErrorDetail | string
  ): Response {
    const response: ResponseData<T> = {
      success,
      message,
    };

    // Add data only if it exists and is not null/undefined
    if (data !== null && data !== undefined) {
      response.data = data;
    }

    // Add errors if they exist
    if (errors) {
      response.errors = errors;
    }

    // Add metadata in development mode
    if (process.env.NODE_ENV === 'development') {
      response.meta = {
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
      };
    }

    return res.status(statusCode).json(response);
  }

  // ============= SUCCESS RESPONSES (2xx) =============

  /**
   * 200 OK - Standard success response
   */
  sendSuccess<T = unknown>(
    req: Request,
    res: Response,
    data?: T,
    message = 'Request successful'
  ): Response {
    return this.sendResponse(req, res, data ?? null, message, 200, true);
  }

  /**
   * 201 Created - Resource created successfully
   */
  sendCreated<T = unknown>(
    req: Request,
    res: Response,
    data?: T,
    message = 'Resource created successfully'
  ): Response {
    return this.sendResponse(req, res, data ?? null, message, 201, true);
  }

  /**
   * 202 Accepted - Request accepted for processing
   */
  sendAccepted<T = unknown>(
    req: Request,
    res: Response,
    data?: T,
    message = 'Request accepted for processing'
  ): Response {
    return this.sendResponse(req, res, data ?? null, message, 202, true);
  }

  /**
   * 204 No Content - Successful request with no content to return
   */
  sendNoContent(_req: Request, res: Response): Response {
    return res.status(204).send();
  }

  // ============= CLIENT ERROR RESPONSES (4xx) =============

  /**
   * 400 Bad Request - Invalid request data
   */
  sendBadRequest(
    req: Request,
    res: Response,
    message = 'Bad request',
    errors?: ValidationError[] | ErrorDetail | string
  ): Response {
    return this.sendResponse(req, res, null, message, 400, false, errors);
  }

  /**
   * 401 Unauthorized - Authentication required
   */
  sendUnauthorized(req: Request, res: Response, message = 'Unauthorized access'): Response {
    return this.sendResponse(req, res, null, message, 401, false);
  }

  /**
   * 403 Forbidden - Insufficient permissions
   */
  sendForbidden(req: Request, res: Response, message = 'Access forbidden'): Response {
    return this.sendResponse(req, res, null, message, 403, false);
  }

  /**
   * 404 Not Found - Resource not found
   */
  sendNotFound(req: Request, res: Response, message = 'Resource not found'): Response {
    return this.sendResponse(req, res, null, message, 404, false);
  }

  /**
   * 409 Conflict - Request conflicts with current state
   */
  sendConflict(
    req: Request,
    res: Response,
    message = 'Resource conflict',
    errors?: ValidationError[] | ErrorDetail | string
  ): Response {
    return this.sendResponse(req, res, null, message, 409, false, errors);
  }

  /**
   * 422 Unprocessable Entity - Validation error
   */
  sendValidationError(
    req: Request,
    res: Response,
    errors: ValidationError[] | ErrorDetail | string,
    message = 'Validation failed'
  ): Response {
    return this.sendResponse(req, res, null, message, 422, false, errors);
  }

  /**
   * 429 Too Many Requests - Rate limit exceeded
   */
  sendTooManyRequests(req: Request, res: Response, message = 'Too many requests'): Response {
    return this.sendResponse(req, res, null, message, 429, false);
  }

  // ============= SERVER ERROR RESPONSES (5xx) =============

  /**
   * 500 Internal Server Error - Generic server error
   */
  sendServerError(
    req: Request,
    res: Response,
    message = 'Internal server error',
    error?: ErrorDetail | string
  ): Response {
    const errorDetails = process.env.NODE_ENV === 'development' ? error : undefined;
    return this.sendResponse(req, res, null, message, 500, false, errorDetails);
  }

  /**
   * 501 Not Implemented - Functionality not implemented
   */
  sendNotImplemented(req: Request, res: Response, message = 'Not implemented'): Response {
    return this.sendResponse(req, res, null, message, 501, false);
  }

  /**
   * 503 Service Unavailable - Service temporarily unavailable
   */
  sendServiceUnavailable(req: Request, res: Response, message = 'Service unavailable'): Response {
    return this.sendResponse(req, res, null, message, 503, false);
  }

  // ============= CUSTOM RESPONSE =============

  /**
   * Send custom response with any status code
   */
  sendCustom<T = unknown>(
    req: Request,
    res: Response,
    statusCode: number,
    data: T | null,
    message: string,
    success: boolean,
    errors?: ValidationError[] | ErrorDetail | string
  ): Response {
    return this.sendResponse(req, res, data, message, statusCode, success, errors);
  }
}

// Export singleton instance
export const responseHandler = new ResponseHandler();

// Export as Express middleware to attach methods to res object
export const attachResponseHandlers = (req: Request, res: Response, next: NextFunction): void => {
  res.sendSuccess = <T = unknown>(data?: T, message?: string) =>
    responseHandler.sendSuccess(req, res, data, message);
  res.sendCreated = <T = unknown>(data?: T, message?: string) =>
    responseHandler.sendCreated(req, res, data, message);
  res.sendAccepted = <T = unknown>(data?: T, message?: string) =>
    responseHandler.sendAccepted(req, res, data, message);
  res.sendNoContent = () => responseHandler.sendNoContent(req, res);
  res.sendBadRequest = (message?: string, errors?: ValidationError[] | ErrorDetail | string) =>
    responseHandler.sendBadRequest(req, res, message, errors);
  res.sendUnauthorized = (message?: string) => responseHandler.sendUnauthorized(req, res, message);
  res.sendForbidden = (message?: string) => responseHandler.sendForbidden(req, res, message);
  res.sendNotFound = (message?: string) => responseHandler.sendNotFound(req, res, message);
  res.sendConflict = (message?: string, errors?: ValidationError[] | ErrorDetail | string) =>
    responseHandler.sendConflict(req, res, message, errors);
  res.sendValidationError = (errors: ValidationError[] | ErrorDetail | string, message?: string) =>
    responseHandler.sendValidationError(req, res, errors, message);
  res.sendTooManyRequests = (message?: string) =>
    responseHandler.sendTooManyRequests(req, res, message);
  res.sendServerError = (message?: string, error?: ErrorDetail | string) =>
    responseHandler.sendServerError(req, res, message, error);
  res.sendNotImplemented = (message?: string) =>
    responseHandler.sendNotImplemented(req, res, message);
  res.sendServiceUnavailable = (message?: string) =>
    responseHandler.sendServiceUnavailable(req, res, message);
  res.sendCustom = <T = unknown>(
    statusCode: number,
    data: T | null,
    message: string,
    success: boolean,
    errors?: ValidationError[] | ErrorDetail | string
  ) => responseHandler.sendCustom(req, res, statusCode, data, message, success, errors);

  next();
};

// Extend Express Response interface
declare global {
  namespace Express {
    interface Response {
      sendSuccess: <T = unknown>(data?: T, message?: string) => Response;
      sendCreated: <T = unknown>(data?: T, message?: string) => Response;
      sendAccepted: <T = unknown>(data?: T, message?: string) => Response;
      sendNoContent: () => Response;
      sendBadRequest: (
        message?: string,
        errors?: ValidationError[] | ErrorDetail | string
      ) => Response;
      sendUnauthorized: (message?: string) => Response;
      sendForbidden: (message?: string) => Response;
      sendNotFound: (message?: string) => Response;
      sendConflict: (
        message?: string,
        errors?: ValidationError[] | ErrorDetail | string
      ) => Response;
      sendValidationError: (
        errors: ValidationError[] | ErrorDetail | string,
        message?: string
      ) => Response;
      sendTooManyRequests: (message?: string) => Response;
      sendServerError: (message?: string, error?: ErrorDetail | string) => Response;
      sendNotImplemented: (message?: string) => Response;
      sendServiceUnavailable: (message?: string) => Response;
      sendCustom: <T = unknown>(
        statusCode: number,
        data: T | null,
        message: string,
        success: boolean,
        errors?: ValidationError[] | ErrorDetail | string
      ) => Response;
    }
  }
}
