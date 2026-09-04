/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable("dashboard_data", (table) =>{
    table.increments("id").primary();
    table.string("product_code");
    table.string("location_id");
    table.string("division_id");
    table.string("user_id");
    table.integer("added_qty");
    table.integer("removed_qty");
    table.timestamps(true, true);
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable("dashboard_data");
};
 