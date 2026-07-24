import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Card } from "../components/ui/card";

export function StudiesPage() {
  const [studies, setStudies] = useState<any[]>([]);

  useEffect(() => {
    api.getStudies().then(setStudies).catch(() => setStudies([]));
  }, []);

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold text-slate-900">Studies</h2>
        <p className="text-sm text-slate-600">Cross-study portfolio visibility and performance comparison.</p>
      </header>

      <Card className="overflow-x-auto p-0">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Study ID</th>
              <th className="px-4 py-3">Protocol</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Sponsor</th>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Total Sites</th>
              <th className="px-4 py-3">Avg Score</th>
            </tr>
          </thead>
          <tbody>
            {studies.map((study) => (
              <tr key={study.study_id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-800">{study.study_id}</td>
                <td className="px-4 py-3 text-slate-600">{study.protocol_code}</td>
                <td className="px-4 py-3 text-slate-600">{study.title}</td>
                <td className="px-4 py-3 text-slate-600">{study.sponsor}</td>
                <td className="px-4 py-3 text-slate-600">{study.company}</td>
                <td className="px-4 py-3 text-slate-600">{study.status}</td>
                <td className="px-4 py-3 text-slate-600">{study.total_sites}</td>
                <td className="px-4 py-3 text-slate-600">{study.average_score}</td>
              </tr>
            ))}
            {studies.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={8}>
                  No studies loaded. Upload Study Metadata first.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
