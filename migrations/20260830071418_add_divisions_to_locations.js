export async function up(knex) {
  await knex.schema.alterTable("locations", (table) => {
    table.json("divisions").nullable();
  });
}

export async function down(knex) {
  await knex.schema.alterTable("locations", (table) => {
    table.dropColumn("divisions");
  });
}