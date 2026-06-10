import React, { useState, useCallback, useEffect, useRef } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, MozCard, EmptyState, ErrorBox, Spinner } from "../MozUI";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, minWidth: 220, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
  badge: (sev) => ({
    background: sev === "high" ? "#3f1315" : sev === "medium" ? "#3d2a0a" : sev === "low" ? "#0d2218" : sev === "good" ? "#052e16" : "#27272a",
    color: sev === "high" ? "#f87171" : sev === "medium" ? "#fbbf24" : sev === "low" ? "#4ade80" : sev === "good" ? "#4ade80" : "#a1a1aa",
    border: `1px solid ${sev === "high" ? "#f8717133" : sev === "medium" ? "#fbbf2433" : sev === "low" ? "#4ade8033" : "#27272a"}`,
    borderRadius: 5, padding: "2px 9px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5,
  }),
};

const SEV_COLORS = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "pages",    label: "Page Issues" },
  { id: "bulk",     label: "Bulk Fix" },
  { id: "history",  label: "History" },
  { id: "insights", label: "Insights" },
  { id: "export",   label: "Export" },
];

const ISSUE_CATEGORIES = [
  { id: "meta",     label: "Meta & Titles",   icon: "ðŸ“", types: ["missing-title", "title-too-long", "missing-meta-description", "duplicate-title"] },
  { id: "crawl",    label: "Crawlability",    icon: "ðŸ•·ï¸", types: ["404-error", "redirect-chain", "noindex", "blocked-robots", "broken-link"] },
  { id: "perf",     label: "Performance",     icon: "âš¡", types: ["slow-lcp", "large-image", "render-blocking", "no-compression"] },
  { id: "images",   label: "Images",          icon: "ðŸ–¼ï¸", types: ["missing-alt", "large-image", "wrong-format", "missing-width-height"] },
  { id: "schema",   label: "Schema",          icon: "ðŸ·ï¸", types: ["missing-schema", "invalid-schema", "missing-product-schema"] },
  { id: "links",    label: "Internal Links",  icon: "ðŸ”—", types: ["orphan-page", "broken-internal-link", "redirect-loop"] },
];

function HealthGauge({ score }) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  const label = score >= 80 ? "Healthy" : score >= 60 ? "Needs Work" : "Critical";
  return (
    <div style={{ textAlign: "center", padding: "10px 0" }}>
      <div style={{ position: "relative", display: "inline-block", width: 140, height: 80 }}>
        <svg width="140" height="80" viewBox="0 0 140 80">
          <path d="M 10 75 A 60 60 0 0 1 130 75" fill="none" stroke="#27272a" strokeWidth="12" strokeLinecap="round" />
          <path d="M 10 75 A 60 60 0 0 1 130 75" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={`${Math.round((score / 100) * 188)} 188`} />
        </svg>
        <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: 10, color: "#71717a", fontWeight: 600 }}>/ 100</div>
        </div>
      </div>
      <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700, color }}>{label}</div>
    </div>
  );
}

