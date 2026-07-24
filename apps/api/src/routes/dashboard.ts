import { Router } from "express";
import { db } from "../db/client";

export const dashboardRouter = Router();

dashboardRouter.get("/kpis", (_req, res) => {
  const summary = db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM sites) AS total_sites,
        (SELECT COUNT(*) FROM studies) AS total_studies,
        (SELECT COUNT(*) FROM recruitment_scores WHERE recruitment_band = 'high') AS high_risk_sites,
        (SELECT COUNT(*) FROM recruitment_scores WHERE recruitment_band = 'medium') AS medium_risk_sites,
        (SELECT COUNT(*) FROM recruitment_scores WHERE recruitment_band = 'low') AS low_risk_sites,
        COALESCE((SELECT ROUND(AVG(total_score), 1) FROM recruitment_scores), 0) AS average_site_health_score`,
    )
    .get() as {
    total_sites: number;
    total_studies: number;
    high_risk_sites: number;
    medium_risk_sites: number;
    low_risk_sites: number;
    average_site_health_score: number;
  };

  res.json({
    totalSites: summary.total_sites,
    totalStudies: summary.total_studies,
    highRiskSites: summary.high_risk_sites,
    mediumRiskSites: summary.medium_risk_sites,
    lowRiskSites: summary.low_risk_sites,
    averageSiteHealthScore: summary.average_site_health_score,
  });
});

dashboardRouter.get("/risk-distribution", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT recruitment_band AS riskLevel, COUNT(*) AS count
       FROM recruitment_scores
       GROUP BY recruitment_band`,
    )
    .all();
  res.json(rows);
});

dashboardRouter.get("/status-distribution", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT rp.site_type AS status, COUNT(*) AS count
       FROM recruitment_profiles rp
       GROUP BY rp.site_type
       ORDER BY count DESC`,
    )
    .all();
  res.json(rows);
});

dashboardRouter.get("/sites-by-country", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT country, COUNT(*) AS count
       FROM sites
       GROUP BY country
       ORDER BY count DESC`,
    )
    .all();
  res.json(rows);
});

dashboardRouter.get("/top-risk-sites", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT s.site_id, s.site_number, s.site_name, s.country, rp.site_type, rs.total_score, rs.recruitment_band AS risk_level
       FROM recruitment_scores rs
       JOIN sites s ON s.site_id = rs.site_id
       JOIN recruitment_profiles rp ON rp.site_id = s.site_id
       ORDER BY rs.total_score DESC, s.site_name ASC
       LIMIT 10`,
    )
    .all();
  res.json(rows);
});

dashboardRouter.get("/study-comparison", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT st.study_id, st.title,
              COUNT(DISTINCT s.site_id) AS total_sites,
          COALESCE(ROUND(AVG(rs.total_score), 1), 0) AS avg_score
       FROM studies st
       LEFT JOIN sites s ON s.study_id = st.study_id
        LEFT JOIN recruitment_scores rs ON rs.study_id = st.study_id
       GROUP BY st.study_id, st.title
       ORDER BY avg_score DESC`,
    )
    .all();
  res.json(rows);
});

dashboardRouter.get("/predicted-vs-actual", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT s.site_id, s.site_name, s.country, rp.site_type,
              rp.imported_recruitment_score AS predicted,
              rs.total_score AS actual,
              rs.recruitment_band
       FROM sites s
       JOIN recruitment_profiles rp ON rp.site_id = s.site_id
       JOIN recruitment_scores rs    ON rs.site_id  = s.site_id
       ORDER BY s.site_name ASC`,
    )
    .all();
  res.json(rows);
});
