/**
 * Logger Middleware
 * Logs incoming HTTP requests
 */

/**
 * Request logger middleware
 */
export const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.ip || req.connection.remoteAddress;

  // Log request
  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);

  // Log response time
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    console.log(
      `[${timestamp}] ${method} ${url} - Status: ${statusCode} - ${duration}ms`
    );
  });

  next();
};

export default logger;
