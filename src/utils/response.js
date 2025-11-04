/**
 * Response Helper Utilities
 * Standardized API response formatters
 */

/**
 * Send success response
 */
export const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Send error response
 */
export const sendError = (res, message = 'Error', statusCode = 500, errors = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors.length > 0 && { errors })
  });
};

/**
 * Send paginated response
 */
export const sendPaginated = (res, data, page, limit, total) => {
  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    success: true,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  });
};

/**
 * Send created response (201)
 */
export const sendCreated = (res, data, message = 'Resource created successfully') => {
  return sendSuccess(res, data, message, 201);
};

/**
 * Send no content response (204)
 */
export const sendNoContent = (res) => {
  return res.status(204).send();
};

/**
 * Send not found response (404)
 */
export const sendNotFound = (res, message = 'Resource not found') => {
  return sendError(res, message, 404);
};

/**
 * Send bad request response (400)
 */
export const sendBadRequest = (res, message = 'Bad request', errors = []) => {
  return sendError(res, message, 400, errors);
};

/**
 * Send unauthorized response (401)
 */
export const sendUnauthorized = (res, message = 'Unauthorized') => {
  return sendError(res, message, 401);
};

/**
 * Send forbidden response (403)
 */
export const sendForbidden = (res, message = 'Forbidden') => {
  return sendError(res, message, 403);
};

/**
 * Send validation error response (422)
 */
export const sendValidationError = (res, errors = [], message = 'Validation failed') => {
  return res.status(422).json({
    success: false,
    message,
    errors
  });
};

/**
 * Send server error response (500)
 */
export const sendServerError = (res, message = 'Internal server error') => {
  return sendError(res, message, 500);
};

export default {
  sendSuccess,
  sendError,
  sendPaginated,
  sendCreated,
  sendNoContent,
  sendNotFound,
  sendBadRequest,
  sendUnauthorized,
  sendForbidden,
  sendValidationError,
  sendServerError
};
