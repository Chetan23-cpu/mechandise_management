exports.up = function(knex) {
  return knex.schema.alterTable('reusables', function(table) {
    table.mediumtext('image').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('reusables', function(table) {
    table.dropColumn('image');
  });
};