import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';

import * as mime from 'mime-types';

import { logger } from '../../config/logger';
import {
  StorageProvider,
  UploadOptions,
  UploadResult,
  DownloadResult,
  FileInfo,
  PresignedUrlOptions,
} from '../../interfaces/StorageProvider.interface';

export interface LocalStorageConfig {
  basePath: string;
  baseUrl: string; // Base URL for generating file URLs
}

export class LocalStorageProvider implements StorageProvider {
  private basePath: string;
  private baseUrl: string;

  constructor(config: LocalStorageConfig) {
    this.basePath = config.basePath;
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash

    // Ensure base directory exists
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
    }

    logger.info('LocalStorageProvider initialized', {
      basePath: this.basePath,
      baseUrl: this.baseUrl,
    });
  }

  async upload(
    key: string,
    body: Buffer | Readable | string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    const filePath = this.getFilePath(key);
    const dirPath = path.dirname(filePath);

    // Ensure directory exists
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Convert body to buffer if needed
    let buffer: Buffer;
    if (Buffer.isBuffer(body)) {
      buffer = body;
    } else if (typeof body === 'string') {
      buffer = Buffer.from(body);
    } else {
      buffer = await this.streamToBuffer(body);
    }

    // Write file
    fs.writeFileSync(filePath, buffer);

    // Store metadata if provided
    if (options?.metadata) {
      const metaPath = `${filePath}.meta.json`;
      fs.writeFileSync(
        metaPath,
        JSON.stringify({
          contentType: options.contentType,
          metadata: options.metadata,
          uploadedAt: new Date().toISOString(),
        })
      );
    }

    const url = `${this.baseUrl}/${key}`;

    logger.info('File uploaded to local storage', { key, path: filePath });

    return {
      key,
      url,
      bucket: 'local',
      size: buffer.length,
    };
  }

  async download(key: string): Promise<DownloadResult> {
    const filePath = this.getFilePath(key);

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${key}`);
    }

    const stats = fs.statSync(filePath);
    const contentType = mime.lookup(filePath) || 'application/octet-stream';

    // Try to load metadata
    let metadata: Record<string, string> | undefined;
    const metaPath = `${filePath}.meta.json`;
    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      metadata = meta.metadata;
    }

    return {
      body: fs.createReadStream(filePath),
      contentType,
      contentLength: stats.size,
      metadata,
    };
  }

  async delete(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);

      // Delete metadata file if exists
      const metaPath = `${filePath}.meta.json`;
      if (fs.existsSync(metaPath)) {
        fs.unlinkSync(metaPath);
      }

      logger.info('File deleted from local storage', { key });
      return true;
    }

    return false;
  }

  async deleteMany(keys: string[]): Promise<{ deleted: string[]; errors: string[] }> {
    const deleted: string[] = [];
    const errors: string[] = [];

    for (const key of keys) {
      try {
        const success = await this.delete(key);
        if (success) {
          deleted.push(key);
        } else {
          errors.push(key);
        }
      } catch {
        errors.push(key);
      }
    }

    return { deleted, errors };
  }

  async exists(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);
    return fs.existsSync(filePath);
  }

  async getInfo(key: string): Promise<FileInfo | null> {
    const filePath = this.getFilePath(key);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const stats = fs.statSync(filePath);
    const contentType = mime.lookup(filePath) || 'application/octet-stream';

    return {
      key,
      size: stats.size,
      lastModified: stats.mtime,
      contentType,
    };
  }

  async getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    // For local storage, we just return the URL with a timestamp
    // In a real implementation, you might want to implement token-based auth
    const expires = Date.now() + expiresIn * 1000;
    return `${this.baseUrl}/${key}?expires=${expires}`;
  }

  async getPresignedUploadUrl(key: string, options?: PresignedUrlOptions): Promise<string> {
    // For local storage, return the upload endpoint
    const expires = Date.now() + (options?.expiresIn || 3600) * 1000;
    return `${this.baseUrl}/upload/${key}?expires=${expires}`;
  }

  async list(prefix?: string, maxKeys = 1000): Promise<FileInfo[]> {
    const results: FileInfo[] = [];
    const searchPath = prefix ? path.join(this.basePath, prefix) : this.basePath;

    if (!fs.existsSync(searchPath)) {
      return results;
    }

    const files = this.listFilesRecursive(searchPath);

    for (const filePath of files.slice(0, maxKeys)) {
      const key = path.relative(this.basePath, filePath).replace(/\\/g, '/');
      const stats = fs.statSync(filePath);
      const contentType = mime.lookup(filePath) || 'application/octet-stream';

      results.push({
        key,
        size: stats.size,
        lastModified: stats.mtime,
        contentType,
      });
    }

    return results;
  }

  async copy(sourceKey: string, destinationKey: string): Promise<UploadResult> {
    const sourcePath = this.getFilePath(sourceKey);
    const destPath = this.getFilePath(destinationKey);

    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source file not found: ${sourceKey}`);
    }

    // Ensure destination directory exists
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    fs.copyFileSync(sourcePath, destPath);

    // Copy metadata if exists
    const sourceMetaPath = `${sourcePath}.meta.json`;
    if (fs.existsSync(sourceMetaPath)) {
      fs.copyFileSync(sourceMetaPath, `${destPath}.meta.json`);
    }

    const stats = fs.statSync(destPath);

    logger.info('File copied in local storage', {
      source: sourceKey,
      destination: destinationKey,
    });

    return {
      key: destinationKey,
      url: `${this.baseUrl}/${destinationKey}`,
      bucket: 'local',
      size: stats.size,
    };
  }

  private getFilePath(key: string): string {
    return path.join(this.basePath, key);
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  private listFilesRecursive(dir: string): string[] {
    const files: string[] = [];
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stats = fs.statSync(fullPath);

      if (stats.isDirectory()) {
        files.push(...this.listFilesRecursive(fullPath));
      } else if (!item.endsWith('.meta.json')) {
        files.push(fullPath);
      }
    }

    return files;
  }
}
