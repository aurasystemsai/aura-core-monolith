import React, { useState, useCallback, useEffect } from "react";
import { apiFetchJSON as _apiFetchJSON } from "../../api";

const apiFetch = (url, opts = {}) => _apiFetchJSON(url, {
 ...opts,
 headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
});

const API = "/api/link-intersect-outreach";

const S = {
 wrap: { background: "#09090b", color: "#fafafa", minHeight: "100vh", fontFamily: "inherit", paddingBottom: 80 },
 header: { background: "linear-gradient(135deg, #0a0a12, #140820)", padding: "24px 28px 0", borderBottom: "1px solid #27272a" },
 title: { fontSize: 22, fontWeight: 800, color: "#fafafa", margin: 0 },
 subtitle: { fontSize: 13, color: "#a1a1aa", marginTop: 4 },
 tabsRow: { display: "flex", gap: 0, overflowX: "auto", marginTop: 16 },
 tab: (a) => ({ padding: "11px 16px", cursor: "pointer", border: "none", background: "none", color: a ? "#a78bfa" : "#71717a", fontWeight: a ? 700 : 500, borderBottom: `2px solid ${a ? "#a78bfa" : "transparent"}`, fontSize: 12, whiteSpace: "nowrap" }),
 body: { padding: "24px 28px" },
 card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "18px 20px", marginBottom: 14 },
 infoBox: { background: "#12103a", border: "1px solid #3730a3", borderRadius: 10, padding: "16px 18px", marginBottom: 18 },
 tipBox: { background: "#1a1412", border: "1px solid #78350f", borderRadius: 10, padding: "14px 18px", marginBottom: 14 },
 successBox: { background: "#071f15", border: "1px solid #065f46", borderRadius: 10, padding: "16px 18px", marginBottom: 14 },
 error: { background: "#2d0011", border: "1px solid #7f1d1d", borderRadius: 8, padding: "12px 16px", color: "#fca5a5", fontSize: 13, marginBottom: 14 },
 label: { fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6, display: "block" },
 hint: { fontSize: 11, color: "#52525b", marginTop: 5, lineHeight: 1.4 },
 input: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 7, color: "#fafafa", padding: "10px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" },
 runBtn: (c) => ({ padding: "11px 22px", background: c || "#7c3aed", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 10 }),
 exBtn: { padding: "9px 16px", background: "#1e1b4b", border: "1px solid #4338ca", borderRadius: 7, color: "#a78bfa", fontWeight: 600, fontSize: 13, cursor: "pointer" },
 badge: (c) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: c + "22", color: c, border: `1px solid ${c}55` }),
 grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
 grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 },
 codeRow: { display: "flex", alignItems: "center", gap: 10, background: "#09090b", borderRadius: 6, padding: "8px 12px", marginBottom: 7 },
 emailBox: { background: "#09090b", borderRadius: 6, padding: "12px 16px", fontSize: 13, color: "#e4e4e7", whiteSpace: "pre-wrap", lineHeight: 1.7, border: "1px solid #27272a" },
};

const PC = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };
const EC = { high: "#f59e0b", medium: "#38bdf8", low: "#a78bfa" };

function Spin() {
 return <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.25)", borderTopColor: "#fff", borderRadius: "50%", animation: "lio-spin 0.7s linear infinite" }} />;
}

function CopyBtn({ text }) {
 const [ok, setOk] = useState(false);
 return (
 <button style={{ padding: "4px 12px", background: ok ? "#052e16" : "#27272a", border: `1px solid ${ok ? "#166534" : "#3f3f46"}`, borderRadius: 5, color: ok ? "#34d399" : "#a1a1aa", cursor: "pointer", fontSize: 11, fontWeight: 600, flexShrink: 0 }}
 onClick={() => { navigator.clipboard && navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 2000); }}>
 {ok ? "Copied!" : "Copy"}
 </button>
 );
}

