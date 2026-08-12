exports.up = function (knex) {
  return knex.schema.alterTable("activity_logs", (table) => {
    table
      .integer("location_id")
      .unsigned()
      .references("id")
      .inTable("locations")
      .onDelete("SET NULL");
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("activity_logs", (table) => {
    table.dropColumn("location_id");
  });
};