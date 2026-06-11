import React, { useState, useCallback } from "react";
import { scoreColor as mozScoreColor, ErrorBox, EmptyState, MozCard, MetricRow, MozTabs, Spinner } from "../MozUI";
import { apiFetch } from "../../api";

const API = "/api/ai-content-brief-generator";

const TABS = [
  { id: "generate",  label: "Generate Brief" },
  { id: "saved",     label: "Saved Briefs" },
  { id: "keywords",  label: "Keyword History" },
  { id: "templates", label: "Brief Templates" },
  { id: "guide",     label: "Content Guide" },
];

const BRIEF_TEMPLATES = [
  { name: "Product Review / Best-of",    intent: "Commercial",     wordCount: 2000, outline: ["H1: Best [Products] of 2025", "H2: How We Tested", "H2: Top Picks At a Glance", "H2: [Product 1] Review", "H2: [Product 2] Review", "H2: Buying Guide", "H2: FAQs"], tips: "Include personal testing notes, comparison tables, and affiliate disclosure. Target exact-match 'best [product]' head terms plus long-tail alternatives." },
  { name: "How-To Guide",                 intent: "Informational",  wordCount: 1500, outline: ["H1: How to [Do X] in [Y] Steps", "H2: What You Need Before Starting", "H2: Step 1 — [Action]", "H2: Step 2 — [Action]", "H2: Common Mistakes to Avoid", "H2: FAQs", "H2: Next Steps"], tips: "Lead with the completed outcome. Use numbered steps. Include a tools/requirements list. Screenshots or video embeds increase dwell time significantly." },
  { name: "Category / Landing Page",     intent: "Commercial",     wordCount: 800,  outline: ["H1: [Category] — [Value Prop]", "H2: Why Choose Us", "H2: Our Range", "H2: Customer Reviews", "H2: Buying Guide", "H2: FAQs"], tips: "Keep concise. CTA above the fold. Schema markup (Product, FAQ) is critical for SERPs. Optimise for category head term + modifiers (cheap, best, UK, etc.)." },
  { name: "Comparison / vs Article",     intent: "Commercial",     wordCount: 1800, outline: ["H1: [A] vs [B]: Which Is Better?", "H2: TL;DR Summary", "H2: Key Differences", "H2: [A] In Depth", "H2: [B] In Depth", "H2: Who Should Choose [A]?", "H2: Who Should Choose [B]?", "H2: Verdict"], tips: "Always answer the question in the first paragraph. Use a comparison table. Optimise for '[A] vs [B]' and '[A] or [B]' query variants." },
  { name: "Expert Roundup",               intent: "Informational",  wordCount: 2500, outline: ["H1: [N] Experts Share [Advice]", "H2: About Our Contributors", "H2: Expert #1 — [Name]", "H2: Expert #2 — [Name]", "H2: Key Themes", "H2: Takeaways & Action Plan"], tips: "Great for link building — contributors will share their feature. Include genuine expert quotes, not just AI-generated answers. Schema: Article + Person." },
  { name: "Glossary / Definition Post",  intent: "Informational",  wordCount: 1200, outline: ["H1: What Is [Term]? A Complete Guide", "H2: Definition", "H2: History & Background", "H2: Key Components", "H2: Examples", "H2: [Term] vs [Related Term]", "H2: FAQs"], tips: "Target 'what is' and 'definition' queries. Link to related glossary terms for strong internal linking. Featured snippet potential is high for well-structured definition posts." },
];

const C = {
 bg: "#09090b", card: "#18181b", border: "#27272a", borderBright: "#3f3f46",
 text: "#fafafa", sub: "#a1a1aa", dim: "#71717a",
 green: "#4ade80", greenBg: "#052e16", greenBorder: "#166534",
 blue: "#60a5fa", blueBg: "#0c1a2e", blueBorder: "#1e3a5f",
 yellow: "#fbbf24", yellowBg: "#1c1007", yellowBorder: "#92400e",
 purple: "#a78bfa", purpleBg: "#1e1b4b", purpleBorder: "#4338ca",
 indigo: "#818cf8",
};

const intentColors = {
 informational: { bg: "#0c1a2e", border: "#1e3a5f", text: "#60a5fa", label: "Informational" },
 commercial: { bg: "#1e1b4b", border: "#4338ca", text: "#a78bfa", label: "Commercial" },
 transactional: { bg: "#052e16", border: "#166534", text: "#4ade80", label: "Transactional" },
 navigational: { bg: "#27272a", border: "#3f3f46", text: "#71717a", label: "Navigational" },
};

