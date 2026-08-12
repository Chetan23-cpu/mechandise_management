exports.seed = async function (knex) {
  await knex("locations").del();
  await knex("locations").insert([
    { name: "Killarney"},
    { name: "Weston"},
    { name: "Finol"},
    { name: "Poitiers" },
    { name: "Boikube" },
  ]);
};