import React, { useEffect, useMemo, useRef, useState } from "react";
import BackButton from "./BackButton";

const STORAGE_KEY = "workflow-orchestrator:draft";
const STORAGE_BACKUP_KEY = "workflow-orchestrator:backup";
const DRAFT_VERSION = 2;

const sanitizeSteps = (steps = []) => {
  if (!Array.isArray(steps)) return [];
  let maxId = steps.reduce((m, s) => typeof s.id === "number" ? Math.max(m, s.id) : m, 0) || 0;
  const seen = new Set();
  return steps.map((s, idx) => {
    let id = typeof s.id === "number" ? s.id : ++maxId;
    if (seen.has(id)) id = ++maxId;
    seen.add(id);
    return {
      id,
      name: s.name || `Step ${idx + 1}`,
      type: ["trigger", "action", "condition"].includes(s.type) ? s.type : "action",
      config: s.config || ""
    };
  });
};

const migrateDraft = (draft = {}) => {
  const migrated = { ...draft };
  migrated.version = DRAFT_VERSION;
  migrated.steps = sanitizeSteps(draft.steps || []);
  return migrated;
};

const hashString = (input) => {
  let h = 0;
  const str = typeof input === "string" ? input : JSON.stringify(input || {});
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return Math.abs(h).toString(16);
};

