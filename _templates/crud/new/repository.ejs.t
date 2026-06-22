---
to: src/application/repositories/<%= h.changeCase.camel(name) %>/<%= h.changeCase.camel(name) %>.repository.ts
---
'use strict';

import { Op, FindOptions, WhereOptions } from 'sequelize';
import { BaseRepository } from './base.repository';
import <%= h.changeCase.pascal(name) %> from '@models/<%= h.changeCase.kebab(name) %>.model';


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
      // Example: return await <%= h.changeCase.pascal(name) %>Model.create(payload);
      return await <%= h.changeCase.pascal(name) %>Model.create(payload); 
    } catch (error) {
        throw new Error(`Error creating <%= h.changeCase.camel(name) %>: ${error
  .message}`);
    }
  }

}