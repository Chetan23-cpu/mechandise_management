exports.up = function(knex) {
  return knex.schema.alterTable('merchandises', function(table) {
    table.mediumtext('image').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('merchandises', function(table) {
    table.dropColumn('image');
  });
};