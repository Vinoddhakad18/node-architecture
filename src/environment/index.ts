import { environment as localEnv } from './local';
import { environment as devEnv } from './dev';
import { environment as prodEnv } from './prod';

const env = process.env.NODE_ENV || 'local';

let config;

switch (env) {
  case 'production':
  case 'prod':
    config = prodEnv;
    break;
  case 'development':
  case 'dev':
    config = devEnv;
    break;
  case 'local':
  default:
    config = localEnv;
    break;
}

export const environment = config;
