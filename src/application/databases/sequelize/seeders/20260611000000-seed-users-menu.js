'use strict';

/**
 * Seed the "User Management" menu.
 *
 * The user routes are protected by the dynamic, database-driven RBAC
 * middleware (requirePermission), which resolves permissions against the
 * `menus.route` value `/admin/users`. This menu must exist so that
 * role permissions can be configured for it via the permission matrix.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const menus = [
      {
        name: 'User Management',
        route: '/admin/users',
        parent_id: 1,
        sort_order: 5,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    const routes = menus.map((menu) => menu.route);
    const existingMenus = await queryInterface.sequelize.query(
      'SELECT route FROM menus WHERE route IN (:routes)',
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { routes },
      }
    );
    const existingRoutes = new Set(existingMenus.map((menu) => menu.route));
    const newMenus = menus.filter((menu) => !existingRoutes.has(menu.route));

    if (newMenus.length > 0) {
      await queryInterface.bulkInsert('menus', newMenus);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('menus', {
      route: ['/admin/users'],
    });
  },
};
