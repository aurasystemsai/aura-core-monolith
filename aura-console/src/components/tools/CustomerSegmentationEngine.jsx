import React, { useState, useCallback, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/customer-segmentation-engine";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, minWidth: 160, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
};

const TABS = [
  { id: "rfm",      label: "RFM Calculator" },
  { id: "classify", label: "AI Classifier" },
  { id: "segments", label: "Segment Library" },
  { id: "saved",    label: "Saved Lists" },
  { id: "guide",    label: "Segmentation Guide" },
];

const RFM_SEGMENTS = [
  { name: "Champions",          r: "5",     f: "4-5",  m: "4-5",  color: "#4ade80",  pct: "~15%", desc: "Bought recently, buy often, spend the most",              action: "Reward them. Ask for reviews. Early access offers." },
  { name: "Loyal Customers",    r: "2-5",   f: "3-5",  m: "3-5",  color: "#86efac",  pct: "~12%", desc: "Spend good money, buy often, responsive to promotions",   action: "Upsell higher-value products. Ask for referrals." },
  { name: "Potential Loyalists",r: "3-5",   f: "1-3",  m: "1-3",  color: "#fde68a",  pct: "~18%", desc: "Recent customers, spent a good amount, bought once or twice", action: "Offer membership or loyalty programme. Personalised recommendations." },
  { name: "New Customers",      r: "4-5",   f: "<=1",  m: "<=1",  color: "#a5f3fc",  pct: "~20%", desc: "Just bought for the first time",                          action: "Welcome series. Onboarding help. Collect feedback." },
  { name: "At Risk",            r: "2-3",   f: "2-5",  m: "2-5",  color: "#fbbf24",  pct: "~10%", desc: "Above average RFM but haven't purchased recently",         action: "Win-back campaigns. Personalised discount." },
  { name: "Hibernating",        r: "1-2",   f: "1-2",  m: "1-2",  color: "#fb923c",  pct: "~15%", desc: "Last purchase some time ago, low order count",             action: "Offer relevant product. Recreate brand value." },
  { name: "Lost",               r: "1",     f: "1-2",  m: "1-2",  color: "#f87171",  pct: "~10%", desc: "Lowest RFM scores — lost customers",                     action: "Revive with relevant content. Or suppress." },
];

const BEHAVIORAL_SEGMENTS = [
  { name: "First-Time Buyers",      desc: "1 purchase, no repeat",          size: "~35%", priority: "High",    note: "Convert to 2nd purchase within 45 days for best LTV growth" },
  { name: "One-and-Done Risk",      desc: "1 purchase, 45+ days ago",       size: "~20%", priority: "Urgent",  note: "High churn risk — activate win-back immediately" },
  { name: "Category Loyal",         desc: "Buys same category repeatedly",  size: "~12%", priority: "Medium",  note: "Cross-sell adjacent categories. High receptivity." },
  { name: "Sale Hunters",           desc: "Only buys at discount",          size: "~8%",  priority: "Low",     note: "Margin risk — avoid training with excessive discounts" },
  { name: "High AOV Low Frequency", desc: "Big spends, rare visits",        size: "~5%",  priority: "High",    note: "Treat as VIPs despite low frequency. Premium content." },
  { name: "Subscribers/Autoship",   desc: "On recurring purchase schedule", size: "~5%",  priority: "Protect", note: "Zero churn tolerance. White-glove retention." },
];

const SAMPLE_CSV = `Name, Days Since Purchase, Total Orders, Total Spend
Alice Johnson, 5, 12, 890
Bob Smith, 45, 3, 180
Carol White, 3, 8, 620
David Brown, 120, 1, 35
Emma Davis, 15, 5, 310`;

