import { Card } from "../../components/ui/card";

export function DocumentsTab({ data }: { data: any }) {
  const documents = data.documents ?? [];

  return (
    <Card>
      <h3 className="text-base font-semibold text-slate-900">Documents</h3>
      <ul className="mt-3 space-y-2 text-sm text-slate-700">
        {documents.map((document: any) => (
          <li key={document.upload_id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            <p className="font-medium text-slate-800">{document.file_name}</p>
            <p className="text-xs text-slate-500">Uploaded: {new Date(document.uploaded_at).toLocaleString()}</p>
          </li>
        ))}
        {documents.length === 0 && <li className="text-slate-500">No documents uploaded for this site yet.</li>}
      </ul>
    </Card>
  );
}
