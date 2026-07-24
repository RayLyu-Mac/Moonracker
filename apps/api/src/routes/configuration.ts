import { Router } from "express";
import { z } from "zod";
import { db } from "../db/client";
import { recomputeScores } from "../services/scoring";

export const configurationRouter = Router();

const weightsSchema = z.object({
  startup: z.number().min(0).max(1),
  staffing: z.number().min(0).max(1),
  retention: z.number().min(0).max(1),
  enrollment: z.number().min(0).max(1),
});

configurationRouter.get("/weights", (_req, res) => {
  const row = db
    .prepare("SELECT config_value FROM app_config WHERE config_key = 'score_weights'")
    .get() as { config_value: string } | undefined;

  if (!row) {
    res.json({ startup: 0.25, staffing: 0.25, retention: 0.25, enrollment: 0.25 });
    return;
  }

  res.json(JSON.parse(row.config_value));
});

configurationRouter.post("/weights", (req, res) => {
  const parsed = weightsSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: "Invalid weights payload" });
    return;
  }

  const total = parsed.data.startup + parsed.data.staffing + parsed.data.retention + parsed.data.enrollment;
  if (Math.abs(total - 1) > 0.001) {
    res.status(400).json({ message: "Weights must sum to 1" });
    return;
  }

  db.prepare(
    `INSERT INTO app_config (config_key, config_value, updated_at)
     VALUES ('score_weights', ?, CURRENT_TIMESTAMP)
     ON CONFLICT(config_key) DO UPDATE SET
       config_value = excluded.config_value,
       updated_at = CURRENT_TIMESTAMP`,
  ).run(JSON.stringify(parsed.data));

  recomputeScores();

  res.json({ success: true, weights: parsed.data });
});
