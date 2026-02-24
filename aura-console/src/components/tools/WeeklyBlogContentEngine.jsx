import React, { useEffect, useMemo, useState } from "react";
import BackButton from "./BackButton";
import { apiFetch, apiFetchJSON } from "../../api";
import "../../weekly-blog/WeeklyBlogContentEngine.css";

const TAB_GROUPS = {
  strategy: ["Research", "Intent", "ICP", "Questions", "SERP", "Competitors"],
  production: ["Briefs", "Outlines", "Drafts", "Assets", "Editorial QA", "Compliance"],
  seo: ["Metadata", "Schema", "Density", "Links", "Accessibility", "Page Speed"],
  distribution: ["Channels", "Email", "Social", "Partners", "Paid", "Syndication"],
  collaboration: ["Tasks", "Comments", "Reviewers", "Approvals", "Status", "Activity"],
  qa: ["Health", "SLA", "Audit Logs", "Webhooks", "Plugins", "RBAC"],
  ops: ["Analytics", "Forecast", "Benchmarks", "Snapshots", "Imports", "Exports"],
};

const PROVIDERS = [
  { id: "gpt-4", name: "OpenAI GPT-4", latency: "1.1s", strength: "reasoning" },
  { id: "claude-3", name: "Claude 3", latency: "0.9s", strength: "context" },
  { id: "gemini-pro", name: "Gemini Pro", latency: "0.8s", strength: "multimodal" },
];

const SAMPLE_CALENDAR = [
  { label: "Week 1", posts: [{ title: "Distribution Playbook", status: "ready" }, { title: "SEO Benchmarks", status: "draft" }] },
  { label: "Week 2", posts: [{ title: "Campaign QA", status: "qa" }, { title: "Partner Syndication", status: "planned" }] },
  { label: "Week 3", posts: [{ title: "Revenue Storytelling", status: "ready" }, { title: "Intent Clusters", status: "ready" }] },
];

const SAMPLE_TASKS = [
  { id: 1, title: "Add CTA variants", status: "Open" },
  { id: 2, title: "Legal review on claims", status: "Pending" },
  { id: 3, title: "Refresh internal links", status: "In Progress" },
];

const SAMPLE_BRIEF = {
  title: "Weekly blog cadence for B2B SaaS",
  primaryKeyword: "weekly blog content plan",
  personas: "Content, Demand Gen",
  compliance: "PII clean Â· claims pending",
  outline: ["Hook", "Framework", "Proof", "CTA"],
};

const SAMPLE_OUTLINE = [
  { heading: "Hook", notes: "Lead with tension", words: 120 },
  { heading: "Framework", notes: "Explain approach", words: 220 },
  { heading: "Proof", notes: "Add data + quotes", words: 180 },
  { heading: "CTA", notes: "One clear CTA", words: 80 },
];

const SAMPLE_CHANNELS = [
  { channel: "Blog", status: "ready" },
  { channel: "Email", status: "qa" },
  { channel: "LinkedIn", status: "queued" },
  { channel: "Partners", status: "draft" },
  { channel: "Ads", status: "pending" },
];

function seededRandom(seed) {
  let hash = (seed || "weekly-blog").split("").reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 42);
  return () => {
    hash = (hash * 1664525 + 1013904223) % 4294967296;
    return hash / 4294967296;
  };
}

function pick(list, rand) {
  return list[Math.floor(rand() * list.length) % list.length];
}

function buildPlan(base) {
  const topics = [
    "Scaling content velocity",
    "Distribution flywheels",
    "Revenue storytelling",
    "Data-backed SEO experiments",
    "Thought leadership ops",
  ];
  const angles = ["Playbook", "Benchmark", "Checklist", "Case study", "Retro"];
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const rand = seededRandom(`${base.brand}-${base.niche}-${base.cadence}`);
  const posts = Array.from({ length: 4 }).map((_, idx) => {
    const topic = pick(topics, rand);
    const angle = pick(angles, rand);
    const title = `${base.brand || base.niche}: ${topic} (${angle})`;
    const meta = `${title} â€” practical steps, benchmarks, and metrics for ${base.audience}.`.slice(0, 150);
    return {
      title,
      metaDescription: meta,
      slug: title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-"),
      primaryKeyword: `${base.niche || base.brand} ${angle}`.toLowerCase(),
      angle,
      suggestedDate: `${days[idx % days.length]}, Week ${base.weekNumber}`,
    };
  });

  return {
    summary: `Weekly plan for ${base.brand || base.niche || "the program"}: ${base.themes}. Tone: ${base.tone}. Market: ${base.market}.`,
    posts,
  };
}

