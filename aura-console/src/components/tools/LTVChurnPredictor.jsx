import React, { useState, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/ltv-churn-predictor";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, minWidth: 160, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
  badge: (c) => ({ display: "inline-block", borderRadius: 5, padding: "2px 9px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: c === "high" ? "#052e16" : c === "med" ? "#3d2a0a" : c === "risk" ? "#3f1315" : "#27272a", color: c === "high" ? "#4ade80" : c === "med" ? "#fbbf24" : c === "risk" ? "#f87171" : "#a1a1aa" }),
};

const TABS = [
  { id: "ltv",      label: "LTV Predictions" },
  { id: "churn",    label: "Churn Risk" },
  { id: "cohorts",  label: "Cohort Tracker" },
  { id: "retention",label: "Retention Playbooks" },
  { id: "guide",    label: "Methodology" },
];

const SAMPLE_DATA = `Customer Segments (from Shopify analytics):
- 250 customers with 3+ orders in last 90 days, avg order value $85
- 800 customers with 1 order 60-90 days ago, no repeat purchase
- 120 VIP customers with 10+ lifetime orders, avg LTV $1,200
- 500 customers registered but never purchased
- 180 customers who purchased once then requested refund`;

const CHANNELS = ["Paid Social", "Organic SEO", "Email", "Referral", "Direct", "Marketplace", "Influencer"];
const EMPTY_COHORT = { cohortName: "", acquisitionChannel: "Paid Social", startDate: "", initialCustomers: "", retained: "", avgLTV: "", avgOrderValue: "", notes: "" };

export default function LTVChurnPredictor() {
  const [tab, setTab]         = useState("ltv");
  const [input, setInput]     = useState("");
  const [ltv, setLtv]         = useState([]);
  const [churn, setChurn]     = useState([]);
  const [retention, setRetention] = useState("");
  const [loading, setLoading] = useState(false);
  const [churnLoading, setChurnLoading] = useState(false);
  const [retLoading, setRetLoading]     = useState(false);
  const [error, setError]     = useState("");

  // Cohorts
  const [cohorts, setCohorts]         = useState([]);
  const [cohortForm, setCohortForm]   = useState(EMPTY_COHORT);
  const [cohortLoading, setCohortLoading] = useState(false);
  const [cohortError, setCohortError] = useState("");
  const [cohortSuccess, setCohortSuccess] = useState("");
  const [deleting, setDeleting]       = useState(null);

  useEffect(() => { loadCohorts(); }, []);

  const loadCohorts = async () => {
    try { const r = await apiFetchJSON(`${API}/cohorts`); if (r.ok) setCohorts(r.cohorts || []); } catch {}
  };

  const predictLtv = async () => {
    if (!input.trim()) return;
    setLoading(true); setError(""); setLtv([]);
    try {
      const r = await apiFetchJSON(`${API}/ltv`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input }) });
      if (!r.ok) throw new Error(r.error || "LTV prediction failed");
      setLtv(r.ltv || []);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const predictChurn = async () => {
    if (!input.trim()) return;
    setChurnLoading(true); setError(""); setChurn([]);
    try {
      const r = await apiFetchJSON(`${API}/churn`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input }) });
      if (!r.ok) throw new Error(r.error || "Churn prediction failed");
      setChurn(r.churn || []);
    } catch (e) { setError(e.message); }
    setChurnLoading(false);
  };

  const generateRetention = async () => {
    if (!input.trim()) return;
    setRetLoading(true); setError(""); setRetention("");
    try {
      const r = await apiFetchJSON(`${API}/ai/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: `Based on this customer data, create a detailed retention playbook with specific campaigns, timing, discount thresholds, and expected outcomes:\n${input}` }) });
      if (!r.ok) throw new Error(r.error || "Generation failed");
      setRetention(r.reply || "");
    } catch (e) { setError(e.message); }
    setRetLoading(false);
  };

  const runAll = async () => {
    if (!input.trim()) return;
    setLoading(true); setChurnLoading(true); setError(""); setLtv([]); setChurn([]);
    await Promise.all([
      apiFetchJSON(`${API}/ltv`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input }) }).then(r => { if (r.ok) setLtv(r.ltv || []); }).catch(() => {}),
      apiFetchJSON(`${API}/churn`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input }) }).then(r => { if (r.ok) setChurn(r.churn || []); }).catch(() => {}),
    ]);
    setLoading(false); setChurnLoading(false);
  };

  const addCohort = async () => {
    if (!cohortForm.cohortName || !cohortForm.initialCustomers) { setCohortError("Cohort name and initial customer count are required."); return; }
    setCohortLoading(true); setCohortError(""); setCohortSuccess("");
    try {
      const r = await apiFetchJSON(`${API}/cohorts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cohortForm) });
      if (!r.ok) throw new Error(r.error || "Failed");
      setCohortSuccess("Cohort added."); setCohortForm(EMPTY_COHORT); loadCohorts();
      setTimeout(() => setCohortSuccess(""), 3000);
    } catch (e) { setCohortError(e.message); }
    setCohortLoading(false);
  };

  const deleteCohort = async (id) => {
    setDeleting(id);
    try { await apiFetchJSON(`${API}/cohorts/${id}`, { method: "DELETE" }); setCohorts(p => p.filter(c => c.id !== id)); } catch {}
    setDeleting(null);
  };

  const riskColor = (risk) => risk >= 70 ? "#f87171" : risk >= 40 ? "#fbbf24" : "#4ade80";
  const riskBadge = (risk) => risk >= 70 ? "risk" : risk >= 40 ? "med" : "high";
  const retentionRate = (initial, retained) => initial ? Math.round((Number(retained) / Number(initial)) * 100) : 0;
  const retColor = (pct) => pct >= 80 ? "#4ade80" : pct >= 50 ? "#fbbf24" : "#f87171";

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>LTV & Churn Predictor</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>AI-powered customer lifetime value prediction, churn risk scoring, and cohort performance tracking. Paste customer data to get predictions, or track acquisition cohorts over time.</p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "LTV Segments",   value: ltv.length,    color: "#4ade80" },
          { label: "Churn Segments", value: churn.length,  color: "#f87171" },
          { label: "Cohorts Tracked",value: cohorts.length, color: "#818cf8" },
          { label: "High Risk",      value: churn.filter(s => (s.risk || 0) >= 70).length, color: "#f59e0b" },
        ].map(m => (
          <div key={m.label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 20px" }}>
            <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{m.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: m.color, marginTop: 2 }}>{m.value}</div>
          </div>
        ))}
      </div>

      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* LTV PREDICTIONS */}
      {tab === "ltv" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Customer Data Input</div>
            <textarea style={{ ...S.ta, minHeight: 140 }} value={input} onChange={e => setInput(e.target.value)} placeholder={SAMPLE_DATA} />
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <button style={S.btn("primary")} onClick={runAll} disabled={loading || churnLoading || !input.trim()}>{loading || churnLoading ? "Predicting…" : "Predict LTV & Churn"}</button>
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => setInput(SAMPLE_DATA)}>Load Sample</button>
            </div>
          </div>
          <ErrorBox message={error} />
          {loading ? <div style={{ textAlign: "center", padding: 40 }}><Spinner /></div> : (
            ltv.length === 0 ? (
              <EmptyState icon="💰" title="No LTV predictions yet" description="Paste customer data above and click 'Predict LTV & Churn'." />
            ) : (
              <div style={S.card}>
                <div style={S.sectionTitle}>Customer Segments by Lifetime Value</div>
                {ltv.sort((a, b) => (b.ltv || 0) - (a.ltv || 0)).map((seg, i) => (
                  <div key={i} style={{ ...S.row, alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7", marginBottom: 2 }}>{seg.name}</div>
                      <div style={{ fontSize: 12, color: "#71717a" }}>{seg.recommendation}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "#4ade80" }}>${seg.ltv || 0}</div>
                      <div style={{ fontSize: 11, color: "#52525b" }}>Confidence: {seg.confidence || 0}%</div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
          <div style={S.card}>
            <div style={S.sectionTitle}>LTV Optimisation Strategies</div>
            {[
              { t: "Win repeat purchases from 1-order customers", d: "'How was it?' email at 14 days, second-purchase incentive at day 30. Repeat customers spend 67% more than first-time buyers." },
              { t: "Implement tiered loyalty rewards",            d: "Bronze/Silver/Gold/Platinum tiers by cumulative spend. Higher tiers unlock exclusive discounts, early access, free shipping." },
              { t: "Increase AOV with product bundles",           d: "Analyse what high-LTV customers buy together and create bundles at a slight discount to lift basket value." },
              { t: "Target VIP customers for referrals",          d: "Top 10% by LTV are 5× more likely to refer friends. Give them a personalised referral code with a compelling incentive." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4ade80", fontSize: 14 }}>💰</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.5 }}>{d}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CHURN RISK */}
      {tab === "churn" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Customer Data Input</div>
            <textarea style={{ ...S.ta, minHeight: 120 }} value={input} onChange={e => setInput(e.target.value)} placeholder={SAMPLE_DATA} />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={S.btn("primary")} onClick={runAll} disabled={loading || churnLoading || !input.trim()}>{churnLoading ? "Predicting…" : "Predict Churn Risk"}</button>
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => setInput(SAMPLE_DATA)}>Load Sample</button>
            </div>
          </div>
          <ErrorBox message={error} />
          {churnLoading ? <div style={{ textAlign: "center", padding: 40 }}><Spinner /></div> : (
            churn.length === 0 ? (
              <EmptyState icon="⚠️" title="No churn predictions yet" description="Click 'Predict Churn Risk' to get risk scores for each segment." />
            ) : (
              <div style={S.card}>
                <div style={S.sectionTitle}>Churn Risk Segments</div>
                {churn.sort((a, b) => (b.risk || 0) - (a.risk || 0)).map((seg, i) => (
                  <div key={i} style={{ ...S.row, alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{seg.name}</span>
                        <span style={S.badge(riskBadge(seg.risk || 0))}>{seg.risk || 0}% risk</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#71717a", marginBottom: 4 }}>Signals: {seg.signals}</div>
                      <div style={{ fontSize: 12, color: "#4f46e5", fontStyle: "italic" }}>Action: {seg.recommendation}</div>
                    </div>
                    <div style={{ width: 60, height: 8, background: "#27272a", borderRadius: 4, marginTop: 6, flexShrink: 0 }}>
                      <div style={{ width: `${seg.risk || 0}%`, height: "100%", background: riskColor(seg.risk || 0), borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* COHORT TRACKER */}
      {tab === "cohorts" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Add Acquisition Cohort</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              {[
                { key: "cohortName",       label: "Cohort Name *",      placeholder: "Q1 2025 Paid Social" },
                { key: "startDate",        label: "Acquisition Date",   placeholder: "2025-01-01" },
                { key: "initialCustomers", label: "Initial Customers *", placeholder: "450" },
                { key: "retained",         label: "Retained Now",       placeholder: "310" },
                { key: "avgLTV",           label: "Avg LTV ($)",        placeholder: "280" },
                { key: "avgOrderValue",    label: "Avg Order Value ($)", placeholder: "65" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 3 }}>{f.label}</label>
                  <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={cohortForm[f.key]} onChange={e => setCohortForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} />
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 3 }}>Acquisition Channel</label>
                <select style={{ ...S.input, width: "100%" }} value={cohortForm.acquisitionChannel} onChange={e => setCohortForm(p => ({ ...p, acquisitionChannel: e.target.value }))}>
                  {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 3 }}>Notes</label>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={cohortForm.notes} onChange={e => setCohortForm(p => ({ ...p, notes: e.target.value }))} placeholder="e.g. Black Friday campaign" />
              </div>
            </div>
            <ErrorBox message={cohortError} />
            {cohortSuccess && <div style={{ color: "#4ade80", fontSize: 13, marginBottom: 8 }}>{cohortSuccess}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button style={S.btn("primary")} onClick={addCohort} disabled={cohortLoading}>{cohortLoading ? "Adding…" : "Add Cohort"}</button>
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => setCohortForm(EMPTY_COHORT)}>Clear</button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: "#71717a" }}>{cohorts.length} cohorts tracked</div>
            <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={loadCohorts}>Refresh</button>
          </div>

          {cohorts.length === 0 ? (
            <EmptyState icon="📈" title="No cohorts tracked yet" description="Add your first acquisition cohort to measure retention over time." />
          ) : (
            cohorts.map(c => {
              const retPct = retentionRate(c.initialCustomers, c.retained);
              const rc = retColor(retPct);
              return (
                <div key={c.id} style={{ ...S.card, borderLeft: `4px solid ${rc}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>{c.cohortName}</span>
                        <span style={{ background: "#1a1a2e", color: "#818cf8", borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 600 }}>{c.acquisitionChannel}</span>
                        {c.retained && c.initialCustomers && (
                          <span style={{ color: rc, fontSize: 13, fontWeight: 800 }}>{retPct}% retained</span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12, color: "#a1a1aa" }}>
                        <span>Initial: <strong style={{ color: "#fafafa" }}>{c.initialCustomers}</strong></span>
                        {c.retained && <span>Retained: <strong style={{ color: rc }}>{c.retained}</strong></span>}
                        {c.avgLTV && <span>Avg LTV: <strong style={{ color: "#4ade80" }}>${c.avgLTV}</strong></span>}
                        {c.avgOrderValue && <span>AOV: ${c.avgOrderValue}</span>}
                        {c.startDate && <span>{c.startDate}</span>}
                      </div>
                      {c.notes && <div style={{ fontSize: 11, color: "#52525b", marginTop: 4 }}>{c.notes}</div>}
                      {c.retained && c.initialCustomers && (
                        <div style={{ marginTop: 8, height: 4, background: "#27272a", borderRadius: 2, maxWidth: 280 }}>
                          <div style={{ width: `${retPct}%`, height: "100%", background: rc, borderRadius: 2, transition: "width 0.3s" }} />
                        </div>
                      )}
                    </div>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px", flexShrink: 0, marginLeft: 12 }} onClick={() => deleteCohort(c.id)} disabled={deleting === c.id}>{deleting === c.id ? "…" : "Delete"}</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* RETENTION PLAYBOOKS */}
      {tab === "retention" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>AI Retention Playbook Generator</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14, lineHeight: 1.6 }}>Generate a tailored retention playbook based on your customer data — specific campaigns, timing, discount thresholds and expected outcomes for each churn-risk segment.</p>
            <textarea style={{ ...S.ta, minHeight: 100 }} value={input} onChange={e => setInput(e.target.value)} placeholder={SAMPLE_DATA} />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={S.btn("primary")} onClick={generateRetention} disabled={retLoading || !input.trim()}>{retLoading ? "Generating…" : "Generate Retention Playbook"}</button>
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => setInput(SAMPLE_DATA)}>Load Sample</button>
            </div>
          </div>
          {retLoading && <div style={{ textAlign: "center", padding: 30 }}><Spinner /></div>}
          {retention && !retLoading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={S.sectionTitle}>Retention Playbook</div>
                <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(retention)}>Copy</button>
              </div>
              <pre style={S.pre}>{retention}</pre>
            </div>
          )}
          {!retention && !retLoading && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Standard Retention Campaigns</div>
              {[
                { label: "Win-Back Email Sequence (30/60/90d)", risk: "High churn risk",  d: "Day 30: 'We miss you' + 10% off. Day 60: 'Here's what's new' + 15% off. Day 90: 'Final offer' + 20% off before removing from list." },
                { label: "VIP Loyalty Upgrade",                 risk: "High LTV",         d: "Segment top 10% by spend. Send handwritten-feel personalised email, exclusive early access, free shipping for life." },
                { label: "Post-Purchase Nurture",               risk: "1-order buyers",   d: "Day 7: product tips. Day 14: ask for review. Day 21: cross-sell. Day 30: replenishment or complementary product offer." },
                { label: "Never-Purchased Re-Engagement",       risk: "Registered/no buy", d: "'Here's what you're missing' social proof email. Follow with first-purchase incentive. After 30 days with no action, sunset." },
              ].map(({ label, risk, d }) => (
                <div key={label} style={S.row}>
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{label}</span>
                      <span style={S.badge("med")}>{risk}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.5 }}>{d}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* METHODOLOGY */}
      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>LTV Calculation Methodology</div>
            <div style={{ background: "#1e1b4b", border: "1px solid #3730a3", borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontFamily: "monospace", fontSize: 13, color: "#c7d2fe" }}>
              LTV = Average Order Value × Purchase Frequency × Customer Lifespan
            </div>
            {[
              { t: "Average Order Value", d: "Total revenue ÷ number of orders. Improve by: bundles, free shipping thresholds, upsells at checkout." },
              { t: "Purchase Frequency",  d: "Number of orders ÷ unique customers. Improve by: subscription offers, replenishment reminders, loyalty programs." },
              { t: "Customer Lifespan",   d: "Average years a customer stays active. Improve by: exceptional post-purchase experience, proactive win-back campaigns." },
              { t: "Churn Rate",          d: "% of customers who stop buying in a given period. >180 days without a purchase typically indicates e-commerce churn." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <div style={{ minWidth: 160, fontWeight: 700, fontSize: 13, color: "#e4e4e7" }}>{t}</div>
                <div style={{ fontSize: 13, color: "#71717a", lineHeight: 1.5 }}>{d}</div>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Benchmarks by E-Commerce Category</div>
            {[
              { cat: "Apparel",         ltv: "$250-500",  churn: "65-75%", freq: "2.1×/yr" },
              { cat: "Beauty",          ltv: "$150-400",  churn: "55-65%", freq: "3.2×/yr" },
              { cat: "Electronics",     ltv: "$400-1200", churn: "70-80%", freq: "1.4×/yr" },
              { cat: "Home & Garden",   ltv: "$300-800",  churn: "60-70%", freq: "1.8×/yr" },
              { cat: "Health/Wellness", ltv: "$200-600",  churn: "50-60%", freq: "4.1×/yr" },
            ].map(r => (
              <div key={r.cat} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, padding: "8px 0", borderBottom: "1px solid #1f1f22", fontSize: 13 }}>
                <span style={{ fontWeight: 600, color: "#e4e4e7" }}>{r.cat}</span>
                <span style={{ color: "#4ade80" }}>LTV: {r.ltv}</span>
                <span style={{ color: "#f87171" }}>Churn: {r.churn}</span>
                <span style={{ color: "#818cf8" }}>Freq: {r.freq}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
