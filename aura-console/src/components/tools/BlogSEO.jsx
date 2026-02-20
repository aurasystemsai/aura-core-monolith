﻿import React, { useMemo, useRef, useState } from "react";
import BackButton from "./BackButton";
import "../../blog-seo/BlogSEOEngine.css";

const TAB_GROUPS = {
  manage: ["Research", "Intent", "Briefs", "Outlines", "Tasks", "Versions"],
  optimize: ["Keywords", "Metadata", "SERP", "Schema", "Readability", "Snippets"],
  advanced: ["AI Routing", "Ensembles", "Providers", "Guardrails", "Experiments", "A/B"],
  tools: ["Templates", "Imports", "Exports", "Assets", "Widgets", "Migration"],
  monitoring: ["Health", "SLA", "Audits", "Performance", "Alerts", "APM"],
  settings: ["API Keys", "Brand", "Roles", "Compliance", "Integrations", "Backups"],
  "world-class": ["Collaboration", "Security", "Analytics", "BI", "SDK", "White-label"],
};

const DEFAULT_OUTLINE = [
  { heading: "Introduction", notes: "Set the context", wordCount: 140 },
  { heading: "Intent & ICP", notes: "Who and why", wordCount: 180 },
  { heading: "Keyword Strategy", notes: "Clusters and SERP", wordCount: 240 },
  { heading: "On-page Checklist", notes: "Metadata, schema, links", wordCount: 220 },
  { heading: "Distribution", notes: "Channels and timing", wordCount: 180 },
  { heading: "Measurement", notes: "KPIs and next steps", wordCount: 160 },
];

const PROVIDERS = [
  { id: "gpt-4", name: "OpenAI GPT-4", latency: "1.1s", strength: "reasoning" },
  { id: "claude-3", name: "Claude 3", latency: "0.9s", strength: "context" },
  { id: "gemini-pro", name: "Gemini Pro", latency: "0.8s", strength: "multimodal" },
];

