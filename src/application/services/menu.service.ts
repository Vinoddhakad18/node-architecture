import { logger } from '@config/logger';
import { RedisTTL } from '@config/redis';
import redisService from '@helpers/redis.helper';
import Menu, { MenuCreationAttributes } from '@models/menu.model';
import menuRepository from '@repositories/menu.repository';
import { Transaction } from 'sequelize';

/**
 * Cache key constants for menu
 */
const CACHE_KEYS = {
  MENU_BY_ID: (id: number) => `menu:id:${id}`,
  MENU_BY_ROUTE: (route: string) => `menu:route:${route}`,
  MENUS_ACTIVE: 'menus:active',
  MENUS_TREE: 'menus:tree',
  MENUS_LIST: (options: string) => `menus:list:${options}`,
};

/**
 * Query options for listing menus
 */
interface MenuQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  parentId?: number | null;
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
 * Menu Service
 * Handles business logic for menu operations
 */
class MenuService {
  /**
   * Create a new menu
   */
  async create(data: MenuCreationAttributes): Promise<Menu> {
    try {
      // Validate parent exists if provided
      if (data.parent_id) {
        const parent = await menuRepository.findById(data.parent_id);
        if (!parent) {
          throw new Error(`Parent menu with id ${data.parent_id} not found`);
        }
      }

      const menu = await menuRepository.withTransaction(async (transaction: Transaction) => {
        const newMenu = await menuRepository.create(data, { transaction });
        return newMenu;
      });

      // Invalidate list caches after transaction commits
      await this.invalidateListCaches();

      logger.info(`Menu created: ${menu.name} (${menu.route})`);
      return menu;
    } catch (error) {
      logger.error('Error creating menu:', error);
      throw error;
    }
  }

