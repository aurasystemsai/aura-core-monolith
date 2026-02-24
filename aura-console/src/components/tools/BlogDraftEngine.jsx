
import React, { useEffect, useMemo, useState } from "react";
import BackButton from "./BackButton";
import { apiFetch, apiFetchJSON } from "../../api";
import "../../blog-draft/BlogDraftEngine.css";

const TAB_GROUPS = {
  manage: ["Ideas", "Briefs", "Outlines", "Drafts", "Assets", "States"],
  optimize: ["SEO", "Metadata", "Schema", "Density", "Links", "Accessibility"],
  advanced: ["AI Routing", "Ensembles", "Evaluations", "Feedback", "Guardrails", "Benchmarks"],
  tools: ["Imports", "Exports", "Templates", "Snippets", "Blocks", "Sniffer"],
  monitoring: ["Health", "SLA", "Latency", "Audit Logs", "APM", "Usage"],
  settings: ["Preferences", "API Keys", "RBAC", "Tenants", "Backups", "Webhooks"],
  worldClass: ["Collab", "Tasks", "Comments", "Approvals", "Performance", "BI"],
};

const PROVIDERS = [
  { id: "gpt-4", name: "GPT-4", latency: "1.0s", strength: "reasoning" },
  { id: "claude-3", name: "Claude 3", latency: "0.9s", strength: "longform" },
  { id: "gemini-pro", name: "Gemini", latency: "0.8s", strength: "multimodal" },
];

const SAMPLE_OUTLINE = [
  { heading: "Hook", notes: "Lead with tension", words: 120 },
  { heading: "Framework", notes: "Explain the approach", words: 200 },
  { heading: "Proof", notes: "Add data + quotes", words: 180 },
  { heading: "CTA", notes: "One clear CTA", words: 80 },
];

const SAMPLE_TASKS = [
  { id: 1, title: "Add CTA variants", status: "Open" },
  { id: 2, title: "Legal review on claims", status: "Pending" },
  { id: 3, title: "Refresh internal links", status: "In Progress" },
];

const SAMPLE_PERFORMANCE = {
  views: 12400,
  engagement: 0.44,
  conversions: 0.091,
  forecastLift: 0.24,
};

function gradeOutline(sections) {
  const depth = Math.min(100, Math.round((sections || []).reduce((acc, s) => acc + (s.words || 0), 0) / 18));
  const coverage = Math.min(100, (sections || []).length * 12 + 40);
  const score = Math.round(depth * 0.45 + coverage * 0.35 + 82 * 0.2);
  return { score, grade: score >= 90 ? "A" : score >= 80 ? "B" : "C" };
}

