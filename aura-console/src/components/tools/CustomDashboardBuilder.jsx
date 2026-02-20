﻿import React, { useState, useRef, useEffect } from "react";
import { apiFetch } from "../../api";

export default function CustomDashboardBuilder() {
  const [widgets, setWidgets] = useState([]);
  const [selectedWidget, setSelectedWidget] = useState(null);
  const [dashboard, setDashboard] = useState([]);
  const [dataSources, setDataSources] = useState([]);
  const [error, setError] = useState("");
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [history, setHistory] = useState([]);
  const [env, setEnv] = useState("dev");
  const [lintFindings, setLintFindings] = useState([]);
  const [published, setPublished] = useState(false);
  const [publishedAt, setPublishedAt] = useState(null);
  const [shareUrl, setShareUrl] = useState(null);
  const [templateApplied, setTemplateApplied] = useState("");
  const [search, setSearch] = useState("");
  const [layoutCols, setLayoutCols] = useState(3);
  const [rowHeight, setRowHeight] = useState(280);
  const [targets, setTargets] = useState({});
  const [freshness, setFreshness] = useState({});
  const [schedule, setSchedule] = useState("Daily 8am");
  const [auditLog, setAuditLog] = useState([]);
  const [unsaved, setUnsaved] = useState(false);
  const [role, setRole] = useState("editor");
  const [editLocked, setEditLocked] = useState(false);
  const [metadata, setMetadata] = useState({ title: "", owner: "", tags: "" });
  const [piiFlags, setPiiFlags] = useState({});
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [webhookLog, setWebhookLog] = useState("");
  const [publishPreview, setPublishPreview] = useState({ added: [], removed: [] });
  const [lastPublished, setLastPublished] = useState({ dashboard: [], dataSources: [] });
  const [versions, setVersions] = useState([]);
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [comments, setComments] = useState({});
  const [reviewer, setReviewer] = useState("");
  const [reviewStatus, setReviewStatus] = useState("pending");
  const [previewToken, setPreviewToken] = useState(null);
  const [reminderBanner, setReminderBanner] = useState(false);
  const [latencyMap, setLatencyMap] = useState({});
  const [perfBudget, setPerfBudget] = useState(350);
  const [simulatedLoad, setSimulatedLoad] = useState(false);
  const [dependencyMap, setDependencyMap] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [runbook, setRunbook] = useState("");
  const [lintAcknowledged, setLintAcknowledged] = useState(false);
  const [maintenanceFreeze, setMaintenanceFreeze] = useState(false);
  const [dataSourceOwners, setDataSourceOwners] = useState({});
  const [dataSourceNotes, setDataSourceNotes] = useState({});
  const [escalationChannel, setEscalationChannel] = useState("slack");
  const [escalationTarget, setEscalationTarget] = useState("");
  const [slaBreach, setSlaBreach] = useState(false);
  const [versionLabel, setVersionLabel] = useState("");
  const [versionNotes, setVersionNotes] = useState("");
  const [exportChecksum, setExportChecksum] = useState(null);
  const [exportWithDiff, setExportWithDiff] = useState(false);
  const [defaultTarget, setDefaultTarget] = useState("");
  const [lintRunAt, setLintRunAt] = useState(null);
  const [showGuardrailText, setShowGuardrailText] = useState(false);
  const devSandbox = env === "dev";
  const fileInputRef = useRef();
  const mainRef = useRef();
  const isReadOnly = editLocked || role === "viewer";

  const ensureWritable = () => {
    if (isReadOnly) {
      setError("View-only: unlock or switch to editor to change dashboards.");
      return false;
    }
    return true;
  };

  const restoreSnapshot = (snap) => {
    if (!snap) return;
    if (snap.dashboard) setDashboard(snap.dashboard);
    if (snap.widgets) setWidgets(snap.widgets);
    if (snap.dataSources) setDataSources(snap.dataSources);
    if (snap.env) setEnv(snap.env);
  };

  const quickFixForIssue = (msg = "") => {
    const lower = msg.toLowerCase();
    if (lower.includes("network")) return "retry";
    if (lower.includes("json")) return "reset";
    return null;
  };

  const averageLatency = () => {
    const vals = Object.values(latencyMap || {});
    if (vals.length === 0) return 0;
    return Math.round(vals.reduce((acc, v) => acc + v, 0) / vals.length);
  };

  const perfSummary = () => {
    const avg = averageLatency();
    if (avg === 0) return "Measure latency to calculate";
    if (avg <= perfBudget) return `Within budget (${avg}ms / ${perfBudget}ms)`;
    if (avg <= perfBudget * 1.4) return `At risk (${avg}ms > ${perfBudget}ms budget)`;
    return `Over budget (${avg}ms > ${perfBudget}ms budget)`;
  };

  const buildDependencyGraph = (dash, sources) => {
    const lowerDashboard = (dash || []).map(w => ({ ...w, _lower: (w.name || "").toLowerCase() }));
    const graph = (sources || []).map(ds => {
      const lower = (ds.name || "").toLowerCase();
      const widgetsUsing = lowerDashboard.filter(w => w._lower.includes(lower)).map(w => w.name);
      return { source: ds.name, widgets: widgetsUsing };
    });
    setDependencyMap(graph);
  };

  const cleanupDashboard = () => {
    if (!ensureWritable()) return;
    const seenSources = new Set();
    const dedupedSources = dataSources.filter(ds => {
      const key = (ds.name || ds.id || "").toLowerCase();
      if (seenSources.has(key)) return false;
      seenSources.add(key);
      return true;
    });
    const cleanedComments = Object.fromEntries(Object.entries(comments || {}).map(([k, vals]) => [k, (vals || []).filter(c => c.text)]));
    setDataSources(dedupedSources);
    setComments(cleanedComments);
    setAuditLog(prev => [{ at: Date.now(), message: "Cleanup: deduped sources & pruned empty comments" }, ...prev].slice(0, 8));
    setUnsaved(true);
  };

  const simulateLoadTest = () => {
    if (!ensureWritable()) return;
    setSimulatedLoad(true);
    const jittered = {};
    Object.entries(latencyMap || {}).forEach(([k, v]) => { jittered[k] = Math.round(v * 1.25 + Math.random() * 60); });
    setLatencyMap(jittered);
    setAuditLog(prev => [{ at: Date.now(), message: "Simulated load spike" }, ...prev].slice(0, 8));
    setTimeout(() => setSimulatedLoad(false), 4000);
  };

  const measureLatency = () => {
    if (!ensureWritable()) return;
    if (dataSources.length === 0) {
      setError("No data sources to measure.");
      return;
    }
    const next = {};
    dataSources.forEach(ds => { next[ds.name] = Math.max(40, Math.round(Math.random() * 420)); });
    setLatencyMap(next);
    setAuditLog(prev => [{ at: Date.now(), message: "Measured data source latency" }, ...prev].slice(0, 8));
  };

  const healStaleSources = () => {
    if (!ensureWritable()) return;
    const now = Date.now();
    const healed = { ...freshness };
    Object.keys(healed).forEach(k => { healed[k] = now; });
    setFreshness(healed);
    setAuditLog(prev => [{ at: now, message: "Healed stale sources" }, ...prev].slice(0, 8));
  };

  const templates = {
    "Executive Overview": {
      dashboard: ["Revenue Overview", "Channel Mix", "Top Products", "KPI Scorecard"],
      dataSources: ["Orders", "Traffic", "Attribution"]
    },
    "Acquisition & Retention": {
      dashboard: ["Acquisition Cohorts", "CAC vs LTV", "Churn Risk", "Lifecycle Stages"],
      dataSources: ["Customers", "Events", "Subscriptions"]
    },
    "Operations Health": {
      dashboard: ["Inventory Health", "Fulfillment SLAs", "Support Volume", "Refund Trends"],
      dataSources: ["Inventory", "Logistics", "Support"]
    }
  };

  const applyTemplate = (name) => {
    if (!ensureWritable()) return;
    const tpl = templates[name];
    if (!tpl) return;
    const now = Date.now();
    const hydrated = tpl.dashboard.map((w, idx) => ({ id: `${now}-${idx}`, name: w }));
    const dsHydrated = tpl.dataSources.map((d, idx) => ({ id: `${now}-ds-${idx}`, name: d }));
    setDashboard(hydrated);
    setDataSources(dsHydrated);
    setTemplateApplied(name);
    setHistory(prev => [{ dashboard: hydrated, dataSources: dsHydrated, env, at: now, summary: `Applied template: ${name}` }, ...prev].slice(0, 5));
    setPublished(false);
    setPublishedAt(null);
    setUnsaved(true);
    setAuditLog(prev => [{ at: now, message: `Template applied: ${name}` }, ...prev].slice(0, 8));
  };

  const runLint = () => {
    const findings = [];
    setLintAcknowledged(false);
    if (devSandbox) findings.push({ level: "medium", msg: "Dev sandbox blocks live sync." });
    if (dashboard.length === 0) findings.push({ level: "high", msg: "Dashboard has no widgets." });
    if (dataSources.length === 0) findings.push({ level: "high", msg: "No data sources attached." });
    const nameCounts = dashboard.reduce((acc, w) => { acc[w.name] = (acc[w.name] || 0) + 1; return acc; }, {});
    const dupes = Object.entries(nameCounts).filter(([_, count]) => count > 1);
    if (dupes.length) findings.push({ level: "medium", msg: `Duplicate widgets: ${dupes.map(([n]) => n).join(", ")}` });
    if (dashboard.length > 12) findings.push({ level: "medium", msg: "Dashboard is heavy (>12 widgets)." });
    const score = dashboard.length * 2 + dataSources.length;
    if (score > 26) findings.push({ level: "medium", msg: "Performance budget risk: simplify layout." });
    if (layoutCols < 2) findings.push({ level: "low", msg: "Grid has 1 column; consider 2-4 for readability." });
    const staleSources = Object.entries(freshness || {}).filter(([, ts]) =>Date.now() - ts > 6 * 60 * 60 * 1000);
    if (staleSources.length) findings.push({ level: "high", msg: `Stale data sources (>6h): ${staleSources.map(([name]) => name).join(", ")}` });
    const widgetsMissingTargets = dashboard.filter(w => !targets[w.id]);
    if (widgetsMissingTargets.length) findings.push({ level: "medium", msg: `Widgets missing targets: ${widgetsMissingTargets.map(w => w.name).join(", ")}` });
    const avg = averageLatency();
    if (avg > 0 && avg > perfBudget * 1.2) findings.push({ level: "high", msg: `Performance budget exceeded: avg ${avg}ms vs budget ${perfBudget}ms.` });
    else if (avg > 0 && avg > perfBudget) findings.push({ level: "medium", msg: `Performance at risk: avg ${avg}ms slightly above budget (${perfBudget}ms).` });
    if (simulatedLoad) findings.push({ level: "low", msg: "Simulated load active — results may spike." });
    if (!metadata.title || metadata.title.length < 4) findings.push({ level: "low", msg: "Add a descriptive title for accessibility." });
    if (!metadata.owner) findings.push({ level: "low", msg: "Owner missing; clarify accountability." });
    const watchlistMissingTargets = dashboard.filter(w => watchlist.includes(w.id) && !targets[w.id]);
    if (watchlistMissingTargets.length) findings.push({ level: "high", msg: `Watchlist widgets missing targets: ${watchlistMissingTargets.map(w => w.name).join(", ")}` });
    const watchlistStale = dashboard.filter(w => {
      const dep = dependencyMap.find(d => (d.widgets || []).includes(w.name));
      if (!dep) return false;
      const ts = freshness[dep.source];
      return !ts || (Date.now() - ts > 6 * 60 * 60 * 1000);
    });
    if (watchlistStale.length) findings.push({ level: "medium", msg: `Watchlist widgets rely on stale sources: ${watchlistStale.map(w => w.name).join(", ")}` });
    const missingOwners = dataSources.filter(ds => !dataSourceOwners[ds.name]);
    if (missingOwners.length) findings.push({ level: "medium", msg: `Data sources missing owner: ${missingOwners.map(d => d.name).join(", ")}` });
    if (slaBreach && watchlist.length > 0) findings.push({ level: "high", msg: "SLA breach simulated on watchlist widgets." });
    setLintFindings(findings);
    setLintRunAt(Date.now());
    return findings;
  };

  const handlePublish = () => {
    if (maintenanceFreeze) {
      setError("Publish blocked: maintenance freeze active.");
      return;
    }
    if (reviewStatus !== "approved") {
      setError("Publish requires approval.");
      return;
    }
    if (editLocked || role === "viewer") {
      setError("Editing is locked. Unlock or switch to editor role to publish.");
      return;
    }
    if (!metadata.title || !metadata.owner || !metadata.tags) {
      setError("Title, Owner, and Tags are required before publish.");
      return;
    }
    const complianceMissing = dataSources.some(ds => !piiFlags[ds.id || ds.name]);
    if (complianceMissing) {
      setError("Compliance checklist incomplete: mark PII reviewed for all data sources.");
      return;
    }
    const findings = runLint();
    const blocking = findings.some(f => f.level === "high");
    if (blocking) {
      setError("Publish blocked by guardrails.");
      setPublished(false);
      return;
    }
    const prevNames = new Set((lastPublished.dashboard || []).map(w => w.name));
    const currentNames = new Set(dashboard.map(w => w.name));
    const added = dashboard.filter(w => !prevNames.has(w.name)).map(w => w.name);
    const removed = (lastPublished.dashboard || []).filter(w => !currentNames.has(w.name)).map(w => w.name);
    setPublishPreview({ added, removed });
    const versionEntry = { at: Date.now(), dashboard: [...dashboard], dataSources: [...dataSources], metadata: { ...metadata }, targets: { ...targets }, env, label: versionLabel, notes: versionNotes };
    setError("");
    setPublished(true);
    setPublishedAt(Date.now());
    setHistory(prev => [{ dashboard, dataSources, env, at: Date.now(), summary: "Published dashboard" }, ...prev].slice(0, 5));
    setAuditLog(prev => [{ at: Date.now(), message: "Published dashboard" }, ...prev].slice(0, 8));
    setLastPublished({ dashboard: [...dashboard], dataSources: [...dataSources] });
    setVersions(prev => [versionEntry, ...prev].slice(0, 5));
    setUnsaved(false);
    if (webhookEnabled) {
      const success = Math.random() > 0.15;
      if (success) {
        setWebhookLog(`Webhook queued at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
      } else {
        setError("Publish webhook failed: retry later.");
        setWebhookLog("Webhook failure (simulated)");
      }
    }
  };

  const handleShare = () => {
    if (devSandbox) {
      setError("Sandbox mode: share links disabled.");
      return;
    }
    const payload = { env, dashboard, dataSources, published, publishedAt, lintFindings };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    if (shareUrl) URL.revokeObjectURL(shareUrl);
    setShareUrl(url);
    setTimeout(() =>URL.revokeObjectURL(url), 20000);
    setAuditLog(prev => [{ at: Date.now(), message: "Generated share JSON" }, ...prev].slice(0, 8));
    setUnsaved(false);
  };

  // Fetch widget library
  const fetchWidgets = async () => {
    if (devSandbox) {
      setError("Sandbox mode: switch to Stage/Prod to fetch widgets.");
      return;
    }
    try {
      const res = await apiFetch("/api/custom-dashboard-builder/widgets");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setWidgets(data.widgets || []);
    } catch (err) {
      setError(err.message);
    }
  };
  // Fetch data sources
  const fetchDataSources = async () => {
    if (devSandbox) {
      setError("Sandbox mode: switch to Stage/Prod to load data sources.");
      return;
    }
    try {
      const res = await apiFetch("/api/custom-dashboard-builder/data-sources");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setDataSources(data.dataSources || []);
      const now = Date.now();
      const freshnessMap = {};
      (data.dataSources || []).forEach(ds => { freshnessMap[ds.name] = now; });
      setFreshness(freshnessMap);
      const latencySeed = {};
      (data.dataSources || []).forEach(ds => { latencySeed[ds.name] = Math.max(40, Math.round(Math.random() * 280)); });
      setLatencyMap(latencySeed);
      setDataSourceOwners(prev => {
        const next = { ...prev };
        (data.dataSources || []).forEach(ds => { if (!next[ds.name]) next[ds.name] = ""; });
        return next;
      });
      setDataSourceNotes(prev => {
        const next = { ...prev };
        (data.dataSources || []).forEach(ds => { if (next[ds.name] === undefined) next[ds.name] = ""; });
        return next;
      });
      setAuditLog(prev => [{ at: now, message: "Loaded data sources" }, ...prev].slice(0, 8));
      setPiiFlags(prev => {
        const next = { ...prev };
        (data.dataSources || []).forEach(ds => {
          const key = ds.id || ds.name;
          if (next[key] === undefined) next[key] = false;
        });
        return next;
      });
    } catch (err) {
      setError(err.message);
    }
  };

  // Add widget to dashboard
  const handleAddWidget = () => {
    if (editLocked || role === "viewer") {
      setError("Editing is locked. Unlock or switch to editor to add widgets.");
      return;
    }
    if (!selectedWidget) return;
    if (dataSources.length === 0 && !devSandbox) {
      setError("Add at least one data source before placing widgets.");
      return;
    }
    const duplicate = dashboard.find(w => w.name === selectedWidget.name);
    if (duplicate) {
      setError(`Widget "${selectedWidget.name}" already added.`);
      return;
    }
    const now = Date.now();
    setDashboard([...dashboard, { ...selectedWidget, id: now }]);
    setUnsaved(true);
    setAuditLog(prev => [{ at: now, message: `Added widget: ${selectedWidget.name}` }, ...prev].slice(0, 8));
  };

  // Import/Export dashboard
  const handleImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      setDashboard(JSON.parse(evt.target.result));
      setImported(file.name);
      setHistory(prev => [{ dashboard: JSON.parse(evt.target.result), env, at: Date.now(), summary: `Imported ${file.name}` }, ...prev].slice(0, 5));
      setUnsaved(true);
    };
    reader.readAsText(file);
  };
  const handleExport = () => {
    const payload = {
      dashboard,
      dataSources,
      metadata,
      targets,
      schedule,
      env,
      lintFindings,
      performance: { averageMs: averageLatency(), budgetMs: perfBudget, status: perfSummary() },
      dependencies: dependencyMap,
      watchlist,
      runbook,
      dataSourceOwners,
      dataSourceNotes,
      maintenanceFreeze,
      escalation: { channel: escalationChannel, target: escalationTarget },
      review: { reviewer, status: reviewStatus },
      versioning: { label: versionLabel, notes: versionNotes },
      guardrails: {
        freeze: maintenanceFreeze,
        reviewStatus,
        highLintCount,
        missingPiiCount,
        missingOwnersCount,
        missingTargetsCount,
        staleSources: staleSources.length,
        unboundSources: unboundSources.length,
        lintRunAt,
        watchlistMissingTargets,
        ownerCoverage,
        piiCoverage,
        targetCoverage
      },
      slaSnapshot: buildSlaSnapshot(),
      diffs: exportWithDiff ? publishPreview : undefined,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setExportChecksum(checksumPayload(payload));
    setHistory(prev => [{ dashboard, env, at: Date.now(), summary: `Exported ${dashboard.length} widgets` }, ...prev].slice(0, 5));
    setTimeout(() =>URL.revokeObjectURL(url), 10000);
    setAuditLog(prev => [{ at: Date.now(), message: "Exported dashboard" }, ...prev].slice(0, 8));
    setUnsaved(false);
  };

  const downloadDraft = () => {
    const payload = {
      dashboard,
      dataSources,
      env,
      targets,
      metadata,
      watchlist,
      runbook,
      dataSourceOwners,
      dataSourceNotes,
      maintenanceFreeze,
      escalationChannel,
      escalationTarget,
      slaBreach,
      versionLabel,
      versionNotes,
      exportWithDiff,
      guardrails: {
        freeze: maintenanceFreeze,
        reviewStatus,
        highLintCount,
        missingPiiCount,
        missingOwnersCount,
        missingTargetsCount,
        staleSources: staleSources.length,
        unboundSources: unboundSources.length,
        lintRunAt,
        watchlistMissingTargets,
        ownerCoverage,
        piiCoverage,
        targetCoverage
      },
      slaSnapshot: buildSlaSnapshot(),
      lintRunAt,
      watchlistMissingTargets,
      showGuardrailText,
      defaultTarget,
      draftSavedAt: Date.now()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dashboard-draft.json";
    a.click();
    setAuditLog(prev => [{ at: Date.now(), message: "Downloaded draft JSON", guardrails: buildGuardrailSummary(), slaSnapshot: buildSlaSnapshot() }, ...prev].slice(0, 8));
    setTimeout(() =>URL.revokeObjectURL(url), 5000);
  };

  // Feedback
  const handleFeedback = async () => {
    if (!feedback) return;
    setError("");
    try {
      await apiFetch("/api/custom-dashboard-builder/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback })
      });
      setFeedback("");
    } catch (err) {
      setError(err.message);
    }
  };

  // Drag-and-drop (simplified)
  const handleDragStart = (idx) => {
    setSelectedWidget(widgets[idx]);
  };

  const duplicateDashboard = () => {
    const now = Date.now();
    const cloned = dashboard.map(w => ({ ...w, id: `${w.id}-copy-${now}` }));
    setDashboard(cloned);
    setHistory(prev => [{ dashboard: cloned, env, at: now, summary: "Duplicated dashboard" }, ...prev].slice(0, 5));
    setAuditLog(prev => [{ at: now, message: "Duplicated dashboard" }, ...prev].slice(0, 8));
    setUnsaved(true);
  };

  const refreshSources = () => {
    const now = Date.now();
    const updated = { ...freshness };
    Object.keys(updated).forEach(k => { updated[k] = now; });
    setFreshness(updated);
    const newLatency = { ...latencyMap };
    Object.keys(newLatency).forEach(k => { newLatency[k] = Math.max(40, Math.round(newLatency[k] * 0.8)); });
    setLatencyMap(newLatency);
    setAuditLog(prev => [{ at: now, message: "Refreshed data source freshness" }, ...prev].slice(0, 8));
  };

  const autoRecheckSources = () => {
    const now = Date.now();
    const refreshed = { ...freshness };
    Object.keys(refreshed).forEach(k => { refreshed[k] = now; });
    setFreshness(refreshed);
    setAuditLog(prev => [{ at: now, message: "Auto re-check sources" }, ...prev].slice(0, 8));
  };

  const assignOwnersForMissing = () => {
    const owner = prompt("Set an owner for data sources missing one");
    if (!owner) return;
    setDataSourceOwners(prev => {
      const next = { ...prev };
      dataSources.forEach(ds => {
        if (!next[ds.name]) next[ds.name] = owner;
      });
      return next;
    });
    setAuditLog(prev => [{ at: Date.now(), message: `Assigned owner ${owner} to missing sources` }, ...prev].slice(0, 8));
    setUnsaved(true);
  };

  const markPiiForMissing = () => {
    const missing = dataSources.filter(ds => !piiFlags[ds.id || ds.name]);
    if (missing.length === 0) return;
    const confirmMark = window.confirm(`Mark PII reviewed for ${missing.length} missing source(s)?`);
    if (!confirmMark) return;
    setPiiFlags(prev => {
      const next = { ...prev };
      missing.forEach(ds => { next[ds.id || ds.name] = true; });
      return next;
    });
    setAuditLog(prev => [{ at: Date.now(), message: `Marked PII reviewed for ${missing.length} sources` }, ...prev].slice(0, 8));
    setUnsaved(true);
  };

  const fillWatchlistTargets = () => {
    if (watchlistMissingTargets.length === 0) return;
    const proposed = defaultTarget || prompt("Set a target for watchlist widgets missing one");
    if (!proposed) return;
    setDefaultTarget(proposed);
    setTargets(prev => {
      const next = { ...prev };
      dashboard.forEach(w => {
        if (watchlist.includes(w.id) && !next[w.id]) next[w.id] = proposed;
      });
      return next;
    });
    setAuditLog(prev => [{ at: Date.now(), message: `Filled watchlist targets with ${proposed}` }, ...prev].slice(0, 8));
    setUnsaved(true);
  };

  const copyWatchlistGaps = () => {
    if (watchlistMissingTargets.length === 0) return;
    const txt = watchlistMissingTargets.join(", ");
    if (navigator?.clipboard?.writeText) navigator.clipboard.writeText(txt);
    setAuditLog(prev => [{ at: Date.now(), message: "Copied watchlist gaps" }, ...prev].slice(0, 8));
  };

  const buildSlaSnapshot = () => {
    return [
      `Owner coverage: ${ownerCoverage}%`,
      `PII coverage: ${piiCoverage}%`,
      `Watchlist: ${watchlist.length}`,
      watchlistMissingTargets.length ? `Watchlist gaps: ${watchlistMissingTargets.join(", ")}` : null,
      `SLA breach: ${slaBreach ? "yes" : "no"}`
    ].filter(Boolean).join(" | ");
  };

  const copySlaSnapshot = () => {
    const snapshot = buildSlaSnapshot();
    if (navigator?.clipboard?.writeText) navigator.clipboard.writeText(snapshot);
    setAuditLog(prev => [{ at: Date.now(), message: "Copied SLA snapshot", guardrails: buildGuardrailSummary(), slaSnapshot: snapshot }, ...prev].slice(0, 8));
  };

  const buildGuardrailSummary = () => {
    const missingTargets = dashboard.filter(w => !targets[w.id]).length;
    const ownersMissing = dataSources.filter(ds => !dataSourceOwners[ds.name]).length;
    const piiMissing = dataSources.filter(ds => !piiFlags[ds.id || ds.name]).length;
    const stale = dataSources.filter(ds => !freshness[ds.name] || (Date.now() - freshness[ds.name] > 6 * 60 * 60 * 1000)).length;
    const unbound = dataSources.filter(ds => {
      const dep = dependencyMap.find(d => d.source === ds.name);
      return !dep || (dep.widgets || []).length === 0;
    }).length;
    return [
      `Freeze: ${maintenanceFreeze ? "on" : "off"}`,
      `Review: ${reviewStatus}`,
      `High lint: ${highLintCount}`,
      `Missing targets: ${missingTargets}`,
      watchlistMissingTargets.length ? `Watchlist missing: ${watchlistMissingTargets.join(", ")}` : null,
      `Owners missing: ${ownersMissing}`,
      `PII unchecked: ${piiMissing}`,
      `Stale sources: ${stale}`,
      `Unbound sources: ${unbound}`,
      `Owner coverage: ${dataSources.length === 0 ? 0 : Math.round(((dataSources.length - ownersMissing) / dataSources.length) * 100)}%`,
      `PII coverage: ${dataSources.length === 0 ? 0 : Math.round(((dataSources.length - piiMissing) / dataSources.length) * 100)}%`
    ].filter(Boolean).join(" | ");
  };

  const copyGuardrailSummary = () => {
    const summary = buildGuardrailSummary();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(summary);
    }
    setAuditLog(prev => [{ at: Date.now(), message: "Copied guardrail summary", guardrails: summary, slaSnapshot: buildSlaSnapshot() }, ...prev].slice(0, 8));
  };

  const setAllTargets = () => {
    const proposed = defaultTarget || prompt("Set a default target for widgets missing one");
    if (!proposed) return;
    setDefaultTarget(proposed);
    setTargets(prev => {
      const next = { ...prev };
      dashboard.forEach(w => {
        if (!next[w.id]) next[w.id] = proposed;
      });
      return next;
    });
    setAuditLog(prev => [{ at: Date.now(), message: `Applied default target ${proposed} to missing widgets` }, ...prev].slice(0, 8));
    setUnsaved(true);
  };

  const clearWatchlist = () => {
    setWatchlist([]);
    setAuditLog(prev => [{ at: Date.now(), message: "Cleared watchlist" }, ...prev].slice(0, 8));
    setUnsaved(true);
  };

  const checksumPayload = (payload) => {
    try {
      const str = JSON.stringify(payload);
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
      }
      return `c-${Math.abs(hash)}`;
    } catch (e) {
      return null;
    }
  };

  const schedulePublish = () => {
    if (!ensureWritable()) return;
    const now = Date.now();
    setHistory(prev => [{ dashboard, env, at: now, summary: `Scheduled publish: ${schedule}` }, ...prev].slice(0, 5));
    setAuditLog(prev => [{ at: now, message: `Scheduled publish (${schedule})` }, ...prev].slice(0, 8));
  };

  const addComment = (widgetId, text) => {
    if (!ensureWritable()) return;
    if (!text) return;
    setComments(prev => ({ ...prev, [widgetId]: [...(prev[widgetId] || []), { at: Date.now(), text }] }));
    setUnsaved(true);
  };

  const generatePreviewToken = () => {
    if (devSandbox) {
      setError("Preview share disabled in dev.");
      return;
    }
    const payload = { dashboard, dataSources, metadata, env, reviewStatus };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    if (previewToken) URL.revokeObjectURL(previewToken);
    setPreviewToken(url);
    setTimeout(() =>URL.revokeObjectURL(url), 20000);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const daysSince = (now - (publishedAt || now)) / (1000 * 60 * 60 * 24);
      setReminderBanner(daysSince >= 7 && versions.length === 0 ? true : daysSince >= 7);
    }, 60000);
    return () => clearInterval(interval);
  }, [publishedAt, versions.length]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("cdb-versions");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setVersions(parsed);
      }
    } catch (e) {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("cdb-versions", JSON.stringify(versions.slice(0, 5)));
    } catch (e) {
      /* ignore */
    }
  }, [versions]);

  useEffect(() => {
    const interval = setInterval(() => {
      const payload = { dashboard, dataSources, env, targets, metadata, watchlist, runbook, dataSourceOwners, dataSourceNotes, maintenanceFreeze, escalationChannel, escalationTarget, slaBreach, versionLabel, versionNotes, exportWithDiff, defaultTarget, lintRunAt, showGuardrailText };
      try {
        localStorage.setItem("cdb-draft", JSON.stringify(payload));
        setDraftSavedAt(Date.now());
        setUnsaved(false);
      } catch (e) {
        /* ignore */
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [dashboard, dataSources, env, targets, metadata, watchlist, runbook, dataSourceOwners, dataSourceNotes, maintenanceFreeze, escalationChannel, escalationTarget, slaBreach, versionLabel, versionNotes, exportWithDiff, defaultTarget, lintRunAt, showGuardrailText]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("cdb-draft");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.dashboard) setDashboard(parsed.dashboard);
        if (parsed.dataSources) setDataSources(parsed.dataSources);
        if (parsed.targets) setTargets(parsed.targets);
        if (parsed.metadata) setMetadata(parsed.metadata);
        if (parsed.env) setEnv(parsed.env);
        if (parsed.watchlist) setWatchlist(parsed.watchlist);
        if (parsed.runbook) setRunbook(parsed.runbook);
        if (parsed.dataSourceOwners) setDataSourceOwners(parsed.dataSourceOwners);
        if (parsed.dataSourceNotes) setDataSourceNotes(parsed.dataSourceNotes);
        if (parsed.maintenanceFreeze !== undefined) setMaintenanceFreeze(parsed.maintenanceFreeze);
        if (parsed.escalationChannel) setEscalationChannel(parsed.escalationChannel);
        if (parsed.escalationTarget) setEscalationTarget(parsed.escalationTarget);
        if (parsed.slaBreach !== undefined) setSlaBreach(parsed.slaBreach);
        if (parsed.versionLabel) setVersionLabel(parsed.versionLabel);
        if (parsed.versionNotes) setVersionNotes(parsed.versionNotes);
        if (parsed.exportWithDiff !== undefined) setExportWithDiff(parsed.exportWithDiff);
        if (parsed.defaultTarget) setDefaultTarget(parsed.defaultTarget);
        if (parsed.lintRunAt) setLintRunAt(parsed.lintRunAt);
        if (parsed.showGuardrailText !== undefined) setShowGuardrailText(parsed.showGuardrailText);
        setUnsaved(false);
        setAuditLog(prev => [{ at: Date.now(), message: "Restored draft" }, ...prev].slice(0, 8));
      }
    } catch (e) {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    buildDependencyGraph(dashboard, dataSources);
  }, [dashboard, dataSources]);

  const complexityScore = dashboard.length * 2 + dataSources.length;
  const freshnessLabel = dataSources.length === 0 ? "Not connected" : `Linked to ${dataSources.length} source${dataSources.length > 1 ? "s" : ""}`;
  const riskLevel = complexityScore > 26 ? "High" : complexityScore > 18 ? "Medium" : "Low";
  const filteredWidgets = widgets.filter(w => w.name.toLowerCase().includes(search.toLowerCase()));
  const formatFreshness = (name) => {
    if (!freshness[name]) return "stale";
    const mins = Math.max(0, Math.round((Date.now() - freshness[name]) / 60000));
    if (mins === 0) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    return `${hrs}h ago`;
  };
  const publishedSources = new Set((lastPublished.dataSources || []).map(ds => ds.name));
  const currentSources = new Set((dataSources || []).map(ds => ds.name));
  const driftAdded = [...currentSources].filter(n => !publishedSources.has(n));
  const driftRemoved = [...publishedSources].filter(n => !currentSources.has(n));
  const lintSummary = lintFindings.reduce((acc, f) => {
    acc[f.level] = (acc[f.level] || 0) + 1;
    return acc;
  }, { high: 0, medium: 0, low: 0 });
  const highLintCount = lintFindings.filter(f => f.level === "high").length;
  const missingOwnersCount = dataSources.filter(ds => !dataSourceOwners[ds.name]).length;
  const missingPiiCount = dataSources.filter(ds => !piiFlags[ds.id || ds.name]).length;
  const missingTargetsCount = dashboard.filter(w => !targets[w.id]).length;
  const staleSources = dataSources.filter(ds => !freshness[ds.name] || (Date.now() - freshness[ds.name] > 6 * 60 * 60 * 1000));
  const unboundSources = dataSources.filter(ds => {
    const dep = dependencyMap.find(d => d.source === ds.name);
    return !dep || (dep.widgets || []).length === 0;
  });
  const watchlistMissingTargets = dashboard.filter(w => watchlist.includes(w.id) && !targets[w.id]).map(w => w.name);
  const targetCoverage = dashboard.length === 0 ? 0 : Math.round(((dashboard.length - missingTargetsCount) / dashboard.length) * 100);
  const ownerCoverage = dataSources.length === 0 ? 0 : Math.round(((dataSources.length - missingOwnersCount) / dataSources.length) * 100);
  const piiCoverage = dataSources.length === 0 ? 0 : Math.round(((dataSources.length - missingPiiCount) / dataSources.length) * 100);
  const missingOwnersList = dataSources.filter(ds => !dataSourceOwners[ds.name]).map(ds => ds.name);
  const missingPiiList = dataSources.filter(ds => !piiFlags[ds.id || ds.name]).map(ds => ds.name);

  return (
    <div style={{ background: "#252638", borderRadius: 18, boxShadow: "0 2px 24px #0008", padding: 36, fontFamily: 'Inter, sans-serif', color: '#f9fafb' }}>
      <button onClick={() => mainRef.current?.focus()} style={{ position: "absolute", left: -9999, top: 0 }} aria-label="Skip to content">Skip to content</button>
      {devSandbox && (
        <div style={{ background: "#252638", border: "1px solid #2e3045", borderRadius: 12, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 800, color: "#f59e0b" }}>Sandbox mode</div>
            <div style={{ color: "#a8adc4", fontSize: 13 }}>API-backed fetches are blocked in dev. Switch to Stage/Prod to sync widgets and data sources.</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => setEnv("stage")} style={{ background: "#2e3045", color: "#f9fafb", border: "1px solid #525578", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}>Switch to Stage</button>
            <button onClick={() => setEnv("prod")} style={{ background: "#22c55e", color: "#252638", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}>Go Prod</button>
          </div>
        </div>
      )}
      <h2 ref={mainRef} tabIndex={-1} style={{ fontWeight: 800, fontSize: 32, marginBottom: 18 }}>Custom Dashboard Builder</h2>
      <div style={{ color: "#0ea5e9", fontWeight: 600, marginBottom: 18 }}>
        <span role="img" aria-label="dashboard"></span>Build custom dashboards for your reporting needs.
      </div>
      <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
        <div style={{ color: "#a8adc4", fontSize: 13 }}>Unsaved changes: {unsaved ? "Yes" : "No"}</div>
        {draftSavedAt && <div style={{ color: "#a8adc4", fontSize: 12 }}>Draft saved: {new Date(draftSavedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>}
        <div style={{ color: "#6ee7b7", fontSize: 12 }}>Autosave every 30s.</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => setRole(role === "editor" ? "viewer" : "editor")} style={{ background: "#252638", color: "#f9fafb", border: "1px solid #2e3045", borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: "pointer" }}>Role: {role}</button>
          <button onClick={() => setEditLocked(!editLocked)} style={{ background: editLocked ? "#7f1d1d" : "#2e3045", color: editLocked ? "#fecdd3" : "#f9fafb", border: "1px solid #525578", borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: "pointer" }}>{editLocked ? "Unlock" : "Lock edits"}</button>
          <button onClick={() => {
            const raw = localStorage.getItem("cdb-draft");
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed.dashboard) setDashboard(parsed.dashboard);
              if (parsed.dataSources) setDataSources(parsed.dataSources);
              if (parsed.targets) setTargets(parsed.targets);
              if (parsed.metadata) setMetadata(parsed.metadata);
              if (parsed.env) setEnv(parsed.env);
              if (parsed.watchlist) setWatchlist(parsed.watchlist);
              if (parsed.runbook) setRunbook(parsed.runbook);
              if (parsed.dataSourceOwners) setDataSourceOwners(parsed.dataSourceOwners);
              if (parsed.dataSourceNotes) setDataSourceNotes(parsed.dataSourceNotes);
              if (parsed.maintenanceFreeze !== undefined) setMaintenanceFreeze(parsed.maintenanceFreeze);
              if (parsed.escalationChannel) setEscalationChannel(parsed.escalationChannel);
              if (parsed.escalationTarget) setEscalationTarget(parsed.escalationTarget);
              if (parsed.slaBreach !== undefined) setSlaBreach(parsed.slaBreach);
              if (parsed.versionLabel) setVersionLabel(parsed.versionLabel);
              if (parsed.versionNotes) setVersionNotes(parsed.versionNotes);
              if (parsed.exportWithDiff !== undefined) setExportWithDiff(parsed.exportWithDiff);
              if (parsed.defaultTarget) setDefaultTarget(parsed.defaultTarget);
              if (parsed.lintRunAt) setLintRunAt(parsed.lintRunAt);
              if (parsed.showGuardrailText !== undefined) setShowGuardrailText(parsed.showGuardrailText);
              setUnsaved(false);
              setAuditLog(prev => [{ at: Date.now(), message: "Restored draft" }, ...prev].slice(0, 8));
            }
          }} style={{ background: "#2e3045", color: "#f9fafb", border: "1px solid #525578", borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: "pointer" }}>Restore draft</button>
        </div>
        {editLocked && <div style={{ background: "#2f1114", border: "1px solid #525578", borderRadius: 10, padding: 10, color: "#fecdd3" }}>View-only: edits and publish are disabled.</div>}
      </div>
      <div style={{ display: "grid", gap: 12, marginBottom: 18 }}>
        <div style={{ background: "#252638", border: "1px solid #2e3045", borderRadius: 12, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 800, color: "#6366f1" }}>Quality & Guardrails</div>
            <div style={{ color: "#a8adc4", fontSize: 13 }}>Complexity score {complexityScore} · Risk: {riskLevel} · {freshnessLabel} · Perf: {perfSummary()}</div>
            {lintFindings.length > 0 && (
              <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ color: "#a8adc4", fontSize: 12 }}>Lint findings:</span>
                <span style={{ background: "#2f1114", color: "#fecdd3", borderRadius: 8, padding: "2px 8px", fontSize: 12 }}>High: {lintSummary.high || 0}</span>
                <span style={{ background: "#2f2311", color: "#fef3c7", borderRadius: 8, padding: "2px 8px", fontSize: 12 }}>Med: {lintSummary.medium || 0}</span>
                <span style={{ background: "#252638", color: "#cbd5e1", borderRadius: 8, padding: "2px 8px", fontSize: 12 }}>Low: {lintSummary.low || 0}</span>
                <button onClick={() => setLintAcknowledged(true)} disabled={lintFindings.length === 0} style={{ background: lintAcknowledged ? "#14532d" : "#2e3045", color: lintAcknowledged ? "#bbf7d0" : "#f9fafb", border: "1px solid #525578", borderRadius: 8, padding: "4px 8px", fontWeight: 700, cursor: lintFindings.length === 0 ? "not-allowed" : "pointer", opacity: lintFindings.length === 0 ? 0.6 : 1, fontSize: 12 }}>{lintAcknowledged ? "Acknowledged" : "Acknowledge"}</button>
              </div>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => { if (!ensureWritable()) return; runLint(); }} style={{ background: "#2e3045", color: "#f9fafb", border: "1px solid #525578", borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: isReadOnly ? "not-allowed" : "pointer", opacity: isReadOnly ? 0.6 : 1 }} disabled={isReadOnly}>Run lint</button>
            <button onClick={() => { if (!ensureWritable()) return; handlePublish(); }} style={{ background: published ? "#0ea5e9" : "#22c55e", color: published ? "#e0f2fe" : "#252638", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 800, cursor: isReadOnly ? "not-allowed" : "pointer", opacity: isReadOnly ? 0.6 : 1 }} disabled={isReadOnly}>{published ? "Published" : "Publish"}</button>
            <button onClick={handleShare} disabled={devSandbox} style={{ background: devSandbox ? "#2e3045" : "#6366f1", color: devSandbox ? "#a8adc4" : "#fff", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: devSandbox ? "not-allowed" : "pointer", opacity: devSandbox ? 0.6 : 1 }}>Share JSON</button>
            <button onClick={() => { if (!ensureWritable()) return; duplicateDashboard(); }} style={{ background: "#2e3045", color: "#f9fafb", border: "1px solid #525578", borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: isReadOnly ? "not-allowed" : "pointer", opacity: isReadOnly ? 0.6 : 1 }} disabled={isReadOnly}>Duplicate</button>
            <button onClick={() => { if (!ensureWritable()) return; schedulePublish(); }} style={{ background: "#252638", color: "#bae6fd", border: "1px solid #2e3045", borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: isReadOnly ? "not-allowed" : "pointer", opacity: isReadOnly ? 0.6 : 1 }} disabled={isReadOnly}>Schedule</button>
            <button onClick={() => { if (!ensureWritable()) return; setWebhookEnabled(!webhookEnabled); }} style={{ background: webhookEnabled ? "#0ea5e9" : "#2e3045", color: webhookEnabled ? "#e0f2fe" : "#f9fafb", border: "1px solid #525578", borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: isReadOnly ? "not-allowed" : "pointer", opacity: isReadOnly ? 0.6 : 1 }} disabled={isReadOnly}>{webhookEnabled ? "Webhook On" : "Webhook Off"}</button>
            <button onClick={generatePreviewToken} disabled={devSandbox} style={{ background: devSandbox ? "#2e3045" : "#525578", color: devSandbox ? "#a8adc4" : "#e0f2fe", border: "1px solid #2e3045", borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: devSandbox ? "not-allowed" : "pointer", opacity: devSandbox ? 0.6 : 1 }}>Share Preview</button>
            <button onClick={measureLatency} style={{ background: "#2e3045", color: "#7dd3fc", border: "1px solid #525578", borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: isReadOnly ? "not-allowed" : "pointer", opacity: isReadOnly ? 0.6 : 1 }} disabled={isReadOnly}>Measure latency</button>
            <button onClick={simulateLoadTest} style={{ background: simulatedLoad ? "#525578" : "#f97316", color: simulatedLoad ? "#f9fafb" : "#252638", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 800, cursor: "pointer" }}>{simulatedLoad ? "Load active" : "Simulate load"}</button>
            <button onClick={cleanupDashboard} style={{ background: "#252638", color: "#a5f3fc", border: "1px solid #2e3045", borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: "pointer" }}>Cleanup</button>
            <button onClick={healStaleSources} style={{ background: "#14532d", color: "#bbf7d0", border: "1px solid #166534", borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: "pointer" }}>Heal stale</button>
            <button onClick={() => setMaintenanceFreeze(m => !m)} style={{ background: maintenanceFreeze ? "#7f1d1d" : "#2e3045", color: maintenanceFreeze ? "#fecdd3" : "#f9fafb", border: "1px solid #525578", borderRadius: 8, padding: "8px 12px", fontWeight: 800, cursor: "pointer" }}>{maintenanceFreeze ? "Freeze: ON" : "Freeze: OFF"}</button>
            <button onClick={() => { if (watchlist.length === 0) { setError("Add watchlist items to simulate SLA breach."); return; } setSlaBreach(true); setAuditLog(prev => [{ at: Date.now(), message: "SLA breach simulated for watchlist" }, ...prev].slice(0, 8)); runLint(); }} style={{ background: slaBreach ? "#7f1d1d" : "#f59e0b", color: slaBreach ? "#fecdd3" : "#252638", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 800, cursor: "pointer" }}>{slaBreach ? "Breach active" : "Simulate SLA breach"}</button>
          </div>
        </div>
        <div style={{ background: "#252638", border: "1px solid #2e3045", borderRadius: 12, padding: 12, display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div style={{ color: "#cbd5e1", fontWeight: 700, fontSize: 13 }}>Guardrail recap</div>
            <div style={{ color: "#a8adc4", fontSize: 12 }}>Freeze, review, lint, PII, owners</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ background: maintenanceFreeze ? "#2f1114" : "#252638", color: maintenanceFreeze ? "#fecdd3" : "#bbf7d0", border: "1px solid #525578", borderRadius: 10, padding: "6px 10px", fontSize: 12 }}>Freeze: {maintenanceFreeze ? "Active" : "Off"}</span>
            <span style={{ background: reviewStatus !== "approved" ? "#2f2311" : "#252638", color: reviewStatus !== "approved" ? "#fcd34d" : "#cbd5e1", border: "1px solid #525578", borderRadius: 10, padding: "6px 10px", fontSize: 12 }}>Review: {reviewStatus}</span>
            <span style={{ background: highLintCount > 0 ? "#2f1114" : "#252638", color: highLintCount > 0 ? "#fecdd3" : "#cbd5e1", border: "1px solid #525578", borderRadius: 10, padding: "6px 10px", fontSize: 12 }}>High lint: {highLintCount}</span>
            <span style={{ background: missingPiiCount > 0 ? "#2f2311" : "#252638", color: missingPiiCount > 0 ? "#fcd34d" : "#cbd5e1", border: "1px solid #525578", borderRadius: 10, padding: "6px 10px", fontSize: 12 }}>PII unchecked: {missingPiiCount}</span>
            <span style={{ background: missingOwnersCount > 0 ? "#2f2311" : "#252638", color: missingOwnersCount > 0 ? "#fcd34d" : "#cbd5e1", border: "1px solid #525578", borderRadius: 10, padding: "6px 10px", fontSize: 12 }}>Owners missing: {missingOwnersCount}</span>
            <span style={{ background: targetCoverage === 100 ? "#252638" : "#2f2311", color: targetCoverage === 100 ? "#bbf7d0" : "#fcd34d", border: "1px solid #525578", borderRadius: 10, padding: "6px 10px", fontSize: 12 }}>Target coverage: {targetCoverage}%</span>
            <span style={{ background: ownerCoverage === 100 ? "#252638" : "#2f2311", color: ownerCoverage === 100 ? "#bbf7d0" : "#fcd34d", border: "1px solid #525578", borderRadius: 10, padding: "6px 10px", fontSize: 12 }}>Owner coverage: {ownerCoverage}%</span>
            <span style={{ background: piiCoverage === 100 ? "#252638" : "#2f2311", color: piiCoverage === 100 ? "#bbf7d0" : "#fcd34d", border: "1px solid #525578", borderRadius: 10, padding: "6px 10px", fontSize: 12 }}>PII coverage: {piiCoverage}%</span>
            <span style={{ background: watchlistMissingTargets.length > 0 ? "#2f2311" : "#252638", color: watchlistMissingTargets.length > 0 ? "#fcd34d" : "#bbf7d0", border: "1px solid #525578", borderRadius: 10, padding: "6px 10px", fontSize: 12 }}>Watchlist gaps: {watchlistMissingTargets.length}</span>
            <button onClick={copyGuardrailSummary} style={{ background: "#2e3045", color: "#f9fafb", border: "1px solid #525578", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Copy summary</button>
            <button onClick={() => setShowGuardrailText(s => !s)} style={{ background: "#252638", color: "#f9fafb", border: "1px solid #525578", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>{showGuardrailText ? "Hide text" : "Show text"}</button>
          </div>
          {showGuardrailText && (
            <div style={{ display: "grid", gap: 8 }}>
              <textarea readOnly value={buildGuardrailSummary()} style={{ width: "100%", background: "#252638", color: "#f9fafb", border: "1px solid #525578", borderRadius: 10, padding: 10, fontSize: 12 }} rows={2} aria-label="Guardrail summary text" />
              <textarea readOnly value={buildSlaSnapshot()} style={{ width: "100%", background: "#252638", color: "#f9fafb", border: "1px solid #525578", borderRadius: 10, padding: 10, fontSize: 12 }} rows={2} aria-label="SLA snapshot text" />
              {watchlistMissingTargets.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ color: "#a8adc4", fontSize: 12 }}>Watchlist gaps: {watchlistMissingTargets.join(", ")}</div>
                  <button onClick={copyWatchlistGaps} style={{ background: "#252638", color: "#f9fafb", border: "1px solid #525578", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Copy watchlist gaps</button>
                  <button onClick={fillWatchlistTargets} style={{ background: "#22c55e", color: "#252638", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer", fontSize: 12 }}>Fill watchlist targets</button>
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{ background: "#252638", border: "1px solid #2e3045", borderRadius: 12, padding: 12, display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div style={{ color: "#cbd5e1", fontWeight: 700, fontSize: 13 }}>Coverage & lint</div>
            <div style={{ color: "#a8adc4", fontSize: 12 }}>Targets and last lint</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ background: missingTargetsCount > 0 ? "#2f2311" : "#252638", color: missingTargetsCount > 0 ? "#fcd34d" : "#cbd5e1", border: "1px solid #525578", borderRadius: 10, padding: "6px 10px", fontSize: 12 }}>Missing targets: {missingTargetsCount}</span>
            <span style={{ color: "#a8adc4", fontSize: 12 }}>Watchlist missing: {dashboard.filter(w => watchlist.includes(w.id) && !targets[w.id]).length}</span>
            <button onClick={setAllTargets} disabled={dashboard.length === 0} style={{ background: "#22c55e", color: "#252638", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: dashboard.length === 0 ? "not-allowed" : "pointer", opacity: dashboard.length === 0 ? 0.6 : 1, fontSize: 12 }}>Fill missing targets</button>
            <div style={{ color: "#a8adc4", fontSize: 12 }}>{lintRunAt ? `Lint at ${new Date(lintRunAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Lint not run yet"}</div>
            <button onClick={runLint} style={{ background: "#2e3045", color: "#f9fafb", border: "1px solid #525578", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Run lint now</button>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ color: "#a8adc4", fontSize: 12 }}>Target coverage: {targetCoverage}%</div>
            <div style={{ height: 8, background: "#252638", borderRadius: 6, overflow: "hidden", border: "1px solid #2e3045" }}>
              <div style={{ width: `${targetCoverage}%`, height: "100%", background: targetCoverage === 100 ? "#22c55e" : targetCoverage >= 70 ? "#fbbf24" : "#ef4444", transition: "width 0.2s ease" }} />
            </div>
          </div>
        </div>
        <div style={{ background: "#252638", border: "1px solid #2e3045", borderRadius: 12, padding: 12, display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div style={{ color: "#cbd5e1", fontWeight: 700, fontSize: 13 }}>Data source health</div>
            <div style={{ color: "#a8adc4", fontSize: 12 }}>Stale & unbound check</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ background: staleSources.length > 0 ? "#2f1114" : "#252638", color: staleSources.length > 0 ? "#fecdd3" : "#cbd5e1", border: "1px solid #525578", borderRadius: 10, padding: "6px 10px", fontSize: 12 }}>Stale: {staleSources.length}</span>
            <span style={{ background: unboundSources.length > 0 ? "#2f2311" : "#252638", color: unboundSources.length > 0 ? "#fcd34d" : "#cbd5e1", border: "1px solid #525578", borderRadius: 10, padding: "6px 10px", fontSize: 12 }}>Unbound: {unboundSources.length}</span>
            <button onClick={autoRecheckSources} disabled={dataSources.length === 0} style={{ background: "#252638", color: dataSources.length === 0 ? "#a8adc4" : "#7dd3fc", border: "1px solid #525578", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: dataSources.length === 0 ? "not-allowed" : "pointer", opacity: dataSources.length === 0 ? 0.6 : 1, fontSize: 12 }}>Auto re-check</button>
            <button onClick={healStaleSources} disabled={dataSources.length === 0} style={{ background: "#14532d", color: dataSources.length === 0 ? "#a8adc4" : "#bbf7d0", border: "1px solid #166534", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: dataSources.length === 0 ? "not-allowed" : "pointer", opacity: dataSources.length === 0 ? 0.6 : 1, fontSize: 12 }}>Heal stale</button>
            <button onClick={assignOwnersForMissing} disabled={missingOwnersCount === 0} style={{ background: "#2e3045", color: missingOwnersCount === 0 ? "#a8adc4" : "#f9fafb", border: "1px solid #525578", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: missingOwnersCount === 0 ? "not-allowed" : "pointer", opacity: missingOwnersCount === 0 ? 0.6 : 1, fontSize: 12 }}>Assign owners</button>
            <button onClick={markPiiForMissing} disabled={missingPiiCount === 0} style={{ background: "#252638", color: missingPiiCount === 0 ? "#a8adc4" : "#a5f3fc", border: "1px solid #525578", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: missingPiiCount === 0 ? "not-allowed" : "pointer", opacity: missingPiiCount === 0 ? 0.6 : 1, fontSize: 12 }}>Mark PII missing</button>
          </div>
          {(staleSources.length > 0 || unboundSources.length > 0) && (
            <div style={{ display: "grid", gap: 4, color: "#a8adc4", fontSize: 12 }}>
              {staleSources.length > 0 && <div>Stale: {staleSources.map(s => s.name).join(", ")}</div>}
              {unboundSources.length > 0 && <div>Unbound: {unboundSources.map(s => s.name).join(", ")}</div>}
            </div>
          )}
          {(missingOwnersList.length > 0 || missingPiiList.length > 0) && (
            <div style={{ display: "grid", gap: 4, color: "#a8adc4", fontSize: 12 }}>
              {missingOwnersList.length > 0 && <div>Owners missing: {missingOwnersList.join(", ")}</div>}
              {missingPiiList.length > 0 && <div>PII unchecked: {missingPiiList.join(", ")}</div>}
            </div>
          )}
          {dataSources.length > 0 && (
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ color: "#a8adc4", fontSize: 12 }}>Owner coverage: {ownerCoverage}%</div>
              <div style={{ height: 8, background: "#252638", borderRadius: 6, overflow: "hidden", border: "1px solid #2e3045" }}>
                <div style={{ width: `${ownerCoverage}%`, height: "100%", background: ownerCoverage === 100 ? "#22c55e" : ownerCoverage >= 70 ? "#fbbf24" : "#ef4444", transition: "width 0.2s ease" }} />
              </div>
              <div style={{ color: "#a8adc4", fontSize: 12 }}>PII coverage: {piiCoverage}%</div>
              <div style={{ height: 8, background: "#252638", borderRadius: 6, overflow: "hidden", border: "1px solid #2e3045" }}>
                <div style={{ width: `${piiCoverage}%`, height: "100%", background: piiCoverage === 100 ? "#22c55e" : piiCoverage >= 70 ? "#fbbf24" : "#ef4444", transition: "width 0.2s ease" }} />
              </div>
            </div>
          )}
        </div>
        <div style={{ background: "#252638", border: "1px solid #2e3045", borderRadius: 12, padding: 12, display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ color: "#cbd5e1", fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>Perf budget (ms)
              <input type="number" min="100" max="2000" value={perfBudget} onChange={e => setPerfBudget(Math.max(50, Number(e.target.value) || 0))} style={{ width: 90, background: "#252638", color: "#f9fafb", border: "1px solid #2e3045", borderRadius: 8, padding: "6px 8px" }} />
            </label>
            <div style={{ color: "#a8adc4", fontSize: 13 }}>Avg latency: {averageLatency()}ms · {perfSummary()}</div>
          </div>
          <div style={{ height: 8, background: "#252638", borderRadius: 6, overflow: "hidden", border: "1px solid #2e3045" }}>
            <div style={{ width: `${Math.min(100, Math.max(0, (averageLatency() / (perfBudget || 1)) * 100))}%`, height: "100%", background: averageLatency() <= perfBudget ? "#22c55e" : averageLatency() <= perfBudget * 1.4 ? "#f59e0b" : "#ef4444", transition: "width 0.3s ease" }} />
          </div>
        </div>
        {lintFindings.length > 0 && (
          <div style={{ background: "#252638", border: "1px solid #2e3045", borderRadius: 12, padding: 12, display: "grid", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <div style={{ color: "#cbd5e1", fontWeight: 700, fontSize: 13 }}>Open lint findings</div>
              <button onClick={() => setLintFindings([])} style={{ background: "#2e3045", color: "#f9fafb", border: "1px solid #525578", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Clear findings</button>
            </div>
            {lintFindings.map((f, idx) => (
              <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", color: f.level === "high" ? "#f87171" : "#fbbf24" }}>
                <span style={{ fontWeight: 800, fontSize: 12, padding: "2px 8px", borderRadius: 6, background: f.level === "high" ? "#2f1114" : "#2f2311", border: "1px solid #525578", color: f.level === "high" ? "#fecdd3" : "#fef3c7" }}>{f.level.toUpperCase()}</span>
                <span>{f.msg}</span>
              </div>
            ))}
          </div>
        )}
        {published && (
          <div style={{ background: "#052e16", border: "1px solid #166534", borderRadius: 12, padding: 12, color: "#bbf7d0" }}>
            Live state: published {publishedAt ? new Date(publishedAt).toLocaleString() : "just now"} ({env}).
          </div>
        )}
        <div style={{ background: "#252638", border: "1px solid #2e3045", borderRadius: 12, padding: 12, display: "grid", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div style={{ color: "#cbd5e1", fontWeight: 700, fontSize: 13 }}>SLA & owners</div>
            <div style={{ color: "#a8adc4", fontSize: 12 }}>Coverage and alerts snapshot</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ background: ownerCoverage === 100 ? "#252638" : "#2f2311", color: ownerCoverage === 100 ? "#bbf7d0" : "#fcd34d", border: "1px solid #525578", borderRadius: 10, padding: "6px 10px", fontSize: 12 }}>Owner coverage: {ownerCoverage}%</span>
            <span style={{ background: piiCoverage === 100 ? "#252638" : "#2f2311", color: piiCoverage === 100 ? "#bbf7d0" : "#fcd34d", border: "1px solid #525578", borderRadius: 10, padding: "6px 10px", fontSize: 12 }}>PII coverage: {piiCoverage}%</span>
            <span style={{ background: watchlist.length > 0 ? "#2e3045" : "#252638", color: "#cbd5e1", border: "1px solid #525578", borderRadius: 10, padding: "6px 10px", fontSize: 12 }}>Watchlist: {watchlist.length}</span>
            <span style={{ background: slaBreach ? "#2f1114" : "#252638", color: slaBreach ? "#fecdd3" : "#cbd5e1", border: "1px solid #525578", borderRadius: 10, padding: "6px 10px", fontSize: 12 }}>SLA breach: {slaBreach ? "Simulated" : "None"}</span>
            {watchlistMissingTargets.length > 0 && <span style={{ background: "#2f2311", color: "#fcd34d", border: "1px solid #525578", borderRadius: 10, padding: "6px 10px", fontSize: 12 }}>Watchlist missing targets: {watchlistMissingTargets.length}</span>}
            <button onClick={copySlaSnapshot} style={{ background: "#252638", color: "#f9fafb", border: "1px solid #525578", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Copy SLA snapshot</button>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            <div style={{ color: "#a8adc4", fontSize: 12 }}>Owner coverage</div>
            <div style={{ height: 8, background: "#252638", borderRadius: 6, overflow: "hidden", border: "1px solid #2e3045" }}>
              <div style={{ width: `${ownerCoverage}%`, height: "100%", background: ownerCoverage === 100 ? "#22c55e" : ownerCoverage >= 70 ? "#fbbf24" : "#ef4444", transition: "width 0.2s ease" }} />
            </div>
            <div style={{ color: "#a8adc4", fontSize: 12 }}>PII coverage</div>
            <div style={{ height: 8, background: "#252638", borderRadius: 6, overflow: "hidden", border: "1px solid #2e3045" }}>
              <div style={{ width: `${piiCoverage}%`, height: "100%", background: piiCoverage === 100 ? "#22c55e" : piiCoverage >= 70 ? "#fbbf24" : "#ef4444", transition: "width 0.2s ease" }} />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <button onClick={assignOwnersForMissing} disabled={missingOwnersCount === 0} style={{ background: "#2e3045", color: missingOwnersCount === 0 ? "#a8adc4" : "#f9fafb", border: "1px solid #525578", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: missingOwnersCount === 0 ? "not-allowed" : "pointer", opacity: missingOwnersCount === 0 ? 0.6 : 1, fontSize: 12 }}>Assign owners</button>
              <button onClick={markPiiForMissing} disabled={missingPiiCount === 0} style={{ background: "#252638", color: missingPiiCount === 0 ? "#a8adc4" : "#a5f3fc", border: "1px solid #525578", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: missingPiiCount === 0 ? "not-allowed" : "pointer", opacity: missingPiiCount === 0 ? 0.6 : 1, fontSize: 12 }}>Mark PII missing</button>
              <button onClick={setAllTargets} disabled={dashboard.length === 0} style={{ background: "#22c55e", color: "#252638", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: dashboard.length === 0 ? "not-allowed" : "pointer", opacity: dashboard.length === 0 ? 0.6 : 1, fontSize: 12 }}>Fill targets</button>
              <button onClick={() => { setSlaBreach(false); setAuditLog(prev => [{ at: Date.now(), message: "Cleared SLA breach from banner" }, ...prev].slice(0, 8)); runLint(); }} disabled={!slaBreach} style={{ background: "#252638", color: slaBreach ? "#f9fafb" : "#a8adc4", border: "1px solid #525578", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: slaBreach ? "pointer" : "not-allowed", opacity: slaBreach ? 1 : 0.6, fontSize: 12 }}>Clear SLA breach</button>
            </div>
          </div>
        </div>
        {reminderBanner && (
          <div style={{ background: "#2e3045", border: "1px solid #525578", borderRadius: 12, padding: 12, color: "#fde68a" }}>Reminder: dashboard hasn’t been published in 7+ days.</div>
        )}
        {slaBreach && watchlist.length > 0 && (
          <div style={{ background: "#2f1114", border: "1px solid #525578", borderRadius: 12, padding: 12, color: "#fecdd3", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div>SLA breach simulated for watchlist widgets — route alerts to {escalationTarget || escalationChannel}.</div>
            <button onClick={() => { setSlaBreach(false); setAuditLog(prev => [{ at: Date.now(), message: "SLA breach cleared" }, ...prev].slice(0, 8)); runLint(); }} style={{ background: "#2e3045", color: "#f9fafb", border: "1px solid #525578", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>Clear breach</button>
          </div>
        )}
        {templateApplied && (
          <div style={{ background: "#252638", border: "1px solid #2e3045", borderRadius: 12, padding: 10, color: "#cbd5e1" }}>Template applied: {templateApplied}</div>
        )}
        {publishPreview.added.length + publishPreview.removed.length > 0 && (
          <div style={{ background: "#252638", border: "1px solid #2e3045", borderRadius: 12, padding: 12, color: "#f9fafb", display: "grid", gap: 6 }}>
            <div style={{ fontWeight: 800 }}>Publish diff</div>
            {publishPreview.added.length > 0 && <div style={{ color: "#22c55e" }}>Added: {publishPreview.added.join(", ")}</div>}
            {publishPreview.removed.length > 0 && <div style={{ color: "#fbbf24" }}>Removed: {publishPreview.removed.join(", ")}</div>}
          </div>
        )}
        {(() => {
          const blockers = [];
          if (maintenanceFreeze) blockers.push("Freeze");
          if (reviewStatus !== "approved") blockers.push("Review");
          const highLint = lintFindings.filter(f => f.level === "high").length;
          if (highLint) blockers.push(`${highLint} high lint`);
          const missingOwners = dataSources.filter(ds => !dataSourceOwners[ds.name]).length;
          if (missingOwners) blockers.push(`${missingOwners} owner missing`);
          const piiMissing = dataSources.filter(ds => !piiFlags[ds.id || ds.name]).length;
          if (piiMissing) blockers.push(`${piiMissing} PII unchecked`);
          if (!metadata.title || !metadata.owner || !metadata.tags) blockers.push("Metadata");
          if (blockers.length === 0) return null;
          return (
            <div style={{ background: "#252638", border: "1px solid #2e3045", borderRadius: 12, padding: 10, color: "#fcd34d", fontSize: 13, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontWeight: 700, color: "#fde68a" }}>Publish checklist:</span>
              {blockers.map((b, idx) => (
                <span key={idx} style={{ background: "#2e3045", border: "1px solid #525578", borderRadius: 10, padding: "4px 8px", color: "#cbd5e1", fontSize: 12 }}>{b}</span>
              ))}
            </div>
          );
        })()}
        {versions.length > 0 && (
          <div style={{ background: "#252638", border: "1px solid #2e3045", borderRadius: 12, padding: 12, display: "grid", gap: 6 }}>
            <div style={{ fontWeight: 800, color: "#cbd5e1" }}>Versions</div>
            {versions.map((v, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", color: "#94a3b8" }}>
                <span>{v.metadata?.title || "Untitled"} {v.label ? `· ${v.label}` : ""}</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <span>{new Date(v.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  {v.notes && <span style={{ color: "#cbd5e1", fontSize: 12 }}>Notes: {v.notes}</span>}
                  <button onClick={() => { setDashboard(v.dashboard || []); setDataSources(v.dataSources || []); setTargets(v.targets || {}); setMetadata(v.metadata || {}); setUnsaved(true); setAuditLog(prev => [{ at: Date.now(), message: "Rolled back to version" }, ...prev].slice(0, 8)); }} style={{ background: "#2e3045", color: "#f9fafb", border: "1px solid #525578", borderRadius: 8, padding: "4px 8px", fontWeight: 700, cursor: "pointer" }}>Rollback</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {webhookLog && (
          <div style={{ background: "#252638", border: "1px solid #2e3045", borderRadius: 10, padding: 10, color: "#bae6fd" }}>Webhook: {webhookLog}</div>
        )}
      </div>
      <div style={{ marginBottom: 18, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <select value={env} onChange={e => setEnv(e.target.value)} style={{ background: "#252638", color: "#f9fafb", border: "1px solid #2e3045", borderRadius: 8, padding: "10px 12px", fontWeight: 700 }}>
          <option value="dev">Dev</option>
          <option value="stage">Stage</option>
          <option value="prod">Prod</option>
        </select>
        <button onClick={fetchWidgets} disabled={devSandbox} style={{ background: devSandbox ? "#2e3045" : "#6366f1", color: devSandbox ? "#a8adc4" : "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: devSandbox ? "not-allowed" : "pointer", opacity: devSandbox ? 0.7 : 1 }}>Load Widget Library</button>
        <button onClick={fetchDataSources} disabled={devSandbox} style={{ background: devSandbox ? "#2e3045" : "#0ea5e9", color: devSandbox ? "#a8adc4" : "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: devSandbox ? "not-allowed" : "pointer", marginLeft: 0, opacity: devSandbox ? 0.7 : 1 }}>Load Data Sources</button>
        <button onClick={refreshSources} disabled={Object.keys(freshness).length === 0} style={{ background: Object.keys(freshness).length === 0 ? "#2e3045" : "#22c55e", color: Object.keys(freshness).length === 0 ? "#a8adc4" : "#252638", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: Object.keys(freshness).length === 0 ? "not-allowed" : "pointer", opacity: Object.keys(freshness).length === 0 ? 0.6 : 1 }}>Refresh Sources</button>
          <button onClick={autoRecheckSources} disabled={Object.keys(freshness).length === 0} style={{ background: "#252638", color: Object.keys(freshness).length === 0 ? "#a8adc4" : "#7dd3fc", border: "1px solid #525578", borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: Object.keys(freshness).length === 0 ? "not-allowed" : "pointer", opacity: Object.keys(freshness).length === 0 ? 0.6 : 1 }}>Auto Re-check</button>
        <input value={schedule} onChange={e => { setSchedule(e.target.value); setUnsaved(true); }} style={{ background: "#252638", color: "#f9fafb", border: "1px solid #2e3045", borderRadius: 8, padding: "8px 10px", fontWeight: 600 }} aria-label="Publish schedule" />
      </div>
      <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
        <div style={{ fontWeight: 700, color: "#f9fafb" }}>Metadata & compliance</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={metadata.title} onChange={e => { setMetadata({ ...metadata, title: e.target.value }); setUnsaved(true); }} placeholder="Title" style={{ flex: 1, minWidth: 160, background: "#252638", color: "#f9fafb", border: "1px solid #2e3045", borderRadius: 8, padding: "8px 10px" }} />
          <input value={metadata.owner} onChange={e => { setMetadata({ ...metadata, owner: e.target.value }); setUnsaved(true); }} placeholder="Owner" style={{ flex: 1, minWidth: 160, background: "#252638", color: "#f9fafb", border: "1px solid #2e3045", borderRadius: 8, padding: "8px 10px" }} />
          <input value={metadata.tags} onChange={e => { setMetadata({ ...metadata, tags: e.target.value }); setUnsaved(true); }} placeholder="Tags (comma separated)" style={{ flex: 2, minWidth: 200, background: "#252638", color: "#f9fafb", border: "1px solid #2e3045", borderRadius: 8, padding: "8px 10px" }} />
        </div>
        <textarea value={runbook} onChange={e => { setRunbook(e.target.value); setUnsaved(true); }} rows={2} placeholder="Runbook / Ops notes (e.g., how to respond to anomalies)" style={{ width: "100%", background: "#252638", color: "#f9fafb", border: "1px solid #2e3045", borderRadius: 10, padding: "8px 10px", fontSize: 13 }} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <select value={escalationChannel} onChange={e => { setEscalationChannel(e.target.value); setUnsaved(true); }} style={{ background: "#252638", color: "#f9fafb", border: "1px solid #2e3045", borderRadius: 8, padding: "8px 12px", fontWeight: 700 }}>
            <option value="slack">Slack</option>
            <option value="email">Email</option>
            <option value="pager">Pager</option>
          </select>
          <input value={escalationTarget} onChange={e => { setEscalationTarget(e.target.value); setUnsaved(true); }} placeholder="Escalation target (channel, email, rotation)" style={{ flex: 1, minWidth: 200, background: "#252638", color: "#f9fafb", border: "1px solid #2e3045", borderRadius: 8, padding: "8px 10px" }} />
          <div style={{ color: "#a8adc4", fontSize: 12 }}>Alert routing for on-call.</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input value={reviewer} onChange={e => { setReviewer(e.target.value); setUnsaved(true); }} placeholder="Reviewer" style={{ flex: 1, minWidth: 160, background: "#252638", color: "#f9fafb", border: "1px solid #2e3045", borderRadius: 8, padding: "8px 10px" }} />
          <select value={reviewStatus} onChange={e => { setReviewStatus(e.target.value); setUnsaved(true); }} style={{ background: "#252638", color: "#f9fafb", border: "1px solid #2e3045", borderRadius: 8, padding: "8px 12px", fontWeight: 700 }}>
            <option value="pending">Pending</option>
            <option value="requested">Requested</option>
            <option value="approved">Approved</option>
            <option value="changes">Changes needed</option>
          </select>
          <div style={{ color: "#a8adc4", fontSize: 12 }}>Approval required to publish.</div>
          <button onClick={() => { setReviewStatus("requested"); setUnsaved(true); setAuditLog(prev => [{ at: Date.now(), message: "Review requested" }, ...prev].slice(0, 8)); }} style={{ background: "#2e3045", color: "#f9fafb", border: "1px solid #525578", borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Request review</button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input value={versionLabel} onChange={e => { setVersionLabel(e.target.value); setUnsaved(true); }} placeholder="Version label (e.g., Q1 refresh)" style={{ flex: 1, minWidth: 200, background: "#252638", color: "#f9fafb", border: "1px solid #2e3045", borderRadius: 8, padding: "8px 10px" }} />
          <input value={versionNotes} onChange={e => { setVersionNotes(e.target.value); setUnsaved(true); }} placeholder="Version notes" style={{ flex: 2, minWidth: 240, background: "#252638", color: "#f9fafb", border: "1px solid #2e3045", borderRadius: 8, padding: "8px 10px" }} />
        </div>
      </div>
      <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
        <div style={{ fontWeight: 700, color: "#f9fafb" }}>Layout & Targets</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#cbd5e1" }}>Columns
            <input type="number" min="1" max="6" value={layoutCols} onChange={e => setLayoutCols(Number(e.target.value) || 1)} style={{ width: 64, background: "#252638", color: "#f9fafb", border: "1px solid #2e3045", borderRadius: 8, padding: "6px 8px" }} />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#cbd5e1" }}>Row height
            <input type="number" min="120" max="480" value={rowHeight} onChange={e => setRowHeight(Number(e.target.value) || 120)} style={{ width: 80, background: "#252638", color: "#f9fafb", border: "1px solid #2e3045", borderRadius: 8, padding: "6px 8px" }} /> px
          </label>
          <div style={{ color: "#a8adc4", fontSize: 13 }}>Preview: {layoutCols} cols · {rowHeight}px rows</div>
          {watchlist.length > 0 && <div style={{ color: "#7dd3fc", fontSize: 13 }}>Watchlist: {watchlist.length} widget{watchlist.length > 1 ? "s" : ""}</div>}
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ color: "#a8adc4", fontSize: 13 }}>Set target notes per widget</div>
          {dashboard.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", background: "#252638", border: "1px solid #2e3045", borderRadius: 10, padding: 8 }}>
              <input value={defaultTarget} onChange={e => { setDefaultTarget(e.target.value); setUnsaved(true); }} placeholder="Default target" style={{ minWidth: 180, background: "#252638", color: "#f9fafb", border: "1px solid #2e3045", borderRadius: 8, padding: "8px 10px" }} />
              <button onClick={setAllTargets} style={{ background: "#22c55e", color: "#252638", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 800, cursor: "pointer" }}>Apply to missing targets</button>
              <div style={{ color: "#a8adc4", fontSize: 12 }}>Uses saved default or prompts you.</div>
            </div>
          )}
          {dashboard.map((w, idx) => (
            <div key={w.id} style={{ display: "flex", gap: 8, alignItems: "center", background: "#252638", border: "1px solid #2e3045", borderRadius: 10, padding: 8 }}>
              <div style={{ color: "#7dd3fc", fontWeight: 700, minWidth: 140 }}>{w.name}</div>
              <input value={targets[w.id] || ""} onChange={e => { setTargets(prev => ({ ...prev, [w.id]: e.target.value })); setUnsaved(true); }} placeholder="Target / SLA" style={{ flex: 1, background: "#252638", color: "#f9fafb", border: "1px solid #2e3045", borderRadius: 8, padding: "8px 10px" }} />
            </div>
          ))}
          {dashboard.length === 0 && <div style={{ color: "#a8adc4", fontSize: 13 }}>Add widgets to set targets.</div>}
        </div>
      </div>
      <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
        <div style={{ fontWeight: 700, color: "#f9fafb" }}>Templates</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {Object.keys(templates).map(key => (
            <button key={key} onClick={() => applyTemplate(key)} style={{ background: "#2e3045", color: "#f9fafb", border: "1px solid #525578", borderRadius: 10, padding: "10px 14px", fontWeight: 700, cursor: "pointer" }}>{key}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 18, marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Widgets</div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search widgets" style={{ width: "100%", marginBottom: 8, background: "#252638", color: "#f9fafb", border: "1px solid #2e3045", borderRadius: 8, padding: "8px 10px" }} />
          <ul style={{ paddingLeft: 18 }}>
            {filteredWidgets.map((w, idx) => (
              <li key={w.id || idx} draggable onDragStart={() => handleDragStart(idx)} style={{ marginBottom: 8, background: "#3d4058", borderRadius: 8, padding: 8, cursor: "grab", color: '#f9fafb' }}>{w.name}</li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 2 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Dashboard</div>
          <ul style={{ paddingLeft: 18 }}>
            {dashboard.map((w, idx) => (
              <li key={w.id} style={{ marginBottom: 8, background: "#252638", borderRadius: 8, padding: 8, color: '#6366f1' }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span>{w.name}</span>
                  {targets[w.id] && <span style={{ color: "#e9ebf5", fontSize: 12 }}>Target: {targets[w.id]}</span>}
                  <button onClick={() => { setWatchlist(prev => prev.includes(w.id) ? prev.filter(id => id !== w.id) : [...prev, w.id]); setUnsaved(true); }} style={{ background: watchlist.includes(w.id) ? "#0ea5e9" : "#2e3045", color: watchlist.includes(w.id) ? "#e0f2fe" : "#f9fafb", border: "1px solid #525578", borderRadius: 8, padding: "4px 8px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>{watchlist.includes(w.id) ? "Watchlisted" : "Watch"}</button>
                </div>
                <div style={{ marginTop: 6, display: "grid", gap: 6 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <input placeholder="Add comment" onKeyDown={e => { if (e.key === "Enter") { addComment(w.id, e.target.value); e.target.value = ""; } }} style={{ flex: 1, minWidth: 180, background: "#252638", color: "#f9fafb", border: "1px solid #2e3045", borderRadius: 8, padding: "6px 8px", fontSize: 13 }} />
                    <span style={{ color: "#a8adc4", fontSize: 12 }}>Comments: {(comments[w.id] || []).length}</span>
                  </div>
                  {(comments[w.id] || []).slice(-2).map((c, cidx) => (
                    <div key={cidx} style={{ color: "#a8adc4", fontSize: 12, background: "#252638", border: "1px solid #2e3045", borderRadius: 8, padding: 6 }}>
                      {c.text} · {new Date(c.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <button onClick={handleAddWidget} style={{ background: "#22c55e", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginTop: 8 }}>Add Widget</button>
          {watchlist.length > 0 && (
            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ color: "#a8adc4", fontSize: 12 }}>Watchlist items: {watchlist.length}</div>
              <button onClick={clearWatchlist} style={{ background: "#2e3045", color: "#f9fafb", border: "1px solid #525578", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Clear watchlist</button>
            </div>
          )}
          <div style={{ marginTop: 8, color: "#a8adc4", fontSize: 12 }}>Keyboard: Enter to add comment · Space to toggle watchlist · Drag to reorder.</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Data Sources</div>
          <ul style={{ paddingLeft: 18 }}>
            {dataSources.map((ds, idx) => (
              <li key={ds.id || idx} style={{ marginBottom: 8, background: "#3d4058", borderRadius: 8, padding: 8, color: '#f9fafb' }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {ds.name}
                    {!piiFlags[ds.id || ds.name] && <span style={{ background: "#2f1114", color: "#fecdd3", border: "1px solid #525578", borderRadius: 8, padding: "2px 8px", fontSize: 11 }}>PII unchecked</span>}
                  </span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ color: "#a8adc4", fontSize: 12 }}>Freshness: {formatFreshness(ds.name)}</span>
                    <span style={{ color: "#7dd3fc", fontSize: 12 }}>Latency: {latencyMap[ds.name] ? `${latencyMap[ds.name]}ms` : "n/a"}</span>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#cbd5e1", fontSize: 12 }}>
                      PII reviewed
                      <input type="checkbox" checked={piiFlags[ds.id || ds.name] || false} onChange={e => { setPiiFlags(prev => ({ ...prev, [ds.id || ds.name]: e.target.checked })); setUnsaved(true); }} />
                    </label>
                    <button onClick={() => { setPiiFlags(prev => ({ ...prev, [ds.id || ds.name]: true })); setUnsaved(true); }} style={{ background: "#252638", color: "#a5f3fc", border: "1px solid #2e3045", borderRadius: 8, padding: "4px 8px", fontWeight: 700, cursor: "pointer", fontSize: 11 }}>Mark PII reviewed</button>
                    {(() => {
                      const minutes = freshness[ds.name] ? Math.round((Date.now() - freshness[ds.name]) / 60000) : 9999;
                      const stale = minutes > 1440;
                      const dep = dependencyMap.find(d => d.source === ds.name);
                      const unbound = !dep || (dep.widgets || []).length === 0;
                      return (
                        <span style={{ color: stale ? "#f87171" : unbound ? "#fbbf24" : "#22c55e", fontSize: 12 }}>
                          {stale ? "SLA: stale" : unbound ? "Unbound" : "SLA: healthy"}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {dataSources.length > 0 && (
                <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <button onClick={() => { const updated = { ...piiFlags }; dataSources.forEach(ds => { updated[ds.id || ds.name] = true; }); setPiiFlags(updated); setUnsaved(true); }} style={{ background: "#0ea5e9", color: "#252638", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 800, cursor: "pointer" }}>Mark all PII reviewed</button>
                  <div style={{ color: "#a8adc4", fontSize: 12 }}>Use when legal/compliance review is complete.</div>
                </div>
              )}
                  <input value={dataSourceOwners[ds.name] || ""} onChange={e => { setDataSourceOwners(prev => ({ ...prev, [ds.name]: e.target.value })); setUnsaved(true); }} placeholder="Owner" style={{ minWidth: 140, background: "#252638", color: "#f9fafb", border: "1px solid #2e3045", borderRadius: 8, padding: "6px 8px", fontSize: 12 }} />
                  <input value={dataSourceNotes[ds.name] || ""} onChange={e => { setDataSourceNotes(prev => ({ ...prev, [ds.name]: e.target.value })); setUnsaved(true); }} placeholder="Notes" style={{ flex: 1, minWidth: 180, background: "#252638", color: "#f9fafb", border: "1px solid #2e3045", borderRadius: 8, padding: "6px 8px", fontSize: 12 }} />
                </div>
              </li>
            ))}
          </ul>
          {(driftAdded.length > 0 || driftRemoved.length > 0) && (
            <div style={{ marginTop: 10, background: "#2e3045", border: "1px solid #525578", borderRadius: 10, padding: 10, color: "#fde68a", fontSize: 13 }}>
              <div style={{ fontWeight: 700, color: "#fcd34d" }}>Environment drift since last publish</div>
              {driftAdded.length > 0 && <div>Added: {driftAdded.join(", ")}</div>}
              {driftRemoved.length > 0 && <div>Removed: {driftRemoved.join(", ")}</div>}
            </div>
          )}
          {dependencyMap.length > 0 && (
            <div style={{ marginTop: 10, background: "#252638", border: "1px solid #2e3045", borderRadius: 10, padding: 10, display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 700, color: "#cbd5e1" }}>Dependencies</div>
              {dependencyMap.map((dep, idx) => (
                <div key={idx} style={{ color: "#a8adc4", fontSize: 12 }}>
                  {dep.source}: {(dep.widgets || []).length === 0 ? "no widgets linked" : dep.widgets.join(", ")}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#0d0d11", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Import</button>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} aria-label="Import dashboard" />
        <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Export</button>
        <button onClick={downloadDraft} style={{ background: "#2e3045", color: "#f9fafb", border: "1px solid #525578", borderRadius: 8, padding: "10px 18px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Download draft JSON</button>
        <button onClick={copyGuardrailSummary} style={{ background: "#252638", color: "#f9fafb", border: "1px solid #525578", borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Copy guardrail summary</button>
        <button onClick={copySlaSnapshot} style={{ background: "#252638", color: "#f9fafb", border: "1px solid #525578", borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Copy SLA snapshot</button>
        <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#cbd5e1", fontSize: 12 }}>
          <input type="checkbox" checked={exportWithDiff} onChange={e => { setExportWithDiff(e.target.checked); setUnsaved(true); }} />Include diffs
        </label>
        {exported && <a href={exported} download="dashboard.json" style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 600 }}>Download</a>}
        {shareUrl && <a href={shareUrl} download="dashboard-share.json" style={{ marginLeft: 8, color: "#7dd3fc", fontWeight: 600 }}>Share JSON</a>}
        {previewToken && <a href={previewToken} download="dashboard-preview.json" style={{ marginLeft: 8, color: "#93c5fd", fontWeight: 600 }}>Preview link</a>}
        {exportChecksum && <span style={{ marginLeft: 8, color: "#a8adc4", fontSize: 12 }}>Checksum: {exportChecksum}</span>}
      </div>
      {imported && <div style={{ color: "#22c55e", marginBottom: 8 }}>Imported: {imported}</div>}
      {error && (
        <div style={{ color: "#ef4444", marginBottom: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span>{error}</span>
          {quickFixForIssue(error) === "retry" && <button onClick={() => { setError(""); fetchWidgets(); }} style={{ background: "#22c55e", color: "#252638", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>Retry fetch</button>}
          {quickFixForIssue(error) === "reset" && <button onClick={() => setDashboard([])} style={{ background: "#22c55e", color: "#252638", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>Reset dashboard</button>}
        </div>
      )}
      {dashboard.length >= 10 && <div style={{ color: "#fbbf24", fontSize: 13, marginBottom: 8 }}>Perf detail: {dashboard.length} widgets — consider splitting dashboards.</div>}

      {history.length > 0 && (
        <div style={{ marginBottom: 18, background: "#252638", border: "1px solid #2e3045", borderRadius: 12, padding: 12, display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 800, color: "#f9fafb" }}>Recent dashboards</div>
            <div style={{ color: "#a8adc4", fontSize: 12 }}>Last {Math.min(3, history.length)} shown</div>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {history.slice(0, 3).map((h, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", background: "#252638", border: "1px solid #2e3045", borderRadius: 10, padding: "8px 10px" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#f9fafb" }}>{h.summary || "Snapshot"}</div>
                  <div style={{ color: "#a8adc4", fontSize: 12 }}>{h.at ? new Date(h.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "recent"} · {h.env}</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button onClick={() => restoreSnapshot(h)} style={{ background: "#2e3045", color: "#f9fafb", border: "1px solid #525578", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>Load</button>
                  <button onClick={() => { restoreSnapshot(h); setTimeout(() => handleExport(), 0); }} disabled={devSandbox} style={{ background: devSandbox ? "#2e3045" : "#22c55e", color: devSandbox ? "#a8adc4" : "#252638", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: devSandbox ? "not-allowed" : "pointer", opacity: devSandbox ? 0.6 : 1 }}>{devSandbox ? "Sandbox" : "Re-export"}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {auditLog.length > 0 && (
        <div style={{ marginBottom: 18, background: "#252638", border: "1px solid #2e3045", borderRadius: 12, padding: 12, display: "grid", gap: 6 }}>
          <div style={{ fontWeight: 800, color: "#cbd5e1" }}>Audit trail</div>
          {auditLog.map((a, idx) => (
            <div key={idx} style={{ display: "grid", gap: 4, color: "#94a3b8", fontSize: 13, borderBottom: "1px solid #2e3045", paddingBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <span>{a.message}</span>
                <span>{a.at ? new Date(a.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</span>
              </div>
              {(a.guardrails || a.slaSnapshot) && (
                <div style={{ display: "grid", gap: 4, background: "#252638", border: "1px solid #2e3045", borderRadius: 8, padding: 8 }}>
                  {a.guardrails && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ color: "#cbd5e1", fontSize: 12, wordBreak: "break-word" }}>Guardrails: {a.guardrails}</div>
                      <button onClick={() => { if (navigator?.clipboard?.writeText) navigator.clipboard.writeText(a.guardrails); }} style={{ background: "#2e3045", color: "#f9fafb", border: "1px solid #525578", borderRadius: 6, padding: "4px 8px", fontWeight: 700, cursor: "pointer", fontSize: 11 }}>Copy</button>
                    </div>
                  )}
                  {a.slaSnapshot && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <div style={{ color: "#cbd5e1", fontSize: 12, wordBreak: "break-word" }}>SLA: {a.slaSnapshot}</div>
                      <button onClick={() => { if (navigator?.clipboard?.writeText) navigator.clipboard.writeText(a.slaSnapshot); }} style={{ background: "#2e3045", color: "#f9fafb", border: "1px solid #525578", borderRadius: 6, padding: "4px 8px", fontWeight: 700, cursor: "pointer", fontSize: 11 }}>Copy</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {publishPreview.added.length + publishPreview.removed.length === 0 && versions.length === 0 && (
        <div style={{ marginBottom: 18, background: "#252638", border: "1px solid #2e3045", borderRadius: 10, padding: 12, color: "#a8adc4", fontSize: 13 }}>
          Tip: Run lint, set metadata, mark PII reviewed, then publish to create versions and diffs.
        </div>
      )}
      <form onSubmit={e => { e.preventDefault(); handleFeedback(); }} style={{ marginTop: 32, background: "#3d4058", borderRadius: 12, padding: 20 }} aria-label="Send feedback">
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Feedback</div>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          rows={2}
          style={{ width: "100%", fontSize: 15, padding: 10, borderRadius: 8, border: "1px solid #6366f1", marginBottom: 12, background: "#252638", color: "#f9fafb" }}
          placeholder="Share your feedback or suggestions..."
          aria-label="Feedback input"
        />
        <button type="submit" style={{ background: "#6366f1", color: "#0d0d11", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Send Feedback</button>
      </form>
    </div>
  );
}



