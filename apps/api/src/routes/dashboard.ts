import { Router } from "express";
import { db } from "../db/client";

export const dashboardRouter = Router();

dashboardRouter.get("/kpis", (_req, res) => {
  const summary = db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM sites) AS total_sites,
        (SELECT COUNT(*) FROM studies) AS total_studies,
        (SELECT COUNT(*) FROM site_scores WHERE risk_level = 'high') AS high_risk_sites,
        (SELECT COUNT(*) FROM site_scores WHERE risk_level = 'medium') AS medium_risk_sites,
        (SELECT COUNT(*) FROM site_scores WHERE risk_level = 'low') AS low_risk_sites,
        COALESCE((SELECT ROUND(AVG(total_score), 1) FROM site_scores), 0) AS average_site_health_score`,
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
      `SELECT risk_level AS riskLevel, COUNT(*) AS count
       FROM site_scores
       GROUP BY risk_level`,
    )
    .all();
  res.json(rows);
});

dashboardRouter.get("/status-distribution", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT site_status AS status, COUNT(*) AS count
       FROM sites
       GROUP BY site_status`,
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
      `SELECT s.site_id, s.site_number, s.site_name, s.country, ss.total_score, ss.risk_level
       FROM site_scores ss
       JOIN sites s ON s.site_id = ss.site_id
       ORDER BY ss.total_score ASC
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
              COALESCE(ROUND(AVG(ss.total_score), 1), 0) AS avg_score
       FROM studies st
       LEFT JOIN sites s ON s.study_id = st.study_id
       LEFT JOIN site_scores ss ON ss.study_id = st.study_id
       GROUP BY st.study_id, st.title
       ORDER BY avg_score DESC`,
    )
    .all();
  res.json(rows);
});
