import React, { useState, useEffect, useCallback } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, MozCard, ScoreRing, MetricRow, SortableTable, ErrorBox, EmptyState, Spinner } from "../MozUI";

const API = "/api/technical-seo-auditor";

const S = {
  page: { background: "#09090b", minHeight: "100vh", padding: "28px 32px", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif" },
  title: { fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 },
  sub: { fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 20 },
  inputRow: { display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap", alignItems: "center" },
  input: { flex: 1, minWidth: 260, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#16a34a" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "11px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" }),
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  badge: (c) => ({ display: "inline-block", borderRadius: 5, padding: "2px 9px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, background: c === "pass" ? "#052e16" : c === "fail" ? "#3f1315" : c === "warn" ? "#3d2a0a" : "#1c1c1f", color: c === "pass" ? "#4ade80" : c === "fail" ? "#f87171" : c === "warn" ? "#fbbf24" : "#a1a1aa" }),
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 0", borderBottom: "1px solid #1f1f22", fontSize: 13 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", overflowX: "auto" },
  grid2: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: 700, color: "#71717a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  tag: (c) => ({ display: "inline-flex", alignItems: "center", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, background: c === "green" ? "#052e16" : c === "red" ? "#3f1315" : c === "amber" ? "#3d2a0a" : "#27272a", color: c === "green" ? "#4ade80" : c === "red" ? "#f87171" : c === "amber" ? "#fbbf24" : "#a1a1aa" }),
};

function CheckRow({ label, value, status, detail }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div style={S.row}>
        <span style={{ ...S.badge(status), flexShrink: 0, marginTop: 1 }}>{status === "pass" ? "âœ“" : status === "fail" ? "âœ—" : "!"}</span>
        <span style={{ flex: 1, color: "#e4e4e7" }}>{label}</span>
        <span style={{ color: "#a1a1aa", fontSize: 12, maxWidth: 280, textAlign: "right", wordBreak: "break-word" }}>{value}</span>
        {detail && <button onClick={() => setOpen(o => !o)} style={{ background: "none", border: "none", color: "#52525b", cursor: "pointer", fontSize: 14, padding: 0, flexShrink: 0 }}>{open ? "â–²" : "â–¼"}</button>}
      </div>
      {open && detail && <div style={{ padding: "8px 12px 8px 32px", background: "#0d0d10", fontSize: 12, color: "#a1a1aa", lineHeight: 1.6, borderBottom: "1px solid #1f1f22" }}>{detail}</div>}
    </div>
  );
}

function CWVGauge({ label, value, unit, thresholds, description }) {
  const [good, poor] = thresholds;
  const status = value == null ? "unknown" : value <= good ? "good" : value <= poor ? "needs" : "poor";
  const colors = { good: "#22c55e", needs: "#f59e0b", poor: "#ef4444", unknown: "#52525b" };
  const pct = value == null ? 0 : Math.min(100, (value / (poor * 1.5)) * 100);
  return (
    <div style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 12, padding: "16px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#71717a" }}>{label}</span>
        <span style={{ fontSize: 24, fontWeight: 800, color: colors[status] }}>{value != null ? `${value}${unit}` : "â€”"}</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: "#27272a", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, borderRadius: 4, background: colors[status], transition: "width 0.6s" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
        <span style={{ fontSize: 10, color: "#22c55e" }}>Good â‰¤{good}{unit}</span>
        <span style={{ fontSize: 10, color: colors[status], fontWeight: 700, textTransform: "uppercase" }}>{status === "unknown" ? "No data" : status === "good" ? "Good" : status === "needs" ? "Needs Work" : "Poor"}</span>
        <span style={{ fontSize: 10, color: "#ef4444" }}>Poor &gt;{poor}{unit}</span>
      </div>
      {description && <div style={{ marginTop: 8, fontSize: 11, color: "#52525b", lineHeight: 1.5 }}>{description}</div>}
    </div>
  );
}

function IssueCard({ sev, title, detail, fix }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: sev === "critical" ? "#3f1315" : sev === "warning" ? "#3d2a0a" : "#1c1c1f", borderRadius: 8, padding: "10px 14px", marginBottom: 8, border: `1px solid ${sev === "critical" ? "#7f1d1d44" : sev === "warning" ? "#78350f44" : "#27272a"}` }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <span style={S.badge(sev === "critical" ? "fail" : sev === "warning" ? "warn" : "info")}>{sev}</span>
        <span style={{ fontWeight: 700, fontSize: 13, color: "#e4e4e7", flex: 1 }}>{title}</span>
        <button onClick={() => setOpen(o => !o)} style={{ background: "none", border: "none", color: "#52525b", cursor: "pointer", fontSize: 13 }}>{open ? "â–²" : "â–¼"}</button>
      </div>
      {open && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.6, marginBottom: fix ? 8 : 0 }}>{detail}</div>
          {fix && <div style={{ fontSize: 13, color: "#818cf8", fontWeight: 600 }}>â†’ Fix: {fix}</div>}
        </div>
      )}
    </div>
  );
}

