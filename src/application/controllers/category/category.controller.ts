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
      const result = await this.service.create(req.body);

      res.sendCreated(
        result,
        'Category created successfully'
      );
    } catch (error) {
      res.sendBadRequest(getErrorMessage(error) || 'Token verification failed');

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
      const result = await this.service.getAll(req.query);
      res.sendSuccess(
        result,
        'Category list fetched successfully'
      );
    } catch (error) {
      res.sendBadRequest(getErrorMessage(error) || 'Token verification failed');
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
    } catch (error) {
      res.sendBadRequest(getErrorMessage(error) || 'Token verification failed');
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
      const result = await this.service.update(
        Number(req.params.id),
        req.body
      );

      res.sendSuccess(
        result,
        'Category updated successfully'
      );
    } catch (error) {
      next(error);
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
      await this.service.delete(
        Number(req.params.id)
      );

      res.sendSuccess(
        null,
        'Category deleted successfully'
      );
    } catch (error) {
      next(error);
    }
  };
}