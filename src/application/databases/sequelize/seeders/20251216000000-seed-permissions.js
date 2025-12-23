'use strict';

/**
 * Seed default permissions
 * Inserts the standard permission actions: view, add, edit, delete, export, status
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const permissions = [
      { key: 'view', label: 'View', created_at: new Date(), updated_at: new Date() },
      { key: 'add', label: 'Add', created_at: new Date(), updated_at: new Date() },
      { key: 'edit', label: 'Edit', created_at: new Date(), updated_at: new Date() },
      { key: 'delete', label: 'Delete', created_at: new Date(), updated_at: new Date() },
      { key: 'export', label: 'Export', created_at: new Date(), updated_at: new Date() },
      { key: 'status', label: 'Status', created_at: new Date(), updated_at: new Date() }
    ];

    await queryInterface.bulkInsert('permissions', permissions, {
      ignoreDuplicates: true // Prevent errors if permissions already exist
    });
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('permissions', {
      key: ['view', 'add', 'edit', 'delete', 'export', 'status']
    });
  }
};

