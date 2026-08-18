const bcrypt = require("bcryptjs");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
    const hashedPassword = await bcrypt.hash("Admin#123", 10);

    await knex("users").insert({
        name: "SuperAdmin",
        email: "superadmin@yopmail.com",
        location: JSON.stringify([]),
        isAdmin: "Yes",
        password: hashedPassword,
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
    await knex("users")
        .where("email", "superadmin@yopmail.com")
        .del();
};