export default function CustomerSegmentationEngine() {
  const [tab, setTab] = useState("rfm");

  // RFM Calculator
  const [rfm, setRfm]           = useState({ recency: "", frequency: "", monetary: "" });
  const [segmentResult, setSegmentResult] = useState(null);

  // AI Classifier
  const [csvData, setCsvData]       = useState("");
  const [classifyResult, setClassifyResult] = useState(null);
  const [classifyLoading, setClassifyLoading] = useState(false);

  // Saved Lists
  const [savedLists, setSavedLists]   = useState([]);
  const [lLoading, setLLoading]       = useState(false);
  const [newList, setNewList] = useState({ name: "", segmentType: "Champions", count: "", notes: "" });
  const setL = (k, v) => setNewList(p => ({ ...p, [k]: v }));

  const [error, setError] = useState("");

  const fetchLists = useCallback(async () => {
    setLLoading(true);
    try { const r = await apiFetchJSON(`${API}/segments`); if (r.ok) setSavedLists(r.segments || []); } catch {}
    setLLoading(false);
  }, []);

  useEffect(() => { fetchLists(); }, [fetchLists]);

  const calculateRFM = () => {
    const r = Number(rfm.recency), f = Number(rfm.frequency), m = Number(rfm.monetary);
    if (!r || !f || !m) return;
    const rScore = r <= 7 ? 5 : r <= 14 ? 4 : r <= 30 ? 3 : r <= 60 ? 2 : 1;
    const fScore = f >= 10 ? 5 : f >= 5 ? 4 : f >= 3 ? 3 : f >= 2 ? 2 : 1;
    const mScore = m >= 500 ? 5 : m >= 200 ? 4 : m >= 100 ? 3 : m >= 50 ? 2 : 1;
    const total = rScore + fScore + mScore;
    let segment = RFM_SEGMENTS[6];
    if (rScore >= 4 && fScore >= 4) segment = RFM_SEGMENTS[0];
    else if (fScore >= 3 && mScore >= 3) segment = RFM_SEGMENTS[1];
    else if (rScore >= 3 && fScore <= 2) segment = RFM_SEGMENTS[2];
    else if (rScore >= 4 && fScore <= 1) segment = RFM_SEGMENTS[3];
    else if (rScore <= 3 && fScore >= 2 && rScore >= 2) segment = RFM_SEGMENTS[4];
    else if (rScore <= 2 && fScore <= 2) segment = RFM_SEGMENTS[5];
    setSegmentResult({ r: rScore, f: fScore, m: mScore, total, segment });
  };

  const runClassify = async () => {
    if (!csvData.trim()) return;
    setClassifyLoading(true); setError(""); setClassifyResult(null);
    try {
      const r = await apiFetchJSON(`${API}/ai/suggest`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: `Classify each of these customers into RFM segments using this data:\n\n${csvData}\n\nFor each customer, calculate RFM scores (1-5 each) and assign them to one of these segments: Champions, Loyal Customers, Potential Loyalists, New Customers, At Risk, Hibernating, or Lost.\n\nReturn a table with: Name | R Score | F Score | M Score | Segment | Recommended Action\n\nBe concise and actionable.`,
        }),
      });
      if (!r.ok) throw new Error(r.error || "Classification failed");
      setClassifyResult(r.suggestion || r.result || "");
    } catch (e) { setError(e.message); }
    setClassifyLoading(false);
  };

  const saveList = async () => {
    if (!newList.name.trim()) { setError("List name required"); return; }
    setError("");
    try {
      await apiFetchJSON(`${API}/segments`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newList, createdAt: new Date().toISOString() }),
      });
      fetchLists();
      setNewList({ name: "", segmentType: "Champions", count: "", notes: "" });
    } catch (e) { setError(e.message); }
  };

  const deleteList = async (id) => {
    try { await apiFetchJSON(`${API}/segments/${id}`, { method: "DELETE" }); } catch {}
    setSavedLists(p => p.filter(l => l.id !== id));
  };

  const S2 = {
    score: { width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800 },
    inp: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", fontSize: 14, padding: "9px 14px", outline: "none", width: "100%" },
  };

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Customer Segmentation Engine</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>
          Group customers into actionable segments using RFM analysis, AI bulk classification, and behavioural patterns. Target the right customers with the right message at the right time.
        </p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Segments Defined", value: savedLists.length,                                               color: "#4f46e5" },
          { label: "Customers Tagged", value: savedLists.reduce((a, s) => a + (Number(s.count) || 0), 0), color: "#4ade80" },
          { label: "RFM Scores Run",   value: segmentResult ? 1 : 0,                                          color: "#818cf8" },
          { label: "Bulk Classified",  value: classifyResult ? 1 : 0,                                         color: "#fbbf24" },
        ].map(s => (
          <div key={s.label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 20px" }}>
            <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <ErrorBox message={error} />
      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* ── RFM CALCULATOR ── */}
      {tab === "rfm" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>RFM Score Calculator — Single Customer</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14 }}>Enter a customer's data to calculate their RFM score and segment. Use the AI Classifier tab for bulk classification.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: "#71717a", display: "block", marginBottom: 4 }}>Days since last purchase (Recency)</label>
                <input style={S2.inp} type="number" min="0" value={rfm.recency} onChange={e => setRfm(p => ({ ...p, recency: e.target.value }))} placeholder="e.g. 14" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#71717a", display: "block", marginBottom: 4 }}>Total orders (Frequency)</label>
                <input style={S2.inp} type="number" min="0" value={rfm.frequency} onChange={e => setRfm(p => ({ ...p, frequency: e.target.value }))} placeholder="e.g. 4" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#71717a", display: "block", marginBottom: 4 }}>Total spend (£) (Monetary)</label>
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
                  <div style={{ fontSize: 13, color: "#818cf8", fontWeight: 600 }}>Action: {segmentResult.segment.action}</div>
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
                    <span style={{ fontSize: 11, color: "#52525b" }}>{seg.pct}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#71717a" }}>{seg.desc}</div>
                  <div style={{ fontSize: 11, color: "#818cf8", marginTop: 2 }}>{seg.action}</div>
                </div>
                <div style={{ fontSize: 11, color: "#52525b", textAlign: "right" }}>R:{seg.r} F:{seg.f} M:{seg.m}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── AI CLASSIFIER ── */}
      {tab === "classify" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>AI Bulk Customer Classifier</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14, lineHeight: 1.6 }}>
              Paste a list of customers with their purchase data. The AI will calculate RFM scores and assign each customer to a segment with recommended actions. Supports CSV format or plain text lists.
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: "#52525b" }}>Required columns: Name, Days Since Purchase, Total Orders, Total Spend</div>
              <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => setCsvData(SAMPLE_CSV)}>Load Sample</button>
            </div>
            <textarea style={{ ...S.ta, minHeight: 160 }} value={csvData} onChange={e => setCsvData(e.target.value)} placeholder={"Name, Days Since Purchase, Total Orders, Total Spend\nAlice Johnson, 5, 12, 890\nBob Smith, 45, 3, 180\n..."} />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={S.btn("primary")} onClick={runClassify} disabled={classifyLoading || !csvData.trim()}>{classifyLoading ? "Classifying…" : "Classify All Customers"}</button>
              {classifyResult && <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => setClassifyResult(null)}>Clear</button>}
            </div>
          </div>
          {classifyLoading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}
          {classifyResult && !classifyLoading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={S.sectionTitle}>Classification Results</div>
                <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(typeof classifyResult === "string" ? classifyResult : JSON.stringify(classifyResult, null, 2))}>Copy</button>
              </div>
              <pre style={S.pre}>{typeof classifyResult === "string" ? classifyResult : JSON.stringify(classifyResult, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* ── SEGMENT LIBRARY ── */}
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
              { tier: "Diamond (Top 1%)",   ltv: "£2,000+",    tactics: "Dedicated account manager, exclusive products, event invitations" },
              { tier: "Platinum (Top 5%)",  ltv: "£500–2,000", tactics: "VIP early access, complimentary shipping, priority support" },
              { tier: "Gold (Top 20%)",     ltv: "£150–500",   tactics: "Loyalty points, birthday rewards, category discounts" },
              { tier: "Silver (Top 40%)",   ltv: "£50–150",    tactics: "Welcome to loyalty programme, product recommendations" },
              { tier: "Bronze (Remaining)", ltv: "< £50",      tactics: "Educational content, first-repeat-purchase nudge" },
            ].map(t => (
              <div key={t.tier} style={{ display: "grid", gridTemplateColumns: "1fr 90px 2fr", gap: 8, padding: "8px 0", borderBottom: "1px solid #1f1f22", fontSize: 13 }}>
                <span style={{ fontWeight: 600, color: "#e4e4e7" }}>{t.tier}</span>
                <span style={{ color: "#4ade80", fontWeight: 700 }}>{t.ltv}</span>
                <span style={{ color: "#71717a", fontSize: 12 }}>{t.tactics}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SAVED LISTS ── */}
      {tab === "saved" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Save Segment List</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>List Name *</label>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={newList.name} onChange={e => setL("name", e.target.value)} placeholder="e.g. Q2 Win-back Campaign" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Segment Type</label>
                <select style={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "10px 14px", outline: "none", width: "100%" }} value={newList.segmentType} onChange={e => setL("segmentType", e.target.value)}>
                  {RFM_SEGMENTS.map(s => <option key={s.name}>{s.name}</option>)}
                  {["First-Time Buyers", "One-and-Done Risk", "Sale Hunters", "Category Loyal"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Customer Count</label>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={newList.count} onChange={e => setL("count", e.target.value)} type="number" placeholder="e.g. 1240" />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Notes / Campaign Brief</label>
              <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={newList.notes} onChange={e => setL("notes", e.target.value)} placeholder="e.g. Q2 win-back targeting customers who lapsed >60 days. 15% off + free shipping." />
            </div>
            <button style={S.btn("primary")} onClick={saveList}>Save List</button>
          </div>

          {lLoading ? <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>
            : savedLists.length === 0 ? <EmptyState icon="📊" title="No saved segment lists" description="Save segment lists above to track your targeting over time." />
            : savedLists.map((list, i) => {
              const segData = RFM_SEGMENTS.find(s => s.name === list.segmentType);
              return (
                <div key={list.id || i} style={S.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>{list.name}</div>
                        <span style={{ background: "#27272a", color: segData?.color || "#a1a1aa", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{list.segmentType}</span>
                        {list.count && <span style={{ background: "#1e1b4b", color: "#818cf8", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{Number(list.count).toLocaleString()} customers</span>}
                      </div>
                      {list.notes && <div style={{ fontSize: 12, color: "#71717a" }}>{list.notes}</div>}
                      <div style={{ fontSize: 11, color: "#52525b", marginTop: 4 }}>{list.createdAt ? new Date(list.createdAt).toLocaleDateString() : ""}</div>
                    </div>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 8px", marginLeft: 10 }} onClick={() => deleteList(list.id)}>✕</button>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* ── GUIDE ── */}
      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Segmentation Strategy Principles</div>
            {[
              { t: "Start with 3-5 segments",             d: "More segments = more complexity. Start with Champions, Loyal, At-Risk, New, and Lost. Master these before adding micro-segments." },
              { t: "Update segments weekly",              d: "RFM scores decay. A weekly re-calculation ensures your at-risk segment catches customers before they churn, not after." },
              { t: "Segment size matters",                d: "A segment under 100 customers isn't worth an automated campaign. For small stores, consider monthly manual outreach instead." },
              { t: "Match message to segment intent",     d: "Champions want exclusivity. At-Risk want to feel valued. New customers want reassurance. Lost customers need a compelling reason to return." },
              { t: "Test segment-specific offers",        d: "Loyal customers respond to 'Thank you'. At-risk respond to '10% exclusive offer'. Champions respond to 'Be first to see'. Test each." },
              { t: "Suppression is as important as targeting", d: "Exclude Champions from win-back campaigns. Exclude Lost from new product launches. Wrong message to wrong segment wastes budget." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5" }}>🎯</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
