/**
 * Integration Tests for Country Master Controller
 * Tests HTTP request handling and response formatting
 */

import { Request, Response } from 'express';
import countryMasterController from '../country-master.controller';
import countryMasterService from '../../services/country-master.service';
import { mockRequest } from '../../../__tests__/helpers/test-helpers';

// Mock dependencies
jest.mock('../../services/country-master.service');
jest.mock('../../config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Extended mock response with all custom methods
function mockResponse() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.sendSuccess = jest.fn().mockReturnValue(res);
  res.sendCreated = jest.fn().mockReturnValue(res);
  res.sendError = jest.fn().mockReturnValue(res);
  res.sendUnauthorized = jest.fn().mockReturnValue(res);
  res.sendNotFound = jest.fn().mockReturnValue(res);
  res.sendConflict = jest.fn().mockReturnValue(res);
  res.sendServerError = jest.fn().mockReturnValue(res);
  return res;
}

describe('CountryMasterController', () => {
  let req: Partial<Request>;
  let res: any;

  const mockCountry = {
    id: 1,
    name: 'United States',
    code: 'US',
    currency_code: 'USD',
    status: 'active',
    created_by: 1,
    updated_by: 1,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    res = mockResponse();
  });

  describe('create', () => {
    const createData = {
      name: 'United States',
      code: 'US',
      currency_code: 'USD',
      status: 'active',
    };

    it('should successfully create a country', async () => {
      // Arrange
      req = mockRequest({
        body: createData,
        user: { userId: 1 },
      });

      (countryMasterService.isCodeExists as jest.Mock).mockResolvedValue(false);
      (countryMasterService.create as jest.Mock).mockResolvedValue(mockCountry);

      // Act
      await countryMasterController.create(req as Request, res as Response);

      // Assert
      expect(countryMasterService.isCodeExists).toHaveBeenCalledWith('US');
      expect(countryMasterService.create).toHaveBeenCalledWith(
        { name: 'United States', code: 'US', currency_code: 'USD', status: 'active' },
        1
      );
      expect(res.sendCreated).toHaveBeenCalledWith(mockCountry, 'Country created successfully');
    });

    it('should return conflict when code already exists', async () => {
      // Arrange
      req = mockRequest({
        body: createData,
        user: { userId: 1 },
      });

      (countryMasterService.isCodeExists as jest.Mock).mockResolvedValue(true);

      // Act
      await countryMasterController.create(req as Request, res as Response);

      // Assert
      expect(countryMasterService.isCodeExists).toHaveBeenCalledWith('US');
      expect(countryMasterService.create).not.toHaveBeenCalled();
      expect(res.sendConflict).toHaveBeenCalledWith("Country with code 'US' already exists");
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      req = mockRequest({
        body: createData,
        user: { userId: 1 },
      });

      (countryMasterService.isCodeExists as jest.Mock).mockResolvedValue(false);
      (countryMasterService.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act
      await countryMasterController.create(req as Request, res as Response);

      // Assert
      expect(res.sendServerError).toHaveBeenCalledWith('Database error');
    });

    it('should handle errors without message', async () => {
      // Arrange
      req = mockRequest({
        body: createData,
        user: { userId: 1 },
      });

      (countryMasterService.isCodeExists as jest.Mock).mockResolvedValue(false);
      (countryMasterService.create as jest.Mock).mockRejectedValue({});

      // Act
      await countryMasterController.create(req as Request, res as Response);

      // Assert
      expect(res.sendServerError).toHaveBeenCalledWith('Failed to create country');
    });
  });

  describe('findAll', () => {
    const mockPaginatedResult = {
      data: [mockCountry],
      pagination: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    };

    it('should successfully return paginated countries', async () => {
      // Arrange
      req = mockRequest({
        query: { page: '1', limit: '10' },
      });

      (countryMasterService.findAll as jest.Mock).mockResolvedValue(mockPaginatedResult);

      // Act
      await countryMasterController.findAll(req as Request, res as Response);

      // Assert
      expect(countryMasterService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        status: undefined,
        sortBy: 'name',
        sortOrder: 'ASC',
      });
      expect(res.sendSuccess).toHaveBeenCalledWith(mockPaginatedResult, 'Countries retrieved successfully');
    });

    it('should apply filters correctly', async () => {
      // Arrange
      req = mockRequest({
        query: {
          page: '2',
          limit: '20',
          search: 'United',
          status: 'active',
          sortBy: 'code',
          sortOrder: 'DESC',
        },
      });

      (countryMasterService.findAll as jest.Mock).mockResolvedValue(mockPaginatedResult);

      // Act
      await countryMasterController.findAll(req as Request, res as Response);

      // Assert
      expect(countryMasterService.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
        search: 'United',
        status: 'active',
        sortBy: 'code',
        sortOrder: 'DESC',
      });
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      req = mockRequest({
        query: {},
      });

      (countryMasterService.findAll as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act
      await countryMasterController.findAll(req as Request, res as Response);

      // Assert
      expect(res.sendServerError).toHaveBeenCalledWith('Database error');
    });

    it('should handle errors without message', async () => {
      // Arrange
      req = mockRequest({
        query: {},
      });

      (countryMasterService.findAll as jest.Mock).mockRejectedValue({});

      // Act
      await countryMasterController.findAll(req as Request, res as Response);

      // Assert
      expect(res.sendServerError).toHaveBeenCalledWith('Failed to retrieve countries');
    });
  });

  describe('findById', () => {
    it('should successfully return country by id', async () => {
      // Arrange
      req = mockRequest({
        params: { id: '1' },
      });

      (countryMasterService.findById as jest.Mock).mockResolvedValue(mockCountry);

      // Act
      await countryMasterController.findById(req as Request, res as Response);

      // Assert
      expect(countryMasterService.findById).toHaveBeenCalledWith(1);
      expect(res.sendSuccess).toHaveBeenCalledWith(mockCountry, 'Country retrieved successfully');
    });

    it('should return not found when country does not exist', async () => {
      // Arrange
      req = mockRequest({
        params: { id: '999' },
      });

      (countryMasterService.findById as jest.Mock).mockResolvedValue(null);

      // Act
      await countryMasterController.findById(req as Request, res as Response);

      // Assert
      expect(res.sendNotFound).toHaveBeenCalledWith('Country with id 999 not found');
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      req = mockRequest({
        params: { id: '1' },
      });

      (countryMasterService.findById as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act
      await countryMasterController.findById(req as Request, res as Response);

      // Assert
      expect(res.sendServerError).toHaveBeenCalledWith('Database error');
    });
  });

  describe('findByCode', () => {
    it('should successfully return country by code', async () => {
      // Arrange
      req = mockRequest({
        params: { code: 'US' },
      });

      (countryMasterService.findByCode as jest.Mock).mockResolvedValue(mockCountry);

      // Act
      await countryMasterController.findByCode(req as Request, res as Response);

      // Assert
      expect(countryMasterService.findByCode).toHaveBeenCalledWith('US');
      expect(res.sendSuccess).toHaveBeenCalledWith(mockCountry, 'Country retrieved successfully');
    });

    it('should return not found when country code does not exist', async () => {
      // Arrange
      req = mockRequest({
        params: { code: 'XX' },
      });

      (countryMasterService.findByCode as jest.Mock).mockResolvedValue(null);

      // Act
      await countryMasterController.findByCode(req as Request, res as Response);

      // Assert
      expect(res.sendNotFound).toHaveBeenCalledWith("Country with code 'XX' not found");
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      req = mockRequest({
        params: { code: 'US' },
      });

      (countryMasterService.findByCode as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act
      await countryMasterController.findByCode(req as Request, res as Response);

      // Assert
      expect(res.sendServerError).toHaveBeenCalledWith('Database error');
    });
  });

  describe('update', () => {
    const updateData = {
      name: 'United States Updated',
      code: 'USA',
      currency_code: 'USD',
      status: 'active',
    };

    it('should successfully update country', async () => {
      // Arrange
      req = mockRequest({
        params: { id: '1' },
        body: updateData,
        user: { userId: 1 },
      });

      const updatedCountry = { ...mockCountry, ...updateData };
      (countryMasterService.isCodeExists as jest.Mock).mockResolvedValue(false);
      (countryMasterService.update as jest.Mock).mockResolvedValue(updatedCountry);

      // Act
      await countryMasterController.update(req as Request, res as Response);

      // Assert
      expect(countryMasterService.isCodeExists).toHaveBeenCalledWith('USA', 1);
      expect(countryMasterService.update).toHaveBeenCalledWith(
        1,
        { name: 'United States Updated', code: 'USA', currency_code: 'USD', status: 'active' },
        1
      );
      expect(res.sendSuccess).toHaveBeenCalledWith(updatedCountry, 'Country updated successfully');
    });

    it('should return conflict when new code already exists', async () => {
      // Arrange
      req = mockRequest({
        params: { id: '1' },
        body: updateData,
        user: { userId: 1 },
      });

      (countryMasterService.isCodeExists as jest.Mock).mockResolvedValue(true);

      // Act
      await countryMasterController.update(req as Request, res as Response);

      // Assert
      expect(countryMasterService.isCodeExists).toHaveBeenCalledWith('USA', 1);
      expect(countryMasterService.update).not.toHaveBeenCalled();
      expect(res.sendConflict).toHaveBeenCalledWith("Country with code 'USA' already exists");
    });

    it('should skip code check when code is not being updated', async () => {
      // Arrange
      const updateWithoutCode = { name: 'Updated Name' };
      req = mockRequest({
        params: { id: '1' },
        body: updateWithoutCode,
        user: { userId: 1 },
      });

      (countryMasterService.update as jest.Mock).mockResolvedValue(mockCountry);

      // Act
      await countryMasterController.update(req as Request, res as Response);

      // Assert
      expect(countryMasterService.isCodeExists).not.toHaveBeenCalled();
      expect(countryMasterService.update).toHaveBeenCalled();
    });

    it('should return not found when country does not exist', async () => {
      // Arrange
      req = mockRequest({
        params: { id: '999' },
        body: updateData,
        user: { userId: 1 },
      });

      (countryMasterService.isCodeExists as jest.Mock).mockResolvedValue(false);
      (countryMasterService.update as jest.Mock).mockResolvedValue(null);

      // Act
      await countryMasterController.update(req as Request, res as Response);

      // Assert
      expect(res.sendNotFound).toHaveBeenCalledWith('Country with id 999 not found');
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      req = mockRequest({
        params: { id: '1' },
        body: updateData,
        user: { userId: 1 },
      });

      (countryMasterService.isCodeExists as jest.Mock).mockResolvedValue(false);
      (countryMasterService.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act
      await countryMasterController.update(req as Request, res as Response);

      // Assert
      expect(res.sendServerError).toHaveBeenCalledWith('Database error');
    });
  });

  describe('delete', () => {
    it('should successfully soft delete country', async () => {
      // Arrange
      req = mockRequest({
        params: { id: '1' },
        user: { userId: 1 },
      });

      (countryMasterService.delete as jest.Mock).mockResolvedValue(true);

      // Act
      await countryMasterController.delete(req as Request, res as Response);

      // Assert
      expect(countryMasterService.delete).toHaveBeenCalledWith(1, 1);
      expect(res.sendSuccess).toHaveBeenCalledWith(null, 'Country deleted successfully');
    });

    it('should return not found when country does not exist', async () => {
      // Arrange
      req = mockRequest({
        params: { id: '999' },
        user: { userId: 1 },
      });

      (countryMasterService.delete as jest.Mock).mockResolvedValue(false);

      // Act
      await countryMasterController.delete(req as Request, res as Response);

      // Assert
      expect(res.sendNotFound).toHaveBeenCalledWith('Country with id 999 not found');
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      req = mockRequest({
        params: { id: '1' },
        user: { userId: 1 },
      });

      (countryMasterService.delete as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act
      await countryMasterController.delete(req as Request, res as Response);

      // Assert
      expect(res.sendServerError).toHaveBeenCalledWith('Database error');
    });
  });

  describe('hardDelete', () => {
    it('should successfully hard delete country', async () => {
      // Arrange
      req = mockRequest({
        params: { id: '1' },
      });

      (countryMasterService.hardDelete as jest.Mock).mockResolvedValue(true);

      // Act
      await countryMasterController.hardDelete(req as Request, res as Response);

      // Assert
      expect(countryMasterService.hardDelete).toHaveBeenCalledWith(1);
      expect(res.sendSuccess).toHaveBeenCalledWith(null, 'Country permanently deleted');
    });

    it('should return not found when country does not exist', async () => {
      // Arrange
      req = mockRequest({
        params: { id: '999' },
      });

      (countryMasterService.hardDelete as jest.Mock).mockResolvedValue(false);

      // Act
      await countryMasterController.hardDelete(req as Request, res as Response);

      // Assert
      expect(res.sendNotFound).toHaveBeenCalledWith('Country with id 999 not found');
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      req = mockRequest({
        params: { id: '1' },
      });

      (countryMasterService.hardDelete as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act
      await countryMasterController.hardDelete(req as Request, res as Response);

      // Assert
      expect(res.sendServerError).toHaveBeenCalledWith('Database error');
    });
  });

  describe('findAllActive', () => {
    it('should successfully return all active countries', async () => {
      // Arrange
      req = mockRequest({});
      const activeCountries = [mockCountry];

      (countryMasterService.findAllActive as jest.Mock).mockResolvedValue(activeCountries);

      // Act
      await countryMasterController.findAllActive(req as Request, res as Response);

      // Assert
      expect(countryMasterService.findAllActive).toHaveBeenCalled();
      expect(res.sendSuccess).toHaveBeenCalledWith(activeCountries, 'Active countries retrieved successfully');
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      req = mockRequest({});

      (countryMasterService.findAllActive as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act
      await countryMasterController.findAllActive(req as Request, res as Response);

      // Assert
      expect(res.sendServerError).toHaveBeenCalledWith('Database error');
    });

    it('should handle errors without message', async () => {
      // Arrange
      req = mockRequest({});

      (countryMasterService.findAllActive as jest.Mock).mockRejectedValue({});

      // Act
      await countryMasterController.findAllActive(req as Request, res as Response);

      // Assert
      expect(res.sendServerError).toHaveBeenCalledWith('Failed to retrieve active countries');
    });
  });
});
