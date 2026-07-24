import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "../components/ui/card";
import { useDashboardStore } from "../store/dashboardStore";
import { api } from "../lib/api";

const riskPalette: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#10b981",
};

export function DashboardPage() {
  const { filters, setFilter } = useDashboardStore();
  const [kpis, setKpis] = useState({
    totalSites: 0,
    totalStudies: 0,
    highRiskSites: 0,
    mediumRiskSites: 0,
    lowRiskSites: 0,
    averageSiteHealthScore: 0,
  });
  const [riskDistribution, setRiskDistribution] = useState<Array<{ riskLevel: string; count: number }>>([]);
  const [statusDistribution, setStatusDistribution] = useState<Array<{ status: string; count: number }>>([]);
  const [sitesByCountry, setSitesByCountry] = useState<Array<{ country: string; count: number }>>([]);
  const [topRiskSites, setTopRiskSites] = useState<any[]>([]);
  const [studyComparison, setStudyComparison] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.getKpis(),
      api.getRiskDistribution(),
      api.getStatusDistribution(),
      api.getSitesByCountry(),
      api.getTopRiskSites(),
      api.getStudyComparison(),
    ])
      .then(([kpiData, riskData, statusData, countryData, topRiskData, studyData]) => {
        setKpis(kpiData);
        setRiskDistribution(riskData);
        setStatusDistribution(statusData);
        setSitesByCountry(countryData);
        setTopRiskSites(topRiskData);
        setStudyComparison(studyData);
      })
      .catch(() => undefined);
  }, []);

  const cards = useMemo(
    () => [
      { label: "Total Sites", value: kpis.totalSites },
      { label: "Total Studies", value: kpis.totalStudies },
      { label: "High Risk Sites", value: kpis.highRiskSites },
      { label: "Medium Risk Sites", value: kpis.mediumRiskSites },
      { label: "Low Risk Sites", value: kpis.lowRiskSites },
      { label: "Average Site Health Score", value: kpis.averageSiteHealthScore },
    ],
    [kpis],
  );

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
        <p className="text-sm text-slate-600">Operational monitoring across studies with explainable site risk scoring.</p>
      </header>

      <Card>
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          {cards.map((card) => (
            <div key={card.label} className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{card.value}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="grid gap-3 md:grid-cols-5">
          <select value={filters.study} onChange={(e) => setFilter("study", e.target.value)} className="rounded-xl border px-3 py-2">
            <option value="">Study</option>
          </select>
          <select value={filters.siteStatus} onChange={(e) => setFilter("siteStatus", e.target.value)} className="rounded-xl border px-3 py-2">
            <option value="">Site Status</option>
            <option value="active">Active</option>
            <option value="initiating">Initiating</option>
            <option value="on_hold">On Hold</option>
            <option value="closed">Closed</option>
          </select>
          <input value={filters.country} onChange={(e) => setFilter("country", e.target.value)} placeholder="Country" className="rounded-xl border px-3 py-2" />
          <input value={filters.sponsor} onChange={(e) => setFilter("sponsor", e.target.value)} placeholder="Company / Sponsor" className="rounded-xl border px-3 py-2" />
          <select value={filters.riskLevel} onChange={(e) => setFilter("riskLevel", e.target.value)} className="rounded-xl border px-3 py-2">
            <option value="">Risk Level</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-base font-semibold text-slate-900">Site Risk Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={riskDistribution} dataKey="count" nameKey="riskLevel" innerRadius={60} outerRadius={92}>
                  {riskDistribution.map((entry) => (
                    <Cell key={entry.riskLevel} fill={riskPalette[entry.riskLevel] ?? "#64748b"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-base font-semibold text-slate-900">Site Status Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={statusDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-base font-semibold text-slate-900">Sites By Country</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={sitesByCountry}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="country" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="overflow-auto">
          <h3 className="mb-3 text-base font-semibold text-slate-900">Top 10 Highest Risk Sites</h3>
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="pb-2">Site</th>
                <th className="pb-2">Country</th>
                <th className="pb-2">Score</th>
                <th className="pb-2">Risk</th>
              </tr>
            </thead>
            <tbody>
              {topRiskSites.map((site) => (
                <tr key={site.site_id} className="border-t border-slate-100">
                  <td className="py-2 text-slate-700">{site.site_number} - {site.site_name}</td>
                  <td className="py-2 text-slate-600">{site.country}</td>
                  <td className="py-2 text-slate-600">{site.total_score}</td>
                  <td className="py-2 capitalize text-rose-700">{site.risk_level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Card>
        <h3 className="mb-3 text-base font-semibold text-slate-900">Study Comparison</h3>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={studyComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="study_id" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avg_score" fill="#0369a1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
