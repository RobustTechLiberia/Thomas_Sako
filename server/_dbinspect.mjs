import mysql from "mysql2/promise";

const c = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "@Admin1234",
  database: "db_poll",
});

const [tables] = await c.query("SHOW TABLES");
console.log("TABLES:", tables.map((r) => Object.values(r)[0]).join(", "));

const [cols] = await c.query(
  "SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'db_poll' ORDER BY TABLE_NAME, ORDINAL_POSITION"
);
const groups = {};
for (const r of cols) {
  (groups[r.TABLE_NAME] = groups[r.TABLE_NAME] || []).push(
    `${r.COLUMN_NAME} ${r.COLUMN_TYPE}`
  );
}
for (const [k, v] of Object.entries(groups)) {
  console.log(`--- ${k} ---\n${v.join("\n")}`);
}

const [settings] = await c.query("SELECT `key`, LEFT(JSON_EXTRACT(`value`, '$'), 200) AS val FROM site_settings");
console.log("--- site_settings keys ---");
for (const s of settings) console.log(s.key, "=", s.val);

await c.end();