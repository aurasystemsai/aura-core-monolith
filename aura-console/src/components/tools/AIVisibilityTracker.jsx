import React, { useState, useCallback, useEffect } from "react";
import { apiFetchJSON as _apiFetchJSON } from "../../api";
// Wrapper: auto-parses JSON body and injects Content-Type on every call
const apiFetch = (url, opts = {}) => _apiFetchJSON(url, {
  ...opts,
  headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
});

const API = "/api/ai-visibility-tracker";

const TABS = [
 "Overview",
 "Citability Score",
 "Prompt Testing",
 "AI Share of Voice",
 "Seeding Plan",
 "Term Analysis",
 "GEO Optimizer",
 "Prompt Coverage",
 "AI Overview Check",
 "Crawler Audit",
 "llms.txt Generator",
 "History",
];

const S = {
 page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter', sans-serif", padding: "24px"},
 header: { marginBottom: "24px"},
 title: { fontSize: "22px", fontWeight: 700, color: "#fafafa", margin: 0 },
 subtitle: { fontSize: "13px", color: "#a1a1aa", marginTop: "4px"},
 tabs: { display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "24px", borderBottom: "1px solid #27272a", paddingBottom: "12px"},
 tab: (active) => ({ padding: "6px 14px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 500, background: active ? "#7c3aed": "#18181b", color: active ? "#fff": "#a1a1aa", transition: "all 0.15s"}),
 card: { background: "#18181b", border: "1px solid #27272a", borderRadius: "10px", padding: "20px", marginBottom: "16px"},
 label: { fontSize: "12px", color: "#a1a1aa", marginBottom: "6px", display: "block"},
 input: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: "6px", padding: "8px 12px", color: "#fafafa", fontSize: "13px", boxSizing: "border-box", marginBottom: "10px"},
 textarea: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: "6px", padding: "8px 12px", color: "#fafafa", fontSize: "13px", boxSizing: "border-box", marginBottom: "10px", minHeight: "80px", resize: "vertical"},
 btn: (color = "#7c3aed") => ({ background: color, color: "#fff", border: "none", borderRadius: "6px", padding: "9px 18px", fontSize: "13px", fontWeight: 600, cursor: "pointer", marginRight: "8px"}),
 btnSm: (color = "#27272a") => ({ background: color, color: "#fafafa", border: "1px solid #3f3f46", borderRadius: "5px", padding: "5px 10px", fontSize: "11px", cursor: "pointer"}),
 sectionTitle: { fontSize: "15px", fontWeight: 600, color: "#fafafa", marginBottom: "12px", marginTop: "0"},
 badge: (color = "#27272a", text = "#a1a1aa") => ({ background: color, color: text, borderRadius: "4px", padding: "2px 8px", fontSize: "11px", fontWeight: 600 }),
 passCard: (pass) => ({ background: pass ? "rgba(34,197,94,0.08)": "rgba(239,68,68,0.08)", border: `1px solid ${pass ? "#166534": "#7f1d1d"}`, borderRadius: "7px", padding: "10px 14px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "10px"}),
 scoreCircle: (score) => {
 const color = score >= 80 ? "#22c55e": score >= 60 ? "#f59e0b": score >= 40 ? "#f97316": "#ef4444";
 return { width: "72px", height: "72px", borderRadius: "50%", background: `conic-gradient(${color} ${score * 3.6}deg, #27272a 0deg)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
 },
 scoreInner: { width: "56px", height: "56px", borderRadius: "50%", background: "#18181b", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column"},
 row: { display: "flex", gap: "16px", flexWrap: "wrap"},
 col: { flex: 1, minWidth: "220px"},
 error: { background: "rgba(239,68,68,0.1)", border: "1px solid #7f1d1d", borderRadius: "6px", padding: "10px 14px", color: "#fca5a5", fontSize: "12px", marginBottom: "10px"},
 infoBox: { background: "rgba(124,58,237,0.08)", border: "1px solid #4c1d95", borderRadius: "6px", padding: "10px 14px", color: "#c4b5fd", fontSize: "12px", marginBottom: "12px"},
};

function ScoreCircle({ score, label }) {
 const color = score >= 80 ? "#22c55e": score >= 60 ? "#f59e0b": score >= 40 ? "#f97316": "#ef4444";
 return (
 <div style={{ textAlign: "center"}}>
 <div style={S.scoreCircle(score)}>
 <div style={S.scoreInner}>
 <span style={{ fontSize: "16px", fontWeight: 700, color }}>{score}</span>
 <span style={{ fontSize: "9px", color: "#71717a"}}>/ 100</span>
 </div>
 </div>
 {label && <div style={{ fontSize: "11px", color: "#71717a", marginTop: "4px"}}>{label}</div>}
 </div>
 );
}

/* Loading skeleton shown while /overview AI call is in flight */
const SHIMMER_CSS = `
@keyframes ait-shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position:  400px 0; }
}
@keyframes ait-spin {
  to { transform: rotate(360deg); }
}
.ait-skel {
  background: linear-gradient(90deg, #27272a 25%, #3f3f46 50%, #27272a 75%);
  background-size: 400px 100%;
  animation: ait-shimmer 1.4s ease-in-out infinite;
  border-radius: 6px;
}`;

function LoadingOverviewSkeleton() {
  return (
    <>
      <style>{SHIMMER_CSS}</style>
      <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: "18px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 22, height: 22, border: "2px solid #7c3aed", borderTopColor: "transparent", borderRadius: "50%", animation: "ait-spin 0.8s linear infinite", flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#fafafa", marginBottom: 4 }}>Analysing brand visibility across AI platforms…</div>
          <div style={{ fontSize: 12, color: "#71717a" }}>Querying ChatGPT, Google AI Overview, AI Mode &amp; Gemini — this takes 15–30 seconds</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20, gap: 10 }}>
              <div className="ait-skel" style={{ width: 140, height: 140, borderRadius: "50%" }} />
              <div className="ait-skel" style={{ width: 80, height: 14 }} />
              <div className="ait-skel" style={{ width: 120, height: 11 }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "14px 0", borderTop: "1px solid #27272a", borderBottom: "1px solid #27272a", marginBottom: 16 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div className="ait-skel" style={{ width: 44, height: 20 }} />
                  <div className="ait-skel" style={{ width: 64, height: 10 }} />
                </div>
              ))}
            </div>
            <div className="ait-skel" style={{ width: 120, height: 12, marginBottom: 10 }} />
            {[0,1,2,3].map(i => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #1c1c1f" }}>
                <div className="ait-skel" style={{ width: 9, height: 9, borderRadius: "50%" }} />
                <div className="ait-skel" style={{ flex: 1, height: 12 }} />
                <div className="ait-skel" style={{ width: 80, height: 6, borderRadius: 3 }} />
                <div className="ait-skel" style={{ width: 32, height: 12 }} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div className="ait-skel" style={{ width: 200, height: 14 }} />
              <div style={{ display: "flex", gap: 8 }}>
                {[0,1,2,3].map(i => <div key={i} className="ait-skel" style={{ width: 56, height: 11 }} />)}
              </div>
            </div>
            <div className="ait-skel" style={{ width: "100%", height: 130, borderRadius: 8 }} />
            <div className="ait-skel" style={{ width: "75%", height: 11, marginTop: 10 }} />
          </div>
          <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 20 }}>
            <div className="ait-skel" style={{ width: 120, height: 13, marginBottom: 14 }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[0,1,2,3,4,5].map(i => (
                <div key={i} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                  <div className="ait-skel" style={{ width: 24, height: 18 }} />
                  <div className="ait-skel" style={{ width: "80%", height: 12 }} />
                  <div className="ait-skel" style={{ width: "60%", height: 11 }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* Tab: Overview */
const OVERVIEW_KEY = "aura_overview_cache";
function loadCache() {
  try { return JSON.parse(localStorage.getItem(OVERVIEW_KEY) || "null"); } catch { return null; }
}
function saveCache(brand, domain, data) {
  try { localStorage.setItem(OVERVIEW_KEY, JSON.stringify({ brand, domain, data })); } catch {}
}
function clearCache() {
  try { localStorage.removeItem(OVERVIEW_KEY); } catch {}
}

function OverviewTab({ onNavigate }) {
 const _cache = loadCache();
 const [brand, setBrand] = useState(_cache?.brand ?? "");
 const [domain, setDomain] = useState(_cache?.domain ?? "");
 const [result, setResult] = useState(_cache?.data ?? null);
 const [loading, setLoading] = useState(false);
 const [err, setErr] = useState("");
 const [showHowItWorks, setShowHowItWorks] = useState(false);
 const [topicsTab, setTopicsTab] = useState(0);
 const [expandedTopic, setExpandedTopic] = useState(null);
 const [responseModal, setResponseModal] = useState(null);
 const [whatsNextSlide, setWhatsNextSlide] = useState(0);

 // Clear cached result when the user edits the brand or domain fields
 const handleBrandChange = (v) => { setBrand(v); if (result) { setResult(null); clearCache(); } };
 const handleDomainChange = (v) => { setDomain(v); if (result) { setResult(null); clearCache(); } };

 const run = useCallback(async () => {
  if (!brand.trim() && !domain.trim()) { setErr("Enter a brand name or domain first."); return; }
  setLoading(true); setErr(""); setResult(null); clearCache();
  try {
    const d = await apiFetch(`${API}/overview`, { method: "POST", body: JSON.stringify({ brand: brand.trim(), domain: domain.trim() }) });
    if (!d.ok) throw new Error(d.error || d.message || `Server error ${d.status}`);
    setResult(d);
    saveCache(brand.trim(), domain.trim(), d);
  } catch (e) { setErr(e.message); } finally { setLoading(false); }
 }, [brand, domain]);

 const PLATFORMS = [
 { key: "chatgpt",    label: "ChatGPT",     color: "#22d3ee" },
 { key: "aiOverview", label: "AI Overview",  color: "#4ade80" },
 { key: "aiMode",     label: "AI Mode",      color: "#34d399" },
 { key: "gemini",     label: "Gemini",       color: "#f59e0b" },
 ];

 const HOW_IT_WORKS = [
 { q: "What's AI Visibility?", a: "A benchmark score (0–100) showing how often a brand appears in AI-generated answers. The score reflects both the number of topics where the brand is mentioned and how consistently it appears within those topics compared to other brands." },
 { q: "How can I get more mentions?", a: "Check the Topic Opportunities in the Prompt Coverage tab. It highlights topics and prompts that trigger answers mentioning competitors but not your brand. Publish content on those topics or get mentioned on the cited sources." },
 { q: "How is the score calculated?", a: "AURA analyses AI-generated responses from ChatGPT, Google AI Overviews, AI Mode, and Gemini — checking how often your brand or domain appears compared to others on the same prompts." },
 { q: "How do I track a specific prompt?", a: "Use the Prompt Testing tab to run brand vs competitor tests against specific queries, or Prompt Coverage to map all prompts in your niche." },
 { q: "What are Sources?", a: "Pages that AI models cite. These are often UGC platforms (Reddit, Quora), competitor sites, or niche media. The Seeding Plan tab helps you target the right sources to get your brand mentioned." },
 ];

 const score = result?.score ?? 0;
 const scoreColor = score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : score >= 20 ? "#f97316" : "#a855f7";
 const scoreLabel = score >= 80 ? "High" : score >= 50 ? "Medium" : score >= 20 ? "Low" : "Not tracked";

 const QUICK_ACTIONS = [
 { icon: "★", label: "Citability Score", desc: "Score a page for AI citation likelihood", tab: 1 },
 { icon: "◎", label: "Prompt Testing",   desc: "Test brand visibility in AI answers",    tab: 2 },
 { icon: "◈", label: "Share of Voice",   desc: "Compare vs competitors across prompts",  tab: 3 },
 { icon: "⬡", label: "Seeding Plan",     desc: "Where to post to grow AI mentions",      tab: 4 },
 { icon: "◑", label: "Prompt Coverage",  desc: "Map all AI prompts in your niche",       tab: 7 },
 { icon: "⬢", label: "GEO Optimizer",   desc: "Rewrite content for AI citation",        tab: 6 },
 ];

 // Build trend chart polylines from result data if available
 const trendPoints = (arr) => {
 if (!arr || arr.length < 2) return "0,90 50,90 100,90 150,90 200,90 240,90";
 const max = Math.max(...arr, 1);
 const xs = [0, 48, 96, 144, 192, 240];
 return arr.slice(-6).map((v, i) => `${xs[i]},${90 - Math.round((v / max) * 80)}`).join(" ");
 };

 const trendTotal    = result?.trend?.total    ?? [0,0,0,0,0,0];
 const trendChatgpt  = result?.trend?.chatgpt  ?? [0,0,0,0,0,0];
 const trendOverview = result?.trend?.aiOverview ?? [0,0,0,0,0,0];
 const trendGemini   = result?.trend?.gemini   ?? [0,0,0,0,0,0];

 const maxMentions = result ? Math.max(result.chatgpt || 0, result.aiOverview || 0, result.aiMode || 0, result.gemini || 0, 1) : 1;

 return (
 <div>
 {/* Response modal */}
 {responseModal && (
 <div onClick={() => setResponseModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
 <div onClick={e => e.stopPropagation()} style={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 28, maxWidth: 640, width: "100%", maxHeight: "80vh", overflowY: "auto", position: "relative" }}>
 <button onClick={() => setResponseModal(null)} style={{ position: "absolute", top: 14, right: 16, background: "none", border: "none", color: "#71717a", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>×</button>
 <div style={{ fontSize: 11, color: "#52525b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Prompt</div>
 <div style={{ fontSize: 14, color: "#fafafa", fontWeight: 600, marginBottom: 20, lineHeight: 1.5 }}>{responseModal.prompt}</div>
 <div style={{ fontSize: 11, color: "#52525b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>AI Response</div>
 <div style={{ fontSize: 13, color: "#d4d4d8", lineHeight: 1.8, background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", marginBottom: 20 }}>
 <span style={{ color: "#52525b", marginRight: 6 }}>{responseModal.source === "chatgpt" ? "⊕" : "G"}</span>
 {responseModal.response || "No response recorded."}
 </div>
 <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
 <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
 <span style={{ fontSize: 11, color: "#71717a" }}>Your brand:</span>
 <span style={{ fontSize: 12, fontWeight: 700, color: responseModal.mentioned ? "#86efac" : "#fca5a5" }}>{responseModal.mentioned ? "Mentioned" : "Not mentioned"}</span>
 </div>
 <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
 <span style={{ fontSize: 11, color: "#71717a" }}>Competing brands:</span>
 <span style={{ fontSize: 12, fontWeight: 700, color: "#fafafa" }}>{responseModal.brands}</span>
 </div>
 <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
 <span style={{ fontSize: 11, color: "#71717a" }}>Sources cited:</span>
 <span style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa" }}>{responseModal.sources}</span>
 </div>
 </div>
 <button onClick={e => { e.stopPropagation(); navigator.clipboard?.writeText(responseModal.prompt); }} style={{ marginTop: 20, background: "#27272a", border: "none", borderRadius: 6, padding: "7px 14px", color: "#a1a1aa", fontSize: 12, cursor: "pointer" }}>Copy prompt</button>
 </div>
 </div>
 )}
 {/* Input bar */}
 <div style={{ ...S.card, display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
 <div style={{ flex: 1, minWidth: 180 }}>
 <label style={S.label}>Brand name</label>
 <input style={{ ...S.input, marginBottom: 0 }} value={brand} onChange={e => handleBrandChange(e.target.value)} placeholder="e.g. Gymshark" />
 </div>
 <div style={{ flex: 1, minWidth: 180 }}>
 <label style={S.label}>Domain (optional)</label>
 <input style={{ ...S.input, marginBottom: 0 }} value={domain} onChange={e => handleDomainChange(e.target.value)} placeholder="e.g. gymshark.com" />
 </div>
 <button style={{ ...S.btn(), whiteSpace: "nowrap", marginRight: 0 }} onClick={run} disabled={loading}>
 {loading ? "Analysing…" : "Run AI Visibility Overview (3 credits)"}
 </button>
 </div>

 {err && <div style={S.error}>{err}</div>}
 {loading && !result && <LoadingOverviewSkeleton />}

 {/* Main content — shown with real data or as empty-state blueprint */}
 <div style={{ display: loading && !result ? "none" : "grid", gridTemplateColumns: "1fr 1.8fr", gap: 16, marginBottom: 16 }}>

 {/* Left: Score + platform breakdown */}
 <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
 <div style={S.card}>
 {/* Conic score ring */}
 <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
 <div style={{ width: 140, height: 140, borderRadius: "50%", background: `conic-gradient(${scoreColor} ${score * 3.6}deg, #27272a 0deg)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
 <div style={{ width: 110, height: 110, borderRadius: "50%", background: "#18181b", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
 <span style={{ fontSize: 36, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{score}</span>
 <span style={{ fontSize: 11, color: "#71717a" }}>/100</span>
 </div>
 </div>
 <span style={{ fontSize: 16, fontWeight: 700, color: scoreColor, marginTop: 10 }}>{scoreLabel}</span>
 <span style={{ fontSize: 12, color: "#71717a", marginTop: 4 }}>AI Visibility Score</span>
 </div>

 {/* Stats row */}
 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "14px 0", borderTop: "1px solid #27272a", borderBottom: "1px solid #27272a", marginBottom: 16, textAlign: "center" }}>
 {[
 { label: "Monthly Audience", value: result?.monthlyAudience ? (result.monthlyAudience >= 1e6 ? `${(result.monthlyAudience/1e6).toFixed(1)}M` : result.monthlyAudience >= 1e3 ? `${(result.monthlyAudience/1e3).toFixed(1)}K` : result.monthlyAudience) : "—" },
 { label: "Mentions",          value: result?.mentions ?? 0 },
 { label: "Cited Pages",       value: result?.citedPages ?? 0 },
 ].map(s => (
 <div key={s.label}>
 <div style={{ fontSize: 22, fontWeight: 900, color: "#fafafa" }}>{s.value}</div>
 <div style={{ fontSize: 10, color: "#71717a", marginTop: 3 }}>{s.label}</div>
 </div>
 ))}
 </div>

 {/* Platform breakdown */}
 <p style={{ ...S.sectionTitle, marginBottom: 10 }}>Platform Mentions</p>
 {PLATFORMS.map(p => {
 const val = result?.[p.key] ?? 0;
 return (
 <div key={p.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #1c1c1f" }}>
 <div style={{ width: 9, height: 9, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
 <span style={{ color: "#d4d4d8", fontSize: 13, flex: 1 }}>{p.label}</span>
 <div style={{ width: 80, height: 6, background: "#27272a", borderRadius: 3, overflow: "hidden" }}>
 <div style={{ width: `${Math.min((val / maxMentions) * 100, 100)}%`, height: "100%", background: p.color, borderRadius: 3 }} />
 </div>
 <span style={{ color: p.color, fontSize: 13, fontWeight: 700, minWidth: 32, textAlign: "right" }}>{val}</span>
 </div>
 );
 })}
 </div>
 </div>

 {/* Right: Trend chart + quick actions */}
 <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
 <div style={S.card}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
 <p style={{ ...S.sectionTitle, margin: 0 }}>Visibility Trend · last 6 months</p>
 <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
 {[["#a855f7","Total"],["#22d3ee","ChatGPT"],["#4ade80","AI Overview"],["#f59e0b","Gemini"]].map(([color, lbl]) => (
 <div key={lbl} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#71717a" }}>
 <div style={{ width: 18, height: 2, background: color, borderRadius: 1 }} />{lbl}
 </div>
 ))}
 </div>
 </div>
 <svg width="100%" height="130" viewBox="0 0 240 100" preserveAspectRatio="none" style={{ display: "block" }}>
 <line x1="0" y1="25" x2="240" y2="25" stroke="#27272a" strokeWidth="0.5" />
 <line x1="0" y1="50" x2="240" y2="50" stroke="#27272a" strokeWidth="0.5" />
 <line x1="0" y1="75" x2="240" y2="75" stroke="#27272a" strokeWidth="0.5" />
 <polyline points={trendPoints(trendTotal)}    fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
 <polyline points={trendPoints(trendChatgpt)}  fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
 <polyline points={trendPoints(trendOverview)} fill="none" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
 <polyline points={trendPoints(trendGemini)}   fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
 </svg>
 {result?.trendInsight && (
 <div style={{ ...S.infoBox, marginTop: 10 }}>{result.trendInsight}</div>
 )}
 </div>

 {/* Quick Actions */}
 <div style={S.card}>
 <p style={S.sectionTitle}>Analysis Tools</p>
 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
 {QUICK_ACTIONS.map(qa => (
 <button key={qa.tab} onClick={() => onNavigate(qa.tab)}
 style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "12px 14px", textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: 4, transition: "border-color 0.15s" }}
 onMouseEnter={e => e.currentTarget.style.borderColor = "#7c3aed"}
 onMouseLeave={e => e.currentTarget.style.borderColor = "#27272a"}
 >
 <span style={{ fontSize: 18 }}>{qa.icon}</span>
 <span style={{ fontSize: 12, fontWeight: 700, color: "#fafafa" }}>{qa.label}</span>
 <span style={{ fontSize: 11, color: "#71717a" }}>{qa.desc}</span>
 </button>
 ))}
 </div>
 </div>
 </div>
 </div>

 {/* What's Next — 8-card carousel, 3 visible at a time */}
 {(() => {
 const WHATS_NEXT_CARDS = [
 { icon: "≡", title: "Find hot topics for your brand", desc: "Discover high-potential topics where your brand is missing. Create content that puts you back in the conversation and boost your AI Visibility.", cta: "Uncover topic opportunities", tab: 7 },
 { icon: "⊞", title: "Explore competitor strategies", desc: "See which topics competitors dominate and where they publish. Use these insights to create content and grow visibility in AI-generated answers.", cta: "Find competitor gaps", tab: 3 },
 { icon: "⊙", title: "Optimize your domain for AI", desc: "Make sure AI bots can crawl your domain and use your content. If crawlers can't access it, your site won't appear in AI answers.", cta: "Check your domain's AI Health", tab: 9 },
 { icon: "⌾", title: "Find sources where you should be published", desc: "Identify UGC and media platforms where your brand is absent. Publish there to expand reach and strengthen your AI visibility.", cta: "Uncover source opportunities", tab: 4 },
 { icon: "◈", title: "Get everything to rank for your topic", desc: "Choose a topic you want to rank for and use Prompt Research to uncover insights, requirements, and opportunities — all in one place.", cta: "Explore your topic", tab: 2 },
 { icon: "✦", title: "See how AI perceives your brand", desc: "Review your brand's performance across perception, sentiment, and narrative drivers to strengthen your business strategy.", cta: "Explore your brand performance", tab: 3 },
 { icon: "≋", title: "Strengthen your local presence", desc: "ChatGPT, Gemini, and Perplexity read many sources. Fix local listing issues to increase your chances of being featured in their answers.", cta: "Fix issues to boost AI Visibility", tab: 9 },
 { icon: "◎", title: "See how LLMs use your domain", desc: "Check which pages already work for LLMs, and where you need to review content to strengthen it.", cta: "Check Cited Pages", tab: 10 },
 ];
 const maxSlide = WHATS_NEXT_CARDS.length - 3;
 const visible = WHATS_NEXT_CARDS.slice(whatsNextSlide, whatsNextSlide + 3);
 return (
 <div style={{ ...S.card, background: "linear-gradient(135deg, #1e1b4b 0%, #18181b 100%)", border: "1px solid #4c1d95", marginBottom: 16 }}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
 <span style={{ fontSize: 15, fontWeight: 700, color: "#fafafa" }}>What's Next?</span>
 <button style={{ background: "none", border: "none", color: "#52525b", cursor: "pointer", fontSize: 13 }} onClick={() => setWhatsNextSlide(0)}>Close ×</button>
 </div>
 <div style={{ display: "flex", alignItems: "stretch", gap: 8 }}>
 <button onClick={() => setWhatsNextSlide(s => Math.max(0, s - 1))} disabled={whatsNextSlide === 0}
 style={{ background: "none", border: "1px solid #27272a", borderRadius: 6, padding: "0 10px", color: whatsNextSlide === 0 ? "#3f3f46" : "#a1a1aa", cursor: whatsNextSlide === 0 ? "default" : "pointer", fontSize: 18, flexShrink: 0 }}>‹</button>
 <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, flex: 1 }}>
 {visible.map((card, i) => (
 <div key={whatsNextSlide + i} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: "16px 16px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
 <span style={{ fontSize: 20, color: "#a855f7" }}>{card.icon}</span>
 <span style={{ fontSize: 13, fontWeight: 700, color: "#fafafa" }}>{card.title}</span>
 <span style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6, flex: 1 }}>{card.desc}</span>
 <button onClick={() => onNavigate(card.tab)} style={{ background: "none", border: "none", color: "#a855f7", fontSize: 12, fontWeight: 700, cursor: "pointer", padding: 0, textAlign: "left" }}>{card.cta} →</button>
 </div>
 ))}
 </div>
 <button onClick={() => setWhatsNextSlide(s => Math.min(maxSlide, s + 1))} disabled={whatsNextSlide >= maxSlide}
 style={{ background: "none", border: "1px solid #27272a", borderRadius: 6, padding: "0 10px", color: whatsNextSlide >= maxSlide ? "#3f3f46" : "#a1a1aa", cursor: whatsNextSlide >= maxSlide ? "default" : "pointer", fontSize: 18, flexShrink: 0 }}>›</button>
 </div>
 <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 12 }}>
 {Array.from({ length: maxSlide + 1 }).map((_, i) => (
 <div key={i} onClick={() => setWhatsNextSlide(i)}
 style={{ width: i === whatsNextSlide ? 18 : 6, height: 6, borderRadius: 3, background: i === whatsNextSlide ? "#a855f7" : "#27272a", cursor: "pointer", transition: "width 0.2s" }} />
 ))}
 </div>
 </div>
 );
 })()}

 {/* Topics & Sources */}
 <div style={{ ...S.card, padding: 0, overflow: "hidden", marginBottom: 16 }}>
 <div style={{ padding: "16px 20px 0", borderBottom: "1px solid #27272a" }}>
 <p style={{ ...S.sectionTitle, marginBottom: 14 }}>Topics &amp; Sources</p>
 <div style={{ display: "flex", gap: 0, overflowX: "auto" }}>
 {[
 { label: "Your Performing Topics", count: result?.performingTopics?.length ?? 0 },
 { label: "Topic Opportunities", count: result?.topicOpportunities?.length ?? 0 },
 { label: "Cited Sources", count: result?.citedSources?.length ?? 0 },
 { label: "Source Opportunities", count: result?.sourceOpportunities?.length ?? 0 },
 { label: "Cited Pages", count: result?.citedPages ?? 0 },
 ].map((t, i) => (
 <button key={i} onClick={() => setTopicsTab(i)}
 style={{ background: "none", border: "none", borderBottom: topicsTab === i ? "2px solid #a855f7" : "2px solid transparent", padding: "8px 18px", fontSize: 13, fontWeight: topicsTab === i ? 700 : 400, color: topicsTab === i ? "#fafafa" : "#71717a", cursor: "pointer", whiteSpace: "nowrap", display: "flex", gap: 6, alignItems: "center" }}>
 {t.label}
 {t.count > 0 && <span style={{ background: "#27272a", borderRadius: 10, padding: "1px 7px", fontSize: 11, color: "#a1a1aa" }}>{t.count}</span>}
 </button>
 ))}
 </div>
 </div>

 {/* Table */}
 <div style={{ padding: "0 0 4px" }}>
 {/* Header */}
 <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 100px 80px 120px 90px", gap: 0, padding: "10px 20px", borderBottom: "1px solid #27272a", background: "#111113" }}>
 {["Topic", "Visibility", "Your Mentions", "", "AI Volume", "Intent"].map((h, i) => (
 <span key={i} style={{ fontSize: 11, color: "#71717a", fontWeight: 600, textAlign: i > 0 ? "center" : "left" }}>{h}</span>
 ))}
 </div>

 {/* Rows */}
 {topicsTab === 0 && result?.performingTopics?.length > 0 ? (
 result.performingTopics.map((topic, ti) => (
 <div key={ti}>
 <div
 onClick={() => setExpandedTopic(expandedTopic === ti ? null : ti)}
 style={{ display: "grid", gridTemplateColumns: "1fr 90px 100px 80px 120px 90px", gap: 0, padding: "12px 20px", borderBottom: "1px solid #1c1c1f", cursor: "pointer", alignItems: "center" }}
 onMouseEnter={e => e.currentTarget.style.background = "#0f0f12"}
 onMouseLeave={e => e.currentTarget.style.background = "transparent"}
 >
 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
 <span style={{ color: expandedTopic === ti ? "#a855f7" : "#71717a", fontSize: 12 }}>{expandedTopic === ti ? "▾" : "▸"}</span>
 <span style={{ fontSize: 13, color: "#fafafa" }}>{topic.topic}</span>
 </div>
 <span style={{ fontSize: 13, fontWeight: 700, color: "#fafafa", textAlign: "center" }}>{topic.visibility}</span>
 <span style={{ fontSize: 13, color: "#a1a1aa", textAlign: "center" }}>{topic.mentions}</span>
 <div style={{ display: "flex", justifyContent: "center" }}>
 <svg width="40" height="20" viewBox="0 0 40 20">
 <polyline points={topic.sparkline || "0,18 10,14 20,10 30,8 40,4"} fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
 </svg>
 </div>
 <span style={{ fontSize: 13, color: "#a1a1aa", textAlign: "center" }}>{topic.aiVolume?.toLocaleString()}</span>
 <div style={{ display: "flex", justifyContent: "center" }}>
 <div style={{ display: "flex", gap: 1 }}>
 {(topic.intent || []).map((seg, si) => (
 <div key={si} style={{ width: 14, height: 6, borderRadius: 2, background: ["#22d3ee","#a855f7","#4ade80","#f59e0b"][si % 4] }} />
 ))}
 </div>
 </div>
 </div>

 {/* Expanded prompts */}
 {expandedTopic === ti && topic.prompts?.length > 0 && (
 <div style={{ background: "#0a0a0d", borderBottom: "1px solid #27272a" }}>
 {/* Sub-header */}
 <div style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 100px 60px 60px 80px", gap: 0, padding: "8px 36px", borderBottom: "1px solid #1c1c1f" }}>
 {["Prompt", "AI Response", "Your Brand", "Brands", "Sources", ""].map((h, i) => (
 <span key={i} style={{ fontSize: 11, color: "#52525b", fontWeight: 600 }}>{h}</span>
 ))}
 </div>
 {topic.prompts.map((p, pi) => (
 <div key={pi} style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 100px 60px 60px 80px", gap: 0, padding: "12px 36px", borderBottom: "1px solid #111113", alignItems: "flex-start" }}>
 <span style={{ fontSize: 12, color: "#d4d4d8", lineHeight: 1.5 }}>{p.prompt}</span>
 <div style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.6 }}>
 <span style={{ color: "#52525b", marginRight: 4 }}>{p.source === "chatgpt" ? "⊕" : "G"}</span>
 {p.response?.slice(0, 160)}{p.response?.length > 160 ? "…" : ""}
 <button
 onClick={() => setResponseModal(p)}
 style={{ display: "block", background: "none", border: "none", color: "#a855f7", fontSize: 11, cursor: "pointer", padding: "3px 0 0", textDecoration: "underline" }}
 >
 View full response
 </button>
 </div>
 <span style={{ fontSize: 12, fontWeight: 600, color: p.mentioned ? "#86efac" : "#fca5a5", textAlign: "center" }}>{p.mentioned ? "Mentioned" : "Not mentioned"}</span>
 <span style={{ fontSize: 12, color: "#a1a1aa", textAlign: "center" }}>{p.brands}</span>
 <span style={{ fontSize: 12, color: "#60a5fa", textAlign: "center" }}>{p.sources}</span>
 <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
 <button title="Copy prompt" onClick={() => navigator.clipboard?.writeText(p.prompt)} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 4, padding: "3px 6px", cursor: "pointer", color: "#71717a", fontSize: 11 }}>⎘</button>
 <button title="Test this prompt" onClick={() => onNavigate(2)} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 4, padding: "3px 6px", cursor: "pointer", color: "#71717a", fontSize: 11 }}>⊙</button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 ))
 ) : topicsTab === 1 && result?.topicOpportunities?.length > 0 ? (
 <>
 {/* Explanation banner */}
 <div style={{ margin: "0 0 0 0", padding: "14px 20px", background: "linear-gradient(90deg,#1e1b4b,#18181b)", borderBottom: "1px solid #27272a", display: "flex", gap: 14, alignItems: "flex-start" }}>
 <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>⚠</span>
 <div>
 <div style={{ fontSize: 13, fontWeight: 700, color: "#fafafa", marginBottom: 4 }}>Your brand is absent from these high-traffic AI topics</div>
 <div style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.6 }}>Competitors are being mentioned here but you're not. Use the action buttons to start appearing — map the AI prompts, generate optimised content, or seed your brand on the sources AI cites most.</div>
 </div>
 </div>
 {/* Header row */}
 <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px 260px", gap: 0, padding: "8px 20px", borderBottom: "1px solid #27272a" }}>
 {["Topic", "AI Score", "Monthly AI Volume", "Actions"].map((h, i) => (
 <span key={i} style={{ fontSize: 11, color: "#52525b", fontWeight: 600 }}>{h}</span>
 ))}
 </div>
 {result.topicOpportunities.map((topic, ti) => (
 <div key={ti} style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px 260px", gap: 0, padding: "14px 20px", borderBottom: "1px solid #1c1c1f", alignItems: "center" }}>
 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
 <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />
 <div>
 <div style={{ fontSize: 13, color: "#fafafa", fontWeight: 600 }}>{topic.topic}</div>
 <div style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>Not mentioned — competitors rank here</div>
 </div>
 </div>
 <span style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b" }}>{topic.visibility}</span>
 <span style={{ fontSize: 13, color: "#a1a1aa" }}>{topic.aiVolume?.toLocaleString()}</span>
 <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
 <button onClick={() => onNavigate(7)}
 style={{ background: "#1e1b4b", border: "1px solid #4c1d95", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 600, color: "#c4b5fd", cursor: "pointer", whiteSpace: "nowrap" }}>
 🔍 Map AI prompts
 </button>
 <button onClick={() => onNavigate(6)}
 style={{ background: "#052e16", border: "1px solid #166534", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 600, color: "#86efac", cursor: "pointer", whiteSpace: "nowrap" }}>
 ✏ Optimise content
 </button>
 <button onClick={() => onNavigate(4)}
 style={{ background: "#1c1917", border: "1px solid #78350f", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 600, color: "#fcd34d", cursor: "pointer", whiteSpace: "nowrap" }}>
 🌱 Seed brand
 </button>
 </div>
 </div>
 ))}
 </>
 ) : (
 <div style={{ padding: "40px 20px", textAlign: "center", color: "#52525b", fontSize: 13 }}>
 {result ? `No ${["performing topics","topic opportunities","cited sources","source opportunities","cited pages"][topicsTab]} found.` : "Run an overview analysis above to populate this section."}
 </div>
 )}
 </div>
 </div>

 {/* How it works */}
 <div style={S.card}>
 <button onClick={() => setShowHowItWorks(p => !p)}
 style={{ background: "none", border: "none", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: 0 }}>
 <span style={{ fontSize: 14, fontWeight: 700, color: "#fafafa" }}>ⓘ How it works</span>
 <span style={{ color: "#52525b", fontSize: 18 }}>{showHowItWorks ? "−" : "+"}</span>
 </button>
 {showHowItWorks && (
 <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
 {HOW_IT_WORKS.map((item, i) => (
 <div key={i}>
 <div style={{ fontSize: 13, fontWeight: 700, color: "#c4b5fd", marginBottom: 4 }}>{item.q}</div>
 <div style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.6 }}>{item.a}</div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 );
}

function CopyBtn({ text }) {
 const [copied, setCopied] = useState(false);
 return (
 <button style={S.btnSm(copied ? "#166534": "#27272a")} onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
 {copied ? "Copied!": "Copy"}
 </button>
 );
}

/* Tab: Citability Score */
function CitabilityTab() {
 const [url, setUrl] = useState("");
 const [result, setResult] = useState(null);
 const [loading, setLoading] = useState(false);
 const [err, setErr] = useState("");
 const [progress, setProgress] = useState(0);
 const [fixPlan, setFixPlan] = useState(null);
 const [fixLoading, setFixLoading] = useState(false);
 const [fixErr, setFixErr] = useState("");
 const [history, setHistory] = useState([]);
 const [copiedFix, setCopiedFix] = useState(null);
 const [shopCtx, setShopCtx] = useState(null);
 const [shopLoading, setShopLoading] = useState(true);
 const [pageFilter, setPageFilter] = useState("all"); // "all" | "blog" | "product"
 const [search, setSearch] = useState("");
 const [fixMode, setFixMode] = useState("beginner"); // "beginner" | "advanced"
 const [autoFixStates, setAutoFixStates] = useState({}); // { [signalName]: { loading, done, error, message } }

 // Load Shopify store pages on mount
 useEffect(() => {
  let cancelled = false;
  apiFetch(`${API}/shopify-context`).then(d => {
   if (cancelled) return;
   if (d.ok && d.available) setShopCtx(d);
  }).catch(() => {}).finally(() => { if (!cancelled) setShopLoading(false); });
  return () => { cancelled = true; };
 }, []);

 useEffect(() => {
  apiFetch(`${API}/history`).then(d => {
   if (d.ok) setHistory((d.citations || []).filter(c => c.type === "citability").slice(0, 5));
  }).catch(() => {});
 }, [result]);

 const run = useCallback(async () => {
  if (!url.trim()) return;
  setLoading(true); setErr(""); setResult(null); setFixPlan(null); setProgress(0); setAutoFixStates({});
  const tick = setInterval(() => setProgress(p => p < 80 ? p + Math.random() * 14 : p), 600);
  try {
   const d = await apiFetch(`${API}/citability-score`, { method: "POST", body: JSON.stringify({ url }) });
   if (!d.ok) throw new Error(d.error);
   setProgress(100);
   setTimeout(() => setProgress(0), 400);
   setResult(d);
  } catch (e) { setErr(e.message); setProgress(0); } finally { clearInterval(tick); setLoading(false); }
 }, [url]);

 const autoFix = useCallback(async (signalName) => {
  setAutoFixStates(prev => ({ ...prev, [signalName]: { loading: true, done: false, error: null } }));
  try {
   const d = await apiFetch(`${API}/citability-auto-fix`, { method: "POST", body: JSON.stringify({ url, signalName }) });
   if (!d.ok) throw new Error(d.error || "Fix failed");
   setAutoFixStates(prev => ({ ...prev, [signalName]: { loading: false, done: true, error: null, message: d.message } }));
  } catch (e) {
   setAutoFixStates(prev => ({ ...prev, [signalName]: { loading: false, done: false, error: e.message } }));
  }
 }, [url]);

 const getFixPlan = useCallback(async () => {
  if (!result) return;
  setFixLoading(true); setFixErr(""); setFixPlan(null);
  try {
   const d = await apiFetch(`${API}/citability-fix-plan`, { method: "POST", body: JSON.stringify({
    url: result.url, score: result.score, grade: result.grade,
    issues: result.issues, strengths: result.strengths, signals: result.signals,
   }) });
   if (!d.ok) throw new Error(d.error);
   setFixPlan(d.fixes);
  } catch (e) { setFixErr(e.message); } finally { setFixLoading(false); }
 }, [result]);

 const copyFix = (key, text) => {
  navigator.clipboard.writeText(text).then(() => {
   setCopiedFix(key);
   setTimeout(() => setCopiedFix(null), 2000);
  });
 };

 const scoreColor = result
  ? result.score >= 70 ? "#22c55e" : result.score >= 50 ? "#f59e0b" : "#ef4444"
  : "#7c3aed";
 const scoreLabel = result
  ? result.score >= 80 ? "Highly Citable"
   : result.score >= 65 ? "Good"
   : result.score >= 50 ? "Needs Work"
   : result.score >= 35 ? "Poor"
   : "Very Unlikely to be Cited"
  : "";

 // Build the combined page list from store context
 const allPages = shopCtx ? [
  ...(shopCtx.articles || []).map(a => ({ ...a, type: "blog" })),
  ...(shopCtx.productPages || []).map(p => ({ ...p, type: "product", blogTitle: "Products" })),
 ] : [];
 const filtered = allPages.filter(p => {
  if (pageFilter === "blog" && p.type !== "blog") return false;
  if (pageFilter === "product" && p.type !== "product") return false;
  if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
  return true;
 });

 return (
  <div>
   {/* Input card */}
   <div style={S.card}>
    <p style={S.sectionTitle}>🎯 AI-Citability Score</p>
    <div style={S.infoBox}>
     Scores your page across <strong>16 signals</strong> that ChatGPT, Perplexity, and Google AI Overviews use when deciding what to cite.
     Pages with structured facts, schema markup, and authoritative citations are cited <strong>62% more often</strong>.
    </div>

    {/* Store page picker */}
    {shopLoading && (
     <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, fontSize: 12, color: "#71717a" }}>
      <div style={{ width: 12, height: 12, border: "1.5px solid #7c3aed", borderTopColor: "transparent", borderRadius: "50%", animation: "ait-spin 0.8s linear infinite" }} />
      Loading your store pages…
     </div>
    )}
    {shopCtx && (
     <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
       <span style={{ fontSize: 11, background: "#14532d", border: "1px solid #166534", borderRadius: 6, padding: "3px 10px", color: "#86efac" }}>✓ {shopCtx.brand}</span>
       <span style={{ fontSize: 11, color: "#71717a" }}>{shopCtx.articleCount || 0} blog posts · {shopCtx.productCount || 0} products</span>
       <div style={{ flex: 1 }} />
       {/* Filter pills */}
       {["all", "blog", "product"].map(f => (
        <button key={f} onClick={() => setPageFilter(f)} style={{ background: pageFilter === f ? "#4c1d95" : "#18181b", border: `1px solid ${pageFilter === f ? "#7c3aed" : "#3f3f46"}`, borderRadius: 6, padding: "3px 10px", fontSize: 11, color: pageFilter === f ? "#c4b5fd" : "#71717a", cursor: "pointer", textTransform: "capitalize" }}>{f === "all" ? "All pages" : f === "blog" ? "Blog posts" : "Products"}</button>
       ))}
       <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 6, padding: "3px 10px", fontSize: 11, color: "#fafafa", width: 120, outline: "none" }} />
      </div>
      <div style={{ maxHeight: 220, overflowY: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
       {filtered.length === 0 && <div style={{ fontSize: 11, color: "#52525b", padding: "8px 0", gridColumn: "span 2" }}>No pages found{search ? ` matching "${search}"` : ""}.</div>}
       {filtered.map((p, i) => (
        <button key={i} onClick={() => { setUrl(p.url); setResult(null); setFixPlan(null); }}
         style={{ display: "flex", gap: 8, alignItems: "center", background: url === p.url ? "#1e1b4b" : "#09090b", border: `1px solid ${url === p.url ? "#7c3aed" : "#27272a"}`, borderRadius: 8, padding: "8px 10px", cursor: "pointer", textAlign: "left" }}>
         <span style={{ fontSize: 14, flexShrink: 0 }}>{p.type === "blog" ? "📝" : "🛍️"}</span>
         <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: url === p.url ? "#c4b5fd" : "#d4d4d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
          <div style={{ fontSize: 9, color: "#52525b", marginTop: 1 }}>{p.blogTitle || "Product"}{p.publishedAt ? ` · ${new Date(p.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : ""}</div>
         </div>
        </button>
       ))}
      </div>
     </div>
    )}

    <label style={S.label}>{shopCtx ? "Selected URL (or paste any URL)" : "Page URL to analyze"}</label>
    <div style={{ display: "flex", gap: 8 }}>
     <input style={{ ...S.input, flex: 1, margin: 0 }} value={url} onChange={e => setUrl(e.target.value)}
      onKeyDown={e => e.key === "Enter" && run()}
      placeholder="https://yourstore.com/blogs/news/post-title" />
     <button style={{ ...S.btn(), margin: 0, whiteSpace: "nowrap" }} onClick={run} disabled={loading || !url.trim()}>
      {loading ? "Analyzing…" : "Analyze (1 credit)"}
     </button>
    </div>
    {loading && (
     <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#a1a1aa", marginBottom: 4 }}>
       <span>Fetching page and scoring 16 signals…</span>
       <span>{Math.round(progress)}%</span>
      </div>
      <div style={{ background: "#27272a", borderRadius: 4, height: 5, overflow: "hidden" }}>
       <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#7c3aed,#a855f7)", transition: "width 0.5s ease" }} />
      </div>
      <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
       {["Fetching page", "Parsing structure", "Scoring signals", "Calculating grade"].map((s, i) => (
        <span key={i} style={{ fontSize: 10, background: progress > i * 22 ? "#4c1d95" : "#18181b", border: `1px solid ${progress > i * 22 ? "#7c3aed" : "#3f3f46"}`, borderRadius: 10, padding: "2px 8px", color: progress > i * 22 ? "#c4b5fd" : "#52525b", transition: "all 0.3s" }}>{s}</span>
       ))}
      </div>
     </div>
    )}
   </div>

   {err && <div style={S.error}>{err}</div>}

   {result && (
    <div>
     {/* Score hero */}
     <div style={{ ...S.card, display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
      {/* Circle */}
      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
       <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r="46" fill="none" stroke="#27272a" strokeWidth="10" />
        <circle cx="55" cy="55" r="46" fill="none" stroke={scoreColor} strokeWidth="10"
         strokeDasharray={`${2 * Math.PI * 46}`}
         strokeDashoffset={`${2 * Math.PI * 46 * (1 - result.score / 100)}`}
         strokeLinecap="round"
         transform="rotate(-90 55 55)"
         style={{ transition: "stroke-dashoffset 1s ease" }} />
        <text x="55" y="50" textAnchor="middle" fill={scoreColor} fontSize="22" fontWeight="700">{result.score}</text>
        <text x="55" y="66" textAnchor="middle" fill="#71717a" fontSize="11">/100</text>
       </svg>
       <span style={{ fontSize: 22, fontWeight: 800, color: scoreColor }}>Grade: {result.grade}</span>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 200 }}>
       <div style={{ fontSize: 16, fontWeight: 700, color: "#fafafa", marginBottom: 4 }}>{scoreLabel}</div>
       <div style={{ fontSize: 11, color: "#71717a", lineHeight: 1.7, marginBottom: 12 }}>
        {result.score >= 70
         ? "This page is structurally ready to be cited by AI. Small improvements can push you into the A zone."
         : result.score >= 50
          ? "AI models will sometimes cite this page, but key signals are missing. Fix the high-weight issues below."
          : "This page is unlikely to appear in AI-generated answers. Significant structural changes are needed."}
       </div>
       {/* Passing bar */}
       <div style={{ fontSize: 10, color: "#52525b", marginBottom: 4 }}>{result.strengths.length} of {result.signals?.length || 16} signals passing</div>
       <div style={{ background: "#27272a", borderRadius: 4, height: 6, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ width: `${result.score}%`, height: "100%", background: `linear-gradient(90deg,${scoreColor}88,${scoreColor})`, transition: "width 1s ease" }} />
       </div>
       {/* Quick stat pills */}
       <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
         { label: "Words", value: result.wordCount, ok: result.wordCount >= 600 },
         { label: "H2s", value: result.h2Count, ok: result.h2Count >= 3 },
         { label: "H3s", value: result.h3Count, ok: result.h3Count >= 2 },
         { label: "Ext. Links", value: result.externalLinks, ok: result.externalLinks >= 2 },
         { label: "Tables", value: result.tableCount, ok: result.tableCount > 0 },
         { label: "Article Schema", value: result.hasArticleSchema ? "✓" : "✗", ok: result.hasArticleSchema },
         { label: "FAQ Schema", value: result.hasFaqSchema ? "✓" : "✗", ok: result.hasFaqSchema },
        ].map((stat, i) => (
         <div key={i} style={{ background: "#09090b", border: `1px solid ${stat.ok ? "#166534" : "#3f3f46"}`, borderRadius: 8, padding: "8px 10px", textAlign: "center", minWidth: 60 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: stat.ok ? "#22c55e" : "#f59e0b" }}>{stat.value}</div>
          <div style={{ fontSize: 9, color: "#71717a", marginTop: 2 }}>{stat.label}</div>
         </div>
        ))}
       </div>
      </div>
     </div>

     {/* Signal breakdown */}
     <div style={S.card}>
      <p style={S.sectionTitle}>📋 Signal Breakdown</p>
      <div style={{ fontSize: 11, color: "#71717a", marginBottom: 14 }}>
       All 16 signals sorted by impact weight. <strong style={{ color: "#fde68a" }}>⚠ High-weight failures</strong> hurt your score the most — fix those first.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
       {(result.signals || []).sort((a, b) => {
        if (a.pass !== b.pass) return a.pass ? 1 : -1;
        return b.weight - a.weight;
       }).map((sig, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 10px", background: "#09090b", border: `1px solid ${sig.pass ? "#166534" : sig.weight >= 7 ? "#7c2d12" : "#7f1d1d"}`, borderRadius: 8, opacity: sig.pass ? 0.85 : 1 }}>
         <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1, color: sig.pass ? "#22c55e" : "#ef4444" }}>{sig.pass ? "✓" : "✗"}</span>
         <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: sig.pass ? "#86efac" : "#fca5a5", marginBottom: 2 }}>{sig.name}</div>
          <div style={{ fontSize: 10, color: "#71717a" }}>{sig.value}</div>
         </div>
         <span style={{ fontSize: 9, fontWeight: 700, color: sig.weight >= 7 ? "#fde68a" : "#52525b", background: sig.weight >= 7 ? "#78350f" : "#27272a", borderRadius: 4, padding: "2px 5px", flexShrink: 0 }}>×{sig.weight}</span>
        </div>
       ))}
      </div>
     </div>

     {/* Priority fixes */}
     {result.issues.length > 0 && (
      <div style={S.card}>
       <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 10 }}>
        <p style={{ ...S.sectionTitle, margin: 0 }}>🔧 Priority Fixes</p>
        {/* Beginner / Advanced toggle */}
        <div style={{ display: "flex", background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, padding: 3, gap: 3 }}>
         <button onClick={() => setFixMode("beginner")} style={{ background: fixMode === "beginner" ? "#4c1d95" : "transparent", border: "none", borderRadius: 6, padding: "5px 14px", fontSize: 11, fontWeight: 700, color: fixMode === "beginner" ? "#c4b5fd" : "#71717a", cursor: "pointer" }}>👶 Beginner</button>
         <button onClick={() => setFixMode("advanced")} style={{ background: fixMode === "advanced" ? "#292524" : "transparent", border: "none", borderRadius: 6, padding: "5px 14px", fontSize: 11, fontWeight: 700, color: fixMode === "advanced" ? "#fbbf24" : "#71717a", cursor: "pointer" }}>⚙️ Advanced</button>
        </div>
       </div>
       <div style={{ fontSize: 11, color: "#71717a", marginBottom: 14 }}>
        {fixMode === "beginner"
         ? "🪄 Beginner mode — click Fix for me and AURA will automatically update your store content."
         : "⚙️ Advanced mode — generate a fix plan and apply the changes yourself."}
       </div>
       {fixMode === "advanced" && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
         {fixErr && <span style={{ fontSize: 11, color: "#fca5a5", marginRight: 8 }}>{fixErr}</span>}
         <button onClick={getFixPlan} disabled={fixLoading} style={{ background: fixPlan ? "#27272a" : "#4c1d95", border: `1px solid ${fixPlan ? "#3f3f46" : "#7c3aed"}`, borderRadius: 6, padding: "7px 16px", fontSize: 12, fontWeight: 700, color: fixPlan ? "#a1a1aa" : "#c4b5fd", cursor: fixLoading ? "default" : "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          {fixLoading
           ? <><div style={{ width: 10, height: 10, border: "1.5px solid #7c3aed", borderTopColor: "transparent", borderRadius: "50%", animation: "ait-spin 0.8s linear infinite" }} /> Generating…</>
           : fixPlan ? "✓ Fix Plan Ready" : "✨ Generate AI Fix Plan (1 credit)"}
         </button>
        </div>
       )}
       {(result.signals || []).filter(s => !s.pass).sort((a, b) => b.weight - a.weight).map((sig, i) => {
        const afs = autoFixStates[sig.name] || {};
        return (
        <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "14px 0", borderBottom: "1px solid #27272a" }}>
         <div style={{ width: 26, height: 26, background: afs.done ? "#14532d" : "#7f1d1d", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: afs.done ? "#86efac" : "#fca5a5", flexShrink: 0, marginTop: 2 }}>{afs.done ? "✓" : `#${i + 1}`}</div>
         <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
           <span style={{ fontSize: 13, fontWeight: 700, color: afs.done ? "#86efac" : "#fafafa" }}>{sig.name}</span>
           <span style={{ fontSize: 9, fontWeight: 700, color: sig.weight >= 7 ? "#fde68a" : "#a1a1aa", background: sig.weight >= 7 ? "#78350f" : "#27272a", borderRadius: 4, padding: "2px 6px" }}>weight ×{sig.weight}</span>
           {sig.weight >= 7 && <span style={{ fontSize: 9, fontWeight: 700, color: "#fb923c", background: "#431407", borderRadius: 4, padding: "2px 6px" }}>HIGH IMPACT</span>}
          </div>
          <div style={{ fontSize: 11, color: "#71717a", marginBottom: 8 }}>Detected: {sig.value}</div>
          {fixMode === "beginner" && (
           <div>
            {afs.done ? (
             <div style={{ background: "#052e16", border: "1px solid #166534", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#86efac" }}>{afs.message || "Fixed!"}</div>
            ) : afs.error ? (
             <div style={{ background: "#2d0000", border: "1px solid #7f1d1d", borderRadius: 8, padding: "10px 14px", fontSize: 11, color: "#fca5a5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>⚠️ {afs.error}</span>
              <button onClick={() => autoFix(sig.name)} style={{ background: "#7f1d1d", border: "none", borderRadius: 4, padding: "3px 10px", fontSize: 10, color: "#fca5a5", cursor: "pointer" }}>Retry</button>
             </div>
            ) : (
             <button onClick={() => autoFix(sig.name)} disabled={afs.loading} style={{ display: "flex", alignItems: "center", gap: 6, background: "#4c1d95", border: "1px solid #7c3aed", borderRadius: 6, padding: "7px 16px", fontSize: 12, fontWeight: 700, color: "#c4b5fd", cursor: afs.loading ? "default" : "pointer", opacity: afs.loading ? 0.7 : 1 }}>
              {afs.loading ? <><div style={{ width: 10, height: 10, border: "1.5px solid #7c3aed", borderTopColor: "transparent", borderRadius: "50%", animation: "ait-spin 0.8s linear infinite" }} />Fixing…</> : <>✨ Fix for me</>}
             </button>
            )}
           </div>
          )}
          {fixMode === "advanced" && fixPlan && fixPlan[sig.name] && (
           <div style={{ background: "#0c0c10", border: "1px solid #4c1d95", borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
             <span style={{ fontSize: 10, fontWeight: 700, color: "#a855f7", textTransform: "uppercase", letterSpacing: 0.6 }}>How to fix</span>
             <button onClick={() => copyFix(sig.name, fixPlan[sig.name])} style={{ background: "none", border: "1px solid #3f3f46", borderRadius: 4, padding: "2px 8px", fontSize: 10, color: copiedFix === sig.name ? "#22c55e" : "#a1a1aa", cursor: "pointer" }}>
              {copiedFix === sig.name ? "✓ Copied" : "Copy"}
             </button>
            </div>
            <div style={{ fontSize: 11, color: "#d4d4d8", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{fixPlan[sig.name]}</div>
           </div>
          )}
         </div>
        </div>
        );
       })}
      </div>
     )}

     {/* Strengths */}
     {result.strengths.length > 0 && (
      <div style={S.card}>
       <p style={S.sectionTitle}>✅ What's Already Working</p>
       <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {result.strengths.map((s, i) => (
         <span key={i} style={{ fontSize: 11, background: "#14532d", border: "1px solid #166534", borderRadius: 6, padding: "4px 10px", color: "#86efac" }}>✓ {s}</span>
        ))}
       </div>
      </div>
     )}

     {/* Recent scans */}
     {history.length > 0 && (
      <div style={S.card}>
       <p style={S.sectionTitle}>🕐 Recent Scans</p>
       {history.map((h, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderBottom: i < history.length - 1 ? "1px solid #27272a" : "none" }}>
         <span style={{ fontSize: 17, fontWeight: 700, color: h.score >= 70 ? "#22c55e" : h.score >= 50 ? "#f59e0b" : "#ef4444", minWidth: 36 }}>{h.score}</span>
         <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: "#d4d4d8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.url}</div>
          <div style={{ fontSize: 10, color: "#52525b", marginTop: 2 }}>{new Date(h.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</div>
         </div>
         <span style={{ fontSize: 12, fontWeight: 700, color: h.grade === "A+" || h.grade === "A" ? "#22c55e" : h.grade === "B" ? "#f59e0b" : "#ef4444", minWidth: 24 }}>{h.grade}</span>
         <button onClick={() => { setUrl(h.url); }} style={{ background: "#27272a", border: "none", borderRadius: 5, padding: "4px 10px", fontSize: 10, color: "#a1a1aa", cursor: "pointer" }}>Re-scan</button>
        </div>
       ))}
      </div>
     )}
    </div>
   )}
  </div>
 );
}

/* Tab: Prompt Testing */
function PromptTestTab() {
 const [brand, setBrand] = useState("");
 const [promptsText, setPromptsText] = useState("");
 const [competitors, setCompetitors] = useState("");
 const [result, setResult] = useState(null);
 const [loading, setLoading] = useState(false);
 const [err, setErr] = useState("");

 const run = useCallback(async () => {
 const prompts = promptsText.split("\n").map(p => p.trim()).filter(Boolean);
 if (!brand || prompts.length === 0) return;
 setLoading(true); setErr(""); setResult(null);
 try {
 const d = await apiFetch(`${API}/prompt-test`, { method: "POST", body: JSON.stringify({ brand, prompts, competitors: competitors.split(",").map(c => c.trim()).filter(Boolean) }) });
 if (!d.ok) throw new Error(d.error);
 setResult(d);
 } catch (e) { setErr(e.message); } finally { setLoading(false); }
 }, [brand, promptsText, competitors]);

 return (
 <div>
 <div style={S.card}>
 <p style={S.sectionTitle}> AI Prompt Visibility Test</p>
 <div style={S.infoBox}>Simulate how AI models (ChatGPT, Perplexity, Gemini) respond to prompts in your niche and whether your brand would be cited. Up to 5 prompts per test.</div>
 <div style={S.row}>
 <div style={S.col}>
 <label style={S.label}>Your brand name or domain</label>
 <input style={S.input} value={brand} onChange={e => setBrand(e.target.value)} placeholder="Acme Store / acmestore.com"/>
 </div>
 <div style={S.col}>
 <label style={S.label}>Competitors (comma-separated)</label>
 <input style={S.input} value={competitors} onChange={e => setCompetitors(e.target.value)} placeholder="Competitor A, Competitor B"/>
 </div>
 </div>
 <label style={S.label}>Prompts to test (one per line, max 5)</label>
 <textarea style={S.textarea} value={promptsText} onChange={e => setPromptsText(e.target.value)} placeholder={"best eco-friendly yoga mats\nhow to choose a yoga mat for beginners\ntop yoga mat brands 2026"} />
 <button style={S.btn()} onClick={run} disabled={loading}>{loading ? "Testing": "Test Prompt Visibility (2 credits)"}</button>
 </div>
 {err && <div style={S.error}>{err}</div>}
 {result && (
 <div style={S.card}>
 <div style={{ ...S.row, alignItems: "center", marginBottom: "16px"}}>
 <ScoreCircle score={result.avgScore} label="Avg Confidence"/>
 <div style={{ flex: 1 }}>
 <div style={{ fontSize: "14px", fontWeight: 600, color: "#fafafa"}}>{result.citedCount}/{result.total} prompts brand likely cited</div>
 <div style={{ fontSize: "12px", color: "#a1a1aa", marginTop: "4px"}}>Average AI citation confidence: {result.avgScore}/100</div>
 </div>
 </div>
 {result.results.map((r, i) => (
 <div key={i} style={{ ...S.passCard(r.likelyCited), flexDirection: "column", alignItems: "flex-start"}}>
 <div style={{ display: "flex", justifyContent: "space-between", width: "100%"}}>
 <span style={{ fontSize: "12px", fontWeight: 600, color: "#fafafa"}}>"{r.prompt}"</span>
 <span style={S.badge(r.likelyCited ? "#166534": "#7f1d1d", r.likelyCited ? "#86efac": "#fca5a5")}>{r.likelyCited ? "Likely Cited": "Not Cited"} {r.confidenceScore}%</span>
 </div>
 <div style={{ fontSize: "11px", color: "#a1a1aa", marginTop: "6px"}}>{r.reasoning}</div>
 {r.gapAnalysis && <div style={{ fontSize: "11px", color: "#c4b5fd", marginTop: "4px"}}> {r.gapAnalysis}</div>}
 {r.competitorsThatWouldBeCited?.length > 0 && (
 <div style={{ fontSize: "11px", color: "#71717a", marginTop: "4px"}}>Competitors cited: {r.competitorsThatWouldBeCited.join(", ")}</div>
 )}
 </div>
 ))}
 </div>
 )}
 </div>
 );
}

/* Tab: AI Share of Voice */
function SoVTab() {
 const [brand, setBrand] = useState("");
 const [competitors, setCompetitors] = useState("");
 const [promptsText, setPromptsText] = useState("");
 const [result, setResult] = useState(null);
 const [loading, setLoading] = useState(false);
 const [err, setErr] = useState("");

 const run = useCallback(async () => {
 const prompts = promptsText.split("\n").map(p => p.trim()).filter(Boolean);
 const comps = competitors.split(",").map(c => c.trim()).filter(Boolean);
 if (!brand || prompts.length === 0 || comps.length === 0) return;
 setLoading(true); setErr(""); setResult(null);
 try {
 const d = await apiFetch(`${API}/ai-sov`, { method: "POST", body: JSON.stringify({ brand, competitors: comps, prompts }) });
 if (!d.ok) throw new Error(d.error);
 setResult(d);
 } catch (e) { setErr(e.message); } finally { setLoading(false); }
 }, [brand, competitors, promptsText]);

 return (
 <div>
 <div style={S.card}>
 <p style={S.sectionTitle}> AI Share of Voice</p>
 <div style={S.infoBox}>Compare your brand's AI citation probability against competitors across key prompts. See exactly who AI models prefer and why.</div>
 <div style={S.row}>
 <div style={S.col}>
 <label style={S.label}>Your brand</label>
 <input style={S.input} value={brand} onChange={e => setBrand(e.target.value)} placeholder="Your Brand"/>
 </div>
 <div style={S.col}>
 <label style={S.label}>Competitors (2-4, comma-separated)</label>
 <input style={S.input} value={competitors} onChange={e => setCompetitors(e.target.value)} placeholder="Competitor A, Competitor B, Competitor C"/>
 </div>
 </div>
 <label style={S.label}>Target prompts (one per line, max 3)</label>
 <textarea style={S.textarea} value={promptsText} onChange={e => setPromptsText(e.target.value)} placeholder={"best yoga mats for beginners\ntop rated eco yoga mats\nhow to pick a yoga mat"} />
 <button style={S.btn()} onClick={run} disabled={loading}>{loading ? "Analyzing": "Analyze AI Share of Voice (3 credits)"}</button>
 </div>
 {err && <div style={S.error}>{err}</div>}
 {result && (
 <div style={S.card}>
 <div style={{ ...S.row, alignItems: "center", marginBottom: "20px"}}>
 <ScoreCircle score={result.yourSoV} label={`${result.brand} SoV`} />
 <div>
 <div style={{ fontSize: "16px", fontWeight: 700, color: "#fafafa"}}>Rank #{result.yourRank} of {result.totalBrands} brands</div>
 <div style={{ fontSize: "12px", color: "#a1a1aa"}}>Your AI Share of Voice: {result.yourSoV}%</div>
 </div>
 </div>
 <p style={{ fontSize: "12px", fontWeight: 600, color: "#a1a1aa", marginBottom: "10px"}}>Brand Comparison</p>
 {result.sovScores.map((s, i) => (
 <div key={i} style={{ marginBottom: "8px"}}>
 <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px"}}>
 <span style={{ fontSize: "12px", color: s.isYou ? "#c4b5fd": "#fafafa", fontWeight: s.isYou ? 700 : 400 }}>
 {s.isYou ? "": ""}{s.brand}
 </span>
 <span style={{ fontSize: "12px", color: "#a1a1aa"}}>{s.avgCitationProbability}%</span>
 </div>
 <div style={{ background: "#27272a", borderRadius: "3px", height: "6px"}}>
 <div style={{ background: s.isYou ? "#7c3aed": "#52525b", height: "6px", borderRadius: "3px", width: `${s.avgCitationProbability}%`, transition: "width 0.5s"}} />
 </div>
 </div>
 ))}
 {result.promptResults.map((pr, i) => pr.insight && (
 <div key={i} style={{ ...S.infoBox, marginTop: "12px"}}>
 <span style={{ fontSize: "11px", fontWeight: 600 }}>"{pr.prompt}"</span>
 <span style={{ fontSize: "11px"}}>{pr.insight}</span>
 </div>
 ))}
 </div>
 )}
 </div>
 );
}

/* Tab: Seeding Plan */
function SeedingPlanTab() {
 const [brand, setBrand] = useState("");
 const [niche, setNiche] = useState("");
 const [targetPrompts, setTargetPrompts] = useState("");
 const [result, setResult] = useState(null);
 const [loading, setLoading] = useState(false);
 const [err, setErr] = useState("");
 const [contentModal, setContentModal] = useState(null); // { platform, title, content, tip, loading, subreddits }
 const [generatingFor, setGeneratingFor] = useState(null);
 const [copied, setCopied] = useState(false);
 const [postHistory, setPostHistory] = useState([]);
 const [markingPosted, setMarkingPosted] = useState(false);
 const [markedPosted, setMarkedPosted] = useState(false);

 const loadHistory = useCallback(async () => {
 try {
 const d = await apiFetch(`${API}/seeding-posts`);
 if (d.ok) setPostHistory(d.posts || []);
 } catch {}
 }, []);

 useEffect(() => { loadHistory(); }, [loadHistory]);
 const [shopCtx, setShopCtx] = useState(null); // { available, brand, niche, productCount, products }
 const [shopCtxLoading, setShopCtxLoading] = useState(true);
 const [progress, setProgress] = useState(0); // 0-100 for animated progress bar

 // Auto-fetch Shopify store context on mount
 useEffect(() => {
 let cancelled = false;
 async function loadShopify() {
 try {
 const d = await apiFetch(`${API}/shopify-context`);
 if (cancelled) return;
 if (d.ok && d.available) {
 setShopCtx(d);
 // Only pre-fill if fields are still empty
 if (!brand) setBrand(d.brand || "");
 if (!niche) setNiche(d.niche || "");
 }
 } catch {}
 finally { if (!cancelled) setShopCtxLoading(false); }
 }
 loadShopify();
 return () => { cancelled = true; };
 }, []); // eslint-disable-line react-hooks/exhaustive-deps

 const run = useCallback(async () => {
 if (!brand || !niche) return;
 setLoading(true); setErr(""); setResult(null); setProgress(0);
 // Animate progress bar while waiting for AI
 const tick = setInterval(() => setProgress(p => p < 85 ? p + Math.random() * 8 : p), 800);
 try {
 // Pass top product titles to AI for richer, product-specific content
 const productContext = shopCtx?.products?.slice(0, 6).map(p => p.title) || [];
 const d = await apiFetch(`${API}/seeding-plan`, { method: "POST", body: JSON.stringify({ brand, niche, targetPrompts: targetPrompts.split("\n").map(p => p.trim()).filter(Boolean), productContext }) });
 if (!d.ok) throw new Error(d.error);
 setProgress(100);
 setTimeout(() => setProgress(0), 600);
 setResult(d);
 } catch (e) { setErr(e.message); setProgress(0); } finally { clearInterval(tick); setLoading(false); }
 }, [brand, niche, targetPrompts, shopCtx]);

 const generateContent = useCallback(async (platform) => {
 setGeneratingFor(platform.platform);
 setContentModal({ platform: platform.platform, loading: true });
 try {
 const productContext = shopCtx?.products?.slice(0, 6).map(p => p.title) || [];
 const d = await apiFetch(`${API}/generate-seeding-content`, { method: "POST", body: JSON.stringify({
 platform: platform.platform,
 brand,
 niche,
 strategy: platform.strategy,
 contentType: platform.contentType,
 subreddits: platform.subreddits || [],
 targetPrompts: targetPrompts.split("\n").map(p => p.trim()).filter(Boolean),
 productContext,
 }) });
 if (!d.ok) throw new Error(d.error);
 setContentModal({ platform: platform.platform, title: d.title, content: d.content, tip: d.tip, subreddits: platform.subreddits || [], loading: false });
 } catch (e) {
 setContentModal({ platform: platform.platform, error: e.message, loading: false });
 } finally { setGeneratingFor(null); }
 }, [brand, niche, targetPrompts, shopCtx]);

 return (
 <div>
 {/* Content modal */}
 {contentModal && (
 <div onClick={() => { setContentModal(null); setCopied(false); }} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
 <div onClick={e => e.stopPropagation()} style={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 28, maxWidth: 640, width: "100%", maxHeight: "85vh", overflowY: "auto", position: "relative" }}>
 <button onClick={() => { setContentModal(null); setCopied(false); }} style={{ position: "absolute", top: 14, right: 16, background: "none", border: "none", color: "#71717a", fontSize: 20, cursor: "pointer" }}>×</button>
 <div style={{ fontSize: 11, color: "#a855f7", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{contentModal.platform}</div>
 {contentModal.loading ? (
 <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "30px 0" }}>
 <div style={{ width: 20, height: 20, border: "2px solid #7c3aed", borderTopColor: "transparent", borderRadius: "50%", animation: "ait-spin 0.8s linear infinite", flexShrink: 0 }} />
 <span style={{ color: "#a1a1aa", fontSize: 13 }}>Writing content with AI…</span>
 </div>
 ) : contentModal.error ? (
 <div style={{ color: "#fca5a5", fontSize: 13 }}>{contentModal.error}</div>
 ) : (
 <>
 {contentModal.title && <div style={{ fontSize: 15, fontWeight: 700, color: "#fafafa", marginBottom: 16, lineHeight: 1.4 }}>{contentModal.title}</div>}
 <div style={{ fontSize: 13, color: "#d4d4d8", lineHeight: 1.8, background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", marginBottom: 16, whiteSpace: "pre-wrap" }}>{contentModal.content}</div>
 {contentModal.tip && <div style={{ fontSize: 12, color: "#86efac", background: "#052e16", border: "1px solid #166534", borderRadius: 6, padding: "8px 12px", marginBottom: 16 }}>💡 {contentModal.tip}</div>}
 {/* Where & how to post */}
 {(() => {
 const platform = contentModal.platform;
 const subs = contentModal.subreddits || [];
 const GUIDES = {
 Reddit: {
 steps: [
 subs.length ? `Go to one of these subreddits: ${subs.slice(0,3).join(', ')}` : "Find a relevant subreddit for your niche",
 "Click 'Create Post' — choose 'Text' post type",
 "Paste the title above, then the content below it",
 "Do NOT post from a new account — build 1–2 weeks of normal activity first",
 "Post in 2–3 different subreddits over a few days, reword each one",
 ],
 links: subs.length
 ? subs.slice(0,3).map(s => ({ label: `Post to ${s}`, url: `https://www.reddit.com/${s}/submit?type=text` }))
 : [{ label: "Find subreddits", url: "https://www.reddit.com/subreddits/search" }],
 },
 Quora: {
 steps: [
 "Go to Quora and search for a question related to your niche",
 "Find a question with 1,000+ followers for maximum reach",
 "Click 'Answer' — paste the content directly",
 "Add 1–2 relevant topics/tags to the answer",
 "Link to your store only in the last paragraph, not at the top",
 ],
 links: [{ label: "Answer a question on Quora", url: "https://www.quora.com/" }],
 },
 Medium: {
 steps: [
 "Go to Medium and click 'Write'",
 "Paste the title then the article content",
 "Add 3–5 relevant tags before publishing (e.g. your niche keywords)",
 "Publish publicly — not behind Medium paywall",
 "Share the published URL in your other platforms for backlinks",
 ],
 links: [{ label: "Write on Medium", url: "https://medium.com/new-story" }],
 },
 "GitHub Discussions": {
 steps: [
 "Find a relevant open-source repo or GitHub organisation in your space",
 "Go to the 'Discussions' tab and find an appropriate category",
 "Start a new discussion or reply to an existing thread",
 "Keep it technical and genuinely helpful — mention your brand only as a practical example",
 ],
 links: [{ label: "Explore GitHub Discussions", url: "https://github.com/" }],
 },
 };
 const guide = GUIDES[platform] || {
 steps: ["Find the platform's community or forum section", "Create a new post or reply to an existing discussion", "Paste the content and mention your brand naturally"],
 links: [],
 };
 return (
 <div style={{ background: "#0f0f13", border: "1px solid #3f3f46", borderRadius: 8, padding: "14px 16px", marginBottom: 20 }}>
 <div style={{ fontSize: 10, fontWeight: 700, color: "#a855f7", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>How to post this on {platform}</div>
 {guide.steps.map((step, i) => (
 <div key={i} style={{ display: "flex", gap: 10, marginBottom: 7, alignItems: "flex-start" }}>
 <span style={{ fontSize: 10, fontWeight: 700, color: "#52525b", flexShrink: 0, marginTop: 2, minWidth: 14 }}>{i + 1}.</span>
 <span style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.55 }}>{step}</span>
 </div>
 ))}
 <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
 {guide.links.map((link, i) => (
 <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
 style={{ background: "#18181b", border: "1px solid #7c3aed", borderRadius: 6, padding: "7px 14px", fontSize: 12, fontWeight: 600, color: "#c4b5fd", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
 ↗ {link.label}
 </a>
 ))}
 </div>
 </div>
 );
 })()}
 <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
 <button onClick={() => {
 navigator.clipboard?.writeText((contentModal.title ? contentModal.title + "\n\n" : "") + contentModal.content);
 setCopied(true); setTimeout(() => setCopied(false), 2000);
 }} style={{ background: copied ? "#166534" : "#7c3aed", border: "none", borderRadius: 6, padding: "8px 16px", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "background 0.2s" }}>{copied ? "✓ Copied!" : "Copy to clipboard"}</button>
 <button onClick={async () => {
 if (markingPosted) return;
 setMarkingPosted(true);
 try {
 await apiFetch(`${API}/seeding-posts`, { method: "POST", body: JSON.stringify({
 platform: contentModal.platform,
 title: contentModal.title || null,
 contentSnippet: (contentModal.content || "").slice(0, 200),
 brand,
 niche,
 }) });
 setMarkedPosted(true);
 loadHistory();
 setTimeout(() => setMarkedPosted(false), 3000);
 } catch {} finally { setMarkingPosted(false); }
 }} style={{ background: markedPosted ? "#052e16" : "#18181b", border: `1px solid ${markedPosted ? "#166534" : "#3f3f46"}`, borderRadius: 6, padding: "8px 16px", color: markedPosted ? "#86efac" : "#a1a1aa", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
 {markingPosted ? "Saving…" : markedPosted ? "✓ Logged!" : "✓ Mark as Posted"}
 </button>
 <button onClick={() => generateContent({ platform: contentModal.platform, strategy: "", contentType: "", subreddits: contentModal.subreddits || [] })} style={{ background: "#27272a", border: "none", borderRadius: 6, padding: "8px 16px", color: "#a1a1aa", fontSize: 12, cursor: "pointer" }}>Regenerate</button>
 </div>
 </>
 )}
 </div>
 </div>
 )}
 <div style={S.card}>
 <p style={S.sectionTitle}> LLM Seeding Plan</p>
 {/* How it works — mechanism explainer */}
 <div style={{ background: "#0f0f13", border: "1px solid #3f3f46", borderRadius: 10, padding: "16px", marginBottom: 14 }}>
 <div style={{ fontSize: 12, fontWeight: 700, color: "#a855f7", marginBottom: 12, letterSpacing: 0.5 }}>WHY THIS GETS YOU TRAFFIC & AI CITATIONS</div>
 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
 {/* Track 1 */}
 <div>
 <div style={{ fontSize: 10, fontWeight: 700, color: "#93c5fd", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Track 1 — Google traffic (fast)</div>
 {["You post a helpful comment or answer on Reddit / Quora", "Google indexes it within 24–48 hours", "Your post ranks for niche searches", "People searching click through to your store"].map((step, i) => (
 <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7, alignItems: "flex-start" }}>
 <span style={{ fontSize: 10, fontWeight: 700, color: "#3f3f46", flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
 <span style={{ fontSize: 11, color: "#a1a1aa", lineHeight: 1.5 }}>{step}</span>
 </div>
 ))}
 </div>
 {/* Track 2 */}
 <div>
 <div style={{ fontSize: 10, fontWeight: 700, color: "#c4b5fd", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Track 2 — AI citations (compounds)</div>
 {["The same posts get scraped by AI training crawlers", "ChatGPT, Gemini, Perplexity train on your content", "A customer asks AI about your niche", "AI recommends your brand because it's seen it hundreds of times"].map((step, i) => (
 <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7, alignItems: "flex-start" }}>
 <span style={{ fontSize: 10, fontWeight: 700, color: "#3f3f46", flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
 <span style={{ fontSize: 11, color: "#a1a1aa", lineHeight: 1.5 }}>{step}</span>
 </div>
 ))}
 </div>
 </div>
 <div style={{ borderTop: "1px solid #27272a", marginTop: 14, paddingTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
 {[
 { period: "Week 1–2", outcome: "Google indexes your posts. Early traffic starts if there's search volume." },
 { period: "Month 1–3", outcome: "Posts rank on Google. Quora answers appear in search results." },
 { period: "Month 3–12", outcome: "AI models cite your brand in responses for your niche queries." },
 ].map((t, i) => (
 <div key={i}>
 <div style={{ fontSize: 10, fontWeight: 700, color: "#fafafa", marginBottom: 3 }}>{t.period}</div>
 <div style={{ fontSize: 10, color: "#52525b", lineHeight: 1.5 }}>{t.outcome}</div>
 </div>
 ))}
 </div>
 </div>
 <div style={S.row}>
 <div style={S.col}>
 <label style={S.label}>Brand name</label>
 <input style={S.input} value={brand} onChange={e => setBrand(e.target.value)} placeholder="Your Brand"/>
 </div>
 <div style={S.col}>
 <label style={S.label}>Niche / industry</label>
 <input style={S.input} value={niche} onChange={e => setNiche(e.target.value)} placeholder="eco-friendly yoga equipment"/>
 </div>
 </div>
 {/* Shopify store context badge */}
 {shopCtxLoading ? (
 <div style={{ fontSize: 11, color: "#71717a", marginBottom: 8 }}>⟳ Loading your store data…</div>
 ) : shopCtx?.available ? (
 <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, padding: "7px 12px", background: "#052e16", border: "1px solid #166534", borderRadius: 8, fontSize: 11 }}>
 <span style={{ color: "#86efac", fontWeight: 700 }}>✓ Loaded from your Shopify store</span>
 <span style={{ color: "#4ade80" }}>{shopCtx.productCount} product{shopCtx.productCount !== 1 ? "s" : ""}</span>
 {shopCtx.collections?.length > 0 && <span style={{ color: "#4ade80" }}>· {shopCtx.collections.slice(0,3).join(", ")}</span>}
 <span style={{ color: "#166534", marginLeft: "auto" }}>Fields pre-filled — edit anytime</span>
 </div>
 ) : null}
 <label style={S.label}>Target prompts you want to appear in (one per line)</label>
 <textarea style={{ ...S.textarea, minHeight: "60px"}} value={targetPrompts} onChange={e => setTargetPrompts(e.target.value)} placeholder="best yoga mats for hot yoga"/>
 <button style={S.btn()} onClick={run} disabled={loading}>{loading ? "Generating plan…" : "Generate Seeding Plan (2 credits)"}</button>
 {loading && (
 <div style={{ marginTop: 12 }}>
 <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#a1a1aa", marginBottom: 4 }}>
 <span>Analysing platforms and building your plan…</span>
 <span>{Math.round(progress)}%</span>
 </div>
 <div style={{ background: "#27272a", borderRadius: 4, height: 6, overflow: "hidden" }}>
 <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #7c3aed, #a855f7)", borderRadius: 4, transition: "width 0.6s ease" }} />
 </div>
 <div style={{ marginTop: 8, fontSize: 11, color: "#71717a", display: "flex", gap: 6, flexWrap: "wrap" }}>
 {["Researching platforms", "Mapping LLM influence", "Crafting strategy", "Building content pillars"].map((step, i) => (
 <span key={i} style={{ background: progress > i * 22 ? "#4c1d95" : "#18181b", border: `1px solid ${progress > i * 22 ? "#7c3aed" : "#3f3f46"}`, borderRadius: 10, padding: "2px 8px", color: progress > i * 22 ? "#c4b5fd" : "#52525b", transition: "all 0.4s" }}>{step}</span>
 ))}
 </div>
 </div>
 )}
 </div>
 {err && <div style={S.error}>{err}</div>}
 {result && (
 <div>
 {result.quickWins && (
 <div style={S.card}>
 <p style={S.sectionTitle}> Quick Wins</p>
 {result.quickWins.map((w, i) => <div key={i} style={{ fontSize: "12px", color: "#86efac", marginBottom: "6px"}}> {w}</div>)}
 </div>
 )}
 {result.platforms && result.platforms.map((p, i) => {
 const POST_AS = {
 Reddit: { account: "Personal Reddit account", tip: "Never post from a brand account — it gets flagged as spam. Create a personal account, build 2–3 weeks of normal activity, then start posting.", color: "#ff6314" },
 Quora: { account: "Personal or founder account", tip: "Set up your Quora profile as the founder or an expert in your field. Add your brand in the bio, not in every answer.", color: "#a82400" },
 Medium: { account: "Brand publication or personal", tip: "You can post directly as your brand on Medium. Set up a brand publication and publish under it for maximum credibility.", color: "#00ab6c" },
 "GitHub Discussions": { account: "Your personal GitHub account", tip: "Contribute genuinely to open-source discussions. Mention your tool only when directly relevant to the conversation.", color: "#6e40c9" },
 };
 const guide = POST_AS[p.platform] || { account: "Personal account (not brand)", tip: "Engage authentically as an individual. Build credibility before mentioning your brand.", color: "#7c3aed" };
 return (
 <div key={i} style={S.card}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px"}}>
 <span style={{ fontSize: "14px", fontWeight: 600, color: "#fafafa"}}>{p.platform}</span>
 <div style={{ display: "flex", gap: "6px", alignItems: "center"}}>
 <span style={S.badge(p.priority === "high"? "#7f1d1d": p.priority === "medium"? "#78350f": "#1e3a5f", p.priority === "high"? "#fca5a5": p.priority === "medium"? "#fde68a": "#93c5fd")}>{p.priority}</span>
 <span style={S.badge("#27272a", "#a1a1aa")}>{p.contentType}</span>
 <button
 onClick={() => generateContent(p)}
 disabled={generatingFor === p.platform}
 style={{ background: "#4c1d95", border: "1px solid #7c3aed", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: generatingFor === p.platform ? "#a1a1aa" : "#c4b5fd", cursor: generatingFor === p.platform ? "default" : "pointer", display: "flex", alignItems: "center", gap: 5 }}
 >
 {generatingFor === p.platform ? (
 <><div style={{ width: 10, height: 10, border: "1.5px solid #7c3aed", borderTopColor: "transparent", borderRadius: "50%", animation: "ait-spin 0.8s linear infinite" }} /> Writing…</>
 ) : "✨ Write with AI"}
 </button>
 </div>
 </div>
 <div style={{ fontSize: "12px", color: "#a1a1aa", marginBottom: "6px"}}>{p.strategy}</div>
 <div style={{ fontSize: "11px", color: "#c4b5fd"}}>Why it matters: {p.whyItMatters}</div>
 <div style={{ fontSize: "11px", color: "#71717a", marginTop: "4px"}}>Time to impact: {p.timeToImpact}</div>
 {/* Post as guidance */}
 <div style={{ marginTop: 10, padding: "8px 10px", background: "#0f0f13", border: `1px solid ${guide.color}33`, borderRadius: 7, display: "flex", gap: 8, alignItems: "flex-start" }}>
 <span style={{ fontSize: 14, flexShrink: 0 }}>👤</span>
 <div>
 <span style={{ fontSize: 10, fontWeight: 700, color: guide.color, textTransform: "uppercase", letterSpacing: 0.5 }}>Post as: </span>
 <span style={{ fontSize: 11, color: "#d4d4d8", fontWeight: 600 }}>{guide.account}</span>
 <div style={{ fontSize: 11, color: "#71717a", marginTop: 2, lineHeight: 1.5 }}>{guide.tip}</div>
 </div>
 </div>
 {p.subreddits && p.subreddits.length > 0 && (
 <div style={{ marginTop: "6px"}}>{p.subreddits.map((s, j) => <span key={j} style={{ ...S.badge("#1e1b4b", "#a5b4fc"), marginRight: "4px"}}>{s}</span>)}</div>
 )}
 </div>
 );
 })}
 {result.longTermStrategy && (
 <div style={{ ...S.card, borderColor: "#4c1d95"}}>
 <p style={S.sectionTitle}> Long-Term Strategy</p>
 <div style={{ fontSize: "12px", color: "#c4b5fd"}}>{result.longTermStrategy}</div>
 {result.contentPillars && (
 <div style={{ marginTop: "10px"}}>
 <span style={{ fontSize: "11px", color: "#71717a"}}>Content Pillars: </span>
 {result.contentPillars.map((p, i) => <span key={i} style={{ ...S.badge("#1e1b4b", "#a5b4fc"), marginRight: "4px"}}>{p}</span>)}
 </div>
 )}
 </div>
 )}
 </div>
 )}
 {/* Posting History */}
 <div style={S.card}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
 <p style={{ ...S.sectionTitle, margin: 0 }}>📋 Posting History</p>
 <span style={{ fontSize: 11, color: "#52525b" }}>{postHistory.length} post{postHistory.length !== 1 ? "s" : ""} logged</span>
 </div>
 {postHistory.length === 0 ? (
 <div style={{ fontSize: 12, color: "#52525b", textAlign: "center", padding: "20px 0" }}>
 No posts logged yet. Generate content and click "✓ Mark as Posted" to track your activity.
 </div>
 ) : (
 <div>
 {/* Summary row */}
 <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
 {Object.entries(postHistory.reduce((acc, p) => { acc[p.platform] = (acc[p.platform] || 0) + 1; return acc; }, {})).map(([plat, count]) => (
 <span key={plat} style={{ ...S.badge("#1e1b4b", "#a5b4fc"), fontSize: 11 }}>{plat}: {count}</span>
 ))}
 </div>
 {postHistory.slice(0, 30).map((post) => (
 <div key={post.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid #27272a" }}>
 <div style={{ flexShrink: 0, width: 36, height: 36, background: "#27272a", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
 {post.platform === "Reddit" ? "🟠" : post.platform === "Quora" ? "🔴" : post.platform === "Medium" ? "🟢" : post.platform === "GitHub Discussions" ? "🟣" : "📝"}
 </div>
 <div style={{ flex: 1, minWidth: 0 }}>
 <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
 <span style={{ fontSize: 12, fontWeight: 600, color: "#fafafa" }}>{post.platform}</span>
 <span style={{ fontSize: 10, color: "#52525b" }}>{new Date(post.postedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
 <span style={{ fontSize: 10, color: "#3f3f46" }}>·</span>
 <span style={{ fontSize: 10, color: "#52525b" }}>{new Date(post.postedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
 </div>
 {post.title && <div style={{ fontSize: 12, color: "#d4d4d8", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.title}</div>}
 {post.contentSnippet && <div style={{ fontSize: 11, color: "#71717a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.contentSnippet}…</div>}
 </div>
 <button onClick={async () => {
 await apiFetch(`${API}/seeding-posts/${post.id}`, { method: "DELETE" });
 loadHistory();
 }} style={{ background: "none", border: "none", color: "#3f3f46", fontSize: 13, cursor: "pointer", flexShrink: 0, padding: 4 }} title="Remove">×</button>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 );
}

/* Tab: Term Analysis */
function TermAnalysisTab() {
 const [keyword, setKeyword] = useState("");
 const [url, setUrl] = useState("");
 const [result, setResult] = useState(null);
 const [loading, setLoading] = useState(false);
 const [err, setErr] = useState("");

 const run = useCallback(async () => {
 if (!keyword) return;
 setLoading(true); setErr(""); setResult(null);
 try {
 const d = await apiFetch(`${API}/term-analysis`, { method: "POST", body: JSON.stringify({ keyword, url }) });
 if (!d.ok) throw new Error(d.error);
 setResult(d);
 } catch (e) { setErr(e.message); } finally { setLoading(false); }
 }, [keyword, url]);

 return (
 <div>
 <div style={S.card}>
 <p style={S.sectionTitle}> AI Term Presence Analysis</p>
 <div style={S.infoBox}>Find which specific terms AI models (Gemini, ChatGPT) use when answering your target query then compare against your page content to close the vocabulary gap.</div>
 <div style={S.row}>
 <div style={S.col}>
 <label style={S.label}>Target keyword / query</label>
 <input style={S.input} value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="best yoga mat for beginners"/>
 </div>
 <div style={S.col}>
 <label style={S.label}>Page URL to compare (optional)</label>
 <input style={S.input} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://yourstore.com/blogs/..."/>
 </div>
 </div>
 <button style={S.btn()} onClick={run} disabled={loading}>{loading ? "Analyzing": "Analyze Term Coverage (1 credit)"}</button>
 </div>
 {err && <div style={S.error}>{err}</div>}
 {result && (
 <div style={S.card}>
 <div style={{ ...S.row, alignItems: "center", marginBottom: "16px"}}>
 <ScoreCircle score={result.alignmentScore} label="AI Alignment"/>
 <div>
 <div style={{ fontSize: "14px", fontWeight: 600, color: "#fafafa"}}>AI Vocabulary Alignment: {result.alignmentScore}/100</div>
 {result.missingCriticalTerms?.length > 0 && (
 <div style={{ fontSize: "12px", color: "#fca5a5", marginTop: "4px"}}>
 Missing critical terms: {result.missingCriticalTerms.slice(0, 5).join(", ")}
 </div>
 )}
 </div>
 </div>
 {[["Always Used", result.alwaysUsedTerms, "#ef4444"], ["Often Used", result.oftenUsedTerms, "#f59e0b"], ["Sometimes Used", result.sometimesUsedTerms, "#22c55e"]].map(([label, terms, color]) => terms?.length > 0 && (
 <div key={label} style={{ marginBottom: "14px"}}>
 <p style={{ fontSize: "12px", fontWeight: 600, color, marginBottom: "6px"}}>{label} by AI ({terms.length})</p>
 <div style={{ display: "flex", flexWrap: "wrap", gap: "5px"}}>
 {terms.map((t, i) => (
 <span key={i} style={S.badge(t.presentInContent ? "rgba(34,197,94,0.15)": "rgba(239,68,68,0.15)", t.presentInContent ? "#86efac": "#fca5a5")}>
 {t.presentInContent ? "": ""} {t.term}
 </span>
 ))}
 </div>
 </div>
 ))}
 {result.termRecommendations && (
 <div style={S.infoBox}><strong>Recommendation:</strong> {result.termRecommendations}</div>
 )}
 </div>
 )}
 </div>
 );
}

/* Tab: GEO Optimizer */
function GeoOptimizerTab() {
 const [url, setUrl] = useState("");
 const [content, setContent] = useState("");
 const [keyword, setKeyword] = useState("");
 const [result, setResult] = useState(null);
 const [loading, setLoading] = useState(false);
 const [err, setErr] = useState("");

 const run = useCallback(async () => {
 if (!url && !content) return;
 setLoading(true); setErr(""); setResult(null);
 try {
 const d = await apiFetch(`${API}/geo-optimize`, { method: "POST", body: JSON.stringify({ url, content, keyword }) });
 if (!d.ok) throw new Error(d.error);
 setResult(d);
 } catch (e) { setErr(e.message); } finally { setLoading(false); }
 }, [url, content, keyword]);

 return (
 <div>
 <div style={S.card}>
 <p style={S.sectionTitle}> GEO Content Optimizer</p>
 <div style={S.infoBox}>Get specific structural rewrite suggestions to make your content more AI-parseable. AI models prefer direct definitions, numbered steps, tables, and short direct-answer paragraphs.</div>
 <label style={S.label}>Page URL (will be crawled)</label>
 <input style={S.input} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://yourstore.com/blogs/..."/>
 <label style={S.label}>Or paste content directly</label>
 <textarea style={{ ...S.textarea, minHeight: "100px"}} value={content} onChange={e => setContent(e.target.value)} placeholder="Paste your blog post content here..."/>
 <label style={S.label}>Target keyword (optional)</label>
 <input style={S.input} value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="best yoga mat"/>
 <button style={S.btn()} onClick={run} disabled={loading}>{loading ? "Optimizing": "Optimize for AI Citation (2 credits)"}</button>
 </div>
 {err && <div style={S.error}>{err}</div>}
 {result && (
 <div>
 <div style={S.card}>
 <div style={{ ...S.row, alignItems: "center", marginBottom: "16px"}}>
 <ScoreCircle score={result.geoScore} label="GEO Score"/>
 <div>
 <div style={{ fontSize: "13px", fontWeight: 600 }}>Top Issues:</div>
 {result.topIssues?.map((issue, i) => <div key={i} style={{ fontSize: "12px", color: "#fca5a5"}}> {issue}</div>)}
 </div>
 </div>
 {result.quickWins && (
 <div>
 <p style={{ fontSize: "12px", fontWeight: 600, color: "#22c55e", marginBottom: "6px"}}> Quick Wins</p>
 {result.quickWins.map((w, i) => <div key={i} style={{ fontSize: "12px", color: "#86efac", marginBottom: "4px"}}> {w}</div>)}
 </div>
 )}
 </div>
 {result.rewrites?.map((rw, i) => (
 <div key={i} style={S.card}>
 <span style={S.badge("#1e3a5f", "#93c5fd")}>{rw.type}</span>
 {rw.original && <div style={{ fontSize: "11px", color: "#71717a", marginTop: "8px", fontStyle: "italic"}}>Original: "{rw.original.slice(0, 100)}"</div>}
 <div style={{ fontSize: "12px", color: "#fafafa", marginTop: "6px"}}> {rw.improved}</div>
 <div style={{ fontSize: "11px", color: "#c4b5fd", marginTop: "4px"}}>Why: {rw.reason}</div>
 </div>
 ))}
 {result.addSections?.map((s, i) => (
 <div key={i} style={{ ...S.card, borderColor: "#4c1d95"}}>
 <span style={S.badge("#4c1d95", "#c4b5fd")}>Add Section: {s.sectionType}</span>
 <div style={{ fontSize: "12px", color: "#fafafa", marginTop: "8px"}}>{s.suggestedContent}</div>
 </div>
 ))}
 </div>
 )}
 </div>
 );
}

/* Tab: Prompt Coverage */
function PromptCoverageTab() {
 const [niche, setNiche] = useState("");
 const [domain, setDomain] = useState("");
 const [blogPostsText, setBlogPostsText] = useState("");
 const [result, setResult] = useState(null);
 const [loading, setLoading] = useState(false);
 const [err, setErr] = useState("");

 const run = useCallback(async () => {
 if (!niche) return;
 setLoading(true); setErr(""); setResult(null);
 try {
 const blogPosts = blogPostsText.split("\n").map(p => p.trim()).filter(Boolean);
 const d = await apiFetch(`${API}/prompt-coverage`, { method: "POST", body: JSON.stringify({ niche, domain, blogPosts }) });
 if (!d.ok) throw new Error(d.error);
 setResult(d);
 } catch (e) { setErr(e.message); } finally { setLoading(false); }
 }, [niche, domain, blogPostsText]);

 return (
 <div>
 <div style={S.card}>
 <p style={S.sectionTitle}> Prompt Coverage Mapping</p>
 <div style={S.infoBox}>Map ALL the AI prompts in your niche see which ones your current content covers and which create gaps. Gives you a content calendar to close gaps and dominate AI answers.</div>
 <div style={S.row}>
 <div style={S.col}>
 <label style={S.label}>Niche / industry</label>
 <input style={S.input} value={niche} onChange={e => setNiche(e.target.value)} placeholder="eco-friendly yoga equipment"/>
 </div>
 <div style={S.col}>
 <label style={S.label}>Domain (optional)</label>
 <input style={S.input} value={domain} onChange={e => setDomain(e.target.value)} placeholder="yourstore.com"/>
 </div>
 </div>
 <label style={S.label}>Existing blog post titles (one per line, optional)</label>
 <textarea style={{ ...S.textarea, minHeight: "70px"}} value={blogPostsText} onChange={e => setBlogPostsText(e.target.value)} placeholder={"How to choose a yoga mat\nBest yoga mats for hot yoga"} />
 <button style={S.btn()} onClick={run} disabled={loading}>{loading ? "Mapping coverage": "Map Prompt Coverage (2 credits)"}</button>
 </div>
 {err && <div style={S.error}>{err}</div>}
 {result && (
 <div>
 <div style={S.card}>
 <div style={{ ...S.row, alignItems: "center"}}>
 <ScoreCircle score={result.coveragePercent || 0} label="Coverage"/>
 <div>
 <div style={{ fontSize: "15px", fontWeight: 700 }}>{result.coveredCount} / {result.totalPrompts} prompts covered</div>
 <div style={{ fontSize: "12px", color: "#a1a1aa"}}>{result.totalPrompts - result.coveredCount} gap opportunities identified</div>
 </div>
 </div>
 </div>
 {result.topGaps && (
 <div style={S.card}>
 <p style={S.sectionTitle}> Top Content Gaps</p>
 {result.topGaps.map((g, i) => <div key={i} style={{ fontSize: "12px", color: "#fca5a5", marginBottom: "5px"}}> {g}</div>)}
 {result.contentCalendarSuggestion && <div style={{ ...S.infoBox, marginTop: "10px"}}>{result.contentCalendarSuggestion}</div>}
 </div>
 )}
 <div style={S.card}>
 <p style={S.sectionTitle}>All Prompts</p>
 {result.prompts?.map((p, i) => (
 <div key={i} style={{ ...S.passCard(p.covered), justifyContent: "space-between"}}>
 <div style={{ flex: 1 }}>
 <div style={{ fontSize: "12px", color: "#fafafa"}}>{p.prompt}</div>
 <div style={{ display: "flex", gap: "5px", marginTop: "4px"}}>
 <span style={S.badge()}>{p.phase}</span>
 <span style={S.badge()}>{p.contentType}</span>
 <span style={S.badge(p.priority === "high"? "#7f1d1d": "#27272a", p.priority === "high"? "#fca5a5": "#a1a1aa")}>{p.priority}</span>
 </div>
 {!p.covered && p.contentGapAction && <div style={{ fontSize: "11px", color: "#c4b5fd", marginTop: "3px"}}> {p.contentGapAction}</div>}
 </div>
 <span style={S.badge(p.covered ? "#166534": "#27272a", p.covered ? "#86efac": "#a1a1aa")}>{p.covered ? "Covered": "Gap"}</span>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}

/* Tab: AI Overview Check */
function AOCheckTab() {
 const [keywordsText, setKeywordsText] = useState("");
 const [domain, setDomain] = useState("");
 const [result, setResult] = useState(null);
 const [loading, setLoading] = useState(false);
 const [err, setErr] = useState("");

 const run = useCallback(async () => {
 const keywords = keywordsText.split("\n").map(k => k.trim()).filter(Boolean);
 if (keywords.length === 0) return;
 setLoading(true); setErr(""); setResult(null);
 try {
 const d = await apiFetch(`${API}/ao-check`, { method: "POST", body: JSON.stringify({ keywords, domain }) });
 if (!d.ok) throw new Error(d.error);
 setResult(d);
 } catch (e) { setErr(e.message); } finally { setLoading(false); }
 }, [keywordsText, domain]);

 return (
 <div>
 <div style={S.card}>
 <p style={S.sectionTitle}> AI Overview Ranking Checker</p>
 <div style={S.infoBox}>Check which of your keywords trigger Google AI Overviews, whether your store would likely be cited, and which keywords are "zero-click"risks.</div>
 <div style={S.row}>
 <div style={S.col}>
 <label style={S.label}>Keywords to check (one per line, max 10)</label>
 <textarea style={S.textarea} value={keywordsText} onChange={e => setKeywordsText(e.target.value)} placeholder={"best yoga mat\nhow to clean a yoga mat\nyoga mat vs exercise mat"} />
 </div>
 <div style={S.col}>
 <label style={S.label}>Domain (optional)</label>
 <input style={S.input} value={domain} onChange={e => setDomain(e.target.value)} placeholder="yourstore.com"/>
 </div>
 </div>
 <button style={S.btn()} onClick={run} disabled={loading}>{loading ? "Checking": "Check AI Overview Presence (2 credits)"}</button>
 </div>
 {err && <div style={S.error}>{err}</div>}
 {result && (
 <div>
 {result.summary && <div style={{ ...S.card, borderColor: "#4c1d95"}}><div style={{ fontSize: "12px", color: "#c4b5fd"}}>{result.summary}</div></div>}
 {result.highOpportunityKeywords?.length > 0 && (
 <div style={S.card}>
 <p style={{ ...S.sectionTitle, color: "#22c55e"}}> High Opportunity Keywords</p>
 {result.highOpportunityKeywords.map((k, i) => <span key={i} style={{ ...S.badge("rgba(34,197,94,0.15)", "#86efac"), marginRight: "5px"}}>{k}</span>)}
 </div>
 )}
 {result.avoidKeywords?.length > 0 && (
 <div style={S.card}>
 <p style={{ ...S.sectionTitle, color: "#ef4444"}}> Zero-Click Risk Keywords</p>
 {result.avoidKeywords.map((k, i) => <span key={i} style={{ ...S.badge("rgba(239,68,68,0.1)", "#fca5a5"), marginRight: "5px"}}>{k}</span>)}
 </div>
 )}
 {result.keywords?.map((kw, i) => (
 <div key={i} style={S.card}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start"}}>
 <span style={{ fontSize: "13px", fontWeight: 600, color: "#fafafa"}}>{kw.keyword}</span>
 <div style={{ display: "flex", gap: "5px"}}>
 <span style={S.badge(kw.likelyHasAIO ? "#1e3a5f": "#27272a", kw.likelyHasAIO ? "#93c5fd": "#a1a1aa")}>{kw.likelyHasAIO ? "AIO Present": "No AIO"}</span>
 {kw.zeroClickRisk && <span style={S.badge("#7f1d1d", "#fca5a5")}>Zero-Click Risk</span>}
 <span style={S.badge(kw.shopifyStoreLikelyCited ? "#166534": "#27272a", kw.shopifyStoreLikelyCited ? "#86efac": "#a1a1aa")}>
 {kw.citationProbability}% citation
 </span>
 </div>
 </div>
 {kw.whyOrWhyNot && <div style={{ fontSize: "11px", color: "#a1a1aa", marginTop: "6px"}}>{kw.whyOrWhyNot}</div>}
 {kw.recommendedContentAction && <div style={{ fontSize: "11px", color: "#c4b5fd", marginTop: "4px"}}> {kw.recommendedContentAction}</div>}
 </div>
 ))}
 </div>
 )}
 </div>
 );
}

/* Tab: Crawler Audit */
function CrawlerAuditTab() {
 const [domain, setDomain] = useState("");
 const [result, setResult] = useState(null);
 const [loading, setLoading] = useState(false);
 const [err, setErr] = useState("");

 const run = useCallback(async () => {
 if (!domain) return;
 setLoading(true); setErr(""); setResult(null);
 try {
 const d = await apiFetch(`${API}/crawler-audit`, { method: "POST", body: JSON.stringify({ domain }) });
 if (!d.ok) throw new Error(d.error);
 setResult(d);
 } catch (e) { setErr(e.message); } finally { setLoading(false); }
 }, [domain]);

 return (
 <div>
 <div style={S.card}>
 <p style={S.sectionTitle}> AI Crawler Audit</p>
 <div style={S.infoBox}>Verify that AI crawlers (GPTBot, PerplexityBot, ClaudeBot, Google-Extended) are not blocked in your robots.txt. Blocking these prevents your content from being cited in ChatGPT, Perplexity, and AI Overviews.</div>
 <label style={S.label}>Domain</label>
 <input style={S.input} value={domain} onChange={e => setDomain(e.target.value)} placeholder="yourstore.com or https://yourstore.com"/>
 <button style={S.btn()} onClick={run} disabled={loading}>{loading ? "Auditing": "Audit AI Crawlers"}</button>
 </div>
 {err && <div style={S.error}>{err}</div>}
 {result && (
 <div style={S.card}>
 <div style={{ ...S.row, alignItems: "center", marginBottom: "16px"}}>
 <ScoreCircle score={result.score} label="Crawler Access"/>
 <div>
 <div style={{ fontSize: "14px", fontWeight: 700, color: result.score >= 80 ? "#22c55e": "#ef4444"}}>
 {result.blockedCount === 0 ? "All AI Crawlers Allowed ": `${result.blockedCount} Crawler(s) Blocked `}
 </div>
 <div style={{ display: "flex", gap: "8px", marginTop: "6px"}}>
 <span style={S.badge(result.robotsTxtFound ? "#166534": "#7f1d1d", result.robotsTxtFound ? "#86efac": "#fca5a5")}>
 {result.robotsTxtFound ? "robots.txt found": "No robots.txt"}
 </span>
 <span style={S.badge(result.hasLlmsTxt ? "#166534": "#27272a", result.hasLlmsTxt ? "#86efac": "#a1a1aa")}>
 {result.hasLlmsTxt ? "llms.txt found": "No llms.txt"}
 </span>
 <span style={S.badge(result.hasSitemap ? "#166534": "#27272a", result.hasSitemap ? "#86efac": "#a1a1aa")}>
 {result.hasSitemap ? "Sitemap in robots": "No sitemap"}
 </span>
 </div>
 </div>
 </div>
 {result.recommendations?.length > 0 && (
 <div style={{ marginBottom: "12px"}}>
 {result.recommendations.map((r, i) => <div key={i} style={{ ...S.infoBox, borderColor: r.includes("CRITICAL") ? "#7f1d1d": "#4c1d95", color: r.includes("CRITICAL") ? "#fca5a5": "#c4b5fd"}}>{r}</div>)}
 </div>
 )}
 {result.results.map((r, i) => (
 <div key={i} style={S.passCard(r.pass)}>
 <div style={{ flex: 1 }}>
 <div style={{ display: "flex", justifyContent: "space-between"}}>
 <span style={{ fontSize: "12px", fontWeight: 600, color: "#fafafa"}}>{r.name}</span>
 <div style={{ display: "flex", gap: "5px"}}>
 <span style={S.badge(r.importance === "critical"? "#7f1d1d": r.importance === "high"? "#78350f": "#27272a", r.importance === "critical"? "#fca5a5": r.importance === "high"? "#fde68a": "#a1a1aa")}>{r.importance}</span>
 </div>
 </div>
 <div style={{ fontSize: "11px", color: "#a1a1aa"}}>{r.company}</div>
 <div style={{ fontSize: "11px", color: r.pass ? "#86efac": "#fca5a5"}}>{r.statusLabel}</div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 );
}

/* Tab: llms.txt Generator */
function LlmsTxtTab() {
 const [domain, setDomain] = useState("");
 const [storeName, setStoreName] = useState("");
 const [description, setDescription] = useState("");
 const [topPages, setTopPages] = useState("");
 const [result, setResult] = useState(null);
 const [loading, setLoading] = useState(false);
 const [err, setErr] = useState("");

 const run = useCallback(async () => {
 if (!domain) return;
 setLoading(true); setErr(""); setResult(null);
 try {
 const pages = topPages.split("\n").map(p => p.trim()).filter(Boolean);
 const d = await apiFetch(`${API}/generate-llms-txt`, { method: "POST", body: JSON.stringify({ domain, storeName, description, topPages: pages }) });
 if (!d.ok) throw new Error(d.error);
 setResult(d);
 } catch (e) { setErr(e.message); } finally { setLoading(false); }
 }, [domain, storeName, description, topPages]);

 return (
 <div>
 <div style={S.card}>
 <p style={S.sectionTitle}> llms.txt Generator</p>
 <div style={S.infoBox}>Generate a /llms.txt file a machine-readable site summary that helps AI models understand and reference your store's content. Place it at yourstore.com/llms.txt to improve AI citation eligibility.</div>
 <div style={S.row}>
 <div style={S.col}>
 <label style={S.label}>Domain</label>
 <input style={S.input} value={domain} onChange={e => setDomain(e.target.value)} placeholder="yourstore.com"/>
 </div>
 <div style={S.col}>
 <label style={S.label}>Store name</label>
 <input style={S.input} value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="Acme Eco Store"/>
 </div>
 </div>
 <label style={S.label}>Brief description of your store</label>
 <textarea style={{ ...S.textarea, minHeight: "60px"}} value={description} onChange={e => setDescription(e.target.value)} placeholder="We sell eco-friendly yoga equipment including mats, blocks, and straps."/>
 <label style={S.label}>Key pages to include (one per line, optional)</label>
 <textarea style={{ ...S.textarea, minHeight: "60px"}} value={topPages} onChange={e => setTopPages(e.target.value)} placeholder={"/collections/yoga-mats\n/blogs/guides/the-ultimate-guide-to-yoga-mats"} />
 <button style={S.btn()} onClick={run} disabled={loading}>{loading ? "Generating": "Generate llms.txt (1 credit)"}</button>
 </div>
 {err && <div style={S.error}>{err}</div>}
 {result && (
 <div style={S.card}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px"}}>
 <p style={S.sectionTitle}>Generated llms.txt</p>
 <CopyBtn text={result.llmsTxtContent} />
 </div>
 <pre style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: "6px", padding: "14px", fontSize: "11px", color: "#a1a1aa", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word"}}>
 {result.llmsTxtContent}
 </pre>
 <div style={{ ...S.infoBox, marginTop: "12px"}}>
 <strong> How to deploy:</strong> {result.instructions}
 </div>
 <div style={{ fontSize: "11px", color: "#71717a", marginTop: "6px"}}>File size: {result.charCount} characters</div>
 </div>
 )}
 </div>
 );
}

/* Tab: History */
function HistoryTab() {
 const [history, setHistory] = useState([]);
 const [loading, setLoading] = useState(false);

 const load = useCallback(async () => {
 setLoading(true);
 try {
 const d = await apiFetch(`${API}/history`);
 if (d.ok) setHistory(d.citations || []);
 } finally { setLoading(false); }
 }, []);

 React.useEffect(() => { load(); }, [load]);

 return (
 <div>
 <div style={S.card}>
 <p style={S.sectionTitle}> Analysis History</p>
 {loading && <div style={{ color: "#a1a1aa", fontSize: "12px"}}>Loading</div>}
 {history.length === 0 && !loading && <div style={{ color: "#71717a", fontSize: "12px"}}>No analysis history yet.</div>}
 {history.map((h, i) => (
 <div key={i} style={{ borderBottom: "1px solid #27272a", paddingBottom: "10px", marginBottom: "10px"}}>
 <div style={{ display: "flex", justifyContent: "space-between"}}>
 <span style={{ fontSize: "12px", fontWeight: 600, color: "#fafafa"}}>{h.brand}</span>
 <span style={{ fontSize: "11px", color: "#52525b"}}>{new Date(h.ts || h.createdAt).toLocaleDateString()}</span>
 </div>
 <span style={{ fontSize: "11px", color: "#a1a1aa"}}>Avg citation confidence: {h.avgScore}% · {h.citedCount}/{h.total} prompts cited</span>
 </div>
 ))}
 </div>
 </div>
 );
}

/* Main Component */
export default function AIVisibilityTracker() {
 const [tab, setTab] = useState(0);

 const tabComponents = [
 <OverviewTab onNavigate={setTab} />,
 <CitabilityTab />,
 <PromptTestTab />,
 <SoVTab />,
 <SeedingPlanTab />,
 <TermAnalysisTab />,
 <GeoOptimizerTab />,
 <PromptCoverageTab />,
 <AOCheckTab />,
 <CrawlerAuditTab />,
 <LlmsTxtTab />,
 <HistoryTab />,
 ];

 return (
 <div style={S.page}>
 <div style={S.header}>
 <h1 style={S.title}> AI Visibility Tracker</h1>
 <p style={S.subtitle}>Monitor your brand & content citations across ChatGPT, Perplexity, Google AI Overviews, and Gemini. Score citability, map prompt coverage, audit AI crawlers, and generate llms.txt.</p>
 </div>
 <div style={S.tabs}>
 {TABS.map((t, i) => (
 <button key={i} style={S.tab(tab === i)} onClick={() => setTab(i)}>{t}</button>
 ))}
 </div>
 {tabComponents[tab]}
 </div>
 );
}
