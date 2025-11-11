const path = require("path");
const dotenv = require("dotenv");

const projectRoot = path.resolve(__dirname, "..", "..");
dotenv.config({ path: path.join(projectRoot, ".env") });

const toBool = (value, defaultValue = false) => {
  if (value === undefined) {
    return defaultValue;
  }
  return ["1", "true", "yes"].includes(String(value).toLowerCase());
};

const buildConfig = () => {
  const config = {
    username: process.env.DB_USER || "sejong",
    password: process.env.DB_PASSWORD || "sejong",
    database: process.env.DB_NAME || "sejong",
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    dialect: process.env.DB_DIALECT || "mysql",
    timezone: process.env.DB_TIMEZONE || "+09:00",
    logging: toBool(process.env.DB_LOGGING, false) ? console.log : false,
    dialectOptions: {
      multipleStatements: false
    },
    define: {
      underscored: true,
      timestamps: false
    },
    pool: {
      max: Number(process.env.DB_POOL_MAX || 5),
      min: Number(process.env.DB_POOL_MIN || 0),
      acquire: Number(process.env.DB_POOL_ACQUIRE || 30000),
      idle: Number(process.env.DB_POOL_IDLE || 10000)
    }
  };

  if (toBool(process.env.DB_SSL, false)) {
    config.dialectOptions.ssl = {
      require: true,
      rejectUnauthorized: false
    };
  }

  return config;
};

module.exports = {
  development: buildConfig(),
  test: buildConfig(),
  production: buildConfig()
};
