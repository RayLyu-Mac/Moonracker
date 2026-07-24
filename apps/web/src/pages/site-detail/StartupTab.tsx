import { Card } from "../../components/ui/card";

export function StartupTab({ data }: { data: any }) {
  return (
    <Card>
      <h3 className="text-base font-semibold text-slate-900">Startup</h3>
      <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-3">
        <p>Selection Date: {data.site.selection_date || "N/A"}</p>
        <p>Activation Date: {data.site.activation_date || "N/A"}</p>
        <p>Startup Duration: {data.site.startup_duration_days ?? "N/A"} days</p>
      </div>
      <div className="mt-5 h-2 rounded-full bg-slate-100">
        <div
          className="h-2 rounded-full bg-sky-600"
          style={{ width: `${Math.max(8, Math.min(100, 100 - (data.site.startup_duration_days ?? 120) / 2))}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-500">Timeline visualization: shorter startup duration yields better readiness profile.</p>
    </Card>
  );
}
