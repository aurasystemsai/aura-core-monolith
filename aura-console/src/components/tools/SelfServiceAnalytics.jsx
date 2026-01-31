
import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import Chart from "chart.js/auto";

export default function SelfServiceAnalytics() {
  const [env, setEnv] = useState("dev");
  const [dataset, setDataset] = useState("orders");
  const [query, setQuery] = useState("sum(gmv) by channel last 30d");
  const [charts, setCharts] = useState([]);
  const [savedViews, setSavedViews] = useState([]);
  const [validation, setValidation] = useState(null);
  const [history, setHistory] = useState([]);
  const [shareUrl, setShareUrl] = useState(null);
  const [metricGuardrail, setMetricGuardrail] = useState({ status: "ok", msg: "" });
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [chartPreview, setChartPreview] = useState(null);
  const devSandbox = env === "dev";
  const storageKey = "self-service-analytics";

  const datasets = [
    { key: "orders", label: "Orders", fields: ["gmv", "aov", "channel", "geo"] },
    { key: "traffic", label: "Traffic", fields: ["sessions", "device", "campaign"] },
    { key: "email", label: "Email", fields: ["sends", "opens", "ctr", "template"] },
  ];

  const validateQuery = () => {
    if (!query.trim()) {
      setValidation({ status: "error", issues: ["Query cannot be empty"] });
      return (
        <div className="aura-card" style={{ padding: 24, background: "#0b1221", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h2 style={{ margin: 0 }}>Self-Service Analytics</h2>
              <div style={{ color: "#9ca3af", fontSize: 13 }}>Build quick queries, validate metrics, and share lightweight charts.</div>
            </div>
            <select value={env} onChange={e => setEnv(e.target.value)} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "8px 10px", fontWeight: 700 }}>
              <option value="dev">Dev</option>
              <option value="stage">Stage</option>
              <option value="prod">Prod</option>
            </select>
          </div>
          {/* ...existing code... */}
          <div style={{ marginTop: 12, color: "#9ca3af", fontSize: 12 }}>
            Draft autosaved {draftSavedAt ? new Date(draftSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}. {shareUrl && <a href={shareUrl} download="self-service-analytics.json" style={{ color: "#0ea5e9", marginLeft: 8 }}>Download share</a>}
          </div>
        </div>
      );
    }
    let dimension = "channel";
    let n = 7;
    const m = query.match(/sum\((\w+)\) by (\w+) last (\d+)/);
    if (m) {
      metric = m[1];
      dimension = m[2];
      n = parseInt(m[3], 10) || 7;
    }
    for (let i = 0; i < n; i++) {
      labels.push(`${dimension}-${i + 1}`);
      data.push(Math.round(100 + Math.random() * 900));
    }
    return {
      labels,
      datasets: [
        {
          label: `${metric} by ${dimension}`,
          data,
          borderColor: "#0ea5e9",
          backgroundColor: "rgba(14,165,233,0.2)",
        },
      ],
    };
  };

  const runQuery = () => {
    if (devSandbox) {
      setValidation({ status: "error", issues: ["Dev sandbox blocks live queries. Switch to Stage/Prod."] });
      return;
    }
    if (!validateQuery()) return;
    const result = {
      id: Date.now(),
      query,
      dataset,
      rows: Math.round(100 + Math.random() * 900),
      generatedAt: Date.now(),
    };
    setCharts(prev => [result, ...prev].slice(0, 5));
    setHistory(h => [{ summary: `Ran query on ${dataset}`, at: Date.now(), env }, ...h].slice(0, 6));
    setChartPreview(generateChartData(query, dataset));
  };

  const saveView = () => {
    const view = { id: Date.now(), query, dataset, savedAt: Date.now() };
    setSavedViews(v => [view, ...v].slice(0, 6));
  };

  const share = () => {
    const blob = new Blob([JSON.stringify({ query, dataset }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setShareUrl(url);
    setTimeout(() => URL.revokeObjectURL(url), 20000);
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setCharts(parsed.charts || []);
        setSavedViews(parsed.savedViews || []);
        setHistory(parsed.history || []);
        setEnv(parsed.env || "dev");
        setQuery(parsed.query || query);
        setDataset(parsed.dataset || dataset);
      }
    } catch (e) {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const payload = { charts, savedViews, history, env, query, dataset };
    try {
      localStorage.setItem(storageKey, JSON.stringify(payload));
      setDraftSavedAt(Date.now());
    } catch (e) {
      /* ignore */
    }
  }, [charts, savedViews, history, env, query, dataset]);

  return (
    <div className="aura-card" style={{ padding: 24, background: "#0b1221", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0 }}>Self-Service Analytics</h2>
          <div style={{ color: "#9ca3af", fontSize: 13 }}>Build quick queries, validate metrics, and share lightweight charts.</div>
        </div>
        <select value={env} onChange={e => setEnv(e.target.value)} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "8px 10px", fontWeight: 700 }}>
          <option value="dev">Dev</option>
          <option value="stage">Stage</option>
          <option value="prod">Prod</option>
        </select>
      </div>

      {devSandbox && <div style={{ background: "#1f2937", border: "1px solid #334155", color: "#fbbf24", padding: 10, borderRadius: 10, marginTop: 10 }}>Sandbox mode: executions are blocked.</div>}

      <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <select value={dataset} onChange={e => { setDataset(e.target.value); validateQuery(); }} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "8px 10px", fontWeight: 700 }}>
            {datasets.map(ds => <option key={ds.key} value={ds.key}>{ds.label}</option>)}
          </select>
          <input value={query} onChange={e => setQuery(e.target.value)} style={{ flex: 1, minWidth: 240, background: "#0d1420", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "10px 12px", fontFamily: "monospace" }} />
          <button className="aura-btn" onClick={runQuery}>Run</button>
          <button className="aura-btn" style={{ background: "#1f2937", color: "#e5e7eb", border: "1px solid #334155" }} onClick={saveView}>Save view</button>
          <button className="aura-btn" style={{ background: "#0ea5e9", color: "#fff" }} onClick={share}>Share</button>
        </div>
        {validation && (
          <div style={{ background: validation.status === "ok" ? "#0d172a" : validation.status === "warn" ? "#1f2937" : "#3b1d1d", border: "1px solid #1f2937", borderRadius: 10, padding: 10 }}>
            <div style={{ fontWeight: 700, color: validation.status === "ok" ? "#22c55e" : validation.status === "warn" ? "#fbbf24" : "#fca5a5" }}>
              {validation.status === "ok" ? "Valid" : validation.status === "warn" ? "Warnings" : "Errors"}
            </div>
            {validation.issues && validation.issues.length > 0 && (
              <ul style={{ margin: 6, paddingLeft: 16, color: validation.status === "warn" ? "#fbbf24" : "#fca5a5", fontSize: 13 }}>
                {validation.issues.map((iss, idx) => <li key={idx}>{iss}</li>)}
              </ul>
            )}
            <button
              onClick={() => {
                let labels = [];
                let datasets = [];
                if (chartPreview && Array.isArray(chartPreview.labels)) labels = chartPreview.labels;
                if (chartPreview && Array.isArray(chartPreview.datasets)) datasets = chartPreview.datasets;
                const csvRows = [];
                csvRows.push(["Label", ...labels]);
                datasets.forEach(ds => {
                  csvRows.push([ds.label, ...(Array.isArray(ds.data) ? ds.data : [])]);
                });
                const csv = csvRows.map(row => row.join(",")).join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "analytics-export.csv";
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 20000);
              }}
              disabled={!chartPreview || !chartPreview.labels || !chartPreview.datasets}
              style={{ marginTop: 8 }}
            >Export CSV</button>
          </div>
        )}
      </div>

      {savedViews.length > 0 && (
        <div style={{ marginTop: 16, background: "#0d1420", border: "1px solid #1f2937", borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Saved views</div>
          <ul style={{ margin: 0, paddingLeft: 16, color: "#9ca3af" }}>
            {savedViews.map(view => (
              <li key={view.id}>
                {view.query} ({view.dataset}) — {new Date(view.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </li>
            ))}
          </ul>
        </div>
      )}

      {history.length > 0 && (
        <div style={{ marginTop: 16, background: "#0d1420", border: "1px solid #1f2937", borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Activity</div>
          <div style={{ display: "grid", gap: 6 }}>
            {history.slice(0, 5).map((h, idx) => (
              <div key={idx} style={{ background: "#111827", borderRadius: 8, padding: 10, border: "1px solid #1f2937", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: "#e5e7eb", fontWeight: 700 }}>{h.summary}</div>
                  <div style={{ color: "#9ca3af", fontSize: 12 }}>{new Date(h.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {h.env}</div>
                </div>
                <button className="aura-btn" style={{ background: "#1f2937", color: "#e5e7eb", border: "1px solid #334155" }} onClick={() => setQuery(h.summary)}>Reuse query</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 12, color: "#9ca3af", fontSize: 12 }}>
        Draft autosaved {draftSavedAt ? new Date(draftSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}. {shareUrl && <a href={shareUrl} download="self-service-analytics.json" style={{ color: "#0ea5e9", marginLeft: 8 }}>Download share</a>}
      </div>
    </div>
  );
}
