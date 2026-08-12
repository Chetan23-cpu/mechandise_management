
exports.up = function (knex) {
  return knex.schema.alterTable("activity_logs", (table) => {
    table.string("email").nullable().alter();
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("activity_logs", (table) => {
    table.string("email").notNullable().alter();
  });
};