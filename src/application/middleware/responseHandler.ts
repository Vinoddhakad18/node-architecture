import { Request, Response } from 'express';

/**
 * Response Handler Middleware
 * Provides standardized response methods for all HTTP status codes
 */

interface ResponseData {
  success: boolean;
  message: string;
  data?: any;
  errors?: any;
  meta?: {
    timestamp: string;
    path: string;
    method: string;
  };
}

class ResponseHandler {
  /**
   * Base response method
   */
  private sendResponse(
    req: Request,
    res: Response,
    data: any,
    message: string,
    statusCode: number,
    success: boolean,
    errors?: any
  ): Response {
    const response: ResponseData = {
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
  sendSuccess(req: Request, res: Response, data?: any, message: string = 'Request successful'): Response {
    return this.sendResponse(req, res, data, message, 200, true);
  }

  /**
   * 201 Created - Resource created successfully
   */
  sendCreated(req: Request, res: Response, data?: any, message: string = 'Resource created successfully'): Response {
    return this.sendResponse(req, res, data, message, 201, true);
  }

  /**
   * 202 Accepted - Request accepted for processing
   */
  sendAccepted(req: Request, res: Response, data?: any, message: string = 'Request accepted for processing'): Response {
    return this.sendResponse(req, res, data, message, 202, true);
  }

  /**
   * 204 No Content - Successful request with no content to return
   */
  sendNoContent(req: Request, res: Response): Response {
    return res.status(204).send();
  }

  // ============= CLIENT ERROR RESPONSES (4xx) =============

  /**
   * 400 Bad Request - Invalid request data
   */
  sendBadRequest(req: Request, res: Response, message: string = 'Bad request', errors?: any): Response {
    return this.sendResponse(req, res, null, message, 400, false, errors);
  }

  /**
   * 401 Unauthorized - Authentication required
   */
  sendUnauthorized(req: Request, res: Response, message: string = 'Unauthorized access'): Response {
    return this.sendResponse(req, res, null, message, 401, false);
  }

  /**
   * 403 Forbidden - Insufficient permissions
   */
  sendForbidden(req: Request, res: Response, message: string = 'Access forbidden'): Response {
    return this.sendResponse(req, res, null, message, 403, false);
  }

  /**
   * 404 Not Found - Resource not found
   */
  sendNotFound(req: Request, res: Response, message: string = 'Resource not found'): Response {
    return this.sendResponse(req, res, null, message, 404, false);
  }

  /**
   * 409 Conflict - Request conflicts with current state
   */
  sendConflict(req: Request, res: Response, message: string = 'Resource conflict', errors?: any): Response {
    return this.sendResponse(req, res, null, message, 409, false, errors);
  }

  /**
   * 422 Unprocessable Entity - Validation error
   */
  sendValidationError(req: Request, res: Response, errors: any, message: string = 'Validation failed'): Response {
    return this.sendResponse(req, res, null, message, 422, false, errors);
  }

  /**
   * 429 Too Many Requests - Rate limit exceeded
   */
  sendTooManyRequests(req: Request, res: Response, message: string = 'Too many requests'): Response {
    return this.sendResponse(req, res, null, message, 429, false);
  }

  // ============= SERVER ERROR RESPONSES (5xx) =============

  /**
   * 500 Internal Server Error - Generic server error
   */
  sendServerError(req: Request, res: Response, message: string = 'Internal server error', error?: any): Response {
    const errorDetails = process.env.NODE_ENV === 'development' ? error : undefined;
    return this.sendResponse(req, res, null, message, 500, false, errorDetails);
  }

  /**
   * 501 Not Implemented - Functionality not implemented
   */
  sendNotImplemented(req: Request, res: Response, message: string = 'Not implemented'): Response {
    return this.sendResponse(req, res, null, message, 501, false);
  }

  /**
   * 503 Service Unavailable - Service temporarily unavailable
   */
  sendServiceUnavailable(req: Request, res: Response, message: string = 'Service unavailable'): Response {
    return this.sendResponse(req, res, null, message, 503, false);
  }

  // ============= CUSTOM RESPONSE =============

  /**
   * Send custom response with any status code
   */
  sendCustom(
    req: Request,
    res: Response,
    statusCode: number,
    data: any,
    message: string,
    success: boolean,
    errors?: any
  ): Response {
    return this.sendResponse(req, res, data, message, statusCode, success, errors);
  }
}

// Export singleton instance
export const responseHandler = new ResponseHandler();

// Export as Express middleware to attach methods to res object
export const attachResponseHandlers = (req: Request, res: Response, next: any): void => {
  res.sendSuccess = (data?: any, message?: string) => responseHandler.sendSuccess(req, res, data, message);
  res.sendCreated = (data?: any, message?: string) => responseHandler.sendCreated(req, res, data, message);
  res.sendAccepted = (data?: any, message?: string) => responseHandler.sendAccepted(req, res, data, message);
  res.sendNoContent = () => responseHandler.sendNoContent(req, res);
  res.sendBadRequest = (message?: string, errors?: any) => responseHandler.sendBadRequest(req, res, message, errors);
  res.sendUnauthorized = (message?: string) => responseHandler.sendUnauthorized(req, res, message);
  res.sendForbidden = (message?: string) => responseHandler.sendForbidden(req, res, message);
  res.sendNotFound = (message?: string) => responseHandler.sendNotFound(req, res, message);
  res.sendConflict = (message?: string, errors?: any) => responseHandler.sendConflict(req, res, message, errors);
  res.sendValidationError = (errors: any, message?: string) => responseHandler.sendValidationError(req, res, errors, message);
  res.sendTooManyRequests = (message?: string) => responseHandler.sendTooManyRequests(req, res, message);
  res.sendServerError = (message?: string, error?: any) => responseHandler.sendServerError(req, res, message, error);
  res.sendNotImplemented = (message?: string) => responseHandler.sendNotImplemented(req, res, message);
  res.sendServiceUnavailable = (message?: string) => responseHandler.sendServiceUnavailable(req, res, message);
  res.sendCustom = (statusCode: number, data: any, message: string, success: boolean, errors?: any) =>
    responseHandler.sendCustom(req, res, statusCode, data, message, success, errors);

  next();
};

// Extend Express Response interface
declare global {
  namespace Express {
    interface Response {
      sendSuccess: (data?: any, message?: string) => Response;
      sendCreated: (data?: any, message?: string) => Response;
      sendAccepted: (data?: any, message?: string) => Response;
      sendNoContent: () => Response;
      sendBadRequest: (message?: string, errors?: any) => Response;
      sendUnauthorized: (message?: string) => Response;
      sendForbidden: (message?: string) => Response;
      sendNotFound: (message?: string) => Response;
      sendConflict: (message?: string, errors?: any) => Response;
      sendValidationError: (errors: any, message?: string) => Response;
      sendTooManyRequests: (message?: string) => Response;
      sendServerError: (message?: string, error?: any) => Response;
      sendNotImplemented: (message?: string) => Response;
      sendServiceUnavailable: (message?: string) => Response;
      sendCustom: (statusCode: number, data: any, message: string, success: boolean, errors?: any) => Response;
    }
  }
}
