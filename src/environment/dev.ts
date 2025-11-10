export default {
  env: 'development',
  port: 3000,
  apiPrefix: '/api/v1',
  database: {
    host: 'localhost',
    port: 5432,
    name: 'myapp_dev',
    username: 'postgres',
    password: 'postgres',
  },
  jwt: {
    secret: 'your-dev-secret-key',
    expiresIn: '24h',
  },
  cors: {
    origin: '*',
  },
  logging: {
    level: 'debug',
  },
};
