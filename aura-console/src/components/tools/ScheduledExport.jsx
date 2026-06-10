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
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
};

const TABS = [
  { id: "ai",      label: "AI Setup" },
  { id: "manual",  label: "Manual Schedule" },
  { id: "exports", label: "My Exports" },
  { id: "history", label: "Delivery Log" },
  { id: "guide",   label: "Export Guide" },
];

const REPORT_TYPES = ["Orders Report", "Customer Report", "Product Performance", "Inventory Summary", "Revenue Analytics", "Returns Report", "Marketing Performance", "Refund Analysis"];
const FORMATS      = ["CSV", "PDF", "Excel (.xlsx)", "JSON"];
const FREQUENCIES  = ["Daily (6am)", "Daily (8pm)", "Weekly (Mon 8am)", "Weekly (Fri 5pm)", "Monthly (1st)", "Monthly (last day)", "Quarterly"];
const DELIVERIES   = ["Email", "Slack", "Google Drive", "Dropbox", "S3 Bucket", "FTP"];

const AI_SCENARIOS = [
  { label: "Weekly ops team",        desc: "Weekly Orders Report and Returns Report every Monday morning via email to our operations team. CSV format for easy Excel import." },
  { label: "Monthly investor deck",  desc: "Monthly Revenue Analytics PDF at end of month delivered to Dropbox. For monthly board deck preparation." },
  { label: "Daily finance sync",     desc: "Daily Orders Report in Excel format every day at 8am to the accounting team email for Xero reconciliation." },
  { label: "Marketing data feed",    desc: "Weekly Product Performance CSV to a Slack channel every Friday to help marketing plan next week's ad spend." },
  { label: "S3 data pipeline",       desc: "Daily all-orders JSON export to S3 bucket for data warehouse ingestion by 7am. Needs to include all fields." },
];

