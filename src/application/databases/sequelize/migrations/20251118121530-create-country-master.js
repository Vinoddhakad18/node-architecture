'use strict';

/**
 * Country Master Table
 * Stores country reference data.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('country_master', {
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
      code: {
        type: Sequelize.STRING(3),
        allowNull: false,
        unique: true,
        comment: 'ISO 3166-1 alpha-2 or alpha-3 country code'
      },
      currency_code: {
        type: Sequelize.STRING(3),
        allowNull: true,
        comment: 'ISO 4217 currency code'
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
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
    await queryInterface.dropTable('country_master');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_country_master_status";');
  }
};