function FeatureExplainer({ icon, title, what, tip }) {
 return (
 <div style={S.infoBox}>
 <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
 <span style={{ fontSize: 32, flexShrink: 0, lineHeight: 1 }}>{icon}</span>
 <div>
 <div style={{ fontSize: 16, fontWeight: 800, color: "#c4b5fd", marginBottom: 8 }}>{title}</div>
 <div style={{ fontSize: 13, color: "#c4c4f0", lineHeight: 1.65, marginBottom: tip ? 10 : 0 }}>{what}</div>
 {tip && (
 <div style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "#1e1b4b", borderRadius: 6, padding: "8px 12px" }}>
 <span style={{ flexShrink: 0 }}></span>
 <span style={{ fontSize: 12, color: "#a5b4fc", lineHeight: 1.5 }}>{tip}</span>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}

function WhatToDoNow({ steps }) {
 return (
 <div style={S.successBox}>
 <div style={{ fontSize: 14, fontWeight: 700, color: "#34d399", marginBottom: 12 }}>What to do with these results</div>
 {steps.map((s, i) => (
 <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
 <span style={{ background: "#065f46", color: "#34d399", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
 <span style={{ fontSize: 13, color: "#a7f3d0", lineHeight: 1.6 }}>{s}</span>
 </div>
 ))}
 </div>
 );
}

function RunButton({ onClick, disabled, loading, label, color, credits }) {
 return (
 <button onClick={onClick} disabled={disabled || loading}
 style={{ ...S.runBtn(color), opacity: disabled && !loading ? 0.45 : 1, cursor: disabled ? "not-allowed" : "pointer" }}>
 {loading ? <><Spin /> Running AI analysis…</> : label}
 <span style={{ fontSize: 11, background: "rgba(255,255,255,0.15)", borderRadius: 5, padding: "3px 9px" }}>{credits} credit{credits > 1 ? "s" : ""}</span>
 </button>
 );
}

// ─── COMPETITOR FINDER ───────────────────────────────────────────────────────
function CompetitorFinder({ domain, niche, brand, value, onChange }) {
 const [loading, setLoading] = useState(false);
 const [data, setData] = useState(null);
 const [err, setErr] = useState("");
 const [open, setOpen] = useState(false);
 const [checked, setChecked] = useState(new Set());

 const find = useCallback(async () => {
 if (!niche && !brand) { setErr('Please fill in the "What you sell" field first so the AI knows what industry to look in.'); return; }
 setLoading(true); setErr(""); setData(null); setOpen(true); setChecked(new Set());
 try {
 const d = await apiFetch(`${API}/find-competitors`, { method: "POST", body: JSON.stringify({ domain, niche, brand }) });
 if (!d.ok) throw new Error(d.error);
 setData(d);
 // Auto-check Google top rankers + topPicks by default
 const autoCheck = new Set();
 (d.googleTopRankers || []).forEach(x => autoCheck.add(x.domain));
 if (d.topPicks && typeof d.topPicks[0] === "string") {
 d.topPicks[0].split(/,\s*/).forEach(x => autoCheck.add(x.trim()));
 }
 (d.topPicks || []).filter(x => x && !x.includes(",")).forEach(x => autoCheck.add(x.trim()));
 setChecked(autoCheck);
 } catch (e) { setErr(e.message); }
 setLoading(false);
 }, [domain, niche, brand]);

 const toggle = (dom) => setChecked(prev => { const n = new Set(prev); n.has(dom) ? n.delete(dom) : n.add(dom); return n; });
 const apply = () => { onChange(Array.from(checked).join(", ")); setOpen(false); };

 const Section = ({ title, color, items, keyProp = "domain", renderExtra }) => {
 if (!items || !items.length) return null;
 return (
 <div style={{ marginBottom: 14 }}>
 <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>{title}</div>
 {items.map((item, i) => (
 <label key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "7px 0", borderBottom: "1px solid #1f1f2e", cursor: "pointer" }}>
 <input type="checkbox" checked={checked.has(item[keyProp] || item)} onChange={() => toggle(item[keyProp] || item)}
 style={{ marginTop: 2, cursor: "pointer", accentColor: "#a78bfa", flexShrink: 0 }} />
 <div style={{ flex: 1, minWidth: 0 }}>
 <div style={{ fontSize: 13, fontWeight: 600, color: "#fafafa" }}>{item[keyProp] || item}</div>
 {item.keywords && <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 3 }}>{item.keywords.map((k, j) => <span key={j} style={{ fontSize: 10, background: "#1e1b4b", color: "#a78bfa", borderRadius: 3, padding: "2px 6px" }}>{k}</span>)}</div>}
 {(item.reason || item.why) && <div style={{ fontSize: 11, color: "#71717a", marginTop: 2, lineHeight: 1.4 }}>{item.reason || item.why}</div>}
 {renderExtra && renderExtra(item)}
 </div>
 <span style={S.badge(item.size === "enterprise" ? "#ef4444" : item.size === "large" ? "#f59e0b" : "#22c55e")}>{item.size || ""}</span>
 </label>
 ))}
 </div>
 );
 };

 return (
 <div>
 <div style={{ display: "flex", gap: 8 }}>
 <input style={{ ...S.input, flex: 1 }} value={value} onChange={e => onChange(e.target.value)} placeholder="comp1.com, comp2.com — or click AI Find" />
 <button onClick={find} disabled={loading}
 style={{ padding: "10px 13px", background: loading ? "#1a1030" : "#1a1030", border: "1px solid #7c3aed", borderRadius: 7, color: "#a78bfa", fontSize: 12, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
 {loading ? <Spin /> : <></>} AI Find
 </button>
 </div>
 {err && <div style={{ background: "#2d0011", border: "1px solid #7f1d1d", borderRadius: 6, padding: "8px 12px", color: "#fca5a5", fontSize: 12, marginTop: 6 }}>{err}</div>}
 {open && data && (
 <div style={{ background: "#0d0b1a", border: "1px solid #7c3aed", borderRadius: 10, padding: "16px 18px", marginTop: 8 }}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
 <div>
 <div style={{ fontSize: 13, fontWeight: 800, color: "#c4b5fd" }}>AI Competitor Discovery</div>
 {data.summary && <div style={{ fontSize: 11, color: "#71717a", marginTop: 3 }}>{data.summary}</div>}
 </div>
 <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#71717a", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 4px" }}>×</button>
 </div>
 {data.topKeywordsToCheck && data.topKeywordsToCheck.length > 0 && (
 <div style={{ background: "#12103a", borderRadius: 7, padding: "10px 12px", marginBottom: 14 }}>
 <div style={{ fontSize: 11, fontWeight: 700, color: "#818cf8", marginBottom: 6 }}>TOP GOOGLE SEARCHES IN YOUR NICHE</div>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
 {data.topKeywordsToCheck.map((k, i) => <span key={i} style={{ fontSize: 11, background: "#1e1b4b", color: "#a78bfa", borderRadius: 4, padding: "3px 8px", border: "1px solid #3730a3" }}>{k}</span>)}
 </div>
 </div>
 )}
 <Section title="Google Top 10 — who dominates search results right now" color="#fbbf24"
 items={data.googleTopRankers}
 renderExtra={(item) => item.position ? <span style={{ fontSize: 10, background: "#78350f", color: "#fbbf24", borderRadius: 3, padding: "2px 6px", marginTop: 3, display: "inline-block" }}>#{item.position}</span> : null} />
 <Section title="Direct competitors — same products, same customers" color="#ef4444"
 items={data.direct} />
 <Section title="↔ Indirect competitors — same niche, different angle" color="#f59e0b"
 items={data.indirect} />
 <Section title="Content competitors — rank for the same keywords" color="#38bdf8"
 items={data.content} />
 <Section title="Marketplaces" color="#a78bfa"
 items={data.marketplaces} />
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #27272a", paddingTop: 12, marginTop: 4 }}>
 <div style={{ fontSize: 12, color: "#71717a" }}>{checked.size} selected — Google Top 10 ticked by default</div>
 <div style={{ display: "flex", gap: 8 }}>
 <button onClick={() => setOpen(false)} style={{ padding: "8px 14px", background: "none", border: "1px solid #3f3f46", borderRadius: 6, color: "#71717a", cursor: "pointer", fontSize: 12 }}>Cancel</button>
 <button onClick={apply} style={{ padding: "8px 18px", background: "#7c3aed", border: "none", borderRadius: 6, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Use Selected ({checked.size})</button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}

// ─── LINK GAP ────────────────────────────────────────────────────────────────
const LGEX = { domain: "myyogashop.com", competitors: "liforme.com, manduka.com", niche: "eco yoga mats" };

function LinkGapTab({ shopInfo = {} }) {
 const [domain, setDomain] = useState(""); const [competitors, setCompetitors] = useState(""); const [niche, setNiche] = useState("");
 const [result, setResult] = useState(null); const [loading, setLoading] = useState(false); const [err, setErr] = useState("");

 // Pre-fill from Shopify on mount
 useEffect(() => {
 if (shopInfo.domain && !domain) setDomain(shopInfo.domain);
 }, [shopInfo.domain]);

 const run = useCallback(async () => {
 const comps = competitors.split(",").map(s => s.trim()).filter(Boolean);
 if (!domain || !comps.length) return;
 setLoading(true); setErr(""); setResult(null);
 try {
 const d = await apiFetch(`${API}/link-gap`, { method: "POST", body: JSON.stringify({ yourDomain: domain, competitors: comps, niche }) });
 if (!d.ok) throw new Error(d.error);
 setResult(d);
 } catch (e) { setErr(e.message); } finally { setLoading(false); }
 }, [domain, competitors, niche]);

 const compsEntered = competitors.split(",").map(s => s.trim()).filter(Boolean).length > 0;
 const lga = result && result.linkGapAnalysis;
 return (
 <div>
 <FeatureExplainer icon="" title="Find where you're losing links to competitors"
 what="Enter your website and 2–3 competitor sites. We'll work out which types of websites link to them but NOT you — so you know exactly where your biggest opportunities are. Think of it like finding the gaps in your team compared to the competition."
 tip={'Don\'t know who your competitors are? Click "AI Find" next to the competitors field \u2014 it will discover who\'s on page 1 of Google in your niche automatically.'} />
 <div style={S.card}>
 <div style={S.grid3}>
 <div><label style={S.label}>Your website</label><input style={S.input} value={domain} onChange={e => setDomain(e.target.value)} placeholder="yourstore.com" /><div style={S.hint}>Auto-filled from your Shopify store — or type another</div></div>
 <div>
 <label style={S.label}>Competitors' websites</label>
 <CompetitorFinder domain={domain} niche={niche} brand={shopInfo.name} value={competitors} onChange={setCompetitors} />
 <div style={S.hint}>Type manually OR click AI Find to auto-discover who's on page 1 of Google</div>
 </div>
 <div><label style={S.label}>What you sell (optional)</label><input style={S.input} value={niche} onChange={e => setNiche(e.target.value)} placeholder="e.g. eco yoga mats" /><div style={S.hint}>Makes suggestions more relevant to your industry</div></div>
 </div>
 <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
 <RunButton onClick={run} disabled={!domain || !compsEntered} loading={loading} color="#7c3aed" label="Find My Link Gaps" credits={1} />
 <button style={S.exBtn} onClick={() => { setDomain(LGEX.domain); setCompetitors(LGEX.competitors); setNiche(LGEX.niche); }}>Try the example</button>
 </div>
 </div>
 {err && <div style={S.error}>{err}</div>}
 {result && lga && (
 <div>
 <div style={S.grid2}>
 <div style={{ ...S.card, textAlign: "center", background: "linear-gradient(135deg,#1a0030,#0d0d1a)" }}>
 <div style={{ fontSize: 11, color: "#71717a", marginBottom: 6 }}>YOU'RE BEHIND BY ROUGHLY</div>
 <div style={{ fontSize: 48, fontWeight: 900, color: "#ef4444" }}>{lga.estimatedDomainGap || "?"}</div>
 <div style={{ fontSize: 12, color: "#71717a", marginTop: 4 }}>referring domains vs. your competitors</div>
 </div>
 <div style={{ ...S.card, background: "linear-gradient(135deg,#001a15,#0a0d0d)" }}>
 <div style={{ fontSize: 11, color: "#71717a", marginBottom: 8 }}>YOUR SUGGESTED MONTHLY GOAL</div>
 {result.monthlyLinkPlan ? <>
 <div style={{ fontSize: 24, fontWeight: 800, color: "#22c55e", marginBottom: 8 }}>{result.monthlyLinkPlan.target}</div>
 {(result.monthlyLinkPlan.tactics || []).map((t, i) => <div key={i} style={{ fontSize: 12, color: "#a1a1aa", padding: "3px 0" }}>→ {t}</div>)}
 </> : <div style={{ color: "#a1a1aa", fontSize: 13 }}>Focus on 2–4 new quality links every week to close the gap steadily.</div>}
 </div>
 </div>
 {lga.typeGaps && lga.typeGaps.length > 0 && (
 <div style={S.card}>
 <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}> Types of sites linking to your competitors (but not you)</div>
 <div style={{ fontSize: 12, color: "#71717a", marginBottom: 10 }}>These are the categories of sites you should target first to close the gap.</div>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{lga.typeGaps.map((g, i) => <span key={i} style={S.badge("#f59e0b")}>{g}</span>)}</div>
 </div>
 )}
 {lga.topOpportunities && lga.topOpportunities.length > 0 && (
 <div style={S.card}>
 <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Your top link opportunities — start here</div>
 <div style={{ fontSize: 12, color: "#71717a", marginBottom: 12 }}>HIGH PRIORITY = do these first. The "how to get it" tells you the exact action to take.</div>
 {lga.topOpportunities.map((o, i) => (
 <div key={i} style={{ background: "#09090b", borderRadius: 8, padding: "12px 16px", marginBottom: 10 }}>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6, alignItems: "center" }}>
 <span style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>{o.siteType}</span>
 <span style={S.badge(PC[o.priority && o.priority.toLowerCase()] || "#71717a")}>{(o.priority || "medium").toUpperCase()} PRIORITY</span>
 <span style={S.badge("#52525b")}>{o.domainAuthorityEstimate}</span>
 </div>
 <div style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.5 }}><span style={{ color: "#22c55e", fontWeight: 600 }}>How to get it: </span>{o.howToGet}</div>
 </div>
 ))}
 </div>
 )}
 {result.intersectTargets && result.intersectTargets.length > 0 && (
 <div style={{ ...S.card, border: "1px solid #3730a3" }}>
 <div style={{ fontSize: 13, fontWeight: 700, color: "#818cf8", marginBottom: 4 }}>Easiest wins — sites that link to ALL your competitors</div>
 <div style={{ fontSize: 12, color: "#71717a", marginBottom: 10 }}>If they link to every competitor, they're very likely to link to you too. Start with these!</div>
 {result.intersectTargets.map((t, i) => <div key={i} style={{ fontSize: 13, color: "#a78bfa", padding: "5px 0", borderBottom: "1px solid #27272a" }}>→ {t}</div>)}
 </div>
 )}
 {result.quickWinTactics && result.quickWinTactics.length > 0 && (
 <div style={S.card}>
 <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Quick wins you can do this week</div>
 {result.quickWinTactics.map((t, i) => (
 <div key={i} style={{ display: "flex", gap: 10, padding: "5px 0", alignItems: "flex-start" }}>
 <span style={{ color: "#22c55e", fontWeight: 700, flexShrink: 0 }}></span>
 <span style={{ fontSize: 13, color: "#a1a1aa" }}>{t}</span>
 </div>
 ))}
 </div>
 )}
 <WhatToDoNow steps={[
 "Pick the 2–3 highest-priority opportunity types above",
 "Use the 'Outreach Emails' tab to write a personalised email to those sites",
 "Target the Intersect Targets first — they already link to your competitors so they're warmest",
 "Aim for 2–4 outreach emails per week — consistency matters more than volume",
 ]} />
 </div>
 )}
 </div>
 );
}

// ─── UNLINKED MENTIONS ───────────────────────────────────────────────────────
const UMEX = { brand: "My Yoga Shop", domain: "myyogashop.com", competitors: "" };

function UnlinkedMentionsTab({ shopInfo = {} }) {
 const [brand, setBrand] = useState(""); const [domain, setDomain] = useState(""); const [competitors, setCompetitors] = useState("");
 const [result, setResult] = useState(null); const [loading, setLoading] = useState(false); const [err, setErr] = useState("");

 // Pre-fill from Shopify on mount
 useEffect(() => {
 if (shopInfo.name && !brand) setBrand(shopInfo.name);
 if (shopInfo.domain && !domain) setDomain(shopInfo.domain);
 }, [shopInfo.name, shopInfo.domain]);

 const run = useCallback(async () => {
 if (!brand) return;
 setLoading(true); setErr(""); setResult(null);
 try {
 const d = await apiFetch(`${API}/unlinked-mentions`, { method: "POST", body: JSON.stringify({ brand, domain, competitors: competitors.split(",").map(s => s.trim()).filter(Boolean) }) });
 if (!d.ok) throw new Error(d.error);
 setResult(d);
 } catch (e) { setErr(e.message); } finally { setLoading(false); }
 }, [brand, domain, competitors]);

 const strat = result && result.brandMentionStrategy;
 const email = result && result.outreachEmailTemplate;
 return (
 <div>
 <FeatureExplainer icon="" title="Find people who mention you but forgot to include a link"
 what="Sometimes bloggers, news sites or review pages write about your brand without linking to your website. That's a free backlink just sitting there! We'll show you how to find those pages and give you the exact email to politely ask them to add the link."
 tip="This is often the highest-converting link tactic because they already like you enough to write about you — asking for a link is a small favour." />
 <div style={S.card}>
 <div style={S.grid3}>
 <div><label style={S.label}>Your brand name</label><input style={S.input} value={brand} onChange={e => setBrand(e.target.value)} placeholder="My Yoga Shop" /><div style={S.hint}>Auto-filled from your Shopify store name</div></div>
 <div><label style={S.label}>Your website</label><input style={S.input} value={domain} onChange={e => setDomain(e.target.value)} placeholder="yourstore.com" /><div style={S.hint}>Auto-filled from your Shopify store URL</div></div>
 <div>
 <label style={S.label}>Competitors (optional)</label>
 <CompetitorFinder domain={domain} niche="" brand={brand} value={competitors} onChange={setCompetitors} />
 <div style={S.hint}>Optional — helps find where else your brand might be mentioned</div>
 </div>
 </div>
 <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
 <RunButton onClick={run} disabled={!brand} loading={loading} color="#059669" label=" Find My Unlinked Mentions" credits={1} />
 <button style={S.exBtn} onClick={() => { setBrand(UMEX.brand); setDomain(UMEX.domain); setCompetitors(UMEX.competitors); }}>Try the example</button>
 </div>
 </div>
 {err && <div style={S.error}>{err}</div>}
 {result && (
 <div>
 <div style={S.grid2}>
 {result.estimatedMonthlyMentions && (
 <div style={{ ...S.card, textAlign: "center" }}>
 <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>EST. MONTHLY MENTIONS</div>
 <div style={{ fontSize: 36, fontWeight: 900, color: "#a78bfa" }}>{result.estimatedMonthlyMentions}</div>
 <div style={{ fontSize: 11, color: "#71717a", marginTop: 4 }}>people writing about you each month</div>
 </div>
 )}
 {result.conversionRate && (
 <div style={{ ...S.card, textAlign: "center" }}>
 <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>TYPICAL SUCCESS RATE</div>
 <div style={{ fontSize: 36, fontWeight: 900, color: "#38bdf8" }}>{result.conversionRate}</div>
 <div style={{ fontSize: 11, color: "#71717a", marginTop: 4 }}>of polite link-request emails get a yes</div>
 </div>
 )}
 </div>
 {strat && strat.searchQueries && strat.searchQueries.length > 0 && (
 <div style={S.card}>
 <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Step 1: Find your mentions with these Google searches</div>
 <div style={{ fontSize: 12, color: "#71717a", marginBottom: 12 }}>Paste each into Google. When you find a page that mentions you but has no link, note the URL. That's who you'll email.</div>
 {strat.searchQueries.map((q, i) => (<div key={i} style={S.codeRow}><code style={{ fontSize: 12, color: "#38bdf8", flex: 1 }}>{q}</code><CopyBtn text={q} /></div>))}
 </div>
 )}
 {strat && strat.platforms && strat.platforms.length > 0 && (
 <div style={S.card}>
 <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Where to look</div>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{strat.platforms.map((p, i) => <span key={i} style={S.badge("#38bdf8")}>{p}</span>)}</div>
 </div>
 )}
 {email && (
 <div style={{ ...S.card, border: "1px solid #065f46" }}>
 <div style={{ fontSize: 14, fontWeight: 700, color: "#34d399", marginBottom: 4 }}>Step 2: Send this email to the site that mentioned you</div>
 <div style={{ fontSize: 12, color: "#71717a", marginBottom: 14 }}>Fill in the [brackets] with their name and the specific article. Keep it warm and thankful.</div>
 <div style={{ marginBottom: 12 }}>
 <div style={S.label}>SUBJECT LINE</div>
 <div style={{ display: "flex", gap: 8 }}>
 <div style={{ flex: 1, background: "#09090b", borderRadius: 6, padding: "9px 12px", fontSize: 13, border: "1px solid #27272a" }}>{email.subject}</div>
 <CopyBtn text={email.subject} />
 </div>
 </div>
 <div style={S.label}>EMAIL BODY</div>
 <div style={S.emailBox}>{email.body}</div>
 <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}><CopyBtn text={email.body} /></div>
 {email.followUpSubject && (
 <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid #27272a" }}>
 <div style={{ fontSize: 12, fontWeight: 700, color: "#71717a", marginBottom: 10 }}>IF NO REPLY AFTER 5–7 DAYS, SEND THIS FOLLOW-UP:</div>
 <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
 <div style={{ flex: 1, background: "#09090b", borderRadius: 6, padding: "9px 12px", fontSize: 13 }}>{email.followUpSubject}</div>
 <CopyBtn text={email.followUpSubject} />
 </div>
 <div style={S.emailBox}>{email.followUpBody}</div>
 <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}><CopyBtn text={email.followUpBody || ""} /></div>
 </div>
 )}
 </div>
 )}
 {strat && strat.automationTips && strat.automationTips.length > 0 && (
 <div style={S.tipBox}>
 <div style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24", marginBottom: 8 }}>Set up alerts so you never miss a new mention</div>
 {strat.automationTips.map((t, i) => <div key={i} style={{ fontSize: 13, color: "#fde68a", padding: "3px 0" }}>→ {t}</div>)}
 </div>
 )}
 <WhatToDoNow steps={[
 "Run each Google search query above and note pages mentioning you without a link",
 "Personalise the email with the writer's name and reference their specific article",
 "Send it — most people are happy to add a link, you're making their article better!",
 "Follow up once after 7 days if no reply, then move on",
 "Set up a free Google Alert for your brand name to catch future mentions automatically",
 ]} />
 </div>
 )}
 </div>
 );
}