export default function ScheduledExport() {
  const [tab, setTab]       = useState("ai");
  const [exports, setExports] = useState([]);
  const [runHistory, setRunHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  // AI Setup
  const [aiDesc, setAiDesc]     = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Manual form
  const [form, setForm] = useState({ reportType: "Orders Report", format: "CSV", frequency: "Weekly (Mon 8am)", delivery: "Email", recipient: "" });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => { loadExports(); loadHistory(); }, []);

  const loadExports = async () => {
    setLoading(true);
    try {
      const [exRes, anRes] = await Promise.all([apiFetchJSON(`${API}/exports`), apiFetchJSON(`${API}/analytics`)]);
      if (exRes.ok) setExports(exRes.exports || []);
      if (anRes.ok) setAnalytics(anRes.analytics);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const loadHistory = async () => {
    try { const r = await apiFetchJSON(`${API}/history`); if (r.ok) setRunHistory(r.history || []); } catch {}
  };

  const aiSetup = async () => {
    if (!aiDesc.trim()) return;
    setAiLoading(true); setError(""); setAiResult(null);
    try {
      const r = await apiFetchJSON(`${API}/ai/suggest`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ description: aiDesc }) });
      if (!r.ok && r.error) throw new Error(r.error);
      setAiResult(r.suggestion || r.result || r);
    } catch (e) { setError(e.message); }
    setAiLoading(false);
  };

  const applyAiResult = () => {
    if (!aiResult) return;
    if (typeof aiResult === "object") {
      setForm(p => ({
        ...p,
        reportType: aiResult.reportType || p.reportType,
        format:     aiResult.format     || p.format,
        frequency:  aiResult.frequency  || p.frequency,
        delivery:   aiResult.delivery   || p.delivery,
      }));
    }
    setTab("manual");
  };

  const saveExport = async () => {
    if (!form.recipient.trim()) { setError("Recipient is required"); return; }
    setSaving(true); setError("");
    try {
      const r = await apiFetchJSON(`${API}/exports`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, createdAt: new Date().toISOString() }) });
      if (!r.ok) throw new Error(r.error || "Save failed");
      loadExports(); set("recipient", ""); setTab("exports");
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  const deleteExport = async (id) => {
    try { await apiFetchJSON(`${API}/exports/${id}`, { method: "DELETE" }); setExports(p => p.filter(e => e.id !== id)); } catch (e) { setError(e.message); }
  };

  const logDelivery = async (exportId) => {
    try {
      await apiFetchJSON(`${API}/history`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ exportId, ranAt: new Date().toISOString(), status: "success", note: "Manual trigger" }) });
      loadHistory();
    } catch {}
  };

  const deleteHistory = async (id) => {
    try { await apiFetchJSON(`${API}/history/${id}`, { method: "DELETE" }); setRunHistory(p => p.filter(h => h.id !== id)); } catch {}
  };

  const successCount = runHistory.filter(h => h.status === "success").length;
  const failCount    = runHistory.filter(h => h.status === "failed").length;

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Scheduled Exports</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>Automate report delivery to your team, investors, and tools. Use AI to design the right export schedule, or configure manually. Supports email, Slack, Google Drive, Dropbox, S3, and FTP.</p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Active Schedules",   value: exports.length,  color: "#818cf8" },
          { label: "Delivery Log",       value: runHistory.length, color: "#4ade80" },
          { label: "Successful Runs",    value: successCount,    color: "#4ade80" },
          { label: "Failed Runs",        value: failCount,       color: failCount > 0 ? "#f87171" : "#52525b" },
        ].map(s => (
          <div key={s.label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 20px" }}>
            <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <ErrorBox message={error} />
      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* AI SETUP */}
      {tab === "ai" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Describe Your Export Needs</div>
            <p style={{ fontSize: 13, color: "#71717a", lineHeight: 1.6, marginBottom: 14 }}>Tell the AI what you need in plain English — who needs the data, when, in what format, and where to deliver it. The AI will configure the right export setup for you.</p>
            <textarea style={{ ...S.ta, minHeight: 110 }} value={aiDesc} onChange={e => setAiDesc(e.target.value)} placeholder="e.g. Every Monday morning I need an Orders Report in CSV sent to ops@company.com so the team can review last week's performance…" />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={S.btn("primary")} onClick={aiSetup} disabled={aiLoading || !aiDesc.trim()}>{aiLoading ? "Configuring…" : "AI Configure Export"}</button>
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => { setAiDesc(""); setAiResult(null); }}>Clear</button>
            </div>
          </div>
          {aiLoading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}
          {aiResult && !aiLoading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={S.sectionTitle}>AI Export Configuration</div>
                <button style={S.btn("primary")} onClick={applyAiResult}>Apply & Review →</button>
              </div>
              {typeof aiResult === "object" ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {Object.entries(aiResult).filter(([k]) => k !== "ok").map(([k, v]) => (
                    <div key={k} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 14px" }}>
                      <div style={{ fontSize: 10, color: "#71717a", textTransform: "uppercase", letterSpacing: 0.5 }}>{k.replace(/([A-Z])/g, " $1").trim()}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7", marginTop: 2 }}>{String(v)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <pre style={S.pre}>{String(aiResult)}</pre>
              )}
            </div>
          )}
          <div style={S.card}>
            <div style={S.sectionTitle}>Quick Scenario Templates</div>
            {AI_SCENARIOS.map(({ label, desc }) => (
              <div key={label} style={S.row}>
                <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px", flexShrink: 0 }} onClick={() => setAiDesc(desc)}>Load</button>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#818cf8", marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 12, color: "#71717a" }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MANUAL SCHEDULE */}
      {tab === "manual" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Report Type</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {REPORT_TYPES.map(t => <button key={t} style={{ ...S.btn(t === form.reportType ? "primary" : null), fontSize: 11, padding: "5px 10px" }} onClick={() => set("reportType", t)}>{t}</button>)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Format</div>
                <select style={{ ...S.select, width: "100%" }} value={form.format} onChange={e => set("format", e.target.value)}>{FORMATS.map(f => <option key={f}>{f}</option>)}</select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Schedule</div>
                <select style={{ ...S.select, width: "100%" }} value={form.frequency} onChange={e => set("frequency", e.target.value)}>{FREQUENCIES.map(f => <option key={f}>{f}</option>)}</select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Delivery Channel</div>
                <select style={{ ...S.select, width: "100%" }} value={form.delivery} onChange={e => set("delivery", e.target.value)}>{DELIVERIES.map(d => <option key={d}>{d}</option>)}</select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Recipient (email / webhook / path)</div>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={form.recipient} onChange={e => set("recipient", e.target.value)} placeholder="reports@company.com or /bucket/path" />
              </div>
            </div>
            <div style={{ background: "#1e1b4b", border: "1px solid #3730a3", borderRadius: 8, padding: "8px 14px", fontSize: 12, color: "#c7d2fe", marginBottom: 14 }}>
              Summary: <strong>{form.reportType}</strong> ({form.format}) → <strong>{form.delivery}</strong> · <strong>{form.frequency}</strong>
            </div>
            <button style={S.btn("primary")} onClick={saveExport} disabled={saving}>{saving ? "Saving…" : "Create Scheduled Export"}</button>
          </div>
        </div>
      )}

      {/* MY EXPORTS */}
      {tab === "exports" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: "#71717a" }}>{exports.length} scheduled export{exports.length !== 1 ? "s" : ""}</div>
            <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={loadExports}>Refresh</button>
          </div>
          {loading ? (
            <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>
          ) : exports.length === 0 ? (
            <div>
              <EmptyState icon="📤" title="No scheduled exports" description="Set up your first export in the AI Setup or Manual Schedule tab." />
              <div style={{ ...S.card, marginTop: 16 }}>
                <div style={S.sectionTitle}>Suggested Starter Schedule</div>
                {[
                  { label: "Monday 8am",  report: "Orders Report",      format: "CSV",   delivery: "Email → ops team" },
                  { label: "Friday 5pm",  report: "Returns Report",     format: "CSV",   delivery: "Email → ops team" },
                  { label: "Month end",   report: "Revenue Analytics",  format: "PDF",   delivery: "Dropbox → investor folder" },
                  { label: "Daily 8am",   report: "Orders Report",      format: "Excel", delivery: "Email → accounting" },
                  { label: "Weekly Fri",  report: "Product Performance", format: "CSV",  delivery: "Slack → marketing channel" },
                ].map(({ label, report, format, delivery }) => (
                  <div key={label} style={{ display: "grid", gridTemplateColumns: "100px 180px 80px 1fr", gap: 8, padding: "8px 0", borderBottom: "1px solid #1f1f22", fontSize: 12, alignItems: "center" }}>
                    <span style={{ color: "#818cf8", fontWeight: 700 }}>{label}</span>
                    <span style={{ color: "#e4e4e7" }}>{report}</span>
                    <span style={{ color: "#71717a" }}>{format}</span>
                    <span style={{ color: "#52525b" }}>{delivery}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            exports.map((ex, i) => (
              <div key={ex.id || i} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>{ex.reportType}</div>
                    <div style={{ fontSize: 12, color: "#71717a", marginTop: 3 }}>{ex.format} · {ex.frequency} · {ex.delivery} → {ex.recipient}</div>
                    {ex.createdAt && <div style={{ fontSize: 11, color: "#52525b", marginTop: 2 }}>Created {new Date(ex.createdAt).toLocaleDateString()}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={{ ...S.btn("green"), fontSize: 11, padding: "4px 10px" }} onClick={() => logDelivery(ex.id)}>Log Run</button>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px" }} onClick={() => deleteExport(ex.id)}>Remove</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* DELIVERY LOG */}
      {tab === "history" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: "#71717a" }}>{runHistory.length} delivery events · {successCount} successful · {failCount} failed</div>
            <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={loadHistory}>Refresh</button>
          </div>
          {runHistory.length === 0 ? (
            <EmptyState icon="📜" title="No delivery history" description="Delivery events will appear here when exports are triggered. Click 'Log Run' on any active export to record a manual delivery." />
          ) : (
            runHistory.map((h, i) => (
              <div key={h.id || i} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                      <span style={{ background: h.status === "success" ? "#052e16" : h.status === "failed" ? "#3f1315" : "#3d2a0a", color: h.status === "success" ? "#4ade80" : h.status === "failed" ? "#f87171" : "#fbbf24", borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{h.status || "pending"}</span>
                      {h.ranAt && <span style={{ fontSize: 11, color: "#52525b" }}>{new Date(h.ranAt).toLocaleString()}</span>}
                    </div>
                    {h.reportType && <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>{h.reportType}</div>}
                    {h.recipient && <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>→ {h.recipient}</div>}
                    {h.note && <div style={{ fontSize: 11, color: "#52525b", marginTop: 4 }}>{h.note}</div>}
                  </div>
                  <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px", flexShrink: 0, marginLeft: 12 }} onClick={() => deleteHistory(h.id)}>Remove</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* GUIDE */}
      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Export Automation Strategy</div>
            {[
              { t: "Weekly operations rhythm",       d: "Every Monday: Orders + Returns Report → ops email (CSV). Every Friday: Returns + Revenue summary → review. This creates a weekly rhythm for reviewing performance without manual work." },
              { t: "Monthly investor reporting",     d: "Revenue Analytics (PDF) → Dropbox at month end. Investors get clean reporting without Shopify access. Include: total revenue, orders, AOV, growth rate vs prior month and same month last year." },
              { t: "Daily finance reconciliation",   d: "Daily Orders Report (Excel) → accounting team email at 8am. Integrates with Xero/QuickBooks manual import workflow. Eliminates 2+ hours of weekly manual data pulling." },
              { t: "Marketing team enablement",      d: "Weekly Product Performance (CSV) → Slack at Friday close. Marketing team sees which products are performing to optimise next week's ad spend and content — no Shopify admin access required." },
              { t: "Data warehouse pipeline",        d: "Daily all-data JSON → S3 bucket at 6am. Data engineering team ingests into BigQuery/Snowflake. Time the export 1-2 hours before the warehouse pipeline triggers." },
              { t: "Delivery channel selection guide", d: "Email: simplest, best for people. Slack: great for ops teams who live in Slack. Google Drive/Dropbox: best for stakeholders needing persistent file access. S3/FTP: best for automated data pipelines." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>📤</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div></div>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Format Selection Guide</div>
            {[
              { fmt: "CSV",           best: "Data teams, Excel users, pipeline ingestion",        avoid: "Stakeholders without Excel familiarity" },
              { fmt: "PDF",           best: "Board packs, investor reports, non-technical users", avoid: "Any workflow that requires further data manipulation" },
              { fmt: "Excel (.xlsx)", best: "Finance teams, non-technical operations",            avoid: "Automated pipelines (use CSV or JSON instead)" },
              { fmt: "JSON",          best: "Data warehouses, APIs, developer integrations",      avoid: "Human-readable reports" },
            ].map(({ fmt, best, avoid }) => (
              <div key={fmt} style={S.row}>
                <span style={{ background: "#1e1b4b", color: "#818cf8", padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 700, minWidth: 60, textAlign: "center", flexShrink: 0 }}>{fmt}</span>
                <div>
                  <div style={{ fontSize: 12, color: "#4ade80" }}>Best for: {best}</div>
                  <div style={{ fontSize: 12, color: "#71717a", marginTop: 1 }}>Avoid: {avoid}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
