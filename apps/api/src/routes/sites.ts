import { Router } from "express";
import { db } from "../db/client";

export const sitesRouter = Router();

const EQUIPMENT_LIST = [
  "12-Lead ECG Machine",
  "Echocardiography System",
  "Holter Monitor",
  "Automated BP Monitoring",
  "Cardiac Stress Test System",
  "Defibrillator / AED",
  "IV Infusion Pumps",
  "−80°C Sample Freezer",
  "CTMS / IWRS Access",
  "Troponin Rapid Assay Kit",
  "Randomisation Kit Storage",
  "Emergency Resuscitation Cart",
];

const createSeededRandom = (seedText: string) => {
  let seed = 2166136261;
  for (let index = 0; index < seedText.length; index += 1) {
    seed ^= seedText.charCodeAt(index);
    seed += (seed << 1) + (seed << 4) + (seed << 7) + (seed << 8) + (seed << 24);
  }

  return () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
};

sitesRouter.get("/", (req, res) => {
  const { siteType, country, sponsor, risk } = req.query;

  const whereClauses: string[] = [];
  const params: Array<string> = [];

  if (typeof siteType === "string" && siteType.length > 0) {
    whereClauses.push("rp.site_type = ?");
    params.push(siteType);
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
    whereClauses.push("rs.recruitment_band = ?");
    params.push(risk);
  }

  const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const rows = db
    .prepare(
            `SELECT s.site_id, s.site_number, s.site_name, s.country, rp.city, rp.site_type, s.sponsor,
              s.principal_investigator AS pi, s.site_status,
              COALESCE(rs.total_score, rp.imported_recruitment_score, 0) AS recruitment_score,
              COALESCE(rs.recruitment_band, 'high') AS recruitment_band,
              rp.imported_recruitment_score, rp.imported_recruitment_class,
              rp.historical_avg_recruitment_rate_per_month,
              rp.admin_efficiency_score,
              rp.prescreen_to_enroll_conversion_pct
       FROM sites s
             LEFT JOIN recruitment_profiles rp ON rp.site_id = s.site_id
             LEFT JOIN recruitment_scores rs ON rs.site_id = s.site_id
       ${where}
             ORDER BY recruitment_score DESC, s.site_name ASC`,
    )
    .all(...params);

  res.json(rows);
});

