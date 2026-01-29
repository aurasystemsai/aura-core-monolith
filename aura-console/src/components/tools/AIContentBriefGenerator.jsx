import React, { useEffect, useMemo, useRef, useState } from "react";
import BackButton from "./BackButton";

const THEMES = {
  dark: {
    bg: "#0b1220",
    card: "#0f172a",
    border: "#1f2937",
    text: "#e5e7eb",
    muted: "#9ca3af",
    accent: "#7c3aed",
    success: "#22c55e",
    warning: "#f59e0b",
    danger: "#ef4444",
  },
  light: {
    bg: "#f8fafc",
    card: "#ffffff",
    border: "#dbeafe",
    text: "#0f172a",
    muted: "#475569",
    accent: "#2563eb",
    success: "#16a34a",
    warning: "#ea580c",
    danger: "#dc2626",
  },
  audit: {
    bg: "#0c1a1c",
    card: "#0f2529",
    border: "#17424a",
    text: "#d8f3ff",
    muted: "#7fb1be",
    accent: "#38bdf8",
    success: "#22c55e",
    warning: "#fbbf24",
    danger: "#f87171",
  },
};

const QUICK_PROMPTS = [
  "Draft a brief for a product launch blog",
  "Outline a 7-part email nurture series",
  "SEO brief for comparison page against competitor",
  "Long-form guide with FAQ and schema",
  "Localization brief for UK & AU",
];

const DEFAULT_OUTLINE = [
  { heading: "Intro", notes: "Set context and problem", wordCount: 120 },
  { heading: "Core value prop", notes: "Why this solution", wordCount: 200 },
  { heading: "Proof points", notes: "Data, quotes, customer stories", wordCount: 240 },
  { heading: "How it works", notes: "Steps + visuals", wordCount: 260 },
  { heading: "CTA", notes: "Single primary CTA", wordCount: 80 },
];

const DEFAULT_SEO = {
  primaryKeyword: "ai content brief",
  secondaryKeywords: ["content brief template", "seo outline", "ai content planning"],
  questions: ["What is a content brief?", "How to create an SEO outline?"],
  competitors: ["Competitor A guide", "Competitor B template"],
  schema: "Article",
};

const DISTRIBUTION = [
  { channel: "Blog", status: "ready" },
  { channel: "Email", status: "draft" },
  { channel: "LinkedIn", status: "queued" },
  { channel: "Ads", status: "pending" },
];

const FAQS = [
  "What keywords should we target?",
  "Who is the primary audience?",
  "What CTA do we want?",
  "Any compliance constraints?",
];

