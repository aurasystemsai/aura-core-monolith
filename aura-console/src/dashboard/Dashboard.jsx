import React, { useState, useEffect, useCallback, Suspense, lazy } from "react";
import { apiFetch, apiFetchJSON } from "../api";
import { sendCopilotMessage } from "../core/advancedAiClient";
import IntegrationHealthPanel from "../components/IntegrationHealthPanel";

const DashboardCharts = lazy(() => import("./DashboardCharts"));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Spinner({ size = 28 }) {
	return (
		<div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 80 }}>
			<div style={{
				width: size, height: size,
				border: "3px solid #27272a",
				borderTop: "3px solid #6366f1",
				borderRadius: "50%",
				animation: "spin 0.8s linear infinite",
			}} />
		</div>
	);
}

function GaugeArc({ percent, size = 90, color = "#6366f1" }) {
	const r = 36, cx = 50, cy = 50;
	const circumference = Math.PI * r;
	const dash = (percent / 100) * circumference;
	return (
		<svg width={size} height={size / 2 + 14} viewBox="0 0 100 60">
			<path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
				fill="none" stroke="#27272a" strokeWidth="10" strokeLinecap="round" />
			<path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
				fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
				strokeDasharray={`${dash} ${circumference}`}
				style={{ transition: "stroke-dasharray 0.6s ease" }} />
			<text x="50" y="56" textAnchor="middle" fill="#fafafa" fontSize="13" fontWeight="800">{percent}%</text>
		</svg>
	);
}

// ─── Sub-widgets ──────────────────────────────────────────────────────────────

