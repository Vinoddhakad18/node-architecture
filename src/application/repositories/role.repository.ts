import Role, { RoleAttributes, RoleCreationAttributes } from '@models/role.model';
import { Op, FindOptions, WhereOptions } from 'sequelize';

import { BaseRepository } from './base.repository';

/**
 * Role Repository
 * Data access layer for role operations
 */
export class RoleRepository extends BaseRepository<Role, RoleAttributes, RoleCreationAttributes> {
  constructor() {
    super(Role);
  }

  /**
   * Find role by name
   */
  async findByName(name: string): Promise<Role | null> {
    return this.findOne({
      where: { name },
    });
  }

  /**
   * Find all active roles
   */
  async findAllActive(options?: FindOptions): Promise<Role[]> {
    return this.findAll({
      ...options,
      where: {
        ...(options?.where as WhereOptions<RoleAttributes>),
        status: true,
      } as WhereOptions<RoleAttributes>,
      order: [['name', 'ASC']],
    });
  }

  /**
   * Check if role name exists
   */
  async isNameExists(name: string, excludeId?: number): Promise<boolean> {
    const where: WhereOptions<RoleAttributes> = { name };
    if (excludeId) {
      (where as Record<string, unknown>).id = { [Op.ne]: excludeId };
    }
    return this.exists({ where });
  }

  /**
   * Search roles by name or description
   */
  async search(query: string, options?: FindOptions): Promise<Role[]> {
    return this.findAll({
      ...options,
      where: {
        ...(options?.where as WhereOptions<RoleAttributes>),
        [Op.or]: [
          { name: { [Op.like]: `%${query}%` } },
          { description: { [Op.like]: `%${query}%` } },
        ],
      } as WhereOptions<RoleAttributes>,
    });
  }

  /**
   * Soft delete role (set status to inactive)
   */
  async softDelete(id: number, updatedBy?: number): Promise<boolean> {
    const result = await this.update(
      id,
      {
        status: false,
        updated_by: updatedBy,
      } as Partial<RoleAttributes>
    );
    return result !== null;
  }

  /**
   * Activate role
   */
  async activate(id: number, updatedBy?: number): Promise<boolean> {
    const result = await this.update(
      id,
      {
        status: true,
        updated_by: updatedBy,
      } as Partial<RoleAttributes>
    );
    return result !== null;
  }

  /**
   * Find with pagination and advanced filtering
   */
  async findPaginated(
    page = 1,
    limit = 10,
    options?: FindOptions
  ): Promise<{ rows: Role[]; count: number }> {
    const offset = (page - 1) * limit;
    return this.findAndCountAll({
      ...options,
      limit,
      offset,
    });
  }

  /**
   * Find with search, status filter, and sorting
   */
  async findWithFilters(
    page = 1,
    limit = 10,
    search?: string,
    status?: boolean,
    sortBy = 'name',
    sortOrder: 'ASC' | 'DESC' = 'ASC'
  ): Promise<{ rows: Role[]; count: number }> {
    const offset = (page - 1) * limit;
    const where: WhereOptions<RoleAttributes> = {};

    // Apply search filter
    if (search) {
      Object.assign(where, {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
        ],
      });
    }

    // Apply status filter
    if (status !== undefined) {
      Object.assign(where, { status });
    }

    return this.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });
  }

  /**
   * Find by status with pagination
   */
  async findByStatus(
    status: boolean,
    page = 1,
    limit = 10
  ): Promise<{ rows: Role[]; count: number }> {
    return this.findPaginated(page, limit, {
      where: { status },
      order: [['name', 'ASC']],
    });
  }
}

// Export singleton instance
export const roleRepository = new RoleRepository();
export default roleRepository;
