import React, { useState, useRef, useEffect } from "react";
import { apiFetch, apiFetchJSON } from "../../api";
import { ToolHeader, MetricRow, MozCard, EmptyState, ErrorBox, Spinner } from "../MozUI";

const SEV_COLORS = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e"};
const SEV_BG = { high: "#3f1315", medium: "#3d2a0a", low: "#0d2218"};

function SeverityBadge({ sev }) {
 return (
 <span style={{
 background: SEV_BG[sev] || "#27272a",
 color: SEV_COLORS[sev] || "#a1a1aa",
 border: `1px solid ${SEV_COLORS[sev] || "#52525b"}`,
 borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700,
 textTransform: "uppercase", letterSpacing: 0.5,
 }}>{sev}</span>
 );
}

function IssueCard({ issue, pageUrl }) {
 const [fixing, setFixing] = useState(false);
 const [suggestion, setSuggestion] = useState("");
 const [fixErr, setFixErr] = useState("");

 const handleGenerate = async () => {
 setFixing(true);
 setFixErr("");
 setSuggestion("");
 try {
 const res = await apiFetchJSON("/api/seo-site-crawler/ai/fix", {
 method: "POST",
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify({ issue, page: pageUrl }),
 });
 const data = res;
 if (!data.ok) throw new Error(data.error || "Failed to generate fix");
 setSuggestion(data.suggestion);
 } catch (err) {
 setFixErr(err.message);
 } finally {
 setFixing(false);
 }
 };

 return (
 <div style={{ background: SEV_BG[issue.severity] || "#27272a", borderRadius: 8, padding: "10px 14px", border: `1px solid ${SEV_COLORS[issue.severity] || "#52525b"}22`, marginBottom: 8 }}>
 <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
 <SeverityBadge sev={issue.severity} />
 <span style={{ fontWeight: 700, color: "#e4e4e7", fontSize: 13 }}>{issue.type}</span>
 <button
 onClick={handleGenerate}
 disabled={fixing}
 style={{ marginLeft: "auto", background: "#4f46e5", color: "#09090b", border: "none", borderRadius: 6, padding: "3px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer"}}
 >{fixing ? "": "Generate Fix"}</button>
 </div>
 <div style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.5 }}>{issue.detail}</div>
 {issue.fix && (
 <div style={{ marginTop: 4, fontSize: 12, color: "#0ea5e9"}}>
 Tool: <span style={{ fontWeight: 600 }}>{issue.fix.replace(/-/g, "")}</span>
 </div>
 )}
 {suggestion && (
 <div style={{ marginTop: 8, background: "#27272a", borderRadius: 6, padding: "8px 12px", border: "1px solid #27272a", fontSize: 13, color: "#4f46e5", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
 {suggestion}
 <button onClick={() => navigator.clipboard?.writeText(suggestion)} style={{ display: "block", marginTop: 6, background: "transparent", border: "1px solid #52525b", borderRadius: 5, padding: "2px 10px", color: "#71717a", fontSize: 11, cursor: "pointer"}}>Copy</button>
 </div>
 )}
 {fixErr && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>{fixErr}</div>}
 </div>
 );
}

