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
    if (filters.siteStatus) params.set("siteType", filters.siteStatus);
    if (filters.country) params.set("country", filters.country);
    if (filters.sponsor) params.set("sponsor", filters.sponsor);
    if (filters.riskLevel) params.set("risk", filters.riskLevel);
    return params;
  }, [filters]);

  useEffect(() => {
    api.getSites(query).then(setSites).catch(() => setSites([]));
  }, [query]);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-4xl font-semibold text-slate-900">Sites</h2>
        <p className="mt-2 text-lg text-slate-600">All clinics, hospitals, and universities ranked by the recruitment score model.</p>
      </header>

      <Card className="overflow-x-auto p-0">
        <table className="min-w-full text-base">
          <thead className="bg-slate-50 text-left text-sm uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Site Number</th>
              <th className="px-4 py-3">Site Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Sponsor</th>
              <th className="px-4 py-3">Recruitment Score</th>
              <th className="px-4 py-3">Recruitment Band</th>
              <th className="px-4 py-3">Imported Score</th>
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
                <td className="px-4 py-3 capitalize text-slate-600">{site.site_type}</td>
                <td className="px-4 py-3 text-slate-600">{site.city}</td>
                <td className="px-4 py-3 text-slate-600">{site.country}</td>
                <td className="px-4 py-3 text-slate-600">{site.sponsor}</td>
                <td className="px-4 py-3 text-slate-600">{site.recruitment_score}</td>
                <td className="px-4 py-3">
                  <Badge variant={riskVariant[site.recruitment_band as keyof typeof riskVariant] ?? "high"} className="capitalize">
                    {site.recruitment_band}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-slate-600">{site.imported_recruitment_score}</td>
              </tr>
            ))}
            {sites.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={9}>
                  No sites available. Upload the recruitment profile CSV to populate this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