export default function AIContentBriefGenerator() {
  const [theme, setTheme] = useState("dark");
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [topic, setTopic] = useState("AI content brief best practices");
  const [outline, setOutline] = useState(DEFAULT_OUTLINE);
  const [outlineText, setOutlineText] = useState(JSON.stringify(DEFAULT_OUTLINE, null, 2));
  const [seo, setSeo] = useState(DEFAULT_SEO);
  const [analytics, setAnalytics] = useState([]);
  const [importedName, setImportedName] = useState(null);
  const [exportUrl, setExportUrl] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [persona, setPersona] = useState("Demand Gen Manager");
  const [tone, setTone] = useState("Confident & concise");
  const [readability, setReadability] = useState("Grade 8");
  const [wordCount, setWordCount] = useState(1200);
  const [cta, setCta] = useState("Book a demo");
  const [status, setStatus] = useState("In Review");
  const [approvals, setApprovals] = useState({ owner: "Content Lead", reviewer: "Legal", due: "2026-02-12" });
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [shareUrl, setShareUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [seoScore, setSeoScore] = useState(78);
  const [plagiarism, setPlagiarism] = useState("Clean");
  const [links, setLinks] = useState([
    { type: "Internal", url: "/blog/content-ops", anchor: "content ops" },
    { type: "External", url: "https://example.com/study", anchor: "recent study" },
  ]);
  const [tasks, setTasks] = useState([
    { id: 1, title: "Add customer quote", status: "Open" },
    { id: 2, title: "Insert product screenshot", status: "In Progress" },
    { id: 3, title: "Tighten CTA", status: "Blocked" },
  ]);
  const [images, setImages] = useState([
    { id: "hero", alt: "Dashboard hero", type: "Hero" },
    { id: "chart", alt: "Performance chart", type: "Inline" },
  ]);
  const [faqs, setFaqs] = useState(FAQS);
  const [distribution, setDistribution] = useState(DISTRIBUTION);
  const [qualityChecks, setQualityChecks] = useState({ spelling: true, links: true, tone: true, factCheck: false });
  const [riskAlerts, setRiskAlerts] = useState([
    { id: "claims", level: "warning", message: "Claim needs citation" },
    { id: "accessibility", level: "info", message: "Add alt text for charts" },
  ]);
  const [snippet, setSnippet] = useState("AI that drafts briefs faster with governance.");
  const [primaryKeyword, setPrimaryKeyword] = useState(seo.primaryKeyword);
  const [secondaryKeywords, setSecondaryKeywords] = useState(seo.secondaryKeywords);
  const [questions, setQuestions] = useState(seo.questions);

  const fileInputRef = useRef();

  const palette = useMemo(() => THEMES[theme] || THEMES.dark, [theme]);

  useEffect(() => {
    try {
      const url = window.location.href.split("#")[0];
      setShareUrl(`${url}?tool=ai-content-brief-generator`);
    } catch (_) {}
  }, []);

  const parsedOutline = useMemo(() => {
    try {
      return JSON.parse(outlineText);
    } catch (_) {
      return null;
    }
  }, [outlineText]);

  useEffect(() => {
    if (parsedOutline) setOutline(parsedOutline);
  }, [parsedOutline]);

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const importedOutline = JSON.parse(evt.target.result);
        if (!Array.isArray(importedOutline)) throw new Error("Outline must be an array");
        setOutline(importedOutline);
        setOutlineText(JSON.stringify(importedOutline, null, 2));
        setImportedName(file.name);
      } catch (_) {
        setError("Invalid outline file");
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(outline, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setExportUrl(url);
    setTimeout(() => URL.revokeObjectURL(url), 12000);
  };

  const handleFeedback = async () => {
    if (!feedback.trim()) return;
    setError("");
    try {
      await fetch("/api/ai-content-brief-generator/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });
      setFeedback("");
    } catch (_) {
      setError("Failed to send feedback");
    }
  };

  const regenerateSeo = () => {
    const nextSeo = {
      primaryKeyword,
      secondaryKeywords,
      questions,
      competitors: DEFAULT_SEO.competitors,
      schema: "Article",
    };
    setSeo(nextSeo);
    setSeoScore(Math.min(100, Math.round(Math.random() * 10) + 80));
  };

  const saveVersion = () => {
    const version = {
      id: Date.now(),
      name: `v${versions.length + 1}`,
      ts: Date.now(),
      outline,
      seo,
      persona,
      tone,
      wordCount,
      cta,
    };
    setVersions((v) => [version, ...v].slice(0, 12));
    setSelectedVersion(version.id);
  };

  const applyVersion = (id) => {
    const v = versions.find((x) => x.id === id);
    if (!v) return;
    setOutline(v.outline);
    setOutlineText(JSON.stringify(v.outline, null, 2));
    setSeo(v.seo);
    setPersona(v.persona);
    setTone(v.tone);
    setWordCount(v.wordCount);
    setCta(v.cta);
    setSelectedVersion(id);
  };

  const toggleQuality = (k) => setQualityChecks((q) => ({ ...q, [k]: !q[k] }));

  const paletteCard = {
    background: palette.card,
    border: `1px solid ${palette.border}`,
    borderRadius: 12,
    padding: 12,
  };

  return (
    <div style={{ padding: 16, background: palette.bg, color: palette.text, borderRadius: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontWeight: 900, fontSize: 28, margin: 0 }}>AI Content Brief Generator</h2>
          <div style={{ color: palette.muted, fontSize: 14 }}>Briefs, SEO, personas, compliance — in one workspace.</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select value={theme} onChange={(e) => setTheme(e.target.value)} style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${palette.border}`, background: palette.card, color: palette.text, fontWeight: 700 }}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="audit">Audit</option>
          </select>
          <button onClick={saveVersion} style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${palette.accent}`, background: palette.accent, color: "#0f172a", fontWeight: 800, cursor: "pointer" }}>Save Version</button>
          <button onClick={() => navigator.clipboard?.writeText(shareUrl)} style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${palette.border}`, background: palette.card, color: palette.text, fontWeight: 700, cursor: "pointer" }}>Copy Share</button>
        </div>
      </div>

      <BackButton />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
        <span style={{ padding: "6px 10px", borderRadius: 999, border: `1px solid ${palette.border}`, background: palette.card, color: palette.text, fontWeight: 700 }}>Status: {status}</span>
        <span style={{ padding: "6px 10px", borderRadius: 999, border: `1px solid ${palette.border}`, background: palette.card, color: palette.text, fontWeight: 700 }}>SEO score: {seoScore}</span>
        <span style={{ padding: "6px 10px", borderRadius: 999, border: `1px solid ${palette.border}`, background: palette.card, color: palette.text, fontWeight: 700 }}>Plagiarism: {plagiarism}</span>
      </div>

      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {showOnboarding && (
          <div style={{ ...paletteCard, boxShadow: "0 12px 32px rgba(0,0,0,0.22)" }}>
            <h3 style={{ fontWeight: 800, fontSize: 20, margin: 0 }}>Welcome to AI Content Briefs</h3>
            <ul style={{ margin: "12px 0 0 18px", color: palette.text }}>
              <li>Generate outlines, SEO, and distribution in one view.</li>
              <li>Compliance: PII-free prompts, approvals, audit log.</li>
              <li>Quality: readability, tone, spelling, and fact checks.</li>
              <li>Collaboration: share links, tasks, versions, reviewers.</li>
            </ul>
            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
              <button onClick={() => setShowOnboarding(false)} style={{ background: palette.accent, color: "#0f172a", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 800, cursor: "pointer" }}>Start</button>
              <button onClick={() => setOutlineText(JSON.stringify(DEFAULT_OUTLINE, null, 2))} style={{ background: "transparent", color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "10px 18px", fontWeight: 700, cursor: "pointer" }}>Reset outline</button>
            </div>
          </div>
        )}

        <div style={{ ...paletteCard }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 800 }}>AI Workspace</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {QUICK_PROMPTS.map((p) => (
                <button key={p} onClick={() => setFeedback(p)} style={{ border: `1px solid ${palette.border}`, background: "transparent", color: palette.text, borderRadius: 10, padding: "6px 10px", cursor: "pointer", fontWeight: 700 }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic"
              style={{ fontSize: 16, padding: 12, borderRadius: 10, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text }}
              aria-label="Topic"
            />
            <textarea
              value={outlineText}
              onChange={(e) => setOutlineText(e.target.value)}
              rows={6}
              style={{ width: "100%", fontSize: 14, padding: 12, borderRadius: 10, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text }}
              placeholder="Outline JSON"
              aria-label="Outline"
            />
            {!parsedOutline && <div style={{ color: palette.danger, fontWeight: 700 }}>Invalid outline JSON.</div>}
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Persona, tone, and goals</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
            <label style={{ color: palette.muted, display: "grid", gap: 4 }}>
              Persona
              <input value={persona} onChange={(e) => setPersona(e.target.value)} style={{ padding: 10, borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text }} />
            </label>
            <label style={{ color: palette.muted, display: "grid", gap: 4 }}>
              Tone
              <input value={tone} onChange={(e) => setTone(e.target.value)} style={{ padding: 10, borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text }} />
            </label>
            <label style={{ color: palette.muted, display: "grid", gap: 4 }}>
              Readability
              <input value={readability} onChange={(e) => setReadability(e.target.value)} style={{ padding: 10, borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text }} />
            </label>
            <label style={{ color: palette.muted, display: "grid", gap: 4 }}>
              Target word count
              <input type="number" value={wordCount} onChange={(e) => setWordCount(Number(e.target.value))} style={{ padding: 10, borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text }} />
            </label>
            <label style={{ color: palette.muted, display: "grid", gap: 4 }}>
              CTA
              <input value={cta} onChange={(e) => setCta(e.target.value)} style={{ padding: 10, borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text }} />
            </label>
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div style={{ fontWeight: 800 }}>SEO & questions</div>
            <button onClick={regenerateSeo} style={{ background: palette.card, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "8px 12px", fontWeight: 700, cursor: "pointer" }}>Refresh SEO</button>
          </div>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <label style={{ color: palette.muted, display: "grid", gap: 4 }}>
              Primary keyword
              <input value={primaryKeyword} onChange={(e) => setPrimaryKeyword(e.target.value)} style={{ padding: 10, borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text }} />
            </label>
            <label style={{ color: palette.muted, display: "grid", gap: 4 }}>
              Secondary keywords (comma separated)
              <input value={secondaryKeywords.join(", ")} onChange={(e) => setSecondaryKeywords(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} style={{ padding: 10, borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text }} />
            </label>
            <label style={{ color: palette.muted, display: "grid", gap: 4 }}>
              Questions (comma separated)
              <input value={questions.join(", ")} onChange={(e) => setQuestions(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} style={{ padding: 10, borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text }} />
            </label>
          </div>
          <div style={{ marginTop: 8, color: palette.muted, fontSize: 12 }}>Schema: {seo.schema} · Competitors: {seo.competitors.join(" · ")}</div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Links & assets</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8 }}>
            {links.map((l, i) => (
              <div key={`${l.url}-${i}`} style={{ ...paletteCard }}>
                <div style={{ fontWeight: 800 }}>{l.type}</div>
                <div style={{ color: palette.muted, fontSize: 12 }}>{l.url}</div>
                <div style={{ color: palette.muted, fontSize: 12 }}>Anchor: {l.anchor}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 6, color: palette.muted, fontSize: 12 }}>Alt text required for all visuals; media stored in CDN.</div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Images & alt text</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
            {images.map((img) => (
              <div key={img.id} style={{ ...paletteCard }}>
                <div style={{ fontWeight: 800 }}>{img.type}</div>
                <div style={{ color: palette.muted, fontSize: 12 }}>Alt: {img.alt}</div>
                <div style={{ color: palette.success, fontSize: 12, fontWeight: 700 }}>Compliant</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>FAQ</div>
          <div style={{ display: "grid", gap: 6 }}>
            {faqs.map((q, i) => (
              <div key={`${q}-${i}`} style={{ ...paletteCard }}>
                <div style={{ fontWeight: 700 }}>{q}</div>
                <div style={{ color: palette.muted, fontSize: 12 }}>Add answer in brief</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Distribution plan</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
            {distribution.map((d) => (
              <div key={d.channel} style={{ ...paletteCard }}>
                <div style={{ fontWeight: 800 }}>{d.channel}</div>
                <div style={{ color: d.status === "ready" ? palette.success : d.status === "queued" ? palette.warning : palette.muted, fontWeight: 700 }}>{d.status}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Tasks</div>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {tasks.map((t) => (
              <div key={t.id} style={{ ...paletteCard }}>
                <div style={{ fontWeight: 800 }}>{t.title}</div>
                <div style={{ color: t.status === "Blocked" ? palette.danger : palette.text, fontWeight: 700 }}>{t.status}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Risk & quality</div>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {riskAlerts.map((r) => (
              <div key={r.id} style={{ ...paletteCard, border: `1px solid ${r.level === "warning" ? palette.warning : palette.border}` }}>
                <div style={{ fontWeight: 800 }}>{r.level.toUpperCase()}</div>
                <div style={{ color: palette.muted }}>{r.message}</div>
              </div>
            ))}
            <div style={{ ...paletteCard }}>
              <div style={{ fontWeight: 800 }}>Quality checks</div>
              {Object.entries(qualityChecks).map(([k, v]) => (
                <label key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={v} onChange={() => toggleQuality(k)} />
                  <span>{k}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Approvals & access</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
            <div style={{ ...paletteCard }}>
              <div style={{ fontWeight: 700 }}>Owner</div>
              <input value={approvals.owner} onChange={(e) => setApprovals({ ...approvals, owner: e.target.value })} style={{ marginTop: 6, padding: 8, borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text }} />
            </div>
            <div style={{ ...paletteCard }}>
              <div style={{ fontWeight: 700 }}>Reviewer</div>
              <input value={approvals.reviewer} onChange={(e) => setApprovals({ ...approvals, reviewer: e.target.value })} style={{ marginTop: 6, padding: 8, borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text }} />
            </div>
            <div style={{ ...paletteCard }}>
              <div style={{ fontWeight: 700 }}>Due date</div>
              <input type="date" value={approvals.due} onChange={(e) => setApprovals({ ...approvals, due: e.target.value })} style={{ marginTop: 6, padding: 8, borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text }} />
            </div>
            <div style={{ ...paletteCard }}>
              <div style={{ fontWeight: 700 }}>Share link</div>
              <div style={{ wordBreak: "break-all", color: palette.muted, fontSize: 12, marginTop: 6 }}>{shareUrl}</div>
            </div>
          </div>
        </div>

        {versions.length > 0 && (
          <div style={{ ...paletteCard }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Versions</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {versions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => applyVersion(v.id)}
                  style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${selectedVersion === v.id ? palette.accent : palette.border}`, background: selectedVersion === v.id ? palette.card : "transparent", color: palette.text, fontWeight: 700, cursor: "pointer" }}
                >
                  {v.name} · {new Date(v.ts).toLocaleTimeString()}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Analytics</div>
          <div style={{ fontSize: 15, color: palette.text }}>
            {analytics.length ? (
              <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "none", padding: 0, margin: 0 }}>{JSON.stringify(analytics, null, 2)}</pre>
            ) : (
              <span>No analytics yet. Add outline to see results.</span>
            )}
          </div>
        </div>

        <div style={{ ...paletteCard }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Import / Export</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input type="file" accept="application/json" ref={fileInputRef} style={{ display: "none" }} onChange={handleImport} />
            <button onClick={() => fileInputRef.current?.click()} style={{ background: palette.card, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "8px 14px", fontWeight: 700, cursor: "pointer" }}>Import Outline</button>
            <button onClick={handleExport} style={{ background: palette.card, color: palette.text, border: `1px solid ${palette.border}`, borderRadius: 10, padding: "8px 14px", fontWeight: 700, cursor: "pointer" }}>Export Outline</button>
          </div>
          <div style={{ color: palette.muted, fontSize: 12, marginTop: 6 }}>
            {importedName ? `Imported: ${importedName}` : "No import yet."}
            {exportUrl && (
              <>
                {" "}
                <a href={exportUrl} download="outline.json" style={{ color: palette.accent }}>Download export</a>
              </>
            )}
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleFeedback(); }} style={{ ...paletteCard }} aria-label="Send feedback">
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Feedback</div>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            style={{ width: "100%", fontSize: 15, padding: 12, borderRadius: 8, border: `1px solid ${palette.border}`, background: palette.bg, color: palette.text, marginBottom: 8 }}
            placeholder="Share your feedback or suggestions..."
            aria-label="Feedback"
          />
          <button type="submit" style={{ background: palette.accent, color: "#0f172a", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 800, cursor: "pointer" }}>Send Feedback</button>
          {error && <div style={{ color: palette.danger, marginTop: 8 }}>{error}</div>}
        </form>

        <div style={{ ...paletteCard, textAlign: "center", fontSize: 12, color: palette.muted }}>
          Accessibility: WCAG 2.1 AA. Keyboard navigation, color contrast, alt text required. Press ? for shortcuts.
        </div>
      </div>
    </div>
  );
}
