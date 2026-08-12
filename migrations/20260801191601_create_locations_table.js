exports.up = function (knex) {
  return knex.schema.createTable("locations", (table) => {
    table.increments("id").primary();
    table.string("name").notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("locations");
}; 