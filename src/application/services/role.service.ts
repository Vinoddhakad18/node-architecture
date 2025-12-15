import { logger } from '@config/logger';
import Role, { RoleCreationAttributes } from '@models/role.model';
import roleRepository from '@repositories/role.repository';
import { Transaction } from 'sequelize';

/**
 * Query options for listing roles
 */
interface RoleQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean;
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
 * Role Service
 * Handles business logic for role operations
 */
class RoleService {
  /**
   * Create a new role
   */
  async create(data: RoleCreationAttributes, userId?: number): Promise<Role> {
    try {
      const role = await roleRepository.withTransaction(async (transaction: Transaction) => {
        const newRole = await roleRepository.create(
          {
            ...data,
            status: data.status !== undefined ? data.status : true, // Default to active
            created_by: userId || null,
            updated_by: userId || null,
          },
          { transaction }
        );

        return newRole;
      });

      logger.info(`Role created: ${role.name} by user ${userId || 'system'}`);
      return role;
    } catch (error) {
      logger.error('Error creating role:', error);
      throw error;
    }
  }

  /**
   * Get all roles with pagination and filtering
   */
  async findAll(options: RoleQueryOptions = {}): Promise<PaginatedResult<Role>> {
    try {
      const { page = 1, limit = 10, search, status, sortBy = 'name', sortOrder = 'ASC' } = options;

      // Use repository method with filters
      const { rows, count } = await roleRepository.findWithFilters(
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

      return result;
    } catch (error) {
      logger.error('Error fetching roles:', error);
      throw error;
    }
  }

  /**
   * Get role by ID
   */
  async findById(id: number): Promise<Role | null> {
    try {
      const role = await roleRepository.findById(id);
      return role;
    } catch (error) {
      logger.error(`Error fetching role with id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get role by name
   */
  async findByName(name: string): Promise<Role | null> {
    try {
      const role = await roleRepository.findByName(name);
      return role;
    } catch (error) {
      logger.error(`Error fetching role with name ${name}:`, error);
      throw error;
    }
  }

  /**
   * Update role
   */
  async update(
    id: number,
    data: Partial<RoleCreationAttributes>,
    userId?: number
  ): Promise<Role | null> {
    try {
      const role = await roleRepository.findById(id);

      if (!role) {
        return null;
      }

      const updatedRole = await roleRepository.withTransaction(
        async (transaction: Transaction) => {
          // Update within transaction
          await role.update(
            {
              ...data,
              updated_by: userId || role.updated_by,
            },
            { transaction }
          );
          return role;
        }
      );

      if (!updatedRole) {
        return null;
      }

      logger.info(`Role updated: ${updatedRole.name} by user ${userId || 'system'}`);
      return updatedRole;
    } catch (error) {
      logger.error(`Error updating role with id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete role (soft delete by setting status to inactive)
   */
  async delete(id: number, userId?: number): Promise<boolean> {
    try {
      const role = await roleRepository.findById(id);

      if (!role) {
        return false;
      }

      const result = await roleRepository.softDelete(id, userId);

      if (result) {
        logger.info(`Role deleted (soft): ${role.name} by user ${userId || 'system'}`);
      }

      return result;
    } catch (error) {
      logger.error(`Error deleting role with id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all active roles (for dropdowns)
   */
  async findAllActive(): Promise<Role[]> {
    try {
      const roles = await roleRepository.findAllActive();
      return roles;
    } catch (error) {
      logger.error('Error fetching active roles:', error);
      throw error;
    }
  }

  /**
   * Check if role name exists
   */
  async isNameExists(name: string, excludeId?: number): Promise<boolean> {
    try {
      return roleRepository.isNameExists(name, excludeId);
    } catch (error) {
      logger.error(`Error checking role name ${name}:`, error);
      throw error;
    }
  }
}

export default new RoleService();

