import { logger } from '@config/logger';
import { CacheKeys, CacheTTL } from '@constants/cache.constants';
import { PermissionAction } from '@constants/rbac.constants';
import { UserRole } from '@constants/user.constants';
import redisService from '@helpers/redis.helper';
import Menu from '@models/menu.model';
import menuRepository from '@repositories/menu.repository';
import roleMenuPermissionRepository from '@repositories/role-menu-permission.repository';
import roleRepository from '@repositories/role.repository';

/**
 * Resolved permission flags for a single menu.
 * Keyed by PermissionAction so `flags[action]` is a typed boolean lookup.
 */
type MenuPermissionFlags = Record<PermissionAction, boolean>;

/**
 * Map of menu route -> permission flags for a given role.
 */
type RolePermissionMap = Record<string, MenuPermissionFlags>;

/**
 * RBAC Service
 *
 * Resolves a role's effective permissions from the `role_menu_permissions`
 * table and caches the result in Redis to avoid a DB round-trip on every
 * request. The cache is invalidated whenever a role's permissions change
 * (see PermissionService). When Redis is disabled the service transparently
 * falls back to a direct database lookup.
 */
class RbacService {
  /**
   * Resolve the full menu-permission map for a role, using cache when available.
   */
  async getRolePermissionMap(roleName: string): Promise<RolePermissionMap> {
    const cacheKey = CacheKeys.rolePermissions(roleName);

    try {
      const cached = await redisService.get<RolePermissionMap>(cacheKey);
      if (cached) {
        return cached;
      }
    } catch (error) {
      // Cache read failures must never block authorization; fall back to DB.
      logger.warn({error}, `RBAC cache read failed for role ${roleName}:`);
    }

    const map = await this.loadFromDb(roleName);

    try {
      await redisService.set(cacheKey, map, CacheTTL.MEDIUM);
    } catch (error) {
      logger.warn({error}, `RBAC cache write failed for role ${roleName}:`);
    }

    return map;
  }

  /**
   * Build the menu-permission map for a role directly from the database.
   * Returns an empty map for unknown roles (deny-by-default).
   */
  private async loadFromDb(roleName: string): Promise<RolePermissionMap> {
    const role = await roleRepository.findByName(roleName);
    if (!role) {
      logger.warn(`RBAC: role "${roleName}" not found; denying all permissions`);
      return {};
    }

    const permissions = await roleMenuPermissionRepository.findByRoleId(role.id, {
      raw: true,
      nest: true,
      include: [
        {
          model: Menu,
          as: 'menu',
          attributes: ['route'],
        },
      ],
    });

    const map: RolePermissionMap = {};

    for (const permission of permissions as unknown as Array<
      Record<string, unknown> & { menu?: { route?: string } }
    >) {
      const route = permission.menu?.route;
      if (!route) {
        continue;
      }

      map[route] = {
        [PermissionAction.VIEW]: Boolean(permission.can_view),
        [PermissionAction.ADD]: Boolean(permission.can_add),
        [PermissionAction.EDIT]: Boolean(permission.can_edit),
        [PermissionAction.DELETE]: Boolean(permission.can_delete),
        [PermissionAction.EXPORT]: Boolean(permission.can_export),
        [PermissionAction.STATUS]: Boolean(permission.can_status),
      };
    }

    return map;
  }

  /**
   * Resolve the effective permission map for a role, suitable for sending to
   * the client to drive UI gating. `super_admin` receives every active menu
   * with all flags enabled; other roles receive their cached DB-resolved map.
   */
  async getEffectivePermissionMap(roleName: string): Promise<RolePermissionMap> {
    if (roleName === UserRole.SUPER_ADMIN) {
      const menus = await menuRepository.findAllActive();
      const map: RolePermissionMap = {};
      for (const menu of menus) {
        map[menu.route] = {
          [PermissionAction.VIEW]: true,
          [PermissionAction.ADD]: true,
          [PermissionAction.EDIT]: true,
          [PermissionAction.DELETE]: true,
          [PermissionAction.EXPORT]: true,
          [PermissionAction.STATUS]: true,
        };
      }
      return map;
    }

    return this.getRolePermissionMap(roleName);
  }

  /**
   * Check whether a role may perform `action` on the menu identified by `menuRoute`.
   * `super_admin` is always allowed (mirrors menu visibility logic).
   */
  async hasPermission(
    roleName: string,
    menuRoute: string,
    action: PermissionAction
  ): Promise<boolean> {
    if (roleName === UserRole.SUPER_ADMIN) {
      return true;
    }

    const map = await this.getRolePermissionMap(roleName);
    const flags = map[menuRoute];

    if (!flags) {
      return false;
    }

    return flags[action] === true;
  }

  /**
   * Drop the cached permission map for a role. Call after any change to that
   * role's permissions so the next request reloads fresh data.
   */
  async invalidateRole(roleName: string): Promise<void> {
    try {
      await redisService.del(CacheKeys.rolePermissions(roleName));
      logger.info(`RBAC cache invalidated for role ${roleName}`);
    } catch (error) {
      logger.warn({error}, `RBAC cache invalidation failed for role ${roleName}:`);
    }
  }
}

export default new RbacService();
