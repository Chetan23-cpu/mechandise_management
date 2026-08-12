exports.up = function (knex) {
  return knex.schema.createTable("activity_logs", (table) => {
    table.increments("id").primary();
    table.string("email").notNullable();
    table.string("action").notNullable();
    table.string("comment");
    table.timestamp("date").notNullable().defaultTo(knex.fn.now());
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("activity_logs");
};