/**
 * Application Configuration
 * Central configuration for the application
 */

export const appConfig = {
  // Server settings
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || 'development',

  // App info
  name: process.env.APP_NAME || 'Node.js MVC Architecture',
  url: process.env.APP_URL || 'http://localhost:3000',

  // JWT settings (for future authentication)
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiry: process.env.JWT_EXPIRE || '30d'
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // CORS settings
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  }
};

export default appConfig;
