---
to: src/application/repositories/<%= h.changeCase.camel(name) %>/<%= h.changeCase.camel(name) %>.repository.ts
---
'use strict';

import { Op, FindOptions, WhereOptions } from 'sequelize';
import { BaseRepository } from './../base.repository';
import <%= h.changeCase.pascal(name) %>, {
  <%= h.changeCase.pascal(name) %>Attributes,
  <%= h.changeCase.pascal(name) %>CreationAttributes,
} from '@models/<%= h.changeCase.kebab(name) %>.model';


export class <%= h.changeCase.pascal(name) %>Repository   extends BaseRepository<
  <%= h.changeCase.pascal(name) %>,
  <%= h.changeCase.pascal(name) %>Attributes,
  <%= h.changeCase.pascal(name) %>CreationAttributes
> {
  constructor() {
    super(<%= h.changeCase.pascal(name) %>);
  }

  /**
   * Create a new <%= h.changeCase.camel(name) %> record
   * @param payload - The data to create a new <%= h.changeCase.camel(name) %>
   * @returns The created <%= h.changeCase.camel(name) %> record
   */
  async create(payload: any): Promise<any> {
    try {
      // Implement the logic to create a new record in the database
      // Example: return await <%= h.changeCase.pascal(name) %>.create(payload);
      return await <%= h.changeCase.pascal(name) %>.create(payload); 
    } catch (error:any) {
        throw new Error(`Error creating <%= h.changeCase.camel(name) %>: ${error.message}`);
    }
  }
  /**
   * Get all <%= h.changeCase.camel(name) %> records with optional query parameters
   * @param query - The query parameters for filtering, pagination, and sorting
   * @returns A paginated list of <%= h.changeCase.camel(name) %> records
   */
  async findAll(query: any): Promise<any> {
    try {
      const options: FindOptions = {
        where: {},
        limit: query.limit || 10,
        offset: ((query.page || 1) - 1) * (query.limit || 10),
        order: [[query.sortBy || 'created_at', query.sortOrder || 'DESC']],
      };

      if (query.search) {
        options.where = {
          ...options.where,
          # [Op.or]: [
          #   { name: { [Op.like]: `%${query.search}%` } },
          # ],
        };
      }

      const result = await <%= h.changeCase.pascal(name) %>.findAndCountAll(options);
      return {
        data: result.rows,
        pagination: {
          total: result.count,
          page: query.page || 1,
          limit: query.limit || 10,
          totalPages: Math.ceil(result.count / (query.limit || 10)),
        },
      };
    } catch (error:any) {
        throw new Error(`Error fetching <%= h.changeCase.camel(name) %> records: ${error.message}`);
    }
  }
  /**
   * Get a <%= h.changeCase.camel(name) %> record by ID
   * @param id - The ID of the <%= h.changeCase.camel(name) %> to retrieve
   * @returns The <%= h.changeCase.camel(name) %> record with the specified ID, or null if not found
   */
  async findById(id: number): Promise<any | null> {
    try {
      return await <%= h.changeCase.pascal(name) %>.findByPk(id);
    } catch (error:any) {
        throw new Error(`Error fetching <%= h.changeCase.camel(name) %> with ID ${id}: ${error.message}`);
    }

  /**
   * Update a <%= h.changeCase.camel(name) %> record by ID
   * @param id - The ID of the <%= h.changeCase.camel(name) %> to update
   * @param payload - The data to update the <%= h.changeCase.camel(name) %> record with
   * @returns The updated <%= h.changeCase.camel(name) %> record, or null if not found
   */
  async update(id: number, payload: any): Promise<any | null> {
    try {
      const record = await <%= h.changeCase.pascal(name) %>.findByPk(id);
      if (!record) {
        return null;
      }

      await record.update(payload);
      return record;
    } catch (error:any) {
        throw new Error(`Error updating <%= h.changeCase.camel(name) %> with ID ${id}: ${error.message}`);
    }
  }
  /**
   * Delete a <%= h.changeCase.camel(name) %> record by ID
   * @param id - The ID of the <%= h.changeCase.camel(name) %> to delete
   * @returns True if the record was deleted, or false if not found
   */
  async delete(id: number): Promise<boolean> {
    try {
      const record = await <%= h.changeCase.pascal(name) %>.findByPk(id);
      if (!record) {
        return false;
      }

      await record.destroy();
      return true;
    } catch (error:any) {
        throw new Error(`Error deleting <%= h.changeCase.camel(name) %> with ID ${id}: ${error.message}`);
    }
  }
}