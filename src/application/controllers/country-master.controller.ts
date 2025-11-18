import { Request, Response } from 'express';
import countryMasterService from '../services/country-master.service';
import { logger } from '../config/logger';

/**
 * Country Master Controller
 * Handles HTTP requests for country master operations
 */
class CountryMasterController {
  /**
   * Create a new country
   * POST /api/v1/countries
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, code, currency_code, status } = req.body;
      const userId = (req as any).user?.userId;

      // Check if code already exists
      const codeExists = await countryMasterService.isCodeExists(code);
      if (codeExists) {
        res.sendConflict(`Country with code '${code}' already exists`);
        return;
      }

      const country = await countryMasterService.create(
        { name, code: code.toUpperCase(), currency_code, status },
        userId
      );

      res.sendCreated(country, 'Country created successfully');
    } catch (error: any) {
      logger.error('Error in create country controller:', error);
      res.sendServerError(error.message || 'Failed to create country');
    }
  }

  /**
   * Get all countries with pagination
   * GET /api/v1/countries
   */
  async findAll(req: Request, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        sortBy = 'name',
        sortOrder = 'ASC',
      } = req.query;

      const result = await countryMasterService.findAll({
        page: Number(page),
        limit: Number(limit),
        search: search as string,
        status: status as 'active' | 'inactive',
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'ASC' | 'DESC',
      });

      res.sendSuccess(result, 'Countries retrieved successfully');
    } catch (error: any) {
      logger.error('Error in findAll countries controller:', error);
      res.sendServerError(error.message || 'Failed to retrieve countries');
    }
  }

  /**
   * Get country by ID
   * GET /api/v1/countries/:id
   */
  async findById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const country = await countryMasterService.findById(Number(id));

      if (!country) {
        res.sendNotFound(`Country with id ${id} not found`);
        return;
      }

      res.sendSuccess(country, 'Country retrieved successfully');
    } catch (error: any) {
      logger.error('Error in findById country controller:', error);
      res.sendServerError(error.message || 'Failed to retrieve country');
    }
  }

  /**
   * Get country by code
   * GET /api/v1/countries/code/:code
   */
  async findByCode(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;

      const country = await countryMasterService.findByCode(code);

      if (!country) {
        res.sendNotFound(`Country with code '${code}' not found`);
        return;
      }

      res.sendSuccess(country, 'Country retrieved successfully');
    } catch (error: any) {
      logger.error('Error in findByCode country controller:', error);
      res.sendServerError(error.message || 'Failed to retrieve country');
    }
  }

  /**
   * Update country
   * PUT /api/v1/countries/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, code, currency_code, status } = req.body;
      const userId = (req as any).user?.userId;

      // Check if code already exists (excluding current record)
      if (code) {
        const codeExists = await countryMasterService.isCodeExists(code, Number(id));
        if (codeExists) {
          res.sendConflict(`Country with code '${code}' already exists`);
          return;
        }
      }

      const country = await countryMasterService.update(
        Number(id),
        {
          name,
          code: code?.toUpperCase(),
          currency_code,
          status,
        },
        userId
      );

      if (!country) {
        res.sendNotFound(`Country with id ${id} not found`);
        return;
      }

      res.sendSuccess(country, 'Country updated successfully');
    } catch (error: any) {
      logger.error('Error in update country controller:', error);
      res.sendServerError(error.message || 'Failed to update country');
    }
  }

  /**
   * Delete country (soft delete)
   * DELETE /api/v1/countries/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;

      const deleted = await countryMasterService.delete(Number(id), userId);

      if (!deleted) {
        res.sendNotFound(`Country with id ${id} not found`);
        return;
      }

      res.sendSuccess(null, 'Country deleted successfully');
    } catch (error: any) {
      logger.error('Error in delete country controller:', error);
      res.sendServerError(error.message || 'Failed to delete country');
    }
  }

  /**
   * Hard delete country
   * DELETE /api/v1/countries/:id/permanent
   */
  async hardDelete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const deleted = await countryMasterService.hardDelete(Number(id));

      if (!deleted) {
        res.sendNotFound(`Country with id ${id} not found`);
        return;
      }

      res.sendSuccess(null, 'Country permanently deleted');
    } catch (error: any) {
      logger.error('Error in hardDelete country controller:', error);
      res.sendServerError(error.message || 'Failed to permanently delete country');
    }
  }

  /**
   * Get all active countries (for dropdowns)
   * GET /api/v1/countries/active/list
   */
  async findAllActive(req: Request, res: Response): Promise<void> {
    try {
      const countries = await countryMasterService.findAllActive();

      res.sendSuccess(countries, 'Active countries retrieved successfully');
    } catch (error: any) {
      logger.error('Error in findAllActive countries controller:', error);
      res.sendServerError(error.message || 'Failed to retrieve active countries');
    }
  }
}

export default new CountryMasterController();
