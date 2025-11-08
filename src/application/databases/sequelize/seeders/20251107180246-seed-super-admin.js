'use strict';

const bcrypt = require("bcryptjs");

module.exports = {
  async up(queryInterface, Sequelize) {

    // Super Admin Details
    const email = "superadmin@example.com";
    const password = await bcrypt.hash("Super@123", 10); // Hash password

    // Check if already exists
    const [user] = await queryInterface.sequelize.query(
      `SELECT id FROM user_master WHERE email = :email`,
      { replacements: { email } }
    );

    if (user.length > 0) {
      console.log("✅ Super Admin already exists. Skipping insert.");
      return;
    }

    // Insert User
    await queryInterface.bulkInsert("user_master", [
      {
        name: "Super Admin",
        email: email,
        mobile: null,
        password: password,
        role: "super_admin",
        status: "active",
        created_by: null,
        updated_by: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    console.log("✅ Super Admin inserted successfully.");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("user_master", { email: "superadmin@example.com" });
  }
};
