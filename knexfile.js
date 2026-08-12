require("dotenv").config();

module.exports = {
  development: {
    client: "mysql2",
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: "./migrations",
    },
    seeds: {
      directory: "./seeds",
    },
  },
};