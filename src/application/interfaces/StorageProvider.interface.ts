import { Readable } from 'stream';

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  acl?: 'private' | 'public-read';
}

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
  etag?: string;
  size?: number;
}

export interface DownloadResult {
  body: Readable | Buffer;
  contentType?: string;
  contentLength?: number;
  metadata?: Record<string, string>;
}

export interface FileInfo {
  key: string;
  size: number;
  lastModified: Date;
  contentType?: string;
  etag?: string;
}

export interface PresignedUrlOptions {
  expiresIn?: number; // seconds
  contentType?: string;
}

export interface StorageProvider {
  /**
   * Upload a file to storage
   */
  upload(
    key: string,
    body: Buffer | Readable | string,
    options?: UploadOptions
  ): Promise<UploadResult>;

  /**
   * Download a file from storage
   */
  download(key: string): Promise<DownloadResult>;

  /**
   * Delete a file from storage
   */
  delete(key: string): Promise<boolean>;

  /**
   * Delete multiple files from storage
   */
  deleteMany(keys: string[]): Promise<{ deleted: string[]; errors: string[] }>;

  /**
   * Check if a file exists in storage
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get file metadata
   */
  getInfo(key: string): Promise<FileInfo | null>;

  /**
   * Generate a presigned URL for downloading
   */
  getPresignedDownloadUrl(key: string, expiresIn?: number): Promise<string>;

  /**
   * Generate a presigned URL for uploading
   */
  getPresignedUploadUrl(key: string, options?: PresignedUrlOptions): Promise<string>;

  /**
   * List files with optional prefix
   */
  list(prefix?: string, maxKeys?: number): Promise<FileInfo[]>;

  /**
   * Copy a file to a new location
   */
  copy(sourceKey: string, destinationKey: string): Promise<UploadResult>;
}
