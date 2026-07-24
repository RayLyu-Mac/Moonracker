import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "./client";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, "migrations");

const files = fs
  .readdirSync(migrationsDir)
  .filter((file) => file.endsWith(".sql"))
  .sort();

for (const file of files) {
  const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
  db.exec(sql);
  console.log(`Applied migration: ${file}`);
}

const defaultWeights = JSON.stringify({
  startup: 0.25,
  staffing: 0.25,
  retention: 0.25,
  enrollment: 0.25,
});

db.prepare(
  `INSERT INTO app_config (config_key, config_value)
   VALUES ('score_weights', ?)
   ON CONFLICT(config_key)
   DO NOTHING`,
).run(defaultWeights);

console.log("Database migration complete.");
