import React, { useState, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/finance-autopilot";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
};

const TABS = [
  { id: "dashboard", label: "KPI Dashboard" },
  { id: "automate",  label: "AI Autopilot" },
  { id: "tax",       label: "Tax & Reconciliation" },
  { id: "budget",    label: "Budget Tracker" },
  { id: "guide",     label: "Finance Guide" },
];

const SAMPLE_PROMPTS = [
  { label: "Monthly P&L",         prompt: "Automate our monthly P&L reporting — pull from Shopify, calculate gross margin, COGS, and operating expenses. Highlight any month-over-month anomalies." },
  { label: "Cash flow forecast",  prompt: "Set up automated cash flow forecasting using the last 6 months of Shopify sales data with a 3-month rolling projection." },
  { label: "UK VAT readiness",    prompt: "Create an automated tax readiness checklist for a UK-registered Shopify store with VAT obligations and quarterly MTD returns." },
  { label: "Payout reconciliation", prompt: "Design an automated reconciliation process between Shopify payouts and our bank account deposits, flagging any discrepancies >£10." },
  { label: "SKU margin analysis", prompt: "Automate per-SKU gross margin calculation. Factor in COGS, Shopify fees (2.5% payment processing), returns rate per SKU, and flag any SKU below 40% margin." },
];

const TAX_CHECKLIST_ITEMS = [
  { task: "VAT registered (UK MTD)",              done: false, freq: "Quarterly", notes: "" },
  { task: "Quarterly VAT return filed",            done: false, freq: "Quarterly", notes: "" },
  { task: "Corporation tax provision calculated",  done: false, freq: "Monthly",   notes: "" },
  { task: "Shopify payout → bank reconciliation",  done: false, freq: "Weekly",    notes: "" },
  { task: "COGS updated for new stock",            done: false, freq: "Per order",  notes: "" },
  { task: "Returns credited in accounts",          done: false, freq: "Weekly",    notes: "" },
  { task: "Stripe / PayPal fees reconciled",       done: false, freq: "Monthly",   notes: "" },
  { task: "Year-end accounts prepared",            done: false, freq: "Annual",    notes: "" },
  { task: "R&D tax credit reviewed",               done: false, freq: "Annual",    notes: "" },
];

function computeKPIs({ revenue, cogs, adSpend, newCustomers, opex }) {
  const r = parseFloat(revenue) || 0;
  const c = parseFloat(cogs) || 0;
  const a = parseFloat(adSpend) || 0;
  const n = parseFloat(newCustomers) || 1;
  const o = parseFloat(opex) || 0;

  const grossMargin = r > 0 ? ((r - c) / r * 100).toFixed(1) : null;
  const netMargin   = r > 0 ? ((r - c - a - o) / r * 100).toFixed(1) : null;
  const cac         = n > 0 ? (a / n).toFixed(2) : null;
  const contribution = r > 0 ? ((r - c - a) / r * 100).toFixed(1) : null;

  return { grossMargin, netMargin, cac, contribution };
}

