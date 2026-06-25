import { config } from '../../../config';
import { logger } from '../../config/logger';
import { StorageProvider } from '../../interfaces/StorageProvider.interface';

import { LocalStorageProvider, LocalStorageConfig } from './LocalStorageProvider';
import { S3StorageProvider, S3StorageConfig } from './S3StorageProvider';

export type StorageType = 's3' | 'local';

let storageInstance: StorageProvider | null = null;

/**
 * Get the storage provider instance (singleton)
 */
export function getStorageProvider(): StorageProvider {
  if (storageInstance) {
    return storageInstance;
  }

  const storageType = (config.storage?.type || 'local') as StorageType;

  switch (storageType) {
    case 's3':
      storageInstance = createS3Provider();
      break;
    case 'local':
    default:
      storageInstance = createLocalProvider();
      break;
  }

  return storageInstance;
}

/**
 * Create an S3 storage provider
 */
function createS3Provider(): S3StorageProvider {
  const s3Config: S3StorageConfig = {
    region: config.storage?.s3?.region || 'us-east-1',
    bucket: config.storage?.s3?.bucket || '',
    accessKeyId: config.storage?.s3?.accessKeyId || '',
    secretAccessKey: config.storage?.s3?.secretAccessKey || '',
    endpoint: config.storage?.s3?.endpoint,
    forcePathStyle: config.storage?.s3?.forcePathStyle,
  };

  if (!s3Config.bucket || !s3Config.accessKeyId || !s3Config.secretAccessKey) {
    throw new Error(
      'S3 storage configuration is incomplete. Please provide bucket, accessKeyId, and secretAccessKey.'
    );
  }

  logger.info('Using S3 storage provider', {
    bucket: s3Config.bucket,
    region: s3Config.region,
  });

  return new S3StorageProvider(s3Config);
}

/**
 * Create a local storage provider
 */
function createLocalProvider(): LocalStorageProvider {
  const localConfig: LocalStorageConfig = {
    basePath: config.storage?.local?.basePath || './uploads',
    baseUrl: config.storage?.local?.baseUrl || 'http://localhost:3000/uploads',
  };

  logger.info('Using local storage provider', {
    basePath: localConfig.basePath,
  });

  return new LocalStorageProvider(localConfig);
}

/**
 * Reset the storage instance (useful for testing)
 */
export function resetStorageProvider(): void {
  storageInstance = null;
}

export { StorageProvider } from '../../interfaces/StorageProvider.interface';