function KeywordPresencePanel({ keywords, keywordPresence }) {
 if (!keywords || keywords.length === 0) return null;
 return (
 <div style={{ background: "#18181b", borderRadius: 8, padding: "10px 14px", marginBottom: 10, border: "1px solid #27272a"}}>
 <div style={{ fontWeight: 700, fontSize: 12, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Keyword Presence Check</div>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
 {(keywordPresence || []).map(kp => (
 <div key={kp.keyword} style={{ background: "#09090b", borderRadius: 8, padding: "6px 12px", border: "1px solid #27272a", fontSize: 13 }}>
 <span style={{ fontWeight: 600, color: "#e4e4e7"}}>{kp.keyword}</span>
 <span style={{ marginLeft: 8, color: kp.inTitle ? "#22c55e": "#ef4444", fontSize: 11, fontWeight: 700 }}>Title {kp.inTitle ? "": ""}</span>
 <span style={{ marginLeft: 6, color: kp.inDesc ? "#22c55e": "#ef4444", fontSize: 11, fontWeight: 700 }}>Desc {kp.inDesc ? "": ""}</span>
 </div>
 ))}
 </div>
 </div>
 );
}

function PageSection({ page, keywords }) {
 const [open, setOpen] = useState(true);
 const issues = page.issues || [];

 return (
 <div style={{ background: "#09090b", borderRadius: 10, border: "1px solid #27272a", marginBottom: 12 }}>
 <button
 onClick={() => setOpen(o => !o)}
 style={{ width: "100%", background: "none", border: "none", color: "#e4e4e7", padding: "12px 16px", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between"}}
 >
 <div>
 <span style={{ fontWeight: 700, fontSize: 14 }}>{page.title || page.url}</span>
 <span style={{ marginLeft: 10, fontSize: 12, color: "#71717a"}}>{page.url}</span>
 </div>
 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
 {issues.filter(i => i.severity === "high").length > 0 && <span style={{ color: "#ef4444", fontWeight: 700, fontSize: 12 }}>{issues.filter(i => i.severity === "high").length} High</span>}
 {issues.filter(i => i.severity === "medium").length > 0 && <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 12 }}>{issues.filter(i => i.severity === "medium").length} Med</span>}
 {issues.filter(i => i.severity === "low").length > 0 && <span style={{ color: "#22c55e", fontWeight: 700, fontSize: 12 }}>{issues.filter(i => i.severity === "low").length} Low</span>}
 <span style={{ color: "#71717a", fontSize: 16 }}>{open ? "": ""}</span>
 </div>
 </button>
 {open && (
 <div style={{ padding: "0 16px 16px"}}>
 <KeywordPresencePanel keywords={keywords} keywordPresence={page.keywordPresence} />
 {issues.length === 0 ? (
 <div style={{ color: "#22c55e", fontWeight: 600, fontSize: 13 }}>No issues found on this page</div>
 ) : (
 issues.map((issue, i) => <IssueCard key={i} issue={issue} pageUrl={page.url} />)
 )}
 </div>
 )}
 </div>
 );
}

export default function SEOSiteCrawler() {
 const [input, setInput] = useState("");
 const [keywords, setKeywords] = useState([]);
 const [kwInput, setKwInput] = useState("");
 const [result, setResult] = useState(null);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 const [history, setHistory] = useState([]);
 const [analytics, setAnalytics] = useState([]);
 const [exported, setExported] = useState(null);
 const fileInputRef = useRef();

 const fetchHistory = async () => {
 try {
 const res = await apiFetchJSON("/api/seo-site-crawler/history");
 const data = res;
 if (data.ok) setHistory(data.history || []);
 } catch {}
 };
 const fetchAnalytics = async () => {
 try {
 const res = await apiFetchJSON("/api/seo-site-crawler/analytics");
 const data = res;
 if (data.ok) setAnalytics(data.analytics || []);
 } catch {}
 };

 useEffect(() => { fetchHistory(); fetchAnalytics(); }, []);

 // Keywords chip input
 const addKeyword = () => {
 const trimmed = kwInput.trim().replace(/,$/, "");
 if (!trimmed) return;
 const newKws = trimmed.split(/[,\n]+/).map(k => k.trim()).filter(k => k && !keywords.includes(k.toLowerCase()));
 if (newKws.length > 0) setKeywords(prev => [...prev, ...newKws.map(k => k.toLowerCase())]);
 setKwInput("");
 };
 const removeKeyword = kw => setKeywords(prev => prev.filter(k => k !== kw));
 const onKwKeyDown = e => { if (e.key === "Enter"|| e.key === ",") { e.preventDefault(); addKeyword(); } };

 // Crawl
 const handleCrawl = async () => {
 if (!input.trim()) return;
 setLoading(true);
 setError("");
 setResult(null);
 try {
 const res = await apiFetchJSON("/api/seo-site-crawler/ai/crawl", {
 method: "POST",
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify({ site: input.trim(), keywords }),
 });
 const data = res;
 if (!data.ok) throw new Error(data.error || "Crawl failed");
 setResult(data.result);
 fetchHistory();
 fetchAnalytics();
 } catch (err) {
 setError(err.message);
 } finally {
 setLoading(false);
 }
 };

 // Import/Export
 const handleImport = e => {
 const file = e.target.files[0];
 if (!file) return;
 const reader = new FileReader();
 reader.onload = async evt => {
 try {
 const res = await apiFetchJSON("/api/seo-site-crawler/import", {
 method: "POST",
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify({ data: JSON.parse(evt.target.result) }),
 });
 const data = res;
 if (!data.ok) throw new Error(data.error || "Import failed");
 fetchHistory();
 } catch (err) { setError(err.message); }
 };
 reader.readAsText(file);
 };
 const handleExport = () => {
 const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json"});
 const url = URL.createObjectURL(blob);
 setExported(url);
 setTimeout(() =>URL.revokeObjectURL(url), 10000);
 };

 const pages = result?.pages || [];
 const totalIssues = result?.totalIssues || 0;

 return (
 <div style={{ background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',sans-serif", padding: "28px 32px" }}>
 <ToolHeader
 title="SEO Site Crawler"
 description="Crawl, analyse, and fix site SEO issues with AI-powered suggestions"
 inputValue={input}
 onInputChange={setInput}
 onRun={handleCrawl}
 loading={loading}
 inputPlaceholder="Enter site URL (e.g. yourstore.com)"
 buttonLabel="Crawl & Analyse"
 extra={
 <div style={{ display: "flex", flexWrap: "wrap", gap: 6, background: "#18181b", borderRadius: 10, border: "1px solid #3f3f46", padding: "8px 10px", minWidth: 280, alignItems: "center" }}>
 {keywords.map((kw) => (
 <span key={kw} style={{ background: "#27272a", color: "#818cf8", borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
 {kw}
 <button onClick={() => removeKeyword(kw)} style={{ background: "none", border: "none", color: "#a1a1aa", cursor: "pointer", fontSize: 14, padding: 0 }}>�</button>
 </span>
 ))}
 <input
 value={kwInput}
 onChange={(e) => setKwInput(e.target.value)}
 onKeyDown={onKwKeyDown}
 onBlur={addKeyword}
 style={{ flex: 1, minWidth: 120, background: "none", border: "none", color: "#fafafa", fontSize: 13, outline: "none" }}
 placeholder={keywords.length === 0 ? "Focus keywords (Enter to add)" : "Add keyword"}
 />
 </div>
 }
 />
 {error && <ErrorBox message={error} />}
 {loading && <div style={{ textAlign: "center", padding: 48 }}><Spinner size={40} /></div>}
 {!loading && result && (
 <>
 <MetricRow
 metrics={[
 { value: result.pagesScanned ?? pages.length, label: "Pages Scanned", color: "#3b9eff" },
 { value: result.high ?? 0, label: "High Issues", color: "#e03e40" },
 { value: result.medium ?? 0, label: "Medium", color: "#f5c842" },
 { value: result.low ?? 0, label: "Low", color: "#1fbb7a" },
 ]}
 />
 <MozCard title="Page-by-Page Analysis">
 {pages.length === 0 ? (
 <EmptyState icon="??" title="No pages found" description="The crawler returned no page data" />
 ) : (
 pages.map((page, i) => <PageSection key={i} page={page} keywords={keywords} />)
 )}
 </MozCard>
 </>
 )}
 {!loading && !result && (
 <EmptyState icon="???" title="Enter a site URL to crawl" description="The crawler will analyse every page for technical SEO issues and generate AI fix suggestions" />
 )}
 </div>
 );
}
