CREATE TABLE IF NOT EXISTS recruitment_profiles (
  site_id TEXT PRIMARY KEY,
  study_id TEXT NOT NULL,
  site_type TEXT NOT NULL CHECK (site_type IN ('clinic', 'hospital', 'university')),
  city TEXT NOT NULL,
  indication TEXT NOT NULL,
  prevalence_source TEXT NOT NULL,
  heart_disease_prevalence_per_100k REAL NOT NULL,
  catchment_population INTEGER NOT NULL,
  estimated_patient_pool INTEGER NOT NULL,
  historical_study_1_enrolled INTEGER NOT NULL,
  historical_study_1_months REAL NOT NULL,
  historical_study_1_rate_per_month REAL NOT NULL,
  historical_study_2_enrolled INTEGER NOT NULL,
  historical_study_2_months REAL NOT NULL,
  historical_study_2_rate_per_month REAL NOT NULL,
  historical_study_3_enrolled INTEGER NOT NULL,
  historical_study_3_months REAL NOT NULL,
  historical_study_3_rate_per_month REAL NOT NULL,
  historical_avg_recruitment_rate_per_month REAL NOT NULL,
  historical_trials_completed INTEGER NOT NULL,
  historical_retention_rate_pct REAL NOT NULL,
  contract_execution_days INTEGER NOT NULL,
  admin_efficiency_score REAL NOT NULL,
  prescreened_count_30d INTEGER NOT NULL,
  eligible_count_30d INTEGER NOT NULL,
  screen_failure_rate_pct REAL NOT NULL,
  prescreen_to_enroll_conversion_pct REAL NOT NULL,
  input_data_quality_score REAL NOT NULL,
  imported_recruitment_score REAL NOT NULL,
  imported_recruitment_class TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(site_id) ON DELETE CASCADE,
  FOREIGN KEY (study_id) REFERENCES studies(study_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recruitment_scores (
  score_id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id TEXT NOT NULL,
  study_id TEXT NOT NULL,
  score_date TEXT NOT NULL,
  disease_prevalence_score REAL NOT NULL,
  historical_recruitment_score REAL NOT NULL,
  site_type_score REAL NOT NULL,
  admin_efficiency_score REAL NOT NULL,
  prescreening_score REAL NOT NULL,
  total_score REAL NOT NULL,
  recruitment_band TEXT NOT NULL CHECK (recruitment_band IN ('high', 'medium', 'low')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(site_id) ON DELETE CASCADE,
  FOREIGN KEY (study_id) REFERENCES studies(study_id) ON DELETE CASCADE,
  UNIQUE(site_id)
);

CREATE TABLE IF NOT EXISTS recruitment_score_factors (
  factor_id INTEGER PRIMARY KEY AUTOINCREMENT,
  score_id INTEGER NOT NULL,
  site_id TEXT NOT NULL,
  study_id TEXT NOT NULL,
  factor_key TEXT NOT NULL CHECK (factor_key IN ('disease_prevalence', 'historical_recruitment', 'site_type', 'admin_efficiency', 'prescreening')),
  factor_type TEXT NOT NULL CHECK (factor_type IN ('positive', 'negative')),
  label TEXT NOT NULL,
  points REAL NOT NULL,
  detail TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (score_id) REFERENCES recruitment_scores(score_id) ON DELETE CASCADE,
  FOREIGN KEY (site_id) REFERENCES sites(site_id) ON DELETE CASCADE,
  FOREIGN KEY (study_id) REFERENCES studies(study_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_recruitment_profiles_study_id ON recruitment_profiles(study_id);
CREATE INDEX IF NOT EXISTS idx_recruitment_scores_study_id ON recruitment_scores(study_id);
CREATE INDEX IF NOT EXISTS idx_recruitment_scores_band ON recruitment_scores(recruitment_band);