export default function BlogSEO() {
  const [topic, setTopic] = useState("Enterprise blog SEO strategy");
  const [primaryKeyword, setPrimaryKeyword] = useState("blog seo");
  const [secondaryKeywords, setSecondaryKeywords] = useState(["seo checklist", "keyword clusters", "internal links"]);
  const [metaTitle, setMetaTitle] = useState("Ultimate Blog SEO Guide for B2B");
  const [metaDescription, setMetaDescription] = useState(
    "Optimize your blog program with research, keyword clusters, on-page audits, internal links, and AI routing."
  );
  const [outline, setOutline] = useState(DEFAULT_OUTLINE);
  const [outlineDraft, setOutlineDraft] = useState(JSON.stringify(DEFAULT_OUTLINE, null, 2));
  const [clusters, setClusters] = useState([
    { name: "Intent: informational", keyword: "blog seo", difficulty: 54, volume: 2400 },
    { name: "How-to", keyword: "blog seo checklist", difficulty: 48, volume: 1800 },
    { name: "Tools", keyword: "blog seo tools", difficulty: 52, volume: 1300 },
  ]);
  const [tasks, setTasks] = useState([
    { id: 1, title: "Add FAQ rich results", status: "Open" },
    { id: 2, title: "Refresh internal links", status: "In Progress" },
    { id: 3, title: "Legal review of claims", status: "Pending" },
  ]);
  const [notes, setNotes] = useState([
    { id: "note-1", text: "SERP intent verified (informational)", ts: "09:12" },
    { id: "note-2", text: "Metadata score recalculated", ts: "09:24" },
    { id: "note-3", text: "Distribution plan updated", ts: "09:41" },
  ]);
  const [selectedProvider, setSelectedProvider] = useState("gpt-4");
  const [readiness, setReadiness] = useState(68);
  const [activeTab, setActiveTab] = useState(null);
  const fileInputRef = useRef();

  const intentScore = useMemo(() => 88 + Math.round(Math.random() * 4), [topic, primaryKeyword]);
  const metadataScore = useMemo(() => {
    const tLen = metaTitle.length;
    const dLen = metaDescription.length;
    const titleScore = tLen >= 45 && tLen <= 60 ? 100 : Math.max(50, 100 - Math.abs(52 - tLen));
    const descScore = dLen >= 130 && dLen <= 160 ? 100 : Math.max(50, 100 - Math.abs(145 - dLen));
    return Math.round(titleScore * 0.55 + descScore * 0.45);
  }, [metaTitle, metaDescription]);

  const outlineGrade = useMemo(() => {
    const completeness = Math.min(100, outline.length * 12 + 40);
    const depth = Math.min(100, Math.round(outline.reduce((acc, s) => acc + (s.wordCount || 0), 0) / 18));
    const score = Math.round(completeness * 0.45 + depth * 0.55);
    return { score, grade: score >= 90 ? "A" : score >= 80 ? "B" : "C" };
  }, [outline]);

  const handleOutlineDraft = (value) => {
    setOutlineDraft(value);
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) setOutline(parsed);
    } catch (_) {
      // allow typing errors silently
    }
  };

  const handleImportOutline = (evt) => {
    const file = evt.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        setOutline(parsed);
        setOutlineDraft(JSON.stringify(parsed, null, 2));
      } catch (_) {
        setNotes((prev) => [{ id: `note-${Date.now()}`, text: "Invalid outline JSON", ts: "now" }, ...prev]);
      }
    };
    reader.readAsText(file);
  };

  const addCluster = () => {
    const name = `Intent: ${primaryKeyword}`;
    setClusters((prev) => [{ name, keyword: primaryKeyword, difficulty: 50, volume: 1600 }, ...prev].slice(0, 5));
  };

  const addTask = () => {
    setTasks((prev) => [{ id: Date.now(), title: "Add case study link", status: "Open" }, ...prev]);
  };

  const logNote = (text) => {
    setNotes((prev) => [{ id: `note-${Date.now()}`, text, ts: "now" }, ...prev].slice(0, 8));
  };

  return (
    <div className="blogseo-shell">
      <div className="blogseo-header">
        <div>
          <h2>Blog SEO Engine</h2>
          <div className="blogseo-subtitle">Research → Clusters → On-page → Internal Links → AI Routing → Performance</div>
        </div>
        <div className="blogseo-actions">
          <BackButton />
          <button className="blogseo-btn" onClick={() => fileInputRef.current?.click()}>Import outline</button>
          <button className="blogseo-btn" onClick={() => logNote("Outline exported")}>Export outline</button>
          <button className="blogseo-btn primary" onClick={() => logNote("Version saved")}>Save version</button>
        </div>
      </div>

      <div className="blogseo-badges">
        <span className="blogseo-pill success">Intent: {intentScore}</span>
        <span className="blogseo-pill warning">Metadata: {metadataScore}</span>
        <span className="blogseo-pill">Outline: {outlineGrade.grade}</span>
        <span className="blogseo-pill info">Readiness: {readiness}%</span>
      </div>

      <div className="blogseo-tabs">
        {Object.entries(TAB_GROUPS).map(([group, items]) => (
          <div key={group} className="blogseo-tab-group">
            <h4>{group.toUpperCase()}</h4>
            <div className="blogseo-tab-list">
              {items.map((item) => (
                <div
                  key={item}
                  className={`blogseo-tab-chip${activeTab === item ? " blogseo-tab-chip--active" : ""}`}
                  onClick={() => setActiveTab(activeTab === item ? null : item)}
                  style={{ cursor: "pointer", opacity: activeTab && activeTab !== item ? 0.6 : 1 }}
                >
                  <span>{item}</span>
                  <span>{activeTab === item ? "" : "↗"}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {activeTab && (
        <div style={{ background: "#222535", borderRadius: 10, padding: "14px 18px", marginBottom: 20, border: "1px solid #222535", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: "#6366f1", fontWeight: 700, fontSize: 14 }}>Active: {activeTab}</span>
          <button onClick={() => setActiveTab(null)} style={{ background: "transparent", border: "1px solid #454860", borderRadius: 6, padding: "4px 12px", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>Close </button>
        </div>
      )}

      <div className="blogseo-grid two-column">
        <div className="blogseo-card">
          <h3>Research & Intent</h3>
          <div className="blogseo-inputs">
            <label>Topic<input value={topic} onChange={(e) => setTopic(e.target.value)} /></label>
            <label>Primary keyword<input value={primaryKeyword} onChange={(e) => setPrimaryKeyword(e.target.value)} /></label>
            <label>Secondary keywords<input value={secondaryKeywords.join(", ")} onChange={(e) => setSecondaryKeywords(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} /></label>
          </div>
          <div className="blogseo-list">
            <div className="blogseo-list-item"><strong>Intent</strong><span>Informational</span></div>
            <div className="blogseo-list-item"><strong>ICP</strong><span>B2B SaaS · Content</span></div>
            <div className="blogseo-list-item"><strong>Objections</strong><span>Proof, ROI, time-to-value</span></div>
          </div>
        </div>

        <div className="blogseo-card">
          <h3>Keyword Clusters</h3>
          <div className="blogseo-meta-row">
            <span className="blogseo-tag">Clusters: {clusters.length}</span>
            <span className="blogseo-tag">Primary: {primaryKeyword}</span>
            <span className="blogseo-tag">Volume: 4.9k</span>
          </div>
          <div className="blogseo-list">
            {clusters.map((c) => (
              <div key={c.keyword} className="blogseo-list-item">
                <strong>{c.name}</strong>
                <span>KW: {c.keyword} · Diff: {c.difficulty} · Vol: {c.volume}</span>
              </div>
            ))}
          </div>
          <div className="blogseo-actions" style={{ marginTop: 8 }}>
            <button className="blogseo-btn" onClick={addCluster}>Add cluster</button>
            <button className="blogseo-btn" onClick={() => setReadiness((r) =>Math.min(100, r + 4))}>Mark coverage ↑</button>
          </div>
        </div>

        <div className="blogseo-card">
          <h3>Metadata</h3>
          <div className="blogseo-inputs">
            <label>Meta title<input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} /></label>
            <label>Meta description<textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} rows={3} /></label>
          </div>
          <div className="blogseo-metrics">
            <div className="metric-pill"><span>Title</span>{metaTitle.length} chars</div>
            <div className="metric-pill"><span>Description</span>{metaDescription.length} chars</div>
            <div className="metric-pill"><span>Score</span>{metadataScore}</div>
          </div>
        </div>

        <div className="blogseo-card">
          <h3>Outline</h3>
          <textarea
            className="blogseo-textarea"
            value={outlineDraft}
            onChange={(e) => handleOutlineDraft(e.target.value)}
          />
          <div className="blogseo-metrics">
            <div className="metric-pill"><span>Sections</span>{outline.length}</div>
            <div className="metric-pill"><span>Grade</span>{outlineGrade.grade}</div>
            <div className="metric-pill"><span>Score</span>{outlineGrade.score}</div>
          </div>
        </div>

        <div className="blogseo-card">
          <h3>On-page & Schema</h3>
          <div className="blogseo-list">
            <div className="blogseo-list-item"><strong>Schema</strong><span>Article · FAQ</span></div>
            <div className="blogseo-list-item"><strong>Core Web Vitals</strong><span>Performance 92 · CLS 0.04</span></div>
            <div className="blogseo-list-item"><strong>Links</strong><span>Internal 8 · External 4</span></div>
          </div>
          <div className="blogseo-actions" style={{ marginTop: 10 }}>
            <button className="blogseo-btn" onClick={() => logNote("Schema validated")}>Validate schema</button>
            <button className="blogseo-btn" onClick={() => logNote("Page speed audit queued")}>Run audit</button>
          </div>
        </div>

        <div className="blogseo-card">
          <h3>Internal Links</h3>
          <div className="blogseo-status-grid">
            {["Guide", "Checklist", "Tools"].map((label, idx) => (
              <div key={label} className="blogseo-status-card">
                <div className="blogseo-meta-row" style={{ justifyContent: "space-between" }}>
                  <strong>{label}</strong>
                  <span className="blogseo-tag">Sprint {idx + 1}</span>
                </div>
                <div className="blogseo-tag">Status: {idx === 0 ? "Ready" : idx === 1 ? "QA" : "Planned"}</div>
                <div className="blogseo-progress"><span style={{ width: `${70 + idx * 10}%` }} /></div>
                <div className="blogseo-activity">Approve links →</div>
              </div>
            ))}
          </div>
          <div className="blogseo-actions" style={{ marginTop: 8 }}>
            <button className="blogseo-btn" onClick={() => setReadiness((r) =>Math.min(100, r + 6))}>Approve sprint</button>
            <button className="blogseo-btn" onClick={() => logNote("New linking sprint created")}>New sprint</button>
          </div>
        </div>

        <div className="blogseo-card">
          <h3>Performance</h3>
          <div className="blogseo-metrics">
            <div className="metric-pill"><span>Views (30d)</span>12.4k</div>
            <div className="metric-pill"><span>Engagement</span>44%</div>
            <div className="metric-pill"><span>Conversions</span>9.1%</div>
            <div className="metric-pill"><span>Forecast</span>+24%</div>
          </div>
          <div className="blogseo-activity">Forecast updates once readiness passes 80% and metadata is green.</div>
        </div>

        <div className="blogseo-card">
          <h3>AI Orchestration</h3>
          <div className="blogseo-list">
            {PROVIDERS.map((p) => (
              <div key={p.id} className={`blogseo-list-item ${selectedProvider === p.id ? "active" : ""}`}>
                <strong>{p.name}</strong>
                <span>Latency: {p.latency} · Strength: {p.strength}</span>
              </div>
            ))}
          </div>
          <div className="blogseo-actions" style={{ marginTop: 10 }}>
            <button className="blogseo-btn primary" onClick={() => setSelectedProvider("claude-3")}>Route best quality</button>
            <button className="blogseo-btn" onClick={() => logNote("Ensemble run queued")}>Ensemble</button>
          </div>
        </div>

        <div className="blogseo-card">
          <h3>Activity & Notes</h3>
          <div className="blogseo-list">
            {notes.map((n) => (
              <div key={n.id} className="blogseo-list-item">
                <strong>{n.text}</strong>
                <span>{n.ts}</span>
              </div>
            ))}
          </div>
          <div className="blogseo-actions" style={{ marginTop: 10 }}>
            <button className="blogseo-btn" onClick={addTask}>Add task</button>
            <button className="blogseo-btn" onClick={() => logNote("Audit logged")}>Log audit</button>
          </div>
          <div className="blogseo-tasks">
            {tasks.map((t) => (
              <div key={t.id} className="blogseo-task">
                <span>{t.title}</span>
                <span className="blogseo-tag">{t.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <input type="file" accept="application/json" ref={fileInputRef} style={{ display: "none" }} onChange={handleImportOutline} />
    </div>
  );
}



