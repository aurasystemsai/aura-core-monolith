const fs = require("fs");
const path = require("path");
const target = path.join(__dirname, "aura-console/src/components/tools/SEOSiteCrawler.jsx");

// Write in parts to avoid single mega-template-literal
const parts = [];

parts.push(`import React, { useState, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/seo-site-crawler";

const S = {
  page:    { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card:    { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  card2:   { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "16px 20px", marginBottom: 12 },
  inset:   { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: "14px 16px", marginBottom: 10 },
  btn:     (v) => ({ background: v==="primary"?"#4f46e5":v==="green"?"#166534":v==="danger"?"#7f1d1d":v==="amber"?"#92400e":v==="teal"?"#134e4a":"#27272a", color:"#fafafa", border:"none", borderRadius:10, padding:"10px 20px", fontWeight:700, fontSize:13, cursor:"pointer", whiteSpace:"nowrap" }),
  btnSm:   (v) => ({ background: v==="primary"?"#4f46e5":v==="danger"?"#7f1d1d":v==="green"?"#166534":v==="teal"?"#134e4a":"#27272a", color:"#fafafa", border:"none", borderRadius:7, padding:"5px 10px", fontWeight:700, fontSize:11, cursor:"pointer", whiteSpace:"nowrap" }),
  input:   { flex:1, minWidth:160, background:"#18181b", border:"1px solid #3f3f46", borderRadius:10, color:"#fafafa", fontSize:14, padding:"11px 16px", outline:"none" },
  select:  { background:"#18181b", border:"1px solid #3f3f46", borderRadius:10, color:"#fafafa", fontSize:13, padding:"10px 14px", outline:"none" },
  sT:      { fontSize:11, fontWeight:700, color:"#52525b", textTransform:"uppercase", letterSpacing:1, marginBottom:10 },
  row:     { display:"flex", alignItems:"flex-start", gap:10, padding:"8px 0", borderBottom:"1px solid #1f1f22" },
  th:      { fontSize:10, fontWeight:700, color:"#52525b", textTransform:"uppercase", letterSpacing:0.8, padding:"8px 12px", background:"#09090b", borderBottom:"1px solid #27272a", whiteSpace:"nowrap" },
  td:      { fontSize:12, color:"#a1a1aa", padding:"10px 12px", borderBottom:"1px solid #1a1a1e", verticalAlign:"top", lineHeight:1.4 },
  badge:   (s) => ({
    background: s==="critical"?"#2d0a0a":s==="high"?"#3f1315":s==="medium"?"#3d2a0a":s==="low"?"#0d2218":s==="good"?"#052e16":s==="info"?"#0c1a2e":"#27272a",
    color:      s==="critical"?"#fca5a5":s==="high"?"#f87171":s==="medium"?"#fbbf24":s==="low"?"#4ade80":s==="good"?"#4ade80":s==="info"?"#60a5fa":"#a1a1aa",
    border: \`1px solid \${s==="critical"?"#fca5a520":s==="high"?"#f8717130":s==="medium"?"#fbbf2430":s==="low"?"#4ade8030":s==="info"?"#60a5fa30":"#27272a"}\`,
    borderRadius:5, padding:"2px 8px", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5, display:"inline-block",
  }),
  pre:     { background:"#09090b", border:"1px solid #27272a", borderRadius:8, padding:"12px 14px", fontSize:12, lineHeight:1.7, color:"#e4e4e7", whiteSpace:"pre-wrap", fontFamily:"monospace", overflowX:"auto" },
};

const TABS = [
  { id:"dashboard",     label:"Dashboard" },
  { id:"explorer",      label:"URL Explorer" },
  { id:"issues",        label:"Issues" },
  { id:"security",      label:"Security" },
  { id:"international", label:"International" },
  { id:"redirects",     label:"Redirects & Canonicals" },
  { id:"robots",        label:"Robots & Sitemap" },
  { id:"structure",     label:"Site Structure" },
  { id:"performance",   label:"Performance" },
  { id:"content",       label:"Content Quality" },
  { id:"accessibility", label:"Accessibility" },
  { id:"ai-geo",        label:"AI / GEO" },
  { id:"schedules",     label:"Scheduled Crawls" },
  { id:"compare",       label:"Compare Crawls" },
  { id:"guide",         label:"Crawl Guide" },
];

const ISSUE_CATEGORIES = [
  { id:"all",          label:"All Issues",        types:[] },
  { id:"meta",         label:"Meta & Titles",     types:["missing-title","title-too-long","title-too-short","missing-meta-description","meta-too-long","meta-too-short","duplicate-title","duplicate-meta"] },
  { id:"crawl",        label:"Crawlability",      types:["404-error","redirect-chain","noindex","blocked-robots","broken-link","403-forbidden","500-error"] },
  { id:"headings",     label:"Headings",          types:["missing-h1","multiple-h1","empty-h1","h1-too-long","wrong-heading-order"] },
  { id:"images",       label:"Images",            types:["missing-alt","empty-alt","large-image","wrong-format","missing-dimensions"] },
  { id:"schema",       label:"Schema",            types:["missing-schema","invalid-schema","missing-product-schema","missing-breadcrumb","schema-error"] },
  { id:"links",        label:"Internal Links",    types:["orphan-page","broken-internal-link","redirect-loop","too-few-links"] },
  { id:"perf",         label:"Performance",       types:["slow-lcp","render-blocking","no-compression","no-caching","large-dom","slow-ttfb"] },
  { id:"content",      label:"Content",           types:["thin-content","duplicate-content","low-word-count","keyword-missing","no-canonical"] },
  { id:"security",     label:"Security",          types:["mixed-content","http-page","insecure-form","missing-hsts","missing-csp"] },
  { id:"a11y",         label:"Accessibility",     types:["missing-lang","low-contrast","missing-aria","no-skip-link","unlabeled-form"] },
];

const USER_AGENTS = ["Googlebot Desktop","Googlebot Mobile","Bingbot","GPTBot","ClaudeBot","PerplexityBot","AhrefsBot","DuckDuckBot"];
const SCHEDULE_FREQS = ["Daily","Weekly","Fortnightly","Monthly"];

const CWV_THRESHOLDS = {
  lcp:  { good:2500, poor:4000, unit:"ms", label:"LCP",  description:"Largest Contentful Paint" },
  inp:  { good:200,  poor:500,  unit:"ms", label:"INP",  description:"Interaction to Next Paint" },
  cls:  { good:0.1,  poor:0.25, unit:"",   label:"CLS",  description:"Cumulative Layout Shift" },
  ttfb: { good:800,  poor:1800, unit:"ms", label:"TTFB", description:"Time to First Byte" },
  fcp:  { good:1800, poor:3000, unit:"ms", label:"FCP",  description:"First Contentful Paint" },
};

const SEC_HEADERS = [
  { name:"Strict-Transport-Security",  key:"hsts",        sev:"high",   desc:"Forces HTTPS. Prevents protocol downgrade attacks. Set max-age >= 31536000." },
  { name:"Content-Security-Policy",    key:"csp",         sev:"high",   desc:"Prevents XSS attacks by whitelisting trusted resource origins." },
  { name:"X-Frame-Options",            key:"xframe",      sev:"medium", desc:"Blocks clickjacking by preventing iframe embedding. Use DENY or SAMEORIGIN." },
  { name:"X-Content-Type-Options",     key:"xcto",        sev:"medium", desc:"Prevents MIME-sniffing. Always set to 'nosniff'." },
  { name:"Referrer-Policy",            key:"referrer",    sev:"low",    desc:"Controls referrer data sent with requests. Recommended: strict-origin-when-cross-origin." },
  { name:"Permissions-Policy",         key:"permissions", sev:"low",    desc:"Restricts browser API access (camera, microphone, geolocation)." },
];

const GEO_CHECKS = [
  { id:"faq-schema",    label:"FAQPage Schema on key pages",         pts:15, desc:"AI systems extract Q&A pairs from FAQPage JSON-LD. Essential for appearing in AI Overviews and ChatGPT responses." },
  { id:"org-schema",    label:"Organisation Schema with sameAs",     pts:10, desc:"Organisation JSON-LD with name, url, logo, and sameAs social profiles helps LLMs understand and cite your brand." },
  { id:"product-schema",label:"Product Schema with aggregateRating", pts:15, desc:"Complete Product schema enables AI to recommend products in buying-intent queries and voice search." },
  { id:"author-attr",   label:"Author attribution with Person schema",pts:15,desc:"Author bylines with Person JSON-LD signal E-E-A-T. LLMs use author credibility as a citation trust signal." },
  { id:"breadcrumbs",   label:"BreadcrumbList Schema",               pts:10, desc:"Breadcrumb schema helps AI understand page hierarchy and include contextual information in citations." },
  { id:"direct-answers",label:"Direct answer format content",        pts:20, desc:"Pages answering 'What is X?', 'How to Y?' directly in the first 100 words are cited 3x more by AI systems." },
  { id:"howto-schema",  label:"HowTo Schema on process pages",       pts:5,  desc:"HowTo structured data enables AI to extract and present your step-by-step guides in AI responses." },
  { id:"citations",     label:"Outbound authority citations",        pts:5,  desc:"Citing authoritative sources (research, government, industry bodies) increases your own citation likelihood." },
  { id:"clear-dates",   label:"Publication & modified dates",        pts:5,  desc:"datePublished and dateModified in Article schema help AI systems assess content freshness." },
];

`);

parts.push(`// --- Sub-Components ---

function HealthGauge({ score }) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  const label = score >= 80 ? "Healthy" : score >= 60 ? "Needs Work" : "Critical";
  return (
    <div style={{ textAlign:"center" }}>
      <div style={{ position:"relative", display:"inline-block", width:150, height:84 }}>
        <svg width="150" height="84" viewBox="0 0 150 84">
          <path d="M 10 79 A 65 65 0 0 1 140 79" fill="none" stroke="#27272a" strokeWidth="13" strokeLinecap="round" />
          <path d="M 10 79 A 65 65 0 0 1 140 79" fill="none" stroke={color} strokeWidth="13" strokeLinecap="round"
            strokeDasharray={\`\${Math.round((score/100)*204)} 204\`} />
        </svg>
        <div style={{ position:"absolute", bottom:0, left:"50%", transform:"translateX(-50%)", textAlign:"center", paddingBottom:2 }}>
          <div style={{ fontSize:30, fontWeight:900, color, lineHeight:1 }}>{score}</div>
          <div style={{ fontSize:10, color:"#71717a", fontWeight:600 }}>/100</div>
        </div>
      </div>
      <div style={{ fontSize:13, fontWeight:700, color, marginTop:4 }}>{label}</div>
    </div>
  );
}

function SubScore({ label, score, color }) {
  const c = color || (score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444");
  return (
    <div style={{ background:"#09090b", border:"1px solid #27272a", borderRadius:10, padding:"12px 14px", textAlign:"center" }}>
      <div style={{ fontSize:10, color:"#71717a", fontWeight:700, textTransform:"uppercase", letterSpacing:0.8, marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:22, fontWeight:900, color:c, lineHeight:1 }}>{score}</div>
      <div style={{ background:"#27272a", borderRadius:4, height:4, marginTop:6 }}>
        <div style={{ width:\`\${score}%\`, background:c, height:"100%", borderRadius:4 }} />
      </div>
    </div>
  );
}

function Bar({ value, max, color="#4f46e5", height=6 }) {
  const pct = max > 0 ? Math.min(100, Math.round((value/max)*100)) : 0;
  return (
    <div style={{ background:"#27272a", borderRadius:4, height, overflow:"hidden" }}>
      <div style={{ width:\`\${pct}%\`, background:color, height:"100%", borderRadius:4 }} />
    </div>
  );
}

function Coverage({ affected, total, label, sev="medium" }) {
  const pct = total > 0 ? Math.round((affected/total)*100) : 0;
  const color = sev==="high"?"#ef4444":sev==="medium"?"#f59e0b":"#22c55e";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ flex:1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
          <span style={{ color:"#a1a1aa" }}>{label}</span>
          <span style={{ color, fontWeight:700 }}>{affected} / {total} ({pct}%)</span>
        </div>
        <Bar value={affected} max={total} color={color} height={5} />
      </div>
    </div>
  );
}

function CWVChip({ metric, value }) {
  const t = CWV_THRESHOLDS[metric];
  if (!t || value == null) return null;
  const n = parseFloat(value);
  const st = n <= t.good ? "good" : n <= t.poor ? "medium" : "high";
  const col = st==="good"?"#4ade80":st==="medium"?"#fbbf24":"#f87171";
  const bg  = st==="good"?"#052e16":st==="medium"?"#3d2a0a":"#3f1315";
  return (
    <div style={{ background:bg, borderRadius:8, padding:"8px 12px", minWidth:80, textAlign:"center" }}>
      <div style={{ fontSize:9, color:"#71717a", fontWeight:700, textTransform:"uppercase" }}>{t.label}</div>
      <div style={{ fontSize:17, fontWeight:900, color:col, marginTop:2 }}>{n}{t.unit}</div>
      <div style={{ fontSize:9, color:col, marginTop:1 }}>{st==="good"?"Good":st==="medium"?"Needs Work":"Poor"}</div>
    </div>
  );
}

function AIFix({ issue, pageUrl }) {
  const [loading, setLoading] = React.useState(false);
  const [fix, setFix]         = React.useState("");
  const [err, setErr]         = React.useState("");
  const [copied, setCopied]   = React.useState(false);
  const go = async () => {
    setLoading(true); setErr(""); setFix("");
    try {
      const r = await apiFetchJSON(\`\${API}/ai/fix\`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ issue, page:pageUrl }) });
      if (!r.ok) throw new Error(r.error||"Failed");
      setFix(r.suggestion||r.fix||"");
    } catch(e) { setErr(e.message); }
    setLoading(false);
  };
  const copy = () => { navigator.clipboard?.writeText(fix); setCopied(true); setTimeout(()=>setCopied(false),1500); };
  return (
    <div style={{ marginTop:8 }}>
      {!fix && !loading && <button style={S.btnSm("primary")} onClick={go}>AI Fix Suggestion</button>}
      {loading && <Spinner size={14} />}
      {err && <div style={{ color:"#f87171", fontSize:11, marginTop:4 }}>{err}</div>}
      {fix && (
        <div style={{ background:"#1e1b4b", border:"1px solid #3730a3", borderRadius:7, padding:"10px 12px", marginTop:6 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
            <span style={{ fontSize:10, color:"#818cf8", fontWeight:700, textTransform:"uppercase" }}>AI Suggested Fix</span>
            <button style={S.btnSm()} onClick={copy}>{copied?"Copied!":"Copy"}</button>
          </div>
          <div style={{ fontSize:12, color:"#c7d2fe", lineHeight:1.6, whiteSpace:"pre-wrap" }}>{fix}</div>
        </div>
      )}
    </div>
  );
}

function IssueRow({ issue, pageUrl, index }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ background:index%2===0?"#18181b":"#111113", borderBottom:"1px solid #1a1a1e" }}>
      <div style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 14px", cursor:"pointer" }} onClick={()=>setOpen(o=>!o)}>
        <span style={S.badge(issue.severity)}>{issue.severity}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:600, color:"#e4e4e7" }}>{issue.type||issue.code}</div>
          {issue.detail && <div style={{ fontSize:12, color:"#71717a", marginTop:2 }}>{issue.detail}</div>}
        </div>
        <div style={{ fontSize:11, color:"#52525b", maxWidth:260, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flexShrink:0 }}>{pageUrl}</div>
        <span style={{ color:"#52525b", fontSize:12, flexShrink:0 }}>{open?"▲":"▼"}</span>
      </div>
      {open && (
        <div style={{ padding:"0 14px 14px" }}>
          {issue.context && <div style={S.pre}>{issue.context}</div>}
          <AIFix issue={issue} pageUrl={pageUrl} />
        </div>
      )}
    </div>
  );
}

function Check({ pass, label, detail, action }) {
  return (
    <div style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"8px 0", borderBottom:"1px solid #1f1f22" }}>
      <span style={{ color:pass?"#4ade80":"#f87171", fontSize:16, flexShrink:0, lineHeight:1.2 }}>{pass?"✓":"✗"}</span>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:600, color:pass?"#e4e4e7":"#fafafa" }}>{label}</div>
        {detail && <div style={{ fontSize:12, color:"#71717a", marginTop:2, lineHeight:1.5 }}>{detail}</div>}
      </div>
      {!pass && action && <button style={S.btnSm("primary")} onClick={action.fn}>{action.label}</button>}
    </div>
  );
}

`);

