import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
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
  const navigate = useNavigate();
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
  const [predVsActual, setPredVsActual] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.getKpis(),
      api.getRiskDistribution(),
      api.getStatusDistribution(),
      api.getSitesByCountry(),
      api.getTopRiskSites(),
      api.getPredictedVsActual(),
    ])
      .then(([kpiData, riskData, statusData, countryData, topRiskData, predData]) => {
        setKpis(kpiData);
        setRiskDistribution(riskData);
        setStatusDistribution(statusData);
        setSitesByCountry(countryData);
        setTopRiskSites(topRiskData);
        setPredVsActual(predData);
      })
      .catch(() => undefined);
  }, []);

  const cards = useMemo(
    () => [
      { label: "Total Sites", value: kpis.totalSites },
      { label: "Red Band Sites", value: kpis.highRiskSites },
      { label: "Orange Band Sites", value: kpis.mediumRiskSites },
      { label: "Green Band Sites", value: kpis.lowRiskSites },
      { label: "Average Recruitment Score", value: kpis.averageSiteHealthScore },
    ],
    [kpis],
  );

  // Standard normal CDF approximation
  const normCDF = (z: number): number => {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    
    const sign = z < 0 ? -1 : 1;
    z = Math.abs(z) / Math.sqrt(2);
    
    const t = 1.0 / (1.0 + p * z);
    const t2 = t * t;
    const t3 = t2 * t;
    const t4 = t3 * t;
    const t5 = t4 * t;
    
    const y = 1.0 - (((((a5 * t5 + a4 * t4) + a3 * t3) + a2 * t2) + a1 * t) * Math.exp(-z * z));
    return 0.5 * (1.0 + sign * y);
  };

  // Calculate statistics for scatter plot
  const scatterStats = useMemo(() => {
    if (predVsActual.length === 0) return { n: 0, r2: 0, pValue: 0 };

    const n = predVsActual.length;
    
    // Calculate means
    const meanPredicted = predVsActual.reduce((sum, d) => sum + d.predicted, 0) / n;
    const meanActual = predVsActual.reduce((sum, d) => sum + d.actual, 0) / n;
    
    // Calculate correlation and R²
    let sumProdDev = 0;
    let sumPredDev2 = 0;
    let sumActualDev2 = 0;
    
    for (const d of predVsActual) {
      const predDev = d.predicted - meanPredicted;
      const actualDev = d.actual - meanActual;
      sumProdDev += predDev * actualDev;
      sumPredDev2 += predDev * predDev;
      sumActualDev2 += actualDev * actualDev;
    }
    
    const correlation = sumProdDev / Math.sqrt(sumPredDev2 * sumActualDev2);
    const r2 = correlation * correlation;
    
    // Calculate p-value using t-test for correlation
    const t = Math.abs(correlation * Math.sqrt(n - 2) / Math.sqrt(Math.max(0.0001, 1 - r2)));
    
    // Approximate p-value (two-tailed)
    // Using a simple approximation for normal distribution
    const pValue = 2 * (1 - normCDF(t));
    
    return { n, r2: Math.max(0, r2), pValue: Math.max(0, pValue) };
  }, [predVsActual]);

  return (
    <div className="space-y-7">
      <header>
        <h2 className="text-4xl font-semibold text-slate-900">Dashboard</h2>
        <p className="mt-2 text-lg text-slate-600">Recruitment-focused ranking across clinics, hospitals, and universities using the five-factor score.</p>
      </header>

      <Card>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {cards.map((card) => (
            <div key={card.label} className="rounded-xl border border-slate-100 bg-slate-50 p-4 shadow-[0_12px_24px_-20px_rgba(15,23,42,0.45)]">
              <p className="text-sm uppercase tracking-wide text-slate-500">{card.label}</p>
              <p className="mt-1 text-4xl font-semibold text-slate-900">{card.value}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="grid gap-3 md:grid-cols-4">
          <select value={filters.siteStatus} onChange={(e) => setFilter("siteStatus", e.target.value)} className="rounded-xl border px-3 py-2">
            <option value="">Site Type</option>
            <option value="clinic">Clinic</option>
            <option value="hospital">Hospital</option>
            <option value="university">University</option>
          </select>
          <input value={filters.country} onChange={(e) => setFilter("country", e.target.value)} placeholder="Country" className="rounded-xl border px-3 py-2" />
          <input value={filters.sponsor} onChange={(e) => setFilter("sponsor", e.target.value)} placeholder="Sponsor" className="rounded-xl border px-3 py-2" />
          <select value={filters.riskLevel} onChange={(e) => setFilter("riskLevel", e.target.value)} className="rounded-xl border px-3 py-2">
            <option value="">Recruitment Band</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-xl font-semibold text-slate-900">Recruitment Band Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={riskDistribution} dataKey="count" nameKey="riskLevel" innerRadius={60} outerRadius={92}>
                  {riskDistribution.map((entry) => (
                    <Cell key={entry.riskLevel} fill={riskPalette[entry.riskLevel] ?? "#64748b"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend 
                  formatter={(val: string) => val === "high" ? "Red Band (High Risk)" : val === "medium" ? "Orange Band (Medium)" : "Green Band (Best)"}
                  wrapperStyle={{ paddingTop: 16 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-xl font-semibold text-slate-900">Site Type Distribution</h3>
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
          <h3 className="mb-3 text-xl font-semibold text-slate-900">Sites By Country</h3>
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
          <h3 className="mb-3 text-xl font-semibold text-slate-900">Clinic, Hospital, and University Recruitment Ranking</h3>
          <table className="min-w-full text-base">
            <thead className="text-left text-sm uppercase tracking-wide text-slate-500">
              <tr>
                <th className="pb-2">Site</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Country</th>
                <th className="pb-2">Score</th>
                <th className="pb-2">Band</th>
              </tr>
            </thead>
            <tbody>
              {topRiskSites.map((site) => (
                <tr
                  key={site.site_id}
                  className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                  onClick={() => navigate(`/sites/${site.site_id}`)}
                >
                  <td className="py-3 text-slate-700">{site.site_number} - {site.site_name}</td>
                  <td className="py-3 capitalize text-slate-600">{site.site_type}</td>
                  <td className="py-3 text-slate-600">{site.country}</td>
                  <td className="py-3 text-slate-600">{site.total_score}</td>
                  <td className="py-3">
                    <span
                      className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold capitalize ${
                        site.risk_level === "high"
                          ? "bg-rose-100 text-rose-700"
                          : site.risk_level === "medium"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {site.risk_level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* ── Predicted vs Actual scatter plot ── */}
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="mb-1 text-xl font-semibold text-slate-900">Predicted vs Actual Recruitment Rate</h3>
            <p className="mb-4 text-base text-slate-500">
              X = predicted recruitment rate · Y = current recruitment rate · Dashed line = perfect prediction ·
              Click any point to open that site's detail page.
            </p>
          </div>
          <div className="flex gap-6 text-sm font-medium text-slate-700">
            <div className="text-right">
              <p className="text-slate-500">n</p>
              <p className="text-lg text-slate-900">{scatterStats.n}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500">R²</p>
              <p className="text-lg text-slate-900">{scatterStats.r2.toFixed(3)}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500">p</p>
              <p className="text-lg text-slate-900">{scatterStats.pValue < 0.001 ? "<0.001" : scatterStats.pValue.toFixed(3)}</p>
            </div>
          </div>
        </div>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart margin={{ top: 10, right: 30, bottom: 30, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                type="number"
                dataKey="predicted"
                name="Predicted"
                domain={[30, 100]}
                label={{ value: "Predicted Recruitment Rate", position: "insideBottom", offset: -15, fontSize: 13, fill: "#64748b" }}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="number"
                dataKey="actual"
                name="Actual"
                domain={[30, 100]}
                label={{ value: "Current Recruitment Rate", angle: -90, position: "insideLeft", offset: 10, fontSize: 13, fill: "#64748b" }}
                tick={{ fontSize: 12 }}
              />
              {/* y = x reference line rendered as a Line series */}
              <Line
                data={[{ predicted: 0, actual: 0 }, { predicted: 100, actual: 100 }]}
                dataKey="actual"
                dot={false}
                activeDot={false}
                stroke="#cbd5e1"
                strokeDasharray="5 5"
                strokeWidth={1.5}
                legendType="none"
                isAnimationActive={false}
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload }: { active?: boolean; payload?: any[] }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload;
                  if (!d?.site_id) return null;
                  return (
                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg text-sm">
                      <p className="font-semibold text-slate-900">{d.site_name}</p>
                      <p className="text-slate-500 capitalize">{d.site_type} · {d.country}</p>
                      <p className="mt-1 text-slate-700">Predicted Rate: <span className="font-medium">{d.predicted}</span></p>
                      <p className="text-slate-700">Current Rate: <span className="font-medium">{d.actual}</span></p>
                      <p className="mt-1 text-sky-600 text-xs">Click to open site detail →</p>
                    </div>
                  );
                }}
              />
              <Scatter
                data={predVsActual}
                cursor="pointer"
                onClick={(d: any) => navigate(`/sites/${d.site_id}`)}
              >
                {predVsActual.map((entry) => (
                  <Cell
                    key={entry.site_id}
                    fill={riskPalette[entry.recruitment_band] ?? "#64748b"}
                    fillOpacity={0.85}
                  />
                ))}
              </Scatter>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full bg-emerald-500" /> Green band (best)</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full bg-amber-400" /> Orange band</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full bg-rose-500" /> Red band</span>
        </div>
      </Card>
    </div>
  );
}
