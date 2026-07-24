CREATE TABLE IF NOT EXISTS studies (
  study_id TEXT PRIMARY KEY,
  protocol_code TEXT NOT NULL,
  title TEXT NOT NULL,
  sponsor TEXT NOT NULL,
  company TEXT NOT NULL,
  country TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('planned', 'active', 'closed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sites (
  site_id TEXT PRIMARY KEY,
  study_id TEXT NOT NULL,
  site_number TEXT NOT NULL,
  site_name TEXT NOT NULL,
  country TEXT NOT NULL,
  sponsor TEXT NOT NULL,
  principal_investigator TEXT NOT NULL,
  site_status TEXT NOT NULL CHECK (site_status IN ('prospective', 'initiating', 'active', 'on_hold', 'closed')),
  selection_date TEXT,
  activation_date TEXT,
  startup_duration_days INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (study_id) REFERENCES studies(study_id) ON DELETE CASCADE,
  UNIQUE(study_id, site_number)
);

CREATE TABLE IF NOT EXISTS site_status (
  status_id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id TEXT NOT NULL,
  study_id TEXT NOT NULL,
  status_date TEXT NOT NULL,
  site_status TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(site_id) ON DELETE CASCADE,
  FOREIGN KEY (study_id) REFERENCES studies(study_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS personnel (
  personnel_id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id TEXT NOT NULL,
  study_id TEXT NOT NULL,
  person_name TEXT NOT NULL,
  role TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  capacity_ratio REAL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(site_id) ON DELETE CASCADE,
  FOREIGN KEY (study_id) REFERENCES studies(study_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS retention_cases (
  case_id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id TEXT NOT NULL,
  study_id TEXT NOT NULL,
  case_date TEXT NOT NULL,
  case_type TEXT NOT NULL,
  case_status TEXT NOT NULL CHECK (case_status IN ('open', 'closed')),
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'major', 'critical')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(site_id) ON DELETE CASCADE,
  FOREIGN KEY (study_id) REFERENCES studies(study_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS enrollment_metrics (
  metric_id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id TEXT NOT NULL,
  study_id TEXT NOT NULL,
  metric_date TEXT NOT NULL,
  target_enrollment INTEGER NOT NULL DEFAULT 0,
  actual_enrollment INTEGER NOT NULL DEFAULT 0,
  screening_count INTEGER NOT NULL DEFAULT 0,
  randomized_count INTEGER NOT NULL DEFAULT 0,
  ltfu_cases INTEGER NOT NULL DEFAULT 0,
  withdrawals INTEGER NOT NULL DEFAULT 0,
  ip_discontinuations INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(site_id) ON DELETE CASCADE,
  FOREIGN KEY (study_id) REFERENCES studies(study_id) ON DELETE CASCADE,
  UNIQUE(site_id, study_id, metric_date)
);

CREATE TABLE IF NOT EXISTS uploads (
  upload_id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  uploaded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  inserted_count INTEGER NOT NULL DEFAULT 0,
  updated_count INTEGER NOT NULL DEFAULT 0,
  duplicate_count INTEGER NOT NULL DEFAULT 0,
  validation_errors TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS site_scores (
  score_id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id TEXT NOT NULL,
  study_id TEXT NOT NULL,
  score_date TEXT NOT NULL,
  startup_score REAL NOT NULL,
  staffing_score REAL NOT NULL,
  retention_score REAL NOT NULL,
  enrollment_score REAL NOT NULL,
  total_score REAL NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('high', 'medium', 'low')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(site_id) ON DELETE CASCADE,
  FOREIGN KEY (study_id) REFERENCES studies(study_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS score_factors (
  factor_id INTEGER PRIMARY KEY AUTOINCREMENT,
  score_id INTEGER NOT NULL,
  site_id TEXT NOT NULL,
  study_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('startup', 'staffing', 'retention', 'enrollment')),
  factor_type TEXT NOT NULL CHECK (factor_type IN ('positive', 'negative')),
  label TEXT NOT NULL,
  points REAL NOT NULL,
  detail TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (score_id) REFERENCES site_scores(score_id) ON DELETE CASCADE,
  FOREIGN KEY (site_id) REFERENCES sites(site_id) ON DELETE CASCADE,
  FOREIGN KEY (study_id) REFERENCES studies(study_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS app_config (
  config_key TEXT PRIMARY KEY,
  config_value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sites_study_id ON sites(study_id);
CREATE INDEX IF NOT EXISTS idx_site_status_site_id ON site_status(site_id);
CREATE INDEX IF NOT EXISTS idx_personnel_site_id ON personnel(site_id);
CREATE INDEX IF NOT EXISTS idx_retention_site_id ON retention_cases(site_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_site_id ON enrollment_metrics(site_id);
CREATE INDEX IF NOT EXISTS idx_scores_site_id ON site_scores(site_id);
