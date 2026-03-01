import React, { useMemo, useRef, useState } from "react";
import BackButton from "./BackButton";
import "../../content-brief/AIContentBriefGenerator.css";

const TAB_GROUPS = {
 manage: ["Briefs", "Personas", "Outline", "Tasks", "Comments", "Approvals"],
 optimize: ["SEO", "Readability", "Distribution", "Links", "Schema", "A/B Tests"],
 advanced: ["AI Orchestration", "Ensembles", "Providers", "Guardrails", "Routing", "Red Team"],
 tools: ["Templates", "Snippets", "Assets", "FAQ", "Checklists", "Exports"],
 monitoring: ["Health", "Audit", "Performance", "SLA", "Alerts", "Versioning"],
 settings: ["API Keys", "Brand", "Compliance", "Integrations", "Backups", "Access"],
 "world-class": ["Collaboration", "Security", "Analytics", "BI", "SDK", "White-label"],
};

const DEFAULT_OUTLINE = [
 { heading: "Problem", notes: "State the core challenge", wordCount: 120 },
 { heading: "Solution", notes: "Explain how we solve it", wordCount: 200 },
 { heading: "Proof", notes: "Data, quotes, and visuals", wordCount: 180 },
 { heading: "CTA", notes: "Single primary CTA", wordCount: 80 },
];

const DEFAULT_CHANNELS = [
 { channel: "Blog", status: "ready", owner: "Content"},
 { channel: "Email", status: "in QA", owner: "Lifecycle"},
 { channel: "LinkedIn", status: "queued", owner: "Social"},
 { channel: "Ads", status: "pending", owner: "Growth"},
 { channel: "Partners", status: "draft", owner: "Alliances"},
 { channel: "Webinar", status: "ready", owner: "Events"},
];

const PROVIDERS = [
 { id: "gpt-4", name: "OpenAI GPT-4", latency: "1.2s", strength: "reasoning"},
 { id: "claude-3", name: "Claude 3", latency: "1.0s", strength: "context"},
 { id: "gemini-pro", name: "Gemini Pro", latency: "0.9s", strength: "multimodal"},
];

