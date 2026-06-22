---
 to: src/application/models/<%= h.changeCase.kebab(name) %>.model.ts
---
import {
DataTypes,
Model,
Optional,
} from 'sequelize';

import sequelize from '@config/database';

export interface <%= h.changeCase.pascal(name) %>Attributes {
id: number;

} from 'sequelize';

import sequelize from '@config/database';

export interface <%= h.changeCase.pascal(name) %>Attributes {
id: number;

.filter(Boolean);

fieldList.forEach(field => {
const [fieldName, fieldType] = field.split(':');
%>
<%= fieldName.trim() %>: <%= fieldType === 'number'
? 'number'
: fieldType === 'boolean'
? 'boolean'
: 'string'
%>;
<% }) %>

created_by?: number;
updated_by?: number;
created_at?: number;
updated_at?: number;
deleted_at?: number | null;
}

export interface <%= h.changeCase.pascal(name) %>CreationAttributes
extends Optional<
<%= h.changeCase.pascal(name) %>Attributes,
| 'id'
| 'created_by'
| 'updated_by'
| 'created_at'
| 'updated_at'
| 'deleted_at'

> {}

class <%= h.changeCase.pascal(name) %>
extends Model<
<%= h.changeCase.pascal(name) %>Attributes,
<%= h.changeCase.pascal(name) %>CreationAttributes

>

implements <%= h.changeCase.pascal(name) %>Attributes
{
public id!: number;

<%
fieldList.forEach(field => {
const [fieldName, fieldType] = field.split(':');
%>
public <%= fieldName.trim() %>!: <%= fieldType === 'number'
? 'number'
: fieldType === 'boolean'
? 'boolean'
: 'string'
%>;
<% }) %>

public created_by!: number;
public updated_by!: number;
public created_at!: number;
public updated_at!: number;
public deleted_at!: number | null;
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

let dbType = 'DataTypes.STRING';

if (fieldType === 'number') dbType = 'DataTypes.INTEGER';
if (fieldType === 'boolean') dbType = 'DataTypes.BOOLEAN';
%>
<%= fieldName.trim() %>: {
type: <%= dbType %>,
allowNull: false,
},
<% }) %>

```
created_by: {
  type: DataTypes.BIGINT,
  allowNull: true,
},

updated_by: {
  type: DataTypes.BIGINT,
  allowNull: true,
},

created_at: {
  type: DataTypes.BIGINT,
  allowNull: false,
},

updated_at: {
  type: DataTypes.BIGINT,
  allowNull: false,
},

deleted_at: {
  type: DataTypes.BIGINT,
  allowNull: true,
},
```

},
{
sequelize,
tableName: '<%= h.changeCase.snake(name) %>s',
timestamps: false,
}
);

export default <%= h.changeCase.pascal(name) %>;