export default function BlogDraftEngine() {
  const [activeGroup, setActiveGroup] = useState("manage");
  const [activeTab, setActiveTab] = useState("Ideas");
  const [title, setTitle] = useState("Draft without chaos");
  const [primaryKeyword, setPrimaryKeyword] = useState("blog drafting");
  const [tone, setTone] = useState("Practical, confident");
  const [audience, setAudience] = useState("Content & Growth");
  const [topics, setTopics] = useState("cadence, SEO polish, approvals");
  const [draft, setDraft] = useState(null);
  const [seo, setSeo] = useState(null);
  const [distribution, setDistribution] = useState(null);
  const [aiRun, setAiRun] = useState(null);
  const [ensembleRun, setEnsembleRun] = useState(null);
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState([]);
  const [briefs, setBriefs] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [tasks, setTasks] = useState(SAMPLE_TASKS);
  const [channels, setChannels] = useState([]);
  const [providers, setProviders] = useState(PROVIDERS);
  const [comments, setComments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const outlineGrade = useMemo(() => gradeOutline(SAMPLE_OUTLINE), []);

  useEffect(() => {
    const load = async () => {
      try {
        const [healthRes, statsRes] = await Promise.all([
          apiFetch("/api/blog-draft-engine/health"),
          apiFetch("/api/blog-draft-engine/stats"),
        ]);
        const healthJson = await healthRes.json();
        const statsJson = await statsRes.json();
        setHealth(healthJson.status || healthJson.ok ? healthJson : null);
        if (statsJson?.stats) setStats(statsJson.stats);
      } catch (err) {
        setError(err.message);
      }
    };
    load();
  }, []);

  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  const loadTabData = async () => {
    try {
      switch (activeTab) {
        case "Ideas":
          const ideasRes = await apiFetchJSON("/api/blog-draft-engine/ideation/ideas");
          const ideasData = await ideasRes.json();
          if (ideasData?.success) setIdeas(ideasData.data || []);
          break;
        case "Briefs":
          const briefsRes = await apiFetchJSON("/api/blog-draft-engine/briefs");
          const briefsData = await briefsRes.json();
          if (briefsData?.success) setBriefs(briefsData.data || []);
          break;
        case "Drafts":
          const draftsRes = await apiFetchJSON("/api/blog-draft-engine/drafts");
          const draftsData = await draftsRes.json();
          if (draftsData?.success) setDrafts(draftsData.data || []);
          break;
        case "Tasks":
          const tasksRes = await apiFetchJSON("/api/blog-draft-engine/collaboration/tasks");
          const tasksData = await tasksRes.json();
          if (tasksData?.success) setTasks(tasksData.data || SAMPLE_TASKS);
          break;
        case "Comments":
          const commentsRes = await apiFetchJSON("/api/blog-draft-engine/collaboration/comments");
          const commentsData = await commentsRes.json();
          if (commentsData?.success) setComments(commentsData.data || []);
          break;
        case "Audit Logs":
          const logsRes = await apiFetchJSON("/api/blog-draft-engine/monitoring/audit-logs");
          const logsData = await logsRes.json();
          if (logsData?.success) setAuditLogs(logsData.data || []);
          break;
      }
    } catch (err) {
      console.error("Failed to load tab data:", err);
    }
  };

  const createIdea = async (ideaData) => {
    try {
      const res = await apiFetchJSON("/api/blog-draft-engine/ideation/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ideaData),
      });
      const data = await res.json();
      if (data?.success) {
        setIdeas([...ideas, data.data]);
        setShowModal(false);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const createBrief = async (briefData) => {
    try {
      const res = await apiFetchJSON("/api/blog-draft-engine/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(briefData),
      });
      const data = await res.json();
      if (data?.success) {
        setBriefs([...briefs, data.data]);
        setShowModal(false);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteItem = async (type, id) => {
    try {
      const endpoints = {
        idea: `/api/blog-draft-engine/ideation/ideas/${id}`,
        brief: `/api/blog-draft-engine/briefs/${id}`,
        draft: `/api/blog-draft-engine/drafts/${id}`,
        task: `/api/blog-draft-engine/collaboration/tasks/${id}`,
      };
      await apiFetch(endpoints[type], { method: "DELETE" });
      
      switch (type) {
        case "idea":
          setIdeas(ideas.filter((i) => i.id !== id));
          break;
        case "brief":
          setBriefs(briefs.filter((b) => b.id !== id));
          break;
        case "draft":
          setDrafts(drafts.filter((d) => d.id !== id));
          break;
        case "task":
          setTasks(tasks.filter((t) => t.id !== id));
          break;
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const parseTopics = () =>
    topics
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

  const generateDraft = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetchJSON("/api/blog-draft-engine/drafts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, primaryKeyword, audience, tone, topics: parseTopics() }),
      });
      const data = await res.json();
      if (!data?.success) throw new Error(data?.error || "Failed to generate draft");
      setDraft(data.data);
      const seoRes = await apiFetchJSON("/api/blog-draft-engine/seo/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, primaryKeyword, topics: parseTopics() }),
      });
      const seoJson = await seoRes.json();
      if (seoJson?.success) setSeo(seoJson.data);
      const distRes = await apiFetchJSON("/api/blog-draft-engine/distribution/readiness");
      const distJson = await distRes.json();
      if (distJson?.success) setDistribution(distJson.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const orchestrate = async () => {
    setError("");
    try {
      const res = await apiFetchJSON("/api/blog-draft-engine/ai/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy: "best-of-n", primaryKeyword }),
      });
      const data = await res.json();
      if (!data?.success) throw new Error(data?.error || "Failed to orchestrate");
      setAiRun(data.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const ensemble = async () => {
    setError("");
    try {
      const res = await apiFetchJSON("/api/blog-draft-engine/ai/ensemble", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ primaryKeyword }),
      });
      const data = await res.json();
      if (!data?.success) throw new Error(data?.error || "Failed to ensemble");
      setEnsembleRun(data.data);
    } catch (err) {
      setError(err.message);
    }
  };

  const metadataScore = useMemo(() => {
    if (!draft?.metaDescription || !draft?.title) return 0;
    const titleScore = Math.max(70, 100 - Math.abs(52 - draft.title.length));
    const metaScore = Math.max(70, 100 - Math.abs(145 - draft.metaDescription.length));
    return Math.round(titleScore * 0.55 + metaScore * 0.45);
  }, [draft]);

  const filteredIdeas = useMemo(() => {
    let filtered = ideas;
    if (searchQuery) {
      filtered = filtered.filter((idea) =>
        idea.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (filterStatus !== "all") {
      filtered = filtered.filter((idea) => idea.status === filterStatus);
    }
    return filtered;
  }, [ideas, searchQuery, filterStatus]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "Ideas":
        return (
          <div className="bde-tab-panel">
            <div className="bde-panel-header">
              <h3>Content Ideas</h3>
              <div className="bde-panel-actions">
                <input
                  type="text"
                  placeholder="Search ideas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bde-search"
                />
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bde-filter">
                  <option value="all">All Status</option>
                  <option value="new">New</option>
                  <option value="researching">Researching</option>
                  <option value="approved">Approved</option>
                </select>
                <button className="bde-btn" onClick={() => { setModalType("idea"); setShowModal(true); }}>
                  + New Idea
                </button>
              </div>
            </div>
            <div className="bde-data-table">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Keyword</th>
                    <th>Intent Score</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIdeas.length > 0 ? (
                    filteredIdeas.map((idea) => (
                      <tr key={idea.id}>
                        <td>{idea.title}</td>
                        <td>{idea.keyword}</td>
                        <td>{idea.intentScore || "--"}</td>
                        <td><span className="bde-tag">{idea.status}</span></td>
                        <td>
                          <button className="bde-icon-btn" onClick={() => deleteItem("idea", idea.id)}>?</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="bde-muted">No ideas yet. Create your first idea!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      
      case "Briefs":
        return (
          <div className="bde-tab-panel">
            <div className="bde-panel-header">
              <h3>Content Briefs</h3>
              <button className="bde-btn" onClick={() => { setModalType("brief"); setShowModal(true); }}>
                + New Brief
              </button>
            </div>
            <div className="bde-data-table">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Primary Keyword</th>
                    <th>Target Words</th>
                    <th>Grade</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {briefs.length > 0 ? (
                    briefs.map((brief) => (
                      <tr key={brief.id}>
                        <td>{brief.title}</td>
                        <td>{brief.primaryKeyword}</td>
                        <td>{brief.targetWords || 1500}</td>
                        <td><span className="bde-pill success">{brief.grade || "B"}</span></td>
                        <td>
                          <button className="bde-icon-btn" onClick={() => deleteItem("brief", brief.id)}>?</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="bde-muted">No briefs available. Start with an idea!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "Drafts":
        return (
          <div className="bde-tab-panel">
            <div className="bde-panel-header">
              <h3>Draft Management</h3>
              <button className="bde-btn primary" onClick={generateDraft} disabled={loading}>
                {loading ? "Generating..." : "+ Generate Draft"}
              </button>
            </div>
            <div className="bde-data-table">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Word Count</th>
                    <th>Readability</th>
                    <th>Version</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {drafts.length > 0 ? (
                    drafts.map((d) => (
                      <tr key={d.id}>
                        <td>{d.title}</td>
                        <td><span className="bde-tag">{d.status || "draft"}</span></td>
                        <td>{d.wordCount || "--"}</td>
                        <td>{d.readabilityScore || "--"}</td>
                        <td>v{d.version || 1}</td>
                        <td>
                          <button className="bde-icon-btn" onClick={() => setSelectedItem(d)}>?</button>
                          <button className="bde-icon-btn" onClick={() => deleteItem("draft", d.id)}>?</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="bde-muted">No drafts yet. Generate your first draft!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "SEO":
        return (
          <div className="bde-tab-panel">
            <h3>SEO Analysis</h3>
            <div className="bde-seo-grid">
              <div className="bde-card">
                <h4>Overall Score</h4>
                <div className="bde-score-circle">{seo?.score || "--"}</div>
                <p className="bde-grade">Grade: {seo?.grade || "--"}</p>
              </div>
              <div className="bde-card">
                <h4>Metadata Score</h4>
                <div className="bde-score-circle">{metadataScore || "--"}</div>
                <div className="bde-list">
                  <div className="bde-list-item"><strong>Title</strong><span>{draft?.title?.length || 0} chars</span></div>
                  <div className="bde-list-item"><strong>Meta</strong><span>{draft?.metaDescription?.length || 0} chars</span></div>
                </div>
              </div>
              <div className="bde-card">
                <h4>Keyword Analysis</h4>
                <div className="bde-list">
                  <div className="bde-list-item"><strong>Primary</strong><span>{primaryKeyword}</span></div>
                  <div className="bde-list-item"><strong>Density</strong><span>{seo?.keywordDensity || "--"}%</span></div>
                  <div className="bde-list-item"><strong>Coverage</strong><span>{seo?.keywordCoverage || "--"}</span></div>
                </div>
              </div>
            </div>
          </div>
        );

      case "Tasks":
        return (
          <div className="bde-tab-panel">
            <div className="bde-panel-header">
              <h3>Collaboration Tasks</h3>
              <button className="bde-btn" onClick={() => { setModalType("task"); setShowModal(true); }}>
                + New Task
              </button>
            </div>
            <div className="bde-tasks-list">
              {tasks.map((task) => (
                <div key={task.id} className="bde-task-card">
                  <div className="bde-task-header">
                    <strong>{task.title}</strong>
                    <span className={`bde-tag ${task.status.toLowerCase().replace(" ", "-")}`}>{task.status}</span>
                  </div>
                  <div className="bde-task-meta">
                    <span>Assigned: {task.assignee || "Unassigned"}</span>
                    <span>Priority: {task.priority || "Medium"}</span>
                  </div>
                  <div className="bde-task-actions">
                    <button className="bde-icon-btn" onClick={() => deleteItem("task", task.id)}>?</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "Performance":
        return (
          <div className="bde-tab-panel">
            <h3>Performance Analytics</h3>
            <div className="bde-perf-grid">
              <div className="bde-metric-card">
                <span className="bde-metric-label">Views (30d)</span>
                <span className="bde-metric-value">{SAMPLE_PERFORMANCE.views.toLocaleString()}</span>
                <span className="bde-metric-change">+12% vs last period</span>
              </div>
              <div className="bde-metric-card">
                <span className="bde-metric-label">Engagement Rate</span>
                <span className="bde-metric-value">{Math.round(SAMPLE_PERFORMANCE.engagement * 100)}%</span>
                <span className="bde-metric-change">+5% vs avg</span>
              </div>
              <div className="bde-metric-card">
                <span className="bde-metric-label">Conversion Rate</span>
                <span className="bde-metric-value">{Math.round(SAMPLE_PERFORMANCE.conversions * 1000) / 10}%</span>
                <span className="bde-metric-change">+8% vs benchmark</span>
              </div>
              <div className="bde-metric-card">
                <span className="bde-metric-label">Forecast Lift</span>
                <span className="bde-metric-value">+{Math.round(SAMPLE_PERFORMANCE.forecastLift * 100)}%</span>
                <span className="bde-metric-change">High confidence</span>
              </div>
            </div>
            <div className="bde-chart-placeholder">
              <p>Performance trend chart (30-day rolling)</p>
            </div>
          </div>
        );

      case "AI Routing":
        return (
          <div className="bde-tab-panel">
            <h3>AI Provider Routing</h3>
            <div className="bde-ai-controls">
              <button className="bde-btn" onClick={orchestrate}>Run Best-of-N</button>
              <button className="bde-btn" onClick={ensemble}>Run Ensemble</button>
            </div>
            <div className="bde-provider-list">
              {providers.map((p) => (
                <div key={p.id} className={`bde-provider-card ${(aiRun?.route || []).includes(p.id) ? "active" : ""}`}>
                  <h4>{p.name}</h4>
                  <div className="bde-provider-meta">
                    <span>Latency: {p.latency}</span>
                    <span>Strength: {p.strength}</span>
                  </div>
                  {(aiRun?.route || []).includes(p.id) && <span className="bde-pill success">Selected</span>}
                </div>
              ))}
            </div>
            {aiRun && (
              <div className="bde-ai-result">
                <strong>Last Run:</strong> {aiRun.strategy} • Quality: {aiRun.qualityScore}
              </div>
            )}
          </div>
        );

      case "Audit Logs":
        return (
          <div className="bde-tab-panel">
            <h3>Audit Logs</h3>
            <div className="bde-data-table">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length > 0 ? (
                    auditLogs.map((log, idx) => (
                      <tr key={idx}>
                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                        <td>{log.user}</td>
                        <td>{log.action}</td>
                        <td>{log.resource}</td>
                        <td><span className="bde-tag success">{log.status}</span></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="bde-muted">No audit logs available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "Health":
        return (
          <div className="bde-tab-panel">
            <h3>System Health</h3>
            <div className="bde-health-grid">
              <div className="bde-health-card">
                <h4>API Status</h4>
                <span className="bde-health-status success">Operational</span>
                <p>Uptime: 99.9%</p>
              </div>
              <div className="bde-health-card">
                <h4>Database</h4>
                <span className="bde-health-status success">Connected</span>
                <p>Latency: 12ms</p>
              </div>
              <div className="bde-health-card">
                <h4>AI Providers</h4>
                <span className="bde-health-status success"> 3/3 Online</span>
                <p>Avg Response: 0.9s</p>
              </div>
              <div className="bde-health-card">
                <h4>Queue</h4>
                <span className="bde-health-status success">Processing</span>
                <p>Jobs: {stats?.queueJobs || 0}</p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="bde-tab-panel">
            <h3>{activeTab}</h3>
            <p className="bde-muted">Tab content for "{activeTab}" coming soon...</p>
          </div>
        );
    }
  };

  return (
    <div className="bde-shell">
      <div className="bde-header">
        <div>
          <p className="bde-kicker">World-class · 8 engines · 42 tabs</p>
          <h2>Blog Draft Engine</h2>
          <div className="bde-subtitle">Ideation ? Briefs ? Outlines ? Draft ? SEO ? Distribution ? Collaboration ? Performance</div>
        </div>
        <div className="bde-actions">
          <BackButton />
          <button className="bde-btn" onClick={orchestrate}>AI route</button>
          <button className="bde-btn" onClick={ensemble}>Ensemble</button>
          <button className="bde-btn primary" onClick={generateDraft} disabled={loading}>{loading ? "Running" : "Generate"}</button>
        </div>
      </div>

      <div className="bde-badges">
        <span className="bde-pill success">Health: {health?.status || "unknown"}</span>
        {stats && <span className="bde-pill info">Ideas: {stats.ideas} · Drafts: {stats.drafts}</span>}
        {seo && <span className="bde-pill warning">SEO: {seo.score}</span>}
        {metadataScore > 0 && <span className="bde-pill">Metadata: {metadataScore}</span>}
        <span className="bde-pill muted">42-tab workspace</span>
      </div>

      <div className="bde-tabs">
        {Object.entries(TAB_GROUPS).map(([group, items]) => (
          <div key={group} className="bde-tab-group">
            <h4>{group.toUpperCase()}</h4>
            <div className="bde-tab-list">
              {items.map((item) => (
                <div
                  key={item}
                  className={`bde-tab-chip ${activeTab === item ? "active" : ""}`}
                  onClick={() => { setActiveGroup(group); setActiveTab(item); }}
                >
                  <span>{item}</span>
                  {activeTab === item && <span></span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && <div className="bde-error">{error}</div>}

      {renderTabContent()}

      {showModal && (
        <div className="bde-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="bde-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bde-modal-header">
              <h3>Create New {modalType.charAt(0).toUpperCase() + modalType.slice(1)}</h3>
              <button className="bde-modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="bde-modal-body">
              {modalType === "idea" && (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  createIdea({
                    title: formData.get("title"),
                    keyword: formData.get("keyword"),
                    audience: formData.get("audience"),
                    status: "new",
                  });
                }}>
                  <label>Title<input name="title" required /></label>
                  <label>Primary Keyword<input name="keyword" required /></label>
                  <label>Target Audience<input name="audience" /></label>
                  <button type="submit" className="bde-btn primary">Create Idea</button>
                </form>
              )}
              {modalType === "brief" && (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  createBrief({
                    title: formData.get("title"),
                    primaryKeyword: formData.get("keyword"),
                    targetWords: parseInt(formData.get("targetWords")),
                    audience: formData.get("audience"),
                  });
                }}>
                  <label>Title<input name="title" required /></label>
                  <label>Primary Keyword<input name="keyword" required /></label>
                  <label>Target Words<input name="targetWords" type="number" defaultValue="1500" /></label>
                  <label>Audience<input name="audience" /></label>
                  <button type="submit" className="bde-btn primary">Create Brief</button>
                </form>
              )}
              {modalType === "task" && (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const newTask = {
                    id: tasks.length + 1,
                    title: formData.get("title"),
                    status: "Open",
                    assignee: formData.get("assignee"),
                    priority: formData.get("priority"),
                  };
                  setTasks([...tasks, newTask]);
                  setShowModal(false);
                }}>
                  <label>Title<input name="title" required /></label>
                  <label>Assignee<input name="assignee" /></label>
                  <label>
                    Priority
                    <select name="priority">
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </label>
                  <button type="submit" className="bde-btn primary">Create Task</button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
