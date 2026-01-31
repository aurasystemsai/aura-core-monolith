

import React from "react";

// Flagship UI: All features, modern dashboard, segmentation, analytics, kanban, alerts, integrations
export default function AutoInsights() {
  const [env, setEnv] = React.useState("dev");
  const devSandbox = env === "dev";
  const [history, setHistory] = React.useState([]);
  const [syncHealth, setSyncHealth] = React.useState({ status: "healthy", lastSuccess: Date.now(), lastError: null });
  const [error, setError] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [segment, setSegment] = React.useState("Segment");
  const [comparison, setComparison] = React.useState("Enterprise");
  const [shop, setShop] = React.useState("demo-shop.myshopify.com");
  const [metricPreset, setMetricPreset] = React.useState("GMV");
  const [dimension, setDimension] = React.useState("Channel");
  const [freshness, setFreshness] = React.useState({ minutes: 8, sla: 15, status: "healthy" });
  const [incidentMode, setIncidentMode] = React.useState(false);
  const [suppressedAnomalies, setSuppressedAnomalies] = React.useState([]);
  const [scenario, setScenario] = React.useState({ shift: 5, segment: "Enterprise", delta: null });
  const [exportUrl, setExportUrl] = React.useState(null);
  const [anomalies] = React.useState([
    { id: 1, label: "Checkout drop", severity: "high", time: "10:15" },
    { id: 2, label: "Email CTR dip", severity: "medium", time: "09:40" },
  ]);
  const attribution = [
    { factor: "Paid search CPC", contribution: "+38%", weight: 0.42 },
    { factor: "Email conversion", contribution: "-18%", weight: 0.28 },
    { factor: "Seasonality", contribution: "-8%", weight: 0.12 }
  ];
  const [traceEvents, setTraceEvents] = React.useState([]);
  const [showDebug, setShowDebug] = React.useState(false);
  const [pinboard, setPinboard] = React.useState([]);
  const [commentDraft, setCommentDraft] = React.useState("");
  const [sourceFreshness, setSourceFreshness] = React.useState({ orders: Date.now(), events: Date.now() - 8 * 60 * 1000, attribution: Date.now() - 25 * 60 * 1000 });
  const [compatibilityIssue, setCompatibilityIssue] = React.useState("");

  const recordHistory = (summary) => setHistory(h => [{ summary, at: Date.now(), env }, ...h].slice(0, 6));

  const quickFixForIssue = (msg = "") => {
    const lower = msg.toLowerCase();
    if (lower.includes("network")) return "retry";
    if (lower.includes("auth")) return "reauth";
    return null;
  };

  const recordTrace = (event, meta = {}) => {
    setTraceEvents(prev => [{ event, meta, at: Date.now(), env, shop }, ...prev].slice(0, 12));
  };

  const checkFreshness = () => {
    const drift = Math.round(5 + Math.random() * 18);
    const status = drift > freshness.sla ? "degraded" : "healthy";
    setFreshness({ ...freshness, minutes: drift, status });
    setIncidentMode(status === "degraded");
    setSyncHealth({ status, lastSuccess: syncHealth.lastSuccess, lastError: status === "degraded" ? "Freshness SLA breach" : null });
    recordTrace('freshness_check', { drift, status });
    recordHistory(`Freshness ${drift}m (${status})`);
  };

  const refreshSources = () => {
    const now = Date.now();
    const next = {
      orders: now - Math.round(Math.random() * 10) * 60 * 1000,
      events: now - Math.round(Math.random() * 18) * 60 * 1000,
      attribution: now - Math.round(Math.random() * 30) * 60 * 1000,
    };
    setSourceFreshness(next);
    const worstLag = Math.max(...Object.values(next).map(ts => (now - ts) / 60000));
    const status = worstLag > freshness.sla ? "degraded" : "healthy";
    setFreshness(f => ({ ...f, status }));
    setIncidentMode(status === "degraded");
    recordTrace('source_refresh', { status, worstLag: Math.round(worstLag) });
    recordHistory(`Sources refreshed (worst ${Math.round(worstLag)}m)`);
  };

  const snapshotSegment = () => {
    const snap = { segment, search, metricPreset, dimension, shop, at: Date.now() };
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    setExportUrl(url);
    setTimeout(() => URL.revokeObjectURL(url), 12000);
    recordTrace('segment_snapshot', snap);
    recordHistory(`Snapshot ${segment} • ${metricPreset}`);
  };

  const routeAlert = (channel) => {
    recordHistory(`Routed alert to ${channel}`);
    recordTrace('alert_route', { channel });
  };

  const suppressAnomaly = (id) => {
    setSuppressedAnomalies(prev => Array.from(new Set([...prev, id])));
    recordTrace('anomaly_suppressed', { id });
    recordHistory(`Suppressed anomaly ${id}`);
  };

  const simulateScenario = () => {
    const base = scenario.segment === 'Enterprise' ? 1.8 : 1.2;
    const uplift = scenario.shift / 100;
    const delta = { gmv: (base * (1 + uplift)).toFixed(2), conversion: (2.4 * (1 + uplift * 0.6)).toFixed(2) };
    setScenario(prev => ({ ...prev, delta }));
    recordTrace('scenario_sim', { shift: scenario.shift, segment: scenario.segment });
    recordHistory(`Scenario +${scenario.shift}% for ${scenario.segment}`);
  };

  const exportExecSummary = () => {
    const summary = `Exec summary for ${shop} • ${segment}\nMetric: ${metricPreset}\nDimension: ${dimension}\nFreshness: ${freshness.minutes}m (${freshness.status})`;
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    setExportUrl(url);
    setTimeout(() => URL.revokeObjectURL(url), 12000);
    recordTrace('exec_export', { shop, segment });
    recordHistory('Exported exec summary');
  };

  React.useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        handleFilter();
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        addPin(`Pinned ${metricPreset}`, `Auto-pin ${dimension}`);
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        setShowDebug(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [metricPreset, dimension]);

  const handleFilter = () => {
    const incompatible = metricPreset === "Repeat rate" && dimension === "Campaign";
    if (incompatible) {
      setCompatibilityIssue("Campaign dimension is not scoped for repeat rate. Use Channel/Geo instead.");
      setError("Incompatible metric/dimension combination");
      recordTrace('filter_blocked', { metricPreset, dimension });
      return;
    }
    setCompatibilityIssue("");
    recordHistory(`Filtered insights (${segment}${search ? ` • ${search}` : ""})`);
    setSyncHealth({ status: "healthy", lastSuccess: Date.now(), lastError: null });
    recordTrace('filter', { segment, search });
  };

  const simulateIngest = () => {
    if (devSandbox) {
      setError("Sandbox mode: live ingest blocked. Switch to Stage/Prod.");
      setSyncHealth({ status: "degraded", lastSuccess: syncHealth.lastSuccess, lastError: "Ingest blocked in dev" });
      recordTrace('ingest_blocked', { env });
      return;
    }
    setError("");
    setTimeout(() => {
      setSyncHealth({ status: "healthy", lastSuccess: Date.now(), lastError: null });
      recordHistory("Data ingest refreshed");
      recordTrace('ingest_refreshed', { shop });
    }, 300);
  };

  const addPin = (title, note = "") => {
    setPinboard(prev => [{ id: Date.now(), title, note, shop, env, comments: commentDraft ? [commentDraft] : [] }, ...prev].slice(0, 6));
    setCommentDraft("");
    recordTrace('pin_added', { title });
    recordHistory(`Pinned insight: ${title}`);
  };

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("autoinsights-state");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.pinboard) setPinboard(parsed.pinboard);
        if (parsed.history) setHistory(parsed.history);
        if (parsed.suppressedAnomalies) setSuppressedAnomalies(parsed.suppressedAnomalies);
        if (parsed.sourceFreshness) setSourceFreshness(parsed.sourceFreshness);
      }
    } catch (e) {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    const payload = { pinboard, history, suppressedAnomalies, sourceFreshness };
    try {
      localStorage.setItem("autoinsights-state", JSON.stringify(payload));
    } catch (e) {
      /* ignore */
    }
  }, [pinboard, history, suppressedAnomalies, sourceFreshness]);

  // Full flagship dashboard, no legacy onboarding, toggles, or white backgrounds
  return (
    <div className="aura-card flagship-autoinsights-dashboard" style={{ padding: 0, background: "var(--surface-card)", borderRadius: 24, boxShadow: "0 8px 32px #0006" }}>
      {incidentMode && (
        <div style={{ background: '#7f1d1d', color: '#fee2e2', padding: '10px 16px', borderTopLeftRadius: 24, borderTopRightRadius: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid #b91c1c' }}>
          <div style={{ fontWeight: 800 }}>Incident mode — freshness SLA breached, noisy alerts suppressed.</div>
          <button className="aura-btn" style={{ background: '#b91c1c', color: '#fff' }} onClick={() => setIncidentMode(false)}>Clear</button>
        </div>
      )}
      {/* Header & Analytics */}
      <div className="autoinsights-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "36px 48px 0 48px" }}>
        <div>
          <h1 style={{ fontWeight: 900, fontSize: 38, color: "var(--text-primary)", marginBottom: 8 }}>Auto Insights Dashboard</h1>
          <div style={{ fontSize: 20, color: "var(--text-accent)", fontWeight: 700 }}>AI-powered business insights, analytics, and recommendations</div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={env} onChange={e => setEnv(e.target.value)} style={{ background: '#0b1221', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 10, padding: '10px 12px', fontWeight: 800 }}>
            <option value="dev">Dev</option>
            <option value="stage">Stage</option>
            <option value="prod">Prod</option>
          </select>
          <select value={shop} onChange={e => setShop(e.target.value)} style={{ background: '#0b1221', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 10, padding: '10px 12px', fontWeight: 800 }}>
            <option value="demo-shop.myshopify.com">demo-shop.myshopify.com</option>
            <option value="staging-shop.myshopify.com">staging-shop.myshopify.com</option>
          </select>
          <div className="insight-score-card" style={{ background: "#181f2a", borderRadius: 18, padding: "18px 32px", boxShadow: "0 2px 16px #0003", textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 22, color: "#7fffd4" }}>Insight Score</div>
            <div style={{ fontWeight: 900, fontSize: 48, color: "#22c55e" }}>92</div>
            <div style={{ fontSize: 15, color: "#b6eaff" }}>Best Practice</div>
          </div>
          <div style={{ background: '#181f2a', borderRadius: 12, padding: '10px 14px', minWidth: 180 }}>
            <div style={{ color: '#9ca3af', fontSize: 12 }}>Sync health</div>
            <div style={{ fontWeight: 800, color: syncHealth.status === 'healthy' ? '#22c55e' : '#f87171' }}>{syncHealth.status}</div>
            <div style={{ color: '#9ca3af', fontSize: 12 }}>Last sync {syncHealth.lastSuccess ? new Date(syncHealth.lastSuccess).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
          </div>
          <div style={{ background: '#181f2a', borderRadius: 12, padding: '10px 14px', minWidth: 200 }}>
            <div style={{ color: '#9ca3af', fontSize: 12 }}>Freshness SLA: {freshness.sla}m</div>
            <div style={{ fontWeight: 800, color: freshness.status === 'healthy' ? '#22c55e' : '#fbbf24' }}>Age: {freshness.minutes}m</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <button className="aura-btn" style={{ background: '#1f2937', color: '#e5e7eb', border: '1px solid #334155' }} onClick={checkFreshness}>Check</button>
              <button className="aura-btn" style={{ background: '#0ea5e9', color: '#fff' }} onClick={() => setFreshness(f => ({ ...f, sla: Math.max(5, f.sla - 2) }))}>Tighten SLA</button>
            </div>
          </div>
          <div style={{ background: '#181f2a', borderRadius: 12, padding: '10px 14px', minWidth: 220 }}>
            <div style={{ color: '#9ca3af', fontSize: 12 }}>Source freshness map</div>
            <div style={{ color: '#e5e7eb', fontWeight: 700 }}>Orders {Math.round((Date.now() - sourceFreshness.orders) / 60000)}m · Events {Math.round((Date.now() - sourceFreshness.events) / 60000)}m</div>
            <div style={{ color: '#9ca3af', fontSize: 12 }}>Attribution {(Math.round((Date.now() - sourceFreshness.attribution) / 60000))}m</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <button className="aura-btn" style={{ background: '#1f2937', color: '#e5e7eb', border: '1px solid #334155' }} onClick={refreshSources}>Refresh sources</button>
              <button className="aura-btn" style={{ background: '#0b1221', color: '#fbbf24', border: '1px solid #334155' }} onClick={() => setIncidentMode(true)}>Open incident</button>
            </div>
          </div>
          <button className="aura-btn" style={{ background: '#7fffd4', color: '#23263a', fontWeight: 800 }} onClick={simulateIngest}>Refresh data</button>
        </div>
      </div>

      {/* Segmentation & Filtering */}
      <div className="autoinsights-segmentation" style={{ padding: "32px 48px", display: "flex", gap: 32 }}>
        <div style={{ flex: 2 }}>
          <h2 style={{ fontWeight: 800, fontSize: 26, color: "var(--text-primary)", marginBottom: 18 }}>Segment & Filter Insights</h2>
          <div style={{ display: "flex", gap: 18, marginBottom: 18 }}>
            <input className="aura-input" style={{ flex: 1 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by topic, metric, or keyword..." />
            <select className="aura-input" style={{ flex: 1 }}>
              <option>Insight Score</option>
              <option>Trend</option>
              <option>Opportunity</option>
              <option>Risk</option>
              <option>Segment</option>
            </select>
            <select className="aura-input" style={{ flex: 1 }} value={segment} onChange={e => setSegment(e.target.value)}>
              <option>Segment</option>
              <option>Enterprise</option>
              <option>SMB</option>
              <option>Startup</option>
              <option>Agency</option>
            </select>
            <button className="aura-btn" style={{ background: "#7fffd4", color: "#23263a", fontWeight: 700 }} onClick={handleFilter}>Filter</button>
          </div>
          {compatibilityIssue && <div style={{ color: '#fbbf24', fontSize: 13, marginBottom: 10 }}>Guardrail: {compatibilityIssue}</div>}
          {/* Analytics Chart Placeholder */}
          <div style={{ background: "#23263a", borderRadius: 18, padding: 24, minHeight: 180, marginBottom: 18 }}>
            <div style={{ fontWeight: 700, color: "#7fffd4", fontSize: 18 }}>Analytics & Trends</div>
            <div style={{ color: "#b6eaff", fontSize: 15 }}>Visualize trends, opportunities, risks (chart here)</div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="aura-btn" onClick={snapshotSegment}>Snapshot segment</button>
            <button className="aura-btn" style={{ background: '#1f2937', color: '#e5e7eb', border: '1px solid #334155' }} onClick={() => addPin(`Shared ${segment}`, 'Shared pin set')}>Share pins</button>
            {exportUrl && <a href={exportUrl} download="segment-snapshot.json" style={{ color: '#7fffd4', textDecoration: 'underline', fontSize: 13 }}>Download snapshot</a>}
            <div style={{ color: '#9ca3af', fontSize: 12 }}>Seg: {segment} · Dim: {dimension} · Metric: {metricPreset}</div>
          </div>
        </div>
        {/* Alerts & Integrations */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ background: "#23263a", borderRadius: 18, padding: 18 }}>
            <div style={{ fontWeight: 700, color: "#7fffd4", fontSize: 18 }}>Real-Time Alerts</div>
            <div style={{ color: "#b6eaff", fontSize: 15 }}>Slack, Email, In-app notifications for new insights and trends</div>
          </div>
          <div style={{ background: "#23263a", borderRadius: 18, padding: 18 }}>
            <div style={{ fontWeight: 700, color: "#7fffd4", fontSize: 18 }}>Integrations</div>
            <div style={{ color: "#b6eaff", fontSize: 15 }}>CRM, Analytics, Marketing, Data Warehouse</div>
          </div>
        </div>
      </div>

      {/* Kanban Board & AI Recommendations */}
      <div className="autoinsights-kanban-ai" style={{ padding: "32px 48px" }}>
        <h2 style={{ fontWeight: 800, fontSize: 26, color: "var(--text-primary)", marginBottom: 18 }}>Insight Projects & AI Recommendations</h2>
        <div style={{ display: "flex", gap: 24 }}>
          {/* Kanban Board Placeholder */}
          <div style={{ flex: 2, background: "#23263a", borderRadius: 18, padding: 24, minHeight: 220 }}>
            <div style={{ fontWeight: 700, color: "#7fffd4", fontSize: 18 }}>Kanban Board</div>
            <div style={{ color: "#b6eaff", fontSize: 15 }}>Visualize insight-driven projects, tasks, and progress (kanban UI here)</div>
          </div>
          {/* AI Recommendations & Bulk Actions */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ background: "#23263a", borderRadius: 18, padding: 18 }}>
              <div style={{ fontWeight: 700, color: "#7fffd4", fontSize: 18 }}>AI Recommendations</div>
              <div style={{ color: "#b6eaff", fontSize: 15 }}>Next-best-action suggestions for business strategy</div>
            </div>
            <div style={{ background: "#23263a", borderRadius: 18, padding: 18 }}>
              <div style={{ fontWeight: 700, color: "#7fffd4", fontSize: 18 }}>Bulk Actions</div>
              <div style={{ color: "#b6eaff", fontSize: 15 }}>Apply actions to multiple insights at once</div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics & Executive Reporting */}
      <div className="autoinsights-analytics-reporting" style={{ padding: "32px 48px" }}>
        <h2 style={{ fontWeight: 800, fontSize: 26, color: "var(--text-primary)", marginBottom: 18 }}>Analytics & Executive Reporting</h2>
        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ flex: 2, background: "#23263a", borderRadius: 18, padding: 24, minHeight: 180 }}>
            <div style={{ fontWeight: 700, color: "#7fffd4", fontSize: 18 }}>Visual Analytics Dashboard</div>
            <div style={{ color: "#b6eaff", fontSize: 15 }}>Charts, heatmaps, funnel views, trend lines (dashboard UI here)</div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ background: "#23263a", borderRadius: 18, padding: 18 }}>
              <div style={{ fontWeight: 700, color: "#7fffd4", fontSize: 18 }}>Executive Summaries</div>
              <div style={{ color: "#b6eaff", fontSize: 15 }}>Automated, AI-generated insights for leadership</div>
            </div>
            <div style={{ background: "#23263a", borderRadius: 18, padding: 18 }}>
              <div style={{ fontWeight: 700, color: "#7fffd4", fontSize: 18 }}>Export & Sharing</div>
              <div style={{ color: "#b6eaff", fontSize: 15 }}>PDF, CSV, scheduled reports, live links</div>
              <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="aura-btn" onClick={exportExecSummary}>Export exec summary</button>
                {exportUrl && <a href={exportUrl} download="exec-summary.txt" style={{ color: '#7fffd4', textDecoration: 'underline', fontSize: 13 }}>Download</a>}
                <button className="aura-btn" style={{ background: '#1f2937', color: '#e5e7eb', border: '1px solid #334155' }} onClick={() => recordHistory('Scheduled weekly PDF')}>Schedule weekly PDF</button>
              </div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap', background: '#0b1221', borderRadius: 14, padding: 14, border: '1px solid #1f2937' }}>
          <div style={{ fontWeight: 800, color: '#7fffd4' }}>Shopify metric presets</div>
          <select className="aura-input" value={metricPreset} onChange={e => setMetricPreset(e.target.value)} style={{ width: 160 }}>
            <option>GMV</option>
            <option>AOV</option>
            <option>Conversion</option>
            <option>Repeat rate</option>
          </select>
          <select className="aura-input" value={dimension} onChange={e => setDimension(e.target.value)} style={{ width: 160 }}>
            <option>Channel</option>
            <option>Device</option>
            <option>Geo</option>
            <option>Campaign</option>
          </select>
          <button className="aura-btn" onClick={() => recordHistory(`Preset ${metricPreset} by ${dimension} for ${shop}`)}>Apply</button>
          <button className="aura-btn" onClick={() => recordHistory(`Explain ${metricPreset}`)}>Explain this metric</button>
          <div style={{ color: '#9ca3af', fontSize: 13 }}>Maps to Shopify events (checkout, orders, carts) for {shop}</div>
        </div>
      </div>

      {/* Feedback & Collaboration */}
      <div className="autoinsights-feedback-collab" style={{ padding: "32px 48px" }}>
        <h2 style={{ fontWeight: 800, fontSize: 26, color: "var(--text-primary)", marginBottom: 18 }}>Feedback & Collaboration</h2>
        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ flex: 2, background: "#23263a", borderRadius: 18, padding: 24, minHeight: 120 }}>
            <div style={{ fontWeight: 700, color: "#7fffd4", fontSize: 18 }}>Embedded Feedback</div>
            <div style={{ color: "#b6eaff", fontSize: 15 }}>In-app surveys, NPS, CSAT, post-insight feedback</div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ background: "#23263a", borderRadius: 18, padding: 18 }}>
              <div style={{ fontWeight: 700, color: "#7fffd4", fontSize: 18 }}>Collaboration</div>
              <div style={{ color: "#b6eaff", fontSize: 15 }}>Team notes, tagging, @mentions, audit logs</div>
            </div>
            <div style={{ background: "#23263a", borderRadius: 18, padding: 18 }}>
              <div style={{ fontWeight: 700, color: "#7fffd4", fontSize: 18 }}>Security & Compliance</div>
              <div style={{ color: "#b6eaff", fontSize: 15 }}>Role-based access, GDPR, audit logs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Pinboard & Attribution */}
      <div style={{ padding: "0 48px 24px" }}>
        <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'minmax(240px, 1.2fr) minmax(240px, 1fr)' }}>
          <div style={{ background: '#23263a', borderRadius: 18, padding: 18 }}>
            <div style={{ fontWeight: 800, color: '#7fffd4', fontSize: 18, marginBottom: 8 }}>Pinboard</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <input className="aura-input" style={{ flex: 1 }} value={commentDraft} onChange={e => setCommentDraft(e.target.value)} placeholder="Add a note/comment before pinning" />
              <button className="aura-btn" onClick={() => addPin(`${metricPreset} • ${dimension}`, commentDraft || 'Captured from dashboard')}>Pin current view</button>
            </div>
            {pinboard.length === 0 ? (
              <div style={{ color: '#9ca3af', fontSize: 13 }}>No pins yet. Ctrl+P to pin current preset.</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {pinboard.map(pin => (
                  <div key={pin.id} style={{ background: '#0b1221', borderRadius: 10, padding: 10, border: '1px solid #1f2937' }}>
                    <div style={{ color: '#e5e7eb', fontWeight: 700 }}>{pin.title}</div>
                    <div style={{ color: '#9ca3af', fontSize: 12 }}>{pin.note}</div>
                    {pin.comments && pin.comments.length > 0 && <div style={{ color: '#7fffd4', fontSize: 12 }}>Comments: {pin.comments.join(' · ')}</div>}
                    <div style={{ color: '#9ca3af', fontSize: 12 }}>{pin.shop} · {pin.env}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ background: '#23263a', borderRadius: 18, padding: 18 }}>
            <div style={{ fontWeight: 800, color: '#7fffd4', fontSize: 18, marginBottom: 8 }}>Why this insight?</div>
            <div style={{ color: '#b6eaff', fontSize: 15 }}>Attribution and feature importance</div>
            <div style={{ marginTop: 8, display: 'grid', gap: 8 }}>
              {attribution.map((a, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0b1221', borderRadius: 10, padding: 10, border: '1px solid #1f2937' }}>
                  <div>
                    <div style={{ color: '#e5e7eb', fontWeight: 700 }}>{a.factor}</div>
                    <div style={{ color: '#9ca3af', fontSize: 12 }}>Weight {(a.weight * 100).toFixed(0)}%</div>
                  </div>
                  <div style={{ color: a.contribution.startsWith('-') ? '#f87171' : '#22c55e', fontWeight: 800 }}>{a.contribution}</div>
                </div>
              ))}
            </div>
            <button className="aura-btn" style={{ marginTop: 10 }} onClick={() => { recordHistory('Attribution refreshed'); recordTrace('attribution_refresh', {}); }}>Refresh attribution</button>
          </div>
        </div>
      </div>

      {/* Explainability & Anomalies */}
      <div style={{ padding: "0 48px 24px" }}>
        <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'minmax(240px, 1fr) minmax(240px, 1fr)' }}>
          <div style={{ background: '#23263a', borderRadius: 18, padding: 18 }}>
            <div style={{ fontWeight: 800, color: '#7fffd4', fontSize: 18, marginBottom: 8 }}>Why did this change?</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: '#b6eaff', lineHeight: 1.6 }}>
              <li>Top driver: Paid search CPC +12%</li>
              <li>Secondary: Email conversion -6%</li>
              <li>Seasonality: Weekend dip detected</li>
            </ul>
            <button className="aura-btn" style={{ marginTop: 10 }} onClick={() => { recordHistory('Requested explainability summary'); recordTrace('explainability', {}); }}>Explain more</button>
          </div>
          <div style={{ background: '#23263a', borderRadius: 18, padding: 18 }}>
            <div style={{ fontWeight: 800, color: '#7fffd4', fontSize: 18, marginBottom: 8 }}>Anomaly stream</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {anomalies.map(a => (
                <div key={a.id} style={{ display: 'grid', gap: 8, background: '#0b1221', borderRadius: 10, padding: '10px 12px', border: '1px solid #1f2937' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ color: '#e5e7eb', fontWeight: 700 }}>{a.label}</div>
                      <div style={{ color: '#9ca3af', fontSize: 12 }}>{a.time} · {a.severity}</div>
                    </div>
                    {suppressedAnomalies.includes(a.id) && <div style={{ color: '#fbbf24', fontSize: 12 }}>Suppressed</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="aura-btn" style={{ background: '#1f2937', color: '#e5e7eb', border: '1px solid #334155' }} onClick={() => recordHistory(`Acknowledged anomaly: ${a.label}`)}>Acknowledge</button>
                    <button className="aura-btn" style={{ background: '#0ea5e9', color: '#fff' }} onClick={() => routeAlert('slack')}>Route to Slack</button>
                    <button className="aura-btn" style={{ background: '#7fffd4', color: '#23263a' }} onClick={() => routeAlert('email')}>Email alert</button>
                    <button className="aura-btn" style={{ background: '#b91c1c', color: '#fff' }} onClick={() => suppressAnomaly(a.id)}>Suppress</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison & AI Assist */}
      <div style={{ padding: "0 48px 36px", display: 'grid', gap: 18, gridTemplateColumns: 'minmax(260px, 1fr) minmax(260px, 1fr)' }}>
        <div style={{ background: '#23263a', borderRadius: 18, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontWeight: 800, color: '#7fffd4', fontSize: 18 }}>Comparison mode</div>
            <select className="aura-input" value={comparison} onChange={e => setComparison(e.target.value)} style={{ width: 140 }}>
              <option>Enterprise</option>
              <option>SMB</option>
              <option>Startup</option>
              <option>Agency</option>
            </select>
          </div>
          <div style={{ color: '#b6eaff', fontSize: 15 }}>Comparing {comparison} vs {segment}</div>
          <div style={{ marginTop: 10, background: '#0b1221', borderRadius: 10, padding: 12, border: '1px solid #1f2937' }}>
            <div style={{ color: '#e5e7eb', fontWeight: 700 }}>Delta callouts</div>
            <div style={{ color: '#9ca3af', fontSize: 13 }}>Conversion +4.2 pts; AOV -1.1%; LTV +3.6%</div>
          </div>
          <button className="aura-btn" style={{ marginTop: 10 }} onClick={() => recordHistory('Exported comparison CSV')}>Export comparison CSV</button>
        </div>
        <div style={{ background: '#23263a', borderRadius: 18, padding: 18, display: 'grid', gap: 10 }}>
          <div style={{ fontWeight: 800, color: '#7fffd4', fontSize: 18 }}>AI assist</div>
          <button className="aura-btn" onClick={() => recordHistory('AI summary generated')}>Summarize this view</button>
          <button className="aura-btn" onClick={() => recordHistory('Next best actions suggested')}>Suggest next best actions</button>
          <div style={{ color: '#9ca3af', fontSize: 13 }}>Actions consider current filters and segment.</div>
        </div>
        <div style={{ background: '#23263a', borderRadius: 18, padding: 18, display: 'grid', gap: 10 }}>
          <div style={{ fontWeight: 800, color: '#7fffd4', fontSize: 18 }}>Scenario simulator</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input className="aura-input" type="number" value={scenario.shift} onChange={e => setScenario(prev => ({ ...prev, shift: Number(e.target.value) || 0 }))} style={{ width: 100 }} />
            <span style={{ color: '#9ca3af', fontSize: 13 }}>% shift in spend</span>
            <select className="aura-input" value={scenario.segment} onChange={e => setScenario(prev => ({ ...prev, segment: e.target.value }))} style={{ width: 140 }}>
              <option>Enterprise</option>
              <option>SMB</option>
              <option>Startup</option>
            </select>
            <button className="aura-btn" onClick={simulateScenario}>Simulate</button>
          </div>
          {scenario.delta && (
            <div style={{ color: '#b6eaff', fontSize: 14 }}>Projected GMV {scenario.delta.gmv}x · Conversion {scenario.delta.conversion}%</div>
          )}
        </div>
      </div>

      {search.length > 40 && (
        <div style={{ margin: "0 48px 16px", color: '#fbbf24', fontSize: 13 }}>Perf guardrail: search is long; consider narrowing filters to reduce scan size.</div>
      )}

      {error && (
        <div style={{ margin: "0 48px 24px", color: "#f87171", display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span>{error}</span>
          {quickFixForIssue(error) === 'retry' && <button className="aura-btn" onClick={() => { setError(''); simulateIngest(); }}>Retry</button>}
          {quickFixForIssue(error) === 'reauth' && <button className="aura-btn" onClick={() => setError('Re-authenticate in settings')}>Open settings</button>}
        </div>
      )}

      <div style={{ padding: "0 48px 24px" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 800, color: '#7fffd4', fontSize: 18 }}>Debug panel</div>
          <button className="aura-btn" style={{ background: '#1f2937', color: '#e5e7eb', border: '1px solid #334155' }} onClick={() => setShowDebug(v => !v)}>{showDebug ? 'Hide' : 'Show'} traces</button>
        </div>
        {showDebug ? (
          traceEvents.length === 0 ? <div style={{ color: '#9ca3af', marginTop: 8 }}>No traces yet. Ctrl+D toggles. Filters, pins, ingests are traced.</div> : (
            <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
              {traceEvents.map((t, idx) => (
                <div key={idx} style={{ background: '#0b1221', borderRadius: 10, padding: 10, border: '1px solid #1f2937' }}>
                  <div style={{ color: '#e5e7eb', fontWeight: 700 }}>{t.event}</div>
                  <div style={{ color: '#9ca3af', fontSize: 12 }}>{new Date(t.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {t.env} · {t.shop}</div>
                  <div style={{ color: '#9ca3af', fontSize: 12, wordBreak: 'break-word' }}>{JSON.stringify(t.meta)}</div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div style={{ color: '#9ca3af', marginTop: 8 }}>Tracing is off. Toggle to view recent actions.</div>
        )}
      </div>

      {history.length > 0 && (
        <div style={{ padding: "0 48px 36px" }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: "var(--text-primary)", marginBottom: 10 }}>Recent activity</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {history.slice(0, 5).map((h, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0b1221', border: '1px solid #1f2937', borderRadius: 12, padding: '10px 12px' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#e5e7eb' }}>{h.summary}</div>
                  <div style={{ color: '#9ca3af', fontSize: 12 }}>{new Date(h.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {h.env}</div>
                </div>
                <button className="aura-btn" style={{ background: '#1f2937', color: '#e5e7eb', border: '1px solid #334155' }} onClick={() => recordHistory(`Replayed: ${h.summary}`)}>Replay</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
