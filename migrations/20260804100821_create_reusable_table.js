exports.up = function (knex) {
  return knex.schema.createTable("reusables", (table) => {   // <- return here
    table.increments("id").primary();
    table.string("itemCode").notNullable();
    table.string("name").notNullable();
    table.string("shelf_location").notNullable();
    table.string("location").notNullable();
    table.string("status").notNullable().defaultTo("Available");
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("reusables");   // <- return here
};