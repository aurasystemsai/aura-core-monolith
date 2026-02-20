
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
  const [dateRange, setDateRange] = useState("30d");
  const [comparePrev, setComparePrev] = useState(true);
  const [segment, setSegment] = useState("");
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState("");
  const [alertChannel, setAlertChannel] = useState("inapp");
  const [alertTarget, setAlertTarget] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("");
  const [topN, setTopN] = useState("5");
  const [charts, setCharts] = useState([]);
  const [savedViews, setSavedViews] = useState([]);
  const [serverSchedules, setServerSchedules] = useState([]);
  const [serverViewsStatus, setServerViewsStatus] = useState(null);
  const [serverSchedStatus, setServerSchedStatus] = useState(null);
  const [validation, setValidation] = useState(null);
  const [history, setHistory] = useState([]);
  const [shareUrl, setShareUrl] = useState(null);
  const [metricGuardrail, setMetricGuardrail] = useState({ status: "ok", msg: "" });
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [chartPreview, setChartPreview] = useState(null);
  const [runStatus, setRunStatus] = useState(null);
  const [insights, setInsights] = useState([]);
  const [backendError, setBackendError] = useState(null);
  const [backendMeta, setBackendMeta] = useState(null);
  const [exportJobId, setExportJobId] = useState(null);
  const [exportStatus, setExportStatus] = useState(null);
  const [exportDownloadUrl, setExportDownloadUrl] = useState(null);
  const [alertHistory, setAlertHistory] = useState([]);
  const devSandbox = env === "dev";
  const storageKey = "self-service-analytics";

  const datasets = [
    { key: "orders", label: "Orders", fields: ["gmv", "aov", "channel", "geo", "referrer_domain", "landing_path", "customer_type", "payment_gateway", "discount_code", "repeat_rate", "gross_to_net"] },
    { key: "traffic", label: "Traffic", fields: ["sessions", "device", "campaign"] },
    { key: "email", label: "Email", fields: ["sends", "opens", "ctr", "template"] },
  ];

  const presets = [
    { label: "GMV by referrer (30d)", metric: "gmv", dimension: "referrer_domain", range: "30d" },
    { label: "Refund rate by country (30d)", metric: "refunds", dimension: "country", range: "30d" },
    { label: "Repeat rate by channel (30d)", metric: "repeat_rate", dimension: "channel", range: "30d" },
    { label: "Gross→Net by payment (30d)", metric: "gross_to_net", dimension: "payment_gateway", range: "30d" },
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
  const generateChartData = (metricName, dimensionName, qText, selectedDataset, rangeKey, compare) => {
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
    if (rangeKey === "7d") n = Math.min(n, 7);
    if (rangeKey === "14d") n = Math.min(Math.max(n, 7), 14);
    if (rangeKey === "30d") n = Math.min(Math.max(n, 10), 30);
    for (let i = 0; i < n; i++) {
      labels.push(`${dimensionUsed}-${i + 1}`);
      data.push(Math.round(100 + Math.random() * 900));
    }
    const limited = Number(topN) > 0 ? data.slice(0, Math.min(Number(topN), data.length)) : data;
    const limitedLabels = Number(topN) > 0 ? labels.slice(0, limited.length) : labels;
    const total = limited.reduce((a, b) => a + b, 0);
    const avg = Math.round(total / data.length);
    const max = Math.max(...limited);
    let prevTotal = null;
    let delta = null;
    if (compare) {
      const prev = data.map(v => Math.round(v * (0.75 + Math.random() * 0.2)));
      prevTotal = prev.reduce((a, b) => a + b, 0);
      delta = prevTotal === 0 ? null : Math.round(((total - prevTotal) / prevTotal) * 100);
    }
    const table = limitedLabels.map((label, idx) => ({ label, value: limited[idx], metric: metricUsed, dimension: dimensionUsed }));
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
        prevTotal,
        delta,
      },
      table,
      meta: { metricUsed, dimensionUsed, dataset: selectedDataset, rangeKey }
    };
  };

  const runQuery = async () => {
    if (devSandbox) {
      setValidation({ status: "error", issues: ["Dev sandbox blocks live queries. Switch to Stage/Prod."] });
      return;
    }
    if (!validateQuery()) return;
    setRunStatus("running");
    setBackendError(null);
    setBackendMeta(null);
    const payload = {
      dataset,
      metric,
      dimension,
      query,
      dateRange,
      comparePrev,
      segment,
      channel: channelFilter,
      campaign: campaignFilter,
      topN,
      schedule,
      sources,
      alertChannel,
      alertTarget,
    };
    let sim = null;
    let usedRows = Math.round(100 + Math.random() * 900);
    try {
      const res = await fetch("/api/analytics/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      const data = await res.json();
      if (data?.chart && data?.kpis) {
        sim = data;
        usedRows = data.rows ?? usedRows;
        setBackendMeta({ cached: !!data.cached, meta: data.meta, tokenSource: data.tokenSource, code: data.code, error: data.error, status: data.status });
        if (data.error) setBackendError(data.error);
        if (data.code === 'range_too_large') setBackendError(`Date range too large. Max 180 days.`);
      }
    } catch (err) {
      setBackendError("Backend unavailable, using simulated data.");
    }
    if (!sim) {
      sim = generateChartData(metric, dimension, query, dataset, dateRange, comparePrev);
    }
    const result = {
      id: Date.now(),
      query,
      dataset,
      rows: usedRows,
      generatedAt: Date.now(),
      metric,
      dimension,
      dateRange,
      comparePrev,
      segment,
      channel: channelFilter,
      campaign: campaignFilter,
      topN,
    };
    setCharts(prev => [result, ...prev].slice(0, 5));
    setHistory(h => [{ summary: `Ran ${metric} by ${dimension} on ${dataset}`, at: Date.now(), env, query, dateRange, comparePrev }, ...h].slice(0, 8));
    setChartPreview(sim);
    setInsights([
      `Top ${dimension}: ${sim.table?.[0]?.label ?? "n/a"}`,
      sim.kpis?.delta !== null && sim.kpis?.delta !== undefined ? `WoW change: ${sim.kpis.delta}%` : "WoW change: n/a",
      `Segment filter: ${segment || "none"}`,
      channelFilter ? `Channel filter: ${channelFilter}` : null,
      campaignFilter ? `Campaign filter: ${campaignFilter}` : null,
    ].filter(Boolean));
    setRunStatus("success");
    setTimeout(() => setRunStatus(null), 2500);
  };

  const saveView = () => {
    const view = { id: Date.now(), query, dataset, metric, dimension, schedule, dateRange, comparePrev, segment, alertEnabled, alertThreshold, alertChannel, alertTarget, savedAt: Date.now() };
    setSavedViews(v => [view, ...v].slice(0, 6));
    fetch('/api/analytics/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: query.slice(0, 64) || 'Saved view', payload: view, visibility: 'private' })
    }).catch(() => {});
  };

  const deleteView = (id) => {
    setSavedViews(v => v.filter(x => x.id !== id));
    fetch(`/api/analytics/views/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  const saveSchedule = () => {
    if ((alertChannel === 'email' || alertChannel === 'webhook') && !alertTarget.trim()) {
      setValidation({ status: 'error', issues: [`Target required for ${alertChannel} alerts`] });
      return;
    }
    const payload = { dataset, metric, dimension, query, dateRange, comparePrev, segment, channel: channelFilter, campaign: campaignFilter, topN, alertEnabled, alertThreshold };
    fetch('/api/analytics/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: query.slice(0, 64) || 'Schedule', payload, cadence: schedule === 'weekly' ? 'weekly' : schedule === 'daily' ? 'daily' : 'daily', channel: alertChannel, target: alertTarget.trim() || null })
    }).then(async res => {
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      if (data?.ok && data.schedule) setServerSchedules(s => [data.schedule, ...s]);
      setServerSchedStatus('live');
    }).catch(err => setServerSchedStatus(`save failed: ${err.message}`));
  };

  const deleteSchedule = (id) => {
    setServerSchedules(s => s.filter(x => x.id !== id));
    fetch(`/api/analytics/schedules/${id}`, { method: 'DELETE' }).catch(() => {});
  };

  const runScheduleNow = async (sched) => {
    const res = await fetch('/api/analytics/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sched.payload || {})
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.chart && data?.kpis) {
        setChartPreview(data);
        setBackendMeta({ cached: !!data.cached, meta: data.meta, tokenSource: data.tokenSource, code: data.code, error: data.error, status: data.status });
      }
    }
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
        setDateRange(parsed.dateRange || "30d");
        setComparePrev(parsed.comparePrev ?? true);
        setSegment(parsed.segment || "");
        setAlertEnabled(parsed.alertEnabled || false);
        setAlertThreshold(parsed.alertThreshold || "");
        setAlertChannel(parsed.alertChannel || "inapp");
        setAlertTarget(parsed.alertTarget || "");
      }
    } catch (e) {
      /* ignore */
    }
      // fetch persisted views/schedules from backend
      const fetchViews = async () => {
        try {
          const res = await fetch('/api/analytics/views');
          if (!res.ok) throw new Error(`views ${res.status}`);
          const data = await res.json();
          if (data?.ok && Array.isArray(data.views)) {
            setSavedViews(data.views.map(v => ({ ...v.payload, id: v.id, savedAt: v.savedAt, name: v.name })));
            setServerViewsStatus('live');
          }
        } catch (err) {
          setServerViewsStatus(`fallback: ${err.message}`);
        }
      };
      const fetchSchedules = async () => {
        try {
          const res = await fetch('/api/analytics/schedules');
          if (!res.ok) throw new Error(`schedules ${res.status}`);
          const data = await res.json();
          if (data?.ok && Array.isArray(data.schedules)) {
            setServerSchedules(data.schedules);
            setServerSchedStatus('live');
          }
        } catch (err) {
          setServerSchedStatus(`fallback: ${err.message}`);
        }
      };
      const fetchAlerts = async () => {
        try {
          const res = await fetch('/api/analytics/alerts/history');
          if (!res.ok) throw new Error(`alerts ${res.status}`);
          const data = await res.json();
          if (data?.ok && Array.isArray(data.history)) setAlertHistory(data.history.slice(0, 5));
        } catch (_err) {
          /* ignore */
        }
      };
      fetchViews();
      fetchSchedules();
      fetchAlerts();
  }, []);

  useEffect(() => {
    const payload = { charts, savedViews, history, env, query, dataset, metric, dimension, schedule, sources, dateRange, comparePrev, segment, alertEnabled, alertThreshold, alertChannel, alertTarget, channelFilter, campaignFilter, topN };
    try {
      localStorage.setItem(storageKey, JSON.stringify(payload));
      setDraftSavedAt(Date.now());
    } catch (e) {
      /* ignore */
    }
  }, [charts, savedViews, history, env, query, dataset, metric, dimension, schedule, sources, dateRange, comparePrev, segment, alertEnabled, alertThreshold, channelFilter, campaignFilter, topN]);

  const currentFields = datasets.find(d => d.key === dataset)?.fields || [];

  const startAsyncExport = async () => {
    setExportStatus('starting');
    setExportDownloadUrl(null);
    try {
      const payload = { dataset, metric, dimension, query, dateRange, comparePrev, segment, channel: channelFilter, campaign: campaignFilter, topN, alertEnabled, alertThreshold };
      const res = await fetch('/api/analytics/export/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`export ${res.status}`);
      const data = await res.json();
      if (data?.ok && data.job?.id) {
        setExportJobId(data.job.id);
        setExportStatus('queued');
        pollExportJob(data.job.id, 0);
      } else {
        throw new Error('invalid export response');
      }
    } catch (err) {
      setExportStatus(`error: ${err.message}`);
    }
  };

  const pollExportJob = async (jobId, attempt = 0) => {
    if (!jobId) return;
    try {
      const res = await fetch(`/api/analytics/export/jobs/${jobId}`);
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = await res.json();
      const status = data?.job?.status || 'unknown';
      setExportStatus(status);
      if (status === 'done') {
        setExportDownloadUrl(`/api/analytics/export/jobs/${jobId}/download`);
        return;
      }
      if (status === 'error') return;
      setTimeout(() => pollExportJob(jobId, attempt + 1), Math.min(4000, 500 + attempt * 250));
    } catch (err) {
      setExportStatus(`error: ${err.message}`);
    }
  };

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
          <label>Date Range</label><br />
          <select value={dateRange} onChange={e => setDateRange(e.target.value)}>
            <option value="7d">Last 7d</option>
            <option value="14d">Last 14d</option>
            <option value="30d">Last 30d</option>
          </select>
        </div>
        <div>
          <label>Compare</label><br />
          <label style={{ fontSize: 12 }}>
            <input type="checkbox" checked={comparePrev} onChange={e => setComparePrev(e.target.checked)} /> WoW/prev period
          </label>
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
        <button onClick={saveSchedule} style={{ marginLeft: 4 }}>Save Schedule</button>
        <button onClick={share} style={{ marginLeft: 4 }}>Share</button>
      </div>

      <div style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {templates.map(t => (
          <button key={t.label} style={{ fontSize: 12 }} onClick={() => { setMetric(t.metric); setDimension(t.dimension); setQuery(t.query); setDataset(t.metric === "ctr" ? "email" : dataset); }}>
            {t.label}
          </button>
        ))}
        {presets.map(p => (
          <button key={p.label} style={{ fontSize: 12 }} onClick={() => { setMetric(p.metric); setDimension(p.dimension); setDateRange(p.range); setDataset("orders"); setQuery(`sum(${p.metric}) by ${p.dimension} last ${p.range.replace('d','')}`); }}>
            {p.label}
          </button>
        ))}
        <div style={{ fontSize: 12, color: "#64748b" }}>Sources: <input value={sources} onChange={e => setSources(e.target.value)} style={{ width: 160 }} /></div>
        <div style={{ fontSize: 12, color: "#64748b" }}>Segment: <input value={segment} onChange={e => setSegment(e.target.value)} style={{ width: 140 }} placeholder="e.g. US, Paid" /></div>
        <div style={{ fontSize: 12, color: "#64748b" }}>
          Alerts: <input type="checkbox" checked={alertEnabled} onChange={e => setAlertEnabled(e.target.checked)} />
          <input
            value={alertThreshold}
            onChange={e => setAlertThreshold(e.target.value)}
            style={{ width: 90, marginLeft: 6 }}
            placeholder="> 5000"
            disabled={!alertEnabled}
          />
          <select
            value={alertChannel}
            onChange={e => setAlertChannel(e.target.value)}
            style={{ marginLeft: 6 }}
            disabled={!alertEnabled}
          >
            <option value="inapp">In-app</option>
            <option value="email">Email</option>
            <option value="webhook">Webhook</option>
          </select>
          <input
            value={alertTarget}
            onChange={e => setAlertTarget(e.target.value)}
            style={{ width: 160, marginLeft: 6 }}
            placeholder={alertChannel === 'webhook' ? 'https://example.com/hook' : 'alerts@example.com'}
            disabled={!alertEnabled || alertChannel === 'inapp'}
          />
        </div>
        <div style={{ fontSize: 12, color: "#64748b" }}>Channel: <input value={channelFilter} onChange={e => setChannelFilter(e.target.value)} style={{ width: 110 }} placeholder="e.g. Paid" /></div>
        <div style={{ fontSize: 12, color: "#64748b" }}>Campaign: <input value={campaignFilter} onChange={e => setCampaignFilter(e.target.value)} style={{ width: 130 }} placeholder="e.g. BF2025" /></div>
        <div style={{ fontSize: 12, color: "#64748b" }}>Top N: <input value={topN} onChange={e => setTopN(e.target.value)} style={{ width: 60 }} placeholder="5" /></div>
      </div>

      {validation && validation.status !== "ok" && (
        <div className={`validation ${validation.status}`} style={{ color: validation.status === "error" ? "#dc2626" : "#eab308", marginBottom: 8 }}>{validation.issues.join(", ")}</div>
      )}
      {metricGuardrail.status !== "ok" && (
        <div className="guardrail warn" style={{ color: "#eab308", marginBottom: 8 }}>{metricGuardrail.msg}</div>
      )}
      {backendError && (
        <div style={{ color: "#dc2626", marginBottom: 8, fontSize: 13 }}>{backendError}</div>
      )}
      {backendMeta && (
        <div style={{ color: "#0ea5e9", marginBottom: 8, fontSize: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <span>Backend: {backendMeta.code ? backendMeta.code : 'ok'}{backendMeta.status ? ` (${backendMeta.status})` : ''}</span>
          {backendMeta.tokenSource && <span>Token: {backendMeta.tokenSource}</span>}
          {backendMeta.cached && <span style={{ color: '#22c55e' }}>cached</span>}
          {backendMeta.meta?.callLimit && <span>rate: {backendMeta.meta.callLimit}</span>}
        </div>
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
          {comparePrev && chartPreview.kpis?.delta !== null && chartPreview.kpis?.delta !== undefined && (
            <div style={{ background: "#eef2ff", border: "1px solid #e0e7ff", borderRadius: 8, padding: 12, minWidth: 140 }}>
              <div style={{ fontSize: 12, color: "#6366f1" }}>Δ vs prev</div>
              <div style={{ fontWeight: 800, fontSize: 20 }}>{chartPreview.kpis.delta}%</div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>Prev: {chartPreview.kpis.prevTotal ?? "n/a"}</div>
            </div>
          )}
        </div>
      )}

      {/* Chart/Table Preview */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ marginBottom: 4 }}>Preview</h4>
        {chartPreview ? (
          <div style={{ background: "#f8fafc", borderRadius: 8, padding: 16, maxWidth: 700 }}>
            <Line data={chartPreview.chart} />
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
            <div
              key={c.id}
              className="chart-result"
              style={{
                background: "#111111",
                border: "1px solid #1a1a1a",
                color: "#f0f0f0",
                borderRadius: 6,
                padding: 10,
                marginBottom: 8,
                boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
              }}
            >
              <div><b>Query:</b> {c.query}</div>
              <div><b>Dataset:</b> {c.dataset}</div>
              <div><b>Metric/Dim:</b> {c.metric} / {c.dimension}</div>
              <div><b>Date Range:</b> {c.dateRange || ""} {c.comparePrev ? "(compare prev)" : ""}</div>
              {c.segment && <div><b>Segment:</b> {c.segment}</div>}
              <div><b>Rows:</b> {c.rows}</div>
              <div><b>Generated:</b> {new Date(c.generatedAt).toLocaleString()}</div>
              <button style={{ marginTop: 4, fontSize: 12 }} onClick={() => setChartPreview(generateChartData(c.metric, c.dimension, c.query, c.dataset, c.dateRange, c.comparePrev))}>Preview</button>
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <h4>Saved Views</h4>
          {serverViewsStatus && <div style={{ fontSize: 12, color: "#94a3b8" }}>Views: {serverViewsStatus}</div>}
          {savedViews.length === 0 && <div style={{ color: "#64748b" }}>No saved views.</div>}
          {savedViews.map(v => (
            <div
              key={v.id}
              className="saved-view"
              style={{
                background: "#111111",
                border: "1px solid #1a1a1a",
                color: "#f0f0f0",
                borderRadius: 6,
                padding: 10,
                marginBottom: 8,
                boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
              }}
            >
              <div><b>Query:</b> {v.query}</div>
              <div><b>Dataset:</b> {v.dataset}</div>
              <div><b>Metric/Dim:</b> {v.metric} / {v.dimension}</div>
              <div><b>Date Range:</b> {v.dateRange || ""} {v.comparePrev ? "(compare prev)" : ""}</div>
              {v.segment && <div><b>Segment:</b> {v.segment}</div>}
              <div><b>Schedule:</b> {v.schedule}</div>
              {v.alertEnabled && (
                <div><b>Alert:</b> {v.alertThreshold || "set threshold"} • {v.alertChannel || 'inapp'} {v.alertTarget ? `→ ${v.alertTarget}` : ''}</div>
              )}
              <div><b>Saved:</b> {new Date(v.savedAt).toLocaleString()}</div>
              <button
                style={{ marginTop: 4, fontSize: 12 }}
                onClick={() => {
                  setQuery(v.query);
                  setDataset(v.dataset);
                  setMetric(v.metric);
                  setDimension(v.dimension);
                  setSchedule(v.schedule || "manual");
                  setDateRange(v.dateRange || "30d");
                  setComparePrev(v.comparePrev ?? true);
                  setSegment(v.segment || "");
                  setAlertEnabled(v.alertEnabled || false);
                  setAlertThreshold(v.alertThreshold || "");
                  setAlertChannel(v.alertChannel || "inapp");
                  setAlertTarget(v.alertTarget || "");
                  const sim = generateChartData(v.metric, v.dimension, v.query, v.dataset, v.dateRange, v.comparePrev);
                  setChartPreview(sim);
                }}
              >Load</button>
              <button style={{ marginLeft: 6, fontSize: 12 }} onClick={() => deleteView(v.id)}>Delete</button>
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <h4>Schedules</h4>
          {serverSchedStatus && <div style={{ fontSize: 12, color: "#94a3b8" }}>Schedules: {serverSchedStatus}</div>}
          {serverSchedules.length === 0 && <div style={{ color: "#64748b" }}>No schedules.</div>}
          {serverSchedules.map(s => (
            <div
              key={s.id}
              className="schedule"
              style={{
                background: "#111111",
                border: "1px solid #1a1a1a",
                color: "#f0f0f0",
                borderRadius: 6,
                padding: 10,
                marginBottom: 8,
                boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
              }}
            >
              <div><b>Name:</b> {s.name}</div>
              <div><b>Cadence:</b> {s.cadence}</div>
              <div><b>Status:</b> {s.paused ? 'paused' : (s.lastStatus || 'pending')}</div>
              <div><b>Channel:</b> {s.channel || 'inapp'} {s.target ? `→ ${s.target}` : ''}</div>
              {s.lastDeliveryStatus && <div style={{ fontSize: 12, color: s.lastDeliveryStatus === 'sent' ? '#16a34a' : '#dc2626' }}>Alert delivery: {s.lastDeliveryStatus}{s.lastDeliveryAt ? ` (${new Date(s.lastDeliveryAt).toLocaleString()})` : ''}{s.lastDeliveryError ? ` — ${s.lastDeliveryError}` : ''}</div>}
              <div><b>Last Run:</b> {s.lastRunAt ? new Date(s.lastRunAt).toLocaleString() : '—'}</div>
              {s.lastError && <div style={{ color: '#dc2626', fontSize: 12 }}>{s.lastError}</div>}
              <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                <button style={{ fontSize: 12 }} onClick={() => runScheduleNow(s)}>Run now</button>
                {s.paused
                  ? <button style={{ fontSize: 12 }} onClick={() => {
                      fetch(`/api/analytics/schedules/${s.id}/resume`, { method: 'POST' }).then(() => setServerSchedules(arr => arr.map(x => x.id === s.id ? { ...x, paused: false } : x))).catch(() => {});
                    }}>Resume</button>
                  : <button style={{ fontSize: 12 }} onClick={() => {
                      fetch(`/api/analytics/schedules/${s.id}/pause`, { method: 'POST' }).then(() => setServerSchedules(arr => arr.map(x => x.id === s.id ? { ...x, paused: true } : x))).catch(() => {});
                    }}>Pause</button>
                }
                <button style={{ fontSize: 12 }} onClick={() => deleteSchedule(s.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <h4>History</h4>
          {history.length === 0 && <div style={{ color: "#64748b" }}>No history yet.</div>}
            {history.map((h, i) => (
                <div
                  key={i}
                  className="history-item"
                  style={{
                    background: "#111111",
                    border: "1px solid #1a1a1a",
                    color: "#f0f0f0",
                    borderRadius: 6,
                    padding: 10,
                    marginBottom: 8,
                    boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{h.summary}</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{new Date(h.at).toLocaleString()} [{h.env}]</div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>{h.query}</div>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>{h.dateRange || ""} {h.comparePrev ? "(compare prev)" : ""}</div>
            </div>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <h4>Alert History</h4>
          {alertHistory.length === 0 && <div style={{ color: '#64748b' }}>No alerts yet.</div>}
          {alertHistory.map((h, i) => (
            <div
              key={i}
              className="alert-item"
              style={{
                background: "#1a1a1a",
                border: "1px solid #eab308",
                color: "#fef08a",
                borderRadius: 6,
                padding: 10,
                marginBottom: 8,
                boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
              }}
            >
              <div style={{ fontWeight: 700 }}>{h.message}</div>
              <div style={{ fontSize: 12, color: '#854d0e' }}>{new Date(h.triggeredAt).toLocaleString()} • {h.channel || 'inapp'} {h.target ? `→ ${h.target}` : ''}</div>
              <div style={{ fontSize: 12, color: '#92400e' }}>Value: {h.value} Threshold: {h.threshold}</div>
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
              if (chartPreview && Array.isArray(chartPreview.chart?.labels)) labels = chartPreview.chart.labels;
              if (chartPreview && Array.isArray(chartPreview.chart?.datasets)) datasets = chartPreview.chart.datasets;
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
          <button style={{ marginLeft: 8 }} onClick={startAsyncExport}>Export (async)</button>
          {exportStatus && <div style={{ marginTop: 6, fontSize: 12, color: '#475569' }}>Export status: {exportStatus}</div>}
          {exportDownloadUrl && <div style={{ marginTop: 6 }}><a href={exportDownloadUrl}>Download async CSV</a></div>}
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

      {insights && insights.length > 0 && (
        <div style={{ marginTop: 16, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Insights</div>
          <ul style={{ margin: 0, paddingLeft: 16, color: "#475569", fontSize: 14 }}>
            {insights.map((ins, idx) => <li key={idx}>{ins}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}


