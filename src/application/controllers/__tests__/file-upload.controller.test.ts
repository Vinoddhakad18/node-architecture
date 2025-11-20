/**
 * Integration Tests for File Upload Controller
 * Tests HTTP request handling for file upload operations
 */

import { Request, Response, NextFunction } from 'express';
import fileUploadController from '../file-upload.controller';
import fileUploadService from '@services/file-upload.service';
import { mockRequest, mockResponse } from '../../../__tests__/helpers/test-helpers';

// Mock dependencies
jest.mock('@services/file-upload.service');
jest.mock('@config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('FileUploadController', () => {
  let req: any;
  let res: any;
  let next: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();

    req = mockRequest();
    res = mockResponse();
    res.sendCreated = jest.fn().mockReturnValue(res);
    res.sendBadRequest = jest.fn().mockReturnValue(res);
    res.sendNotFound = jest.fn().mockReturnValue(res);
    res.setHeader = jest.fn();
    next = jest.fn();
  });

  describe('findAll', () => {
    it('should return paginated files with default options', async () => {
      // Arrange
      const mockResult = {
        data: [{ id: 1, original_name: 'file1.jpg' }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      (fileUploadService.findAll as jest.Mock).mockResolvedValue(mockResult);

      // Act
      await fileUploadController.findAll(req, res, next);

      // Assert
      expect(fileUploadService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        category: undefined,
        mimeType: undefined,
        status: undefined,
        sortBy: undefined,
        sortOrder: undefined,
      });
      expect(res.sendSuccess).toHaveBeenCalledWith(mockResult, 'Files retrieved successfully');
    });

    it('should apply query parameters', async () => {
      // Arrange
      req.query = {
        page: '2',
        limit: '5',
        category: 'image',
        mimeType: 'image/jpeg',
        status: 'active',
        sortBy: 'size',
        sortOrder: 'DESC',
      };

      const mockResult = { data: [], total: 0, page: 2, limit: 5, totalPages: 0 };
      (fileUploadService.findAll as jest.Mock).mockResolvedValue(mockResult);

      // Act
      await fileUploadController.findAll(req, res, next);

      // Assert
      expect(fileUploadService.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 5,
        category: 'image',
        mimeType: 'image/jpeg',
        status: 'active',
        sortBy: 'size',
        sortOrder: 'DESC',
      });
    });

    it('should call next with error on failure', async () => {
      // Arrange
      const error = new Error('Database error');
      (fileUploadService.findAll as jest.Mock).mockRejectedValue(error);

      // Act
      await fileUploadController.findAll(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('findMyFiles', () => {
    it('should return files for authenticated user', async () => {
      // Arrange
      req.user = { userId: 1, email: 'test@example.com', role: 'user' };
      const mockResult = {
        data: [{ id: 1, created_by: 1 }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      (fileUploadService.findByUser as jest.Mock).mockResolvedValue(mockResult);

      // Act
      await fileUploadController.findMyFiles(req, res, next);

      // Assert
      expect(fileUploadService.findByUser).toHaveBeenCalledWith(1, expect.any(Object));
      expect(res.sendSuccess).toHaveBeenCalledWith(mockResult, 'User files retrieved successfully');
    });

    it('should return unauthorized if user not authenticated', async () => {
      // Arrange
      req.user = null;

      // Act
      await fileUploadController.findMyFiles(req, res, next);

      // Assert
      expect(res.sendUnauthorized).toHaveBeenCalledWith('User not authenticated');
    });
  });

  describe('getStatistics', () => {
    it('should return storage statistics', async () => {
      // Arrange
      const mockStats = {
        totalFiles: 10,
        totalSize: 10240,
        byCategory: { image: { count: 5, size: 5120 } },
      };
      (fileUploadService.getStatistics as jest.Mock).mockResolvedValue(mockStats);

      // Act
      await fileUploadController.getStatistics(req, res, next);

      // Assert
      expect(res.sendSuccess).toHaveBeenCalledWith(mockStats, 'Statistics retrieved successfully');
    });

    it('should filter by user when forUser query param is true', async () => {
      // Arrange
      req.query = { forUser: 'true' };
      req.user = { userId: 1 };
      (fileUploadService.getStatistics as jest.Mock).mockResolvedValue({});

      // Act
      await fileUploadController.getStatistics(req, res, next);

      // Assert
      expect(fileUploadService.getStatistics).toHaveBeenCalledWith(1);
    });
  });

  describe('findById', () => {
    it('should return file when found', async () => {
      // Arrange
      req.params = { id: '1' };
      const mockFile = { id: 1, original_name: 'test.jpg' };
      (fileUploadService.findById as jest.Mock).mockResolvedValue(mockFile);

      // Act
      await fileUploadController.findById(req, res, next);

      // Assert
      expect(fileUploadService.findById).toHaveBeenCalledWith(1);
      expect(res.sendSuccess).toHaveBeenCalledWith(mockFile, 'File retrieved successfully');
    });

    it('should return not found when file does not exist', async () => {
      // Arrange
      req.params = { id: '999' };
      (fileUploadService.findById as jest.Mock).mockResolvedValue(null);

      // Act
      await fileUploadController.findById(req, res, next);

      // Assert
      expect(res.sendNotFound).toHaveBeenCalledWith('File not found');
    });
  });

  describe('download', () => {
    it('should stream file for download', async () => {
      // Arrange
      req.params = { id: '1' };
      const mockStream = { pipe: jest.fn() };
      const mockResult = {
        file: { original_name: 'test.jpg' },
        stream: mockStream,
        contentType: 'image/jpeg',
      };
      (fileUploadService.download as jest.Mock).mockResolvedValue(mockResult);

      // Act
      await fileUploadController.download(req, res, next);

      // Assert
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'image/jpeg');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="test.jpg"'
      );
      expect(mockStream.pipe).toHaveBeenCalledWith(res);
    });

    it('should return not found when file does not exist', async () => {
      // Arrange
      req.params = { id: '999' };
      (fileUploadService.download as jest.Mock).mockResolvedValue(null);

      // Act
      await fileUploadController.download(req, res, next);

      // Assert
      expect(res.sendNotFound).toHaveBeenCalledWith('File not found');
    });
  });

  describe('getDownloadUrl', () => {
    it('should return presigned download URL', async () => {
      // Arrange
      req.params = { id: '1' };
      req.query = { expiresIn: '7200' };
      const mockUrl = 'https://presigned-url.com';
      (fileUploadService.getDownloadUrl as jest.Mock).mockResolvedValue(mockUrl);

      // Act
      await fileUploadController.getDownloadUrl(req, res, next);

      // Assert
      expect(fileUploadService.getDownloadUrl).toHaveBeenCalledWith(1, 7200);
      expect(res.sendSuccess).toHaveBeenCalledWith(
        { url: mockUrl, expiresIn: 7200 },
        'Download URL generated successfully'
      );
    });

    it('should use default expiry when not provided', async () => {
      // Arrange
      req.params = { id: '1' };
      (fileUploadService.getDownloadUrl as jest.Mock).mockResolvedValue('https://url.com');

      // Act
      await fileUploadController.getDownloadUrl(req, res, next);

      // Assert
      expect(fileUploadService.getDownloadUrl).toHaveBeenCalledWith(1, 3600);
    });

    it('should return not found when file does not exist', async () => {
      // Arrange
      req.params = { id: '999' };
      (fileUploadService.getDownloadUrl as jest.Mock).mockResolvedValue(null);

      // Act
      await fileUploadController.getDownloadUrl(req, res, next);

      // Assert
      expect(res.sendNotFound).toHaveBeenCalledWith('File not found');
    });
  });

  describe('upload', () => {
    it('should upload file successfully', async () => {
      // Arrange
      req.file = {
        buffer: Buffer.from('test'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      };
      req.body = {
        description: 'Test file',
        metadata: '{"key": "value"}',
        prefix: 'images',
      };
      req.user = { userId: 1 };

      const mockFile = { id: 1, original_name: 'test.jpg' };
      (fileUploadService.upload as jest.Mock).mockResolvedValue(mockFile);

      // Act
      await fileUploadController.upload(req, res, next);

      // Assert
      expect(fileUploadService.upload).toHaveBeenCalledWith(
        expect.objectContaining({
          buffer: expect.any(Buffer),
          originalName: 'test.jpg',
          mimeType: 'image/jpeg',
          size: 1024,
          description: 'Test file',
          metadata: { key: 'value' },
          prefix: 'images',
        }),
        1
      );
      expect(res.sendCreated).toHaveBeenCalledWith(mockFile, 'File uploaded successfully');
    });

    it('should return bad request when no file uploaded', async () => {
      // Arrange
      req.file = null;

      // Act
      await fileUploadController.upload(req, res, next);

      // Assert
      expect(res.sendBadRequest).toHaveBeenCalledWith('No file uploaded');
    });

    it('should return bad request for invalid metadata JSON', async () => {
      // Arrange
      req.file = {
        buffer: Buffer.from('test'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      };
      req.body = {
        metadata: 'invalid-json',
      };

      // Act
      await fileUploadController.upload(req, res, next);

      // Assert
      expect(res.sendBadRequest).toHaveBeenCalledWith(
        'Invalid metadata format. Must be valid JSON.'
      );
    });

    it('should handle upload without metadata', async () => {
      // Arrange
      req.file = {
        buffer: Buffer.from('test'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
      };
      req.body = {};
      req.user = { userId: 1 };

      (fileUploadService.upload as jest.Mock).mockResolvedValue({ id: 1 });

      // Act
      await fileUploadController.upload(req, res, next);

      // Assert
      expect(fileUploadService.upload).toHaveBeenCalled();
    });
  });

  describe('uploadMultiple', () => {
    it('should upload multiple files successfully', async () => {
      // Arrange
      req.files = [
        {
          buffer: Buffer.from('file1'),
          originalname: 'file1.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
        },
        {
          buffer: Buffer.from('file2'),
          originalname: 'file2.png',
          mimetype: 'image/png',
          size: 2048,
        },
      ];
      req.body = { prefix: 'images' };
      req.user = { userId: 1 };

      const mockFiles = [{ id: 1 }, { id: 2 }];
      (fileUploadService.uploadMultiple as jest.Mock).mockResolvedValue(mockFiles);

      // Act
      await fileUploadController.uploadMultiple(req, res, next);

      // Assert
      expect(fileUploadService.uploadMultiple).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ originalName: 'file1.jpg' }),
          expect.objectContaining({ originalName: 'file2.png' }),
        ]),
        1
      );
      expect(res.sendCreated).toHaveBeenCalledWith(mockFiles, '2 files uploaded successfully');
    });

    it('should return bad request when no files uploaded', async () => {
      // Arrange
      req.files = [];

      // Act
      await fileUploadController.uploadMultiple(req, res, next);

      // Assert
      expect(res.sendBadRequest).toHaveBeenCalledWith('No files uploaded');
    });

    it('should return bad request when files is null', async () => {
      // Arrange
      req.files = null;

      // Act
      await fileUploadController.uploadMultiple(req, res, next);

      // Assert
      expect(res.sendBadRequest).toHaveBeenCalledWith('No files uploaded');
    });
  });

  describe('getPresignedUploadUrl', () => {
    it('should generate presigned upload URL', async () => {
      // Arrange
      req.body = {
        filename: 'newfile.jpg',
        mimeType: 'image/jpeg',
        expiresIn: 7200,
      };

      const mockResult = {
        uploadUrl: 'https://presigned-upload-url.com',
        storageKey: 'uploads/newfile.jpg',
      };
      (fileUploadService.getPresignedUploadUrl as jest.Mock).mockResolvedValue(mockResult);

      // Act
      await fileUploadController.getPresignedUploadUrl(req, res, next);

      // Assert
      expect(fileUploadService.getPresignedUploadUrl).toHaveBeenCalledWith(
        'newfile.jpg',
        'image/jpeg',
        7200
      );
      expect(res.sendSuccess).toHaveBeenCalledWith(mockResult, 'Upload URL generated successfully');
    });

    it('should use default expiry when not provided', async () => {
      // Arrange
      req.body = {
        filename: 'file.jpg',
        mimeType: 'image/jpeg',
      };
      (fileUploadService.getPresignedUploadUrl as jest.Mock).mockResolvedValue({});

      // Act
      await fileUploadController.getPresignedUploadUrl(req, res, next);

      // Assert
      expect(fileUploadService.getPresignedUploadUrl).toHaveBeenCalledWith(
        'file.jpg',
        'image/jpeg',
        3600
      );
    });
  });

  describe('update', () => {
    it('should update file metadata successfully', async () => {
      // Arrange
      req.params = { id: '1' };
      req.body = {
        description: 'Updated description',
        metadata: { key: 'value' },
        category: 'document',
        status: 'inactive',
      };
      req.user = { userId: 1 };

      const mockFile = { id: 1, description: 'Updated description' };
      (fileUploadService.update as jest.Mock).mockResolvedValue(mockFile);

      // Act
      await fileUploadController.update(req, res, next);

      // Assert
      expect(fileUploadService.update).toHaveBeenCalledWith(
        1,
        req.body,
        1
      );
      expect(res.sendSuccess).toHaveBeenCalledWith(mockFile, 'File updated successfully');
    });

    it('should return not found when file does not exist', async () => {
      // Arrange
      req.params = { id: '999' };
      req.body = { description: 'test' };
      (fileUploadService.update as jest.Mock).mockResolvedValue(null);

      // Act
      await fileUploadController.update(req, res, next);

      // Assert
      expect(res.sendNotFound).toHaveBeenCalledWith('File not found');
    });
  });

  describe('delete', () => {
    it('should soft delete file successfully', async () => {
      // Arrange
      req.params = { id: '1' };
      req.user = { userId: 1 };
      (fileUploadService.delete as jest.Mock).mockResolvedValue(true);

      // Act
      await fileUploadController.delete(req, res, next);

      // Assert
      expect(fileUploadService.delete).toHaveBeenCalledWith(1, 1);
      expect(res.sendSuccess).toHaveBeenCalledWith(null, 'File deleted successfully');
    });

    it('should return not found when file does not exist', async () => {
      // Arrange
      req.params = { id: '999' };
      (fileUploadService.delete as jest.Mock).mockResolvedValue(false);

      // Act
      await fileUploadController.delete(req, res, next);

      // Assert
      expect(res.sendNotFound).toHaveBeenCalledWith('File not found');
    });
  });

  describe('hardDelete', () => {
    it('should hard delete file successfully', async () => {
      // Arrange
      req.params = { id: '1' };
      (fileUploadService.hardDelete as jest.Mock).mockResolvedValue(true);

      // Act
      await fileUploadController.hardDelete(req, res, next);

      // Assert
      expect(fileUploadService.hardDelete).toHaveBeenCalledWith(1);
      expect(res.sendSuccess).toHaveBeenCalledWith(null, 'File permanently deleted');
    });

    it('should return not found when file does not exist', async () => {
      // Arrange
      req.params = { id: '999' };
      (fileUploadService.hardDelete as jest.Mock).mockResolvedValue(false);

      // Act
      await fileUploadController.hardDelete(req, res, next);

      // Assert
      expect(res.sendNotFound).toHaveBeenCalledWith('File not found');
    });
  });
});
