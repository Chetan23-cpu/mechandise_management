exports.up = function (knex) {
  return knex.schema.alterTable("reusables", (table) => {
    table.string("checkedout_email");
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("reusables", (table) => {
    table.dropColumn("checkedout_email");
  });
};