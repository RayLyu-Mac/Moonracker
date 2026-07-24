import { Card } from "../../components/ui/card";

type SlotStatus = "randomized" | "screening" | "not_activated";

const STATUS_STYLE: Record<SlotStatus, { bg: string; label: string }> = {
  randomized: { bg: "bg-emerald-500", label: "Randomized" },
  screening: { bg: "bg-amber-400", label: "In Screening" },
  not_activated: { bg: "bg-slate-200", label: "Not Activated" },
};

export function EnrollmentTab({ data }: { data: any }) {
  const enrollment = data.enrollment ?? {};
  const process: Array<{ id: number; status: SlotStatus }> = data.recruitmentProcess ?? [];

  const randomized = process.filter((p) => p.status === "randomized").length;
  const screening = process.filter((p) => p.status === "screening").length;
  const notActivated = process.filter((p) => p.status === "not_activated").length;

  return (
    <div className="space-y-4">
      {/* ── Patient slot grid ── */}
      <Card>
        <h3 className="mb-1 text-lg font-semibold text-slate-900">Current Recruitment Process</h3>
        <p className="mb-5 text-base text-slate-500">
          Patient slots showing randomization status for this site.
        </p>

        <div className="flex flex-wrap gap-2">
          {process.map((p) => (
            <div
              key={p.id}
              title={`Patient ${p.id} — ${STATUS_STYLE[p.status].label}`}
              className={`h-9 w-9 rounded-full ${STATUS_STYLE[p.status].bg} flex items-center justify-center text-xs font-semibold text-white shadow-sm`}
            >
              {p.id}
            </div>
          ))}
          {process.length === 0 && (
            <p className="text-base text-slate-400">No recruitment process data for this site.</p>
          )}
        </div>

        {/* legend + counts */}
        <div className="mt-5 flex flex-wrap gap-5 text-base">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            <span className="text-slate-700">Randomized <span className="font-semibold">{randomized}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            <span className="text-slate-700">In Screening <span className="font-semibold">{screening}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-slate-200" />
            <span className="text-slate-700">Not Activated <span className="font-semibold">{notActivated}</span></span>
          </div>
        </div>
      </Card>

      {/* ── Enrollment metrics ── */}
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Enrollment Metrics</h3>
        <div className="grid gap-4 text-base text-slate-700 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-sm uppercase tracking-wide text-slate-500">Target Enrollment</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{enrollment.target_enrollment ?? 0}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-sm uppercase tracking-wide text-slate-500">Actual Enrollment</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{enrollment.actual_enrollment ?? 0}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-sm uppercase tracking-wide text-slate-500">Enrollment %</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{enrollment.enrollment_pct ?? 0}%</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-sm uppercase tracking-wide text-slate-500">Screening Count (30d)</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{enrollment.screening_count ?? 0}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-sm uppercase tracking-wide text-slate-500">Randomized Count</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{enrollment.randomized_count ?? 0}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

