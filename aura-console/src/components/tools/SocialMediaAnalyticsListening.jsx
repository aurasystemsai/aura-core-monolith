import React, { useState, useCallback, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/social-media-analytics-listening";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, minWidth: 220, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
  badge: (c) => ({ display: "inline-block", borderRadius: 5, padding: "2px 9px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: c === "pos" ? "#052e16" : c === "neg" ? "#3f1315" : c === "neu" ? "#27272a" : "#1e1b4b", color: c === "pos" ? "#4ade80" : c === "neg" ? "#f87171" : c === "neu" ? "#a1a1aa" : "#818cf8" }),
};

const TABS = [
  { id: "listen",    label: "Social Listening" },
  { id: "saved",     label: "Saved Analyses" },
  { id: "platforms", label: "Platform Guide" },
  { id: "strategy",  label: "Content Strategy" },
];

export default function SocialMediaAnalyticsListening() {
  const [tab, setTab]         = useState("listen");
  const [query, setQuery]     = useState("");
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [analyses, setAnalyses] = useState([]);
  const [history, setHistory]   = useState([]);

  const fetchAnalyses = useCallback(async () => {
    try {
      const r = await apiFetchJSON(`${API}/analyses`);
      if (r.ok) setAnalyses(r.analyses || []);
    } catch {}
  }, []);

  useEffect(() => { fetchAnalyses(); }, [fetchAnalyses]);

  const analyze = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const r = await apiFetchJSON(`${API}/ai/analyze`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!r.ok) throw new Error(r.error || "Analysis failed");
      setResult(r.analysis || r.result || "");
      setHistory(p => [{ query, result: r.analysis || r.result, ts: new Date().toISOString() }, ...p].slice(0, 10));
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const saveAnalysis = async () => {
    if (!result || !query) return;
    try {
      await apiFetchJSON(`${API}/analyses`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, result }),
      });
      fetchAnalyses();
    } catch {}
  };

  const deleteAnalysis = async (id) => {
    try { await apiFetchJSON(`${API}/analyses/${id}`, { method: "DELETE" }); fetchAnalyses(); } catch {}
  };

  const SUGGESTED_QUERIES = [
    "Analyse Instagram engagement trends for beauty brands in 2024 — what content formats are outperforming?",
    "What are the best-performing TikTok content types for e-commerce stores selling fitness products?",
    "Compare organic vs paid social performance benchmarks for Shopify stores",
    "What hashtag strategies are working for small fashion brands on Instagram?",
    "How should a Shopify home decor brand use Pinterest to drive organic traffic?",
  ];

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Social Media Analytics & Listening</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>AI-powered social intelligence — analyse brand mentions, sentiment trends, platform performance, competitor activity, and content strategy for your Shopify store across all major social platforms.</p>
      </div>

      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      <ErrorBox message={error} />

      {/* LISTENING */}
      {tab === "listen" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Ask a Social Media Question</div>
            <textarea style={{ ...S.ta, minHeight: 120, marginBottom: 10 }} value={query} onChange={e => setQuery(e.target.value)} placeholder="E.g. 'Analyse social listening for [brand], identify key sentiment drivers, top platforms, trending topics, competitor share of voice…'" />
            <div style={{ display: "flex", gap: 8 }}>
              <button style={S.btn("primary")} onClick={analyze} disabled={loading || !query.trim()}>{loading ? "Analysing…" : "Analyse"}</button>
              {result && <button style={{ ...S.btn("green"), fontSize: 11, padding: "6px 12px" }} onClick={saveAnalysis}>Save Analysis</button>}
            </div>
          </div>

          {/* Suggested queries */}
          {!result && !loading && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Suggested Queries</div>
              {SUGGESTED_QUERIES.map((q, i) => (
                <div key={i} style={S.row}>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px", flexShrink: 0 }} onClick={() => setQuery(q)}>Use</button>
                  <span style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.5 }}>{q}</span>
                </div>
              ))}
            </div>
          )}

          {loading && <div style={{ textAlign: "center", padding: 40 }}><Spinner size={36} /><div style={{ color: "#71717a", marginTop: 12, fontSize: 13 }}>Analysing social media data…</div></div>}

          {result && !loading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={S.sectionTitle}>Analysis Result</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(typeof result === "string" ? result : JSON.stringify(result, null, 2))}>Copy</button>
                  <button style={{ ...S.btn("green"), fontSize: 11, padding: "5px 10px" }} onClick={saveAnalysis}>Save</button>
                </div>
              </div>
              <pre style={S.pre}>{typeof result === "string" ? result : JSON.stringify(result, null, 2)}</pre>
            </div>
          )}

          {history.length > 0 && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Recent Queries</div>
              {history.map((h, i) => (
                <div key={i} style={{ ...S.row, alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "#e4e4e7" }}>{h.query.slice(0, 100)}{h.query.length > 100 ? "…" : ""}</div>
                    <div style={{ fontSize: 11, color: "#52525b" }}>{new Date(h.ts).toLocaleString()}</div>
                  </div>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => { setQuery(h.query); setResult(h.result); }}>Load</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SAVED */}
      {tab === "saved" && (
        <div style={{ marginTop: 20 }}>
          {analyses.length === 0 ? (
            <EmptyState icon="💾" title="No saved analyses yet" description="Run an analysis and click 'Save' to keep it here for reference." />
          ) : (
            <div style={S.card}>
              <div style={S.sectionTitle}>Saved Analyses ({analyses.length})</div>
              {analyses.map((a, i) => (
                <div key={i} style={{ ...S.row, alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7", marginBottom: 2 }}>{a.query?.slice(0, 80) || `Analysis #${i + 1}`}</div>
                    <div style={{ fontSize: 12, color: "#71717a" }}>{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ""}</div>
                    {a.result && <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 4, lineHeight: 1.5 }}>{String(a.result).slice(0, 150)}{String(a.result).length > 150 ? "…" : ""}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => { setQuery(a.query || ""); setResult(a.result); setTab("listen"); }}>View</button>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px" }} onClick={() => deleteAnalysis(a.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PLATFORM GUIDE */}
      {tab === "platforms" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {[
              {
                platform: "Instagram",
                icon: "📸",
                bestFor: "Visual products, lifestyle, fashion, beauty",
                topFormats: ["Reels (highest reach)", "Stories (engagement)", "Carousels (saves)"],
                postFreq: "4-7× per week",
                bestTime: "Tues-Fri 9am-11am local",
                engBenchmark: "1-5% (Reels can hit 10%+)",
              },
              {
                platform: "TikTok",
                icon: "🎵",
                bestFor: "Viral reach, Gen Z/Millennial, demos, unboxing",
                topFormats: ["Short tutorials (15-60s)", "Behind the scenes", "Trending sounds"],
                postFreq: "1-3× per day",
                bestTime: "6-10pm local",
                engBenchmark: "3-9% average",
              },
              {
                platform: "Pinterest",
                icon: "📌",
                bestFor: "Home decor, fashion, food, DIY, evergreen content",
                topFormats: ["Idea Pins", "Rich Pins with product data", "Infographics"],
                postFreq: "15-25 pins/day",
                bestTime: "8-11pm local",
                engBenchmark: "Impressions > saves > clicks",
              },
              {
                platform: "Facebook",
                icon: "👥",
                bestFor: "35+ demographic, community building, ads",
                topFormats: ["Videos (native)", "Facebook Live", "Groups", "Reels"],
                postFreq: "1-2× per day",
                bestTime: "1-4pm Wed/Thur",
                engBenchmark: "0.5-2% organic",
              },
              {
                platform: "Twitter/X",
                icon: "🐦",
                bestFor: "Brand voice, customer service, trending topics",
                topFormats: ["Threads", "Polls", "Real-time commentary"],
                postFreq: "3-5× per day",
                bestTime: "Weekdays 8am-4pm",
                engBenchmark: "0.02-0.09%",
              },
              {
                platform: "YouTube",
                icon: "▶️",
                bestFor: "Long-form education, product reviews, brand authority",
                topFormats: ["How-to (10+ min)", "Product reviews", "Shorts"],
                postFreq: "1-2× per week",
                bestTime: "Thur/Fri afternoons",
                engBenchmark: "4-6% likes to views",
              },
            ].map(({ platform, icon, bestFor, topFormats, postFreq, bestTime, engBenchmark }) => (
              <div key={platform} style={S.card}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 22 }}>{icon}</span>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#fafafa" }}>{platform}</div>
                </div>
                <div style={{ fontSize: 12, color: "#71717a", marginBottom: 10 }}><strong style={{ color: "#a1a1aa" }}>Best for:</strong> {bestFor}</div>
                <div style={{ marginBottom: 8 }}>
                  <div style={S.sectionTitle}>Top Formats</div>
                  {topFormats.map(f => <div key={f} style={{ fontSize: 12, color: "#e4e4e7", padding: "3px 0" }}>• {f}</div>)}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                  <div style={{ background: "#09090b", borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ fontSize: 10, color: "#52525b", textTransform: "uppercase" }}>Post Freq.</div>
                    <div style={{ fontSize: 12, color: "#4f46e5", fontWeight: 700 }}>{postFreq}</div>
                  </div>
                  <div style={{ background: "#09090b", borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ fontSize: 10, color: "#52525b", textTransform: "uppercase" }}>Eng. Rate</div>
                    <div style={{ fontSize: 12, color: "#4ade80", fontWeight: 700 }}>{engBenchmark}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STRATEGY */}
      {tab === "strategy" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Social Content Pillars for E-Commerce</div>
            {[
              { pillar: "Education (30%)", d: "How-to videos, product guides, tips and tricks. Builds authority and saves/shares. E.g. '5 ways to style our linen shirt'." },
              { pillar: "Inspiration (25%)", d: "Lifestyle imagery, aspirational content, user scenarios. High engagement, drives desire. E.g. beautiful product-in-context photography." },
              { pillar: "Entertainment (20%)", d: "Trending formats, relatable content, brand personality. Drives new followers and shares. E.g. joining relevant TikTok trends." },
              { pillar: "Social Proof (15%)", d: "Customer reviews, UGC reposts, before/after content. Builds trust and drives conversions. E.g. resharing tagged customer posts." },
              { pillar: "Promotion (10%)", d: "Product launches, sales, discounts, events. Keep promotional content to max 10% to avoid audience fatigue." },
            ].map(({ pillar, d }) => (
              <div key={pillar} style={S.row}>
                <div style={{ minWidth: 160, fontWeight: 700, fontSize: 13, color: "#e4e4e7" }}>{pillar}</div>
                <div style={{ fontSize: 13, color: "#71717a", lineHeight: 1.5 }}>{d}</div>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Social Listening KPIs to Track Weekly</div>
            {[
              ["Brand mention volume",    "Total mentions across all platforms", "#4f46e5"],
              ["Net Sentiment Score",     "% positive − % negative mentions",    "#4ade80"],
              ["Share of Voice",          "Your mentions ÷ industry total × 100", "#818cf8"],
              ["Engagement Rate",         "Interactions ÷ reach × 100",           "#0ea5e9"],
              ["Response Time",           "Avg time to respond to mentions",      "#fbbf24"],
              ["Virality Rate",           "Shares ÷ impressions × 100",           "#f87171"],
            ].map(([kpi, def, color]) => (
              <div key={kpi} style={{ ...S.row, alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{kpi}</div>
                  <div style={{ fontSize: 12, color: "#71717a" }}>{def}</div>
                </div>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