const Widget = ({ title, info, children, onClose, action, style = {} }) => (
	<div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 14, overflow: "hidden", ...style }}>
		<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: "1px solid #27272a" }}>
			<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
				<span style={{ color: "#fafafa", fontWeight: 700, fontSize: 15 }}>{title}</span>
				{info && <span title={info} style={{ color: "#52525b", fontSize: 13, cursor: "help" }}>ⓘ</span>}
			</div>
			<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
				{action}
				{onClose && <button onClick={onClose} style={{ background: "none", border: "none", color: "#52525b", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>}
			</div>
		</div>
		<div style={{ padding: "16px 18px" }}>{children}</div>
	</div>
);

const MetricPill = ({ label, value, sub, color = "#6366f1", onClick }) => (
	<div onClick={onClick} style={{
		display: "flex", flexDirection: "column", gap: 2,
		padding: "10px 14px", background: "#09090b", borderRadius: 10,
		border: "1px solid #27272a", flex: 1, cursor: onClick ? "pointer" : "default",
	}}>
		<span style={{ fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
		<span style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1.1 }}>{value ?? "—"}</span>
		{sub && <span style={{ fontSize: 11, color: "#52525b" }}>{sub}</span>}
	</div>
);

const SetupCard = ({ icon, title, desc, onClick }) => (
	<div className="aura-setup-card" style={{
		background: "#09090b", border: "1px solid #27272a", borderRadius: 12,
		padding: "18px 16px", display: "flex", flexDirection: "column", gap: 10,
	}}>
		<span style={{ fontSize: 24 }}>{icon}</span>
		<div style={{ fontWeight: 700, color: "#fafafa", fontSize: 14 }}>{title}</div>
		<div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.4 }}>{desc}</div>
		<button onClick={onClick} style={{
			background: "#6366f1", color: "#fff", border: "none",
			borderRadius: 8, padding: "8px 16px", fontWeight: 700,
			fontSize: 13, cursor: "pointer", marginTop: "auto",
		}}>Set up</button>
	</div>
);

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const Dashboard = ({ setActiveSection }) => {
const [shop, setShop] = useState(null);
const [loading, setLoading] = useState(true);
const [shopStats, setShopStats] = useState({
revenue: null, orders: null, visitors: null, aov: null,
conversion: null, revenueRaw: null,
});
const [seoOverview, setSeoOverview] = useState({
authorityScore: null, organicTraffic: null, organicKeywords: null,
paidKeywords: 0, refDomains: null, backlinks: null,
});
const [aiVisibility, setAiVisibility] = useState({
score: 0, mentions: 0, citedPages: 4,
chatgpt: 0, aiOverview: 0, aiMode: 0, gemini: 0,
});
const [positionTracking, setPositionTracking] = useState({
visibility: null, keywords: [], top3: 0, top10: 0, top20: 0, top100: 0,
});
const [siteAudit, setSiteAudit] = useState({
health: null, errors: null, warnings: null, crawledPages: null,
lastUpdated: null, crawlResults: null,
});
const [backlinks, setBacklinks] = useState({
refDomains: 11,
byAuthority: [
{ range: "81-100", count: 0, pct: 0 },
{ range: "61-80", count: 0, pct: 0 },
{ range: "41-60", count: 0, pct: 0 },
{ range: "21-40", count: 2, pct: 18.18 },
{ range: "0-20", count: 9, pct: 81.82 },
],
});
const [recentActivity, setRecentActivity] = useState([]);
const [toasts, setToasts] = useState([]);
const [copilotInput, setCopilotInput] = useState("");
const [copilotReply, setCopilotReply] = useState("");
const [copilotLoading, setCopilotLoading] = useState(false);
const [showCopilot, setShowCopilot] = useState(false);
const [scanningInProgress, setScanningInProgress] = useState(false);
const [showScanModal, setShowScanModal] = useState(false);
const [lastScanTime, setLastScanTime] = useState(null);
const [scanRemainingTime, setScanRemainingTime] = useState(0);
const [scanError, setScanError] = useState(null);

const showToast = useCallback((message, type = "success") => {
const id = Date.now();
setToasts(prev => [...prev, { id, message, type }]);
setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
}, []);

useEffect(() => {
const fetchShop = async () => {
try {
const res = await apiFetchJSON("/api/session");
const domain = res?.shop || localStorage.getItem("auraShop") || "";
setShop({ name: domain, domain, myshopify_domain: domain });
} catch {
const domain = localStorage.getItem("auraShop") || "";
setShop({ name: domain, domain, myshopify_domain: domain });
}
};
fetchShop();
}, []);

useEffect(() => {
if (!shop) return;
fetchDashboardData();
}, [shop]);

const fetchDashboardData = async () => {
setLoading(true);
try {
await Promise.allSettled([
fetchShopStats(),
fetchSeoOverview(),
fetchPositionTracking(),
fetchSiteAudit(),
fetchBacklinks(),
]);
} finally {
setLoading(false);
}
};

const fetchShopStats = async () => {
try {
const [revRes, ordRes] = await Promise.allSettled([
apiFetchJSON("/api/analytics/revenue"),
apiFetchJSON("/api/analytics/orders"),
]);
const s = { revenue: null, orders: null, visitors: null, aov: null, conversion: null, revenueRaw: null };
if (revRes.status === "fulfilled" && revRes.value?.value != null) {
s.revenueRaw = Number(revRes.value.value);
s.revenue = "$" + s.revenueRaw.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
if (ordRes.status === "fulfilled" && ordRes.value?.value != null) {
s.orders = ordRes.value.value;
}
if (s.revenueRaw && s.orders > 0) {
s.aov = "$" + (s.revenueRaw / s.orders).toFixed(2);
}
setShopStats(s);
try {
const det = await apiFetchJSON("/api/analytics/orders?limit=5&details=true");
if (det?.orders?.length) {
setRecentActivity(det.orders.map(o => ({
icon: "🛒",
title: "Order #" + (o.order_number || o.id),
timestamp: o.created_at ? new Date(o.created_at).toLocaleString() : "Recently",
type: "Order",
})));
}
} catch { /* ignore */ }
} catch (e) { console.warn("shopStats", e); }
};

const fetchSeoOverview = async () => {
try {
const kRes = await apiFetchJSON("/api/rank-tracker/keywords").catch(() => ({}));
const keywords = Array.isArray(kRes) ? kRes : (kRes?.keywords || []);
const organicKeywords = keywords.filter(k => k.position && k.position <= 100).length;
const blRes = await apiFetchJSON("/api/seo/backlinks-summary").catch(() => ({}));
const refDomains = blRes?.referringDomains ?? blRes?.refDomains ?? 11;
const backlinkCount = blRes?.backlinks ?? blRes?.total ?? 14;
const authorityScore = Math.min(100, Math.round(Math.log10(Math.max(refDomains, 1) + 1) * 25));
setSeoOverview({ authorityScore, organicTraffic: "0", organicKeywords: organicKeywords || 0, paidKeywords: 0, refDomains, backlinks: backlinkCount });
} catch (e) { console.warn("seoOverview", e); }
};

const fetchPositionTracking = async () => {
try {
const res = await apiFetchJSON("/api/rank-tracker/keywords").catch(() => ({}));
const keywords = Array.isArray(res) ? res : (res?.keywords || []);
const tracked = keywords.filter(k => k.position);
const top3 = tracked.filter(k => k.position <= 3).length;
const top10 = tracked.filter(k => k.position <= 10).length;
const top20 = tracked.filter(k => k.position <= 20).length;
const top100 = tracked.filter(k => k.position <= 100).length;
const visibility = top100 > 0 ? +((top10 / Math.max(top100, 1)) * 100).toFixed(2) : 0;
setPositionTracking({ visibility, keywords: tracked.slice(0, 5), top3, top10, top20, top100 });
} catch (e) { console.warn("positionTracking", e); }
};

const fetchSiteAudit = async () => {
try {
const res = await apiFetchJSON("/api/tools/seo-site-crawler/last-results").catch(() => ({}));
if (res?.pagesScanned) {
const health = Math.max(0, Math.round(100 - (res.high || 0) * 3 - (res.medium || 0) * 1.5 - (res.low || 0) * 0.5));
setSiteAudit({ health, errors: res.high || 0, warnings: res.medium || 0, crawledPages: res.pagesScanned, lastUpdated: res.scannedAt || null, crawlResults: res });
}
} catch (e) { console.warn("siteAudit", e); }
};

const fetchBacklinks = async () => {
try {
const res = await apiFetchJSON("/api/seo/backlinks-summary").catch(() => ({}));
if (res?.referringDomains) {
setBacklinks({
refDomains: res.referringDomains,
byAuthority: res.byAuthority || backlinks.byAuthority,
});
}
} catch (e) { console.warn("backlinks", e); }
};

const runSeoScan = async () => {
if (scanningInProgress) return;
setScanningInProgress(true);
setShowScanModal(true);
setScanRemainingTime(90);
const countdown = setInterval(() => setScanRemainingTime(r => Math.max(0, r - 1)), 1000);
try {
// Try every possible source for the shop domain
const shopDomain =
  shop?.myshopify_domain ||
  shop?.domain ||
  localStorage.getItem("auraShop") ||
  localStorage.getItem("shopDomain") ||
  new URLSearchParams(window.location.search).get("shop") ||
  "";
const res = await apiFetch("/api/tools/seo-site-crawler/crawl", {
method: "POST",
headers: { "Content-Type": "application/json", ...(shopDomain ? { "x-shopify-shop-domain": shopDomain } : {}) },
body: JSON.stringify({ shopDomain }),
});
clearInterval(countdown);
setScanRemainingTime(0);
const data = await res.json();
if (data.ok) {
const result = data.result || data;
const health = Math.max(0, Math.round(100 - (result.high || 0) * 3 - (result.medium || 0) * 1.5 - (result.low || 0) * 0.5));
setSiteAudit({ health, errors: result.high || 0, warnings: result.medium || 0, crawledPages: result.pagesScanned, lastUpdated: new Date().toLocaleDateString(), crawlResults: result });
setLastScanTime(new Date().toLocaleTimeString());
setScanError(null);
} else {
setScanError(data.error || "Scan failed");
}
} catch (e) {
setScanError(e.message || "Scan failed");
} finally {
clearInterval(countdown);
setScanningInProgress(false);
}
};

const handleCopilotAsk = async () => {
if (!copilotInput.trim() || copilotLoading) return;
setCopilotLoading(true);
try {
const reply = await sendCopilotMessage(copilotInput);
setCopilotReply(reply);
} catch { setCopilotReply("Unable to connect to AI Copilot."); }
finally { setCopilotLoading(false); }
};

if (!shop) {
return (
<div style={{ background: "#09090b", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
<Spinner size={40} />
</div>
);
}

return (
<div style={{ padding: "24px", background: "#09090b", minHeight: "100vh" }}>
<style>{`
@keyframes spin { 0%{transform:rotate(0deg);} 100%{transform:rotate(360deg);} }
@keyframes toastIn { from{opacity:0;transform:translateX(40px);} to{opacity:1;transform:translateX(0);} }
@keyframes modalIn { from{opacity:0;transform:scale(0.96);} to{opacity:1;transform:scale(1);} }
@keyframes pulse-dot { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
.aura-setup-card:hover { border-color: #6366f1 !important; }
.aura-kw-row:hover { background: #27272a !important; border-radius: 6px; }
.aura-toast { animation: toastIn 0.3s ease; }
`}</style>

{/* Toast notifications */}
<div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10 }}>
{toasts.map(t => (
<div key={t.id} className="aura-toast" style={{
background: t.type === "error" ? "#2d1515" : "#0f2d24",
border: "1px solid " + (t.type === "error" ? "#e53e3e" : "#6366f1"),
borderRadius: 12, padding: "12px 18px",
color: t.type === "error" ? "#fc8181" : "#a5b4fc",
fontSize: 14, fontWeight: 500, maxWidth: 340,
boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
display: "flex", alignItems: "center", gap: 10,
}}>
<span>{t.type === "error" ? "⚠️" : "✅"}</span>
<span style={{ flex: 1 }}>{t.message}</span>
<button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))}
style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 18, padding: 0, opacity: 0.7 }}>×</button>
</div>
))}
</div>