export default function WeeklyBlogContentEngine() {
  const [brand, setBrand] = useState("AURA Commerce");
  const [niche, setNiche] = useState("B2B SaaS content");
  const [audience, setAudience] = useState("Content & Growth");
  const [cadence, setCadence] = useState("Weekly");
  const [themes, setThemes] = useState("SEO + distribution");
  const [tone, setTone] = useState("Confident, concise");
  const [weekNumber, setWeekNumber] = useState(1);
  const [stats, setStats] = useState(null);
  const [aiRun, setAiRun] = useState(null);
  const [error, setError] = useState("");

  const plan = useMemo(
    () => buildPlan({ brand, niche, audience, cadence, themes, tone, market: "Worldwide", weekNumber }),
    [audience, brand, cadence, niche, themes, tone, weekNumber]
  );

  const readiness = useMemo(() => {
    const ready = SAMPLE_CALENDAR.reduce((acc, w) => acc + (w.posts || []).filter((p) => p.status === "ready").length, 0);
    const total = SAMPLE_CALENDAR.reduce((acc, w) => acc + (w.posts || []).length, 0);
    return total ? Math.round((ready / total) * 100) : 0;
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await apiFetchJSON("/api/weekly-blog-content-engine/stats");
        const data = res;
        if (data?.ok) setStats(data.stats);
      } catch (err) {
        setError(err.message);
      }
    };
    loadStats();
  }, []);

  const orchestrateRun = async () => {
    setError("");
    try {
      const res = await apiFetchJSON("/api/weekly-blog-content-engine/ai/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy: "best-of-n", posts: 4, primaryKeyword: plan.posts[0]?.primaryKeyword }),
      });
      const data = res;
      if (!data?.success) throw new Error(data?.error || "Failed to run AI orchestrator");
      setAiRun(data.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const ensembleRun = async () => {
    setError("");
    try {
      const res = await apiFetchJSON("/api/weekly-blog-content-engine/ai/ensemble", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts: 4, primaryKeyword: plan.posts[0]?.primaryKeyword }),
      });
      const data = res;
      if (!data?.success) throw new Error(data?.error || "Failed to run ensemble");
      setAiRun(data.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const outlineScore = useMemo(() => {
    const depth = Math.min(100, Math.round(SAMPLE_OUTLINE.reduce((acc, s) => acc + s.words, 0) / 18));
    const coverage = Math.min(100, SAMPLE_OUTLINE.length * 12 + 40);
    const score = Math.round(depth * 0.45 + coverage * 0.35 + 82 * 0.2);
    return { score, grade: score >= 90 ? "A" : score >= 80 ? "B" : "C" };
  }, []);

  const metadataScore = useMemo(() => {
    const titles = plan.posts.map((p) => p.title.length);
    const metas = plan.posts.map((p) => p.metaDescription.length);
    const avg = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);
    const titleScore = titles.length ? Math.max(70, 100 - Math.abs(52 - avg(titles))) : 80;
    const metaScore = metas.length ? Math.max(70, 100 - Math.abs(145 - avg(metas))) : 80;
    return Math.round(titleScore * 0.55 + metaScore * 0.45);
  }, [plan.posts]);

  return (
    <div className="wbe-shell">
      <div className="wbe-header">
        <div>
          <h2>Weekly Blog Content Engine</h2>
          <div className="wbe-subtitle">Research â†’ Calendar â†’ Briefs â†’ Outlines â†’ SEO â†’ Distribution â†’ Collaboration â†’ Performance</div>
        </div>
        <div className="wbe-actions">
          <BackButton />
          <button className="wbe-btn" onClick={orchestrateRun}>Route best-of-n</button>
          <button className="wbe-btn" onClick={ensembleRun}>Ensemble</button>
          <button className="wbe-btn primary" onClick={() => setWeekNumber((n) => n + 1)}>Next week</button>
        </div>
      </div>

      <div className="wbe-badges">
        <span className="wbe-pill success">Readiness: {readiness}%</span>
        <span className="wbe-pill warning">Metadata: {metadataScore}</span>
        <span className="wbe-pill info">Outline: {outlineScore.grade}</span>
        <span className="wbe-pill">Posts: {plan.posts.length}</span>
        {stats && <span className="wbe-pill muted">Runs: {stats.ai?.totalRuns || 0}</span>}
      </div>

      <div className="wbe-tabs">
        {Object.entries(TAB_GROUPS).map(([group, items]) => (
          <div key={group} className="wbe-tab-group">
            <h4>{group.toUpperCase()}</h4>
            <div className="wbe-tab-list">
              {items.map((item) => (
                <div key={item} className="wbe-tab-chip">
                  <span>{item}</span>
                  <span>â†—</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && <div className="wbe-error">{error}</div>}

      <div className="wbe-grid two-column">
        <div className="wbe-card">
          <h3>Research & Intent</h3>
          <div className="wbe-inputs">
            <label>Brand<input value={brand} onChange={(e) => setBrand(e.target.value)} /></label>
            <label>Niche<input value={niche} onChange={(e) => setNiche(e.target.value)} /></label>
            <label>Audience<input value={audience} onChange={(e) => setAudience(e.target.value)} /></label>
          </div>
          <div className="wbe-list">
            <div className="wbe-list-item"><strong>Intent</strong><span>Informational Â· Benchmarks</span></div>
            <div className="wbe-list-item"><strong>ICP</strong><span>{audience}</span></div>
            <div className="wbe-list-item"><strong>Cadence</strong><span>{cadence}</span></div>
          </div>
          <button className="wbe-btn secondary" onClick={() => setCadence(cadence === "Weekly" ? "Bi-weekly" : "Weekly")}>Toggle cadence</button>
        </div>

        <div className="wbe-card">
          <h3>Weekly Calendar</h3>
          <div className="wbe-status-grid">
            {SAMPLE_CALENDAR.map((week) => (
              <div key={week.label} className="wbe-status-card">
                <div className="wbe-meta-row"><strong>{week.label}</strong><span className="wbe-tag">{week.posts.length} posts</span></div>
                {week.posts.map((p) => (
                  <div key={p.title} className="wbe-tag" style={{ marginTop: 6 }}>{p.title} Â· {p.status}</div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="wbe-card">
          <h3>Brief & Compliance</h3>
          <div className="wbe-list">
            <div className="wbe-list-item"><strong>Title</strong><span>{SAMPLE_BRIEF.title}</span></div>
            <div className="wbe-list-item"><strong>Keyword</strong><span>{SAMPLE_BRIEF.primaryKeyword}</span></div>
            <div className="wbe-list-item"><strong>Personas</strong><span>{SAMPLE_BRIEF.personas}</span></div>
            <div className="wbe-list-item"><strong>Compliance</strong><span>{SAMPLE_BRIEF.compliance}</span></div>
          </div>
          <div className="wbe-outline-chips">
            {SAMPLE_BRIEF.outline.map((o) => (<span key={o} className="wbe-chip">{o}</span>))}
          </div>
        </div>

        <div className="wbe-card">
          <h3>Outline & Quality</h3>
          <div className="wbe-list">
            {SAMPLE_OUTLINE.map((s) => (
              <div key={s.heading} className="wbe-list-item">
                <strong>{s.heading}</strong>
                <span>{s.notes} Â· {s.words} words</span>
              </div>
            ))}
          </div>
          <div className="wbe-metrics">
            <div className="metric-pill"><span>Sections</span>{SAMPLE_OUTLINE.length}</div>
            <div className="metric-pill"><span>Score</span>{outlineScore.score}</div>
            <div className="metric-pill"><span>Grade</span>{outlineScore.grade}</div>
          </div>
        </div>

        <div className="wbe-card">
          <h3>SEO Optimizer</h3>
          <div className="wbe-metrics">
            <div className="metric-pill"><span>Metadata</span>{metadataScore}</div>
            <div className="metric-pill"><span>Schema</span>Article Â· FAQ</div>
            <div className="metric-pill"><span>Density</span>Optimal</div>
            <div className="metric-pill"><span>Links</span>Internal 12</div>
          </div>
          <div className="wbe-list">
            {plan.posts.map((p) => (
              <div key={p.slug} className="wbe-list-item">
                <strong>{p.title}</strong>
                <span>{p.metaDescription}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="wbe-card">
          <h3>Distribution & Channels</h3>
          <div className="wbe-meta-row">
            <span className="wbe-tag">Channels: {SAMPLE_CHANNELS.length}</span>
            <span className="wbe-tag">Ready: {SAMPLE_CHANNELS.filter((c) => c.status === "ready").length}</span>
            <span className="wbe-tag">Week {weekNumber}</span>
          </div>
          <div className="wbe-list">
            {SAMPLE_CHANNELS.map((c) => (
              <div key={c.channel} className="wbe-list-item">
                <strong>{c.channel}</strong>
                <span>Status: {c.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="wbe-card">
          <h3>Collaboration</h3>
          <div className="wbe-tasks">
            {SAMPLE_TASKS.map((t) => (
              <div key={t.id} className="wbe-task">
                <span>{t.title}</span>
                <span className="wbe-tag">{t.status}</span>
              </div>
            ))}
          </div>
          <div className="wbe-activity">Reviewers: Content Lead Â· Legal Â· Social Â· Growth</div>
        </div>

        <div className="wbe-card">
          <h3>Performance & AI</h3>
          <div className="wbe-metrics">
            <div className="metric-pill"><span>Views (30d)</span>12.4k</div>
            <div className="metric-pill"><span>Engagement</span>44%</div>
            <div className="metric-pill"><span>Conversions</span>9.1%</div>
            <div className="metric-pill"><span>Forecast</span>+24%</div>
          </div>
          <div className="wbe-list">
            {PROVIDERS.map((p) => (
              <div key={p.id} className={`wbe-list-item ${aiRun?.route?.includes(p.id) ? "active" : ""}`}>
                <strong>{p.name}</strong>
                <span>Latency: {p.latency} Â· Strength: {p.strength}</span>
              </div>
            ))}
          </div>
          {aiRun && <div className="wbe-activity">Last run {aiRun.strategy} Â· Quality {aiRun.qualityScore}</div>}
        </div>
      </div>
    </div>
  );
}
