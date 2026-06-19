'use strict';

/**
 * Seed default menu items
 * Inserts the initial menu entries for navigation and RBAC setup
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const menus = [
       {
        name: 'Admin Panel',
        route: '/#',
        parent_id: null,
        sort_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Menu Management',
        route: '/admin/menus',
        parent_id: 1,
        sort_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Role Management',
        route: '/admin/roles',
        parent_id: 1,
        sort_order: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'RBAC Permission',
        route: '/admin/rbac-permissions',
        parent_id: 1,
        sort_order: 4,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: 'Branch Management',
        route: '/admin/branches',
        parent_id: 1,
        sort_order: 3,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    const routes = menus.map(menu => menu.route);
    const existingMenus = await queryInterface.sequelize.query(
      'SELECT route FROM menus WHERE route IN (:routes)',
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { routes },
      }
    );
    const existingRoutes = new Set(existingMenus.map(menu => menu.route));
    const newMenus = menus.filter(menu => !existingRoutes.has(menu.route));

    if (newMenus.length > 0) {
      await queryInterface.bulkInsert('menus', newMenus);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('menus', {
      route: ['/admin/menus', '/admin/roles', '/admin/rbac-permissions'],
    });
  },
};
