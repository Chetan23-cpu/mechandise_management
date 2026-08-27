/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable("print_pos", (table) => {
    table.increments("id").primary();
    table.string("item_code").notNullable();
    table.string("name").notNullable();
    table.mediumtext('image').nullable();
    table.string("shelf").notNullable();
    table.string("quantity").notNullable();
    table.string("location").notNullable();
    table.timestamps(true, true);
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable("print_pos");
};
 