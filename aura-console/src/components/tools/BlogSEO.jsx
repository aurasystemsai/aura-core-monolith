import React, { useState, useRef, useCallback, useEffect } from "react";
import { apiFetch, apiFetchJSON } from "../../api";
import { useCreditError } from "../../globalCreditError";
import { useCredits, ACTION_COSTS } from "../../hooks/useCredits";
import BackButton from "./BackButton";

const API = "/api/blog-seo";

/* ── Design tokens ── */
const C = {
 bg: "#09090b",
 surface: "#18181b",
 border: "#27272a",
 muted: "#3f3f46",
 text: "#fafafa",
 sub: "#a1a1aa",
 dim: "#71717a",
 indigo: "#4f46e5",
 indigoL: "#818cf8",
 green: "#22c55e",
 yellow: "#eab308",
 red: "#ef4444",
 amber: "#f59e0b",
};

/* ── Shared style helpers ── */
const S = {
 page: { minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", paddingBottom: 64 },
 topBar: { display: "flex", alignItems: "center", gap: 12, padding: "18px 28px 0", flexWrap: "wrap" },
 title: { fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" },
 badge: { fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 999, background: C.indigo, color: "#fff" },
 body: { maxWidth: 1100, margin: "0 auto", padding: "0 24px" },
 card: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 16 },
 row: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
 input: { flex: 1, minWidth: 200, padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.muted}`, background: C.bg, color: C.text, fontSize: 14, outline: "none" },
 textarea: { width: "100%", minHeight: 100, padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.muted}`, background: C.bg, color: C.text, fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit" },
 btn: (v) => {
 const base = { padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none", transition: "all .15s" };
 if (v === "primary") return { ...base, background: C.indigo, color: "#fff" };
 if (v === "danger") return { ...base, background: "#7f1d1d", color: "#fca5a5" };
 if (v === "success") return { ...base, background: "#14532d", color: "#86efac" };
 return { ...base, background: C.muted, color: "#d4d4d8" };
 },
 spinner: { display: "inline-block", width: 16, height: 16, border: `2px solid ${C.muted}`, borderTop: `2px solid ${C.indigo}`, borderRadius: "50%", animation: "spin .7s linear infinite" },
 err: { background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 10, padding: "14px 18px", color: "#fca5a5", fontSize: 13, marginBottom: 12 },
 empty: { textAlign: "center", padding: "48px 20px", color: C.dim },
 pill: (sev) => ({ display: "inline-block", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: sev === "high" ? "#7f1d1d" : sev === "medium" ? "#713f12" : "#1e3a5f", color: sev === "high" ? "#fca5a5" : sev === "medium" ? "#fbbf24" : "#93c5fd" }),
 score: (s) => ({ color: s >= 75 ? C.green : s >= 50 ? C.yellow : C.red }),
 ring: (s) => ({ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, borderRadius: "50%", fontSize: 22, fontWeight: 800, border: `3px solid ${s >= 75 ? C.green : s >= 50 ? C.yellow : C.red}`, color: s >= 75 ? C.green : s >= 50 ? C.yellow : C.red }),
 sidebar: { width: 220, flexShrink: 0, borderRight: `1px solid ${C.surface}`, paddingTop: 12, paddingBottom: 32, position: "sticky", top: 0, maxHeight: "100vh", overflowY: "auto" },
 sItem: (a) => ({ padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: a ? 600 : 400, background: a ? "#1e1b4b" : "transparent", color: a ? "#c4b5fd" : C.sub, borderLeft: a ? `3px solid ${C.indigoL}` : "3px solid transparent", marginBottom: 2, transition: "all .15s" }),
 sHead: { fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "1px", padding: "14px 14px 4px" },
 layout: { display: "flex", alignItems: "flex-start", minHeight: "calc(100vh - 72px)" },
 main: { flex: 1, minWidth: 0, padding: "0 28px 64px", maxWidth: 960 },
};

/* ── Section registry ─────────────────────────────────────────────────────
 level: "beginner" shows in simple mode; "advanced" hidden until expert mode
 tab must exactly match the tab === "..." checks in the render section
── */
const SECTIONS = [
 { id: "Analyze", title: "Analyze a Post", desc: "Full SEO score for any blog post. See exactly what to fix.", color: "#4f46e5", level: "beginner", tab: "Analyzer" },
 { id: "Keywords", title: "Find Keywords", desc: "Discover the best keywords for your topic instantly.", color: "#0891b2", level: "beginner", tab: "Keywords" },
 { id: "Write", title: "Write with AI", desc: "AI writes a full blog post, outline or intro for you.", color: "#059669", level: "beginner", tab: "AI Create" },
 { id: "Optimize", title: "Improve a Post", desc: "Specific tips to improve any post and boost its ranking.", color: "#d97706", level: "beginner", tab: "Content+" },
 { id: "Chat", title: "Ask AI", desc: "Chat with an SEO expert AI. Get instant tailored advice.", color: "#be185d", level: "beginner", tab: "AI Chat" },
 { id: "BulkScan", title: "Scan Multiple Posts", desc: "Audit all blog posts at once to find what needs work.", color: "#0f766e", level: "beginner", tab: "Bulk Scan" },
 { id: "History", title: "History", desc: "Browse past scans and revisit previous reports.", color: "#475569", level: "beginner", tab: "History" },
 { id: "SmartFix", title: "Auto-Optimize Post", desc: "AI runs every fix automatically — title, meta, schema, links — one click.", color: "#7c3aed", level: "beginner", tab: "Auto Fix" },
 { id: "Technical", title: "Technical SEO", desc: "Core Web Vitals, crawl issues, indexing, speed.", color: "#7c3aed", level: "advanced", tab: "Technical+" },
 { id: "Schema", title: "Schema & Links", desc: "Generate JSON-LD schema markup. Audit redirects.", color: "#1d4ed8", level: "advanced", tab: "Schema" },
 { id: "SERP", title: "SERP & CTR", desc: "Featured snippets, click-through rate optimisation.", color: "#0e7490", level: "advanced", tab: "SERP & CTR" },
 { id: "Backlinks", title: "Internal Links", desc: "Find which pages on your site to link to from this post.", color: "#b45309", level: "advanced", tab: "Internal Links" },
 { id: "AB", title: "A/B & Content Refresh", desc: "Test title variants, refresh stale content.", color: "#374151", level: "advanced", tab: "A/B Refresh" },
 { id: "Local", title: "Local & E-E-A-T", desc: "Local SEO, author authority, brand mentions.", color: "#065f46", level: "advanced", tab: "E-E-A-T" },
 { id: "Voice", title: "Voice & AI Search", desc: "Optimise for voice queries and AI overviews.", color: "#6d28d9", level: "advanced", tab: "Voice" },
 { id: "AIGrowth", title: "AI Growth Tools", desc: "Content calendar, pillar pages, ROI estimator.", color: "#0f766e", level: "advanced", tab: "AI Growth" },
 { id: "Rank", title: "Rank Tracker", desc: "Track keyword positions, GSC import, forecasts.", color: "#1d4ed8", level: "advanced", tab: "Rank Tracker"},
 { id: "Crawl", title: "Site Crawl", desc: "Full crawler: broken links, orphan pages, duplicates.", color: "#7c3aed", level: "advanced", tab: "Site Crawl" },
 { id: "GEO", title: "GEO & LLM Search", desc: "AI health scores, prompt simulation, llms.txt.", color: "#dc2626", level: "advanced", tab: "GEO & LLM" },
 { id: "Trends", title: "Trend Scout", desc: "Rising topics, seasonal planner, keyword surge.", color: "#d97706", level: "advanced", tab: "Trends" },
];
/* ═══════════════════════════════════════════════════════════════════════════
 COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function BlogSEO() {
 const { balance: creditsBalance, unlimited: creditsUnlimited } = useCredits();

 /* ── Navigation state ── */
 const [section, setSection] = useState("Posts"); // "Posts" = default home
 const [expertMode, setExpertMode] = useState(false); // false = beginner
 const [postSearch, setPostSearch] = useState(""); // article table search

 /* ── Simple-mode flow ── */
 const [simpleFlow, setSimpleFlow] = useState(null); // null | 'fix' | 'write'
 const [simpleTopics, setSimpleTopics] = useState(null);
 const [simpleTopicsLoading, setSimpleTopicsLoading] = useState(false);

 /* ── Credit error modal ── */
 const [creditErr, dismissCreditErr] = useCreditError();

 /* ── Toast ── */
 const [toast, setToast] = useState(null);
 const toastTimer = useRef(null);
 const showToast = useCallback((msg) => {
 setToast(msg);
 clearTimeout(toastTimer.current);
 toastTimer.current = setTimeout(() => setToast(null), 4000);
 }, []);

 /* ── Shopify store data ── */
 const [shopDomain, setShopDomain] = useState("");
 const [articles, setArticles] = useState([]);
 const [products, setProducts] = useState([]);
 const [shopLoading, setShopLoading] = useState(false);
 const [selectedArtId, setSelectedArtId] = useState("");

 /* ── Analyzer state ── */
 const [url, setUrl] = useState("");
 const [kwInput, setKwInput] = useState("");
 const [scanning, setScanning] = useState(false);
 const [scanErr, setScanErr] = useState("");
 const [scanResult, setScanResult] = useState(null);
 const [scannedArtId, setScannedArtId] = useState(null);
 const [scannedBlogId,setScannedBlogId]= useState(null);
 const [aiAnalysis, setAiAnalysis] = useState(null);
 const [aiAnalyzing, setAiAnalyzing] = useState(false);
 const [aiAnalysisErr,setAiAnalysisErr]= useState(null);
 const [rewriteField, setRewriteField] = useState(null);
 const [rewriting, setRewriting] = useState(false);
 const [rewriteResult,setRewriteResult]= useState(null);
 const [rewriteErr, setRewriteErr] = useState(null);
 const [applyState, setApplyState] = useState({}); // {idx: "loading"|"ok"|"error:..."}
 const [fixedFields, setFixedFields] = useState(new Set());
 const [autoScanPend, setAutoScanPend] = useState(false);

 /* ── Analyze multi-screen flow ── */
 const [analyzeScreen, setAnalyzeScreen] = useState('input'); // 'input'|'scanning'|'results'
 const [analyzeProgress, setAnalyzeProgress] = useState(0);
 const [analyzeProgressLabel,setAnalyzeProgressLabel]= useState('Crawling URL...');
 const analyzeProgressRef = useRef(null);

 /* ── Keywords state ── */
 const [seedKw, setSeedKw] = useState("");
 const [kwNiche, setKwNiche] = useState("");
 const [kwResult, setKwResult] = useState(null);
 const [kwLoading, setKwLoading] = useState(false);
 const [kwErr, setKwErr] = useState("");

 /* ── Write / AI Create state ── */
 const [outlineKw, setOutlineKw] = useState("");
 const [sharedAudience, setSharedAudience] = useState("");
 const [outlineResult, setOutlineResult] = useState(null);
 const [editingSection, setEditingSection] = useState(null);
 const [outlineLoading, setOutlineLoading] = useState(false);
 const [introKw, setIntroKw] = useState("");
 const [introStyle, setIntroStyle] = useState("conversational");
 const [introResult, setIntroResult] = useState(null);
 const [introLoading, setIntroLoading] = useState(false);
 const [titleKw, setTitleKw] = useState("");
 const [titleResult, setTitleResult] = useState(null);
 const [titleLoading, setTitleLoading] = useState(false);
 const [draftKw, setDraftKw] = useState("");
 const [draftLoading, setDraftLoading] = useState(false);
 const [draftResult, setDraftResult] = useState(null);
 const [draftErr, setDraftErr] = useState("");
 const [briefTopic, setBriefTopic] = useState("");
 const [briefPrimary, setBriefPrimary] = useState("");
 const [briefResult, setBriefResult] = useState(null);
 const [briefLoading, setBriefLoading] = useState(false);
 const [briefErr, setBriefErr] = useState("");
 const [selectedTitle, setSelectedTitle] = useState("");
 const [selectedIntro, setSelectedIntro] = useState("");
 const [writeSub, setWriteSub] = useState("brief");
 const [writeMode, setWriteMode] = useState("beginner"); // "beginner" | "advanced"
 /* ── Advanced mode extra controls ── */
 const [draftTone, setDraftTone] = useState("conversational");
 const [draftNiche, setDraftNiche] = useState("");
 const [draftWordCount, setDraftWordCount] = useState(1500);
 const [outlineTone, setOutlineTone] = useState("professional");
 const [outlineSections, setOutlineSections] = useState("medium"); // small|medium|large
 const [outlineViewRaw, setOutlineViewRaw] = useState(false);
 
 const [titleCount, setTitleCount] = useState(10);
 const [titleFormula, setTitleFormula] = useState("all");
 const [titleNiche, setTitleNiche] = useState("");
 
 const [briefSecondary, setBriefSecondary] = useState("");
 
 const [briefTone, setBriefTone] = useState("professional");
 /* ── AI field-suggest (shared across all sub-tabs) ── */
 const [sfLoading, setSfLoading] = useState(false);
 const [sfLoadingKey, setSfLoadingKey] = useState("");
 /* ── Images tab ── */
 const [imgTopic, setImgTopic] = useState("");
 const [imgResult, setImgResult] = useState(null);
 const [imgLoading, setImgLoading] = useState(false);
 const [imgErr, setImgErr] = useState("");
 const [generatedImages, setGeneratedImages] = useState({});
 const [imgGenLoading, setImgGenLoading] = useState({});
 /* ── Repurpose tab ── */
 const [repTopic, setRepTopic] = useState("");
 const [repSummary, setRepSummary] = useState("");
 const [repResult, setRepResult] = useState(null);
 const [repLoading, setRepLoading] = useState(false);
 const [repErr, setRepErr] = useState("");
 const [repPlatform, setRepPlatform] = useState("twitter");
 /* ── Tags & Schema tab ── */
 const [tagsTopic, setTagsTopic] = useState("");
 const [tagsResult, setTagsResult] = useState(null);
 const [tagsLoading, setTagsLoading] = useState(false);
 const [tagsErr, setTagsErr] = useState("");
 const [tagsSchemaView, setTagsSchemaView] = useState("tags"); // "tags"|"faq"|"schema"
 /* ── SEO Score tab ── */
 const [seoTopic, setSeoTopic] = useState("");
 const [seoContent, setSeoContent] = useState("");
 const [seoResult, setSeoResult] = useState(null);
 const [seoLoading, setSeoLoading] = useState(false);
 const [seoErr, setSeoErr] = useState("");
 /* ── Beginner quick-draft state ── */
 const [quickTopic, setQuickTopic] = useState("");
 const [quickResult, setQuickResult] = useState(null);
 const [quickLoading, setQuickLoading] = useState(false);
 const [quickErr, setQuickErr] = useState("");
 const [quickViewRaw, setQuickViewRaw] = useState(false);

 /* ── Generate Article flow ── */
 const [showGenModal, setShowGenModal] = useState(false);
 const [genKwMode, setGenKwMode] = useState("ai"); // "manual" | "ai"
 const [genShopSuggestions, setGenShopSuggestions] = useState([]); // from shop products
 const [genSuggestionsLoading, setGenSuggestionsLoading] = useState(false);
 const [genKeywords, setGenKeywords] = useState([]); // tag array
 const [genKwInput, setGenKwInput] = useState(""); // text field
 const [genKwLoading, setGenKwLoading] = useState(false); // AI keyword expansion
 const [genTitleLoading, setGenTitleLoading] = useState(false); // title generation
 const [genModalErr, setGenModalErr] = useState("");
 const [genCoverImage, setGenCoverImage] = useState("ai-1:1"); // cover image option
 const [genLanguage, setGenLanguage] = useState("en-US"); // article language
 const [genAiResearch, setGenAiResearch] = useState(false); // AI web research toggle

 /* ── WriteFlow page (Title & Outline) ── */
 const [wfKeywords, setWfKeywords] = useState([]);
 const [wfTitles, setWfTitles] = useState([]);
 const [wfPickedTitle, setWfPickedTitle] = useState("");
 const [wfOutlines, setWfOutlines] = useState([]);
 const [wfOutlineLoading, setWfOutlineLoading] = useState(false);
 const [wfOutlineSize, setWfOutlineSize] = useState("medium"); // small|medium|long
 const [wfConclusion, setWfConclusion] = useState(true);
 const [wfFaqs, setWfFaqs] = useState(true);
 const [wfTitleLoading, setWfTitleLoading] = useState(false);
 const [wfGenerating, setWfGenerating] = useState(false);
 const [wfErr, setWfErr] = useState("");

 /* ── WriteResult page ── */
 const [wfResult, setWfResult] = useState(null);
 const [wfCoverErr, setWfCoverErr] = useState(""); // error from DALL-E cover gen
 const [wfCoverGenerating,setWfCoverGenerating]= useState(false); // spinner while DALL-E runs
 const [wfPublishing, setWfPublishing] = useState(false);
 const [wfPublishOk, setWfPublishOk] = useState(null);
 const [wfPublishErr, setWfPublishErr] = useState("");
 const [wfIsFixing, setWfIsFixing] = useState({}); // {issueIdx: 'loading'|'ok'|'err'}
 const [wfMetaDesc, setWfMetaDesc] = useState("");
 const [wfOgTags, setWfOgTags] = useState(null); // { title, description }
 const [wfTwitterTags, setWfTwitterTags] = useState(null); // { title, description }
 const [wfProgress, setWfProgress] = useState(0);
 const [wfProgressLabel, setWfProgressLabel] = useState("Writing Article");
 const [wfSchemaOpen, setWfSchemaOpen] = useState(false);
 const [wfFaqSchemaOpen, setWfFaqSchemaOpen] = useState(false);
 const [wfSeoScore, setWfSeoScore] = useState(null); // {overall, cats, issues}
 const [wfSeoLoading, setWfSeoLoading] = useState(false);
 const [wfSeoOpen, setWfSeoOpen] = useState(true); // sidebar panel open
 const wfProgressRef = useRef(null);
 const wfEditRef = useRef(null); // contentEditable article div

 /* ── WriteFlow: Cover Image state ── */
 const [wfCoverModalOpen, setWfCoverModalOpen] = useState(false);
 const [wfCoverTab, setWfCoverTab] = useState('ai'); // 'unsplash' | 'ai' | 'upload'
 const [wfCoverImg, setWfCoverImg] = useState(null); // { url, alt, source }
 const [wfCoverAiPrompt, setWfCoverAiPrompt] = useState('');
 const [wfCoverAiRatio, setWfCoverAiRatio] = useState('1:1');
 const [wfCoverAiLoading, setWfCoverAiLoading] = useState(false);
 const [wfCoverAiPreview, setWfCoverAiPreview] = useState(null);
 const [wfCoverAltDraft, setWfCoverAltDraft] = useState('');
 const [wfUnsplashQuery, setWfUnsplashQuery] = useState('');
 const [wfUnsplashResults, setWfUnsplashResults] = useState([]);
 const [wfUnsplashLoading, setWfUnsplashLoading] = useState(false);
 const [wfUnsplashSel, setWfUnsplashSel] = useState(null);

 /* ── Inline image picker (click any article image to replace) ── */
 const [wfImgPicker, setWfImgPicker] = useState(null); // { oldSrc }
 const [wfImgPickerQuery, setWfImgPickerQuery] = useState('');
 const [wfImgPickerResults, setWfImgPickerResults] = useState([]);
 const [wfImgPickerLoading, setWfImgPickerLoading] = useState(false);
 const [wfImgPickerPage, setWfImgPickerPage] = useState(1);
 const [wfImgPickerTotal, setWfImgPickerTotal] = useState(0);
 const [wfUploadPreview, setWfUploadPreview] = useState(null);

 /* ── Optimize / Content+ state ── */
 const [optUrl, setOptUrl] = useState("");
 const [optKw, setOptKw] = useState("");
 const [optResult, setOptResult] = useState(null);
 const [optLoading, setOptLoading] = useState(false);
 const [optErr, setOptErr] = useState("");

 /* ── AI Chat state ── */
 const [chatMessages, setChatMessages] = useState([{ role: "assistant", content: "Hi! I'm your SEO expert assistant. Ask me anything about blog SEO, keywords, rankings or content strategy." }]);
 const [chatInput, setChatInput] = useState("");
 const [chatLoading, setChatLoading] = useState(false);
 const chatEndRef = useRef(null);

 /* ── Bulk Scan state ── */
 const [bulkUrls, setBulkUrls] = useState("");
 const [bulkKw, setBulkKw] = useState("");
 const [bulkResult, setBulkResult] = useState(null);
 const [bulkLoading, setBulkLoading] = useState(false);
 const [bulkErr, setBulkErr] = useState("");

 /* ── History state ── */
 const [history, setHistory] = useState([]);
 const [histLoading, setHistLoading] = useState(false);

 /* ── Technical SEO state ── */
 const [techSub, setTechSub] = useState("audit");
 const [techResult, setTechResult] = useState(null);
 const [techLoading, setTechLoading] = useState(false);
 const [techErr, setTechErr] = useState("");
 const [pageSpeedResult, setPageSpeedResult] = useState(null);
 const [pageSpeedLoading, setPageSpeedLoading] = useState(false);
 const [cwvResult, setCwvResult] = useState(null);
 const [cwvLoading, setCwvLoading] = useState(false);
 const [sitemapResult, setSitemapResult] = useState(null);
 const [sitemapLoading, setSitemapLoading] = useState(false);

 /* ── Schema & Links state ── */
 const [schemaSub, setSchemaSub] = useState("article");
 const [schemaGenLoading, setSchemaGenLoading] = useState(false);
 const [schemaGenErr, setSchemaGenErr] = useState("");
 const [generatedSchema, setGeneratedSchema] = useState(null);
 const [schemaAuthorName, setSchemaAuthorName] = useState("");
 const [schemaPublisherName,setSchemaPublisherName]= useState("");
 const [faqSchemaResult, setFaqSchemaResult] = useState(null);
 const [faqSchemaLoading, setFaqSchemaLoading] = useState(false);
 const [howtoTitle, setHowtoTitle] = useState("");
 const [howtoResult, setHowtoResult] = useState(null);
 const [howtoLoading, setHowtoLoading] = useState(false);

 /* ── SERP & CTR state ── */
 const [serpSub, setSerpSub] = useState("ctr");
 const [ctrTitle, setCtrTitle] = useState("");
 const [ctrMeta, setCtrMeta] = useState("");
 const [ctrKeyword, setCtrKeyword] = useState("");
 const [ctrOptimizerResult, setCtrOptimizerResult] = useState(null);
 const [ctrLoading, setCtrLoading] = useState(false);
 const [intentKeyword, setIntentKeyword] = useState("");
 const [intentResult, setIntentResult] = useState(null);
 const [intentLoading, setIntentLoading] = useState(false);
 const [paaKeyword, setPaaKeyword] = useState("");
 const [paaNiche, setPaaNiche] = useState("");
 const [paaResult, setPaaResult] = useState(null);
 const [paaLoading, setPaaLoading] = useState(false);
 const [snapKeyword, setSnapKeyword] = useState("");
 const [competitorSnapshotResult, setCompetitorSnapshotResult] = useState(null);
 const [snapLoading, setSnapLoading] = useState(false);
 const [diffKeyword, setDiffKeyword] = useState("");
 const [diffNiche, setDiffNiche] = useState("");
 const [difficultyResult, setDifficultyResult] = useState(null);
 const [diffLoading, setDiffLoading] = useState(false);

 /* ── Internal Links state ── */
 const [internalLinksUrl, setInternalLinksUrl] = useState("");
 const [internalLinksResult, setInternalLinksResult] = useState(null);
 const [internalLinksLoading, setInternalLinksLoading] = useState(false);
 const [internalLinksErr, setInternalLinksErr] = useState("");
 /* kept for legacy / outreach sub-tool */
 const [backlinkSub, setBacklinkSub] = useState("opportunities");
 const [backlinkNiche, setBacklinkNiche] = useState("");
 const [backlinkOppsResult, setBacklinkOppsResult] = useState(null);
 const [backlinkOppsLoading, setBacklinkOppsLoading] = useState(false);
 const [linkGapDomain, setLinkGapDomain] = useState("");
 const [linkGapComp1, setLinkGapComp1] = useState("");
 const [linkGapComp2, setLinkGapComp2] = useState("");
 const [linkGapNiche, setLinkGapNiche] = useState("");
 const [linkGapResult, setLinkGapResult] = useState(null);
 const [linkGapLoading, setLinkGapLoading] = useState(false);
 const [outreachTarget, setOutreachTarget] = useState("");
 const [outreachContentTitle,setOutreachContentTitle]= useState("");
 const [outreachType, setOutreachType] = useState("guest-post");
 const [outreachResult, setOutreachResult] = useState(null);
 const [outreachLoading, setOutreachLoading] = useState(false);
 const [anchorTextDomain, setAnchorTextDomain] = useState("");
 const [anchorTextResult, setAnchorTextResult] = useState(null);
 const [anchorTextLoading, setAnchorTextLoading] = useState(false);

 /* ── Local & E-E-A-T state ── */
 const [localSub, setLocalSub] = useState("gbp");
 const [gbpBusiness, setGbpBusiness] = useState("");
 const [gbpLocation, setGbpLocation] = useState("");
 const [gbpCategory, setGbpCategory] = useState("");
 const [gbpResult, setGbpResult] = useState(null);
 const [gbpLoading, setGbpLoading] = useState(false);
 const [citationBusiness, setCitationBusiness] = useState("");
 const [citationLocation, setCitationLocation] = useState("");
 const [citationCategory, setCitationCategory] = useState("");
 const [citationResult, setCitationResult] = useState(null);
 const [citationLoading, setCitationLoading] = useState(false);
 const [localKwService, setLocalKwService] = useState("");
 const [localKwCity, setLocalKwCity] = useState("");
 const [localKwResult, setLocalKwResult] = useState(null);
 const [localKwLoading, setLocalKwLoading] = useState(false);
 const [eeatResult, setEeatResult] = useState(null);
 const [eeatLoading, setEeatLoading] = useState(false);

 /* ── Voice & AI Search state ── */
 const [voiceSub, setVoiceSub] = useState("voice");
 const [voiceOptKeyword, setVoiceOptKeyword] = useState("");
 const [voiceOptResult, setVoiceOptResult] = useState(null);
 const [voiceOptLoading, setVoiceOptLoading] = useState(false);
 const [faqGenTopic, setFaqGenTopic] = useState("");
 const [faqGenResult, setFaqGenResult] = useState(null);
 const [faqGenLoading, setFaqGenLoading] = useState(false);
 const [aiOverviewKeyword, setAiOverviewKeyword] = useState("");
 const [aiOverviewResult, setAiOverviewResult] = useState(null);
 const [aiOverviewLoading, setAiOverviewLoading] = useState(false);
 const [convKwTopic, setConvKwTopic] = useState("");
 const [convKwResult, setConvKwResult] = useState(null);
 const [convKwLoading, setConvKwLoading] = useState(false);

 /* ── AI Growth state ── */
 const [passageResult, setPassageResult] = useState(null);
 const [passageLoading, setPassageLoading] = useState(false);

 /* ── GEO & LLM state ── */
 const [geoSub, setGeoSub] = useState("health");
 const [geoUrl, setGeoUrl] = useState("");
 const [geoScore, setGeoScore] = useState(null);
 const [geoLoading, setGeoLoading] = useState(false);
 const [geoErr, setGeoErr] = useState("");
 const [promptSimBrand, setPromptSimBrand] = useState("");
 const [promptSimQuery, setPromptSimQuery] = useState("");
 const [promptSimResult, setPromptSimResult] = useState(null);
 const [promptSimLoading, setPromptSimLoading] = useState(false);
 const [llmsTxtResult, setLlmsTxtResult] = useState(null);
 const [llmsTxtLoading, setLlmsTxtLoading] = useState(false);

 /* ── Rank Tracker state ── */
 const [rankKeywords, setRankKeywords] = useState("");
 const [rankDomain, setRankDomain] = useState("");
 const [rankResult, setRankResult] = useState(null);
 const [rankLoading, setRankLoading] = useState(false);
 const [rankErr, setRankErr] = useState("");

 /* ── Site Crawl state ── */
 const [crawlUrl, setCrawlUrl] = useState("");
 const [crawlResult, setCrawlResult] = useState(null);
 const [crawlLoading, setCrawlLoading] = useState(false);
 const [crawlErr, setCrawlErr] = useState("");
 const [crawlSub, setCrawlSub] = useState("crawl");

 /* ── Trend Scout state ── */
 const [trendSub, setTrendSub] = useState("rising");
 const [trendNiche, setTrendNiche] = useState("");
 const [trendIndustry, setTrendIndustry] = useState("");
 const [trendRising, setTrendRising] = useState(null);
 const [trendLoading, setTrendLoading] = useState(false);
 const [trendErr, setTrendErr] = useState("");
 const [trendSeasonal, setTrendSeasonal] = useState(null);
 const [trendSeasonalLoading, setTrendSeasonalLoading] = useState(false);
 const [trendSurge, setTrendSurge] = useState(null);
 const [trendSurgeLoading, setTrendSurgeLoading] = useState(false);

 /* ── A/B & Content Refresh state ── */
 const [abSub, setAbSub] = useState("ab");
 const [abVariantUrl, setAbVariantUrl] = useState("");
 const [abVariantResult, setAbVariantResult] = useState(null);
 const [abVariantLoading, setAbVariantLoading] = useState(false);

 /* ── Banner inline-fix state ── */
 const [bannerFixState, setBannerFixState] = useState({}); // {issueIdx: "loading"|"ok"|"error"}
 const [fixSummaries, setFixSummaries] = useState({}); // {issueKey: {what, before?, after?, detail?}}
 const [bulkFixing, setBulkFixing] = useState(false);
 const [bulkFixProgress, setBulkFixProgress] = useState(null); // {done, total}
 const [inlineTipIssue, setInlineTipIssue] = useState(null); // issue.msg showing inline help tip
 const [dismissedIssues, setDismissedIssues] = useState(() => { try { return JSON.parse(localStorage.getItem('aura-dismissed-issues') || '[]'); } catch { return []; } });
 const dismissIssue = (msg) => { const next = [...dismissedIssues, msg]; setDismissedIssues(next); try { localStorage.setItem('aura-dismissed-issues', JSON.stringify(next)); } catch {} setScanResult(prev => prev ? { ...prev, scored: { ...prev.scored, issues: (prev.scored?.issues || []).filter(i => i.msg !== msg) } } : prev); setInlineTipIssue(null); };
 const [spinTick, setSpinTick] = useState(0); // drives spinner without CSS classes

 /* ── Smart-Fix (one-click all tools) state ── */
 const [smartFixCards, setSmartFixCards] = useState([]); // [{id, icon, label, status, result, applyField}]
 const [smartFixRunning, setSmartFixRunning] = useState(false);
 const [smartFixApplied, setSmartFixApplied] = useState(new Set()); // card ids applied
 const [smartFixApplying, setSmartFixApplying] = useState({}); // {cardId: bool}

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
 } catch (e) {
 console.warn('[BlogSEO] Failed to load store data:', e.message);
 // Non-fatal — user can still scan URLs manually
 }
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

 /* Auto-load shop keywords when Write section is opened */
 useEffect(() => {
 if (section === "Write" && genShopSuggestions.length === 0 && !genSuggestionsLoading) {
 setGenSuggestionsLoading(true);
 apiFetchJSON(`${API}/ai/shop-keywords`).then(r => {
 setGenSuggestionsLoading(false);
 if (r.ok && r.keywords?.length) setGenShopSuggestions(r.keywords);
 }).catch(() => setGenSuggestionsLoading(false));
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [section]);

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
 if (!section || section === "Posts") return;
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
 const runScan = useCallback(async (keepFixState = false) => {
 if (!url.trim()) return;
 setScanning(true); setScanErr(""); setScanResult(null);
 setAiAnalysis(null); setRewriteResult(null); setRewriteErr(null);
 setApplyState({});
 setAnalyzeScreen('scanning');
 setAnalyzeProgress(0);
 // Fake progress stages
 const stages = [
 [15, 'Crawling URL...'],
 [35, 'Parsing content...'],
 [55, 'Scoring SEO...'],
 [72, 'Checking issues...'],
 [88, 'Building report...'],
 ];
 let stageIdx = 0;
 analyzeProgressRef.current = setInterval(() => {
 if (stageIdx < stages.length) {
 const [pct, lbl] = stages[stageIdx++];
 setAnalyzeProgress(pct);
 setAnalyzeProgressLabel(lbl);
 }
 }, 600);
 if (!keepFixState) { setFixedFields(new Set()); setBannerFixState({}); setFixSummaries({}); }
 try {
 const art = selectedArtId ? articles.find(a => String(a.id) === selectedArtId) : null;
 const body = { url: url.trim(), keywords: kwInput.trim(), ...(art ? { articleId: art.id, blogId: art.blogId } : {}) };
 const r = await apiFetchJSON(`${API}/analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
 if (analyzeProgressRef.current) { clearInterval(analyzeProgressRef.current); analyzeProgressRef.current = null; }
 if (!r.ok) throw new Error(r.error || "Scan failed");
 setAnalyzeProgress(100);
 setAnalyzeProgressLabel('Done!');
 setScanResult(r);
 if (art) { setScannedArtId(art.id); setScannedBlogId(art.blogId); }
 else {
 const match = articles.find(a => a.url === r.url || (r.url && a.handle && r.url.includes(a.handle)));
 if (match) { setScannedArtId(match.id); setScannedBlogId(match.blogId); }
 }
 setTimeout(() => setAnalyzeScreen('results'), 400);
 // Auto-trigger AI scorecard analysis
 setAiAnalyzing(true); setAiAnalysisErr(null);
 apiFetchJSON(`${API}/ai/seo-score`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: r.title || kwInput || r.url, content: r.articleBodyHtml ? r.articleBodyHtml.substring(0, 3000) : undefined, primaryKeyword: kwInput.trim() || r.title || r.url }) }).then(aiRes => { if (aiRes.ok) setAiAnalysis(aiRes); else setAiAnalysisErr(aiRes.error || "AI analysis failed"); setAiAnalyzing(false); }).catch(e => { setAiAnalysisErr(e.message); setAiAnalyzing(false); });
 try { await apiFetch(`${API}/items`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "scan", url: r.url, title: r.title, score: r.scored?.overall, grade: r.scored?.grade, issueCount: r.scored?.issueCount }) }); } catch {}
 } catch(e) {
 if (analyzeProgressRef.current) { clearInterval(analyzeProgressRef.current); analyzeProgressRef.current = null; }
 setScanErr(e.message || "Scan failed");
 setAnalyzeScreen('input');
 }
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

 /* ── AI deep analysis (rich scorecard via /ai/seo-score) ── */
 const runAiAnalysis = useCallback(async (scanData) => {
 const data = scanData || scanResult;
 if (!data) return;
 setAiAnalyzing(true); setAiAnalysisErr(null);
 try {
 const r = await apiFetchJSON(`${API}/ai/seo-score`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: data.title || kwInput || data.url, content: data.articleBodyHtml ? data.articleBodyHtml.substring(0, 3000) : undefined, primaryKeyword: kwInput.trim() || data.title || data.url }) });
 if (r.ok) setAiAnalysis(r);
 else setAiAnalysisErr(r.error || "Analysis failed");
 } catch(e) { setAiAnalysisErr(e.message); }
 setAiAnalyzing(false);
 }, [scanResult, kwInput]);

 /* ── Keywords research ── */
 const runKeywords = useCallback(async () => {
 if (!seedKw.trim()) return;
 setKwLoading(true); setKwErr(""); setKwResult(null);
 try {
 const r = await apiFetchJSON(`${API}/ai/keyword-research`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ seedKeyword: seedKw.trim(), niche: kwNiche.trim() || undefined }) });
 if (r.ok) {
   // Normalize structured response → shape the render code expects
   const s = r.structured || {};
   const allKeywords = (s.clusters || []).flatMap(c =>
     (c.keywords || []).map(kw => ({
       keyword: kw.keyword,
       volume: kw.estimatedVolume ?? '—',
       difficulty: typeof kw.difficulty === 'number' ? kw.difficulty : (kw.difficulty === 'high' ? 70 : kw.difficulty === 'medium' ? 40 : 20),
       intent: kw.intent || c.intent || '—',
       priority: kw.priority,
     }))
   );
   const firstCluster = s.clusters?.[0];
   const primaryKw = firstCluster?.keywords?.find(k => k.priority === 'high') || firstCluster?.keywords?.[0];
   setKwResult({
     primaryKeyword: primaryKw ? { keyword: primaryKw.keyword, intent: firstCluster?.intent } : null,
     keywords: allKeywords,
     clusters: s.clusters || [],
     longTailKeywords: s.longTailKeywords || [],
     questionsToAnswer: s.questionsToAnswer || [],
     contentIdeas: s.contentIdeas || [],
   });
 } else { setKwErr(r.error || "Research failed"); }
 } catch(e) { setKwErr(e.message); }
 setKwLoading(false);
 }, [seedKw, kwNiche]);

 /* ── Write tools ── */
 const runOutline = useCallback(async () => {
 if (!outlineKw.trim()) return;
 setOutlineLoading(true); setOutlineResult(null);
 try { const r = await apiFetchJSON(`${API}/ai/blog-outline`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: outlineKw.trim(), audience: sharedAudience, tone: outlineTone, sections: outlineSections }) }); if (r.ok) setOutlineResult(r); } catch {}
 setOutlineLoading(false);
 }, [outlineKw, sharedAudience, outlineTone, outlineSections]);

 const runIntro = useCallback(async () => {
 if (!introKw.trim()) return;
 setIntroLoading(true); setIntroResult(null);
 try { const r = await apiFetchJSON(`${API}/ai/intro-generator`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: introKw.trim(), style: introStyle, audience: sharedAudience || undefined, outline: outlineResult || undefined }) }); if (r.ok) setIntroResult(r); } catch {}
 setIntroLoading(false);
 }, [introKw, introStyle, sharedAudience, outlineResult]);

 const runTitleIdeas = useCallback(async () => {
 if (!titleKw.trim()) return;
 setTitleLoading(true); setTitleResult(null);
 try { const r = await apiFetchJSON(`${API}/ai/title-ideas`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: titleKw.trim(), count: titleCount, formula: titleFormula !== "all" ? titleFormula : undefined, niche: titleNiche || undefined, audience: sharedAudience || undefined }) }); if (r.ok) setTitleResult(r); } catch {}
 setTitleLoading(false);
 }, [titleKw, titleCount, titleFormula, titleNiche, sharedAudience]);

 const runDraft = useCallback(async () => {
 if (!draftKw.trim()) return;
 setDraftLoading(true); setDraftErr(""); setDraftResult(null);
 try {
 const outline = outlineResult?.sections?.length ? outlineResult.sections : undefined;
 const selectedTitle = outlineResult?.title || undefined;
 const r = await apiFetchJSON(`${API}/ai/full-draft`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: draftKw.trim(), tone: draftTone, niche: draftNiche || undefined, wordCount: draftWordCount, introOverride: selectedIntro || undefined, outline, selectedTitle }) });
 if (r.ok) setDraftResult(r); else setDraftErr(r.error || "Draft generation failed");
 } catch(e) { setDraftErr(e.message); }
 setDraftLoading(false);
 }, [draftKw, draftTone, draftNiche, draftWordCount, outlineResult]);

 /* ─── Generate Article modal handlers ─── */
 const openGenModal = useCallback(() => {
 setShowGenModal(true); setGenKwMode("ai"); setGenKeywords([]); setGenKwInput(""); setGenKwLoading(false); setGenTitleLoading(false); setGenModalErr("");
 // Auto-fetch shop product keywords
 setGenShopSuggestions([]); setGenSuggestionsLoading(true);
 apiFetchJSON(`${API}/ai/shop-keywords`).then(r => {
 setGenSuggestionsLoading(false);
 if (r.ok && r.keywords?.length) setGenShopSuggestions(r.keywords);
 }).catch(() => setGenSuggestionsLoading(false));
 }, []);

 const genExpandKeywords = useCallback(async () => {
 if (!genKwInput.trim()) return;
 setGenKwLoading(true); setGenModalErr("");
 try {
 const r = await apiFetchJSON(`${API}/ai/expand-keywords`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ seed: genKwInput.trim(), count: 5, shopContext: genShopSuggestions.length ? genShopSuggestions.slice(0,5).join(', ') : undefined }) });
 if (r.ok) setGenKeywords(r.keywords || []);
 else setGenModalErr(r.error || "Failed to expand keywords");
 } catch(e) { setGenModalErr(e.message); }
 setGenKwLoading(false);
 }, [genKwInput]);

 const genGenerateTitles = useCallback(async () => {
 const kws = genKeywords.length ? genKeywords : genKwInput.trim() ? [genKwInput.trim()] : [];
 if (!kws.length) return;
 setGenTitleLoading(true); setGenModalErr("");
 try {
 const r = await apiFetchJSON(`${API}/ai/title-ideas`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: kws.join(", "), count: 5 }) });
 const titles = (r.titles || r.ideas || []).slice(0, 5).map(t => typeof t === "string" ? t : (t.title || "")).filter(Boolean);
 if (!titles.length) { setGenModalErr("No titles returned — try different keywords."); setGenTitleLoading(false); return; }
 setWfTitles(titles); setWfPickedTitle(titles[0]); setWfKeywords(kws);
 setWfResult(null); setWfPublishOk(null); setWfPublishErr(""); setWfErr("");
 setShowGenModal(false);
 setSection("WriteFlow");
 // load outline in background
 setWfOutlines([]); setWfOutlineLoading(true);
 try {
 const or = await apiFetchJSON(`${API}/ai/blog-outline`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: titles[0] }) });
 if (or.ok) { const secs = wfOutlineSize === "small" ? 5 : wfOutlineSize === "medium" ? 8 : 11; setWfOutlines((or.sections || []).slice(0, secs).map(s => s.heading || s)); }
 } catch(_) {}
 setWfOutlineLoading(false);
 } catch(e) { setGenModalErr(e.message || "Failed to generate titles"); }
 setGenTitleLoading(false);
 }, [genKeywords, genKwInput, wfOutlineSize]);

 /* ── WriteFlow handlers ── */
 const wfRegenerateTitles = useCallback(async () => {
 if (!wfKeywords.length) return;
 setWfTitleLoading(true);
 try {
 const r = await apiFetchJSON(`${API}/ai/title-ideas`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: wfKeywords.join(", "), count: 5 }) });
 const titles = (r.titles || r.ideas || []).slice(0, 5).map(t => typeof t === "string" ? t : (t.title || "")).filter(Boolean);
 if (titles.length) { setWfTitles(titles); setWfPickedTitle(titles[0]); }
 } catch(_) {}
 setWfTitleLoading(false);
 }, [wfKeywords]);

 const wfRegenerateOutline = useCallback(async () => {
 if (!wfPickedTitle) return;
 setWfOutlineLoading(true);
 try {
 const or = await apiFetchJSON(`${API}/ai/blog-outline`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: wfPickedTitle }) });
 if (or.ok) { const secs = wfOutlineSize === "small" ? 5 : wfOutlineSize === "medium" ? 8 : 11; setWfOutlines((or.sections || []).slice(0, secs).map(s => s.heading || s)); }
 } catch(_) {}
 setWfOutlineLoading(false);
 }, [wfPickedTitle, wfOutlineSize]);

 const wfGenerateArticle = useCallback(async () => {
 if (!wfPickedTitle) return;
 setWfGenerating(true); setWfErr(""); setWfCoverErr(""); setWfCoverGenerating(false); setWfProgress(0); setWfProgressLabel("Writing Article");
 setSection("WriteGenerating");
 // Section-by-section: each section is a separate API call, so timing scales with section count
 const startMs = Date.now();
 const TOTAL_MS = wfOutlineSize === "small" ? 40000 : wfOutlineSize === "long" ? 90000 : 65000;
 const LABELS = ["Researching topic...", "Writing introduction...", "Writing sections...", "Writing sections...", "Adding conclusion...", "Adding FAQs..."];
 let labelIdx = 0;
 wfProgressRef.current = setInterval(() => {
 const elapsed = Date.now() - startMs;
 const pct = Math.min(95, Math.round((elapsed / TOTAL_MS) * 100));
 setWfProgress(pct);
 const newLabel = LABELS[Math.min(Math.floor(pct / 18), LABELS.length-1)];
 if (newLabel !== LABELS[labelIdx]) { labelIdx = Math.min(Math.floor(pct/18), LABELS.length-1); setWfProgressLabel(newLabel); }
 }, 300);
 try {
 const outlineList = [...wfOutlines, ...(wfConclusion ? ["Conclusion"] : []), ...(wfFaqs ? ["FAQs — frequently asked questions"] : [])];
 // Section-by-section generation is accurate, so target the midpoint of each range
 const targetWordCount = wfOutlineSize === "small" ? 1200 : wfOutlineSize === "long" ? 4000 : 2300;
 const r = await apiFetchJSON(`${API}/ai/full-blog-writer`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: wfPickedTitle, keyword: wfKeywords[0] || wfPickedTitle, outline: outlineList, wordCount: targetWordCount }) });
 clearInterval(wfProgressRef.current); setWfProgress(100);
 if (r.ok) {
 setWfResult(r);
 setWfMetaDesc(r.metaDescription || "");
 if (r.ogTitle || r.ogDescription) setWfOgTags({ title: r.ogTitle || '', description: r.ogDescription || '' });
 if (r.twitterTitle || r.twitterDescription) setWfTwitterTags({ title: r.twitterTitle || '', description: r.twitterDescription || '' });
 // Update the picked title to the SEO-optimised one (contains keyword)
 if (r.title && r.title !== wfPickedTitle) setWfPickedTitle(r.title);
 // Auto-generate cover image if user selected an AI option
 const ratio = genCoverImage === 'ai-16:9' ? '16:9' : genCoverImage === 'ai-4:3' ? '4:3' : '1:1';
 if (genCoverImage !== 'none') {
 setWfCoverGenerating(true);
 setWfCoverErr("");
 apiFetchJSON(`${API}/ai/generate-cover-image`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ title: r.title || wfPickedTitle, keyword: wfKeywords[0] || wfPickedTitle, ratio })
 }).then(imgR => {
 setWfCoverGenerating(false);
 if (imgR?.ok && imgR.imageUrl) {
 // Also inject the cover image into the article body HTML after the intro
 // so the SEO checker counts imgCount > 0
 const altText = imgR.credit
 ? `${r.title || wfPickedTitle} — Photo by ${imgR.credit.photographer} on Unsplash`
 : `Cover image for "${r.title || wfPickedTitle}"`;
 const creditHtml = imgR.credit
 ? ` <small>Photo by <a href="${imgR.credit.profileUrl}?utm_source=aura_seo&utm_medium=referral" target="_blank" rel="noopener noreferrer">${imgR.credit.photographer}</a> on Unsplash</small>`
 : '';
 const coverFigure = `<figure style="margin:2em 0;text-align:center"><img src="${imgR.imageUrl}" alt="${altText}" style="max-width:100%;border-radius:8px" loading="lazy" />${creditHtml ? `<figcaption style="font-size:0.85em;color:#666;margin-top:0.5em">${creditHtml}</figcaption>` : ''}</figure>`;
 setWfResult(prev => {
 if (!prev) return prev;
 const html = prev.fullArticle || '';
 const insertAt = html.indexOf('</p>');
 const newHtml = insertAt >= 0
 ? html.slice(0, insertAt + 4) + '\n' + coverFigure + '\n' + html.slice(insertAt + 4)
 : html + '\n' + coverFigure;
 return { ...prev, fullArticle: newHtml };
 });
 setWfCoverImg({ url: imgR.imageUrl, alt: altText, source: imgR.source || 'ai' });
 } else {
 const msg = imgR?.error || 'Image generation failed';
 console.error('[Cover image] DALL-E error:', msg);
 setWfCoverErr(msg);
 }
 }).catch(err => {
 setWfCoverGenerating(false);
 console.error('[Cover image] Network error:', err);
 setWfCoverErr(err?.message || 'Network error');
 });
 }
 setTimeout(() => setSection("WriteResult"), 400);
 }
 else { setWfErr(r.error || "Article generation failed."); setSection("WriteFlow"); }
 } catch(e) { clearInterval(wfProgressRef.current); setWfErr(e.message || "Failed to generate article."); setSection("WriteFlow"); }
 setWfGenerating(false);
 }, [wfPickedTitle, wfKeywords, wfOutlines, wfConclusion, wfFaqs, wfOutlineSize, genCoverImage]);

 // Apply a content-fix to the draft article and rescore
 const wfContentFix = useCallback(async (type, issueIdx, extraBody = {}) => {
 setWfIsFixing(prev => ({ ...prev, [issueIdx]: 'loading' }));
 try {
 const html = wfResult?.fullArticle || wfResult?.content || "";
 const r = await apiFetchJSON(`${API}/ai/content-fix`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, bodyHtml: html, title: wfPickedTitle, h1: wfPickedTitle, keywords: (wfKeywords||[]).join(","), keyword: (wfKeywords||[])[0]||wfPickedTitle, ...extraBody }) });
 if (!r.ok) throw new Error(r.error || "Fix failed");
 let newHtml = html;
 let newOgTags = wfOgTags;
 let newTwitterTags = wfTwitterTags;
 if (r.applyAs === 'og') {
 newOgTags = { title: r.ogTitle || '', description: r.ogDescription || '' };
 setWfOgTags(newOgTags);
 // HTML unchanged — only OG tags stored; rescore will now pass them and clear the issue
 } else if (r.applyAs === 'twitter') {
 newTwitterTags = { title: r.twitterTitle || '', description: r.twitterDescription || '' };
 setWfTwitterTags(newTwitterTags);
 // HTML unchanged — only Twitter tags stored; rescore will pass them and clear the issue
 } else if (r.applyAs === 'replace') newHtml = r.html || html;
 else if (r.applyAs === 'prepend') newHtml = (r.html || "") + "\n" + html;
 else if (r.applyAs === 'append') newHtml = html + "\n" + (r.html || "");
 const updated = { ...wfResult, fullArticle: newHtml };
 setWfResult(updated);
 wfRunSeoScore(updated, wfKeywords, wfPickedTitle, wfMetaDesc, newOgTags, newTwitterTags);
 // wfIsFixing is cleared by the wfSeoScore useEffect when rescore completes
 } catch(e) {
 setWfIsFixing(prev => ({ ...prev, [issueIdx]: 'err' }));
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [wfResult, wfPickedTitle, wfKeywords, wfMetaDesc, wfOgTags, wfTwitterTags]);

 const wfSaveToShopify = useCallback(async (asDraft = true) => {
 if (!wfResult) return;
 setWfPublishing(true); setWfPublishErr("");
 try {
 const bodyHtml = wfResult.fullArticle || wfResult.content || wfResult.draft || "";
 const r = await apiFetchJSON(`${API}/shopify/publish-article`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: wfPickedTitle, bodyHtml, metaDescription: wfMetaDesc || wfResult.metaDescription, tags: wfKeywords.join(","), asDraft, coverImageUrl: wfCoverImg?.source !== 'upload' ? wfCoverImg?.url : undefined, coverImageAlt: wfCoverImg?.alt || '', ogTitle: wfOgTags?.title || '', ogDescription: wfOgTags?.description || '', twitterTitle: wfTwitterTags?.title || '', twitterDescription: wfTwitterTags?.description || '' }) });
 if (r.ok) setWfPublishOk({ articleUrl: r.articleUrl, published: !asDraft });
 else setWfPublishErr(r.error || "Failed to publish to Shopify.");
 } catch(e) { setWfPublishErr(e.message); }
 setWfPublishing(false);
 }, [wfResult, wfPickedTitle, wfKeywords, wfMetaDesc, wfCoverImg, wfOgTags, wfTwitterTags]);

 const wfRunSeoScore = useCallback(async (result, kws, title, meta, ogTags = null, twitterTags = null) => {
 setWfSeoLoading(true);
 try {
 const raw = result?.fullArticle || result?.content || result?.draft || "";
 // If the content is already HTML (from contentEditable or AI generation), skip markdown
 // conversion — applying it to HTML would inject stray </p><p> between tags and corrupt
 // the structure, causing wrong word counts and readability scores after editing.
 const isAlreadyHtml = /<(h[1-6]|p|ul|ol|li|div|strong|em|script)\b/i.test(raw);
 const html = isAlreadyHtml ? raw : raw
 .replace(/^### (.+)$/gm, "<h3>$1</h3>")
 .replace(/^## (.+)$/gm, "<h2>$1</h2>")
 .replace(/^# (.+)$/gm, "<h1>$1</h1>")
 .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
 .replace(/\*(.+?)\*/g, "<em>$1</em>")
 .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
 .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
 .replace(/\n\n/g, "</p><p>");
 const activeTags = ogTags || wfOgTags;
 const activeTwitter = twitterTags || wfTwitterTags;
 const r = await apiFetchJSON(`${API}/ai/score-draft`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ html, keyword: (kws||[])[0] || "", title: title || "", metaDescription: meta || result?.metaDescription || "", articleSchema: result?.articleSchema || null, ogTitle: activeTags?.title || "", ogDescription: activeTags?.description || "", twitterTitle: activeTwitter?.title || "", twitterDescription: activeTwitter?.description || "" }) });
 if (r.ok) setWfSeoScore(r);
 } catch(_) {}
 setWfSeoLoading(false);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [wfOgTags, wfTwitterTags]);

 // Auto-run SEO score when article result loads
 useEffect(() => {
 if (wfResult) {
 setWfSeoScore(null);
 wfRunSeoScore(wfResult, wfKeywords, wfPickedTitle, wfMetaDesc || wfResult.metaDescription || "", wfOgTags, wfTwitterTags);
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [wfResult]);

 // Clear fix-loading states once rescore finishes (wfSeoScore updated = fresh issue list)
 useEffect(() => {
 if (wfSeoScore) setWfIsFixing({});
 }, [wfSeoScore]);

 // Sync wfResult.fullArticle → contentEditable DOM (also fires when section mounts WriteResult)
 useEffect(() => {
 if (!wfEditRef.current || !wfResult) return;
 const raw = wfResult.fullArticle || wfResult.content || wfResult.draft || "";
 const processed = raw
 .replace(/^### (.+)$/gm, "<h3>$1</h3>")
 .replace(/^## (.+)$/gm, "<h2>$1</h2>")
 .replace(/^# (.+)$/gm, "<h1>$1</h1>")
 .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
 .replace(/\*(.+?)\*/g, "<em>$1</em>")
 .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
 .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
 .replace(/\n\n/g, "</p><p>");
 if (wfEditRef.current.innerHTML !== processed) wfEditRef.current.innerHTML = processed;
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [wfResult?.fullArticle, wfResult?.content, section]);

 // Sync contentEditable → state on blur, then silently rescore
 const handleWfEditBlur = useCallback(() => {
 if (!wfEditRef.current || !wfResult) return;
 const html = wfEditRef.current.innerHTML;
 const updated = { ...wfResult, fullArticle: html };
 setWfResult(updated);
 wfRunSeoScore(updated, wfKeywords, wfPickedTitle, wfMetaDesc, wfOgTags, wfTwitterTags);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [wfResult, wfKeywords, wfPickedTitle, wfMetaDesc, wfOgTags, wfTwitterTags]);

 // Detect img click inside article body → open image picker
 const handleWfArticleClick = useCallback((e) => {
 if (e.target.tagName === 'IMG') {
 e.preventDefault();
 const src = e.target.getAttribute('src') || '';
 setWfImgPicker({ oldSrc: src });
 setWfImgPickerQuery((wfKeywords||[])[0] || wfPickedTitle || '');
 setWfImgPickerResults([]);
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [wfKeywords, wfPickedTitle]);

 // Replace an image src in the article with a new Unsplash pick
 const replaceArticleImage = useCallback((newUrl, credit) => {
 if (!wfImgPicker || !wfResult) return;
 const { oldSrc } = wfImgPicker;
 // Directly update the DOM element — avoids innerHTML &amp; encoding mismatch
 if (wfEditRef.current) {
 const imgs = wfEditRef.current.querySelectorAll('img');
 imgs.forEach(img => {
 if (img.getAttribute('src') === oldSrc) {
 img.setAttribute('src', newUrl);
 if (credit?.photographer) img.setAttribute('alt', `Photo by ${credit.photographer} on Unsplash`);
 }
 });
 // Sync the updated DOM → state so it persists
 const updatedHtml = wfEditRef.current.innerHTML;
 setWfResult(prev => prev ? { ...prev, fullArticle: updatedHtml } : prev);
 }
 setWfImgPicker(null);
 setWfImgPickerResults([]);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [wfImgPicker, wfResult]);

 const runBrief = useCallback(async () => {
 if (!briefTopic.trim()) return;
 setBriefLoading(true); setBriefErr(""); setBriefResult(null);
 try {
 const secondaryArr = briefSecondary.trim() ? briefSecondary.split(",").map(s => s.trim()).filter(Boolean) : undefined;
 const r = await apiFetchJSON(`${API}/ai/content-brief`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: briefTopic.trim(), primaryKeyword: briefPrimary.trim() || undefined, secondaryKeywords: secondaryArr, audience: sharedAudience.trim() || undefined, tone: briefTone }) });
 if (r.ok) setBriefResult(r.structured || r.brief || r); else setBriefErr(r.error || "Brief generation failed");
 } catch(e) { setBriefErr(e.message); }
 setBriefLoading(false);
 }, [briefTopic, briefPrimary, briefSecondary, sharedAudience, briefTone]);

 /* ── AI Suggest Fields — auto-fill secondary form inputs from a topic ── */
 const runSuggestFields = useCallback(async (topic, key, applyFn) => {
 if (!topic?.trim()) return;
 setSfLoading(true); setSfLoadingKey(key);
 try {
 const r = await apiFetchJSON(`${API}/ai/suggest-fields`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: topic.trim() }) });
 if (r.ok) applyFn(r);
 } catch(_) {}
 setSfLoading(false); setSfLoadingKey("");
 }, []);

 /* ── Blog Images ── */
 const runBlogImages = useCallback(async () => {
 const effectiveTopic = imgTopic.trim() || draftKw.trim() || outlineKw.trim();
 if (!effectiveTopic) return;
 if (!imgTopic.trim()) setImgTopic(effectiveTopic);
 setImgLoading(true); setImgErr(""); setImgResult(null);
 try {
 const outlineSections = Array.isArray(outlineResult?.sections) ? outlineResult.sections : [];
 const r = await apiFetchJSON(`${API}/ai/blog-images`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: effectiveTopic, outline: outlineSections, tone: draftTone, niche: draftNiche || undefined }) });
 if (r.ok) setImgResult(r); else setImgErr(r.error || "Image plan generation failed");
 } catch(e) { setImgErr(e.message); }
 setImgLoading(false);
 }, [imgTopic, draftKw, outlineKw, outlineResult, draftTone, draftNiche]);

 /* ── Generate actual image (DALL·E / Unsplash) ── */
 const generateImage = useCallback(async (key, prompt, keyword) => {
   setImgGenLoading(p => ({ ...p, [key]: true }));
   try {
     const r = await apiFetchJSON(`${API}/ai/generate-cover-image`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ prompt, keyword: keyword || imgTopic || draftKw || outlineKw }),
     });
     if (r.ok) setGeneratedImages(p => ({ ...p, [key]: r }));
   } catch (e) { /* silently ignore */ }
   setImgGenLoading(p => ({ ...p, [key]: false }));
 }, [imgTopic, draftKw, outlineKw]);

 /* ── Repurpose ── */
 const runRepurpose = useCallback(async () => {
 if (!repTopic.trim()) return;
 setRepLoading(true); setRepErr(""); setRepResult(null);
 try {
 const r = await apiFetchJSON(`${API}/ai/repurpose`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: repTopic.trim(), summary: repSummary.trim() || undefined, tone: draftTone, niche: draftNiche || undefined }) });
 if (r.ok) setRepResult(r); else setRepErr(r.error || "Repurpose generation failed");
 } catch(e) { setRepErr(e.message); }
 setRepLoading(false);
 }, [repTopic, repSummary, draftTone, draftNiche]);

 /* ── Tags & Schema ── */
 const runTagsSchema = useCallback(async () => {
 if (!tagsTopic.trim()) return;
 setTagsLoading(true); setTagsErr(""); setTagsResult(null);
 try {
 const outlineSections = Array.isArray(outlineResult?.sections) ? outlineResult.sections : [];
 const r = await apiFetchJSON(`${API}/ai/tags-schema`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: tagsTopic.trim(), primaryKeyword: outlineKw || tagsTopic.trim(), outline: outlineSections, audience: sharedAudience || undefined }) });
 if (r.ok) setTagsResult(r); else setTagsErr(r.error || "Tags & schema generation failed");
 } catch(e) { setTagsErr(e.message); }
 setTagsLoading(false);
 }, [tagsTopic, outlineResult, outlineKw, sharedAudience]);

 /* ── SEO Score ── */
 const runSeoScore = useCallback(async () => {
 if (!seoTopic.trim()) return;
 setSeoLoading(true); setSeoErr(""); setSeoResult(null);
 try {
 const outlineSecs = Array.isArray(outlineResult?.sections) ? outlineResult.sections : [];
 const r = await apiFetchJSON(`${API}/ai/seo-score`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: seoTopic.trim(), content: seoContent.trim() || undefined, outline: outlineSecs, primaryKeyword: outlineKw || seoTopic.trim(), audience: sharedAudience || undefined }) });
 if (r.ok) setSeoResult(r); else setSeoErr(r.error || "SEO score generation failed");
 } catch(e) { setSeoErr(e.message); }
 setSeoLoading(false);
 }, [seoTopic, seoContent, outlineResult, outlineKw, sharedAudience]);

 /* ── Navigate between pipeline steps, auto-filling empty destination from best available topic ── */
 const navigateTo = useCallback((tab) => {
 const sharedTopic = outlineKw || titleKw || draftKw || introKw || briefPrimary || briefTopic;
 if (sharedTopic) {
 if (tab === "brief" && !briefTopic) setBriefTopic(sharedTopic);
 if (tab === "titles" && !titleKw) setTitleKw(sharedTopic);
 if (tab === "outline" && !outlineKw) setOutlineKw(sharedTopic);
 if (tab === "intro" && !introKw) setIntroKw(sharedTopic);
 if (tab === "draft" && !draftKw) setDraftKw(sharedTopic);
 if (tab === "images" && !imgTopic) setImgTopic(sharedTopic);
 if (tab === "repurpose" && !repTopic) setRepTopic(sharedTopic);
 if (tab === "tags" && !tagsTopic) setTagsTopic(sharedTopic);
 if (tab === "seo" && !seoTopic) setSeoTopic(sharedTopic);
 }
 setWriteSub(tab);
 }, [outlineKw, titleKw, draftKw, introKw, briefPrimary, briefTopic,
 imgTopic, repTopic, tagsTopic, seoTopic]);

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
 setChatMessages(p => [...p, { role: "user", content: msg }]);
 setChatLoading(true);
 try {
 const r = await apiFetchJSON(`${API}/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msg, context: scanResult ? { url: scanResult.url, score: scanResult.scored?.overall, issues: (scanResult.scored?.issues || []).slice(0, 5).map(i => i.msg) } : undefined }) });
 setChatMessages(p => [...p, { role: "assistant", content: r.ok ? (r.reply || r.message || "Done") : (r.error || "Error") }]);
 } catch(e) { setChatMessages(p => [...p, { role: "assistant", content: "Network error. Please try again." }]); }
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
 if (m.includes("schema") || m.includes("structured data") || m.includes("json-ld")) return "schema";
 if (m.includes("word") || m.includes("too short") || m.includes("thin") || m.includes("300") || m.includes("500") || m.includes("1000") || m.includes("character")) return "body_append";
 return null;
 };

 /* ── AI rewrite a field then immediately apply to Shopify (no navigation) ── */
 /* issueKey = issue.msg string (stable across filtered arrays) */
 const runBannerFix = useCallback(async (field, issueKey, { silent = false } = {}) => {
 if (!scanResult) { if (!silent) showToast("Scan a post first"); return false; }
 // Auto-lookup article if not already matched
 let artId = scannedArtId;
 let blogId = scannedBlogId;
 if ((!artId || !blogId) && scanResult.url && articles.length) {
 const url2 = scanResult.url.toLowerCase();
 const m = articles.find(a =>
 (a.url && a.url.toLowerCase() === url2) ||
 (a.handle && url2.includes(a.handle.toLowerCase()))
 );
 if (m) { artId = m.id; blogId = m.blogId; setScannedArtId(m.id); setScannedBlogId(m.blogId); }
 }
 if (!artId || !blogId) {
 if (!silent) showToast("To apply fixes, go to \"Analyze a Post\", select this post from the dropdown, then re-scan.");
 return false;
 }
 setBannerFixState(p => ({ ...p, [issueKey]: "loading" }));
 // Capture before-value for the summary card
 const _beforeMap = { title: scanResult.title, metaDescription: scanResult.metaDescription, h1: scanResult.h1, handle: scanResult.handle };
 const beforeVal = _beforeMap[field] || "";
 try {
 let val = "";
 let applyField = field;
 const CONTENT_FIX_TYPES = { readability_fix: "readability", citations_fix: "citations", eeat_fix: "eeat", og_fix: "og_fix", author_fix: "author_byline", kw_fix: "keyword_boost", faq_fix: "faq", internal_fix: "internal_links" };
 if (field === "date_fix") {
 // Special case: just update the published_at timestamp, no body change
 const dr = await apiFetchJSON(`${API}/apply-date-refresh`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ articleId: artId, blogId, shop: shopDomain }),
 });
 if (!dr.ok) throw new Error(dr.error || "Date refresh failed");
 setBannerFixState(p => ({ ...p, [issueKey]: "ok" }));
 setFixedFields(p => new Set([...p, field]));
 setScanResult(prev => prev ? { ...prev, scored: { ...prev.scored, issues: (prev.scored?.issues || []).filter(i => i.msg !== issueKey) } } : prev);
 setFixSummaries(p => ({ ...p, [issueKey]: { what: "Published date", detail: `Refreshed to ${new Date().toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })}` } }));
 if (!silent) { showToast("Published date refreshed to today — rescanning post..."); setTimeout(() => runScan(true), 1500); }
 return true;
 } else if (field === "og_fix") {
 // OG fix: generate og:title and og:description then apply both via Shopify metafields
 const rw = await apiFetchJSON(`${API}/ai/content-fix`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ type: "og_fix", title: scanResult.title, h1: scanResult.h1, keywords: kwInput || scanResult.title, url: scanResult.url }),
 });
 if (!rw.ok) throw new Error(rw.error || "OG fix failed");
 const ogTitle = rw.ogTitle || "";
 const ogDesc = rw.ogDescription || "";
 if (!ogDesc) throw new Error("AI returned no OG description");
 // Apply og:description (description_tag metafield)
 const apDesc = await apiFetchJSON(`${API}/apply-field`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ articleId: artId, blogId, field: "metaDescription", value: ogDesc, shop: shopDomain }),
 });
 if (!apDesc.ok) throw new Error(apDesc.error || "Apply OG description failed");
 // Apply og:title (title_tag metafield) if we got one
 if (ogTitle) {
 await apiFetchJSON(`${API}/apply-field`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ articleId: artId, blogId, field: "seoTitle", value: ogTitle, shop: shopDomain }),
 });
 }
 setBannerFixState(p => ({ ...p, [issueKey]: "ok" }));
 setFixedFields(p => new Set([...p, field]));
 setScanResult(prev => prev ? { ...prev, scored: { ...prev.scored, issues: (prev.scored?.issues || []).filter(i => i.msg !== issueKey) } } : prev);
 setFixSummaries(p => ({ ...p, [issueKey]: { what: "OG tags (title + description)", detail: `Title: ${ogTitle.slice(0,60)} | Desc: ${ogDesc.slice(0, 80)}…` } }));
 // Remove the OG issue from scanResult so it can't reappear on rescan (Shopify CDN delay)
 setScanResult(prev => prev ? { ...prev, scored: { ...prev.scored, issues: (prev.scored?.issues || []).filter(i => !i.msg?.toLowerCase().includes("open graph") && !i.msg?.toLowerCase().includes("og:")) } } : prev);
 if (!silent) { showToast("OG title & description saved to Shopify"); }
 return true;
 } else if (CONTENT_FIX_TYPES[field]) {
 const typeMap = CONTENT_FIX_TYPES;
 const rw = await apiFetchJSON(`${API}/ai/content-fix`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ type: typeMap[field], title: scanResult.title, h1: scanResult.h1, keywords: kwInput || scanResult.title, url: scanResult.url, articleId: artId, blogId, shop: shopDomain }),
 });
 if (!rw.ok) throw new Error(rw.error || "AI content fix failed");
 val = rw.html;
 if (!val) throw new Error("AI returned no content");
 applyField = rw.applyAs === "replace" ? "body_replace" : rw.applyAs === "prepend" ? "body_prepend" : "body_append";
 } else if (field === "body_append") {
 // AI writes new content sections and appends them to the post
 const rw = await apiFetchJSON(`${API}/ai/expand-content`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ title: scanResult.title, h1: scanResult.h1, keywords: kwInput || scanResult.title, url: scanResult.url, currentWordCount: scanResult.wordCount || 0 }),
 });
 if (!rw.ok) throw new Error(rw.error || "Content generation failed");
 val = rw.html;
 if (!val) throw new Error("AI returned no content");
 } else if (field === "schema") {
 // Generate Article schema markup and apply as a script tag
 const rw = await apiFetchJSON(`${API}/schema/generate`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ url: scanResult.url, title: scanResult.title, h1: scanResult.h1, metaDescription: scanResult.metaDescription, keywords: kwInput, articleBody: scanResult.h1 || scanResult.title }),
 });
 if (!rw.ok) throw new Error(rw.error || "Schema generation failed");
 val = rw.jsonLd;
 if (!val) throw new Error("Schema generation returned no data");
 } else {
 const h2s = (scanResult.headings || []).filter(h => h.tag === "h2").map(h => h.text).join(" | ");
 const currentValueMap = { title: scanResult.title, metaDescription: scanResult.metaDescription, h1: scanResult.h1, headings: h2s || scanResult.h1 || scanResult.title, handle: scanResult.handle || (scanResult.url||"").split("/").pop() || scanResult.title };
 const currentValue = currentValueMap[field] || scanResult.title || "";
 const rw = await apiFetchJSON(`${API}/ai/rewrite`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ field, currentValue, url: scanResult.url, keywords: kwInput }),
 });
 if (!rw.ok) throw new Error(rw.error || "Rewrite failed");
 val = rw.structured?.variants?.[0]?.text || rw.value || rw.suggestion;
 if (!val) throw new Error("AI returned no suggestion");
 }
 const ap = await apiFetchJSON(`${API}/apply-field`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ articleId: artId, blogId, field: applyField, value: val, shop: shopDomain }),
 });
 if (!ap.ok) throw new Error(ap.error || "Apply failed");
 setBannerFixState(p => ({ ...p, [issueKey]: "ok" }));
 setFixedFields(p => new Set([...p, field]));
 setScanResult(prev => prev ? { ...prev, scored: { ...prev.scored, issues: (prev.scored?.issues || []).filter(i => i.msg !== issueKey) } } : prev);
 // Build summary card data
 const _trunc = (s, n) => s && s.length > n ? s.slice(0, n) + "…" : (s || "");
 const _fieldLabels = { title:"Page title", metaDescription:"Meta description", h1:"H1 heading", headings:"H2 sub-headings", handle:"URL slug", schema:"Schema markup", body_append:"Content" };
 const _contentDetail = { readability_fix:"Full article rewritten for readability (Flesch 60+)", citations_fix:"Expert citations section appended (3-5 sources)", eeat_fix:"First-person expertise statement added to post", author_fix:"Professional author bio section appended", kw_fix:"Keyword-optimised paragraph appended", faq_fix:"FAQ section added (4-5 Q&As for People Also Ask)", internal_fix:"Related reading / internal links section appended" };
 if (_contentDetail[field]) {
 setFixSummaries(p => ({ ...p, [issueKey]: { what: _fieldLabels[field] || field, detail: _contentDetail[field] } }));
 } else if (field === "schema") {
 setFixSummaries(p => ({ ...p, [issueKey]: { what: "Schema markup", detail: "Article JSON-LD structured data injected into post" } }));
 } else if (field === "body_append" || field === "body_prepend" || field === "body_replace") {
 setFixSummaries(p => ({ ...p, [issueKey]: { what: "Article body", detail: "AI-generated content applied to post" } }));
 } else if (beforeVal || val) {
 setFixSummaries(p => ({ ...p, [issueKey]: { what: _fieldLabels[applyField] || _fieldLabels[field] || field, before: _trunc(beforeVal, 72), after: _trunc(val, 72) } }));
 }
 if (!silent) {
 const toastMsg = field === "body_append" ? "AI content added — rescanning post..."
 : field === "schema" ? "Schema added — rescanning post..."
 : field === "readability_fix" ? "Article rewritten for readability — rescanning post..."
 : field === "citations_fix" ? "Expert citations added — rescanning post..."
 : field === "eeat_fix" ? "E-E-A-T signals added — rescanning post..."
 : field === "og_fix" ? "OG tags generated — rescanning post..."
 : field === "author_fix" ? "Author bio added — rescanning post..."
 : field === "kw_fix" ? "Keyword content added — rescanning post..."
 : field === "faq_fix" ? "FAQ section added — rescanning post..."
 : field === "internal_fix" ? "Related links section added — rescanning post..."
 : `${field} updated — rescanning post...`;
 showToast(toastMsg);
 setTimeout(() => runScan(true), 1500);
 }
 return true;
 } catch(e) {
 setBannerFixState(p => ({ ...p, [issueKey]: "error" }));
 if (!silent) showToast(`Fix failed: ${e.message}`);
 return false;
 }
 }, [scanResult, scannedArtId, scannedBlogId, articles, kwInput, shopDomain, showToast, runScan]);

 /* ── Bulk fix all auto-fixable issues in scanResult ── */
 const runBulkFix = useCallback(async () => {
 if (!scanResult) { showToast("Scan a post first"); return; }
 // Auto-lookup article if not already matched (same logic as runBannerFix)
 if ((!scannedArtId || !scannedBlogId) && scanResult.url && articles.length) {
 const url2 = scanResult.url.toLowerCase();
 const m = articles.find(a =>
 (a.url && a.url.toLowerCase() === url2) ||
 (a.handle && url2.includes(a.handle.toLowerCase()))
 );
 if (m) { setScannedArtId(m.id); setScannedBlogId(m.blogId); }
 else { showToast("To bulk-fix, go to Analyze, select your post from the dropdown, then re-scan."); return; }
 } else if (!scannedArtId || !scannedBlogId) {
 showToast("Select a post from the store dropdown so we know which article to update"); return;
 }
 const issues = scanResult?.scored?.issues ?? [];
 const fixable = issues
 .map(iss => ({ ...iss, key: iss.msg, field: fixableField(iss.msg) }))
 .filter(x => x.field);
 if (!fixable.length) { showToast("None of the listed issues can be auto-fixed — they need manual content changes"); return; }
 setBulkFixing(true);
 setBulkFixProgress({ done: 0, total: fixable.length });
 let successes = 0;
 for (const item of fixable) {
 const ok = await runBannerFix(item.field, item.key, { silent: true });
 if (ok) successes++;
 setBulkFixProgress(p => ({ ...p, done: (p?.done ?? 0) + 1 }));
 }
 setBulkFixing(false);
 if (successes === fixable.length) {
 showToast(`All ${successes} fix${successes !== 1 ? "es" : ""} applied — rescanning to update issues...`);
 } else if (successes > 0) {
 showToast(`${successes} of ${fixable.length} fixes applied — rescanning...`);
 } else {
 showToast(`All ${fixable.length} fixes failed — check that the post is selected and try again`);
 }
 if (successes > 0) setTimeout(() => runScan(true), 1500);
 }, [scanResult, scannedArtId, scannedBlogId, articles, runBannerFix, showToast, runScan]);

 /* ── Smart Fix — run ALL tools on the scanned post in parallel ── */
 const runSmartFix = useCallback(async () => {
 if (!scanResult) { showToast("Scan a post first"); return; }
 const base = {
 url: scanResult.url, title: scanResult.title,
 metaDescription: scanResult.metaDescription, h1: scanResult.h1,
 keywords: kwInput, wordCount: scanResult.wordCount,
 };
 const MODULES = [
 // ── FIXABLE: AI rewrites these fields and applies them straight to Shopify ──
 { id: "title", icon: "", label: "Page Title", group: "Fix", applyField: "title" },
 { id: "meta", icon: "", label: "Meta Description", group: "Fix", applyField: "metaDescription" },
 { id: "h1", icon: "", label: "Main Heading (H1)", group: "Fix", applyField: "h1" },
 { id: "headings",icon: "", label: "Sub-headings (H2s)", group: "Fix", applyField: "headings" },
 { id: "handle", icon: "", label: "URL Slug", group: "Fix", applyField: "handle" },
 { id: "schema", icon: "", label: "Article Schema Markup", group: "Fix", applyField: "schema" },
 { id: "faq", icon: "", label: "FAQ Schema (featured snippets)", group: "Fix", applyField: "body_append" },
 { id: "toc", icon: "", label: "Table of Contents", group: "Fix", applyField: "body_append" },
 // ── AUDITS: run the tool and show what needs doing (you fix manually or AI guides you) ──
 { id: "links", icon: "", label: "Internal Link Gaps", group: "Audit", applyField: null },
 { id: "images", icon: "", label: "Image SEO & Alt Text", group: "Audit", applyField: null },
 { id: "og", icon: "", label: "Open Graph / Social Tags", group: "Audit", applyField: null },
 { id: "anchors", icon: "", label: "Anchor Text Quality", group: "Audit", applyField: null },
 { id: "kwdens", icon: "", label: "Keyword Density", group: "Audit", applyField: null },
 { id: "sections",icon: "", label: "Section Word Count", group: "Audit", applyField: null },
 ];
 setSmartFixCards(MODULES.map(m => ({ ...m, status: "loading", result: null, error: null })));
 setSmartFixRunning(true);
 setSmartFixApplied(new Set());
 setSmartFixApplying({});
 const upd = (id, patch) => setSmartFixCards(p => p.map(c => c.id === id ? { ...c, ...patch } : c));
 // Backend requires currentValue for each rewrite field
 const h2Texts = (scanResult.headings||[]).filter(h => h.tag === "h2").map(h => h.text).join(" | ");
 const cvMap = { title: scanResult.title||"untitled", metaDescription: scanResult.metaDescription||scanResult.title||"", h1: scanResult.h1||scanResult.title||"", headings: h2Texts || scanResult.h1 || scanResult.title || "", handle: scanResult.handle || (scanResult.url||"").split("/").pop() || scanResult.title || "my-post" };
 const qHeadings = (scanResult.questionHeadings || []).length > 0 ? scanResult.questionHeadings : (scanResult.headings||[]).filter(h => /^(how|what|why|when|where|who|which|is|are|can|do|does|did|will|should)\b/i.test(h.text));
 const calls = [
 // Fixable rewrites
 apiFetchJSON(`${API}/ai/rewrite`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ field:"title", currentValue: cvMap.title, url: base.url, keywords: base.keywords }) })
 .then(r => upd("title", r.ok ? { status:"done", result: r } : { status:"error", error: r.error||"Failed" }))
 .catch(e => upd("title", { status:"error", error: e.message })),
 apiFetchJSON(`${API}/meta-description-optimizer`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ url: scanResult.url, currentMeta: scanResult.metaDescription||"", keyword: kwInput }) })
 .then(r => upd("meta", r.ok ? { status:"done", result: r } : { status:"error", error: r.error||"Failed" }))
 .catch(e => upd("meta", { status:"error", error: e.message })),
 apiFetchJSON(`${API}/ai/rewrite`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ field:"h1", currentValue: cvMap.h1, url: base.url, keywords: base.keywords }) })
 .then(r => upd("h1", r.ok ? { status:"done", result: r } : { status:"error", error: r.error||"Failed" }))
 .catch(e => upd("h1", { status:"error", error: e.message })),
 apiFetchJSON(`${API}/ai/rewrite`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ field:"headings", currentValue: cvMap.headings, url: base.url, keywords: base.keywords }) })
 .then(r => upd("headings", r.ok ? { status:"done", result: r } : { status:"error", error: r.error||"Failed" }))
 .catch(e => upd("headings", { status:"error", error: e.message })),
 apiFetchJSON(`${API}/ai/rewrite`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ field:"handle", currentValue: cvMap.handle, url: base.url, keywords: base.keywords }) })
 .then(r => upd("handle", r.ok ? { status:"done", result: r } : { status:"error", error: r.error||"Failed" }))
 .catch(e => upd("handle", { status:"error", error: e.message })),
 apiFetchJSON(`${API}/schema/generate`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ url: scanResult.url, title: scanResult.title, h1: scanResult.h1, metaDescription: scanResult.metaDescription, keywords: kwInput, articleBody: scanResult.h1 || scanResult.title }) })
 .then(r => upd("schema", r.ok ? { status:"done", result: r } : { status:"error", error: r.error||"Failed" }))
 .catch(e => upd("schema", { status:"error", error: e.message })),
 // FAQ: use question H2s if available, otherwise fall back to People Also Ask AI generation
 (async () => {
 try {
 let headingsForFaq = qHeadings;
 let aiGenerated = false;
 if (headingsForFaq.length === 0) {
 // No question-style H2s — generate questions via PAA then build FAQ from those
 upd("faq", { status:"loading" });
 const paa = await apiFetchJSON(`${API}/people-also-ask`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ keyword: kwInput || scanResult.title, url: scanResult.url }) });
 if (paa.ok && (paa.questions||[]).length > 0) {
 headingsForFaq = paa.questions.slice(0, 6).map(q => ({ text: typeof q === "string" ? q : (q.question || q.text || String(q)) }));
 aiGenerated = true;
 } else {
 upd("faq", { status:"error", error: "Could not generate FAQ questions — try entering a target keyword in the header first" });
 return;
 }
 }
 const r = await apiFetchJSON(`${API}/faq-schema/generate`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ questionHeadings: headingsForFaq, useAI: true, url: scanResult.url }) });
 upd("faq", r.ok ? { status:"done", result: { ...r, _aiGenerated: aiGenerated } } : { status:"error", error: r.error || "FAQ generation failed" });
 } catch(e) { upd("faq", { status:"error", error: e.message }); }
 })(),
 apiFetchJSON(`${API}/toc-generator`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ url: scanResult.url }) })
 .then(r => upd("toc", r.ok && r.headingCount > 0 ? { status:"done", result: r } : { status:"error", error: r.error || "No headings found on this post — add H2 subheadings first" }))
 .catch(e => upd("toc", { status:"error", error: e.message })),
 // Audits
 apiFetchJSON(`${API}/backlinks/internal-suggester`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ url: scanResult.url }) })
 .then(r => upd("links", r.ok ? { status:"done", result: r } : { status:"error", error: r.error||"Failed" }))
 .catch(e => upd("links", { status:"error", error: e.message })),
 apiFetchJSON(`${API}/image-seo`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ url: scanResult.url, keyword: kwInput }) })
 .then(r => upd("images", r.ok ? { status:"done", result: r } : { status:"error", error: r.error||"Failed" }))
 .catch(e => upd("images", { status:"error", error: e.message })),
 apiFetchJSON(`${API}/og-validator`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ url: scanResult.url }) })
 .then(r => upd("og", r.ok ? { status:"done", result: r } : { status:"error", error: r.error||"Failed" }))
 .catch(e => upd("og", { status:"error", error: e.message })),
 apiFetchJSON(`${API}/anchor-text-audit`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ url: scanResult.url }) })
 .then(r => upd("anchors", r.ok ? { status:"done", result: r } : { status:"error", error: r.error||"Failed" }))
 .catch(e => upd("anchors", { status:"error", error: e.message })),
 (kwInput.trim()
 ? apiFetchJSON(`${API}/keyword-density`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ url: scanResult.url, keyword: kwInput }) })
 .then(r => upd("kwdens", r.ok ? { status:"done", result: r } : { status:"error", error: r.error||"Failed" }))
 .catch(e => upd("kwdens", { status:"error", error: e.message }))
 : Promise.resolve(upd("kwdens", { status:"error", error: "Enter a target keyword in the page header first to run keyword density analysis" }))),
 apiFetchJSON(`${API}/section-word-count`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ url: scanResult.url }) })
 .then(r => upd("sections", r.ok ? { status:"done", result: r } : { status:"error", error: r.error||"Failed" }))
 .catch(e => upd("sections", { status:"error", error: e.message })),
 ];
 await Promise.allSettled(calls);
 setSmartFixRunning(false);
 }, [scanResult, kwInput, showToast]);

 /* ── Smart Fix — apply a single card to Shopify ── */
 const applySmartCard = useCallback(async (card) => {
 if (!scannedArtId || !scannedBlogId) { showToast("Select a post from the store dropdown first"); return; }
 // Extract the correct value for each card type before applying to Shopify
 let val = null;
 if (["title","h1","headings","handle"].includes(card.id)) {
 val = card.result?.structured?.variants?.[0]?.text;
 } else if (card.id === "meta") {
 val = card.result?.variants?.[card.result?.bestVariant ?? 0]?.text;
 } else if (card.id === "schema") {
 val = card.result?.jsonLd;
 } else if (card.id === "faq") {
 val = card.result?.scriptTag;
 } else if (card.id === "toc") {
 val = card.result?.tocHtml;
 } else {
 val = card.result?.value || card.result?.suggestion || card.result?.optimizedMeta;
 }
 if (!val) { showToast("AI returned no suggestion for this fix"); return false; }
 setSmartFixApplying(p => ({ ...p, [card.id]: true }));
 try {
 const r = await apiFetchJSON(`${API}/apply-field`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ articleId: scannedArtId, blogId: scannedBlogId, field: card.applyField, value: val, shop: shopDomain }) });
 if (r.ok) { setSmartFixApplied(p => new Set([...p, card.id])); setFixedFields(p => new Set([...p, card.applyField])); showToast(`${card.label} applied to Shopify`); setSmartFixApplying(p => ({ ...p, [card.id]: false })); return true; }
 else { showToast(`Shopify error: ${r.error}`); setSmartFixApplying(p => ({ ...p, [card.id]: false })); return false; }
 } catch(e) { showToast(`Error: ${e.message}`); setSmartFixApplying(p => ({ ...p, [card.id]: false })); return false; }
 }, [scannedArtId, scannedBlogId, shopDomain, showToast]);

 /* ── Smart Fix — apply ALL done cards ── */
 const applyAllSmartCards = useCallback(async () => {
 if (!scannedArtId || !scannedBlogId) { showToast("Select a post from the store dropdown first"); return; }
 const toApply = smartFixCards.filter(c => c.status === "done" && c.applyField && !smartFixApplied.has(c.id));
 if (!toApply.length) { showToast("Nothing left to apply"); return; }
 let successes = 0;
 for (const card of toApply) {
 const ok = await applySmartCard(card);
 if (ok) successes++;
 }
 if (successes === toApply.length) {
 showToast(`All ${successes} fix${successes !== 1 ? "es" : ""} applied to Shopify!`);
 } else {
 showToast(`${successes} of ${toApply.length} fixes applied — check individual cards for errors`);
 }
 }, [smartFixCards, smartFixApplied, scannedArtId, scannedBlogId, applySmartCard, showToast]);

 const getIssueAction = useCallback((msg) => {
 const m = (msg || "").toLowerCase();
 // AI fix actions include credits: 1 so the button can show a badge
 const ai = (label, field) => ({ label, action: () => runBannerFix(field, msg), credits: 1 });
 /* ── Title fixes — fix & apply directly ── */
 if (m.includes("title") && (m.includes("short") || m.includes("below") || m.includes("too few")))
 return ai("Fix Title", "title");
 if (m.includes("title") && (m.includes("long") || m.includes("truncat") || m.includes("over 60")))
 return ai("Shorten Title", "title");
 if (m.includes("title") && (m.includes("keyword") || m.includes("missing from")))
 return ai("Fix Title", "title");
 if (m.includes("title") && (m.includes("missing") || m.includes("no title")))
 return ai("Write Title", "title");
 if (m.includes("title"))
 return ai("Fix Title", "title");
 /* ── Meta description fixes ── */
 if ((m.includes("meta description") || m.includes("meta desc")) && (m.includes("missing") || m.includes("empty") || m.includes("no meta")))
 return ai("Write Meta", "metaDescription");
 if (m.includes("meta description") || m.includes("meta desc"))
 return ai("Fix Meta", "metaDescription");
 /* ── H1 fixes ── */
 if (m.includes("h1") && (m.includes("missing") || m.includes("no h1") || m.includes("0 h1")))
 return ai("Generate H1", "h1");
 if (m.includes("h1"))
 return ai("Fix H1", "h1");
 /* ── H2 / headings ── */
 if ((m.includes("h2") || m.includes("subheading")) && (m.includes("missing") || m.includes("no ") || m.includes("lack")))
 return ai("Add H2s", "headings");
 if (m.includes("heading") && (m.includes("jump") || m.includes("skip") || m.includes("level")))
 return ai("Fix Headings", "headings");
 /* ── URL / slug ── */
 if (m.includes("url") || m.includes("slug") || m.includes("handle"))
 return ai("Fix URL Slug", "handle");
 /* ── Schema / structured data ── */
 if (m.includes("schema") || m.includes("structured data") || m.includes("json-ld"))
 return ai("Add Schema", "schema");
 /* ── Word count / thin content ── */
 if (m.includes("word count") || m.includes("word") || m.includes("too short") || m.includes("thin") || (m.includes("words") && (m.includes("short") || m.includes("below"))))
 return ai("Expand with AI", "body_append");
 /* ── All remaining issues get AI or inline tip ── */
 if (m.includes("author") && !m.includes("authoritative") && !m.includes("authority"))
 return ai("AI Add Author", "author_fix");
 if (m.includes("date") || m.includes("freshness") || m.includes("stale") || m.includes("outdated") || m.includes("publish") || m.includes("modified"))
 return ai("Refresh Date", "date_fix");
 if (m.includes("keyword") && (m.includes("density") || m.includes("stuffing") || m.includes("repeated")))
 return ai("AI Fix Keywords", "kw_fix");
 if (m.includes("keyword") && (m.includes("missing") || m.includes("not found") || m.includes("absent")))
 return ai("AI Fix Keywords", "kw_fix");
 if (m.includes("sentence") || m.includes("passive voice") || m.includes("readability") || m.includes("flesch") || m.includes("simplif"))
 return ai("AI Fix Readability", "readability_fix");
 if (m.includes("paragraph") && (m.includes("long") || m.includes("exceed")))
 return ai("AI Fix Readability", "readability_fix");
 if (m.includes("transition"))
 return ai("AI Fix Readability", "readability_fix");
 if (m.includes("citation") || m.includes("authoritative") || (m.includes("outbound") && m.includes("cit")))
 return ai("AI Add Citations", "citations_fix");
 if (m.includes("first-person") || m.includes("first person") || m.includes("expertise signal") || m.includes("lived experience") || m.includes("e-e-a-t") || m.includes("eeat"))
 return ai("AI Add E-E-A-T", "eeat_fix");
 if (m.includes("open graph") || m.includes("og:") || m.includes("social sharing") || m.includes("social tag"))
 return ai("AI Fix OG Tags", "og_fix");
 if (m.includes("faq") || (m.includes("question") && m.includes("answer")))
 return ai("AI Add FAQ", "faq_fix");
 if (m.includes("internal link") || (m.includes("link") && m.includes("orphan")))
 return ai("AI Add Links", "internal_fix");
 if (m.includes("backlink") || m.includes("link build"))
 return { label: "→ Backlinks", action: () => { setSection("Backlinks"); } };
 /* Truly technical — not fixable via content API, show inline tip */
 if (m.includes("canonical") || m.includes("robots") || m.includes("noindex"))
 return { label: "? How to fix", tip: "In your Shopify theme editor, check your blog-article.liquid template. Shopify adds canonical tags automatically — if this persists, a conflicting app may be overriding it.", action: () => setInlineTipIssue(msg) };
 if (m.includes("favicon"))
 return { label: "? How to fix", tip: "A favicon is set in your Shopify theme, not per blog post. Go to Shopify Admin → Online Store → Themes → Customize → scroll to Logo/Brand and upload a favicon icon (32×32px PNG or ICO).", action: () => setInlineTipIssue(msg) };
 if (m.includes("charset") || m.includes("character set") || m.includes("encoding"))
 return { label: "? How to fix", tip: "The charset meta tag is added by your Shopify theme. Go to Online Store → Themes → Edit Code → layout/theme.liquid and ensure <meta charset=\"utf-8\"> is inside <head>. Most modern Shopify themes include this automatically.", action: () => setInlineTipIssue(msg) };
 if (m.includes("table of contents") || m.includes("toc"))
 return { label: "? How to fix", tip: "Long posts benefit from a table of contents. You can add one manually to this post using anchor links in the Shopify post editor, or install a ToC app from the Shopify App Store.", action: () => setInlineTipIssue(msg) };
 if (m.includes("https"))
 return { label: "? How to fix", tip: "Shopify handles HTTPS automatically. This issue usually means your content (images or links) is using http:// URLs — edit the post and update any http:// links to https://.", action: () => setInlineTipIssue(msg) };
 if (m.includes("core web") || m.includes("speed") || m.includes("lcp") || m.includes("cls") || m.includes("inp"))
 return { label: "? How to fix", tip: "Core Web Vitals are affected by your theme and installed apps, not just content. Remove unused apps, compress images, and consider a speed-optimized theme.", action: () => setInlineTipIssue(msg) };
 if (m.includes("image") || m.includes("alt"))
 return { label: "→ Image SEO", action: () => { setSection("Technical"); } };
 return null;
 }, [runBannerFix, setSection, setInlineTipIssue]);
 /* ═══════════════════════════
 RENDER
 ═══════════════════════════ */
 // Spinner — pure React state, no CSS class dependency
 const anyFixLoading = Object.values(bannerFixState).some(v => v === "loading") || bulkFixing;
 // eslint-disable-next-line react-hooks/rules-of-hooks
 useEffect(() => {
 if (!anyFixLoading) return;
 const id = setInterval(() => setSpinTick(t => (t + 1) % 10), 90);
 return () => clearInterval(id);
 }, [anyFixLoading]);
 const SPIN_FRAMES = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"];
 const spinChar = SPIN_FRAMES[spinTick];

 const visibleSections = SECTIONS;
 const activeSec = section ? SECTIONS.find(s => s.id === section) : null;

 return (
 <>
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

 {/* ── Sidebar — always visible with grouped nav ── */}
 <nav style={S.sidebar}>
 <div style={{ padding: "12px 14px 14px", borderBottom: `1px solid ${C.surface}`, marginBottom: 4 }}>
 <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>Blog SEO Engine</div>
 {shopDomain && <div style={{ fontSize: 11, color: C.dim, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shopDomain}</div>}
 </div>
 <div style={{ padding: "6px 8px 2px" }}>
 <div style={S.sItem(section === "Posts")} onClick={() => setSection("Posts")}>Posts</div>
 </div>
 <div style={S.sHead}>Content</div>
 {[["Write","Write with AI"],["SmartFix","Auto-Optimize"]].map(([sid, lbl]) => (
 <div key={sid} style={S.sItem(section === sid)} onClick={() => setSection(sid)}>{lbl}</div>
 ))}
 <div style={S.sHead}>Analyze</div>
 {[["Analyze","Analyze a Post"],["BulkScan","Bulk Scan"],["History","History"]].map(([sid, lbl]) => (
 <div key={sid} style={S.sItem(section === sid)} onClick={() => setSection(sid)}>{lbl}</div>
 ))}
 <div style={S.sHead}>Optimize</div>
 {[["Optimize","Improve a Post"],["Keywords","Find Keywords"],["Chat","Ask AI"]].map(([sid, lbl]) => (
 <div key={sid} style={S.sItem(section === sid)} onClick={() => setSection(sid)}>{lbl}</div>
 ))}
 <div style={S.sHead}>Technical</div>
 {[["Technical","Technical SEO"],["Schema","Schema & Links"],["SERP","SERP & CTR"],["Backlinks","Internal Links"]].map(([sid, lbl]) => (
 <div key={sid} style={S.sItem(section === sid)} onClick={() => setSection(sid)}>{lbl}</div>
 ))}
 <div style={S.sHead}>Growth</div>
 {[["Rank","Rank Tracker"],["AIGrowth","AI Growth"],["Trends","Trend Scout"],["AB","A/B Refresh"],["Local","Local & E-E-A-T"],["Voice","Voice & AI"],["Crawl","Site Crawl"],["GEO","GEO & LLM"]].map(([sid, lbl]) => (
 <div key={sid} style={S.sItem(section === sid)} onClick={() => setSection(sid)}>{lbl}</div>
 ))}
 </nav>

 {/* ── Main content ── */}
 <div style={S.main}>

 {/* ════════════════════════════
 POSTS — default home view
 ════════════════════════════ */}
 {section === "Posts" && (
 <div>
 {/* Page header */}
 <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:12 }}>
 <div>
 <div style={{ fontSize:22, fontWeight:800, color:C.text, letterSpacing:"-0.5px" }}>Articles</div>
 <div style={{ fontSize:13, color:C.sub, marginTop:3 }}>
 {shopLoading ? "Connecting to store..." : shopDomain ? `${articles.length} article${articles.length!==1?"s":""} · ${shopDomain}` : "No store connected"}
 </div>
 </div>
 <div style={{ display:"flex", gap:10 }}>
 <button style={{ ...S.btn(), fontSize:13, padding:"8px 16px" }} onClick={() => setSection("Analyze")}>Analyze a Post</button>
 <button style={{ ...S.btn("primary"), fontSize:13, padding:"8px 18px" }} onClick={openGenModal}>Generate Article</button>
 </div>
 </div>

 {/* No store notice */}
 {!shopDomain && !shopLoading && (
 <div style={{ background:"#1c1007", border:"1px solid #92400e", borderRadius:10, padding:"12px 16px", marginBottom:20, fontSize:13, color:"#d97706" }}>
 No store connected — connect Shopify to see your posts here, or use <strong>Analyze a Post</strong> to paste any URL.
 </div>
 )}

 {/* Loading */}
 {shopLoading && (
 <div style={{ ...S.card, display:"flex", alignItems:"center", gap:10, color:C.sub, fontSize:13 }}>
 <span style={S.spinner} /> Loading store data...
 </div>
 )}

 {/* Article table */}
 {!shopLoading && articles.length > 0 && (
 <>
 <input
 style={{ ...S.input, maxWidth:340, marginBottom:16, paddingLeft:14 }}
 placeholder="Search articles…"
 value={postSearch}
 onChange={e => setPostSearch(e.target.value)}
 />
 <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden", marginBottom:32 }}>
 {/* Table header */}
 <div style={{ display:"grid", gridTemplateColumns:"1fr 100px 90px 110px 130px", padding:"10px 16px", borderBottom:`1px solid ${C.border}`, background:"#111113" }}>
 {["Title","Status","Words","Last Scanned","Actions"].map((h,i) => (
 <div key={h} style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.8px", textAlign: i > 0 ? "center" : "left" }}>{h}</div>
 ))}
 </div>
 {(() => {
 const filtered = articles.filter(a => !postSearch || a.title?.toLowerCase().includes(postSearch.toLowerCase()));
 if (!filtered.length) return (
 <div style={{ padding:"32px 16px", textAlign:"center", color:C.dim, fontSize:13 }}>No articles match your search.</div>
 );
 return filtered.map((art, i) => {
 const hist = history.find(h => h.url && art.url && h.url === art.url);
 const score = hist?.score ?? (hist?.scored?.overall ?? null);
 const sc = score !== null ? (score >= 75 ? C.green : score >= 50 ? C.yellow : C.red) : C.muted;
 const wc = hist?.wordCount ?? art.wordCount ?? null;
 const scanned = hist?.createdAt ? new Date(hist.createdAt).toLocaleDateString("en-GB",{day:"numeric",month:"short"}) : null;
 const published = art.published_at || art.publishedAt;
 const status = art.status || (published ? "published" : "draft");
 const statusColor = status === "published" ? "#22c55e" : "#a1a1aa";
 const statusBg = status === "published" ? "#052e16" : "#1c1c1e";
 return (
 <div
 key={art.id}
 style={{ display:"grid", gridTemplateColumns:"1fr 100px 90px 110px 130px", padding:"12px 16px", borderBottom: i < filtered.length-1 ? `1px solid ${C.border}` : "none", alignItems:"center", transition:"background .1s", cursor:"default" }}
 onMouseEnter={e=>e.currentTarget.style.background="#111113"}
 onMouseLeave={e=>e.currentTarget.style.background="transparent"}
 >
 {/* Title */}
 <div style={{ minWidth:0 }}>
 <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{art.title}</div>
 {art.url && <div style={{ fontSize:11, color:C.dim, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{art.url.replace(/^https?:\/\//,"")}</div>}
 </div>
 {/* Status */}
 <div style={{ textAlign:"center" }}>
 <span style={{ fontSize:11, fontWeight:600, color:statusColor, background:statusBg, borderRadius:6, padding:"2px 8px", textTransform:"capitalize" }}>{status}</span>
 </div>
 {/* Word count */}
 <div style={{ textAlign:"center", fontSize:13, color: wc ? C.sub : C.dim }}>{wc ? wc.toLocaleString() : "—"}</div>
 {/* Last scanned */}
 <div style={{ textAlign:"center" }}>
 {score !== null
 ? <span style={{ fontSize:13, fontWeight:700, color:sc }}>{score} <span style={{ fontSize:10, fontWeight:400, color:C.dim }}>{scanned || ""}</span></span>
 : <span style={{ fontSize:12, color:C.dim }}>Not scanned</span>}
 </div>
 {/* Actions */}
 <div style={{ display:"flex", gap:6, justifyContent:"center" }}>
 <button
 style={{ ...S.btn(), padding:"4px 10px", fontSize:11 }}
 onClick={() => { setUrl(art.url||""); setSelectedArtId(String(art.id)); setSection("Analyze"); }}
 >Analyze</button>
 <button
 style={{ ...S.btn("primary"), padding:"4px 10px", fontSize:11 }}
 onClick={() => { setUrl(art.url||""); setSelectedArtId(String(art.id)); setSection("SmartFix"); }}
 >Fix</button>
 </div>
 </div>
 );
 });
 })()}
 </div>
 </>
 )}

 {/* Empty state */}
 {!shopLoading && articles.length === 0 && shopDomain && (
 <div style={S.empty}>
 <div style={{ fontSize:32, marginBottom:12 }}></div>
 <div style={{ fontSize:16, fontWeight:600, color:C.sub, marginBottom:8 }}>No articles found</div>
 <div style={{ fontSize:13, color:C.dim, marginBottom:20 }}>Your store is connected but no blog posts were found. Write your first post with AI.</div>
 <button style={S.btn("primary")} onClick={() => setSection("Write")}>Generate Article</button>
 </div>
 )}

 </div>

 )}

 {/* ════════════════════════════
 SECTION HEADER (shown when any section is active)
 ════════════════════════════ */}
 {activeSec && (
 <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 0 12px", borderBottom: `1px solid ${C.border}`, marginBottom: 16, flexWrap: "wrap" }}>
 <button style={{ ...S.btn(), padding: "6px 14px", fontSize: 13 }} onClick={() => setSection("Posts")}>← Posts</button>
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
 {section && !["Analyze","WriteResult","WriteGenerating","WriteFlow"].includes(section) && scanResult && (() => {
 const score = scanResult.scored?.overall ?? null;
 const grade = scanResult.scored?.grade ?? "";
 const issues = (scanResult.scored?.issues ?? []).filter(i => !dismissedIssues.includes(i.msg));
 const scoreColor = score === null ? C.dim : score >= 75 ? C.green : score >= 50 ? C.yellow : C.red;
 /* filter issues relevant to current section */
 const relevance = {
 Technical: ["speed","core web","canonical","robots","https","og:","open graph","image","alt"],
 Schema: ["schema","structured","json-ld","author","publisher"],
 SERP: ["title","meta description","ctr","snippet","intent"],
 Backlinks: ["internal link","orphan"],
 AB: ["title","meta"],
 Local: ["local","author","e-e-a-t","eeat","brand"],
 Voice: ["question","faq","voice","ai overview"],
 AIGrowth: ["passage","content","word"],
 Rank: ["keyword","ranking","position"],
 Crawl: ["crawl","broken","redirect","sitemap"],
 GEO: ["ai","llm","geo","generative"],
 Trends: ["fresh","trend","outdated","stale"],
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
 {scannedArtId && scannedBlogId && (
 <a href={`https://${shopDomain}/admin/blogs/${scannedBlogId}/articles/${scannedArtId}`} target="_blank" rel="noreferrer" style={{ ...S.btn(), fontSize:11, padding:"4px 12px", flexShrink:0, textDecoration:"none", display:"inline-flex", alignItems:"center", gap:4 }}>↗ Shopify</a>
 )}
 </div>
 {/* relevant issues */}
 {shown.length > 0 && (
 <div style={{ borderTop:`1px solid #1e1b4b`, paddingTop:10 }}>
 {/* no article linked warning */}
 {!scannedArtId && (
 <div style={{ display:"flex", gap:8, alignItems:"center", background:"#1c1007", border:"1px solid #78350f", borderRadius:8, padding:"8px 12px", marginBottom:10, flexWrap:"wrap" }}>
 <span style={{ fontSize:11, color:"#fbbf24", flex:1 }}>To apply AI fixes, select this post from the dropdown in <strong>Analyze a Post</strong> then re-scan.</span>
 <button style={{ ...S.btn(), fontSize:10, padding:"3px 10px", flexShrink:0 }} onClick={() => setSection("Analyze")}>Go to Analyze →</button>
 </div>
 )}
 {/* Active fix status bar */}
 {anyFixLoading && (() => {
 const activeKey = Object.keys(bannerFixState).find(k => bannerFixState[k] === "loading");
 const _fixLabel = { title:"title", metaDescription:"meta description", h1:"H1 heading", headings:"sub-headings", handle:"URL slug", schema:"schema markup", readability_fix:"article (full readability rewrite)", citations_fix:"citations", eeat_fix:"E-E-A-T signals", og_fix:"OG tags", author_fix:"author bio", kw_fix:"keywords", faq_fix:"FAQ section", internal_fix:"internal links", date_fix:"publish date", body_append:"content", body_replace:"article body" };
 const activeField = activeKey ? fixableField(activeKey) : null;
 const subject = activeField && _fixLabel[activeField] ? _fixLabel[activeField] : "content";
 return (
 <div style={{ display:"flex", gap:10, alignItems:"center", background:"#1e1b4b", border:"1px solid #4f46e5", borderRadius:8, padding:"10px 14px", marginBottom:10 }}>
 <span style={{ fontSize:18, lineHeight:1, color:"#a5b4fc", flexShrink:0, fontFamily:"monospace" }}>{spinChar}</span>
 <div style={{ flex:1 }}>
 <div style={{ fontSize:12, fontWeight:700, color:"#e0e7ff" }}>AI is fixing your {subject}…</div>
 <div style={{ fontSize:11, color:"#818cf8", marginTop:2 }}>Writing improved content and saving directly to Shopify. This may take 5–15 seconds.</div>
 </div>
 </div>
 );
 })()}
 {/* section header + Fix All button */}
 <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:7, flexWrap:"wrap", gap:6 }}>
 <div style={{ fontSize:10, fontWeight:700, color:"#6366f1", textTransform:"uppercase", letterSpacing:"0.8px" }}>
 {relevant.length ? "Issues relevant to this section" : "Top issues to fix"}
 </div>
 {scannedArtId && (() => {
 const fixableCount = shown.filter(iss => fixableField(iss.msg)).length;
 const manualCount = shown.length - fixableCount;
 if (fixableCount > 0) {
 return (
 <button
 style={{ ...S.btn("primary"), fontSize:10, padding:"3px 12px", flexShrink:0, opacity: bulkFixing ? 0.6 : 1 }}
 onClick={runBulkFix}
 disabled={bulkFixing}
 title={manualCount > 0 ? `${manualCount} issue${manualCount>1?"s":""} (word count, citations, etc.) need manual content edits and cannot be auto-fixed.` : "Auto-fix all listed issues"}
 >
 {bulkFixing
 ? `Fixing ${(bulkFixProgress?.done ?? 0) + 1} of ${bulkFixProgress?.total ?? "?"}…`
 : `Auto-Fix ${fixableCount} of ${shown.length}`}
 </button>
 );
 }
 // All issues need manual work — show a greyed-out button that explains why
 return (
 <span
 style={{ fontSize:10, color:"#71717a", background:"#18181b", border:"1px solid #3f3f46", borderRadius:6, padding:"3px 12px", cursor:"default" }}
 title="These issues require manual content edits (e.g. adding more words, citations, author links). No fields can be auto-rewritten."
 >
 {shown.length} issue{shown.length>1?"s":""} — manual fixes needed
 </span>
 );
 })()}
 </div>
 {/* bulk progress bar */}
 {bulkFixing && bulkFixProgress && (
 <div style={{ height:4, background:"#1e1b4b", borderRadius:2, marginBottom:8, overflow:"hidden" }}>
 <div style={{ height:"100%", background:"#6366f1", width:`${Math.round(((bulkFixProgress.done) / bulkFixProgress.total) * 100)}%`, transition:"width 0.3s" }} />
 </div>
 )}
 <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
 {shown.map((issue, i) => {
 const sev = issue.severity || issue.sev || "low";
 const sevColor = sev === "high" ? "#fca5a5" : sev === "medium" ? "#fbbf24" : "#93c5fd";
 const fField = fixableField(issue.msg);
 const act = getIssueAction(issue.msg);
 const fixSt = bannerFixState[issue.msg];
 const alreadyFixed = fixSt === "ok" || fixedFields.has(fField || "");
 const tipOpen = inlineTipIssue === issue.msg;
 return (
 <div key={i} style={{ display:"flex", flexDirection:"column", gap:4 }}>
 <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap", background: fixSt === "loading" ? "#1e1b4b" : "transparent", borderRadius:8, padding: fixSt === "loading" ? "6px 8px" : "2px 0", transition:"background 0.2s" }}>
 {alreadyFixed
 ? <span style={{ fontSize:13, flexShrink:0 }}></span>
 : <span style={{ width:6, height:6, borderRadius:"50%", background:sevColor, flexShrink:0, marginTop:1 }} />}
 <span style={{ fontSize:12, color: alreadyFixed ? C.dim : C.sub, flex:1, textDecoration: alreadyFixed ? "line-through" : "none" }}>{issue.msg}</span>
 {/* AI Fix & Apply button — always shown, runBannerFix handles article lookup */}
 {fField && !alreadyFixed && (
 <button
 style={{ ...S.btn("primary"), fontSize:11, padding:"5px 14px", flexShrink:0, background: fixSt === "loading" ? "#1d4ed8" : "#059669", borderColor: fixSt === "loading" ? "#1d4ed8" : "#059669", minWidth:100, fontWeight:700, letterSpacing:0.2 }}
 onClick={() => runBannerFix(fField, issue.msg)}
 disabled={fixSt === "loading" || bulkFixing}
 >
 {fixSt === "loading"
 ? `${spinChar} Working…`
 : (act?.label || "AI Fix")}
 </button>
 )}
 {/* Navigation / tip button (non-AI issues) */}
 {!fField && act && !alreadyFixed && (
 <button
 style={{ ...S.btn(), fontSize:10, padding:"3px 10px", flexShrink:0,
 ...(act.tip ? { background:"#1c1007", borderColor:"#92400e", color:"#fbbf24" } : {}) }}
 onClick={act.action}
 >
 {act.label}
 </button>
 )}
 {fixSt === "error" && (
 <span style={{ fontSize:10, color:"#fca5a5" }}>failed</span>
 )}
 </div>
 {/* Fix summary card — shown after successful fix */}
 {fixSt === "ok" && fixSummaries[issue.msg] && (() => {
 const s = fixSummaries[issue.msg];
 return (
 <div style={{ background:"#052e16", border:"1px solid #166534", borderRadius:6, padding:"7px 12px", fontSize:11, color:"#bbf7d0", lineHeight:1.6, marginLeft:14, marginTop:2 }}>
 <span style={{ color:"#4ade80", fontWeight:700 }}>{s.what} updated</span>
 {s.before != null && s.after != null ? (
 <div style={{ marginTop:3, display:"flex", flexDirection:"column", gap:2 }}>
 <span style={{ color:"#6b7280" }}><span style={{ color:"#9ca3af" }}>Before:</span> “{s.before || "(empty)"}”</span>
 <span><span style={{ color:"#9ca3af" }}>After:  </span> “{s.after}”</span>
 </div>
 ) : s.detail ? (
 <span style={{ color:"#86efac", marginLeft:6 }}>— {s.detail}</span>
 ) : null}
 </div>
 );
 })()}
 {/* Inline how-to tip */}
 {tipOpen && act?.tip && (
 <div style={{ background:"#1c1007", border:"1px solid #92400e", borderRadius:8, padding:"10px 14px", fontSize:12, color:"#fbbf24", lineHeight:1.6, display:"flex", gap:10, alignItems:"flex-start", marginLeft:14 }}>
 <span style={{ flexShrink:0 }}></span>
 <span style={{ flex:1 }}>{act.tip}</span>
 <div style={{ display:"flex", flexDirection:"column", gap:4, flexShrink:0 }}>
 <button style={{ ...S.btn(), fontSize:10, padding:"2px 8px" }} onClick={() => setInlineTipIssue(null)}>Close</button>
 <button style={{ fontSize:10, padding:"2px 8px", background:"#78350f", border:"1px solid #92400e", borderRadius:5, color:"#fcd34d", cursor:"pointer" }} onClick={() => dismissIssue(issue.msg)}>Dismiss</button>
 </div>
 </div>
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
 <span><strong>No post scanned yet.</strong> Go to <em>Analyse a Post</em> first to load your blog post data — then every section will show what needs fixing.</span>
 <button style={{ ...S.btn("primary"), fontSize:12, padding:"5px 14px" }} onClick={() => setSection("Analyze")}>Analyse a Post →</button>
 </div>
 )}

 {/* ════════════════════════════
 ANALYZE SECTION
 ════════════════════════════ */}
 {section === "Analyze" && (
 <>
 {/* ═══ SCREEN 1: INPUT ═══ */}
 {analyzeScreen === 'input' && (
 <div style={{ maxWidth:600, margin:"60px auto 0", padding:"0 16px" }}>
 {/* Header */}
 <div style={{ textAlign:"center", marginBottom:40 }}>
 <div style={{ width:52, height:52, borderRadius:14, background:"linear-gradient(135deg,#6366f1,#4f46e5)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, margin:"0 auto 16px" }}></div>
 <div style={{ fontSize:28, fontWeight:800, color:"#fafafa", letterSpacing:"-0.5px", marginBottom:8 }}>Analyze a Post</div>
 <div style={{ fontSize:14, color:"#71717a", lineHeight:1.6 }}>Get a full SEO audit for any blog post — score, issues, and AI-powered fixes.</div>
 </div>

 {/* Article picker (from Shopify) */}
 {articles.length > 0 && (
 <div style={{ marginBottom:16 }}>
 <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#a1a1aa", marginBottom:6, textTransform:"uppercase", letterSpacing:".5px" }}>Pick from your store</label>
 <select
 value={selectedArtId || ""}
 onChange={e => { handleArticleSelect(e.target.value); }}
 style={{ width:"100%", padding:"11px 14px", background:"#18181b", border:"1px solid #3f3f46", borderRadius:10, color: selectedArtId ? "#fafafa" : "#71717a", fontSize:14, outline:"none", cursor:"pointer" }}
 >
 <option value="">— Select a blog post —</option>
 {articles.map(a => <option key={a.id} value={String(a.id)}>{a.title || a.handle}</option>)}
 </select>
 {selectedArtId && <div style={{ marginTop:6, display:"flex", gap:6, alignItems:"center" }}><span style={{ fontSize:11, color:"#52525b" }}>or</span><button onClick={() => { setSelectedArtId(""); setUrl(""); }} style={{ fontSize:11, color:"#818cf8", background:"none", border:"none", cursor:"pointer", padding:0 }}>clear selection</button></div>}
 </div>
 )}

 {/* URL input */}
 <div style={{ marginBottom:12 }}>
 <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#a1a1aa", marginBottom:6, textTransform:"uppercase", letterSpacing:".5px" }}>Post URL</label>
 <input
 style={{ width:"100%", padding:"13px 16px", background:"#18181b", border:"2px solid #3f3f46", borderRadius:10, color:"#fafafa", fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"inherit", transition:"border-color .2s" }}
 placeholder="https://yourstore.com/blogs/news/your-post"
 value={url}
 onChange={e => setUrl(e.target.value)}
 onKeyDown={e => e.key === "Enter" && runScan()}
 onFocus={e => e.target.style.borderColor="#6366f1"}
 onBlur={e => e.target.style.borderColor="#3f3f46"}
 />
 </div>

 {/* Keywords input */}
 <div style={{ marginBottom:24 }}>
 <label style={{ display:"block", fontSize:12, fontWeight:600, color:"#a1a1aa", marginBottom:6, textTransform:"uppercase", letterSpacing:".5px" }}>Target Keywords <span style={{ fontWeight:400, textTransform:"none", color:"#52525b" }}>(optional)</span></label>
 <input
 style={{ width:"100%", padding:"13px 16px", background:"#18181b", border:"2px solid #3f3f46", borderRadius:10, color:"#fafafa", fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"inherit", transition:"border-color .2s" }}
 placeholder="best snowboard, beginner guide, how to choose..."
 value={kwInput}
 onChange={e => setKwInput(e.target.value)}
 onKeyDown={e => e.key === "Enter" && runScan()}
 onFocus={e => e.target.style.borderColor="#6366f1"}
 onBlur={e => e.target.style.borderColor="#3f3f46"}
 />
 </div>

 {scanErr && <div style={{ fontSize:13, color:"#f87171", background:"#450a0a", border:"1px solid #7f1d1d", borderRadius:8, padding:"10px 14px", marginBottom:16 }}>{scanErr}</div>}

 <button
 onClick={runScan}
 disabled={!url.trim()}
 style={{ width:"100%", padding:"14px 0", borderRadius:12, background: url.trim() ? "#6366f1" : "#27272a", color: url.trim() ? "#fff" : "#52525b", fontWeight:700, fontSize:15, border:"none", cursor: url.trim() ? "pointer" : "default", display:"flex", alignItems:"center", justifyContent:"center", gap:10 }}
 >
 Analyze Post
 </button>

 {/* What you'll get */}
 <div style={{ marginTop:32, display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
 {[["","Overall SEO Score","0–100 with grade"],["","Issue Detection","Prioritised fixes"],["","AI Deep Dive","GPT analysis"],["","AI Rewrites","Title, meta, H1"]].map(([ic,t,d]) => (
 <div key={t} style={{ background:"#18181b", border:"1px solid #27272a", borderRadius:10, padding:"12px 14px", display:"flex", gap:10, alignItems:"flex-start" }}>
 <span style={{ fontSize:18, flexShrink:0 }}>{ic}</span>
 <div><div style={{ fontSize:12, fontWeight:700, color:"#d4d4d8" }}>{t}</div><div style={{ fontSize:11, color:"#71717a", marginTop:2 }}>{d}</div></div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* ═══ SCREEN 2: SCANNING ═══ */}
 {analyzeScreen === 'scanning' && (
 <div style={{ margin:"0 -28px", minHeight:"100vh", background:"#09090b", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"40px 28px" }}>
 <div style={{ width:"100%", maxWidth:480, textAlign:"center" }}>
 {/* Animated ring */}
 <div style={{ position:"relative", width:100, height:100, margin:"0 auto 32px" }}>
 <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform:"rotate(-90deg)" }}>
 <circle cx="50" cy="50" r="42" fill="none" stroke="#27272a" strokeWidth="8"/>
 <circle cx="50" cy="50" r="42" fill="none" stroke="#6366f1" strokeWidth="8"
 strokeDasharray={`${(analyzeProgress / 100) * 264} 264`}
 strokeLinecap="round" style={{ transition:"stroke-dasharray 0.5s ease" }}/>
 </svg>
 <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, fontWeight:800, color:"#fafafa" }}>{analyzeProgress}%</div>
 </div>

 <div style={{ fontSize:22, fontWeight:700, color:"#fafafa", marginBottom:10 }}>Analysing your post</div>
 <div style={{ fontSize:14, color:"#6366f1", fontWeight:600, marginBottom:32 }}>{analyzeProgressLabel}</div>

 {/* Progress bar */}
 <div style={{ width:"100%", height:4, background:"#27272a", borderRadius:99, overflow:"hidden", marginBottom:32 }}>
 <div style={{ height:"100%", background:"linear-gradient(90deg,#6366f1,#818cf8)", borderRadius:99, width:`${analyzeProgress}%`, transition:"width 0.5s ease" }}/>
 </div>

 {/* Stage checklist */}
 <div style={{ display:"flex", flexDirection:"column", gap:8, textAlign:"left" }}>
 {[
 [15, 'Crawling URL'],
 [35, 'Parsing content'],
 [55, 'Scoring SEO'],
 [72, 'Checking issues'],
 [88, 'Building report'],
 ].map(([threshold, label]) => {
 const done = analyzeProgress > threshold;
 const active = analyzeProgress > threshold - 20 && !done;
 return (
 <div key={label} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 14px", background: done ? "#052e16" : active ? "#1e1b4b" : "#18181b", border:`1px solid ${done ? "#16a34a" : active ? "#4338ca" : "#27272a"}`, borderRadius:8 }}>
 <span style={{ fontSize:14, flexShrink:0 }}>{done ? "" : active ? "" : ""}</span>
 <span style={{ fontSize:13, color: done ? "#86efac" : active ? "#a5b4fc" : "#71717a", fontWeight: active ? 600 : 400 }}>{label}</span>
 {active && <span style={S.spinner}/>}
 </div>
 );
 })}
 </div>

 <div style={{ marginTop:24, fontSize:12, color:"#52525b" }}>Tip: Fix the top issues first — they have the most impact on rankings.</div>
 </div>
 </div>
 )}

 {/* ═══ SCREEN 3: RESULTS ═══ */}
 {analyzeScreen === 'results' && scanResult && (
 <div style={{ margin:"0 -28px", minHeight:"100vh", background:"#09090b" }}>

 {/* Top bar */}
 <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 28px", borderBottom:"1px solid #3f3f46", background:"#09090b", position:"sticky", top:0, zIndex:10 }}>
 <button
 onClick={() => { setAnalyzeScreen('input'); setScanResult(null); setScanErr(""); setAiAnalysis(null); }}
 style={{ background:"none", border:"none", color:"#a1a1aa", cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", gap:6, padding:0 }}
 >
 <span style={{ fontSize:16 }}>‹</span> Back
 </button>
 <div style={{ display:"flex", alignItems:"center", gap:10 }}>
 <span style={{ fontSize:13, fontWeight:600, color:"#22c55e", display:"flex", alignItems:"center", gap:5 }}>
 <span style={{ width:20, height:20, borderRadius:"50%", background:"#22c55e", color:"#fff", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:11 }}></span>
 URL Scanned
 </span>
 <span style={{ color:"#3f3f46", fontSize:16 }}>›</span>
 <span style={{ fontSize:13, fontWeight:600, color:"#818cf8", display:"flex", alignItems:"center", gap:5 }}>
 <span style={{ width:20, height:20, borderRadius:"50%", background:"#6366f1", color:"#fff", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700 }}>2</span>
 SEO Report
 </span>
 </div>
 <button
 onClick={() => runAiAnalysis()}
 disabled={aiAnalyzing}
 style={{ padding:"7px 16px", borderRadius:8, background: aiAnalyzing ? "#1e1b4b" : aiAnalysis ? "#052e16" : "#27272a", color: aiAnalyzing ? "#a5b4fc" : aiAnalysis ? "#86efac" : "#818cf8", fontWeight:700, fontSize:13, border:`1px solid ${aiAnalyzing ? "#4338ca" : aiAnalysis ? "#166534" : "#4338ca"}`, cursor: aiAnalyzing ? "default" : "pointer", display:"flex", alignItems:"center", gap:6 }}
 >
 {aiAnalyzing ? <><span style={S.spinner}/> Scoring...</> : aiAnalysis ? <>✓ AI Scored ↻</> : <>Score with AI</>}
 </button>
 </div>

 {/* Two-column body */}
 <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", minHeight:"calc(100vh - 53px)", alignItems:"start" }}>

 {/* ── LEFT: Article preview ── */}
 <div style={{ borderRight:"1px solid #3f3f46", padding:"28px 32px" }}>

 {/* Title + URL */}
 {scanResult.ogImage && <img src={scanResult.ogImage} alt={scanResult.title} style={{ width:"100%", maxHeight:260, objectFit:"cover", borderRadius:12, marginBottom:20, display:"block", border:"1px solid #3f3f46" }} />}
 <h1 style={{ fontSize:28, fontWeight:800, color:"#fafafa", lineHeight:1.3, marginBottom:10 }}>{scanResult.title || "(no title)"}</h1>
 <a href={scanResult.url} target="_blank" rel="noreferrer" style={{ fontSize:12, color:"#71717a", wordBreak:"break-all", textDecoration:"none", display:"block", marginBottom:20 }}>{scanResult.url}</a>

 {/* Meta description */}
 {scanResult.metaDescription && (
 <div style={{ background:"#18181b", border:"1px solid #3f3f46", borderRadius:8, padding:"12px 14px", marginBottom:20 }}>
 <div style={{ fontSize:11, fontWeight:700, color:"#71717a", textTransform:"uppercase", letterSpacing:".5px", marginBottom:5 }}>Meta Description</div>
 <div style={{ fontSize:14, color:"#a1a1aa", lineHeight:1.6 }}>{scanResult.metaDescription}</div>
 <div style={{ fontSize:11, color: scanResult.metaDescription.length > 160 ? "#f87171" : "#52525b", marginTop:5 }}>{scanResult.metaDescription.length}/160</div>
 </div>
 )}

 {/* Article heading structure */}
 {(scanResult.headings || []).length > 0 && (
 <div style={{ marginBottom:24 }}>
 <div style={{ fontSize:12, fontWeight:700, color:"#71717a", textTransform:"uppercase", letterSpacing:".5px", marginBottom:10 }}>Article Structure</div>
 <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
 {(scanResult.headings || []).slice(0,20).map((h, i) => (
 <div key={i} style={{ display:"flex", alignItems:"baseline", gap:8, paddingLeft: h.level === 2 ? 0 : h.level === 3 ? 18 : 32 }}>
 <span style={{ fontSize:10, fontWeight:700, color:"#4f46e5", background:"#1e1b4b", borderRadius:4, padding:"1px 5px", flexShrink:0 }}>H{h.level}</span>
 <span style={{ fontSize:14, color:"#d4d4d8", lineHeight:1.4 }}>{h.text}</span>
 </div>
 ))}
 {(scanResult.headings || []).length > 20 && <div style={{ fontSize:12, color:"#52525b", paddingLeft:0 }}>+{scanResult.headings.length - 20} more headings</div>}
 </div>
 </div>
 )}

 {/* Content stats chips */}
 <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:24 }}>
 {[
 ["", `${scanResult.wordCount || 0} words`],
 ["", `${scanResult.readingTimeMinutes || 0} min read`],
 ["", `${scanResult.imageCount || 0} images`],
 ["", `${scanResult.internalLinks || 0} internal · ${scanResult.externalLinks || 0} external links`],
 ["", `Flesch ${scanResult.flesch?.ease || scanResult.readabilityScore || "—"}`],
 ...(scanResult.authorMeta ? [["", scanResult.authorMeta]] : []),
 ].map(([ic, val]) => (
 <div key={val} style={{ background:"#18181b", border:"1px solid #27272a", borderRadius:20, padding:"5px 12px", fontSize:12, color:"#a1a1aa", display:"flex", alignItems:"center", gap:5 }}>
 <span>{ic}</span><span>{val}</span>
 </div>
 ))}
 </div>

 {/* Article Content expandable */}
 {scanResult.articleBodyHtml && (
 <div style={{ marginBottom:24 }}>
 <button
 onClick={() => setShowArticleBody(v => !v)}
 style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:"1px solid #3f3f46", borderRadius:8, padding:"8px 14px", color:"#a1a1aa", fontSize:12, fontWeight:600, cursor:"pointer", width:"100%", justifyContent:"space-between" }}
 >
 <span>View Article Content</span>
 <span style={{ fontSize:10 }}>{showArticleBody ? "Hide" : "Show"}</span>
 </button>
 {showArticleBody && (
 <div
 style={{ marginTop:10, background:"#18181b", border:"1px solid #3f3f46", borderRadius:10, padding:"20px 22px", maxHeight:600, overflowY:"auto", fontSize:14, color:"#d4d4d8", lineHeight:1.75 }}
 dangerouslySetInnerHTML={{ __html: scanResult.articleBodyHtml }}
 />
 )}
 </div>
 )}

 {/* AI Rewrite bar */}
 <div style={{ borderTop:"1px solid #3f3f46", paddingTop:20, marginBottom:20 }}>
 <div style={{ fontSize:13, fontWeight:700, color:"#fafafa", marginBottom:12 }}>AI Rewrite</div>
 <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
 {[["Title","title"],["Meta Description","metaDescription"],["H1","h1"]].map(([label, field]) => (
 <button key={field} onClick={() => runRewrite(field)} disabled={rewriting} style={{ padding:"8px 16px", background:"#18181b", border:"1px solid #3f3f46", borderRadius:8, color:"#d4d4d8", fontWeight:600, fontSize:13, cursor: rewriting ? "default" : "pointer" }}>
 {rewriting && rewriteField === field ? <><span style={S.spinner}/> Rewriting...</> : `${label}`}
 </button>
 ))}
 </div>
 {rewriteErr && <div style={{ fontSize:12, color:"#f87171", marginTop:8 }}>{rewriteErr}</div>}
 {rewriteResult && (
 <div style={{ marginTop:12 }}>
 {(rewriteResult.variants || [rewriteResult]).map((v, i) => (
 <div key={i} style={{ background:"#18181b", border:"1px solid #3f3f46", borderRadius:8, padding:"12px 14px", marginBottom:8 }}>
 <div style={{ fontSize:14, color:"#fafafa", marginBottom:8 }}>{typeof v === "string" ? v : v.text || v.value || JSON.stringify(v)}</div>
 <div style={{ display:"flex", gap:8, alignItems:"center" }}>
 <button style={{ ...S.btn("success"), fontSize:12, padding:"5px 14px" }} onClick={() => applyRewrite(typeof v === "string" ? v : v.text || v.value, rewriteField, i)} disabled={applyState[i] === "loading"}>
 {applyState[i] === "loading" ? "Applying..." : applyState[i] === "ok" ? "Applied!" : "Apply to Shopify"}
 </button>
 {typeof applyState[i] === "string" && applyState[i].startsWith("error:") && <span style={{ fontSize:11, color:"#f87171" }}>{applyState[i].slice(6)}</span>}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* AI Scorecard */}
 {aiAnalysisErr && <div style={{ fontSize:13, color:"#f87171", background:"#450a0a", border:"1px solid #7f1d1d", borderRadius:8, padding:"10px 14px", marginBottom:12 }}>{aiAnalysisErr}</div>}
 {aiAnalyzing && !aiAnalysis && (
 <div style={{ borderTop:"1px solid #3f3f46", paddingTop:20, display:"flex", alignItems:"center", gap:10, color:"#a5b4fc", fontSize:13 }}>
 <span style={S.spinner}/> Running AI score analysis…
 </div>
 )}
 {aiAnalysis && (() => {
 const bd = aiAnalysis.breakdown || {};
 const cats = Object.values(bd);
 return (
 <div style={{ borderTop:"1px solid #3f3f46", paddingTop:20 }}>
 <div style={{ fontSize:15, fontWeight:700, color:"#fafafa", marginBottom:14 }}>AI Score Analysis</div>
 {/* Score ring + grade */}
 <div style={{ display:"flex", gap:16, alignItems:"center", background:"#18181b", border:"1px solid #27272a", borderRadius:12, padding:"16px 18px", marginBottom:14 }}>
 <div style={{ ...S.ring(aiAnalysis.overallScore || 0), width:72, height:72, fontSize:22, flexShrink:0 }}>{aiAnalysis.overallScore ?? "—"}</div>
 <div style={{ flex:1 }}>
 <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
 <span style={{ fontSize:20, fontWeight:800, color:"#fafafa" }}>{aiAnalysis.grade || "—"}</span>
 <span style={{ fontSize:12, color:"#71717a" }}>AI SEO Grade</span>
 </div>
 {aiAnalysis.summary && <div style={{ fontSize:13, color:"#a1a1aa", lineHeight:1.5 }}>{aiAnalysis.summary}</div>}
 </div>
 </div>
 {/* Breakdown bars */}
 {cats.length > 0 && (
 <div style={{ background:"#18181b", border:"1px solid #27272a", borderRadius:10, padding:"14px 16px", marginBottom:14 }}>
 <div style={{ fontSize:11, fontWeight:700, color:"#71717a", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:12 }}>Score Breakdown</div>
 {cats.map((cat, i) => (
 <div key={i} style={{ marginBottom:12 }}>
 <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
 <span style={{ fontSize:13, fontWeight:600, color:"#d4d4d8" }}>{cat.label}</span>
 <span style={{ fontSize:13, fontWeight:700, color:(cat.score||0)>=75?"#22c55e":(cat.score||0)>=50?"#eab308":"#ef4444" }}>{cat.score ?? "—"}/100</span>
 </div>
 <div style={{ height:5, background:"#27272a", borderRadius:3, overflow:"hidden", marginBottom:5 }}>
 <div style={{ height:"100%", width:`${cat.score||0}%`, background:(cat.score||0)>=75?"#22c55e":(cat.score||0)>=50?"#eab308":"#ef4444", borderRadius:3, transition:"width .4s" }}/>
 </div>
 {(cat.issues||[]).map((iss,j) => <div key={j} style={{ fontSize:11, color:"#fca5a5", display:"flex", gap:5, marginBottom:2 }}><span style={{ flexShrink:0 }}>⚠</span>{iss}</div>)}
 {(cat.tips||[]).map((tip,j) => <div key={j} style={{ fontSize:11, color:"#86efac", display:"flex", gap:5, marginBottom:2 }}><span style={{ flexShrink:0 }}>→</span>{tip}</div>)}
 </div>
 ))}
 </div>
 )}
 {/* Critical issues + Quick wins */}
 <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
 {aiAnalysis.criticalIssues?.length > 0 && (
 <div style={{ background:"#450a0a", border:"1px solid #7f1d1d", borderRadius:10, padding:"12px 14px" }}>
 <div style={{ fontSize:12, fontWeight:700, color:"#fca5a5", marginBottom:8 }}>🚨 Critical Issues</div>
 {aiAnalysis.criticalIssues.map((iss,i) => <div key={i} style={{ fontSize:12, color:"#fca5a5", display:"flex", gap:6, marginBottom:4 }}><span style={{ flexShrink:0 }}>•</span>{iss}</div>)}
 </div>
 )}
 {aiAnalysis.quickWins?.length > 0 && (
 <div style={{ background:"#052e16", border:"1px solid #166534", borderRadius:10, padding:"12px 14px" }}>
 <div style={{ fontSize:12, fontWeight:700, color:"#86efac", marginBottom:8 }}>⚡ Quick Wins</div>
 {aiAnalysis.quickWins.map((win,i) => <div key={i} style={{ fontSize:12, color:"#86efac", display:"flex", gap:6, marginBottom:4 }}><span style={{ flexShrink:0 }}>✓</span>{win}</div>)}
 </div>
 )}
 </div>
 {/* Passed checks */}
 {aiAnalysis.passedChecks?.length > 0 && (
 <div style={{ background:"#09090b", border:"1px solid #27272a", borderRadius:10, padding:"12px 14px", marginBottom:14 }}>
 <div style={{ fontSize:12, fontWeight:700, color:"#4ade80", marginBottom:8 }}>✅ Passed Checks</div>
 <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>{aiAnalysis.passedChecks.map((c,i) => <span key={i} style={{ fontSize:11, padding:"2px 10px", background:"#052e16", color:"#86efac", border:"1px solid #166534", borderRadius:12 }}>{c}</span>)}</div>
 </div>
 )}
 {/* Title suggestions */}
 {aiAnalysis.titleSuggestions?.length > 0 && (
 <div style={{ background:"#09090b", border:"1px solid #27272a", borderRadius:10, padding:"12px 14px", marginBottom:14 }}>
 <div style={{ fontSize:12, fontWeight:700, color:"#a5b4fc", marginBottom:8 }}>💡 Optimised Title Suggestions</div>
 {aiAnalysis.titleSuggestions.map((t,i) => (
 <div key={i} style={{ fontSize:13, color:"#fafafa", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 8px", background:"#18181b", borderRadius:6, marginBottom:4 }}>
 <span style={{ flex:1, marginRight:8, lineHeight:1.4 }}>{t}</span>
 <button onClick={() => navigator.clipboard?.writeText(t)} style={{ fontSize:11, padding:"2px 8px", borderRadius:6, background:"#3f3f46", color:"#a1a1aa", border:"none", cursor:"pointer", flexShrink:0 }}>Copy</button>
 </div>
 ))}
 </div>
 )}
 {/* Meta descriptions */}
 {aiAnalysis.metaDescriptions?.length > 0 && (
 <div style={{ background:"#09090b", border:"1px solid #27272a", borderRadius:10, padding:"12px 14px" }}>
 <div style={{ fontSize:12, fontWeight:700, color:"#5eead4", marginBottom:8 }}>📝 Meta Description Options</div>
 {aiAnalysis.metaDescriptions.map((d,i) => (
 <div key={i} style={{ fontSize:13, color:"#fafafa", display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, padding:"6px 8px", background:"#18181b", borderRadius:6, marginBottom:4 }}>
 <span style={{ lineHeight:1.5, flex:1 }}>{d}</span>
 <button onClick={() => navigator.clipboard?.writeText(d)} style={{ fontSize:11, padding:"2px 8px", borderRadius:6, background:"#3f3f46", color:"#a1a1aa", border:"none", cursor:"pointer", flexShrink:0 }}>Copy</button>
 </div>
 ))}
 </div>
 )}
 </div>
 );
 })()}
 </div>

 {/* ── RIGHT: SEO Sidebar ── */}
 <div style={{ padding:"20px 16px", background:"#09090b", position:"sticky", top:53, maxHeight:"calc(100vh - 53px)", overflowY:"auto" }}>

 {/* Overall score ring */}
 {(() => {
 const score = scanResult.scored?.overall ?? 0;
 const col = score >= 75 ? "#22c55e" : score >= 50 ? "#facc15" : "#f87171";
 const r = 38, circ = 2 * Math.PI * r;
 const dash = (score / 100) * circ;
 return (
 <div style={{ textAlign:"center", padding:"8px 0 16px", borderBottom:"1px solid #3f3f46", marginBottom:16 }}>
 <div style={{ position:"relative", width:100, height:100, margin:"0 auto 12px" }}>
 <svg width="100" height="100" viewBox="0 0 100 100">
 <circle cx="50" cy="50" r={r} fill="none" stroke="#27272a" strokeWidth="8"/>
 <circle cx="50" cy="50" r={r} fill="none" stroke={col} strokeWidth="8"
 strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ / 4}
 strokeLinecap="round" transform="rotate(-90 50 50)" style={{ transition:"stroke-dasharray .6s" }}/>
 </svg>
 <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
 <span style={{ fontSize:28, fontWeight:900, color:col, lineHeight:1 }}>{score}</span>
 <span style={{ fontSize:11, color:"#71717a", fontWeight:700 }}>/ 100</span>
 </div>
 </div>
 <div style={{ fontSize:13, fontWeight:700, color:"#fafafa", marginBottom:4 }}>SEO Score</div>
 <div style={{ display:"flex", justifyContent:"center", gap:16 }}>
 {[["Words", scanResult.wordCount], ["Issues", scanResult.scored?.issueCount], ["Grade", scanResult.scored?.grade]].map(([l, v]) => (
 <div key={l} style={{ textAlign:"center" }}>
 <div style={{ fontSize:16, fontWeight:800, color:"#fafafa" }}>{v ?? "—"}</div>
 <div style={{ fontSize:10, color:"#71717a", fontWeight:700, letterSpacing:".5px" }}>{l}</div>
 </div>
 ))}
 </div>
 </div>
 );
 })()}

 {/* Category scores */}
 {scanResult.scored?.categories && (
 <div style={{ marginBottom:16, borderBottom:"1px solid #3f3f46", paddingBottom:16 }}>
 {[
 ["Content", scanResult.scored.categories.content?.score ?? scanResult.scored.categories.Content?.score],
 ["Meta", scanResult.scored.categories.meta?.score ?? scanResult.scored.categories.Meta?.score],
 ["Keywords", scanResult.scored.categories.keywords?.score ?? scanResult.scored.categories.Keywords?.score],
 ["Technical", scanResult.scored.categories.technical?.score ?? scanResult.scored.categories.Technical?.score],
 ["Structure", scanResult.scored.categories.structure?.score ?? scanResult.scored.categories.Structure?.score],
 ].filter(([,v]) => v !== undefined && v !== null).map(([label, score]) => {
 const col = score >= 75 ? "#22c55e" : score >= 50 ? "#facc15" : "#f87171";
 return (
 <div key={label} style={{ marginBottom:10 }}>
 <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
 <span style={{ fontSize:12, color:"#a1a1aa", fontWeight:600 }}>{label}</span>
 <span style={{ fontSize:12, fontWeight:700, color:col }}>{score}</span>
 </div>
 <div style={{ height:5, background:"#27272a", borderRadius:99, overflow:"hidden" }}>
 <div style={{ height:"100%", width:`${score}%`, background:col, borderRadius:99, transition:"width .5s" }}/>
 </div>
 </div>
 );
 })}
 </div>
 )}

 {/* Issues list */}
 {(scanResult.scored?.issues || []).length > 0 && (
 <div>
 <div style={{ fontSize:12, fontWeight:700, color:"#71717a", textTransform:"uppercase", letterSpacing:".5px", marginBottom:10 }}>Issues ({scanResult.scored.issueCount})</div>
 <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
 {(scanResult.scored.issues || []).filter(iss => !fixedFields.has(iss.field) && !dismissedIssues.includes(iss.msg)).slice(0, 8).map((issue, i) => {
 const act = getIssueAction(issue.msg);
 const fixSt = bannerFixState[issue.msg];
 const alreadyFixed = fixSt === "ok" || fixedFields.has(issue.field || "");
 const sevCol = issue.sev === "high" ? "#f87171" : issue.sev === "medium" ? "#facc15" : "#60a5fa";
 const sevBorder = issue.sev === "high" ? "#7f1d1d" : issue.sev === "medium" ? "#78350f" : "#1e3a5f";
 return (
 <div key={i} style={{ display:"flex", flexDirection:"column", gap:4 }}>
 <div style={{ background: fixSt === "loading" ? "#1e1b4b" : "#18181b", border:`1px solid ${fixSt === "loading" ? "#4338ca" : sevBorder}`, borderRadius:8, padding:"8px 10px", transition:"background 0.2s" }}>
 <div style={{ display:"flex", alignItems:"flex-start", gap:6 }}>
 {alreadyFixed
 ? <span style={{ fontSize:13, flexShrink:0 }}></span>
 : <span style={{ fontSize:10, fontWeight:700, color:sevCol, background: issue.sev==="high"?"#1c0000":issue.sev==="medium"?"#1c1500":"#0c1a2e", borderRadius:4, padding:"2px 5px", flexShrink:0, marginTop:1 }}>{issue.sev}</span>
 }
 <div style={{ flex:1 }}>
 <div style={{ fontSize:11, color: alreadyFixed ? "#52525b" : "#d4d4d8", lineHeight:1.4, textDecoration: alreadyFixed ? "line-through" : "none" }}>{issue.msg}</div>
 {!alreadyFixed && (act ? (
 <button
 onClick={act.action}
 disabled={fixSt === "loading"}
 style={{ marginTop:5, fontSize:10, color: fixSt === "loading" ? "#c7d2fe" : "#818cf8", background: fixSt === "loading" ? "#312e81" : "none", border:`1px solid ${fixSt === "loading" ? "#4338ca" : "#4338ca"}`, borderRadius:5, padding:"3px 8px", cursor: fixSt === "loading" ? "default" : "pointer", minWidth:90 }}>
 {fixSt === "loading" ? `${spinChar} Working…` : `${act.label}${act.credits ? ` · ${act.credits} cr` : ""}`}
 </button>
 ) : (
 <button onClick={runAiAnalysis} disabled={aiAnalyzing} style={{ marginTop:5, fontSize:10, color:"#818cf8", background:"none", border:"1px solid #4338ca", borderRadius:5, padding:"3px 8px", cursor:"pointer" }}>
 {aiAnalyzing ? `${spinChar} Working…` : "AI Chat · 1 cr"}
 </button>
 ))}
 {fixSt === "error" && <span style={{ fontSize:10, color:"#fca5a5", marginLeft:6 }}>failed</span>}
 </div>
 </div>
 </div>
 {/* Inline tip (for how-to-fix non-AI issues) */}
 {inlineTipIssue === issue.msg && act?.tip && (
 <div style={{ background:"#1c1007", border:"1px solid #92400e", borderRadius:8, padding:"10px 12px", fontSize:11, color:"#fbbf24", lineHeight:1.5, display:"flex", gap:8, marginTop:4 }}>
 <span style={{ flexShrink:0 }}></span>
 <span style={{ flex:1 }}>{act.tip}</span>
 <div style={{ display:"flex", flexDirection:"column", gap:3, flexShrink:0 }}>
 <button style={{ fontSize:10, padding:"2px 6px", background:"none", border:"1px solid #92400e", borderRadius:5, color:"#fbbf24", cursor:"pointer" }} onClick={() => setInlineTipIssue(null)}></button>
 <button style={{ fontSize:10, padding:"2px 6px", background:"#78350f", border:"1px solid #92400e", borderRadius:5, color:"#fcd34d", cursor:"pointer" }} onClick={() => dismissIssue(issue.msg)}>Dismiss</button>
 </div>
 </div>
 )}
 {/* Before / after card */}
 {fixSt === "ok" && fixSummaries[issue.msg] && (() => {
 const s = fixSummaries[issue.msg];
 return (
 <div style={{ background:"#052e16", border:"1px solid #166534", borderRadius:6, padding:"8px 12px", fontSize:11, color:"#bbf7d0", lineHeight:1.6, marginLeft:4 }}>
 <span style={{ color:"#4ade80", fontWeight:700 }}>{s.what} updated</span>
 {s.before != null && s.after != null ? (
 <div style={{ marginTop:4, display:"flex", flexDirection:"column", gap:3 }}>
 <div style={{ background:"#0f1e14", borderRadius:4, padding:"4px 8px" }}>
 <span style={{ color:"#6b7280", fontSize:10, fontWeight:600, display:"block", marginBottom:1 }}>BEFORE</span>
 <span style={{ color:"#9ca3af" }}>{s.before || "(empty)"}</span>
 </div>
 <div style={{ background:"#0a2e14", borderRadius:4, padding:"4px 8px" }}>
 <span style={{ color:"#4ade80", fontSize:10, fontWeight:600, display:"block", marginBottom:1 }}>AFTER</span>
 <span style={{ color:"#bbf7d0" }}>{s.after}</span>
 </div>
 </div>
 ) : s.detail ? (
 <div style={{ marginTop:4, background:"#0a2e14", borderRadius:4, padding:"4px 8px", color:"#86efac" }}>{s.detail}</div>
 ) : null}
 </div>
 );
 })()}
 </div>
 );
 })}
 {(scanResult.scored.issues || []).filter(i => !fixedFields.has(i.field) && !dismissedIssues.includes(i.msg)).length > 8 && (
 <div style={{ fontSize:11, color:"#52525b", textAlign:"center", padding:"4px 0" }}>+{(scanResult.scored.issues || []).filter(i => !fixedFields.has(i.field) && !dismissedIssues.includes(i.msg)).length - 8} more — fix above first</div>
 )}
 </div>

 {/* Re-scan button */}
 <button
 onClick={() => runScan(true)}
 disabled={scanning}
 style={{ width:"100%", marginTop:12, padding:"8px 0", borderRadius:8, background:"#27272a", color:"#a1a1aa", fontWeight:600, fontSize:12, border:"1px solid #3f3f46", cursor: scanning ? "default" : "pointer" }}
 >{scanning ? "Re-scanning..." : "↺ Re-scan Post"}</button>
 </div>
 )}
 </div>
 </div>
 </div>
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
 {/* Long-tail keywords */}
 {kwResult.longTailKeywords?.length > 0 && (
 <div style={{ marginTop: 16 }}>
 <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Long-tail Keywords</div>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
 {kwResult.longTailKeywords.map((kw, i) => (
 <span key={i} style={{ fontSize: 12, padding: "3px 10px", background: "#1e1b4b", color: "#a5b4fc", borderRadius: 10, border: "1px solid #3730a3" }}>{kw}</span>
 ))}
 </div>
 </div>
 )}
 {/* Questions to answer */}
 {kwResult.questionsToAnswer?.length > 0 && (
 <div style={{ marginTop: 16 }}>
 <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Questions to Answer</div>
 {kwResult.questionsToAnswer.map((q, i) => (
 <div key={i} style={{ fontSize: 13, color: C.sub, padding: "4px 0", borderBottom: `1px solid ${C.border}` }}>❓ {q}</div>
 ))}
 </div>
 )}
 {/* Content ideas */}
 {kwResult.contentIdeas?.length > 0 && (
 <div style={{ marginTop: 16 }}>
 <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Content Ideas</div>
 {kwResult.contentIdeas.map((idea, i) => (
 <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "6px 0", borderBottom: `1px solid ${C.border}` }}>
 <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 8, background: C.muted, color: C.sub, whiteSpace: "nowrap", marginTop: 2 }}>{idea.type}</span>
 <div>
 <div style={{ fontSize: 13, color: C.text }}>{idea.title}</div>
 {idea.targetKeyword && <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>Target: {idea.targetKeyword}</div>}
 </div>
 </div>
 ))}
 </div>
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
 {/* Beginner / Advanced toggle */}
 <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
 <div style={{ display: "flex", background: "#18181b", border: `1px solid ${C.border}`, borderRadius: 999, padding: 3, gap: 2 }}>
 {[["beginner", "🟢 Beginner"], ["advanced", "⚡ Advanced"]].map(([mode, label]) => (
 <button key={mode} onClick={() => setWriteMode(mode)} style={{
 padding: "6px 18px", borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "none",
 background: writeMode === mode ? (mode === "beginner" ? "#059669" : C.indigo) : "transparent",
 color: writeMode === mode ? "#fff" : C.sub, transition: "all .15s",
 }}
 >{label}</button>
 ))}
 </div>
 {writeMode === "beginner" && <span style={{ fontSize: 12, color: C.dim }}>Simple mode — AI writes for you, nicely formatted</span>}
 {writeMode === "advanced" && <span style={{ fontSize: 12, color: C.dim }}>Full control — outlines, intros, titles, briefs & raw HTML</span>}
 </div>

 {/* ── BEGINNER MODE ── */}
 {writeMode === "beginner" && (
 <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "24px 24px 20px" }}>
 <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>✨ Generate a Blog Post</div>
 <div style={{ fontSize: 13, color: C.dim, marginBottom: 20 }}>Add keywords and options — AI writes a full, SEO-optimised article and saves it to Shopify.</div>

 {/* Keyword mode radio */}
 <div style={{ fontSize: 13, fontWeight: 500, color: "#d4d4d8", marginBottom: 10 }}>Create article using the following keywords</div>
 <div style={{ display: "flex", gap: 20, marginBottom: 14 }}>
 {[["manual","Manual Input"],["ai","AI Generate"]].map(([val,lbl]) => (
 <label key={val} style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:13, color:"#d4d4d8" }}>
 <input type="radio" checked={genKwMode===val} onChange={() => setGenKwMode(val)} style={{ accentColor:"#6366f1" }}/> {lbl}
 </label>
 ))}
 </div>

 {/* Shop keyword chips */}
 {(genSuggestionsLoading || genShopSuggestions.length > 0) && (
 <div style={{ marginBottom: 8 }}>
 <div style={{ fontSize: 11, color: C.dim, marginBottom: 6 }}>
 {genSuggestionsLoading ? "Loading from your shop..." : "From your shop — click to add:"}
 </div>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
 {genSuggestionsLoading
 ? <span style={S.spinner}/>
 : genShopSuggestions.map((kw, i) => (
 <button key={i}
 onClick={() => { if (!genKeywords.includes(kw)) setGenKeywords(prev => [...prev, kw]); }}
 style={{ background: genKeywords.includes(kw) ? "#4f46e5" : "#27272a", border:"1px solid #3f3f46", borderRadius:6, padding:"3px 10px", fontSize:12, color: genKeywords.includes(kw) ? "#fff" : "#d4d4d8", cursor:"pointer" }}
 >{kw}</button>
 ))}
 </div>
 </div>
 )}

 {/* Keyword input box */}
 {genKwMode === "ai" ? (
 <div style={{ border:"1.5px solid #3f3f46", borderRadius:10, padding:"10px 12px", marginBottom:16, background:"#09090b" }}>
 <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom: genKeywords.length ? 8 : 0 }}>
 {genKeywords.map((kw,i) => (
 <span key={i} style={{ display:"inline-flex", alignItems:"center", gap:4, background:"#27272a", border:"1px solid #3f3f46", borderRadius:6, padding:"3px 10px", fontSize:12, color:"#d4d4d8" }}>
 {kw}
 <button onClick={() => setGenKeywords(prev => prev.filter((_,j)=>j!==i))} style={{ background:"none", border:"none", cursor:"pointer", color:"#71717a", fontSize:13, padding:0, lineHeight:1 }}>×</button>
 </span>
 ))}
 </div>
 <div style={{ display:"flex", gap:8, alignItems:"center" }}>
 <input style={{ flex:1, border:"none", outline:"none", fontSize:13, background:"transparent", color:"#fafafa", padding:"2px 0" }}
 placeholder={genKeywords.length ? "Add more keywords..." : "Or type a keyword..."}
 value={genKwInput}
 onChange={e => setGenKwInput(e.target.value)}
 onKeyDown={e => { if(e.key==="Enter" && genKwInput.trim()) { setGenKeywords(prev=>[...prev, genKwInput.trim()]); setGenKwInput(""); } }}
 />
 <button onClick={genExpandKeywords} disabled={!genKwInput.trim() || genKwLoading} title="AI expand keywords"
 style={{ background:"#6366f1", border:"none", borderRadius:6, width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", cursor:!genKwInput.trim()||genKwLoading?"default":"pointer", opacity:!genKwInput.trim()||genKwLoading?0.5:1 }}
 >{genKwLoading ? <span style={S.spinner}/> : <span style={{ color:"#fff", fontSize:14 }}>✦</span>}</button>
 </div>
 </div>
 ) : (
 <div style={{ border:"1.5px solid #3f3f46", borderRadius:10, padding:"10px 12px", marginBottom:16, background:"#09090b" }}>
 <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom: genKeywords.length ? 8 : 0 }}>
 {genKeywords.map((kw,i) => (
 <span key={i} style={{ display:"inline-flex", alignItems:"center", gap:4, background:"#27272a", border:"1px solid #3f3f46", borderRadius:6, padding:"3px 10px", fontSize:12, color:"#d4d4d8" }}>
 {kw}
 <button onClick={() => setGenKeywords(prev => prev.filter((_,j)=>j!==i))} style={{ background:"none", border:"none", cursor:"pointer", color:"#71717a", fontSize:13, padding:0, lineHeight:1 }}>×</button>
 </span>
 ))}
 </div>
 <input style={{ width:"100%", border:"none", outline:"none", fontSize:13, background:"transparent", color:"#fafafa", padding:"2px 0" }}
 placeholder="Press Enter ↵ to add another keyword"
 value={genKwInput}
 onChange={e => setGenKwInput(e.target.value)}
 onKeyDown={e => { if(e.key==="Enter" && genKwInput.trim()) { setGenKeywords(prev=>[...prev, genKwInput.trim()]); setGenKwInput(""); } }}
 />
 </div>
 )}

 {/* Cover image */}
 <div style={{ marginBottom: 14 }}>
 <div style={{ fontSize: 13, fontWeight: 500, color: "#d4d4d8", marginBottom: 8 }}>Cover image</div>
 <div style={{ position: "relative" }}>
 <select value={genCoverImage} onChange={e => setGenCoverImage(e.target.value)}
 style={{ width:"100%", padding:"10px 36px 10px 12px", borderRadius:8, border:"1px solid #3f3f46", background:"#09090b", color:"#d4d4d8", fontSize:13, appearance:"none", outline:"none", cursor:"pointer" }}>
 <option value="ai-1:1">Generate by AI – 1:1</option>
 <option value="ai-16:9">Generate by AI – 16:9</option>
 <option value="ai-4:3">Generate by AI – 4:3</option>
 <option value="none">No cover image</option>
 </select>
 <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", color:"#71717a", pointerEvents:"none", fontSize:12 }}>▾</span>
 </div>
 </div>

 {/* Language */}
 <div style={{ marginBottom: 14 }}>
 <div style={{ fontSize: 13, fontWeight: 500, color: "#d4d4d8", marginBottom: 8 }}>Article language</div>
 <div style={{ display: "flex", gap: 8 }}>
 <div style={{ position:"relative", flex:1 }}>
 <select value={genLanguage.split("-")[1] || "US"} onChange={e => setGenLanguage(`${genLanguage.split("-")[0]}-${e.target.value}`)}
 style={{ width:"100%", padding:"10px 32px 10px 12px", borderRadius:8, border:"1px solid #3f3f46", background:"#09090b", color:"#d4d4d8", fontSize:13, appearance:"none", outline:"none", cursor:"pointer" }}>
 <option value="US">United States</option>
 <option value="GB">United Kingdom</option>
 <option value="AU">Australia</option>
 <option value="CA">Canada</option>
 <option value="DE">Germany</option>
 <option value="FR">France</option>
 <option value="ES">Spain</option>
 </select>
 <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", color:"#71717a", pointerEvents:"none", fontSize:12 }}>▾</span>
 </div>
 <div style={{ position:"relative", flex:1 }}>
 <select value={genLanguage.split("-")[0] || "en"} onChange={e => setGenLanguage(`${e.target.value}-${genLanguage.split("-")[1] || "US"}`)}
 style={{ width:"100%", padding:"10px 32px 10px 12px", borderRadius:8, border:"1px solid #3f3f46", background:"#09090b", color:"#d4d4d8", fontSize:13, appearance:"none", outline:"none", cursor:"pointer" }}>
 <option value="en">English (US)</option>
 <option value="en-GB">English (UK)</option>
 <option value="fr">French</option>
 <option value="de">German</option>
 <option value="es">Spanish</option>
 <option value="it">Italian</option>
 <option value="pt">Portuguese</option>
 </select>
 <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", color:"#71717a", pointerEvents:"none", fontSize:12 }}>▾</span>
 </div>
 </div>
 </div>

 {/* AI web research */}
 <div style={{ background:"#09090b", border:"1px solid #3f3f46", borderRadius:10, padding:"12px 14px", marginBottom:18, display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
 <div>
 <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
 <span style={{ fontSize:13 }}>🔍</span>
 <span style={{ fontSize:13, fontWeight:600, color:"#a78bfa" }}>AI web research</span>
 </div>
 <div style={{ fontSize:12, color:"#71717a", lineHeight:1.5 }}>We'll search Google/Wikipedia for similar topics to generate up-to-date content.</div>
 </div>
 <div onClick={() => setGenAiResearch(!genAiResearch)}
 style={{ flexShrink:0, width:40, height:22, borderRadius:99, background: genAiResearch ? "#6366f1" : "#3f3f46", cursor:"pointer", position:"relative", transition:"background .2s", marginTop:2 }}>
 <div style={{ position:"absolute", top:3, left: genAiResearch ? 21 : 3, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left .2s" }}/>
 </div>
 </div>

 {genModalErr && <div style={{ ...S.err, marginBottom: 12 }}>{genModalErr}</div>}

 <button
 style={{ width:"100%", padding:"13px 0", borderRadius:10, background: (!genKeywords.length && !genKwInput.trim()) || genTitleLoading ? "#4338ca" : "#6366f1", color:"#fff", fontWeight:700, fontSize:15, border:"none", cursor: (!genKeywords.length && !genKwInput.trim()) || genTitleLoading ? "default" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, opacity: (!genKeywords.length && !genKwInput.trim()) || genTitleLoading ? 0.6 : 1 }}
 disabled={(!genKeywords.length && !genKwInput.trim()) || genTitleLoading}
 onClick={genGenerateTitles}
 >{genTitleLoading ? <><span style={S.spinner}/> Generating titles...</> : <><span style={{ fontSize:15 }}>✨</span> Write My Blog Post</>}</button>
 </div>
 )}

 {/* ── ADVANCED MODE — sub-nav ── */}
 {writeMode === "advanced" && (
 <>
{/* Sub-nav — workflow pipeline */}
          <div style={{ marginBottom: 20, display: "none" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ fontSize: 11, color: C.dim }}>Suggested workflow — click any step:</div>
              <span style={{ fontSize: 10, color: C.dim, fontStyle: "italic" }}>✓ = result ready</span>
            </div>
            {/* Row 1 — Creation steps */}
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 5 }}>Create</div>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 10px", marginBottom: 8 }}>
              {[
                ["brief",   "1", "📋", "Brief",   !!briefResult],
                ["titles",  "2", "💡", "Titles",  !!titleResult],
                ["outline", "3", "📝", "Outline", !!outlineResult],
                ["intro",   "4", "✍️",  "Intro",   !!introResult],
                ["draft",   "5", "📄", "Draft",   !!draftResult],
              ].map(([key, num, icon, label, done], i, arr) => (
                <React.Fragment key={key}>
                  <button onClick={() => navigateTo(key)} style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                    cursor: "pointer",
                    border: writeSub === key ? `1px solid ${C.indigo}` : "1px solid transparent",
                    background: writeSub === key ? "#1e1b4b" : "transparent",
                    color: writeSub === key ? "#a5b4fc" : done ? "#6ee7b7" : C.sub,
                    transition: "all .15s",
                  }}>
                    {done && writeSub !== key
                      ? <span style={{ width: 16, height: 16, borderRadius: "50%", background: "#052e16", color: "#6ee7b7", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, flexShrink: 0 }}>✓</span>
                      : <span style={{ width: 16, height: 16, borderRadius: "50%", background: writeSub === key ? C.indigo : C.muted, color: writeSub === key ? "#fff" : C.sub, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{num}</span>
                    }
                    <span>{icon} {label}</span>
                  </button>
                  {i < arr.length - 1 && <span style={{ color: C.dim, fontSize: 14, padding: "0 2px", userSelect: "none" }}>›</span>}
                </React.Fragment>
              ))}
            </div>
            {/* Row 2 — Publish prep steps */}
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 5 }}>Publish prep</div>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 2, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 10px" }}>
              {[
                ["images",  "6", "🖼️",  "Images",    !!imgResult],
                ["repurpose","7","📣",  "Repurpose", !!repResult],
                ["tags",    "8", "🏷️",  "Tags & Schema", !!tagsResult],
                ["seo",     "9", "📊",  "SEO Score",     !!seoResult],
              ].map(([key, num, icon, label, done], i, arr) => (
                <React.Fragment key={key}>
                  <button onClick={() => navigateTo(key)} style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                    cursor: "pointer",
                    border: writeSub === key ? `1px solid #0d9488` : "1px solid transparent",
                    background: writeSub === key ? "#042f2e" : "transparent",
                    color: writeSub === key ? "#5eead4" : done ? "#6ee7b7" : C.sub,
                    transition: "all .15s",
                  }}>
                    {done && writeSub !== key
                      ? <span style={{ width: 16, height: 16, borderRadius: "50%", background: "#052e16", color: "#6ee7b7", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, flexShrink: 0 }}>✓</span>
                      : <span style={{ width: 16, height: 16, borderRadius: "50%", background: writeSub === key ? "#0d9488" : C.muted, color: writeSub === key ? "#fff" : C.sub, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{num}</span>
                    }
                    <span>{icon} {label}</span>
                  </button>
                  {i < arr.length - 1 && <span style={{ color: C.dim, fontSize: 14, padding: "0 2px", userSelect: "none" }}>›</span>}
                </React.Fragment>
              ))}
            </div>
 </div>

 {/* Full Article — advanced version of beginner mode with all controls */}
 {writeSub === "full" && (
 <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "24px 24px 20px" }}>
 <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>🚀 Full Article Generator</div>
 <div style={{ fontSize: 13, color: C.dim, marginBottom: 20 }}>Full control — keywords, cover image, language, structure, AI research. Goes through the WriteFlow editor with SEO scoring and Shopify publishing.</div>

 {/* Keyword mode */}
 <div style={{ fontSize: 13, fontWeight: 500, color: "#d4d4d8", marginBottom: 10 }}>Create article using the following keywords</div>
 <div style={{ display: "flex", gap: 20, marginBottom: 14 }}>
 {[["manual","Manual Input"],["ai","AI Generate"]].map(([val,lbl]) => (
 <label key={val} style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:13, color:"#d4d4d8" }}>
 <input type="radio" checked={genKwMode===val} onChange={() => setGenKwMode(val)} style={{ accentColor:"#6366f1" }}/> {lbl}
 </label>
 ))}
 </div>

 {/* Shop chips */}
 {(genSuggestionsLoading || genShopSuggestions.length > 0) && (
 <div style={{ marginBottom: 10 }}>
 <div style={{ fontSize: 11, color: C.dim, marginBottom: 6 }}>
 {genSuggestionsLoading ? "Loading from your shop..." : "From your shop — click to add:"}
 </div>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
 {genSuggestionsLoading
 ? <span style={S.spinner}/>
 : genShopSuggestions.map((kw, i) => (
 <button key={i}
 onClick={() => { if (!genKeywords.includes(kw)) setGenKeywords(prev => [...prev, kw]); }}
 style={{ background: genKeywords.includes(kw) ? "#4f46e5" : "#27272a", border:"1px solid #3f3f46", borderRadius:6, padding:"3px 10px", fontSize:12, color: genKeywords.includes(kw) ? "#fff" : "#d4d4d8", cursor:"pointer" }}
 >{kw}</button>
 ))}
 </div>
 </div>
 )}

 {/* Keyword input */}
 {genKwMode === "ai" ? (
 <div style={{ border:"1.5px solid #3f3f46", borderRadius:10, padding:"10px 12px", marginBottom:16, background:"#09090b" }}>
 <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom: genKeywords.length ? 8 : 0 }}>
 {genKeywords.map((kw,i) => (
 <span key={i} style={{ display:"inline-flex", alignItems:"center", gap:4, background:"#27272a", border:"1px solid #3f3f46", borderRadius:6, padding:"3px 10px", fontSize:12, color:"#d4d4d8" }}>
 {kw}
 <button onClick={() => setGenKeywords(prev => prev.filter((_,j)=>j!==i))} style={{ background:"none", border:"none", cursor:"pointer", color:"#71717a", fontSize:13, padding:0, lineHeight:1 }}>×</button>
 </span>
 ))}
 </div>
 <div style={{ display:"flex", gap:8, alignItems:"center" }}>
 <input style={{ flex:1, border:"none", outline:"none", fontSize:13, background:"transparent", color:"#fafafa", padding:"2px 0" }}
 placeholder={genKeywords.length ? "Add more keywords..." : "Or type a keyword..."}
 value={genKwInput} onChange={e => setGenKwInput(e.target.value)}
 onKeyDown={e => { if(e.key==="Enter" && genKwInput.trim()) { setGenKeywords(prev=>[...prev, genKwInput.trim()]); setGenKwInput(""); } }}
 />
 <button onClick={genExpandKeywords} disabled={!genKwInput.trim() || genKwLoading} title="AI expand keywords"
 style={{ background:"#6366f1", border:"none", borderRadius:6, width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", cursor:!genKwInput.trim()||genKwLoading?"default":"pointer", opacity:!genKwInput.trim()||genKwLoading?0.5:1 }}
 >{genKwLoading ? <span style={S.spinner}/> : <span style={{ color:"#fff", fontSize:14 }}>✦</span>}</button>
 </div>
 </div>
 ) : (
 <div style={{ border:"1.5px solid #3f3f46", borderRadius:10, padding:"10px 12px", marginBottom:16, background:"#09090b" }}>
 <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom: genKeywords.length ? 8 : 0 }}>
 {genKeywords.map((kw,i) => (
 <span key={i} style={{ display:"inline-flex", alignItems:"center", gap:4, background:"#27272a", border:"1px solid #3f3f46", borderRadius:6, padding:"3px 10px", fontSize:12, color:"#d4d4d8" }}>
 {kw}
 <button onClick={() => setGenKeywords(prev => prev.filter((_,j)=>j!==i))} style={{ background:"none", border:"none", cursor:"pointer", color:"#71717a", fontSize:13, padding:0, lineHeight:1 }}>×</button>
 </span>
 ))}
 </div>
 <input style={{ width:"100%", border:"none", outline:"none", fontSize:13, background:"transparent", color:"#fafafa", padding:"2px 0" }}
 placeholder="Press Enter ↵ to add another keyword"
 value={genKwInput} onChange={e => setGenKwInput(e.target.value)}
 onKeyDown={e => { if(e.key==="Enter" && genKwInput.trim()) { setGenKeywords(prev=>[...prev, genKwInput.trim()]); setGenKwInput(""); } }}
 />
 </div>
 )}

 {/* Advanced structure controls */}
 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
 {/* Outline length */}
 <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
 <div style={{ fontSize: 12, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>Article length</div>
 {[
 ["small", "Short", "700–1,500 words"],
 ["medium", "Medium", "1,500–3,000 words"],
 ["long", "Long", "3,000–5,000 words"],
 ].map(([val, label, hint]) => (
 <div key={val} onClick={() => setWfOutlineSize(val)} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 0", cursor:"pointer" }}>
 <div style={{ width:14, height:14, borderRadius:"50%", border:`2px solid ${wfOutlineSize===val ? C.indigo : C.muted}`, background: wfOutlineSize===val ? C.indigo : "transparent", flexShrink:0 }}/>
 <div>
 <div style={{ fontSize:12, color: wfOutlineSize===val ? C.text : C.sub, fontWeight: wfOutlineSize===val ? 600 : 400 }}>{label}</div>
 <div style={{ fontSize:11, color: C.dim }}>{hint}</div>
 </div>
 </div>
 ))}
 </div>

 {/* Section toggles */}
 <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
 <div style={{ fontSize: 12, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>Include sections</div>
 {[
 ["Conclusion", wfConclusion, setWfConclusion, "Wrap-up summary"],
 ["FAQs", wfFaqs, setWfFaqs, "Frequently asked questions"],
 ].map(([label, val, setter, hint]) => (
 <div key={label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
 <div>
 <div style={{ fontSize:12, fontWeight:500, color: val ? C.text : C.sub }}>{label}</div>
 <div style={{ fontSize:11, color:C.dim }}>{hint}</div>
 </div>
 <div onClick={() => setter(!val)} style={{ width:36, height:20, borderRadius:10, background: val ? C.indigo : C.muted, cursor:"pointer", position:"relative", transition:"background .2s", flexShrink:0 }}>
 <div style={{ position:"absolute", top:2, left: val ? 18 : 2, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left .2s" }}/>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Cover image + Language row */}
 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
 <div>
 <div style={{ fontSize: 13, fontWeight: 500, color: "#d4d4d8", marginBottom: 6 }}>Cover image</div>
 <div style={{ position: "relative" }}>
 <select value={genCoverImage} onChange={e => setGenCoverImage(e.target.value)}
 style={{ width:"100%", padding:"10px 32px 10px 12px", borderRadius:8, border:"1px solid #3f3f46", background:"#09090b", color:"#d4d4d8", fontSize:13, appearance:"none", outline:"none", cursor:"pointer" }}>
 <option value="ai-1:1">AI – 1:1 square</option>
 <option value="ai-16:9">AI – 16:9 wide</option>
 <option value="ai-4:3">AI – 4:3</option>
 <option value="none">No cover image</option>
 </select>
 <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", color:"#71717a", pointerEvents:"none", fontSize:12 }}>▾</span>
 </div>
 </div>
 <div>
 <div style={{ fontSize: 13, fontWeight: 500, color: "#d4d4d8", marginBottom: 6 }}>Language</div>
 <div style={{ position:"relative" }}>
 <select value={genLanguage.split("-")[0] || "en"} onChange={e => setGenLanguage(`${e.target.value}-${genLanguage.split("-")[1] || "US"}`)}
 style={{ width:"100%", padding:"10px 32px 10px 12px", borderRadius:8, border:"1px solid #3f3f46", background:"#09090b", color:"#d4d4d8", fontSize:13, appearance:"none", outline:"none", cursor:"pointer" }}>
 <option value="en">English</option>
 <option value="en-GB">English (UK)</option>
 <option value="fr">French</option>
 <option value="de">German</option>
 <option value="es">Spanish</option>
 <option value="it">Italian</option>
 <option value="pt">Portuguese</option>
 </select>
 <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", color:"#71717a", pointerEvents:"none", fontSize:12 }}>▾</span>
 </div>
 </div>
 </div>

 {/* AI web research */}
 <div style={{ background:"#09090b", border:"1px solid #3f3f46", borderRadius:10, padding:"12px 14px", marginBottom:18, display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
 <div>
 <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
 <span style={{ fontSize:13 }}>🔍</span>
 <span style={{ fontSize:13, fontWeight:600, color:"#a78bfa" }}>AI web research</span>
 </div>
 <div style={{ fontSize:12, color:"#71717a", lineHeight:1.5 }}>We'll search Google/Wikipedia for similar topics to generate up-to-date content.</div>
 </div>
 <div onClick={() => setGenAiResearch(!genAiResearch)}
 style={{ flexShrink:0, width:40, height:22, borderRadius:99, background: genAiResearch ? "#6366f1" : "#3f3f46", cursor:"pointer", position:"relative", transition:"background .2s", marginTop:2 }}>
 <div style={{ position:"absolute", top:3, left: genAiResearch ? 21 : 3, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left .2s" }}/>
 </div>
 </div>

 {genModalErr && <div style={{ ...S.err, marginBottom: 12 }}>{genModalErr}</div>}

 <button
 style={{ width:"100%", padding:"13px 0", borderRadius:10, background: (!genKeywords.length && !genKwInput.trim()) || genTitleLoading ? "#4338ca" : "#6366f1", color:"#fff", fontWeight:700, fontSize:15, border:"none", cursor: (!genKeywords.length && !genKwInput.trim()) || genTitleLoading ? "default" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, opacity: (!genKeywords.length && !genKwInput.trim()) || genTitleLoading ? 0.6 : 1 }}
 disabled={(!genKeywords.length && !genKwInput.trim()) || genTitleLoading}
 onClick={genGenerateTitles}
 >{genTitleLoading ? <><span style={S.spinner}/> Generating titles...</> : <><span style={{ fontSize:15 }}>🚀</span> Generate Article</>}</button>
 </div>
 )}

 {/* Shop keyword chips — shown for outline/intro/titles/draft/brief sub-tabs */}
 {genShopSuggestions.length > 0 && (
 <div style={{ marginBottom: 16 }}>
 <div style={{ fontSize: 11, color: C.dim, marginBottom: 6 }}>From your shop — click to add:</div>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
 {genShopSuggestions.map((kw, i) => (
 <button key={i} onClick={() => {
 setOutlineKw(kw);
 setIntroKw(kw);
 setTitleKw(kw);
 setDraftKw(kw);
 setBriefTopic(kw);
 setImgTopic(kw);
 setRepTopic(kw);
 setTagsTopic(kw);
 setSeoTopic(kw);
 }} style={{ background: "#27272a", border: `1px solid ${C.border}`, borderRadius: 6, padding: "3px 10px", fontSize: 12, color: "#d4d4d8", cursor: "pointer" }}>{kw}</button>
 ))}
 </div>
 </div>
 )}

 {/* Blog Outline */}
 {(true) && (
 <div id="panel-outline" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 24 }}>
 <div style={{ padding: "20px 22px 16px", borderBottom: `1px solid ${C.border}` }}>
 <div style={{ marginBottom: 4 }}>
 <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>AI Blog Outline Generator</div>
 </div>
 <div style={{ fontSize: 13, color: C.dim }}>AI builds a structured outline with H2/H3 sections, key points and suggested word counts.</div>
 </div>
 <div style={{ padding: "18px 22px" }}>
 {/* AI Fill */}
 <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
 <button style={{ ...S.btn(), fontSize: 11, padding: "5px 12px", display: "flex", alignItems: "center", gap: 5, opacity: !outlineKw.trim() ? 0.45 : 1 }}
 disabled={!outlineKw.trim() || sfLoading}
 onClick={() => runSuggestFields(outlineKw, "outline-all", r => {
 if (r.audience) {
 const known = ["general readers","beginners","intermediate","advanced / experts","e-commerce store owners","shopify merchants","entrepreneurs","small business owners","marketers","content creators","parents","students","seniors","teens","fitness enthusiasts","tech enthusiasts","budget shoppers","luxury buyers"];
 { const _aud = known.includes(r.audience.toLowerCase()) ? r.audience.toLowerCase() : r.audience; setSharedAudience(_aud); }
 }
 })}>
 {sfLoading && sfLoadingKey === "outline-all" ? <><span style={S.spinner} /> Suggesting...</> : `✨ AI Suggest Audience · ${ACTION_COSTS['seo-scan']} cr`}
 </button>
 </div>
 <div style={{ fontSize: 12, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>Topic or keyword</div>
 <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 12 }}>
 <input style={{ ...S.input, flex: 1, minWidth: 220 }} placeholder="e.g. best running shoes for beginners" value={outlineKw} onChange={e => setOutlineKw(e.target.value)} onKeyDown={e => e.key === "Enter" && runOutline()} />
 <div style={{ flex: "0 0 auto", minWidth: 190 }}>
 <div style={{ fontSize: 11, color: C.dim, marginBottom: 4 }}>Target audience</div>
 <select style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={["general readers","beginners","intermediate","advanced / experts","e-commerce store owners","shopify merchants","entrepreneurs","small business owners","marketers","content creators","parents","students","seniors","teens","fitness enthusiasts","tech enthusiasts","budget shoppers","luxury buyers"].includes(sharedAudience) ? sharedAudience : "__custom__"}
 onChange={e => { if (e.target.value !== "__custom__") { const _v = e.target.value; setSharedAudience(_v); } }}>
 <option value="general readers">General readers</option>
 <option value="beginners">Beginners</option>
 <option value="intermediate">Intermediate</option>
 <option value="advanced / experts">Advanced / Experts</option>
 <optgroup label="Business">
 <option value="e-commerce store owners">E-commerce store owners</option>
 <option value="shopify merchants">Shopify merchants</option>
 <option value="entrepreneurs">Entrepreneurs</option>
 <option value="small business owners">Small business owners</option>
 <option value="marketers">Marketers</option>
 <option value="content creators">Content creators</option>
 </optgroup>
 <optgroup label="Demographics">
 <option value="parents">Parents</option>
 <option value="students">Students</option>
 <option value="seniors">Seniors</option>
 <option value="teens">Teens</option>
 </optgroup>
 <optgroup label="Interest">
 <option value="fitness enthusiasts">Fitness enthusiasts</option>
 <option value="tech enthusiasts">Tech enthusiasts</option>
 <option value="budget shoppers">Budget shoppers</option>
 <option value="luxury buyers">Luxury buyers</option>
 </optgroup>
 <option value="__custom__">Custom...</option>
 </select>
 {(!["general readers","beginners","intermediate","advanced / experts","e-commerce store owners","shopify merchants","entrepreneurs","small business owners","marketers","content creators","parents","students","seniors","teens","fitness enthusiasts","tech enthusiasts","budget shoppers","luxury buyers"].includes(sharedAudience)) && (
 <input style={{ ...S.input, width: "100%", boxSizing: "border-box", marginTop: 6 }} placeholder="Describe your audience" value={sharedAudience === "general readers" ? "" : sharedAudience} onChange={e => { setSharedAudience(e.target.value); }} />
 )}
 </div>
 </div>
 <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
 <div style={{ flex: 1, minWidth: 160 }}>
 <div style={{ fontSize: 11, color: C.dim, marginBottom: 4 }}>Tone</div>
 <select style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={outlineTone} onChange={e => setOutlineTone(e.target.value)}>
 <optgroup label="General">
 <option value="professional">Professional</option>
 <option value="conversational">Conversational</option>
 <option value="casual">Casual &amp; Friendly</option>
 <option value="formal">Formal</option>
 <option value="enthusiastic">Enthusiastic</option>
 </optgroup>
 <optgroup label="Content style">
 <option value="authoritative">Authoritative</option>
 <option value="educational">Educational</option>
 <option value="storytelling">Storytelling</option>
 <option value="inspirational">Inspirational</option>
 <option value="motivational">Motivational</option>
 </optgroup>
 <optgroup label="Niche">
 <option value="witty">Witty &amp; Humorous</option>
 <option value="empathetic">Empathetic</option>
 <option value="bold">Bold &amp; Direct</option>
 <option value="minimalist">Minimalist / Clean</option>
 <option value="luxury">Luxury / Premium</option>
 <option value="technical">Technical / Detailed</option>
 <option value="journalistic">Journalistic</option>
 <option value="persuasive">Persuasive / Sales</option>
 </optgroup>
 </select>
 </div>
 <div style={{ flex: 1, minWidth: 160 }}>
 <div style={{ fontSize: 11, color: C.dim, marginBottom: 4 }}>Section depth</div>
 <select style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={outlineSections} onChange={e => setOutlineSections(e.target.value)}>
 <option value="small">Small (4–6 sections)</option>
 <option value="medium">Medium (6–9 sections)</option>
 <option value="large">Large (9–12 sections)</option>
 </select>
 </div>
 </div>
 <button style={{ ...S.btn("primary"), width: "100%" }} onClick={runOutline} disabled={outlineLoading || !outlineKw.trim()}>
 {outlineLoading ? <><span style={S.spinner} /> Generating outline...</> : `✨ Generate Outline · ${ACTION_COSTS['blog-outline']} cr`}
 </button>
 {outlineResult && (
 <div style={{ marginTop: 16 }}>
 {/* header row: meta + view toggle */}
 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
 <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
 {outlineResult.estimatedReadTime && <span style={{ fontSize: 12, color: C.dim }}>⏱ {outlineResult.estimatedReadTime}</span>}
 {outlineResult.totalWordCount > 0 && <span style={{ fontSize: 12, color: C.dim }}>~{outlineResult.totalWordCount.toLocaleString()} words</span>}
 {outlineResult.contentAngle && <span style={{ fontSize: 12, color: "#a5b4fc" }}>Angle: {outlineResult.contentAngle}</span>}
 </div>
 <div style={{ display: "flex", gap: 6 }}>
 <button onClick={() => setOutlineViewRaw(false)} style={{ padding: "3px 12px", borderRadius: 6, border: `1px solid ${!outlineViewRaw ? C.indigo : C.border}`, background: !outlineViewRaw ? "#1e1b4b" : "transparent", color: !outlineViewRaw ? "#a5b4fc" : C.sub, fontSize: 11, cursor: "pointer" }}>Formatted</button>
 <button onClick={() => setOutlineViewRaw(true)} style={{ padding: "3px 12px", borderRadius: 6, border: `1px solid ${outlineViewRaw ? C.indigo : C.border}`, background: outlineViewRaw ? "#1e1b4b" : "transparent", color: outlineViewRaw ? "#a5b4fc" : C.sub, fontSize: 11, cursor: "pointer" }}>Raw JSON</button>
 </div>
 </div>

 {outlineViewRaw ? (
 <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
 <pre style={{ fontSize: 12, color: "#a5b4fc", whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0, fontFamily: "'Courier New', monospace", maxHeight: 500, overflowY: "auto" }}>{JSON.stringify(outlineResult, null, 2)}</pre>
 <button style={{ ...S.btn(), marginTop: 10, fontSize: 12 }} onClick={() => navigator.clipboard?.writeText(JSON.stringify(outlineResult, null, 2))}>Copy JSON</button>
 </div>
 ) : (
 <div>
 {/* Title suggestion */}
 {outlineResult.title && (
 <div style={{ background: "#1e1b4b", border: `1px solid ${C.indigo}`, borderRadius: 10, padding: "12px 16px", marginBottom: 12 }}>
 <div style={{ fontSize: 11, color: "#818cf8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Suggested Title</div>
 <div style={{ fontSize: 14, fontWeight: 700, color: "#c7d2fe" }}>{outlineResult.title}</div>
 {outlineResult.metaDescription && <div style={{ fontSize: 12, color: "#a5b4fc", marginTop: 6, lineHeight: 1.5 }}>{outlineResult.metaDescription}</div>}
 <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
 <button style={{ ...S.btn(), fontSize: 11, padding: "3px 10px" }} onClick={() => navigator.clipboard?.writeText(outlineResult.title)}>Copy</button>
 <button style={{ fontSize: 11, padding: "4px 14px", borderRadius: 7, border: `1px solid ${C.green}`, background: "transparent", color: C.green, cursor: "pointer", fontWeight: 600 }}
 onClick={() => { setSelectedTitle(outlineResult.title); setIntroKw(outlineResult.title); setDraftKw(outlineResult.title); setTitleKw(outlineResult.title); setBriefTopic(outlineResult.title)}}>
 ✓ Use this title
 </button>
 </div>
 </div>
 )}

 {/* Sections */}
 {(outlineResult.sections || []).map((sec, i) => {
 const isEditing = editingSection === i;
 const updateSection = (patch) => {
 const sections = outlineResult.sections.map((s, idx) => idx === i ? { ...s, ...patch } : s);
 setOutlineResult({ ...outlineResult, sections });
 };
 return (
 <div key={i} style={{ background: C.bg, border: `1px solid ${isEditing ? C.indigo : C.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 8, transition: "border-color 0.2s" }}>
 {isEditing ? (
 <div>
 <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
 <span style={{ fontSize: 11, fontWeight: 700, color: C.indigo, flexShrink: 0 }}>H2</span>
 <input style={{ ...S.input, flex: 1, fontWeight: 600, fontSize: 14 }} value={sec.heading} onChange={e => updateSection({ heading: e.target.value })} autoFocus />
 <button style={{ fontSize: 11, padding: "4px 12px", borderRadius: 7, border: `1px solid ${C.green}`, background: "transparent", color: C.green, cursor: "pointer", fontWeight: 600, flexShrink: 0 }} onClick={() => setEditingSection(null)}>✓ Done</button>
 </div>
 {(sec.keyPoints || []).map((pt, j) => (
 <div key={j} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
 <span style={{ color: C.dim, fontSize: 16, flexShrink: 0 }}>•</span>
 <input style={{ ...S.input, flex: 1, fontSize: 12 }} value={pt} onChange={e => {
 const kps = (sec.keyPoints || []).map((p, k) => k === j ? e.target.value : p);
 updateSection({ keyPoints: kps });
 }} />
 <button style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontSize: 18, padding: "0 4px", lineHeight: 1 }} onClick={() => {
 const kps = (sec.keyPoints || []).filter((_, k) => k !== j);
 updateSection({ keyPoints: kps });
 }}>×</button>
 </div>
 ))}
 <button style={{ ...S.btn(), fontSize: 11, padding: "3px 10px", marginTop: 4 }} onClick={() => {
 const kps = [...(sec.keyPoints || []), ""];
 updateSection({ keyPoints: kps });
 }}>+ Add point</button>
 {sec.seoTip !== undefined && (
 <div style={{ marginTop: 10 }}>
 <div style={{ fontSize: 10, color: C.dim, marginBottom: 4 }}>SEO tip</div>
 <input style={{ ...S.input, width: "100%", boxSizing: "border-box", fontSize: 11 }} value={sec.seoTip || ""} onChange={e => updateSection({ seoTip: e.target.value })} placeholder="SEO tip…" />
 </div>
 )}
 </div>
 ) : (
 <div>
 <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: sec.keyPoints?.length ? 10 : 0 }}>
 <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
 <span style={{ fontSize: 11, fontWeight: 700, color: C.muted, flexShrink: 0 }}>H2</span>
 <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{sec.heading}</span>
 </div>
 <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
 {sec.type && <span style={{ fontSize: 10, color: C.dim, background: C.muted, padding: "2px 8px", borderRadius: 4, textTransform: "capitalize" }}>{sec.type}</span>}
 {sec.suggestedWordCount > 0 && <span style={{ fontSize: 10, color: C.dim }}>~{sec.suggestedWordCount}w</span>}
 <button style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, border: `1px solid ${C.border}`, background: "none", color: C.dim, cursor: "pointer" }} onClick={() => setEditingSection(i)}>✏️ Edit</button>
 </div>
 </div>
 {sec.keyPoints?.length > 0 && (
 <ul style={{ margin: "0 0 0 24px", padding: 0 }}>
 {sec.keyPoints.map((pt, j) => (
 <li key={j} style={{ fontSize: 12, color: C.sub, lineHeight: 1.7 }}>{pt}</li>
 ))}
 </ul>
 )}
 {sec.seoTip && (
 <div style={{ marginTop: 8, fontSize: 11, color: "#6ee7b7", borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>💡 {sec.seoTip}</div>
 )}
 <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
 <button style={{ ...S.btn(), fontSize: 11, padding: "3px 10px" }} onClick={() => {
 setIntroKw(sec.heading); setDraftKw(outlineKw || sec.heading);
 document.getElementById('panel-intro')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
 }}>→ Write intro from this</button>
 <button style={{ ...S.btn(), fontSize: 11, padding: "3px 10px" }} onClick={() => {
 setDraftKw(outlineKw || sec.heading);
 document.getElementById('panel-draft')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
 }}>→ Use in Draft</button>
 </div>
 </div>
 )}
 </div>
 );
 })}

 {/* Keywords row */}
 {(outlineResult.secondaryKeywords?.length > 0 || outlineResult.primaryKeyword) && (
 <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", marginTop: 4 }}>
 <div style={{ fontSize: 11, color: C.dim, marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Keywords to include</div>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
 {outlineResult.primaryKeyword && <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, background: "#1e1b4b", color: "#a5b4fc", border: `1px solid ${C.indigo}` }}>{outlineResult.primaryKeyword} (primary)</span>}
 {(outlineResult.secondaryKeywords || []).map((kw, i) => (
 <span key={i} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 6, background: C.muted, color: C.sub, border: `1px solid ${C.border}` }}>{kw}</span>
 ))}
 </div>
 </div>
 )}

 {/* Copy plain text */}
 <button style={{ ...S.btn(), marginTop: 12, fontSize: 12 }} onClick={() => {
 const lines = [];
 if (outlineResult.title) lines.push(`Title: ${outlineResult.title}`, "");
 if (outlineResult.metaDescription) lines.push(`Meta: ${outlineResult.metaDescription}`, "");
 (outlineResult.sections || []).forEach(s => {
 lines.push(`## ${s.heading}`);
 (s.keyPoints || []).forEach(p => lines.push(` - ${p}`));
 lines.push("");
 });
 navigator.clipboard?.writeText(lines.join("\n"));
 }}>Copy as Text</button>
 {/* Next step */}
 <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 12, paddingTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
 <span style={{ fontSize: 11, color: C.dim, flexShrink: 0 }}>Next step:</span>
 <button style={{ ...S.btn(), fontSize: 11, padding: "4px 12px" }} onClick={() => { const _kw = outlineResult?.title || outlineResult?.primaryKeyword || outlineKw; setTitleKw(_kw); document.getElementById('panel-titles')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>💡 Title Ideas →</button>
 <button style={{ ...S.btn(), fontSize: 11, padding: "4px 12px" }} onClick={() => { const _kw = outlineResult?.title || outlineResult?.primaryKeyword || outlineKw; setIntroKw(_kw); document.getElementById('panel-intro')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>✍️ Write Intro →</button>
 <button style={{ ...S.btn(), fontSize: 11, padding: "4px 12px" }} onClick={() => { const _kw = outlineResult?.title || outlineResult?.primaryKeyword || outlineKw; setDraftKw(_kw); if (outlineTone) setDraftTone(outlineTone); document.getElementById('panel-draft')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>📄 Full Draft →</button>
 </div>
 </div>
 )}
 </div>
 )}
 {!outlineResult && !outlineLoading && <div style={{ textAlign: "center", padding: "20px 0 4px", color: C.dim, fontSize: 13 }}>Enter a topic to generate a structured blog outline.</div>}
 </div>
 </div>
 )}

 {/* Write Intro */}
 {(true) && (
 <div id="panel-intro" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 24 }}>
 <div style={{ padding: "20px 22px 16px", borderBottom: `1px solid ${C.border}` }}>
 <div style={{ marginBottom: 4 }}>
 <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>AI Intro Paragraph Generator</div>
 </div>
 <div style={{ fontSize: 13, color: C.dim }}>Write a compelling opening paragraph that hooks readers and sets the tone for your post.</div>
 </div>
 <div style={{ padding: "18px 22px" }}>
 {/* AI Fill */}
 <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
 <button style={{ ...S.btn(), fontSize: 11, padding: "5px 12px", display: "flex", alignItems: "center", gap: 5, opacity: !introKw.trim() ? 0.45 : 1 }}
 disabled={!introKw.trim() || sfLoading}
 onClick={() => runSuggestFields(introKw, "intro-all", r => {
 if (r.audience) {
 const known = ["","general readers","beginners","intermediate","advanced / experts","e-commerce store owners","shopify merchants","entrepreneurs","small business owners","marketers","content creators","parents","students","seniors","teens","fitness enthusiasts","tech enthusiasts","budget shoppers","luxury buyers"];
 { const _aud = known.includes(r.audience.toLowerCase()) ? r.audience.toLowerCase() : r.audience; setSharedAudience(_aud); }
 }
 })}>
 {sfLoading && sfLoadingKey === "intro-all" ? <><span style={S.spinner} /> Suggesting...</> : `✨ AI Suggest Audience · ${ACTION_COSTS['seo-scan']} cr`}
 </button>
 </div>
 {selectedIntro && (
 <div style={{ background: "#052e16", border: "1px solid #166534", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: "#6ee7b7" }}>
 <div style={{ fontWeight: 600, marginBottom: 4 }}>✓ Intro selected — will be included in your draft:</div>
 <div style={{ color: "#d1fae5", lineHeight: 1.6, fontSize: 12 }}>{selectedIntro.slice(0, 200)}{selectedIntro.length > 200 ? "…" : ""}</div>
 <button style={{ marginTop: 6, fontSize: 11, background: "none", border: "1px solid #166534", borderRadius: 5, color: "#6ee7b7", cursor: "pointer", padding: "2px 8px" }} onClick={() => setSelectedIntro("")}>✕ Clear</button>
 </div>
 )}
 <div style={{ fontSize: 12, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>Blog topic or keyword</div>
 <input style={{ ...S.input, width: "100%", boxSizing: "border-box", marginBottom: 12 }} placeholder="e.g. best running shoes for beginners" value={introKw} onChange={e => setIntroKw(e.target.value)} onKeyDown={e => e.key === "Enter" && runIntro()} />
 <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
 <div style={{ flex: 1, minWidth: 160 }}>
 <div style={{ fontSize: 11, color: C.dim, marginBottom: 4 }}>Writing style</div>
 <select style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={introStyle} onChange={e => setIntroStyle(e.target.value)}>
 <optgroup label="Copywriting formulas">
 <option value="PAS">PAS — Problem, Agitate, Solve</option>
 <option value="AIDA">AIDA — Attention, Interest, Desire, Action</option>
 <option value="BAB">BAB — Before, After, Bridge</option>
 <option value="4Ps">4Ps — Promise, Picture, Proof, Push</option>
 </optgroup>
 <optgroup label="Style">
 <option value="conversational">Conversational</option>
 <option value="storytelling">Storytelling / Narrative</option>
 <option value="direct">Direct / To the point</option>
 <option value="bold">Bold &amp; Provocative</option>
 <option value="educational">Educational</option>
 <option value="empathetic">Empathetic</option>
 <option value="humorous">Humorous / Witty</option>
 <option value="inspirational">Inspirational</option>
 <option value="journalistic">Journalistic</option>
 <option value="luxury">Luxury / Premium</option>
 </optgroup>
 <optgroup label="Hook type">
 <option value="stat-hook">Stat hook — open with a surprising stat</option>
 <option value="question-hook">Question hook — open with a question</option>
 <option value="story-hook">Story hook — open with a micro-story</option>
 <option value="bold-claim">Bold claim — open with a strong statement</option>
 </optgroup>
 </select>
 </div>
 <div style={{ flex: 1, minWidth: 160 }}>
 <div style={{ fontSize: 11, color: C.dim, marginBottom: 4 }}>Target audience</div>
 <select style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={["","general readers","beginners","intermediate","advanced / experts","e-commerce store owners","shopify merchants","entrepreneurs","small business owners","marketers","content creators","parents","students","seniors","teens","fitness enthusiasts","tech enthusiasts","budget shoppers","luxury buyers"].includes(sharedAudience) ? sharedAudience : "__custom__"}
 onChange={e => { if (e.target.value !== "__custom__") { const _v = e.target.value; setSharedAudience(_v); } }}>
 <option value="">Any audience</option>
 <option value="general readers">General readers</option>
 <option value="beginners">Beginners</option>
 <option value="intermediate">Intermediate</option>
 <option value="advanced / experts">Advanced / Experts</option>
 <optgroup label="Business">
 <option value="e-commerce store owners">E-commerce store owners</option>
 <option value="shopify merchants">Shopify merchants</option>
 <option value="entrepreneurs">Entrepreneurs</option>
 <option value="small business owners">Small business owners</option>
 <option value="marketers">Marketers</option>
 <option value="content creators">Content creators</option>
 </optgroup>
 <optgroup label="Demographics">
 <option value="parents">Parents</option>
 <option value="students">Students</option>
 <option value="seniors">Seniors</option>
 <option value="teens">Teens</option>
 </optgroup>
 <optgroup label="Interest">
 <option value="fitness enthusiasts">Fitness enthusiasts</option>
 <option value="tech enthusiasts">Tech enthusiasts</option>
 <option value="budget shoppers">Budget shoppers</option>
 <option value="luxury buyers">Luxury buyers</option>
 </optgroup>
 <option value="__custom__">Custom...</option>
 </select>
 {(!["","general readers","beginners","intermediate","advanced / experts","e-commerce store owners","shopify merchants","entrepreneurs","small business owners","marketers","content creators","parents","students","seniors","teens","fitness enthusiasts","tech enthusiasts","budget shoppers","luxury buyers"].includes(sharedAudience)) && (
 <input style={{ ...S.input, width: "100%", boxSizing: "border-box", marginTop: 6 }} placeholder="Describe your audience" value={sharedAudience} onChange={e => { setSharedAudience(e.target.value); }} />
 )}
 </div>
 </div>
 <button style={{ ...S.btn("primary"), width: "100%" }} onClick={runIntro} disabled={introLoading || !introKw.trim()}>
 {introLoading ? <><span style={S.spinner} /> Writing intro...</> : `✨ Write Intro · ${ACTION_COSTS['email-gen']} cr`}
 </button>
 {introResult && (
 <div style={{ marginTop: 16, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
 {introResult.intros ? (
 <div>
 {(introResult.intros || []).map((intro, i) => (
 <div key={i} style={{ marginBottom: 14, borderBottom: i < introResult.intros.length - 1 ? `1px solid ${C.border}` : "none", paddingBottom: i < introResult.intros.length - 1 ? 14 : 0 }}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
 <span style={{ fontSize: 11, color: "#a5b4fc", fontWeight: 600, textTransform: "uppercase" }}>{intro.style || `Option ${i + 1}`}</span>
 {intro.hookType && <span style={{ fontSize: 10, color: C.dim, background: C.muted, padding: "2px 8px", borderRadius: 4 }}>{intro.hookType}</span>}
 </div>
 <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7 }}>{intro.text}</div>
 <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
 <button style={{ ...S.btn(), fontSize: 11, padding: "3px 10px" }} onClick={() => navigator.clipboard?.writeText(intro.text || "")}>Copy</button>
 {selectedIntro === intro.text ? (
 <span style={{ fontSize: 11, color: C.green, fontWeight: 700, padding: "3px 10px" }}>✓ Selected for Draft</span>
 ) : (
 <button style={{ fontSize: 11, padding: "4px 14px", borderRadius: 7, border: `1px solid ${C.green}`, background: "transparent", color: C.green, cursor: "pointer", fontWeight: 600 }}
 onClick={() => { setSelectedIntro(intro.text || ""); setDraftKw(introKw || draftKw)}}>
 ✓ Use in Draft
 </button>
 )}
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div>
 <div style={{ fontSize: 13, color: C.text, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{introResult.intro || introResult.text || JSON.stringify(introResult)}</div>
 <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
 <button style={{ ...S.btn(), fontSize: 11, padding: "3px 10px" }} onClick={() => navigator.clipboard?.writeText(introResult.intro || introResult.text || "")}>Copy</button>
 {selectedIntro === (introResult.intro || introResult.text) ? (
 <span style={{ fontSize: 11, color: C.green, fontWeight: 700, padding: "3px 10px" }}>✓ Selected for Draft</span>
 ) : (
 <button style={{ fontSize: 11, padding: "4px 14px", borderRadius: 7, border: `1px solid ${C.green}`, background: "transparent", color: C.green, cursor: "pointer", fontWeight: 600 }}
 onClick={() => { setSelectedIntro(introResult.intro || introResult.text || ""); setDraftKw(introKw || draftKw)}}>
 ✓ Use in Draft
 </button>
 )}
 </div>
 </div>
 )}
 {introResult.intros && <button style={{ ...S.btn("primary"), marginTop: 4, fontSize: 12 }} onClick={() => { const best = introResult.intros?.[introResult.recommended ?? 0]; navigator.clipboard?.writeText(best?.text || "")}}>Copy Best Option</button>}
 {/* Next step */}
 <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 12, paddingTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
 <span style={{ fontSize: 11, color: C.dim, flexShrink: 0 }}>Next step:</span>
 <button style={{ ...S.btn(), fontSize: 11, padding: "4px 12px" }} onClick={() => { setDraftKw(introKw)}}>📄 Write Full Draft →</button>
 <button style={{ ...S.btn(), fontSize: 11, padding: "4px 12px" }} onClick={() => { setTitleKw(introKw)}}>💡 Title Ideas →</button>
 <button style={{ ...S.btn(), fontSize: 11, padding: "4px 12px" }} onClick={() => { setOutlineKw(introKw)}}>📝 Blog Outline →</button>
 </div>
 </div>
 )}
 </div>
 </div>
 )}

 {/* Title Ideas */}
 {(true) && (
 <div id="panel-titles" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 24 }}>
 <div style={{ padding: "20px 22px 16px", borderBottom: `1px solid ${C.border}` }}>
 <div style={{ marginBottom: 4 }}>
 <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>AI Title Ideas</div>
 </div>
 <div style={{ fontSize: 13, color: C.dim }}>Generate {titleCount} click-worthy, SEO-optimised title variations with CTR scores, formulas and power word analysis.</div>
 </div>
 <div style={{ padding: "18px 22px" }}>
 {/* AI Fill */}
 <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
 <button style={{ ...S.btn(), fontSize: 11, padding: "5px 12px", display: "flex", alignItems: "center", gap: 5, opacity: !titleKw.trim() ? 0.45 : 1 }}
 disabled={!titleKw.trim() || sfLoading}
 onClick={() => runSuggestFields(titleKw, "titles-all", r => {
 if (r.niche) setTitleNiche(r.niche);
 if (r.audience) {
 const known = ["","general readers","beginners","intermediate","advanced / experts","e-commerce store owners","shopify merchants","entrepreneurs","small business owners","marketers","content creators","parents","students","seniors","teens","fitness enthusiasts","tech enthusiasts","budget shoppers","luxury buyers"];
 { const _aud = known.includes(r.audience.toLowerCase()) ? r.audience.toLowerCase() : r.audience; setSharedAudience(_aud); }
 }
 })}>
 {sfLoading && sfLoadingKey === "titles-all" ? <><span style={S.spinner} /> Suggesting...</> : `✨ AI Fill Niche & Audience · ${ACTION_COSTS['seo-scan']} cr`}
 </button>
 </div>
 <div style={{ fontSize: 12, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>Keyword or topic</div>
 <input style={{ ...S.input, width: "100%", boxSizing: "border-box", marginBottom: 12 }} placeholder="e.g. winter skincare routine" value={titleKw} onChange={e => setTitleKw(e.target.value)} onKeyDown={e => e.key === "Enter" && runTitleIdeas()} />
 <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
 <div style={{ flex: 1, minWidth: 160 }}>
 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
 <span style={{ fontSize: 11, color: C.dim }}>Niche / industry (optional)</span>
 <button style={{ fontSize: 10, background: "none", border: "none", color: "#a5b4fc", cursor: "pointer", padding: "0 2px", opacity: !titleKw.trim() ? 0.4 : 1 }}
 disabled={!titleKw.trim() || sfLoading}
 onClick={() => runSuggestFields(titleKw, "titles-niche", r => { if (r.niche) setTitleNiche(r.niche); })}>
 {sfLoading && sfLoadingKey === "titles-niche" ? "..." : "✨ AI"}
 </button>
 </div>
 <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} placeholder="e.g. skincare, snowboarding, B2B SaaS" value={titleNiche} onChange={e => setTitleNiche(e.target.value)} />
 </div>
 <div style={{ flex: 1, minWidth: 180 }}>
 <div style={{ fontSize: 11, color: C.dim, marginBottom: 4 }}>Target audience</div>
 <select style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={["general readers","beginners","intermediate","advanced / experts","e-commerce store owners","shopify merchants","entrepreneurs","small business owners","marketers","content creators","parents","students","seniors","teens","fitness enthusiasts","tech enthusiasts","budget shoppers","luxury buyers"].includes(sharedAudience) ? sharedAudience : sharedAudience ? "__custom__" : ""}
 onChange={e => { if (e.target.value !== "__custom__") { const _v = e.target.value; setSharedAudience(_v); } }}>
 <option value="">Any audience</option>
 <option value="general readers">General readers</option>
 <option value="beginners">Beginners</option>
 <option value="intermediate">Intermediate</option>
 <option value="advanced / experts">Advanced / Experts</option>
 <optgroup label="Business">
 <option value="e-commerce store owners">E-commerce store owners</option>
 <option value="shopify merchants">Shopify merchants</option>
 <option value="entrepreneurs">Entrepreneurs</option>
 <option value="small business owners">Small business owners</option>
 <option value="marketers">Marketers</option>
 <option value="content creators">Content creators</option>
 </optgroup>
 <optgroup label="Demographics">
 <option value="parents">Parents</option>
 <option value="students">Students</option>
 <option value="seniors">Seniors</option>
 <option value="teens">Teens</option>
 </optgroup>
 <optgroup label="Interest">
 <option value="fitness enthusiasts">Fitness enthusiasts</option>
 <option value="tech enthusiasts">Tech enthusiasts</option>
 <option value="budget shoppers">Budget shoppers</option>
 <option value="luxury buyers">Luxury buyers</option>
 </optgroup>
 <option value="__custom__">Custom...</option>
 </select>
 {(!["","general readers","beginners","intermediate","advanced / experts","e-commerce store owners","shopify merchants","entrepreneurs","small business owners","marketers","content creators","parents","students","seniors","teens","fitness enthusiasts","tech enthusiasts","budget shoppers","luxury buyers"].includes(sharedAudience)) && (
 <input style={{ ...S.input, width: "100%", boxSizing: "border-box", marginTop: 6 }} placeholder="Describe your audience" value={sharedAudience} onChange={e => { setSharedAudience(e.target.value); }} />
 )}
 </div>
 </div>
 <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 14 }}>
 <div style={{ flex: 1 }}>
 <div style={{ fontSize: 11, color: C.dim, marginBottom: 6 }}>How many?</div>
 <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
 {[5, 10, 15, 20].map(n => (
 <button key={n} onClick={() => setTitleCount(n)} style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${titleCount === n ? C.indigo : C.border}`, background: titleCount === n ? C.indigo : "transparent", color: titleCount === n ? "#fff" : C.sub, fontSize: 12, cursor: "pointer", fontWeight: titleCount === n ? 700 : 400 }}>{n}</button>
 ))}
 </div>
 </div>
 <div style={{ flex: 1, minWidth: 180 }}>
 <div style={{ fontSize: 11, color: C.dim, marginBottom: 4 }}>Title formula</div>
 <select style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={titleFormula} onChange={e => setTitleFormula(e.target.value)}>
 <option value="all">All (mixed)</option>
 <optgroup label="Formats">
 <option value="how-to">How-to</option>
 <option value="listicle">Listicle (X Ways / X Tips)</option>
 <option value="question">Question</option>
 <option value="comparison">Comparison / vs.</option>
 <option value="case-study">Case study / Results</option>
 </optgroup>
 <optgroup label="Persuasion">
 <option value="power">Power word</option>
 <option value="negative">Negative / Avoid / Stop</option>
 <option value="data">Data-driven (stats)</option>
 <option value="urgency">Urgency / Time-based</option>
 </optgroup>
 </select>
 </div>
 </div>
 <button style={{ ...S.btn("primary"), width: "100%" }} onClick={runTitleIdeas} disabled={titleLoading || !titleKw.trim()}>
 {titleLoading ? <><span style={S.spinner} /> Generating titles...</> : `✨ Get Title Ideas · ${ACTION_COSTS['seo-scan']} cr`}
 </button>
 {titleResult && (
 <div style={{ marginTop: 16 }}>
 {/* Best pick callout */}
 {titleResult.bestTitle && (
 <div style={{ background: "#1e1b4b", border: `1px solid ${C.indigo}`, borderRadius: 10, padding: "12px 16px", marginBottom: 12 }}>
 <div style={{ fontSize: 11, color: "#818cf8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>⭐ Best pick</div>
 <div style={{ fontSize: 14, fontWeight: 700, color: "#c7d2fe", marginBottom: 6 }}>{titleResult.bestTitle}</div>
 <button style={{ ...S.btn(), fontSize: 11, padding: "3px 10px" }} onClick={() => navigator.clipboard?.writeText(titleResult.bestTitle)}>Copy</button>
 </div>
 )}
 {/* Tip from AI */}
 {titleResult.tip && (
 <div style={{ fontSize: 12, color: "#6ee7b7", background: "#052e16", border: "1px solid #166534", borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>💡 {titleResult.tip}</div>
 )}
 {/* Copy all */}
 <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
 <button style={{ ...S.btn(), fontSize: 11, padding: "4px 12px" }} onClick={() => {
 const all = (titleResult.titles || titleResult.ideas || []).map(t => typeof t === "string" ? t : t.title || "").filter(Boolean).join("\n");
 navigator.clipboard?.writeText(all);
 }}>Copy all titles</button>
 </div>
 {/* Title cards */}
 {(titleResult.titles || titleResult.ideas || []).map((t, i) => {
 const title = typeof t === "string" ? t : t.title || t.text || "";
 const formula = typeof t === "object" ? t.formula : null;
 const charCount = typeof t === "object" ? t.charCount : title.length;
 const ctrScore = typeof t === "object" ? t.ctrScore : null;
 const powerWords = typeof t === "object" && t.powerWords?.length ? t.powerWords : [];
 const note = typeof t === "object" ? t.note : null;
 const charOk = charCount >= 50 && charCount <= 65;
 const charWarn = charCount > 65 && charCount <= 75;
 const isBest = titleResult.bestTitle && title === titleResult.bestTitle;
 const isSelected = selectedTitle === title;
 return (
 <div key={i} style={{ background: isSelected ? "#052e16" : C.bg, border: `1.5px solid ${isSelected ? C.green : isBest ? C.indigo : C.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
 {/* Row 1: title + badges */}
 <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
 <div style={{ flex: 1 }}>
 <div style={{ fontSize: 14, color: C.text, fontWeight: isBest ? 700 : 400, lineHeight: 1.5 }}>
 {title}
 </div>
 </div>
 </div>
 {/* Row 2: meta chips */}
 <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", marginBottom: note ? 8 : 6 }}>
 {formula && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "#1e1b4b", color: "#a5b4fc", fontWeight: 600, textTransform: "capitalize" }}>{formula}</span>}
 {charCount > 0 && (
 <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: charOk ? "#052e16" : charWarn ? "#422006" : "#3b0a0a", color: charOk ? "#6ee7b7" : charWarn ? "#fb923c" : "#f87171" }}>
 {charCount} chars {charOk ? "✓" : charWarn ? "⚠ slightly long" : charCount < 50 ? "⚠ short" : "⚠ too long"}
 </span>
 )}
 {ctrScore != null && (
 <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: ctrScore >= 8 ? "#052e16" : ctrScore >= 5 ? "#422006" : "#27272a", color: ctrScore >= 8 ? "#6ee7b7" : ctrScore >= 5 ? "#fb923c" : C.dim }}>
 CTR {ctrScore}/10
 </span>
 )}
 {powerWords.length > 0 && <span style={{ fontSize: 10, color: "#71717a", padding: "2px 8px", borderRadius: 4, background: "#27272a" }}>⚡ {powerWords.join(", ")}</span>}
 </div>
 {/* Note */}
 {note && <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.5, marginBottom: 6, fontStyle: "italic" }}>{note}</div>}
 {/* Actions */}
 <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
 <button style={{ ...S.btn(), fontSize: 11, padding: "3px 10px" }} onClick={() => navigator.clipboard?.writeText(title)}>Copy</button>
 {isSelected ? (
 <span style={{ fontSize: 11, color: C.green, fontWeight: 700, padding: "3px 10px" }}>✓ Selected</span>
 ) : (
 <button style={{ fontSize: 11, padding: "4px 14px", borderRadius: 7, border: `1px solid ${C.green}`, background: "transparent", color: C.green, cursor: "pointer", fontWeight: 600 }}
 onClick={() => { setSelectedTitle(title); setOutlineKw(title); setIntroKw(title); setDraftKw(title); setBriefTopic(title); setBriefPrimary(titleKw)}}>
 ✓ Use this title
 </button>
 )}
 </div>
 </div>
 );
 })}
 {/* Next step */}
 <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 12, paddingTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
 <span style={{ fontSize: 11, color: C.dim, flexShrink: 0 }}>Next step:</span>
 <button style={{ ...S.btn(), fontSize: 11, padding: "4px 12px" }} onClick={() => { if (!outlineKw) setOutlineKw(titleResult?.bestTitle || titleKw)}}>📝 Create Outline →</button>
 <button style={{ ...S.btn(), fontSize: 11, padding: "4px 12px" }} onClick={() => { if (!draftKw) setDraftKw(titleResult?.bestTitle || titleKw)}}>📄 Write Full Draft →</button>
 </div>
 </div>
 )}
 </div>
 </div>
 )}

 {/* Full Draft */}
 {(true) && (
 <div id="panel-draft" style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 24 }}>
 <div style={{ padding: "20px 22px 16px", borderBottom: `1px solid ${C.border}` }}>
 <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
 <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Full Blog Post Draft</div>
 <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: "#1e1b4b", color: "#a5b4fc" }}>3 credits</span>
 </div>
 <div style={{ fontSize: 13, color: C.dim }}>AI generates a complete {draftWordCount.toLocaleString()}+ word blog post ready to publish.</div>
 </div>
 <div style={{ padding: "18px 22px" }}>
 {/* AI Fill */}
 <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
 <button style={{ ...S.btn(), fontSize: 11, padding: "5px 12px", display: "flex", alignItems: "center", gap: 5, opacity: !draftKw.trim() ? 0.45 : 1 }}
 disabled={!draftKw.trim() || sfLoading}
 onClick={() => runSuggestFields(draftKw, "draft-all", r => {
 if (r.niche) setDraftNiche(r.niche);
 })}>
 {sfLoading && sfLoadingKey === "draft-all" ? <><span style={S.spinner} /> Suggesting...</> : `✨ AI Fill Niche · ${ACTION_COSTS['seo-scan']} cr`}
 </button>
 </div>
 <div style={{ fontSize: 12, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 8 }}>Blog topic or keyword</div>
 <input style={{ ...S.input, width: "100%", marginBottom: 12, boxSizing: "border-box" }} placeholder="e.g. how to choose the right snowboard for beginners" value={draftKw} onChange={e => setDraftKw(e.target.value)} onKeyDown={e => e.key === "Enter" && runDraft()} />
 <div style={{ marginBottom: 12 }}>
 <div style={{ fontSize: 11, color: C.dim, marginBottom: 6 }}>Word count</div>
 <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
 {[800, 1200, 1500, 2500, 4000].map(n => (
 <button key={n} onClick={() => setDraftWordCount(n)} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${draftWordCount === n ? C.indigo : C.border}`, background: draftWordCount === n ? C.indigo : "transparent", color: draftWordCount === n ? "#fff" : C.sub, fontSize: 12, cursor: "pointer", fontWeight: draftWordCount === n ? 700 : 400 }}>{n.toLocaleString()}</button>
 ))}
 <span style={{ fontSize: 11, color: C.dim }}>or</span>
 <input type="number" min={300} max={8000} style={{ ...S.input, width: 100, padding: "5px 8px", fontSize: 12, textAlign: "center" }} placeholder="Custom" value={[800,1200,1500,2500,4000].includes(draftWordCount) ? "" : draftWordCount} onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v > 100) setDraftWordCount(v); }} />
 <span style={{ fontSize: 11, color: C.dim }}>words</span>
 </div>
 </div>
 <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
 <div style={{ flex: 1, minWidth: 160 }}>
 <div style={{ fontSize: 11, color: C.dim, marginBottom: 4 }}>Tone</div>
 <select style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={draftTone} onChange={e => setDraftTone(e.target.value)}>
 {["conversational", "professional", "authoritative", "storytelling", "casual", "expert"].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
 </select>
 </div>
 <div style={{ flex: 1, minWidth: 160 }}>
 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
 <span style={{ fontSize: 11, color: C.dim }}>Niche (optional)</span>
 <button style={{ fontSize: 10, background: "none", border: "none", color: "#a5b4fc", cursor: "pointer", padding: "0 2px", opacity: !draftKw.trim() ? 0.4 : 1 }}
 disabled={!draftKw.trim() || sfLoading}
 onClick={() => runSuggestFields(draftKw, "draft-niche", r => { if (r.niche) setDraftNiche(r.niche); })}>
 {sfLoading && sfLoadingKey === "draft-niche" ? "..." : "✨ AI"}
 </button>
 </div>
 <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} placeholder="e.g. fitness, beauty, tech" value={draftNiche} onChange={e => setDraftNiche(e.target.value)} />
 </div>
 </div>
 <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, padding: "12px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8 }}>
 <div style={{ flex: 1 }}>
 <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>AI web research</div>
 <div style={{ fontSize: 12, color: C.dim }}>We'll search Google/Wikipedia for up-to-date content</div>
 </div>
 <div onClick={() => setGenAiResearch(v => !v)} style={{ width: 40, height: 22, borderRadius: 999, background: genAiResearch ? C.indigo : C.muted, cursor: "pointer", position: "relative", transition: "background .2s", flexShrink: 0 }}>
 <div style={{ position: "absolute", top: 3, left: genAiResearch ? 20 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
 </div>
 </div>
 <button style={{ ...S.btn("primary"), width: "100%" }} onClick={runDraft} disabled={draftLoading || !draftKw.trim()}>
 {draftLoading ? <><span style={S.spinner} /> Writing full post...</> : `✨ Generate Draft · ${ACTION_COSTS['blog-draft']} cr`}
 </button>
 {draftErr && <div style={{ ...S.err, marginTop: 10 }}>{draftErr}</div>}
 {draftResult && (
 <div style={{ marginTop: 16 }}>
 <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
 <button style={{ ...S.btn(), fontSize: 11, padding: "5px 12px" }}
 onClick={() => setQuickViewRaw(v => !v)}>{quickViewRaw ? "👁 Preview" : "</> HTML"}</button>
 <button style={S.btn()} onClick={() => navigator.clipboard?.writeText(draftResult.content || draftResult.draft || "")}>Copy All</button>
 </div>
 {quickViewRaw ? (
 <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 18px", fontSize: 12, fontFamily: "'Courier New', monospace", color: "#a5b4fc", whiteSpace: "pre-wrap", lineHeight: 1.6, maxHeight: 500, overflowY: "auto" }}>
 {draftResult.content || draftResult.draft || JSON.stringify(draftResult)}
 </div>
 ) : (
 <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "16px 18px", fontSize: 14, lineHeight: 1.8, color: C.text, maxHeight: 500, overflowY: "auto" }}
 dangerouslySetInnerHTML={{ __html: draftResult.content || draftResult.draft || "" }} />
 )}
 {/* Continue to publish prep */}
 <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 12, paddingTop: 12 }}>
 <div style={{ fontSize: 11, color: C.dim, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Continue to publish prep</div>
 <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
 <button style={{ ...S.btn("primary"), fontSize: 11, padding: "6px 14px" }} onClick={() => { if (!imgTopic) setImgTopic(draftKw)}}>🖼️ Image Planner →</button>
 <button style={{ ...S.btn("primary"), fontSize: 11, padding: "6px 14px" }} onClick={() => { if (!repTopic) setRepTopic(draftKw)}}>📣 Repurpose →</button>
 <button style={{ ...S.btn("primary"), fontSize: 11, padding: "6px 14px" }} onClick={() => { if (!tagsTopic) setTagsTopic(draftKw)}}>🏷️ Tags & Schema →</button>
 <button style={{ ...S.btn("primary"), fontSize: 11, padding: "6px 14px" }} onClick={() => { if (!seoTopic) setSeoTopic(draftKw); if (draftResult?.content && !seoContent) setSeoContent(draftResult.content)}}>📊 SEO Score →</button>
 </div>
 <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
 <span style={{ fontSize: 11, color: C.dim, flexShrink: 0 }}>Edit:</span>
 <button style={{ ...S.btn(), fontSize: 11, padding: "4px 12px" }} onClick={() => { setOutlineKw(draftKw)}}>📝 Outline →</button>
 <button style={{ ...S.btn(), fontSize: 11, padding: "4px 12px" }} onClick={() => { setIntroKw(draftKw)}}>✍️ Intro →</button>
 <button style={{ ...S.btn(), fontSize: 11, padding: "4px 12px" }} onClick={() => { setTitleKw(draftKw)}}>💡 Titles →</button>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 )}

 {/* Content Brief */}
 {(true) && (
 <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 24 }}>
 <div style={{ padding: "20px 22px 16px", borderBottom: `1px solid ${C.border}` }}>
 <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>Content Brief Generator</div>
 <div style={{ fontSize: 13, color: C.dim }}>Build a full editorial brief — target keywords, structure, tone, word count and competitor insights.</div>
 </div>
 <div style={{ padding: "18px 22px" }}>
 {/* AI Fill All button */}
 <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
 <button style={{ ...S.btn(), fontSize: 11, padding: "5px 12px", display: "flex", alignItems: "center", gap: 5, opacity: !briefTopic.trim() ? 0.45 : 1 }}
 disabled={!briefTopic.trim() || sfLoading}
 onClick={() => runSuggestFields(briefTopic, "brief-all", r => {
 if (r.primaryKeyword) setBriefPrimary(r.primaryKeyword);
 if (r.secondaryKeywords?.length) setBriefSecondary(r.secondaryKeywords.join(", "));
 if (r.audience) { setSharedAudience(r.audience); }
 })}>
 {sfLoading && sfLoadingKey === "brief-all" ? <><span style={S.spinner} /> Suggesting...</> : `✨ AI Fill Fields · ${ACTION_COSTS['seo-scan']} cr`}
 </button>
 </div>
 <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
 <div style={{ flex: 1, minWidth: 200 }}>
 <div style={{ fontSize: 12, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6 }}>Blog topic</div>
 <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} placeholder="e.g. winter skincare tips for dry skin" value={briefTopic} onChange={e => setBriefTopic(e.target.value)} />
 </div>
 <div style={{ flex: 1, minWidth: 180 }}>
 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
 <span style={{ fontSize: 12, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.6px" }}>Primary keyword</span>
 <button style={{ fontSize: 10, background: "none", border: "none", color: "#a5b4fc", cursor: "pointer", padding: "0 2px", opacity: !briefTopic.trim() ? 0.4 : 1 }}
 disabled={!briefTopic.trim() || sfLoading}
 onClick={() => runSuggestFields(briefTopic, "brief-primary", r => { if (r.primaryKeyword) setBriefPrimary(r.primaryKeyword); })}>
 {sfLoading && sfLoadingKey === "brief-primary" ? "..." : "✨ AI"}
 </button>
 </div>
 <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} placeholder="e.g. winter skincare routine" value={briefPrimary} onChange={e => setBriefPrimary(e.target.value)} />
 </div>
 </div>
 <div style={{ marginBottom: 12 }}>
 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
 <span style={{ fontSize: 12, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.6px" }}>Secondary keywords <span style={{ fontSize: 11, fontWeight: 400, textTransform: "none", color: C.dim }}>(comma-separated, optional)</span></span>
 <button style={{ fontSize: 10, background: "none", border: "none", color: "#a5b4fc", cursor: "pointer", padding: "0 2px", opacity: !briefTopic.trim() ? 0.4 : 1 }}
 disabled={!briefTopic.trim() || sfLoading}
 onClick={() => runSuggestFields(briefTopic, "brief-secondary", r => { if (r.secondaryKeywords?.length) setBriefSecondary(r.secondaryKeywords.join(", ")); })}>
 {sfLoading && sfLoadingKey === "brief-secondary" ? "..." : "✨ AI"}
 </button>
 </div>
 <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} placeholder="e.g. dry skin care, winter moisturiser, hydrating tips" value={briefSecondary} onChange={e => setBriefSecondary(e.target.value)} />
 </div>
 <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
 <div style={{ flex: 1, minWidth: 180 }}>
 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
 <span style={{ fontSize: 12, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.6px" }}>Audience</span>
 <button style={{ fontSize: 10, background: "none", border: "none", color: "#a5b4fc", cursor: "pointer", padding: "0 2px", opacity: !briefTopic.trim() ? 0.4 : 1 }}
 disabled={!briefTopic.trim() || sfLoading}
 onClick={() => runSuggestFields(briefTopic, "brief-audience", r => { if (r.audience) { setSharedAudience(r.audience); } })}>
 {sfLoading && sfLoadingKey === "brief-audience" ? "..." : "✨ AI"}
 </button>
 </div>
 <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} placeholder="e.g. Shopify store owners, beginners" value={sharedAudience} onChange={e => { setSharedAudience(e.target.value); }} />
 </div>
 <div style={{ flex: 1, minWidth: 180 }}>
 <div style={{ fontSize: 12, fontWeight: 600, color: C.sub, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6 }}>Tone</div>
 <select style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={briefTone} onChange={e => setBriefTone(e.target.value)}>
 {["professional", "conversational", "authoritative", "educational", "casual"].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
 </select>
 </div>
 </div>
 <button style={{ ...S.btn("primary"), width: "100%" }} onClick={runBrief} disabled={briefLoading || !briefTopic.trim()}>
 {briefLoading ? <><span style={S.spinner} /> Generating brief...</> : `✨ Generate Brief · ${ACTION_COSTS['content-brief']} cr`}
 </button>
 {briefErr && <div style={{ ...S.err, marginTop: 10 }}>{briefErr}</div>}
 {briefResult && (() => {
 const b = typeof briefResult === "string" ? (() => { try { return JSON.parse(briefResult); } catch { return {}; } })() : (briefResult || {});
 const kw = b.keywordStrategy || {};
 const geo = b.geo || {};
 const SectionLabel = ({ children }) => (
 <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: 8 }}>{children}</div>
 );
 const CopyBtn = ({ text }) => (
 <button style={{ ...S.btn(), fontSize: 10, padding: "2px 8px", flexShrink: 0 }} onClick={() => navigator.clipboard?.writeText(text || "")}>Copy</button>
 );
 const Chip = ({ label, color = C.muted, textColor = C.sub }) => (
 <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 5, background: color, color: textColor, flexShrink: 0 }}>{label}</span>
 );
 return (
 <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>

 {/* ── Summary bar ── */}
 <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px" }}>
 {b.searchIntent && <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5, background: "#1e1b4b", color: "#a5b4fc", fontWeight: 600 }}>{b.searchIntent}</span>}
 {b.targetWordCount && <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5, background: C.muted, color: C.sub }}>~{b.targetWordCount.toLocaleString()} words</span>}
 {b.estimatedRank && <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 5, background: "#052e16", color: "#6ee7b7" }}>🎯 {b.estimatedRank}</span>}
 <div style={{ flex: 1 }} />
 <button style={{ ...S.btn(), fontSize: 10, padding: "3px 10px" }} onClick={() => {
 const lines = [];
 if (b.title) lines.push(`Title: ${b.title}`);
 if (b.metaTitle) lines.push(`Meta Title: ${b.metaTitle}`);
 if (b.metaDescription) lines.push(`Meta Description: ${b.metaDescription}`);
 if (b.h1) lines.push(`H1: ${b.h1}`);
 if (b.targetWordCount) lines.push(`Target Word Count: ${b.targetWordCount}`);
 if (b.searchIntent) lines.push(`Search Intent: ${b.searchIntent}`);
 lines.push("", "=== OUTLINE ===");
 (b.outline || []).forEach((s, i) => { lines.push(`${i+1}. ${s.heading}`); (s.subheadings||[]).forEach(sh => lines.push(`   - ${sh}`)); if (s.notes) lines.push(`   Notes: ${s.notes}`); });
 lines.push("", "=== KEYWORDS ===");
 if (kw.primary) lines.push(`Primary: ${kw.primary}`);
 if (kw.secondary?.length) lines.push(`Secondary: ${kw.secondary.join(", ")}`);
 if (kw.lsi?.length) lines.push(`LSI: ${kw.lsi.join(", ")}`);
 navigator.clipboard?.writeText(lines.join("\n"));
 }}>📋 Copy Brief</button>
 </div>

 {/* ── Title row ── */}
 {(b.title || b.h1) && (
 <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
 <SectionLabel>Recommended titles</SectionLabel>
 {b.title && (
 <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: b.h1 && b.h1 !== b.title ? 8 : 0 }}>
 <div style={{ flex: 1 }}>
 <div style={{ fontSize: 10, color: C.dim, marginBottom: 2 }}>ARTICLE TITLE</div>
 <div style={{ fontSize: 14, fontWeight: 700, color: C.text, lineHeight: 1.4 }}>{b.title}</div>
 </div>
 <CopyBtn text={b.title} />
 </div>
 )}
 {b.h1 && b.h1 !== b.title && (
 <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
 <div style={{ flex: 1 }}>
 <div style={{ fontSize: 10, color: C.dim, marginBottom: 2 }}>H1</div>
 <div style={{ fontSize: 13, color: "#c7d2fe", lineHeight: 1.4 }}>{b.h1}</div>
 </div>
 <CopyBtn text={b.h1} />
 </div>
 )}
 </div>
 )}

 {/* ── Meta section ── */}
 {(b.metaTitle || b.metaDescription) && (
 <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
 <SectionLabel>Meta tags</SectionLabel>
 {b.metaTitle && (
 <div style={{ marginBottom: 10 }}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
 <span style={{ fontSize: 10, color: C.dim }}>META TITLE · {b.metaTitle.length} chars {b.metaTitle.length > 60 ? "⚠" : "✓"}</span>
 <CopyBtn text={b.metaTitle} />
 </div>
 <div style={{ fontSize: 13, color: "#a5b4fc", lineHeight: 1.5 }}>{b.metaTitle}</div>
 </div>
 )}
 {b.metaDescription && (
 <div style={{ paddingTop: b.metaTitle ? 8 : 0, borderTop: b.metaTitle ? `1px solid ${C.border}` : "none" }}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
 <span style={{ fontSize: 10, color: C.dim }}>META DESCRIPTION · {b.metaDescription.length} chars {b.metaDescription.length > 160 ? "⚠ long" : b.metaDescription.length < 120 ? "⚠ short" : "✓"}</span>
 <CopyBtn text={b.metaDescription} />
 </div>
 <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}>{b.metaDescription}</div>
 </div>
 )}
 </div>
 )}

 {/* ── Keyword strategy ── */}
 {(kw.primary || kw.secondary?.length || kw.lsi?.length) && (
 <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
 <SectionLabel>Keyword strategy</SectionLabel>
 {kw.primary && (
 <div style={{ marginBottom: 8 }}>
 <div style={{ fontSize: 10, color: C.dim, marginBottom: 4 }}>PRIMARY</div>
 <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 5, background: "#1e1b4b", color: "#a5b4fc", border: `1px solid ${C.indigo}`, fontWeight: 600 }}>{kw.primary}</span>
 </div>
 )}
 {kw.secondary?.length > 0 && (
 <div style={{ marginBottom: 8 }}>
 <div style={{ fontSize: 10, color: C.dim, marginBottom: 4 }}>SECONDARY</div>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
 {kw.secondary.map((k, i) => <Chip key={i} label={k} color="#1e3a5f" textColor="#93c5fd" />)}
 </div>
 </div>
 )}
 {kw.lsi?.length > 0 && (
 <div>
 <div style={{ fontSize: 10, color: C.dim, marginBottom: 4 }}>LSI / RELATED</div>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
 {kw.lsi.map((k, i) => <Chip key={i} label={k} />)}
 </div>
 </div>
 )}
 </div>
 )}

 {/* ── Outline ── */}
 {b.outline?.length > 0 && (
 <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
 <SectionLabel>Content outline</SectionLabel>
 <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
 {b.outline.map((sec, i) => (
 <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px" }}>
 <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
 <span style={{ width: 20, height: 20, borderRadius: "50%", background: C.indigo, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
 <span style={{ fontSize: 13, fontWeight: 600, color: C.text, flex: 1 }}>{sec.heading}</span>
 {sec.wordCount > 0 && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: C.muted, color: C.dim }}>~{sec.wordCount} words</span>}
 </div>
 {sec.subheadings?.length > 0 && (
 <ul style={{ margin: "4px 0 0 28px", padding: 0, listStyle: "disc" }}>
 {sec.subheadings.map((sh, j) => <li key={j} style={{ fontSize: 12, color: C.sub, lineHeight: 1.6 }}>{sh}</li>)}
 </ul>
 )}
 {sec.notes && <div style={{ fontSize: 11, color: C.dim, marginTop: 6, fontStyle: "italic", paddingLeft: 28 }}>💡 {sec.notes}</div>}
 </div>
 ))}
 </div>
 </div>
 )}

 {/* ── Competitor gaps + Unique angles ── */}
 {((b.competitorGaps?.length > 0) || (b.uniqueAngles?.length > 0)) && (
 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
 {b.competitorGaps?.length > 0 && (
 <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
 <SectionLabel>Competitor gaps to fill</SectionLabel>
 <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
 {b.competitorGaps.map((g, i) => (
 <li key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", fontSize: 12, color: C.sub, lineHeight: 1.5 }}>
 <span style={{ color: "#f87171", flexShrink: 0, marginTop: 1 }}>✗</span>{g}
 </li>
 ))}
 </ul>
 </div>
 )}
 {b.uniqueAngles?.length > 0 && (
 <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
 <SectionLabel>Unique angles to own</SectionLabel>
 <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 5 }}>
 {b.uniqueAngles.map((a, i) => (
 <li key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", fontSize: 12, color: C.sub, lineHeight: 1.5 }}>
 <span style={{ color: "#6ee7b7", flexShrink: 0, marginTop: 1 }}>✓</span>{a}
 </li>
 ))}
 </ul>
 </div>
 )}
 </div>
 )}

 {/* ── CTA ── */}
 {b.cta && (
 <div style={{ background: "#1e1b4b", border: `1px solid ${C.indigo}`, borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
 <span style={{ fontSize: 16, flexShrink: 0 }}>🎯</span>
 <div style={{ flex: 1 }}>
 <div style={{ fontSize: 10, color: "#a5b4fc", fontWeight: 700, marginBottom: 2 }}>SUGGESTED CTA</div>
 <div style={{ fontSize: 13, color: C.text }}>{b.cta}</div>
 </div>
 <CopyBtn text={b.cta} />
 </div>
 )}

 {/* ── GEO section ── */}
 {(geo.entityTargets?.length || geo.authoritySources?.length || geo.directAnswerSections?.length || geo.aiAnswerFormatTips?.length || geo.firstPersonSignalIdeas?.length) ? (
 <div style={{ background: C.bg, border: `1px solid #7c3aed`, borderRadius: 10, padding: "12px 14px" }}>
 <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
 <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 5, background: "#4c1d95", color: "#c4b5fd" }}>GEO</span>
 <span style={{ fontSize: 11, color: "#a78bfa" }}>Generative Engine Optimisation — rank in ChatGPT, Gemini & Perplexity</span>
 </div>
 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
 {geo.entityTargets?.length > 0 && (
 <div>
 <div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, marginBottom: 5 }}>ENTITY TARGETS</div>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
 {geo.entityTargets.map((e, i) => <Chip key={i} label={e} color="#2e1065" textColor="#c4b5fd" />)}
 </div>
 </div>
 )}
 {geo.authoritySources?.length > 0 && (
 <div>
 <div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, marginBottom: 5 }}>CITE THESE SOURCES</div>
 <ul style={{ margin: 0, padding: "0 0 0 14px" }}>
 {geo.authoritySources.map((s, i) => <li key={i} style={{ fontSize: 12, color: "#a78bfa", lineHeight: 1.6 }}>{s}</li>)}
 </ul>
 </div>
 )}
 {geo.directAnswerSections?.length > 0 && (
 <div>
 <div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, marginBottom: 5 }}>DIRECT ANSWER SECTIONS</div>
 <ul style={{ margin: 0, padding: "0 0 0 14px" }}>
 {geo.directAnswerSections.map((s, i) => <li key={i} style={{ fontSize: 12, color: C.sub, lineHeight: 1.6 }}>{s}</li>)}
 </ul>
 </div>
 )}
 {geo.aiAnswerFormatTips?.length > 0 && (
 <div>
 <div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, marginBottom: 5 }}>AI FORMAT TIPS</div>
 <ul style={{ margin: 0, padding: "0 0 0 14px" }}>
 {geo.aiAnswerFormatTips.map((t, i) => <li key={i} style={{ fontSize: 12, color: C.sub, lineHeight: 1.6 }}>{t}</li>)}
 </ul>
 </div>
 )}
 {geo.firstPersonSignalIdeas?.length > 0 && (
 <div style={{ gridColumn: "1 / -1" }}>
 <div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, marginBottom: 5 }}>FIRST-PERSON SIGNAL IDEAS</div>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
 {geo.firstPersonSignalIdeas.map((s, i) => <Chip key={i} label={s} color="#2e1065" textColor="#c4b5fd" />)}
 </div>
 </div>
 )}
 </div>
 </div>
 ) : null}

 </div>
 );
 })()}
 {briefResult && (() => {
 const _b = typeof briefResult === "string" ? (() => { try { return JSON.parse(briefResult); } catch { return {}; } })() : (briefResult || {});
 const _bestKw = _b?.keywordStrategy?.primary || briefPrimary || briefTopic;
 return (
 <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
 <span style={{ fontSize: 11, color: C.dim, flexShrink: 0 }}>Next step:</span>
 <button style={{ ...S.btn(), fontSize: 11, padding: "4px 12px" }} onClick={() => {
 setTitleKw(_bestKw);
 if (!titleNiche && briefTopic) setTitleNiche(briefTopic);
 }}>💡 Generate Titles →</button>
 <button style={{ ...S.btn(), fontSize: 11, padding: "4px 12px" }} onClick={() => {
 setOutlineKw(_bestKw);
 if (briefTone) setOutlineTone(briefTone);
 }}>📝 Create Outline →</button>
 <button style={{ ...S.btn(), fontSize: 11, padding: "4px 12px" }} onClick={() => {
 setDraftKw(_bestKw);
 if (briefTone) setDraftTone(briefTone);
 }}>📄 Write Full Draft →</button>
 </div>
 );
 })()}
 </div>
 </div>
 )}

 {/* ══ Images tab ══ */}
 {(true) && (
 <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 24 }}>
 <div style={{ padding: "20px 22px 16px", borderBottom: `1px solid ${C.border}` }}>
 <div style={{ marginBottom: 4 }}>
 <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>🖼️ Image Planner</div>
 </div>
 <div style={{ fontSize: 13, color: C.dim }}>Hero concept, per-section image prompts, AI prompts for DALL·E / Midjourney, alt text and SEO filenames.</div>
 </div>
 <div style={{ padding: "18px 22px" }}>
 <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
 <input value={imgTopic || draftKw || outlineKw || ""} onChange={e => setImgTopic(e.target.value)} onFocus={e => { if (!imgTopic && (draftKw || outlineKw)) setImgTopic(draftKw || outlineKw); }} onKeyDown={e => e.key === "Enter" && runBlogImages()} placeholder="Blog topic or primary keyword…" style={{ ...S.input, flex: 1 }} />
 <button onClick={runBlogImages} disabled={imgLoading || !(imgTopic || draftKw || outlineKw).trim()} style={{ ...S.btn("primary"), whiteSpace: "nowrap", opacity: imgLoading || !(imgTopic || draftKw || outlineKw).trim() ? 0.5 : 1 }}>{imgLoading ? "⏳ Generating…" : `✨ Generate Image Plan · ${ACTION_COSTS['email-gen']} cr`}</button>
 </div>
 {(draftKw || outlineKw) && !imgTopic && (
 <div style={{ fontSize: 12, color: C.dim, marginBottom: 12, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
 <span>💡 Pre-fill:</span>
 {draftKw && <button style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: C.muted, color: C.sub, border: "none", cursor: "pointer" }} onClick={() => setImgTopic(draftKw)}>{draftKw}</button>}
 {outlineKw && outlineKw !== draftKw && <button style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: C.muted, color: C.sub, border: "none", cursor: "pointer" }} onClick={() => setImgTopic(outlineKw)}>{outlineKw}</button>}
 </div>
 )}
 {imgErr && <div style={{ ...S.err, marginBottom: 12 }}>{imgErr}</div>}
 {imgResult && (
 <>
 <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 12 }}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
 <span style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24" }}>🌟 Hero Image</span>
 <span style={{ fontSize: 11, color: C.dim, background: C.muted, padding: "2px 8px", borderRadius: 4 }}>above the fold</span>
 </div>
 {imgResult.hero?.concept && <div style={{ fontSize: 13, color: C.dim, marginBottom: 10 }}>{imgResult.hero.concept}</div>}
 {imgResult.hero?.aiImagePrompt && (
 <>
 <div style={{ background: "#020817", borderRadius: 8, padding: "10px 14px", marginBottom: 8, position: "relative" }}>
 <div style={{ fontSize: 10, color: "#4ade80", fontWeight: 700, marginBottom: 4 }}>AI IMAGE PROMPT (DALL·E / Midjourney)</div>
 <div style={{ fontFamily: "monospace", fontSize: 12, color: "#86efac", paddingRight: 60, lineHeight: 1.5 }}>{imgResult.hero.aiImagePrompt}</div>
 <button onClick={() => navigator.clipboard.writeText(imgResult.hero.aiImagePrompt)} style={{ position: "absolute", top: 10, right: 10, fontSize: 11, padding: "3px 8px", borderRadius: 6, background: C.muted, color: C.sub, border: "none", cursor: "pointer" }}>Copy</button>
 </div>
 <button
   onClick={() => generateImage('hero', imgResult.hero.aiImagePrompt, imgTopic || draftKw)}
   disabled={!!imgGenLoading['hero']}
   style={{ ...S.btn("primary"), fontSize: 12, padding: "6px 14px", marginBottom: 10, opacity: imgGenLoading['hero'] ? 0.6 : 1 }}
 >
   {imgGenLoading['hero'] ? '⏳ Generating…' : `✨ Generate Real Image · ${ACTION_COSTS['image-gen']} cr`}
 </button>
 {generatedImages['hero'] && (
   <div style={{ marginBottom: 10 }}>
     <img src={generatedImages['hero'].imageUrl} alt={imgResult.hero.altText || 'Generated hero image'} style={{ width: '100%', borderRadius: 8, display: 'block' }} />
     <div style={{ fontSize: 10, color: C.dim, marginTop: 4, textAlign: 'right' }}>
       {generatedImages['hero'].source === 'dalle'
         ? '🤖 Generated by DALL·E 3'
         : (<>📷 Photo by <a href={generatedImages['hero'].credit?.profileUrl} target="_blank" rel="noopener noreferrer" style={{ color: C.sub }}>{generatedImages['hero'].credit?.photographer}</a> on Unsplash</>)
       }
     </div>
   </div>
 )}
 </>
 )}
 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: imgResult.hero?.stockSearchTerms?.length > 0 ? 8 : 0 }}>
 {imgResult.hero?.altText && <div><div style={{ fontSize: 10, color: C.muted, marginBottom: 3, fontWeight: 700 }}>ALT TEXT</div><div style={{ fontSize: 12, color: C.text }}>{imgResult.hero.altText}</div></div>}
 {imgResult.hero?.filename && <div><div style={{ fontSize: 10, color: C.muted, marginBottom: 3, fontWeight: 700 }}>SEO FILENAME</div><div style={{ fontSize: 12, color: "#a5b4fc", fontFamily: "monospace" }}>{imgResult.hero.filename}</div></div>}
 </div>
 {imgResult.hero?.stockSearchTerms?.length > 0 && (
 <div>
 <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, fontWeight: 700 }}>STOCK PHOTO SEARCH TERMS</div>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
 {imgResult.hero.stockSearchTerms.map((t, i) => <span key={i} style={{ fontSize: 11, padding: "2px 8px", background: C.muted, color: C.sub, borderRadius: 10 }}>{t}</span>)}
 </div>
 </div>
 )}
 </div>
 {imgResult.sections?.length > 0 && (
 <div style={{ marginBottom: 12 }}>
 <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Section Images</div>
 {imgResult.sections.map((sec, i) => (
 <div key={i} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px", marginBottom: 8 }}>
 <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 4 }}>{sec.heading}</div>
 {sec.concept && <div style={{ fontSize: 12, color: C.dim, marginBottom: 6 }}>{sec.concept}</div>}
 {sec.aiImagePrompt && (
 <>
 <div style={{ background: "#020817", borderRadius: 6, padding: "8px 12px", fontFamily: "monospace", fontSize: 11, color: "#86efac", marginBottom: 6, position: "relative" }}>
 {sec.aiImagePrompt}
 <button onClick={() => navigator.clipboard.writeText(sec.aiImagePrompt)} style={{ position: "absolute", top: 6, right: 6, fontSize: 10, padding: "2px 6px", borderRadius: 4, background: C.muted, color: C.sub, border: "none", cursor: "pointer" }}>Copy</button>
 </div>
 <button
   onClick={() => generateImage(`section-${i}`, sec.aiImagePrompt, imgTopic || draftKw)}
   disabled={!!imgGenLoading[`section-${i}`]}
   style={{ ...S.btn("primary"), fontSize: 11, padding: "4px 12px", marginBottom: 8, opacity: imgGenLoading[`section-${i}`] ? 0.6 : 1 }}
 >
   {imgGenLoading[`section-${i}`] ? '⏳ Generating…' : `✨ Generate Image · ${ACTION_COSTS['image-gen']} cr`}
 </button>
 {generatedImages[`section-${i}`] && (
   <div style={{ marginBottom: 8 }}>
     <img src={generatedImages[`section-${i}`].imageUrl} alt={sec.altText || sec.heading} style={{ width: '100%', borderRadius: 6, display: 'block' }} />
     <div style={{ fontSize: 10, color: C.dim, marginTop: 3, textAlign: 'right' }}>
       {generatedImages[`section-${i}`].source === 'dalle'
         ? '🤖 Generated by DALL·E 3'
         : (<>📷 Photo by <a href={generatedImages[`section-${i}`].credit?.profileUrl} target="_blank" rel="noopener noreferrer" style={{ color: C.sub }}>{generatedImages[`section-${i}`].credit?.photographer}</a> on Unsplash</>)
       }
     </div>
   </div>
 )}
 </>
 )}
 <div style={{ display: "flex", gap: 16 }}>
 {sec.altText && <span style={{ fontSize: 11, color: C.dim }}><span style={{ color: C.muted, marginRight: 3 }}>alt:</span>{sec.altText}</span>}
 {sec.filename && <span style={{ fontSize: 11, color: "#a5b4fc", fontFamily: "monospace" }}>{sec.filename}</span>}
 </div>
 </div>
 ))}
 </div>
 )}
 {imgResult.infographicIdea && (
 <div style={{ background: "#0c0a20", border: "1px solid #3730a3", borderRadius: 8, padding: "12px 14px", marginBottom: 12 }}>
 <div style={{ fontSize: 11, fontWeight: 700, color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>💡 Infographic Idea</div>
 <div style={{ fontSize: 13, color: C.text }}>{imgResult.infographicIdea}</div>
 </div>
 )}
 {imgResult.generalTips?.length > 0 && (
 <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px" }}>
 <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>General Tips</div>
 {imgResult.generalTips.map((t, i) => <div key={i} style={{ fontSize: 12, color: C.dim, display: "flex", gap: 8, marginBottom: 4 }}><span style={{ color: "#4ade80", flexShrink: 0 }}>•</span>{t}</div>)}
 </div>
 )}
 {/* Next step */}
 <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 12, paddingTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
 <span style={{ fontSize: 11, color: C.dim, flexShrink: 0 }}>Next step:</span>
 <button style={{ ...S.btn(), fontSize: 11, padding: "4px 12px" }} onClick={() => { if (!repTopic) setRepTopic(draftKw || imgTopic)}}>📣 Repurpose Content →</button>
 <button style={{ ...S.btn(), fontSize: 11, padding: "4px 12px" }} onClick={() => { if (!tagsTopic) setTagsTopic(draftKw || imgTopic)}}>🏷️ Tags & Schema →</button>
 <button style={{ ...S.btn(), fontSize: 11, padding: "4px 12px" }} onClick={() => { if (!seoTopic) setSeoTopic(draftKw || imgTopic)}}>📊 SEO Score →</button>
 </div>
 </>
 )}
 </div>
 </div>
 )}

 {/* ══ Repurpose tab ══ */}
 {(true) && (
 <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 24 }}>
 <div style={{ padding: "20px 22px 16px", borderBottom: `1px solid ${C.border}` }}>
 <div style={{ marginBottom: 4 }}>
 <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>📣 Repurpose Content</div>
 </div>
 <div style={{ fontSize: 13, color: C.dim }}>Turn your blog post into social content for Twitter/X, LinkedIn, Instagram, Email, Short Video and Pinterest — all AI-generated, ready to copy.</div>
 </div>
 <div style={{ padding: "18px 22px" }}>
 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
 <div>
 <label style={{ fontSize: 11, color: C.dim, display: "block", marginBottom: 4 }}>Blog Topic / Title</label>
 <input value={repTopic || draftKw || outlineKw || ""} onChange={e => setRepTopic(e.target.value)} onFocus={() => { if (!repTopic && (draftKw || outlineKw)) setRepTopic(draftKw || outlineKw); }} placeholder="What's the post about?" style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
 </div>
 <div>
 <label style={{ fontSize: 11, color: C.dim, display: "block", marginBottom: 4 }}>Key Takeaway (optional)</label>
 <input value={repSummary} onChange={e => setRepSummary(e.target.value)} placeholder="Main message or conclusion…" style={{ ...S.input, width: "100%", boxSizing: "border-box" }} />
 </div>
 </div>
 {(draftKw || outlineKw) && !repTopic && (
 <div style={{ fontSize: 12, color: C.dim, marginBottom: 12, display: "flex", gap: 6, alignItems: "center" }}>
 <span>💡 Pre-fill:</span>
 <button style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: C.muted, color: C.sub, border: "none", cursor: "pointer" }} onClick={() => setRepTopic(draftKw || outlineKw)}>{draftKw || outlineKw}</button>
 </div>
 )}
 <button onClick={runRepurpose} disabled={repLoading || !(repTopic || draftKw || outlineKw).trim()} style={{ ...S.btn("primary"), marginBottom: 14, opacity: repLoading || !(repTopic || draftKw || outlineKw).trim() ? 0.5 : 1 }}>{repLoading ? "⏳ Generating…" : `✨ Generate Content Pack · ${ACTION_COSTS['email-gen']} cr`}</button>
 {repErr && <div style={{ ...S.err, marginBottom: 12 }}>{repErr}</div>}
 {repResult && (
 <>
 <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 14 }}>
 {[["twitter","𝕏 Twitter"],["linkedin","LinkedIn"],["instagram","📸 Instagram"],["email","✉️ Email"],["shortVideo","🎬 Short Video"],["pinterest","📌 Pinterest"]].map(([k, lbl]) => (
 <button key={k} onClick={() => setRepPlatform(k)} style={{ fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 16, cursor: "pointer", background: repPlatform === k ? "#0d9488" : C.muted, color: repPlatform === k ? "#fff" : C.sub, border: repPlatform === k ? "1px solid #0d9488" : "1px solid transparent" }}>{lbl}</button>
 ))}
 </div>
 {repPlatform === "twitter" && repResult.twitter && (
 <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
 {repResult.twitter.singleTweet && (
 <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><span style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa" }}>Single Tweet</span><button onClick={() => navigator.clipboard.writeText(repResult.twitter.singleTweet)} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: C.muted, color: C.sub, border: "none", cursor: "pointer" }}>Copy</button></div>
 <div style={{ fontSize: 14, color: C.text, lineHeight: 1.5 }}>{repResult.twitter.singleTweet}</div>
 </div>
 )}
 {repResult.twitter.thread?.length > 0 && (
 <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}><span style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa" }}>Thread ({repResult.twitter.thread.length} tweets)</span><button onClick={() => navigator.clipboard.writeText(repResult.twitter.thread.join("\n\n"))} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: C.muted, color: C.sub, border: "none", cursor: "pointer" }}>Copy All</button></div>
 {repResult.twitter.thread.map((t, i) => <div key={i} style={{ padding: "8px 0", borderBottom: i < repResult.twitter.thread.length - 1 ? `1px solid ${C.border}` : "none", display: "flex", gap: 10 }}><span style={{ fontSize: 11, fontWeight: 700, color: C.dim, minWidth: 22 }}>{i+1}/</span><div style={{ fontSize: 13, color: C.text, flex: 1, lineHeight: 1.5 }}>{t}</div></div>)}
 </div>
 )}
 </div>
 )}
 {repPlatform === "linkedin" && repResult.linkedin && (
 <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
 {repResult.linkedin.hook && <div style={{ background: "#0a1628", borderRadius: 6, padding: "8px 12px", marginBottom: 10 }}><div style={{ fontSize: 10, color: "#60a5fa", fontWeight: 700, marginBottom: 3 }}>HOOK</div><div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{repResult.linkedin.hook}</div></div>}
 <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}><button onClick={() => navigator.clipboard.writeText(repResult.linkedin.post || "")} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: C.muted, color: C.sub, border: "none", cursor: "pointer" }}>Copy Post</button></div>
 <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{repResult.linkedin.post}</div>
 </div>
 )}
 {repPlatform === "instagram" && repResult.instagram && (
 <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
 <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><span style={{ fontSize: 12, fontWeight: 700, color: "#f472b6" }}>Caption</span><button onClick={() => navigator.clipboard.writeText(repResult.instagram.caption || "")} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: C.muted, color: C.sub, border: "none", cursor: "pointer" }}>Copy</button></div>
 <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{repResult.instagram.caption}</div>
 </div>
 {repResult.instagram.hashtags?.length > 0 && (
 <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}><span style={{ fontSize: 11, fontWeight: 700, color: "#f472b6" }}>HASHTAGS</span><button onClick={() => navigator.clipboard.writeText(repResult.instagram.hashtags.map(h => `#${h}`).join(" "))} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: C.muted, color: C.sub, border: "none", cursor: "pointer" }}>Copy All</button></div>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{repResult.instagram.hashtags.map((h, i) => <span key={i} style={{ fontSize: 11, padding: "2px 8px", background: "#500724", color: "#fda4af", borderRadius: 10 }}>#{h}</span>)}</div>
 </div>
 )}
 {repResult.instagram.storyIdeas?.length > 0 && (
 <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
 <div style={{ fontSize: 11, fontWeight: 700, color: "#f472b6", marginBottom: 6 }}>STORY IDEAS</div>
 {repResult.instagram.storyIdeas.map((s, i) => <div key={i} style={{ fontSize: 12, color: C.dim, display: "flex", gap: 8, marginBottom: 3 }}><span style={{ color: "#f472b6" }}>•</span>{s}</div>)}
 </div>
 )}
 </div>
 )}
 {repPlatform === "email" && repResult.email && (
 <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
 {repResult.email.subjectLines?.length > 0 && (
 <div style={{ marginBottom: 12 }}>
 <div style={{ fontSize: 11, fontWeight: 700, color: "#34d399", marginBottom: 6 }}>SUBJECT LINES</div>
 {repResult.email.subjectLines.map((s, i) => <div key={i} style={{ fontSize: 13, color: C.text, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 8px", background: "#0a1a12", borderRadius: 6, marginBottom: 4 }}><span>{s}</span><button onClick={() => navigator.clipboard.writeText(s)} style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: C.muted, color: C.sub, border: "none", cursor: "pointer", flexShrink: 0 }}>Copy</button></div>)}
 </div>
 )}
 {repResult.email.preheader && <div style={{ marginBottom: 10 }}><div style={{ fontSize: 11, fontWeight: 700, color: "#34d399", marginBottom: 4 }}>PREHEADER</div><div style={{ fontSize: 12, color: C.dim, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 8px", background: "#0a1a12", borderRadius: 6 }}><span>{repResult.email.preheader}</span><button onClick={() => navigator.clipboard.writeText(repResult.email.preheader)} style={{ fontSize: 11, padding: "2px 6px", borderRadius: 4, background: C.muted, color: C.sub, border: "none", cursor: "pointer", flexShrink: 0 }}>Copy</button></div></div>}
 {repResult.email.teaser && <div><div style={{ fontSize: 11, fontWeight: 700, color: "#34d399", marginBottom: 4 }}>EMAIL TEASER</div><div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{repResult.email.teaser}</div></div>}
 </div>
 )}
 {repPlatform === "shortVideo" && repResult.shortVideo && (
 <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
 {repResult.shortVideo.hookLine && <div style={{ background: "#0a0a1a", border: "1px solid #4c1d95", borderRadius: 10, padding: "14px 16px" }}><div style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", marginBottom: 4 }}>HOOK LINE</div><div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{repResult.shortVideo.hookLine}</div></div>}
 {repResult.shortVideo.scriptOutline?.length > 0 && (
 <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
 <div style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", marginBottom: 8 }}>SCRIPT OUTLINE</div>
 {repResult.shortVideo.scriptOutline.map((s, i) => <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}><span style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", minWidth: 22 }}>{i+1}.</span><span style={{ fontSize: 12, color: C.text }}>{s}</span></div>)}
 </div>
 )}
 {repResult.shortVideo.caption && <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}><span style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa" }}>VIDEO CAPTION</span><button onClick={() => navigator.clipboard.writeText(repResult.shortVideo.caption)} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: C.muted, color: C.sub, border: "none", cursor: "pointer" }}>Copy</button></div><div style={{ fontSize: 13, color: C.text }}>{repResult.shortVideo.caption}</div></div>}
 </div>
 )}
 {repPlatform === "pinterest" && repResult.pinterest && (
 <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
 {repResult.pinterest.title && <div style={{ marginBottom: 10 }}><div style={{ fontSize: 11, fontWeight: 700, color: "#f43f5e", marginBottom: 4 }}>PIN TITLE</div><div style={{ fontSize: 14, fontWeight: 600, color: C.text, display: "flex", justifyContent: "space-between" }}><span>{repResult.pinterest.title}</span><button onClick={() => navigator.clipboard.writeText(repResult.pinterest.title)} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: C.muted, color: C.sub, border: "none", cursor: "pointer" }}>Copy</button></div></div>}
 {repResult.pinterest.description && <div style={{ marginBottom: 10 }}><div style={{ fontSize: 11, fontWeight: 700, color: "#f43f5e", marginBottom: 4 }}>PIN DESCRIPTION</div><div style={{ fontSize: 13, color: C.text, lineHeight: 1.6, display: "flex", justifyContent: "space-between", gap: 8 }}><span>{repResult.pinterest.description}</span><button onClick={() => navigator.clipboard.writeText(repResult.pinterest.description)} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: C.muted, color: C.sub, border: "none", cursor: "pointer", flexShrink: 0 }}>Copy</button></div></div>}
 {repResult.pinterest.boardSuggestions?.length > 0 && <div><div style={{ fontSize: 11, fontWeight: 700, color: "#f43f5e", marginBottom: 6 }}>BOARD SUGGESTIONS</div><div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{repResult.pinterest.boardSuggestions.map((b, i) => <span key={i} style={{ fontSize: 11, padding: "2px 8px", background: "#4c0519", color: "#fda4af", borderRadius: 10 }}>{b}</span>)}</div></div>}
 </div>
 )}
 {/* Next step */}
 <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 12, paddingTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
 <span style={{ fontSize: 11, color: C.dim, flexShrink: 0 }}>Next step:</span>
 <button style={{ ...S.btn(), fontSize: 11, padding: "4px 12px" }} onClick={() => { if (!tagsTopic) setTagsTopic(draftKw || repTopic)}}>🏷️ Tags & Schema →</button>
 <button style={{ ...S.btn(), fontSize: 11, padding: "4px 12px" }} onClick={() => { if (!seoTopic) setSeoTopic(draftKw || repTopic)}}>📊 SEO Score →</button>
 </div>
 </>
 )}
 </div>
 </div>
 )}

 {/* ══ Tags & Schema tab ══ */}
 {(true) && (
 <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 24 }}>
 <div style={{ padding: "20px 22px 16px", borderBottom: `1px solid ${C.border}` }}>
 <div style={{ marginBottom: 4 }}>
 <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>🏷️ Tags, Categories & Schema</div>
 </div>
 <div style={{ fontSize: 13, color: C.dim }}>Shopify tags, blog categories, FAQ rich snippets and JSON-LD schema markup ready to paste into Shopify.</div>
 </div>
 <div style={{ padding: "18px 22px" }}>
 <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
 <input value={tagsTopic || outlineKw || draftKw || ""} onChange={e => setTagsTopic(e.target.value)} onFocus={() => { if (!tagsTopic && (outlineKw || draftKw)) setTagsTopic(outlineKw || draftKw); }} onKeyDown={e => e.key === "Enter" && runTagsSchema()} placeholder="Blog topic or primary keyword…" style={{ ...S.input, flex: 1 }} />
 <button onClick={runTagsSchema} disabled={tagsLoading || !(tagsTopic || outlineKw || draftKw).trim()} style={{ ...S.btn("primary"), whiteSpace: "nowrap", opacity: tagsLoading || !(tagsTopic || outlineKw || draftKw).trim() ? 0.5 : 1 }}>{tagsLoading ? "⏳ Generating…" : `✨ Generate Tags & Schema · ${ACTION_COSTS['email-gen']} cr`}</button>
 </div>
 {(outlineKw || draftKw) && !tagsTopic && (
 <div style={{ fontSize: 12, color: C.dim, marginBottom: 12, display: "flex", gap: 6, alignItems: "center" }}>
 <span>💡 Pre-fill:</span>
 <button style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: C.muted, color: C.sub, border: "none", cursor: "pointer" }} onClick={() => setTagsTopic(outlineKw || draftKw)}>{outlineKw || draftKw}</button>
 </div>
 )}
 {tagsErr && <div style={{ ...S.err, marginBottom: 12 }}>{tagsErr}</div>}
 {tagsResult && (
 <>
 <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
 {[["tags","🏷️ Tags & Categories"],["faq","❓ FAQ"],["schema","🔁 Schema Code"]].map(([k, lbl]) => (
 <button key={k} onClick={() => setTagsSchemaView(k)} style={{ fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 16, cursor: "pointer", background: tagsSchemaView === k ? "#0d9488" : C.muted, color: tagsSchemaView === k ? "#fff" : C.sub, border: tagsSchemaView === k ? "1px solid #0d9488" : "1px solid transparent" }}>{lbl}</button>
 ))}
 </div>
 {tagsSchemaView === "tags" && (
 <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
 <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
 {tagsResult.readingLevel && <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20, background: "#042f2e", color: "#5eead4", border: "1px solid #0d9488" }}>📖 {tagsResult.readingLevel} reading level</span>}
 {tagsResult.contentType && <span style={{ fontSize: 12, padding: "4px 12px", borderRadius: 20, background: "#1e1b4b", color: "#a5b4fc", border: "1px solid #4f46e5" }}>📋 {tagsResult.contentType}</span>}
 </div>
 <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><span style={{ fontSize: 12, fontWeight: 700, color: "#5eead4" }}>SHOPIFY TAGS</span><button onClick={() => navigator.clipboard.writeText((tagsResult.tags || []).join(", "))} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: C.muted, color: C.sub, border: "none", cursor: "pointer" }}>Copy All</button></div>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{(tagsResult.tags || []).map((t, i) => <span key={i} onClick={() => navigator.clipboard.writeText(t)} style={{ fontSize: 12, padding: "3px 10px", background: "#042f2e", color: "#5eead4", border: "1px solid #0d9488", borderRadius: 12, cursor: "pointer" }}>{t}</span>)}</div>
 </div>
 <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}><span style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa" }}>CATEGORIES</span><button onClick={() => navigator.clipboard.writeText((tagsResult.categories || []).join(", "))} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: C.muted, color: C.sub, border: "none", cursor: "pointer" }}>Copy All</button></div>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{(tagsResult.categories || []).map((c, i) => <span key={i} style={{ fontSize: 12, padding: "3px 10px", background: "#1e1b4b", color: "#a5b4fc", border: "1px solid #4f46e5", borderRadius: 12 }}>{c}</span>)}</div>
 </div>
 {tagsResult.seriesIdeas?.length > 0 && (
 <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
 <div style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24", marginBottom: 8 }}>💡 Related Series Ideas</div>
 {tagsResult.seriesIdeas.map((s, i) => <div key={i} style={{ fontSize: 12, color: C.dim, display: "flex", gap: 8, marginBottom: 4 }}><span style={{ color: "#fbbf24" }}>→</span>{s}</div>)}
 </div>
 )}
 </div>
 )}
 {tagsSchemaView === "faq" && (
 <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
 {(tagsResult.faq || []).map((item, i) => (
 <div key={i} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
 <div style={{ fontSize: 13, fontWeight: 600, color: C.text, flex: 1 }}>Q: {item.question}</div>
 <button onClick={() => navigator.clipboard.writeText(`Q: ${item.question}\nA: ${item.answer}`)} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: C.muted, color: C.sub, border: "none", cursor: "pointer", flexShrink: 0 }}>Copy</button>
 </div>
 <div style={{ fontSize: 13, color: C.dim, marginTop: 6, lineHeight: 1.6 }}>A: {item.answer}</div>
 </div>
 ))}
 </div>
 )}
 {tagsSchemaView === "schema" && (
 <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
 {tagsResult.faqSchema && (
 <div>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}><span style={{ fontSize: 12, fontWeight: 700, color: "#4ade80" }}>FAQ Schema (JSON-LD)</span><button onClick={() => navigator.clipboard.writeText(tagsResult.faqSchema)} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: C.muted, color: C.sub, border: "none", cursor: "pointer" }}>Copy</button></div>
 <pre style={{ background: "#020817", borderRadius: 8, padding: "12px 14px", fontSize: 11, color: "#86efac", overflow: "auto", margin: 0, lineHeight: 1.5 }}>{tagsResult.faqSchema}</pre>
 </div>
 )}
 {tagsResult.articleSchema && (
 <div>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}><span style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa" }}>Article Schema (JSON-LD)</span><button onClick={() => navigator.clipboard.writeText(tagsResult.articleSchema)} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: C.muted, color: C.sub, border: "none", cursor: "pointer" }}>Copy</button></div>
 <pre style={{ background: "#020817", borderRadius: 8, padding: "12px 14px", fontSize: 11, color: "#93c5fd", overflow: "auto", margin: 0, lineHeight: 1.5 }}>{tagsResult.articleSchema}</pre>
 </div>
 )}
 </div>
 )}
 {/* Next step */}
 <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 12, paddingTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
 <span style={{ fontSize: 11, color: C.dim, flexShrink: 0 }}>Next step:</span>
 <button style={{ ...S.btn(), fontSize: 11, padding: "4px 12px" }} onClick={() => { if (!seoTopic) setSeoTopic(tagsTopic || draftKw); if (draftResult?.content && !seoContent) setSeoContent(draftResult.content)}}>📊 SEO Score →</button>
 </div>
 </>
 )}
 </div>
 </div>
 )}

 {/* ══ SEO Score tab ══ */}
 {(true) && (
 <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 24 }}>
 <div style={{ padding: "20px 22px 16px", borderBottom: `1px solid ${C.border}` }}>
 <div style={{ marginBottom: 4 }}>
 <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>📊 SEO Score</div>
 </div>
 <div style={{ fontSize: 13, color: C.dim }}>Get a detailed SEO analysis — overall score, keyword optimisation, structure, readability, E-E-A-T, title suggestions and meta descriptions.</div>
 </div>
 <div style={{ padding: "18px 22px" }}>
 <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
 <input value={seoTopic || outlineKw || draftKw || ""} onChange={e => setSeoTopic(e.target.value)} onFocus={() => { if (!seoTopic && (outlineKw || draftKw)) setSeoTopic(outlineKw || draftKw); }} onKeyDown={e => e.key === "Enter" && runSeoScore()} placeholder="Blog topic or primary keyword…" style={{ ...S.input, flex: 1 }} />
 <button onClick={runSeoScore} disabled={seoLoading || !(seoTopic || outlineKw || draftKw).trim()} style={{ ...S.btn("primary"), whiteSpace: "nowrap", opacity: seoLoading || !(seoTopic || outlineKw || draftKw).trim() ? 0.5 : 1 }}>{seoLoading ? "⏳ Analysing…" : `📊 Get SEO Score · ${ACTION_COSTS['seo-scan']} cr`}</button>
 </div>
 <div style={{ marginBottom: 14 }}>
 <label style={{ fontSize: 11, color: C.dim, display: "block", marginBottom: 4 }}>Paste blog content for deeper analysis (optional)</label>
 <textarea value={seoContent} onChange={e => setSeoContent(e.target.value)} placeholder="Paste your draft text here for a more accurate score…" style={{ ...S.textarea, minHeight: 80 }} />
 </div>
 {(outlineKw || draftKw) && !seoTopic && (
 <div style={{ fontSize: 12, color: C.dim, marginBottom: 12, display: "flex", gap: 6, alignItems: "center" }}>
 <span>💡 Pre-fill:</span>
 <button style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: C.muted, color: C.sub, border: "none", cursor: "pointer" }} onClick={() => setSeoTopic(outlineKw || draftKw)}>{outlineKw || draftKw}</button>
 </div>
 )}
 {seoErr && <div style={{ ...S.err, marginBottom: 12 }}>{seoErr}</div>}
 {seoResult && (() => {
 const bd = seoResult.breakdown || {};
 const cats = Object.values(bd);
 return (
 <>
 {/* Score ring + grade */}
 <div style={{ display: "flex", gap: 20, alignItems: "center", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px", marginBottom: 14 }}>
 <div style={{ ...S.ring(seoResult.overallScore || 0), width: 80, height: 80, fontSize: 26, flexShrink: 0 }}>{seoResult.overallScore ?? "—"}</div>
 <div style={{ flex: 1 }}>
 <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
 <span style={{ fontSize: 22, fontWeight: 800, color: C.text }}>{seoResult.grade || "—"}</span>
 <span style={{ fontSize: 12, color: C.dim }}>Overall SEO Score</span>
 </div>
 {seoResult.summary && <div style={{ fontSize: 13, color: C.dim, lineHeight: 1.5 }}>{seoResult.summary}</div>}
 </div>
 </div>
 {/* Breakdown bars */}
 {cats.length > 0 && (
 <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px", marginBottom: 14 }}>
 <div style={{ fontSize: 12, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>Score Breakdown</div>
 {cats.map((cat, i) => (
 <div key={i} style={{ marginBottom: 14 }}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
 <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{cat.label}</span>
 <span style={{ fontSize: 14, fontWeight: 700, ...S.score(cat.score || 0) }}>{cat.score ?? "—"}/100</span>
 </div>
 <div style={{ height: 6, background: C.muted, borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
 <div style={{ height: "100%", width: `${cat.score || 0}%`, background: (cat.score || 0) >= 75 ? C.green : (cat.score || 0) >= 50 ? C.yellow : C.red, borderRadius: 3, transition: "width .4s" }} />
 </div>
 {cat.issues?.length > 0 && cat.issues.map((iss, j) => <div key={j} style={{ fontSize: 11, color: "#fca5a5", display: "flex", gap: 6, marginBottom: 2 }}><span style={{ flexShrink: 0 }}>⚠</span>{iss}</div>)}
 {cat.tips?.length > 0 && cat.tips.map((tip, j) => <div key={j} style={{ fontSize: 11, color: "#86efac", display: "flex", gap: 6, marginBottom: 2 }}><span style={{ flexShrink: 0 }}>→</span>{tip}</div>)}
 </div>
 ))}
 </div>
 )}
 {/* Two-col: critical issues + quick wins */}
 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
 {seoResult.criticalIssues?.length > 0 && (
 <div style={{ background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 10, padding: "12px 14px" }}>
 <div style={{ fontSize: 12, fontWeight: 700, color: "#fca5a5", marginBottom: 8 }}>🚨 Critical Issues</div>
 {seoResult.criticalIssues.map((iss, i) => <div key={i} style={{ fontSize: 12, color: "#fca5a5", display: "flex", gap: 6, marginBottom: 4 }}><span style={{ flexShrink: 0 }}>•</span>{iss}</div>)}
 </div>
 )}
 {seoResult.quickWins?.length > 0 && (
 <div style={{ background: "#052e16", border: "1px solid #166534", borderRadius: 10, padding: "12px 14px" }}>
 <div style={{ fontSize: 12, fontWeight: 700, color: "#86efac", marginBottom: 8 }}>⚡ Quick Wins</div>
 {seoResult.quickWins.map((win, i) => <div key={i} style={{ fontSize: 12, color: "#86efac", display: "flex", gap: 6, marginBottom: 4 }}><span style={{ flexShrink: 0 }}>✓</span>{win}</div>)}
 </div>
 )}
 </div>
 {/* Passed checks */}
 {seoResult.passedChecks?.length > 0 && (
 <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
 <div style={{ fontSize: 12, fontWeight: 700, color: "#4ade80", marginBottom: 8 }}>✅ Passed Checks</div>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{seoResult.passedChecks.map((c, i) => <span key={i} style={{ fontSize: 11, padding: "2px 10px", background: "#052e16", color: "#86efac", border: "1px solid #166534", borderRadius: 12 }}>{c}</span>)}</div>
 </div>
 )}
 {/* Title suggestions */}
 {seoResult.titleSuggestions?.length > 0 && (
 <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
 <div style={{ fontSize: 12, fontWeight: 700, color: "#a5b4fc", marginBottom: 8 }}>💡 Optimised Title Suggestions</div>
 {seoResult.titleSuggestions.map((t, i) => <div key={i} style={{ fontSize: 13, color: C.text, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", background: "#0a0a1a", borderRadius: 6, marginBottom: 4 }}><span>{t}</span><button onClick={() => { navigator.clipboard.writeText(t); setTitleKw(t); }} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: C.muted, color: C.sub, border: "none", cursor: "pointer", flexShrink: 0 }}>Copy + Use</button></div>)}
 </div>
 )}
 {/* Meta descriptions */}
 {seoResult.metaDescriptions?.length > 0 && (
 <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
 <div style={{ fontSize: 12, fontWeight: 700, color: "#5eead4", marginBottom: 8 }}>📝 Meta Description Options</div>
 {seoResult.metaDescriptions.map((d, i) => <div key={i} style={{ fontSize: 13, color: C.text, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, padding: "6px 8px", background: "#020817", borderRadius: 6, marginBottom: 4 }}><span style={{ lineHeight: 1.5, flex: 1 }}>{d}</span><button onClick={() => navigator.clipboard.writeText(d)} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: C.muted, color: C.sub, border: "none", cursor: "pointer", flexShrink: 0 }}>Copy</button></div>)}
 </div>
 )}
 </>
 );
 })()}
 </div>
 </div>
 )}

 </> /* end advanced mode */
 )}
 </>
 )}

 {/* ════════════════════════════
 WRITEFLOW — Title & Outline
 ════════════════════════════ */}
 {section === "WriteFlow" && (
 <div style={{ margin:"0 -28px", minHeight:"100vh" }}>
 {/* Top bar */}
 <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 28px", borderBottom:`1px solid ${C.border}`, background:C.bg, position:"sticky", top:0, zIndex:10 }}>
 <button onClick={() => setSection("Posts")} style={{ background:"none", border:"none", color:C.sub, cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", gap:6, padding:0 }}>
 <span style={{ fontSize:16 }}>‹</span> Back
 </button>
 <div style={{ display:"flex", alignItems:"center", gap:10 }}>
 <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, fontWeight:600, color:C.indigo }}>
 <span style={{ width:20, height:20, borderRadius:"50%", background:C.indigo, color:"#fff", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700 }}>1</span>
 Title &amp; Outline
 </span>
 <span style={{ color:C.border, fontSize:16 }}>›</span>
 <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, fontWeight:500, color:C.dim }}>
 <span style={{ width:20, height:20, borderRadius:"50%", background:C.muted, color:C.sub, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700 }}>2</span>
 Article &amp; SEO
 </span>
 </div>
 <button disabled style={{ ...S.btn("primary"), opacity:0.4, fontSize:12, padding:"6px 14px" }}>↑ Export</button>
 </div>

 {/* Two-column body */}
 <div style={{ display:"grid", gridTemplateColumns:"220px 1fr", gap:0, minHeight:"calc(100vh - 53px)" }}>
 {/* Left panel */}
 <div style={{ background:"#111113", borderRight:`1px solid ${C.border}`, padding:"20px 16px", display:"flex", flexDirection:"column", gap:0 }}>
 <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:14 }}>Content Options</div>

 {/* Outline length */}
 <div style={{ marginBottom:20 }}>
 <div style={{ fontSize:12, fontWeight:600, color:C.sub, marginBottom:8 }}>Number of sections</div>
 {[
 ["small", "Small (4–6)", "700–1,500 words"],
 ["medium", "Medium (6–9)", "1,500–3,000 words"],
 ["long", "Long (9–12)", "3,000–5,000 words"],
 ].map(([val, label, hint]) => (
 <div key={val} onClick={() => setWfOutlineSize(val)} style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"8px 0", cursor:"pointer", borderBottom:`1px solid ${C.border}` }}>
 <div style={{ width:14, height:14, borderRadius:"50%", border:`2px solid ${wfOutlineSize===val ? C.indigo : C.border}`, background: wfOutlineSize===val ? C.indigo : "transparent", flexShrink:0, marginTop:2 }}/>
 <div>
 <div style={{ fontSize:12, color: wfOutlineSize===val ? C.text : C.sub, fontWeight: wfOutlineSize===val ? 600 : 400 }}>{label}</div>
 <div style={{ fontSize:11, color:C.dim }}>{hint}</div>
 </div>
 </div>
 ))}
 </div>

 {/* Toggles */}
 <div style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:12 }}>Sections</div>
 {[
 ["Conclusion", wfConclusion, setWfConclusion, "Add a conclusion section"],
 ["FAQs", wfFaqs, setWfFaqs, "Add frequently asked questions"],
 ].map(([label, val, setter, hint]) => (
 <div key={label} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${C.border}` }}>
 <div>
 <div style={{ fontSize:12, fontWeight:500, color:C.sub }}>{label}</div>
 <div style={{ fontSize:11, color:C.dim }}>{hint}</div>
 </div>
 <div onClick={() => setter(!val)} style={{ width:36, height:20, borderRadius:10, background: val ? C.indigo : C.muted, cursor:"pointer", position:"relative", transition:"background .2s" }}>
 <div style={{ position:"absolute", top:2, left: val ? 18 : 2, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left .2s" }}/>
 </div>
 </div>
 ))}

 <div style={{ flex:1 }}/>
 {wfErr && <div style={{ fontSize:11, color:"#f87171", marginBottom:8, lineHeight:1.4 }}>{wfErr}</div>}
 {/* Balance hint */}
 {!creditsUnlimited && creditsBalance !== null && (
 <div style={{ fontSize:11, color: creditsBalance < 3 ? "#f87171" : "#71717a", marginBottom:4, textAlign:"center" }}>
 {creditsBalance < 3 ? `Only ${creditsBalance} credit${creditsBalance!==1?'s':''} left` : `${creditsBalance.toLocaleString()} credits remaining`}
 </div>
 )}
 <button
 style={{ ...S.btn("primary"), width:"100%", padding:"12px 0", fontSize:13, fontWeight:700, marginTop:20, opacity: !wfPickedTitle ? 0.5 : 1 }}
 disabled={!wfPickedTitle}
 onClick={wfGenerateArticle}
 >Generate Article &middot; {ACTION_COSTS['blog-draft']} credits</button>
 </div>

 {/* Right content */}
 <div style={{ padding:"24px 28px", overflowY:"auto" }}>
 {/* Title section */}
 <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
 <div style={{ fontSize:18, fontWeight:800, color:C.text }}>Title</div>
 <button onClick={wfRegenerateTitles} disabled={wfTitleLoading} style={{ ...S.btn(), padding:"5px 12px", fontSize:12, display:"flex", alignItems:"center", gap:6 }}>
 {wfTitleLoading ? <span style={S.spinner}/> : "↺"} Regenerate
 </button>
 </div>
 <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:32 }}>
 {wfTitles.map((t,i) => (
 <div key={i} onClick={() => { setWfPickedTitle(t); setWfOutlines([]); setWfOutlineLoading(true); apiFetchJSON(`${API}/ai/blog-outline`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ keyword: t }) }).then(or => { if(or.ok) { const secs = wfOutlineSize==="small"?5:wfOutlineSize==="medium"?8:11; setWfOutlines((or.sections||[]).slice(0,secs).map(s=>s.heading||s)); } setWfOutlineLoading(false); }).catch(()=>setWfOutlineLoading(false)); }}
 style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderRadius:10, border:`1.5px solid ${wfPickedTitle===t ? C.indigo : C.border}`, background: wfPickedTitle===t ? "#1e1b4b" : C.bg, cursor:"pointer", transition:"all .15s" }}>
 <div style={{ width:16, height:16, borderRadius:"50%", border:`2px solid ${wfPickedTitle===t ? C.indigo : C.border}`, background: wfPickedTitle===t ? C.indigo : "transparent", flexShrink:0 }}/>
 <span style={{ fontSize:14, color: wfPickedTitle===t ? "#c7d2fe" : C.sub, fontWeight: wfPickedTitle===t ? 600 : 400, lineHeight:1.4 }}>{t}</span>
 </div>
 ))}
 </div>

 {/* Outline section */}
 <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:10 }}>
 <div style={{ fontSize:18, fontWeight:800, color:C.text }}>Article Outline</div>
 <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
 <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, color:C.sub }}>
 <span>Length:</span>
 <select value={wfOutlineSize} onChange={e => setWfOutlineSize(e.target.value)} style={{ ...S.input, padding:"4px 8px", fontSize:12, width:"auto" }}>
 <option value="small">Small (4–6) · 700–1,500 words</option>
 <option value="medium">Medium (6–9) · 1,500–3,000 words</option>
 <option value="long">Long (9–12) · 3,000–5,000 words</option>
 </select>
 </div>
 <button onClick={wfRegenerateOutline} disabled={wfOutlineLoading || !wfPickedTitle} style={{ ...S.btn(), padding:"5px 12px", fontSize:12, display:"flex", alignItems:"center", gap:6 }}>
 {wfOutlineLoading ? <span style={S.spinner}/> : "↺"} Regenerate
 </button>
 <button onClick={() => setWfOutlines(prev => [...prev, "New section"])} style={{ ...S.btn(), padding:"5px 12px", fontSize:12 }}>+ Add section</button>
 </div>
 </div>

 {wfOutlineLoading && (
 <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
 {[1,2,3,4,5].map(i => (
 <div key={i} style={{ height:44, borderRadius:8, background:C.muted, animation:"pulse 1.5s ease-in-out infinite", opacity: 1 - (i * 0.12) }}/>
 ))}
 </div>
 )}
 {!wfOutlineLoading && wfOutlines.length > 0 && (
 <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
 {wfOutlines.map((sec, i) => (
 <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", borderRadius:8, border:`1px solid ${C.border}`, background:C.bg, group:"true" }}>
 <span style={{ fontSize:11, color:C.dim, userSelect:"none" }}>⠿</span>
 <span style={{ fontSize:13, color:C.dim, fontWeight:600, minWidth:20 }}>{i+1}.</span>
 <input
 value={sec}
 onChange={e => setWfOutlines(prev => prev.map((s,j) => j===i ? e.target.value : s))}
 style={{ flex:1, background:"transparent", border:"none", outline:"none", fontSize:14, color:C.text, padding:0 }}
 />
 <button onClick={() => setWfOutlines(prev => prev.filter((_,j)=>j!==i))} style={{ background:"none", border:"none", color:C.dim, cursor:"pointer", fontSize:14, padding:"0 4px", opacity:0.5 }}></button>
 </div>
 ))}
 {wfConclusion && <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", borderRadius:8, border:`1px solid ${C.border}`, background:"#111113" }}><span style={{ fontSize:11, color:C.dim }}>⠿</span><span style={{ fontSize:13, color:C.dim, fontWeight:600, minWidth:20 }}>{wfOutlines.length+1}.</span><span style={{ fontSize:14, color:C.dim }}>Conclusion</span><span style={{ marginLeft:"auto", fontSize:11, color:C.dim, background:C.muted, padding:"1px 8px", borderRadius:4 }}>auto</span></div>}
 {wfFaqs && <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", borderRadius:8, border:`1px solid ${C.border}`, background:"#111113" }}><span style={{ fontSize:11, color:C.dim }}>⠿</span><span style={{ fontSize:13, color:C.dim, fontWeight:600, minWidth:20 }}>{wfOutlines.length+(wfConclusion?2:1)}.</span><span style={{ fontSize:14, color:C.dim }}>FAQs</span><span style={{ marginLeft:"auto", fontSize:11, color:C.dim, background:C.muted, padding:"1px 8px", borderRadius:4 }}>auto</span></div>}
 </div>
 )}
 {!wfOutlineLoading && wfOutlines.length === 0 && wfPickedTitle && (
 <div style={{ textAlign:"center", padding:"32px 0", color:C.dim, fontSize:13 }}>
 <div style={{ marginBottom:8 }}>No outline yet</div>
 <button onClick={wfRegenerateOutline} style={{ ...S.btn("primary"), padding:"8px 20px" }}>Generate Outline</button>
 </div>
 )}
 </div>
 </div>
 </div>
 )}

 {/* ════════════════════════════
 WRITEGENERATING — progress screen
 ════════════════════════════ */}
 {section === "WriteGenerating" && (
 <div style={{ margin:"0 -28px", minHeight:"100vh", background:"#09090b" }}>
 {/* Top bar */}
 <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 28px", borderBottom:"1px solid #3f3f46", background:"#09090b", position:"sticky", top:0, zIndex:10 }}>
 <button onClick={() => { clearInterval(wfProgressRef.current); setWfGenerating(false); setSection("WriteFlow"); }} style={{ background:"none", border:"none", color:"#a1a1aa", cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", gap:6, padding:0 }}>
 <span style={{ fontSize:16 }}>‹</span> Back
 </button>
 <div style={{ display:"flex", alignItems:"center", gap:10 }}>
 <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, fontWeight:600, color:"#22c55e" }}>
 <span style={{ width:20, height:20, borderRadius:"50%", background:"#22c55e", color:"#fff", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:12 }}></span>
 Title &amp; Outline
 </span>
 <span style={{ color:"#3f3f46", fontSize:16 }}>››</span>
 <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, fontWeight:600, color:"#818cf8" }}>
 <span style={{ width:20, height:20, borderRadius:"50%", background:"#6366f1", color:"#fff", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700 }}>2</span>
 Article &amp; SEO
 </span>
 </div>
 <button disabled style={{ padding:"6px 16px", borderRadius:8, background:"#3f3f46", color:"#71717a", fontWeight:700, fontSize:13, border:"none", display:"flex", alignItems:"center", gap:6, opacity:0.5 }}>↑ Export</button>
 </div>
 {/* Centered progress */}
 <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:"calc(100vh - 53px)", padding:40 }}>
 <div style={{ fontSize:24, fontWeight:700, color:"#fafafa", marginBottom:8 }}>Generating your article...</div>
 <div style={{ fontSize:14, color:"#a1a1aa", marginBottom:32 }}>{wfProgressLabel}</div>
 <div style={{ width:"100%", maxWidth:440 }}>
 <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#d4d4d8", marginBottom:8 }}>
 <span>{wfProgress}%</span>
 <span>{wfProgress < 95 ? `${Math.max(1, Math.round((95 - wfProgress) * 35 / 95))}s remaining` : "Almost done..."}</span>
 </div>
 <div style={{ height:8, borderRadius:99, background:"#27272a", overflow:"hidden" }}>
 <div style={{ height:"100%", borderRadius:99, background:"#6366f1", width:`${wfProgress}%`, transition:"width .3s ease" }}/>
 </div>
 </div>
 <div style={{ fontSize:13, color:"#71717a", marginTop:24, textAlign:"center", maxWidth:360, lineHeight:1.6 }}>You can safely leave this page. The article will continue generating in the background.</div>
 </div>
 </div>
 )}

 {/* ════════════════════════════
 WRITERESULT — Article & SEO
 ════════════════════════════ */}
 {section === "WriteResult" && wfResult && (
 <div style={{ margin:"0 -28px", minHeight:"100vh", background:"#09090b" }}>
 {/* Top bar */}
 <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 28px", borderBottom:"1px solid #3f3f46", background:"#09090b", position:"sticky", top:0, zIndex:10 }}>
 <button onClick={() => setSection("WriteFlow")} style={{ background:"none", border:"none", color:"#a1a1aa", cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", gap:6, padding:0 }}>
 <span style={{ fontSize:16 }}>‹</span> Back
 </button>
 <div style={{ display:"flex", alignItems:"center", gap:10 }}>
 <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, fontWeight:600, color:"#22c55e" }}>
 <span style={{ width:20, height:20, borderRadius:"50%", background:"#22c55e", color:"#fff", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:12 }}></span>
 Title &amp; Outline
 </span>
 <span style={{ color:"#3f3f46", fontSize:16 }}>››</span>
 <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, fontWeight:600, color:"#818cf8" }}>
 <span style={{ width:20, height:20, borderRadius:"50%", background:"#6366f1", color:"#fff", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700 }}>2</span>
 Article &amp; SEO
 </span>
 </div>
 {wfPublishOk
 ? <a href={wfPublishOk.articleUrl} target="_blank" rel="noreferrer" style={{ padding:"7px 16px", borderRadius:8, background:"#6366f1", color:"#fff", fontWeight:700, fontSize:13, border:"none", display:"flex", alignItems:"center", gap:6, textDecoration:"none" }}>↑ Open in Shopify</a>
 : <button onClick={wfSaveToShopify} disabled={wfPublishing} style={{ padding:"7px 16px", borderRadius:8, background: wfPublishing ? "#4f46e5" : "#6366f1", color:"#fff", fontWeight:700, fontSize:13, border:"none", cursor: wfPublishing ? "default" : "pointer", display:"flex", alignItems:"center", gap:6 }}>
 {wfPublishing ? <><span style={S.spinner}/> Saving...</> : <>↑ Export</>}
 </button>
 }
 </div>

 {/* Two-column body */}
 <div style={{ display:"grid", gridTemplateColumns:"1fr 278px", minHeight:"calc(100vh - 53px)", alignItems:"start" }}>

 {/* Left: article + floating toolbar */}
 <div style={{ position:"relative", borderRight:"1px solid #3f3f46" }}>
 {/* Floating toolbar */}
 <div style={{ position:"fixed", left:28, top:"50%", transform:"translateY(-50%)", display:"flex", flexDirection:"column", gap:8, zIndex:20 }}>
 <button title="Copy article" onClick={() => navigator.clipboard?.writeText(wfResult.fullArticle || wfResult.content || "")} style={{ width:36, height:36, borderRadius:8, background:"#18181b", border:"1px solid #3f3f46", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, color:"#d4d4d8" }}></button>
 <button title="Edit outline" onClick={() => { setSection("WriteFlow"); }} style={{ width:36, height:36, borderRadius:8, background:"#18181b", border:"1px solid #3f3f46", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, color:"#d4d4d8" }}></button>
 </div>

 {/* Article HTML — contentEditable for live editing */}
 <div style={{ maxWidth:740, margin:"0 auto", padding:"40px 48px 80px" }}>
 {wfPublishErr && <div style={{ fontSize:12, color:"#f87171", background:"#450a0a", border:"1px solid #7f1d1d", borderRadius:8, padding:"8px 14px", marginBottom:20 }}>{wfPublishErr}</div>}
 <div style={{ fontSize:11, color:"#52525b", marginBottom:10, userSelect:"none" }}>Click text to edit &nbsp;·&nbsp; Click any image to replace</div>
 <div
 ref={wfEditRef}
 className="wf-article-body"
 contentEditable={true}
 suppressContentEditableWarning={true}
 onBlur={handleWfEditBlur}
 onClick={handleWfArticleClick}
 style={{ fontFamily:"Georgia, 'Times New Roman', serif", fontSize:16, lineHeight:1.9, color:"#e4e4e7", outline:"none" }}
 />
 </div>

 {/* Article CSS */}
 <style>{`
 .wf-article-body h1 { font-size:28px; font-weight:700; color:#fafafa; margin:32px 0 12px; }
 .wf-article-body h2 { font-size:22px; font-weight:700; color:#fafafa; margin:36px 0 10px; padding-bottom:6px; border-bottom:1px solid #3f3f46; }
 .wf-article-body h3 { font-size:18px; font-weight:600; color:#d4d4d8; margin:24px 0 8px; }
 .wf-article-body p { margin:0 0 16px; }
 .wf-article-body ul,.wf-article-body ol { padding-left:24px; margin:0 0 16px; }
 .wf-article-body li { margin-bottom:6px; }
 .wf-article-body hr { border:none; border-top:1px solid #3f3f46; margin:32px 0; }
 .wf-article-body strong { font-weight:700; color:#fafafa; }
 .wf-article-body img { cursor:pointer; max-width:100%; border-radius:8px; transition:opacity .15s, outline .15s; }
 .wf-article-body img:hover { opacity:0.82; outline:3px solid #6366f1; outline-offset:3px; }
 .wf-article-body:focus { caret-color:#818cf8; }
 `}</style>
 </div>

 {/* Right sidebar */}
 <div style={{ padding:"20px 16px", display:"flex", flexDirection:"column", gap:0, background:"#09090b", position:"sticky", top:53, maxHeight:"calc(100vh - 53px)", overflowY:"auto" }}>

 {/* ── SEO Auto-Applied checklist ── */}
 {wfResult?.seoOptimizations?.length > 0 && (
 <div style={{ borderBottom:"1px solid #3f3f46", paddingBottom:16, marginBottom:16 }}>
 <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
 <span style={{ width:16, height:16, borderRadius:"50%", background:"#22c55e", color:"#fff", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:10, fontWeight:700 }}></span>
 <span style={{ fontSize:12, fontWeight:700, color:"#22c55e", textTransform:"uppercase", letterSpacing:".5px" }}>SEO Auto-Applied</span>
 </div>
 <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
 {wfResult.seoOptimizations.map((opt, i) => (
 <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:6, fontSize:11, color:"#a1a1aa" }}>
 <span style={{ color:"#22c55e", flexShrink:0, marginTop:1 }}></span>
 <span>{opt}</span>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* ── Meta description ── */}
 <div style={{ borderBottom:"1px solid #3f3f46", paddingBottom:16, marginBottom:16 }}>
 <div style={{ fontSize:12, fontWeight:700, color:"#a1a1aa", textTransform:"uppercase", letterSpacing:".5px", marginBottom:6 }}>Meta Description</div>
 <textarea
 value={wfMetaDesc}
 onChange={e => setWfMetaDesc(e.target.value)}
 rows={3}
 maxLength={165}
 placeholder="Write a 150-160 character meta description…"
 style={{ width:"100%", background:"#18181b", border:`1px solid ${wfMetaDesc.length > 160 ? "#f87171" : wfMetaDesc.length > 130 ? "#facc15" : "#3f3f46"}`, borderRadius:8, color:"#fafafa", fontSize:12, padding:"8px 10px", resize:"vertical", fontFamily:"inherit", lineHeight:1.5, outline:"none", boxSizing:"border-box" }}
 />
 <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
 <span style={{ fontSize:11, color: wfMetaDesc.length > 160 ? "#f87171" : wfMetaDesc.length > 130 ? "#facc15" : "#52525b" }}>{wfMetaDesc.length}/160</span>
 {!wfMetaDesc && <span style={{ fontSize:11, color:"#f87171", fontWeight:600 }}>Required for SEO</span>}
 </div>
 </div>

 {/* ── OG Tags panel ── */}
 {wfOgTags && (
 <div style={{ borderBottom:"1px solid #3f3f46", paddingBottom:16, marginBottom:16 }}>
 <div style={{ fontSize:12, fontWeight:700, color:"#a1a1aa", textTransform:"uppercase", letterSpacing:".5px", marginBottom:6, display:"flex", alignItems:"center", gap:6 }}>
 <span style={{ color:"#22c55e" }}></span> Open Graph Tags
 </div>
 <div style={{ background:"#18181b", border:"1px solid #3f3f46", borderRadius:8, padding:"10px 12px", fontSize:12 }}>
 <div style={{ marginBottom:6 }}>
 <span style={{ color:"#71717a", fontWeight:600, fontSize:11 }}>OG Title</span>
 <div style={{ color:"#e4e4e7", marginTop:2, wordBreak:"break-word" }}>{wfOgTags.title}</div>
 </div>
 <div>
 <span style={{ color:"#71717a", fontWeight:600, fontSize:11 }}>OG Description</span>
 <div style={{ color:"#e4e4e7", marginTop:2, wordBreak:"break-word" }}>{wfOgTags.description}</div>
 </div>
 </div>
 <div style={{ fontSize:10, color:"#52525b", marginTop:5 }}>Will be saved as Shopify metafields on publish.</div>
 </div>
 )}

 {/* ── Twitter / X Card tags panel ── */}
 {wfTwitterTags && (
 <div style={{ borderBottom:"1px solid #3f3f46", paddingBottom:16, marginBottom:16 }}>
 <div style={{ fontSize:12, fontWeight:700, color:"#a1a1aa", textTransform:"uppercase", letterSpacing:".5px", marginBottom:6, display:"flex", alignItems:"center", gap:6 }}>
 <span style={{ color:"#22c55e" }}></span> Twitter / X Card Tags
 </div>
 <div style={{ background:"#18181b", border:"1px solid #3f3f46", borderRadius:8, padding:"10px 12px", fontSize:12 }}>
 <div style={{ marginBottom:6 }}>
 <span style={{ color:"#71717a", fontWeight:600, fontSize:11 }}>Twitter Title</span>
 <div style={{ color:"#e4e4e7", marginTop:2, wordBreak:"break-word" }}>{wfTwitterTags.title}</div>
 </div>
 <div>
 <span style={{ color:"#71717a", fontWeight:600, fontSize:11 }}>Twitter Description</span>
 <div style={{ color:"#e4e4e7", marginTop:2, wordBreak:"break-word" }}>{wfTwitterTags.description}</div>
 </div>
 </div>
 <div style={{ fontSize:10, color:"#52525b", marginTop:5 }}>Will be saved as Shopify metafields on publish.</div>
 </div>
 )}

 {/* ── SEO Score panel ── */}
 <div style={{ borderBottom:"1px solid #3f3f46", paddingBottom:16, marginBottom:16 }}>
 <div onClick={() => setWfSeoOpen(o => !o)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", marginBottom: wfSeoOpen ? 12 : 0 }}>
 <div style={{ display:"flex", alignItems:"center", gap:7 }}>
 <span style={{ width:7, height:7, borderRadius:"50%", background:"#6366f1", display:"inline-block" }}/>
 <span style={{ fontSize:13, fontWeight:700, color:"#fafafa" }}>SEO Score</span>
 {wfSeoScore && <span style={{ fontSize:12, fontWeight:800, color: wfSeoScore.overall >= 80 ? "#4ade80" : wfSeoScore.overall >= 60 ? "#facc15" : "#f87171", marginLeft:4 }}>{wfSeoScore.overall}/100</span>}
 {wfSeoLoading && <span style={{ fontSize:11, color:"#71717a" }}>Analysing...</span>}
 </div>
 <span style={{ color:"#71717a", fontSize:12 }}>{wfSeoOpen ? "" : ""}</span>
 </div>

 {wfSeoOpen && wfSeoScore && (
 <>
 {/* Score gauge */}
 <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
 <div style={{ position:"relative", width:56, height:56, flexShrink:0 }}>
 <svg width="56" height="56" viewBox="0 0 56 56">
 <circle cx="28" cy="28" r="22" fill="none" stroke="#27272a" strokeWidth="6"/>
 <circle cx="28" cy="28" r="22" fill="none"
 stroke={wfSeoScore.overall >= 80 ? "#4ade80" : wfSeoScore.overall >= 60 ? "#facc15" : "#f87171"}
 strokeWidth="6" strokeLinecap="round"
 strokeDasharray={`${2 * Math.PI * 22}`}
 strokeDashoffset={`${2 * Math.PI * 22 * (1 - wfSeoScore.overall / 100)}`}
 transform="rotate(-90 28 28)"
 />
 </svg>
 <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, color:"#fafafa" }}>{wfSeoScore.overall}</div>
 </div>
 <div style={{ flex:1 }}>
 {Object.entries(wfSeoScore.cats||{}).filter(([,v])=>v!==null).map(([k,v]) => (
 <div key={k} style={{ marginBottom:5 }}>
 <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#a1a1aa", marginBottom:2 }}>
 <span style={{ textTransform:"capitalize" }}>{k}</span>
 <span style={{ color: v >= 80 ? "#4ade80" : v >= 60 ? "#facc15" : "#f87171", fontWeight:600 }}>{v}</span>
 </div>
 <div style={{ height:4, borderRadius:99, background:"#27272a", overflow:"hidden" }}>
 <div style={{ height:"100%", borderRadius:99, background: v >= 80 ? "#4ade80" : v >= 60 ? "#facc15" : "#f87171", width:`${v}%`, transition:"width .5s ease" }}/>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Stats row */}
 <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
 {[
 ["Words", wfSeoScore.wordCount],
 ["Readability", `${wfSeoScore.readabilityScore}/100`],
 ["KW Density", `${wfSeoScore.kwDensity}%`],
 ["H2s", wfSeoScore.h2Count],
 ].map(([l,v]) => (
 <div key={l} style={{ background:"#18181b", border:"1px solid #3f3f46", borderRadius:7, padding:"5px 9px", textAlign:"center", flex:1, minWidth:50 }}>
 <div style={{ fontSize:13, fontWeight:700, color:"#fafafa" }}>{v}</div>
 <div style={{ fontSize:10, color:"#71717a" }}>{l}</div>
 </div>
 ))}
 </div>

 {/* Issues */}
 {(wfSeoScore.issues||[]).length > 0 && (
 <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
 {(wfSeoScore.issues||[]).slice(0,12).map((issue, i) => {
 const fixing = wfIsFixing[i];
 // Map each issue to an AI fix action
 const msg = issue.msg || "";
 let fixBtn = null;
 if (fixing === 'loading') {
 fixBtn = <span style={{ marginTop:5, display:"inline-flex", alignItems:"center", gap:4, fontSize:10, color:"#818cf8" }}><span style={S.spinner}/>Fixing…</span>;
 } else if (fixing === 'err') {
 fixBtn = <span style={{ marginTop:5, display:"inline-block", fontSize:10, color:"#f87171" }}>Fix failed — try again</span>;
 } else if (issue.fix === 'readability_fix' || /readability|simplify|grade level/i.test(msg)) {
 fixBtn = <button onClick={() => wfContentFix('readability', i)} style={{ marginTop:5, fontSize:10, color:"#818cf8", background:"none", border:"1px solid #4338ca", borderRadius:5, padding:"3px 8px", cursor:"pointer" }}>AI Fix Readability &middot; {ACTION_COSTS['email-gen']} cr</button>;
 } else if (issue.fix === 'faq_fix' || /faq|frequently asked/i.test(msg)) {
 fixBtn = <button onClick={() => wfContentFix('faq', i)} style={{ marginTop:5, fontSize:10, color:"#818cf8", background:"none", border:"1px solid #4338ca", borderRadius:5, padding:"3px 8px", cursor:"pointer" }}>Add FAQs &middot; {ACTION_COSTS['email-gen']} cr</button>;
 } else if (/only.*words|words.*thin|expand|too short/i.test(msg)) {
 fixBtn = <button onClick={() => wfContentFix('expand', i, { targetWords: 500 })} style={{ marginTop:5, fontSize:10, color:"#818cf8", background:"none", border:"1px solid #4338ca", borderRadius:5, padding:"3px 8px", cursor:"pointer" }}>Expand Article &middot; {ACTION_COSTS['email-gen']} cr</button>;
 } else if (/no h1|missing h1/i.test(msg)) {
 fixBtn = <button onClick={() => wfContentFix('add_h1', i)} style={{ marginTop:5, fontSize:10, color:"#818cf8", background:"none", border:"1px solid #4338ca", borderRadius:5, padding:"3px 8px", cursor:"pointer" }}>Add H1 &middot; {ACTION_COSTS['email-gen']} cr</button>;
 } else if (/h2 heading|only.*h2/i.test(msg)) {
 fixBtn = <button onClick={() => wfContentFix('add_h2s', i)} style={{ marginTop:5, fontSize:10, color:"#818cf8", background:"none", border:"1px solid #4338ca", borderRadius:5, padding:"3px 8px", cursor:"pointer" }}>Add Sections &middot; {ACTION_COSTS['email-gen']} cr</button>;
 } else if (/keyword.*density.*low|density.*0\./i.test(msg)) {
 fixBtn = <button onClick={() => wfContentFix('keyword_boost', i)} style={{ marginTop:5, fontSize:10, color:"#818cf8", background:"none", border:"1px solid #4338ca", borderRadius:5, padding:"3px 8px", cursor:"pointer" }}>Boost Keywords &middot; {ACTION_COSTS['email-gen']} cr</button>;
 } else if (/no.*citation|authoritative|outbound|sources/i.test(msg)) {
 fixBtn = <button onClick={() => wfContentFix('citations', i)} style={{ marginTop:5, fontSize:10, color:"#818cf8", background:"none", border:"1px solid #4338ca", borderRadius:5, padding:"3px 8px", cursor:"pointer" }}>Add Citations &middot; {ACTION_COSTS['email-gen']} cr</button>;
 } else if (/first.person|expertise signal|e-e-a-t/i.test(msg)) {
 fixBtn = <button onClick={() => wfContentFix('eeat', i)} style={{ marginTop:5, fontSize:10, color:"#818cf8", background:"none", border:"1px solid #4338ca", borderRadius:5, padding:"3px 8px", cursor:"pointer" }}>Add Expertise Signal &middot; {ACTION_COSTS['email-gen']} cr</button>;
 } else if (/author byline|no author/i.test(msg)) {
 fixBtn = <button onClick={() => wfContentFix('author_byline', i)} style={{ marginTop:5, fontSize:10, color:"#818cf8", background:"none", border:"1px solid #4338ca", borderRadius:5, padding:"3px 8px", cursor:"pointer" }}>Add Author Byline &middot; {ACTION_COSTS['email-gen']} cr</button>;
 } else if (/internal links|only.*internal/i.test(msg)) {
 fixBtn = <button onClick={() => wfContentFix('internal_links', i)} style={{ marginTop:5, fontSize:10, color:"#818cf8", background:"none", border:"1px solid #4338ca", borderRadius:5, padding:"3px 8px", cursor:"pointer" }}>Add Internal Links &middot; {ACTION_COSTS['email-gen']} cr</button>;
 } else if (/open graph|og tags|social sharing/i.test(msg)) {
 fixBtn = <button onClick={() => wfContentFix('og_fix', i)} style={{ marginTop:5, fontSize:10, color:"#818cf8", background:"none", border:"1px solid #4338ca", borderRadius:5, padding:"3px 8px", cursor:"pointer" }}>Generate OG Tags &middot; {ACTION_COSTS['seo-analysis']} cr</button>;
 } else if (/json-ld|schema|rich results/i.test(msg)) {
 fixBtn = <span style={{ marginTop:5, display:"inline-block", fontSize:10, color:"#22c55e" }}>Schema will be applied on publish</span>;
 } else if (/no meta description|meta description/i.test(msg)) {
 fixBtn = <span style={{ marginTop:5, display:"inline-block", fontSize:10, color:"#facc15" }}>↑ Edit in Meta Description field above</span>;
 } else if (/keyword.*not in title|title.*keyword/i.test(msg)) {
 fixBtn = <span style={{ marginTop:5, display:"inline-block", fontSize:10, color:"#facc15" }}>↑ Edit the title in the outline step</span>;
 } else if (/no images/i.test(msg)) {
 fixBtn = <button onClick={() => setWfCoverModalOpen(true)} style={{ marginTop:5, fontSize:10, color:"#818cf8", background:"none", border:"1px solid #4338ca", borderRadius:5, padding:"3px 8px", cursor:"pointer" }}>Add Cover Image</button>;
 }
 return (
 <div key={i} style={{ background:"#18181b", border:`1px solid ${issue.sev==='high'?'#7f1d1d':issue.sev==='medium'?'#78350f':'#3f3f46'}`, borderRadius:8, padding:"8px 10px" }}>
 <div style={{ display:"flex", alignItems:"flex-start", gap:6 }}>
 <span style={{ fontSize:13, marginTop:1, flexShrink:0 }}>{issue.sev==='high'?'':issue.sev==='medium'?'':''}</span>
 <div style={{ flex:1 }}>
 <div style={{ fontSize:11, color:"#d4d4d8", lineHeight:1.4 }}>{msg}</div>
 {fixBtn}
 </div>
 </div>
 </div>
 );
 })}
 {(wfSeoScore.issues||[]).length > 12 && (
 <div style={{ fontSize:11, color:"#71717a", textAlign:"center" }}>+{wfSeoScore.issues.length - 12} more — fix the above first</div>
 )}
 </div>
 )}
 {(wfSeoScore.issues||[]).length === 0 && (
 <div style={{ fontSize:12, color:"#4ade80", textAlign:"center", padding:"8px 0" }}>No issues found — great article!</div>
 )}

 {/* Rescan */}
 <button
 onClick={() => wfRunSeoScore(wfResult, wfKeywords, wfPickedTitle, wfMetaDesc)}
 disabled={wfSeoLoading}
 style={{ width:"100%", marginTop:10, padding:"6px 0", borderRadius:7, background:"#27272a", color:"#a1a1aa", fontWeight:600, fontSize:11, border:"1px solid #3f3f46", cursor: wfSeoLoading ? "default" : "pointer" }}
 >{wfSeoLoading ? "Rescanning..." : `↺ Rescan SEO · ${ACTION_COSTS['seo-analysis']} cr`}</button>
 </>
 )}

 {wfSeoOpen && wfSeoLoading && !wfSeoScore && (
 <div style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 0" }}>
 <span style={S.spinner}/>
 <span style={{ fontSize:12, color:"#71717a" }}>Analysing article SEO...</span>
 </div>
 )}
 </div>

 {/* Cover Image */}
 <div style={{ marginBottom:16 }}>
 <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
 <div style={{ display:"flex", alignItems:"center", gap:6 }}>
 <span style={{ width:7, height:7, borderRadius:"50%", background:"#6366f1", display:"inline-block" }}/>
 <span style={{ fontSize:13, fontWeight:600, color:"#fafafa" }}>Cover Image</span>
 </div>
 {wfCoverImg && (
 <div style={{ display:"flex", gap:6 }}>
 <button onClick={() => { setWfCoverAiPreview(null); setWfUnsplashSel(null); setWfUploadPreview(null); setWfCoverAltDraft(wfCoverImg.alt||""); setWfCoverModalOpen(true); }} style={{ fontSize:11, color:"#a1a1aa", background:"#27272a", border:"1px solid #3f3f46", borderRadius:5, padding:"2px 8px", cursor:"pointer" }}>Edit</button>
 <button onClick={() => setWfCoverImg(null)} style={{ fontSize:11, color:"#f87171", background:"#27272a", border:"1px solid #7f1d1d", borderRadius:5, padding:"2px 8px", cursor:"pointer" }}>Delete</button>
 </div>
 )}
 </div>
 {wfCoverImg ? (
 <img src={wfCoverImg.url} alt={wfCoverImg.alt||wfPickedTitle} style={{ width:"100%", borderRadius:10, border:"1px solid #3f3f46", objectFit:"cover", aspectRatio:"16/9", display:"block" }} />
 ) : wfCoverGenerating ? (
 <div style={{ width:"100%", aspectRatio:"16/9", background:"#18181b", border:"1px solid #3f3f46", borderRadius:10, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10 }}>
 <span style={S.spinner}/>
 <span style={{ fontSize:12, color:"#71717a" }}>Generating cover image with AI...</span>
 </div>
 ) : (
 <>
 {wfCoverErr && (
 <div style={{ background:"#27272a", border:"1px solid #7f1d1d", borderRadius:8, padding:"10px 12px", marginBottom:10, fontSize:12, color:"#f87171", lineHeight:1.5 }}>
 <strong>Cover image failed:</strong> {wfCoverErr}<br/>
 <span style={{ color:"#a1a1aa" }}>Add one manually below (Unsplash or upload).</span>
 </div>
 )}
 <button
 onClick={() => {
 setWfCoverTab('ai');
 setWfCoverAiPrompt(`Create a professional cover image for a blog post titled "${wfPickedTitle}". Make it visually compelling and relevant to: ${(wfKeywords||[]).join(', ')||wfPickedTitle}. No text overlays. Clean modern aesthetic.`);
 setWfCoverAltDraft(`Cover image for "${wfPickedTitle}"`);
 setWfCoverAiPreview(null); setWfUnsplashSel(null); setWfUploadPreview(null);
 setWfUnsplashQuery((wfKeywords||[])[0]||wfPickedTitle);
 setWfCoverModalOpen(true);
 }}
 style={{ width:"100%", aspectRatio:"16/9", background:"#18181b", border:"2px dashed #3f3f46", borderRadius:10, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, cursor:"pointer", fontSize:12, color:"#71717a" }}
 >
 <span style={{ fontSize:28 }}></span>
 <span style={{ fontWeight:600 }}>Add Cover Image</span>
 <span style={{ fontSize:11, color:"#52525b" }}>AI Generate · Unsplash · Upload</span>
 </button>
 </>
 )}
 {wfCoverImg && (
 <div style={{ background:"#27272a", color:"#a1a1aa", borderRadius:6, padding:"6px 10px", marginTop:8, fontSize:11, lineHeight:1.4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>ALT {wfCoverImg.alt||wfPickedTitle}</div>
 )}
 </div>

 {/* Meta Description */}
 <div style={{ borderTop:"1px solid #3f3f46", paddingTop:14, marginBottom:14 }}>
 <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
 <div style={{ display:"flex", alignItems:"center", gap:6 }}>
 <span style={{ width:7, height:7, borderRadius:"50%", background:"#6366f1", display:"inline-block" }}/>
 <span style={{ fontSize:13, fontWeight:600, color:"#fafafa" }}>Meta Description</span>
 </div>
 <div style={{ display:"flex", gap:6 }}>
 <button onClick={() => apiFetchJSON(`${API}/ai/rewrite`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ field:"metaDescription", title: wfPickedTitle, keywords: wfKeywords.join(",") }) }).then(r => { if(r.ok && r.rewritten) setWfMetaDesc(r.rewritten); })} style={{ background:"none", border:"none", cursor:"pointer", color:"#71717a", fontSize:14, padding:"2px 4px" }} title="Regenerate">↺</button>
 <button onClick={() => setWfMetaDesc("")} style={{ background:"none", border:"none", cursor:"pointer", color:"#71717a", fontSize:14, padding:"2px 4px" }} title="Clear"></button>
 </div>
 </div>
 <textarea
 value={wfMetaDesc}
 onChange={e => setWfMetaDesc(e.target.value)}
 style={{ width:"100%", minHeight:100, fontSize:13, lineHeight:1.6, color:"#d4d4d8", background:"#18181b", border:"1px solid #3f3f46", borderRadius:8, padding:"10px 12px", resize:"vertical", fontFamily:"inherit", outline:"none", boxSizing:"border-box" }}
 placeholder="Enter meta description..."
 />
 <div style={{ fontSize:11, color: (wfMetaDesc||wfResult.metaDescription||'').length > 160 ? "#f87171" : "#71717a", marginTop:4 }}>{(wfMetaDesc||wfResult.metaDescription||'').length}/160 chars</div>
 </div>

 {/* Article Schema */}
 <div style={{ borderTop:"1px solid #3f3f46", paddingTop:14, marginBottom:14 }}>
 <div onClick={() => setWfSchemaOpen(!wfSchemaOpen)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer" }}>
 <div style={{ display:"flex", alignItems:"center", gap:6 }}>
 <span style={{ width:7, height:7, borderRadius:"50%", background:"#6366f1", display:"inline-block" }}/>
 <span style={{ fontSize:13, fontWeight:600, color:"#fafafa" }}>Article Schema</span>
 <span style={{ fontSize:11, color:"#71717a", marginLeft:4 }}>?</span>
 </div>
 <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:14, color:"#71717a" }}></button>
 </div>
 {wfSchemaOpen && (
 <div style={{ marginTop:10, background:"#18181b", border:"1px solid #3f3f46", borderRadius:8, padding:"10px 12px", fontSize:11, color:"#a1a1aa", fontFamily:"monospace", whiteSpace:"pre-wrap", overflow:"auto", maxHeight:200 }}>{JSON.stringify({ "@context":"https://schema.org", "@type":"Article", headline: wfPickedTitle, description: wfMetaDesc||wfResult.metaDescription, keywords: wfKeywords.join(", "), articleBody: (wfResult.fullArticle||wfResult.content||"").replace(/<[^>]+>/g,"").slice(0,200)+"..." }, null, 2)}</div>
 )}
 </div>

 {/* FAQ Schema */}
 {(wfResult.faqItems||[]).length > 0 && (
 <div style={{ borderTop:"1px solid #3f3f46", paddingTop:14 }}>
 <div onClick={() => setWfFaqSchemaOpen(!wfFaqSchemaOpen)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer" }}>
 <div style={{ display:"flex", alignItems:"center", gap:6 }}>
 <span style={{ width:7, height:7, borderRadius:"50%", background:"#6366f1", display:"inline-block" }}/>
 <span style={{ fontSize:13, fontWeight:600, color:"#fafafa" }}>FAQ Schema</span>
 <span style={{ fontSize:11, color:"#71717a", marginLeft:4 }}>?</span>
 </div>
 <button style={{ background:"none", border:"none", cursor:"pointer", fontSize:14, color:"#71717a" }}></button>
 </div>
 {wfFaqSchemaOpen && (
 <div style={{ marginTop:10, background:"#18181b", border:"1px solid #3f3f46", borderRadius:8, padding:"10px 12px", fontSize:11, color:"#a1a1aa", fontFamily:"monospace", whiteSpace:"pre-wrap", overflow:"auto", maxHeight:200 }}>{JSON.stringify({ "@context":"https://schema.org", "@type":"FAQPage", mainEntity:(wfResult.faqItems||[]).map(f=>({"@type":"Question",name:f.q,acceptedAnswer:{"@type":"Answer",text:f.a}})) }, null, 2)}</div>
 )}
 </div>
 )}

 {/* Publish to Shopify */}
 <div style={{ borderTop:"1px solid #3f3f46", paddingTop:16, marginTop:16 }}>
 {wfPublishOk ? (
 <div style={{ background:"#052e16", border:"1px solid #16a34a", borderRadius:10, padding:"12px 14px" }}>
 <div style={{ fontSize:13, fontWeight:600, color:"#86efac", marginBottom:6 }}>
 {wfPublishOk.published ? "Published to Shopify!" : "Saved as draft in Shopify!"}
 </div>
 <a href={wfPublishOk.articleUrl} target="_blank" rel="noreferrer" style={{ fontSize:12, color:"#4ade80", fontWeight:600, textDecoration:"none", display:"inline-flex", alignItems:"center", gap:4 }}>Open in Shopify →</a>
 <button onClick={() => setWfPublishOk(null)} style={{ display:"block", marginTop:8, fontSize:11, color:"#71717a", background:"none", border:"none", cursor:"pointer", padding:0 }}>Publish again</button>
 </div>
 ) : (
 <>
 {wfPublishErr && <div style={{ fontSize:12, color:"#f87171", background:"#450a0a", border:"1px solid #7f1d1d", borderRadius:8, padding:"8px 12px", marginBottom:10 }}>{wfPublishErr}</div>}
 <button
 onClick={() => wfSaveToShopify(false)}
 disabled={wfPublishing}
 style={{ width:"100%", padding:"11px 0", borderRadius:9, background: wfPublishing ? "#4f46e5" : "#6366f1", color:"#fff", fontWeight:700, fontSize:13, border:"none", cursor: wfPublishing ? "default" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7, marginBottom:8 }}
 >
 {wfPublishing ? <><span style={S.spinner}/> Publishing...</> : <>Publish to Shopify</>}
 </button>
 <button
 onClick={() => wfSaveToShopify(true)}
 disabled={wfPublishing}
 style={{ width:"100%", padding:"9px 0", borderRadius:9, background:"#27272a", color:"#d4d4d8", fontWeight:600, fontSize:12, border:"1px solid #3f3f46", cursor: wfPublishing ? "default" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}
 >
 Save as Draft
 </button>
 </>
 )}
 </div>

 </div>
 </div>

 {/* ── Cover Image Modal ── */}
 {/* ── Inline image picker modal ── */}
 {wfImgPicker && (
 <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }} onClick={e => { if (e.target === e.currentTarget) { setWfImgPicker(null); setWfImgPickerResults([]); } }}>
 <div style={{ background:"#18181b", border:"1px solid #3f3f46", borderRadius:16, padding:"28px 28px 24px", width:"100%", maxWidth:680, maxHeight:"80vh", display:"flex", flexDirection:"column", gap:0 }}>
 <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
 <div style={{ fontWeight:700, fontSize:15, color:"#fafafa" }}>Replace Image</div>
 <button onClick={() => { setWfImgPicker(null); setWfImgPickerResults([]); }} style={{ background:"none", border:"none", color:"#71717a", cursor:"pointer", fontSize:18 }}>×</button>
 </div>
 {/* Current image preview */}
 <div style={{ marginBottom:14, display:"flex", alignItems:"center", gap:12 }}>
 <img src={wfImgPicker.oldSrc} alt="current" style={{ width:80, height:56, objectFit:"cover", borderRadius:6, border:"1px solid #3f3f46" }} />
 <span style={{ fontSize:12, color:"#71717a" }}>Currently selected. Search below to swap it out.</span>
 </div>
 {/* Search bar */}
 <div style={{ display:"flex", gap:8, marginBottom:16 }}>
 <input
 value={wfImgPickerQuery}
 onChange={e => setWfImgPickerQuery(e.target.value)}
 onKeyDown={async e => {
 if (e.key !== 'Enter' || !wfImgPickerQuery.trim()) return;
 setWfImgPickerLoading(true); setWfImgPickerResults([]); setWfImgPickerPage(1);
 try {
 const r = await apiFetchJSON(`${API}/ai/unsplash-search?query=${encodeURIComponent(wfImgPickerQuery)}&per_page=30&page=1`);
 if (r.ok) { setWfImgPickerResults(r.photos || []); setWfImgPickerTotal(r.total || 0); }
 } catch(_) {}
 setWfImgPickerLoading(false);
 }}
 placeholder="Search Unsplash e.g. snowboard mountain..."
 style={{ flex:1, background:"#09090b", border:"1px solid #3f3f46", borderRadius:8, color:"#fafafa", fontSize:13, padding:"8px 12px", outline:"none" }}
 />
 <button
 onClick={async () => {
 if (!wfImgPickerQuery.trim()) return;
 setWfImgPickerLoading(true); setWfImgPickerResults([]); setWfImgPickerPage(1);
 try {
 const r = await apiFetchJSON(`${API}/ai/unsplash-search?query=${encodeURIComponent(wfImgPickerQuery)}&per_page=30&page=1`);
 if (r.ok) { setWfImgPickerResults(r.photos || []); setWfImgPickerTotal(r.total || 0); }
 } catch(_) {}
 setWfImgPickerLoading(false);
 }}
 disabled={wfImgPickerLoading}
 style={{ padding:"8px 16px", borderRadius:8, background:"#6366f1", color:"#fff", fontWeight:700, fontSize:13, border:"none", cursor: wfImgPickerLoading ? "default" : "pointer" }}
 >{wfImgPickerLoading ? "..." : "Search"}</button>
 </div>
 {/* Results grid */}
 <div style={{ overflowY:"auto", flex:1 }}>
 {wfImgPickerResults.length > 0 ? (
 <>
 <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
 {wfImgPickerResults.map((photo, idx) => (
 <div key={idx} onClick={() => replaceArticleImage(photo.full || photo.thumb, { photographer: photo.author })} style={{ cursor:"pointer", borderRadius:8, overflow:"hidden", border:"2px solid transparent", transition:"border .15s" }} onMouseEnter={e => e.currentTarget.style.border="2px solid #6366f1"} onMouseLeave={e => e.currentTarget.style.border="2px solid transparent"}>
 <img src={photo.thumb} alt={photo.alt || 'photo'} style={{ width:"100%", height:110, objectFit:"cover", display:"block" }} />
 <div style={{ fontSize:10, color:"#71717a", padding:"4px 6px", background:"#09090b", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{photo.author}</div>
 </div>
 ))}
 </div>
 {wfImgPickerResults.length < wfImgPickerTotal && (
 <div style={{ textAlign:"center", marginTop:14 }}>
 <button
 onClick={async () => {
 const nextPage = wfImgPickerPage + 1;
 setWfImgPickerLoading(true);
 try {
 const r = await apiFetchJSON(`${API}/ai/unsplash-search?query=${encodeURIComponent(wfImgPickerQuery)}&per_page=30&page=${nextPage}`);
 if (r.ok) { setWfImgPickerResults(prev => [...prev, ...(r.photos || [])]); setWfImgPickerPage(nextPage); setWfImgPickerTotal(r.total || 0); }
 } catch(_) {}
 setWfImgPickerLoading(false);
 }}
 disabled={wfImgPickerLoading}
 style={{ padding:"8px 24px", borderRadius:8, background:"#27272a", color:"#a1a1aa", fontWeight:600, fontSize:13, border:"1px solid #3f3f46", cursor: wfImgPickerLoading ? "default" : "pointer" }}
 >{wfImgPickerLoading ? "Loading…" : `Load more (${wfImgPickerResults.length} / ${wfImgPickerTotal})`}</button>
 </div>
 )}
 </>
 ) : wfImgPickerLoading ? (
 <div style={{ textAlign:"center", color:"#71717a", fontSize:13, paddingTop:24 }}>Searching Unsplash…</div>
 ) : (
 <div style={{ textAlign:"center", color:"#52525b", fontSize:13, paddingTop:24 }}>Enter a search term and press Search</div>
 )}
 </div>
 </div>
 </div>
 )}

 {wfCoverModalOpen && (
 <div style={{ position:"fixed", inset:0, zIndex:2000, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
 <div style={{ background:"#18181b", border:"1px solid #3f3f46", borderRadius:16, width:"100%", maxWidth:860, maxHeight:"92vh", overflow:"auto", display:"flex", flexDirection:"column" }}>

 {/* Modal header */}
 <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 24px", borderBottom:"1px solid #3f3f46", flexShrink:0 }}>
 <div>
 <div style={{ fontSize:18, fontWeight:700, color:"#fafafa" }}>Select an Image</div>
 <div style={{ fontSize:13, color:"#71717a", marginTop:3 }}>Choose from Unsplash photos, generate with AI, or upload your own image</div>
 </div>
 <button onClick={() => setWfCoverModalOpen(false)} style={{ background:"none", border:"none", cursor:"pointer", color:"#71717a", fontSize:22, lineHeight:1, padding:4 }}></button>
 </div>

 {/* Tabs */}
 <div style={{ display:"flex", padding:"0 24px", borderBottom:"1px solid #3f3f46", flexShrink:0 }}>
 {[['unsplash','Unsplash'],['ai','AI Image'],['upload','Upload']].map(([val,label]) => (
 <button key={val} onClick={() => setWfCoverTab(val)} style={{ padding:"12px 18px", background:"none", border:"none", borderBottom: wfCoverTab===val ? "2px solid #6366f1" : "2px solid transparent", cursor:"pointer", fontWeight:600, fontSize:13, color: wfCoverTab===val ? "#fafafa" : "#71717a" }}>{label}</button>
 ))}
 </div>

 {/* Tab body */}
 <div style={{ display:"flex", gap:24, padding:24, flex:1 }}>

 {/* Left: image preview */}
 <div style={{ flexShrink:0, width:300, display:"flex", flexDirection:"column", gap:10 }}>
 <div style={{ background:"#09090b", border:"1px solid #3f3f46", borderRadius:10, overflow:"hidden", aspectRatio:"1/1", display:"flex", alignItems:"center", justifyContent:"center" }}>
 {(() => {
 const preview = wfCoverTab==='ai' ? wfCoverAiPreview : wfCoverTab==='unsplash' ? wfUnsplashSel?.full : wfUploadPreview;
 return preview
 ? <img src={preview} alt="preview" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
 : <div style={{ textAlign:"center", color:"#52525b" }}><div style={{ fontSize:40 }}></div><div style={{ fontSize:12, marginTop:8 }}>No image selected{wfCoverTab==="unsplash" ? "\nChoose from the results" : ""}</div></div>;
 })()}
 </div>
 </div>

 {/* Right: controls */}
 <div style={{ flex:1, display:"flex", flexDirection:"column", gap:14 }}>

 {/* ── AI Image ── */}
 {wfCoverTab === 'ai' && (
 <>
 <div>
 <div style={{ fontSize:16, fontWeight:700, color:"#fafafa", marginBottom:3 }}>AI Generated Image</div>
 <div style={{ fontSize:12, color:"#71717a" }}>Create unique images with AI</div>
 </div>
 <textarea
 value={wfCoverAiPrompt}
 onChange={e => setWfCoverAiPrompt(e.target.value)}
 style={{ width:"100%", minHeight:110, fontSize:13, color:"#d4d4d8", background:"#09090b", border:"1px solid #3f3f46", borderRadius:8, padding:"10px 12px", resize:"vertical", fontFamily:"inherit", outline:"none", boxSizing:"border-box", lineHeight:1.5 }}
 placeholder="Describe the image you want to generate..."
 />
 <div style={{ display:"flex", gap:10, alignItems:"center" }}>
 <select value={wfCoverAiRatio} onChange={e => setWfCoverAiRatio(e.target.value)} style={{ padding:"9px 12px", background:"#09090b", border:"1px solid #3f3f46", borderRadius:8, color:"#fafafa", fontSize:13, cursor:"pointer", flexShrink:0 }}>
 <option value="1:1">1:1</option>
 <option value="16:9">16:9</option>
 </select>
 <button
 onClick={async () => {
 setWfCoverAiLoading(true);
 try {
 const r = await apiFetchJSON(`${API}/ai/generate-cover-image`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ title: wfPickedTitle, prompt: wfCoverAiPrompt, ratio: wfCoverAiRatio }) });
 if (r.ok) { setWfCoverAiPreview(r.imageUrl); if (!wfCoverAltDraft) setWfCoverAltDraft(`Cover image for "${wfPickedTitle}"`);
 }
 } catch(_) {}
 setWfCoverAiLoading(false);
 }}
 disabled={wfCoverAiLoading}
 style={{ flex:1, padding:"9px 18px", background: wfCoverAiLoading ? "#3f3f46" : "#6366f1", color:"#fff", border:"none", borderRadius:8, fontWeight:700, fontSize:13, cursor: wfCoverAiLoading ? "default" : "pointer" }}
 >{wfCoverAiLoading ? <><span style={S.spinner}/> Generating...</> : "Regenerate"}</button>
 </div>
 </>
 )}

 {/* ── Unsplash ── */}
 {wfCoverTab === 'unsplash' && (
 <>
 <div>
 <div style={{ fontSize:16, fontWeight:700, color:"#fafafa", marginBottom:3 }}>Unsplash Photos</div>
 <div style={{ fontSize:12, color:"#71717a" }}>Free high-quality stock photos</div>
 </div>
 <div style={{ display:"flex", gap:8 }}>
 <input
 value={wfUnsplashQuery}
 onChange={e => setWfUnsplashQuery(e.target.value)}
 onKeyDown={e => { if (e.key === 'Enter') e.target.nextSibling?.click(); }}
 style={{ flex:1, padding:"9px 12px", background:"#09090b", border:"1px solid #3f3f46", borderRadius:8, color:"#fafafa", fontSize:13, outline:"none" }}
 placeholder="Search photos..."
 />
 <button
 onClick={async () => {
 if (!wfUnsplashQuery.trim()) return;
 setWfUnsplashLoading(true); setWfUnsplashResults([]);
 try {
 const r = await apiFetchJSON(`${API}/ai/unsplash-search?query=${encodeURIComponent(wfUnsplashQuery)}&per_page=30`);
 if (r.ok) setWfUnsplashResults(r.photos || []);
 } catch(_) {}
 setWfUnsplashLoading(false);
 }}
 disabled={wfUnsplashLoading}
 style={{ padding:"9px 18px", background:"#6366f1", color:"#fff", border:"none", borderRadius:8, fontWeight:700, fontSize:13, cursor: wfUnsplashLoading ? "default" : "pointer" }}
 >{wfUnsplashLoading ? "Searching..." : "Search"}</button>
 </div>
 {wfUnsplashResults.length > 0 && (
 <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:6, maxHeight:230, overflowY:"auto" }}>
 {wfUnsplashResults.map(p => (
 <div key={p.id} onClick={() => { setWfUnsplashSel(p); if (!wfCoverAltDraft) setWfCoverAltDraft(p.alt||""); }} style={{ cursor:"pointer", borderRadius:7, overflow:"hidden", border: wfUnsplashSel?.id===p.id ? "2px solid #6366f1" : "2px solid transparent", aspectRatio:"1/1", flexShrink:0 }}>
 <img src={p.thumb} alt={p.alt||""} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
 </div>
 ))}
 </div>
 )}
 {wfUnsplashResults.length === 0 && !wfUnsplashLoading && (
 <div style={{ fontSize:12, color:"#52525b", textAlign:"center", padding:"20px 0" }}>Search for photos above</div>
 )}
 </>
 )}

 {/* ── Upload ── */}
 {wfCoverTab === 'upload' && (
 <>
 <div>
 <div style={{ fontSize:16, fontWeight:700, color:"#fafafa", marginBottom:3 }}>Upload Your Image</div>
 <div style={{ fontSize:12, color:"#71717a" }}>Upload your own image file — Maximum size: 10 MB</div>
 </div>
 <label style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12, border:"2px dashed #3f3f46", borderRadius:10, padding:"32px 20px", cursor:"pointer", background:"#09090b" }}>
 <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display:"none" }} onChange={e => {
 const file = e.target.files?.[0];
 if (!file) return;
 if (file.size > 10 * 1024 * 1024) { alert("File must be under 10 MB"); return; }
 const reader = new FileReader();
 reader.onload = ev => { setWfUploadPreview(ev.target.result); if (!wfCoverAltDraft) setWfCoverAltDraft(file.name.replace(/\.[^.]+$/, '')); };
 reader.readAsDataURL(file);
 }} />
 <div style={{ fontSize:40 }}></div>
 <div style={{ fontSize:14, fontWeight:700, color:"#fafafa" }}>↑ Choose File</div>
 <div style={{ fontSize:12, color:"#71717a" }}>Supported formats: JPG PNG WEBP GIF</div>
 </label>
 <div style={{ fontSize:11, color:"#52525b" }}>Note: Uploaded images are shown as preview. To use as Shopify cover, publish the article first then set the image in Shopify admin.</div>
 </>
 )}
 </div>
 </div>

 {/* Alt text + Save */}
 <div style={{ padding:"0 24px 24px", flexShrink:0 }}>
 <div style={{ borderTop:"1px solid #3f3f46", paddingTop:16, marginBottom:16 }}>
 <div style={{ fontSize:13, fontWeight:600, color:"#fafafa", marginBottom:8 }}>Image Alt Text</div>
 <div style={{ display:"flex", gap:8 }}>
 <input
 value={wfCoverAltDraft}
 onChange={e => setWfCoverAltDraft(e.target.value)}
 style={{ flex:1, padding:"9px 12px", background:"#09090b", border:"1px solid #3f3f46", borderRadius:8, color:"#fafafa", fontSize:13, outline:"none" }}
 placeholder="Describe this image for better SEO and accessibility..."
 />
 <button
 onClick={() => setWfCoverAltDraft(`An engaging cover image for the article "${wfPickedTitle}" about ${(wfKeywords||[]).join(', ')||wfPickedTitle}.`)}
 style={{ padding:"9px 14px", background:"#27272a", border:"1px solid #3f3f46", borderRadius:8, color:"#a1a1aa", fontWeight:600, fontSize:13, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 }}
 >Generate</button>
 </div>
 <div style={{ fontSize:11, color:"#52525b", marginTop:6 }}>A brief description improves SEO and accessibility for visually impaired users.</div>
 </div>
 <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
 <button onClick={() => setWfCoverModalOpen(false)} style={{ padding:"9px 22px", background:"#27272a", border:"1px solid #3f3f46", borderRadius:8, color:"#a1a1aa", fontWeight:600, fontSize:13, cursor:"pointer" }}>Cancel</button>
 <button
 onClick={() => {
 const preview = wfCoverTab==='ai' ? wfCoverAiPreview : wfCoverTab==='unsplash' ? wfUnsplashSel?.full : wfUploadPreview;
 if (!preview) return;
 setWfCoverImg({ url: preview, alt: wfCoverAltDraft || `Cover image for "${wfPickedTitle}"`, source: wfCoverTab });
 setWfCoverModalOpen(false);
 }}
 style={{ padding:"9px 28px", background:"#6366f1", color:"#fff", border:"none", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer" }}
 >Save</button>
 </div>
 </div>

 </div>
 </div>
 )}
 </div>
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
 {msg.content || msg.text}
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
 Go to <strong>Analyse a Post</strong> first to scan your post — or paste the post URL in the box below.
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
 <div key={i} style={{ fontSize:13, color:"#d1fae5", lineHeight:1.7, marginBottom:4 }}>{rec}</div>
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
 const score = scanResult?.scored?.overall ?? null;
 const grade = scanResult?.scored?.grade ?? "?";
 const sc = score === null ? "#71717a" : score >= 75 ? "#22c55e" : score >= 50 ? "#eab308" : "#ef4444";
 const doneCards = smartFixCards.filter(c => c.status === "done" && c.applyField);
 const unapplied = doneCards.filter(c => !smartFixApplied.has(c.id));
 const allDone = smartFixCards.length > 0 && smartFixCards.every(c => c.status !== "loading");
 return (
 <>
 {/* Header */}
 <div style={{ background:"#130d1f", border:"2px solid #7c3aed", borderRadius:14, padding:"22px 24px", marginBottom:20, display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
 <div style={{ flex:1, minWidth:220 }}>
 <div style={{ fontSize:20, fontWeight:800, color:"#e9d5ff", marginBottom:4 }}>Auto-Optimize This Post</div>
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
 : smartFixCards.length > 0 ? "Re-run All Tools" : "Run All Tools Now"}
 </button>
 {allDone && unapplied.length > 0 && (
 <button
 style={{ ...S.btn("primary"), fontSize:14, padding:"11px 28px", background:"#16a34a", borderColor:"#16a34a" }}
 onClick={applyAllSmartCards}>
 Apply All Fixes to Shopify ({unapplied.length})
 </button>
 )}
 {allDone && unapplied.length === 0 && smartFixCards.length > 0 && (
 <div style={{ fontSize:13, color:"#22c55e", fontWeight:600 }}>All fixes applied to Shopify!</div>
 )}
 </div>
 )}

 {/* Running progress bar */}
 {smartFixRunning && (() => {
 const done = smartFixCards.filter(c => c.status !== "loading").length;
 const total = smartFixCards.length;
 const pct = total ? Math.round((done / total) * 100) : 0;
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
 const applied = smartFixApplied.has(card.id);
 const applying = smartFixApplying[card.id];
 let val = null;
 if (["title","h1","headings","handle"].includes(card.id)) {
 val = card.result?.structured?.variants?.[0]?.text;
 } else if (card.id === "meta") {
 val = card.result?.variants?.[card.result?.bestVariant ?? 0]?.text;
 } else if (card.id === "schema") {
 val = card.result?.jsonLd;
 } else if (card.id === "faq") {
 val = card.result?.scriptTag;
 } else if (card.id === "toc") {
 val = card.result?.tocHtml;
 }
 const oppsList = card.result?.suggestedLinkOpportunities || [];
 const issuesList = card.result?.issues || [];
 const sectionList = card.result?.sections || [];
 const anchorsList = card.result?.topAnchors || [];
 const badgeColor = card.group === "Fix" ? "#7c3aed" : "#0e7490";
 return (
 <div key={card.id} style={{ background:"#18181b", border:`1px solid ${card.status==="error" ? "#7f1d1d" : card.status==="done" ? (applied ? "#14532d" : badgeColor) : "#3f3f46"}`, borderRadius:12, overflow:"hidden" }}>
 {/* Card header */}
 <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px", background:"#1c1c1f" }}>
 <span style={{ fontSize:20, lineHeight:1 }}>{card.icon}</span>
 <div style={{ flex:1 }}>
 <div style={{ fontSize:14, fontWeight:700, color:"#fafafa" }}>{card.label}</div>
 {card.group && <div style={{ fontSize:10, color: card.group === "Fix" ? "#a78bfa" : "#22d3ee", marginTop:1 }}>{card.group === "Fix" ? "Auto-Fix" : "Audit"}</div>}
 </div>
 {card.status === "loading" && <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#a78bfa" }}><span style={S.spinner} /> Running…</div>}
 {card.status === "done" && !applied && card.applyField && <div style={{ fontSize:11, fontWeight:700, color:"#a78bfa", background:"#2e1065", borderRadius:6, padding:"3px 10px" }}>Ready to apply</div>}
 {card.status === "done" && applied && <div style={{ fontSize:11, fontWeight:700, color:"#22c55e", background:"#0c1a0c", borderRadius:6, padding:"3px 10px" }}>Applied</div>}
 {card.status === "done" && !card.applyField && <div style={{ fontSize:11, fontWeight:700, color:"#22d3ee", background:"#083344", borderRadius:6, padding:"3px 10px" }}>Done</div>}
 {card.status === "error" && <div style={{ fontSize:11, fontWeight:700, color:"#f87171", background:"#1c0000", borderRadius:6, padding:"3px 10px" }}>Info</div>}
 </div>
 {/* Card body */}
 {card.status === "done" && (
 <div style={{ padding:"12px 16px" }}>
 {/* Text rewrite (title, meta, h1, headings, handle) */}
 {val && typeof val === "string" && !val.startsWith("{") && !val.startsWith("<") && (
 <div style={{ fontSize:13, color:"#d4d4d8", background:"#09090b", border:"1px solid #27272a", borderRadius:8, padding:"10px 14px", marginBottom:10, lineHeight:1.6, whiteSpace:"pre-wrap" }}>{val}</div>
 )}
 {/* Schema JSON-LD */}
 {card.id === "schema" && val && (
 <div style={{ fontSize:11, fontFamily:"monospace", color:"#86efac", background:"#09090b", border:"1px solid #14532d", borderRadius:8, padding:"10px 14px", marginBottom:10, maxHeight:160, overflow:"auto", whiteSpace:"pre-wrap" }}>{val}</div>
 )}
 {/* FAQ schema */}
 {card.id === "faq" && (
 <>
 {(card.result?.faqs||[]).length > 0 && (
 <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:10 }}>
 {(card.result.faqs).slice(0,5).map((f,i) => (
 <div key={i} style={{ background:"#09090b", border:"1px solid #27272a", borderRadius:8, padding:"8px 12px" }}>
 <div style={{ fontSize:12, fontWeight:600, color:"#fafafa", marginBottom:4 }}>{f.question}</div>
 <div style={{ fontSize:11, color:"#a1a1aa", lineHeight:1.5 }}>{f.answer}</div>
 </div>
 ))}
 </div>
 )}
 {val && <div style={{ fontSize:10, color:"#71717a", marginBottom:10 }}>FAQ schema ready — clicking Apply will append the &lt;script&gt; tag to your post body.</div>}
 </>
 )}
 {/* Table of Contents */}
 {card.id === "toc" && val && (
 <div style={{ fontSize:11, color:"#d4d4d8", background:"#09090b", border:"1px solid #27272a", borderRadius:8, padding:"10px 14px", marginBottom:10, maxHeight:160, overflow:"auto" }} dangerouslySetInnerHTML={{ __html: val }} />
 )}
 {/* Internal links */}
 {card.id === "links" && (
 <>
 {oppsList.length > 0 ? (
 <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:4 }}>
 {oppsList.slice(0,5).map((opp, i) => (
 <div key={i} style={{ background:"#09090b", border:"1px solid #27272a", borderRadius:8, padding:"8px 12px", display:"flex", alignItems:"flex-start", gap:10 }}>
 <div style={{ flex:1 }}>
 <div style={{ fontSize:12, fontWeight:600, color:"#fafafa" }}>{opp.targetPage || opp.page || opp.url || "Suggested page"}</div>
 {opp.anchorText && <div style={{ fontSize:11, color:"#a78bfa", marginTop:2 }}>Anchor: "{opp.anchorText}"</div>}
 {opp.importance && <div style={{ fontSize:10, color:"#71717a", marginTop:1 }}>{opp.importance}</div>}
 </div>
 <button style={{ ...S.btn(), fontSize:10, padding:"3px 10px", flexShrink:0 }} onClick={() => { navigator.clipboard.writeText(opp.anchorText || opp.url || ""); showToast("Copied!")}}>Copy</button>
 </div>
 ))}
 {oppsList.length > 5 && <div style={{ fontSize:11, color:"#71717a" }}>+{oppsList.length - 5} more — see Internal Links section</div>}
 </div>
 ) : (
 <div style={{ fontSize:12, color:"#a1a1aa" }}>{card.result?.assessment || "No link opportunities found."}</div>
 )}
 {card.result?.internalLinkScore != null && <div style={{ fontSize:11, color:"#71717a", marginTop:6 }}>Link score: {card.result.internalLinkScore}/100</div>}
 </>
 )}
 {/* Image SEO */}
 {card.id === "images" && (
 <>
 <div style={{ display:"flex", gap:12, marginBottom:10, flexWrap:"wrap" }}>
 <div style={{ background:"#09090b", border:"1px solid #27272a", borderRadius:8, padding:"8px 14px", textAlign:"center", minWidth:70 }}><div style={{ fontSize:22, fontWeight:800, color:(card.result?.altScore||0)>=80?"#22c55e":"#f59e0b" }}>{card.result?.altScore??"-"}</div><div style={{ fontSize:10, color:"#71717a" }}>Alt Score</div></div>
 <div style={{ background:"#09090b", border:"1px solid #27272a", borderRadius:8, padding:"8px 14px", textAlign:"center", minWidth:70 }}><div style={{ fontSize:22, fontWeight:800, color:"#fafafa" }}>{card.result?.totalImages??0}</div><div style={{ fontSize:10, color:"#71717a" }}>Total</div></div>
 <div style={{ background:"#09090b", border:"1px solid #27272a", borderRadius:8, padding:"8px 14px", textAlign:"center", minWidth:70 }}><div style={{ fontSize:22, fontWeight:800, color:"#f87171" }}>{card.result?.missing??0}</div><div style={{ fontSize:10, color:"#71717a" }}>Missing alt</div></div>
 </div>
 {issuesList.length > 0 ? issuesList.slice(0,4).map((iss,i) => (
 <div key={i} style={{ background:"#09090b", border:"1px solid #450a0a", borderRadius:8, padding:"7px 12px", fontSize:11, color:"#fca5a5", marginBottom:6 }}>{typeof iss==="string"?iss:(iss.message||iss.issue||JSON.stringify(iss))}</div>
 )) : <div style={{ fontSize:12, color:"#22c55e" }}>All images have alt text!</div>}
 {issuesList.length > 4 && <div style={{ fontSize:11, color:"#71717a" }}>+{issuesList.length-4} more issues — see Image SEO section</div>}
 </>
 )}
 {/* OG / Social */}
 {card.id === "og" && (
 <>
 {issuesList.length > 0 ? issuesList.slice(0,5).map((iss,i) => (
 <div key={i} style={{ background:"#09090b", border:"1px solid #450a0a", borderRadius:8, padding:"7px 12px", fontSize:11, color:"#fca5a5", marginBottom:6 }}>{typeof iss==="string"?iss:(iss.message||iss.issue||JSON.stringify(iss))}</div>
 )) : <div style={{ fontSize:12, color:"#22c55e" }}>Open Graph tags look good!</div>}
 {card.result?.og?.title && <div style={{ fontSize:11, color:"#71717a", marginTop:8 }}>OG title: {card.result.og.title}</div>}
 </>
 )}
 {/* Anchor text */}
 {card.id === "anchors" && (
 <>
 {card.result?.genericAnchorCount > 0 && (
 <div style={{ background:"#09090b", border:"1px solid #450a0a", borderRadius:8, padding:"8px 12px", fontSize:12, color:"#fca5a5", marginBottom:8 }}>{card.result.genericAnchorCount} generic anchor{card.result.genericAnchorCount>1?"s":""} ("click here", "read more"…)</div>
 )}
 {issuesList.slice(0,3).map((iss,i) => (
 <div key={i} style={{ background:"#09090b", border:"1px solid #27272a", borderRadius:8, padding:"7px 12px", fontSize:11, color:"#fca5a5", marginBottom:6 }}>{typeof iss==="string"?iss:(iss.message||iss.issue||JSON.stringify(iss))}</div>
 ))}
 {anchorsList.slice(0,4).map((a,i) => (
 <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#d4d4d8", padding:"3px 0", borderBottom:"1px solid #27272a" }}>
 <span>"{a.text||a.anchor}"</span><span style={{ color:"#71717a" }}>x{a.count||a.frequency||1}</span>
 </div>
 ))}
 {issuesList.length===0 && anchorsList.length===0 && <div style={{ fontSize:12, color:"#22c55e" }}>Anchor text looks good!</div>}
 </>
 )}
 {/* Keyword density */}
 {card.id === "kwdens" && (
 <>
 {card.result?.density != null && (
 <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:10 }}>
 <div style={{ background:"#09090b", border:"1px solid #27272a", borderRadius:8, padding:"8px 14px", textAlign:"center" }}>
 <div style={{ fontSize:22, fontWeight:800, color:card.result.density>=1&&card.result.density<=3?"#22c55e":"#f59e0b" }}>{typeof card.result.density?.toFixed==="function"?card.result.density.toFixed(1):card.result.density}%</div>
 <div style={{ fontSize:10, color:"#71717a" }}>Density</div>
 </div>
 <div style={{ fontSize:12, color:"#a1a1aa" }}>{card.result.density<1?"Below recommended (1-3%)":card.result.density>3?"Above recommended - may look spammy":"In the ideal range (1-3%)"}</div>
 </div>
 )}
 {issuesList.slice(0,3).map((iss,i) => (
 <div key={i} style={{ background:"#09090b", border:"1px solid #27272a", borderRadius:8, padding:"7px 12px", fontSize:11, color:"#fca5a5", marginBottom:6 }}>{typeof iss==="string"?iss:(iss.message||iss.issue||JSON.stringify(iss))}</div>
 ))}
 </>
 )}
 {/* Section word count */}
 {card.id === "sections" && (
 <>
 {card.result?.thinSections > 0 && (
 <div style={{ background:"#09090b", border:"1px solid #450a0a", borderRadius:8, padding:"8px 12px", fontSize:12, color:"#fca5a5", marginBottom:8 }}>Thin section{card.result.thinSections>1?"s":""}: {card.result.thinSections} under 150 words</div>
 )}
 {card.result?.avgPerSection && <div style={{ fontSize:11, color:"#71717a", marginBottom:8 }}>Avg: {Math.round(card.result.avgPerSection)} words/section</div>}
 {sectionList.slice(0,5).map((sec,i) => (
 <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:12, padding:"5px 0", borderBottom:"1px solid #27272a" }}>
 <span style={{ color:"#d4d4d8", flex:1, marginRight:8, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sec.heading||sec.section||"Section "+(i+1)}</span>
 <span style={{ color:(sec.wordCount||sec.words||0)<150?"#f87171":"#22c55e", fontWeight:700, flexShrink:0 }}>{sec.wordCount||sec.words||0}w</span>
 </div>
 ))}
 {sectionList.length===0 && issuesList.length===0 && <div style={{ fontSize:12, color:"#22c55e" }}>Section word counts look good!</div>}
 </>
 )}
 {/* Apply button (Fix cards only) */}
 {card.applyField && val && !applied && (
 <button
 style={{ ...S.btn("primary"), fontSize:12, padding:"7px 18px", marginTop:8, background:"#16a34a", borderColor:"#16a34a", opacity:applying?0.7:1 }}
 disabled={applying}
 onClick={() => applySmartCard(card)}>
 {applying ? <><span style={S.spinner} /> Applying...</> : "Apply to Shopify"}
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
 <div style={{ fontSize:32, marginBottom:12 }}></div>
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

 {/* ── Credit error modal ──────────────────────────────────────────── */}
 {creditErr && (
 <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}>
 <div style={{ background: "#18181b", border: "2px solid #7c3aed", borderRadius: 16, padding: "36px 32px", maxWidth: 420, width: "100%", textAlign: "center", boxShadow: "0 25px 60px rgba(0,0,0,0.6)" }}>
 <div style={{ fontSize: 40, marginBottom: 14 }}></div>
 <div style={{ fontSize: 20, fontWeight: 700, color: "#fafafa", marginBottom: 8 }}>
 {creditErr.credits_available === 0 ? "No Credits Left" : "Not Enough Credits"}
 </div>
 <div style={{ fontSize: 14, color: "#a1a1aa", lineHeight: 1.6, marginBottom: 20 }}>
 This action needs{" "}
 <strong style={{ color: "#e9d5ff" }}>
 {creditErr.credits_needed ?? 1} credit{(creditErr.credits_needed ?? 1) !== 1 ? "s" : ""}
 </strong>
 {" "}but you only have{" "}
 <strong style={{ color: "#fca5a5" }}>{creditErr.credits_available ?? 0}</strong> remaining.
 <br />
 {creditErr.credits_available === 0
 ? "Top up to keep using AI features."
 : "Credits refresh monthly — or top up now to continue."}
 </div>
 <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
 <button
 style={{ padding: "11px 26px", borderRadius: 8, background: "#7c3aed", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}
 onClick={() => { dismissCreditErr(); window.__AURA_NAVIGATE?.("credits"); }}
 >
 Top Up Credits
 </button>
 <button
 style={{ padding: "11px 26px", borderRadius: 8, background: "#3f3f46", color: "#d4d4d8", fontWeight: 600, fontSize: 14, border: "none", cursor: "pointer" }}
 onClick={dismissCreditErr}
 >
 Dismiss
 </button>
 </div>
 </div>
 </div>
 )}

 {/* ════════════════════════════
 GENERATE ARTICLE MODAL
 ════════════════════════════ */}
 {showGenModal && (
 <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}
 onClick={e => { if(e.target === e.currentTarget) setShowGenModal(false)}}>
 <div style={{ background:"#18181b", border:"1px solid #3f3f46", borderRadius:16, padding:"28px 28px 24px", width:"100%", maxWidth:520, maxHeight:"90vh", overflowY:"auto", position:"relative", boxShadow:"0 24px 80px rgba(0,0,0,0.7)", color:"#fafafa" }}>
 <button onClick={() => setShowGenModal(false)} style={{ position:"absolute", top:14, right:16, background:"#27272a", border:"1px solid #3f3f46", color:"#a1a1aa", cursor:"pointer", fontSize:16, lineHeight:1, borderRadius:6, width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center" }}></button>

 <div style={{ fontSize:17, fontWeight:700, color:"#fafafa", marginBottom:4 }}>Generate Article Title from Keywords</div>
 <div style={{ fontSize:13, color:"#71717a", marginBottom:20 }}>Add keyword(s) and provide a brief topic idea for AI to begin with.</div>

 {/* Mode radio */}
 <div style={{ fontSize:13, fontWeight:500, color:"#d4d4d8", marginBottom:10 }}>Create articles using the following keywords</div>
 <div style={{ display:"flex", gap:20, marginBottom:14 }}>
 {[["manual","Manual Input"],["ai","AI Generate"]].map(([val,lbl]) => (
 <label key={val} style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontSize:13, color:"#d4d4d8" }}>
 <input type="radio" checked={genKwMode===val} onChange={() => setGenKwMode(val)} style={{ accentColor:"#6366f1" }}/> {lbl}
 </label>
 ))}
 </div>

 {/* Keyword input area */}
 {genKwMode === "ai" ? (
 <div style={{ marginBottom:14 }}>
 {/* Shop product suggestions */}
 {(genSuggestionsLoading || genShopSuggestions.length > 0) && (
 <div style={{ marginBottom:8 }}>
 <div style={{ fontSize:11, color:"#71717a", marginBottom:6 }}>
 {genSuggestionsLoading ? "Loading from your shop..." : "From your shop — click to add:"}
 </div>
 <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
 {genSuggestionsLoading
 ? <span style={S.spinner}/>
 : genShopSuggestions.map((kw, i) => (
 <button key={i}
 onClick={() => { if (!genKeywords.includes(kw)) setGenKeywords(prev => [...prev, kw]); }}
 style={{ background: genKeywords.includes(kw) ? "#4f46e5" : "#27272a", border:"1px solid #3f3f46", borderRadius:6, padding:"3px 10px", fontSize:12, color: genKeywords.includes(kw) ? "#fff" : "#d4d4d8", cursor:"pointer" }}
 >{kw}</button>
 ))
 }
 </div>
 </div>
 )}
 <div style={{ border:"1.5px solid #3f3f46", borderRadius:10, padding:"10px 12px", background:"#09090b" }}>
 <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom: genKeywords.length ? 8 : 0 }}>
 {genKeywords.map((kw,i) => (
 <span key={i} style={{ display:"inline-flex", alignItems:"center", gap:4, background:"#27272a", border:"1px solid #3f3f46", borderRadius:6, padding:"3px 10px", fontSize:12, color:"#d4d4d8" }}>
 {kw}
 <button onClick={() => setGenKeywords(prev => prev.filter((_,j)=>j!==i))} style={{ background:"none", border:"none", cursor:"pointer", color:"#71717a", fontSize:13, padding:0, lineHeight:1 }}>×</button>
 </span>
 ))}
 </div>
 <div style={{ display:"flex", gap:8, alignItems:"center" }}>
 <input
 autoFocus
 style={{ flex:1, border:"none", outline:"none", fontSize:13, background:"transparent", color:"#fafafa", padding:"2px 0" }}
 placeholder={genKeywords.length ? "Add more keywords..." : "Or type a keyword..."}
 value={genKwInput}
 onChange={e => setGenKwInput(e.target.value)}
 onKeyDown={e => { if(e.key==="Enter" && genKwInput.trim()) { setGenKeywords(prev=>[...prev, genKwInput.trim()]); setGenKwInput(""); } }}
 />
 <button
 onClick={genExpandKeywords}
 disabled={!genKwInput.trim() || genKwLoading}
 title="AI Generate keyword variations"
 style={{ background:"#6366f1", border:"none", borderRadius:6, width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", cursor: !genKwInput.trim() || genKwLoading ? "default" : "pointer", opacity: !genKwInput.trim() || genKwLoading ? 0.5 : 1 }}
 >{genKwLoading ? <span style={S.spinner}/> : <span style={{ color:"#fff", fontSize:14 }}></span>}</button>
 </div>
 </div>
 </div>
 ) : (
 <div style={{ border:"1.5px solid #3f3f46", borderRadius:10, padding:"10px 12px", marginBottom:14, background:"#09090b" }}>
 <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom: genKeywords.length ? 8 : 0 }}>
 {genKeywords.map((kw,i) => (
 <span key={i} style={{ display:"inline-flex", alignItems:"center", gap:4, background:"#27272a", border:"1px solid #3f3f46", borderRadius:6, padding:"3px 10px", fontSize:12, color:"#d4d4d8" }}>
 {kw}
 <button onClick={() => setGenKeywords(prev => prev.filter((_,j)=>j!==i))} style={{ background:"none", border:"none", cursor:"pointer", color:"#71717a", fontSize:13, padding:0, lineHeight:1 }}>×</button>
 </span>
 ))}
 </div>
 <input
 autoFocus
 style={{ width:"100%", border:"none", outline:"none", fontSize:13, background:"transparent", color:"#fafafa", padding:"2px 0" }}
 placeholder="Press Enter ↵ to input another one"
 value={genKwInput}
 onChange={e => setGenKwInput(e.target.value)}
 onKeyDown={e => { if(e.key==="Enter" && genKwInput.trim()) { setGenKeywords(prev=>[...prev, genKwInput.trim()]); setGenKwInput(""); } }}
 />
 </div>
 )}

 {/* Cover image */}
 <div style={{ marginBottom:16 }}>
 <div style={{ fontSize:13, fontWeight:500, color:"#d4d4d8", marginBottom:8 }}>Cover image</div>
 <div style={{ position:"relative" }}>
 <select
 value={genCoverImage}
 onChange={e => setGenCoverImage(e.target.value)}
 style={{ width:"100%", padding:"10px 36px 10px 12px", borderRadius:8, border:"1px solid #3f3f46", background:"#09090b", color:"#d4d4d8", fontSize:13, appearance:"none", outline:"none", cursor:"pointer" }}
 >
 <option value="ai-1:1">Generate by AI – 1:1</option>
 <option value="ai-16:9">Generate by AI – 16:9</option>
 <option value="ai-4:3">Generate by AI – 4:3</option>
 <option value="none">No cover image</option>
 </select>
 <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", color:"#71717a", pointerEvents:"none", fontSize:12 }}></span>
 </div>
 </div>

 {/* Language */}
 <div style={{ marginBottom:16 }}>
 <div style={{ fontSize:13, fontWeight:500, color:"#d4d4d8", marginBottom:8 }}>Choose article language</div>
 <div style={{ display:"flex", gap:8 }}>
 <div style={{ position:"relative", flex:1 }}>
 <select
 value={genLanguage.split("-")[1] || "US"}
 onChange={e => setGenLanguage(`${genLanguage.split("-")[0]}-${e.target.value}`)}
 style={{ width:"100%", padding:"10px 32px 10px 12px", borderRadius:8, border:"1px solid #3f3f46", background:"#09090b", color:"#d4d4d8", fontSize:13, appearance:"none", outline:"none", cursor:"pointer" }}
 >
 <option value="US">United States</option>
 <option value="GB">United Kingdom</option>
 <option value="AU">Australia</option>
 <option value="CA">Canada</option>
 <option value="DE">Germany</option>
 <option value="FR">France</option>
 <option value="ES">Spain</option>
 </select>
 <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", color:"#71717a", pointerEvents:"none", fontSize:12 }}></span>
 </div>
 <div style={{ position:"relative", flex:1 }}>
 <select
 value={genLanguage.split("-")[0] || "en"}
 onChange={e => setGenLanguage(`${e.target.value}-${genLanguage.split("-")[1] || "US"}`)}
 style={{ width:"100%", padding:"10px 32px 10px 12px", borderRadius:8, border:"1px solid #3f3f46", background:"#09090b", color:"#d4d4d8", fontSize:13, appearance:"none", outline:"none", cursor:"pointer" }}
 >
 <option value="en">English (US)</option>
 <option value="en-GB">English (UK)</option>
 <option value="fr">French</option>
 <option value="de">German</option>
 <option value="es">Spanish</option>
 <option value="it">Italian</option>
 <option value="pt">Portuguese</option>
 </select>
 <span style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", color:"#71717a", pointerEvents:"none", fontSize:12 }}></span>
 </div>
 </div>
 </div>

 {/* AI web research */}
 <div style={{ background:"#09090b", border:"1px solid #3f3f46", borderRadius:10, padding:"12px 14px", marginBottom:16, display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
 <div>
 <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:4 }}>
 <span style={{ fontSize:13 }}></span>
 <span style={{ fontSize:13, fontWeight:600, color:"#a78bfa" }}>AI web research</span>
 </div>
 <div style={{ fontSize:12, color:"#71717a", lineHeight:1.5 }}>We'll search Google/Wikipedia and more for similar topics to generate up-to-date content.</div>
 </div>
 <div
 onClick={() => setGenAiResearch(!genAiResearch)}
 style={{ flexShrink:0, width:40, height:22, borderRadius:99, background: genAiResearch ? "#6366f1" : "#3f3f46", cursor:"pointer", position:"relative", transition:"background .2s", marginTop:2 }}
 >
 <div style={{ position:"absolute", top:3, left: genAiResearch ? 21 : 3, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left .2s" }}/>
 </div>
 </div>

 {genModalErr && <div style={{ fontSize:12, color:"#f87171", marginBottom:12 }}>{genModalErr}</div>}

 <button
 style={{ width:"100%", padding:"12px 0", borderRadius:10, background: (!genKeywords.length && !genKwInput.trim()) || genTitleLoading ? "#4338ca" : "#6366f1", color:"#fff", fontWeight:700, fontSize:14, border:"none", cursor: (!genKeywords.length && !genKwInput.trim()) || genTitleLoading ? "default" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, opacity: (!genKeywords.length && !genKwInput.trim()) || genTitleLoading ? 0.6 : 1 }}
 disabled={(!genKeywords.length && !genKwInput.trim()) || genTitleLoading}
 onClick={genGenerateTitles}
 >{genTitleLoading ? <><span style={S.spinner}/> Generating titles...</> : <><span style={{ fontSize:14 }}></span> Generate Title</>}</button>
 </div>
 </div>
 )}
 </>
 );
}