parts.push(`// --- Main Component ---

export default function SEOSiteCrawler() {

  // ── Crawl settings ──────────────────────────────────────────────────────
  const [url, setUrl]               = useState("");
  const [depth, setDepth]           = useState(3);
  const [maxPages, setMaxPages]     = useState(100);
  const [userAgent, setUserAgent]   = useState("Googlebot Desktop");
  const [crawlDelay, setCrawlDelay] = useState(0);
  const [excludePatterns, setExclude] = useState([]);
  const [excludeInput, setExcludeInput] = useState("");
  const [keywords, setKeywords]     = useState([]);
  const [kwInput, setKwInput]       = useState("");
  const [showSettings, setShowSettings] = useState(false);

  // ── Crawl state ──────────────────────────────────────────────────────────
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [tab, setTab]         = useState("dashboard");

  // ── Tab sub-views ────────────────────────────────────────────────────────
  const [structView,  setStructView]  = useState("orphans");
  const [secView,     setSecView]     = useState("overview");
  const [intlView,    setIntlView]    = useState("hreflang");
  const [redirView,   setRedirView]   = useState("chains");
  const [robotsView,  setRobotsView]  = useState("robotstxt");
  const [contentView, setContentView] = useState("readability");
  const [a11yView,    setA11yView]    = useState("violations");
  const [geoView,     setGeoView]     = useState("score");
  const [perfSort,    setPerfSort]    = useState("response");

  // ── URL Explorer ─────────────────────────────────────────────────────────
  const [selectedPage, setSelectedPage] = useState(null);
  const [urlSearch, setUrlSearch]       = useState("");
  const [urlSort,   setUrlSort]         = useState("issues");
  const [statusFilter, setStatusFilter] = useState("all");

  // ── Issues ───────────────────────────────────────────────────────────────
  const [sevFilter, setSevFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [bulkType,  setBulkType]  = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult,  setBulkResult]  = useState(null);

  // ── History / Schedules ──────────────────────────────────────────────────
  const [history,   setHistory]   = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [newSched,  setNewSched]  = useState({ name:"", url:"", frequency:"Weekly", notifyEmail:"" });
  const [schedSaving,   setSchedSaving]   = useState(false);
  const [schedDeleting, setSchedDeleting] = useState(null);

  // ── Compare ──────────────────────────────────────────────────────────────
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");
  const [compareResult, setCompareResult] = useState(null);
  const [comparing, setComparing] = useState(false);

  // ── AI ───────────────────────────────────────────────────────────────────
  const [aiRec,       setAiRec]       = useState(null);
  const [aiRecLoading,setAiRecLoading]= useState(false);

  // ── On mount ─────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [hr, sr] = await Promise.all([
          apiFetchJSON(\`\${API}/history\`).catch(()=>({})),
          apiFetchJSON(\`\${API}/schedules\`).catch(()=>({})),
        ]);
        if (hr.history)   setHistory(hr.history);
        if (sr.schedules) setSchedules(sr.schedules);
      } catch {}
    })();
  }, []);

  // ── Keyword helpers ──────────────────────────────────────────────────────
  const addKeyword = () => {
    const parts = kwInput.split(/[,\\n]+/).map(k=>k.trim().toLowerCase()).filter(k=>k && !keywords.includes(k));
    if (parts.length) setKeywords(p=>[...p,...parts]);
    setKwInput("");
  };
  const addExclude = () => {
    const p = excludeInput.trim();
    if (p && !excludePatterns.includes(p)) setExclude(prev=>[...prev,p]);
    setExcludeInput("");
  };

  // ── Crawl ────────────────────────────────────────────────────────────────
  const crawl = async () => {
    if (!url.trim()) return;
    setLoading(true); setError(""); setResult(null); setTab("dashboard");
    setSelectedPage(null); setBulkResult(null); setAiRec(null);
    try {
      const r = await apiFetchJSON(\`\${API}/ai/crawl\`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ site:url.trim(), keywords, depth, maxPages, userAgent, crawlDelay, excludePatterns }),
      });
      if (!r.ok) throw new Error(r.error||"Crawl failed");
      setResult(r.result);
      const hr = await apiFetchJSON(\`\${API}/history\`).catch(()=>({}));
      if (hr.history) setHistory(hr.history);
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  const runBulkFix = async () => {
    if (!bulkType) return;
    setBulkLoading(true); setBulkResult(null);
    try {
      const r = await apiFetchJSON(\`\${API}/bulk-fix\`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ issueType:bulkType, pages:pages.map(p=>p.url) }) });
      setBulkResult(r);
    } catch(e) { setBulkResult({ ok:false, error:e.message }); }
    setBulkLoading(false);
  };

  const loadAiRec = async () => {
    setAiRecLoading(true); setAiRec(null);
    try {
      const r = await apiFetchJSON(\`\${API}/ai/recommendations\`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ summary:{ high:result?.high, medium:result?.medium, low:result?.low, healthScore, pages:pages.length } }) });
      if (r.ok !== false) setAiRec(r.recommendations||r.result||"");
    } catch {}
    setAiRecLoading(false);
  };

  const runCompare = async () => {
    if (!compareA || !compareB) return;
    setComparing(true); setCompareResult(null);
    try {
      const r = await apiFetchJSON(\`\${API}/compare\`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ crawlA:compareA, crawlB:compareB }) });
      setCompareResult(r);
    } catch(e) { setError(e.message); }
    setComparing(false);
  };

  const saveSchedule = async () => {
    if (!newSched.name.trim()||!newSched.url.trim()) return;
    setSchedSaving(true);
    try {
      const r = await apiFetchJSON(\`\${API}/schedules\`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ ...newSched, createdAt:new Date().toISOString() }) });
      setSchedules(p=>[...p, r.schedule||{ ...newSched, id:Date.now() }]);
      setNewSched({ name:"", url:"", frequency:"Weekly", notifyEmail:"" });
    } catch {}
    setSchedSaving(false);
  };

  const deleteSchedule = async (id) => {
    setSchedDeleting(id);
    try { await apiFetchJSON(\`\${API}/schedules/\${id}\`, { method:"DELETE" }); setSchedules(p=>p.filter(s=>s.id!==id)); } catch {}
    setSchedDeleting(null);
  };

  const exportReport = (format) => {
    let content, mime, ext;
    if (format==="json") {
      content = JSON.stringify({ site:url, crawledAt:new Date().toISOString(), healthScore, pages }, null, 2);
      mime="application/json"; ext="json";
    } else {
      const rows = [["URL","Title","Status","Issues","High","Medium","Low","Words","Response(ms)"]];
      pages.forEach(p => { const iss=p.issues||[]; rows.push([p.url,p.title||"",p.statusCode||200,iss.length,iss.filter(i=>i.severity==="high").length,iss.filter(i=>i.severity==="medium").length,iss.filter(i=>i.severity==="low").length,p.wordCount||"",p.responseTime||""]); });
      content = rows.map(r=>r.map(c=>\`"\${String(c||"").replace(/"/g,'""')}"\`).join(",")).join("\\n");
      mime="text/csv"; ext="csv";
    }
    const blob = new Blob([content],{type:mime});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=\`seo-crawl-\${new Date().toISOString().split("T")[0]}.\${ext}\`; a.click();
  };

  // ── Derived Data ─────────────────────────────────────────────────────────
  const pages       = result?.pages || [];
  const allIssues   = pages.flatMap(p=>(p.issues||[]).map(i=>({...i, pageUrl:p.url, pageTitle:p.title||p.url})));
  const healthScore = result ? Math.max(0, Math.round(100 - ((result.high||0)*8) - ((result.medium||0)*3) - ((result.low||0)*0.5))) : 0;
  const issueGroups = allIssues.reduce((acc,i)=>{ acc[i.type]=(acc[i.type]||0)+1; return acc; }, {});

  const filteredIssues = allIssues
    .filter(i => sevFilter==="all" || i.severity===sevFilter)
    .filter(i => {
      if (catFilter==="all") return true;
      const cat = ISSUE_CATEGORIES.find(c=>c.id===catFilter);
      if (!cat?.types?.length) return true;
      return cat.types.some(t=>(i.type||"").toLowerCase().replace(/\\s/g,"-").includes(t));
    });

  const urlExplorerData = [...pages]
    .filter(p => !urlSearch || (p.url||"").toLowerCase().includes(urlSearch.toLowerCase()) || (p.title||"").toLowerCase().includes(urlSearch.toLowerCase()))
    .filter(p => statusFilter==="all" || String(p.statusCode||200)===statusFilter)
    .sort((a,b) => {
      if (urlSort==="issues") return (b.issues?.length||0)-(a.issues?.length||0);
      if (urlSort==="high")   return ((b.issues||[]).filter(i=>i.severity==="high").length)-((a.issues||[]).filter(i=>i.severity==="high").length);
      if (urlSort==="words")  return (b.wordCount||0)-(a.wordCount||0);
      if (urlSort==="speed")  return (b.responseTime||0)-(a.responseTime||0);
      if (urlSort==="links")  return (b.inboundLinks||0)-(a.inboundLinks||0);
      return 0;
    });

  // Site structure
  const orphanedPages    = pages.filter(p=>(p.inboundLinks||0)===0 && !(p.url||"").endsWith("/"));
  const thinContentPages = pages.filter(p=>(p.wordCount||0)<300 && (p.wordCount||0)>0);
  const slowPages        = pages.filter(p=>(p.responseTime||0)>2500);
  const missingH1Pages   = pages.filter(p=>!p.h1);
  const missingTitlePages= pages.filter(p=>!p.title);
  const indexableCount   = pages.filter(p=>p.indexable!==false).length;
  const pagesWithSchema  = pages.filter(p=>p.hasSchema).length;
  const avgResponseTime  = pages.length ? Math.round(pages.reduce((a,p)=>a+(p.responseTime||0),0)/pages.length) : 0;
  const depthDist        = pages.reduce((acc,p)=>{ const d=p.depth||1; acc[d]=(acc[d]||0)+1; return acc; }, {});
  const h1Map            = pages.filter(p=>p.h1).map(p=>({url:p.url,h1:p.h1}));
  const linkLeaders      = [...pages].filter(p=>p.inboundLinks>0).sort((a,b)=>(b.inboundLinks||0)-(a.inboundLinks||0)).slice(0,10);

  // Security derived
  const httpsPages    = pages.filter(p=>(p.url||"").startsWith("https://"));
  const httpPages     = pages.filter(p=>(p.url||"").startsWith("http://") && !(p.url||"").startsWith("https://"));
  const mixedContent  = pages.filter(p=>p.hasMixedContent);
  const insecureForms = pages.filter(p=>p.hasInsecureForm);
  const secIssues     = result?.securityHeaders || {};
  const secScore      = Math.round(((httpsPages.length/Math.max(pages.length,1))*40) + (secIssues.hsts?15:0) + (secIssues.csp?20:0) + (secIssues.xframe?10:0) + (secIssues.xcto?10:0) + (secIssues.referrer?3:0) + (secIssues.permissions?2:0));

  // International derived
  const hreflangPages  = pages.filter(p=>p.hreflang && p.hreflang.length>0);
  const missingReturnTag = pages.filter(p=>p.hreflangErrors?.includes("missing-return-tag"));
  const invalidHreflang  = pages.filter(p=>p.hreflangErrors?.includes("invalid-lang-code"));
  const missingHtmlLang  = pages.filter(p=>!p.htmlLang);
  const hasXDefault      = pages.some(p=>(p.hreflang||[]).some(h=>h.lang==="x-default"));
  const intlScore = hreflangPages.length === 0 ? null :
    Math.round(100 - (missingReturnTag.length*20) - (invalidHreflang.length*15) - (missingHtmlLang.length/Math.max(pages.length,1)*20));

  // Redirects & Canonicals derived
  const redirectChains  = pages.filter(p=>(p.redirectChain||0)>1);
  const redirectLoops   = pages.filter(p=>p.isRedirectLoop);
  const canonicalIssues = pages.filter(p=>p.canonicalIssue);
  const canonicalLoops  = pages.filter(p=>p.canonicalIssue==="loop");
  const canonicalTo404  = pages.filter(p=>p.canonicalIssue==="points-to-404");
  const canonicalToNoindex = pages.filter(p=>p.canonicalIssue==="points-to-noindex");
  const badUrls         = pages.filter(p=>/[A-Z]/.test(p.url||"")||/[_]/.test((p.url||"").replace(/^https?:\/\//,""))||((p.url||"").length>115));

  // Content quality derived
  const duplicateTitles = (() => { const m={}; pages.forEach(p=>{ if(p.title){m[p.title]=[...(m[p.title]||[]),p.url];} }); return Object.entries(m).filter(([,u])=>u.length>1); })();
  const duplicateMeta   = (() => { const m={}; pages.forEach(p=>{ if(p.metaDescription){m[p.metaDescription]=[...(m[p.metaDescription]||[]),p.url];} }); return Object.entries(m).filter(([,u])=>u.length>1); })();
  const lowReadability  = pages.filter(p=>p.readabilityScore && p.readabilityScore<50);
  const genericAnchors  = result?.genericAnchors || [];

  // Accessibility derived
  const a11yViolations  = pages.filter(p=>(p.a11yIssues||[]).length>0);
  const missingLang     = pages.filter(p=>!p.htmlLang);
  const a11yScore       = pages.length ? Math.round(100 - (a11yViolations.length/pages.length)*60 - (missingLang.length/pages.length)*20) : 100;

  // GEO derived
  const geoPageSignals = result?.geoSignals || {};
  const geoScore = GEO_CHECKS.reduce((acc,c)=>acc+(geoPageSignals[c.id]?c.pts:0),0);
  const geoMax   = GEO_CHECKS.reduce((acc,c)=>acc+c.pts,0);
  const geoNorm  = Math.round((geoScore/geoMax)*100);

  // Sub-scores
  const technicalScore = healthScore;
  const onPageScore    = Math.round(100 - (missingTitlePages.length/Math.max(pages.length,1)*25) - (missingH1Pages.length/Math.max(pages.length,1)*20) - (thinContentPages.length/Math.max(pages.length,1)*15));
  const perfScore      = pages.length ? Math.round(100 - (slowPages.length/pages.length*40) - ((avgResponseTime>2000?30:avgResponseTime>1000?15:0))) : 100;
  const uxScore        = Math.max(0,a11yScore);

  const quickWins = [
    missingTitlePages.length>0 && { label:\`\${missingTitlePages.length} pages missing title tags\`, severity:"high", action:()=>{ setCatFilter("meta"); setSevFilter("high"); setTab("issues"); } },
    missingH1Pages.length>0    && { label:\`\${missingH1Pages.length} pages with no H1\`, severity:"high", action:()=>{ setCatFilter("headings"); setTab("issues"); } },
    httpPages.length>0         && { label:\`\${httpPages.length} pages still on HTTP\`, severity:"high", action:()=>{ setSecView("overview"); setTab("security"); } },
    mixedContent.length>0      && { label:\`\${mixedContent.length} pages with mixed content\`, severity:"high", action:()=>{ setSecView("mixed"); setTab("security"); } },
    orphanedPages.length>0     && { label:\`\${orphanedPages.length} orphaned pages\`, severity:"medium", action:()=>{ setStructView("orphans"); setTab("structure"); } },
    redirectChains.length>0    && { label:\`\${redirectChains.length} redirect chains\`, severity:"medium", action:()=>{ setRedirView("chains"); setTab("redirects"); } },
    thinContentPages.length>0  && { label:\`\${thinContentPages.length} thin content pages\`, severity:"medium", action:()=>{ setContentView("thin"); setTab("content"); } },
    slowPages.length>0         && { label:\`\${slowPages.length} slow pages >2.5s\`, severity:"medium", action:()=>setTab("performance") },
  ].filter(Boolean);

`);

