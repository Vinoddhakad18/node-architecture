---
to: src/application/services/<%= h.changeCase.camel(name) %>/<%= h.changeCase.camel(name) %>.service.ts
---
import { logger } from '@config/logger';
import { <%= h.changeCase.pascal(name) %>Repository } from '@/infrastructure/repositories/<%= h.changeCase.camel(name) %>/<%= h.changeCase.camel(name) %>.repository';

/**
 * Query options for listing menus
 */
interface <%= h.changeCase.pascal(name) %>QueryOptions {
  page?: number;
  limit?: number;
  search?: string;
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

export class <%= h.changeCase.pascal(name) %>Service {
  private readonly repository = new <%= h.changeCase.pascal(name) %>Repository();

/**
   * Create a new <%= h.changeCase.camel(name) %>
   * @param payload - The data to create a new <%= h.changeCase.camel(name) %>
   * @returns The created <%= h.changeCase.camel(name) %> record
   */
  async create(payload: any, userId?: number) {
    try {
      logger.info(`Creating new <%= h.changeCase.camel(name) %> with payload: ${JSON.stringify(payload)}`);
      const timestamp = Math.floor(Date.now() / 1000);
      const result = await this.repository.create(  {
            ...payload,
            status: payload.status ?? 'active',
            created_by: userId || null,
            updated_by: userId || null,
            created_at: timestamp,
            updated_at: timestamp,
          });
      logger.info(`Successfully created <%= h.changeCase.camel(name) %> with ID: ${result.id}`);
      return result;
    } catch (error: any) {
      logger.error(`Error creating <%= h.changeCase.camel(name) %>: ${error.message}`);
      throw error;
    }
  }
  /**
   * Get all <%= h.changeCase.camel(name) %> records with optional query parameters
   * @param query - Query options for filtering, pagination, and sorting
   * @returns A paginated list of <%= h.changeCase.camel(name) %> records
   */

  async getAll(query?: <%= h.changeCase.pascal(name) %>QueryOptions): Promise<PaginatedResult<any>> {
    try {
      logger.info(`Fetching all <%= h.changeCase.camel(name) %> records with query: ${JSON.stringify(query)}`);
      const result = await this.repository.findAll(query);
      logger.info(`Successfully fetched ${result.data.length} <%= h.changeCase.camel(name) %> records`);
      return result;
    } catch (error: any) {
      logger.error(`Error fetching <%= h.changeCase.camel(name) %> records: ${error.message}`);
      throw error;
    }
  }

/**
   * Get a single <%= h.changeCase.camel(name) %> record by its ID
   * @param id - The ID of the <%= h.changeCase.camel(name) %> to retrieve
   * @returns The <%= h.changeCase.camel(name) %> record with the specified ID, or null if not found
   */
  async getById(id: number): Promise<any | null> {
    try {
      logger.info(`Fetching <%= h.changeCase.camel(name) %> with ID: ${id}`);
      const result = await this.repository.findById(id);
      logger.info(`Successfully fetched <%= h.changeCase.camel(name) %> with ID: ${id}`);
      return result;
    } catch (error: any) {
      logger.error(`Error fetching <%= h.changeCase.camel(name) %> with ID: ${id}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update an existing <%= h.changeCase.camel(name) %> record by its ID
   * @param id - The ID of the <%= h.changeCase.camel(name) %> to update
   * @param payload - The data to update the <%= h.changeCase.camel(name) %> record with
   * @returns The updated <%= h.changeCase.camel(name) %> record, or null if not found
   */
  async update(id: number, payload: any, userId?: number) {
    try {
      logger.info(`Updating <%= h.changeCase.camel(name) %> with ID: ${id}`);
      const result = await this.repository.update(id, {
        ...payload,
        updated_by: userId || null,
        updated_at: Math.floor(Date.now() / 1000),
      });
      logger.info(`Successfully updated <%= h.changeCase.camel(name) %> with ID: ${id}`);
      return result;
    } catch (error: any) {
      logger.error(`Error updating <%= h.changeCase.camel(name) %> with ID: ${id}: ${error.message}`);
      throw error;
    }
  }

/**
   * Delete a <%= h.changeCase.camel(name) %> record by its ID
   * @param id - The ID of the <%= h.changeCase.camel(name) %> to delete
   * @returns A boolean indicating whether the deletion was successful
   */
  async delete(id: number, userId?: number) {
    try {
      logger.info(`Deleting <%= h.changeCase.camel(name) %> with ID: ${id}`);
      const result = await this.repository.delete(id);
      logger.info(`Successfully deleted <%= h.changeCase.camel(name) %> with ID: ${id}`);
      return result;
    } catch (error: any) {
      logger.error(`Error deleting <%= h.changeCase.camel(name) %> with ID: ${id}: ${error.message}`);
      throw error;
    }
  }
}