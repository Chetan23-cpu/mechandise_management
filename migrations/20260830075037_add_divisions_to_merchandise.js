export async function up(knex) {
  await knex.schema.alterTable("merchandises", (table) => {
    table.json("divisions").nullable();
    table.string("minquantity").notNullable();
  });
}

export async function down(knex) {
  await knex.schema.alterTable("merchandises", (table) => {
    table.dropColumn("divisions");
    table.dropColumn("minquantity").notNullable();
  });
}