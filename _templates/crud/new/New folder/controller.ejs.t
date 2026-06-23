---
to: src/application/controllers/<%= h.changeCase.camel(name) %>/<%= h.changeCase.camel(name) %>.controller.ts
---

import { Request, Response, NextFunction } from 'express';
import { getErrorMessage } from '@interfaces/common.interface';
import { <%= h.changeCase.pascal(name) %>Service } from '@/application/services/<%= h.changeCase.camel(name) %>/<%= h.changeCase.camel(name) %>.service';

export class <%= h.changeCase.pascal(name) %>Controller {
  private readonly service = new <%= h.changeCase.pascal(name) %>Service();
/**
  * Create a new <%= h.changeCase.pascal(name) %>
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
        '<%= h.changeCase.pascal(name) %> created successfully'
      );
    } catch (error: any) {
      res.sendBadRequest(getErrorMessage(error) || 'Error creating <%= h.changeCase.pascal(name) %>');

    }
  };

/**
 * Get all <%= h.changeCase.pascal(name) %>s
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
        '<%= h.changeCase.pascal(name) %> list fetched successfully'
      );
    } catch (error: any) {
      res.sendBadRequest(getErrorMessage(error) || 'Error fetching <%= h.changeCase.pascal(name) %>s');
    }
  };

/**
  * Get a <%= h.changeCase.pascal(name) %> by ID
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
        '<%= h.changeCase.pascal(name) %> fetched successfully'
      );
    } catch (error: any) {
      res.sendBadRequest(getErrorMessage(error) || 'Error fetching <%= h.changeCase.pascal(name) %>');
    }
  };

/**
 * Update a <%= h.changeCase.pascal(name) %>
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
        '<%= h.changeCase.pascal(name) %> updated successfully'
      );
    } catch (error: any) {
      res.sendBadRequest(getErrorMessage(error) || 'Error updating <%= h.changeCase.pascal(name) %>');
    }
  };
/** * Delete a <%= h.changeCase.pascal(name) %>
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
        '<%= h.changeCase.pascal(name) %> deleted successfully'
      );
    } catch (error: any) {
      res.sendBadRequest(getErrorMessage(error) || 'Error deleting <%= h.changeCase.pascal(name) %>');
    }
  };
}