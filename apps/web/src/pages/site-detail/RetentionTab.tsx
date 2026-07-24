import { Card } from "../../components/ui/card";

export function RetentionTab({ data }: { data: any }) {
  const retention = data.retention || {};

  return (
    <Card>
      <h3 className="text-base font-semibold text-slate-900">Retention</h3>
      <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-3">
        <p>LTFU Cases: {retention.ltfu_cases ?? 0}</p>
        <p>Withdrawals: {retention.withdrawals ?? 0}</p>
        <p>IP Discontinuations: {retention.ip_discontinuations ?? 0}</p>
        <p>Open Cases: {retention.open_cases ?? 0}</p>
        <p>Closed Cases: {retention.closed_cases ?? 0}</p>
      </div>
    </Card>
  );
}
