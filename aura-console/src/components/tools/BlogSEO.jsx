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
  { id: "SmartFix",  title: "Auto-Optimize Post",     desc: "AI runs every fix automatically — title, meta, schema, links — one click.", color: "#7c3aed", level: "beginner",  tab: "Auto Fix"    },
  { id: "Technical", title: "Technical SEO",          desc: "Core Web Vitals, crawl issues, indexing, speed.",           color: "#7c3aed", level: "advanced",  tab: "Technical+"  },
  { id: "Schema",    title: "Schema & Links",         desc: "Generate JSON-LD schema markup. Audit redirects.",          color: "#1d4ed8", level: "advanced",  tab: "Schema"      },
  { id: "SERP",      title: "SERP & CTR",             desc: "Featured snippets, click-through rate optimisation.",       color: "#0e7490", level: "advanced",  tab: "SERP & CTR"  },
  { id: "Backlinks", title: "Internal Links",          desc: "Find which pages on your site to link to from this post.", color: "#b45309", level: "advanced",  tab: "Internal Links" },
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

  /* ── Simple-mode flow ── */
  const [simpleFlow,        setSimpleFlow]        = useState(null); // null | 'fix' | 'write'
  const [simpleTopics,      setSimpleTopics]      = useState(null);
  const [simpleTopicsLoading, setSimpleTopicsLoading] = useState(false);

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

  /* ── Technical SEO state ── */
  const [techSub,        setTechSub]        = useState("audit");
  const [techResult,     setTechResult]     = useState(null);
  const [techLoading,    setTechLoading]    = useState(false);
  const [techErr,        setTechErr]        = useState("");
  const [pageSpeedResult,   setPageSpeedResult]   = useState(null);
  const [pageSpeedLoading,  setPageSpeedLoading]  = useState(false);
  const [cwvResult,      setCwvResult]      = useState(null);
  const [cwvLoading,     setCwvLoading]     = useState(false);
  const [sitemapResult,  setSitemapResult]  = useState(null);
  const [sitemapLoading, setSitemapLoading] = useState(false);

  /* ── Schema & Links state ── */
  const [schemaSub,          setSchemaSub]          = useState("article");
  const [schemaGenLoading,   setSchemaGenLoading]   = useState(false);
  const [schemaGenErr,       setSchemaGenErr]       = useState("");
  const [generatedSchema,    setGeneratedSchema]    = useState(null);
  const [schemaAuthorName,   setSchemaAuthorName]   = useState("");
  const [schemaPublisherName,setSchemaPublisherName]= useState("");
  const [faqSchemaResult,    setFaqSchemaResult]    = useState(null);
  const [faqSchemaLoading,   setFaqSchemaLoading]   = useState(false);
  const [howtoTitle,         setHowtoTitle]         = useState("");
  const [howtoResult,        setHowtoResult]        = useState(null);
  const [howtoLoading,       setHowtoLoading]       = useState(false);

  /* ── SERP & CTR state ── */
  const [serpSub,             setSerpSub]             = useState("ctr");
  const [ctrTitle,            setCtrTitle]            = useState("");
  const [ctrMeta,             setCtrMeta]             = useState("");
  const [ctrKeyword,          setCtrKeyword]          = useState("");
  const [ctrOptimizerResult,  setCtrOptimizerResult]  = useState(null);
  const [ctrLoading,          setCtrLoading]          = useState(false);
  const [intentKeyword,       setIntentKeyword]       = useState("");
  const [intentResult,        setIntentResult]        = useState(null);
  const [intentLoading,       setIntentLoading]       = useState(false);
  const [paaKeyword,          setPaaKeyword]          = useState("");
  const [paaNiche,            setPaaNiche]            = useState("");
  const [paaResult,           setPaaResult]           = useState(null);
  const [paaLoading,          setPaaLoading]          = useState(false);
  const [snapKeyword,         setSnapKeyword]         = useState("");
  const [competitorSnapshotResult, setCompetitorSnapshotResult] = useState(null);
  const [snapLoading,         setSnapLoading]         = useState(false);
  const [diffKeyword,         setDiffKeyword]         = useState("");
  const [diffNiche,           setDiffNiche]           = useState("");
  const [difficultyResult,    setDifficultyResult]    = useState(null);
  const [diffLoading,         setDiffLoading]         = useState(false);

  /* ── Internal Links state ── */
  const [internalLinksUrl,     setInternalLinksUrl]     = useState("");
  const [internalLinksResult,  setInternalLinksResult]  = useState(null);
  const [internalLinksLoading, setInternalLinksLoading] = useState(false);
  const [internalLinksErr,     setInternalLinksErr]     = useState("");
  /* kept for legacy / outreach sub-tool */
  const [backlinkSub,         setBacklinkSub]         = useState("opportunities");
  const [backlinkNiche,       setBacklinkNiche]       = useState("");
  const [backlinkOppsResult,  setBacklinkOppsResult]  = useState(null);
  const [backlinkOppsLoading, setBacklinkOppsLoading] = useState(false);
  const [linkGapDomain,       setLinkGapDomain]       = useState("");
  const [linkGapComp1,        setLinkGapComp1]        = useState("");
  const [linkGapComp2,        setLinkGapComp2]        = useState("");
  const [linkGapNiche,        setLinkGapNiche]        = useState("");
  const [linkGapResult,       setLinkGapResult]       = useState(null);
  const [linkGapLoading,      setLinkGapLoading]      = useState(false);
  const [outreachTarget,      setOutreachTarget]      = useState("");
  const [outreachContentTitle,setOutreachContentTitle]= useState("");
  const [outreachType,        setOutreachType]        = useState("guest-post");
  const [outreachResult,      setOutreachResult]      = useState(null);
  const [outreachLoading,     setOutreachLoading]     = useState(false);
  const [anchorTextDomain,    setAnchorTextDomain]    = useState("");
  const [anchorTextResult,    setAnchorTextResult]    = useState(null);
  const [anchorTextLoading,   setAnchorTextLoading]   = useState(false);

  /* ── Local & E-E-A-T state ── */
  const [localSub,         setLocalSub]         = useState("gbp");
  const [gbpBusiness,      setGbpBusiness]      = useState("");
  const [gbpLocation,      setGbpLocation]      = useState("");
  const [gbpCategory,      setGbpCategory]      = useState("");
  const [gbpResult,        setGbpResult]        = useState(null);
  const [gbpLoading,       setGbpLoading]       = useState(false);
  const [citationBusiness, setCitationBusiness] = useState("");
  const [citationLocation, setCitationLocation] = useState("");
  const [citationCategory, setCitationCategory] = useState("");
  const [citationResult,   setCitationResult]   = useState(null);
  const [citationLoading,  setCitationLoading]  = useState(false);
  const [localKwService,   setLocalKwService]   = useState("");
  const [localKwCity,      setLocalKwCity]      = useState("");
  const [localKwResult,    setLocalKwResult]    = useState(null);
  const [localKwLoading,   setLocalKwLoading]   = useState(false);
  const [eeatResult,       setEeatResult]       = useState(null);
  const [eeatLoading,      setEeatLoading]      = useState(false);

  /* ── Voice & AI Search state ── */
  const [voiceSub,          setVoiceSub]          = useState("voice");
  const [voiceOptKeyword,   setVoiceOptKeyword]   = useState("");
  const [voiceOptResult,    setVoiceOptResult]    = useState(null);
  const [voiceOptLoading,   setVoiceOptLoading]   = useState(false);
  const [faqGenTopic,       setFaqGenTopic]       = useState("");
  const [faqGenResult,      setFaqGenResult]      = useState(null);
  const [faqGenLoading,     setFaqGenLoading]     = useState(false);
  const [aiOverviewKeyword, setAiOverviewKeyword] = useState("");
  const [aiOverviewResult,  setAiOverviewResult]  = useState(null);
  const [aiOverviewLoading, setAiOverviewLoading] = useState(false);
  const [convKwTopic,       setConvKwTopic]       = useState("");
  const [convKwResult,      setConvKwResult]      = useState(null);
  const [convKwLoading,     setConvKwLoading]     = useState(false);

  /* ── AI Growth state ── */
  const [passageResult,    setPassageResult]    = useState(null);
  const [passageLoading,   setPassageLoading]   = useState(false);

  /* ── GEO & LLM state ── */
  const [geoSub,           setGeoSub]           = useState("health");
  const [geoUrl,           setGeoUrl]           = useState("");
  const [geoScore,         setGeoScore]         = useState(null);
  const [geoLoading,       setGeoLoading]       = useState(false);
  const [geoErr,           setGeoErr]           = useState("");
  const [promptSimBrand,   setPromptSimBrand]   = useState("");
  const [promptSimQuery,   setPromptSimQuery]   = useState("");
  const [promptSimResult,  setPromptSimResult]  = useState(null);
  const [promptSimLoading, setPromptSimLoading] = useState(false);
  const [llmsTxtResult,    setLlmsTxtResult]    = useState(null);
  const [llmsTxtLoading,   setLlmsTxtLoading]   = useState(false);

  /* ── Rank Tracker state ── */
  const [rankKeywords,     setRankKeywords]     = useState("");
  const [rankDomain,       setRankDomain]       = useState("");
  const [rankResult,       setRankResult]       = useState(null);
  const [rankLoading,      setRankLoading]      = useState(false);
  const [rankErr,          setRankErr]          = useState("");

  /* ── Site Crawl state ── */
  const [crawlUrl,         setCrawlUrl]         = useState("");
  const [crawlResult,      setCrawlResult]      = useState(null);
  const [crawlLoading,     setCrawlLoading]     = useState(false);
  const [crawlErr,         setCrawlErr]         = useState("");
  const [crawlSub,         setCrawlSub]         = useState("crawl");

  /* ── Trend Scout state ── */
  const [trendSub,             setTrendSub]             = useState("rising");
  const [trendNiche,           setTrendNiche]           = useState("");
  const [trendIndustry,        setTrendIndustry]        = useState("");
  const [trendRising,          setTrendRising]          = useState(null);
  const [trendLoading,         setTrendLoading]         = useState(false);
  const [trendErr,             setTrendErr]             = useState("");
  const [trendSeasonal,        setTrendSeasonal]        = useState(null);
  const [trendSeasonalLoading, setTrendSeasonalLoading] = useState(false);
  const [trendSurge,           setTrendSurge]           = useState(null);
  const [trendSurgeLoading,    setTrendSurgeLoading]    = useState(false);

  /* ── A/B & Content Refresh state ── */
  const [abSub,            setAbSub]            = useState("ab");
  const [abVariantUrl,     setAbVariantUrl]     = useState("");
  const [abVariantResult,  setAbVariantResult]  = useState(null);
  const [abVariantLoading, setAbVariantLoading] = useState(false);

  /* ── Banner inline-fix state ── */
  const [bannerFixState,   setBannerFixState]   = useState({}); // {issueIdx: "loading"|"ok"|"error"}
  const [bulkFixing,       setBulkFixing]       = useState(false);
  const [bulkFixProgress,  setBulkFixProgress]  = useState(null); // {done, total}

  /* ── Smart-Fix (one-click all tools) state ── */
  const [smartFixCards,    setSmartFixCards]    = useState([]); // [{id, icon, label, status, result, applyField}]
  const [smartFixRunning,  setSmartFixRunning]  = useState(false);
  const [smartFixApplied,  setSmartFixApplied]  = useState(new Set()); // card ids applied
  const [smartFixApplying, setSmartFixApplying] = useState({});  // {cardId: bool}

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

  /* ── Auto-populate advanced section inputs from store data ── */
  useEffect(() => {
    if (!section) return;
    const storeNiche = shopDomain
      ? shopDomain.replace(".myshopify.com", "").replace(/-/g, " ")
      : (products[0]?.productType || products[0]?.vendor || "ecommerce");
    const storeBrand = shopDomain ? shopDomain.replace(".myshopify.com", "") : "";
    const storeRootUrl = shopDomain ? `https://${shopDomain}` : "";
    if (section === "Schema") {
      if (!schemaAuthorName && storeBrand) setSchemaAuthorName(storeBrand);
      if (!schemaPublisherName && storeBrand) setSchemaPublisherName(storeBrand);
    }
    if (section === "SERP") {
      if (!ctrTitle && scanResult?.title) setCtrTitle(scanResult.title);
      if (!ctrMeta && scanResult?.metaDescription) setCtrMeta(scanResult.metaDescription);
      if (!ctrKeyword && kwInput) setCtrKeyword(kwInput);
      if (!intentKeyword && kwInput) setIntentKeyword(kwInput);
      if (!paaKeyword && kwInput) setPaaKeyword(kwInput);
      if (!paaNiche && storeNiche) setPaaNiche(storeNiche);
      if (!snapKeyword && kwInput) setSnapKeyword(kwInput);
      if (!diffKeyword && kwInput) setDiffKeyword(kwInput);
      if (!diffNiche && storeNiche) setDiffNiche(storeNiche);
    }
    if (section === "Backlinks") {
      // Internal Links — auto-fill the current post URL
      if (!internalLinksUrl && url) setInternalLinksUrl(url);
      // keep legacy backlink state filled too
      if (!backlinkNiche && storeNiche) setBacklinkNiche(storeNiche);
      if (!linkGapDomain && shopDomain) setLinkGapDomain(shopDomain);
      if (!linkGapNiche && storeNiche) setLinkGapNiche(storeNiche);
      if (!anchorTextDomain && shopDomain) setAnchorTextDomain(shopDomain);
      if (!outreachContentTitle && scanResult?.title) setOutreachContentTitle(scanResult.title);
    }
    if (section === "AB") {
      if (!abVariantUrl && url) setAbVariantUrl(url);
    }
    if (section === "Local") {
      if (!gbpBusiness && storeBrand) setGbpBusiness(storeBrand);
      if (!citationBusiness && storeBrand) setCitationBusiness(storeBrand);
      if (!localKwService && storeNiche) setLocalKwService(storeNiche);
    }
    if (section === "Voice") {
      if (!voiceOptKeyword && kwInput) setVoiceOptKeyword(kwInput);
      if (!faqGenTopic && kwInput) setFaqGenTopic(kwInput);
      if (!aiOverviewKeyword && kwInput) setAiOverviewKeyword(kwInput);
      if (!convKwTopic && kwInput) setConvKwTopic(kwInput);
    }
    if (section === "AIGrowth") {
      // uses `url` which is already set from analyzer
    }
    if (section === "Rank") {
      if (!rankDomain && shopDomain) setRankDomain(shopDomain);
      if (!rankKeywords && kwInput) setRankKeywords(kwInput);
    }
    if (section === "Crawl") {
      if (!crawlUrl && storeRootUrl) setCrawlUrl(storeRootUrl);
    }
    if (section === "GEO") {
      if (!geoUrl && (url || storeRootUrl)) setGeoUrl(url || storeRootUrl);
      if (!promptSimBrand && storeBrand) setPromptSimBrand(storeBrand);
      if (!promptSimQuery && kwInput) setPromptSimQuery(`best ${kwInput}`);
    }
    if (section === "Trends") {
      if (!trendNiche && storeNiche) setTrendNiche(storeNiche);
    }
  }, [section]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Push a field value back to Shopify ── */
  const applyFieldToShopify = useCallback(async (field, value) => {
    if (!scannedArtId || !scannedBlogId) {
      showToast("Scan a post first so we know which Shopify article to update.");
      return;
    }
    try {
      const r = await apiFetch(`${API}/apply-field`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId: scannedArtId, blogId: scannedBlogId, field, value }),
      });
      const d = await r.json();
      if (d.ok) showToast(`Saved to Shopify: ${d.message || field}`);
      else showToast(`Shopify error: ${d.error}`);
    } catch (e) { showToast(`Error: ${e.message}`); }
  }, [scannedArtId, scannedBlogId, showToast]);

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

  /* ── Phase 2 API functions ── */

  // Technical SEO
  const runTechAudit = useCallback(async () => {
    if (!url.trim()) return;
    setTechLoading(true); setTechErr(""); setTechResult(null);
    try { const r = await apiFetchJSON(`${API}/technical/audit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) }); setTechResult(r); }
    catch (e) { setTechErr(e.message || "Audit failed"); } finally { setTechLoading(false); }
  }, [url]);

  const runPageSpeed = useCallback(async () => {
    if (!url.trim()) return;
    setPageSpeedLoading(true); setPageSpeedResult(null);
    try { const r = await apiFetchJSON(`${API}/technical/page-speed-advisor`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) }); setPageSpeedResult(r); }
    catch (e) { showToast(e.message || "Failed"); } finally { setPageSpeedLoading(false); }
  }, [url]);

  const runCwv = useCallback(async () => {
    if (!url.trim()) return;
    setCwvLoading(true); setCwvResult(null);
    try { const r = await apiFetchJSON(`${API}/technical/cwv-advisor`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) }); setCwvResult(r); }
    catch (e) { showToast(e.message || "Failed"); } finally { setCwvLoading(false); }
  }, [url]);

  const runSitemapCheck = useCallback(async () => {
    if (!url.trim()) return;
    setSitemapLoading(true); setSitemapResult(null);
    try { const r = await apiFetchJSON(`${API}/sitemap-check`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) }); setSitemapResult(r); }
    catch (e) { showToast(e.message || "Failed"); } finally { setSitemapLoading(false); }
  }, [url]);

  // Schema & Links
  const runSchemaGen = useCallback(async () => {
    if (!url.trim()) return;
    setSchemaGenLoading(true); setSchemaGenErr(""); setGeneratedSchema(null);
    try { const r = await apiFetchJSON(`${API}/schema/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim(), author: schemaAuthorName, publisher: schemaPublisherName }) }); setGeneratedSchema(r); }
    catch (e) { setSchemaGenErr(e.message || "Failed"); } finally { setSchemaGenLoading(false); }
  }, [url, schemaAuthorName, schemaPublisherName]);

  const runFaqSchema = useCallback(async () => {
    if (!url.trim()) return;
    setFaqSchemaLoading(true); setFaqSchemaResult(null);
    try { const r = await apiFetchJSON(`${API}/faq-schema/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) }); setFaqSchemaResult(r); }
    catch (e) { showToast(e.message || "Failed"); } finally { setFaqSchemaLoading(false); }
  }, [url]);

  const runHowtoSchema = useCallback(async () => {
    if (!howtoTitle.trim()) return;
    setHowtoLoading(true); setHowtoResult(null);
    try { const r = await apiFetchJSON(`${API}/schema/howto`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: howtoTitle.trim() }) }); setHowtoResult(r); }
    catch (e) { showToast(e.message || "Failed"); } finally { setHowtoLoading(false); }
  }, [howtoTitle]);

  // SERP & CTR
  const runCtrOptimizer = useCallback(async () => {
    if (!ctrKeyword.trim()) return;
    setCtrLoading(true); setCtrOptimizerResult(null);
    try { const r = await apiFetchJSON(`${API}/serp/ctr-optimizer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: ctrTitle, metaDescription: ctrMeta, keyword: ctrKeyword }) }); setCtrOptimizerResult(r); }
    catch (e) { showToast(e.message || "Failed"); } finally { setCtrLoading(false); }
  }, [ctrTitle, ctrMeta, ctrKeyword]);

  const runIntentClassifier = useCallback(async () => {
    if (!intentKeyword.trim()) return;
    setIntentLoading(true); setIntentResult(null);
    try { const r = await apiFetchJSON(`${API}/serp/intent-classifier`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: intentKeyword }) }); setIntentResult(r); }
    catch (e) { showToast(e.message || "Failed"); } finally { setIntentLoading(false); }
  }, [intentKeyword]);

  const runPaaGenerator = useCallback(async () => {
    if (!paaKeyword.trim()) return;
    setPaaLoading(true); setPaaResult(null);
    try { const r = await apiFetchJSON(`${API}/serp/paa-generator`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: paaKeyword, niche: paaNiche }) }); setPaaResult(r); }
    catch (e) { showToast(e.message || "Failed"); } finally { setPaaLoading(false); }
  }, [paaKeyword, paaNiche]);

  const runCompetitorSnapshot = useCallback(async () => {
    if (!snapKeyword.trim()) return;
    setSnapLoading(true); setCompetitorSnapshotResult(null);
    try { const r = await apiFetchJSON(`${API}/serp/competitor-snapshot`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: snapKeyword, url: url.trim() }) }); setCompetitorSnapshotResult(r); }
    catch (e) { showToast(e.message || "Failed"); } finally { setSnapLoading(false); }
  }, [snapKeyword, url]);

  const runDifficultyScore = useCallback(async () => {
    if (!diffKeyword.trim()) return;
    setDiffLoading(true); setDifficultyResult(null);
    try { const r = await apiFetchJSON(`${API}/serp/difficulty-score`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: diffKeyword, niche: diffNiche }) }); setDifficultyResult(r); }
    catch (e) { showToast(e.message || "Failed"); } finally { setDiffLoading(false); }
  }, [diffKeyword, diffNiche]);

  // Backlinks
  const runBacklinkOpps = useCallback(async () => {
    if (!backlinkNiche.trim()) return;
    setBacklinkOppsLoading(true); setBacklinkOppsResult(null);
    try { const r = await apiFetchJSON(`${API}/backlinks/opportunity-finder`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ niche: backlinkNiche, url: url.trim() }) }); setBacklinkOppsResult(r); }
    catch (e) { showToast(e.message || "Failed"); } finally { setBacklinkOppsLoading(false); }
  }, [backlinkNiche, url]);

  const runLinkGap = useCallback(async () => {
    if (!linkGapDomain.trim()) return;
    setLinkGapLoading(true); setLinkGapResult(null);
    try { const r = await apiFetchJSON(`${API}/backlinks/link-gap`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ yourDomain: linkGapDomain, competitor1: linkGapComp1, competitor2: linkGapComp2, niche: linkGapNiche }) }); setLinkGapResult(r); }
    catch (e) { showToast(e.message || "Failed"); } finally { setLinkGapLoading(false); }
  }, [linkGapDomain, linkGapComp1, linkGapComp2, linkGapNiche]);

  const runOutreachGen = useCallback(async () => {
    if (!outreachTarget.trim()) return;
    setOutreachLoading(true); setOutreachResult(null);
    try { const r = await apiFetchJSON(`${API}/backlinks/outreach-generator`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetSite: outreachTarget, contentTitle: outreachContentTitle, outreachType }) }); setOutreachResult(r); }
    catch (e) { showToast(e.message || "Failed"); } finally { setOutreachLoading(false); }
  }, [outreachTarget, outreachContentTitle, outreachType]);

  const runAnchorTextAnalysis = useCallback(async () => {
    if (!anchorTextDomain.trim()) return;
    setAnchorTextLoading(true); setAnchorTextResult(null);
    try { const r = await apiFetchJSON(`${API}/backlinks/anchor-text`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain: anchorTextDomain, niche: backlinkNiche }) }); setAnchorTextResult(r); }
    catch (e) { showToast(e.message || "Failed"); } finally { setAnchorTextLoading(false); }
  }, [anchorTextDomain, backlinkNiche]);

  /* ── Internal Links ── */
  const runInternalLinks = useCallback(async () => {
    const targetUrl = internalLinksUrl.trim() || url.trim();
    if (!targetUrl) return;
    setInternalLinksLoading(true); setInternalLinksErr(""); setInternalLinksResult(null);
    try {
      const r = await apiFetchJSON(`${API}/backlinks/internal-suggester`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: targetUrl }) });
      if (r.ok) setInternalLinksResult(r); else setInternalLinksErr(r.error || "Failed to analyse internal links");
    } catch (e) { setInternalLinksErr(e.message || "Failed"); }
    setInternalLinksLoading(false);
  }, [internalLinksUrl, url]);

  // Local & E-E-A-T
  const runGbpOptimizer = useCallback(async () => {
    if (!gbpBusiness.trim()) return;
    setGbpLoading(true); setGbpResult(null);
    try { const r = await apiFetchJSON(`${API}/local/gbp-optimizer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessName: gbpBusiness, location: gbpLocation, category: gbpCategory }) }); setGbpResult(r); }
    catch (e) { showToast(e.message || "Failed"); } finally { setGbpLoading(false); }
  }, [gbpBusiness, gbpLocation, gbpCategory]);

  const runCitationFinder = useCallback(async () => {
    if (!citationBusiness.trim()) return;
    setCitationLoading(true); setCitationResult(null);
    try { const r = await apiFetchJSON(`${API}/local/citation-finder`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessName: citationBusiness, location: citationLocation, category: citationCategory }) }); setCitationResult(r); }
    catch (e) { showToast(e.message || "Failed"); } finally { setCitationLoading(false); }
  }, [citationBusiness, citationLocation, citationCategory]);

  const runLocalKwGen = useCallback(async () => {
    if (!localKwService.trim()) return;
    setLocalKwLoading(true); setLocalKwResult(null);
    try { const r = await apiFetchJSON(`${API}/local/local-keyword-gen`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ service: localKwService, city: localKwCity }) }); setLocalKwResult(r); }
    catch (e) { showToast(e.message || "Failed"); } finally { setLocalKwLoading(false); }
  }, [localKwService, localKwCity]);

  const runEeatScorer = useCallback(async () => {
    if (!url.trim()) return;
    setEeatLoading(true); setEeatResult(null);
    try { const r = await apiFetchJSON(`${API}/brand/eeat-scorer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) }); setEeatResult(r); }
    catch (e) { showToast(e.message || "Failed"); } finally { setEeatLoading(false); }
  }, [url]);

  // Voice & AI Search
  const runVoiceOptimizer = useCallback(async () => {
    if (!voiceOptKeyword.trim()) return;
    setVoiceOptLoading(true); setVoiceOptResult(null);
    try { const r = await apiFetchJSON(`${API}/voice/voice-optimizer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: voiceOptKeyword }) }); setVoiceOptResult(r); }
    catch (e) { showToast(e.message || "Failed"); } finally { setVoiceOptLoading(false); }
  }, [voiceOptKeyword]);

  const runFaqGenerator = useCallback(async () => {
    if (!faqGenTopic.trim()) return;
    setFaqGenLoading(true); setFaqGenResult(null);
    try { const r = await apiFetchJSON(`${API}/voice/faq-generator`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: faqGenTopic }) }); setFaqGenResult(r); }
    catch (e) { showToast(e.message || "Failed"); } finally { setFaqGenLoading(false); }
  }, [faqGenTopic]);

  const runAiOverview = useCallback(async () => {
    if (!aiOverviewKeyword.trim()) return;
    setAiOverviewLoading(true); setAiOverviewResult(null);
    try { const r = await apiFetchJSON(`${API}/voice/ai-overview-optimizer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: aiOverviewKeyword, url: url.trim() }) }); setAiOverviewResult(r); }
    catch (e) { showToast(e.message || "Failed"); } finally { setAiOverviewLoading(false); }
  }, [aiOverviewKeyword, url]);

  const runConvKeywords = useCallback(async () => {
    if (!convKwTopic.trim()) return;
    setConvKwLoading(true); setConvKwResult(null);
    try { const r = await apiFetchJSON(`${API}/voice/conversational-keywords`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: convKwTopic }) }); setConvKwResult(r); }
    catch (e) { showToast(e.message || "Failed"); } finally { setConvKwLoading(false); }
  }, [convKwTopic]);

  // AI Growth
  const runPassageOptimizer = useCallback(async () => {
    if (!url.trim()) return;
    setPassageLoading(true); setPassageResult(null);
    try { const r = await apiFetchJSON(`${API}/ai/passage-optimizer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim(), keyword: kwInput.trim() }) }); setPassageResult(r); }
    catch (e) { showToast(e.message || "Failed"); } finally { setPassageLoading(false); }
  }, [url, kwInput]);

  // GEO & LLM
  const runGeoHealth = useCallback(async () => {
    if (!geoUrl.trim()) return;
    setGeoLoading(true); setGeoErr(""); setGeoScore(null);
    try { const r = await apiFetchJSON(`${API}/geo-health-score`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: geoUrl.trim() }) }); setGeoScore(r); }
    catch (e) { setGeoErr(e.message || "Failed"); } finally { setGeoLoading(false); }
  }, [geoUrl]);

  const runPromptSim = useCallback(async () => {
    if (!promptSimBrand.trim()) return;
    setPromptSimLoading(true); setPromptSimResult(null);
    try { const r = await apiFetchJSON(`${API}/ai-platform-tracker`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ brand: promptSimBrand, query: promptSimQuery }) }); setPromptSimResult(r); }
    catch (e) { showToast(e.message || "Failed"); } finally { setPromptSimLoading(false); }
  }, [promptSimBrand, promptSimQuery]);

  const runLlmsTxt = useCallback(async () => {
    if (!geoUrl.trim()) return;
    setLlmsTxtLoading(true); setLlmsTxtResult(null);
    try { const r = await apiFetchJSON(`${API}/llms-txt-generator`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: geoUrl.trim() }) }); setLlmsTxtResult(r); }
    catch (e) { showToast(e.message || "Failed"); } finally { setLlmsTxtLoading(false); }
  }, [geoUrl]);

  // Rank Tracker
  const runRankTracker = useCallback(async () => {
    if (!rankKeywords.trim() || !rankDomain.trim()) return;
    setRankLoading(true); setRankErr(""); setRankResult(null);
    try { const r = await apiFetchJSON(`${API}/rank-tracker`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keywords: rankKeywords.split("\n").map(k => k.trim()).filter(Boolean), domain: rankDomain.trim() }) }); setRankResult(r); }
    catch (e) { setRankErr(e.message || "Failed"); } finally { setRankLoading(false); }
  }, [rankKeywords, rankDomain]);

  // Site Crawl
  const runCrawl = useCallback(async () => {
    if (!crawlUrl.trim()) return;
    setCrawlLoading(true); setCrawlErr(""); setCrawlResult(null);
    try { const r = await apiFetchJSON(`${API}/crawler-access`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: crawlUrl.trim() }) }); setCrawlResult(r); }
    catch (e) { setCrawlErr(e.message || "Failed"); } finally { setCrawlLoading(false); }
  }, [crawlUrl]);

  // Trend Scout
  const runTrendRising = useCallback(async () => {
    if (!trendNiche.trim()) return;
    setTrendLoading(true); setTrendErr(""); setTrendRising(null);
    try { const r = await apiFetchJSON(`${API}/trends/rising`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ niche: trendNiche, industry: trendIndustry }) }); setTrendRising(r); }
    catch (e) { setTrendErr(e.message || "Failed"); } finally { setTrendLoading(false); }
  }, [trendNiche, trendIndustry]);

  const runTrendSeasonal = useCallback(async () => {
    if (!trendNiche.trim()) return;
    setTrendSeasonalLoading(true); setTrendSeasonal(null);
    try { const r = await apiFetchJSON(`${API}/trends/seasonal`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ niche: trendNiche, industry: trendIndustry }) }); setTrendSeasonal(r); }
    catch (e) { showToast(e.message || "Failed"); } finally { setTrendSeasonalLoading(false); }
  }, [trendNiche, trendIndustry]);

  const runTrendSurge = useCallback(async () => {
    if (!trendNiche.trim()) return;
    setTrendSurgeLoading(true); setTrendSurge(null);
    try { const r = await apiFetchJSON(`${API}/trends/surge`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ niche: trendNiche }) }); setTrendSurge(r); }
    catch (e) { showToast(e.message || "Failed"); } finally { setTrendSurgeLoading(false); }
  }, [trendNiche]);

  // A/B & Content Refresh
  const runAbVariants = useCallback(async () => {
    if (!abVariantUrl.trim()) return;
    setAbVariantLoading(true); setAbVariantResult(null);
    try { const r = await apiFetchJSON(`${API}/serp/meta-ab-variants`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: abVariantUrl.trim(), keyword: kwInput.trim() }) }); setAbVariantResult(r); }
    catch (e) { showToast(e.message || "Failed"); } finally { setAbVariantLoading(false); }
  }, [abVariantUrl, kwInput]);

  /* ═══════════════════════════
     ISSUE HINT MAPPER
     Maps an issue message -> { hint, label, action }
     Rules:
       - Only call setExpertMode(true) when navigating to an ADVANCED section
       - BEGINNER sections (Analyze, Keywords, Write, Optimize, Chat, BulkScan, History)
         must NOT call setExpertMode(true)
  ═══════════════════════════ */
  /* ── Map an issue message → the field name that can be AI-fixed ── */
  const fixableField = (msg) => {
    const m = (msg || "").toLowerCase();
    if (m.includes("title")) return "title";
    if (m.includes("meta description") || m.includes("meta desc")) return "metaDescription";
    if (m.includes("h1")) return "h1";
    if ((m.includes("h2") || m.includes("subheading") || m.includes("heading")) && !m.includes("url")) return "headings";
    if (m.includes("url") || m.includes("slug") || m.includes("handle")) return "handle";
    return null;
  };

  /* ── AI rewrite a field then immediately apply to Shopify (no navigation) ── */
  const runBannerFix = useCallback(async (field, issueIdx) => {
    if (!scanResult) { showToast("Scan a post first"); return; }
    if (!scannedArtId || !scannedBlogId) { showToast("Select a post from the dropdown first so we know which Shopify article to update."); return; }
    setBannerFixState(p => ({ ...p, [issueIdx]: "loading" }));
    // Map field → current value so the backend has something to rewrite
    const currentValueMap = { title: scanResult.title, metaDescription: scanResult.metaDescription, h1: scanResult.h1, headings: scanResult.h1 || scanResult.title, handle: scanResult.handle || scanResult.url };
    const currentValue = currentValueMap[field] || scanResult.title || "";
    try {
      const rw = await apiFetchJSON(`${API}/ai/rewrite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field, currentValue, url: scanResult.url, keywords: kwInput }),
      });
      if (!rw.ok) throw new Error(rw.error || "Rewrite failed");
      // Backend returns { structured: { variants: [{text}] } } — pick best variant
      const val = rw.structured?.variants?.[0]?.text || rw.value || rw.suggestion;
      if (!val) throw new Error("AI returned no suggestion");
      const ap = await apiFetchJSON(`${API}/apply-field`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId: scannedArtId, blogId: scannedBlogId, field, value: val, shop: shopDomain }),
      });
      if (!ap.ok) throw new Error(ap.error || "Apply failed");
      setBannerFixState(p => ({ ...p, [issueIdx]: "ok" }));
      setFixedFields(p => new Set([...p, field]));
      showToast(`✓ ${field} updated in Shopify`);
    } catch(e) {
      setBannerFixState(p => ({ ...p, [issueIdx]: "error" }));
      showToast(`Fix failed: ${e.message}`);
    }
  }, [scanResult, scannedArtId, scannedBlogId, kwInput, shopDomain, showToast]);

  /* ── Bulk fix all auto-fixable issues in scanResult ── */
  const runBulkFix = useCallback(async () => {
    const issues = scanResult?.scored?.issues ?? [];
    const fixable = issues
      .map((iss, i) => ({ ...iss, idx: i, field: fixableField(iss.msg) }))
      .filter(x => x.field);
    if (!fixable.length) { showToast("No auto-fixable issues found"); return; }
    setBulkFixing(true);
    setBulkFixProgress({ done: 0, total: fixable.length });
    for (const item of fixable) {
      await runBannerFix(item.field, item.idx);
      setBulkFixProgress(p => ({ ...p, done: (p?.done ?? 0) + 1 }));
    }
    setBulkFixing(false);
    showToast(`All ${fixable.length} fix${fixable.length !== 1 ? "es" : ""} applied to Shopify!`);
  }, [scanResult, runBannerFix, showToast]);

  /* ── Smart Fix — run ALL tools on the scanned post in parallel ── */
  const runSmartFix = useCallback(async () => {
    if (!scanResult) { showToast("Scan a post first"); return; }
    const base = {
      url: scanResult.url, title: scanResult.title,
      metaDescription: scanResult.metaDescription, h1: scanResult.h1,
      keywords: kwInput, wordCount: scanResult.wordCount,
    };
    const MODULES = [
      { id: "title",   icon: "✏️",  label: "Optimise Page Title",        applyField: "title" },
      { id: "meta",    icon: "📝",  label: "Rewrite Meta Description",   applyField: "metaDescription" },
      { id: "h1",      icon: "📌",  label: "Fix Main Heading (H1)",      applyField: "h1" },
      { id: "headings",icon: "📋",  label: "Improve Sub-headings",       applyField: "headings" },
      { id: "schema",  icon: "🗂️",  label: "Generate Schema Markup",     applyField: "schema" },
      { id: "links",   icon: "🔗",  label: "Internal Link Suggestions",  applyField: null },
      { id: "metaopt", icon: "🎯",  label: "Meta Description Optimiser", applyField: "metaDescription" },
    ];
    setSmartFixCards(MODULES.map(m => ({ ...m, status: "loading", result: null, error: null })));
    setSmartFixRunning(true);
    setSmartFixApplied(new Set());
    setSmartFixApplying({});
    const upd = (id, patch) => setSmartFixCards(p => p.map(c => c.id === id ? { ...c, ...patch } : c));
    // Backend requires currentValue for each field
    const cvMap = { title: scanResult.title||"untitled", metaDescription: scanResult.metaDescription||scanResult.title||"", h1: scanResult.h1||scanResult.title||"", headings: scanResult.h1||scanResult.title||"" };
    const calls = [
      apiFetchJSON(`${API}/ai/rewrite`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ field:"title", currentValue: cvMap.title, url: base.url, keywords: base.keywords }) })
        .then(r => upd("title", r.ok ? { status:"done", result: r } : { status:"error", error: r.error||"Failed" }))
        .catch(e => upd("title", { status:"error", error: e.message })),
      apiFetchJSON(`${API}/ai/rewrite`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ field:"metaDescription", currentValue: cvMap.metaDescription, url: base.url, keywords: base.keywords }) })
        .then(r => upd("meta", r.ok ? { status:"done", result: r } : { status:"error", error: r.error||"Failed" }))
        .catch(e => upd("meta", { status:"error", error: e.message })),
      apiFetchJSON(`${API}/ai/rewrite`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ field:"h1", currentValue: cvMap.h1, url: base.url, keywords: base.keywords }) })
        .then(r => upd("h1", r.ok ? { status:"done", result: r } : { status:"error", error: r.error||"Failed" }))
        .catch(e => upd("h1", { status:"error", error: e.message })),
      apiFetchJSON(`${API}/ai/rewrite`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ field:"headings", currentValue: cvMap.headings, url: base.url, keywords: base.keywords }) })
        .then(r => upd("headings", r.ok ? { status:"done", result: r } : { status:"error", error: r.error||"Failed" }))
        .catch(e => upd("headings", { status:"error", error: e.message })),
      apiFetchJSON(`${API}/schema/generate`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ url: scanResult.url, title: scanResult.title, articleBody: scanResult.h1||scanResult.title }) })
        .then(r => upd("schema", r.ok ? { status:"done", result: r } : { status:"error", error: r.error||"Failed" }))
        .catch(e => upd("schema", { status:"error", error: e.message })),
      apiFetchJSON(`${API}/backlinks/internal-suggester`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ url: scanResult.url }) })
        .then(r => upd("links", r.ok ? { status:"done", result: r } : { status:"error", error: r.error||"Failed" }))
        .catch(e => upd("links", { status:"error", error: e.message })),
      apiFetchJSON(`${API}/meta-description-optimizer`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ url: scanResult.url, currentMeta: scanResult.metaDescription||scanResult.title||"", keyword: kwInput }) })
        .then(r => upd("metaopt", r.ok ? { status:"done", result: r } : { status:"error", error: r.error||"Failed" }))
        .catch(e => upd("metaopt", { status:"error", error: e.message })),
    ];
    await Promise.allSettled(calls);
    setSmartFixRunning(false);
  }, [scanResult, kwInput, showToast]);

  /* ── Smart Fix — apply a single card to Shopify ── */
  const applySmartCard = useCallback(async (card) => {
    if (!scannedArtId || !scannedBlogId) { showToast("Select a post from the store dropdown first"); return; }
    // Backend /ai/rewrite returns structured.variants[0].text; fallback to direct value keys
    const val = card.result?.structured?.variants?.[0]?.text
      || (card.id === "metaopt" ? card.result?.variants?.[card.result?.bestVariant ?? 0]?.text : null)
      || card.result?.value || card.result?.suggestion
      || card.result?.optimizedMeta || card.result?.schema;
    if (!val) { showToast("AI returned no suggestion for this fix"); return; }
    setSmartFixApplying(p => ({ ...p, [card.id]: true }));
    try {
      const r = await apiFetchJSON(`${API}/apply-field`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ articleId: scannedArtId, blogId: scannedBlogId, field: card.applyField, value: val, shop: shopDomain }) });
      if (r.ok) { setSmartFixApplied(p => new Set([...p, card.id])); setFixedFields(p => new Set([...p, card.applyField])); showToast(`✓ ${card.label} applied to Shopify`); }
      else showToast(`Shopify error: ${r.error}`);
    } catch(e) { showToast(`Error: ${e.message}`); }
    setSmartFixApplying(p => ({ ...p, [card.id]: false }));
  }, [scannedArtId, scannedBlogId, shopDomain, showToast]);

  /* ── Smart Fix — apply ALL done cards ── */
  const applyAllSmartCards = useCallback(async () => {
    const toApply = smartFixCards.filter(c => c.status === "done" && c.applyField && !smartFixApplied.has(c.id));
    for (const card of toApply) await applySmartCard(card);
    showToast("All fixes applied to Shopify!");
  }, [smartFixCards, smartFixApplied, applySmartCard, showToast]);

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
    /* ── Advanced sections ── */
    if (m.includes("schema") || m.includes("structured data") || m.includes("json-ld"))
      return { label: "Add Schema", action: () => { setSection("Schema"); } };
    if (m.includes("date") || m.includes("freshness") || m.includes("publish") || m.includes("modified"))
      return { label: "Add Schema", action: () => { setSection("Schema"); } };
    if (m.includes("author"))
      return { label: "Add Author", action: () => { setSection("Local"); } };
    if (m.includes("internal link"))
      return { label: "Internal Links", action: () => { setSection("Backlinks"); } };
    if (m.includes("backlink") || m.includes("link build"))
      return { label: "Internal Links", action: () => { setSection("Backlinks"); } };
    if (m.includes("canonical") || m.includes("robots") || m.includes("noindex") || m.includes("https") || m.includes("image") || m.includes("alt") || m.includes("og:") || m.includes("open graph") || m.includes("technical") || m.includes("core web") || m.includes("speed"))
      return { label: "Technical SEO", action: () => { setSection("Technical"); } };
    return null;
  }, [runRewrite, setSection]);
  /* ═══════════════════════════
     RENDER
  ═══════════════════════════ */
  const visibleSections = SECTIONS;
  const activeSec = section ? SECTIONS.find(s => s.id === section) : null;

  return (
    <div style={S.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Toast notification ── */}
      {toast && (
        <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: "#1f2937", border: "1px solid #4f46e5", borderRadius: 10, padding: "12px 22px", color: "#fafafa", fontSize: 13, fontWeight: 600, zIndex: 999999, maxWidth: 420, boxShadow: "0 4px 24px #0008", pointerEvents: "none", textAlign: "center", whiteSpace: "nowrap" }}>
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
      </div>

      {/* ── Body layout ── */}
      <div style={S.layout}>

        {/* ── Sidebar — shown when a section is active ── */}
        {section && <nav style={S.sidebar}>
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
              {s.title}
            </div>
          ))}
        </nav>}

        {/* ── Main content ── */}
        <div style={S.main}>

          {/* ════════════════════════════
          {/* ════════════════════════════
              HOME DASHBOARD
          ════════════════════════════ */}
          {!section && (
            <div style={{ maxWidth: 720, margin: "0 auto", paddingTop: 32 }}>

              {/* Store status banner */}
              {shopLoading ? (
                <div style={{ ...S.card, display: "flex", alignItems: "center", gap: 10, color: C.sub, fontSize: 13 }}>
                  <span style={S.spinner} /> Connecting to your store...
                </div>
              ) : shopDomain ? (
                <div style={{ background: "#0c1a0c", border: "1px solid #14532d", borderRadius: 10, padding: "10px 16px", marginBottom: 20, fontSize: 13, color: "#86efac", display: "flex", alignItems: "center", gap: 8 }}>
                  Connected to <strong style={{ margin: "0 4px" }}>{shopDomain}</strong> &middot; {articles.length} post{articles.length !== 1 ? "s" : ""} ready
                </div>
              ) : (
                <div style={{ background: "#1c1007", border: "1px solid #92400e", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#d97706" }}>
                  No store connected — you can still paste a URL below
                </div>
              )}

              {/* ── Home ── */}
              <>
                  {simpleFlow === null && (
                    <>
                      <div style={{ textAlign: "center", marginBottom: 28 }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: "#fafafa", marginBottom: 8 }}>What would you like to do?</div>
                        <div style={{ fontSize: 14, color: "#71717a" }}>Pick a goal — we'll take care of the rest.</div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
                        <div onClick={() => { setSimpleFlow("fix"); setScanResult(null); }}
                          style={{ background: "#0f172a", border: "2px solid #3730a3", borderRadius: 14, padding: "28px 22px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center", transition: "border-color 0.15s" }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = "#6366f1"}
                          onMouseLeave={e => e.currentTarget.style.borderColor = "#3730a3"}>
                          <span style={{ fontSize: 40, lineHeight: 1 }}></span>
                          <div style={{ fontSize: 17, fontWeight: 700, color: "#e0e7ff" }}>Fix an existing post</div>
                          <div style={{ fontSize: 13, color: "#818cf8", lineHeight: 1.6 }}>{"We'll scan your post, find what's hurting your ranking, and fix it in one click."}</div>
                          <div style={{ marginTop: 8, background: "#312e81", borderRadius: 8, padding: "7px 20px", fontSize: 13, fontWeight: 600, color: "#c7d2fe" }}>Check my post</div>
                        </div>
                        <div onClick={() => {
                            setSimpleFlow("write"); setDraftKw(""); setDraftResult(null);
                            setSimpleTopics(null); setSimpleTopicsLoading(true);
                            (async () => {
                              try {
                                const niche = shopDomain ? shopDomain.replace(".myshopify.com","").replace(/-/g,"") : (products[0]?.title || "e-commerce");
                                const resp = await apiFetch(`${API}/ai/topic-miner`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ niche, targetAudience: "online shoppers" }) });
                                const d = await resp.json();
                                if (d.ok && d.blogIdeas) setSimpleTopics(d.blogIdeas.slice(0, 3)); else setSimpleTopics([]);
                              } catch { setSimpleTopics([]); }
                              setSimpleTopicsLoading(false);
                            })();
                          }}
                          style={{ background: "#0c1a0c", border: "2px solid #14532d", borderRadius: 14, padding: "28px 22px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, textAlign: "center", transition: "border-color 0.15s" }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = "#22c55e"}
                          onMouseLeave={e => e.currentTarget.style.borderColor = "#14532d"}>
                          <span style={{ fontSize: 40, lineHeight: 1 }}></span>
                          <div style={{ fontSize: 17, fontWeight: 700, color: "#dcfce7" }}>Write a new blog post</div>
                          <div style={{ fontSize: 13, color: "#86efac", lineHeight: 1.6 }}>{"Tell us a topic and AI will create a full structured post you can copy straight into Shopify."}</div>
                          <div style={{ marginTop: 8, background: "#14532d", borderRadius: 8, padding: "7px 20px", fontSize: 13, fontWeight: 600, color: "#bbf7d0" }}>Create a post</div>
                        </div>
                      </div>
                      <div style={{ borderTop: "1px solid #27272a", marginTop: 8, paddingTop: 28 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 12 }}>Or go straight to a tool:</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#3f3f46", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8, marginTop: 4 }}>Core Tools</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                          {SECTIONS.filter(s => s.level === "beginner").map(s => (
                            <div key={s.id} onClick={() => setSection(s.id)}
                              style={{ background: "#18181b", border: `2px solid ${s.color}22`, borderRadius: 12, padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "border-color 0.15s" }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = s.color; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = `${s.color}22`; }}>
                              <div style={{ width: 4, height: 38, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "#fafafa", marginBottom: 2 }}>{s.title}</div>
                                <div style={{ fontSize: 12, color: "#71717a" }}>{s.desc}</div>
                              </div>
                              <div style={{ background: `${s.color}22`, borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: s.color, flexShrink: 0 }}>Open &rarr;</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#3f3f46", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Advanced Tools</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
                          {SECTIONS.filter(s => s.level === "advanced").map(s => (
                            <div key={s.id} onClick={() => setSection(s.id)}
                              style={{ background: "#18181b", border: `2px solid ${s.color}22`, borderRadius: 12, padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "border-color 0.15s" }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = s.color; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = `${s.color}22`; }}>
                              <div style={{ width: 4, height: 38, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: "#fafafa", marginBottom: 2 }}>{s.title}</div>
                                <div style={{ fontSize: 12, color: "#71717a" }}>{s.desc}</div>
                              </div>
                              <div style={{ background: `${s.color}22`, borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: s.color, flexShrink: 0 }}>Open &rarr;</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {simpleFlow === "fix" && !scanResult && (
                    <>
                      <button style={{ ...S.btn(), marginBottom: 20, fontSize: 13 }} onClick={() => setSimpleFlow(null)}>Back</button>
                      <div style={{ background: "#0f172a", border: "1px solid #3730a3", borderRadius: 14, padding: "28px 24px" }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "#e0e7ff", marginBottom: 6 }}>Which post do you want to check?</div>
                        <div style={{ fontSize: 13, color: "#818cf8", marginBottom: 20 }}>{"We'll analyse it and show you exactly what to fix."}</div>
                        {articles.length > 0 ? (
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 13, color: "#a5b4fc", marginBottom: 8 }}>Pick from your store:</div>
                            <select style={{ ...S.input, width: "100%" }} value={selectedArtId} onChange={e => handleArticleSelect(e.target.value)}>
                              <option value="">Choose a blog post</option>
                              {articles.map(a => <option key={a.id} value={String(a.id)}>{a.title}</option>)}
                            </select>
                          </div>
                        ) : (
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 13, color: "#a5b4fc", marginBottom: 8 }}>Paste your blog post URL:</div>
                            <input style={{ ...S.input, width: "100%" }} placeholder="https://yourstore.com/blogs/news/your-post" value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && runScan()} />
                          </div>
                        )}
                        <button style={{ ...S.btn("primary"), width: "100%", fontSize: 15, padding: "12px 20px", justifyContent: "center" }} onClick={runScan} disabled={!url.trim() || scanning}>
                          {scanning ? <><span style={S.spinner} /> Checking your post...</> : "Check My Post"}
                        </button>
                        {scanErr && <div style={{ marginTop: 10, fontSize: 12, color: "#f87171" }}>{scanErr}</div>}
                      </div>
                    </>
                  )}

                  {simpleFlow === "fix" && scanResult && (() => {
                    const score = scanResult.scored?.overall ?? 0;
                    const grade = scanResult.scored?.grade ?? "?";
                    const sc = score >= 75 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444";
                    const scMsg = score >= 75 ? "Looking good! A few tweaks will make it even better." : score >= 50 ? "Room for improvement — fix the issues below." : "Needs some work but the fixes below will help a lot.";
                    const topIssues = (scanResult.scored?.issues || []).filter(i => i.sev === "high" || i.sev === "medium").sort((a, b) => a.sev === "high" ? -1 : 1);
                    return (
                      <>
                        <button style={{ ...S.btn(), marginBottom: 20, fontSize: 13 }} onClick={() => setScanResult(null)}>Check a different post</button>
                        <div style={{ background: "#18181b", border: `2px solid ${sc}`, borderRadius: 14, padding: "20px 24px", marginBottom: 16, display: "flex", alignItems: "center", gap: 20 }}>
                          <div style={{ width: 72, height: 72, borderRadius: "50%", border: `4px solid ${sc}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ fontSize: 26, fontWeight: 800, color: sc }}>{score}</span>
                          </div>
                          <div>
                            <div style={{ fontSize: 18, fontWeight: 700, color: "#fafafa" }}>Your post scored {score}/100 <span style={{ fontSize: 15, color: sc, fontWeight: 600 }}>({grade})</span></div>
                            <div style={{ fontSize: 13, color: "#a1a1aa", marginTop: 4 }}>{scMsg}</div>
                          </div>
                        </div>
                        {/* ═ One-click all tools CTA ═ */}
                        <div style={{ background:"#130d1f", border:"2px solid #7c3aed", borderRadius:12, padding:"18px 20px", marginBottom:20, display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                          <span style={{ fontSize:28, lineHeight:1 }}>⚡</span>
                          <div style={{ flex:1, minWidth:180 }}>
                            <div style={{ fontSize:14, fontWeight:700, color:"#e9d5ff", marginBottom:3 }}>Fix everything automatically</div>
                            <div style={{ fontSize:12, color:"#a78bfa" }}>AI rewrites your title, meta, headings, schema and finds internal link gaps — all on one screen.</div>
                          </div>
                          <button
                            style={{ ...S.btn("primary"), fontSize:13, padding:"10px 22px", background:"#7c3aed", borderColor:"#7c3aed", flexShrink:0 }}
                            onClick={() => setSection("SmartFix")}>
                            Run All Tools &rarr;
                          </button>
                        </div>
                        {topIssues.length === 0 && <div style={{ background: "#0c1a0c", border: "1px solid #14532d", borderRadius: 12, padding: "18px 20px", fontSize: 14, color: "#86efac", textAlign: "center" }}>No major issues found — your post is in great shape!</div>}
                        {topIssues.length > 0 && (
                          <>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#71717a", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>{"Here's what to fix:"}</div>
                            {topIssues.map((issue, i) => { const act = getIssueAction(issue.msg); return (
                              <div key={i} style={{ background: "#18181b", border: `1px solid ${issue.sev === "high" ? "#7f1d1d" : "#78350f"}`, borderRadius: 12, padding: "16px 18px", marginBottom: 10 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: issue.sev === "high" ? "#f87171" : "#fbbf24", marginBottom: 4 }}>{issue.sev === "high" ? "High priority" : "Worth fixing"}</div>
                                <div style={{ fontSize: 13, color: "#d4d4d8", marginBottom: act ? 10 : 0 }}>{issue.msg}</div>
                                {act && <button style={{ ...S.btn("primary"), fontSize: 13, padding: "8px 18px" }} onClick={act.action}>{act.label}</button>}
                              </div>
                            ); })}
                          </>
                        )}
                        {rewriting && <div style={{ ...S.card, display: "flex", alignItems: "center", gap: 10, color: "#a5b4fc", marginTop: 10 }}><span style={S.spinner} /> AI is generating a fix...</div>}
                        {rewriteResult && !rewriting && (
                          <div style={{ background: "#0f172a", border: "1px solid #3730a3", borderRadius: 12, padding: "16px 18px", marginTop: 12 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#a5b4fc", marginBottom: 8 }}>AI Suggestion:</div>
                            <div style={{ fontSize: 13, color: "#e0e7ff", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{typeof rewriteResult === "string" ? rewriteResult : JSON.stringify(rewriteResult, null, 2)}</div>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {simpleFlow === "write" && (
                    <>
                      <button style={{ ...S.btn(), marginBottom: 20, fontSize: 13 }} onClick={() => { if (draftResult) setDraftResult(null); else setSimpleFlow(null); }}>Back</button>
                      {simpleTopicsLoading && <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: "16px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10, color: "#a5b4fc", fontSize: 13 }}><span style={S.spinner} /> Reading your store and finding the best blog ideas for you...</div>}
                      {simpleTopics && simpleTopics.length > 0 && !simpleTopicsLoading && (
                        <div style={{ marginBottom: 20 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#71717a", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>AI picked these ideas for your store — click one to use it:</div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
                            {simpleTopics.map((t, i) => (
                              <div key={i} onClick={() => setDraftKw(t.targetKeyword || t.title)}
                                style={{ background: draftKw === (t.targetKeyword || t.title) ? "#1e1b4b" : "#18181b", border: `1px solid ${draftKw === (t.targetKeyword || t.title) ? "#6366f1" : "#27272a"}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer", transition: "border-color 0.15s" }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: "#e0e7ff", marginBottom: 4 }}>{t.title}</div>
                                <div style={{ fontSize: 11, color: "#818cf8" }}>Keyword: {t.targetKeyword}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div style={{ background: "#0c1a0c", border: "1px solid #14532d", borderRadius: 14, padding: "24px", marginBottom: draftResult ? 16 : 0 }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: "#dcfce7", marginBottom: 4 }}>{draftKw ? `Writing about: ${draftKw}` : "Or type your own topic"}</div>
                        <div style={{ fontSize: 13, color: "#86efac", marginBottom: 14 }}>AI will generate a full structured blog post ready to paste into Shopify.</div>
                        <input style={{ ...S.input, width: "100%", marginBottom: 12 }} placeholder="e.g. best snowboards for beginners" value={draftKw} onChange={e => setDraftKw(e.target.value)} onKeyDown={e => e.key === "Enter" && !draftLoading && draftKw.trim() && runDraft()} />
                        <button style={{ ...S.btn("primary"), width: "100%", fontSize: 15, padding: "12px 20px", justifyContent: "center" }} onClick={runDraft} disabled={draftLoading || !draftKw.trim()}>
                          {draftLoading ? <><span style={S.spinner} /> Writing your post...</> : "Create My Blog Post (2 credits)"}
                        </button>
                      </div>
                      {draftResult && !draftLoading && (
                        <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "24px" }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: "#fafafa", marginBottom: 4 }}>Your post is ready!</div>
                          <div style={{ fontSize: 13, color: "#71717a", marginBottom: 16 }}>Copy it into your Shopify blog editor.</div>
                          {draftResult.title && <div style={{ fontSize: 14, fontWeight: 700, color: "#e0e7ff", marginBottom: 8 }}>{draftResult.title}</div>}
                          {draftResult.fullArticle && <div style={{ maxHeight: 300, overflowY: "auto", background: "#09090b", borderRadius: 8, padding: 12, fontSize: 13, color: "#d4d4d8", lineHeight: 1.6, whiteSpace: "pre-wrap", marginBottom: 12 }}>{draftResult.fullArticle}</div>}
                          <button style={{ ...S.btn("primary") }} onClick={() => { navigator.clipboard.writeText(draftResult.fullArticle || draftResult.title || ""); showToast("Copied to clipboard!"); }}>Copy to clipboard</button>
                        </div>
                      )}
                    </>
                  )}
                </>


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
              POST CONTEXT BANNER
              Shown on every section (except Analyze) when a post has been scanned.
              Lets the user see at a glance which post they are working on and what issues were found.
          ════════════════════════════ */}
          {section && section !== "Analyze" && scanResult && (() => {
            const score   = scanResult.scored?.overall ?? null;
            const grade   = scanResult.scored?.grade   ?? "";
            const issues  = scanResult.scored?.issues  ?? [];
            const scoreColor = score === null ? C.dim : score >= 75 ? C.green : score >= 50 ? C.yellow : C.red;
            /* filter issues relevant to current section */
            const relevance = {
              Technical: ["speed","core web","canonical","robots","https","og:","open graph","image","alt"],
              Schema:    ["schema","structured","json-ld","author","publisher"],
              SERP:      ["title","meta description","ctr","snippet","intent"],
              Backlinks: ["internal link","orphan"],
              AB:        ["title","meta"],
              Local:     ["local","author","e-e-a-t","eeat","brand"],
              Voice:     ["question","faq","voice","ai overview"],
              AIGrowth:  ["passage","content","word"],
              Rank:      ["keyword","ranking","position"],
              Crawl:     ["crawl","broken","redirect","sitemap"],
              GEO:       ["ai","llm","geo","generative"],
              Trends:    ["fresh","trend","outdated","stale"],
            };
            const keywords = relevance[section] || [];
            const relevant = keywords.length
              ? issues.filter(i => keywords.some(k => (i.msg || "").toLowerCase().includes(k)))
              : issues.slice(0, 5);
            const shown = (relevant.length ? relevant : issues).slice(0, 6);
            return (
              <div style={{ background:"#0d0d1a", border:"1px solid #1e1b4b", borderRadius:12, padding:"14px 18px", marginBottom:18 }}>
                {/* post info row */}
                <div style={{ display:"flex", gap:14, alignItems:"center", flexWrap:"wrap", marginBottom: shown.length ? 12 : 0 }}>
                  {score !== null && (
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", width:52, height:52, borderRadius:"50%", border:`2px solid ${scoreColor}`, color:scoreColor, fontWeight:800, fontSize:18, flexShrink:0 }}>
                      {score}
                    </div>
                  )}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:C.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                      {scanResult.title || "Untitled post"}
                    </div>
                    <div style={{ fontSize:11, color:C.dim, marginTop:2, display:"flex", gap:8, flexWrap:"wrap" }}>
                      {grade && <span style={{ color: scoreColor, fontWeight:600 }}>Grade {grade}</span>}
                      {scanResult.wordCount && <span>{scanResult.wordCount} words</span>}
                      {scanResult.url && <span style={{ overflow:"hidden", textOverflow:"ellipsis", maxWidth:260 }}>{scanResult.url.replace(/^https?:\/\//, "")}</span>}
                    </div>
                  </div>
                  <button
                    style={{ ...S.btn(), fontSize:11, padding:"4px 12px", flexShrink:0 }}
                    onClick={() => setSection("Analyze")}
                  >View full report</button>
                </div>
                {/* relevant issues */}
                {shown.length > 0 && (
                  <div style={{ borderTop:`1px solid #1e1b4b`, paddingTop:10 }}>
                    {/* section header + Fix All button */}
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:7, flexWrap:"wrap", gap:6 }}>
                      <div style={{ fontSize:10, fontWeight:700, color:"#6366f1", textTransform:"uppercase", letterSpacing:"0.8px" }}>
                        {relevant.length ? "Issues relevant to this section" : "Top issues to fix"}
                      </div>
                      {scannedArtId && (
                        <button
                          style={{ ...S.btn("primary"), fontSize:10, padding:"3px 12px", flexShrink:0, opacity: bulkFixing ? 0.6 : 1 }}
                          onClick={runBulkFix}
                          disabled={bulkFixing}
                        >
                          {bulkFixing
                            ? `Fixing ${(bulkFixProgress?.done ?? 0) + 1} of ${bulkFixProgress?.total ?? "?"}…`
                            : "🔧 Auto-Fix All"}
                        </button>
                      )}
                    </div>
                    {/* bulk progress bar */}
                    {bulkFixing && bulkFixProgress && (
                      <div style={{ height:4, background:"#1e1b4b", borderRadius:2, marginBottom:8, overflow:"hidden" }}>
                        <div style={{ height:"100%", background:"#6366f1", width:`${Math.round(((bulkFixProgress.done) / bulkFixProgress.total) * 100)}%`, transition:"width 0.3s" }} />
                      </div>
                    )}
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {shown.map((issue, i) => {
                        const sev      = issue.severity || issue.sev || "low";
                        const sevColor = sev === "high" ? "#fca5a5" : sev === "medium" ? "#fbbf24" : "#93c5fd";
                        const fField   = fixableField(issue.msg);
                        const fixSt    = bannerFixState[i];
                        const alreadyFixed = fixSt === "ok" || fixedFields.has(fField || "");
                        return (
                          <div key={i} style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                            {/* severity dot or fixed tick */}
                            {alreadyFixed
                              ? <span style={{ fontSize:13, flexShrink:0 }}>✅</span>
                              : <span style={{ width:6, height:6, borderRadius:"50%", background:sevColor, flexShrink:0, marginTop:1 }} />}
                            <span style={{ fontSize:12, color: alreadyFixed ? C.dim : C.sub, flex:1, textDecoration: alreadyFixed ? "line-through" : "none" }}>{issue.msg}</span>
                            {/* Fix & Apply inline button — stays on this section */}
                            {fField && scannedArtId && !alreadyFixed && (
                              <button
                                style={{ ...S.btn("primary"), fontSize:10, padding:"3px 10px", flexShrink:0, background:"#059669", borderColor:"#059669", opacity: fixSt === "loading" ? 0.6 : 1 }}
                                onClick={() => runBannerFix(fField, i)}
                                disabled={fixSt === "loading" || bulkFixing}
                              >
                                {fixSt === "loading" ? "Fixing…" : "Fix & Apply"}
                              </button>
                            )}
                            {fixSt === "error" && (
                              <span style={{ fontSize:10, color:"#fca5a5" }}>✗ failed</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* prompt to scan if no post yet and not on Analyze */}
          {section && section !== "Analyze" && !scanResult && (
            <div style={{ background:"#1c1007", border:"1px solid #92400e", borderRadius:12, padding:"14px 18px", marginBottom:18, fontSize:13, color:"#fbbf24", display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
              <span>⚡ <strong>No post scanned yet.</strong> Go to <em>Analyse a Post</em> first to load your blog post data — then every section will show what needs fixing.</span>
              <button style={{ ...S.btn("primary"), fontSize:12, padding:"5px 14px" }} onClick={() => setSection("Analyze")}>Analyse a Post →</button>
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
          {/* ════════ TECHNICAL SEO ════════ */}
          {section === "Technical" && (
            <>
              {(url || shopDomain) && (
                <div style={{ background: "#0c1a0c", border: "1px solid #14532d", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#86efac" }}>
                  Checking: <strong>{url || `https://${shopDomain}`}</strong> — your store data is pre-loaded.
                </div>
              )}
              <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
                {[["audit","Technical Audit"],["pagespeed","Page Speed"],["cwv","Core Web Vitals"],["sitemap","Sitemap Check"]].map(([k,l]) => (
                  <button key={k} style={{ ...S.btn(), padding:"7px 16px", background:techSub===k?C.indigo:C.muted, color:techSub===k?"#fff":"#d4d4d8" }} onClick={() => setTechSub(k)}>{l}</button>
                ))}
              </div>
              {techSub === "audit" && (
                <div style={S.card}>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:8 }}>Technical SEO Audit</div>
                  <div style={{ fontSize:12, color:C.dim, marginBottom:12 }}>Uses your analyzed URL. Run an analysis first.</div>
                  <button style={S.btn("primary")} onClick={runTechAudit} disabled={techLoading || !url.trim()}>
                    {techLoading ? <><span style={S.spinner} /> Auditing...</> : "Run Technical Audit"}
                  </button>
                  {techErr && <div style={{ ...S.err, marginTop:10 }}>{techErr}</div>}
                  {techResult && (
                    <div style={{ marginTop:14, fontSize:13, color:C.text, whiteSpace:"pre-wrap", lineHeight:1.7 }}>
                      {typeof techResult === "string" ? techResult : JSON.stringify(techResult, null, 2)}
                    </div>
                  )}
                </div>
              )}
              {techSub === "pagespeed" && (
                <div style={S.card}>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:8 }}>Page Speed Advisor</div>
                  <button style={S.btn("primary")} onClick={runPageSpeed} disabled={pageSpeedLoading || !url.trim()}>
                    {pageSpeedLoading ? <><span style={S.spinner} /> Analysing...</> : "Analyse Page Speed"}
                  </button>
                  {pageSpeedResult && (
                    <div style={{ marginTop:14, fontSize:13, color:C.text, whiteSpace:"pre-wrap", lineHeight:1.7 }}>
                      {typeof pageSpeedResult === "string" ? pageSpeedResult : JSON.stringify(pageSpeedResult, null, 2)}
                    </div>
                  )}
                </div>
              )}
              {techSub === "cwv" && (
                <div style={S.card}>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:8 }}>Core Web Vitals Advisor</div>
                  <button style={S.btn("primary")} onClick={runCwv} disabled={cwvLoading || !url.trim()}>
                    {cwvLoading ? <><span style={S.spinner} /> Checking...</> : "Check Core Web Vitals"}
                  </button>
                  {cwvResult && (
                    <div style={{ marginTop:14, fontSize:13, color:C.text, whiteSpace:"pre-wrap", lineHeight:1.7 }}>
                      {typeof cwvResult === "string" ? cwvResult : JSON.stringify(cwvResult, null, 2)}
                    </div>
                  )}
                </div>
              )}
              {techSub === "sitemap" && (
                <div style={S.card}>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:8 }}>Sitemap Check</div>
                  <button style={S.btn("primary")} onClick={runSitemapCheck} disabled={sitemapLoading || !url.trim()}>
                    {sitemapLoading ? <><span style={S.spinner} /> Checking...</> : "Check Sitemap"}
                  </button>
                  {sitemapResult && (
                    <div style={{ marginTop:14, fontSize:13, color:C.text, whiteSpace:"pre-wrap", lineHeight:1.7 }}>
                      {typeof sitemapResult === "string" ? sitemapResult : JSON.stringify(sitemapResult, null, 2)}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ════════ SCHEMA & LINKS ════════ */}
          {section === "Schema" && (
            <>
              {(schemaAuthorName || schemaPublisherName) && (
                <div style={{ background: "#0c1a0c", border: "1px solid #14532d", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#86efac" }}>
                  Pre-filled from your store: <strong>{schemaAuthorName}</strong>. Hit Generate — the JSON-LD will be added to your post automatically.
                </div>
              )}
              <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
                {[["article","Article Schema"],["faq","FAQ Schema"],["howto","HowTo Schema"]].map(([k,l]) => (
                  <button key={k} style={{ ...S.btn(), padding:"7px 16px", background:schemaSub===k?C.indigo:C.muted, color:schemaSub===k?"#fff":"#d4d4d8" }} onClick={() => setSchemaSub(k)}>{l}</button>
                ))}
              </div>
              {schemaSub === "article" && (
                <div style={S.card}>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:8 }}>Article Schema Generator</div>
                  <div style={{ fontSize:12, color:C.dim, marginBottom:12 }}>Tells Google your post is quality content — improves rich results and trust signals.</div>
                  <div style={S.row}>
                    <input style={S.input} placeholder="Author name" value={schemaAuthorName} onChange={e => setSchemaAuthorName(e.target.value)} />
                    <input style={S.input} placeholder="Publisher name" value={schemaPublisherName} onChange={e => setSchemaPublisherName(e.target.value)} />
                    <button style={S.btn("primary")} onClick={runSchemaGen} disabled={schemaGenLoading || !url.trim()}>
                      {schemaGenLoading ? <><span style={S.spinner} /> Generating...</> : "Generate Schema"}
                    </button>
                  </div>
                  {schemaGenErr && <div style={{ ...S.err, marginTop:8 }}>{schemaGenErr}</div>}
                  {generatedSchema && (
                    <div style={{ marginTop:14 }}>
                      <div style={{ display:"flex", gap:8, marginBottom:8, flexWrap:"wrap" }}>
                        <button style={{ ...S.btn(), fontSize:12 }} onClick={() => navigator.clipboard?.writeText(JSON.stringify(generatedSchema.schema || generatedSchema, null, 2))}>Copy JSON-LD</button>
                        <button style={{ ...S.btn("primary"), fontSize:12 }} onClick={() => applyFieldToShopify("schema", JSON.stringify(generatedSchema.schema || generatedSchema, null, 2))}>Add to Post in Shopify</button>
                      </div>
                      <pre style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:"14px 16px", fontSize:12, color:"#a5b4fc", overflowX:"auto", maxHeight:400 }}>
                        {JSON.stringify(generatedSchema.schema || generatedSchema, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
              {schemaSub === "faq" && (
                <div style={S.card}>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:8 }}>FAQ Schema Generator</div>
                  <div style={{ fontSize:12, color:C.dim, marginBottom:12 }}>Extracts question headings from your analyzed post and generates FAQ schema. This helps your post appear in People Also Ask on Google.</div>
                  <button style={S.btn("primary")} onClick={runFaqSchema} disabled={faqSchemaLoading || !url.trim()}>
                    {faqSchemaLoading ? <><span style={S.spinner} /> Generating...</> : "Generate FAQ Schema"}
                  </button>
                  {faqSchemaResult && (
                    <div style={{ marginTop:14 }}>
                      <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                        <button style={{ ...S.btn(), fontSize:12 }} onClick={() => navigator.clipboard?.writeText(JSON.stringify(faqSchemaResult.schema || faqSchemaResult, null, 2))}>Copy JSON-LD</button>
                        <button style={{ ...S.btn("primary"), fontSize:12 }} onClick={() => applyFieldToShopify("schema", JSON.stringify(faqSchemaResult.schema || faqSchemaResult, null, 2))}>Add to Post in Shopify</button>
                      </div>
                      <pre style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:"14px 16px", fontSize:12, color:"#a5b4fc", overflowX:"auto", maxHeight:400 }}>
                        {JSON.stringify(faqSchemaResult.schema || faqSchemaResult, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
              {schemaSub === "howto" && (
                <div style={S.card}>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:8 }}>HowTo Schema Generator</div>
                  <div style={{ fontSize:12, color:C.dim, marginBottom:12 }}>Creates step-by-step schema that can show in Google as a visual rich result.</div>
                  <div style={S.row}>
                    <input style={S.input} placeholder="HowTo title (e.g. How to make cold brew coffee)" value={howtoTitle} onChange={e => setHowtoTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && runHowtoSchema()} />
                    <button style={S.btn("primary")} onClick={runHowtoSchema} disabled={howtoLoading || !howtoTitle.trim()}>
                      {howtoLoading ? <><span style={S.spinner} /> Generating...</> : "Generate HowTo Schema"}
                    </button>
                  </div>
                  {howtoResult && (
                    <div style={{ marginTop:14 }}>
                      <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                        <button style={{ ...S.btn(), fontSize:12 }} onClick={() => navigator.clipboard?.writeText(JSON.stringify(howtoResult.schema || howtoResult, null, 2))}>Copy JSON-LD</button>
                        <button style={{ ...S.btn("primary"), fontSize:12 }} onClick={() => applyFieldToShopify("schema", JSON.stringify(howtoResult.schema || howtoResult, null, 2))}>Add to Post in Shopify</button>
                      </div>
                      <pre style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:"14px 16px", fontSize:12, color:"#a5b4fc", overflowX:"auto", maxHeight:400 }}>
                        {JSON.stringify(howtoResult.schema || howtoResult, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ════════ SERP & CTR ════════ */}
          {section === "SERP" && (
            <>
              {(ctrTitle || ctrKeyword) && (
                <div style={{ background: "#0c1a0c", border: "1px solid #14532d", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#86efac" }}>
                  Fields pre-filled from your last analyzed post. Edit them or hit Optimise.
                </div>
              )}
              <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
                {[["ctr","CTR Optimizer"],["intent","Intent Classifier"],["paa","PAA Generator"],["snapshot","Competitor Snapshot"],["difficulty","Difficulty Score"]].map(([k,l]) => (
                  <button key={k} style={{ ...S.btn(), padding:"7px 16px", background:serpSub===k?C.indigo:C.muted, color:serpSub===k?"#fff":"#d4d4d8" }} onClick={() => setSerpSub(k)}>{l}</button>
                ))}
              </div>
              {serpSub === "ctr" && (
                <div style={S.card}>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:10 }}>CTR Optimizer</div>
                  <div style={{ fontSize:12, color:C.dim, marginBottom:12 }}>AI rewrites your title and meta description to get more people to click your link on Google. Results can be applied to your post with one click.</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
                    <input style={S.input} placeholder="Title tag" value={ctrTitle} onChange={e => setCtrTitle(e.target.value)} />
                    <input style={S.input} placeholder="Meta description" value={ctrMeta} onChange={e => setCtrMeta(e.target.value)} />
                    <div style={S.row}>
                      <input style={S.input} placeholder="Target keyword" value={ctrKeyword} onChange={e => setCtrKeyword(e.target.value)} onKeyDown={e => e.key === "Enter" && runCtrOptimizer()} />
                      <button style={S.btn("primary")} onClick={runCtrOptimizer} disabled={ctrLoading || !ctrKeyword.trim()}>
                        {ctrLoading ? <><span style={S.spinner} /> Optimising...</> : "Optimise CTR"}
                      </button>
                    </div>
                  </div>
                  {ctrOptimizerResult && (() => {
                    const res = typeof ctrOptimizerResult === "string" ? ctrOptimizerResult : JSON.stringify(ctrOptimizerResult, null, 2);
                    const titleMatch = res.match(/(?:title|recommended title|optimised title)[^:]*:?\s*["']?([^"'\n]{10,120})["']?/i);
                    const metaMatch = res.match(/(?:meta|description|recommended meta)[^:]*:?\s*["']?([^"'\n]{20,160})["']?/i);
                    const sugTitle = titleMatch?.[1]?.trim();
                    const sugMeta = metaMatch?.[1]?.trim();
                    return (
                      <div style={{ marginTop:12 }}>
                        {(sugTitle || sugMeta) && (
                          <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
                            {sugTitle && <button style={{ ...S.btn("primary"), fontSize:12 }} onClick={() => applyFieldToShopify("title", sugTitle)}>Apply Title to Post</button>}
                            {sugMeta && <button style={{ ...S.btn("primary"), fontSize:12 }} onClick={() => applyFieldToShopify("metaDescription", sugMeta)}>Apply Meta to Post</button>}
                          </div>
                        )}
                        <div style={{ fontSize:13, color:C.text, whiteSpace:"pre-wrap", lineHeight:1.7 }}>{res}</div>
                      </div>
                    );
                  })()}
                </div>
              )}
              {serpSub === "intent" && (
                <div style={S.card}>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:10 }}>Search Intent Classifier</div>
                  <div style={S.row}>
                    <input style={S.input} placeholder="Keyword to classify" value={intentKeyword} onChange={e => setIntentKeyword(e.target.value)} onKeyDown={e => e.key === "Enter" && runIntentClassifier()} />
                    <button style={S.btn("primary")} onClick={runIntentClassifier} disabled={intentLoading || !intentKeyword.trim()}>
                      {intentLoading ? <><span style={S.spinner} /> Classifying...</> : "Classify Intent"}
                    </button>
                  </div>
                  {intentResult && (
                    <div style={{ marginTop:14, background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:"14px 16px" }}>
                      <div style={{ fontSize:14, fontWeight:700, color:C.indigo, marginBottom:8 }}>{intentResult.intent || intentResult.type || "Intent"}</div>
                      <div style={{ fontSize:13, color:C.text, lineHeight:1.7 }}>{intentResult.explanation || intentResult.description || JSON.stringify(intentResult)}</div>
                    </div>
                  )}
                </div>
              )}
              {serpSub === "paa" && (
                <div style={S.card}>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:10 }}>People Also Ask Generator</div>
                  <div style={S.row}>
                    <input style={S.input} placeholder="Keyword" value={paaKeyword} onChange={e => setPaaKeyword(e.target.value)} />
                    <input style={{ ...S.input, maxWidth:200 }} placeholder="Niche (optional)" value={paaNiche} onChange={e => setPaaNiche(e.target.value)} />
                    <button style={S.btn("primary")} onClick={runPaaGenerator} disabled={paaLoading || !paaKeyword.trim()}>
                      {paaLoading ? <><span style={S.spinner} /> Generating...</> : "Generate PAA"}
                    </button>
                  </div>
                  {paaResult && (
                    <div style={{ marginTop:14 }}>
                      {(paaResult.questions || paaResult.paa || []).map((q, i) => (
                        <div key={i} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 14px", marginBottom:6, fontSize:13, color:C.text }}>{typeof q === "string" ? q : q.question || q.text}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {serpSub === "snapshot" && (
                <div style={S.card}>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:10 }}>Competitor SERP Snapshot</div>
                  <div style={S.row}>
                    <input style={S.input} placeholder="Keyword to analyse" value={snapKeyword} onChange={e => setSnapKeyword(e.target.value)} onKeyDown={e => e.key === "Enter" && runCompetitorSnapshot()} />
                    <button style={S.btn("primary")} onClick={runCompetitorSnapshot} disabled={snapLoading || !snapKeyword.trim()}>
                      {snapLoading ? <><span style={S.spinner} /> Analysing...</> : "Analyse Competitors"}
                    </button>
                  </div>
                  {competitorSnapshotResult && (
                    <div style={{ marginTop:14, fontSize:13, color:C.text, whiteSpace:"pre-wrap", lineHeight:1.7 }}>
                      {typeof competitorSnapshotResult === "string" ? competitorSnapshotResult : JSON.stringify(competitorSnapshotResult, null, 2)}
                    </div>
                  )}
                </div>
              )}
              {serpSub === "difficulty" && (
                <div style={S.card}>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:10 }}>Keyword Difficulty Score</div>
                  <div style={S.row}>
                    <input style={S.input} placeholder="Keyword" value={diffKeyword} onChange={e => setDiffKeyword(e.target.value)} />
                    <input style={{ ...S.input, maxWidth:200 }} placeholder="Niche" value={diffNiche} onChange={e => setDiffNiche(e.target.value)} />
                    <button style={S.btn("primary")} onClick={runDifficultyScore} disabled={diffLoading || !diffKeyword.trim()}>
                      {diffLoading ? <><span style={S.spinner} /> Scoring...</> : "Get Difficulty Score"}
                    </button>
                  </div>
                  {difficultyResult && (
                    <div style={{ marginTop:14 }}>
                      {difficultyResult.score != null && (
                        <div style={{ fontSize:36, fontWeight:900, color:difficultyResult.score > 70 ? C.red : difficultyResult.score > 40 ? C.yellow : C.green, marginBottom:8 }}>{difficultyResult.score}/100</div>
                      )}
                      <div style={{ fontSize:13, color:C.text, lineHeight:1.7 }}>{difficultyResult.explanation || difficultyResult.analysis || JSON.stringify(difficultyResult)}</div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ════════ INTERNAL LINKS ════════ */}
          {section === "Backlinks" && (
            <>
              {/* explainer */}
              <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 18px", marginBottom:16, fontSize:13, color:C.sub, lineHeight:1.8 }}>
                <strong style={{ color:C.text }}>What are internal links?</strong> These are links from one page on <em>your</em> store to another — e.g. linking from a blog post to a related product or another article. Google uses them to understand your site structure. More internal links to a page = Google treats it as more important. This tool reads your current post and tells you exactly which pages on your store to link to and what anchor text to use.
              </div>

              {/* post URL pre-fill banner */}
              {internalLinksUrl && (
                <div style={{ background:"#0c1a0c", border:"1px solid #14532d", borderRadius:10, padding:"10px 16px", marginBottom:16, fontSize:13, color:"#86efac" }}>
                  Checking: <strong>{internalLinksUrl}</strong> — pre-filled from your last scanned post.
                </div>
              )}
              {!internalLinksUrl && !url && (
                <div style={{ background:"#1c1007", border:"1px solid #92400e", borderRadius:10, padding:"10px 16px", marginBottom:16, fontSize:13, color:"#fbbf24" }}>
                  ⚠ Go to <strong>Analyse a Post</strong> first to scan your post — or paste the post URL in the box below.
                </div>
              )}

              {/* suggester card */}
              <div style={S.card}>
                <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Internal Link Suggester</div>
                <div style={{ fontSize:12, color:C.dim, marginBottom:14, lineHeight:1.7 }}>
                  AI reads your post, scores its internal linking, and tells you exactly which pages to add links to — with suggested anchor text and where in the content to place each link.
                </div>
                <div style={S.row}>
                  <input
                    style={S.input}
                    placeholder="Post URL (auto-filled from your last scan)"
                    value={internalLinksUrl}
                    onChange={e => setInternalLinksUrl(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && runInternalLinks()}
                  />
                  <button style={{ ...S.btn("primary"), minWidth:200 }} onClick={runInternalLinks} disabled={internalLinksLoading || (!internalLinksUrl.trim() && !url.trim())}>
                    {internalLinksLoading ? <><span style={S.spinner} /> Analysing...</> : "Find Internal Link Opportunities"}
                  </button>
                </div>
                {internalLinksErr && <div style={{ ...S.err, marginTop:8 }}>{internalLinksErr}</div>}

                {internalLinksResult && (() => {
                  const r = internalLinksResult;
                  const score = r.internalLinkScore ?? null;
                  const assessment = r.assessment || "";
                  const opportunities = r.suggestedLinkOpportunities || [];
                  const recs = r.recommendations || [];
                  const scoreColor = score >= 70 ? C.green : score >= 40 ? C.yellow : C.red;
                  return (
                    <div style={{ marginTop:18 }}>
                      {/* score summary */}
                      <div style={{ display:"flex", gap:16, alignItems:"center", marginBottom:18, flexWrap:"wrap" }}>
                        {score !== null && (
                          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", width:72, height:72, borderRadius:"50%", border:`3px solid ${scoreColor}`, color:scoreColor, fontWeight:800, fontSize:22 }}>{score}</div>
                        )}
                        <div>
                          <div style={{ fontSize:14, fontWeight:700, color:C.text, textTransform:"capitalize", marginBottom:2 }}>{assessment} internal linking</div>
                          <div style={{ fontSize:12, color:C.dim }}>{r.existingLinksDetected ?? r.currentInternalLinkCount ?? 0} internal links detected in this post · {r.orphanRisk ? `Orphan risk: ${r.orphanRisk}` : ""}</div>
                          {r.orphanRiskExplanation && <div style={{ fontSize:12, color:"#fbbf24", marginTop:2 }}>{r.orphanRiskExplanation}</div>}
                        </div>
                      </div>

                      {/* opportunities */}
                      {opportunities.length > 0 && (
                        <>
                          <div style={{ fontSize:13, fontWeight:700, color:C.sub, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:10 }}>Link Opportunities ({opportunities.length})</div>
                          {opportunities.map((opp, i) => (
                            <div key={i} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:"12px 16px", marginBottom:8, display:"flex", gap:14, alignItems:"flex-start", flexWrap:"wrap" }}>
                              <div style={{ flex:1, minWidth:200 }}>
                                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4, flexWrap:"wrap" }}>
                                  <span style={{ fontSize:12, fontWeight:700, color: opp.importance === "high" ? C.red : opp.importance === "medium" ? C.yellow : C.sub, textTransform:"uppercase" }}>{opp.importance}</span>
                                  <span style={{ fontSize:12, color:C.dim }}>→ {opp.targetPageType}</span>
                                  {opp.locationInContent && <span style={{ fontSize:11, color:C.muted, background:C.surface, padding:"1px 8px", borderRadius:999 }}>{opp.locationInContent}</span>}
                                </div>
                                <div style={{ fontSize:13, fontWeight:600, color:C.indigoL, marginBottom:2 }}>
                                  Anchor text: &ldquo;{opp.anchorTextSuggestion}&rdquo;
                                </div>
                                <div style={{ fontSize:12, color:C.sub }}>{opp.pageDescription}</div>
                              </div>
                              <button
                                style={{ ...S.btn(), fontSize:11, padding:"4px 10px", flexShrink:0 }}
                                onClick={() => navigator.clipboard?.writeText(opp.anchorTextSuggestion).then(() => showToast("Anchor text copied!"))}
                              >Copy anchor</button>
                            </div>
                          ))}
                        </>
                      )}

                      {/* recommendations */}
                      {recs.length > 0 && (
                        <div style={{ background:"#0c1a0c", border:"1px solid #14532d", borderRadius:8, padding:"12px 16px", marginTop:12 }}>
                          <div style={{ fontSize:12, fontWeight:700, color:"#86efac", marginBottom:8 }}>RECOMMENDATIONS</div>
                          {recs.map((rec, i) => (
                            <div key={i} style={{ fontSize:13, color:"#d1fae5", lineHeight:1.7, marginBottom:4 }}>✓ {rec}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* tip: for external backlinks */}
              <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 16px", fontSize:12, color:C.dim, lineHeight:1.7 }}>
                <strong style={{ color:C.sub }}>Want to build external backlinks?</strong> Use the dedicated <strong style={{ color:C.text }}>Backlink Explorer</strong> tool in the left sidebar — it has link gap analysis, outreach email writer and anchor text tools.
              </div>
            </>
          )}

          {/* ════════ A/B & CONTENT REFRESH ════════ */}
          {section === "AB" && (
            <div style={S.card}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Meta A/B Variants</div>
              <div style={{ fontSize:12, color:C.dim, marginBottom:12 }}>Generate multiple title + meta description variants so you can pick the best one and apply it to your Shopify post with one click.</div>
              <div style={S.row}>
                <input style={S.input} placeholder="Post URL (pre-filled from your last scan)" value={abVariantUrl} onChange={e => setAbVariantUrl(e.target.value)} />
                <button style={S.btn("primary")} onClick={runAbVariants} disabled={abVariantLoading || (!abVariantUrl.trim() && !url.trim())}>
                  {abVariantLoading ? <><span style={S.spinner} /> Generating...</> : "Generate A/B Variants"}
                </button>
              </div>
              {abVariantResult && (
                <div style={{ marginTop:14 }}>
                  {(abVariantResult.variants || abVariantResult.options || []).map((v, i) => (
                    <div key={i} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:"12px 14px", marginBottom:8 }}>
                      <div style={{ fontSize:11, color:C.dim, fontWeight:700, textTransform:"uppercase", marginBottom:4 }}>Variant {i + 1}</div>
                      <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:2 }}>{v.title || v.headline}</div>
                      <div style={{ fontSize:12, color:C.sub, marginBottom:10 }}>{v.metaDescription || v.description || v.text}</div>
                      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                        {(v.title || v.headline) && <button style={{ ...S.btn("primary"), fontSize:11, padding:"5px 12px" }} onClick={() => applyFieldToShopify("title", v.title || v.headline)}>Apply Title</button>}
                        {(v.metaDescription || v.description) && <button style={{ ...S.btn("primary"), fontSize:11, padding:"5px 12px" }} onClick={() => applyFieldToShopify("metaDescription", v.metaDescription || v.description)}>Apply Meta</button>}
                      </div>
                    </div>
                  ))}
                  {!abVariantResult.variants && !abVariantResult.options && (
                    <div style={{ fontSize:13, color:C.text, whiteSpace:"pre-wrap" }}>{JSON.stringify(abVariantResult, null, 2)}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ════════ LOCAL & E-E-A-T ════════ */}
          {section === "Local" && (
            <>
              {gbpBusiness && (
                <div style={{ background: "#0c1a0c", border: "1px solid #14532d", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#86efac" }}>
                  Business name pre-filled from your store: <strong>{gbpBusiness}</strong>
                </div>
              )}
              <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
                {[["gbp","GBP Optimizer"],["citations","Citation Finder"],["localkw","Local Keywords"],["eeat","E-E-A-T Score"]].map(([k,l]) => (
                  <button key={k} style={{ ...S.btn(), padding:"7px 16px", background:localSub===k?C.indigo:C.muted, color:localSub===k?"#fff":"#d4d4d8" }} onClick={() => setLocalSub(k)}>{l}</button>
                ))}
              </div>
              {localSub === "gbp" && (
                <div style={S.card}>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:10 }}>Google Business Profile Optimizer</div>
                  <div style={S.row}>
                    <input style={S.input} placeholder="Business name" value={gbpBusiness} onChange={e => setGbpBusiness(e.target.value)} />
                    <input style={{ ...S.input, maxWidth:240 }} placeholder="Location (city, country)" value={gbpLocation} onChange={e => setGbpLocation(e.target.value)} />
                    <input style={{ ...S.input, maxWidth:200 }} placeholder="Category" value={gbpCategory} onChange={e => setGbpCategory(e.target.value)} />
                    <button style={S.btn("primary")} onClick={runGbpOptimizer} disabled={gbpLoading || !gbpBusiness.trim()}>
                      {gbpLoading ? <><span style={S.spinner} /> Optimising...</> : "Optimise GBP"}
                    </button>
                  </div>
                  {gbpResult && (
                    <div style={{ marginTop:14, fontSize:13, color:C.text, whiteSpace:"pre-wrap", lineHeight:1.7 }}>
                      {typeof gbpResult === "string" ? gbpResult : JSON.stringify(gbpResult, null, 2)}
                    </div>
                  )}
                </div>
              )}
              {localSub === "citations" && (
                <div style={S.card}>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:10 }}>Citation Finder</div>
                  <div style={S.row}>
                    <input style={S.input} placeholder="Business name" value={citationBusiness} onChange={e => setCitationBusiness(e.target.value)} />
                    <input style={{ ...S.input, maxWidth:200 }} placeholder="Location" value={citationLocation} onChange={e => setCitationLocation(e.target.value)} />
                    <input style={{ ...S.input, maxWidth:180 }} placeholder="Category" value={citationCategory} onChange={e => setCitationCategory(e.target.value)} />
                    <button style={S.btn("primary")} onClick={runCitationFinder} disabled={citationLoading || !citationBusiness.trim()}>
                      {citationLoading ? <><span style={S.spinner} /> Finding...</> : "Find Citations"}
                    </button>
                  </div>
                  {citationResult && (
                    <div style={{ marginTop:14, fontSize:13, color:C.text, whiteSpace:"pre-wrap", lineHeight:1.7 }}>
                      {typeof citationResult === "string" ? citationResult : JSON.stringify(citationResult, null, 2)}
                    </div>
                  )}
                </div>
              )}
              {localSub === "localkw" && (
                <div style={S.card}>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:10 }}>Local Keyword Generator</div>
                  <div style={S.row}>
                    <input style={S.input} placeholder="Service (e.g. plumber, SEO agency)" value={localKwService} onChange={e => setLocalKwService(e.target.value)} />
                    <input style={{ ...S.input, maxWidth:240 }} placeholder="City" value={localKwCity} onChange={e => setLocalKwCity(e.target.value)} />
                    <button style={S.btn("primary")} onClick={runLocalKwGen} disabled={localKwLoading || !localKwService.trim()}>
                      {localKwLoading ? <><span style={S.spinner} /> Generating...</> : "Generate Keywords"}
                    </button>
                  </div>
                  {localKwResult && (
                    <div style={{ marginTop:14, fontSize:13, color:C.text, whiteSpace:"pre-wrap", lineHeight:1.7 }}>
                      {typeof localKwResult === "string" ? localKwResult : JSON.stringify(localKwResult, null, 2)}
                    </div>
                  )}
                </div>
              )}
              {localSub === "eeat" && (
                <div style={S.card}>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:8 }}>E-E-A-T Scorer</div>
                  <div style={{ fontSize:12, color:C.dim, marginBottom:12 }}>Scores your content against Google&apos;s Experience, Expertise, Authoritativeness, Trustworthiness signals.</div>
                  <button style={S.btn("primary")} onClick={runEeatScorer} disabled={eeatLoading || !url.trim()}>
                    {eeatLoading ? <><span style={S.spinner} /> Scoring...</> : "Score E-E-A-T"}
                  </button>
                  {eeatResult && (
                    <div style={{ marginTop:14, fontSize:13, color:C.text, whiteSpace:"pre-wrap", lineHeight:1.7 }}>
                      {typeof eeatResult === "string" ? eeatResult : JSON.stringify(eeatResult, null, 2)}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ════════ VOICE & AI SEARCH ════════ */}
          {section === "Voice" && (
            <>
              <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
                {[["voice","Voice Optimizer"],["faq","FAQ Generator"],["aioverview","AI Overview"],["conv","Conversational KWs"]].map(([k,l]) => (
                  <button key={k} style={{ ...S.btn(), padding:"7px 16px", background:voiceSub===k?C.indigo:C.muted, color:voiceSub===k?"#fff":"#d4d4d8" }} onClick={() => setVoiceSub(k)}>{l}</button>
                ))}
              </div>
              {voiceSub === "voice" && (
                <div style={S.card}>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:10 }}>Voice Search Optimizer</div>
                  <div style={S.row}>
                    <input style={S.input} placeholder="Keyword or question (e.g. best coffee near me)" value={voiceOptKeyword} onChange={e => setVoiceOptKeyword(e.target.value)} onKeyDown={e => e.key === "Enter" && runVoiceOptimizer()} />
                    <button style={S.btn("primary")} onClick={runVoiceOptimizer} disabled={voiceOptLoading || !voiceOptKeyword.trim()}>
                      {voiceOptLoading ? <><span style={S.spinner} /> Optimising...</> : "Optimise for Voice"}
                    </button>
                  </div>
                  {voiceOptResult && (
                    <div style={{ marginTop:14, fontSize:13, color:C.text, whiteSpace:"pre-wrap", lineHeight:1.7 }}>
                      {typeof voiceOptResult === "string" ? voiceOptResult : JSON.stringify(voiceOptResult, null, 2)}
                    </div>
                  )}
                </div>
              )}
              {voiceSub === "faq" && (
                <div style={S.card}>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:10 }}>FAQ Generator (Voice-Ready)</div>
                  <div style={S.row}>
                    <input style={S.input} placeholder="Topic (e.g. running shoe care)" value={faqGenTopic} onChange={e => setFaqGenTopic(e.target.value)} onKeyDown={e => e.key === "Enter" && runFaqGenerator()} />
                    <button style={S.btn("primary")} onClick={runFaqGenerator} disabled={faqGenLoading || !faqGenTopic.trim()}>
                      {faqGenLoading ? <><span style={S.spinner} /> Generating...</> : "Generate FAQs"}
                    </button>
                  </div>
                  {faqGenResult && (
                    <div style={{ marginTop:14 }}>
                      {(faqGenResult.faqs || faqGenResult.questions || []).map((q, i) => (
                        <div key={i} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:"12px 14px", marginBottom:8 }}>
                          <div style={{ fontSize:13, fontWeight:600, color:C.indigo, marginBottom:4 }}>Q: {q.question || q.q || q}</div>
                          <div style={{ fontSize:12, color:C.sub, lineHeight:1.6 }}>{q.answer || q.a || ""}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {voiceSub === "aioverview" && (
                <div style={S.card}>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:10 }}>AI Overview Optimizer</div>
                  <div style={S.row}>
                    <input style={S.input} placeholder="Target keyword" value={aiOverviewKeyword} onChange={e => setAiOverviewKeyword(e.target.value)} onKeyDown={e => e.key === "Enter" && runAiOverview()} />
                    <button style={S.btn("primary")} onClick={runAiOverview} disabled={aiOverviewLoading || !aiOverviewKeyword.trim()}>
                      {aiOverviewLoading ? <><span style={S.spinner} /> Analysing...</> : "Optimise for AI Overview"}
                    </button>
                  </div>
                  {aiOverviewResult && (
                    <div style={{ marginTop:14, fontSize:13, color:C.text, whiteSpace:"pre-wrap", lineHeight:1.7 }}>
                      {typeof aiOverviewResult === "string" ? aiOverviewResult : JSON.stringify(aiOverviewResult, null, 2)}
                    </div>
                  )}
                </div>
              )}
              {voiceSub === "conv" && (
                <div style={S.card}>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:10 }}>Conversational Keywords</div>
                  <div style={S.row}>
                    <input style={S.input} placeholder="Topic" value={convKwTopic} onChange={e => setConvKwTopic(e.target.value)} onKeyDown={e => e.key === "Enter" && runConvKeywords()} />
                    <button style={S.btn("primary")} onClick={runConvKeywords} disabled={convKwLoading || !convKwTopic.trim()}>
                      {convKwLoading ? <><span style={S.spinner} /> Generating...</> : "Get Conversational KWs"}
                    </button>
                  </div>
                  {convKwResult && (
                    <div style={{ marginTop:14, fontSize:13, color:C.text, whiteSpace:"pre-wrap", lineHeight:1.7 }}>
                      {typeof convKwResult === "string" ? convKwResult : JSON.stringify(convKwResult, null, 2)}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ════════ AI GROWTH ════════ */}
          {section === "AIGrowth" && (
            <div style={S.card}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Passage Optimizer</div>
              <div style={{ fontSize:12, color:C.dim, marginBottom:12 }}>AI finds the most important paragraphs in your post and rewrites them to rank better in Google's passage-based results. Runs on your currently analyzed post.</div>
              <button style={S.btn("primary")} onClick={runPassageOptimizer} disabled={passageLoading || !url.trim()}>
                {passageLoading ? <><span style={S.spinner} /> Optimising passages...</> : "Optimise My Post Passages"}
              </button>
              {passageResult && (
                <div style={{ marginTop:14 }}>
                  <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                    <button style={{ ...S.btn("primary"), fontSize:12 }} onClick={() => {
                      const txt = typeof passageResult === "string" ? passageResult : JSON.stringify(passageResult, null, 2);
                      applyFieldToShopify("body_append", `<div><h2>Optimised Passages</h2>${txt.split("\n").map(l => `<p>${l}</p>`).join("")}</div>`);
                    }}>Add to Post in Shopify</button>
                  </div>
                  <div style={{ fontSize:13, color:C.text, whiteSpace:"pre-wrap", lineHeight:1.7 }}>
                    {typeof passageResult === "string" ? passageResult : JSON.stringify(passageResult, null, 2)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════ RANK TRACKER ════════ */}
          {section === "Rank" && (
            <div style={S.card}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Rank Tracker</div>
              <div style={{ fontSize:12, color:C.dim, marginBottom:12 }}>Track how your Shopify store ranks on Google for your target keywords. Domain and keywords are pre-filled from your store.</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
                <input style={S.input} placeholder="Your domain (e.g. yourstore.myshopify.com)" value={rankDomain} onChange={e => setRankDomain(e.target.value)} />
                <textarea style={{ ...S.textarea, minHeight:80 }} placeholder={"One keyword per line:\nbest running shoes\nshopify seo tips"} value={rankKeywords} onChange={e => setRankKeywords(e.target.value)} />
              </div>
              <button style={S.btn("primary")} onClick={runRankTracker} disabled={rankLoading || !rankDomain.trim() || !rankKeywords.trim()}>
                {rankLoading ? <><span style={S.spinner} /> Tracking...</> : "Track Rankings"}
              </button>
              {rankErr && <div style={{ ...S.err, marginTop:10 }}>{rankErr}</div>}
              {rankResult && (
                <div style={{ marginTop:14 }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                    <thead>
                      <tr>
                        {["Keyword","Position","Change","URL"].map(h => (
                          <th key={h} style={{ textAlign:"left", padding:"6px 10px", borderBottom:`1px solid ${C.border}`, fontSize:11, color:C.dim, fontWeight:700, textTransform:"uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(rankResult.rankings || rankResult.results || []).map((r, i) => (
                        <tr key={i}>
                          <td style={{ padding:"8px 10px", borderBottom:`1px solid ${C.border}`, color:C.text }}>{r.keyword}</td>
                          <td style={{ padding:"8px 10px", borderBottom:`1px solid ${C.border}`, color:r.position <= 10 ? C.green : r.position <= 30 ? C.yellow : C.sub, fontWeight:700 }}>{r.position ?? "—"}</td>
                          <td style={{ padding:"8px 10px", borderBottom:`1px solid ${C.border}`, color:r.change > 0 ? C.green : r.change < 0 ? C.red : C.dim }}>{r.change > 0 ? `+${r.change}` : r.change ?? "—"}</td>
                          <td style={{ padding:"8px 10px", borderBottom:`1px solid ${C.border}`, color:C.indigo, maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.url || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ════════ SITE CRAWL ════════ */}
          {section === "Crawl" && (
            <div style={S.card}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Site Crawl</div>
              <div style={{ fontSize:12, color:C.dim, marginBottom:12 }}>Crawls your Shopify store to find broken links, missing tags, orphan pages and technical issues. Your store URL is pre-filled.</div>
              <div style={S.row}>
                <input style={S.input} placeholder="Domain to crawl (pre-filled from your store)" value={crawlUrl} onChange={e => setCrawlUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && runCrawl()} />
                <button style={S.btn("primary")} onClick={runCrawl} disabled={crawlLoading || !crawlUrl.trim()}>
                  {crawlLoading ? <><span style={S.spinner} /> Crawling...</> : "Start Crawl"}
                </button>
              </div>
              {crawlErr && <div style={{ ...S.err, marginTop:10 }}>{crawlErr}</div>}
              {crawlResult && (
                <div style={{ marginTop:14, fontSize:13, color:C.text, whiteSpace:"pre-wrap", lineHeight:1.7 }}>
                  {typeof crawlResult === "string" ? crawlResult : JSON.stringify(crawlResult, null, 2)}
                </div>
              )}
            </div>
          )}

          {/* ════════ GEO & LLM ════════ */}
          {section === "GEO" && (
            <>
              {geoUrl && (
                <div style={{ background: "#0c1a0c", border: "1px solid #14532d", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#86efac" }}>
                  Checking: <strong>{geoUrl}</strong> — pre-filled from your store.
                </div>
              )}
              <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
                {[["health","GEO Health Score"],["prompt","Prompt Simulation"],["llmstxt","LLMs.txt Generator"]].map(([k,l]) => (
                  <button key={k} style={{ ...S.btn(), padding:"7px 16px", background:geoSub===k?C.indigo:C.muted, color:geoSub===k?"#fff":"#d4d4d8" }} onClick={() => setGeoSub(k)}>{l}</button>
                ))}
              </div>
              {geoSub === "health" && (
                <div style={S.card}>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:8 }}>GEO Health Score</div>
                  <div style={{ fontSize:12, color:C.dim, marginBottom:12 }}>Scores how well your content is optimised for Generative Engine results (ChatGPT, Perplexity, Gemini).</div>
                  <div style={S.row}>
                    <input style={S.input} placeholder="Your article URL" value={geoUrl} onChange={e => setGeoUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && runGeoHealth()} />
                    <button style={S.btn("primary")} onClick={runGeoHealth} disabled={geoLoading || !geoUrl.trim()}>
                      {geoLoading ? <><span style={S.spinner} /> Scoring...</> : "Score GEO Health"}
                    </button>
                  </div>
                  {geoErr && <div style={{ ...S.err, marginTop:10 }}>{geoErr}</div>}
                  {geoScore && (
                    <div style={{ marginTop:14, fontSize:13, color:C.text, whiteSpace:"pre-wrap", lineHeight:1.7 }}>
                      {typeof geoScore === "string" ? geoScore : JSON.stringify(geoScore, null, 2)}
                    </div>
                  )}
                </div>
              )}
              {geoSub === "prompt" && (
                <div style={S.card}>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:8 }}>AI Platform Tracker</div>
                  <div style={{ fontSize:12, color:C.dim, marginBottom:12 }}>Simulate how ChatGPT/Perplexity mention your brand in a given query.</div>
                  <div style={S.row}>
                    <input style={S.input} placeholder="Your brand name" value={promptSimBrand} onChange={e => setPromptSimBrand(e.target.value)} />
                    <input style={S.input} placeholder="Query to simulate" value={promptSimQuery} onChange={e => setPromptSimQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && runPromptSim()} />
                    <button style={S.btn("primary")} onClick={runPromptSim} disabled={promptSimLoading || !promptSimBrand.trim()}>
                      {promptSimLoading ? <><span style={S.spinner} /> Simulating...</> : "Simulate"}
                    </button>
                  </div>
                  {promptSimResult && (
                    <div style={{ marginTop:14, fontSize:13, color:C.text, whiteSpace:"pre-wrap", lineHeight:1.7 }}>
                      {typeof promptSimResult === "string" ? promptSimResult : JSON.stringify(promptSimResult, null, 2)}
                    </div>
                  )}
                </div>
              )}
              {geoSub === "llmstxt" && (
                <div style={S.card}>
                  <div style={{ fontSize:15, fontWeight:700, marginBottom:8 }}>LLMs.txt Generator</div>
                  <div style={{ fontSize:12, color:C.dim, marginBottom:12 }}>Generate an llms.txt file that tells AI crawlers what to index about your site.</div>
                  <div style={S.row}>
                    <input style={S.input} placeholder="Your site URL" value={geoUrl} onChange={e => setGeoUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && runLlmsTxt()} />
                    <button style={S.btn("primary")} onClick={runLlmsTxt} disabled={llmsTxtLoading || !geoUrl.trim()}>
                      {llmsTxtLoading ? <><span style={S.spinner} /> Generating...</> : "Generate LLMs.txt"}
                    </button>
                  </div>
                  {llmsTxtResult && (
                    <div style={{ marginTop:14 }}>
                      <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                        <button style={{ ...S.btn(), fontSize:12 }} onClick={() => navigator.clipboard?.writeText(llmsTxtResult.content || "")}>Copy</button>
                      </div>
                      <pre style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:"14px 16px", fontSize:12, color:C.text, overflowX:"auto", maxHeight:400 }}>
                        {llmsTxtResult.content || JSON.stringify(llmsTxtResult, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ════════ TREND SCOUT ════════ */}
          {section === "Trends" && (
            <>
              {trendNiche && (
                <div style={{ background: "#0c1a0c", border: "1px solid #14532d", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#86efac" }}>
                  Niche pre-filled from your store: <strong>{trendNiche}</strong> — hit Find to see what\'s trending for your store.
                </div>
              )}
              <div style={{ display:"flex", gap:8, marginBottom:20, flexWrap:"wrap" }}>
                {[["rising","Rising Trends"],["seasonal","Seasonal Trends"],["surge","Trend Surge"]].map(([k,l]) => (
                  <button key={k} style={{ ...S.btn(), padding:"7px 16px", background:trendSub===k?C.indigo:C.muted, color:trendSub===k?"#fff":"#d4d4d8" }} onClick={() => setTrendSub(k)}>{l}</button>
                ))}
              </div>
              <div style={S.card}>
                <div style={S.row}>
                  <input style={S.input} placeholder="Niche (e.g. fitness, SaaS, ecommerce)" value={trendNiche} onChange={e => setTrendNiche(e.target.value)} />
                  <input style={{ ...S.input, maxWidth:200 }} placeholder="Industry (optional)" value={trendIndustry} onChange={e => setTrendIndustry(e.target.value)} />
                  {trendSub === "rising" && (
                    <button style={S.btn("primary")} onClick={runTrendRising} disabled={trendLoading || !trendNiche.trim()}>
                      {trendLoading ? <><span style={S.spinner} /> Fetching...</> : "Find Rising Trends"}
                    </button>
                  )}
                  {trendSub === "seasonal" && (
                    <button style={S.btn("primary")} onClick={runTrendSeasonal} disabled={trendSeasonalLoading || !trendNiche.trim()}>
                      {trendSeasonalLoading ? <><span style={S.spinner} /> Fetching...</> : "Get Seasonal Trends"}
                    </button>
                  )}
                  {trendSub === "surge" && (
                    <button style={S.btn("primary")} onClick={runTrendSurge} disabled={trendSurgeLoading || !trendNiche.trim()}>
                      {trendSurgeLoading ? <><span style={S.spinner} /> Fetching...</> : "Detect Surge"}
                    </button>
                  )}
                </div>
              </div>
              {trendErr && <div style={S.err}>{trendErr}</div>}
              {trendSub === "rising" && trendRising && (
                <div style={S.card}>
                  <div style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>Rising Trends in &ldquo;{trendNiche}&rdquo;</div>
                  {(trendRising.trends || trendRising.topics || []).map((t, i) => (
                    <div key={i} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 14px", marginBottom:8 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{t.topic || t.keyword || t.title || t}</div>
                      {t.growth && <div style={{ fontSize:11, color:C.green, marginTop:2 }}>+{t.growth}% growth</div>}
                    </div>
                  ))}
                </div>
              )}
              {trendSub === "seasonal" && trendSeasonal && (
                <div style={S.card}>
                  <div style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>Seasonal Content Opportunities</div>
                  <div style={{ fontSize:13, color:C.text, whiteSpace:"pre-wrap", lineHeight:1.7 }}>
                    {typeof trendSeasonal === "string" ? trendSeasonal : JSON.stringify(trendSeasonal, null, 2)}
                  </div>
                </div>
              )}
              {trendSub === "surge" && trendSurge && (
                <div style={S.card}>
                  <div style={{ fontSize:14, fontWeight:700, marginBottom:12 }}>Trend Surge Detection</div>
                  <div style={{ fontSize:13, color:C.text, whiteSpace:"pre-wrap", lineHeight:1.7 }}>
                    {typeof trendSurge === "string" ? trendSurge : JSON.stringify(trendSurge, null, 2)}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═════════════════════════════════════════════════
              SMART FIX — Auto-Optimize All Tools On One Page
          ════════════════════════════════════════════════ */}
          {section === "SmartFix" && (() => {
            const score   = scanResult?.scored?.overall ?? null;
            const grade   = scanResult?.scored?.grade ?? "?";
            const sc      = score === null ? "#71717a" : score >= 75 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444";
            const doneCards   = smartFixCards.filter(c => c.status === "done" && c.applyField);
            const unapplied   = doneCards.filter(c => !smartFixApplied.has(c.id));
            const allDone     = smartFixCards.length > 0 && smartFixCards.every(c => c.status !== "loading");
            return (
              <>
                {/* Header */}
                <div style={{ background:"#130d1f", border:"2px solid #7c3aed", borderRadius:14, padding:"22px 24px", marginBottom:20, display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
                  <div style={{ flex:1, minWidth:220 }}>
                    <div style={{ fontSize:20, fontWeight:800, color:"#e9d5ff", marginBottom:4 }}>⚡ Auto-Optimize This Post</div>
                    <div style={{ fontSize:13, color:"#a78bfa" }}>AI runs every tool at once — rewrites your title, meta, headings, schema, and finds internal link gaps. No switching tabs.</div>
                  </div>
                  {scanResult ? (
                    <div style={{ display:"flex", alignItems:"center", gap:14, flexShrink:0 }}>
                      {score !== null && (
                        <div style={{ width:56, height:56, borderRadius:"50%", border:`3px solid ${sc}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <span style={{ fontSize:18, fontWeight:800, color:sc }}>{score}</span>
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:"#fafafa", maxWidth:220, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{scanResult.title || scanResult.url}</div>
                        <div style={{ fontSize:11, color:"#a1a1aa", marginTop:2 }}>Grade {grade} · {scanResult.wordCount || "—"} words</div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize:13, color:"#f87171", background:"#1c0000", border:"1px solid #7f1d1d", borderRadius:8, padding:"10px 16px" }}>No post scanned yet — go to Analyze a Post first.</div>
                  )}
                </div>

                {/* Action row */}
                {scanResult && (
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, flexWrap:"wrap" }}>
                    <button
                      style={{ ...S.btn("primary"), fontSize:14, padding:"11px 28px", background:"#7c3aed", borderColor:"#7c3aed", opacity: smartFixRunning ? 0.7 : 1 }}
                      disabled={smartFixRunning}
                      onClick={runSmartFix}>
                      {smartFixRunning
                        ? <><span style={S.spinner} /> Running all tools…</>
                        : smartFixCards.length > 0 ? "🔄 Re-run All Tools" : "🚀 Run All Tools Now"}
                    </button>
                    {allDone && unapplied.length > 0 && (
                      <button
                        style={{ ...S.btn("primary"), fontSize:14, padding:"11px 28px", background:"#16a34a", borderColor:"#16a34a" }}
                        onClick={applyAllSmartCards}>
                        ✔️ Apply All Fixes to Shopify ({unapplied.length})
                      </button>
                    )}
                    {allDone && unapplied.length === 0 && smartFixCards.length > 0 && (
                      <div style={{ fontSize:13, color:"#22c55e", fontWeight:600 }}>✅ All fixes applied to Shopify!</div>
                    )}
                  </div>
                )}

                {/* Running progress bar */}
                {smartFixRunning && (() => {
                  const done  = smartFixCards.filter(c => c.status !== "loading").length;
                  const total = smartFixCards.length;
                  const pct   = total ? Math.round((done / total) * 100) : 0;
                  return (
                    <div style={{ marginBottom:20 }}>
                      <div style={{ height:6, background:"#27272a", borderRadius:999, overflow:"hidden" }}>
                        <div style={{ height:"100%", background:"#7c3aed", borderRadius:999, width:`${pct}%`, transition:"width 0.4s" }} />
                      </div>
                      <div style={{ fontSize:11, color:"#a78bfa", marginTop:6 }}>Running tools… {done}/{total} complete</div>
                    </div>
                  );
                })()}

                {/* Cards */}
                {smartFixCards.length > 0 && (
                  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    {smartFixCards.map(card => {
                      const applied   = smartFixApplied.has(card.id);
                      const applying  = smartFixApplying[card.id];
                      // /ai/rewrite returns structured.variants[0].text; metaopt returns variants[bestVariant].text
                      const val       = card.result?.structured?.variants?.[0]?.text
                        || (card.id === "metaopt" ? card.result?.variants?.[card.result?.bestVariant ?? 0]?.text : null)
                        || card.result?.value || card.result?.suggestion
                        || card.result?.optimizedMeta || card.result?.schema;
                      const oppsList  = card.result?.suggestedLinkOpportunities || card.result?.opportunities || [];
                      return (
                        <div key={card.id} style={{ background:"#18181b", border:`1px solid ${card.status==="error" ? "#7f1d1d" : card.status==="done" ? (applied ? "#14532d" : "#7c3aed") : "#3f3f46"}`, borderRadius:12, overflow:"hidden" }}>
                          {/* Card header */}
                          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px", background:"#1c1c1f" }}>
                            <span style={{ fontSize:20, lineHeight:1 }}>{card.icon}</span>
                            <div style={{ flex:1, fontSize:14, fontWeight:700, color:"#fafafa" }}>{card.label}</div>
                            {card.status === "loading" && <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#a78bfa" }}><span style={S.spinner} /> Analysing…</div>}
                            {card.status === "done"    && !applied && <div style={{ fontSize:11, fontWeight:700, color:"#a78bfa", background:"#2e1065", borderRadius:6, padding:"3px 10px" }}>Ready to apply</div>}
                            {card.status === "done"    && applied  && <div style={{ fontSize:11, fontWeight:700, color:"#22c55e", background:"#0c1a0c", borderRadius:6, padding:"3px 10px" }}>✓ Applied</div>}
                            {card.status === "error"   && <div style={{ fontSize:11, fontWeight:700, color:"#f87171", background:"#1c0000", borderRadius:6, padding:"3px 10px" }}>Error</div>}
                          </div>
                          {/* Card body */}
                          {card.status === "done" && (
                            <div style={{ padding:"12px 16px" }}>
                              {/* Text value (title, meta, h1, headings) */}
                              {val && typeof val === "string" && !val.startsWith("{") && (
                                <div style={{ fontSize:13, color:"#d4d4d8", background:"#09090b", border:"1px solid #27272a", borderRadius:8, padding:"10px 14px", marginBottom: card.applyField ? 10 : 0, lineHeight:1.6, whiteSpace:"pre-wrap" }}>{val}</div>
                              )}
                              {/* Schema (JSON) */}
                              {val && typeof val === "string" && val.startsWith("{") && (
                                <div style={{ fontSize:11, fontFamily:"monospace", color:"#86efac", background:"#09090b", border:"1px solid #14532d", borderRadius:8, padding:"10px 14px", marginBottom: card.applyField ? 10 : 0, maxHeight:160, overflow:"auto", whiteSpace:"pre-wrap" }}>{val}</div>
                              )}
                              {/* Schema object */}
                              {val && typeof val === "object" && (
                                <div style={{ fontSize:11, fontFamily:"monospace", color:"#86efac", background:"#09090b", border:"1px solid #14532d", borderRadius:8, padding:"10px 14px", marginBottom: card.applyField ? 10 : 0, maxHeight:160, overflow:"auto", whiteSpace:"pre-wrap" }}>{JSON.stringify(val, null, 2)}</div>
                              )}
                              {/* Internal links list */}
                              {card.id === "links" && oppsList.length > 0 && (
                                <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:4 }}>
                                  {oppsList.slice(0,5).map((opp, i) => (
                                    <div key={i} style={{ background:"#09090b", border:"1px solid #27272a", borderRadius:8, padding:"8px 12px", display:"flex", alignItems:"flex-start", gap:10 }}>
                                      <div style={{ flex:1 }}>
                                        <div style={{ fontSize:12, fontWeight:600, color:"#fafafa" }}>{opp.targetPage || opp.page || opp.url || "Suggested page"}</div>
                                        {opp.anchorText && <div style={{ fontSize:11, color:"#a78bfa", marginTop:2 }}>Anchor: “{opp.anchorText}”</div>}
                                        {opp.importance  && <div style={{ fontSize:10, color:"#71717a", marginTop:1 }}>{opp.importance}</div>}
                                      </div>
                                      <button style={{ ...S.btn(), fontSize:10, padding:"3px 10px", flexShrink:0 }} onClick={() => { navigator.clipboard.writeText(opp.anchorText || opp.url || ""); showToast("Copied!"); }}>Copy anchor</button>
                                    </div>
                                  ))}
                                  {oppsList.length > 5 && <div style={{ fontSize:11, color:"#71717a" }}>+{oppsList.length - 5} more — visit Internal Links section for full list</div>}
                                </div>
                              )}
                              {card.id === "links" && oppsList.length === 0 && (
                                <div style={{ fontSize:12, color:"#a1a1aa" }}>{card.result?.assessment || "No opportunities detected at this time."}</div>
                              )}
                              {/* Apply button */}
                              {card.applyField && val && !applied && (
                                <button
                                  style={{ ...S.btn("primary"), fontSize:12, padding:"7px 18px", background:"#16a34a", borderColor:"#16a34a", opacity: applying ? 0.7 : 1 }}
                                  disabled={applying}
                                  onClick={() => applySmartCard(card)}>
                                  {applying ? <><span style={S.spinner} /> Applying…</> : "✓ Apply to Shopify"}
                                </button>
                              )}
                            </div>
                          )}
                          {card.status === "error" && (
                            <div style={{ padding:"10px 16px", fontSize:12, color:"#f87171" }}>{card.error || "Something went wrong"}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Prompt when no scan yet */}
                {!scanResult && (
                  <div style={{ background:"#18181b", border:"1px solid #3f3f46", borderRadius:12, padding:"28px 24px", textAlign:"center" }}>
                    <div style={{ fontSize:32, marginBottom:12 }}>🔍</div>
                    <div style={{ fontSize:16, fontWeight:700, color:"#fafafa", marginBottom:8 }}>Scan a post first</div>
                    <div style={{ fontSize:13, color:"#71717a", marginBottom:16 }}>Go to “Analyze a Post”, pick your blog post, then come back here to run all tools at once.</div>
                    <button style={{ ...S.btn("primary"), fontSize:13, padding:"10px 20px" }} onClick={() => setSection("Analyze")}>Go to Analyze a Post &rarr;</button>
                  </div>
                )}
              </>
            );
          })()}

        </div>
      </div>
    </div>
  );
}