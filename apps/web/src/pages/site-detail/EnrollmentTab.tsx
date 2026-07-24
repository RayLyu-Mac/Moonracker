import { Card } from "../../components/ui/card";

export function EnrollmentTab({ data }: { data: any }) {
  const enrollment = data.enrollment || {};

  return (
    <Card>
      <h3 className="text-base font-semibold text-slate-900">Enrollment</h3>
      <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-3">
        <p>Target Enrollment: {enrollment.target_enrollment ?? 0}</p>
        <p>Actual Enrollment: {enrollment.actual_enrollment ?? 0}</p>
        <p>Enrollment %: {enrollment.enrollment_pct ?? 0}%</p>
        <p>Screening Count: {enrollment.screening_count ?? 0}</p>
        <p>Randomized Count: {enrollment.randomized_count ?? 0}</p>
      </div>
    </Card>
  );
}
