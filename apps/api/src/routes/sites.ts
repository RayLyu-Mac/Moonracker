import { Router } from "express";
import { db } from "../db/client";

export const sitesRouter = Router();

sitesRouter.get("/", (req, res) => {
  const { study, status, country, sponsor, risk } = req.query;

  const whereClauses: string[] = [];
  const params: Array<string> = [];

  if (typeof study === "string" && study.length > 0) {
    whereClauses.push("st.study_id = ?");
    params.push(study);
  }
  if (typeof status === "string" && status.length > 0) {
    whereClauses.push("s.site_status = ?");
    params.push(status);
  }
  if (typeof country === "string" && country.length > 0) {
    whereClauses.push("s.country = ?");
    params.push(country);
  }
  if (typeof sponsor === "string" && sponsor.length > 0) {
    whereClauses.push("s.sponsor = ?");
    params.push(sponsor);
  }
  if (typeof risk === "string" && risk.length > 0) {
    whereClauses.push("sc.risk_level = ?");
    params.push(risk);
  }

  const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const rows = db
    .prepare(
      `SELECT s.site_id, s.site_number, s.site_name, s.country, st.title AS study, s.sponsor,
              s.principal_investigator AS pi, s.site_status, COALESCE(sc.total_score, 0) AS health_score,
              COALESCE(sc.risk_level, 'high') AS risk_level,
              (SELECT COUNT(*) FROM retention_cases rc WHERE rc.site_id = s.site_id AND rc.case_status = 'open') AS open_cases
       FROM sites s
       JOIN studies st ON st.study_id = s.study_id
       LEFT JOIN site_scores sc ON sc.site_id = s.site_id
       ${where}
       ORDER BY health_score ASC`,
    )
    .all(...params);

  res.json(rows);
});

sitesRouter.get("/:siteId", (req, res) => {
  const row = db
    .prepare(
      `SELECT s.site_id, s.site_number, s.site_name, s.country, s.site_status, s.sponsor,
              s.principal_investigator, s.selection_date, s.activation_date, s.startup_duration_days,
              st.study_id, st.title AS study_title,
              sc.startup_score, sc.staffing_score, sc.retention_score, sc.enrollment_score,
              sc.total_score, sc.risk_level
       FROM sites s
       JOIN studies st ON st.study_id = s.study_id
       LEFT JOIN site_scores sc ON sc.site_id = s.site_id
       WHERE s.site_id = ?
       ORDER BY sc.created_at DESC
       LIMIT 1`,
    )
    .get(req.params.siteId);

  if (!row) {
    res.status(404).json({ message: "Site not found" });
    return;
  }

  const factors = db
    .prepare(
      `SELECT category, factor_type, label, points, detail
       FROM score_factors
       WHERE site_id = ?
       ORDER BY factor_type DESC`,
    )
    .all(req.params.siteId);

  const retention = db
    .prepare(
      `SELECT
        SUM(CASE WHEN case_type = 'ltfu' THEN 1 ELSE 0 END) AS ltfu_cases,
        SUM(CASE WHEN case_type = 'withdrawal' THEN 1 ELSE 0 END) AS withdrawals,
        SUM(CASE WHEN case_type = 'ip_discontinuation' THEN 1 ELSE 0 END) AS ip_discontinuations,
        SUM(CASE WHEN case_status = 'open' THEN 1 ELSE 0 END) AS open_cases,
        SUM(CASE WHEN case_status = 'closed' THEN 1 ELSE 0 END) AS closed_cases
       FROM retention_cases
       WHERE site_id = ?`,
    )
    .get(req.params.siteId);

  const enrollment = db
    .prepare(
      `SELECT target_enrollment, actual_enrollment,
              CASE WHEN target_enrollment = 0 THEN 0
                   ELSE ROUND(actual_enrollment * 100.0 / target_enrollment, 1)
              END AS enrollment_pct,
              screening_count, randomized_count
       FROM enrollment_metrics
       WHERE site_id = ?
       ORDER BY metric_date DESC
       LIMIT 1`,
    )
    .get(req.params.siteId);

  const staffing = db
    .prepare(
      `SELECT
        COUNT(*) AS total_staff,
        SUM(CASE WHEN role LIKE '%CRC%' OR role LIKE '%coordinator%' THEN 1 ELSE 0 END) AS crc_count,
        ROUND(AVG(capacity_ratio), 2) AS staff_capacity_score
       FROM personnel
       WHERE site_id = ?`,
    )
    .get(req.params.siteId);

  const documents = db
    .prepare(
      `SELECT upload_id, file_name, uploaded_at
       FROM uploads
       WHERE category = 'documents'
       ORDER BY uploaded_at DESC`,
    )
    .all();

  res.json({
    site: row,
    factors,
    retention,
    enrollment,
    staffing,
    documents,
  });
});
