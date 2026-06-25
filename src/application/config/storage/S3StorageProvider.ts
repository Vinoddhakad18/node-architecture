import { Readable } from 'stream';

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { logger } from '../../config/logger';
import {
  StorageProvider,
  UploadOptions,
  UploadResult,
  DownloadResult,
  FileInfo,
  PresignedUrlOptions,
} from '../../interfaces/StorageProvider.interface';

export interface S3StorageConfig {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string; // For S3-compatible services like MinIO
  forcePathStyle?: boolean; // Required for MinIO
}

export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private region: string;
  private endpoint?: string;

  constructor(config: S3StorageConfig) {
    this.bucket = config.bucket;
    this.region = config.region;
    this.endpoint = config.endpoint;

    this.client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      ...(config.endpoint && {
        endpoint: config.endpoint,
        forcePathStyle: config.forcePathStyle ?? true,
      }),
    });

    logger.info('S3StorageProvider initialized', {
      bucket: this.bucket,
      region: this.region,
      endpoint: this.endpoint || 'AWS S3',
    });
  }

  async upload(
    key: string,
    body: Buffer | Readable | string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: body,
      ContentType: options?.contentType,
      Metadata: options?.metadata,
      ACL: options?.acl,
    });

    const result = await this.client.send(command);

    const url = this.getPublicUrl(key);

    logger.info('File uploaded to S3', { key, bucket: this.bucket });

    return {
      key,
      url,
      bucket: this.bucket,
      etag: result.ETag?.replace(/"/g, ''),
    };
  }

  async download(key: string): Promise<DownloadResult> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const result = await this.client.send(command);

    return {
      body: result.Body as Readable,
      contentType: result.ContentType,
      contentLength: result.ContentLength,
      metadata: result.Metadata,
    };
  }

  async delete(key: string): Promise<boolean> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
    logger.info('File deleted from S3', { key, bucket: this.bucket });

    return true;
  }

  async deleteMany(keys: string[]): Promise<{ deleted: string[]; errors: string[] }> {
    if (keys.length === 0) {
      return { deleted: [], errors: [] };
    }

    const command = new DeleteObjectsCommand({
      Bucket: this.bucket,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
        Quiet: false,
      },
    });

    const result = await this.client.send(command);

    const deleted = result.Deleted?.map((d) => d.Key || '') || [];
    const errors = result.Errors?.map((e) => e.Key || '') || [];

    logger.info('Multiple files deleted from S3', {
      deleted: deleted.length,
      errors: errors.length,
    });

    return { deleted, errors };
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.getInfo(key);
      return true;
    } catch {
      return false;
    }
  }

  async getInfo(key: string): Promise<FileInfo | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const result = await this.client.send(command);

      return {
        key,
        size: result.ContentLength || 0,
        lastModified: result.LastModified || new Date(),
        contentType: result.ContentType,
        etag: result.ETag?.replace(/"/g, ''),
      };
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }

  async getPresignedUploadUrl(key: string, options?: PresignedUrlOptions): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: options?.contentType,
    });

    return getSignedUrl(this.client, command, {
      expiresIn: options?.expiresIn || 3600,
    });
  }

  async list(prefix?: string, maxKeys = 1000): Promise<FileInfo[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
      MaxKeys: maxKeys,
    });

    const result = await this.client.send(command);

    return (result.Contents || []).map((item) => ({
      key: item.Key || '',
      size: item.Size || 0,
      lastModified: item.LastModified || new Date(),
      etag: item.ETag?.replace(/"/g, ''),
    }));
  }

  async copy(sourceKey: string, destinationKey: string): Promise<UploadResult> {
    const command = new CopyObjectCommand({
      Bucket: this.bucket,
      CopySource: `${this.bucket}/${sourceKey}`,
      Key: destinationKey,
    });

    const result = await this.client.send(command);

    logger.info('File copied in S3', {
      source: sourceKey,
      destination: destinationKey,
    });

    return {
      key: destinationKey,
      url: this.getPublicUrl(destinationKey),
      bucket: this.bucket,
      etag: result.CopyObjectResult?.ETag?.replace(/"/g, ''),
    };
  }

  private getPublicUrl(key: string): string {
    if (this.endpoint) {
      return `${this.endpoint}/${this.bucket}/${key}`;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }
}
