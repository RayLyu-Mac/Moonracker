import { Router } from "express";
import { z } from "zod";
import { db } from "../db/client";
import { recomputeScores } from "../services/scoring";

export const configurationRouter = Router();

const weightsSchema = z.object({
  diseasePrevalence: z.number().min(0).max(1),
  historicalRecruitment: z.number().min(0).max(1),
  siteType: z.number().min(0).max(1),
  adminEfficiency: z.number().min(0).max(1),
  prescreening: z.number().min(0).max(1),
});

configurationRouter.get("/weights", (_req, res) => {
  const row = db
    .prepare("SELECT config_value FROM app_config WHERE config_key = 'score_weights'")
    .get() as { config_value: string } | undefined;

  if (!row) {
    res.json({
      diseasePrevalence: 0.2,
      historicalRecruitment: 0.2,
      siteType: 0.2,
      adminEfficiency: 0.2,
      prescreening: 0.2,
    });
    return;
  }

  const parsed = JSON.parse(row.config_value) as Record<string, number>;
  res.json({
    diseasePrevalence: parsed.diseasePrevalence ?? 0.2,
    historicalRecruitment: parsed.historicalRecruitment ?? 0.2,
    siteType: parsed.siteType ?? 0.2,
    adminEfficiency: parsed.adminEfficiency ?? 0.2,
    prescreening: parsed.prescreening ?? 0.2,
  });
});

configurationRouter.post("/weights", (req, res) => {
  const parsed = weightsSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ message: "Invalid weights payload" });
    return;
  }

  const total =
    parsed.data.diseasePrevalence +
    parsed.data.historicalRecruitment +
    parsed.data.siteType +
    parsed.data.adminEfficiency +
    parsed.data.prescreening;
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

// ── AI connection settings ─────────────────────────────────────────────────────

const aiSettingsSchema = z.object({
  baseUrl: z.string().min(1),
  model: z.string().min(1).optional(),
  token: z.string().min(1),
});

configurationRouter.get("/ai-settings", (_req, res) => {
  const settingsRow = db
    .prepare("SELECT config_value FROM app_config WHERE config_key = 'ai_settings'")
    .get() as { config_value: string } | undefined;

  const hasToken = !!db
    .prepare("SELECT config_key FROM app_config WHERE config_key = 'ai_token'")
    .get();

  if (!settingsRow) {
    res.json({ baseUrl: null, model: "gpt-4o-mini", hasToken });
    return;
  }

  const s = JSON.parse(settingsRow.config_value) as { baseUrl: string; model: string };
  res.json({ baseUrl: s.baseUrl ?? null, model: s.model ?? "gpt-4o-mini", hasToken });
});

configurationRouter.post("/ai-settings", (req, res) => {
  const parsed = aiSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid AI settings" });
    return;
  }

  const { baseUrl, model, token } = parsed.data;

  db.prepare(
    `INSERT INTO app_config (config_key, config_value, updated_at)
     VALUES ('ai_settings', ?, CURRENT_TIMESTAMP)
     ON CONFLICT(config_key) DO UPDATE SET config_value = excluded.config_value, updated_at = CURRENT_TIMESTAMP`,
  ).run(JSON.stringify({ baseUrl, model: model ?? "gpt-4o-mini" }));

  db.prepare(
    `INSERT INTO app_config (config_key, config_value, updated_at)
     VALUES ('ai_token', ?, CURRENT_TIMESTAMP)
     ON CONFLICT(config_key) DO UPDATE SET config_value = excluded.config_value, updated_at = CURRENT_TIMESTAMP`,
  ).run(token);

  res.json({ success: true });
});

configurationRouter.delete("/ai-settings", (_req, res) => {
  db.prepare("DELETE FROM app_config WHERE config_key IN ('ai_settings', 'ai_token')").run();
  res.json({ success: true });
});