export default function AIContentBriefGenerator() {
 const [topic, setTopic] = useState("AI content brief best practices");
 const [persona, setPersona] = useState("Demand Gen Manager");
 const [tone, setTone] = useState("Confident & concise");
 const [primaryKeyword, setPrimaryKeyword] = useState("ai content brief");
 const [secondaryKeywords, setSecondaryKeywords] = useState(["content brief template", "seo outline", "ai content planning"]);
 const [questions, setQuestions] = useState(["What is the buyer problem?", "Which proof points win?", "Which CTA converts?"]);
 const [outline, setOutline] = useState(DEFAULT_OUTLINE);
 const [wordCount, setWordCount] = useState(1200);
 const [cta, setCta] = useState("Book a demo");
 const [status, setStatus] = useState("In Review");
 const [approvals, setApprovals] = useState({ owner: "Content Lead", reviewer: "Legal", due: "2026-02-20"});
 const [channels, setChannels] = useState(DEFAULT_CHANNELS);
 const [tasks, setTasks] = useState([
 { id: 1, title: "Add customer quote", status: "Open"},
 { id: 2, title: "Insert product screenshot", status: "In Progress"},
 { id: 3, title: "Legal review for claims", status: "Pending"},
 ]);
 const [activities, setActivities] = useState([
 { id: "act-1", text: "Brief created with governance defaults", ts: "10:02"},
 { id: "act-2", text: "SEO score recalculated", ts: "10:06"},
 { id: "act-3", text: "Distribution plan updated", ts: "10:12"},
 ]);
 const [note, setNote] = useState("");
 const [outlineDraft, setOutlineDraft] = useState(JSON.stringify(DEFAULT_OUTLINE, null, 2));
 const fileInputRef = useRef();
 
 // Modal state
 const [showBriefModal, setShowBriefModal] = useState(false);
 const [showTaskModal, setShowTaskModal] = useState(false);
 const [showProviderModal, setShowProviderModal] = useState(false);
 
 // Filter and search state
 const [searchQuery, setSearchQuery] = useState("");
 const [filterChannel, setFilterChannel] = useState("all");
 const [sortField, setSortField] = useState("channel");
 const [sortDirection, setSortDirection] = useState("asc");
 
 // New brief form state
 const [newBriefTopic, setNewBriefTopic] = useState("");
 const [newBriefAudience, setNewBriefAudience] = useState("");
 const [newBriefGoal, setNewBriefGoal] = useState("");
 
 // New task form state
 const [newTaskTitle, setNewTaskTitle] = useState("");
 const [newTaskAssignee, setNewTaskAssignee] = useState("");
 const [newTaskPriority, setNewTaskPriority] = useState("medium");
 
 // Advanced features state
 const [complianceResults, setComplianceResults] = useState([
 { check: "PII Detection", status: "passed", details: "No PII found"},
 { check: "Claims Verification", status: "warning", details: "2 citations needed"},
 { check: "Tone Analysis", status: "passed", details: "On-brand tone"},
 { check: "Accessibility", status: "passed", details: "WCAG 2.1 AA compliant"},
 ]);
 
 const [performanceData, setPerformanceData] = useState([
 { metric: "Page Views", current: 12400, previous: 9800, change: 26.5 },
 { metric: "Engagement Rate", current: 42, previous: 38, change: 10.5 },
 { metric: "Conversion Rate", current: 8.4, previous: 7.2, change: 16.7 },
 { metric: "Avg. Time on Page", current: 245, previous: 220, change: 11.4 },
 ]);
 
 const [seoMetrics, setSeoMetrics] = useState({
 keywordDensity: 1.8,
 readabilityScore: 68,
 internalLinks: 6,
 externalLinks: 4,
 imageAltTags: 8,
 metaDescription: "Optimized (156 chars)",
 h1Count: 1,
 h2Count: 5,
 });
 
 const [distributionSchedule, setDistributionSchedule] = useState([
 { date: "2026-02-18", channel: "Blog", time: "10:00 AM", status: "scheduled"},
 { date: "2026-02-19", channel: "Email", time: "08:00 AM", status: "scheduled"},
 { date: "2026-02-20", channel: "LinkedIn", time: "12:00 PM", status: "draft"},
 { date: "2026-02-21", channel: "Twitter", time: "03:00 PM", status: "draft"},
 ]);

 const seoScore = useMemo(() => 82 + Math.round(Math.random() * 6), [topic, primaryKeyword]);
 const readinessScore = useMemo(() => {
 const ready = channels.filter((c) => c.status === "ready").length;
 return Math.round((ready / Math.max(channels.length, 1)) * 100);
 }, [channels]);

 const handleImport = (evt) => {
 const file = evt.target.files?.[0];
 if (!file) return;
 const reader = new FileReader();
 reader.onload = (e) => {
 try {
 const parsed = JSON.parse(e.target.result);
 setOutline(parsed);
 setOutlineDraft(JSON.stringify(parsed, null, 2));
 } catch (_) {
 setNote("Invalid outline JSON");
 }
 };
 reader.readAsText(file);
 };

 const handleExport = () => {
 const blob = new Blob([JSON.stringify(outline, null, 2)], { type: "application/json"});
 const url = URL.createObjectURL(blob);
 const anchor = document.createElement("a");
 anchor.href = url;
 anchor.download = "brief-outline.json";
 anchor.click();
 URL.revokeObjectURL(url);
 };

 const updateChannelStatus = (channelName, next) => {
 setChannels((prev) => prev.map((c) => (c.channel === channelName ? { ...c, status: next } : c)));
 };

 const saveVersion = () => {
 setActivities((prev) => [{ id: `act-${Date.now()}`, text: "Version saved", ts: "now"}, ...prev].slice(0, 8));
 setStatus("Ready for approval");
 };

 const addTask = () => {
 setTasks((prev) => [{ id: Date.now(), title: "New compliance review", status: "Open"}, ...prev]);
 };

 const updateOutlineDraft = (value) => {
 setOutlineDraft(value);
 try {
 const parsed = JSON.parse(value);
 if (Array.isArray(parsed)) setOutline(parsed);
 } catch (_) {
 // ignore to allow typing
 }
 };

 const outlineGrade = useMemo(() => {
 const completeness = Math.min(100, outline.length * 15 + 30);
 const depth = Math.min(100, Math.round(outline.reduce((acc, s) => acc + (s.wordCount || 0), 0) / 15));
 const score = Math.round(completeness * 0.5 + depth * 0.5);
 return { score, grade: score >= 90 ? "A": score >= 80 ? "B": "C"};
 }, [outline]);
 
 // Handler functions
 const handleCreateBrief = () => {
 if (!newBriefTopic.trim()) return;
 setTopic(newBriefTopic);
 setPersona(newBriefAudience);
 setActivities((prev) => [
 { id: `act-${Date.now()}`, text: `Created brief: "${newBriefTopic}"`, ts: "now"},
 ...prev
 ].slice(0, 8));
 setShowBriefModal(false);
 setNewBriefTopic("");
 setNewBriefAudience("");
 setNewBriefGoal("");
 };
 
 const handleCreateTask = () => {
 if (!newTaskTitle.trim()) return;
 setTasks((prev) => [
 { id: Date.now(), title: newTaskTitle, status: "Open", assignee: newTaskAssignee, priority: newTaskPriority },
 ...prev
 ]);
 setActivities((prev) => [
 { id: `act-${Date.now()}`, text: `Task created: "${newTaskTitle}"`, ts: "now"},
 ...prev
 ].slice(0, 8));
 setShowTaskModal(false);
 setNewTaskTitle("");
 setNewTaskAssignee("");
 setNewTaskPriority("medium");
 };
 
 const handleRunCompliance = () => {
 setComplianceResults((prev) => prev.map(check => ({
 ...check,
 status: Math.random() > 0.3 ? "passed": "warning"})));
 setActivities((prev) => [
 { id: `act-${Date.now()}`, text: "Compliance check executed", ts: "now"},
 ...prev
 ].slice(0, 8));
 };
 
 const handleToggleSort = (field) => {
 if (sortField === field) {
 setSortDirection(sortDirection === "asc"? "desc": "asc");
 } else {
 setSortField(field);
 setSortDirection("asc");
 }
 };
 
 const filteredChannels = useMemo(() => {
 let filtered = channels;
 if (filterChannel !== "all") {
 filtered = filtered.filter(ch => ch.status === filterChannel);
 }
 if (searchQuery) {
 filtered = filtered.filter(ch => 
 ch.channel.toLowerCase().includes(searchQuery.toLowerCase()) ||
 ch.owner.toLowerCase().includes(searchQuery.toLowerCase())
 );
 }
 return filtered.sort((a, b) => {
 const aVal = a[sortField];
 const bVal = b[sortField];
 const compare = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
 return sortDirection === "asc"? compare : -compare;
 });
 }, [channels, filterChannel, searchQuery, sortField, sortDirection]);
 
 const handleSchedulePublication = (channel, date, time) => {
 setDistributionSchedule((prev) => [
 ...prev.filter(s => s.channel !== channel),
 { date, channel, time, status: "scheduled"}
 ]);
 setActivities((prev) => [
 { id: `act-${Date.now()}`, text: `Scheduled ${channel} for ${date} ${time}`, ts: "now"},
 ...prev
 ].slice(0, 8));
 };
 
 const getPerformanceChangeIcon = (change) => {
 if (change > 0) return "";
 if (change < 0) return "";
 return "";
 };
 
 const getComplianceIcon = (status) => {
 if (status === "passed") return "";
 if (status === "warning") return "";
 return "";
 };

 return (
 <div className="brief-shell">
 <div className="brief-header">
 <div className="brief-title">
 <h2>AI Content Brief Generator</h2>
 <div className="brief-subline">Research Outline SEO Distribution Governance Performance</div>
 </div>
 <div className="brief-actions">
 <BackButton />
 <button className="brief-btn"onClick={handleExport}>Export outline</button>
 <button className="brief-btn"onClick={() => fileInputRef.current?.click()}>Import outline</button>
 <button className="brief-btn primary"onClick={saveVersion}>Save version</button>
 </div>
 <div className="brief-badges">
 <span className="brief-pill">Status: {status}</span>
 <span className="brief-pill success">SEO: {seoScore}</span>
 <span className="brief-pill warning">Readiness: {readinessScore}%</span>
 <span className="brief-pill">Outline grade: {outlineGrade.grade}</span>
 </div>
 </div>

 <div className="brief-tabs">
 {Object.entries(TAB_GROUPS).map(([group, items]) => (
 <div key={group} className="brief-tab-group">
 <h4>{group.toUpperCase()}</h4>
 <div className="brief-tab-list">
 {items.map((item) => (
 <div key={item} className="brief-tab-chip">
 <span>{item}</span>
 <span></span>
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>

 <div className="brief-grid two-column">
 <div className="brief-card">
 <h3>Research & Strategy</h3>
 <div className="brief-inputs">
 <label>
 Topic
 <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic"/>
 </label>
 <label>
 Persona
 <input value={persona} onChange={(e) => setPersona(e.target.value)} />
 </label>
 <label>
 Tone
 <input value={tone} onChange={(e) => setTone(e.target.value)} />
 </label>
 <label>
 Primary keyword
 <input value={primaryKeyword} onChange={(e) => setPrimaryKeyword(e.target.value)} />
 </label>
 <label>
 Secondary keywords
 <input value={secondaryKeywords.join(", ")} onChange={(e) => setSecondaryKeywords(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
 </label>
 <label>
 Target word count
 <input type="number"value={wordCount} onChange={(e) => setWordCount(Number(e.target.value))} />
 </label>
 </div>
 <div className="brief-list">
 {questions.map((q, idx) => (
 <div key={idx} className="brief-list-item">
 <strong>Discovery</strong>
 <span>{q}</span>
 </div>
 ))}
 </div>
 </div>

 <div className="brief-card">
 <h3>Outline & Structure</h3>
 <div className="brief-meta-row">
 <span className="brief-tag">Sections: {outline.length}</span>
 <span className="brief-tag">Words: {outline.reduce((acc, s) => acc + (s.wordCount || 0), 0)}</span>
 <span className="brief-tag">CTA: {cta}</span>
 </div>
 <textarea
 className="brief-inputs"style={{ gridColumn: "1/-1", minHeight: 180 }}
 value={outlineDraft}
 onChange={(e) => updateOutlineDraft(e.target.value)}
 />
 <div className="brief-metrics">
 <div className="metric-pill"><span>Completeness</span>{outlineGrade.score}%</div>
 <div className="metric-pill"><span>Grade</span>{outlineGrade.grade}</div>
 <div className="metric-pill"><span>CTA</span>{cta}</div>
 </div>
 </div>

 <div className="brief-card">
 <h3>SEO Brief</h3>
 <div className="brief-metrics">
 <div className="metric-pill"><span>Score</span>{seoScore}</div>
 <div className="metric-pill"><span>Schema</span>Article</div>
 <div className="metric-pill"><span>Links</span>6</div>
 </div>
 <div className="brief-list">
 <div className="brief-list-item"><strong>Keywords</strong><span>{primaryKeyword}</span></div>
 <div className="brief-list-item"><strong>Secondary</strong><span>{secondaryKeywords.join("· ")}</span></div>
 <div className="brief-list-item"><strong>Questions</strong><span>{questions.slice(0, 2).join("· ")}</span></div>
 </div>
 </div>

 <div className="brief-card">
 <h3>Distribution & Readiness</h3>
 <div className="brief-status-grid">
 {channels.map((ch) => (
 <div key={ch.channel} className="brief-status-card">
 <div className="brief-meta-row"style={{ justifyContent: "space-between"}}>
 <strong>{ch.channel}</strong>
 <span className="brief-tag">{ch.owner}</span>
 </div>
 <div className="brief-tag">Status: {ch.status}</div>
 <div className="brief-progress"><span style={{ width: ch.status === "ready"? "100%": ch.status === "in QA"? "65%": "35%"}} /></div>
 <div className="brief-activity">Activate </div>
 </div>
 ))}
 </div>
 <div className="brief-actions"style={{ marginTop: 10 }}>
 <button className="brief-btn"onClick={() => updateChannelStatus("Email", "ready")}>Mark Email ready</button>
 <button className="brief-btn"onClick={() => updateChannelStatus("Ads", "in QA")}>Move Ads to QA</button>
 </div>
 </div>

 <div className="brief-card">
 <h3>Collaboration</h3>
 <div className="brief-meta-row">
 <span className="brief-tag">Owner: {approvals.owner}</span>
 <span className="brief-tag">Reviewer: {approvals.reviewer}</span>
 <span className="brief-tag">Due: {approvals.due}</span>
 </div>
 <div className="brief-list">
 {tasks.map((task) => (
 <div key={task.id} className="brief-list-item">
 <strong>{task.title}</strong>
 <span>Status: {task.status}</span>
 </div>
 ))}
 </div>
 <div className="cta-row">
 <button className="brief-btn"onClick={addTask}>Add task</button>
 <button className="brief-btn"onClick={() => setStatus("Approved")}>Mark approved</button>
 </div>
 </div>

 <div className="brief-card">
 <h3>Governance</h3>
 <div className="brief-list">
 <div className="brief-list-item"><strong>PII</strong><span>Blocked</span></div>
 <div className="brief-list-item"><strong>Claims</strong><span>Needs 2 citations</span></div>
 <div className="brief-list-item"><strong>Tone</strong><span>On-brand</span></div>
 </div>
 <div className="brief-actions"style={{ marginTop: 10 }}>
 <button className="brief-btn"onClick={() => setApprovals({ ...approvals, reviewer: "Compliance"})}>Send to compliance</button>
 <button className="brief-btn"onClick={() => setNote("Audit logged")}>Log audit</button>
 </div>
 </div>

 <div className="brief-card">
 <h3>Performance</h3>
 <div className="brief-metrics">
 <div className="metric-pill"><span>Views</span>12.4k</div>
 <div className="metric-pill"><span>Engagement</span>42%</div>
 <div className="metric-pill"><span>Conversion</span>8.4%</div>
 <div className="metric-pill"><span>Forecast (30d)</span>+25%</div>
 </div>
 <div className="brief-activity">Next forecast runs after distribution reaches 80% readiness.</div>
 </div>

 <div className="brief-card">
 <h3>AI Orchestration</h3>
 <div className="brief-list">
 {PROVIDERS.map((p) => (
 <div key={p.id} className="brief-list-item">
 <strong>{p.name}</strong>
 <span>Latency: {p.latency} · Strength: {p.strength}</span>
 </div>
 ))}
 </div>
 <div className="cta-row">
 <button className="brief-btn primary"onClick={() => setActivities((prev) => [{ id: `act-${Date.now()}`, text: "AI route selected", ts: "now"}, ...prev])}>Route with best quality</button>
 <button className="brief-btn"onClick={() => setActivities((prev) => [{ id: `act-${Date.now()}`, text: "Ensemble run queued", ts: "now"}, ...prev])}>Ensemble</button>
 </div>
 </div>

 <div className="brief-card">
 <h3>Activity & Notes</h3>
 <div className="brief-list">
 {activities.map((a) => (
 <div key={a.id} className="brief-list-item">
 <strong>{a.text}</strong>
 <span>{a.ts}</span>
 </div>
 ))}
 </div>
 <textarea
 className="brief-inputs"style={{ gridColumn: "1/-1", minHeight: 90, marginTop: 10 }}
 placeholder="Add a note"value={note}
 onChange={(e) => setNote(e.target.value)}
 />
 <div className="brief-actions"style={{ marginTop: 10 }}>
 <button className="brief-btn"onClick={() => setNote("")}>Clear</button>
 <button className="brief-btn"onClick={() => setActivities((prev) => [{ id: `act-${Date.now()}`, text: note || "New note added", ts: "now"}, ...prev])}>Log note</button>
 </div>
 </div>
 </div>

 {/* Advanced Data Tables Section */}
 <div className="brief-card"style={{ gridColumn: "1/-1", marginTop: 16 }}>
 <h3>Compliance Dashboard</h3>
 <div className="brief-actions"style={{ marginBottom: 12 }}>
 <button className="brief-btn"onClick={handleRunCompliance}>Run Compliance Check</button>
 <button className="brief-btn secondary">Generate Report</button>
 </div>
 <table className="brief-data-table">
 <thead>
 <tr>
 <th>Check Type</th>
 <th>Status</th>
 <th>Details</th>
 <th>Actions</th>
 </tr>
 </thead>
 <tbody>
 {complianceResults.map((result, idx) => (
 <tr key={idx}>
 <td><strong>{result.check}</strong></td>
 <td>
 <span className={`badge ${result.status === "passed"? "success": "warning"}`}>
 {getComplianceIcon(result.status)} {result.status}
 </span>
 </td>
 <td>{result.details}</td>
 <td>
 <button className="brief-btn small">Review</button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {/* Performance Analytics Section */}
 <div className="brief-card"style={{ gridColumn: "1/-1", marginTop: 16 }}>
 <h3>Performance Analytics</h3>
 <table className="brief-data-table">
 <thead>
 <tr>
 <th onClick={() => handleToggleSort("metric")} className="sortable">Metric</th>
 <th onClick={() => handleToggleSort("current")} className="sortable">Current</th>
 <th>Previous</th>
 <th>Change</th>
 <th>Trend</th>
 </tr>
 </thead>
 <tbody>
 {performanceData.map((data, idx) => (
 <tr key={idx}>
 <td><strong>{data.metric}</strong></td>
 <td>{data.current.toLocaleString()}</td>
 <td>{data.previous.toLocaleString()}</td>
 <td className={data.change > 0 ? "success": "danger"}>
 {data.change > 0 ? "+": ""}{data.change}%
 </td>
 <td>{getPerformanceChangeIcon(data.change)}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {/* SEO Metrics Section */}
 <div className="brief-card"style={{ gridColumn: "1/-1", marginTop: 16 }}>
 <h3>SEO Detailed Metrics</h3>
 <div className="brief-grid">
 <div className="brief-card">
 <h4>Keyword Analysis</h4>
 <div className="brief-list">
 <div className="brief-list-item">
 <strong>Density</strong>
 <span>{seoMetrics.keywordDensity}% (Target: 1.5-2.5%)</span>
 </div>
 <div className="brief-list-item">
 <strong>Readability</strong>
 <span>{seoMetrics.readabilityScore}/100 (Flesch Reading Ease)</span>
 </div>
 </div>
 </div>
 <div className="brief-card">
 <h4>Link Profile</h4>
 <div className="brief-list">
 <div className="brief-list-item">
 <strong>Internal Links</strong>
 <span>{seoMetrics.internalLinks} (Recommended: 5-8)</span>
 </div>
 <div className="brief-list-item">
 <strong>External Links</strong>
 <span>{seoMetrics.externalLinks} (Recommended: 3-5)</span>
 </div>
 </div>
 </div>
 <div className="brief-card">
 <h4>Content Structure</h4>
 <div className="brief-list">
 <div className="brief-list-item">
 <strong>H1 Tags</strong>
 <span>{seoMetrics.h1Count} (Must be exactly 1)</span>
 </div>
 <div className="brief-list-item">
 <strong>H2 Tags</strong>
 <span>{seoMetrics.h2Count} (Recommended: 4-7)</span>
 </div>
 </div>
 </div>
 <div className="brief-card">
 <h4>Media Optimization</h4>
 <div className="brief-list">
 <div className="brief-list-item">
 <strong>Image Alt Tags</strong>
 <span>{seoMetrics.imageAltTags} images optimized</span>
 </div>
 <div className="brief-list-item">
 <strong>Meta Description</strong>
 <span className="badge success">{seoMetrics.metaDescription}</span>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Distribution Schedule Section */}
 <div className="brief-card"style={{ gridColumn: "1/-1", marginTop: 16 }}>
 <h3>Distribution Schedule</h3>
 <div className="brief-search-bar"style={{ marginBottom: 12 }}>
 <input 
 type="text"placeholder="Search channels..."value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 />
 </div>
 <div className="brief-filter-group"style={{ marginBottom: 12 }}>
 <button 
 className={`brief-btn small ${filterChannel === "all"? "primary": ""}`}
 onClick={() => setFilterChannel("all")}
 >
 All
 </button>
 <button 
 className={`brief-btn small ${filterChannel === "scheduled"? "primary": ""}`}
 onClick={() => setFilterChannel("scheduled")}
 >
 Scheduled
 </button>
 <button 
 className={`brief-btn small ${filterChannel === "draft"? "primary": ""}`}
 onClick={() => setFilterChannel("draft")}
 >
 Draft
 </button>
 </div>
 <table className="brief-data-table">
 <thead>
 <tr>
 <th>Date</th>
 <th>Channel</th>
 <th>Time</th>
 <th>Status</th>
 <th>Actions</th>
 </tr>
 </thead>
 <tbody>
 {distributionSchedule.map((schedule, idx) => (
 <tr key={idx}>
 <td>{schedule.date}</td>
 <td><strong>{schedule.channel}</strong></td>
 <td>{schedule.time}</td>
 <td>
 <span className={`badge ${schedule.status === "scheduled"? "success": "warning"}`}>
 {schedule.status}
 </span>
 </td>
 <td>
 <button className="brief-btn small">Edit</button>
 <button className="brief-btn small danger"style={{ marginLeft: 6 }}>Cancel</button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {/* Filtered Channels Table */}
 <div className="brief-card"style={{ gridColumn: "1/-1", marginTop: 16 }}>
 <h3>Channel Management</h3>
 <table className="brief-data-table">
 <thead>
 <tr>
 <th 
 onClick={() => handleToggleSort("channel")} 
 className={`sortable ${sortField === "channel"? `sorted-${sortDirection}` : ""}`}
 >
 Channel
 </th>
 <th 
 onClick={() => handleToggleSort("status")} 
 className={`sortable ${sortField === "status"? `sorted-${sortDirection}` : ""}`}
 >
 Status
 </th>
 <th 
 onClick={() => handleToggleSort("owner")} 
 className={`sortable ${sortField === "owner"? `sorted-${sortDirection}` : ""}`}
 >
 Owner
 </th>
 <th>Actions</th>
 </tr>
 </thead>
 <tbody>
 {filteredChannels.map((channel) => (
 <tr key={channel.channel}>
 <td><strong>{channel.channel}</strong></td>
 <td>
 <span className={`badge ${channel.status === "ready"? "success": channel.status === "in QA"? "warning": "info"}`}>
 {channel.status}
 </span>
 </td>
 <td>{channel.owner}</td>
 <td>
 <button 
 className="brief-btn small success"onClick={() => updateChannelStatus(channel.channel, "ready")}
 >
 Approve
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>

 {/* Create Brief Modal */}
 {showBriefModal && (
 <div className="brief-modal-overlay"onClick={() => setShowBriefModal(false)}>
 <div className="brief-modal-container"onClick={(e) => e.stopPropagation()}>
 <div className="brief-modal-header">
 <h3>Create New Brief</h3>
 <button className="brief-modal-close"onClick={() => setShowBriefModal(false)}>×</button>
 </div>
 <div className="brief-modal-body">
 <div className="brief-form-row">
 <div className="brief-form-group">
 <label>
 Topic <span className="required">*</span>
 </label>
 <input 
 type="text"value={newBriefTopic}
 onChange={(e) => setNewBriefTopic(e.target.value)}
 placeholder="Enter content topic..."/>
 <span className="help-text">A clear, focused topic for your content</span>
 </div>
 </div>
 <div className="brief-form-row two-col">
 <div className="brief-form-group">
 <label>Target Audience</label>
 <input 
 type="text"value={newBriefAudience}
 onChange={(e) => setNewBriefAudience(e.target.value)}
 placeholder="e.g., Marketing Directors"/>
 </div>
 <div className="brief-form-group">
 <label>Content Goal</label>
 <select 
 value={newBriefGoal}
 onChange={(e) => setNewBriefGoal(e.target.value)}
 >
 <option value="">Select goal...</option>
 <option value="educate">Educate</option>
 <option value="convert">Convert</option>
 <option value="engage">Engage</option>
 <option value="retain">Retain</option>
 </select>
 </div>
 </div>
 <div className="brief-form-row">
 <div className="brief-form-group">
 <label>Brief Description</label>
 <textarea 
 value={note}
 onChange={(e) => setNote(e.target.value)}
 placeholder="Describe the content strategy..."/>
 </div>
 </div>
 </div>
 <div className="brief-modal-footer">
 <button className="brief-btn ghost"onClick={() => setShowBriefModal(false)}>
 Cancel
 </button>
 <button className="brief-btn primary"onClick={handleCreateBrief}>
 Create Brief
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Create Task Modal */}
 {showTaskModal && (
 <div className="brief-modal-overlay"onClick={() => setShowTaskModal(false)}>
 <div className="brief-modal-container"onClick={(e) => e.stopPropagation()}>
 <div className="brief-modal-header">
 <h3>Create New Task</h3>
 <button className="brief-modal-close"onClick={() => setShowTaskModal(false)}>×</button>
 </div>
 <div className="brief-modal-body">
 <div className="brief-form-row">
 <div className="brief-form-group">
 <label>Task Title <span className="required">*</span></label>
 <input 
 type="text"value={newTaskTitle}
 onChange={(e) => setNewTaskTitle(e.target.value)}
 placeholder="Enter task description..."/>
 </div>
 </div>
 <div className="brief-form-row two-col">
 <div className="brief-form-group">
 <label>Assignee</label>
 <input 
 type="text"value={newTaskAssignee}
 onChange={(e) => setNewTaskAssignee(e.target.value)}
 placeholder="Assign to..."/>
 </div>
 <div className="brief-form-group">
 <label>Priority</label>
 <select 
 value={newTaskPriority}
 onChange={(e) => setNewTaskPriority(e.target.value)}
 >
 <option value="low">Low</option>
 <option value="medium">Medium</option>
 <option value="high">High</option>
 <option value="urgent">Urgent</option>
 </select>
 </div>
 </div>
 </div>
 <div className="brief-modal-footer">
 <button className="brief-btn ghost"onClick={() => setShowTaskModal(false)}>
 Cancel
 </button>
 <button className="brief-btn primary"onClick={handleCreateTask}>
 Create Task
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Provider Analytics Modal */}
 {showProviderModal && (
 <div className="brief-modal-overlay"onClick={() => setShowProviderModal(false)}>
 <div className="brief-modal-container"onClick={(e) => e.stopPropagation()}>
 <div className="brief-modal-header">
 <h3>AI Provider Analytics</h3>
 <button className="brief-modal-close"onClick={() => setShowProviderModal(false)}>×</button>
 </div>
 <div className="brief-modal-body">
 <table className="brief-data-table">
 <thead>
 <tr>
 <th>Provider</th>
 <th>Latency</th>
 <th>Cost (per 1K)</th>
 <th>Reliability</th>
 <th>Quality Score</th>
 </tr>
 </thead>
 <tbody>
 <tr>
 <td><strong>GPT-4</strong></td>
 <td>1.2s</td>
 <td>$0.03</td>
 <td><span className="badge success">99.8%</span></td>
 <td><span className="badge success">95/100</span></td>
 </tr>
 <tr>
 <td><strong>Claude 3</strong></td>
 <td>1.0s</td>
 <td>$0.015</td>
 <td><span className="badge success">99.5%</span></td>
 <td><span className="badge success">93/100</span></td>
 </tr>
 <tr>
 <td><strong>Gemini Pro</strong></td>
 <td>0.9s</td>
 <td>$0.001</td>
 <td><span className="badge warning">98.2%</span></td>
 <td><span className="badge info">88/100</span></td>
 </tr>
 </tbody>
 </table>
 <div className="brief-alert info"style={{ marginTop: 16 }}>
 <span className="icon"></span>
 <div>
 <strong>Recommendation:</strong>Use GPT-4 for critical content requiring highest reasoning quality. 
 Claude 3 offers best balance of quality and cost. Gemini Pro is ideal for high-volume, cost-sensitive tasks.
 </div>
 </div>
 </div>
 <div className="brief-modal-footer">
 <button className="brief-btn ghost"onClick={() => setShowProviderModal(false)}>
 Close
 </button>
 <button className="brief-btn primary">
 Update Provider Settings
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Floating Action Buttons */}
 <div style={{ position: "fixed", bottom: 24, right: 24, display: "flex", gap: 12, flexDirection: "column"}}>
 <button 
 className="brief-btn primary"onClick={() => setShowBriefModal(true)}
 style={{ borderRadius: "50%", width: 56, height: 56, fontSize: 24 }}
 >
 +
 </button>
 <button 
 className="brief-btn secondary"onClick={() => setShowTaskModal(true)}
 style={{ borderRadius: "50%", width: 48, height: 48, fontSize: 20 }}
 >
 
 </button>
 <button 
 className="brief-btn"onClick={() => setShowProviderModal(true)}
 style={{ borderRadius: "50%", width: 48, height: 48, fontSize: 18 }}
 >
 
 </button>
 </div>

 <input type="file"accept="application/json"ref={fileInputRef} style={{ display: "none"}} onChange={handleImport} />
 </div>
 );
}
