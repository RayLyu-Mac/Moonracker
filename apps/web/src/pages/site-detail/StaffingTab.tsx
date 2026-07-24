import { Card } from "../../components/ui/card";

export function StaffingTab({ data }: { data: any }) {
  return (
    <Card>
      <h3 className="text-base font-semibold text-slate-900">Staffing</h3>
      <div className="mt-4 grid gap-3 text-sm text-slate-700 md:grid-cols-3">
        <p>Total Staff: {data.staffing?.total_staff ?? 0}</p>
        <p>CRC Count: {data.staffing?.crc_count ?? 0}</p>
        <p>Staff Capacity Score: {data.staffing?.staff_capacity_score ?? 0}</p>
      </div>
      <p className="mt-3 text-sm text-slate-600">Study roles and staffing coverage are reflected in the capacity score.</p>
    </Card>
  );
}
