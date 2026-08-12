exports.up = function (knex) {
  return knex.schema.alterTable("request_items", (table) => {
    table.string("status").notNullable().defaultTo("pending").alter();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("request_items", (table) => {
    table.string("status").notNullable().alter();
  });
};