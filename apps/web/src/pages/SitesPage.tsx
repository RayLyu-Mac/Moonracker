import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { api } from "../lib/api";
import { useDashboardStore } from "../store/dashboardStore";

const riskVariant = {
  high: "high",
  medium: "medium",
  low: "low",
} as const;

export function SitesPage() {
  const navigate = useNavigate();
  const { filters } = useDashboardStore();
  const [sites, setSites] = useState<any[]>([]);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.study) params.set("study", filters.study);
    if (filters.siteStatus) params.set("status", filters.siteStatus);
    if (filters.country) params.set("country", filters.country);
    if (filters.sponsor) params.set("sponsor", filters.sponsor);
    if (filters.riskLevel) params.set("risk", filters.riskLevel);
    return params;
  }, [filters]);

  useEffect(() => {
    api.getSites(query).then(setSites).catch(() => setSites([]));
  }, [query]);

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold text-slate-900">Sites</h2>
        <p className="text-sm text-slate-600">All participating sites with operational health and enrollment risk visibility.</p>
      </header>

      <Card className="overflow-x-auto p-0">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Site Number</th>
              <th className="px-4 py-3">Site Name</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Study</th>
              <th className="px-4 py-3">Sponsor</th>
              <th className="px-4 py-3">PI</th>
              <th className="px-4 py-3">Site Status</th>
              <th className="px-4 py-3">Health Score</th>
              <th className="px-4 py-3">Risk Level</th>
              <th className="px-4 py-3">Open Cases</th>
            </tr>
          </thead>
          <tbody>
            {sites.map((site) => (
              <tr
                key={site.site_id}
                className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                onClick={() => navigate(`/sites/${site.site_id}`)}
              >
                <td className="px-4 py-3 font-medium text-slate-800">{site.site_number}</td>
                <td className="px-4 py-3 text-slate-700">{site.site_name}</td>
                <td className="px-4 py-3 text-slate-600">{site.country}</td>
                <td className="px-4 py-3 text-slate-600">{site.study}</td>
                <td className="px-4 py-3 text-slate-600">{site.sponsor}</td>
                <td className="px-4 py-3 text-slate-600">{site.pi}</td>
                <td className="px-4 py-3 capitalize text-slate-600">{site.site_status}</td>
                <td className="px-4 py-3 text-slate-600">{site.health_score}</td>
                <td className="px-4 py-3">
                  <Badge variant={riskVariant[site.risk_level as keyof typeof riskVariant] ?? "high"} className="capitalize">
                    {site.risk_level}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-slate-600">{site.open_cases}</td>
              </tr>
            ))}
            {sites.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={10}>
                  No sites available. Upload Site Status and Enrollment Tracker files to populate this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
