export const environment = {
  env: 'local',
  port: 3000,
  database: {
    host: 'localhost',
    port: 5432,
    name: 'myapp_local',
    username: 'postgres',
    password: 'postgres',
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
