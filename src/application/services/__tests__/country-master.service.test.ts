/**
 * Unit Tests for Country Master Service
 * Tests business logic for country master operations
 */

import countryMasterService from '../country-master.service';
import CountryMaster from '../../models/country-master.model';
import redisService from '../../helpers/redis.helper';

// Mock dependencies
jest.mock('../../models/country-master.model');
jest.mock('../../helpers/redis.helper');
jest.mock('../../config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('CountryMasterService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Mock country data
  const mockCountryData = {
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

  const mockCountry = {
    ...mockCountryData,
    toJSON: jest.fn().mockReturnValue(mockCountryData),
    update: jest.fn(),
  };

  describe('create', () => {
    const createData = {
      name: 'United States',
      code: 'US',
      currency_code: 'USD',
      status: 'active' as const,
    };

    it('should successfully create a new country', async () => {
      // Arrange
      (CountryMaster.create as jest.Mock).mockResolvedValue(mockCountry);
      (redisService.del as jest.Mock).mockResolvedValue(true);
      (redisService.keys as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await countryMasterService.create(createData, 1);

      // Assert
      expect(CountryMaster.create).toHaveBeenCalledWith(
        {
          ...createData,
          created_by: 1,
          updated_by: 1,
        },
        expect.objectContaining({ transaction: expect.anything() })
      );
      expect(result).toEqual(mockCountry);
    });

    it('should create country with null user id when not provided', async () => {
      // Arrange
      (CountryMaster.create as jest.Mock).mockResolvedValue(mockCountry);
      (redisService.del as jest.Mock).mockResolvedValue(true);
      (redisService.keys as jest.Mock).mockResolvedValue([]);

      // Act
      await countryMasterService.create(createData);

      // Assert
      expect(CountryMaster.create).toHaveBeenCalledWith(
        {
          ...createData,
          created_by: null,
          updated_by: null,
        },
        expect.objectContaining({ transaction: expect.anything() })
      );
    });

    it('should invalidate list caches after creation', async () => {
      // Arrange
      (CountryMaster.create as jest.Mock).mockResolvedValue(mockCountry);
      (redisService.del as jest.Mock).mockResolvedValue(true);
      (redisService.keys as jest.Mock).mockResolvedValue(['countries:list:test']);

      // Act
      await countryMasterService.create(createData, 1);

      // Assert
      expect(redisService.del).toHaveBeenCalledWith('countries:active');
      expect(redisService.keys).toHaveBeenCalledWith('countries:list:*');
    });

    it('should throw error when database operation fails', async () => {
      // Arrange
      const dbError = new Error('Database error');
      (CountryMaster.create as jest.Mock).mockRejectedValue(dbError);

      // Act & Assert
      await expect(countryMasterService.create(createData, 1)).rejects.toThrow('Database error');
    });
  });

  describe('findAll', () => {
    const mockPaginatedResult = {
      rows: [mockCountry],
      count: 1,
    };

    it('should return paginated countries with default options', async () => {
      // Arrange
      (redisService.get as jest.Mock).mockResolvedValue(null);
      (CountryMaster.findAndCountAll as jest.Mock).mockResolvedValue(mockPaginatedResult);
      (redisService.set as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await countryMasterService.findAll();

      // Assert
      expect(result).toEqual({
        data: [mockCountry],
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    it('should return cached result when available', async () => {
      // Arrange
      const cachedResult = {
        data: [mockCountryData],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      (redisService.get as jest.Mock).mockResolvedValue(cachedResult);

      // Act
      const result = await countryMasterService.findAll();

      // Assert
      expect(result).toEqual(cachedResult);
      expect(CountryMaster.findAndCountAll).not.toHaveBeenCalled();
    });

    it('should apply search filter correctly', async () => {
      // Arrange
      (redisService.get as jest.Mock).mockResolvedValue(null);
      (CountryMaster.findAndCountAll as jest.Mock).mockResolvedValue(mockPaginatedResult);
      (redisService.set as jest.Mock).mockResolvedValue(true);

      // Act
      await countryMasterService.findAll({ search: 'United' });

      // Assert
      const callArgs = (CountryMaster.findAndCountAll as jest.Mock).mock.calls[0][0];
      expect(callArgs.where).toBeDefined();
    });

    it('should apply status filter correctly', async () => {
      // Arrange
      (redisService.get as jest.Mock).mockResolvedValue(null);
      (CountryMaster.findAndCountAll as jest.Mock).mockResolvedValue(mockPaginatedResult);
      (redisService.set as jest.Mock).mockResolvedValue(true);

      // Act
      await countryMasterService.findAll({ status: 'active' });

      // Assert
      const callArgs = (CountryMaster.findAndCountAll as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.status).toBe('active');
    });

    it('should apply pagination correctly', async () => {
      // Arrange
      (redisService.get as jest.Mock).mockResolvedValue(null);
      (CountryMaster.findAndCountAll as jest.Mock).mockResolvedValue(mockPaginatedResult);
      (redisService.set as jest.Mock).mockResolvedValue(true);

      // Act
      await countryMasterService.findAll({ page: 2, limit: 20 });

      // Assert
      const callArgs = (CountryMaster.findAndCountAll as jest.Mock).mock.calls[0][0];
      expect(callArgs.offset).toBe(20);
      expect(callArgs.limit).toBe(20);
    });

    it('should apply sorting correctly', async () => {
      // Arrange
      (redisService.get as jest.Mock).mockResolvedValue(null);
      (CountryMaster.findAndCountAll as jest.Mock).mockResolvedValue(mockPaginatedResult);
      (redisService.set as jest.Mock).mockResolvedValue(true);

      // Act
      await countryMasterService.findAll({ sortBy: 'code', sortOrder: 'DESC' });

      // Assert
      const callArgs = (CountryMaster.findAndCountAll as jest.Mock).mock.calls[0][0];
      expect(callArgs.order).toEqual([['code', 'DESC']]);
    });

    it('should throw error when database operation fails', async () => {
      // Arrange
      (redisService.get as jest.Mock).mockResolvedValue(null);
      (CountryMaster.findAndCountAll as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(countryMasterService.findAll()).rejects.toThrow('Database error');
    });
  });

  describe('findById', () => {
    it('should return country when found', async () => {
      // Arrange
      (redisService.get as jest.Mock).mockResolvedValue(null);
      (CountryMaster.findByPk as jest.Mock).mockResolvedValue(mockCountry);
      (redisService.set as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await countryMasterService.findById(1);

      // Assert
      expect(CountryMaster.findByPk).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockCountry);
    });

    it('should return cached country when available', async () => {
      // Arrange
      (redisService.get as jest.Mock).mockResolvedValue(mockCountryData);

      // Act
      const result = await countryMasterService.findById(1);

      // Assert
      expect(result).toEqual(mockCountryData);
      expect(CountryMaster.findByPk).not.toHaveBeenCalled();
    });

    it('should return null when country not found', async () => {
      // Arrange
      (redisService.get as jest.Mock).mockResolvedValue(null);
      (CountryMaster.findByPk as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await countryMasterService.findById(999);

      // Assert
      expect(result).toBeNull();
    });

    it('should cache country after fetching from database', async () => {
      // Arrange
      (redisService.get as jest.Mock).mockResolvedValue(null);
      (CountryMaster.findByPk as jest.Mock).mockResolvedValue(mockCountry);
      (redisService.set as jest.Mock).mockResolvedValue(true);

      // Act
      await countryMasterService.findById(1);

      // Assert
      expect(redisService.set).toHaveBeenCalled();
    });

    it('should throw error when database operation fails', async () => {
      // Arrange
      (redisService.get as jest.Mock).mockResolvedValue(null);
      (CountryMaster.findByPk as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(countryMasterService.findById(1)).rejects.toThrow('Database error');
    });
  });

  describe('findByCode', () => {
    it('should return country when found by code', async () => {
      // Arrange
      (redisService.get as jest.Mock).mockResolvedValue(null);
      (CountryMaster.findOne as jest.Mock).mockResolvedValue(mockCountry);
      (redisService.set as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await countryMasterService.findByCode('US');

      // Assert
      expect(CountryMaster.findOne).toHaveBeenCalledWith({
        where: { code: 'US' },
      });
      expect(result).toEqual(mockCountry);
    });

    it('should convert code to uppercase', async () => {
      // Arrange
      (redisService.get as jest.Mock).mockResolvedValue(null);
      (CountryMaster.findOne as jest.Mock).mockResolvedValue(mockCountry);
      (redisService.set as jest.Mock).mockResolvedValue(true);

      // Act
      await countryMasterService.findByCode('us');

      // Assert
      expect(CountryMaster.findOne).toHaveBeenCalledWith({
        where: { code: 'US' },
      });
    });

    it('should return cached country when available', async () => {
      // Arrange
      (redisService.get as jest.Mock).mockResolvedValue(mockCountryData);

      // Act
      const result = await countryMasterService.findByCode('US');

      // Assert
      expect(result).toEqual(mockCountryData);
      expect(CountryMaster.findOne).not.toHaveBeenCalled();
    });

    it('should return null when country not found', async () => {
      // Arrange
      (redisService.get as jest.Mock).mockResolvedValue(null);
      (CountryMaster.findOne as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await countryMasterService.findByCode('XX');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const updateData = {
      name: 'United States Updated',
      currency_code: 'USD',
    };

    it('should successfully update country', async () => {
      // Arrange
      (CountryMaster.findByPk as jest.Mock).mockResolvedValue(mockCountry);
      mockCountry.update.mockImplementation(function(this: any, data: any) {
        Object.assign(this, data);
        return Promise.resolve(this);
      });
      (redisService.del as jest.Mock).mockResolvedValue(true);
      (redisService.keys as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await countryMasterService.update(1, updateData, 1);

      // Assert
      expect(mockCountry.update).toHaveBeenCalledWith(
        {
          ...updateData,
          updated_by: 1,
        },
        expect.objectContaining({ transaction: expect.anything() })
      );
      expect(result).toEqual(expect.objectContaining(updateData));
    });

    it('should return null when country not found', async () => {
      // Arrange
      (CountryMaster.findByPk as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await countryMasterService.update(999, updateData, 1);

      // Assert
      expect(result).toBeNull();
    });

    it('should invalidate caches after update', async () => {
      // Arrange
      (CountryMaster.findByPk as jest.Mock).mockResolvedValue(mockCountry);
      mockCountry.update.mockResolvedValue(mockCountry);
      (redisService.del as jest.Mock).mockResolvedValue(true);
      (redisService.keys as jest.Mock).mockResolvedValue([]);

      // Act
      await countryMasterService.update(1, updateData, 1);

      // Assert
      expect(redisService.del).toHaveBeenCalled();
    });

    it('should invalidate both old and new code caches when code is updated', async () => {
      // Arrange
      const updateWithCode = { ...updateData, code: 'USA' };
      (CountryMaster.findByPk as jest.Mock).mockResolvedValue(mockCountry);
      mockCountry.update.mockResolvedValue({ ...mockCountry, code: 'USA' });
      (redisService.del as jest.Mock).mockResolvedValue(true);
      (redisService.keys as jest.Mock).mockResolvedValue([]);

      // Act
      await countryMasterService.update(1, updateWithCode, 1);

      // Assert
      expect(redisService.del).toHaveBeenCalledWith('country:code:USA');
    });

    it('should throw error when database operation fails', async () => {
      // Arrange
      (CountryMaster.findByPk as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(countryMasterService.update(1, updateData, 1)).rejects.toThrow('Database error');
    });
  });

  describe('delete', () => {
    it('should successfully soft delete country', async () => {
      // Arrange
      (CountryMaster.findByPk as jest.Mock).mockResolvedValue(mockCountry);
      mockCountry.update.mockResolvedValue({ ...mockCountry, status: 'inactive' });
      (redisService.del as jest.Mock).mockResolvedValue(true);
      (redisService.keys as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await countryMasterService.delete(1, 1);

      // Assert
      expect(mockCountry.update).toHaveBeenCalledWith(
        {
          status: 'inactive',
          updated_by: 1,
        },
        expect.objectContaining({ transaction: expect.anything() })
      );
      expect(result).toBe(true);
    });

    it('should return false when country not found', async () => {
      // Arrange
      (CountryMaster.findByPk as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await countryMasterService.delete(999, 1);

      // Assert
      expect(result).toBe(false);
    });

    it('should invalidate caches after deletion', async () => {
      // Arrange
      (CountryMaster.findByPk as jest.Mock).mockResolvedValue(mockCountry);
      mockCountry.update.mockResolvedValue({ ...mockCountry, status: 'inactive' });
      (redisService.del as jest.Mock).mockResolvedValue(true);
      (redisService.keys as jest.Mock).mockResolvedValue([]);

      // Act
      await countryMasterService.delete(1, 1);

      // Assert
      expect(redisService.del).toHaveBeenCalled();
    });

    it('should throw error when database operation fails', async () => {
      // Arrange
      (CountryMaster.findByPk as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(countryMasterService.delete(1, 1)).rejects.toThrow('Database error');
    });
  });

  describe('hardDelete', () => {
    it('should successfully hard delete country', async () => {
      // Arrange
      (CountryMaster.findByPk as jest.Mock).mockResolvedValue(mockCountry);
      (CountryMaster.destroy as jest.Mock).mockResolvedValue(1);
      (redisService.del as jest.Mock).mockResolvedValue(true);
      (redisService.keys as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await countryMasterService.hardDelete(1);

      // Assert
      expect(CountryMaster.destroy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
        })
      );
      expect(result).toBe(true);
    });

    it('should return false when country not found', async () => {
      // Arrange
      (CountryMaster.findByPk as jest.Mock).mockResolvedValue(null);
      (CountryMaster.destroy as jest.Mock).mockResolvedValue(0);

      // Act
      const result = await countryMasterService.hardDelete(999);

      // Assert
      expect(result).toBe(false);
    });

    it('should invalidate caches after hard deletion', async () => {
      // Arrange
      (CountryMaster.findByPk as jest.Mock).mockResolvedValue(mockCountry);
      (CountryMaster.destroy as jest.Mock).mockResolvedValue(1);
      (redisService.del as jest.Mock).mockResolvedValue(true);
      (redisService.keys as jest.Mock).mockResolvedValue([]);

      // Act
      await countryMasterService.hardDelete(1);

      // Assert
      expect(redisService.del).toHaveBeenCalled();
    });

    it('should throw error when database operation fails', async () => {
      // Arrange
      (CountryMaster.findByPk as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(countryMasterService.hardDelete(1)).rejects.toThrow('Database error');
    });
  });

  describe('findAllActive', () => {
    const mockActiveCountries = [mockCountry];

    it('should return all active countries', async () => {
      // Arrange
      (redisService.get as jest.Mock).mockResolvedValue(null);
      (CountryMaster.findAll as jest.Mock).mockResolvedValue(mockActiveCountries);
      (redisService.set as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await countryMasterService.findAllActive();

      // Assert
      expect(CountryMaster.findAll).toHaveBeenCalledWith({
        where: { status: 'active' },
        order: [['name', 'ASC']],
      });
      expect(result).toEqual(mockActiveCountries);
    });

    it('should return cached active countries when available', async () => {
      // Arrange
      (redisService.get as jest.Mock).mockResolvedValue([mockCountryData]);

      // Act
      const result = await countryMasterService.findAllActive();

      // Assert
      expect(result).toEqual([mockCountryData]);
      expect(CountryMaster.findAll).not.toHaveBeenCalled();
    });

    it('should cache active countries after fetching', async () => {
      // Arrange
      (redisService.get as jest.Mock).mockResolvedValue(null);
      (CountryMaster.findAll as jest.Mock).mockResolvedValue(mockActiveCountries);
      (redisService.set as jest.Mock).mockResolvedValue(true);

      // Act
      await countryMasterService.findAllActive();

      // Assert
      expect(redisService.set).toHaveBeenCalled();
    });

    it('should throw error when database operation fails', async () => {
      // Arrange
      (redisService.get as jest.Mock).mockResolvedValue(null);
      (CountryMaster.findAll as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(countryMasterService.findAllActive()).rejects.toThrow('Database error');
    });
  });

  describe('isCodeExists', () => {
    it('should return true when code exists', async () => {
      // Arrange
      (CountryMaster.findOne as jest.Mock).mockResolvedValue(mockCountry);

      // Act
      const result = await countryMasterService.isCodeExists('US');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when code does not exist', async () => {
      // Arrange
      (CountryMaster.findOne as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await countryMasterService.isCodeExists('XX');

      // Assert
      expect(result).toBe(false);
    });

    it('should exclude specific id when checking code exists', async () => {
      // Arrange
      (CountryMaster.findOne as jest.Mock).mockResolvedValue(null);

      // Act
      await countryMasterService.isCodeExists('US', 1);

      // Assert
      const callArgs = (CountryMaster.findOne as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.code).toBe('US');
      expect(callArgs.where.id).toBeDefined();
    });

    it('should convert code to uppercase', async () => {
      // Arrange
      (CountryMaster.findOne as jest.Mock).mockResolvedValue(null);

      // Act
      await countryMasterService.isCodeExists('us');

      // Assert
      const callArgs = (CountryMaster.findOne as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.code).toBe('US');
    });

    it('should throw error when database operation fails', async () => {
      // Arrange
      (CountryMaster.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(countryMasterService.isCodeExists('US')).rejects.toThrow('Database error');
    });
  });
});
