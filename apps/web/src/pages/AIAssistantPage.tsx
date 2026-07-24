import { Card } from "../components/ui/card";

export function AIAssistantPage() {
  return (
    <Card className="flex min-h-[280px] items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-slate-900">AI Assistant coming soon</h2>
        <p className="mt-2 max-w-xl text-sm text-slate-600">
          Future releases will support natural language querying, risk explanation, site summarization, and enrollment forecasting.
        </p>
      </div>
    </Card>
  );
}