// ─── OUTREACH SEQUENCES ──────────────────────────────────────────────────────
const OSEX = { targetSite: "yogajournal.com", yourSite: "myyogashop.com", yourContent: "The Complete Guide to Eco-Friendly Yoga Mats", angle: "Their article on sustainable yoga links to brands without eco-certification" };

function OutreachSequencesTab() {
 const [targetSite, setTargetSite] = useState(""); const [yourSite, setYourSite] = useState(""); const [yourContent, setYourContent] = useState(""); const [angle, setAngle] = useState("");
 const [result, setResult] = useState(null); const [loading, setLoading] = useState(false); const [err, setErr] = useState("");

 const run = useCallback(async () => {
 if (!targetSite || !yourSite) return;
 setLoading(true); setErr(""); setResult(null);
 try {
 const d = await apiFetch(`${API}/citation-outreach`, { method: "POST", body: JSON.stringify({ targetSite, yourSite, yourContent, angle }) });
 if (!d.ok) throw new Error(d.error);
 setResult(d);
 } catch (e) { setErr(e.message); } finally { setLoading(false); }
 }, [targetSite, yourSite, yourContent, angle]);

 const SC = ["#4f46e5", "#7c3aed", "#9d174d", "#374151"];
 return (
 <div>
 <FeatureExplainer icon="" title="Get AI to write your link-request emails"
 what="Asking another website for a link almost always requires sending them an email. This writes you a complete 4-email sequence — an initial ask, two follow-ups, and a polite final email. All properly structured to get replies. Just personalise the [brackets] and send."
 tip="A good outreach email focuses on what's in it for THEM — how does linking to your content make their article better for their readers? That framing gets 3× more replies." />
 <div style={S.card}>
 <div style={S.grid2}>
 <div><label style={S.label}>Website you want a link FROM</label><input style={S.input} value={targetSite} onChange={e => setTargetSite(e.target.value)} placeholder="industrymagazine.com" /><div style={S.hint}>A blog, directory or news site in your niche that would be a great link</div></div>
 <div><label style={S.label}>Your website</label><input style={S.input} value={yourSite} onChange={e => setYourSite(e.target.value)} placeholder="yourstore.com" /></div>
 <div><label style={S.label}>Your page or content to get linked to (optional)</label><input style={S.input} value={yourContent} onChange={e => setYourContent(e.target.value)} placeholder="The Complete Guide to Eco Yoga Mats" /><div style={S.hint}>The specific article or page you want them to link to</div></div>
 <div><label style={S.label}>Why should they link to you? (optional but helps)</label><input style={S.input} value={angle} onChange={e => setAngle(e.target.value)} placeholder="Their article mentions yoga sustainability but has outdated stats" /><div style={S.hint}>A specific reason makes emails 3× more likely to get a reply</div></div>
 </div>
 <div style={{ marginTop: 4, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
 <RunButton onClick={run} disabled={!targetSite || !yourSite} loading={loading} color="#4f46e5" label="Write My Outreach Emails" credits={2} />
 <button style={S.exBtn} onClick={() => { setTargetSite(OSEX.targetSite); setYourSite(OSEX.yourSite); setYourContent(OSEX.yourContent); setAngle(OSEX.angle); }}>Try the example</button>
 </div>
 </div>
 {err && <div style={S.error}>{err}</div>}
 {result && (
 <div>
 <div style={S.tipBox}>
 <div style={{ fontSize: 13, color: "#fde68a" }}><strong>How to use this sequence:</strong> Send Step 1. Wait 4–5 days — if no reply, send Step 2. Wait 5–7 days — send Step 3. Wait 2 weeks — send Step 4 (the break-up). After that, move on. Don't chase indefinitely.</div>
 </div>
 {(result.outreachSequence || []).map((step, i) => (
 <div key={i} style={{ ...S.card, borderLeft: `3px solid ${SC[i] || "#3f3f46"}`, marginBottom: 16 }}>
 <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
 <span style={{ background: SC[i], color: "#fff", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{step.step}</span>
 <div style={{ flex: 1 }}>
 <span style={{ fontSize: 14, fontWeight: 700 }}>{step.type}</span>
 <span style={{ ...S.badge("#38bdf8"), marginLeft: 8 }}>Send {step.sendTiming}</span>
 </div>
 </div>
 <div style={{ marginBottom: 10 }}>
 <div style={S.label}>SUBJECT LINE</div>
 <div style={{ display: "flex", gap: 8 }}><div style={{ flex: 1, background: "#09090b", borderRadius: 6, padding: "9px 12px", fontSize: 13, border: "1px solid #27272a" }}>{step.subject}</div><CopyBtn text={step.subject} /></div>
 </div>
 <div style={S.label}>EMAIL BODY</div>
 <div style={S.emailBox}>{step.body}</div>
 <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}><CopyBtn text={step.body} /></div>
 </div>
 ))}
 {result.subjectLineVariants && result.subjectLineVariants.length > 0 && (
 <div style={S.card}>
 <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Alternative subject lines to test</div>
 <div style={{ fontSize: 12, color: "#71717a", marginBottom: 10 }}>Try different ones to see which gets more opens. Test one at a time over 10+ emails.</div>
 {result.subjectLineVariants.map((s, i) => (<div key={i} style={{ display: "flex", gap: 8, marginBottom: 7 }}><span style={{ fontSize: 13, color: "#a1a1aa", flex: 1 }}>{s}</span><CopyBtn text={s} /></div>))}
 </div>
 )}
 <div style={S.grid2}>
 {result.valuePropositions && result.valuePropositions.length > 0 && (
 <div style={S.card}>
 <div style={{ fontSize: 12, fontWeight: 700, color: "#34d399", marginBottom: 8 }}>Why they should link to you (use these in your email)</div>
 {result.valuePropositions.map((v, i) => <div key={i} style={{ fontSize: 13, color: "#a1a1aa", padding: "4px 0" }}>{v}</div>)}
 </div>
 )}
 {result.doNotDo && result.doNotDo.length > 0 && (
 <div style={{ ...S.card, border: "1px solid #7f1d1d" }}>
 <div style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", marginBottom: 8 }}>Mistakes that get outreach emails ignored</div>
 {result.doNotDo.map((d, i) => <div key={i} style={{ fontSize: 13, color: "#fca5a5", padding: "4px 0" }}>{d}</div>)}
 </div>
 )}
 </div>
 <WhatToDoNow steps={[
 "Look up the name of the person who runs the target site — address them personally",
 "Customise the [brackets] in each email with specific details about THEIR site",
 "Send from your real email inbox, not a marketing tool — looks far more genuine",
 "Track outreach in a simple spreadsheet: Site | Date Sent | Status | Reply",
 "Send 5–10 of these per week for consistent results — it's a numbers game",
 ]} />
 </div>
 )}
 </div>
 );
}

// ─── PR STORIES ──────────────────────────────────────────────────────────────
const PREX = { brand: "My Yoga Shop", niche: "eco yoga equipment", products: "cork yoga mats, recycled yoga blocks" };

function PRStoriesTab() {
 const [brand, setBrand] = useState(""); const [niche, setNiche] = useState(""); const [products, setProducts] = useState("");
 const [result, setResult] = useState(null); const [loading, setLoading] = useState(false); const [err, setErr] = useState("");

 const run = useCallback(async () => {
 if (!brand || !niche) return;
 setLoading(true); setErr(""); setResult(null);
 try {
 const d = await apiFetch(`${API}/pr-stories`, { method: "POST", body: JSON.stringify({ brand, niche, products: products.split(",").map(p => p.trim()).filter(Boolean) }) });
 if (!d.ok) throw new Error(d.error);
 setResult(d);
 } catch (e) { setErr(e.message); } finally { setLoading(false); }
 }, [brand, niche, products]);

 return (
 <div>
 <FeatureExplainer icon="" title="Get journalists to write about you (and link to your site)"
 what="When a journalist or blogger covers your brand in an article, that's an incredibly powerful backlink — plus real traffic from their audience. This finds story angles that journalists would genuinely want to cover, and writes you a short pitch to send them."
 tip="The best PR stories have data behind them. Even a simple survey of 20 of your customers can become a newsworthy article if the findings are interesting." />
 <div style={S.card}>
 <div style={S.grid3}>
 <div><label style={S.label}>Your brand name</label><input style={S.input} value={brand} onChange={e => setBrand(e.target.value)} placeholder="My Yoga Shop" /></div>
 <div><label style={S.label}>Your niche / industry</label><input style={S.input} value={niche} onChange={e => setNiche(e.target.value)} placeholder="eco yoga equipment" /><div style={S.hint}>Be specific — "sustainable fitness gear" beats "sports"</div></div>
 <div><label style={S.label}>Your products (optional)</label><input style={S.input} value={products} onChange={e => setProducts(e.target.value)} placeholder="cork yoga mats, recycled blocks" /><div style={S.hint}>Comma-separated — helps find relevant angles</div></div>
 </div>
 <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
 <RunButton onClick={run} disabled={!brand || !niche} loading={loading} color="#db2777" label="Find My PR Story Angles" credits={2} />
 <button style={S.exBtn} onClick={() => { setBrand(PREX.brand); setNiche(PREX.niche); setProducts(PREX.products); }}>Try the example</button>
 </div>
 </div>
 {err && <div style={S.error}>{err}</div>}
 {result && (
 <div>
 {(result.prStoryAngles || []).map((a, i) => (
 <div key={i} style={S.card}>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 10 }}>
 <div style={{ fontSize: 15, fontWeight: 700, flex: 1 }}>{a.headline}</div>
 <span style={S.badge(PC[a.linkPotential && a.linkPotential.toLowerCase()] || "#71717a")}>Link potential: {a.linkPotential}</span>
 <span style={S.badge(EC[a.effortToCreate && a.effortToCreate.toLowerCase()] || "#71717a")}>Effort: {a.effortToCreate}</span>
 </div>
 <span style={{ ...S.badge("#7c3aed"), marginBottom: 10, display: "inline-block" }}>{a.angle}</span>
 <div style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.6, marginBottom: 8 }}><span style={{ color: "#c4b5fd", fontWeight: 600 }}>The pitch: </span>{a.pitch}</div>
 {a.dataNeeded && <div style={{ background: "#1c1400", border: "1px solid #713f12", borderRadius: 6, padding: "8px 12px", fontSize: 12, color: "#fde68a" }}>Data you'd need to make this real: {a.dataNeeded}</div>}
 {a.targetPublications && a.targetPublications.length > 0 && (
 <div style={{ marginTop: 10 }}>
 <div style={S.label}>TYPES OF MEDIA THAT WOULD COVER THIS</div>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{a.targetPublications.map((p, j) => <span key={j} style={S.badge("#38bdf8")}>{p}</span>)}</div>
 </div>
 )}
 </div>
 ))}
 <div style={S.grid2}>
 {result.dataStudyIdeas && result.dataStudyIdeas.length > 0 && (
 <div style={{ ...S.card, border: "1px solid #1e3a5f" }}>
 <div style={{ fontSize: 13, fontWeight: 700, color: "#38bdf8", marginBottom: 6 }}>Cheap research you could do</div>
 <div style={{ fontSize: 11, color: "#71717a", marginBottom: 8 }}>Original data makes you quotable and earns links from journalists who reference you.</div>
 {result.dataStudyIdeas.map((d, i) => <div key={i} style={{ fontSize: 13, color: "#a1a1aa", padding: "4px 0" }}>→ {d}</div>)}
 </div>
 )}
 {result.journalistSearchQueries && result.journalistSearchQueries.length > 0 && (
 <div style={S.card}>
 <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>How to find journalists to pitch</div>
 {result.journalistSearchQueries.map((q, i) => (<div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}><code style={{ fontSize: 12, color: "#38bdf8", flex: 1 }}>{q}</code><CopyBtn text={q} /></div>))}
 </div>
 )}
 </div>
 {result.pressReleaseOutline && (
 <div style={{ ...S.card, border: "1px solid #1c3d5a" }}>
 <div style={{ fontSize: 13, fontWeight: 700, color: "#38bdf8", marginBottom: 4 }}>Press release outline for your strongest angle</div>
 <div style={{ fontSize: 12, color: "#71717a", marginBottom: 10 }}>Use this structure when writing and distributing your press release.</div>
 <div style={{ fontSize: 13, color: "#a1a1aa", whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{result.pressReleaseOutline}</div>
 <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}><CopyBtn text={result.pressReleaseOutline} /></div>
 </div>
 )}
 <WhatToDoNow steps={[
 "Pick the angle with HIGH link potential and LOW effort first",
 "If it needs data — send a quick Google Form survey to your customers (it's free)",
 "Find journalists covering your niche using the search queries above",
 "Send a short, personal pitch email — 3 to 5 sentences maximum, no attachments",
 "If they write about you, ask them to include a link to your website in the article",
 ]} />
 </div>
 )}
 </div>
 );
}

