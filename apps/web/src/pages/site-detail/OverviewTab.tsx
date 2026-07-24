import { Badge } from "../../components/ui/badge";
import { Card } from "../../components/ui/card";

export function OverviewTab({ data }: { data: any }) {
  const positive = data.factors.filter((factor: any) => factor.factor_type === "positive");
  const negative = data.factors.filter((factor: any) => factor.factor_type === "negative");

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h3 className="text-base font-semibold text-slate-900">Site Summary</h3>
        <p className="mt-3 text-sm text-slate-600">
          Risk Level:
          <Badge variant={data.site.risk_level} className="ml-2 capitalize">
            {data.site.risk_level}
          </Badge>
        </p>

        <div className="mt-4 grid gap-2 text-sm text-slate-700">
          <p>Startup Score: {data.site.startup_score ?? 0}</p>
          <p>Staffing Score: {data.site.staffing_score ?? 0}</p>
          <p>Retention Score: {data.site.retention_score ?? 0}</p>
          <p>Enrollment Score: {data.site.enrollment_score ?? 0}</p>
        </div>
      </Card>

      <Card>
        <h3 className="text-base font-semibold text-slate-900">Active Issues and Explainability</h3>
        <div className="mt-3 space-y-3 text-sm">
          <div>
            <p className="font-medium text-emerald-700">Positive Factors</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-slate-600">
              {positive.map((factor: any, index: number) => (
                <li key={`${factor.label}-${index}`}>{factor.label}: {factor.detail}</li>
              ))}
              {positive.length === 0 && <li>No positive factors logged yet.</li>}
            </ul>
          </div>

          <div>
            <p className="font-medium text-rose-700">Negative Factors</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-slate-600">
              {negative.map((factor: any, index: number) => (
                <li key={`${factor.label}-${index}`}>{factor.label}: {factor.detail}</li>
              ))}
              {negative.length === 0 && <li>No negative factors logged yet.</li>}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
