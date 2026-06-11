import React, { useState, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/seo-site-crawler";

const S = {
  page:   { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card:   { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  card2:  { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "16px 20px", marginBottom: 12 },
  inset:  { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: "14px 16px", marginBottom: 10 },
  btn:    (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : v === "amber" ? "#92400e" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  btnSm:  (v) => ({ background: v === "primary" ? "#4f46e5" : v === "danger" ? "#7f1d1d" : v === "green" ? "#166534" : "#27272a", color: "#fafafa", border: "none", borderRadius: 7, padding: "5px 10px", fontWeight: 700, fontSize: 11, cursor: "pointer", whiteSpace: "nowrap" }),
  input:  { flex: 1, minWidth: 160, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  select: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "10px 14px", outline: "none" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row:    { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
  th:     { fontSize: 10, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 0.8, padding: "8px 12px", background: "#09090b", borderBottom: "1px solid #27272a", whiteSpace: "nowrap" },
  td:     { fontSize: 12, color: "#a1a1aa", padding: "10px 12px", borderBottom: "1px solid #1a1a1e", verticalAlign: "top", lineHeight: 1.4 },
  badge:  (sev) => ({
    background: sev === "high" ? "#3f1315" : sev === "medium" ? "#3d2a0a" : sev === "low" ? "#0d2218" : sev === "good" ? "#052e16" : sev === "info" ? "#0c1a2e" : "#27272a",
    color:      sev === "high" ? "#f87171" : sev === "medium" ? "#fbbf24" : sev === "low" ? "#4ade80" : sev === "good" ? "#4ade80" : sev === "info" ? "#60a5fa" : "#a1a1aa",
    border: `1px solid ${sev === "high" ? "#f8717130" : sev === "medium" ? "#fbbf2430" : sev === "low" ? "#4ade8030" : sev === "info" ? "#60a5fa30" : "#27272a"}`,
    borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, display: "inline-block",
  }),
  pre:    { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "12px 14px", fontSize: 12, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
};

const TABS = [
  { id: "dashboard",   label: "Dashboard" },
  { id: "explorer",    label: "URL Explorer" },
  { id: "issues",      label: "Issues" },
  { id: "structure",   label: "Site Structure" },
  { id: "performance", label: "Performance" },
  { id: "schedules",   label: "Scheduled Crawls" },
  { id: "compare",     label: "Compare Crawls" },
  { id: "guide",       label: "Crawl Guide" },
];

const ISSUE_CATEGORIES = [
  { id: "all",      label: "All Issues",       icon: "\uD83D\uDD0D" },
  { id: "meta",     label: "Meta & Titles",    icon: "\uD83D\uDCDD", types: ["missing-title","title-too-long","title-too-short","missing-meta-description","meta-too-long","meta-too-short","duplicate-title","duplicate-meta"] },
  { id: "crawl",    label: "Crawlability",     icon: "\uD83D\uDD77\uFE0F", types: ["404-error","redirect-chain","noindex","blocked-robots","broken-link","403-forbidden","500-error","503-unavailable"] },
  { id: "headings", label: "Headings",         icon: "\uD83D\uDCCB", types: ["missing-h1","multiple-h1","empty-h1","h1-too-long","wrong-heading-order","missing-heading-hierarchy"] },
  { id: "images",   label: "Images",           icon: "\uD83D\uDDBC\uFE0F", types: ["missing-alt","empty-alt","large-image","wrong-format","missing-dimensions","too-many-images"] },
  { id: "schema",   label: "Schema",           icon: "\uD83C\uDFF7\uFE0F", types: ["missing-schema","invalid-schema","missing-product-schema","missing-breadcrumb","schema-error"] },
  { id: "links",    label: "Internal Links",   icon: "\uD83D\uDD17", types: ["orphan-page","broken-internal-link","redirect-loop","too-few-links","too-many-links"] },
  { id: "perf",     label: "Performance",      icon: "\u26A1", types: ["slow-lcp","large-lcp","render-blocking","no-compression","no-caching","large-dom","slow-ttfb"] },
  { id: "content",  label: "Content",          icon: "\uD83D\uDCC4", types: ["thin-content","duplicate-content","low-word-count","keyword-missing","no-canonical"] },
];

const USER_AGENTS = [
  "Googlebot Desktop",
  "Googlebot Mobile",
  "Bingbot",
  "AhrefsBot",
  "DuckDuckBot",
];

const SCHEDULE_FREQS = ["Daily", "Weekly", "Fortnightly", "Monthly"];

const CWV_THRESHOLDS = {
  lcp:  { good: 2500,  poor: 4000,  unit: "ms",  label: "LCP",  description: "Largest Contentful Paint" },
  inp:  { good: 200,   poor: 500,   unit: "ms",  label: "INP",  description: "Interaction to Next Paint" },
  cls:  { good: 0.1,   poor: 0.25,  unit: "",    label: "CLS",  description: "Cumulative Layout Shift" },
  ttfb: { good: 800,   poor: 1800,  unit: "ms",  label: "TTFB", description: "Time to First Byte" },
  fcp:  { good: 1800,  poor: 3000,  unit: "ms",  label: "FCP",  description: "First Contentful Paint" },
};

// Sub-components

function HealthGauge({ score }) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  const label = score >= 80 ? "Healthy" : score >= 60 ? "Needs Work" : "Critical";
  const arc   = Math.round((score / 100) * 188);
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ position: "relative", display: "inline-block", width: 150, height: 84 }}>
        <svg width="150" height="84" viewBox="0 0 150 84">
          <path d="M 10 79 A 65 65 0 0 1 140 79" fill="none" stroke="#27272a" strokeWidth="13" strokeLinecap="round" />
          <path d="M 10 79 A 65 65 0 0 1 140 79" fill="none" stroke={color} strokeWidth="13" strokeLinecap="round"
            strokeDasharray={`${arc} 204`} />
        </svg>
        <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", textAlign: "center", paddingBottom: 2 }}>
          <div style={{ fontSize: 30, fontWeight: 900, color, lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: 10, color: "#71717a", fontWeight: 600 }}>/ 100</div>
        </div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color, marginTop: 4 }}>{label}</div>
    </div>
  );
}

function ProgressBar({ value, max, color = "#4f46e5", height = 6 }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div style={{ background: "#27272a", borderRadius: 4, height, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, background: color, height: "100%", borderRadius: 4 }} />
    </div>
  );
}

function CWVChip({ metric, value }) {
  const t = CWV_THRESHOLDS[metric];
  if (!t || value == null) return null;
  const num = parseFloat(value);
  const status = num <= t.good ? "good" : num <= t.poor ? "medium" : "high";
  const color  = status === "good" ? "#4ade80" : status === "medium" ? "#fbbf24" : "#f87171";
  const bg     = status === "good" ? "#052e16" : status === "medium" ? "#3d2a0a" : "#3f1315";
  return (
    <div style={{ background: bg, borderRadius: 8, padding: "8px 12px", minWidth: 80, textAlign: "center" }}>
      <div style={{ fontSize: 9, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8 }}>{t.label}</div>
      <div style={{ fontSize: 17, fontWeight: 900, color, marginTop: 2 }}>{num}{t.unit}</div>
      <div style={{ fontSize: 9, color, marginTop: 1 }}>{status === "good" ? "Good" : status === "medium" ? "Needs work" : "Poor"}</div>
    </div>
  );
}

