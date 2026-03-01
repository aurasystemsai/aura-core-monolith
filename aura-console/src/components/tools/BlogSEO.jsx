import React, { useState, useRef, useCallback, useEffect } from "react";
import { apiFetch, apiFetchJSON } from "../../api";
import BackButton from "./BackButton";

const API = "/api/blog-seo";

/* ── Design tokens ── */
const C = {
  bg:      "#09090b",
  surface: "#18181b",
  border:  "#27272a",
  muted:   "#3f3f46",
  text:    "#fafafa",
  sub:     "#a1a1aa",
  dim:     "#71717a",
  indigo:  "#4f46e5",
  indigoL: "#818cf8",
  green:   "#22c55e",
  yellow:  "#eab308",
  red:     "#ef4444",
  amber:   "#f59e0b",
};

/* ── Shared style helpers ── */
const S = {
  page:     { minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", paddingBottom: 64 },
  topBar:   { display: "flex", alignItems: "center", gap: 12, padding: "18px 28px 0", flexWrap: "wrap" },
  title:    { fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" },
  badge:    { fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: C.indigo, color: "#fff" },
  body:     { maxWidth: 1100, margin: "0 auto", padding: "0 24px" },
  card:     { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 16 },
  row:      { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  input:    { flex: 1, minWidth: 200, padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.muted}`, background: C.bg, color: C.text, fontSize: 14, outline: "none" },
  textarea: { width: "100%", minHeight: 100, padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.muted}`, background: C.bg, color: C.text, fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit" },
  btn: (v) => {
    const base = { padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", transition: "all .15s" };
    if (v === "primary") return { ...base, background: C.indigo, color: "#fff" };
    if (v === "danger")  return { ...base, background: "#7f1d1d", color: "#fca5a5" };
    if (v === "success") return { ...base, background: "#14532d", color: "#86efac" };
    return { ...base, background: C.muted, color: "#d4d4d8" };
  },
  spinner:  { display: "inline-block", width: 16, height: 16, border: `2px solid ${C.muted}`, borderTop: `2px solid ${C.indigo}`, borderRadius: "50%", animation: "spin .7s linear infinite" },
  err:      { background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 10, padding: "14px 18px", color: "#fca5a5", fontSize: 13, marginBottom: 12 },
  empty:    { textAlign: "center", padding: "48px 20px", color: C.dim },
  pill:     (sev) => ({ display: "inline-block", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: sev === "high" ? "#7f1d1d" : sev === "medium" ? "#713f12" : "#1e3a5f", color: sev === "high" ? "#fca5a5" : sev === "medium" ? "#fbbf24" : "#93c5fd" }),
  score:    (s)   => ({ color: s >= 75 ? C.green : s >= 50 ? C.yellow : C.red }),
  ring:     (s)   => ({ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: "50%", fontSize: 22, fontWeight: 800, border: `3px solid ${s >= 75 ? C.green : s >= 50 ? C.yellow : C.red}`, color: s >= 75 ? C.green : s >= 50 ? C.yellow : C.red }),
  sidebar:  { width: 220, flexShrink: 0, borderRight: `1px solid ${C.surface}`, paddingTop: 12, paddingBottom: 32, position: "sticky", top: 0, maxHeight: "100vh", overflowY: "auto" },
  sItem:    (a)   => ({ padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: a ? 600 : 400, background: a ? "#1e1b4b" : "transparent", color: a ? "#c4b5fd" : C.sub, borderLeft: a ? `3px solid ${C.indigoL}` : "3px solid transparent", marginBottom: 2, transition: "all .15s" }),
  sHead:    { fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "1px", padding: "14px 14px 4px" },
  layout:   { display: "flex", alignItems: "flex-start", minHeight: "calc(100vh - 72px)" },
  main:     { flex: 1, minWidth: 0, padding: "0 28px 64px", maxWidth: 960 },
};

/* ── Section registry ─────────────────────────────────────────────────────
   level: "beginner" shows in simple mode; "advanced" hidden until expert mode
   tab   must exactly match the tab === "..." checks in the render section
── */
const SECTIONS = [
  { id: "Analyze",   title: "Analyze a Post",        desc: "Full SEO score for any blog post. See exactly what to fix.", color: "#4f46e5", level: "beginner",  tab: "Analyzer"    },
  { id: "Keywords",  title: "Find Keywords",          desc: "Discover the best keywords for your topic instantly.",       color: "#0891b2", level: "beginner",  tab: "Keywords"    },
  { id: "Write",     title: "Write with AI",          desc: "AI writes a full blog post, outline or intro for you.",     color: "#059669", level: "beginner",  tab: "AI Create"   },
  { id: "Optimize",  title: "Improve a Post",         desc: "Specific tips to improve any post and boost its ranking.",  color: "#d97706", level: "beginner",  tab: "Content+"    },
  { id: "Chat",      title: "Ask AI",                 desc: "Chat with an SEO expert AI. Get instant tailored advice.",  color: "#be185d", level: "beginner",  tab: "AI Chat"     },
  { id: "BulkScan",  title: "Scan Multiple Posts",    desc: "Audit all blog posts at once to find what needs work.",     color: "#0f766e", level: "beginner",  tab: "Bulk Scan"   },
  { id: "History",   title: "History",                desc: "Browse past scans and revisit previous reports.",           color: "#475569", level: "beginner",  tab: "History"     },
  { id: "Technical", title: "Technical SEO",          desc: "Core Web Vitals, crawl issues, indexing, speed.",           color: "#7c3aed", level: "advanced",  tab: "Technical+"  },
  { id: "Schema",    title: "Schema & Links",         desc: "Generate JSON-LD schema markup. Audit redirects.",          color: "#1d4ed8", level: "advanced",  tab: "Schema"      },
  { id: "SERP",      title: "SERP & CTR",             desc: "Featured snippets, click-through rate optimisation.",       color: "#0e7490", level: "advanced",  tab: "SERP & CTR"  },
  { id: "Backlinks", title: "Backlinks",              desc: "Link gaps, broken backlinks, anchor text opportunities.",   color: "#b45309", level: "advanced",  tab: "Backlinks"   },
  { id: "AB",        title: "A/B & Content Refresh",  desc: "Test title variants, refresh stale content.",              color: "#374151", level: "advanced",  tab: "A/B Refresh" },
  { id: "Local",     title: "Local & E-E-A-T",        desc: "Local SEO, author authority, brand mentions.",              color: "#065f46", level: "advanced",  tab: "E-E-A-T"     },
  { id: "Voice",     title: "Voice & AI Search",      desc: "Optimise for voice queries and AI overviews.",             color: "#6d28d9", level: "advanced",  tab: "Voice"       },
  { id: "AIGrowth",  title: "AI Growth Tools",        desc: "Content calendar, pillar pages, ROI estimator.",           color: "#0f766e", level: "advanced",  tab: "AI Growth"   },
  { id: "Rank",      title: "Rank Tracker",           desc: "Track keyword positions, GSC import, forecasts.",          color: "#1d4ed8", level: "advanced",  tab: "Rank Tracker"},
  { id: "Crawl",     title: "Site Crawl",             desc: "Full crawler: broken links, orphan pages, duplicates.",    color: "#7c3aed", level: "advanced",  tab: "Site Crawl"  },
  { id: "GEO",       title: "GEO & LLM Search",       desc: "AI health scores, prompt simulation, llms.txt.",           color: "#dc2626", level: "advanced",  tab: "GEO & LLM"   },
  { id: "Trends",    title: "Trend Scout",            desc: "Rising topics, seasonal planner, keyword surge.",          color: "#d97706", level: "advanced",  tab: "Trends"      },
];
/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function BlogSEO() {

  /* ── Navigation state ── */
  const [section,    setSection]    = useState(null);   // null = home
  const [expertMode, setExpertMode] = useState(false);  // false = beginner

  /* ── Toast ── */
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  /* ── Shopify store data ── */
  const [shopDomain,   setShopDomain]   = useState("");
  const [articles,     setArticles]     = useState([]);
  const [products,     setProducts]     = useState([]);
  const [shopLoading,  setShopLoading]  = useState(false);
  const [selectedArtId, setSelectedArtId] = useState("");

  /* ── Analyzer state ── */
  const [url,          setUrl]          = useState("");
  const [kwInput,      setKwInput]      = useState("");
  const [scanning,     setScanning]     = useState(false);
  const [scanErr,      setScanErr]      = useState("");
  const [scanResult,   setScanResult]   = useState(null);
  const [scannedArtId, setScannedArtId] = useState(null);
  const [scannedBlogId,setScannedBlogId]= useState(null);
  const [aiAnalysis,   setAiAnalysis]   = useState(null);
  const [aiAnalyzing,  setAiAnalyzing]  = useState(false);
  const [aiAnalysisErr,setAiAnalysisErr]= useState(null);
  const [rewriteField, setRewriteField] = useState(null);
  const [rewriting,    setRewriting]    = useState(false);
  const [rewriteResult,setRewriteResult]= useState(null);
  const [rewriteErr,   setRewriteErr]   = useState(null);
  const [applyState,   setApplyState]   = useState({});  // {idx: "loading"|"ok"|"error:..."}
  const [fixedFields,  setFixedFields]  = useState(new Set());
  const [autoScanPend, setAutoScanPend] = useState(false);

  /* ── Keywords state ── */
  const [seedKw,      setSeedKw]      = useState("");
  const [kwNiche,     setKwNiche]     = useState("");
  const [kwResult,    setKwResult]    = useState(null);
  const [kwLoading,   setKwLoading]   = useState(false);
  const [kwErr,       setKwErr]       = useState("");

  /* ── Write / AI Create state ── */
  const [outlineKw,      setOutlineKw]      = useState("");
  const [outlineAud,     setOutlineAud]     = useState("general readers");
  const [outlineResult,  setOutlineResult]  = useState(null);
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [introKw,        setIntroKw]        = useState("");
  const [introStyle,     setIntroStyle]     = useState("conversational");
  const [introResult,    setIntroResult]    = useState(null);
  const [introLoading,   setIntroLoading]   = useState(false);
  const [titleKw,        setTitleKw]        = useState("");
  const [titleResult,    setTitleResult]    = useState(null);
  const [titleLoading,   setTitleLoading]   = useState(false);
  const [draftKw,        setDraftKw]        = useState("");
  const [draftLoading,   setDraftLoading]   = useState(false);
  const [draftResult,    setDraftResult]    = useState(null);
  const [draftErr,       setDraftErr]       = useState("");
  const [briefTopic,     setBriefTopic]     = useState("");
  const [briefPrimary,   setBriefPrimary]   = useState("");
  const [briefResult,    setBriefResult]    = useState(null);
  const [briefLoading,   setBriefLoading]   = useState(false);
  const [briefErr,       setBriefErr]       = useState("");
  const [writeSub,       setWriteSub]       = useState("outline");

  /* ── Optimize / Content+ state ── */
  const [optUrl,         setOptUrl]         = useState("");
  const [optKw,          setOptKw]          = useState("");
  const [optResult,      setOptResult]      = useState(null);
  const [optLoading,     setOptLoading]     = useState(false);
  const [optErr,         setOptErr]         = useState("");

  /* ── AI Chat state ── */
  const [chatMessages,   setChatMessages]   = useState([{ role: "assistant", text: "Hi! I am your SEO expert assistant. Ask me anything about blog SEO, keywords, rankings or content strategy." }]);
  const [chatInput,      setChatInput]      = useState("");
  const [chatLoading,    setChatLoading]    = useState(false);
  const chatEndRef = useRef(null);

  /* ── Bulk Scan state ── */
  const [bulkUrls,       setBulkUrls]       = useState("");
  const [bulkKw,         setBulkKw]         = useState("");
  const [bulkResult,     setBulkResult]     = useState(null);
  const [bulkLoading,    setBulkLoading]    = useState(false);
  const [bulkErr,        setBulkErr]        = useState("");

  /* ── History state ── */
  const [history,        setHistory]        = useState([]);
  const [histLoading,    setHistLoading]    = useState(false);
  /* ═══════════════════════════
     API FUNCTIONS
  ═══════════════════════════ */

  /* Shopify data on mount */
  useEffect(() => {
    (async () => {
      setShopLoading(true);
      try {
        const resp = await apiFetch(`${API}/shopify-data`);
        if (resp.ok) {
          const r = await resp.json();
          setArticles(r.articles || []);
          setProducts(r.products || []);
          if (r.shopDomain) setShopDomain(r.shopDomain);
        }
      } catch {}
      setShopLoading(false);
    })();
  }, []);

  /* Auto-fill URL when article selected */
  const handleArticleSelect = useCallback((id) => {
    setSelectedArtId(id);
    const art = articles.find(a => String(a.id) === id);
    if (art) {
      setUrl(art.url || "");
      setKwInput(art.tags || "");
      setOptUrl(art.url || "");
      setOptKw(art.tags || "");
    }
  }, [articles]);

  /* Auto-scan pending */
  useEffect(() => {
    if (autoScanPend && url) { setAutoScanPend(false); runScan(); }
  }, [autoScanPend, url]);

  /* Scroll chat to bottom */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  /* Load history when that section is opened */
  useEffect(() => {
    if (section === "History") loadHistory();
  }, [section]);

  /* ── Analyzer ── */
  const runScan = useCallback(async () => {
    if (!url.trim()) return;
    setScanning(true); setScanErr(""); setScanResult(null);
    setAiAnalysis(null); setRewriteResult(null); setRewriteErr(null);
    setApplyState({}); setFixedFields(new Set());
    try {
      const art = selectedArtId ? articles.find(a => String(a.id) === selectedArtId) : null;
      const body = { url: url.trim(), keywords: kwInput.trim(), ...(art ? { articleId: art.id, blogId: art.blogId } : {}) };
      const r = await apiFetchJSON(`${API}/analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error(r.error || "Scan failed");
      setScanResult(r);
      if (art) { setScannedArtId(art.id); setScannedBlogId(art.blogId); }
      else {
        const match = articles.find(a => a.url === r.url || (r.url && a.handle && r.url.includes(a.handle)));
        if (match) { setScannedArtId(match.id); setScannedBlogId(match.blogId); }
      }
      try { await apiFetch(`${API}/items`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "scan", url: r.url, title: r.title, score: r.scored?.overall, grade: r.scored?.grade, issueCount: r.scored?.issueCount }) }); } catch {}
    } catch(e) { setScanErr(e.message || "Scan failed"); }
    setScanning(false);
  }, [url, kwInput, selectedArtId, articles]);

  /* ── AI rewrite ── */
  const runRewrite = useCallback(async (field) => {
    if (!scanResult) return;
    setRewriteField(field); setRewriting(true); setRewriteResult(null); setRewriteErr(null);
    try {
      const r = await apiFetchJSON(`${API}/ai/rewrite`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ field, url: scanResult.url, title: scanResult.title, metaDescription: scanResult.metaDescription, h1: scanResult.h1, keywords: kwInput, wordCount: scanResult.wordCount }) });
      if (r.ok) setRewriteResult(r);
      else setRewriteErr(r.error || "Rewrite failed");
    } catch(e) { setRewriteErr(e.message); }
    setRewriting(false);
  }, [scanResult, kwInput]);

  /* ── Apply rewrite to Shopify ── */
  const applyRewrite = useCallback(async (value, field, idx) => {
    if (!scannedArtId || !scannedBlogId) { setApplyState(p => ({ ...p, [idx]: "error: Select and rescan a post first" })); return; }
    setApplyState(p => ({ ...p, [idx]: "loading" }));
    try {
      const r = await apiFetchJSON(`${API}/apply-field`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ articleId: scannedArtId, blogId: scannedBlogId, field, value, shop: shopDomain }) });
      setApplyState(p => ({ ...p, [idx]: r.ok ? "ok" : `error: ${r.error || "Failed"}` }));
      if (r.ok) setFixedFields(p => new Set([...p, field]));
    } catch(e) { setApplyState(p => ({ ...p, [idx]: `error: ${e.message}` })); }
  }, [scannedArtId, scannedBlogId, shopDomain]);

  /* ── AI deep analysis ── */
  const runAiAnalysis = useCallback(async () => {
    if (!scanResult) return;
    setAiAnalyzing(true); setAiAnalysisErr(null);
    try {
      const r = await apiFetchJSON(`${API}/ai/analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url, title: scanResult.title, metaDescription: scanResult.metaDescription, h1: scanResult.h1, wordCount: scanResult.wordCount, keywords: kwInput, scored: scanResult.scored }) });
      if (r.ok) {
        const parsed = r.structured || (r.analysis ? (() => { try { return JSON.parse(r.analysis); } catch { return null; } })() : null);
        if (parsed) setAiAnalysis(parsed); else setAiAnalysisErr("AI returned unexpected format");
      } else setAiAnalysisErr(r.error || "Analysis failed");
    } catch(e) { setAiAnalysisErr(e.message); }
    setAiAnalyzing(false);
  }, [scanResult, kwInput]);

  /* ── Keywords research ── */
  const runKeywords = useCallback(async () => {
    if (!seedKw.trim()) return;
    setKwLoading(true); setKwErr(""); setKwResult(null);
    try {
      const r = await apiFetchJSON(`${API}/keywords/research`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: seedKw.trim(), niche: kwNiche.trim() || undefined }) });
      if (r.ok) setKwResult(r); else setKwErr(r.error || "Research failed");
    } catch(e) { setKwErr(e.message); }
    setKwLoading(false);
  }, [seedKw, kwNiche]);

  /* ── Write tools ── */
  const runOutline = useCallback(async () => {
    if (!outlineKw.trim()) return;
    setOutlineLoading(true); setOutlineResult(null);
    try { const r = await apiFetchJSON(`${API}/ai/blog-outline`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: outlineKw.trim(), audience: outlineAud }) }); if (r.ok) setOutlineResult(r); } catch {}
    setOutlineLoading(false);
  }, [outlineKw, outlineAud]);

  const runIntro = useCallback(async () => {
    if (!introKw.trim()) return;
    setIntroLoading(true); setIntroResult(null);
    try { const r = await apiFetchJSON(`${API}/ai/intro-generator`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: introKw.trim(), style: introStyle }) }); if (r.ok) setIntroResult(r); } catch {}
    setIntroLoading(false);
  }, [introKw, introStyle]);

  const runTitleIdeas = useCallback(async () => {
    if (!titleKw.trim()) return;
    setTitleLoading(true); setTitleResult(null);
    try { const r = await apiFetchJSON(`${API}/ai/title-ideas`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: titleKw.trim() }) }); if (r.ok) setTitleResult(r); } catch {}
    setTitleLoading(false);
  }, [titleKw]);

  const runDraft = useCallback(async () => {
    if (!draftKw.trim()) return;
    setDraftLoading(true); setDraftErr(""); setDraftResult(null);
    try {
      const r = await apiFetchJSON(`${API}/ai/full-draft`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: draftKw.trim() }) });
      if (r.ok) setDraftResult(r); else setDraftErr(r.error || "Draft generation failed");
    } catch(e) { setDraftErr(e.message); }
    setDraftLoading(false);
  }, [draftKw]);

  const runBrief = useCallback(async () => {
    if (!briefTopic.trim()) return;
    setBriefLoading(true); setBriefErr(""); setBriefResult(null);
    try {
      const r = await apiFetchJSON(`${API}/content-brief`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: briefTopic.trim(), primaryKeyword: briefPrimary.trim() || undefined }) });
      if (r.ok) setBriefResult(r); else setBriefErr(r.error || "Brief generation failed");
    } catch(e) { setBriefErr(e.message); }
    setBriefLoading(false);
  }, [briefTopic, briefPrimary]);

  /* ── Optimize ── */
  const runOptimize = useCallback(async () => {
    if (!optUrl.trim()) return;
    setOptLoading(true); setOptErr(""); setOptResult(null);
    try {
      const r = await apiFetchJSON(`${API}/content/optimize`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: optUrl.trim(), keyword: optKw.trim() || undefined }) });
      if (r.ok) setOptResult(r); else setOptErr(r.error || "Optimization failed");
    } catch(e) { setOptErr(e.message); }
    setOptLoading(false);
  }, [optUrl, optKw]);

  /* ── AI Chat ── */
  const sendChat = useCallback(async () => {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    setChatInput("");
    setChatMessages(p => [...p, { role: "user", text: msg }]);
    setChatLoading(true);
    try {
      const r = await apiFetchJSON(`${API}/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msg, context: scanResult ? { url: scanResult.url, score: scanResult.scored?.overall, issues: (scanResult.scored?.issues || []).slice(0, 5).map(i => i.msg) } : undefined }) });
      setChatMessages(p => [...p, { role: "assistant", text: r.ok ? (r.reply || r.message || "Done") : (r.error || "Error") }]);
    } catch(e) { setChatMessages(p => [...p, { role: "assistant", text: "Network error. Please try again." }]); }
    setChatLoading(false);
  }, [chatInput, chatLoading, scanResult]);

  /* ── Bulk Scan ── */
  const runBulkScan = useCallback(async () => {
    const lines = bulkUrls.trim().split(/\n+/).map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;
    setBulkLoading(true); setBulkErr(""); setBulkResult(null);
    try {
      const r = await apiFetchJSON(`${API}/bulk-scan`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ urls: lines, keyword: bulkKw.trim() || undefined }) });
      if (r.ok) setBulkResult(r); else setBulkErr(r.error || "Bulk scan failed");
    } catch(e) { setBulkErr(e.message); }
    setBulkLoading(false);
  }, [bulkUrls, bulkKw]);

  /* ── History ── */
  const loadHistory = useCallback(async () => {
    setHistLoading(true);
    try { const r = await apiFetchJSON(`${API}/items`); if (r.ok) setHistory(r.items || []); } catch {}
    setHistLoading(false);
  }, []);

  const deleteHistory = useCallback(async (id) => {
    try { await apiFetch(`${API}/items/${id}`, { method: "DELETE" }); } catch {}
    setHistory(p => p.filter(h => h.id !== id));
  }, []);
  /* ═══════════════════════════
     ISSUE HINT MAPPER
     Maps an issue message -> { hint, label, action }
     Rules:
       - Only call setExpertMode(true) when navigating to an ADVANCED section
       - BEGINNER sections (Analyze, Keywords, Write, Optimize, Chat, BulkScan, History)
         must NOT call setExpertMode(true)
  ═══════════════════════════ */
  const getIssueAction = useCallback((msg) => {
    const m = (msg || "").toLowerCase();
    /* ── Title fixes ── */
    if (m.includes("title") && (m.includes("short") || m.includes("below") || m.includes("too few")))
      return { label: "Rewrite Title", action: () => runRewrite("title") };
    if (m.includes("title") && (m.includes("long") || m.includes("truncat") || m.includes("over 60")))
      return { label: "Shorten Title", action: () => runRewrite("title") };
    if (m.includes("title") && (m.includes("keyword") || m.includes("missing from")))
      return { label: "Rewrite Title", action: () => runRewrite("title") };
    if (m.includes("title") && (m.includes("missing") || m.includes("no title")))
      return { label: "Write Title", action: () => runRewrite("title") };
    /* ── Meta description fixes ── */
    if ((m.includes("meta description") || m.includes("meta desc")) && (m.includes("missing") || m.includes("empty") || m.includes("no meta")))
      return { label: "Write Meta Description", action: () => runRewrite("metaDescription") };
    if (m.includes("meta description") || m.includes("meta desc"))
      return { label: "Rewrite Meta", action: () => runRewrite("metaDescription") };
    /* ── H1 fixes ── */
    if (m.includes("h1") && (m.includes("missing") || m.includes("no h1") || m.includes("0 h1")))
      return { label: "Generate H1", action: () => runRewrite("h1") };
    if (m.includes("h1") && (m.includes("multiple") || m.includes("more than one")))
      return { label: "Fix H1", action: () => runRewrite("h1") };
    if (m.includes("h1") && m.includes("align"))
      return { label: "Align H1 & Title", action: () => runRewrite("h1") };
    /* ── H2 / headings ── */
    if ((m.includes("h2") || m.includes("subheading")) && (m.includes("missing") || m.includes("no ") || m.includes("lack")))
      return { label: "Suggest H2s", action: () => runRewrite("headings") };
    if (m.includes("heading") && (m.includes("jump") || m.includes("skip") || m.includes("level")))
      return { label: "Optimize Post", action: () => { setSection("Optimize"); } };
    /* ── URL / slug ── */
    if (m.includes("url") || m.includes("slug") || m.includes("handle"))
      return { label: "Fix URL Slug", action: () => runRewrite("handle") };
    /* ── Word count / thin ── */
    if (m.includes("word count") || (m.includes("words") && (m.includes("short") || m.includes("thin") || m.includes("below"))))
      return { label: "Write with AI", action: () => { setSection("Write"); } };
    /* ── Keywords ── */
    if (m.includes("keyword") && (m.includes("density") || m.includes("stuffing") || m.includes("repeated")))
      return { label: "Find Keywords", action: () => { setSection("Keywords"); } };
    if (m.includes("keyword") && (m.includes("missing") || m.includes("not found") || m.includes("absent")))
      return { label: "Find Keywords", action: () => { setSection("Keywords"); } };
    /* ── Content quality (beginner sections) ── */
    if (m.includes("sentence") || m.includes("passive voice") || m.includes("readability") || m.includes("flesch"))
      return { label: "Optimize Content", action: () => { setSection("Optimize"); } };
    if (m.includes("paragraph") && (m.includes("long") || m.includes("exceed")))
      return { label: "Optimize Content", action: () => { setSection("Optimize"); } };
    if (m.includes("transition"))
      return { label: "Optimize Content", action: () => { setSection("Optimize"); } };
    if (m.includes("faq") || (m.includes("question") && m.includes("answer")))
      return { label: "Optimize Content", action: () => { setSection("Optimize"); } };
    /* ── Advanced sections (setExpertMode REQUIRED) ── */
    if (m.includes("schema") || m.includes("structured data") || m.includes("json-ld"))
      return { label: "Add Schema", action: () => { setExpertMode(true); setSection("Schema"); } };
    if (m.includes("date") || m.includes("freshness") || m.includes("publish") || m.includes("modified"))
      return { label: "Add Schema", action: () => { setExpertMode(true); setSection("Schema"); } };
    if (m.includes("author"))
      return { label: "Add Author", action: () => { setExpertMode(true); setSection("Local"); } };
    if (m.includes("internal link"))
      return { label: "Internal Links", action: () => { setExpertMode(true); setSection("Backlinks"); } };
    if (m.includes("backlink") || m.includes("link build"))
      return { label: "Backlinks", action: () => { setExpertMode(true); setSection("Backlinks"); } };
    if (m.includes("canonical") || m.includes("robots") || m.includes("noindex") || m.includes("https") || m.includes("image") || m.includes("alt") || m.includes("og:") || m.includes("open graph") || m.includes("technical") || m.includes("core web") || m.includes("speed"))
      return { label: "Technical SEO", action: () => { setExpertMode(true); setSection("Technical"); } };
    return null;
  }, [runRewrite, setSection, setExpertMode]);
  /* ═══════════════════════════
     RENDER
  ═══════════════════════════ */
  const visibleSections = expertMode ? SECTIONS : SECTIONS.filter(s => s.level === "beginner");
  const activeSec = section ? SECTIONS.find(s => s.id === section) : null;

  return (
    <div style={S.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Toast notification ── */}
      {toast && (
        <div style={{ position: "fixed", bottom: 20, right: 20, background: "#1f2937", border: "1px solid #374151", borderRadius: 10, padding: "12px 18px", color: C.text, fontSize: 13, zIndex: 9999, maxWidth: 340 }}>
          {toast}
        </div>
      )}

      {/* ── Top bar ── */}
      <div style={S.topBar}>
        <BackButton />
        <span style={S.title}>Blog SEO Engine</span>
        {activeSec && (
          <>
            <span style={{ color: C.muted, fontSize: 16 }}>&#8250;</span>
            <span style={{ ...S.title, fontWeight: 500, color: C.sub }}>{activeSec.title}</span>
          </>
        )}
        <span style={S.badge}>AI-Powered</span>
        <div style={{ flex: 1 }} />
        <button
          style={{ ...S.btn(expertMode ? undefined : "primary"), fontSize: 12, padding: "6px 14px", background: expertMode ? C.muted : "#166534", color: expertMode ? "#d4d4d8" : "#bbf7d0" }}
          onClick={() => { setExpertMode(m => !m); if (section && SECTIONS.find(s => s.id === section)?.level === "advanced" && expertMode) setSection(null); }}
        >
          {expertMode ? "Simple Mode" : "Expert Mode"}
        </button>
      </div>

      {/* ── Body layout ── */}
      <div style={S.layout}>

        {/* ── Sidebar ── */}
        <nav style={S.sidebar}>
          <div style={{ padding: "8px 14px 10px", borderBottom: `1px solid ${C.surface}`, marginBottom: 6 }}>
            <button style={{ fontSize: 13, fontWeight: 700, color: section ? C.indigoL : C.text, background: "none", border: "none", cursor: "pointer", padding: 0 }}
              onClick={() => setSection(null)}>
              Blog SEO Engine
            </button>
          </div>
          <div style={S.sHead}>Tools</div>
          {visibleSections.map(s => (
            <div key={s.id} style={S.sItem(section === s.id)}
              onClick={() => setSection(s.id)}>
              <span style={{ fontSize: 11, fontWeight: 700, color: s.color, marginRight: 6, opacity: 0.9 }}>
                {s.level === "advanced" ? "PRO" : ""}
              </span>
              {s.title}
            </div>
          ))}
        </nav>

        {/* ── Main content ── */}
        <div style={S.main}>

          {/* ════════════════════════════
              HOME DASHBOARD
          ════════════════════════════ */}
          {!section && (
            <div style={{ maxWidth: 800, margin: "0 auto", paddingTop: 24 }}>

              {/* Store status banner */}
              {shopLoading ? (
                <div style={{ ...S.card, display: "flex", alignItems: "center", gap: 10, color: C.sub, fontSize: 13 }}>
                  <span style={S.spinner} /> Connecting to your store...
                </div>
              ) : shopDomain ? (
                <div style={{ background: "#0c1a0c", border: "1px solid #14532d", borderRadius: 10, padding: "10px 16px", marginBottom: 20, fontSize: 13, color: "#86efac" }}>
                  Connected to <strong>{shopDomain}</strong> &middot; {articles.length} post{articles.length !== 1 ? "s" : ""} ready
                </div>
              ) : (
                <div style={{ background: "#1c1007", border: "1px solid #92400e", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#d97706" }}>
                  No store connected &mdash; you can still paste a URL below
                </div>
              )}

              {/* Heading */}
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 8 }}>What would you like to do?</div>
                <div style={{ fontSize: 14, color: C.dim }}>Pick a goal &mdash; we will take care of the rest.</div>
              </div>

              {/* Beginner section cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginBottom: 32 }}>
                {visibleSections.map(s => (
                  <div key={s.id}
                    onClick={() => setSection(s.id)}
                    style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `4px solid ${s.color}`, borderRadius: 12, padding: "18px 16px", cursor: "pointer", transition: "border-color 0.15s, background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#1f1f23"}
                    onMouseLeave={e => e.currentTarget.style.background = C.surface}
                  >
                    <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 6 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.55 }}>{s.desc}</div>
                    <div style={{ fontSize: 12, color: s.color, fontWeight: 600, marginTop: 10 }}>Open &#8594;</div>
                  </div>
                ))}
              </div>

              {/* Expert mode hint */}
              {!expertMode && (
                <div style={{ textAlign: "center" }}>
                  <button
                    style={{ background: "none", border: "none", color: C.muted, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
                    onClick={() => setExpertMode(true)}>
                    I know SEO &mdash; switch to Expert Mode for all advanced tools
                  </button>
                </div>
              )}
            </div>
          )}
          {/* ════════════════════════════
              SECTION HEADER (shown when any section is active)
          ════════════════════════════ */}
          {activeSec && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 0 12px", borderBottom: `1px solid ${C.border}`, marginBottom: 16, flexWrap: "wrap" }}>
              <button style={{ ...S.btn(), padding: "6px 14px", fontSize: 13 }} onClick={() => setSection(null)}>All Tools</button>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{activeSec.title}</span>
              <div style={{ flex: 1 }} />
              {/* Article picker */}
              {articles.length > 0 && (
                <select
                  style={{ ...S.input, flex: "0 0 auto", width: 260, fontSize: 12 }}
                  value={selectedArtId}
                  onChange={e => handleArticleSelect(e.target.value)}
                >
                  <option value="">Auto-fill from store...</option>
                  {articles.map(a => <option key={a.id} value={String(a.id)}>{a.title?.slice(0, 50)}</option>)}
                </select>
              )}
            </div>
          )}

          {/* ════════════════════════════
              ANALYZE SECTION
          ════════════════════════════ */}
          {section === "Analyze" && (
            <>
              {/* Input card */}
              <div style={S.card}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Analyze a Blog Post</div>
                <div style={{ ...S.row, marginBottom: 10 }}>
                  <input
                    style={S.input}
                    placeholder="https://yourstore.com/blogs/news/your-post-title"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && runScan()}
                  />
                </div>
                <div style={S.row}>
                  <input
                    style={{ ...S.input, maxWidth: 380 }}
                    placeholder="Target keywords (comma-separated)"
                    value={kwInput}
                    onChange={e => setKwInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && runScan()}
                  />
                  <button style={S.btn("primary")} onClick={runScan} disabled={scanning || !url.trim()}>
                    {scanning ? <><span style={S.spinner} /> Scanning...</> : "Analyze"}
                  </button>
                </div>
              </div>

              {scanErr && <div style={S.err}>{scanErr}</div>}
              {scanning && <div style={S.empty}><span style={S.spinner} /><div style={{ marginTop: 12 }}>Crawling and analyzing your post...</div></div>}

              {/* ── Results ── */}
              {scanResult && !scanning && (
                <>
                  {/* Score overview */}
                  <div style={S.card}>
                    <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
                      <div style={S.ring(scanResult.scored?.overall ?? 0)}>
                        {scanResult.scored?.overall ?? 0}
                      </div>
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{scanResult.title || "(no title)"}</div>
                        <div style={{ fontSize: 12, color: C.dim, wordBreak: "break-all" }}>{scanResult.url}</div>
                      </div>
                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                        {[
                          ["Words", scanResult.wordCount],
                          ["Issues", scanResult.scored?.issueCount],
                          ["Grade", scanResult.scored?.grade],
                        ].map(([l, v]) => (
                          <div key={l} style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{v ?? "?"}</div>
                            <div style={{ fontSize: 11, color: C.dim, textTransform: "uppercase" }}>{l}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Category scores */}
                  {scanResult.scored?.categories && (
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
                      {Object.entries(scanResult.scored.categories).map(([cat, v]) => (
                        <div key={cat} style={{ flex: "1 1 130px", background: C.bg, border: `1px solid ${C.border}`, borderTop: `3px solid ${v.score >= 75 ? C.green : v.score >= 50 ? C.yellow : C.red}`, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
                          <div style={{ fontSize: 24, fontWeight: 800, color: v.score >= 75 ? C.green : v.score >= 50 ? C.yellow : C.red }}>{v.score}</div>
                          <div style={{ fontSize: 11, color: C.sub, textTransform: "uppercase", marginTop: 2 }}>{cat}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Issue list */}
                  {(scanResult.scored?.issues || []).length > 0 && (
                    <div style={S.card}>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Issues Found ({scanResult.scored.issueCount})</div>
                      {(scanResult.scored.issues || []).map((issue, i) => {
                        const act = getIssueAction(issue.msg);
                        const isDone = fixedFields.has(issue.field);
                        if (isDone) return null;
                        return (
                          <div key={i} style={{ padding: "12px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "flex-start", gap: 12 }}>
                            <span style={S.pill(issue.sev)}>{issue.sev}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 13, color: C.text, marginBottom: act ? 4 : 0 }}>{issue.msg}</div>
                            </div>
                            {act && (
                              <button style={{ ...S.btn("primary"), fontSize: 12, padding: "5px 14px", flexShrink: 0 }}
                                onClick={act.action}>
                                {act.label}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* AI Rewrite buttons */}
                  <div style={{ ...S.card, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginRight: 4 }}>AI Rewrite:</div>
                    {[["Title", "title"], ["Meta Description", "metaDescription"], ["H1", "h1"]].map(([label, field]) => (
                      <button key={field} style={S.btn()} onClick={() => runRewrite(field)} disabled={rewriting}>
                        {rewriting && rewriteField === field ? <><span style={S.spinner} /> Rewriting...</> : label}
                      </button>
                    ))}
                    <button style={S.btn()} onClick={runAiAnalysis} disabled={aiAnalyzing}>
                      {aiAnalyzing ? <><span style={S.spinner} /> Analyzing...</> : "AI Deep Analysis (1 credit)"}
                    </button>
                  </div>

                  {rewriteErr && <div style={S.err}>{rewriteErr}</div>}

                  {/* Rewrite results */}
                  {rewriteResult && (
                    <div style={{ ...S.card, borderColor: C.indigo }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>AI Rewrite Results</div>
                      {(rewriteResult.variants || [rewriteResult]).map((v, i) => (
                        <div key={i} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px", marginBottom: 8 }}>
                          <div style={{ fontSize: 13, color: C.text, marginBottom: 8 }}>{typeof v === "string" ? v : v.text || v.value || JSON.stringify(v)}</div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <button style={S.btn("success")} onClick={() => applyRewrite(typeof v === "string" ? v : v.text || v.value, rewriteField, i)}
                              disabled={applyState[i] === "loading"}>
                              {applyState[i] === "loading" ? "Applying..." : applyState[i] === "ok" ? "Applied!" : "Apply to Shopify"}
                            </button>
                            {typeof applyState[i] === "string" && applyState[i].startsWith("error:") && (
                              <span style={{ fontSize: 11, color: C.red }}>{applyState[i].slice(6)}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* AI Analysis results */}
                  {aiAnalysisErr && <div style={S.err}>{aiAnalysisErr}</div>}
                  {aiAnalysis && (
                    <div style={S.card}>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>AI Deep Analysis</div>
                      {aiAnalysis.assessment && <div style={{ fontSize: 13, color: "#d4d4d8", marginBottom: 12, lineHeight: 1.65 }}>{aiAnalysis.assessment}</div>}
                      {aiAnalysis.recommendations?.length > 0 && (
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: C.dim, textTransform: "uppercase", marginBottom: 8 }}>Recommendations</div>
                          {aiAnalysis.recommendations.map((r, i) => (
                            <div key={i} style={{ padding: "10px 12px", background: C.bg, borderRadius: 8, marginBottom: 6, fontSize: 13, color: "#d4d4d8", borderLeft: `3px solid ${r.priority === "critical" ? C.red : r.priority === "recommended" ? C.yellow : C.muted}` }}>
                              <strong style={{ color: C.text }}>{r.title}: </strong>{r.description}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {!scanResult && !scanning && !scanErr && (
                <div style={S.empty}>Enter a blog post URL above and click Analyze to get your SEO score.</div>
              )}
            </>
          )}
          {/* ════════════════════════════
              KEYWORDS SECTION
          ════════════════════════════ */}
          {section === "Keywords" && (
            <>
              <div style={S.card}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Keyword Research</div>
                <div style={S.row}>
                  <input style={S.input} placeholder="Seed keyword (e.g. running shoes)" value={seedKw} onChange={e => setSeedKw(e.target.value)} onKeyDown={e => e.key === "Enter" && runKeywords()} />
                  <input style={{ ...S.input, maxWidth: 200 }} placeholder="Niche (optional)" value={kwNiche} onChange={e => setKwNiche(e.target.value)} />
                  <button style={S.btn("primary")} onClick={runKeywords} disabled={kwLoading || !seedKw.trim()}>
                    {kwLoading ? <><span style={S.spinner} /> Researching...</> : "Find Keywords"}
                  </button>
                </div>
              </div>

              {kwErr && <div style={S.err}>{kwErr}</div>}

              {kwResult && (
                <div style={S.card}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Keyword Ideas for &ldquo;{seedKw}&rdquo;</div>
                  {/* Primary keyword */}
                  {kwResult.primaryKeyword && (
                    <div style={{ background: "#1e1b4b", border: "1px solid #3730a3", borderRadius: 8, padding: "12px 14px", marginBottom: 14 }}>
                      <div style={{ fontSize: 12, color: "#a5b4fc", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>Best Match</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#e0e7ff" }}>{kwResult.primaryKeyword.keyword}</div>
                      {kwResult.primaryKeyword.intent && <div style={{ fontSize: 12, color: "#818cf8", marginTop: 2 }}>Intent: {kwResult.primaryKeyword.intent}</div>}
                    </div>
                  )}
                  {/* Keyword table */}
                  {(kwResult.keywords || kwResult.suggestions || []).length > 0 && (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr>
                          {["Keyword", "Volume", "Difficulty", "Intent"].map(h => (
                            <th key={h} style={{ textAlign: "left", padding: "6px 10px", borderBottom: `1px solid ${C.border}`, fontSize: 11, color: C.dim, fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(kwResult.keywords || kwResult.suggestions || []).map((kw, i) => (
                          <tr key={i}>
                            <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}`, color: C.text }}>{kw.keyword || kw}</td>
                            <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}`, color: C.sub }}>{kw.volume ?? "—"}</td>
                            <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}`, color: kw.difficulty > 60 ? C.red : kw.difficulty > 30 ? C.yellow : C.green }}>{kw.difficulty ?? "—"}</td>
                            <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}`, color: C.sub }}>{kw.intent ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {!kwResult && !kwLoading && (
                <div style={S.empty}>Enter a seed keyword above to get keyword ideas, search volumes and difficulty scores.</div>
              )}
            </>
          )}

          {/* ════════════════════════════
              WRITE SECTION
          ════════════════════════════ */}
          {section === "Write" && (
            <>
              {/* Sub-nav */}
              <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                {[["outline", "Blog Outline"], ["intro", "Write Intro"], ["titles", "Title Ideas"], ["draft", "Full Draft"], ["brief", "Content Brief"]].map(([key, label]) => (
                  <button key={key} style={{ ...S.btn(), padding: "7px 16px", background: writeSub === key ? C.indigo : C.muted, color: writeSub === key ? "#fff" : "#d4d4d8" }} onClick={() => setWriteSub(key)}>{label}</button>
                ))}
              </div>

              {/* Blog Outline */}
              {writeSub === "outline" && (
                <div style={S.card}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>AI Blog Outline Generator</div>
                  <div style={S.row}>
                    <input style={S.input} placeholder="Topic or keyword (e.g. best running shoes for beginners)" value={outlineKw} onChange={e => setOutlineKw(e.target.value)} onKeyDown={e => e.key === "Enter" && runOutline()} />
                    <input style={{ ...S.input, maxWidth: 200 }} placeholder="Target audience" value={outlineAud} onChange={e => setOutlineAud(e.target.value)} />
                    <button style={S.btn("primary")} onClick={runOutline} disabled={outlineLoading || !outlineKw.trim()}>
                      {outlineLoading ? <><span style={S.spinner} /> Generating...</> : "Generate Outline"}
                    </button>
                  </div>
                  {outlineResult && (
                    <div style={{ marginTop: 14, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 16px" }}>
                      <div style={{ fontSize: 13, color: C.text, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{outlineResult.outline || JSON.stringify(outlineResult, null, 2)}</div>
                      <button style={{ ...S.btn(), marginTop: 10, fontSize: 12 }} onClick={() => navigator.clipboard?.writeText(outlineResult.outline || "")}>Copy</button>
                    </div>
                  )}
                  {!outlineResult && !outlineLoading && <div style={{ ...S.empty, padding: "24px 0 4px" }}>Enter a topic to generate a structured blog outline.</div>}
                </div>
              )}

              {/* Write Intro */}
              {writeSub === "intro" && (
                <div style={S.card}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>AI Intro Paragraph Generator</div>
                  <div style={S.row}>
                    <input style={S.input} placeholder="Blog topic or keyword" value={introKw} onChange={e => setIntroKw(e.target.value)} onKeyDown={e => e.key === "Enter" && runIntro()} />
                    <select style={{ ...S.input, flex: "0 0 auto", width: 180 }} value={introStyle} onChange={e => setIntroStyle(e.target.value)}>
                      {["conversational", "professional", "storytelling", "direct"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button style={S.btn("primary")} onClick={runIntro} disabled={introLoading || !introKw.trim()}>
                      {introLoading ? <><span style={S.spinner} /> Writing...</> : "Write Intro"}
                    </button>
                  </div>
                  {introResult && (
                    <div style={{ marginTop: 14, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 16px" }}>
                      <div style={{ fontSize: 13, color: C.text, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{introResult.intro || introResult.text || JSON.stringify(introResult)}</div>
                      <button style={{ ...S.btn(), marginTop: 10, fontSize: 12 }} onClick={() => navigator.clipboard?.writeText(introResult.intro || introResult.text || "")}>Copy</button>
                    </div>
                  )}
                </div>
              )}

              {/* Title Ideas */}
              {writeSub === "titles" && (
                <div style={S.card}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>AI Title Ideas</div>
                  <div style={S.row}>
                    <input style={S.input} placeholder="Keyword or topic" value={titleKw} onChange={e => setTitleKw(e.target.value)} onKeyDown={e => e.key === "Enter" && runTitleIdeas()} />
                    <button style={S.btn("primary")} onClick={runTitleIdeas} disabled={titleLoading || !titleKw.trim()}>
                      {titleLoading ? <><span style={S.spinner} /> Generating...</> : "Get Title Ideas"}
                    </button>
                  </div>
                  {titleResult && (
                    <div style={{ marginTop: 14 }}>
                      {(titleResult.titles || titleResult.ideas || []).map((t, i) => (
                        <div key={i} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 13, color: C.text }}>{typeof t === "string" ? t : t.title || t.text}</span>
                          <button style={{ ...S.btn(), fontSize: 11, padding: "3px 10px" }} onClick={() => navigator.clipboard?.writeText(typeof t === "string" ? t : t.title || t.text || "")}>Copy</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Full Draft */}
              {writeSub === "draft" && (
                <div style={S.card}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Full Blog Post Draft (3 credits)</div>
                  <div style={{ fontSize: 12, color: C.dim, marginBottom: 12 }}>AI generates a complete 1,200+ word blog post ready to publish.</div>
                  <div style={S.row}>
                    <input style={S.input} placeholder="Blog topic or keyword" value={draftKw} onChange={e => setDraftKw(e.target.value)} onKeyDown={e => e.key === "Enter" && runDraft()} />
                    <button style={S.btn("primary")} onClick={runDraft} disabled={draftLoading || !draftKw.trim()}>
                      {draftLoading ? <><span style={S.spinner} /> Writing full post...</> : "Generate Draft"}
                    </button>
                  </div>
                  {draftErr && <div style={{ ...S.err, marginTop: 10 }}>{draftErr}</div>}
                  {draftResult && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                        <button style={S.btn()} onClick={() => navigator.clipboard?.writeText(draftResult.content || draftResult.draft || "")}>Copy All</button>
                      </div>
                      <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 18px", fontSize: 13, color: C.text, whiteSpace: "pre-wrap", lineHeight: 1.75, maxHeight: 500, overflowY: "auto" }}>
                        {draftResult.content || draftResult.draft || JSON.stringify(draftResult)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Content Brief */}
              {writeSub === "brief" && (
                <div style={S.card}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Content Brief Generator</div>
                  <div style={S.row}>
                    <input style={S.input} placeholder="Blog topic" value={briefTopic} onChange={e => setBriefTopic(e.target.value)} />
                    <input style={{ ...S.input, maxWidth: 260 }} placeholder="Primary keyword" value={briefPrimary} onChange={e => setBriefPrimary(e.target.value)} />
                    <button style={S.btn("primary")} onClick={runBrief} disabled={briefLoading || !briefTopic.trim()}>
                      {briefLoading ? <><span style={S.spinner} /> Generating...</> : "Generate Brief"}
                    </button>
                  </div>
                  {briefErr && <div style={{ ...S.err, marginTop: 10 }}>{briefErr}</div>}
                  {briefResult && (
                    <div style={{ marginTop: 14, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "14px 16px", fontSize: 13, color: C.text, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                      {typeof briefResult === "string" ? briefResult : JSON.stringify(briefResult, null, 2)}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          {/* ════════════════════════════
              OPTIMIZE SECTION
          ════════════════════════════ */}
          {section === "Optimize" && (
            <>
              <div style={S.card}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Improve a Post</div>
                <div style={{ fontSize: 12, color: C.dim, marginBottom: 12 }}>Paste your post URL or enter keywords to get AI-powered improvement suggestions.</div>
                <div style={S.row}>
                  <input style={S.input} placeholder="Post URL (optional)" value={optUrl} onChange={e => setOptUrl(e.target.value)} />
                  <input style={{ ...S.input, maxWidth: 240 }} placeholder="Target keyword" value={optKw} onChange={e => setOptKw(e.target.value)} onKeyDown={e => e.key === "Enter" && runOptimize()} />
                  <button style={S.btn("primary")} onClick={runOptimize} disabled={optLoading || (!optUrl.trim() && !optKw.trim())}>
                    {optLoading ? <><span style={S.spinner} /> Optimising...</> : "Optimise Post"}
                  </button>
                </div>
              </div>

              {optErr && <div style={S.err}>{optErr}</div>}

              {optResult && (
                <div style={S.card}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Optimisation Suggestions</div>
                  {(optResult.suggestions || optResult.recommendations || []).length > 0 ? (
                    (optResult.suggestions || optResult.recommendations).map((item, i) => (
                      <div key={i} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px", marginBottom: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.title || item.issue || `Suggestion ${i + 1}`}</div>
                        <div style={{ fontSize: 12, color: C.sub, marginTop: 4, lineHeight: 1.6 }}>{item.description || item.fix || item.text || item}</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: 13, color: C.sub, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                      {typeof optResult === "string" ? optResult : JSON.stringify(optResult, null, 2)}
                    </div>
                  )}
                </div>
              )}

              {!optResult && !optLoading && (
                <div style={S.empty}>Enter a URL or keyword to get content optimisation suggestions.</div>
              )}
            </>
          )}

          {/* ════════════════════════════
              AI CHAT SECTION
          ════════════════════════════ */}
          {section === "Chat" && (
            <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 200px)", gap: 0 }}>
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, padding: "0 0 12px 0" }}>
                {chatMessages.map((msg, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                    <div style={{
                      maxWidth: "75%",
                      background: msg.role === "user" ? C.indigo : C.muted,
                      border: `1px solid ${msg.role === "user" ? C.indigo : C.border}`,
                      borderRadius: msg.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                      padding: "10px 14px",
                      fontSize: 13,
                      color: C.text,
                      lineHeight: 1.65,
                      whiteSpace: "pre-wrap"
                    }}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <div style={{ background: C.muted, border: `1px solid ${C.border}`, borderRadius: "12px 12px 12px 4px", padding: "10px 14px", display: "flex", gap: 5, alignItems: "center" }}>
                      <span style={S.spinner} />
                      <span style={{ fontSize: 12, color: C.dim }}>AI is thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                <input
                  style={{ ...S.input, flex: 1 }}
                  placeholder="Ask about SEO, keywords, content strategy..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                  disabled={chatLoading}
                />
                <button style={S.btn("primary")} onClick={sendChat} disabled={chatLoading || !chatInput.trim()}>
                  {chatLoading ? <span style={S.spinner} /> : "Send"}
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════
              BULK SCAN SECTION
          ════════════════════════════ */}
          {section === "BulkScan" && (
            <>
              <div style={S.card}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Scan Multiple Posts</div>
                <div style={{ fontSize: 12, color: C.dim, marginBottom: 12 }}>Enter one URL per line. Optionally add a keyword after a comma: <code style={{ color: C.indigo }}>https://example.com/post, my keyword</code></div>
                <textarea
                  style={{ ...S.textarea, minHeight: 140, marginBottom: 10 }}
                  placeholder={"https://yourstore.myshopify.com/blogs/news/post-1\nhttps://yourstore.myshopify.com/blogs/news/post-2, best shoes"}
                  value={bulkUrls}
                  onChange={e => setBulkUrls(e.target.value)}
                />
                <div style={S.row}>
                  <input style={{ ...S.input, maxWidth: 260 }} placeholder="Default keyword (if none given per-URL)" value={bulkKw} onChange={e => setBulkKw(e.target.value)} />
                  <button style={S.btn("primary")} onClick={runBulkScan} disabled={bulkLoading || !bulkUrls.trim()}>
                    {bulkLoading ? <><span style={S.spinner} /> Scanning...</> : "Scan All"}
                  </button>
                </div>
              </div>

              {bulkErr && <div style={S.err}>{bulkErr}</div>}

              {bulkResult && (
                <div style={S.card}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Bulk Scan Results</div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr>
                        {["URL", "Score", "Issues", "Grade"].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "6px 10px", borderBottom: `1px solid ${C.border}`, fontSize: 11, color: C.dim, fontWeight: 700, textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(bulkResult.results || []).map((r, i) => (
                        <tr key={i}>
                          <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}`, color: C.indigo, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            <a href={r.url} target="_blank" rel="noreferrer" style={{ color: C.indigo, textDecoration: "none" }}>{r.url}</a>
                          </td>
                          <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}`, color: S.score(r.score || 0).color }}>
                            {r.score ?? r.seo_score ?? "—"}
                          </td>
                          <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}`, color: C.sub }}>
                            {r.issueCount ?? (r.issues?.length) ?? "—"}
                          </td>
                          <td style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>
                            {S.score(r.score || 0).grade && (
                              <span style={{ background: S.score(r.score || 0).bg, color: S.score(r.score || 0).color, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                                {S.score(r.score || 0).grade}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!bulkResult && !bulkLoading && (
                <div style={S.empty}>Enter URLs above to run a bulk SEO scan across multiple blog posts at once.</div>
              )}
            </>
          )}

          {/* ════════════════════════════
              HISTORY SECTION
          ════════════════════════════ */}
          {section === "History" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Scan History</div>
                <button style={S.btn()} onClick={loadHistory} disabled={histLoading}>
                  {histLoading ? <><span style={S.spinner} /> Loading...</> : "Refresh"}
                </button>
              </div>

              {histLoading && <div style={{ textAlign: "center", padding: 40, color: C.dim }}><span style={S.spinner} /></div>}

              {!histLoading && history.length === 0 && (
                <div style={S.empty}>No scan history yet. Run your first analysis to see results here.</div>
              )}

              {!histLoading && history.length > 0 && history.map((item, i) => (
                <div key={item.id || i} style={{ ...S.card, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{item.url || item.title || "Unknown"}</div>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {item.score != null && (
                        <span style={{ fontSize: 12, color: S.score(item.score).color }}>Score: {item.score}</span>
                      )}
                      {item.keyword && (
                        <span style={{ fontSize: 12, color: C.sub }}>KW: {item.keyword}</span>
                      )}
                      {item.createdAt && (
                        <span style={{ fontSize: 12, color: C.dim }}>{new Date(item.createdAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button style={{ ...S.btn(), fontSize: 11, padding: "4px 12px" }} onClick={() => {
                      setUrl(item.url || "");
                      setKwInput(item.keyword || "");
                      setSection("Analyze");
                    }}>Re-scan</button>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 12px" }} onClick={() => deleteHistory(item.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </>
          )}
          {/* ════════════════════════════
              ADVANCED SECTION STUBS
          ════════════════════════════ */}
          {["Technical","Schema","SERP","Backlinks","AB","Local","Voice","AIGrowth","Rank","Crawl","GEO","Trends"].includes(section) && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300, gap: 16 }}>
              <div style={{ fontSize: 40 }}>🚧</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{SECTIONS.find(s => s.id === section)?.title || section}</div>
              <div style={{ fontSize: 14, color: C.sub, textAlign: "center", maxWidth: 420, lineHeight: 1.7 }}>
                This advanced section is coming in Phase 2. The foundation has been built — full functionality will be added in the next update.
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button style={S.btn()} onClick={() => setSection(null)}>Back to Home</button>
                <button style={S.btn("primary")} onClick={() => { setSection("Analyze"); setExpertMode(false); }}>Go to Analyze</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}