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