sitesRouter.get("/:siteId", (req, res) => {
  const row = db
    .prepare(
      `SELECT s.site_id, s.site_number, s.site_name, s.country, s.site_status, s.sponsor,
          s.principal_investigator, s.selection_date, s.activation_date, s.startup_duration_days,
          rp.site_type, rp.city, rp.prevalence_source, rp.heart_disease_prevalence_per_100k,
          rp.catchment_population, rp.estimated_patient_pool,
          rp.historical_study_1_enrolled, rp.historical_study_1_months, rp.historical_study_1_rate_per_month,
          rp.historical_study_2_enrolled, rp.historical_study_2_months, rp.historical_study_2_rate_per_month,
          rp.historical_study_3_enrolled, rp.historical_study_3_months, rp.historical_study_3_rate_per_month,
          rp.historical_avg_recruitment_rate_per_month, rp.historical_trials_completed, rp.historical_retention_rate_pct,
          rp.contract_execution_days, rp.admin_efficiency_score, rp.prescreened_count_30d,
          rp.eligible_count_30d, rp.screen_failure_rate_pct, rp.prescreen_to_enroll_conversion_pct,
          rp.input_data_quality_score, rp.imported_recruitment_score, rp.imported_recruitment_class,
          rs.disease_prevalence_score, rs.historical_recruitment_score, rs.site_type_score,
          rs.admin_efficiency_score AS admin_factor_score, rs.prescreening_score, rs.total_score,
          rs.recruitment_band
       FROM sites s
        LEFT JOIN recruitment_profiles rp ON rp.site_id = s.site_id
        LEFT JOIN recruitment_scores rs ON rs.site_id = s.site_id
       WHERE s.site_id = ?
       LIMIT 1`,
    )
    .get(req.params.siteId);

  if (!row) {
    res.status(404).json({ message: "Site not found" });
    return;
  }

  const factors = db
    .prepare(
      `SELECT factor_key AS category, factor_type, label, points, detail
       FROM recruitment_score_factors
       WHERE site_id = ?
       ORDER BY points DESC`,
    )
    .all(req.params.siteId);

  const retention = {
    ltfu_cases: 0,
    withdrawals: 0,
    ip_discontinuations: 0,
    open_cases: 0,
    closed_cases: 0,
    historical_retention_rate_pct: (row as any).historical_retention_rate_pct ?? 0,
  };

  const enrollment = {
    target_enrollment: (row as any).estimated_patient_pool ?? 0,
    actual_enrollment: Math.round(((row as any).historical_avg_recruitment_rate_per_month ?? 0) * 6),
    enrollment_pct: 0,
    screening_count: (row as any).prescreened_count_30d ?? 0,
    randomized_count: (row as any).eligible_count_30d ?? 0,
  };

  enrollment.enrollment_pct = enrollment.target_enrollment > 0
    ? Number(((enrollment.actual_enrollment / enrollment.target_enrollment) * 100).toFixed(1))
    : 0;

  const staffing = {
    total_staff: null,
    crc_count: null,
    staff_capacity_score: null,
  };

  const documents = db
    .prepare(
      `SELECT upload_id, file_name, uploaded_at
       FROM uploads
       WHERE category = 'documents'
       ORDER BY uploaded_at DESC`,
    )
    .all();

  const random = createSeededRandom(String((row as any).site_id));
  const baseRuns = [
    {
      months: Number((row as any).historical_study_1_months ?? 6),
      ratePerMonth: Number((row as any).historical_study_1_rate_per_month ?? (row as any).historical_avg_recruitment_rate_per_month ?? 6),
    },
    {
      months: Number((row as any).historical_study_2_months ?? 6),
      ratePerMonth: Number((row as any).historical_study_2_rate_per_month ?? (row as any).historical_avg_recruitment_rate_per_month ?? 6),
    },
    {
      months: Number((row as any).historical_study_3_months ?? 6),
      ratePerMonth: Number((row as any).historical_study_3_rate_per_month ?? (row as any).historical_avg_recruitment_rate_per_month ?? 6),
    },
  ];

  const historicalRecruitmentRows = Array.from({ length: 6 }, (_, index) => {
    const base = baseRuns[index % baseRuns.length];
    const monthFactor = 0.8 + random() * 0.5;
    const rateFactor = 0.78 + random() * 0.5;
    const months = Math.max(3, Math.round(base.months * monthFactor));
    const ratePerMonth = Number((base.ratePerMonth * rateFactor).toFixed(1));
    const enrolled = Math.max(5, Math.round(months * ratePerMonth));

    return {
      label: `Recruitment Run ${index + 1}`,
      months,
      ratePerMonth,
      enrolled,
    };
  });

  // Determine if site is in current study (mark 3-5 sites as "not in study" deterministically)
  const siteId = Number((row as any).site_id);
  const inCurrentStudy = !([2, 3, 4, 5].includes(siteId));

  res.json({
    site: {
      ...(row as any),
      inCurrentStudy,
    },
    factors,
    historicalRecruitmentRows,
    retention,
    enrollment,
    staffing,
    documents,
    equipment: (() => {
      const rng = createSeededRandom(String((row as any).site_id) + "_equip");
      return EQUIPMENT_LIST.map((name) => ({ name, available: rng() > 0.28 }));
    })(),
    recruitmentProcess: (() => {
      const rng = createSeededRandom(String((row as any).site_id) + "_proc");
      const score = Number((row as any).total_score ?? 50);
      const randomized = Math.max(2, Math.min(14, Math.round((score / 100) * 13 + rng() * 2)));
      const screening = Math.max(1, Math.min(4, Math.round(1 + rng() * 3)));
      const notActivated = Math.max(0, 20 - randomized - screening);
      return [
        ...Array.from({ length: randomized }, (_, i) => ({ id: i + 1, status: "randomized" as const })),
        ...Array.from({ length: screening }, (_, i) => ({ id: randomized + i + 1, status: "screening" as const })),
        ...Array.from({ length: notActivated }, (_, i) => ({ id: randomized + screening + i + 1, status: "not_activated" as const })),
      ];
    })(),
  });
});
