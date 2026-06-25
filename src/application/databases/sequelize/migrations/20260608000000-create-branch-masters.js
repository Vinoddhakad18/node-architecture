'use strict';

/**
 * Branch Master Table
 * Stores branch reference data for the application.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('branch_masters', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      branch_name: {
        type: Sequelize.STRING(150),
        allowNull: false,
        comment: 'Branch display name',
      },

      branch_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Unique code for the branch',
      },

      address: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Optional branch address',
      },

      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active',
        comment: 'Branch active status',
      },

      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'User ID who created this branch record',
      },

      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'User ID who last updated this branch record',
      },

      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },

      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('branch_masters');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_branch_masters_status";');
  },
};