// ─── GUEST POSTS ─────────────────────────────────────────────────────────────
const GPEX = { niche: "eco yoga equipment", expertise: "sustainable living and mindful exercise" };

function GuestPostTab() {
 const [niche, setNiche] = useState(""); const [expertise, setExpertise] = useState("");
 const [result, setResult] = useState(null); const [loading, setLoading] = useState(false); const [err, setErr] = useState("");

 const run = useCallback(async () => {
 if (!niche) return;
 setLoading(true); setErr(""); setResult(null);
 try {
 const d = await apiFetch(`${API}/guest-post-finder`, { method: "POST", body: JSON.stringify({ niche, yourExpertise: expertise }) });
 if (!d.ok) throw new Error(d.error);
 setResult(d);
 } catch (e) { setErr(e.message); } finally { setLoading(false); }
 }, [niche, expertise]);

 return (
 <div>
 <FeatureExplainer icon="" title="Write for other blogs and earn a link back"
 what="Guest posting means writing a helpful article for someone else's blog, in exchange for a link back to your site — usually in the author bio or in the article itself. It's a win-win: they get free quality content, you get a valuable backlink and real traffic from their audience."
 tip="Guest posts also drive qualified traffic — readers of a relevant niche blog are exactly who you want visiting your store." />
 <div style={S.card}>
 <div style={S.grid2}>
 <div><label style={S.label}>Your niche / industry</label><input style={S.input} value={niche} onChange={e => setNiche(e.target.value)} placeholder="eco yoga equipment" /></div>
 <div><label style={S.label}>What are you an expert in?</label><input style={S.input} value={expertise} onChange={e => setExpertise(e.target.value)} placeholder="sustainable living and mindful exercise" /><div style={S.hint}>This becomes your author credentials in the pitch email</div></div>
 </div>
 <div style={{ marginTop: 4, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
 <RunButton onClick={run} disabled={!niche} loading={loading} color="#0891b2" label="Find Guest Post Opportunities" credits={1} />
 <button style={S.exBtn} onClick={() => { setNiche(GPEX.niche); setExpertise(GPEX.expertise); }}>Try the example</button>
 </div>
 </div>
 {err && <div style={S.error}>{err}</div>}
 {result && (
 <div>
 {result.searchQueries && result.searchQueries.length > 0 && (
 <div style={S.card}>
 <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Step 1: Search Google for blogs that accept guest posts</div>
 <div style={{ fontSize: 12, color: "#71717a", marginBottom: 12 }}>Copy these into Google. Click results that look like relevant blogs and check if they have a "Write for us" or "Submit a guest post" page.</div>
 {result.searchQueries.map((q, i) => (<div key={i} style={S.codeRow}><code style={{ fontSize: 12, color: "#38bdf8", flex: 1 }}>{q}</code><CopyBtn text={q} /></div>))}
 </div>
 )}
 {result.pitchTemplate && (
 <div style={{ ...S.card, border: "1px solid #1e3a5f" }}>
 <div style={{ fontSize: 14, fontWeight: 700, color: "#38bdf8", marginBottom: 4 }}>Step 2: Send this pitch email</div>
 <div style={{ fontSize: 12, color: "#71717a", marginBottom: 14 }}>This pitch explains who you are, what you'd write, and why their readers would benefit. Fill in the [brackets].</div>
 <div style={{ marginBottom: 10 }}>
 <div style={S.label}>SUBJECT LINE</div>
 <div style={{ display: "flex", gap: 8 }}><div style={{ flex: 1, background: "#09090b", borderRadius: 6, padding: "9px 12px", fontSize: 13 }}>{result.pitchTemplate.subject}</div><CopyBtn text={result.pitchTemplate.subject} /></div>
 </div>
 <div style={S.label}>EMAIL BODY</div>
 <div style={S.emailBox}>{result.pitchTemplate.body}</div>
 <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}><CopyBtn text={result.pitchTemplate.body} /></div>
 {result.pitchTemplate.topicIdeas && result.pitchTemplate.topicIdeas.length > 0 && (
 <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #27272a" }}>
 <div style={S.label}>3 ARTICLE IDEAS TO OFFER THEM</div>
 {result.pitchTemplate.topicIdeas.map((t, i) => <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}><span style={{ color: "#a78bfa" }}></span><span style={{ fontSize: 13, color: "#a1a1aa" }}>{t}</span></div>)}
 </div>
 )}
 </div>
 )}
 <div style={S.grid2}>
 {result.evaluationCriteria && result.evaluationCriteria.length > 0 && (
 <div style={S.card}>
 <div style={{ fontSize: 12, fontWeight: 700, color: "#34d399", marginBottom: 8 }}>How to tell if a site is worth posting on</div>
 {result.evaluationCriteria.map((c, i) => <div key={i} style={{ fontSize: 13, color: "#a1a1aa", padding: "4px 0" }}>• {c}</div>)}
 </div>
 )}
 {result.commonMistakes && result.commonMistakes.length > 0 && (
 <div style={{ ...S.card, border: "1px solid #7f1d1d" }}>
 <div style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", marginBottom: 8 }}>Mistakes that get pitches rejected</div>
 {result.commonMistakes.map((m, i) => <div key={i} style={{ fontSize: 13, color: "#fca5a5", padding: "4px 0" }}>{m}</div>)}
 </div>
 )}
 </div>
 {result.linkBuildingByProxy && result.linkBuildingByProxy.length > 0 && (
 <div style={S.tipBox}>
 <div style={{ fontSize: 13, fontWeight: 700, color: "#fbbf24", marginBottom: 8 }}>Warm them up before pitching — much higher acceptance rate</div>
 {result.linkBuildingByProxy.map((t, i) => <div key={i} style={{ fontSize: 13, color: "#fde68a", padding: "3px 0" }}>→ {t}</div>)}
 </div>
 )}
 <WhatToDoNow steps={[
 "Run 3–4 search queries and bookmark 10–15 relevant blogs you'd like to write for",
 "Check each blog meets the evaluation criteria — only pitch quality, active sites",
 "Comment genuinely on 2–3 of their recent posts first to get on their radar",
 "Send the pitch with your 3 article ideas — give them options",
 "If accepted, write the best article you can — it's your brand reputation",
 ]} />
 </div>
 )}
 </div>
 );
}