export default function FinanceAutopilot() {
  const [tab, setTab] = useState("dashboard");

  // KPI Dashboard
  const [kpiInputs, setKpiInputs] = useState({ revenue: "", cogs: "", adSpend: "", newCustomers: "", opex: "" });
  const setK = (k, v) => setKpiInputs(p => ({ ...p, [k]: v }));
  const kpis = computeKPIs(kpiInputs);

  // AI Autopilot
  const [input, setInput]       = useState("");
  const [result, setResult]     = useState(null);
  const [automations, setAutomations] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(null);

  // Tax & Reconciliation
  const [checklist, setChecklist] = useState(TAX_CHECKLIST_ITEMS.map((item, i) => ({ ...item, id: i })));
  const [reconcileNotes, setReconcileNotes] = useState("");

  // Budget Tracker
  const [budgets, setBudgets]             = useState([]);
  const [budgetForm, setBudgetForm]       = useState({ name: "", category: "Marketing", budgeted: "", actual: "", period: new Date().toISOString().slice(0, 7) });
  const setBF = (k, v) => setBudgetForm(p => ({ ...p, [k]: v }));
  const [budgetSaving, setBudgetSaving]   = useState(false);
  const [budgetDeleting, setBudgetDeleting] = useState(null);

  const [error, setError] = useState("");

  useEffect(() => { loadAutomations(); loadBudgets(); }, []);

  const loadBudgets = async () => {
    try { const r = await apiFetchJSON(`${API}/budgets`); if (r.ok) setBudgets(r.budgets || []); } catch {}
  };

  const saveBudget = async () => {
    if (!budgetForm.name.trim() || !budgetForm.budgeted) { setError("Name and budget amount are required"); return; }
    setBudgetSaving(true); setError("");
    try {
      const r = await apiFetchJSON(`${API}/budgets`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...budgetForm, createdAt: new Date().toISOString() }) });
      if (!r.ok) throw new Error(r.error || "Save failed");
      loadBudgets(); setBudgetForm(p => ({ ...p, name: "", budgeted: "", actual: "" }));
    } catch (e) { setError(e.message); }
    setBudgetSaving(false);
  };

  const deleteBudget = async (id) => {
    setBudgetDeleting(id);
    try { await apiFetchJSON(`${API}/budgets/${id}`, { method: "DELETE" }); setBudgets(p => p.filter(b => b.id !== id)); } catch {}
    setBudgetDeleting(null);
  };

  const loadAutomations = async () => {
    try {
      const r = await apiFetchJSON(`${API}/autopilots`);
      if (r.ok) setAutomations(r.autopilots || []);
    } catch {}
  };

  const runAI = async (override) => {
    const prompt = (override || input).trim();
    if (!prompt) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const r = await apiFetchJSON(`${API}/ai/suggest`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ financeData: prompt }),
      });
      if (!r.ok) throw new Error(r.error || "AI failed");
      setResult(r.result || "");
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const saveAutomation = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const r = await apiFetchJSON(`${API}/autopilots`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input, result, createdAt: new Date().toISOString() }),
      });
      if (r.ok) loadAutomations();
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  const deleteAutomation = async (id) => {
    setDeleting(id);
    try {
      await apiFetchJSON(`${API}/autopilots/${id}`, { method: "DELETE" });
      setAutomations(p => p.filter(a => a.id !== id));
    } catch {}
    setDeleting(null);
  };

  const toggleCheck = (id) => setChecklist(p => p.map(item => item.id === id ? { ...item, done: !item.done } : item));
  const doneCount   = checklist.filter(i => i.done).length;

  const getMarginColor = (v) => {
    const n = parseFloat(v);
    if (isNaN(n)) return "#71717a";
    return n >= 50 ? "#4ade80" : n >= 35 ? "#fbbf24" : "#f87171";
  };

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Finance Autopilot</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>
          Live KPI calculator, AI-powered P&L and cash flow automation, tax & reconciliation tracker. Run a tight financial operation without a full-time finance team.
        </p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Saved Automations", value: automations.length,                                color: "#4f46e5" },
          { label: "Budget Lines",      value: budgets.length,                                    color: "#4ade80" },
          { label: "Tax Tasks Done",    value: checklist.filter(i => i.done).length,              color: "#818cf8" },
          { label: "Tax Tasks Total",   value: checklist.length,                                  color: "#52525b" },
        ].map(s => (
          <div key={s.label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 20px" }}>
            <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <ErrorBox message={error} />
      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* ── KPI DASHBOARD ── */}
      {tab === "dashboard" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Input Your Numbers</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10, marginBottom: 16 }}>
              {[
                ["revenue",      "Revenue (£)",          "e.g. 85000"],
                ["cogs",         "COGS (£)",             "e.g. 32000"],
                ["adSpend",      "Ad Spend (£)",         "e.g. 12000"],
                ["newCustomers", "New Customers",        "e.g. 340"],
                ["opex",         "Other OpEx (£)",       "e.g. 8000"],
              ].map(([key, label, ph]) => (
                <div key={key}>
                  <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>{label}</label>
                  <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} type="number" value={kpiInputs[key]} onChange={e => setK(key, e.target.value)} placeholder={ph} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 16 }}>
            {[
              { label: "Gross Margin",          val: kpis.grossMargin !== null ? `${kpis.grossMargin}%` : "—", color: kpis.grossMargin !== null ? getMarginColor(kpis.grossMargin) : "#71717a", target: "> 50%" },
              { label: "Contribution Margin",   val: kpis.contribution !== null ? `${kpis.contribution}%` : "—", color: kpis.contribution !== null ? getMarginColor(kpis.contribution) : "#71717a", target: "> 35%" },
              { label: "Net Margin",            val: kpis.netMargin !== null ? `${kpis.netMargin}%` : "—",    color: kpis.netMargin !== null ? getMarginColor(kpis.netMargin) : "#71717a",    target: "> 10%" },
              { label: "CAC",                   val: kpis.cac !== null ? `£${kpis.cac}` : "—",              color: "#818cf8",                                                              target: "< 1/3 LTV" },
            ].map(({ label, val, color, target }) => (
              <div key={label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ fontSize: 10, color: "#52525b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
                <div style={{ fontSize: 32, fontWeight: 900, color, marginTop: 4 }}>{val}</div>
                <div style={{ fontSize: 11, color: "#3f3f46", marginTop: 2 }}>Target: {target}</div>
              </div>
            ))}
          </div>

          {kpis.grossMargin !== null && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Health Assessment</div>
              {[
                { label: "Gross Margin", val: parseFloat(kpis.grossMargin), good: 50, warn: 35, fmt: (v) => `${v}%`,   advice: v => v >= 50 ? "Strong gross margin. Room to invest in growth." : v >= 35 ? "Acceptable but watch ad spend carefully." : "Critical: margin too thin. Review COGS or pricing." },
                { label: "Net Margin",   val: parseFloat(kpis.netMargin),   good: 10, warn: 5,  fmt: (v) => `${v}%`,   advice: v => v >= 10 ? "Healthy net margin." : v >= 5 ? "Thin net margin. Review OpEx and ROAS." : "Negative or near-zero net margin. Immediate review needed." },
                { label: "CAC",         val: null, fmt: () => `£${kpis.cac}`, advice: () => "Compare to customer LTV. Healthy CAC:LTV ratio is 1:3 or better." },
              ].filter(item => item.val !== null || item.label === "CAC").map(({ label, val, good, warn, fmt, advice }) => (
                <div key={label} style={S.row}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: val === null ? "#818cf8" : val >= good ? "#4ade80" : val >= warn ? "#fbbf24" : "#f87171", marginTop: 6, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{label}: {fmt(val)}</div>
                    <div style={{ fontSize: 12, color: "#71717a" }}>{advice(val)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!kpiInputs.revenue && (
            <div style={{ ...S.card, border: "1px dashed #27272a", textAlign: "center", padding: "30px 24px" }}>
              <div style={{ fontSize: 14, color: "#52525b" }}>Enter your numbers above to compute live KPIs</div>
            </div>
          )}
        </div>
      )}

      {/* ── AI AUTOPILOT ── */}
      {tab === "automate" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Describe Your Finance Automation Need</div>
            <textarea style={{ ...S.ta, minHeight: 120 }} value={input} onChange={e => setInput(e.target.value)} placeholder="e.g. 'Automate our monthly gross margin calculation using Shopify revenue data. Factor in a 35% COGS rate and flag months where margin falls below 50%.'" />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={S.btn("primary")} onClick={() => runAI()} disabled={loading || !input.trim()}>{loading ? "Processing…" : "Run Finance AI"}</button>
              {result && <button style={{ ...S.btn("green"), fontSize: 11, padding: "6px 12px" }} onClick={saveAutomation} disabled={saving}>{saving ? "Saving…" : "Save"}</button>}
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => { setInput(""); setResult(null); }}>Clear</button>
            </div>
          </div>

          {!input && !result && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Automation Prompts</div>
              {SAMPLE_PROMPTS.map(({ label, prompt }) => (
                <div key={label} style={S.row}>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px", flexShrink: 0 }} onClick={() => { setInput(prompt); runAI(prompt); }}>Run</button>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#818cf8", marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 12, color: "#71717a" }}>{prompt.slice(0, 90)}…</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {loading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}

          {result && !loading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={S.sectionTitle}>AI Finance Plan</div>
                <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(result)}>Copy</button>
              </div>
              <pre style={S.pre}>{result}</pre>
            </div>
          )}

          {automations.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={S.sectionTitle}>Saved Automations ({automations.length})</div>
                <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={loadAutomations}>Refresh</button>
              </div>
              {automations.map(a => (
                <div key={a.id} style={S.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: "#52525b", marginBottom: 4 }}>{a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}</div>
                      <div style={{ fontSize: 13, color: "#e4e4e7" }}>{(a.content || "").slice(0, 120)}{(a.content || "").length > 120 ? "…" : ""}</div>
                    </div>
                    <div style={{ display: "flex", gap: 5, flexShrink: 0, marginLeft: 12 }}>
                      <button style={{ ...S.btn(), fontSize: 11, padding: "4px 8px" }} onClick={() => { setInput(a.content || ""); setTab("automate"); }}>Re-use</button>
                      <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 8px" }} onClick={() => deleteAutomation(a.id)} disabled={deleting === a.id}>{deleting === a.id ? "…" : "✕"}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAX & RECONCILIATION ── */}
      {tab === "tax" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={S.sectionTitle}>Tax & Compliance Checklist</div>
              <div style={{ fontSize: 13, color: "#71717a" }}>{doneCount}/{checklist.length} complete</div>
            </div>
            <div style={{ background: "#09090b", borderRadius: 8, height: 6, marginBottom: 16 }}>
              <div style={{ height: 6, borderRadius: 8, background: "#4f46e5", width: `${(doneCount / checklist.length) * 100}%`, transition: "width 0.3s" }} />
            </div>
            {checklist.map(item => (
              <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: "1px solid #1f1f22" }}>
                <input type="checkbox" checked={item.done} onChange={() => toggleCheck(item.id)} style={{ accentColor: "#4f46e5", width: 16, height: 16, marginTop: 2, flexShrink: 0, cursor: "pointer" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: item.done ? "#52525b" : "#e4e4e7", textDecoration: item.done ? "line-through" : "none" }}>{item.task}</div>
                  <div style={{ fontSize: 11, color: "#3f3f46" }}>{item.freq}</div>
                </div>
                <span style={{ background: "#27272a", color: "#71717a", padding: "2px 8px", borderRadius: 4, fontSize: 10, flexShrink: 0 }}>{item.freq}</span>
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>Reconciliation Notes</div>
            <textarea style={{ ...S.ta, minHeight: 100 }} value={reconcileNotes} onChange={e => setReconcileNotes(e.target.value)} placeholder="Note any reconciliation discrepancies, outstanding items, or follow-up actions…" />
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>UK E-Commerce Tax Reference</div>
            {[
              { t: "VAT threshold (UK)",       d: "£90,000 taxable turnover in any rolling 12-month period triggers mandatory VAT registration. Register proactively at £80,000 to allow setup time." },
              { t: "Making Tax Digital (MTD)", d: "All VAT-registered businesses must file via MTD-compatible software (Xero, QuickBooks, FreeAgent). Paper VAT returns are no longer accepted." },
              { t: "Corporation tax payment",  d: "Due 9 months and 1 day after your accounting period end. Large companies (>£1.5M profit) pay quarterly. Set aside ~25% of profit monthly." },
              { t: "Shopify payout timing",    d: "Shopify Payments pays out every 3 business days (UK). PayPal is immediate to PayPal balance. Reconcile each payout batch against Shopify admin reports." },
              { t: "Platform fees are deductible", d: "Shopify subscription, payment processing fees, app fees, and ad spend are all 100% deductible business expenses. Keep all receipts." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>💰</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div>
                  <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── BUDGET TRACKER ── */}
      {tab === "budget" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Add Budget Line</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 1fr 1fr 140px", gap: 10, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Line Item Name *</div>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={budgetForm.name} onChange={e => setBF("name", e.target.value)} placeholder="Facebook Ads Spend" />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Category</div>
                <select style={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "10px 14px", outline: "none", width: "100%" }} value={budgetForm.category} onChange={e => setBF("category", e.target.value)}>
                  {["Marketing", "Inventory / COGS", "Operations", "Technology", "Staffing", "Fulfilment", "Legal / Finance", "Other"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Budgeted (£) *</div>
                <input type="number" style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={budgetForm.budgeted} onChange={e => setBF("budgeted", e.target.value)} placeholder="5000" />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Actual Spend (£)</div>
                <input type="number" style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={budgetForm.actual} onChange={e => setBF("actual", e.target.value)} placeholder="4230" />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Period (YYYY-MM)</div>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={budgetForm.period} onChange={e => setBF("period", e.target.value)} placeholder="2024-01" />
              </div>
            </div>
            <button style={S.btn("primary")} onClick={saveBudget} disabled={budgetSaving || !budgetForm.name || !budgetForm.budgeted}>{budgetSaving ? "Saving…" : "Add Budget Line"}</button>
          </div>

          {budgets.length > 0 && (() => {
            const totalBudgeted = budgets.reduce((s, b) => s + (parseFloat(b.budgeted) || 0), 0);
            const totalActual   = budgets.reduce((s, b) => s + (parseFloat(b.actual) || 0), 0);
            const variance      = totalBudgeted - totalActual;
            return (
              <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                {[
                  { label: "Total Budgeted", value: `£${totalBudgeted.toLocaleString()}`,    color: "#818cf8" },
                  { label: "Total Actual",   value: `£${totalActual.toLocaleString()}`,       color: totalActual > totalBudgeted ? "#f87171" : "#4ade80" },
                  { label: "Variance",       value: `${variance >= 0 ? "+" : ""}£${Math.abs(variance).toLocaleString()}`, color: variance >= 0 ? "#4ade80" : "#f87171" },
                  { label: "Budget Lines",   value: budgets.length,                           color: "#fbbf24" },
                ].map(s => (
                  <div key={s.label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "10px 18px" }}>
                    <div style={{ fontSize: 10, color: "#71717a", textTransform: "uppercase", fontWeight: 700 }}>{s.label}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
                  </div>
                ))}
              </div>
            );
          })()}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: "#71717a" }}>{budgets.length} budget line{budgets.length !== 1 ? "s" : ""}</div>
            <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={loadBudgets}>Refresh</button>
          </div>

          {budgets.length === 0 ? (
            <div>
              <EmptyState icon="📊" title="No budget lines yet" description="Add your first budget line above to start tracking spend vs budget." />
              <div style={S.card}>
                <div style={S.sectionTitle}>Recommended Budget Structure</div>
                {[
                  { cat: "Marketing",        pct: "15–25%", desc: "Paid social, Google Ads, influencer, email tools" },
                  { cat: "Inventory/COGS",   pct: "40–55%", desc: "Product cost, packaging, raw materials" },
                  { cat: "Fulfilment",       pct: "8–15%",  desc: "Shipping, 3PL fees, returns processing" },
                  { cat: "Technology",       pct: "3–6%",   desc: "Shopify, apps, analytics, automation" },
                  { cat: "Staffing",         pct: "10–20%", desc: "FTE, contractors, freelancers" },
                  { cat: "Operations",       pct: "5–10%",  desc: "Office, utilities, insurance, admin" },
                  { cat: "Legal/Finance",    pct: "1–3%",   desc: "Accountant, legal, banking fees" },
                ].map(({ cat, pct, desc }) => (
                  <div key={cat} style={{ display: "grid", gridTemplateColumns: "160px 80px 1fr", gap: 8, padding: "8px 0", borderBottom: "1px solid #1f1f22", fontSize: 12, alignItems: "center" }}>
                    <span style={{ fontWeight: 700, color: "#e4e4e7" }}>{cat}</span>
                    <span style={{ color: "#818cf8", fontWeight: 700, textAlign: "right" }}>{pct}</span>
                    <span style={{ color: "#71717a" }}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            budgets.map(b => {
              const over   = parseFloat(b.actual) > parseFloat(b.budgeted);
              const pct    = b.budgeted ? Math.min(Math.round((parseFloat(b.actual || 0) / parseFloat(b.budgeted)) * 100), 120) : 0;
              return (
                <div key={b.id} style={{ ...S.card, borderLeft: `3px solid ${over ? "#f87171" : "#4ade80"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>{b.name}</span>
                        <span style={{ background: "#27272a", color: "#71717a", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{b.category}</span>
                        {b.period && <span style={{ fontSize: 11, color: "#52525b" }}>{b.period}</span>}
                      </div>
                      <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
                        <span style={{ fontSize: 13, color: "#71717a" }}>Budget: <strong style={{ color: "#e4e4e7" }}>£{parseFloat(b.budgeted || 0).toLocaleString()}</strong></span>
                        {b.actual && <span style={{ fontSize: 13, color: "#71717a" }}>Actual: <strong style={{ color: over ? "#f87171" : "#4ade80" }}>£{parseFloat(b.actual).toLocaleString()}</strong></span>}
                        {b.actual && <span style={{ fontSize: 13, fontWeight: 700, color: over ? "#f87171" : "#4ade80" }}>{pct}%</span>}
                      </div>
                      {b.actual && (
                        <div style={{ height: 4, background: "#27272a", borderRadius: 2 }}>
                          <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: over ? "#f87171" : "#4f46e5", borderRadius: 2 }} />
                        </div>
                      )}
                    </div>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px", flexShrink: 0, marginLeft: 12 }} onClick={() => deleteBudget(b.id)} disabled={budgetDeleting === b.id}>{budgetDeleting === b.id ? "…" : "Delete"}</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── FINANCE GUIDE ── */}
      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>E-Commerce Finance KPIs</div>
            {[
              { kpi: "Gross Margin",              formula: "(Revenue − COGS) / Revenue × 100",           target: "> 50%",      note: "Below 40% means limited room for marketing spend" },
              { kpi: "Contribution Margin",        formula: "(Revenue − COGS − Ad Spend) / Revenue × 100", target: "> 35%",    note: "The true margin after variable costs" },
              { kpi: "Net Margin",                 formula: "(Revenue − All Costs) / Revenue × 100",      target: "> 10–15%",  note: "After all OpEx, marketing, and taxes" },
              { kpi: "Customer Acquisition Cost",  formula: "Total Ad Spend / New Customers",             target: "< 1/3 LTV", note: "CAC:LTV ratio should be at least 1:3" },
              { kpi: "Return on Ad Spend (ROAS)",  formula: "Revenue from Ads / Ad Spend",               target: "> 3×",      note: "3× ROAS is sustainable for most margins" },
              { kpi: "Cash Conversion Cycle",      formula: "DIO + DSO − DPO (days)",                    target: "< 30 days", note: "Shorter cycle = better cash position" },
              { kpi: "Monthly Recurring Revenue",  formula: "Active Subscribers × Monthly Fee",          target: "Growing MoM", note: "Most predictable revenue stream" },
            ].map(({ kpi, formula, target, note }) => (
              <div key={kpi} style={S.row}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{kpi}</div>
                  <div style={{ fontSize: 11, color: "#818cf8", fontFamily: "monospace", marginTop: 2 }}>{formula}</div>
                  <div style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>{note}</div>
                </div>
                <span style={{ background: "#052e16", color: "#4ade80", padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{target}</span>
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>Finance Automation Priorities</div>
            {[
              { t: "Automate reconciliation first",        d: "Manual Shopify → bank reconciliation is the #1 time-sink for e-commerce operators. Set up automated payout reconciliation as the first finance automation." },
              { t: "Weekly cash flow dashboard",           d: "Know your runway at all times. A weekly automated cash position (current balance + next 30 days projected revenue − scheduled costs) prevents cash surprises." },
              { t: "Per-SKU margin tracking",              d: "Most stores know their blended margin but not per-SKU margin. Unprofitable SKUs are hidden drag. Automate this and review monthly." },
              { t: "Set aside tax monthly, not quarterly", d: "Set aside 25% of net revenue monthly for corporation tax and VAT. Quarterly tax surprises are cash flow killers." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>💰</span>
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
