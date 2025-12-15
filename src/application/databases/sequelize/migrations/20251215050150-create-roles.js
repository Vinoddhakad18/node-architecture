'use strict';

/**
 * Roles Table
 * Stores role definitions for role-based access control (RBAC).
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('roles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },

      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'Role name (must be unique)'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Role description'
      },
      status: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Role status: true = active, false = inactive'
      },

      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'User ID who created this role'
      },

      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'User ID who last updated this role'
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

    // Create index on status for filtering active roles
    // Note: name column already has unique: true, so no need for separate unique index
    await queryInterface.addIndex('roles', ['status'], {
      name: 'idx_roles_status'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('roles');
  }
};
