import React, { useState, useCallback, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { useCreditError } from "../../globalCreditError";
import { useCredits, ACTION_COSTS } from "../../hooks/useCredits";
import BackButton from "./BackButton";
import { ScoreRing, ErrorBox, scoreColor as mozScoreColor } from "../MozUI";

const API = "/api/tools/seo-site-crawler";

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
 violet: "#7c3aed",
 violetL: "#a78bfa",
 teal: "#0d9488",
};

/* ── Style helpers ── */
const S = {
 page: { minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", paddingBottom: 80 },
 topBar: { display: "flex", alignItems: "center", gap: 12, padding: "18px 28px 0", flexWrap: "wrap" },
 title: { fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" },
 badge: { fontSize: 11, fontWeight: 600, borderRadius: 999, padding: "3px 10px", background: "#1e1b4b", color: C.indigoL, border: `1px solid #3730a3` },
 body: { padding: "28px 28px 0" },
 card: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 22px", marginBottom: 16 },
 row: { display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" },
 input: { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, padding: "9px 12px", width: "100%", outline: "none", boxSizing: "border-box" },
 textarea:{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, padding: "9px 12px", width: "100%", outline: "none", boxSizing: "border-box", resize: "vertical", lineHeight: 1.6 },
 btn: (v = "default") => ({
 cursor: "pointer", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13,
 padding: "9px 18px", display: "inline-flex", alignItems: "center", gap: 6, transition: "opacity .15s",
 background: v === "primary" ? C.indigo : v === "danger" ? "#991b1b" : v === "violet" ? C.violet : v === "green" ? "#15803d" : "#27272a",
 color: C.text,
 }),
 spinner: { display: "inline-block", width: 14, height: 14, border: `2px solid ${C.border}`, borderTop: `2px solid ${C.indigoL}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" },
 err: { background: "#1c0000", border: `1px solid #7f1d1d`, borderRadius: 8, color: "#fca5a5", fontSize: 13, padding: "12px 16px", marginBottom: 16 },
 empty: { color: C.sub, fontSize: 14, padding: "40px 0", textAlign: "center" },
 pill: (sev) => ({
 fontSize: 10, fontWeight: 700, borderRadius: 999, padding: "2px 8px",
 background: sev === "high" ? "#450a0a" : sev === "medium" ? "#431407" : "#1c1917",
 color: sev === "high" ? "#f87171" : sev === "medium" ? "#fb923c" : "#a8a29e",
 }),
 sidebar: { width: 220, flexShrink: 0, borderRight: `1px solid ${C.border}`, paddingTop: 8, background: "#0f0f11" },
 sItem: (active) => ({ display: "flex", flexDirection: "column", gap: 3, padding: "11px 16px", cursor: "pointer", borderRadius: 8, margin: "2px 8px", background: active ? "#1e1b4b" : "transparent", borderLeft: active ? `3px solid ${C.indigo}` : "3px solid transparent", transition: "background .12s" }),
 sHead: { fontSize: 10, fontWeight: 700, color: C.dim, textTransform: "uppercase", letterSpacing: 1, padding: "18px 24px 6px" },
 layout: { display: "flex", minHeight: "calc(100vh - 90px)" },
 main: { flex: 1, padding: "24px 28px", overflow: "auto" },
};

const SECTIONS = [
 { id: "overview", title: "Overview", desc: "Scan summary & health score", icon: "", color: C.indigo },
 { id: "products", title: "Fix Products", desc: "AI-fix product SEO: titles & meta", icon: "", color: C.violet },
 { id: "pages", title: "Fix Pages", desc: "AI-fix CMS pages meta & content", icon: "", color: C.teal },
 { id: "collections", title: "Fix Collections", desc: "AI-fix collection titles & meta", icon: "", color: C.amber },
];

function SeverityBadge({ sev }) {
 return <span style={S.pill(sev)}>{sev?.toUpperCase()}</span>;
}

function Toast({ message, onClose }) {
 useEffect(() => {
 const t = setTimeout(onClose, 3500);
 return () => clearTimeout(t);
 }, [onClose]);
 return (
 <div style={{ position: "fixed", bottom: 28, right: 28, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 20px", fontSize: 13, color: C.text, zIndex: 9999, boxShadow: "0 4px 24px #00000080", maxWidth: 360 }}>
 {message}
 </div>
 );
}

export default function SiteAuditFixer() {
 const [activeSection, setActiveSection] = useState("overview");
 const [lastScan, setLastScan] = useState(null);
 const [scanLoading, setScanLoading] = useState(false);
 const [scanErr, setScanErr] = useState(null);

 // Per-section fix state
 const [fixes, setFixes] = useState([]); // AI-generated fix objects
 const [fixLoading, setFixLoading] = useState(false);
 const [fixErr, setFixErr] = useState(null);
 const [editedFixes, setEditedFixes] = useState({}); // {productId: {seoTitle, metaDescription}}

 const [applyLoading, setApplyLoading] = useState({}); // {productId: bool}
 const [applied, setApplied] = useState(new Set());
 const [applyErr, setApplyErr] = useState({});

 const [applyAllLoading, setApplyAllLoading] = useState(false);
 const [applyAllResult, setApplyAllResult] = useState(null);

 const [toast, setToast] = useState(null);

 const { balance, unlimited } = useCredits();
 const creditErr = useCreditError();

 const showToast = useCallback((msg) => setToast(msg), []);

 /* ── Load last scan on mount ── */
 useEffect(() => {
 async function loadLastScan() {
 setScanLoading(true); setScanErr(null);
 try {
 const r = await apiFetchJSON(`${API}/last-results`);
 if (r.ok) setLastScan(r);
 else setScanErr(r.error || "No scan found — run a Site Audit first");
 } catch (e) {
 setScanErr(e.message || "Failed to load scan data");
 }
 setScanLoading(false);
 }
 loadLastScan();
 }, []);

 /* ── Run a new scan ── */
 const runScan = useCallback(async () => {
 setScanLoading(true); setScanErr(null);
 try {
 const r = await apiFetchJSON(`${API}/ai/crawl`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
 if (r.ok) {
 setLastScan(r.result || r);
 setFixes([]);
 setEditedFixes({});
 setApplied(new Set());
 setApplyAllResult(null);
 showToast("Site audit complete");
 } else setScanErr(r.error || "Scan failed");
 } catch (e) { setScanErr(e.message || "Scan failed"); }
 setScanLoading(false);
 }, [showToast]);

 /* ── Derive pages per section ── */
 const pages = lastScan?.pages || [];
 const productPages = pages.filter(p => p.url?.includes("/products/"));
 const cmsPages = pages.filter(p => p.url?.includes("/pages/"));
 const collectionPages= pages.filter(p => p.url?.includes("/collections/"));

 const pagesWithIssues = (arr) => arr.filter(p => (p.issues || []).length > 0);

 /* ── Generate AI fixes ── */
 const generateFixes = useCallback(async (type = "products") => {
 setFixLoading(true); setFixErr(null); setFixes([]); setEditedFixes({}); setApplied(new Set()); setApplyAllResult(null);
 try {
 // Pass the crawl result so the backend has context even if its memory cleared
 const body = lastScan ? { crawlResult: lastScan } : {};
 const r = await apiFetchJSON(`${API}/bulk-fix`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(body),
 });
 if (r.ok) {
 setFixes(r.fixes || []);
 // Seed editedFixes with AI values
 const init = {};
 for (const f of (r.fixes || [])) {
 init[f.productId] = { seoTitle: f.seoTitle || "", metaDescription: f.metaDescription || "" };
 }
 setEditedFixes(init);
 if ((r.fixes || []).length === 0) showToast("No product issues to fix — all products look good!");
 else showToast(`AI generated fixes for ${r.fixes.length} products`);
 } else { setFixErr(r.error || "AI fix generation failed"); }
 } catch (e) { setFixErr(e.message || "AI fix generation failed"); }
 setFixLoading(false);
 }, [lastScan, showToast]);

 /* ── Apply fix for one product ── */
 const applyOne = useCallback(async (productId) => {
 const edited = editedFixes[productId] || {};
 const fix = fixes.find(f => f.productId === productId);
 if (!fix) return;
 setApplyLoading(p => ({ ...p, [productId]: true }));
 setApplyErr(p => ({ ...p, [productId]: null }));
 try {
 const r = await apiFetchJSON(`${API}/apply-fixes`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ fixes: [{ ...fix, seoTitle: edited.seoTitle, metaDescription: edited.metaDescription }] }),
 });
 if (r.ok && r.results?.[0]?.ok) {
 setApplied(p => new Set([...p, productId]));
 showToast(`"${fix.productName}" updated in Shopify`);
 } else {
 const err = r.results?.[0]?.error || r.error || "Apply failed";
 setApplyErr(p => ({ ...p, [productId]: err }));
 }
 } catch (e) { setApplyErr(p => ({ ...p, [productId]: e.message })); }
 setApplyLoading(p => ({ ...p, [productId]: false }));
 }, [fixes, editedFixes, showToast]);

 /* ── Apply all fixes ── */
 const applyAll = useCallback(async () => {
 const toApply = fixes.filter(f => !applied.has(f.productId));
 if (!toApply.length) { showToast("Nothing left to apply — all changes applied!"); return; }
 setApplyAllLoading(true);
 try {
 const payload = toApply.map(f => ({ ...f, ...(editedFixes[f.productId] || {}) }));
 const r = await apiFetchJSON(`${API}/apply-fixes`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ fixes: payload }),
 });
 if (r.ok) {
 const succeededIds = new Set((r.results || []).filter(x => x.ok).map(x => x.productId));
 setApplied(p => new Set([...p, ...succeededIds]));
 setApplyAllResult({ success: r.success, failed: r.failed, total: toApply.length });
 showToast(`${r.success} of ${toApply.length} products updated in Shopify`);
 } else { showToast(`Error: ${r.error}`); }
 } catch (e) { showToast(`Error: ${e.message}`); }
 setApplyAllLoading(false);
 }, [fixes, editedFixes, applied, showToast]);

 /* ── Stat card ── */
 function StatCard({ label, value, color }) {
 return (
 <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 20px", minWidth: 120, textAlign: "center" }}>
 <div style={{ fontSize: 28, fontWeight: 800, color: color || C.text }}>{value ?? "—"}</div>
 <div style={{ fontSize: 12, color: C.sub, marginTop: 4 }}>{label}</div>
 </div>
 );
 }

 /* ── Issue list for a section ── */
 function IssueList({ pages: arr }) {
 const withIssues = pagesWithIssues(arr);
 if (!withIssues.length) return (
 <div style={{ ...S.card, textAlign: "center", color: C.green, padding: 32 }}>
 No SEO issues found in this section — great work!
 </div>
 );
 return (
 <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
 {withIssues.map((page, pi) => (
 <div key={pi} style={S.card}>
 <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
 <div style={{ flex: 1 }}>
 <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{page.title || page.url}</div>
 <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>{page.url}</div>
 </div>
 <span style={{ ...S.pill((page.issues||[]).some(i=>i.severity==="high") ? "high" : "medium"), fontSize: 11, padding: "3px 10px" }}>
 {page.issues.length} issue{page.issues.length !== 1 ? "s" : ""}
 </span>
 </div>
 <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
 {(page.issues || []).map((issue, ii) => (
 <div key={ii} style={{ display: "flex", alignItems: "flex-start", gap: 8, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px" }}>
 <SeverityBadge sev={issue.severity} />
 <div style={{ flex: 1 }}>
 <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{issue.type}</div>
 <div style={{ fontSize: 11, color: C.sub, marginTop: 2, lineHeight: 1.5 }}>{issue.detail}</div>
 </div>
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>
 );
 }

 /* ── Fix cards for a section ── */
 function FixCards({ filterType }) {
 const sectionFixes = fixes.filter(f => {
 if (filterType === "products") return f.url?.includes("/products/");
 if (filterType === "pages") return f.url?.includes("/pages/");
 if (filterType === "collections") return f.url?.includes("/collections/");
 return true;
 });

 if (sectionFixes.length === 0) {
 return (
 <div style={{ ...S.card, color: C.sub, textAlign: "center", padding: 32 }}>
 No AI fixes generated for this section yet. Click "Generate AI Fixes" above.
 </div>
 );
 }

 const allApplied = sectionFixes.every(f => applied.has(f.productId));
 const unapplied = sectionFixes.filter(f => !applied.has(f.productId));

 return (
 <div>
 {/* Bulk action bar */}
 <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
 {!allApplied && (
 <button
 style={{ ...S.btn("green"), fontSize: 13, padding: "10px 22px", opacity: applyAllLoading ? 0.7 : 1 }}
 disabled={applyAllLoading}
 onClick={applyAll}>
 {applyAllLoading
 ? <><span style={S.spinner} /> Applying…</>
 : `Apply All to Shopify (${unapplied.length})`}
 </button>
 )}
 {allApplied && (
 <div style={{ fontSize: 13, fontWeight: 600, color: C.green }}>All fixes applied to Shopify!</div>
 )}
 {applyAllResult && (
 <div style={{ fontSize: 12, color: C.sub }}>
 {applyAllResult.success} succeeded · {applyAllResult.failed} failed
 </div>
 )}
 </div>

 {/* Fix cards */}
 <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
 {sectionFixes.map(fix => {
 const isApplied = applied.has(fix.productId);
 const isApplying = applyLoading[fix.productId];
 const err = applyErr[fix.productId];
 const edited = editedFixes[fix.productId] || { seoTitle: fix.seoTitle, metaDescription: fix.metaDescription };

 const titleLen = (edited.seoTitle || "").length;
 const metaLen = (edited.metaDescription || "").length;
 const titleOk = titleLen >= 50 && titleLen <= 60;
 const metaOk = metaLen >= 120 && metaLen <= 160;

 return (
 <div
 key={fix.productId}
 style={{
 background: C.surface,
 border: `1px solid ${isApplied ? "#14532d" : C.border}`,
 borderRadius: 12,
 overflow: "hidden",
 }}>
 {/* Card header */}
 <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", background: "#1c1c1f", borderBottom: `1px solid ${C.border}` }}>
 <span style={{ fontSize: 18 }}></span>
 <div style={{ flex: 1 }}>
 <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{fix.productName}</div>
 <div style={{ fontSize: 11, color: C.dim, marginTop: 1 }}>{fix.url}</div>
 </div>
 {isApplied
 ? <span style={{ fontSize: 11, fontWeight: 700, color: C.green, background: "#0c1a0c", borderRadius: 6, padding: "3px 10px" }}>Applied</span>
 : <span style={{ fontSize: 11, fontWeight: 700, color: C.violetL, background: "#2e1065", borderRadius: 6, padding: "3px 10px" }}>Ready to apply</span>}
 </div>

 {/* Issues summary */}
 {(fix.issues || []).length > 0 && (
 <div style={{ padding: "10px 18px 0", display: "flex", gap: 6, flexWrap: "wrap" }}>
 {fix.issues.slice(0, 4).map((iss, i) => (
 <span key={i} style={S.pill(iss.severity)}>{iss.type}</span>
 ))}
 {fix.issues.length > 4 && <span style={{ fontSize: 10, color: C.dim }}>+{fix.issues.length - 4} more</span>}
 </div>
 )}

 {/* Editable fields */}
 <div style={{ padding: "14px 18px 18px" }}>
 {/* SEO Title */}
 <div style={{ marginBottom: 14 }}>
 <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
 <label style={{ fontSize: 12, fontWeight: 600, color: C.sub }}>SEO Title</label>
 <span style={{ fontSize: 11, color: titleOk ? C.green : C.amber }}>
 {titleLen} / 60 chars {titleOk ? "" : titleLen < 50 ? "(too short)" : "(too long)"}
 </span>
 </div>
 <input
 style={{ ...S.input, borderColor: titleOk ? "#14532d" : C.border }}
 value={edited.seoTitle}
 onChange={e => setEditedFixes(p => ({ ...p, [fix.productId]: { ...edited, seoTitle: e.target.value } }))}
 placeholder="50–60 character SEO title…"
 maxLength={80}
 />
 </div>

 {/* Meta Description */}
 <div style={{ marginBottom: 14 }}>
 <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
 <label style={{ fontSize: 12, fontWeight: 600, color: C.sub }}>Meta Description</label>
 <span style={{ fontSize: 11, color: metaOk ? C.green : C.amber }}>
 {metaLen} / 160 chars {metaOk ? "" : metaLen < 120 ? "(too short)" : "(too long)"}
 </span>
 </div>
 <textarea
 style={{ ...S.textarea, borderColor: metaOk ? "#14532d" : C.border, minHeight: 70 }}
 value={edited.metaDescription}
 onChange={e => setEditedFixes(p => ({ ...p, [fix.productId]: { ...edited, metaDescription: e.target.value } }))}
 placeholder="120–160 character meta description…"
 maxLength={200}
 />
 </div>

 {/* Alt text (read-only preview if provided) */}
 {fix.altText && (
 <div style={{ marginBottom: 14 }}>
 <label style={{ fontSize: 12, fontWeight: 600, color: C.sub, display: "block", marginBottom: 6 }}>AI-Suggested Image Alt Text</label>
 <div style={{ fontSize: 12, color: C.sub, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", lineHeight: 1.5 }}>
 {fix.altText}
 <span style={{ fontSize: 10, color: C.dim, marginLeft: 8 }}>(applied via Image SEO tool separately)</span>
 </div>
 </div>
 )}

 {err && <div style={{ ...S.err, marginBottom: 12 }}>{err}</div>}

 {!isApplied && (
 <button
 style={{ ...S.btn("violet"), fontSize: 13, padding: "9px 20px", opacity: isApplying ? 0.7 : 1 }}
 disabled={isApplying}
 onClick={() => applyOne(fix.productId)}>
 {isApplying ? <><span style={S.spinner} /> Saving to Shopify…</> : "Save to Shopify"}
 </button>
 )}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 );
 }

 /* ── Section content renderer ── */
 function SectionContent() {
 const sec = activeSection;

 if (scanLoading) {
 return (
 <div style={{ textAlign: "center", paddingTop: 80, color: C.sub }}>
 <span style={{ ...S.spinner, width: 28, height: 28, borderTopColor: C.indigoL }} />
 <div style={{ marginTop: 16, fontSize: 14 }}>Loading site audit data…</div>
 </div>
 );
 }

 if (scanErr && !lastScan) {
 return (
 <div>
 <ErrorBox message={scanErr} />
 <button style={S.btn("primary")} onClick={runScan}>
 {scanLoading ? <><span style={S.spinner} /> Scanning…</> : "Run Site Audit Now"}
 </button>
 </div>
 );
 }

 /* ── Overview ── */
 if (sec === "overview") {
 const hi = lastScan?.high || 0;
 const med = lastScan?.medium || 0;
 const lo = lastScan?.low || 0;
 const tot = hi + med + lo;
 const health = tot === 0 ? 100 : Math.max(0, Math.round(100 - hi * 4 - med * 2 - lo));
 return (
 <div>
 <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 20px" }}>Site Audit Overview</h2>

 {/* Last scan info */}
 {lastScan?.scannedAt && (
 <div style={{ fontSize: 12, color: C.dim, marginBottom: 20 }}>
 Last scanned: {new Date(lastScan.scannedAt).toLocaleString()} · {lastScan.pagesScanned || 0} pages crawled
 </div>
 )}

 {/* Health score */}
 <div style={{ ...S.card, display: "flex", alignItems: "center", gap: 24, marginBottom: 24 }}>
 <ScoreRing score={health} label="SEO Health" size={90} />
 <div style={{ flex: 1 }}>
 <div style={{ height: 10, background: C.muted, borderRadius: 999, marginBottom: 10, overflow: "hidden" }}>
 <div style={{ height: "100%", borderRadius: 999, width: `${health}%`, background: health >= 80 ? C.green : health >= 50 ? C.amber : C.red, transition: "width 1s" }} />
 </div>
 <div style={{ fontSize: 13, color: C.sub }}>
 {tot === 0 ? "Your store has no SEO issues — excellent!" : `${tot} issue${tot !== 1 ? "s" : ""} found across ${lastScan?.pagesScanned || 0} pages`}
 </div>
 </div>
 </div>

 {/* Stats */}
 <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
 <StatCard label="Pages Scanned" value={lastScan?.pagesScanned || 0} color={C.text} />
 <StatCard label="High Priority" value={hi} color={hi > 0 ? C.red : C.green} />
 <StatCard label="Medium Priority" value={med} color={med > 0 ? C.amber : C.green} />
 <StatCard label="Low Priority" value={lo} color={lo > 0 ? C.sub : C.green} />
 </div>

 {/* Issue breakdown */}
 <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}>Issues by Page Type</h3>
 <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
 {[
 { label: "Products", count: pagesWithIssues(productPages).length, total: productPages.length, section: "products", icon: "" },
 { label: "Pages", count: pagesWithIssues(cmsPages).length, total: cmsPages.length, section: "pages", icon: "" },
 { label: "Collections", count: pagesWithIssues(collectionPages).length, total: collectionPages.length, section: "collections", icon: "" },
 ].map(row => (
 <div
 key={row.section}
 onClick={() => setActiveSection(row.section)}
 style={{ ...S.card, flex: 1, minWidth: 160, cursor: "pointer", display: "flex", flexDirection: "column", gap: 8, transition: "border-color .15s", borderColor: row.count > 0 ? C.muted : "#14532d" }}>
 <div style={{ fontSize: 24 }}>{row.icon}</div>
 <div style={{ fontSize: 22, fontWeight: 800, color: row.count > 0 ? C.red : C.green }}>{row.count}</div>
 <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{row.label}</div>
 <div style={{ fontSize: 11, color: C.dim }}>{row.count} of {row.total} have issues</div>
 {row.count > 0 && (
 <div style={{ fontSize: 12, color: C.indigoL, marginTop: 4 }}>Fix issues →</div>
 )}
 </div>
 ))}
 </div>

 {/* Action row */}
 <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
 <button style={{ ...S.btn("primary"), fontSize: 14, padding: "11px 24px", opacity: scanLoading ? 0.7 : 1 }} disabled={scanLoading} onClick={runScan}>
 {scanLoading ? <><span style={S.spinner} /> Scanning…</> : "Re-run Site Audit"}
 </button>
 {productPages.length > 0 && pagesWithIssues(productPages).length > 0 && (
 <button style={{ ...S.btn("violet"), fontSize: 14, padding: "11px 24px" }} onClick={() => { setActiveSection("products"); generateFixes("products"); }}>
 AI Fix All Products
 </button>
 )}
 </div>

 {scanErr && lastScan && <ErrorBox message={scanErr} />}
 </div>
 );
 }

 /* ── Section pages with AI fix flow ── */
 const typeMap = { products: productPages, pages: cmsPages, collections: collectionPages };
 const iconMap = { products: "", pages: "", collections: "" };
 const labelMap = { products: "Products", pages: "Pages", collections: "Collections" };
 const currentPages = typeMap[sec] || [];
 const issuePages = pagesWithIssues(currentPages);
 const hasFixes = fixes.filter(f => {
 if (sec === "products") return f.url?.includes("/products/");
 if (sec === "pages") return f.url?.includes("/pages/");
 if (sec === "collections") return f.url?.includes("/collections/");
 return false;
 }).length > 0;

 return (
 <div>
 {/* Section header */}
 <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
 <span style={{ fontSize: 24 }}>{iconMap[sec]}</span>
 <div>
 <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Fix {labelMap[sec]}</h2>
 <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
 {issuePages.length} of {currentPages.length} {labelMap[sec].toLowerCase()} have SEO issues
 </div>
 </div>
 </div>

 {/* Step 1 — Issues list */}
 <div style={{ marginBottom: 28 }}>
 <div style={{ fontSize: 13, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
 Step 1 — Current Issues
 </div>
 {!lastScan ? (
 <div style={S.empty}>Run a Site Audit first to see issues.</div>
 ) : (
 <IssueList pages={currentPages} />
 )}
 </div>

 {/* Step 2 — Generate fixes */}
 {issuePages.length > 0 && (
 <div style={{ marginBottom: 28 }}>
 <div style={{ fontSize: 13, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
 Step 2 — Generate AI Fixes {sec === "products" ? <span style={{ fontSize: 11, fontWeight: 400, color: C.dim }}>(costs 2 credits per product)</span> : null}
 </div>

 <button
 style={{ ...S.btn("violet"), fontSize: 14, padding: "11px 24px", opacity: fixLoading ? 0.7 : 1 }}
 disabled={fixLoading}
 onClick={() => generateFixes(sec)}>
 {fixLoading
 ? <><span style={S.spinner} /> Generating AI fixes…</>
 : hasFixes ? "Regenerate AI Fixes" : "Generate AI Fixes"}
 </button>

 {fixErr && <div style={{ ...S.err, marginTop: 12 }}>{fixErr}</div>}
 </div>
 )}

 {/* Step 3 — Review & apply */}
 {hasFixes && (
 <div>
 <div style={{ fontSize: 13, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
 Step 3 — Review & Apply to Shopify
 </div>
 <div style={{ fontSize: 12, color: C.dim, marginBottom: 16 }}>
 Review and edit the AI-generated SEO fields below, then apply them directly to your Shopify store with one click.
 </div>
 <FixCards filterType={sec} />
 </div>
 )}
 </div>
 );
 }

 /* ── Render ── */
 return (
 <div style={S.page}>
 <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

 {/* Top bar */}
 <div style={S.topBar}>
 <BackButton />
 <div style={S.title}>Site Audit Fixer</div>
 <span style={S.badge}>AI-Powered SEO Fixes</span>
 <div style={{ flex: 1 }} />
 <div style={{ fontSize: 12, color: C.sub }}>
 {unlimited ? "Unlimited credits" : `${balance ?? "…"} credits`}
 </div>
 </div>

 {/* Layout */}
 <div style={{ ...S.layout, marginTop: 20 }}>
 {/* Sidebar */}
 <div style={S.sidebar}>
 <div style={S.sHead}>Navigation</div>
 {SECTIONS.map(sec => (
 <div key={sec.id} style={S.sItem(activeSection === sec.id)} onClick={() => setActiveSection(sec.id)}>
 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
 <span style={{ fontSize: 16 }}>{sec.icon}</span>
 <span style={{ fontSize: 13, fontWeight: 600, color: activeSection === sec.id ? C.text : C.sub }}>{sec.title}</span>
 </div>
 <div style={{ fontSize: 11, color: C.dim, paddingLeft: 24, lineHeight: 1.4 }}>{sec.desc}</div>
 {/* Issue count badge */}
 {lastScan && (() => {
 const cnt =
 sec.id === "products" ? pagesWithIssues(productPages).length :
 sec.id === "pages" ? pagesWithIssues(cmsPages).length :
 sec.id === "collections" ? pagesWithIssues(collectionPages).length : 0;
 return cnt > 0 ? (
 <span style={{ marginLeft: 24, marginTop: 2, fontSize: 10, fontWeight: 700, background: "#450a0a", color: "#f87171", borderRadius: 999, padding: "1px 7px", alignSelf: "flex-start" }}>
 {cnt} issues
 </span>
 ) : null;
 })()}
 </div>
 ))}

 {/* Re-run scan */}
 <div style={{ padding: "20px 16px 8px" }}>
 <button
 style={{ ...S.btn("primary"), width: "100%", justifyContent: "center", fontSize: 12, padding: "9px 0", opacity: scanLoading ? 0.7 : 1 }}
 disabled={scanLoading}
 onClick={runScan}>
 {scanLoading ? <><span style={S.spinner} /> Scanning…</> : "Run New Scan"}
 </button>
 </div>
 </div>

 {/* Main content */}
 <div style={S.main}>
 <SectionContent />
 </div>
 </div>

 {/* Toast */}
 {toast && <Toast message={toast} onClose={() => setToast(null)} />}
 </div>
 );
}
