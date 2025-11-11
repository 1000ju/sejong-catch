// src/docs/swagger.js
const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.3",
    info: { title: "Sejong Catch API", version: "1.0.0" },
    servers: [{ url: "http://localhost:8080" }],
  },
  apis: [
    path.join(__dirname, "../routes/*.js"),
    path.join(__dirname, "../controllers/*.js"),
  ], // JSDoc 주석 경로
};
module.exports = swaggerJsdoc(options);