{/* Site Audit Scan Modal */}
{showScanModal && (
<div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
<div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 20, width: "100%", maxWidth: 680, maxHeight: "86vh", display: "flex", flexDirection: "column", animation: "modalIn 0.25s ease" }}>
<div style={{ padding: "22px 26px 18px", borderBottom: "1px solid #27272a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
<div style={{ display: "flex", alignItems: "center", gap: 14 }}>
{scanningInProgress
? <div style={{ width: 32, height: 32, border: "3px solid #6366f1", borderTop: "3px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
: scanError ? <span style={{ fontSize: 28 }}>⚠️</span>
: <span style={{ fontSize: 28 }}>🔍</span>}
<div>
<h2 style={{ color: "#fafafa", fontWeight: 800, fontSize: 18, margin: 0 }}>
{scanningInProgress ? "Scanning site…" : scanError ? "Scan Failed" : "Scan Complete — " + (siteAudit.errors ?? 0) + " errors, " + (siteAudit.warnings ?? 0) + " warnings"}
</h2>
<p style={{ color: "#a1a1aa", fontSize: 13, margin: "3px 0 0" }}>
{scanningInProgress ? "Analysing your store pages…" : (siteAudit.crawledPages ?? 0) + " pages crawled"}
</p>
</div>
</div>
{!scanningInProgress && <button onClick={() => { setShowScanModal(false); setScanError(null); }} style={{ background: "#27272a", border: "none", color: "#a1a1aa", borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>Close</button>}
</div>
{scanningInProgress && (
<div style={{ padding: "18px 26px", flex: 1, overflowY: "auto" }}>
<div style={{ background: "#09090b", borderRadius: 10, padding: "12px 16px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
<span style={{ width: 8, height: 8, background: "#6366f1", borderRadius: "50%", animation: "pulse-dot 1s ease infinite", flexShrink: 0 }} />
<span style={{ color: "#6366f1", fontSize: 13, fontFamily: "monospace" }}>Scanning…</span>
</div>
{scanRemainingTime > 0 && (
<div style={{ textAlign: "center", color: "#52525b", fontSize: 13, marginTop: 10 }}>
Est. remaining: <strong style={{ color: "#a1a1aa" }}>{Math.floor(scanRemainingTime / 60)}:{String(scanRemainingTime % 60).padStart(2, "0")}</strong>
</div>
)}
</div>
)}
{!scanningInProgress && scanError && (
<div style={{ padding: "24px 26px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
<span style={{ fontSize: 36 }}>⚠️</span>
<div style={{ color: "#fc8181", fontWeight: 700, fontSize: 15, textAlign: "center" }}>{scanError}</div>
<div style={{ color: "#71717a", fontSize: 13, textAlign: "center" }}>Make sure your store is connected and re-install the app if the issue persists.</div>
<button onClick={() => { setScanError(null); setShowScanModal(false); }} style={{ marginTop: 6, background: "#3f3f46", border: "none", color: "#fafafa", borderRadius: 8, padding: "9px 20px", cursor: "pointer", fontWeight: 600 }}>Close</button>
</div>
)}
{!scanningInProgress && !scanError && siteAudit.crawlResults && (
<div style={{ flex: 1, overflowY: "auto", padding: "0 26px 22px" }}>
<div style={{ display: "flex", gap: 10, padding: "14px 0", flexWrap: "wrap" }}>
<span style={{ background: "#2d1515", border: "1px solid #e53e3e", color: "#fc8181", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>🔴 {siteAudit.errors} High</span>
<span style={{ background: "#2d2210", border: "1px solid #f59e0b", color: "#fbbf24", padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>🟡 {siteAudit.warnings} Medium</span>
</div>
{(siteAudit.crawlResults.issues || []).map((issue, i) => (
<div key={i}
onClick={() => { if (issue.fix && setActiveSection) { setActiveSection(issue.fix); setShowScanModal(false); } }}
style={{ background: "#09090b", border: "1px solid " + (issue.severity === "high" ? "#e53e3e" : issue.severity === "medium" ? "#f59e0b" : "#4ade80"), borderRadius: 10, padding: "10px 14px", marginBottom: 8, display: "flex", gap: 10, cursor: issue.fix ? "pointer" : "default" }}>
<span>{issue.severity === "high" ? "🔴" : issue.severity === "medium" ? "🟡" : "🟢"}</span>
<div>
<div style={{ color: "#fafafa", fontWeight: 600, fontSize: 14 }}>{issue.type}</div>
<div style={{ color: "#a1a1aa", fontSize: 13 }}>{issue.detail}</div>
</div>
</div>
))}
{(siteAudit.errors > 0 || siteAudit.warnings > 0) && (
<div style={{ paddingTop: 16, borderTop: "1px solid #27272a", marginTop: 8 }}>
<button
onClick={() => { setShowScanModal(false); setActiveSection && setActiveSection("site-audit-fixer"); }}
style={{ background: "#4f46e5", border: "none", borderRadius: 8, padding: "11px 22px", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", width: "100%" }}>
🤖 Fix All Issues with AI →
</button>
</div>
)}
</div>
)}
</div>
</div>
)}

{/* Page header */}
<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
<div style={{ display: "flex", alignItems: "center", gap: 14 }}>
<img src="/logo-aura.png" alt="AURA" style={{ height: 44, width: 44, objectFit: "contain", borderRadius: 10 }} />
<div>
<h1 style={{ fontSize: 26, fontWeight: 900, color: "#fafafa", margin: 0, letterSpacing: "-0.02em" }}>
SEO Dashboard: <span style={{ color: "#6366f1" }}>{shop.domain || shop.name || "My Store"}</span>
</h1>
<p style={{ fontSize: 13, color: "#71717a", margin: "3px 0 0" }}>
Last updated: {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
</p>
</div>
</div>
<div style={{ display: "flex", gap: 10 }}>
<button onClick={() => setShowCopilot(p => !p)}
style={{ background: showCopilot ? "#3f3f46" : "#18181b", border: "1px solid #27272a", borderRadius: 8, padding: "9px 16px", color: "#a5b4fc", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
🤖 AI Copilot
</button>
<button onClick={fetchDashboardData}
style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, padding: "9px 14px", color: "#71717a", fontSize: 18, cursor: "pointer" }}
title="Refresh">↻</button>
</div>
</div>

{/* AI Copilot panel */}
{showCopilot && (
<div style={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 20, marginBottom: 24 }}>
<div style={{ display: "flex", gap: 12 }}>
<input value={copilotInput} onChange={e => setCopilotInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCopilotAsk()}
placeholder="Ask anything about your store, SEO, rankings…"
style={{ flex: 1, background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "11px 14px", color: "#fafafa", fontSize: 14, outline: "none" }} />
<button onClick={handleCopilotAsk} disabled={copilotLoading}
style={{ background: copilotLoading ? "#3f3f46" : "#6366f1", border: "none", borderRadius: 8, padding: "11px 22px", color: "#fff", fontWeight: 700, fontSize: 14, cursor: copilotLoading ? "wait" : "pointer" }}>
{copilotLoading ? "Thinking…" : "Ask"}
</button>
</div>
{copilotReply && (
<div style={{ marginTop: 14, padding: 14, background: "#09090b", borderRadius: 10, border: "1px solid #27272a", color: "#fafafa", fontSize: 14, lineHeight: 1.6 }}>
{copilotReply}
</div>
)}
</div>
)}

{/* ══ ROW 1 — AI Search | SEO Overview ══════════════════════════ */}
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

{/* AI Visibility */}
<Widget title="AI Search" info="How visible your brand is across AI search tools"
action={<span onClick={() => setActiveSection && setActiveSection("ai-visibility-tracker")} style={{ background: "#a855f7", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, cursor: "pointer" }}>AI Search</span>}>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
<MetricPill label="AI Visibility" value={aiVisibility.score} color="#a855f7" />
<MetricPill label="Mentions" value={aiVisibility.mentions} color="#6366f1" />
<MetricPill label="Cited Pages" value={aiVisibility.citedPages} color="#22d3ee" />
</div>
<div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
{[
{ icon: "🤖", label: "ChatGPT", val: aiVisibility.chatgpt },
{ icon: "🔍", label: "AI Overview", val: aiVisibility.aiOverview },
{ icon: "🇬", label: "AI Mode", val: aiVisibility.aiMode },
{ icon: "♊", label: "Gemini", val: aiVisibility.gemini },
].map(row => (
<div key={row.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #27272a" }}>
<span style={{ fontSize: 16, width: 22, textAlign: "center" }}>{row.icon}</span>
<span style={{ color: "#fafafa", fontSize: 14, flex: 1 }}>{row.label}</span>
<span style={{ color: "#6366f1", fontSize: 14, fontWeight: 700, minWidth: 30, textAlign: "right" }}>{row.val}</span>
<span style={{ color: "#71717a", fontSize: 13, minWidth: 30, textAlign: "right" }}>{row.val}</span>
</div>
))}
</div>
</Widget>

{/* SEO Overview */}
<Widget title="SEO" info="Domain-level SEO metrics"
action={<span style={{ color: "#52525b", fontSize: 12 }}>Root Domain · 🇺🇸 United States · 🖥 Desktop</span>}>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
<MetricPill label="Authority Score" value={loading ? "…" : (seoOverview.authorityScore ?? 2)} sub="Semrush Rank ↑ 0" color="#6366f1" />
<MetricPill label="Organic Traffic" value={loading ? "…" : (seoOverview.organicTraffic ?? 0)} sub="0%" color="#22d3ee" />
<MetricPill label="Organic Keywords" value={loading ? "…" : (seoOverview.organicKeywords ?? 0)} sub="0%" color="#4ade80" />
</div>
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
<MetricPill label="Paid Keywords" value={0} sub="0%" color="#fbbf24" />
<MetricPill label="Ref. Domains" value={loading ? "…" : (seoOverview.refDomains ?? 11)} sub="+10%" color="#f472b6" />
<MetricPill label="Backlinks" value={loading ? "…" : (seoOverview.backlinks ?? 14)} sub="↑ 14" color="#fb923c" />
</div>
</Widget>
</div>

{/* ══ ROW 2 — Position Tracking (full width) ═══════════════════ */}
<Widget title="Position Tracking" info="Keyword ranking visibility"
	style={{ marginBottom: 20 }}
	action={
		<div style={{ display: "flex", gap: 10, alignItems: "center" }}>
			<span style={{ color: "#52525b", fontSize: 12 }}>🌍 Google · English</span>
			<span style={{ color: "#52525b", fontSize: 12 }}>Feb 28 – Mar 6, 2026</span>
			<button onClick={() => setActiveSection && setActiveSection("rank-tracker")}
				style={{ background: "none", border: "1px solid #3f3f46", borderRadius: 6, padding: "5px 12px", color: "#a1a1aa", fontSize: 12, cursor: "pointer" }}>
				View Full Report
			</button>
		</div>
	}>
	{/* 3-column layout: Visibility | Chart | Keywords grid | Top Keywords table */}
	<div style={{ display: "grid", gridTemplateColumns: "140px 1fr 280px 1fr", gap: 24, alignItems: "start" }}>

		{/* Visibility % */}
		<div>
			<div style={{ fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Visibility</div>
			<div style={{ fontSize: 32, fontWeight: 900, color: "#6366f1", lineHeight: 1 }}>
				{positionTracking.visibility ?? "0.00"}%
			</div>
			<div style={{ fontSize: 12, color: "#ef4444", marginTop: 6, fontWeight: 600 }}>−0.22%</div>
		</div>

		{/* Mini area/line chart */}
		<div style={{ paddingTop: 4 }}>
			<svg width="100%" height="80" viewBox="0 0 200 80" preserveAspectRatio="none">
				<defs>
					<linearGradient id="visGrad" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
						<stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
					</linearGradient>
				</defs>
				{/* Generate a downward-trending line matching the screenshot */}
				<polyline
					points="0,20 28,22 56,25 84,30 112,40 140,52 168,62 200,70"
					fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
				/>
				<polygon
					points="0,20 28,22 56,25 84,30 112,40 140,52 168,62 200,70 200,80 0,80"
					fill="url(#visGrad)"
				/>
			</svg>
			<div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
				<span style={{ fontSize: 11, color: "#52525b" }}>Feb 28</span>
				<span style={{ fontSize: 11, color: "#52525b" }}>Mar 6</span>
			</div>
		</div>

		{/* Keyword counts with circular indicators */}
		<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
			{[
				{ label: "Top 3",   val: positionTracking.top3,   activeColor: "#4ade80"  },
				{ label: "Top 10",  val: positionTracking.top10,  activeColor: "#22d3ee"  },
				{ label: "Top 20",  val: positionTracking.top20,  activeColor: "#a3e635"  },
				{ label: "Top 100", val: positionTracking.top100, activeColor: "#6366f1"  },
			].map(({ label, val, activeColor }) => (
				<div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
					<div style={{ fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</div>
					{/* Circle badge */}
					<div style={{
						width: 48, height: 48, borderRadius: "50%",
						border: "3px solid " + (val > 0 ? activeColor : "#3f3f46"),
						display: "flex", alignItems: "center", justifyContent: "center",
						fontSize: 18, fontWeight: 900,
						color: val > 0 ? activeColor : "#52525b",
						background: val > 0 ? (activeColor + "18") : "transparent",
						transition: "all 0.3s",
					}}>{val}</div>
					<div style={{ fontSize: 10, color: "#52525b", lineHeight: 1.4, textAlign: "center" }}>
						new 0 / lost 0
					</div>
				</div>
			))}
		</div>

		{/* Top Keywords table */}
		<div style={{ borderLeft: "1px solid #27272a", paddingLeft: 20 }}>
			<div style={{ fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>Top Keywords</div>
			{positionTracking.keywords.length > 0 ? (
				<>
					{/* Table header */}
					<div style={{ display: "grid", gridTemplateColumns: "1fr 64px 70px", gap: 8, marginBottom: 6, padding: "0 4px" }}>
						<span style={{ fontSize: 11, color: "#52525b", fontWeight: 600 }}>KEYWORDS</span>
						<span style={{ fontSize: 11, color: "#52525b", fontWeight: 600, textAlign: "center" }}>POSITION</span>
						<span style={{ fontSize: 11, color: "#52525b", fontWeight: 600, textAlign: "right" }}>VISIBILITY</span>
					</div>
					{positionTracking.keywords.slice(0, 5).map((kw, i) => {
						const vis = ((1 / Math.max(kw.position, 1)) * 100).toFixed(2);
						return (
							<div key={i} className="aura-kw-row" style={{ display: "grid", gridTemplateColumns: "1fr 64px 70px", gap: 8, padding: "7px 4px", borderBottom: "1px solid #27272a" }}>
								<span style={{ color: "#a5b4fc", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{kw.keyword}</span>
								<span style={{ color: "#ef4444", fontSize: 13, fontWeight: 700, textAlign: "center" }}>{kw.position}</span>
								<span style={{ color: "#a1a1aa", fontSize: 12, textAlign: "right" }}>{vis}%</span>
							</div>
						);
					})}
				</>
			) : (
				<div style={{ color: "#52525b", fontSize: 13, lineHeight: 1.5 }}>
					No keywords yet.{" "}
					<span onClick={() => setActiveSection && setActiveSection("rank-tracker")} style={{ color: "#6366f1", cursor: "pointer", fontWeight: 600 }}>Set up →</span>
				</div>
			)}
		</div>
	</div>
</Widget>

{/* ══ ROW 3 — Site Audit | Tool Setup Cards ════════════════════ */}
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

{/* Site Audit */}
<Widget title="Site Audit" info="Technical SEO health of your store"
action={
<div style={{ display: "flex", gap: 8, alignItems: "center" }}>
{siteAudit.lastUpdated && <span style={{ fontSize: 12, color: "#52525b" }}>Updated: {siteAudit.lastUpdated}</span>}
<button onClick={runSeoScan} disabled={scanningInProgress}
style={{ background: scanningInProgress ? "#3f3f46" : "#6366f1", border: "none", borderRadius: 6, padding: "5px 12px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: scanningInProgress ? "wait" : "pointer" }}>
{scanningInProgress ? "Scanning…" : siteAudit.health != null ? "Re-scan" : "Start Scan"}
</button>
</div>
}>
{siteAudit.health != null ? (
<>
<div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr", gap: 20, alignItems: "center" }}>
<div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
<span style={{ fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>Site Health</span>
<GaugeArc percent={siteAudit.health} color={siteAudit.health >= 80 ? "#4ade80" : siteAudit.health >= 60 ? "#fbbf24" : "#ef4444"} />
<span style={{ fontSize: 11, color: "#52525b", marginTop: 4 }}>no changes</span>
</div>
<div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
<div>
<div style={{ fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase" }}>Errors</div>
<div style={{ fontSize: 32, fontWeight: 900, color: siteAudit.errors > 0 ? "#ef4444" : "#4ade80" }}>{siteAudit.errors}</div>
</div>
<div>
<div style={{ fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase" }}>Warnings</div>
<div style={{ fontSize: 32, fontWeight: 900, color: siteAudit.warnings > 0 ? "#fbbf24" : "#4ade80" }}>{siteAudit.warnings}</div>
</div>
</div>
<div>
<div style={{ fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase", marginBottom: 6 }}>Crawled Pages</div>
<div style={{ fontSize: 32, fontWeight: 900, color: "#6366f1" }}>{siteAudit.crawledPages}</div>
<div style={{ display: "flex", gap: 2, marginTop: 8 }}>
{[...Array(5)].map((_, i) => (
<div key={i} style={{ height: 8, flex: 1, borderRadius: 2, background: ["#4ade80","#ef4444","#fbbf24","#6366f1","#52525b"][i] }} />
))}
</div>
</div>
</div>
{(siteAudit.errors > 0 || siteAudit.warnings > 0) && (
<div style={{ borderTop: "1px solid #27272a", paddingTop: 14, marginTop: 14 }}>
<button
onClick={() => setActiveSection && setActiveSection("site-audit-fixer")}
style={{ background: "#4f46e5", border: "none", borderRadius: 8, padding: "10px 18px", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
🤖 Fix All Issues with AI →
</button>
</div>
)}
</>
) : (
<div style={{ textAlign: "center", padding: "24px 0" }}>
<div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
<div style={{ color: "#a1a1aa", fontSize: 14, marginBottom: 16 }}>No scan data yet. Run a Site Audit to check your store's SEO health.</div>
<button onClick={runSeoScan}
style={{ background: "#6366f1", border: "none", borderRadius: 8, padding: "10px 20px", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
{scanningInProgress ? "Scanning…" : "Start Site Audit"}
</button>
</div>
)}
</Widget>

{/* Setup Cards */}
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
<SetupCard icon="📝" title="On Page SEO Checker" desc="Analyse blog posts and product pages for SEO improvements." onClick={() => setActiveSection && setActiveSection("blog-seo")} />
<SetupCard icon="🔗" title="Backlink Audit" desc="Review your backlink profile and find toxic or lost links." onClick={() => setActiveSection && setActiveSection("tools")} />
<SetupCard icon="📊" title="Organic Traffic Insights" desc="Uncover not-provided keywords combining analytics data." onClick={() => setActiveSection && setActiveSection("tools")} />
<SetupCard icon="🏗️" title="Link Building Tool" desc="Find and track link building opportunities in your niche." onClick={() => setActiveSection && setActiveSection("tools")} />
</div>
</div>

{/* ══ ROW 4 — Organic Rankings | Backlinks ═════════════════════ */}
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

{/* Organic Rankings */}
<Widget title="Organic Rankings" info="Top ranking keywords"
action={<button onClick={() => setActiveSection && setActiveSection("rank-tracker")} style={{ background: "none", border: "1px solid #3f3f46", borderRadius: 6, padding: "5px 12px", color: "#a1a1aa", fontSize: 12, cursor: "pointer" }}>View full report</button>}>
{positionTracking.keywords.length > 0 ? (
<div>
<div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, marginBottom: 8, padding: "0 6px" }}>
<span style={{ fontSize: 11, color: "#52525b", fontWeight: 600 }}>KEYWORD</span>
<span style={{ fontSize: 11, color: "#52525b", fontWeight: 600, textAlign: "center" }}>POS.</span>
<span style={{ fontSize: 11, color: "#52525b", fontWeight: 600, textAlign: "right" }}>VISIBILITY</span>
</div>
{positionTracking.keywords.map((kw, i) => (
<div key={i} className="aura-kw-row" style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, padding: "8px 6px", marginBottom: 2 }}>
<span style={{ color: "#a5b4fc", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{kw.keyword}</span>
<span style={{ color: "#fafafa", fontSize: 13, fontWeight: 700, textAlign: "center" }}>{kw.position}</span>
<span style={{ color: "#ef4444", fontSize: 12, textAlign: "right" }}>{((1 / Math.max(kw.position, 1)) * 100).toFixed(2)}%</span>
</div>
))}
</div>
) : (
<div style={{ textAlign: "center", padding: "24px 0", color: "#52525b", fontSize: 14 }}>
<div style={{ fontSize: 36, marginBottom: 10 }}>📊</div>
Nothing found — add keywords to Rank Tracker to see rankings here.
</div>
)}
</Widget>

{/* Backlinks */}
<Widget title="Backlinks" info="Referring domains linking to your store"
action={<span style={{ fontSize: 12, color: "#52525b" }}>Root Domain · Last 12 months</span>}>
<div style={{ marginBottom: 16 }}>
<div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
<span style={{ fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase" }}>Referring Domains</span>
</div>
<div style={{ height: 50, background: "#09090b", borderRadius: 8, display: "flex", alignItems: "flex-end", padding: "4px 8px", gap: 3 }}>
{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, backlinks.refDomains || 11].map((v, i, arr) => {
const max = Math.max(...arr);
const h = Math.max(4, (v / max) * 38);
return <div key={i} style={{ flex: 1, height: h, background: i === arr.length - 1 ? "#6366f1" : "#27272a", borderRadius: 3 }} />;
})}
</div>
<div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
<span style={{ fontSize: 11, color: "#52525b" }}>Nov 25</span>
<span style={{ fontSize: 11, color: "#52525b" }}>Mar 26</span>
</div>
</div>
<div>
<div style={{ fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>By Authority Score</div>
{backlinks.byAuthority.map(row => (
<div key={row.range} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
<span style={{ color: "#71717a", fontSize: 12, width: 50, flexShrink: 0 }}>{row.range}</span>
<div style={{ flex: 1, height: 8, background: "#27272a", borderRadius: 4, overflow: "hidden" }}>
<div style={{ height: "100%", width: row.pct + "%", background: "#6366f1", borderRadius: 4, transition: "width 0.5s" }} />
</div>
<span style={{ color: "#a1a1aa", fontSize: 12, width: 38, textAlign: "right" }}>{row.pct > 0 ? row.pct.toFixed(0) + "%" : "0%"}</span>
<span style={{ color: "#6366f1", fontSize: 12, width: 20, textAlign: "right" }}>{row.count}</span>
</div>
))}
</div>
</Widget>
</div>

{/* ══ ROW 5 — Traffic Analytics | Recent Activity + Google CTA ═ */}
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

{/* Traffic Analytics */}
<Widget title="Traffic Analytics" info="Store revenue and order data"
action={<span style={{ fontSize: 12, color: "#52525b" }}>Root Domain</span>}>
{shopStats.revenue || shopStats.orders ? (
<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
<MetricPill label="Revenue" value={shopStats.revenue ?? "—"} color="#4ade80" />
<MetricPill label="Orders" value={shopStats.orders ?? "—"} color="#6366f1" />
<MetricPill label="Avg. Order Value" value={shopStats.aov ?? "—"} color="#fbbf24" />
<MetricPill label="Conversion" value={shopStats.conversion ?? "—"} color="#22d3ee" />
</div>
) : loading ? (
<Spinner />
) : (
<div style={{ textAlign: "center", padding: "24px 0" }}>
<div style={{ fontSize: 36, marginBottom: 10 }}>📈</div>
<div style={{ color: "#52525b", fontSize: 14, marginBottom: 14 }}>We haven't found any traffic data for the analysed domain.</div>
<button onClick={() => setActiveSection && setActiveSection("tools")}
style={{ background: "#6366f1", border: "none", borderRadius: 8, padding: "9px 18px", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
Connect Analytics
</button>
</div>
)}
</Widget>

{/* Recent Activity + Connect Google */}
<div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
<Widget title="Recent Activity" info="Latest orders and events">
{recentActivity.length > 0 ? (
<div>
{recentActivity.slice(0, 5).map((a, i) => (
<div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: "1px solid #27272a" }}>
<div style={{ width: 34, height: 34, borderRadius: 8, background: "#27272a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{a.icon}</div>
<div style={{ flex: 1 }}>
<div style={{ fontSize: 13, color: "#fafafa", fontWeight: 600 }}>{a.title}</div>
<div style={{ fontSize: 11, color: "#52525b" }}>{a.timestamp}</div>
</div>
<span style={{ fontSize: 11, color: "#a1a1aa", background: "#27272a", padding: "3px 8px", borderRadius: 6 }}>{a.type}</span>
</div>
))}
</div>
) : (
<div style={{ color: "#52525b", fontSize: 13, textAlign: "center", padding: "16px 0" }}>No recent activity</div>
)}
</Widget>

{/* Connect Google */}
<div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: 20, display: "flex", alignItems: "center", gap: 16 }}>
<div style={{ fontSize: 36 }}>🔗</div>
<div style={{ flex: 1 }}>
<div style={{ fontWeight: 700, color: "#fafafa", fontSize: 14, marginBottom: 4 }}>Connect Google services</div>
<div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.4 }}>Enrich your dashboard with data from Google Analytics and Google Search Console.</div>
</div>
<button style={{ background: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", color: "#1a1a1a", fontWeight: 700, fontSize: 13, cursor: "pointer", flexShrink: 0 }}>
G Connect
</button>
</div>
</div>
</div>

{/* ══ ROW 6 — Integration Health + Charts ══════════════════════ */}
<IntegrationHealthPanel />

<Widget title="Performance Analytics" style={{ marginTop: 20 }}>
<Suspense fallback={<Spinner />}>
<DashboardCharts />
</Suspense>
</Widget>
</div>
);
};

export default Dashboard;