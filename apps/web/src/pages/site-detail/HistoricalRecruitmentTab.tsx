import { Card } from "../../components/ui/card";

export function HistoricalRecruitmentTab({ data }: { data: any }) {
  const rows = data.historicalRecruitmentRows ?? [];

  return (
    <Card>
      <h3 className="text-xl font-semibold text-slate-900">Historical Recruitment Table</h3>
      <p className="mt-2 text-base text-slate-600">Multiple separated recruitment runs are generated per clinic site for quick performance comparison.</p>

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-base">
          <thead className="text-left text-sm uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-3">Run</th>
              <th className="px-3 py-3">Enrolled</th>
              <th className="px-3 py-3">Duration (Months)</th>
              <th className="px-3 py-3">Rate / Month</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any) => (
              <tr key={row.label} className="border-t border-slate-100">
                <td className="px-3 py-3 text-slate-700">{row.label}</td>
                <td className="px-3 py-3 text-slate-700">{row.enrolled}</td>
                <td className="px-3 py-3 text-slate-700">{row.months}</td>
                <td className="px-3 py-3 text-slate-700">{row.ratePerMonth}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-slate-500" colSpan={4}>
                  No historical recruitment rows available for this site.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
