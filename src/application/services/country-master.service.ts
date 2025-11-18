import { Op } from 'sequelize';
import CountryMaster, { CountryMasterCreationAttributes } from '../models/country-master.model';
import { logger } from '../config/logger';

/**
 * Query options for listing countries
 */
interface CountryQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Paginated result interface
 */
interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Country Master Service
 * Handles business logic for country master operations
 */
class CountryMasterService {
  /**
   * Create a new country
   */
  async create(data: CountryMasterCreationAttributes, userId?: number): Promise<CountryMaster> {
    try {
      const country = await CountryMaster.create({
        ...data,
        created_by: userId || null,
        updated_by: userId || null,
      });

      logger.info(`Country created: ${country.name} (${country.code})`);
      return country;
    } catch (error) {
      logger.error('Error creating country:', error);
      throw error;
    }
  }

  /**
   * Get all countries with pagination and filtering
   */
  async findAll(options: CountryQueryOptions = {}): Promise<PaginatedResult<CountryMaster>> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        sortBy = 'name',
        sortOrder = 'ASC',
      } = options;

      const offset = (page - 1) * limit;
      const where: any = {};

      // Apply search filter
      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { code: { [Op.like]: `%${search}%` } },
        ];
      }

      // Apply status filter
      if (status) {
        where.status = status;
      }

      const { rows, count } = await CountryMaster.findAndCountAll({
        where,
        limit,
        offset,
        order: [[sortBy, sortOrder]],
      });

      return {
        data: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching countries:', error);
      throw error;
    }
  }

  /**
   * Get country by ID
   */
  async findById(id: number): Promise<CountryMaster | null> {
    try {
      const country = await CountryMaster.findByPk(id);
      return country;
    } catch (error) {
      logger.error(`Error fetching country with id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get country by code
   */
  async findByCode(code: string): Promise<CountryMaster | null> {
    try {
      const country = await CountryMaster.findOne({
        where: { code: code.toUpperCase() },
      });
      return country;
    } catch (error) {
      logger.error(`Error fetching country with code ${code}:`, error);
      throw error;
    }
  }

  /**
   * Update country
   */
  async update(
    id: number,
    data: Partial<CountryMasterCreationAttributes>,
    userId?: number
  ): Promise<CountryMaster | null> {
    try {
      const country = await CountryMaster.findByPk(id);

      if (!country) {
        return null;
      }

      await country.update({
        ...data,
        updated_by: userId || country.updated_by,
      });

      logger.info(`Country updated: ${country.name} (${country.code})`);
      return country;
    } catch (error) {
      logger.error(`Error updating country with id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete country (soft delete by setting status to inactive)
   */
  async delete(id: number, userId?: number): Promise<boolean> {
    try {
      const country = await CountryMaster.findByPk(id);

      if (!country) {
        return false;
      }

      await country.update({
        status: 'inactive',
        updated_by: userId || country.updated_by,
      });

      logger.info(`Country deleted (soft): ${country.name} (${country.code})`);
      return true;
    } catch (error) {
      logger.error(`Error deleting country with id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Hard delete country
   */
  async hardDelete(id: number): Promise<boolean> {
    try {
      const result = await CountryMaster.destroy({
        where: { id },
      });

      if (result > 0) {
        logger.info(`Country hard deleted: id ${id}`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error(`Error hard deleting country with id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all active countries (for dropdowns)
   */
  async findAllActive(): Promise<CountryMaster[]> {
    try {
      const countries = await CountryMaster.findAll({
        where: { status: 'active' },
        order: [['name', 'ASC']],
      });
      return countries;
    } catch (error) {
      logger.error('Error fetching active countries:', error);
      throw error;
    }
  }

  /**
   * Check if country code exists
   */
  async isCodeExists(code: string, excludeId?: number): Promise<boolean> {
    try {
      const where: any = { code: code.toUpperCase() };
      if (excludeId) {
        where.id = { [Op.ne]: excludeId };
      }

      const country = await CountryMaster.findOne({ where });
      return !!country;
    } catch (error) {
      logger.error(`Error checking country code ${code}:`, error);
      throw error;
    }
  }
}

export default new CountryMasterService();