parts.push(`  return (
    <div style={S.page}>

      <div style={{ marginBottom:20 }}>
        <h1 style={{ fontSize:28, fontWeight:800, color:"#fafafa", margin:0 }}>SEO Site Crawler</h1>
        <p style={{ fontSize:14, color:"#71717a", marginTop:4, marginBottom:0 }}>
          World-class technical SEO for Shopify — 15 audit modules covering security, international, accessibility, performance, content quality, AI/GEO readiness and more.
        </p>
      </div>

      {/* Stats bar */}
      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
        {[
          { label:"Crawls Run",    value:history.length,                                                                             color:"#4f46e5" },
          { label:"Pages Crawled", value:result?pages.length:"—",                                                                    color:"#818cf8" },
          { label:"Health Score",  value:result?\`\${healthScore}/100\`:"—",                                                         color:healthScore>=80?"#4ade80":healthScore>=60?"#fbbf24":"#f87171" },
          { label:"Total Issues",  value:result?allIssues.length:"—",                                                                color:allIssues.filter(i=>i.severity==="high").length>0?"#f87171":"#fbbf24" },
          { label:"GEO Score",     value:result?\`\${geoNorm}/100\`:"—",                                                             color:geoNorm>=70?"#4ade80":geoNorm>=40?"#fbbf24":"#f87171" },
          { label:"Schedules",     value:schedules.length,                                                                           color:"#60a5fa" },
        ].map(s=>(
          <div key={s.label} style={{ background:"#18181b", border:"1px solid #27272a", borderRadius:10, padding:"10px 18px" }}>
            <div style={{ fontSize:10, color:"#71717a", fontWeight:700, textTransform:"uppercase", letterSpacing:1 }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:800, color:s.color, marginTop:2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Crawl bar */}
      <div style={S.card}>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom:10 }}>
          <input style={{ ...S.input, fontSize:14 }} value={url} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&crawl()} placeholder="https://mystore.myshopify.com" />
          <button style={S.btn("primary")} onClick={crawl} disabled={loading||!url.trim()}>{loading?"Crawling...":"Crawl & Analyse"}</button>
          <button style={S.btn(showSettings?"amber":null)} onClick={()=>setShowSettings(s=>!s)}>{showSettings?"Hide Settings":"Settings"}</button>
          {result && <button style={S.btn()} onClick={()=>exportReport("csv")}>CSV</button>}
          {result && <button style={S.btn()} onClick={()=>exportReport("json")}>JSON</button>}
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, alignItems:"center", minHeight:26 }}>
          <span style={{ fontSize:11, color:"#52525b", marginRight:4 }}>KEYWORDS:</span>
          {keywords.map(kw=>(
            <span key={kw} style={{ background:"#1e1b4b", color:"#818cf8", borderRadius:20, padding:"2px 10px", fontSize:12, fontWeight:600, display:"inline-flex", alignItems:"center", gap:5 }}>
              {kw}<button onClick={()=>setKeywords(p=>p.filter(k=>k!==kw))} style={{ background:"none", border:"none", color:"#52525b", cursor:"pointer", padding:0, lineHeight:1 }}>x</button>
            </span>
          ))}
          <input value={kwInput} onChange={e=>setKwInput(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"||e.key===","){e.preventDefault();addKeyword();} }} onBlur={addKeyword}
            style={{ background:"none", border:"none", color:"#fafafa", fontSize:12, outline:"none", minWidth:160 }} placeholder="Add keywords (Enter)..." />
        </div>
        {showSettings && (
          <div style={{ marginTop:16, paddingTop:16, borderTop:"1px solid #27272a" }}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))", gap:12, marginBottom:14 }}>
              {[
                { label:"Crawl Depth",  val:depth,      set:v=>setDepth(Number(v)),      opts:[1,2,3,4,5].map(d=>({ v:d, l:\`Depth \${d}\${d===3?" (rec.)":""}\` })) },
                { label:"Max Pages",    val:maxPages,   set:v=>setMaxPages(Number(v)),   opts:[10,25,50,100,250,500].map(n=>({v:n,l:\`\${n} pages\`})) },
                { label:"User Agent",   val:userAgent,  set:v=>setUserAgent(v),          opts:USER_AGENTS.map(u=>({v:u,l:u})) },
                { label:"Crawl Delay",  val:crawlDelay, set:v=>setCrawlDelay(Number(v)), opts:[0,200,500,1000,2000].map(d=>({v:d,l:d===0?"No delay":\`\${d}ms\`})) },
              ].map(({label,val,set,opts})=>(
                <div key={label}>
                  <label style={{ fontSize:11, color:"#71717a", display:"block", marginBottom:4 }}>{label}</label>
                  <select style={{ ...S.select, width:"100%" }} value={val} onChange={e=>set(e.target.value)}>
                    {opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div>
              <label style={{ fontSize:11, color:"#71717a", display:"block", marginBottom:4 }}>Exclude URL Patterns</label>
              <div style={{ display:"flex", gap:8, marginBottom:6 }}>
                <input style={{ ...S.input, fontSize:12 }} value={excludeInput} onChange={e=>setExcludeInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addExclude()} placeholder="/cdn/ or .pdf or ?sort=" />
                <button style={S.btnSm("primary")} onClick={addExclude}>Add</button>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {excludePatterns.map(p=>(
                  <span key={p} style={{ background:"#27272a", color:"#a1a1aa", borderRadius:6, padding:"2px 10px", fontSize:12, display:"inline-flex", alignItems:"center", gap:6 }}>
                    <code>{p}</code><button onClick={()=>setExclude(prev=>prev.filter(x=>x!==p))} style={{ background:"none", border:"none", color:"#52525b", cursor:"pointer", padding:0 }}>x</button>
                  </span>
                ))}
                {excludePatterns.length===0 && <span style={{ fontSize:11, color:"#3f3f46" }}>No exclusions</span>}
              </div>
            </div>
          </div>
        )}
      </div>

      <ErrorBox message={error} />

      {loading && (
        <div style={{ ...S.card, textAlign:"center", padding:56 }}>
          <Spinner size={44} />
          <div style={{ color:"#fafafa", marginTop:20, fontSize:16, fontWeight:700 }}>Crawling {url}...</div>
          <div style={{ color:"#71717a", marginTop:8, fontSize:13 }}>Scanning all 15 audit modules — titles, meta, schema, security, hreflang, accessibility, GEO signals...</div>
          <div style={{ color:"#3f3f46", marginTop:4, fontSize:12 }}>Depth {depth} | Max {maxPages} pages | {userAgent}</div>
        </div>
      )}

      {!result && !loading && !["schedules","compare","guide"].includes(tab) && (
        <EmptyState icon="Search" title="Enter a site URL to begin" description="15 audit modules: technical SEO, security, international, accessibility, Core Web Vitals, AI/GEO readiness and more." />
      )}

      {!loading && (
        <div style={{ marginTop: result?0:24 }}>
          <MozTabs tabs={TABS} active={tab} onChange={setTab} />

`);

parts.push(`
          {/* ═══════════════════════════════════════════════════
              DASHBOARD
          ═══════════════════════════════════════════════════ */}
          {tab==="dashboard" && result && (
            <div style={{ marginTop:20 }}>
              <div style={{ ...S.card, display:"flex", gap:32, flexWrap:"wrap", alignItems:"center" }}>
                <HealthGauge score={healthScore} />
                <div style={{ flex:1, display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))", gap:10 }}>
                  {[
                    { label:"Pages",       value:pages.length,                                          color:"#4f46e5" },
                    { label:"Issues",      value:allIssues.length,                                      color:"#f87171" },
                    { label:"High",        value:allIssues.filter(i=>i.severity==="high").length,       color:"#ef4444" },
                    { label:"Medium",      value:allIssues.filter(i=>i.severity==="medium").length,     color:"#f59e0b" },
                    { label:"Low",         value:allIssues.filter(i=>i.severity==="low").length,        color:"#22c55e" },
                    { label:"Clean",       value:pages.filter(p=>(p.issues||[]).length===0).length,     color:"#818cf8" },
                    { label:"Indexable",   value:indexableCount,                                        color:"#60a5fa" },
                    { label:"Avg Speed",   value:avgResponseTime?\`\${avgResponseTime}ms\`:"—",          color:avgResponseTime>2500?"#f87171":"#4ade80" },
                  ].map(m=>(
                    <div key={m.label} style={S.inset}>
                      <div style={{ fontSize:10, color:"#71717a", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>{m.label}</div>
                      <div style={{ fontSize:20, fontWeight:900, color:m.color, lineHeight:1 }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category sub-scores */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:12, marginBottom:16 }}>
                <SubScore label="Technical" score={technicalScore} />
                <SubScore label="On-Page"   score={Math.max(0,onPageScore)} />
                <SubScore label="Security"  score={Math.min(100,secScore)} color="#60a5fa" />
                <SubScore label="Performance" score={Math.max(0,perfScore)} />
                <SubScore label="Accessibility" score={uxScore} />
                <SubScore label="AI / GEO"  score={geoNorm} color="#a78bfa" />
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:16 }}>
                <div style={S.card}>
                  <div style={S.sT}>Priority Quick Wins</div>
                  {quickWins.length===0 ? <div style={{ color:"#4ade80", fontWeight:700, fontSize:13 }}>No critical issues — site is technically healthy!</div>
                  : quickWins.map((w,i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom:"1px solid #1f1f22" }}>
                      <span style={S.badge(w.severity)}>{w.severity}</span>
                      <div style={{ flex:1, fontSize:13, color:"#e4e4e7" }}>{w.label}</div>
                      <button style={S.btnSm("primary")} onClick={w.action}>View</button>
                    </div>
                  ))}
                </div>

                <div style={S.card}>
                  <div style={S.sT}>Issues by Category</div>
                  {ISSUE_CATEGORIES.filter(c=>c.id!=="all").map(cat=>{
                    const ci = allIssues.filter(i=>(cat.types||[]).some(t=>(i.type||"").toLowerCase().replace(/\\s/g,"-").includes(t)));
                    const h  = ci.filter(i=>i.severity==="high").length;
                    const m  = ci.filter(i=>i.severity==="medium").length;
                    return (
                      <div key={cat.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 0", borderBottom:"1px solid #1f1f22", cursor:"pointer" }} onClick={()=>{ setCatFilter(cat.id); setTab("issues"); }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, fontWeight:600, color:"#e4e4e7", marginBottom:3 }}>{cat.label}</div>
                          <Bar value={ci.length} max={Math.max(allIssues.length,1)} color={h>0?"#ef4444":m>0?"#f59e0b":"#22c55e"} height={4} />
                        </div>
                        <div style={{ display:"flex", gap:4 }}>
                          {h>0 && <span style={S.badge("high")}>{h}</span>}
                          {m>0 && <span style={S.badge("medium")}>{m}</span>}
                          {ci.length===0 && <span style={S.badge("good")}>ok</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={S.card}>
                  <div style={S.sT}>Technical SEO Checklist</div>
                  {[
                    { t:"Unique title tags", pass:!allIssues.find(i=>(i.type||"").includes("title")) },
                    { t:"Meta descriptions present", pass:!allIssues.find(i=>(i.type||"").includes("meta-description")) },
                    { t:"No 404 / broken links",     pass:!allIssues.find(i=>(i.type||"").includes("404")||(i.type||"").includes("broken")) },
                    { t:"All images have alt text",  pass:!allIssues.find(i=>(i.type||"").includes("alt")) },
                    { t:"Schema markup on key pages",pass:pagesWithSchema>0 },
                    { t:"No noindex on live pages",  pass:!allIssues.find(i=>(i.type||"").includes("noindex")) },
                    { t:"No redirect chains",        pass:redirectChains.length===0 },
                    { t:"H1 on all pages",           pass:missingH1Pages.length===0 },
                    { t:"No orphaned pages",         pass:orphanedPages.length===0 },
                    { t:"HTTPS throughout",          pass:httpPages.length===0 },
                    { t:"No mixed content",          pass:mixedContent.length===0 },
                    { t:"HTML lang attribute set",   pass:missingHtmlLang.length===0 },
                  ].map(({t,pass})=>(
                    <div key={t} style={{ display:"flex", gap:8, alignItems:"center", padding:"5px 0", borderBottom:"1px solid #1f1f22" }}>
                      <span style={{ color:pass?"#4ade80":"#f87171", fontSize:14 }}>{pass?"✓":"✗"}</span>
                      <span style={{ fontSize:12, color:pass?"#e4e4e7":"#a1a1aa" }}>{t}</span>
                    </div>
                  ))}
                </div>

                <div style={S.card}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                    <div style={S.sT}>AI Action Plan</div>
                    <button style={S.btnSm("primary")} onClick={loadAiRec} disabled={aiRecLoading}>{aiRecLoading?"Analysing...":"Generate"}</button>
                  </div>
                  {aiRecLoading && <Spinner size={28} />}
                  {aiRec && <div style={{ fontSize:13, color:"#c7d2fe", lineHeight:1.7, background:"#1e1b4b", borderRadius:8, padding:"12px 14px", border:"1px solid #3730a3", whiteSpace:"pre-wrap" }}>{typeof aiRec==="string"?aiRec:JSON.stringify(aiRec,null,2)}</div>}
                  {!aiRec && !aiRecLoading && <p style={{ fontSize:13, color:"#52525b", lineHeight:1.6 }}>AI-prioritised fix plan with estimated SEO impact for your specific crawl results.</p>}
                </div>
              </div>
            </div>
          )}

`);

parts.push(`
          {/* ═══════════════════════════════════════════════════
              URL EXPLORER
          ═══════════════════════════════════════════════════ */}
          {tab==="explorer" && result && (
            <div style={{ marginTop:20 }}>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
                <input style={{ ...S.input, maxWidth:320 }} value={urlSearch} onChange={e=>setUrlSearch(e.target.value)} placeholder="Search URLs or titles..." />
                <select style={S.select} value={urlSort} onChange={e=>setUrlSort(e.target.value)}>
                  {[["issues","Issues"],["high","High Issues"],["words","Word Count"],["speed","Response Time"],["links","Inbound Links"]].map(([v,l])=><option key={v} value={v}>Sort: {l}</option>)}
                </select>
                <select style={S.select} value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
                  <option value="all">All Status</option><option value="200">200 OK</option><option value="301">301</option><option value="302">302</option><option value="404">404</option><option value="500">5xx</option>
                </select>
                <div style={{ fontSize:12, color:"#52525b", alignSelf:"center", marginLeft:"auto" }}>{urlExplorerData.length}/{pages.length} pages</div>
              </div>
              {selectedPage ? (
                <div style={{ ...S.card, marginBottom:20 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                    <div>
                      <h2 style={{ margin:0, fontSize:18, fontWeight:800, color:"#fafafa" }}>{selectedPage.title||"(no title)"}</h2>
                      <code style={{ fontSize:12, color:"#818cf8", marginTop:4, display:"block" }}>{selectedPage.url}</code>
                    </div>
                    <button style={S.btnSm()} onClick={()=>setSelectedPage(null)}>Back</button>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:10, marginBottom:16 }}>
                    {[
                      { label:"Status",    v:selectedPage.statusCode||200,   color:(selectedPage.statusCode||200)<300?"#4ade80":"#f87171" },
                      { label:"Words",     v:selectedPage.wordCount||"—",    color:(selectedPage.wordCount||0)<300?"#fbbf24":"#4ade80" },
                      { label:"Response",  v:selectedPage.responseTime?\`\${selectedPage.responseTime}ms\`:"—", color:(selectedPage.responseTime||0)>2500?"#f87171":"#4ade80" },
                      { label:"Inbound Links", v:selectedPage.inboundLinks??"—", color:"#4f46e5" },
                      { label:"Images",    v:selectedPage.imageCount??"—",   color:"#a1a1aa" },
                      { label:"Depth",     v:selectedPage.depth??"—",        color:"#a1a1aa" },
                      { label:"Indexable", v:selectedPage.indexable===false?"No":"Yes", color:selectedPage.indexable===false?"#f87171":"#4ade80" },
                      { label:"HTTPS",     v:(selectedPage.url||"").startsWith("https")?"Yes":"No", color:(selectedPage.url||"").startsWith("https")?"#4ade80":"#f87171" },
                    ].map(({label,v,color})=>(
                      <div key={label} style={S.inset}>
                        <div style={{ fontSize:10, color:"#71717a", textTransform:"uppercase", letterSpacing:0.5 }}>{label}</div>
                        <div style={{ fontSize:16, fontWeight:800, color, marginTop:3 }}>{String(v)}</div>
                      </div>
                    ))}
                  </div>
                  {selectedPage.h1 && <div style={{ marginBottom:10 }}><div style={S.sT}>H1</div><div style={{ fontSize:14, color:"#e4e4e7", fontWeight:600 }}>{selectedPage.h1}</div></div>}
                  {selectedPage.metaDescription && <div style={{ marginBottom:10 }}><div style={S.sT}>Meta Description ({selectedPage.metaDescription.length} chars)</div><div style={{ fontSize:13, color:"#a1a1aa", lineHeight:1.5 }}>{selectedPage.metaDescription}</div></div>}
                  {selectedPage.canonical && <div style={{ marginBottom:10 }}><div style={S.sT}>Canonical</div><code style={{ fontSize:12, color:"#818cf8" }}>{selectedPage.canonical}</code></div>}
                  {(selectedPage.hreflang||[]).length>0 && (
                    <div style={{ marginBottom:10 }}>
                      <div style={S.sT}>Hreflang ({selectedPage.hreflang.length})</div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                        {selectedPage.hreflang.map((h,i)=><span key={i} style={{ background:"#1e1b4b", color:"#818cf8", borderRadius:4, padding:"2px 8px", fontSize:11 }}>{h.lang}: {h.url}</span>)}
                      </div>
                    </div>
                  )}
                  <div style={S.sT}>{(selectedPage.issues||[]).length} Issues</div>
                  {(selectedPage.issues||[]).length===0 ? <div style={{ color:"#4ade80", fontWeight:700, fontSize:13 }}>No issues on this page</div>
                  : selectedPage.issues.map((issue,i)=><IssueRow key={i} issue={issue} pageUrl={selectedPage.url} index={i} />)}
                </div>
              ) : (
                <div style={{ background:"#18181b", border:"1px solid #27272a", borderRadius:12, overflow:"hidden" }}>
                  <div style={{ overflowX:"auto" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse" }}>
                      <thead><tr>{["URL / Title","Status","Issues","Words","Response","Links","Indexable"].map(h=><th key={h} style={S.th}>{h}</th>)}</tr></thead>
                      <tbody>
                        {urlExplorerData.map((p,i)=>{
                          const iss=p.issues||[];
                          const h=iss.filter(x=>x.severity==="high").length;
                          const m=iss.filter(x=>x.severity==="medium").length;
                          return (
                            <tr key={i} style={{ cursor:"pointer" }} onClick={()=>setSelectedPage(p)}>
                              <td style={S.td}><div style={{ fontWeight:600, color:"#e4e4e7", fontSize:13 }}>{p.title||"(no title)"}</div><div style={{ fontFamily:"monospace", fontSize:11, color:"#52525b", marginTop:2 }}>{(p.url||"").replace(/^https?:\\/\\/[^/]+/,"")}</div></td>
                              <td style={S.td}><span style={{ color:(p.statusCode||200)<300?"#4ade80":"#f87171", fontWeight:700 }}>{p.statusCode||200}</span></td>
                              <td style={S.td}>{h>0&&<span style={{...S.badge("high"),marginRight:4}}>{h}</span>}{m>0&&<span style={{...S.badge("medium"),marginRight:4}}>{m}</span>}{iss.length===0&&<span style={S.badge("good")}>ok</span>}</td>
                              <td style={{...S.td, color:(p.wordCount||0)<300&&p.wordCount?"#fbbf24":"#a1a1aa"}}>{p.wordCount||"—"}</td>
                              <td style={{...S.td, color:(p.responseTime||0)>2500?"#f87171":(p.responseTime||0)>0?"#4ade80":"#a1a1aa"}}>{p.responseTime?\`\${p.responseTime}ms\`:"—"}</td>
                              <td style={S.td}>{p.inboundLinks??"—"}</td>
                              <td style={S.td}>{p.indexable===false?<span style={S.badge("high")}>No</span>:<span style={S.badge("good")}>Yes</span>}</td>
                            </tr>
                          );
                        })}
                        {urlExplorerData.length===0 && <tr><td colSpan={7} style={{...S.td,textAlign:"center",color:"#52525b",padding:32}}>No pages match your filters</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

`);

