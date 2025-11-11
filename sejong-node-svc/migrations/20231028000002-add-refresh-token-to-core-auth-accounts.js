"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("core_auth_accounts", "refresh_token", {
      type: Sequelize.STRING(500),
      allowNull: true,
      after: "password_hash"
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("core_auth_accounts", "refresh_token");
  }
};