// ─── COMMUNITIES ─────────────────────────────────────────────────────────────
const CMEX = { niche: "eco yoga equipment", brand: "My Yoga Shop", keywords: "sustainable yoga, eco mat, cork yoga mat" };

function CommunitiesTab({ shopInfo = {} }) {
 const [niche, setNiche] = useState(""); const [brand, setBrand] = useState(""); const [keywords, setKeywords] = useState("");
 const [result, setResult] = useState(null); const [loading, setLoading] = useState(false); const [err, setErr] = useState("");

 // Pre-fill brand from Shopify on mount
 useEffect(() => {
 if (shopInfo.name && !brand) setBrand(shopInfo.name);
 }, [shopInfo.name]);

 const run = useCallback(async () => {
 if (!niche) return;
 setLoading(true); setErr(""); setResult(null);
 try {
 const d = await apiFetch(`${API}/community-monitor`, { method: "POST", body: JSON.stringify({ niche, brand, keywords: keywords.split(",").map(k => k.trim()).filter(Boolean) }) });
 if (!d.ok) throw new Error(d.error);
 setResult(d);
 } catch (e) { setErr(e.message); } finally { setLoading(false); }
 }, [niche, brand, keywords]);

 return (
 <div>
 <FeatureExplainer icon="" title="Find Reddit communities and forums your customers hang out in"
 what="Community engagement is an underrated link strategy. When you genuinely help people in forums and subreddits, they naturally share and link to your site. This finds the best communities in your niche, the right keywords to monitor, and shows you exactly how to add value without being spammy or promotional."
 tip="The golden rule: spend 2–4 weeks just helping people (no links). Once you're a trusted member, sharing your content when genuinely relevant feels natural — and works." />
 <div style={S.card}>
 <div style={S.grid3}>
 <div><label style={S.label}>Your niche / industry</label><input style={S.input} value={niche} onChange={e => setNiche(e.target.value)} placeholder="eco yoga equipment" /></div>
 <div><label style={S.label}>Your brand name (optional)</label><input style={S.input} value={brand} onChange={e => setBrand(e.target.value)} placeholder="My Yoga Shop" /><div style={S.hint}>Auto-filled from your Shopify store — used to monitor brand mentions</div></div>
 <div><label style={S.label}>Keywords to track (optional)</label><input style={S.input} value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="sustainable yoga, eco mat" /><div style={S.hint}>Comma-separated — topics to jump into</div></div>
 </div>
 <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
 <RunButton onClick={run} disabled={!niche} loading={loading} color="#7c3aed" label="Find My Communities" credits={1} />
 <button style={S.exBtn} onClick={() => { setNiche(CMEX.niche); setBrand(CMEX.brand); setKeywords(CMEX.keywords); }}>Try the example</button>
 </div>
 </div>
 {err && <div style={S.error}>{err}</div>}
 {result && (
 <div>
 {result.subreddits && result.subreddits.length > 0 && (
 <div style={S.card}>
 <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Reddit communities to join and engage in</div>
 <div style={{ fontSize: 12, color: "#71717a", marginBottom: 12 }}>Start with high-engagement, link-friendly ones. The strategy column tells you exactly how to add value there.</div>
 {result.subreddits.map((s, i) => (
 <div key={i} style={{ background: "#09090b", borderRadius: 8, padding: "12px 16px", marginBottom: 8 }}>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 6, alignItems: "center" }}>
 <span style={{ fontSize: 15, fontWeight: 800, color: "#ff6314" }}>r/{s.name.replace(/^r\//i, "")}</span>
 <span style={S.badge("#71717a")}>{s.estimatedSize}</span>
 <span style={S.badge(s.engagement === "high" ? "#22c55e" : s.engagement === "medium" ? "#f59e0b" : "#ef4444")}>{s.engagement} engagement</span>
 {s.linkFriendly && <span style={S.badge("#38bdf8")}>links OK</span>}
 </div>
 <div style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.5 }}><span style={{ color: "#a78bfa", fontWeight: 600 }}>How to add value: </span>{s.strategy}</div>
 </div>
 ))}
 </div>
 )}
 {result.otherCommunities && result.otherCommunities.length > 0 && (
 <div style={S.card}>
 <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Other platforms to engage on</div>
 {result.otherCommunities.map((c, i) => (
 <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid #27272a", alignItems: "flex-start" }}>
 <span style={S.badge("#a78bfa")}>{c.platform}</span>
 <div><div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{c.community}</div><div style={{ fontSize: 12, color: "#a1a1aa" }}>{c.opportunity}</div></div>
 </div>
 ))}
 </div>
 )}
 <div style={S.grid2}>
 {result.monitoringKeywords && result.monitoringKeywords.length > 0 && (
 <div style={S.card}>
 <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Keywords to search for daily</div>
 <div style={{ fontSize: 11, color: "#71717a", marginBottom: 8 }}>When these come up in new posts, you have a chance to jump in and help</div>
 {result.monitoringKeywords.map((k, i) => (<div key={i} style={S.codeRow}><code style={{ fontSize: 12, color: "#38bdf8", flex: 1 }}>{k}</code><CopyBtn text={k} /></div>))}
 </div>
 )}
 {result.valueAddApproach && result.valueAddApproach.length > 0 && (
 <div style={S.tipBox}>
 <div style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24", marginBottom: 8 }}>How to be genuinely helpful (so people want to find out more about you)</div>
 {result.valueAddApproach.map((v, i) => <div key={i} style={{ fontSize: 13, color: "#fde68a", padding: "3px 0" }}>→ {v}</div>)}
 </div>
 )}
 </div>
 {result.redditSearchUrls && result.redditSearchUrls.length > 0 && (
 <div style={S.card}>
 <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>Bookmark these Reddit searches</div>
 <div style={{ fontSize: 11, color: "#71717a", marginBottom: 8 }}>Check them daily in 2 minutes to spot new threads to participate in</div>
 {result.redditSearchUrls.map((u, i) => (<div key={i} style={S.codeRow}><code style={{ fontSize: 11, color: "#38bdf8", flex: 1, wordBreak: "break-all" }}>{u}</code><CopyBtn text={u} /></div>))}
 </div>
 )}
 {result.contentThatPerformsWell && result.contentThatPerformsWell.length > 0 && (
 <div style={S.card}>
 <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Types of content that get upvoted in your niche communities</div>
 {result.contentThatPerformsWell.map((t, i) => <div key={i} style={{ fontSize: 13, color: "#a1a1aa", padding: "4px 0" }}>→ {t}</div>)}
 </div>
 )}
 <WhatToDoNow steps={[
 "Join the top 3 subreddits and add them to your daily routine",
 "For the first 2 weeks — only answer questions, never post your own links",
 "Bookmark the Reddit search URLs and check them for 2 minutes each morning",
 "Once trusted: if someone asks a question your content answers perfectly, share it",
 "Set up a free Google Alert for your brand name to catch mentions you can respond to",
 ]} />
 </div>
 )}
 </div>
 );
}

