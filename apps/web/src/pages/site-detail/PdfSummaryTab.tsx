import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";

export function PdfSummaryTab({ data }: { data: any }) {
  const rows = data.historicalRecruitmentRows ?? [];

  const printSummary = () => {
    document.body.classList.add("print-site-report");
    const clearClass = () => {
      document.body.classList.remove("print-site-report");
      window.removeEventListener("afterprint", clearClass);
    };

    window.addEventListener("afterprint", clearClass);
    window.print();
  };

  return (
    <div className="space-y-4">
      <Card className="no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">PDF Summary Export</h3>
            <p className="mt-1 text-base text-slate-600">Use browser Save as PDF to generate a site summary report.</p>
          </div>
          <Button onClick={printSummary} className="text-base">
            Export Summary PDF
          </Button>
        </div>
      </Card>

      <Card className="site-report-print-root">
        <h3 className="text-2xl font-semibold text-slate-900">Clinic Recruitment Summary</h3>
        <p className="mt-1 text-base text-slate-600">{data.site.site_name} ({data.site.site_number})</p>

        <div className="mt-5 grid gap-3 text-base md:grid-cols-3">
          <p><span className="font-semibold text-slate-800">Type:</span> <span className="capitalize">{data.site.site_type}</span></p>
          <p><span className="font-semibold text-slate-800">Country:</span> {data.site.country}</p>
          <p><span className="font-semibold text-slate-800">City:</span> {data.site.city}</p>
          <p><span className="font-semibold text-slate-800">Recruitment Score:</span> {data.site.total_score}</p>
          <p><span className="font-semibold text-slate-800">Recruitment Band:</span> <span className="capitalize">{data.site.recruitment_band}</span></p>
          <p><span className="font-semibold text-slate-800">Imported Score:</span> {data.site.imported_recruitment_score}</p>
        </div>

        <h4 className="mt-6 text-xl font-semibold text-slate-900">Factor Highlights</h4>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-base text-slate-700">
          {(data.factors ?? []).map((factor: any, index: number) => (
            <li key={`${factor.category}-${index}`}>{factor.label}: {factor.detail}</li>
          ))}
        </ul>

        <h4 className="mt-6 text-xl font-semibold text-slate-900">Historical Recruitment Runs</h4>
        <table className="mt-2 min-w-full text-base">
          <thead className="text-left text-sm uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-2 py-2">Run</th>
              <th className="px-2 py-2">Enrolled</th>
              <th className="px-2 py-2">Months</th>
              <th className="px-2 py-2">Rate/Month</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any) => (
              <tr key={row.label} className="border-t border-slate-100">
                <td className="px-2 py-2 text-slate-700">{row.label}</td>
                <td className="px-2 py-2 text-slate-700">{row.enrolled}</td>
                <td className="px-2 py-2 text-slate-700">{row.months}</td>
                <td className="px-2 py-2 text-slate-700">{row.ratePerMonth}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
