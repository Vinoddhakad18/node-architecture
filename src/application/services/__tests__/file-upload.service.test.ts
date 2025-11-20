/**
 * Unit Tests for File Upload Service
 * Tests business logic for file upload operations
 */

import fileUploadService from '../file-upload.service';
import FileMetadata from '../../models/file-metadata.model';
import { getStorageProvider } from '../../config/storage';
import redisService from '../../helpers/redis.helper';
import { sequelize } from '../../config/database/database';

// Mock dependencies
jest.mock('../../models/file-metadata.model');
jest.mock('../../config/storage');
jest.mock('../../helpers/redis.helper');
jest.mock('../../config/database/database', () => ({
  sequelize: {
    transaction: jest.fn((callback: any) => {
      const t = {
        commit: jest.fn().mockResolvedValue(undefined),
        rollback: jest.fn().mockResolvedValue(undefined),
      };
      return callback(t);
    }),
  },
}));
jest.mock('../../config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));
jest.mock('../../middleware/upload.middleware', () => ({
  generateStorageKey: jest.fn((filename: string, prefix?: string) =>
    `${prefix || 'uploads'}/${Date.now()}-${filename}`
  ),
  getFileCategory: jest.fn((mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType === 'application/pdf') return 'document';
    return 'other';
  }),
}));

