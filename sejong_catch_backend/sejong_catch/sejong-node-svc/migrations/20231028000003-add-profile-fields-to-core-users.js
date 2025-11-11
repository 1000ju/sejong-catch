"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("core_users", "major", {
      type: Sequelize.STRING(200),
      allowNull: true,
      after: "name"
    });

    await queryInterface.addColumn("core_users", "year", {
      type: Sequelize.INTEGER,
      allowNull: true,
      after: "major"
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("core_users", "year");
    await queryInterface.removeColumn("core_users", "major");
  }
};