// ─── BROKEN LINKS ────────────────────────────────────────────────────────────
const BLEX = { niche: "eco yoga equipment", domain: "myyogashop.com", content: "Complete guide to eco yoga mats, Top 10 sustainable yoga accessories" };

function BrokenLinksTab() {
 const [niche, setNiche] = useState(""); const [domain, setDomain] = useState(""); const [content, setContent] = useState("");
 const [result, setResult] = useState(null); const [loading, setLoading] = useState(false); const [err, setErr] = useState("");

 const run = useCallback(async () => {
 if (!niche) return;
 setLoading(true); setErr(""); setResult(null);
 try {
 const d = await apiFetch(`${API}/broken-link-prospect`, { method: "POST", body: JSON.stringify({ niche, yourDomain: domain, existingContent: content.split(",").map(c => c.trim()).filter(Boolean) }) });
 if (!d.ok) throw new Error(d.error);
 setResult(d);
 } catch (e) { setErr(e.message); } finally { setLoading(false); }
 }, [niche, domain, content]);

 return (
 <div>
 <FeatureExplainer icon="" title={'Turn other websites\' dead links into backlinks for you'}
 what={"When a website links to a page that no longer exists (a 404 error), that's called a broken link. You find those dead links, then email the website owner: \"Hey, that link is broken — here's my similar page you could link to instead.\" It's helpful to them and gets you a link back. Win-win."}
 tip={"This works best when you already have content that covers the same topic as the broken link. If you don't have that content yet, create it first — then come back to this."} />
 <div style={S.card}>
 <div style={S.grid3}>
 <div><label style={S.label}>Your niche / industry</label><input style={S.input} value={niche} onChange={e => setNiche(e.target.value)} placeholder="eco yoga equipment" /></div>
 <div><label style={S.label}>Your website (optional)</label><input style={S.input} value={domain} onChange={e => setDomain(e.target.value)} placeholder="yourstore.com" /></div>
 <div><label style={S.label}>Content you already have (optional)</label><input style={S.input} value={content} onChange={e => setContent(e.target.value)} placeholder="eco mat guide, sustainable accessories list" /><div style={S.hint}>Comma-separated — pages you can offer as replacements</div></div>
 </div>
 <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
 <RunButton onClick={run} disabled={!niche} loading={loading} color="#b45309" label="Find Broken Link Opportunities" credits={1} />
 <button style={S.exBtn} onClick={() => { setNiche(BLEX.niche); setDomain(BLEX.domain); setContent(BLEX.content); }}>Try the example</button>
 </div>
 </div>
 {err && <div style={S.error}>{err}</div>}
 {result && (
 <div>
 {result.estimatedSuccessRate && (
 <div style={{ ...S.card, textAlign: "center", background: "linear-gradient(135deg,#1a1000,#0d0a00)" }}>
 <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>TYPICAL SUCCESS RATE FOR THIS TACTIC</div>
 <div style={{ fontSize: 48, fontWeight: 900, color: "#22c55e" }}>{result.estimatedSuccessRate}</div>
 <div style={{ fontSize: 12, color: "#71717a", marginTop: 4 }}>of broken link outreach emails result in a new backlink for you</div>
 </div>
 )}
 {result.prospectingSearchQueries && result.prospectingSearchQueries.length > 0 && (
 <div style={S.card}>
 <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Step 1: Find resource pages in your niche</div>
 <div style={{ fontSize: 12, color: "#71717a", marginBottom: 12 }}>Paste these into Google. You're looking for "best resources", "useful links" or reference pages in your niche. These pages have tons of links — some will be broken. Install the free "Check My Links" Chrome extension to highlight dead links in red on any page you visit.</div>
 {result.prospectingSearchQueries.map((q, i) => (<div key={i} style={S.codeRow}><code style={{ fontSize: 12, color: "#38bdf8", flex: 1 }}>{q}</code><CopyBtn text={q} /></div>))}
 </div>
 )}
 {result.toolsToUse && result.toolsToUse.length > 0 && (
 <div style={S.card}>
 <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}> Step 2: Tools that highlight broken links for you</div>
 <div style={{ fontSize: 12, color: "#71717a", marginBottom: 10 }}>Install one of the free tools below. It will automatically colour dead links red as you browse pages.</div>
 {result.toolsToUse.map((t, i) => (
 <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "8px 0", borderBottom: "1px solid #27272a" }}>
 <span style={{ fontSize: 13, fontWeight: 700, minWidth: 180 }}>{t.tool}</span>
 <span style={{ fontSize: 12, color: "#a1a1aa", flex: 1 }}>{t.purpose}</span>
 <span style={S.badge(t.free ? "#22c55e" : "#ef4444")}>{t.free ? "Free" : "Paid"}</span>
 </div>
 ))}
 </div>
 )}
 {result.outreachTemplate && (
 <div style={{ ...S.card, border: "1px solid #451a03" }}>
 <div style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b", marginBottom: 4 }}>Step 3: Send this email to the site owner</div>
 <div style={{ fontSize: 12, color: "#71717a", marginBottom: 14 }}>This politely points out their broken link AND offers yours as a replacement. It's helpful to them — that's why it works so well. Fill in the [brackets].</div>
 <div style={{ marginBottom: 10 }}>
 <div style={S.label}>SUBJECT LINE</div>
 <div style={{ display: "flex", gap: 8 }}><div style={{ flex: 1, background: "#09090b", borderRadius: 6, padding: "9px 12px", fontSize: 13 }}>{result.outreachTemplate.subject}</div><CopyBtn text={result.outreachTemplate.subject} /></div>
 </div>
 <div style={S.label}>EMAIL BODY</div>
 <div style={S.emailBox}>{result.outreachTemplate.body}</div>
 <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}><CopyBtn text={result.outreachTemplate.body} /></div>
 {result.outreachTemplate.keyElements && result.outreachTemplate.keyElements.length > 0 && (
 <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #27272a" }}>
 <div style={{ fontSize: 11, color: "#71717a", marginBottom: 6 }}>Why this email works:</div>
 {result.outreachTemplate.keyElements.map((e, i) => <div key={i} style={{ fontSize: 12, color: "#a1a1aa", padding: "2px 0" }}>{e}</div>)}
 </div>
 )}
 </div>
 )}
 <div style={S.grid2}>
 {result.contentToCreate && result.contentToCreate.length > 0 && (
 <div style={S.card}>
 <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Content to create as the replacement</div>
 <div style={{ fontSize: 11, color: "#71717a", marginBottom: 8 }}>If you don't have suitable content yet, these types work best</div>
 {result.contentToCreate.map((c, i) => <div key={i} style={{ fontSize: 13, color: "#a1a1aa", padding: "4px 0" }}>→ {c}</div>)}
 </div>
 )}
 {result.scalingTips && result.scalingTips.length > 0 && (
 <div style={S.card}>
 <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>How to do more of this once it's working</div>
 {result.scalingTips.map((t, i) => <div key={i} style={{ fontSize: 13, color: "#a1a1aa", padding: "4px 0" }}>→ {t}</div>)}
 </div>
 )}
 </div>
 <WhatToDoNow steps={[
 "Install 'Check My Links' Chrome extension (free — takes 30 seconds)",
 "Run the Google searches above and browse 5–10 resource pages in your niche",
 "Use the extension to spot broken (red) links on those pages",
 "For each broken link you find, send the personalised email template above",
 "Keep a spreadsheet: Site | Broken URL | Your replacement URL | Date sent | Status",
 ]} />
 </div>
 )}
 </div>
 );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
