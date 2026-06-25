import { logger } from '@config/logger';
import { RedisTTL } from '@config/redis';
import redisService from '@helpers/redis.helper';
import CountryMaster, { CountryMasterCreationAttributes } from '@models/country-master.model';
import countryRepository from '@repositories/country.repository';
import { Transaction } from 'sequelize';

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
      const country = await countryRepository.withTransaction(async (transaction: Transaction) => {
        const newCountry = await countryRepository.create(
          {
            ...data,
            created_by: userId || null,
            updated_by: userId || null,
          },
          { transaction }
        );

        return newCountry;
      });

      // Invalidate list caches after transaction commits
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
      const { page = 1, limit = 10, search, status, sortBy = 'name', sortOrder = 'ASC' } = options;

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

      // Use repository method with filters
      const { rows, count } = await countryRepository.findWithFilters(
        page,
        limit,
        search,
        status,
        sortBy,
        sortOrder
      );

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

      const country = await countryRepository.findById(id);

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

      const country = await countryRepository.findByCode(code);

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
      const country = await countryRepository.findById(id);

      if (!country) {
        return null;
      }

      const oldCode = country.code;

      const updatedCountry = await countryRepository.withTransaction(
        async (transaction: Transaction) => {
          // Update within transaction
          await country.update(
            {
              ...data,
              updated_by: userId || country.updated_by,
            },
            { transaction }
          );
          return country;
        }
      );

      if (!updatedCountry) {
        return null;
      }

      // Invalidate caches after transaction commits
      await this.invalidateCountryCache(id, oldCode);
      // If code was updated, also invalidate the new code cache
      if (data.code && data.code !== oldCode) {
        await redisService.del(CACHE_KEYS.COUNTRY_BY_CODE(data.code));
      }
      await this.invalidateListCaches();

      logger.info(`Country updated: ${updatedCountry.name} (${updatedCountry.code})`);
      return updatedCountry;
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
      const country = await countryRepository.findById(id);

      if (!country) {
        return false;
      }

      const code = country.code;

      const result = await countryRepository.softDelete(id, userId);

      if (result) {
        // Invalidate caches after transaction commits
        await this.invalidateCountryCache(id, code);
        await this.invalidateListCaches();

        logger.info(`Country deleted (soft): ${country.name} (${country.code})`);
      }

      return result;
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
      const country = await countryRepository.findById(id);
      const code = country?.code;

      const result = await countryRepository.withTransaction(async (transaction: Transaction) => {
        return countryRepository.delete(id, { transaction });
      });

      if (result) {
        // Invalidate caches after transaction commits
        await this.invalidateCountryCache(id, code);
        await this.invalidateListCaches();

        logger.info(`Country hard deleted: id ${id}`);
      }

      return result;
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

      const countries = await countryRepository.findAllActive();

      // Cache the result - use LONG TTL as active countries rarely change
      await redisService.set(
        cacheKey,
        countries.map((c) => c.toJSON()),
        RedisTTL.LONG
      );
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
      return countryRepository.isCodeExists(code, excludeId);
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
