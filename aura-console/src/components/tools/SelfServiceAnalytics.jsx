
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
    <div className="tool self-service-analytics" style={{ maxWidth: 900, margin: "0 auto", padding: 24 }}>
      <h2 style={{ marginBottom: 8 }}>Self-Service Analytics</h2>
      <div style={{ display: "flex", gap: 24, alignItems: "center", marginBottom: 16 }}>
        <div>
          <label>Environment: </label>
          <select value={env} onChange={e => setEnv(e.target.value)}>
            <option value="dev">Dev</option>
            <option value="stage">Stage</option>
            <option value="prod">Prod</option>
          </select>
        </div>
        <div>
          <label>Dataset: </label>
          <select value={dataset} onChange={e => setDataset(e.target.value)}>
            {datasets.map(ds => (
              <option key={ds.key} value={ds.key}>{ds.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Query: </label>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ width: 320 }}
            placeholder="e.g. sum(gmv) by channel last 30d"
          />
        </div>
        <button onClick={runQuery} style={{ background: "#0ea5e9", color: "white", border: 0, padding: "6px 16px", borderRadius: 4 }}>Run</button>
        <button onClick={saveView} style={{ marginLeft: 4 }}>Save View</button>
        <button onClick={share} style={{ marginLeft: 4 }}>Share</button>
      </div>

      {validation && validation.status !== "ok" && (
        <div className={`validation ${validation.status}`} style={{ color: validation.status === "error" ? "#dc2626" : "#eab308", marginBottom: 8 }}>{validation.issues.join(", ")}</div>
      )}
      {metricGuardrail.status !== "ok" && (
        <div className="guardrail warn" style={{ color: "#eab308", marginBottom: 8 }}>{metricGuardrail.msg}</div>
      )}
      {shareUrl && (
        <div className="share-link" style={{ marginBottom: 8 }}>
          <a href={shareUrl} download="analytics-query.json">Download Query</a>
        </div>
      )}

      {/* Chart/Table Preview */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ marginBottom: 4 }}>Preview</h4>
        {chartPreview ? (
          <div style={{ background: "#f8fafc", borderRadius: 8, padding: 16, maxWidth: 600 }}>
            <Line data={chartPreview} />
          </div>
        ) : (
          <div style={{ color: "#64748b" }}>No preview yet. Run a query to see results.</div>
        )}
      </div>

      {/* Dashboard Management */}
      <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <h4>Recent Results</h4>
          {charts.length === 0 && <div style={{ color: "#64748b" }}>No results yet.</div>}
          {charts.map(c => (
            <div key={c.id} className="chart-result" style={{ background: "#f1f5f9", borderRadius: 6, padding: 10, marginBottom: 8 }}>
              <div><b>Query:</b> {c.query}</div>
              <div><b>Dataset:</b> {c.dataset}</div>
              <div><b>Rows:</b> {c.rows}</div>
              <div><b>Generated:</b> {new Date(c.generatedAt).toLocaleString()}</div>
              <button style={{ marginTop: 4, fontSize: 12 }} onClick={() => setChartPreview(generateChartData(c.query, c.dataset))}>Preview</button>
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <h4>Saved Views</h4>
          {savedViews.length === 0 && <div style={{ color: "#64748b" }}>No saved views.</div>}
          {savedViews.map(v => (
            <div key={v.id} className="saved-view" style={{ background: "#f1f5f9", borderRadius: 6, padding: 10, marginBottom: 8 }}>
              <div><b>Query:</b> {v.query}</div>
              <div><b>Dataset:</b> {v.dataset}</div>
              <div><b>Saved:</b> {new Date(v.savedAt).toLocaleString()}</div>
              <button style={{ marginTop: 4, fontSize: 12 }} onClick={() => { setQuery(v.query); setDataset(v.dataset); setChartPreview(generateChartData(v.query, v.dataset)); }}>Load</button>
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <h4>History</h4>
          {history.length === 0 && <div style={{ color: "#64748b" }}>No history yet.</div>}
          {history.map((h, i) => (
            <div key={i} className="history-item" style={{ background: "#f1f5f9", borderRadius: 6, padding: 10, marginBottom: 8 }}>
              <span>{h.summary}</span> <span className="at">{new Date(h.at).toLocaleString()}</span> <span className="env">[{h.env}]</span>
            </div>
          ))}
        </div>
      </div>

      {/* Export and Help */}
      <div style={{ marginTop: 32, display: "flex", gap: 32 }}>
        <div style={{ flex: 1 }}>
          <h4>Export</h4>
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
          >Export CSV</button>
        </div>
        <div style={{ flex: 2 }}>
          <h4>How to Use</h4>
          <ul style={{ color: "#64748b", fontSize: 15 }}>
            <li>Choose a dataset and environment.</li>
            <li>Write a query (e.g. <code>sum(gmv) by channel last 30d</code>).</li>
            <li>Click <b>Run</b> to preview results as a chart.</li>
            <li>Save views for later, or export results as CSV.</li>
            <li>Switch between recent results and saved views.</li>
            <li>Share queries with teammates using the Share button.</li>
          </ul>
        </div>
      </div>

      {draftSavedAt && (
        <div className="draft-status" style={{ marginTop: 16, color: "#64748b" }}>Draft auto-saved at {new Date(draftSavedAt).toLocaleTimeString()}</div>
      )}
    </div>
  );
}
