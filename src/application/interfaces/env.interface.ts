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
    refreshSecret?: string;
    refreshExpiresIn?: string;
    issuer?: string;
    audience?: string;
  };
  JWT_SECRET?: string;
  JWT_REFRESH_SECRET?: string;
  JWT_ACCESS_TOKEN_EXPIRY?: string;
  JWT_REFRESH_TOKEN_EXPIRY?: string;
  JWT_ISSUER?: string;
  JWT_AUDIENCE?: string;
  cors: {
    origin: string;
  };
  logging: {
    level: string;
  };
}
