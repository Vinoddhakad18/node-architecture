/**
 * Integration Tests for Country Master Controller
 */

import { Request, Response } from 'express';
import countryMasterService from '@services/country-master.service';
import countryMasterController from '@controllers/country-master.controller';
import { mockRequest } from '../../../tests/helpers/test-helpers';
import { jest } from '@jest/globals';
import { describe, it, expect, beforeEach } from '@jest/globals';
// Mock dependencies
jest.mock('@services/country-master.service');

jest.mock('@config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Typed service mock
const mockedCountryMasterService =
  countryMasterService as jest.Mocked<typeof countryMasterService>;

const mockResponse = () => {
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
};

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
      req = mockRequest({
        query: {
          page: '1',
          limit: '10',
        },
      });

      mockedCountryMasterService.findAll.mockResolvedValue(
        mockPaginatedResult as any
      );

      await countryMasterController.findAll(
        req as Request,
        res as Response
      );

      expect(
        mockedCountryMasterService.findAll
      ).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        status: undefined,
        sortBy: 'name',
        sortOrder: 'ASC',
      });

      expect(res.sendSuccess).toHaveBeenCalledWith(
        mockPaginatedResult,
        'Countries retrieved successfully'
      );
    });

    it('should apply filters correctly', async () => {
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

      mockedCountryMasterService.findAll.mockResolvedValue(
        mockPaginatedResult as any
      );

      await countryMasterController.findAll(
        req as Request,
        res as Response
      );

      expect(
        mockedCountryMasterService.findAll
      ).toHaveBeenCalledWith({
        page: 2,
        limit: 20,
        search: 'United',
        status: 'active',
        sortBy: 'code',
        sortOrder: 'DESC',
      });
    });

    it('should handle service errors gracefully', async () => {
      req = mockRequest({
        query: {},
      });

      mockedCountryMasterService.findAll.mockRejectedValue(
        new Error('Database error')
      );

      await countryMasterController.findAll(
        req as Request,
        res as Response
      );

      expect(res.sendServerError).toHaveBeenCalledWith(
        'Database error'
      );
    });

    it('should handle errors without message', async () => {
      req = mockRequest({
        query: {},
      });

      mockedCountryMasterService.findAll.mockRejectedValue(
        new Error()
      );

      await countryMasterController.findAll(
        req as Request,
        res as Response
      );

      expect(res.sendServerError).toHaveBeenCalledWith(
        'Failed to retrieve countries'
      );
    });
  });
});