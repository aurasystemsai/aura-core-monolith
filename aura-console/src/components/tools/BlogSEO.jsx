import React, { useState, useRef, useCallback, useEffect } from "react";
import { apiFetch, apiFetchJSON } from "../../api";
import BackButton from "./BackButton";

const API = "/api/blog-seo";

/* -- Dark-theme inline styles -------------------------------------------- */
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

const TABS = ["Analyzer", "Keywords", "Content+", "Keyword+", "Technical+", "AI Create", "Schema & Links", "SERP & CTR", "Backlinks", "A/B & Refresh", "Local SEO", "E-E-A-T & Brand", "Voice & AI Search", "Content Brief", "Bulk Scan", "AI Assistant", "Shopify SEO", "AI Growth", "Rank Tracker", "Site Crawl", "GEO & LLM", "Trend Scout", "History"];
const FILTER_CATS = ["all", "content", "meta", "technical", "keywords", "structure"];
const FILTER_SEVS = ["all", "high", "medium", "low"];

/* -- Dashboard sections --------------------------------------------------- */
/* level: "beginner" shows in both modes; "advanced" only in advanced mode  */
const SECTIONS = [
  {
    id: "Analyze", icon: "??", title: "Analyze a Post",
    desc: "Get a full SEO score for any blog post. See exactly what to fix and how.",
    color: "#4f46e5", level: "beginner",
    tabs: ["Analyzer"], tabLabels: { "Analyzer": "Analyzer" },
  },
  {
    id: "Keywords", icon: "??", title: "Find Keywords",
    desc: "Discover the best keywords for your niche. Type your topic and get ideas instantly.",
    color: "#0891b2", level: "beginner",
    tabs: ["Keywords", "Keyword+"], tabLabels: { "Keywords": "Keyword Research", "Keyword+": "More Tools" },
  },
  {
    id: "Write", icon: "??", title: "Write with AI",
    desc: "Let AI write a full blog post, outline or intro for you. Pick a topic, click generate.",
    color: "#059669", level: "beginner",
    tabs: ["AI Create", "Content Brief"], tabLabels: { "AI Create": "AI Generate", "Content Brief": "Content Brief" },
  },
  {
    id: "Optimize", icon: "??", title: "Improve a Post",
    desc: "Get specific tips to improve any existing blog post and boost its ranking.",
    color: "#d97706", level: "beginner",
    tabs: ["Content+"], tabLabels: { "Content+": "Optimize" },
  },
  {
    id: "AI Chat", icon: "??", title: "Ask AI",
    desc: "Chat with an SEO expert AI. Ask any question and get instant, tailored advice.",
    color: "#be185d", level: "beginner",
    tabs: ["AI Assistant"], tabLabels: { "AI Assistant": "Chat" },
  },
  {
    id: "Bulk Scan", icon: "??", title: "Scan Multiple Posts",
    desc: "Audit all your blog posts at once to find which need the most work.",
    color: "#0f766e", level: "beginner",
    tabs: ["Bulk Scan"], tabLabels: { "Bulk Scan": "Bulk Scan" },
  },
  {
    id: "History", icon: "??", title: "History",
    desc: "Browse all your past scans and revisit any previous report.",
    color: "#475569", level: "beginner",
    tabs: ["History"], tabLabels: { "History": "History" },
  },
  {
    id: "Technical", icon: "??", title: "Technical SEO",
    desc: "Diagnose Core Web Vitals, crawl issues, indexing, structured data and speed problems.",
    color: "#7c3aed", level: "advanced",
    tabs: ["Technical+"], tabLabels: { "Technical+": "Technical" },
  },
  {
    id: "Schema", icon: "???", title: "Schema & Links",
    desc: "Generate and validate JSON-LD schema markup. Audit redirects, hreflang and duplicate content.",
    color: "#1d4ed8", level: "advanced",
    tabs: ["Schema & Links"], tabLabels: { "Schema & Links": "Schema" },
  },
  {
    id: "SERP", icon: "??", title: "SERP & CTR",
    desc: "Optimise for featured snippets, improve click-through rates, video and news SEO.",
    color: "#0e7490", level: "advanced",
    tabs: ["SERP & CTR"], tabLabels: { "SERP & CTR": "SERP" },
  },
  {
    id: "Backlinks", icon: "??", title: "Backlinks",
    desc: "Find link gaps, broken backlinks, anchor text opportunities and link velocity.",
    color: "#b45309", level: "advanced",
    tabs: ["Backlinks"], tabLabels: { "Backlinks": "Backlinks" },
  },
  {
    id: "AB", icon: "??", title: "A/B & Content Refresh",
    desc: "Test title and meta variants, refresh stale content and optimise for BERT.",
    color: "#374151", level: "advanced",
    tabs: ["A/B & Refresh"], tabLabels: { "A/B & Refresh": "A/B" },
  },
  {
    id: "Local", icon: "??", title: "Local & E-E-A-T",
    desc: "Local SEO, author authority signals, brand mentions and E-E-A-T scoring.",
    color: "#065f46", level: "advanced",
    tabs: ["Local SEO", "E-E-A-T & Brand"], tabLabels: { "Local SEO": "Local SEO", "E-E-A-T & Brand": "E-E-A-T" },
  },
  {
    id: "Voice", icon: "???", title: "Voice & AI Search",
    desc: "Optimise for voice queries, AI overviews and next-generation search engines.",
    color: "#6d28d9", level: "advanced",
    tabs: ["Voice & AI Search"], tabLabels: { "Voice & AI Search": "Voice" },
  },
  {
    id: "AIGrowth", icon: "??", title: "AI Growth Tools",
    desc: "Content calendar, pillar pages, programmatic SEO, ROI estimator, competitor audits and semantic clusters.",
    color: "#0f766e", level: "advanced",
    tabs: ["AI Growth"], tabLabels: { "AI Growth": "AI Growth" },
  },
  {
    id: "RankTracker", icon: "??", title: "Rank Tracker",
    desc: "Track keyword positions, GSC data import, bulk checks, AI forecasts and competitor comparisons.",
    color: "#1d4ed8", level: "advanced",
    tabs: ["Rank Tracker"], tabLabels: { "Rank Tracker": "Rank Tracker" },
  },
  {
    id: "SiteCrawl", icon: "???", title: "Site Crawl",
    desc: "Full BFS site crawler detecting broken links, missing tags, orphan pages, duplicates and snapshot diffs.",
    color: "#7c3aed", level: "advanced",
    tabs: ["Site Crawl"], tabLabels: { "Site Crawl": "Site Crawl" },
  },
  {
    id: "GeoLLM", icon: "??", title: "GEO & LLM Search",
    desc: "Generative Engine Optimisation � AI health scores, prompt simulation, citation gap, llms.txt generator.",
    color: "#dc2626", level: "advanced",
    tabs: ["GEO & LLM"], tabLabels: { "GEO & LLM": "GEO & LLM" },
  },
  {
    id: "TrendScout", icon: "??", title: "Trend Scout",
    desc: "Rising topics, seasonal planner, micro-niche finder, keyword surge detector and competitor velocity.",
    color: "#d97706", level: "advanced",
    tabs: ["Trend Scout"], tabLabels: { "Trend Scout": "Trend Scout" },
  },
];

export default function BlogSEO() {
  const [tab, setTab] = useState("Analyzer");
  const [section, setSection] = useState(null); // null = home dashboard
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem("blogseo_mode") || "beginner"; } catch { return "beginner"; }
  });
  const setModePersist = (m) => { setMode(m); try { localStorage.setItem("blogseo_mode", m); } catch {} };

  /* -- Shopify store data (auto-fill) -- */
  const [shopifyArticles, setShopifyArticles] = useState([]);
  const [shopifyProducts, setShopifyProducts] = useState([]);
  const [shopDomain, setShopDomain] = useState("");
  const [shopifyLoading, setShopifyLoading] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");

  /* -- Analyzer state -- */
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
  const [showGeo, setShowGeo] = useState(false);

  /* -- Shopify SEO tab state -- */
  const [shopifyBlogUrl, setShopifyBlogUrl] = useState("");
  const [shopifyBlogAudit, setShopifyBlogAudit] = useState(null);
  const [shopifyBlogAuditLoading, setShopifyBlogAuditLoading] = useState(false);
  const [shopifyBlogAuditErr, setShopifyBlogAuditErr] = useState("");
  const [shopifyCollUrl, setShopifyCollUrl] = useState("");
  const [shopifyCollResult, setShopifyCollResult] = useState(null);
  const [shopifyCollLoading, setShopifyCollLoading] = useState(false);
  const [shopifyCollErr, setShopifyCollErr] = useState("");
  const [shopifyProductUrl, setShopifyProductUrl] = useState("");
  const [shopifyBlogLinkUrl, setShopifyBlogLinkUrl] = useState("");
  const [shopifyLinkResult, setShopifyLinkResult] = useState(null);
  const [shopifyLinkLoading, setShopifyLinkLoading] = useState(false);
  const [shopifyLinkErr, setShopifyLinkErr] = useState("");
  const [shopifyMetafieldContext, setShopifyMetafieldContext] = useState("");
  const [shopifyMetafieldType, setShopifyMetafieldType] = useState("product");
  const [shopifyMetafieldResult, setShopifyMetafieldResult] = useState(null);
  const [shopifyMetafieldLoading, setShopifyMetafieldLoading] = useState(false);
  const [shopifyMetafieldErr, setShopifyMetafieldErr] = useState("");

  /* -- AI Growth state -- */
  const [calNiche, setCalNiche] = useState(""); const [calAudience, setCalAudience] = useState(""); const [calWeeks, setCalWeeks] = useState(4); const [calPpw, setCalPpw] = useState(3); const [calResult, setCalResult] = useState(null); const [calLoading, setCalLoading] = useState(false); const [calErr, setCalErr] = useState("");
  const [pillarTopic, setPillarTopic] = useState(""); const [pillarAudience, setPillarAudience] = useState(""); const [pillarResult, setPillarResult] = useState(null); const [pillarLoading, setPillarLoading] = useState(false); const [pillarErr, setPillarErr] = useState("");
  const [progCategory, setProgCategory] = useState(""); const [progVars, setProgVars] = useState("city, product, year"); const [progResult, setProgResult] = useState(null); const [progLoading, setProgLoading] = useState(false); const [progErr, setProgErr] = useState("");
  const [roiKw, setRoiKw] = useState(""); const [roiVol, setRoiVol] = useState(""); const [roiPos, setRoiPos] = useState(3); const [roiCvr, setRoiCvr] = useState(2); const [roiAov, setRoiAov] = useState(50); const [roiResult, setRoiResult] = useState(null); const [roiLoading, setRoiLoading] = useState(false); const [roiErr, setRoiErr] = useState("");
  const [sgeContent, setSgeContent] = useState(""); const [sgeKw, setSgeKw] = useState(""); const [sgeEngine, setSgeEngine] = useState("google-aio"); const [sgeResult, setSgeResult] = useState(null); const [sgeLoading, setSgeLoading] = useState(false); const [sgeErr, setSgeErr] = useState("");
  const [minerNiche, setMinerNiche] = useState(""); const [minerAudience, setMinerAudience] = useState(""); const [minerResult, setMinerResult] = useState(null); const [minerLoading, setMinerLoading] = useState(false); const [minerErr, setMinerErr] = useState("");
  const [socialTitle, setSocialTitle] = useState(""); const [socialDesc, setSocialDesc] = useState(""); const [socialContent, setSocialContent] = useState(""); const [socialResult, setSocialResult] = useState(null); const [socialLoading, setSocialLoading] = useState(false); const [socialErr, setSocialErr] = useState("");
  const [compUrl, setCompUrl] = useState(""); const [compNiche, setCompNiche] = useState(""); const [compResult, setCompResult] = useState(null); const [compLoading, setCompLoading] = useState(false); const [compErr, setCompErr] = useState("");
  const [reclaimBrand, setReclaimBrand] = useState(""); const [reclaimSite, setReclaimSite] = useState(""); const [reclaimNiche, setReclaimNiche] = useState(""); const [reclaimResult, setReclaimResult] = useState(null); const [reclaimLoading, setReclaimLoading] = useState(false); const [reclaimErr, setReclaimErr] = useState("");
  const [gnUrl, setGnUrl] = useState(""); const [gnResult, setGnResult] = useState(null); const [gnLoading, setGnLoading] = useState(false); const [gnErr, setGnErr] = useState("");
  const [predTitle, setPredTitle] = useState(""); const [predKw, setPredKw] = useState(""); const [predWords, setPredWords] = useState(1500); const [predType, setPredType] = useState("guide"); const [predResult, setPredResult] = useState(null); const [predLoading, setPredLoading] = useState(false); const [predErr, setPredErr] = useState("");
  const [semTopic, setSemTopic] = useState(""); const [semIndustry, setSemIndustry] = useState(""); const [semResult, setSemResult] = useState(null); const [semLoading, setSemLoading] = useState(false); const [semErr, setSemErr] = useState("");
  const [growthSub, setGrowthSub] = useState("calendar");
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

  /* -- Keywords state -- */
  const [seedKw, setSeedKw] = useState("");
  const [kwNiche, setKwNiche] = useState("");
  const [kwResearch, setKwResearch] = useState(null);
  const [kwLoading, setKwLoading] = useState(false);
  const [kwErr, setKwErr] = useState("");

  /* -- Rank Tracker state -- */
  const [rtKeyword, setRtKeyword] = useState(""); const [rtUrl, setRtUrl] = useState(""); const [rtKeywords, setRtKeywords] = useState([]); const [rtLoading, setRtLoading] = useState(false); const [rtErr, setRtErr] = useState(""); const [rtResult, setRtResult] = useState(null); const [rtHistory, setRtHistory] = useState([]); const [rtGscCsv, setRtGscCsv] = useState(""); const [rtGscLoading, setRtGscLoading] = useState(false); const [rtGscResult, setRtGscResult] = useState(null); const [rtForecastResult, setRtForecastResult] = useState(null); const [rtForecastLoading, setRtForecastLoading] = useState(false); const [rtSub, setRtSub] = useState("tracker");

  /* -- Site Crawl state -- */
  const [crawlUrl, setCrawlUrl] = useState(""); const [crawlStatus, setCrawlStatus] = useState(null); const [crawlResults, setCrawlResults] = useState(null); const [crawlLoading, setCrawlLoading] = useState(false); const [crawlErr, setCrawlErr] = useState(""); const [crawlAiSummary, setCrawlAiSummary] = useState(null); const [crawlAiLoading, setCrawlAiLoading] = useState(false); const [crawlSnapshots, setCrawlSnapshots] = useState([]); const [crawlSub, setCrawlSub] = useState("crawl");

  /* -- GEO & LLM state -- */
  const [geoUrl, setGeoUrl] = useState(""); const [geoScore, setGeoScore] = useState(null); const [geoLoading, setGeoLoading] = useState(false); const [geoErr, setGeoErr] = useState(""); const [promptSimBrand, setPromptSimBrand] = useState(""); const [promptSimQuery, setPromptSimQuery] = useState(""); const [promptSimResult, setPromptSimResult] = useState(null); const [promptSimLoading, setPromptSimLoading] = useState(false); const [llmsTxtResult, setLlmsTxtResult] = useState(null); const [llmsTxtLoading, setLlmsTxtLoading] = useState(false); const [geoTrackerBrand, setGeoTrackerBrand] = useState(""); const [geoTrackerQuery, setGeoTrackerQuery] = useState(""); const [geoTrackerResult, setGeoTrackerResult] = useState(null); const [geoTrackerLoading, setGeoTrackerLoading] = useState(false); const [geoSub, setGeoSub] = useState("health");

  /* -- Trend Scout state -- */
  const [trendNiche, setTrendNiche] = useState(""); const [trendIndustry, setTrendIndustry] = useState(""); const [trendRising, setTrendRising] = useState(null); const [trendLoading, setTrendLoading] = useState(false); const [trendErr, setTrendErr] = useState(""); const [trendSeasonal, setTrendSeasonal] = useState(null); const [trendSeasonalLoading, setTrendSeasonalLoading] = useState(false); const [trendSurge, setTrendSurge] = useState(null); const [trendSurgeLoading, setTrendSurgeLoading] = useState(false); const [trendMicro, setTrendMicro] = useState(null); const [trendMicroLoading, setTrendMicroLoading] = useState(false); const [trendSub, setTrendSub] = useState("rising");

  /* -- Content Brief state -- */
  const [briefTopic, setBriefTopic] = useState("");
  const [briefPrimary, setBriefPrimary] = useState("");
  const [briefSecondary, setBriefSecondary] = useState("");
  const [briefResult, setBriefResult] = useState(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefErr, setBriefErr] = useState("");

  /* -- Bulk Scan state -- */
  const [bulkUrls, setBulkUrls] = useState("");
  const [bulkKw, setBulkKw] = useState("");
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkErr, setBulkErr] = useState("");

  /* -- AI Chat state -- */
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatRef = useRef(null);

  /* -- History state -- */
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  /* -- LLM Score state -- */
  const [llmScore, setLlmScore] = useState(null);
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmErr, setLlmErr] = useState("");

  /* -- Technical Audit state -- */
  const [techAudit, setTechAudit] = useState(null);
  const [techAuditLoading, setTechAuditLoading] = useState(false);
  const [techAuditErr, setTechAuditErr] = useState("");

  /* -- Title CTR Signals state -- */
  const [ctrSignals, setCtrSignals] = useState(null);
  const [ctrLoading, setCtrLoading] = useState(false);

  /* -- Article Schema Validator state -- */
  const [schemaValid, setSchemaValid] = useState(null);
  const [schemaValidLoading, setSchemaValidLoading] = useState(false);
  const [schemaValidErr, setSchemaValidErr] = useState("");

  /* -- Advanced Readability state -- */
  const [advReadability, setAdvReadability] = useState(null);
  const [advReadLoading, setAdvReadLoading] = useState(false);

  /* -- Internal Link Suggestions state -- */
  const [intLinks, setIntLinks] = useState(null);
  const [intLinksLoading, setIntLinksLoading] = useState(false);
  const [intLinksErr, setIntLinksErr] = useState("");

  /* -- NEW FEATURE STATES ----------------------------------------------- */
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

  /* -- BATCH 3 STATE ---------------------------------------------------- */
  const [sentenceVarietyResult, setSentenceVarietyResult] = useState(null);
  const [sentenceVarietyLoading, setSentenceVarietyLoading] = useState(false);

  const [emotionalToneResult, setEmotionalToneResult] = useState(null);
  const [emotionalToneLoading, setEmotionalToneLoading] = useState(false);

  const [jargonResult, setJargonResult] = useState(null);
  const [jargonLoading, setJargonLoading] = useState(false);

  const [expertiseResult, setExpertiseResult] = useState(null);
  const [expertiseLoading, setExpertiseLoading] = useState(false);

  const [multimediaResult, setMultimediaResult] = useState(null);
  const [multimediaLoading, setMultimediaLoading] = useState(false);

  const [questionsResult, setQuestionsResult] = useState(null);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  const [introQualityResult, setIntroQualityResult] = useState(null);
  const [introQualityLoading, setIntroQualityLoading] = useState(false);

  const [ctaAuditResult, setCtaAuditResult] = useState(null);
  const [ctaAuditLoading, setCtaAuditLoading] = useState(false);

  const [formattingResult, setFormattingResult] = useState(null);
  const [formattingLoading, setFormattingLoading] = useState(false);

  const [thinContentResult, setThinContentResult] = useState(null);
  const [thinContentLoading, setThinContentLoading] = useState(false);

  const [kwProminenceResult, setKwProminenceResult] = useState(null);
  const [kwProminenceLoading, setKwProminenceLoading] = useState(false);

  const [kwTfidfResult, setKwTfidfResult] = useState(null);
  const [kwTfidfLoading, setKwTfidfLoading] = useState(false);

  const [coOccurrenceResult, setCoOccurrenceResult] = useState(null);
  const [coOccurrenceLoading, setCoOccurrenceLoading] = useState(false);

  const [secondaryKwResult, setSecondaryKwResult] = useState(null);
  const [secondaryKwLoading, setSecondaryKwLoading] = useState(false);
  const [secondaryKwInput, setSecondaryKwInput] = useState("");

  const [voiceSearchResult, setVoiceSearchResult] = useState(null);
  const [voiceSearchLoading, setVoiceSearchLoading] = useState(false);

  const [negCheckResult, setNegCheckResult] = useState(null);
  const [negCheckLoading, setNegCheckLoading] = useState(false);

  const [featSnippetResult, setFeatSnippetResult] = useState(null);
  const [featSnippetLoading, setFeatSnippetLoading] = useState(false);

  const [urlAnalysisResult, setUrlAnalysisResult] = useState(null);
  const [urlAnalysisLoading, setUrlAnalysisLoading] = useState(false);

  const [mobileSeoResult, setMobileSeoResult] = useState(null);
  const [mobileSeoLoading, setMobileSeoLoading] = useState(false);

  const [hreflangResult, setHreflangResult] = useState(null);
  const [hreflangLoading, setHreflangLoading] = useState(false);
  const [hreflangMarkets, setHreflangMarkets] = useState("");

  const [ampResult, setAmpResult] = useState(null);
  const [ampLoading, setAmpLoading] = useState(false);

  const [resourceHintsResult, setResourceHintsResult] = useState(null);
  const [resourceHintsLoading, setResourceHintsLoading] = useState(false);

  const [jsonLdLintResult, setJsonLdLintResult] = useState(null);
  const [jsonLdLintLoading, setJsonLdLintLoading] = useState(false);

  const [ogImageDimsResult, setOgImageDimsResult] = useState(null);
  const [ogImageDimsLoading, setOgImageDimsLoading] = useState(false);

  const [httpsStatusResult, setHttpsStatusResult] = useState(null);
  const [httpsStatusLoading, setHttpsStatusLoading] = useState(false);

  const [blogOutlineKw, setBlogOutlineKw] = useState("");
  const [blogOutlineAudience, setBlogOutlineAudience] = useState("general");
  const [blogOutlineResult, setBlogOutlineResult] = useState(null);
  const [blogOutlineLoading, setBlogOutlineLoading] = useState(false);

  const [introGenKw, setIntroGenKw] = useState("");
  const [introGenStyle, setIntroGenStyle] = useState("PAS");
  const [introGenResult, setIntroGenResult] = useState(null);
  const [introGenLoading, setIntroGenLoading] = useState(false);

  const [titleIdeasKw, setTitleIdeasKw] = useState("");
  const [titleIdeasResult, setTitleIdeasResult] = useState(null);
  const [titleIdeasLoading, setTitleIdeasLoading] = useState(false);

  const [ctaGenKw, setCtaGenKw] = useState("");
  const [ctaGenGoal, setCtaGenGoal] = useState("signup");
  const [ctaGenResult, setCtaGenResult] = useState(null);
  const [ctaGenLoading, setCtaGenLoading] = useState(false);

  const [keyTakeawaysResult, setKeyTakeawaysResult] = useState(null);
  const [keyTakeawaysLoading, setKeyTakeawaysLoading] = useState(false);

  const [summaryGenResult, setSummaryGenResult] = useState(null);
  const [summaryGenLoading, setSummaryGenLoading] = useState(false);

  const [toneAnalyzerResult, setToneAnalyzerResult] = useState(null);
  const [toneAnalyzerLoading, setToneAnalyzerLoading] = useState(false);

  const [contentGraderResult, setContentGraderResult] = useState(null);
  const [contentGraderLoading, setContentGraderLoading] = useState(false);

  const [pullQuotesResult, setPullQuotesResult] = useState(null);
  const [pullQuotesLoading, setPullQuotesLoading] = useState(false);

  const [headlineHookTitle, setHeadlineHookTitle] = useState("");
  const [headlineHookResult, setHeadlineHookResult] = useState(null);
  const [headlineHookLoading, setHeadlineHookLoading] = useState(false);

  const [passageOptResult, setPassageOptResult] = useState(null);
  const [passageOptLoading, setPassageOptLoading] = useState(false);

  const [repurposeResult, setRepurposeResult] = useState(null);
  const [repurposeLoading, setRepurposeLoading] = useState(false);

  const [productName, setProductName] = useState(""); const [productPrice, setProductPrice] = useState(""); const [productBrand, setProductBrand] = useState(""); const [productDesc, setProductDesc] = useState(""); const [productImage, setProductImage] = useState("");
  const [productSchemaResult, setProductSchemaResult] = useState(null); const [productSchemaLoading, setProductSchemaLoading] = useState(false);

  const [eventName, setEventName] = useState(""); const [eventDate, setEventDate] = useState(""); const [eventLocation, setEventLocation] = useState(""); const [eventOrg, setEventOrg] = useState("");
  const [eventSchemaResult, setEventSchemaResult] = useState(null); const [eventSchemaLoading, setEventSchemaLoading] = useState(false); const [eventSchemaName, setEventSchemaName] = useState(""); const [eventSchemaDate, setEventSchemaDate] = useState(""); const [eventSchemaLocation, setEventSchemaLocation] = useState("");

  const [personName, setPersonName] = useState(""); const [personJob, setPersonJob] = useState(""); const [personDesc, setPersonDesc] = useState(""); const [personSameAs, setPersonSameAs] = useState("");
  const [personSchemaResult, setPersonSchemaResult] = useState(null); const [personSchemaLoading, setPersonSchemaLoading] = useState(false);

  const [courseName, setCourseName] = useState(""); const [courseProvider, setCourseProvider] = useState(""); const [coursePrice, setCoursePrice] = useState(""); const [courseDuration, setCourseDuration] = useState("");
  const [courseSchemaResult, setCourseSchemaResult] = useState(null); const [courseSchemaLoading, setCourseSchemaLoading] = useState(false);

  const [recipeName, setRecipeName] = useState(""); const [recipeAuthorName, setRecipeAuthorName] = useState(""); const [recipePrepTime, setRecipePrepTime] = useState(""); const [recipeCookTime, setRecipeCookTime] = useState(""); const [recipeIngredients, setRecipeIngredients] = useState("");
  const [recipeSchemaResult, setRecipeSchemaResult] = useState(null); const [recipeSchemaLoading, setRecipeSchemaLoading] = useState(false);

  const [softwareName, setSoftwareName] = useState(""); const [softwareDesc, setSoftwareDesc] = useState(""); const [softwarePrice, setSoftwarePrice] = useState("0"); const [softwareCategory, setSoftwareCategory] = useState("WebApplication");
  const [softwareSchemaResult, setSoftwareSchemaResult] = useState(null); const [softwareSchemaLoading, setSoftwareSchemaLoading] = useState(false);

  const [bizName, setBizName] = useState(""); const [bizAddress, setBizAddress] = useState(""); const [bizCity, setBizCity] = useState(""); const [bizPhone, setBizPhone] = useState(""); const [bizType, setBizType] = useState("LocalBusiness");
  const [localBizSchemaResult, setLocalBizSchemaResult] = useState(null); const [localBizSchemaLoading, setLocalBizSchemaLoading] = useState(false);

  const [extLinkAuthResult, setExtLinkAuthResult] = useState(null);
  const [extLinkAuthLoading, setExtLinkAuthLoading] = useState(false);

  const [linkDensityResult, setLinkDensityResult] = useState(null);
  const [linkDensityLoading, setLinkDensityLoading] = useState(false);

  const [outboundAuditResult, setOutboundAuditResult] = useState(null);
  const [outboundAuditLoading, setOutboundAuditLoading] = useState(false);

  const [socialProofResult, setSocialProofResult] = useState(null);
  const [socialProofLoading, setSocialProofLoading] = useState(false);

  const [citationCheckResult, setCitationCheckResult] = useState(null);
  const [citationCheckLoading, setCitationCheckLoading] = useState(false);

  const [passageIndexResult, setPassageIndexResult] = useState(null);
  const [passageIndexLoading, setPassageIndexLoading] = useState(false);

  const [contentVisibilityResult, setContentVisibilityResult] = useState(null);
  const [contentVisibilityLoading, setContentVisibilityLoading] = useState(false);

  /* -- BATCH 4: SERP & CTR ----------------------------------------------- */
  const [ctrOptimizerResult, setCtrOptimizerResult] = useState(null); const [ctrOptimizerLoading, setCtrOptimizerLoading] = useState(false); const [ctrTitle, setCtrTitle] = useState(""); const [ctrMeta, setCtrMeta] = useState(""); const [ctrKeyword, setCtrKeyword] = useState("");
  const [serpFeaturesResult, setSerpFeaturesResult] = useState(null); const [serpFeaturesLoading, setSerpFeaturesLoading] = useState(false);
  const [paaGenResult, setPaaGenResult] = useState(null); const [paaGenLoading, setPaaGenLoading] = useState(false); const [paaGenKeyword, setPaaGenKeyword] = useState(""); const [paaGenNiche, setPaaGenNiche] = useState("");
  const [richResultCheckResult, setRichResultCheckResult] = useState(null); const [richResultCheckLoading, setRichResultCheckLoading] = useState(false);
  const [rankbrainResult, setRankbrainResult] = useState(null); const [rankbrainLoading, setRankbrainLoading] = useState(false);
  const [longtailEmbedResult, setLongtailEmbedResult] = useState(null); const [longtailEmbedLoading, setLongtailEmbedLoading] = useState(false); const [longtailTitle, setLongtailTitle] = useState(""); const [longtailPrimary, setLongtailPrimary] = useState("");
  const [metaAbResult, setMetaAbResult] = useState(null); const [metaAbLoading, setMetaAbLoading] = useState(false); const [metaAbTitle, setMetaAbTitle] = useState(""); const [metaAbKeyword, setMetaAbKeyword] = useState("");
  const [difficultyResult, setDifficultyResult] = useState(null); const [difficultyLoading, setDifficultyLoading] = useState(false); const [diffKeyword, setDiffKeyword] = useState(""); const [diffNiche, setDiffNiche] = useState("");
  const [competitorSnapshotResult, setCompetitorSnapshotResult] = useState(null); const [competitorSnapshotLoading, setCompetitorSnapshotLoading] = useState(false); const [snapKeyword, setSnapKeyword] = useState("");

  /* -- BATCH 4: BACKLINKS ------------------------------------------------ */
  const [backlinkOppsResult, setBacklinkOppsResult] = useState(null); const [backlinkOppsLoading, setBacklinkOppsLoading] = useState(false); const [backlinkNiche, setBacklinkNiche] = useState("");
  const [linkGapResult, setLinkGapResult] = useState(null); const [linkGapLoading, setLinkGapLoading] = useState(false); const [linkGapDomain, setLinkGapDomain] = useState(""); const [linkGapComp1, setLinkGapComp1] = useState(""); const [linkGapComp2, setLinkGapComp2] = useState(""); const [linkGapNiche, setLinkGapNiche] = useState(""); const [linkGapCompetitors, setLinkGapCompetitors] = useState("");
  const [outreachResult, setOutreachResult] = useState(null); const [outreachLoading, setOutreachLoading] = useState(false); const [outreachTarget, setOutreachTarget] = useState(""); const [outreachContentTitle, setOutreachContentTitle] = useState(""); const [outreachType, setOutreachType] = useState("guest post");
  const [bestofResult, setBestofResult] = useState(null); const [bestofLoading, setBestofLoading] = useState(false); const [bestofNiche, setBestofNiche] = useState("");
  const [anchorOptResult, setAnchorOptResult] = useState(null); const [anchorOptLoading, setAnchorOptLoading] = useState(false); const [anchorOptKeyword, setAnchorOptKeyword] = useState("");
  const [linkStrategyResult, setLinkStrategyResult] = useState(null); const [linkStrategyLoading, setLinkStrategyLoading] = useState(false); const [linkStratNiche, setLinkStratNiche] = useState(""); const [linkStratBudget, setLinkStratBudget] = useState("");
  const [internalSuggestResult, setInternalSuggestResult] = useState(null); const [internalSuggestLoading, setInternalSuggestLoading] = useState(false);

  /* -- BATCH 4: CONTENT EXTRAS ------------------------------------------- */
  const [freshnessResult, setFreshnessResult] = useState(null); const [freshnessLoading, setFreshnessLoading] = useState(false);
  const [skyscraperResult, setSkyscraperResult] = useState(null); const [skyscraperLoading, setSkyscraperLoading] = useState(false); const [skyscraperKeyword, setSkyscraperKeyword] = useState("");
  const [relunchResult, setRelunchResult] = useState(null); const [relunchLoading, setRelunchLoading] = useState(false); const [relunchKeyword, setRelunchKeyword] = useState("");
  const [semanticEnrichResult, setSemanticEnrichResult] = useState(null); const [semanticEnrichLoading, setSemanticEnrichLoading] = useState(false); const [semanticEnrichKeyword, setSemanticEnrichKeyword] = useState("");

  /* -- BATCH 5: LOCAL SEO ------------------------------------------------ */
  const [gbpResult, setGbpResult] = useState(null); const [gbpLoading, setGbpLoading] = useState(false); const [gbpBusiness, setGbpBusiness] = useState(""); const [gbpLocation, setGbpLocation] = useState(""); const [gbpCategory, setGbpCategory] = useState("");
  const [citationResult, setCitationResult] = useState(null); const [citationLoading, setCitationLoading] = useState(false); const [citationBusiness, setCitationBusiness] = useState(""); const [citationLocation, setCitationLocation] = useState(""); const [citationCategory, setCitationCategory] = useState("");
  const [localKwResult, setLocalKwResult] = useState(null); const [localKwLoading, setLocalKwLoading] = useState(false); const [localKwService, setLocalKwService] = useState(""); const [localKwCity, setLocalKwCity] = useState("");
  const [localSchemaResult, setLocalSchemaResult] = useState(null); const [localSchemaLoading, setLocalSchemaLoading] = useState(false); const [localSchemaName, setLocalSchemaName] = useState(""); const [localSchemaAddr, setLocalSchemaAddr] = useState(""); const [localSchemaPhone, setLocalSchemaPhone] = useState("");

  /* -- BATCH 5: E-E-A-T & BRAND ------------------------------------------ */
  const [eeatResult, setEeatResult] = useState(null); const [eeatLoading, setEeatLoading] = useState(false);
  const [authorBioResult, setAuthorBioResult] = useState(null); const [authorBioLoading, setAuthorBioLoading] = useState(false); const [authorBioName, setAuthorBioName] = useState(""); const [authorBioNiche, setAuthorBioNiche] = useState(""); const [authorBioCredentials, setAuthorBioCredentials] = useState("");
  const [brandSignalResult, setBrandSignalResult] = useState(null); const [brandSignalLoading, setBrandSignalLoading] = useState(false); const [brandSignalDomain, setBrandSignalDomain] = useState(""); const [brandSignalName, setBrandSignalName] = useState("");
  const [expertQuoteResult, setExpertQuoteResult] = useState(null); const [expertQuoteLoading, setExpertQuoteLoading] = useState(false); const [expertQuoteTopic, setExpertQuoteTopic] = useState("");
  const [trustBuilderResult, setTrustBuilderResult] = useState(null); const [trustBuilderLoading, setTrustBuilderLoading] = useState(false);

  /* -- BATCH 5: VOICE & AI SEARCH ---------------------------------------- */
  const [voiceOptResult, setVoiceOptResult] = useState(null); const [voiceOptLoading, setVoiceOptLoading] = useState(false); const [voiceOptKeyword, setVoiceOptKeyword] = useState("");
  const [faqGenResult, setFaqGenResult] = useState(null); const [faqGenLoading, setFaqGenLoading] = useState(false); const [faqGenTopic, setFaqGenTopic] = useState("");
  const [aiOverviewKeyword, setAiOverviewKeyword] = useState("");
  const [convKwResult, setConvKwResult] = useState(null); const [convKwLoading, setConvKwLoading] = useState(false); const [convKwTopic, setConvKwTopic] = useState("");

  /* -- BATCH 5: TECHNICAL+ EXTENSIONS ----------------------------------- */
  const [readingLevelResult, setReadingLevelResult] = useState(null); const [readingLevelLoading, setReadingLevelLoading] = useState(false);
  const [tfidfResult, setTfidfResult] = useState(null); const [tfidfLoading, setTfidfLoading] = useState(false); const [tfidfKeyword, setTfidfKeyword] = useState("");
  const [contentLengthResult, setContentLengthResult] = useState(null); const [contentLengthLoading, setContentLengthLoading] = useState(false); const [contentLengthKw, setContentLengthKw] = useState(""); const [contentLengthWc, setContentLengthWc] = useState("");
  const [pageSpeedResult, setPageSpeedResult] = useState(null); const [pageSpeedLoading, setPageSpeedLoading] = useState(false);

  /* -- BATCH 5: CONTENT+ EXTENSIONS -------------------------------------- */
  const [topicClusterResult, setTopicClusterResult] = useState(null); const [topicClusterLoading, setTopicClusterLoading] = useState(false); const [topicClusterSeed, setTopicClusterSeed] = useState("");
  const [visualDivResult, setVisualDivResult] = useState(null); const [visualDivLoading, setVisualDivLoading] = useState(false);
  const [timeToValueResult, setTimeToValueResult] = useState(null); const [timeToValueLoading, setTimeToValueLoading] = useState(false);
  const [pruningResult, setPruningResult] = useState(null); const [pruningLoading, setPruningLoading] = useState(false); const [pruningNiche, setPruningNiche] = useState("");
  const [statsCuratorResult, setStatsCuratorResult] = useState(null); const [statsCuratorLoading, setStatsCuratorLoading] = useState(false); const [statsCuratorNiche, setStatsCuratorNiche] = useState("");

  /* -- BATCH 5: KEYWORDS EXTENSIONS -------------------------------------- */
  const [lowDiffResult, setLowDiffResult] = useState(null); const [lowDiffLoading, setLowDiffLoading] = useState(false); const [lowDiffSeed, setLowDiffSeed] = useState(""); const [lowDiffDA, setLowDiffDA] = useState("");
  const [cannibalResult, setCannibalResult] = useState(null); const [cannibalLoading, setCannibalLoading] = useState(false); const [cannibalDomain, setCannibalDomain] = useState("");

  /* -- BATCH 6: SERP & CTR EXTENSIONS ------------------------------------ */
  const [newsSeoResult, setNewsSeoResult] = useState(null); const [newsSeoLoading, setNewsSeoLoading] = useState(false);
  const [videoSeoResult, setVideoSeoResult] = useState(null); const [videoSeoLoading, setVideoSeoLoading] = useState(false); const [videoSeoKw, setVideoSeoKw] = useState("");
  const [entityOptResult, setEntityOptResult] = useState(null); const [entityOptLoading, setEntityOptLoading] = useState(false); const [entityOptKw, setEntityOptKw] = useState(""); const [entityOptName, setEntityOptName] = useState("");
  const [reviewSchemaResult, setReviewSchemaResult] = useState(null); const [reviewSchemaLoading, setReviewSchemaLoading] = useState(false); const [reviewSchemaProduct, setReviewSchemaProduct] = useState("");

  /* -- BATCH 6: SCHEMA & LINKS EXTENSIONS -------------------------------- */
  const [redirectAuditResult, setRedirectAuditResult] = useState(null); const [redirectAuditLoading, setRedirectAuditLoading] = useState(false);
  const [dupContentResult, setDupContentResult] = useState(null); const [dupContentLoading, setDupContentLoading] = useState(false);

  /* -- BATCH 6: BACKLINKS EXTENSIONS ------------------------------------- */
  const [brokenBacklinksResult, setBrokenBacklinksResult] = useState(null); const [brokenBacklinksLoading, setBrokenBacklinksLoading] = useState(false); const [brokenBacklinksDomain, setBrokenBacklinksDomain] = useState("");
  const [anchorTextResult, setAnchorTextResult] = useState(null); const [anchorTextLoading, setAnchorTextLoading] = useState(false); const [anchorTextDomain, setAnchorTextDomain] = useState("");
  const [linkVelocityResult, setLinkVelocityResult] = useState(null); const [linkVelocityLoading, setLinkVelocityLoading] = useState(false); const [linkVelocityDomain, setLinkVelocityDomain] = useState(""); const [linkVelocityRate, setLinkVelocityRate] = useState("");

  /* -- BATCH 6: A/B & REFRESH -------------------------------------------- */
  const [abTestResult, setAbTestResult] = useState(null); const [abTestLoading, setAbTestLoading] = useState(false);
  const [contentRefreshResult, setContentRefreshResult] = useState(null); const [contentRefreshLoading, setContentRefreshLoading] = useState(false);
  const [titleVariantsResult, setTitleVariantsResult] = useState(null); const [titleVariantsLoading, setTitleVariantsLoading] = useState(false); const [titleVariantsInput, setTitleVariantsInput] = useState(""); const [titleVariantsKw, setTitleVariantsKw] = useState("");
  const [metaVariantsResult, setMetaVariantsResult] = useState(null); const [metaVariantsLoading, setMetaVariantsLoading] = useState(false); const [metaVariantsKw, setMetaVariantsKw] = useState("");
  const [bertOptResult, setBertOptResult] = useState(null); const [bertOptLoading, setBertOptLoading] = useState(false); const [bertOptKw, setBertOptKw] = useState("");
  const [knowledgeGraphResult, setKnowledgeGraphResult] = useState(null); const [knowledgeGraphLoading, setKnowledgeGraphLoading] = useState(false); const [knowledgeGraphEntity, setKnowledgeGraphEntity] = useState(""); const [knowledgeGraphIndustry, setKnowledgeGraphIndustry] = useState("");

  /* -- BATCH 6: TECHNICAL+ FURTHER EXTENSIONS --------------------------- */
  const [crawlBudgetResult, setCrawlBudgetResult] = useState(null); const [crawlBudgetLoading, setCrawlBudgetLoading] = useState(false);
  const [clickDepthResult, setClickDepthResult] = useState(null); const [clickDepthLoading, setClickDepthLoading] = useState(false);
  const [logFileResult, setLogFileResult] = useState(null); const [logFileLoading, setLogFileLoading] = useState(false); const [logSnippet, setLogSnippet] = useState("");
  const [intlSeoResult, setIntlSeoResult] = useState(null); const [intlSeoLoading, setIntlSeoLoading] = useState(false); const [intlSeoMarkets, setIntlSeoMarkets] = useState("");

  /* -- ANALYZER ----------------------------------------------------------- */
  const runScan = useCallback(async () => {
    if (!url.trim()) return;
    setScanning(true); setScanErr(""); setScanResult(null); setAiAnalysis(null);
    setRewriteResult(null); setFixes({}); setExpandedIssue(null);
    try {
      const r = await apiFetchJSON(`${API}/analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim(), keywords: kwInput.trim() }) });
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
      const r = await apiFetchJSON(`${API}/ai/fix-code`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ issue: issue.msg, url: scanResult?.url, pageContext: { title: scanResult?.title, h1: scanResult?.h1, wordCount: scanResult?.wordCount } }) });
      if (r.ok) setFixes(p => ({ ...p, [k]: r.fix }));
    } catch {}
    setFixLoading(null);
  }, [scanResult]);

  const runAiAnalysis = useCallback(async () => {
    if (!scanResult) return;
    setAiAnalyzing(true);
    try {
      const r = await apiFetchJSON(`${API}/ai/analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url, title: scanResult.title, metaDescription: scanResult.metaDescription, h1: scanResult.h1, wordCount: scanResult.wordCount, headings: scanResult.headings, keywords: kwInput, scored: scanResult.scored }) });
      if (r.ok) setAiAnalysis(r.structured || JSON.parse(r.analysis));
    } catch {}
    setAiAnalyzing(false);
  }, [scanResult, kwInput]);

  const generateSchema = useCallback(async () => {
    if (!scanResult) return;
    setSchemaGenLoading(true); setGeneratedSchema(null);
    try {
      const r = await apiFetchJSON(`${API}/schema/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
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
      const r = await apiFetchJSON(`${API}/links/check`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (!r.ok) throw new Error(r.error || "Link check failed");
      setBrokenLinksResult(r);
    } catch (e) { setBrokenLinksErr(e.message); }
    setBrokenLinksLoading(false);
  }, [scanResult]);

  const generateFaqSchema = useCallback(async (useAI = false) => {
    if (!scanResult?.questionHeadings?.length) return;
    setFaqSchemaLoading(true); setFaqSchemaResult(null);
    try {
      const r = await apiFetchJSON(`${API}/faq-schema/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questionHeadings: scanResult.questionHeadings, useAI, url: scanResult.url }) });
      if (r.ok) setFaqSchemaResult(r);
    } catch {}
    setFaqSchemaLoading(false);
  }, [scanResult]);

  const runLsiKeywords = useCallback(async () => {
    if (!seedKw.trim()) return;
    setLsiLoading(true); setLsiErr(""); setLsiResult(null);
    try {
      const r = await apiFetchJSON(`${API}/keywords/lsi`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: seedKw.trim(), niche: kwNiche.trim() || undefined }) });
      if (!r.ok) throw new Error(r.error || "Failed");
      setLsiResult(r);
    } catch (e) { setLsiErr(e.message); }
    setLsiLoading(false);
  }, [seedKw, kwNiche]);

  const runLlmScore = useCallback(async () => {
    if (!scanResult?.url) return;
    setLlmLoading(true); setLlmErr(""); setLlmScore(null);
    try {
      const r = await apiFetchJSON(`${API}/llm/score`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (!r.ok) throw new Error(r.error || "LLM score failed");
      setLlmScore(r);
    } catch (e) { setLlmErr(e.message); }
    setLlmLoading(false);
  }, [scanResult]);

  const runTechAudit = useCallback(async () => {
    if (!scanResult?.url) return;
    setTechAuditLoading(true); setTechAuditErr(""); setTechAudit(null);
    try {
      const r = await apiFetchJSON(`${API}/technical/audit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (!r.ok) throw new Error(r.error || "Audit failed");
      setTechAudit(r);
    } catch (e) { setTechAuditErr(e.message); }
    setTechAuditLoading(false);
  }, [scanResult]);

  const runCtrSignals = useCallback(async () => {
    if (!scanResult?.title) return;
    setCtrLoading(true); setCtrSignals(null);
    try {
      const r = await apiFetchJSON(`${API}/title/ctr-signals`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: scanResult.title, keyword: kwInput.trim() }) });
      if (r.ok) setCtrSignals(r);
    } catch {}
    setCtrLoading(false);
  }, [scanResult, kwInput]);

  const runSchemaValidate = useCallback(async () => {
    if (!scanResult?.url) return;
    setSchemaValidLoading(true); setSchemaValidErr(""); setSchemaValid(null);
    try {
      const r = await apiFetchJSON(`${API}/article-schema/validate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (!r.ok) throw new Error(r.error || "Validation failed");
      setSchemaValid(r);
    } catch (e) { setSchemaValidErr(e.message); }
    setSchemaValidLoading(false);
  }, [scanResult]);

  const runAdvReadability = useCallback(async () => {
    if (!scanResult?.url) return;
    setAdvReadLoading(true); setAdvReadability(null);
    try {
      const r = await apiFetchJSON(`${API}/content/advanced-readability`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setAdvReadability(r);
    } catch {}
    setAdvReadLoading(false);
  }, [scanResult]);

  const runIntLinks = useCallback(async () => {
    if (!scanResult?.url) return;
    setIntLinksLoading(true); setIntLinksErr(""); setIntLinks(null);
    try {
      const r = await apiFetchJSON(`${API}/links/internal-suggestions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url, title: scanResult.title, niche: kwNiche.trim() || undefined }) });
      if (!r.ok) throw new Error(r.error || "Failed");
      setIntLinks(r);
    } catch (e) { setIntLinksErr(e.message); }
    setIntLinksLoading(false);
  }, [scanResult, kwNiche]);

  /* -- NEW FEATURE CALLBACKS -------------------------------------------- */
  const runCoreWebVitals = useCallback(async () => {
    if (!url.trim()) return;
    setCwvLoading(true); setCwvErr(""); setCwvResult(null);
    try {
      const r = await apiFetchJSON(`${API}/core-web-vitals`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim(), strategy: "mobile" }) });
      if (!r.ok) throw new Error(r.error || "CWV check failed");
      setCwvResult(r);
    } catch (e) { setCwvErr(e.message); }
    setCwvLoading(false);
  }, [url]);

  const runCrawlerAccess = useCallback(async () => {
    if (!url.trim()) return;
    setCrawlerLoading(true); setCrawlerErr(""); setCrawlerResult(null);
    try {
      const r = await apiFetchJSON(`${API}/crawler-access`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) });
      if (!r.ok) throw new Error(r.error || "Crawler check failed");
      setCrawlerResult(r);
    } catch (e) { setCrawlerErr(e.message); }
    setCrawlerLoading(false);
  }, [url]);

  const runTitleH1 = useCallback(async () => {
    if (!scanResult?.url) return;
    setTitleH1Loading(true); setTitleH1Result(null);
    try {
      const r = await apiFetchJSON(`${API}/title-h1-alignment`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setTitleH1Result(r);
    } catch {}
    setTitleH1Loading(false);
  }, [scanResult]);

  const runHeadingHier = useCallback(async () => {
    if (!scanResult?.url) return;
    setHeadingHierLoading(true); setHeadingHierResult(null);
    try {
      const r = await apiFetchJSON(`${API}/heading-hierarchy`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setHeadingHierResult(r);
    } catch {}
    setHeadingHierLoading(false);
  }, [scanResult]);

  const runImageSeo = useCallback(async () => {
    if (!scanResult?.url) return;
    setImageSeoLoading(true); setImageSeoResult(null);
    try {
      const r = await apiFetchJSON(`${API}/image-seo`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setImageSeoResult(r);
    } catch {}
    setImageSeoLoading(false);
  }, [scanResult]);

  const runSemanticHtml = useCallback(async () => {
    if (!scanResult?.url) return;
    setSemanticHtmlLoading(true); setSemanticHtmlResult(null);
    try {
      const r = await apiFetchJSON(`${API}/semantic-html`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setSemanticHtmlResult(r);
    } catch {}
    setSemanticHtmlLoading(false);
  }, [scanResult]);

  const runMetaDescAudit = useCallback(async () => {
    if (!scanResult?.url) return;
    setMetaDescAuditLoading(true); setMetaDescAuditResult(null);
    try {
      const r = await apiFetchJSON(`${API}/meta-description-audit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) });
      if (r.ok) setMetaDescAuditResult(r);
    } catch {}
    setMetaDescAuditLoading(false);
  }, [scanResult, kwInput]);

  const runKwDensity = useCallback(async () => {
    if (!scanResult?.url) return;
    setKwDensityLoading(true); setKwDensityResult(null);
    try {
      const r = await apiFetchJSON(`${API}/keyword-density`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) });
      if (r.ok) setKwDensityResult(r);
    } catch {}
    setKwDensityLoading(false);
  }, [scanResult, kwInput]);

  const runIndexDirectives = useCallback(async () => {
    if (!scanResult?.url) return;
    setIndexDirectivesLoading(true); setIndexDirectivesResult(null);
    try {
      const r = await apiFetchJSON(`${API}/index-directives`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setIndexDirectivesResult(r);
    } catch {}
    setIndexDirectivesLoading(false);
  }, [scanResult]);

  const runContentStruct = useCallback(async () => {
    if (!scanResult?.url) return;
    setContentStructLoading(true); setContentStructResult(null);
    try {
      const r = await apiFetchJSON(`${API}/content-structure`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setContentStructResult(r);
    } catch {}
    setContentStructLoading(false);
  }, [scanResult]);

  const runAuthorAuth = useCallback(async () => {
    if (!scanResult?.url) return;
    setAuthorAuthLoading(true); setAuthorAuthResult(null);
    try {
      const r = await apiFetchJSON(`${API}/author-authority`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setAuthorAuthResult(r);
    } catch {}
    setAuthorAuthLoading(false);
  }, [scanResult]);

  const runSitemap = useCallback(async () => {
    if (!scanResult?.url) return;
    setSitemapLoading(true); setSitemapResult(null);
    try {
      const r = await apiFetchJSON(`${API}/sitemap-check`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setSitemapResult(r);
    } catch {}
    setSitemapLoading(false);
  }, [scanResult]);

  const runOgValid = useCallback(async () => {
    if (!scanResult?.url) return;
    setOgValidLoading(true); setOgValidResult(null);
    try {
      const r = await apiFetchJSON(`${API}/og-validator`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setOgValidResult(r);
    } catch {}
    setOgValidLoading(false);
  }, [scanResult]);

  const runBreadcrumb = useCallback(async () => {
    if (!scanResult?.url) return;
    setBreadcrumbLoading(true); setBreadcrumbResult(null);
    try {
      const r = await apiFetchJSON(`${API}/schema/breadcrumb`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setBreadcrumbResult(r);
    } catch {}
    setBreadcrumbLoading(false);
  }, [scanResult]);

  const runHowto = useCallback(async () => {
    if (!howtoTitle.trim()) return;
    setHowtoLoading(true); setHowtoResult(null);
    try {
      const r = await apiFetchJSON(`${API}/schema/howto`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: howtoTitle.trim() }) });
      if (r.ok) setHowtoResult(r);
    } catch {}
    setHowtoLoading(false);
  }, [howtoTitle]);

  const runVideoSchema = useCallback(async () => {
    if (!scanResult?.url) return;
    setVideoSchemaLoading(true); setVideoSchemaResult(null);
    try {
      const r = await apiFetchJSON(`${API}/schema/video`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setVideoSchemaResult(r);
    } catch {}
    setVideoSchemaLoading(false);
  }, [scanResult]);

  const runReviewSchema = useCallback(async () => {
    if (!reviewName.trim()) return;
    setReviewLoading(true); setReviewResult(null);
    try {
      const r = await apiFetchJSON(`${API}/schema/review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: reviewName.trim(), ratingValue: parseFloat(reviewRating), reviewCount: parseInt(reviewCount), url: scanResult?.url }) });
      if (r.ok) setReviewResult(r);
    } catch {}
    setReviewLoading(false);
  }, [reviewName, reviewRating, reviewCount, scanResult]);

  const runOrgSchema = useCallback(async () => {
    if (!orgName.trim()) return;
    setOrgLoading(true); setOrgResult(null);
    try {
      const r = await apiFetchJSON(`${API}/schema/organization`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: orgName.trim(), url: orgUrl.trim() || undefined }) });
      if (r.ok) setOrgResult(r);
    } catch {}
    setOrgLoading(false);
  }, [orgName, orgUrl]);

  const runSpeakable = useCallback(async () => {
    if (!scanResult?.url) return;
    setSpeakableLoading(true); setSpeakableResult(null);
    try {
      const r = await apiFetchJSON(`${API}/schema/speakable`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setSpeakableResult(r);
    } catch {}
    setSpeakableLoading(false);
  }, [scanResult]);

  const runIntent = useCallback(async () => {
    if (!intentKeyword.trim()) return;
    setIntentLoading(true); setIntentResult(null);
    try {
      const r = await apiFetchJSON(`${API}/intent-classifier`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: intentKeyword.trim(), url: scanResult?.url }) });
      if (r.ok) setIntentResult(r);
    } catch {}
    setIntentLoading(false);
  }, [intentKeyword, scanResult]);

  const runAiOverview = useCallback(async () => {
    if (!scanResult?.url) return;
    setAiOverviewLoading(true); setAiOverviewResult(null);
    try {
      const r = await apiFetchJSON(`${API}/ai-overview-eligibility`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) });
      if (r.ok) setAiOverviewResult(r);
    } catch {}
    setAiOverviewLoading(false);
  }, [scanResult, kwInput]);

  const runTopical = useCallback(async () => {
    if (!topicalKw.trim()) return;
    setTopicalLoading(true); setTopicalResult(null);
    try {
      const r = await apiFetchJSON(`${API}/topical-authority`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: topicalKw.trim(), url: scanResult?.url }) });
      if (r.ok) setTopicalResult(r);
    } catch {}
    setTopicalLoading(false);
  }, [topicalKw, scanResult]);

  const runMetaOpt = useCallback(async () => {
    if (!scanResult?.url) return;
    setMetaOptLoading(true); setMetaOptResult(null);
    try {
      const r = await apiFetchJSON(`${API}/meta-description-optimizer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) });
      if (r.ok) setMetaOptResult(r);
    } catch {}
    setMetaOptLoading(false);
  }, [scanResult, kwInput]);

  const runDecay = useCallback(async () => {
    if (!scanResult?.url) return;
    setDecayLoading(true); setDecayResult(null);
    try {
      const r = await apiFetchJSON(`${API}/content-decay`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) });
      if (r.ok) setDecayResult(r);
    } catch {}
    setDecayLoading(false);
  }, [scanResult, kwInput]);

  const runCompGap = useCallback(async () => {
    const urls = compUrls.split("\n").map(u => u.trim()).filter(Boolean);
    if (!urls.length || !scanResult?.url) return;
    setCompLoading(true); setCompErr(""); setCompResult(null);
    try {
      const r = await apiFetchJSON(`${API}/competitor-gap`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url, competitorUrls: urls }) });
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
      const r = await apiFetchJSON(`${API}/cannibalization`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ urls, keyword: kwInput.trim() }) });
      if (r.ok) setCannibResult(r);
    } catch {}
    setCannibLoading(false);
  }, [cannibUrls, kwInput]);

  const runAnchor = useCallback(async () => {
    if (!scanResult?.url) return;
    setAnchorLoading(true); setAnchorResult(null);
    try {
      const r = await apiFetchJSON(`${API}/anchor-text-audit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setAnchorResult(r);
    } catch {}
    setAnchorLoading(false);
  }, [scanResult]);

  const runToc = useCallback(async () => {
    if (!scanResult?.url) return;
    setTocLoading(true); setTocResult(null);
    try {
      const r = await apiFetchJSON(`${API}/toc-generator`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setTocResult(r);
    } catch {}
    setTocLoading(false);
  }, [scanResult]);

  const runSectionWc = useCallback(async () => {
    if (!scanResult?.url) return;
    setSectionWcLoading(true); setSectionWcResult(null);
    try {
      const r = await apiFetchJSON(`${API}/section-word-count`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setSectionWcResult(r);
    } catch {}
    setSectionWcLoading(false);
  }, [scanResult]);

  const runPaa = useCallback(async () => {
    if (!paaKw.trim()) return;
    setPaaLoading(true); setPaaResult(null);
    try {
      const r = await apiFetchJSON(`${API}/people-also-ask`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: paaKw.trim(), url: scanResult?.url }) });
      if (r.ok) setPaaResult(r);
    } catch {}
    setPaaLoading(false);
  }, [paaKw, scanResult]);

  const runEntity = useCallback(async () => {
    if (!scanResult?.url) return;
    setEntityLoading(true); setEntityResult(null);
    try {
      const r = await apiFetchJSON(`${API}/entity-detection`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) });
      if (r.ok) setEntityResult(r);
    } catch {}
    setEntityLoading(false);
  }, [scanResult]);

  const runSerpFeatures = useCallback(async () => {
    if (!scanResult?.url) return;
    setSerpFeatLoading(true); setSerpFeatResult(null);
    try {
      const r = await apiFetchJSON(`${API}/serp-features`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) });
      if (r.ok) setSerpFeatResult(r);
    } catch {}
    setSerpFeatLoading(false);
  }, [scanResult, kwInput]);

  /* -- BATCH 3 CALLBACKS ------------------------------------------------ */
  const runSentenceVariety = useCallback(async () => {
    if (!scanResult?.url) return;
    setSentenceVarietyLoading(true); setSentenceVarietyResult(null);
    try { const r = await apiFetchJSON(`${API}/content/sentence-variety`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setSentenceVarietyResult(r); } catch {}
    setSentenceVarietyLoading(false);
  }, [scanResult]);

  const runEmotionalTone = useCallback(async () => {
    if (!scanResult?.url) return;
    setEmotionalToneLoading(true); setEmotionalToneResult(null);
    try { const r = await apiFetchJSON(`${API}/content/emotional-tone`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setEmotionalToneResult(r); } catch {}
    setEmotionalToneLoading(false);
  }, [scanResult]);

  const runJargonDetector = useCallback(async () => {
    if (!scanResult?.url) return;
    setJargonLoading(true); setJargonResult(null);
    try { const r = await apiFetchJSON(`${API}/content/jargon-detector`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setJargonResult(r); } catch {}
    setJargonLoading(false);
  }, [scanResult]);

  const runExpertiseSignals = useCallback(async () => {
    if (!scanResult?.url) return;
    setExpertiseLoading(true); setExpertiseResult(null);
    try { const r = await apiFetchJSON(`${API}/content/expertise-signals`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setExpertiseResult(r); } catch {}
    setExpertiseLoading(false);
  }, [scanResult]);

  const runMultimediaScore = useCallback(async () => {
    if (!scanResult?.url) return;
    setMultimediaLoading(true); setMultimediaResult(null);
    try { const r = await apiFetchJSON(`${API}/content/multimedia-score`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setMultimediaResult(r); } catch {}
    setMultimediaLoading(false);
  }, [scanResult]);

  const runQuestionsCount = useCallback(async () => {
    if (!scanResult?.url) return;
    setQuestionsLoading(true); setQuestionsResult(null);
    try { const r = await apiFetchJSON(`${API}/content/questions-count`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setQuestionsResult(r); } catch {}
    setQuestionsLoading(false);
  }, [scanResult]);

  const runIntroQuality = useCallback(async () => {
    if (!scanResult?.url) return;
    setIntroQualityLoading(true); setIntroQualityResult(null);
    try { const r = await apiFetchJSON(`${API}/content/intro-quality`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setIntroQualityResult(r); } catch {}
    setIntroQualityLoading(false);
  }, [scanResult]);

  const runCtaAudit = useCallback(async () => {
    if (!scanResult?.url) return;
    setCtaAuditLoading(true); setCtaAuditResult(null);
    try { const r = await apiFetchJSON(`${API}/content/cta-audit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setCtaAuditResult(r); } catch {}
    setCtaAuditLoading(false);
  }, [scanResult]);

  const runFormattingScore = useCallback(async () => {
    if (!scanResult?.url) return;
    setFormattingLoading(true); setFormattingResult(null);
    try { const r = await apiFetchJSON(`${API}/content/formatting-score`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setFormattingResult(r); } catch {}
    setFormattingLoading(false);
  }, [scanResult]);

  const runThinContent = useCallback(async () => {
    if (!scanResult?.url) return;
    setThinContentLoading(true); setThinContentResult(null);
    try { const r = await apiFetchJSON(`${API}/content/thin-content`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) }); if (r.ok) setThinContentResult(r); } catch {}
    setThinContentLoading(false);
  }, [scanResult, kwInput]);

  const runKwProminence = useCallback(async () => {
    if (!scanResult?.url || !kwInput.trim()) return;
    setKwProminenceLoading(true); setKwProminenceResult(null);
    try { const r = await apiFetchJSON(`${API}/keywords/prominence`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) }); if (r.ok) setKwProminenceResult(r); } catch {}
    setKwProminenceLoading(false);
  }, [scanResult, kwInput]);

  const runKwTfidf = useCallback(async () => {
    if (!scanResult?.url) return;
    setKwTfidfLoading(true); setKwTfidfResult(null);
    try { const r = await apiFetchJSON(`${API}/keywords/tfidf`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setKwTfidfResult(r); } catch {}
    setKwTfidfLoading(false);
  }, [scanResult]);

  const runCoOccurrence = useCallback(async () => {
    if (!scanResult?.url || !kwInput.trim()) return;
    setCoOccurrenceLoading(true); setCoOccurrenceResult(null);
    try { const r = await apiFetchJSON(`${API}/keywords/co-occurrence`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) }); if (r.ok) setCoOccurrenceResult(r); } catch {}
    setCoOccurrenceLoading(false);
  }, [scanResult, kwInput]);

  const runSecondaryKw = useCallback(async () => {
    if (!scanResult?.url || !kwInput.trim()) return;
    setSecondaryKwLoading(true); setSecondaryKwResult(null);
    try { const r = await apiFetchJSON(`${API}/keywords/secondary`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) }); if (r.ok) setSecondaryKwResult(r); } catch {}
    setSecondaryKwLoading(false);
  }, [scanResult, kwInput]);

  const runVoiceSearch = useCallback(async () => {
    if (!scanResult?.url || !kwInput.trim()) return;
    setVoiceSearchLoading(true); setVoiceSearchResult(null);
    try { const r = await apiFetchJSON(`${API}/keywords/voice-search`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) }); if (r.ok) setVoiceSearchResult(r); } catch {}
    setVoiceSearchLoading(false);
  }, [scanResult, kwInput]);

  const runNegativeCheck = useCallback(async () => {
    if (!scanResult?.url || !kwInput.trim()) return;
    setNegCheckLoading(true); setNegCheckResult(null);
    try { const r = await apiFetchJSON(`${API}/keywords/negative-check`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) }); if (r.ok) setNegCheckResult(r); } catch {}
    setNegCheckLoading(false);
  }, [scanResult, kwInput]);

  const runFeatSnippet = useCallback(async () => {
    if (!scanResult?.url || !kwInput.trim()) return;
    setFeatSnippetLoading(true); setFeatSnippetResult(null);
    try { const r = await apiFetchJSON(`${API}/keywords/featured-snippet`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) }); if (r.ok) setFeatSnippetResult(r); } catch {}
    setFeatSnippetLoading(false);
  }, [scanResult, kwInput]);

  const runUrlAnalysis = useCallback(async () => {
    if (!url.trim()) return;
    setUrlAnalysisLoading(true); setUrlAnalysisResult(null);
    try { const r = await apiFetchJSON(`${API}/technical/url-analysis`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setUrlAnalysisResult(r); } catch {}
    setUrlAnalysisLoading(false);
  }, [url]);

  const runMobileSeo = useCallback(async () => {
    if (!scanResult?.url) return;
    setMobileSeoLoading(true); setMobileSeoResult(null);
    try { const r = await apiFetchJSON(`${API}/technical/mobile-seo`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setMobileSeoResult(r); } catch {}
    setMobileSeoLoading(false);
  }, [scanResult]);

  const runHreflang = useCallback(async () => {
    if (!scanResult?.url) return;
    setHreflangLoading(true); setHreflangResult(null);
    try { const r = await apiFetchJSON(`${API}/technical/hreflang`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setHreflangResult(r); } catch {}
    setHreflangLoading(false);
  }, [scanResult]);

  const runAmpCheck = useCallback(async () => {
    if (!scanResult?.url) return;
    setAmpLoading(true); setAmpResult(null);
    try { const r = await apiFetchJSON(`${API}/technical/amp-check`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setAmpResult(r); } catch {}
    setAmpLoading(false);
  }, [scanResult]);

  const runResourceHints = useCallback(async () => {
    if (!scanResult?.url) return;
    setResourceHintsLoading(true); setResourceHintsResult(null);
    try { const r = await apiFetchJSON(`${API}/technical/resource-hints`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setResourceHintsResult(r); } catch {}
    setResourceHintsLoading(false);
  }, [scanResult]);

  const runJsonLdLint = useCallback(async () => {
    if (!scanResult?.url) return;
    setJsonLdLintLoading(true); setJsonLdLintResult(null);
    try { const r = await apiFetchJSON(`${API}/technical/json-ld-lint`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setJsonLdLintResult(r); } catch {}
    setJsonLdLintLoading(false);
  }, [scanResult]);

  const runOgImageDims = useCallback(async () => {
    if (!scanResult?.url) return;
    setOgImageDimsLoading(true); setOgImageDimsResult(null);
    try { const r = await apiFetchJSON(`${API}/technical/og-image-dims`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setOgImageDimsResult(r); } catch {}
    setOgImageDimsLoading(false);
  }, [scanResult]);

  const runHttpsStatus = useCallback(async () => {
    if (!url.trim()) return;
    setHttpsStatusLoading(true); setHttpsStatusResult(null);
    try { const r = await apiFetchJSON(`${API}/technical/https-status`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setHttpsStatusResult(r); } catch {}
    setHttpsStatusLoading(false);
  }, [url]);

  const runBlogOutline = useCallback(async () => {
    if (!blogOutlineKw.trim()) return;
    setBlogOutlineLoading(true); setBlogOutlineResult(null);
    try { const r = await apiFetchJSON(`${API}/ai/blog-outline`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: blogOutlineKw.trim(), audience: blogOutlineAudience }) }); if (r.ok) setBlogOutlineResult(r); } catch {}
    setBlogOutlineLoading(false);
  }, [blogOutlineKw, blogOutlineAudience]);

  const runIntroGenerator = useCallback(async () => {
    if (!introGenKw.trim()) return;
    setIntroGenLoading(true); setIntroGenResult(null);
    try { const r = await apiFetchJSON(`${API}/ai/intro-generator`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: introGenKw.trim(), style: introGenStyle }) }); if (r.ok) setIntroGenResult(r); } catch {}
    setIntroGenLoading(false);
  }, [introGenKw, introGenStyle]);

  const runTitleIdeas = useCallback(async () => {
    if (!titleIdeasKw.trim()) return;
    setTitleIdeasLoading(true); setTitleIdeasResult(null);
    try { const r = await apiFetchJSON(`${API}/ai/title-ideas`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: titleIdeasKw.trim() }) }); if (r.ok) setTitleIdeasResult(r); } catch {}
    setTitleIdeasLoading(false);
  }, [titleIdeasKw]);

  const runCtaGenerator = useCallback(async () => {
    if (!ctaGenKw.trim()) return;
    setCtaGenLoading(true); setCtaGenResult(null);
    try { const r = await apiFetchJSON(`${API}/ai/cta-generator`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: ctaGenKw.trim(), goal: ctaGenGoal }) }); if (r.ok) setCtaGenResult(r); } catch {}
    setCtaGenLoading(false);
  }, [ctaGenKw, ctaGenGoal]);

  const runKeyTakeaways = useCallback(async () => {
    if (!scanResult?.url) return;
    setKeyTakeawaysLoading(true); setKeyTakeawaysResult(null);
    try { const r = await apiFetchJSON(`${API}/ai/key-takeaways`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setKeyTakeawaysResult(r); } catch {}
    setKeyTakeawaysLoading(false);
  }, [scanResult]);

  const runSummaryGenerator = useCallback(async () => {
    if (!scanResult?.url) return;
    setSummaryGenLoading(true); setSummaryGenResult(null);
    try { const r = await apiFetchJSON(`${API}/ai/summary-generator`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setSummaryGenResult(r); } catch {}
    setSummaryGenLoading(false);
  }, [scanResult]);

  const runToneAnalyzer = useCallback(async () => {
    if (!scanResult?.url) return;
    setToneAnalyzerLoading(true); setToneAnalyzerResult(null);
    try { const r = await apiFetchJSON(`${API}/ai/tone-analyzer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setToneAnalyzerResult(r); } catch {}
    setToneAnalyzerLoading(false);
  }, [scanResult]);

  const runContentGrader = useCallback(async () => {
    if (!scanResult?.url) return;
    setContentGraderLoading(true); setContentGraderResult(null);
    try { const r = await apiFetchJSON(`${API}/ai/content-grader`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) }); if (r.ok) setContentGraderResult(r); } catch {}
    setContentGraderLoading(false);
  }, [scanResult, kwInput]);

  const runPullQuotes = useCallback(async () => {
    if (!scanResult?.url) return;
    setPullQuotesLoading(true); setPullQuotesResult(null);
    try { const r = await apiFetchJSON(`${API}/ai/pull-quotes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setPullQuotesResult(r); } catch {}
    setPullQuotesLoading(false);
  }, [scanResult]);

  const runHeadlineHook = useCallback(async () => {
    const h = headlineHookTitle || scanResult?.title;
    if (!h) return;
    setHeadlineHookLoading(true); setHeadlineHookResult(null);
    try { const r = await apiFetchJSON(`${API}/ai/headline-hook`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ headline: h, keyword: kwInput.trim() }) }); if (r.ok) setHeadlineHookResult(r); } catch {}
    setHeadlineHookLoading(false);
  }, [headlineHookTitle, scanResult, kwInput]);

  const runPassageOptimizer = useCallback(async () => {
    if (!scanResult?.url || !kwInput.trim()) return;
    setPassageOptLoading(true); setPassageOptResult(null);
    try { const r = await apiFetchJSON(`${API}/ai/passage-optimizer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) }); if (r.ok) setPassageOptResult(r); } catch {}
    setPassageOptLoading(false);
  }, [scanResult, kwInput]);

  const runRepurpose = useCallback(async () => {
    if (!scanResult?.url) return;
    setRepurposeLoading(true); setRepurposeResult(null);
    try { const r = await apiFetchJSON(`${API}/ai/content-repurpose`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setRepurposeResult(r); } catch {}
    setRepurposeLoading(false);
  }, [scanResult]);

  const runProductSchema = useCallback(async () => {
    if (!productName.trim()) return;
    setProductSchemaLoading(true); setProductSchemaResult(null);
    try { const r = await apiFetchJSON(`${API}/schema/product`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: productName, price: productPrice, brand: productBrand, description: productDesc, image: productImage }) }); if (r.ok) setProductSchemaResult(r); } catch {}
    setProductSchemaLoading(false);
  }, [productName, productPrice, productBrand, productDesc, productImage]);

  const runEventSchema = useCallback(async () => {
    if (!eventName.trim() || !eventDate.trim()) return;
    setEventSchemaLoading(true); setEventSchemaResult(null);
    try { const r = await apiFetchJSON(`${API}/schema/event`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: eventName, date: eventDate, location: eventLocation, organizer: eventOrg }) }); if (r.ok) setEventSchemaResult(r); } catch {}
    setEventSchemaLoading(false);
  }, [eventName, eventDate, eventLocation, eventOrg]);

  const runPersonSchema = useCallback(async () => {
    if (!personName.trim()) return;
    setPersonSchemaLoading(true); setPersonSchemaResult(null);
    try { const r = await apiFetchJSON(`${API}/schema/person`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: personName, jobTitle: personJob, description: personDesc, sameAs: personSameAs }) }); if (r.ok) setPersonSchemaResult(r); } catch {}
    setPersonSchemaLoading(false);
  }, [personName, personJob, personDesc, personSameAs]);

  const runCourseSchema = useCallback(async () => {
    if (!courseName.trim()) return;
    setCourseSchemaLoading(true); setCourseSchemaResult(null);
    try { const r = await apiFetchJSON(`${API}/schema/course`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: courseName, provider: courseProvider, price: coursePrice, duration: courseDuration }) }); if (r.ok) setCourseSchemaResult(r); } catch {}
    setCourseSchemaLoading(false);
  }, [courseName, courseProvider, coursePrice, courseDuration]);

  const runRecipeSchema = useCallback(async () => {
    if (!recipeName.trim()) return;
    setRecipeSchemaLoading(true); setRecipeSchemaResult(null);
    try { const r = await apiFetchJSON(`${API}/schema/recipe`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: recipeName, author: recipeAuthorName, prepTime: recipePrepTime, cookTime: recipeCookTime, ingredients: recipeIngredients }) }); if (r.ok) setRecipeSchemaResult(r); } catch {}
    setRecipeSchemaLoading(false);
  }, [recipeName, recipeAuthorName, recipePrepTime, recipeCookTime, recipeIngredients]);

  const runSoftwareSchema = useCallback(async () => {
    if (!softwareName.trim()) return;
    setSoftwareSchemaLoading(true); setSoftwareSchemaResult(null);
    try { const r = await apiFetchJSON(`${API}/schema/software`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: softwareName, description: softwareDesc, price: softwarePrice, category: softwareCategory }) }); if (r.ok) setSoftwareSchemaResult(r); } catch {}
    setSoftwareSchemaLoading(false);
  }, [softwareName, softwareDesc, softwarePrice, softwareCategory]);

  const runLocalBizSchema = useCallback(async () => {
    if (!bizName.trim()) return;
    setLocalBizSchemaLoading(true); setLocalBizSchemaResult(null);
    try { const r = await apiFetchJSON(`${API}/schema/local-business`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: bizName, address: bizAddress, city: bizCity, phone: bizPhone, type: bizType }) }); if (r.ok) setLocalBizSchemaResult(r); } catch {}
    setLocalBizSchemaLoading(false);
  }, [bizName, bizAddress, bizCity, bizPhone, bizType]);

  const runExtLinkAuth = useCallback(async () => {
    if (!scanResult?.url) return;
    setExtLinkAuthLoading(true); setExtLinkAuthResult(null);
    try { const r = await apiFetchJSON(`${API}/links/external-authority`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setExtLinkAuthResult(r); } catch {}
    setExtLinkAuthLoading(false);
  }, [scanResult]);

  const runLinkDensity = useCallback(async () => {
    if (!scanResult?.url) return;
    setLinkDensityLoading(true); setLinkDensityResult(null);
    try { const r = await apiFetchJSON(`${API}/links/link-density`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setLinkDensityResult(r); } catch {}
    setLinkDensityLoading(false);
  }, [scanResult]);

  const runOutboundAudit = useCallback(async () => {
    if (!scanResult?.url) return;
    setOutboundAuditLoading(true); setOutboundAuditResult(null);
    try { const r = await apiFetchJSON(`${API}/links/outbound-audit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setOutboundAuditResult(r); } catch {}
    setOutboundAuditLoading(false);
  }, [scanResult]);

  const runSocialProof = useCallback(async () => {
    if (!scanResult?.url) return;
    setSocialProofLoading(true); setSocialProofResult(null);
    try { const r = await apiFetchJSON(`${API}/trust/social-proof`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setSocialProofResult(r); } catch {}
    setSocialProofLoading(false);
  }, [scanResult]);

  const runCitationCheck = useCallback(async () => {
    if (!scanResult?.url) return;
    setCitationCheckLoading(true); setCitationCheckResult(null);
    try { const r = await apiFetchJSON(`${API}/trust/citation-check`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setCitationCheckResult(r); } catch {}
    setCitationCheckLoading(false);
  }, [scanResult]);

  const runPassageIndex = useCallback(async () => {
    if (!scanResult?.url || !kwInput.trim()) return;
    setPassageIndexLoading(true); setPassageIndexResult(null);
    try { const r = await apiFetchJSON(`${API}/passage-indexing`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) }); if (r.ok) setPassageIndexResult(r); } catch {}
    setPassageIndexLoading(false);
  }, [scanResult, kwInput]);

  const runContentVisibility = useCallback(async () => {
    if (!scanResult?.url || !kwInput.trim()) return;
    setContentVisibilityLoading(true); setContentVisibilityResult(null);
    try { const r = await apiFetchJSON(`${API}/ai/content-visibility`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) }); if (r.ok) setContentVisibilityResult(r); } catch {}
    setContentVisibilityLoading(false);
  }, [scanResult, kwInput]);

  /* -- BATCH 4: SERP & CTR CALLBACKS ------------------------------------ */
  const runCtrOptimizer = useCallback(async () => {
    if (!ctrTitle.trim()) return;
    setCtrOptimizerLoading(true); setCtrOptimizerResult(null);
    try { const r = await apiFetchJSON(`${API}/serp/ctr-optimizer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: ctrTitle, metaDescription: ctrMeta, keyword: ctrKeyword }) }); if (r.ok) setCtrOptimizerResult(r); } catch {}
    setCtrOptimizerLoading(false);
  }, [ctrTitle, ctrMeta, ctrKeyword]);

  const runIntentClassifier = useCallback(async () => {
    if (!intentKeyword.trim()) return;
    setIntentLoading(true); setIntentResult(null);
    try { const r = await apiFetchJSON(`${API}/serp/intent-classifier`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: intentKeyword }) }); if (r.ok) setIntentResult(r); } catch {}
    setIntentLoading(false);
  }, [intentKeyword]);

  const runSerpFeatureTargets = useCallback(async () => {
    if (!url.trim()) return;
    setSerpFeaturesLoading(true); setSerpFeaturesResult(null);
    try { const r = await apiFetchJSON(`${API}/serp/feature-targets`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim(), keyword: kwInput.trim() }) }); if (r.ok) setSerpFeaturesResult(r); } catch {}
    setSerpFeaturesLoading(false);
  }, [url, kwInput]);

  const runPaaGenerator = useCallback(async () => {
    if (!paaGenKeyword.trim()) return;
    setPaaGenLoading(true); setPaaGenResult(null);
    try { const r = await apiFetchJSON(`${API}/serp/paa-generator`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: paaGenKeyword, niche: paaGenNiche }) }); if (r.ok) setPaaGenResult(r); } catch {}
    setPaaGenLoading(false);
  }, [paaGenKeyword, paaGenNiche]);

  const runRichResultCheck = useCallback(async () => {
    if (!url.trim()) return;
    setRichResultCheckLoading(true); setRichResultCheckResult(null);
    try { const r = await apiFetchJSON(`${API}/serp/rich-result-check`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setRichResultCheckResult(r); } catch {}
    setRichResultCheckLoading(false);
  }, [url]);

  const runRankbrainAdvisor = useCallback(async () => {
    if (!url.trim()) return;
    setRankbrainLoading(true); setRankbrainResult(null);
    try { const r = await apiFetchJSON(`${API}/serp/rankbrain-advisor`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setRankbrainResult(r); } catch {}
    setRankbrainLoading(false);
  }, [url]);

  const runLongtailEmbed = useCallback(async () => {
    if (!longtailTitle.trim() || !longtailPrimary.trim()) return;
    setLongtailEmbedLoading(true); setLongtailEmbedResult(null);
    try { const r = await apiFetchJSON(`${API}/serp/longtail-embedder`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: longtailTitle, primaryKeyword: longtailPrimary }) }); if (r.ok) setLongtailEmbedResult(r); } catch {}
    setLongtailEmbedLoading(false);
  }, [longtailTitle, longtailPrimary]);

  const runMetaAbVariants = useCallback(async () => {
    if (!metaAbTitle.trim()) return;
    setMetaAbLoading(true); setMetaAbResult(null);
    try { const r = await apiFetchJSON(`${API}/serp/meta-ab-variants`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: metaAbTitle, keyword: metaAbKeyword }) }); if (r.ok) setMetaAbResult(r); } catch {}
    setMetaAbLoading(false);
  }, [metaAbTitle, metaAbKeyword]);

  const runDifficultyScore = useCallback(async () => {
    if (!diffKeyword.trim()) return;
    setDifficultyLoading(true); setDifficultyResult(null);
    try { const r = await apiFetchJSON(`${API}/serp/difficulty-score`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: diffKeyword, niche: diffNiche }) }); if (r.ok) setDifficultyResult(r); } catch {}
    setDifficultyLoading(false);
  }, [diffKeyword, diffNiche]);

  const runCompetitorSnapshot = useCallback(async () => {
    if (!snapKeyword.trim()) return;
    setCompetitorSnapshotLoading(true); setCompetitorSnapshotResult(null);
    try { const r = await apiFetchJSON(`${API}/serp/competitor-snapshot`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: snapKeyword, url: url.trim() }) }); if (r.ok) setCompetitorSnapshotResult(r); } catch {}
    setCompetitorSnapshotLoading(false);
  }, [snapKeyword, url]);

  /* -- BATCH 4: BACKLINK CALLBACKS --------------------------------------- */
  const runBacklinkOpps = useCallback(async () => {
    if (!backlinkNiche.trim()) return;
    setBacklinkOppsLoading(true); setBacklinkOppsResult(null);
    try { const r = await apiFetchJSON(`${API}/backlinks/opportunity-finder`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ niche: backlinkNiche, url: url.trim() }) }); if (r.ok) setBacklinkOppsResult(r); } catch {}
    setBacklinkOppsLoading(false);
  }, [backlinkNiche, url]);

  const runLinkGap = useCallback(async () => {
    if (!linkGapDomain.trim()) return;
    setLinkGapLoading(true); setLinkGapResult(null);
    try { const r = await apiFetchJSON(`${API}/backlinks/link-gap`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ yourDomain: linkGapDomain, competitor1: linkGapComp1, competitor2: linkGapComp2, niche: linkGapNiche }) }); if (r.ok) setLinkGapResult(r); } catch {}
    setLinkGapLoading(false);
  }, [linkGapDomain, linkGapComp1, linkGapComp2, linkGapNiche]);

  const runOutreachGenerator = useCallback(async () => {
    if (!outreachContentTitle.trim()) return;
    setOutreachLoading(true); setOutreachResult(null);
    try { const r = await apiFetchJSON(`${API}/backlinks/outreach-generator`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetSite: outreachTarget, contentTitle: outreachContentTitle, outreachType }) }); if (r.ok) setOutreachResult(r); } catch {}
    setOutreachLoading(false);
  }, [outreachTarget, outreachContentTitle, outreachType]);

  const runBestofFinder = useCallback(async () => {
    if (!bestofNiche.trim()) return;
    setBestofLoading(true); setBestofResult(null);
    try { const r = await apiFetchJSON(`${API}/backlinks/bestof-finder`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ niche: bestofNiche }) }); if (r.ok) setBestofResult(r); } catch {}
    setBestofLoading(false);
  }, [bestofNiche]);

  const runAnchorOptimizer = useCallback(async () => {
    if (!anchorOptKeyword.trim()) return;
    setAnchorOptLoading(true); setAnchorOptResult(null);
    try { const r = await apiFetchJSON(`${API}/backlinks/anchor-optimizer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetKeyword: anchorOptKeyword, url: url.trim() }) }); if (r.ok) setAnchorOptResult(r); } catch {}
    setAnchorOptLoading(false);
  }, [anchorOptKeyword, url]);

  const runLinkStrategy = useCallback(async () => {
    if (!linkStratNiche.trim()) return;
    setLinkStrategyLoading(true); setLinkStrategyResult(null);
    try { const r = await apiFetchJSON(`${API}/backlinks/strategy-builder`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ niche: linkStratNiche, monthlyBudget: linkStratBudget, domain: url.trim() }) }); if (r.ok) setLinkStrategyResult(r); } catch {}
    setLinkStrategyLoading(false);
  }, [linkStratNiche, linkStratBudget, url]);

  const runInternalSuggest = useCallback(async () => {
    if (!url.trim()) return;
    setInternalSuggestLoading(true); setInternalSuggestResult(null);
    try { const r = await apiFetchJSON(`${API}/backlinks/internal-suggester`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setInternalSuggestResult(r); } catch {}
    setInternalSuggestLoading(false);
  }, [url]);

  /* -- BATCH 4: CONTENT EXTRA CALLBACKS --------------------------------- */
  const runFreshnessScore = useCallback(async () => {
    if (!url.trim()) return;
    setFreshnessLoading(true); setFreshnessResult(null);
    try { const r = await apiFetchJSON(`${API}/content/freshness-score`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setFreshnessResult(r); } catch {}
    setFreshnessLoading(false);
  }, [url]);

  const runSkyscraperGap = useCallback(async () => {
    if (!url.trim()) return;
    setSkyscraperLoading(true); setSkyscraperResult(null);
    try { const r = await apiFetchJSON(`${API}/content/skyscraper-gap`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim(), keyword: skyscraperKeyword || kwInput.trim() }) }); if (r.ok) setSkyscraperResult(r); } catch {}
    setSkyscraperLoading(false);
  }, [url, skyscraperKeyword, kwInput]);

  const runRelunchAdvisor = useCallback(async () => {
    if (!url.trim()) return;
    setRelunchLoading(true); setRelunchResult(null);
    try { const r = await apiFetchJSON(`${API}/content/relaunch-advisor`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim(), keyword: relunchKeyword || kwInput.trim() }) }); if (r.ok) setRelunchResult(r); } catch {}
    setRelunchLoading(false);
  }, [url, relunchKeyword, kwInput]);

  const runSemanticEnrich = useCallback(async () => {
    if (!url.trim() && !semanticEnrichKeyword.trim()) return;
    setSemanticEnrichLoading(true); setSemanticEnrichResult(null);
    try { const r = await apiFetchJSON(`${API}/content/semantic-enrichment`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim(), keyword: semanticEnrichKeyword || kwInput.trim() }) }); if (r.ok) setSemanticEnrichResult(r); } catch {}
    setSemanticEnrichLoading(false);
  }, [url, semanticEnrichKeyword, kwInput]);

  /* -- BATCH 5: LOCAL SEO ------------------------------------------------ */
  const runGbpOptimizer = useCallback(async () => {
    if (!gbpBusiness.trim()) return;
    setGbpLoading(true); setGbpResult(null);
    try { const r = await apiFetchJSON(`${API}/local/gbp-optimizer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessName: gbpBusiness, location: gbpLocation, category: gbpCategory }) }); if (r.ok) setGbpResult(r); } catch {}
    setGbpLoading(false);
  }, [gbpBusiness, gbpLocation, gbpCategory]);

  const runCitationFinder = useCallback(async () => {
    if (!citationBusiness.trim()) return;
    setCitationLoading(true); setCitationResult(null);
    try { const r = await apiFetchJSON(`${API}/local/citation-finder`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessName: citationBusiness, location: citationLocation, category: citationCategory }) }); if (r.ok) setCitationResult(r); } catch {}
    setCitationLoading(false);
  }, [citationBusiness, citationLocation, citationCategory]);

  const runLocalKwGen = useCallback(async () => {
    if (!localKwService.trim() || !localKwCity.trim()) return;
    setLocalKwLoading(true); setLocalKwResult(null);
    try { const r = await apiFetchJSON(`${API}/local/local-keyword-gen`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ service: localKwService, city: localKwCity }) }); if (r.ok) setLocalKwResult(r); } catch {}
    setLocalKwLoading(false);
  }, [localKwService, localKwCity]);

  const runLocalSchema = useCallback(async () => {
    if (!localSchemaName.trim()) return;
    setLocalSchemaLoading(true); setLocalSchemaResult(null);
    try { const r = await apiFetchJSON(`${API}/local/local-schema`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessName: localSchemaName, address: localSchemaAddr, phone: localSchemaPhone }) }); if (r.ok) setLocalSchemaResult(r); } catch {}
    setLocalSchemaLoading(false);
  }, [localSchemaName, localSchemaAddr, localSchemaPhone]);

  /* -- BATCH 5: E-E-A-T & BRAND ------------------------------------------ */
  const runEeatScorer = useCallback(async () => {
    if (!url.trim()) return;
    setEeatLoading(true); setEeatResult(null);
    try { const r = await apiFetchJSON(`${API}/brand/eeat-scorer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setEeatResult(r); } catch {}
    setEeatLoading(false);
  }, [url]);

  const runAuthorBio = useCallback(async () => {
    if (!authorBioName.trim()) return;
    setAuthorBioLoading(true); setAuthorBioResult(null);
    try { const r = await apiFetchJSON(`${API}/brand/author-bio`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ authorName: authorBioName, niche: authorBioNiche, credentials: authorBioCredentials }) }); if (r.ok) setAuthorBioResult(r); } catch {}
    setAuthorBioLoading(false);
  }, [authorBioName, authorBioNiche, authorBioCredentials]);

  const runBrandSignals = useCallback(async () => {
    if (!brandSignalDomain.trim()) return;
    setBrandSignalLoading(true); setBrandSignalResult(null);
    try { const r = await apiFetchJSON(`${API}/brand/brand-signals`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain: brandSignalDomain, brandName: brandSignalName }) }); if (r.ok) setBrandSignalResult(r); } catch {}
    setBrandSignalLoading(false);
  }, [brandSignalDomain, brandSignalName]);

  const runExpertQuotes = useCallback(async () => {
    if (!expertQuoteTopic.trim()) return;
    setExpertQuoteLoading(true); setExpertQuoteResult(null);
    try { const r = await apiFetchJSON(`${API}/brand/expert-quotes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: expertQuoteTopic }) }); if (r.ok) setExpertQuoteResult(r); } catch {}
    setExpertQuoteLoading(false);
  }, [expertQuoteTopic]);

  const runTrustBuilder = useCallback(async () => {
    if (!url.trim()) return;
    setTrustBuilderLoading(true); setTrustBuilderResult(null);
    try { const r = await apiFetchJSON(`${API}/brand/trust-builder`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setTrustBuilderResult(r); } catch {}
    setTrustBuilderLoading(false);
  }, [url]);

  /* -- BATCH 5: VOICE & AI SEARCH ---------------------------------------- */
  const runVoiceOptimizer = useCallback(async () => {
    if (!voiceOptKeyword.trim()) return;
    setVoiceOptLoading(true); setVoiceOptResult(null);
    try { const r = await apiFetchJSON(`${API}/voice/voice-optimizer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: voiceOptKeyword }) }); if (r.ok) setVoiceOptResult(r); } catch {}
    setVoiceOptLoading(false);
  }, [voiceOptKeyword]);

  const runFaqGenerator = useCallback(async () => {
    if (!faqGenTopic.trim()) return;
    setFaqGenLoading(true); setFaqGenResult(null);
    try { const r = await apiFetchJSON(`${API}/voice/faq-generator`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: faqGenTopic }) }); if (r.ok) setFaqGenResult(r); } catch {}
    setFaqGenLoading(false);
  }, [faqGenTopic]);

  const runAiOverviewOptimizer = useCallback(async () => {
    if (!aiOverviewKeyword.trim()) return;
    setAiOverviewLoading(true); setAiOverviewResult(null);
    try { const r = await apiFetchJSON(`${API}/voice/ai-overview-optimizer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: aiOverviewKeyword, url: url.trim() }) }); if (r.ok) setAiOverviewResult(r); } catch {}
    setAiOverviewLoading(false);
  }, [aiOverviewKeyword, url]);

  const runConvKeywords = useCallback(async () => {
    if (!convKwTopic.trim()) return;
    setConvKwLoading(true); setConvKwResult(null);
    try { const r = await apiFetchJSON(`${API}/voice/conversational-keywords`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: convKwTopic }) }); if (r.ok) setConvKwResult(r); } catch {}
    setConvKwLoading(false);
  }, [convKwTopic]);

  /* -- BATCH 5: TECHNICAL+ EXTENSIONS ----------------------------------- */
  const runReadingLevel = useCallback(async () => {
    if (!url.trim()) return;
    setReadingLevelLoading(true); setReadingLevelResult(null);
    try { const r = await apiFetchJSON(`${API}/technical/reading-level`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setReadingLevelResult(r); } catch {}
    setReadingLevelLoading(false);
  }, [url]);

  const runTfidf = useCallback(async () => {
    if (!tfidfKeyword.trim()) return;
    setTfidfLoading(true); setTfidfResult(null);
    try { const r = await apiFetchJSON(`${API}/technical/tfidf-analyzer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: tfidfKeyword, url: url.trim() }) }); if (r.ok) setTfidfResult(r); } catch {}
    setTfidfLoading(false);
  }, [tfidfKeyword, url]);

  const runContentLength = useCallback(async () => {
    if (!contentLengthKw.trim()) return;
    setContentLengthLoading(true); setContentLengthResult(null);
    try { const r = await apiFetchJSON(`${API}/technical/content-length-advisor`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: contentLengthKw, currentWordCount: contentLengthWc }) }); if (r.ok) setContentLengthResult(r); } catch {}
    setContentLengthLoading(false);
  }, [contentLengthKw, contentLengthWc]);

  const runCwvAdvisor = useCallback(async () => {
    if (!url.trim()) return;
    setCwvLoading(true); setCwvResult(null);
    try { const r = await apiFetchJSON(`${API}/technical/cwv-advisor`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setCwvResult(r); } catch {}
    setCwvLoading(false);
  }, [url]);

  const runPageSpeed = useCallback(async () => {
    if (!url.trim()) return;
    setPageSpeedLoading(true); setPageSpeedResult(null);
    try { const r = await apiFetchJSON(`${API}/technical/page-speed-advisor`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setPageSpeedResult(r); } catch {}
    setPageSpeedLoading(false);
  }, [url]);

  /* -- BATCH 5: CONTENT+ EXTENSIONS -------------------------------------- */
  const runTopicCluster = useCallback(async () => {
    if (!topicClusterSeed.trim()) return;
    setTopicClusterLoading(true); setTopicClusterResult(null);
    try { const r = await apiFetchJSON(`${API}/content/topic-cluster-builder`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ seed: topicClusterSeed }) }); if (r.ok) setTopicClusterResult(r); } catch {}
    setTopicClusterLoading(false);
  }, [topicClusterSeed]);

  const runVisualDiv = useCallback(async () => {
    if (!url.trim()) return;
    setVisualDivLoading(true); setVisualDivResult(null);
    try { const r = await apiFetchJSON(`${API}/content/visual-diversity`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setVisualDivResult(r); } catch {}
    setVisualDivLoading(false);
  }, [url]);

  const runTimeToValue = useCallback(async () => {
    if (!url.trim()) return;
    setTimeToValueLoading(true); setTimeToValueResult(null);
    try { const r = await apiFetchJSON(`${API}/content/time-to-value`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setTimeToValueResult(r); } catch {}
    setTimeToValueLoading(false);
  }, [url]);

  const runPruning = useCallback(async () => {
    if (!url.trim() && !pruningNiche.trim()) return;
    setPruningLoading(true); setPruningResult(null);
    try { const r = await apiFetchJSON(`${API}/content/content-pruning`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ siteUrl: url.trim(), niche: pruningNiche }) }); if (r.ok) setPruningResult(r); } catch {}
    setPruningLoading(false);
  }, [url, pruningNiche]);

  const runStatsCurator = useCallback(async () => {
    if (!statsCuratorNiche.trim()) return;
    setStatsCuratorLoading(true); setStatsCuratorResult(null);
    try { const r = await apiFetchJSON(`${API}/content/statistics-curator`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ niche: statsCuratorNiche }) }); if (r.ok) setStatsCuratorResult(r); } catch {}
    setStatsCuratorLoading(false);
  }, [statsCuratorNiche]);

  /* -- BATCH 5: KEYWORDS EXTENSIONS -------------------------------------- */
  const runLowDiff = useCallback(async () => {
    if (!lowDiffSeed.trim()) return;
    setLowDiffLoading(true); setLowDiffResult(null);
    try { const r = await apiFetchJSON(`${API}/keywords/low-difficulty-finder`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ seedKeyword: lowDiffSeed, siteDA: lowDiffDA }) }); if (r.ok) setLowDiffResult(r); } catch {}
    setLowDiffLoading(false);
  }, [lowDiffSeed, lowDiffDA]);

  const runCannibalization = useCallback(async () => {
    if (!cannibalDomain.trim()) return;
    setCannibalLoading(true); setCannibalResult(null);
    try { const r = await apiFetchJSON(`${API}/keywords/cannibalization-detector`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain: cannibalDomain }) }); if (r.ok) setCannibalResult(r); } catch {}
    setCannibalLoading(false);
  }, [cannibalDomain]);

  /* -- BATCH 6: SERP & CTR EXTENSIONS ----------------------------------- */
  const runNewsSeo = useCallback(async () => {
    if (!url.trim()) return;
    setNewsSeoLoading(true); setNewsSeoResult(null);
    try { const r = await apiFetchJSON(`${API}/serp/news-seo`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setNewsSeoResult(r); } catch {}
    setNewsSeoLoading(false);
  }, [url]);

  const runVideoSeo = useCallback(async () => {
    if (!url.trim() && !videoSeoKw.trim()) return;
    setVideoSeoLoading(true); setVideoSeoResult(null);
    try { const r = await apiFetchJSON(`${API}/serp/video-seo`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim(), videoKeyword: videoSeoKw.trim() }) }); if (r.ok) setVideoSeoResult(r); } catch {}
    setVideoSeoLoading(false);
  }, [url, videoSeoKw]);

  const runEntityOpt = useCallback(async () => {
    if (!entityOptKw.trim() && !entityOptName.trim()) return;
    setEntityOptLoading(true); setEntityOptResult(null);
    try { const r = await apiFetchJSON(`${API}/serp/entity-optimizer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: entityOptKw, entityName: entityOptName, url: url.trim() }) }); if (r.ok) setEntityOptResult(r); } catch {}
    setEntityOptLoading(false);
  }, [entityOptKw, entityOptName, url]);

  const runReviewSchema6 = useCallback(async () => {
    if (!url.trim() && !reviewSchemaProduct.trim()) return;
    setReviewSchemaLoading(true); setReviewSchemaResult(null);
    try { const r = await apiFetchJSON(`${API}/serp/review-schema`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim(), productName: reviewSchemaProduct }) }); if (r.ok) setReviewSchemaResult(r); } catch {}
    setReviewSchemaLoading(false);
  }, [url, reviewSchemaProduct]);

  const runEventSchemaSeo = useCallback(async () => {
    if (!eventSchemaName.trim()) return;
    setEventSchemaLoading(true); setEventSchemaResult(null);
    try { const r = await apiFetchJSON(`${API}/serp/event-schema`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventName: eventSchemaName, eventDate: eventSchemaDate, eventLocation: eventSchemaLocation }) }); if (r.ok) setEventSchemaResult(r); } catch {}
    setEventSchemaLoading(false);
  }, [eventSchemaName, eventSchemaDate, eventSchemaLocation]);

  /* -- BATCH 6: SCHEMA & LINKS EXTENSIONS ------------------------------- */
  const runRedirectAudit = useCallback(async () => {
    if (!url.trim()) return;
    setRedirectAuditLoading(true); setRedirectAuditResult(null);
    try { const r = await apiFetchJSON(`${API}/schema/redirect-audit`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setRedirectAuditResult(r); } catch {}
    setRedirectAuditLoading(false);
  }, [url]);

  const runDupContent = useCallback(async () => {
    if (!url.trim()) return;
    setDupContentLoading(true); setDupContentResult(null);
    try { const r = await apiFetchJSON(`${API}/schema/duplicate-content`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setDupContentResult(r); } catch {}
    setDupContentLoading(false);
  }, [url]);

  const runHreflangAdvisor = useCallback(async () => {
    if (!url.trim()) return;
    setHreflangLoading(true); setHreflangResult(null);
    try { const r = await apiFetchJSON(`${API}/schema/hreflang`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim(), targetMarkets: hreflangMarkets }) }); if (r.ok) setHreflangResult(r); } catch {}
    setHreflangLoading(false);
  }, [url, hreflangMarkets]);

  const runMobileSeoAdvisor = useCallback(async () => {
    if (!url.trim()) return;
    setMobileSeoLoading(true); setMobileSeoResult(null);
    try { const r = await apiFetchJSON(`${API}/schema/mobile-seo`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setMobileSeoResult(r); } catch {}
    setMobileSeoLoading(false);
  }, [url]);

  /* -- BATCH 6: BACKLINKS EXTENSIONS ------------------------------------ */
  const runLinkGapV2 = useCallback(async () => {
    if (!linkGapDomain.trim()) return;
    setLinkGapLoading(true); setLinkGapResult(null);
    try { const r = await apiFetchJSON(`${API}/backlinks/link-gap`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain: linkGapDomain, competitors: linkGapCompetitors, niche: backlinkNiche }) }); if (r.ok) setLinkGapResult(r); } catch {}
    setLinkGapLoading(false);
  }, [linkGapDomain, linkGapCompetitors, backlinkNiche]);

  const runBrokenBacklinks = useCallback(async () => {
    if (!brokenBacklinksDomain.trim()) return;
    setBrokenBacklinksLoading(true); setBrokenBacklinksResult(null);
    try { const r = await apiFetchJSON(`${API}/backlinks/broken-backlinks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain: brokenBacklinksDomain, niche: backlinkNiche }) }); if (r.ok) setBrokenBacklinksResult(r); } catch {}
    setBrokenBacklinksLoading(false);
  }, [brokenBacklinksDomain, backlinkNiche]);

  const runAnchorText = useCallback(async () => {
    if (!anchorTextDomain.trim()) return;
    setAnchorTextLoading(true); setAnchorTextResult(null);
    try { const r = await apiFetchJSON(`${API}/backlinks/anchor-text`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain: anchorTextDomain, niche: backlinkNiche }) }); if (r.ok) setAnchorTextResult(r); } catch {}
    setAnchorTextLoading(false);
  }, [anchorTextDomain, backlinkNiche]);

  const runLinkVelocity = useCallback(async () => {
    if (!linkVelocityDomain.trim()) return;
    setLinkVelocityLoading(true); setLinkVelocityResult(null);
    try { const r = await apiFetchJSON(`${API}/backlinks/link-velocity`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain: linkVelocityDomain, currentLinksPerMonth: linkVelocityRate, niche: backlinkNiche }) }); if (r.ok) setLinkVelocityResult(r); } catch {}
    setLinkVelocityLoading(false);
  }, [linkVelocityDomain, linkVelocityRate, backlinkNiche]);

  /* -- BATCH 6: A/B & REFRESH ------------------------------------------- */
  const runAbTest = useCallback(async () => {
    if (!url.trim()) return;
    setAbTestLoading(true); setAbTestResult(null);
    try { const r = await apiFetchJSON(`${API}/ab/ab-test-advisor`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setAbTestResult(r); } catch {}
    setAbTestLoading(false);
  }, [url]);

  const runContentRefresh = useCallback(async () => {
    if (!url.trim()) return;
    setContentRefreshLoading(true); setContentRefreshResult(null);
    try { const r = await apiFetchJSON(`${API}/ab/content-refresh`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setContentRefreshResult(r); } catch {}
    setContentRefreshLoading(false);
  }, [url]);

  const runTitleVariants = useCallback(async () => {
    if (!titleVariantsInput.trim() && !titleVariantsKw.trim()) return;
    setTitleVariantsLoading(true); setTitleVariantsResult(null);
    try { const r = await apiFetchJSON(`${API}/ab/title-variants`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentTitle: titleVariantsInput, keyword: titleVariantsKw }) }); if (r.ok) setTitleVariantsResult(r); } catch {}
    setTitleVariantsLoading(false);
  }, [titleVariantsInput, titleVariantsKw]);

  const runMetaVariants = useCallback(async () => {
    if (!url.trim() && !metaVariantsKw.trim()) return;
    setMetaVariantsLoading(true); setMetaVariantsResult(null);
    try { const r = await apiFetchJSON(`${API}/ab/meta-variants`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim(), keyword: metaVariantsKw }) }); if (r.ok) setMetaVariantsResult(r); } catch {}
    setMetaVariantsLoading(false);
  }, [url, metaVariantsKw]);

  const runBertOpt = useCallback(async () => {
    if (!bertOptKw.trim()) return;
    setBertOptLoading(true); setBertOptResult(null);
    try { const r = await apiFetchJSON(`${API}/ab/bert-optimizer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: bertOptKw, url: url.trim() }) }); if (r.ok) setBertOptResult(r); } catch {}
    setBertOptLoading(false);
  }, [bertOptKw, url]);

  const runSecondaryKwFinder = useCallback(async () => {
    setSecondaryKwLoading(true); setSecondaryKwResult(null);
    try { const r = await apiFetchJSON(`${API}/ab/secondary-keywords`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ primaryKeyword: secondaryKwInput, url: url.trim() }) }); if (r.ok) setSecondaryKwResult(r); } catch {}
    setSecondaryKwLoading(false);
  }, [secondaryKwInput, url]);

  const runKnowledgeGraph = useCallback(async () => {
    if (!knowledgeGraphEntity.trim()) return;
    setKnowledgeGraphLoading(true); setKnowledgeGraphResult(null);
    try { const r = await apiFetchJSON(`${API}/ab/knowledge-graph`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entityName: knowledgeGraphEntity, domain: url.trim(), industry: knowledgeGraphIndustry }) }); if (r.ok) setKnowledgeGraphResult(r); } catch {}
    setKnowledgeGraphLoading(false);
  }, [knowledgeGraphEntity, url, knowledgeGraphIndustry]);

  /* -- BATCH 6: TECHNICAL+ FURTHER EXTENSIONS --------------------------- */
  const runCrawlBudget = useCallback(async () => {
    if (!url.trim()) return;
    setCrawlBudgetLoading(true); setCrawlBudgetResult(null);
    try { const r = await apiFetchJSON(`${API}/technical/crawl-budget`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setCrawlBudgetResult(r); } catch {}
    setCrawlBudgetLoading(false);
  }, [url]);

  const runClickDepth = useCallback(async () => {
    if (!url.trim()) return;
    setClickDepthLoading(true); setClickDepthResult(null);
    try { const r = await apiFetchJSON(`${API}/technical/click-depth`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setClickDepthResult(r); } catch {}
    setClickDepthLoading(false);
  }, [url]);

  const runLogFile = useCallback(async () => {
    if (!logSnippet.trim() && !url.trim()) return;
    setLogFileLoading(true); setLogFileResult(null);
    try { const r = await apiFetchJSON(`${API}/technical/log-file`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ logSnippet: logSnippet.trim(), domain: url.trim() }) }); if (r.ok) setLogFileResult(r); } catch {}
    setLogFileLoading(false);
  }, [logSnippet, url]);

  const runIntlSeo = useCallback(async () => {
    if (!url.trim() && !intlSeoMarkets.trim()) return;
    setIntlSeoLoading(true); setIntlSeoResult(null);
    try { const r = await apiFetchJSON(`${API}/technical/international-seo`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim(), targetMarkets: intlSeoMarkets }) }); if (r.ok) setIntlSeoResult(r); } catch {}
    setIntlSeoLoading(false);
  }, [url, intlSeoMarkets]);

  const runRewrite = useCallback(async (field) => {
    if (!scanResult) return;
    setRewriteField(field); setRewriteLoading(true); setRewriteResult(null);
    try {
      const currentValue = field === "title" ? scanResult.title : field === "metaDescription" ? scanResult.metaDescription : scanResult.h1;
      const r = await apiFetchJSON(`${API}/ai/rewrite`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ field, currentValue, keywords: kwInput, url: scanResult.url }) });
      if (r.ok) setRewriteResult(r.structured || JSON.parse(r.suggestions));
    } catch {}
    setRewriteLoading(false);
  }, [scanResult, kwInput]);

  /* -- KEYWORDS ----------------------------------------------------------- */
  const runKwResearch = useCallback(async () => {
    if (!seedKw.trim()) return;
    setKwLoading(true); setKwErr(""); setKwResearch(null);
    try {
      const r = await apiFetchJSON(`${API}/ai/keyword-research`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ seedKeyword: seedKw.trim(), niche: kwNiche.trim() || undefined }) });
      if (!r.ok) throw new Error(r.error || "Failed");
      setKwResearch(r.structured || JSON.parse(r.research));
    } catch (e) { setKwErr(e.message); }
    setKwLoading(false);
  }, [seedKw, kwNiche]);

  /* -- CONTENT BRIEF ------------------------------------------------------ */
  const runBrief = useCallback(async () => {
    if (!briefTopic.trim() && !briefPrimary.trim()) return;
    setBriefLoading(true); setBriefErr(""); setBriefResult(null);
    try {
      const r = await apiFetchJSON(`${API}/ai/content-brief`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: briefTopic.trim(), primaryKeyword: briefPrimary.trim(), secondaryKeywords: briefSecondary.split(",").map(s => s.trim()).filter(Boolean) }) });
      if (!r.ok) throw new Error(r.error || "Failed");
      setBriefResult(r.structured || JSON.parse(r.brief));
    } catch (e) { setBriefErr(e.message); }
    setBriefLoading(false);
  }, [briefTopic, briefPrimary, briefSecondary]);

  /* -- BULK SCAN ---------------------------------------------------------- */
  const runBulk = useCallback(async () => {
    const urls = bulkUrls.split("\n").map(u => u.trim()).filter(Boolean);
    if (!urls.length) return;
    setBulkLoading(true); setBulkErr(""); setBulkResult(null);
    try {
      const r = await apiFetchJSON(`${API}/bulk-analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ urls, keywords: bulkKw.trim() }) });
      if (!r.ok) throw new Error(r.error || "Failed");
      setBulkResult(r);
    } catch (e) { setBulkErr(e.message); }
    setBulkLoading(false);
  }, [bulkUrls, bulkKw]);

  /* -- AI CHAT ------------------------------------------------------------ */
  const sendChat = useCallback(async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: "user", content: chatInput.trim() };
    setChatMessages(p => [...p, userMsg]);
    setChatInput(""); setChatLoading(true);
    try {
      const r = await apiFetchJSON(`${API}/ai/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [...chatMessages, userMsg] }) });
      if (r.ok && r.reply) setChatMessages(p => [...p, { role: "assistant", content: r.reply }]);
    } catch {}
    setChatLoading(false);
    setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" }), 100);
  }, [chatInput, chatMessages]);

  /* -- HISTORY ------------------------------------------------------------ */
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const r = await apiFetchJSON(`${API}/items`);
      if (r.ok) setHistory(r.items || []);
    } catch {}
    setHistoryLoading(false);
  }, []);

  const deleteHistory = useCallback(async (id) => {
    try { await apiFetch(`${API}/items/${id}`, { method: "DELETE" }); } catch {}
    setHistory(p => p.filter(h => h.id !== id));
  }, []);

  useEffect(() => { if (tab === "History" || section === "History") loadHistory(); }, [tab, section]);

  /* -- Fetch Shopify store data on mount -- */
  useEffect(() => {
    (async () => {
      setShopifyLoading(true);
      try {
        const resp = await apiFetch(`${API}/shopify-data`);
        if (resp.ok) {
          const r = await resp.json();
          setShopifyArticles(r.articles || []);
          setShopifyProducts(r.products || []);
          setShopDomain(r.shop || "");
          if (r.shop) {
            const storeUrl = `https://${r.shop}`;
            setOrgUrl(prev => prev || storeUrl);
          }
        }
      } catch {}
      setShopifyLoading(false);
    })();
  }, []);

  /* -- Auto-fill all fields from selected Shopify article -- */
  const handleArticleSelect = useCallback((articleId) => {
    setSelectedArticleId(articleId);
    setSelectedProductId("");
    if (!articleId) return;
    const art = shopifyArticles.find(a => String(a.id) === String(articleId));
    if (!art) return;
    const tags = art.tags ? art.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const primaryKw = tags[0] || art.title;
    const extraKws = tags.slice(1).join(', ');

    // Analyzer tab
    setUrl(art.url);
    setKwInput(tags.join(', '));

    // Keywords tab � seed from article title, niche from blog
    setSeedKw(art.title);
    setKwNiche(art.blogTitle || '');

    // Content Brief tab
    setBriefTopic(art.title);
    setBriefPrimary(primaryKw);
    setBriefSecondary(extraKws);

    // Keyword+ and intent tabs
    setIntentKeyword(primaryKw);
    setTopicalKw(primaryKw);
    setPaaKw(primaryKw);
    setSecondaryKwInput(art.title);

    // Bulk Scan tab � add article URL
    setBulkUrls(prev => prev ? prev + '\n' + art.url : art.url);

    // Schema/org tab � use shop domain as org URL
    if (shopDomain) setOrgUrl(`https://${shopDomain}`);
    if (!orgName && shopDomain) setOrgName(shopDomain.replace('.myshopify.com', ''));
  }, [shopifyArticles, shopDomain, orgName]);


  const issues = scanResult?.scored?.issues || [];
  const filteredIssues = issues.filter(i => (filterCat === "all" || i.cat === filterCat) && (filterSev === "all" || i.sev === filterSev));

  /* -- RENDER ------------------------------------------------------------ */
  const activeSec = section ? SECTIONS.find(s => s.id === section) : null;
  return (
    <div style={S.page}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={S.topBar}>
        <BackButton />
        <span style={S.title}>Blog SEO Engine</span>
        {activeSec && <><span style={{ color: "#3f3f46", fontSize: 18 }}>�</span><span style={{ ...S.title, fontWeight: 500 }}>{activeSec.icon} {activeSec.title}</span></>}
        <span style={S.badge}>AI-Powered</span>
      </div>

      <div style={S.body}>

        {/* ================================================================
            HOME DASHBOARD (section === null)
            ================================================================ */}
        {!section && (
          <>
            <div style={{ padding: "20px 0 8px" }}>

              {/* -- Shopify connection status -- */}
              {shopifyLoading ? (
                <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#71717a", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={S.spinner} /> Loading your store data�
                </div>
              ) : shopDomain ? (
                <div style={{ background: "#0c1a0c", border: "1px solid #14532d", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#86efac", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <span>? Connected to <strong>{shopDomain}</strong> � {shopifyArticles.length > 0 ? `${shopifyArticles.length} blog posts` : "no blog posts yet"} � {shopifyProducts.length} products ready to use</span>
                </div>
              ) : (
                <div style={{ background: "#1c1007", border: "1px solid #92400e", borderRadius: 10, padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#fbbf24", marginBottom: 3 }}>?? Shopify store not connected</div>
                    <div style={{ fontSize: 12, color: "#d97706" }}>Without a connection, you'll need to manually type URLs and keywords. Connect your store and everything fills in automatically.</div>
                  </div>
                  <a href="#settings" style={{ ...S.btn("primary"), textDecoration: "none", fontSize: 12, padding: "8px 16px", whiteSpace: "nowrap" }}
                    onClick={() => { /* navigate to settings if possible */ }}>Connect in Settings ?</a>
                </div>
              )}

              {/* -- Beginner / Advanced toggle -- */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#fafafa", marginBottom: 2 }}>
                    {mode === "beginner" ? "?? Welcome! Pick a tool to get started." : "??? Advanced Mode � all tools"}
                  </div>
                  <div style={{ fontSize: 13, color: "#71717a" }}>
                    {mode === "beginner" ? "Everything is auto-filled from your store � just click and go." : "Full access to all SEO tools including technical, schema and backlink analysis."}
                  </div>
                </div>
                <div style={{ display: "flex", background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: 4, gap: 4, flexShrink: 0 }}>
                  <button
                    style={{ padding: "7px 18px", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", transition: "all .15s",
                      background: mode === "beginner" ? "#4f46e5" : "transparent",
                      color: mode === "beginner" ? "#fff" : "#71717a" }}
                    onClick={() => setModePersist("beginner")}
                  >?? Beginner</button>
                  <button
                    style={{ padding: "7px 18px", borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", transition: "all .15s",
                      background: mode === "advanced" ? "#7c3aed" : "transparent",
                      color: mode === "advanced" ? "#fff" : "#71717a" }}
                    onClick={() => setModePersist("advanced")}
                  >? Advanced</button>
                </div>
              </div>

              {/* -- Section cards -- */}
              {mode === "beginner" ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 12 }}>
                  {SECTIONS.filter(s => s.level === "beginner").map(s => (
                    <div key={s.id} style={{ ...S.card, cursor: "pointer", borderLeft: `4px solid ${s.color}` }}
                      onClick={() => { setSection(s.id); setTab(s.tabs[0]); }}>
                      <div style={{ fontSize: 28, marginBottom: 10 }}>{s.icon}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#fafafa", marginBottom: 6 }}>{s.title}</div>
                      <div style={{ fontSize: 13, color: "#71717a", lineHeight: 1.55 }}>{s.desc}</div>
                      <div style={{ marginTop: 14, fontSize: 12, color: s.color, fontWeight: 600 }}>Open ?</div>
                    </div>
                  ))}
                  {/* Teaser for advanced mode */}
                  <div style={{ ...S.card, borderLeft: "4px solid #374151", cursor: "pointer", opacity: 0.7 }}
                    onClick={() => setModePersist("advanced")}>
                    <div style={{ fontSize: 28, marginBottom: 10 }}>?</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#fafafa", marginBottom: 6 }}>More Tools</div>
                    <div style={{ fontSize: 13, color: "#71717a", lineHeight: 1.55 }}>Technical SEO, schema, backlinks, A/B testing and more. Switch to Advanced mode to unlock.</div>
                    <div style={{ marginTop: 14, fontSize: 12, color: "#7c3aed", fontWeight: 600 }}>Switch to Advanced ?</div>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#71717a", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 10 }}>Beginner Tools</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10, marginBottom: 24 }}>
                    {SECTIONS.filter(s => s.level === "beginner").map(s => (
                      <div key={s.id} style={{ ...S.card, cursor: "pointer", borderLeft: `4px solid ${s.color}`, padding: "14px 16px" }}
                        onClick={() => { setSection(s.id); setTab(s.tabs[0]); }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 22 }}>{s.icon}</span>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#fafafa" }}>{s.title}</div>
                            <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>{s.desc.slice(0, 60)}�</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 10 }}>? Advanced Tools</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                    {SECTIONS.filter(s => s.level === "advanced").map(s => (
                      <div key={s.id} style={{ ...S.card, cursor: "pointer", borderLeft: `4px solid ${s.color}`, padding: "14px 16px" }}
                        onClick={() => { setSection(s.id); setTab(s.tabs[0]); }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 22 }}>{s.icon}</span>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#fafafa" }}>{s.title}</div>
                            <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>{s.desc.slice(0, 60)}�</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* ================================================================
            SECTION VIEW (section !== null)
            ================================================================ */}
        {activeSec && (
          <>
            {/* -- Section header bar -- */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 0 10px", borderBottom: "1px solid #27272a", marginBottom: 12, flexWrap: "wrap" }}>
              <button style={{ ...S.btn(), padding: "6px 14px", fontSize: 13 }} onClick={() => setSection(null)}>? All Tools</button>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{activeSec.icon} {activeSec.title}</span>
              {/* Sub-tabs: only shown when section has multiple tabs */}
              {activeSec.tabs.length > 1 && activeSec.tabs.map(t => (
                <div key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>{activeSec.tabLabels?.[t] || t}</div>
              ))}
            </div>

            {/* -- Shopify article picker -- */}
            {shopifyArticles.length > 0 && (
              <div style={{ ...S.card, borderColor: "#4f46e5", marginBottom: 16 }}>
                <div style={{ ...S.cardTitle, marginBottom: 8, fontSize: 13 }}>
                  ??? Auto-fill from your store&nbsp;
                  <span style={{ fontSize: 12, fontWeight: 400, color: "#71717a" }}>� pick a post to fill in all fields below</span>
                </div>
                <div style={S.row}>
                  <select style={{ ...S.input, flex: 2 }} value={selectedArticleId} onChange={e => handleArticleSelect(e.target.value)}>
                    <option value="">� Select a blog post �</option>
                    {shopifyArticles.map(a => (
                      <option key={a.id} value={String(a.id)}>[{a.blogTitle}] {a.title}</option>
                    ))}
                  </select>
                  {selectedArticleId && (
                    <button style={S.btn()} onClick={() => { setSelectedArticleId(""); setSelectedProductId(""); setUrl(""); setKwInput(""); setSeedKw(""); setBriefTopic(""); }}>? Clear</button>
                  )}
                </div>
                {selectedArticleId && (() => {
                  const art = shopifyArticles.find(a => String(a.id) === selectedArticleId);
                  return art ? (
                    <div style={{ marginTop: 8, fontSize: 12, color: "#a1a1aa", display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <span>? URL set</span>
                      {art.tags && <span>? Keywords: <span style={{ color: "#d4d4d8" }}>{art.tags}</span></span>}
                      {art.author && <span>Author: {art.author}</span>}
                    </div>
                  ) : null;
                })()}
                {shopifyProducts.length > 0 && !selectedArticleId && (
                  <div style={{ marginTop: 10, borderTop: "1px solid #27272a", paddingTop: 10 }}>
                    <div style={{ fontSize: 12, color: "#71717a", marginBottom: 6 }}>?? Or use a product as keyword seed:</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {shopifyProducts.slice(0, 10).map(p => {
                        const isSelected = selectedProductId === p.id;
                        return (
                          <button key={p.id}
                            style={{ ...S.btn(isSelected ? "primary" : undefined), fontSize: 11, padding: "4px 10px", border: isSelected ? "1px solid #a78bfa" : "1px solid #3f3f46", background: isSelected ? "#4c1d95" : "#27272a", color: isSelected ? "#ede9fe" : "#d4d4d8" }}
                            onClick={() => {
                              setSelectedProductId(p.id);
                              setSelectedArticleId("");
                              setSeedKw(p.title);
                              setKwInput(p.title + (p.tags ? ', ' + p.tags : ''));
                              setIntentKeyword(p.title);
                              setTopicalKw(p.title);
                              setPaaKw(p.title);
                              setBriefTopic(p.title);
                              setBriefPrimary(p.title);
                              if (shopDomain && p.handle) setUrl(`https://${shopDomain}/products/${p.handle}`);
                            }}
                          >{isSelected ? "? " : ""}{p.title}</button>
                        );
                      })}
                    </div>
                    {selectedProductId && (() => {
                      const sp = shopifyProducts.find(p => p.id === selectedProductId);
                      return sp ? (
                        <div style={{ marginTop: 8, fontSize: 12, color: "#a1a1aa", display: "flex", gap: 16, flexWrap: "wrap" }}>
                          <span style={{ color: "#86efac" }}>? Keywords seeded from <strong style={{ color: "#bbf7d0" }}>{sp.title}</strong></span>
                          {sp.tags && <span>Tags: <span style={{ color: "#d4d4d8" }}>{sp.tags}</span></span>}
                          {shopDomain && sp.handle && <span>URL: <span style={{ color: "#d4d4d8" }}>/{sp.handle}</span></span>}
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            )}

        {/* ================================================================
            ANALYZER TAB
            ================================================================ */}
        {tab === "Analyzer" && (
          <>
            {/* URL input */}
            <div style={{ ...S.card, marginTop: 16 }}>
              <div style={S.cardTitle}>?? Analyze Blog Post</div>
              <div style={{ ...S.row, marginBottom: 10 }}>
                <input style={S.input} placeholder="Enter blog post URL (e.g. https://yourstore.com/blogs/news/post-title)" value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && !scanning && runScan()} />
              </div>
              <div style={{ ...S.row, marginBottom: 10 }}>
                <input style={{ ...S.input, maxWidth: 400 }} placeholder="Target keywords (comma-separated)" value={kwInput} onChange={e => setKwInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !scanning && runScan()} />
                <button style={S.btn("primary")} onClick={runScan} disabled={scanning || !url.trim()}>
                  {scanning ? <><span style={S.spinner} /> Scanning�</> : "Analyze"}
                </button>
              </div>
            </div>

            {scanErr && <div style={S.err}>{scanErr}</div>}

            {scanning && (
              <div style={S.empty}><span style={S.spinner} /><div style={{ marginTop: 12 }}>Crawling and analyzing blog post�</div></div>
            )}

            {/* -- RESULTS -- */}
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
                  <ToggleSection title="?? SERP Preview" open={showSerp} toggle={() => setShowSerp(p => !p)} />
                  {showSerp && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ ...S.row, gap: 8, marginBottom: 14 }}>
                        {["desktop", "mobile"].map(d => (
                          <button key={d} style={S.tab(serpDevice === d)} onClick={() => setSerpDevice(d)}>{d === "desktop" ? "?? Desktop" : "?? Mobile"}</button>
                        ))}
                      </div>
                      {/* Google result mock */}
                      <div style={{ background: "#fff", borderRadius: 10, padding: "16px 20px", maxWidth: serpDevice === "mobile" ? 360 : 620, fontFamily: "Arial, sans-serif" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#e8e8e8", flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: 12, color: "#202124", fontWeight: 500 }}>{(() => { try { return new URL(scanResult.url).hostname; } catch { return scanResult.url; } })()}</div>
                            <div style={{ fontSize: 12, color: "#4d5156" }}>{(() => { try { const u = new URL(scanResult.url); return u.hostname + u.pathname; } catch { return "�"; } })()}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: serpDevice === "mobile" ? 16 : 20, color: "#1a0dab", fontWeight: 400, lineHeight: 1.3, marginBottom: 2, textDecoration: "underline", cursor: "pointer" }}>
                          {(scanResult.title || "").slice(0, 60)}{(scanResult.title || "").length > 60 ? "�" : ""}
                        </div>
                        <div style={{ fontSize: 14, color: "#4d5156", lineHeight: 1.57 }}>
                          {(scanResult.metaDescription || "(no meta description � Google will pull an excerpt)").slice(0, 160)}{(scanResult.metaDescription || "").length > 160 ? "�" : ""}
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
                              {value > max && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 3 }}>?? Truncated � cut {value - max} chars</div>}
                              {value < min && value > 0 && <div style={{ fontSize: 11, color: "#eab308", marginTop: 3 }}>?? Too short � add {min - value} more chars</div>}
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
                    {aiAnalyzing ? <><span style={S.spinner} /> Analyzing�</> : "?? AI Deep Analysis (1 credit)"}
                  </button>
                  <button style={S.btn()} onClick={() => runRewrite("title")}>?? AI Rewrite Title</button>
                  <button style={S.btn()} onClick={() => runRewrite("metaDescription")}>?? AI Rewrite Description</button>
                  <button style={S.btn()} onClick={() => runRewrite("h1")}>?? AI Rewrite H1</button>
                </div>

                {/* AI Analysis results */}
                {aiAnalysis && (
                  <div style={S.card}>
                    <div style={S.cardTitle}>?? AI Analysis</div>
                    {aiAnalysis.assessment && <div style={{ fontSize: 14, color: "#d4d4d8", marginBottom: 12, lineHeight: 1.6 }}>{aiAnalysis.assessment}</div>}
                    {aiAnalysis.strengths?.length > 0 && (
                      <div style={S.section}><div style={S.heading}>? Strengths</div>{aiAnalysis.strengths.map((s, i) => <div key={i} style={{ fontSize: 13, color: "#86efac", marginBottom: 4 }}>� {s}</div>)}</div>
                    )}
                    {aiAnalysis.weaknesses?.length > 0 && (
                      <div style={S.section}><div style={S.heading}>?? Weaknesses</div>{aiAnalysis.weaknesses.map((s, i) => <div key={i} style={{ fontSize: 13, color: "#fbbf24", marginBottom: 4 }}>� {s}</div>)}</div>
                    )}
                    {aiAnalysis.recommendations?.length > 0 && (
                      <div style={S.section}><div style={S.heading}>?? Recommendations</div>
                        {aiAnalysis.recommendations.map((r, i) => (
                          <div key={i} style={{ ...S.issueRow, flexDirection: "column", alignItems: "flex-start" }}>
                            <div><span style={S.pill(r.priority === "critical" ? "high" : r.priority === "recommended" ? "medium" : "low")}>{r.priority}</span><strong style={{ fontSize: 13 }}>{r.title}</strong></div>
                            <div style={{ fontSize: 13, color: "#a1a1aa", marginTop: 4 }}>{r.description}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {aiAnalysis.contentGaps?.length > 0 && (
                      <div style={S.section}><div style={S.heading}>??? Content Gaps</div>{aiAnalysis.contentGaps.map((s, i) => <div key={i} style={{ fontSize: 13, color: "#93c5fd", marginBottom: 4 }}>� {s}</div>)}</div>
                    )}
                    {aiAnalysis.topicSuggestions?.length > 0 && (
                      <div style={S.section}><div style={S.heading}>?? Related Topics</div>{aiAnalysis.topicSuggestions.map((s, i) => <div key={i} style={{ fontSize: 13, color: "#c4b5fd", marginBottom: 4 }}>� {s}</div>)}</div>
                    )}
                  </div>
                )}

                {/* Rewrite results */}
                {rewriteLoading && <div style={S.card}><span style={S.spinner} /> Generating AI rewrites for <strong>{rewriteField}</strong>�</div>}
                {rewriteResult && (
                  <div style={S.card}>
                    <div style={S.cardTitle}>?? AI Rewrite Suggestions � {rewriteResult.field || rewriteField}</div>
                    {(rewriteResult.variants || []).map((v, i) => (
                      <div key={i} style={{ ...S.issueRow, justifyContent: "space-between" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, color: "#fafafa" }}>{v.text}</div>
                          <div style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>{v.charCount} chars � Keyword: {v.keywordPresent ? "?" : "?"} � CTA: {v.ctaStrength}</div>
                        </div>
                        <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => navigator.clipboard.writeText(v.text)}>Copy</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Meta details */}
                <div style={S.card}>
                  <div style={S.cardTitle}>?? Meta & Content Details</div>
                  <div style={S.metaRow}>
                    <MetaBlock label="Title" value={scanResult.title} max={60} />
                    <MetaBlock label="H1" value={scanResult.h1} />
                  </div>
                  <div style={S.metaRow}>
                    <MetaBlock label="Meta Description" value={scanResult.metaDescription} max={160} />
                  </div>
                  <div style={S.metaRow}>
                    <MetaBlock label="Canonical" value={scanResult.canonicalUrl || "�"} />
                    <MetaBlock label="Language" value={scanResult.langTag || "�"} />
                    <MetaBlock label="Author" value={scanResult.authorMeta || "�"} />
                  </div>
                  <div style={S.metaRow}>
                    <MetaBlock label="Published" value={scanResult.datePublished || "�"} />
                    <MetaBlock label="Modified" value={scanResult.dateModified || "�"} />
                    <MetaBlock label="HTTPS" value={scanResult.isHttps ? "Yes ?" : "No ?"} />
                  </div>
                  <div style={S.metaRow}>
                    <MetaBlock label="OG Title" value={scanResult.ogTitle || "�"} />
                    <MetaBlock label="OG Description" value={scanResult.ogDescription || "�"} />
                    <MetaBlock label="OG Image" value={scanResult.ogImage ? "Set ?" : "Missing ?"} />
                  </div>
                  <div style={S.metaRow}>
                    <MetaBlock label="Twitter Card" value={scanResult.hasTwitterCard ? `${scanResult.twitterCard} ?` : "Missing ?"} />
                    <MetaBlock label="Twitter Title" value={scanResult.twitterTitle || "�"} />
                    <MetaBlock label="Twitter Desc" value={scanResult.twitterDescription ? "Set ?" : "�"} />
                  </div>
                </div>

                {/* Readability panel */}
                {scanResult.flesch && (
                  <div style={S.card}>
                    <ToggleSection title="?? Readability Analysis (Flesch-Kincaid)" open={showReadability} toggle={() => setShowReadability(p => !p)} />
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
                              <div><div style={S.metaLabel}>Total Sentences</div><div style={S.metaVal}>{scanResult.flesch.totalSentences ?? "�"}</div></div>
                              <div><div style={S.metaLabel}>Avg Para Length</div><div style={S.metaVal}>{scanResult.avgParagraphLength} words</div></div>
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>
                          <strong style={{ color: "#a1a1aa" }}>Flesch Reading Ease:</strong> Score 0�30 = Very Difficult � 30�50 = Difficult � 50�60 = Fairly Difficult � 60�70 = Standard � 70�80 = Fairly Easy � 80�90 = Easy � 90�100 = Very Easy. Target 60+ for blog content.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Content freshness panel */}
                {(scanResult.contentAgeDays !== null && scanResult.contentAgeDays !== undefined) && (
                  <div style={{ ...S.card, borderLeft: scanResult.isContentStale ? "3px solid #ef4444" : "3px solid #22c55e" }}>
                    <ToggleSection title={`?? Content Freshness${scanResult.isContentStale ? " ?? Stale" : " ?"}`} open={showFreshness} toggle={() => setShowFreshness(p => !p)} />
                    {showFreshness && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ ...S.row, gap: 24, marginBottom: 12 }}>
                          <div>
                            <div style={S.metaLabel}>Published</div>
                            <div style={S.metaVal}>{scanResult.datePublished ? `${scanResult.datePublished.slice(0, 10)} (${scanResult.contentAgeDays} days ago)` : "�"}</div>
                          </div>
                          <div>
                            <div style={S.metaLabel}>Modified</div>
                            <div style={S.metaVal}>{scanResult.dateModified ? `${scanResult.dateModified.slice(0, 10)} (${scanResult.daysSinceModified} days ago)` : "Not set"}</div>
                          </div>
                          <div>
                            <div style={S.metaLabel}>Status</div>
                            <div style={{ ...S.metaVal, color: scanResult.isContentStale ? "#ef4444" : "#22c55e", fontWeight: 700 }}>
                              {scanResult.isContentStale ? "?? Stale (1+ year)" : "? Fresh"}
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
                    <ToggleSection title={`?? E-E-A-T Signals (${scanResult.eeatSignals.score}/4)`} open={showEeat} toggle={() => setShowEeat(p => !p)} />
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
                                {sig.ok ? "?" : "?"} {sig.label}
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

                {/* GEO / AI Citation Readiness panel */}
                {scanResult.aiCitationReadiness && (
                  <div style={{ ...S.card, borderLeft: `3px solid ${scanResult.aiCitationReadiness.score >= 70 ? "#22c55e" : scanResult.aiCitationReadiness.score >= 40 ? "#eab308" : "#ef4444"}` }}>
                    <ToggleSection title={`?? GEO / AI Citation Readiness � ${scanResult.aiCitationReadiness.score}/100`} open={showGeo} toggle={() => setShowGeo(p => !p)} />
                    {showGeo && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: 12, color: "#a1a1aa", marginBottom: 12 }}>
                          How likely is this content to be cited by ChatGPT, Perplexity, Claude, and Google AI Overviews? These signals are based on 2025�2026 Generative Engine Optimisation (GEO) research.
                        </div>
                        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 14 }}>
                          <div style={{ ...S.catCard(scanResult.aiCitationReadiness.score), minWidth: 120 }}>
                            <div style={S.catScore(scanResult.aiCitationReadiness.score)}>{scanResult.aiCitationReadiness.score}</div>
                            <div style={S.catLabel}>GEO Score</div>
                            <div style={{ fontSize: 11, color: "#a1a1aa", marginTop: 4 }}>
                              {scanResult.aiCitationReadiness.score >= 70 ? "AI-Citation Ready" : scanResult.aiCitationReadiness.score >= 40 ? "Needs GEO Work" : "Not Optimised"}
                            </div>
                          </div>
                          <div style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 16px", flex: "1 1 260px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                              <div>
                                <div style={S.metaLabel}>Authoritative Outbound Links</div>
                                <div style={{ ...S.metaVal, color: scanResult.aiCitationReadiness.authoritativeOutboundCount >= 2 ? "#22c55e" : "#eab308" }}>
                                  {scanResult.aiCitationReadiness.authoritativeOutboundCount} {scanResult.aiCitationReadiness.authoritativeOutboundCount >= 2 ? "?" : "??"}
                                </div>
                              </div>
                              <div>
                                <div style={S.metaLabel}>First-Person Expertise</div>
                                <div style={{ ...S.metaVal, color: scanResult.aiCitationReadiness.hasFirstPersonExpertise ? "#22c55e" : "#ef4444" }}>
                                  {scanResult.aiCitationReadiness.hasFirstPersonExpertise ? "? Detected" : "? Not found"}
                                </div>
                              </div>
                              <div>
                                <div style={S.metaLabel}>Definition Density</div>
                                <div style={{ ...S.metaVal, color: scanResult.aiCitationReadiness.definitionDensity >= 1 ? "#22c55e" : "#eab308" }}>
                                  {scanResult.aiCitationReadiness.definitionDensity} per 1k words
                                </div>
                              </div>
                              <div>
                                <div style={S.metaLabel}>Direct-Answer Paragraphs</div>
                                <div style={{ ...S.metaVal, color: scanResult.aiCitationReadiness.directAnswerParagraphs >= 2 ? "#22c55e" : "#ef4444" }}>
                                  {scanResult.aiCitationReadiness.directAnswerParagraphs} {scanResult.aiCitationReadiness.directAnswerParagraphs >= 2 ? "?" : "?"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {[
                            { ok: scanResult.aiCitationReadiness.authoritativeOutboundCount >= 2, label: "=2 authoritative outbound links (gov, edu, .org, major publishers)", tip: "Link to at least 2 high-authority sources � AI models use citations to verify claims and prefer content that cites credible references." },
                            { ok: scanResult.aiCitationReadiness.hasFirstPersonExpertise, label: "First-person expertise signals (\"I tested\", \"In my experience\")", tip: "Add first-person experience language � 2025 Google HCU and AI crawlers reward demonstrable expertise over generic summaries." },
                            { ok: scanResult.aiCitationReadiness.definitionDensity >= 1, label: "Definition density =1 per 1,000 words (\"X is defined as�\")", tip: "Include clear definitional sentences � AI models extract and cite definitions heavily in AI Overviews and answer boxes." },
                            { ok: scanResult.aiCitationReadiness.directAnswerParagraphs >= 2, label: "=2 direct-answer paragraphs (short, =55-word paragraphs)", tip: "Write short, self-contained paragraphs (=55 words) that answer a question directly � these are the primary candidates for AI-generated citations." },
                          ].map((sig, i) => (
                            <div key={i} style={{ background: sig.ok ? "#14532d22" : "#450a0a22", border: `1px solid ${sig.ok ? "#166534" : "#7f1d1d"}`, borderRadius: 8, padding: "10px 12px" }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: sig.ok ? "#86efac" : "#fca5a5", marginBottom: sig.ok ? 0 : 4 }}>
                                {sig.ok ? "?" : "?"} {sig.label}
                              </div>
                              {!sig.ok && <div style={{ fontSize: 11, color: "#a1a1aa", marginTop: 4 }}>{sig.tip}</div>}
                            </div>
                          ))}
                        </div>
                        <div style={{ marginTop: 12, fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>
                          <strong style={{ color: "#a1a1aa" }}>What is GEO?</strong> Generative Engine Optimisation (GEO) is the practice of making content more likely to be cited by AI-powered search engines (ChatGPT Search, Perplexity, Google AI Overviews). Research from Princeton/Georgia Tech (2023) shows authoritative citations, statistics, and first-person expertise are the strongest citation signals.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Featured snippet readiness panel */}
                {scanResult.questionHeadingCount !== undefined && (
                  <div style={S.card}>
                    <ToggleSection title={`?? Featured Snippet Readiness${scanResult.questionHeadingCount > 0 ? " ?" : ""}`} open={showSnippets} toggle={() => setShowSnippets(p => !p)} />
                    {showSnippets && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ ...S.row, gap: 24, marginBottom: 12 }}>
                          <MetaChip label="Question Headings" value={scanResult.questionHeadingCount} color={scanResult.questionHeadingCount > 0 ? "#22c55e" : "#ef4444"} />
                          <MetaChip label="FAQ Section" value={scanResult.hasFaqSection ? "Yes ?" : "No"} color={scanResult.hasFaqSection ? "#22c55e" : "#71717a"} />
                          <MetaChip label="Table of Contents" value={scanResult.hasTableOfContents ? "Yes ?" : "No"} color={scanResult.hasTableOfContents ? "#22c55e" : "#71717a"} />
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
                            ?? Add H2/H3 headings starting with How, What, Why, or When to increase chances of winning featured snippets and AI-generated answer boxes.
                          </div>
                        )}
                        {!scanResult.hasTableOfContents && scanResult.wordCount > 1200 && (
                          <div style={{ fontSize: 13, color: "#fbbf24", marginTop: 8 }}>
                            ?? Add a Table of Contents for this {scanResult.wordCount}-word post � it helps readers navigate and can win sitelinks in Google results.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* FAQ Schema Generator */}
                {scanResult.questionHeadings?.length > 0 && (
                  <div style={S.card}>
                    <div style={S.cardTitle}>?? FAQPage Schema Generator</div>
                    <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 12 }}>
                      {scanResult.questionHeadings.length} question heading{scanResult.questionHeadings.length > 1 ? "s" : ""} detected � generate FAQPage JSON-LD to unlock Google's FAQ rich result in search.
                    </div>
                    <div style={{ ...S.row, gap: 8, marginBottom: faqSchemaResult ? 14 : 0 }}>
                      <button style={S.btn("primary")} onClick={() => generateFaqSchema(true)} disabled={faqSchemaLoading}>
                        {faqSchemaLoading ? <><span style={S.spinner} /> Generating�</> : "?? AI Generate Answers + Schema (1 credit)"}
                      </button>
                      <button style={S.btn()} onClick={() => generateFaqSchema(false)} disabled={faqSchemaLoading}>
                        ?? Structure Only (free)
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
                          <div style={{ fontSize: 13, color: "#86efac", fontWeight: 600 }}>{faqSchemaResult.aiGenerated ? "? AI answers + schema generated" : "? Schema structure generated"}</div>
                          <button style={S.btn("ghost")} onClick={() => navigator.clipboard.writeText(faqSchemaResult.scriptTag)}>?? Copy</button>
                        </div>
                        <pre style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: 14, fontSize: 11, color: "#d4d4d8", overflowX: "auto", whiteSpace: "pre-wrap", maxHeight: 280, overflowY: "auto" }}>{faqSchemaResult.scriptTag}</pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Keyword density */}
                {scanResult.keywordDensity && Object.keys(scanResult.keywordDensity).length > 0 && (
                  <div style={S.card}>
                    <div style={S.cardTitle}>?? Keyword Density</div>
                    <table style={S.table}>
                      <thead><tr><th style={S.th}>Keyword</th><th style={S.th}>Count</th><th style={S.th}>Density</th><th style={S.th}>In Title</th><th style={S.th}>In H1</th><th style={S.th}>In Meta</th><th style={S.th}>In URL</th><th style={S.th}>First 100W</th></tr></thead>
                      <tbody>
                        {Object.entries(scanResult.keywordDensity).map(([kw, v]) => (
                          <tr key={kw}>
                            <td style={S.td}>{kw}</td>
                            <td style={S.td}>{v.count}</td>
                            <td style={{ ...S.td, color: v.density >= 0.5 && v.density <= 2.5 ? "#22c55e" : v.density > 3 ? "#ef4444" : "#eab308" }}>{v.density}%</td>
                            <td style={S.td}>{scanResult.keywordInTitle ? "?" : "?"}</td>
                            <td style={S.td}>{scanResult.keywordInH1 ? "?" : "?"}</td>
                            <td style={S.td}>{scanResult.keywordInMeta ? "?" : "?"}</td>
                            <td style={S.td}>{scanResult.keywordInUrl ? "?" : "?"}</td>
                            <td style={S.td}>{scanResult.keywordInFirst100Words ? "?" : "?"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Expandable panels */}
                <div style={S.card}>
                  <ToggleSection title={`?? Headings (${scanResult.headings?.length || 0})`} open={showHeadings} toggle={() => setShowHeadings(p => !p)} />
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
                  <ToggleSection title={`?? Links � ${scanResult.internalLinks} internal � ${scanResult.externalLinks} external`} open={showLinks} toggle={() => setShowLinks(p => !p)} />
                  {showLinks && (
                    <div style={{ marginTop: 8, maxHeight: 300, overflowY: "auto" }}>
                      <div style={S.heading}>Internal Links</div>
                      {(scanResult.internalLinkDetails || []).map((l, i) => <div key={i} style={{ fontSize: 12, color: "#93c5fd", marginBottom: 3, wordBreak: "break-all" }}>� {l.text || "(no text)"} ? {l.href}</div>)}
                      <div style={{ ...S.heading, marginTop: 12 }}>External Links</div>
                      {(scanResult.externalLinkDetails || []).map((l, i) => <div key={i} style={{ fontSize: 12, color: "#c4b5fd", marginBottom: 3, wordBreak: "break-all" }}>� {l.text || "(no text)"} ? {l.href}</div>)}
                    </div>
                  )}
                </div>

                {/* Broken Link Checker */}
                <div style={{ ...S.card, borderLeft: brokenLinksResult ? (brokenLinksResult.summary.broken > 0 ? "3px solid #ef4444" : "3px solid #22c55e") : undefined }}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: brokenLinksResult || brokenLinksErr ? 12 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Broken Link Checker {brokenLinksResult && <span style={{ fontSize: 12, color: "#71717a", fontWeight: 400 }}>� {brokenLinksResult.summary.total} links scanned</span>}</div>
                    <button style={S.btn(brokenLinksResult ? undefined : "primary")} onClick={checkBrokenLinks} disabled={brokenLinksLoading}>
                      {brokenLinksLoading ? <><span style={S.spinner} /> Checking�</> : brokenLinksResult ? "?? Re-scan" : "?? Check All Links"}
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
                                {r.status || "ERR"} {r.ok ? "?" : r.redirect ? "??" : "?"}
                              </span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ color: "#93c5fd", wordBreak: "break-all" }}>{r.url}</div>
                                {r.text && <div style={{ color: "#71717a" }}>"{r.text}"</div>}
                                {r.redirectUrl && <div style={{ color: "#eab308" }}>? {r.redirectUrl}</div>}
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
                  <ToggleSection title={`??? Images (${scanResult.imageCount}) � ${scanResult.imagesWithAlt} with alt`} open={showImages} toggle={() => setShowImages(p => !p)} />
                  {showImages && (
                    <div style={{ marginTop: 8, maxHeight: 300, overflowY: "auto" }}>
                      {(scanResult.images || []).map((img, i) => (
                        <div key={i} style={{ fontSize: 12, marginBottom: 6, color: "#d4d4d8" }}>
                          <span style={S.pill(img.hasAlt ? "low" : "high")}>{img.hasAlt ? "ALT ?" : "ALT ?"}</span>
                          <span style={{ color: "#71717a", wordBreak: "break-all" }}>{img.src}</span>
                          {img.alt && <span style={{ color: "#a1a1aa" }}> � "{img.alt}"</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={S.card}>
                  <ToggleSection title={`??? Schema � ${scanResult.schemaMarkup ? `${scanResult.schemaTypes.length} type(s) found` : "None detected"}`} open={showSchema} toggle={() => setShowSchema(p => !p)} />
                  {showSchema && (
                    <div style={{ marginTop: 8 }}>
                      {scanResult.schemaTypes.length > 0
                        ? scanResult.schemaTypes.map((t, i) => <div key={i} style={{ fontSize: 13, color: "#86efac", marginBottom: 3 }}>� {t}</div>)
                        : <div style={{ fontSize: 13, color: "#ef4444" }}>No structured data found. Add Article or BlogPosting schema.</div>}

                      {/* Schema Generator */}
                      <div style={{ marginTop: 18, borderTop: "1px solid #27272a", paddingTop: 16 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7", marginBottom: 12 }}>?? Generate BlogPosting Schema</div>
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
                          {schemaGenLoading ? <><span style={S.spinner} /> Generating�</> : "? Generate BlogPosting JSON-LD (1 credit)"}
                        </button>
                        {generatedSchema && (
                          <div style={{ marginTop: 14 }}>
                            <div style={{ ...S.row, marginBottom: 8, gap: 8 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "#86efac" }}>? Schema generated � copy and paste into your blog post &lt;head&gt;</div>
                              <button style={S.btn("ghost")} onClick={() => navigator.clipboard.writeText(generatedSchema.scriptTag)}>?? Copy</button>
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
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? LLM / AI Optimization Score <span style={{ fontSize: 11, fontWeight: 400, color: "#71717a", marginLeft: 6 }}>2026</span></div>
                    <button style={S.btn(llmScore ? undefined : "primary")} onClick={runLlmScore} disabled={llmLoading}>
                      {llmLoading ? <><span style={S.spinner} /> Scoring�</> : llmScore ? "?? Re-score" : "Score AI Readability"}
                    </button>
                  </div>
                  {llmErr && <div style={S.err}>{llmErr}</div>}
                  {!llmScore && !llmLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Check how well your content is structured for LLM extraction � the #1 new 2026 signal (Backlinko, Semrush).</div>}
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
                            <span style={{ fontSize: 16, flexShrink: 0 }}>{s.pass ? "?" : "?"}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: "#fafafa" }}>{s.name}</div>
                              <div style={{ fontSize: 12, color: "#71717a" }}>{s.value}</div>
                              {!s.pass && <div style={{ fontSize: 12, color: "#fbbf24", marginTop: 3 }}>?? {s.tip}</div>}
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
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Title CTR Signals</div>
                    <button style={S.btn(ctrSignals ? undefined : "primary")} onClick={runCtrSignals} disabled={ctrLoading}>
                      {ctrLoading ? <><span style={S.spinner} /> Analyzing�</> : ctrSignals ? "?? Re-analyze" : "Analyze CTR"}
                    </button>
                  </div>
                  {!ctrSignals && !ctrLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Analyze your title's click-through rate signals � keyword position, emotion, power modifiers, year.</div>}
                  {ctrSignals && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
                        <div style={S.scoreRing(ctrSignals.ctrScore)}>{ctrSignals.ctrScore}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#fafafa", marginBottom: 8 }}>{ctrSignals.title}</div>
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ ...S.pill(ctrSignals.keywordPosition === "start" ? "low" : ctrSignals.keywordPosition === "not-found" ? "high" : "medium") }}>
                              ?? Keyword: {ctrSignals.keywordPosition}
                            </span>
                            <span style={{ ...S.pill(ctrSignals.hasYear ? "low" : "medium") }}>
                              ?? Year: {ctrSignals.hasYear ? ctrSignals.yearMatch : "missing"}
                            </span>
                            <span style={{ ...S.pill(ctrSignals.emotionType === "positive" ? "low" : ctrSignals.emotionType === "negative" ? "medium" : "high") }}>
                              {ctrSignals.emotionType === "positive" ? "??" : ctrSignals.emotionType === "negative" ? "??" : "??"} {ctrSignals.emotionType}
                            </span>
                            <span style={{ ...S.pill(ctrSignals.titleLengthOk ? "low" : "high") }}>
                              ?? {ctrSignals.titleLength} chars
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
                          <div style={S.heading}>?? CTR Tips</div>
                          {ctrSignals.tips.map((t, i) => <div key={i} style={{ fontSize: 13, color: "#fbbf24", marginBottom: 5 }}>� {t}</div>)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Technical Audit */}
                <div style={{ ...S.card, borderLeft: techAudit ? `3px solid ${techAudit.score >= 80 ? "#22c55e" : techAudit.score >= 55 ? "#eab308" : "#ef4444"}` : undefined }}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: techAudit || techAuditErr ? 12 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Technical SEO Audit {techAudit && <span style={{ fontSize: 12, fontWeight: 700, color: techAudit.score >= 80 ? "#22c55e" : techAudit.score >= 55 ? "#eab308" : "#ef4444" }}>{techAudit.score}/100</span>}</div>
                    <button style={S.btn(techAudit ? undefined : "primary")} onClick={runTechAudit} disabled={techAuditLoading}>
                      {techAuditLoading ? <><span style={S.spinner} /> Auditing�</> : techAudit ? "?? Re-audit" : "?? Run Audit"}
                    </button>
                  </div>
                  {techAuditErr && <div style={S.err}>{techAuditErr}</div>}
                  {!techAudit && !techAuditLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Canonical tag, HTTPS, URL slug quality, above-the-fold content, image formats + lazy loading, mobile meta description length.</div>}
                  {techAudit && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
                      {[
                        { label: "HTTPS", pass: techAudit.https.pass, detail: techAudit.https.tip },
                        { label: "Canonical", pass: techAudit.canonical.pass, detail: techAudit.canonical.tip + (techAudit.canonical.href ? ` (${techAudit.canonical.status})` : "") },
                        { label: "URL Slug", pass: techAudit.urlSlug.pass, detail: `"${techAudit.urlSlug.slug}" � ${techAudit.urlSlug.quality}${techAudit.urlSlug.issues.length ? " � " + techAudit.urlSlug.issues[0] : ""}` },
                        { label: "Above the Fold", pass: techAudit.aboveFold.pass, detail: techAudit.aboveFold.tip },
                        { label: "Images: WebP", pass: techAudit.imageFormats.webpPass, detail: `${techAudit.imageFormats.webp} WebP, ${techAudit.imageFormats.jpg} JPG, ${techAudit.imageFormats.png} PNG of ${techAudit.imageFormats.total} total` },
                        { label: "Images: Lazy Load", pass: techAudit.imageFormats.lazyPass, detail: techAudit.imageFormats.missingLazy > 0 ? `${techAudit.imageFormats.missingLazy} image(s) missing loading="lazy"` : "All images have lazy loading" },
                        { label: "Images: Dimensions", pass: techAudit.imageFormats.dimsPass, detail: techAudit.imageFormats.missingDimensions > 0 ? `${techAudit.imageFormats.missingDimensions} image(s) missing width/height (causes CLS)` : "All images have dimensions set" },
                        { label: "Meta Mobile (=105 chars)", pass: techAudit.metaMobile.pass, detail: techAudit.metaMobile.tip },
                      ].map((row, i) => (
                        <div key={i} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 14 }}>{row.pass ? "?" : "?"}</span>
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
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>??? Article Schema Validator {schemaValid && <span style={{ fontSize: 12, fontWeight: 700, color: schemaValid.score >= 80 ? "#22c55e" : "#eab308" }}>{schemaValid.score}/100</span>}</div>
                    <button style={S.btn(schemaValid ? undefined : "primary")} onClick={runSchemaValidate} disabled={schemaValidLoading}>
                      {schemaValidLoading ? <><span style={S.spinner} /> Validating�</> : schemaValid ? "?? Re-validate" : "? Validate Schema"}
                    </button>
                  </div>
                  {schemaValidErr && <div style={S.err}>{schemaValidErr}</div>}
                  {!schemaValid && !schemaValidLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Validate existing Article/BlogPosting JSON-LD against Google's required fields (headline, image, author.@type, datePublished, publisher�).</div>}
                  {schemaValid && !schemaValid.found && (
                    <div>
                      <div style={{ fontSize: 14, color: "#ef4444", marginBottom: 8 }}>? No Article/BlogPosting schema found on this page.</div>
                      <div style={{ fontSize: 13, color: "#71717a" }}>{schemaValid.tip}</div>
                      <div style={{ marginTop: 10 }}>
                        <span style={{ fontSize: 12, color: "#818cf8", cursor: "pointer" }} onClick={() => setShowSchema(true)}>? Use the Schema Generator above to create one</span>
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
                            <span>{f.present ? "?" : f.required ? "?" : "??"}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: f.present ? "#a1a1aa" : f.required ? "#ef4444" : "#eab308" }}>
                                {f.name} {f.required ? <span style={{ color: "#71717a", fontWeight: 400 }}>(required)</span> : <span style={{ color: "#3f3f46", fontWeight: 400 }}>(recommended)</span>}
                              </div>
                              {f.value && <div style={{ color: "#71717a", marginTop: 2, wordBreak: "break-all" }}>{f.value}</div>}
                              {!f.present && <div style={{ color: "#fbbf24", marginTop: 2 }}>?? {f.tip}</div>}
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
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Advanced Readability {advReadability && <span style={{ fontSize: 12, fontWeight: 700, color: advReadability.score >= 80 ? "#22c55e" : advReadability.score >= 55 ? "#eab308" : "#ef4444" }}>{advReadability.grade}</span>}</div>
                    <button style={S.btn(advReadability ? undefined : "primary")} onClick={runAdvReadability} disabled={advReadLoading}>
                      {advReadLoading ? <><span style={S.spinner} /> Analyzing�</> : advReadability ? "?? Re-analyze" : "?? Analyze"}
                    </button>
                  </div>
                  {!advReadability && !advReadLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Sentence length, paragraph length, transition words, passive voice � beyond Flesch-Kincaid.</div>}
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
                            <div style={{ fontSize: 10, marginTop: 4 }}>{m.pass ? "? Good" : "?? Review"}</div>
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
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? AI Internal Link Suggestions <span style={{ fontSize: 11, fontWeight: 400, color: "#71717a", marginLeft: 4 }}>2 credits</span></div>
                    <button style={S.btn(intLinks ? undefined : "primary")} onClick={runIntLinks} disabled={intLinksLoading}>
                      {intLinksLoading ? <><span style={S.spinner} /> Generating�</> : intLinks ? "?? Regenerate" : "?? Get Suggestions"}
                    </button>
                  </div>
                  {intLinksErr && <div style={S.err}>{intLinksErr}</div>}
                  {!intLinks && !intLinksLoading && <div style={{ fontSize: 13, color: "#52525b" }}>AI suggests contextual internal link opportunities � anchor text, context sentences, and target topics.</div>}
                  {intLinks && (
                    <div>
                      {intLinks.tip && <div style={{ fontSize: 13, color: "#93c5fd", marginBottom: 12, padding: "8px 12px", background: "#0c1a2e", borderRadius: 8 }}>?? {intLinks.tip}</div>}
                      {(intLinks.suggestions || []).map((s, i) => (
                        <div key={i} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "12px 14px", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span style={{ ...S.pill("low"), fontSize: 11 }}>{s.placement}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#818cf8" }}>{s.anchorText}</span>
                            <button style={{ ...S.btn(), fontSize: 11, padding: "2px 8px", marginLeft: "auto" }} onClick={() => navigator.clipboard.writeText(s.anchorText)}>Copy</button>
                          </div>
                          <div style={{ fontSize: 12, color: "#d4d4d8", fontStyle: "italic", marginBottom: 4 }}>"{s.contextSentence}"</div>
                          <div style={{ fontSize: 12, color: "#71717a" }}>Target: <span style={{ color: "#a1a1aa" }}>{s.targetTopic}</span> � {s.rationale}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* -- Core Web Vitals -- */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: cwvResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>? Core Web Vitals (PageSpeed)</div>
                    <button style={S.btn(cwvResult ? undefined : "primary")} onClick={runCoreWebVitals} disabled={cwvLoading || !url.trim()}>
                      {cwvLoading ? <><span style={S.spinner} /> Checking�</> : cwvResult ? "?? Re-check" : "Check CWV"}
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

                {/* -- AI Crawler Access Audit -- */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: crawlerResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? AI Crawler Access Audit</div>
                    <button style={S.btn(crawlerResult ? undefined : "primary")} onClick={runCrawlerAccess} disabled={crawlerLoading || !url.trim()}>
                      {crawlerLoading ? <><span style={S.spinner} /> Checking�</> : crawlerResult ? "?? Re-check" : "Audit Crawlers"}
                    </button>
                  </div>
                  {!crawlerResult && !crawlerLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Check if GPTBot, ClaudeBot, PerplexityBot, Google-Extended, and 6 other crawlers can access your content.</div>}
                  {crawlerErr && <div style={S.err}>{crawlerErr}</div>}
                  {crawlerResult && (
                    <div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                        <span style={{ fontSize: 13, color: "#22c55e", fontWeight: 700 }}>? Allowed: {crawlerResult.summary?.allowed ?? 0}</span>
                        <span style={{ fontSize: 13, color: "#ef4444", fontWeight: 700 }}>?? Blocked: {crawlerResult.summary?.blocked ?? 0}</span>
                      </div>
                      <table style={S.table}>
                        <thead><tr><th style={S.th}>Crawler</th><th style={S.th}>Type</th><th style={S.th}>Status</th></tr></thead>
                        <tbody>
                          {(crawlerResult.crawlers || []).map((c, i) => (
                            <tr key={i}>
                              <td style={S.td}>{c.agent}</td>
                              <td style={S.td}><span style={S.pill("low")}>{c.type}</span></td>
                              <td style={S.td}><span style={{ color: c.allowed ? "#22c55e" : "#ef4444", fontWeight: 700 }}>{c.allowed ? "? Allowed" : "?? Blocked"}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {crawlerResult.recommendation && <div style={{ marginTop: 10, fontSize: 13, color: "#fbbf24" }}>?? {crawlerResult.recommendation}</div>}
                    </div>
                  )}
                </div>

                {/* -- Title ? H1 Alignment -- */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: titleH1Result ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Title ? H1 Alignment</div>
                    <button style={S.btn(titleH1Result ? undefined : "primary")} onClick={runTitleH1} disabled={titleH1Loading || !scanResult}>
                      {titleH1Loading ? <><span style={S.spinner} /> Checking�</> : titleH1Result ? "?? Re-check" : "Check Alignment"}
                    </button>
                  </div>
                  {!titleH1Result && !titleH1Loading && <div style={{ fontSize: 13, color: "#52525b" }}>Compare your title tag vs H1 � significant divergence increases Google rewrite risk.</div>}
                  {titleH1Result && (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                        <div style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: 12 }}>
                          <div style={S.metaLabel}>Title Tag</div>
                          <div style={{ fontSize: 13, color: "#fafafa", marginTop: 4 }}>{titleH1Result.title || "�"}</div>
                        </div>
                        <div style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: 12 }}>
                          <div style={S.metaLabel}>H1 Tag</div>
                          <div style={{ fontSize: 13, color: "#fafafa", marginTop: 4 }}>{titleH1Result.h1 || "�"}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 10 }}>
                        <span style={{ fontSize: 13 }}>Similarity: <strong style={{ color: titleH1Result.similarity >= 70 ? "#22c55e" : titleH1Result.similarity >= 40 ? "#eab308" : "#ef4444" }}>{titleH1Result.similarity}%</strong></span>
                        <span style={{ fontSize: 13 }}>Google Rewrite Risk: <strong style={{ color: titleH1Result.rewriteRisk === "Low" ? "#22c55e" : titleH1Result.rewriteRisk === "Medium" ? "#eab308" : "#ef4444" }}>{titleH1Result.rewriteRisk}</strong></span>
                      </div>
                      {titleH1Result.tip && <div style={{ fontSize: 13, color: "#fbbf24" }}>?? {titleH1Result.tip}</div>}
                    </div>
                  )}
                </div>

                {/* -- Heading Hierarchy -- */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: headingHierResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>??? Heading Hierarchy Validator</div>
                    <button style={S.btn(headingHierResult ? undefined : "primary")} onClick={runHeadingHier} disabled={headingHierLoading || !scanResult}>
                      {headingHierLoading ? <><span style={S.spinner} /> Checking�</> : headingHierResult ? "?? Re-check" : "Validate"}
                    </button>
                  </div>
                  {!headingHierResult && !headingHierLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Detect skipped heading levels (e.g. H2?H4), multiple H1s, and empty headings.</div>}
                  {headingHierResult && (
                    <div>
                      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 10 }}>
                        <span style={{ fontSize: 13 }}>H1 count: <strong style={{ color: headingHierResult.h1Count === 1 ? "#22c55e" : "#ef4444" }}>{headingHierResult.h1Count}</strong></span>
                        <span style={{ fontSize: 13 }}>Skipped levels: <strong style={{ color: headingHierResult.skippedLevels?.length ? "#ef4444" : "#22c55e" }}>{headingHierResult.skippedLevels?.length ?? 0}</strong></span>
                        <span style={{ fontSize: 13 }}>Empty headings: <strong style={{ color: headingHierResult.emptyHeadings?.length ? "#ef4444" : "#22c55e" }}>{headingHierResult.emptyHeadings?.length ?? 0}</strong></span>
                      </div>
                      {headingHierResult.issues?.length > 0 && headingHierResult.issues.map((iss, i) => (
                        <div key={i} style={{ fontSize: 13, color: "#fbbf24", marginBottom: 4 }}>?? {iss}</div>
                      ))}
                      {!headingHierResult.issues?.length && <div style={{ fontSize: 13, color: "#22c55e" }}>? Heading structure looks good!</div>}
                    </div>
                  )}
                </div>

                {/* -- Image SEO Audit -- */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: imageSeoResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>??? Image SEO Audit</div>
                    <button style={S.btn(imageSeoResult ? undefined : "primary")} onClick={runImageSeo} disabled={imageSeoLoading || !scanResult}>
                      {imageSeoLoading ? <><span style={S.spinner} /> Auditing�</> : imageSeoResult ? "?? Re-audit" : "Audit Images"}
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
                            <span style={S.pill(img.hasAlt ? "low" : "high")}>{img.hasAlt ? "ALT ?" : "ALT ?"}</span>
                            <span style={S.pill(img.hasLazy ? "low" : "medium")}>{img.hasLazy ? "LAZY ?" : "LAZY ?"}</span>
                            <span style={{ color: "#71717a", wordBreak: "break-all" }}>{img.src}</span>
                            {img.alt && <span style={{ color: "#a1a1aa" }}> � "{img.alt}"</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* -- Semantic HTML Checker -- */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: semanticHtmlResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Semantic HTML Checker</div>
                    <button style={S.btn(semanticHtmlResult ? undefined : "primary")} onClick={runSemanticHtml} disabled={semanticHtmlLoading || !scanResult}>
                      {semanticHtmlLoading ? <><span style={S.spinner} /> Checking�</> : semanticHtmlResult ? "?? Re-check" : "Check HTML"}
                    </button>
                  </div>
                  {!semanticHtmlResult && !semanticHtmlLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Detect semantic HTML5 tags: article, main, header, nav, footer, figure, time, address.</div>}
                  {semanticHtmlResult && (
                    <div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {(semanticHtmlResult.tags || []).map((tag, i) => (
                          <div key={i} style={{ background: tag.found ? "#14532d22" : "#450a0a22", border: `1px solid ${tag.found ? "#14532d" : "#7f1d1d"}`, borderRadius: 8, padding: "8px 14px", fontSize: 13, color: tag.found ? "#86efac" : "#fca5a5" }}>
                            {tag.found ? "?" : "?"} &lt;{tag.name}&gt;
                          </div>
                        ))}
                      </div>
                      {semanticHtmlResult.score !== undefined && <div style={{ marginTop: 10, fontSize: 13, color: "#a1a1aa" }}>Semantic score: <strong style={{ color: semanticHtmlResult.score >= 6 ? "#22c55e" : semanticHtmlResult.score >= 4 ? "#eab308" : "#ef4444" }}>{semanticHtmlResult.score}/{semanticHtmlResult.total}</strong></div>}
                    </div>
                  )}
                </div>

                {/* -- Meta Description Audit -- */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: metaDescAuditResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Meta Description Audit</div>
                    <button style={S.btn(metaDescAuditResult ? undefined : "primary")} onClick={runMetaDescAudit} disabled={metaDescAuditLoading || !scanResult}>
                      {metaDescAuditLoading ? <><span style={S.spinner} /> Auditing�</> : metaDescAuditResult ? "?? Re-audit" : "Audit Meta Desc"}
                    </button>
                  </div>
                  {!metaDescAuditResult && !metaDescAuditLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Length, keyword presence, CTA detection, and og:description consistency check.</div>}
                  {metaDescAuditResult && (
                    <div>
                      <div style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 13, color: "#fafafa" }}>{metaDescAuditResult.metaDescription || "(no meta description)"}</div>
                      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 10 }}>
                        <span style={{ fontSize: 13 }}>Length: <strong style={{ color: metaDescAuditResult.lengthOk ? "#22c55e" : "#ef4444" }}>{metaDescAuditResult.length} chars</strong></span>
                        <span style={{ fontSize: 13 }}>Keyword: <strong style={{ color: metaDescAuditResult.hasKeyword ? "#22c55e" : "#eab308" }}>{metaDescAuditResult.hasKeyword ? "? Found" : "? Missing"}</strong></span>
                        <span style={{ fontSize: 13 }}>CTA: <strong style={{ color: metaDescAuditResult.hasCta ? "#22c55e" : "#71717a" }}>{metaDescAuditResult.hasCta ? "? Found" : "�"}</strong></span>
                        <span style={{ fontSize: 13 }}>OG Match: <strong style={{ color: metaDescAuditResult.ogMatch ? "#22c55e" : "#eab308" }}>{metaDescAuditResult.ogMatch ? "?" : "?? Mismatch"}</strong></span>
                      </div>
                      {metaDescAuditResult.tips?.map((t, i) => <div key={i} style={{ fontSize: 13, color: "#fbbf24", marginBottom: 4 }}>?? {t}</div>)}
                    </div>
                  )}
                </div>

                {/* -- Keyword Density Heatmap -- */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: kwDensityResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Keyword Density Heatmap</div>
                    <button style={S.btn(kwDensityResult ? undefined : "primary")} onClick={runKwDensity} disabled={kwDensityLoading || !scanResult || !kwInput.trim()}>
                      {kwDensityLoading ? <><span style={S.spinner} /> Analyzing�</> : kwDensityResult ? "?? Re-analyze" : "Analyze Density"}
                    </button>
                  </div>
                  {!kwInput.trim() && <div style={{ fontSize: 12, color: "#eab308" }}>?? Enter a target keyword above first.</div>}
                  {!kwDensityResult && !kwDensityLoading && kwInput.trim() && <div style={{ fontSize: 13, color: "#52525b" }}>Per-section keyword density with stuffing/underuse detection.</div>}
                  {kwDensityResult && (
                    <div>
                      <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 10 }}>Overall density: <strong style={{ color: kwDensityResult.overallDensity >= 0.5 && kwDensityResult.overallDensity <= 3 ? "#22c55e" : "#ef4444" }}>{kwDensityResult.overallDensity}%</strong> � {kwDensityResult.overallCount} occurrences in {kwDensityResult.totalWords} words</div>
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

                {/* -- Index Directives -- */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: indexDirectivesResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Index Directives Audit</div>
                    <button style={S.btn(indexDirectivesResult ? undefined : "primary")} onClick={runIndexDirectives} disabled={indexDirectivesLoading || !scanResult}>
                      {indexDirectivesLoading ? <><span style={S.spinner} /> Checking�</> : indexDirectivesResult ? "?? Re-check" : "Audit Directives"}
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
                            {d.isBlocking && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>?? This may block indexing</div>}
                          </div>
                        ))}
                      </div>
                      {indexDirectivesResult.recommendation && <div style={{ marginTop: 10, fontSize: 13, color: "#fbbf24" }}>?? {indexDirectivesResult.recommendation}</div>}
                    </div>
                  )}
                </div>

                {/* -- Content Structure Score -- */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: contentStructResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Content Structure Score</div>
                    <button style={S.btn(contentStructResult ? undefined : "primary")} onClick={runContentStruct} disabled={contentStructLoading || !scanResult}>
                      {contentStructLoading ? <><span style={S.spinner} /> Analyzing�</> : contentStructResult ? "?? Re-analyze" : "Analyze Structure"}
                    </button>
                  </div>
                  {!contentStructResult && !contentStructLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Score lists, tables, images, bullets, and ToC � structured content ranks better.</div>}
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
                      {contentStructResult.tips?.map((t, i) => <div key={i} style={{ fontSize: 13, color: "#fbbf24", marginBottom: 4 }}>?? {t}</div>)}
                    </div>
                  )}
                </div>

                {/* -- Author Authority (E-E-A-T) -- */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: authorAuthResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Author Authority Check (E-E-A-T)</div>
                    <button style={S.btn(authorAuthResult ? undefined : "primary")} onClick={runAuthorAuth} disabled={authorAuthLoading || !scanResult}>
                      {authorAuthLoading ? <><span style={S.spinner} /> Checking�</> : authorAuthResult ? "?? Re-check" : "Check Authority"}
                    </button>
                  </div>
                  {!authorAuthResult && !authorAuthLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Detect author bio, bylines, author page links, datePublished, and author schema.</div>}
                  {authorAuthResult && (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px,1fr))", gap: 10, marginBottom: 12 }}>
                        {(authorAuthResult.signals || []).map((sig, i) => (
                          <div key={i} style={{ background: sig.found ? "#14532d22" : "#450a0a22", border: `1px solid ${sig.found ? "#14532d" : "#7f1d1d"}`, borderRadius: 8, padding: "10px 12px" }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: sig.found ? "#86efac" : "#fca5a5" }}>{sig.found ? "?" : "?"} {sig.name}</div>
                            {sig.value && <div style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>{sig.value}</div>}
                          </div>
                        ))}
                      </div>
                      {authorAuthResult.score !== undefined && <div style={{ fontSize: 13, color: "#a1a1aa" }}>E-E-A-T Score: <strong style={{ color: authorAuthResult.score >= 4 ? "#22c55e" : authorAuthResult.score >= 2 ? "#eab308" : "#ef4444" }}>{authorAuthResult.score}/{authorAuthResult.total}</strong></div>}
                    </div>
                  )}
                </div>

                {/* -- XML Sitemap Check -- */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: sitemapResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>??? XML Sitemap Check</div>
                    <button style={S.btn(sitemapResult ? undefined : "primary")} onClick={runSitemap} disabled={sitemapLoading || !scanResult}>
                      {sitemapLoading ? <><span style={S.spinner} /> Checking�</> : sitemapResult ? "?? Re-check" : "Check Sitemap"}
                    </button>
                  </div>
                  {!sitemapResult && !sitemapLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Detect sitemap.xml and verify this URL is included for Google indexing.</div>}
                  {sitemapResult && (
                    <div>
                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 10 }}>
                        <span style={{ fontSize: 13 }}>Sitemap found: <strong style={{ color: sitemapResult.sitemapFound ? "#22c55e" : "#ef4444" }}>{sitemapResult.sitemapFound ? "? Yes" : "? No"}</strong></span>
                        {sitemapResult.sitemapFound && <span style={{ fontSize: 13 }}>URL included: <strong style={{ color: sitemapResult.urlIncluded ? "#22c55e" : "#ef4444" }}>{sitemapResult.urlIncluded ? "? Yes" : "? No"}</strong></span>}
                        {sitemapResult.urlCount && <span style={{ fontSize: 13, color: "#71717a" }}>{sitemapResult.urlCount} URLs in sitemap</span>}
                      </div>
                      {sitemapResult.sitemapUrl && <div style={{ fontSize: 12, color: "#71717a" }}>Sitemap: {sitemapResult.sitemapUrl}</div>}
                      {sitemapResult.tip && <div style={{ fontSize: 13, color: "#fbbf24", marginTop: 8 }}>?? {sitemapResult.tip}</div>}
                    </div>
                  )}
                </div>

                {/* -- OG Tag Validator -- */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: ogValidResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? OG & Social Card Validator</div>
                    <button style={S.btn(ogValidResult ? undefined : "primary")} onClick={runOgValid} disabled={ogValidLoading || !scanResult}>
                      {ogValidLoading ? <><span style={S.spinner} /> Validating�</> : ogValidResult ? "?? Re-validate" : "Validate OG Tags"}
                    </button>
                  </div>
                  {!ogValidResult && !ogValidLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Full OG + Twitter Card audit. Validates og:image is accessible.</div>}
                  {ogValidResult && (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 8, marginBottom: 12 }}>
                        {(ogValidResult.tags || []).map((tag, i) => (
                          <div key={i} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "8px 12px" }}>
                            <div style={{ fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase" }}>{tag.name}</div>
                            <div style={{ fontSize: 12, color: tag.present ? "#fafafa" : "#ef4444", marginTop: 2 }}>{tag.present ? (tag.value || "Set ?").slice(0, 80) : "? Missing"}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 10 }}>
                        <span style={{ fontSize: 13 }}>OG Score: <strong style={{ color: ogValidResult.score >= 80 ? "#22c55e" : ogValidResult.score >= 50 ? "#eab308" : "#ef4444" }}>{ogValidResult.score}/100</strong></span>
                        {ogValidResult.imageOk !== undefined && <span style={{ fontSize: 13 }}>Image reachable: <strong style={{ color: ogValidResult.imageOk ? "#22c55e" : "#ef4444" }}>{ogValidResult.imageOk ? "?" : "?"}</strong></span>}
                      </div>
                    </div>
                  )}
                </div>

                {/* -- Schema Generators -- */}
                <div style={S.card}>
                  <div style={S.cardTitle}>?? Additional Schema Generators</div>

                  {/* Breadcrumb */}
                  <div style={{ borderBottom: "1px solid #27272a", paddingBottom: 14, marginBottom: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#e4e4e7" }}>?? BreadcrumbList Schema</div>
                    <button style={S.btn(breadcrumbResult ? undefined : "primary")} onClick={runBreadcrumb} disabled={breadcrumbLoading || !scanResult}>
                      {breadcrumbLoading ? <><span style={S.spinner} /> Generating�</> : breadcrumbResult ? "?? Regenerate" : "Generate Breadcrumb JSON-LD"}
                    </button>
                    {breadcrumbResult && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ ...S.row, gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: "#86efac" }}>? {breadcrumbResult.breadcrumbs?.length} breadcrumb items generated</span>
                          <button style={{ ...S.btn(), fontSize: 11, padding: "3px 10px" }} onClick={() => navigator.clipboard.writeText(breadcrumbResult.scriptTag || "")}>?? Copy</button>
                        </div>
                        <pre style={{ ...S.fixCode, maxHeight: 180 }}>{breadcrumbResult.scriptTag}</pre>
                      </div>
                    )}
                  </div>

                  {/* HowTo */}
                  <div style={{ borderBottom: "1px solid #27272a", paddingBottom: 14, marginBottom: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#e4e4e7" }}>?? HowTo Schema (AI) <span style={{ fontSize: 11, color: "#71717a", fontWeight: 400 }}>2 credits</span></div>
                    <div style={{ ...S.row, gap: 8, marginBottom: 8 }}>
                      <input style={S.input} placeholder="HowTo title (e.g. How to set up Shopify email automation)" value={howtoTitle} onChange={e => setHowtoTitle(e.target.value)} />
                      <button style={S.btn("primary")} onClick={runHowto} disabled={howtoLoading || !howtoTitle.trim()}>
                        {howtoLoading ? <><span style={S.spinner} /> Generating�</> : "Generate"}
                      </button>
                    </div>
                    {howtoResult && (
                      <div>
                        <div style={{ ...S.row, gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: "#86efac" }}>? {howtoResult.stepCount} steps generated</span>
                          <button style={{ ...S.btn(), fontSize: 11, padding: "3px 10px" }} onClick={() => navigator.clipboard.writeText(howtoResult.scriptTag || "")}>?? Copy</button>
                        </div>
                        <pre style={{ ...S.fixCode, maxHeight: 180 }}>{howtoResult.scriptTag}</pre>
                      </div>
                    )}
                  </div>

                  {/* Video Schema */}
                  <div style={{ borderBottom: "1px solid #27272a", paddingBottom: 14, marginBottom: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#e4e4e7" }}>?? VideoObject Schema</div>
                    <button style={S.btn(videoSchemaResult ? undefined : "primary")} onClick={runVideoSchema} disabled={videoSchemaLoading || !scanResult}>
                      {videoSchemaLoading ? <><span style={S.spinner} /> Detecting�</> : videoSchemaResult ? "?? Regenerate" : "Detect Videos + Generate Schema"}
                    </button>
                    {videoSchemaResult && !videoSchemaResult.embeds?.length && <div style={{ fontSize: 13, color: "#71717a", marginTop: 8 }}>No YouTube/Vimeo embeds found on this page.</div>}
                    {videoSchemaResult?.embeds?.length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 12, color: "#86efac", marginBottom: 6 }}>? {videoSchemaResult.embeds.length} video embed(s) found</div>
                        <button style={{ ...S.btn(), fontSize: 11, padding: "3px 10px" }} onClick={() => navigator.clipboard.writeText(videoSchemaResult.scriptTag || "")}>?? Copy JSON-LD</button>
                        <pre style={{ ...S.fixCode, maxHeight: 180, marginTop: 8 }}>{videoSchemaResult.scriptTag}</pre>
                      </div>
                    )}
                  </div>

                  {/* Review Schema */}
                  <div style={{ borderBottom: "1px solid #27272a", paddingBottom: 14, marginBottom: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#e4e4e7" }}>? Review / AggregateRating Schema</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, marginBottom: 8 }}>
                      <input style={S.input} placeholder="Item name (e.g. Shopify Dropshipping Course)" value={reviewName} onChange={e => setReviewName(e.target.value)} />
                      <input style={{ ...S.input, maxWidth: 90 }} placeholder="Rating" value={reviewRating} onChange={e => setReviewRating(e.target.value)} />
                      <input style={{ ...S.input, maxWidth: 90 }} placeholder="Reviews" value={reviewCount} onChange={e => setReviewCount(e.target.value)} />
                    </div>
                    <button style={S.btn("primary")} onClick={runReviewSchema} disabled={reviewLoading || !reviewName.trim()}>
                      {reviewLoading ? <><span style={S.spinner} /> Generating�</> : "Generate Review Schema"}
                    </button>
                    {reviewResult && (
                      <div style={{ marginTop: 10 }}>
                        <button style={{ ...S.btn(), fontSize: 11, padding: "3px 10px" }} onClick={() => navigator.clipboard.writeText(reviewResult.scriptTag || "")}>?? Copy JSON-LD</button>
                        <pre style={{ ...S.fixCode, maxHeight: 180, marginTop: 8 }}>{reviewResult.scriptTag}</pre>
                      </div>
                    )}
                  </div>

                  {/* Organization Schema */}
                  <div style={{ borderBottom: "1px solid #27272a", paddingBottom: 14, marginBottom: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#e4e4e7" }}>?? Organization Schema</div>
                    <div style={{ ...S.row, gap: 8, marginBottom: 8 }}>
                      <input style={S.input} placeholder="Organization / brand name" value={orgName} onChange={e => setOrgName(e.target.value)} />
                      <input style={S.input} placeholder="Website URL" value={orgUrl} onChange={e => setOrgUrl(e.target.value)} />
                      <button style={S.btn("primary")} onClick={runOrgSchema} disabled={orgLoading || !orgName.trim()}>
                        {orgLoading ? <><span style={S.spinner} /> Generating�</> : "Generate"}
                      </button>
                    </div>
                    {orgResult && (
                      <div>
                        <button style={{ ...S.btn(), fontSize: 11, padding: "3px 10px" }} onClick={() => navigator.clipboard.writeText(orgResult.scriptTag || "")}>?? Copy JSON-LD</button>
                        <pre style={{ ...S.fixCode, maxHeight: 150, marginTop: 8 }}>{orgResult.scriptTag}</pre>
                      </div>
                    )}
                  </div>

                  {/* Speakable Schema */}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "#e4e4e7" }}>?? Speakable Schema (Voice Search)</div>
                    <button style={S.btn(speakableResult ? undefined : "primary")} onClick={runSpeakable} disabled={speakableLoading || !scanResult}>
                      {speakableLoading ? <><span style={S.spinner} /> Generating�</> : speakableResult ? "?? Regenerate" : "Generate Speakable Schema"}
                    </button>
                    {speakableResult && (
                      <div style={{ marginTop: 10 }}>
                        <button style={{ ...S.btn(), fontSize: 11, padding: "3px 10px" }} onClick={() => navigator.clipboard.writeText(speakableResult.scriptTag || "")}>?? Copy JSON-LD</button>
                        <pre style={{ ...S.fixCode, maxHeight: 150, marginTop: 8 }}>{speakableResult.scriptTag}</pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* -- Search Intent Classifier -- */}
                <div style={S.card}>
                  <div style={S.cardTitle}>?? Search Intent Classifier <span style={{ fontSize: 11, color: "#71717a", fontWeight: 400 }}>2 credits</span></div>
                  <div style={{ ...S.row, gap: 8, marginBottom: 8 }}>
                    <input style={S.input} placeholder="Keyword to classify (e.g. best email marketing apps)" value={intentKeyword} onChange={e => setIntentKeyword(e.target.value)} onKeyDown={e => e.key === "Enter" && !intentLoading && runIntent()} />
                    <button style={S.btn("primary")} onClick={runIntent} disabled={intentLoading || !intentKeyword.trim()}>
                      {intentLoading ? <><span style={S.spinner} /> Classifying�</> : "Classify Intent"}
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
                      {intentResult.contentRecommendation && <div style={{ fontSize: 13, color: "#fbbf24" }}>?? {intentResult.contentRecommendation}</div>}
                    </div>
                  )}
                </div>

                {/* -- AI Overview Eligibility -- */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: aiOverviewResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Google AI Overview Eligibility <span style={{ fontSize: 11, color: "#71717a", fontWeight: 400 }}>2 credits</span></div>
                    <button style={S.btn(aiOverviewResult ? undefined : "primary")} onClick={runAiOverview} disabled={aiOverviewLoading || !scanResult}>
                      {aiOverviewLoading ? <><span style={S.spinner} /> Scoring�</> : aiOverviewResult ? "?? Re-score" : "Check Eligibility"}
                    </button>
                  </div>
                  {!aiOverviewResult && !aiOverviewLoading && <div style={{ fontSize: 13, color: "#52525b" }}>AI scores your page 0�100 for candidacy in Google's AI Overview/SGE answers.</div>}
                  {aiOverviewResult && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
                        <div style={S.scoreRing(aiOverviewResult.score)}>{aiOverviewResult.score}</div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: aiOverviewResult.score >= 70 ? "#22c55e" : aiOverviewResult.score >= 50 ? "#eab308" : "#ef4444" }}>{aiOverviewResult.verdict}</div>
                          <div style={{ fontSize: 12, color: "#71717a" }}>AI Overview Eligibility Score</div>
                        </div>
                      </div>
                      {aiOverviewResult.strengths?.map((s, i) => <div key={i} style={{ fontSize: 13, color: "#86efac", marginBottom: 3 }}>? {s}</div>)}
                      {aiOverviewResult.improvements?.map((s, i) => <div key={i} style={{ fontSize: 13, color: "#fbbf24", marginBottom: 3 }}>?? {s}</div>)}
                    </div>
                  )}
                </div>

                {/* -- Topical Authority Mapper -- */}
                <div style={S.card}>
                  <div style={S.cardTitle}>??? Topical Authority Mapper <span style={{ fontSize: 11, color: "#71717a", fontWeight: 400 }}>2 credits</span></div>
                  <div style={{ ...S.row, gap: 8, marginBottom: 8 }}>
                    <input style={S.input} placeholder="Main topic (e.g. email marketing for Shopify)" value={topicalKw} onChange={e => setTopicalKw(e.target.value)} />
                    <button style={S.btn("primary")} onClick={runTopical} disabled={topicalLoading || !topicalKw.trim()}>
                      {topicalLoading ? <><span style={S.spinner} /> Mapping�</> : "Map Topical Authority"}
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
                          {topicalResult.missingSubtopics.map((m, i) => <div key={i} style={{ fontSize: 13, color: "#fbbf24", marginBottom: 3 }}>� {m}</div>)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* -- Meta Description Optimizer -- */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: metaOptResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? AI Meta Description Optimizer <span style={{ fontSize: 11, color: "#71717a", fontWeight: 400 }}>2 credits</span></div>
                    <button style={S.btn(metaOptResult ? undefined : "primary")} onClick={runMetaOpt} disabled={metaOptLoading || !scanResult}>
                      {metaOptLoading ? <><span style={S.spinner} /> Optimizing�</> : metaOptResult ? "?? Regenerate" : "Generate 3 Variants"}
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

                {/* -- Content Decay Predictor -- */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: decayResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Content Decay Predictor <span style={{ fontSize: 11, color: "#71717a", fontWeight: 400 }}>2 credits</span></div>
                    <button style={S.btn(decayResult ? undefined : "primary")} onClick={runDecay} disabled={decayLoading || !scanResult}>
                      {decayLoading ? <><span style={S.spinner} /> Predicting�</> : decayResult ? "?? Re-predict" : "Predict Decay"}
                    </button>
                  </div>
                  {!decayResult && !decayLoading && <div style={{ fontSize: 13, color: "#52525b" }}>AI predicts content freshness urgency: Immediate / Soon / Eventually / Evergreen.</div>}
                  {decayResult && (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
                        <span style={{ fontSize: 20, fontWeight: 800, color: decayResult.urgency === "Immediate" ? "#ef4444" : decayResult.urgency === "Soon" ? "#eab308" : decayResult.urgency === "Eventually" ? "#22c55e" : "#818cf8" }}>
                          {decayResult.urgency === "Immediate" ? "??" : decayResult.urgency === "Soon" ? "??" : decayResult.urgency === "Eventually" ? "??" : "??"} {decayResult.urgency}
                        </span>
                        {decayResult.decayScore !== undefined && <span style={{ fontSize: 13, color: "#a1a1aa" }}>Decay score: {decayResult.decayScore}/100</span>}
                      </div>
                      {decayResult.staleElements?.length > 0 && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={S.heading}>Stale Elements to Update</div>
                          {decayResult.staleElements.map((el, i) => <div key={i} style={{ fontSize: 13, color: "#fbbf24", marginBottom: 3 }}>� {el}</div>)}
                        </div>
                      )}
                      {decayResult.recommendation && <div style={{ fontSize: 13, color: "#a1a1aa" }}>{decayResult.recommendation}</div>}
                    </div>
                  )}
                </div>

                {/* -- Competitor Gap Analysis -- */}
                <div style={S.card}>
                  <div style={S.cardTitle}>?? Competitor Content Gap Analysis <span style={{ fontSize: 11, color: "#71717a", fontWeight: 400 }}>2 credits</span></div>
                  <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 8 }}>Enter up to 3 competitor URLs (one per line) to compare against your page.</div>
                  <textarea style={{ ...S.textarea, minHeight: 70 }} placeholder={"https://competitor1.com/blog/post\nhttps://competitor2.com/blog/post"} value={compUrls} onChange={e => setCompUrls(e.target.value)} />
                  <button style={{ ...S.btn("primary"), marginTop: 8 }} onClick={runCompGap} disabled={compLoading || !scanResult || !compUrls.trim()}>
                    {compLoading ? <><span style={S.spinner} /> Analyzing�</> : "Analyze Gaps"}
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
                          <div style={S.heading}>? Quick Wins</div>
                          {compResult.quickWins.map((w, i) => <div key={i} style={{ fontSize: 13, color: "#86efac", marginBottom: 3 }}>� {w}</div>)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* -- Keyword Cannibalization -- */}
                <div style={S.card}>
                  <div style={S.cardTitle}>?? Keyword Cannibalization Checker</div>
                  <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 8 }}>Paste multiple URLs targeting the same keyword (one per line). Requires target keyword above.</div>
                  <textarea style={{ ...S.textarea, minHeight: 80 }} placeholder={"https://yourstore.com/blog/post-1\nhttps://yourstore.com/blog/post-2"} value={cannibUrls} onChange={e => setCannibUrls(e.target.value)} />
                  <button style={{ ...S.btn("primary"), marginTop: 8 }} onClick={runCannib} disabled={cannibLoading || !cannibUrls.trim()}>
                    {cannibLoading ? <><span style={S.spinner} /> Checking�</> : "Check Cannibalization"}
                  </button>
                  {cannibResult && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 13, color: cannibResult.cannibalizing ? "#ef4444" : "#22c55e", marginBottom: 10, fontWeight: 700 }}>
                        {cannibResult.cannibalizing ? "?? Keyword cannibalization detected" : "? No cannibalization detected"}
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
                      {cannibResult.recommendation && <div style={{ fontSize: 13, color: "#fbbf24", marginTop: 8 }}>?? {cannibResult.recommendation}</div>}
                    </div>
                  )}
                </div>

                {/* -- Anchor Text Audit -- */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: anchorResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Anchor Text Audit</div>
                    <button style={S.btn(anchorResult ? undefined : "primary")} onClick={runAnchor} disabled={anchorLoading || !scanResult}>
                      {anchorLoading ? <><span style={S.spinner} /> Auditing�</> : anchorResult ? "?? Re-audit" : "Audit Anchors"}
                    </button>
                  </div>
                  {!anchorResult && !anchorLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Internal/external anchor text diversity � detect generic anchors (click here, read more).</div>}
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
                              "{a.text}" � {a.count}�
                            </div>
                          ))}
                        </div>
                      )}
                      {anchorResult.tips?.map((t, i) => <div key={i} style={{ fontSize: 13, color: "#fbbf24", marginTop: 6 }}>?? {t}</div>)}
                    </div>
                  )}
                </div>

                {/* -- Table of Contents Generator -- */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: tocResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Table of Contents Generator</div>
                    <button style={S.btn(tocResult ? undefined : "primary")} onClick={runToc} disabled={tocLoading || !scanResult}>
                      {tocLoading ? <><span style={S.spinner} /> Generating�</> : tocResult ? "?? Regenerate" : "Generate ToC"}
                    </button>
                  </div>
                  {!tocResult && !tocLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Auto-generate a linked Table of Contents HTML snippet from your page headings.</div>}
                  {tocResult && (
                    <div>
                      <div style={{ ...S.row, gap: 8, marginBottom: 10 }}>
                        <span style={{ fontSize: 12, color: "#86efac" }}>? {tocResult.itemCount} headings extracted</span>
                        <button style={{ ...S.btn(), fontSize: 11, padding: "3px 10px" }} onClick={() => navigator.clipboard.writeText(tocResult.html || "")}>?? Copy HTML</button>
                      </div>
                      <pre style={{ ...S.fixCode, maxHeight: 200 }}>{tocResult.html}</pre>
                    </div>
                  )}
                </div>

                {/* -- Section Word Count -- */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: sectionWcResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Section Word Count Depth</div>
                    <button style={S.btn(sectionWcResult ? undefined : "primary")} onClick={runSectionWc} disabled={sectionWcLoading || !scanResult}>
                      {sectionWcLoading ? <><span style={S.spinner} /> Analyzing�</> : sectionWcResult ? "?? Re-analyze" : "Analyze Sections"}
                    </button>
                  </div>
                  {!sectionWcResult && !sectionWcLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Per-section word depth analysis � identify thin sections that need expansion.</div>}
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
                      {sectionWcResult.thinSections > 0 && <div style={{ fontSize: 13, color: "#fbbf24", marginTop: 8 }}>?? {sectionWcResult.thinSections} thin section(s) detected. Expand each to at least 200 words for better topical depth.</div>}
                    </div>
                  )}
                </div>

                {/* -- People Also Ask -- */}
                <div style={S.card}>
                  <div style={S.cardTitle}>? People Also Ask Generator <span style={{ fontSize: 11, color: "#71717a", fontWeight: 400 }}>2 credits</span></div>
                  <div style={{ ...S.row, gap: 8, marginBottom: 8 }}>
                    <input style={S.input} placeholder="Keyword (e.g. shopify abandoned cart)" value={paaKw} onChange={e => setPaaKw(e.target.value)} onKeyDown={e => e.key === "Enter" && !paaLoading && runPaa()} />
                    <button style={S.btn("primary")} onClick={runPaa} disabled={paaLoading || !paaKw.trim()}>
                      {paaLoading ? <><span style={S.spinner} /> Generating�</> : "Generate PAA Questions"}
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

                {/* -- Entity Detection -- */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: entityResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? NLP Entity Detection <span style={{ fontSize: 11, color: "#71717a", fontWeight: 400 }}>2 credits</span></div>
                    <button style={S.btn(entityResult ? undefined : "primary")} onClick={runEntity} disabled={entityLoading || !scanResult}>
                      {entityLoading ? <><span style={S.spinner} /> Extracting�</> : entityResult ? "?? Re-extract" : "Extract Entities"}
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

                {/* -- SERP Feature Eligibility -- */}
                <div style={S.card}>
                  <div style={{ ...S.row, alignItems: "center", marginBottom: serpFeatResult ? 14 : 0 }}>
                    <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? SERP Feature Eligibility</div>
                    <button style={S.btn(serpFeatResult ? undefined : "primary")} onClick={runSerpFeatures} disabled={serpFeatLoading || !scanResult}>
                      {serpFeatLoading ? <><span style={S.spinner} /> Checking�</> : serpFeatResult ? "?? Re-check" : "Check SERP Features"}
                    </button>
                  </div>
                  {!serpFeatResult && !serpFeatLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Check eligibility for Featured Snippet, PAA, Image Pack, Video Carousel, HowTo, FAQ, Review Stars, Breadcrumbs, Sitelinks.</div>}
                  {serpFeatResult && (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 10 }}>
                        {(serpFeatResult.features || []).map((feat, i) => (
                          <div key={i} style={{ background: feat.eligible ? "#14532d22" : "#09090b", border: `1px solid ${feat.eligible ? "#14532d" : "#27272a"}`, borderRadius: 8, padding: "10px 14px" }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: feat.eligible ? "#86efac" : "#a1a1aa", marginBottom: 4 }}>{feat.eligible ? "?" : "?"} {feat.name}</div>
                            <div style={{ fontSize: 11, color: "#71717a" }}>{feat.reason}</div>
                            {!feat.eligible && feat.tip && <div style={{ fontSize: 11, color: "#fbbf24", marginTop: 4 }}>?? {feat.tip}</div>}
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
                  <div style={S.cardTitle}>?? Issues ({filteredIssues.length}/{issues.length})</div>
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
                              {fixLoading === k ? <><span style={S.spinner} /> Generating�</> : "?? AI Generate Fix (1 credit)"}
                            </button>
                            {fixes[k] && (
                              <div style={S.fixPanel}>
                                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{fixes[k].explanation || fixes[k].location}</div>
                                {fixes[k].code && <pre style={S.fixCode}>{fixes[k].code}</pre>}
                                <div style={{ marginTop: 6, fontSize: 11, color: "#71717a" }}>Type: {fixes[k].fixType} � Priority: {fixes[k].priority}</div>
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
                <div style={{ fontSize: 42, marginBottom: 12 }}>??</div>
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
              <div style={S.cardTitle}>?? AI Keyword Research</div>
              <div style={{ ...S.row, marginBottom: 10 }}>
                <input style={S.input} placeholder="Seed keyword (e.g. shopify dropshipping)" value={seedKw} onChange={e => setSeedKw(e.target.value)} onKeyDown={e => e.key === "Enter" && !kwLoading && runKwResearch()} />
                <input style={{ ...S.input, maxWidth: 260 }} placeholder="Niche (optional)" value={kwNiche} onChange={e => setKwNiche(e.target.value)} />
                <button style={S.btn("primary")} onClick={runKwResearch} disabled={kwLoading || !seedKw.trim()}>
                  {kwLoading ? <><span style={S.spinner} /> Researching�</> : "Research (2 credits)"}
                </button>
              </div>
            </div>

            {kwErr && <div style={S.err}>{kwErr}</div>}

            {kwLoading && <div style={S.empty}><span style={S.spinner} /><div style={{ marginTop: 12 }}>Running AI keyword research�</div></div>}

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
                    <div style={S.cardTitle}>?? Long-Tail Keywords</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {kwResearch.longTailKeywords.map((kw, i) => <span key={i} style={{ ...S.pill("low"), fontSize: 12, padding: "4px 12px" }}>{kw}</span>)}
                    </div>
                  </div>
                )}

                {/* Questions */}
                {kwResearch.questionsToAnswer?.length > 0 && (
                  <div style={S.card}>
                    <div style={S.cardTitle}>? Questions to Answer</div>
                    {kwResearch.questionsToAnswer.map((q, i) => <div key={i} style={{ fontSize: 13, color: "#d4d4d8", marginBottom: 4 }}>� {q}</div>)}
                  </div>
                )}

                {/* Content ideas */}
                {kwResearch.contentIdeas?.length > 0 && (
                  <div style={S.card}>
                    <div style={S.cardTitle}>?? Content Ideas</div>
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
              <div style={S.cardTitle}>?? LSI &amp; Semantic Keywords</div>
              <div style={{ fontSize: 13, color: "#71717a", marginBottom: 12 }}>AI suggests semantically related terms to weave throughout your post for topical authority. Click any chip to copy.</div>
              <div style={{ ...S.row, marginBottom: 8, gap: 8 }}>
                <input style={S.input} placeholder="Primary keyword to expand (e.g. email marketing)" value={seedKw} onChange={e => setSeedKw(e.target.value)} onKeyDown={e => e.key === "Enter" && !lsiLoading && runLsiKeywords()} />
                <input style={{ ...S.input, maxWidth: 220 }} placeholder="Niche (optional)" value={kwNiche} onChange={e => setKwNiche(e.target.value)} />
                <button style={S.btn("primary")} onClick={runLsiKeywords} disabled={lsiLoading || !seedKw.trim()}>
                  {lsiLoading ? <><span style={S.spinner} /> Generating�</> : "? Generate LSI (2 credits)"}
                </button>
              </div>
              {lsiErr && <div style={S.err}>{lsiErr}</div>}
              {lsiLoading && <div style={S.empty}><span style={S.spinner} /><div style={{ marginTop: 12 }}>Generating semantic keywords�</div></div>}
              {lsiResult && (
                <div>
                  {["high", "medium", "low"].map(pri => {
                    const kws = (lsiResult.lsi || []).filter(k => k.priority === pri);
                    if (!kws.length) return null;
                    return (
                      <div key={pri} style={{ marginBottom: 14 }}>
                        <div style={S.heading}>{pri === "high" ? "?? High Priority" : pri === "medium" ? "?? Medium Priority" : "? Supporting Terms"}</div>
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
                      <div style={S.heading}>?? Topic Clusters to Cover</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {lsiResult.topicClusters.map((c, i) => <span key={i} style={{ ...S.pill("low"), background: "#14532d22", border: "1px solid #14532d", color: "#86efac" }}>{c}</span>)}
                      </div>
                    </div>
                  )}
                  {lsiResult.contentGaps?.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={S.heading}>??? Content Gaps</div>
                      {lsiResult.contentGaps.map((g, i) => <div key={i} style={{ fontSize: 13, color: "#fbbf24", marginBottom: 3 }}>� {g}</div>)}
                    </div>
                  )}
                  {lsiResult.tip && (
                    <div style={{ background: "#1e3a5f22", border: "1px solid #1e3a5f", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#93c5fd" }}>?? {lsiResult.tip}</div>
                  )}
                </div>
              )}
            </div>

            {!kwResearch && !kwLoading && !kwErr && (
              <div style={S.empty}>
                <div style={{ fontSize: 42, marginBottom: 12 }}>??</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>AI Keyword Research</div>
                <div style={{ fontSize: 13 }}>Enter a seed keyword to discover keyword clusters, long-tail variations, and content ideas.</div>
              </div>
            )}
          </>
        )}

        {/* ================================================================
            KEYWORDS TAB EXTENSIONS (Batch 5)
            ================================================================ */}
        {tab === "Keywords" && (
          <>
            {/* Low Difficulty Finder */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Low-Difficulty Keyword Finder</div>
              <div style={S.cardDesc}>Find quick-win keywords with low competition � ideal for new/low-DA sites (Ahrefs methodology).</div>
              <input style={{ ...S.input, marginBottom: 6 }} placeholder="Seed keyword (e.g. SEO tips)..." value={lowDiffSeed} onChange={e => setLowDiffSeed(e.target.value)} />
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Your site DA / domain authority (optional)..." value={lowDiffDA} onChange={e => setLowDiffDA(e.target.value)} />
              <button style={S.btn("primary")} onClick={runLowDiff} disabled={lowDiffLoading || !lowDiffSeed.trim()}>
                {lowDiffLoading ? <><span style={S.spinner} /> Finding�</> : "Find Low-Difficulty Keywords"}
              </button>
              {lowDiffResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ marginBottom: 8, fontWeight: 600 }}>?? {lowDiffResult.lowDifficultyKeywords?.length || 0} low-difficulty opportunities found</div>
                  {lowDiffResult.quickWinStrategy && <div style={{ color: "#4ade80", fontSize: 13, marginBottom: 8 }}>?? Strategy: {lowDiffResult.quickWinStrategy}</div>}
                  {lowDiffResult.lowDifficultyKeywords?.map((k, i) => (
                    <div key={i} style={{ padding: "7px 0", borderBottom: "1px solid #27272a" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 600 }}>{k.keyword}</span>
                        <span style={{ background: "#14532d", color: "#4ade80", borderRadius: 4, padding: "1px 6px", fontSize: 11 }}>KD ={k.estimatedKD}</span>
                        <span style={{ background: "#3f3f46", borderRadius: 4, padding: "1px 6px", fontSize: 11 }}>{k.intent}</span>
                        <span style={{ color: "#a1a1aa", fontSize: 11 }}>{k.estimatedMonthlySearches} searches/mo</span>
                      </div>
                      <div style={{ color: "#a1a1aa", fontSize: 12, marginTop: 2 }}>{k.whyEasy}</div>
                    </div>
                  ))}
                  {lowDiffResult.estimatedTrafficPotential && <div style={{ color: "#818cf8", marginTop: 8, fontSize: 13 }}>?? Potential traffic: {lowDiffResult.estimatedTrafficPotential}</div>}
                </div>
              )}
            </div>

            {/* Cannibalization Detector */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Keyword Cannibalization Detector</div>
              <div style={S.cardDesc}>Find pages competing for the same intent � hurting each other's rankings (Semrush methodology).</div>
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Your domain (e.g. yoursite.com)..." value={cannibalDomain} onChange={e => setCannibalDomain(e.target.value)} />
              <button style={S.btn("primary")} onClick={runCannibalization} disabled={cannibalLoading || !cannibalDomain.trim()}>
                {cannibalLoading ? <><span style={S.spinner} /> Detecting�</> : "Detect Cannibalization"}
              </button>
              {cannibalResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>Risk: <b style={{ color: cannibalResult.cannibalizationRisk === "high" ? "#f87171" : cannibalResult.cannibalizationRisk === "medium" ? "#fbbf24" : "#4ade80" }}>{cannibalResult.cannibalizationRisk?.toUpperCase()}</b></span>
                  </div>
                  {cannibalResult.detectedIssues?.map((issue, i) => (
                    <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #27272a" }}>
                      <div style={{ fontWeight: 600 }}>?? {issue.keyword}</div>
                      <div style={{ color: "#a1a1aa", fontSize: 12 }}>Primary URL: {issue.primaryUrl} � Competing: {issue.secondaryUrls?.join(", ")}</div>
                    </div>
                  ))}
                  {cannibalResult.topActions?.length > 0 && (
                    <div style={{ marginTop: 8 }}><div style={{ fontWeight: 600, marginBottom: 4 }}>Top actions:</div>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>{cannibalResult.topActions.map((a, i) => <li key={i} style={{ fontSize: 13 }}>{a}</li>)}</ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ================================================================
            CONTENT+ TAB (On-page quality)
            ================================================================ */}
        {tab === "Content+" && (
          <>
            <div style={{ ...S.card, marginTop: 16 }}>
              <div style={{ ...S.row, alignItems: "center", marginBottom: sentenceVarietyResult ? 14 : 0 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Sentence Variety</div>
                <button style={S.btn(sentenceVarietyResult ? undefined : "primary")} onClick={runSentenceVariety} disabled={sentenceVarietyLoading || !scanResult}>
                  {sentenceVarietyLoading ? <><span style={S.spinner} /> Checking�</> : sentenceVarietyResult ? "?? Re-check" : "Check"}
                </button>
              </div>
              {!sentenceVarietyResult && !sentenceVarietyLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Distribution of short/medium/long sentences and variety score.</div>}
              {sentenceVarietyResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10 }}>
                  <div>Short: {sentenceVarietyResult.short}</div>
                  <div>Medium: {sentenceVarietyResult.medium}</div>
                  <div>Long: {sentenceVarietyResult.long}</div>
                  <div>Avg words: {sentenceVarietyResult.avgWordsPerSentence}</div>
                  <div>Score: {sentenceVarietyResult.varietyScore}</div>
                  <div style={{ color: "#93c5fd" }}>?? {sentenceVarietyResult.tip}</div>
                </div>
              )}
            </div>

            <div style={S.card}>
              <div style={{ ...S.row, alignItems: "center", marginBottom: emotionalToneResult ? 14 : 0 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Emotional Tone (AI)</div>
                <button style={S.btn(emotionalToneResult ? undefined : "primary")} onClick={runEmotionalTone} disabled={emotionalToneLoading || !scanResult}>
                  {emotionalToneLoading ? <><span style={S.spinner} /> Analyzing�</> : emotionalToneResult ? "?? Re-run" : "Analyze"}
                </button>
              </div>
              {!emotionalToneResult && !emotionalToneLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Detect primary tone, positivity, urgency, trust, and emotions.</div>}
              {emotionalToneResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div>Primary: {emotionalToneResult.primaryTone} � Tone score: {emotionalToneResult.toneScore}</div>
                  <div>Positivity: {emotionalToneResult.positivity} � Urgency: {emotionalToneResult.urgency} � Trust: {emotionalToneResult.trustworthiness}</div>
                  <div>Emotions: {(emotionalToneResult.emotions || []).join(", ")}</div>
                  <div style={{ color: "#93c5fd", marginTop: 6 }}>?? {emotionalToneResult.recommendation}</div>
                </div>
              )}
            </div>

            <div style={S.card}>
              <div style={{ ...S.row, alignItems: "center", marginBottom: jargonResult ? 14 : 0 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Jargon & Complexity</div>
                <button style={S.btn(jargonResult ? undefined : "primary")} onClick={runJargonDetector} disabled={jargonLoading || !scanResult}>
                  {jargonLoading ? <><span style={S.spinner} /> Checking�</> : jargonResult ? "?? Re-check" : "Check"}
                </button>
              </div>
              {!jargonResult && !jargonLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Detect jargon, long-word ratio, and complexity score.</div>}
              {jargonResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div>Words: {jargonResult.totalWords} � Long words: {jargonResult.longWordCount} � Complex %: {jargonResult.complexWordRatio}%</div>
                  <div>Jargon: {(jargonResult.jargonWords || []).join(", ") || "None"}</div>
                  <div style={{ color: "#93c5fd", marginTop: 6 }}>?? {jargonResult.tip}</div>
                </div>
              )}
            </div>

            <div style={S.card}>
              <div style={{ ...S.row, alignItems: "center", marginBottom: expertiseResult ? 14 : 0 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? E-E-A-T Signals</div>
                <button style={S.btn(expertiseResult ? undefined : "primary")} onClick={runExpertiseSignals} disabled={expertiseLoading || !scanResult}>
                  {expertiseLoading ? <><span style={S.spinner} /> Checking�</> : expertiseResult ? "?? Re-check" : "Check"}
                </button>
              </div>
              {!expertiseResult && !expertiseLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Statistics, citations, author bio, external links, and expertise score.</div>}
              {expertiseResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div>Score: {expertiseResult.expertiseScore} ({expertiseResult.grade})</div>
                  <div>Stats: {expertiseResult.signals.statistics} � Citations: {expertiseResult.signals.citations} � Author bio: {expertiseResult.signals.authorBio ? "Yes" : "No"}</div>
                  <div style={{ color: "#93c5fd", marginTop: 6 }}>?? {expertiseResult.tip}</div>
                </div>
              )}
            </div>

            <div style={S.card}>
              <div style={{ ...S.row, alignItems: "center", marginBottom: multimediaResult ? 14 : 0 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>??? Multimedia Score</div>
                <button style={S.btn(multimediaResult ? undefined : "primary")} onClick={runMultimediaScore} disabled={multimediaLoading || !scanResult}>
                  {multimediaLoading ? <><span style={S.spinner} /> Checking�</> : multimediaResult ? "?? Re-check" : "Check"}
                </button>
              </div>
              {!multimediaResult && !multimediaLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Counts images, video, audio, charts, tables and media per words.</div>}
              {multimediaResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8", display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 8 }}>
                  <div>Images: {multimediaResult.images}</div>
                  <div>Videos: {multimediaResult.videos}</div>
                  <div>Audio: {multimediaResult.audios}</div>
                  <div>Tables: {multimediaResult.tables}</div>
                  <div>Score: {multimediaResult.multimediaScore}</div>
                  <div style={{ color: "#93c5fd" }}>?? {multimediaResult.tip}</div>
                </div>
              )}
            </div>

            <div style={S.card}>
              <div style={{ ...S.row, alignItems: "center", marginBottom: questionsResult ? 14 : 0 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>? Questions & PAA</div>
                <button style={S.btn(questionsResult ? undefined : "primary")} onClick={runQuestionsCount} disabled={questionsLoading || !scanResult}>
                  {questionsLoading ? <><span style={S.spinner} /> Checking�</> : questionsResult ? "?? Re-check" : "Check"}
                </button>
              </div>
              {!questionsResult && !questionsLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Question sentences, heading questions, engagement score.</div>}
              {questionsResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div>Total questions: {questionsResult.totalQuestions} � Headings: {questionsResult.questionHeadingCount} � Engagement: {questionsResult.engagementScore}</div>
                  {(questionsResult.headingQuestions || []).slice(0, 5).map((q, i) => <div key={i} style={{ color: "#93c5fd" }}>� {q}</div>)}
                  {questionsResult.tip && <div style={{ color: "#93c5fd", marginTop: 6 }}>?? {questionsResult.tip}</div>}
                </div>
              )}
            </div>

            <div style={S.card}>
              <div style={{ ...S.row, alignItems: "center", marginBottom: introQualityResult ? 14 : 0 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Intro Quality</div>
                <button style={S.btn(introQualityResult ? undefined : "primary")} onClick={runIntroQuality} disabled={introQualityLoading || !scanResult}>
                  {introQualityLoading ? <><span style={S.spinner} /> Checking�</> : introQualityResult ? "?? Re-check" : "Check"}
                </button>
              </div>
              {!introQualityResult && !introQualityLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Hook strength, word count, stat/question detection.</div>}
              {introQualityResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div>Words: {introQualityResult.wordCount} � Score: {introQualityResult.introScore}</div>
                  <div>Has question: {introQualityResult.hasQuestion ? "Yes" : "No"} � Stat: {introQualityResult.hasStat ? "Yes" : "No"} � Hook: {introQualityResult.hasHook ? "Yes" : "No"}</div>
                  {(introQualityResult.issues || []).map((it, i) => <div key={i} style={{ color: "#fbbf24" }}>� {it}</div>)}
                  <div style={{ color: "#93c5fd", marginTop: 6 }}>?? {introQualityResult.tip}</div>
                </div>
              )}
            </div>

            <div style={S.card}>
              <div style={{ ...S.row, alignItems: "center", marginBottom: ctaAuditResult ? 14 : 0 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? CTA Audit</div>
                <button style={S.btn(ctaAuditResult ? undefined : "primary")} onClick={runCtaAudit} disabled={ctaAuditLoading || !scanResult}>
                  {ctaAuditLoading ? <><span style={S.spinner} /> Checking�</> : ctaAuditResult ? "?? Re-check" : "Check"}
                </button>
              </div>
              {!ctaAuditResult && !ctaAuditLoading && <div style={{ fontSize: 13, color: "#52525b" }}>CTA buttons, keyword density, final CTA presence.</div>}
              {ctaAuditResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div>Buttons: {ctaAuditResult.buttonCount} � CTA score: {ctaAuditResult.ctaScore}</div>
                  <div>CTA density: {ctaAuditResult.ctaDensity} � Final CTA: {ctaAuditResult.hasFinalCTA ? "Yes" : "No"}</div>
                  <div>Samples: {(ctaAuditResult.ctaTextSamples || []).join(" � ")}</div>
                  <div style={{ color: "#93c5fd", marginTop: 6 }}>?? {ctaAuditResult.tip}</div>
                </div>
              )}
            </div>

            <div style={S.card}>
              <div style={{ ...S.row, alignItems: "center", marginBottom: formattingResult ? 14 : 0 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Formatting Score</div>
                <button style={S.btn(formattingResult ? undefined : "primary")} onClick={runFormattingScore} disabled={formattingLoading || !scanResult}>
                  {formattingLoading ? <><span style={S.spinner} /> Checking�</> : formattingResult ? "?? Re-check" : "Check"}
                </button>
              </div>
              {!formattingResult && !formattingLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Lists, tables, bold, blockquotes, callouts, code.</div>}
              {formattingResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div>Score: {formattingResult.formattingScore} � Lists: {formattingResult.bullets + formattingResult.numbered}</div>
                  <div>Tables: {formattingResult.tables} � Blockquotes: {formattingResult.blockquotes}</div>
                  <div style={{ color: "#93c5fd", marginTop: 6 }}>?? {formattingResult.tip}</div>
                </div>
              )}
            </div>

            <div style={S.card}>
              <div style={{ ...S.row, alignItems: "center", marginBottom: thinContentResult ? 14 : 0 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Thin Content</div>
                <button style={S.btn(thinContentResult ? undefined : "primary")} onClick={runThinContent} disabled={thinContentLoading || !scanResult}>
                  {thinContentLoading ? <><span style={S.spinner} /> Checking�</> : thinContentResult ? "?? Re-check" : "Check"}
                </button>
              </div>
              {!thinContentResult && !thinContentLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Word count, headings, paragraphs, repetition ratio, depth score.</div>}
              {thinContentResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div>Words: {thinContentResult.wordCount} � Headings: {thinContentResult.headings} � Depth score: {thinContentResult.contentDepthScore}</div>
                  <div>Risk: {thinContentResult.thinContentRisk}</div>
                  <div style={{ color: "#93c5fd", marginTop: 6 }}>?? {thinContentResult.recommendation}</div>
                </div>
              )}
            </div>

            <div style={S.card}>
              <div style={{ ...S.row, alignItems: "center", marginBottom: passageIndexResult ? 14 : 0 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Passage Indexing</div>
                <button style={S.btn(passageIndexResult ? undefined : "primary")} onClick={runPassageIndex} disabled={passageIndexLoading || !scanResult || !kwInput.trim()}>
                  {passageIndexLoading ? <><span style={S.spinner} /> Checking�</> : passageIndexResult ? "?? Re-check" : "Check"}
                </button>
              </div>
              {!passageIndexResult && !passageIndexLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Find top self-contained passages for snippets.</div>}
              {passageIndexResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div>Score: {passageIndexResult.passageIndexingScore} � Passages: {passageIndexResult.totalPassagesAnalysed}</div>
                  {(passageIndexResult.topPassages || []).slice(0, 3).map((p, i) => <div key={i} style={{ color: "#93c5fd", marginTop: 4 }}>� {p.text}</div>)}
                  {(passageIndexResult.optimizationTips || []).map((t, i) => <div key={i} style={{ color: "#fbbf24" }}>?? {t}</div>)}
                </div>
              )}
            </div>

            {/* Content Freshness Score */}
            <div style={S.card}>
              <div style={S.cardTitle}>??? Content Freshness Score</div>
              <div style={S.cardDesc}>Detect how fresh or stale your content is � and get specific update recommendations to boost rankings.</div>
              <div style={S.row}>
                <button style={S.btn("primary")} onClick={runFreshnessScore} disabled={freshnessLoading || !url.trim()}>
                  {freshnessLoading ? <><span style={S.spinner} /> Analyzing�</> : "Check Freshness"}
                </button>
              </div>
              {freshnessResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>Freshness: <b style={{ color: freshnessResult.freshnessScore >= 70 ? "#4ade80" : freshnessResult.freshnessScore >= 40 ? "#facc15" : "#f87171" }}>{freshnessResult.freshnessScore}/100 ({freshnessResult.freshnessLabel})</b></span>
                    <span>Age: <b>{freshnessResult.daysOldEstimate}</b></span>
                  </div>
                  {freshnessResult.publishDateDetected !== 'not found' && <div style={{ marginBottom: 4 }}>Published: {freshnessResult.publishDateDetected}</div>}
                  <div style={{ marginBottom: 4 }}>Update priority: <b style={{ color: freshnessResult.updatePriority === "immediate" ? "#f87171" : "#facc15" }}>{freshnessResult.updatePriority}</b></div>
                  {freshnessResult.outdatedSignals?.length > 0 && <div style={{ marginBottom: 4 }}>Outdated signals: {freshnessResult.outdatedSignals.join(", ")}</div>}
                  {freshnessResult.updateRecommendations?.length > 0 && (
                    <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>{freshnessResult.updateRecommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>
                  )}
                </div>
              )}
            </div>

            {/* Skyscraper Gap Finder */}
            <div style={S.card}>
              <div style={S.cardTitle}>??? Skyscraper Gap Finder</div>
              <div style={S.cardDesc}>Apply the Skyscraper Technique � find every content gap you need to fill to outrank the top results.</div>
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Target keyword (optional, uses main URL keyword if blank)..." value={skyscraperKeyword} onChange={e => setSkyscraperKeyword(e.target.value)} />
              <button style={S.btn("primary")} onClick={runSkyscraperGap} disabled={skyscraperLoading || !url.trim()}>
                {skyscraperLoading ? <><span style={S.spinner} /> Finding gaps�</> : "Find Skyscraper Gaps"}
              </button>
              {skyscraperResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>Quality: <b>{skyscraperResult.currentQualityScore}/100</b></span>
                    <span>Potential: <b style={{ color: skyscraperResult.skyscraperPotential?.includes("high") ? "#4ade80" : "#facc15" }}>{skyscraperResult.skyscraperPotential}</b></span>
                    <span>Words: <b>{skyscraperResult.currentWordCount}</b> ? <b>{skyscraperResult.recommendedNewWordCount}</b></span>
                  </div>
                  {skyscraperResult.contentGaps?.slice(0, 6).map((g, i) => (
                    <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid #27272a" }}>
                      <div style={{ fontWeight: 600 }}>{g.suggestedH2}</div>
                      <div style={{ color: "#a1a1aa", fontSize: 12 }}>{g.contentBrief}</div>
                      <span style={{ color: g.importance === "critical" ? "#f87171" : g.importance === "high" ? "#facc15" : "#a1a1aa", fontSize: 11 }}>+{g.estimatedWordAdd} words � {g.importance}</span>
                    </div>
                  ))}
                  {skyscraperResult.linkBaitElements?.length > 0 && (
                    <div style={{ marginTop: 8 }}><b>Link bait elements to add:</b> {skyscraperResult.linkBaitElements.join(", ")}</div>
                  )}
                </div>
              )}
            </div>

            {/* Content Relaunch Advisor */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Content Relaunch Advisor</div>
              <div style={S.cardDesc}>Get a step-by-step plan to update and re-promote old posts for a traffic boost.</div>
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Target keyword (optional)..." value={relunchKeyword} onChange={e => setRelunchKeyword(e.target.value)} />
              <button style={S.btn("primary")} onClick={runRelunchAdvisor} disabled={relunchLoading || !url.trim()}>
                {relunchLoading ? <><span style={S.spinner} /> Planning�</> : "Plan Relaunch"}
              </button>
              {relunchResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ marginBottom: 6 }}>Worthiness: <b style={{ color: relunchResult.relunchWorthiness?.includes("definitely") || relunchResult.relunchWorthiness?.includes("yes") ? "#4ade80" : "#facc15" }}>{relunchResult.relunchWorthiness}</b></div>
                  <div style={{ color: "#a1a1aa", marginBottom: 8 }}>{relunchResult.reasoning}</div>
                  {relunchResult.relunchTitle && <div style={{ marginBottom: 4 }}>Updated title: <b>{relunchResult.relunchTitle}</b></div>}
                  {relunchResult.relunchPlan && (
                    <div style={{ marginTop: 6 }}>
                      {Object.entries(relunchResult.relunchPlan).map(([k, v], i) => (
                        <div key={i} style={{ padding: "5px 0", borderBottom: "1px solid #27272a" }}>
                          <b style={{ color: "#818cf8" }}>{k}:</b> {Array.isArray(v) ? v.join(", ") : v}
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ marginTop: 8, color: "#4ade80" }}>Estimated traffic lift: {relunchResult.estimatedTrafficLift}</div>
                </div>
              )}
            </div>

            {/* Semantic Enrichment Tool */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Semantic Enrichment Tool</div>
              <div style={S.cardDesc}>Discover LSI terms, related entities, and semantic topics missing from your content to improve topical authority.</div>
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Main keyword to enrich for (optional)..." value={semanticEnrichKeyword} onChange={e => setSemanticEnrichKeyword(e.target.value)} />
              <button style={S.btn("primary")} onClick={runSemanticEnrich} disabled={semanticEnrichLoading || (!url.trim() && !semanticEnrichKeyword.trim())}>
                {semanticEnrichLoading ? <><span style={S.spinner} /> Enriching�</> : "Analyze Semantic Richness"}
              </button>
              {semanticEnrichResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>Semantic score: <b style={{ color: semanticEnrichResult.semanticScore >= 70 ? "#4ade80" : semanticEnrichResult.semanticScore >= 40 ? "#facc15" : "#f87171" }}>{semanticEnrichResult.semanticScore}/100 ({semanticEnrichResult.semanticLabel})</b></span>
                    <span>Topic completeness: <b>{semanticEnrichResult.topicCompleteness}%</b></span>
                  </div>
                  {semanticEnrichResult.lsiTermsMissing?.length > 0 && <div style={{ marginBottom: 6 }}>Missing LSI terms: <span style={{ color: "#fbbf24" }}>{semanticEnrichResult.lsiTermsMissing?.slice(0, 6).join(", ")}</span></div>}
                  {semanticEnrichResult.semanticEnrichments?.slice(0, 8).map((e, i) => (
                    <div key={i} style={{ padding: "5px 0", borderBottom: "1px solid #27272a" }}>
                      <span style={{ fontWeight: 600 }}>{e.term}</span>
                      <span style={{ marginLeft: 8, color: "#818cf8", fontSize: 11 }}>{e.type}</span>
                      <span style={{ marginLeft: 8, color: e.importance === "critical" ? "#f87171" : "#facc15", fontSize: 11 }}>{e.importance}</span>
                      <div style={{ color: "#a1a1aa", fontSize: 12, marginTop: 2 }}>{e.suggestedUsage}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ================================================================
            CONTENT+ TAB EXTENSIONS (Batch 5)
            ================================================================ */}
        {tab === "Content+" && (
          <>
            {/* Topic Cluster Builder */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Topic Cluster Builder</div>
              <div style={S.cardDesc}>Plan a pillar page + spoke content hub to build topical authority (Semrush/HubSpot methodology).</div>
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Seed topic (e.g. Email Marketing)..." value={topicClusterSeed} onChange={e => setTopicClusterSeed(e.target.value)} />
              <button style={S.btn("primary")} onClick={runTopicCluster} disabled={topicClusterLoading || !topicClusterSeed.trim()}>
                {topicClusterLoading ? <><span style={S.spinner} /> Building cluster�</> : "Build Topic Cluster"}
              </button>
              {topicClusterResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>??? Pillar: {topicClusterResult.pillarPage?.title}</div>
                  <div style={{ color: "#a1a1aa", fontSize: 12, marginBottom: 8 }}>Keyword: {topicClusterResult.pillarPage?.targetKeyword} � {topicClusterResult.pillarPage?.estimatedWordCount} words</div>
                  {topicClusterResult.clusterPages?.map((p, i) => (
                    <div key={i} style={{ padding: "5px 0", borderBottom: "1px solid #27272a" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontWeight: 600 }}>{p.title}</span>
                        <span style={{ background: "#3f3f46", borderRadius: 4, padding: "1px 6px", fontSize: 11 }}>{p.intent}</span>
                      </div>
                      <div style={{ color: "#a1a1aa", fontSize: 12 }}>{p.targetKeyword} � {p.wordCount} words</div>
                    </div>
                  ))}
                  {topicClusterResult.clusterMetrics && <div style={{ color: "#818cf8", marginTop: 8 }}>?? {topicClusterResult.clusterMetrics.totalPages} pages � ~{topicClusterResult.clusterMetrics.totalEstimatedWords?.toLocaleString()} words total � {topicClusterResult.clusterMetrics.timeToPublish}</div>}
                </div>
              )}
            </div>

            {/* Visual Diversity Advisor */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Visual Diversity Advisor</div>
              <div style={S.cardDesc}>Audit multimedia and visual variety � diverse visuals reduce bounce rate and improve dwell time.</div>
              <button style={S.btn("primary")} onClick={runVisualDiv} disabled={visualDivLoading || !url.trim()}>
                {visualDivLoading ? <><span style={S.spinner} /> Auditing visuals�</> : "Audit Visual Diversity"}
              </button>
              {visualDivResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>Visual score: <b style={{ color: visualDivResult.visualDiversityScore >= 70 ? "#4ade80" : "#fbbf24" }}>{visualDivResult.visualDiversityScore}/100</b></span>
                    <span>Images: <b>{visualDivResult.imgCount}</b></span>
                    <span>Video: <b>{visualDivResult.hasVideo ? "?" : "?"}</b></span>
                  </div>
                  {visualDivResult.recommendedVisuals?.map((v, i) => (
                    <div key={i} style={{ padding: "5px 0", borderBottom: "1px solid #27272a" }}>
                      <div style={{ fontWeight: 600 }}>{v.type}: {v.description}</div>
                      <div style={{ color: "#a1a1aa", fontSize: 12 }}>{v.placement} � {v.userEngagementBenefit}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Time-to-Value Optimizer */}
            <div style={S.card}>
              <div style={S.cardTitle}>? Time-to-Value Optimizer</div>
              <div style={S.cardDesc}>Analyze BLUF/inverted pyramid structure � users should get value above the fold immediately.</div>
              <button style={S.btn("primary")} onClick={runTimeToValue} disabled={timeToValueLoading || !url.trim()}>
                {timeToValueLoading ? <><span style={S.spinner} /> Analyzing�</> : "Optimize Time-to-Value"}
              </button>
              {timeToValueResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>Score: <b style={{ color: timeToValueResult.timeToValueScore >= 70 ? "#4ade80" : "#fbbf24" }}>{timeToValueResult.timeToValueScore}/100</b></span>
                    <span style={{ color: timeToValueResult.timeToValueLabel === "excellent" ? "#4ade80" : "#fbbf24" }}>{timeToValueResult.timeToValueLabel}</span>
                    <span>Intro: <b>{timeToValueResult.introLength} words</b></span>
                  </div>
                  {timeToValueResult.blufAnalysis?.recommendation && <div style={{ color: "#93c5fd", marginBottom: 6 }}>?? {timeToValueResult.blufAnalysis.recommendation}</div>}
                  {timeToValueResult.structureImprovements?.map((s, i) => <div key={i} style={{ padding: "2px 0", fontSize: 13 }}>� {s}</div>)}
                </div>
              )}
            </div>

            {/* Content Pruning Advisor */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Content Pruning Advisor</div>
              <div style={S.cardDesc}>Identify underperforming content to keep, improve, repurpose or remove � boosts site authority.</div>
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Niche (optional, for context)..." value={pruningNiche} onChange={e => setPruningNiche(e.target.value)} />
              <button style={S.btn("primary")} onClick={runPruning} disabled={pruningLoading || (!url.trim() && !pruningNiche.trim())}>
                {pruningLoading ? <><span style={S.spinner} /> Analyzing�</> : "Get Pruning Strategy"}
              </button>
              {pruningResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ color: "#93c5fd", marginBottom: 8 }}>{pruningResult.pruningStrategy}</div>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>Decision Framework:</div>
                  {Object.entries(pruningResult.decisionFramework || {}).map(([action, details]) => (
                    <div key={action} style={{ padding: "5px 0", borderBottom: "1px solid #27272a" }}>
                      <span style={{ fontWeight: 600, textTransform: "capitalize", color: action === "remove" ? "#f87171" : action === "improve" ? "#fbbf24" : action === "keep" ? "#4ade80" : "#818cf8" }}>? {action}:</span>
                      <span style={{ marginLeft: 8, color: "#a1a1aa", fontSize: 12 }}>{details.criteria?.join(" � ")}</span>
                    </div>
                  ))}
                  {pruningResult.frequencyRecommendation && <div style={{ color: "#818cf8", marginTop: 8, fontSize: 13 }}>?? {pruningResult.frequencyRecommendation}</div>}
                </div>
              )}
            </div>

            {/* Statistics Curator */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Statistics Curator (Linkbait)</div>
              <div style={S.cardDesc}>Curate industry statistics to create link-worthy content � one of Ahrefs' top easy backlink strategies.</div>
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Niche (e.g. Email Marketing, SaaS)..." value={statsCuratorNiche} onChange={e => setStatsCuratorNiche(e.target.value)} />
              <button style={S.btn("primary")} onClick={runStatsCurator} disabled={statsCuratorLoading || !statsCuratorNiche.trim()}>
                {statsCuratorLoading ? <><span style={S.spinner} /> Curating stats�</> : "Curate Statistics"}
              </button>
              {statsCuratorResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>?? {statsCuratorResult.contentTitle}</div>
                  <div style={{ color: "#a1a1aa", fontSize: 12, marginBottom: 8 }}>Backlink potential: <b style={{ color: statsCuratorResult.estimatedBacklinkPotential === "high" ? "#4ade80" : "#fbbf24" }}>{statsCuratorResult.estimatedBacklinkPotential}</b></div>
                  {statsCuratorResult.statCategories?.map((cat, i) => (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <div style={{ fontWeight: 600, color: "#818cf8" }}>{cat.category}</div>
                      {cat.stats?.map((s, j) => (
                        <div key={j} style={{ padding: "3px 0", fontSize: 12, color: "#d4d4d8" }}>� {s.stat} <span style={{ color: "#52525b" }}>({s.source})</span></div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ================================================================
            KEYWORD+ TAB (On-page keywords)
            ================================================================ */}
        {tab === "Keyword+" && (
          <>
            <div style={{ ...S.card, marginTop: 16 }}>
              <div style={{ ...S.row, alignItems: "center", marginBottom: kwProminenceResult ? 14 : 0 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Keyword Prominence</div>
                <button style={S.btn(kwProminenceResult ? undefined : "primary")} onClick={runKwProminence} disabled={kwProminenceLoading || !scanResult || !kwInput.trim()}>
                  {kwProminenceLoading ? <><span style={S.spinner} /> Checking�</> : kwProminenceResult ? "?? Re-check" : "Check"}
                </button>
              </div>
              {!kwProminenceResult && !kwProminenceLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Title, H1, intro, meta, URL, and headings signals.</div>}
              {kwProminenceResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div>Score: {kwProminenceResult.prominenceScore} ({kwProminenceResult.grade})</div>
                  <div style={{ color: "#93c5fd", marginTop: 6 }}>?? {kwProminenceResult.tip}</div>
                </div>
              )}
            </div>

            <div style={S.card}>
              <div style={{ ...S.row, alignItems: "center", marginBottom: kwTfidfResult ? 14 : 0 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? TF-IDF</div>
                <button style={S.btn(kwTfidfResult ? undefined : "primary")} onClick={runKwTfidf} disabled={kwTfidfLoading || !scanResult}>
                  {kwTfidfLoading ? <><span style={S.spinner} /> Analyzing�</> : kwTfidfResult ? "?? Re-run" : "Analyze"}
                </button>
              </div>
              {!kwTfidfResult && !kwTfidfLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Top terms and keyword density.</div>}
              {kwTfidfResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div>Top terms: {(kwTfidfResult.topTerms || []).slice(0, 6).map(t => t.term).join(", ")}</div>
                  <div>Density: {kwTfidfResult.keywordDensity ?? "n/a"}% � Dominant: {kwTfidfResult.dominantTheme}</div>
                  <div style={{ color: "#93c5fd", marginTop: 6 }}>?? {kwTfidfResult.tip}</div>
                </div>
              )}
            </div>

            <div style={S.card}>
              <div style={{ ...S.row, alignItems: "center", marginBottom: coOccurrenceResult ? 14 : 0 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Co-occurring Terms</div>
                <button style={S.btn(coOccurrenceResult ? undefined : "primary")} onClick={runCoOccurrence} disabled={coOccurrenceLoading || !scanResult || !kwInput.trim()}>
                  {coOccurrenceLoading ? <><span style={S.spinner} /> Checking�</> : coOccurrenceResult ? "?? Re-check" : "Check"}
                </button>
              </div>
              {!coOccurrenceResult && !coOccurrenceLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Terms that appear near the keyword.</div>}
              {coOccurrenceResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  {(coOccurrenceResult.coOccurringTerms || []).slice(0, 8).map((t, i) => <div key={i}>� {t.term} ({t.count})</div>)}
                  <div style={{ color: "#93c5fd", marginTop: 6 }}>?? {coOccurrenceResult.tip}</div>
                </div>
              )}
            </div>

            <div style={S.card}>
              <div style={{ ...S.row, alignItems: "center", marginBottom: secondaryKwResult ? 14 : 0 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Secondary Keywords (AI)</div>
                <button style={S.btn(secondaryKwResult ? undefined : "primary")} onClick={runSecondaryKw} disabled={secondaryKwLoading || !scanResult || !kwInput.trim()}>
                  {secondaryKwLoading ? <><span style={S.spinner} /> Generating�</> : secondaryKwResult ? "?? Re-run" : "Generate"}
                </button>
              </div>
              {!secondaryKwResult && !secondaryKwLoading && <div style={{ fontSize: 13, color: "#52525b" }}>AI suggests 10 secondary/LSI terms with intent.</div>}
              {secondaryKwResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  {(secondaryKwResult.secondary || []).slice(0, 6).map((k, i) => <div key={i}>� {k.keyword} ({k.intent}, {k.priority})</div>)}
                  <div style={{ color: "#93c5fd", marginTop: 6 }}>Gaps: {(secondaryKwResult.contentGaps || []).join(" � ")}</div>
                </div>
              )}
            </div>

            <div style={S.card}>
              <div style={{ ...S.row, alignItems: "center", marginBottom: voiceSearchResult ? 14 : 0 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>??? Voice Search (AI)</div>
                <button style={S.btn(voiceSearchResult ? undefined : "primary")} onClick={runVoiceSearch} disabled={voiceSearchLoading || !scanResult || !kwInput.trim()}>
                  {voiceSearchLoading ? <><span style={S.spinner} /> Generating�</> : voiceSearchResult ? "?? Re-run" : "Generate"}
                </button>
              </div>
              {!voiceSearchResult && !voiceSearchLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Conversational queries and snippet answer.</div>}
              {voiceSearchResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div>Score: {voiceSearchResult.score}</div>
                  {(voiceSearchResult.voiceKeywords || []).slice(0, 5).map((q, i) => <div key={i}>� {q}</div>)}
                  <div style={{ marginTop: 6 }}>Snippet: {voiceSearchResult.featuredSnippetTarget}</div>
                </div>
              )}
            </div>

            <div style={S.card}>
              <div style={{ ...S.row, alignItems: "center", marginBottom: negCheckResult ? 14 : 0 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Over-Optimisation</div>
                <button style={S.btn(negCheckResult ? undefined : "primary")} onClick={runNegativeCheck} disabled={negCheckLoading || !scanResult || !kwInput.trim()}>
                  {negCheckLoading ? <><span style={S.spinner} /> Checking�</> : negCheckResult ? "?? Re-check" : "Check"}
                </button>
              </div>
              {!negCheckResult && !negCheckLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Spam phrases, keyword stuffing, density.</div>}
              {negCheckResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div>Density: {negCheckResult.keywordDensity}% � Spam: {negCheckResult.spamPhraseCount}</div>
                  {(negCheckResult.issues || []).map((it, i) => <div key={i} style={{ color: "#fbbf24" }}>� {it}</div>)}
                  <div style={{ color: "#93c5fd", marginTop: 6 }}>?? {negCheckResult.tip}</div>
                </div>
              )}
            </div>

            <div style={S.card}>
              <div style={{ ...S.row, alignItems: "center", marginBottom: featSnippetResult ? 14 : 0 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>? Featured Snippet</div>
                <button style={S.btn(featSnippetResult ? undefined : "primary")} onClick={runFeatSnippet} disabled={featSnippetLoading || !scanResult || !kwInput.trim()}>
                  {featSnippetLoading ? <><span style={S.spinner} /> Checking�</> : featSnippetResult ? "?? Re-check" : "Check"}
                </button>
              </div>
              {!featSnippetResult && !featSnippetLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Best paragraph, FAQ/HowTo/Table signals, snippet score.</div>}
              {featSnippetResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div>Score: {featSnippetResult.featuredSnippetScore} � Type: {featSnippetResult.snippetType}</div>
                  <div>Best para: {featSnippetResult.bestSnippetParagraph}</div>
                  <div style={{ color: "#93c5fd", marginTop: 6 }}>?? {featSnippetResult.tip}</div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ================================================================
            TECHNICAL+ TAB
            ================================================================ */}
        {tab === "Technical+" && (
          <>
            <div style={{ ...S.card, marginTop: 16 }}>
              <div style={{ ...S.row, alignItems: "center", marginBottom: urlAnalysisResult ? 14 : 0 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? URL Analysis</div>
                <button style={S.btn(urlAnalysisResult ? undefined : "primary")} onClick={runUrlAnalysis} disabled={urlAnalysisLoading || !url.trim()}>
                  {urlAnalysisLoading ? <><span style={S.spinner} /> Checking�</> : urlAnalysisResult ? "?? Re-check" : "Check"}
                </button>
              </div>
              {!urlAnalysisResult && !urlAnalysisLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Slug length, special chars, protocol, issues.</div>}
              {urlAnalysisResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div>Score: {urlAnalysisResult.urlScore} � Slug: {urlAnalysisResult.slug}</div>
                  {(urlAnalysisResult.issues || []).map((it, i) => <div key={i} style={{ color: "#fbbf24" }}>� {it}</div>)}
                  {urlAnalysisResult.tip && <div style={{ color: "#93c5fd", marginTop: 6 }}>?? {urlAnalysisResult.tip}</div>}
                </div>
              )}
            </div>

            <div style={S.card}>
              <div style={{ ...S.row, alignItems: "center", marginBottom: mobileSeoResult ? 14 : 0 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Mobile SEO</div>
                <button style={S.btn(mobileSeoResult ? undefined : "primary")} onClick={runMobileSeo} disabled={mobileSeoLoading || !scanResult}>
                  {mobileSeoLoading ? <><span style={S.spinner} /> Checking�</> : mobileSeoResult ? "?? Re-check" : "Check"}
                </button>
              </div>
              {!mobileSeoResult && !mobileSeoLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Viewport, responsive images, render-blockers.</div>}
              {mobileSeoResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div>Score: {mobileSeoResult.mobileScore} � Viewport: {mobileSeoResult.hasViewport ? "Yes" : "No"}</div>
                  {(mobileSeoResult.issues || []).map((it, i) => <div key={i} style={{ color: "#fbbf24" }}>� {it}</div>)}
                  {mobileSeoResult.tip && <div style={{ color: "#93c5fd", marginTop: 6 }}>?? {mobileSeoResult.tip}</div>}
                </div>
              )}
            </div>

            <div style={S.card}>
              <div style={{ ...S.row, alignItems: "center", marginBottom: hreflangResult ? 14 : 0 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Hreflang</div>
                <button style={S.btn(hreflangResult ? undefined : "primary")} onClick={runHreflang} disabled={hreflangLoading || !scanResult}>
                  {hreflangLoading ? <><span style={S.spinner} /> Checking�</> : hreflangResult ? "?? Re-check" : "Check"}
                </button>
              </div>
              {!hreflangResult && !hreflangLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Alternate languages and x-default.</div>}
              {hreflangResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div>Tags: {hreflangResult.count} � x-default: {hreflangResult.hasXDefault ? "Yes" : "No"}</div>
                  {(hreflangResult.issues || []).map((it, i) => <div key={i} style={{ color: "#fbbf24" }}>� {it}</div>)}
                  {hreflangResult.tip && <div style={{ color: "#93c5fd", marginTop: 6 }}>?? {hreflangResult.tip}</div>}
                </div>
              )}
            </div>

            <div style={S.card}>
              <div style={{ ...S.row, alignItems: "center", marginBottom: ampResult ? 14 : 0 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>? AMP Check</div>
                <button style={S.btn(ampResult ? undefined : "primary")} onClick={runAmpCheck} disabled={ampLoading || !scanResult}>
                  {ampLoading ? <><span style={S.spinner} /> Checking�</> : ampResult ? "?? Re-check" : "Check"}
                </button>
              </div>
              {!ampResult && !ampLoading && <div style={{ fontSize: 13, color: "#52525b" }}>AMP presence and canonical links.</div>}
              {ampResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div>Status: {ampResult.ampStatus}</div>
                  {(ampResult.issues || []).map((it, i) => <div key={i} style={{ color: "#fbbf24" }}>� {it}</div>)}
                  {ampResult.tip && <div style={{ color: "#93c5fd", marginTop: 6 }}>?? {ampResult.tip}</div>}
                </div>
              )}
            </div>

            <div style={S.card}>
              <div style={{ ...S.row, alignItems: "center", marginBottom: resourceHintsResult ? 14 : 0 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Resource Hints</div>
                <button style={S.btn(resourceHintsResult ? undefined : "primary")} onClick={runResourceHints} disabled={resourceHintsLoading || !scanResult}>
                  {resourceHintsLoading ? <><span style={S.spinner} /> Checking�</> : resourceHintsResult ? "?? Re-check" : "Check"}
                </button>
              </div>
              {!resourceHintsResult && !resourceHintsLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Preload, prefetch, dns-prefetch, preconnect.</div>}
              {resourceHintsResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div>Score: {resourceHintsResult.resourceHintsScore} � Render-blocking: {resourceHintsResult.renderBlockingResources}</div>
                  <div style={{ color: "#93c5fd", marginTop: 6 }}>?? {resourceHintsResult.tip}</div>
                </div>
              )}
            </div>

            <div style={S.card}>
              <div style={{ ...S.row, alignItems: "center", marginBottom: jsonLdLintResult ? 14 : 0 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? JSON-LD Lint</div>
                <button style={S.btn(jsonLdLintResult ? undefined : "primary")} onClick={runJsonLdLint} disabled={jsonLdLintLoading || !scanResult}>
                  {jsonLdLintLoading ? <><span style={S.spinner} /> Checking�</> : jsonLdLintResult ? "?? Re-check" : "Check"}
                </button>
              </div>
              {!jsonLdLintResult && !jsonLdLintLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Validate JSON-LD blocks for syntax and @context/@type.</div>}
              {jsonLdLintResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div>Total scripts: {jsonLdLintResult.totalScripts} � Valid: {jsonLdLintResult.valid} � Invalid: {jsonLdLintResult.invalid}</div>
                  <div>Lint score: {jsonLdLintResult.lintScore}</div>
                  {jsonLdLintResult.tip && <div style={{ color: "#93c5fd", marginTop: 6 }}>?? {jsonLdLintResult.tip}</div>}
                </div>
              )}
            </div>

            <div style={S.card}>
              <div style={{ ...S.row, alignItems: "center", marginBottom: ogImageDimsResult ? 14 : 0 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>??? OG Image Dimensions</div>
                <button style={S.btn(ogImageDimsResult ? undefined : "primary")} onClick={runOgImageDims} disabled={ogImageDimsLoading || !scanResult}>
                  {ogImageDimsLoading ? <><span style={S.spinner} /> Checking�</> : ogImageDimsResult ? "?? Re-check" : "Check"}
                </button>
              </div>
              {!ogImageDimsResult && !ogImageDimsLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Check og:image size tags and recommendations.</div>}
              {ogImageDimsResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div>OG image: {ogImageDimsResult.ogImage || "n/a"}</div>
                  {(ogImageDimsResult.issues || []).map((it, i) => <div key={i} style={{ color: "#fbbf24" }}>� {it}</div>)}
                  {ogImageDimsResult.tip && <div style={{ color: "#93c5fd", marginTop: 6 }}>?? {ogImageDimsResult.tip}</div>}
                </div>
              )}
            </div>

            <div style={S.card}>
              <div style={{ ...S.row, alignItems: "center", marginBottom: httpsStatusResult ? 14 : 0 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? HTTPS Status</div>
                <button style={S.btn(httpsStatusResult ? undefined : "primary")} onClick={runHttpsStatus} disabled={httpsStatusLoading || !url.trim()}>
                  {httpsStatusLoading ? <><span style={S.spinner} /> Checking�</> : httpsStatusResult ? "?? Re-check" : "Check"}
                </button>
              </div>
              {!httpsStatusResult && !httpsStatusLoading && <div style={{ fontSize: 13, color: "#52525b" }}>Protocol, status code, redirects.</div>}
              {httpsStatusResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div>HTTPS: {httpsStatusResult.isHTTPS ? "Yes" : "No"} � Status: {httpsStatusResult.statusCode}</div>
                  {(httpsStatusResult.issues || []).map((it, i) => <div key={i} style={{ color: "#fbbf24" }}>� {it}</div>)}
                  {httpsStatusResult.tip && <div style={{ color: "#93c5fd", marginTop: 6 }}>?? {httpsStatusResult.tip}</div>}
                </div>
              )}
            </div>
          </>
        )}

        {/* ================================================================
            TECHNICAL+ TAB EXTENSIONS (Batch 5)
            ================================================================ */}
        {tab === "Technical+" && (
          <>
            {/* Reading Level Analyzer */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Reading Level Analyzer</div>
              <div style={S.cardDesc}>Analyze Flesch-Kincaid reading level � voice search results average 9th grade; content should be accessible.</div>
              <button style={S.btn("primary")} onClick={runReadingLevel} disabled={readingLevelLoading || !url.trim()}>
                {readingLevelLoading ? <><span style={S.spinner} /> Analyzing�</> : "Analyze Reading Level"}
              </button>
              {readingLevelResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>Grade: <b style={{ color: readingLevelResult.readingLevelLabel === "ideal" ? "#4ade80" : "#fbbf24" }}>{readingLevelResult.fleschKincaidGrade}</b></span>
                    <span>Level: <b>{readingLevelResult.readingLevel}</b></span>
                    <span style={{ color: readingLevelResult.readingLevelLabel === "ideal" ? "#4ade80" : "#fbbf24" }}>{readingLevelResult.readingLevelLabel}</span>
                    <span>Words: <b>{readingLevelResult.wordCount}</b></span>
                  </div>
                  {readingLevelResult.simplificationSuggestions?.map((s, i) => <div key={i} style={{ fontSize: 13, padding: "2px 0" }}>� {s}</div>)}
                  {readingLevelResult.voiceSearchCompatibility && <div style={{ color: "#818cf8", marginTop: 6 }}>??? Voice search: {readingLevelResult.voiceSearchCompatibility}</div>}
                </div>
              )}
            </div>

            {/* TF-IDF Analyzer */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? TF-IDF Keyword Analyzer</div>
              <div style={S.cardDesc}>Analyze keyword density and LSI co-occurrence signals vs. top-ranking competitors.</div>
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Target keyword..." value={tfidfKeyword} onChange={e => setTfidfKeyword(e.target.value)} />
              <button style={S.btn("primary")} onClick={runTfidf} disabled={tfidfLoading || !tfidfKeyword.trim()}>
                {tfidfLoading ? <><span style={S.spinner} /> Analyzing�</> : "Run TF-IDF Analysis"}
              </button>
              {tfidfResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>Density: <b style={{ color: tfidfResult.densityLabel === "optimal" ? "#4ade80" : "#fbbf24" }}>{tfidfResult.keywordDensity}%</b></span>
                    <span style={{ color: tfidfResult.densityLabel === "optimal" ? "#4ade80" : "#fbbf24" }}>{tfidfResult.densityLabel}</span>
                    <span>Optimal: <b>{tfidfResult.optimalRange}</b></span>
                    <span>Over-optimization risk: <b style={{ color: tfidfResult.overOptimizationRisk === "high" ? "#f87171" : "#4ade80" }}>{tfidfResult.overOptimizationRisk}</b></span>
                  </div>
                  {tfidfResult.lsiKeywordsMissing?.length > 0 && (
                    <div style={{ marginBottom: 8 }}>Missing LSI terms: <span style={{ color: "#fbbf24" }}>{tfidfResult.lsiKeywordsMissing.slice(0, 8).join(", ")}</span></div>
                  )}
                  {tfidfResult.densityRecommendations?.map((r, i) => <div key={i} style={{ fontSize: 13, padding: "2px 0" }}>� {r}</div>)}
                </div>
              )}
            </div>

            {/* Content Length Advisor */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Content Length Advisor</div>
              <div style={S.cardDesc}>Find the optimal word count for your keyword � based on what top-ranking pages use.</div>
              <input style={{ ...S.input, marginBottom: 6 }} placeholder="Target keyword..." value={contentLengthKw} onChange={e => setContentLengthKw(e.target.value)} />
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Current word count (optional)..." value={contentLengthWc} onChange={e => setContentLengthWc(e.target.value)} />
              <button style={S.btn("primary")} onClick={runContentLength} disabled={contentLengthLoading || !contentLengthKw.trim()}>
                {contentLengthLoading ? <><span style={S.spinner} /> Advising�</> : "Get Length Advice"}
              </button>
              {contentLengthResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>Min: <b>{contentLengthResult.optimalWordCount?.minimum?.toLocaleString()}</b></span>
                    <span>Recommended: <b style={{ color: "#4ade80" }}>{contentLengthResult.optimalWordCount?.recommended?.toLocaleString()}</b></span>
                    <span>Max: <b>{contentLengthResult.optimalWordCount?.maximum?.toLocaleString()}</b></span>
                  </div>
                  {contentLengthResult.currentGap && <div style={{ color: contentLengthResult.currentGap.assessment === "about right" ? "#4ade80" : "#fbbf24", marginBottom: 6 }}>Gap: {contentLengthResult.currentGap.wordsNeeded > 0 ? `+${contentLengthResult.currentGap.wordsNeeded.toLocaleString()} words needed` : contentLengthResult.currentGap.assessment}</div>}
                  {contentLengthResult.topicsToInclude?.map((t, i) => <div key={i} style={{ fontSize: 13, padding: "2px 0" }}>� {t}</div>)}
                </div>
              )}
            </div>

            {/* Core Web Vitals Advisor */}
            <div style={S.card}>
              <div style={S.cardTitle}>? Core Web Vitals Advisor</div>
              <div style={S.cardDesc}>Get LCP, CLS, and INP fix recommendations � CWV is a confirmed Google ranking factor.</div>
              <button style={S.btn("primary")} onClick={runCwvAdvisor} disabled={cwvLoading || !url.trim()}>
                {cwvLoading ? <><span style={S.spinner} /> Analyzing CWV�</> : "Analyze Core Web Vitals"}
              </button>
              {cwvResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>CWV risk: <b style={{ color: cwvResult.overallCWVRisk === "high" ? "#f87171" : cwvResult.overallCWVRisk === "medium" ? "#fbbf24" : "#4ade80" }}>{cwvResult.overallCWVRisk?.toUpperCase()}</b></span>
                    <span>Impact: <b>{cwvResult.estimatedRankingImpact}</b></span>
                  </div>
                  {Object.entries(cwvResult.cwvTargets || {}).map(([metric, data]) => (
                    <div key={metric} style={{ padding: "6px 0", borderBottom: "1px solid #27272a" }}>
                      <div style={{ fontWeight: 600, textTransform: "uppercase" }}>{metric}: <span style={{ color: "#4ade80" }}>{data.target}</span></div>
                      {data.fixes?.map((f, i) => <div key={i} style={{ fontSize: 12, color: "#d4d4d8" }}>� {f}</div>)}
                    </div>
                  ))}
                  {cwvResult.voiceSearchBonus && <div style={{ color: "#818cf8", marginTop: 6, fontSize: 12 }}>??? {cwvResult.voiceSearchBonus}</div>}
                </div>
              )}
            </div>

            {/* Page Speed Advisor */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Page Speed Advisor</div>
              <div style={S.cardDesc}>Get specific page speed fixes � voice search pages load avg 4.6s; faster pages rank better.</div>
              <button style={S.btn("primary")} onClick={runPageSpeed} disabled={pageSpeedLoading || !url.trim()}>
                {pageSpeedLoading ? <><span style={S.spinner} /> Analyzing speed�</> : "Analyze Page Speed"}
              </button>
              {pageSpeedResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>Speed score: <b style={{ color: pageSpeedResult.speedScore >= 70 ? "#4ade80" : "#fbbf24" }}>{pageSpeedResult.speedScore}/100</b></span>
                    <span>Est. load: <b>{pageSpeedResult.estimatedLoadTime}</b></span>
                    <span>Scripts: <b>{pageSpeedResult.scriptCount}</b></span>
                    <span>CSS: <b>{pageSpeedResult.cssCount}</b></span>
                  </div>
                  {pageSpeedResult.topSpeedActions?.map((a, i) => <div key={i} style={{ fontSize: 13, padding: "2px 0" }}>� {a}</div>)}
                  {pageSpeedResult.voiceSearchSpeed && <div style={{ color: "#818cf8", marginTop: 6, fontSize: 12 }}>??? {pageSpeedResult.voiceSearchSpeed}</div>}
                </div>
              )}
            </div>

            {/* Crawl Budget Advisor */}
            <div style={S.card}>
              <div style={S.cardTitle}>??? Crawl Budget Advisor</div>
              <div style={S.cardDesc}>Identify crawl wasteage � low-value pages eating crawl budget, robots.txt issues, and query parameter traps.</div>
              <button style={S.btn("primary")} onClick={runCrawlBudget} disabled={crawlBudgetLoading || !url.trim()}>
                {crawlBudgetLoading ? <><span style={S.spinner} /> Auditing crawl budget�</> : "Audit Crawl Budget"}
              </button>
              {crawlBudgetResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>Crawl efficiency: <b style={{ color: crawlBudgetResult.crawlEfficiencyScore >= 70 ? "#4ade80" : "#fbbf24" }}>{crawlBudgetResult.crawlEfficiencyScore}/100</b></span>
                    <span>Wasted pages: <b style={{ color: "#f87171" }}>{crawlBudgetResult.estimatedWastedBudgetPercent}%</b></span>
                  </div>
                  {crawlBudgetResult.robotsTxtIssues?.map((i2, i) => <div key={i} style={{ fontSize: 12, color: "#f87171", padding: "1px 0" }}>?? {i2}</div>)}
                  {crawlBudgetResult.topActions?.map((a, i) => <div key={i} style={{ fontSize: 13, padding: "2px 0" }}>� {a}</div>)}
                </div>
              )}
            </div>

            {/* Click Depth Analyzer */}
            <div style={S.card}>
              <div style={S.cardTitle}>??? Click Depth Analyzer</div>
              <div style={S.cardDesc}>Calculate click depth from homepage and detect pages buried too deep for Googlebot to prioritize them.</div>
              <button style={S.btn("primary")} onClick={runClickDepth} disabled={clickDepthLoading || !url.trim()}>
                {clickDepthLoading ? <><span style={S.spinner} /> Analyzing depth�</> : "Analyze Click Depth"}
              </button>
              {clickDepthResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>URL depth: <b style={{ color: clickDepthResult.clickDepth <= 3 ? "#4ade80" : "#f87171" }}>{clickDepthResult.clickDepth} levels</b></span>
                    <span>Status: <b style={{ color: clickDepthResult.depthStatus === "optimal" ? "#4ade80" : "#fbbf24" }}>{clickDepthResult.depthStatus}</b></span>
                  </div>
                  {clickDepthResult.topActions?.map((a, i) => <div key={i} style={{ fontSize: 13, padding: "2px 0" }}>� {a}</div>)}
                </div>
              )}
            </div>

            {/* Log File Analysis Advisor */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Log File Analysis Advisor</div>
              <div style={S.cardDesc}>Paste a snippet of your server access log and get a crawl pattern analysis � Googlebot frequency, 404s, slow URLs.</div>
              <textarea
                style={{ ...S.input, height: 90, resize: "vertical", fontFamily: "monospace", fontSize: 12, marginBottom: 8 }}
                placeholder={`Paste access log lines (Googlebot entries)...\n192.168.1.1 - [27/Nov/2025] "GET /page HTTP/1.1" 200 - "Googlebot/2.1"`}
                value={logSnippet}
                onChange={e => setLogSnippet(e.target.value)}
              />
              <button style={S.btn("primary")} onClick={runLogFile} disabled={logFileLoading || (!logSnippet.trim() && !url.trim())}>
                {logFileLoading ? <><span style={S.spinner} /> Analyzing logs�</> : "Analyze Log File"}
              </button>
              {logFileResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>Googlebot visits: <b>{logFileResult.googlebotVisits}</b></span>
                    <span>404 rate: <b style={{ color: logFileResult.notFoundRate > 5 ? "#f87171" : "#4ade80" }}>{logFileResult.notFoundRate}%</b></span>
                    <span>Avg response: <b>{logFileResult.avgResponseTime}</b></span>
                  </div>
                  {logFileResult.topActions?.map((a, i) => <div key={i} style={{ fontSize: 13, padding: "2px 0" }}>� {a}</div>)}
                </div>
              )}
            </div>

            {/* International SEO Advisor */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? International SEO Advisor</div>
              <div style={S.cardDesc}>Choose the right international structure � ccTLD vs subdirectory vs subdomain � with hreflang implementation checklist.</div>
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Target markets (comma-separated, e.g. UK, AU, CA)..." value={intlSeoMarkets} onChange={e => setIntlSeoMarkets(e.target.value)} />
              <button style={S.btn("primary")} onClick={runIntlSeo} disabled={intlSeoLoading || (!intlSeoMarkets.trim() && !url.trim())}>
                {intlSeoLoading ? <><span style={S.spinner} /> Analyzing�</> : "Get International SEO Plan"}
              </button>
              {intlSeoResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ marginBottom: 8 }}>Recommended structure: <b style={{ color: "#818cf8" }}>{intlSeoResult.recommendedStructure}</b></div>
                  {intlSeoResult.hreflangChecklist?.slice(0, 6).map((item, i) => (
                    <div key={i} style={{ fontSize: 13, padding: "2px 0" }}>
                      <span style={{ color: item.status === "?" ? "#4ade80" : "#f87171" }}>{item.status}</span> {item.item}
                    </div>
                  ))}
                  {intlSeoResult.topActions?.map((a, i) => <div key={i} style={{ fontSize: 13, padding: "4px 0" }}>� {a}</div>)}
                </div>
              )}
            </div>
          </>
        )}

        {/* ================================================================
            AI CREATE TAB
            ================================================================ */}
        {tab === "AI Create" && (
          <>
            <div style={{ ...S.card, marginTop: 16 }}>
              <div style={S.cardTitle}>?? AI Blog Outline</div>
              <div style={{ ...S.row, marginBottom: 10 }}>
                <input style={{ ...S.input, maxWidth: 320 }} placeholder="Keyword or topic" value={blogOutlineKw} onChange={e => setBlogOutlineKw(e.target.value)} />
                <input style={{ ...S.input, maxWidth: 200 }} placeholder="Audience" value={blogOutlineAudience} onChange={e => setBlogOutlineAudience(e.target.value)} />
                <button style={S.btn("primary")} onClick={runBlogOutline} disabled={blogOutlineLoading || !blogOutlineKw.trim()}>
                  {blogOutlineLoading ? <><span style={S.spinner} /> Generating�</> : "Generate (2 cr)"}
                </button>
              </div>
              {blogOutlineResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div style={{ fontWeight: 700 }}>{blogOutlineResult.title}</div>
                  <div style={{ color: "#93c5fd", marginTop: 6 }}>{blogOutlineResult.metaDescription}</div>
                  {(blogOutlineResult.sections || []).slice(0, 6).map((s, i) => <div key={i}>� {s.heading} ({s.suggestedWordCount}w)</div>)}
                </div>
              )}
            </div>

            <div style={S.card}>
              <div style={S.cardTitle}>?? AI Intro Generator</div>
              <div style={{ ...S.row, marginBottom: 10 }}>
                <input style={{ ...S.input, maxWidth: 320 }} placeholder="Keyword or topic" value={introGenKw} onChange={e => setIntroGenKw(e.target.value)} />
                <select style={{ ...S.input, maxWidth: 160 }} value={introGenStyle} onChange={e => setIntroGenStyle(e.target.value)}>
                  <option value="PAS">PAS</option>
                  <option value="AIDA">AIDA</option>
                  <option value="Story">Story</option>
                </select>
                <button style={S.btn("primary")} onClick={runIntroGenerator} disabled={introGenLoading || !introGenKw.trim()}>
                  {introGenLoading ? <><span style={S.spinner} /> Generating�</> : "Generate (2 cr)"}
                </button>
              </div>
              {introGenResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  {(introGenResult.intros || []).map((i, idx) => <div key={idx} style={{ marginBottom: 6 }}>� {i.text}</div>)}
                </div>
              )}
            </div>

            <div style={S.card}>
              <div style={S.cardTitle}>??? AI Title Ideas</div>
              <div style={{ ...S.row, marginBottom: 10 }}>
                <input style={{ ...S.input, maxWidth: 320 }} placeholder="Keyword" value={titleIdeasKw} onChange={e => setTitleIdeasKw(e.target.value)} />
                <button style={S.btn("primary")} onClick={runTitleIdeas} disabled={titleIdeasLoading || !titleIdeasKw.trim()}>
                  {titleIdeasLoading ? <><span style={S.spinner} /> Generating�</> : "Generate (2 cr)"}
                </button>
              </div>
              {titleIdeasResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  {(titleIdeasResult.titles || []).slice(0, 8).map((t, i) => <div key={i}>� {t.title}</div>)}
                  {titleIdeasResult.tip && <div style={{ color: "#93c5fd", marginTop: 6 }}>?? {titleIdeasResult.tip}</div>}
                </div>
              )}
            </div>

            <div style={S.card}>
              <div style={S.cardTitle}>?? AI CTA Generator</div>
              <div style={{ ...S.row, marginBottom: 10 }}>
                <input style={{ ...S.input, maxWidth: 240 }} placeholder="Keyword" value={ctaGenKw} onChange={e => setCtaGenKw(e.target.value)} />
                <select style={{ ...S.input, maxWidth: 160 }} value={ctaGenGoal} onChange={e => setCtaGenGoal(e.target.value)}>
                  <option value="signup">Signup</option>
                  <option value="demo">Demo</option>
                  <option value="purchase">Purchase</option>
                </select>
                <button style={S.btn("primary")} onClick={runCtaGenerator} disabled={ctaGenLoading || !ctaGenKw.trim()}>
                  {ctaGenLoading ? <><span style={S.spinner} /> Generating�</> : "Generate (2 cr)"}
                </button>
              </div>
              {ctaGenResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  {(ctaGenResult.ctas || []).map((c, i) => <div key={i}>� {c.variant}: {c.text} [btn: {c.buttonText}]</div>)}
                  {ctaGenResult.tip && <div style={{ color: "#93c5fd", marginTop: 6 }}>?? {ctaGenResult.tip}</div>}
                </div>
              )}
            </div>

            <div style={{ ...S.card }}>
              <div style={{ ...S.row, marginBottom: keyTakeawaysResult ? 10 : 6 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Key Takeaways (AI)</div>
                <button style={S.btn(keyTakeawaysResult ? undefined : "primary")} onClick={runKeyTakeaways} disabled={keyTakeawaysLoading || !scanResult}>
                  {keyTakeawaysLoading ? <><span style={S.spinner} /> Generating�</> : keyTakeawaysResult ? "?? Re-run" : "Generate"}
                </button>
              </div>
              {keyTakeawaysResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  {(keyTakeawaysResult.takeaways || []).map((t, i) => <div key={i}>� {t.point}</div>)}
                  <div style={{ color: "#93c5fd", marginTop: 6 }}>{keyTakeawaysResult.summary}</div>
                </div>
              )}
            </div>

            <div style={{ ...S.card }}>
              <div style={{ ...S.row, marginBottom: summaryGenResult ? 10 : 6 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Summary Generator</div>
                <button style={S.btn(summaryGenResult ? undefined : "primary")} onClick={runSummaryGenerator} disabled={summaryGenLoading || !scanResult}>
                  {summaryGenLoading ? <><span style={S.spinner} /> Summarizing�</> : summaryGenResult ? "?? Re-run" : "Summarize"}
                </button>
              </div>
              {summaryGenResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div>TL;DR: {summaryGenResult.tldr}</div>
                  {(summaryGenResult.tweetThread || []).map((t, i) => <div key={i}>� {t}</div>)}
                </div>
              )}
            </div>

            <div style={{ ...S.card }}>
              <div style={{ ...S.row, marginBottom: toneAnalyzerResult ? 10 : 6 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>??? Tone Analyzer</div>
                <button style={S.btn(toneAnalyzerResult ? undefined : "primary")} onClick={runToneAnalyzer} disabled={toneAnalyzerLoading || !scanResult}>
                  {toneAnalyzerLoading ? <><span style={S.spinner} /> Analyzing�</> : toneAnalyzerResult ? "?? Re-run" : "Analyze"}
                </button>
              </div>
              {toneAnalyzerResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div>Primary: {toneAnalyzerResult.primaryTone} � Tone score: {toneAnalyzerResult.toneScore}</div>
                  <div>Active voice: {toneAnalyzerResult.activeVoiceRatio}% � Consistency: {toneAnalyzerResult.toneConsistency}%</div>
                  {(toneAnalyzerResult.improvements || []).map((t, i) => <div key={i} style={{ color: "#93c5fd" }}>� {t}</div>)}
                </div>
              )}
            </div>

            <div style={{ ...S.card }}>
              <div style={{ ...S.row, marginBottom: contentGraderResult ? 10 : 6 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Content Grader</div>
                <button style={S.btn(contentGraderResult ? undefined : "primary")} onClick={runContentGrader} disabled={contentGraderLoading || !scanResult}>
                  {contentGraderLoading ? <><span style={S.spinner} /> Grading�</> : contentGraderResult ? "?? Re-run" : "Grade"}
                </button>
              </div>
              {contentGraderResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div>Overall: {contentGraderResult.overallGrade} ({contentGraderResult.overallScore})</div>
                  {(contentGraderResult.improvements || []).map((t, i) => <div key={i} style={{ color: "#fbbf24" }}>� {t}</div>)}
                </div>
              )}
            </div>

            <div style={{ ...S.card }}>
              <div style={{ ...S.row, marginBottom: pullQuotesResult ? 10 : 6 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Pull Quotes</div>
                <button style={S.btn(pullQuotesResult ? undefined : "primary")} onClick={runPullQuotes} disabled={pullQuotesLoading || !scanResult}>
                  {pullQuotesLoading ? <><span style={S.spinner} /> Extracting�</> : pullQuotesResult ? "?? Re-run" : "Extract"}
                </button>
              </div>
              {pullQuotesResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  {(pullQuotesResult.quotes || []).slice(0, 5).map((q, i) => <div key={i}>� {q.quote}</div>)}
                  {pullQuotesResult.bestQuote && <div style={{ color: "#93c5fd", marginTop: 6 }}>Best: {pullQuotesResult.bestQuote}</div>}
                </div>
              )}
            </div>

            <div style={{ ...S.card }}>
              <div style={{ ...S.row, marginBottom: headlineHookResult ? 10 : 6 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Headline Hook Optimizer</div>
                <input style={{ ...S.input, maxWidth: 360 }} placeholder="Current title (optional)" value={headlineHookTitle} onChange={e => setHeadlineHookTitle(e.target.value)} />
                <button style={S.btn("primary")} onClick={runHeadlineHook} disabled={headlineHookLoading || (!headlineHookTitle && !scanResult)}>
                  {headlineHookLoading ? <><span style={S.spinner} /> Optimizing�</> : "Optimize"}
                </button>
              </div>
              {headlineHookResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  {(headlineHookResult.optimisations || []).slice(0, 4).map((h, i) => <div key={i}>� {h.title} ({h.formula})</div>)}
                  <div style={{ color: "#93c5fd", marginTop: 6 }}>Hook: {headlineHookResult.openingLine}</div>
                </div>
              )}
            </div>

            <div style={{ ...S.card }}>
              <div style={{ ...S.row, marginBottom: passageOptResult ? 10 : 6 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? AI Passage Optimizer</div>
                <button style={S.btn(passageOptResult ? undefined : "primary")} onClick={runPassageOptimizer} disabled={passageOptLoading || !scanResult || !kwInput.trim()}>
                  {passageOptLoading ? <><span style={S.spinner} /> Optimizing�</> : passageOptResult ? "?? Re-run" : "Optimize"}
                </button>
              </div>
              {passageOptResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div>Best passage: {passageOptResult.bestPassage}</div>
                  <div style={{ marginTop: 6, color: "#93c5fd" }}>Optimised: {passageOptResult.optimisedPassage}</div>
                </div>
              )}
            </div>

            <div style={{ ...S.card }}>
              <div style={{ ...S.row, marginBottom: repurposeResult ? 10 : 6 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Content Repurpose</div>
                <button style={S.btn(repurposeResult ? undefined : "primary")} onClick={runRepurpose} disabled={repurposeLoading || !scanResult}>
                  {repurposeLoading ? <><span style={S.spinner} /> Generating�</> : repurposeResult ? "?? Re-run" : "Generate"}
                </button>
              </div>
              {repurposeResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  {(repurposeResult.repurposes || []).slice(0, 6).map((r, i) => <div key={i}>� {r.format} ({r.effort}/{r.estimatedReach})</div>)}
                  {repurposeResult.quickWins && <div style={{ color: "#93c5fd", marginTop: 6 }}>Quick wins: {repurposeResult.quickWins.join(" � ")}</div>}
                </div>
              )}
            </div>

            <div style={{ ...S.card }}>
              <div style={{ ...S.row, marginBottom: contentVisibilityResult ? 10 : 6 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>??? Content Visibility Score</div>
                <button style={S.btn(contentVisibilityResult ? undefined : "primary")} onClick={runContentVisibility} disabled={contentVisibilityLoading || !scanResult || !kwInput.trim()}>
                  {contentVisibilityLoading ? <><span style={S.spinner} /> Scoring�</> : contentVisibilityResult ? "?? Re-run" : "Score"}
                </button>
              </div>
              {contentVisibilityResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div>Visibility: {contentVisibilityResult.visibilityScore} � LLM citations: {contentVisibilityResult.llmCitationLikelihood}</div>
                  <div>SERP: FS {contentVisibilityResult.serpVisibility?.featuredSnippet} � PAA {contentVisibilityResult.serpVisibility?.paa} � Img {contentVisibilityResult.serpVisibility?.imageRank} � Video {contentVisibilityResult.serpVisibility?.videoRank}</div>
                  {(contentVisibilityResult.actionPlan || []).slice(0, 4).map((a, i) => <div key={i} style={{ color: "#93c5fd" }}>� {a}</div>)}
                </div>
              )}
            </div>
          </>
        )}

        {/* ================================================================
            SCHEMA & LINKS TAB
            ================================================================ */}
        {tab === "Schema & Links" && (
          <>
            <div style={{ ...S.card, marginTop: 16 }}>
              <div style={S.cardTitle}>??? Product Schema</div>
              <div style={{ ...S.row, marginBottom: 8 }}>
                <input style={{ ...S.input, maxWidth: 200 }} placeholder="Name" value={productName} onChange={e => setProductName(e.target.value)} />
                <input style={{ ...S.input, maxWidth: 140 }} placeholder="Price" value={productPrice} onChange={e => setProductPrice(e.target.value)} />
                <input style={{ ...S.input, maxWidth: 180 }} placeholder="Brand" value={productBrand} onChange={e => setProductBrand(e.target.value)} />
                <input style={{ ...S.input, maxWidth: 220 }} placeholder="Image URL" value={productImage} onChange={e => setProductImage(e.target.value)} />
                <button style={S.btn("primary")} onClick={runProductSchema} disabled={productSchemaLoading || !productName.trim()}>
                  {productSchemaLoading ? <><span style={S.spinner} /> Generate�</> : "Generate"}
                </button>
              </div>
              <textarea style={{ ...S.textarea, minHeight: 60 }} placeholder="Description" value={productDesc} onChange={e => setProductDesc(e.target.value)} />
              {productSchemaResult && <pre style={S.fixCode}>{productSchemaResult.jsonLd}</pre>}
            </div>

            <div style={S.card}>
              <div style={S.cardTitle}>??? Event Schema</div>
              <div style={{ ...S.row, marginBottom: 8 }}>
                <input style={{ ...S.input, maxWidth: 200 }} placeholder="Name" value={eventName} onChange={e => setEventName(e.target.value)} />
                <input style={{ ...S.input, maxWidth: 180 }} placeholder="Start date" value={eventDate} onChange={e => setEventDate(e.target.value)} />
                <input style={{ ...S.input, maxWidth: 200 }} placeholder="Location" value={eventLocation} onChange={e => setEventLocation(e.target.value)} />
                <input style={{ ...S.input, maxWidth: 200 }} placeholder="Organizer" value={eventOrg} onChange={e => setEventOrg(e.target.value)} />
                <button style={S.btn("primary")} onClick={runEventSchema} disabled={eventSchemaLoading || !eventName.trim() || !eventDate.trim()}>
                  {eventSchemaLoading ? <><span style={S.spinner} /> Generate�</> : "Generate"}
                </button>
              </div>
              {eventSchemaResult && <pre style={S.fixCode}>{eventSchemaResult.jsonLd}</pre>}
            </div>

            <div style={S.card}>
              <div style={S.cardTitle}>?? Person Schema</div>
              <div style={{ ...S.row, marginBottom: 8 }}>
                <input style={{ ...S.input, maxWidth: 200 }} placeholder="Name" value={personName} onChange={e => setPersonName(e.target.value)} />
                <input style={{ ...S.input, maxWidth: 200 }} placeholder="Job title" value={personJob} onChange={e => setPersonJob(e.target.value)} />
                <input style={{ ...S.input, maxWidth: 260 }} placeholder="SameAs (comma-separated)" value={personSameAs} onChange={e => setPersonSameAs(e.target.value)} />
                <button style={S.btn("primary")} onClick={runPersonSchema} disabled={personSchemaLoading || !personName.trim()}>
                  {personSchemaLoading ? <><span style={S.spinner} /> Generate�</> : "Generate"}
                </button>
              </div>
              <textarea style={{ ...S.textarea, minHeight: 60 }} placeholder="Description" value={personDesc} onChange={e => setPersonDesc(e.target.value)} />
              {personSchemaResult && <pre style={S.fixCode}>{personSchemaResult.jsonLd}</pre>}
            </div>

            <div style={S.card}>
              <div style={S.cardTitle}>?? Course Schema</div>
              <div style={{ ...S.row, marginBottom: 8 }}>
                <input style={{ ...S.input, maxWidth: 200 }} placeholder="Name" value={courseName} onChange={e => setCourseName(e.target.value)} />
                <input style={{ ...S.input, maxWidth: 200 }} placeholder="Provider" value={courseProvider} onChange={e => setCourseProvider(e.target.value)} />
                <input style={{ ...S.input, maxWidth: 160 }} placeholder="Price" value={coursePrice} onChange={e => setCoursePrice(e.target.value)} />
                <input style={{ ...S.input, maxWidth: 160 }} placeholder="Duration" value={courseDuration} onChange={e => setCourseDuration(e.target.value)} />
                <button style={S.btn("primary")} onClick={runCourseSchema} disabled={courseSchemaLoading || !courseName.trim()}>
                  {courseSchemaLoading ? <><span style={S.spinner} /> Generate�</> : "Generate"}
                </button>
              </div>
              {courseSchemaResult && <pre style={S.fixCode}>{courseSchemaResult.jsonLd}</pre>}
            </div>

            <div style={S.card}>
              <div style={S.cardTitle}>?? Recipe Schema</div>
              <div style={{ ...S.row, marginBottom: 8 }}>
                <input style={{ ...S.input, maxWidth: 200 }} placeholder="Name" value={recipeName} onChange={e => setRecipeName(e.target.value)} />
                <input style={{ ...S.input, maxWidth: 180 }} placeholder="Author" value={recipeAuthorName} onChange={e => setRecipeAuthorName(e.target.value)} />
                <input style={{ ...S.input, maxWidth: 140 }} placeholder="Prep time" value={recipePrepTime} onChange={e => setRecipePrepTime(e.target.value)} />
                <input style={{ ...S.input, maxWidth: 140 }} placeholder="Cook time" value={recipeCookTime} onChange={e => setRecipeCookTime(e.target.value)} />
                <button style={S.btn("primary")} onClick={runRecipeSchema} disabled={recipeSchemaLoading || !recipeName.trim()}>
                  {recipeSchemaLoading ? <><span style={S.spinner} /> Generate�</> : "Generate"}
                </button>
              </div>
              <textarea style={{ ...S.textarea, minHeight: 60 }} placeholder="Ingredients (comma-separated)" value={recipeIngredients} onChange={e => setRecipeIngredients(e.target.value)} />
              {recipeSchemaResult && <pre style={S.fixCode}>{recipeSchemaResult.jsonLd}</pre>}
            </div>

            <div style={S.card}>
              <div style={S.cardTitle}>?? Software Schema</div>
              <div style={{ ...S.row, marginBottom: 8 }}>
                <input style={{ ...S.input, maxWidth: 200 }} placeholder="Name" value={softwareName} onChange={e => setSoftwareName(e.target.value)} />
                <input style={{ ...S.input, maxWidth: 220 }} placeholder="Description" value={softwareDesc} onChange={e => setSoftwareDesc(e.target.value)} />
                <input style={{ ...S.input, maxWidth: 120 }} placeholder="Price" value={softwarePrice} onChange={e => setSoftwarePrice(e.target.value)} />
                <input style={{ ...S.input, maxWidth: 160 }} placeholder="Category" value={softwareCategory} onChange={e => setSoftwareCategory(e.target.value)} />
                <button style={S.btn("primary")} onClick={runSoftwareSchema} disabled={softwareSchemaLoading || !softwareName.trim()}>
                  {softwareSchemaLoading ? <><span style={S.spinner} /> Generate�</> : "Generate"}
                </button>
              </div>
              {softwareSchemaResult && <pre style={S.fixCode}>{softwareSchemaResult.jsonLd}</pre>}
            </div>

            <div style={S.card}>
              <div style={S.cardTitle}>?? Local Business Schema</div>
              <div style={{ ...S.row, marginBottom: 8 }}>
                <input style={{ ...S.input, maxWidth: 200 }} placeholder="Name" value={bizName} onChange={e => setBizName(e.target.value)} />
                <input style={{ ...S.input, maxWidth: 220 }} placeholder="Address" value={bizAddress} onChange={e => setBizAddress(e.target.value)} />
                <input style={{ ...S.input, maxWidth: 160 }} placeholder="City" value={bizCity} onChange={e => setBizCity(e.target.value)} />
                <input style={{ ...S.input, maxWidth: 160 }} placeholder="Phone" value={bizPhone} onChange={e => setBizPhone(e.target.value)} />
                <input style={{ ...S.input, maxWidth: 180 }} placeholder="Type" value={bizType} onChange={e => setBizType(e.target.value)} />
                <button style={S.btn("primary")} onClick={runLocalBizSchema} disabled={localBizSchemaLoading || !bizName.trim()}>
                  {localBizSchemaLoading ? <><span style={S.spinner} /> Generate�</> : "Generate"}
                </button>
              </div>
              {localBizSchemaResult && <pre style={S.fixCode}>{localBizSchemaResult.jsonLd}</pre>}
            </div>

            <div style={S.card}>
              <div style={{ ...S.row, alignItems: "center", marginBottom: extLinkAuthResult ? 14 : 0 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? External Link Authority</div>
                <button style={S.btn(extLinkAuthResult ? undefined : "primary")} onClick={runExtLinkAuth} disabled={extLinkAuthLoading || !scanResult}>
                  {extLinkAuthLoading ? <><span style={S.spinner} /> Checking�</> : extLinkAuthResult ? "?? Re-check" : "Check"}
                </button>
              </div>
              {extLinkAuthResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div>Total external: {extLinkAuthResult.totalExternal} � Authority: {extLinkAuthResult.authoritative}</div>
                  <div style={{ color: "#93c5fd", marginTop: 6 }}>?? {extLinkAuthResult.tip}</div>
                </div>
              )}
            </div>

            <div style={S.card}>
              <div style={{ ...S.row, alignItems: "center", marginBottom: linkDensityResult ? 14 : 0 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Link Density</div>
                <button style={S.btn(linkDensityResult ? undefined : "primary")} onClick={runLinkDensity} disabled={linkDensityLoading || !scanResult}>
                  {linkDensityLoading ? <><span style={S.spinner} /> Checking�</> : linkDensityResult ? "?? Re-check" : "Check"}
                </button>
              </div>
              {linkDensityResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div>Links/100w: {linkDensityResult.linksPerHundredWords} � Risk: {linkDensityResult.linkDensityRisk}</div>
                  <div style={{ color: "#93c5fd", marginTop: 6 }}>?? {linkDensityResult.tip}</div>
                </div>
              )}
            </div>

            <div style={S.card}>
              <div style={{ ...S.row, alignItems: "center", marginBottom: outboundAuditResult ? 14 : 0 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Outbound Link Audit</div>
                <button style={S.btn(outboundAuditResult ? undefined : "primary")} onClick={runOutboundAudit} disabled={outboundAuditLoading || !scanResult}>
                  {outboundAuditLoading ? <><span style={S.spinner} /> Checking�</> : outboundAuditResult ? "?? Re-check" : "Check"}
                </button>
              </div>
              {outboundAuditResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div>Total outbound: {outboundAuditResult.totalOutbound} � Unique domains: {outboundAuditResult.uniqueDomains}</div>
                  {outboundAuditResult.tip && <div style={{ color: "#93c5fd", marginTop: 6 }}>?? {outboundAuditResult.tip}</div>}
                </div>
              )}
            </div>

            <div style={S.card}>
              <div style={{ ...S.row, alignItems: "center", marginBottom: socialProofResult ? 14 : 0 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Social Proof</div>
                <button style={S.btn(socialProofResult ? undefined : "primary")} onClick={runSocialProof} disabled={socialProofLoading || !scanResult}>
                  {socialProofLoading ? <><span style={S.spinner} /> Checking�</> : socialProofResult ? "?? Re-check" : "Check"}
                </button>
              </div>
              {socialProofResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div>Score: {socialProofResult.socialProofScore} � Share buttons: {socialProofResult.shareButtons}</div>
                  {socialProofResult.tip && <div style={{ color: "#93c5fd", marginTop: 6 }}>?? {socialProofResult.tip}</div>}
                </div>
              )}
            </div>

            <div style={S.card}>
              <div style={{ ...S.row, alignItems: "center", marginBottom: citationCheckResult ? 14 : 0 }}>
                <div style={{ ...S.cardTitle, marginBottom: 0 }}>?? Citation Quality</div>
                <button style={S.btn(citationCheckResult ? undefined : "primary")} onClick={runCitationCheck} disabled={citationCheckLoading || !scanResult}>
                  {citationCheckLoading ? <><span style={S.spinner} /> Checking�</> : citationCheckResult ? "?? Re-check" : "Check"}
                </button>
              </div>
              {citationCheckResult && (
                <div style={{ fontSize: 13, color: "#d4d4d8" }}>
                  <div>Score: {citationCheckResult.citationScore} ({citationCheckResult.citationGrade})</div>
                  <div>Authority links: {citationCheckResult.authorityLinks}</div>
                  {citationCheckResult.tip && <div style={{ color: "#93c5fd", marginTop: 6 }}>?? {citationCheckResult.tip}</div>}
                </div>
              )}
            </div>
          </>
        )}

        {/* ================================================================
            SCHEMA & LINKS TAB EXTENSIONS (Batch 6)
            ================================================================ */}
        {tab === "Schema & Links" && (
          <>
            {/* Redirect Chain Auditor */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Redirect Chain Auditor</div>
              <div style={S.cardDesc}>Detect and fix redirect chains � every hop loses ~10-15% link equity and wastes crawl budget.</div>
              <button style={S.btn("primary")} onClick={runRedirectAudit} disabled={redirectAuditLoading || !url.trim()}>
                {redirectAuditLoading ? <><span style={S.spinner} /> Tracing redirects�</> : "Audit Redirect Chain"}
              </button>
              {redirectAuditResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>Chain length: <b>{redirectAuditResult.chainLength}</b></span>
                    <span>Health: <b style={{ color: redirectAuditResult.chainHealthScore >= 80 ? "#4ade80" : "#f87171" }}>{redirectAuditResult.chainHealthScore}/100</b></span>
                    <span>Priority: <b style={{ color: redirectAuditResult.fixPriority === "immediate" ? "#f87171" : "#fbbf24" }}>{redirectAuditResult.fixPriority}</b></span>
                  </div>
                  {redirectAuditResult.detectedChain?.map((hop, i) => (
                    <div key={i} style={{ padding: "4px 0", borderBottom: "1px solid #27272a", fontSize: 12 }}>
                      <span style={{ color: hop.status >= 300 && hop.status < 400 ? "#fbbf24" : "#4ade80" }}>{hop.type || hop.error}</span>
                      <span style={{ color: "#52525b", marginLeft: 8 }}>{hop.url?.slice(0, 60)}</span>
                    </div>
                  ))}
                  {redirectAuditResult.linkEquityLoss && <div style={{ color: "#f87171", marginTop: 6, fontSize: 13 }}>?? Link equity loss: {redirectAuditResult.linkEquityLoss}</div>}
                  {redirectAuditResult.issues?.map((iss, i) => <div key={i} style={{ fontSize: 13, padding: "2px 0" }}>� {iss.issue} ? {iss.fix}</div>)}
                </div>
              )}
            </div>

            {/* Duplicate Content Detector */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Duplicate Content Detector</div>
              <div style={S.cardDesc}>Audit canonical tags, parameter issues, and duplication risks � Google penalises duplicate content.</div>
              <button style={S.btn("primary")} onClick={runDupContent} disabled={dupContentLoading || !url.trim()}>
                {dupContentLoading ? <><span style={S.spinner} /> Detecting�</> : "Detect Duplicate Content"}
              </button>
              {dupContentResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>Risk: <b style={{ color: dupContentResult.duplicateRisk === "high" ? "#f87171" : dupContentResult.duplicateRisk === "medium" ? "#fbbf24" : "#4ade80" }}>{dupContentResult.duplicateRisk?.toUpperCase()}</b></span>
                    <span>Score: <b>{dupContentResult.duplicateScore}/100</b></span>
                    <span>Canonical: <b style={{ color: dupContentResult.canonicalStatus?.hasCanonical ? "#4ade80" : "#f87171" }}>{dupContentResult.canonicalStatus?.hasCanonical ? "present" : "MISSING"}</b></span>
                  </div>
                  {dupContentResult.canonicalStatus?.recommendation && <div style={{ color: "#93c5fd", marginBottom: 6 }}>?? {dupContentResult.canonicalStatus.recommendation}</div>}
                  {dupContentResult.topActions?.map((a, i) => <div key={i} style={{ fontSize: 13, padding: "2px 0" }}>� {a}</div>)}
                </div>
              )}
            </div>

            {/* Hreflang International SEO */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Hreflang & International SEO</div>
              <div style={S.cardDesc}>Audit hreflang tags and get a strategy for targeting multiple countries and languages.</div>
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Target markets (e.g. US, UK, DE, FR � optional)..." value={hreflangMarkets} onChange={e => setHreflangMarkets(e.target.value)} />
              <button style={S.btn("primary")} onClick={runHreflangAdvisor} disabled={hreflangLoading || !url.trim()}>
                {hreflangLoading ? <><span style={S.spinner} /> Auditing�</> : "Audit Hreflang / International SEO"}
              </button>
              {hreflangResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>Int'l score: <b style={{ color: hreflangResult.internationalSeoScore >= 70 ? "#4ade80" : "#fbbf24" }}>{hreflangResult.internationalSeoScore}/100</b></span>
                    <span>Tags found: <b>{hreflangResult.hreflangAudit?.tagCount || 0}</b></span>
                    <span>x-default: <b style={{ color: hreflangResult.hreflangAudit?.hasXDefaultTag ? "#4ade80" : "#f87171" }}>{hreflangResult.hreflangAudit?.hasXDefaultTag ? "?" : "?"}</b></span>
                  </div>
                  {hreflangResult.hreflangAudit?.issues?.map((iss, i) => <div key={i} style={{ fontSize: 13, padding: "2px 0" }}>� {iss}</div>)}
                  {hreflangResult.topActions?.map((a, i) => <div key={i} style={{ fontSize: 12, color: "#4ade80", padding: "2px 0" }}>? {a}</div>)}
                </div>
              )}
            </div>

            {/* Mobile SEO Checker */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Mobile SEO Checker</div>
              <div style={S.cardDesc}>Check mobile-first indexing readiness � Google uses the mobile version for indexing and ranking.</div>
              <button style={S.btn("primary")} onClick={runMobileSeoAdvisor} disabled={mobileSeoLoading || !url.trim()}>
                {mobileSeoLoading ? <><span style={S.spinner} /> Checking mobile�</> : "Check Mobile SEO"}
              </button>
              {mobileSeoResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>Mobile score: <b style={{ color: mobileSeoResult.mobileScore >= 70 ? "#4ade80" : "#fbbf24" }}>{mobileSeoResult.mobileScore}/100</b></span>
                    <span style={{ color: mobileSeoResult.mobileFriendlyLabel === "mobile-friendly" ? "#4ade80" : "#f87171" }}>{mobileSeoResult.mobileFriendlyLabel}</span>
                    <span>Viewport: <b style={{ color: !mobileSeoResult.viewportIssue ? "#4ade80" : "#f87171" }}>{mobileSeoResult.viewportIssue ? "MISSING" : "?"}</b></span>
                  </div>
                  {mobileSeoResult.criticalIssues?.map((iss, i) => (
                    <div key={i} style={{ padding: "5px 0", borderBottom: "1px solid #27272a" }}>
                      <span style={{ color: iss.priority === "high" ? "#f87171" : "#fbbf24", fontWeight: 600 }}>{iss.priority?.toUpperCase()}</span>
                      <span style={{ marginLeft: 8 }}>{iss.issue}</span>
                      <div style={{ color: "#a1a1aa", fontSize: 12 }}>Fix: {iss.fix}</div>
                    </div>
                  ))}
                  {mobileSeoResult.topActions?.map((a, i) => <div key={i} style={{ fontSize: 13, padding: "2px 0" }}>� {a}</div>)}
                </div>
              )}
            </div>
          </>
        )}

        {/* ================================================================
            SERP & CTR TAB
            ================================================================ */}
        {tab === "SERP & CTR" && (
          <>
            {/* CTR Optimizer */}
            <div style={{ ...S.card, marginTop: 16 }}>
              <div style={S.cardTitle}>?? CTR Optimizer</div>
              <div style={S.cardDesc}>Analyze your title &amp; meta for click-through potential and get AI-improved versions.</div>
              <input style={{ ...S.input, marginBottom: 6 }} placeholder="Page title..." value={ctrTitle} onChange={e => setCtrTitle(e.target.value)} />
              <input style={{ ...S.input, marginBottom: 6 }} placeholder="Meta description..." value={ctrMeta} onChange={e => setCtrMeta(e.target.value)} />
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Target keyword (optional)..." value={ctrKeyword} onChange={e => setCtrKeyword(e.target.value)} />
              <button style={S.btn("primary")} onClick={runCtrOptimizer} disabled={ctrOptimizerLoading || !ctrTitle.trim()}>
                {ctrOptimizerLoading ? <><span style={S.spinner} /> Analyzing�</> : "Optimize CTR"}
              </button>
              {ctrOptimizerResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
                    <span>CTR Score: <b style={{ color: ctrOptimizerResult.ctrScore >= 70 ? "#4ade80" : ctrOptimizerResult.ctrScore >= 50 ? "#facc15" : "#f87171" }}>{ctrOptimizerResult.ctrScore}/100</b></span>
                    <span>Title: <b>{ctrOptimizerResult.titleScore}/100</b></span>
                    <span>Desc: <b>{ctrOptimizerResult.descScore}/100</b></span>
                  </div>
                  {ctrOptimizerResult.improvedTitle && <div style={{ marginBottom: 6 }}><b>Improved title:</b> {ctrOptimizerResult.improvedTitle}</div>}
                  {ctrOptimizerResult.improvedDesc && <div style={{ marginBottom: 6 }}><b>Improved desc:</b> {ctrOptimizerResult.improvedDesc}</div>}
                  {ctrOptimizerResult.estimatedCTRLift && <div style={{ color: "#4ade80" }}>Estimated CTR lift: {ctrOptimizerResult.estimatedCTRLift}</div>}
                  {ctrOptimizerResult.powerWords?.length > 0 && <div style={{ marginTop: 6 }}>Power words: {ctrOptimizerResult.powerWords.join(", ")}</div>}
                  {(ctrOptimizerResult.titleIssues?.length > 0 || ctrOptimizerResult.descIssues?.length > 0) && (
                    <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                      {[...(ctrOptimizerResult.titleIssues || []), ...(ctrOptimizerResult.descIssues || [])].map((iss, i) => <li key={i} style={{ color: "#fca5a5" }}>{iss}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Search Intent Classifier */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Search Intent Classifier</div>
              <div style={S.cardDesc}>Classify the intent behind any keyword and check if your content matches.</div>
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Keyword to classify..." value={intentKeyword} onChange={e => setIntentKeyword(e.target.value)} />
              <button style={S.btn("primary")} onClick={runIntentClassifier} disabled={intentLoading || !intentKeyword.trim()}>
                {intentLoading ? <><span style={S.spinner} /> Classifying�</> : "Classify Intent"}
              </button>
              {intentResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 6, flexWrap: "wrap" }}>
                    <span>Intent: <b style={{ color: "#818cf8" }}>{intentResult.primaryIntent}</b></span>
                    <span>Confidence: <b>{intentResult.confidence}%</b></span>
                    <span>Sub-intent: <b>{intentResult.subIntent}</b></span>
                  </div>
                  <div style={{ marginBottom: 4 }}>Content match: <b>{intentResult.contentMatch}%</b> � {intentResult.contentMatchExplanation}</div>
                  <div>Target audience: {intentResult.targetAudience} � Stage: {intentResult.buyerStage}</div>
                  {intentResult.recommendations?.length > 0 && <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>{intentResult.recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>}
                </div>
              )}
            </div>

            {/* SERP Feature Targets */}
            <div style={S.card}>
              <div style={S.cardTitle}>? SERP Feature Targets</div>
              <div style={S.cardDesc}>Discover which rich SERP features your content can win (Featured Snippet, PAA, HowTo, FAQ�).</div>
              <div style={S.row}>
                <button style={S.btn("primary")} onClick={runSerpFeatureTargets} disabled={serpFeaturesLoading || !url.trim()}>
                  {serpFeaturesLoading ? <><span style={S.spinner} /> Scanning�</> : "Find SERP Targets"}
                </button>
              </div>
              {serpFeaturesResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ marginBottom: 6 }}><b>Top opportunity:</b> {serpFeaturesResult.topOpportunity}</div>
                  {serpFeaturesResult.eligibleFeatures?.slice(0, 5).map((f, i) => (
                    <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid #27272a" }}>
                      <span style={{ fontWeight: 600 }}>{f.feature}</span>
                      <span style={{ color: f.eligibility >= 70 ? "#4ade80" : f.eligibility >= 40 ? "#facc15" : "#f87171", marginLeft: 8 }}>{f.eligibility}%</span>
                      {f.currentlyWinning && <span style={{ marginLeft: 8, color: "#4ade80" }}>? Winning</span>}
                      {f.stepsToWin?.length > 0 && <div style={{ color: "#a1a1aa", fontSize: 12, marginTop: 2 }}>{f.stepsToWin[0]}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* People Also Ask Generator */}
            <div style={S.card}>
              <div style={S.cardTitle}>? People Also Ask Generator</div>
              <div style={S.cardDesc}>Generate realistic PAA questions to add to your content as FAQ sections or H2 headings.</div>
              <input style={{ ...S.input, marginBottom: 6 }} placeholder="Target keyword..." value={paaGenKeyword} onChange={e => setPaaGenKeyword(e.target.value)} />
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Niche (optional)..." value={paaGenNiche} onChange={e => setPaaGenNiche(e.target.value)} />
              <button style={S.btn("primary")} onClick={runPaaGenerator} disabled={paaGenLoading || !paaGenKeyword.trim()}>
                {paaGenLoading ? <><span style={S.spinner} /> Generating�</> : "Generate PAA Questions"}
              </button>
              {paaGenResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ marginBottom: 6 }}><b>{paaGenResult.totalQuestions}</b> questions across {paaGenResult.topicClusters?.join(", ")}</div>
                  {paaGenResult.questions?.slice(0, 8).map((q, i) => (
                    <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid #27272a" }}>
                      <div style={{ fontWeight: 600 }}>{q.question}</div>
                      <div style={{ color: "#a1a1aa", fontSize: 12, marginTop: 2 }}>{q.answerSnippet}</div>
                      <div style={{ color: "#818cf8", fontSize: 11, marginTop: 2 }}>Intent: {q.intent} � Difficulty: {q.difficulty}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rich Result Eligibility */}
            <div style={S.card}>
              <div style={S.cardTitle}>??? Rich Result Eligibility Check</div>
              <div style={S.cardDesc}>Check which Google rich results your page is eligible for based on schema markup.</div>
              <button style={S.btn("primary")} onClick={runRichResultCheck} disabled={richResultCheckLoading || !url.trim()}>
                {richResultCheckLoading ? <><span style={S.spinner} /> Checking�</> : "Check Rich Results"}
              </button>
              {richResultCheckResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ marginBottom: 6 }}>Schemas detected: <b>{richResultCheckResult.schemasDetected?.join(", ") || "none"}</b></div>
                  <div style={{ marginBottom: 6 }}>
                    <span style={{ color: "#4ade80" }}>{richResultCheckResult.totalEligible} eligible</span>
                    {" � "}
                    <span style={{ color: "#f87171" }}>{richResultCheckResult.totalMissing} missing</span>
                  </div>
                  {richResultCheckResult.richResults?.map((r, i) => (
                    <div key={i} style={{ padding: "4px 0", display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ color: r.status === "eligible" ? "#4ade80" : "#f87171" }}>{r.status === "eligible" ? "?" : "?"}</span>
                      <span>{r.type}</span>
                      {r.fix && <span style={{ color: "#a1a1aa", fontSize: 12 }}>? {r.fix}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RankBrain / UX Advisor */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? RankBrain UX Advisor</div>
              <div style={S.cardDesc}>Get dwell time, bounce rate, and UX recommendations aligned with Google's RankBrain signals.</div>
              <button style={S.btn("primary")} onClick={runRankbrainAdvisor} disabled={rankbrainLoading || !url.trim()}>
                {rankbrainLoading ? <><span style={S.spinner} /> Analyzing�</> : "Analyze UX Signals"}
              </button>
              {rankbrainResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>Dwell score: <b style={{ color: rankbrainResult.dwellTimeScore >= 70 ? "#4ade80" : "#facc15" }}>{rankbrainResult.dwellTimeScore}/100</b></span>
                    <span>Bounce risk: <b style={{ color: rankbrainResult.bounceRiskScore <= 30 ? "#4ade80" : "#f87171" }}>{rankbrainResult.bounceRiskScore}/100</b></span>
                    <span>Predicted dwell: <b>{rankbrainResult.predictedDwellTime}</b></span>
                  </div>
                  <div style={{ marginBottom: 6 }}>Opening hook: <b>{rankbrainResult.openingHookStrength}</b> � {rankbrainResult.openingHookFeedback}</div>
                  {rankbrainResult.topImprovements?.slice(0, 4).map((t, i) => (
                    <div key={i} style={{ padding: "5px 0", borderBottom: "1px solid #27272a" }}>
                      <span style={{ color: "#818cf8" }}>{t.area}</span>: {t.fix}
                      <span style={{ marginLeft: 6, color: t.expectedImpact === "high" ? "#4ade80" : "#facc15", fontSize: 11 }}>[{t.expectedImpact}]</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Long-tail Title Embedder */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Long-tail Title Embedder</div>
              <div style={S.cardDesc}>Embed additional long-tail keywords naturally into your title for multi-keyword ranking.</div>
              <input style={{ ...S.input, marginBottom: 6 }} placeholder="Your current title..." value={longtailTitle} onChange={e => setLongtailTitle(e.target.value)} />
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Primary keyword..." value={longtailPrimary} onChange={e => setLongtailPrimary(e.target.value)} />
              <button style={S.btn("primary")} onClick={runLongtailEmbed} disabled={longtailEmbedLoading || !longtailTitle.trim() || !longtailPrimary.trim()}>
                {longtailEmbedLoading ? <><span style={S.spinner} /> Generating�</> : "Generate Long-tail Variants"}
              </button>
              {longtailEmbedResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ marginBottom: 6 }}><b>Best variant:</b> {longtailEmbedResult.bestVariant}</div>
                  {longtailEmbedResult.longTailVariants?.slice(0, 5).map((v, i) => (
                    <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid #27272a" }}>
                      <div style={{ fontWeight: 600 }}>{v.revisedTitle}</div>
                      <div style={{ color: "#a1a1aa", fontSize: 12 }}>Keyword: {v.keyword} � Volume: {v.searchVolume} � Difficulty: {v.difficulty}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Meta A/B Variants */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Meta Description A/B Variants</div>
              <div style={S.cardDesc}>Generate 5 A/B meta description variants using different psychological triggers.</div>
              <input style={{ ...S.input, marginBottom: 6 }} placeholder="Page title..." value={metaAbTitle} onChange={e => setMetaAbTitle(e.target.value)} />
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Target keyword (optional)..." value={metaAbKeyword} onChange={e => setMetaAbKeyword(e.target.value)} />
              <button style={S.btn("primary")} onClick={runMetaAbVariants} disabled={metaAbLoading || !metaAbTitle.trim()}>
                {metaAbLoading ? <><span style={S.spinner} /> Generating�</> : "Generate Variants"}
              </button>
              {metaAbResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ marginBottom: 6 }}>Recommended: <b style={{ color: "#818cf8" }}>Variant {metaAbResult.recommended}</b></div>
                  {metaAbResult.variants?.map((v, i) => (
                    <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid #27272a" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                        <span style={{ background: v.id === metaAbResult.recommended ? "#3730a3" : "#27272a", borderRadius: 4, padding: "1px 6px", fontSize: 11 }}>Variant {v.id}</span>
                        <span style={{ color: "#a1a1aa", fontSize: 11 }}>{v.trigger} � {v.ctrEstimate} CTR</span>
                        <span style={{ color: "#a1a1aa", fontSize: 11 }}>{v.characterCount} chars</span>
                      </div>
                      <div style={{ fontSize: 13 }}>{v.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Keyword Difficulty Score */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Keyword Difficulty Estimator</div>
              <div style={S.cardDesc}>Estimate keyword difficulty, search volume, and ranking timeframe for any keyword.</div>
              <input style={{ ...S.input, marginBottom: 6 }} placeholder="Keyword..." value={diffKeyword} onChange={e => setDiffKeyword(e.target.value)} />
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Niche (optional)..." value={diffNiche} onChange={e => setDiffNiche(e.target.value)} />
              <button style={S.btn("primary")} onClick={runDifficultyScore} disabled={difficultyLoading || !diffKeyword.trim()}>
                {difficultyLoading ? <><span style={S.spinner} /> Estimating�</> : "Estimate Difficulty"}
              </button>
              {difficultyResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>Difficulty: <b style={{ color: difficultyResult.estimatedDifficulty >= 70 ? "#f87171" : difficultyResult.estimatedDifficulty >= 40 ? "#facc15" : "#4ade80" }}>{difficultyResult.estimatedDifficulty}/100 ({difficultyResult.difficultyLabel})</b></span>
                    <span>Volume: <b>{difficultyResult.estimatedMonthlySearches}</b></span>
                  </div>
                  <div style={{ marginBottom: 4 }}>CPC: {difficultyResult.cpcEstimate} � Ranking time: {difficultyResult.rankingTimeframe}</div>
                  <div style={{ marginBottom: 4 }}>Best content type: {difficultyResult.contentStrategy}</div>
                  {difficultyResult.quickWinPotential && <div style={{ color: "#4ade80" }}>? Quick win: {difficultyResult.quickWinExplanation}</div>}
                </div>
              )}
            </div>

            {/* SERP Competitor Snapshot */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? SERP Competitor Snapshot</div>
              <div style={S.cardDesc}>Analyze the competitive landscape for any keyword to find content gaps and ranking opportunities.</div>
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Target keyword..." value={snapKeyword} onChange={e => setSnapKeyword(e.target.value)} />
              <button style={S.btn("primary")} onClick={runCompetitorSnapshot} disabled={competitorSnapshotLoading || !snapKeyword.trim()}>
                {competitorSnapshotLoading ? <><span style={S.spinner} /> Analyzing�</> : "Snapshot Competitors"}
              </button>
              {competitorSnapshotResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ marginBottom: 6 }}>Recommended type: <b>{competitorSnapshotResult.recommendedContentType}</b> � Min words: <b>{competitorSnapshotResult.minimumWordCount}</b></div>
                  {competitorSnapshotResult.topCompetitors?.slice(0, 3).map((c, i) => (
                    <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid #27272a" }}>
                      <span style={{ color: "#facc15" }}>#{c.position}</span> {c.contentType} � {c.estimatedWordCount} words � DA: {c.estimatedDA}
                      <div style={{ color: "#a1a1aa", fontSize: 12 }}>Strength: {c.keyStrength}</div>
                    </div>
                  ))}
                  {competitorSnapshotResult.contentOpportunities?.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Opportunities:</div>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>{competitorSnapshotResult.contentOpportunities.map((o, i) => <li key={i}>{o}</li>)}</ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ================================================================
            SERP & CTR TAB EXTENSIONS (Batch 6)
            ================================================================ */}
        {tab === "SERP & CTR" && (
          <>
            {/* Google News / Discover Optimizer */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Google News & Discover Optimizer</div>
              <div style={S.cardDesc}>Audit your page for Google News and Discover eligibility � NewsArticle schema, freshness signals, headline optimization.</div>
              <button style={S.btn("primary")} onClick={runNewsSeo} disabled={newsSeoLoading || !url.trim()}>
                {newsSeoLoading ? <><span style={S.spinner} /> Auditing for News�</> : "Optimize for Google News/Discover"}
              </button>
              {newsSeoResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>News score: <b style={{ color: newsSeoResult.newsEligibilityScore >= 70 ? "#4ade80" : "#fbbf24" }}>{newsSeoResult.newsEligibilityScore}/100</b></span>
                    <span>Discover: <b style={{ color: newsSeoResult.discoverEligibilityScore >= 70 ? "#4ade80" : "#fbbf24" }}>{newsSeoResult.discoverEligibilityScore}/100</b></span>
                    <span>AMP: <b>{newsSeoResult.hasAmpLink ? "?" : "?"}</b></span>
                    <span>NewsSchema: <b>{newsSeoResult.hasNewsSchema ? "?" : "?"}</b></span>
                  </div>
                  {newsSeoResult.headlineOptimization?.improved && <div style={{ background: "#18181b", borderRadius: 6, padding: "8px 12px", marginBottom: 8, fontSize: 13 }}>?? Better headline: <span style={{ color: "#4ade80" }}>{newsSeoResult.headlineOptimization.improved}</span></div>}
                  {newsSeoResult.topActions?.map((a, i) => <div key={i} style={{ fontSize: 13, padding: "2px 0" }}>� {a}</div>)}
                </div>
              )}
            </div>

            {/* Video SEO Optimizer */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Video SEO Rich Results</div>
              <div style={S.cardDesc}>Optimize for video rich results � VideoObject schema, thumbnail strategy, transcript and chapter markers.</div>
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Video keyword (optional � or uses page URL above)..." value={videoSeoKw} onChange={e => setVideoSeoKw(e.target.value)} />
              <button style={S.btn("primary")} onClick={runVideoSeo} disabled={videoSeoLoading || (!url.trim() && !videoSeoKw.trim())}>
                {videoSeoLoading ? <><span style={S.spinner} /> Optimizing�</> : "Optimize Video SEO"}
              </button>
              {videoSeoResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>Rich result score: <b style={{ color: videoSeoResult.videoRichResultScore >= 70 ? "#4ade80" : "#fbbf24" }}>{videoSeoResult.videoRichResultScore}/100</b></span>
                    <span style={{ color: videoSeoResult.richResultEligibility === "eligible" ? "#4ade80" : "#fbbf24" }}>{videoSeoResult.richResultEligibility}</span>
                  </div>
                  {videoSeoResult.videoObjectSchema?.missingFields?.length > 0 && <div style={{ color: "#fbbf24", marginBottom: 6 }}>Missing fields: {videoSeoResult.videoObjectSchema.missingFields.join(", ")}</div>}
                  {videoSeoResult.pageOptimization?.map((a, i) => <div key={i} style={{ fontSize: 13, padding: "2px 0" }}>� {a}</div>)}
                </div>
              )}
            </div>

            {/* Entity / Knowledge Graph Optimizer */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Entity & Knowledge Graph Optimizer</div>
              <div style={S.cardDesc}>Strengthen entity signals for Knowledge Graph inclusion � sameAs links, entity schema, co-occurrence terms.</div>
              <input style={{ ...S.input, marginBottom: 6 }} placeholder="Target keyword or entity..." value={entityOptKw} onChange={e => setEntityOptKw(e.target.value)} />
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Entity name (brand/person/product � optional)..." value={entityOptName} onChange={e => setEntityOptName(e.target.value)} />
              <button style={S.btn("primary")} onClick={runEntityOpt} disabled={entityOptLoading || (!entityOptKw.trim() && !entityOptName.trim())}>
                {entityOptLoading ? <><span style={S.spinner} /> Analyzing entity�</> : "Optimize Entity Signals"}
              </button>
              {entityOptResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>Entity score: <b style={{ color: entityOptResult.entityScore >= 70 ? "#4ade80" : "#fbbf24" }}>{entityOptResult.entityScore}/100</b></span>
                    <span>Type: <b>{entityOptResult.entityType}</b></span>
                  </div>
                  {entityOptResult.sameAsOpportunities?.map((s, i) => <div key={i} style={{ fontSize: 12, color: "#818cf8" }}>?? {s}</div>)}
                  {entityOptResult.topActions?.map((a, i) => <div key={i} style={{ fontSize: 13, padding: "2px 0" }}>� {a}</div>)}
                </div>
              )}
            </div>

            {/* Product / Review Schema */}
            <div style={S.card}>
              <div style={S.cardTitle}>? Product & Review Schema Optimizer</div>
              <div style={S.cardDesc}>Get star ratings, price and availability in Google SERPs � requires correct Product + AggregateRating schema.</div>
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Product name (optional � or uses page URL above)..." value={reviewSchemaProduct} onChange={e => setReviewSchemaProduct(e.target.value)} />
              <button style={S.btn("primary")} onClick={runReviewSchema6} disabled={reviewSchemaLoading || (!url.trim() && !reviewSchemaProduct.trim())}>
                {reviewSchemaLoading ? <><span style={S.spinner} /> Building schema�</> : "Optimize Product/Review Schema"}
              </button>
              {reviewSchemaResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ marginBottom: 6 }}>Rich results: <b style={{ color: "#4ade80" }}>{reviewSchemaResult.richResultTypes?.join(", ")}</b></div>
                  <div>Star rating eligibility: <b style={{ color: reviewSchemaResult.starRatingEligibility === "eligible" ? "#4ade80" : "#fbbf24" }}>{reviewSchemaResult.starRatingEligibility}</b></div>
                  {reviewSchemaResult.currentSchemaIssues?.map((iss, i) => <div key={i} style={{ fontSize: 13, padding: "2px 0", color: "#f87171" }}>?? {iss}</div>)}
                  {reviewSchemaResult.topActions?.map((a, i) => <div key={i} style={{ fontSize: 13, padding: "2px 0" }}>� {a}</div>)}
                </div>
              )}
            </div>

            {/* Event Schema Builder */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Event Schema Builder</div>
              <div style={S.cardDesc}>Generate Event JSON-LD schema to appear in Google's event rich results and Search.</div>
              <input style={{ ...S.input, marginBottom: 6 }} placeholder="Event name..." value={eventSchemaName} onChange={e => setEventSchemaName(e.target.value)} />
              <input style={{ ...S.input, marginBottom: 6 }} placeholder="Event date (e.g. 2026-06-15T14:00)..." value={eventSchemaDate} onChange={e => setEventSchemaDate(e.target.value)} />
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Location (address or 'Online')..." value={eventSchemaLocation} onChange={e => setEventSchemaLocation(e.target.value)} />
              <button style={S.btn("primary")} onClick={runEventSchemaSeo} disabled={eventSchemaLoading || !eventSchemaName.trim()}>
                {eventSchemaLoading ? <><span style={S.spinner} /> Building schema�</> : "Build Event Schema"}
              </button>
              {eventSchemaResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  {eventSchemaResult.richResultPreview && (
                    <div style={{ background: "#18181b", borderRadius: 6, padding: "8px 12px", marginBottom: 8 }}>
                      <div style={{ fontWeight: 600 }}>?? {eventSchemaResult.richResultPreview.eventTitle}</div>
                      <div style={{ color: "#4ade80", fontSize: 13 }}>{eventSchemaResult.richResultPreview.dateDisplay} � {eventSchemaResult.richResultPreview.locationDisplay}</div>
                    </div>
                  )}
                  {eventSchemaResult.commonMistakes?.map((m, i) => <div key={i} style={{ fontSize: 12, color: "#a1a1aa", padding: "2px 0" }}>� {m}</div>)}
                  {eventSchemaResult.topActions?.map((a, i) => <div key={i} style={{ fontSize: 13, padding: "2px 0" }}>? {a}</div>)}
                </div>
              )}
            </div>
          </>
        )}

        {/* ================================================================
            BACKLINKS TAB
            ================================================================ */}
        {tab === "Backlinks" && (
          <>
            {/* Backlink Opportunity Finder */}
            <div style={{ ...S.card, marginTop: 16 }}>
              <div style={S.cardTitle}>?? Backlink Opportunity Finder</div>
              <div style={S.cardDesc}>Discover 10 realistic link building opportunities tailored to your niche � with outreach tactics and difficulty ratings.</div>
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Your niche (e.g. 'e-commerce fashion')..." value={backlinkNiche} onChange={e => setBacklinkNiche(e.target.value)} />
              <button style={S.btn("primary")} onClick={runBacklinkOpps} disabled={backlinkOppsLoading || !backlinkNiche.trim()}>
                {backlinkOppsLoading ? <><span style={S.spinner} /> Finding�</> : "Find Opportunities"}
              </button>
              {backlinkOppsResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ marginBottom: 6 }}>Top quick win: <b style={{ color: "#4ade80" }}>{backlinkOppsResult.topQuickWin}</b></div>
                  <div style={{ marginBottom: 8 }}>Strategic priority: <b style={{ color: "#818cf8" }}>{backlinkOppsResult.strategicPriority}</b></div>
                  {backlinkOppsResult.opportunities?.slice(0, 8).map((o, i) => (
                    <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #27272a" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3, flexWrap: "wrap" }}>
                        <span style={{ background: "#3f3f46", borderRadius: 4, padding: "1px 6px", fontSize: 11 }}>{o.type}</span>
                        <span style={{ color: o.difficulty === "easy" ? "#4ade80" : o.difficulty === "medium" ? "#facc15" : "#f87171", fontSize: 11 }}>{o.difficulty}</span>
                        <span style={{ color: "#a1a1aa", fontSize: 11 }}>DA: {o.estimatedDA} � {o.linkType}</span>
                        <span style={{ color: "#a1a1aa", fontSize: 11 }}>Value: {o.linkValue}</span>
                      </div>
                      <div style={{ fontWeight: 600 }}>{o.sourceDomain}</div>
                      <div style={{ color: "#a1a1aa", fontSize: 12, marginTop: 2 }}>{o.tactic}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Competitor Link Gap */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Competitor Link Gap Analyzer</div>
              <div style={S.cardDesc}>Find the backlink gap between your site and competitors, and get a plan to close it.</div>
              <input style={{ ...S.input, marginBottom: 6 }} placeholder="Your domain (e.g. yourshop.com)..." value={linkGapDomain} onChange={e => setLinkGapDomain(e.target.value)} />
              <input style={{ ...S.input, marginBottom: 6 }} placeholder="Competitor 1 domain..." value={linkGapComp1} onChange={e => setLinkGapComp1(e.target.value)} />
              <input style={{ ...S.input, marginBottom: 6 }} placeholder="Competitor 2 domain..." value={linkGapComp2} onChange={e => setLinkGapComp2(e.target.value)} />
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Niche..." value={linkGapNiche} onChange={e => setLinkGapNiche(e.target.value)} />
              <button style={S.btn("primary")} onClick={runLinkGap} disabled={linkGapLoading || !linkGapDomain.trim()}>
                {linkGapLoading ? <><span style={S.spinner} /> Analyzing�</> : "Analyze Link Gap"}
              </button>
              {linkGapResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>Gap score: <b style={{ color: linkGapResult.gapAnalysis?.gapScore >= 70 ? "#f87171" : "#facc15" }}>{linkGapResult.gapAnalysis?.gapScore}/100</b></span>
                    <span>Severity: <b>{linkGapResult.gapAnalysis?.gapSeverity}</b></span>
                    <span>Time to close: <b>{linkGapResult.timeToCloseGap}</b></span>
                  </div>
                  {linkGapResult.prioritizedActions?.length > 0 && (
                    <ul style={{ margin: 0, paddingLeft: 18 }}>{linkGapResult.prioritizedActions.map((a, i) => <li key={i}>{a}</li>)}</ul>
                  )}
                </div>
              )}
            </div>

            {/* Outreach Email Generator */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Outreach Email Generator</div>
              <div style={S.cardDesc}>AI-generated personalized outreach emails for link building with follow-up sequences.</div>
              <input style={{ ...S.input, marginBottom: 6 }} placeholder="Target site (e.g. industry-blog.com)..." value={outreachTarget} onChange={e => setOutreachTarget(e.target.value)} />
              <input style={{ ...S.input, marginBottom: 6 }} placeholder="Your content title..." value={outreachContentTitle} onChange={e => setOutreachContentTitle(e.target.value)} />
              <select style={{ ...S.input, marginBottom: 8 }} value={outreachType} onChange={e => setOutreachType(e.target.value)}>
                {["guest post", "resource link", "broken link replacement", "skyscraper", "collaboration"].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button style={S.btn("primary")} onClick={runOutreachGenerator} disabled={outreachLoading || !outreachContentTitle.trim()}>
                {outreachLoading ? <><span style={S.spinner} /> Writing�</> : "Generate Outreach Email"}
              </button>
              {outreachResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ marginBottom: 6 }}>Subject: <b>{outreachResult.subject}</b></div>
                  <div style={{ background: "#09090b", padding: "10px", borderRadius: 6, marginBottom: 8, fontSize: 13, whiteSpace: "pre-wrap" }}>{outreachResult.emailBody}</div>
                  <div style={{ marginBottom: 4 }}>Follow-up subject: <i>{outreachResult.followUpSubject}</i></div>
                  <div style={{ color: "#a1a1aa", fontSize: 12, whiteSpace: "pre-wrap" }}>{outreachResult.followUpBody}</div>
                  <div style={{ marginTop: 8, color: "#a1a1aa", fontSize: 12 }}>Success probability: {outreachResult.successProbability}</div>
                </div>
              )}
            </div>

            {/* "Best Of" List Finder */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? "Best Of" List Finder</div>
              <div style={S.cardDesc}>Find roundup and "best of" lists in your niche � easy placements for backlinks.</div>
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Your niche..." value={bestofNiche} onChange={e => setBestofNiche(e.target.value)} />
              <button style={S.btn("primary")} onClick={runBestofFinder} disabled={bestofLoading || !bestofNiche.trim()}>
                {bestofLoading ? <><span style={S.spinner} /> Finding�</> : "Find Lists"}
              </button>
              {bestofResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ marginBottom: 8 }}>Pitch template: <i>{bestofResult.pitchTemplate}</i></div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Google search strings:</div>
                  {bestofResult.searchStrings?.slice(0, 6).map((s, i) => (
                    <div key={i} style={{ padding: "3px 0", color: "#93c5fd", fontSize: 13 }}>{s}</div>
                  ))}
                  {bestofResult.listTypes?.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      {bestofResult.listTypes.slice(0, 4).map((l, i) => (
                        <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid #27272a" }}>
                          <span style={{ fontWeight: 600 }}>{l.type}</span>
                          <span style={{ marginLeft: 8, color: l.difficulty === "easy" ? "#4ade80" : "#facc15", fontSize: 11 }}>{l.difficulty}</span>
                          <div style={{ color: "#a1a1aa", fontSize: 12 }}>{l.outreachApproach}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Anchor Text Optimizer */}
            <div style={S.card}>
              <div style={S.cardTitle}>? Anchor Text Optimizer</div>
              <div style={S.cardDesc}>Build a natural anchor text profile to avoid over-optimization penalties while maximizing link equity.</div>
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Target keyword for your page..." value={anchorOptKeyword} onChange={e => setAnchorOptKeyword(e.target.value)} />
              <button style={S.btn("primary")} onClick={runAnchorOptimizer} disabled={anchorOptLoading || !anchorOptKeyword.trim()}>
                {anchorOptLoading ? <><span style={S.spinner} /> Optimizing�</> : "Optimize Anchor Profile"}
              </button>
              {anchorOptResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ marginBottom: 6 }}>Current assessment: <b>{anchorOptResult.currentDistributionAssessment}</b></div>
                  <div style={{ marginBottom: 8, fontSize: 12, color: "#a1a1aa" }}>
                    Ideal: exact {anchorOptResult.idealDistribution?.exactMatch} � partial {anchorOptResult.idealDistribution?.partialMatch} � branded {anchorOptResult.idealDistribution?.branded} � generic {anchorOptResult.idealDistribution?.generic}
                  </div>
                  {anchorOptResult.recommendedAnchors?.slice(0, 6).map((a, i) => (
                    <div key={i} style={{ padding: "5px 0", borderBottom: "1px solid #27272a" }}>
                      <span style={{ fontWeight: 600 }}>{a.anchorText}</span>
                      <span style={{ marginLeft: 8, color: "#818cf8", fontSize: 11 }}>{a.type}</span>
                      <span style={{ marginLeft: 8, color: "#a1a1aa", fontSize: 11 }}>{a.usageRecommendation}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Link Building Strategy Builder */}
            <div style={S.card}>
              <div style={S.cardTitle}>??? Link Building Strategy Builder</div>
              <div style={S.cardDesc}>Get a full phased link building strategy with tactics, timelines, and monthly targets.</div>
              <input style={{ ...S.input, marginBottom: 6 }} placeholder="Your niche..." value={linkStratNiche} onChange={e => setLinkStratNiche(e.target.value)} />
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Monthly budget (optional, e.g. '$200/mo' or 'free only')..." value={linkStratBudget} onChange={e => setLinkStratBudget(e.target.value)} />
              <button style={S.btn("primary")} onClick={runLinkStrategy} disabled={linkStrategyLoading || !linkStratNiche.trim()}>
                {linkStrategyLoading ? <><span style={S.spinner} /> Building�</> : "Build Strategy"}
              </button>
              {linkStrategyResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{linkStrategyResult.strategyName}</div>
                  <div style={{ color: "#a1a1aa", marginBottom: 8 }}>{linkStrategyResult.overview}</div>
                  <div style={{ marginBottom: 4 }}>Monthly target: <b>{linkStrategyResult.monthlyLinkTarget}</b> � 6-month projection: <b>{linkStrategyResult.sixMonthLinkProjection || linkStrategyResult["6MonthLinkProjection"]}</b></div>
                  {linkStrategyResult.phases?.map((p, i) => (
                    <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #27272a" }}>
                      <div style={{ fontWeight: 600 }}>Phase {p.phase}: {p.name} ({p.duration})</div>
                      <div style={{ color: "#a1a1aa", fontSize: 12 }}>Focus: {p.primaryTactic} � Target: {p.targetLinks} links</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Internal Link Suggester */}
            <div style={S.card}>
              <div style={S.cardTitle}>??? Internal Link Suggester</div>
              <div style={S.cardDesc}>Analyze a page and get AI-suggested internal linking opportunities to boost page authority flow.</div>
              <button style={S.btn("primary")} onClick={runInternalSuggest} disabled={internalSuggestLoading || !url.trim()}>
                {internalSuggestLoading ? <><span style={S.spinner} /> Analyzing�</> : "Find Internal Link Opportunities"}
              </button>
              {internalSuggestResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>Internal link score: <b style={{ color: internalSuggestResult.internalLinkScore >= 70 ? "#4ade80" : "#facc15" }}>{internalSuggestResult.internalLinkScore}/100</b></span>
                    <span>Current links: <b>{internalSuggestResult.currentInternalLinkCount}</b></span>
                    <span>Orphan risk: <b style={{ color: internalSuggestResult.orphanRisk === "high" ? "#f87171" : "#4ade80" }}>{internalSuggestResult.orphanRisk}</b></span>
                  </div>
                  {internalSuggestResult.suggestedLinkOpportunities?.slice(0, 6).map((s, i) => (
                    <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid #27272a" }}>
                      <div><b>"{s.anchorTextSuggestion}"</b> ? {s.targetPageType}</div>
                      <div style={{ color: "#a1a1aa", fontSize: 12 }}>{s.pageDescription} � {s.locationInContent}</div>
                      <span style={{ color: s.importance === "high" ? "#4ade80" : "#facc15", fontSize: 11 }}>{s.importance} priority</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Link Gap Analysis */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Link Gap Analysis</div>
              <div style={S.cardDesc}>Find domains that link to your competitors but not to you � prioritized by DR, relevance and link type.</div>
              <input style={{ ...S.input, marginBottom: 6 }} placeholder="Your domain (e.g. mysite.com)..." value={linkGapDomain} onChange={e => setLinkGapDomain(e.target.value)} />
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Competitor domains (comma-separated)..." value={linkGapCompetitors} onChange={e => setLinkGapCompetitors(e.target.value)} />
              <button style={S.btn("primary")} onClick={runLinkGapV2} disabled={linkGapLoading || !linkGapDomain.trim()}>
                {linkGapLoading ? <><span style={S.spinner} /> Analyzing gaps�</> : "Find Link Gaps"}
              </button>
              {linkGapResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ marginBottom: 8 }}>Your domain: <b>{linkGapResult.yourDomain}</b> � Gap domains found: <b style={{ color: "#4ade80" }}>{linkGapResult.totalGapDomains}</b></div>
                  {linkGapResult.topLinkGapOpportunities?.slice(0, 6).map((g, i) => (
                    <div key={i} style={{ padding: "4px 0", borderBottom: "1px solid #27272a", fontSize: 13 }}>
                      <b>{g.domain}</b> <span style={{ color: "#4ade80" }}>DR {g.estimatedDR}</span> � {g.linkType} � {g.outreachDifficulty} difficulty
                      <div style={{ color: "#a1a1aa", fontSize: 12 }}>{g.outreachAngle}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Broken Backlink Reclamation */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Broken Backlink Reclamation</div>
              <div style={S.cardDesc}>Identify valuable links pointing to 404/redirected URLs on your site so you can redirect or reclaim them.</div>
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Your domain (e.g. mysite.com)..." value={brokenBacklinksDomain} onChange={e => setBrokenBacklinksDomain(e.target.value)} />
              <button style={S.btn("primary")} onClick={runBrokenBacklinks} disabled={brokenBacklinksLoading || !brokenBacklinksDomain.trim()}>
                {brokenBacklinksLoading ? <><span style={S.spinner} /> Scanning�</> : "Find Broken Backlinks"}
              </button>
              {brokenBacklinksResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ marginBottom: 8 }}>Broken pages found: <b style={{ color: "#f87171" }}>{brokenBacklinksResult.brokenPagesFound}</b> � Recoverable links: <b style={{ color: "#4ade80" }}>{brokenBacklinksResult.recoverableLinkEquity} equity pts</b></div>
                  {brokenBacklinksResult.brokenPages?.slice(0, 5).map((p, i) => (
                    <div key={i} style={{ padding: "4px 0", borderBottom: "1px solid #27272a", fontSize: 13 }}>
                      <b>{p.brokenUrl}</b>
                      <div style={{ color: "#4ade80", fontSize: 12 }}>Fix: {p.suggestedRedirectTarget} � {p.redirectType}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Anchor Text Profile Auditor */}
            <div style={S.card}>
              <div style={S.cardTitle}>? Anchor Text Profile Auditor</div>
              <div style={S.cardDesc}>Analyze your inbound anchor text distribution for over-optimization risks, money-anchor patterns and diversity.</div>
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Your domain (e.g. mysite.com)..." value={anchorTextDomain} onChange={e => setAnchorTextDomain(e.target.value)} />
              <button style={S.btn("primary")} onClick={runAnchorText} disabled={anchorTextLoading || !anchorTextDomain.trim()}>
                {anchorTextLoading ? <><span style={S.spinner} /> Auditing anchors�</> : "Audit Anchor Profile"}
              </button>
              {anchorTextResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>Health: <b style={{ color: anchorTextResult.overallAnchorHealth === "healthy" ? "#4ade80" : "#fbbf24" }}>{anchorTextResult.overallAnchorHealth}</b></span>
                    <span>Penalty risk: <b style={{ color: anchorTextResult.penaltyRisk === "low" ? "#4ade80" : "#f87171" }}>{anchorTextResult.penaltyRisk}</b></span>
                  </div>
                  {anchorTextResult.topActions?.map((a, i) => <div key={i} style={{ fontSize: 13, padding: "2px 0" }}>� {a}</div>)}
                </div>
              )}
            </div>

            {/* Link Velocity Analyzer */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Link Velocity Analyzer</div>
              <div style={S.cardDesc}>Analyze your link acquisition pace � detect spikes, drops, and optimal velocity for sustainable authority building.</div>
              <input style={{ ...S.input, marginBottom: 6 }} placeholder="Your domain (e.g. mysite.com)..." value={linkVelocityDomain} onChange={e => setLinkVelocityDomain(e.target.value)} />
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Current link acquisition rate (links/month, optional)..." value={linkVelocityRate} onChange={e => setLinkVelocityRate(e.target.value)} />
              <button style={S.btn("primary")} onClick={runLinkVelocity} disabled={linkVelocityLoading || !linkVelocityDomain.trim()}>
                {linkVelocityLoading ? <><span style={S.spinner} /> Analyzing velocity�</> : "Analyze Link Velocity"}
              </button>
              {linkVelocityResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>Current: <b>{linkVelocityResult.currentVelocity} links/mo</b></span>
                    <span>Status: <b style={{ color: linkVelocityResult.velocityStatus === "healthy" ? "#4ade80" : "#fbbf24" }}>{linkVelocityResult.velocityStatus}</b></span>
                    <span>Spike risk: <b style={{ color: linkVelocityResult.spikeRisk === "low" ? "#4ade80" : "#f87171" }}>{linkVelocityResult.spikeRisk}</b></span>
                  </div>
                  {linkVelocityResult.topActions?.map((a, i) => <div key={i} style={{ fontSize: 13, padding: "2px 0" }}>� {a}</div>)}
                </div>
              )}
            </div>
          </>
        )}

        {/* ================================================================
            A/B & REFRESH TAB (Batch 6)
            ================================================================ */}
        {tab === "A/B & Refresh" && (
          <>
            {/* SEO A/B Test Advisor */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? SEO A/B Test Advisor</div>
              <div style={S.cardDesc}>Generate 8 prioritized SEO A/B test ideas for your page � title, H1, schema, meta, content experiments with expected uplift.</div>
              <button style={S.btn("primary")} onClick={runAbTest} disabled={abTestLoading || !url.trim()}>
                {abTestLoading ? <><span style={S.spinner} /> Generating test ideas�</> : "Generate A/B Test Ideas"}
              </button>
              {abTestResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ marginBottom: 8, color: "#a1a1aa", fontSize: 13 }}>Page type: <b>{abTestResult.pageType}</b> � Tests generated: <b>{abTestResult.testIdeas?.length}</b></div>
                  {abTestResult.testIdeas?.map((t, i) => (
                    <div key={i} style={{ padding: "7px 0", borderBottom: "1px solid #27272a" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <b>#{i + 1} {t.testName}</b>
                        <span style={{ background: t.priority === "high" ? "#14532d" : "#422006", borderRadius: 4, padding: "1px 6px", fontSize: 11 }}>{t.priority} priority</span>
                        <span style={{ color: "#4ade80", fontSize: 12 }}>+{t.estimatedCtrUplift}% CTR</span>
                      </div>
                      <div style={{ fontSize: 13, color: "#a1a1aa" }}>{t.hypothesis}</div>
                      <div style={{ fontSize: 12, color: "#818cf8" }}>Metric: {t.primaryMetric}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Content Refresh Advisor */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Content Refresh Advisor</div>
              <div style={S.cardDesc}>Analyze aging content signals and get a prioritized refresh roadmap � outdated stats, new sections, E-E-A-T improvements.</div>
              <button style={S.btn("primary")} onClick={runContentRefresh} disabled={contentRefreshLoading || !url.trim()}>
                {contentRefreshLoading ? <><span style={S.spinner} /> Analyzing content�</> : "Get Content Refresh Plan"}
              </button>
              {contentRefreshResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>Freshness: <b style={{ color: contentRefreshResult.freshnessScore >= 70 ? "#4ade80" : "#fbbf24" }}>{contentRefreshResult.freshnessScore}/100</b></span>
                    <span>Refresh priority: <b style={{ color: contentRefreshResult.refreshPriority === "urgent" ? "#f87171" : "#4ade80" }}>{contentRefreshResult.refreshPriority}</b></span>
                    <span>Last updated: <b>{contentRefreshResult.lastModifiedDetected}</b></span>
                  </div>
                  {contentRefreshResult.refreshRoadmap?.map((r, i) => (
                    <div key={i} style={{ padding: "5px 0", borderBottom: "1px solid #27272a", fontSize: 13 }}>
                      <b>{r.section}</b>: {r.action}
                      <span style={{ marginLeft: 8, color: "#4ade80", fontSize: 12 }}>+{r.expectedImpact}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Title Tag A/B Variants */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Title Tag A/B Variants</div>
              <div style={S.cardDesc}>Generate 8 click-optimized title tag variants with psychological triggers, power words and predicted CTR scores.</div>
              <input style={{ ...S.input, marginBottom: 6 }} placeholder="Current title tag (or leave blank to use page URL)..." value={titleVariantsInput} onChange={e => setTitleVariantsInput(e.target.value)} />
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Primary keyword..." value={titleVariantsKw} onChange={e => setTitleVariantsKw(e.target.value)} />
              <button style={S.btn("primary")} onClick={runTitleVariants} disabled={titleVariantsLoading || (!titleVariantsInput.trim() && !url.trim())}>
                {titleVariantsLoading ? <><span style={S.spinner} /> Generating variants�</> : "Generate Title Variants"}
              </button>
              {titleVariantsResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  {titleVariantsResult.variants?.map((v, i) => (
                    <div key={i} style={{ padding: "5px 0", borderBottom: "1px solid #27272a" }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{v.title}</div>
                      <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#a1a1aa", marginTop: 2 }}>
                        <span>CTR: <span style={{ color: "#4ade80" }}>{v.predictedCtrScore}/100</span></span>
                        <span>{v.trigger}</span>
                        <span style={{ color: v.pixelLength > 580 ? "#f87171" : "#4ade80" }}>{v.pixelLength}px</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Meta Description Variants */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Meta Description A/B Variants</div>
              <div style={S.cardDesc}>Generate 8 high-CTR meta description variants using emotional triggers, FOMO, curiosity gaps and benefit-led copy.</div>
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Primary keyword..." value={metaVariantsKw} onChange={e => setMetaVariantsKw(e.target.value)} />
              <button style={S.btn("primary")} onClick={runMetaVariants} disabled={metaVariantsLoading || (!metaVariantsKw.trim() && !url.trim())}>
                {metaVariantsLoading ? <><span style={S.spinner} /> Generating�</> : "Generate Meta Variants"}
              </button>
              {metaVariantsResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  {metaVariantsResult.variants?.map((v, i) => (
                    <div key={i} style={{ padding: "5px 0", borderBottom: "1px solid #27272a" }}>
                      <div style={{ fontSize: 13 }}>{v.metaDescription}</div>
                      <div style={{ display: "flex", gap: 10, fontSize: 12, color: "#a1a1aa", marginTop: 2 }}>
                        <span>CTR: <span style={{ color: "#4ade80" }}>{v.predictedCtrScore}/100</span></span>
                        <span>{v.trigger}</span>
                        <span style={{ color: v.characterCount > 160 ? "#f87171" : "#4ade80" }}>{v.characterCount}ch</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* BERT / NLP Semantic Optimizer */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? BERT / NLP Semantic Optimizer</div>
              <div style={S.cardDesc}>Identify semantic gaps and co-occurrence terms that BERT expects for your keyword � improve topical relevance.</div>
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Target keyword or topic..." value={bertOptKw} onChange={e => setBertOptKw(e.target.value)} />
              <button style={S.btn("primary")} onClick={runBertOpt} disabled={bertOptLoading || !bertOptKw.trim()}>
                {bertOptLoading ? <><span style={S.spinner} /> Analyzing semantics�</> : "Optimize Semantic Relevance"}
              </button>
              {bertOptResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>Semantic score: <b style={{ color: bertOptResult.semanticRelevanceScore >= 70 ? "#4ade80" : "#fbbf24" }}>{bertOptResult.semanticRelevanceScore}/100</b></span>
                    <span>Intent match: <b style={{ color: bertOptResult.intentMatchScore >= 70 ? "#4ade80" : "#fbbf24" }}>{bertOptResult.intentMatchScore}/100</b></span>
                  </div>
                  {bertOptResult.mustUseTerms?.slice(0, 8).map((t, i) => (
                    <span key={i} style={{ display: "inline-block", background: "#18181b", border: "1px solid #3f3f46", borderRadius: 4, padding: "2px 8px", fontSize: 12, margin: "2px 4px 2px 0" }}>{t.term} <span style={{ color: "#4ade80", fontSize: 11 }}>({t.frequency}�)</span></span>
                  ))}
                  {bertOptResult.topActions?.map((a, i) => <div key={i} style={{ fontSize: 13, padding: "4px 0" }}>� {a}</div>)}
                </div>
              )}
            </div>

            {/* Secondary Keyword Optimizer */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Secondary Keyword Optimizer</div>
              <div style={S.cardDesc}>Discover 15 secondary and LSI keywords to weave into your content for broader topical coverage and ranking potential.</div>
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Primary keyword or topic..." value={secondaryKwInput} onChange={e => setSecondaryKwInput(e.target.value)} />
              <button style={S.btn("primary")} onClick={runSecondaryKwFinder} disabled={secondaryKwLoading || !secondaryKwInput.trim()}>
                {secondaryKwLoading ? <><span style={S.spinner} /> Finding keywords�</> : "Find Secondary Keywords"}
              </button>
              {secondaryKwResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ marginBottom: 8, fontSize: 13, color: "#a1a1aa" }}>Primary: <b style={{ color: "#fff" }}>{secondaryKwResult.primaryKeyword}</b> � {secondaryKwResult.totalKeywordsProvided} keywords found</div>
                  {secondaryKwResult.secondaryKeywords?.slice(0, 10).map((k, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, padding: "3px 0", fontSize: 13, borderBottom: "1px solid #27272a" }}>
                      <b style={{ minWidth: 180 }}>{k.keyword}</b>
                      <span style={{ color: "#818cf8" }}>{k.type}</span>
                      <span style={{ color: "#a1a1aa", fontSize: 12 }}>Vol: {k.estimatedMonthlySearches?.toLocaleString()}</span>
                      <span style={{ color: k.difficultyScore < 40 ? "#4ade80" : "#fbbf24", fontSize: 12 }}>KD {k.difficultyScore}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Knowledge Graph Coverage */}
            <div style={S.card}>
              <div style={S.cardTitle}>??? Knowledge Graph Coverage</div>
              <div style={S.cardDesc}>Measure your entity's Knowledge Graph presence � Wikipedia notability, sameAs links, Wikidata, structured data coverage.</div>
              <input style={{ ...S.input, marginBottom: 6 }} placeholder="Entity name (brand, person, product)..." value={knowledgeGraphEntity} onChange={e => setKnowledgeGraphEntity(e.target.value)} />
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Industry or category (e.g. SaaS, Retail)..." value={knowledgeGraphIndustry} onChange={e => setKnowledgeGraphIndustry(e.target.value)} />
              <button style={S.btn("primary")} onClick={runKnowledgeGraph} disabled={knowledgeGraphLoading || !knowledgeGraphEntity.trim()}>
                {knowledgeGraphLoading ? <><span style={S.spinner} /> Checking KG�</> : "Check Knowledge Graph Coverage"}
              </button>
              {knowledgeGraphResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>KG score: <b style={{ color: knowledgeGraphResult.knowledgeGraphScore >= 70 ? "#4ade80" : "#fbbf24" }}>{knowledgeGraphResult.knowledgeGraphScore}/100</b></span>
                    <span>Wikipedia: <b>{knowledgeGraphResult.wikipediaPresence === "present" ? "?" : "?"}</b></span>
                    <span>Wikidata: <b>{knowledgeGraphResult.wikidataPresence === "present" ? "?" : "?"}</b></span>
                  </div>
                  {knowledgeGraphResult.topActions?.map((a, i) => <div key={i} style={{ fontSize: 13, padding: "2px 0" }}>� {a}</div>)}
                </div>
              )}
            </div>
          </>
        )}

        {/* ================================================================
            LOCAL SEO TAB (Batch 5)
            ================================================================ */}
        {tab === "Local SEO" && (
          <>
            {/* Google Business Profile Optimizer */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Google Business Profile Optimizer</div>
              <div style={S.cardDesc}>Optimize your GBP listing with AI-crafted descriptions, categories, photo strategies, and post ideas.</div>
              <input style={{ ...S.input, marginBottom: 6 }} placeholder="Business name..." value={gbpBusiness} onChange={e => setGbpBusiness(e.target.value)} />
              <input style={{ ...S.input, marginBottom: 6 }} placeholder="Location (city, state)..." value={gbpLocation} onChange={e => setGbpLocation(e.target.value)} />
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Business category (e.g. Plumber, Restaurant)..." value={gbpCategory} onChange={e => setGbpCategory(e.target.value)} />
              <button style={S.btn("primary")} onClick={runGbpOptimizer} disabled={gbpLoading || !gbpBusiness.trim()}>
                {gbpLoading ? <><span style={S.spinner} /> Optimizing�</> : "Optimize GBP"}
              </button>
              {gbpResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>Completeness: <b style={{ color: gbpResult.completenessScore >= 70 ? "#4ade80" : "#fbbf24" }}>{gbpResult.completenessScore}/100</b></span>
                    <span>Impact: <b>{gbpResult.estimatedImpact}</b></span>
                    <span>Category: <b>{gbpResult.primaryCategory}</b></span>
                  </div>
                  {gbpResult.optimizedDescription && <div style={{ background: "#18181b", borderRadius: 6, padding: "8px 12px", fontSize: 13, marginBottom: 8 }}>{gbpResult.optimizedDescription}</div>}
                  {gbpResult.quickWins?.map((w, i) => <div key={i} style={{ fontSize: 13, padding: "2px 0" }}>? {w}</div>)}
                  {gbpResult.postIdeas?.length > 0 && (
                    <div style={{ marginTop: 8 }}><div style={{ fontWeight: 600, marginBottom: 4 }}>GBP post ideas:</div>{gbpResult.postIdeas.map((p, i) => <div key={i} style={{ fontSize: 12, padding: "2px 0", color: "#a1a1aa" }}>� {p}</div>)}</div>
                  )}
                </div>
              )}
            </div>

            {/* Citation Finder */}
            <div style={S.card}>
              <div style={S.cardTitle}>??? Local Citation Finder</div>
              <div style={S.cardDesc}>Find NAP citation opportunities across directories � consistent citations boost local pack rankings.</div>
              <input style={{ ...S.input, marginBottom: 6 }} placeholder="Business name..." value={citationBusiness} onChange={e => setCitationBusiness(e.target.value)} />
              <input style={{ ...S.input, marginBottom: 6 }} placeholder="Location (city, state)..." value={citationLocation} onChange={e => setCitationLocation(e.target.value)} />
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Category / industry..." value={citationCategory} onChange={e => setCitationCategory(e.target.value)} />
              <button style={S.btn("primary")} onClick={runCitationFinder} disabled={citationLoading || !citationBusiness.trim()}>
                {citationLoading ? <><span style={S.spinner} /> Finding�</> : "Find Citation Opportunities"}
              </button>
              {citationResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  {citationResult.napConsistencyTips?.map((t, i) => <div key={i} style={{ fontSize: 13, padding: "2px 0", color: "#93c5fd" }}>?? {t}</div>)}
                  <div style={{ fontWeight: 600, margin: "8px 0 4px" }}>Top directories ({citationResult.topDirectories?.length || 0} found):</div>
                  {citationResult.topDirectories?.slice(0, 12).map((d, i) => (
                    <div key={i} style={{ padding: "5px 0", borderBottom: "1px solid #27272a", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600 }}>{d.name}</span>
                      <span style={{ background: d.priority === "high" ? "#14532d" : "#3f3f46", color: d.priority === "high" ? "#4ade80" : "#d4d4d8", borderRadius: 4, padding: "1px 6px", fontSize: 11 }}>{d.priority}</span>
                      <span style={{ color: "#a1a1aa", fontSize: 11 }}>{d.freeOrPaid}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Local Keyword Generator */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Local Keyword Generator</div>
              <div style={S.cardDesc}>Generate local keyword variants including city, neighborhood, near me, and voice search queries.</div>
              <input style={{ ...S.input, marginBottom: 6 }} placeholder="Service (e.g. plumber, SEO agency)..." value={localKwService} onChange={e => setLocalKwService(e.target.value)} />
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="City (e.g. London, New York)..." value={localKwCity} onChange={e => setLocalKwCity(e.target.value)} />
              <button style={S.btn("primary")} onClick={runLocalKwGen} disabled={localKwLoading || !localKwService.trim() || !localKwCity.trim()}>
                {localKwLoading ? <><span style={S.spinner} /> Generating�</> : "Generate Local Keywords"}
              </button>
              {localKwResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  {localKwResult.primaryKeywords?.length > 0 && (
                    <div style={{ marginBottom: 8 }}><div style={{ fontWeight: 600, marginBottom: 4 }}>Primary local keywords:</div><div style={{ color: "#4ade80", fontSize: 13 }}>{localKwResult.primaryKeywords.join(" � ")}</div></div>
                  )}
                  {localKwResult.nearMeKeywords?.length > 0 && (
                    <div style={{ marginBottom: 8 }}><div style={{ fontWeight: 600, marginBottom: 4 }}>Near me variants:</div><div style={{ color: "#818cf8", fontSize: 13 }}>{localKwResult.nearMeKeywords.join(" � ")}</div></div>
                  )}
                  {localKwResult.voiceSearchQueries?.length > 0 && (
                    <div><div style={{ fontWeight: 600, marginBottom: 4 }}>Voice search queries:</div>{localKwResult.voiceSearchQueries.map((q, i) => <div key={i} style={{ fontSize: 12, color: "#a1a1aa" }}>??? {q}</div>)}</div>
                  )}
                </div>
              )}
            </div>

            {/* LocalBusiness Schema Builder */}
            <div style={S.card}>
              <div style={S.cardTitle}>??? LocalBusiness Schema Builder</div>
              <div style={S.cardDesc}>Generate LocalBusiness JSON-LD schema to appear in local rich results and Google Maps.</div>
              <input style={{ ...S.input, marginBottom: 6 }} placeholder="Business name..." value={localSchemaName} onChange={e => setLocalSchemaName(e.target.value)} />
              <input style={{ ...S.input, marginBottom: 6 }} placeholder="Address..." value={localSchemaAddr} onChange={e => setLocalSchemaAddr(e.target.value)} />
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Phone number..." value={localSchemaPhone} onChange={e => setLocalSchemaPhone(e.target.value)} />
              <button style={S.btn("primary")} onClick={runLocalSchema} disabled={localSchemaLoading || !localSchemaName.trim()}>
                {localSchemaLoading ? <><span style={S.spinner} /> Building schema�</> : "Build LocalBusiness Schema"}
              </button>
              {localSchemaResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ marginBottom: 6 }}>Schema type: <b style={{ color: "#818cf8" }}>{localSchemaResult.schemaType}</b></div>
                  {localSchemaResult.richResultPotential?.map((r, i) => <div key={i} style={{ fontSize: 12, color: "#4ade80" }}>? {r}</div>)}
                  {localSchemaResult.schemaMarkup && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Generated schema:</div>
                      <textarea readOnly style={{ ...S.input, height: 120, fontFamily: "monospace", fontSize: 11 }} value={localSchemaResult.schemaMarkup} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ================================================================
            E-E-A-T & BRAND TAB (Batch 5)
            ================================================================ */}
        {tab === "E-E-A-T & Brand" && (
          <>
            {/* E-E-A-T Scorer */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? E-E-A-T Signal Scorer</div>
              <div style={S.cardDesc}>Audit Experience, Expertise, Authoritativeness & Trustworthiness signals � critical for YMYL content.</div>
              <button style={S.btn("primary")} onClick={runEeatScorer} disabled={eeatLoading || !url.trim()}>
                {eeatLoading ? <><span style={S.spinner} /> Scoring E-E-A-T�</> : "Score E-E-A-T Signals"}
              </button>
              {eeatResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>E-E-A-T Score: <b style={{ color: eeatResult.eeatScore >= 70 ? "#4ade80" : eeatResult.eeatScore >= 50 ? "#fbbf24" : "#f87171" }}>{eeatResult.eeatScore}/100</b></span>
                    <span>YMYL Risk: <b style={{ color: eeatResult.ymylRisk === "high" ? "#f87171" : "#fbbf24" }}>{eeatResult.ymylRisk}</b></span>
                  </div>
                  {Object.entries(eeatResult.breakdown || {}).map(([dim, data]) => (
                    <div key={dim} style={{ padding: "6px 0", borderBottom: "1px solid #27272a" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{dim}</span>
                        <span style={{ color: data.score >= 70 ? "#4ade80" : "#fbbf24" }}>{data.score}/100</span>
                      </div>
                      {data.improvements?.map((imp, i) => <div key={i} style={{ fontSize: 12, color: "#a1a1aa" }}>� {imp}</div>)}
                    </div>
                  ))}
                  {eeatResult.topPriorities?.length > 0 && (
                    <div style={{ marginTop: 8 }}><div style={{ fontWeight: 600, marginBottom: 4 }}>Top priorities:</div>{eeatResult.topPriorities.map((p, i) => <div key={i} style={{ fontSize: 13 }}>� {p}</div>)}</div>
                  )}
                </div>
              )}
            </div>

            {/* Author Bio Optimizer */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Author Bio Optimizer</div>
              <div style={S.cardDesc}>Craft E-E-A-T-optimized author bios in short, medium, and long formats with credential highlights.</div>
              <input style={{ ...S.input, marginBottom: 6 }} placeholder="Author name..." value={authorBioName} onChange={e => setAuthorBioName(e.target.value)} />
              <input style={{ ...S.input, marginBottom: 6 }} placeholder="Niche (e.g. Digital Marketing, Nutrition)..." value={authorBioNiche} onChange={e => setAuthorBioNiche(e.target.value)} />
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Credentials (e.g. 10 years SEO, MBA, published in Forbes)..." value={authorBioCredentials} onChange={e => setAuthorBioCredentials(e.target.value)} />
              <button style={S.btn("primary")} onClick={runAuthorBio} disabled={authorBioLoading || !authorBioName.trim()}>
                {authorBioLoading ? <><span style={S.spinner} /> Writing bio�</> : "Optimize Author Bio"}
              </button>
              {authorBioResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  {Object.entries(authorBioResult.optimizedBio || {}).map(([len, text]) => (
                    <div key={len} style={{ marginBottom: 10 }}>
                      <div style={{ fontWeight: 600, textTransform: "capitalize", marginBottom: 4 }}>{len} bio:</div>
                      <div style={{ background: "#18181b", borderRadius: 6, padding: "8px 12px", fontSize: 13 }}>{text}</div>
                    </div>
                  ))}
                  {authorBioResult.eeatSignals?.length > 0 && (
                    <div><div style={{ fontWeight: 600, marginBottom: 4 }}>E-E-A-T signals to include:</div>{authorBioResult.eeatSignals.map((s, i) => <div key={i} style={{ fontSize: 12, color: "#4ade80" }}>? {s}</div>)}</div>
                  )}
                </div>
              )}
            </div>

            {/* Brand Signal Audit */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Brand Signal Audit</div>
              <div style={S.cardDesc}>Audit brand signals across social presence, branded search, unlinked mentions & knowledge panel eligibility.</div>
              <input style={{ ...S.input, marginBottom: 6 }} placeholder="Your domain (e.g. yourshop.com)..." value={brandSignalDomain} onChange={e => setBrandSignalDomain(e.target.value)} />
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Brand name (optional)..." value={brandSignalName} onChange={e => setBrandSignalName(e.target.value)} />
              <button style={S.btn("primary")} onClick={runBrandSignals} disabled={brandSignalLoading || !brandSignalDomain.trim()}>
                {brandSignalLoading ? <><span style={S.spinner} /> Auditing�</> : "Audit Brand Signals"}
              </button>
              {brandSignalResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
                    <span>Brand score: <b style={{ color: brandSignalResult.brandSignalScore >= 70 ? "#4ade80" : "#fbbf24" }}>{brandSignalResult.brandSignalScore}/100</b></span>
                  </div>
                  {Object.entries(brandSignalResult.signalCategories || {}).map(([cat, data]) => (
                    <div key={cat} style={{ padding: "5px 0", borderBottom: "1px solid #27272a" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{cat.replace(/([A-Z])/g, ' $1').trim()}</span>
                        {data.score != null && <span style={{ color: data.score >= 70 ? "#4ade80" : "#fbbf24" }}>{data.score}/100</span>}
                      </div>
                      {data.improvements?.map((imp, i) => <div key={i} style={{ fontSize: 12, color: "#a1a1aa" }}>� {imp}</div>)}
                    </div>
                  ))}
                  {brandSignalResult.topBrandActions?.length > 0 && (
                    <div style={{ marginTop: 8 }}><div style={{ fontWeight: 600, marginBottom: 4 }}>Top actions:</div>{brandSignalResult.topBrandActions.map((a, i) => <div key={i} style={{ fontSize: 13 }}>� {a}</div>)}</div>
                  )}
                </div>
              )}
            </div>

            {/* Expert Quote Finder */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Expert Quote Finder</div>
              <div style={S.cardDesc}>Find expert quote strategies and outreach sources � adding expert quotes is an Ahrefs top E-E-A-T tactic.</div>
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Topic / article subject..." value={expertQuoteTopic} onChange={e => setExpertQuoteTopic(e.target.value)} />
              <button style={S.btn("primary")} onClick={runExpertQuotes} disabled={expertQuoteLoading || !expertQuoteTopic.trim()}>
                {expertQuoteLoading ? <><span style={S.spinner} /> Researching�</> : "Find Expert Quotes"}
              </button>
              {expertQuoteResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  {expertQuoteResult.outreachSources?.length > 0 && (
                    <div style={{ marginBottom: 8 }}><div style={{ fontWeight: 600, marginBottom: 4 }}>Outreach sources:</div>{expertQuoteResult.outreachSources.map((s, i) => <div key={i} style={{ fontSize: 13, color: "#4ade80" }}>?? {s}</div>)}</div>
                  )}
                  {expertQuoteResult.quotePrompts?.length > 0 && (
                    <div style={{ marginBottom: 8 }}><div style={{ fontWeight: 600, marginBottom: 4 }}>Questions to ask experts:</div>{expertQuoteResult.quotePrompts.map((q, i) => <div key={i} style={{ fontSize: 12, color: "#a1a1aa" }}>� {q}</div>)}</div>
                  )}
                  {expertQuoteResult.sampleQuotes?.map((q, i) => <div key={i} style={{ background: "#18181b", borderRadius: 6, padding: "8px 12px", fontSize: 13, marginBottom: 6, fontStyle: "italic" }}>"{q}"</div>)}
                </div>
              )}
            </div>

            {/* Trust Builder */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Trust Builder Audit</div>
              <div style={S.cardDesc}>Audit trust and credibility signals � security, transparency, social proof, and content quality.</div>
              <button style={S.btn("primary")} onClick={runTrustBuilder} disabled={trustBuilderLoading || !url.trim()}>
                {trustBuilderLoading ? <><span style={S.spinner} /> Auditing trust�</> : "Audit Trust Signals"}
              </button>
              {trustBuilderResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>Trust score: <b style={{ color: trustBuilderResult.trustScore >= 70 ? "#4ade80" : trustBuilderResult.trustScore >= 50 ? "#fbbf24" : "#f87171" }}>{trustBuilderResult.trustScore}/100</b></span>
                  </div>
                  {Object.entries(trustBuilderResult.trustSignals || {}).map(([sig, data]) => (
                    <div key={sig} style={{ padding: "5px 0", borderBottom: "1px solid #27272a" }}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{sig.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span style={{ background: data.priority === "high" ? "#7f1d1d" : "#27272a", color: data.priority === "high" ? "#fca5a5" : "#d4d4d8", borderRadius: 4, padding: "1px 6px", fontSize: 11 }}>{data.priority}</span>
                      </div>
                      {data.missing?.map((m, i) => <div key={i} style={{ fontSize: 12, color: "#fbbf24" }}>?? {m}</div>)}
                    </div>
                  ))}
                  {trustBuilderResult.topTrustActions?.length > 0 && (
                    <div style={{ marginTop: 8 }}><div style={{ fontWeight: 600, marginBottom: 4 }}>Top actions:</div>{trustBuilderResult.topTrustActions.map((a, i) => <div key={i} style={{ fontSize: 13 }}>� {a}</div>)}</div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* ================================================================
            VOICE & AI SEARCH TAB (Batch 5)
            ================================================================ */}
        {tab === "Voice & AI Search" && (
          <>
            {/* Voice Search Optimizer */}
            <div style={S.card}>
              <div style={S.cardTitle}>??? Voice Search Optimizer</div>
              <div style={S.cardDesc}>Optimize for Google Assistant & smart speakers � 40.7% of voice results come from Featured Snippets (Backlinko study).</div>
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Target keyword..." value={voiceOptKeyword} onChange={e => setVoiceOptKeyword(e.target.value)} />
              <button style={S.btn("primary")} onClick={runVoiceOptimizer} disabled={voiceOptLoading || !voiceOptKeyword.trim()}>
                {voiceOptLoading ? <><span style={S.spinner} /> Optimizing�</> : "Optimize for Voice Search"}
              </button>
              {voiceOptResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>Voice score: <b style={{ color: voiceOptResult.voiceSearchScore >= 70 ? "#4ade80" : "#fbbf24" }}>{voiceOptResult.voiceSearchScore}/100</b></span>
                    <span>Snippet opportunity: <b>{voiceOptResult.featuredSnippetOpportunity?.snippetType}</b></span>
                  </div>
                  {voiceOptResult.idealAnswer?.text && (
                    <div style={{ background: "#18181b", borderRadius: 6, padding: "10px 14px", marginBottom: 8 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>??? Ideal 29-word voice answer:</div>
                      <div style={{ fontSize: 13 }}>{voiceOptResult.idealAnswer.text}</div>
                    </div>
                  )}
                  {voiceOptResult.longtailVariants?.map((v, i) => <div key={i} style={{ fontSize: 12, color: "#a1a1aa", padding: "2px 0" }}>??? {v}</div>)}
                  {voiceOptResult.contentStructureTips?.map((t, i) => <div key={i} style={{ fontSize: 13, padding: "2px 0" }}>� {t}</div>)}
                </div>
              )}
            </div>

            {/* FAQ Page Generator */}
            <div style={S.card}>
              <div style={S.cardTitle}>? FAQ Page Generator</div>
              <div style={S.cardDesc}>Generate FAQ pages optimized for voice search and Google AI Overviews � 2.68% of voice results come from FAQ pages.</div>
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Topic (e.g. Shopify email marketing)..." value={faqGenTopic} onChange={e => setFaqGenTopic(e.target.value)} />
              <button style={S.btn("primary")} onClick={runFaqGenerator} disabled={faqGenLoading || !faqGenTopic.trim()}>
                {faqGenLoading ? <><span style={S.spinner} /> Generating FAQs�</> : "Generate FAQ Page"}
              </button>
              {faqGenResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>?? {faqGenResult.pageTitle}</div>
                  <div style={{ color: "#a1a1aa", fontSize: 12, marginBottom: 8 }}>{faqGenResult.metaDescription}</div>
                  {faqGenResult.faqs?.slice(0, 10).map((faq, i) => (
                    <div key={i} style={{ padding: "7px 0", borderBottom: "1px solid #27272a" }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>Q: {faq.question}</div>
                      <div style={{ color: "#d4d4d8", fontSize: 12, marginTop: 2 }}>A: {faq.answer}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        <span style={{ background: "#3f3f46", borderRadius: 4, padding: "1px 6px", fontSize: 11 }}>{faq.answerType}</span>
                        {faq.voiceLength && <span style={{ color: "#4ade80", fontSize: 11 }}>? voice-ready</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Overview Optimizer */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? AI Overview Optimizer</div>
              <div style={S.cardDesc}>Optimize content to appear in Google AI Overviews (SGE), ChatGPT, Perplexity, and other LLM search engines.</div>
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Target keyword..." value={aiOverviewKeyword} onChange={e => setAiOverviewKeyword(e.target.value)} />
              <button style={S.btn("primary")} onClick={runAiOverviewOptimizer} disabled={aiOverviewLoading || !aiOverviewKeyword.trim()}>
                {aiOverviewLoading ? <><span style={S.spinner} /> Optimizing�</> : "Optimize for AI Overviews"}
              </button>
              {aiOverviewResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                    <span>AI readiness: <b style={{ color: aiOverviewResult.aiOverviewScore >= 70 ? "#4ade80" : "#fbbf24" }}>{aiOverviewResult.aiOverviewScore}/100</b></span>
                    <span style={{ color: aiOverviewResult.aiReadinessLabel === "optimized" ? "#4ade80" : "#fbbf24" }}>{aiOverviewResult.aiReadinessLabel}</span>
                    <span>Citation worthiness: <b>{aiOverviewResult.citationWorthiness?.score}/100</b></span>
                  </div>
                  {aiOverviewResult.optimizedAnswer && (
                    <div style={{ background: "#18181b", borderRadius: 6, padding: "10px 14px", marginBottom: 8, fontSize: 13 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>?? AI-optimized answer:</div>
                      {aiOverviewResult.optimizedAnswer}
                    </div>
                  )}
                  {aiOverviewResult.contentStructureTips?.map((t, i) => <div key={i} style={{ fontSize: 13, padding: "2px 0" }}>� {t}</div>)}
                  {aiOverviewResult.llmOptimizationTips?.map((t, i) => <div key={i} style={{ fontSize: 12, color: "#818cf8", padding: "2px 0" }}>?? {t}</div>)}
                </div>
              )}
            </div>

            {/* Conversational Keywords */}
            <div style={S.card}>
              <div style={S.cardTitle}>?? Conversational Keyword Generator</div>
              <div style={S.cardDesc}>Generate natural language, full-sentence voice and AI search queries across Who/What/Where/When/Why/How.</div>
              <input style={{ ...S.input, marginBottom: 8 }} placeholder="Topic (e.g. Shopify abandoned cart)..." value={convKwTopic} onChange={e => setConvKwTopic(e.target.value)} />
              <button style={S.btn("primary")} onClick={runConvKeywords} disabled={convKwLoading || !convKwTopic.trim()}>
                {convKwLoading ? <><span style={S.spinner} /> Generating�</> : "Generate Conversational Keywords"}
              </button>
              {convKwResult && (
                <div style={{ ...S.result, marginTop: 10 }}>
                  {convKwResult.conversationalKeywords?.length > 0 && (
                    <div style={{ marginBottom: 8 }}><div style={{ fontWeight: 600, marginBottom: 4 }}>Natural language queries:</div>{convKwResult.conversationalKeywords.map((kw, i) => <div key={i} style={{ fontSize: 13, padding: "2px 0", color: "#d4d4d8" }}>??? {kw}</div>)}</div>
                  )}
                  {Object.entries(convKwResult.questionKeywords || {}).map(([qtype, qs]) => (
                    <div key={qtype} style={{ marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, textTransform: "capitalize", color: "#818cf8" }}>{qtype}:</span>
                      <span style={{ color: "#a1a1aa", fontSize: 12, marginLeft: 8 }}>{qs?.join(" � ")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ================================================================
            CONTENT BRIEF TAB
            ================================================================ */}
        {tab === "Content Brief" && (
          <>
            <div style={{ ...S.card, marginTop: 16 }}>
              <div style={S.cardTitle}>?? AI Content Brief Generator</div>
              <div style={{ ...S.row, marginBottom: 10 }}>
                <input style={S.input} placeholder="Blog topic or title" value={briefTopic} onChange={e => setBriefTopic(e.target.value)} onKeyDown={e => e.key === "Enter" && !briefLoading && runBrief()} />
              </div>
              <div style={{ ...S.row, marginBottom: 10 }}>
                <input style={{ ...S.input, maxWidth: 280 }} placeholder="Primary keyword" value={briefPrimary} onChange={e => setBriefPrimary(e.target.value)} />
                <input style={{ ...S.input, maxWidth: 280 }} placeholder="Secondary keywords (comma-separated)" value={briefSecondary} onChange={e => setBriefSecondary(e.target.value)} />
                <button style={S.btn("primary")} onClick={runBrief} disabled={briefLoading || (!briefTopic.trim() && !briefPrimary.trim())}>
                  {briefLoading ? <><span style={S.spinner} /> Generating�</> : "Generate Brief (2 credits)"}
                </button>
              </div>
            </div>

            {briefErr && <div style={S.err}>{briefErr}</div>}

            {briefLoading && <div style={S.empty}><span style={S.spinner} /><div style={{ marginTop: 12 }}>Generating content brief�</div></div>}

            {briefResult && !briefLoading && (
              <>
                {/* Brief overview */}
                <div style={S.card}>
                  <div style={S.cardTitle}>?? Brief: {briefResult.title || briefTopic}</div>
                  <div style={S.metaRow}>
                    <MetaBlock label="Meta Title" value={briefResult.metaTitle || "�"} max={60} />
                    <MetaBlock label="H1" value={briefResult.h1 || "�"} />
                  </div>
                  <div style={S.metaRow}>
                    <MetaBlock label="Meta Description" value={briefResult.metaDescription || "�"} max={160} />
                  </div>
                  <div style={S.metaRow}>
                    <MetaBlock label="Target Word Count" value={briefResult.targetWordCount || "�"} />
                    <MetaBlock label="Search Intent" value={briefResult.searchIntent || "�"} />
                    <MetaBlock label="Estimated Rank" value={briefResult.estimatedRank || "�"} />
                  </div>
                </div>

                {/* Outline */}
                {briefResult.outline?.length > 0 && (
                  <div style={S.card}>
                    <div style={S.cardTitle}>?? Content Outline</div>
                    {briefResult.outline.map((section, i) => (
                      <div key={i} style={{ ...S.issueRow, flexDirection: "column", alignItems: "flex-start" }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#fafafa" }}>{i + 1}. {section.heading}</div>
                        {section.subheadings?.length > 0 && section.subheadings.map((sh, j) => (
                          <div key={j} style={{ fontSize: 13, color: "#a1a1aa", paddingLeft: 20, marginTop: 2 }}>? {sh}</div>
                        ))}
                        <div style={{ fontSize: 11, color: "#71717a", marginTop: 4 }}>{section.wordCount ? `~${section.wordCount} words` : ""} {section.notes ? `� ${section.notes}` : ""}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Keyword strategy */}
                {briefResult.keywordStrategy && (
                  <div style={S.card}>
                    <div style={S.cardTitle}>?? Keyword Strategy</div>
                    <div style={S.metaRow}>
                      <MetaBlock label="Primary" value={briefResult.keywordStrategy.primary || "�"} />
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
                      <div style={S.section}><div style={S.heading}>??? Competitor Gaps</div>{briefResult.competitorGaps.map((g, i) => <div key={i} style={{ fontSize: 13, color: "#fbbf24", marginBottom: 4 }}>� {g}</div>)}</div>
                    )}
                    {briefResult.uniqueAngles?.length > 0 && (
                      <div style={S.section}><div style={S.heading}>?? Unique Angles</div>{briefResult.uniqueAngles.map((a, i) => <div key={i} style={{ fontSize: 13, color: "#86efac", marginBottom: 4 }}>� {a}</div>)}</div>
                    )}
                    {briefResult.cta && <div style={S.section}><div style={S.heading}>?? Call to Action</div><div style={{ fontSize: 13, color: "#d4d4d8" }}>{briefResult.cta}</div></div>}
                  </div>
                )}
              </>
            )}

            {!briefResult && !briefLoading && !briefErr && (
              <div style={S.empty}>
                <div style={{ fontSize: 42, marginBottom: 12 }}>??</div>
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
              <div style={S.cardTitle}>?? Bulk Blog Scanner</div>
              <textarea style={S.textarea} placeholder={"Enter blog URLs (one per line, max 10)\nhttps://yourstore.com/blogs/news/post-1\nhttps://yourstore.com/blogs/news/post-2"} value={bulkUrls} onChange={e => setBulkUrls(e.target.value)} rows={6} />
              <div style={{ ...S.row, marginTop: 10 }}>
                <input style={{ ...S.input, maxWidth: 300 }} placeholder="Target keywords (optional)" value={bulkKw} onChange={e => setBulkKw(e.target.value)} />
                <button style={S.btn("primary")} onClick={runBulk} disabled={bulkLoading || !bulkUrls.trim()}>
                  {bulkLoading ? <><span style={S.spinner} /> Scanning�</> : "Scan All"}
                </button>
              </div>
            </div>

            {bulkErr && <div style={S.err}>{bulkErr}</div>}

            {bulkLoading && <div style={S.empty}><span style={S.spinner} /><div style={{ marginTop: 12 }}>Scanning blog posts�</div></div>}

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
                          <td style={{ ...S.td, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title || r.error || "�"}</td>
                          <td style={S.td}>{r.status === "ok" ? <span style={{ color: r.score >= 75 ? "#22c55e" : r.score >= 50 ? "#eab308" : "#ef4444", fontWeight: 700 }}>{r.score}</span> : "�"}</td>
                          <td style={S.td}>{r.grade || "�"}</td>
                          <td style={S.td}>{r.wordCount || "�"}</td>
                          <td style={S.td}>{r.status === "ok" ? <span style={{ color: r.highIssues > 0 ? "#ef4444" : "#71717a" }}>{r.issueCount} ({r.highIssues} high)</span> : "�"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {!bulkResult && !bulkLoading && !bulkErr && (
              <div style={S.empty}>
                <div style={{ fontSize: 42, marginBottom: 12 }}>??</div>
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
              <div style={S.cardTitle}>?? Blog SEO Assistant</div>
              <div ref={chatRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4, padding: "8px 0", minHeight: 280, maxHeight: 480 }}>
                {chatMessages.length === 0 && (
                  <div style={S.empty}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>??</div>
                    <div style={{ fontSize: 13 }}>Ask anything about blog SEO � keyword strategy, content optimization, technical SEO, etc.</div>
                  </div>
                )}
                {chatMessages.map((m, i) => <div key={i} style={S.chatBubble(m.role === "user")}>{m.content}</div>)}
                {chatLoading && <div style={S.chatBubble(false)}><span style={S.spinner} /> Thinking�</div>}
              </div>
              <div style={{ ...S.row, marginTop: 10 }}>
                <input style={S.input} placeholder="Ask about blog SEO�" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !chatLoading && sendChat()} />
                <button style={S.btn("primary")} onClick={sendChat} disabled={chatLoading || !chatInput.trim()}>Send</button>
              </div>
            </div>
          </>
        )}

        {/* ================================================================
            SHOPIFY SEO TAB
            ================================================================ */}
        {tab === "Shopify SEO" && (
          <>
            <div style={{ fontSize: 13, color: "#71717a", marginTop: 16, marginBottom: 4 }}>
              Shopify-specific SEO tools � optimise your blog posts, collection pages, product?blog cross-links, and metafields directly inside the Shopify ecosystem.
            </div>

            {/* 1. Shopify Blog Template Audit */}
            <div style={{ ...S.card, marginTop: 16 }}>
              <div style={S.cardTitle}>??? Shopify Blog Post Audit</div>
              <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 10 }}>
                Detects Shopify-specific SEO issues: canonical conflicts with <code>.myshopify.com</code>, missing blog JSON-LD, duplicate URL variants, and theme-level meta gaps.
              </div>
              <div style={S.row}>
                <input style={S.input} placeholder="https://yourstore.com/blogs/news/post-title" value={shopifyBlogUrl} onChange={e => setShopifyBlogUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && !shopifyBlogAuditLoading && runShopifyBlogAudit()} />
                <button style={S.btn("primary")} onClick={runShopifyBlogAudit} disabled={shopifyBlogAuditLoading || !shopifyBlogUrl.trim()}>
                  {shopifyBlogAuditLoading ? <><span style={S.spinner} /> Auditing�</> : "Audit"}
                </button>
              </div>
              {shopifyBlogAuditErr && <div style={S.err}>{shopifyBlogAuditErr}</div>}
              {shopifyBlogAudit && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 14 }}>
                    <MetaChip label="Score" value={shopifyBlogAudit.score} color={shopifyBlogAudit.score >= 75 ? "#22c55e" : shopifyBlogAudit.score >= 50 ? "#eab308" : "#ef4444"} />
                    <MetaChip label="Issues" value={shopifyBlogAudit.issueCount} color={shopifyBlogAudit.issueCount > 0 ? "#ef4444" : "#22c55e"} />
                    <MetaChip label="Shopify Checks" value={shopifyBlogAudit.checks?.length ?? 0} />
                  </div>
                  {shopifyBlogAudit.checks?.map((c, i) => (
                    <div key={i} style={{ background: c.pass ? "#14532d22" : "#450a0a22", border: `1px solid ${c.pass ? "#166534" : "#7f1d1d"}`, borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: c.pass ? "#86efac" : "#fca5a5" }}>{c.pass ? "?" : "?"} {c.name}</div>
                      {c.value && <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 3 }}>{c.value}</div>}
                      {!c.pass && c.tip && <div style={{ fontSize: 12, color: "#71717a", marginTop: 4 }}>?? {c.tip}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Collection Page SEO */}
            <div style={{ ...S.card, marginTop: 16 }}>
              <div style={S.cardTitle}>??? Collection Page SEO Audit</div>
              <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 10 }}>
                Audits a Shopify collection page for missing pagination canonicals, thin content, duplicate <code>?sort_by</code> parameters, and collection-level structured data.
              </div>
              <div style={S.row}>
                <input style={S.input} placeholder="https://yourstore.com/collections/shirts" value={shopifyCollUrl} onChange={e => setShopifyCollUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && !shopifyCollLoading && runShopifyCollSeo()} />
                <button style={S.btn("primary")} onClick={runShopifyCollSeo} disabled={shopifyCollLoading || !shopifyCollUrl.trim()}>
                  {shopifyCollLoading ? <><span style={S.spinner} /> Auditing�</> : "Audit"}
                </button>
              </div>
              {shopifyCollErr && <div style={S.err}>{shopifyCollErr}</div>}
              {shopifyCollResult && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 14 }}>
                    <MetaChip label="Score" value={shopifyCollResult.score} color={shopifyCollResult.score >= 75 ? "#22c55e" : shopifyCollResult.score >= 50 ? "#eab308" : "#ef4444"} />
                    <MetaChip label="Issues" value={shopifyCollResult.issueCount} color={shopifyCollResult.issueCount > 0 ? "#ef4444" : "#22c55e"} />
                    {shopifyCollResult.productCount != null && <MetaChip label="Products" value={shopifyCollResult.productCount} />}
                  </div>
                  {shopifyCollResult.checks?.map((c, i) => (
                    <div key={i} style={{ background: c.pass ? "#14532d22" : "#450a0a22", border: `1px solid ${c.pass ? "#166534" : "#7f1d1d"}`, borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: c.pass ? "#86efac" : "#fca5a5" }}>{c.pass ? "?" : "?"} {c.name}</div>
                      {c.value && <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 3 }}>{c.value}</div>}
                      {!c.pass && c.tip && <div style={{ fontSize: 12, color: "#71717a", marginTop: 4 }}>?? {c.tip}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Product ? Blog Cross-Link Suggestions */}
            <div style={{ ...S.card, marginTop: 16 }}>
              <div style={S.cardTitle}>?? Product ? Blog Cross-Link Optimizer <span style={{ fontSize: 11, color: "#818cf8", marginLeft: 6 }}>AI � 2 credits</span></div>
              <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 10 }}>
                Paste a product URL and a blog post URL � AI identifies the best natural cross-linking opportunities between them to build topical authority and drive product discovery.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input style={S.input} placeholder="Product URL (e.g. https://yourstore.com/products/blue-shirt)" value={shopifyProductUrl} onChange={e => setShopifyProductUrl(e.target.value)} />
                <input style={S.input} placeholder="Blog post URL (e.g. https://yourstore.com/blogs/news/how-to-style-shirts)" value={shopifyBlogLinkUrl} onChange={e => setShopifyBlogLinkUrl(e.target.value)} />
              </div>
              <div style={{ ...S.row, marginTop: 10 }}>
                <button style={S.btn("primary")} onClick={runShopifyProductBlogLinks} disabled={shopifyLinkLoading || (!shopifyProductUrl.trim() && !shopifyBlogLinkUrl.trim())}>
                  {shopifyLinkLoading ? <><span style={S.spinner} /> Analysing�</> : "?? Suggest Cross-Links (2 credits)"}
                </button>
              </div>
              {shopifyLinkErr && <div style={S.err}>{shopifyLinkErr}</div>}
              {shopifyLinkResult && (
                <div style={{ marginTop: 14 }}>
                  {shopifyLinkResult.productToBlog && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#c4b5fd", marginBottom: 8 }}>Product ? Blog (add to product description)</div>
                      {shopifyLinkResult.productToBlog.map((s, i) => (
                        <div key={i} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 14px", marginBottom: 8 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>Anchor: <code style={{ color: "#93c5fd" }}>{s.anchorText}</code></div>
                          <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 4 }}>Context: {s.contextSentence}</div>
                          <div style={{ fontSize: 11, color: "#71717a", marginTop: 4 }}>Why: {s.rationale}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {shopifyLinkResult.blogToProduct && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#86efac", marginBottom: 8 }}>Blog ? Product (add to blog body)</div>
                      {shopifyLinkResult.blogToProduct.map((s, i) => (
                        <div key={i} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 14px", marginBottom: 8 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>Anchor: <code style={{ color: "#93c5fd" }}>{s.anchorText}</code></div>
                          <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 4 }}>Context: {s.contextSentence}</div>
                          <div style={{ fontSize: 11, color: "#71717a", marginTop: 4 }}>Why: {s.rationale}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {shopifyLinkResult.tip && (
                    <div style={{ background: "#1e1b40", border: "1px solid #4f46e5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#c4b5fd" }}>
                      ?? {shopifyLinkResult.tip}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 4. Metafield SEO Generator */}
            <div style={{ ...S.card, marginTop: 16 }}>
              <div style={S.cardTitle}>?? Shopify Metafield SEO Generator <span style={{ fontSize: 11, color: "#818cf8", marginLeft: 6 }}>AI � 2 credits</span></div>
              <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 10 }}>
                Generate SEO-optimised values for Shopify metafields � custom meta titles, descriptions, OG fields, and SEO-focused product/collection summaries ready to paste into your theme editor.
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                <select style={{ ...S.input, maxWidth: 200 }} value={shopifyMetafieldType} onChange={e => setShopifyMetafieldType(e.target.value)}>
                  <option value="product">Product page</option>
                  <option value="collection">Collection page</option>
                  <option value="blog_post">Blog post</option>
                  <option value="homepage">Homepage</option>
                </select>
              </div>
              <textarea
                style={{ ...S.textarea, minHeight: 90 }}
                placeholder={`Describe the ${shopifyMetafieldType} � include key details like product name, main feature, target audience, and primary keyword...`}
                value={shopifyMetafieldContext}
                onChange={e => setShopifyMetafieldContext(e.target.value)}
              />
              <div style={{ ...S.row, marginTop: 10 }}>
                <button style={S.btn("primary")} onClick={runShopifyMetafield} disabled={shopifyMetafieldLoading || !shopifyMetafieldContext.trim()}>
                  {shopifyMetafieldLoading ? <><span style={S.spinner} /> Generating�</> : "?? Generate Metafield SEO (2 credits)"}
                </button>
              </div>
              {shopifyMetafieldErr && <div style={S.err}>{shopifyMetafieldErr}</div>}
              {shopifyMetafieldResult && (
                <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  {shopifyMetafieldResult.fields?.map((f, i) => (
                    <div key={i} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "12px 14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{f.namespace}.{f.key}</div>
                        <button style={{ ...S.btn("ghost"), fontSize: 11, padding: "2px 8px" }} onClick={() => navigator.clipboard.writeText(f.value)}>?? Copy</button>
                      </div>
                      <div style={{ fontSize: 13, color: "#e4e4e7", lineHeight: 1.6, wordBreak: "break-word" }}>{f.value}</div>
                      {f.tip && <div style={{ fontSize: 11, color: "#71717a", marginTop: 6 }}>{f.tip}</div>}
                    </div>
                  ))}
                  {shopifyMetafieldResult.note && (
                    <div style={{ background: "#1e1b40", border: "1px solid #4f46e5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#c4b5fd" }}>
                      ?? {shopifyMetafieldResult.note}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}


        {/* ================================================================
            AI GROWTH TAB
            ================================================================ */}
        {tab === "AI Growth" && (
          <>
            <div style={{ fontSize: 13, color: "#71717a", marginTop: 16, marginBottom: 16 }}>
              Next-generation AI growth tools � content calendars, pillar pages, programmatic SEO, ROI estimation, competitor audits, AI Overview optimisation, semantic cluster mapping, and more.
            </div>

            {/* Sub-tab nav */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
              {[
                { id: "calendar", label: "?? Content Calendar" },
                { id: "pillar", label: "??? Pillar Page" },
                { id: "programmatic", label: "? Programmatic SEO" },
                { id: "roi", label: "?? Content ROI" },
                { id: "sge", label: "?? SGE / AI Overview" },
                { id: "miner", label: "?? Topic Miner" },
                { id: "social", label: "?? Social SEO Score" },
                { id: "competitor", label: "??? Competitor Audit" },
                { id: "reclaim", label: "?? Link Reclamation" },
                { id: "gnews", label: "?? Google News" },
                { id: "predictor", label: "?? Performance Predictor" },
                { id: "semantic", label: "?? Semantic Clusters" },
              ].map(s => (
                <button key={s.id} style={{ ...S.btn(growthSub === s.id ? "primary" : undefined), fontSize: 12, padding: "6px 14px" }} onClick={() => setGrowthSub(s.id)}>{s.label}</button>
              ))}
            </div>

            {/* 1. Content Calendar */}
            {growthSub === "calendar" && (
              <div style={S.card}>
                <div style={S.cardTitle}>?? Content Calendar Generator <span style={{ fontSize: 11, color: "#818cf8", marginLeft: 6 }}>AI � 3 credits</span></div>
                <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 12 }}>Build a 30/90-day editorial calendar with themes, post types and strategic priorities for your niche.</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                  <input style={{ ...S.input, flex: "2 1 220px" }} placeholder="Niche (e.g. sustainable homewares) *" value={calNiche} onChange={e => setCalNiche(e.target.value)} />
                  <input style={{ ...S.input, flex: "2 1 200px" }} placeholder="Target audience" value={calAudience} onChange={e => setCalAudience(e.target.value)} />
                  <select style={{ ...S.input, flex: "1 1 120px" }} value={calWeeks} onChange={e => setCalWeeks(parseInt(e.target.value))}>
                    <option value={4}>4 weeks</option><option value={8}>8 weeks</option><option value={12}>12 weeks</option><option value={13}>13 weeks (90 days)</option>
                  </select>
                  <select style={{ ...S.input, flex: "1 1 120px" }} value={calPpw} onChange={e => setCalPpw(parseInt(e.target.value))}>
                    <option value={2}>2 posts/week</option><option value={3}>3 posts/week</option><option value={4}>4 posts/week</option><option value={5}>5 posts/week</option>
                  </select>
                </div>
                <button style={S.btn("primary")} disabled={calLoading || !calNiche.trim()} onClick={async () => {
                  setCalLoading(true); setCalErr(""); setCalResult(null);
                  try {
                    const r = await apiFetch(`${API}/ai/content-calendar`, { method: "POST", body: JSON.stringify({ niche: calNiche, audience: calAudience, duration: calWeeks * 7, postsPerWeek: calPpw }) });
                    if (!r.ok) throw new Error(r.error || "Failed"); setCalResult(r);
                  } catch (e) { setCalErr(e.message); } finally { setCalLoading(false); }
                }}>
                  {calLoading ? <><span style={S.spinner} /> Generating�</> : "?? Build Calendar (3 credits)"}
                </button>
                {calErr && <div style={S.err}>{calErr}</div>}
                {calResult && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ background: "#0f2027", border: "1px solid #0e7490", borderRadius: 8, padding: "10px 16px", marginBottom: 14, color: "#67e8f9", fontSize: 13 }}>{calResult.summary}</div>
                    {calResult.weeks?.map((w, wi) => (
                      <div key={wi} style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#a1a1aa", marginBottom: 6 }}>Week {w.week} � <span style={{ color: "#e4e4e7" }}>{w.theme}</span></div>
                        {w.posts?.map((p, pi) => (
                          <div key={pi} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 14px", marginBottom: 6, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
                            <div style={{ flex: 1, minWidth: 200 }}>
                              <div style={{ fontWeight: 600, color: "#fafafa", fontSize: 13 }}>{p.title}</div>
                              <div style={{ fontSize: 11, color: "#71717a", marginTop: 3 }}>{p.day} � {p.targetKeyword} � ~{p.estimatedWordCount} words</div>
                            </div>
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                              <span style={{ ...S.pill(p.priority === "high" ? "high" : p.priority === "medium" ? "medium" : "low"), fontSize: 10 }}>{p.type}</span>
                              <span style={{ ...S.pill(p.priority === "high" ? "high" : p.priority === "medium" ? "medium" : "low"), fontSize: 10 }}>{p.priority}</span>
                              <span style={{ ...S.pill("low"), fontSize: 10 }}>{p.searchIntent}</span>
                            </div>
                            {p.notes && <div style={{ width: "100%", fontSize: 11, color: "#71717a" }}>{p.notes}</div>}
                          </div>
                        ))}
                      </div>
                    ))}
                    {calResult.quickWins && <><div style={{ fontSize: 12, fontWeight: 700, color: "#22c55e", textTransform: "uppercase", marginBottom: 6 }}>? Quick Wins</div>{calResult.quickWins.map((q, i) => <div key={i} style={{ color: "#d4d4d8", fontSize: 13, padding: "4px 0" }}>� {q}</div>)}</>}
                  </div>
                )}
              </div>
            )}

            {/* 2. Pillar Page Builder */}
            {growthSub === "pillar" && (
              <div style={S.card}>
                <div style={S.cardTitle}>??? Pillar Page & Cluster Builder <span style={{ fontSize: 11, color: "#818cf8", marginLeft: 6 }}>AI � 3 credits</span></div>
                <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 12 }}>Design a complete content hub � pillar page structure plus all supporting cluster articles to dominate topical authority.</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                  <input style={{ ...S.input, flex: "2 1 240px" }} placeholder="Main topic (e.g. coffee brewing methods) *" value={pillarTopic} onChange={e => setPillarTopic(e.target.value)} />
                  <input style={{ ...S.input, flex: "1 1 180px" }} placeholder="Target audience" value={pillarAudience} onChange={e => setPillarAudience(e.target.value)} />
                </div>
                <button style={S.btn("primary")} disabled={pillarLoading || !pillarTopic.trim()} onClick={async () => {
                  setPillarLoading(true); setPillarErr(""); setPillarResult(null);
                  try {
                    const r = await apiFetch(`${API}/ai/pillar-page`, { method: "POST", body: JSON.stringify({ topic: pillarTopic, audience: pillarAudience }) });
                    if (!r.ok) throw new Error(r.error || "Failed"); setPillarResult(r);
                  } catch (e) { setPillarErr(e.message); } finally { setPillarLoading(false); }
                }}>
                  {pillarLoading ? <><span style={S.spinner} /> Building�</> : "?? Build Pillar Hub (3 credits)"}
                </button>
                {pillarErr && <div style={S.err}>{pillarErr}</div>}
                {pillarResult && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ background: "#1c1917", border: "1px solid #a16207", borderRadius: 10, padding: 16, marginBottom: 14 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#fbbf24" }}>{pillarResult.pillarTitle}</div>
                      <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 4 }}>/{pillarResult.pillarSlug} � ~{pillarResult.pillarWordCount} words � Coverage score: <span style={{ color: "#22c55e" }}>{pillarResult.topicalCoverageScore}%</span></div>
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#71717a", textTransform: "uppercase", marginBottom: 4 }}>Outline</div>
                        {pillarResult.pillarOutline?.map((h, i) => <div key={i} style={{ color: "#d4d4d8", fontSize: 13, padding: "2px 0" }}>+ {h}</div>)}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#a1a1aa", marginBottom: 8 }}>Cluster Articles ({pillarResult.clusterTopics?.length})</div>
                    {pillarResult.clusterTopics?.map((c, i) => (
                      <div key={i} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 14px", marginBottom: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                          <div style={{ fontWeight: 600, color: "#fafafa", fontSize: 13 }}>{c.title}</div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <span style={S.pill(c.difficulty === "hard" ? "high" : c.difficulty === "medium" ? "medium" : "low")}>{c.difficulty}</span>
                            <span style={S.pill("low")}>{c.searchVolume} vol</span>
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: "#71717a", marginTop: 3 }}>{c.targetKeyword} � /{c.slug} � ~{c.wordCount} words</div>
                        <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 4 }}>{c.angle}</div>
                        <div style={{ fontSize: 11, color: "#818cf8", marginTop: 3 }}>Link anchor: "{c.linkAnchor}"</div>
                      </div>
                    ))}
                    {pillarResult.gaps?.length > 0 && <><div style={{ fontSize: 12, fontWeight: 700, color: "#f87171", textTransform: "uppercase", marginTop: 12, marginBottom: 6 }}>Coverage Gaps</div>{pillarResult.gaps.map((g, i) => <div key={i} style={{ color: "#d4d4d8", fontSize: 13, padding: "3px 0" }}>� {g}</div>)}</>}
                  </div>
                )}
              </div>
            )}

            {/* 3. Programmatic SEO */}
            {growthSub === "programmatic" && (
              <div style={S.card}>
                <div style={S.cardTitle}>? Programmatic SEO Templates <span style={{ fontSize: 11, color: "#818cf8", marginLeft: 6 }}>AI � 3 credits</span></div>
                <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 12 }}>Create scalable content templates for data-driven pages � city+product combinations, comparison pages, directory listings and more.</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                  <input style={{ ...S.input, flex: "2 1 240px" }} placeholder="Category (e.g. best restaurants in {city}) *" value={progCategory} onChange={e => setProgCategory(e.target.value)} />
                  <input style={{ ...S.input, flex: "1 1 200px" }} placeholder="Data variables (e.g. city, product, year)" value={progVars} onChange={e => setProgVars(e.target.value)} />
                </div>
                <button style={S.btn("primary")} disabled={progLoading || !progCategory.trim()} onClick={async () => {
                  setProgLoading(true); setProgErr(""); setProgResult(null);
                  try {
                    const r = await apiFetch(`${API}/ai/programmatic-seo`, { method: "POST", body: JSON.stringify({ category: progCategory, dataVariables: progVars.split(",").map(v => v.trim()).filter(Boolean) }) });
                    if (!r.ok) throw new Error(r.error || "Failed"); setProgResult(r);
                  } catch (e) { setProgErr(e.message); } finally { setProgLoading(false); }
                }}>
                  {progLoading ? <><span style={S.spinner} /> Building�</> : "?? Generate Templates (3 credits)"}
                </button>
                {progErr && <div style={S.err}>{progErr}</div>}
                {progResult && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: 14, marginBottom: 12 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24", marginBottom: 6 }}>Title Formula</div>
                      <code style={{ color: "#86efac", fontFamily: "'Fira Code',monospace", fontSize: 13 }}>{progResult.titleFormula}</code>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24", marginTop: 10, marginBottom: 4 }}>Meta Description Formula</div>
                      <code style={{ color: "#86efac", fontFamily: "'Fira Code',monospace", fontSize: 12 }}>{progResult.metaDescFormula}</code>
                    </div>
                    {progResult.sections?.map((s, i) => (
                      <div key={i} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: 12, marginBottom: 8 }}>
                        <div style={{ fontWeight: 600, color: "#e4e4e7", fontSize: 13, marginBottom: 4 }}>{s.heading}</div>
                        <div style={{ color: "#a1a1aa", fontSize: 12, marginBottom: 4 }}>{s.contentTemplate}</div>
                        <div style={{ display: "flex", gap: 10 }}>
                          <span style={S.pill("low")}>{s.wordCount} words</span>
                          <span style={{ fontSize: 11, color: "#71717a" }}>{s.purpose}</span>
                        </div>
                      </div>
                    ))}
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10 }}>
                      <div style={{ background: "#14532d22", border: "1px solid #166534", borderRadius: 8, padding: "10px 14px", flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#86efac", marginBottom: 4 }}>Est. Pages</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "#22c55e" }}>{progResult.estimatedPages?.toLocaleString()}</div>
                      </div>
                      <div style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 14px", flex: 3 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", marginBottom: 4 }}>Traffic Potential</div>
                        <div style={{ fontSize: 13, color: "#d4d4d8" }}>{progResult.trafficPotential}</div>
                      </div>
                    </div>
                    {progResult.warnings?.length > 0 && <><div style={{ fontSize: 12, fontWeight: 700, color: "#f87171", textTransform: "uppercase", marginTop: 12, marginBottom: 4 }}>?? Risks</div>{progResult.warnings.map((w, i) => <div key={i} style={{ color: "#fca5a5", fontSize: 12, padding: "2px 0" }}>� {w}</div>)}</>}
                  </div>
                )}
              </div>
            )}

            {/* 4. Content ROI Estimator */}
            {growthSub === "roi" && (
              <div style={S.card}>
                <div style={S.cardTitle}>?? Content ROI Estimator <span style={{ fontSize: 11, color: "#818cf8", marginLeft: 6 }}>AI � 2 credits</span></div>
                <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 12 }}>Predict the traffic, leads and revenue value of planned content before you write a single word.</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                  <input style={{ ...S.input, flex: "2 1 220px" }} placeholder="Target keyword *" value={roiKw} onChange={e => setRoiKw(e.target.value)} />
                  <input style={{ ...S.input, flex: "1 1 140px" }} placeholder="Monthly search volume" type="number" value={roiVol} onChange={e => setRoiVol(e.target.value)} />
                  <select style={{ ...S.input, flex: "1 1 130px" }} value={roiPos} onChange={e => setRoiPos(parseInt(e.target.value))}>
                    {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>Target pos #{n}</option>)}
                  </select>
                  <input style={{ ...S.input, flex: "1 1 120px" }} placeholder="CVR %" type="number" value={roiCvr} onChange={e => setRoiCvr(parseFloat(e.target.value))} />
                  <input style={{ ...S.input, flex: "1 1 120px" }} placeholder="Avg order $" type="number" value={roiAov} onChange={e => setRoiAov(parseFloat(e.target.value))} />
                </div>
                <button style={S.btn("primary")} disabled={roiLoading || !roiKw.trim()} onClick={async () => {
                  setRoiLoading(true); setRoiErr(""); setRoiResult(null);
                  try {
                    const r = await apiFetch(`${API}/ai/content-roi`, { method: "POST", body: JSON.stringify({ keyword: roiKw, monthlySearchVolume: parseInt(roiVol) || undefined, targetPosition: roiPos, conversionRate: roiCvr, avgOrderValue: roiAov }) });
                    if (!r.ok) throw new Error(r.error || "Failed"); setRoiResult(r);
                  } catch (e) { setRoiErr(e.message); } finally { setRoiLoading(false); }
                }}>
                  {roiLoading ? <><span style={S.spinner} /> Calculating�</> : "?? Estimate ROI (2 credits)"}
                </button>
                {roiErr && <div style={S.err}>{roiErr}</div>}
                {roiResult && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                      {[
                        { label: "Monthly Clicks", val: roiResult.estMonthlyClicks?.toLocaleString(), color: "#818cf8" },
                        { label: "Monthly Leads", val: roiResult.estLeads?.toLocaleString(), color: "#6ee7b7" },
                        { label: "Monthly Revenue", val: roiResult.estMonthlyRevenue ? `$${roiResult.estMonthlyRevenue.toLocaleString()}` : "�", color: "#fbbf24" },
                        { label: "Opp. Score", val: roiResult.contentOpportunityScore, color: roiResult.contentOpportunityScore >= 70 ? "#22c55e" : "#eab308" },
                      ].map((m, i) => (
                        <div key={i} style={{ flex: "1 1 120px", background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 16px", textAlign: "center" }}>
                          <div style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{m.val}</div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: "#71717a", textTransform: "uppercase", marginTop: 2 }}>{m.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "12px 16px", marginBottom: 10 }}>
                      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                        <div><div style={{ fontSize: 11, color: "#71717a" }}>Time to rank</div><div style={{ color: "#d4d4d8", fontSize: 13 }}>{roiResult.ttRank}</div></div>
                        <div><div style={{ fontSize: 11, color: "#71717a" }}>Competition</div><div style={{ color: "#d4d4d8", fontSize: 13 }}>{roiResult.competitionLevel}</div></div>
                        <div><div style={{ fontSize: 11, color: "#71717a" }}>Effort</div><div style={{ color: "#d4d4d8", fontSize: 13 }}>{roiResult.effortEstimate}</div></div>
                        <div><div style={{ fontSize: 11, color: "#71717a" }}>Content type</div><div style={{ color: "#d4d4d8", fontSize: 13 }}>{roiResult.contentType}</div></div>
                        <div><div style={{ fontSize: 11, color: "#71717a" }}>Word count</div><div style={{ color: "#d4d4d8", fontSize: 13 }}>{roiResult.wordCount?.toLocaleString()}</div></div>
                      </div>
                    </div>
                    <div style={{ background: "#1c1917", border: "1px solid #a16207", borderRadius: 8, padding: "10px 14px", color: "#fbbf24", fontSize: 13 }}>{roiResult.verdict}</div>
                  </div>
                )}
              </div>
            )}

            {/* 5. SGE / AI Overview Optimizer */}
            {growthSub === "sge" && (
              <div style={S.card}>
                <div style={S.cardTitle}>?? SGE / AI Overview Optimizer <span style={{ fontSize: 11, color: "#818cf8", marginLeft: 6 }}>AI � 2 credits</span></div>
                <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 12 }}>Optimize your content to be cited in Google AI Overviews, Perplexity, Bing Copilot and ChatGPT Browse.</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                  <select style={{ ...S.input, flex: "1 1 160px" }} value={sgeEngine} onChange={e => setSgeEngine(e.target.value)}>
                    <option value="google-aio">Google AI Overview</option>
                    <option value="perplexity">Perplexity AI</option>
                    <option value="chatgpt">ChatGPT Browse</option>
                    <option value="bing-copilot">Bing Copilot</option>
                  </select>
                  <input style={{ ...S.input, flex: "1 1 180px" }} placeholder="Target keyword" value={sgeKw} onChange={e => setSgeKw(e.target.value)} />
                </div>
                <textarea style={{ ...S.textarea, minHeight: 120 }} placeholder="Paste your content here *" value={sgeContent} onChange={e => setSgeContent(e.target.value)} />
                <button style={S.btn("primary")} disabled={sgeLoading || !sgeContent.trim()} onClick={async () => {
                  setSgeLoading(true); setSgeErr(""); setSgeResult(null);
                  try {
                    const r = await apiFetch(`${API}/ai/sge-optimizer`, { method: "POST", body: JSON.stringify({ content: sgeContent, keyword: sgeKw, aiEngine: sgeEngine }) });
                    if (!r.ok) throw new Error(r.error || "Failed"); setSgeResult(r);
                  } catch (e) { setSgeErr(e.message); } finally { setSgeLoading(false); }
                }}>
                  {sgeLoading ? <><span style={S.spinner} /> Analyzing�</> : "?? Optimize for AI Search (2 credits)"}
                </button>
                {sgeErr && <div style={S.err}>{sgeErr}</div>}
                {sgeResult && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                      <div style={{ textAlign: "center", flex: 1, minWidth: 100 }}>
                        <div style={{ fontSize: 36, fontWeight: 800, color: sgeResult.aioScore >= 70 ? "#22c55e" : sgeResult.aioScore >= 50 ? "#eab308" : "#ef4444" }}>{sgeResult.aioScore}</div>
                        <div style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase" }}>AIO Score</div>
                      </div>
                      <div style={{ flex: 2, background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#71717a", textTransform: "uppercase", marginBottom: 4 }}>Citation Likelihood</div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: sgeResult.citationLikelihood === "high" ? "#22c55e" : sgeResult.citationLikelihood === "medium" ? "#eab308" : "#ef4444" }}>{sgeResult.citationLikelihood?.toUpperCase()}</div>
                      </div>
                    </div>
                    {sgeResult.idealFirstParagraph && (
                      <div style={{ background: "#0f2027", border: "1px solid #0e7490", borderRadius: 8, padding: 14, marginBottom: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#67e8f9", marginBottom: 6 }}>? Ideal First Paragraph (AI-optimized)</div>
                        <div style={{ color: "#e4e4e7", fontSize: 13, lineHeight: 1.6 }}>{sgeResult.idealFirstParagraph}</div>
                      </div>
                    )}
                    {sgeResult.optimizations?.map((o, i) => (
                      <div key={i} style={{ background: "#09090b", border: `1px solid ${o.impact === "high" ? "#7f1d1d" : "#27272a"}`, borderRadius: 8, padding: "10px 14px", marginBottom: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, color: "#e4e4e7", fontSize: 13 }}>{o.type?.replace(/-/g, " ")}</span>
                          <span style={S.pill(o.impact === "high" ? "high" : o.impact === "medium" ? "medium" : "low")}>{o.impact}</span>
                        </div>
                        <div style={{ color: "#a1a1aa", fontSize: 12, marginBottom: 4 }}>{o.description}</div>
                        {o.example && <div style={{ color: "#67e8f9", fontSize: 12, fontStyle: "italic" }}>"{o.example}"</div>}
                      </div>
                    ))}
                    {sgeResult.suggestedFAQs?.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", marginBottom: 8 }}>Suggested FAQs to Add</div>
                        {sgeResult.suggestedFAQs.map((f, i) => (
                          <div key={i} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 14px", marginBottom: 6 }}>
                            <div style={{ fontWeight: 600, color: "#fbbf24", fontSize: 13 }}>Q: {f.question}</div>
                            <div style={{ color: "#d4d4d8", fontSize: 13, marginTop: 4 }}>A: {f.answer}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 6. Topic Miner */}
            {growthSub === "miner" && (
              <div style={S.card}>
                <div style={S.cardTitle}>?? Forum / Reddit Topic Miner <span style={{ fontSize: 11, color: "#818cf8", marginLeft: 6 }}>AI � 2 credits</span></div>
                <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 12 }}>Discover authentic blog topics from real community discussions on Reddit, Quora, and niche forums.</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                  <input style={{ ...S.input, flex: "2 1 220px" }} placeholder="Niche (e.g. home brewing, keto diet) *" value={minerNiche} onChange={e => setMinerNiche(e.target.value)} />
                  <input style={{ ...S.input, flex: "1 1 180px" }} placeholder="Target audience" value={minerAudience} onChange={e => setMinerAudience(e.target.value)} />
                </div>
                <button style={S.btn("primary")} disabled={minerLoading || !minerNiche.trim()} onClick={async () => {
                  setMinerLoading(true); setMinerErr(""); setMinerResult(null);
                  try {
                    const r = await apiFetch(`${API}/ai/topic-miner`, { method: "POST", body: JSON.stringify({ niche: minerNiche, targetAudience: minerAudience }) });
                    if (!r.ok) throw new Error(r.error || "Failed"); setMinerResult(r);
                  } catch (e) { setMinerErr(e.message); } finally { setMinerLoading(false); }
                }}>
                  {minerLoading ? <><span style={S.spinner} /> Mining�</> : "?? Mine Topics (2 credits)"}
                </button>
                {minerErr && <div style={S.err}>{minerErr}</div>}
                {minerResult && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", marginBottom: 8 }}>Top Community Discussions</div>
                    {minerResult.topDiscussions?.slice(0, 5).map((d, i) => (
                      <div key={i} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 14px", marginBottom: 6 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                          <span style={S.pill("low")}>{d.source}</span>
                          <span style={{ fontSize: 11, color: "#71717a" }}>r/{d.community} � {d.upvotes?.toLocaleString()} upvotes</span>
                        </div>
                        <div style={{ fontWeight: 600, color: "#e4e4e7", fontSize: 13 }}>{d.question}</div>
                        <div style={{ color: "#71717a", fontSize: 12, marginTop: 3 }}>{d.insight}</div>
                      </div>
                    ))}
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", marginTop: 14, marginBottom: 8 }}>Blog Ideas</div>
                    {minerResult.blogIdeas?.map((b, i) => (
                      <div key={i} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 14px", marginBottom: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                          <div style={{ fontWeight: 600, color: "#fafafa", fontSize: 13 }}>{b.title}</div>
                          <div style={{ display: "flex", gap: 6 }}>
                            <span style={S.pill("low")}>{b.searchVolume} vol</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#22c55e" }}>{b.opportunityScore}/100</span>
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 3 }}>{b.angle}</div>
                        {b.hook && <div style={{ fontSize: 12, color: "#818cf8", marginTop: 3, fontStyle: "italic" }}>"{b.hook}"</div>}
                      </div>
                    ))}
                    {minerResult.contentGaps?.length > 0 && <><div style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", marginTop: 14, marginBottom: 6 }}>?? Content Gaps</div>{minerResult.contentGaps.map((g, i) => <div key={i} style={{ color: "#d4d4d8", fontSize: 13, padding: "2px 0" }}>� {g}</div>)}</>}
                  </div>
                )}
              </div>
            )}

            {/* 7. Social SEO Score */}
            {growthSub === "social" && (
              <div style={S.card}>
                <div style={S.cardTitle}>?? Social SEO Signal Scorer <span style={{ fontSize: 11, color: "#818cf8", marginLeft: 6 }}>AI � 1 credit</span></div>
                <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 12 }}>Score the social sharing potential of your content and get platform-specific copy to maximize backlinks and brand signals.</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                  <input style={{ ...S.input, flex: "2 1 220px" }} placeholder="Title *" value={socialTitle} onChange={e => setSocialTitle(e.target.value)} />
                  <input style={{ ...S.input, flex: "1 1 180px" }} placeholder="Meta description" value={socialDesc} onChange={e => setSocialDesc(e.target.value)} />
                </div>
                <textarea style={{ ...S.textarea, minHeight: 80 }} placeholder="Content excerpt (optional)" value={socialContent} onChange={e => setSocialContent(e.target.value)} />
                <button style={S.btn("primary")} disabled={socialLoading || !socialTitle.trim()} onClick={async () => {
                  setSocialLoading(true); setSocialErr(""); setSocialResult(null);
                  try {
                    const r = await apiFetch(`${API}/social/seo-score`, { method: "POST", body: JSON.stringify({ title: socialTitle, description: socialDesc, content: socialContent }) });
                    if (!r.ok) throw new Error(r.error || "Failed"); setSocialResult(r);
                  } catch (e) { setSocialErr(e.message); } finally { setSocialLoading(false); }
                }}>
                  {socialLoading ? <><span style={S.spinner} /> Scoring�</> : "?? Score Social SEO (1 credit)"}
                </button>
                {socialErr && <div style={S.err}>{socialErr}</div>}
                {socialResult && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
                      {Object.entries(socialResult.scores || {}).map(([k, v]) => (
                        <div key={k} style={{ flex: "1 1 110px", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                          <div style={{ fontSize: 22, fontWeight: 800, color: v >= 70 ? "#22c55e" : v >= 50 ? "#eab308" : "#ef4444" }}>{v}</div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: "#71717a", textTransform: "uppercase" }}>{k.replace(/([A-Z])/g, " $1").trim()}</div>
                        </div>
                      ))}
                    </div>
                    {socialResult.platforms?.map((p, i) => (
                      <div key={i} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "12px 16px", marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{ fontWeight: 700, color: "#e4e4e7", fontSize: 14 }}>{p.platform}</span>
                          <span style={{ fontWeight: 800, fontSize: 15, color: p.score >= 70 ? "#22c55e" : p.score >= 50 ? "#eab308" : "#ef4444" }}>{p.score}</span>
                        </div>
                        {p.idealPost && <div style={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 6, padding: "8px 12px", color: "#d4d4d8", fontSize: 13, lineHeight: 1.6 }}>{p.idealPost}</div>}
                        {p.improvements?.length > 0 && <div style={{ marginTop: 6 }}>{p.improvements.map((imp, j) => <div key={j} style={{ color: "#f87171", fontSize: 11 }}>? {imp}</div>)}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 8. Competitor Full Audit */}
            {growthSub === "competitor" && (
              <div style={S.card}>
                <div style={S.cardTitle}>??? Competitor Blog Full Audit <span style={{ fontSize: 11, color: "#818cf8", marginLeft: 6 }}>AI � 5 credits</span></div>
                <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 12 }}>Deep AI analysis of a competitor's entire blog strategy � their content gaps, weaknesses, keyword opportunities and exactly how to outrank them.</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                  <input style={{ ...S.input, flex: "2 1 240px" }} placeholder="Competitor blog URL *" value={compUrl} onChange={e => setCompUrl(e.target.value)} />
                  <input style={{ ...S.input, flex: "1 1 180px" }} placeholder="Your niche" value={compNiche} onChange={e => setCompNiche(e.target.value)} />
                </div>
                <button style={S.btn("primary")} disabled={compLoading || !compUrl.trim()} onClick={async () => {
                  setCompLoading(true); setCompErr(""); setCompResult(null);
                  try {
                    const r = await apiFetch(`${API}/competitor/full-audit`, { method: "POST", body: JSON.stringify({ competitorUrl: compUrl, yourNiche: compNiche }) });
                    if (!r.ok) throw new Error(r.error || "Failed"); setCompResult(r);
                  } catch (e) { setCompErr(e.message); } finally { setCompLoading(false); }
                }}>
                  {compLoading ? <><span style={S.spinner} /> Auditing�</> : "?? Full Competitor Audit (5 credits)"}
                </button>
                {compErr && <div style={S.err}>{compErr}</div>}
                {compResult && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                      {[
                        { label: "Strength", val: compResult.overallStrength, color: compResult.overallStrength === "dominant" ? "#ef4444" : compResult.overallStrength === "strong" ? "#f97316" : "#eab308" },
                        { label: "Domain Auth.", val: compResult.domainAuthority, color: "#818cf8" },
                        { label: "Content Quality", val: compResult.contentStrategy?.contentQuality, color: "#6ee7b7" },
                        { label: "Publish Freq.", val: compResult.contentStrategy?.publishingFrequency, color: "#a1a1aa" },
                      ].map((m, i) => (
                        <div key={i} style={{ flex: "1 1 120px", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                          <div style={{ fontSize: 16, fontWeight: 800, color: m.color }}>{m.val}</div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: "#71717a", textTransform: "uppercase", marginTop: 2 }}>{m.label}</div>
                        </div>
                      ))}
                    </div>
                    {compResult.topicGaps?.length > 0 && <><div style={{ fontSize: 12, fontWeight: 700, color: "#22c55e", textTransform: "uppercase", marginBottom: 6 }}>?? Topic Gaps to Exploit</div>{compResult.topicGaps.map((g, i) => <div key={i} style={{ color: "#d4d4d8", fontSize: 13, padding: "3px 0" }}>� {g}</div>)}</>}
                    {compResult.keywordOpportunities?.length > 0 && (
                      <><div style={{ fontSize: 12, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", marginTop: 14, marginBottom: 8 }}>Keyword Opportunities</div>
                      {compResult.keywordOpportunities.map((k, i) => (
                        <div key={i} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 6, padding: "8px 12px", marginBottom: 4, display: "flex", gap: 12, alignItems: "center" }}>
                          <span style={{ flex: 1, color: "#e4e4e7", fontSize: 13 }}>{k.keyword}</span>
                          <span style={S.pill(k.difficulty === "hard" ? "high" : k.difficulty === "medium" ? "medium" : "low")}>{k.difficulty}</span>
                          <span style={{ color: "#71717a", fontSize: 12 }}>{k.rationale}</span>
                        </div>
                      ))}</>
                    )}
                    {compResult.battlePlan?.length > 0 && (
                      <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24", textTransform: "uppercase", marginBottom: 8 }}>?? Battle Plan</div>
                        {compResult.battlePlan.map((b, i) => (
                          <div key={i} style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: "1px solid #1e1e22" }}>
                            <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#4f46e5", color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                            <span style={{ color: "#d4d4d8", fontSize: 13 }}>{b}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 9. Link Reclamation */}
            {growthSub === "reclaim" && (
              <div style={S.card}>
                <div style={S.cardTitle}>?? Link Reclamation Finder <span style={{ fontSize: 11, color: "#818cf8", marginLeft: 6 }}>AI � 2 credits</span></div>
                <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 12 }}>Find unlinked brand and topic mentions across the web and get outreach templates to convert them into backlinks.</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                  <input style={{ ...S.input, flex: "2 1 200px" }} placeholder="Brand / site name *" value={reclaimBrand} onChange={e => setReclaimBrand(e.target.value)} />
                  <input style={{ ...S.input, flex: "1 1 160px" }} placeholder="Your website URL" value={reclaimSite} onChange={e => setReclaimSite(e.target.value)} />
                  <input style={{ ...S.input, flex: "1 1 160px" }} placeholder="Niche" value={reclaimNiche} onChange={e => setReclaimNiche(e.target.value)} />
                </div>
                <button style={S.btn("primary")} disabled={reclaimLoading || !reclaimBrand.trim()} onClick={async () => {
                  setReclaimLoading(true); setReclaimErr(""); setReclaimResult(null);
                  try {
                    const r = await apiFetch(`${API}/backlinks/link-reclamation`, { method: "POST", body: JSON.stringify({ brandName: reclaimBrand, siteUrl: reclaimSite, niche: reclaimNiche }) });
                    if (!r.ok) throw new Error(r.error || "Failed"); setReclaimResult(r);
                  } catch (e) { setReclaimErr(e.message); } finally { setReclaimLoading(false); }
                }}>
                  {reclaimLoading ? <><span style={S.spinner} /> Searching�</> : "?? Find Link Opportunities (2 credits)"}
                </button>
                {reclaimErr && <div style={S.err}>{reclaimErr}</div>}
                {reclaimResult && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", marginBottom: 8 }}>Search Strings</div>
                    {reclaimResult.searchStrings?.map((s, i) => (
                      <div key={i} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 6, padding: "8px 12px", marginBottom: 4 }}>
                        <code style={{ color: "#86efac", fontSize: 12, fontFamily: "'Fira Code',monospace" }}>{s.query}</code>
                        <div style={{ color: "#71717a", fontSize: 11, marginTop: 2 }}>{s.intent}</div>
                      </div>
                    ))}
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", marginTop: 14, marginBottom: 8 }}>Outreach Templates</div>
                    {reclaimResult.outreachTemplates?.map((t, i) => (
                      <div key={i} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: 14, marginBottom: 8 }}>
                        <div style={{ fontSize: 11, color: "#818cf8", marginBottom: 4 }}>{t.scenario}</div>
                        <div style={{ fontWeight: 600, color: "#fbbf24", marginBottom: 6 }}>Subject: {t.subject}</div>
                        <pre style={{ color: "#d4d4d8", fontSize: 12, whiteSpace: "pre-wrap", margin: 0, fontFamily: "inherit", lineHeight: 1.6 }}>{t.body}</pre>
                      </div>
                    ))}
                    {reclaimResult.estimatedLinks && <div style={{ background: "#14532d22", border: "1px solid #166534", borderRadius: 8, padding: "10px 14px", color: "#86efac", fontSize: 13 }}>?? Estimated links/month: {reclaimResult.estimatedLinks}</div>}
                  </div>
                )}
              </div>
            )}

            {/* 10. Google News SEO */}
            {growthSub === "gnews" && (
              <div style={S.card}>
                <div style={S.cardTitle}>?? Google News SEO Checker <span style={{ fontSize: 11, color: "#818cf8", marginLeft: 6 }}>AI � 1 credit</span></div>
                <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 12 }}>Check if your content meets Google News Publisher inclusion criteria and get a step-by-step fix plan.</div>
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <input style={S.input} placeholder="Article URL *" value={gnUrl} onChange={e => setGnUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && !gnLoading && gnUrl.trim() && document.getElementById("gnBtn").click()} />
                  <button id="gnBtn" style={S.btn("primary")} disabled={gnLoading || !gnUrl.trim()} onClick={async () => {
                    setGnLoading(true); setGnErr(""); setGnResult(null);
                    try {
                      const r = await apiFetch(`${API}/technical/google-news`, { method: "POST", body: JSON.stringify({ url: gnUrl }) });
                      if (!r.ok) throw new Error(r.error || "Failed"); setGnResult(r);
                    } catch (e) { setGnErr(e.message); } finally { setGnLoading(false); }
                  }}>
                    {gnLoading ? <><span style={S.spinner} /> Checking�</> : "Check"}
                  </button>
                </div>
                {gnErr && <div style={S.err}>{gnErr}</div>}
                {gnResult && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 14 }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 36, fontWeight: 800, color: gnResult.eligibilityScore >= 70 ? "#22c55e" : gnResult.eligibilityScore >= 50 ? "#eab308" : "#ef4444" }}>{gnResult.eligibilityScore}</div>
                        <div style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase" }}>News Score</div>
                      </div>
                      <div style={{ background: gnResult.isEligible ? "#14532d22" : "#450a0a22", border: `1px solid ${gnResult.isEligible ? "#166534" : "#7f1d1d"}`, borderRadius: 8, padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 20 }}>{gnResult.isEligible ? "?" : "?"}</span>
                        <span style={{ fontWeight: 700, color: gnResult.isEligible ? "#86efac" : "#fca5a5" }}>{gnResult.isEligible ? "Eligible for Google News" : "Not yet eligible"}</span>
                      </div>
                    </div>
                    {gnResult.criteria?.map((c, i) => (
                      <div key={i} style={{ background: c.pass ? "#09090b" : "#450a0a22", border: `1px solid ${c.pass ? "#27272a" : "#7f1d1d"}`, borderRadius: 8, padding: "10px 14px", marginBottom: 6 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span>{c.pass ? "?" : "?"}</span>
                          <span style={{ fontWeight: 600, color: c.pass ? "#d4d4d8" : "#fca5a5", fontSize: 13 }}>{c.name}</span>
                        </div>
                        {!c.pass && c.fix && <div style={{ color: "#71717a", fontSize: 12, marginTop: 4 }}>?? {c.fix}</div>}
                      </div>
                    ))}
                    {gnResult.criticalIssues?.length > 0 && <><div style={{ fontSize: 12, fontWeight: 700, color: "#f87171", textTransform: "uppercase", marginTop: 12, marginBottom: 6 }}>Critical Issues</div>{gnResult.criticalIssues.map((issue, i) => <div key={i} style={{ color: "#fca5a5", fontSize: 13, padding: "2px 0" }}>� {issue}</div>)}</>}
                    {gnResult.estimatedTimeToApproval && <div style={{ marginTop: 12, background: "#1c1917", border: "1px solid #a16207", borderRadius: 8, padding: "10px 14px", color: "#fbbf24", fontSize: 13 }}>? {gnResult.estimatedTimeToApproval}</div>}
                  </div>
                )}
              </div>
            )}

            {/* 11. Performance Predictor */}
            {growthSub === "predictor" && (
              <div style={S.card}>
                <div style={S.cardTitle}>?? Content Performance Predictor <span style={{ fontSize: 11, color: "#818cf8", marginLeft: 6 }}>AI � 2 credits</span></div>
                <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 12 }}>Predict traffic, ranking position and revenue before publishing � so you can optimize before you write.</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                  <input style={{ ...S.input, flex: "2 1 240px" }} placeholder="Planned post title *" value={predTitle} onChange={e => setPredTitle(e.target.value)} />
                  <input style={{ ...S.input, flex: "1 1 180px" }} placeholder="Target keyword" value={predKw} onChange={e => setPredKw(e.target.value)} />
                  <input style={{ ...S.input, flex: "1 1 120px" }} type="number" placeholder="Word count" value={predWords} onChange={e => setPredWords(parseInt(e.target.value))} />
                  <select style={{ ...S.input, flex: "1 1 130px" }} value={predType} onChange={e => setPredType(e.target.value)}>
                    <option value="guide">Guide</option><option value="listicle">Listicle</option><option value="how-to">How-to</option>
                    <option value="comparison">Comparison</option><option value="case-study">Case Study</option><option value="roundup">Roundup</option>
                  </select>
                </div>
                <button style={S.btn("primary")} disabled={predLoading || !predTitle.trim()} onClick={async () => {
                  setPredLoading(true); setPredErr(""); setPredResult(null);
                  try {
                    const r = await apiFetch(`${API}/ai/performance-predictor`, { method: "POST", body: JSON.stringify({ title: predTitle, targetKeyword: predKw, wordCount: predWords, contentType: predType }) });
                    if (!r.ok) throw new Error(r.error || "Failed"); setPredResult(r);
                  } catch (e) { setPredErr(e.message); } finally { setPredLoading(false); }
                }}>
                  {predLoading ? <><span style={S.spinner} /> Predicting�</> : "?? Predict Performance (2 credits)"}
                </button>
                {predErr && <div style={S.err}>{predErr}</div>}
                {predResult && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                      {[
                        { label: "Score", val: predResult.overallScore, color: predResult.overallScore >= 70 ? "#22c55e" : "#eab308" },
                        { label: "Target Pos.", val: `#${predResult.rankingPrediction?.targetPosition}`, color: "#818cf8" },
                        { label: "Time to Rank", val: predResult.rankingPrediction?.timeToRank, color: "#a1a1aa" },
                        { label: "Snippet Chance", val: `${predResult.rankingPrediction?.featuredSnippetChance}%`, color: "#fbbf24" },
                      ].map((m, i) => (
                        <div key={i} style={{ flex: "1 1 120px", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 14px", textAlign: "center" }}>
                          <div style={{ fontSize: i === 0 ? 30 : 16, fontWeight: 800, color: m.color }}>{m.val}</div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: "#71717a", textTransform: "uppercase", marginTop: 2 }}>{m.label}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
                      {Object.entries(predResult.trafficPrediction || {}).map(([k, v]) => (
                        <div key={k} style={{ flex: "1 1 100px", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: 12, textAlign: "center" }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: "#818cf8" }}>{v.visits?.toLocaleString()}</div>
                          <div style={{ fontSize: 10, color: "#71717a", textTransform: "uppercase" }}>{k} visits</div>
                          <div style={{ fontSize: 10, color: "#3f3f46" }}>conf: {v.confidence}</div>
                        </div>
                      ))}
                    </div>
                    {predResult.prePublishOptimizations?.length > 0 && (
                      <><div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", marginBottom: 8 }}>Pre-Publish Optimisations</div>
                      {predResult.prePublishOptimizations.map((o, i) => (
                        <div key={i} style={{ background: "#09090b", border: `1px solid ${o.impact === "high" ? "#7f1d1d" : "#27272a"}`, borderRadius: 8, padding: "8px 14px", marginBottom: 6 }}>
                          <div style={{ display: "flex", gap: 8 }}><span style={S.pill(o.impact === "high" ? "high" : o.impact === "medium" ? "medium" : "low")}>{o.impact}</span><span style={{ color: "#d4d4d8", fontSize: 13 }}>{o.action}</span></div>
                        </div>
                      ))}</>
                    )}
                    <div style={{ background: "#1c1917", border: "1px solid #a16207", borderRadius: 8, padding: "10px 14px", color: "#fbbf24", fontSize: 13, marginTop: 8 }}>{predResult.verdict}</div>
                  </div>
                )}
              </div>
            )}

            {/* 12. Semantic Cluster Builder */}
            {growthSub === "semantic" && (
              <div style={S.card}>
                <div style={S.cardTitle}>?? Semantic Cluster Builder <span style={{ fontSize: 11, color: "#818cf8", marginLeft: 6 }}>AI � 2 credits</span></div>
                <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 12 }}>Map every related keyword, entity and sub-topic Google associates with your seed topic to build comprehensive topical authority.</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                  <input style={{ ...S.input, flex: "2 1 240px" }} placeholder="Seed topic (e.g. intermittent fasting) *" value={semTopic} onChange={e => setSemTopic(e.target.value)} />
                  <input style={{ ...S.input, flex: "1 1 160px" }} placeholder="Industry" value={semIndustry} onChange={e => setSemIndustry(e.target.value)} />
                </div>
                <button style={S.btn("primary")} disabled={semLoading || !semTopic.trim()} onClick={async () => {
                  setSemLoading(true); setSemErr(""); setSemResult(null);
                  try {
                    const r = await apiFetch(`${API}/ai/semantic-clusters`, { method: "POST", body: JSON.stringify({ seedTopic: semTopic, industry: semIndustry }) });
                    if (!r.ok) throw new Error(r.error || "Failed"); setSemResult(r);
                  } catch (e) { setSemErr(e.message); } finally { setSemLoading(false); }
                }}>
                  {semLoading ? <><span style={S.spinner} /> Mapping�</> : "?? Build Semantic Map (2 credits)"}
                </button>
                {semErr && <div style={S.err}>{semErr}</div>}
                {semResult && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
                      <div style={{ flex: 1, background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: 12, textAlign: "center" }}>
                        <div style={{ fontSize: 26, fontWeight: 800, color: "#818cf8" }}>{semResult.clusters?.length}</div>
                        <div style={{ fontSize: 10, color: "#71717a", textTransform: "uppercase" }}>Clusters</div>
                      </div>
                      <div style={{ flex: 1, background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: 12, textAlign: "center" }}>
                        <div style={{ fontSize: 26, fontWeight: 800, color: "#22c55e" }}>{semResult.coverageGrade}</div>
                        <div style={{ fontSize: 10, color: "#71717a", textTransform: "uppercase" }}>Coverage Grade</div>
                      </div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", marginBottom: 6 }}>Core Entities</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{semResult.coreEntities?.map((e, i) => <span key={i} style={{ ...S.pill("low"), fontSize: 11 }}>{e}</span>)}</div>
                    </div>
                    {semResult.clusters?.map((c, i) => (
                      <div key={i} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "12px 14px", marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                          <span style={{ fontWeight: 700, color: "#e4e4e7", fontSize: 13 }}>{c.clusterName}</span>
                          <span style={{ fontSize: 11, color: "#818cf8" }}>{c.semanticRelationship}</span>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>{c.keywords?.map((k, j) => <span key={j} style={{ background: "#1e1b40", color: "#c4b5fd", fontSize: 10, padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>{k}</span>)}</div>
                        <div style={{ fontSize: 12, color: "#71717a" }}>?? {c.contentIdea}</div>
                      </div>
                    ))}
                    {semResult.topicalDepth?.mustCover?.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", textTransform: "uppercase", marginBottom: 6 }}>Must Cover (required for authority)</div>
                        {semResult.topicalDepth.mustCover.map((t, i) => <div key={i} style={{ color: "#d4d4d8", fontSize: 13, padding: "2px 0" }}>� {t}</div>)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ================================================================
            RANK TRACKER TAB
            ================================================================ */}
        {tab === "Rank Tracker" && (
          <>
            <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
              {["tracker","bulk","gsc","forecast"].map(s => (
                <button key={s} style={{ ...S.btn(rtSub===s?"primary":undefined), fontSize:12 }} onClick={() => setRtSub(s)}>
                  {s==="tracker"?"Tracker":s==="bulk"?"Bulk Check":s==="gsc"?"GSC Import":"AI Forecast"}
                </button>
              ))}
            </div>
            {rtSub === "tracker" && (
              <div style={S.card}>
                <div style={S.cardTitle}>Keyword Rank Tracker</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
                  <input style={{ ...S.input, flex:2, minWidth:150 }} placeholder="Keyword" value={rtKeyword} onChange={e => setRtKeyword(e.target.value)} />
                  <button style={S.btn("primary")} disabled={rtLoading} onClick={async () => {
                    if (!rtKeyword.trim()) return;
                    setRtLoading(true); setRtErr("");
                    try {
                      await apiFetch("/api/blog-seo/rank/add-keyword", { method:"POST", body: JSON.stringify({ keyword: rtKeyword.trim(), shop: "demo" }) });
                      const list = await apiFetch("/api/blog-seo/rank/list?shop=demo");
                      setRtKeywords(list.keywords || []); setRtKeyword("");
                    } catch(e) { setRtErr(e.message); }
                    setRtLoading(false);
                  }}>{rtLoading ? "..." : "+ Add"}</button>
                </div>
                {rtErr && <div style={{ color:"#ef4444", fontSize:12, marginBottom:8 }}>{rtErr}</div>}
                {rtKeywords.length === 0 && <div style={S.empty}>No keywords tracked yet. Add your first keyword above.</div>}
                {rtKeywords.map((kw, i) => (
                  <div key={i} style={{ ...S.issueRow, justifyContent:"space-between" }}>
                    <span style={{ fontSize:13, fontWeight:600 }}>{kw.keyword || kw}</span>
                    <button style={{ ...S.btn(), fontSize:11, padding:"4px 8px" }} onClick={async () => {
                      setRtLoading(true);
                      try { const r = await apiFetch("/api/blog-seo/rank/check-position", { method:"POST", body: JSON.stringify({ keywordId: kw.id || i, keyword: kw.keyword || kw, shop:"demo" }) }); setRtResult(r); }
                      catch(e) { setRtErr(e.message); }
                      setRtLoading(false);
                    }}>Check</button>
                  </div>
                ))}
                {rtResult && (
                  <div style={{ ...S.card, background:"#18181b", marginTop:12, padding:12 }}>
                    <div style={{ fontSize:13, fontWeight:600, marginBottom:6 }}>Position: <strong style={{ color:"#818cf8", fontSize:20 }}>{rtResult.estimatedPosition || rtResult.position || "?"}</strong></div>
                    {rtResult.reasoning && <div style={{ fontSize:12, color:"#a1a1aa" }}>{rtResult.reasoning}</div>}
                  </div>
                )}
              </div>
            )}
            {rtSub === "bulk" && (
              <div style={S.card}>
                <div style={S.cardTitle}>Bulk Rank Check</div>
                <p style={{ fontSize:12, color:"#71717a", marginBottom:12 }}>Check all tracked keywords at once (5 credits).</p>
                <button style={S.btn("primary")} disabled={rtLoading} onClick={async () => {
                  setRtLoading(true); setRtErr("");
                  try { const r = await apiFetch("/api/blog-seo/rank/bulk-check", { method:"POST", body: JSON.stringify({ shop:"demo" }) }); setRtResult(r); }
                  catch(e) { setRtErr(e.message); }
                  setRtLoading(false);
                }}>{rtLoading ? <span style={S.spinner}/> : "Run Bulk Check (5cr)"}</button>
                {rtResult?.results && rtResult.results.map((r, i) => (
                  <div key={i} style={{ ...S.issueRow, justifyContent:"space-between" }}>
                    <span style={{ fontSize:13 }}>{r.keyword}</span>
                    <span style={{ fontSize:14, fontWeight:800, color: (r.estimatedPosition||r.position||99) <= 3 ? "#22c55e" : (r.estimatedPosition||r.position||99) <= 10 ? "#eab308" : "#ef4444" }}>#{r.estimatedPosition || r.position || "?"}</span>
                  </div>
                ))}
              </div>
            )}
            {rtSub === "gsc" && (
              <div style={S.card}>
                <div style={S.cardTitle}>GSC Data Import</div>
                <p style={{ fontSize:12, color:"#71717a", marginBottom:8 }}>Paste your Google Search Console Performance CSV (Query, Clicks, Impressions, CTR, Position).</p>
                <textarea style={{ ...S.input, height:110, fontFamily:"monospace", fontSize:11 }} placeholder={"query,clicks,impressions,ctr,position\nbest running shoes,120,4500,2.8,4.2"} value={rtGscCsv} onChange={e => setRtGscCsv(e.target.value)} />
                <button style={{ ...S.btn("primary"), marginTop:8 }} disabled={rtGscLoading} onClick={async () => {
                  setRtGscLoading(true);
                  try { const r = await apiFetch("/api/blog-seo/gsc/import-csv", { method:"POST", body: JSON.stringify({ csvData: rtGscCsv, shop:"demo" }) }); setRtGscResult(r); }
                  catch(e) { setRtErr(e.message); }
                  setRtGscLoading(false);
                }}>{rtGscLoading ? <span style={S.spinner}/> : "Import GSC Data"}</button>
                {rtGscResult && <div style={{ color:"#22c55e", fontSize:13, marginTop:8 }}>{rtGscResult.imported || rtGscResult.count || 0} keywords imported from GSC.</div>}
              </div>
            )}
            {rtSub === "forecast" && (
              <div style={S.card}>
                <div style={S.cardTitle}>AI Rank Forecast</div>
                <p style={{ fontSize:12, color:"#71717a", marginBottom:12 }}>30/60/90-day trajectory forecast (2 credits).</p>
                <div style={{ display:"flex", gap:8 }}>
                  <input style={{ ...S.input, flex:1 }} placeholder="Keyword" value={rtKeyword} onChange={e => setRtKeyword(e.target.value)} />
                  <button style={S.btn("primary")} disabled={rtForecastLoading} onClick={async () => {
                    setRtForecastLoading(true);
                    try { const r = await apiFetch("/api/blog-seo/rank/ai-forecast", { method:"POST", body: JSON.stringify({ keyword: rtKeyword, currentPosition: 15, shop:"demo" }) }); setRtForecastResult(r); }
                    catch(e) { setRtErr(e.message); }
                    setRtForecastLoading(false);
                  }}>{rtForecastLoading ? <span style={S.spinner}/> : "Forecast (2cr)"}</button>
                </div>
                {rtForecastResult && (
                  <div style={{ display:"flex", gap:12, marginTop:12, flexWrap:"wrap" }}>
                    {["30","60","90"].map(d => (
                      <div key={d} style={{ ...S.card, background:"#27272a", padding:"10px 18px", textAlign:"center", flex:"1 1 70px" }}>
                        <div style={{ fontSize:22, fontWeight:800, color:"#818cf8" }}>{rtForecastResult["day"+d] || "�"}</div>
                        <div style={{ fontSize:11, color:"#71717a" }}>{d}-day</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
        {/* SITE CRAWL TAB */}
        {tab === "Site Crawl" && (
          <>
            <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
              {["crawl","results","orphans","compare"].map(s => (
                <button key={s} style={{ ...S.btn(crawlSub===s?"primary":undefined), fontSize:12 }} onClick={() => setCrawlSub(s)}>
                  {s==="crawl"?"Start Crawl":s==="results"?"Results":s==="orphans"?"Orphan Finder":"Compare Snapshots"}
                </button>
              ))}
            </div>
            {crawlSub === "crawl" && (
              <div style={S.card}>
                <div style={S.cardTitle}>Site Crawler</div>
                <p style={{ fontSize:12, color:"#71717a", marginBottom:12 }}>BFS crawl up to 200 pages � detects broken links, missing titles, meta, H1s, noindex tags.</p>
                <div style={{ display:"flex", gap:8 }}>
                  <input style={{ ...S.input, flex:1 }} placeholder="https://yoursite.com" value={crawlUrl} onChange={e => setCrawlUrl(e.target.value)} />
                  <button style={S.btn("primary")} disabled={crawlLoading} onClick={async () => {
                    if (!crawlUrl.trim()) return;
                    setCrawlLoading(true); setCrawlErr("");
                    try {
                      const r = await apiFetch("/api/blog-seo/crawl/start", { method:"POST", body: JSON.stringify({ url: crawlUrl.trim(), shop:"demo", maxPages:200 }) });
                      setCrawlStatus(r);
                      let tries = 0;
                      const poll = setInterval(async () => {
                        tries++;
                        try {
                          const status = await apiFetch("/api/blog-seo/crawl/status?shop=demo");
                          setCrawlStatus(status);
                          if (status.status === "done" || tries > 30) {
                            clearInterval(poll);
                            const results = await apiFetch("/api/blog-seo/crawl/results?shop=demo");
                            setCrawlResults(results); setCrawlLoading(false);
                          }
                        } catch(e) { clearInterval(poll); setCrawlLoading(false); }
                      }, 3000);
                    } catch(e) { setCrawlErr(e.message); setCrawlLoading(false); }
                  }}>{crawlLoading ? "Crawling..." : "Start Crawl"}</button>
                </div>
                {crawlErr && <div style={{ color:"#ef4444", fontSize:12, marginTop:8 }}>{crawlErr}</div>}
                {crawlStatus && <div style={{ marginTop:12, padding:10, background:"#18181b", borderRadius:8, fontSize:13 }}>Status: <strong style={{ color: crawlStatus.status==="done"?"#22c55e":"#eab308" }}>{crawlStatus.status}</strong> &nbsp; Pages: {crawlStatus.crawled || 0}</div>}
              </div>
            )}
            {crawlSub === "results" && (
              <div style={S.card}>
                <div style={S.cardTitle}>Crawl Results</div>
                {!crawlResults && <div style={S.empty}>No crawl results yet. Start a crawl first.</div>}
                {crawlResults && (
                  <>
                    <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:12 }}>
                      {[["Total Pages",crawlResults.totalPages||0,"#fafafa"],["Broken Links",crawlResults.brokenLinks||0,"#ef4444"],["Missing Title",crawlResults.missingTitle||0,"#eab308"],["Missing H1",crawlResults.missingH1||0,"#f97316"]].map(([l,v,c])=>(
                        <div key={l} style={{ ...S.card, background:"#27272a", padding:"8px 14px", textAlign:"center" }}>
                          <div style={{ fontSize:20, fontWeight:800, color:c }}>{v}</div>
                          <div style={{ fontSize:10, color:"#71717a" }}>{l}</div>
                        </div>
                      ))}
                    </div>
                    <button style={{ ...S.btn(), fontSize:12, marginBottom:10 }} onClick={async () => {
                      setCrawlAiLoading(true);
                      try { const r = await apiFetch("/api/blog-seo/crawl/ai-summary", { method:"POST", body: JSON.stringify({ shop:"demo" }) }); setCrawlAiSummary(r); }
                      catch(e) { setCrawlErr(e.message); }
                      setCrawlAiLoading(false);
                    }}>{crawlAiLoading ? <span style={S.spinner}/> : "AI Summary (5cr)"}</button>
                    {crawlAiSummary && <div style={{ background:"#27272a", padding:10, borderRadius:8, fontSize:13, marginBottom:10, color:"#a1a1aa" }}>{crawlAiSummary.summary}</div>}
                    {crawlResults.pages?.slice(0,20).map((p, i) => (
                      <div key={i} style={{ ...S.issueRow }}>
                        <div style={{ flex:1, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontSize:12 }}>{p.url}</div>
                        <span style={S.pill(p.status >= 400 ? "critical" : p.missingTitle ? "warning" : "good")}>{p.status >= 400 ? p.status : p.missingTitle ? "No Title" : "OK"}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
            {crawlSub === "orphans" && (
              <div style={S.card}>
                <div style={S.cardTitle}>Orphan Page Finder</div>
                <p style={{ fontSize:12, color:"#71717a", marginBottom:12 }}>Detect pages with no internal links pointing to them.</p>
                <button style={S.btn("primary")} disabled={crawlLoading} onClick={async () => {
                  setCrawlLoading(true);
                  try { const r = await apiFetch("/api/blog-seo/crawl/orphan-finder", { method:"POST", body: JSON.stringify({ shop:"demo" }) }); setCrawlResults(prev => ({...prev, orphans: r.orphanPages})); }
                  catch(e) { setCrawlErr(e.message); }
                  setCrawlLoading(false);
                }}>{crawlLoading ? <span style={S.spinner}/> : "Find Orphan Pages"}</button>
                {crawlResults?.orphans?.map((u, i) => <div key={i} style={S.issueRow}><span style={{ fontSize:12 }}>{u}</span><span style={S.pill("warning")}>Orphan</span></div>)}
                {crawlResults?.orphans?.length === 0 && <div style={{ ...S.empty, marginTop:10 }}>No orphan pages found!</div>}
              </div>
            )}
            {crawlSub === "compare" && (
              <div style={S.card}>
                <div style={S.cardTitle}>Snapshot Compare</div>
                <button style={S.btn("primary")} disabled={crawlLoading} onClick={async () => {
                  setCrawlLoading(true);
                  try { const snaps = await apiFetch("/api/blog-seo/crawl/snapshots?shop=demo"); setCrawlSnapshots(snaps.snapshots || []); }
                  catch(e) { setCrawlErr(e.message); }
                  setCrawlLoading(false);
                }}>{crawlLoading ? <span style={S.spinner}/> : "Load Snapshots"}</button>
                {crawlSnapshots.map((s, i) => <div key={i} style={S.issueRow}><span style={{ fontSize:12 }}>{new Date(s.createdAt).toLocaleDateString()} � {s.totalPages} pages</span></div>)}
              </div>
            )}
          </>
        )}

        {/* GEO & LLM TAB */}
        {tab === "GEO & LLM" && (
          <>
            <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
              {["health","prompt","tracker","llmstxt"].map(s => (
                <button key={s} style={{ ...S.btn(geoSub===s?"primary":undefined), fontSize:12 }} onClick={() => setGeoSub(s)}>
                  {s==="health"?"GEO Health":s==="prompt"?"Prompt Sim":s==="tracker"?"AI Tracker":"llms.txt"}
                </button>
              ))}
            </div>
            {geoSub === "health" && (
              <div style={S.card}>
                <div style={S.cardTitle}>GEO Health Score</div>
                <p style={{ fontSize:12, color:"#71717a", marginBottom:12 }}>3-pillar scoring: Discovery, Understanding, Inclusion � no credits needed.</p>
                <div style={{ display:"flex", gap:8 }}>
                  <input style={{ ...S.input, flex:1 }} placeholder="https://yoursite.com" value={geoUrl} onChange={e => setGeoUrl(e.target.value)} />
                  <button style={S.btn("primary")} disabled={geoLoading} onClick={async () => {
                    if (!geoUrl.trim()) return;
                    setGeoLoading(true); setGeoErr("");
                    try { const r = await apiFetch("/api/blog-seo/geo/geo-health-score", { method:"POST", body: JSON.stringify({ url: geoUrl, shop:"demo" }) }); setGeoScore(r); }
                    catch(e) { setGeoErr(e.message); }
                    setGeoLoading(false);
                  }}>{geoLoading ? <span style={S.spinner}/> : "Analyse"}</button>
                </div>
                {geoErr && <div style={{ color:"#ef4444", fontSize:12, marginTop:8 }}>{geoErr}</div>}
                {geoScore && (
                  <div style={{ marginTop:14 }}>
                    <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:12 }}>
                      {[["Overall",geoScore.overallScore,"#818cf8"],["Discovery",geoScore.discovery?.score,"#22c55e"],["Understanding",geoScore.understanding?.score,"#eab308"],["Inclusion",geoScore.inclusion?.score,"#f97316"]].map(([l,v,c])=>(
                        <div key={l} style={{ ...S.card, background:"#27272a", padding:"10px 14px", textAlign:"center", flex:"1 1 70px" }}>
                          <div style={{ fontSize:24, fontWeight:800, color:c }}>{v ?? "�"}</div>
                          <div style={{ fontSize:10, color:"#71717a" }}>{l}</div>
                        </div>
                      ))}
                    </div>
                    {geoScore.recommendations?.map((r, i) => <div key={i} style={{ fontSize:12, color:"#a1a1aa", marginBottom:3 }}>� {r}</div>)}
                  </div>
                )}
              </div>
            )}
            {geoSub === "prompt" && (
              <div style={S.card}>
                <div style={S.cardTitle}>AI Prompt Simulator</div>
                <p style={{ fontSize:12, color:"#71717a", marginBottom:12 }}>Simulate how AI answers a query and whether your brand is cited (3 credits).</p>
                <input style={{ ...S.input, marginBottom:8 }} placeholder="Your brand name" value={promptSimBrand} onChange={e => setPromptSimBrand(e.target.value)} />
                <input style={{ ...S.input, marginBottom:8 }} placeholder='Query (e.g. "best email tools")' value={promptSimQuery} onChange={e => setPromptSimQuery(e.target.value)} />
                <button style={S.btn("primary")} disabled={promptSimLoading} onClick={async () => {
                  if (!promptSimBrand || !promptSimQuery) return;
                  setPromptSimLoading(true);
                  try { const r = await apiFetch("/api/blog-seo/geo/prompt-simulation", { method:"POST", body: JSON.stringify({ brandName: promptSimBrand, query: promptSimQuery, shop:"demo" }) }); setPromptSimResult(r); }
                  catch(e) { setGeoErr(e.message); }
                  setPromptSimLoading(false);
                }}>{promptSimLoading ? <span style={S.spinner}/> : "Simulate (3cr)"}</button>
                {promptSimResult && (
                  <div style={{ marginTop:10 }}>
                    <div style={{ background:"#18181b", borderRadius:8, padding:10, fontSize:13, color:"#e4e4e7", marginBottom:8 }}>{promptSimResult.simulatedResponse || promptSimResult.response}</div>
                    <div style={{ fontSize:13 }}>Brand cited: <strong style={{ color: promptSimResult.brandMentioned ? "#22c55e" : "#ef4444" }}>{promptSimResult.brandMentioned ? "Yes" : "No"}</strong></div>
                    {promptSimResult.improvements?.map((imp, i) => <div key={i} style={{ fontSize:12, color:"#a1a1aa", marginTop:3 }}>� {imp}</div>)}
                  </div>
                )}
              </div>
            )}
            {geoSub === "tracker" && (
              <div style={S.card}>
                <div style={S.cardTitle}>AI Platform Tracker</div>
                <p style={{ fontSize:12, color:"#71717a", marginBottom:12 }}>Visibility across ChatGPT, Perplexity, Google AIO, Gemini, Claude, Copilot, Grok, DeepSeek (3 credits).</p>
                <input style={{ ...S.input, marginBottom:8 }} placeholder="Brand" value={geoTrackerBrand} onChange={e => setGeoTrackerBrand(e.target.value)} />
                <input style={{ ...S.input, marginBottom:8 }} placeholder="Test query" value={geoTrackerQuery} onChange={e => setGeoTrackerQuery(e.target.value)} />
                <button style={S.btn("primary")} disabled={geoTrackerLoading} onClick={async () => {
                  if (!geoTrackerBrand || !geoTrackerQuery) return;
                  setGeoTrackerLoading(true);
                  try { const r = await apiFetch("/api/blog-seo/geo/ai-platform-tracker", { method:"POST", body: JSON.stringify({ brandName: geoTrackerBrand, query: geoTrackerQuery, niche:"general", shop:"demo" }) }); setGeoTrackerResult(r); }
                  catch(e) { setGeoErr(e.message); }
                  setGeoTrackerLoading(false);
                }}>{geoTrackerLoading ? <span style={S.spinner}/> : "Track All Platforms (3cr)"}</button>
                {geoTrackerResult?.platforms && geoTrackerResult.platforms.map((p, i) => (
                  <div key={i} style={{ ...S.issueRow, justifyContent:"space-between" }}>
                    <span style={{ fontSize:13, fontWeight:600 }}>{p.platform}</span>
                    <span style={S.pill(p.mentioned ? "good" : "critical")}>{p.mentioned ? "Mentioned" : "Not found"}</span>
                  </div>
                ))}
                {geoTrackerResult && <div style={{ fontSize:13, marginTop:8 }}>Visibility: <strong style={{ color:"#818cf8" }}>{geoTrackerResult.overallVisibility || geoTrackerResult.visibilityScore || "�"}</strong></div>}
              </div>
            )}
            {geoSub === "llmstxt" && (
              <div style={S.card}>
                <div style={S.cardTitle}>llms.txt Generator</div>
                <p style={{ fontSize:12, color:"#71717a", marginBottom:12 }}>Generate a llms.txt file � the emerging AI-era SEO standard for telling LLMs about your site.</p>
                <div style={{ display:"flex", gap:8 }}>
                  <input style={{ ...S.input, flex:1 }} placeholder="https://yoursite.com" value={geoUrl} onChange={e => setGeoUrl(e.target.value)} />
                  <button style={S.btn("primary")} disabled={llmsTxtLoading} onClick={async () => {
                    if (!geoUrl.trim()) return;
                    setLlmsTxtLoading(true);
                    try { const r = await apiFetch("/api/blog-seo/llms-txt/generate?url=" + encodeURIComponent(geoUrl) + "&shop=demo"); setLlmsTxtResult(r); }
                    catch(e) { setGeoErr(e.message); }
                    setLlmsTxtLoading(false);
                  }}>{llmsTxtLoading ? <span style={S.spinner}/> : "Generate llms.txt"}</button>
                </div>
                {llmsTxtResult && (
                  <div style={{ marginTop:10 }}>
                    <textarea style={{ ...S.input, height:160, fontFamily:"monospace", fontSize:11 }} readOnly value={llmsTxtResult.llmsTxt || llmsTxtResult.content || ""} />
                    <button style={{ ...S.btn(), marginTop:6, fontSize:12 }} onClick={() => { const a=document.createElement("a"); a.href="data:text/plain;charset=utf-8,"+encodeURIComponent(llmsTxtResult.llmsTxt||""); a.download="llms.txt"; a.click(); }}>Download llms.txt</button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* TREND SCOUT TAB */}
        {tab === "Trend Scout" && (
          <>
            <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
              {["rising","seasonal","surge","micro"].map(s => (
                <button key={s} style={{ ...S.btn(trendSub===s?"primary":undefined), fontSize:12 }} onClick={() => setTrendSub(s)}>
                  {s==="rising"?"Rising Topics":s==="seasonal"?"Seasonal Planner":s==="surge"?"Surge Detector":"Micro-Niche"}
                </button>
              ))}
            </div>
            <div style={{ ...S.card, marginBottom:12 }}>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                <input style={{ ...S.input, flex:1, minWidth:140 }} placeholder="Niche (e.g. pet food)" value={trendNiche} onChange={e => setTrendNiche(e.target.value)} />
                <input style={{ ...S.input, flex:1, minWidth:140 }} placeholder="Industry (optional)" value={trendIndustry} onChange={e => setTrendIndustry(e.target.value)} />
              </div>
            </div>
            {trendSub === "rising" && (
              <div style={S.card}>
                <div style={S.cardTitle}>Rising Topics</div>
                <button style={S.btn("primary")} disabled={trendLoading} onClick={async () => {
                  if (!trendNiche.trim()) return;
                  setTrendLoading(true); setTrendErr("");
                  try { const r = await apiFetch("/api/blog-seo/trends/rising-topics", { method:"POST", body: JSON.stringify({ niche: trendNiche, industry: trendIndustry }) }); setTrendRising(r); }
                  catch(e) { setTrendErr(e.message); }
                  setTrendLoading(false);
                }}>{trendLoading ? <span style={S.spinner}/> : "Find Rising Topics (2cr)"}</button>
                {trendErr && <div style={{ color:"#ef4444", fontSize:12, marginTop:6 }}>{trendErr}</div>}
                {trendRising?.risingTopics?.map((t, i) => (
                  <div key={i} style={{ ...S.card, background:"#27272a", padding:10, marginTop:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:13, fontWeight:700 }}>{t.topic}</span>
                      <span style={S.pill(t.urgency==="act now"?"critical":t.urgency==="this month"?"warning":"good")}>{t.urgency}</span>
                    </div>
                    <div style={{ fontSize:12, color:"#71717a", marginTop:3 }}>Growth: {t.growthEstimate} � {t.competition} competition</div>
                    <div style={{ fontSize:12, color:"#a1a1aa" }}>{t.contentAngle}</div>
                  </div>
                ))}
              </div>
            )}
            {trendSub === "seasonal" && (
              <div style={S.card}>
                <div style={S.cardTitle}>Seasonal Content Planner</div>
                <button style={S.btn("primary")} disabled={trendSeasonalLoading} onClick={async () => {
                  if (!trendNiche.trim()) return;
                  setTrendSeasonalLoading(true);
                  try { const r = await apiFetch("/api/blog-seo/trends/seasonal-planner", { method:"POST", body: JSON.stringify({ niche: trendNiche }) }); setTrendSeasonal(r); }
                  catch(e) { setTrendErr(e.message); }
                  setTrendSeasonalLoading(false);
                }}>{trendSeasonalLoading ? <span style={S.spinner}/> : "Generate Calendar (2cr)"}</button>
                {trendSeasonal?.calendar && Object.entries(trendSeasonal.calendar).map(([month, items]) => Array.isArray(items) && items.length > 0 && (
                  <div key={month} style={{ marginTop:10 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:"#818cf8", textTransform:"capitalize", marginBottom:4 }}>{month}</div>
                    {items.map((item, i) => <div key={i} style={S.issueRow}><span style={{ fontSize:12 }}>{item.topic}</span><span style={{ fontSize:11, color:"#71717a" }}>{item.contentType}</span></div>)}
                  </div>
                ))}
              </div>
            )}
            {trendSub === "surge" && (
              <div style={S.card}>
                <div style={S.cardTitle}>Keyword Surge Detector</div>
                <button style={S.btn("primary")} disabled={trendSurgeLoading} onClick={async () => {
                  if (!trendNiche.trim()) return;
                  setTrendSurgeLoading(true);
                  try { const r = await apiFetch("/api/blog-seo/trends/keyword-surge-detector", { method:"POST", body: JSON.stringify({ niche: trendNiche }) }); setTrendSurge(r); }
                  catch(e) { setTrendErr(e.message); }
                  setTrendSurgeLoading(false);
                }}>{trendSurgeLoading ? <span style={S.spinner}/> : "Detect Surges (2cr)"}</button>
                {trendSurge?.surges?.map((s, i) => (
                  <div key={i} style={{ ...S.issueRow, justifyContent:"space-between" }}>
                    <div><div style={{ fontSize:13, fontWeight:600 }}>{s.keyword}</div><div style={{ fontSize:11, color:"#71717a" }}>{s.trigger}</div></div>
                    <span style={{ fontSize:14, fontWeight:800, color:"#22c55e" }}>{s.estimatedGrowth}</span>
                  </div>
                ))}
              </div>
            )}
            {trendSub === "micro" && (
              <div style={S.card}>
                <div style={S.cardTitle}>Micro-Niche Finder</div>
                <button style={S.btn("primary")} disabled={trendMicroLoading} onClick={async () => {
                  if (!trendNiche.trim()) return;
                  setTrendMicroLoading(true);
                  try { const r = await apiFetch("/api/blog-seo/trends/micro-niche-finder", { method:"POST", body: JSON.stringify({ broadNiche: trendNiche, industry: trendIndustry }) }); setTrendMicro(r); }
                  catch(e) { setTrendErr(e.message); }
                  setTrendMicroLoading(false);
                }}>{trendMicroLoading ? <span style={S.spinner}/> : "Find Micro-Niches (2cr)"}</button>
                {trendMicro?.topPick && <div style={{ fontSize:13, color:"#22c55e", fontWeight:600, marginTop:8 }}>Top Pick: {trendMicro.topPick}</div>}
                {trendMicro?.microNiches?.map((n, i) => (
                  <div key={i} style={{ ...S.card, background:"#27272a", padding:10, marginTop:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{ fontSize:13, fontWeight:700 }}>{n.niche}</span>
                      <span style={S.pill(n.monetisationPotential==="high"?"good":"warning")}>{n.monetisationPotential}</span>
                    </div>
                    <div style={{ fontSize:12, color:"#a1a1aa", marginTop:3 }}>{n.entryStrategy}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {/* ================================================================
            HISTORY TAB
            ================================================================ */}
        {tab === "History" && (
          <>
            <div style={{ ...S.card, marginTop: 16 }}>
              <div style={{ ...S.cardTitle, justifyContent: "space-between" }}>
                <span>?? Scan History</span>
                <button style={S.btn()} onClick={loadHistory} disabled={historyLoading}>{historyLoading ? "Loading�" : "Refresh"}</button>
              </div>
              {history.length === 0 && !historyLoading && <div style={S.empty}>No history yet. Scan a blog post to start building history.</div>}
              {historyLoading && <div style={S.empty}><span style={S.spinner} /></div>}
              {history.slice().reverse().map(h => (
                <div key={h.id} style={{ ...S.issueRow, justifyContent: "space-between" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#fafafa" }}>{h.title || h.url || "Untitled"}</div>
                    <div style={{ fontSize: 11, color: "#71717a", marginTop: 2 }}>{h.url} � {new Date(h.ts).toLocaleString()}</div>
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

          </>
        )}
      </div>
    </div>
  );
}

/* -- Helper components ---------------------------------------------------- */
function MetaChip({ label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: color || "#fafafa" }}>{value ?? "�"}</div>
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
      <div style={{ ...S.metaVal, color: over ? "#eab308" : "#d4d4d8" }}>{value || "�"}</div>
    </div>
  );
}

function ToggleSection({ title, open, toggle }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={toggle}>
      <span style={{ fontSize: 14, fontWeight: 600 }}>{title}</span>
      <span style={{ fontSize: 13, color: "#818cf8" }}>{open ? "? Hide" : "? Show"}</span>
    </div>
  );
}
