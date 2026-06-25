import { UserRole } from '@application/constants';
import { logger } from '@config/logger';
import Menu, { MenuCreationAttributes } from '@models/menu.model';
import menuRepository from '@repositories/menu.repository';
import roleRepository from '@repositories/role.repository';
import roleMenuPermissionRepository from '@repositories/role-menu-permission.repository';

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
  skipCache?: boolean;
}

/**
 * Plain (serialized) menu tree node used when filtering by role permission
 */
interface MenuTreeNode {
  id: number;
  name: string;
  route: string;
  parent_id: number | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  children?: MenuTreeNode[];
  [key: string]: unknown;
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
      if (data.parent_id !== undefined && data.parent_id !== null) {
        const parent = await menuRepository.findById(data.parent_id);
        if (!parent) {
          throw new Error(`Parent menu with id ${data.parent_id} not found`);
        }
      }

      // Remove undefined keys to avoid passing explicit `undefined` to Sequelize
      const createData = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined)
      ) as MenuCreationAttributes;

      // Create menu
      const menu = await menuRepository.create(createData);

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

      // Use repository method with filters to get data from database
      const { rows, count } = await menuRepository.findWithFilters(
        page,
        limit,
        search,
        isActive,
        parentId,
        sortBy,
        sortOrder
      );

      const result: PaginatedResult<Menu> = {
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
      logger.error('Error fetching menus:', error);
      throw error;
    }
  }

  /**
   * Get menu by ID
   */
  async findById(id: number): Promise<Menu | null> {
    try {
      const menu = await menuRepository.findById(id);
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
      const menu = await menuRepository.findByRoute(route);
      return menu;
    } catch (error) {
      logger.error(`Error fetching menu with route ${route}:`, error);
      throw error;
    }
  }

  /**
   * Get menu tree (hierarchical structure), scoped to what the given role may view.
   *
   * - super_admin (or any role mapped to UserRole.SUPER_ADMIN) receives the full tree.
   * - Any other role receives only the menus it has `can_view` permission for,
   *   keeping parent nodes whenever one of their descendants is viewable.
   */
  async findMenuTree(activeOnly = true, roleName?: string): Promise<MenuTreeNode[]> {
    try {
      const menus = await menuRepository.findMenuTree(activeOnly);
      const tree = menus.map((menu) => menu.toJSON() as MenuTreeNode);

      // Super admin bypasses permission filtering and sees everything.
      if (roleName === UserRole.SUPER_ADMIN) {
        return tree;
      }

      const viewableMenuIds = await this.getViewableMenuIds(roleName);
      return this.filterTreeByPermission(tree, viewableMenuIds);
    } catch (error) {
      logger.error('Error fetching menu tree:', error);
      throw error;
    }
  }

  /**
   * Resolve the set of menu ids a role is allowed to view (can_view = true).
   * Returns an empty set when the role is unknown or has no permissions.
   */
  private async getViewableMenuIds(roleName?: string): Promise<Set<number>> {
    if (!roleName) {
      return new Set();
    }

    const role = await roleRepository.findByName(roleName);
    if (!role) {
      return new Set();
    }

    const permissions = await roleMenuPermissionRepository.findByRoleId(role.id, {
      where: { can_view: true },
    });

    return new Set(permissions.map((permission) => permission.menu_id));
  }

  /**
   * Recursively prune a menu tree, keeping a node when it is directly viewable
   * or when at least one of its descendants is viewable.
   */
  private filterTreeByPermission(
    nodes: MenuTreeNode[],
    viewableMenuIds: Set<number>
  ): MenuTreeNode[] {
    const result: MenuTreeNode[] = [];

    for (const node of nodes) {
      const children = node.children
        ? this.filterTreeByPermission(node.children, viewableMenuIds)
        : [];

      if (viewableMenuIds.has(node.id) || children.length > 0) {
        result.push({ ...node, children });
      }
    }

    return result;
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
      if (data.parent_id !== undefined && data.parent_id !== null) {
        if (data.parent_id === id) {
          throw new Error('Menu cannot be its own parent');
        }

        const parent = await menuRepository.findById(data.parent_id);
        if (!parent) {
          throw new Error(`Parent menu with id ${data.parent_id} not found`);
        }

        const children = await this.getAllDescendantIds(id);
        if (children.includes(data.parent_id)) {
          throw new Error('Cannot set a descendant as parent (circular reference)');
        }
      }

      // Remove undefined keys to avoid passing explicit `undefined` to Sequelize
      const updateData = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined)
      ) as Partial<MenuCreationAttributes>;

      // Perform update
      await menu.update(updateData as any);

      // Reload menu to return the fresh state
      const updatedMenu = await menuRepository.findById(id);
      if (!updatedMenu) {
        return null;
      }

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

      // Soft delete
      const result = await menuRepository.softDelete(id);

      if (result) {
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
      const children = await menuRepository.findChildren(id);
      if (children.length > 0) {
        throw new Error(
          'Cannot delete menu with children. Delete children first or reassign them.'
        );
      }

      const result = await menuRepository.delete(id);

      if (result) {
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
      const menus = await menuRepository.findAllActive();
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
        logger.info(`Menus reordered: ${menuOrders.length} items`);
      }

      return result;
    } catch (error) {
      logger.error('Error reordering menus:', error);
      throw error;
    }
  }
}

export default new MenuService();
