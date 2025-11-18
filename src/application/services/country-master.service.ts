import { Op } from 'sequelize';
import CountryMaster, { CountryMasterCreationAttributes } from '../models/country-master.model';
import { logger } from '../config/logger';
import redisService from '../helpers/redis.helper';
import { RedisTTL } from '../config/redis.config';

/**
 * Cache key constants for country-master
 */
const CACHE_KEYS = {
  COUNTRY_BY_ID: (id: number) => `country:id:${id}`,
  COUNTRY_BY_CODE: (code: string) => `country:code:${code.toUpperCase()}`,
  COUNTRIES_ACTIVE: 'countries:active',
  COUNTRIES_LIST: (options: string) => `countries:list:${options}`,
};

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

      // Invalidate list caches
      await this.invalidateListCaches();

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

      // Generate cache key based on query options
      const cacheKey = CACHE_KEYS.COUNTRIES_LIST(
        JSON.stringify({ page, limit, search, status, sortBy, sortOrder })
      );

      // Try to get from cache
      const cached = await redisService.get<PaginatedResult<CountryMaster>>(cacheKey);
      if (cached) {
        logger.debug(`Cache hit for countries list: ${cacheKey}`);
        return cached;
      }

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

      const result = {
        data: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      };

      // Cache the result
      await redisService.set(cacheKey, result, RedisTTL.MEDIUM);
      logger.debug(`Cache set for countries list: ${cacheKey}`);

      return result;
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
      const cacheKey = CACHE_KEYS.COUNTRY_BY_ID(id);

      // Try to get from cache
      const cached = await redisService.get<CountryMaster>(cacheKey);
      if (cached) {
        logger.debug(`Cache hit for country id: ${id}`);
        return cached;
      }

      const country = await CountryMaster.findByPk(id);

      if (country) {
        // Cache the result
        await redisService.set(cacheKey, country.toJSON(), RedisTTL.LONG);
        logger.debug(`Cache set for country id: ${id}`);
      }

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
      const cacheKey = CACHE_KEYS.COUNTRY_BY_CODE(code);

      // Try to get from cache
      const cached = await redisService.get<CountryMaster>(cacheKey);
      if (cached) {
        logger.debug(`Cache hit for country code: ${code}`);
        return cached;
      }

      const country = await CountryMaster.findOne({
        where: { code: code.toUpperCase() },
      });

      if (country) {
        // Cache the result
        await redisService.set(cacheKey, country.toJSON(), RedisTTL.LONG);
        logger.debug(`Cache set for country code: ${code}`);
      }

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

      const oldCode = country.code;

      await country.update({
        ...data,
        updated_by: userId || country.updated_by,
      });

      // Invalidate caches
      await this.invalidateCountryCache(id, oldCode);
      // If code was updated, also invalidate the new code cache
      if (data.code && data.code !== oldCode) {
        await redisService.del(CACHE_KEYS.COUNTRY_BY_CODE(data.code));
      }
      await this.invalidateListCaches();

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

      const code = country.code;

      await country.update({
        status: 'inactive',
        updated_by: userId || country.updated_by,
      });

      // Invalidate caches
      await this.invalidateCountryCache(id, code);
      await this.invalidateListCaches();

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
      // Get country data before deletion for cache invalidation
      const country = await CountryMaster.findByPk(id);
      const code = country?.code;

      const result = await CountryMaster.destroy({
        where: { id },
      });

      if (result > 0) {
        // Invalidate caches
        await this.invalidateCountryCache(id, code);
        await this.invalidateListCaches();

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
      const cacheKey = CACHE_KEYS.COUNTRIES_ACTIVE;

      // Try to get from cache
      const cached = await redisService.get<CountryMaster[]>(cacheKey);
      if (cached) {
        logger.debug('Cache hit for active countries');
        return cached;
      }

      const countries = await CountryMaster.findAll({
        where: { status: 'active' },
        order: [['name', 'ASC']],
      });

      // Cache the result - use LONG TTL as active countries rarely change
      await redisService.set(cacheKey, countries.map(c => c.toJSON()), RedisTTL.LONG);
      logger.debug('Cache set for active countries');

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

  /**
   * Invalidate cache for a specific country
   */
  private async invalidateCountryCache(id: number, code?: string): Promise<void> {
    try {
      const keysToDelete = [CACHE_KEYS.COUNTRY_BY_ID(id)];

      if (code) {
        keysToDelete.push(CACHE_KEYS.COUNTRY_BY_CODE(code));
      }

      await redisService.del(keysToDelete);
      logger.debug(`Cache invalidated for country id: ${id}, code: ${code}`);
    } catch (error) {
      logger.error('Error invalidating country cache:', error);
      // Don't throw - cache invalidation failure shouldn't break the operation
    }
  }

  /**
   * Invalidate all list caches (findAll, findAllActive)
   */
  private async invalidateListCaches(): Promise<void> {
    try {
      // Delete active countries cache
      await redisService.del(CACHE_KEYS.COUNTRIES_ACTIVE);

      // Delete all list caches by pattern
      const listKeys = await redisService.keys('countries:list:*');
      if (listKeys.length > 0) {
        await redisService.del(listKeys);
      }

      logger.debug('List caches invalidated for countries');
    } catch (error) {
      logger.error('Error invalidating list caches:', error);
      // Don't throw - cache invalidation failure shouldn't break the operation
    }
  }
}

export default new CountryMasterService();
