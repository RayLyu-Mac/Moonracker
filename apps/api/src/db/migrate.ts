import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "./client";
import { processUpload } from "../services/uploadPipeline";
import { recomputeScores } from "../services/scoring";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, "migrations");
const defaultRecruitmentCsvPath = path.resolve(__dirname, "../../../../heart_disease_site_recruitment_dummy_under20.csv");

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

const studiesCount = Number(
  (db.prepare("SELECT COUNT(*) AS count FROM studies").get() as { count: number }).count,
);

if (studiesCount === 0 && fs.existsSync(defaultRecruitmentCsvPath)) {
  const seedResult = processUpload({
    fileName: path.basename(defaultRecruitmentCsvPath),
    categoryInput: "recruitment_profile",
    buffer: fs.readFileSync(defaultRecruitmentCsvPath),
  });

  if (seedResult.status === "success") {
    recomputeScores();
    console.log(
      `Seeded recruitment data from ${path.basename(defaultRecruitmentCsvPath)} with ${seedResult.inserted} rows.`,
    );
  } else {
    console.warn(
      `Automatic seed failed for ${path.basename(defaultRecruitmentCsvPath)}: ${seedResult.validationErrors
        .map((entry) => `row ${entry.row}: ${entry.message}`)
        .join("; ")}`,
    );
  }
}

console.log("Database migration complete.");
