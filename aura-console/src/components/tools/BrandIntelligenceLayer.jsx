import React, { useState } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/brand-intelligence-layer";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
};

const TABS = [
  { id: "analyse",  label: "Brand Analysis" },
  { id: "insights", label: "AI Insights" },
  { id: "guide",    label: "Brand Framework" },
];

const TREND_ICON = { up: "↑", down: "↓", stable: "→" };
const TREND_COLOR = { up: "#4ade80", down: "#f87171", stable: "#fbbf24" };
const PRIORITY_COLOR = { high: "#f87171", medium: "#fbbf24", low: "#4ade80" };
const PRIORITY_BG = { high: "#3f1315", medium: "#3d2a0a", low: "#052e16" };

export default function BrandIntelligenceLayer() {
  const [tab, setTab]         = useState("analyse");
  const [input, setInput]     = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [insights, setInsights]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const run = async () => {
    if (!input.trim()) return;
    setLoading(true); setError(""); setDashboard(null); setInsights(null);
    try {
      const [dashRes, insRes] = await Promise.all([
        apiFetchJSON(`${API}/dashboard`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input }) }),
        apiFetchJSON(`${API}/insights`,  { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input }) }),
      ]);
      if (!dashRes.ok) throw new Error(dashRes.error || "Dashboard failed");
      if (!insRes.ok)  throw new Error(insRes.error  || "Insights failed");
      setDashboard(dashRes.dashboard || []);
      setInsights(insRes.insights || []);
      setTab("analyse");
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const SAMPLE_BRANDS = [
    "A premium sustainable activewear brand targeting eco-conscious women aged 25-40. Price point: $80-150. Currently selling on Shopify. Brand values: sustainability, empowerment, performance.",
    "An artisan coffee subscription brand delivering specialty coffee to offices and homes. AOV: $45/month. Strong Instagram presence. Competitors: Pact Coffee, Grind, Origin.",
    "A UK-based pet accessories brand. Products: collars, leads, bandanas. Dog niche. Growing TikTok channel with 15k followers. No paid advertising yet.",
  ];

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Brand Intelligence Layer</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>AI-powered brand health analysis — dashboard metrics, strategic insights, positioning gaps and actionable recommendations for e-commerce brands.</p>
      </div>

      <div style={S.card}>
        <div style={S.sectionTitle}>Describe Your Brand</div>
        <textarea style={{ ...S.ta, minHeight: 100 }} value={input} onChange={e => setInput(e.target.value)} placeholder="Describe your brand: products, target audience, price point, current channels, brand values, competitors…" />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button style={S.btn("primary")} onClick={run} disabled={loading || !input.trim()}>{loading ? "Analysing…" : "Run Brand Analysis"}</button>
          <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => setInput("")}>Clear</button>
        </div>
        {!input && !dashboard && !loading && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, color: "#52525b", marginBottom: 6 }}>SAMPLE BRANDS — CLICK TO LOAD</div>
            {SAMPLE_BRANDS.map((b, i) => (
              <div key={i} style={{ ...S.row, cursor: "pointer" }} onClick={() => setInput(b)}>
                <div style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.5 }}>{b.slice(0, 100)}…</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ErrorBox message={error} />
      {loading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}

      {(dashboard || insights) && !loading && (
        <>
          <MozTabs tabs={TABS} active={tab} onChange={setTab} />

          {/* DASHBOARD */}
          {tab === "analyse" && dashboard && (
            <div style={{ marginTop: 20 }}>
              {Array.isArray(dashboard) && dashboard.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 12 }}>
                  {dashboard.map((item, i) => (
                    <div key={i} style={{ ...S.card, marginBottom: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase", letterSpacing: 1 }}>{item.metric}</div>
                        {item.trend && <span style={{ fontSize: 16, color: TREND_COLOR[item.trend] || "#a1a1aa" }}>{TREND_ICON[item.trend] || ""}</span>}
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#fafafa", margin: "6px 0" }}>{item.value}</div>
                      <div style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.5 }}>{item.insight}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={S.card}>
                  <pre style={{ fontSize: 13, color: "#e4e4e7", whiteSpace: "pre-wrap" }}>{JSON.stringify(dashboard, null, 2)}</pre>
                </div>
              )}
            </div>
          )}

          {/* INSIGHTS */}
          {tab === "insights" && insights && (
            <div style={{ marginTop: 20 }}>
              {Array.isArray(insights) && insights.length > 0 ? (
                insights.map((ins, i) => (
                  <div key={i} style={S.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <span style={{ background: ins.priority ? PRIORITY_BG[ins.priority] : "#27272a", color: ins.priority ? PRIORITY_COLOR[ins.priority] : "#a1a1aa", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6, display: "inline-block" }}>{ins.priority || "insight"}</span>
                        {ins.category && <span style={{ background: "#1e1b4b", color: "#818cf8", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginLeft: 4, display: "inline-block" }}>{ins.category}</span>}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7", marginBottom: 6 }}>{ins.title || ins}</div>
                    {ins.description && <div style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.6 }}>{ins.description}</div>}
                  </div>
                ))
              ) : (
                <div style={S.card}>
                  <pre style={{ fontSize: 13, color: "#e4e4e7", whiteSpace: "pre-wrap" }}>{JSON.stringify(insights, null, 2)}</pre>
                </div>
              )}
            </div>
          )}

          {/* FRAMEWORK */}
          {tab === "guide" && (
            <div style={{ marginTop: 20 }}>
              <div style={S.card}>
                <div style={S.sectionTitle}>Brand Health Dimensions</div>
                {[
                  { dim: "Brand Awareness",      desc: "% of target audience who recognise your brand name and associate it with your category" },
                  { dim: "Brand Consideration",  desc: "% who would consider buying from you when they need your product category" },
                  { dim: "Net Promoter Score",   desc: "Likelihood of customers recommending you. Ecommerce benchmark: > 50 = excellent" },
                  { dim: "Brand Voice Clarity",  desc: "Consistency of tone, language, and values across all touchpoints (website, social, email, packaging)" },
                  { dim: "Visual Identity",      desc: "Logo, colour, typography recognition and consistency across channels" },
                  { dim: "Positioning Strength", desc: "How clearly differentiated you are from competitors in your target audience's mind" },
                ].map(({ dim, desc }) => (
                  <div key={dim} style={S.row}>
                    <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{dim}</div><div style={{ fontSize: 12, color: "#71717a" }}>{desc}</div></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
