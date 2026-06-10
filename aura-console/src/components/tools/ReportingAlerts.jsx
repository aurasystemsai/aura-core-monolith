import React, { useState } from "react";
import { MozTabs, EmptyState, ErrorBox } from "../MozUI";

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
  { id: "alerts",   label: "Alerts" },
  { id: "create",   label: "Create Alert" },
  { id: "history",  label: "Alert History" },
  { id: "guide",    label: "Alerts Guide" },
];

const ALERT_TYPES = ["threshold", "anomaly", "scheduled"];
const CHANNELS    = ["Email", "Slack", "SMS", "Webhook"];
const METRICS     = ["Revenue", "Orders", "Conversion Rate", "AOV", "Return Rate", "Traffic", "Cart Abandonment", "CSAT", "Refund Rate"];

const DEFAULT_ALERTS = [
  { id: 1, name: "Revenue Drop >20%",      type: "anomaly",    active: true,  metric: "Revenue",        channel: "Slack",  recipient: "#ops-alerts", lastTriggered: "2026-06-02" },
  { id: 2, name: "Weekly Performance",     type: "scheduled",  active: true,  metric: "Revenue",        channel: "Email",  recipient: "ceo@brand.com", lastTriggered: "2026-06-09" },
  { id: 3, name: "Cart Abandon >70%",      type: "threshold",  active: false, metric: "Cart Abandonment", channel: "Email", recipient: "marketing@brand.com", lastTriggered: "2026-05-28" },
  { id: 4, name: "CSAT Below 4.0",         type: "threshold",  active: true,  metric: "CSAT",           channel: "Slack",  recipient: "#cs-team", lastTriggered: "Never" },
];

export default function ReportingAlerts() {
  const [tab, setTab]     = useState("alerts");
  const [alerts, setAlerts] = useState(DEFAULT_ALERTS);
  const [error, setError] = useState("");
  const [form, setForm]   = useState({ name: "", type: "threshold", metric: "Revenue", channel: "Email", recipient: "", threshold: "" });
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const [history] = useState([
    { id: 1, alertName: "Revenue Drop >20%", triggeredAt: "2026-06-02 09:14", resolved: true,  value: "-24%",  note: "Weekend dip — normal pattern" },
    { id: 2, alertName: "Cart Abandon >70%", triggeredAt: "2026-05-28 16:32", resolved: false, value: "74%",   note: "Checkout page speed issue" },
    { id: 3, alertName: "CSAT Below 4.0",    triggeredAt: "2026-05-15 11:00", resolved: true,  value: "3.8",   note: "CS backlog cleared" },
  ]);

  const createAlert = () => {
    if (!form.name.trim() || !form.recipient.trim()) { setError("Name and recipient are required"); return; }
    setAlerts(p => [...p, { id: Date.now(), ...form, active: true, lastTriggered: "Never" }]);
    setForm({ name: "", type: "threshold", metric: "Revenue", channel: "Email", recipient: "", threshold: "" });
    setError("");
    setTab("alerts");
  };

  const toggleAlert = (id) => setAlerts(p => p.map(a => a.id === id ? { ...a, active: !a.active } : a));
  const deleteAlert = (id) => setAlerts(p => p.filter(a => a.id !== id));

  const activeCount = alerts.filter(a => a.active).length;

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Reporting & Alerts</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>Automated alerts for revenue drops, anomalies, threshold breaches, and scheduled reports. Get notified before problems become crises.</p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Active Alerts",   value: activeCount,      color: "#4f46e5" },
          { label: "Triggered Today", value: 1,                color: "#f87171" },
          { label: "Avg Response",    value: "2.1h",           color: "#fbbf24" },
          { label: "Resolution Rate", value: "92%",            color: "#4ade80" },
        ].map(m => (
          <div key={m.label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "10px 18px" }}>
            <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase" }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      <ErrorBox message={error} />
      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "alerts" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: "#71717a" }}>{alerts.length} alerts configured, {activeCount} active</div>
            <button style={{ ...S.btn("primary"), fontSize: 11, padding: "6px 12px" }} onClick={() => setTab("create")}>+ New Alert</button>
          </div>
          {alerts.length === 0 ? (
            <EmptyState icon="🔔" title="No alerts configured" description="Create your first alert to get notified of key metric changes." />
          ) : (
            alerts.map(a => (
              <div key={a.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                      <span style={S.badge(a.type)}>{a.type}</span>
                      <span style={{ background: a.active ? "#052e16" : "#27272a", color: a.active ? "#4ade80" : "#71717a", padding: "2px 7px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{a.active ? "ACTIVE" : "PAUSED"}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>{a.name}</div>
                    <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>
                      {a.metric} · {a.channel}: {a.recipient}
                      {a.lastTriggered !== "Never" && <> · Last triggered: {a.lastTriggered}</>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button style={{ ...S.btn(a.active ? null : "green"), fontSize: 11, padding: "4px 10px" }} onClick={() => toggleAlert(a.id)}>{a.active ? "Pause" : "Enable"}</button>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px" }} onClick={() => deleteAlert(a.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "create" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>New Alert Configuration</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Alert Name</div>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={form.name} onChange={e => setF("name", e.target.value)} placeholder="Revenue Drop >20%" />
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
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Notification Channel</div>
                <select style={{ ...S.select, width: "100%" }} value={form.channel} onChange={e => setF("channel", e.target.value)}>
                  {CHANNELS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Recipient (email / Slack channel / URL)</div>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={form.recipient} onChange={e => setF("recipient", e.target.value)} placeholder="alerts@company.com" />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Threshold / Condition</div>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={form.threshold} onChange={e => setF("threshold", e.target.value)} placeholder="e.g. drop >20%, below 4.0, every Monday" />
              </div>
            </div>
            <button style={S.btn("primary")} onClick={createAlert}>Create Alert</button>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div style={{ marginTop: 20 }}>
          {history.length === 0 ? (
            <EmptyState icon="📜" title="No alert history" description="Triggered alerts will appear here." />
          ) : (
            history.map(h => (
              <div key={h.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                      <span style={{ background: h.resolved ? "#052e16" : "#3f1315", color: h.resolved ? "#4ade80" : "#f87171", padding: "2px 7px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{h.resolved ? "RESOLVED" : "OPEN"}</span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>{h.alertName}</div>
                    <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>Triggered: {h.triggeredAt} · Value: {h.value}</div>
                    {h.note && <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 2, fontStyle: "italic" }}>{h.note}</div>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Alert Strategy Guide</div>
            {[
              { t: "Alert fatigue is a real risk",             d: "Too many alerts = alerts ignored. Start with 5-10 critical alerts only. Every alert you create must have a clear action: who responds, in what timeframe, with what action." },
              { t: "Anomaly > threshold for revenue",          d: "Fixed thresholds miss context. A 20% revenue drop on Boxing Day is expected; the same drop on a Tuesday is a crisis. Anomaly detection uses historical baselines." },
              { t: "Layer alerts by severity",                 d: "Critical (revenue drop >20%, site down): immediate Slack + SMS. Warning (cart abandon up 15%): email within 1 hour. Informational: daily digest only." },
              { t: "Scheduled reports reduce ad-hoc requests", d: "A Monday morning performance report to the CEO eliminates 5+ 'how did we do this week?' Slack messages. Automate the questions you get asked repeatedly." },
              { t: "Alert resolution requires accountability",  d: "Every triggered alert should auto-assign to an owner. 'Revenue is down' with no owner = slow resolution. 'Revenue is down — assigned to ops@company.com' = fast resolution." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>🔔</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
