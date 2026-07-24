import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "../../components/ui/badge";
import { Card } from "../../components/ui/card";

export function OverviewTab({ data }: { data: any }) {
  const positive = (data.factors ?? []).filter((f: any) => f.factor_type === "positive");
  const negative = (data.factors ?? []).filter((f: any) => f.factor_type === "negative");

  const factorData = [
    { factor: "Disease Prevalence", score: data.site.disease_prevalence_score ?? 0 },
    { factor: "Historical Recruitment", score: data.site.historical_recruitment_score ?? 0 },
    { factor: "Site Type", score: data.site.site_type_score ?? 0 },
    { factor: "Admin Efficiency", score: data.site.admin_factor_score ?? 0 },
    { factor: "Prescreening Quality", score: data.site.prescreening_score ?? 0 },
  ];

  const equipment: Array<{ name: string; available: boolean }> = data.equipment ?? [];

  return (
    <div className="space-y-4">
      {/* ── Row 1: factor chart + summary ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Factor Score Breakdown</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={factorData}
                layout="vertical"
                margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} tickCount={6} />
                <YAxis
                  type="category"
                  dataKey="factor"
                  width={148}
                  tick={{ fontSize: 12, fill: "#475569" }}
                />
                <Tooltip
                  formatter={(v) => [`${Number(v).toFixed(1)} / 100`, "Score"]}
                  contentStyle={{ borderRadius: 10, fontSize: 13 }}
                />
                <Bar dataKey="score" radius={[0, 6, 6, 0]} maxBarSize={22}>
                  {factorData.map((entry) => (
                    <Cell
                      key={entry.factor}
                      fill={entry.score >= 60 ? "#10b981" : entry.score >= 40 ? "#f59e0b" : "#ef4444"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Recruitment Summary</h3>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-base text-slate-600">Recruitment Band:</span>
            <Badge variant={data.site.recruitment_band} className="capitalize text-base px-3 py-1">
              {data.site.recruitment_band}
            </Badge>
          </div>

          {/* Current and Predicted Recruitment Rates */}
          <div className="mb-4 space-y-3 border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-base text-slate-600">Current Recruitment Rate</span>
              <span className="text-lg font-semibold text-slate-900">
                {data.site.total_score ?? 0}
                {!data.site.inCurrentStudy && <span className="ml-2 text-sm font-normal text-rose-600">(Not in study)</span>}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base text-slate-600">Predicted Recruitment Rate</span>
              <span className="text-lg font-semibold text-slate-900">{data.site.imported_recruitment_score ?? 0}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-base">
            {factorData.map((f) => (
              <div key={f.factor} className="flex items-center justify-between gap-2">
                <span className="text-slate-500">{f.factor}</span>
                <span
                  className={`font-semibold ${
                    f.score >= 60 ? "text-emerald-700" : f.score >= 40 ? "text-amber-600" : "text-rose-600"
                  }`}
                >
                  {f.score.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Row 2: explainability ── */}
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Explainability</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 font-medium text-emerald-700">Positive Factors</p>
            <ul className="space-y-1.5 text-base text-slate-600">
              {positive.map((f: any, i: number) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  <span><span className="font-medium text-slate-800">{f.label}:</span> {f.detail}</span>
                </li>
              ))}
              {positive.length === 0 && <li className="text-slate-400">None recorded yet.</li>}
            </ul>
          </div>
          <div>
            <p className="mb-2 font-medium text-rose-600">Negative Factors</p>
            <ul className="space-y-1.5 text-base text-slate-600">
              {negative.map((f: any, i: number) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                  <span><span className="font-medium text-slate-800">{f.label}:</span> {f.detail}</span>
                </li>
              ))}
              {negative.length === 0 && <li className="text-slate-400">None recorded yet.</li>}
            </ul>
          </div>
        </div>
      </Card>

      {/* ── Row 3: equipment ── */}
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Equipment Availability</h3>
        {equipment.length === 0 ? (
          <p className="text-base text-slate-400">No equipment data available.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {equipment.map((item) => (
              <div
                key={item.name}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-base ${
                  item.available
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-800"
                }`}
              >
                <span className={`text-lg ${item.available ? "text-emerald-500" : "text-rose-400"}`}>
                  {item.available ? "✓" : "✗"}
                </span>
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-3 flex gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1.5"><span className="text-emerald-500">✓</span> Available</span>
          <span className="flex items-center gap-1.5"><span className="text-rose-400">✗</span> Not available</span>
        </div>
      </Card>
    </div>
  );
}
