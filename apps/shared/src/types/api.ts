import type { RiskLevel, Site, SiteScore, Study } from "./domain";

export interface DashboardKpiResponse {
  totalSites: number;
  totalStudies: number;
  highRiskSites: number;
  mediumRiskSites: number;
  lowRiskSites: number;
  averageSiteHealthScore: number;
}

export interface SiteRowResponse extends Site {
  studyTitle: string;
  openCases: number;
  healthScore: number;
  riskLevel: RiskLevel;
}

export interface SiteDetailResponse {
  site: Site;
  study: Study;
  latestScore: SiteScore | null;
  openCases: number;
}

export interface UploadResultResponse {
  uploadId: string;
  category: string;
  fileName: string;
  status: "success" | "failed";
  inserted: number;
  updated: number;
  duplicates: number;
  validationErrors: Array<{ row: number; message: string }>;
}
