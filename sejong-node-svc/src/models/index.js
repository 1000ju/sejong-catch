const { Sequelize, DataTypes } = require("sequelize");
const dbConfig = require("../config/database");

const env = process.env.NODE_ENV || "development";
const config = dbConfig[env];

if (!config) {
  throw new Error(`Database configuration for environment "${env}" is not defined.`);
}

const sequelize = new Sequelize({
  ...config,
  logging: config.logging || false
});

const modelDefiners = [
  require("./coreUser"),
  require("./coreAuthAccount"),
  require("./corePaymentRecord"),
  require("./coreAuditLog"),
  require("./catchBooth"),
  require("./catchQueueEntry"),
  require("./catchCheckinEvent"),
  require("./catchQrToken"),
  require("./catchNotification"),
  require("./catchBoothMetric"),
  require("./crawlSource"),
  require("./crawlResult"),
  require("./crawlTag"),
  require("./crawlResultTag"),
  require("./crawlJob"),
  require("./crawlRun"),
  require("./crawlFeedImpression")
];

const models = {};

for (const defineModel of modelDefiners) {
  const model = defineModel(sequelize, DataTypes);
  models[model.name] = model;
}

Object.values(models).forEach((model) => {
  if (typeof model.associate === "function") {
    model.associate(models);
  }
});

module.exports = {
  sequelize,
  Sequelize,
  models
};