const CATEGORIES = [
  { id: "overview", label: "Overview" },
  { id: "cwv", label: "Core Web Vitals" },
  { id: "crawl", label: "Crawlability" },
  { id: "onpage", label: "On-Page" },
  { id: "images", label: "Images" },
  { id: "schema", label: "Schema" },
  { id: "mobile", label: "Mobile" },
  { id: "action", label: "Action Plan" },
  { id: "history", label: "History" },
];

export default function TechnicalSEOAuditor() {
  const [url, setUrl] = useState("");
  const [tab, setTab] = useState("overview");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState([]);
  const [error, setError] = useState("");
  const [notify, setNotify] = useState("");

  // Audit results
  const [mainAudit, setMainAudit] = useState(null);   // { auditReport, pageData }
  const [cwvData, setCwvData] = useState(null);
  const [crawlData, setCrawlData] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [schemaData, setSchemaData] = useState(null);
  const [sitemapData, setSitemapData] = useState(null);
  const [mobileData, setMobileData] = useState(null);
  const [history, setHistory] = useState([]);

  // AI chat
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  const log = (msg) => setProgress(p => [...p, { msg, ts: new Date().toLocaleTimeString() }]);

  const loadHistory = useCallback(async () => {
    try {
      const r = await apiFetchJSON(`${API}/history`);
      if (r.ok) setHistory(r.history || []);
    } catch {}
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const runAudit = async () => {
    if (!url.trim()) { setError("Enter a URL to audit"); return; }
    setRunning(true); setError(""); setProgress([]);
    setMainAudit(null); setCwvData(null); setCrawlData(null);
    setImageData(null); setSchemaData(null); setSitemapData(null); setMobileData(null);

    const body = (extra) => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: url.trim(), site: url.trim(), ...extra }) });

    try {
      log("Starting comprehensive audit...");
      const [main, cwv, crawl, img, schm, sitemap, mob] = await Promise.allSettled([
        apiFetchJSON(`${API}/ai/audit`, body({})).then(r => { log("âœ“ AI audit complete"); return r; }),
        apiFetchJSON(`${API}/cwv-assess`, body({})).then(r => { log("âœ“ Core Web Vitals assessed"); return r; }),
        apiFetchJSON(`${API}/crawl-audit`, body({})).then(r => { log("âœ“ Crawlability checked"); return r; }),
        apiFetchJSON(`${API}/image-audit`, body({})).then(r => { log("âœ“ Image audit done"); return r; }),
        apiFetchJSON(`${API}/schema-validate`, body({})).then(r => { log("âœ“ Schema validated"); return r; }),
        apiFetchJSON(`${API}/sitemap-hreflang`, body({})).then(r => { log("âœ“ Sitemap/hreflang checked"); return r; }),
        apiFetchJSON(`${API}/mobile-check`, body({})).then(r => { log("âœ“ Mobile check done"); return r; }),
      ]);

      if (main.status === "fulfilled" && main.value?.ok) setMainAudit(main.value);
      if (cwv.status === "fulfilled" && cwv.value?.ok) setCwvData(cwv.value);
      if (crawl.status === "fulfilled" && crawl.value?.ok) setCrawlData(crawl.value);
      if (img.status === "fulfilled" && img.value?.ok) setImageData(img.value);
      if (schm.status === "fulfilled" && schm.value?.ok) setSchemaData(schm.value);
      if (sitemap.status === "fulfilled" && sitemap.value?.ok) setSitemapData(sitemap.value);
      if (mob.status === "fulfilled" && mob.value?.ok) setMobileData(mob.value);

      log("All checks complete.");
      setTab("overview");
      loadHistory();
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const msgs = [...chatHistory, { role: "user", content: chatInput }];
    setChatHistory(msgs); setChatInput(""); setChatLoading(true);
    try {
      const r = await apiFetchJSON(`${API}/ai/audit`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site: url || "shopify store", messages: msgs, prompt: chatInput }),
      });
      if (r.ok) setChatHistory(h => [...h, { role: "assistant", content: r.auditReport || r.reply || "" }]);
    } catch {} finally { setChatLoading(false); }
  };

  const pd = mainAudit?.pageData || {};
  const auditText = mainAudit?.auditReport || "";

  // Derive health score from pageData + audit checks
  const healthChecks = [
    pd.https, pd.hasCanonical, pd.hasViewport, pd.hasSchema,
    pd.title && pd.title.length > 10, pd.metaDescription && pd.metaDescription.length > 30,
    pd.h1, !pd.hasSitemap === false, pd.imagesWithAlt > 0,
    cwvData ? cwvData.lcp <= 2.5 : null,
    cwvData ? cwvData.cls <= 0.1 : null,
  ].filter(v => v !== null && v !== undefined);
  const healthScore = healthChecks.length ? Math.round((healthChecks.filter(Boolean).length / healthChecks.length) * 100) : null;

  const scoreColor = !healthScore ? "#52525b" : healthScore >= 80 ? "#22c55e" : healthScore >= 60 ? "#f59e0b" : "#ef4444";
  const hasResults = !!mainAudit;

  const actionItems = [];
  if (pd.title === "missing" || !pd.title) actionItems.push({ sev: "critical", title: "Missing page title", detail: "The page has no <title> tag. Titles are critical for ranking and CTR.", fix: "Add a unique, descriptive <title> tag between 50â€“60 characters." });
  if (!pd.https) actionItems.push({ sev: "critical", title: "Site not on HTTPS", detail: "HTTPS is a confirmed Google ranking signal and required for Shopify checkout security.", fix: "Enable SSL in Shopify Settings â†’ Domains." });
  if (!pd.hasCanonical) actionItems.push({ sev: "warning", title: "No canonical tag", detail: "Without a canonical, Google may index duplicate URLs independently.", fix: "Add <link rel='canonical' href='...'> to all pages." });
  if (!pd.hasViewport) actionItems.push({ sev: "critical", title: "No viewport meta tag", detail: "Missing viewport breaks mobile rendering and Google's Mobile-First Index.", fix: "Add <meta name='viewport' content='width=device-width, initial-scale=1'>." });
  if (!pd.hasSchema) actionItems.push({ sev: "warning", title: "No structured data", detail: "Structured data enables rich results in Google â€” reviews, prices, FAQs.", fix: "Add JSON-LD schema markup using the Schema Rich Results Engine." });
  if (pd.metaDescription === "missing" || !pd.metaDescription) actionItems.push({ sev: "warning", title: "Missing meta description", detail: "Google uses meta descriptions for snippet text and they influence CTR.", fix: "Write a compelling 150â€“160 character meta description for each page." });
  if (pd.pageSizeKB > 1000) actionItems.push({ sev: "warning", title: `Large page size (${pd.pageSizeKB}KB)`, detail: "Pages over 1MB take longer to load, hurting rankings and conversions.", fix: "Minimise HTML, compress images, defer non-critical scripts." });
  if (pd.inlineStyles > 20) actionItems.push({ sev: "warning", title: `High inline styles count (${pd.inlineStyles})`, detail: "Excessive inline styles bloat HTML and prevent CSS caching.", fix: "Move styles to external CSS files." });
  if (cwvData && cwvData.lcp > 2.5) actionItems.push({ sev: cwvData.lcp > 4 ? "critical" : "warning", title: `Slow LCP: ${cwvData.lcp}s`, detail: "Largest Contentful Paint is a Core Web Vitals metric. LCP > 4s = Poor.", fix: "Optimise hero images, use a CDN, preload critical assets." });
  if (cwvData && cwvData.cls > 0.1) actionItems.push({ sev: cwvData.cls > 0.25 ? "critical" : "warning", title: `CLS too high: ${cwvData.cls}`, detail: "Cumulative Layout Shift > 0.25 is 'Poor' and hurts ranking.", fix: "Set explicit width/height on images and ads. Avoid inserting content above the fold." });

  const exportReport = () => {
    const data = { url, timestamp: new Date().toISOString(), healthScore, pageData: pd, cwv: cwvData, actionItems, fullReport: auditText };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `seo-audit-${Date.now()}.json`; a.click();
  };

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={S.title}>Technical SEO Auditor</h1>
        <p style={S.sub}>Comprehensive technical SEO analysis â€” Core Web Vitals, crawlability, on-page, images, schema &amp; mobile. Screaming Frogâ€“level depth, AI-powered.</p>
        <div style={S.inputRow}>
          <input style={S.input} value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && runAudit()} placeholder="https://yourstore.myshopify.com" />
          <button style={S.btn("primary")} onClick={runAudit} disabled={running}>{running ? "Auditingâ€¦" : "Run Full Audit"}</button>
          {hasResults && <button style={S.btn()} onClick={exportReport}>Export JSON</button>}
        </div>
        {running && (
          <div style={{ marginTop: 12, background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 16px", fontSize: 12 }}>
            {progress.map((p, i) => <div key={i} style={{ color: i === progress.length - 1 ? "#a78bfa" : "#52525b", marginBottom: 2 }}><span style={{ color: "#3f3f46" }}>{p.ts} </span>{p.msg}</div>)}
            <Spinner size={16} />
          </div>
        )}
      </div>

      {error && <ErrorBox message={error} />}
      {notify && <div style={{ background: "#052e16", border: "1px solid #166534", borderRadius: 8, padding: "8px 16px", fontSize: 13, color: "#4ade80", marginBottom: 12 }}>{notify}</div>}

      {!hasResults && !running && (
        <EmptyState icon="ðŸ”¬" title="Run a full technical audit" description="Enter your Shopify store URL above to scan for crawl errors, Core Web Vitals issues, broken images, missing schema, mobile problems, and 50+ other technical SEO checks." />
      )}

      {hasResults && (
        <>
          <MozTabs tabs={CATEGORIES} active={tab} onChange={setTab} />

          {/* OVERVIEW */}
          {tab === "overview" && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 20 }}>
                <div style={{ ...S.card, textAlign: "center", minWidth: 160 }}>
                  <div style={{ fontSize: 64, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{healthScore ?? "â€”"}</div>
                  <div style={{ fontSize: 13, color: "#71717a", marginTop: 4 }}>Health Score</div>
                  <div style={{ height: 8, background: "#27272a", borderRadius: 4, overflow: "hidden", marginTop: 12 }}>
                    <div style={{ height: "100%", width: `${healthScore ?? 0}%`, background: scoreColor, borderRadius: 4, transition: "width 0.6s" }} />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={S.grid2}>
                    {[
                      { label: "HTTPS", value: pd.https ? "Enabled" : "Not enabled", ok: pd.https },
                      { label: "Canonical", value: pd.hasCanonical ? "Present" : "Missing", ok: pd.hasCanonical },
                      { label: "Viewport", value: pd.hasViewport ? "Set" : "Missing", ok: pd.hasViewport },
                      { label: "Schema", value: pd.hasSchema ? "Found" : "None", ok: pd.hasSchema },
                      { label: "Title", value: pd.title ? `${pd.title.length} chars` : "Missing", ok: !!pd.title },
                      { label: "Meta Desc", value: pd.metaDescription ? `${pd.metaDescription.length} chars` : "Missing", ok: !!pd.metaDescription },
                      { label: "H1 Tag", value: pd.h1 || "Missing", ok: !!pd.h1 },
                      { label: "Page Size", value: pd.pageSizeKB ? `${pd.pageSizeKB} KB` : "â€”", ok: pd.pageSizeKB < 1000 },
                      { label: "Images", value: pd.imageCount ?? "â€”", ok: true },
                      { label: "Images w/ Alt", value: pd.imagesWithAlt != null ? `${pd.imagesWithAlt}/${pd.imageCount}` : "â€”", ok: pd.imagesWithAlt === pd.imageCount },
                      { label: "HTTP Status", value: pd.statusCode || "â€”", ok: pd.statusCode === 200 },
                      { label: "Sitemap", value: pd.hasSitemap ? "Found" : "Not found", ok: pd.hasSitemap },
                    ].map(({ label, value, ok }) => (
                      <div key={label} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: "#71717a" }}>{label}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: ok ? "#4ade80" : "#f87171" }}>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* CWV Summary */}
              {cwvData && (
                <div style={S.card}>
                  <div style={S.sectionTitle}>Core Web Vitals Summary</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12 }}>
                    {[
                      { label: "LCP", value: cwvData.lcp, unit: "s", thresholds: [2.5, 4] },
                      { label: "INP", value: cwvData.inp, unit: "ms", thresholds: [200, 500] },
                      { label: "CLS", value: cwvData.cls, unit: "", thresholds: [0.1, 0.25] },
                      { label: "FCP", value: cwvData.fcp, unit: "s", thresholds: [1.8, 3] },
                      { label: "TTFB", value: cwvData.ttfb, unit: "ms", thresholds: [800, 1800] },
                    ].map(m => <CWVGauge key={m.label} {...m} />)}
                  </div>
                </div>
              )}

              {/* Issues count */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
                {["critical", "warning", "info"].map(sev => {
                  const count = actionItems.filter(a => a.sev === sev).length;
                  return (
                    <div key={sev} style={{ background: "#09090b", border: `1px solid ${sev === "critical" ? "#7f1d1d44" : sev === "warning" ? "#78350f44" : "#27272a"}`, borderRadius: 12, padding: "16px 20px" }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: sev === "critical" ? "#f87171" : sev === "warning" ? "#fbbf24" : "#a1a1aa" }}>{count}</div>
                      <div style={{ fontSize: 12, color: "#71717a", textTransform: "capitalize" }}>{sev} Issues</div>
                    </div>
                  );
                })}
              </div>

              {/* AI summary */}
              {auditText && (
                <div style={{ ...S.card, marginTop: 16 }}>
                  <div style={S.sectionTitle}>AI Analysis</div>
                  <div style={{ fontSize: 13, lineHeight: 1.8, color: "#e4e4e7", whiteSpace: "pre-wrap" }}>{auditText.slice(0, 2000)}{auditText.length > 2000 ? "\n\n[â€¦see full report in individual tabs]" : ""}</div>
                </div>
              )}

              {/* SERP Preview */}
              {(pd.title || pd.metaDescription || url) && (
                <div style={{ ...S.card, marginTop: 16 }}>
                  <div style={S.sectionTitle}>Google SERP Preview</div>
                  <div style={{ background: "#fff", borderRadius: 8, padding: "14px 18px", maxWidth: 600 }}>
                    <div style={{ fontSize: 12, color: "#202124", marginBottom: 3 }}>{url}</div>
                    <div style={{ fontSize: 18, color: "#1a0dab", marginBottom: 4, fontFamily: "arial,sans-serif" }}>{pd.title || "No title set"}</div>
                    <div style={{ fontSize: 13, color: "#4d5156", fontFamily: "arial,sans-serif", lineHeight: 1.5 }}>{pd.metaDescription || "No meta description set. Google will auto-generate a snippet from page content."}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CORE WEB VITALS */}
          {tab === "cwv" && (
            <div style={{ marginTop: 20 }}>
              <div style={S.card}>
                <div style={S.sectionTitle}>Core Web Vitals â€” Google Page Experience Signals</div>
                <p style={{ fontSize: 13, color: "#71717a", lineHeight: 1.6, marginBottom: 20 }}>CWV are direct Google ranking factors (since 2021). All three metrics (LCP, INP, CLS) must score "Good" to pass the Page Experience assessment.</p>
                {cwvData ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
                    <CWVGauge label="Largest Contentful Paint (LCP)" value={cwvData.lcp} unit="s" thresholds={[2.5, 4]} description="Measures loading performance. Should be â‰¤ 2.5s for the main page content to render." />
                    <CWVGauge label="Interaction to Next Paint (INP)" value={cwvData.inp} unit="ms" thresholds={[200, 500]} description="Measures overall responsiveness. Replaced FID in March 2024 as a Core Web Vital." />
                    <CWVGauge label="Cumulative Layout Shift (CLS)" value={cwvData.cls} unit="" thresholds={[0.1, 0.25]} description="Measures visual stability. Unexpected layout shifts frustrate users and hurt conversions." />
                    <CWVGauge label="First Contentful Paint (FCP)" value={cwvData.fcp} unit="s" thresholds={[1.8, 3]} description="First rendering of any DOM content (text, image, canvas, SVG)." />
                    <CWVGauge label="Time to First Byte (TTFB)" value={cwvData.ttfb} unit="ms" thresholds={[800, 1800]} description="Server response time before the browser receives the first byte of content." />
                    <CWVGauge label="Total Blocking Time (TBT)" value={cwvData.tbt} unit="ms" thresholds={[200, 600]} description="Sum of blocking periods between FCP and TTI. Lab proxy for INP." />
                  </div>
                ) : <EmptyState icon="âš¡" title="No CWV data" description="Run the audit from Overview to assess Core Web Vitals." />}

                {cwvData?.report && (
                  <div style={{ ...S.pre, marginTop: 20 }}>{cwvData.report}</div>
                )}

                <div style={{ marginTop: 20 }}>
                  <div style={S.sectionTitle}>How to improve Core Web Vitals</div>
                  {[
                    { metric: "LCP", tip: "Preload your hero image. Serve images via Shopify CDN. Use next-gen formats (WebP/AVIF). Remove render-blocking resources." },
                    { metric: "INP", tip: "Minimise JavaScript execution time. Break up long tasks. Use web workers for heavy computation. Defer third-party scripts." },
                    { metric: "CLS", tip: "Set width/height on all <img> and <video> tags. Reserve space for ads and embeds. Avoid injecting content above existing content." },
                    { metric: "TTFB", tip: "Use Shopify's global CDN. Enable storefront caching. Minimise liquid template complexity. Reduce third-party app API calls on critical path." },
                  ].map(({ metric, tip }) => (
                    <div key={metric} style={{ ...S.row, paddingLeft: 4 }}>
                      <span style={{ ...S.badge("warn"), minWidth: 40, textAlign: "center" }}>{metric}</span>
                      <span style={{ fontSize: 13, color: "#e4e4e7", flex: 1 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* CRAWLABILITY */}
          {tab === "crawl" && (
            <div style={{ marginTop: 20 }}>
              <div style={S.card}>
                <div style={S.sectionTitle}>Crawlability &amp; Indexability</div>
                {crawlData?.report ? (
                  <div style={S.pre}>{crawlData.report}</div>
                ) : null}
                <div style={{ marginTop: 16 }}>
                  {[
                    { label: "HTTPS enabled", value: pd.https ? "Yes" : "No", status: pd.https ? "pass" : "fail", detail: "HTTPS encrypts data, is a ranking signal, and required for Shopify checkout." },
                    { label: "Has sitemap.xml", value: pd.hasSitemap ? "Found" : "Not detected", status: pd.hasSitemap ? "pass" : "warn", detail: "A sitemap helps Google discover and crawl all your pages efficiently." },
                    { label: "Canonical tag", value: pd.hasCanonical ? "Present" : "Missing", status: pd.hasCanonical ? "pass" : "warn", detail: "Canonical tags prevent duplicate content issues from URL parameters and pagination." },
                    { label: "Meta robots", value: pd.hasRobotsMeta ? "Present" : "Not found", status: pd.hasRobotsMeta ? "pass" : "info", detail: "Meta robots can control indexability per-page. Ensure pages you want indexed don't have noindex." },
                    { label: "HTTP status", value: String(pd.statusCode || "â€”"), status: pd.statusCode === 200 ? "pass" : "fail", detail: "Pages must return 200 OK. Redirect chains or 4xx/5xx errors block indexing." },
                  ].map(c => <CheckRow key={c.label} {...c} />)}
                </div>
                <div style={{ marginTop: 20 }}>
                  <div style={S.sectionTitle}>Shopify Crawl Budget Tips</div>
                  {[
                    "Block /collections?sort_by=, ?variant=, and ?page= parameters in robots.txt to save crawl budget.",
                    "Use canonical tags on all paginated collection pages (page 2, 3, â€¦) pointing to page 1.",
                    "Shopify auto-generates /products/ and /collections/ duplicates â€” use canonical to consolidate.",
                    "Ensure your sitemap.xml excludes noindex pages. Shopify may include 404 redirects.",
                    "Check for orphan pages (not linked from navigation or internal links) â€” Googlebot may not find them.",
                    "Limit redirects to 1 hop maximum. Redirect chains waste crawl budget.",
                  ].map((tip, i) => (
                    <div key={i} style={{ ...S.row }}>
                      <span style={{ color: "#52525b", fontSize: 12, flexShrink: 0, marginTop: 1 }}>#{i + 1}</span>
                      <span style={{ fontSize: 13, color: "#a1a1aa", flex: 1 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
              {sitemapData?.report && (
                <div style={S.card}>
                  <div style={S.sectionTitle}>Sitemap &amp; Hreflang Analysis</div>
                  <div style={S.pre}>{sitemapData.report}</div>
                </div>
              )}
            </div>
          )}

          {/* ON-PAGE */}
          {tab === "onpage" && (
            <div style={{ marginTop: 20 }}>
              <div style={S.card}>
                <div style={S.sectionTitle}>Title &amp; Meta Tags</div>
                {[
                  { label: "Page Title", value: pd.title || "Missing", status: pd.title ? (pd.title.length < 10 ? "warn" : pd.title.length > 70 ? "warn" : "pass") : "fail", detail: `Current length: ${pd.title?.length ?? 0} chars. Ideal: 50â€“60 chars. Google truncates at ~580px width.` },
                  { label: "Meta Description", value: pd.metaDescription || "Missing", status: pd.metaDescription ? (pd.metaDescription.length < 120 ? "warn" : pd.metaDescription.length > 160 ? "warn" : "pass") : "warn", detail: `Current length: ${pd.metaDescription?.length ?? 0} chars. Ideal: 140â€“160 chars.` },
                  { label: "H1 Tag", value: pd.h1 || "Missing", status: pd.h1 ? "pass" : "fail", detail: "Each page should have exactly one H1. It's the primary topic signal to search engines." },
                  { label: "H2 Count", value: String(pd.h2Count ?? "â€”"), status: pd.h2Count > 0 ? "pass" : "warn", detail: "H2s structure your content. Each H2 should target a semantic sub-topic." },
                  { label: "H3 Count", value: String(pd.h3Count ?? "â€”"), status: "info", detail: "H3s provide additional content hierarchy. Use for FAQ and step-by-step content." },
                ].map(c => <CheckRow key={c.label} {...c} />)}
              </div>
              <div style={S.card}>
                <div style={S.sectionTitle}>Content Quality Signals</div>
                {[
                  { label: "Inline Styles Count", value: String(pd.inlineStyles ?? "â€”"), status: pd.inlineStyles > 20 ? "warn" : "pass", detail: "High inline style count bloats HTML and makes caching less efficient." },
                  { label: "Image Count", value: String(pd.imageCount ?? "â€”"), status: "info", detail: "Total images detected on page." },
                  { label: "Images with Alt", value: pd.imagesWithAlt != null ? `${pd.imagesWithAlt} / ${pd.imageCount}` : "â€”", status: pd.imagesWithAlt === pd.imageCount ? "pass" : pd.imagesWithAlt > 0 ? "warn" : "fail", detail: "All images should have descriptive alt attributes for accessibility and image SEO." },
                  { label: "Page HTML Size", value: pd.pageSizeKB ? `${pd.pageSizeKB} KB` : "â€”", status: pd.pageSizeKB < 500 ? "pass" : pd.pageSizeKB < 1000 ? "warn" : "fail", detail: "Large HTML payload increases load time. Ideal: under 500KB total HTML." },
                ].map(c => <CheckRow key={c.label} {...c} />)}
              </div>
              <div style={S.card}>
                <div style={S.sectionTitle}>Shopify On-Page Best Practices</div>
                {[
                  { label: "Include primary keyword in H1", check: true },
                  { label: "Product title = H1 (Shopify auto-does this in most themes)", check: true },
                  { label: "Meta description written for each product/collection/blog", check: null },
                  { label: "Product descriptions > 300 words (not just bullet lists)", check: null },
                  { label: "Brand name in page title suffix (e.g. 'Product Name | Brand')", check: null },
                  { label: "Alt text on all product images includes keyword + colour + material", check: null },
                  { label: "FAQ schema added for blog posts answering questions", check: null },
                  { label: "Internal links from blog posts to product/collection pages", check: null },
                ].map(({ label, check }) => (
                  <div key={label} style={S.row}>
                    <span style={S.badge(check === true ? "pass" : check === false ? "fail" : "info")}>{check === true ? "âœ“" : check === false ? "âœ—" : "?"}</span>
                    <span style={{ fontSize: 13, color: "#e4e4e7" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* IMAGES */}
          {tab === "images" && (
            <div style={{ marginTop: 20 }}>
              <div style={S.card}>
                <div style={S.sectionTitle}>Image SEO Audit</div>
                {imageData?.report ? (
                  <div style={S.pre}>{imageData.report}</div>
                ) : (
                  <div style={{ marginBottom: 16 }}>
                    <CheckRow label="Total Images" value={String(pd.imageCount ?? "â€”")} status="info" detail="All img elements found on the page." />
                    <CheckRow label="Images with Alt Text" value={pd.imagesWithAlt != null ? `${pd.imagesWithAlt} / ${pd.imageCount}` : "â€”"} status={pd.imagesWithAlt === pd.imageCount ? "pass" : "warn"} detail="Missing alt text harms both accessibility and image search ranking." />
                  </div>
                )}
                <div style={S.sectionTitle}>Image Optimisation Checklist</div>
                {[
                  { t: "Use WebP or AVIF format â€” up to 80% smaller than JPEG/PNG with same quality", tip: "Shopify automatically serves WebP to supported browsers via the CDN." },
                  { t: "Compress product images to under 100KB per image", tip: "Use TinyPNG, Squoosh, or ImageOptim before uploading to Shopify." },
                  { t: "Add keyword-rich alt text to every product image", tip: "Example: 'navy blue merino wool crew neck jumper size medium' â€” not 'product_image_1'." },
                  { t: "Set image width and height attributes to prevent CLS", tip: "Modern Shopify themes typically do this. Check your custom theme." },
                  { t: "Use lazy loading (loading='lazy') for below-fold images", tip: "Modern Shopify themes include this. Critical for LCP on long pages." },
                  { t: "Use image CDN for non-Shopify hosted images", tip: "Shopify CDN is automatic for uploaded images. Avoid external image hosting." },
                  { t: "Name image files descriptively before uploading", tip: "e.g. red-leather-wallet-front.jpg not IMG_5892.jpg." },
                ].map(({ t, tip }) => (
                  <div key={t} style={{ ...S.row }}>
                    <span style={{ color: "#4ade80", fontSize: 14, flexShrink: 0 }}>â†’</span>
                    <div>
                      <div style={{ fontSize: 13, color: "#e4e4e7" }}>{t}</div>
                      <div style={{ fontSize: 12, color: "#52525b", marginTop: 2 }}>{tip}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCHEMA */}
          {tab === "schema" && (
            <div style={{ marginTop: 20 }}>
              <div style={S.card}>
                <div style={S.sectionTitle}>Schema &amp; Structured Data</div>
                {schemaData?.report ? (
                  <div style={S.pre}>{schemaData.report}</div>
                ) : (
                  <CheckRow label="Structured data" value={pd.hasSchema ? "Detected" : "None found"} status={pd.hasSchema ? "pass" : "warn"} detail="Structured data (JSON-LD) enables rich results â€” reviews, prices, FAQs â€” in Google Search." />
                )}
                <div style={{ marginTop: 16 }}>
                  <div style={S.sectionTitle}>Recommended Schema for Shopify</div>
                  {[
                    { type: "Product", priority: "Critical", desc: "Enables price, availability, and star-rating rich results on product pages. Essential for e-commerce." },
                    { type: "BreadcrumbList", priority: "High", desc: "Shows breadcrumb navigation in SERPs â€” improves CTR and helps users understand site structure." },
                    { type: "Organization", priority: "High", desc: "Tells Google about your brand â€” logo, social profiles, contact info. Helps branded search results." },
                    { type: "FAQPage", priority: "Medium", desc: "Displays expandable FAQ accordions in SERPs for informational and product pages." },
                    { type: "Article / BlogPosting", priority: "Medium", desc: "Enables article rich results for blog posts â€” date, author, featured image." },
                    { type: "Review / AggregateRating", priority: "Medium", desc: "Shows star ratings in SERPs on product pages â€” significantly improves CTR." },
                    { type: "HowTo", priority: "Low", desc: "Step-by-step guide results with images. Good for tutorial blog content." },
                    { type: "VideoObject", priority: "Low", desc: "Rich results for embedded YouTube/Vimeo product videos â€” thumbnail, duration." },
                  ].map(({ type, priority, desc }) => (
                    <div key={type} style={S.row}>
                      <span style={{ ...S.badge(priority === "Critical" ? "fail" : priority === "High" ? "warn" : "info"), flexShrink: 0 }}>{priority}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>{type}</div>
                        <div style={{ fontSize: 12, color: "#71717a" }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MOBILE */}
          {tab === "mobile" && (
            <div style={{ marginTop: 20 }}>
              <div style={S.card}>
                <div style={S.sectionTitle}>Mobile-First Audit</div>
                {mobileData?.report ? (
                  <div style={S.pre}>{mobileData.report}</div>
                ) : null}
                <div>
                  {[
                    { label: "Viewport meta tag", value: pd.hasViewport ? "Set" : "Missing", status: pd.hasViewport ? "pass" : "fail", detail: "The viewport meta tag tells mobile browsers how to scale the page. Google penalises pages without it." },
                    { label: "Responsive design", value: "Check required", status: "info", detail: "Use browser DevTools to test at 375px (iPhone SE), 390px (iPhone 14), and 414px widths." },
                    { label: "Touch targets â‰¥ 48px", value: "Check required", status: "info", detail: "Buttons and links must be at least 48Ã—48px for comfortable tapping on mobile." },
                    { label: "Font size â‰¥ 16px", value: "Check required", status: "info", detail: "Anything below 16px may be zoomed in by iOS Safari, breaking layout." },
                    { label: "No horizontal scroll", value: "Check required", status: "info", detail: "Content wider than the viewport forces horizontal scrolling and fails mobile usability." },
                  ].map(c => <CheckRow key={c.label} {...c} />)}
                </div>
                <div style={{ marginTop: 20 }}>
                  <div style={S.sectionTitle}>Shopify Mobile Optimisation</div>
                  {[
                    "Test your store using Google's Mobile-Friendly Test (search.google.com/test/mobile-friendly).",
                    "Enable AMP for blog posts if your theme supports it â€” faster mobile loading.",
                    "Check that pop-ups and interstitials don't cover content on mobile (Google penalty risk).",
                    "Optimise checkout for mobile â€” large touch targets, autofill support, Apple Pay / Google Pay.",
                    "Reduce app JavaScript that blocks the main thread on mobile devices.",
                    "Test on real devices â€” iOS Safari and Android Chrome render differently.",
                    "Use Google Search Console's 'Mobile Usability' report for page-level mobile issues.",
                  ].map((tip, i) => (
                    <div key={i} style={S.row}>
                      <span style={{ color: "#52525b", fontSize: 12, flexShrink: 0 }}>â€¢</span>
                      <span style={{ fontSize: 13, color: "#a1a1aa" }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ACTION PLAN */}
          {tab === "action" && (
            <div style={{ marginTop: 20 }}>
              <div style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={S.sectionTitle}>Prioritised Action Plan ({actionItems.length} issues)</div>
                  {actionItems.length > 0 && (
                    <button onClick={exportReport} style={S.btn()}>Export Report</button>
                  )}
                </div>
                {actionItems.length === 0 ? (
                  <EmptyState icon="âœ…" title="No major issues found" description="Your site passed all the checks we could verify. Continue monitoring regularly." />
                ) : (
                  <>
                    {["critical", "warning", "info"].map(sev => {
                      const items = actionItems.filter(a => a.sev === sev);
                      if (!items.length) return null;
                      return (
                        <div key={sev}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "#71717a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{sev} â€” {items.length} issue{items.length !== 1 ? "s" : ""}</div>
                          {items.map((item, i) => <IssueCard key={i} {...item} />)}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Impact matrix */}
              <div style={S.card}>
                <div style={S.sectionTitle}>SEO Impact Priority Matrix</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { q: "Quick wins (high impact, easy)", items: ["Fix missing alt text", "Write meta descriptions", "Add canonical tags", "Enable HTTPS"], color: "#22c55e" },
                    { q: "High priority (high impact, harder)", items: ["Improve LCP to <2.5s", "Fix CLS issues", "Add Product schema", "Fix broken pages"], color: "#f59e0b" },
                    { q: "Low hanging fruit (low impact, easy)", items: ["Optimise title lengths", "Add H2 structure", "Compress large images", "Add robots.txt"], color: "#818cf8" },
                    { q: "Long term (low impact, harder)", items: ["Content depth expansion", "Link building campaign", "International hreflang", "JavaScript rendering"], color: "#52525b" },
                  ].map(({ q, items, color }) => (
                    <div key={q} style={{ background: "#09090b", border: `1px solid ${color}33`, borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 8 }}>{q}</div>
                      {items.map(it => <div key={it} style={{ fontSize: 12, color: "#a1a1aa", marginBottom: 4 }}>â€¢ {it}</div>)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* HISTORY */}
          {tab === "history" && (
            <div style={{ marginTop: 20 }}>
              <div style={S.card}>
                <div style={S.sectionTitle}>Audit History</div>
                {history.length === 0 ? (
                  <EmptyState icon="ðŸ“‹" title="No audit history yet" description="Completed audits will appear here for trend tracking." />
                ) : (
                  <div>
                    {history.map((h, i) => (
                      <div key={i} style={{ ...S.row, alignItems: "flex-start" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>{h.site || h.url || "Unknown URL"}</div>
                          <div style={{ fontSize: 12, color: "#52525b", marginTop: 2 }}>{h.timestamp ? new Date(h.timestamp).toLocaleString() : ""}</div>
                          {h.auditReport && <div style={{ fontSize: 12, color: "#71717a", marginTop: 4, lineHeight: 1.5 }}>{h.auditReport.slice(0, 150)}â€¦</div>}
                        </div>
                        <button onClick={() => navigator.clipboard?.writeText(JSON.stringify(h, null, 2))} style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }}>Copy</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI CHAT */}
          <div style={{ ...S.card, marginTop: 24, background: "#0d0d10" }}>
            <div style={S.sectionTitle}>AI SEO Assistant</div>
            {chatHistory.length > 0 && (
              <div style={{ maxHeight: 240, overflowY: "auto", marginBottom: 12 }}>
                {chatHistory.map((m, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: m.role === "user" ? "#818cf8" : "#4ade80", marginRight: 6 }}>{m.role === "user" ? "You" : "AI"}:</span>
                    <span style={{ fontSize: 13, color: "#e4e4e7", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{m.content}</span>
                  </div>
                ))}
                {chatLoading && <Spinner size={14} />}
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <input style={{ ...S.input, fontSize: 13 }} value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} placeholder="Ask about your audit results, e.g. 'How do I fix my LCP score?'" />
              <button style={S.btn("primary")} onClick={sendChat} disabled={chatLoading}>Ask</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
