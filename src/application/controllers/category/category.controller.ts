import { Request, Response, NextFunction } from 'express';
import { getErrorMessage } from '@interfaces/common.interface';
import { CategoryService } from '@/application/services/category/category.service';

export class CategoryController {
  private readonly service = new CategoryService();
/**
  * Create a new Category
  */
  create = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const result = await this.service.create(req.body, userId);
      res.sendCreated(
        result,
        'Category created successfully'
      );
    } catch (error: any) {
      res.sendBadRequest(getErrorMessage(error) || 'Error creating Category');

    }
  };

/**
 * Get all Categorys
 */
  getAll = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
       const {
        page = 1,
        limit = 10,
        search,
        status,
        sortBy = 'id',
        sortOrder = 'ASC',
      } = req.query;

      const result = await this.service.getAll({
        page: Number(page),
        limit: Number(limit),
        search: search as string,
        status: status as 'active' | 'inactive',
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'ASC' | 'DESC',
      });
      res.sendSuccess(
        result,
        'Category list fetched successfully'
      );
    } catch (error: any) {
      res.sendBadRequest(getErrorMessage(error) || 'Error fetching Categorys');
    }
  };

/**
  * Get a Category by ID
  */
  getById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await this.service.getById(
        Number(req.params.id)
      );

      res.sendSuccess(
        result,
        'Category fetched successfully'
      );
    } catch (error: any) {
      res.sendBadRequest(getErrorMessage(error) || 'Error fetching Category');
    }
  };

/**
 * Update a Category
  */
  update = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const result = await this.service.update(
        Number(req.params.id),
        req.body,
        userId
      );

      res.sendSuccess(
        result,
        'Category updated successfully'
      );
    } catch (error: any) {
      res.sendBadRequest(getErrorMessage(error) || 'Error updating Category');
    }
  };
/** * Delete a Category
  */
  delete = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      await this.service.delete(
        Number(req.params.id),
        userId
      );
      res.sendSuccess(
        null,
        'Category deleted successfully'
      );
    } catch (error: any) {
      res.sendBadRequest(getErrorMessage(error) || 'Error deleting Category');
    }
  };
}