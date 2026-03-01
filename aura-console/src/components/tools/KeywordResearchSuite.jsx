import React, { useState, useCallback } from "react";
import { apiFetchJSON } from "../../api";

const API = "/api/keyword-research-suite";

const S = {
 root: {
 background: "#09090b",
 minHeight: "100vh",
 color: "#fafafa",
 fontFamily: "'Inter', sans-serif",
 padding: "32px 24px",
 },
 header: { marginBottom: 32 },
 title: { fontSize: 28, fontWeight: 700, color: "#fafafa", margin: 0 },
 subtitle: { color: "#a1a1aa", marginTop: 6, fontSize: 14 },
 tabs: {
 display: "flex",
 gap: 4,
 marginBottom: 28,
 overflowX: "auto",
 borderBottom: "1px solid #27272a",
 paddingBottom: 0,
 },
 tab: (active) => ({
 padding: "10px 18px",
 background: "none",
 border: "none",
 color: active ? "#4f46e5": "#71717a",
 fontSize: 13,
 fontWeight: active ? 600 : 400,
 cursor: "pointer",
 borderBottom: active ? "2px solid #4f46e5": "2px solid transparent",
 whiteSpace: "nowrap",
 transition: "color 0.15s",
 marginBottom: -1,
 }),
 card: {
 background: "#18181b",
 border: "1px solid #27272a",
 borderRadius: 16,
 padding: 24,
 marginBottom: 20,
 },
 cardTitle: { fontSize: 15, fontWeight: 600, color: "#fafafa", marginBottom: 16, marginTop: 0 },
 inputRow: { display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap"},
 input: {
 flex: 1,
 minWidth: 200,
 background: "#09090b",
 border: "1px solid #3f3f46",
 borderRadius: 8,
 color: "#fafafa",
 fontSize: 14,
 padding: "10px 14px",
 outline: "none",
 },
 btn: {
 background: "#4f46e5",
 color: "#fff",
 border: "none",
 borderRadius: 8,
 padding: "10px 20px",
 fontSize: 14,
 fontWeight: 600,
 cursor: "pointer",
 whiteSpace: "nowrap",
 },
 table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
 th: {
 textAlign: "left",
 color: "#71717a",
 fontWeight: 500,
 padding: "8px 12px",
 borderBottom: "1px solid #27272a",
 whiteSpace: "nowrap",
 },
 td: { padding: "10px 12px", borderBottom: "1px solid #1f1f22", color: "#fafafa", verticalAlign: "middle"},
 badge: (color) => ({
 display: "inline-block",
 padding: "2px 10px",
 borderRadius: 20,
 fontSize: 11,
 fontWeight: 600,
 background: color || "#27272a",
 color: "#fafafa",
 }),
 emptyState: { textAlign: "center", padding: "48px 24px", color: "#52525b", fontSize: 14 },
 loading: { textAlign: "center", padding: "32px 24px", color: "#71717a", fontSize: 14 },
 errorBox: {
 background: "#1c0c0c",
 border: "1px solid #7f1d1d",
 color: "#fca5a5",
 borderRadius: 8,
 padding: "12px 16px",
 fontSize: 13,
 marginBottom: 16,
 },
 metaRow: { display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 16 },
 metaItem: {
 background: "#09090b",
 border: "1px solid #27272a",
 borderRadius: 10,
 padding: "12px 18px",
 flex: "1 1 140px",
 textAlign: "center",
 },
 metaVal: { fontSize: 22, fontWeight: 700, color: "#4f46e5"},
 metaLabel: { fontSize: 11, color: "#71717a", marginTop: 2 },
 section: { marginBottom: 24 },
 sectionTitle: {
 fontSize: 13,
 fontWeight: 600,
 color: "#a1a1aa",
 textTransform: "uppercase",
 letterSpacing: "0.05em",
 marginBottom: 12,
 marginTop: 0,
 },
 chip: {
 display: "inline-block",
 background: "#1f1f28",
 border: "1px solid #3f3f46",
 borderRadius: 6,
 padding: "4px 10px",
 fontSize: 12,
 color: "#a1a1aa",
 margin: "2px 4px 2px 0",
 cursor: "pointer",
 },
 textarea: {
 width: "100%",
 background: "#09090b",
 border: "1px solid #3f3f46",
 borderRadius: 8,
 color: "#fafafa",
 fontSize: 13,
 padding: "10px 14px",
 outline: "none",
 resize: "vertical",
 minHeight: 80,
 boxSizing: "border-box",
 },
 select: {
 background: "#09090b",
 border: "1px solid #3f3f46",
 borderRadius: 8,
 color: "#fafafa",
 fontSize: 14,
 padding: "10px 14px",
 outline: "none",
 },
 intentBadge: (intent) => {
 const map = {
 informational: "#1d4ed8",
 navigational: "#0f766e",
 transactional: "#15803d",
 commercial: "#7c2d12",
 };
 return {
 display: "inline-block",
 padding: "3px 10px",
 borderRadius: 20,
 fontSize: 11,
 fontWeight: 600,
 background: map[intent] || "#27272a",
 color: "#fff",
 };
 },
 diffBadge: (score) => {
 const n = Number(score);
 let bg = "#15803d";
 if (n >= 70) bg = "#7f1d1d";
 else if (n >= 40) bg = "#92400e";
 return { display: "inline-block", padding: "2px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700, background: bg, color: "#fff"};
 },
};

function difLabel(n) {
 if (n >= 70) return "Hard";
 if (n >= 40) return "Medium";
 return "Easy";
}

function volumeFormat(n) {
 if (!n && n !== 0) return "";
 if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
 if (n >= 1000) return (n / 1000).toFixed(1) + "K";
 return String(n);
}

function DiscoveryTab() {
 const [query, setQuery] = useState("");
 const [limit, setLimit] = useState(30);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState(null);
 const [result, setResult] = useState(null);
 const [subTab, setSubTab] = useState("all");
 const [bulkInput, setBulkInput] = useState("");
 const [bulkResult, setBulkResult] = useState(null);
 const [bulkLoading, setBulkLoading] = useState(false);

 async function discover() {
 if (!query.trim()) return;
 setLoading(true); setError(null); setResult(null);
 try {
 const res = await apiFetchJSON(`${API}/discovery/discover`, {
 method: "POST",
 body: JSON.stringify({ seedKeyword: query.trim(), keywords: [query.trim()], maxResults: limit }),
 });
 if (!res.ok) throw new Error(res.error || "Discovery failed");
 setResult(res);
 } catch (e) { setError(e.message); }
 finally { setLoading(false); }
 }

 async function bulkAnalyze() {
 const kws = bulkInput.split(/[\n,]+/).map((k) => k.trim()).filter(Boolean);
 if (!kws.length) return;
 setBulkLoading(true); setBulkResult(null);
 try {
 const res = await apiFetchJSON(`${API}/discovery/bulk-analyze`, {
 method: "POST",
 body: JSON.stringify({ keywords: kws, includeVolume: true, includeDifficulty: true, includeTrends: true }),
 });
 if (!res.ok) throw new Error(res.error || "Bulk analysis failed");
 setBulkResult(res);
 } catch (e) { setError(e.message); }
 finally { setBulkLoading(false); }
 }

 const allKws = result ? [...(result.keywords || []), ...(result.mainKeywords || [])] : [];
 const filtered = subTab === "all"? allKws
 : subTab === "related"? (result?.relatedKeywords || allKws.filter((k) => k.type === "related"))
 : subTab === "questions"? (result?.questionKeywords || allKws.filter((k) => k.type === "question"|| /^(how|what|why|when|where|who|does|is|can|should)/i.test(k.keyword || k.term || "")))
 : subTab === "longtail"? (result?.longTailKeywords || allKws.filter((k) => k.type === "longTail"|| (k.keyword || k.term || "").split("").length >= 4))
 : allKws;

 return (
 <div>
 <div style={S.card}>
 <p style={S.cardTitle}>Keyword Discovery</p>
 <div style={S.inputRow}>
 <input style={S.input} placeholder="Enter seed keyword (e.g. running shoes)"value={query}
 onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter"&& discover()} />
 <select style={S.select} value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
 <option value={20}>20 results</option><option value={50}>50 results</option><option value={100}>100 results</option>
 </select>
 <button style={S.btn} onClick={discover} disabled={loading}>{loading ? "Discovering": "Discover"}</button>
 </div>
 {error && <div style={S.errorBox}>{error}</div>}
 {result && (
 <>
 <div style={S.metaRow}>
 <div style={S.metaItem}><div style={S.metaVal}>{result.totalKeywords || allKws.length}</div><div style={S.metaLabel}>Keywords Found</div></div>
 {result.metadata?.country && <div style={S.metaItem}><div style={S.metaVal}>{result.metadata.country}</div><div style={S.metaLabel}>Market</div></div>}
 </div>
 <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
 {["all", "related", "questions", "longtail"].map((t) => (
 <button key={t} style={S.tab(subTab === t)} onClick={() => setSubTab(t)}>
 {t.charAt(0).toUpperCase() + t.slice(1)}
 </button>
 ))}
 </div>
 {filtered.length === 0 ? <div style={S.emptyState}>No keywords in this category</div> : (
 <div style={{ overflowX: "auto"}}>
 <table style={S.table}>
 <thead><tr><th style={S.th}>Keyword</th><th style={S.th}>Vol</th><th style={S.th}>Difficulty</th><th style={S.th}>CPC</th><th style={S.th}>Trend</th></tr></thead>
 <tbody>
 {filtered.slice(0, 100).map((kw, i) => {
 const term = kw.keyword || kw.term || kw.text || "";
 const vol = kw.searchVolume ?? kw.volume ?? null;
 const diff = kw.difficulty ?? kw.keywordDifficulty ?? null;
 const cpc = kw.cpc ?? kw.costPerClick ?? null;
 const trend = kw.trend ?? kw.trendDirection ?? null;
 return (
 <tr key={i}>
 <td style={S.td}>{term}</td>
 <td style={S.td}>{volumeFormat(vol)}</td>
 <td style={S.td}>{diff != null ? <span style={S.diffBadge(diff)}>{diff} {difLabel(diff)}</span> : ""}</td>
 <td style={S.td}>{cpc != null ? `$${Number(cpc).toFixed(2)}` : ""}</td>
 <td style={S.td}>{trend ? <span style={S.badge(trend === "growing"? "#15803d": trend === "declining"? "#7f1d1d": "#3f3f46")}>{trend}</span> : ""}</td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}
 </>
 )}
 {!result && !loading && <div style={S.emptyState}>Enter a seed keyword to discover related keywords</div>}
 {loading && <div style={S.loading}>Discovering keywords</div>}
 </div>
 <div style={S.card}>
 <p style={S.cardTitle}>Bulk Keyword Analysis</p>
 <textarea style={S.textarea} placeholder={"Paste keywords, one per line or comma-separated:\nrunning shoes\nbest running shoes 2024"}
 value={bulkInput} onChange={(e) => setBulkInput(e.target.value)} />
 <div style={{ ...S.inputRow, marginTop: 10, marginBottom: 0 }}>
 <button style={S.btn} onClick={bulkAnalyze} disabled={bulkLoading}>{bulkLoading ? "Analysing": "Analyse Keywords"}</button>
 </div>
 {bulkResult && (
 <div style={{ marginTop: 16, overflowX: "auto"}}>
 <table style={S.table}>
 <thead><tr><th style={S.th}>Keyword</th><th style={S.th}>Vol</th><th style={S.th}>Difficulty</th><th style={S.th}>CPC</th><th style={S.th}>Intent</th></tr></thead>
 <tbody>
 {(bulkResult.results || bulkResult.keywords || []).map((kw, i) => (
 <tr key={i}>
 <td style={S.td}>{kw.keyword || kw.term || ""}</td>
 <td style={S.td}>{volumeFormat(kw.searchVolume ?? kw.volume)}</td>
 <td style={S.td}>{kw.difficulty != null ? <span style={S.diffBadge(kw.difficulty)}>{kw.difficulty}</span> : ""}</td>
 <td style={S.td}>{kw.cpc != null ? `$${Number(kw.cpc).toFixed(2)}` : ""}</td>
 <td style={S.td}>{kw.intent ? <span style={S.intentBadge(kw.intent)}>{kw.intent}</span> : ""}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 {bulkLoading && <div style={S.loading}>Analysing keywords</div>}
 </div>
 </div>
 );
}

function SERPTab() {
 const [keyword, setKeyword] = useState("");
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState(null);
 const [result, setResult] = useState(null);

 async function analyze() {
 if (!keyword.trim()) return;
 setLoading(true); setError(null); setResult(null);
 try {
 const res = await apiFetchJSON(`${API}/serp/analyze`, { method: "POST", body: JSON.stringify({ keyword: keyword.trim() }) });
 if (!res.ok) throw new Error(res.error || "SERP analysis failed");
 setResult(res);
 } catch (e) { setError(e.message); }
 finally { setLoading(false); }
 }

 const topResults = result?.serpResults || result?.organicResults || result?.results || [];
 const features = result?.serpFeatures || result?.features || [];
 const paaQuestions = result?.paaQuestions || result?.peopleAlsoAsk || [];

 return (
 <div>
 <div style={S.card}>
 <p style={S.cardTitle}>SERP Analysis</p>
 <div style={S.inputRow}>
 <input style={S.input} placeholder="Enter keyword to analyse SERP"value={keyword}
 onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === "Enter"&& analyze()} />
 <button style={S.btn} onClick={analyze} disabled={loading}>{loading ? "Analysing": "Analyse SERP"}</button>
 </div>
 {error && <div style={S.errorBox}>{error}</div>}
 {loading && <div style={S.loading}>Analysing SERP</div>}
 {result && (
 <>
 <div style={S.metaRow}>
 {result.searchVolume != null && <div style={S.metaItem}><div style={S.metaVal}>{volumeFormat(result.searchVolume)}</div><div style={S.metaLabel}>Monthly Searches</div></div>}
 {result.difficulty != null && <div style={S.metaItem}><div style={{ ...S.metaVal, color: result.difficulty >= 70 ? "#ef4444": result.difficulty >= 40 ? "#f59e0b": "#22c55e"}}>{result.difficulty}</div><div style={S.metaLabel}>Keyword Difficulty</div></div>}
 {result.cpc != null && <div style={S.metaItem}><div style={S.metaVal}>${Number(result.cpc).toFixed(2)}</div><div style={S.metaLabel}>CPC</div></div>}
 </div>
 {features.length > 0 && (
 <div style={S.section}>
 <p style={S.sectionTitle}>SERP Features</p>
 <div>{features.map((f, i) => <span key={i} style={{ ...S.chip, borderColor: "#4f46e5", color: "#818cf8"}}>{f.type || f.feature || f}</span>)}</div>
 </div>
 )}
 {paaQuestions.length > 0 && (
 <div style={S.section}>
 <p style={S.sectionTitle}>People Also Ask</p>
 <div>{paaQuestions.map((q, i) => (
 <div key={i} style={{ padding: "8px 12px", background: "#09090b", borderRadius: 8, marginBottom: 6, fontSize: 13, color: "#d4d4d8", border: "1px solid #27272a"}}>
 {q.question || q}
 </div>
 ))}</div>
 </div>
 )}
 {topResults.length > 0 && (
 <div style={S.section}>
 <p style={S.sectionTitle}>Top Organic Results</p>
 <div style={{ overflowX: "auto"}}>
 <table style={S.table}>
 <thead><tr><th style={S.th}>#</th><th style={S.th}>Title / URL</th><th style={S.th}>DA</th><th style={S.th}>Type</th></tr></thead>
 <tbody>
 {topResults.slice(0, 10).map((r, i) => (
 <tr key={i}>
 <td style={{ ...S.td, color: "#71717a", fontWeight: 700 }}>{r.position ?? i + 1}</td>
 <td style={S.td}><div style={{ fontWeight: 500 }}>{r.title || r.url}</div>{r.url && r.title && <div style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>{r.url}</div>}</td>
 <td style={S.td}>{r.domainAuthority ?? r.da ?? ""}</td>
 <td style={S.td}>{r.contentType ? <span style={S.badge()}>{r.contentType}</span> : ""}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </>
 )}
 {!result && !loading && <div style={S.emptyState}>Enter a keyword to analyse the search engine results page</div>}
 </div>
 </div>
 );
}

function CompetitorsTab() {
 const [domain, setDomain] = useState("");
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState(null);
 const [result, setResult] = useState(null);

 async function analyze() {
 if (!domain.trim()) return;
 setLoading(true); setError(null); setResult(null);
 try {
 const res = await apiFetchJSON(`${API}/competitor/analyze`, { method: "POST", body: JSON.stringify({ domain: domain.trim() }) });
 if (!res.ok) throw new Error(res.error || "Competitor analysis failed");
 setResult(res);
 } catch (e) { setError(e.message); }
 finally { setLoading(false); }
 }

 const kws = result?.keywords || result?.topKeywords || [];
 const competitors = result?.competitors || result?.topCompetitors || [];

 return (
 <div>
 <div style={S.card}>
 <p style={S.cardTitle}>Competitor Research</p>
 <div style={S.inputRow}>
 <input style={S.input} placeholder="Enter competitor domain (e.g. example.com)"value={domain}
 onChange={(e) => setDomain(e.target.value)} onKeyDown={(e) => e.key === "Enter"&& analyze()} />
 <button style={S.btn} onClick={analyze} disabled={loading}>{loading ? "Analysing": "Analyse Competitor"}</button>
 </div>
 {error && <div style={S.errorBox}>{error}</div>}
 {loading && <div style={S.loading}>Analysing competitor</div>}
 {result && (
 <>
 <div style={S.metaRow}>
 {result.domainAuthority != null && <div style={S.metaItem}><div style={S.metaVal}>{result.domainAuthority}</div><div style={S.metaLabel}>Domain Authority</div></div>}
 {result.organicTraffic != null && <div style={S.metaItem}><div style={S.metaVal}>{volumeFormat(result.organicTraffic)}</div><div style={S.metaLabel}>Organic Traffic</div></div>}
 {result.rankingKeywords != null && <div style={S.metaItem}><div style={S.metaVal}>{volumeFormat(result.rankingKeywords)}</div><div style={S.metaLabel}>Ranking Keywords</div></div>}
 </div>
 {kws.length > 0 && (
 <div style={S.section}>
 <p style={S.sectionTitle}>Top Ranking Keywords</p>
 <div style={{ overflowX: "auto"}}>
 <table style={S.table}>
 <thead><tr><th style={S.th}>Keyword</th><th style={S.th}>Position</th><th style={S.th}>Volume</th><th style={S.th}>Traffic</th></tr></thead>
 <tbody>
 {kws.slice(0, 50).map((kw, i) => (
 <tr key={i}>
 <td style={S.td}>{kw.keyword || kw.term || ""}</td>
 <td style={S.td}>{kw.position ?? kw.rank ?? ""}</td>
 <td style={S.td}>{volumeFormat(kw.searchVolume ?? kw.volume)}</td>
 <td style={S.td}>{volumeFormat(kw.traffic ?? kw.estimatedTraffic)}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}
 {competitors.length > 0 && (
 <div style={S.section}>
 <p style={S.sectionTitle}>Related Competitors</p>
 <div style={{ overflowX: "auto"}}>
 <table style={S.table}>
 <thead><tr><th style={S.th}>Domain</th><th style={S.th}>Common Keywords</th><th style={S.th}>DA</th></tr></thead>
 <tbody>
 {competitors.map((c, i) => (
 <tr key={i}>
 <td style={S.td}>{c.domain || c.competitor || ""}</td>
 <td style={S.td}>{c.commonKeywords ?? c.sharedKeywords ?? ""}</td>
 <td style={S.td}>{c.domainAuthority ?? c.da ?? ""}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </>
 )}
 {!result && !loading && <div style={S.emptyState}>Enter a competitor domain to see their top keywords</div>}
 </div>
 </div>
 );
}

function IntentTab() {
 const [keyword, setKeyword] = useState("");
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState(null);
 const [result, setResult] = useState(null);
 const [batch, setBatch] = useState("");
 const [batchResults, setBatchResults] = useState([]);
 const [batchLoading, setBatchLoading] = useState(false);

 async function classify() {
 if (!keyword.trim()) return;
 setLoading(true); setError(null); setResult(null);
 try {
 const res = await apiFetchJSON(`${API}/intent/classify`, { method: "POST", body: JSON.stringify({ keyword: keyword.trim() }) });
 if (!res.ok) throw new Error(res.error || "Classification failed");
 setResult(res);
 } catch (e) { setError(e.message); }
 finally { setLoading(false); }
 }

 async function batchClassify() {
 const kws = batch.split(/[\n,]+/).map((k) => k.trim()).filter(Boolean);
 if (!kws.length) return;
 setBatchLoading(true); setBatchResults([]);
 const results = [];
 for (const kw of kws.slice(0, 20)) {
 try {
 const res = await apiFetchJSON(`${API}/intent/classify`, { method: "POST", body: JSON.stringify({ keyword: kw }) });
 results.push({ keyword: kw, ...(res.ok ? res : { intent: "unknown"}) });
 } catch { results.push({ keyword: kw, intent: "unknown"}); }
 }
 setBatchResults(results);
 setBatchLoading(false);
 }

 return (
 <div>
 <div style={S.card}>
 <p style={S.cardTitle}>Search Intent Classification</p>
 <div style={S.inputRow}>
 <input style={S.input} placeholder="Enter keyword to classify"value={keyword}
 onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === "Enter"&& classify()} />
 <button style={S.btn} onClick={classify} disabled={loading}>{loading ? "Classifying": "Classify"}</button>
 </div>
 {error && <div style={S.errorBox}>{error}</div>}
 {loading && <div style={S.loading}>Classifying intent</div>}
 {result && (
 <div style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 12, padding: 20 }}>
 <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap"}}>
 <div>
 <div style={{ fontSize: 13, color: "#71717a", marginBottom: 4 }}>Keyword</div>
 <div style={{ fontSize: 18, fontWeight: 700 }}>{result.keyword || keyword}</div>
 </div>
 <div style={{ marginLeft: "auto"}}>
 <span style={S.intentBadge(result.intent || result.primaryIntent)}>
 {(result.intent || result.primaryIntent || "unknown").toUpperCase()}
 </span>
 </div>
 </div>
 {result.confidence != null && (
 <div style={{ marginTop: 12 }}>
 <div style={{ fontSize: 12, color: "#71717a", marginBottom: 4 }}>Confidence</div>
 <div style={{ background: "#18181b", borderRadius: 6, height: 6, overflow: "hidden"}}>
 <div style={{ height: "100%", background: "#4f46e5", width: `${Math.round(result.confidence * 100)}%`, transition: "width 0.4s"}} />
 </div>
 <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 4 }}>{Math.round(result.confidence * 100)}%</div>
 </div>
 )}
 {result.signals?.length > 0 && (
 <div style={{ marginTop: 12 }}>
 <div style={{ fontSize: 12, color: "#71717a", marginBottom: 6 }}>Signals</div>
 <div>{result.signals.map((s, i) => <span key={i} style={S.chip}>{s}</span>)}</div>
 </div>
 )}
 {result.contentRecommendations?.length > 0 && (
 <div style={{ marginTop: 12 }}>
 <div style={{ fontSize: 12, color: "#71717a", marginBottom: 6 }}>Recommended Content Types</div>
 <div>{result.contentRecommendations.map((r, i) => <span key={i} style={{ ...S.chip, borderColor: "#4f46e5", color: "#818cf8"}}>{r}</span>)}</div>
 </div>
 )}
 </div>
 )}
 {!result && !loading && <div style={S.emptyState}>Classify the search intent behind any keyword</div>}
 </div>
 <div style={S.card}>
 <p style={S.cardTitle}>Batch Intent Classification</p>
 <div style={{ fontSize: 12, color: "#71717a", marginBottom: 8 }}>Up to 20 keywords at once</div>
 <textarea style={S.textarea} placeholder={"One keyword per line:\nbuy running shoes\nhow to tie shoes\nnike running shoes"}
 value={batch} onChange={(e) => setBatch(e.target.value)} />
 <div style={{ ...S.inputRow, marginTop: 10, marginBottom: 0 }}>
 <button style={S.btn} onClick={batchClassify} disabled={batchLoading}>{batchLoading ? "Classifying": "Classify All"}</button>
 </div>
 {batchResults.length > 0 && (
 <div style={{ marginTop: 16, overflowX: "auto"}}>
 <table style={S.table}>
 <thead><tr><th style={S.th}>Keyword</th><th style={S.th}>Intent</th><th style={S.th}>Confidence</th></tr></thead>
 <tbody>
 {batchResults.map((r, i) => (
 <tr key={i}>
 <td style={S.td}>{r.keyword}</td>
 <td style={S.td}><span style={S.intentBadge(r.intent || r.primaryIntent)}>{(r.intent || r.primaryIntent || "unknown").toUpperCase()}</span></td>
 <td style={S.td}>{r.confidence != null ? `${Math.round(r.confidence * 100)}%` : ""}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 {batchLoading && <div style={S.loading}>Classifying</div>}
 </div>
 </div>
 );
}

function ClustersTab() {
 const [input, setInput] = useState("");
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState(null);
 const [result, setResult] = useState(null);
 const [expanded, setExpanded] = useState(null);

 async function cluster() {
 const kws = input.split(/[\n,]+/).map((k) => k.trim()).filter(Boolean);
 if (kws.length < 2) return;
 setLoading(true); setError(null); setResult(null);
 try {
 const res = await apiFetchJSON(`${API}/clustering/cluster`, { method: "POST", body: JSON.stringify({ keywords: kws }) });
 if (!res.ok) throw new Error(res.error || "Clustering failed");
 setResult(res);
 } catch (e) { setError(e.message); }
 finally { setLoading(false); }
 }

 const clusters = result?.clusters || [];

 return (
 <div>
 <div style={S.card}>
 <p style={S.cardTitle}>Keyword Clustering</p>
 <div style={{ fontSize: 12, color: "#71717a", marginBottom: 8 }}>Group related keywords into topical clusters</div>
 <textarea style={{ ...S.textarea, minHeight: 120 }}
 placeholder={"Paste keywords to cluster, one per line:\nrunning shoes\nbest running shoes\nrunning shoes for women\nmarathon shoes"}
 value={input} onChange={(e) => setInput(e.target.value)} />
 <div style={{ ...S.inputRow, marginTop: 10, marginBottom: 0 }}>
 <button style={S.btn} onClick={cluster} disabled={loading}>{loading ? "Clustering": "Cluster Keywords"}</button>
 </div>
 {error && <div style={{ ...S.errorBox, marginTop: 12 }}>{error}</div>}
 {loading && <div style={S.loading}>Clustering keywords</div>}
 {clusters.length > 0 && (
 <div style={{ marginTop: 20 }}>
 <div style={S.metaRow}>
 <div style={S.metaItem}><div style={S.metaVal}>{clusters.length}</div><div style={S.metaLabel}>Clusters</div></div>
 <div style={S.metaItem}><div style={S.metaVal}>{clusters.reduce((s, c) => s + (c.keywords || []).length, 0)}</div><div style={S.metaLabel}>Keywords</div></div>
 </div>
 {clusters.map((c, i) => (
 <div key={i} style={{ ...S.card, marginBottom: 12, cursor: "pointer"}} onClick={() => setExpanded(expanded === i ? null : i)}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center"}}>
 <div>
 <span style={{ fontWeight: 600, fontSize: 14 }}>{c.name || c.topic || c.label || `Cluster ${i + 1}`}</span>
 <span style={{ marginLeft: 10, fontSize: 12, color: "#71717a"}}>{(c.keywords || []).length} keywords</span>
 </div>
 <span style={{ color: "#4f46e5", fontSize: 18 }}>{expanded === i ? "": ""}</span>
 </div>
 {expanded === i && (
 <div style={{ marginTop: 12 }}>
 {(c.keywords || []).map((kw, j) => <span key={j} style={S.chip}>{typeof kw === "string"? kw : kw.keyword || kw.term || ""}</span>)}
 </div>
 )}
 </div>
 ))}
 </div>
 )}
 {!result && !loading && <div style={S.emptyState}>Paste at least 2 keywords to start clustering</div>}
 </div>
 </div>
 );
}

function OpportunitiesTab() {
 const [keyword, setKeyword] = useState("");
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState(null);
 const [result, setResult] = useState(null);
 const [batch, setBatch] = useState("");
 const [batchResults, setBatchResults] = useState([]);
 const [batchLoading, setBatchLoading] = useState(false);

 async function score() {
 if (!keyword.trim()) return;
 setLoading(true); setError(null); setResult(null);
 try {
 const res = await apiFetchJSON(`${API}/opportunity/score`, { method: "POST", body: JSON.stringify({ keyword: keyword.trim() }) });
 if (!res.ok) throw new Error(res.error || "Scoring failed");
 setResult(res);
 } catch (e) { setError(e.message); }
 finally { setLoading(false); }
 }

 async function batchScore() {
 const kws = batch.split(/[\n,]+/).map((k) => k.trim()).filter(Boolean);
 if (!kws.length) return;
 setBatchLoading(true); setBatchResults([]);
 const results = [];
 for (const kw of kws.slice(0, 20)) {
 try {
 const res = await apiFetchJSON(`${API}/opportunity/score`, { method: "POST", body: JSON.stringify({ keyword: kw }) });
 results.push({ keyword: kw, ...(res.ok ? res : {}) });
 } catch { results.push({ keyword: kw }); }
 }
 setBatchResults(results.sort((a, b) => (b.opportunityScore ?? 0) - (a.opportunityScore ?? 0)));
 setBatchLoading(false);
 }

 function scoreColor(n) {
 if (n >= 70) return "#22c55e";
 if (n >= 40) return "#f59e0b";
 return "#ef4444";
 }

 return (
 <div>
 <div style={S.card}>
 <p style={S.cardTitle}>Keyword Opportunity Scoring</p>
 <div style={S.inputRow}>
 <input style={S.input} placeholder="Enter keyword to score"value={keyword}
 onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === "Enter"&& score()} />
 <button style={S.btn} onClick={score} disabled={loading}>{loading ? "Scoring": "Score Opportunity"}</button>
 </div>
 {error && <div style={S.errorBox}>{error}</div>}
 {loading && <div style={S.loading}>Scoring opportunity</div>}
 {result && (
 <div style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 12, padding: 20 }}>
 <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", marginBottom: 16 }}>
 <div>
 <div style={{ fontSize: 13, color: "#71717a"}}>Keyword</div>
 <div style={{ fontSize: 18, fontWeight: 700 }}>{result.keyword || keyword}</div>
 </div>
 {result.opportunityScore != null && (
 <div style={{ textAlign: "center", marginLeft: "auto"}}>
 <div style={{ fontSize: 36, fontWeight: 800, color: scoreColor(result.opportunityScore) }}>{result.opportunityScore}</div>
 <div style={{ fontSize: 12, color: "#71717a"}}>Opportunity Score</div>
 </div>
 )}
 </div>
 <div style={S.metaRow}>
 {result.searchVolume != null && <div style={S.metaItem}><div style={S.metaVal}>{volumeFormat(result.searchVolume)}</div><div style={S.metaLabel}>Volume</div></div>}
 {result.difficulty != null && <div style={S.metaItem}><div style={S.metaVal}>{result.difficulty}</div><div style={S.metaLabel}>Difficulty</div></div>}
 {result.cpc != null && <div style={S.metaItem}><div style={S.metaVal}>${Number(result.cpc).toFixed(2)}</div><div style={S.metaLabel}>CPC</div></div>}
 </div>
 {result.recommendation && (
 <div style={{ background: "#1a1a2e", border: "1px solid #4f46e5", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#c7d2fe"}}>
 {result.recommendation}
 </div>
 )}
 </div>
 )}
 {!result && !loading && <div style={S.emptyState}>Score the opportunity level of any keyword</div>}
 </div>
 <div style={S.card}>
 <p style={S.cardTitle}>Batch Opportunity Scoring</p>
 <textarea style={S.textarea} placeholder={"One keyword per line (up to 20):\nrunning shoes\nbest marathon shoes"}
 value={batch} onChange={(e) => setBatch(e.target.value)} />
 <div style={{ ...S.inputRow, marginTop: 10, marginBottom: 0 }}>
 <button style={S.btn} onClick={batchScore} disabled={batchLoading}>{batchLoading ? "Scoring": "Score All"}</button>
 </div>
 {batchResults.length > 0 && (
 <div style={{ marginTop: 16, overflowX: "auto"}}>
 <table style={S.table}>
 <thead><tr><th style={S.th}>Keyword</th><th style={S.th}>Score</th><th style={S.th}>Volume</th><th style={S.th}>Difficulty</th><th style={S.th}>CPC</th></tr></thead>
 <tbody>
 {batchResults.map((r, i) => (
 <tr key={i}>
 <td style={S.td}>{r.keyword}</td>
 <td style={S.td}>{r.opportunityScore != null ? <span style={{ fontWeight: 700, color: scoreColor(r.opportunityScore) }}>{r.opportunityScore}</span> : ""}</td>
 <td style={S.td}>{volumeFormat(r.searchVolume ?? r.volume)}</td>
 <td style={S.td}>{r.difficulty != null ? <span style={S.diffBadge(r.difficulty)}>{r.difficulty}</span> : ""}</td>
 <td style={S.td}>{r.cpc != null ? `$${Number(r.cpc).toFixed(2)}` : ""}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 {batchLoading && <div style={S.loading}>Scoring</div>}
 </div>
 </div>
 );
}

function RankTrackingTab() {
 const [keyword, setKeyword] = useState("");
 const [trackDomain, setTrackDomain] = useState("");
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState(null);
 const [result, setResult] = useState(null);
 const [history, setHistory] = useState([]);

 async function track() {
 if (!keyword.trim()) return;
 setLoading(true); setError(null); setResult(null);
 try {
 const res = await apiFetchJSON(`${API}/rank/track`, {
 method: "POST",
 body: JSON.stringify({ keyword: keyword.trim(), domain: trackDomain.trim() || undefined }),
 });
 if (!res.ok) throw new Error(res.error || "Rank tracking failed");
 setResult(res);
 setHistory((prev) => [{ keyword: keyword.trim(), ...res, ts: new Date().toLocaleTimeString() }, ...prev.slice(0, 19)]);
 } catch (e) { setError(e.message); }
 finally { setLoading(false); }
 }

 const rankHistory = result?.rankHistory || result?.positionHistory || [];

 return (
 <div>
 <div style={S.card}>
 <p style={S.cardTitle}>Rank Tracking</p>
 <div style={S.inputRow}>
 <input style={S.input} placeholder="Keyword to track"value={keyword} onChange={(e) => setKeyword(e.target.value)} />
 <input style={{ ...S.input, flex: "0 1 220px"}} placeholder="Your domain (optional)"value={trackDomain} onChange={(e) => setTrackDomain(e.target.value)} onKeyDown={(e) => e.key === "Enter"&& track()} />
 <button style={S.btn} onClick={track} disabled={loading}>{loading ? "Tracking": "Track Rank"}</button>
 </div>
 {error && <div style={S.errorBox}>{error}</div>}
 {loading && <div style={S.loading}>Checking rankings</div>}
 {result && (
 <>
 <div style={S.metaRow}>
 {result.currentPosition != null && <div style={S.metaItem}><div style={{ ...S.metaVal, color: result.currentPosition <= 3 ? "#22c55e": result.currentPosition <= 10 ? "#f59e0b": "#ef4444"}}>#{result.currentPosition}</div><div style={S.metaLabel}>Current Position</div></div>}
 {result.previousPosition != null && <div style={S.metaItem}><div style={S.metaVal}>#{result.previousPosition}</div><div style={S.metaLabel}>Previous Position</div></div>}
 {result.change != null && <div style={S.metaItem}><div style={{ ...S.metaVal, color: result.change > 0 ? "#22c55e": result.change < 0 ? "#ef4444": "#71717a"}}>{result.change > 0 ? `+${result.change}` : result.change}</div><div style={S.metaLabel}>Change</div></div>}
 </div>
 {rankHistory.length > 0 && (
 <div style={S.section}>
 <p style={S.sectionTitle}>Position History</p>
 <div style={{ overflowX: "auto"}}>
 <table style={S.table}>
 <thead><tr><th style={S.th}>Date</th><th style={S.th}>Position</th><th style={S.th}>Change</th></tr></thead>
 <tbody>
 {rankHistory.slice(0, 30).map((h, i) => (
 <tr key={i}>
 <td style={S.td}>{h.date || h.timestamp || ""}</td>
 <td style={S.td}>#{h.position ?? h.rank ?? ""}</td>
 <td style={{ ...S.td, color: (h.change ?? 0) > 0 ? "#22c55e": (h.change ?? 0) < 0 ? "#ef4444": "#71717a"}}>{h.change != null ? (h.change > 0 ? `+${h.change}` : h.change) : ""}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </>
 )}
 {!result && !loading && <div style={S.emptyState}>Track keyword positions in search results</div>}
 </div>
 {history.length > 0 && (
 <div style={S.card}>
 <p style={S.cardTitle}>Recent Tracks</p>
 <div style={{ overflowX: "auto"}}>
 <table style={S.table}>
 <thead><tr><th style={S.th}>Keyword</th><th style={S.th}>Position</th><th style={S.th}>Time</th></tr></thead>
 <tbody>
 {history.map((h, i) => (
 <tr key={i}>
 <td style={S.td}>{h.keyword}</td>
 <td style={S.td}>{h.currentPosition != null ? `#${h.currentPosition}` : ""}</td>
 <td style={{ ...S.td, color: "#71717a"}}>{h.ts}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </div>
 );
}

function ContentGapsTab() {
 const [domain, setDomain] = useState("");
 const [competitors, setCompetitors] = useState("");
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState(null);
 const [result, setResult] = useState(null);

 async function analyze() {
 if (!domain.trim()) return;
 const competitorList = competitors.split(/[\n,]+/).map((c) => c.trim()).filter(Boolean);
 setLoading(true); setError(null); setResult(null);
 try {
 const res = await apiFetchJSON(`${API}/content-gap/analyze`, {
 method: "POST",
 body: JSON.stringify({ domain: domain.trim(), competitors: competitorList }),
 });
 if (!res.ok) throw new Error(res.error || "Content gap analysis failed");
 setResult(res);
 } catch (e) { setError(e.message); }
 finally { setLoading(false); }
 }

 const gaps = result?.gaps || result?.contentGaps || result?.missingKeywords || [];
 const opportunities = result?.opportunities || result?.topOpportunities || [];

 return (
 <div>
 <div style={S.card}>
 <p style={S.cardTitle}>Content Gap Analysis</p>
 <div style={S.inputRow}>
 <input style={S.input} placeholder="Your domain (e.g. yourstore.com)"value={domain} onChange={(e) => setDomain(e.target.value)} />
 </div>
 <div style={{ marginBottom: 16 }}>
 <div style={{ fontSize: 12, color: "#71717a", marginBottom: 6 }}>Competitor domains (comma-separated or one per line)</div>
 <textarea style={{ ...S.textarea, minHeight: 60 }} placeholder={"competitor1.com, competitor2.com"}
 value={competitors} onChange={(e) => setCompetitors(e.target.value)} />
 </div>
 <button style={S.btn} onClick={analyze} disabled={loading}>{loading ? "Analysing": "Find Content Gaps"}</button>
 {error && <div style={{ ...S.errorBox, marginTop: 12 }}>{error}</div>}
 {loading && <div style={S.loading}>Analysing content gaps</div>}
 {result && (
 <>
 <div style={{ ...S.metaRow, marginTop: 16 }}>
 {result.totalGaps != null && <div style={S.metaItem}><div style={S.metaVal}>{result.totalGaps}</div><div style={S.metaLabel}>Total Gaps</div></div>}
 {result.highPriorityGaps != null && <div style={S.metaItem}><div style={{ ...S.metaVal, color: "#f59e0b"}}>{result.highPriorityGaps}</div><div style={S.metaLabel}>High Priority</div></div>}
 {result.totalOpportunityVolume != null && <div style={S.metaItem}><div style={S.metaVal}>{volumeFormat(result.totalOpportunityVolume)}</div><div style={S.metaLabel}>Opportunity Volume</div></div>}
 </div>
 {opportunities.length > 0 && (
 <div style={S.section}>
 <p style={S.sectionTitle}>Top Opportunities</p>
 <div style={{ overflowX: "auto"}}>
 <table style={S.table}>
 <thead><tr><th style={S.th}>Keyword</th><th style={S.th}>Volume</th><th style={S.th}>Difficulty</th><th style={S.th}>Priority</th><th style={S.th}>Competitors Ranking</th></tr></thead>
 <tbody>
 {opportunities.slice(0, 30).map((op, i) => (
 <tr key={i}>
 <td style={S.td}>{op.keyword || op.term || ""}</td>
 <td style={S.td}>{volumeFormat(op.searchVolume ?? op.volume)}</td>
 <td style={S.td}>{op.difficulty != null ? <span style={S.diffBadge(op.difficulty)}>{op.difficulty}</span> : ""}</td>
 <td style={S.td}><span style={S.badge(op.priority === "high"? "#92400e": op.priority === "medium"? "#1e3a5f": "#1a1a2e")}>{op.priority || ""}</span></td>
 <td style={S.td}>{op.competitorsRanking ?? op.competitorCount ?? ""}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}
 {gaps.length > 0 && opportunities.length === 0 && (
 <div style={S.section}>
 <p style={S.sectionTitle}>Content Gaps</p>
 <div style={{ overflowX: "auto"}}>
 <table style={S.table}>
 <thead><tr><th style={S.th}>Keyword</th><th style={S.th}>Volume</th><th style={S.th}>Difficulty</th><th style={S.th}>Gap Type</th></tr></thead>
 <tbody>
 {gaps.slice(0, 50).map((g, i) => (
 <tr key={i}>
 <td style={S.td}>{g.keyword || g.term || (typeof g === "string"? g : "")}</td>
 <td style={S.td}>{volumeFormat(g.searchVolume ?? g.volume)}</td>
 <td style={S.td}>{g.difficulty != null ? <span style={S.diffBadge(g.difficulty)}>{g.difficulty}</span> : ""}</td>
 <td style={S.td}>{g.gapType ? <span style={S.badge()}>{g.gapType}</span> : ""}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </>
 )}
 {!result && !loading && <div style={S.emptyState}>Discover keywords your competitors rank for but you don&apos;t</div>}
 </div>
 </div>
 );
}

const TABS = [
 { id: "discovery", label: "Discovery"},
 { id: "serp", label: "SERP Analysis"},
 { id: "competitors", label: "Competitors"},
 { id: "intent", label: "Search Intent"},
 { id: "clusters", label: "Clusters"},
 { id: "opportunities", label: "Opportunities"},
 { id: "rank", label: "Rank Tracking"},
 { id: "gaps", label: "Content Gaps"},
];

export default function KeywordResearchSuite() {
 const [activeTab, setActiveTab] = useState("discovery");

 return (
 <div style={S.root}>
 <div style={S.header}>
 <h1 style={S.title}>Keyword Research Suite</h1>
 <p style={S.subtitle}>Discover keywords, analyse SERP, track rankings, and find content gaps</p>
 </div>
 <div style={S.tabs}>
 {TABS.map((t) => (
 <button key={t.id} style={S.tab(activeTab === t.id)} onClick={() => setActiveTab(t.id)}>{t.label}</button>
 ))}
 </div>
 {activeTab === "discovery"&& <DiscoveryTab />}
 {activeTab === "serp"&& <SERPTab />}
 {activeTab === "competitors"&& <CompetitorsTab />}
 {activeTab === "intent"&& <IntentTab />}
 {activeTab === "clusters"&& <ClustersTab />}
 {activeTab === "opportunities"&& <OpportunitiesTab />}
 {activeTab === "rank"&& <RankTrackingTab />}
 {activeTab === "gaps"&& <ContentGapsTab />}
 </div>
 );
}
