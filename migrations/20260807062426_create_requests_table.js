exports.up = function (knex) {
  return knex.schema.createTable("requests", (table) => {
    table.increments("id").primary();
    table.string("request_no").notNullable();
    table.string("name").notNullable();
    table.string("email").notNullable();
    table.string("location").notNullable();
    table.string("reason").notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("requests");
};