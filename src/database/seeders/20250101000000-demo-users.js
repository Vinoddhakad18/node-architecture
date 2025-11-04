'use strict';

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Password123!', salt);

    await queryInterface.bulkInsert('users', [
      {
        id: uuidv4(),
        email: 'admin@example.com',
        password: hashedPassword,
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        is_active: true,
        is_verified: true,
        last_login: null,
        refresh_token: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'user@example.com',
        password: hashedPassword,
        first_name: 'Regular',
        last_name: 'User',
        role: 'user',
        is_active: true,
        is_verified: true,
        last_login: null,
        refresh_token: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        email: 'moderator@example.com',
        password: hashedPassword,
        first_name: 'Moderator',
        last_name: 'User',
        role: 'moderator',
        is_active: true,
        is_verified: true,
        last_login: null,
        refresh_token: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      email: {
        [Sequelize.Op.in]: ['admin@example.com', 'user@example.com', 'moderator@example.com']
      }
    }, {});
  }
};