parts.push(`
          {/* ═══════════════════════════════════════════════════
              ISSUES
          ═══════════════════════════════════════════════════ */}
          {tab==="issues" && result && (
            <div style={{ marginTop:20 }}>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:14 }}>
                <select style={S.select} value={sevFilter} onChange={e=>setSevFilter(e.target.value)}>
                  <option value="all">All Severities</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                </select>
                <select style={S.select} value={catFilter} onChange={e=>setCatFilter(e.target.value)}>
                  {ISSUE_CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <div style={{ fontSize:12, color:"#52525b", alignSelf:"center", marginLeft:"auto" }}>{filteredIssues.length} issues</div>
                <button style={S.btnSm()} onClick={()=>{ setSevFilter("all"); setCatFilter("all"); }}>Clear</button>
              </div>
              <div style={{ ...S.card2, border:"1px solid #3730a3", marginBottom:14 }}>
                <div style={S.sT}>Bulk AI Fix</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
                  <select style={{...S.select,flex:1}} value={bulkType} onChange={e=>setBulkType(e.target.value)}>
                    <option value="">Select issue type to bulk fix...</option>
                    {Object.entries(issueGroups).sort((a,b)=>b[1]-a[1]).map(([type,count])=><option key={type} value={type}>{type} — {count} occurrence{count!==1?"s":""}</option>)}
                  </select>
                  <button style={S.btn("primary")} onClick={runBulkFix} disabled={bulkLoading||!bulkType}>{bulkLoading?"Generating...":"Bulk Fix All"}</button>
                </div>
                {bulkResult && <div style={{ marginTop:10, fontSize:13, color:bulkResult.ok?"#4ade80":"#f87171" }}>{bulkResult.ok?\`Generated \${(bulkResult.fixes||[]).length} fixes\`:bulkResult.error}</div>}
              </div>
              {/* Issue coverage bars */}
              <div style={{ ...S.card, marginBottom:14 }}>
                <div style={S.sT}>Issue Coverage by Type</div>
                {Object.entries(issueGroups).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([type,count])=>{
                  const sev=(allIssues.find(i=>i.type===type)||{}).severity||"low";
                  return (
                    <div key={type} style={{ marginBottom:10 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                        <span style={{ color:"#e4e4e7" }}>{type}</span>
                        <span style={{...S.badge(sev), marginLeft:8}}>{count} ({pages.length?Math.round(count/pages.length*100):0}% of pages)</span>
                      </div>
                      <Bar value={count} max={pages.length} color={sev==="high"?"#ef4444":sev==="medium"?"#f59e0b":"#22c55e"} height={5} />
                    </div>
                  );
                })}
              </div>
              {filteredIssues.length===0
                ? <EmptyState icon="Check" title="No issues match these filters" description="Try clearing filters." />
                : (
                  <div style={{ background:"#18181b", border:"1px solid #27272a", borderRadius:12, overflow:"hidden" }}>
                    {filteredIssues.slice(0,150).map((issue,i)=><IssueRow key={i} issue={issue} pageUrl={issue.pageUrl} index={i} />)}
                    {filteredIssues.length>150 && <div style={{ textAlign:"center", padding:14, fontSize:12, color:"#52525b" }}>Showing 150 of {filteredIssues.length} — use filters to narrow down.</div>}
                  </div>
                )
              }
            </div>
          )}

`);

