const API_BASE = import.meta.env.VITE_API_URL ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  getKpis: () => request<{
    totalSites: number;
    totalStudies: number;
    highRiskSites: number;
    mediumRiskSites: number;
    lowRiskSites: number;
    averageSiteHealthScore: number;
  }>("/api/dashboard/kpis"),
  getRiskDistribution: () => request<Array<{ riskLevel: string; count: number }>>("/api/dashboard/risk-distribution"),
  getStatusDistribution: () => request<Array<{ status: string; count: number }>>("/api/dashboard/status-distribution"),
  getSitesByCountry: () => request<Array<{ country: string; count: number }>>("/api/dashboard/sites-by-country"),
  getTopRiskSites: () =>
    request<Array<{ site_id: string; site_number: string; site_name: string; country: string; total_score: number; risk_level: string }>>(
      "/api/dashboard/top-risk-sites",
    ),
  getStudyComparison: () =>
    request<Array<{ study_id: string; title: string; total_sites: number; avg_score: number }>>("/api/dashboard/study-comparison"),
  getSites: (query: URLSearchParams) => request<any[]>(`/api/sites?${query.toString()}`),
  getSiteDetail: (siteId: string) => request<any>(`/api/sites/${siteId}`),
  getStudies: () => request<any[]>("/api/studies"),
  getUploadHistory: () => request<any[]>("/api/uploads/history"),
  getWeights: () => request<{ startup: number; staffing: number; retention: number; enrollment: number }>("/api/configuration/weights"),
  saveWeights: (payload: { startup: number; staffing: number; retention: number; enrollment: number }) =>
    request<{ success: boolean }>("/api/configuration/weights", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  uploadFile: async (category: string, file: File) => {
    const formData = new FormData();
    formData.append("category", category);
    formData.append("file", file);

    const response = await fetch(`${API_BASE}/api/uploads`, {
      method: "POST",
      body: formData,
    });

    return response.json();
  },
};
