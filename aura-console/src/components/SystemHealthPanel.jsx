// aura-console/src/components/SystemHealthPanel.jsx
import React, { useEffect, useState } from "react";

function pillClass(status) {
  if (status === "ok")
    return "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40";
  if (status === "degraded")
    return "bg-amber-500/10 text-amber-300 border border-amber-500/40";
  return "bg-rose-500/10 text-rose-300 border border-rose-500/40";
}

export default function SystemHealthPanel() {
  const [data, setData] = useState(null);
  const [deepStatus, setDeepStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deepLoading, setDeepLoading] = useState(false);
  const [error, setError] = useState(null);

  async function loadHealth() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/health");
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
      setError("Failed to load health status");
    } finally {
      setLoading(false);
    }
  }

  async function runDeepCheck() {
    try {
      setDeepLoading(true);
      setDeepStatus(null);
      const res = await fetch("/api/health/deep");
      const json = await res.json();

      if (!res.ok) {
        setDeepStatus({
          status: "error",
          message: json.message || "OpenAI not reachable"
        });
      } else {
        setDeepStatus({
          status: "ok",
          latencyMs: json.latencyMs
        });
      }
    } catch (e) {
      setDeepStatus({
        status: "error",
        message: e.message || "Deep check failed"
      });
    } finally {
      setDeepLoading(false);
    }
  }

  useEffect(() => {
    loadHealth();
    const id = setInterval(loadHealth, 15000);
    return () => clearInterval(id);
  }, []);

  const status = data?.status || (error ? "error" : "loading");

  return (
    <div className="rounded-2xl bg-slate-900/70 border border-slate-700/70 p-4 md:p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 tracking-wide">
            System Health
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Live view of API uptime, latency, and OpenAI connectivity.
          </p>
        </div>
        <span
          className={
            "px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 " +
            pillClass(status === "loading" ? "degraded" : status)
          }
        >
          <span
            className={`h-2 w-2 rounded-full ${
              status === "ok"
                ? "bg-emerald-400"
                : status === "error"
                ? "bg-rose-400"
                : "bg-amber-400"
            }`}
          />
          {status === "loading"
            ? "Checking…"
            : status === "ok"
            ? "All systems go"
            : "Attention needed"}
        </span>
      </div>

      {error && (
        <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/40 rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <MetricCard
          label="Uptime"
          value={
            data
              ? formatUptime(data.uptimeSeconds)
              : loading
              ? "–"
              : "Unknown"
          }
        />
        <MetricCard
          label="Requests"
          value={data ? String(data.http.totalRequests) : "–"}
          hint={
            data
              ? `${data.http.failures} failed`
              : "HTTP requests since last restart"
          }
        />
        <MetricCard
          label="Avg latency"
          value={
            data
              ? `${Math.round(data.http.avgLatencyMs)} ms`
              : loading
              ? "–"
              : "n/a"
          }
        />
        <MetricCard
          label="OpenAI calls"
          value={data ? String(data.openai.totalCalls) : "–"}
          hint={
            data
              ? `${data.openai.failures} failed`
              : "Tracked from deep checks + tools"
          }
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap gap-3 text-slate-400">
          <InfoPill label="Environment" value={data?.env?.nodeEnv || "unknown"} />
          <InfoPill
            label="OpenAI key"
            value={data?.env?.hasOpenAIKey ? "configured" : "missing"}
          />
          <InfoPill
            label="Default model"
            value={data?.env?.defaultModel || "not set"}
          />
          {data?.openai?.lastError && (
            <button
              type="button"
              className="underline decoration-dotted underline-offset-2 text-rose-300"
              title={data.openai.lastError.message}
            >
              Last OpenAI error
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={runDeepCheck}
            disabled={deepLoading}
            className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-100 border border-slate-600 text-xs hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {deepLoading ? "Running deep check…" : "Run deep check"}
          </button>
          {deepStatus && (
            <span
              className={
                "text-xs " +
                (deepStatus.status === "ok"
                  ? "text-emerald-300"
                  : "text-rose-300")
              }
            >
              {deepStatus.status === "ok"
                ? `OpenAI OK (${deepStatus.latencyMs} ms)`
                : deepStatus.message || "OpenAI error"}
            </span>
          )}
        </div>
      </div>

      {data && (
        <p className="text-[10px] text-slate-500 mt-1">
          Updated {new Date(data.timestamp).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}

function MetricCard({ label, value, hint }) {
  return (
    <div className="rounded-xl bg-slate-950/40 border border-slate-800 px-3 py-2.5 flex flex-col gap-1">
      <span className="text-[11px] text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-50">{value}</span>
      {hint && <span className="text-[10px] text-slate-500">{hint}</span>}
    </div>
  );
}

function InfoPill({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/40 border border-slate-700 text-[11px] text-slate-300">
      <span className="text-slate-500">{label}:</span>
      <span className="font-medium text-slate-100">{value}</span>
    </span>
  );
}

function formatUptime(totalSeconds) {
  if (totalSeconds == null) return "–";
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
