import React, { useState, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/finance-autopilot";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
};

const TABS = [
  { id: "automate", label: "AI Finance Autopilot" },
  { id: "saved",    label: "Saved Automations" },
  { id: "guide",    label: "Finance Guide" },
];

const SAMPLE_PROMPTS = [
  "Automate our monthly P&L reporting — pull from Shopify, calculate gross margin, COGS, and operating expenses. Highlight any month-over-month anomalies.",
  "Set up automated cash flow forecasting using the last 6 months of Shopify sales data with a 3-month rolling projection.",
  "Create an automated tax readiness checklist for a UK-registered Shopify store with VAT obligations.",
  "Design an automated reconciliation process between Shopify payouts and our bank account deposits.",
];

export default function FinanceAutopilot() {
  const [tab, setTab]           = useState("automate");
  const [input, setInput]       = useState("");
  const [result, setResult]     = useState(null);
  const [automations, setAutomations] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { loadAutomations(); loadAnalytics(); }, []);

  const loadAutomations = async () => {
    try {
      const r = await apiFetchJSON(`${API}/autopilots`);
      if (r.ok) setAutomations(r.autopilots || []);
    } catch {}
  };

  const loadAnalytics = async () => {
    try {
      const r = await apiFetchJSON(`${API}/analytics`);
      if (r.ok) setAnalytics(r.analytics);
    } catch {}
  };

  const runAI = async () => {
    if (!input.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const r = await apiFetchJSON(`${API}/ai/suggest`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ financeData: input }),
      });
      if (!r.ok) throw new Error(r.error || "AI failed");
      setResult(r.result || "");
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const saveAutomation = async () => {
    if (!result) return;
    try {
      await apiFetchJSON(`${API}/autopilots`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input, result, createdAt: new Date().toISOString() }),
      });
      loadAutomations(); loadAnalytics();
    } catch (e) { setError(e.message); }
  };

  const deleteAutomation = async (id) => {
    setDeleting(id);
    try {
      await apiFetchJSON(`${API}/autopilots/${id}`, { method: "DELETE" });
      setAutomations(p => p.filter(a => a.id !== id));
    } catch {}
    setDeleting(null);
  };

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Finance Autopilot</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>AI-powered financial automation for Shopify stores — automate P&L reporting, cash flow forecasting, tax readiness, and payment reconciliation without a dedicated finance team.</p>
      </div>

      {analytics && (
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 20px" }}>
            <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Saved Automations</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#4f46e5", marginTop: 2 }}>{analytics.totalAutopilots || 0}</div>
          </div>
        </div>
      )}

      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* AI FINANCE AUTOPILOT */}
      {tab === "automate" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Describe Your Finance Automation Need</div>
            <textarea style={{ ...S.ta, minHeight: 120 }} value={input} onChange={e => setInput(e.target.value)} placeholder="e.g. 'Automate our monthly gross margin calculation using Shopify revenue data. Factor in a 35% average COGS rate and flag months where margin falls below 50%.'" />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={S.btn("primary")} onClick={runAI} disabled={loading || !input.trim()}>{loading ? "Processing…" : "Run Finance AI"}</button>
              {result && <button style={{ ...S.btn("green"), fontSize: 11, padding: "6px 12px" }} onClick={saveAutomation}>Save Automation</button>}
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => setInput("")}>Clear</button>
            </div>
          </div>

          {!input && !result && !loading && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Sample Automation Prompts</div>
              {SAMPLE_PROMPTS.map((p, i) => (
                <div key={i} style={S.row}>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px", flexShrink: 0 }} onClick={() => setInput(p)}>Load</button>
                  <div style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.5 }}>{p}</div>
                </div>
              ))}
            </div>
          )}

          <ErrorBox message={error} />
          {loading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}

          {result && !loading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={S.sectionTitle}>AI Finance Automation Plan</div>
                <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(result)}>Copy</button>
              </div>
              <pre style={S.pre}>{result}</pre>
            </div>
          )}
        </div>
      )}

      {/* SAVED AUTOMATIONS */}
      {tab === "saved" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "#71717a" }}>{automations.length} saved automations</div>
            <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={loadAutomations}>Refresh</button>
          </div>
          {automations.length === 0 ? (
            <EmptyState icon="⚙️" title="No saved automations yet" description="Run the Finance Autopilot and save results to build your automation library." />
          ) : (
            automations.map(a => (
              <div key={a.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, marginRight: 12 }}>
                    <div style={{ fontSize: 12, color: "#52525b", marginBottom: 4 }}>{a.createdAt ? new Date(a.createdAt).toLocaleString() : "Saved automation"}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7", marginBottom: 6 }}>{(a.content || "").slice(0, 100)}{(a.content || "").length > 100 ? "…" : ""}</div>
                    {a.result && <div style={{ fontSize: 12, color: "#a1a1aa" }}>{a.result.slice(0, 200)}{a.result.length > 200 ? "…" : ""}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => { setInput(a.content || ""); setTab("automate"); }}>Re-use</button>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px" }} onClick={() => deleteAutomation(a.id)} disabled={deleting === a.id}>{deleting === a.id ? "…" : "Delete"}</button>
                  </div>
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
            <div style={S.sectionTitle}>E-Commerce Finance KPIs</div>
            {[
              { kpi: "Gross Margin",           formula: "(Revenue – COGS) / Revenue × 100",         target: "> 50%",    note: "Below 40% means limited room for marketing spend" },
              { kpi: "Net Margin",             formula: "(Revenue – All Costs) / Revenue × 100",     target: "> 10-15%", note: "After all OpEx, marketing, and taxes" },
              { kpi: "Customer Acquisition Cost", formula: "Total Marketing Spend / New Customers",  target: "< 1/3 LTV", note: "CAC:LTV ratio should be at least 1:3" },
              { kpi: "Monthly Recurring Revenue", formula: "Subscriptions × Monthly Fee",             target: "Growing MoM", note: "Most predictable revenue metric" },
              { kpi: "Cash Conversion Cycle",   formula: "DIO + DSO – DPO",                          target: "< 30 days", note: "Shorter cycle = better cash position" },
              { kpi: "Return on Ad Spend",      formula: "Revenue from Ads / Ad Spend",              target: "> 3×",      note: "3× ROAS = sustainable for most margins" },
            ].map(r => (
              <div key={r.kpi} style={S.row}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{r.kpi}</div>
                  <div style={{ fontSize: 11, color: "#818cf8", fontFamily: "monospace", marginTop: 2 }}>{r.formula}</div>
                  <div style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>{r.note}</div>
                </div>
                <span style={{ background: "#052e16", color: "#4ade80", padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>Target: {r.target}</span>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Finance Automation Priorities</div>
            {[
              { t: "Automate reconciliation first",     d: "Manual reconciliation is the #1 time-sink for e-commerce operators. Shopify → bank reconciliation should run automatically, daily." },
              { t: "Weekly cash flow dashboards",       d: "Know your runway at all times. A weekly automated cash position report takes 30 minutes to set up and saves hours of spreadsheet work." },
              { t: "Automate VAT/tax tracking",         d: "Track tax-collected vs tax-owed automatically, by jurisdiction. Surprises at year-end are avoidable with monthly automated reporting." },
              { t: "Gross margin by product/SKU",       d: "Most stores know their overall margin but not per-SKU. Automate this — unprofitable SKUs are hidden drag on the business." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>💰</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

 const [input, setInput] = useState("");
 const [result, setResult] = useState("");
 const [tasks, setTasks] = useState([]);
 const [analytics, setAnalytics] = useState([]);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 const [imported, setImported] = useState(null);
 const [exported, setExported] = useState(null);
 const [showOnboarding, setShowOnboarding] = useState(false);
 const [darkMode, setDarkMode] = useState(false);
 const fileInputRef = useRef();

 // Fetch tasks
 const fetchTasks = async () => {
 setLoading(true);
 setError("");
 try {
 const res = await fetch("/api/finance-autopilot/tasks");
 const data = await res.json();
 if (!data.ok) throw new Error(data.error || "Unknown error");
 setTasks(data.tasks || []);
 } catch (err) {
 setError(err.message);
 } finally {
 setLoading(false);
 }
 };

 // Fetch analytics
 const fetchAnalytics = async () => {
 setLoading(true);
 setError("");
 try {
 const res = await fetch("/api/finance-autopilot/analytics");
 const data = await res.json();
 if (!data.ok) throw new Error(data.error || "Unknown error");
 setAnalytics(data.analytics || []);
 } catch (err) {
 setError(err.message);
 } finally {
 setLoading(false);
 }
 };

 // AI Generate
 const handleGenerate = async () => {
 setLoading(true);
 setError("");
 setResult("");
 try {
 const res = await fetch("/api/finance-autopilot/ai/generate", {
 method: "POST",
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify({ input })
 });
 const data = await res.json();
 if (!data.ok) throw new Error(data.error || "Unknown error");
 setResult(data.result || "No task generated");
 fetchTasks();
 } catch (err) {
 setError(err.message);
 } finally {
 setLoading(false);
 }
 };

 // CRUD
 const handleAddTask = async () => {
 setLoading(true);
 setError("");
 try {
 const res = await fetch("/api/finance-autopilot/tasks", {
 method: "POST",
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify({ content: result })
 });
 const data = await res.json();
 if (!data.ok) throw new Error(data.error || "Unknown error");
 fetchTasks();
 } catch (err) {
 setError(err.message);
 } finally {
 setLoading(false);
 }
 };

 // Import/Export
 const handleImport = e => {
 const file = e.target.files[0];
 if (!file) return;
 const reader = new FileReader();
 reader.onload = async evt => {
 try {
 const res = await fetch("/api/finance-autopilot/import", {
 method: "POST",
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify({ data: JSON.parse(evt.target.result) })
 });
 const data = await res.json();
 if (!data.ok) throw new Error(data.error || "Unknown error");
 setImported(file.name);
 fetchTasks();
 } catch (err) {
 setError(err.message);
 }
 };
 reader.readAsText(file);
 };
 const handleExport = () => {
 const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json"});
 const url = URL.createObjectURL(blob);
 setExported(url);
 setTimeout(() =>URL.revokeObjectURL(url), 10000);
 };

 // Onboarding
 const onboardingContent = (
 <div style={{ padding: 24, background: darkMode ? "#09090b": "#f4f4f5", borderRadius: 12, marginBottom: 18 }}>
 <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Finance Autopilot</h3>
 <ul style={{ margin: "16px 0 0 18px", color: darkMode ? "#a3e635": "#52525b", fontSize: 16 }}>
 <li>Generate, import, and manage finance tasks with AI</li>
 <li>Analyze performance with real-time analytics</li>
 <li>Collaborate and share with your team</li>
 <li>Accessible, secure, and fully compliant</li>
 </ul>
 <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: "#09090b", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer"}}>Get Started</button>
 </div>
 );

 React.useEffect(() => {
 fetchTasks();
 fetchAnalytics();
 }, []);

 return (
 <div style={{
 
 margin: "40px auto",
 background: darkMode ? "#18181b": "#fff",
 borderRadius: 18,
 boxShadow: "0 2px 24px #0002",
 padding: 36,
 color: darkMode ? "#a3e635": "#09090b",
 fontFamily: 'Inter, sans-serif',
 transition: "background 0.3s, color 0.3s"}}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
 <h2 style={{ fontWeight: 800, fontSize: 32, margin: 0 }}>Finance Autopilot</h2>
 <button onClick={() => setDarkMode(d => !d)} aria-label="Toggle dark mode"style={{ background: "#09090b", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer"}}>{darkMode ? "Light": "Dark"} Mode</button>
 </div>
 <div style={{ marginBottom: 10, color: darkMode ? "#a3e635": "#0ea5e9", fontWeight: 600 }}>
 <span role="img"aria-label="robot"></span>Generate, manage, and analyze finance tasks with AI and analytics.
 </div>
 <button onClick={() => setShowOnboarding(true)} style={{ background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginBottom: 16 }}>{showOnboarding ? "Hide": "Show"} Onboarding</button>
 {showOnboarding && onboardingContent}
 <textarea
 value={input}
 onChange={e => setInput(e.target.value)}
 rows={4}
 style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555": "1px solid #ccc", marginBottom: 18, background: darkMode ? "#09090b": "#fff", color: darkMode ? "#a3e635": "#09090b"}}
 placeholder="Describe your finance task or workflow here..."aria-label="Finance task input"/>
 <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
 <button onClick={handleGenerate} disabled={loading || !input} style={{ background: "#a3e635", color: "#09090b", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer"}}>{loading ? "Generating...": "AI Generate"}</button>
 <button onClick={handleAddTask} disabled={!result} style={{ background: "#4f46e5", color: "#09090b", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer"}}>Save Task</button>
 <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#09090b", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer"}}>Import</button>
 <input ref={fileInputRef} type="file"accept=".json"style={{ display: "none"}} onChange={handleImport} aria-label="Import tasks"/>
 <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer"}}>Export</button>
 {exported && <a href={exported} download="tasks.json"style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 600 }}>Download</a>}
 </div>
 {imported && <div style={{ color: "#22c55e", marginBottom: 8 }}>Imported: {imported}</div>}
 {result && (
 <div style={{ background: darkMode ? "#09090b": "#f4f4f5", borderRadius: 10, padding: 16, marginBottom: 12, color: darkMode ? "#a3e635": "#09090b"}}>
 <div style={{ fontWeight: 600, marginBottom: 4 }}>AI Task:</div>
 <div>{result}</div>
 </div>
 )}
 {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
 <div style={{ marginTop: 24, background: darkMode ? "#18181b": "#fff", borderRadius: 12, padding: 18, border: "1px solid #27272a"}}>
 <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10, color: darkMode ? "#e4e4e7": "#09090b"}}>Tasks</div>
 {tasks.map(t => (
 <div key={t.id} style={{ background: darkMode ? "#09090b": "#fafafa", borderRadius: 8, padding: "10px 14px", marginBottom: 8, border: "1px solid #27272a"}}>
 <span style={{ fontWeight: 600, color: darkMode ? "#e4e4e7": "#09090b"}}>{t.content ? t.content.slice(0, 80) + (t.content.length > 80 ? "": "") : `Task #${t.id}`}</span>
 </div>
 ))}
 </div>
 <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap"}}>
 <div style={{ background: "#27272a", borderRadius: 10, padding: "12px 20px", border: "1px solid #27272a"}}>
 <div style={{ fontSize: 11, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Total Tasks</div>
 <div style={{ fontSize: 26, fontWeight: 800, color: "#a3e635", marginTop: 2 }}>{tasks.length}</div>
 </div>
 <div style={{ background: "#27272a", borderRadius: 10, padding: "12px 20px", border: "1px solid #27272a"}}>
 <div style={{ fontSize: 11, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Events</div>
 <div style={{ fontSize: 26, fontWeight: 800, color: "#a3e635", marginTop: 2 }}>{analytics.length}</div>
 </div>
 </div>
 <div style={{ marginTop: 32, fontSize: 13, color: darkMode ? "#a3e635": "#71717a", textAlign: "center"}}>
 <span>Best-in-class SaaS features. Feedback? <a href="mailto:support@aura-core.ai"style={{ color: darkMode ? "#a3e635": "#0ea5e9", textDecoration: "underline"}}>Contact Support</a></span>
 </div>
 </div>
 );
}





