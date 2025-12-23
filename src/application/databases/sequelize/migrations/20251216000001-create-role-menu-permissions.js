'use strict';

/**
 * Role Menu Permissions Table
 * Stores permission flags per role + menu combination.
 * Each row represents permissions for a specific role on a specific menu.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('role_menu_permissions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },

      role_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Foreign key to roles table'
      },

      menu_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'menus',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Foreign key to menus table'
      },

      can_view: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Permission to view menu/module'
      },

      can_add: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Permission to add/create records'
      },

      can_edit: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Permission to edit/update records'
      },

      can_delete: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Permission to delete records'
      },

      can_export: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Permission to export data'
      },

      can_status: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Permission to change status'
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

    // Create unique index on (role_id, menu_id) to prevent duplicates
    await queryInterface.addIndex('role_menu_permissions', ['role_id', 'menu_id'], {
      name: 'idx_role_menu_permissions_unique',
      unique: true
    });

    // Create indexes for faster lookups
    await queryInterface.addIndex('role_menu_permissions', ['role_id'], {
      name: 'idx_role_menu_permissions_role_id'
    });

    await queryInterface.addIndex('role_menu_permissions', ['menu_id'], {
      name: 'idx_role_menu_permissions_menu_id'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('role_menu_permissions');
  }
};

