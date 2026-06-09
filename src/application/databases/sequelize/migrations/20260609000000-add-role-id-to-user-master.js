'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('user_master', 'role_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'roles',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Role assigned to this user',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('user_master', 'role_id');
  },
};
