export default {
  env: 'local',
  port: 3000,
  apiPrefix: '/api/v1',
  database: {
    host: '<env:DB_HOST>',
    port: '<env:DB_PORT>',
    name: '<env:DB_NAME>',
    username: '<env:DB_USERNAME>',
    password: '<env:DB_PASSWORD>',
  },
  jwt: {
    secret: '<env:JWT_SECRET>',
    expiresIn: '15m',
    refreshSecret: '<env:JWT_REFRESH_SECRET>',
    refreshExpiresIn: '7d',
    issuer: 'node-architecture-app',
    audience: 'node-architecture-users',
  },
  cors: {
    origin: 'http://localhost:3000',
  },
  logging: {
    level: 'debug',
  },
};
