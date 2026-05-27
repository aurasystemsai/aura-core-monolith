import React, { useState, useCallback, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, MozCard, MetricRow, ErrorBox, EmptyState, Spinner, SortableTable } from "../MozUI";

const API = "/api/rank-visibility-tracker";

const S = {
  page: { background: "#09090b", minHeight: "100vh", padding: "28px 32px", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif" },
  title: { fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 },
  sub: { fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 20 },
  inputRow: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 4 },
  input: { flex: 1, minWidth: 220, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "danger" ? "#7f1d1d" : v === "green" ? "#166534" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap" },
  row: { display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #1f1f22", fontSize: 13 },
  badge: (c) => ({ display: "inline-block", borderRadius: 5, padding: "2px 9px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, background: c === "good" ? "#052e16" : c === "bad" ? "#3f1315" : c === "warn" ? "#3d2a0a" : "#27272a", color: c === "good" ? "#4ade80" : c === "bad" ? "#f87171" : c === "warn" ? "#fbbf24" : "#a1a1aa" }),
  grid: (cols) => ({ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(${cols || 200}px, 1fr))`, gap: 14 }),
  metric: (color) => ({ background: "#09090b", border: "1px solid #27272a", borderRadius: 12, padding: "16px 20px", borderLeft: `3px solid ${color || "#4f46e5"}` }),
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
};

function PositionBar({ position }) {
  const zones = [
    { label: "1–3", max: 3, color: "#22c55e" },
    { label: "4–10", max: 10, color: "#4f46e5" },
    { label: "11–20", max: 20, color: "#f59e0b" },
    { label: "21–50", max: 50, color: "#f97316" },
    { label: "50+", max: 100, color: "#ef4444" },
  ];
  const active = zones.find(z => position <= z.max) || zones[zones.length - 1];
  return (
    <div>
      <div style={{ display: "flex", gap: 2, height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
        {zones.map(z => (
          <div key={z.label} style={{ flex: 1, background: z.label === active.label ? z.color : "#27272a", transition: "all 0.3s" }} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {zones.map(z => <span key={z.label} style={{ fontSize: 10, color: z.label === active.label ? z.color : "#3f3f46" }}>{z.label}</span>)}
      </div>
    </div>
  );
}

function CTRChart({ position }) {
  const ctrByPos = [31.7, 24.7, 18.7, 13.6, 9.5, 6.1, 4.0, 3.2, 2.8, 2.5];
  const estimated = position >= 1 && position <= 10 ? ctrByPos[position - 1] : position <= 20 ? 1.5 : 0.5;
  const max = 35;
  return (
    <div>
      <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 60 }}>
        {ctrByPos.map((ctr, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div style={{ width: "100%", background: i === position - 1 ? "#4f46e5" : "#27272a", height: `${(ctr / max) * 60}px`, borderRadius: "2px 2px 0 0", transition: "all 0.4s" }} />
            <span style={{ fontSize: 9, color: i === position - 1 ? "#818cf8" : "#3f3f46" }}>#{i + 1}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, fontSize: 13, color: "#e4e4e7" }}>
        Position <strong style={{ color: "#818cf8" }}>#{position}</strong> → estimated CTR: <strong style={{ color: "#4ade80" }}>{estimated}%</strong>
      </div>
    </div>
  );
}

const TABS = [
  { id: "track", label: "AI Track" },
  { id: "keywords", label: "Keywords" },
  { id: "serp", label: "SERP Features" },
  { id: "ctr", label: "CTR Estimator" },
  { id: "drop", label: "Drop Analysis" },
  { id: "volatility", label: "Volatility & SOV" },
  { id: "history", label: "History" },
];

const KW_COLS = [
  { key: "keyword", label: "Keyword", render: v => <span style={{ color: "#fafafa", fontWeight: 600 }}>{v}</span> },
  { key: "position", label: "Position", render: v => <span style={{ fontWeight: 800, color: v <= 3 ? "#22c55e" : v <= 10 ? "#818cf8" : v <= 20 ? "#f59e0b" : "#f87171" }}>{v ? `#${v}` : "—"}</span> },
  { key: "change", label: "Change", render: v => <span style={{ color: v > 0 ? "#22c55e" : v < 0 ? "#f87171" : "#71717a", fontWeight: 700 }}>{v > 0 ? `▲${v}` : v < 0 ? `▼${Math.abs(v)}` : "—"}</span> },
  { key: "volume", label: "Volume", render: v => <span style={{ color: "#a1a1aa" }}>{v ? v.toLocaleString() : "—"}</span> },
  { key: "difficulty", label: "Difficulty", render: v => <span style={{ color: v > 70 ? "#f87171" : v > 40 ? "#f59e0b" : "#22c55e" }}>{v ? `${v}/100` : "—"}</span> },
];

export default function RankVisibilityTracker() {
  const [tab, setTab] = useState("track");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  // Keywords CRUD
  const [kwItems, setKwItems] = useState([]);
  const [newKw, setNewKw] = useState("");
  const [kwLoading, setKwLoading] = useState(false);

  // Individual endpoint states
  const [serpInput, setSerpInput] = useState("");
  const [serpResult, setSerpResult] = useState(null);
  const [serpLoading, setSerpLoading] = useState(false);

  const [ctrPos, setCtrPos] = useState("5");
  const [ctrResult, setCtrResult] = useState(null);
  const [ctrLoading, setCtrLoading] = useState(false);

  const [dropKw, setDropKw] = useState("");
  const [dropResult, setDropResult] = useState(null);
  const [dropLoading, setDropLoading] = useState(false);

  const [volDomain, setVolDomain] = useState("");
  const [volResult, setVolResult] = useState(null);
  const [volLoading, setVolLoading] = useState(false);

  const [history, setHistory] = useState([]);

  const loadKwItems = useCallback(async () => {
    try {
      const r = await apiFetchJSON(`${API}/items`);
      if (r.ok) setKwItems(r.items || []);
    } catch {}
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const r = await apiFetchJSON(`${API}/analytics`);
      if (r.ok) setHistory(r.analytics || r.history || []);
    } catch {}
  }, []);

  useEffect(() => { loadKwItems(); loadHistory(); }, [loadKwItems, loadHistory]);

  const handleTrack = async () => {
    if (!keyword.trim()) return;
    setLoading(true); setError(""); setReport(null); setAnalytics(null);
    try {
      const r = await apiFetchJSON(`${API}/ai/track`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim(), channels: { google: true } }),
      });
      if (!r.ok) throw new Error(r.error || "Track failed");
      setReport(r.rankReport || "");
      setAnalytics(r.analytics || null);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const addKeyword = async () => {
    if (!newKw.trim()) return;
    setKwLoading(true);
    try {
      await apiFetchJSON(`${API}/items`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: newKw.trim(), position: null, volume: null, difficulty: null, change: 0 }),
      });
      setNewKw(""); loadKwItems();
    } catch {} finally { setKwLoading(false); }
  };

  const deleteKeyword = async (id) => {
    try {
      await apiFetchJSON(`${API}/items/${id}`, { method: "DELETE" });
      loadKwItems();
    } catch {}
  };

  const checkSERP = async () => {
    if (!serpInput.trim()) return;
    setSerpLoading(true); setSerpResult(null);
    try {
      const r = await apiFetchJSON(`${API}/serp-features`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: serpInput.trim() }),
      });
      setSerpResult(r);
    } catch {} finally { setSerpLoading(false); }
  };

  const estimateCTR = async () => {
    setCtrLoading(true); setCtrResult(null);
    try {
      const r = await apiFetchJSON(`${API}/ctr-estimate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: parseInt(ctrPos) }),
      });
      setCtrResult(r);
    } catch {} finally { setCtrLoading(false); }
  };

  const analyzeDrops = async () => {
    if (!dropKw.trim()) return;
    setDropLoading(true); setDropResult(null);
    try {
      const r = await apiFetchJSON(`${API}/drop-analysis`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: dropKw.trim() }),
      });
      setDropResult(r);
    } catch {} finally { setDropLoading(false); }
  };

  const checkVolatility = async () => {
    if (!volDomain.trim()) return;
    setVolLoading(true); setVolResult(null);
    try {
      const r = await apiFetchJSON(`${API}/sov-volatility`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: volDomain.trim() }),
      });
      setVolResult(r);
    } catch {} finally { setVolLoading(false); }
  };

  const pos = analytics?.estimatedPosition ?? analytics?.position;

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={S.title}>Rank &amp; Visibility Tracker</h1>
        <p style={S.sub}>Track keyword rankings, SERP features, CTR estimates, drop analysis &amp; share of voice. Ahrefs-level insight for Shopify stores.</p>
      </div>

      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* AI TRACK */}
      {tab === "track" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Track a Keyword</div>
            <div style={S.inputRow}>
              <input style={S.input} value={keyword} onChange={e => setKeyword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleTrack()} placeholder="e.g. leather wallets for men" />
              <button style={S.btn("primary")} onClick={handleTrack} disabled={loading}>{loading ? "Tracking…" : "Track with AI"}</button>
            </div>
          </div>
          {error && <ErrorBox message={error} />}
          {loading && <div style={{ textAlign: "center", padding: 40 }}><Spinner size={36} /></div>}
          {report && (
            <>
              {analytics && (
                <div style={{ ...S.grid(160), marginBottom: 16 }}>
                  {[
                    { label: "Keyword", value: analytics.keyword || keyword, color: "#fafafa" },
                    { label: "Est. Position", value: pos ? `#${pos}` : "N/A", color: pos <= 3 ? "#22c55e" : pos <= 10 ? "#818cf8" : "#f59e0b" },
                    { label: "Difficulty", value: analytics.estimatedDifficulty != null ? `${analytics.estimatedDifficulty}/100` : "—", color: "#f59e0b" },
                    { label: "Channels", value: analytics.channels ? Object.keys(analytics.channels).join(", ") : "Google", color: "#4ade80" },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={S.metric(color)}>
                      <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color }}>{String(value)}</div>
                    </div>
                  ))}
                </div>
              )}
              {pos && (
                <div style={S.card}>
                  <div style={S.sectionTitle}>Position Zone</div>
                  <PositionBar position={pos} />
                </div>
              )}
              <div style={S.card}>
                <div style={S.sectionTitle}>AI Rank Report</div>
                <div style={S.pre}>{report}</div>
              </div>
            </>
          )}
          {!loading && !report && (
            <EmptyState icon="📈" title="AI-Powered Rank Analysis" description="Enter a keyword to get AI-estimated position, difficulty score, visibility report, and actionable ranking strategy." />
          )}

          {/* Quick-fire AI chat */}
          <div style={{ ...S.card, background: "#0d0d10", marginTop: 8 }}>
            <div style={S.sectionTitle}>AI Rank Strategy Assistant</div>
            <p style={{ fontSize: 13, color: "#52525b", marginBottom: 12 }}>Ask about ranking strategy, competitor gaps, content opportunities, or why you're not ranking.</p>
            <div style={S.inputRow}>
              <input style={S.input} placeholder="E.g. 'How do I rank #1 for leather wallets?'" id="chat-rank-input" />
              <button style={S.btn("primary")} onClick={async () => {
                const el = document.getElementById("chat-rank-input");
                if (!el?.value.trim()) return;
                const q = el.value.trim(); el.value = "";
                try {
                  const r = await apiFetchJSON(`${API}/ai/generate`, {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: q }),
                  });
                  setReport(prev => (prev ? prev + "\n\n---\n\n" : "") + `Q: ${q}\n\nA: ${r.reply || r.rankReport || ""}`);
                } catch {}
              }}>Ask AI</button>
            </div>
          </div>
        </div>
      )}

      {/* KEYWORDS */}
      {tab === "keywords" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Tracked Keywords</div>
            <div style={S.inputRow}>
              <input style={S.input} value={newKw} onChange={e => setNewKw(e.target.value)} onKeyDown={e => e.key === "Enter" && addKeyword()} placeholder="Add keyword to track…" />
              <button style={S.btn("primary")} onClick={addKeyword} disabled={kwLoading}>Add</button>
            </div>
          </div>
          {kwItems.length === 0 ? (
            <EmptyState icon="🔑" title="No keywords tracked yet" description="Add keywords above to track their positions, search volume, and ranking changes over time." />
          ) : (
            <div style={S.card}>
              <SortableTable columns={[
                ...KW_COLS,
                { key: "id", label: "", render: (v) => <button onClick={() => deleteKeyword(v)} style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 8px" }}>Remove</button> },
              ]} rows={kwItems} emptyText="No keywords" />
            </div>
          )}

          {/* Position distribution */}
          {kwItems.length > 0 && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Position Distribution</div>
              <div style={S.grid(140)}>
                {[
                  { label: "Top 3", filter: k => k.position <= 3, color: "#22c55e" },
                  { label: "Top 10", filter: k => k.position > 3 && k.position <= 10, color: "#4f46e5" },
                  { label: "Top 20", filter: k => k.position > 10 && k.position <= 20, color: "#f59e0b" },
                  { label: "Top 50", filter: k => k.position > 20 && k.position <= 50, color: "#f97316" },
                  { label: "Not tracked", filter: k => !k.position, color: "#52525b" },
                ].map(({ label, filter, color }) => {
                  const count = kwItems.filter(filter).length;
                  return (
                    <div key={label} style={S.metric(color)}>
                      <div style={{ fontSize: 11, color: "#71717a" }}>{label}</div>
                      <div style={{ fontSize: 28, fontWeight: 800, color }}>{count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SERP FEATURES */}
      {tab === "serp" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Check SERP Features for a Keyword</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 12 }}>Discover which rich results appear (Featured Snippets, PAA, Shopping, Images, etc.) to prioritise which schema types and content formats to create.</p>
            <div style={S.inputRow}>
              <input style={S.input} value={serpInput} onChange={e => setSerpInput(e.target.value)} onKeyDown={e => e.key === "Enter" && checkSERP()} placeholder="e.g. best running shoes 2024" />
              <button style={S.btn("primary")} onClick={checkSERP} disabled={serpLoading}>{serpLoading ? "Checking…" : "Check SERP"}</button>
            </div>
          </div>
          {serpLoading && <div style={{ textAlign: "center", padding: 30 }}><Spinner /></div>}
          {serpResult && (
            <div style={S.card}>
              <div style={S.sectionTitle}>SERP Analysis for "{serpInput}"</div>
              {serpResult.features && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                  {serpResult.features.map((f, i) => <span key={i} style={S.badge("good")}>{f}</span>)}
                </div>
              )}
              {(serpResult.report || serpResult.result) && <div style={S.pre}>{serpResult.report || serpResult.result}</div>}
            </div>
          )}
          {!serpResult && !serpLoading && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Common SERP Features to Target</div>
              {[
                { feature: "Featured Snippet", how: "Structure content as a direct answer. Use an H2 with the question, followed by a concise 40–60 word paragraph answer.", opportunity: "~8.6% CTR premium over position 1" },
                { feature: "People Also Ask (PAA)", how: "Identify related questions with AnswerThePublic/AlsoAsked. Answer each concisely. FAQ schema helps.", opportunity: "High visibility, drives longtail traffic" },
                { feature: "Shopping (Product) Pack", how: "Ensure your Shopify products have price, availability, and reviews. Connect Google Merchant Center.", opportunity: "Direct purchase intent traffic" },
                { feature: "Image Pack", how: "Optimise image alt text, filenames, and surround images with relevant keyword-rich content.", opportunity: "Additional SERP real estate" },
                { feature: "Review Stars", how: "Add Review or AggregateRating schema. Collect Shopify product reviews.", opportunity: "Proven 30%+ CTR improvement" },
                { feature: "Site Links", how: "Strong brand signals, clear navigation structure, and Google Search Console optimisation.", opportunity: "Doubles branded search SERP presence" },
                { feature: "Video Carousel", how: "Add VideoObject schema to product pages with embedded YouTube reviews/demos.", opportunity: "Visual CTR boost for product queries" },
                { feature: "Knowledge Panel", how: "Add Organization schema, verify Google Business Profile, build branded entity signals.", opportunity: "Brand authority and trust signals" },
              ].map(({ feature, how, opportunity }) => (
                <div key={feature} style={{ padding: "12px 0", borderBottom: "1px solid #1f1f22" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{feature}</span>
                    <span style={S.badge("good")}>{opportunity}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "#71717a", lineHeight: 1.5 }}>{how}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CTR ESTIMATOR */}
      {tab === "ctr" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Position → CTR Estimator</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14 }}>Estimate the click-through rate at any SERP position. Based on aggregate search industry data. Use to model traffic impact of rank improvements.</p>
            <div style={S.inputRow}>
              <label style={{ fontSize: 13, color: "#a1a1aa" }}>SERP Position:</label>
              <input style={{ ...S.input, maxWidth: 120 }} type="number" min="1" max="100" value={ctrPos} onChange={e => setCtrPos(e.target.value)} />
              <button style={S.btn("primary")} onClick={estimateCTR} disabled={ctrLoading}>{ctrLoading ? "…" : "Estimate CTR"}</button>
            </div>
          </div>
          {ctrLoading && <Spinner />}
          {ctrResult && (
            <div style={S.card}>
              <div style={S.sectionTitle}>CTR at Position #{ctrPos}</div>
              <CTRChart position={parseInt(ctrPos)} />
              {(ctrResult.report || ctrResult.result) && <div style={{ ...S.pre, marginTop: 16 }}>{ctrResult.report || ctrResult.result}</div>}
            </div>
          )}
          {!ctrResult && !ctrLoading && (
            <div style={S.card}>
              <div style={S.sectionTitle}>CTR Benchmarks (Google Organic, Desktop)</div>
              <div style={S.grid(140)}>
                {[
                  { pos: "#1", ctr: "31.7%", note: "Captures nearly ⅓ of clicks" },
                  { pos: "#2", ctr: "24.7%", note: "Still very high intent traffic" },
                  { pos: "#3", ctr: "18.7%", note: "Solid visibility zone" },
                  { pos: "#4", ctr: "13.6%", note: "Worth fighting for" },
                  { pos: "#5", ctr: "9.5%", note: "First page, declining" },
                  { pos: "#6–10", ctr: "3–6%", note: "Lower page 1 CTR" },
                  { pos: "#11–20", ctr: "1–2%", note: "Page 2 — low traffic" },
                  { pos: "#21+", ctr: "<0.5%", note: "Minimal traffic value" },
                ].map(({ pos, ctr, note }) => (
                  <div key={pos} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, color: "#52525b" }}>Position {pos}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#4ade80" }}>{ctr}</div>
                    <div style={{ fontSize: 11, color: "#71717a" }}>{note}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={S.sectionTitle}>Traffic Impact Calculator</div>
                <p style={{ fontSize: 13, color: "#71717a", lineHeight: 1.6 }}>
                  Formula: <strong style={{ color: "#e4e4e7" }}>Monthly Traffic = Search Volume × CTR</strong><br />
                  Example: If a keyword has 5,000 monthly searches and you rank #3 (18.7% CTR), you can expect approximately <strong style={{ color: "#4ade80" }}>935 visits/month</strong>.<br />
                  Moving from #3 to #1 would increase traffic to <strong style={{ color: "#22c55e" }}>1,585 visits/month</strong> — a 70% increase.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* DROP ANALYSIS */}
      {tab === "drop" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Ranking Drop Analyser</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 12 }}>AI-powered analysis of why a keyword may have dropped in rankings. Covers algorithm updates, content freshness, competitor activity, and technical issues.</p>
            <div style={S.inputRow}>
              <input style={S.input} value={dropKw} onChange={e => setDropKw(e.target.value)} onKeyDown={e => e.key === "Enter" && analyzeDrops()} placeholder="e.g. organic shampoo, best protein powder" />
              <button style={S.btn("primary")} onClick={analyzeDrops} disabled={dropLoading}>{dropLoading ? "Analysing…" : "Analyse Drop"}</button>
            </div>
          </div>
          {dropLoading && <div style={{ textAlign: "center", padding: 30 }}><Spinner /></div>}
          {dropResult && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Drop Analysis: "{dropKw}"</div>
              <div style={S.pre}>{dropResult.report || dropResult.result || JSON.stringify(dropResult, null, 2)}</div>
            </div>
          )}
          {!dropResult && !dropLoading && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Common Ranking Drop Causes</div>
              {[
                { cause: "Google Core Algorithm Update", signs: "Broad traffic drop across many keywords simultaneously, typically within 1–2 weeks of confirmed update.", fix: "Improve E-E-A-T signals: author bios, expert citations, trust pages (About, Contact, Privacy, Returns)." },
                { cause: "Thin or Outdated Content", signs: "Gradual position loss over months. Pages with <300 words or content not updated in 12+ months.", fix: "Expand content depth: add expert insights, update statistics, add FAQ sections, extend word count to 800+." },
                { cause: "Lost Backlinks", signs: "Position drop shortly after a linking domain went offline, changed, or removed your link.", fix: "Run a backlink audit. Reach out to replace lost links. Build new links to compensate." },
                { cause: "Competitor Content Upgrade", signs: "A specific competitor moved above you with noticeably improved content depth or design.", fix: "Run a content gap analysis. Match or exceed competitor's content depth, freshness, and UX." },
                { cause: "Technical SEO Issues", signs: "Sudden overnight drop. Check for accidental noindex, robots.txt blocking, 4xx errors.", fix: "Audit robots.txt, meta robots, canonical tags. Check Google Search Console for coverage errors." },
                { cause: "Page Speed Regression", signs: "CWV degraded after a theme update or new app install. Check Google Search Console's CWV report.", fix: "Run Lighthouse. Identify what changed. Remove or defer new scripts. Optimise new images." },
                { cause: "Cannibalisation", signs: "Multiple pages competing for the same keyword. Google can't decide which to rank.", fix: "Consolidate duplicate pages with 301 redirects. Use canonical to indicate preferred URL." },
                { cause: "SERP Feature Acquisition", signs: "Your position is the same but traffic dropped. A featured snippet, PAA box, or shopping pack now occupies your previous click share.", fix: "Optimise for the new SERP feature. Structure content to win the featured snippet or shopping box." },
              ].map(({ cause, signs, fix }) => (
                <div key={cause} style={{ padding: "14px 0", borderBottom: "1px solid #1f1f22" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7", marginBottom: 4 }}>{cause}</div>
                  <div style={{ fontSize: 12, color: "#71717a", marginBottom: 4 }}><strong style={{ color: "#52525b" }}>Signs:</strong> {signs}</div>
                  <div style={{ fontSize: 12, color: "#818cf8" }}><strong>Fix:</strong> {fix}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VOLATILITY & SOV */}
      {tab === "volatility" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>SERP Volatility &amp; Share of Voice</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 12 }}>Measure how volatile your keyword rankings are and calculate your share of voice (SOV) — the percentage of available SERP clicks your domain captures.</p>
            <div style={S.inputRow}>
              <input style={S.input} value={volDomain} onChange={e => setVolDomain(e.target.value)} onKeyDown={e => e.key === "Enter" && checkVolatility()} placeholder="e.g. yourstore.com" />
              <button style={S.btn("primary")} onClick={checkVolatility} disabled={volLoading}>{volLoading ? "Analysing…" : "Check SOV"}</button>
            </div>
          </div>
          {volLoading && <div style={{ textAlign: "center", padding: 30 }}><Spinner /></div>}
          {volResult && (
            <div style={S.card}>
              <div style={S.sectionTitle}>SOV &amp; Volatility Report</div>
              <div style={S.pre}>{volResult.report || volResult.result || JSON.stringify(volResult, null, 2)}</div>
            </div>
          )}
          {!volResult && !volLoading && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Share of Voice (SOV) Explained</div>
              <p style={{ fontSize: 13, color: "#71717a", lineHeight: 1.7, marginBottom: 16 }}>
                Share of Voice = the percentage of total SERP clicks your site captures across all tracked keywords.<br /><br />
                <strong style={{ color: "#e4e4e7" }}>Formula:</strong> SOV = Sum(Estimated Clicks) / Sum(Total Search Volume) × 100<br /><br />
                A higher SOV means your brand dominates the conversation in your niche. Ahrefs, SEMrush, and Moz all use SOV as a competitive benchmarking metric.
              </p>
              <div style={S.sectionTitle}>SERP Volatility Indicators</div>
              {[
                { level: "Low (0–2)", desc: "Rankings are stable. Core algorithm is settled in your niche. Focus on incremental improvements.", color: "#22c55e" },
                { level: "Medium (3–5)", desc: "Some flux. Monitor weekly. May indicate algorithm testing or competitor activity.", color: "#f59e0b" },
                { level: "High (6–10)", desc: "Active volatility. Could be an algorithm update, manual action, or major competitive shift. Investigate immediately.", color: "#f97316" },
                { level: "Extreme (10+)", desc: "Significant algorithm update in progress. Check Google's official update log. Avoid making major content changes until settled.", color: "#ef4444" },
              ].map(({ level, desc, color }) => (
                <div key={level} style={{ ...S.row }}>
                  <span style={{ ...S.badge("bad"), background: `${color}22`, color, minWidth: 80, textAlign: "center", borderRadius: 6 }}>{level}</span>
                  <span style={{ fontSize: 13, color: "#a1a1aa", flex: 1 }}>{desc}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* HISTORY */}
      {tab === "history" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Tracking History &amp; Analytics</div>
            {history.length === 0 ? (
              <EmptyState icon="📊" title="No history yet" description="Your tracking events and analytics will appear here as you use the tool." />
            ) : (
              <SortableTable
                columns={[
                  { key: "event", label: "Event", render: v => <span style={{ color: "#e4e4e7" }}>{v || "Track"}</span> },
                  { key: "count", label: "Count", render: v => <span style={{ color: "#818cf8", fontWeight: 700 }}>{v}</span> },
                  { key: "keyword", label: "Keyword", render: v => <span style={{ color: "#a1a1aa" }}>{v || "—"}</span> },
                  { key: "timestamp", label: "Date", render: v => <span style={{ color: "#52525b", fontSize: 12 }}>{v ? new Date(v).toLocaleString() : "—"}</span> },
                ]}
                rows={history}
                emptyText="No history"
              />
            )}
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Rank Tracking Best Practices</div>
            {[
              "Track branded + non-branded keywords separately. Branded keywords should rank #1 always.",
              "Check rankings weekly, not daily — daily fluctuations are normal and misleading.",
              "Track at country/region level — rankings differ significantly by location.",
              "Include long-tail keywords (4+ words) — lower volume but high intent and easier to rank.",
              "Monitor featured snippet keywords separately — losing a snippet is a bigger traffic hit than losing position 1.",
              "Set up Google Search Console for authoritative position data alongside third-party tools.",
              "Track competitors' keywords alongside yours — gap identification is as valuable as rank monitoring.",
            ].map((tip, i) => (
              <div key={i} style={S.row}>
                <span style={{ color: "#52525b", fontSize: 12, flexShrink: 0 }}>#{i + 1}</span>
                <span style={{ fontSize: 13, color: "#a1a1aa" }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

