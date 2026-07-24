import { useEffect, useRef, useState } from "react";
import { BrainCircuit, ChevronDown, ChevronUp, Send, Trash2, X } from "lucide-react";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

type Message = { role: "user" | "assistant"; content: string };
type AiSettings = { baseUrl: string | null; model: string; hasToken: boolean };

const PRESET_QUESTIONS = [
  "Which sites have the highest recruitment likelihood?",
  "Which sites are in the red band and why?",
  "Which countries have the best average recruitment score?",
  "How do universities compare to hospitals and clinics?",
  "Which sites have the best historical recruitment rate per month?",
  "What factors are dragging down the lowest-scoring sites?",
  "Which sites have the highest prescreening conversion rate?",
  "What should I prioritise to improve the red-band sites?",
];

export function AIAssistantPage() {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [baseUrlInput, setBaseUrlInput] = useState("");
  const [modelInput, setModelInput] = useState("gpt-4o-mini");
  const [tokenInput, setTokenInput] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState("");

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .getAiSettings()
      .then((s) => {
        setSettings(s);
        if (!s.baseUrl && !s.hasToken) setSettingsOpen(true);
      })
      .catch(() => {
        setSettings({ baseUrl: null, model: "gpt-4o-mini", hasToken: false });
        setSettingsOpen(true);
      });
  }, []);

  useEffect(() => {
    if (settings?.baseUrl) setBaseUrlInput(settings.baseUrl);
    if (settings?.model) setModelInput(settings.model);
  }, [settings]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const isConfigured = !!(settings?.baseUrl && settings.hasToken);

  const saveSettings = async () => {
    if (!baseUrlInput.trim() || !tokenInput.trim()) {
      setSettingsMsg("Base URL and API token are required.");
      return;
    }
    setSavingSettings(true);
    setSettingsMsg("");
    try {
      await api.saveAiSettings({
        baseUrl: baseUrlInput.trim(),
        model: modelInput.trim() || "gpt-4o-mini",
        token: tokenInput.trim(),
      });
      const updated = await api.getAiSettings();
      setSettings(updated);
      setTokenInput("");
      setSettingsOpen(false);
      setSettingsMsg("Connection saved.");
    } catch {
      setSettingsMsg("Failed to save. Check the values and try again.");
    } finally {
      setSavingSettings(false);
    }
  };

  const removeSettings = async () => {
    await api.deleteAiSettings().catch(() => undefined);
    setSettings({ baseUrl: null, model: "gpt-4o-mini", hasToken: false });
    setBaseUrlInput("");
    setTokenInput("");
    setSettingsMsg("");
    setSettingsOpen(true);
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setErrorMsg("");
    const next: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInputText("");
    setLoading(true);
    try {
      const { content } = await api.aiChat(next);
      setMessages((prev) => [...prev, { role: "assistant", content }]);
    } catch (err) {
      setErrorMsg((err as Error).message.replace(/^Error:\s*/, "").slice(0, 400));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-4xl font-semibold text-slate-900">AI Assistant</h2>
        <p className="mt-2 text-lg text-slate-600">
          Ask questions about site rankings, recruitment trends, and performance insights.
        </p>
      </header>

      {/* ── Connection settings ────────────────────────────────── */}
      <Card>
        <button
          type="button"
          className="flex w-full items-center justify-between text-left"
          onClick={() => setSettingsOpen((v) => !v)}
        >
          <div className="flex items-center gap-3">
            <BrainCircuit className="h-5 w-5 text-sky-600" />
            <div>
              <p className="text-lg font-semibold text-slate-900">AI Connection</p>
              {isConfigured ? (
                <p className="mt-0.5 text-sm text-emerald-600">Connected · {settings?.baseUrl}</p>
              ) : (
                <p className="mt-0.5 text-sm text-rose-600">Not configured — add base URL and API token to enable chat</p>
              )}
            </div>
          </div>
          {settingsOpen ? (
            <ChevronUp className="h-5 w-5 shrink-0 text-slate-400" />
          ) : (
            <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />
          )}
        </button>

        {settingsOpen && (
          <div className="mt-5 border-t border-slate-100 pt-5">
            {isConfigured ? (
              /* ── Saved connection display ── */
              <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl bg-slate-50 px-5 py-4">
                <div className="space-y-1.5 text-base">
                  <p>
                    <span className="font-medium text-slate-700">Base URL:</span>{" "}
                    <span className="text-slate-900">{settings?.baseUrl}</span>
                  </p>
                  <p>
                    <span className="font-medium text-slate-700">Model:</span>{" "}
                    <span className="text-slate-900">{settings?.model}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-medium text-slate-700">API Token:</span>
                    <span className="font-mono tracking-[0.3em] text-slate-800">••••••••••••</span>
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={removeSettings}
                  className="flex items-center gap-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove connection
                </Button>
              </div>
            ) : (
              /* ── Add connection form ── */
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-base font-medium text-slate-700">Base URL</span>
                  <input
                    type="text"
                    placeholder="https://api.openai.com/v1"
                    value={baseUrlInput}
                    onChange={(e) => setBaseUrlInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base text-slate-800 placeholder:text-slate-400"
                  />
                  <p className="text-sm text-slate-500">
                    Works with any OpenAI-compatible endpoint (OpenAI, Azure, Ollama, LM Studio, etc.)
                  </p>
                </label>

                <label className="space-y-1.5">
                  <span className="text-base font-medium text-slate-700">Model name</span>
                  <input
                    type="text"
                    placeholder="gpt-4o-mini"
                    value={modelInput}
                    onChange={(e) => setModelInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base text-slate-800 placeholder:text-slate-400"
                  />
                </label>

                <label className="space-y-1.5 md:col-span-2">
                  <span className="text-base font-medium text-slate-700">API Token</span>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="sk-…"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveSettings()}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 pr-10 text-base text-slate-800 placeholder:text-slate-400"
                    />
                    {tokenInput && (
                      <button
                        type="button"
                        onClick={() => setTokenInput("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    Token is stored server-side and never returned in API responses.
                  </p>
                </label>

                <div className="flex items-center gap-3 md:col-span-2">
                  <Button onClick={saveSettings} disabled={savingSettings}>
                    {savingSettings ? "Saving…" : "Save connection"}
                  </Button>
                  {settingsMsg && (
                    <p
                      className={`text-base ${
                        settingsMsg.startsWith("Failed") || settingsMsg.includes("required")
                          ? "text-rose-600"
                          : "text-emerald-700"
                      }`}
                    >
                      {settingsMsg}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ── Preset questions ───────────────────────────────────── */}
      <div>
        <p className="mb-3 text-base font-medium text-slate-600">Suggested questions</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => sendMessage(q)}
              disabled={!isConfigured || loading}
              className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 transition-colors hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chat window ────────────────────────────────────────── */}
      <Card className="flex flex-col gap-0 overflow-hidden p-0">
        {/* messages */}
        <div className="flex min-h-[400px] flex-col gap-4 overflow-y-auto p-6">
          {messages.length === 0 && !loading && (
            <div className="m-auto text-center text-slate-400">
              <BrainCircuit className="mx-auto mb-3 h-12 w-12 opacity-20" />
              <p className="text-base">
                {isConfigured
                  ? "Click a preset question or type below to get started."
                  : "Configure the AI connection above to enable the assistant."}
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-base leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-sky-700 text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-800"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-lg text-slate-400">
                <span className="inline-flex gap-1.5">
                  <span className="animate-bounce" style={{ animationDelay: "0ms" }}>·</span>
                  <span className="animate-bounce" style={{ animationDelay: "160ms" }}>·</span>
                  <span className="animate-bounce" style={{ animationDelay: "320ms" }}>·</span>
                </span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-base text-rose-700">
              {errorMsg}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* input bar */}
        <div className="border-t border-slate-100 bg-white px-4 py-4">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder={
                isConfigured ? "Ask about sites, scores, or trends…" : "Configure AI connection above to start chatting"
              }
              value={inputText}
              disabled={!isConfigured || loading}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(inputText)}
              className="flex-1 rounded-xl border border-slate-300 px-4 py-3 text-base text-slate-800 placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
            />
            <Button
              onClick={() => sendMessage(inputText)}
              disabled={!isConfigured || loading || !inputText.trim()}
              className="shrink-0 px-5"
            >
              <Send className="h-4 w-4" />
            </Button>
            {messages.length > 0 && !loading && (
              <Button
                variant="secondary"
                onClick={() => {
                  setMessages([]);
                  setErrorMsg("");
                }}
                className="shrink-0"
                title="Clear conversation"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

