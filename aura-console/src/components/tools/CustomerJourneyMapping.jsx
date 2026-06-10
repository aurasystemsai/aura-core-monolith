import React, { useState } from "react";
import { MozTabs } from "../MozUI";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
};

const TABS = [
  { id: "map",      label: "Journey Map" },
  { id: "dropoff",  label: "Drop-off Analysis" },
  { id: "guide",    label: "CX Guide" },
];

const DEFAULT_JOURNEY = [
  { stage: "Awareness",     channel: "Social / SEO / Paid",    action: "Discovers brand",          emotion: "Curious",     convRate: "100%", dropRate: "0%",   color: "#818cf8" },
  { stage: "Consideration", channel: "Website / Email",        action: "Researches, browses",      emotion: "Interested",  convRate: "40%",  dropRate: "60%",  color: "#4f46e5" },
  { stage: "Intent",        channel: "Product pages / Cart",   action: "Adds to cart",             emotion: "Excited",     convRate: "25%",  dropRate: "38%",  color: "#fbbf24" },
  { stage: "Purchase",      channel: "Checkout",               action: "Completes order",          emotion: "Committed",   convRate: "18%",  dropRate: "28%",  color: "#4ade80" },
  { stage: "Post-Purchase", channel: "Email / Packaging",      action: "Receives & reviews order", emotion: "Satisfied",   convRate: "18%",  dropRate: "0%",   color: "#86efac" },
  { stage: "Loyalty",       channel: "Loyalty / Retargeting",  action: "Returns to buy again",     emotion: "Loyal",       convRate: "10%",  dropRate: "44%",  color: "#22d3ee" },
  { stage: "Advocacy",      channel: "Referral / Reviews",     action: "Recommends brand",         emotion: "Proud",       convRate: "5%",   dropRate: "50%",  color: "#f0abfc" },
];

const DROPOFF_INSIGHTS = [
  { stage: "Awareness → Consideration", rate: "60%", causes: ["Poor ad targeting", "Weak landing page copy", "Slow page load"], fixes: ["Sharpen audience targeting", "Test 3 headline variants", "Improve Core Web Vitals"] },
  { stage: "Consideration → Intent",   rate: "38%", causes: ["Weak product descriptions", "No social proof", "Confusing navigation"], fixes: ["Add customer reviews to PDP", "Add comparison table", "Simplify menu structure"] },
  { stage: "Intent → Purchase",         rate: "28%", causes: ["Cart abandonment (unexpected costs)", "Complex checkout", "Payment concerns"], fixes: ["Show shipping cost upfront", "Enable guest checkout", "Add trust badges"] },
  { stage: "Purchase → Loyalty",        rate: "44%", causes: ["No follow-up", "Average post-purchase experience", "No loyalty incentive"], fixes: ["Welcome series (Day 1/7/14/30)", "Packaging that delights", "Loyalty programme launch"] },
];

