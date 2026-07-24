import { db } from "../db/client";

type ScoreWeights = {
  startup: number;
  staffing: number;
  retention: number;
  enrollment: number;
};

type Factor = {
  category: "startup" | "staffing" | "retention" | "enrollment";
  factorType: "positive" | "negative";
  label: string;
  points: number;
  detail: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getWeights = (): ScoreWeights => {
  const raw = db
    .prepare("SELECT config_value FROM app_config WHERE config_key = 'score_weights'")
    .get() as { config_value?: string } | undefined;

  if (!raw?.config_value) {
    return { startup: 0.25, staffing: 0.25, retention: 0.25, enrollment: 0.25 };
  }

  const parsed = JSON.parse(raw.config_value) as ScoreWeights;
  return {
    startup: parsed.startup ?? 0.25,
    staffing: parsed.staffing ?? 0.25,
    retention: parsed.retention ?? 0.25,
    enrollment: parsed.enrollment ?? 0.25,
  };
};

export const recomputeScores = (): void => {
  const sites = db
    .prepare(
      `SELECT s.site_id, s.study_id, s.startup_duration_days,
              COUNT(DISTINCT p.personnel_id) AS total_staff,
              SUM(CASE WHEN p.role LIKE '%CRC%' OR p.role LIKE '%coordinator%' THEN 1 ELSE 0 END) AS crc_count,
              SUM(CASE WHEN p.is_active = 1 THEN 1 ELSE 0 END) AS active_staff,
              SUM(CASE WHEN rc.case_status = 'open' THEN 1 ELSE 0 END) AS open_cases,
              SUM(CASE WHEN rc.case_type = 'withdrawal' THEN 1 ELSE 0 END) AS withdrawal_cases,
              SUM(CASE WHEN rc.case_type = 'ltfu' THEN 1 ELSE 0 END) AS ltfu_cases,
              em.target_enrollment,
              em.actual_enrollment,
              em.randomized_count
       FROM sites s
       LEFT JOIN personnel p ON p.site_id = s.site_id
       LEFT JOIN retention_cases rc ON rc.site_id = s.site_id
       LEFT JOIN (
         SELECT site_id, study_id, target_enrollment, actual_enrollment, randomized_count
         FROM enrollment_metrics em1
         WHERE metric_date = (
           SELECT MAX(metric_date) FROM enrollment_metrics em2
           WHERE em2.site_id = em1.site_id AND em2.study_id = em1.study_id
         )
       ) em ON em.site_id = s.site_id AND em.study_id = s.study_id
       GROUP BY s.site_id, s.study_id, s.startup_duration_days, em.target_enrollment, em.actual_enrollment, em.randomized_count`,
    )
    .all() as Array<{
    site_id: string;
    study_id: string;
    startup_duration_days: number | null;
    total_staff: number;
    crc_count: number;
    active_staff: number;
    open_cases: number;
    withdrawal_cases: number;
    ltfu_cases: number;
    target_enrollment: number | null;
    actual_enrollment: number | null;
    randomized_count: number | null;
  }>;

  const weights = getWeights();

  const insertScore = db.prepare(
    `INSERT INTO site_scores (
      site_id, study_id, score_date, startup_score, staffing_score, retention_score, enrollment_score, total_score, risk_level
    ) VALUES (?, ?, DATE('now'), ?, ?, ?, ?, ?, ?)`,
  );

  const insertFactor = db.prepare(
    `INSERT INTO score_factors (
      score_id, site_id, study_id, category, factor_type, label, points, detail
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const clearScores = db.prepare("DELETE FROM site_scores");
  const clearFactors = db.prepare("DELETE FROM score_factors");

  const tx = db.transaction(() => {
    clearFactors.run();
    clearScores.run();

    for (const site of sites) {
      const factors: Factor[] = [];

      const startupDays = site.startup_duration_days ?? 120;
      const startupRaw = clamp((180 - startupDays) / 180, 0, 1) * 25;
      factors.push({
        category: "startup",
        factorType: startupDays <= 90 ? "positive" : "negative",
        label: startupDays <= 90 ? "Efficient startup" : "Extended startup duration",
        points: startupRaw,
        detail: `Startup duration ${startupDays} days`,
      });

      const staffDenominator = Math.max(site.total_staff, 1);
      const staffingRaw = clamp(((site.active_staff / staffDenominator) * 0.7 + (site.crc_count / Math.max(site.total_staff, 1)) * 0.3), 0, 1) * 25;
      factors.push({
        category: "staffing",
        factorType: staffingRaw >= 15 ? "positive" : "negative",
        label: staffingRaw >= 15 ? "Healthy staffing coverage" : "Staffing pressure",
        points: staffingRaw,
        detail: `${site.active_staff}/${site.total_staff} active team, ${site.crc_count} CRC`,
      });

      const retentionPenalty = site.open_cases * 1.5 + site.withdrawal_cases * 2 + site.ltfu_cases * 2.5;
      const retentionRaw = clamp(25 - retentionPenalty, 0, 25);
      factors.push({
        category: "retention",
        factorType: retentionRaw >= 15 ? "positive" : "negative",
        label: retentionRaw >= 15 ? "Retention profile stable" : "Retention risk detected",
        points: retentionRaw,
        detail: `${site.open_cases} open cases, ${site.withdrawal_cases} withdrawals, ${site.ltfu_cases} LTFU`,
      });

      const target = site.target_enrollment ?? 0;
      const actual = site.actual_enrollment ?? 0;
      const enrollmentRatio = target > 0 ? actual / target : 0;
      const enrollmentRaw = clamp(enrollmentRatio, 0, 1.3) / 1.3 * 25;
      factors.push({
        category: "enrollment",
        factorType: enrollmentRaw >= 15 ? "positive" : "negative",
        label: enrollmentRaw >= 15 ? "Enrollment pace on track" : "Enrollment below target",
        points: enrollmentRaw,
        detail: `${actual}/${target} enrolled`,
      });

      const weightedTotal =
        startupRaw * weights.startup +
        staffingRaw * weights.staffing +
        retentionRaw * weights.retention +
        enrollmentRaw * weights.enrollment;

      const totalScore = clamp((weightedTotal / 0.25), 0, 100);
      const riskLevel = totalScore >= 75 ? "low" : totalScore >= 50 ? "medium" : "high";

      const result = insertScore.run(
        site.site_id,
        site.study_id,
        startupRaw,
        staffingRaw,
        retentionRaw,
        enrollmentRaw,
        Number(totalScore.toFixed(1)),
        riskLevel,
      );

      const scoreId = Number(result.lastInsertRowid);

      for (const factor of factors) {
        insertFactor.run(
          scoreId,
          site.site_id,
          site.study_id,
          factor.category,
          factor.factorType,
          factor.label,
          Number(factor.points.toFixed(1)),
          factor.detail,
        );
      }
    }
  });

  tx();
};
