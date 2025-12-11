import Menu, { MenuAttributes, MenuCreationAttributes } from '@models/menu.model';
import { Op, FindOptions, WhereOptions } from 'sequelize';

import { BaseRepository } from './base.repository';

/**
 * Menu Repository
 * Data access layer for menu operations
 */
export class MenuRepository extends BaseRepository<Menu, MenuAttributes, MenuCreationAttributes> {
  constructor() {
    super(Menu);
  }

  /**
   * Find menu by route
   */
  async findByRoute(route: string): Promise<Menu | null> {
    return this.findOne({
      where: { route },
    });
  }

  /**
   * Find all active menus
   */
  async findAllActive(options?: FindOptions): Promise<Menu[]> {
    return this.findAll({
      ...options,
      where: {
        ...(options?.where as WhereOptions<MenuAttributes>),
        is_active: true,
      } as WhereOptions<MenuAttributes>,
      order: [['sort_order', 'ASC']],
    });
  }

  /**
   * Find root menus (menus without parent)
   */
  async findRootMenus(options?: FindOptions): Promise<Menu[]> {
    return this.findAll({
      ...options,
      where: {
        ...(options?.where as WhereOptions<MenuAttributes>),
        parent_id: null,
      } as WhereOptions<MenuAttributes>,
      order: [['sort_order', 'ASC']],
    });
  }

  /**
   * Find children of a menu
   */
  async findChildren(parentId: number, options?: FindOptions): Promise<Menu[]> {
    return this.findAll({
      ...options,
      where: {
        ...(options?.where as WhereOptions<MenuAttributes>),
        parent_id: parentId,
      } as WhereOptions<MenuAttributes>,
      order: [['sort_order', 'ASC']],
    });
  }

  /**
   * Find menu with its children (hierarchical)
   */
  async findWithChildren(id: number): Promise<Menu | null> {
    return this.findOne({
      where: { id },
      include: [
        {
          model: Menu,
          as: 'children',
          where: { is_active: true },
          required: false,
          order: [['sort_order', 'ASC']],
        },
      ],
    });
  }

  /**
   * Find all menus with hierarchy (tree structure)
   */
  async findMenuTree(activeOnly = true): Promise<Menu[]> {
    const where: WhereOptions<MenuAttributes> = { parent_id: null };
    if (activeOnly) {
      where.is_active = true;
    }

    return this.findAll({
      where,
      include: [
        {
          model: Menu,
          as: 'children',
          where: activeOnly ? { is_active: true } : undefined,
          required: false,
          include: [
            {
              model: Menu,
              as: 'children',
              where: activeOnly ? { is_active: true } : undefined,
              required: false,
            },
          ],
        },
      ],
      order: [
        ['sort_order', 'ASC'],
        [{ model: Menu, as: 'children' }, 'sort_order', 'ASC'],
      ],
    });
  }

  /**
   * Check if route exists
   */
  async isRouteExists(route: string, excludeId?: number): Promise<boolean> {
    const where: WhereOptions<MenuAttributes> = { route };
    if (excludeId) {
      (where as Record<string, unknown>).id = { [Op.ne]: excludeId };
    }
    return this.exists({ where });
  }

  /**
   * Search menus by name or route
   */
  async search(query: string, options?: FindOptions): Promise<Menu[]> {
    return this.findAll({
      ...options,
      where: {
        ...(options?.where as WhereOptions<MenuAttributes>),
        [Op.or]: [{ name: { [Op.like]: `%${query}%` } }, { route: { [Op.like]: `%${query}%` } }],
      } as WhereOptions<MenuAttributes>,
    });
  }

  /**
   * Soft delete menu (set is_active to false)
   */
  async softDelete(id: number): Promise<boolean> {
    const result = await this.update(id, {
      is_active: false,
    } as Partial<MenuAttributes>);
    return result !== null;
  }

  /**
   * Activate menu
   */
  async activate(id: number): Promise<boolean> {
    const result = await this.update(id, {
      is_active: true,
    } as Partial<MenuAttributes>);
    return result !== null;
  }

  /**
   * Find with pagination and advanced filtering
   */
  async findPaginated(
    page = 1,
    limit = 10,
    options?: FindOptions
  ): Promise<{ rows: Menu[]; count: number }> {
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
    isActive?: boolean,
    parentId?: number | null,
    sortBy = 'sort_order',
    sortOrder: 'ASC' | 'DESC' = 'ASC'
  ): Promise<{ rows: Menu[]; count: number }> {
    const offset = (page - 1) * limit;
    const where: WhereOptions<MenuAttributes> = {};

    // Apply search filter
    if (search) {
      Object.assign(where, {
        [Op.or]: [{ name: { [Op.like]: `%${search}%` } }, { route: { [Op.like]: `%${search}%` } }],
      });
    }

    // Apply active status filter
    if (isActive !== undefined) {
      Object.assign(where, { is_active: isActive });
    }

    // Apply parent filter
    if (parentId !== undefined) {
      Object.assign(where, { parent_id: parentId });
    }

    return this.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: Menu,
          as: 'parent',
          attributes: ['id', 'name'],
          required: false,
        },
      ],
    });
  }

  /**
   * Update sort order for multiple menus
   */
  async updateSortOrder(menuOrders: { id: number; sort_order: number }[]): Promise<boolean> {
    try {
      await Promise.all(
        menuOrders.map((item) =>
          this.update(item.id, { sort_order: item.sort_order } as Partial<MenuAttributes>)
        )
      );
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const menuRepository = new MenuRepository();
export default menuRepository;
