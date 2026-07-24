import { Router } from "express";
import { z } from "zod";
import { db } from "../db/client";

export const aiRouter = Router();

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(8000),
      }),
    )
    .min(1)
    .max(50),
});

const buildSystemContext = (): string => {
  const sites = db
    .prepare(
      `SELECT s.site_id, s.site_name, rp.site_type, rp.city, s.country,
              rs.total_score, rs.recruitment_band,
              rp.historical_avg_recruitment_rate_per_month,
              rp.heart_disease_prevalence_per_100k,
              rp.contract_execution_days, rp.admin_efficiency_score,
              rp.prescreened_count_30d, rp.eligible_count_30d,
              rp.prescreen_to_enroll_conversion_pct,
              rp.historical_trials_completed, rp.historical_retention_rate_pct,
              rs.disease_prevalence_score, rs.historical_recruitment_score,
              rs.site_type_score, rs.prescreening_score
       FROM sites s
       LEFT JOIN recruitment_profiles rp ON rp.site_id = s.site_id
       LEFT JOIN recruitment_scores rs ON rs.site_id = s.site_id
       ORDER BY rs.total_score DESC`,
    )
    .all() as Array<{
    site_id: string;
    site_name: string;
    site_type: string | null;
    city: string | null;
    country: string;
    total_score: number | null;
    recruitment_band: string | null;
    historical_avg_recruitment_rate_per_month: number | null;
    heart_disease_prevalence_per_100k: number | null;
    contract_execution_days: number | null;
    admin_efficiency_score: number | null;
    prescreened_count_30d: number | null;
    eligible_count_30d: number | null;
    prescreen_to_enroll_conversion_pct: number | null;
    historical_trials_completed: number | null;
    historical_retention_rate_pct: number | null;
    disease_prevalence_score: number | null;
    historical_recruitment_score: number | null;
    site_type_score: number | null;
    prescreening_score: number | null;
  }>;

  if (sites.length === 0) {
    return "No site data is currently loaded. Inform the user to upload a recruitment profile CSV first.";
  }

  const avgScore = (sites.reduce((sum, s) => sum + (s.total_score ?? 0), 0) / sites.length).toFixed(1);

  const siteSummaries = sites
    .map(
      (s) =>
        `- ${s.site_name} (${s.site_id}), ${s.site_type ?? "?"}, ${s.city ?? "?"}, ${s.country}: ` +
        `Score ${s.total_score ?? 0} [${s.recruitment_band ?? "unknown"} band], ` +
        `Hist. rate ${s.historical_avg_recruitment_rate_per_month ?? 0}/month over ${s.historical_trials_completed ?? 0} trials, ` +
        `Prevalence ${s.heart_disease_prevalence_per_100k ?? 0}/100k, ` +
        `Contract ${s.contract_execution_days ?? 0} days admin score ${s.admin_efficiency_score ?? 0}, ` +
        `Prescreened ${s.prescreened_count_30d ?? 0}/month eligible ${s.eligible_count_30d ?? 0} conversion ${s.prescreen_to_enroll_conversion_pct ?? 0}%, ` +
        `Retention ${s.historical_retention_rate_pct ?? 0}%`,
    )
    .join("\n");

  return `You are a clinical trial recruitment analyst specialising in heart disease studies. Answer concisely and insightfully using only the data provided below.

DATASET SUMMARY:
Total sites: ${sites.length}
Average recruitment score: ${avgScore}
Green band (low band, strongest): ${sites.filter((s) => s.recruitment_band === "low").length} sites
Orange band (medium): ${sites.filter((s) => s.recruitment_band === "medium").length} sites
Red band (high band, needs attention): ${sites.filter((s) => s.recruitment_band === "high").length} sites

SITES (sorted by score, highest first):
${siteSummaries}

SCORING MODEL:
Bands: low/green = best recruitment potential, medium/orange = moderate, high/red = poor.
Five weighted factors: disease prevalence (CDC Wonder), historical recruitment rate, site type (university > hospital > clinic), admin efficiency (contract days + admin score), prescreening logs (conversion rate, eligible rate, data quality).

Keep answers concise. When a question references a specific site ID or name, include that site's full metrics in your answer.`;
};

aiRouter.post("/chat", async (req, res) => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Invalid request body" });
    return;
  }

  const settingsRow = db
    .prepare("SELECT config_value FROM app_config WHERE config_key = 'ai_settings'")
    .get() as { config_value: string } | undefined;

  const tokenRow = db
    .prepare("SELECT config_value FROM app_config WHERE config_key = 'ai_token'")
    .get() as { config_value: string } | undefined;

  if (!settingsRow || !tokenRow) {
    res
      .status(503)
      .json({ message: "AI is not configured. Add a base URL and API token in the AI Assistant settings." });
    return;
  }

  const settings = JSON.parse(settingsRow.config_value) as { baseUrl: string; model: string };
  const token = tokenRow.config_value;
  const systemContext = buildSystemContext();

  const messages = [{ role: "system" as const, content: systemContext }, ...parsed.data.messages];

  try {
    const endpoint = settings.baseUrl.replace(/\/$/, "") + "/chat/completions";
    const aiResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: settings.model,
        messages,
        max_tokens: 1200,
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      res.status(502).json({
        message: `AI API returned ${aiResponse.status}`,
        detail: errorText.slice(0, 400),
      });
      return;
    }

    const data = (await aiResponse.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      res.status(502).json({ message: "AI returned an empty response" });
      return;
    }

    res.json({ content });
  } catch (error) {
    res.status(502).json({ message: `Failed to reach AI endpoint: ${(error as Error).message}` });
  }
});
