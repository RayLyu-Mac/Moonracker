import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

export function ConfigurationPage() {
  const [weights, setWeights] = useState({
    diseasePrevalence: 0.2,
    historicalRecruitment: 0.2,
    siteType: 0.2,
    adminEfficiency: 0.2,
    prescreening: 0.2,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.getWeights().then(setWeights).catch(() => undefined);
  }, []);

  const total = useMemo(
    () =>
      weights.diseasePrevalence +
      weights.historicalRecruitment +
      weights.siteType +
      weights.adminEfficiency +
      weights.prescreening,
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
    <div className="space-y-6">
      <header>
        <h2 className="text-4xl font-semibold text-slate-900">Configuration</h2>
        <p className="mt-2 text-lg text-slate-600">Adjust recruitment scoring weights. The sum must equal 1.00.</p>
      </header>

      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          {(
            [
              ["diseasePrevalence", "Disease prevalence (CDC Wonder)"],
              ["historicalRecruitment", "Historical data and recruitment rate"],
              ["siteType", "Hospital / clinic / university"],
              ["adminEfficiency", "Contract execution and admin efficiency"],
              ["prescreening", "Prescreening logs"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="space-y-2 text-base">
              <span className="font-medium text-slate-700">{label}</span>
              <input
                value={weights[key]}
                onChange={(event) => setWeights((prev) => ({ ...prev, [key]: Number(event.target.value) }))}
                type="number"
                min={0}
                max={1}
                step={0.01}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base"
              />
            </label>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className={`text-base ${Math.abs(total - 1) < 0.001 ? "text-emerald-700" : "text-rose-600"}`}>
            Current total: {total.toFixed(2)}
          </p>
          <Button onClick={save} disabled={saving || Math.abs(total - 1) >= 0.001}>
            {saving ? "Saving..." : "Save Weights"}
          </Button>
        </div>

        {message && <p className="mt-3 text-base text-slate-600">{message}</p>}
      </Card>
    </div>
  );
}