export default function CustomerJourneyMapping() {
  const [tab, setTab] = useState("map");
  const [journey, setJourney] = useState(DEFAULT_JOURNEY);
  const [editStage, setEditStage] = useState(null);
  const [editVal, setEditVal] = useState({});

  const startEdit = (i) => { setEditStage(i); setEditVal({ ...journey[i] }); };
  const saveEdit = () => { setJourney(j => j.map((s, i) => i === editStage ? editVal : s)); setEditStage(null); };

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Customer Journey Mapping</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>Visualise and optimise every step of your customer's experience from first touch to loyal advocate. Identify drop-off points and deploy targeted fixes.</p>
      </div>

      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* JOURNEY MAP */}
      {tab === "map" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={S.sectionTitle}>Customer Journey Stages</div>
              <div style={{ fontSize: 11, color: "#52525b" }}>Click a stage to edit conversion rates</div>
            </div>
            {/* Flow visualisation */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 0, overflowX: "auto", paddingBottom: 8 }}>
              {journey.map((stage, i) => (
                <React.Fragment key={i}>
                  <div style={{ textAlign: "center", minWidth: 110, cursor: "pointer" }} onClick={() => startEdit(i)}>
                    <div style={{ width: 80, height: 80, borderRadius: "50%", background: stage.color + "22", border: `3px solid ${stage.color}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", flexDirection: "column" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: stage.color }}>{stage.convRate}</div>
                      <div style={{ fontSize: 9, color: "#52525b", textTransform: "uppercase" }}>reach</div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#e4e4e7", marginBottom: 2 }}>{stage.stage}</div>
                    <div style={{ fontSize: 10, color: "#71717a" }}>{stage.channel}</div>
                    {stage.dropRate !== "0%" && <div style={{ fontSize: 10, color: "#f87171", marginTop: 2 }}>↓ {stage.dropRate} drop</div>}
                  </div>
                  {i < journey.length - 1 && (
                    <div style={{ display: "flex", alignItems: "center", marginTop: 38, flexShrink: 0 }}>
                      <div style={{ width: 24, height: 2, background: "#27272a" }} />
                      <div style={{ color: "#3f3f46", fontSize: 10 }}>▶</div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {editStage !== null && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={S.sectionTitle}>Edit Stage: {journey[editStage].stage}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{ ...S.btn("primary"), fontSize: 11, padding: "5px 10px" }} onClick={saveEdit}>Save</button>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => setEditStage(null)}>Cancel</button>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[["stage", "Stage Name"], ["channel", "Channel"], ["action", "Customer Action"], ["emotion", "Emotion"], ["convRate", "Reach %"], ["dropRate", "Drop %"]].map(([key, label]) => (
                  <div key={key}>
                    <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 3 }}>{label}</label>
                    <input style={{ background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", fontSize: 13, padding: "7px 10px", outline: "none", width: "100%" }} value={editVal[key] || ""} onChange={e => setEditVal(p => ({ ...p, [key]: e.target.value }))} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={S.card}>
            <div style={S.sectionTitle}>Stage Details</div>
            {journey.map((stage, i) => (
              <div key={i} style={{ ...S.row, flexWrap: "wrap" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: stage.color, marginTop: 4, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{stage.stage}</div>
                  <div style={{ fontSize: 12, color: "#71717a" }}>{stage.action} · {stage.channel}</div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <span style={{ background: "#1a1a2e", color: "#818cf8", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>Reach: {stage.convRate}</span>
                  {stage.dropRate !== "0%" && <span style={{ background: "#3f1315", color: "#f87171", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>Drop: {stage.dropRate}</span>}
                  <span style={{ background: "#27272a", color: "#a1a1aa", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{stage.emotion}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DROP-OFF ANALYSIS */}
      {tab === "dropoff" && (
        <div style={{ marginTop: 20 }}>
          {DROPOFF_INSIGHTS.map((d, i) => (
            <div key={i} style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#e4e4e7" }}>{d.stage}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#f87171" }}>{d.rate} drop</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={S.sectionTitle}>Common Causes</div>
                  {d.causes.map(c => (
                    <div key={c} style={{ fontSize: 12, color: "#a1a1aa", padding: "4px 0", borderBottom: "1px solid #1f1f22" }}>✗ {c}</div>
                  ))}
                </div>
                <div>
                  <div style={S.sectionTitle}>Recommended Fixes</div>
                  {d.fixes.map(f => (
                    <div key={f} style={{ fontSize: 12, color: "#4ade80", padding: "4px 0", borderBottom: "1px solid #1f1f22" }}>✓ {f}</div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* GUIDE */}
      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Journey Optimisation Framework</div>
            {[
              { t: "Map the emotional journey, not just the logical steps",    d: "For each stage, ask: how does the customer FEEL? Frustration at checkout, anxiety about delivery, delight at unboxing. Optimise for emotion, not just conversion." },
              { t: "Focus on the biggest drop-off first",                      d: "Don't optimise every stage equally. Find the stage with the biggest drop-off and fix it first. A 10% improvement at the biggest bottleneck beats a 10% improvement everywhere else." },
              { t: "Measure micro-conversions",                                d: "Track email opens, product page views, add-to-cart events, and not just purchases. Micro-conversions reveal where customers get stuck before the final purchase." },
              { t: "Post-purchase is where loyalty is made or lost",           d: "Most brands abandon customers after purchase. The post-purchase experience (email, packaging, first use) determines whether they return. Invest disproportionately here." },
              { t: "Journey differs by acquisition channel",                   d: "Paid social customers are more impulsive, need faster checkout. SEO customers are more informed, need more depth. Map separate journeys by channel." },
              { t: "Personalise the journey, not just the message",           d: "A first-time visitor and a returning customer should have different journeys, not just different emails. Use pop-ups, product recommendations, and CTAs differently for each." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>🗺</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

 return (
 <div style={S.page}>
 <div style={S.card}>
 <h2 style={S.title}>Customer Journey Mapping</h2>
 <p style={S.desc}>
 Visualize and optimize every step of your customer\u2019s experience from
 first touch to loyal advocate.
 </p>
 <span style={S.badge}>Coming Soon</span>
 <ul style={S.list}>
 {FEATURES.map((f) => (
 <li key={f} style={S.item}>
 {f}
 </li>
 ))}
 </ul>
 </div>
 </div>
 );
}

