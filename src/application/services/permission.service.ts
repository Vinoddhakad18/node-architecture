import { logger } from '@config/logger';
import Menu from '@models/menu.model';
import RoleMenuPermission, {
  RoleMenuPermissionCreationAttributes,
} from '@models/role-menu-permission.model';
import roleMenuPermissionRepository from '@repositories/role-menu-permission.repository';
import menuRepository from '@repositories/menu.repository';
import roleRepository from '@repositories/role.repository';
import { Transaction } from 'sequelize';
import {
  MenuPermissionDTO,
  PermissionFlags,
  RolePermissionsResponseDTO,
  UpdatePermissionsRequestDTO,
} from '@dtos/permission.dto';

/**
 * Permission Service
 * Handles business logic for permission operations
 */
class PermissionService {
  /**
   * Get all permissions for a role
   * Returns permissions grouped by menu
   */
  async getRolePermissions(roleId: number): Promise<RolePermissionsResponseDTO> {
    try {
      // Verify role exists
      const role = await roleRepository.findById(roleId);
      if (!role) {
        throw new Error(`Role with id ${roleId} not found`);
      }

      // Get all active menus
      const menus = await menuRepository.findAllActive({
        raw: true,
        nest: true,
      });

      // Get all permissions for this role
      // Use useMaster: true to ensure we read from master (important after writes to avoid replica lag)
      const rolePermissions = await roleMenuPermissionRepository.findByRoleId(roleId, {
        useMaster: true, // Force read from master to get latest data
        raw: true,
        nest: true,
        include: [
          {
            model: Menu,
            as: 'menu',
            attributes: ['id', 'name', 'route'],
          },
        ],
      });
      // Create a map of menu_id -> permissions for quick lookup
      // Note: With raw: true, rolePermissions is an array of plain objects, not Sequelize models
      const permissionMap = new Map<number, any>();
      rolePermissions.forEach((rp: any) => {
        // Access properties directly since raw: true returns plain objects
        const menuId = rp.menu_id as number;
        permissionMap.set(menuId, rp);
      });
      //console.log('Permission Map:', menus);
      // Build response with all menus and their permissions
      const permissions: MenuPermissionDTO[] = menus.map((menu) => {
        const rolePermission = permissionMap.get(menu.id);
        return {
          menuId: menu.id,
          permissions: {
            // Access properties directly since raw: true returns plain objects
            view: rolePermission?.can_view ?? 0,
            add: rolePermission?.can_add ?? 0,
            edit: rolePermission?.can_edit ?? 0,
            delete: rolePermission?.can_delete ?? 0,
            export: rolePermission?.can_export ?? 0,
            status: rolePermission?.can_status ?? 0,
          },
        };
      });

      return {
        roleId,
        permissions,
      };
    } catch (error) {
      logger.error(`Error fetching permissions for role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Apply business logic rules to permissions
   * - If view = false, disable all other permissions
   * - Missing permissions default to false
   */
  private normalizePermissions(permissions: PermissionFlags): PermissionFlags {
    const normalized: PermissionFlags = {
      view: permissions.view ?? 0,
      add: permissions.add ?? 0,
      edit: permissions.edit ?? 0,
      delete: permissions.delete ?? 0,
      export: permissions.export ?? 0,
      status: permissions.status ?? 0,
    };

    // Rule: If view = false, disable all other permissions
    if (!normalized.view) {
      normalized.add = false;
      normalized.edit = false;
      normalized.delete = false;
      normalized.export = false;
      normalized.status = false;
    }

    return normalized;
  }

  /**
   * Update permissions for a role
   * Supports select-all (sets all permissions to true for a menu)
   * Applies business logic rules (view dependency)
   * Uses transactions for atomicity
   */
  async updateRolePermissions(
    data: UpdatePermissionsRequestDTO,
    userId?: number
  ): Promise<RolePermissionsResponseDTO> {
    try {
      // Verify role exists
      const role = await roleRepository.findById(data.roleId);
      if (!role) {
        throw new Error(`Role with id ${data.roleId} not found`);
      }

      // Verify all menus exist
      const menuIds = data.permissions.map((p) => p.menuId);
      const menus = await menuRepository.findAll({
        where: {
          id: menuIds,
        },
      });

      if (menus.length !== menuIds.length) {
        const foundMenuIds = menus.map((m) => m.id);
        const missingMenuIds = menuIds.filter((id) => !foundMenuIds.includes(id));
        throw new Error(`Menus not found: ${missingMenuIds.join(', ')}`);
      }

      // Process permissions within a transaction
      await roleMenuPermissionRepository.withTransaction(async (transaction: Transaction) => {
        // Prepare permission records
        const permissionRecords: RoleMenuPermissionCreationAttributes[] = data.permissions.map(
          (perm) => {
            // Normalize permissions (apply business rules)
            const normalized = this.normalizePermissions({
              view: perm.view ?? false,
              add: perm.add ?? false,
              edit: perm.edit ?? false,
              delete: perm.delete ?? false,
              export: perm.export ?? false,
              status: perm.status ?? false,
            });

            return {
              role_id: data.roleId,
              menu_id: perm.menuId,
              can_view: normalized.view,
              can_add: normalized.add,
              can_edit: normalized.edit,
              can_delete: normalized.delete,
              can_export: normalized.export,
              can_status: normalized.status,
            };
          }
        );

        // Bulk upsert permissions
        logger.info(`Starting bulk upsert for role ${data.roleId}`, {
          roleId: data.roleId,
          recordCount: permissionRecords.length,
          records: permissionRecords.map((r) => ({
            role_id: r.role_id,
            menu_id: r.menu_id,
            can_view: r.can_view,
            can_add: r.can_add,
            can_edit: r.can_edit,
            can_delete: r.can_delete,
            can_export: r.can_export,
            can_status: r.can_status,
          })),
        });

        const upsertedRecords = await roleMenuPermissionRepository.bulkUpsert(
          permissionRecords,
          transaction
        );

        logger.info(
          `Bulk upsert completed for role ${data.roleId}. Upserted ${upsertedRecords.length} records`,
          {
            roleId: data.roleId,
            upsertedCount: upsertedRecords.length,
            userId,
          }
        );

        // Verify updates by checking database directly within transaction
        for (const record of permissionRecords) {
          const verify = await roleMenuPermissionRepository.findByRoleAndMenu(
            record.role_id,
            record.menu_id,
            { transaction }
          );
          if (verify) {
            // verify is a Sequelize model instance (not raw), so we can use direct property access
            logger.info(`Verified permission for role ${record.role_id}, menu ${record.menu_id}`, {
              can_view: verify.can_view,
              can_add: verify.can_add,
              can_edit: verify.can_edit,
              can_delete: verify.can_delete,
              can_export: verify.can_export,
              can_status: verify.can_status,
            });
          } else {
            logger.warn(
              `Failed to verify permission for role ${record.role_id}, menu ${record.menu_id}`
            );
          }
        }

        // Transaction will commit here automatically
      });

      // Now fetch the updated permissions after transaction has committed
      logger.info(`Fetching updated permissions for role ${data.roleId} after transaction commit`);

      // Add a small delay to ensure transaction is fully committed (only if needed)
      // In most cases this isn't needed, but helps with replication lag
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Fetch with useMaster to ensure we get latest data
      const result = await this.getRolePermissions(data.roleId);

      // Log the result for debugging
      logger.info(`Retrieved permissions after update for role ${data.roleId}`, {
        roleId: data.roleId,
        permissionCount: result.permissions.length,
        permissions: result.permissions.map((p) => ({
          menuId: p.menuId,
          view: p.permissions.view,
          add: p.permissions.add,
          edit: p.permissions.edit,
          delete: p.permissions.delete,
          export: p.permissions.export,
          status: p.permissions.status,
        })),
      });

      return result;
    } catch (error) {
      logger.error(`Error updating permissions for role ${data.roleId}:`, error);
      throw error;
    }
  }

  /**
   * Set select-all for a menu (all permissions to true)
   */
  async setSelectAllForMenu(
    roleId: number,
    menuId: number,
    userId?: number
  ): Promise<RoleMenuPermission> {
    try {
      // Verify role and menu exist
      const role = await roleRepository.findById(roleId);
      if (!role) {
        throw new Error(`Role with id ${roleId} not found`);
      }

      const menu = await menuRepository.findById(menuId);
      if (!menu) {
        throw new Error(`Menu with id ${menuId} not found`);
      }

      return await roleMenuPermissionRepository.withTransaction(
        async (transaction: Transaction) => {
          const permission = await roleMenuPermissionRepository.upsert(
            {
              role_id: roleId,
              menu_id: menuId,
              can_view: true,
              can_add: true,
              can_edit: true,
              can_delete: true,
              can_export: true,
              can_status: true,
            },
            transaction
          );

          logger.info(
            `Select-all permissions set for role ${roleId}, menu ${menuId} by user ${userId || 'system'}`
          );

          return permission;
        }
      );
    } catch (error) {
      logger.error(`Error setting select-all for role ${roleId}, menu ${menuId}:`, error);
      throw error;
    }
  }

  /**
   * Clear all permissions for a menu (all permissions to false)
   */
  async clearMenuPermissions(
    roleId: number,
    menuId: number,
    userId?: number
  ): Promise<RoleMenuPermission> {
    try {
      // Verify role and menu exist
      const role = await roleRepository.findById(roleId);
      if (!role) {
        throw new Error(`Role with id ${roleId} not found`);
      }

      const menu = await menuRepository.findById(menuId);
      if (!menu) {
        throw new Error(`Menu with id ${menuId} not found`);
      }

      return await roleMenuPermissionRepository.withTransaction(
        async (transaction: Transaction) => {
          const permission = await roleMenuPermissionRepository.upsert(
            {
              role_id: roleId,
              menu_id: menuId,
              can_view: false,
              can_add: false,
              can_edit: false,
              can_delete: false,
              can_export: false,
              can_status: false,
            },
            transaction
          );

          logger.info(
            `Permissions cleared for role ${roleId}, menu ${menuId} by user ${userId || 'system'}`
          );

          return permission;
        }
      );
    } catch (error) {
      logger.error(`Error clearing permissions for role ${roleId}, menu ${menuId}:`, error);
      throw error;
    }
  }
}

export default new PermissionService();
