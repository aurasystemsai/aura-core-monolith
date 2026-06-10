import React, { useState } from "react";
import { MozTabs, EmptyState } from "../MozUI";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
};

const TABS = [
  { id: "rfm",      label: "RFM Calculator" },
  { id: "segments", label: "Segment Library" },
  { id: "guide",    label: "Segmentation Guide" },
];

const RFM_SEGMENTS = [
  { name: "Champions",       r: "5",     f: "4-5",   m: "4-5",   color: "#4ade80", pct: "~15%", desc: "Bought recently, buy often, spend the most",             action: "Reward them. Ask for reviews. Early access offers." },
  { name: "Loyal Customers", r: "2-5",   f: "3-5",   m: "3-5",   color: "#86efac", pct: "~12%", desc: "Spend good money, buy often. Responsive to promotions",   action: "Upsell higher-value products. Ask for referrals." },
  { name: "Potential Loyalists", r: "3-5", f: "1-3", m: "1-3",   color: "#fde68a", pct: "~18%", desc: "Recent customers, spent a good amount, bought once or twice", action: "Offer membership, loyalty programme. Send personalised recommendations." },
  { name: "New Customers",   r: "4-5",   f: "<=1",   m: "<=1",   color: "#a5f3fc", pct: "~20%", desc: "Just bought for the first time",                          action: "Welcome series. Provide onboarding help. Collect feedback." },
  { name: "At Risk",         r: "2-3",   f: "2-5",   m: "2-5",   color: "#fbbf24", pct: "~10%", desc: "Above average RFM but haven't purchased recently",         action: "Win-back campaigns. Send personalised discount." },
  { name: "Hibernating",     r: "1-2",   f: "1-2",   m: "1-2",   color: "#fb923c", pct: "~15%", desc: "Last purchase was some time ago, low order count",         action: "Offer relevant product. Recreate brand value." },
  { name: "Lost",            r: "1",     f: "1-2",   m: "1-2",   color: "#f87171", pct: "~10%", desc: "Lowest RFM scores. Lost customers",                       action: "Revive interest with relevant content. Or ignore." },
];

const BEHAVIORAL_SEGMENTS = [
  { name: "First-Time Buyers",         desc: "1 purchase, no repeat",           size: "~35%", priority: "High",   note: "Convert to 2nd purchase within 45 days for best LTV growth" },
  { name: "One-and-Done Risk",         desc: "1 purchase, 45+ days ago",        size: "~20%", priority: "Urgent", note: "High churn risk — activate win-back immediately" },
  { name: "Category Loyal",            desc: "Buys same category repeatedly",   size: "~12%", priority: "Medium", note: "Cross-sell adjacent categories. High receptivity." },
  { name: "Sale Hunters",              desc: "Only buys at discount",           size: "~8%",  priority: "Low",    note: "Margin risk — avoid training with excessive discounts" },
  { name: "High AOV Low Frequency",    desc: "Big spends, rare visits",         size: "~5%",  priority: "High",   note: "Treat as VIPs despite low frequency. Premium content." },
  { name: "Subscribers/Autoship",      desc: "On recurring purchase schedule",  size: "~5%",  priority: "Protect", note: "Zero churn tolerance. White-glove retention." },
];

