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
  diseasePrevalence: 0.2,
  historicalRecruitment: 0.2,
  siteType: 0.2,
  adminEfficiency: 0.2,
  prescreening: 0.2,
});

db.prepare(
  `INSERT INTO app_config (config_key, config_value)
   VALUES ('score_weights', ?)
   ON CONFLICT(config_key)
   DO NOTHING`,
).run(defaultWeights);

console.log("Database migration complete.");
