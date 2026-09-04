require("dotenv").config();

const config = {
  client: "mysql2",
  connection: process.env.DATABASE_URL,
  migrations: {
    directory: "./migrations",
  },
  seeds: {
    directory: "./seeds",
  },
};

module.exports = {
  development: config,
  production: config,
};