import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

export function ConfigurationPage() {
  const [weights, setWeights] = useState({ startup: 0.25, staffing: 0.25, retention: 0.25, enrollment: 0.25 });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.getWeights().then(setWeights).catch(() => undefined);
  }, []);

  const total = useMemo(
    () => weights.startup + weights.staffing + weights.retention + weights.enrollment,
    [weights],
  );

  const save = async () => {
    setSaving(true);
    try {
      await api.saveWeights(weights);
      setMessage("Scoring weights saved. Site scores recalculated.");
    } catch (error) {
      setMessage(`Unable to save weights: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold text-slate-900">Configuration</h2>
        <p className="text-sm text-slate-600">Adjust rule-based scoring weights. The sum must equal 1.00.</p>
      </header>

      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          {(
            [
              ["startup", "Startup Readiness"],
              ["staffing", "Staffing Capacity"],
              ["retention", "Retention Quality"],
              ["enrollment", "Enrollment Performance"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">{label}</span>
              <input
                value={weights[key]}
                onChange={(event) => setWeights((prev) => ({ ...prev, [key]: Number(event.target.value) }))}
                type="number"
                min={0}
                max={1}
                step={0.01}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </label>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className={`text-sm ${Math.abs(total - 1) < 0.001 ? "text-emerald-700" : "text-rose-600"}`}>
            Current total: {total.toFixed(2)}
          </p>
          <Button onClick={save} disabled={saving || Math.abs(total - 1) >= 0.001}>
            {saving ? "Saving..." : "Save Weights"}
          </Button>
        </div>

        {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
      </Card>
    </div>
  );
}
