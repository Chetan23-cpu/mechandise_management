exports.up = function(knex) {
  return knex.schema.alterTable('requests', function(table) {
    table.string('requested_to');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('requests', function(table) {
    table.dropColumn('requested_to');
  });
};