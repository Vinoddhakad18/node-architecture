---
to: src/application/database/migrations/<%= Date.now() %>-create-<%= h.changeCase.kebab(name) %>.ts
---

import { QueryInterface, DataTypes } from 'sequelize';

export default {
  async up(queryInterface: QueryInterface) {
    await queryInterface.createTable('<%= h.changeCase.snake(name) %>s', {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },

<%
const fieldList = (locals.fields || '')
  .split(',')
  .filter(Boolean);

fieldList.forEach(field => {
  const [fieldName, fieldType] = field.split(':');

  let dbType = 'DataTypes.STRING';

  switch ((fieldType || '').trim()) {
    case 'number':
      dbType = 'DataTypes.INTEGER';
      break;
    case 'boolean':
      dbType = 'DataTypes.BOOLEAN';
      break;
    case 'date':
      dbType = 'DataTypes.DATE';
      break;
  }
%>
      <%= fieldName.trim() %>: {
        type: <%= dbType %>,
        allowNull: false,
      },
<% }) %>

      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      }
    });
  },

  async down(queryInterface: QueryInterface) {
    await queryInterface.dropTable('<%= h.changeCase.snake(name) %>s');
  }
};