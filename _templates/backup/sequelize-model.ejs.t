---
to: src/application/databases/sequelize/migrations/<%= h.changeCase.camel(name) %>/<%= h.changeCase.camel(name) %>.model.ts
---

import { Model, DataTypes } from 'sequelize';
import sequelize from '../../config/database';

export class <%= h.changeCase.pascal(name) %> extends Model {}

<%= h.changeCase.pascal(name) %>.init(
{
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  }
},
{
  sequelize,
  tableName: '<%= h.changeCase.snake(name) %>s'
}
);

export default <%= h.changeCase.pascal(name) %>;