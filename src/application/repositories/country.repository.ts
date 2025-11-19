import { Op, FindOptions } from 'sequelize';
import { BaseRepository } from './base.repository';
import CountryMaster, {
  CountryMasterAttributes,
  CountryMasterCreationAttributes,
} from '@models/country-master.model';

/**
 * Country Repository
 * Data access layer for country operations
 */
export class CountryRepository extends BaseRepository<
  CountryMaster,
  CountryMasterAttributes,
  CountryMasterCreationAttributes
> {
  constructor() {
    super(CountryMaster);
  }

  /**
   * Find country by code
   */
  async findByCode(code: string): Promise<CountryMaster | null> {
    return this.findOne({
      where: { code: code.toUpperCase() },
    });
  }

  /**
   * Find all active countries
   */
  async findAllActive(options?: FindOptions): Promise<CountryMaster[]> {
    return this.findAll({
      ...options,
      where: {
        ...(options?.where as any),
        status: 'active',
      },
      order: [['name', 'ASC']],
    });
  }

  /**
   * Check if country code exists
   */
  async isCodeExists(code: string, excludeId?: number): Promise<boolean> {
    const where: any = { code: code.toUpperCase() };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    return this.exists({ where });
  }

  /**
   * Search countries by name or code
   */
  async search(query: string, options?: FindOptions): Promise<CountryMaster[]> {
    return this.findAll({
      ...options,
      where: {
        ...(options?.where as any),
        [Op.or]: [
          { name: { [Op.like]: `%${query}%` } },
          { code: { [Op.like]: `%${query}%` } },
        ],
      },
    });
  }

  /**
   * Soft delete country (set status to inactive)
   */
  async softDelete(id: number, updatedBy?: number): Promise<boolean> {
    const result = await this.update(id, {
      status: 'inactive',
      updated_by: updatedBy,
    } as any);
    return result !== null;
  }

  /**
   * Activate country
   */
  async activate(id: number, updatedBy?: number): Promise<boolean> {
    const result = await this.update(id, {
      status: 'active',
      updated_by: updatedBy,
    } as any);
    return result !== null;
  }

  /**
   * Find with pagination
   */
  async findPaginated(
    page: number = 1,
    limit: number = 10,
    options?: FindOptions
  ): Promise<{ rows: CountryMaster[]; count: number }> {
    const offset = (page - 1) * limit;
    return this.findAndCountAll({
      ...options,
      limit,
      offset,
    });
  }

  /**
   * Find by status with pagination
   */
  async findByStatus(
    status: 'active' | 'inactive',
    page: number = 1,
    limit: number = 10
  ): Promise<{ rows: CountryMaster[]; count: number }> {
    return this.findPaginated(page, limit, {
      where: { status },
      order: [['name', 'ASC']],
    });
  }
}

// Export singleton instance
export const countryRepository = new CountryRepository();
export default countryRepository;
