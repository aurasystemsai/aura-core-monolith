import React, { useState, useRef, useCallback, useEffect } from "react";
import { apiFetch } from "../../api";
import BackButton from "./BackButton";

const API = "/api/blog-seo";

/* ── Dark-theme inline styles ──────────────────────────────────────────── */
const S = {
  page: { minHeight: "100vh", background: "#09090b", color: "#fafafa", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", padding: "0 0 64px" },
  topBar: { display: "flex", alignItems: "center", gap: 12, padding: "18px 32px 0", flexWrap: "wrap" },
  title: { fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" },
  badge: { fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: "#4f46e5", color: "#fff", marginLeft: 8 },
  body: { maxWidth: 1100, margin: "0 auto", padding: "0 24px" },
  tabs: { display: "flex", gap: 6, padding: "18px 0 12px", borderBottom: "1px solid #27272a", flexWrap: "wrap" },
  tab: (a) => ({ padding: "7px 18px", borderRadius: 8, fontSize: 13, fontWeight: a ? 600 : 500, cursor: "pointer", background: a ? "#4f46e5" : "#18181b", color: a ? "#fff" : "#a1a1aa", border: a ? "1px solid #4f46e5" : "1px solid #27272a", transition: "all .15s" }),
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 20, marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 },
  row: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  input: { flex: 1, minWidth: 220, padding: "10px 14px", borderRadius: 8, border: "1px solid #3f3f46", background: "#09090b", color: "#fafafa", fontSize: 14, outline: "none" },
  textarea: { width: "100%", minHeight: 90, padding: "10px 14px", borderRadius: 8, border: "1px solid #3f3f46", background: "#09090b", color: "#fafafa", fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit" },
  btn: (v) => ({ padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", transition: "all .15s", ...(v === "primary" ? { background: "#4f46e5", color: "#fff" } : v === "danger" ? { background: "#7f1d1d", color: "#fca5a5" } : v === "success" ? { background: "#14532d", color: "#86efac" } : { background: "#27272a", color: "#d4d4d8" }) }),
  scoreRing: (s) => ({ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: "50%", fontSize: 22, fontWeight: 800, border: `3px solid ${s >= 75 ? "#22c55e" : s >= 50 ? "#eab308" : "#ef4444"}`, color: s >= 75 ? "#22c55e" : s >= 50 ? "#eab308" : "#ef4444" }),
  grade: (g) => ({ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 8, fontSize: 18, fontWeight: 800, marginLeft: 12, background: g === "A" ? "#14532d" : g === "B" ? "#422006" : g === "C" ? "#713f12" : "#7f1d1d", color: g === "A" ? "#86efac" : g === "B" ? "#fbbf24" : g === "C" ? "#fbbf24" : "#fca5a5" }),
  pill: (sev) => ({ display: "inline-block", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 999, marginRight: 6, background: sev === "high" ? "#7f1d1d" : sev === "medium" ? "#713f12" : "#1e3a5f", color: sev === "high" ? "#fca5a5" : sev === "medium" ? "#fbbf24" : "#93c5fd" }),
  metaRow: { display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 10 },
  metaLabel: { fontSize: 12, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" },
  metaVal: { fontSize: 14, color: "#d4d4d8", marginTop: 2 },
  issueRow: { padding: "10px 14px", borderBottom: "1px solid #27272a", display: "flex", alignItems: "flex-start", gap: 10 },
  catBar: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 },
  catCard: (s) => ({ flex: "1 1 140px", background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 16px", textAlign: "center", borderTop: `3px solid ${s >= 75 ? "#22c55e" : s >= 50 ? "#eab308" : "#ef4444"}` }),
  catScore: (s) => ({ fontSize: 26, fontWeight: 800, color: s >= 75 ? "#22c55e" : s >= 50 ? "#eab308" : "#ef4444" }),
  catLabel: { fontSize: 11, fontWeight: 600, color: "#a1a1aa", textTransform: "uppercase", marginTop: 2 },
  empty: { textAlign: "center", padding: "48px 20px", color: "#71717a" },
  spinner: { display: "inline-block", width: 18, height: 18, border: "2px solid #3f3f46", borderTop: "2px solid #4f46e5", borderRadius: "50%", animation: "spin .7s linear infinite" },
  err: { background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 10, padding: "14px 18px", color: "#fca5a5", fontSize: 13, marginBottom: 12 },
  chatBubble: (isUser) => ({ maxWidth: "82%", padding: "10px 16px", borderRadius: 14, fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap", alignSelf: isUser ? "flex-end" : "flex-start", background: isUser ? "#4f46e5" : "#27272a", color: "#fafafa", marginBottom: 8 }),
  link: { color: "#818cf8", textDecoration: "none", cursor: "pointer", fontSize: 13 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { textAlign: "left", padding: "8px 10px", borderBottom: "1px solid #27272a", color: "#71717a", fontWeight: 600, fontSize: 11, textTransform: "uppercase" },
  td: { padding: "8px 10px", borderBottom: "1px solid #1e1e22", color: "#d4d4d8" },
  fixPanel: { background: "#1c1917", border: "1px solid #3f3f46", borderRadius: 10, padding: 16, marginTop: 10 },
  fixCode: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: 12, fontSize: 12, fontFamily: "'Fira Code',monospace", color: "#86efac", whiteSpace: "pre-wrap", overflowX: "auto", maxHeight: 220 },
  bulkRow: { display: "flex", gap: 8, alignItems: "center", padding: "6px 0", borderBottom: "1px solid #1e1e22" },
  section: { marginBottom: 20 },
  heading: { fontSize: 13, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 10 },
};

const TABS = ["Analyzer", "Keywords", "Content Brief", "Bulk Scan", "AI Assistant", "History"];
const FILTER_CATS = ["all", "content", "meta", "technical", "keywords", "structure"];
const FILTER_SEVS = ["all", "high", "medium", "low"];

export default function BlogSEO() {
  const [tab, setTab] = useState("Analyzer");

  /* ── Analyzer state ── */
  const [url, setUrl] = useState("");
  const [kwInput, setKwInput] = useState("");
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanErr, setScanErr] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [filterSev, setFilterSev] = useState("all");
  const [expandedIssue, setExpandedIssue] = useState(null);
  const [fixLoading, setFixLoading] = useState(null);
  const [fixes, setFixes] = useState({});
  const [rewriteField, setRewriteField] = useState(null);
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [rewriteResult, setRewriteResult] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [showHeadings, setShowHeadings] = useState(false);
  const [showLinks, setShowLinks] = useState(false);
  const [showImages, setShowImages] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  const [showReadability, setShowReadability] = useState(false);
  const [showFreshness, setShowFreshness] = useState(false);
  const [showEeat, setShowEeat] = useState(false);
  const [showSnippets, setShowSnippets] = useState(false);
  const [schemaGenLoading, setSchemaGenLoading] = useState(false);
  const [generatedSchema, setGeneratedSchema] = useState(null);
  const [schemaAuthorName, setSchemaAuthorName] = useState("");
  const [schemaPublisherName, setSchemaPublisherName] = useState("");
  const [showSerp, setShowSerp] = useState(true);
  const [serpDevice, setSerpDevice] = useState("desktop");
  const [showBrokenLinks, setShowBrokenLinks] = useState(false);
  const [brokenLinksResult, setBrokenLinksResult] = useState(null);
  const [brokenLinksLoading, setBrokenLinksLoading] = useState(false);
  const [brokenLinksErr, setBrokenLinksErr] = useState("");
  const [faqSchemaResult, setFaqSchemaResult] = useState(null);
  const [faqSchemaLoading, setFaqSchemaLoading] = useState(false);
  const [lsiResult, setLsiResult] = useState(null);
  const [lsiLoading, setLsiLoading] = useState(false);
  const [lsiErr, setLsiErr] = useState("");

  /* ── Keywords state ── */
  const [seedKw, setSeedKw] = useState("");
  const [kwNiche, setKwNiche] = useState("");
  const [kwResearch, setKwResearch] = useState(null);
  const [kwLoading, setKwLoading] = useState(false);
  const [kwErr, setKwErr] = useState("");

  /* ── Content Brief state ── */
  const [briefTopic, setBriefTopic] = useState("");
  const [briefPrimary, setBriefPrimary] = useState("");
  const [briefSecondary, setBriefSecondary] = useState("");
  const [briefResult, setBriefResult] = useState(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefErr, setBriefErr] = useState("");

  /* ── Bulk Scan state ── */
  const [bulkUrls, setBulkUrls] = useState("");
  const [bulkKw, setBulkKw] = useState("");
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkErr, setBulkErr] = useState("");

  /* ── AI Chat state ── */
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatRef = useRef(null);

  /* ── History state ── */
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  /* ── LLM Score state ── */
  const [llmScore, setLlmScore] = useState(null);
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmErr, setLlmErr] = useState("");

  /* ── Technical Audit state ── */
  const [techAudit, setTechAudit] = useState(null);
  const [techAuditLoading, setTechAuditLoading] = useState(false);
  const [techAuditErr, setTechAuditErr] = useState("");

  /* ── Title CTR Signals state ── */
  const [ctrSignals, setCtrSignals] = useState(null);
  const [ctrLoading, setCtrLoading] = useState(false);

  /* ── Article Schema Validator state ── */
  const [schemaValid, setSchemaValid] = useState(null);
  const [schemaValidLoading, setSchemaValidLoading] = useState(false);
  const [schemaValidErr, setSchemaValidErr] = useState("");

  /* ── Advanced Readability state ── */
  const [advReadability, setAdvReadability] = useState(null);
  const [advReadLoading, setAdvReadLoading] = useState(false);

  /* ── Internal Link Suggestions state ── */
  const [intLinks, setIntLinks] = useState(null);
  const [intLinksLoading, setIntLinksLoading] = useState(false);
  const [intLinksErr, setIntLinksErr] = useState("");

  /* ── NEW FEATURE STATES ─────────────────────────────────────────────── */
  const [cwvResult, setCwvResult] = useState(null);
  const [cwvLoading, setCwvLoading] = useState(false);
  const [cwvErr, setCwvErr] = useState("");

  const [crawlerResult, setCrawlerResult] = useState(null);
  const [crawlerLoading, setCrawlerLoading] = useState(false);
  const [crawlerErr, setCrawlerErr] = useState("");

  const [titleH1Result, setTitleH1Result] = useState(null);
  const [titleH1Loading, setTitleH1Loading] = useState(false);

  const [headingHierResult, setHeadingHierResult] = useState(null);
  const [headingHierLoading, setHeadingHierLoading] = useState(false);

  const [imageSeoResult, setImageSeoResult] = useState(null);
  const [imageSeoLoading, setImageSeoLoading] = useState(false);

  const [semanticHtmlResult, setSemanticHtmlResult] = useState(null);
  const [semanticHtmlLoading, setSemanticHtmlLoading] = useState(false);

  const [metaDescAuditResult, setMetaDescAuditResult] = useState(null);
  const [metaDescAuditLoading, setMetaDescAuditLoading] = useState(false);

  const [kwDensityResult, setKwDensityResult] = useState(null);
  const [kwDensityLoading, setKwDensityLoading] = useState(false);

  const [indexDirectivesResult, setIndexDirectivesResult] = useState(null);
  const [indexDirectivesLoading, setIndexDirectivesLoading] = useState(false);

  const [contentStructResult, setContentStructResult] = useState(null);
  const [contentStructLoading, setContentStructLoading] = useState(false);

  const [authorAuthResult, setAuthorAuthResult] = useState(null);
  const [authorAuthLoading, setAuthorAuthLoading] = useState(false);

  const [sitemapResult, setSitemapResult] = useState(null);
  const [sitemapLoading, setSitemapLoading] = useState(false);

  const [ogValidResult, setOgValidResult] = useState(null);
  const [ogValidLoading, setOgValidLoading] = useState(false);

  const [breadcrumbResult, setBreadcrumbResult] = useState(null);
  const [breadcrumbLoading, setBreadcrumbLoading] = useState(false);

  const [howtoTitle, setHowtoTitle] = useState("");
  const [howtoResult, setHowtoResult] = useState(null);
  const [howtoLoading, setHowtoLoading] = useState(false);

  const [videoSchemaResult, setVideoSchemaResult] = useState(null);
  const [videoSchemaLoading, setVideoSchemaLoading] = useState(false);

  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState("4.8");
  const [reviewCount, setReviewCount] = useState("47");
  const [reviewResult, setReviewResult] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  const [orgName, setOrgName] = useState("");
  const [orgUrl, setOrgUrl] = useState("");
  const [orgResult, setOrgResult] = useState(null);
  const [orgLoading, setOrgLoading] = useState(false);

  const [speakableResult, setSpeakableResult] = useState(null);
  const [speakableLoading, setSpeakableLoading] = useState(false);

  const [intentResult, setIntentResult] = useState(null);
  const [intentLoading, setIntentLoading] = useState(false);
  const [intentKeyword, setIntentKeyword] = useState("");

  const [aiOverviewResult, setAiOverviewResult] = useState(null);
  const [aiOverviewLoading, setAiOverviewLoading] = useState(false);

  const [topicalResult, setTopicalResult] = useState(null);
  const [topicalLoading, setTopicalLoading] = useState(false);
  const [topicalKw, setTopicalKw] = useState("");

  const [metaOptResult, setMetaOptResult] = useState(null);
  const [metaOptLoading, setMetaOptLoading] = useState(false);

  const [decayResult, setDecayResult] = useState(null);
  const [decayLoading, setDecayLoading] = useState(false);

  const [compUrls, setCompUrls] = useState("");
  const [compResult, setCompResult] = useState(null);
  const [compLoading, setCompLoading] = useState(false);
  const [compErr, setCompErr] = useState("");

  const [cannibUrls, setCannibUrls] = useState("");
  const [cannibResult, setCannibResult] = useState(null);
  const [cannibLoading, setCannibLoading] = useState(false);

  const [anchorResult, setAnchorResult] = useState(null);
  const [anchorLoading, setAnchorLoading] = useState(false);

  const [tocResult, setTocResult] = useState(null);
  const [tocLoading, setTocLoading] = useState(false);

  const [sectionWcResult, setSectionWcResult] = useState(null);
  const [sectionWcLoading, setSectionWcLoading] = useState(false);

  const [paaKw, setPaaKw] = useState("");
  const [paaResult, setPaaResult] = useState(null);
  const [paaLoading, setPaaLoading] = useState(false);

  const [entityResult, setEntityResult] = useState(null);
  const [entityLoading, setEntityLoading] = useState(false);

  const [serpFeatResult, setSerpFeatResult] = useState(null);
  const [serpFeatLoading, setSerpFeatLoading] = useState(false);

  /* ── ANALYZER ─────────────────────────────────────────────────────────── */
  const runScan = useCallback(async () => {
    if (!url.trim()) return;
    setScanning(true); setScanErr(""); setScanResult(null); setAiAnalysis(null);
    setRewriteResult(null); setFixes({}); setExpandedIssue(null);
    try {
      const r = await apiFetch(`${API}/analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim(), keywords: kwInput.trim() }) });
      if (!r.ok) throw new Error(r.error || "Scan failed");
      setScanResult(r);
      // Save to history
      try { await apiFetch(`${API}/items`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "scan", url: r.url, title: r.title, score: r.scored?.overall, grade: r.scored?.grade, issueCount: r.scored?.issueCount }) }); } catch {}
    } catch (e) { setScanErr(e.message); }
    setScanning(false);
  }, [url, kwInput]);

  const generateFix = useCallback(async (issue) => {
    const k = issue.msg;
    setFixLoading(k);
    try {
      const r = await apiFetch(`${API}/ai/fix-code`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ issue: issue.msg, url: scanResult?.url, pageContext: { title: scanResult?.title, h1: scanResult?.h1, wordCount: scanResult?.wordCount } }) });
      if (r.ok) setFixes(p => ({ ...p, [k]: r.fix }));
    } catch {}
    setFixLoading(null);
  }, [scanResult]);

  const runAiAnalysis = useCallback(async () => {
    if (!scanResult) return;
    setAiAnalyzing(true);
    try {
      const r = await apiFetch(`${API}/ai/analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url, title: scanResult.title, metaDescription: scanResult.metaDescription, h1: scanResult.h1, wordCount: scanResult.wordCount, headings: scanResult.headings, keywords: kwInput, scored: scanResult.scored }) });
      if (r.ok) setAiAnalysis(r.structured || JSON.parse(r.analysis));
    } catch {}
    setAiAnalyzing(false);
  }, [scanResult, kwInput]);

  const generateSchema = useCallback(async () => {
    if (!scanResult) return;
    setSchemaGenLoading(true); setGeneratedSchema(null);
    try {
      const r = await apiFetch(`${API}/schema/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        url: scanResult.url, title: scanResult.title, metaDescription: scanResult.metaDescription,
        h1: scanResult.h1, datePublished: scanResult.datePublished, dateModified: scanResult.dateModified,
        authorName: schemaAuthorName || scanResult.authorMeta || undefined,
        publisherName: schemaPublisherName || undefined,
        imageUrl: scanResult.ogImage || undefined,
        keywords: kwInput ? kwInput.split(",").map(s => s.trim()) : undefined,
      }) });
      if (r.ok) setGeneratedSchema(r);
    } catch {}
    setSchemaGenLoading(false);
  }, [scanResult, schemaAuthorName, schemaPublisherName, kwInput]);

  const checkBrokenLinks = useCallback(async () => {
    if (!scanResult) return;
    setBrokenLinksLoading(true); setBrokenLinksErr(""); setBrokenLinksResult(null);
    try {
      const r = await apiFetch(`${API}/links/check`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (!r.ok) throw new Error(r.error || "Link check failed");
      setBrokenLinksResult(r);
    } catch (e) { setBrokenLinksErr(e.message); }
    setBrokenLinksLoading(false);
  }, [scanResult]);

  const generateFaqSchema = useCallback(async (useAI = false) => {
    if (!scanResult?.questionHeadings?.length) return;
    setFaqSchemaLoading(true); setFaqSchemaResult(null);
    try {
      const r = await apiFetch(`${API}/faq-schema/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questionHeadings: scanResult.questionHeadings, useAI, url: scanResult.url }) });
      if (r.ok) setFaqSchemaResult(r);
    } catch {}
    setFaqSchemaLoading(false);
  }, [scanResult]);

  const runLsiKeywords = useCallback(async () => {
    if (!seedKw.trim()) return;
    setLsiLoading(true); setLsiErr(""); setLsiResult(null);
    try {
      const r = await apiFetch(`${API}/keywords/lsi`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: seedKw.trim(), niche: kwNiche.trim() || undefined }) });
      if (!r.ok) throw new Error(r.error || "Failed");
      setLsiResult(r);
    } catch (e) { setLsiErr(e.message); }
    setLsiLoading(false);
  }, [seedKw, kwNiche]);

  const runLlmScore = useCallback(async () => {
    if (!scanResult?.url) return;
    setLlmLoading(true); setLlmErr(""); setLlmScore(null);
    try {
      const r = await apiFetch(`${API}/llm/score`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (!r.ok) throw new Error(r.error || "LLM score failed");
      setLlmScore(r);
    } catch (e) { setLlmErr(e.message); }
    setLlmLoading(false);
  }, [scanResult]);

  const runTechAudit = useCallback(async () => {
    if (!scanResult?.url) return;
    setTechAuditLoading(true); setTechAuditErr(""); setTechAudit(null);
    try {
      const r = await apiFetch(`${API}/technical/audit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (!r.ok) throw new Error(r.error || "Audit failed");
      setTechAudit(r);
    } catch (e) { setTechAuditErr(e.message); }
    setTechAuditLoading(false);
  }, [scanResult]);

  const runCtrSignals = useCallback(async () => {
    if (!scanResult?.title) return;
    setCtrLoading(true); setCtrSignals(null);
    try {
      const r = await apiFetch(`${API}/title/ctr-signals`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: scanResult.title, keyword: kwInput.trim() }) });
      if (r.ok) setCtrSignals(r);
    } catch {}
    setCtrLoading(false);
  }, [scanResult, kwInput]);

  const runSchemaValidate = useCallback(async () => {
    if (!scanResult?.url) return;
    setSchemaValidLoading(true); setSchemaValidErr(""); setSchemaValid(null);
    try {
      const r = await apiFetch(`${API}/article-schema/validate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (!r.ok) throw new Error(r.error || "Validation failed");
      setSchemaValid(r);
    } catch (e) { setSchemaValidErr(e.message); }
    setSchemaValidLoading(false);
  }, [scanResult]);

  const runAdvReadability = useCallback(async () => {
    if (!scanResult?.url) return;
    setAdvReadLoading(true); setAdvReadability(null);
    try {
      const r = await apiFetch(`${API}/content/advanced-readability`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setAdvReadability(r);
    } catch {}
    setAdvReadLoading(false);
  }, [scanResult]);

  const runIntLinks = useCallback(async () => {
    if (!scanResult?.url) return;
    setIntLinksLoading(true); setIntLinksErr(""); setIntLinks(null);
    try {
      const r = await apiFetch(`${API}/links/internal-suggestions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url, title: scanResult.title, niche: kwNiche.trim() || undefined }) });
      if (!r.ok) throw new Error(r.error || "Failed");
      setIntLinks(r);
    } catch (e) { setIntLinksErr(e.message); }
    setIntLinksLoading(false);
  }, [scanResult, kwNiche]);

  /* ── NEW FEATURE CALLBACKS ──────────────────────────────────────────── */
  const runCoreWebVitals = useCallback(async () => {
    if (!url.trim()) return;
    setCwvLoading(true); setCwvErr(""); setCwvResult(null);
    try {
      const r = await apiFetch(`${API}/core-web-vitals`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim(), strategy: "mobile" }) });
      if (!r.ok) throw new Error(r.error || "CWV check failed");
      setCwvResult(r);
    } catch (e) { setCwvErr(e.message); }
    setCwvLoading(false);
  }, [url]);

  const runCrawlerAccess = useCallback(async () => {
    if (!url.trim()) return;
    setCrawlerLoading(true); setCrawlerErr(""); setCrawlerResult(null);
    try {
      const r = await apiFetch(`${API}/crawler-access`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) });
      if (!r.ok) throw new Error(r.error || "Crawler check failed");
      setCrawlerResult(r);
    } catch (e) { setCrawlerErr(e.message); }
    setCrawlerLoading(false);
  }, [url]);

  const runTitleH1 = useCallback(async () => {
    if (!scanResult?.url) return;
    setTitleH1Loading(true); setTitleH1Result(null);
    try {
      const r = await apiFetch(`${API}/title-h1-alignment`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setTitleH1Result(r);
    } catch {}
    setTitleH1Loading(false);
  }, [scanResult]);

  const runHeadingHier = useCallback(async () => {
    if (!scanResult?.url) return;
    setHeadingHierLoading(true); setHeadingHierResult(null);
    try {
      const r = await apiFetch(`${API}/heading-hierarchy`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setHeadingHierResult(r);
    } catch {}
    setHeadingHierLoading(false);
  }, [scanResult]);

  const runImageSeo = useCallback(async () => {
    if (!scanResult?.url) return;
    setImageSeoLoading(true); setImageSeoResult(null);
    try {
      const r = await apiFetch(`${API}/image-seo`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setImageSeoResult(r);
    } catch {}
    setImageSeoLoading(false);
  }, [scanResult]);

  const runSemanticHtml = useCallback(async () => {
    if (!scanResult?.url) return;
    setSemanticHtmlLoading(true); setSemanticHtmlResult(null);
    try {
      const r = await apiFetch(`${API}/semantic-html`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setSemanticHtmlResult(r);
    } catch {}
    setSemanticHtmlLoading(false);
  }, [scanResult]);

  const runMetaDescAudit = useCallback(async () => {
    if (!scanResult?.url) return;
    setMetaDescAuditLoading(true); setMetaDescAuditResult(null);
    try {
      const r = await apiFetch(`${API}/meta-description-audit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) });
      if (r.ok) setMetaDescAuditResult(r);
    } catch {}
    setMetaDescAuditLoading(false);
  }, [scanResult, kwInput]);

  const runKwDensity = useCallback(async () => {
    if (!scanResult?.url) return;
    setKwDensityLoading(true); setKwDensityResult(null);
    try {
      const r = await apiFetch(`${API}/keyword-density`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) });
      if (r.ok) setKwDensityResult(r);
    } catch {}
    setKwDensityLoading(false);
  }, [scanResult, kwInput]);

  const runIndexDirectives = useCallback(async () => {
    if (!scanResult?.url) return;
    setIndexDirectivesLoading(true); setIndexDirectivesResult(null);
    try {
      const r = await apiFetch(`${API}/index-directives`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setIndexDirectivesResult(r);
    } catch {}
    setIndexDirectivesLoading(false);
  }, [scanResult]);

  const runContentStruct = useCallback(async () => {
    if (!scanResult?.url) return;
    setContentStructLoading(true); setContentStructResult(null);
    try {
      const r = await apiFetch(`${API}/content-structure`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setContentStructResult(r);
    } catch {}
    setContentStructLoading(false);
  }, [scanResult]);

  const runAuthorAuth = useCallback(async () => {
    if (!scanResult?.url) return;
    setAuthorAuthLoading(true); setAuthorAuthResult(null);
    try {
      const r = await apiFetch(`${API}/author-authority`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setAuthorAuthResult(r);
    } catch {}
    setAuthorAuthLoading(false);
  }, [scanResult]);

  const runSitemap = useCallback(async () => {
    if (!scanResult?.url) return;
    setSitemapLoading(true); setSitemapResult(null);
    try {
      const r = await apiFetch(`${API}/sitemap-check`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setSitemapResult(r);
    } catch {}
    setSitemapLoading(false);
  }, [scanResult]);

  const runOgValid = useCallback(async () => {
    if (!scanResult?.url) return;
    setOgValidLoading(true); setOgValidResult(null);
    try {
      const r = await apiFetch(`${API}/og-validator`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setOgValidResult(r);
    } catch {}
    setOgValidLoading(false);
  }, [scanResult]);

  const runBreadcrumb = useCallback(async () => {
    if (!scanResult?.url) return;
    setBreadcrumbLoading(true); setBreadcrumbResult(null);
    try {
      const r = await apiFetch(`${API}/schema/breadcrumb`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setBreadcrumbResult(r);
    } catch {}
    setBreadcrumbLoading(false);
  }, [scanResult]);

  const runHowto = useCallback(async () => {
    if (!howtoTitle.trim()) return;
    setHowtoLoading(true); setHowtoResult(null);
    try {
      const r = await apiFetch(`${API}/schema/howto`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: howtoTitle.trim() }) });
      if (r.ok) setHowtoResult(r);
    } catch {}
    setHowtoLoading(false);
  }, [howtoTitle]);

  const runVideoSchema = useCallback(async () => {
    if (!scanResult?.url) return;
    setVideoSchemaLoading(true); setVideoSchemaResult(null);
    try {
      const r = await apiFetch(`${API}/schema/video`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setVideoSchemaResult(r);
    } catch {}
    setVideoSchemaLoading(false);
  }, [scanResult]);

  const runReviewSchema = useCallback(async () => {
    if (!reviewName.trim()) return;
    setReviewLoading(true); setReviewResult(null);
    try {
      const r = await apiFetch(`${API}/schema/review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: reviewName.trim(), ratingValue: parseFloat(reviewRating), reviewCount: parseInt(reviewCount), url: scanResult?.url }) });
      if (r.ok) setReviewResult(r);
    } catch {}
    setReviewLoading(false);
  }, [reviewName, reviewRating, reviewCount, scanResult]);

  const runOrgSchema = useCallback(async () => {
    if (!orgName.trim()) return;
    setOrgLoading(true); setOrgResult(null);
    try {
      const r = await apiFetch(`${API}/schema/organization`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: orgName.trim(), url: orgUrl.trim() || undefined }) });
      if (r.ok) setOrgResult(r);
    } catch {}
    setOrgLoading(false);
  }, [orgName, orgUrl]);

  const runSpeakable = useCallback(async () => {
    if (!scanResult?.url) return;
    setSpeakableLoading(true); setSpeakableResult(null);
    try {
      const r = await apiFetch(`${API}/schema/speakable`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setSpeakableResult(r);
    } catch {}
    setSpeakableLoading(false);
  }, [scanResult]);

  const runIntent = useCallback(async () => {
    if (!intentKeyword.trim()) return;
    setIntentLoading(true); setIntentResult(null);
    try {
      const r = await apiFetch(`${API}/intent-classifier`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: intentKeyword.trim(), url: scanResult?.url }) });
      if (r.ok) setIntentResult(r);
    } catch {}
    setIntentLoading(false);
  }, [intentKeyword, scanResult]);

  const runAiOverview = useCallback(async () => {
    if (!scanResult?.url) return;
    setAiOverviewLoading(true); setAiOverviewResult(null);
    try {
      const r = await apiFetch(`${API}/ai-overview-eligibility`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) });
      if (r.ok) setAiOverviewResult(r);
    } catch {}
    setAiOverviewLoading(false);
  }, [scanResult, kwInput]);

  const runTopical = useCallback(async () => {
    if (!topicalKw.trim()) return;
    setTopicalLoading(true); setTopicalResult(null);
    try {
      const r = await apiFetch(`${API}/topical-authority`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: topicalKw.trim(), url: scanResult?.url }) });
      if (r.ok) setTopicalResult(r);
    } catch {}
    setTopicalLoading(false);
  }, [topicalKw, scanResult]);

  const runMetaOpt = useCallback(async () => {
    if (!scanResult?.url) return;
    setMetaOptLoading(true); setMetaOptResult(null);
    try {
      const r = await apiFetch(`${API}/meta-description-optimizer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) });
      if (r.ok) setMetaOptResult(r);
    } catch {}
    setMetaOptLoading(false);
  }, [scanResult, kwInput]);

  const runDecay = useCallback(async () => {
    if (!scanResult?.url) return;
    setDecayLoading(true); setDecayResult(null);
    try {
      const r = await apiFetch(`${API}/content-decay`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) });
      if (r.ok) setDecayResult(r);
    } catch {}
    setDecayLoading(false);
  }, [scanResult, kwInput]);

  const runCompGap = useCallback(async () => {
    const urls = compUrls.split("\n").map(u => u.trim()).filter(Boolean);
    if (!urls.length || !scanResult?.url) return;
    setCompLoading(true); setCompErr(""); setCompResult(null);
    try {
      const r = await apiFetch(`${API}/competitor-gap`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url, competitorUrls: urls }) });
      if (!r.ok) throw new Error(r.error || "Failed");
      setCompResult(r);
    } catch (e) { setCompErr(e.message); }
    setCompLoading(false);
  }, [compUrls, scanResult]);

  const runCannib = useCallback(async () => {
    const urls = cannibUrls.split("\n").map(u => u.trim()).filter(Boolean);
    if (!urls.length) return;
    setCannibLoading(true); setCannibResult(null);
    try {
      const r = await apiFetch(`${API}/cannibalization`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ urls, keyword: kwInput.trim() }) });
      if (r.ok) setCannibResult(r);
    } catch {}
    setCannibLoading(false);
  }, [cannibUrls, kwInput]);

  const runAnchor = useCallback(async () => {
    if (!scanResult?.url) return;
    setAnchorLoading(true); setAnchorResult(null);
    try {
      const r = await apiFetch(`${API}/anchor-text-audit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setAnchorResult(r);
    } catch {}
    setAnchorLoading(false);
  }, [scanResult]);

  const runToc = useCallback(async () => {
    if (!scanResult?.url) return;
    setTocLoading(true); setTocResult(null);
    try {
      const r = await apiFetch(`${API}/toc-generator`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setTocResult(r);
    } catch {}
    setTocLoading(false);
  }, [scanResult]);

  const runSectionWc = useCallback(async () => {
    if (!scanResult?.url) return;
    setSectionWcLoading(true); setSectionWcResult(null);
    try {
      const r = await apiFetch(`${API}/section-word-count`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setSectionWcResult(r);
    } catch {}
    setSectionWcLoading(false);
  }, [scanResult]);

  const runPaa = useCallback(async () => {
    if (!paaKw.trim()) return;
    setPaaLoading(true); setPaaResult(null);
    try {
      const r = await apiFetch(`${API}/people-also-ask`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: paaKw.trim(), url: scanResult?.url }) });
      if (r.ok) setPaaResult(r);
    } catch {}
    setPaaLoading(false);
  }, [paaKw, scanResult]);

  const runEntity = useCallback(async () => {
    if (!scanResult?.url) return;
    setEntityLoading(true); setEntityResult(null);
    try {
      const r = await apiFetch(`${API}/entity-detection`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setEntityResult(r);
    } catch {}
    setEntityLoading(false);
  }, [scanResult]);

  const runSerpFeatures = useCallback(async () => {
    if (!scanResult?.url) return;
    setSerpFeatLoading(true); setSerpFeatResult(null);
    try {
      const r = await apiFetch(`${API}/serp-features`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) });
      if (r.ok) setSerpFeatResult(r);
    } catch {}
    setSerpFeatLoading(false);
  }, [scanResult, kwInput]);

  const runRewrite = useCallback(async (field) => {
    if (!scanResult) return;
    setRewriteField(field); setRewriteLoading(true); setRewriteResult(null);
    try {
      const currentValue = field === "title" ? scanResult.title : field === "metaDescription" ? scanResult.metaDescription : scanResult.h1;
      const r = await apiFetch(`${API}/ai/rewrite`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ field, currentValue, keywords: kwInput, url: scanResult.url }) });
      if (r.ok) setRewriteResult(r.structured || JSON.parse(r.suggestions));
    } catch {}
    setRewriteLoading(false);
  }, [scanResult, kwInput]);

  /* ── KEYWORDS ─────────────────────────────────────────────────────────── */
  const runKwResearch = useCallback(async () => {
    if (!seedKw.trim()) return;
    setKwLoading(true); setKwErr(""); setKwResearch(null);
    try {
      const r = await apiFetch(`${API}/ai/keyword-research`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ seedKeyword: seedKw.trim(), niche: kwNiche.trim() || undefined }) });
      if (!r.ok) throw new Error(r.error || "Failed");
      setKwResearch(r.structured || JSON.parse(r.research));
    } catch (e) { setKwErr(e.message); }
    setKwLoading(false);
  }, [seedKw, kwNiche]);

  /* ── CONTENT BRIEF ────────────────────────────────────────────────────── */
  const runBrief = useCallback(async () => {
    if (!briefTopic.trim() && !briefPrimary.trim()) return;
    setBriefLoading(true); setBriefErr(""); setBriefResult(null);
    try {
      const r = await apiFetch(`${API}/ai/content-brief`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: briefTopic.trim(), primaryKeyword: briefPrimary.trim(), secondaryKeywords: briefSecondary.split(",").map(s => s.trim()).filter(Boolean) }) });
      if (!r.ok) throw new Error(r.error || "Failed");
      setBriefResult(r.structured || JSON.parse(r.brief));
    } catch (e) { setBriefErr(e.message); }
    setBriefLoading(false);
  }, [briefTopic, briefPrimary, briefSecondary]);

  /* ── BULK SCAN ────────────────────────────────────────────────────────── */
  const runBulk = useCallback(async () => {
    const urls = bulkUrls.split("\n").map(u => u.trim()).filter(Boolean);
    if (!urls.length) return;
    setBulkLoading(true); setBulkErr(""); setBulkResult(null);
    try {
      const r = await apiFetch(`${API}/bulk-analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ urls, keywords: bulkKw.trim() }) });
      if (!r.ok) throw new Error(r.error || "Failed");
      setBulkResult(r);
    } catch (e) { setBulkErr(e.message); }
    setBulkLoading(false);
  }, [bulkUrls, bulkKw]);

  /* ── AI CHAT ──────────────────────────────────────────────────────────── */
  const sendChat = useCallback(async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: "user", content: chatInput.trim() };
    setChatMessages(p => [...p, userMsg]);
    setChatInput(""); setChatLoading(true);
    try {
      const r = await apiFetch(`${API}/ai/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [...chatMessages, userMsg] }) });
      if (r.ok && r.reply) setChatMessages(p => [...p, { role: "assistant", content: r.reply }]);
    } catch {}
    setChatLoading(false);
    setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }), 100);
  }, [chatInput, chatMessages]);

  /* ── HISTORY ──────────────────────────────────────────────────────────── */
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const r = await apiFetch(`${API}/items`);
      if (r.ok) setHistory(r.items || []);
    } catch {}
    setHistoryLoading(false);
  }, []);

  const deleteHistory = useCallback(async (id) => {
    try { await apiFetch(`${API}/items/${id}`, { method: "DELETE" }); } catch {}
    setHistory(p => p.filter(h => h.id !== id));
  }, []);

  useEffect(() => { if (tab === "History") loadHistory(); }, [tab]);

  /* ── Filtered issues ── */
  const issues = scanResult?.scored?.issues || [];
  const filteredIssues = issues.filter(i => (filterCat === "all" || i.cat === filterCat) && (filterSev === "all" || i.sev === filterSev));

  /* ── RENDER ──────────────────────────────────────────────────────────── */
  return (
    <div style={S.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={S.topBar}>
        <BackButton />
        <span style={S.title}>Blog SEO Engine</span>
        <span style={S.badge}>AI-Powered</span>
      </div>

      <div style={S.body}>
        {/* ── TABS ── */}
        <div style={S.tabs}>
          {TABS.map(t => <div key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>{t}</div>)}
        </div>

        {/* ================================================================
            ANALYZER TAB
            ================================================================ */}
        {tab === "Analyzer" && (
          <>
            {/* URL input */}
            <div style={{ ...S.card, marginTop: 16 }}>
              <div style={S.cardTitle}>🔍 Analyze Blog Post</div>
              <div style={{ ...S.row, marginBottom: 10 }}>
                <input style={S.input} placeholder="Enter blog post URL (e.g. https://yourstore.com/blogs/news/post-title)" value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && !scanning && runScan()} />
              </div>
              <div style={{ ...S.row, marginBottom: 10 }}>
                <input style={{ ...S.input, maxWidth: 400 }} placeholder="Target keywords (comma-separated)" value={kwInput} onChange={e => setKwInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !scanning && runScan()} />
                <button style={S.btn("primary")} onClick={runScan} disabled={scanning || !url.trim()}>
                  {scanning ? <><span style={S.spinner} /> Scanning…</> : "Analyze"}
                </button>
              </div>
            </div>

            {scanErr && <div style={S.err}>{scanErr}</div>}

            {scanning && (
              <div style={S.empty}><span style={S.spinner} /><div style={{ marginTop: 12 }}>Crawling and analyzing blog post…</div></div>
            )}

            {/* ── RESULTS ── */}
            {scanResult && !scanning && (
              <>
                {/* Score overview */}
                <div style={S.card}>
                  <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                    <div style={S.scoreRing(scanResult.scored.overall)}>{scanResult.scored.overall}</div>
                    <div style={S.grade(scanResult.scored.grade)}>{scanResult.scored.grade}</div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{scanResult.title || "(no title)"}</div>
                      <div style={{ fontSize: 12, color: "#71717a", wordBreak: "break-all" }}>{scanResult.url}</div>
                    </div>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <MetaChip label="Words" value={scanResult.wordCount} />
                      <MetaChip label="Reading" value={`${scanResult.readingTimeMinutes} min`} />
                      <MetaChip label="Issues" value={scanResult.scored.issueCount} color={scanResult.scored.highIssues > 0 ? "#ef4444" : "#22c55e"} />
                      <MetaChip label="Images" value={scanResult.imageCount} />
                      <MetaChip label="Int Links" value={scanResult.internalLinks} />
                      <MetaChip label="Size" value={`${scanResult.pageSizeKB}KB`} />
                    </div>
                  </div>
                </div>

                {/* Category scores */}
                <div style={S.catBar}>
                  {Object.entries(scanResult.scored.categories).map(([cat, v]) => (
                    <div key={cat} style={S.catCard(v.score)}>
                      <div style={S.catScore(v.score)}>{v.score}</div>
                      <div style={S.catLabel}>{cat} ({v.weight}%)</div>
                    </div>
                  ))}
                </div>

                {/* SERP Preview */}
                <div style={S.card}>
                  <ToggleSection title="🔍 SERP Preview" open={showSerp} toggle={() => setShowSerp(p => !p)} />
                  {showSerp && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ ...S.row, gap: 8, marginBottom: 14 }}>
                        {["desktop", "mobile"].map(d => (
                          <button key={d} style={S.tab(serpDevice === d)} onClick={() => setSerpDevice(d)}>{d === "desktop" ? "🖥 Desktop" : "📱 Mobile"}</button>
                        ))}
                      </div>
                      {/* Google result mock */}
                      <div style={{ background: "#fff", borderRadius: 10, padding: "16px 20px", maxWidth: serpDevice === "mobile" ? 360 : 620, fontFamily: "Arial, sans-serif" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#e8e8e8", flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: 12, color: "#202124", fontWeight: 500 }}>{(() => { try { return new URL(scanResult.url).hostname; } catch { return scanResult.url; } })()}</div>
                            <div style={{ fontSize: 12, color: "#4d5156" }}>{(() => { try { const u = new URL(scanResult.url); return u.hostname + u.pathname; } catch { return "—"; } })()}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: serpDevice === "mobile" ? 16 : 20, color: "#1a0dab", fontWeight: 400, lineHeight: 1.3, marginBottom: 2, textDecoration: "underline", cursor: "pointer" }}>
                          {(scanResult.title || "").slice(0, 60)}{(scanResult.title || "").length > 60 ? "…" : ""}
                        </div>
                        <div style={{ fontSize: 14, color: "#4d5156", lineHeight: 1.57 }}>
                          {(scanResult.metaDescription || "(no meta description — Google will pull an excerpt)").slice(0, 160)}{(scanResult.metaDescription || "").length > 160 ? "…" : ""}
                        </div>
                      </div>
                      {/* Char count bars */}
                      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {[
                          { label: "Title", value: (scanResult.title || "").length, min: 30, max: 60 },
                          { label: "Meta Description", value: (scanResult.metaDescription || "").length, min: 50, max: 160 },
                        ].map(({ label, value, min, max }) => {
                          const pct   = Math.min(100, (value / max) * 100);
                          const color = value >= min && value <= max ? "#22c55e" : value > max ? "#ef4444" : "#eab308";
                          return (
                            <div key={label}>
                              <div style={{ fontSize: 12, color: "#a1a1aa", marginBottom: 4 }}>{label}: <span style={{ color, fontWeight: 700 }}>{value}</span> / {max} chars</div>
                              <div style={{ height: 6, background: "#27272a", borderRadius: 3 }}>
                                <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.3s" }} />
                              </div>
                              {value > max && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>⚠️ Truncated — cut {value - max} chars</div>}
                              {value < min && value > 0 && <div style={{ fontSize: 11, color: "#eab308", marginTop: 3 }}>⚠️ Too short — add {min - value} more chars</div>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Analysis button */}
                <div style={{ ...S.card, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <button style={S.btn("primary")} onClick={runAiAnalysis} disabled={aiAnalyzing}>
                    {aiAnalyzing ? <><span style={S.spinner} /> Analyzing…</> : "🤖 AI Deep Analysis (1 credit)"}
                  </button>
                  <button style={S.btn()} onClick={() => runRewrite("title")}>✏️ AI Rewrite Title</button>
                  <button style={S.btn()} onClick={() => runRewrite("metaDescription")}>✏️ AI Rewrite Description</button>
                  <button style={S.btn()} onClick={() => runRewrite("h1")}>✏️ AI Rewrite H1</button>
                </div>

                {/* AI Analysis results */}
                {aiAnalysis && (
                  <div style={S.card}>
                    <div style={S.cardTitle}>🤖 AI Analysis</div>
                    {aiAnalysis.assessment && <div style={{ fontSize: 14, color: "#d4d4d8", marginBottom: 12, lineHeight: 1.6 }}>{aiAnalysis.assessment}</div>}
                    {aiAnalysis.strengths?.length > 0 && (
                      <div style={S.section}><div style={S.heading}>✅ Strengths</div>{aiAnalysis.strengths.map((s, i) => <div key={i} style={{ fontSize: 13, color: "#86efac", marginBottom: 4 }}>• {s}</div>)}</div>
                    )}
                    {aiAnalysis.weaknesses?.length > 0 && (
                      <div style={S.section}><div style={S.heading}>⚠️ Weaknesses</div>{aiAnalysis.weaknesses.map((s, i) => <div key={i} style={{ fontSize: 13, color: "#fbbf24", marginBottom: 4 }}>• {s}</div>)}</div>
                    )}
                    {aiAnalysis.recommendations?.length > 0 && (
                      <div style={S.section}><div style={S.heading}>💡 Recommendations</div>
                        {aiAnalysis.recommendations.map((r, i) => (
                          <div key={i} style={{ ...S.issueRow, flexDirection: "column", alignItems: "flex-start" }}>
                            <div><span style={S.pill(r.priority === "critical" ? "high" : r.priority === "recommended" ? "medium" : "low")}>{r.priority}</span><strong style={{ fontSize: 13 }}>{r.title}</strong></div>
                            <div style={{ fontSize: 13, color: "#a1a1aa", marginTop: 4 }}>{r.description}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {aiAnalysis.contentGaps?.length > 0 && (
                      <div style={S.section}><div style={S.heading}>🕳️ Content Gaps</div>{aiAnalysis.contentGaps.map((s, i) => <div key={i} style={{ fontSize: 13, color: "#93c5fd", marginBottom: 4 }}>• {s}</div>)}</div>
                    )}
                    {aiAnalysis.topicSuggestions?.length > 0 && (
                      <div style={S.section}><div style={S.heading}>📝 Related Topics</div>{aiAnalysis.topicSuggestions.map((s, i) => <div key={i} style={{ fontSize: 13, color: "#c4b5fd", marginBottom: 4 }}>• {s}</div>)}</div>
                    )}
                  </div>
                )}

                {/* Rewrite results */}
                {rewriteLoading && <div style={S.card}><span style={S.spinner} /> Generating AI rewrites for <strong>{rewriteField}</strong>…</div>}
                {rewriteResult && (
                  <div style={S.card}>
                    <div style={S.cardTitle}>✏️ AI Rewrite Suggestions — {rewriteResult.field || rewriteField}</div>
                    {(rewriteResult.variants || []).map((v, i) => (
                      <div key={i} style={{ ...S.issueRow, justifyContent: "space-between" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, color: "#fafafa" }}>{v.text}</div>
                          <div style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>{v.charCount} chars · Keyword: {v.keywordPresent ? "✅" : "❌"} · CTA: {v.ctaStrength}</div>
                        </div>
                        <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => navigator.clipboard.writeText(v.text)}>Copy</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Meta details */}
                <div style={S.card}>
                  <div style={S.cardTitle}>📋 Meta & Content Details</div>
                  <div style={S.metaRow}>
                    <MetaBlock label="Title" value={scanResult.title} max={60} />
                    <MetaBlock label="H1" value={scanResult.h1} />
                  </div>
                  <div style={S.metaRow}>
                    <MetaBlock label="Meta Description" value={scanResult.metaDescription} max={160} />
                  </div>
                  <div style={S.metaRow}>
                    <MetaBlock label="Canonical" value={scanResult.canonicalUrl || "—"} />
                    <MetaBlock label="Language" value={scanResult.langTag || "—"} />
                    <MetaBlock label="Author" value={scanResult.authorMeta || "—"} />
                  </div>
                  <div style={S.metaRow}>
                    <MetaBlock label="Published" value={scanResult.datePublished || "—"} />
                    <MetaBlock label="Modified" value={scanResult.dateModified || "—"} />
                    <MetaBlock label="HTTPS" value={scanResult.isHttps ? "Yes ✅" : "No ❌"} />
                  </div>
                  <div style={S.metaRow}>
                    <MetaBlock label="OG Title" value={scanResult.ogTitle || "—"} />
                    <MetaBlock label="OG Description" value={scanResult.ogDescription || "—"} />
                    <MetaBlock label="OG Image" value={scanResult.ogImage ? "Set ✅" : "Missing ❌"} />
                  </div>
                  <div style={S.metaRow}>
                    <MetaBlock label="Twitter Card" value={scanResult.hasTwitterCard ? `${scanResult.twitterCard} ✅` : "Missing ❌"} />
                    <MetaBlock label="Twitter Title" value={scanResult.twitterTitle || "—"} />
                    <MetaBlock label="Twitter Desc" value={scanResult.twitterDescription ? "Set ✅" : "—"} />
                  </div>
                </div>

                {/* Readability panel */}
                {scanResult.flesch && (
                  <div style={S.card}>
                    <ToggleSection title="📖 Readability Analysis (Flesch-Kincaid)" open={showReadability} toggle={() => setShowReadability(p => !p)} />
                    {showReadability && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
                          <div style={{ ...S.catCard(scanResult.flesch.ease), minWidth: 120 }}>
                            <div style={S.catScore(scanResult.flesch.ease)}>{scanResult.flesch.ease}</div>
                            <div style={S.catLabel}>Reading Ease</div>
                            <div style={{ fontSize: 11, color: "#a1a1aa", marginTop: 4 }}>{scanResult.flesch.easeLabel}</div>
                          </div>
                          <div style={{ ...S.catCard(scanResult.flesch.grade <= 9 ? 80 : scanResult.flesch.grade <= 12 ? 60 : 30), minWidth: 120 }}>
                            <div style={{ fontSize: 22, fontWeight: 800, color: scanResult.flesch.grade <= 9 ? "#22c55e" : scanResult.flesch.grade <= 12 ? "#eab308" : "#ef4444" }}>
                              Grade {scanResult.flesch.grade}
                            </div>
                            <div style={S.catLabel}>FK Grade Level</div>
                            <div style={{ fontSize: 11, color: "#a1a1aa", marginTop: 4 }}>{scanResult.flesch.gradeLabel}</div>
                          </div>
                          <div style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 16px", flex: "1 1 200px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                              <div><div style={S.metaLabel}>Reading Time</div><div style={S.metaVal}>{scanResult.readingTimeMinutes} min</div></div>
                              <div><div style={S.metaLabel}>Avg Sentence</div><div style={S.metaVal}>{scanResult.avgSentenceLength} words</div></div>
                              <div><div style={S.metaLabel}>Total Sentences</div><div style={S.metaVal}>{scanResult.flesch.totalSentences ?? "—"}</div></div>
                              <div><div style={S.metaLabel}>Avg Para Length</div><div style={S.metaVal}>{scanResult.avgParagraphLength} words</div></div>
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>
                          <strong style={{ color: "#a1a1aa" }}>Flesch Reading Ease:</strong> Score 0–30 = Very Difficult · 30–50 = Difficult · 50–60 = Fairly Difficult · 60–70 = Standard · 70–80 = Fairly Easy · 80–90 = Easy · 90–100 = Very Easy. Target 60+ for blog content.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Content freshness panel */}
                {(scanResult.contentAgeDays !== null && scanResult.contentAgeDays !== undefined) && (
                  <div style={{ ...S.card, borderLeft: scanResult.isContentStale ? "3px solid #ef4444" : "3px solid #22c55e" }}>
                    <ToggleSection title={`🕐 Content Freshness${scanResult.isContentStale ? " ⚠️ Stale" : " ✅"}`} open={showFreshness} toggle={() => setShowFreshness(p => !p)} />
                    {showFreshness && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ ...S.row, gap: 24, marginBottom: 12 }}>
                          <div>
                            <div style={S.metaLabel}>Published</div>
                            <div style={S.metaVal}>{scanResult.datePublished ? `${scanResult.datePublished.slice(0, 10)} (${scanResult.contentAgeDays} days ago)` : "—"}</div>
                          </div>
                          <div>
                            <div style={S.metaLabel}>Modified</div>
                            <div style={S.metaVal}>{scanResult.dateModified ? `${scanResult.dateModified.slice(0, 10)} (${scanResult.daysSinceModified} days ago)` : "Not set"}</div>
                          </div>
                          <div>
                            <div style={S.metaLabel}>Status</div>
                            <div style={{ ...S.metaVal, color: scanResult.isContentStale ? "#ef4444" : "#22c55e", fontWeight: 700 }}>
                              {scanResult.isContentStale ? "⚠️ Stale (1+ year)" : "✅ Fresh"}
                            </div>
                          </div>
                        </div>
                        {scanResult.isContentStale && (
                          <div style={{ background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#fca5a5" }}>
                            This post hasn't been updated in over a year. Refreshing content signals freshness to Google and can recover declining rankings. Consider updating key facts, dates, stats, and internal links.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* E-E-A-T signals panel */}
                {scanResult.eeatSignals && (
                  <div style={S.card}>
                    <ToggleSection title={`🏆 E-E-A-T Signals (${scanResult.eeatSignals.score}/4)`} open={showEeat} toggle={() => setShowEeat(p => !p)} />
                    {showEeat && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginBottom: 12 }}>
                          {[
                            { label: "Author Meta Tag", ok: scanResult.eeatSignals.hasAuthorMeta, tip: "Add <meta name=\"author\" content=\"Name\">" },
                            { label: "Author in Body (Byline)", ok: scanResult.eeatSignals.hasAuthorInBody, tip: "Add a visible byline with class=\"author\" or rel=\"author\"" },
                            { label: "Author Page Link", ok: scanResult.eeatSignals.hasAuthorPageLink, tip: "Link byline to /about/, /author/, or /team/ page" },
                            { label: "Published Date Present", ok: scanResult.eeatSignals.hasDatePublished, tip: "Add article:published_time meta or <time datetime> element" },
                            { label: "Modified Date Present", ok: scanResult.eeatSignals.hasDateModified, tip: "Add article:modified_time meta to signal freshness" },
                          ].map((sig, i) => (
                            <div key={i} style={{ background: sig.ok ? "#14532d22" : "#450a0a22", border: `1px solid ${sig.ok ? "#14532d" : "#7f1d1d"}`, borderRadius: 8, padding: "10px 12px" }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: sig.ok ? "#86efac" : "#fca5a5", marginBottom: 4 }}>
                                {sig.ok ? "✅" : "❌"} {sig.label}
                              </div>
                              {!sig.ok && <div style={{ fontSize: 11, color: "#a1a1aa" }}>{sig.tip}</div>}
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>
                          E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) is how Google evaluates content credibility. Strong author signals directly impact ranking for YMYL (Your Money or Your Life) topics.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Featured snippet readiness panel */}
                {scanResult.questionHeadingCount !== undefined && (
                  <div style={S.card}>
                    <ToggleSection title={`🎯 Featured Snippet Readiness${scanResult.questionHeadingCount > 0 ? " ✅" : ""}`} open={showSnippets} toggle={() => setShowSnippets(p => !p)} />
                    {showSnippets && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ ...S.row, gap: 24, marginBottom: 12 }}>
                          <MetaChip label="Question Headings" value={scanResult.questionHeadingCount} color={scanResult.questionHeadingCount > 0 ? "#22c55e" : "#ef4444"} />
                          <MetaChip label="FAQ Section" value={scanResult.hasFaqSection ? "Yes ✅" : "No"} color={scanResult.hasFaqSection ? "#22c55e" : "#71717a"} />
                          <MetaChip label="Table of Contents" value={scanResult.hasTableOfContents ? "Yes ✅" : "No"} color={scanResult.hasTableOfContents ? "#22c55e" : "#71717a"} />
                        </div>
                        {scanResult.questionHeadings?.length > 0 && (
                          <div style={{ marginBottom: 10 }}>
                            <div style={S.heading}>Question-form headings detected</div>
                            {scanResult.questionHeadings.map((h, i) => (
                              <div key={i} style={{ fontSize: 13, color: "#93c5fd", marginBottom: 3 }}>
                                <span style={{ ...S.pill("low"), background: "#1e3a5f" }}>{h.tag.toUpperCase()}</span> {h.text}
                              </div>
                            ))}
                          </div>
                        )}
                        {scanResult.questionHeadingCount === 0 && (
                          <div style={{ fontSize: 13, color: "#fbbf24" }}>
                            💡 Add H2/H3 headings starting with How, What, Why, or When to increase chances of winning featured snippets and AI-generated answer boxes.
                          </div>
                        )}
                        {!scanResult.hasTableOfContents && scanResult.wordCount > 1200 && (
                          <div style={{ fontSize: 13, color: "#fbbf24", marginTop: 8 }}>
                            💡 Add a Table of Contents for this {scanResult.wordCount}-word post — it helps readers navigate and can win sitelinks in Google results.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* FAQ Schema Generator */}
                {scanResult.questionHeadings?.length > 0 && (
                  <div style={S.card}>
                    <div style={S.cardTitle}>📋 FAQPage Schema Generator</div>
                    <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 12 }}>
                      {scanResult.questionHeadings.length} question heading{scanResult.questionHeadings.length > 1 ? "s" : ""} detected — generate FAQPage JSON-LD to unlock Google's FAQ rich result in search.
                    </div>
                    <div style={{ ...S.row, gap: 8, marginBottom: faqSchemaResult ? 14 : 0 }}>
                      <button style={S.btn("primary")} onClick={() => generateFaqSchema(true)} disabled={faqSchemaLoading}>
                        {faqSchemaLoading ? <><span style={S.spinner} /> Generating…</> : "🤖 AI Generate Answers + Schema (1 credit)"}
                      </button>
                      <button style={S.btn()} onClick={() => generateFaqSchema(false)} disabled={faqSchemaLoading}>
                        📄 Structure Only (free)
                      </button>
                    </div>
                    {faqSchemaResult && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ marginBottom: 12 }}>
                          {faqSchemaResult.faqs.map((f, i) => (
                            <div key={i} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 14px", marginBottom: 8 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7", marginBottom: 4 }}>Q: {f.question}</div>
                              <div style={{ fontSize: 13, color: "#a1a1aa" }}>A: {f.answer}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ ...S.row, gap: 8, marginBottom: 8 }}>
                          <div style={{ fontSize: 13, color: "#86efac", fontWeight: 600 }}>{faqSchemaResult.aiGenerated ? "✅ AI answers + schema generated" : "✅ Schema structure generated"}</div>
                          <button style={S.btn("ghost")} onClick={() => navigator.clipboard.writeText(faqSchemaResult.scriptTag)}>📋 Copy</button>
                        </div>
                        <pre style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: 14, fontSize: 11, color: "#d4d4d8", overflowX: "auto", whiteSpace: "pre-wrap", maxHeight: 280, overflowY: "auto" }}>{faqSchemaResult.scriptTag}</pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Keyword density */}
                {scanResult.keywordDensity && Object.keys(scanResult.keywordDensity).length > 0 && (
                  <div style={S.card}>
                    <div style={S.cardTitle}>🎯 Keyword Density</div>
                    <table style={S.table}>
                      <thead><tr><th style={S.th}>Keyword</th><th style={S.th}>Count</th><th style={S.th}>Density</th><th style={S.th}>In Title</th><th style={S.th}>In H1</th><th style={S.th}>In Meta</th><th style={S.th}>In URL</th><th style={S.th}>First 100W</th></tr></thead>
                      <tbody>
                        {Object.entries(scanResult.keywordDensity).map(([kw, v]) => (
                          <tr key={kw}>
                            <td style={S.td}>{kw}</td>
                            <td style={S.td}>{v.count}</td>
                            <td style={{ ...S.td, color: v.density >= 0.5 && v.density <= 2.5 ? "#22c55e" : v.density > 3 ? "#ef4444" : "#eab308" }}>{v.density}%</td>
                            <td style={S.td}>{scanResult.keywordInTitle ? "✅" : "❌"}</td>
                            <td style={S.td}>{scanResult.keywordInH1 ? "✅" : "❌"}</td>
                            <td style={S.td}>{scanResult.keywordInMeta ? "✅" : "❌"}</td>
                            <td style={S.td}>{scanResult.keywordInUrl ? "✅" : "❌"}</td>
                            <td style={S.td}>{scanResult.keywordInFirst100Words ? "✅" : "❌"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Expandable panels */}
                <div style={S.card}>
                  <ToggleSection title={`📑 Headings (${scanResult.headings?.length || 0})`} open={showHeadings} toggle={() => setShowHeadings(p => !p)} />
                  {showHeadings && (
                    <div style={{ marginTop: 8 }}>
                      {(scanResult.headings || []).map((h, i) => (
                        <div key={i} style={{ padding: "4px 0", paddingLeft: (parseInt(h.tag[1]) - 1) * 20, fontSize: 13, color: "#d4d4d8" }}>
                          <span style={{ ...S.pill("low"), background: "#1e3a5f" }}>{h.tag.toUpperCase()}</span> {h.text}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={S.card}>
                  <ToggleSection title={`🔗 Links — ${scanResult.internalLinks} internal · ${scanResult.externalLinks} external`} open={showLinks} toggle={() => setShowLinks(p => !p)} />
                  {showLinks && (
                    <div style={{ marginTop: 8, maxHeight: 300, overflowY: "auto" }}>
                      <div style={S.heading}>Internal Links</div>
                      {(scanResult.internalLinkDetails || []).map((l, i) => <div key={i} style={{ fontSize: 12, color: "#93c5fd", marginBottom: 3, wordBreak: "break-all" }}>• {l.text || "(no text)"} → {l.href}</div>)}
                      <div style={{ ...S.heading, marginTop: 12 }}>External Links</div>
                      {(scanResult.externalLinkDetails || []).map((l, i) => <div key={i} style={{ fontSize: 12, color: "#c4b5fd", marginBottom: 3, wordBreak: "break-all" }}>• {l.text || "(no text)"} → {l.href}</div>)}
                    </div>
                  )}
                </div>

                {/* Broken Link Checker */}
                <div style={{ ...S.card, borderLeft: brokenLinksResult ? (brokenLinksResult.summary.broken > 0 ? "3px solid #ef4444" : "3px solid #22c55e") : undefined }}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: brokenLinksResult || brokenLinksErr ? 12 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>🔗 Broken Link Checker {brokenLinksResult && <span style={{ fontSize: 12, color: "#71717a", fontWeight: 400 }}>— {brokenLinksResult.summary.total} links scanned</span>}</div>
                    <button style={S.btn(brokenLinksResult ? undefined : "primary")} onClick={checkBrokenLinks} disabled={brokenLinksLoading}>
                      {brokenLinksLoading ? <><span style={S.spinner} /> Checking…</> : brokenLinksResult ? "🔄 Re-scan" : "🔍 Check All Links"}
                    </button>
                  </div>
                  {brokenLinksErr && <div style={S.err}>{brokenLinksErr}</div>}
                  {!brokenLinksResult && !brokenLinksLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Scan all links on this post for 404 errors, broken URLs, and redirects.</div>}
                  {brokenLinksResult && (
                    <div>
                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 12 }}>
                        <MetaChip label="Total" value={brokenLinksResult.summary.total} />
                        <MetaChip label="OK" value={brokenLinksResult.summary.ok} color="#22c55e" />
                        <MetaChip label="Redirects" value={brokenLinksResult.summary.redirects} color="#eab308" />
                        <MetaChip label="Broken" value={brokenLinksResult.summary.broken} color={brokenLinksResult.summary.broken > 0 ? "#ef4444" : "#22c55e"} />
                      </div>
                      <div style={{ maxHeight: 320, overflowY: "auto" }}>
                        {[...brokenLinksResult.results]
                          .sort((a, b) => (b.broken ? 2 : b.redirect ? 1 : 0) - (a.broken ? 2 : a.redirect ? 1 : 0))
                          .map((r, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 0", borderBottom: "1px solid #18181b", fontSize: 12 }}>
                              <span style={S.pill(r.broken ? "high" : r.redirect ? "medium" : "low")}>
                                {r.status || "ERR"} {r.ok ? "✅" : r.redirect ? "↪️" : "❌"}
                              </span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ color: "#93c5fd", wordBreak: "break-all" }}>{r.url}</div>
                                {r.text && <div style={{ color: "#71717a" }}>"{r.text}"</div>}
                                {r.redirectUrl && <div style={{ color: "#eab308" }}>→ {r.redirectUrl}</div>}
                                {r.error && <div style={{ color: "#ef4444" }}>{r.error}</div>}
                              </div>
                              <div style={{ color: "#52525b", flexShrink: 0 }}>{r.duration}ms</div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                <div style={S.card}>
                  <ToggleSection title={`🖼️ Images (${scanResult.imageCount}) — ${scanResult.imagesWithAlt} with alt`} open={showImages} toggle={() => setShowImages(p => !p)} />
                  {showImages && (
                    <div style={{ marginTop: 8, maxHeight: 300, overflowY: "auto" }}>
                      {(scanResult.images || []).map((img, i) => (
                        <div key={i} style={{ fontSize: 12, marginBottom: 6, color: "#d4d4d8" }}>
                          <span style={S.pill(img.hasAlt ? "low" : "high")}>{img.hasAlt ? "ALT ✅" : "ALT ❌"}</span>
                          <span style={{ color: "#71717a", wordBreak: "break-all" }}>{img.src}</span>
                          {img.alt && <span style={{ color: "#a1a1aa" }}> — "{img.alt}"</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={S.card}>
                  <ToggleSection title={`🏗️ Schema — ${scanResult.schemaMarkup ? `${scanResult.schemaTypes.length} type(s) found` : "None detected"}`} open={showSchema} toggle={() => setShowSchema(p => !p)} />
                  {showSchema && (
                    <div style={{ marginTop: 8 }}>
                      {scanResult.schemaTypes.length > 0
                        ? scanResult.schemaTypes.map((t, i) => <div key={i} style={{ fontSize: 13, color: "#86efac", marginBottom: 3 }}>• {t}</div>)
                        : <div style={{ fontSize: 13, color: "#ef4444" }}>No structured data found. Add Article or BlogPosting schema.</div>}

                      {/* Schema Generator */}
                      <div style={{ marginTop: 18, borderTop: "1px solid #27272a", paddingTop: 16 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7", marginBottom: 12 }}>🔧 Generate BlogPosting Schema</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                          <div>
                            <div style={S.metaLabel}>Author Name</div>
                            <input style={S.input} value={schemaAuthorName} onChange={e => setSchemaAuthorName(e.target.value)}
                              placeholder={scanResult.authorMeta || "e.g. Jane Smith"} />
                          </div>
                          <div>
                            <div style={S.metaLabel}>Publisher / Brand Name</div>
                            <input style={S.input} value={schemaPublisherName} onChange={e => setSchemaPublisherName(e.target.value)}
                              placeholder="e.g. My Store Blog" />
                          </div>
                        </div>
                        <button style={S.btn("primary")} onClick={generateSchema} disabled={schemaGenLoading}>
                          {schemaGenLoading ? <><span style={S.spinner} /> Generating…</> : "⚡ Generate BlogPosting JSON-LD (1 credit)"}
                        </button>
                        {generatedSchema && (
                          <div style={{ marginTop: 14 }}>
                            <div style={{ ...S.row, marginBottom: 8, gap: 8 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "#86efac" }}>✅ Schema generated — copy and paste into your blog post &lt;head&gt;</div>
                              <button style={S.btn("ghost")} onClick={() => navigator.clipboard.writeText(generatedSchema.scriptTag)}>📋 Copy</button>
                            </div>
                            <pre style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: 14,
                              fontSize: 11, color: "#d4d4d8", overflowX: "auto", whiteSpace: "pre-wrap", maxHeight: 320, overflowY: "auto" }}>
                              {generatedSchema.scriptTag}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* LLM / AI Optimization Score */}
                <div style={{ ...S.card, borderLeft: llmScore ? `3px solid ${llmScore.score >= 80 ? "#22c55e" : llmScore.score >= 55 ? "#eab308" : "#ef4444"}` : undefined }}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: llmScore ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>🤖 LLM / AI Optimization Score <span style={{ fontSize: 11, fontWeight: 400, color: "#71717a", marginLeft: 6 }}>2026</span></div>
                    <button style={S.btn(llmScore ? undefined : "primary")} onClick={runLlmScore} disabled={llmLoading}>
                      {llmLoading ? <><span style={S.spinner} /> Scoring…</> : llmScore ? "🔄 Re-score" : "Score AI Readability"}
                    </button>
                  </div>
                  {llmErr && <div style={S.err}>{llmErr}</div>}
                  {!llmScore && !llmLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Check how well your content is structured for LLM extraction — the #1 new 2026 signal (Backlinko, Semrush).</div>}
                  {llmScore && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
                        <div style={S.scoreRing(llmScore.score)}>{llmScore.score}</div>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: llmScore.score >= 80 ? "#22c55e" : llmScore.score >= 55 ? "#eab308" : "#ef4444" }}>{llmScore.grade}</div>
                          <div style={{ fontSize: 12, color: "#71717a" }}>{llmScore.passed}/{llmScore.total} signals passed</div>
                        </div>
                      </div>
                      <div>
                        {llmScore.signals.map((s, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1e1e22" }}>
                            <span style={{ fontSize: 16, flexShrink: 0 }}>{s.pass ? "✅" : "❌"}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "#fafafa" }}>{s.name}</div>
                              <div style={{ fontSize: 12, color: "#71717a" }}>{s.value}</div>
                              {!s.pass && <div style={{ fontSize: 12, color: "#fbbf24", marginTop: 3 }}>💡 {s.tip}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Title CTR Signals */}
                <div style={{ ...S.card, borderLeft: ctrSignals ? `3px solid ${ctrSignals.ctrScore >= 70 ? "#22c55e" : ctrSignals.ctrScore >= 45 ? "#eab308" : "#ef4444"}` : undefined }}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: ctrSignals ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>📈 Title CTR Signals</div>
                    <button style={S.btn(ctrSignals ? undefined : "primary")} onClick={runCtrSignals} disabled={ctrLoading}>
                      {ctrLoading ? <><span style={S.spinner} /> Analyzing…</> : ctrSignals ? "🔄 Re-analyze" : "Analyze CTR"}
                    </button>
                  </div>
                  {!ctrSignals && !ctrLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Analyze your title's click-through rate signals — keyword position, emotion, power modifiers, year.</div>}
                  {ctrSignals && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
                        <div style={S.scoreRing(ctrSignals.ctrScore)}>{ctrSignals.ctrScore}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#fafafa", marginBottom: 8 }}>{ctrSignals.title}</div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ ...S.pill(ctrSignals.keywordPosition === "start" ? "low" : ctrSignals.keywordPosition === "not-found" ? "high" : "medium") }}>
                              🔑 Keyword: {ctrSignals.keywordPosition}
                            </span>
                            <span style={{ ...S.pill(ctrSignals.hasYear ? "low" : "medium") }}>
                              📅 Year: {ctrSignals.hasYear ? ctrSignals.yearMatch : "missing"}
                            </span>
                            <span style={{ ...S.pill(ctrSignals.emotionType === "positive" ? "low" : ctrSignals.emotionType === "negative" ? "medium" : "high") }}>
                              {ctrSignals.emotionType === "positive" ? "😊" : ctrSignals.emotionType === "negative" ? "😤" : "😐"} {ctrSignals.emotionType}
                            </span>
                            <span style={{ ...S.pill(ctrSignals.titleLengthOk ? "low" : "high") }}>
                              📏 {ctrSignals.titleLength} chars
                            </span>
                          </div>
                        </div>
                      </div>
                      {ctrSignals.powerModifiers.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={S.heading}>Power Modifiers Found</div>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {ctrSignals.powerModifiers.map((m, i) => <span key={i} style={{ ...S.pill("low"), fontSize: 12, padding: "3px 10px" }}>{m}</span>)}
                          </div>
                        </div>
                      )}
                      {ctrSignals.tips.length > 0 && (
                        <div>
                          <div style={S.heading}>💡 CTR Tips</div>
                          {ctrSignals.tips.map((t, i) => <div key={i} style={{ fontSize: 13, color: "#fbbf24", marginBottom: 5 }}>• {t}</div>)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Technical Audit */}
                <div style={{ ...S.card, borderLeft: techAudit ? `3px solid ${techAudit.score >= 80 ? "#22c55e" : techAudit.score >= 55 ? "#eab308" : "#ef4444"}` : undefined }}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: techAudit || techAuditErr ? 12 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>🔧 Technical SEO Audit {techAudit && <span style={{ fontSize: 12, fontWeight: 700, color: techAudit.score >= 80 ? "#22c55e" : techAudit.score >= 55 ? "#eab308" : "#ef4444" }}>{techAudit.score}/100</span>}</div>
                    <button style={S.btn(techAudit ? undefined : "primary")} onClick={runTechAudit} disabled={techAuditLoading}>
                      {techAuditLoading ? <><span style={S.spinner} /> Auditing…</> : techAudit ? "🔄 Re-audit" : "🔧 Run Audit"}
                    </button>
                  </div>
                  {techAuditErr && <div style={S.err}>{techAuditErr}</div>}
                  {!techAudit && !techAuditLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Canonical tag, HTTPS, URL slug quality, above-the-fold content, image formats + lazy loading, mobile meta description length.</div>}
                  {techAudit && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                      {[
                        { label: "HTTPS", pass: techAudit.https.pass, detail: techAudit.https.tip },
                        { label: "Canonical", pass: techAudit.canonical.pass, detail: techAudit.canonical.tip + (techAudit.canonical.href ? ` (${techAudit.canonical.status})` : "") },
                        { label: "URL Slug", pass: techAudit.urlSlug.pass, detail: `"${techAudit.urlSlug.slug}" — ${techAudit.urlSlug.quality}${techAudit.urlSlug.issues.length ? " · " + techAudit.urlSlug.issues[0] : ""}` },
                        { label: "Above the Fold", pass: techAudit.aboveFold.pass, detail: techAudit.aboveFold.tip },
                        { label: "Images: WebP", pass: techAudit.imageFormats.webpPass, detail: `${techAudit.imageFormats.webp} WebP, ${techAudit.imageFormats.jpg} JPG, ${techAudit.imageFormats.png} PNG of ${techAudit.imageFormats.total} total` },
                        { label: "Images: Lazy Load", pass: techAudit.imageFormats.lazyPass, detail: techAudit.imageFormats.missingLazy > 0 ? `${techAudit.imageFormats.missingLazy} image(s) missing loading="lazy"` : "All images have lazy loading" },
                        { label: "Images: Dimensions", pass: techAudit.imageFormats.dimsPass, detail: techAudit.imageFormats.missingDimensions > 0 ? `${techAudit.imageFormats.missingDimensions} image(s) missing width/height (causes CLS)` : "All images have dimensions set" },
                        { label: "Meta Mobile (≤105 chars)", pass: techAudit.metaMobile.pass, detail: techAudit.metaMobile.tip },
                      ].map((row, i) => (
                        <div key={i} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 14 }}>{row.pass ? "✅" : "❌"}</span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: row.pass ? "#a1a1aa" : "#fafafa" }}>{row.label}</span>
                          </div>
                          <div style={{ fontSize: 12, color: row.pass ? "#52525b" : "#fbbf24" }}>{row.detail}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Article Schema Validator */}
                <div style={{ ...S.card, borderLeft: schemaValid ? `3px solid ${schemaValid.score >= 80 ? "#22c55e" : schemaValid.score >= 55 ? "#eab308" : "#ef4444"}` : undefined }}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: schemaValid || schemaValidErr ? 12 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>🏷️ Article Schema Validator {schemaValid && <span style={{ fontSize: 12, fontWeight: 700, color: schemaValid.score >= 80 ? "#22c55e" : "#eab308" }}>{schemaValid.score}/100</span>}</div>
                    <button style={S.btn(schemaValid ? undefined : "primary")} onClick={runSchemaValidate} disabled={schemaValidLoading}>
                      {schemaValidLoading ? <><span style={S.spinner} /> Validating…</> : schemaValid ? "🔄 Re-validate" : "✅ Validate Schema"}
                    </button>
                  </div>
                  {schemaValidErr && <div style={S.err}>{schemaValidErr}</div>}
                  {!schemaValid && !schemaValidLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Validate existing Article/BlogPosting JSON-LD against Google's required fields (headline, image, author.@type, datePublished, publisher…).</div>}
                  {schemaValid && !schemaValid.found && (
                    <div>
                      <div style={{ fontSize: 14, color: "#ef4444", marginBottom: 8 }}>❌ No Article/BlogPosting schema found on this page.</div>
                      <div style={{ fontSize: 13, color: "#71717a" }}>{schemaValid.tip}</div>
                      <div style={{ marginTop: 10 }}>
                        <span style={{ fontSize: 12, color: "#818cf8", cursor: "pointer" }} onClick={() => setShowSchema(true)}>→ Use the Schema Generator above to create one</span>
                      </div>
                    </div>
                  )}
                  {schemaValid?.found && (
                    <div>
                      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
                        <MetaChip label="Type" value={schemaValid.type} />
                        <MetaChip label="Required" value={`${schemaValid.requiredPassed}/${schemaValid.totalRequired}`} color={schemaValid.requiredPassed === schemaValid.totalRequired ? "#22c55e" : "#ef4444"} />
                        <MetaChip label="Score" value={schemaValid.score} color={schemaValid.score >= 80 ? "#22c55e" : schemaValid.score >= 55 ? "#eab308" : "#ef4444"} />
                        {schemaValid.missingRequired.length > 0 && <MetaChip label="Missing Required" value={schemaValid.missingRequired.length} color="#ef4444" />}
                      </div>
                      <div>
                        {schemaValid.fields.map((f, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "6px 0", borderBottom: "1px solid #1e1e22", fontSize: 12 }}>
                            <span>{f.present ? "✅" : f.required ? "❌" : "⚠️"}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: f.present ? "#a1a1aa" : f.required ? "#ef4444" : "#eab308" }}>
                                {f.name} {f.required ? <span style={{ color: "#71717a", fontWeight: 400 }}>(required)</span> : <span style={{ color: "#3f3f46", fontWeight: 400 }}>(recommended)</span>}
                              </div>
                              {f.value && <div style={{ color: "#71717a", marginTop: 2, wordBreak: "break-all" }}>{f.value}</div>}
                              {!f.present && <div style={{ color: "#fbbf24", marginTop: 2 }}>💡 {f.tip}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Advanced Readability */}
                <div style={{ ...S.card, borderLeft: advReadability ? `3px solid ${advReadability.score >= 80 ? "#22c55e" : advReadability.score >= 55 ? "#eab308" : "#ef4444"}` : undefined }}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: advReadability ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>✍️ Advanced Readability {advReadability && <span style={{ fontSize: 12, fontWeight: 700, color: advReadability.score >= 80 ? "#22c55e" : advReadability.score >= 55 ? "#eab308" : "#ef4444" }}>{advReadability.grade}</span>}</div>
                    <button style={S.btn(advReadability ? undefined : "primary")} onClick={runAdvReadability} disabled={advReadLoading}>
                      {advReadLoading ? <><span style={S.spinner} /> Analyzing…</> : advReadability ? "🔄 Re-analyze" : "📖 Analyze"}
                    </button>
                  </div>
                  {!advReadability && !advReadLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Sentence length, paragraph length, transition words, passive voice — beyond Flesch-Kincaid.</div>}
                  {advReadability && (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10, marginBottom: 14 }}>
                        {[
                          { label: "Avg Sentence", value: `${advReadability.avgSentenceLen} words`, pass: advReadability.avgSentenceLen <= 20 },
                          { label: "Long Sentences", value: `${advReadability.longSentencePct}%`, pass: advReadability.longSentencePct <= 20 },
                          { label: "Avg Paragraph", value: `${advReadability.avgParaLen} words`, pass: advReadability.avgParaLen <= 100 },
                          { label: "Long Paragraphs", value: advReadability.longParaCount, pass: advReadability.longParaCount <= 2 },
                          { label: "Transition Words", value: `${advReadability.transitionWordPct}%`, pass: advReadability.transitionWordPct >= 30 },
                          { label: "Passive Voice", value: `${advReadability.passiveVoicePct}%`, pass: advReadability.passiveVoicePct <= 10 },
                        ].map((m, i) => (
                          <div key={i} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: m.pass ? "#22c55e" : "#ef4444" }}>{m.value}</div>
                            <div style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>{m.label}</div>
                            <div style={{ fontSize: 10, marginTop: 4 }}>{m.pass ? "✅ Good" : "⚠️ Review"}</div>
                          </div>
                        ))}
                      </div>
                      {advReadability.issues.length > 0 && (
                        <div>
                          {advReadability.issues.map((issue, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 0", borderBottom: "1px solid #1e1e22" }}>
                              <span style={S.pill(issue.sev)}>{issue.sev}</span>
                              <span style={{ fontSize: 13, color: "#d4d4d8" }}>{issue.msg}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Internal Link Suggestions */}
                <div style={{ ...S.card, borderLeft: intLinks ? "3px solid #818cf8" : undefined }}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: intLinks || intLinksErr ? 12 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>🔗 AI Internal Link Suggestions <span style={{ fontSize: 11, fontWeight: 400, color: "#71717a", marginLeft: 4 }}>2 credits</span></div>
                    <button style={S.btn(intLinks ? undefined : "primary")} onClick={runIntLinks} disabled={intLinksLoading}>
                      {intLinksLoading ? <><span style={S.spinner} /> Generating…</> : intLinks ? "🔄 Regenerate" : "💡 Get Suggestions"}
                    </button>
                  </div>
                  {intLinksErr && <div style={S.err}>{intLinksErr}</div>}
                  {!intLinks && !intLinksLoading && <div style={{ fontSize: 13, color: "#52525b" }}>AI suggests contextual internal link opportunities — anchor text, context sentences, and target topics.</div>}
                  {intLinks && (
                    <div>
                      {intLinks.tip && <div style={{ fontSize: 13, color: "#93c5fd", marginBottom: 12, padding: "8px 12px", background: "#0c1a2e", borderRadius: 8 }}>💡 {intLinks.tip}</div>}
                      {(intLinks.suggestions || []).map((s, i) => (
                        <div key={i} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "12px 14px", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span style={{ ...S.pill("low"), fontSize: 11 }}>{s.placement}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#818cf8" }}>{s.anchorText}</span>
                            <button style={{ ...S.btn(), fontSize: 11, padding: "2px 8px", marginLeft: "auto" }} onClick={() => navigator.clipboard.writeText(s.anchorText)}>Copy</button>
                          </div>
                          <div style={{ fontSize: 12, color: "#d4d4d8", fontStyle: "italic", marginBottom: 4 }}>"{s.contextSentence}"</div>
                          <div style={{ fontSize: 12, color: "#71717a" }}>Target: <span style={{ color: "#a1a1aa" }}>{s.targetTopic}</span> · {s.rationale}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Core Web Vitals ── */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: cwvResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>⚡ Core Web Vitals (PageSpeed)</div>
                    <button style={S.btn(cwvResult ? undefined : "primary")} onClick={runCoreWebVitals} disabled={cwvLoading || !url.trim()}>
                      {cwvLoading ? <><span style={S.spinner} /> Checking…</> : cwvResult ? "🔄 Re-check" : "Check CWV"}
                    </button>
                  </div>
                  {!cwvResult && !cwvLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Fetch LCP, CLS, FID, INP, FCP scores from Google PageSpeed Insights API for mobile.</div>}
                  {cwvErr && <div style={S.err}>{cwvErr}</div>}
                  {cwvResult && (
                    <div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                        {(cwvResult.metrics || []).map((m, i) => {
                          const color = m.rating === "good" ? "#22c55e" : m.rating === "needs-improvement" ? "#eab308" : "#ef4444";
                          return (
                            <div key={i} style={{ background: "#09090b", border: `1px solid ${color}33`, borderRadius: 10, padding: "12px 16px", minWidth: 110, textAlign: "center" }}>
                              <div style={{ fontSize: 20, fontWeight: 800, color }}>{m.displayValue}</div>
                              <div style={{ fontSize: 11, color: "#71717a", marginTop: 4 }}>{m.name}</div>
                              <div style={{ fontSize: 10, color, marginTop: 2, fontWeight: 700, textTransform: "uppercase" }}>{m.rating}</div>
                            </div>
                          );
                        })}
                      </div>
                      {cwvResult.performanceScore !== undefined && (
                        <div style={{ fontSize: 13, color: "#a1a1aa" }}>Overall Performance Score: <strong style={{ color: cwvResult.performanceScore >= 90 ? "#22c55e" : cwvResult.performanceScore >= 50 ? "#eab308" : "#ef4444" }}>{cwvResult.performanceScore}</strong></div>
                      )}
                      {cwvResult.note && <div style={{ fontSize: 12, color: "#71717a", marginTop: 6 }}>{cwvResult.note}</div>}
                    </div>
                  )}
                </div>

                {/* ── AI Crawler Access Audit ── */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: crawlerResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>🤖 AI Crawler Access Audit</div>
                    <button style={S.btn(crawlerResult ? undefined : "primary")} onClick={runCrawlerAccess} disabled={crawlerLoading || !url.trim()}>
                      {crawlerLoading ? <><span style={S.spinner} /> Checking…</> : crawlerResult ? "🔄 Re-check" : "Audit Crawlers"}
                    </button>
                  </div>
                  {!crawlerResult && !crawlerLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Check if GPTBot, ClaudeBot, PerplexityBot, Google-Extended, and 6 other crawlers can access your content.</div>}
                  {crawlerErr && <div style={S.err}>{crawlerErr}</div>}
                  {crawlerResult && (
                    <div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                        <span style={{ fontSize: 13, color: "#22c55e", fontWeight: 700 }}>✅ Allowed: {crawlerResult.summary?.allowed ?? 0}</span>
                        <span style={{ fontSize: 13, color: "#ef4444", fontWeight: 700 }}>🚫 Blocked: {crawlerResult.summary?.blocked ?? 0}</span>
                      </div>
                      <table style={S.table}>
                        <thead><tr><th style={S.th}>Crawler</th><th style={S.th}>Type</th><th style={S.th}>Status</th></tr></thead>
                        <tbody>
                          {(crawlerResult.crawlers || []).map((c, i) => (
                            <tr key={i}>
                              <td style={S.td}>{c.agent}</td>
                              <td style={S.td}><span style={S.pill("low")}>{c.type}</span></td>
                              <td style={S.td}><span style={{ color: c.allowed ? "#22c55e" : "#ef4444", fontWeight: 700 }}>{c.allowed ? "✅ Allowed" : "🚫 Blocked"}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {crawlerResult.recommendation && <div style={{ marginTop: 10, fontSize: 13, color: "#fbbf24" }}>💡 {crawlerResult.recommendation}</div>}
                    </div>
                  )}
                </div>

                {/* ── Title ↔ H1 Alignment ── */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: titleH1Result ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>🔀 Title ↔ H1 Alignment</div>
                    <button style={S.btn(titleH1Result ? undefined : "primary")} onClick={runTitleH1} disabled={titleH1Loading || !scanResult}>
                      {titleH1Loading ? <><span style={S.spinner} /> Checking…</> : titleH1Result ? "🔄 Re-check" : "Check Alignment"}
                    </button>
                  </div>
                  {!titleH1Result && !titleH1Loading && <div style={{ fontSize: 13, color: "#52525b" }}>Compare your title tag vs H1 — significant divergence increases Google rewrite risk.</div>}
                  {titleH1Result && (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                        <div style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: 12 }}>
                          <div style={S.metaLabel}>Title Tag</div>
                          <div style={{ fontSize: 13, color: "#fafafa", marginTop: 4 }}>{titleH1Result.title || "—"}</div>
                        </div>
                        <div style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: 12 }}>
                          <div style={S.metaLabel}>H1 Tag</div>
                          <div style={{ fontSize: 13, color: "#fafafa", marginTop: 4 }}>{titleH1Result.h1 || "—"}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 10 }}>
                        <span style={{ fontSize: 13 }}>Similarity: <strong style={{ color: titleH1Result.similarity >= 70 ? "#22c55e" : titleH1Result.similarity >= 40 ? "#eab308" : "#ef4444" }}>{titleH1Result.similarity}%</strong></span>
                        <span style={{ fontSize: 13 }}>Google Rewrite Risk: <strong style={{ color: titleH1Result.rewriteRisk === "Low" ? "#22c55e" : titleH1Result.rewriteRisk === "Medium" ? "#eab308" : "#ef4444" }}>{titleH1Result.rewriteRisk}</strong></span>
                      </div>
                      {titleH1Result.tip && <div style={{ fontSize: 13, color: "#fbbf24" }}>💡 {titleH1Result.tip}</div>}
                    </div>
                  )}
                </div>

                {/* ── Heading Hierarchy ── */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: headingHierResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>🏗️ Heading Hierarchy Validator</div>
                    <button style={S.btn(headingHierResult ? undefined : "primary")} onClick={runHeadingHier} disabled={headingHierLoading || !scanResult}>
                      {headingHierLoading ? <><span style={S.spinner} /> Checking…</> : headingHierResult ? "🔄 Re-check" : "Validate"}
                    </button>
                  </div>
                  {!headingHierResult && !headingHierLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Detect skipped heading levels (e.g. H2→H4), multiple H1s, and empty headings.</div>}
                  {headingHierResult && (
                    <div>
                      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 10 }}>
                        <span style={{ fontSize: 13 }}>H1 count: <strong style={{ color: headingHierResult.h1Count === 1 ? "#22c55e" : "#ef4444" }}>{headingHierResult.h1Count}</strong></span>
                        <span style={{ fontSize: 13 }}>Skipped levels: <strong style={{ color: headingHierResult.skippedLevels?.length ? "#ef4444" : "#22c55e" }}>{headingHierResult.skippedLevels?.length ?? 0}</strong></span>
                        <span style={{ fontSize: 13 }}>Empty headings: <strong style={{ color: headingHierResult.emptyHeadings?.length ? "#ef4444" : "#22c55e" }}>{headingHierResult.emptyHeadings?.length ?? 0}</strong></span>
                      </div>
                      {headingHierResult.issues?.length > 0 && headingHierResult.issues.map((iss, i) => (
                        <div key={i} style={{ fontSize: 13, color: "#fbbf24", marginBottom: 4 }}>⚠️ {iss}</div>
                      ))}
                      {!headingHierResult.issues?.length && <div style={{ fontSize: 13, color: "#22c55e" }}>✅ Heading structure looks good!</div>}
                    </div>
                  )}
                </div>

                {/* ── Image SEO Audit ── */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: imageSeoResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>🖼️ Image SEO Audit</div>
                    <button style={S.btn(imageSeoResult ? undefined : "primary")} onClick={runImageSeo} disabled={imageSeoLoading || !scanResult}>
                      {imageSeoLoading ? <><span style={S.spinner} /> Auditing…</> : imageSeoResult ? "🔄 Re-audit" : "Audit Images"}
                    </button>
                  </div>
                  {!imageSeoResult && !imageSeoLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Check alt text, lazy loading, generic filenames, and CLS prevention (width/height).</div>}
                  {imageSeoResult && (
                    <div>
                      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 12 }}>
                        <span style={{ fontSize: 13 }}>Total: <strong>{imageSeoResult.total}</strong></span>
                        <span style={{ fontSize: 13 }}>Missing Alt: <strong style={{ color: imageSeoResult.missingAlt > 0 ? "#ef4444" : "#22c55e" }}>{imageSeoResult.missingAlt}</strong></span>
                        <span style={{ fontSize: 13 }}>No Lazy Load: <strong style={{ color: imageSeoResult.missingLazy > 0 ? "#eab308" : "#22c55e" }}>{imageSeoResult.missingLazy}</strong></span>
                        <span style={{ fontSize: 13 }}>Generic Names: <strong style={{ color: imageSeoResult.genericNames > 0 ? "#eab308" : "#22c55e" }}>{imageSeoResult.genericNames}</strong></span>
                      </div>
                      <div style={{ maxHeight: 260, overflowY: "auto" }}>
                        {(imageSeoResult.images || []).map((img, i) => (
                          <div key={i} style={{ fontSize: 12, padding: "5px 0", borderBottom: "1px solid #1e1e22", color: "#d4d4d8" }}>
                            <span style={S.pill(img.hasAlt ? "low" : "high")}>{img.hasAlt ? "ALT ✅" : "ALT ❌"}</span>
                            <span style={S.pill(img.hasLazy ? "low" : "medium")}>{img.hasLazy ? "LAZY ✅" : "LAZY ❌"}</span>
                            <span style={{ color: "#71717a", wordBreak: "break-all" }}>{img.src}</span>
                            {img.alt && <span style={{ color: "#a1a1aa" }}> — "{img.alt}"</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Semantic HTML Checker ── */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: semanticHtmlResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>🧱 Semantic HTML Checker</div>
                    <button style={S.btn(semanticHtmlResult ? undefined : "primary")} onClick={runSemanticHtml} disabled={semanticHtmlLoading || !scanResult}>
                      {semanticHtmlLoading ? <><span style={S.spinner} /> Checking…</> : semanticHtmlResult ? "🔄 Re-check" : "Check HTML"}
                    </button>
                  </div>
                  {!semanticHtmlResult && !semanticHtmlLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Detect semantic HTML5 tags: article, main, header, nav, footer, figure, time, address.</div>}
                  {semanticHtmlResult && (
                    <div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {(semanticHtmlResult.tags || []).map((tag, i) => (
                          <div key={i} style={{ background: tag.found ? "#14532d22" : "#450a0a22", border: `1px solid ${tag.found ? "#14532d" : "#7f1d1d"}`, borderRadius: 8, padding: "8px 14px", fontSize: 13, color: tag.found ? "#86efac" : "#fca5a5" }}>
                            {tag.found ? "✅" : "❌"} &lt;{tag.name}&gt;
                          </div>
                        ))}
                      </div>
                      {semanticHtmlResult.score !== undefined && <div style={{ marginTop: 10, fontSize: 13, color: "#a1a1aa" }}>Semantic score: <strong style={{ color: semanticHtmlResult.score >= 6 ? "#22c55e" : semanticHtmlResult.score >= 4 ? "#eab308" : "#ef4444" }}>{semanticHtmlResult.score}/{semanticHtmlResult.total}</strong></div>}
                    </div>
                  )}
                </div>

                {/* ── Meta Description Audit ── */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: metaDescAuditResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>📝 Meta Description Audit</div>
                    <button style={S.btn(metaDescAuditResult ? undefined : "primary")} onClick={runMetaDescAudit} disabled={metaDescAuditLoading || !scanResult}>
                      {metaDescAuditLoading ? <><span style={S.spinner} /> Auditing…</> : metaDescAuditResult ? "🔄 Re-audit" : "Audit Meta Desc"}
                    </button>
                  </div>
                  {!metaDescAuditResult && !metaDescAuditLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Length, keyword presence, CTA detection, and og:description consistency check.</div>}
                  {metaDescAuditResult && (
                    <div>
                      <div style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 13, color: "#fafafa" }}>{metaDescAuditResult.metaDescription || "(no meta description)"}</div>
                      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 10 }}>
                        <span style={{ fontSize: 13 }}>Length: <strong style={{ color: metaDescAuditResult.lengthOk ? "#22c55e" : "#ef4444" }}>{metaDescAuditResult.length} chars</strong></span>
                        <span style={{ fontSize: 13 }}>Keyword: <strong style={{ color: metaDescAuditResult.hasKeyword ? "#22c55e" : "#eab308" }}>{metaDescAuditResult.hasKeyword ? "✅ Found" : "❌ Missing"}</strong></span>
                        <span style={{ fontSize: 13 }}>CTA: <strong style={{ color: metaDescAuditResult.hasCta ? "#22c55e" : "#71717a" }}>{metaDescAuditResult.hasCta ? "✅ Found" : "—"}</strong></span>
                        <span style={{ fontSize: 13 }}>OG Match: <strong style={{ color: metaDescAuditResult.ogMatch ? "#22c55e" : "#eab308" }}>{metaDescAuditResult.ogMatch ? "✅" : "⚠️ Mismatch"}</strong></span>
                      </div>
                      {metaDescAuditResult.tips?.map((t, i) => <div key={i} style={{ fontSize: 13, color: "#fbbf24", marginBottom: 4 }}>💡 {t}</div>)}
                    </div>
                  )}
                </div>

                {/* ── Keyword Density Heatmap ── */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: kwDensityResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>🔑 Keyword Density Heatmap</div>
                    <button style={S.btn(kwDensityResult ? undefined : "primary")} onClick={runKwDensity} disabled={kwDensityLoading || !scanResult || !kwInput.trim()}>
                      {kwDensityLoading ? <><span style={S.spinner} /> Analyzing…</> : kwDensityResult ? "🔄 Re-analyze" : "Analyze Density"}
                    </button>
                  </div>
                  {!kwInput.trim() && <div style={{ fontSize: 12, color: "#eab308" }}>⚠️ Enter a target keyword above first.</div>}
                  {!kwDensityResult && !kwDensityLoading && kwInput.trim() && <div style={{ fontSize: 13, color: "#52525b" }}>Per-section keyword density with stuffing/underuse detection.</div>}
                  {kwDensityResult && (
                    <div>
                      <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 10 }}>Overall density: <strong style={{ color: kwDensityResult.overallDensity >= 0.5 && kwDensityResult.overallDensity <= 3 ? "#22c55e" : "#ef4444" }}>{kwDensityResult.overallDensity}%</strong> · {kwDensityResult.overallCount} occurrences in {kwDensityResult.totalWords} words</div>
                      <table style={S.table}>
                        <thead><tr><th style={S.th}>Section</th><th style={S.th}>Words</th><th style={S.th}>Density</th><th style={S.th}>Status</th></tr></thead>
                        <tbody>
                          {(kwDensityResult.sections || []).map((sec, i) => (
                            <tr key={i}>
                              <td style={S.td}>{sec.heading || "(intro)"}</td>
                              <td style={S.td}>{sec.wordCount}</td>
                              <td style={{ ...S.td, color: sec.density >= 0.5 && sec.density <= 3 ? "#22c55e" : sec.density > 3 ? "#ef4444" : "#eab308" }}>{sec.density}%</td>
                              <td style={S.td}><span style={S.pill(sec.status === "stuffed" ? "high" : sec.status === "low" ? "medium" : "low")}>{sec.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* ── Index Directives ── */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: indexDirectivesResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>🚫 Index Directives Audit</div>
                    <button style={S.btn(indexDirectivesResult ? undefined : "primary")} onClick={runIndexDirectives} disabled={indexDirectivesLoading || !scanResult}>
                      {indexDirectivesLoading ? <><span style={S.spinner} /> Checking…</> : indexDirectivesResult ? "🔄 Re-check" : "Audit Directives"}
                    </button>
                  </div>
                  {!indexDirectivesResult && !indexDirectivesLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Check noindex/nofollow meta, canonical, x-robots-tag header directives.</div>}
                  {indexDirectivesResult && (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 10 }}>
                        {(indexDirectivesResult.directives || []).map((d, i) => (
                          <div key={i} style={{ background: d.isBlocking ? "#450a0a22" : "#09090b", border: `1px solid ${d.isBlocking ? "#7f1d1d" : "#27272a"}`, borderRadius: 8, padding: "10px 14px" }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: d.isBlocking ? "#fca5a5" : "#a1a1aa" }}>{d.name}</div>
                            <div style={{ fontSize: 12, color: "#71717a", marginTop: 4 }}>{d.value || "Not set"}</div>
                            {d.isBlocking && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>⚠️ This may block indexing</div>}
                          </div>
                        ))}
                      </div>
                      {indexDirectivesResult.recommendation && <div style={{ marginTop: 10, fontSize: 13, color: "#fbbf24" }}>💡 {indexDirectivesResult.recommendation}</div>}
                    </div>
                  )}
                </div>

                {/* ── Content Structure Score ── */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: contentStructResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>📐 Content Structure Score</div>
                    <button style={S.btn(contentStructResult ? undefined : "primary")} onClick={runContentStruct} disabled={contentStructLoading || !scanResult}>
                      {contentStructLoading ? <><span style={S.spinner} /> Analyzing…</> : contentStructResult ? "🔄 Re-analyze" : "Analyze Structure"}
                    </button>
                  </div>
                  {!contentStructResult && !contentStructLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Score lists, tables, images, bullets, and ToC — structured content ranks better.</div>}
                  {contentStructResult && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
                        <div style={S.scoreRing(contentStructResult.score)}>{contentStructResult.score}</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          {(contentStructResult.elements || []).map((el, i) => (
                            <span key={i} style={{ fontSize: 12, color: "#d4d4d8" }}>{el.name}: <strong style={{ color: el.count > 0 ? "#22c55e" : "#71717a" }}>{el.count}</strong></span>
                          ))}
                        </div>
                      </div>
                      {contentStructResult.tips?.map((t, i) => <div key={i} style={{ fontSize: 13, color: "#fbbf24", marginBottom: 4 }}>💡 {t}</div>)}
                    </div>
                  )}
                </div>

                {/* ── Author Authority (E-E-A-T) ── */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: authorAuthResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>✍️ Author Authority Check (E-E-A-T)</div>
                    <button style={S.btn(authorAuthResult ? undefined : "primary")} onClick={runAuthorAuth} disabled={authorAuthLoading || !scanResult}>
                      {authorAuthLoading ? <><span style={S.spinner} /> Checking…</> : authorAuthResult ? "🔄 Re-check" : "Check Authority"}
                    </button>
                  </div>
                  {!authorAuthResult && !authorAuthLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Detect author bio, bylines, author page links, datePublished, and author schema.</div>}
                  {authorAuthResult && (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 10, marginBottom: 12 }}>
                        {(authorAuthResult.signals || []).map((sig, i) => (
                          <div key={i} style={{ background: sig.found ? "#14532d22" : "#450a0a22", border: `1px solid ${sig.found ? "#14532d" : "#7f1d1d"}`, borderRadius: 8, padding: "10px 12px" }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: sig.found ? "#86efac" : "#fca5a5" }}>{sig.found ? "✅" : "❌"} {sig.name}</div>
                            {sig.value && <div style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>{sig.value}</div>}
                          </div>
                        ))}
                      </div>
                      {authorAuthResult.score !== undefined && <div style={{ fontSize: 13, color: "#a1a1aa" }}>E-E-A-T Score: <strong style={{ color: authorAuthResult.score >= 4 ? "#22c55e" : authorAuthResult.score >= 2 ? "#eab308" : "#ef4444" }}>{authorAuthResult.score}/{authorAuthResult.total}</strong></div>}
                    </div>
                  )}
                </div>

                {/* ── XML Sitemap Check ── */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: sitemapResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>🗺️ XML Sitemap Check</div>
                    <button style={S.btn(sitemapResult ? undefined : "primary")} onClick={runSitemap} disabled={sitemapLoading || !scanResult}>
                      {sitemapLoading ? <><span style={S.spinner} /> Checking…</> : sitemapResult ? "🔄 Re-check" : "Check Sitemap"}
                    </button>
                  </div>
                  {!sitemapResult && !sitemapLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Detect sitemap.xml and verify this URL is included for Google indexing.</div>}
                  {sitemapResult && (
                    <div>
                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 10 }}>
                        <span style={{ fontSize: 13 }}>Sitemap found: <strong style={{ color: sitemapResult.sitemapFound ? "#22c55e" : "#ef4444" }}>{sitemapResult.sitemapFound ? "✅ Yes" : "❌ No"}</strong></span>
                        {sitemapResult.sitemapFound && <span style={{ fontSize: 13 }}>URL included: <strong style={{ color: sitemapResult.urlIncluded ? "#22c55e" : "#ef4444" }}>{sitemapResult.urlIncluded ? "✅ Yes" : "❌ No"}</strong></span>}
                        {sitemapResult.urlCount && <span style={{ fontSize: 13, color: "#71717a" }}>{sitemapResult.urlCount} URLs in sitemap</span>}
                      </div>
                      {sitemapResult.sitemapUrl && <div style={{ fontSize: 12, color: "#71717a" }}>Sitemap: {sitemapResult.sitemapUrl}</div>}
                      {sitemapResult.tip && <div style={{ fontSize: 13, color: "#fbbf24", marginTop: 8 }}>💡 {sitemapResult.tip}</div>}
                    </div>
                  )}
                </div>

                {/* ── OG Tag Validator ── */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: ogValidResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>📤 OG & Social Card Validator</div>
                    <button style={S.btn(ogValidResult ? undefined : "primary")} onClick={runOgValid} disabled={ogValidLoading || !scanResult}>
                      {ogValidLoading ? <><span style={S.spinner} /> Validating…</> : ogValidResult ? "🔄 Re-validate" : "Validate OG Tags"}
                    </button>
                  </div>
                  {!ogValidResult && !ogValidLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Full OG + Twitter Card audit. Validates og:image is accessible.</div>}
                  {ogValidResult && (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 8, marginBottom: 12 }}>
                        {(ogValidResult.tags || []).map((tag, i) => (
                          <div key={i} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "8px 12px" }}>
                            <div style={{ fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase" }}>{tag.name}</div>
                            <div style={{ fontSize: 12, color: tag.present ? "#fafafa" : "#ef4444", marginTop: 2 }}>{tag.present ? (tag.value || "Set ✅").slice(0, 80) : "❌ Missing"}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 10 }}>
                        <span style={{ fontSize: 13 }}>OG Score: <strong style={{ color: ogValidResult.score >= 80 ? "#22c55e" : ogValidResult.score >= 50 ? "#eab308" : "#ef4444" }}>{ogValidResult.score}/100</strong></span>
                        {ogValidResult.imageOk !== undefined && <span style={{ fontSize: 13 }}>Image reachable: <strong style={{ color: ogValidResult.imageOk ? "#22c55e" : "#ef4444" }}>{ogValidResult.imageOk ? "✅" : "❌"}</strong></span>}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Schema Generators ── */}
                <div style={S.card}>
                  <div style={S.cardTitle}>🔧 Additional Schema Generators</div>

                  {/* Breadcrumb */}
                  <div style={{ borderBottom: "1px solid #27272a", paddingBottom: 14, marginBottom: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#e4e4e7" }}>🍞 BreadcrumbList Schema</div>
                    <button style={S.btn(breadcrumbResult ? undefined : "primary")} onClick={runBreadcrumb} disabled={breadcrumbLoading || !scanResult}>
                      {breadcrumbLoading ? <><span style={S.spinner} /> Generating…</> : breadcrumbResult ? "🔄 Regenerate" : "Generate Breadcrumb JSON-LD"}
                    </button>
                    {breadcrumbResult && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ ...S.row, gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: "#86efac" }}>✅ {breadcrumbResult.breadcrumbs?.length} breadcrumb items generated</span>
                          <button style={{ ...S.btn(), fontSize: 11, padding: "3px 10px" }} onClick={() => navigator.clipboard.writeText(breadcrumbResult.scriptTag || "")}>📋 Copy</button>
                        </div>
                        <pre style={{ ...S.fixCode, maxHeight: 180 }}>{breadcrumbResult.scriptTag}</pre>
                      </div>
                    )}
                  </div>

                  {/* HowTo */}
                  <div style={{ borderBottom: "1px solid #27272a", paddingBottom: 14, marginBottom: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#e4e4e7" }}>📋 HowTo Schema (AI) <span style={{ fontSize: 11, color: "#71717a", fontWeight: 400 }}>2 credits</span></div>
                    <div style={{ ...S.row, gap: 8, marginBottom: 8 }}>
                      <input style={S.input} placeholder="HowTo title (e.g. How to set up Shopify email automation)" value={howtoTitle} onChange={e => setHowtoTitle(e.target.value)} />
                      <button style={S.btn("primary")} onClick={runHowto} disabled={howtoLoading || !howtoTitle.trim()}>
                        {howtoLoading ? <><span style={S.spinner} /> Generating…</> : "Generate"}
                      </button>
                    </div>
                    {howtoResult && (
                      <div>
                        <div style={{ ...S.row, gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: "#86efac" }}>✅ {howtoResult.stepCount} steps generated</span>
                          <button style={{ ...S.btn(), fontSize: 11, padding: "3px 10px" }} onClick={() => navigator.clipboard.writeText(howtoResult.scriptTag || "")}>📋 Copy</button>
                        </div>
                        <pre style={{ ...S.fixCode, maxHeight: 180 }}>{howtoResult.scriptTag}</pre>
                      </div>
                    )}
                  </div>

                  {/* Video Schema */}
                  <div style={{ borderBottom: "1px solid #27272a", paddingBottom: 14, marginBottom: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#e4e4e7" }}>🎥 VideoObject Schema</div>
                    <button style={S.btn(videoSchemaResult ? undefined : "primary")} onClick={runVideoSchema} disabled={videoSchemaLoading || !scanResult}>
                      {videoSchemaLoading ? <><span style={S.spinner} /> Detecting…</> : videoSchemaResult ? "🔄 Regenerate" : "Detect Videos + Generate Schema"}
                    </button>
                    {videoSchemaResult && !videoSchemaResult.embeds?.length && <div style={{ fontSize: 13, color: "#71717a", marginTop: 8 }}>No YouTube/Vimeo embeds found on this page.</div>}
                    {videoSchemaResult?.embeds?.length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 12, color: "#86efac", marginBottom: 6 }}>✅ {videoSchemaResult.embeds.length} video embed(s) found</div>
                        <button style={{ ...S.btn(), fontSize: 11, padding: "3px 10px" }} onClick={() => navigator.clipboard.writeText(videoSchemaResult.scriptTag || "")}>📋 Copy JSON-LD</button>
                        <pre style={{ ...S.fixCode, maxHeight: 180, marginTop: 8 }}>{videoSchemaResult.scriptTag}</pre>
                      </div>
                    )}
                  </div>

                  {/* Review Schema */}
                  <div style={{ borderBottom: "1px solid #27272a", paddingBottom: 14, marginBottom: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#e4e4e7" }}>⭐ Review / AggregateRating Schema</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, marginBottom: 8 }}>
                      <input style={S.input} placeholder="Item name (e.g. Shopify Dropshipping Course)" value={reviewName} onChange={e => setReviewName(e.target.value)} />
                      <input style={{ ...S.input, maxWidth: 90 }} placeholder="Rating" value={reviewRating} onChange={e => setReviewRating(e.target.value)} />
                      <input style={{ ...S.input, maxWidth: 90 }} placeholder="Reviews" value={reviewCount} onChange={e => setReviewCount(e.target.value)} />
                    </div>
                    <button style={S.btn("primary")} onClick={runReviewSchema} disabled={reviewLoading || !reviewName.trim()}>
                      {reviewLoading ? <><span style={S.spinner} /> Generating…</> : "Generate Review Schema"}
                    </button>
                    {reviewResult && (
                      <div style={{ marginTop: 10 }}>
                        <button style={{ ...S.btn(), fontSize: 11, padding: "3px 10px" }} onClick={() => navigator.clipboard.writeText(reviewResult.scriptTag || "")}>📋 Copy JSON-LD</button>
                        <pre style={{ ...S.fixCode, maxHeight: 180, marginTop: 8 }}>{reviewResult.scriptTag}</pre>
                      </div>
                    )}
                  </div>

                  {/* Organization Schema */}
                  <div style={{ borderBottom: "1px solid #27272a", paddingBottom: 14, marginBottom: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#e4e4e7" }}>🏢 Organization Schema</div>
                    <div style={{ ...S.row, gap: 8, marginBottom: 8 }}>
                      <input style={S.input} placeholder="Organization / brand name" value={orgName} onChange={e => setOrgName(e.target.value)} />
                      <input style={S.input} placeholder="Website URL" value={orgUrl} onChange={e => setOrgUrl(e.target.value)} />
                      <button style={S.btn("primary")} onClick={runOrgSchema} disabled={orgLoading || !orgName.trim()}>
                        {orgLoading ? <><span style={S.spinner} /> Generating…</> : "Generate"}
                      </button>
                    </div>
                    {orgResult && (
                      <div>
                        <button style={{ ...S.btn(), fontSize: 11, padding: "3px 10px" }} onClick={() => navigator.clipboard.writeText(orgResult.scriptTag || "")}>📋 Copy JSON-LD</button>
                        <pre style={{ ...S.fixCode, maxHeight: 150, marginTop: 8 }}>{orgResult.scriptTag}</pre>
                      </div>
                    )}
                  </div>

                  {/* Speakable Schema */}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#e4e4e7" }}>🔊 Speakable Schema (Voice Search)</div>
                    <button style={S.btn(speakableResult ? undefined : "primary")} onClick={runSpeakable} disabled={speakableLoading || !scanResult}>
                      {speakableLoading ? <><span style={S.spinner} /> Generating…</> : speakableResult ? "🔄 Regenerate" : "Generate Speakable Schema"}
                    </button>
                    {speakableResult && (
                      <div style={{ marginTop: 10 }}>
                        <button style={{ ...S.btn(), fontSize: 11, padding: "3px 10px" }} onClick={() => navigator.clipboard.writeText(speakableResult.scriptTag || "")}>📋 Copy JSON-LD</button>
                        <pre style={{ ...S.fixCode, maxHeight: 150, marginTop: 8 }}>{speakableResult.scriptTag}</pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Search Intent Classifier ── */}
                <div style={S.card}>
                  <div style={S.cardTitle}>🎯 Search Intent Classifier <span style={{ fontSize: 11, color: "#71717a", fontWeight: 400 }}>2 credits</span></div>
                  <div style={{ ...S.row, gap: 8, marginBottom: 8 }}>
                    <input style={S.input} placeholder="Keyword to classify (e.g. best email marketing apps)" value={intentKeyword} onChange={e => setIntentKeyword(e.target.value)} onKeyDown={e => e.key === "Enter" && !intentLoading && runIntent()} />
                    <button style={S.btn("primary")} onClick={runIntent} disabled={intentLoading || !intentKeyword.trim()}>
                      {intentLoading ? <><span style={S.spinner} /> Classifying…</> : "Classify Intent"}
                    </button>
                  </div>
                  {intentResult && (
                    <div>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>Intent: <span style={{ color: "#818cf8" }}>{intentResult.intent}</span></span>
                        <span style={{ fontSize: 13 }}>Confidence: <strong style={{ color: "#22c55e" }}>{intentResult.confidence}%</strong></span>
                        {intentResult.pageMatchScore !== undefined && <span style={{ fontSize: 13 }}>Page match: <strong style={{ color: intentResult.pageMatchScore >= 70 ? "#22c55e" : "#eab308" }}>{intentResult.pageMatchScore}%</strong></span>}
                      </div>
                      {intentResult.reasoning && <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 8 }}>{intentResult.reasoning}</div>}
                      {intentResult.contentRecommendation && <div style={{ fontSize: 13, color: "#fbbf24" }}>💡 {intentResult.contentRecommendation}</div>}
                    </div>
                  )}
                </div>

                {/* ── AI Overview Eligibility ── */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: aiOverviewResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>🤖 Google AI Overview Eligibility <span style={{ fontSize: 11, color: "#71717a", fontWeight: 400 }}>2 credits</span></div>
                    <button style={S.btn(aiOverviewResult ? undefined : "primary")} onClick={runAiOverview} disabled={aiOverviewLoading || !scanResult}>
                      {aiOverviewLoading ? <><span style={S.spinner} /> Scoring…</> : aiOverviewResult ? "🔄 Re-score" : "Check Eligibility"}
                    </button>
                  </div>
                  {!aiOverviewResult && !aiOverviewLoading && <div style={{ fontSize: 13, color: "#52525b" }}>AI scores your page 0–100 for candidacy in Google's AI Overview/SGE answers.</div>}
                  {aiOverviewResult && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
                        <div style={S.scoreRing(aiOverviewResult.score)}>{aiOverviewResult.score}</div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: aiOverviewResult.score >= 70 ? "#22c55e" : aiOverviewResult.score >= 50 ? "#eab308" : "#ef4444" }}>{aiOverviewResult.verdict}</div>
                          <div style={{ fontSize: 12, color: "#71717a" }}>AI Overview Eligibility Score</div>
                        </div>
                      </div>
                      {aiOverviewResult.strengths?.map((s, i) => <div key={i} style={{ fontSize: 13, color: "#86efac", marginBottom: 3 }}>✅ {s}</div>)}
                      {aiOverviewResult.improvements?.map((s, i) => <div key={i} style={{ fontSize: 13, color: "#fbbf24", marginBottom: 3 }}>💡 {s}</div>)}
                    </div>
                  )}
                </div>

                {/* ── Topical Authority Mapper ── */}
                <div style={S.card}>
                  <div style={S.cardTitle}>🗺️ Topical Authority Mapper <span style={{ fontSize: 11, color: "#71717a", fontWeight: 400 }}>2 credits</span></div>
                  <div style={{ ...S.row, gap: 8, marginBottom: 8 }}>
                    <input style={S.input} placeholder="Main topic (e.g. email marketing for Shopify)" value={topicalKw} onChange={e => setTopicalKw(e.target.value)} />
                    <button style={S.btn("primary")} onClick={runTopical} disabled={topicalLoading || !topicalKw.trim()}>
                      {topicalLoading ? <><span style={S.spinner} /> Mapping…</> : "Map Topical Authority"}
                    </button>
                  </div>
                  {topicalResult && (
                    <div>
                      {topicalResult.overallCoverage !== undefined && <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 10 }}>Overall topical coverage: <strong style={{ color: topicalResult.overallCoverage >= 70 ? "#22c55e" : "#eab308" }}>{topicalResult.overallCoverage}%</strong></div>}
                      <table style={S.table}>
                        <thead><tr><th style={S.th}>Subtopic</th><th style={S.th}>Coverage</th><th style={S.th}>Status</th></tr></thead>
                        <tbody>
                          {(topicalResult.subtopics || []).map((sub, i) => (
                            <tr key={i}>
                              <td style={S.td}>{sub.name}</td>
                              <td style={{ ...S.td, color: sub.coverage >= 70 ? "#22c55e" : sub.coverage >= 40 ? "#eab308" : "#ef4444" }}>{sub.coverage}%</td>
                              <td style={S.td}><span style={S.pill(sub.coverage >= 70 ? "low" : sub.coverage >= 40 ? "medium" : "high")}>{sub.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {topicalResult.missingSubtopics?.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                          <div style={S.heading}>Missing Sub-topics</div>
                          {topicalResult.missingSubtopics.map((m, i) => <div key={i} style={{ fontSize: 13, color: "#fbbf24", marginBottom: 3 }}>• {m}</div>)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Meta Description Optimizer ── */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: metaOptResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>✏️ AI Meta Description Optimizer <span style={{ fontSize: 11, color: "#71717a", fontWeight: 400 }}>2 credits</span></div>
                    <button style={S.btn(metaOptResult ? undefined : "primary")} onClick={runMetaOpt} disabled={metaOptLoading || !scanResult}>
                      {metaOptLoading ? <><span style={S.spinner} /> Optimizing…</> : metaOptResult ? "🔄 Regenerate" : "Generate 3 Variants"}
                    </button>
                  </div>
                  {!metaOptResult && !metaOptLoading && <div style={{ fontSize: 13, color: "#52525b" }}>AI writes 3 CTR-optimized meta description variants with keyword, CTA, and emotion signals.</div>}
                  {metaOptResult && (
                    <div>
                      {(metaOptResult.variants || []).map((v, i) => (
                        <div key={i} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "12px 14px", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span style={{ ...S.pill("low"), background: "#1e3a5f" }}>Variant {i + 1}</span>
                            <span style={{ fontSize: 11, color: "#71717a" }}>{v.text?.length} chars</span>
                            <button style={{ ...S.btn(), fontSize: 11, padding: "2px 8px", marginLeft: "auto" }} onClick={() => navigator.clipboard.writeText(v.text)}>Copy</button>
                          </div>
                          <div style={{ fontSize: 13, color: "#fafafa", lineHeight: 1.5 }}>{v.text}</div>
                          {v.focus && <div style={{ fontSize: 11, color: "#71717a", marginTop: 4 }}>Focus: {v.focus}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Content Decay Predictor ── */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: decayResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>📉 Content Decay Predictor <span style={{ fontSize: 11, color: "#71717a", fontWeight: 400 }}>2 credits</span></div>
                    <button style={S.btn(decayResult ? undefined : "primary")} onClick={runDecay} disabled={decayLoading || !scanResult}>
                      {decayLoading ? <><span style={S.spinner} /> Predicting…</> : decayResult ? "🔄 Re-predict" : "Predict Decay"}
                    </button>
                  </div>
                  {!decayResult && !decayLoading && <div style={{ fontSize: 13, color: "#52525b" }}>AI predicts content freshness urgency: Immediate / Soon / Eventually / Evergreen.</div>}
                  {decayResult && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
                        <span style={{ fontSize: 20, fontWeight: 800, color: decayResult.urgency === "Immediate" ? "#ef4444" : decayResult.urgency === "Soon" ? "#eab308" : decayResult.urgency === "Eventually" ? "#22c55e" : "#818cf8" }}>
                          {decayResult.urgency === "Immediate" ? "🔴" : decayResult.urgency === "Soon" ? "🟡" : decayResult.urgency === "Eventually" ? "🟢" : "💙"} {decayResult.urgency}
                        </span>
                        {decayResult.decayScore !== undefined && <span style={{ fontSize: 13, color: "#a1a1aa" }}>Decay score: {decayResult.decayScore}/100</span>}
                      </div>
                      {decayResult.staleElements?.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={S.heading}>Stale Elements to Update</div>
                          {decayResult.staleElements.map((el, i) => <div key={i} style={{ fontSize: 13, color: "#fbbf24", marginBottom: 3 }}>• {el}</div>)}
                        </div>
                      )}
                      {decayResult.recommendation && <div style={{ fontSize: 13, color: "#a1a1aa" }}>{decayResult.recommendation}</div>}
                    </div>
                  )}
                </div>

                {/* ── Competitor Gap Analysis ── */}
                <div style={S.card}>
                  <div style={S.cardTitle}>🆚 Competitor Content Gap Analysis <span style={{ fontSize: 11, color: "#71717a", fontWeight: 400 }}>2 credits</span></div>
                  <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 8 }}>Enter up to 3 competitor URLs (one per line) to compare against your page.</div>
                  <textarea style={{ ...S.textarea, minHeight: 70 }} placeholder={"https://competitor1.com/blog/post\nhttps://competitor2.com/blog/post"} value={compUrls} onChange={e => setCompUrls(e.target.value)} />
                  <button style={{ ...S.btn("primary"), marginTop: 8 }} onClick={runCompGap} disabled={compLoading || !scanResult || !compUrls.trim()}>
                    {compLoading ? <><span style={S.spinner} /> Analyzing…</> : "Analyze Gaps"}
                  </button>
                  {compErr && <div style={{ ...S.err, marginTop: 8 }}>{compErr}</div>}
                  {compResult && (
                    <div style={{ marginTop: 14 }}>
                      {compResult.gaps?.map((gap, i) => (
                        <div key={i} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 14px", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={S.pill(gap.priority === "high" ? "high" : gap.priority === "medium" ? "medium" : "low")}>{gap.priority}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#fafafa" }}>{gap.topic}</span>
                          </div>
                          <div style={{ fontSize: 12, color: "#71717a" }}>{gap.reason}</div>
                        </div>
                      ))}
                      {compResult.quickWins?.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                          <div style={S.heading}>⚡ Quick Wins</div>
                          {compResult.quickWins.map((w, i) => <div key={i} style={{ fontSize: 13, color: "#86efac", marginBottom: 3 }}>• {w}</div>)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Keyword Cannibalization ── */}
                <div style={S.card}>
                  <div style={S.cardTitle}>⚠️ Keyword Cannibalization Checker</div>
                  <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 8 }}>Paste multiple URLs targeting the same keyword (one per line). Requires target keyword above.</div>
                  <textarea style={{ ...S.textarea, minHeight: 80 }} placeholder={"https://yourstore.com/blog/post-1\nhttps://yourstore.com/blog/post-2"} value={cannibUrls} onChange={e => setCannibUrls(e.target.value)} />
                  <button style={{ ...S.btn("primary"), marginTop: 8 }} onClick={runCannib} disabled={cannibLoading || !cannibUrls.trim()}>
                    {cannibLoading ? <><span style={S.spinner} /> Checking…</> : "Check Cannibalization"}
                  </button>
                  {cannibResult && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 13, color: cannibResult.cannibalizing ? "#ef4444" : "#22c55e", marginBottom: 10, fontWeight: 700 }}>
                        {cannibResult.cannibalizing ? "⚠️ Keyword cannibalization detected" : "✅ No cannibalization detected"}
                      </div>
                      <table style={S.table}>
                        <thead><tr><th style={S.th}>URL</th><th style={S.th}>Score</th><th style={S.th}>Risk</th></tr></thead>
                        <tbody>
                          {(cannibResult.urls || []).map((u, i) => (
                            <tr key={i}>
                              <td style={{ ...S.td, wordBreak: "break-all", maxWidth: 300 }}>{u.url}</td>
                              <td style={S.td}>{u.score}</td>
                              <td style={S.td}><span style={S.pill(u.risk === "high" ? "high" : u.risk === "medium" ? "medium" : "low")}>{u.risk}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {cannibResult.recommendation && <div style={{ fontSize: 13, color: "#fbbf24", marginTop: 8 }}>💡 {cannibResult.recommendation}</div>}
                    </div>
                  )}
                </div>

                {/* ── Anchor Text Audit ── */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: anchorResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>🔗 Anchor Text Audit</div>
                    <button style={S.btn(anchorResult ? undefined : "primary")} onClick={runAnchor} disabled={anchorLoading || !scanResult}>
                      {anchorLoading ? <><span style={S.spinner} /> Auditing…</> : anchorResult ? "🔄 Re-audit" : "Audit Anchors"}
                    </button>
                  </div>
                  {!anchorResult && !anchorLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Internal/external anchor text diversity — detect generic anchors (click here, read more).</div>}
                  {anchorResult && (
                    <div>
                      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 12 }}>
                        <span style={{ fontSize: 13 }}>Internal: <strong>{anchorResult.internalCount}</strong></span>
                        <span style={{ fontSize: 13 }}>External: <strong>{anchorResult.externalCount}</strong></span>
                        <span style={{ fontSize: 13 }}>Generic anchors: <strong style={{ color: anchorResult.genericCount > 0 ? "#ef4444" : "#22c55e" }}>{anchorResult.genericCount}</strong></span>
                      </div>
                      {anchorResult.topAnchors?.length > 0 && (
                        <div>
                          <div style={S.heading}>Top Anchor Texts</div>
                          {anchorResult.topAnchors.map((a, i) => (
                            <div key={i} style={{ fontSize: 12, color: "#d4d4d8", marginBottom: 3 }}>
                              <span style={{ ...S.pill(a.isGeneric ? "high" : "low") }}>{a.isGeneric ? "GENERIC" : "OK"}</span>
                              "{a.text}" — {a.count}×
                            </div>
                          ))}
                        </div>
                      )}
                      {anchorResult.tips?.map((t, i) => <div key={i} style={{ fontSize: 13, color: "#fbbf24", marginTop: 6 }}>💡 {t}</div>)}
                    </div>
                  )}
                </div>

                {/* ── Table of Contents Generator ── */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: tocResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>📑 Table of Contents Generator</div>
                    <button style={S.btn(tocResult ? undefined : "primary")} onClick={runToc} disabled={tocLoading || !scanResult}>
                      {tocLoading ? <><span style={S.spinner} /> Generating…</> : tocResult ? "🔄 Regenerate" : "Generate ToC"}
                    </button>
                  </div>
                  {!tocResult && !tocLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Auto-generate a linked Table of Contents HTML snippet from your page headings.</div>}
                  {tocResult && (
                    <div>
                      <div style={{ ...S.row, gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: 12, color: "#86efac" }}>✅ {tocResult.itemCount} headings extracted</span>
                        <button style={{ ...S.btn(), fontSize: 11, padding: "3px 10px" }} onClick={() => navigator.clipboard.writeText(tocResult.html || "")}>📋 Copy HTML</button>
                      </div>
                      <pre style={{ ...S.fixCode, maxHeight: 200 }}>{tocResult.html}</pre>
                    </div>
                  )}
                </div>

                {/* ── Section Word Count ── */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: sectionWcResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>📏 Section Word Count Depth</div>
                    <button style={S.btn(sectionWcResult ? undefined : "primary")} onClick={runSectionWc} disabled={sectionWcLoading || !scanResult}>
                      {sectionWcLoading ? <><span style={S.spinner} /> Analyzing…</> : sectionWcResult ? "🔄 Re-analyze" : "Analyze Sections"}
                    </button>
                  </div>
                  {!sectionWcResult && !sectionWcLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Per-section word depth analysis — identify thin sections that need expansion.</div>}
                  {sectionWcResult && (
                    <div>
                      <table style={S.table}>
                        <thead><tr><th style={S.th}>Section Heading</th><th style={S.th}>Words</th><th style={S.th}>Depth</th></tr></thead>
                        <tbody>
                          {(sectionWcResult.sections || []).map((sec, i) => (
                            <tr key={i}>
                              <td style={S.td}>{sec.heading}</td>
                              <td style={S.td}>{sec.wordCount}</td>
                              <td style={S.td}><span style={S.pill(sec.depth === "Thin" ? "high" : sec.depth === "Shallow" ? "medium" : "low")}>{sec.depth}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {sectionWcResult.thinSections > 0 && <div style={{ fontSize: 13, color: "#fbbf24", marginTop: 8 }}>💡 {sectionWcResult.thinSections} thin section(s) detected. Expand each to at least 200 words for better topical depth.</div>}
                    </div>
                  )}
                </div>

                {/* ── People Also Ask ── */}
                <div style={S.card}>
                  <div style={S.cardTitle}>❓ People Also Ask Generator <span style={{ fontSize: 11, color: "#71717a", fontWeight: 400 }}>2 credits</span></div>
                  <div style={{ ...S.row, gap: 8, marginBottom: 8 }}>
                    <input style={S.input} placeholder="Keyword (e.g. shopify abandoned cart)" value={paaKw} onChange={e => setPaaKw(e.target.value)} onKeyDown={e => e.key === "Enter" && !paaLoading && runPaa()} />
                    <button style={S.btn("primary")} onClick={runPaa} disabled={paaLoading || !paaKw.trim()}>
                      {paaLoading ? <><span style={S.spinner} /> Generating…</> : "Generate PAA Questions"}
                    </button>
                  </div>
                  {paaResult && (
                    <div>
                      {(paaResult.questions || []).map((q, i) => (
                        <div key={i} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 14px", marginBottom: 8 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#fafafa", marginBottom: 4 }}>Q: {q.question}</div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ ...S.pill("low"), background: "#1e3a5f" }}>{q.answerFormat}</span>
                            {q.intent && <span style={{ ...S.pill("low") }}>{q.intent}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Entity Detection ── */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: entityResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>🧠 NLP Entity Detection <span style={{ fontSize: 11, color: "#71717a", fontWeight: 400 }}>2 credits</span></div>
                    <button style={S.btn(entityResult ? undefined : "primary")} onClick={runEntity} disabled={entityLoading || !scanResult}>
                      {entityLoading ? <><span style={S.spinner} /> Extracting…</> : entityResult ? "🔄 Re-extract" : "Extract Entities"}
                    </button>
                  </div>
                  {!entityResult && !entityLoading && <div style={{ fontSize: 13, color: "#52525b" }}>AI extracts named entities (people, orgs, concepts, locations, stats) + semantic richness score.</div>}
                  {entityResult && (
                    <div>
                      {entityResult.semanticScore !== undefined && (
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                          <div style={S.scoreRing(entityResult.semanticScore)}>{entityResult.semanticScore}</div>
                          <div style={{ fontSize: 13, color: "#a1a1aa" }}>Semantic Richness Score</div>
                        </div>
                      )}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 10 }}>
                        {Object.entries(entityResult.entities || {}).map(([category, items]) => (
                          items?.length > 0 && (
                            <div key={category} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 14px" }}>
                              <div style={{ fontSize: 11, color: "#71717a", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>{category} ({items.length})</div>
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                {items.slice(0, 8).map((item, i) => (
                                  <span key={i} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: "2px 8px", fontSize: 11, color: "#d4d4d8" }}>{item}</span>
                                ))}
                              </div>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── SERP Feature Eligibility ── */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: serpFeatResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>🏆 SERP Feature Eligibility</div>
                    <button style={S.btn(serpFeatResult ? undefined : "primary")} onClick={runSerpFeatures} disabled={serpFeatLoading || !scanResult}>
                      {serpFeatLoading ? <><span style={S.spinner} /> Checking…</> : serpFeatResult ? "🔄 Re-check" : "Check SERP Features"}
                    </button>
                  </div>
                  {!serpFeatResult && !serpFeatLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Check eligibility for Featured Snippet, PAA, Image Pack, Video Carousel, HowTo, FAQ, Review Stars, Breadcrumbs, Sitelinks.</div>}
                  {serpFeatResult && (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 10 }}>
                        {(serpFeatResult.features || []).map((feat, i) => (
                          <div key={i} style={{ background: feat.eligible ? "#14532d22" : "#09090b", border: `1px solid ${feat.eligible ? "#14532d" : "#27272a"}`, borderRadius: 8, padding: "10px 14px" }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: feat.eligible ? "#86efac" : "#a1a1aa", marginBottom: 4 }}>{feat.eligible ? "✅" : "❌"} {feat.name}</div>
                            <div style={{ fontSize: 11, color: "#71717a" }}>{feat.reason}</div>
                            {!feat.eligible && feat.tip && <div style={{ fontSize: 11, color: "#fbbf24", marginTop: 4 }}>💡 {feat.tip}</div>}
                          </div>
                        ))}
                      </div>
                      {serpFeatResult.eligibleCount !== undefined && (
                        <div style={{ marginTop: 12, fontSize: 13, color: "#a1a1aa" }}>Eligible for <strong style={{ color: "#22c55e" }}>{serpFeatResult.eligibleCount}</strong> of {serpFeatResult.totalCount} SERP features</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Issues */}
                <div style={S.card}>
                  <div style={S.cardTitle}>⚠️ Issues ({filteredIssues.length}/{issues.length})</div>
                  <div style={{ ...S.row, marginBottom: 12, gap: 6 }}>
                    {FILTER_CATS.map(c => <div key={c} style={S.tab(filterCat === c)} onClick={() => setFilterCat(c)}>{c}</div>)}
                    <span style={{ width: 16 }} />
                    {FILTER_SEVS.map(sv => <div key={sv} style={S.tab(filterSev === sv)} onClick={() => setFilterSev(sv)}>{sv}</div>)}
                  </div>
                  {filteredIssues.length === 0 && <div style={S.empty}>No issues match the current filter.</div>}
                  {filteredIssues.map((issue, idx) => {
                    const k = issue.msg;
                    const isExpanded = expandedIssue === idx;
                    return (
                      <div key={idx}>
                        <div style={{ ...S.issueRow, cursor: "pointer" }} onClick={() => setExpandedIssue(isExpanded ? null : idx)}>
                          <span style={S.pill(issue.sev)}>{issue.sev}</span>
                          <span style={{ ...S.pill("low"), background: "#1c1917" }}>{issue.cat}</span>
                          <span style={{ flex: 1, fontSize: 13, color: "#d4d4d8" }}>{issue.msg}</span>
                          <span style={{ fontSize: 11, color: "#71717a" }}>-{issue.impact}pts</span>
                        </div>
                        {isExpanded && (
                          <div style={{ padding: "8px 14px 12px 40px" }}>
                            <button style={S.btn("primary")} onClick={(e) => { e.stopPropagation(); generateFix(issue); }} disabled={fixLoading === k}>
                              {fixLoading === k ? <><span style={S.spinner} /> Generating…</> : "🤖 AI Generate Fix (1 credit)"}
                            </button>
                            {fixes[k] && (
                              <div style={S.fixPanel}>
                                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{fixes[k].explanation || fixes[k].location}</div>
                                {fixes[k].code && <pre style={S.fixCode}>{fixes[k].code}</pre>}
                                <div style={{ marginTop: 6, fontSize: 11, color: "#71717a" }}>Type: {fixes[k].fixType} · Priority: {fixes[k].priority}</div>
                                <button style={{ ...S.btn(), marginTop: 8, fontSize: 11, padding: "4px 10px" }} onClick={() => navigator.clipboard.writeText(fixes[k].code || "")}>Copy Code</button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {!scanResult && !scanning && !scanErr && (
              <div style={S.empty}>
                <div style={{ fontSize: 42, marginBottom: 12 }}>📝</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Blog SEO Analyzer</div>
                <div style={{ fontSize: 13 }}>Enter a blog post URL to get a comprehensive SEO audit with AI-powered recommendations.</div>
              </div>
            )}
          </>
        )}

        {/* ================================================================
            KEYWORDS TAB
            ================================================================ */}
        {tab === "Keywords" && (
          <>
            <div style={{ ...S.card, marginTop: 16 }}>
              <div style={S.cardTitle}>🔑 AI Keyword Research</div>
              <div style={{ ...S.row, marginBottom: 10 }}>
                <input style={S.input} placeholder="Seed keyword (e.g. shopify dropshipping)" value={seedKw} onChange={e => setSeedKw(e.target.value)} onKeyDown={e => e.key === "Enter" && !kwLoading && runKwResearch()} />
                <input style={{ ...S.input, maxWidth: 260 }} placeholder="Niche (optional)" value={kwNiche} onChange={e => setKwNiche(e.target.value)} />
                <button style={S.btn("primary")} onClick={runKwResearch} disabled={kwLoading || !seedKw.trim()}>
                  {kwLoading ? <><span style={S.spinner} /> Researching…</> : "Research (2 credits)"}
                </button>
              </div>
            </div>

            {kwErr && <div style={S.err}>{kwErr}</div>}

            {kwLoading && <div style={S.empty}><span style={S.spinner} /><div style={{ marginTop: 12 }}>Running AI keyword research…</div></div>}

            {kwResearch && !kwLoading && (
              <>
                {/* Clusters */}
                {(kwResearch.clusters || []).map((cluster, ci) => (
                  <div key={ci} style={S.card}>
                    <div style={S.cardTitle}>
                      {cluster.name}
                      <span style={{ ...S.pill(cluster.intent === "transactional" ? "high" : cluster.intent === "commercial" ? "medium" : "low"), marginLeft: 8 }}>{cluster.intent}</span>
                    </div>
                    <table style={S.table}>
                      <thead><tr><th style={S.th}>Keyword</th><th style={S.th}>Volume</th><th style={S.th}>Difficulty</th><th style={S.th}>Priority</th></tr></thead>
                      <tbody>
                        {(cluster.keywords || []).map((kw, ki) => (
                          <tr key={ki}>
                            <td style={S.td}>{kw.keyword}</td>
                            <td style={S.td}>{kw.estimatedVolume}</td>
                            <td style={S.td}>{kw.difficulty}</td>
                            <td style={S.td}><span style={S.pill(kw.priority === "high" ? "high" : kw.priority === "medium" ? "medium" : "low")}>{kw.priority}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}

                {/* Long-tail keywords */}
                {kwResearch.longTailKeywords?.length > 0 && (
                  <div style={S.card}>
                    <div style={S.cardTitle}>🔗 Long-Tail Keywords</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {kwResearch.longTailKeywords.map((kw, i) => <span key={i} style={{ ...S.pill("low"), fontSize: 12, padding: "4px 12px" }}>{kw}</span>)}
                    </div>
                  </div>
                )}

                {/* Questions */}
                {kwResearch.questionsToAnswer?.length > 0 && (
                  <div style={S.card}>
                    <div style={S.cardTitle}>❓ Questions to Answer</div>
                    {kwResearch.questionsToAnswer.map((q, i) => <div key={i} style={{ fontSize: 13, color: "#d4d4d8", marginBottom: 4 }}>• {q}</div>)}
                  </div>
                )}

                {/* Content ideas */}
                {kwResearch.contentIdeas?.length > 0 && (
                  <div style={S.card}>
                    <div style={S.cardTitle}>💡 Content Ideas</div>
                    <table style={S.table}>
                      <thead><tr><th style={S.th}>Title</th><th style={S.th}>Type</th><th style={S.th}>Target Keyword</th></tr></thead>
                      <tbody>
                        {kwResearch.contentIdeas.map((idea, i) => (
                          <tr key={i}><td style={S.td}>{idea.title}</td><td style={S.td}><span style={S.pill("low")}>{idea.type}</span></td><td style={S.td}>{idea.targetKeyword}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* LSI / Semantic Keywords */}
            <div style={{ ...S.card, marginTop: 8 }}>
              <div style={S.cardTitle}>🔀 LSI &amp; Semantic Keywords</div>
              <div style={{ fontSize: 13, color: "#71717a", marginBottom: 12 }}>AI suggests semantically related terms to weave throughout your post for topical authority. Click any chip to copy.</div>
              <div style={{ ...S.row, marginBottom: 8, gap: 8 }}>
                <input style={S.input} placeholder="Primary keyword to expand (e.g. email marketing)" value={seedKw} onChange={e => setSeedKw(e.target.value)} onKeyDown={e => e.key === "Enter" && !lsiLoading && runLsiKeywords()} />
                <input style={{ ...S.input, maxWidth: 220 }} placeholder="Niche (optional)" value={kwNiche} onChange={e => setKwNiche(e.target.value)} />
                <button style={S.btn("primary")} onClick={runLsiKeywords} disabled={lsiLoading || !seedKw.trim()}>
                  {lsiLoading ? <><span style={S.spinner} /> Generating…</> : "✨ Generate LSI (2 credits)"}
                </button>
              </div>
              {lsiErr && <div style={S.err}>{lsiErr}</div>}
              {lsiLoading && <div style={S.empty}><span style={S.spinner} /><div style={{ marginTop: 12 }}>Generating semantic keywords…</div></div>}
              {lsiResult && (
                <div>
                  {["high", "medium", "low"].map(pri => {
                    const kws = (lsiResult.lsi || []).filter(k => k.priority === pri);
                    if (!kws.length) return null;
                    return (
                      <div key={pri} style={{ marginBottom: 14 }}>
                        <div style={S.heading}>{pri === "high" ? "🔴 High Priority" : pri === "medium" ? "🟡 Medium Priority" : "⚪ Supporting Terms"}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {kws.map((k, i) => (
                            <div key={i} title={k.usage}
                              onClick={() => navigator.clipboard.writeText(k.keyword)}
                              style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 20, padding: "4px 12px", fontSize: 12, color: "#e4e4e7", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ ...S.pill("low"), background: "#1e3a5f", fontSize: 10, padding: "1px 6px" }}>{k.type}</span>
                              {k.keyword}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {lsiResult.topicClusters?.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={S.heading}>📦 Topic Clusters to Cover</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {lsiResult.topicClusters.map((c, i) => <span key={i} style={{ ...S.pill("low"), background: "#14532d22", border: "1px solid #14532d", color: "#86efac" }}>{c}</span>)}
                      </div>
                    </div>
                  )}
                  {lsiResult.contentGaps?.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={S.heading}>🕳️ Content Gaps</div>
                      {lsiResult.contentGaps.map((g, i) => <div key={i} style={{ fontSize: 13, color: "#fbbf24", marginBottom: 3 }}>• {g}</div>)}
                    </div>
                  )}
                  {lsiResult.tip && (
                    <div style={{ background: "#1e3a5f22", border: "1px solid #1e3a5f", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#93c5fd" }}>💡 {lsiResult.tip}</div>
                  )}
                </div>
              )}
            </div>

            {!kwResearch && !kwLoading && !kwErr && (
              <div style={S.empty}>
                <div style={{ fontSize: 42, marginBottom: 12 }}>🔑</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>AI Keyword Research</div>
                <div style={{ fontSize: 13 }}>Enter a seed keyword to discover keyword clusters, long-tail variations, and content ideas.</div>
              </div>
            )}
          </>
        )}

        {/* ================================================================
            CONTENT BRIEF TAB
            ================================================================ */}
        {tab === "Content Brief" && (
          <>
            <div style={{ ...S.card, marginTop: 16 }}>
              <div style={S.cardTitle}>📋 AI Content Brief Generator</div>
              <div style={{ ...S.row, marginBottom: 10 }}>
                <input style={S.input} placeholder="Blog topic or title" value={briefTopic} onChange={e => setBriefTopic(e.target.value)} onKeyDown={e => e.key === "Enter" && !briefLoading && runBrief()} />
              </div>
              <div style={{ ...S.row, marginBottom: 10 }}>
                <input style={{ ...S.input, maxWidth: 280 }} placeholder="Primary keyword" value={briefPrimary} onChange={e => setBriefPrimary(e.target.value)} />
                <input style={{ ...S.input, maxWidth: 280 }} placeholder="Secondary keywords (comma-separated)" value={briefSecondary} onChange={e => setBriefSecondary(e.target.value)} />
                <button style={S.btn("primary")} onClick={runBrief} disabled={briefLoading || (!briefTopic.trim() && !briefPrimary.trim())}>
                  {briefLoading ? <><span style={S.spinner} /> Generating…</> : "Generate Brief (2 credits)"}
                </button>
              </div>
            </div>

            {briefErr && <div style={S.err}>{briefErr}</div>}

            {briefLoading && <div style={S.empty}><span style={S.spinner} /><div style={{ marginTop: 12 }}>Generating content brief…</div></div>}

            {briefResult && !briefLoading && (
              <>
                {/* Brief overview */}
                <div style={S.card}>
                  <div style={S.cardTitle}>📄 Brief: {briefResult.title || briefTopic}</div>
                  <div style={S.metaRow}>
                    <MetaBlock label="Meta Title" value={briefResult.metaTitle || "—"} max={60} />
                    <MetaBlock label="H1" value={briefResult.h1 || "—"} />
                  </div>
                  <div style={S.metaRow}>
                    <MetaBlock label="Meta Description" value={briefResult.metaDescription || "—"} max={160} />
                  </div>
                  <div style={S.metaRow}>
                    <MetaBlock label="Target Word Count" value={briefResult.targetWordCount || "—"} />
                    <MetaBlock label="Search Intent" value={briefResult.searchIntent || "—"} />
                    <MetaBlock label="Estimated Rank" value={briefResult.estimatedRank || "—"} />
                  </div>
                </div>

                {/* Outline */}
                {briefResult.outline?.length > 0 && (
                  <div style={S.card}>
                    <div style={S.cardTitle}>📑 Content Outline</div>
                    {briefResult.outline.map((section, i) => (
                      <div key={i} style={{ ...S.issueRow, flexDirection: "column", alignItems: "flex-start" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#fafafa" }}>{i + 1}. {section.heading}</div>
                        {section.subheadings?.length > 0 && section.subheadings.map((sh, j) => (
                          <div key={j} style={{ fontSize: 13, color: "#a1a1aa", paddingLeft: 20, marginTop: 2 }}>↳ {sh}</div>
                        ))}
                        <div style={{ fontSize: 11, color: "#71717a", marginTop: 4 }}>{section.wordCount ? `~${section.wordCount} words` : ""} {section.notes ? `· ${section.notes}` : ""}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Keyword strategy */}
                {briefResult.keywordStrategy && (
                  <div style={S.card}>
                    <div style={S.cardTitle}>🎯 Keyword Strategy</div>
                    <div style={S.metaRow}>
                      <MetaBlock label="Primary" value={briefResult.keywordStrategy.primary || "—"} />
                    </div>
                    {briefResult.keywordStrategy.secondary?.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={S.heading}>Secondary</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{briefResult.keywordStrategy.secondary.map((k, i) => <span key={i} style={{ ...S.pill("medium"), fontSize: 12, padding: "3px 10px" }}>{k}</span>)}</div>
                      </div>
                    )}
                    {briefResult.keywordStrategy.lsi?.length > 0 && (
                      <div>
                        <div style={S.heading}>LSI / Semantic</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{briefResult.keywordStrategy.lsi.map((k, i) => <span key={i} style={{ ...S.pill("low"), fontSize: 12, padding: "3px 10px" }}>{k}</span>)}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Unique angles & competitor gaps */}
                {(briefResult.uniqueAngles?.length > 0 || briefResult.competitorGaps?.length > 0) && (
                  <div style={S.card}>
                    {briefResult.competitorGaps?.length > 0 && (
                      <div style={S.section}><div style={S.heading}>🕳️ Competitor Gaps</div>{briefResult.competitorGaps.map((g, i) => <div key={i} style={{ fontSize: 13, color: "#fbbf24", marginBottom: 4 }}>• {g}</div>)}</div>
                    )}
                    {briefResult.uniqueAngles?.length > 0 && (
                      <div style={S.section}><div style={S.heading}>💡 Unique Angles</div>{briefResult.uniqueAngles.map((a, i) => <div key={i} style={{ fontSize: 13, color: "#86efac", marginBottom: 4 }}>• {a}</div>)}</div>
                    )}
                    {briefResult.cta && <div style={S.section}><div style={S.heading}>📣 Call to Action</div><div style={{ fontSize: 13, color: "#d4d4d8" }}>{briefResult.cta}</div></div>}
                  </div>
                )}
              </>
            )}

            {!briefResult && !briefLoading && !briefErr && (
              <div style={S.empty}>
                <div style={{ fontSize: 42, marginBottom: 12 }}>📋</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>AI Content Brief Generator</div>
                <div style={{ fontSize: 13 }}>Enter a topic and keywords to generate a full content brief with outline, keyword strategy, and unique angles.</div>
              </div>
            )}
          </>
        )}

        {/* ================================================================
            BULK SCAN TAB
            ================================================================ */}
        {tab === "Bulk Scan" && (
          <>
            <div style={{ ...S.card, marginTop: 16 }}>
              <div style={S.cardTitle}>📊 Bulk Blog Scanner</div>
              <textarea style={S.textarea} placeholder={"Enter blog URLs (one per line, max 10)\nhttps://yourstore.com/blogs/news/post-1\nhttps://yourstore.com/blogs/news/post-2"} value={bulkUrls} onChange={e => setBulkUrls(e.target.value)} rows={6} />
              <div style={{ ...S.row, marginTop: 10 }}>
                <input style={{ ...S.input, maxWidth: 300 }} placeholder="Target keywords (optional)" value={bulkKw} onChange={e => setBulkKw(e.target.value)} />
                <button style={S.btn("primary")} onClick={runBulk} disabled={bulkLoading || !bulkUrls.trim()}>
                  {bulkLoading ? <><span style={S.spinner} /> Scanning…</> : "Scan All"}
                </button>
              </div>
            </div>

            {bulkErr && <div style={S.err}>{bulkErr}</div>}

            {bulkLoading && <div style={S.empty}><span style={S.spinner} /><div style={{ marginTop: 12 }}>Scanning blog posts…</div></div>}

            {bulkResult && !bulkLoading && (
              <>
                {/* Summary */}
                <div style={{ ...S.card, display: "flex", gap: 24, flexWrap: "wrap", padding: 20 }}>
                  <MetaChip label="Scanned" value={bulkResult.summary?.scanned} />
                  <MetaChip label="Failed" value={bulkResult.summary?.failed} color={bulkResult.summary?.failed > 0 ? "#ef4444" : undefined} />
                  <MetaChip label="Avg Score" value={bulkResult.summary?.avgScore} color={bulkResult.summary?.avgScore >= 75 ? "#22c55e" : bulkResult.summary?.avgScore >= 50 ? "#eab308" : "#ef4444"} />
                  <MetaChip label="Total Issues" value={bulkResult.summary?.totalIssues} />
                </div>

                {/* Results table */}
                <div style={S.card}>
                  <table style={S.table}>
                    <thead><tr><th style={S.th}>URL</th><th style={S.th}>Title</th><th style={S.th}>Score</th><th style={S.th}>Grade</th><th style={S.th}>Words</th><th style={S.th}>Issues</th></tr></thead>
                    <tbody>
                      {(bulkResult.results || []).map((r, i) => (
                        <tr key={i}>
                          <td style={{ ...S.td, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {r.status === "ok" ? <span style={S.link} onClick={() => { setUrl(r.url); setTab("Analyzer"); }}>{r.url}</span> : <span style={{ color: "#ef4444" }}>{r.url}</span>}
                          </td>
                          <td style={{ ...S.td, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title || r.error || "—"}</td>
                          <td style={S.td}>{r.status === "ok" ? <span style={{ color: r.score >= 75 ? "#22c55e" : r.score >= 50 ? "#eab308" : "#ef4444", fontWeight: 700 }}>{r.score}</span> : "—"}</td>
                          <td style={S.td}>{r.grade || "—"}</td>
                          <td style={S.td}>{r.wordCount || "—"}</td>
                          <td style={S.td}>{r.status === "ok" ? <span style={{ color: r.highIssues > 0 ? "#ef4444" : "#71717a" }}>{r.issueCount} ({r.highIssues} high)</span> : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {!bulkResult && !bulkLoading && !bulkErr && (
              <div style={S.empty}>
                <div style={{ fontSize: 42, marginBottom: 12 }}>📊</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Bulk Blog Scanner</div>
                <div style={{ fontSize: 13 }}>Paste multiple blog URLs to scan them all at once and compare scores.</div>
              </div>
            )}
          </>
        )}

        {/* ================================================================
            AI ASSISTANT TAB
            ================================================================ */}
        {tab === "AI Assistant" && (
          <>
            <div style={{ ...S.card, marginTop: 16, display: "flex", flexDirection: "column", minHeight: 420 }}>
              <div style={S.cardTitle}>🤖 Blog SEO Assistant</div>
              <div ref={chatRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4, padding: "8px 0", minHeight: 280, maxHeight: 480 }}>
                {chatMessages.length === 0 && (
                  <div style={S.empty}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>💬</div>
                    <div style={{ fontSize: 13 }}>Ask anything about blog SEO — keyword strategy, content optimization, technical SEO, etc.</div>
                  </div>
                )}
                {chatMessages.map((m, i) => <div key={i} style={S.chatBubble(m.role === "user")}>{m.content}</div>)}
                {chatLoading && <div style={S.chatBubble(false)}><span style={S.spinner} /> Thinking…</div>}
              </div>
              <div style={{ ...S.row, marginTop: 10 }}>
                <input style={S.input} placeholder="Ask about blog SEO…" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !chatLoading && sendChat()} />
                <button style={S.btn("primary")} onClick={sendChat} disabled={chatLoading || !chatInput.trim()}>Send</button>
              </div>
            </div>
          </>
        )}

        {/* ================================================================
            HISTORY TAB
            ================================================================ */}
        {tab === "History" && (
          <>
            <div style={{ ...S.card, marginTop: 16 }}>
              <div style={{ ...S.cardTitle, justifyContent: "space-between" }}>
                <span>📂 Scan History</span>
                <button style={S.btn()} onClick={loadHistory} disabled={historyLoading}>{historyLoading ? "Loading…" : "Refresh"}</button>
              </div>
              {history.length === 0 && !historyLoading && <div style={S.empty}>No history yet. Scan a blog post to start building history.</div>}
              {historyLoading && <div style={S.empty}><span style={S.spinner} /></div>}
              {history.slice().reverse().map(h => (
                <div key={h.id} style={{ ...S.issueRow, justifyContent: "space-between" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fafafa" }}>{h.title || h.url || "Untitled"}</div>
                    <div style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>{h.url} · {new Date(h.ts).toLocaleString()}</div>
                  </div>
                  {h.score != null && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 12 }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: h.score >= 75 ? "#22c55e" : h.score >= 50 ? "#eab308" : "#ef4444" }}>{h.score}</span>
                      {h.grade && <span style={S.grade(h.grade)}>{h.grade}</span>}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => { setUrl(h.url); setTab("Analyzer"); }}>Re-scan</button>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px" }} onClick={() => deleteHistory(h.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Helper components ──────────────────────────────────────────────────── */
function MetaChip({ label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: color || "#fafafa" }}>{value ?? "—"}</div>
      <div style={{ fontSize: 10, fontWeight: 600, color: "#71717a", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

function MetaBlock({ label, value, max }) {
  const len = typeof value === "string" ? value.length : 0;
  const over = max && len > max;
  return (
    <div style={{ flex: "1 1 200px", minWidth: 120 }}>
      <div style={S.metaLabel}>{label}{max ? ` (${len}/${max})` : ""}</div>
      <div style={{ ...S.metaVal, color: over ? "#eab308" : "#d4d4d8" }}>{value || "—"}</div>
    </div>
  );
}

function ToggleSection({ title, open, toggle }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={toggle}>
      <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
      <span style={{ fontSize: 13, color: "#818cf8" }}>{open ? "▲ Hide" : "▼ Show"}</span>
    </div>
  );
}
