export default {
  env: 'production',
  port: process.env.PORT || 3000,
  apiPrefix: '/api',
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'myapp_prod',
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-production-secret-key',
    expiresIn: '1h',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'https://yourapp.com',
  },
  logging: {
    level: 'error',
  },
};
