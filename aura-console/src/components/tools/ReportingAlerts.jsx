import React, { useState, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/reporting-alerts";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "10px 14px", outline: "none" },
  select: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "10px 14px", outline: "none" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
  badge: (c) => ({ display: "inline-block", borderRadius: 5, padding: "2px 9px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: c === "anomaly" ? "#3f1315" : c === "threshold" ? "#3d2a0a" : "#052e16", color: c === "anomaly" ? "#f87171" : c === "threshold" ? "#fbbf24" : "#4ade80" }),
};

const TABS = [
  { id: "alerts",   label: "My Alerts" },
  { id: "create",   label: "Create Alert" },
  { id: "ai",       label: "AI Recommendations" },
  { id: "history",  label: "Trigger History" },
  { id: "guide",    label: "Alert Strategy" },
];

const ALERT_TYPES  = ["threshold", "anomaly", "scheduled"];
const CHANNELS     = ["Email", "Slack", "SMS", "Webhook", "Microsoft Teams"];
const METRICS      = ["Revenue", "Orders", "Conversion Rate", "AOV", "Return Rate", "Traffic", "Cart Abandonment Rate", "CSAT", "Refund Rate", "Gross Margin", "New Customers", "Repeat Purchase Rate"];
const COMPARE_TO   = ["Same day last week", "Same day last month", "7-day rolling average", "30-day rolling average", "Fixed value"];
const SEVERITIES   = ["critical", "warning", "info"];

const AI_ALERT_PROMPTS = [
  "Suggest the 10 most important revenue-protecting alerts for a £1M+ Shopify store",
  "What anomaly detection alerts should I run for checkout and conversion rate?",
  "Design a complete alert stack for an operations team managing a Shopify store with 200+ daily orders",
  "What scheduled reports should I set up to replace manual Monday morning check-ins?",
];

export default function ReportingAlerts() {
  const [tab, setTab]       = useState("alerts");
  const [alerts, setAlerts]   = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const [form, setForm] = useState({ name: "", type: "threshold", metric: "Revenue", channel: "Email", recipient: "", threshold: "", compareTo: "Same day last week", severity: "warning" });
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const [filterType, setFilterType]     = useState("all");
  const [filterActive, setFilterActive] = useState("all");

  // AI Recommendations
  const [aiPrompt, setAiPrompt]   = useState("");
  const [aiResult, setAiResult]   = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => { loadAlerts(); loadHistory(); }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const r = await apiFetchJSON(`${API}/alerts`);
      if (r.ok) setAlerts(r.alerts || []);
    } catch {}
    setLoading(false);
  };

  const loadHistory = async () => {
    try {
      const r = await apiFetchJSON(`${API}/history`);
      if (r.ok) setHistory(r.history || []);
    } catch {}
  };

  const createAlert = async () => {
    if (!form.name.trim() || !form.recipient.trim()) { setError("Name and recipient are required"); return; }
    setSaving(true); setError("");
    try {
      const r = await apiFetchJSON(`${API}/alerts`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, active: true, createdAt: new Date().toISOString(), lastTriggered: null }),
      });
      if (!r.ok) throw new Error(r.error || "Create failed");
      setAlerts(p => [r.alert || { ...form, id: Date.now(), active: true, lastTriggered: null }, ...p]);
      setForm({ name: "", type: "threshold", metric: "Revenue", channel: "Email", recipient: "", threshold: "", compareTo: "Same day last week", severity: "warning" });
      setTab("alerts");
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  const toggleAlert = async (id) => {
    const alert = alerts.find(a => a.id === id);
    if (!alert) return;
    try {
      await apiFetchJSON(`${API}/alerts/${id}/toggle`, { method: "PATCH" });
    } catch {}
    setAlerts(p => p.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  const deleteAlert = async (id) => {
    try {
      await apiFetchJSON(`${API}/alerts/${id}`, { method: "DELETE" });
    } catch {}
    setAlerts(p => p.filter(a => a.id !== id));
  };

  const runAiRecommendations = async (override) => {
    const prompt = (override || aiPrompt).trim();
    if (!prompt) return;
    setAiLoading(true); setAiResult(null);
    try {
      const r = await apiFetchJSON(`${API}/ai/recommend`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!r.ok) throw new Error(r.error || "AI failed");
      setAiResult(r.recommendations || r.result || "");
    } catch (e) { setError(e.message); }
    setAiLoading(false);
  };

  const filtered = alerts.filter(a => {
    const matchesType   = filterType   === "all" || a.type   === filterType;
    const matchesActive = filterActive === "all" || (filterActive === "active" ? a.active : !a.active);
    return matchesType && matchesActive;
  });

  const activeCount   = alerts.filter(a => a.active).length;
  const triggeredToday = history.filter(h => h.triggeredAt && h.triggeredAt.startsWith(new Date().toISOString().slice(0, 10))).length;

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Reporting & Alerts</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>
          Automated real-time alerts for revenue drops, anomalies, threshold breaches, and scheduled reports. Know before your customers do. Get AI-recommended alert configurations for your store size and model.
        </p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Active Alerts",    val: activeCount,                    color: "#4f46e5" },
          { label: "Total Configured", val: alerts.length,                  color: "#71717a" },
          { label: "Triggered Today",  val: triggeredToday,                 color: triggeredToday > 0 ? "#f87171" : "#52525b" },
          { label: "History Events",   val: history.length,                 color: "#fbbf24" },
        ].map(m => (
          <div key={m.label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "10px 18px" }}>
            <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase" }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{m.val}</div>
          </div>
        ))}
      </div>

      <ErrorBox message={error} />
      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* ── MY ALERTS ── */}
      {tab === "alerts" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            {["all", "threshold", "anomaly", "scheduled"].map(t => (
              <button key={t} style={{ ...S.btn(filterType === t ? "primary" : null), fontSize: 11, padding: "5px 10px", textTransform: "capitalize" }} onClick={() => setFilterType(t)}>{t}</button>
            ))}
            <span style={{ color: "#3f3f46", fontSize: 12 }}>|</span>
            {["all", "active", "paused"].map(a => (
              <button key={a} style={{ ...S.btn(filterActive === a ? "primary" : null), fontSize: 11, padding: "5px 10px", textTransform: "capitalize" }} onClick={() => setFilterActive(a)}>{a}</button>
            ))}
            <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={loadAlerts}>Refresh</button>
            <button style={{ ...S.btn("primary"), fontSize: 11, padding: "5px 10px" }} onClick={() => setTab("create")}>+ New Alert</button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon="🔔" title={alerts.length === 0 ? "No alerts configured" : "No alerts match filters"} description={alerts.length === 0 ? "Create your first alert or use AI Recommendations to get a suggested alert stack." : "Try changing the type or status filter."} />
          ) : (
            filtered.map(a => (
              <div key={a.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={S.badge(a.type)}>{a.type}</span>
                      <span style={{ background: a.severity === "critical" ? "#3f1315" : a.severity === "warning" ? "#3d2a0a" : "#052e16", color: a.severity === "critical" ? "#f87171" : a.severity === "warning" ? "#fbbf24" : "#4ade80", padding: "2px 7px", borderRadius: 4, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{a.severity || "warning"}</span>
                      <span style={{ background: a.active ? "#052e16" : "#27272a", color: a.active ? "#4ade80" : "#71717a", padding: "2px 7px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{a.active ? "ACTIVE" : "PAUSED"}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>{a.name}</div>
                    <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>
                      {a.metric} · {a.compareTo || ""}{a.threshold ? ` · Condition: ${a.threshold}` : ""} · {a.channel}: {a.recipient}
                    </div>
                    {a.lastTriggered && <div style={{ fontSize: 11, color: "#52525b", marginTop: 2 }}>Last triggered: {a.lastTriggered}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 12 }}>
                    <button style={{ ...S.btn(a.active ? null : "green"), fontSize: 11, padding: "4px 10px" }} onClick={() => toggleAlert(a.id)}>{a.active ? "Pause" : "Enable"}</button>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px" }} onClick={() => deleteAlert(a.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── CREATE ALERT ── */}
      {tab === "create" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Alert Configuration</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Alert Name *</div>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={form.name} onChange={e => setF("name", e.target.value)} placeholder="e.g. Revenue Drop >20%" />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Alert Type</div>
                <select style={{ ...S.select, width: "100%" }} value={form.type} onChange={e => setF("type", e.target.value)}>
                  {ALERT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Metric to Monitor</div>
                <select style={{ ...S.select, width: "100%" }} value={form.metric} onChange={e => setF("metric", e.target.value)}>
                  {METRICS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Compare Against</div>
                <select style={{ ...S.select, width: "100%" }} value={form.compareTo} onChange={e => setF("compareTo", e.target.value)}>
                  {COMPARE_TO.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Threshold / Condition</div>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={form.threshold} onChange={e => setF("threshold", e.target.value)} placeholder="e.g. drop >20%, below 4.0, every Monday 8am" />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Severity</div>
                <select style={{ ...S.select, width: "100%" }} value={form.severity} onChange={e => setF("severity", e.target.value)}>
                  {SEVERITIES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Notification Channel</div>
                <select style={{ ...S.select, width: "100%" }} value={form.channel} onChange={e => setF("channel", e.target.value)}>
                  {CHANNELS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Recipient *</div>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={form.recipient} onChange={e => setF("recipient", e.target.value)} placeholder="alerts@company.com or #slack-channel" />
              </div>
            </div>
            {form.name && form.recipient && (
              <div style={{ background: "#1e1b4b", border: "1px solid #3730a3", borderRadius: 8, padding: "8px 14px", fontSize: 12, color: "#c7d2fe", marginBottom: 14 }}>
                Summary: When <strong>{form.metric}</strong> {form.threshold} (vs {form.compareTo}) → notify <strong>{form.channel}: {form.recipient}</strong> [{form.severity}]
              </div>
            )}
            <button style={S.btn("primary")} onClick={createAlert} disabled={saving}>{saving ? "Saving…" : "Create Alert"}</button>
          </div>
        </div>
      )}

      {/* ── AI RECOMMENDATIONS ── */}
      {tab === "ai" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>AI Alert Stack Recommendations</div>
            <p style={{ fontSize: 13, color: "#71717a", lineHeight: 1.6, marginBottom: 14 }}>
              Describe your business and the AI will recommend the optimal alert configuration — metrics to monitor, thresholds, channels, and severity levels based on your store model.
            </p>
            <textarea
              style={{ background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6, width: "100%", minHeight: 90 }}
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="e.g. '£2M DTC brand, 150+ orders/day, 2-person ops team, use Slack for comms. What alerts should we run?'"
            />
            <button style={{ ...S.btn("primary"), marginTop: 10 }} onClick={() => runAiRecommendations()} disabled={aiLoading || !aiPrompt.trim()}>{aiLoading ? "Analysing…" : "Get AI Recommendations"}</button>
          </div>

          {aiLoading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}

          {aiResult && !aiLoading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={S.sectionTitle}>AI Alert Recommendations</div>
                <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(typeof aiResult === "string" ? aiResult : JSON.stringify(aiResult, null, 2))}>Copy</button>
              </div>
              <pre style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" }}>{typeof aiResult === "string" ? aiResult : JSON.stringify(aiResult, null, 2)}</pre>
            </div>
          )}

          <div style={S.card}>
            <div style={S.sectionTitle}>Quick Recommendation Prompts</div>
            {AI_ALERT_PROMPTS.map((p, i) => (
              <div key={i} style={S.row}>
                <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px", flexShrink: 0 }} onClick={() => { setAiPrompt(p); runAiRecommendations(p); }}>Ask</button>
                <div style={{ fontSize: 13, color: "#a1a1aa" }}>{p}</div>
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>Essential Alert Stack (DTC Reference)</div>
            {[
              { name: "Revenue Drop >20%",          type: "anomaly",   metric: "Revenue",            severity: "critical", channel: "Slack + SMS" },
              { name: "Conversion Rate Drop >25%",  type: "anomaly",   metric: "Conversion Rate",    severity: "critical", channel: "Slack" },
              { name: "Cart Abandonment >75%",      type: "threshold", metric: "Cart Abandonment",   severity: "warning",  channel: "Email" },
              { name: "CSAT Below 4.0",             type: "threshold", metric: "CSAT",               severity: "warning",  channel: "Slack" },
              { name: "Return Rate >15%",           type: "threshold", metric: "Return Rate",         severity: "warning",  channel: "Email" },
              { name: "Weekly Performance Report",  type: "scheduled", metric: "Revenue + Orders",   severity: "info",     channel: "Email" },
              { name: "Monthly Finance Summary",    type: "scheduled", metric: "Gross Margin + AOV", severity: "info",     channel: "Email" },
            ].map(({ name, type, metric, severity, channel }) => (
              <div key={name} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22", fontSize: 12, alignItems: "center" }}>
                <span style={{ color: "#e4e4e7", fontWeight: 600 }}>{name}</span>
                <span style={S.badge(type)}>{type}</span>
                <span style={{ background: severity === "critical" ? "#3f1315" : severity === "warning" ? "#3d2a0a" : "#052e16", color: severity === "critical" ? "#f87171" : severity === "warning" ? "#fbbf24" : "#4ade80", padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{severity}</span>
                <span style={{ color: "#52525b", fontSize: 11 }}>{channel}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TRIGGER HISTORY ── */}
      {tab === "history" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: "#71717a" }}>{history.length} events in history</div>
            <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={loadHistory}>Refresh</button>
          </div>
          {history.length === 0 ? (
            <EmptyState icon="📜" title="No alert history" description="Triggered alerts will appear here with timestamps and resolution notes." />
          ) : (
            history.map((h, i) => (
              <div key={h.id || i} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                      <span style={{ background: h.resolved ? "#052e16" : "#3f1315", color: h.resolved ? "#4ade80" : "#f87171", padding: "2px 7px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{h.resolved ? "RESOLVED" : "OPEN"}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>{h.alertName}</div>
                    <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>Triggered: {h.triggeredAt}{h.value ? ` · Value: ${h.value}` : ""}</div>
                    {h.note && <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 2, fontStyle: "italic" }}>{h.note}</div>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── ALERT STRATEGY ── */}
      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Alert Design Principles</div>
            {[
              { t: "Alert fatigue kills effectiveness",        d: "Start with 5-10 critical alerts only. Every alert must have a clear owner and a defined action. 'Revenue is down' with no owner = slow response. Build your alert stack incrementally." },
              { t: "Anomaly detection beats fixed thresholds", d: "A 20% revenue drop on Boxing Day is expected; the same on a Tuesday in June is a crisis. Anomaly detection uses rolling baselines to make context-aware comparisons." },
              { t: "Layer alerts by severity and channel",     d: "Critical (revenue drop >20%, site error): immediate Slack + SMS to on-call. Warning (cart abandonment up 15%): email digest. Informational: scheduled daily/weekly report only." },
              { t: "Scheduled reports replace ad-hoc requests", d: "A Monday 8am revenue summary to the CEO eliminates 5+ Slack messages per week. A Friday 5pm performance digest replaces the weekly operations meeting for the data-sharing portion." },
              { t: "Every alert needs an owner",               d: "Alert → owner assignment is the difference between fast and slow resolution. Configure alerts so the notification goes directly to the person responsible for that metric." },
              { t: "Review and prune monthly",                 d: "Delete alerts that never trigger (false negatives — threshold too loose) or that trigger constantly (false positives — threshold too tight). An alert log with >3 triggers/week is misconfigured." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>🔔</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div>
                  <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
