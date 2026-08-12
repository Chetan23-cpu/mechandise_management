exports.up = function (knex) {
    return knex.schema.createTable("merchandises", (table) => {
        table.increments("id").primary();
        table.string("item_code").notNullable();
        table.string("name").notNullable();
        table.string("shelf_location").notNullable();
        table.string("quantity").notNullable();
        table.string("location").notNullable();
        table.timestamps(true, true);
    });
};

exports.down = function (knex) {
    return knex.schema.dropTable("merchandises");
}