---
to: src/application/models/<%= h.changeCase.camel(name) %>.model.ts
---

'use strict';

import { sequelize } from '@config/database';
import { DataTypes, Model, Optional } from 'sequelize';

export interface <%= h.changeCase.pascal(name) %>Attributes {
  id: number;

<%
const fieldList = fields.split(',');
fieldList.forEach(field => {
 const [fieldName, fieldType] = field.split(':');
%>
  <%= fieldName %>: <%= fieldType === 'number'
      ? 'number'
      : fieldType === 'boolean'
      ? 'boolean'
      : 'string' %>;
<% }) %>
}

export interface <%= h.changeCase.pascal(name) %>CreationAttributes
extends Optional<<%= h.changeCase.pascal(name) %>Attributes, 'id'> {}

class <%= h.changeCase.pascal(name) %>
extends Model<
<%= h.changeCase.pascal(name) %>Attributes,
<%= h.changeCase.pascal(name) %>CreationAttributes
>
implements <%= h.changeCase.pascal(name) %>Attributes {

  public id!: number;

<%
fieldList.forEach(field => {
 const [fieldName, fieldType] = field.split(':');
%>
  public <%= fieldName %>!:
  <%= fieldType === 'number'
      ? 'number'
      : fieldType === 'boolean'
      ? 'boolean'
      : 'string' %>;
<% }) %>
}

<%= h.changeCase.pascal(name) %>.init(
{
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },

<%
fieldList.forEach(field => {
 const [fieldName, fieldType] = field.split(':');

 let dataType = 'STRING';

 if (fieldType === 'number') {
   dataType = 'INTEGER';
 } else if (fieldType === 'boolean') {
   dataType = 'BOOLEAN';
 }
%>
  <%= fieldName %>: {
    type: DataTypes.<%= dataType %>,
    allowNull: false,
  },
<% }) %>
},
{
  sequelize,
  tableName: '<%= h.changeCase.snake(name) %>',
  timestamps: true,
}
);

export default <%= h.changeCase.pascal(name) %>;