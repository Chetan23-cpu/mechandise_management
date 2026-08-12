/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable("request_items", (table) =>{
    table.string("status").notNullable().defaultTo("pending");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable("request_items", (table) =>{
    table.dropColumn("status");
  });
};