export default function WorkflowOrchestrator() {
  const [workflowName, setWorkflowName] = useState("SEO Autopilot Orchestration");
  const [objective, setObjective] = useState("Keep SEO, product sync, and alerts in one orchestrated flow.");
  const [env, setEnv] = useState("dev");
  const [versionTag, setVersionTag] = useState("v1");
  const [tags, setTags] = useState("seo, automation, safety-net");
  const [approvalRequired, setApprovalRequired] = useState(true);
  const [approverEmail, setApproverEmail] = useState("ops@aura-core.ai");
  const [riskLevel, setRiskLevel] = useState("low");
  const [owner, setOwner] = useState("automation-lead@brand.com");
  const [steps, setSteps] = useState([
    { id: 1, name: "Trigger", type: "trigger", config: "Order placed" },
    { id: 2, name: "Action", type: "action", config: "Send Slack alert to #ops" }
  ]);
  const [selectedStep, setSelectedStep] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [issueHelp, setIssueHelp] = useState(null);
    const devSandbox = env === "dev";
  const [importError, setImportError] = useState("");
  const importRef = useRef(null);
  const [testCases, setTestCases] = useState([
    { id: "payload-small", name: "Small payload happy path", payload: { total: 50 }, expect: "ok" },
    { id: "payload-large", name: "Large payload guardrail", payload: { total: 9999 }, expect: "warn" },
    { id: "missing-trigger", name: "Missing trigger should fail", payload: { total: 25 }, expect: "fail" }
  ]);
  const [testResults, setTestResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [rolloutPercent, setRolloutPercent] = useState(10);
  const [autoRevert, setAutoRevert] = useState(true);
  const [errorSpikeThreshold, setErrorSpikeThreshold] = useState(5);
  const [perf, setPerf] = useState({ latencyMs: 320, successRate: 0.992 });
  const [recentErrors, setRecentErrors] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [selectedStepIds, setSelectedStepIds] = useState([]);
  const [clipboard, setClipboard] = useState([]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [slackChannel, setSlackChannel] = useState("");
  const [queueEnabled, setQueueEnabled] = useState(false);
  const [testReportUrl, setTestReportUrl] = useState(null);
  const [lastPublish, setLastPublish] = useState(null);
  const [fixtureEnv, setFixtureEnv] = useState("dev");
  const [latencyBudgetMs, setLatencyBudgetMs] = useState(850);
  const [errorBudgetPct, setErrorBudgetPct] = useState(3);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);

    const quickFixForIssue = (issue = "") => {
      const lower = issue.toLowerCase();
      if (lower.includes("approver") || lower.includes("approval")) return "approver";
      if (lower.includes("prod") || lower.includes("note")) return "prod-note";
      if (lower.includes("trigger") || lower.includes("action")) return "trigger-action";
      if (lower.includes("duplicate")) return "dedupe-labels";
      return null;
    };

    const restoreSnapshot = (snap) => {
      if (!snap) return;
      setSteps(snap.steps || steps);
      if (snap.env) setEnv(snap.env);
      if (snap.versionTag) setVersionTag(snap.versionTag);
      if (typeof snap.approvalRequired === "boolean") setApprovalRequired(snap.approvalRequired);
      if (snap.workflowName) setWorkflowName(snap.workflowName);
      if (snap.confirmationNote !== undefined) setConfirmationNote(snap.confirmationNote);
      setLastRunSnapshot(snap);
    };
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [preflightIssues, setPreflightIssues] = useState([]);
  const [confirmationNote, setConfirmationNote] = useState("");
  const [testStatus, setTestStatus] = useState("idle"); // idle | running | passed
  const [stepStatuses, setStepStatuses] = useState({});
  const [payloadPreset, setPayloadPreset] = useState("abandoned-cart");
  const [lastRunSnapshot, setLastRunSnapshot] = useState(null);
  const [versionName, setVersionName] = useState("v1");
  const [versions, setVersions] = useState([]);
  const [draftStatus, setDraftStatus] = useState("idle"); // idle | saving | saved
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [role] = useState(() => {
    if (typeof window === "undefined") return "admin";
    return window.__AURA_USER?.role || window.localStorage.getItem("aura-role") || "admin";
  });
  const [accessRequested, setAccessRequested] = useState(false);
  const [dirtySinceSave, setDirtySinceSave] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [preflightTrace, setPreflightTrace] = useState([]);
  const [preflightStatus, setPreflightStatus] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(window.localStorage.getItem("suite:status:workflow-orchestrator")) || null;
    } catch {
      return null;
    }
  });
  const [showPreflightPopover, setShowPreflightPopover] = useState(false);
  const applyQuickFix = (kind) => {
    if (isViewer) return;
    if (kind === "approver") {
      setApprovalRequired(true);
      setApproverEmail(prev => prev || "ops@shopify-brand.com");
    }
    if (kind === "prod-note") {
      if (env === "prod" || riskLevel === "high") {
        setConfirmationNote(prev => prev || "Production rollout note: guardrails reviewed and approved.");
      } else {
        setEnv("prod");
        setConfirmationNote("Production rollout note: guardrails reviewed and approved.");
      }
    }
    if (kind === "trigger-action") {
      setSteps(prev => {
        if (!prev.length) {
          return [
            { id: 1, name: "Trigger", type: "trigger", config: "Order placed" },
            { id: 2, name: "Action", type: "action", config: "Send Slack alert" }
          ];
        }
        const next = [...prev];
        if (!next[0] || next[0].type !== "trigger") {
          const nextId = (Math.max(...next.map(s => s.id)) || 0) + 1;
          next.unshift({ id: nextId, name: "Trigger", type: "trigger", config: "Order placed" });
        }
        if (!next.find(s => s.type === "action")) {
          const nextId = (Math.max(...next.map(s => s.id)) || 0) + 1;
          next.push({ id: nextId, name: "Action", type: "action", config: "Send Slack alert" });
        }
        return next;
      });
    }
    if (kind === "dedupe-labels") {
      setSteps(prev => {
        const seen = new Map();
        return prev.map(step => {
          const base = step.name || "Step";
          const key = base.trim().toLowerCase();
          const count = seen.get(key) || 0;
          seen.set(key, count + 1);
          return count === 0 ? step : { ...step, name: `${base} (${count + 1})` };
        });
      });
    }
  };
  const hydratedRef = useRef(false);
  const dirtySkipRef = useRef(true);

  const clearPreflightStatus = () => {
    setPreflightStatus(null);
    setPreflightIssues([]);
    setPreflightTrace([]);
    try { window.localStorage.removeItem("suite:status:workflow-orchestrator"); } catch (_) {}
  };

  const downloadPreflightReport = () => {
    const payload = { status: preflightStatus, issues: preflightIssues, trace: preflightTrace, generatedAt: Date.now() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workflow-orchestrator-preflight.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const attachPreflightForReviewer = () => {
    const payload = {
      reviewer: reviewerEmail || "reviewer@shopify-brand.com",
      status: preflightStatus,
      issues: preflightIssues,
      trace: preflightTrace,
      generatedAt: Date.now()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workflow-orchestrator-preflight-review.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const isViewer = role === "viewer";
  const isEnvLocked = env === "prod" && role !== "admin";
  const traceByStep = useMemo(() => {
    const map = new Map();
    preflightTrace.forEach(t => map.set(t.idx, t.issues || []));
    return map;
  }, [preflightTrace]);

  const triggerTemplates = [
    { label: "Order Placed", config: "Trigger when an order is placed with value > $50" },
    { label: "Low Inventory", config: "Trigger when any SKU inventory < 10" },
    { label: "SEO Issue", config: "Trigger when new 404 or critical SEO issue detected" }
  ];
  const actionTemplates = [
    { label: "Send Slack", config: "Send Slack alert to #ops with order and customer context" },
    { label: "Create Ticket", config: "Open Jira ticket in SEO board with issue payload" },
    { label: "Re-run Crawl", config: "Trigger site crawl and refresh product feeds" }
  ];

  const galleryTemplates = [
    { id: "canary", title: "Canary rollout", description: "Gradual rollout with auto-revert and error budget guardrails.", playbook: "seoFix", rollout: 20, autoRevert: true, badges: ["rollout", "safety"] },
    { id: "retention", title: "Churn save", description: "Detect churn risk and trigger retention offers with CX alerting.", playbook: "churnSave", rollout: 50, badges: ["retention", "cx"] },
    { id: "catalog", title: "Product sync", description: "Keep catalog and marketing feeds in sync with alerts.", playbook: "productSync", rollout: 80, badges: ["catalog", "ops"] }
  ];

  const payloadPresets = [
    { id: "abandoned-cart", name: "Abandoned Cart", payload: { customer: "jane@example.com", subtotal: 120 } },
    { id: "seo-issue", name: "SEO Issue", payload: { url: "/product/slug", issue: "404 detected" } },
    { id: "high-aov", name: "High AOV", payload: { customer: "vip@example.com", subtotal: 820 } }
  ];

  // Load draft on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const backup = window.sessionStorage.getItem(STORAGE_BACKUP_KEY);
    const source = saved || backup;
    if (!source) return;
    try {
      const parsed = migrateDraft(JSON.parse(source));
      if (parsed.workflowName) setWorkflowName(parsed.workflowName);
      if (parsed.objective) setObjective(parsed.objective);
      if (parsed.env) setEnv(parsed.env);
      if (parsed.versionTag) setVersionTag(parsed.versionTag);
      if (parsed.tags) setTags(parsed.tags);
      if (typeof parsed.approvalRequired === "boolean") setApprovalRequired(parsed.approvalRequired);
      if (parsed.approverEmail) setApproverEmail(parsed.approverEmail);
      if (parsed.riskLevel) setRiskLevel(parsed.riskLevel);
      if (parsed.owner) setOwner(parsed.owner);
      if (parsed.steps) setSteps(parsed.steps);
      if (parsed.selectedStep) setSelectedStep(parsed.selectedStep);
      if (parsed.confirmationNote) setConfirmationNote(parsed.confirmationNote);
      if (parsed.payloadPreset) setPayloadPreset(parsed.payloadPreset);
      if (parsed.versionName) setVersionName(parsed.versionName);
      if (parsed.versions) setVersions(parsed.versions);
      if (parsed.lastSavedAt) setLastSavedAt(parsed.lastSavedAt);
      if (typeof parsed.rolloutPercent === "number") setRolloutPercent(parsed.rolloutPercent);
      if (parsed.autoRevert !== undefined) setAutoRevert(parsed.autoRevert);
      if (typeof parsed.errorSpikeThreshold === "number") setErrorSpikeThreshold(parsed.errorSpikeThreshold);
      if (typeof parsed.latencyBudgetMs === "number") setLatencyBudgetMs(parsed.latencyBudgetMs);
      if (typeof parsed.errorBudgetPct === "number") setErrorBudgetPct(parsed.errorBudgetPct);
      if (parsed.queueEnabled !== undefined) setQueueEnabled(parsed.queueEnabled);
      if (parsed.slackChannel) setSlackChannel(parsed.slackChannel);
      if (parsed.webhookUrl) setWebhookUrl(parsed.webhookUrl);
      if (parsed.lastPublish) setLastPublish(parsed.lastPublish);
    } catch (err) {
      console.warn("Failed to parse orchestrator draft", err);
    }
  }, []);

  // Mark dirty after hydration on meaningful changes
  useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }
    if (dirtySkipRef.current) {
      dirtySkipRef.current = false;
      return;
    }
    setDirtySinceSave(true);
  }, [workflowName, objective, env, versionTag, tags, approvalRequired, approverEmail, riskLevel, owner, steps, confirmationNote, payloadPreset, versionName]);

  // Autosave draft with debounce
  useEffect(() => {
    if (typeof window === "undefined") return;
    setDraftStatus("saving");
    const handle = setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        workflowName,
        objective,
        env,
        versionTag,
        tags,
        approvalRequired,
        approverEmail,
        riskLevel,
        owner,
        steps,
        selectedStep,
        confirmationNote,
        payloadPreset,
        versionName,
        versions,
        lastSavedAt: Date.now(),
        rolloutPercent,
        autoRevert,
        errorSpikeThreshold,
        latencyBudgetMs,
        errorBudgetPct,
        queueEnabled,
        slackChannel,
        webhookUrl,
        lastPublish,
        version: DRAFT_VERSION,
        signature: stepSignature,
        metrics: flowMetrics
      }));
      try { window.sessionStorage.setItem(STORAGE_BACKUP_KEY, window.localStorage.getItem(STORAGE_KEY)); } catch (_) {}
      setDraftStatus("saved");
      setLastSavedAt(Date.now());
      setDirtySinceSave(false);
    }, 450);
    return () => clearTimeout(handle);
  }, [workflowName, objective, env, versionTag, tags, approvalRequired, approverEmail, riskLevel, owner, steps, selectedStep, confirmationNote, payloadPreset, versionName, versions, rolloutPercent, autoRevert, errorSpikeThreshold, latencyBudgetMs, errorBudgetPct, queueEnabled, slackChannel, webhookUrl, lastPublish]);

  // Exit warning for unsaved/guardrail issues
  useEffect(() => {
    const handler = (e) => {
      if (dirtySinceSave || preflightIssues.length) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirtySinceSave, preflightIssues.length]);

  const pushUndoSnapshot = () => {
    setUndoStack(prev => [...prev.slice(-9), JSON.parse(JSON.stringify(steps))]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (!undoStack.length) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack(undoStack.slice(0, -1));
    setRedoStack(prev => [...prev.slice(-9), JSON.parse(JSON.stringify(steps))]);
    setSteps(previous);
  };

  const handleRedo = () => {
    if (!redoStack.length) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(redoStack.slice(0, -1));
    setUndoStack(prev => [...prev.slice(-9), JSON.parse(JSON.stringify(steps))]);
    setSteps(next);
  };

  const handleStepChange = (id, changes) => {
    if (isViewer) return;
    pushUndoSnapshot();
    setSteps(steps.map(s => s.id === id ? { ...s, ...changes } : s));
  };

  const validateSchema = (data) => {
    const errs = [];
    if (!data || typeof data !== "object") errs.push("Payload must be an object");
    if (!Array.isArray(data.steps)) errs.push("steps must be an array");
    if (Array.isArray(data.steps)) {
      data.steps.forEach((s, idx) => {
        if (typeof s.id !== "number") errs.push(`steps[${idx}].id must be a number`);
        if (!s.name) errs.push(`steps[${idx}].name required`);
        if (!s.type || !["trigger", "action", "condition"].includes(s.type)) errs.push(`steps[${idx}].type invalid`);
        if (!s.config) errs.push(`steps[${idx}].config required`);
      });
    }
    if (data.rolloutPercent !== undefined && (typeof data.rolloutPercent !== "number" || data.rolloutPercent < 1 || data.rolloutPercent > 100)) errs.push("rolloutPercent must be 1-100");
    if (data.errorSpikeThreshold !== undefined && (typeof data.errorSpikeThreshold !== "number" || data.errorSpikeThreshold < 1)) errs.push("errorSpikeThreshold must be >=1");
    if (data.latencyBudgetMs !== undefined && (typeof data.latencyBudgetMs !== "number" || data.latencyBudgetMs < 50)) errs.push("latencyBudgetMs must be >=50");
    if (data.errorBudgetPct !== undefined && (typeof data.errorBudgetPct !== "number" || data.errorBudgetPct <= 0 || data.errorBudgetPct >= 50)) errs.push("errorBudgetPct must be between 0 and 50");
    if (data.queueEnabled !== undefined && typeof data.queueEnabled !== "boolean") errs.push("queueEnabled must be boolean");
    if (data.autoRevert !== undefined && typeof data.autoRevert !== "boolean") errs.push("autoRevert must be boolean");
    if (data.webhookUrl && !/^https?:\/\//i.test(data.webhookUrl)) errs.push("webhookUrl must be http(s)");
    return errs;
  };

  const runPreflight = () => {
    const issues = [];
    const trace = [];
    const hasTrigger = steps.some(s => s.type === "trigger");
    const hasAction = steps.some(s => s.type === "action");
    const tooManySteps = steps.length > 20;
    const hardCapSteps = steps.length > 50;
    const duplicateIds = new Set();
    const dupIdHits = [];
    const nameCounts = steps.reduce((acc, s) => {
      const key = (s.name || "").trim().toLowerCase();
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    steps.forEach(s => {
      if (duplicateIds.has(s.id)) dupIdHits.push(s.id);
      duplicateIds.add(s.id);
    });

    if (!workflowName.trim()) issues.push("Workflow name required.");
    if (!hasTrigger) issues.push("At least one trigger is required.");
    if (steps[0]?.type !== "trigger") issues.push("First step should be a trigger.");
    if (!hasAction) issues.push("At least one action is required.");
    if (steps.length && steps[steps.length - 1]?.type !== "action") issues.push("Consider ending with an action/terminal step.");
    if (approvalRequired && !approverEmail) issues.push("Approver email required for approvals.");
    if (env === "prod" && (riskLevel === "high" || approvalRequired) && !confirmationNote.trim()) issues.push("Prod/high risk requires confirmation note.");
    if (dupIdHits.length) issues.push("Duplicate step IDs detected.");
    if (tooManySteps) issues.push("Flow too large: consider splitting (20+ steps).");
    if (hardCapSteps) issues.push("Step cap exceeded (50). Trim before running.");
    const payloadSize = JSON.stringify(previewPayload).length;
    if (payloadSize > 12000) issues.push(`Payload ~${Math.round(payloadSize / 1024)}KB may exceed transport limits.`);
    if (perf.latencyMs > latencyBudgetMs) issues.push(`Latency ${Math.round(perf.latencyMs)}ms exceeds budget ${latencyBudgetMs}ms.`);
    if (perf.successRate < (1 - errorBudgetPct / 100)) issues.push(`Success ${(perf.successRate * 100).toFixed(1)}% below target ${(100 - errorBudgetPct).toFixed(1)}%.`);
    if (webhookUrl && !/^https?:\/\//i.test(webhookUrl)) issues.push("Webhook URL must be http(s).");
    if (env === "prod" && rolloutPercent > 50 && riskLevel === "high") issues.push("High-risk prod rollouts should start ≤50%.");
    if (env === "prod" && !autoRevert) issues.push("Enable auto-revert for prod safety.");
    if (flowMetrics.riskScore >= 12) issues.push(`Composite risk score ${flowMetrics.riskScore} too high — reduce rollout or actions.`);

    steps.forEach((s, idx) => {
      const localIssues = [];
      if (!s.name.trim()) localIssues.push("Name missing");
      if (!s.config.trim()) localIssues.push("Config missing");
      if (!["trigger", "action"].includes(s.type)) localIssues.push("Type must be trigger | action");
      if (s.type === "action" && idx === 0) localIssues.push("Action should not be first");
      if (s.type !== "trigger" && idx === 0) localIssues.push("Start with trigger");
      const key = (s.name || "").trim().toLowerCase();
      if (key && nameCounts[key] > 1) localIssues.push("Duplicate name");
      if (s.type === "condition" && !/if|when/i.test(s.config)) localIssues.push("Condition lacks clear rule");
      if (localIssues.length) trace.push({ label: s.name || `Step ${idx + 1}`, idx, issues: localIssues });
    });

    setPreflightIssues(issues);
    setPreflightTrace(trace);
    const status = { ok: issues.length === 0, ts: Date.now(), issues: issues.length };
    setPreflightStatus(status);
    try { window.localStorage.setItem("suite:status:workflow-orchestrator", JSON.stringify(status)); } catch (_) {}
    return issues;
  };

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (env === "prod" || approvalRequired || riskLevel !== "low") {
      runPreflight();
    }
  }, [env, approvalRequired, riskLevel, confirmationNote]);

  const handleAddStep = (template = null, type = "action") => {
    if (isViewer) return;
    const nextId = (Math.max(...steps.map(s => s.id)) || 0) + 1;
    pushUndoSnapshot();
    setSteps([...steps, {
      id: nextId,
      name: template?.label || `Step ${nextId}`,
      type,
      config: template?.config || ""
    }]);
    setSelectedStep(nextId);
  };

  const handleRemoveStep = id => {
    if (steps.length <= 1) return;
    if (isViewer) return;
    pushUndoSnapshot();
    const nextSteps = steps.filter(s => s.id !== id);
    setSteps(nextSteps);
    setSelectedStep(nextSteps[0]?.id || null);
    setSelectedStepIds(prev => prev.filter(x => x !== id));
  };

  const handleToggleSelect = (id) => {
    setSelectedStepIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleCopySelection = () => {
    if (!selectedStepIds.length) return;
    const items = steps.filter(s => selectedStepIds.includes(s.id));
    setClipboard(items);
  };

  const handlePasteSelection = () => {
    if (isViewer) return;
    if (!clipboard.length) return;
    const baseId = (Math.max(...steps.map(s => s.id)) || 0) + 1;
    const cloned = clipboard.map((s, idx) => ({ ...s, id: baseId + idx, name: `${s.name} Copy` }));
    pushUndoSnapshot();
    setSteps([...steps, ...cloned]);
    setSelectedStepIds(cloned.map(c => c.id));
  };

  const handleMultiDelete = () => {
    if (isViewer) return;
    if (!selectedStepIds.length) return;
    pushUndoSnapshot();
    const next = steps.filter(s => !selectedStepIds.includes(s.id));
    setSteps(next);
    setSelectedStep(next[0]?.id || null);
    setSelectedStepIds([]);
  };

  const handleDuplicateBranch = () => {
    if (isViewer) return;
    if (!selectedStepIds.length) return handleCloneStep();
    handleCopySelection();
    handlePasteSelection();
  };

  const downloadTestReport = () => {
    const payload = { results: testResults, at: Date.now(), env: fixtureEnv };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setTestReportUrl(url);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const sendWebhookEvent = () => {
    const event = { type: "workflow.outcome", env, steps: steps.length, rollout: rolloutPercent, at: Date.now(), channel: slackChannel || "#ops" };
    addAudit("webhook_emit", event);
    setRecentErrors(prev => prev.slice(0, 9));
  };

  const handleCloneStep = () => {
    const current = steps.find(s => s.id === selectedStep);
    if (!current) return;
    if (isViewer) return;
    const nextId = (Math.max(...steps.map(s => s.id)) || 0) + 1;
    const clone = { ...current, id: nextId, name: `${current.name} Copy` };
    const idx = steps.findIndex(s => s.id === selectedStep);
    const next = [...steps.slice(0, idx + 1), clone, ...steps.slice(idx + 1)];
    pushUndoSnapshot();
    setSteps(next);
    setSelectedStep(nextId);
  };

  const rollbackToLastRun = () => {
    if (isViewer) return;
    if (!lastRunSnapshot) return;
    pushUndoSnapshot();
    setSteps(lastRunSnapshot.steps || steps);
    setEnv(lastRunSnapshot.env || env);
    setVersionTag(lastRunSnapshot.versionTag || versionTag);
    setApprovalRequired(lastRunSnapshot.approvalRequired ?? approvalRequired);
    setRiskLevel(lastRunSnapshot.riskLevel || riskLevel);
    setConfirmationNote(lastRunSnapshot.confirmationNote || "");
  };

  const handleReorder = (id, direction) => {
    const idx = steps.findIndex(s => s.id === id);
    if (idx === -1) return;
    if (isViewer) return;
    const swapWith = direction === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= steps.length) return;
    const next = [...steps];
    [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
    pushUndoSnapshot();
    setSteps(next);
  };

  const applyPlaybook = (playbook) => {
    const presets = {
      seoFix: [
        { id: 1, name: "Trigger", type: "trigger", config: "Critical SEO error detected" },
        { id: 2, name: "Action", type: "action", config: "Open Jira ticket with error details" },
        { id: 3, name: "Action", type: "action", config: "Notify SEO channel in Slack" }
      ],
      productSync: [
        { id: 1, name: "Trigger", type: "trigger", config: "Product inventory updated" },
        { id: 2, name: "Action", type: "action", config: "Sync catalog to marketing feeds" },
        { id: 3, name: "Action", type: "action", config: "Send recap to merchandising" }
      ],
      winback: [
        { id: 1, name: "Trigger", type: "trigger", config: "Abandoned checkout with AOV > $100" },
        { id: 2, name: "Action", type: "action", config: "Send winback email + SMS" },
        { id: 3, name: "Action", type: "action", config: "Alert CX to follow up manually" }
      ],
      churnSave: [
        { id: 1, name: "Trigger", type: "trigger", config: "Churn-risk subscriber detected" },
        { id: 2, name: "Action", type: "action", config: "Offer retention incentive" },
        { id: 3, name: "Action", type: "action", config: "Notify lifecycle marketing" }
      ]
    };
    const chosen = presets[playbook];
    if (chosen) {
      if (isViewer) return;
      pushUndoSnapshot();
      setSteps(chosen);
      setSelectedStep(chosen[0].id);
    }
  };

  const applyTemplate = (tpl) => {
    if (isViewer) return;
    if (tpl.playbook) applyPlaybook(tpl.playbook);
    if (tpl.rollout) setRolloutPercent(tpl.rollout);
    if (tpl.autoRevert !== undefined) setAutoRevert(tpl.autoRevert);
    addAudit("template_apply", { id: tpl.id, playbook: tpl.playbook });
    setShowTemplateGallery(false);
  };

  const stepSignature = useMemo(() => hashString(steps), [steps]);

  const flowMetrics = useMemo(() => {
    const triggerCount = steps.filter(s => s.type === "trigger").length;
    const actionCount = steps.filter(s => s.type === "action").length;
    const conditionCount = steps.filter(s => s.type === "condition").length;
    const riskWeight = riskLevel === "high" ? 4 : riskLevel === "medium" ? 2 : 1;
    const rolloutWeight = rolloutPercent / 25;
    const autoRevertRelief = autoRevert ? -1 : 1;
    const score = (steps.length * 0.6) + (actionCount * 0.4) + rolloutWeight + riskWeight + autoRevertRelief;
    return { triggerCount, actionCount, conditionCount, riskScore: Math.max(0, Math.round(score * 10) / 10) };
  }, [steps, riskLevel, rolloutPercent, autoRevert]);

  useEffect(() => {
    if (!hydratedRef.current) return;
    addAudit("step_change", { signature: stepSignature, steps: steps.length });
  }, [stepSignature]);

  const previewPayload = useMemo(() => ({
    workflowName,
    objective,
    env,
    versionTag,
    tags: tags.split(",").map(t => t.trim()).filter(Boolean),
    approvalRequired,
    approverEmail,
    riskLevel,
    owner,
    steps,
    rolloutPercent,
    autoRevert,
    errorSpikeThreshold,
    latencyBudgetMs,
    errorBudgetPct,
    queueEnabled,
    slackChannel,
    webhookUrl,
    signature: stepSignature,
    metrics: flowMetrics
  }), [workflowName, objective, env, versionTag, tags, approvalRequired, approverEmail, riskLevel, owner, steps, rolloutPercent, autoRevert, errorSpikeThreshold, latencyBudgetMs, errorBudgetPct, queueEnabled, slackChannel, webhookUrl, stepSignature, flowMetrics]);

  const payloadSignature = useMemo(() => hashString(previewPayload), [previewPayload]);

  const readinessSummary = useMemo(() => {
    const triggerOk = steps.some(s => s.type === "trigger");
    const approvalsOk = approvalRequired ? !!approverEmail : true;
    const guardrails = preflightIssues.length ? "Attention" : "Clear";
    const coverage = Math.min(100, (steps.length * 18) + (approvalsOk ? 10 : 0) + (triggerOk ? 12 : 0));
    return {
      triggerOk,
      approvalsOk,
      guardrails,
      coverage,
      summary: `${steps.length} steps · ${steps.filter(s => s.type === "trigger").length} triggers · ${steps.filter(s => s.type === "action").length} actions`
    };
  }, [steps, approvalRequired, approverEmail, preflightIssues.length]);

  const checklist = useMemo(() => ([
    { label: "At least one trigger", ok: steps.some(s => s.type === "trigger") },
    { label: "Approver email set when approvals on", ok: approvalRequired ? !!approverEmail : true },
    { label: "Preflight clear", ok: preflightIssues.length === 0 },
    { label: "Prod/high risk has confirmation note", ok: env !== "prod" && riskLevel !== "high" ? true : !!confirmationNote.trim() }
  ]), [steps, approvalRequired, approverEmail, preflightIssues.length, env, riskLevel, confirmationNote]);

  const validate = () => {
    if (!workflowName.trim()) return "Give this workflow a name.";
    if (!steps.some(s => s.type === "trigger")) return "At least one trigger is required.";
    if (approvalRequired && !approverEmail) return "Approver email is required when approvals are on.";
    return null;
  };

  const handleOrchestrate = async () => {
    if (isViewer) return;
    if (devSandbox) {
      setError("Switch to stage/prod to orchestrate.");
      return;
    }
    const issues = runPreflight();
    if (issues.length) {
      setError("Resolve guardrails before orchestrating.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/workflow-orchestrator/ai/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...previewPayload, confirmationNote })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setResult(data.orchestration);
      setHistory(prev => [{
        steps,
        orchestration: data.orchestration,
        env,
        versionTag,
        approvalRequired,
        at: new Date().toISOString(),
        workflowName,
        signature: stepSignature,
        metrics: flowMetrics
      }, ...prev].slice(0, 10));
      setLastRunSnapshot({ steps, env, versionTag, approvalRequired, riskLevel, confirmationNote, at: Date.now() });
      setLastPublish(Date.now());
      addAudit("orchestrate", { env, versionTag, rolloutPercent });
      setDirtySinceSave(false);
      setDraftStatus("saved");
      setLastSavedAt(Date.now());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onboardingContent = (
    <div>
      <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Workflow Orchestrator</h3>
      <ul style={{ margin: "16px 0 0 18px", color: "#a5f3fc", fontSize: 16 }}>
        <li>Use triggers and actions to automate multi-step flows.</li>
        <li>Apply playbooks (SEO fixes, product sync, winback) in one click.</li>
        <li>Preview the payload and require approvals before production.</li>
        <li>Version your orchestration with tags and keep a recent history.</li>
      </ul>
      <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: "#0a0a0a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Got it</button>
    </div>
  );

  const diffSummary = useMemo(() => {
    if (!lastRunSnapshot) return null;
    const prev = lastRunSnapshot.steps || [];
    const added = steps.filter(s => !prev.find(p => p.id === s.id));
    const removed = prev.filter(p => !steps.find(s => s.id === p.id));
    const changed = steps.filter(s => {
      const p = prev.find(prevStep => prevStep.id === s.id);
      if (!p) return false;
      return p.name !== s.name || p.type !== s.type || p.config !== s.config;
    });
    return { added, removed, changed };
  }, [steps, lastRunSnapshot]);

  const formatTime = ts => ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

  const handleManualSave = () => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      workflowName,
      objective,
      env,
      versionTag,
      tags,
      approvalRequired,
      approverEmail,
      riskLevel,
      owner,
      steps,
      selectedStep,
      confirmationNote,
      payloadPreset,
      versionName,
      versions,
      lastSavedAt: Date.now(),
      rolloutPercent,
      autoRevert,
      errorSpikeThreshold,
      latencyBudgetMs,
      errorBudgetPct,
      queueEnabled,
      slackChannel,
      webhookUrl,
      lastPublish,
      signature: stepSignature,
      metrics: flowMetrics,
      lastRunSignature: lastRunSnapshot?.signature
    }));
    try { window.sessionStorage.setItem(STORAGE_BACKUP_KEY, window.localStorage.getItem(STORAGE_KEY)); } catch (_) {}
    setDraftStatus("saved");
    setLastSavedAt(Date.now());
    setDirtySinceSave(false);
  };

  const handleTestDev = () => {
    if (isViewer) return;
    setTestStatus("running");
    const payload = payloadPresets.find(p => p.id === payloadPreset)?.payload || {};
    const running = {};
    steps.forEach(s => { running[s.id] = "running"; });
    setStepStatuses(running);
    setTimeout(() => {
      const passed = {};
      steps.forEach(s => { passed[s.id] = "passed"; });
      setStepStatuses(passed);
      setTestStatus("passed");
      setHistory(prev => [{ steps, result: { test: "dev", payload }, env: "dev", versionTag, approvalRequired }, ...prev].slice(0, 10));
    }, 700);
  };

  const runDryRun = () => {
    if (isViewer) return;
    setEnv("dev");
    runPreflight();
  };

  const handleExport = () => {
    const payload = {
      workflowName,
      objective,
      env,
      versionTag,
      steps,
      tags,
      approvalRequired,
      approverEmail,
      riskLevel,
      owner,
      rolloutPercent,
      autoRevert,
      errorSpikeThreshold,
      latencyBudgetMs,
      errorBudgetPct,
      queueEnabled,
      slackChannel,
      webhookUrl,
      signature: stepSignature,
      metrics: flowMetrics,
      checksum: hashString({
        workflowName,
        objective,
        env,
        versionTag,
        steps,
        tags,
        approvalRequired,
        approverEmail,
        riskLevel,
        owner,
        rolloutPercent,
        autoRevert,
        errorSpikeThreshold,
        latencyBudgetMs,
        errorBudgetPct,
        queueEnabled,
        slackChannel,
        webhookUrl,
        signature: stepSignature,
        metrics: flowMetrics
      })
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workflowName || "workflow"}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };

  const handleImport = (evt) => {
    const file = evt.target.files?.[0];
    if (!file) return;
    setImportError("");
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const errs = validateSchema(parsed);
        if (errs.length) throw new Error(errs.join("; "));
        if (parsed.checksum) {
          const { checksum, ...rest } = parsed;
          const recomputed = hashString(rest);
          if (checksum !== recomputed) throw new Error("Checksum mismatch: export may be tampered or outdated");
        }
        pushUndoSnapshot();
        setWorkflowName(parsed.workflowName || workflowName);
        setObjective(parsed.objective || objective);
        setEnv(parsed.env || env);
        setVersionTag(parsed.versionTag || versionTag);
        setTags(parsed.tags || tags);
        setApprovalRequired(!!parsed.approvalRequired);
        setApproverEmail(parsed.approverEmail || approverEmail);
        setRiskLevel(parsed.riskLevel || riskLevel);
        setOwner(parsed.owner || owner);
        setSteps(parsed.steps || steps);
        if (typeof parsed.rolloutPercent === "number") setRolloutPercent(parsed.rolloutPercent);
        if (parsed.autoRevert !== undefined) setAutoRevert(parsed.autoRevert);
        if (typeof parsed.errorSpikeThreshold === "number") setErrorSpikeThreshold(parsed.errorSpikeThreshold);
        if (typeof parsed.latencyBudgetMs === "number") setLatencyBudgetMs(parsed.latencyBudgetMs);
        if (typeof parsed.errorBudgetPct === "number") setErrorBudgetPct(parsed.errorBudgetPct);
        if (parsed.queueEnabled !== undefined) setQueueEnabled(parsed.queueEnabled);
        if (parsed.slackChannel) setSlackChannel(parsed.slackChannel);
        if (parsed.webhookUrl) setWebhookUrl(parsed.webhookUrl);
        setSteps(sanitizeSteps(parsed.steps || steps));
      } catch (e) {
        setImportError(e?.message || "Import failed");
      }
    };
    reader.readAsText(file);
  };

  const handleRunTests = () => {
    if (isViewer) return;
    setTestStatus("running");
    const issues = runPreflight();
    const results = testCases.map(tc => {
      const payloadTooBig = JSON.stringify(tc.payload || {}).length > 6000;
      const hasTrigger = steps.some(s => s.type === "trigger");
      const ok = !payloadTooBig && hasTrigger && issues.length === 0;
      const status = payloadTooBig ? "warn" : issues.length ? "fail" : "pass";
      const expected = tc.expect;
      const pass = (expected === "ok" && ok) || (expected === "warn" && status === "warn") || (expected === "fail" && status === "fail");
      return { ...tc, status, pass };
    });
    setTestResults(results);
    setTimeout(() => setTestStatus("idle"), 400);
  };

  useEffect(() => {
    // simple perf estimation based on steps count
    const latency = Math.min(1800, 220 + steps.length * 35);
    const success = Math.max(0.9, 0.995 - steps.length * 0.002);
    setPerf({ latencyMs: latency, successRate: success });
  }, [steps]);

  const slaCompliance = useMemo(() => {
    const latencyOk = perf.latencyMs <= latencyBudgetMs;
    const successOk = perf.successRate >= (1 - errorBudgetPct / 100);
    const status = latencyOk && successOk ? "on-track" : successOk ? "watch" : "breach";
    return { latencyOk, successOk, status, summary: `${Math.round(perf.latencyMs)}ms vs ${latencyBudgetMs}ms · ${(perf.successRate * 100).toFixed(1)}% vs ${(100 - errorBudgetPct).toFixed(1)}%` };
  }, [perf, latencyBudgetMs, errorBudgetPct]);

  const addAudit = (event, meta = {}) => {
    setAuditLog(prev => [{ event, meta, at: Date.now(), env, user: role }, ...prev].slice(0, 20));
  };

  const handleSnapshotVersion = () => {
    if (isViewer) return;
    const label = versionName || `v${versions.length + 1}`;
    setVersions(prev => [{ label, steps, env, approvalRequired, createdAt: Date.now() }, ...prev].slice(0, 6));
  };

  useEffect(() => {
    const listener = e => {
      if (e.ctrlKey && e.key === "s") { e.preventDefault(); handleManualSave(); }
      if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); handleOrchestrate(); }
      if (!e.ctrlKey && !e.metaKey && e.key.toLowerCase() === "c") { e.preventDefault(); handleCloneStep(); }
      if (e.ctrlKey && e.key.toLowerCase() === "z") { e.preventDefault(); handleUndo(); }
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "z") || (e.ctrlKey && e.key.toLowerCase() === "y")) { e.preventDefault(); handleRedo(); }
      if (e.ctrlKey && e.key.toLowerCase() === "k") { e.preventDefault(); setShowCommandPalette(prev => !prev); }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [steps, undoStack, redoStack, showCommandPalette]);

  return (
    <div style={{ background: "#0d0d0d", color: "#f0f0f0", padding: 24, borderRadius: 16, border: "1px solid #1a1a1a", boxShadow: "0 12px 48px #0007" }}>
      <BackButton />
      {isViewer && (
        <div style={{ background: "#1a1a1a", border: "1px solid #333333", borderRadius: 12, padding: 12, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 800, color: "#fcd34d" }}>View-only mode</div>
            <div style={{ color: "#888888", fontSize: 13 }}>You can inspect orchestrations but need elevated access to edit or ship changes.</div>
          </div>
          <button onClick={() => setAccessRequested(true)} disabled={accessRequested} style={{ background: accessRequested ? "#333333" : "#22c55e", color: "#111111", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: accessRequested ? "default" : "pointer" }}>
            {accessRequested ? "Request sent" : "Request edit access"}
          </button>
        </div>
      )}
      {devSandbox && (
        <div style={{ background: "#1a1a1a", border: "1px solid #333333", borderRadius: 12, padding: 12, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 800, color: "#93c5fd" }}>Sandbox mode (dev)</div>
            <div style={{ color: "#e0e0e0", fontSize: 13 }}>Prod-only actions like Orchestrate are blocked; switch env to stage/prod to ship.</div>
          </div>
          <button onClick={() => setEnv("stage")} style={{ background: "#0ea5e9", color: "#111111", border: "none", borderRadius: 10, padding: "8px 12px", fontWeight: 800, cursor: "pointer" }}>Switch to stage</button>
        </div>
      )}
      {isEnvLocked && (
        <div style={{ background: "#7c2d12", border: "1px solid #b45309", borderRadius: 12, padding: 12, marginBottom: 12, color: "#fecdd3", fontWeight: 700 }}>
          Prod is admin-only. Request elevation or switch to stage.
        </div>
      )}
      {showCommandPalette && (
        <div style={{ position: "fixed", inset: 0, background: "#0009", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20 }}>
          <div style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 14, padding: 16, width: "min(520px, 92vw)", boxShadow: "0 18px 60px #000" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 800, color: "#a5f3fc" }}>Command Palette</div>
              <button onClick={() => setShowCommandPalette(false)} style={{ background: "transparent", color: "#888888", border: "none", cursor: "pointer", fontWeight: 700 }}>Esc</button>
            </div>
            {[{ label: "Save draft", action: handleManualSave, hotkey: "Ctrl+S", disabled: false }, { label: "Run preflight", action: runPreflight, hotkey: "Alt+P", disabled: false }, { label: "Orchestrate", action: handleOrchestrate, hotkey: "Ctrl+Enter", disabled: isViewer }, { label: "Undo", action: handleUndo, hotkey: "Ctrl+Z", disabled: !undoStack.length || isViewer }, { label: "Redo", action: handleRedo, hotkey: "Ctrl+Shift+Z", disabled: !redoStack.length || isViewer }].map(cmd => (
              <button key={cmd.label} disabled={cmd.disabled} onClick={() => { cmd.action(); setShowCommandPalette(false); }} style={{ width: "100%", textAlign: "left", background: cmd.disabled ? "#1a1a1a" : "#111111", color: cmd.disabled ? "#666666" : "#f0f0f0", border: "1px solid #1a1a1a", borderRadius: 10, padding: "10px 12px", marginBottom: 8, cursor: cmd.disabled ? "not-allowed" : "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{cmd.label}</span>
                <span style={{ fontSize: 12, color: "#888888" }}>{cmd.hotkey}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 32, margin: 0, color: "#a5f3fc" }}>Workflow Orchestrator</h2>
          <div style={{ color: "#888888", marginTop: 4 }}>Plan, run, and approve orchestrations before shipping. Hotkeys: Ctrl+S save, Ctrl+Enter run, Ctrl+Z undo, Ctrl+Shift+Z redo, c clone, Ctrl+K palette.</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <select value={env} onChange={e => setEnv(e.target.value)} disabled={isViewer} style={{ background: "#111111", color: "#f0f0f0", border: "1px solid #1a1a1a", borderRadius: 10, padding: "8px 12px", fontWeight: 700, opacity: isViewer ? 0.7 : 1 }}>
            <option value="dev">Dev</option><option value="stage">Stage</option><option value="prod">Prod</option>
          </select>
          <input value={versionTag} onChange={e => setVersionTag(e.target.value)} disabled={isViewer} placeholder="Version tag" style={{ background: "#111111", color: "#f0f0f0", border: "1px solid #1a1a1a", borderRadius: 10, padding: "8px 12px", minWidth: 120, opacity: isViewer ? 0.7 : 1 }} />
          <span style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 999, padding: "6px 10px", color: "#a5f3fc", fontWeight: 700 }}>Role: {role}</span>
          <label style={{ display: "flex", alignItems: "center", gap: 6, background: "#111111", border: "1px solid #1a1a1a", borderRadius: 10, padding: "6px 10px", fontWeight: 700, opacity: isViewer ? 0.7 : 1 }}>
            <input type="checkbox" checked={disabled} onChange={e => setDisabled(e.target.checked)} disabled={isViewer} /> Disabled
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, background: "#111111", border: "1px solid #1a1a1a", borderRadius: 10, padding: "6px 10px", fontWeight: 700, opacity: isViewer ? 0.7 : 1 }}>
            <input type="checkbox" checked={approvalRequired} onChange={e => setApprovalRequired(e.target.checked)} disabled={isViewer} /> Approvals
          </label>
          <input value={approverEmail} onChange={e => setApproverEmail(e.target.value)} disabled={isViewer} placeholder="Approver email" style={{ background: "#111111", color: "#f0f0f0", border: "1px solid #1a1a1a", borderRadius: 10, padding: "8px 12px", minWidth: 180, opacity: isViewer ? 0.7 : 1 }} />
        </div>
        {issueHelp && (
          <div style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 10, padding: 10, marginTop: 8, display: "grid", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div style={{ color: "#a5f3fc", fontWeight: 800 }}>Issue help</div>
              <button onClick={() => setIssueHelp(null)} style={{ background: "#1a1a1a", color: "#f0f0f0", border: "1px solid #333333", borderRadius: 8, padding: "4px 8px", fontWeight: 700, cursor: "pointer" }}>Close</button>
            </div>
            <div style={{ color: "#f0f0f0" }}>{issueHelp}</div>
            <div style={{ color: "#888888", fontSize: 13 }}>Recommended fix: {issueHelp.toLowerCase().includes("approver") ? "Add or update an approver email, then rerun preflight." : issueHelp.toLowerCase().includes("trigger") ? "Add a trigger step so orchestration can start." : issueHelp.toLowerCase().includes("prod") ? "Add a production confirmation note and ensure approvals are set." : issueHelp.toLowerCase().includes("duplicate") ? "Clean up duplicate labels via quick fix." : "Review the trace for context, then apply the quick fix or adjust steps."}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => applyQuickFix("approver")} style={{ background: "#0ea5e9", color: "#111111", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>Add approver</button>
              <button onClick={() => applyQuickFix("prod-note")} style={{ background: "#f59e0b", color: "#111111", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>Add prod note</button>
              <button onClick={() => applyQuickFix("trigger-action")} style={{ background: "#22c55e", color: "#111111", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>Add trigger/action</button>
              <button onClick={() => applyQuickFix("dedupe-labels")} style={{ background: "#6366f1", color: "#f0f0f0", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>Fix duplicates</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginBottom: 10 }}>
        <div style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 12, padding: 12 }}>
          <div style={{ color: "#888888", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.4 }}>Readiness</div>
          <div style={{ fontWeight: 800, fontSize: 22, color: readinessSummary.coverage >= 85 ? "#22c55e" : "#fbbf24" }}>{readinessSummary.coverage}%</div>
          <div style={{ color: "#888888", fontSize: 13 }}>{readinessSummary.summary}</div>
        </div>
        <div style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Guardrails</div>
          <div style={{ color: preflightIssues.length ? "#f59e0b" : "#22c55e", fontWeight: 700 }}>{preflightIssues.length ? `${preflightIssues.length} issue${preflightIssues.length > 1 ? "s" : ""}` : "Clear"}</div>
          <div style={{ color: "#888888", fontSize: 12, marginBottom: preflightIssues.length ? 6 : 0 }}>Triggers ok: {readinessSummary.triggerOk ? "Yes" : "No"} · Approvals: {readinessSummary.approvalsOk ? "Ready" : "Need email"}</div>
          {steps.length >= 6 && <div style={{ color: "#fbbf24", fontSize: 12, marginBottom: 6 }}>Perf detail: {steps.length} steps on canvas — consider trimming.</div>}
          {preflightIssues.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 16, color: "#f0f0f0", fontSize: 12, display: "grid", gap: 4 }}>
              {preflightIssues.slice(0, 3).map((issue, idx) => {
                const fixKind = quickFixForIssue(issue);
                return (
                  <li key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span>{issue}</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button aria-label={`Explain ${issue}`} onClick={() => setIssueHelp(issue)} style={{ background: "#1a1a1a", border: "1px solid #333333", color: "#a5f3fc", borderRadius: 8, padding: "2px 8px", fontWeight: 700, cursor: "pointer" }}>Explain</button>
                      {fixKind && <button aria-label={`Fix ${issue}`} onClick={() => applyQuickFix(fixKind)} style={{ background: "#10b981", border: "1px solid #065f46", color: "#111111", borderRadius: 8, padding: "2px 8px", fontWeight: 800, cursor: "pointer" }}>Fix</button>}
                    </div>
                  </li>
                );
              })}
              {preflightIssues.length > 3 && <li style={{ color: "#888888" }}>+{preflightIssues.length - 3} more (open Trace)</li>}
            </ul>
          )}
        </div>
        <div style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Workflow hygiene</div>
          <div style={{ color: dirtySinceSave ? "#fbbf24" : "#22c55e", fontWeight: 700 }}>{dirtySinceSave ? "Unsaved edits" : "Clean"}</div>
          <div style={{ color: "#888888", fontSize: 12 }}>Last saved {lastSavedAt ? formatTime(lastSavedAt) : "—"}</div>
        </div>
      </div>

      <div style={{ marginBottom: 12, background: "#111111", border: "1px solid #1a1a1a", borderRadius: 12, padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 800 }}>Operational checklist</div>
          <div style={{ color: "#888888", fontSize: 12 }}>Auto-updates as you edit</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8 }}>
          {checklist.map(item => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, background: "#111111", border: "1px solid #1a1a1a", borderRadius: 10, padding: "8px 10px" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.ok ? "#22c55e" : "#f97316" }} />
              <div style={{ color: "#f0f0f0", fontWeight: 600 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

        {preflightTrace.length > 0 && (
          <div style={{ marginBottom: 12, background: "#111111", border: "1px solid #1a1a1a", borderRadius: 12, padding: 12 }}>
            <div style={{ fontWeight: 800, marginBottom: 6, color: "#fcd34d" }}>Preflight trace</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: "#f0f0f0" }}>
              {preflightTrace.map((t, i) => (
                <li key={i}>{t.label}: {t.issues.join("; ")}</li>
              ))}
            </ul>
          </div>
        )}

      {(env === "prod" || riskLevel === "high") && (
        <div style={{ marginBottom: 8, background: "#1a1a1a", border: "1px solid #333333", borderRadius: 10, padding: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ color: "#fbbf24", fontWeight: 700 }}>Prod / high-risk confirmation</div>
          <input value={confirmationNote} onChange={e => setConfirmationNote(e.target.value)} disabled={isViewer} placeholder="Add a confirmation note" style={{ flex: 1, minWidth: 220, background: "#111111", color: "#f0f0f0", border: "1px solid #1a1a1a", borderRadius: 10, padding: "8px 12px", opacity: isViewer ? 0.7 : 1 }} />
        </div>
      )}

      <div style={{ position: "sticky", top: 0, zIndex: 2, background: "#0d0d0d", paddingBottom: 6, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6, alignItems: "center" }}>
          <button onClick={runPreflight} disabled={isViewer} style={{ background: "#f59e0b", color: "#111111", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 800, cursor: isViewer ? "not-allowed" : "pointer", opacity: isViewer ? 0.7 : 1 }}>Preflight</button>
          <button onClick={runDryRun} disabled={isViewer} style={{ background: "#22c55e", color: "#111111", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 800, cursor: isViewer ? "not-allowed" : "pointer", opacity: isViewer ? 0.7 : 1 }}>Dry-run (dev)</button>
          <button onClick={handleRunTests} disabled={isViewer || testStatus === "running"} style={{ background: "#67e8f9", color: "#111111", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 800, cursor: isViewer ? "not-allowed" : "pointer", opacity: isViewer ? 0.7 : 1 }}>{testStatus === "running" ? "Running tests…" : "Run test suite"}</button>
          {preflightStatus && (
            <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 999, border: "1px solid #1a1a1a", background: preflightStatus.ok ? "#111111" : "#1a1a1a", color: preflightStatus.ok ? "#22c55e" : preflightStatus.issues ? "#fcd34d" : "#f87171", fontWeight: 800, fontSize: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: preflightStatus.ok ? "#22c55e" : preflightStatus.issues ? "#f59e0b" : "#ef4444" }} />
              <span>{preflightStatus.ok ? "Preflight pass" : preflightStatus.issues ? `${preflightStatus.issues} issues` : "Preflight failed"}</span>
              {preflightStatus.ts ? <span style={{ color: "#888888", fontWeight: 600 }}>· {new Date(preflightStatus.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span> : null}
              <button onClick={() => setShowPreflightPopover(v => !v)} style={{ background: "transparent", border: "none", color: "#f0f0f0", cursor: "pointer", fontWeight: 800 }}>Trace</button>
              <button onClick={clearPreflightStatus} style={{ marginLeft: 2, background: "transparent", border: "none", color: "#888888", cursor: "pointer", fontWeight: 800 }}>Clear</button>
              <button onClick={downloadPreflightReport} style={{ background: "transparent", border: "none", color: "#67e8f9", cursor: "pointer", fontWeight: 800 }}>Save</button>
              {showPreflightPopover && (
                <div style={{ position: "absolute", top: "110%", right: 0, minWidth: 220, background: "#111111", border: "1px solid #1a1a1a", borderRadius: 10, padding: 10, boxShadow: "0 10px 30px rgba(0,0,0,0.4)", zIndex: 10 }}>
                  <div style={{ fontWeight: 800, color: "#fcd34d", marginBottom: 6 }}>Preflight issues</div>
                  <div style={{ color: "#888888", fontSize: 12, marginBottom: 6 }}>Why this matters: prevents broken orchestration from hitting Shopify customers.</div>
                  {preflightIssues.length === 0 ? <div style={{ color: "#22c55e" }}>Clear</div> : (
                    <ul style={{ margin: 0, paddingLeft: 16, color: "#f0f0f0", maxHeight: 160, overflow: "auto" }}>
                      {preflightIssues.slice(0, 6).map((p, i) => <li key={i}>{p}</li>)}
                      {preflightIssues.length > 6 && <li style={{ color: "#888888" }}>…{preflightIssues.length - 6} more</li>}
                    </ul>
                  )}
                  <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button onClick={() => applyQuickFix("approver")} style={{ background: "#0ea5e9", color: "#111111", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>Add approver</button>
                    <button onClick={() => applyQuickFix("prod-note")} style={{ background: "#f59e0b", color: "#111111", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>Add prod note</button>
                    <button onClick={() => applyQuickFix("trigger-action")} style={{ background: "#22c55e", color: "#111111", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>Add trigger/action</button>
                    <button onClick={() => applyQuickFix("dedupe-labels")} style={{ background: "#6366f1", color: "#f0f0f0", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>Fix duplicates</button>
                  </div>
                  {preflightTrace.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ color: "#67e8f9", fontWeight: 700 }}>Trace</div>
                      <ul style={{ margin: 0, paddingLeft: 16, color: "#f0f0f0", maxHeight: 140, overflow: "auto" }}>
                        {preflightTrace.slice(0, 5).map((t, i) => (
                          <li key={i}>{t.label}: {t.issues?.join("; ")}</li>
                        ))}
                        {preflightTrace.length > 5 && <li style={{ color: "#888888" }}>…{preflightTrace.length - 5} more</li>}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </span>
          )}
          <button onClick={handleCloneStep} disabled={isViewer} style={{ background: "#a855f7", color: "#111111", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 800, cursor: isViewer ? "not-allowed" : "pointer", opacity: isViewer ? 0.7 : 1 }}>Clone step</button>
          <input value={versionName} onChange={e => setVersionName(e.target.value)} placeholder="Version name" style={{ background: "#111111", color: "#f0f0f0", border: "1px solid #1a1a1a", borderRadius: 8, padding: "8px 12px", minWidth: 140 }} />
          <button onClick={handleSnapshotVersion} disabled={isViewer} style={{ background: "#8b5cf6", color: "#111111", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 800, cursor: isViewer ? "not-allowed" : "pointer", opacity: isViewer ? 0.7 : 1 }}>Snapshot</button>
          <select value={payloadPreset} onChange={e => setPayloadPreset(e.target.value)} disabled={isViewer} style={{ background: "#111111", color: "#f0f0f0", border: "1px solid #1a1a1a", borderRadius: 8, padding: "8px 12px", opacity: isViewer ? 0.7 : 1 }}>
            {payloadPresets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={handleTestDev} disabled={isViewer} style={{ background: "#22c55e", color: "#111111", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 800, cursor: isViewer ? "not-allowed" : "pointer", opacity: isViewer ? 0.7 : 1 }}>{testStatus === "running" ? "Testing..." : "Test in dev"}</button>
          <button onClick={handleOrchestrate} disabled={loading || isViewer || devSandbox || isEnvLocked} style={{ background: devSandbox || isEnvLocked ? "#1a1a1a" : "#22c55e", color: "#111111", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 800, fontSize: 15, cursor: loading || isViewer || devSandbox || isEnvLocked ? "not-allowed" : "pointer", opacity: loading || isViewer || devSandbox || isEnvLocked ? 0.6 : 1 }}>{isEnvLocked ? "Prod requires admin" : devSandbox ? "Sandbox (switch env)" : loading ? "Orchestrating..." : "Orchestrate"}</button>
          <button onClick={rollbackToLastRun} disabled={isViewer || !lastRunSnapshot} style={{ background: "#111111", color: "#f0f0f0", border: "1px solid #1a1a1a", borderRadius: 10, padding: "10px 12px", fontWeight: 800, cursor: isViewer || !lastRunSnapshot ? "not-allowed" : "pointer", opacity: isViewer || !lastRunSnapshot ? 0.6 : 1 }}>Rollback to last run</button>
          <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#111111", border: "none", borderRadius: 10, padding: "8px 12px", fontWeight: 800, cursor: "pointer" }}>Export JSON</button>
          <button onClick={() => importRef.current?.click()} style={{ background: "#a855f7", color: "#111111", border: "none", borderRadius: 10, padding: "8px 12px", fontWeight: 800, cursor: "pointer" }}>Import JSON</button>
          <input type="file" accept="application/json" ref={importRef} onChange={handleImport} style={{ display: "none" }} />
          <div style={{ color: "#888888", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: draftStatus === "saved" ? "#22c55e" : "#fbbf24" }}>{draftStatus === "saved" ? "Saved" : "Saving"}</span>
            {lastSavedAt && <span>· {formatTime(lastSavedAt)}</span>}
            {dirtySinceSave && <span style={{ color: "#fbbf24" }}>· Unsaved changes</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 999, padding: "6px 10px", color: steps.some(s => s.type === "trigger") ? "#22c55e" : "#f97316", fontWeight: 700 }}>Trigger {steps.some(s => s.type === "trigger") ? "OK" : "Missing"}</span>
          <span style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 999, padding: "6px 10px", color: approvalRequired && !approverEmail ? "#f97316" : "#22c55e", fontWeight: 700 }}>Approvals {approvalRequired ? (approverEmail ? "Ready" : "Need email") : "Off"}</span>
          <span style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 999, padding: "6px 10px", color: riskLevel === "high" ? "#f87171" : riskLevel === "medium" ? "#fbbf24" : "#22c55e", fontWeight: 700 }}>Risk {riskLevel}</span>
          <span style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 999, padding: "6px 10px", color: steps.length >= 6 ? "#f97316" : "#22c55e", fontWeight: 700 }}>Perf guardrail: {steps.length >= 6 ? "tighten" : "OK"}</span>
          <span style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 999, padding: "6px 10px", color: disabled ? "#f97316" : "#22c55e", fontWeight: 700 }}>Disabled: {disabled ? "Yes" : "No"}</span>
          {env === "prod" && <span style={{ background: "#7c2d12", border: "1px solid #b45309", borderRadius: 999, padding: "6px 10px", color: confirmationNote ? "#facc15" : "#fca5a5", fontWeight: 700 }}>Prod note {confirmationNote ? "ready" : "required"}</span>}
          <span style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 999, padding: "6px 10px", color: perf.latencyMs > 900 ? "#f97316" : perf.latencyMs > 600 ? "#fbbf24" : "#22c55e", fontWeight: 700 }}>Latency {Math.round(perf.latencyMs)}ms</span>
          <span style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 999, padding: "6px 10px", color: perf.successRate < 0.95 ? "#f97316" : "#22c55e", fontWeight: 700 }}>Success {(perf.successRate * 100).toFixed(1)}%</span>
          <span style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 999, padding: "6px 10px", color: slaCompliance.status === "on-track" ? "#22c55e" : slaCompliance.status === "watch" ? "#fbbf24" : "#f97316", fontWeight: 700 }}>SLA {slaCompliance.status}</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
          <input value={reviewerEmail} onChange={e => setReviewerEmail(e.target.value)} placeholder="Reviewer email" style={{ background: "#111111", color: "#f0f0f0", border: "1px solid #1a1a1a", borderRadius: 10, padding: "6px 10px", minWidth: 200 }} />
          <button onClick={attachPreflightForReviewer} disabled={isViewer} style={{ background: "#8b5cf6", color: "#111111", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 800, cursor: isViewer ? "not-allowed" : "pointer", opacity: isViewer ? 0.7 : 1 }}>Attach preflight</button>
          <div style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 10, padding: "6px 10px", color: disabled ? "#f97316" : "#22c55e", fontWeight: 700 }}>Disabled: {disabled ? "Yes" : "No"}</div>
        </div>
        {importError && <div style={{ color: "#fca5a5", fontSize: 12, marginTop: 6 }}>Import error: {importError}</div>}
      </div>

      {history.length > 0 && (
        <div style={{ marginBottom: 12, background: "#111111", border: "1px solid #1a1a1a", borderRadius: 12, padding: 10, display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 800 }}>Recent runs</div>
            <div style={{ color: "#888888", fontSize: 12 }}>Last {Math.min(3, history.length)} shown</div>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {history.slice(0, 3).map((h, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", background: "#111111", border: "1px solid #1a1a1a", borderRadius: 10, padding: "8px 10px" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#f0f0f0" }}>{h.workflowName || "Run"} · {h.env}/{h.versionTag || "v"}</div>
                  <div style={{ color: "#888888", fontSize: 12 }}>Saved {h.at ? new Date(h.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "recent"} · {h.steps?.length || 0} steps</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button aria-label={`Load run ${idx + 1}`} onClick={() => restoreSnapshot(h)} style={{ background: "#1a1a1a", color: "#f0f0f0", border: "1px solid #333333", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>Load</button>
                  <button aria-label={`Re-run ${idx + 1}`} onClick={() => { restoreSnapshot(h); setTimeout(() => handleOrchestrate(), 0); }} disabled={devSandbox || isViewer} style={{ background: devSandbox ? "#1a1a1a" : "#22c55e", color: "#111111", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: devSandbox || isViewer ? "not-allowed" : "pointer", opacity: devSandbox || isViewer ? 0.6 : 1 }}>{devSandbox ? "Sandbox" : "Re-run"}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, alignItems: "start", marginBottom: 14 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <input value={workflowName} onChange={e => setWorkflowName(e.target.value)} disabled={isViewer} placeholder="Workflow name" style={{ background: "#111111", color: "#f0f0f0", border: "1px solid #1a1a1a", borderRadius: 10, padding: "10px 12px", fontWeight: 700, opacity: isViewer ? 0.7 : 1 }} />
          <textarea value={objective} onChange={e => setObjective(e.target.value)} disabled={isViewer} placeholder="Objective / desired outcome" rows={2} style={{ background: "#111111", color: "#f0f0f0", border: "1px solid #1a1a1a", borderRadius: 10, padding: "10px 12px", opacity: isViewer ? 0.7 : 1 }} />
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <input value={tags} onChange={e => setTags(e.target.value)} disabled={isViewer} placeholder="Tags (comma separated)" style={{ background: "#111111", color: "#f0f0f0", border: "1px solid #1a1a1a", borderRadius: 10, padding: "10px 12px", opacity: isViewer ? 0.7 : 1 }} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select value={riskLevel} onChange={e => setRiskLevel(e.target.value)} disabled={isViewer} style={{ background: "#111111", color: "#f0f0f0", border: "1px solid #1a1a1a", borderRadius: 10, padding: "10px 12px", fontWeight: 700, opacity: isViewer ? 0.7 : 1 }}>
              <option value="low">Low risk</option><option value="medium">Medium risk</option><option value="high">High risk</option>
            </select>
            <input value={owner} onChange={e => setOwner(e.target.value)} disabled={isViewer} placeholder="Workflow owner" style={{ background: "#111111", color: "#f0f0f0", border: "1px solid #1a1a1a", borderRadius: 10, padding: "10px 12px", flex: 1, opacity: isViewer ? 0.7 : 1 }} />
          </div>
        </div>
      </div>

      {testResults.length > 0 && (
        <div style={{ marginBottom: 12, background: "#111111", border: "1px solid #1a1a1a", borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Test harness</div>
          <div style={{ color: "#888888", fontSize: 12, marginBottom: 6 }}>Validates payload size, trigger presence, and preflight cleanliness.</div>
          <div style={{ display: "grid", gap: 6 }}>
            {testResults.map(tr => (
              <div key={tr.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, background: "#111111", border: "1px solid #1a1a1a", borderRadius: 8, padding: "6px 10px" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#f0f0f0" }}>{tr.name}</div>
                  <div style={{ color: "#888888", fontSize: 12 }}>Expect: {tr.expect} · Got: {tr.status}</div>
                </div>
                <span style={{ fontWeight: 800, color: tr.pass ? "#22c55e" : "#f97316" }}>{tr.pass ? "Pass" : "Mismatch"}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <select value={fixtureEnv} onChange={e => setFixtureEnv(e.target.value)} style={{ background: "#111111", color: "#f0f0f0", border: "1px solid #1a1a1a", borderRadius: 8, padding: "6px 10px" }}>
              <option value="dev">Dev fixture</option>
              <option value="stage">Stage fixture</option>
              <option value="prod">Prod fixture</option>
            </select>
            <button onClick={downloadTestReport} style={{ background: "#0ea5e9", color: "#111111", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 800, cursor: "pointer" }}>Download report</button>
            {testReportUrl && <a href={testReportUrl} download="workflow-tests.json" style={{ color: "#67e8f9", fontWeight: 700 }}>Save now</a>}
          </div>
        </div>
      )}

      <button onClick={() => setShowOnboarding(v => !v)} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginBottom: 16 }}>{showOnboarding ? "Hide" : "Show"} Quick Guide</button>
      {showOnboarding && onboardingContent}

      <div style={{ display: "flex", gap: 18, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ minWidth: 240 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Workflow Steps</div>
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search" style={{ background: "#111111", color: "#f0f0f0", border: "1px solid #1a1a1a", borderRadius: 8, padding: "6px 8px", fontSize: 12 }} />
          </div>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {steps.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.config.toLowerCase().includes(searchTerm.toLowerCase())).map(step => (
              <li key={step.id} style={{ marginBottom: 8, background: selectedStep === step.id ? "#0a0a0a" : "#18181b", borderRadius: 8, padding: 10, cursor: "pointer", border: selectedStep === step.id ? "2px solid #6366f1" : "1px solid #0a0a0a", display: "flex", alignItems: "center", gap: 8 }} onClick={() => setSelectedStep(step.id)}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#888888", fontSize: 12 }} onClick={e => e.stopPropagation()}>
                    <input type="checkbox" checked={selectedStepIds.includes(step.id)} onChange={() => handleToggleSelect(step.id)} />
                    Select
                  </label>
                  <div style={{ fontWeight: 700 }}>{step.name}</div>
                  <div style={{ color: "#a5f3fc", fontSize: 12 }}>({step.type})</div>
                  {traceByStep.get(steps.indexOf(step))?.length ? (
                    <div style={{ color: "#fbbf24", fontSize: 12 }}>Issues: {traceByStep.get(steps.indexOf(step)).join(", ")}</div>
                  ) : null}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={e => { e.stopPropagation(); handleReorder(step.id, "up"); }} disabled={isViewer} style={{ background: "#111111", color: "#f0f0f0", border: "1px solid #0a0a0a", borderRadius: 6, padding: "4px 8px", cursor: isViewer ? "not-allowed" : "pointer", opacity: isViewer ? 0.6 : 1 }}>↑</button>
                  <button onClick={e => { e.stopPropagation(); handleReorder(step.id, "down"); }} disabled={isViewer} style={{ background: "#111111", color: "#f0f0f0", border: "1px solid #0a0a0a", borderRadius: 6, padding: "4px 8px", cursor: isViewer ? "not-allowed" : "pointer", opacity: isViewer ? 0.6 : 1 }}>↓</button>
                  {steps.length > 1 && <button onClick={e => { e.stopPropagation(); handleRemoveStep(step.id); }} disabled={isViewer} style={{ background: "#111111", color: "#fca5a5", border: "1px solid #0a0a0a", borderRadius: 6, padding: "4px 8px", cursor: isViewer ? "not-allowed" : "pointer", opacity: isViewer ? 0.6 : 1 }}>✕</button>}
                </div>
              </li>
            ))}
          </ul>
          <div style={{ margin: "8px 0", background: "#111111", border: "1px solid #1a1a1a", borderRadius: 10, padding: 8 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Minimap</div>
            <div style={{ display: "grid", gap: 4 }}>
              {steps.map(s => (
                <button key={s.id} onClick={() => setSelectedStep(s.id)} style={{ textAlign: "left", background: selectedStep === s.id ? "#1a1a1a" : "#111111", color: "#f0f0f0", border: "1px solid #1a1a1a", borderRadius: 8, padding: "6px 8px", fontSize: 12, cursor: "pointer" }}>
                  #{s.id} · {s.name} ({s.type})
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => handleAddStep(null, "trigger")} disabled={isViewer} style={{ background: "#22c55e", color: "#111111", border: "none", borderRadius: 8, padding: "6px 14px", fontWeight: 800, cursor: isViewer ? "not-allowed" : "pointer", marginTop: 4, opacity: isViewer ? 0.6 : 1 }}>+ Add Trigger</button>
            <button onClick={() => handleAddStep()} disabled={isViewer} style={{ background: "#10b981", color: "#111111", border: "none", borderRadius: 8, padding: "6px 14px", fontWeight: 800, cursor: isViewer ? "not-allowed" : "pointer", marginTop: 4, opacity: isViewer ? 0.6 : 1 }}>+ Add Action</button>
            <button onClick={handleDuplicateBranch} disabled={isViewer} style={{ background: "#a855f7", color: "#111111", border: "none", borderRadius: 8, padding: "6px 14px", fontWeight: 800, cursor: isViewer ? "not-allowed" : "pointer", marginTop: 4, opacity: isViewer ? 0.6 : 1 }}>Duplicate branch</button>
            <button onClick={handleCopySelection} disabled={isViewer || !selectedStepIds.length} style={{ background: "#111111", color: "#f0f0f0", border: "1px solid #1a1a1a", borderRadius: 8, padding: "6px 14px", fontWeight: 700, cursor: isViewer ? "not-allowed" : "pointer", marginTop: 4, opacity: isViewer ? 0.6 : 1 }}>Copy</button>
            <button onClick={handlePasteSelection} disabled={isViewer || !clipboard.length} style={{ background: "#111111", color: "#67e8f9", border: "1px solid #1a1a1a", borderRadius: 8, padding: "6px 14px", fontWeight: 700, cursor: isViewer ? "not-allowed" : "pointer", marginTop: 4, opacity: isViewer ? 0.6 : 1 }}>Paste</button>
            <button onClick={handleMultiDelete} disabled={isViewer || !selectedStepIds.length} style={{ background: "#111111", color: "#fca5a5", border: "1px solid #1a1a1a", borderRadius: 8, padding: "6px 14px", fontWeight: 700, cursor: isViewer ? "not-allowed" : "pointer", marginTop: 4, opacity: isViewer ? 0.6 : 1 }}>Delete selected</button>
          </div>
          <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
            <div style={{ color: "#888888", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.4 }}>Playbooks</div>
            <button onClick={() => setShowTemplateGallery(true)} disabled={isViewer} style={{ alignSelf: "flex-start", background: "#0ea5e9", color: "#111111", border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 800, cursor: isViewer ? "not-allowed" : "pointer", opacity: isViewer ? 0.6 : 1 }}>Open template gallery</button>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button onClick={() => applyPlaybook("seoFix")} disabled={isViewer} style={{ background: "#1a1a1a", color: "#a5f3fc", border: "1px solid #111111", borderRadius: 999, padding: "6px 12px", cursor: isViewer ? "not-allowed" : "pointer", opacity: isViewer ? 0.6 : 1 }}>SEO Fix Queue</button>
              <button onClick={() => applyPlaybook("productSync")} disabled={isViewer} style={{ background: "#1a1a1a", color: "#a5f3fc", border: "1px solid #111111", borderRadius: 999, padding: "6px 12px", cursor: isViewer ? "not-allowed" : "pointer", opacity: isViewer ? 0.6 : 1 }}>Product Sync</button>
              <button onClick={() => applyPlaybook("winback")} disabled={isViewer} style={{ background: "#1a1a1a", color: "#a5f3fc", border: "1px solid #111111", borderRadius: 999, padding: "6px 12px", cursor: isViewer ? "not-allowed" : "pointer", opacity: isViewer ? 0.6 : 1 }}>Winback</button>
              <button onClick={() => applyPlaybook("churnSave")} disabled={isViewer} style={{ background: "#1a1a1a", color: "#a5f3fc", border: "1px solid #111111", borderRadius: 999, padding: "6px 12px", cursor: isViewer ? "not-allowed" : "pointer", opacity: isViewer ? 0.6 : 1 }}>Churn Save</button>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Step Configuration</div>
          {steps.map(step => step.id === selectedStep && (
            <div key={step.id}>
              <input value={step.name} onChange={e => handleStepChange(step.id, { name: e.target.value })} disabled={isViewer} style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, width: "100%", borderRadius: 6, border: "1px solid #0a0a0a", padding: 8, background: "#18181b", color: "#f0f0f0", opacity: isViewer ? 0.6 : 1 }} />
              <select value={step.type} onChange={e => handleStepChange(step.id, { type: e.target.value })} disabled={isViewer} style={{ marginBottom: 8, width: "100%", borderRadius: 6, border: "1px solid #0a0a0a", padding: 8, background: "#18181b", color: "#f0f0f0", opacity: isViewer ? 0.6 : 1 }}>
                <option value="trigger">Trigger</option>
                <option value="action">Action</option>
                <option value="condition">Condition</option>
              </select>
              <textarea value={step.config} onChange={e => handleStepChange(step.id, { config: e.target.value })} disabled={isViewer} rows={5} style={{ width: "100%", borderRadius: 6, border: "1px solid #0a0a0a", padding: 10, background: "#0a0a0a", color: "#f0f0f0", opacity: isViewer ? 0.6 : 1 }} placeholder={step.type === "trigger" ? "Describe the trigger (e.g. 'Order placed with AOV > $50')" : "Describe the action (e.g. 'Send Slack notification to #ops')"} />
              <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {step.type === "trigger" && triggerTemplates.map(t => (
                  <button key={t.label} onClick={() => handleStepChange(step.id, { config: t.config, name: t.label })} disabled={isViewer} style={{ background: "#111111", color: "#a5f3fc", border: "1px solid #111111", borderRadius: 999, padding: "6px 10px", cursor: isViewer ? "not-allowed" : "pointer", opacity: isViewer ? 0.6 : 1 }}>{t.label}</button>
                ))}
                {step.type !== "trigger" && actionTemplates.map(t => (
                  <button key={t.label} onClick={() => handleStepChange(step.id, { config: t.config, name: t.label })} disabled={isViewer} style={{ background: "#111111", color: "#a5f3fc", border: "1px solid #111111", borderRadius: 999, padding: "6px 10px", cursor: isViewer ? "not-allowed" : "pointer", opacity: isViewer ? 0.6 : 1 }}>{t.label}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16, alignItems: "stretch", marginBottom: 14 }}>
        <div>
          {error && <div style={{ color: "#fca5a5", marginBottom: 10 }}>{error}</div>}
          {result && (
            <div style={{ marginTop: 8, background: "#111111", border: "1px solid #1a1a1a", borderRadius: 12, padding: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 4, color: "#f0f0f0" }}>Orchestration Output:</div>
              <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", color: "#e0e0e0", margin: 0 }}>{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
          {diffSummary && (
            <div style={{ marginTop: 12, background: "#111111", border: "1px solid #1a1a1a", borderRadius: 12, padding: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Changes since last run</div>
              <div style={{ color: "#888888", fontSize: 13 }}>Added: {diffSummary.added.length} · Removed: {diffSummary.removed.length} · Edited: {diffSummary.changed.length}</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
                {diffSummary.added.length > 0 && <span style={{ color: "#22c55e", fontSize: 13 }}>+ {diffSummary.added.map(a => a.name).join(", ")}</span>}
                {diffSummary.removed.length > 0 && <span style={{ color: "#fca5a5", fontSize: 13 }}>- {diffSummary.removed.map(r => r.name).join(", ")}</span>}
                {diffSummary.changed.length > 0 && <span style={{ color: "#fbbf24", fontSize: 13 }}>~ {diffSummary.changed.map(c => c.name).join(", ")}</span>}
              </div>
            </div>
          )}
          {versions.length > 0 && (
            <div style={{ marginTop: 12, background: "#111111", border: "1px solid #1a1a1a", borderRadius: 12, padding: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Version history</div>
              <div style={{ display: "grid", gap: 8 }}>
                {versions.map((v, idx) => (
                  <div key={idx} style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 10, padding: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontWeight: 700, color: "#f0f0f0" }}>{v.label}</div>
                      <div style={{ color: "#888888", fontSize: 12 }}>Steps: {v.steps?.length || 0} · Env: {v.env}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button onClick={() => { setSteps(v.steps || []); setEnv(v.env || env); setApprovalRequired(!!v.approvalRequired); }} style={{ background: "#0ea5e9", color: "#111111", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>Load</button>
                      <button onClick={() => setLastRunSnapshot(v)} style={{ background: "#f59e0b", color: "#111111", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>Baseline</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Preview Payload</div>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", color: "#e0e0e0", margin: 0, maxHeight: 260, overflow: "auto" }}>{JSON.stringify(previewPayload, null, 2)}</pre>
          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            <div style={{ fontWeight: 700 }}>Rollout & safety</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <input type="range" min={1} max={100} value={rolloutPercent} onChange={e => setRolloutPercent(Number(e.target.value))} />
              <span style={{ color: "#f0f0f0", fontWeight: 700 }}>{rolloutPercent}% rollout</span>
              <button onClick={() => setRolloutPercent(100)} style={{ background: "#22c55e", color: "#111111", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>Promote to 100%</button>
              <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#f0f0f0" }}>
                <input type="checkbox" checked={autoRevert} onChange={e => setAutoRevert(e.target.checked)} /> Auto-revert on errors
              </label>
              <input type="number" min={1} max={50} value={errorSpikeThreshold} onChange={e => setErrorSpikeThreshold(Number(e.target.value))} style={{ width: 80, background: "#111111", color: "#f0f0f0", border: "1px solid #1a1a1a", borderRadius: 8, padding: "6px" }} />
              <span style={{ color: "#888888", fontSize: 12 }}>Spike threshold</span>
            </div>
          </div>
          <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
            <div style={{ fontWeight: 700 }}>Sinks & webhooks</div>
            <input value={slackChannel} onChange={e => setSlackChannel(e.target.value)} placeholder="Slack channel (e.g. #ops)" style={{ background: "#111111", color: "#f0f0f0", border: "1px solid #1a1a1a", borderRadius: 8, padding: "8px" }} />
            <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="Webhook URL" style={{ background: "#111111", color: "#f0f0f0", border: "1px solid #1a1a1a", borderRadius: 8, padding: "8px" }} />
            <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#f0f0f0" }}>
              <input type="checkbox" checked={queueEnabled} onChange={e => setQueueEnabled(e.target.checked)} /> Queue stub enabled
            </label>
            <button onClick={sendWebhookEvent} style={{ background: "#0ea5e9", color: "#111111", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 800, cursor: "pointer" }}>Send sample event</button>
          </div>
          <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
            <div style={{ fontWeight: 700 }}>SLA budgets</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <label style={{ color: "#f0f0f0", display: "flex", alignItems: "center", gap: 6 }}>
                Latency budget (ms)
                <input type="number" min={100} max={3000} value={latencyBudgetMs} onChange={e => setLatencyBudgetMs(Number(e.target.value))} style={{ width: 90, background: "#111111", color: "#f0f0f0", border: "1px solid #1a1a1a", borderRadius: 8, padding: "6px" }} />
              </label>
              <label style={{ color: "#f0f0f0", display: "flex", alignItems: "center", gap: 6 }}>
                Error budget (% allowed)
                <input type="number" min={0.5} max={10} step={0.5} value={errorBudgetPct} onChange={e => setErrorBudgetPct(Number(e.target.value))} style={{ width: 90, background: "#111111", color: "#f0f0f0", border: "1px solid #1a1a1a", borderRadius: 8, padding: "6px" }} />
              </label>
              <span style={{ color: "#888888", fontSize: 12 }}>{slaCompliance.summary}</span>
            </div>
          </div>
        </div>
      </div>

      {history.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Recent Orchestrations</div>
          <ul style={{ paddingLeft: 18 }}>
            {history.map((h, i) => (
              <li key={i} style={{ marginBottom: 10 }}>
                <div><b>Name:</b> {h.workflowName || "Untitled"} · <b>Env:</b> {h.env} · <b>Version:</b> {h.versionTag}</div>
                <div><b>Steps:</b> {h.steps.map(s => s.name).join(", ")}</div>
                <div><b>Orchestration:</b> {JSON.stringify(h.orchestration).slice(0, 140)}{JSON.stringify(h.orchestration).length > 140 ? "..." : ""}</div>
                <div style={{ color: "#888888", fontSize: 12 }}>{h.at ? new Date(h.at).toLocaleString() : ""}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: 18, display: "grid", gap: 10, background: "#111111", border: "1px solid #1a1a1a", borderRadius: 12, padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontWeight: 800 }}>Observability</div>
          <div style={{ color: "#888888", fontSize: 12 }}>Last publish {lastPublish ? new Date(lastPublish).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</div>
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontWeight: 700, color: "#f0f0f0" }}>Recent errors</div>
          {recentErrors.length === 0 ? <div style={{ color: "#22c55e" }}>Clean</div> : recentErrors.map((e, i) => <div key={i} style={{ color: "#fca5a5", fontSize: 12 }}>{e}</div>)}
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <div style={{ fontWeight: 700, color: "#f0f0f0" }}>Audit log</div>
          {auditLog.length === 0 ? <div style={{ color: "#888888", fontSize: 12 }}>No events yet</div> : auditLog.map((a, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8, background: "#111111", border: "1px solid #1a1a1a", borderRadius: 8, padding: "6px 8px", color: "#f0f0f0", fontSize: 12 }}>
              <span>{a.event}</span>
              <span style={{ color: "#888888" }}>{a.env}</span>
              <span style={{ color: "#888888" }}>{new Date(a.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          ))}
        </div>
      </div>

      {showTemplateGallery && (
        <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 30, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 14, padding: 16, width: "min(760px, 94vw)", boxShadow: "0 18px 60px #000" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 800, color: "#a5f3fc" }}>Template gallery</div>
                <div style={{ color: "#888888", fontSize: 12 }}>Pick a ready-made flow with rollout defaults.</div>
              </div>
              <button onClick={() => setShowTemplateGallery(false)} style={{ background: "#1a1a1a", color: "#f0f0f0", border: "1px solid #333333", borderRadius: 10, padding: "8px 12px", fontWeight: 800, cursor: "pointer" }}>Close</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
              {galleryTemplates.map(tpl => (
                <div key={tpl.id} style={{ background: "#111111", border: "1px solid #1a1a1a", borderRadius: 10, padding: 10, display: "grid", gap: 8 }}>
                  <div style={{ fontWeight: 800 }}>{tpl.title}</div>
                  <div style={{ color: "#888888", fontSize: 12 }}>{tpl.description}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {tpl.badges?.map(b => (
                      <span key={b} style={{ background: "#1a1a1a", color: "#a5f3fc", border: "1px solid #111111", borderRadius: 999, padding: "4px 8px", fontSize: 12 }}>{b}</span>
                    ))}
                  </div>
                  <div style={{ color: "#67e8f9", fontSize: 12 }}>Rollout: {tpl.rollout || 100}%</div>
                  <button onClick={() => applyTemplate(tpl)} disabled={isViewer} style={{ background: "#22c55e", color: "#111111", border: "none", borderRadius: 8, padding: "8px 10px", fontWeight: 800, cursor: isViewer ? "not-allowed" : "pointer", opacity: isViewer ? 0.6 : 1 }}>Use template</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 24, fontSize: 13, color: "#a5f3fc", textAlign: "center" }}>
        <span>Need more? Ping <a href="mailto:support@aura-core.ai" style={{ color: "#a5f3fc", textDecoration: "underline" }}>support@aura-core.ai</a> with your dream flow.</span>
      </div>
    </div>
  );
}