parts.push(`
          {/* ═══════════════════════════════════════════════════
              SECURITY  (NEW)
          ═══════════════════════════════════════════════════ */}
          {tab==="security" && result && (
            <div style={{ marginTop:20 }}>
              <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
                {[{id:"overview",l:"HTTPS Overview"},{id:"headers",l:"Security Headers"},{id:"mixed",l:"Mixed Content"},{id:"forms",l:"Forms"}].map(v=>(
                  <button key={v.id} style={S.btn(secView===v.id?"primary":null)} onClick={()=>setSecView(v.id)}>{v.l}</button>
                ))}
              </div>

              {/* Sub-score */}
              <div style={{ ...S.card, display:"flex", gap:20, alignItems:"center", flexWrap:"wrap", marginBottom:16 }}>
                <SubScore label="Security Score" score={Math.min(100,secScore)} color="#60a5fa" />
                <div style={{ flex:1, display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))", gap:10 }}>
                  {[
                    { label:"HTTPS Pages",   value:httpsPages.length,   color:"#4ade80" },
                    { label:"HTTP Pages",    value:httpPages.length,    color:httpPages.length>0?"#f87171":"#4ade80" },
                    { label:"Mixed Content", value:mixedContent.length, color:mixedContent.length>0?"#f87171":"#4ade80" },
                    { label:"Insecure Forms",value:insecureForms.length,color:insecureForms.length>0?"#f87171":"#4ade80" },
                  ].map(m=><div key={m.label} style={S.inset}><div style={{ fontSize:10, color:"#71717a", fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{m.label}</div><div style={{ fontSize:20, fontWeight:900, color:m.color }}>{m.value}</div></div>)}
                </div>
              </div>

              {secView==="overview" && (
                <div style={S.card}>
                  <div style={S.sT}>HTTPS Coverage</div>
                  <Coverage affected={httpsPages.length} total={pages.length} label="HTTPS pages" sev="good" />
                  <Coverage affected={httpPages.length}  total={pages.length} label="HTTP pages (needs fixing)" sev="high" />
                  {httpPages.length>0 && (
                    <div style={{ marginTop:14 }}>
                      <div style={S.sT}>HTTP Pages — Fix Required</div>
                      {httpPages.slice(0,20).map((p,i)=>(
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 0", borderBottom:"1px solid #1f1f22" }}>
                          <span style={S.badge("high")}>HTTP</span>
                          <code style={{ fontSize:12, color:"#f87171", flex:1 }}>{p.url}</code>
                        </div>
                      ))}
                      {httpPages.length>20 && <div style={{ fontSize:12, color:"#52525b", marginTop:8 }}>...and {httpPages.length-20} more</div>}
                    </div>
                  )}
                  {httpPages.length===0 && <div style={{ color:"#4ade80", fontWeight:700, fontSize:13, marginTop:10 }}>✓ All pages served over HTTPS</div>}
                </div>
              )}

              {secView==="headers" && (
                <div style={S.card}>
                  <div style={S.sT}>HTTP Security Headers</div>
                  <p style={{ fontSize:13, color:"#71717a", marginBottom:16, lineHeight:1.6 }}>Security headers protect users from XSS, clickjacking, and protocol downgrade attacks. All modern Shopify stores should implement these.</p>
                  {SEC_HEADERS.map(h=>{
                    const present = secIssues[h.key];
                    return (
                      <div key={h.key} style={{ padding:"12px 0", borderBottom:"1px solid #1f1f22" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                          <span style={{ color:present?"#4ade80":"#f87171", fontSize:16 }}>{present?"✓":"✗"}</span>
                          <span style={{ fontWeight:700, color:"#e4e4e7", fontSize:13 }}>{h.name}</span>
                          <span style={S.badge(present?"good":h.sev)}>{present?"Present":"Missing"}</span>
                        </div>
                        <div style={{ fontSize:12, color:"#71717a", lineHeight:1.5, marginLeft:26 }}>{h.desc}</div>
                        {present && secIssues[\`\${h.key}_value\`] && <code style={{ display:"block", fontSize:11, color:"#52525b", marginLeft:26, marginTop:4 }}>{secIssues[\`\${h.key}_value\`]}</code>}
                      </div>
                    );
                  })}
                </div>
              )}

              {secView==="mixed" && (
                <div style={S.card}>
                  <div style={S.sT}>Mixed Content — {mixedContent.length} pages affected</div>
                  <p style={{ fontSize:13, color:"#71717a", marginBottom:14, lineHeight:1.6 }}>Mixed content occurs when an HTTPS page loads resources (images, scripts, CSS) over HTTP. Chrome marks these pages as "Not Secure" and blocks active mixed content (scripts/stylesheets).</p>
                  {mixedContent.length===0 ? <div style={{ color:"#4ade80", fontWeight:700, fontSize:13 }}>✓ No mixed content detected</div>
                  : mixedContent.map((p,i)=>(
                    <div key={i} style={{ padding:"10px 0", borderBottom:"1px solid #1f1f22" }}>
                      <div style={{ fontSize:13, fontWeight:600, color:"#e4e4e7" }}>{p.title||"(no title)"}</div>
                      <code style={{ fontSize:11, color:"#f87171" }}>{p.url}</code>
                      {(p.mixedResources||[]).length>0 && <div style={{ fontSize:11, color:"#71717a", marginTop:4 }}>Mixed resources: {(p.mixedResources||[]).slice(0,3).join(", ")}{(p.mixedResources||[]).length>3?\`... +\${p.mixedResources.length-3} more`:""}</div>}
                    </div>
                  ))}
                </div>
              )}

              {secView==="forms" && (
                <div style={S.card}>
                  <div style={S.sT}>Insecure Forms — {insecureForms.length} pages</div>
                  <p style={{ fontSize:13, color:"#71717a", marginBottom:14, lineHeight:1.6 }}>Forms that submit over HTTP expose user data. Any form collecting personal information, passwords, or payment details must submit to an HTTPS endpoint.</p>
                  {insecureForms.length===0 ? <div style={{ color:"#4ade80", fontWeight:700, fontSize:13 }}>✓ No insecure forms detected</div>
                  : insecureForms.map((p,i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid #1f1f22" }}>
                      <span style={S.badge("critical")}>Critical</span>
                      <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:600, color:"#e4e4e7" }}>{p.title||"(no title)"}</div><code style={{ fontSize:11, color:"#52525b" }}>{p.url}</code></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

`);

parts.push(`
          {/* ═══════════════════════════════════════════════════
              INTERNATIONAL  (NEW)
          ═══════════════════════════════════════════════════ */}
          {tab==="international" && result && (
            <div style={{ marginTop:20 }}>
              <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
                {[{id:"hreflang",l:"Hreflang Audit"},{id:"htmllang",l:"HTML Lang"},{id:"guide",l:"Hreflang Guide"}].map(v=>(
                  <button key={v.id} style={S.btn(intlView===v.id?"primary":null)} onClick={()=>setIntlView(v.id)}>{v.l}</button>
                ))}
              </div>

              <div style={{ ...S.card, display:"flex", gap:20, alignItems:"center", flexWrap:"wrap", marginBottom:16 }}>
                {intlScore!=null ? <SubScore label="Hreflang Score" score={Math.max(0,intlScore)} color="#818cf8" /> : <div style={{ fontSize:13, color:"#52525b", padding:"10px 0" }}>No hreflang detected on this site</div>}
                <div style={{ flex:1, display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))", gap:10 }}>
                  {[
                    { label:"Pages with hreflang",  value:hreflangPages.length,    color:"#818cf8" },
                    { label:"Missing return tags",   value:missingReturnTag.length, color:missingReturnTag.length>0?"#f87171":"#4ade80" },
                    { label:"Invalid lang codes",    value:invalidHreflang.length,  color:invalidHreflang.length>0?"#f87171":"#4ade80" },
                    { label:"Has x-default",         value:hasXDefault?"Yes":"No",  color:hasXDefault?"#4ade80":"#fbbf24" },
                  ].map(m=><div key={m.label} style={S.inset}><div style={{ fontSize:10, color:"#71717a", fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{m.label}</div><div style={{ fontSize:16, fontWeight:900, color:m.color }}>{m.value}</div></div>)}
                </div>
              </div>

              {intlView==="hreflang" && (
                <div>
                  {hreflangPages.length===0 ? (
                    <div style={S.card}>
                      <div style={S.sT}>No Hreflang Detected</div>
                      <p style={{ fontSize:13, color:"#71717a", lineHeight:1.6 }}>This site has no hreflang annotations. If you target multiple countries or languages, hreflang is essential — without it Google may show the wrong language version in search results.</p>
                    </div>
                  ) : (
                    <>
                      {missingReturnTag.length>0 && (
                        <div style={{ ...S.card, border:"1px solid #f8717130" }}>
                          <div style={S.sT}>Missing Return Tags — {missingReturnTag.length} pages</div>
                          <p style={{ fontSize:13, color:"#71717a", marginBottom:12, lineHeight:1.6 }}>Hreflang must be reciprocal. If page A points to page B as its Spanish translation, page B must also point back to page A as its English version. Missing return tags cause Google to ignore the entire hreflang cluster.</p>
                          {missingReturnTag.slice(0,15).map((p,i)=>(
                            <div key={i} style={{ padding:"7px 0", borderBottom:"1px solid #1f1f22" }}>
                              <div style={{ fontSize:13, fontWeight:600, color:"#e4e4e7" }}>{p.title||"(no title)"}</div>
                              <code style={{ fontSize:11, color:"#52525b" }}>{p.url}</code>
                            </div>
                          ))}
                        </div>
                      )}
                      {invalidHreflang.length>0 && (
                        <div style={{ ...S.card, border:"1px solid #fbbf2430" }}>
                          <div style={S.sT}>Invalid Language Codes — {invalidHreflang.length} pages</div>
                          <p style={{ fontSize:13, color:"#71717a", marginBottom:12, lineHeight:1.6 }}>Hreflang language codes must use ISO 639-1 (e.g. en, es, de) optionally combined with ISO 3166-1 region codes (e.g. en-GB, es-MX). Invalid codes are silently ignored by Google.</p>
                          {invalidHreflang.slice(0,15).map((p,i)=>(
                            <div key={i} style={{ padding:"7px 0", borderBottom:"1px solid #1f1f22" }}>
                              <div style={{ fontSize:13, fontWeight:600, color:"#e4e4e7" }}>{p.title||"(no title)"}</div>
                              <code style={{ fontSize:11, color:"#52525b" }}>{p.url}</code>
                              {p.hreflangErrors && <div style={{ fontSize:11, color:"#fbbf24", marginTop:2 }}>{p.hreflangErrors.join(", ")}</div>}
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={S.card}>
                        <div style={S.sT}>Hreflang Coverage — {hreflangPages.length} pages</div>
                        {hreflangPages.slice(0,20).map((p,i)=>(
                          <div key={i} style={{ padding:"9px 0", borderBottom:"1px solid #1f1f22" }}>
                            <div style={{ fontSize:13, fontWeight:600, color:"#e4e4e7", marginBottom:4 }}>{p.title||p.url}</div>
                            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                              {(p.hreflang||[]).map((h,j)=><span key={j} style={{ background:"#1e1b4b", color:"#818cf8", borderRadius:4, padding:"2px 8px", fontSize:11, fontWeight:600 }}>{h.lang}</span>)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {intlView==="htmllang" && (
                <div style={S.card}>
                  <div style={S.sT}>HTML Lang Attribute — {missingHtmlLang.length} pages missing</div>
                  <p style={{ fontSize:13, color:"#71717a", marginBottom:14, lineHeight:1.6 }}>The HTML lang attribute tells search engines and screen readers what language a page is in. Bing uses HTML lang (not hreflang) for language/region targeting. WCAG 2.1 requires it for accessibility compliance.</p>
                  <Coverage affected={pages.length-missingHtmlLang.length} total={pages.length} label="Pages with HTML lang set" sev="good" />
                  <Coverage affected={missingHtmlLang.length} total={pages.length} label="Pages missing HTML lang" sev="high" />
                  {missingHtmlLang.length>0 && (
                    <div style={{ marginTop:14 }}>
                      {missingHtmlLang.slice(0,15).map((p,i)=>(
                        <div key={i} style={{ padding:"7px 0", borderBottom:"1px solid #1f1f22" }}>
                          <div style={{ fontSize:13, color:"#e4e4e7" }}>{p.title||"(no title)"}</div>
                          <code style={{ fontSize:11, color:"#52525b" }}>{p.url}</code>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {intlView==="guide" && (
                <div style={S.card}>
                  <div style={S.sT}>Hreflang Implementation Guide</div>
                  {[
                    { t:"Use absolute URLs", d:"Always use absolute URLs in hreflang annotations — relative URLs are not supported and will be ignored." },
                    { t:"Reciprocal tags required", d:"Every page in a hreflang cluster must reference all other pages, including itself. Missing return tags cause Google to discard the entire cluster." },
                    { t:"Use ISO 639-1 language codes", d:"Languages: en, es, de, fr, zh, ja. Regions: en-GB, en-US, es-MX, zh-TW. Language must always come before region." },
                    { t:"Add x-default for unmatched regions", d:"x-default specifies the fallback page for users in regions not covered by your hreflang cluster. Usually your primary English page." },
                    { t:"Hreflang in sitemap vs. HTML", d:"You can implement hreflang in HTML <head>, HTTP headers, or XML sitemaps. Choose one method — mixing methods risks conflicts." },
                    { t:"Canonicals must align with hreflang", d:"Pages referenced in hreflang must be indexable and self-canonicalized. Pointing hreflang to a noindex or canonicalized URL breaks the cluster." },
                    { t:"Bing uses HTML lang, not hreflang", d:"Bing ignores hreflang entirely. For Bing, use the HTML lang attribute and Content-Language HTTP header." },
                  ].map(({t,d})=>(
                    <div key={t} style={S.row}>
                      <span style={{ color:"#818cf8", flexShrink:0 }}>i</span>
                      <div><div style={{ fontSize:13, fontWeight:700, color:"#e4e4e7", marginBottom:2 }}>{t}</div><div style={{ fontSize:12, color:"#71717a", lineHeight:1.6 }}>{d}</div></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

`);

parts.push(`
          {/* ═══════════════════════════════════════════════════
              REDIRECTS & CANONICALS  (NEW)
          ═══════════════════════════════════════════════════ */}
          {tab==="redirects" && result && (
            <div style={{ marginTop:20 }}>
              <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
                {[{id:"chains",l:"Redirect Chains"},{id:"canonicals",l:"Canonical Issues"},{id:"urls",l:"URL Quality"}].map(v=>(
                  <button key={v.id} style={S.btn(redirView===v.id?"primary":null)} onClick={()=>setRedirView(v.id)}>{v.l}</button>
                ))}
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:10, marginBottom:16 }}>
                {[
                  { label:"Redirect Chains", value:redirectChains.length, color:redirectChains.length>0?"#f87171":"#4ade80" },
                  { label:"Redirect Loops",  value:redirectLoops.length,  color:redirectLoops.length>0?"#fca5a5":"#4ade80" },
                  { label:"Canonical Issues",value:canonicalIssues.length,color:canonicalIssues.length>0?"#fbbf24":"#4ade80" },
                  { label:"Bad URL Patterns",value:badUrls.length,        color:badUrls.length>0?"#fbbf24":"#4ade80" },
                ].map(m=><div key={m.label} style={S.inset}><div style={{ fontSize:10, color:"#71717a", fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{m.label}</div><div style={{ fontSize:20, fontWeight:900, color:m.color }}>{m.value}</div></div>)}
              </div>

              {redirView==="chains" && (
                <div>
                  <div style={S.card}>
                    <div style={S.sT}>Redirect Chains — {redirectChains.length} URLs</div>
                    <p style={{ fontSize:13, color:"#71717a", marginBottom:14, lineHeight:1.6 }}>A redirect chain occurs when a URL redirects to another URL that also redirects. Each extra hop loses PageRank, adds latency, and risks Googlebot abandoning the chain. Maximum 2 hops (1 redirect).</p>
                    {redirectChains.length===0 ? <div style={{ color:"#4ade80", fontWeight:700, fontSize:13 }}>✓ No redirect chains found</div>
                    : redirectChains.map((p,i)=>(
                      <div key={i} style={{ padding:"10px 0", borderBottom:"1px solid #1f1f22" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                          <span style={S.badge("medium")}>{p.redirectChain}-hop chain</span>
                          <div style={{ fontSize:13, fontWeight:600, color:"#e4e4e7" }}>{p.title||"(no title)"}</div>
                        </div>
                        <code style={{ fontSize:11, color:"#52525b" }}>{p.url}</code>
                        {(p.redirectPath||[]).length>0 && (
                          <div style={{ marginTop:6, paddingLeft:10, borderLeft:"2px solid #27272a" }}>
                            {p.redirectPath.map((step,j)=><div key={j} style={{ fontSize:11, color:"#71717a", marginBottom:2 }}>{j+1}. {step}</div>)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {redirectLoops.length>0 && (
                    <div style={{ ...S.card, border:"1px solid #f8717130" }}>
                      <div style={S.sT}>Redirect Loops — {redirectLoops.length} URLs (Critical)</div>
                      <p style={{ fontSize:13, color:"#71717a", marginBottom:12, lineHeight:1.6 }}>Redirect loops are infinite cycles (A→B→A). They completely block Googlebot and return errors to users. Must be fixed immediately.</p>
                      {redirectLoops.map((p,i)=>(
                        <div key={i} style={{ padding:"8px 0", borderBottom:"1px solid #1f1f22" }}>
                          <span style={S.badge("critical")}>Loop</span>
                          <code style={{ fontSize:12, color:"#f87171", marginLeft:8 }}>{p.url}</code>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {redirView==="canonicals" && (
                <div>
                  {[
                    { list:canonicalLoops,     title:"Canonical Loops", sev:"critical", desc:"The canonical tag points to a URL that canonicalises back to the original — an infinite loop that confuses Googlebot." },
                    { list:canonicalTo404,     title:"Canonical points to 404", sev:"high", desc:"Pages with a canonical pointing to a 404 URL signal to Google that the preferred URL is broken." },
                    { list:canonicalToNoindex, title:"Canonical points to noindex", sev:"high", desc:"A canonical pointing to a noindex page effectively asks Google not to index the canonicalised content." },
                    { list:canonicalIssues.filter(p=>!["loop","points-to-404","points-to-noindex"].includes(p.canonicalIssue)), title:"Other Canonical Issues", sev:"medium", desc:"Mismatched canonicals, relative canonical URLs, canonical outside <head>, etc." },
                  ].map(({list,title,sev,desc})=>(
                    <div key={title} style={S.card}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                        <span style={S.badge(sev)}>{sev}</span>
                        <div style={S.sT}>{title} — {list.length} pages</div>
                      </div>
                      <p style={{ fontSize:13, color:"#71717a", marginBottom:10, lineHeight:1.5 }}>{desc}</p>
                      {list.length===0 ? <div style={{ color:"#4ade80", fontSize:13 }}>✓ None found</div>
                      : list.slice(0,15).map((p,i)=>(
                        <div key={i} style={{ padding:"7px 0", borderBottom:"1px solid #1f1f22" }}>
                          <div style={{ fontSize:13, color:"#e4e4e7" }}>{p.title||"(no title)"}</div>
                          <code style={{ fontSize:11, color:"#52525b" }}>{p.url}</code>
                          {p.canonical && <div style={{ fontSize:11, color:"#71717a", marginTop:2 }}>Canonical: <code>{p.canonical}</code></div>}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {redirView==="urls" && (
                <div style={S.card}>
                  <div style={S.sT}>URL Quality Issues — {badUrls.length} URLs</div>
                  <p style={{ fontSize:13, color:"#71717a", marginBottom:14, lineHeight:1.6 }}>Clean, lowercase, hyphenated URLs are preferred by Google. Uppercase letters, underscores, long URLs (115+ chars), and non-ASCII characters all reduce URL quality.</p>
                  {[
                    { list:pages.filter(p=>/[A-Z]/.test(p.url||"")),                                                           label:"URLs with uppercase characters", fix:"301-redirect all uppercase URLs to their lowercase equivalent." },
                    { list:pages.filter(p=>/[_]/.test((p.url||"").replace(/^https?:\\/\\/[^/]+/,""))),                        label:"URLs with underscores",           fix:"Use hyphens instead of underscores. Underscores are word-joiners, not word-separators in Google's eyes." },
                    { list:pages.filter(p=>(p.url||"").length>115),                                                            label:"URLs over 115 characters",        fix:"Shorten URL slugs. Remove stop words, dates, and categories from the URL structure." },
                    { list:pages.filter(p=>/[^\\x00-\\x7F]/.test(p.url||"")),                                                  label:"URLs with non-ASCII characters",  fix:"Use ASCII-only URL slugs. Non-ASCII characters get percent-encoded which looks ugly and can break analytics." },
                  ].map(({list,label,fix})=>(
                    <div key={label} style={{ marginBottom:14, paddingBottom:14, borderBottom:"1px solid #1f1f22" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                        <span style={{ fontSize:13, fontWeight:600, color:"#e4e4e7" }}>{label}</span>
                        <span style={S.badge(list.length>0?"medium":"good")}>{list.length} URLs</span>
                      </div>
                      {list.length>0 && <div style={{ fontSize:12, color:"#71717a", marginBottom:8 }}>{fix}</div>}
                      {list.slice(0,5).map((p,i)=><code key={i} style={{ display:"block", fontSize:11, color:"#52525b", marginBottom:2 }}>{p.url}</code>)}
                      {list.length>5 && <div style={{ fontSize:11, color:"#52525b" }}>...and {list.length-5} more</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

`);

parts.push(`
          {/* ═══════════════════════════════════════════════════
              ROBOTS & SITEMAP  (NEW)
          ═══════════════════════════════════════════════════ */}
          {tab==="robots" && result && (
            <div style={{ marginTop:20 }}>
              <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
                {[{id:"robotstxt",l:"Robots.txt"},{id:"sitemap",l:"XML Sitemap"},{id:"budget",l:"Crawl Budget"}].map(v=>(
                  <button key={v.id} style={S.btn(robotsView===v.id?"primary":null)} onClick={()=>setRobotsView(v.id)}>{v.l}</button>
                ))}
              </div>

              {robotsView==="robotstxt" && (
                <div>
                  <div style={S.card}>
                    <div style={S.sT}>Robots.txt Analysis</div>
                    {result.robotsTxt ? (
                      <>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:10, marginBottom:16 }}>
                          {[
                            { label:"Disallow Rules", value:(result.robotsStats?.disallowCount||0), color:"#fbbf24" },
                            { label:"Allow Rules",    value:(result.robotsStats?.allowCount||0),    color:"#4ade80" },
                            { label:"Blocked URLs",   value:(result.robotsStats?.blockedCount||0),  color:(result.robotsStats?.blockedCount||0)>0?"#f87171":"#4ade80" },
                            { label:"Sitemaps Listed",value:(result.robotsStats?.sitemapCount||0),  color:"#818cf8" },
                          ].map(m=><div key={m.label} style={S.inset}><div style={{ fontSize:10, color:"#71717a", fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{m.label}</div><div style={{ fontSize:20, fontWeight:900, color:m.color }}>{m.value}</div></div>)}
                        </div>
                        <div style={S.sT}>Robots.txt Content</div>
                        <pre style={{ ...S.pre, maxHeight:300, overflowY:"auto" }}>{result.robotsTxt}</pre>
                        {(result.robotsIssues||[]).length>0 && (
                          <div style={{ marginTop:14 }}>
                            <div style={S.sT}>Issues Detected</div>
                            {result.robotsIssues.map((issue,i)=>(
                              <div key={i} style={{ display:"flex", gap:8, padding:"7px 0", borderBottom:"1px solid #1f1f22" }}>
                                <span style={S.badge(issue.severity)}>{issue.severity}</span>
                                <div><div style={{ fontSize:13, fontWeight:600, color:"#e4e4e7" }}>{issue.rule}</div><div style={{ fontSize:12, color:"#71717a" }}>{issue.detail}</div></div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : <div style={{ fontSize:13, color:"#52525b" }}>Robots.txt data requires a full crawl. Run a crawl to analyse your robots.txt file.</div>}
                  </div>
                  <div style={S.card}>
                    <div style={S.sT}>Robots.txt Best Practices</div>
                    {[
                      { t:"Block low-value URLs", d:"Disallow: /search, /cart, /account, /checkout, /cdn/shop. These waste crawl budget on pages with no ranking value." },
                      { t:"Never block CSS or JS", d:"Google needs to render your pages. Blocking CSS/JS causes Googlebot to see a broken version of your site, damaging rankings." },
                      { t:"Declare sitemaps", d:"Add Sitemap: https://yoursite.com/sitemap.xml at the end of robots.txt so all crawlers can find your sitemap." },
                      { t:"Use specific User-agent rules", d:"Use User-agent: * for all bots, or target specific bots (Googlebot, Bingbot, GPTBot) with different rules." },
                      { t:"Test before deploying", d:"Use Google Search Console's robots.txt tester before deploying changes. A misconfigured robots.txt can deindex your entire site." },
                    ].map(({t,d})=><div key={t} style={S.row}><span style={{ color:"#4ade80", flexShrink:0 }}>+</span><div><div style={{ fontSize:13, fontWeight:700, color:"#e4e4e7" }}>{t}</div><div style={{ fontSize:12, color:"#71717a", lineHeight:1.6 }}>{d}</div></div></div>)}
                  </div>
                </div>
              )}

              {robotsView==="sitemap" && (
                <div>
                  <div style={S.card}>
                    <div style={S.sT}>XML Sitemap Analysis</div>
                    {result.sitemapStats ? (
                      <>
                        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:10, marginBottom:16 }}>
                          {[
                            { label:"URLs in Sitemap",          value:result.sitemapStats.total||0,          color:"#4f46e5" },
                            { label:"Also Crawled",             value:result.sitemapStats.crawled||0,        color:"#4ade80" },
                            { label:"In Sitemap But 404",       value:result.sitemapStats.notFound||0,       color:(result.sitemapStats.notFound||0)>0?"#f87171":"#4ade80" },
                            { label:"Noindex in Sitemap",       value:result.sitemapStats.noindex||0,        color:(result.sitemapStats.noindex||0)>0?"#fbbf24":"#4ade80" },
                            { label:"Crawled Not in Sitemap",   value:result.sitemapStats.orphan||0,         color:(result.sitemapStats.orphan||0)>0?"#fbbf24":"#4ade80" },
                          ].map(m=><div key={m.label} style={S.inset}><div style={{ fontSize:10, color:"#71717a", fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{m.label}</div><div style={{ fontSize:18, fontWeight:900, color:m.color }}>{m.value}</div></div>)}
                        </div>
                        {(result.sitemapStats.notFound||0)>0 && <div style={{ background:"#3f1315", border:"1px solid #f8717130", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#f87171", marginBottom:10 }}>{result.sitemapStats.notFound} URLs in your sitemap return 404. Remove deleted pages from your sitemap immediately — this confuses Googlebot and wastes crawl budget.</div>}
                        {(result.sitemapStats.noindex||0)>0 && <div style={{ background:"#3d2a0a", border:"1px solid #fbbf2430", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#fbbf24", marginBottom:10 }}>{result.sitemapStats.noindex} noindex pages are listed in your sitemap. Sitemaps should only contain indexable pages. Remove noindex URLs.</div>}
                      </>
                    ) : <div style={{ fontSize:13, color:"#52525b" }}>Sitemap analysis requires a crawl. Run a crawl to compare sitemap vs. crawled pages.</div>}
                  </div>
                </div>
              )}

              {robotsView==="budget" && (
                <div style={S.card}>
                  <div style={S.sT}>Crawl Budget Optimisation</div>
                  <p style={{ fontSize:13, color:"#71717a", marginBottom:16, lineHeight:1.6 }}>Crawl budget is the number of pages Googlebot will crawl on your site within a given time. Larger sites (5,000+ pages) need active crawl budget management. Even small stores benefit from these practices.</p>
                  {[
                    { impact:"High",   t:"Block parameterised URLs",        d:"?sort=, ?page=, ?filter= parameters create duplicate URL spaces. Use robots.txt Disallow or canonical tags to prevent infinite crawl spirals." },
                    { impact:"High",   t:"Fix all 301 chains to single hops",d:"Every extra redirect hop costs 1 crawl request. 10,000 3-hop chains = 30,000 wasted crawls. Each 301 should jump directly to the final destination." },
                    { impact:"High",   t:"Remove 404s from internal links",  d:"Googlebot must crawl a 404 to confirm it's broken. Removing internal links to 404s frees crawl budget for live, valuable pages." },
                    { impact:"Medium", t:"Consolidate faceted navigation",   d:"Filter combinations (/t-shirts?color=red&size=M&brand=Nike) can create millions of URLs. Use noindex or canonical for filter pages." },
                    { impact:"Medium", t:"Improve server response time",     d:"Google gives faster servers more crawl budget. Under 200ms TTFB is ideal. Slow servers reduce daily crawl rates." },
                    { impact:"Low",    t:"Use XML sitemap for prioritisation",d:"Frequently update your sitemap's <lastmod> dates. Google uses this as a signal for recrawl priority." },
                  ].map(({impact,t,d})=>(
                    <div key={t} style={{ display:"flex", gap:10, padding:"10px 0", borderBottom:"1px solid #1f1f22" }}>
                      <span style={S.badge(impact==="High"?"high":impact==="Medium"?"medium":"low")}>{impact}</span>
                      <div><div style={{ fontSize:13, fontWeight:700, color:"#e4e4e7", marginBottom:2 }}>{t}</div><div style={{ fontSize:12, color:"#71717a", lineHeight:1.6 }}>{d}</div></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

`);

parts.push(`
          {/* ═══════════════════════════════════════════════════
              SITE STRUCTURE
          ═══════════════════════════════════════════════════ */}
          {tab==="structure" && result && (
            <div style={{ marginTop:20 }}>
              <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
                {[{id:"orphans",l:"Orphaned Pages"},{id:"depth",l:"Depth Distribution"},{id:"h1map",l:"H1 Map"},{id:"linktop",l:"Link Leaders"},{id:"thin",l:"Thin Content"},{id:"duplicates",l:"Duplicate Titles"}].map(v=>(
                  <button key={v.id} style={S.btn(structView===v.id?"primary":null)} onClick={()=>setStructView(v.id)}>{v.l}</button>
                ))}
              </div>
              {structView==="orphans" && (
                <div style={S.card}>
                  <div style={S.sT}>Orphaned Pages — {orphanedPages.length}</div>
                  <p style={{ fontSize:13, color:"#71717a", marginBottom:14, lineHeight:1.6 }}>Pages with zero inbound internal links. Googlebot cannot discover them through crawling and they receive no internal PageRank. Fix by linking from hub pages, nav menus, or related products.</p>
                  {orphanedPages.length===0 ? <div style={{ color:"#4ade80", fontWeight:700, fontSize:13 }}>✓ No orphaned pages</div>
                  : orphanedPages.map((p,i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid #1f1f22" }}>
                      <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:600, color:"#e4e4e7" }}>{p.title||"(no title)"}</div><code style={{ fontSize:11, color:"#52525b" }}>{p.url}</code></div>
                      <span style={S.badge("medium")}>Orphaned</span>
                      <button style={S.btnSm()} onClick={()=>{ setSelectedPage(p); setTab("explorer"); }}>Inspect</button>
                    </div>
                  ))}
                </div>
              )}
              {structView==="depth" && (
                <div style={S.card}>
                  <div style={S.sT}>Page Depth Distribution</div>
                  <p style={{ fontSize:13, color:"#71717a", marginBottom:16, lineHeight:1.6 }}>Pages deeper than 3 clicks from the homepage receive less PageRank and are crawled less frequently.</p>
                  {Object.entries(depthDist).sort((a,b)=>Number(a[0])-Number(b[0])).map(([d,count])=>(
                    <div key={d} style={{ marginBottom:14 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:5 }}>
                        <span style={{ color:"#e4e4e7", fontWeight:600 }}>Depth {d}</span>
                        <span style={{ color:Number(d)<=3?"#4ade80":"#fbbf24", fontWeight:700 }}>{count} pages</span>
                      </div>
                      <Bar value={count} max={pages.length} color={Number(d)<=3?"#4f46e5":Number(d)===4?"#f59e0b":"#ef4444"} height={10} />
                      {Number(d)>3 && <div style={{ fontSize:11, color:"#71717a", marginTop:3 }}>Consider flattening site hierarchy — these pages get less crawl budget</div>}
                    </div>
                  ))}
                  {Object.keys(depthDist).length===0 && <div style={{ color:"#52525b", fontSize:13 }}>Depth data not available in this crawl</div>}
                </div>
              )}
              {structView==="h1map" && (
                <div style={S.card}>
                  <div style={S.sT}>H1 Map — {h1Map.length} with H1 | {missingH1Pages.length} missing</div>
                  {missingH1Pages.length>0 && <div style={{ background:"#3f1315", border:"1px solid #f8717130", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:13, color:"#f87171" }}>{missingH1Pages.length} pages missing H1 tags — every page needs exactly one H1 containing the primary keyword.</div>}
                  {h1Map.map(({url:pu,h1},i)=><div key={i} style={{ padding:"8px 0", borderBottom:"1px solid #1f1f22" }}><div style={{ fontSize:13, fontWeight:700, color:"#e4e4e7" }}>{h1}</div><code style={{ fontSize:11, color:"#52525b" }}>{pu}</code></div>)}
                  {h1Map.length===0 && <div style={{ color:"#52525b", fontSize:13 }}>No H1 data available</div>}
                </div>
              )}
              {structView==="linktop" && (
                <div style={S.card}>
                  <div style={S.sT}>Internal Link Leaders</div>
                  <p style={{ fontSize:13, color:"#71717a", marginBottom:14, lineHeight:1.6 }}>Pages with the most inbound internal links receive the most internal PageRank. Your most linked pages should be your most important revenue pages.</p>
                  {linkLeaders.length===0 ? <div style={{ color:"#52525b", fontSize:13 }}>No link data in this crawl</div>
                  : linkLeaders.map((p,i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 0", borderBottom:"1px solid #1f1f22" }}>
                      <span style={{ fontSize:13, fontWeight:800, color:"#4f46e5", minWidth:28 }}>#{i+1}</span>
                      <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:600, color:"#e4e4e7", marginBottom:2 }}>{p.title||p.url}</div><Bar value={p.inboundLinks||0} max={linkLeaders[0]?.inboundLinks||1} color="#4f46e5" height={4} /></div>
                      <span style={{ fontWeight:800, fontSize:14, color:"#818cf8" }}>{p.inboundLinks}</span>
                    </div>
                  ))}
                </div>
              )}
              {structView==="thin" && (
                <div style={S.card}>
                  <div style={S.sT}>Thin Content — {thinContentPages.length} pages under 300 words</div>
                  <p style={{ fontSize:13, color:"#71717a", marginBottom:14, lineHeight:1.6 }}>Google's Helpful Content system penalises thin pages. Target 300+ words on indexable pages, 200+ on product pages.</p>
                  {thinContentPages.length===0 ? <div style={{ color:"#4ade80", fontWeight:700, fontSize:13 }}>✓ No thin content pages</div>
                  : thinContentPages.sort((a,b)=>(a.wordCount||0)-(b.wordCount||0)).map((p,i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid #1f1f22" }}>
                      <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:600, color:"#e4e4e7" }}>{p.title||"(no title)"}</div><code style={{ fontSize:11, color:"#52525b" }}>{p.url}</code></div>
                      <span style={{ fontWeight:800, color:(p.wordCount||0)<100?"#f87171":"#fbbf24", fontSize:13 }}>{p.wordCount||0} words</span>
                    </div>
                  ))}
                </div>
              )}
              {structView==="duplicates" && (
                <div style={S.card}>
                  <div style={S.sT}>Duplicate Title Tags</div>
                  {duplicateTitles.length===0 ? <div style={{ color:"#4ade80", fontWeight:700, fontSize:13 }}>✓ No duplicate titles</div>
                  : duplicateTitles.map(([title,urls],i)=>(
                    <div key={i} style={{ marginBottom:12, padding:"10px 0", borderBottom:"1px solid #1f1f22" }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#fbbf24", marginBottom:6 }}>"{title}"</div>
                      {urls.map((u,j)=><code key={j} style={{ display:"block", fontSize:11, color:"#52525b", marginBottom:2 }}>{u}</code>)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

`);

parts.push(`
          {/* ═══════════════════════════════════════════════════
              PERFORMANCE
          ═══════════════════════════════════════════════════ */}
          {tab==="performance" && result && (
            <div style={{ marginTop:20 }}>
              <div style={S.card}>
                <div style={S.sT}>Core Web Vitals — Site Average</div>
                <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                  {result.cwv ? Object.keys(CWV_THRESHOLDS).map(key=><CWVChip key={key} metric={key} value={result.cwv[key]} />)
                  : <div style={{ fontSize:13, color:"#52525b" }}>CWV data not available in this crawl.</div>}
                </div>
              </div>
              <div style={S.card}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <div style={S.sT}>Per-Page Performance — {slowPages.length} slow pages</div>
                  <select style={S.select} value={perfSort} onChange={e=>setPerfSort(e.target.value)}>
                    <option value="response">Sort: Response Time</option><option value="lcp">Sort: LCP</option><option value="size">Sort: Page Size</option>
                  </select>
                </div>
                {pages.filter(p=>p.responseTime).length===0 ? <div style={{ fontSize:13, color:"#52525b" }}>Performance data requires a crawl with performance profiling enabled.</div>
                : [...pages].sort((a,b)=>{ if(perfSort==="size") return (b.pageSize||0)-(a.pageSize||0); if(perfSort==="lcp") return (b.lcp||0)-(a.lcp||0); return (b.responseTime||0)-(a.responseTime||0); }).slice(0,30).map((p,i)=>(
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 0", borderBottom:"1px solid #1f1f22" }}>
                    <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:600, color:"#e4e4e7", marginBottom:2 }}>{p.title||"(no title)"}</div><code style={{ fontSize:11, color:"#52525b" }}>{(p.url||"").replace(/^https?:\\/\\/[^/]+/,"")}</code></div>
                    {p.responseTime && <CWVChip metric="ttfb" value={p.responseTime} />}
                    {p.lcp          && <CWVChip metric="lcp"  value={p.lcp} />}
                    {p.cls!=null    && <CWVChip metric="cls"  value={p.cls} />}
                    {p.pageSize && <div style={{ fontSize:11, color:"#a1a1aa", textAlign:"center" }}><div style={{ fontWeight:700 }}>{Math.round(p.pageSize/1024)}KB</div><div>size</div></div>}
                  </div>
                ))}
              </div>
              <div style={S.card}>
                <div style={S.sT}>CWV Reference</div>
                <div style={{ display:"grid", gridTemplateColumns:"80px 1fr 90px 90px 90px", gap:10, marginBottom:8 }}>
                  <span style={S.sT}>Metric</span><span style={S.sT}>Measures</span>
                  <span style={{ ...S.sT, color:"#4ade80", textAlign:"center" }}>Good</span>
                  <span style={{ ...S.sT, color:"#fbbf24", textAlign:"center" }}>Needs Work</span>
                  <span style={{ ...S.sT, color:"#f87171", textAlign:"center" }}>Poor</span>
                </div>
                {Object.entries(CWV_THRESHOLDS).map(([key,t])=>(
                  <div key={key} style={{ display:"grid", gridTemplateColumns:"80px 1fr 90px 90px 90px", gap:10, padding:"9px 0", borderBottom:"1px solid #1f1f22", alignItems:"center" }}>
                    <span style={{ fontWeight:800, color:"#e4e4e7" }}>{t.label}</span>
                    <span style={{ fontSize:12, color:"#a1a1aa" }}>{t.description}</span>
                    <span style={{ textAlign:"center", fontSize:13, color:"#4ade80", fontWeight:700 }}>≤{t.good}{t.unit}</span>
                    <span style={{ textAlign:"center", fontSize:13, color:"#fbbf24", fontWeight:700 }}>≤{t.poor}{t.unit}</span>
                    <span style={{ textAlign:"center", fontSize:13, color:"#f87171", fontWeight:700 }}>&gt;{t.poor}{t.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

`);

parts.push(`
          {/* ═══════════════════════════════════════════════════
              CONTENT QUALITY  (NEW)
          ═══════════════════════════════════════════════════ */}
          {tab==="content" && result && (
            <div style={{ marginTop:20 }}>
              <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
                {[{id:"readability",l:"Readability"},{id:"duplicates",l:"Duplicate Content"},{id:"anchors",l:"Anchor Text"},{id:"eeat",l:"E-E-A-T Checklist"}].map(v=>(
                  <button key={v.id} style={S.btn(contentView===v.id?"primary":null)} onClick={()=>setContentView(v.id)}>{v.l}</button>
                ))}
              </div>

              {contentView==="readability" && (
                <div>
                  <div style={S.card}>
                    <div style={S.sT}>Readability Analysis</div>
                    <p style={{ fontSize:13, color:"#71717a", marginBottom:14, lineHeight:1.6 }}>Readability scores measure how easy your content is to understand. Google's quality guidelines favour content written for humans at an accessible reading level. Target Flesch-Kincaid score of 60-70 for general ecommerce content.</p>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:10, marginBottom:16 }}>
                      {[
                        { label:"Avg Word Count",   value:pages.length?Math.round(pages.reduce((a,p)=>a+(p.wordCount||0),0)/pages.length):0, color:"#4f46e5" },
                        { label:"Thin Pages <300w", value:thinContentPages.length, color:thinContentPages.length>0?"#f87171":"#4ade80" },
                        { label:"Low Readability",  value:lowReadability.length,   color:lowReadability.length>0?"#fbbf24":"#4ade80" },
                      ].map(m=><div key={m.label} style={S.inset}><div style={{ fontSize:10, color:"#71717a", fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{m.label}</div><div style={{ fontSize:20, fontWeight:900, color:m.color }}>{m.value}</div></div>)}
                    </div>
                    {lowReadability.length>0 ? (
                      lowReadability.map((p,i)=>(
                        <div key={i} style={{ padding:"8px 0", borderBottom:"1px solid #1f1f22" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <div><div style={{ fontSize:13, fontWeight:600, color:"#e4e4e7" }}>{p.title||"(no title)"}</div><code style={{ fontSize:11, color:"#52525b" }}>{p.url}</code></div>
                            <span style={{ fontWeight:700, color:"#fbbf24" }}>Score: {p.readabilityScore}</span>
                          </div>
                        </div>
                      ))
                    ) : <div style={{ color:"#4ade80", fontSize:13, fontWeight:700 }}>✓ All pages meet readability standards</div>}
                  </div>
                  <div style={S.card}>
                    <div style={S.sT}>Content Length Distribution</div>
                    {[
                      { label:"Under 100 words",    count:pages.filter(p=>(p.wordCount||0)>0&&(p.wordCount||0)<100).length,    color:"#ef4444", note:"Critical: too thin" },
                      { label:"100–300 words",       count:pages.filter(p=>(p.wordCount||0)>=100&&(p.wordCount||0)<300).length, color:"#f59e0b", note:"Borderline thin" },
                      { label:"300–600 words",       count:pages.filter(p=>(p.wordCount||0)>=300&&(p.wordCount||0)<600).length, color:"#22c55e", note:"Good for product pages" },
                      { label:"600–1200 words",      count:pages.filter(p=>(p.wordCount||0)>=600&&(p.wordCount||0)<1200).length,color:"#4ade80", note:"Good for collections/blogs" },
                      { label:"1200+ words",         count:pages.filter(p=>(p.wordCount||0)>=1200).length,                     color:"#818cf8", note:"In-depth content" },
                    ].map(({label,count,color,note})=>(
                      <div key={label} style={{ marginBottom:10 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                          <span style={{ color:"#a1a1aa" }}>{label}</span>
                          <span style={{ color, fontWeight:700 }}>{count} pages — {note}</span>
                        </div>
                        <Bar value={count} max={pages.length} color={color} height={6} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {contentView==="duplicates" && (
                <div>
                  <div style={S.card}>
                    <div style={S.sT}>Duplicate Meta Descriptions — {duplicateMeta.length} groups</div>
                    <p style={{ fontSize:13, color:"#71717a", marginBottom:12, lineHeight:1.5 }}>Duplicate meta descriptions reduce click-through rates. Each page should have a unique, compelling meta description.</p>
                    {duplicateMeta.length===0 ? <div style={{ color:"#4ade80", fontWeight:700, fontSize:13 }}>✓ All meta descriptions are unique</div>
                    : duplicateMeta.slice(0,10).map(([meta,urls],i)=>(
                      <div key={i} style={{ marginBottom:12, padding:"10px 0", borderBottom:"1px solid #1f1f22" }}>
                        <div style={{ fontSize:13, fontWeight:700, color:"#fbbf24", marginBottom:6 }}>"{meta.substring(0,100)}{meta.length>100?"...":""}"</div>
                        <div style={{ fontSize:11, color:"#52525b" }}>Used on {urls.length} pages:</div>
                        {urls.slice(0,5).map((u,j)=><code key={j} style={{ display:"block", fontSize:11, color:"#52525b", marginTop:2 }}>{u}</code>)}
                      </div>
                    ))}
                  </div>
                  <div style={S.card}>
                    <div style={S.sT}>Duplicate Title Tags — {duplicateTitles.length} groups</div>
                    {duplicateTitles.length===0 ? <div style={{ color:"#4ade80", fontWeight:700, fontSize:13 }}>✓ All title tags are unique</div>
                    : duplicateTitles.slice(0,10).map(([title,urls],i)=>(
                      <div key={i} style={{ marginBottom:12, padding:"10px 0", borderBottom:"1px solid #1f1f22" }}>
                        <div style={{ fontSize:13, fontWeight:700, color:"#fbbf24", marginBottom:6 }}>"{title}"</div>
                        {urls.slice(0,5).map((u,j)=><code key={j} style={{ display:"block", fontSize:11, color:"#52525b", marginTop:2 }}>{u}</code>)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {contentView==="anchors" && (
                <div style={S.card}>
                  <div style={S.sT}>Anchor Text Analysis</div>
                  <p style={{ fontSize:13, color:"#71717a", marginBottom:14, lineHeight:1.6 }}>Descriptive anchor text helps search engines understand what the linked page is about. Generic anchors ("click here", "read more", "here") provide no SEO value and should be replaced with keyword-rich, descriptive text.</p>
                  {[
                    { anchor:"click here",  severity:"high",   fix:"Replace with descriptive text: e.g. 'View our summer collection' instead of 'click here'" },
                    { anchor:"here",        severity:"high",   fix:"Replace with the topic of the linked page" },
                    { anchor:"read more",   severity:"medium", fix:"Replace with: 'Read our guide to [topic]' or 'See [product name]'" },
                    { anchor:"learn more",  severity:"medium", fix:"Replace with: 'Learn how to [action]' or 'Discover [specific benefit]'" },
                    { anchor:"this page",   severity:"medium", fix:"Replace with the actual page name or primary keyword" },
                    { anchor:"link",        severity:"low",    fix:"Replace with descriptive text about the destination content" },
                  ].map(({anchor,severity,fix})=>{
                    const found = (genericAnchors||[]).find(a=>a.text===anchor);
                    const count = found?.count||0;
                    return (
                      <div key={anchor} style={{ padding:"10px 0", borderBottom:"1px solid #1f1f22" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                          <span style={S.badge(count>0?severity:"good")}>{count>0?severity:"ok"}</span>
                          <span style={{ fontWeight:700, color:"#e4e4e7", fontSize:13 }}>"{anchor}"</span>
                          {count>0 && <span style={{ color:"#f87171", fontWeight:700 }}>{count}x found</span>}
                          {count===0 && <span style={{ color:"#4ade80", fontSize:12 }}>✓ Not found</span>}
                        </div>
                        {count>0 && <div style={{ fontSize:12, color:"#71717a", marginLeft:8 }}>{fix}</div>}
                      </div>
                    );
                  })}
                </div>
              )}

              {contentView==="eeat" && (
                <div style={S.card}>
                  <div style={S.sT}>E-E-A-T Checklist</div>
                  <p style={{ fontSize:13, color:"#71717a", marginBottom:14, lineHeight:1.6 }}>E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) is Google's quality framework. Strong E-E-A-T signals are critical for YMYL (Your Money, Your Life) topics and are increasingly important for all content.</p>
                  {[
                    { label:"Author bylines on blog/content pages",       pass:pages.some(p=>p.hasAuthor),       detail:"Each piece of content should have a clear author attribution. Add author schema (Person JSON-LD) with bio, credentials, and social profiles." },
                    { label:"About Us / Company page present",            pass:pages.some(p=>(p.url||"").includes("/about")), detail:"A detailed About page with team bios, company history, and credentials builds brand authority." },
                    { label:"Contact page present",                       pass:pages.some(p=>(p.url||"").includes("/contact")), detail:"A visible contact page signals trustworthiness. Include physical address, phone, and email." },
                    { label:"Privacy Policy page present",                pass:pages.some(p=>(p.url||"").includes("/privacy")), detail:"Required for trust and legal compliance. Essential for any site collecting user data." },
                    { label:"Terms & Conditions page present",            pass:pages.some(p=>(p.url||"").includes("/terms")), detail:"Establishes legal clarity and builds user trust, particularly for ecommerce." },
                    { label:"Product reviews / aggregateRating schema",   pass:pagesWithSchema>0 && pages.some(p=>p.schemaTypes?.includes("AggregateRating")), detail:"Reviews and ratings are strong trust signals. Implement aggregateRating in Product schema for star ratings in search results." },
                    { label:"HTTPS throughout site",                      pass:httpPages.length===0, detail:"HTTPS is a foundational trust signal. All pages must be served securely." },
                    { label:"No thin content on key pages",               pass:thinContentPages.length===0, detail:"Thin pages undermine overall site quality. Google's quality rater guidelines penalise sites with many thin pages." },
                  ].map(({label,pass,detail})=>(
                    <Check key={label} pass={pass} label={label} detail={detail} />
                  ))}
                </div>
              )}
            </div>
          )}

`);

parts.push(`
          {/* ═══════════════════════════════════════════════════
              ACCESSIBILITY  (NEW)
          ═══════════════════════════════════════════════════ */}
          {tab==="accessibility" && result && (
            <div style={{ marginTop:20 }}>
              <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
                {[{id:"violations",l:"WCAG Violations"},{id:"overview",l:"Overview"},{id:"guide",l:"A11y Guide"}].map(v=>(
                  <button key={v.id} style={S.btn(a11yView===v.id?"primary":null)} onClick={()=>setA11yView(v.id)}>{v.l}</button>
                ))}
              </div>

              <div style={{ ...S.card, display:"flex", gap:20, alignItems:"center", flexWrap:"wrap", marginBottom:16 }}>
                <SubScore label="A11y Score" score={uxScore} color="#a78bfa" />
                <div style={{ flex:1, display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:10 }}>
                  {[
                    { label:"Pages with A11y Issues",  value:a11yViolations.length, color:a11yViolations.length>0?"#f87171":"#4ade80" },
                    { label:"Missing HTML lang",        value:missingLang.length,    color:missingLang.length>0?"#f87171":"#4ade80" },
                    { label:"Total Violations",         value:pages.reduce((a,p)=>a+(p.a11yIssues||[]).length,0), color:"#fbbf24" },
                  ].map(m=><div key={m.label} style={S.inset}><div style={{ fontSize:10, color:"#71717a", fontWeight:600, textTransform:"uppercase", marginBottom:4 }}>{m.label}</div><div style={{ fontSize:20, fontWeight:900, color:m.color }}>{m.value}</div></div>)}
                </div>
              </div>

              {a11yView==="violations" && (
                <div>
                  {a11yViolations.length===0 ? (
                    <div style={S.card}><div style={{ color:"#4ade80", fontWeight:700, fontSize:13 }}>✓ No accessibility violations detected</div></div>
                  ) : a11yViolations.slice(0,20).map((p,i)=>(
                    <div key={i} style={S.card2}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                        <div><div style={{ fontSize:13, fontWeight:700, color:"#fafafa" }}>{p.title||"(no title)"}</div><code style={{ fontSize:11, color:"#818cf8" }}>{p.url}</code></div>
                        <span style={S.badge("medium")}>{(p.a11yIssues||[]).length} violations</span>
                      </div>
                      {(p.a11yIssues||[]).map((v,j)=>(
                        <div key={j} style={{ display:"flex", gap:8, padding:"7px 0", borderBottom:"1px solid #1f1f22" }}>
                          <span style={S.badge(v.severity||"medium")}>{v.severity||"medium"}</span>
                          <div><div style={{ fontSize:12, fontWeight:600, color:"#e4e4e7" }}>{v.rule||v.type}</div><div style={{ fontSize:11, color:"#71717a" }}>{v.description||v.detail}</div></div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {a11yView==="overview" && (
                <div style={S.card}>
                  <div style={S.sT}>WCAG 2.1 Compliance Checklist</div>
                  {[
                    { label:"All images have descriptive alt text",         pass:!allIssues.find(i=>(i.type||"").includes("alt")),         detail:"WCAG 1.1.1. Required for screen readers and image search. Every meaningful image needs descriptive alt text." },
                    { label:"HTML lang attribute on all pages",             pass:missingLang.length===0,                                   detail:"WCAG 3.1.1. Enables screen readers to use the correct language/pronunciation engine." },
                    { label:"Sufficient colour contrast",                   pass:!pages.some(p=>(p.a11yIssues||[]).find(v=>(v.rule||"").includes("color-contrast"))), detail:"WCAG 1.4.3. Text must have 4.5:1 contrast ratio (3:1 for large text) against its background." },
                    { label:"Form inputs have labels",                      pass:!pages.some(p=>(p.a11yIssues||[]).find(v=>(v.rule||"").includes("label"))),          detail:"WCAG 1.3.1. Every form input needs an associated <label> element for screen reader users." },
                    { label:"Links have descriptive text",                  pass:!pages.some(p=>(p.a11yIssues||[]).find(v=>(v.rule||"").includes("link-name"))),      detail:"WCAG 2.4.4. Link text must describe the destination without surrounding context." },
                    { label:"Buttons have accessible names",                pass:!pages.some(p=>(p.a11yIssues||[]).find(v=>(v.rule||"").includes("button-name"))),    detail:"WCAG 4.1.2. Icon-only buttons need aria-label attributes." },
                    { label:"Page title on every page",                     pass:missingTitlePages.length===0,                             detail:"WCAG 2.4.2. Every page must have a descriptive <title> element." },
                    { label:"Headings not skipped (H1→H2→H3)",             pass:!allIssues.find(i=>(i.type||"").includes("heading-order")),detail:"WCAG 1.3.1. Heading levels must be used in order — never skip from H1 to H3." },
                    { label:"No auto-playing audio",                        pass:!pages.some(p=>(p.a11yIssues||[]).find(v=>(v.rule||"").includes("autoplay"))),       detail:"WCAG 1.4.2. Auto-playing audio disorients screen reader users. Always require user action." },
                    { label:"Viewport zoom not disabled",                   pass:!pages.some(p=>(p.a11yIssues||[]).find(v=>(v.rule||"").includes("meta-viewport"))),  detail:"WCAG 1.4.4. User-scalable=no prevents users with low vision from zooming in. Remove it." },
                  ].map(({label,pass,detail})=><Check key={label} pass={pass} label={label} detail={detail} />)}
                </div>
              )}

              {a11yView==="guide" && (
                <div style={S.card}>
                  <div style={S.sT}>Why Accessibility Matters for SEO</div>
                  {[
                    { t:"Accessibility and SEO share the same goals",   d:"Both Google and screen readers need clean semantic HTML, descriptive text, and proper structure. Fixing accessibility issues almost always improves SEO." },
                    { t:"Google uses accessibility as a quality signal", d:"Pages with poor accessibility score lower in Google's quality evaluation. Core Web Vitals include interaction metrics that are closely tied to accessibility." },
                    { t:"WCAG 2.1 is the international standard",       d:"Web Content Accessibility Guidelines (WCAG) 2.1 Level AA is the target for most commercial websites. It covers visual, motor, auditory, and cognitive disabilities." },
                    { t:"Legal risk in many jurisdictions",             d:"ADA (USA), EAA (EU), AODA (Canada), and similar laws require digital accessibility. Non-compliance carries significant legal and reputational risk." },
                    { t:"AI agent accessibility (2025+)",               d:"Google's AI Overviews and LLM crawlers use the same accessibility signals as screen readers. Semantic HTML and ARIA labels directly affect AI content extraction." },
                  ].map(({t,d})=><div key={t} style={S.row}><span style={{ color:"#a78bfa", flexShrink:0 }}>A</span><div><div style={{ fontSize:13, fontWeight:700, color:"#e4e4e7", marginBottom:2 }}>{t}</div><div style={{ fontSize:12, color:"#71717a", lineHeight:1.6 }}>{d}</div></div></div>)}
                </div>
              )}
            </div>
          )}

`);

parts.push(`
          {/* ═══════════════════════════════════════════════════
              AI / GEO  (NEW)
          ═══════════════════════════════════════════════════ */}
          {tab==="ai-geo" && result && (
            <div style={{ marginTop:20 }}>
              <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
                {[{id:"score",l:"GEO Score"},{id:"signals",l:"All Signals"},{id:"llm",l:"LLM Crawlers"},{id:"learn",l:"What is GEO?"}].map(v=>(
                  <button key={v.id} style={S.btn(geoView===v.id?"primary":null)} onClick={()=>setGeoView(v.id)}>{v.l}</button>
                ))}
              </div>

              <div style={{ ...S.card, display:"flex", gap:24, alignItems:"center", flexWrap:"wrap", marginBottom:16, background:"linear-gradient(135deg,#1e1b4b 0%,#18181b 100%)", border:"1px solid #3730a3" }}>
                <SubScore label="GEO Score" score={geoNorm} color="#a78bfa" />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, color:"#c7d2fe", fontWeight:700, marginBottom:6 }}>Generative Engine Optimisation Readiness</div>
                  <div style={{ fontSize:13, color:"#71717a", lineHeight:1.6, marginBottom:10 }}>GEO measures how likely your content is to be cited by AI systems (ChatGPT, Perplexity, Google AI Overviews, Claude). Unlike traditional SEO, GEO focuses on structured data, direct answer formats, and E-E-A-T signals.</div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    <span style={{ background:"#1e1b4b", color:"#818cf8", borderRadius:4, padding:"3px 10px", fontSize:11, fontWeight:700 }}>{geoScore}/{geoMax} pts earned</span>
                    <span style={{ background:geoNorm>=70?"#052e16":geoNorm>=40?"#3d2a0a":"#3f1315", color:geoNorm>=70?"#4ade80":geoNorm>=40?"#fbbf24":"#f87171", borderRadius:4, padding:"3px 10px", fontSize:11, fontWeight:700 }}>{geoNorm>=70?"AI Citation Ready":geoNorm>=40?"Partially Optimised":"Not AI-Optimised"}</span>
                  </div>
                </div>
              </div>

              {geoView==="score" && (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:16 }}>
                  <div style={S.card}>
                    <div style={S.sT}>GEO Signal Scorecard</div>
                    {GEO_CHECKS.map(check=>{
                      const pass = !!geoPageSignals[check.id];
                      return (
                        <div key={check.id} style={{ display:"flex", gap:10, padding:"9px 0", borderBottom:"1px solid #1f1f22" }}>
                          <span style={{ color:pass?"#4ade80":"#f87171", fontSize:16, flexShrink:0, lineHeight:1.2 }}>{pass?"✓":"✗"}</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:13, fontWeight:600, color:pass?"#e4e4e7":"#a1a1aa" }}>{check.label}</div>
                          </div>
                          <span style={{ fontWeight:700, color:pass?"#4ade80":"#52525b", fontSize:13 }}>{pass?`+${check.pts}`:check.pts} pts</span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={S.card}>
                    <div style={S.sT}>Top GEO Wins</div>
                    {GEO_CHECKS.filter(c=>!geoPageSignals[c.id]).sort((a,b)=>b.pts-a.pts).slice(0,5).map(check=>(
                      <div key={check.id} style={{ padding:"10px 0", borderBottom:"1px solid #1f1f22" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                          <span style={{ fontSize:13, fontWeight:700, color:"#fafafa" }}>{check.label}</span>
                          <span style={{ fontWeight:800, color:"#a78bfa" }}>+{check.pts} pts</span>
                        </div>
                        <div style={{ fontSize:12, color:"#71717a", lineHeight:1.5 }}>{check.desc}</div>
                      </div>
                    ))}
                    {GEO_CHECKS.every(c=>geoPageSignals[c.id]) && <div style={{ color:"#4ade80", fontWeight:700, fontSize:13 }}>✓ Maximum GEO score achieved!</div>}
                  </div>
                </div>
              )}

              {geoView==="signals" && (
                <div style={S.card}>
                  <div style={S.sT}>All GEO Signals — {GEO_CHECKS.length} checks</div>
                  {GEO_CHECKS.map(check=>{
                    const pass = !!geoPageSignals[check.id];
                    return (
                      <div key={check.id} style={{ padding:"12px 0", borderBottom:"1px solid #1f1f22" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                          <span style={{ color:pass?"#4ade80":"#f87171", fontSize:16 }}>{pass?"✓":"✗"}</span>
                          <span style={{ fontSize:14, fontWeight:700, color:pass?"#e4e4e7":"#fafafa" }}>{check.label}</span>
                          <span style={S.badge(pass?"good":"medium")}>{pass?"Present":"Missing"}</span>
                          <span style={{ marginLeft:"auto", fontWeight:800, color:"#a78bfa" }}>{check.pts} pts</span>
                        </div>
                        <div style={{ fontSize:12, color:"#71717a", lineHeight:1.6, marginLeft:26 }}>{check.desc}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {geoView==="llm" && (
                <div>
                  <div style={S.card}>
                    <div style={S.sT}>LLM Crawler Access</div>
                    <p style={{ fontSize:13, color:"#71717a", marginBottom:14, lineHeight:1.6 }}>AI companies crawl the web to train their models and power real-time search features. Allowing their crawlers ensures your content can be cited in AI responses.</p>
                    {[
                      { bot:"GPTBot",        company:"OpenAI",    uses:"ChatGPT, GPT-4 training and browsing. Millions of daily citations in ChatGPT responses.", blocked:(result.robotsStats?.blocked||[]).includes("GPTBot") },
                      { bot:"ChatGPT-User",  company:"OpenAI",    uses:"ChatGPT browse-with-Bing feature. Used for real-time information retrieval.", blocked:(result.robotsStats?.blocked||[]).includes("ChatGPT-User") },
                      { bot:"ClaudeBot",     company:"Anthropic", uses:"Claude AI model training and real-time knowledge retrieval.", blocked:(result.robotsStats?.blocked||[]).includes("ClaudeBot") },
                      { bot:"PerplexityBot", company:"Perplexity",uses:"Perplexity AI search — one of the fastest-growing AI search engines (50M+ users).", blocked:(result.robotsStats?.blocked||[]).includes("PerplexityBot") },
                      { bot:"Googlebot",     company:"Google",    uses:"Google Search, AI Overviews, and Gemini AI. Blocking this removes you from Google entirely.", blocked:(result.robotsStats?.blocked||[]).includes("Googlebot") },
                      { bot:"Bingbot",       company:"Microsoft", uses:"Bing Search and Copilot AI. Microsoft's Copilot uses Bing index for all AI answers.", blocked:(result.robotsStats?.blocked||[]).includes("Bingbot") },
                    ].map(({bot,company,uses,blocked})=>(
                      <div key={bot} style={{ padding:"10px 0", borderBottom:"1px solid #1f1f22" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                          <span style={{ color:blocked?"#f87171":"#4ade80", fontSize:16 }}>{blocked?"✗":"✓"}</span>
                          <span style={{ fontWeight:700, color:"#fafafa", fontSize:13 }}>{bot}</span>
                          <span style={{ fontSize:12, color:"#71717a" }}>{company}</span>
                          <span style={S.badge(blocked?"high":"good")}>{blocked?"Blocked":"Allowed"}</span>
                        </div>
                        <div style={{ fontSize:12, color:"#71717a", marginLeft:26, lineHeight:1.5 }}>{uses}</div>
                        {blocked && <div style={{ marginLeft:26, marginTop:6, fontSize:12, color:"#fbbf24" }}>Fix: Remove Disallow rule for {bot} in robots.txt to allow AI citation opportunities.</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {geoView==="learn" && (
                <div>
                  <div style={{ ...S.card, border:"1px solid #3730a3", background:"linear-gradient(135deg,#1e1b4b 0%,#18181b 100%)" }}>
                    <div style={S.sT}>What is GEO (Generative Engine Optimisation)?</div>
                    <p style={{ fontSize:14, color:"#c7d2fe", lineHeight:1.8 }}>GEO is the practice of optimising content so it gets cited by AI systems — ChatGPT, Perplexity, Google AI Overviews, Bing Copilot, and Claude. As users increasingly get answers directly from AI rather than clicking search results, being cited by AI is becoming as important as traditional search rankings.</p>
                    <p style={{ fontSize:13, color:"#71717a", lineHeight:1.7, marginTop:8 }}>Research shows that pages with FAQPage schema are cited 35% more often by AI systems. Pages with clear author attribution are cited 28% more. Structured, direct-answer content dramatically outperforms narrative content in AI citations.</p>
                  </div>
                  <div style={S.card}>
                    <div style={S.sT}>GEO vs Traditional SEO</div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                      <div>
                        <div style={{ fontSize:12, fontWeight:700, color:"#4f46e5", marginBottom:10, textTransform:"uppercase", letterSpacing:0.5 }}>Traditional SEO</div>
                        {["Optimise for keyword rankings","Target Google's 10 blue links","Focus on backlink building","Measure organic click traffic","Title & meta for SERP snippets"].map(t=><div key={t} style={{ fontSize:12, color:"#a1a1aa", marginBottom:6, display:"flex", gap:8 }}><span style={{ color:"#52525b" }}>→</span>{t}</div>)}
                      </div>
                      <div>
                        <div style={{ fontSize:12, fontWeight:700, color:"#a78bfa", marginBottom:10, textTransform:"uppercase", letterSpacing:0.5 }}>GEO (AI Search)</div>
                        {["Optimise for AI citation frequency","Target AI overview slots","Focus on E-E-A-T & structured data","Measure brand mentions in AI responses","FAQ/HowTo schema for AI extraction"].map(t=><div key={t} style={{ fontSize:12, color:"#c7d2fe", marginBottom:6, display:"flex", gap:8 }}><span style={{ color:"#818cf8" }}>→</span>{t}</div>)}
                      </div>
                    </div>
                  </div>
                  <div style={S.card}>
                    <div style={S.sT}>Shopify-Specific GEO Actions</div>
                    {[
                      { t:"Add FAQPage schema to product pages",     d:"Add a FAQ section to each product page and wrap it in FAQPage JSON-LD. Common questions: 'What is [product]?', 'How do I use [product]?', 'Is [product] right for me?'" },
                      { t:"Implement Product schema fully",           d:"Ensure Product JSON-LD includes name, description, brand, offers (price, availability), aggregateRating, and image. Incomplete schema = lower citation probability." },
                      { t:"Create comparison / buyer's guide content",d:"'Best X for Y' and 'How to choose X' content is heavily cited by AI in response to buying intent queries. Add this content to collection pages." },
                      { t:"Add author schema to blog posts",          d:"Give each blog author a Person JSON-LD with jobTitle, knowsAbout, sameAs (LinkedIn, Twitter), and alumniOf. Author credibility boosts E-E-A-T." },
                      { t:"Use direct answer format",                 d:"Start product descriptions with a clear, direct sentence answering 'What is this?'. AI systems extract and cite this sentence directly. Lead with the answer, then the detail." },
                    ].map(({t,d})=><div key={t} style={S.row}><span style={{ color:"#a78bfa", flexShrink:0 }}>AI</span><div><div style={{ fontSize:13, fontWeight:700, color:"#e4e4e7", marginBottom:2 }}>{t}</div><div style={{ fontSize:12, color:"#71717a", lineHeight:1.6 }}>{d}</div></div></div>)}
                  </div>
                </div>
              )}
            </div>
          )}

`);

parts.push(`
          {/* ═══════════════════════════════════════════════════
              SCHEDULED CRAWLS
          ═══════════════════════════════════════════════════ */}
          {tab==="schedules" && (
            <div style={{ marginTop:20 }}>
              <div style={S.card}>
                <div style={S.sT}>Create Scheduled Crawl</div>
                <p style={{ fontSize:13, color:"#71717a", marginBottom:14, lineHeight:1.6 }}>Automated crawls monitor your SEO health continuously. Get notified when health score drops or new issues appear.</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
                  {[
                    { label:"Schedule Name *", val:newSched.name,        set:v=>setNewSched(p=>({...p,name:v})),        placeholder:"Weekly Full Site Audit", type:"text" },
                    { label:"Site URL *",      val:newSched.url,         set:v=>setNewSched(p=>({...p,url:v})),         placeholder:"https://mystore.myshopify.com", type:"url" },
                    { label:"Notification Email", val:newSched.notifyEmail, set:v=>setNewSched(p=>({...p,notifyEmail:v})), placeholder:"you@store.com", type:"email" },
                  ].map(({label,val,set,placeholder,type})=>(
                    <div key={label}>
                      <label style={{ fontSize:11, color:"#71717a", display:"block", marginBottom:4 }}>{label}</label>
                      <input style={{ ...S.input, width:"100%", boxSizing:"border-box" }} value={val} onChange={e=>set(e.target.value)} placeholder={placeholder} type={type} />
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize:11, color:"#71717a", display:"block", marginBottom:4 }}>Frequency</label>
                    <select style={{ ...S.select, width:"100%" }} value={newSched.frequency} onChange={e=>setNewSched(p=>({...p,frequency:e.target.value}))}>
                      {SCHEDULE_FREQS.map(f=><option key={f}>{f}</option>)}
                    </select>
                  </div>
                </div>
                <button style={S.btn("primary")} onClick={saveSchedule} disabled={schedSaving||!newSched.name.trim()||!newSched.url.trim()}>{schedSaving?"Saving...":"Create Schedule"}</button>
              </div>
              <div style={{ fontSize:13, color:"#71717a", marginBottom:12 }}>{schedules.length} schedule{schedules.length!==1?"s":""} configured</div>
              {schedules.length===0 ? <EmptyState icon="Calendar" title="No scheduled crawls yet" description="Create a schedule above to automatically monitor SEO health." />
              : schedules.map((s,i)=>(
                <div key={s.id||i} style={S.card2}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:15, fontWeight:700, color:"#fafafa", marginBottom:4 }}>{s.name}</div>
                      <code style={{ fontSize:12, color:"#818cf8", display:"block", marginBottom:6 }}>{s.url}</code>
                      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                        <span style={{ background:"#1e1b4b", color:"#818cf8", padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:700 }}>{s.frequency}</span>
                        {s.notifyEmail && <span style={{ fontSize:11, color:"#52525b" }}>{s.notifyEmail}</span>}
                        {s.createdAt && <span style={{ fontSize:11, color:"#52525b" }}>Created: {new Date(s.createdAt).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:6, flexShrink:0, marginLeft:12 }}>
                      <button style={S.btnSm("primary")} onClick={()=>{ setUrl(s.url); crawl(); }}>Run Now</button>
                      <button style={S.btnSm("danger")} onClick={()=>deleteSchedule(s.id)} disabled={schedDeleting===s.id}>{schedDeleting===s.id?"...":"X"}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════
              COMPARE CRAWLS
          ═══════════════════════════════════════════════════ */}
          {tab==="compare" && (
            <div style={{ marginTop:20 }}>
              <div style={S.card}>
                <div style={S.sT}>Compare Two Crawls</div>
                <p style={{ fontSize:13, color:"#71717a", marginBottom:14, lineHeight:1.6 }}>Select two crawls to see exactly what changed — issues fixed, new issues, score delta, pages added/removed.</p>
                {history.length<2 ? (
                  <div style={{ background:"#3d2a0a", border:"1px solid #fbbf2430", borderRadius:8, padding:"12px 16px", fontSize:13, color:"#fbbf24" }}>You need at least 2 crawls to compare. Run another crawl to enable comparison.</div>
                ) : (
                  <>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
                      {[["Crawl A (baseline)",compareA,setCompareA],["Crawl B (after fixes)",compareB,setCompareB]].map(([label,val,set])=>(
                        <div key={label}>
                          <label style={{ fontSize:11, color:"#71717a", display:"block", marginBottom:4 }}>{label}</label>
                          <select style={{ ...S.select, width:"100%" }} value={val} onChange={e=>set(e.target.value)}>
                            <option value="">Select crawl...</option>
                            {history.map((h,i)=><option key={i} value={h.id||h.createdAt}>{new Date(h.createdAt).toLocaleDateString()} — {h.site}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                    <button style={S.btn("primary")} onClick={runCompare} disabled={comparing||!compareA||!compareB}>{comparing?"Comparing...":"Compare Crawls"}</button>
                  </>
                )}
              </div>
              {compareResult && (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:12, marginBottom:16 }}>
                  {[
                    { label:"Score Change", value:compareResult.healthScoreChange!=null?\`\${compareResult.healthScoreChange>0?"+":""}${compareResult.healthScoreChange}\`:"—", color:(compareResult.healthScoreChange||0)>=0?"#4ade80":"#f87171" },
                    { label:"Issues Fixed",  value:\`+\${compareResult.issuesFixed||0}\`,   color:"#4ade80" },
                    { label:"New Issues",    value:\`-\${compareResult.issuesAdded||0}\`,   color:"#f87171" },
                    { label:"Pages Added",   value:\`+\${compareResult.pagesAdded||0}\`,   color:"#818cf8" },
                  ].map(m=>(
                    <div key={m.label} style={S.inset}>
                      <div style={{ fontSize:10, color:"#71717a", fontWeight:700, textTransform:"uppercase", letterSpacing:1 }}>{m.label}</div>
                      <div style={{ fontSize:24, fontWeight:900, color:m.color, marginTop:2 }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              )}
              {history.length>0 && (
                <div style={S.card}>
                  <div style={S.sT}>Crawl History ({history.length})</div>
                  <div style={{ display:"flex", gap:3, alignItems:"flex-end", height:56, marginBottom:14 }}>
                    {history.slice(-16).map((h,i)=>{
                      const score = h.healthScore||Math.max(0,100-((h.high||0)*8)-((h.medium||0)*3));
                      const col = score>=80?"#22c55e":score>=60?"#f59e0b":"#ef4444";
                      return <div key={i} title={\`\${new Date(h.createdAt).toLocaleDateString()}: \${score}\`} style={{ flex:1, background:col, height:\`\${Math.max(6,score)}%\`, borderRadius:"3px 3px 0 0", opacity:0.8 }} />;
                    })}
                  </div>
                  {history.map((h,i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid #1f1f22" }}>
                      <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:600, color:"#e4e4e7" }}>{h.site}</div><div style={{ fontSize:11, color:"#52525b" }}>{h.createdAt?new Date(h.createdAt).toLocaleString():"—"}</div></div>
                      <span style={S.badge("high")}>{h.high||0}</span>
                      <span style={S.badge("medium")}>{h.medium||0}</span>
                      <button style={S.btnSm()} onClick={()=>setCompareA(h.id||h.createdAt)}>A</button>
                      <button style={S.btnSm()} onClick={()=>setCompareB(h.id||h.createdAt)}>B</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

`);

parts.push(`
          {/* ═══════════════════════════════════════════════════
              CRAWL GUIDE
          ═══════════════════════════════════════════════════ */}
          {tab==="guide" && (
            <div style={{ marginTop:20 }}>
              <div style={S.card}>
                <div style={S.sT}>Technical SEO Priority Framework</div>
                {[
                  { priority:"P0 — Crawlability Blockers", sev:"critical", items:[
                    { issue:"Noindex on live pages",         fix:"Remove noindex from all pages you want ranked. Check theme templates, app injections, and page-level settings. One accidental noindex can deindex an entire collection." },
                    { issue:"Blocked by robots.txt",         fix:"Never block CSS, JS, products, or collections. Test every change in Google Search Console's robots.txt tester before deploying." },
                    { issue:"500/503 server errors",         fix:"5xx errors cause Googlebot to reduce crawl frequency. They also directly harm rankings as Google cannot access your content." },
                    { issue:"Redirect loops",                fix:"A→B→A redirect loops completely block Googlebot. Detect with this crawler and fix immediately by breaking the cycle." },
                  ]},
                  { priority:"P1 — Indexability Signals", sev:"high", items:[
                    { issue:"Missing/duplicate title tags",  fix:"Title is the strongest on-page signal. Max 60 chars. Primary keyword first. Unique on every page — never duplicate across pages." },
                    { issue:"Missing canonical tags",        fix:"Self-canonical every page. Shopify creates duplicate URLs via /collections/x/products/y — canonical must point to /products/y." },
                    { issue:"Missing meta descriptions",     fix:"150-160 chars. Include a call to action and primary keyword. Not a direct ranking factor but critical for CTR and AI citation excerpts." },
                    { issue:"404 broken internal links",     fix:"Broken internal links waste crawl budget. 301-redirect every 404 to the most topically relevant live page." },
                  ]},
                  { priority:"P2 — Content Quality", sev:"medium", items:[
                    { issue:"Missing H1 headings",           fix:"One H1 per page containing the primary keyword. H1 and title tag can differ — H1 is seen by users, title tag by search engines." },
                    { issue:"Thin content (under 300 words)",fix:"Product pages: 200+ words of original description. Collection pages: 100+ words of category intro. Blog posts: 600+ words." },
                    { issue:"Missing image alt text",        fix:"Describe the image naturally including the product name. Never keyword-stuff. Alt text serves both accessibility and image search SEO." },
                    { issue:"Duplicate content",             fix:"Shopify creates canonical duplicates at multiple paths. Always canonical to the shortest canonical URL (/products/slug)." },
                  ]},
                  { priority:"P3 — Authority & Visibility", sev:"low", items:[
                    { issue:"Missing schema markup",         fix:"Product, BreadcrumbList, FAQPage and Organization schema increase CTR via rich snippets and AI citation frequency." },
                    { issue:"Slow response times",           fix:"CDN, image compression (WebP/AVIF), browser caching, app performance. Each 100ms reduction measurably improves Core Web Vitals." },
                    { issue:"Orphaned pages",                fix:"Link orphaned pages from nav, hub pages, or related products. Pages with no inbound internal links get minimal crawl budget." },
                    { issue:"Missing GEO signals",           fix:"Add FAQPage schema, author attribution, and direct-answer content formats. AI systems cite structured, credible pages 3x more." },
                  ]},
                ].map(({priority,sev,items})=>(
                  <div key={priority} style={{ marginBottom:20 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                      <span style={S.badge(sev)}>{sev}</span>
                      <span style={{ fontSize:14, fontWeight:800, color:"#fafafa" }}>{priority}</span>
                    </div>
                    {items.map(({issue,fix})=>(
                      <div key={issue} style={{ padding:"10px 0", borderBottom:"1px solid #1f1f22" }}>
                        <div style={{ fontSize:13, fontWeight:700, color:"#e4e4e7", marginBottom:3 }}>{issue}</div>
                        <div style={{ fontSize:12, color:"#71717a", lineHeight:1.6 }}>{fix}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div style={S.card}>
                <div style={S.sT}>Shopify-Specific Issues</div>
                {[
                  { issue:"Duplicate product URLs",            fix:"Canonical /products/slug, not /collections/x/products/slug. Verify your theme enforces this on every page type." },
                  { issue:"?variant= URLs",                    fix:"Canonical must ignore the variant parameter. Check your theme's canonical logic for parameterised variant URLs." },
                  { issue:"Paginated collections indexed",      fix:"/collections/t-shirts?page=2 creates thin duplicates. Canonical to the first page, add rel=next/prev for Bing." },
                  { issue:"Search results indexed",            fix:"Add noindex to all /search?q= pages. They create an infinite URL space and are never worth indexing." },
                  { issue:"Password-protected store",          fix:"Password protection blocks all search engine access. Verify your store is publicly accessible before worrying about SEO." },
                  { issue:"App-injected noindex",              fix:"Some apps accidentally inject noindex. Audit every page type after installing new apps. Check /products, /collections, /pages." },
                  { issue:"CDN images blocked",                fix:"Shopify CDN image URLs must not be disallowed. Image search and Google's vision AI both require access." },
                  { issue:"Missing aggregateRating schema",    fix:"Reviews are your strongest trust signal in search results. Implement aggregateRating in Product JSON-LD for star ratings." },
                ].map(({issue,fix})=>(
                  <div key={issue} style={S.row}>
                    <span style={{ color:"#4f46e5", flexShrink:0, fontWeight:800 }}>S</span>
                    <div><div style={{ fontSize:13, fontWeight:700, color:"#e4e4e7", marginBottom:2 }}>{issue}</div><div style={{ fontSize:12, color:"#71717a", lineHeight:1.6 }}>{fix}</div></div>
                  </div>
                ))}
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <div style={S.card}>
                  <div style={S.sT}>Health Score</div>
                  {[
                    { penalty:"-8 pts",   label:"High issue",     color:"#f87171",  note:"404s, noindex, HTTP pages" },
                    { penalty:"-3 pts",   label:"Medium issue",   color:"#fbbf24",  note:"Missing meta, thin content" },
                    { penalty:"-0.5 pts", label:"Low issue",      color:"#4ade80",  note:"Missing alt, schema gaps" },
                    { penalty:"100",      label:"Perfect score",  color:"#4f46e5",  note:"Zero issues detected" },
                  ].map(({penalty,label,color,note})=>(
                    <div key={label} style={{ display:"flex", gap:10, padding:"8px 0", borderBottom:"1px solid #1f1f22" }}>
                      <span style={{ fontWeight:800, color, fontSize:13, minWidth:70 }}>{penalty}</span>
                      <div><div style={{ fontSize:12, fontWeight:700, color:"#e4e4e7" }}>{label}</div><div style={{ fontSize:11, color:"#71717a" }}>{note}</div></div>
                    </div>
                  ))}
                </div>
                <div style={S.card}>
                  <div style={S.sT}>Crawl Frequency Guide</div>
                  {[
                    { type:"New SKUs daily",         freq:"Daily",       color:"#4ade80" },
                    { type:"Weekly new products",    freq:"Weekly",      color:"#818cf8" },
                    { type:"Occasional updates",     freq:"Fortnightly", color:"#fbbf24" },
                    { type:"Static store",           freq:"Monthly",     color:"#a1a1aa" },
                    { type:"After major site changes",freq:"Immediate",  color:"#f87171" },
                    { type:"After SEO fixes applied", freq:"Immediate",  color:"#f87171" },
                  ].map(({type,freq,color})=>(
                    <div key={type} style={{ display:"flex", gap:10, alignItems:"center", padding:"7px 0", borderBottom:"1px solid #1f1f22" }}>
                      <div style={{ flex:1, fontSize:12, color:"#a1a1aa" }}>{type}</div>
                      <span style={{ fontWeight:700, color, fontSize:12 }}>{freq}</span>
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
`);

const content = parts.join("\n");
fs.writeFileSync(target, content, "utf8");
console.log("Written:", target);
console.log("Lines:", content.split("\n").length);
