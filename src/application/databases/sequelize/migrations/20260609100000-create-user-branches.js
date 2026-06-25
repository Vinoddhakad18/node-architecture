'use strict';

/**
 * User Branches Junction Table
 * Enables a many-to-many relation between users and branches:
 * one user can be assigned to multiple branches and a branch can have many users.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_branches', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'user_master',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      branch_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'branch_masters',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
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

    // Prevent assigning the same branch to the same user more than once
    await queryInterface.addIndex('user_branches', ['user_id', 'branch_id'], {
      unique: true,
      name: 'uniq_user_branches_user_branch',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('user_branches');
  },
};
