import RoleMenuPermission, {
  RoleMenuPermissionAttributes,
  RoleMenuPermissionCreationAttributes,
} from '@models/role-menu-permission.model';
import { FindOptions, WhereOptions, Transaction, QueryTypes, UpdateOptions } from 'sequelize';
import { sequelize } from '@config/database';

import { BaseRepository } from './base.repository';

/**
 * Role Menu Permission Repository
 * Data access layer for role-menu-permission operations
 */
export class RoleMenuPermissionRepository extends BaseRepository<
  RoleMenuPermission,
  RoleMenuPermissionAttributes,
  RoleMenuPermissionCreationAttributes
> {
  constructor() {
    super(RoleMenuPermission);
  }

  /**
   * Find permission by role_id and menu_id
   */
  async findByRoleAndMenu(
    roleId: number,
    menuId: number,
    options?: FindOptions
  ): Promise<RoleMenuPermission | null> {
    return this.findOne({
      ...options,
      where: {
        ...(options?.where as WhereOptions<RoleMenuPermissionAttributes>),
        role_id: roleId,
        menu_id: menuId,
      } as WhereOptions<RoleMenuPermissionAttributes>,
    });
  }

  /**
   * Find all permissions for a role
   */
  async findByRoleId(roleId: number, options?: FindOptions): Promise<RoleMenuPermission[]> {
    return this.findAll({
      ...options,
      where: {
        ...(options?.where as WhereOptions<RoleMenuPermissionAttributes>),
        role_id: roleId,
      } as WhereOptions<RoleMenuPermissionAttributes>,
      include: options?.include,
    });
  }

  /**
   * Find all permissions for a menu
   */
  async findByMenuId(menuId: number, options?: FindOptions): Promise<RoleMenuPermission[]> {
    return this.findAll({
      ...options,
      where: {
        ...(options?.where as WhereOptions<RoleMenuPermissionAttributes>),
        menu_id: menuId,
      } as WhereOptions<RoleMenuPermissionAttributes>,
    });
  }

  /**
   * Update a record by ID
   * Overrides base method to ensure record is reloaded after update
   */
  async update(
    id: number,
    data: Partial<RoleMenuPermissionAttributes>,
    options?: UpdateOptions
  ): Promise<RoleMenuPermission | null> {
    const record = await this.findById(id);
    if (!record) {
      return null;
    }

    await record.update(data as Partial<RoleMenuPermission>, options);

    // Reload the record to get the latest values from database
    await record.reload();

    return record;
  }

  /**
   * Update permission by role_id and menu_id
   * If record not found, creates a new record with the provided data
   * This is the preferred method for updating role-menu permissions
   */
  async updateByRoleAndMenu(
    roleId: number,
    menuId: number,
    data: Partial<RoleMenuPermissionAttributes>,
    transaction?: Transaction
  ): Promise<RoleMenuPermission> {
    const record = await this.findByRoleAndMenu(roleId, menuId, {
      transaction,
    });

    if (!record) {
      // Record not found, create a new one
      const createData: RoleMenuPermissionCreationAttributes = {
        role_id: roleId,
        menu_id: menuId,
        can_view: data.can_view ?? false,
        can_add: data.can_add ?? false,
        can_edit: data.can_edit ?? false,
        can_delete: data.can_delete ?? false,
        can_export: data.can_export ?? false,
        can_status: data.can_status ?? false,
      };

      const newRecord = await this.create(createData, {
        transaction,
      });

      return newRecord;
    }

    // Record exists, update it
    await record.update(data as Partial<RoleMenuPermission>, {
      transaction,
    });

    // Reload the record to get the latest values from database
    await record.reload({ transaction });

    return record;
  }

  /**
   * Upsert permission (create or update)
   * Uses MySQL's native INSERT ... ON DUPLICATE KEY UPDATE for reliable upserts
   * This handles composite unique keys (role_id, menu_id) correctly
   */
  async upsert(
    data: RoleMenuPermissionCreationAttributes,
    transaction?: Transaction
  ): Promise<RoleMenuPermission> {
    const updateData = {
      can_view: data.can_view ?? false,
      can_add: data.can_add ?? false,
      can_edit: data.can_edit ?? false,
      can_delete: data.can_delete ?? false,
      can_export: data.can_export ?? false,
      can_status: data.can_status ?? false,
    };

    // Use raw SQL with INSERT ... ON DUPLICATE KEY UPDATE for reliable upsert
    // This works correctly with composite unique keys
    // Using explicit values in UPDATE clause (more reliable than VALUES() function)
    const canView = updateData.can_view ? 1 : 0;
    const canAdd = updateData.can_add ? 1 : 0;
    const canEdit = updateData.can_edit ? 1 : 0;
    const canDelete = updateData.can_delete ? 1 : 0;
    const canExport = updateData.can_export ? 1 : 0;
    const canStatus = updateData.can_status ? 1 : 0;

    const sql = `
      INSERT INTO role_menu_permissions 
        (role_id, menu_id, can_view, can_add, can_edit, can_delete, can_export, can_status, created_at, updated_at)
      VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      ON DUPLICATE KEY UPDATE
        can_view = ?,
        can_add = ?,
        can_edit = ?,
        can_delete = ?,
        can_export = ?,
        can_status = ?,
        updated_at = NOW()
    `;

    // Replacements: first set for INSERT, second set for UPDATE
    const replacements = [
      data.role_id,
      data.menu_id,
      canView,
      canAdd,
      canEdit,
      canDelete,
      canExport,
      canStatus,
      // UPDATE values (same as INSERT values)
      canView,
      canAdd,
      canEdit,
      canDelete,
      canExport,
      canStatus,
    ];

    try {
      const { logger } = await import('@config/logger');

      logger.info('Executing upsert SQL', {
        role_id: data.role_id,
        menu_id: data.menu_id,
        updateData,
        sql: sql.replace(/\s+/g, ' ').trim(),
        replacements,
      });

      const [result, metadata] = await sequelize.query(sql, {
        replacements,
        type: QueryTypes.INSERT,
        transaction,
      });

      logger.info('Upsert SQL executed successfully', {
        role_id: data.role_id,
        menu_id: data.menu_id,
        result,
        affectedRows: metadata ? (metadata as any).affectedRows : 'unknown',
      });

      // Fetch and return the updated/created record
      // Use a fresh query to ensure we get the latest data
      const record = await this.findByRoleAndMenu(data.role_id, data.menu_id, {
        transaction,
        useMaster: true, // Force read from master
      });

      if (!record) {
        // Try one more time with a direct query
        logger.warn('Record not found after upsert, trying direct query', {
          role_id: data.role_id,
          menu_id: data.menu_id,
        });

        const directRecord = await this.model.findOne({
          where: {
            role_id: data.role_id,
            menu_id: data.menu_id,
          },
          transaction,
          useMaster: true,
        });

        if (!directRecord) {
          throw new Error(
            `Failed to retrieve permission after upsert for role ${data.role_id}, menu ${data.menu_id}`
          );
        }

        logger.info('Found record via direct query', {
          role_id: data.role_id,
          menu_id: data.menu_id,
          can_view: directRecord.can_view,
          can_add: directRecord.can_add,
        });

        return directRecord;
      }

      logger.info('Retrieved record after upsert', {
        role_id: data.role_id,
        menu_id: data.menu_id,
        can_view: record.can_view,
        can_add: record.can_add,
        can_edit: record.can_edit,
        can_delete: record.can_delete,
        can_export: record.can_export,
        can_status: record.can_status,
      });

      return record;
    } catch (error) {
      // Log the error for debugging
      const { logger } = await import('@config/logger');
      logger.error('Error in upsert permission:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        data: {
          role_id: data.role_id,
          menu_id: data.menu_id,
          updateData,
        },
        sql,
        replacements,
      });
      throw error;
    }
  }

  /**
   * Bulk upsert permissions
   */
  async bulkUpsert(
    data: RoleMenuPermissionCreationAttributes[],
    transaction?: Transaction
  ): Promise<RoleMenuPermission[]> {
    const results: RoleMenuPermission[] = [];

    for (const item of data) {
      const record = await this.upsert(item, transaction);
      results.push(record);
    }

    return results;
  }

  /**
   * Delete all permissions for a role
   */
  async deleteByRoleId(roleId: number, transaction?: Transaction): Promise<boolean> {
    const result = await this.model.destroy({
      where: { role_id: roleId } as WhereOptions<RoleMenuPermissionAttributes>,
      transaction,
    });
    return result > 0;
  }

  /**
   * Delete permissions for a role and menu
   */
  async deleteByRoleAndMenu(
    roleId: number,
    menuId: number,
    transaction?: Transaction
  ): Promise<boolean> {
    const result = await this.model.destroy({
      where: {
        role_id: roleId,
        menu_id: menuId,
      } as WhereOptions<RoleMenuPermissionAttributes>,
      transaction,
    });
    return result > 0;
  }
}

// Export singleton instance
export const roleMenuPermissionRepository = new RoleMenuPermissionRepository();
export default roleMenuPermissionRepository;