export default function CustomerSegmentationEngine() {
  const [tab, setTab] = useState("rfm");
  const [rfm, setRfm] = useState({ recency: "", frequency: "", monetary: "" });
  const [segmentResult, setSegmentResult] = useState(null);

  const calculateRFM = () => {
    const r = Number(rfm.recency);
    const f = Number(rfm.frequency);
    const m = Number(rfm.monetary);
    if (!r || !f || !m) return;
    // Simple RFM scoring 1-5
    const rScore = r <= 7 ? 5 : r <= 14 ? 4 : r <= 30 ? 3 : r <= 60 ? 2 : 1;
    const fScore = f >= 10 ? 5 : f >= 5 ? 4 : f >= 3 ? 3 : f >= 2 ? 2 : 1;
    const mScore = m >= 500 ? 5 : m >= 200 ? 4 : m >= 100 ? 3 : m >= 50 ? 2 : 1;
    const total = rScore + fScore + mScore;
    let segment = RFM_SEGMENTS[6]; // lost default
    if (rScore >= 4 && fScore >= 4) segment = RFM_SEGMENTS[0]; // champions
    else if (fScore >= 3 && mScore >= 3) segment = RFM_SEGMENTS[1]; // loyal
    else if (rScore >= 3 && fScore <= 2) segment = RFM_SEGMENTS[2]; // potential loyalist
    else if (rScore >= 4 && fScore <= 1) segment = RFM_SEGMENTS[3]; // new
    else if (rScore <= 3 && fScore >= 2 && rScore >= 2) segment = RFM_SEGMENTS[4]; // at risk
    else if (rScore <= 2 && fScore <= 2) segment = RFM_SEGMENTS[5]; // hibernating
    setSegmentResult({ r: rScore, f: fScore, m: mScore, total, segment });
  };

  const S2 = {
    label: { fontSize: 12, color: "#71717a", marginBottom: 4, display: "block" },
    inp: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", fontSize: 14, padding: "9px 14px", outline: "none", width: "100%" },
    score: { width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800 },
  };

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Customer Segmentation Engine</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>Automatically group customers into actionable segments using RFM analysis and behavioural patterns. Target the right customers with the right message at the right time.</p>
      </div>

      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* RFM CALCULATOR */}
      {tab === "rfm" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>RFM Score Calculator</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14 }}>Enter a customer's data to calculate their RFM score and segment.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={S2.label}>Days since last purchase (Recency)</label>
                <input style={S2.inp} type="number" min="0" value={rfm.recency} onChange={e => setRfm(p => ({ ...p, recency: e.target.value }))} placeholder="e.g. 14" />
              </div>
              <div>
                <label style={S2.label}>Total orders (Frequency)</label>
                <input style={S2.inp} type="number" min="0" value={rfm.frequency} onChange={e => setRfm(p => ({ ...p, frequency: e.target.value }))} placeholder="e.g. 4" />
              </div>
              <div>
                <label style={S2.label}>Total spend ($) (Monetary)</label>
                <input style={S2.inp} type="number" min="0" value={rfm.monetary} onChange={e => setRfm(p => ({ ...p, monetary: e.target.value }))} placeholder="e.g. 320" />
              </div>
            </div>
            <button style={S.btn("primary")} onClick={calculateRFM} disabled={!rfm.recency || !rfm.frequency || !rfm.monetary}>Calculate Segment</button>
          </div>

          {segmentResult && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={S.sectionTitle}>Segment Result</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: segmentResult.segment.color, marginBottom: 4 }}>{segmentResult.segment.name}</div>
                  <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 8 }}>{segmentResult.segment.desc}</div>
                  <div style={{ fontSize: 13, color: "#818cf8", fontWeight: 600 }}>Recommended: {segmentResult.segment.action}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["R", segmentResult.r, "#4f46e5"], ["F", segmentResult.f, "#166534"], ["M", segmentResult.m, "#7f1d1d"]].map(([label, val, bg]) => (
                    <div key={label} style={{ textAlign: "center" }}>
                      <div style={{ ...S2.score, background: bg }}>{val}</div>
                      <div style={{ fontSize: 10, color: "#52525b", marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                  <div style={{ textAlign: "center" }}>
                    <div style={{ ...S2.score, background: "#27272a", fontSize: 18 }}>{segmentResult.total}</div>
                    <div style={{ fontSize: 10, color: "#52525b", marginTop: 2 }}>Total</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={S.card}>
            <div style={S.sectionTitle}>RFM Segment Reference</div>
            {RFM_SEGMENTS.map(seg => (
              <div key={seg.name} style={S.row}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: seg.color, marginTop: 3, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{seg.name}</span>
                    <span style={{ fontSize: 11, color: "#52525b" }}>{seg.pct} of customers typically</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#71717a" }}>{seg.desc}</div>
                  <div style={{ fontSize: 11, color: "#818cf8", marginTop: 2 }}>{seg.action}</div>
                </div>
                <div style={{ fontSize: 11, color: "#52525b", flexShrink: 0, textAlign: "right" }}>
                  <div>R: {seg.r}</div><div>F: {seg.f}</div><div>M: {seg.m}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SEGMENT LIBRARY */}
      {tab === "segments" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Behavioural Segments</div>
            {BEHAVIORAL_SEGMENTS.map(seg => (
              <div key={seg.name} style={S.row}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{seg.name}</span>
                    <span style={{ background: seg.priority === "Urgent" ? "#3f1315" : seg.priority === "High" ? "#1e1b4b" : seg.priority === "Protect" ? "#052e16" : "#27272a", color: seg.priority === "Urgent" ? "#f87171" : seg.priority === "High" ? "#818cf8" : seg.priority === "Protect" ? "#4ade80" : "#a1a1aa", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{seg.priority}</span>
                    <span style={{ fontSize: 11, color: "#52525b" }}>Est. {seg.size}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#71717a" }}>{seg.desc}</div>
                  <div style={{ fontSize: 11, color: "#818cf8", marginTop: 2 }}>{seg.note}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Value-Based Tiers</div>
            {[
              { tier: "Diamond (Top 1%)",   ltv: "$2,000+",    tactics: "Dedicated account manager, exclusive products, event invitations" },
              { tier: "Platinum (Top 5%)",  ltv: "$500-2,000",  tactics: "VIP early access, complimentary shipping, priority support" },
              { tier: "Gold (Top 20%)",     ltv: "$150-500",    tactics: "Loyalty points, birthday rewards, category discounts" },
              { tier: "Silver (Top 40%)",   ltv: "$50-150",     tactics: "Welcome to loyalty programme, product recommendations" },
              { tier: "Bronze (Remaining)", ltv: "< $50",       tactics: "Educational content, first-repeat-purchase nudge" },
            ].map(t => (
              <div key={t.tier} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 8, padding: "8px 0", borderBottom: "1px solid #1f1f22", fontSize: 13 }}>
                <span style={{ fontWeight: 600, color: "#e4e4e7" }}>{t.tier}</span>
                <span style={{ color: "#4ade80", fontWeight: 700 }}>{t.ltv}</span>
                <span style={{ color: "#71717a", fontSize: 12 }}>{t.tactics}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GUIDE */}
      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Segmentation Strategy Principles</div>
            {[
              { t: "Start with 3-5 segments",          d: "More segments = more complexity. Start with Champions, Loyal, At-Risk, New, and Lost. Master these before adding micro-segments." },
              { t: "Update segments weekly",           d: "RFM scores decay. A weekly re-calculation ensures your at-risk segment catches customers before they churn, not after." },
              { t: "Segment size matters",             d: "A segment under 100 customers isn't worth an automated campaign. For small stores, consider monthly manual outreach instead." },
              { t: "Match message to segment intent",  d: "Champions want exclusivity and recognition. At-Risk want to feel valued. New customers want reassurance. Lost customers need a reason to return." },
              { t: "Test segment-specific offers",     d: "Loyal customers respond to 'Thank you' messages. At-risk respond to '10% exclusive offer'. Champions respond to 'Be first to see'. Test each message type." },
              { t: "Suppression is as important as targeting", d: "Exclude Champions from win-back campaigns. Exclude Lost from new product launches. Wrong message to wrong segment wastes budget and increases unsubscribes." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>🎯</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
