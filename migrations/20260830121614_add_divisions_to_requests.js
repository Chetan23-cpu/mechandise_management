export async function up(knex) {
  await knex.schema.alterTable("requests", (table) => {
    table.integer("divisions").unsigned().nullable();
  });
}

export async function down(knex) {
  await knex.schema.alterTable("requests", (table) => {
    table.dropColumn("divisions");
  });
}