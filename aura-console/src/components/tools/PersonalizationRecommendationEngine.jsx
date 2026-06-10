import React, { useState, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/personalization-recommendation-engine";

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
  { id: "suggest",  label: "AI Suggestions" },
  { id: "saved",    label: "Saved Rules" },
  { id: "analytics", label: "Analytics" },
  { id: "guide",    label: "Personalisation Guide" },
];

const PLACEMENT_TYPES = [
  "Homepage hero",
  "Product detail page",
  "Cart page",
  "Post-checkout upsell",
  "Email — win-back",
  "Email — post-purchase",
  "Email — browse abandon",
  "Loyalty portal",
  "Search results",
];

const SAMPLE_DESCRIPTIONS = [
  { label: "Homepage for new visitor",   desc: "Recommend products for first-time visitors who haven't browsed specific categories yet. Mix of bestsellers and trending items." },
  { label: "Cart page upsell",           desc: "Customer has a skincare cleanser in cart (£29). Recommend complementary products they're likely to add before checkout." },
  { label: "Post-purchase cross-sell",   desc: "Customer just bought a gym bag. Recommend accessories and related products for a follow-up email sent 3 days after purchase." },
  { label: "Win-back email",             desc: "Customer purchased twice in 2023 but hasn't bought in 6 months. Recommend products likely to re-engage them based on past purchases." },
  { label: "High-value segment",         desc: "VIP customer with 8 purchases and £600 LTV. Recommend new arrivals and premium products they haven't seen yet." },
  { label: "Browse abandonment",         desc: "Customer viewed the leather wallet product page 3 times without purchasing. Create a personalised recommendation to close the sale." },
];

const STRATEGY_TYPES = [
  "Collaborative Filtering",
  "Content-Based",
  "Popularity-Based",
  "Recently Viewed",
  "Frequently Bought Together",
  "Customers Also Bought",
  "New Arrivals",
  "Price Point Match",
];

