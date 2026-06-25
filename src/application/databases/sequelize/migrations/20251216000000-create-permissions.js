'use strict';

/**
 * Permissions Table
 * Stores individual permission actions (view, add, edit, delete, export, status).
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('permissions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },

      key: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Permission key (e.g., view, add, edit, delete, export, status)'
      },

      label: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Human-readable permission label (e.g., View, Add, Edit, Delete, Export, Status)'
      },

      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      },

      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    // Create index on key for faster lookups
    await queryInterface.addIndex('permissions', ['key'], {
      name: 'idx_permissions_key',
      unique: true
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('permissions');
  }
};

