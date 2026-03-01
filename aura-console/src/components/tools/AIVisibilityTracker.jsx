import React, { useState, useCallback } from "react";
import { apiFetch } from "../../api";

const API = "/api/ai-visibility-tracker";

const TABS = [
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

 const run = useCallback(async () => {
 if (!url.trim()) return;
 setLoading(true); setErr(""); setResult(null);
 try {
 const d = await apiFetch(`${API}/citability-score`, { method: "POST", body: JSON.stringify({ url }) });
 if (!d.ok) throw new Error(d.error);
 setResult(d);
 } catch (e) { setErr(e.message); } finally { setLoading(false); }
 }, [url]);

 return (
 <div>
 <div style={S.card}>
 <p style={S.sectionTitle}> AI-Citability Score</p>
 <div style={S.infoBox}>Analyzes a page and scores how likely it is to be cited by ChatGPT, Perplexity, and Google AI Overviews based on 16 structural and content signals. Cited pages cover 62% more facts than non-cited ones (Surfer 2026).</div>
 <label style={S.label}>Page URL to analyze</label>
 <input style={S.input} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://yourstore.com/blogs/news/post-title"/>
 <button style={S.btn()} onClick={run} disabled={loading}>{loading ? "Analyzing": "Analyze AI Citability (1 credit)"}</button>
 </div>
 {err && <div style={S.error}>{err}</div>}
 {result && (
 <div style={S.card}>
 <div style={{ ...S.row, alignItems: "center", marginBottom: "16px"}}>
 <ScoreCircle score={result.score} label="Citability"/>
 <div style={{ flex: 1 }}>
 <div style={{ fontSize: "20px", fontWeight: 700, color: result.score >= 70 ? "#22c55e": result.score >= 50 ? "#f59e0b": "#ef4444"}}>
 Grade: {result.grade}
 </div>
 <div style={{ fontSize: "12px", color: "#a1a1aa", marginTop: "4px"}}>
 {result.wordCount} words · {result.h2Count} H2s · {result.h3Count} H3s · {result.externalLinks} external links
 </div>
 <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap"}}>
 <span style={S.badge(result.hasArticleSchema ? "#166534": "#7f1d1d", result.hasArticleSchema ? "#86efac": "#fca5a5")}>
 {result.hasArticleSchema ? "": ""} Article Schema
 </span>
 <span style={S.badge(result.hasFaqSchema ? "#166534": "#27272a", result.hasFaqSchema ? "#86efac": "#a1a1aa")}>
 {result.hasFaqSchema ? "": ""} FAQ Schema
 </span>
 </div>
 </div>
 </div>
 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px"}}>
 <div>
 <p style={{ fontSize: "12px", fontWeight: 600, color: "#22c55e", marginBottom: "8px"}}> Passed ({result.strengths.length})</p>
 {result.strengths.map((s, i) => <div key={i} style={{ fontSize: "11px", color: "#86efac", marginBottom: "4px"}}> {s}</div>)}
 </div>
 <div>
 <p style={{ fontSize: "12px", fontWeight: 600, color: "#ef4444", marginBottom: "8px"}}> Failed ({result.issues.length})</p>
 {result.issues.map((s, i) => <div key={i} style={{ fontSize: "11px", color: "#fca5a5", marginBottom: "4px"}}> {s.signal}</div>)}
 </div>
 </div>
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

 const run = useCallback(async () => {
 if (!brand || !niche) return;
 setLoading(true); setErr(""); setResult(null);
 try {
 const d = await apiFetch(`${API}/seeding-plan`, { method: "POST", body: JSON.stringify({ brand, niche, targetPrompts: targetPrompts.split("\n").map(p => p.trim()).filter(Boolean) }) });
 if (!d.ok) throw new Error(d.error);
 setResult(d);
 } catch (e) { setErr(e.message); } finally { setLoading(false); }
 }, [brand, niche, targetPrompts]);

 return (
 <div>
 <div style={S.card}>
 <p style={S.sectionTitle}> LLM Seeding Plan</p>
 <div style={S.infoBox}>Get a strategic plan for WHERE to post and WHAT to publish to increase your brand's presence in AI model training data. Platforms like Reddit, Quora, and niche forums heavily influence LLM citations.</div>
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
 <label style={S.label}>Target prompts you want to appear in (one per line)</label>
 <textarea style={{ ...S.textarea, minHeight: "60px"}} value={targetPrompts} onChange={e => setTargetPrompts(e.target.value)} placeholder="best yoga mats for hot yoga"/>
 <button style={S.btn()} onClick={run} disabled={loading}>{loading ? "Generating plan": "Generate Seeding Plan (2 credits)"}</button>
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
 {result.platforms && result.platforms.map((p, i) => (
 <div key={i} style={S.card}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px"}}>
 <span style={{ fontSize: "14px", fontWeight: 600, color: "#fafafa"}}>{p.platform}</span>
 <div style={{ display: "flex", gap: "6px"}}>
 <span style={S.badge(p.priority === "high"? "#7f1d1d": p.priority === "medium"? "#78350f": "#1e3a5f", p.priority === "high"? "#fca5a5": p.priority === "medium"? "#fde68a": "#93c5fd")}>{p.priority}</span>
 <span style={S.badge("#27272a", "#a1a1aa")}>{p.contentType}</span>
 </div>
 </div>
 <div style={{ fontSize: "12px", color: "#a1a1aa", marginBottom: "6px"}}>{p.strategy}</div>
 <div style={{ fontSize: "11px", color: "#c4b5fd"}}>Why it matters: {p.whyItMatters}</div>
 <div style={{ fontSize: "11px", color: "#71717a", marginTop: "4px"}}>Time to impact: {p.timeToImpact}</div>
 {p.subreddits && p.subreddits.length > 0 && (
 <div style={{ marginTop: "6px"}}>{p.subreddits.map((s, j) => <span key={j} style={{ ...S.badge("#1e1b4b", "#a5b4fc"), marginRight: "4px"}}>{s}</span>)}</div>
 )}
 </div>
 ))}
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
