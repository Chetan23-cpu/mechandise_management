import knex from "knex";

const db = knex({
  client: "mysql2",
  connection: process.env.DATABASE_URL,
});

export default db;