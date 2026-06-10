import React, { useState } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/ltv-churn-predictor";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
  badge: (c) => ({ display: "inline-block", borderRadius: 5, padding: "2px 9px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: c === "high" ? "#052e16" : c === "med" ? "#3d2a0a" : c === "risk" ? "#3f1315" : "#27272a", color: c === "high" ? "#4ade80" : c === "med" ? "#fbbf24" : c === "risk" ? "#f87171" : "#a1a1aa" }),
};

const TABS = [
  { id: "ltv",       label: "LTV Predictions" },
  { id: "churn",     label: "Churn Risk" },
  { id: "retention", label: "Retention Playbooks" },
  { id: "guide",     label: "Methodology" },
];

const SAMPLE_DATA = `Customer Segments (from Shopify analytics):
- 250 customers with 3+ orders in last 90 days, avg order value $85
- 800 customers with 1 order 60-90 days ago, no repeat purchase
- 120 VIP customers with 10+ lifetime orders, avg LTV $1,200
- 500 customers registered but never purchased
- 180 customers who purchased once then requested refund`;

export default function LTVChurnPredictor() {
  const [tab, setTab]       = useState("ltv");
  const [input, setInput]   = useState("");
  const [ltv, setLtv]       = useState([]);
  const [churn, setChurn]   = useState([]);
  const [retention, setRetention] = useState("");
  const [loading, setLoading] = useState(false);
  const [churnLoading, setChurnLoading] = useState(false);
  const [retLoading, setRetLoading] = useState(false);
  const [error, setError]   = useState("");

  const predictLtv = async () => {
    if (!input.trim()) return;
    setLoading(true); setError(""); setLtv([]);
    try {
      const r = await apiFetchJSON(`${API}/ltv`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      if (!r.ok) throw new Error(r.error || "LTV prediction failed");
      setLtv(r.ltv || []);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const predictChurn = async () => {
    if (!input.trim()) return;
    setChurnLoading(true); setError(""); setChurn([]);
    try {
      const r = await apiFetchJSON(`${API}/churn`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      if (!r.ok) throw new Error(r.error || "Churn prediction failed");
      setChurn(r.churn || []);
    } catch (e) { setError(e.message); }
    setChurnLoading(false);
  };

  const generateRetention = async () => {
    if (!input.trim()) return;
    setRetLoading(true); setError(""); setRetention("");
    try {
      const r = await apiFetchJSON(`${API}/ai/generate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `Based on this customer data, create a detailed retention playbook with specific campaigns, timing, discount thresholds, and expected outcomes:\n${input}` }),
      });
      if (!r.ok) throw new Error(r.error || "Generation failed");
      setRetention(r.reply || "");
    } catch (e) { setError(e.message); }
    setRetLoading(false);
  };

  const runAll = async () => {
    if (!input.trim()) return;
    await Promise.all([predictLtv(), predictChurn()]);
  };

  const riskColor = (risk) => risk >= 70 ? "#f87171" : risk >= 40 ? "#fbbf24" : "#4ade80";
  const riskBadge = (risk) => risk >= 70 ? "risk" : risk >= 40 ? "med" : "high";

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>LTV & Churn Predictor</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>AI-powered customer lifetime value prediction and churn risk scoring. Paste customer data or segment descriptions to get predictions, risk rankings and retention playbooks.</p>
      </div>

      <div style={S.card}>
        <div style={S.sectionTitle}>Customer Data Input</div>
        <textarea style={{ ...S.ta, minHeight: 160 }} value={input} onChange={e => setInput(e.target.value)} placeholder={SAMPLE_DATA} />
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <button style={S.btn("primary")} onClick={runAll} disabled={loading || churnLoading || !input.trim()}>{loading || churnLoading ? "Predicting…" : "Predict LTV & Churn"}</button>
          <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => setInput(SAMPLE_DATA)}>Load Sample Data</button>
        </div>
      </div>

      <ErrorBox message={error} />

      {(ltv.length > 0 || churn.length > 0) && (
        <>
          {/* Summary bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10, marginBottom: 20 }}>
            {[
              { label: "LTV Segments",    value: ltv.length,    color: "#4f46e5" },
              { label: "Churn Segments",  value: churn.length,  color: "#f87171" },
              { label: "High-Value Segs", value: ltv.filter(s => (s.confidence || 0) >= 70).length, color: "#4ade80" },
              { label: "High-Risk Segs",  value: churn.filter(s => (s.risk || 0) >= 70).length,     color: "#f59e0b" },
            ].map(m => (
              <div key={m.label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: m.color }}>{m.value}</div>
              </div>
            ))}
          </div>

          <MozTabs tabs={TABS} active={tab} onChange={setTab} />

          {/* LTV */}
          {tab === "ltv" && (
            <div style={{ marginTop: 20 }}>
              {loading ? <div style={{ textAlign: "center", padding: 40 }}><Spinner /></div> : (
                ltv.length === 0 ? (
                  <EmptyState icon="💰" title="No LTV predictions yet" description="Click 'Predict LTV & Churn' above with your customer data." />
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
                  { t: "Win repeat purchases from 1-order customers", d: "Send a 'How was it?' email 14 days post-purchase, then a second-purchase incentive at day 30. Repeat customers spend 67% more than first-time buyers." },
                  { t: "Implement tiered loyalty rewards", d: "Segment by cumulative spend: Bronze/Silver/Gold/Platinum. Higher tiers unlock exclusive discounts, early access, and free shipping to increase purchase frequency." },
                  { t: "Increase average order value with bundles", d: "Analyse what high-LTV customers typically buy together and create product bundles at a slight discount." },
                  { t: "Target VIP customers for referrals", d: "Your top 10% of customers by LTV are 5x more likely to refer friends. Give them a personalised referral code with a compelling incentive." },
                ].map(({ t, d }) => (
                  <div key={t} style={S.row}>
                    <span style={{ color: "#4ade80", fontSize: 14 }}>💰</span>
                    <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.5 }}>{d}</div></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CHURN */}
          {tab === "churn" && (
            <div style={{ marginTop: 20 }}>
              {churnLoading ? <div style={{ textAlign: "center", padding: 40 }}><Spinner /></div> : (
                churn.length === 0 ? (
                  <EmptyState icon="⚠️" title="No churn predictions yet" description="Click 'Predict LTV & Churn' to get risk scores." />
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

          {/* RETENTION */}
          {tab === "retention" && (
            <div style={{ marginTop: 20 }}>
              <div style={S.card}>
                <div style={S.sectionTitle}>AI Retention Playbook Generator</div>
                <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14, lineHeight: 1.6 }}>Generate a tailored retention playbook based on your customer data — specific campaigns, timing, discount thresholds and expected outcomes for each churn-risk segment.</p>
                <button style={S.btn("primary")} onClick={generateRetention} disabled={retLoading || !input.trim()}>{retLoading ? "Generating…" : "Generate Retention Playbook"}</button>
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
                    { label: "Win-Back Email Sequence (30/60/90d)", risk: "High churn risk", d: "Day 30: 'We miss you' + 10% off. Day 60: 'Here's what's new' + 15% off. Day 90: 'Final offer' + 20% off before removing from list." },
                    { label: "VIP Loyalty Upgrade",                 risk: "High LTV",        d: "Segment your top 10% by spend. Send handwritten-feel personalised email, exclusive early access to new products, free shipping for life." },
                    { label: "Post-Purchase Nurture",               risk: "1-order buyers",   d: "Day 7: product tips email. Day 14: ask for review. Day 21: cross-sell recommendation. Day 30: replenishment or complementary product offer." },
                    { label: "Never-Purchased Re-Engagement",       risk: "Registered/no buy", d: "Send 'Here's what you're missing' social proof email. Follow with first-purchase incentive. If no action in 30 days, sunset the email." },
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

          {/* GUIDE */}
          {tab === "guide" && (
            <div style={{ marginTop: 20 }}>
              <div style={S.card}>
                <div style={S.sectionTitle}>LTV Calculation Methodology</div>
                <div style={{ background: "#1e1b4b", border: "1px solid #3730a3", borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontFamily: "monospace", fontSize: 13, color: "#c7d2fe" }}>
                  LTV = Average Order Value × Purchase Frequency × Customer Lifespan
                </div>
                {[
                  { t: "Average Order Value", d: "Total revenue ÷ number of orders. Improve by: bundles, free shipping thresholds, upsells at checkout." },
                  { t: "Purchase Frequency", d: "Number of orders ÷ number of unique customers. Improve by: subscription offers, replenishment reminders, loyalty programs." },
                  { t: "Customer Lifespan", d: "Average number of years a customer stays active. Improve by: exceptional post-purchase experience, proactive win-back campaigns." },
                  { t: "Churn Rate",         d: "% of customers who stop buying in a given period. For e-commerce, >180 days without a purchase typically indicates churn." },
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
                  { cat: "Apparel",    ltv: "$250-500",    churn: "65-75%", freq: "2.1x" },
                  { cat: "Beauty",     ltv: "$150-400",    churn: "55-65%", freq: "3.2x" },
                  { cat: "Electronics",ltv: "$400-1200",   churn: "70-80%", freq: "1.4x" },
                  { cat: "Home & Garden", ltv: "$300-800", churn: "60-70%", freq: "1.8x" },
                  { cat: "Health/Wellness", ltv: "$200-600", churn: "50-60%", freq: "4.1x" },
                ].map(r => (
                  <div key={r.cat} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, padding: "8px 0", borderBottom: "1px solid #1f1f22", fontSize: 13 }}>
                    <span style={{ fontWeight: 600, color: "#e4e4e7" }}>{r.cat}</span>
                    <span style={{ color: "#4ade80" }}>LTV: {r.ltv}</span>
                    <span style={{ color: "#f87171" }}>Churn: {r.churn}</span>
                    <span style={{ color: "#818cf8" }}>Freq: {r.freq}/yr</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !churnLoading && ltv.length === 0 && churn.length === 0 && !error && (
        <EmptyState icon="📈" title="Paste customer data to get predictions" description="Describe your customer segments, order history, or paste a data export. AI predicts LTV and churn risk for each segment." />
      )}
    </div>
  );
}
