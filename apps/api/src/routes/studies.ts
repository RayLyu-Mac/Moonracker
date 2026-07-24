import { Router } from "express";
import { db } from "../db/client";

export const studiesRouter = Router();

studiesRouter.get("/", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT st.study_id, st.protocol_code, st.title, st.sponsor, st.company, st.country, st.status,
              COUNT(DISTINCT s.site_id) AS total_sites,
              COALESCE(ROUND(AVG(sc.total_score), 1), 0) AS average_score
       FROM studies st
       LEFT JOIN sites s ON s.study_id = st.study_id
       LEFT JOIN site_scores sc ON sc.study_id = st.study_id
       GROUP BY st.study_id, st.protocol_code, st.title, st.sponsor, st.company, st.country, st.status
       ORDER BY st.created_at DESC`,
    )
    .all();

  res.json(rows);
});
