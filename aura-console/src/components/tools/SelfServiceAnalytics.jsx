
import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import Chart from "chart.js/auto";

export default function SelfServiceAnalytics() {
  const [env, setEnv] = useState("dev");
  const [dataset, setDataset] = useState("orders");
  const [metric, setMetric] = useState("gmv");
  const [dimension, setDimension] = useState("channel");
  const [query, setQuery] = useState("sum(gmv) by channel last 30d");
  const [schedule, setSchedule] = useState("manual");
  const [sources, setSources] = useState("Shopify + GA4");
  const [charts, setCharts] = useState([]);
  const [savedViews, setSavedViews] = useState([]);
  const [validation, setValidation] = useState(null);
  const [history, setHistory] = useState([]);
  const [shareUrl, setShareUrl] = useState(null);
  const [metricGuardrail, setMetricGuardrail] = useState({ status: "ok", msg: "" });
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [chartPreview, setChartPreview] = useState(null);
  const [runStatus, setRunStatus] = useState(null);
  const devSandbox = env === "dev";
  const storageKey = "self-service-analytics";

  const datasets = [
    { key: "orders", label: "Orders", fields: ["gmv", "aov", "channel", "geo"] },
    { key: "traffic", label: "Traffic", fields: ["sessions", "device", "campaign"] },
    { key: "email", label: "Email", fields: ["sends", "opens", "ctr", "template"] },
  ];

  const freshness = {
    orders: "Freshness: ~15 min lag (sales events)",
    traffic: "Freshness: ~5 min lag (analytics events)",
    email: "Freshness: ~1 hr lag (ESP sync)",
  };

  const templates = [
    { label: "GMV by channel (30d)", metric: "gmv", dimension: "channel", query: "sum(gmv) by channel last 30d" },
    { label: "Sessions by campaign (14d)", metric: "sessions", dimension: "campaign", query: "sum(sessions) by campaign last 14" },
    { label: "Email CTR by template (7d)", metric: "ctr", dimension: "template", query: "sum(ctr) by template last 7" },
  ];

  const schedules = [
    { key: "manual", label: "Manual" },
    { key: "daily", label: "Daily" },
    { key: "weekly", label: "Weekly" },
  ];

  const validateQuery = () => {
    if (!query.trim()) {
      setValidation({ status: "error", issues: ["Query cannot be empty"] });
      return false;
    }
    const incompatible = query.toLowerCase().includes("ctr") && dataset !== "email";
    if (incompatible) {
      setValidation({ status: "warn", issues: ["CTR metric only available for email dataset"] });
      setMetricGuardrail({ status: "warn", msg: "CTR unsupported for selected dataset" });
    } else {
      setValidation({ status: "ok", issues: [] });
      setMetricGuardrail({ status: "ok", msg: "" });
    }
    return true;
  };

  // Simulate chart + KPIs + table data
  const generateChartData = (metricName, dimensionName, qText, selectedDataset) => {
    let labels = [];
    let data = [];
    let metricUsed = metricName || "gmv";
    let dimensionUsed = dimensionName || "channel";
    let n = 7;
    const m = qText.match(/sum\((\w+)\) by (\w+) last (\d+)/);
    if (m) {
      metricUsed = m[1];
      dimensionUsed = m[2];
      n = parseInt(m[3], 10) || 7;
    }
    for (let i = 0; i < n; i++) {
      labels.push(`${dimensionUsed}-${i + 1}`);
      data.push(Math.round(100 + Math.random() * 900));
    }
    const total = data.reduce((a, b) => a + b, 0);
    const avg = Math.round(total / data.length);
    const max = Math.max(...data);
    const table = labels.map((label, idx) => ({ label, value: data[idx], metric: metricUsed, dimension: dimensionUsed }));
    return {
      chart: {
        labels,
        datasets: [
          {
            label: `${metricUsed} by ${dimensionUsed}`,
            data,
            borderColor: "#0ea5e9",
            backgroundColor: "rgba(14,165,233,0.2)",
          },
        ],
      },
      kpis: {
        total,
        avg,
        max,
      },
      table,
      meta: { metricUsed, dimensionUsed, dataset: selectedDataset }
    };
  };

  const runQuery = () => {
    if (devSandbox) {
      setValidation({ status: "error", issues: ["Dev sandbox blocks live queries. Switch to Stage/Prod."] });
      return;
    }
    if (!validateQuery()) return;
    setRunStatus("running");
    const sim = generateChartData(metric, dimension, query, dataset);
    const result = {
      id: Date.now(),
      query,
      dataset,
      rows: Math.round(100 + Math.random() * 900),
      generatedAt: Date.now(),
      metric,
      dimension,
    };
    setCharts(prev => [result, ...prev].slice(0, 5));
    setHistory(h => [{ summary: `Ran ${metric} by ${dimension} on ${dataset}`, at: Date.now(), env, query }, ...h].slice(0, 8));
    setChartPreview(sim.chart);
    setRunStatus("success");
    setTimeout(() => setRunStatus(null), 2500);
  };

  const saveView = () => {
    const view = { id: Date.now(), query, dataset, metric, dimension, schedule, savedAt: Date.now() };
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
        setMetric(parsed.metric || "gmv");
        setDimension(parsed.dimension || "channel");
        setSchedule(parsed.schedule || "manual");
        setSources(parsed.sources || "Shopify + GA4");
      }
    } catch (e) {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const payload = { charts, savedViews, history, env, query, dataset, metric, dimension, schedule, sources };
    try {
      localStorage.setItem(storageKey, JSON.stringify(payload));
      setDraftSavedAt(Date.now());
    } catch (e) {
      /* ignore */
    }
  }, [charts, savedViews, history, env, query, dataset, metric, dimension, schedule, sources]);

  const currentFields = datasets.find(d => d.key === dataset)?.fields || [];

  return (
    <div className="tool self-service-analytics" style={{ maxWidth: 980, margin: "0 auto", padding: 24 }}>
      <h2 style={{ marginBottom: 8 }}>Self-Service Analytics</h2>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 12 }}>
        <div>
          <label>Environment</label><br />
          <select value={env} onChange={e => setEnv(e.target.value)}>
            <option value="dev">Dev</option>
            <option value="stage">Stage</option>
            <option value="prod">Prod</option>
          </select>
        </div>
        <div>
          <label>Dataset</label><br />
          <select value={dataset} onChange={e => { setDataset(e.target.value); }}>
            {datasets.map(ds => (
              <option key={ds.key} value={ds.key}>{ds.label}</option>
            ))}
          </select>
          <div style={{ fontSize: 12, color: "#64748b" }}>{freshness[dataset]}</div>
        </div>
        <div>
          <label>Metric</label><br />
          <select value={metric} onChange={e => { setMetric(e.target.value); setQuery(`sum(${e.target.value}) by ${dimension} last 30`); }}>
            {currentFields.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label>Dimension</label><br />
          <select value={dimension} onChange={e => { setDimension(e.target.value); setQuery(`sum(${metric}) by ${e.target.value} last 30`); }}>
            {currentFields.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label>Schedule</label><br />
          <select value={schedule} onChange={e => setSchedule(e.target.value)}>
            {schedules.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <label>Query</label><br />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ width: "100%" }}
            placeholder="e.g. sum(gmv) by channel last 30d"
          />
        </div>
        <button onClick={runQuery} style={{ background: "#0ea5e9", color: "white", border: 0, padding: "8px 16px", borderRadius: 4, fontWeight: 700 }}>Run</button>
        <button onClick={saveView} style={{ marginLeft: 4 }}>Save View</button>
        <button onClick={share} style={{ marginLeft: 4 }}>Share</button>
      </div>

      <div style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {templates.map(t => (
          <button key={t.label} style={{ fontSize: 12 }} onClick={() => { setMetric(t.metric); setDimension(t.dimension); setQuery(t.query); setDataset(t.metric === "ctr" ? "email" : dataset); }}>
            {t.label}
          </button>
        ))}
        <div style={{ fontSize: 12, color: "#64748b" }}>Sources: <input value={sources} onChange={e => setSources(e.target.value)} style={{ width: 160 }} /></div>
      </div>

      {validation && validation.status !== "ok" && (
        <div className={`validation ${validation.status}`} style={{ color: validation.status === "error" ? "#dc2626" : "#eab308", marginBottom: 8 }}>{validation.issues.join(", ")}</div>
      )}
      {metricGuardrail.status !== "ok" && (
        <div className="guardrail warn" style={{ color: "#eab308", marginBottom: 8 }}>{metricGuardrail.msg}</div>
      )}
      {runStatus === "running" && <div style={{ color: "#0ea5e9", marginBottom: 6 }}>Running query…</div>}
      {runStatus === "success" && <div style={{ color: "#22c55e", marginBottom: 6 }}>Query complete.</div>}
      {shareUrl && (
        <div className="share-link" style={{ marginBottom: 8 }}>
          <a href={shareUrl} download="analytics-query.json">Download Query</a>
        </div>
      )}

      {/* KPIs */}
      {chartPreview && (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <div style={{ background: "#f0f9ff", border: "1px solid #e0f2fe", borderRadius: 8, padding: 12, minWidth: 140 }}>
            <div style={{ fontSize: 12, color: "#0ea5e9" }}>Total</div>
            <div style={{ fontWeight: 800, fontSize: 20 }}>{chartPreview.kpis?.total ?? "—"}</div>
          </div>
          <div style={{ background: "#f0fdf4", border: "1px solid #dcfce7", borderRadius: 8, padding: 12, minWidth: 140 }}>
            <div style={{ fontSize: 12, color: "#22c55e" }}>Avg</div>
            <div style={{ fontWeight: 800, fontSize: 20 }}>{chartPreview.kpis?.avg ?? "—"}</div>
          </div>
          <div style={{ background: "#fff7ed", border: "1px solid #ffedd5", borderRadius: 8, padding: 12, minWidth: 140 }}>
            <div style={{ fontSize: 12, color: "#fb923c" }}>Max</div>
            <div style={{ fontWeight: 800, fontSize: 20 }}>{chartPreview.kpis?.max ?? "—"}</div>
          </div>
        </div>
      )}

      {/* Chart/Table Preview */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ marginBottom: 4 }}>Preview</h4>
        {chartPreview ? (
          <div style={{ background: "#f8fafc", borderRadius: 8, padding: 16, maxWidth: 700 }}>
            <Line data={chartPreview} />
            {chartPreview.table && (
              <div style={{ marginTop: 12 }}>
                <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>
                      <th>Dimension</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartPreview.table.slice(0, 8).map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #e2e8f0" }}>
                        <td>{row.label}</td>
                        <td>{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
              <div><b>Metric/Dim:</b> {c.metric} / {c.dimension}</div>
              <div><b>Rows:</b> {c.rows}</div>
              <div><b>Generated:</b> {new Date(c.generatedAt).toLocaleString()}</div>
              <button style={{ marginTop: 4, fontSize: 12 }} onClick={() => setChartPreview(generateChartData(c.metric, c.dimension, c.query, c.dataset).chart)}>Preview</button>
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
              <div><b>Metric/Dim:</b> {v.metric} / {v.dimension}</div>
              <div><b>Schedule:</b> {v.schedule}</div>
              <div><b>Saved:</b> {new Date(v.savedAt).toLocaleString()}</div>
              <button
                style={{ marginTop: 4, fontSize: 12 }}
                onClick={() => {
                  setQuery(v.query);
                  setDataset(v.dataset);
                  setMetric(v.metric);
                  setDimension(v.dimension);
                  setSchedule(v.schedule || "manual");
                  const sim = generateChartData(v.metric, v.dimension, v.query, v.dataset);
                  setChartPreview(sim.chart);
                }}
              >Load</button>
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <h4>History</h4>
          {history.length === 0 && <div style={{ color: "#64748b" }}>No history yet.</div>}
          {history.map((h, i) => (
            <div key={i} className="history-item" style={{ background: "#f1f5f9", borderRadius: 6, padding: 10, marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>{h.summary}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{new Date(h.at).toLocaleString()} [{h.env}]</div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>{h.query}</div>
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
            <li>Choose dataset, metric, and dimension.</li>
            <li>Use templates for quick starts, or edit the query directly.</li>
            <li>Click <b>Run</b> to preview chart, KPIs, and table.</li>
            <li>Save views to re-run with one click; history is tracked automatically.</li>
            <li>Export chart data to CSV, or share the query JSON.</li>
          </ul>
        </div>
      </div>

      {draftSavedAt && (
        <div className="draft-status" style={{ marginTop: 16, color: "#64748b" }}>Draft auto-saved at {new Date(draftSavedAt).toLocaleTimeString()}</div>
      )}
    </div>
  );
}
