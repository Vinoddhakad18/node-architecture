'use strict';

/**
 * Migration: Add last_login column to user_master table
 * Tracks the last login timestamp for users
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('user_master', 'last_login', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Timestamp of the user\'s last successful login'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('user_master', 'last_login');
  }
};
