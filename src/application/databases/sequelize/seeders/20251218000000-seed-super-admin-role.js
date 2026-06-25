'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const roleName = 'super_admin';
    const description = 'Super Admin role with full access permissions';
    const roleBranchName = 'super_admin_branch';
    const branchDescription = 'Super Admin Branch role with full access permissions';

    const roles = [
      {
        name: roleName,
        description,
        status: true,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: roleBranchName,
        description: branchDescription,
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    const roleNames = roles.map(role => role.name);
    const existingRoles = await queryInterface.sequelize.query(
      'SELECT name FROM roles WHERE name IN (:roleNames)',
      {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { roleNames },
      }
    );

    const existingNames = new Set(existingRoles.map(role => role.name));
    const rolesToInsert = roles.filter(role => !existingNames.has(role.name));

    if (rolesToInsert.length === 0) {
      console.log(`✅ Roles already exist. Skipping insert.`);
      return;
    }

    await queryInterface.bulkInsert('roles', rolesToInsert);
    console.log(`✅ Inserted ${rolesToInsert.length} role(s).`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', {
      name: ['super_admin', 'super_admin_branch'],
    });
  },
};
