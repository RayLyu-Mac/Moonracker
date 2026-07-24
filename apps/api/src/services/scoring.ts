import { db } from "../db/client";

type ScoreWeights = {
  diseasePrevalence: number;
  historicalRecruitment: number;
  siteType: number;
  adminEfficiency: number;
  prescreening: number;
};

type Factor = {
  factorKey: "disease_prevalence" | "historical_recruitment" | "site_type" | "admin_efficiency" | "prescreening";
  factorType: "positive" | "negative";
  label: string;
  points: number;
  detail: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalize = (value: number, min: number, max: number): number => {
  if (max <= min) {
    return 100;
  }

  return clamp(((value - min) / (max - min)) * 100, 0, 100);
};

const getWeights = (): ScoreWeights => {
  const raw = db
    .prepare("SELECT config_value FROM app_config WHERE config_key = 'score_weights'")
    .get() as { config_value?: string } | undefined;

  if (!raw?.config_value) {
    return {
      diseasePrevalence: 0.2,
      historicalRecruitment: 0.2,
      siteType: 0.2,
      adminEfficiency: 0.2,
      prescreening: 0.2,
    };
  }

  const parsed = JSON.parse(raw.config_value) as Partial<ScoreWeights>;
  return {
    diseasePrevalence: parsed.diseasePrevalence ?? 0.2,
    historicalRecruitment: parsed.historicalRecruitment ?? 0.2,
    siteType: parsed.siteType ?? 0.2,
    adminEfficiency: parsed.adminEfficiency ?? 0.2,
    prescreening: parsed.prescreening ?? 0.2,
  };
};

export const recomputeScores = (): void => {
  const sites = db
    .prepare(
      `SELECT rp.site_id, rp.study_id, rp.site_type, rp.city,
              rp.heart_disease_prevalence_per_100k, rp.catchment_population, rp.estimated_patient_pool,
              rp.historical_avg_recruitment_rate_per_month, rp.historical_trials_completed, rp.historical_retention_rate_pct,
              rp.contract_execution_days, rp.admin_efficiency_score, rp.prescreened_count_30d, rp.eligible_count_30d,
              rp.screen_failure_rate_pct, rp.prescreen_to_enroll_conversion_pct, rp.input_data_quality_score
       FROM recruitment_profiles rp
       ORDER BY rp.site_id`,
    )
    .all() as Array<{
    site_id: string;
    study_id: string;
    site_type: "clinic" | "hospital" | "university";
    city: string;
    heart_disease_prevalence_per_100k: number;
    catchment_population: number;
    estimated_patient_pool: number;
    historical_avg_recruitment_rate_per_month: number;
    historical_trials_completed: number;
    historical_retention_rate_pct: number;
    contract_execution_days: number;
    admin_efficiency_score: number;
    prescreened_count_30d: number;
    eligible_count_30d: number;
    screen_failure_rate_pct: number;
    prescreen_to_enroll_conversion_pct: number;
    input_data_quality_score: number;
  }>;

  const weights = getWeights();

  const prevalenceValues = sites.map((site) => site.heart_disease_prevalence_per_100k);
  const recruitmentRateValues = sites.map((site) => site.historical_avg_recruitment_rate_per_month);
  const trialValues = sites.map((site) => site.historical_trials_completed);
  const contractValues = sites.map((site) => site.contract_execution_days);

  const minPrevalence = Math.min(...prevalenceValues, 0);
  const maxPrevalence = Math.max(...prevalenceValues, 0);
  const minRecruitmentRate = Math.min(...recruitmentRateValues, 0);
  const maxRecruitmentRate = Math.max(...recruitmentRateValues, 0);
  const minTrials = Math.min(...trialValues, 0);
  const maxTrials = Math.max(...trialValues, 0);
  const minContractDays = Math.min(...contractValues, 0);
  const maxContractDays = Math.max(...contractValues, 0);

  const insertRecruitmentScore = db.prepare(
    `INSERT INTO recruitment_scores (
      site_id, study_id, score_date, disease_prevalence_score, historical_recruitment_score, site_type_score,
      admin_efficiency_score, prescreening_score, total_score, recruitment_band
    ) VALUES (?, ?, DATE('now'), ?, ?, ?, ?, ?, ?, ?)`,
  );

  const insertCompatibilityScore = db.prepare(
    `INSERT INTO site_scores (
      site_id, study_id, score_date, startup_score, staffing_score, retention_score, enrollment_score, total_score, risk_level
    ) VALUES (?, ?, DATE('now'), ?, ?, ?, ?, ?, ?)`,
  );

  const insertFactor = db.prepare(
    `INSERT INTO recruitment_score_factors (
      score_id, site_id, study_id, factor_key, factor_type, label, points, detail
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const clearRecruitmentFactors = db.prepare("DELETE FROM recruitment_score_factors");
  const clearRecruitmentScores = db.prepare("DELETE FROM recruitment_scores");
  const clearScores = db.prepare("DELETE FROM site_scores");
  const clearFactors = db.prepare("DELETE FROM score_factors");

  const scoredSites = sites.map((site) => {
    const factors: Factor[] = [];

    const diseasePrevalenceScore = normalize(site.heart_disease_prevalence_per_100k, minPrevalence, maxPrevalence);
    factors.push({
      factorKey: "disease_prevalence",
      factorType: diseasePrevalenceScore >= 60 ? "positive" : "negative",
      label: "Disease prevalence and patient pool",
      points: diseasePrevalenceScore,
      detail: `${site.heart_disease_prevalence_per_100k.toFixed(0)} per 100k, patient pool ${site.estimated_patient_pool.toLocaleString()}`,
    });

    const historicalRateScore = normalize(site.historical_avg_recruitment_rate_per_month, minRecruitmentRate, maxRecruitmentRate);
    const trialsScore = normalize(site.historical_trials_completed, minTrials, maxTrials);
    const historicalRecruitmentScore = clamp(
      historicalRateScore * 0.7 + trialsScore * 0.1 + clamp(site.historical_retention_rate_pct, 0, 100) * 0.2,
      0,
      100,
    );
    factors.push({
      factorKey: "historical_recruitment",
      factorType: historicalRecruitmentScore >= 60 ? "positive" : "negative",
      label: "Historical recruitment track record",
      points: historicalRecruitmentScore,
      detail: `${site.historical_avg_recruitment_rate_per_month.toFixed(1)}/month across ${site.historical_trials_completed} completed trials`,
    });

    const siteTypeScore = site.site_type === "university" ? 100 : site.site_type === "hospital" ? 72 : 48;
    factors.push({
      factorKey: "site_type",
      factorType: siteTypeScore >= 60 ? "positive" : "negative",
      label: "Site type fit",
      points: siteTypeScore,
      detail: `${site.site_type} site in ${site.city}`,
    });

    const contractScore = 100 - normalize(site.contract_execution_days, minContractDays, maxContractDays);
    const adminEfficiencyScore = clamp(contractScore * 0.45 + clamp(site.admin_efficiency_score, 0, 100) * 0.55, 0, 100);
    factors.push({
      factorKey: "admin_efficiency",
      factorType: adminEfficiencyScore >= 60 ? "positive" : "negative",
      label: "Contract execution and admin efficiency",
      points: adminEfficiencyScore,
      detail: `${site.contract_execution_days} contract days, admin score ${site.admin_efficiency_score.toFixed(1)}`,
    });

    const eligibleRate = site.prescreened_count_30d > 0 ? (site.eligible_count_30d / site.prescreened_count_30d) * 100 : 0;
    const screenSuccessScore = 100 - clamp(site.screen_failure_rate_pct, 0, 100);
    const prescreeningScore = clamp(
      eligibleRate * 0.25 +
        clamp(site.prescreen_to_enroll_conversion_pct, 0, 100) * 0.35 +
        screenSuccessScore * 0.25 +
        clamp(site.input_data_quality_score, 0, 100) * 0.15,
      0,
      100,
    );
    factors.push({
      factorKey: "prescreening",
      factorType: prescreeningScore >= 60 ? "positive" : "negative",
      label: "Prescreening log quality",
      points: prescreeningScore,
      detail: `${site.prescreened_count_30d} prescreened, ${site.eligible_count_30d} eligible, ${site.prescreen_to_enroll_conversion_pct.toFixed(1)}% conversion`,
    });

    const weightedTotal =
      diseasePrevalenceScore * weights.diseasePrevalence +
      historicalRecruitmentScore * weights.historicalRecruitment +
      siteTypeScore * weights.siteType +
      adminEfficiencyScore * weights.adminEfficiency +
      prescreeningScore * weights.prescreening;

    return {
      site,
      factors,
      diseasePrevalenceScore,
      historicalRecruitmentScore,
      siteTypeScore,
      adminEfficiencyScore,
      prescreeningScore,
      totalScore: clamp(weightedTotal, 0, 100),
    };
  });

  const rankedSiteIds = [...scoredSites]
    .sort((left, right) => right.totalScore - left.totalScore)
    .map((entry) => entry.site.site_id);

  const getBandForRank = (siteId: string): "high" | "medium" | "low" => {
    const index = rankedSiteIds.indexOf(siteId);
    if (index === -1) {
      return "medium";
    }

    const bottomCutoff = Math.max(1, Math.ceil(rankedSiteIds.length / 3));
    const topCutoff = Math.max(bottomCutoff + 1, Math.ceil((rankedSiteIds.length * 2) / 3));

    if (index < bottomCutoff) {
      return "low";
    }
    if (index < topCutoff) {
      return "medium";
    }
    return "high";
  };

  const tx = db.transaction(() => {
    clearRecruitmentFactors.run();
    clearRecruitmentScores.run();
    clearScores.run();
    clearFactors.run();

    for (const scoredSite of scoredSites) {
      const { site, factors, diseasePrevalenceScore, historicalRecruitmentScore, siteTypeScore, adminEfficiencyScore, prescreeningScore, totalScore } = scoredSite;
      const recruitmentBand = getBandForRank(site.site_id);

      const result = insertRecruitmentScore.run(
        site.site_id,
        site.study_id,
        Number(diseasePrevalenceScore.toFixed(1)),
        Number(historicalRecruitmentScore.toFixed(1)),
        Number(siteTypeScore.toFixed(1)),
        Number(adminEfficiencyScore.toFixed(1)),
        Number(prescreeningScore.toFixed(1)),
        Number(totalScore.toFixed(1)),
        recruitmentBand,
      );

      insertCompatibilityScore.run(site.site_id, site.study_id, 0, 0, 0, 0, Number(totalScore.toFixed(1)), recruitmentBand);

      const scoreId = Number(result.lastInsertRowid);

      for (const factor of factors) {
        insertFactor.run(
          scoreId,
          site.site_id,
          site.study_id,
          factor.factorKey,
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
