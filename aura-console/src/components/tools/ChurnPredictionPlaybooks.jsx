import React, { useState } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/churn-prediction-playbooks";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, minWidth: 220, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
  badge: (c) => ({ display: "inline-block", borderRadius: 5, padding: "2px 9px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: c === "low" ? "#052e16" : c === "medium" ? "#3d2a0a" : c === "high" ? "#3f1315" : "#27272a", color: c === "low" ? "#4ade80" : c === "medium" ? "#fbbf24" : c === "high" ? "#f87171" : "#a1a1aa" }),
};

const TABS = [
  { id: "analyse",  label: "Churn Analysis" },
  { id: "playbooks", label: "Playbooks" },
  { id: "segments", label: "Risk Segments" },
  { id: "guide",    label: "Retention Guide" },
];

const PLAYBOOKS = [
  {
    name: "Early Warning Intervention",
    trigger: "Customer inactive for 30+ days after 2+ purchases",
    actions: ["Send personalised win-back email with 10% loyalty discount", "Trigger support check-in if no open", "Escalate to SMS offer after 7 days no response"],
    risk: "medium",
    retention: "42%",
  },
  {
    name: "High-Value Customer Save",
    trigger: "LTV > $500, no purchase in 60 days",
    actions: ["Personal outreach from account manager", "Offer exclusive VIP product preview", "Priority free express shipping on next order"],
    risk: "high",
    retention: "67%",
  },
  {
    name: "Post-Negative Review Recovery",
    trigger: "1-2 star review submitted",
    actions: ["Immediate apology + resolution offer within 1 hour", "Full refund or replacement — no questions asked", "Follow up 14 days later with personalised discount"],
    risk: "high",
    retention: "55%",
  },
  {
    name: "Post-Purchase Churn Prevention",
    trigger: "First-time buyer, no second purchase within 45 days",
    actions: ["Day 14: Product usage tips + related product suggestions", "Day 30: 'How are you finding it?' survey + 10% next order", "Day 45: Final offer + loyalty programme invite"],
    risk: "low",
    retention: "31%",
  },
];

const RISK_SEGMENTS = [
  { segment: "Champions",    pct: "18%", desc: "Purchased recently, often, high spend",           action: "Reward + referral programme",          color: "#4ade80" },
  { segment: "Loyal",        pct: "22%", desc: "Regular buyers, good frequency",                  action: "Upsell, cross-sell opportunities",      color: "#86efac" },
  { segment: "At Risk",      pct: "15%", desc: "Above average but declining frequency",           action: "Early warning playbook — activate now", color: "#fbbf24" },
  { segment: "Hibernating",  pct: "20%", desc: "Last purchase 3+ months ago",                    action: "Win-back campaign with strong offer",   color: "#fb923c" },
  { segment: "Lost",         pct: "25%", desc: "Last purchase 6+ months, low engagement",        action: "Last-chance offer, then sunset",        color: "#f87171" },
];

const SAMPLE_QUERIES = [
  "Analyse churn risk for customers who purchased once 90 days ago and haven't returned. What are the key signals and recommended interventions?",
  "Our subscription retention rate dropped from 87% to 79% this quarter. What are likely causes and what playbooks should I activate?",
  "Build a churn prediction model framework for a $50 average order value fashion store with 60% first-time buyer rate.",
  "Which customer segments should I prioritise for retention spend given limited budget? Our cohorts: VIP (LTV $800+), Regular ($200-800), One-time (<$200).",
];

export default function ChurnPredictionPlaybooks() {
  const [tab, setTab]       = useState("analyse");
  const [query, setQuery]   = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [history, setHistory] = useState([]);
  const [selectedPlaybook, setPlaybook] = useState(null);

  const runAnalysis = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const r = await apiFetchJSON(`${API}/query`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!r.ok) throw new Error(r.error || "Analysis failed");
      setResult(r.result);
      setHistory(p => [{ query, result: r.result, ts: new Date().toISOString() }, ...p].slice(0, 10));
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Churn Prediction & Retention Playbooks</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>AI-powered churn analysis, pre-built retention playbooks, and customer risk segmentation. Identify at-risk customers before they leave and automate the right intervention at the right time.</p>
      </div>

      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* CHURN ANALYSIS */}
      {tab === "analyse" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>AI Churn Analysis Query</div>
            <textarea style={{ ...S.ta, minHeight: 120 }} value={query} onChange={e => setQuery(e.target.value)} placeholder="Describe your churn challenge or customer scenario…&#10;e.g. 'Our 30-day repurchase rate dropped from 42% to 31% this month. What are likely causes and what retention actions should I prioritise?'" />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={S.btn("primary")} onClick={runAnalysis} disabled={loading || !query.trim()}>{loading ? "Analysing…" : "Run Churn Analysis"}</button>
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => setQuery("")}>Clear</button>
            </div>
          </div>

          {!query && !result && !loading && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Sample Queries — Click to Load</div>
              {SAMPLE_QUERIES.map((q, i) => (
                <div key={i} style={S.row}>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px", flexShrink: 0 }} onClick={() => setQuery(q)}>Load</button>
                  <div style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.5 }}>{q}</div>
                </div>
              ))}
            </div>
          )}

          <ErrorBox message={error} />
          {loading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}

          {result && !loading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={S.sectionTitle}>Churn Analysis Result</div>
                <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(typeof result === "string" ? result : JSON.stringify(result, null, 2))}>Copy</button>
              </div>
              <pre style={S.pre}>{typeof result === "string" ? result : JSON.stringify(result, null, 2)}</pre>
            </div>
          )}

          {history.length > 0 && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Analysis History</div>
              {history.map((h, i) => (
                <div key={i} style={S.row}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: "#52525b" }}>{new Date(h.ts).toLocaleString()}</div>
                    <div style={{ fontSize: 12, color: "#818cf8", fontWeight: 600 }}>{h.query.slice(0, 80)}{h.query.length > 80 ? "…" : ""}</div>
                  </div>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => setQuery(h.query)}>Re-use</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PLAYBOOKS */}
      {tab === "playbooks" && (
        <div style={{ marginTop: 20 }}>
          {!selectedPlaybook ? (
            <>
              <p style={{ fontSize: 13, color: "#71717a", marginBottom: 16 }}>Pre-built retention playbooks you can activate immediately. Each playbook includes trigger conditions, action sequences, and expected retention lift.</p>
              {PLAYBOOKS.map((pb, i) => (
                <div key={i} style={{ ...S.card, cursor: "pointer", borderColor: "#3f3f46" }} onClick={() => setPlaybook(pb)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#e4e4e7", marginBottom: 6 }}>{pb.name}</div>
                      <div style={{ fontSize: 12, color: "#71717a", marginBottom: 8 }}>Trigger: {pb.trigger}</div>
                      <span style={S.badge(pb.risk)}>{pb.risk} churn risk</span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 24, fontWeight: 800, color: "#4ade80" }}>{pb.retention}</div>
                      <div style={{ fontSize: 10, color: "#52525b", textTransform: "uppercase" }}>Avg retention lift</div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div>
              <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px", marginBottom: 16 }} onClick={() => setPlaybook(null)}>← Back to Playbooks</button>
              <div style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fafafa", margin: 0, marginBottom: 6 }}>{selectedPlaybook.name}</h2>
                    <span style={S.badge(selectedPlaybook.risk)}>{selectedPlaybook.risk} churn risk</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: "#4ade80" }}>{selectedPlaybook.retention}</div>
                    <div style={{ fontSize: 11, color: "#52525b", textTransform: "uppercase" }}>Avg retention lift</div>
                  </div>
                </div>
                <div style={S.sectionTitle}>Trigger Condition</div>
                <div style={{ background: "#0d0d0f", border: "1px solid #3f3f46", borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#e4e4e7" }}>{selectedPlaybook.trigger}</div>
                <div style={S.sectionTitle}>Action Sequence</div>
                {selectedPlaybook.actions.map((a, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22", alignItems: "flex-start" }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#1e1b4b", border: "1px solid #3730a3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#818cf8", flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ fontSize: 13, color: "#e4e4e7" }}>{a}</div>
                  </div>
                ))}
                <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                  <button style={S.btn("primary")} onClick={() => { setQuery(`Customise this playbook for my store: ${selectedPlaybook.name}. Trigger: ${selectedPlaybook.trigger}`); setTab("analyse"); }}>Customise with AI</button>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => navigator.clipboard?.writeText(selectedPlaybook.actions.join("\n"))}>Copy Actions</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SEGMENTS */}
      {tab === "segments" && (
        <div style={{ marginTop: 20 }}>
          <p style={{ fontSize: 13, color: "#71717a", marginBottom: 16 }}>RFM-based customer risk segmentation. Use these segments to prioritise your retention spend and activate the right playbook for each group.</p>
          {RISK_SEGMENTS.map((seg, i) => (
            <div key={i} style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: seg.color, flexShrink: 0 }} />
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#e4e4e7" }}>{seg.segment}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: seg.color }}>{seg.pct}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#71717a", marginBottom: 8 }}>{seg.desc}</div>
                  <div style={{ fontSize: 12, color: "#818cf8", fontWeight: 600 }}>Recommended: {seg.action}</div>
                </div>
                <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px", marginLeft: 12 }} onClick={() => { setQuery(`Build a retention strategy for my ${seg.segment} customers (${seg.desc}). Recommended action: ${seg.action}`); setTab("analyse"); }}>AI Strategy</button>
              </div>
            </div>
          ))}
          <div style={S.card}>
            <div style={S.sectionTitle}>Key Churn Indicators</div>
            {[
              { signal: "Drop in purchase frequency",    weight: "High",   threshold: "> 25% decline vs previous period" },
              { signal: "Reduced email open rate",       weight: "Medium", threshold: "< 15% open rate" },
              { signal: "Support ticket volume increase", weight: "High",   threshold: "2+ tickets in 30 days" },
              { signal: "Cart abandonment spike",         weight: "Medium", threshold: "> 3 abandoned carts" },
              { signal: "No login for 30+ days",          weight: "Medium", threshold: "App/account inactive" },
              { signal: "Negative review submitted",      weight: "High",   threshold: "Any 1-2 star review" },
            ].map(r => (
              <div key={r.signal} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr", gap: 8, padding: "8px 0", borderBottom: "1px solid #1f1f22", fontSize: 12 }}>
                <span style={{ color: "#e4e4e7", fontWeight: 600 }}>{r.signal}</span>
                <span style={{ color: r.weight === "High" ? "#f87171" : "#fbbf24", fontWeight: 700 }}>{r.weight}</span>
                <span style={{ color: "#71717a" }}>{r.threshold}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GUIDE */}
      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Retention Economics</div>
            {[
              { t: "5% retention = 25-95% profit increase",       d: "Bain & Company: a 5% increase in customer retention rates increases profits by 25-95%. Prioritise retention over acquisition." },
              { t: "Cost to retain vs acquire",                   d: "Acquiring a new customer costs 5-25× more than retaining an existing one. Shift CAC budget to CRS (Customer Retention Spend) incrementally." },
              { t: "The 3-purchase loyalty threshold",            d: "Customers who make 3+ purchases have a 54% chance of making a 4th. Maximise for this milestone with post-2nd-purchase nudges." },
              { t: "Personalisation lifts retention by 15-20%",  d: "Generic win-back campaigns average 8% open rates. Personalised campaigns with specific product references average 22-28% open rates." },
              { t: "Timing matters more than offer size",        d: "A 10% offer sent within 30 days of last purchase outperforms a 20% offer sent after 90 days. Speed of intervention is key." },
              { t: "NPS as a churn early warning system",        d: "Detractors (0-6 NPS) churn at 3× the rate of promoters. Trigger immediate outreach for any NPS response below 7." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>📊</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

 // ...churn-specific state and handlers...
 return (
 <div className="aura-card flagship-churn-dashboard tool-main-flex"style={{ padding: 0, boxShadow: "0 8px 32px #0006"}}>
 {/* Header & Churn Score */}
 <div className="churn-header"style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "36px 48px 0 48px"}}>
 <div style={{ flex: 2 }}>
 <h1 style={{ fontWeight: 900, fontSize: 38, color: "var(--text-primary)", marginBottom: 8 }}>Churn Prediction & Retention Playbooks</h1>
 <div style={{ fontSize: 20, color: "var(--text-accent)", fontWeight: 700 }}>AI-powered churn scoring, segmentation, and automated retention workflows</div>
 <div style={{ marginTop: 18, fontSize: 16, color: "#4f46e5"}}>
 <b>Key Features:</b>Customer segmentation, churn risk scoring, retention playbook builder, cohort analysis, workflow triggers, real-time alerts, CRM/marketing integrations
 </div>
 </div>
 <div className="churn-score-card"style={{ background: "#18181b", borderRadius: 18, padding: "18px 32px", boxShadow: "0 2px 16px #0003", textAlign: "center", minWidth: 220 }}>
 <div style={{ fontWeight: 800, fontSize: 22, color: "#4f46e5"}}>Customer Health Score</div>
 <div style={{ fontWeight: 900, fontSize: 48, color: "#22c55e"}}>92</div>
 <div style={{ fontSize: 15, color: "#b6eaff"}}>Excellent</div>
 </div>
 </div>

 {/* Customer Segmentation & Churn Scoring */}
 <div className="churn-segmentation"style={{ padding: "32px 48px", display: "flex", gap: 32 }}>
 <div style={{ flex: 2 }}>
 <h2 style={{ fontWeight: 800, fontSize: 26, color: "var(--text-primary)", marginBottom: 18 }}>Customer Segmentation & Churn Scoring</h2>
 <div style={{ display: "flex", gap: 18, marginBottom: 18 }}>
 <input className="aura-input"style={{ flex: 2 }} placeholder="Search by name, email, or domain..."/>
 <select className="aura-input"style={{ flex: 1 }}>
 <option>Churn Risk</option>
 <option>Health Score</option>
 <option>Segment</option>
 <option>Product Line</option>
 </select>
 <button className="aura-btn"style={{ background: "#22c55e", color: "#09090b", fontWeight: 700 }}>Analyze</button>
 </div>
 {/* Cohort Analysis Chart Placeholder */}
 <div style={{ background: "#09090b", borderRadius: 18, padding: 24, minHeight: 180, marginBottom: 18 }}>
 <div style={{ fontWeight: 700, color: "#4f46e5", fontSize: 18 }}>Cohort Analysis</div>
 <div style={{ color: "#b6eaff", fontSize: 15 }}>Visualize churn rates by segment, time, and product line (interactive chart here)</div>
 </div>
 </div>
 {/* Playbook Builder & Triggers */}
 <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
 <div style={{ background: "#09090b", borderRadius: 18, padding: 18 }}>
 <div style={{ fontWeight: 700, color: "#4f46e5", fontSize: 18 }}>Retention Playbook Builder</div>
 <div style={{ color: "#b6eaff", fontSize: 15 }}>Design automated retention workflows, triggers, and actions (builder UI here)</div>
 </div>
 <div style={{ background: "#09090b", borderRadius: 18, padding: 18 }}>
 <div style={{ fontWeight: 700, color: "#4f46e5", fontSize: 18 }}>Workflow Triggers</div>
 <div style={{ color: "#b6eaff", fontSize: 15 }}>Set up triggers for churn risk, retention actions, and alerts</div>
 </div>
 </div>
 </div>

 {/* Playbook Library & Bulk Actions */}
 <div className="churn-playbook-library"style={{ padding: "32px 48px"}}>
 <h2 style={{ fontWeight: 800, fontSize: 26, color: "var(--text-primary)", marginBottom: 18 }}>Retention Playbook Library</h2>
 <div style={{ display: "flex", gap: 24 }}>
 {/* Playbook Library Placeholder */}
 <div style={{ flex: 2, background: "#09090b", borderRadius: 18, padding: 24, minHeight: 180 }}>
 <div style={{ fontWeight: 700, color: "#4f46e5", fontSize: 18 }}>Playbook Library</div>
 <div style={{ color: "#b6eaff", fontSize: 15 }}>Browse, edit, and deploy retention playbooks (library UI here)</div>
 </div>
 {/* Bulk Actions */}
 <div style={{ flex: 1, background: "#09090b", borderRadius: 18, padding: 18 }}>
 <div style={{ fontWeight: 700, color: "#4f46e5", fontSize: 18 }}>Bulk Actions</div>
 <div style={{ color: "#b6eaff", fontSize: 15 }}>Apply retention actions to multiple customers at once</div>
 </div>
 </div>
 </div>

 {/* Analytics & Executive Reporting */}
 <div className="churn-analytics-reporting"style={{ padding: "32px 48px"}}>
 <h2 style={{ fontWeight: 800, fontSize: 26, color: "var(--text-primary)", marginBottom: 18 }}>Churn Analytics & Executive Reporting</h2>
 <div style={{ display: "flex", gap: 24 }}>
 <div style={{ flex: 2, background: "#09090b", borderRadius: 18, padding: 24, minHeight: 180 }}>
 <div style={{ fontWeight: 700, color: "#4f46e5", fontSize: 18 }}>Churn Analytics Dashboard</div>
 <div style={{ color: "#b6eaff", fontSize: 15 }}>Charts, heatmaps, funnel views, trend lines (churn analytics dashboard UI here)</div>
 </div>
 <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
 <div style={{ background: "#09090b", borderRadius: 18, padding: 18 }}>
 <div style={{ fontWeight: 700, color: "#4f46e5", fontSize: 18 }}>Executive Summaries</div>
 <div style={{ color: "#b6eaff", fontSize: 15 }}>Automated, AI-generated churn insights for leadership</div>
 </div>
 <div style={{ background: "#09090b", borderRadius: 18, padding: 18 }}>
 <div style={{ fontWeight: 700, color: "#4f46e5", fontSize: 18 }}>Export & Sharing</div>
 <div style={{ color: "#b6eaff", fontSize: 15 }}>PDF, CSV, scheduled reports, live links</div>
 </div>
 </div>
 </div>
 </div>

 {/* Feedback & Collaboration */}
 <div className="churn-feedback-collab"style={{ padding: "32px 48px"}}>
 <h2 style={{ fontWeight: 800, fontSize: 26, color: "var(--text-primary)", marginBottom: 18 }}>Feedback & Collaboration</h2>
 <div style={{ display: "flex", gap: 24 }}>
 <div style={{ flex: 2, background: "#09090b", borderRadius: 18, padding: 24, minHeight: 120 }}>
 <div style={{ fontWeight: 700, color: "#4f46e5", fontSize: 18 }}>Embedded Feedback</div>
 <div style={{ color: "#b6eaff", fontSize: 15 }}>In-app surveys, NPS, CSAT, post-playbook feedback</div>
 </div>
 <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
 <div style={{ background: "#09090b", borderRadius: 18, padding: 18 }}>
 <div style={{ fontWeight: 700, color: "#4f46e5", fontSize: 18 }}>Collaboration</div>
 <div style={{ color: "#b6eaff", fontSize: 15 }}>Team notes, tagging, @mentions, audit logs</div>
 </div>
 <div style={{ background: "#09090b", borderRadius: 18, padding: 18 }}>
 <div style={{ fontWeight: 700, color: "#4f46e5", fontSize: 18 }}>Security & Compliance</div>
 <div style={{ color: "#b6eaff", fontSize: 15 }}>Role-based access, GDPR, audit logs</div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}



