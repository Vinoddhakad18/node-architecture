'use strict';

/**
 * User Master Table
 * Stores system user accounts.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_master', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },

      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },

      email: {
        type: Sequelize.STRING(120),
        allowNull: false,
        unique: true,
      },

      mobile: {
        type: Sequelize.STRING(15),
        allowNull: true,
        unique: true
      },

      password: {
        type: Sequelize.STRING,
        allowNull: false
      },

      role: {
        type: Sequelize.ENUM('super_admin', 'admin', 'manager', 'user'),
        allowNull: false,
        defaultValue: 'user'
      },

      status: {
        type: Sequelize.ENUM('active', 'inactive', 'deleted'),
        allowNull: false,
        defaultValue: 'active'
      },

      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true
      },

      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true
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
  },

  async down(queryInterface) {
    // Drop enum types before dropping table (Postgres ONLY)
    await queryInterface.dropTable('user_master');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_user_master_role";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_user_master_status";');
  }
};
