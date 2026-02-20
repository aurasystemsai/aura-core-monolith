﻿import React, { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "../../api";

function CharBar({ value = "", min, max, label, error }) {
  const len = (value || "").length;
  const ok = len >= min && len <= max;
  const over = len > max;
  const empty = len === 0;
  const pct = Math.min(100, (len / (max + 20)) * 100);
  const colour = empty ? "#525578" : ok ? "#4ade80" : over ? "#f87171" : "#fbbf24";
  const hint = empty ? `Required: ${min}${max} chars` : ok ? `Good (${len} chars)` : over ? `Too long  remove ${len - max} chars` : `Too short  add ${min - len} more chars`;
  return (
    <div style={{ marginTop: 5 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: colour, fontWeight: empty ? 400 : 600 }}>{hint}</span>
        <span style={{ fontSize: 11, color: "#475569" }}>{len} / {max}</span>
      </div>
      <div style={{ height: 5, background: "#2e3045", borderRadius: 2 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: colour, borderRadius: 2, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

function ScoreRing({ score }) {
  const colour = score >= 80 ? "#4ade80" : score >= 55 ? "#fbbf24" : "#f87171";
  const label = score >= 80 ? "Excellent" : score >= 55 ? "Good" : score >= 35 ? "Needs Work" : "Poor";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ width: 96, height: 96, borderRadius: "50%", background: `conic-gradient(${colour} ${score * 3.6}deg, #2e3045 ${score * 3.6}deg)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 74, height: 74, borderRadius: "50%", background: "#252638", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: colour, fontWeight: 900, fontSize: 24, lineHeight: 1 }}>{score}</span>
          <span style={{ color: "#475569", fontSize: 10, fontWeight: 600 }}>/ 100</span>
        </div>
      </div>
      <span style={{ fontSize: 13, color: colour, fontWeight: 700 }}>{label}</span>
    </div>
  );
}

function GooglePreview({ title, description, url }) {
  return (
    <div style={{ background: "#6366f1", borderRadius: 10, padding: "14px 18px", fontFamily: "Arial, sans-serif", border: "1px solid #f9fafb" }}>
      <div style={{ fontSize: 12, color: "#006621", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url || "yourstore.myshopify.com/pages/page-slug"}</div>
      <div style={{ fontSize: 18, color: "#525578", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title || <span style={{ color: "#999" }}>Your Page Title</span>}</div>
      <div style={{ fontSize: 13, color: "#545454", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{description || <span style={{ color: "#bbb" }}>Your meta description will appear here</span>}</div>
    </div>
  );
}

const TABS = ["Analyzer", "History", "AI Assistant", "Analytics"];
const EMPTY_FORM = { url: "", title: "", metaDescription: "", h1: "", wordCount: "", canonicalUrl: "", schemaMarkup: "", h2Count: "", h3Count: "", internalLinks: "", externalLinks: "", imageCount: "", imagesWithAlt: "", keywords: "" };

export default function OnPageSEOEngine({ initialUrl, onUrlConsumed }) {
  const [tab, setTab] = useState("Analyzer");
  const [form, setForm] = useState(EMPTY_FORM);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState(null); // { ok, msg }
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiReply, setAiReply] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiContext, setAiContext] = useState("general");
  const [analyticsData, setAnalyticsData] = useState([]);
  const fetchTimerRef = useRef(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => { loadHistory(); loadAnalytics(); }, []);

  // If launched from dashboard scan with a URL, pre-fill and crawl immediately
  useEffect(() => {
    if (initialUrl) {
      setForm(f => ({ ...f, url: initialUrl }));
      crawlUrl(initialUrl);
      if (onUrlConsumed) onUrlConsumed();
    }
  }, [initialUrl]);

  // Auto-crawl when URL is entered (debounced 1.5s)
  useEffect(() => {
    const url = form.url.trim();
    if (!url || !url.startsWith("http")) { setFetchStatus(null); return; }
    clearTimeout(fetchTimerRef.current);
    fetchTimerRef.current = setTimeout(() => crawlUrl(url), 1500);
    return () => clearTimeout(fetchTimerRef.current);
  }, [form.url]);

  async function crawlUrl(url) {
    setFetching(true);
    setFetchStatus(null);
    try {
      const res = await apiFetch("/api/on-page-seo-engine/fetch-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Fetch failed");
      setForm(f => ({
        ...f,
        url: data.url || f.url,
        title: data.title || f.title,
        metaDescription: data.metaDescription || f.metaDescription,
        h1: data.h1 || f.h1,
        h2Count: data.h2Count != null ? String(data.h2Count) : f.h2Count,
        h3Count: data.h3Count != null ? String(data.h3Count) : f.h3Count,
        wordCount: data.wordCount != null ? String(data.wordCount) : f.wordCount,
        canonicalUrl: data.canonicalUrl || f.canonicalUrl,
        schemaMarkup: data.schemaMarkup || f.schemaMarkup,
        internalLinks: data.internalLinks != null ? String(data.internalLinks) : f.internalLinks,
        externalLinks: data.externalLinks != null ? String(data.externalLinks) : f.externalLinks,
        imageCount: data.imageCount != null ? String(data.imageCount) : f.imageCount,
        imagesWithAlt: data.imagesWithAlt != null ? String(data.imagesWithAlt) : f.imagesWithAlt,
      }));
      setFetchStatus({ ok: true, msg: ` Page data fetched  all fields auto-filled. Review and run analysis.` });
    } catch (err) {
      setFetchStatus({ ok: false, msg: ` Could not fetch page: ${err.message}. Fill fields manually.` });
    }
    setFetching(false);
  }

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const res = await apiFetch("/api/on-page-seo-engine/items");
      const data = await res.json();
      if (data.ok) setHistory(data.items || []);
    } catch (_) {}
    setHistoryLoading(false);
  }

  async function loadAnalytics() {
    try {
      const res = await apiFetch("/api/on-page-seo-engine/analytics");
      const data = await res.json();
      if (data.ok) setAnalyticsData(data.events || []);
    } catch (_) {}
  }

  async function runAnalysis() {
    if (!form.title && !form.url) { setError("Enter a page URL  the tool will auto-fill the rest."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const issues = [];
      if (!form.title) issues.push({ field: "title", severity: "high", msg: "Missing page title" });
      else if (form.title.length < 45) issues.push({ field: "title", severity: "medium", msg: `Title too short  ${form.title.length} chars, need 4565` });
      else if (form.title.length > 65) issues.push({ field: "title", severity: "medium", msg: `Title too long  ${form.title.length} chars, cut to 65` });

      if (!form.metaDescription) issues.push({ field: "metaDescription", severity: "high", msg: "Missing meta description" });
      else if (form.metaDescription.length < 130) issues.push({ field: "metaDescription", severity: "medium", msg: `Meta description too short  ${form.metaDescription.length} chars, need 130165` });
      else if (form.metaDescription.length > 165) issues.push({ field: "metaDescription", severity: "medium", msg: `Meta description too long  ${form.metaDescription.length} chars, cut to 165` });

      if (!form.h1) issues.push({ field: "h1", severity: "high", msg: "No H1 heading found on page" });
      if (Number(form.wordCount) > 0 && Number(form.wordCount) < 300) issues.push({ field: "wordCount", severity: "medium", msg: `Only ${form.wordCount} words  aim for 300+ for SEO impact` });
      if (!form.canonicalUrl) issues.push({ field: "canonicalUrl", severity: "low", msg: "No canonical URL tag  duplicate content risk" });
      if (!form.schemaMarkup) issues.push({ field: "schemaMarkup", severity: "low", msg: "No structured data / schema markup detected" });
      if (Number(form.h2Count) === 0) issues.push({ field: "h2Count", severity: "low", msg: "No H2 headings  add subheadings to structure content" });
      if (Number(form.h3Count) > 0 && Number(form.h2Count) === 0) issues.push({ field: "h3Count", severity: "low", msg: "H3 used without H2  broken heading hierarchy" });
      if (Number(form.internalLinks) > 0 && Number(form.internalLinks) < 2) issues.push({ field: "internalLinks", severity: "low", msg: `Only ${form.internalLinks} internal link  add more for crawlability` });
      if (Number(form.imageCount) > 0 && Number(form.imagesWithAlt) < Number(form.imageCount)) {
        const missing = Number(form.imageCount) - Number(form.imagesWithAlt);
        issues.push({ field: "imagesWithAlt", severity: "medium", msg: `${missing} image${missing !== 1 ? "s" : ""} missing alt text  accessibility & SEO issue` });
      }
      if (form.keywords) {
        form.keywords.split(",").map(k => k.trim().toLowerCase()).filter(Boolean).forEach(kw => {
          if (!form.title.toLowerCase().includes(kw) && !form.metaDescription.toLowerCase().includes(kw) && !form.h1.toLowerCase().includes(kw))
            issues.push({ field: "keywords", severity: "low", msg: `Keyword "${kw}" missing from title, description and H1` });
        });
      }

      const score = Math.max(0, 100 - issues.filter(i => i.severity === "high").length * 15 - issues.filter(i => i.severity === "medium").length * 8 - issues.filter(i => i.severity === "low").length * 4);
      const analysisResult = { score, issues, input: { ...form }, ts: new Date().toISOString() };
      setResult(analysisResult);

      try {
        await apiFetch("/api/on-page-seo-engine/items", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, score, issueCount: issues.length, ts: analysisResult.ts }) });
        await apiFetch("/api/on-page-seo-engine/analytics", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event: "analysis_run", score, url: form.url, issueCount: issues.length }) });
        loadHistory(); loadAnalytics();
      } catch (_) {}

      showToast(issues.length === 0 ? " Perfect score  no issues found!" : `Analysis complete  ${issues.length} issue${issues.length !== 1 ? "s" : ""} found`);
    } catch (err) { setError("Analysis failed: " + err.message); }
    setLoading(false);
  }

  async function runAI() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true); setAiReply("");
    try {
      const systemPrompts = {
        general: "You are an expert on-page SEO consultant. Give specific, actionable advice.",
        title: "You are an SEO title specialist. Generate 5 SEO-optimised page title variants (4565 chars each). Format as a numbered list.",
        metaDesc: "You are an SEO meta description expert. Write 3 compelling meta descriptions (130165 chars each). Format as a numbered list.",
        h1: "You are a content SEO specialist. Suggest 5 strong H1 heading variants that include the target keyword naturally.",
        schema: "You are a structured data / schema.org expert. Generate the most appropriate JSON-LD schema markup for this page.",
        keywords: "You are an SEO keyword research expert. Suggest 10 LSI / related keywords and explain their relevance.",
      };
      const res = await apiFetch("/api/on-page-seo-engine/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompts[aiContext] || systemPrompts.general },
            { role: "user", content: aiPrompt + (result ? `\n\nPage context  Title: ${result.input.title}, Meta: ${result.input.metaDescription}, H1: ${result.input.h1}, URL: ${result.input.url}` : "") },
          ],
        }),
      });
      const data = await res.json();
      setAiReply(data.reply || data.error || "No response");
    } catch (err) { setAiReply("Error: " + err.message); }
    setAiLoading(false);
  }

  function copyText(text) { navigator.clipboard.writeText(text).then(() => showToast("Copied!")); }
  function loadFromHistory(item) {
    setForm(f => ({ ...f, ...item }));
    setTab("Analyzer");
    showToast("Loaded from history  you can re-run the analysis");
  }

  const sev = { high: "#f87171", medium: "#fbbf24", low: "#60a5fa" };
  const issueFields = new Set(result?.issues.map(i => i.field) || []);

  return (
    <div style={{ background: "#252638", minHeight: "100vh", color: "#f9fafb", fontFamily: "Inter, system-ui, sans-serif" }}>

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, background: toast.type === "error" ? "#2d1515" : "#0f2d24", border: `1px solid ${toast.type === "error" ? "#f87171" : "#4ade80"}`, borderRadius: 12, padding: "14px 20px", color: toast.type === "error" ? "#f87171" : "#4ade80", fontSize: 14, fontWeight: 500, maxWidth: 380, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", display: "flex", gap: 10, alignItems: "center" }}>
          <span>{toast.type === "error" ? "" : ""}</span> {toast.msg}
        </div>
      )}

      <div style={{ background: "linear-gradient(135deg, #252638 0%, #2e3045 100%)", borderBottom: "1px solid #2e3045", padding: "28px 32px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: "#6366f1", margin: 0 }}>On-Page SEO Engine</h1>
            <p style={{ color: "#64748b", fontSize: 14, margin: "4px 0 0" }}>Paste a URL  every field auto-fills instantly. Then run your analysis.</p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {[{ label: "Analyses", value: history.length, color: "#6366f1" }, { label: "Avg Score", value: history.filter(h => h.score).length ? Math.round(history.filter(h => h.score).reduce((s, h) => s + h.score, 0) / history.filter(h => h.score).length) : "", color: "#a78bfa" }, { label: "Events", value: analyticsData.length, color: "#fbbf24" }].map(s => (
              <div key={s.label} style={{ background: "#2e3045", border: "1px solid #2e3045", borderRadius: 10, padding: "10px 18px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", borderTop: "1px solid #2e3045" }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background: "none", border: "none", padding: "12px 24px", cursor: "pointer", color: tab === t ? "#6366f1" : "#64748b", fontWeight: tab === t ? 700 : 500, fontSize: 14, borderBottom: tab === t ? "2px solid #6366f1" : "2px solid transparent", transition: "all 0.15s" }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "28px 32px" }}>

        {tab === "Analyzer" && (
          <div style={{ display: "grid", gridTemplateColumns: result ? "1fr 400px" : "1fr", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* URL  the magic input */}
              <div style={{ background: "linear-gradient(135deg, #0f2d24, #252638)", border: "2px solid #6366f1", borderRadius: 14, padding: 20 }}>
                <label style={{ display: "block", fontWeight: 800, color: "#6366f1", marginBottom: 10, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.07em" }}>
                   Paste Your Page URL  Everything Auto-Fills
                </label>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ flex: 1, position: "relative" }}>
                    <input
                      value={form.url}
                      onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                      placeholder="https://yourstore.myshopify.com/pages/about"
                      style={{ width: "100%", background: "#252638", border: `1px solid ${fetching ? "#fbbf24" : fetchStatus?.ok ? "#4ade80" : "#2e3045"}`, borderRadius: 8, padding: "11px 14px", color: "#f9fafb", fontSize: 15, outline: "none", boxSizing: "border-box" }}
                    />
                    {fetching && <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#fbbf24" }}>Fetching</div>}
                  </div>
                  <button onClick={() => form.url.trim() && crawlUrl(form.url.trim())} disabled={fetching || !form.url.trim()}
                    style={{ background: fetching ? "#525578" : "#6366f1", border: "none", borderRadius: 8, padding: "11px 18px", color: "#252638", fontWeight: 800, cursor: "pointer", fontSize: 14, whiteSpace: "nowrap", opacity: !form.url.trim() ? 0.5 : 1 }}>
                    {fetching ? "" : " Refetch"}
                  </button>
                </div>
                {fetchStatus && (
                  <div style={{ marginTop: 10, fontSize: 13, color: fetchStatus.ok ? "#4ade80" : "#fbbf24", fontWeight: 500 }}>{fetchStatus.msg}</div>
                )}
                {!form.url && <div style={{ marginTop: 8, fontSize: 12, color: "#475569" }}>Paste any URL above  title, meta, H1, word count, links, images and more are fetched automatically.</div>}
              </div>

              {/* Title + Meta */}
              <div style={{ background: "#2e3045", border: `1px solid ${issueFields.has("title") || issueFields.has("metaDescription") ? "#f87171" : "#2e3045"}`, borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", gap: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: -4 }}>
                  <span style={{ fontWeight: 700, color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Meta Tags</span>
                  {(issueFields.has("title") || issueFields.has("metaDescription")) && <span style={{ fontSize: 11, background: "#2d1515", color: "#f87171", border: "1px solid #f8717140", borderRadius: 4, padding: "2px 8px", fontWeight: 600 }}>Issues Found</span>}
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <label style={{ fontWeight: 600, color: issueFields.has("title") ? "#f87171" : "#94a3b8", fontSize: 13 }}>
                      Page Title {issueFields.has("title") && ""}
                    </label>
                    <button onClick={() => { setAiPrompt(`Write 5 SEO-optimised titles for this page: ${form.url || form.h1 || form.title}`); setAiContext("title"); setTab("AI Assistant"); }}
                      style={{ background: "none", border: "1px solid #2e3045", borderRadius: 6, padding: "3px 10px", color: "#a78bfa", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>AI Suggest</button>
                  </div>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    style={{ width: "100%", background: "#252638", border: `1px solid ${issueFields.has("title") ? "#f87171" : "#2e3045"}`, borderRadius: 8, padding: "10px 14px", color: "#f9fafb", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                  <CharBar value={form.title} min={45} max={65} label="4565 chars" />
                  {result && issueFields.has("title") && <div style={{ marginTop: 6, fontSize: 12, color: "#f87171" }}> {result.issues.find(i => i.field === "title")?.msg}</div>}
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <label style={{ fontWeight: 600, color: issueFields.has("metaDescription") ? "#f87171" : "#94a3b8", fontSize: 13 }}>
                      Meta Description {issueFields.has("metaDescription") && ""}
                    </label>
                    <button onClick={() => { setAiPrompt(`Write 3 meta descriptions for: ${form.title || form.url}`); setAiContext("metaDesc"); setTab("AI Assistant"); }}
                      style={{ background: "none", border: "1px solid #2e3045", borderRadius: 6, padding: "3px 10px", color: "#a78bfa", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>AI Suggest</button>
                  </div>
                  <textarea value={form.metaDescription} onChange={e => setForm(f => ({ ...f, metaDescription: e.target.value }))}
                    rows={3} style={{ width: "100%", background: "#252638", border: `1px solid ${issueFields.has("metaDescription") ? "#f87171" : "#2e3045"}`, borderRadius: 8, padding: "10px 14px", color: "#f9fafb", fontSize: 14, outline: "none", resize: "vertical", lineHeight: 1.5, boxSizing: "border-box" }} />
                  <CharBar value={form.metaDescription} min={130} max={165} label="130165 chars" />
                  {result && issueFields.has("metaDescription") && <div style={{ marginTop: 6, fontSize: 12, color: "#f87171" }}> {result.issues.find(i => i.field === "metaDescription")?.msg}</div>}
                </div>
              </div>

              {/* Heading structure */}
              <div style={{ background: "#2e3045", border: `1px solid ${issueFields.has("h1") || issueFields.has("h2Count") || issueFields.has("h3Count") ? "#f87171" : "#2e3045"}`, borderRadius: 14, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ fontWeight: 700, color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>Heading Structure</span>
                  {(issueFields.has("h1") || issueFields.has("h2Count")) && <span style={{ fontSize: 11, background: "#2d1515", color: "#f87171", border: "1px solid #f8717140", borderRadius: 4, padding: "2px 8px", fontWeight: 600 }}>Issues Found</span>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                  <div style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "block", fontSize: 12, color: issueFields.has("h1") ? "#f87171" : "#64748b", marginBottom: 5, fontWeight: issueFields.has("h1") ? 700 : 400 }}>H1 Text {issueFields.has("h1") && ""}</label>
                    <input value={form.h1} onChange={e => setForm(f => ({ ...f, h1: e.target.value }))}
                      style={{ width: "100%", background: "#252638", border: `1px solid ${issueFields.has("h1") ? "#f87171" : "#2e3045"}`, borderRadius: 8, padding: "9px 12px", color: "#f9fafb", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                    {result && issueFields.has("h1") && <div style={{ marginTop: 4, fontSize: 11, color: "#f87171" }}> {result.issues.find(i => i.field === "h1")?.msg}</div>}
                  </div>
                  {[{ key: "h2Count", label: "H2 Count" }, { key: "h3Count", label: "H3 Count" }].map(({ key, label }) => (
                    <div key={key}>
                      <label style={{ display: "block", fontSize: 12, color: issueFields.has(key) ? "#f87171" : "#64748b", marginBottom: 5 }}>{label} {issueFields.has(key) && ""}</label>
                      <input type="number" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder="0"
                        style={{ width: "100%", background: "#252638", border: `1px solid ${issueFields.has(key) ? "#f87171" : "#2e3045"}`, borderRadius: 8, padding: "9px 12px", color: "#f9fafb", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Content & Links */}
              <div style={{ background: "#2e3045", border: `1px solid ${issueFields.has("wordCount") || issueFields.has("imagesWithAlt") ? "#fbbf24" : "#2e3045"}`, borderRadius: 14, padding: 20 }}>
                <div style={{ fontWeight: 700, color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14 }}>Content & Links</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
                  {[{ key: "wordCount", label: "Word Count" }, { key: "internalLinks", label: "Internal Links" }, { key: "externalLinks", label: "External Links" }, { key: "imageCount", label: "Images Total" }, { key: "imagesWithAlt", label: "Images w/ Alt" }].map(({ key, label }) => (
                    <div key={key}>
                      <label style={{ display: "block", fontSize: 12, color: issueFields.has(key) ? "#fbbf24" : "#64748b", marginBottom: 5, fontWeight: issueFields.has(key) ? 700 : 400 }}>{label} {issueFields.has(key) && ""}</label>
                      <input type="number" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder="0"
                        style={{ width: "100%", background: "#252638", border: `1px solid ${issueFields.has(key) ? "#fbbf24" : "#2e3045"}`, borderRadius: 8, padding: "9px 12px", color: "#f9fafb", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                      {result && issueFields.has(key) && <div style={{ marginTop: 3, fontSize: 10, color: "#fbbf24", lineHeight: 1.3 }}>{result.issues.find(i => i.field === key)?.msg}</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical */}
              <div style={{ background: "#2e3045", border: `1px solid ${issueFields.has("canonicalUrl") || issueFields.has("schemaMarkup") ? "#60a5fa" : "#2e3045"}`, borderRadius: 14, padding: 20 }}>
                <div style={{ fontWeight: 700, color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 14 }}>Technical SEO</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: issueFields.has("canonicalUrl") ? "#60a5fa" : "#64748b", marginBottom: 5, fontWeight: issueFields.has("canonicalUrl") ? 700 : 400 }}>Canonical URL {issueFields.has("canonicalUrl") && " not detected on page"}</label>
                    <input value={form.canonicalUrl} onChange={e => setForm(f => ({ ...f, canonicalUrl: e.target.value }))} placeholder="https://yourstore.myshopify.com/pages/slug"
                      style={{ width: "100%", background: "#252638", border: `1px solid ${issueFields.has("canonicalUrl") ? "#60a5fa" : "#2e3045"}`, borderRadius: 8, padding: "9px 12px", color: "#f9fafb", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, color: "#64748b", marginBottom: 5 }}>Target Keywords (comma-separated)</label>
                    <input value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))} placeholder="ski wax, fast wax, snowboard accessories"
                      style={{ width: "100%", background: "#252638", border: "1px solid #2e3045", borderRadius: 8, padding: "9px 12px", color: "#f9fafb", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, color: issueFields.has("schemaMarkup") ? "#60a5fa" : "#94a3b8" }}>
                    <input type="checkbox" checked={!!form.schemaMarkup} onChange={e => setForm(f => ({ ...f, schemaMarkup: e.target.checked ? "yes" : "" }))} style={{ width: 16, height: 16, cursor: "pointer" }} />
                    Page has Schema / Structured Data markup {issueFields.has("schemaMarkup") && <span style={{ fontSize: 11, color: "#60a5fa" }}> none detected</span>}
                  </label>
                </div>
              </div>

              {error && <div style={{ color: "#f87171", fontSize: 14, padding: "10px 16px", background: "#2d1515", borderRadius: 8, border: "1px solid #f8717140" }}>{error}</div>}

              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => { setForm(EMPTY_FORM); setResult(null); setError(""); setFetchStatus(null); }}
                  style={{ background: "#2e3045", border: "1px solid #2e3045", borderRadius: 10, padding: "12px 20px", color: "#94a3b8", fontWeight: 600, cursor: "pointer", fontSize: 14 }}>Clear</button>
                <button onClick={runAnalysis} disabled={loading}
                  style={{ flex: 1, background: loading ? "#525578" : "linear-gradient(135deg, #6366f1, #22d3ee)", border: "none", borderRadius: 10, padding: "13px", color: "#252638", fontWeight: 800, cursor: loading ? "wait" : "pointer", fontSize: 15 }}>
                  {loading ? " Analysing" : " Run SEO Analysis"}
                </button>
                {result && (
                  <button onClick={() => { setAiPrompt(`Give me specific recommendations to fix these SEO issues on: ${form.url || form.title}\n\nIssues:\n${result.issues.map(i => `- [${i.severity}] ${i.msg}`).join("\n")}`); setTab("AI Assistant"); }}
                    style={{ background: "#7c3aed", border: "none", borderRadius: 10, padding: "12px 20px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14, whiteSpace: "nowrap" }}>Fix with AI</button>
                )}
              </div>
            </div>

            {result && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ background: "#2e3045", border: "1px solid #2e3045", borderRadius: 14, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                  <ScoreRing score={result.score} />
                  <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 6 }}>
                    {["high", "medium", "low"].map(sv => {
                      const count = result.issues.filter(i => i.severity === sv).length;
                      return count > 0 ? (
                        <div key={sv} style={{ display: "flex", justifyContent: "space-between", padding: "7px 12px", background: "#252638", borderRadius: 8, borderLeft: `3px solid ${sev[sv]}` }}>
                          <span style={{ fontSize: 13, color: sev[sv], fontWeight: 600, textTransform: "capitalize" }}>{sv} Priority</span>
                          <span style={{ fontSize: 13, color: sev[sv], fontWeight: 700 }}>{count} issue{count !== 1 ? "s" : ""}</span>
                        </div>
                      ) : null;
                    })}
                    {result.issues.length === 0 && <div style={{ textAlign: "center", color: "#4ade80", fontWeight: 700, fontSize: 15, padding: "8px 0" }}>No issues found!</div>}
                  </div>
                </div>

                {result.issues.length > 0 && (
                  <div style={{ background: "#2e3045", border: "1px solid #2e3045", borderRadius: 14, padding: 20 }}>
                    <div style={{ fontWeight: 700, color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>All Issues</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {result.issues.map((issue, i) => (
                        <div key={i} style={{ padding: "10px 14px", background: "#252638", borderRadius: 8, borderLeft: `3px solid ${sev[issue.severity]}` }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                            <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 4, background: `${sev[issue.severity]}20`, color: sev[issue.severity], fontWeight: 700, textTransform: "uppercase", flexShrink: 0, marginTop: 1 }}>{issue.severity}</span>
                            <span style={{ fontSize: 13, color: "#f9fafb", lineHeight: 1.4 }}>{issue.msg}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ background: "#2e3045", border: "1px solid #2e3045", borderRadius: 14, padding: 20 }}>
                  <div style={{ fontWeight: 700, color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Google Preview</div>
                  <GooglePreview title={form.title} description={form.metaDescription} url={form.url || form.canonicalUrl} />
                </div>

                <div style={{ background: "#2e3045", border: "1px solid #2e3045", borderRadius: 14, padding: 20 }}>
                  <div style={{ fontWeight: 700, color: "#94a3b8", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Checks</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {[
                      { label: "Title length", ok: form.title.length >= 45 && form.title.length <= 65, detail: `${form.title.length} chars` },
                      { label: "Meta desc length", ok: form.metaDescription.length >= 130 && form.metaDescription.length <= 165, detail: `${form.metaDescription.length} chars` },
                      { label: "H1 present", ok: !!form.h1, detail: form.h1 ? "" : "Missing" },
                      { label: "Word count", ok: Number(form.wordCount) >= 300, detail: form.wordCount ? `${form.wordCount}` : "" },
                      { label: "Canonical", ok: !!form.canonicalUrl, detail: form.canonicalUrl ? "Set" : "Missing" },
                      { label: "Schema", ok: !!form.schemaMarkup, detail: form.schemaMarkup ? "Present" : "Missing" },
                      { label: "Internal links", ok: Number(form.internalLinks) >= 2, detail: form.internalLinks || "" },
                      { label: "Alt text", ok: !form.imageCount || Number(form.imagesWithAlt) >= Number(form.imageCount), detail: form.imageCount ? `${form.imagesWithAlt || 0}/${form.imageCount}` : "" },
                    ].map(c => (
                      <div key={c.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", background: "#252638", borderRadius: 7 }}>
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>{c.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: c.ok ? "#4ade80" : "#f87171" }}>{c.ok ? "" : ""} {c.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "History" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#f9fafb" }}>Analysis History</h2>
              <button onClick={loadHistory} style={{ background: "#2e3045", border: "1px solid #2e3045", borderRadius: 10, padding: "8px 16px", color: "#6366f1", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Refresh</button>
            </div>
            {historyLoading ? <div style={{ color: "#64748b", textAlign: "center", padding: "40px 0" }}>Loading</div>
            : history.length === 0 ? (
              <div style={{ textAlign: "center", padding: "64px 0", color: "#64748b" }}>
                
                <div style={{ fontSize: 18, fontWeight: 600, color: "#94a3b8" }}>No analyses yet</div>
                <button onClick={() => setTab("Analyzer")} style={{ marginTop: 16, background: "#6366f1", border: "none", borderRadius: 10, padding: "10px 24px", color: "#252638", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Run First Analysis</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[...history].reverse().map((item, i) => {
                  const sc = item.score; const colour = sc >= 80 ? "#4ade80" : sc >= 55 ? "#fbbf24" : sc > 0 ? "#f87171" : "#475569";
                  return (
                    <div key={item.id || i} style={{ background: "#2e3045", border: "1px solid #2e3045", borderRadius: 14, padding: "18px 22px", display: "flex", alignItems: "center", gap: 18 }}>
                      <div style={{ textAlign: "center", minWidth: 52 }}>
                        <div style={{ fontSize: 24, fontWeight: 900, color: colour }}>{sc || ""}</div>
                        <div style={{ fontSize: 10, color: "#475569", fontWeight: 600 }}>SCORE</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: "#f9fafb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title || item.url || "Untitled page"}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
                          {item.url && <span style={{ marginRight: 12 }}>{item.url}</span>}
                          {item.issueCount != null && <span style={{ color: item.issueCount > 0 ? "#fbbf24" : "#4ade80" }}>{item.issueCount} issue{item.issueCount !== 1 ? "s" : ""}</span>}
                          {item.ts && <span style={{ marginLeft: 12 }}>{new Date(item.ts).toLocaleString()}</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => loadFromHistory(item)} style={{ background: "rgba(127,255,212,0.1)", border: "1px solid rgba(127,255,212,0.3)", borderRadius: 8, padding: "7px 14px", color: "#6366f1", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Load</button>
                        <button onClick={() => copyText(JSON.stringify(item, null, 2))} style={{ background: "#2e3045", border: "1px solid #2e3045", borderRadius: 8, padding: "7px 14px", color: "#94a3b8", cursor: "pointer", fontSize: 13 }}>Copy</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "AI Assistant" && (
          <div style={{ maxWidth: 800 }}>
            <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800, color: "#f9fafb" }}>AI SEO Assistant</h2>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "#64748b" }}>Generate titles, meta descriptions, H1s, schema markup and keyword ideas with AI.</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              {[{ key: "general", label: " General" }, { key: "title", label: " Titles" }, { key: "metaDesc", label: " Meta Descs" }, { key: "h1", label: " H1s" }, { key: "schema", label: " Schema" }, { key: "keywords", label: " Keywords" }].map(({ key, label }) => (
                <button key={key} onClick={() => setAiContext(key)} style={{ background: aiContext === key ? "#6366f1" : "#2e3045", border: `1px solid ${aiContext === key ? "#6366f1" : "#2e3045"}`, borderRadius: 8, padding: "8px 16px", color: aiContext === key ? "#252638" : "#94a3b8", cursor: "pointer", fontSize: 13, fontWeight: aiContext === key ? 700 : 500 }}>{label}</button>
              ))}
            </div>
            {result && (
              <div style={{ background: "#2e3045", border: "1px solid #2e3045", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#64748b" }}>
                <span style={{ color: "#6366f1", fontWeight: 600 }}>Context:</span> {result.input.title || result.input.url}  Score: <span style={{ color: result.score >= 80 ? "#4ade80" : "#fbbf24", fontWeight: 700 }}>{result.score}</span>  {result.issues.length} issues
              </div>
            )}
            <div style={{ background: "#2e3045", border: "1px solid #2e3045", borderRadius: 14, padding: 20, marginBottom: 16 }}>
              <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} rows={4} placeholder="Describe your page or paste specific content for AI to optimise..."
                style={{ width: "100%", background: "#252638", border: "1px solid #2e3045", borderRadius: 8, padding: "10px 14px", color: "#f9fafb", fontSize: 14, outline: "none", resize: "vertical", lineHeight: 1.5, boxSizing: "border-box" }} />
              <button onClick={runAI} disabled={aiLoading || !aiPrompt.trim()}
                style={{ marginTop: 12, background: aiLoading ? "#525578" : "linear-gradient(135deg, #6366f1, #22d3ee)", border: "none", borderRadius: 10, padding: "11px 28px", color: "#252638", fontWeight: 800, cursor: aiLoading ? "wait" : "pointer", fontSize: 14, opacity: !aiPrompt.trim() ? 0.5 : 1 }}>
                {aiLoading ? " Generating" : " Generate"}
              </button>
            </div>
            {aiReply && (
              <div style={{ background: "#2e3045", border: "1px solid #2e3045", borderRadius: 14, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontWeight: 700, color: "#6366f1", fontSize: 15 }}>AI Response</span>
                  <button onClick={() => copyText(aiReply)} style={{ background: "rgba(127,255,212,0.1)", border: "1px solid rgba(127,255,212,0.3)", borderRadius: 8, padding: "5px 14px", color: "#6366f1", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Copy</button>
                </div>
                <div style={{ background: "#252638", borderRadius: 10, padding: 16, color: "#f9fafb", fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{aiReply}</div>
              </div>
            )}
          </div>
        )}

        {tab === "Analytics" && (
          <div>
            <h2 style={{ margin: "0 0 20px", fontSize: 20, fontWeight: 800, color: "#f9fafb" }}>Analytics</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
              {[{ label: "Total Analyses", value: history.length, color: "#6366f1" }, { label: "Avg SEO Score", value: history.filter(h => h.score).length ? Math.round(history.filter(h => h.score).reduce((s, h) => s + h.score, 0) / history.filter(h => h.score).length) : "", color: "#a78bfa" }, { label: "Score  80", value: history.filter(h => h.score >= 80).length, color: "#4ade80" }, { label: "Score < 55", value: history.filter(h => h.score > 0 && h.score < 55).length, color: "#f87171" }, { label: "Events", value: analyticsData.length, color: "#fbbf24" }].map(s => (
                <div key={s.label} style={{ background: "#2e3045", border: "1px solid #2e3045", borderRadius: 14, padding: "20px 22px" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
            {history.length > 0 && (
              <div style={{ background: "#2e3045", border: "1px solid #2e3045", borderRadius: 14, padding: 24, marginBottom: 20 }}>
                <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#f9fafb" }}>Score Distribution</h3>
                {[{ label: "Excellent (80100)", min: 80, max: 100, colour: "#4ade80" }, { label: "Good (5579)", min: 55, max: 79, colour: "#a3e635" }, { label: "Needs Work (3554)", min: 35, max: 54, colour: "#fbbf24" }, { label: "Poor (034)", min: 0, max: 34, colour: "#f87171" }].map(band => {
                  const count = history.filter(h => h.score >= band.min && h.score <= band.max).length;
                  const pct = history.length ? Math.round(count / history.length * 100) : 0;
                  return (
                    <div key={band.label} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: "#94a3b8" }}>{band.label}</span>
                        <span style={{ fontSize: 13, color: band.colour, fontWeight: 600 }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ height: 8, background: "#252638", borderRadius: 4 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: band.colour, borderRadius: 4 }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {analyticsData.length > 0 && (
              <div style={{ background: "#2e3045", border: "1px solid #2e3045", borderRadius: 14, padding: 24 }}>
                <h3 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: "#f9fafb" }}>Recent Events</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[...analyticsData].reverse().slice(0, 15).map((ev, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 14px", background: "#252638", borderRadius: 8 }}>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "#0f2d24", color: "#4ade80", fontWeight: 600, flexShrink: 0 }}>{ev.event || "event"}</span>
                      <span style={{ fontSize: 13, color: "#64748b", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.url || ""}</span>
                      {ev.score != null && <span style={{ fontSize: 12, color: ev.score >= 80 ? "#4ade80" : "#fbbf24", fontWeight: 700 }}>Score: {ev.score}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
      <style>{`input:focus,textarea:focus{border-color:#6366f1!important;box-shadow:0 0 0 3px rgba(127,255,212,0.1);}button:active{transform:scale(0.97);}`}</style>
    </div>
  );
}


