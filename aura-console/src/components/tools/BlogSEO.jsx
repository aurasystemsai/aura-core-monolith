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
