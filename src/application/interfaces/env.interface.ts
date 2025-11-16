export interface envInterface {
  env: string;
  port: number;
  apiPrefix: string;
  app: {
    name: string;
    version: string;
    env: string;
  };
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
    console: {
      enabled: boolean;
    };
    file: {
      error: {
        enabled: boolean;
      };
      info: {
        enabled: boolean;
      };
      combined: {
        enabled: boolean;
      };
      maxSize: string;
      maxDays: string;
      datePattern: string;
    };
    exception: {
      enabled: boolean;
    };
    rejection: {
      enabled: boolean;
    };
    http: {
      enabled: boolean;
    };
  };
  monitoring: {
    enabled: boolean;
  };
  newRelic: {
    enabled: boolean;
    licenseKey: string;
    appName: string;
    logLevel: string;
    distributedTracingEnabled: boolean;
    loggingEnabled: boolean;
  };
}