function Section({ title, children, action }) {
 return (
 <div style={{ marginBottom: 24 }}>
 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
 <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: "0.7px" }}>{title}</div>
 {action}
 </div>
 {children}
 </div>
 );
}

function CopyBtn({ text, small }) {
 const [copied, setCopied] = useState(false);
 return (
 <button
 onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
 style={{ background: "none", border: `1px solid ${C.borderBright}`, borderRadius: 5, padding: small ? "2px 7px" : "4px 10px", color: C.sub, fontSize: small ? 10 : 11, cursor: "pointer" }}
 >{copied ? "Copied!" : "Copy"}</button>
 );
}

export default function AIContentBriefGenerator() {
 const [tab, setTab] = useState("generate");
 const [keyword, setKeyword] = useState("");
 const [audience, setAudience] = useState("");
 const [tone, setTone] = useState("Professional");

 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 const [brief, setBrief] = useState(null);
 const [selectedTitle, setSelectedTitle] = useState(0);
 const [selectedMeta, setSelectedMeta] = useState(0);
 const [outline, setOutline] = useState([]);

 const generate = useCallback(async () => {
 if (!keyword.trim()) return;
 setLoading(true); setError(""); setBrief(null);
 try {
 const res = await apiFetch(`${API}/generate`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ keyword: keyword.trim(), audience, tone }),
 });
 const data = await res.json();
 if (!data.ok) throw new Error(data.error || "Generation failed");
 setBrief(data.brief);
 setOutline(data.brief.outline || []);
 setSelectedTitle(0);
 setSelectedMeta(0);
 } catch (e) {
 setError(e.message);
 } finally {
 setLoading(false);
 }
 }, [keyword, audience, tone]);

 const updateSection = (id, field, val) =>
 setOutline(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));

 const addSection = (afterId) => {
 const idx = outline.findIndex(s => s.id === afterId);
 const newSec = { id: `s-${Date.now()}`, tag: "H2", text: "New section", direction: "", wordCount: 200, keywordsToInclude: [] };
 const next = [...outline];
 next.splice(idx + 1, 0, newSec);
 setOutline(next);
 };

 const removeSection = (id) => setOutline(prev => prev.filter(s => s.id !== id));

 const exportBrief = () => {
 if (!brief) return;
 const t = brief.titles?.[selectedTitle]?.text || keyword;
 const m = brief.metaDescriptions?.[selectedMeta]?.text || "";
 const kws = [brief.primaryKeyword, ...(brief.secondaryKeywords || [])].join(", ");
 const outlineText = outline.map(s => `${s.tag}: ${s.text}\n -> ${s.direction || ""}${s.wordCount ? ` (${s.wordCount} words)` : ""}`).join("\n");
 const faqs = (brief.faqQuestions || []).map((q, i) => `${i + 1}. ${q}`).join("\n");
 const text = `CONTENT BRIEF: ${keyword.toUpperCase()}\n${"=".repeat(60)}\n\nTITLE: ${t}\nMETA: ${m}\n\nSEARCH INTENT: ${brief.searchIntent} - ${brief.searchIntentExplain}\nWORD COUNT TARGET: ${brief.estimatedWordCount}\nTONE: ${tone}\nAUDIENCE: ${audience || "General"}\n\nKEYWORDS: ${kws}\n\nOUTLINE:\n${outlineText}\n\nFAQ:\n${faqs}\n\nCTA: ${brief.callToAction || ""}\n\nGenerated by AURA`;
 const blob = new Blob([text], { type: "text/plain" });
 const url = URL.createObjectURL(blob);
 const a = document.createElement("a");
 a.href = url;
 a.download = `brief-${keyword.replace(/\s+/g, "-")}.txt`;
 a.click();
 URL.revokeObjectURL(url);
 };

 const fullBriefText = brief ? [
 `Title: ${brief.titles?.[selectedTitle]?.text || keyword}`,
 `Meta: ${brief.metaDescriptions?.[selectedMeta]?.text || ""}`,
 `Keywords: ${[brief.primaryKeyword, ...(brief.secondaryKeywords || [])].join(", ")}`,
 `Outline:\n${outline.map(s => `${s.tag}: ${s.text} - ${s.direction || ""}`).join("\n")}`,
 ].join("\n") : "";

 const intentStyle = brief ? (intentColors[brief.searchIntent?.toLowerCase?.()] || intentColors.informational) : null;

 const [savedBriefs, setSavedBriefs] = useState([]);
 const [kwHistory, setKwHistory]     = useState([]);

 const saveBrief = () => {
 if (!brief) return;
 const title = brief.titles?.[selectedTitle]?.text || keyword;
 const entry = { id: Date.now(), keyword, title, savedAt: new Date().toISOString(), wordCount: brief.estimatedWordCount, intent: brief.searchIntent };
 setSavedBriefs(p => [entry, ...p].slice(0, 30));
 setKwHistory(p => p.includes(keyword) ? p : [keyword, ...p].slice(0, 50));
 };

 return (
 <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "system-ui, sans-serif", paddingBottom: 60 }}>

 {/* Header */}
 <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "18px 28px" }}>
 <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 2 }}>Content Brief Generator</div>
 <div style={{ fontSize: 13, color: C.sub }}>Enter a keyword to generate a full SEO content brief — titles, meta, outline, keywords, FAQs and more</div>
 </div>

 <div style={{ padding: "24px 28px" }}>

 {/* Stats bar */}
 <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
 {[
 { label: "Briefs Generated", value: savedBriefs.length, color: "#818cf8" },
 { label: "Keywords Tracked", value: kwHistory.length,   color: "#4ade80" },
 { label: "Templates",        value: BRIEF_TEMPLATES.length, color: "#fbbf24" },
 { label: "Current Sections", value: outline.length,     color: "#4f46e5" },
 ].map(s => (
 <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 18px" }}>
 <div style={{ fontSize: 10, color: C.dim, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
 <div style={{ fontSize: 22, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
 </div>
 ))}
 </div>

 {/* Tabs */}
 <MozTabs tabs={TABS} active={tab} onChange={setTab} />

 {/* ── GENERATE BRIEF ── */}
 {tab === "generate" && <div style={{ marginTop: 20 }}>

 {/* Input Panel */}
 <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 24px", marginBottom: 28 }}>
 <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
 <div>
 <label style={{ fontSize: 11, fontWeight: 600, color: C.sub, display: "block", marginBottom: 5 }}>TARGET KEYWORD *</label>
 <input
 value={keyword}
 onChange={e => setKeyword(e.target.value)}
 onKeyDown={e => e.key === "Enter" && generate()}
 placeholder="e.g. best running shoes for beginners"
 style={{ width: "100%", background: "#09090b", border: `1px solid ${C.borderBright}`, borderRadius: 8, padding: "10px 14px", color: C.text, fontSize: 14, boxSizing: "border-box", outline: "none" }}
 />
 </div>
 <div>
 <label style={{ fontSize: 11, fontWeight: 600, color: C.sub, display: "block", marginBottom: 5 }}>TARGET AUDIENCE</label>
 <input
 value={audience}
 onChange={e => setAudience(e.target.value)}
 placeholder="e.g. beginner runners"
 style={{ width: "100%", background: "#09090b", border: `1px solid ${C.borderBright}`, borderRadius: 8, padding: "10px 14px", color: C.text, fontSize: 13, boxSizing: "border-box", outline: "none" }}
 />
 </div>
 <div>
 <label style={{ fontSize: 11, fontWeight: 600, color: C.sub, display: "block", marginBottom: 5 }}>TONE</label>
 <select
 value={tone}
 onChange={e => setTone(e.target.value)}
 style={{ width: "100%", background: "#09090b", border: `1px solid ${C.borderBright}`, borderRadius: 8, padding: "10px 14px", color: C.text, fontSize: 13, boxSizing: "border-box" }}
 >
 {["Professional", "Conversational", "Friendly", "Authoritative", "Inspiring", "Educational", "Persuasive"].map(t => <option key={t}>{t}</option>)}
 </select>
 </div>
 </div>
 <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
 <button
 onClick={generate}
 disabled={loading || !keyword.trim()}
 style={{ background: loading ? "#4f46e5" : "#6366f1", border: "none", borderRadius: 9, padding: "11px 28px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading || !keyword.trim() ? "default" : "pointer", opacity: !keyword.trim() ? 0.5 : 1 }}
 >
 {loading ? "Generating..." : "Generate Brief 2 cr"}
 </button>
 {brief && <span style={{ fontSize: 12, color: C.green }}>Brief ready for "{brief.keyword}"</span>}
 {error && <span style={{ fontSize: 12, color: "#f87171" }}>{error}</span>}
 </div>
 </div>

 {/* Loading */}
 {loading && (
 <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 40, textAlign: "center" }}>
 <div style={{ fontSize: 14, color: C.sub, marginBottom: 6 }}>Analysing search intent, keywords and competitor structure...</div>
 <div style={{ fontSize: 12, color: C.dim }}>Building your full content brief — titles, meta descriptions, outline, FAQ and more</div>
 </div>
 )}

 {/* Results */}
 {brief && !loading && (
 <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>

 {/* LEFT */}
 <div>

 {/* Intent + stats row */}
 <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 20px", marginBottom: 18, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
 <span style={{ background: intentStyle.bg, border: `1px solid ${intentStyle.border}`, borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 700, color: intentStyle.text }}>{intentStyle.label}</span>
 <span style={{ fontSize: 13, color: C.sub, flex: 1 }}>{brief.searchIntentExplain}</span>
 <span style={{ fontSize: 12, color: C.sub, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, padding: "4px 12px" }}>~{brief.estimatedWordCount} words</span>
 <span style={{ fontSize: 12, color: C.sub, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 7, padding: "4px 12px" }}>{brief.readingLevel}</span>
 </div>

 {/* Titles */}
 <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 22px", marginBottom: 18 }}>
 <Section title="Title Suggestions (pick one)" action={<CopyBtn text={(brief.titles||[]).map((t,i)=>`${i+1}. ${t.text}`).join("\n")} small />}>
 <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
 {(brief.titles || []).map((t, i) => (
 <div key={i} onClick={() => setSelectedTitle(i)} style={{ background: selectedTitle===i ? "#1e1b4b" : C.bg, border: `1px solid ${selectedTitle===i ? "#4338ca" : C.border}`, borderRadius: 9, padding: "12px 16px", cursor: "pointer" }}>
 <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
 <span style={{ fontSize: 10, fontWeight: 700, color: selectedTitle===i ? "#818cf8" : C.dim, background: selectedTitle===i ? "#312e81" : C.card, border: `1px solid ${selectedTitle===i ? "#4338ca" : C.border}`, borderRadius: 4, padding: "2px 7px", flexShrink: 0, marginTop: 2 }}>
 {selectedTitle===i ? "SELECTED" : `OPTION ${i+1}`}
 </span>
 <div style={{ flex: 1 }}>
 <div style={{ fontSize: 14, color: C.text, fontWeight: 600, marginBottom: 4 }}>{t.text}</div>
 <div style={{ fontSize: 11, color: C.dim }}>{t.reason}</div>
 </div>
 <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
 <span style={{ fontSize: 12, fontWeight: 700, color: t.score>=85 ? C.green : t.score>=75 ? C.yellow : C.sub }}>{t.score}</span>
 <CopyBtn text={t.text} small />
 </div>
 </div>
 </div>
 ))}
 </div>
 </Section>
 </div>

 {/* Meta */}
 <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 22px", marginBottom: 18 }}>
 <Section title="Meta Description (pick one)">
 <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
 {(brief.metaDescriptions || []).map((m, i) => (
 <div key={i} onClick={() => setSelectedMeta(i)} style={{ background: selectedMeta===i ? "#0c1a2e" : C.bg, border: `1px solid ${selectedMeta===i ? "#1e3a5f" : C.border}`, borderRadius: 9, padding: "12px 16px", cursor: "pointer" }}>
 <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
 <span style={{ fontSize: 10, fontWeight: 700, color: selectedMeta===i ? "#60a5fa" : C.dim, background: selectedMeta===i ? "#0c1a2e" : C.card, border: `1px solid ${selectedMeta===i ? "#1e3a5f" : C.border}`, borderRadius: 4, padding: "2px 7px", flexShrink: 0, marginTop: 2 }}>
 {selectedMeta===i ? "SELECTED" : `OPTION ${i+1}`}
 </span>
 <div style={{ flex: 1 }}>
 <div style={{ fontSize: 13, color: C.text, marginBottom: 4 }}>{m.text}</div>
 <div style={{ fontSize: 11, color: m.charCount>160 ? "#f87171" : m.charCount>=150 ? C.green : C.dim }}>{m.charCount} chars {m.charCount>160 ? "- too long" : m.charCount>=150 ? "- ideal" : ""}</div>
 </div>
 <CopyBtn text={m.text} small />
 </div>
 </div>
 ))}
 </div>
 </Section>
 </div>

 {/* Keywords */}
 <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 22px", marginBottom: 18 }}>
 <Section title="Target Keywords">
 <div style={{ marginBottom: 12 }}>
 <div style={{ fontSize: 11, color: C.dim, marginBottom: 6 }}>PRIMARY</div>
 <span style={{ background: "#1a0f2e", border: "1px solid #7c3aed", borderRadius: 6, padding: "5px 14px", fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>{brief.primaryKeyword}</span>
 </div>
 <div style={{ marginBottom: 12 }}>
 <div style={{ fontSize: 11, color: C.dim, marginBottom: 6 }}>SECONDARY</div>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
 {(brief.secondaryKeywords || []).map((k, i) => (
 <span key={i} style={{ background: C.bg, border: `1px solid ${C.borderBright}`, borderRadius: 6, padding: "4px 12px", fontSize: 12, color: C.sub }}>{k}</span>
 ))}
 </div>
 </div>
 {(brief.lsiKeywords || []).length > 0 && (
 <div>
 <div style={{ fontSize: 11, color: C.dim, marginBottom: 6 }}>SEMANTIC / LSI</div>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
 {brief.lsiKeywords.map((k, i) => (
 <span key={i} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 12px", fontSize: 12, color: C.dim }}>{k}</span>
 ))}
 </div>
 </div>
 )}
 </Section>
 </div>

 {/* Outline */}
 <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 22px" }}>
 <Section title={`Content Outline (${outline.length} sections)`} action={
 <button onClick={() => addSection(outline[outline.length-1]?.id)} style={{ background:"none", border:`1px solid ${C.borderBright}`, borderRadius:5, padding:"3px 10px", color:C.sub, fontSize:11, cursor:"pointer" }}>+ Add Section</button>
 }>
 <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
 {outline.map((sec) => (
 <div key={sec.id} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
 <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: sec.direction ? 6 : 0 }}>
 <select
 value={sec.tag}
 onChange={e => updateSection(sec.id, "tag", e.target.value)}
 style={{ background: sec.tag==="H1" ? "#1a0f2e" : sec.tag==="H2" ? "#0c1a2e" : C.card, border: `1px solid ${sec.tag==="H1" ? "#7c3aed" : sec.tag==="H2" ? "#1e3a5f" : C.border}`, borderRadius: 5, padding: "3px 6px", color: sec.tag==="H1" ? "#a78bfa" : sec.tag==="H2" ? "#60a5fa" : C.sub, fontSize: 11, fontWeight: 700, flexShrink: 0 }}
 >
 {["H1","H2","H3","H4"].map(t => <option key={t}>{t}</option>)}
 </select>
 <input
 value={sec.text}
 onChange={e => updateSection(sec.id, "text", e.target.value)}
 style={{ flex: 1, background: "none", border: "none", color: C.text, fontSize: 13, fontWeight: sec.tag==="H1" ? 700 : sec.tag==="H2" ? 600 : 400, outline: "none", padding: 0 }}
 />
 <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
 {sec.wordCount > 0 && <span style={{ fontSize: 10, color: C.dim }}>{sec.wordCount}w</span>}
 <button onClick={() => addSection(sec.id)} style={{ background:"none", border:"none", color:C.dim, fontSize:16, cursor:"pointer", padding:"0 2px", lineHeight:1 }}>+</button>
 <button onClick={() => removeSection(sec.id)} style={{ background:"none", border:"none", color:C.dim, fontSize:12, cursor:"pointer", padding:"0 2px", lineHeight:1 }}>x</button>
 </div>
 </div>
 {sec.direction && (
 <div style={{ display:"flex", gap:6, paddingLeft:36 }}>
 <span style={{ fontSize:10, color:C.yellow, flexShrink:0, marginTop:2 }}>-&gt;</span>
 <input value={sec.direction} onChange={e => updateSection(sec.id, "direction", e.target.value)} style={{ flex:1, background:"none", border:"none", color:C.dim, fontSize:11, outline:"none", padding:0 }} placeholder="Content direction..." />
 </div>
 )}
 {(sec.keywordsToInclude||[]).length > 0 && (
 <div style={{ paddingLeft:36, marginTop:4, display:"flex", flexWrap:"wrap", gap:4 }}>
 {sec.keywordsToInclude.map((k,ki) => (
 <span key={ki} style={{ fontSize:10, color:"#818cf8", background:"#1e1b4b", border:"1px solid #4338ca", borderRadius:4, padding:"1px 6px" }}>{k}</span>
 ))}
 </div>
 )}
 </div>
 ))}
 </div>
 </Section>
 </div>

 </div>

 {/* RIGHT sidebar */}
 <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

 {/* Actions */}
 <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px" }}>
 <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: "uppercase", marginBottom: 12 }}>ACTIONS</div>
 <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
 <button onClick={exportBrief} style={{ padding:"9px 0", borderRadius:8, background:"#6366f1", border:"none", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>Export Brief (.txt)</button>
 <div style={{ padding:"3px 0" }}><CopyBtn text={fullBriefText} /></div>
 </div>
 </div>

 {/* Content Goals */}
 {(brief.contentGoals||[]).length > 0 && (
 <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 18px" }}>
 <div style={{ fontSize:11, fontWeight:700, color:C.dim, textTransform:"uppercase", marginBottom:10 }}>CONTENT GOALS</div>
 {brief.contentGoals.map((g,i) => (
 <div key={i} style={{ display:"flex", gap:8, marginBottom:6 }}>
 <span style={{ color:C.green, flexShrink:0 }}>+</span>
 <span style={{ fontSize:12, color:C.sub }}>{g}</span>
 </div>
 ))}
 </div>
 )}

 {/* FAQ */}
 {(brief.faqQuestions||[]).length > 0 && (
 <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 18px" }}>
 <div style={{ fontSize:11, fontWeight:700, color:C.dim, textTransform:"uppercase", marginBottom:10 }}>FAQ / PEOPLE ALSO ASK</div>
 {brief.faqQuestions.map((q,i) => (
 <div key={i} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:7, padding:"8px 12px", fontSize:12, color:C.sub, marginBottom:6 }}>{q}</div>
 ))}
 </div>
 )}

 {/* Competitor Gaps */}
 {(brief.competitorTopics||[]).length > 0 && (
 <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 18px" }}>
 <div style={{ fontSize:11, fontWeight:700, color:C.dim, textTransform:"uppercase", marginBottom:10 }}>COMPETITOR GAPS</div>
 {brief.competitorTopics.map((c,i) => (
 <div key={i} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:7, padding:"8px 12px", marginBottom:6 }}>
 <div style={{ fontSize:12, color:C.text, fontWeight:600, marginBottom:2 }}>{c.topic}</div>
 <div style={{ fontSize:11, color:C.green }}>{c.gap}</div>
 </div>
 ))}
 </div>
 )}

 {/* CTA */}
 {brief.callToAction && (
 <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 18px" }}>
 <div style={{ fontSize:11, fontWeight:700, color:C.dim, textTransform:"uppercase", marginBottom:8 }}>SUGGESTED CTA</div>
 <div style={{ fontSize:13, color:C.yellow, fontWeight:600 }}>"{brief.callToAction}"</div>
 </div>
 )}

 {/* Internal Links */}
 {(brief.internalLinkSuggestions||[]).length > 0 && (
 <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 18px" }}>
 <div style={{ fontSize:11, fontWeight:700, color:C.dim, textTransform:"uppercase", marginBottom:10 }}>INTERNAL LINK IDEAS</div>
 {brief.internalLinkSuggestions.map((l,i) => (
 <div key={i} style={{ fontSize:12, color:C.blue, marginBottom:4 }}>-- {l}</div>
 ))}
 </div>
 )}

 {/* Key Takeaways */}
 {(brief.keyTakeaways||[]).length > 0 && (
 <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 18px" }}>
 <div style={{ fontSize:11, fontWeight:700, color:C.dim, textTransform:"uppercase", marginBottom:10 }}>KEY TAKEAWAYS</div>
 {brief.keyTakeaways.map((t,i) => (
 <div key={i} style={{ display:"flex", gap:8, marginBottom:6 }}>
 <span style={{ color:"#818cf8", flexShrink:0 }}>*</span>
 <span style={{ fontSize:12, color:C.sub }}>{t}</span>
 </div>
 ))}
 </div>
 )}

 </div>
 </div>
 )}

 {/* Empty state */}
 {!brief && !loading && !error && (
 <div style={{ textAlign:"center", padding:"60px 20px", color:C.dim }}>
 <div style={{ fontSize:40, marginBottom:16 }}>*</div>
 <div style={{ fontSize:18, fontWeight:700, color:C.sub, marginBottom:8 }}>Enter a keyword to get started</div>
 <div style={{ fontSize:14, maxWidth:480, margin:"0 auto", lineHeight:1.6 }}>
 Generate a full SEO content brief with title options, meta descriptions, keyword targets,
 content outline, FAQ questions, competitor gaps and more in seconds.
 </div>
 <div style={{ marginTop:28, display:"flex", justifyContent:"center", gap:24, flexWrap:"wrap" }}>
 {["Keyword-based brief generation","Search intent detection","Customisable outline & structure","Title and meta description suggestions","Target keyword sets","FAQ / People Also Ask","Competitor gap analysis","Export to .txt or copy"].map((f,i) => (
 <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:9, padding:"10px 18px", fontSize:12, color:C.sub }}>+ {f}</div>
 ))}
 </div>
 </div>
 )}

 </div>}{/* end generate tab */}

 {/* ── SAVED BRIEFS ── */}
 {tab === "saved" && (
 <div style={{ marginTop: 20 }}>
 {brief && (
 <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
 <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: "uppercase", marginBottom: 8 }}>Current Brief</div>
 <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{brief.titles?.[selectedTitle]?.text || keyword}</div>
 <div style={{ fontSize: 12, color: C.sub }}>Keyword: {keyword} · ~{brief.estimatedWordCount} words · {brief.searchIntent}</div>
 <button onClick={saveBrief} style={{ marginTop: 10, background: "#6366f1", border: "none", borderRadius: 8, padding: "8px 18px", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
 Save This Brief
 </button>
 </div>
 )}

 {savedBriefs.length === 0 ? (
 <div style={{ textAlign: "center", padding: "40px 20px", color: C.dim }}>
 <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
 <div style={{ fontSize: 16, fontWeight: 700, color: C.sub, marginBottom: 6 }}>No saved briefs yet</div>
 <div style={{ fontSize: 13 }}>Generate a brief on the Generate tab and click Save to store it here.</div>
 </div>
 ) : (
 savedBriefs.map(b => (
 <div key={b.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 18px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
 <div>
 <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{b.title}</div>
 <div style={{ fontSize: 12, color: C.sub }}>Keyword: <span style={{ color: C.indigo }}>{b.keyword}</span> · ~{b.wordCount} words · {b.intent}</div>
 <div style={{ fontSize: 11, color: C.dim, marginTop: 3 }}>{new Date(b.savedAt).toLocaleString()}</div>
 </div>
 <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
 <button onClick={() => { setKeyword(b.keyword); setTab("generate"); }} style={{ background: "none", border: `1px solid ${C.borderBright}`, borderRadius: 6, padding: "4px 10px", color: C.sub, fontSize: 11, cursor: "pointer" }}>Re-run</button>
 <button onClick={() => setSavedBriefs(p => p.filter(x => x.id !== b.id))} style={{ background: "none", border: `1px solid #7f1d1d`, borderRadius: 6, padding: "4px 10px", color: "#f87171", fontSize: 11, cursor: "pointer" }}>✕</button>
 </div>
 </div>
 ))
 )}
 </div>
 )}

 {/* ── KEYWORD HISTORY ── */}
 {tab === "keywords" && (
 <div style={{ marginTop: 20 }}>
 <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
 <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: "uppercase", marginBottom: 10 }}>Previously Used Keywords</div>
 {kwHistory.length === 0 ? (
 <div style={{ fontSize: 13, color: C.dim, padding: "20px 0", textAlign: "center" }}>No keywords yet — generate your first brief.</div>
 ) : (
 <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
 {kwHistory.map((kw, i) => (
 <button key={i} onClick={() => { setKeyword(kw); setTab("generate"); }} style={{ background: C.bg, border: `1px solid ${C.borderBright}`, borderRadius: 6, padding: "6px 14px", color: C.sub, fontSize: 12, cursor: "pointer" }}>
 {kw}
 </button>
 ))}
 </div>
 )}
 </div>

 <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 20px" }}>
 <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: "uppercase", marginBottom: 10 }}>Keyword Targeting Tips</div>
 {[
 { t: "Head terms vs long-tail", d: "Head terms (1-2 words) have huge volume but fierce competition. Long-tail (4+ words) have lower volume but much higher conversion intent. Prioritise long-tail for new content." },
 { t: "Search intent alignment", d: "Informational queries ('how to X') need educational content. Commercial ('best X') need comparisons. Transactional ('buy X') need product pages. Mismatching intent = poor rankings." },
 { t: "Secondary keyword clusters", d: "Include 5-10 secondary keywords semantically related to your primary. Google's NLP understands topical depth — a brief covering the full topic cluster outperforms a brief targeting only the head term." },
 { t: "Keyword cannibalisation", d: "Don't create two pieces of content targeting the same keyword. Use Search Console to check existing rankings before creating new content — you may already rank on page 2 with an old post." },
 ].map(({ t, d }) => (
 <div key={t} style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
 <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 3 }}>{t}</div>
 <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.6 }}>{d}</div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* ── BRIEF TEMPLATES ── */}
 {tab === "templates" && (
 <div style={{ marginTop: 20 }}>
 {BRIEF_TEMPLATES.map((tpl, i) => (
 <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 22px", marginBottom: 14 }}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
 <div>
 <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>{tpl.name}</div>
 <div style={{ display: "flex", gap: 8 }}>
 <span style={{ background: intentColors[tpl.intent.toLowerCase()]?.bg || C.bg, color: intentColors[tpl.intent.toLowerCase()]?.text || C.sub, border: `1px solid ${intentColors[tpl.intent.toLowerCase()]?.border || C.border}`, borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{tpl.intent}</span>
 <span style={{ fontSize: 11, color: C.dim }}>~{tpl.wordCount.toLocaleString()} words</span>
 </div>
 </div>
 <button onClick={() => { setTab("generate"); }} style={{ background: "#6366f1", border: "none", borderRadius: 8, padding: "7px 14px", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Use Template</button>
 </div>
 <div style={{ marginBottom: 10 }}>
 <div style={{ fontSize: 10, color: C.dim, fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>Sample Outline</div>
 {tpl.outline.map((line, j) => (
 <div key={j} style={{ fontSize: 12, color: line.startsWith("H1") ? C.purple : line.startsWith("H2") ? C.blue : C.sub, padding: "2px 0", paddingLeft: line.startsWith("H3") ? 16 : 0 }}>{line}</div>
 ))}
 </div>
 <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: C.sub, lineHeight: 1.6 }}>
 <span style={{ color: C.yellow, fontWeight: 700 }}>Pro tip: </span>{tpl.tips}
 </div>
 </div>
 ))}
 </div>
 )}

 {/* ── CONTENT GUIDE ── */}
 {tab === "guide" && (
 <div style={{ marginTop: 20 }}>
 <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 22px", marginBottom: 14 }}>
 <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: "uppercase", marginBottom: 14 }}>Content Brief Best Practices</div>
 {[
 { t: "Brief before writing, always", d: "A brief is the single most impactful investment in content quality. Briefs cut revision rounds by 60%+, ensure keyword coverage, and align writers with search intent before a single word is written." },
 { t: "Search intent is the only thing that matters at position 1", d: "Google's primary ranking signal in 2025 is intent match. Rank #1 by matching format (guide, list, product page), type (informational, transactional), and angle (beginner, advanced, buyer) to what the top 10 results demonstrate." },
 { t: "Outline depth predicts content depth", d: "Every H2 in your outline should answer a distinct sub-question the reader has. If your outline only has 4 H2s, you're probably missing key sub-topics that competitors cover — and those gaps cost you rankings." },
 { t: "Word count is a proxy metric, not a goal", d: "Write until the topic is comprehensively covered, then stop. 1,500 well-crafted words beats 3,000 padded words every time. Google's Helpful Content algorithm penalises content that exists for volume, not value." },
 { t: "E-E-A-T signals are increasingly mandatory", d: "Experience, Expertise, Authoritativeness, Trust. YMYL (health, finance, legal) content must demonstrate real expertise. Author bios, citations, first-hand testing, and editorial review processes all signal E-E-A-T." },
 { t: "Update old briefs when rankings drop", d: "A brief isn't a one-time document. If a page drops from page 1 to page 3, re-run the brief for that keyword. The SERP has likely evolved, and new competitor angles or intent shifts require a content refresh." },
 ].map(({ t, d }) => (
 <div key={t} style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
 <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 3 }}>{t}</div>
 <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.6 }}>{d}</div>
 </div>
 ))}
 </div>

 <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 22px" }}>
 <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: "uppercase", marginBottom: 14 }}>Content Type → Optimal Length Reference</div>
 {[
 { type: "Product category page",     length: "500–1,000",   intent: "Commercial" },
 { type: "Product detail page",       length: "300–600",     intent: "Transactional" },
 { type: "How-to guide",              length: "1,200–2,500", intent: "Informational" },
 { type: "Best-of / comparison",      length: "1,500–3,000", intent: "Commercial" },
 { type: "Glossary / definition",     length: "800–1,500",   intent: "Informational" },
 { type: "Expert roundup",            length: "2,000–4,000", intent: "Informational" },
 { type: "Pillar / hub page",         length: "3,000–5,000", intent: "Informational" },
 { type: "Local landing page",        length: "400–800",     intent: "Transactional" },
 ].map(({ type, length, intent }) => (
 <div key={type} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, padding: "8px 0", borderBottom: `1px solid ${C.border}`, fontSize: 12, alignItems: "center" }}>
 <span style={{ color: C.text }}>{type}</span>
 <span style={{ color: C.indigo, fontWeight: 700, whiteSpace: "nowrap" }}>{length} words</span>
 <span style={{ background: intentColors[intent.toLowerCase()]?.bg || C.bg, color: intentColors[intent.toLowerCase()]?.text || C.sub, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{intent}</span>
 </div>
 ))}
 </div>
 </div>
 )}

 </div>
 </div>
 );
}

