import { logger } from '@config/logger';
import { AuthenticatedRequest, getErrorMessage } from '@interfaces/common.interface';
import menuService from '@services/menu.service';
import { Response } from 'express';

/**
 * Menu Controller
 * Handles HTTP requests for menu operations
 */
class MenuController {
  /**
   * Create a new menu
   * POST /api/v1/menus
   */
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, route, parent_id, sort_order, is_active } = req.body;

      // Check if route already exists
      const routeExists = await menuService.isRouteExists(route);
      if (routeExists) {
        res.sendConflict(`Menu with route '${route}' already exists`);
        return;
      }

      const menu = await menuService.create({
        name,
        route,
        parent_id: parent_id || null,
        sort_order: sort_order || 0,
        is_active: is_active !== undefined ? is_active : true,
      });

      res.sendCreated(menu, 'Menu created successfully');
    } catch (error: unknown) {
      logger.error('Error in create menu controller:', error);
      res.sendServerError(getErrorMessage(error) || 'Failed to create menu');
    }
  }

  /**
   * Get all menus with pagination
   * GET /api/v1/menus
   */
  async findAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        is_active,
        parent_id,
        sortBy = 'sort_order',
        sortOrder = 'ASC',
        refresh = 'false', // Query parameter to force refresh (bypass cache)
      } = req.query;

      const result = await menuService.findAll({
        page: Number(page),
        limit: Number(limit),
        search: search as string,
        isActive: is_active as boolean | undefined,
        parentId: parent_id as number | null | undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'ASC' | 'DESC',
        skipCache: refresh === 'true' || refresh === '1', // Bypass cache if refresh=true
      });

      res.sendSuccess(result, 'Menus retrieved successfully');
    } catch (error: unknown) {
      logger.error('Error in findAll menus controller:', error);
      res.sendServerError(getErrorMessage(error) || 'Failed to retrieve menus');
    }
  }

  /**
   * Get menu tree (hierarchical structure)
   * GET /api/v1/menus/tree
   */
  async findMenuTree(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { active_only = 'true' } = req.query;
      const activeOnly = active_only === 'true';

      const menus = await menuService.findMenuTree(activeOnly);

      res.sendSuccess(menus, 'Menu tree retrieved successfully');
    } catch (error: unknown) {
      logger.error('Error in findMenuTree controller:', error);
      res.sendServerError(getErrorMessage(error) || 'Failed to retrieve menu tree');
    }
  }

  /**
   * Get menu by ID
   * GET /api/v1/menus/:id
   */
  async findById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const menu = await menuService.findById(Number(id));

      if (!menu) {
        res.sendNotFound(`Menu with id ${id} not found`);
        return;
      }

      res.sendSuccess(menu, 'Menu retrieved successfully');
    } catch (error: unknown) {
      logger.error('Error in findById menu controller:', error);
      res.sendServerError(getErrorMessage(error) || 'Failed to retrieve menu');
    }
  }

  /**
   * Get menu by route
   * GET /api/v1/menus/route/:route
   */
  async findByRoute(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { route } = req.params;

      const menu = await menuService.findByRoute(route);

      if (!menu) {
        res.sendNotFound(`Menu with route '${route}' not found`);
        return;
      }

      res.sendSuccess(menu, 'Menu retrieved successfully');
    } catch (error: unknown) {
      logger.error('Error in findByRoute menu controller:', error);
      res.sendServerError(getErrorMessage(error) || 'Failed to retrieve menu');
    }
  }

  /**
   * Get children of a menu
   * GET /api/v1/menus/:id/children
   */
  async findChildren(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Check if parent menu exists
      const parentMenu = await menuService.findById(Number(id));
      if (!parentMenu) {
        res.sendNotFound(`Menu with id ${id} not found`);
        return;
      }

      const children = await menuService.findChildren(Number(id));

      res.sendSuccess(children, 'Menu children retrieved successfully');
    } catch (error: unknown) {
      logger.error('Error in findChildren menu controller:', error);
      res.sendServerError(getErrorMessage(error) || 'Failed to retrieve menu children');
    }
  }

  /**
   * Update menu
   * PUT /api/v1/menus/:id
   */
  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, route, parent_id, sort_order, is_active } = req.body;

      // Check if route already exists (excluding current record)
      if (route) {
        const routeExists = await menuService.isRouteExists(route, Number(id));
        if (routeExists) {
          res.sendConflict(`Menu with route '${route}' already exists`);
          return;
        }
      }

      const menu = await menuService.update(Number(id), {
        name,
        route,
        parent_id,
        sort_order,
        is_active,
      });

      if (!menu) {
        res.sendNotFound(`Menu with id ${id} not found`);
        return;
      }

      res.sendSuccess(menu, 'Menu updated successfully');
    } catch (error: unknown) {
      logger.error('Error in update menu controller:', error);
      res.sendServerError(getErrorMessage(error) || 'Failed to update menu');
    }
  }

  /**
   * Reorder menus
   * PUT /api/v1/menus/reorder
   */
  async reorderMenus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { menuOrders } = req.body;

      const result = await menuService.reorderMenus(menuOrders);

      if (!result) {
        res.sendServerError('Failed to reorder menus');
        return;
      }

      res.sendSuccess(null, 'Menus reordered successfully');
    } catch (error: unknown) {
      logger.error('Error in reorderMenus controller:', error);
      res.sendServerError(getErrorMessage(error) || 'Failed to reorder menus');
    }
  }

  /**
   * Delete menu (soft delete)
   * DELETE /api/v1/menus/:id
   */
  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const deleted = await menuService.delete(Number(id));

      if (!deleted) {
        res.sendNotFound(`Menu with id ${id} not found`);
        return;
      }

      res.sendSuccess(null, 'Menu deleted successfully');
    } catch (error: unknown) {
      logger.error('Error in delete menu controller:', error);
      res.sendServerError(getErrorMessage(error) || 'Failed to delete menu');
    }
  }

  /**
   * Hard delete menu
   * DELETE /api/v1/menus/:id/permanent
   */
  async hardDelete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const deleted = await menuService.hardDelete(Number(id));

      if (!deleted) {
        res.sendNotFound(`Menu with id ${id} not found`);
        return;
      }

      res.sendSuccess(null, 'Menu permanently deleted');
    } catch (error: unknown) {
      logger.error('Error in hardDelete menu controller:', error);
      res.sendServerError(getErrorMessage(error) || 'Failed to permanently delete menu');
    }
  }

  /**
   * Get all active menus (for dropdowns)
   * GET /api/v1/menus/active/list
   */
  async findAllActive(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const menus = await menuService.findAllActive();

      res.sendSuccess(menus, 'Active menus retrieved successfully');
    } catch (error: unknown) {
      logger.error('Error in findAllActive menus controller:', error);
      res.sendServerError(getErrorMessage(error) || 'Failed to retrieve active menus');
    }
  }
}

export default new MenuController();