function AIFixPanel({ issue, pageUrl }) {
  const [loading, setLoading] = React.useState(false);
  const [fix, setFix]         = React.useState("");
  const [err, setErr]         = React.useState("");
  const [copied, setCopied]   = React.useState(false);
  const generate = async () => {
    setLoading(true); setErr(""); setFix("");
    try {
      const r = await apiFetchJSON(`${API}/ai/fix`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issue, page: pageUrl }),
      });
      if (!r.ok) throw new Error(r.error || "AI fix failed");
      setFix(r.suggestion || r.fix || "");
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };
  const copy = () => { navigator.clipboard?.writeText(fix); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <div style={{ marginTop: 8 }}>
      {!fix && !loading && <button style={S.btnSm("primary")} onClick={generate}>AI Fix Suggestion</button>}
      {loading && <Spinner size={14} />}
      {err && <div style={{ color: "#f87171", fontSize: 11, marginTop: 4 }}>{err}</div>}
      {fix && (
        <div style={{ background: "#1e1b4b", border: "1px solid #3730a3", borderRadius: 7, padding: "10px 12px", marginTop: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: "#818cf8", fontWeight: 700, textTransform: "uppercase" }}>AI Suggested Fix</span>
            <button style={S.btnSm()} onClick={copy}>{copied ? "Copied!" : "Copy"}</button>
          </div>
          <div style={{ fontSize: 12, color: "#c7d2fe", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{fix}</div>
        </div>
      )}
    </div>
  );
}

function IssueRow({ issue, pageUrl, index }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ background: index % 2 === 0 ? "#18181b" : "#111113", borderBottom: "1px solid #1a1a1e" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", cursor: "pointer" }} onClick={() => setOpen(o => !o)}>
        <span style={S.badge(issue.severity)}>{issue.severity}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>{issue.type || issue.code}</div>
          {issue.detail && <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>{issue.detail}</div>}
        </div>
        <div style={{ fontSize: 11, color: "#52525b", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0 }}>{pageUrl}</div>
        <span style={{ color: "#52525b", fontSize: 12, flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ padding: "0 14px 14px 14px" }}>
          {issue.context && <div style={S.pre}>{issue.context}</div>}
          <AIFixPanel issue={issue} pageUrl={pageUrl} />
        </div>
      )}
    </div>
  );
}

// Main Component

