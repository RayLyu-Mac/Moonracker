import { useEffect, useState } from "react";
import { UploadCloud } from "lucide-react";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

const categories = [
  { value: "site_status", label: "Site Status" },
  { value: "personnel_log", label: "Personnel Log" },
  { value: "retention_tracker", label: "Retention Tracker" },
  { value: "enrollment_tracker", label: "Enrollment Tracker" },
  { value: "study_metadata", label: "Study Metadata" },
  { value: "documents", label: "Documents (PDF metadata only)" },
];

export function DataUploadPage() {
  const [category, setCategory] = useState("site_status");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refreshHistory = () => {
    api.getUploadHistory().then(setHistory).catch(() => setHistory([]));
  };

  useEffect(() => {
    refreshHistory();
  }, []);

  const onUpload = async () => {
    if (!file) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.uploadFile(category, file);
      setResult(response);
      refreshHistory();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold text-slate-900">Data Upload</h2>
        <p className="text-sm text-slate-600">Upload CSV, XLSX, or PDF and run strict template validation before ingestion.</p>
      </header>

      <Card>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">Category</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-700"
            >
              {categories.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-sm">
            <span className="font-medium text-slate-700">File</span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.pdf"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-2 file:py-1"
            />
          </label>

          <div className="flex items-end">
            <Button className="w-full" onClick={onUpload} disabled={!file || isSubmitting}>
              <UploadCloud className="mr-2 h-4 w-4" />
              {isSubmitting ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </Card>

      {result && (
        <Card>
          <h3 className="text-lg font-semibold text-slate-900">Validation Result</h3>
          <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-3">
            <p>Status: {result.status}</p>
            <p>Inserted: {result.inserted}</p>
            <p>Updated: {result.updated}</p>
          </div>
          {result.validationErrors?.length > 0 && (
            <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-rose-600">
              {result.validationErrors.map((error: any, index: number) => (
                <li key={index}>
                  Row {error.row}: {error.message}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">File</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Inserted</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody>
            {history.map((item) => (
              <tr key={item.upload_id} className="border-t border-slate-100">
                <td className="px-4 py-3 text-slate-600">{new Date(item.uploaded_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-slate-600">{item.category}</td>
                <td className="px-4 py-3 text-slate-600">{item.file_name}</td>
                <td className="px-4 py-3 text-slate-600">{item.status}</td>
                <td className="px-4 py-3 text-slate-600">{item.inserted_count}</td>
                <td className="px-4 py-3 text-slate-600">{item.updated_count}</td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={6}>
                  No upload history yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
