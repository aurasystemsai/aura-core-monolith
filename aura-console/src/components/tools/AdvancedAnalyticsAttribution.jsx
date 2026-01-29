import React, { useState } from "react";
import BackButton from "./BackButton";

const samplePayload = {
  shopifyOrders: [
    {
      id: "order-123",
      name: "#123",
      customer: { email: "user@example.com" },
      total_price: 120,
      subtotal_price: 100,
      currency: "USD",
      created_at: new Date().toISOString(),
      referring_site: "https://google.com?q=shoes",
      landing_site: "/product/shoes",
      source_name: "google",
    },
  ],
  adEvents: [
    {
      id: "click-1",
      type: "click",
      channel: "google-ads",
      campaign: "Spring Sale",
      value: 0,
      currency: "USD",
      user_id: "user@example.com",
      timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
    },
  ],
  offlineEvents: [],
  model: "linear",
  includeJourneys: true,
  cohortKey: "channel",
};

export default function AdvancedAnalyticsAttribution() {
  const [payload, setPayload] = useState(JSON.stringify(samplePayload, null, 2));
  const [query, setQuery] = useState("How is performance by channel and where should we shift budget?");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [env, setEnv] = useState("dev");
  const [model, setModel] = useState("linear");
  const [cohortKey, setCohortKey] = useState("channel");
  const [validation, setValidation] = useState(null);
  const [exportUrl, setExportUrl] = useState(null);
  const [journeyDepth, setJourneyDepth] = useState(3);
  const [budgetShift, setBudgetShift] = useState({ channel: "google-ads", delta: 10, uplift: null });

  const devSandbox = env === "dev";
  const payloadSize = payload.length;
  const estimatedRuntime = Math.min(18, 3 + Math.round(payloadSize / 900));
  const guardrailBlock = payloadSize > 7500;

  const restoreSnapshot = (snap) => {
    if (!snap) return;
    if (snap.payload) setPayload(JSON.stringify(snap.payload, null, 2));
    if (snap.query) setQuery(snap.query);
    if (snap.result) setResult(snap.result);
    if (snap.env) setEnv(snap.env);
    if (snap.payload?.model) setModel(snap.payload.model);
    if (snap.payload?.cohortKey) setCohortKey(snap.payload.cohortKey);
  };

  const quickFixForIssue = (msg = "") => {
    const lower = msg.toLowerCase();
    if (lower.includes("json")) return "reset-sample";
    if (lower.includes("payload") || lower.includes("body")) return "trim-payload";
    if (lower.includes("query")) return "rewrite-query";
    return null;
  };

  const syncPayloadField = (field, value) => {
    try {
      const parsed = JSON.parse(payload);
      parsed[field] = value;
      setPayload(JSON.stringify(parsed, null, 2));
    } catch (err) {
      setValidation({ status: "error", issues: ["Payload parse failed: " + err.message] });
    }
  };

  const validatePayload = () => {
    try {
      const parsed = JSON.parse(payload);
      const issues = [];
      const stats = {
        orders: parsed.shopifyOrders?.length || 0,
        ads: parsed.adEvents?.length || 0,
        offline: parsed.offlineEvents?.length || 0,
      };
      if (!Array.isArray(parsed.shopifyOrders) || stats.orders === 0) issues.push("Missing or empty shopifyOrders");
      if (!Array.isArray(parsed.adEvents) || stats.ads === 0) issues.push("Missing or empty adEvents");
      if (!parsed.model) issues.push("Model not set");
      if (stats.orders > 5000) issues.push("Large orders array; consider sampling");
      setValidation({ status: issues.length ? "warn" : "ok", issues, stats });
    } catch (err) {
      setValidation({ status: "error", issues: ["Invalid JSON: " + err.message] });
    }
  };

  const simulateBudgetShift = () => {
    const perf = result?.performance || {
      "google-ads": { revenue: 42000, count: 320 },
      email: { revenue: 18000, count: 210 },
      organic: { revenue: 12000, count: 260 },
    };
    const base = perf[budgetShift.channel];
    const upliftPct = budgetShift.delta / 100;
    const projected = base ? {
      revenue: base.revenue * (1 + upliftPct * 0.6),
      count: Math.round(base.count * (1 + upliftPct * 0.4)),
    } : null;
    setBudgetShift(prev => ({ ...prev, uplift: projected }));
  };

  const toggleJourneys = () => {
    const nextDepth = journeyDepth === 0 ? 3 : 0;
    setJourneyDepth(nextDepth);
    syncPayloadField("includeJourneys", nextDepth > 0);
    syncPayloadField("journeySampleDepth", nextDepth || undefined);
  };

  const exportResult = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setExportUrl(url);
    setTimeout(() => URL.revokeObjectURL(url), 12000);
  };

  const run = async () => {
    if (devSandbox) {
      setError("Sandbox mode: switch to Stage/Prod to run full attribution.");
      return;
    }
    if (guardrailBlock) {
      setError("Payload too large (>7.5k chars). Trim before running.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const body = JSON.parse(payload);
      const res = await fetch("/api/advanced-analytics-attribution/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, query }),
      });
      const data = await res.json();
      if (!data.ok && data.error) throw new Error(data.error);
      setResult(data);
      const snap = {
        query,
        payload: body,
        result: data,
        env,
        at: Date.now(),
      };
      setHistory((prev) => [snap, ...prev].slice(0, 5));
    } catch (e) {
      setError(e.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, display: "grid", gap: 16 }}>
      {devSandbox && (
        <div style={{ background: "#0b1221", border: "1px solid #1f2937", borderRadius: 12, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 800, color: "#f59e0b" }}>Sandbox mode</div>
            <div style={{ color: "#9ca3af", fontSize: 13 }}>Attribution runs are blocked in dev. Switch to Stage/Prod to execute models.</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => setEnv("stage")} style={{ background: "#1f2937", color: "#e5e7eb", border: "1px solid #334155", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}>Switch to Stage</button>
            <button onClick={() => setEnv("prod")} style={{ background: "#22c55e", color: "#0b1221", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}>Go Prod</button>
          </div>
        </div>
      )}
      <div style={{ display: "grid", gap: 4 }}>
        <h2 style={{ margin: 0 }}>Advanced Analytics Attribution</h2>
        <div style={{ color: "#b8c2d0" }}>
          Ingest Shopify + ads + offline events, run attribution models, and view performance, journeys, and cohorts.
        </div>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <label style={{ fontWeight: 700 }}>Query for AI Insights</label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={3}
          style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #2c3a4d", background: "#101726", color: "#e9efff" }}
        />
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <label style={{ fontWeight: 700 }}>Payload (JSON)</label>
        <textarea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          rows={18}
          style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #2c3a4d", background: "#0d1420", color: "#e9efff", fontFamily: "monospace" }}
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select value={env} onChange={(e) => setEnv(e.target.value)} style={{ background: "#0b1221", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "10px 12px", fontWeight: 700 }}>
            <option value="dev">Dev</option>
            <option value="stage">Stage</option>
            <option value="prod">Prod</option>
          </select>
          <select value={model} onChange={(e) => { setModel(e.target.value); syncPayloadField("model", e.target.value); }} style={{ background: "#0b1221", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "10px 12px", fontWeight: 700 }}>
            <option value="first-touch">First touch</option>
            <option value="last-touch">Last touch</option>
            <option value="linear">Linear</option>
            <option value="data-driven">Data-driven</option>
          </select>
          <select value={cohortKey} onChange={(e) => { setCohortKey(e.target.value); syncPayloadField("cohortKey", e.target.value); }} style={{ background: "#0b1221", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "10px 12px", fontWeight: 700 }}>
            <option value="channel">Cohort: channel</option>
            <option value="campaign">Cohort: campaign</option>
            <option value="geo">Cohort: geo</option>
            <option value="source_name">Cohort: source</option>
          </select>
          <button onClick={run} disabled={loading || devSandbox || guardrailBlock} style={{ padding: "10px 14px", borderRadius: 8, border: "none", background: devSandbox || guardrailBlock ? "#1f2937" : "#22d3ee", color: devSandbox || guardrailBlock ? "#9ca3af" : "#031018", fontWeight: 800, cursor: loading || devSandbox || guardrailBlock ? "not-allowed" : "pointer", opacity: loading || devSandbox || guardrailBlock ? 0.7 : 1 }}>
            {devSandbox ? "Sandbox (set Stage)" : loading ? "Running..." : guardrailBlock ? "Trim payload" : "Run Attribution"}
          </button>
          <button onClick={() => { setPayload(JSON.stringify(samplePayload, null, 2)); setModel(samplePayload.model); setCohortKey(samplePayload.cohortKey); setJourneyDepth(3); }} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #2c3a4d", background: "#131c2c", color: "#e9efff", fontWeight: 700, cursor: "pointer" }}>
            Reset Sample
          </button>
          <button onClick={validatePayload} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #2c3a4d", background: "#0b1221", color: "#e5e7eb", fontWeight: 700, cursor: "pointer" }}>
            Validate payload
          </button>
          <button onClick={toggleJourneys} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #2c3a4d", background: journeyDepth === 0 ? "#1f2937" : "#22c55e", color: journeyDepth === 0 ? "#e5e7eb" : "#0b1221", fontWeight: 800, cursor: "pointer" }}>
            {journeyDepth === 0 ? "Skip journeys" : `Journeys depth ${journeyDepth}`}
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", color: "#9ca3af", fontSize: 12 }}>
          <span>Size: {payloadSize} chars</span>
          <span>Est. runtime: ~{estimatedRuntime}s</span>
          {guardrailBlock && <span style={{ color: "#f87171", fontWeight: 700 }}>Guardrail: trim payload to run</span>}
        </div>
        {error && (
          <div style={{ color: "#ff8a8a", fontWeight: 700, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span>{error}</span>
            {quickFixForIssue(error) === "reset-sample" && (
              <button onClick={() => setPayload(JSON.stringify(samplePayload, null, 2))} style={{ background: "#22c55e", color: "#0b1221", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>Fix: Reset sample</button>
            )}
            {quickFixForIssue(error) === "trim-payload" && (
              <button onClick={() => setPayload(prev => JSON.stringify(JSON.parse(prev), null, 2).slice(0, 4000))} style={{ background: "#22c55e", color: "#0b1221", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>Fix: Trim payload</button>
            )}
            {quickFixForIssue(error) === "rewrite-query" && (
              <button onClick={() => setQuery("Summarize top channels and biggest churn risk segments." )} style={{ background: "#22c55e", color: "#0b1221", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>Fix: Use safer query</button>
            )}
          </div>
        )}
        {payloadSize > 4000 && <div style={{ color: "#fbbf24", fontSize: 13 }}>Perf detail: large payload ({payloadSize} chars) — consider trimming for faster runs.</div>}
        {validation && (
          <div style={{ marginTop: 6, background: validation.status === "ok" ? "#0f172a" : "#1f2937", border: "1px solid #1f2937", borderRadius: 10, padding: 10, display: "grid", gap: 6 }}>
            <div style={{ color: validation.status === "ok" ? "#22c55e" : validation.status === "warn" ? "#fbbf24" : "#f87171", fontWeight: 800 }}>
              {validation.status === "ok" ? "Payload valid" : validation.status === "warn" ? "Warnings" : "Errors"}
            </div>
            {validation.stats && (
              <div style={{ color: "#9ca3af", fontSize: 13 }}>Orders {validation.stats.orders} · Ads {validation.stats.ads} · Offline {validation.stats.offline}</div>
            )}
            {validation.issues && validation.issues.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: 16, color: validation.status === "warn" ? "#fbbf24" : "#f87171", fontSize: 13 }}>
                {validation.issues.map((iss, idx) => <li key={idx}>{iss}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gap: 10, background: "#0b1221", border: "1px solid #1f2937", borderRadius: 12, padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 800, color: "#e5e7eb" }}>Budget shift simulator</div>
          <div style={{ color: "#9ca3af", fontSize: 12 }}>Model: {model} · Cohort: {cohortKey}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <select value={budgetShift.channel} onChange={e => setBudgetShift(prev => ({ ...prev, channel: e.target.value }))} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "8px 12px", fontWeight: 700 }}>
            <option value="google-ads">Google Ads</option>
            <option value="email">Email</option>
            <option value="organic">Organic</option>
            <option value="meta-ads">Meta Ads</option>
          </select>
          <input type="number" value={budgetShift.delta} onChange={e => setBudgetShift(prev => ({ ...prev, delta: Number(e.target.value) || 0 }))} style={{ width: 90, background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "8px 10px" }} />
          <span style={{ color: "#9ca3af", fontSize: 13 }}>% budget shift</span>
          <button onClick={simulateBudgetShift} style={{ background: "#22c55e", color: "#0b1221", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 800, cursor: "pointer" }}>Simulate</button>
        </div>
        {budgetShift.uplift && (
          <div style={{ color: "#e5e7eb", fontSize: 14 }}>
            Projected {budgetShift.channel}: ${budgetShift.uplift.revenue.toFixed(0)} · {budgetShift.uplift.count} conversions
          </div>
        )}
        {result?.performance && <div style={{ color: "#9ca3af", fontSize: 12 }}>Using latest run performance as baseline.</div>}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <BackButton />
        {validation?.status === "warn" && <span style={{ color: "#fbbf24", fontSize: 12 }}>Warnings present; review before running.</span>}
      </div>

      {history.length > 0 && (
        <div style={{ background: "#0b1221", border: "1px solid #1f2937", borderRadius: 12, padding: 12, display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 800, color: "#e5e7eb" }}>Recent runs</div>
            <div style={{ color: "#9ca3af", fontSize: 12 }}>Last {Math.min(3, history.length)} shown</div>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {history.slice(0, 3).map((h, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: "8px 10px" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#e5e7eb" }}>{h.query?.slice(0, 40) || "Run"}{h.query?.length > 40 ? "…" : ""}</div>
                  <div style={{ color: "#9ca3af", fontSize: 12 }}>{h.at ? new Date(h.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "recent"} · {h.env}</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button onClick={() => restoreSnapshot(h)} style={{ background: "#1f2937", color: "#e5e7eb", border: "1px solid #334155", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>Load</button>
                  <button onClick={() => { restoreSnapshot(h); setTimeout(() => run(), 0); }} disabled={devSandbox} style={{ background: devSandbox ? "#1f2937" : "#22c55e", color: devSandbox ? "#9ca3af" : "#0b1221", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: devSandbox ? "not-allowed" : "pointer", opacity: devSandbox ? 0.6 : 1 }}>{devSandbox ? "Sandbox" : "Re-run"}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {result && (
        <div style={{ display: "grid", gap: 12, background: "#0d1420", border: "1px solid #24314a", borderRadius: 10, padding: 16 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ color: "#e5e7eb", fontWeight: 800 }}>Run results</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <button onClick={exportResult} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>Export JSON</button>
              {exportUrl && <a href={exportUrl} download="attribution-result.json" style={{ color: "#22c55e", textDecoration: "underline", fontSize: 13 }}>Download</a>}
              <span style={{ color: "#9ca3af", fontSize: 12 }}>Journeys {journeyDepth === 0 ? "off" : `depth ${journeyDepth}`}</span>
            </div>
          </div>
          {result.insights && (
            <div>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>AI Insights</div>
              <div style={{ whiteSpace: "pre-wrap", color: "#dbeafe" }}>{result.insights}</div>
            </div>
          )}
          {result.performance && (
            <div>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Performance by Channel</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid #24314a" }}>
                    <th style={{ padding: "6px 4px" }}>Channel</th>
                    <th style={{ padding: "6px 4px" }}>Revenue</th>
                    <th style={{ padding: "6px 4px" }}>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.performance).map(([channel, stats]) => (
                    <tr key={channel} style={{ borderBottom: "1px solid #1a2538" }}>
                      <td style={{ padding: "6px 4px" }}>{channel}</td>
                      <td style={{ padding: "6px 4px" }}>${stats.revenue.toFixed(2)}</td>
                      <td style={{ padding: "6px 4px" }}>{stats.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {result.result && (
            <div>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Attribution Result</div>
              <pre style={{ background: "#0a101b", border: "1px solid #24314a", borderRadius: 8, padding: 12, color: "#dbeafe", maxHeight: 260, overflow: "auto" }}>
                {JSON.stringify(result.result, null, 2)}
              </pre>
            </div>
          )}
          {result.journeys && (
            <div>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Journeys</div>
              <pre style={{ background: "#0a101b", border: "1px solid #24314a", borderRadius: 8, padding: 12, color: "#dbeafe", maxHeight: 260, overflow: "auto" }}>
                {JSON.stringify(result.journeys, null, 2)}
              </pre>
            </div>
          )}
          {result.cohorts && (
            <div>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Cohorts</div>
              <pre style={{ background: "#0a101b", border: "1px solid #24314a", borderRadius: 8, padding: 12, color: "#dbeafe", maxHeight: 200, overflow: "auto" }}>
                {JSON.stringify(result.cohorts, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
