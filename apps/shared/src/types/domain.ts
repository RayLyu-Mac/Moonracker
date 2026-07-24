export type SiteStatus = "prospective" | "initiating" | "active" | "on_hold" | "closed";

export type RiskLevel = "high" | "medium" | "low";

export interface Study {
  id: string;
  sponsor: string;
  protocolCode: string;
  title: string;
  country: string;
  status: "planned" | "active" | "closed";
}

export interface Site {
  id: string;
  studyId: string;
  siteNumber: string;
  name: string;
  country: string;
  principalInvestigator: string;
  sponsor: string;
  status: SiteStatus;
}

export interface SiteScore {
  id: string;
  siteId: string;
  studyId: string;
  startupScore: number;
  staffingScore: number;
  retentionScore: number;
  enrollmentScore: number;
  totalScore: number;
  riskLevel: RiskLevel;
  calculatedAt: string;
}

export interface ScoreFactor {
  id: string;
  scoreId: string;
  siteId: string;
  studyId: string;
  category: "startup" | "staffing" | "retention" | "enrollment";
  factorType: "positive" | "negative";
  label: string;
  points: number;
  detail: string;
}
