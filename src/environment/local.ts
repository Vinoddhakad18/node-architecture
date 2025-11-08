export const environment = {
  env: 'local',
  port: 3000,
  database: {
    host: '<env:DB_HOST>',
    port: '<env:DB_PORT>',
    name: '<env:DB_NAME>',
    username: '<env:DB_USERNAME>',
    password: '<env:DB_PASSWORD>',
  },
  jwt: {
    secret: 'your-local-secret-key',
    expiresIn: '24h',
  },
  cors: {
    origin: 'http://localhost:4200',
  },
  logging: {
    level: 'debug',
  },
};
