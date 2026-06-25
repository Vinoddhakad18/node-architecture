'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('user_master', 'branch_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'branch_masters',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Branch ID assigned to this user',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('user_master', 'branch_id');
  },
};
