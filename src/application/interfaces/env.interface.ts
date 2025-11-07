export interface envInterface {
  env: string;
  port: number;
  apiPrefix: string;
  database: {
    host: string;
    port: number;
    name: string;
    username: string;
    password: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  cors: {
    origin: string;
  };
  logging: {
    level: string;
  };
}