function IssueCard({ issue, pageUrl }) {
  const [fixing, setFixing] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [fixErr, setFixErr] = useState("");

  const handleGenerate = async () => {
    setFixing(true); setFixErr(""); setSuggestion("");
    try {
      const r = await apiFetchJSON("/api/seo-site-crawler/ai/fix", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issue, page: pageUrl }),
      });
      if (!r.ok) throw new Error(r.error || "Failed");
      setSuggestion(r.suggestion);
    } catch (e) { setFixErr(e.message); }
    setFixing(false);
  };

  return (
    <div style={{ background: S.badge(issue.severity).background, borderRadius: 8, padding: "10px 14px", border: `1px solid ${S.badge(issue.severity).border}`, marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={S.badge(issue.severity)}>{issue.severity}</span>
        <span style={{ fontWeight: 700, color: "#e4e4e7", fontSize: 13 }}>{issue.type}</span>
        <button onClick={handleGenerate} disabled={fixing} style={{ ...S.btn("primary"), marginLeft: "auto", fontSize: 11, padding: "4px 10px" }}>
          {fixing ? "â€¦" : "AI Fix"}
        </button>
      </div>
      <div style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.5 }}>{issue.detail}</div>
      {suggestion && (
        <div style={{ marginTop: 8, background: "#1e1b4b", borderRadius: 6, padding: "8px 12px", border: "1px solid #3730a3", fontSize: 13, color: "#c7d2fe", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
          {suggestion}
          <button onClick={() => navigator.clipboard?.writeText(suggestion)} style={{ display: "block", marginTop: 6, background: "transparent", border: "1px solid #52525b", borderRadius: 5, padding: "2px 10px", color: "#71717a", fontSize: 11, cursor: "pointer" }}>Copy</button>
        </div>
      )}
      {fixErr && <div style={{ color: "#f87171", fontSize: 12, marginTop: 6 }}>{fixErr}</div>}
    </div>
  );
}

function PageSection({ page, keywords }) {
  const [open, setOpen] = useState(false);
  const issues = page.issues || [];
  const highs = issues.filter(i => i.severity === "high").length;
  const meds = issues.filter(i => i.severity === "medium").length;
  const lows = issues.filter(i => i.severity === "low").length;

  return (
    <div style={{ background: "#09090b", borderRadius: 10, border: "1px solid #27272a", marginBottom: 10 }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", background: "none", border: "none", color: "#e4e4e7", padding: "12px 16px", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{page.title || page.url}</div>
          <div style={{ fontSize: 11, color: "#52525b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{page.url}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 12 }}>
          {highs > 0 && <span style={{ color: "#f87171", fontWeight: 700, fontSize: 12 }}>{highs} High</span>}
          {meds > 0 && <span style={{ color: "#fbbf24", fontWeight: 700, fontSize: 12 }}>{meds} Med</span>}
          {lows > 0 && <span style={{ color: "#4ade80", fontWeight: 700, fontSize: 12 }}>{lows} Low</span>}
          {issues.length === 0 && <span style={{ color: "#4ade80", fontSize: 11 }}>âœ“ Clean</span>}
          <span style={{ color: "#71717a" }}>{open ? "â–²" : "â–¼"}</span>
        </div>
      </button>
      {open && (
        <div style={{ padding: "0 16px 16px" }}>
          {keywords?.length > 0 && page.keywordPresence && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {page.keywordPresence.map(kp => (
                <span key={kp.keyword} style={{ background: "#09090b", borderRadius: 20, padding: "3px 10px", fontSize: 11, border: "1px solid #27272a", color: "#a1a1aa" }}>
                  {kp.keyword}
                  {" "}<span style={{ color: kp.inTitle ? "#4ade80" : "#f87171" }}>T</span>
                  {" "}<span style={{ color: kp.inDesc ? "#4ade80" : "#f87171" }}>D</span>
                </span>
              ))}
            </div>
          )}
          {issues.length === 0 ? (
            <div style={{ color: "#4ade80", fontWeight: 600, fontSize: 13 }}>âœ“ No issues found</div>
          ) : (
            issues.map((issue, i) => <IssueCard key={i} issue={issue} pageUrl={page.url} />)
          )}
        </div>
      )}
    </div>
  );
}

export default function SEOSiteCrawler() {
  const [url, setUrl]           = useState("");
  const [keywords, setKeywords] = useState([]);
  const [kwInput, setKwInput]   = useState("");
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [tab, setTab]           = useState("overview");
  const [history, setHistory]   = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [bulkType, setBulkType] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [catFilter, setCatFilter] = useState("all");
  const [sevFilter, setSevFilter] = useState("all");
  const fileRef = useRef();

  const loadHistory = useCallback(async () => {
    try {
      const r = await apiFetchJSON("/api/seo-site-crawler/history");
      if (r.ok) setHistory(r.history || []);
    } catch {}
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      const r = await apiFetchJSON("/api/seo-site-crawler/analytics");
      if (r.ok) setAnalytics(r);
    } catch {}
  }, []);

  useEffect(() => { loadHistory(); loadAnalytics(); }, [loadHistory, loadAnalytics]);

  const addKeyword = () => {
    const trimmed = kwInput.trim().replace(/,$/, "");
    if (!trimmed) return;
    const newKws = trimmed.split(/[,\n]+/).map(k => k.trim()).filter(k => k && !keywords.includes(k.toLowerCase()));
    if (newKws.length > 0) setKeywords(p => [...p, ...newKws.map(k => k.toLowerCase())]);
    setKwInput("");
  };

  const crawl = async () => {
    if (!url.trim()) return;
    setLoading(true); setError(""); setResult(null); setTab("overview");
    try {
      const r = await apiFetchJSON("/api/seo-site-crawler/ai/crawl", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site: url.trim(), keywords }),
      });
      if (!r.ok) throw new Error(r.error || "Crawl failed");
      setResult(r.result);
      loadHistory(); loadAnalytics();
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const runBulkFix = async () => {
    if (!bulkType) return;
    setBulkLoading(true); setBulkResult(null);
    try {
      const r = await apiFetchJSON("/api/seo-site-crawler/bulk-fix", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueType: bulkType, pages: (result?.pages || []).map(p => p.url) }),
      });
      setBulkResult(r);
    } catch (e) { setBulkResult({ ok: false, error: e.message }); }
    setBulkLoading(false);
  };

  const applyFixes = async () => {
    if (!bulkResult?.fixes) return;
    setBulkLoading(true);
    try {
      const r = await apiFetchJSON("/api/seo-site-crawler/apply-fixes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fixes: bulkResult.fixes }),
      });
      setBulkResult(r);
    } catch (e) { setBulkResult({ ok: false, error: e.message }); }
    setBulkLoading(false);
  };

  const exportReport = (format) => {
    const pages = result?.pages || [];
    let content, mime, ext;
    if (format === "json") {
      content = JSON.stringify({ url, crawledAt: new Date().toISOString(), summary: { high: result?.high, medium: result?.medium, low: result?.low, pagesScanned: result?.pagesScanned }, pages }, null, 2);
      mime = "application/json"; ext = "json";
    } else {
      const rows = [["Page URL", "Issue Type", "Severity", "Detail"]];
      pages.forEach(p => (p.issues || []).forEach(i => rows.push([p.url, i.type, i.severity, i.detail])));
      content = rows.map(r => r.map(c => `"${String(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
      mime = "text/csv"; ext = "csv";
    }
    const blob = new Blob([content], { type: mime });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `crawl-report-${new Date().toISOString().split("T")[0]}.${ext}`; a.click();
  };

  // Derived
  const pages = result?.pages || [];
  const healthScore = result ? Math.max(0, Math.round(100 - ((result.high || 0) * 10) - ((result.medium || 0) * 4) - ((result.low || 0) * 1))) : 0;

  const allIssues = pages.flatMap(p => (p.issues || []).map(i => ({ ...i, pageUrl: p.url, pageTitle: p.title })));
  const filteredIssues = allIssues
    .filter(i => sevFilter === "all" || i.severity === sevFilter)
    .filter(i => {
      if (catFilter === "all") return true;
      const cat = ISSUE_CATEGORIES.find(c => c.id === catFilter);
      return cat?.types.some(t => (i.type || "").toLowerCase().includes(t.split("-").join(""))) ?? true;
    });

  const issueTypeGroups = allIssues.reduce((acc, i) => {
    acc[i.type] = (acc[i.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>SEO Site Crawler</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>Full-site technical SEO audit: crawl every page, detect issues by severity, get AI fix suggestions, bulk-fix by type and track improvements over time. Screaming Frog depth for Shopify.</p>
      </div>

      {/* Crawl bar */}
      <div style={S.card}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
          <input style={S.input} value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && crawl()} placeholder="Enter site URL to crawl, e.g. mystore.myshopify.com" />
          <button style={S.btn("primary")} onClick={crawl} disabled={loading}>{loading ? "Crawlingâ€¦" : "Crawl & Analyse"}</button>
        </div>
        {/* Keywords */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
          {keywords.map(kw => (
            <span key={kw} style={{ background: "#27272a", color: "#818cf8", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              {kw} <button onClick={() => setKeywords(p => p.filter(k => k !== kw))} style={{ background: "none", border: "none", color: "#71717a", cursor: "pointer", padding: 0, fontSize: 13 }}>Ã—</button>
            </span>
          ))}
          <input value={kwInput} onChange={e => setKwInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addKeyword(); } }} onBlur={addKeyword}
            style={{ background: "none", border: "none", color: "#fafafa", fontSize: 13, outline: "none", minWidth: 180, padding: "3px 0" }}
            placeholder="Add focus keywords (Enter to add)â€¦" />
        </div>
      </div>

      <ErrorBox message={error} />

      {loading && (
        <div style={{ ...S.card, textAlign: "center", padding: 48 }}>
          <Spinner size={40} />
          <div style={{ color: "#71717a", marginTop: 16, fontSize: 14 }}>Crawling <strong style={{ color: "#fafafa" }}>{url}</strong>â€¦</div>
          <div style={{ color: "#52525b", fontSize: 12, marginTop: 8 }}>Analysing page titles, meta, headings, images, schema, internal links, Core Web Vitals signalsâ€¦</div>
        </div>
      )}

      {!loading && !result && !error && (
        <EmptyState icon="ðŸ•·ï¸" title="Enter a site URL to crawl" description="Analyses titles, meta descriptions, headings, images, schema, internal links and more. Generates AI fix suggestions for every issue found." />
      )}

      {result && !loading && (
        <>
          {/* Health score bar */}
          <div style={{ ...S.card, display: "flex", gap: 32, flexWrap: "wrap", alignItems: "center", marginBottom: 20 }}>
            <HealthGauge score={healthScore} />
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 12 }}>
              {[
                { label: "Pages Scanned",   value: result.pagesScanned ?? pages.length, color: "#4f46e5" },
                { label: "Total Issues",    value: result.totalIssues ?? allIssues.length, color: "#f87171" },
                { label: "High Priority",   value: result.high ?? 0,   color: "#ef4444" },
                { label: "Medium",          value: result.medium ?? 0, color: "#f59e0b" },
                { label: "Low",             value: result.low ?? 0,    color: "#22c55e" },
                { label: "Clean Pages",     value: pages.filter(p => (p.issues || []).length === 0).length, color: "#818cf8" },
              ].map(m => (
                <div key={m.label} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ fontSize: 10, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: m.color, lineHeight: 1 }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>

          <MozTabs tabs={TABS} active={tab} onChange={setTab} />

          {/* OVERVIEW */}
          {tab === "overview" && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
                {/* Issue categories */}
                <div style={S.card}>
                  <div style={S.sectionTitle}>Issue Categories</div>
                  {ISSUE_CATEGORIES.map(cat => {
                    const catIssues = allIssues.filter(i => cat.types.some(t => (i.type || "").toLowerCase().includes(t.replace("-", "").replace("-", ""))));
                    const h = catIssues.filter(i => i.severity === "high").length;
                    const m = catIssues.filter(i => i.severity === "medium").length;
                    return (
                      <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22", cursor: "pointer" }} onClick={() => { setCatFilter(cat.id); setTab("pages"); }}>
                        <span style={{ fontSize: 18 }}>{cat.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>{cat.label}</div>
                          <div style={{ fontSize: 11, color: "#52525b" }}>{catIssues.length} issues</div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          {h > 0 && <span style={S.badge("high")}>{h}</span>}
                          {m > 0 && <span style={S.badge("medium")}>{m}</span>}
                          {catIssues.length === 0 && <span style={S.badge("good")}>âœ“</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Top issues */}
                <div style={S.card}>
                  <div style={S.sectionTitle}>Most Common Issues</div>
                  {Object.entries(issueTypeGroups).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([type, count]) => {
                    const sev = (allIssues.find(i => i.type === type) || {}).severity || "low";
                    return (
                      <div key={type} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid #1f1f22" }}>
                        <span style={S.badge(sev)}>{sev}</span>
                        <span style={{ flex: 1, fontSize: 13, color: "#e4e4e7" }}>{type}</span>
                        <span style={{ fontWeight: 700, color: "#4f46e5", fontSize: 13 }}>{count}Ã—</span>
                      </div>
                    );
                  })}
                  {Object.keys(issueTypeGroups).length === 0 && <div style={{ color: "#4ade80", fontSize: 13 }}>âœ“ No issues found!</div>}
                </div>

                {/* Recommendations */}
                <div style={S.card}>
                  <div style={S.sectionTitle}>Priority Actions</div>
                  {(result.high || 0) > 0 && (
                    <div style={{ ...S.row, flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                      <span style={S.badge("high")}>URGENT</span>
                      <div style={{ fontSize: 13, color: "#e4e4e7" }}>Fix {result.high} high-priority issues immediately â€” these directly impact crawlability and rankings.</div>
                      <button style={{ ...S.btn("danger"), fontSize: 11, padding: "5px 10px", marginTop: 4 }} onClick={() => { setSevFilter("high"); setTab("pages"); }}>View High Issues â†’</button>
                    </div>
                  )}
                  {(result.medium || 0) > 0 && (
                    <div style={{ ...S.row, flexDirection: "column", alignItems: "flex-start", gap: 4, marginTop: 10 }}>
                      <span style={S.badge("medium")}>MEDIUM</span>
                      <div style={{ fontSize: 13, color: "#e4e4e7" }}>{result.medium} medium-priority issues. Address after fixing all high issues.</div>
                    </div>
                  )}
                  {healthScore === 100 && <div style={{ color: "#4ade80", fontSize: 13, fontWeight: 700 }}>ðŸŽ‰ No issues found! Site is technically healthy.</div>}
                </div>
              </div>
            </div>
          )}

          {/* PAGE ISSUES */}
          {tab === "pages" && (
            <div style={{ marginTop: 20 }}>
              {/* Filters */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                <select style={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", fontSize: 12, padding: "7px 12px" }} value={sevFilter} onChange={e => setSevFilter(e.target.value)}>
                  <option value="all">All Severities</option>
                  <option value="high">High Only</option>
                  <option value="medium">Medium Only</option>
                  <option value="low">Low Only</option>
                </select>
                <select style={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", fontSize: 12, padding: "7px 12px" }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                  <option value="all">All Categories</option>
                  {ISSUE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </select>
                <div style={{ fontSize: 12, color: "#52525b", alignSelf: "center" }}>{pages.length} pages Â· {allIssues.length} issues</div>
                <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px", marginLeft: "auto" }} onClick={() => { setSevFilter("all"); setCatFilter("all"); }}>Clear Filters</button>
              </div>
              {(catFilter === "all" && sevFilter === "all") ? (
                pages.map((p, i) => <PageSection key={i} page={p} keywords={keywords} />)
              ) : (
                // Show flat issue list for filtered view
                filteredIssues.length > 0 ? filteredIssues.map((issue, i) => (
                  <div key={i} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 16px", marginBottom: 8 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                      <span style={S.badge(issue.severity)}>{issue.severity}</span>
                      <span style={{ fontWeight: 700, fontSize: 13, color: "#e4e4e7" }}>{issue.type}</span>
                      <span style={{ fontSize: 11, color: "#52525b", marginLeft: "auto" }}>{issue.pageUrl}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#a1a1aa" }}>{issue.detail}</div>
                  </div>
                )) : <EmptyState icon="âœ“" title="No issues match the selected filters" description="Try clearing your filters." />
              )}
            </div>
          )}

          {/* BULK FIX */}
          {tab === "bulk" && (
            <div style={{ marginTop: 20 }}>
              <div style={S.card}>
                <div style={S.sectionTitle}>Bulk Issue Fixer</div>
                <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14, lineHeight: 1.6 }}>Fix all instances of a specific issue type across your entire site in one click. Ideal for fixing missing alt text, short meta descriptions, or missing schema across hundreds of product pages.</p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <select style={{ ...S.input, flex: 2 }} value={bulkType} onChange={e => setBulkType(e.target.value)}>
                    <option value="">Select issue type to bulk fixâ€¦</option>
                    {Object.keys(issueTypeGroups).map(type => (
                      <option key={type} value={type}>{type} ({issueTypeGroups[type]} occurrences)</option>
                    ))}
                  </select>
                  <button style={S.btn("primary")} onClick={runBulkFix} disabled={bulkLoading || !bulkType}>{bulkLoading ? "Processingâ€¦" : "Generate Bulk Fixes"}</button>
                </div>
              </div>
              {bulkLoading && <div style={{ textAlign: "center", padding: 30 }}><Spinner /></div>}
              {bulkResult && (
                <div style={S.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={S.sectionTitle}>{bulkResult.ok ? `Generated ${(bulkResult.fixes || []).length} fixes` : "Error"}</div>
                    {bulkResult.ok && bulkResult.fixes && (
                      <button style={S.btn("green")} onClick={applyFixes} disabled={bulkLoading}>Apply All Fixes to Shopify</button>
                    )}
                  </div>
                  {bulkResult.ok ? (
                    (bulkResult.fixes || []).map((fix, i) => (
                      <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid #1f1f22" }}>
                        <div style={{ fontSize: 12, color: "#52525b", marginBottom: 4 }}>{fix.pageUrl}</div>
                        <div style={{ fontSize: 13, color: "#e4e4e7" }}>{fix.suggestion || fix.fix}</div>
                      </div>
                    ))
                  ) : (
                    <ErrorBox message={bulkResult.error || "Bulk fix failed"} />
                  )}
                  {bulkResult.message && <div style={{ marginTop: 10, padding: "8px 12px", background: "#052e16", border: "1px solid #166534", borderRadius: 8, fontSize: 13, color: "#4ade80" }}>{bulkResult.message}</div>}
                </div>
              )}
              {!bulkResult && !bulkLoading && (
                <div style={S.card}>
                  <div style={S.sectionTitle}>What You Can Bulk Fix</div>
                  {[
                    { t: "Missing alt text on images", d: "AI generates descriptive, keyword-rich alt text for every image missing it â€” then applies via Shopify API." },
                    { t: "Short or missing meta descriptions", d: "AI writes optimised meta descriptions (150-160 chars) for every page missing one." },
                    { t: "Missing product schema", d: "Auto-generates and injects Product JSON-LD schema for every product page lacking structured data." },
                    { t: "Duplicate title tags", d: "AI suggests unique, keyword-rich title alternatives for all pages with duplicate titles." },
                    { t: "Missing heading hierarchy", d: "AI analyses and suggests proper H1/H2/H3 structure for pages with heading issues." },
                  ].map(({ t, d }) => (
                    <div key={t} style={S.row}>
                      <span style={{ color: "#4f46e5", fontWeight: 700, fontSize: 16 }}>âš¡</span>
                      <div><div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a" }}>{d}</div></div>
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={S.sectionTitle}>Crawl History ({history.length} crawls)</div>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => exportReport("json")}>Export History</button>
                </div>
                {history.length === 0 ? (
                  <EmptyState icon="ðŸ“Š" title="No crawl history yet" description="Run a crawl to start tracking your site's SEO health over time." />
                ) : (
                  <>
                    {/* Trend chart */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={S.sectionTitle}>Health Score Trend</div>
                      <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 60 }}>
                        {history.slice(-12).map((h, i) => {
                          const score = h.healthScore || Math.max(0, 100 - ((h.high || 0) * 10) - ((h.medium || 0) * 4));
                          const col = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
                          return (
                            <div key={i} title={`${new Date(h.crawledAt || h.createdAt).toLocaleDateString()}: ${score}`} style={{ flex: 1, background: col, height: `${score}%`, borderRadius: "3px 3px 0 0", minHeight: 4, opacity: 0.85 }} />
                          );
                        })}
                      </div>
                    </div>
                    {history.map((h, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: "#e4e4e7", fontWeight: 600 }}>{h.site || url}</div>
                          <div style={{ fontSize: 11, color: "#52525b" }}>{h.createdAt ? new Date(h.createdAt).toLocaleString() : "â€”"}</div>
                        </div>
                        <span style={S.badge("high")}>{h.high || 0} High</span>
                        <span style={S.badge("medium")}>{h.medium || 0} Med</span>
                        <span style={{ fontSize: 12, color: "#4f46e5", fontWeight: 700 }}>{(h.pagesScanned || 0)} pages</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {/* INSIGHTS */}
          {tab === "insights" && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                <div style={S.card}>
                  <div style={S.sectionTitle}>Issue Severity Distribution</div>
                  {[
                    { label: "High", value: result.high || 0, color: "#ef4444", total: allIssues.length },
                    { label: "Medium", value: result.medium || 0, color: "#f59e0b", total: allIssues.length },
                    { label: "Low", value: result.low || 0, color: "#22c55e", total: allIssues.length },
                  ].map(({ label, value, color, total }) => {
                    const pct = total ? Math.round((value / total) * 100) : 0;
                    return (
                      <div key={label} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: "#a1a1aa" }}>{label}</span>
                          <span style={{ color, fontWeight: 700 }}>{value} ({pct}%)</span>
                        </div>
                        <div style={{ background: "#27272a", borderRadius: 4, height: 8 }}>
                          <div style={{ width: `${pct}%`, background: color, height: "100%", borderRadius: 4 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={S.card}>
                  <div style={S.sectionTitle}>Technical SEO Health Benchmarks</div>
                  {[
                    { label: "Health Score", value: healthScore, benchmark: 80, suffix: "/100" },
                    { label: "Clean Pages %", value: pages.length ? Math.round((pages.filter(p => !(p.issues || []).length).length / pages.length) * 100) : 0, benchmark: 70, suffix: "%" },
                    { label: "Avg Issues/Page", value: pages.length ? (allIssues.length / pages.length).toFixed(1) : 0, benchmark: 3, suffix: "", invertBenchmark: true },
                  ].map(({ label, value, benchmark, suffix, invertBenchmark }) => {
                    const good = invertBenchmark ? value <= benchmark : value >= benchmark;
                    return (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1f1f22" }}>
                        <span style={{ fontSize: 13, color: "#a1a1aa" }}>{label}</span>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: 16, fontWeight: 800, color: good ? "#22c55e" : "#f87171" }}>{value}{suffix}</span>
                          <div style={{ fontSize: 10, color: "#52525b" }}>benchmark: {invertBenchmark ? "â‰¤" : "â‰¥"}{benchmark}{suffix}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={S.card}>
                  <div style={S.sectionTitle}>SEO Audit Checklist</div>
                  {[
                    { t: "All pages have unique title tags", pass: !allIssues.find(i => i.type?.includes("title")) },
                    { t: "All pages have meta descriptions", pass: !allIssues.find(i => i.type?.includes("meta")) },
                    { t: "No 404 / broken links", pass: !allIssues.find(i => i.type?.includes("404") || i.type?.includes("broken")) },
                    { t: "All images have alt text", pass: !allIssues.find(i => i.type?.includes("alt")) },
                    { t: "Schema markup present", pass: !allIssues.find(i => i.type?.includes("schema")) },
                    { t: "No noindex on live pages", pass: !allIssues.find(i => i.type?.includes("noindex")) },
                    { t: "No redirect chains", pass: !allIssues.find(i => i.type?.includes("redirect")) },
                  ].map(({ t, pass }) => (
                    <div key={t} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 0", borderBottom: "1px solid #1f1f22" }}>
                      <span style={{ color: pass ? "#4ade80" : "#f87171", fontSize: 14 }}>{pass ? "âœ“" : "âœ—"}</span>
                      <span style={{ fontSize: 13, color: pass ? "#e4e4e7" : "#a1a1aa" }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* EXPORT */}
          {tab === "export" && (
            <div style={{ marginTop: 20 }}>
              <div style={S.card}>
                <div style={S.sectionTitle}>Export Crawl Report</div>
                <p style={{ fontSize: 13, color: "#71717a", marginBottom: 16, lineHeight: 1.6 }}>Download the full crawl report in JSON or CSV format. Share with your development team or import into your favourite project management tool.</p>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button style={S.btn("primary")} onClick={() => exportReport("json")}>Download JSON Report</button>
                  <button style={S.btn()} onClick={() => exportReport("csv")}>Download CSV Report</button>
                </div>
              </div>
              <div style={S.card}>
                <div style={S.sectionTitle}>Report Summary</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
                  {[
                    { l: "Pages Crawled", v: result.pagesScanned ?? pages.length },
                    { l: "Total Issues", v: allIssues.length },
                    { l: "High Priority", v: result.high ?? 0 },
                    { l: "Medium Priority", v: result.medium ?? 0 },
                    { l: "Low Priority", v: result.low ?? 0 },
                    { l: "Health Score", v: `${healthScore}/100` },
                    { l: "Crawled Site", v: url },
                    { l: "Crawl Date", v: new Date().toLocaleDateString() },
                  ].map(({ l, v }) => (
                    <div key={l} style={{ background: "#09090b", borderRadius: 8, padding: "10px 12px", border: "1px solid #27272a" }}>
                      <div style={{ fontSize: 11, color: "#71717a" }}>{l}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7", marginTop: 2 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
