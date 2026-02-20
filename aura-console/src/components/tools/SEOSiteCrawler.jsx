﻿import React, { useState, useRef, useEffect } from "react";
import { apiFetch } from "../../api";

const SEV_COLORS = { high: "#ef4444", medium: "#f59e0b", low: "#22c55e" };
const SEV_BG = { high: "#3f1315", medium: "#3d2a0a", low: "#0d2218" };

function SeverityBadge({ sev }) {
  return (
    <span style={{
      background: SEV_BG[sev] || "#2e2e2e",
      color: SEV_COLORS[sev] || "#94a3b8",
      border: `1px solid ${SEV_COLORS[sev] || "#4a4a4a"}`,
      borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700,
      textTransform: "uppercase", letterSpacing: 0.5,
    }}>{sev}</span>
  );
}

function IssueCard({ issue, pageUrl }) {
  const [fixing, setFixing] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [fixErr, setFixErr] = useState("");

  const handleGenerate = async () => {
    setFixing(true);
    setFixErr("");
    setSuggestion("");
    try {
      const res = await apiFetch("/api/seo-site-crawler/ai/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issue, page: pageUrl }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to generate fix");
      setSuggestion(data.suggestion);
    } catch (err) {
      setFixErr(err.message);
    } finally {
      setFixing(false);
    }
  };

  return (
    <div style={{ background: SEV_BG[issue.severity] || "#2e2e2e", borderRadius: 8, padding: "10px 14px", border: `1px solid ${SEV_COLORS[issue.severity] || "#4a4a4a"}22`, marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <SeverityBadge sev={issue.severity} />
        <span style={{ fontWeight: 700, color: "#e2e8f0", fontSize: 13 }}>{issue.type}</span>
        <button
          onClick={handleGenerate}
          disabled={fixing}
          style={{ marginLeft: "auto", background: "#7fffd4", color: "#141414", border: "none", borderRadius: 6, padding: "3px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
        >{fixing ? "…" : "Generate Fix"}</button>
      </div>
      <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>{issue.detail}</div>
      {issue.fix && (
        <div style={{ marginTop: 4, fontSize: 12, color: "#0ea5e9" }}>
          Tool: <span style={{ fontWeight: 600 }}>{issue.fix.replace(/-/g, " ")}</span>
        </div>
      )}
      {suggestion && (
        <div style={{ marginTop: 8, background: "#2e2e2e", borderRadius: 6, padding: "8px 12px", border: "1px solid #2e2e2e", fontSize: 13, color: "#7fffd4", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
          {suggestion}
          <button onClick={() => navigator.clipboard?.writeText(suggestion)} style={{ display: "block", marginTop: 6, background: "transparent", border: "1px solid #4a4a4a", borderRadius: 5, padding: "2px 10px", color: "#64748b", fontSize: 11, cursor: "pointer" }}>Copy</button>
        </div>
      )}
      {fixErr && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>{fixErr}</div>}
    </div>
  );
}

function KeywordPresencePanel({ keywords, keywordPresence }) {
  if (!keywords || keywords.length === 0) return null;
  return (
    <div style={{ background: "#282828", borderRadius: 8, padding: "10px 14px", marginBottom: 10, border: "1px solid #2e2e2e" }}>
      <div style={{ fontWeight: 700, fontSize: 12, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Keyword Presence Check</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {(keywordPresence || []).map(kp => (
          <div key={kp.keyword} style={{ background: "#141414", borderRadius: 8, padding: "6px 12px", border: "1px solid #2e2e2e", fontSize: 13 }}>
            <span style={{ fontWeight: 600, color: "#e2e8f0" }}>{kp.keyword}</span>
            <span style={{ marginLeft: 8, color: kp.inTitle ? "#22c55e" : "#ef4444", fontSize: 11, fontWeight: 700 }}>Title {kp.inTitle ? "" : ""}</span>
            <span style={{ marginLeft: 6, color: kp.inDesc ? "#22c55e" : "#ef4444", fontSize: 11, fontWeight: 700 }}>Desc {kp.inDesc ? "" : ""}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageSection({ page, keywords }) {
  const [open, setOpen] = useState(true);
  const issues = page.issues || [];

  return (
    <div style={{ background: "#141414", borderRadius: 10, border: "1px solid #2e2e2e", marginBottom: 12 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: "100%", background: "none", border: "none", color: "#e2e8f0", padding: "12px 16px", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <div>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{page.title || page.url}</span>
          <span style={{ marginLeft: 10, fontSize: 12, color: "#64748b" }}>{page.url}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {issues.filter(i => i.severity === "high").length > 0 && <span style={{ color: "#ef4444", fontWeight: 700, fontSize: 12 }}>{issues.filter(i => i.severity === "high").length} High</span>}
          {issues.filter(i => i.severity === "medium").length > 0 && <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: 12 }}>{issues.filter(i => i.severity === "medium").length} Med</span>}
          {issues.filter(i => i.severity === "low").length > 0 && <span style={{ color: "#22c55e", fontWeight: 700, fontSize: 12 }}>{issues.filter(i => i.severity === "low").length} Low</span>}
          <span style={{ color: "#64748b", fontSize: 16 }}>{open ? "" : ""}</span>
        </div>
      </button>
      {open && (
        <div style={{ padding: "0 16px 16px" }}>
          <KeywordPresencePanel keywords={keywords} keywordPresence={page.keywordPresence} />
          {issues.length === 0 ? (
            <div style={{ color: "#22c55e", fontWeight: 600, fontSize: 13 }}>No issues found on this page</div>
          ) : (
            issues.map((issue, i) => <IssueCard key={i} issue={issue} pageUrl={page.url} />)
          )}
        </div>
      )}
    </div>
  );
}

export default function SEOSiteCrawler() {
  const [input, setInput] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [kwInput, setKwInput] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [exported, setExported] = useState(null);
  const fileInputRef = useRef();

  const fetchHistory = async () => {
    try {
      const res = await apiFetch("/api/seo-site-crawler/history");
      const data = await res.json();
      if (data.ok) setHistory(data.history || []);
    } catch {}
  };
  const fetchAnalytics = async () => {
    try {
      const res = await apiFetch("/api/seo-site-crawler/analytics");
      const data = await res.json();
      if (data.ok) setAnalytics(data.analytics || []);
    } catch {}
  };

  useEffect(() => { fetchHistory(); fetchAnalytics(); }, []);

  // Keywords chip input
  const addKeyword = () => {
    const trimmed = kwInput.trim().replace(/,$/, "");
    if (!trimmed) return;
    const newKws = trimmed.split(/[,\n]+/).map(k => k.trim()).filter(k => k && !keywords.includes(k.toLowerCase()));
    if (newKws.length > 0) setKeywords(prev => [...prev, ...newKws.map(k => k.toLowerCase())]);
    setKwInput("");
  };
  const removeKeyword = kw => setKeywords(prev => prev.filter(k => k !== kw));
  const onKwKeyDown = e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addKeyword(); } };

  // Crawl
  const handleCrawl = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await apiFetch("/api/seo-site-crawler/ai/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site: input.trim(), keywords }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Crawl failed");
      setResult(data.result);
      fetchHistory();
      fetchAnalytics();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Import/Export
  const handleImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async evt => {
      try {
        const res = await apiFetch("/api/seo-site-crawler/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: JSON.parse(evt.target.result) }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "Import failed");
        fetchHistory();
      } catch (err) { setError(err.message); }
    };
    reader.readAsText(file);
  };
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setTimeout(() =>URL.revokeObjectURL(url), 10000);
  };

  const pages = result?.pages || [];
  const totalIssues = result?.totalIssues || 0;

  return (
    <div style={{ background: "#141414", color: "#f3f4f6", borderRadius: 18, boxShadow: "0 2px 24px #0002", padding: 36, fontFamily: "Inter, sans-serif" }}>
      <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 4 }}>SEO Site Crawler</h2>
      <div style={{ marginBottom: 20, color: "#0ea5e9", fontWeight: 600 }}>
        ️ Crawl, analyze, and fix site SEO issues with AI-powered suggestions.
      </div>

      {/* URL Input */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 6 }}>Website URL</label>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleCrawl()}
          style={{ width: "100%", fontSize: 15, padding: "10px 14px", borderRadius: 8, border: "1px solid #4a4a4a", background: "#2e2e2e", color: "#f3f4f6", boxSizing: "border-box" }}
          placeholder="https://yourstore.myshopify.com"
          aria-label="Site URL"
        />
      </div>

      {/* Keywords Input */}
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 6 }}>
          Focus Keywords <span style={{ fontWeight: 400, color: "#64748b" }}>(press Enter or comma to add)</span>
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, background: "#2e2e2e", borderRadius: 8, border: "1px solid #4a4a4a", padding: "8px 10px", minHeight: 44, alignItems: "center" }}>
          {keywords.map(kw => (
            <span key={kw} style={{ background: "#2e2e2e", color: "#7fffd4", borderRadius: 20, padding: "3px 11px 3px 12px", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              {kw}
              <button onClick={() => removeKeyword(kw)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
            </span>
          ))}
          <input
            value={kwInput}
            onChange={e => setKwInput(e.target.value)}
            onKeyDown={onKwKeyDown}
            onBlur={addKeyword}
            style={{ flex: 1, minWidth: 140, background: "none", border: "none", color: "#f3f4f6", fontSize: 13, outline: "none" }}
            placeholder={keywords.length === 0 ? "e.g. snowboard, winter sports…" : "Add another…"}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <button onClick={handleCrawl} disabled={loading || !input.trim()} style={{ background: loading ? "#4a4a4a" : "#7fffd4", color: "#141414", border: "none", borderRadius: 8, padding: "11px 26px", fontWeight: 700, fontSize: 15, cursor: loading || !input.trim() ? "not-allowed" : "pointer" }}>
          {loading ? "Crawling…" : "️ Crawl & Analyze"}
        </button>
        <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#141414", border: "none", borderRadius: 8, padding: "11px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Import</button>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} />
        <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#f3f4f6", border: "none", borderRadius: 8, padding: "11px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Export</button>
        {exported && <a href={exported} download="seo-crawler-history.json" style={{ padding: "11px 14px", color: "#0ea5e9", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>↓ Download</a>}
      </div>

      {error && <div style={{ color: "#ef4444", background: "#3f1315", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 14 }}>{error}</div>}

      {/* Results */}
      {result && (
        <div style={{ marginBottom: 24 }}>
          {/* Summary stats */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
            {[
              { label: "Pages Scanned", value: result.pagesScanned, color: "#0ea5e9" },
              { label: "Total Issues", value: totalIssues, color: "#94a3b8" },
              { label: "High", value: result.high, color: "#ef4444" },
              { label: "Medium", value: result.medium, color: "#f59e0b" },
              { label: "Low", value: result.low, color: "#22c55e" },
            ].map(s => (
              <div key={s.label} style={{ background: "#2e2e2e", borderRadius: 10, padding: "10px 18px", border: "1px solid #2e2e2e", textAlign: "center" }}>
                <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value ?? 0}</div>
              </div>
            ))}
          </div>

          {/* Per-page sections */}
          <div style={{ fontWeight: 700, fontSize: 16, color: "#7fffd4", marginBottom: 10 }}>Page-by-Page Analysis</div>
          {pages.length === 0 ? (
            <div style={{ color: "#94a3b8", fontSize: 14 }}>No pages analysed.</div>
          ) : (
            pages.map((page, i) => <PageSection key={i} page={page} keywords={keywords} />)
          )}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <div style={{ background: "#2e2e2e", borderRadius: 10, padding: "10px 18px", border: "1px solid #2e2e2e" }}>
          <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Total Crawls</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#7fffd4", marginTop: 2 }}>{history.length}</div>
        </div>
        <div style={{ background: "#2e2e2e", borderRadius: 10, padding: "10px 18px", border: "1px solid #2e2e2e" }}>
          <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Events</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#7fffd4", marginTop: 2 }}>{analytics.length}</div>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div style={{ background: "#282828", borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10, color: "#7fffd4" }}>Crawl History</div>
          {history.map(h => {
            const r = h.result || {};
            return (
              <div key={h.id} style={{ background: "#141414", borderRadius: 8, padding: "12px 16px", border: "1px solid #2e2e2e", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4, flexWrap: "wrap", gap: 4 }}>
                  <span style={{ fontWeight: 700, color: "#e2e8f0" }}>{h.site}</span>
                  <span style={{ color: "#64748b" }}>{h.createdAt ? new Date(h.createdAt).toLocaleString() : `#${h.id}`}</span>
                </div>
                {r.pagesScanned !== undefined && (
                  <div style={{ display: "flex", gap: 8, fontSize: 12, flexWrap: "wrap" }}>
                    <span style={{ color: "#0ea5e9" }}>{r.pagesScanned} pages</span>
                    <span style={{ color: "#ef4444" }}>{r.high || 0} high</span>
                    <span style={{ color: "#f59e0b" }}>{r.medium || 0} med</span>
                    <span style={{ color: "#22c55e" }}>{r.low || 0} low</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}