describe('FileUploadService', () => {
  let mockStorageProvider: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock storage provider
    mockStorageProvider = {
      upload: jest.fn().mockResolvedValue({
        bucket: 'test-bucket',
        url: 'https://test-bucket.s3.amazonaws.com/test-file.jpg',
        etag: 'test-etag',
      }),
      delete: jest.fn().mockResolvedValue(undefined),
      download: jest.fn().mockResolvedValue({
        body: { pipe: jest.fn() },
        contentType: 'image/jpeg',
      }),
      getPresignedDownloadUrl: jest.fn().mockResolvedValue('https://presigned-download-url'),
      getPresignedUploadUrl: jest.fn().mockResolvedValue('https://presigned-upload-url'),
    };

    (getStorageProvider as jest.Mock).mockReturnValue(mockStorageProvider);
    (redisService.get as jest.Mock).mockResolvedValue(null);
    (redisService.set as jest.Mock).mockResolvedValue(undefined);
    (redisService.del as jest.Mock).mockResolvedValue(undefined);
  });

  describe('upload', () => {
    const mockInput = {
      buffer: Buffer.from('test file content'),
      originalName: 'test-file.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      description: 'Test file description',
      metadata: { key: 'value' },
      prefix: 'images',
    };

    it('should successfully upload a file', async () => {
      // Arrange
      const mockCreatedFile = {
        id: 1,
        original_name: mockInput.originalName,
        storage_key: 'images/123-test-file.jpg',
        bucket: 'test-bucket',
        mime_type: mockInput.mimeType,
        size: mockInput.size,
        url: 'https://test-bucket.s3.amazonaws.com/test-file.jpg',
        category: 'image',
        description: mockInput.description,
        metadata: mockInput.metadata,
        created_by: 1,
        toJSON: jest.fn().mockReturnValue({ id: 1 }),
      };

      (FileMetadata.create as jest.Mock).mockResolvedValue(mockCreatedFile);

      // Act
      const result = await fileUploadService.upload(mockInput, 1);

      // Assert
      expect(getStorageProvider).toHaveBeenCalled();
      expect(mockStorageProvider.upload).toHaveBeenCalled();
      expect(FileMetadata.create).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedFile);
    });

    it('should clean up storage if database save fails', async () => {
      // Arrange
      const dbError = new Error('Database error');
      (FileMetadata.create as jest.Mock).mockRejectedValue(dbError);

      // Act & Assert
      await expect(fileUploadService.upload(mockInput, 1)).rejects.toThrow('Database error');
      expect(mockStorageProvider.delete).toHaveBeenCalled();
    });

    it('should upload file without userId', async () => {
      // Arrange
      const mockCreatedFile = {
        id: 1,
        original_name: mockInput.originalName,
        created_by: null,
        toJSON: jest.fn().mockReturnValue({ id: 1 }),
      };

      (FileMetadata.create as jest.Mock).mockResolvedValue(mockCreatedFile);

      // Act
      const result = await fileUploadService.upload(mockInput);

      // Assert
      expect(result).toEqual(mockCreatedFile);
    });

    it('should not invalidate cache when inside a transaction', async () => {
      // Arrange
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      const mockCreatedFile = {
        id: 1,
        toJSON: jest.fn().mockReturnValue({ id: 1 }),
      };

      (FileMetadata.create as jest.Mock).mockResolvedValue(mockCreatedFile);

      // Act
      await fileUploadService.upload(mockInput, 1, mockTransaction as any);

      // Assert
      expect(redisService.del).not.toHaveBeenCalled();
    });
  });

  describe('uploadMultiple', () => {
    const mockFiles = [
      {
        buffer: Buffer.from('file1'),
        originalName: 'file1.jpg',
        mimeType: 'image/jpeg',
        size: 1024,
      },
      {
        buffer: Buffer.from('file2'),
        originalName: 'file2.png',
        mimeType: 'image/png',
        size: 2048,
      },
    ];

    it('should upload multiple files atomically', async () => {
      // Arrange
      const mockCreatedFiles = mockFiles.map((f, i) => ({
        id: i + 1,
        original_name: f.originalName,
        storage_key: `uploads/${i}-${f.originalName}`,
        toJSON: jest.fn().mockReturnValue({ id: i + 1 }),
      }));

      let callCount = 0;
      (FileMetadata.create as jest.Mock).mockImplementation(() => {
        return Promise.resolve(mockCreatedFiles[callCount++]);
      });

      // Act
      const results = await fileUploadService.uploadMultiple(mockFiles, 1);

      // Assert
      expect(results).toHaveLength(2);
      expect(FileMetadata.create).toHaveBeenCalledTimes(2);
    });

    it('should clean up all uploaded files on failure', async () => {
      // Arrange
      const mockCreatedFile = {
        id: 1,
        storage_key: 'uploads/1-file1.jpg',
        toJSON: jest.fn().mockReturnValue({ id: 1 }),
      };

      (FileMetadata.create as jest.Mock)
        .mockResolvedValueOnce(mockCreatedFile)
        .mockRejectedValueOnce(new Error('Upload failed'));

      // Act & Assert
      await expect(fileUploadService.uploadMultiple(mockFiles, 1)).rejects.toThrow('Upload failed');
      expect(mockStorageProvider.delete).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should return file from cache if available', async () => {
      // Arrange
      const cachedFile = { id: 1, original_name: 'cached-file.jpg' };
      (redisService.get as jest.Mock).mockResolvedValue(cachedFile);

      // Act
      const result = await fileUploadService.findById(1);

      // Assert
      expect(redisService.get).toHaveBeenCalledWith('file:id:1');
      expect(FileMetadata.findByPk).not.toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should fetch from database and cache if not in cache', async () => {
      // Arrange
      const mockFile = {
        id: 1,
        original_name: 'db-file.jpg',
        toJSON: jest.fn().mockReturnValue({ id: 1, original_name: 'db-file.jpg' }),
      };
      (redisService.get as jest.Mock).mockResolvedValue(null);
      (FileMetadata.findByPk as jest.Mock).mockResolvedValue(mockFile);

      // Act
      const result = await fileUploadService.findById(1);

      // Assert
      expect(FileMetadata.findByPk).toHaveBeenCalledWith(1);
      expect(redisService.set).toHaveBeenCalled();
      expect(result).toEqual(mockFile);
    });

    it('should return null if file not found', async () => {
      // Arrange
      (redisService.get as jest.Mock).mockResolvedValue(null);
      (FileMetadata.findByPk as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await fileUploadService.findById(999);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByStorageKey', () => {
    it('should find file by storage key', async () => {
      // Arrange
      const storageKey = 'uploads/test-key.jpg';
      const mockFile = {
        id: 1,
        storage_key: storageKey,
        toJSON: jest.fn().mockReturnValue({ id: 1, storage_key: storageKey }),
      };
      (redisService.get as jest.Mock).mockResolvedValue(null);
      (FileMetadata.findOne as jest.Mock).mockResolvedValue(mockFile);

      // Act
      const result = await fileUploadService.findByStorageKey(storageKey);

      // Assert
      expect(FileMetadata.findOne).toHaveBeenCalledWith({
        where: { storage_key: storageKey },
      });
      expect(result).toEqual(mockFile);
    });
  });

  describe('findAll', () => {
    it('should return paginated files with default options', async () => {
      // Arrange
      const mockFiles = [
        { id: 1, original_name: 'file1.jpg' },
        { id: 2, original_name: 'file2.jpg' },
      ];
      (FileMetadata.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 10,
        rows: mockFiles,
      });

      // Act
      const result = await fileUploadService.findAll();

      // Assert
      expect(result).toEqual({
        data: mockFiles,
        total: 10,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should apply filters correctly', async () => {
      // Arrange
      const options = {
        page: 2,
        limit: 5,
        category: 'image',
        mimeType: 'image/jpeg',
        status: 'active' as const,
        createdBy: 1,
        sortBy: 'size',
        sortOrder: 'ASC' as const,
      };

      (FileMetadata.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 20,
        rows: [],
      });

      // Act
      const result = await fileUploadService.findAll(options);

      // Assert
      expect(FileMetadata.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 5,
          offset: 5,
          order: [['size', 'ASC']],
        })
      );
      expect(result.totalPages).toBe(4);
    });
  });

  describe('update', () => {
    it('should update file metadata successfully', async () => {
      // Arrange
      const mockFile = {
        id: 1,
        storage_key: 'uploads/test.jpg',
        update: jest.fn().mockResolvedValue(true),
      };
      (FileMetadata.findByPk as jest.Mock).mockResolvedValue(mockFile);

      const updateData = { description: 'Updated description' };

      // Act
      const result = await fileUploadService.update(1, updateData, 1);

      // Assert
      expect(mockFile.update).toHaveBeenCalledWith({
        ...updateData,
        updated_by: 1,
      });
      expect(result).toEqual(mockFile);
    });

    it('should return null if file not found', async () => {
      // Arrange
      (FileMetadata.findByPk as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await fileUploadService.update(999, { description: 'test' });

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should soft delete file successfully', async () => {
      // Arrange
      const mockFile = {
        id: 1,
        storage_key: 'uploads/test.jpg',
        created_by: 1,
        update: jest.fn().mockResolvedValue(true),
      };
      (FileMetadata.findByPk as jest.Mock).mockResolvedValue(mockFile);

      // Act
      const result = await fileUploadService.delete(1, 1);

      // Assert
      expect(mockFile.update).toHaveBeenCalledWith({
        status: 'deleted',
        updated_by: 1,
      });
      expect(result).toBe(true);
    });

    it('should return false if file not found', async () => {
      // Arrange
      (FileMetadata.findByPk as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await fileUploadService.delete(999);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('hardDelete', () => {
    it('should hard delete file from database and storage', async () => {
      // Arrange
      const mockFile = {
        id: 1,
        storage_key: 'uploads/test.jpg',
        created_by: 1,
        destroy: jest.fn().mockResolvedValue(true),
      };
      (FileMetadata.findByPk as jest.Mock).mockResolvedValue(mockFile);

      // Act
      const result = await fileUploadService.hardDelete(1);

      // Assert
      expect(mockFile.destroy).toHaveBeenCalled();
      expect(mockStorageProvider.delete).toHaveBeenCalledWith('uploads/test.jpg');
      expect(result).toBe(true);
    });

    it('should return false if file not found', async () => {
      // Arrange
      (FileMetadata.findByPk as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await fileUploadService.hardDelete(999);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getDownloadUrl', () => {
    it('should return presigned download URL', async () => {
      // Arrange
      const mockFile = {
        id: 1,
        storage_key: 'uploads/test.jpg',
        status: 'active',
        toJSON: jest.fn().mockReturnValue({ id: 1 }),
      };
      (redisService.get as jest.Mock).mockResolvedValue(null);
      (FileMetadata.findByPk as jest.Mock).mockResolvedValue(mockFile);

      // Act
      const result = await fileUploadService.getDownloadUrl(1, 3600);

      // Assert
      expect(mockStorageProvider.getPresignedDownloadUrl).toHaveBeenCalledWith('uploads/test.jpg', 3600);
      expect(result).toBe('https://presigned-download-url');
    });

    it('should return null for deleted files', async () => {
      // Arrange
      const mockFile = {
        id: 1,
        storage_key: 'uploads/test.jpg',
        status: 'deleted',
        toJSON: jest.fn().mockReturnValue({ id: 1, status: 'deleted' }),
      };
      (redisService.get as jest.Mock).mockResolvedValue(null);
      (FileMetadata.findByPk as jest.Mock).mockResolvedValue(mockFile);

      // Act
      const result = await fileUploadService.getDownloadUrl(1);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getPresignedUploadUrl', () => {
    it('should generate presigned upload URL', async () => {
      // Arrange
      const filename = 'new-file.jpg';
      const mimeType = 'image/jpeg';

      // Act
      const result = await fileUploadService.getPresignedUploadUrl(filename, mimeType, 3600);

      // Assert
      expect(mockStorageProvider.getPresignedUploadUrl).toHaveBeenCalled();
      expect(result).toHaveProperty('uploadUrl');
      expect(result).toHaveProperty('storageKey');
    });
  });

  describe('download', () => {
    it('should return file stream for download', async () => {
      // Arrange
      const mockFile = {
        id: 1,
        storage_key: 'uploads/test.jpg',
        mime_type: 'image/jpeg',
        status: 'active',
        toJSON: jest.fn().mockReturnValue({ id: 1 }),
      };
      (redisService.get as jest.Mock).mockResolvedValue(null);
      (FileMetadata.findByPk as jest.Mock).mockResolvedValue(mockFile);

      // Act
      const result = await fileUploadService.download(1);

      // Assert
      expect(mockStorageProvider.download).toHaveBeenCalledWith('uploads/test.jpg');
      expect(result).toHaveProperty('file');
      expect(result).toHaveProperty('stream');
      expect(result).toHaveProperty('contentType');
    });

    it('should return null for deleted files', async () => {
      // Arrange
      const mockFile = {
        id: 1,
        status: 'deleted',
        toJSON: jest.fn().mockReturnValue({ id: 1, status: 'deleted' }),
      };
      (redisService.get as jest.Mock).mockResolvedValue(null);
      (FileMetadata.findByPk as jest.Mock).mockResolvedValue(mockFile);

      // Act
      const result = await fileUploadService.download(1);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByUser', () => {
    it('should find files by user ID', async () => {
      // Arrange
      const mockFiles = [
        { id: 1, original_name: 'file1.jpg', created_by: 1 },
      ];
      (FileMetadata.findAndCountAll as jest.Mock).mockResolvedValue({
        count: 1,
        rows: mockFiles,
      });

      // Act
      const result = await fileUploadService.findByUser(1, { page: 1, limit: 10 });

      // Assert
      expect(result.data).toEqual(mockFiles);
    });
  });

  describe('exists', () => {
    it('should return true if file exists', async () => {
      // Arrange
      (FileMetadata.findByPk as jest.Mock).mockResolvedValue({ id: 1 });

      // Act
      const result = await fileUploadService.exists(1);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false if file does not exist', async () => {
      // Arrange
      (FileMetadata.findByPk as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await fileUploadService.exists(999);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getStatistics', () => {
    it('should return storage statistics', async () => {
      // Arrange
      const mockFiles = [
        { category: 'image', size: 1024 },
        { category: 'image', size: 2048 },
        { category: 'document', size: 512 },
      ];
      (FileMetadata.findAll as jest.Mock).mockResolvedValue(mockFiles);

      // Act
      const result = await fileUploadService.getStatistics();

      // Assert
      expect(result.totalFiles).toBe(3);
      expect(result.totalSize).toBe(3584);
      expect(result.byCategory).toHaveProperty('image');
      expect(result.byCategory).toHaveProperty('document');
      expect(result.byCategory.image.count).toBe(2);
      expect(result.byCategory.image.size).toBe(3072);
    });

    it('should filter by userId when provided', async () => {
      // Arrange
      (FileMetadata.findAll as jest.Mock).mockResolvedValue([]);

      // Act
      await fileUploadService.getStatistics(1);

      // Assert
      expect(FileMetadata.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'active',
            created_by: 1,
          }),
        })
      );
    });
  });
});
