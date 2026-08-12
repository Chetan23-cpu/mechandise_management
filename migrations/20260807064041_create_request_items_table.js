exports.up = function (knex) {
  return knex.schema.createTable("request_items", (table) => {
    table.increments("id").primary();
    table
      .integer("request_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("requests")
      .onDelete("CASCADE");
    table.string("type").notNullable(); // "merchandise" | "reusable"
    table.integer("product_id").notNullable(); // FK to merchandises.id or reusables.id, depending on type
    table.integer("quantity").defaultTo(1);
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("request_items");
};