  /**
   * Get all menus with pagination and filtering
   */
  async findAll(options: MenuQueryOptions = {}): Promise<PaginatedResult<Menu>> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        isActive,
        parentId,
        sortBy = 'sort_order',
        sortOrder = 'ASC',
      } = options;

      // Generate cache key based on query options
      const cacheKey = CACHE_KEYS.MENUS_LIST(
        JSON.stringify({ page, limit, search, isActive, parentId, sortBy, sortOrder })
      );

      // Try to get from cache
      const cached = await redisService.get<PaginatedResult<Menu>>(cacheKey);
      if (cached) {
        logger.debug(`Cache hit for menus list: ${cacheKey}`);
        return cached;
      }

      // Use repository method with filters
      const { rows, count } = await menuRepository.findWithFilters(
        page,
        limit,
        search,
        isActive,
        parentId,
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
      logger.debug(`Cache set for menus list: ${cacheKey}`);

      return result;
    } catch (error) {
      logger.error('Error fetching menus:', error);
      throw error;
    }
  }

  /**
   * Get menu by ID
   */
  async findById(id: number): Promise<Menu | null> {
    try {
      const cacheKey = CACHE_KEYS.MENU_BY_ID(id);

      // Try to get from cache
      const cached = await redisService.get<Menu>(cacheKey);
      if (cached) {
        logger.debug(`Cache hit for menu id: ${id}`);
        return cached;
      }

      const menu = await menuRepository.findById(id);

      if (menu) {
        // Cache the result
        await redisService.set(cacheKey, menu.toJSON(), RedisTTL.LONG);
        logger.debug(`Cache set for menu id: ${id}`);
      }

      return menu;
    } catch (error) {
      logger.error(`Error fetching menu with id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get menu by route
   */
  async findByRoute(route: string): Promise<Menu | null> {
    try {
      const cacheKey = CACHE_KEYS.MENU_BY_ROUTE(route);

      // Try to get from cache
      const cached = await redisService.get<Menu>(cacheKey);
      if (cached) {
        logger.debug(`Cache hit for menu route: ${route}`);
        return cached;
      }

      const menu = await menuRepository.findByRoute(route);

      if (menu) {
        // Cache the result
        await redisService.set(cacheKey, menu.toJSON(), RedisTTL.LONG);
        logger.debug(`Cache set for menu route: ${route}`);
      }

      return menu;
    } catch (error) {
      logger.error(`Error fetching menu with route ${route}:`, error);
      throw error;
    }
  }

  /**
   * Get menu tree (hierarchical structure)
   */
  async findMenuTree(activeOnly = true): Promise<Menu[]> {
    try {
      const cacheKey = activeOnly ? CACHE_KEYS.MENUS_TREE : `${CACHE_KEYS.MENUS_TREE}:all`;

      // Try to get from cache
      const cached = await redisService.get<Menu[]>(cacheKey);
      if (cached) {
        logger.debug('Cache hit for menu tree');
        return cached;
      }

      const menus = await menuRepository.findMenuTree(activeOnly);

      // Cache the result
      await redisService.set(
        cacheKey,
        menus.map((m) => m.toJSON()),
        RedisTTL.LONG
      );
      logger.debug('Cache set for menu tree');

      return menus;
    } catch (error) {
      logger.error('Error fetching menu tree:', error);
      throw error;
    }
  }

  /**
   * Get children of a menu
   */
  async findChildren(parentId: number): Promise<Menu[]> {
    try {
      return menuRepository.findChildren(parentId);
    } catch (error) {
      logger.error(`Error fetching children for menu ${parentId}:`, error);
      throw error;
    }
  }

  /**
   * Update menu
   */
  async update(id: number, data: Partial<MenuCreationAttributes>): Promise<Menu | null> {
    try {
      const menu = await menuRepository.findById(id);

      if (!menu) {
        return null;
      }

      // Validate parent exists if provided
      if (data.parent_id) {
        // Prevent setting itself as parent
        if (data.parent_id === id) {
          throw new Error('Menu cannot be its own parent');
        }

        const parent = await menuRepository.findById(data.parent_id);
        if (!parent) {
          throw new Error(`Parent menu with id ${data.parent_id} not found`);
        }

        // Prevent circular reference
        const children = await this.getAllDescendantIds(id);
        if (children.includes(data.parent_id)) {
          throw new Error('Cannot set a descendant as parent (circular reference)');
        }
      }

      const oldRoute = menu.route;

      const updatedMenu = await menuRepository.withTransaction(async (transaction: Transaction) => {
        await menu.update(data, { transaction });
        return menu;
      });

      if (!updatedMenu) {
        return null;
      }

      // Invalidate caches after transaction commits
      await this.invalidateMenuCache(id, oldRoute);
      // If route was updated, also invalidate the new route cache
      if (data.route && data.route !== oldRoute) {
        await redisService.del(CACHE_KEYS.MENU_BY_ROUTE(data.route));
      }
      await this.invalidateListCaches();

      logger.info(`Menu updated: ${updatedMenu.name} (${updatedMenu.route})`);
      return updatedMenu;
    } catch (error) {
      logger.error(`Error updating menu with id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all descendant IDs of a menu (for circular reference check)
   */
  private async getAllDescendantIds(menuId: number): Promise<number[]> {
    const descendants: number[] = [];
    const children = await menuRepository.findChildren(menuId);

    for (const child of children) {
      descendants.push(child.id);
      const childDescendants = await this.getAllDescendantIds(child.id);
      descendants.push(...childDescendants);
    }

    return descendants;
  }

  /**
   * Delete menu (soft delete by setting is_active to false)
   */
  async delete(id: number): Promise<boolean> {
    try {
      const menu = await menuRepository.findById(id);

      if (!menu) {
        return false;
      }

      const route = menu.route;

      const result = await menuRepository.softDelete(id);

      if (result) {
        // Invalidate caches after transaction commits
        await this.invalidateMenuCache(id, route);
        await this.invalidateListCaches();

        logger.info(`Menu deleted (soft): ${menu.name} (${menu.route})`);
      }

      return result;
    } catch (error) {
      logger.error(`Error deleting menu with id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Hard delete menu
   */
  async hardDelete(id: number): Promise<boolean> {
    try {
      // Get menu data before deletion for cache invalidation
      const menu = await menuRepository.findById(id);
      const route = menu?.route;

      // Check if menu has children
      const children = await menuRepository.findChildren(id);
      if (children.length > 0) {
        throw new Error('Cannot delete menu with children. Delete children first or reassign them.');
      }

      const result = await menuRepository.withTransaction(async (transaction: Transaction) => {
        return menuRepository.delete(id, { transaction });
      });

      if (result) {
        // Invalidate caches after transaction commits
        await this.invalidateMenuCache(id, route);
        await this.invalidateListCaches();

        logger.info(`Menu hard deleted: id ${id}`);
      }

      return result;
    } catch (error) {
      logger.error(`Error hard deleting menu with id ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all active menus (for dropdowns)
   */
  async findAllActive(): Promise<Menu[]> {
    try {
      const cacheKey = CACHE_KEYS.MENUS_ACTIVE;

      // Try to get from cache
      const cached = await redisService.get<Menu[]>(cacheKey);
      if (cached) {
        logger.debug('Cache hit for active menus');
        return cached;
      }

      const menus = await menuRepository.findAllActive();

      // Cache the result
      await redisService.set(
        cacheKey,
        menus.map((m) => m.toJSON()),
        RedisTTL.LONG
      );
      logger.debug('Cache set for active menus');

      return menus;
    } catch (error) {
      logger.error('Error fetching active menus:', error);
      throw error;
    }
  }

  /**
   * Get root menus (for navigation)
   */
  async findRootMenus(): Promise<Menu[]> {
    try {
      return menuRepository.findRootMenus({ where: { is_active: true } });
    } catch (error) {
      logger.error('Error fetching root menus:', error);
      throw error;
    }
  }

  /**
   * Check if route exists
   */
  async isRouteExists(route: string, excludeId?: number): Promise<boolean> {
    try {
      return menuRepository.isRouteExists(route, excludeId);
    } catch (error) {
      logger.error(`Error checking menu route ${route}:`, error);
      throw error;
    }
  }

  /**
   * Reorder menus
   */
  async reorderMenus(menuOrders: { id: number; sort_order: number }[]): Promise<boolean> {
    try {
      const result = await menuRepository.updateSortOrder(menuOrders);

      if (result) {
        await this.invalidateListCaches();
        logger.info(`Menus reordered: ${menuOrders.length} items`);
      }

      return result;
    } catch (error) {
      logger.error('Error reordering menus:', error);
      throw error;
    }
  }

  /**
   * Invalidate cache for a specific menu
   */
  private async invalidateMenuCache(id: number, route?: string): Promise<void> {
    try {
      const keysToDelete = [CACHE_KEYS.MENU_BY_ID(id)];

      if (route) {
        keysToDelete.push(CACHE_KEYS.MENU_BY_ROUTE(route));
      }

      await redisService.del(keysToDelete);
      logger.debug(`Cache invalidated for menu id: ${id}, route: ${route}`);
    } catch (error) {
      logger.error('Error invalidating menu cache:', error);
      // Don't throw - cache invalidation failure shouldn't break the operation
    }
  }

  /**
   * Invalidate all list caches
   */
  private async invalidateListCaches(): Promise<void> {
    try {
      // Delete active menus cache
      await redisService.del(CACHE_KEYS.MENUS_ACTIVE);
      await redisService.del(CACHE_KEYS.MENUS_TREE);
      await redisService.del(`${CACHE_KEYS.MENUS_TREE}:all`);

      // Delete all list caches by pattern
      const listKeys = await redisService.keys('menus:list:*');
      if (listKeys.length > 0) {
        await redisService.del(listKeys);
      }

      logger.debug('List caches invalidated for menus');
    } catch (error) {
      logger.error('Error invalidating list caches:', error);
      // Don't throw - cache invalidation failure shouldn't break the operation
    }
  }
}

export default new MenuService();
