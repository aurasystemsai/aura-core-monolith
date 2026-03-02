import React, { useState, useRef, useCallback, useEffect } from "react";
import { apiFetch, apiFetchJSON } from "../../api";
import BackButton from "./BackButton";
import { DOCS as DOCS_OBJ, MISSIONS, GLOSSARY } from "./BlogSEODocs";
// Convert DOCS object (keyed by tool id) to array for use with .map()/.find()/.slice()
const DOCS = Object.entries(DOCS_OBJ).map(([id, doc]) => ({ id, ...doc }));

const API = "/api/blog-seo";

/* -- Dark-theme inline styles -------------------------------------------- */
const S = {
 page: { minHeight: "100vh", background: "#09090b", color: "#fafafa", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", padding: "0 0 64px"},
 topBar: { display: "flex", alignItems: "center", gap: 12, padding: "18px 32px 0", flexWrap: "wrap"},
 title: { fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px"},
 badge: { fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: "#4f46e5", color: "#fff", marginLeft: 8 },
 body: { maxWidth: 1100, margin: "0 auto", padding: "0 24px"},
 tabs: { display: "flex", gap: 6, padding: "18px 0 12px", borderBottom: "1px solid #27272a", flexWrap: "wrap"},
 tab: (a) => ({ padding: "7px 18px", borderRadius: 8, fontSize: 13, fontWeight: a ? 600 : 500, cursor: "pointer", background: a ? "#4f46e5": "#18181b", color: a ? "#fff": "#a1a1aa", border: a ? "1px solid #4f46e5": "1px solid #27272a", transition: "all .15s"}),
 card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 20, marginBottom: 16 },
 cardTitle: { fontSize: 15, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 },
 cardDesc: { fontSize: 12, color: "#71717a", marginBottom: 10, marginTop: -6, lineHeight: 1.5 },
 row: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap"},
 input: { flex: 1, minWidth: 220, padding: "10px 14px", borderRadius: 8, border: "1px solid #3f3f46", background: "#09090b", color: "#fafafa", fontSize: 14, outline: "none"},
 textarea: { width: "100%", minHeight: 90, padding: "10px 14px", borderRadius: 8, border: "1px solid #3f3f46", background: "#09090b", color: "#fafafa", fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit"},
 btn: (v) => ({ padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", transition: "all .15s", ...(v === "primary"? { background: "#4f46e5", color: "#fff"} : v === "danger"? { background: "#7f1d1d", color: "#fca5a5"} : v === "success"? { background: "#14532d", color: "#86efac"} : { background: "#27272a", color: "#d4d4d8"}) }),
 scoreRing: (s) => ({ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: "50%", fontSize: 22, fontWeight: 800, border: `3px solid ${s >= 75 ? "#22c55e": s >= 50 ? "#eab308": "#ef4444"}`, color: s >= 75 ? "#22c55e": s >= 50 ? "#eab308": "#ef4444"}),
 grade: (g) => ({ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, borderRadius: 8, fontSize: 18, fontWeight: 800, marginLeft: 12, background: g === "A"? "#14532d": g === "B"? "#422006": g === "C"? "#713f12": "#7f1d1d", color: g === "A"? "#86efac": g === "B"? "#fbbf24": g === "C"? "#fbbf24": "#fca5a5"}),
 pill: (sev) => ({ display: "inline-block", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 999, marginRight: 6, background: sev === "high"? "#7f1d1d": sev === "medium"? "#713f12": "#1e3a5f", color: sev === "high"? "#fca5a5": sev === "medium"? "#fbbf24": "#93c5fd"}),
 metaRow: { display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 10 },
 metaLabel: { fontSize: 12, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px"},
 metaVal: { fontSize: 14, color: "#d4d4d8", marginTop: 2 },
 issueRow: { padding: "10px 14px", borderBottom: "1px solid #27272a", display: "flex", alignItems: "flex-start", gap: 10 },
 catBar: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 },
 catCard: (s) => ({ flex: "1 1 140px", background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 16px", textAlign: "center", borderTop: `3px solid ${s >= 75 ? "#22c55e": s >= 50 ? "#eab308": "#ef4444"}` }),
 catScore: (s) => ({ fontSize: 26, fontWeight: 800, color: s >= 75 ? "#22c55e": s >= 50 ? "#eab308": "#ef4444"}),
 catLabel: { fontSize: 11, fontWeight: 600, color: "#a1a1aa", textTransform: "uppercase", marginTop: 2 },
 empty: { textAlign: "center", padding: "48px 20px", color: "#71717a"},
 spinner: { display: "inline-block", width: 18, height: 18, border: "2px solid #3f3f46", borderTop: "2px solid #4f46e5", borderRadius: "50%", animation: "spin .7s linear infinite"},
 err: { background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 10, padding: "14px 18px", color: "#fca5a5", fontSize: 13, marginBottom: 12 },
 chatBubble: (isUser) => ({ maxWidth: "82%", padding: "10px 16px", borderRadius: 14, fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap", alignSelf: isUser ? "flex-end": "flex-start", background: isUser ? "#4f46e5": "#27272a", color: "#fafafa", marginBottom: 8 }),
 link: { color: "#818cf8", textDecoration: "none", cursor: "pointer", fontSize: 13 },
 table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
 th: { textAlign: "left", padding: "8px 10px", borderBottom: "1px solid #27272a", color: "#71717a", fontWeight: 600, fontSize: 11, textTransform: "uppercase"},
 td: { padding: "8px 10px", borderBottom: "1px solid #1e1e22", color: "#d4d4d8"},
 fixPanel: { background: "#1c1917", border: "1px solid #3f3f46", borderRadius: 10, padding: 16, marginTop: 10 },
 fixCode: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: 12, fontSize: 12, fontFamily: "'Fira Code',monospace", color: "#86efac", whiteSpace: "pre-wrap", overflowX: "auto", maxHeight: 220 },
 result: { background: "#18181b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 14px", marginTop: 8 },
 bulkRow: { display: "flex", gap: 8, alignItems: "center", padding: "6px 0", borderBottom: "1px solid #1e1e22"},
 section: { marginBottom: 20 },
 heading: { fontSize: 13, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 10 },
 sidebarItem: (a) => ({ padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: a ? 600 : 400, background: a ? "#1e1b4b": "transparent", color: a ? "#c4b5fd": "#a1a1aa", borderLeft: a ? "3px solid #818cf8": "3px solid transparent", marginBottom: 2, transition: "all .15s", display: "flex", alignItems: "center", gap: 10 }),
 missionCard: (a) => ({ padding: 12, borderRadius: 10, cursor: "pointer", border: a ? "1px solid #818cf8": "1px solid #27272a", background: a ? "#1e1b4b": "#18181b", transition: "all .15s"}),
 layout: { display: "flex", alignItems: "flex-start", minHeight: "calc(100vh - 72px)"},
 sidebar: { width: 220, flexShrink: 0, borderRight: "1px solid #18181b", paddingTop: 12, paddingBottom: 32, position: "sticky", top: 0, maxHeight: "100vh", overflowY: "auto"},
 sidebarSection: { fontSize: 10, fontWeight: 700, color: "#3f3f46", textTransform: "uppercase", letterSpacing: "1px", padding: "14px 14px 4px"},
 mainContent: { flex: 1, minWidth: 0, padding: "0 28px 64px", maxWidth: 1000 },
 toolGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 },
 toolCard: (color) => ({ background: "#18181b", border: `1px solid #27272a`, borderLeft: `3px solid ${color}`, borderRadius: 12, padding: "16px 18px", cursor: "pointer", transition: "all .15s", display: "flex", flexDirection: "column", gap: 6 }),
};

const TABS = ["Analyzer", "Keywords", "Content+", "Keyword+", "Technical+", "AI Create", "Schema & Links", "SERP & CTR", "Backlinks", "A/B & Refresh", "Local SEO", "E-E-A-T & Brand", "Voice & AI Search", "Content Brief", "Bulk Scan", "AI Assistant", "Shopify SEO", "AI Growth", "Rank Tracker", "Site Crawl", "GEO & LLM", "Trend Scout", "History"];
const TOOL_TAB_MAP = { analyzer:"Analyzer", "keyword-density":"Keywords", "meta-description-optimizer":"Content+", "ai-rewrite":"AI Create", "schema-generator":"Schema & Links", "bulk-scan":"Bulk Scan", "rank-tracker":"Rank Tracker", "site-crawl":"Site Crawl", "content-brief":"Content Brief", "content-decay":"A/B & Refresh", "geo-health-score":"GEO & LLM", "ai-platform-tracker":"GEO & LLM", "llms-txt-generator":"GEO & LLM", "cluster-by-intent":"Keywords", "alphabet-soup":"Keyword+", "question-explorer":"Keyword+", "algo-impact-check":"AI Growth", "content-vs-top10":"SERP & CTR", "anchor-text-audit":"Backlinks", "orphan-finder":"Schema & Links", "links-auto-inserter":"Schema & Links", "speakable-schema":"Voice & AI Search"};
const FILTER_CATS = ["all", "content", "meta", "technical", "keywords", "structure"];
const FILTER_SEVS = ["all", "high", "medium", "low"];

/* -- Dashboard sections --------------------------------------------------- */
/* level: "beginner"shows in both modes; "advanced"only in advanced mode */
const SECTIONS = [
 {
 id: "Analyze", icon: "", title: "Analyze a Post",
 desc: "Get a full SEO score for any blog post. See exactly what to fix and how.",
 color: "#4f46e5", level: "beginner",
 tabs: ["Analyzer"], tabLabels: { "Analyzer": "Analyzer"},
 },
 {
 id: "Keywords", icon: "", title: "Find Keywords",
 desc: "Discover the best keywords for your niche. Type your topic and get ideas instantly.",
 color: "#0891b2", level: "beginner",
 tabs: ["Keywords", "Keyword+"], tabLabels: { "Keywords": "Keyword Research", "Keyword+": "More Tools"},
 },
 {
 id: "Write", icon: "", title: "Write with AI",
 desc: "Let AI write a full blog post, outline or intro for you. Pick a topic, click generate.",
 color: "#059669", level: "beginner",
 tabs: ["AI Create", "Content Brief"], tabLabels: { "AI Create": "AI Generate", "Content Brief": "Content Brief"},
 },
 {
 id: "Optimize", icon: "", title: "Improve a Post",
 desc: "Get specific tips to improve any existing blog post and boost its ranking.",
 color: "#d97706", level: "beginner",
 tabs: ["Content+"], tabLabels: { "Content+": "Optimize"},
 },
 {
 id: "AI Chat", icon: "", title: "Ask AI",
 desc: "Chat with an SEO expert AI. Ask any question and get instant, tailored advice.",
 color: "#be185d", level: "beginner",
 tabs: ["AI Assistant"], tabLabels: { "AI Assistant": "Chat"},
 },
 {
 id: "Bulk Scan", icon: "", title: "Scan Multiple Posts",
 desc: "Audit all your blog posts at once to find which need the most work.",
 color: "#0f766e", level: "beginner",
 tabs: ["Bulk Scan"], tabLabels: { "Bulk Scan": "Bulk Scan"},
 },
 {
 id: "History", icon: "", title: "History",
 desc: "Browse all your past scans and revisit any previous report.",
 color: "#475569", level: "beginner",
 tabs: ["History"], tabLabels: { "History": "History"},
 },
 {
 id: "Technical", icon: "", title: "Technical SEO",
 desc: "Diagnose Core Web Vitals, crawl issues, indexing, structured data and speed problems.",
 color: "#7c3aed", level: "advanced",
 tabs: ["Technical+"], tabLabels: { "Technical+": "Technical"},
 },
 {
 id: "Schema", icon: "", title: "Schema & Links",
 desc: "Generate and validate JSON-LD schema markup. Audit redirects, hreflang and duplicate content.",
 color: "#1d4ed8", level: "advanced",
 tabs: ["Schema & Links"], tabLabels: { "Schema & Links": "Schema"},
 },
 {
 id: "SERP", icon: "", title: "SERP & CTR",
 desc: "Optimise for featured snippets, improve click-through rates, video and news SEO.",
 color: "#0e7490", level: "advanced",
 tabs: ["SERP & CTR"], tabLabels: { "SERP & CTR": "SERP"},
 },
 {
 id: "Backlinks", icon: "", title: "Backlinks",
 desc: "Find link gaps, broken backlinks, anchor text opportunities and link velocity.",
 color: "#b45309", level: "advanced",
 tabs: ["Backlinks"], tabLabels: { "Backlinks": "Backlinks"},
 },
 {
 id: "AB", icon: "", title: "A/B & Content Refresh",
 desc: "Test title and meta variants, refresh stale content and optimise for BERT.",
 color: "#374151", level: "advanced",
 tabs: ["A/B & Refresh"], tabLabels: { "A/B & Refresh": "A/B"},
 },
 {
 id: "Local", icon: "", title: "Local & E-E-A-T",
 desc: "Local SEO, author authority signals, brand mentions and E-E-A-T scoring.",
 color: "#065f46", level: "advanced",
 tabs: ["Local SEO", "E-E-A-T & Brand"], tabLabels: { "Local SEO": "Local SEO", "E-E-A-T & Brand": "E-E-A-T"},
 },
 {
 id: "Voice", icon: "", title: "Voice & AI Search",
 desc: "Optimise for voice queries, AI overviews and next-generation search engines.",
 color: "#6d28d9", level: "advanced",
 tabs: ["Voice & AI Search"], tabLabels: { "Voice & AI Search": "Voice"},
 },
 {
 id: "AIGrowth", icon: "", title: "AI Growth Tools",
 desc: "Content calendar, pillar pages, programmatic SEO, ROI estimator, competitor audits and semantic clusters.",
 color: "#0f766e", level: "advanced",
 tabs: ["AI Growth"], tabLabels: { "AI Growth": "AI Growth"},
 },
 {
 id: "RankTracker", icon: "", title: "Rank Tracker",
 desc: "Track keyword positions, GSC data import, bulk checks, AI forecasts and competitor comparisons.",
 color: "#1d4ed8", level: "advanced",
 tabs: ["Rank Tracker"], tabLabels: { "Rank Tracker": "Rank Tracker"},
 },
 {
 id: "SiteCrawl", icon: "", title: "Site Crawl",
 desc: "Full BFS site crawler detecting broken links, missing tags, orphan pages, duplicates and snapshot diffs.",
 color: "#7c3aed", level: "advanced",
 tabs: ["Site Crawl"], tabLabels: { "Site Crawl": "Site Crawl"},
 },
 {
 id: "GeoLLM", icon: "", title: "GEO & LLM Search",
 desc: "Generative Engine Optimisation AI health scores, prompt simulation, citation gap, llms.txt generator.",
 color: "#dc2626", level: "advanced",
 tabs: ["GEO & LLM"], tabLabels: { "GEO & LLM": "GEO & LLM"},
 },
 {
 id: "TrendScout", icon: "", title: "Trend Scout",
 desc: "Rising topics, seasonal planner, micro-niche finder, keyword surge detector and competitor velocity.",
 color: "#d97706", level: "advanced",
 tabs: ["Trend Scout"], tabLabels: { "Trend Scout": "Trend Scout"},
 },
];

export default function BlogSEO() {
 const [tab, setTab] = useState("Analyzer");
 const [section, setSection] = useState(null); // null = home dashboard
 const [simpleMode, setSimpleMode] = useState(true); // beginner vs expert
 const [simpleFlow, setSimpleFlow] = useState(null); // 'fix'| 'write'| null
 const [simpleTopics, setSimpleTopics] = useState(null); // AI topic suggestions
 const [simpleTopicsLoading, setSimpleTopicsLoading] = useState(false);
 const [simpleDraftLoading, setSimpleDraftLoading] = useState(false); // full post generation in simple mode
 const [simpleDraftResult, setSimpleDraftResult] = useState(null);
 const [simpleInjectLoading, setSimpleInjectLoading] = useState(false);
 const [simpleInjectResult, setSimpleInjectResult] = useState(null); // { ok, articleUrl } | { ok:false, error }

 /* -- Toast notification state -- */
 const [errToast, setErrToast] = useState(null);
 const toastTimerRef = useRef(null);
 const showToast = useCallback((msg) => {
 setErrToast(msg);
 if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
 toastTimerRef.current = setTimeout(() => setErrToast(null), 4500);
 }, []);

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
 const [aiAnalysisErr, setAiAnalysisErr] = useState(null);
 const [fixErr, setFixErr] = useState({});
 const [autoScanPending, setAutoScanPending] = useState(false);
 const [rewriteLoading, setRewriteLoading] = useState(false);
 const [rewriteField, setRewriteField] = useState(null);
 const [rewriteResult, setRewriteResult] = useState(null);
 const [rewriteErr, setRewriteErr] = useState(null);
 const [applyResult, setApplyResult] = useState({}); // tracks apply-to-shopify state per rewrite variant index
 // IDs of the article that was most recently scanned used by applyRewrite so it never relies on stale selectedArticleId
 const [scannedArticleId, setScannedArticleId] = useState(null);
 const [scannedBlogId, setScannedBlogId] = useState(null);
 // Fields that have been successfully applied to Shopify used to auto-dismiss matching issue cards
 const [fixedFields, setFixedFields] = useState(new Set());
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
 const [schemaGenErr, setSchemaGenErr] = useState("");
 const [generatedSchema, setGeneratedSchema] = useState(null);
 const [schemaImpl, setSchemaImpl] = useState({}); // tracks implement-to-shopify state per schema key
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

 const [compUrls, setCompUrls] = useState("");

 const [cannibUrls, setCannibUrls] = useState("");
 const [cannibResult, setCannibResult] = useState(null);
 const [cannibLoading, setCannibLoading] = useState(false);

 const [tocResult, setTocResult] = useState(null);
 const [tocLoading, setTocLoading] = useState(false);

 const [sectionWcResult, setSectionWcResult] = useState(null);
 const [sectionWcLoading, setSectionWcLoading] = useState(false);


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

 /* -- Technical+ batch 2 state -- */
 const [jsRenderResult, setJsRenderResult] = useState(null); const [jsRenderLoading, setJsRenderLoading] = useState(false); const [jsRenderErr, setJsRenderErr] = useState('');
 const [searchPreviewResult, setSearchPreviewResult] = useState(null); const [searchPreviewLoading, setSearchPreviewLoading] = useState(false); const [spTitle, setSpTitle] = useState(''); const [spDesc, setSpDesc] = useState('');
 const [lcpResult, setLcpResult] = useState(null); const [lcpLoading, setLcpLoading] = useState(false); const [lcpErr, setLcpErr] = useState('');
 const [negSeoResult, setNegSeoResult] = useState(null); const [negSeoLoading, setNegSeoLoading] = useState(false); const [negSeoDomain, setNegSeoDomain] = useState('');
 const [fontAuditResult, setFontAuditResult] = useState(null); const [fontAuditLoading, setFontAuditLoading] = useState(false);
 const [ampResult, setAmpResult] = useState(null); const [ampLoading, setAmpLoading] = useState(false);
 const [pwaResult, setPwaResult] = useState(null); const [pwaLoading, setPwaLoading] = useState(false); const [pwaDomain, setPwaDomain] = useState('');
 const [botBlockerResult, setBotBlockerResult] = useState(null); const [botBlockerLoading, setBotBlockerLoading] = useState(false); const [botStrategy, setBotStrategy] = useState('balanced');
 const [siteArchResult, setSiteArchResult] = useState(null); const [siteArchLoading, setSiteArchLoading] = useState(false); const [siteArchUrls, setSiteArchUrls] = useState('');
 const [logAnalyseResult, setLogAnalyseResult] = useState(null); const [logAnalyseLoading, setLogAnalyseLoading] = useState(false); const [logSampleInput, setLogSampleInput] = useState('');
 /* -- Content+ batch state -- */
 const [helpfulContentResult, setHelpfulContentResult] = useState(null); const [helpfulContentLoading, setHelpfulContentLoading] = useState(false); const [helpfulContentText, setHelpfulContentText] = useState('');
 const [decayResult, setDecayResult] = useState(null); const [decayLoading, setDecayLoading] = useState(false);
 const [pageExpResult, setPageExpResult] = useState(null); const [pageExpLoading, setPageExpLoading] = useState(false);
 /* -- Schema & Links batch state -- */
 const [linkOppResult, setLinkOppResult] = useState(null); const [linkOppLoading, setLinkOppLoading] = useState(false); const [linkOppSource, setLinkOppSource] = useState('');
 const [anchorResult, setAnchorResult] = useState(null); const [anchorLoading, setAnchorLoading] = useState(false);
 /* -- Shopify SEO batch 2 state -- */
 const [tagTaxResult, setTagTaxResult] = useState(null); const [tagTaxLoading, setTagTaxLoading] = useState(false); const [tagList, setTagList] = useState('');
 const [blogLinksResult, setBlogLinksResult] = useState(null); const [blogLinksLoading, setBlogLinksLoading] = useState(false); const [blogLinksHandle, setBlogLinksHandle] = useState('news');
 const [imgCompResult, setImgCompResult] = useState(null); const [imgCompLoading, setImgCompLoading] = useState(false);
 const [dupProdResult, setDupProdResult] = useState(null); const [dupProdLoading, setDupProdLoading] = useState(false);
 const [bcSchemaResult, setBcSchemaResult] = useState(null); const [bcSchemaLoading, setBcSchemaLoading] = useState(false);
 const [revSchemaResult, setRevSchemaResult] = useState(null); const [revSchemaLoading, setRevSchemaLoading] = useState(false);
 const [shopIntlResult, setShopIntlResult] = useState(null); const [shopIntlLoading, setShopIntlLoading] = useState(false); const [shopIntlMarkets, setShopIntlMarkets] = useState('');
 const [collKwResult, setCollKwResult] = useState(null); const [collKwLoading, setCollKwLoading] = useState(false); const [collTitle, setCollTitle] = useState(''); const [collDesc, setCollDesc] = useState('');
 const [themeResult, setThemeResult] = useState(null); const [themeLoading, setThemeLoading] = useState(false); const [themeName, setThemeName] = useState('Dawn');
 const [speedResult, setSpeedResult] = useState(null); const [speedLoading, setSpeedLoading] = useState(false); const [speedDomain, setSpeedDomain] = useState('');

 /* -- Batch 3 state vars -- */
 // AI Create
 const [atomizeResult, setAtomizeResult] = useState(null); const [atomizeLoading, setAtomizeLoading] = useState(false); const [atomizeInput, setAtomizeInput] = useState('');
 const [caseStudyResult, setCaseStudyResult] = useState(null); const [caseStudyLoading, setCaseStudyLoading] = useState(false); const [caseStudyTopic, setCaseStudyTopic] = useState('');
 const [humanizerResult, setHumanizerResult] = useState(null); const [humanizerLoading, setHumanizerLoading] = useState(false); const [humanizerText, setHumanizerText] = useState('');
 const [fullBlogResult, setFullBlogResult] = useState(null); const [fullBlogLoading, setFullBlogLoading] = useState(false); const [fullBlogTopic, setFullBlogTopic] = useState('');
 const [linkedinResult, setLinkedinResult] = useState(null); const [linkedinLoading, setLinkedinLoading] = useState(false); const [linkedinTopic, setLinkedinTopic] = useState('');
 const [listicleResult, setListicleResult] = useState(null); const [listicleLoading, setListicleLoading] = useState(false); const [listicleTopic, setListicleTopic] = useState('');
 const [newsletterResult, setNewsletterResult] = useState(null); const [newsletterLoading, setNewsletterLoading] = useState(false); const [newsletterTopic, setNewsletterTopic] = useState('');
 const [xThreadResult, setXThreadResult] = useState(null); const [xThreadLoading, setXThreadLoading] = useState(false); const [xThreadTopic, setXThreadTopic] = useState('');
 const [videoSchemaResult, setVideoSchemaResult] = useState(null); const [videoSchemaLoading, setVideoSchemaLoading] = useState(false); const [videoSchemaUrl, setVideoSchemaUrl] = useState('');
 const [ytResult, setYtResult] = useState(null); const [ytLoading, setYtLoading] = useState(false); const [ytVideoUrl, setYtVideoUrl] = useState('');
 // Backlinks
 const [prPitchResult, setPrPitchResult] = useState(null); const [prPitchLoading, setPrPitchLoading] = useState(false); const [prPitchTopic, setPrPitchTopic] = useState('');
 const [expertQAResult, setExpertQAResult] = useState(null); const [expertQALoading, setExpertQALoading] = useState(false); const [expertQATopic, setExpertQATopic] = useState('');
 const [guestPostResult, setGuestPostResult] = useState(null); const [guestPostLoading, setGuestPostLoading] = useState(false); const [guestPostNiche, setGuestPostNiche] = useState('');
 const [resourcePageResult, setResourcePageResult] = useState(null); const [resourcePageLoading, setResourcePageLoading] = useState(false); const [resourcePageTopic, setResourcePageTopic] = useState('');
 const [skyscraperResult, setSkyscraperResult] = useState(null); const [skyscraperLoading, setSkyscraperLoading] = useState(false); const [skyscraperUrl, setSkyscraperUrl] = useState(''); const [skyscraperKeyword, setSkyscraperKeyword] = useState('');
 const [activeMission, setActiveMission] = useState(null);
 const [missionStep, setMissionStep] = useState(0);
 const [seenWelcome, setSeenWelcome] = useState(() => { try { return !!localStorage.getItem('blogseo_seen_welcome'); } catch { return false; } });
 const [helpTopic, setHelpTopic] = useState(null);
 const [helpOpen, setHelpOpen] = useState(false);
 // Site Crawl
 const [crawlDupResult, setCrawlDupResult] = useState(null); const [crawlDupLoading, setCrawlDupLoading] = useState(false);
 const [crawlExportLoading, setCrawlExportLoading] = useState(false);
 // GEO & LLM
 const [brandSentimentResult, setBrandSentimentResult] = useState(null); const [brandSentimentLoading, setBrandSentimentLoading] = useState(false); const [brandSentimentQuery, setBrandSentimentQuery] = useState('');
 const [citationGapResult, setCitationGapResult] = useState(null); const [citationGapLoading, setCitationGapLoading] = useState(false);
 const [citationContentResult, setCitationContentResult] = useState(null); const [citationContentLoading, setCitationContentLoading] = useState(false); const [citationContentTopic, setCitationContentTopic] = useState('');
 const [faqLlmResult, setFaqLlmResult] = useState(null); const [faqLlmLoading, setFaqLlmLoading] = useState(false); const [faqLlmUrl, setFaqLlmUrl] = useState('');
 const [llmVisAuditResult, setLlmVisAuditResult] = useState(null); const [llmVisAuditLoading, setLlmVisAuditLoading] = useState(false);
 const [mentionGapResult, setMentionGapResult] = useState(null); const [mentionGapLoading, setMentionGapLoading] = useState(false);
 const [nosnippetResult, setNosnippetResult] = useState(null); const [nosnippetLoading, setNosnippetLoading] = useState(false);
 // Keywords
 const [serpClusterResult, setSerpClusterResult] = useState(null); const [serpClusterLoading, setSerpClusterLoading] = useState(false); const [serpClusterKw, setSerpClusterKw] = useState('');
 const [intentMatrixResult, setIntentMatrixResult] = useState(null); const [intentMatrixLoading, setIntentMatrixLoading] = useState(false); const [intentMatrixKws, setIntentMatrixKws] = useState('');
 const [kwMappingResult, setKwMappingResult] = useState(null); const [kwMappingLoading, setKwMappingLoading] = useState(false);
 const [kgrResult, setKgrResult] = useState(null); const [kgrLoading, setKgrLoading] = useState(false); const [kgrKw, setKgrKw] = useState(''); const [kgrSearchVol, setKgrSearchVol] = useState(''); const [kgrAllInTitle, setKgrAllInTitle] = useState('');
 const [sovResult, setSovResult] = useState(null); const [sovLoading, setSovLoading] = useState(false); const [sovKeywords, setSovKeywords] = useState('');
 // Rank Tracker
 const [cannibLiveResult, setCannibLiveResult] = useState(null); const [cannibLiveLoading, setCannibLiveLoading] = useState(false);
 const [compCompareResult, setCompCompareResult] = useState(null); const [compCompareLoading, setCompCompareLoading] = useState(false); const [compCompareUrl, setCompCompareUrl] = useState('');
 const [deviceSplitResult, setDeviceSplitResult] = useState(null); const [deviceSplitLoading, setDeviceSplitLoading] = useState(false);
 const [kwVelocityResult, setKwVelocityResult] = useState(null); const [kwVelocityLoading, setKwVelocityLoading] = useState(false);
 const [posAlertResult, setPosAlertResult] = useState(null); const [posAlertLoading, setPosAlertLoading] = useState(false); const [posAlertKw, setPosAlertKw] = useState(''); const [posAlertThreshold, setPosAlertThreshold] = useState('10');
 const [yoyResult, setYoyResult] = useState(null); const [yoyLoading, setYoyLoading] = useState(false);
 // --- newly wired routes ---
 const [rankHistoryResult, setRankHistoryResult] = useState(null); const [rankHistoryLoading, setRankHistoryLoading] = useState(false); const [rankHistoryKwId, setRankHistoryKwId] = useState('');
 const [rossResult, setRossResult] = useState(null); const [rossLoading, setRossLoading] = useState(false);
 const [metadataAnResult, setMetadataAnResult] = useState(null); const [metadataAnLoading, setMetadataAnLoading] = useState(false);
 const [researchScoreResult, setResearchScoreResult] = useState(null); const [researchScoreLoading, setResearchScoreLoading] = useState(false); const [researchScoreKw, setResearchScoreKw] = useState('');
 const [vpSaveResult, setVpSaveResult] = useState(null); const [vpSaveLoading, setVpSaveLoading] = useState(false);
 const [vpLoadId, setVpLoadId] = useState(''); const [vpLoadResult, setVpLoadResult] = useState(null); const [vpLoadLoading, setVpLoadLoading] = useState(false);
 const [kwAlphabetResult, setKwAlphabetResult] = useState(null); const [kwAlphabetLoading, setKwAlphabetLoading] = useState(false); const [kwAlphabetSeed, setKwAlphabetSeed] = useState('');
 const [kwEvalResult, setKwEvalResult] = useState(null); const [kwEvalLoading, setKwEvalLoading] = useState(false); const [kwEvalKeywords, setKwEvalKeywords] = useState('');
 const [kwQuestResult, setKwQuestResult] = useState(null); const [kwQuestLoading, setKwQuestLoading] = useState(false); const [kwQuestTopic, setKwQuestTopic] = useState('');
 const [carouselResult, setCarouselResult] = useState(null); const [carouselLoading, setCarouselLoading] = useState(false); const [carouselItems, setCarouselItems] = useState('');
 const [contentVsResult, setContentVsResult] = useState(null); const [contentVsLoading, setContentVsLoading] = useState(false); const [contentVsKw, setContentVsKw] = useState('');
 const [serpPreviewApiResult, setSerpPreviewApiResult] = useState(null); const [serpPreviewApiLoading, setSerpPreviewApiLoading] = useState(false);
 const [algoImpactResult, setAlgoImpactResult] = useState(null); const [algoImpactLoading, setAlgoImpactLoading] = useState(false);
 const [crawlCompResult, setCrawlCompResult] = useState(null); const [crawlCompLoading, setCrawlCompLoading] = useState(false);
 const [addAlertResult, setAddAlertResult] = useState(null); const [addAlertLoading, setAddAlertLoading] = useState(false); const [alertKw, setAlertKw] = useState(''); const [alertThreshold, setAlertThreshold] = useState('10');
 const [alertsResult, setAlertsResult] = useState(null); const [alertsLoading, setAlertsLoading] = useState(false);
 // Schema & Links
 const [datasetSchemaResult, setDatasetSchemaResult] = useState(null); const [datasetSchemaLoading, setDatasetSchemaLoading] = useState(false); const [datasetTitle, setDatasetTitle] = useState('');
 const [factCheckResult, setFactCheckResult] = useState(null); const [factCheckLoading, setFactCheckLoading] = useState(false); const [factCheckClaim, setFactCheckClaim] = useState('');
 const [podcastSchemaResult, setPodcastSchemaResult] = useState(null); const [podcastSchemaLoading, setPodcastSchemaLoading] = useState(false); const [podcastTitle, setPodcastTitle] = useState('');
 // SERP & CTR
 const [intentEvolResult, setIntentEvolResult] = useState(null); const [intentEvolLoading, setIntentEvolLoading] = useState(false); const [intentEvolKw, setIntentEvolKw] = useState('');
 const [splitSigResult, setSplitSigResult] = useState(null); const [splitSigLoading, setSplitSigLoading] = useState(false);
 const [top10Result, setTop10Result] = useState(null); const [top10Loading, setTop10Loading] = useState(false); const [top10Kw, setTop10Kw] = useState('');
 const [volatilityResult, setVolatilityResult] = useState(null); const [volatilityLoading, setVolatilityLoading] = useState(false);
 const [featSnipResult, setFeatSnipResult] = useState(null); const [featSnipLoading, setFeatSnipLoading] = useState(false); const [featSnipUrl, setFeatSnipUrl] = useState('');
 const [knowledgePanelResult, setKnowledgePanelResult] = useState(null); const [knowledgePanelLoading, setKnowledgePanelLoading] = useState(false);
 const [paaResult, setPaaResult] = useState(null); const [paaLoading, setPaaLoading] = useState(false); const [paaKw, setPaaKw] = useState('');
 // Shopify SEO batch 3
 const [blogTmplAuditResult, setBlogTmplAuditResult] = useState(null); const [blogTmplAuditLoading, setBlogTmplAuditLoading] = useState(false);
 const [collSeoResult, setCollSeoResult] = useState(null); const [collSeoLoading, setCollSeoLoading] = useState(false); const [collSeoHandle, setCollSeoHandle] = useState('');
 const [collSeoAuditResult, setCollSeoAuditResult] = useState(null); const [collSeoAuditLoading, setCollSeoAuditLoading] = useState(false);
 const [hreflangGenResult, setHreflangGenResult] = useState(null); const [hreflangGenLoading, setHreflangGenLoading] = useState(false); const [hreflangLocales, setHreflangLocales] = useState('');
 const [metafieldSeoResult, setMetafieldSeoResult] = useState(null); const [metafieldSeoLoading, setMetafieldSeoLoading] = useState(false);
 const [prodBlogLinksResult, setProdBlogLinksResult] = useState(null); const [prodBlogLinksLoading, setProdBlogLinksLoading] = useState(false);
 const [prodSchemaBulkResult, setProdSchemaBulkResult] = useState(null); const [prodSchemaBulkLoading, setProdSchemaBulkLoading] = useState(false);
 const [sitemapEnhResult, setSitemapEnhResult] = useState(null); const [sitemapEnhLoading, setSitemapEnhLoading] = useState(false);
 // Technical+ batch 3
 const [robotsTxtResult, setRobotsTxtResult] = useState(null); const [robotsTxtLoading, setRobotsTxtLoading] = useState(false);
 const [indexNowResult, setIndexNowResult] = useState(null); const [indexNowLoading, setIndexNowLoading] = useState(false); const [indexNowUrls, setIndexNowUrls] = useState('');
 const [inpResult, setInpResult] = useState(null); const [inpLoading, setInpLoading] = useState(false);
 const [mcpSchemaResult, setMcpSchemaResult] = useState(null); const [mcpSchemaLoading, setMcpSchemaLoading] = useState(false);
 const [paginationResult, setPaginationResult] = useState(null); const [paginationLoading, setPaginationLoading] = useState(false);
 const [redirectChainResult, setRedirectChainResult] = useState(null); const [redirectChainLoading, setRedirectChainLoading] = useState(false); const [redirectChainUrl, setRedirectChainUrl] = useState('');
 const [secHeadersResult, setSecHeadersResult] = useState(null); const [secHeadersLoading, setSecHeadersLoading] = useState(false);
 // Trend Scout
 const [compVelocityResult, setCompVelocityResult] = useState(null); const [compVelocityLoading, setCompVelocityLoading] = useState(false); const [compVelocityCompetitor, setCompVelocityCompetitor] = useState('');
 const [firstMoverResult, setFirstMoverResult] = useState(null); const [firstMoverLoading, setFirstMoverLoading] = useState(false); const [firstMoverTopic, setFirstMoverTopic] = useState('');
 const [investSignalResult, setInvestSignalResult] = useState(null); const [investSignalLoading, setInvestSignalLoading] = useState(false);
 const [newsjackResult, setNewsjackResult] = useState(null); const [newsjackLoading, setNewsjackLoading] = useState(false); const [newsjackTopic, setNewsjackTopic] = useState('');
 const [trendRptResult, setTrendRptResult] = useState(null); const [trendRptLoading, setTrendRptLoading] = useState(false); const [trendRptNiche, setTrendRptNiche] = useState('');
 // Misc
 const [pdfReportResult, setPdfReportResult] = useState(null); const [pdfReportLoading, setPdfReportLoading] = useState(false);
 const [contentApprovalResult, setContentApprovalResult] = useState(null); const [contentApprovalLoading, setContentApprovalLoading] = useState(false); const [approvalTitle, setApprovalTitle] = useState(''); const [approvalContent, setApprovalContent] = useState('');
 const [voiceProfileResult, setVoiceProfileResult] = useState(null); const [voiceProfileLoading, setVoiceProfileLoading] = useState(false);
 // Shared state for uncovered route cards
 const [xRes, setXRes] = useState({}); const [xLoad, setXLoad] = useState({});
 const [competitorInput, setCompetitorInput] = useState(''); const [publishDate, setPublishDate] = useState('');
 const [titleInput, setTitleInput] = useState(''); const [descInput, setDescInput] = useState('');
 const [variantA, setVariantA] = useState(''); const [variantB, setVariantB] = useState('');
 const [entityNameInput, setEntityNameInput] = useState(''); const [personNameInput, setPersonNameInput] = useState('');
 const [localLocation, setLocalLocation] = useState(''); const [authorName, setAuthorName] = useState(''); const [authorExpertise, setAuthorExpertise] = useState('');
 const [contentLengthNum, setContentLengthNum] = useState('1000'); const [bulkUrlsText, setBulkUrlsText] = useState('');
 const [rankIdInput, setRankIdInput] = useState('');

 /* -- Missing state declarations -- */
 const [sidebarOpen, setSidebarOpen] = useState(false);
 const [addAlertKw, setAddAlertKw] = useState('');
 const [addAlertThreshold, setAddAlertThreshold] = useState('10');
 const [cmdOpen, setCmdOpen] = useState(false);
 const [cmdQuery, setCmdQuery] = useState('');
 const [cmdIdx, setCmdIdx] = useState(0);
 const [wizardStep, setWizardStep] = useState(0);
 const [podcastSchemaTitle, setPodcastSchemaTitle] = useState('');
 const [datasetSchemaTitle, setDatasetSchemaTitle] = useState('');
 const [hreflangGenLocales, setHreflangGenLocales] = useState('');
 const [contentApprovalTitle, setContentApprovalTitle] = useState('');
 const [contentApprovalContent, setContentApprovalContent] = useState('');

 /* -- ANALYZER ----------------------------------------------------------- */
 const runScan = useCallback(async () => {
 if (!url.trim()) return;
 setScanning(true); setScanErr(""); setScanResult(null); setAiAnalysis(null);
 setRewriteResult(null); setRewriteErr(null); setFixes({}); setExpandedIssue(null);
 setScannedArticleId(null); setScannedBlogId(null); setFixedFields(new Set()); setApplyResult({});
 try {
 const selectedArt = selectedArticleId ? shopifyArticles.find(a => String(a.id) === String(selectedArticleId)) : null;
 const analyzeBody = { url: url.trim(), keywords: kwInput.trim(), ...(selectedArt ? { articleId: selectedArt.id, blogId: selectedArt.blogId } : {}) };
 const r = await apiFetchJSON(`${API}/analyze`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify(analyzeBody) });
 if (!r.ok) throw new Error(r.error || "Scan failed");
 setScanResult(r);
 // Store the article IDs for apply operations use selectedArt if available, otherwise
 // try to match by URL against loaded articles
 if (selectedArt) {
 setScannedArticleId(selectedArt.id);
 setScannedBlogId(selectedArt.blogId);
 } else if (shopifyArticles.length > 0) {
 const matched = shopifyArticles.find(a => a.url && r.url && (r.url.includes(a.handle) || a.url === r.url));
 if (matched) { setScannedArticleId(matched.id); setScannedBlogId(matched.blogId); }
 }
 // Save to history
 try { await apiFetch(`${API}/items`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ type: "scan", url: r.url, title: r.title, score: r.scored?.overall, grade: r.scored?.grade, issueCount: r.scored?.issueCount }) }); } catch(e) { showToast(e.message || "An error occurred"); }
 } catch (e) { setScanErr(e.message); }
 setScanning(false);
 }, [url, kwInput, selectedArticleId, shopifyArticles]);

 const generateFix = useCallback(async (issue) => {
 const k = issue.msg;
 setFixLoading(k); setFixErr(p => ({ ...p, [k]: null }));
 try {
 const r = await apiFetchJSON(`${API}/ai/fix-code`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ issue: issue.msg, url: scanResult?.url, pageContext: { title: scanResult?.title, h1: scanResult?.h1, wordCount: scanResult?.wordCount } }) });
 if (r.ok) setFixes(p => ({ ...p, [k]: r.fix }));
 else setFixErr(p => ({ ...p, [k]: r.error || 'Failed to generate fix'}));
 } catch (e) { setFixErr(p => ({ ...p, [k]: e.message || 'Network error'})); }
 setFixLoading(null);
 }, [scanResult]);

 const runAiAnalysis = useCallback(async () => {
 if (!scanResult) return;
 setAiAnalyzing(true); setAiAnalysisErr(null);
 try {
 const r = await apiFetchJSON(`${API}/ai/analyze`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url, title: scanResult.title, metaDescription: scanResult.metaDescription, h1: scanResult.h1, wordCount: scanResult.wordCount, headings: scanResult.headings, keywords: kwInput, scored: scanResult.scored }) });
 if (r.ok) {
 const parsed = r.structured || (r.analysis ? (() => { try { return JSON.parse(r.analysis); } catch { return null; } })() : null);
 if (parsed) setAiAnalysis(parsed);
 else setAiAnalysisErr('AI returned an unexpected format. Please try again.');
 } else {
 setAiAnalysisErr(r.error || (r.credit_error ? `Not enough credits (need ${r.credits_needed}, have ${r.credits_available})` : 'Analysis failed. Please try again.'));
 }
 } catch (e) { setAiAnalysisErr(e.message || 'Network error please try again.'); }
 setAiAnalyzing(false);
 }, [scanResult, kwInput]);

 const generateSchema = useCallback(async () => {
 if (!scanResult) return;
 setSchemaGenLoading(true); setGeneratedSchema(null); setSchemaGenErr("");
 try {
 const r = await apiFetchJSON(`${API}/schema/generate`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({
 url: scanResult.url, title: scanResult.title, metaDescription: scanResult.metaDescription,
 h1: scanResult.h1, datePublished: scanResult.datePublished, dateModified: scanResult.dateModified,
 authorName: schemaAuthorName || scanResult.authorMeta || undefined,
 publisherName: schemaPublisherName || undefined,
 imageUrl: scanResult.ogImage || undefined,
 keywords: kwInput ? kwInput.split(",").map(s => s.trim()) : undefined,
 }) });
 if (r.ok) setGeneratedSchema(r);
 else setSchemaGenErr(r.error || "Schema generation failed. Please try again.");
 } catch (e) { setSchemaGenErr(e.message || "Network error please try again."); }
 setSchemaGenLoading(false);
 }, [scanResult, schemaAuthorName, schemaPublisherName, kwInput]);

 const implementSchema = useCallback(async (scriptTag, key) => {
 // Use IDs captured at scan time avoids stale closure on selectedArticleId
 const articleId = scannedArticleId;
 const blogId = scannedBlogId;
 if (!articleId || !blogId) {
 setSchemaImpl(p => ({ ...p, [key]: 'error: Select and rescan a post first to link it'}));
 return;
 }
 setSchemaImpl(p => ({ ...p, [key]: 'loading'}));
 try {
 const r = await apiFetchJSON(`${API}/implement-schema`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json'},
 body: JSON.stringify({ articleId, blogId, scriptTag, shop: shopDomain }),
 });
 setSchemaImpl(p => ({ ...p, [key]: r.ok ? 'ok': `error: ${r.error || 'Unknown error'}` }));
 } catch (e) {
 setSchemaImpl(p => ({ ...p, [key]: `error: ${e.message}` }));
 }
 }, [scannedArticleId, scannedBlogId, shopDomain]);

 const applyRewrite = useCallback(async (value, field, idx) => {
 // Use IDs captured at scan time avoids stale closure bugs on selectedArticleId
 const articleId = scannedArticleId;
 const blogId = scannedBlogId;
 if (!articleId || !blogId) {
 setApplyResult(p => ({ ...p, [idx]: 'error: No article linked select your post from the dropdown and rescan'}));
 return;
 }
 setApplyResult(p => ({ ...p, [idx]: 'loading'}));
 try {
 const r = await apiFetchJSON(`${API}/apply-field`, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json'},
 body: JSON.stringify({ articleId, blogId, field, value, shop: shopDomain }),
 });
 if (r.ok) {
 if (field === 'headings') {
 // Mirror applied H2s into scanResult so heading count and issue cards update immediately
 const newH2s = value.split(/\s*\|\s*/).filter(Boolean).map(t => ({ tag: 'H2', text: t.trim() }));
 setScanResult(prev => {
 if (!prev) return prev;
 const existing = (prev.headings || []).filter(h => h.tag !== 'H2');
 const updated = [...existing, ...newH2s];
 // Rebuild scored.issues to remove the h2/subheading issue now it's fixed
 const updatedIssues = (prev.scored?.issues || []).filter(i => {
 const m = i.msg.toLowerCase();
 return !((m.includes('h2') || m.includes('subheading') || m.includes('subhead')) &&
 (m.includes('no ') || m.includes('missing') || m.includes('lack') || m.includes('needs') || m.includes('structure') || m.includes('clear')));
 });
 return { ...prev, headings: updated, scored: prev.scored ? { ...prev.scored, issues: updatedIssues } : prev.scored };
 });
 } else {
 // Mirror scalar field changes locally (title, metaDescription, handle, h1)
 setScanResult(prev => prev ? { ...prev, [field]: r.handle || value } : prev);
 // Remove matching issues from scored.issues so the fix cards disappear immediately
 setScanResult(prev => {
 if (!prev?.scored?.issues) return prev;
 const updatedIssues = prev.scored.issues.filter(i => !isIssueForField(field, i.msg));
 return { ...prev, scored: { ...prev.scored, issues: updatedIssues } };
 });
 }
 // Track which fields have been fixed (for any remaining derived issue displays)
 setFixedFields(prev => new Set([...prev, field]));
 }
 setApplyResult(p => ({ ...p, [idx]: r.ok ? 'ok': `error: ${r.error || 'Shopify update failed check permissions'}` }));
 } catch (e) {
 setApplyResult(p => ({ ...p, [idx]: `error: ${e.message}` }));
 }
 }, [scannedArticleId, scannedBlogId, shopDomain]);

 // Helper: renders Copy + Add-to-Post buttons for any schema output
 const schemaActions = (scriptTag, key) => (
 <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }}>
 <button style={{ ...S.btn('ghost'), fontSize: 11, padding: '3px 10px'}}
 onClick={() => navigator.clipboard.writeText(scriptTag || '')}> Copy</button>
 {scannedArticleId
 ? <button
 style={{ ...S.btn(schemaImpl[key] === 'ok'? undefined : 'primary'), fontSize: 11, padding: '3px 10px'}}
 disabled={schemaImpl[key] === 'loading'}
 onClick={() => implementSchema(scriptTag, key)}>
 {schemaImpl[key] === 'loading'? <><span style={S.spinner}/> Adding</>
 : schemaImpl[key] === 'ok'? 'Added to Post!': 'Add to Post'}
 </button>
 : <span style={{ fontSize: 11, color: '#52525b', fontStyle: 'italic'}}> Scan a post first to add directly</span>}
 {typeof schemaImpl[key] === 'string'&& schemaImpl[key].startsWith('error:') && (
 <span style={{ fontSize: 11, color: '#f87171'}}>{schemaImpl[key].slice(7)}</span>
 )}
 </div>
 );

 const checkBrokenLinks = useCallback(async () => {
 if (!scanResult) return;
 setBrokenLinksLoading(true); setBrokenLinksErr(""); setBrokenLinksResult(null);
 try {
 const r = await apiFetchJSON(`${API}/links/check`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) });
 if (!r.ok) throw new Error(r.error || "Link check failed");
 setBrokenLinksResult(r);
 } catch (e) { setBrokenLinksErr(e.message); }
 setBrokenLinksLoading(false);
 }, [scanResult]);

 const generateFaqSchema = useCallback(async (useAI = false) => {
 if (!scanResult?.questionHeadings?.length) return;
 setFaqSchemaLoading(true); setFaqSchemaResult(null);
 try {
 const r = await apiFetchJSON(`${API}/faq-schema/generate`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ questionHeadings: scanResult.questionHeadings, useAI, url: scanResult.url }) });
 if (r.ok) setFaqSchemaResult(r);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setFaqSchemaLoading(false);
 }, [scanResult]);

 const runLsiKeywords = useCallback(async () => {
 if (!seedKw.trim()) return;
 setLsiLoading(true); setLsiErr(""); setLsiResult(null);
 try {
 const r = await apiFetchJSON(`${API}/keywords/lsi`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ keyword: seedKw.trim(), niche: kwNiche.trim() || undefined }) });
 if (!r.ok) throw new Error(r.error || "Failed");
 setLsiResult(r);
 } catch (e) { setLsiErr(e.message); }
 setLsiLoading(false);
 }, [seedKw, kwNiche]);

 const runLlmScore = useCallback(async () => {
 if (!scanResult?.url) return;
 setLlmLoading(true); setLlmErr(""); setLlmScore(null);
 try {
 const r = await apiFetchJSON(`${API}/llm/score`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) });
 if (!r.ok) throw new Error(r.error || "LLM score failed");
 setLlmScore(r);
 } catch (e) { setLlmErr(e.message); }
 setLlmLoading(false);
 }, [scanResult]);

 const runTechAudit = useCallback(async () => {
 if (!scanResult?.url) return;
 setTechAuditLoading(true); setTechAuditErr(""); setTechAudit(null);
 try {
 const r = await apiFetchJSON(`${API}/technical/audit`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) });
 if (!r.ok) throw new Error(r.error || "Audit failed");
 setTechAudit(r);
 } catch (e) { setTechAuditErr(e.message); }
 setTechAuditLoading(false);
 }, [scanResult]);

 const runCtrSignals = useCallback(async () => {
 if (!scanResult?.title) return;
 setCtrLoading(true); setCtrSignals(null);
 try {
 const r = await apiFetchJSON(`${API}/title/ctr-signals`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ title: scanResult.title, keyword: kwInput.trim() }) });
 if (r.ok) setCtrSignals(r);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setCtrLoading(false);
 }, [scanResult, kwInput]);

 const runSchemaValidate = useCallback(async () => {
 if (!scanResult?.url) return;
 setSchemaValidLoading(true); setSchemaValidErr(""); setSchemaValid(null);
 try {
 const r = await apiFetchJSON(`${API}/article-schema/validate`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) });
 if (!r.ok) throw new Error(r.error || "Validation failed");
 setSchemaValid(r);
 } catch (e) { setSchemaValidErr(e.message); }
 setSchemaValidLoading(false);
 }, [scanResult]);

 const runAdvReadability = useCallback(async () => {
 if (!scanResult?.url) return;
 setAdvReadLoading(true); setAdvReadability(null);
 try {
 const r = await apiFetchJSON(`${API}/content/advanced-readability`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) });
 if (r.ok) setAdvReadability(r);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setAdvReadLoading(false);
 }, [scanResult]);

 const runIntLinks = useCallback(async () => {
 if (!scanResult?.url) return;
 setIntLinksLoading(true); setIntLinksErr(""); setIntLinks(null);
 try {
 const r = await apiFetchJSON(`${API}/links/internal-suggestions`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url, title: scanResult.title, niche: kwNiche.trim() || undefined }) });
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
 const r = await apiFetchJSON(`${API}/core-web-vitals`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: url.trim(), strategy: "mobile"}) });
 if (!r.ok) throw new Error(r.error || "CWV check failed");
 setCwvResult(r);
 } catch (e) { setCwvErr(e.message); }
 setCwvLoading(false);
 }, [url]);

 const runCrawlerAccess = useCallback(async () => {
 if (!url.trim()) return;
 setCrawlerLoading(true); setCrawlerErr(""); setCrawlerResult(null);
 try {
 const r = await apiFetchJSON(`${API}/crawler-access`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: url.trim() }) });
 if (!r.ok) throw new Error(r.error || "Crawler check failed");
 setCrawlerResult(r);
 } catch (e) { setCrawlerErr(e.message); }
 setCrawlerLoading(false);
 }, [url]);

 const runTitleH1 = useCallback(async () => {
 if (!scanResult?.url) return;
 setTitleH1Loading(true); setTitleH1Result(null);
 try {
 const r = await apiFetchJSON(`${API}/title-h1-alignment`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) });
 if (r.ok) setTitleH1Result(r);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setTitleH1Loading(false);
 }, [scanResult]);

 const runHeadingHier = useCallback(async () => {
 if (!scanResult?.url) return;
 setHeadingHierLoading(true); setHeadingHierResult(null);
 try {
 const r = await apiFetchJSON(`${API}/heading-hierarchy`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) });
 if (r.ok) setHeadingHierResult(r);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setHeadingHierLoading(false);
 }, [scanResult]);

 const runImageSeo = useCallback(async () => {
 if (!scanResult?.url) return;
 setImageSeoLoading(true); setImageSeoResult(null);
 try {
 const r = await apiFetchJSON(`${API}/image-seo`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) });
 if (r.ok) setImageSeoResult(r);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setImageSeoLoading(false);
 }, [scanResult]);

 const runSemanticHtml = useCallback(async () => {
 if (!scanResult?.url) return;
 setSemanticHtmlLoading(true); setSemanticHtmlResult(null);
 try {
 const r = await apiFetchJSON(`${API}/semantic-html`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) });
 if (r.ok) setSemanticHtmlResult(r);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setSemanticHtmlLoading(false);
 }, [scanResult]);

 const runMetaDescAudit = useCallback(async () => {
 if (!scanResult?.url) return;
 setMetaDescAuditLoading(true); setMetaDescAuditResult(null);
 try {
 const r = await apiFetchJSON(`${API}/meta-description-audit`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) });
 if (r.ok) setMetaDescAuditResult(r);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setMetaDescAuditLoading(false);
 }, [scanResult, kwInput]);

 const runKwDensity = useCallback(async () => {
 if (!scanResult?.url) return;
 setKwDensityLoading(true); setKwDensityResult(null);
 try {
 const r = await apiFetchJSON(`${API}/keyword-density`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) });
 if (r.ok) setKwDensityResult(r);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setKwDensityLoading(false);
 }, [scanResult, kwInput]);

 const runIndexDirectives = useCallback(async () => {
 if (!scanResult?.url) return;
 setIndexDirectivesLoading(true); setIndexDirectivesResult(null);
 try {
 const r = await apiFetchJSON(`${API}/index-directives`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) });
 if (r.ok) setIndexDirectivesResult(r);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setIndexDirectivesLoading(false);
 }, [scanResult]);

 const runContentStruct = useCallback(async () => {
 if (!scanResult?.url) return;
 setContentStructLoading(true); setContentStructResult(null);
 try {
 const r = await apiFetchJSON(`${API}/content-structure`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) });
 if (r.ok) setContentStructResult(r);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setContentStructLoading(false);
 }, [scanResult]);

 const runAuthorAuth = useCallback(async () => {
 if (!scanResult?.url) return;
 setAuthorAuthLoading(true); setAuthorAuthResult(null);
 try {
 const r = await apiFetchJSON(`${API}/author-authority`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) });
 if (r.ok) setAuthorAuthResult(r);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setAuthorAuthLoading(false);
 }, [scanResult]);

 const runSitemap = useCallback(async () => {
 if (!scanResult?.url) return;
 setSitemapLoading(true); setSitemapResult(null);
 try {
 const r = await apiFetchJSON(`${API}/sitemap-check`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) });
 if (r.ok) setSitemapResult(r);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setSitemapLoading(false);
 }, [scanResult]);

 const runOgValid = useCallback(async () => {
 if (!scanResult?.url) return;
 setOgValidLoading(true); setOgValidResult(null);
 try {
 const r = await apiFetchJSON(`${API}/og-validator`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) });
 if (r.ok) setOgValidResult(r);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setOgValidLoading(false);
 }, [scanResult]);

 const runBreadcrumb = useCallback(async () => {
 if (!scanResult?.url) return;
 setBreadcrumbLoading(true); setBreadcrumbResult(null);
 try {
 const r = await apiFetchJSON(`${API}/schema/breadcrumb`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) });
 if (r.ok) setBreadcrumbResult(r);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setBreadcrumbLoading(false);
 }, [scanResult]);

 const runHowto = useCallback(async () => {
 if (!howtoTitle.trim()) return;
 setHowtoLoading(true); setHowtoResult(null);
 try {
 const r = await apiFetchJSON(`${API}/schema/howto`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ title: howtoTitle.trim() }) });
 if (r.ok) setHowtoResult(r);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setHowtoLoading(false);
 }, [howtoTitle]);

 const runVideoSchema = useCallback(async () => {
 if (!scanResult?.url) return;
 setVideoSchemaLoading(true); setVideoSchemaResult(null);
 try {
 const r = await apiFetchJSON(`${API}/schema/video`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) });
 if (r.ok) setVideoSchemaResult(r);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setVideoSchemaLoading(false);
 }, [scanResult]);

 const runReviewSchema = useCallback(async () => {
 if (!reviewName.trim()) return;
 setReviewLoading(true); setReviewResult(null);
 try {
 const r = await apiFetchJSON(`${API}/schema/review`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ name: reviewName.trim(), ratingValue: parseFloat(reviewRating), reviewCount: parseInt(reviewCount), url: scanResult?.url }) });
 if (r.ok) setReviewResult(r);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setReviewLoading(false);
 }, [reviewName, reviewRating, reviewCount, scanResult]);

 const runOrgSchema = useCallback(async () => {
 if (!orgName.trim()) return;
 setOrgLoading(true); setOrgResult(null);
 try {
 const r = await apiFetchJSON(`${API}/schema/organization`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ name: orgName.trim(), url: orgUrl.trim() || undefined }) });
 if (r.ok) setOrgResult(r);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setOrgLoading(false);
 }, [orgName, orgUrl]);

 const runSpeakable = useCallback(async () => {
 if (!scanResult?.url) return;
 setSpeakableLoading(true); setSpeakableResult(null);
 try {
 const r = await apiFetchJSON(`${API}/schema/speakable`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) });
 if (r.ok) setSpeakableResult(r);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setSpeakableLoading(false);
 }, [scanResult]);

 const runIntent = useCallback(async () => {
 if (!intentKeyword.trim()) return;
 setIntentLoading(true); setIntentResult(null);
 try {
 const r = await apiFetchJSON(`${API}/intent-classifier`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ keyword: intentKeyword.trim(), url: scanResult?.url }) });
 if (r.ok) setIntentResult(r);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setIntentLoading(false);
 }, [intentKeyword, scanResult]);

 const runAiOverview = useCallback(async () => {
 if (!scanResult?.url) return;
 setAiOverviewLoading(true); setAiOverviewResult(null);
 try {
 const r = await apiFetchJSON(`${API}/ai-overview-eligibility`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) });
 if (r.ok) setAiOverviewResult(r);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setAiOverviewLoading(false);
 }, [scanResult, kwInput]);

 const runTopical = useCallback(async () => {
 if (!topicalKw.trim()) return;
 setTopicalLoading(true); setTopicalResult(null);
 try {
 const r = await apiFetchJSON(`${API}/topical-authority`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ topic: topicalKw.trim(), url: scanResult?.url }) });
 if (r.ok) setTopicalResult(r);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setTopicalLoading(false);
 }, [topicalKw, scanResult]);

 const runMetaOpt = useCallback(async () => {
 if (!scanResult?.url) return;
 setMetaOptLoading(true); setMetaOptResult(null);
 try {
 const r = await apiFetchJSON(`${API}/meta-description-optimizer`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) });
 if (r.ok) setMetaOptResult(r);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setMetaOptLoading(false);
 }, [scanResult, kwInput]);

 const runDecay = useCallback(async () => {
 if (!scanResult?.url) return;
 setDecayLoading(true); setDecayResult(null);
 try {
 const r = await apiFetchJSON(`${API}/content-decay`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) });
 if (r.ok) setDecayResult(r);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setDecayLoading(false);
 }, [scanResult, kwInput]);

 const runCompGap = useCallback(async () => {
 const urls = compUrls.split("\n").map(u => u.trim()).filter(Boolean);
 if (!urls.length || !scanResult?.url) return;
 setCompLoading(true); setCompErr(""); setCompResult(null);
 try {
 const r = await apiFetchJSON(`${API}/competitor-gap`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url, competitorUrls: urls }) });
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
 const r = await apiFetchJSON(`${API}/cannibalization`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ urls, keyword: kwInput.trim() }) });
 if (r.ok) setCannibResult(r);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setCannibLoading(false);
 }, [cannibUrls, kwInput]);

 const runAnchor = useCallback(async () => {
 if (!scanResult?.url) return;
 setAnchorLoading(true); setAnchorResult(null);
 try {
 const r = await apiFetchJSON(`${API}/anchor-text-audit`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) });
 if (r.ok) setAnchorResult(r);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setAnchorLoading(false);
 }, [scanResult]);

 const runToc = useCallback(async () => {
 if (!scanResult?.url) return;
 setTocLoading(true); setTocResult(null);
 try {
 const r = await apiFetchJSON(`${API}/toc-generator`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) });
 if (r.ok) setTocResult(r);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setTocLoading(false);
 }, [scanResult]);

 const runSectionWc = useCallback(async () => {
 if (!scanResult?.url) return;
 setSectionWcLoading(true); setSectionWcResult(null);
 try {
 const r = await apiFetchJSON(`${API}/section-word-count`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) });
 if (r.ok) setSectionWcResult(r);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setSectionWcLoading(false);
 }, [scanResult]);

 const runPaa = useCallback(async () => {
 if (!paaKw.trim()) return;
 setPaaLoading(true); setPaaResult(null);
 try {
 const r = await apiFetchJSON(`${API}/people-also-ask`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ keyword: paaKw.trim(), url: scanResult?.url }) });
 if (r.ok) setPaaResult(r);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setPaaLoading(false);
 }, [paaKw, scanResult]);

 const runEntity = useCallback(async () => {
 if (!scanResult?.url) return;
 setEntityLoading(true); setEntityResult(null);
 try {
 const r = await apiFetchJSON(`${API}/entity-detection`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) });
 if (r.ok) setEntityResult(r);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setEntityLoading(false);
 }, [scanResult]);

 const runSerpFeatures = useCallback(async () => {
 if (!scanResult?.url) return;
 setSerpFeatLoading(true); setSerpFeatResult(null);
 try {
 const r = await apiFetchJSON(`${API}/serp-features`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) });
 if (r.ok) setSerpFeatResult(r);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setSerpFeatLoading(false);
 }, [scanResult, kwInput]);

 /* -- BATCH 3 CALLBACKS ------------------------------------------------ */
 const runSentenceVariety = useCallback(async () => {
 if (!scanResult?.url) return;
 setSentenceVarietyLoading(true); setSentenceVarietyResult(null);
 try { const r = await apiFetchJSON(`${API}/content/sentence-variety`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setSentenceVarietyResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setSentenceVarietyLoading(false);
 }, [scanResult]);

 const runEmotionalTone = useCallback(async () => {
 if (!scanResult?.url) return;
 setEmotionalToneLoading(true); setEmotionalToneResult(null);
 try { const r = await apiFetchJSON(`${API}/content/emotional-tone`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setEmotionalToneResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setEmotionalToneLoading(false);
 }, [scanResult]);

 const runJargonDetector = useCallback(async () => {
 if (!scanResult?.url) return;
 setJargonLoading(true); setJargonResult(null);
 try { const r = await apiFetchJSON(`${API}/content/jargon-detector`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setJargonResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setJargonLoading(false);
 }, [scanResult]);

 const runExpertiseSignals = useCallback(async () => {
 if (!scanResult?.url) return;
 setExpertiseLoading(true); setExpertiseResult(null);
 try { const r = await apiFetchJSON(`${API}/content/expertise-signals`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setExpertiseResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setExpertiseLoading(false);
 }, [scanResult]);

 const runMultimediaScore = useCallback(async () => {
 if (!scanResult?.url) return;
 setMultimediaLoading(true); setMultimediaResult(null);
 try { const r = await apiFetchJSON(`${API}/content/multimedia-score`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setMultimediaResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setMultimediaLoading(false);
 }, [scanResult]);

 const runQuestionsCount = useCallback(async () => {
 if (!scanResult?.url) return;
 setQuestionsLoading(true); setQuestionsResult(null);
 try { const r = await apiFetchJSON(`${API}/content/questions-count`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setQuestionsResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setQuestionsLoading(false);
 }, [scanResult]);

 const runIntroQuality = useCallback(async () => {
 if (!scanResult?.url) return;
 setIntroQualityLoading(true); setIntroQualityResult(null);
 try { const r = await apiFetchJSON(`${API}/content/intro-quality`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setIntroQualityResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setIntroQualityLoading(false);
 }, [scanResult]);

 const runCtaAudit = useCallback(async () => {
 if (!scanResult?.url) return;
 setCtaAuditLoading(true); setCtaAuditResult(null);
 try { const r = await apiFetchJSON(`${API}/content/cta-audit`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setCtaAuditResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setCtaAuditLoading(false);
 }, [scanResult]);

 const runFormattingScore = useCallback(async () => {
 if (!scanResult?.url) return;
 setFormattingLoading(true); setFormattingResult(null);
 try { const r = await apiFetchJSON(`${API}/content/formatting-score`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setFormattingResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setFormattingLoading(false);
 }, [scanResult]);

 const runThinContent = useCallback(async () => {
 if (!scanResult?.url) return;
 setThinContentLoading(true); setThinContentResult(null);
 try { const r = await apiFetchJSON(`${API}/content/thin-content`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) }); if (r.ok) setThinContentResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setThinContentLoading(false);
 }, [scanResult, kwInput]);

 const runKwProminence = useCallback(async () => {
 if (!scanResult?.url || !kwInput.trim()) return;
 setKwProminenceLoading(true); setKwProminenceResult(null);
 try { const r = await apiFetchJSON(`${API}/keywords/prominence`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) }); if (r.ok) setKwProminenceResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setKwProminenceLoading(false);
 }, [scanResult, kwInput]);

 const runKwTfidf = useCallback(async () => {
 if (!scanResult?.url) return;
 setKwTfidfLoading(true); setKwTfidfResult(null);
 try { const r = await apiFetchJSON(`${API}/keywords/tfidf`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setKwTfidfResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setKwTfidfLoading(false);
 }, [scanResult]);

 const runCoOccurrence = useCallback(async () => {
 if (!scanResult?.url || !kwInput.trim()) return;
 setCoOccurrenceLoading(true); setCoOccurrenceResult(null);
 try { const r = await apiFetchJSON(`${API}/keywords/co-occurrence`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) }); if (r.ok) setCoOccurrenceResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setCoOccurrenceLoading(false);
 }, [scanResult, kwInput]);

 const runSecondaryKw = useCallback(async () => {
 if (!scanResult?.url || !kwInput.trim()) return;
 setSecondaryKwLoading(true); setSecondaryKwResult(null);
 try { const r = await apiFetchJSON(`${API}/keywords/secondary`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) }); if (r.ok) setSecondaryKwResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setSecondaryKwLoading(false);
 }, [scanResult, kwInput]);

 const runVoiceSearch = useCallback(async () => {
 if (!scanResult?.url || !kwInput.trim()) return;
 setVoiceSearchLoading(true); setVoiceSearchResult(null);
 try { const r = await apiFetchJSON(`${API}/keywords/voice-search`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) }); if (r.ok) setVoiceSearchResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setVoiceSearchLoading(false);
 }, [scanResult, kwInput]);

 const runNegativeCheck = useCallback(async () => {
 if (!scanResult?.url || !kwInput.trim()) return;
 setNegCheckLoading(true); setNegCheckResult(null);
 try { const r = await apiFetchJSON(`${API}/keywords/negative-check`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) }); if (r.ok) setNegCheckResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setNegCheckLoading(false);
 }, [scanResult, kwInput]);

 const runFeatSnippet = useCallback(async () => {
 if (!scanResult?.url || !kwInput.trim()) return;
 setFeatSnippetLoading(true); setFeatSnippetResult(null);
 try { const r = await apiFetchJSON(`${API}/keywords/featured-snippet`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) }); if (r.ok) setFeatSnippetResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setFeatSnippetLoading(false);
 }, [scanResult, kwInput]);

 const runUrlAnalysis = useCallback(async () => {
 if (!url.trim()) return;
 setUrlAnalysisLoading(true); setUrlAnalysisResult(null);
 try { const r = await apiFetchJSON(`${API}/technical/url-analysis`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setUrlAnalysisResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setUrlAnalysisLoading(false);
 }, [url]);

 const runMobileSeo = useCallback(async () => {
 if (!scanResult?.url) return;
 setMobileSeoLoading(true); setMobileSeoResult(null);
 try { const r = await apiFetchJSON(`${API}/technical/mobile-seo`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setMobileSeoResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setMobileSeoLoading(false);
 }, [scanResult]);

 const runHreflang = useCallback(async () => {
 if (!scanResult?.url) return;
 setHreflangLoading(true); setHreflangResult(null);
 try { const r = await apiFetchJSON(`${API}/technical/hreflang`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setHreflangResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setHreflangLoading(false);
 }, [scanResult]);

 const runAmpCheck = useCallback(async () => {
 if (!scanResult?.url) return;
 setAmpLoading(true); setAmpResult(null);
 try { const r = await apiFetchJSON(`${API}/technical/amp-check`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setAmpResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setAmpLoading(false);
 }, [scanResult]);

 const runResourceHints = useCallback(async () => {
 if (!scanResult?.url) return;
 setResourceHintsLoading(true); setResourceHintsResult(null);
 try { const r = await apiFetchJSON(`${API}/technical/resource-hints`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setResourceHintsResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setResourceHintsLoading(false);
 }, [scanResult]);

 const runJsonLdLint = useCallback(async () => {
 if (!scanResult?.url) return;
 setJsonLdLintLoading(true); setJsonLdLintResult(null);
 try { const r = await apiFetchJSON(`${API}/technical/json-ld-lint`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setJsonLdLintResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setJsonLdLintLoading(false);
 }, [scanResult]);

 const runOgImageDims = useCallback(async () => {
 if (!scanResult?.url) return;
 setOgImageDimsLoading(true); setOgImageDimsResult(null);
 try { const r = await apiFetchJSON(`${API}/technical/og-image-dims`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setOgImageDimsResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setOgImageDimsLoading(false);
 }, [scanResult]);

 const runHttpsStatus = useCallback(async () => {
 if (!url.trim()) return;
 setHttpsStatusLoading(true); setHttpsStatusResult(null);
 try { const r = await apiFetchJSON(`${API}/technical/https-status`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setHttpsStatusResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setHttpsStatusLoading(false);
 }, [url]);

 const runBlogOutline = useCallback(async () => {
 if (!blogOutlineKw.trim()) return;
 setBlogOutlineLoading(true); setBlogOutlineResult(null);
 try { const r = await apiFetchJSON(`${API}/ai/blog-outline`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ keyword: blogOutlineKw.trim(), audience: blogOutlineAudience }) }); if (r.ok) setBlogOutlineResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setBlogOutlineLoading(false);
 }, [blogOutlineKw, blogOutlineAudience]);

 const runIntroGenerator = useCallback(async () => {
 if (!introGenKw.trim()) return;
 setIntroGenLoading(true); setIntroGenResult(null);
 try { const r = await apiFetchJSON(`${API}/ai/intro-generator`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ keyword: introGenKw.trim(), style: introGenStyle }) }); if (r.ok) setIntroGenResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setIntroGenLoading(false);
 }, [introGenKw, introGenStyle]);

 const runTitleIdeas = useCallback(async () => {
 if (!titleIdeasKw.trim()) return;
 setTitleIdeasLoading(true); setTitleIdeasResult(null);
 try { const r = await apiFetchJSON(`${API}/ai/title-ideas`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ keyword: titleIdeasKw.trim() }) }); if (r.ok) setTitleIdeasResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setTitleIdeasLoading(false);
 }, [titleIdeasKw]);

 const runCtaGenerator = useCallback(async () => {
 if (!ctaGenKw.trim()) return;
 setCtaGenLoading(true); setCtaGenResult(null);
 try { const r = await apiFetchJSON(`${API}/ai/cta-generator`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ keyword: ctaGenKw.trim(), goal: ctaGenGoal }) }); if (r.ok) setCtaGenResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setCtaGenLoading(false);
 }, [ctaGenKw, ctaGenGoal]);

 const runKeyTakeaways = useCallback(async () => {
 if (!scanResult?.url) return;
 setKeyTakeawaysLoading(true); setKeyTakeawaysResult(null);
 try { const r = await apiFetchJSON(`${API}/ai/key-takeaways`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setKeyTakeawaysResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setKeyTakeawaysLoading(false);
 }, [scanResult]);

 const runSummaryGenerator = useCallback(async () => {
 if (!scanResult?.url) return;
 setSummaryGenLoading(true); setSummaryGenResult(null);
 try { const r = await apiFetchJSON(`${API}/ai/summary-generator`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setSummaryGenResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setSummaryGenLoading(false);
 }, [scanResult]);

 const runToneAnalyzer = useCallback(async () => {
 if (!scanResult?.url) return;
 setToneAnalyzerLoading(true); setToneAnalyzerResult(null);
 try { const r = await apiFetchJSON(`${API}/ai/tone-analyzer`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setToneAnalyzerResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setToneAnalyzerLoading(false);
 }, [scanResult]);

 const runContentGrader = useCallback(async () => {
 if (!scanResult?.url) return;
 setContentGraderLoading(true); setContentGraderResult(null);
 try { const r = await apiFetchJSON(`${API}/ai/content-grader`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) }); if (r.ok) setContentGraderResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setContentGraderLoading(false);
 }, [scanResult, kwInput]);

 const runPullQuotes = useCallback(async () => {
 if (!scanResult?.url) return;
 setPullQuotesLoading(true); setPullQuotesResult(null);
 try { const r = await apiFetchJSON(`${API}/ai/pull-quotes`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setPullQuotesResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setPullQuotesLoading(false);
 }, [scanResult]);

 const runHeadlineHook = useCallback(async () => {
 const h = headlineHookTitle || scanResult?.title;
 if (!h) return;
 setHeadlineHookLoading(true); setHeadlineHookResult(null);
 try { const r = await apiFetchJSON(`${API}/ai/headline-hook`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ headline: h, keyword: kwInput.trim() }) }); if (r.ok) setHeadlineHookResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setHeadlineHookLoading(false);
 }, [headlineHookTitle, scanResult, kwInput]);

 const runPassageOptimizer = useCallback(async () => {
 if (!scanResult?.url || !kwInput.trim()) return;
 setPassageOptLoading(true); setPassageOptResult(null);
 try { const r = await apiFetchJSON(`${API}/ai/passage-optimizer`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) }); if (r.ok) setPassageOptResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setPassageOptLoading(false);
 }, [scanResult, kwInput]);

 const runRepurpose = useCallback(async () => {
 if (!scanResult?.url) return;
 setRepurposeLoading(true); setRepurposeResult(null);
 try { const r = await apiFetchJSON(`${API}/ai/content-repurpose`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setRepurposeResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setRepurposeLoading(false);
 }, [scanResult]);

 const runProductSchema = useCallback(async () => {
 if (!productName.trim()) return;
 setProductSchemaLoading(true); setProductSchemaResult(null);
 try { const r = await apiFetchJSON(`${API}/schema/product`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ name: productName, price: productPrice, brand: productBrand, description: productDesc, image: productImage }) }); if (r.ok) setProductSchemaResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setProductSchemaLoading(false);
 }, [productName, productPrice, productBrand, productDesc, productImage]);

 const runEventSchema = useCallback(async () => {
 if (!eventName.trim() || !eventDate.trim()) return;
 setEventSchemaLoading(true); setEventSchemaResult(null);
 try { const r = await apiFetchJSON(`${API}/schema/event`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ name: eventName, date: eventDate, location: eventLocation, organizer: eventOrg }) }); if (r.ok) setEventSchemaResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setEventSchemaLoading(false);
 }, [eventName, eventDate, eventLocation, eventOrg]);

 const runPersonSchema = useCallback(async () => {
 if (!personName.trim()) return;
 setPersonSchemaLoading(true); setPersonSchemaResult(null);
 try { const r = await apiFetchJSON(`${API}/schema/person`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ name: personName, jobTitle: personJob, description: personDesc, sameAs: personSameAs }) }); if (r.ok) setPersonSchemaResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setPersonSchemaLoading(false);
 }, [personName, personJob, personDesc, personSameAs]);

 const runCourseSchema = useCallback(async () => {
 if (!courseName.trim()) return;
 setCourseSchemaLoading(true); setCourseSchemaResult(null);
 try { const r = await apiFetchJSON(`${API}/schema/course`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ name: courseName, provider: courseProvider, price: coursePrice, duration: courseDuration }) }); if (r.ok) setCourseSchemaResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setCourseSchemaLoading(false);
 }, [courseName, courseProvider, coursePrice, courseDuration]);

 const runRecipeSchema = useCallback(async () => {
 if (!recipeName.trim()) return;
 setRecipeSchemaLoading(true); setRecipeSchemaResult(null);
 try { const r = await apiFetchJSON(`${API}/schema/recipe`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ name: recipeName, author: recipeAuthorName, prepTime: recipePrepTime, cookTime: recipeCookTime, ingredients: recipeIngredients }) }); if (r.ok) setRecipeSchemaResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setRecipeSchemaLoading(false);
 }, [recipeName, recipeAuthorName, recipePrepTime, recipeCookTime, recipeIngredients]);

 const runSoftwareSchema = useCallback(async () => {
 if (!softwareName.trim()) return;
 setSoftwareSchemaLoading(true); setSoftwareSchemaResult(null);
 try { const r = await apiFetchJSON(`${API}/schema/software`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ name: softwareName, description: softwareDesc, price: softwarePrice, category: softwareCategory }) }); if (r.ok) setSoftwareSchemaResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setSoftwareSchemaLoading(false);
 }, [softwareName, softwareDesc, softwarePrice, softwareCategory]);

 const runLocalBizSchema = useCallback(async () => {
 if (!bizName.trim()) return;
 setLocalBizSchemaLoading(true); setLocalBizSchemaResult(null);
 try { const r = await apiFetchJSON(`${API}/schema/local-business`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ name: bizName, address: bizAddress, city: bizCity, phone: bizPhone, type: bizType }) }); if (r.ok) setLocalBizSchemaResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setLocalBizSchemaLoading(false);
 }, [bizName, bizAddress, bizCity, bizPhone, bizType]);

 const runExtLinkAuth = useCallback(async () => {
 if (!scanResult?.url) return;
 setExtLinkAuthLoading(true); setExtLinkAuthResult(null);
 try { const r = await apiFetchJSON(`${API}/links/external-authority`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setExtLinkAuthResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setExtLinkAuthLoading(false);
 }, [scanResult]);

 const runLinkDensity = useCallback(async () => {
 if (!scanResult?.url) return;
 setLinkDensityLoading(true); setLinkDensityResult(null);
 try { const r = await apiFetchJSON(`${API}/links/link-density`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setLinkDensityResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setLinkDensityLoading(false);
 }, [scanResult]);

 const runOutboundAudit = useCallback(async () => {
 if (!scanResult?.url) return;
 setOutboundAuditLoading(true); setOutboundAuditResult(null);
 try { const r = await apiFetchJSON(`${API}/links/outbound-audit`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setOutboundAuditResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setOutboundAuditLoading(false);
 }, [scanResult]);

 const runSocialProof = useCallback(async () => {
 if (!scanResult?.url) return;
 setSocialProofLoading(true); setSocialProofResult(null);
 try { const r = await apiFetchJSON(`${API}/trust/social-proof`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setSocialProofResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setSocialProofLoading(false);
 }, [scanResult]);

 const runCitationCheck = useCallback(async () => {
 if (!scanResult?.url) return;
 setCitationCheckLoading(true); setCitationCheckResult(null);
 try { const r = await apiFetchJSON(`${API}/trust/citation-check`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url }) }); if (r.ok) setCitationCheckResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setCitationCheckLoading(false);
 }, [scanResult]);

 const runPassageIndex = useCallback(async () => {
 if (!scanResult?.url || !kwInput.trim()) return;
 setPassageIndexLoading(true); setPassageIndexResult(null);
 try { const r = await apiFetchJSON(`${API}/passage-indexing`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) }); if (r.ok) setPassageIndexResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setPassageIndexLoading(false);
 }, [scanResult, kwInput]);

 const runContentVisibility = useCallback(async () => {
 if (!scanResult?.url || !kwInput.trim()) return;
 setContentVisibilityLoading(true); setContentVisibilityResult(null);
 try { const r = await apiFetchJSON(`${API}/ai/content-visibility`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: scanResult.url, keyword: kwInput.trim() }) }); if (r.ok) setContentVisibilityResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setContentVisibilityLoading(false);
 }, [scanResult, kwInput]);

 /* -- BATCH 4: SERP & CTR CALLBACKS ------------------------------------ */
 const runCtrOptimizer = useCallback(async () => {
 if (!ctrTitle.trim()) return;
 setCtrOptimizerLoading(true); setCtrOptimizerResult(null);
 try { const r = await apiFetchJSON(`${API}/serp/ctr-optimizer`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ title: ctrTitle, metaDescription: ctrMeta, keyword: ctrKeyword }) }); if (r.ok) setCtrOptimizerResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setCtrOptimizerLoading(false);
 }, [ctrTitle, ctrMeta, ctrKeyword]);

 const runIntentClassifier = useCallback(async () => {
 if (!intentKeyword.trim()) return;
 setIntentLoading(true); setIntentResult(null);
 try { const r = await apiFetchJSON(`${API}/serp/intent-classifier`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ keyword: intentKeyword }) }); if (r.ok) setIntentResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setIntentLoading(false);
 }, [intentKeyword]);

 const runSerpFeatureTargets = useCallback(async () => {
 if (!url.trim()) return;
 setSerpFeaturesLoading(true); setSerpFeaturesResult(null);
 try { const r = await apiFetchJSON(`${API}/serp/feature-targets`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: url.trim(), keyword: kwInput.trim() }) }); if (r.ok) setSerpFeaturesResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setSerpFeaturesLoading(false);
 }, [url, kwInput]);

 const runPaaGenerator = useCallback(async () => {
 if (!paaGenKeyword.trim()) return;
 setPaaGenLoading(true); setPaaGenResult(null);
 try { const r = await apiFetchJSON(`${API}/serp/paa-generator`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ keyword: paaGenKeyword, niche: paaGenNiche }) }); if (r.ok) setPaaGenResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setPaaGenLoading(false);
 }, [paaGenKeyword, paaGenNiche]);

 const runRichResultCheck = useCallback(async () => {
 if (!url.trim()) return;
 setRichResultCheckLoading(true); setRichResultCheckResult(null);
 try { const r = await apiFetchJSON(`${API}/serp/rich-result-check`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setRichResultCheckResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setRichResultCheckLoading(false);
 }, [url]);

 const runRankbrainAdvisor = useCallback(async () => {
 if (!url.trim()) return;
 setRankbrainLoading(true); setRankbrainResult(null);
 try { const r = await apiFetchJSON(`${API}/serp/rankbrain-advisor`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setRankbrainResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setRankbrainLoading(false);
 }, [url]);

 const runLongtailEmbed = useCallback(async () => {
 if (!longtailTitle.trim() || !longtailPrimary.trim()) return;
 setLongtailEmbedLoading(true); setLongtailEmbedResult(null);
 try { const r = await apiFetchJSON(`${API}/serp/longtail-embedder`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ title: longtailTitle, primaryKeyword: longtailPrimary }) }); if (r.ok) setLongtailEmbedResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setLongtailEmbedLoading(false);
 }, [longtailTitle, longtailPrimary]);

 const runMetaAbVariants = useCallback(async () => {
 if (!metaAbTitle.trim()) return;
 setMetaAbLoading(true); setMetaAbResult(null);
 try { const r = await apiFetchJSON(`${API}/serp/meta-ab-variants`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ title: metaAbTitle, keyword: metaAbKeyword }) }); if (r.ok) setMetaAbResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setMetaAbLoading(false);
 }, [metaAbTitle, metaAbKeyword]);

 const runDifficultyScore = useCallback(async () => {
 if (!diffKeyword.trim()) return;
 setDifficultyLoading(true); setDifficultyResult(null);
 try { const r = await apiFetchJSON(`${API}/serp/difficulty-score`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ keyword: diffKeyword, niche: diffNiche }) }); if (r.ok) setDifficultyResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setDifficultyLoading(false);
 }, [diffKeyword, diffNiche]);

 const runCompetitorSnapshot = useCallback(async () => {
 if (!snapKeyword.trim()) return;
 setCompetitorSnapshotLoading(true); setCompetitorSnapshotResult(null);
 try { const r = await apiFetchJSON(`${API}/serp/competitor-snapshot`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ keyword: snapKeyword, url: url.trim() }) }); if (r.ok) setCompetitorSnapshotResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setCompetitorSnapshotLoading(false);
 }, [snapKeyword, url]);

 /* -- BATCH 4: BACKLINK CALLBACKS --------------------------------------- */
 const runBacklinkOpps = useCallback(async () => {
 if (!backlinkNiche.trim()) return;
 setBacklinkOppsLoading(true); setBacklinkOppsResult(null);
 try { const r = await apiFetchJSON(`${API}/backlinks/opportunity-finder`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ niche: backlinkNiche, url: url.trim() }) }); if (r.ok) setBacklinkOppsResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setBacklinkOppsLoading(false);
 }, [backlinkNiche, url]);

 const runLinkGap = useCallback(async () => {
 if (!linkGapDomain.trim()) return;
 setLinkGapLoading(true); setLinkGapResult(null);
 try { const r = await apiFetchJSON(`${API}/backlinks/link-gap`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ yourDomain: linkGapDomain, competitor1: linkGapComp1, competitor2: linkGapComp2, niche: linkGapNiche }) }); if (r.ok) setLinkGapResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setLinkGapLoading(false);
 }, [linkGapDomain, linkGapComp1, linkGapComp2, linkGapNiche]);

 const runOutreachGenerator = useCallback(async () => {
 if (!outreachContentTitle.trim()) return;
 setOutreachLoading(true); setOutreachResult(null);
 try { const r = await apiFetchJSON(`${API}/backlinks/outreach-generator`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ targetSite: outreachTarget, contentTitle: outreachContentTitle, outreachType }) }); if (r.ok) setOutreachResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setOutreachLoading(false);
 }, [outreachTarget, outreachContentTitle, outreachType]);

 const runBestofFinder = useCallback(async () => {
 if (!bestofNiche.trim()) return;
 setBestofLoading(true); setBestofResult(null);
 try { const r = await apiFetchJSON(`${API}/backlinks/bestof-finder`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ niche: bestofNiche }) }); if (r.ok) setBestofResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setBestofLoading(false);
 }, [bestofNiche]);

 const runAnchorOptimizer = useCallback(async () => {
 if (!anchorOptKeyword.trim()) return;
 setAnchorOptLoading(true); setAnchorOptResult(null);
 try { const r = await apiFetchJSON(`${API}/backlinks/anchor-optimizer`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ targetKeyword: anchorOptKeyword, url: url.trim() }) }); if (r.ok) setAnchorOptResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setAnchorOptLoading(false);
 }, [anchorOptKeyword, url]);

 const runLinkStrategy = useCallback(async () => {
 if (!linkStratNiche.trim()) return;
 setLinkStrategyLoading(true); setLinkStrategyResult(null);
 try { const r = await apiFetchJSON(`${API}/backlinks/strategy-builder`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ niche: linkStratNiche, monthlyBudget: linkStratBudget, domain: url.trim() }) }); if (r.ok) setLinkStrategyResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setLinkStrategyLoading(false);
 }, [linkStratNiche, linkStratBudget, url]);

 const runInternalSuggest = useCallback(async () => {
 if (!url.trim()) return;
 setInternalSuggestLoading(true); setInternalSuggestResult(null);
 try { const r = await apiFetchJSON(`${API}/backlinks/internal-suggester`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setInternalSuggestResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setInternalSuggestLoading(false);
 }, [url]);

 /* -- BATCH 4: CONTENT EXTRA CALLBACKS --------------------------------- */
 const runFreshnessScore = useCallback(async () => {
 if (!url.trim()) return;
 setFreshnessLoading(true); setFreshnessResult(null);
 try { const r = await apiFetchJSON(`${API}/content/freshness-score`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setFreshnessResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setFreshnessLoading(false);
 }, [url]);

 const runSkyscraperGap = useCallback(async () => {
 if (!url.trim()) return;
 setSkyscraperLoading(true); setSkyscraperResult(null);
 try { const r = await apiFetchJSON(`${API}/content/skyscraper-gap`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: url.trim(), keyword: skyscraperKeyword || kwInput.trim() }) }); if (r.ok) setSkyscraperResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setSkyscraperLoading(false);
 }, [url, skyscraperKeyword, kwInput]);

 const runRelunchAdvisor = useCallback(async () => {
 if (!url.trim()) return;
 setRelunchLoading(true); setRelunchResult(null);
 try { const r = await apiFetchJSON(`${API}/content/relaunch-advisor`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: url.trim(), keyword: relunchKeyword || kwInput.trim() }) }); if (r.ok) setRelunchResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setRelunchLoading(false);
 }, [url, relunchKeyword, kwInput]);

 const runSemanticEnrich = useCallback(async () => {
 if (!url.trim() && !semanticEnrichKeyword.trim()) return;
 setSemanticEnrichLoading(true); setSemanticEnrichResult(null);
 try { const r = await apiFetchJSON(`${API}/content/semantic-enrichment`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: url.trim(), keyword: semanticEnrichKeyword || kwInput.trim() }) }); if (r.ok) setSemanticEnrichResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setSemanticEnrichLoading(false);
 }, [url, semanticEnrichKeyword, kwInput]);

 /* -- BATCH 5: LOCAL SEO ------------------------------------------------ */
 const runGbpOptimizer = useCallback(async () => {
 if (!gbpBusiness.trim()) return;
 setGbpLoading(true); setGbpResult(null);
 try { const r = await apiFetchJSON(`${API}/local/gbp-optimizer`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ businessName: gbpBusiness, location: gbpLocation, category: gbpCategory }) }); if (r.ok) setGbpResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setGbpLoading(false);
 }, [gbpBusiness, gbpLocation, gbpCategory]);

 const runCitationFinder = useCallback(async () => {
 if (!citationBusiness.trim()) return;
 setCitationLoading(true); setCitationResult(null);
 try { const r = await apiFetchJSON(`${API}/local/citation-finder`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ businessName: citationBusiness, location: citationLocation, category: citationCategory }) }); if (r.ok) setCitationResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setCitationLoading(false);
 }, [citationBusiness, citationLocation, citationCategory]);

 const runLocalKwGen = useCallback(async () => {
 if (!localKwService.trim() || !localKwCity.trim()) return;
 setLocalKwLoading(true); setLocalKwResult(null);
 try { const r = await apiFetchJSON(`${API}/local/local-keyword-gen`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ service: localKwService, city: localKwCity }) }); if (r.ok) setLocalKwResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setLocalKwLoading(false);
 }, [localKwService, localKwCity]);

 const runLocalSchema = useCallback(async () => {
 if (!localSchemaName.trim()) return;
 setLocalSchemaLoading(true); setLocalSchemaResult(null);
 try { const r = await apiFetchJSON(`${API}/local/local-schema`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ businessName: localSchemaName, address: localSchemaAddr, phone: localSchemaPhone }) }); if (r.ok) setLocalSchemaResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setLocalSchemaLoading(false);
 }, [localSchemaName, localSchemaAddr, localSchemaPhone]);

 /* -- BATCH 5: E-E-A-T & BRAND ------------------------------------------ */
 const runEeatScorer = useCallback(async () => {
 if (!url.trim()) return;
 setEeatLoading(true); setEeatResult(null);
 try { const r = await apiFetchJSON(`${API}/brand/eeat-scorer`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setEeatResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setEeatLoading(false);
 }, [url]);

 const runAuthorBio = useCallback(async () => {
 if (!authorBioName.trim()) return;
 setAuthorBioLoading(true); setAuthorBioResult(null);
 try { const r = await apiFetchJSON(`${API}/brand/author-bio`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ authorName: authorBioName, niche: authorBioNiche, credentials: authorBioCredentials }) }); if (r.ok) setAuthorBioResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setAuthorBioLoading(false);
 }, [authorBioName, authorBioNiche, authorBioCredentials]);

 const runBrandSignals = useCallback(async () => {
 if (!brandSignalDomain.trim()) return;
 setBrandSignalLoading(true); setBrandSignalResult(null);
 try { const r = await apiFetchJSON(`${API}/brand/brand-signals`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ domain: brandSignalDomain, brandName: brandSignalName }) }); if (r.ok) setBrandSignalResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setBrandSignalLoading(false);
 }, [brandSignalDomain, brandSignalName]);

 const runExpertQuotes = useCallback(async () => {
 if (!expertQuoteTopic.trim()) return;
 setExpertQuoteLoading(true); setExpertQuoteResult(null);
 try { const r = await apiFetchJSON(`${API}/brand/expert-quotes`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ topic: expertQuoteTopic }) }); if (r.ok) setExpertQuoteResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setExpertQuoteLoading(false);
 }, [expertQuoteTopic]);

 const runTrustBuilder = useCallback(async () => {
 if (!url.trim()) return;
 setTrustBuilderLoading(true); setTrustBuilderResult(null);
 try { const r = await apiFetchJSON(`${API}/brand/trust-builder`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setTrustBuilderResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setTrustBuilderLoading(false);
 }, [url]);

 /* -- BATCH 5: VOICE & AI SEARCH ---------------------------------------- */
 const runVoiceOptimizer = useCallback(async () => {
 if (!voiceOptKeyword.trim()) return;
 setVoiceOptLoading(true); setVoiceOptResult(null);
 try { const r = await apiFetchJSON(`${API}/voice/voice-optimizer`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ keyword: voiceOptKeyword }) }); if (r.ok) setVoiceOptResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setVoiceOptLoading(false);
 }, [voiceOptKeyword]);

 const runFaqGenerator = useCallback(async () => {
 if (!faqGenTopic.trim()) return;
 setFaqGenLoading(true); setFaqGenResult(null);
 try { const r = await apiFetchJSON(`${API}/voice/faq-generator`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ topic: faqGenTopic }) }); if (r.ok) setFaqGenResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setFaqGenLoading(false);
 }, [faqGenTopic]);

 const runAiOverviewOptimizer = useCallback(async () => {
 if (!aiOverviewKeyword.trim()) return;
 setAiOverviewLoading(true); setAiOverviewResult(null);
 try { const r = await apiFetchJSON(`${API}/voice/ai-overview-optimizer`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ keyword: aiOverviewKeyword, url: url.trim() }) }); if (r.ok) setAiOverviewResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setAiOverviewLoading(false);
 }, [aiOverviewKeyword, url]);

 const runConvKeywords = useCallback(async () => {
 if (!convKwTopic.trim()) return;
 setConvKwLoading(true); setConvKwResult(null);
 try { const r = await apiFetchJSON(`${API}/voice/conversational-keywords`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ topic: convKwTopic }) }); if (r.ok) setConvKwResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setConvKwLoading(false);
 }, [convKwTopic]);

 /* -- BATCH 5: TECHNICAL+ EXTENSIONS ----------------------------------- */
 const runReadingLevel = useCallback(async () => {
 if (!url.trim()) return;
 setReadingLevelLoading(true); setReadingLevelResult(null);
 try { const r = await apiFetchJSON(`${API}/technical/reading-level`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setReadingLevelResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setReadingLevelLoading(false);
 }, [url]);

 const runTfidf = useCallback(async () => {
 if (!tfidfKeyword.trim()) return;
 setTfidfLoading(true); setTfidfResult(null);
 try { const r = await apiFetchJSON(`${API}/technical/tfidf-analyzer`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ keyword: tfidfKeyword, url: url.trim() }) }); if (r.ok) setTfidfResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setTfidfLoading(false);
 }, [tfidfKeyword, url]);

 const runContentLength = useCallback(async () => {
 if (!contentLengthKw.trim()) return;
 setContentLengthLoading(true); setContentLengthResult(null);
 try { const r = await apiFetchJSON(`${API}/technical/content-length-advisor`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ keyword: contentLengthKw, currentWordCount: contentLengthWc }) }); if (r.ok) setContentLengthResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setContentLengthLoading(false);
 }, [contentLengthKw, contentLengthWc]);

 const runCwvAdvisor = useCallback(async () => {
 if (!url.trim()) return;
 setCwvLoading(true); setCwvResult(null);
 try { const r = await apiFetchJSON(`${API}/technical/cwv-advisor`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setCwvResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setCwvLoading(false);
 }, [url]);

 const runPageSpeed = useCallback(async () => {
 if (!url.trim()) return;
 setPageSpeedLoading(true); setPageSpeedResult(null);
 try { const r = await apiFetchJSON(`${API}/technical/page-speed-advisor`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setPageSpeedResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setPageSpeedLoading(false);
 }, [url]);

 /* -- BATCH 5: CONTENT+ EXTENSIONS -------------------------------------- */
 const runTopicCluster = useCallback(async () => {
 if (!topicClusterSeed.trim()) return;
 setTopicClusterLoading(true); setTopicClusterResult(null);
 try { const r = await apiFetchJSON(`${API}/content/topic-cluster-builder`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ seed: topicClusterSeed }) }); if (r.ok) setTopicClusterResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setTopicClusterLoading(false);
 }, [topicClusterSeed]);

 const runVisualDiv = useCallback(async () => {
 if (!url.trim()) return;
 setVisualDivLoading(true); setVisualDivResult(null);
 try { const r = await apiFetchJSON(`${API}/content/visual-diversity`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setVisualDivResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setVisualDivLoading(false);
 }, [url]);

 const runTimeToValue = useCallback(async () => {
 if (!url.trim()) return;
 setTimeToValueLoading(true); setTimeToValueResult(null);
 try { const r = await apiFetchJSON(`${API}/content/time-to-value`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setTimeToValueResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setTimeToValueLoading(false);
 }, [url]);

 const runPruning = useCallback(async () => {
 if (!url.trim() && !pruningNiche.trim()) return;
 setPruningLoading(true); setPruningResult(null);
 try { const r = await apiFetchJSON(`${API}/content/content-pruning`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ siteUrl: url.trim(), niche: pruningNiche }) }); if (r.ok) setPruningResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setPruningLoading(false);
 }, [url, pruningNiche]);

 const runStatsCurator = useCallback(async () => {
 if (!statsCuratorNiche.trim()) return;
 setStatsCuratorLoading(true); setStatsCuratorResult(null);
 try { const r = await apiFetchJSON(`${API}/content/statistics-curator`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ niche: statsCuratorNiche }) }); if (r.ok) setStatsCuratorResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setStatsCuratorLoading(false);
 }, [statsCuratorNiche]);

 /* -- BATCH 5: KEYWORDS EXTENSIONS -------------------------------------- */
 const runLowDiff = useCallback(async () => {
 if (!lowDiffSeed.trim()) return;
 setLowDiffLoading(true); setLowDiffResult(null);
 try { const r = await apiFetchJSON(`${API}/keywords/low-difficulty-finder`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ seedKeyword: lowDiffSeed, siteDA: lowDiffDA }) }); if (r.ok) setLowDiffResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setLowDiffLoading(false);
 }, [lowDiffSeed, lowDiffDA]);

 const runCannibalization = useCallback(async () => {
 if (!cannibalDomain.trim()) return;
 setCannibalLoading(true); setCannibalResult(null);
 try { const r = await apiFetchJSON(`${API}/keywords/cannibalization-detector`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ domain: cannibalDomain }) }); if (r.ok) setCannibalResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setCannibalLoading(false);
 }, [cannibalDomain]);

 /* -- BATCH 6: SERP & CTR EXTENSIONS ----------------------------------- */
 const runNewsSeo = useCallback(async () => {
 if (!url.trim()) return;
 setNewsSeoLoading(true); setNewsSeoResult(null);
 try { const r = await apiFetchJSON(`${API}/serp/news-seo`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setNewsSeoResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setNewsSeoLoading(false);
 }, [url]);

 const runVideoSeo = useCallback(async () => {
 if (!url.trim() && !videoSeoKw.trim()) return;
 setVideoSeoLoading(true); setVideoSeoResult(null);
 try { const r = await apiFetchJSON(`${API}/serp/video-seo`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: url.trim(), videoKeyword: videoSeoKw.trim() }) }); if (r.ok) setVideoSeoResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setVideoSeoLoading(false);
 }, [url, videoSeoKw]);

 const runEntityOpt = useCallback(async () => {
 if (!entityOptKw.trim() && !entityOptName.trim()) return;
 setEntityOptLoading(true); setEntityOptResult(null);
 try { const r = await apiFetchJSON(`${API}/serp/entity-optimizer`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ keyword: entityOptKw, entityName: entityOptName, url: url.trim() }) }); if (r.ok) setEntityOptResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setEntityOptLoading(false);
 }, [entityOptKw, entityOptName, url]);

 const runReviewSchema6 = useCallback(async () => {
 if (!url.trim() && !reviewSchemaProduct.trim()) return;
 setReviewSchemaLoading(true); setReviewSchemaResult(null);
 try { const r = await apiFetchJSON(`${API}/serp/review-schema`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: url.trim(), productName: reviewSchemaProduct }) }); if (r.ok) setReviewSchemaResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setReviewSchemaLoading(false);
 }, [url, reviewSchemaProduct]);

 const runEventSchemaSeo = useCallback(async () => {
 if (!eventSchemaName.trim()) return;
 setEventSchemaLoading(true); setEventSchemaResult(null);
 try { const r = await apiFetchJSON(`${API}/serp/event-schema`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ eventName: eventSchemaName, eventDate: eventSchemaDate, eventLocation: eventSchemaLocation }) }); if (r.ok) setEventSchemaResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setEventSchemaLoading(false);
 }, [eventSchemaName, eventSchemaDate, eventSchemaLocation]);

 /* -- BATCH 6: SCHEMA & LINKS EXTENSIONS ------------------------------- */
 const runRedirectAudit = useCallback(async () => {
 if (!url.trim()) return;
 setRedirectAuditLoading(true); setRedirectAuditResult(null);
 try { const r = await apiFetchJSON(`${API}/schema/redirect-audit`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setRedirectAuditResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setRedirectAuditLoading(false);
 }, [url]);

 const runDupContent = useCallback(async () => {
 if (!url.trim()) return;
 setDupContentLoading(true); setDupContentResult(null);
 try { const r = await apiFetchJSON(`${API}/schema/duplicate-content`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setDupContentResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setDupContentLoading(false);
 }, [url]);

 const runHreflangAdvisor = useCallback(async () => {
 if (!url.trim()) return;
 setHreflangLoading(true); setHreflangResult(null);
 try { const r = await apiFetchJSON(`${API}/schema/hreflang`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: url.trim(), targetMarkets: hreflangMarkets }) }); if (r.ok) setHreflangResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setHreflangLoading(false);
 }, [url, hreflangMarkets]);

 const runMobileSeoAdvisor = useCallback(async () => {
 if (!url.trim()) return;
 setMobileSeoLoading(true); setMobileSeoResult(null);
 try { const r = await apiFetchJSON(`${API}/schema/mobile-seo`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setMobileSeoResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setMobileSeoLoading(false);
 }, [url]);

 /* -- BATCH 6: BACKLINKS EXTENSIONS ------------------------------------ */
 const runLinkGapV2 = useCallback(async () => {
 if (!linkGapDomain.trim()) return;
 setLinkGapLoading(true); setLinkGapResult(null);
 try { const r = await apiFetchJSON(`${API}/backlinks/link-gap`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ domain: linkGapDomain, competitors: linkGapCompetitors, niche: backlinkNiche }) }); if (r.ok) setLinkGapResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setLinkGapLoading(false);
 }, [linkGapDomain, linkGapCompetitors, backlinkNiche]);

 const runBrokenBacklinks = useCallback(async () => {
 if (!brokenBacklinksDomain.trim()) return;
 setBrokenBacklinksLoading(true); setBrokenBacklinksResult(null);
 try { const r = await apiFetchJSON(`${API}/backlinks/broken-backlinks`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ domain: brokenBacklinksDomain, niche: backlinkNiche }) }); if (r.ok) setBrokenBacklinksResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setBrokenBacklinksLoading(false);
 }, [brokenBacklinksDomain, backlinkNiche]);

 const runAnchorText = useCallback(async () => {
 if (!anchorTextDomain.trim()) return;
 setAnchorTextLoading(true); setAnchorTextResult(null);
 try { const r = await apiFetchJSON(`${API}/backlinks/anchor-text`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ domain: anchorTextDomain, niche: backlinkNiche }) }); if (r.ok) setAnchorTextResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setAnchorTextLoading(false);
 }, [anchorTextDomain, backlinkNiche]);

 const runLinkVelocity = useCallback(async () => {
 if (!linkVelocityDomain.trim()) return;
 setLinkVelocityLoading(true); setLinkVelocityResult(null);
 try { const r = await apiFetchJSON(`${API}/backlinks/link-velocity`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ domain: linkVelocityDomain, currentLinksPerMonth: linkVelocityRate, niche: backlinkNiche }) }); if (r.ok) setLinkVelocityResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setLinkVelocityLoading(false);
 }, [linkVelocityDomain, linkVelocityRate, backlinkNiche]);

 /* -- BATCH 6: A/B & REFRESH ------------------------------------------- */
 const runAbTest = useCallback(async () => {
 if (!url.trim()) return;
 setAbTestLoading(true); setAbTestResult(null);
 try { const r = await apiFetchJSON(`${API}/ab/ab-test-advisor`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setAbTestResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setAbTestLoading(false);
 }, [url]);

 const runContentRefresh = useCallback(async () => {
 if (!url.trim()) return;
 setContentRefreshLoading(true); setContentRefreshResult(null);
 try { const r = await apiFetchJSON(`${API}/ab/content-refresh`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setContentRefreshResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setContentRefreshLoading(false);
 }, [url]);

 const runTitleVariants = useCallback(async () => {
 if (!titleVariantsInput.trim() && !titleVariantsKw.trim()) return;
 setTitleVariantsLoading(true); setTitleVariantsResult(null);
 try { const r = await apiFetchJSON(`${API}/ab/title-variants`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ currentTitle: titleVariantsInput, keyword: titleVariantsKw }) }); if (r.ok) setTitleVariantsResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setTitleVariantsLoading(false);
 }, [titleVariantsInput, titleVariantsKw]);

 const runMetaVariants = useCallback(async () => {
 if (!url.trim() && !metaVariantsKw.trim()) return;
 setMetaVariantsLoading(true); setMetaVariantsResult(null);
 try { const r = await apiFetchJSON(`${API}/ab/meta-variants`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: url.trim(), keyword: metaVariantsKw }) }); if (r.ok) setMetaVariantsResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setMetaVariantsLoading(false);
 }, [url, metaVariantsKw]);

 const runBertOpt = useCallback(async () => {
 if (!bertOptKw.trim()) return;
 setBertOptLoading(true); setBertOptResult(null);
 try { const r = await apiFetchJSON(`${API}/ab/bert-optimizer`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ keyword: bertOptKw, url: url.trim() }) }); if (r.ok) setBertOptResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setBertOptLoading(false);
 }, [bertOptKw, url]);

 const runSecondaryKwFinder = useCallback(async () => {
 setSecondaryKwLoading(true); setSecondaryKwResult(null);
 try { const r = await apiFetchJSON(`${API}/ab/secondary-keywords`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ primaryKeyword: secondaryKwInput, url: url.trim() }) }); if (r.ok) setSecondaryKwResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setSecondaryKwLoading(false);
 }, [secondaryKwInput, url]);

 const runKnowledgeGraph = useCallback(async () => {
 if (!knowledgeGraphEntity.trim()) return;
 setKnowledgeGraphLoading(true); setKnowledgeGraphResult(null);
 try { const r = await apiFetchJSON(`${API}/ab/knowledge-graph`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ entityName: knowledgeGraphEntity, domain: url.trim(), industry: knowledgeGraphIndustry }) }); if (r.ok) setKnowledgeGraphResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setKnowledgeGraphLoading(false);
 }, [knowledgeGraphEntity, url, knowledgeGraphIndustry]);

 /* -- BATCH 6: TECHNICAL+ FURTHER EXTENSIONS --------------------------- */
 const runCrawlBudget = useCallback(async () => {
 if (!url.trim()) return;
 setCrawlBudgetLoading(true); setCrawlBudgetResult(null);
 try { const r = await apiFetchJSON(`${API}/technical/crawl-budget`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setCrawlBudgetResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setCrawlBudgetLoading(false);
 }, [url]);

 const runClickDepth = useCallback(async () => {
 if (!url.trim()) return;
 setClickDepthLoading(true); setClickDepthResult(null);
 try { const r = await apiFetchJSON(`${API}/technical/click-depth`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: url.trim() }) }); if (r.ok) setClickDepthResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setClickDepthLoading(false);
 }, [url]);

 const runLogFile = useCallback(async () => {
 if (!logSnippet.trim() && !url.trim()) return;
 setLogFileLoading(true); setLogFileResult(null);
 try { const r = await apiFetchJSON(`${API}/technical/log-file`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ logSnippet: logSnippet.trim(), domain: url.trim() }) }); if (r.ok) setLogFileResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setLogFileLoading(false);
 }, [logSnippet, url]);

 const runIntlSeo = useCallback(async () => {
 if (!url.trim() && !intlSeoMarkets.trim()) return;
 setIntlSeoLoading(true); setIntlSeoResult(null);
 try { const r = await apiFetchJSON(`${API}/technical/international-seo`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ url: url.trim(), targetMarkets: intlSeoMarkets }) }); if (r.ok) setIntlSeoResult(r); } catch(e) { showToast(e.message || "An error occurred"); }
 setIntlSeoLoading(false);
 }, [url, intlSeoMarkets]);

 const runRewrite = useCallback(async (field) => {
 if (!scanResult) return;
 setRewriteField(field); setRewriteLoading(true); setRewriteResult(null); setRewriteErr(null); setApplyResult({});
 try {
 let currentValue;
 if (field === "title") currentValue = scanResult.title;
 else if (field === "metaDescription") currentValue = scanResult.metaDescription;
 else if (field === "h1") currentValue = scanResult.h1;
 else if (field === "handle") {
 const art = shopifyArticles.find(a => String(a.id) === String(selectedArticleId));
 currentValue = art?.handle || scanResult.url?.split('/').filter(Boolean).pop() || '(generate from title)';
 } else if (field === "headings") {
 currentValue = scanResult.title || '(no title)';
 } else currentValue = scanResult.title;
 const r = await apiFetchJSON(`${API}/ai/rewrite`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ field, currentValue: currentValue || `(none generate a ${field} from scratch)`, keywords: kwInput, url: scanResult.url }) });
 if (r.ok) {
 const parsed = r.structured || (r.suggestions ? (() => { try { return JSON.parse(r.suggestions); } catch { return null; } })() : null);
 if (parsed) setRewriteResult(parsed);
 else setRewriteErr("AI returned an unexpected format. Please try again.");
 } else {
 setRewriteErr(r.error || (r.credit_error ? `Not enough credits (need ${r.credits_needed}, have ${r.credits_available})` : "Request failed. Please try again."));
 }
 } catch (e) {
 setRewriteErr(e.message || "Network error please try again.");
 }
 setRewriteLoading(false);
 }, [scanResult, kwInput, shopifyArticles, selectedArticleId]);

 /* -- PDF REPORT --------------------------------------------------------- */
 const downloadPdfReport = useCallback(() => {
 if (!scanResult) return;
 const r = scanResult;
 const score = r.scored?.overall ?? 0;
 const grade = r.scored?.grade ?? '-';
 const gradeColor = grade === 'A'? '#16a34a': grade === 'B'? '#ca8a04': grade === 'C'? '#d97706': '#dc2626';
 const scoreColor = score >= 75 ? '#16a34a': score >= 50 ? '#ca8a04': '#dc2626';
 const issueRows = (r.scored?.issues || []).map(i => {
 const sevColor = i.sev === 'high'? '#dc2626': i.sev === 'medium'? '#d97706': '#2563eb';
 return `<tr><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;"><span style="display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700;background:${sevColor};color:#fff">${i.sev.toUpperCase()}</span></td><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151">${i.msg}</td><td style="padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;text-align:right">-${i.impact}pts</td></tr>`;
 }).join('');
 const catCards = Object.entries(r.scored?.categories || {}).map(([cat, v]) => {
 const c = v.score >= 75 ? '#16a34a': v.score >= 50 ? '#ca8a04': '#dc2626';
 return `<div style="flex:1 1 130px;border:1px solid #e5e7eb;border-top:3px solid ${c};border-radius:8px;padding:12px;text-align:center"><div style="font-size:22px;font-weight:800;color:${c}">${v.score}</div><div style="font-size:11px;color:#6b7280;margin-top:4px;text-transform:uppercase;letter-spacing:.5px">${cat}<br><span style="font-size:10px">(${v.weight}%)</span></div></div>`;
 }).join('');
 const kwRows = r.keywordDensity ? Object.entries(r.keywordDensity).map(([kw, v]) => {
 const dc = v.density >= 0.5 && v.density <= 2.5 ? '#16a34a': v.density > 3 ? '#dc2626': '#ca8a04';
 return `<tr><td style="padding:5px 10px;border-bottom:1px solid #f3f4f6;font-size:13px">${kw}</td><td style="padding:5px 10px;border-bottom:1px solid #f3f4f6;font-size:13px;text-align:center">${v.count}</td><td style="padding:5px 10px;border-bottom:1px solid #f3f4f6;font-size:13px;text-align:center;color:${dc};font-weight:600">${v.density}%</td><td style="padding:5px 10px;border-bottom:1px solid #f3f4f6;font-size:13px;text-align:center">${r.keywordInTitle ? '': ''}</td><td style="padding:5px 10px;border-bottom:1px solid #f3f4f6;font-size:13px;text-align:center">${r.keywordInH1 ? '': ''}</td><td style="padding:5px 10px;border-bottom:1px solid #f3f4f6;font-size:13px;text-align:center">${r.keywordInMeta ? '': ''}</td></tr>`;
 }).join('') : '';
 const metaRow = (label, value, warn) => `<tr><td style="padding:6px 10px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#6b7280;font-weight:600;white-space:nowrap">${label}</td><td style="padding:6px 10px;border-bottom:1px solid #f3f4f6;font-size:13px;color:${warn ? '#dc2626': '#111827'}">${value || '<span style="color:#9ca3af"></span>'}</td></tr>`;
 const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>SEO Report ${r.url}</title><style>*{box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;color:#111827;background:#fff;padding:0;margin:0}@media print{body{padding:0}.no-print{display:none}}.page{max-width:900px;margin:0 auto;padding:32px 28px}.header{display:flex;align-items:center;justify-content:space-between;padding-bottom:20px;border-bottom:2px solid #e5e7eb;margin-bottom:24px}.logo{font-size:20px;font-weight:800;color:#4f46e5}.report-date{font-size:12px;color:#6b7280}.score-row{display:flex;align-items:center;gap:24px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:20px}.score-ring{width:72px;height:72px;border-radius:50%;border:4px solid ${scoreColor};display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:800;color:${scoreColor};flex-shrink:0}.grade-badge{width:44px;height:44px;border-radius:8px;background:${gradeColor};color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;flex-shrink:0}.meta-block{flex:1;min-width:0}.post-title{font-size:16px;font-weight:700;color:#111827;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.post-url{font-size:12px;color:#6b7280;word-break:break-all;margin-bottom:8px}.chips{display:flex;gap:10px;flex-wrap:wrap}.chip{display:flex;flex-direction:column;align-items:center;background:#f3f4f6;border-radius:8px;padding:6px 12px;font-size:11px;color:#6b7280}.chip b{font-size:14px;color:#111827}.section-title{font-size:14px;font-weight:700;color:#111827;text-transform:uppercase;letter-spacing:.5px;margin:24px 0 12px;padding-bottom:6px;border-bottom:2px solid #f3f4f6}.cats{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px}table{width:100%;border-collapse:collapse}th{text-align:left;padding:8px 10px;background:#f9fafb;font-size:11px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:.4px}footer{margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;display:flex;justify-content:space-between}</style></head><body><div class="page"><div class="header"><div class="logo"> AURA SEO Report</div><div class="report-date">Generated ${new Date().toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'})}</div></div><div class="score-row"><div class="score-ring">${score}</div><div class="grade-badge">${grade}</div><div class="meta-block"><div class="post-title">${r.title || '(no title)'}</div><div class="post-url">${r.url}</div><div class="chips"><div class="chip"><b>${r.wordCount ?? ''}</b>Words</div><div class="chip"><b>${r.readingTimeMinutes ?? ''} min</b>Reading</div><div class="chip"><b style="color:${(r.scored?.highIssues ?? 0) > 0 ? '#dc2626': '#16a34a'}">${r.scored?.issueCount ?? 0}</b>Issues</div><div class="chip"><b>${r.imageCount ?? ''}</b>Images</div><div class="chip"><b>${r.internalLinks ?? ''}</b>Int Links</div><div class="chip"><b>${r.pageSizeKB ?? ''}KB</b>Page Size</div></div></div></div><div class="section-title">Category Scores</div><div class="cats">${catCards}</div><div class="section-title">Meta &amp; Page Details</div><table><tbody>${metaRow('Title', r.title, !r.title)}${metaRow('H1', r.h1, !r.h1)}${metaRow('Meta Description', r.metaDescription, !r.metaDescription)}${metaRow('Canonical', r.canonicalUrl)}${metaRow('Author', r.authorMeta)}${metaRow('Published', r.datePublished)}${metaRow('OG Image', r.ogImage ? 'Set': 'Missing', !r.ogImage)}${metaRow('Twitter Card', r.hasTwitterCard ? ''+ r.twitterCard : 'Missing', !r.hasTwitterCard)}${metaRow('HTTPS', r.isHttps ? 'Yes': 'No', !r.isHttps)}</tbody></table>${kwRows ? `<div class="section-title">Keyword Density</div><table><thead><tr><th>Keyword</th><th>Count</th><th>Density</th><th>In Title</th><th>In H1</th><th>In Meta</th></tr></thead><tbody>${kwRows}</tbody></table>` : ''}<div class="section-title">All Issues (${r.scored?.issueCount ?? 0})</div><table><thead><tr><th>Severity</th><th>Issue</th><th>Impact</th></tr></thead><tbody>${issueRows}</tbody></table><footer><span>AURA Blog SEO Analyzer</span><span>${r.url}</span></footer></div><script>window.onload=function(){window.print();}<\/script></body></html>`;
 const w = window.open('', '_blank');
 if (w) { w.document.write(html); w.document.close(); }
 }, [scanResult]);

 /* -- KEYWORDS ----------------------------------------------------------- */
 const runKwResearch = useCallback(async () => {
 if (!seedKw.trim()) return;
 setKwLoading(true); setKwErr(""); setKwResearch(null);
 try {
 const r = await apiFetchJSON(`${API}/ai/keyword-research`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ seedKeyword: seedKw.trim(), niche: kwNiche.trim() || undefined }) });
 if (!r.ok) throw new Error(r.error || "Failed");
 const parsed = r.structured || (r.research ? (() => { try { return JSON.parse(r.research); } catch { return null; } })() : null);
 if (parsed) setKwResearch(parsed);
 else throw new Error("Unexpected response format from AI. Please try again.");
 } catch (e) { setKwErr(e.message); }
 setKwLoading(false);
 }, [seedKw, kwNiche]);

 /* -- CONTENT BRIEF ------------------------------------------------------ */
 const runBrief = useCallback(async () => {
 if (!briefTopic.trim() && !briefPrimary.trim()) return;
 setBriefLoading(true); setBriefErr(""); setBriefResult(null);
 try {
 const r = await apiFetchJSON(`${API}/ai/content-brief`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ topic: briefTopic.trim(), primaryKeyword: briefPrimary.trim(), secondaryKeywords: briefSecondary.split(",").map(s => s.trim()).filter(Boolean) }) });
 if (!r.ok) throw new Error(r.error || "Failed");
 const parsed = r.structured || (r.brief ? (() => { try { return JSON.parse(r.brief); } catch { return null; } })() : null);
 if (parsed) setBriefResult(parsed);
 else throw new Error("Unexpected response format from AI. Please try again.");
 } catch (e) { setBriefErr(e.message); }
 setBriefLoading(false);
 }, [briefTopic, briefPrimary, briefSecondary]);

 /* -- BULK SCAN ---------------------------------------------------------- */
 const runBulk = useCallback(async () => {
 const urls = bulkUrls.split("\n").map(u => u.trim()).filter(Boolean);
 if (!urls.length) return;
 setBulkLoading(true); setBulkErr(""); setBulkResult(null);
 try {
 const r = await apiFetchJSON(`${API}/bulk-analyze`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ urls, keywords: bulkKw.trim() }) });
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
 const r = await apiFetchJSON(`${API}/ai/generate`, { method: "POST", headers: { "Content-Type": "application/json"}, body: JSON.stringify({ messages: [...chatMessages, userMsg] }) });
 if (r.ok && r.reply) setChatMessages(p => [...p, { role: "assistant", content: r.reply }]);
 else setChatMessages(p => [...p, { role: "assistant", content: ` ${r.error || "AI request failed. Please try again."}`, isError: true }]);
 } catch (e) { setChatMessages(p => [...p, { role: "assistant", content: ` ${e.message || "Network error. Please try again."}`, isError: true }]); }
 setChatLoading(false);
 setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth"}), 100);
 }, [chatInput, chatMessages]);

 /* -- HISTORY ------------------------------------------------------------ */
 const loadHistory = useCallback(async () => {
 setHistoryLoading(true);
 try {
 const r = await apiFetchJSON(`${API}/items`);
 if (r.ok) setHistory(r.items || []);
 } catch(e) { showToast(e.message || "An error occurred"); }
 setHistoryLoading(false);
 }, []);

 const deleteHistory = useCallback(async (id) => {
 try { await apiFetch(`${API}/items/${id}`, { method: "DELETE"}); } catch(e) { showToast(e.message || "An error occurred"); }
 setHistory(p => p.filter(h => h.id !== id));
 }, []);

 useEffect(() => { if (tab === "History"|| section === "History") loadHistory(); }, [tab, section]);

 /* -- Auto-scan after home article pick (fires once url state has updated) -- */
 useEffect(() => {
 if (autoScanPending && url) {
 setAutoScanPending(false);
 runScan();
 }
 }, [autoScanPending, url, runScan]);

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
 } catch(e) { showToast(e.message || "An error occurred"); }
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

 // Keywords tab seed from article title, niche from blog
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

 // Bulk Scan tab add article URL
 setBulkUrls(prev => prev ? prev + '\n'+ art.url : art.url);

 // Schema/org tab use shop domain as org URL
 if (shopDomain) setOrgUrl(`https://${shopDomain}`);
 if (!orgName && shopDomain) setOrgName(shopDomain.replace('.myshopify.com', ''));
 }, [shopifyArticles, shopDomain, orgName]);


 const issues = scanResult?.scored?.issues || [];
 const SEV_ORDER = { high: 0, medium: 1, low: 2 };
 const filteredIssues = issues.filter(i => (filterCat === "all"|| i.cat === filterCat) && (filterSev === "all"|| i.sev === filterSev)).sort((a, b) => (SEV_ORDER[a.sev] ?? 3) - (SEV_ORDER[b.sev] ?? 3));

 // Maps a rewrite field name to a function that detects matching issue messages.
 // Used to auto-dismiss issue cards after a successful apply.
 const isIssueForField = (field, msg) => {
 const m = (msg || '').toLowerCase();
 if (field === 'headings') return (m.includes('h2') || m.includes('subheading') || m.includes('subhead')) && (m.includes('no ') || m.includes('missing') || m.includes('lack') || m.includes('needs') || m.includes('structure') || m.includes('clear'));
 if (field === 'handle') return m.includes('keyword') && (m.includes('url') || m.includes('slug') || m.includes('handle'));
 if (field === 'title') return m.includes('title') && (m.includes('missing') || m.includes('short') || m.includes('long') || m.includes('keyword'));
 if (field === 'metaDescription') return m.includes('meta desc') || (m.includes('meta') && m.includes('description'));
 if (field === 'h1') return m.includes('h1') && (m.includes('missing') || m.includes('no h1') || m.includes('keyword') || m.includes('multiple'));
 return false;
 };

 const getIssueHint = (msg) => {
 const m = (msg || '').toLowerCase();
 if ((m.includes('meta description') || m.includes('meta desc')) && (m.includes('missing') || m.includes('no meta') || m.includes('empty') || m.includes('0/160') || m.includes('not set')))
 return { hint: 'Write a 150-160 character summary with your target keyword naturally included. This is the text shown in Google results.', label: 'Write Meta Description', action: () => runRewrite('metaDescription') };
 if (m.includes('meta description') || m.includes('meta desc'))
 return { hint: 'Your meta description affects click-through rate from Google. Keep it 150-160 chars and include your primary keyword.', label: 'Rewrite Meta', action: () => runRewrite('metaDescription') };
 if (m.includes('title') && (m.includes('short') || m.includes('too few') || m.includes('below')))
 return { hint: 'Aim for 50-60 characters. Put your primary keyword near the start, add a benefit or hook to improve clicks.', label: 'Rewrite Title', action: () => runRewrite('title') };
 if (m.includes('title') && (m.includes('long') || m.includes('truncat') || m.includes('exceeds') || m.includes('over 60')))
 return { hint: 'Google cuts titles over ~60 characters in search results. Remove filler words and keep your keyword + main benefit.', label: 'Shorten Title', action: () => runRewrite('title') };
 if (m.includes('title') && (m.includes('keyword') || m.includes('not in title') || m.includes('missing from')))
 return { hint: 'Place your primary keyword in the first 60 characters of the title ideally as close to the start as possible.', label: 'Rewrite Title', action: () => runRewrite('title') };
 if (m.includes('title') && (m.includes('missing') || m.includes('no title')))
 return { hint: 'Every page needs a unique title tag (50-60 chars) with your target keyword near the start.', label: 'Write Title', action: () => runRewrite('title') };
 if (m.includes('h1') && (m.includes('missing') || m.includes('no h1') || m.includes('0 h1')))
 return { hint: 'Add one H1 at the top of your post body with your primary keyword. In Shopify blogs, check your theme sometimes it auto-generates the H1 from the post title.', label: 'Generate H1', action: () => runRewrite('h1') };
 if (m.includes('h1') && (m.includes('multiple') || m.includes('h1 tags found') || m.includes('more than one')))
 return { hint: 'Only one H1 per page. Open your post editor, change extra H1s to H2 or H3.', label: 'Fix H1', action: () => runRewrite('h1') };
 if (m.includes('h1') && m.includes('align'))
 return { hint: 'Your title tag and H1 should share key terms. Edit one to match the other Google uses both to understand your topic.', label: 'Align H1 & Title', action: () => runRewrite('h1') };
 if (m.includes('word count') || (m.includes('words') && (m.includes('short') || m.includes('low') || m.includes('below') || m.includes('thin') || m.includes('only') || m.includes('minimum') || m.includes('should be'))))
 return { hint: 'Posts under 800 words are often seen as thin content. Add an FAQ, step-by-step guide, examples, or expand each section to reach 1,200+ words.', label: 'Expand with AI', action: () => { if (simpleMode) { setSimpleFlow('write'); setSimpleTopics(null); setSimpleTopicsLoading(true); setSimpleDraftResult(null); setSimpleDraftLoading(false); (async () => { try { const niche = shopDomain ? shopDomain.replace('.myshopify.com','').replace(/-/g,'') : (shopifyProducts[0]?.title || 'e-commerce'); const resp = await apiFetch(`${API}/ai/topic-miner`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({niche, targetAudience:'online shoppers'}) }); const d = await resp.json(); if (d.ok && d.blogIdeas) setSimpleTopics(d.blogIdeas.slice(0,3)); else setSimpleTopics([]); } catch(e) { setSimpleTopics([]); } setSimpleTopicsLoading(false); })(); } else { setSection('Write'); setTab('AI Create'); } } };
 if (m.includes('author'))
 return { hint: 'Add a visible author byline and include author details in your Schema markup. This strengthens E-E-A-T signals Google uses to assess expertise and trustworthiness.', label: 'Add Author', action: () => { setSimpleMode(false); setSection('Local'); setTab('E-E-A-T & Brand'); } };
 if (m.includes('date') || m.includes('freshness') || m.includes('publish') || m.includes('modified'))
 return { hint: 'Freshness matters for blog rankings. Add datePublished and dateModified to your Schema markup so Google can accurately assess how current your content is.', label: 'Add Schema', action: () => { setSimpleMode(false); setSection('Schema'); setTab('Schema & Links'); } };
 if (m.includes('schema') || m.includes('structured data') || m.includes('json-ld'))
 return { hint: 'Add Article or BlogPosting schema to help Google display rich results. Use the Schema tool to generate and add it with one click.', label: 'Add Schema', action: () => { setSimpleMode(false); setSection('Schema'); setTab('Schema & Links'); } };
 if (m.includes('internal link'))
 return { hint: 'Link to 2-5 related posts or product pages within your store. It helps Google discover pages and keeps readers engaged longer.', label: 'Internal Links', action: () => { setSimpleMode(false); setSection('Backlinks'); setTab('Backlinks'); } };
 if (m.includes('image') && (m.includes('alt') || m.includes('missing alt')))
 return { hint: 'Add descriptive alt text to every image. Describe whats in the image, include your keyword where it fits naturally. Keep it under 125 characters.', label: 'Fix Image Alt', action: () => { setSimpleMode(false); setSection('Technical'); setTab('Technical+'); } };
 if (m.includes('canonical'))
 return { hint: 'Add a self-referencing canonical tag in your page <head>: <link rel="canonical"href="YOUR-PAGE-URL">. In Shopify, edit your theme or use a meta fields app.', label: 'Technical SEO', action: () => { setSimpleMode(false); setSection('Technical'); setTab('Technical+'); } };
 if (m.includes('robots') || m.includes('noindex') || m.includes('blocked'))
 return { hint: 'Check your robots.txt file and any noindex meta tags. Make sure the page is not accidentally blocked from search crawlers.', label: 'Check Technical', action: () => { setSimpleMode(false); setSection('Technical'); setTab('Technical+'); } };
 if (m.includes('https') || m.includes('mixed content') || m.includes('http:'))
 return { hint: 'All resources (images, scripts, stylesheets) must load over HTTPS. Mixed content warnings hurt trust and rankings.', label: 'Technical SEO', action: () => { setSimpleMode(false); setSection('Technical'); setTab('Technical+'); } };
 if (m.includes('heading') && (m.includes('jump') || m.includes('skip') || m.includes('level')))
 return { hint: 'Headings must flow in order: H1 \u2192 H2 \u2192 H3. Open your post editor and promote/demote any headings that skip a level.', label: 'Optimize Post', action: () => { setSection('Optimize'); setTab('Content+'); } };
 if (m.includes('sentence') || m.includes('passive voice'))
 return { hint: 'Shorten sentences to under 20 words. Replace passive constructions ("was done by") with active voice ("we did"). Use the Optimize tool to scan and fix.', label: 'Optimize Content', action: () => { setSection('Optimize'); setTab('Content+'); } };
 if (m.includes('paragraph') && (m.includes('long') || m.includes('exceed') || m.includes('words')))
 return { hint: 'Break large paragraphs into 2-4 sentence chunks. Google and readers both prefer scannable content with clear visual breaks.', label: 'Optimize Content', action: () => { setSection('Optimize'); setTab('Content+'); } };
 if (m.includes('transition'))
 return { hint: 'Add linking words like however, therefore, in addition, as a result to improve flow. Yoast recommends \u226530% of sentences start with a transition word.', label: 'Optimize Content', action: () => { setSection('Optimize'); setTab('Content+'); } };
 if (m.includes('og:') || m.includes('open graph') || m.includes('twitter card') || m.includes('social'))
 return { hint: 'Add Open Graph tags to your theme: og:title, og:description, og:image. This controls how your post appears when shared on social media.', label: 'Technical SEO', action: () => { setSimpleMode(false); setSection('Technical'); setTab('Technical+'); } };
 if (m.includes('backlink') || m.includes('link build'))
 return { hint: 'Build links by writing guest posts, creating share-worthy resources, or getting listed in niche directories. Use the Backlinks tool to find opportunities.', label: 'Backlinks', action: () => { setSimpleMode(false); setSection('Backlinks'); setTab('Backlinks'); } };
 if (m.includes('keyword') && (m.includes('density') || m.includes('stuffing') || m.includes('repeated')))
 return { hint: 'Reduce exact keyword repeats. Use natural synonyms and related phrases. Aim for 1-2% keyword density use the Keywords tool to check.', label: 'Find Keywords', action: () => { setSection('Keywords'); setTab('Keywords'); } };
 if (m.includes('keyword') && (m.includes('missing') || m.includes('not found') || m.includes('absent')))
 return { hint: 'Include your target keyword in the first paragraph and at least 2-3 more times naturally throughout the post.', label: 'Keywords', action: () => { setSection('Keywords'); setTab('Keywords'); } };
 if (m.includes('keyword') && (m.includes('url') || m.includes('slug') || m.includes('handle')))
 return { hint: 'The URL slug should contain your primary keyword. AI will generate clean keyword-rich slugs you can apply directly to Shopify with one click.', label: 'Fix URL Slug', action: () => runRewrite('handle') };
 if ((m.includes('h2') || m.includes('subheading') || m.includes('sub-heading') || m.includes('subhead')) && (m.includes('no ') || m.includes('missing') || m.includes('lack') || m.includes('needs') || m.includes('structure') || m.includes('clear')))
 return { hint: 'H2 headings break up your post and signal topic structure to Google. AI will suggest 4-6 H2s you can paste into your post editor.', label: 'Suggest H2s', action: () => runRewrite('headings') };
 if (m.includes('faq') || (m.includes('question') && m.includes('answer')))
 return { hint: 'Adding an FAQ section helps target voice search and question-based queries. Expand with the AI Optimize tools.', label: 'Optimize Content', action: () => { setSection('Optimize'); setTab('Content+'); } };
 if (m.includes('reading') || m.includes('readability') || m.includes('flesch'))
 return { hint: 'Aim for a reading level accessible to your audience. Use shorter sentences, simpler words, and active voice.', label: 'Optimize Content', action: () => { setSection('Optimize'); setTab('Content+'); } };
 return null;
 };