export default function PersonalizationRecommendationEngine() {
  const [tab, setTab]           = useState("suggest");
  const [description, setDesc]  = useState("");
  const [placement, setPlacement] = useState("Homepage hero");
  const [strategy, setStrategy] = useState("Collaborative Filtering");
  const [result, setResult]     = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => { loadSuggestions(); }, []);

  const loadSuggestions = async () => {
    try {
      const r = await apiFetchJSON(`${API}/recommendations`);
      setSuggestions(r.recommendations || (Array.isArray(r) ? r : []));
    } catch {}
  };

  const loadAnalytics = async () => {
    if (analytics) return;
    setAnalyticsLoading(true);
    try {
      const r = await apiFetchJSON(`${API}/analytics`);
      if (r.ok !== false) setAnalytics(r);
    } catch {}
    setAnalyticsLoading(false);
  };

  useEffect(() => { if (tab === "analytics") loadAnalytics(); }, [tab]);

  const generate = async () => {
    if (!description.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const r = await apiFetchJSON(`${API}/ai/suggest`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: `Placement: ${placement}\nStrategy: ${strategy}\n\n${description}` }),
      });
      if (!r.ok && r.error) throw new Error(r.error);
      setResult(r.recommendation || r.result || "");
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const saveRecommendation = async () => {
    if (!result) return;
    setSaving(true);
    try {
      await apiFetchJSON(`${API}/recommendations`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `${placement} — ${strategy}`, description, recommendation: result, placement, strategy, createdAt: new Date().toISOString() }),
      });
      loadSuggestions();
      setResult(null);
      setDesc("");
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  const deleteRecommendation = async (id) => {
    try {
      await apiFetchJSON(`${API}/recommendations/${id}`, { method: "DELETE" });
      setSuggestions(p => p.filter(r => r.id !== id));
    } catch {}
  };

  const analyticsKeys = analytics ? Object.entries(analytics).filter(([k, v]) => k !== "ok" && typeof v !== "object") : [];

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Personalisation & Recommendations</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>
          AI-powered product recommendation strategies for every placement and customer segment. Build a personalisation engine that drives measurable revenue lift.
        </p>
      </div>

      <ErrorBox message={error} />
      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* ── AI SUGGESTIONS ── */}
      {tab === "suggest" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Configure Recommendation</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Placement</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {PLACEMENT_TYPES.map(p => (
                    <button key={p} style={{ ...S.btn(p === placement ? "primary" : null), fontSize: 11, padding: "4px 10px" }} onClick={() => setPlacement(p)}>{p}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Algorithm</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {STRATEGY_TYPES.map(s => (
                    <button key={s} style={{ ...S.btn(s === strategy ? "primary" : null), fontSize: 11, padding: "4px 10px" }} onClick={() => setStrategy(s)}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
            <textarea style={{ ...S.ta, minHeight: 110 }} value={description} onChange={e => setDesc(e.target.value)} placeholder="Describe the customer context, segment, or scenario for this recommendation…" />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={S.btn("primary")} onClick={generate} disabled={loading || !description.trim()}>
                {loading ? "Generating…" : "AI Generate Recommendation"}
              </button>
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => { setDesc(""); setResult(null); }}>Clear</button>
            </div>
          </div>

          {loading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}

          {result && !loading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <div style={S.sectionTitle}>AI Recommendation Strategy</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span style={{ background: "#1e1b4b", color: "#818cf8", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{placement}</span>
                    <span style={{ background: "#27272a", color: "#a1a1aa", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{strategy}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(result)}>Copy</button>
                  <button style={{ ...S.btn("green"), fontSize: 11, padding: "5px 10px" }} onClick={saveRecommendation} disabled={saving}>
                    {saving ? "Saving…" : "Save Rule"}
                  </button>
                </div>
              </div>
              <pre style={S.pre}>{result}</pre>
            </div>
          )}

          <div style={S.card}>
            <div style={S.sectionTitle}>Quick Start Examples</div>
            {SAMPLE_DESCRIPTIONS.map(({ label, desc }) => (
              <div key={label} style={S.row}>
                <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px", flexShrink: 0 }} onClick={() => { setDesc(desc); setPlacement("Homepage hero"); }}>Load</button>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#818cf8", marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 12, color: "#71717a" }}>{desc.slice(0, 100)}…</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SAVED RULES ── */}
      {tab === "saved" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 13, color: "#71717a", marginBottom: 16 }}>{suggestions.length} saved recommendation rule{suggestions.length !== 1 ? "s" : ""}</div>
          {suggestions.length === 0 ? (
            <EmptyState icon="🎯" title="No saved rules" description="Generate a recommendation in the AI Suggestions tab and click Save Rule." />
          ) : (
            suggestions.map((r, i) => (
              <div key={r.id || i} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>{r.title || `Recommendation ${i + 1}`}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      {r.placement && <span style={{ background: "#1e1b4b", color: "#818cf8", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{r.placement}</span>}
                      {r.strategy && <span style={{ background: "#27272a", color: "#a1a1aa", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{r.strategy}</span>}
                      {r.createdAt && <span style={{ fontSize: 11, color: "#52525b" }}>{new Date(r.createdAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => navigator.clipboard?.writeText(r.recommendation || "")}>Copy</button>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px" }} onClick={() => deleteRecommendation(r.id)}>Delete</button>
                  </div>
                </div>
                {r.description && <div style={{ fontSize: 12, color: "#71717a", marginBottom: 8 }}>Context: {r.description.slice(0, 120)}{r.description.length > 120 ? "…" : ""}</div>}
                {r.recommendation && <div style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.5 }}>{r.recommendation.slice(0, 300)}{r.recommendation.length > 300 ? "…" : ""}</div>}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── ANALYTICS ── */}
      {tab === "analytics" && (
        <div style={{ marginTop: 20 }}>
          {analyticsLoading && <div style={{ textAlign: "center", padding: 40 }}><Spinner size={36} /></div>}

          {analyticsKeys.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
              {analyticsKeys.map(([k, v]) => (
                <div key={k} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 16px" }}>
                  <div style={{ fontSize: 10, color: "#71717a", textTransform: "uppercase", letterSpacing: 0.5 }}>{k.replace(/([A-Z])/g, " $1").trim()}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#4f46e5", marginTop: 4 }}>{typeof v === "number" ? v.toLocaleString() : String(v)}</div>
                </div>
              ))}
            </div>
          )}

          <div style={S.card}>
            <div style={S.sectionTitle}>Personalisation Revenue Impact</div>
            <p style={{ fontSize: 13, color: "#71717a", lineHeight: 1.6, marginBottom: 16 }}>Industry benchmarks for personalisation lift across placements:</p>
            {[
              { placement: "Homepage recommendations",      uplift: "+7-15% CVR",    mechanism: "Surfacing relevant products for returning visitors reduces bounce rate and increases product discovery." },
              { placement: "Product page cross-sell",       uplift: "+15-25% AOV",   mechanism: "\"Frequently bought together\" and \"Complete the look\" shown at point of intent drives bundle purchases." },
              { placement: "Cart page upsell",              uplift: "+10-20% AOV",   mechanism: "Pre-checkout recommendations add incremental value when purchase intent is highest." },
              { placement: "Post-purchase email",           uplift: "+8-18% repeat", mechanism: "Product recommendations sent 3-7 days after purchase (before the \"honeymoon period\" ends) drive the fastest second purchase." },
              { placement: "Win-back email",                uplift: "+12-22% reactivation", mechanism: "Personalised product recommendations outperform generic discount emails for lapsed customers." },
              { placement: "Browse abandonment",            uplift: "+5-12% recovery",    mechanism: "Showing the exact viewed item plus similar alternatives within 1 hour recovers 5-12% of non-purchasers." },
            ].map(({ placement, uplift, mechanism }) => (
              <div key={placement} style={S.row}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>{placement}</div>
                  <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>{mechanism}</div>
                </div>
                <span style={{ background: "#052e16", color: "#4ade80", padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{uplift}</span>
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>Algorithm Performance Comparison</div>
            {[
              { algo: "Collaborative Filtering",      ctr: "3.2%",  cvr: "8.1%",  note: "Best overall for stores with 500+ customers" },
              { algo: "Frequently Bought Together",   ctr: "4.8%",  cvr: "12.3%", note: "Highest AOV uplift, requires purchase history data" },
              { algo: "Customers Also Bought",        ctr: "3.9%",  cvr: "9.7%",  note: "Strong social proof signal, great for product pages" },
              { algo: "Content-Based Filtering",      ctr: "2.7%",  cvr: "7.2%",  note: "Best for new stores with limited purchase history" },
              { algo: "Popularity-Based",             ctr: "2.1%",  cvr: "6.3%",  note: "Best baseline; always outperforms random" },
              { algo: "Recently Viewed",              ctr: "5.8%",  cvr: "11.2%", note: "Highest CTR — recency intent is very strong" },
            ].map(({ algo, ctr, cvr, note }) => (
              <div key={algo} style={{ display: "grid", gridTemplateColumns: "200px 70px 70px 1fr", gap: 8, padding: "8px 0", borderBottom: "1px solid #1f1f22", fontSize: 12, alignItems: "center" }}>
                <span style={{ fontWeight: 600, color: "#e4e4e7" }}>{algo}</span>
                <span style={{ color: "#818cf8", fontWeight: 700, textAlign: "center" }}>CTR {ctr}</span>
                <span style={{ color: "#4ade80", fontWeight: 700, textAlign: "center" }}>CVR {cvr}</span>
                <span style={{ color: "#71717a" }}>{note}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── GUIDE ── */}
      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Personalisation Excellence Framework</div>
            {[
              { t: "Relevance beats novelty — always",        d: "The best recommendation is not the newest product or the most profitable SKU — it's the most relevant one for that specific customer at that moment. Optimise for relevance score, not margin." },
              { t: "Context is everything: same product, different placement, different result", d: "\"Frequently bought together\" on a product page converts at 12%. The same widget on the homepage converts at 3%. Placement context determines performance more than algorithm choice." },
              { t: "Cold start: what to do with no data",     d: "For new visitors (no history): show bestsellers in their browsed category. For new products: show to customers with similar taste profiles. Popularity is always your fallback — it's better than random." },
              { t: "The 3-second test for recommendation quality", d: "Show a recommendation to someone unfamiliar with the customer. Ask 'Does this make sense for this person?' If they hesitate, your algorithm is failing. Recommendations should feel obvious in hindsight." },
              { t: "Diversity prevents filter bubbles",       d: "If you only recommend the same category they just bought, you miss cross-sell opportunities and it feels monotonous. Include 70% highly relevant + 20% complementary + 10% surprise/discovery items." },
              { t: "Test everything — incrementally",        d: "Never launch a personalisation change without an A/B test. A recommendation that looks great in theory can reduce revenue by 5% in practice. Test one variable at a time: algorithm, placement, count, presentation." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>🎯</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div>
                  <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>Implementation Maturity Roadmap</div>
            {[
              { stage: "Level 1 — Manual Curation",         desc: "Manually select featured products by page. Staff picks, bestsellers, curated collections. No data. Works up to ~$10k/month revenue.", color: "#27272a" },
              { stage: "Level 2 — Rule-Based",              desc: "\"Frequently bought together\" computed from order history. Category-based \"you might also like\". Simple purchase-based cross-sell in email.", color: "#1e3a5f" },
              { stage: "Level 3 — Behavioural",             desc: "Recommendations personalised by browsing history, session data, and real-time signals. Browse abandonment and cart page algorithms.", color: "#1e1b4b" },
              { stage: "Level 4 — Predictive Personalisation", desc: "ML-driven collaborative filtering, LTV-aware promotion, real-time recommendation scores, and individualised pricing and offers.", color: "#052e16" },
            ].map(({ stage, desc, color }) => (
              <div key={stage} style={{ background: color, border: "1px solid #27272a", borderRadius: 8, padding: "12px 16px", marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fafafa", marginBottom: 4 }}>{stage}</div>
                <div style={{ fontSize: 12, color: "#a1a1aa" }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