export default function SEOSiteCrawler() {
  const [url, setUrl]               = useState("");
  const [depth, setDepth]           = useState(3);
  const [maxPages, setMaxPages]     = useState(100);
  const [userAgent, setUserAgent]   = useState("Googlebot Desktop");
  const [crawlDelay, setCrawlDelay] = useState(0);
  const [excludePatterns, setExcludePatterns] = useState([]);
  const [excludeInput, setExcludeInput]       = useState("");
  const [keywords, setKeywords]     = useState([]);
  const [kwInput, setKwInput]       = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [tab, setTab]               = useState("dashboard");
  const [selectedPage, setSelectedPage] = useState(null);
  const [urlSearch, setUrlSearch]   = useState("");
  const [urlSort, setUrlSort]       = useState("issues");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sevFilter, setSevFilter]   = useState("all");
  const [catFilter, setCatFilter]   = useState("all");
  const [bulkType, setBulkType]     = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [structView, setStructView] = useState("orphans");
  const [perfSort, setPerfSort]     = useState("response");
  const [schedules, setSchedules]   = useState([]);
  const [newSched, setNewSched]     = useState({ name: "", url: "", frequency: "Weekly", notifyEmail: "" });
  const [schedSaving, setSchedSaving]   = useState(false);
  const [schedDeleting, setSchedDeleting] = useState(null);
  const [history, setHistory]       = useState([]);
  const [compareA, setCompareA]     = useState("");
  const [compareB, setCompareB]     = useState("");
  const [compareResult, setCompareResult] = useState(null);
  const [comparing, setComparing]   = useState(false);
  const [aiRec, setAiRec]           = useState(null);
  const [aiRecLoading, setAiRecLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [hr, sr] = await Promise.all([
          apiFetchJSON(`${API}/history`).catch(() => ({})),
          apiFetchJSON(`${API}/schedules`).catch(() => ({})),
        ]);
        if (hr.history) setHistory(hr.history);
        if (sr.schedules) setSchedules(sr.schedules);
      } catch {}
    })();
  }, []);

  const addKeyword = () => {
    const parts = kwInput.split(/[,\n]+/).map(k => k.trim().toLowerCase()).filter(k => k && !keywords.includes(k));
    if (parts.length) setKeywords(p => [...p, ...parts]);
    setKwInput("");
  };

  const addExclude = () => {
    const p = excludeInput.trim();
    if (p && !excludePatterns.includes(p)) setExcludePatterns(prev => [...prev, p]);
    setExcludeInput("");
  };

  const crawl = async () => {
    if (!url.trim()) return;
    setLoading(true); setError(""); setResult(null); setTab("dashboard");
    setSelectedPage(null); setBulkResult(null); setAiRec(null);
    try {
      const r = await apiFetchJSON(`${API}/ai/crawl`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site: url.trim(), keywords, depth, maxPages, userAgent, crawlDelay, excludePatterns }),
      });
      if (!r.ok) throw new Error(r.error || "Crawl failed");
      setResult(r.result);
      const hr = await apiFetchJSON(`${API}/history`).catch(() => ({}));
      if (hr.history) setHistory(hr.history);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const runBulkFix = async () => {
    if (!bulkType) return;
    setBulkLoading(true); setBulkResult(null);
    try {
      const r = await apiFetchJSON(`${API}/bulk-fix`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueType: bulkType, pages: pages.map(p => p.url) }),
      });
      setBulkResult(r);
    } catch (e) { setBulkResult({ ok: false, error: e.message }); }
    setBulkLoading(false);
  };

  const loadAiRec = async () => {
    setAiRecLoading(true); setAiRec(null);
    try {
      const r = await apiFetchJSON(`${API}/ai/recommendations`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: { high: result?.high, medium: result?.medium, low: result?.low, healthScore, pages: pages.length } }),
      });
      if (r.ok !== false) setAiRec(r.recommendations || r.result || "");
    } catch {}
    setAiRecLoading(false);
  };

  const runCompare = async () => {
    if (!compareA || !compareB) return;
    setComparing(true); setCompareResult(null);
    try {
      const r = await apiFetchJSON(`${API}/compare`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crawlA: compareA, crawlB: compareB }),
      });
      setCompareResult(r);
    } catch (e) { setError(e.message); }
    setComparing(false);
  };

  const saveSchedule = async () => {
    if (!newSched.name.trim() || !newSched.url.trim()) return;
    setSchedSaving(true);
    try {
      const r = await apiFetchJSON(`${API}/schedules`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newSched, createdAt: new Date().toISOString() }),
      });
      setSchedules(p => [...p, r.schedule || { ...newSched, id: Date.now() }]);
      setNewSched({ name: "", url: "", frequency: "Weekly", notifyEmail: "" });
    } catch {}
    setSchedSaving(false);
  };

  const deleteSchedule = async (id) => {
    setSchedDeleting(id);
    try {
      await apiFetchJSON(`${API}/schedules/${id}`, { method: "DELETE" });
      setSchedules(p => p.filter(s => s.id !== id));
    } catch {}
    setSchedDeleting(null);
  };

  const exportReport = (format) => {
    let content, mime, ext;
    if (format === "json") {
      content = JSON.stringify({ site: url, crawledAt: new Date().toISOString(), healthScore, pages }, null, 2);
      mime = "application/json"; ext = "json";
    } else {
      const rows = [["URL","Title","Status","Issues","High","Medium","Low","Word Count","Response Time (ms)"]];
      pages.forEach(p => {
        const iss = p.issues || [];
        rows.push([p.url, p.title || "", p.statusCode || 200, iss.length, iss.filter(i=>i.severity==="high").length, iss.filter(i=>i.severity==="medium").length, iss.filter(i=>i.severity==="low").length, p.wordCount || "", p.responseTime || ""]);
      });
      content = rows.map(r => r.map(c => `"${String(c||"").replace(/"/g,'""')}"`).join(",")).join("\n");
      mime = "text/csv"; ext = "csv";
    }
    const blob = new Blob([content], { type: mime });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `seo-crawl-${(url||"site").replace(/https?:\/\//,"").replace(/[^\w]/g,"-")}-${new Date().toISOString().split("T")[0]}.${ext}`;
    a.click();
  };

  // Derived data
  const pages = result?.pages || [];
  const allIssues = pages.flatMap(p => (p.issues || []).map(i => ({ ...i, pageUrl: p.url, pageTitle: p.title || p.url })));
  const healthScore = result
    ? Math.max(0, Math.round(100 - ((result.high || 0) * 8) - ((result.medium || 0) * 3) - ((result.low || 0) * 0.5)))
    : 0;
  const issueTypeGroups = allIssues.reduce((acc, i) => { acc[i.type] = (acc[i.type] || 0) + 1; return acc; }, {});
  const filteredIssues = allIssues
    .filter(i => sevFilter === "all" || i.severity === sevFilter)
    .filter(i => {
      if (catFilter === "all") return true;
      const cat = ISSUE_CATEGORIES.find(c => c.id === catFilter);
      if (!cat?.types) return true;
      return cat.types.some(t => (i.type || "").toLowerCase().replace(/\s/g, "-").includes(t));
    });
  const urlExplorerData = [...pages]
    .filter(p => !urlSearch || p.url?.toLowerCase().includes(urlSearch.toLowerCase()) || (p.title||"").toLowerCase().includes(urlSearch.toLowerCase()))
    .filter(p => statusFilter === "all" || String(p.statusCode || 200) === statusFilter)
    .sort((a, b) => {
      if (urlSort === "issues") return (b.issues?.length || 0) - (a.issues?.length || 0);
      if (urlSort === "high")   return ((b.issues||[]).filter(i=>i.severity==="high").length) - ((a.issues||[]).filter(i=>i.severity==="high").length);
      if (urlSort === "words")  return (b.wordCount || 0) - (a.wordCount || 0);
      if (urlSort === "speed")  return (b.responseTime || 0) - (a.responseTime || 0);
      if (urlSort === "links")  return (b.inboundLinks || 0) - (a.inboundLinks || 0);
      return 0;
    });
  const orphanedPages    = pages.filter(p => (p.inboundLinks || 0) === 0 && !(p.url || "").endsWith("/"));
  const thinContentPages = pages.filter(p => (p.wordCount || 0) < 300 && (p.wordCount || 0) > 0);
  const slowPages        = pages.filter(p => (p.responseTime || 0) > 2500);
  const missingH1Pages   = pages.filter(p => !p.h1);
  const missingTitlePages = pages.filter(p => !p.title);
  const indexableCount   = pages.filter(p => p.indexable !== false).length;
  const pagesWithSchema  = pages.filter(p => p.hasSchema).length;
  const avgResponseTime  = pages.length ? Math.round(pages.reduce((a, p) => a + (p.responseTime || 0), 0) / pages.length) : 0;
  const quickWins = [
    missingTitlePages.length > 0 && { label: `${missingTitlePages.length} pages missing title tags`, severity: "high", action: () => { setCatFilter("meta"); setSevFilter("high"); setTab("issues"); } },
    missingH1Pages.length > 0    && { label: `${missingH1Pages.length} pages with no H1`, severity: "high", action: () => { setCatFilter("headings"); setTab("issues"); } },
    orphanedPages.length > 0     && { label: `${orphanedPages.length} orphaned pages`, severity: "medium", action: () => { setStructView("orphans"); setTab("structure"); } },
    thinContentPages.length > 0  && { label: `${thinContentPages.length} thin content pages (<300 words)`, severity: "medium", action: () => { setCatFilter("content"); setTab("issues"); } },
    slowPages.length > 0         && { label: `${slowPages.length} slow pages (>2.5s response)`, severity: "medium", action: () => setTab("performance") },
  ].filter(Boolean);
  const depthDist = pages.reduce((acc, p) => { const d = p.depth || 1; acc[d] = (acc[d] || 0) + 1; return acc; }, {});
  const h1Map     = pages.filter(p => p.h1).map(p => ({ url: p.url, h1: p.h1 }));
  const linkLeaders = [...pages].filter(p => p.inboundLinks > 0).sort((a,b) => (b.inboundLinks||0)-(a.inboundLinks||0)).slice(0,10);

  return (
    <div style={S.page}>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>SEO Site Crawler</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>
          Screaming Frog-depth technical SEO for Shopify. Every page, every issue, AI-powered fixes, Core Web Vitals, site structure, scheduled monitoring, and crawl comparison.
        </p>
      </div>

      {/* Stats Bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Crawls Run",       value: history.length,                                                color: "#4f46e5" },
          { label: "Pages Last Crawl", value: result ? pages.length : "—",                                  color: "#818cf8" },
          { label: "Total Issues",     value: result ? allIssues.length : "—",                              color: result && allIssues.filter(i=>i.severity==="high").length > 0 ? "#f87171" : "#fbbf24" },
          { label: "Health Score",     value: result ? `${healthScore}/100` : "—",                       color: healthScore >= 80 ? "#4ade80" : healthScore >= 60 ? "#fbbf24" : "#f87171" },
          { label: "Schedules",        value: schedules.length,                                              color: "#60a5fa" },
        ].map(s => (
          <div key={s.label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 20px" }}>
            <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Crawl bar */}
      <div style={S.card}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
          <input style={{ ...S.input, fontSize: 14 }} value={url} onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && crawl()} placeholder="https://mystore.myshopify.com" />
          <button style={S.btn("primary")} onClick={crawl} disabled={loading || !url.trim()}>
            {loading ? "Crawling..." : "Crawl & Analyse"}
          </button>
          <button style={S.btn(showSettings ? "amber" : null)} onClick={() => setShowSettings(s => !s)}>
            {showSettings ? "Hide Settings" : "Settings"}
          </button>
          {result && <button style={S.btn()} onClick={() => exportReport("csv")}>Export CSV</button>}
          {result && <button style={S.btn()} onClick={() => exportReport("json")}>Export JSON</button>}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", minHeight: 28 }}>
          <span style={{ fontSize: 11, color: "#52525b", marginRight: 4 }}>FOCUS KEYWORDS:</span>
          {keywords.map(kw => (
            <span key={kw} style={{ background: "#1e1b4b", color: "#818cf8", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
              {kw}
              <button onClick={() => setKeywords(p => p.filter(k => k !== kw))} style={{ background: "none", border: "none", color: "#52525b", cursor: "pointer", padding: 0, lineHeight: 1 }}>x</button>
            </span>
          ))}
          <input value={kwInput} onChange={e => setKwInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addKeyword(); } }}
            onBlur={addKeyword}
            style={{ background: "none", border: "none", color: "#fafafa", fontSize: 12, outline: "none", minWidth: 160 }}
            placeholder="Add keywords (Enter)..." />
        </div>
        {showSettings && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #27272a" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Crawl Depth</label>
                <select style={{ ...S.select, width: "100%" }} value={depth} onChange={e => setDepth(Number(e.target.value))}>
                  {[1,2,3,4,5].map(d => <option key={d} value={d}>Depth {d}{d === 3 ? " (recommended)" : ""}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Max Pages</label>
                <select style={{ ...S.select, width: "100%" }} value={maxPages} onChange={e => setMaxPages(Number(e.target.value))}>
                  {[10, 25, 50, 100, 250, 500].map(n => <option key={n} value={n}>{n} pages</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>User Agent</label>
                <select style={{ ...S.select, width: "100%" }} value={userAgent} onChange={e => setUserAgent(e.target.value)}>
                  {USER_AGENTS.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Crawl Delay</label>
                <select style={{ ...S.select, width: "100%" }} value={crawlDelay} onChange={e => setCrawlDelay(Number(e.target.value))}>
                  {[0,200,500,1000,2000].map(d => <option key={d} value={d}>{d === 0 ? "No delay" : `${d}ms`}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Exclude URL Patterns</label>
              <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                <input style={{ ...S.input, fontSize: 12 }} value={excludeInput} onChange={e => setExcludeInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addExclude()} placeholder="/cdn/ or .pdf or ?sort=" />
                <button style={S.btnSm("primary")} onClick={addExclude}>Add</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {excludePatterns.map(p => (
                  <span key={p} style={{ background: "#27272a", color: "#a1a1aa", borderRadius: 6, padding: "2px 10px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <code>{p}</code>
                    <button onClick={() => setExcludePatterns(prev => prev.filter(x => x !== p))} style={{ background: "none", border: "none", color: "#52525b", cursor: "pointer", padding: 0 }}>x</button>
                  </span>
                ))}
                {excludePatterns.length === 0 && <span style={{ fontSize: 11, color: "#3f3f46" }}>No exclusions</span>}
              </div>
            </div>
          </div>
        )}
      </div>

      <ErrorBox message={error} />

      {loading && (
        <div style={{ ...S.card, textAlign: "center", padding: 56 }}>
          <Spinner size={44} />
          <div style={{ color: "#fafafa", marginTop: 20, fontSize: 16, fontWeight: 700 }}>Crawling {url}...</div>
          <div style={{ color: "#71717a", marginTop: 8, fontSize: 13 }}>Scanning titles, meta, headings, images, schema, internal links, Core Web Vitals...</div>
          <div style={{ color: "#3f3f46", marginTop: 4, fontSize: 12 }}>Depth {depth} | Max {maxPages} pages | {userAgent}</div>
        </div>
      )}

      {!result && !loading && tab !== "schedules" && tab !== "compare" && tab !== "guide" && (
        <EmptyState icon="Search" title="Enter a site URL to begin crawling" description="Analyses every page for technical SEO issues across all categories. Depth up to 5 levels, up to 500 pages." />
      )}

      {!loading && (
        <div style={{ marginTop: result ? 0 : 24 }}>
          <MozTabs tabs={TABS} active={tab} onChange={setTab} />

          {/* DASHBOARD */}
          {tab === "dashboard" && result && (
            <div style={{ marginTop: 20 }}>
              <div style={{ ...S.card, display: "flex", gap: 32, flexWrap: "wrap", alignItems: "center" }}>
                <HealthGauge score={healthScore} />
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 12 }}>
                  {[
                    { label: "Pages Crawled",  value: pages.length,                                       color: "#4f46e5" },
                    { label: "Total Issues",   value: allIssues.length,                                   color: "#f87171" },
                    { label: "High",           value: allIssues.filter(i=>i.severity==="high").length,   color: "#ef4444" },
                    { label: "Medium",         value: allIssues.filter(i=>i.severity==="medium").length, color: "#f59e0b" },
                    { label: "Low",            value: allIssues.filter(i=>i.severity==="low").length,    color: "#22c55e" },
                    { label: "Clean Pages",    value: pages.filter(p=>(p.issues||[]).length===0).length, color: "#818cf8" },
                    { label: "Indexable",      value: indexableCount,                                     color: "#60a5fa" },
                    { label: "Avg Speed",      value: avgResponseTime ? `${avgResponseTime}ms` : "—",   color: avgResponseTime > 2500 ? "#f87171" : "#4ade80" },
                  ].map(m => (
                    <div key={m.label} style={S.inset}>
                      <div style={{ fontSize: 10, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{m.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: m.color, lineHeight: 1 }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
                <div style={S.card}>
                  <div style={S.sectionTitle}>Priority Quick Wins</div>
                  {quickWins.length === 0 ? (
                    <div style={{ color: "#4ade80", fontWeight: 700, fontSize: 13 }}>No critical issues. Site looks technically healthy!</div>
                  ) : quickWins.map((w, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #1f1f22" }}>
                      <span style={S.badge(w.severity)}>{w.severity}</span>
                      <div style={{ flex: 1, fontSize: 13, color: "#e4e4e7" }}>{w.label}</div>
                      <button style={S.btnSm("primary")} onClick={w.action}>View</button>
                    </div>
                  ))}
                </div>
                <div style={S.card}>
                  <div style={S.sectionTitle}>Issues by Category</div>
                  {ISSUE_CATEGORIES.filter(c => c.id !== "all").map(cat => {
                    const catIss = allIssues.filter(i => (cat.types || []).some(t => (i.type || "").toLowerCase().replace(/\s/g, "-").includes(t)));
                    const h = catIss.filter(i => i.severity === "high").length;
                    const m = catIss.filter(i => i.severity === "medium").length;
                    return (
                      <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderBottom: "1px solid #1f1f22", cursor: "pointer" }}
                        onClick={() => { setCatFilter(cat.id); setTab("issues"); }}>
                        <span style={{ fontSize: 16 }}>{cat.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>{cat.label}</div>
                          <ProgressBar value={catIss.length} max={Math.max(allIssues.length, 1)} color={h > 0 ? "#ef4444" : m > 0 ? "#f59e0b" : "#22c55e"} height={4} />
                        </div>
                        <div style={{ display: "flex", gap: 5 }}>
                          {h > 0 && <span style={S.badge("high")}>{h}</span>}
                          {m > 0 && <span style={S.badge("medium")}>{m}</span>}
                          {catIss.length === 0 && <span style={S.badge("good")}>ok</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={S.card}>
                  <div style={S.sectionTitle}>Most Common Issues</div>
                  {Object.entries(issueTypeGroups).sort((a,b) => b[1]-a[1]).slice(0,10).map(([type, count]) => {
                    const sev = (allIssues.find(i => i.type === type) || {}).severity || "low";
                    return (
                      <div key={type} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid #1f1f22" }}>
                        <span style={S.badge(sev)}>{sev}</span>
                        <span style={{ flex: 1, fontSize: 12, color: "#a1a1aa" }}>{type}</span>
                        <span style={{ fontWeight: 800, color: "#4f46e5", fontSize: 14 }}>{count}x</span>
                      </div>
                    );
                  })}
                  {Object.keys(issueTypeGroups).length === 0 && <div style={{ color: "#4ade80", fontSize: 13 }}>No issues found</div>}
                </div>
                <div style={S.card}>
                  <div style={S.sectionTitle}>Technical SEO Checklist</div>
                  {[
                    { t: "Unique title tags on all pages",    pass: !allIssues.find(i => (i.type||"").includes("title")) },
                    { t: "Meta descriptions on all pages",   pass: !allIssues.find(i => (i.type||"").includes("meta")) },
                    { t: "No 404 / broken links",            pass: !allIssues.find(i => (i.type||"").includes("404") || (i.type||"").includes("broken")) },
                    { t: "All images have alt text",         pass: !allIssues.find(i => (i.type||"").includes("alt")) },
                    { t: "Schema markup on key pages",       pass: pagesWithSchema > 0 },
                    { t: "No unintended noindex tags",       pass: !allIssues.find(i => (i.type||"").includes("noindex")) },
                    { t: "No redirect chains",               pass: !allIssues.find(i => (i.type||"").includes("redirect")) },
                    { t: "H1 headings on all pages",         pass: missingH1Pages.length === 0 },
                    { t: "No orphaned pages",                pass: orphanedPages.length === 0 },
                    { t: "Page response times within target",pass: slowPages.length === 0 },
                  ].map(({ t, pass }) => (
                    <div key={t} style={{ display: "flex", gap: 8, alignItems: "center", padding: "5px 0", borderBottom: "1px solid #1f1f22" }}>
                      <span style={{ color: pass ? "#4ade80" : "#f87171", fontSize: 14 }}>{pass ? "+" : "-"}</span>
                      <span style={{ fontSize: 12, color: pass ? "#e4e4e7" : "#a1a1aa" }}>{t}</span>
                    </div>
                  ))}
                </div>
                <div style={S.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={S.sectionTitle}>AI Action Plan</div>
                    <button style={S.btnSm("primary")} onClick={loadAiRec} disabled={aiRecLoading}>
                      {aiRecLoading ? "Analysing..." : "Generate AI Analysis"}
                    </button>
                  </div>
                  {aiRecLoading && <Spinner size={28} />}
                  {aiRec && !aiRecLoading && (
                    <div style={{ fontSize: 13, color: "#c7d2fe", lineHeight: 1.7, background: "#1e1b4b", borderRadius: 8, padding: "12px 14px", border: "1px solid #3730a3", whiteSpace: "pre-wrap" }}>
                      {typeof aiRec === "string" ? aiRec : JSON.stringify(aiRec, null, 2)}
                    </div>
                  )}
                  {!aiRec && !aiRecLoading && (
                    <p style={{ fontSize: 13, color: "#52525b", lineHeight: 1.6 }}>Click Generate for an AI-prioritised action plan based on your crawl results: ranked fixes with estimated SEO impact.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* URL EXPLORER */}
          {tab === "explorer" && result && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                <input style={{ ...S.input, maxWidth: 320 }} value={urlSearch} onChange={e => setUrlSearch(e.target.value)} placeholder="Search URLs or titles..." />
                <select style={S.select} value={urlSort} onChange={e => setUrlSort(e.target.value)}>
                  <option value="issues">Sort: Total Issues</option>
                  <option value="high">Sort: High Issues</option>
                  <option value="words">Sort: Word Count</option>
                  <option value="speed">Sort: Response Time</option>
                  <option value="links">Sort: Inbound Links</option>
                </select>
                <select style={S.select} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="all">All Status Codes</option>
                  <option value="200">200 OK</option>
                  <option value="301">301 Redirect</option>
                  <option value="302">302 Redirect</option>
                  <option value="404">404 Not Found</option>
                  <option value="500">5xx Errors</option>
                </select>
                <div style={{ fontSize: 12, color: "#52525b", alignSelf: "center", marginLeft: "auto" }}>
                  {urlExplorerData.length} / {pages.length} pages
                </div>
              </div>
              {selectedPage && (
                <div style={{ ...S.card, marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#fafafa" }}>{selectedPage.title || "(no title)"}</h2>
                      <code style={{ fontSize: 12, color: "#818cf8", marginTop: 4, display: "block" }}>{selectedPage.url}</code>
                    </div>
                    <button style={S.btnSm()} onClick={() => setSelectedPage(null)}>Back</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 16 }}>
                    {[
                      { label: "Status Code",   v: selectedPage.statusCode || 200,     color: (selectedPage.statusCode||200) < 300 ? "#4ade80" : "#f87171" },
                      { label: "Word Count",    v: selectedPage.wordCount || "—",      color: (selectedPage.wordCount||0) < 300 ? "#fbbf24" : "#4ade80" },
                      { label: "Response Time", v: selectedPage.responseTime ? `${selectedPage.responseTime}ms` : "—", color: (selectedPage.responseTime||0) > 2500 ? "#f87171" : "#4ade80" },
                      { label: "Inbound Links", v: selectedPage.inboundLinks ?? "—",   color: "#4f46e5" },
                      { label: "Images",        v: selectedPage.imageCount ?? "—",     color: "#a1a1aa" },
                      { label: "Crawl Depth",   v: selectedPage.depth ?? "—",          color: "#a1a1aa" },
                    ].map(({ label, v, color }) => (
                      <div key={label} style={S.inset}>
                        <div style={{ fontSize: 10, color: "#71717a", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color, marginTop: 3 }}>{String(v)}</div>
                      </div>
                    ))}
                  </div>
                  {selectedPage.h1 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={S.sectionTitle}>H1 Heading</div>
                      <div style={{ fontSize: 14, color: "#e4e4e7", fontWeight: 600 }}>{selectedPage.h1}</div>
                    </div>
                  )}
                  {selectedPage.metaDescription && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={S.sectionTitle}>Meta Description ({selectedPage.metaDescription.length} chars)</div>
                      <div style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.5 }}>{selectedPage.metaDescription}</div>
                    </div>
                  )}
                  <div>
                    <div style={S.sectionTitle}>{(selectedPage.issues || []).length} Issues on this page</div>
                    {(selectedPage.issues || []).length === 0 ? (
                      <div style={{ color: "#4ade80", fontWeight: 700, fontSize: 13 }}>No issues found on this page</div>
                    ) : selectedPage.issues.map((issue, i) => (
                      <IssueRow key={i} issue={issue} pageUrl={selectedPage.url} index={i} />
                    ))}
                  </div>
                </div>
              )}
              {!selectedPage && (
                <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          {["URL / Title", "Status", "Issues", "Word Count", "Response", "Inbound Links", "Indexable"].map(h => (
                            <th key={h} style={S.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {urlExplorerData.map((p, i) => {
                          const iss = p.issues || [];
                          const h = iss.filter(x => x.severity === "high").length;
                          const m = iss.filter(x => x.severity === "medium").length;
                          return (
                            <tr key={i} style={{ cursor: "pointer" }} onClick={() => setSelectedPage(p)}>
                              <td style={S.td}>
                                <div style={{ fontWeight: 600, color: "#e4e4e7", fontSize: 13 }}>{p.title || "(no title)"}</div>
                                <div style={{ fontFamily: "monospace", fontSize: 11, color: "#52525b", marginTop: 2 }}>{p.url?.replace(/^https?:\/\/[^/]+/, "") || p.url}</div>
                              </td>
                              <td style={S.td}><span style={{ color: (p.statusCode||200) < 300 ? "#4ade80" : "#f87171", fontWeight: 700 }}>{p.statusCode || 200}</span></td>
                              <td style={S.td}>
                                {h > 0 && <span style={{ ...S.badge("high"), marginRight: 4 }}>{h}</span>}
                                {m > 0 && <span style={{ ...S.badge("medium"), marginRight: 4 }}>{m}</span>}
                                {iss.length === 0 && <span style={S.badge("good")}>ok</span>}
                              </td>
                              <td style={{ ...S.td, color: (p.wordCount||0) < 300 && p.wordCount ? "#fbbf24" : "#a1a1aa" }}>{p.wordCount || "—"}</td>
                              <td style={{ ...S.td, color: (p.responseTime||0) > 2500 ? "#f87171" : (p.responseTime||0) > 0 ? "#4ade80" : "#a1a1aa" }}>{p.responseTime ? `${p.responseTime}ms` : "—"}</td>
                              <td style={S.td}>{p.inboundLinks ?? "—"}</td>
                              <td style={S.td}>{p.indexable === false ? <span style={S.badge("high")}>No</span> : <span style={S.badge("good")}>Yes</span>}</td>
                            </tr>
                          );
                        })}
                        {urlExplorerData.length === 0 && (
                          <tr><td colSpan={7} style={{ ...S.td, textAlign: "center", color: "#52525b", padding: 32 }}>No pages match your filters</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ISSUES */}
          {tab === "issues" && result && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                <select style={S.select} value={sevFilter} onChange={e => setSevFilter(e.target.value)}>
                  <option value="all">All Severities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
                <select style={S.select} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                  {ISSUE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <div style={{ fontSize: 12, color: "#52525b", alignSelf: "center", marginLeft: "auto" }}>{filteredIssues.length} issues</div>
                <button style={S.btnSm()} onClick={() => { setSevFilter("all"); setCatFilter("all"); }}>Clear</button>
              </div>
              <div style={{ ...S.card2, border: "1px solid #3730a3", marginBottom: 14 }}>
                <div style={S.sectionTitle}>Bulk AI Fix</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <select style={{ ...S.select, flex: 1 }} value={bulkType} onChange={e => setBulkType(e.target.value)}>
                    <option value="">Select issue type to bulk fix...</option>
                    {Object.entries(issueTypeGroups).sort((a,b) => b[1]-a[1]).map(([type, count]) => (
                      <option key={type} value={type}>{type} — {count} occurrence{count !== 1 ? "s" : ""}</option>
                    ))}
                  </select>
                  <button style={S.btn("primary")} onClick={runBulkFix} disabled={bulkLoading || !bulkType}>
                    {bulkLoading ? "Generating..." : "Bulk Fix All"}
                  </button>
                </div>
                {bulkResult && <div style={{ marginTop: 10, fontSize: 13, color: bulkResult.ok ? "#4ade80" : "#f87171" }}>{bulkResult.ok ? `Generated ${(bulkResult.fixes||[]).length} fixes` : bulkResult.error}</div>}
              </div>
              {filteredIssues.length === 0 ? (
                <EmptyState icon="Check" title="No issues match these filters" description="Try clearing filters." />
              ) : (
                <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12, overflow: "hidden" }}>
                  {filteredIssues.slice(0, 150).map((issue, i) => (
                    <IssueRow key={i} issue={issue} pageUrl={issue.pageUrl} index={i} />
                  ))}
                  {filteredIssues.length > 150 && (
                    <div style={{ textAlign: "center", padding: 14, fontSize: 12, color: "#52525b" }}>
                      Showing 150 of {filteredIssues.length} — use filters to narrow down.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SITE STRUCTURE */}
          {tab === "structure" && result && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                {[
                  { id: "orphans",    label: "Orphaned Pages" },
                  { id: "depth",      label: "Depth Distribution" },
                  { id: "h1map",      label: "H1 Map" },
                  { id: "linktop",    label: "Link Leaders" },
                  { id: "thin",       label: "Thin Content" },
                  { id: "duplicates", label: "Duplicate Titles" },
                ].map(v => (
                  <button key={v.id} style={S.btn(structView === v.id ? "primary" : null)} onClick={() => setStructView(v.id)}>{v.label}</button>
                ))}
              </div>
              {structView === "orphans" && (
                <div style={S.card}>
                  <div style={S.sectionTitle}>Orphaned Pages — {orphanedPages.length} pages with no inbound internal links</div>
                  <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14, lineHeight: 1.6 }}>
                    Orphaned pages cannot be discovered by Googlebot through internal links. They get no internal PageRank. Fix by linking from hub pages, navigation menus, or related product sections.
                  </p>
                  {orphanedPages.length === 0 ? (
                    <div style={{ color: "#4ade80", fontWeight: 700, fontSize: 13 }}>No orphaned pages found.</div>
                  ) : orphanedPages.map((p, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>{p.title || "(no title)"}</div>
                        <code style={{ fontSize: 11, color: "#52525b" }}>{p.url}</code>
                      </div>
                      <span style={S.badge("medium")}>Orphaned</span>
                      <button style={S.btnSm()} onClick={() => { setSelectedPage(p); setTab("explorer"); }}>Inspect</button>
                    </div>
                  ))}
                </div>
              )}
              {structView === "depth" && (
                <div style={S.card}>
                  <div style={S.sectionTitle}>Page Depth Distribution</div>
                  <p style={{ fontSize: 13, color: "#71717a", marginBottom: 16, lineHeight: 1.6 }}>
                    Keep important pages within 3 clicks of the homepage. Pages deeper than depth 3 receive less PageRank and are crawled less frequently.
                  </p>
                  {Object.entries(depthDist).sort((a,b) => Number(a[0])-Number(b[0])).map(([d, count]) => (
                    <div key={d} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                        <span style={{ color: "#e4e4e7", fontWeight: 600 }}>Depth {d}</span>
                        <span style={{ color: Number(d) <= 3 ? "#4ade80" : "#fbbf24", fontWeight: 700 }}>{count} pages</span>
                      </div>
                      <ProgressBar value={count} max={pages.length} color={Number(d) <= 3 ? "#4f46e5" : Number(d) === 4 ? "#f59e0b" : "#ef4444"} height={10} />
                      {Number(d) > 3 && <div style={{ fontSize: 11, color: "#71717a", marginTop: 3 }}>Pages at depth {d} — consider flattening site hierarchy</div>}
                    </div>
                  ))}
                  {Object.keys(depthDist).length === 0 && <div style={{ color: "#52525b", fontSize: 13 }}>Depth data not available in this crawl</div>}
                </div>
              )}
              {structView === "h1map" && (
                <div style={S.card}>
                  <div style={S.sectionTitle}>H1 Map — {h1Map.length} with H1 | {missingH1Pages.length} missing</div>
                  {missingH1Pages.length > 0 && (
                    <div style={{ background: "#3f1315", border: "1px solid #f8717130", borderRadius: 8, padding: "10px 14px", marginBottom: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#f87171" }}>{missingH1Pages.length} pages missing H1 headings</div>
                      <div style={{ fontSize: 12, color: "#f87171", lineHeight: 1.5, marginTop: 3 }}>Every page should have exactly one H1 matching the primary topic and target keyword.</div>
                    </div>
                  )}
                  {h1Map.map(({ url: pu, h1 }, i) => (
                    <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #1f1f22" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{h1}</div>
                      <code style={{ fontSize: 11, color: "#52525b" }}>{pu}</code>
                    </div>
                  ))}
                  {h1Map.length === 0 && <div style={{ color: "#52525b", fontSize: 13 }}>No H1 data available in this crawl</div>}
                </div>
              )}
              {structView === "linktop" && (
                <div style={S.card}>
                  <div style={S.sectionTitle}>Internal Link Leaders</div>
                  <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14, lineHeight: 1.6 }}>
                    Pages with many inbound internal links receive more internal PageRank. Ensure your highest-priority pages (collections, money pages) are the most internally linked.
                  </p>
                  {linkLeaders.length === 0 ? (
                    <div style={{ color: "#52525b", fontSize: 13 }}>No inbound link data in this crawl</div>
                  ) : linkLeaders.map((p, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: "1px solid #1f1f22" }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#4f46e5", minWidth: 28 }}>#{i+1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7", marginBottom: 2 }}>{p.title || p.url}</div>
                        <ProgressBar value={p.inboundLinks||0} max={linkLeaders[0]?.inboundLinks||1} color="#4f46e5" height={4} />
                      </div>
                      <span style={{ fontWeight: 800, fontSize: 14, color: "#818cf8" }}>{p.inboundLinks} links</span>
                    </div>
                  ))}
                </div>
              )}
              {structView === "thin" && (
                <div style={S.card}>
                  <div style={S.sectionTitle}>Thin Content — {thinContentPages.length} pages under 300 words</div>
                  <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14, lineHeight: 1.6 }}>
                    Google's Helpful Content system penalises thin pages. Target 300+ words on any indexable page. Product pages should have 200+ words of unique description text.
                  </p>
                  {thinContentPages.length === 0 ? (
                    <div style={{ color: "#4ade80", fontWeight: 700, fontSize: 13 }}>No thin content pages found</div>
                  ) : thinContentPages.sort((a,b) => (a.wordCount||0)-(b.wordCount||0)).map((p, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>{p.title || "(no title)"}</div>
                        <code style={{ fontSize: 11, color: "#52525b" }}>{p.url}</code>
                      </div>
                      <span style={{ fontWeight: 800, color: (p.wordCount||0) < 100 ? "#f87171" : "#fbbf24", fontSize: 13 }}>{p.wordCount || 0} words</span>
                    </div>
                  ))}
                </div>
              )}
              {structView === "duplicates" && (
                <div style={S.card}>
                  <div style={S.sectionTitle}>Duplicate Title Tags</div>
                  {(() => {
                    const titleMap = {};
                    pages.forEach(p => { if (p.title) { titleMap[p.title] = [...(titleMap[p.title] || []), p.url]; } });
                    const dups = Object.entries(titleMap).filter(([, urls]) => urls.length > 1);
                    return dups.length === 0 ? (
                      <div style={{ color: "#4ade80", fontWeight: 700, fontSize: 13 }}>No duplicate title tags found</div>
                    ) : dups.map(([title, urls], i) => (
                      <div key={i} style={{ marginBottom: 12, padding: "10px 0", borderBottom: "1px solid #1f1f22" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24", marginBottom: 6 }}>"{title}"</div>
                        {urls.map((u, j) => <code key={j} style={{ display: "block", fontSize: 11, color: "#52525b", marginBottom: 2 }}>{u}</code>)}
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          )}

          {/* PERFORMANCE */}
          {tab === "performance" && result && (
            <div style={{ marginTop: 20 }}>
              <div style={S.card}>
                <div style={S.sectionTitle}>Core Web Vitals — Site Average</div>
                <p style={{ fontSize: 13, color: "#71717a", marginBottom: 16, lineHeight: 1.6 }}>
                  Core Web Vitals are Google's official UX metrics and a confirmed ranking factor since May 2021.
                </p>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {result.cwv ? Object.keys(CWV_THRESHOLDS).map(key => (
                    <CWVChip key={key} metric={key} value={result.cwv[key]} />
                  )) : <div style={{ fontSize: 13, color: "#52525b" }}>Core Web Vitals data not available in this crawl.</div>}
                </div>
              </div>
              <div style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={S.sectionTitle}>Per-Page Performance — {slowPages.length} slow pages</div>
                  <select style={S.select} value={perfSort} onChange={e => setPerfSort(e.target.value)}>
                    <option value="response">Sort: Response Time</option>
                    <option value="lcp">Sort: LCP</option>
                    <option value="size">Sort: Page Size</option>
                  </select>
                </div>
                {pages.filter(p => p.responseTime).length === 0 ? (
                  <div style={{ fontSize: 13, color: "#52525b" }}>Per-page performance data requires full crawl with performance profiling.</div>
                ) : [...pages].sort((a, b) => {
                    if (perfSort === "size") return (b.pageSize||0)-(a.pageSize||0);
                    if (perfSort === "lcp") return (b.lcp||0)-(a.lcp||0);
                    return (b.responseTime||0)-(a.responseTime||0);
                  }).slice(0, 30).map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: "1px solid #1f1f22" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7", marginBottom: 2 }}>{p.title || "(no title)"}</div>
                      <code style={{ fontSize: 11, color: "#52525b" }}>{p.url?.replace(/^https?:\/\/[^/]+/, "")}</code>
                    </div>
                    {p.responseTime && <CWVChip metric="ttfb" value={p.responseTime} />}
                    {p.lcp          && <CWVChip metric="lcp"  value={p.lcp} />}
                    {p.cls != null  && <CWVChip metric="cls"  value={p.cls} />}
                    {p.pageSize && <div style={{ fontSize: 11, color: "#a1a1aa", textAlign: "center" }}><div style={{ fontWeight: 700 }}>{Math.round(p.pageSize/1024)}KB</div><div>size</div></div>}
                  </div>
                ))}
              </div>
              <div style={S.card}>
                <div style={S.sectionTitle}>Core Web Vitals Reference</div>
                <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 100px 100px 100px", gap: 12, marginBottom: 8 }}>
                  <span style={S.sectionTitle}>Metric</span><span style={S.sectionTitle}>What It Measures</span>
                  <span style={{ ...S.sectionTitle, color: "#4ade80", textAlign: "center" }}>Good</span>
                  <span style={{ ...S.sectionTitle, color: "#fbbf24", textAlign: "center" }}>Needs Work</span>
                  <span style={{ ...S.sectionTitle, color: "#f87171", textAlign: "center" }}>Poor</span>
                </div>
                {Object.entries(CWV_THRESHOLDS).map(([key, t]) => (
                  <div key={key} style={{ display: "grid", gridTemplateColumns: "80px 1fr 100px 100px 100px", gap: 12, padding: "10px 0", borderBottom: "1px solid #1f1f22", alignItems: "center" }}>
                    <span style={{ fontWeight: 800, color: "#e4e4e7" }}>{t.label}</span>
                    <span style={{ fontSize: 12, color: "#a1a1aa" }}>{t.description}</span>
                    <span style={{ textAlign: "center", fontSize: 13, color: "#4ade80", fontWeight: 700 }}>={t.good}{t.unit}</span>
                    <span style={{ textAlign: "center", fontSize: 13, color: "#fbbf24", fontWeight: 700 }}>={t.poor}{t.unit}</span>
                    <span style={{ textAlign: "center", fontSize: 13, color: "#f87171", fontWeight: 700 }}>&gt;{t.poor}{t.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCHEDULED CRAWLS */}
          {tab === "schedules" && (
            <div style={{ marginTop: 20 }}>
              <div style={S.card}>
                <div style={S.sectionTitle}>Create Scheduled Crawl</div>
                <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14, lineHeight: 1.6 }}>
                  Automated crawls keep your SEO health monitored continuously. Get notified when new issues appear or health scores drop.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Schedule Name *</label>
                    <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={newSched.name} onChange={e => setNewSched(p => ({ ...p, name: e.target.value }))} placeholder="Weekly Full Site Audit" />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Site URL *</label>
                    <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={newSched.url} onChange={e => setNewSched(p => ({ ...p, url: e.target.value }))} placeholder="https://mystore.myshopify.com" />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Frequency</label>
                    <select style={{ ...S.select, width: "100%" }} value={newSched.frequency} onChange={e => setNewSched(p => ({ ...p, frequency: e.target.value }))}>
                      {SCHEDULE_FREQS.map(f => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Notification Email</label>
                    <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={newSched.notifyEmail} onChange={e => setNewSched(p => ({ ...p, notifyEmail: e.target.value }))} placeholder="you@store.com" type="email" />
                  </div>
                </div>
                <button style={S.btn("primary")} onClick={saveSchedule} disabled={schedSaving || !newSched.name.trim() || !newSched.url.trim()}>
                  {schedSaving ? "Saving..." : "Create Schedule"}
                </button>
              </div>
              <div style={{ fontSize: 13, color: "#71717a", marginBottom: 12 }}>{schedules.length} schedule{schedules.length !== 1 ? "s" : ""} configured</div>
              {schedules.length === 0 ? (
                <EmptyState icon="Calendar" title="No scheduled crawls yet" description="Create a schedule above to automatically monitor SEO health. Daily, weekly or monthly — get notified when issues appear." />
              ) : schedules.map((s, i) => (
                <div key={s.id || i} style={S.card2}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#fafafa", marginBottom: 4 }}>{s.name}</div>
                      <code style={{ fontSize: 12, color: "#818cf8", display: "block", marginBottom: 6 }}>{s.url}</code>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ background: "#1e1b4b", color: "#818cf8", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{s.frequency}</span>
                        {s.notifyEmail && <span style={{ fontSize: 11, color: "#52525b" }}>{s.notifyEmail}</span>}
                        {s.createdAt   && <span style={{ fontSize: 11, color: "#52525b" }}>Created: {new Date(s.createdAt).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 12 }}>
                      <button style={S.btnSm("primary")} onClick={() => { setUrl(s.url); crawl(); }}>Run Now</button>
                      <button style={S.btnSm("danger")} onClick={() => deleteSchedule(s.id)} disabled={schedDeleting === s.id}>{schedDeleting === s.id ? "..." : "X"}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* COMPARE CRAWLS */}
          {tab === "compare" && (
            <div style={{ marginTop: 20 }}>
              <div style={S.card}>
                <div style={S.sectionTitle}>Compare Two Crawls</div>
                <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14, lineHeight: 1.6 }}>
                  Select two historical crawls to compare — see which issues were fixed, which newly appeared, and how health score changed.
                </p>
                {history.length < 2 ? (
                  <div style={{ background: "#3d2a0a", border: "1px solid #fbbf2430", borderRadius: 8, padding: "12px 16px", fontSize: 13, color: "#fbbf24" }}>
                    You need at least 2 crawls to compare. Run another crawl to enable comparison mode.
                  </div>
                ) : (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                      <div>
                        <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Crawl A (baseline)</label>
                        <select style={{ ...S.select, width: "100%" }} value={compareA} onChange={e => setCompareA(e.target.value)}>
                          <option value="">Select crawl...</option>
                          {history.map((h, i) => <option key={i} value={h.id || h.createdAt}>{new Date(h.createdAt).toLocaleDateString()} — {h.site}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Crawl B (after fixes)</label>
                        <select style={{ ...S.select, width: "100%" }} value={compareB} onChange={e => setCompareB(e.target.value)}>
                          <option value="">Select crawl...</option>
                          {history.map((h, i) => <option key={i} value={h.id || h.createdAt}>{new Date(h.createdAt).toLocaleDateString()} — {h.site}</option>)}
                        </select>
                      </div>
                    </div>
                    <button style={S.btn("primary")} onClick={runCompare} disabled={comparing || !compareA || !compareB}>
                      {comparing ? "Comparing..." : "Compare Crawls"}
                    </button>
                  </>
                )}
              </div>
              {compareResult && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 16 }}>
                    {[
                      { label: "Score Change",  value: compareResult.healthScoreChange != null ? `${compareResult.healthScoreChange > 0 ? "+" : ""}${compareResult.healthScoreChange}` : "—", color: (compareResult.healthScoreChange||0) >= 0 ? "#4ade80" : "#f87171" },
                      { label: "Fixed",          value: `+${compareResult.issuesFixed || 0}`,  color: "#4ade80" },
                      { label: "New Issues",     value: `-${compareResult.issuesAdded || 0}`,  color: "#f87171" },
                      { label: "Pages Added",    value: `+${compareResult.pagesAdded || 0}`,  color: "#818cf8" },
                    ].map(m => (
                      <div key={m.label} style={S.inset}>
                        <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{m.label}</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: m.color, marginTop: 2 }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {history.length > 0 && (
                <div style={S.card}>
                  <div style={S.sectionTitle}>Crawl History ({history.length} crawls)</div>
                  <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 56, marginBottom: 14 }}>
                    {history.slice(-16).map((h, i) => {
                      const score = h.healthScore || Math.max(0, 100 - ((h.high||0)*8) - ((h.medium||0)*3));
                      const col = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
                      return <div key={i} title={`${new Date(h.createdAt).toLocaleDateString()}: ${score}`} style={{ flex: 1, background: col, height: `${Math.max(6, score)}%`, borderRadius: "3px 3px 0 0", opacity: 0.8 }} />;
                    })}
                  </div>
                  {history.map((h, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>{h.site}</div>
                        <div style={{ fontSize: 11, color: "#52525b" }}>{h.createdAt ? new Date(h.createdAt).toLocaleString() : "—"}</div>
                      </div>
                      <span style={S.badge("high")}>{h.high||0}</span>
                      <span style={S.badge("medium")}>{h.medium||0}</span>
                      <button style={S.btnSm()} onClick={() => setCompareA(h.id || h.createdAt)}>A</button>
                      <button style={S.btnSm()} onClick={() => setCompareB(h.id || h.createdAt)}>B</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CRAWL GUIDE */}
          {tab === "guide" && (
            <div style={{ marginTop: 20 }}>
              <div style={S.card}>
                <div style={S.sectionTitle}>Technical SEO Priority Framework</div>
                {[
                  { priority: "P0 — Crawlability Blockers", sev: "high", items: [
                    { issue: "Noindex on live pages",       fix: "Remove noindex from all pages you want ranked. Check theme templates, app injections, and individual page settings. A single accidental noindex can deindex an entire category." },
                    { issue: "Blocked by robots.txt",      fix: "Ensure Disallow rules do not block CSS, JS, products, or collections. Test via Google Search Console robots.txt tester." },
                    { issue: "500 / 503 server errors",    fix: "5xx errors cause Googlebot to back off and reduce crawl frequency. Fix server issues immediately — they directly reduce crawl budget." },
                    { issue: "Redirect loops (A to B to A)", fix: "Redirect loops trap crawlers. Max 2-hop chains. Use a site audit to detect all chains and break the cycle." },
                  ]},
                  { priority: "P1 — Indexability Signals", sev: "high", items: [
                    { issue: "Missing or duplicate title tags", fix: "Title is the strongest on-page ranking signal. Max 60 chars. Include primary keyword early. Every page must have a unique, descriptive title." },
                    { issue: "Missing canonical tags",          fix: "Every page should self-canonicalise. Shopify adds duplicates via ?variant= — canonical must point to base /products/slug URL." },
                    { issue: "Missing meta descriptions",       fix: "Not a direct ranking factor but critical for CTR. 150-160 chars. Include a call to action. Never duplicate across pages." },
                    { issue: "404 broken internal links",       fix: "Broken internal links waste crawl budget and harm UX. Fix or 301-redirect each to the most relevant live page." },
                  ]},
                  { priority: "P2 — Content Quality", sev: "medium", items: [
                    { issue: "Missing H1 headings",        fix: "One H1 per page containing the primary keyword. H1 is separate from title tag — both matter independently for on-page SEO." },
                    { issue: "Thin content (under 300 words)", fix: "Add product descriptions, usage guides, FAQs, size charts. Shopify pages with 300+ words of original text rank significantly better." },
                    { issue: "Missing image alt text",     fix: "Alt text serves both accessibility and keyword relevance. Describe the image naturally, include product name. Never keyword-stuff." },
                    { issue: "Duplicate content",          fix: "Shopify creates /products/slug AND /collections/name/products/slug. Always canonicalise to /products/slug." },
                  ]},
                  { priority: "P3 — Enhanced Visibility", sev: "low", items: [
                    { issue: "Missing schema markup",      fix: "Product, BreadcrumbList and FAQPage schema increase CTR via rich snippets. Verify theme's Product JSON-LD and enhance with aggregateRating." },
                    { issue: "Slow response times",        fix: "Reduce app bloat, use a CDN, enable caching, convert images to WebP/AVIF. Each 100ms reduction measurably improves Core Web Vitals." },
                    { issue: "Orphaned pages",             fix: "Link orphaned pages from hub pages, nav menus, or related products. Pages with no inbound links are deprioritised in Googlebot's crawl schedule." },
                    { issue: "Wrong heading hierarchy",    fix: "H1 then H2 then H3. Never skip levels. Proper hierarchy helps Google understand content structure." },
                  ]},
                ].map(({ priority, sev, items }) => (
                  <div key={priority} style={{ marginBottom: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <span style={S.badge(sev)}>{sev}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#fafafa" }}>{priority}</span>
                    </div>
                    {items.map(({ issue, fix }) => (
                      <div key={issue} style={{ padding: "10px 0", borderBottom: "1px solid #1f1f22" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7", marginBottom: 3 }}>{issue}</div>
                        <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{fix}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div style={S.card}>
                <div style={S.sectionTitle}>Shopify-Specific SEO Issues</div>
                {[
                  { issue: "Duplicate product URLs",            fix: "Shopify creates /products/slug AND /collections/name/products/slug. Always canonical to /products/slug. Verify your theme does this by default." },
                  { issue: "?variant= parameterised URLs",      fix: "Ensure canonical ignores the variant parameter and points to the base product URL." },
                  { issue: "Paginated collection pages",        fix: "/collections/t-shirts?page=2 creates thin duplicate pages. Use canonical plus rel=next/prev." },
                  { issue: "Empty filtered collection pages",   fix: "Return 404 or noindex for collection pages filtered to 0 products." },
                  { issue: "Search result pages indexed",       fix: "Add noindex to all /search?q= pages — they create infinite URL spam." },
                  { issue: "Password-protected store",          fix: "Password protection blocks all Googlebot access. Verify your store is publicly accessible." },
                  { issue: "App-injected noindex tags",         fix: "Some apps inject noindex meta tags incorrectly. Audit every page type for unintended noindex tags." },
                  { issue: "Missing product schema",            fix: "Verify theme Product JSON-LD includes name, price, availability, image, description. Enhance with aggregateRating." },
                  { issue: "Blog pagination indexed",           fix: "/blogs/news?page=2 follows the same rules as collection pagination." },
                  { issue: "CDN images blocked",               fix: "Ensure Shopify CDN images are not blocked in robots.txt — image search drives significant traffic." },
                ].map(({ issue, fix }) => (
                  <div key={issue} style={S.row}>
                    <span style={{ color: "#4f46e5", flexShrink: 0, fontSize: 16 }}>S</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7", marginBottom: 2 }}>{issue}</div>
                      <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{fix}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={S.card}>
                <div style={S.sectionTitle}>Crawl Budget Optimisation</div>
                {[
                  { t: "Block low-value URLs in robots.txt",   d: "Disallow /search, /cart, /account, /checkout. These have no ranking value — each blocked URL = more budget for valuable pages." },
                  { t: "Fix all 404s and redirect chains",      d: "Googlebot re-crawls known URLs on schedule. 301-redirect 404s to relevant live pages. Max 2-hop redirect chains." },
                  { t: "Consolidate parameterised URLs",        d: "?sort=price, ?page=2, ?variant=123 create separate URLs. Canonical tags prevent infinite URL spaces from consuming budget." },
                  { t: "Submit accurate XML sitemaps",          d: "Shopify auto-generates /sitemap.xml. Submit to Google Search Console. Remove deleted products immediately." },
                  { t: "Improve server speed for higher budget",d: "Google gives faster sites more crawl budget. A site at 200ms gets crawled 5x more than one at 2s." },
                  { t: "Add internal links to deep pages",      d: "Pages without internal links are rarely re-crawled. Every product page should have 2+ internal links pointing to it." },
                ].map(({ t, d }) => (
                  <div key={t} style={S.row}>
                    <span style={{ color: "#22c55e", flexShrink: 0 }}>+</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div>
                      <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={S.card}>
                  <div style={S.sectionTitle}>Health Score Calculation</div>
                  {[
                    { label: "High Priority Issue",   penalty: "-8 pts each",  color: "#f87171", note: "404s, noindex, missing titles" },
                    { label: "Medium Priority Issue",  penalty: "-3 pts each",  color: "#fbbf24", note: "Missing meta, thin content, no H1" },
                    { label: "Low Priority Issue",     penalty: "-0.5 pts each",color: "#4ade80", note: "Missing alt text, schema gaps" },
                    { label: "Perfect Score",          penalty: "100 / 100",    color: "#4f46e5", note: "Zero issues detected" },
                  ].map(({ label, penalty, color, note }) => (
                    <div key={label} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" }}>
                      <span style={{ fontWeight: 800, color, fontSize: 13, minWidth: 90 }}>{penalty}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#e4e4e7" }}>{label}</div>
                        <div style={{ fontSize: 11, color: "#71717a" }}>{note}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={S.card}>
                  <div style={S.sectionTitle}>Crawl Frequency Guide</div>
                  {[
                    { type: "Fast-moving stores (new SKUs daily)",   freq: "Daily",      color: "#4ade80" },
                    { type: "Active stores (weekly new products)",    freq: "Weekly",     color: "#818cf8" },
                    { type: "Stable stores (occasional updates)",     freq: "Fortnightly",color: "#fbbf24" },
                    { type: "Static / minimal-change stores",         freq: "Monthly",    color: "#a1a1aa" },
                    { type: "After any major site changes",           freq: "Immediate",  color: "#f87171" },
                    { type: "After SEO fixes are applied",            freq: "Immediate",  color: "#f87171" },
                  ].map(({ type, freq, color }) => (
                    <div key={type} style={{ display: "flex", gap: 10, alignItems: "center", padding: "7px 0", borderBottom: "1px solid #1f1f22" }}>
                      <div style={{ flex: 1, fontSize: 12, color: "#a1a1aa" }}>{type}</div>
                      <span style={{ fontWeight: 700, color, fontSize: 12 }}>{freq}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
