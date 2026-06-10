import React, { useState, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/scheduled-export";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, minWidth: 160, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  select: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "10px 14px", outline: "none" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
};

const TABS = [
  { id: "schedule", label: "Schedule Export" },
  { id: "exports",  label: "Scheduled Exports" },
  { id: "guide",    label: "Export Guide" },
];

const REPORT_TYPES = ["Orders Report", "Customer Report", "Product Performance", "Inventory Summary", "Revenue Analytics", "Returns Report"];
const FORMATS      = ["CSV", "PDF", "Excel (.xlsx)", "JSON"];
const FREQUENCIES  = ["Daily", "Weekly (Mon)", "Weekly (Fri)", "Monthly", "Quarterly"];
const DELIVERIES   = ["Email", "Slack", "Google Drive", "Dropbox", "S3 Bucket"];

export default function ScheduledExport() {
  const [tab, setTab]       = useState("schedule");
  const [exports, setExports] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const [form, setForm] = useState({ reportType: "Orders Report", format: "CSV", frequency: "Weekly (Mon)", delivery: "Email", recipient: "" });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => { loadExports(); }, []);

  const loadExports = async () => {
    setLoading(true);
    try {
      const [exRes, anRes] = await Promise.all([
        apiFetchJSON(`${API}/exports`),
        apiFetchJSON(`${API}/analytics`),
      ]);
      if (exRes.ok) setExports(exRes.exports || []);
      if (anRes.ok) setAnalytics(anRes.analytics);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const saveExport = async () => {
    if (!form.recipient.trim()) { setError("Recipient is required"); return; }
    setSaving(true); setError("");
    try {
      const r = await apiFetchJSON(`${API}/exports`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, createdAt: new Date().toISOString() }),
      });
      if (!r.ok) throw new Error(r.error || "Save failed");
      loadExports();
      set("recipient", "");
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  const deleteExport = async (id) => {
    try {
      await apiFetchJSON(`${API}/exports/${id}`, { method: "DELETE" });
      setExports(p => p.filter(e => e.id !== id));
    } catch (e) { setError(e.message); }
  };

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Scheduled Exports</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>Automate PDF and CSV exports of your reports. Deliver to email, Slack, Google Drive, Dropbox, or S3 on any schedule.</p>
      </div>

      {analytics && (
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "10px 18px" }}>
            <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase" }}>Active Schedules</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#4f46e5" }}>{analytics.totalExports || exports.length}</div>
          </div>
        </div>
      )}

      <ErrorBox message={error} />
      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "schedule" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Report Type</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {REPORT_TYPES.map(t => (
                <button key={t} style={{ ...S.btn(t === form.reportType ? "primary" : null), fontSize: 11, padding: "5px 10px" }} onClick={() => set("reportType", t)}>{t}</button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Format</div>
                <select style={{ ...S.select, width: "100%" }} value={form.format} onChange={e => set("format", e.target.value)}>
                  {FORMATS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Frequency</div>
                <select style={{ ...S.select, width: "100%" }} value={form.frequency} onChange={e => set("frequency", e.target.value)}>
                  {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Delivery Channel</div>
                <select style={{ ...S.select, width: "100%" }} value={form.delivery} onChange={e => set("delivery", e.target.value)}>
                  {DELIVERIES.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Recipient (email / webhook / path)</div>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={form.recipient} onChange={e => set("recipient", e.target.value)} placeholder="reports@company.com" />
              </div>
            </div>

            <button style={S.btn("primary")} onClick={saveExport} disabled={saving}>{saving ? "Saving…" : "Create Scheduled Export"}</button>
          </div>
        </div>
      )}

      {tab === "exports" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: "#71717a" }}>{exports.length} scheduled exports</div>
            <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={loadExports}>Refresh</button>
          </div>
          {loading ? (
            <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>
          ) : exports.length === 0 ? (
            <EmptyState icon="📤" title="No scheduled exports" description="Create your first scheduled export in the Schedule tab." />
          ) : (
            exports.map((ex, i) => (
              <div key={ex.id || i} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>{ex.reportType}</div>
                    <div style={{ fontSize: 12, color: "#71717a", marginTop: 3 }}>
                      {ex.format} · {ex.frequency} · {ex.delivery} → {ex.recipient}
                    </div>
                    {ex.createdAt && <div style={{ fontSize: 11, color: "#52525b", marginTop: 2 }}>Created {new Date(ex.createdAt).toLocaleDateString()}</div>}
                  </div>
                  <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px" }} onClick={() => deleteExport(ex.id)}>Remove</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Export Strategy Guide</div>
            {[
              { t: "Weekly operations reports",     d: "Every Monday: Orders Report (CSV) → ops team email. Every Friday: Returns Report → ops team. This creates a weekly rhythm for reviewing performance." },
              { t: "Monthly investor reporting",    d: "Monthly Revenue Analytics (PDF) → Dropbox folder. Investors get a clean PDF without needing Shopify access. Include: revenue, AOV, orders, growth rate." },
              { t: "Finance team automation",       d: "Daily Orders Report (Excel) → accounting team email. Sync with Xero or QuickBooks workflow. Eliminates manual data pulls that waste ~2 hours/week." },
              { t: "Marketing team enablement",     d: "Weekly Product Performance (CSV) → marketing Slack channel. Lets marketing team optimise ad spend and content without asking for data." },
              { t: "Format selection guide",        d: "CSV: best for data analysis, Excel import. PDF: best for sharing with stakeholders. Excel: best for non-technical users who need formatting. JSON: best for developer integrations." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>📤</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