const TABS = [
 { id: "link-gap", label: "Link Gap", component: LinkGapTab },
 { id: "unlinked", label: " Unlinked Mentions", component: UnlinkedMentionsTab },
 { id: "outreach", label: "Outreach Emails", component: OutreachSequencesTab },
 { id: "pr", label: "PR Coverage", component: PRStoriesTab },
 { id: "guest", label: "Guest Posts", component: GuestPostTab },
 { id: "communities", label: "Communities", component: CommunitiesTab },
 { id: "broken", label: "Broken Links", component: BrokenLinksTab },
];

export default function LinkIntersectOutreach() {
 const [activeTab, setActiveTab] = useState("link-gap");
 const [shopInfo, setShopInfo] = useState({ domain: "", name: "" });

 useEffect(() => {
 // Try cached value immediately for instant pre-fill
 try {
 const cached = localStorage.getItem("aura-lio-shop");
 if (cached) setShopInfo(JSON.parse(cached));
 } catch {}
 // Fetch fresh from the Shopify-backed endpoint
 apiFetch(`${API}/shop-info`).then(d => {
 if (d.ok && (d.domain || d.name)) {
 const info = { domain: d.domain || "", name: d.name || "" };
 setShopInfo(info);
 try { localStorage.setItem("aura-lio-shop", JSON.stringify(info)); } catch {}
 }
 }).catch(() => {});
 }, []);

 const ActiveTab = TABS.find(t => t.id === activeTab).component;
 return (
 <div style={S.wrap}>
 <style>{`@keyframes lio-spin { to { transform: rotate(360deg); } }`}</style>
 <div style={S.header}>
 <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 14 }}>
 <div style={{ background: "linear-gradient(135deg,#7c3aed,#4f46e5)", borderRadius: 12, width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}></div>
 <div>
 <div style={S.title}>Link Building & Outreach</div>
 <div style={S.subtitle}>Backlinks from other websites are one of Google's biggest ranking factors. More quality links = higher rankings = more traffic.</div>
 </div>
 </div>
 <div style={{ background: "#1a1412", border: "1px solid #78350f", borderRadius: 8, padding: "10px 16px", marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
 <span style={{ flexShrink: 0 }}></span>
 <div style={{ fontSize: 12, color: "#fde68a", lineHeight: 1.6 }}>
 <strong>New here? Start with Link Gap.</strong> It shows where your competitors have more links than you — those gaps are your opportunities. Then use the other tools to go after them one by one. Every tab has a plain-English explainer and an example to try.
 </div>
 </div>
 <div style={S.tabsRow}>
 {TABS.map(t => (
 <button key={t.id} style={S.tab(activeTab === t.id)} onClick={() => setActiveTab(t.id)}>{t.label}</button>
 ))}
 </div>
 </div>
 <div style={S.body}><ActiveTab shopInfo={shopInfo} /></div>
 </div>
 );
}
