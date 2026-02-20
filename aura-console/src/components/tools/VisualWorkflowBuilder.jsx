﻿import React, { useEffect, useMemo, useRef, useState } from "react";
import BackButton from "./BackButton";
import { apiFetch } from "../../api";

const STORAGE_KEY = "visual-workflow-builder:draft";

const PAYLOAD_PRESETS = [
  { id: "order-created", name: "Order Created", payload: { event: "order_created", amount: 180, customer: "jane@example.com" }, badge: "dev" },
  { id: "checkout-abandoned", name: "Abandoned Checkout", payload: { event: "checkout_abandoned", cart_value: 220, segment: "VIP" }, badge: "dev" },
  { id: "performance", name: "Perf Budget", payload: { event: "order_created", latencyMs: 620, path: "checkout" }, badge: "dev" }
];

const PALETTE_BLOCKS = [
  { id: "trigger-order", label: "Trigger: Order Created", type: "trigger", description: "Listens for new orders" },
  { id: "trigger-abandon", label: "Trigger: Checkout Abandoned", type: "trigger", description: "Fires on checkout.abandoned" },
  { id: "action-slack", label: "Action: Slack Alert", type: "action", description: "Send Slack message to #ops" },
  { id: "action-email", label: "Action: Email", type: "action", description: "Send Klaviyo email" },
  { id: "condition-geo", label: "Condition: Geo == US", type: "condition", description: "Filter by region" },
  { id: "condition-aov", label: "Condition: AOV >= 150", type: "condition", description: "High intent segment" }
];

const uniqueBlockId = () => `vwf_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const hashString = (str) => {
  // Simple FNV-1a style hash for integrity tagging
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash.toString(16);
};

export default function VisualWorkflowBuilder() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [canvas, setCanvas] = useState([]);
  const [canvasViewMode, setCanvasViewMode] = useState("cards");
  const [templateGallery, setTemplateGallery] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [env, setEnv] = useState("dev");
  const [versionTag, setVersionTag] = useState("v1");
  const [approvalRequired, setApprovalRequired] = useState(true);
  const [approverEmail, setApproverEmail] = useState("");
  const [schemaJson, setSchemaJson] = useState("{\n  \"type\": \"object\",\n  \"properties\": {}\n}");
  const [testPayload, setTestPayload] = useState("{\n  \"event\": \"order_created\"\n}");
  const [simulation, setSimulation] = useState(null);
  const [validationIssues, setValidationIssues] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [workflowName, setWorkflowName] = useState("Untitled Workflow");
  const [status, setStatus] = useState("draft");
  const [revision, setRevision] = useState(null);
  const [testName, setTestName] = useState("Smoke test");
  const [testCasePayload, setTestCasePayload] = useState("{\n  \"event\": \"order_created\"\n}");
  const [testResults, setTestResults] = useState([]);
  const [testVariantsJson, setTestVariantsJson] = useState("[\n  { \"name\": \"US order\", \"payload\": { \"event\": \"order_created\", \"country\": \"US\" } },\n  { \"name\": \"EU order\", \"payload\": { \"event\": \"order_created\", \"country\": \"DE\" } }\n]");
  const [variantResults, setVariantResults] = useState([]);
  const [testRunning, setTestRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);
  const [issueHelp, setIssueHelp] = useState(null);
  const [analyticsSummary, setAnalyticsSummary] = useState({});
  const [schemaWarnings, setSchemaWarnings] = useState([]);
  const [canaryPercent, setCanaryPercent] = useState(0);
  const [shadowMode, setShadowMode] = useState(false);
  const [performanceBudgetMs, setPerformanceBudgetMs] = useState(0);
  const [history, setHistory] = useState([]);
  const [simulationHistory, setSimulationHistory] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [draftStatus, setDraftStatus] = useState("idle");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [preflightIssues, setPreflightIssues] = useState([]);
  const [selectedPayloadPreset, setSelectedPayloadPreset] = useState("order-created");
  const [lastSimulatedSnapshot, setLastSimulatedSnapshot] = useState(null);
  const [confirmationNote, setConfirmationNote] = useState("");
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
      return JSON.parse(window.localStorage.getItem("suite:status:visual-workflow-builder")) || null;
    } catch {
      return null;
    }
  });
  const [showPreflightPopover, setShowPreflightPopover] = useState(false);
  const applyQuickFix = (kind) => {
    if (kind === "approver") {
      setApproverEmail(prev => prev || "ops@shopify-brand.com");
      setApprovalRequired(true);
    }
    if (kind === "prod-note") {
      setConfirmationNote(prev => prev || "Production rollout intent: enable workflow safely.");
    }
    if (kind === "trigger-action") {
      if (!canvas.length) {
        setCanvas([
          { id: uniqueBlockId(), label: "Trigger: Order Created", type: "trigger", description: "Shopify order", config: { event: "order_created" } },
          { id: uniqueBlockId(), label: "Action: Notify Slack", type: "action", description: "Slack #ops", config: { channel: "slack" } }
        ]);
      } else {
        setCanvas(prev => {
          const next = [...prev];
          if (!next[0] || next[0].type !== "trigger") {
            next.unshift({ id: uniqueBlockId(), label: "Trigger: Order Created", type: "trigger", description: "Shopify order" });
          }
          if (!next.find(b => b.type === "action")) {
            next.push({ id: uniqueBlockId(), label: "Action: Email", type: "action", description: "Send Klaviyo email" });
          }
          return next;
        });
      }
    }
    if (kind === "dedupe-labels") {
      setCanvas(prev => {
        const seen = new Map();
        return prev.map(b => {
          const base = b.label || "Block";
          const key = base.toLowerCase();
          const count = seen.get(key) || 0;
          seen.set(key, count + 1);
          return count === 0 ? b : { ...b, label: `${base} (${count + 1})` };
        });
      });
    }
  };
  const fileInputRef = useRef();
  const hydratedRef = useRef(false);
  const dirtySkipRef = useRef(true);

  const isViewer = role === "viewer";
  const devSandbox = env === "dev";
  const quickFixForIssue = (issue = "") => {
    const lower = issue.toLowerCase();
    if (lower.includes("approver") || lower.includes("approval")) return "approver";
    if (lower.includes("prod") || lower.includes("note")) return "prod-note";
    if (lower.includes("trigger") || lower.includes("action")) return "trigger-action";
    if (lower.includes("duplicate")) return "dedupe-labels";
    if (lower.includes("performance") || lower.includes("perf")) return "dedupe-labels";
    return null;
  };

  const clearPreflightStatus = () => {
    setPreflightStatus(null);
    setPreflightIssues([]);
    setPreflightTrace([]);
    try { window.localStorage.removeItem("suite:status:visual-workflow-builder"); } catch (_) {}
  };

  const downloadPreflightReport = () => {
    const payload = { status: preflightStatus, issues: preflightIssues, trace: preflightTrace, generatedAt: Date.now() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "visual-workflow-preflight.json";
    a.click();
    setTimeout(() =>URL.revokeObjectURL(url), 2000);
  };

  const goBackToSuite = () => {
    if (typeof window !== "undefined" && typeof window.__AURA_TO_SUITE === "function") {
      window.__AURA_TO_SUITE("workflows");
    }
  };

  const snapshotState = () => ({
    canvas,
    workflowName,
    env,
    versionTag,
    approvalRequired,
    approverEmail,
    schemaJson,
    testPayload,
    status,
    canaryPercent,
    shadowMode,
    performanceBudgetMs,
    testName,
    testCasePayload,
    confirmationNote,
    currentId,
    revision
  });

  const handleInputChange = (setter, parser = v => v) => e => {
    if (isViewer) {
      setError("View-only mode — request edit access to modify.");
      return;
    }
    pushUndoSnapshot();
    setter(parser(e.target.value));
  };

  const handleToggle = (setter) => e => {
    if (isViewer) {
      setError("View-only mode — request edit access to modify.");
      return;
    }
    pushUndoSnapshot();
    setter(e.target.checked);
  };

  const handleDirectChange = (setter, parser = v => v) => value => {
    if (isViewer) {
      setError("View-only mode — request edit access to modify.");
      return;
    }
    pushUndoSnapshot();
    setter(parser(value));
  };

  const pushUndoSnapshot = () => {
    setUndoStack(prev => [...prev.slice(-9), JSON.parse(JSON.stringify(snapshotState()))]);
    setRedoStack([]);
  };

  const restoreSnapshot = (snap) => {
    if (!snap) return;
    pushUndoSnapshot();
    if (snap.canvas) setCanvas(snap.canvas);
    if (snap.workflowName) setWorkflowName(snap.workflowName);
    if (snap.env) setEnv(snap.env);
    if (snap.versionTag) setVersionTag(snap.versionTag);
    if (typeof snap.approvalRequired === "boolean") setApprovalRequired(snap.approvalRequired);
    if (snap.approverEmail !== undefined) setApproverEmail(snap.approverEmail);
    if (snap.schemaJson) setSchemaJson(snap.schemaJson);
    if (snap.testPayload) setTestPayload(snap.testPayload);
    if (snap.status) setStatus(snap.status);
    if (snap.canaryPercent !== undefined) setCanaryPercent(snap.canaryPercent);
    if (snap.shadowMode !== undefined) setShadowMode(snap.shadowMode);
    if (snap.performanceBudgetMs !== undefined) setPerformanceBudgetMs(snap.performanceBudgetMs);
    if (snap.testName) setTestName(snap.testName);
    if (snap.testCasePayload) setTestCasePayload(snap.testCasePayload);
    if (snap.confirmationNote !== undefined) setConfirmationNote(snap.confirmationNote);
    if (snap.selectedPayloadPreset) setSelectedPayloadPreset(snap.selectedPayloadPreset);
    if (snap.lastSimulatedSnapshot) setLastSimulatedSnapshot(snap.lastSimulatedSnapshot);
    if (snap.currentId) setCurrentId(snap.currentId);
  };

  const handleUndo = () => {
    if (!undoStack.length) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack(undoStack.slice(0, -1));
    setRedoStack(r => [...r.slice(-9), JSON.parse(JSON.stringify(snapshotState()))]);
    setCanvas(prev.canvas || []);
    setWorkflowName(prev.workflowName || "");
    setEnv(prev.env || "dev");
    setVersionTag(prev.versionTag || "v1");
    setApprovalRequired(!!prev.approvalRequired);
    setApproverEmail(prev.approverEmail || "");
    setSchemaJson(prev.schemaJson || "");
    setTestPayload(prev.testPayload || "{}");
    setStatus(prev.status || "draft");
    setCanaryPercent(prev.canaryPercent ?? 0);
    setShadowMode(!!prev.shadowMode);
    setPerformanceBudgetMs(prev.performanceBudgetMs ?? 0);
    setTestName(prev.testName || "");
    setTestCasePayload(prev.testCasePayload || "{}");
    setConfirmationNote(prev.confirmationNote || "");
    setCurrentId(prev.currentId || null);
    setRevision(prev.revision || null);
  };

  const handleRedo = () => {
    if (!redoStack.length) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(redoStack.slice(0, -1));
    setUndoStack(u => [...u.slice(-9), JSON.parse(JSON.stringify(snapshotState()))]);
    setCanvas(next.canvas || []);
    setWorkflowName(next.workflowName || "");
    setEnv(next.env || "dev");
    setVersionTag(next.versionTag || "v1");
    setApprovalRequired(!!next.approvalRequired);
    setApproverEmail(next.approverEmail || "");
    setSchemaJson(next.schemaJson || "");
    setTestPayload(next.testPayload || "{}");
    setStatus(next.status || "draft");
    setCanaryPercent(next.canaryPercent ?? 0);
    setShadowMode(!!next.shadowMode);
    setPerformanceBudgetMs(next.performanceBudgetMs ?? 0);
    setTestName(next.testName || "");
    setTestCasePayload(next.testCasePayload || "{}");
    setConfirmationNote(next.confirmationNote || "");
    setCurrentId(next.currentId || null);
    setRevision(next.revision || null);
  };

  async function loadHistoryAndComments(id) {
    try {
      const [hResp, cResp] = await Promise.all([
        apiFetch(`/api/visual-workflow-builder/workflows/${id}/history`),
        apiFetch(`/api/visual-workflow-builder/workflows/${id}/comments`),
      ]);
      const hData = await hResp.json();
      const cData = await cResp.json();
      if (hData.ok) setHistory(hData.history || []);
      if (cData.ok) setComments(cData.comments || []);
    } catch (_err) {
      /* ignore */
    }
  }

  const loadWorkflows = React.useCallback(async () => {
    setLoading(true);
    try {
      const resp = await apiFetch("/api/visual-workflow-builder/workflows");
      const data = await resp.json();
      if (data.ok) {
        setWorkflows(data.workflows || []);
        if (data.workflows?.length && !currentId) {
          const first = data.workflows[0];
          setCurrentId(first.id);
          setWorkflowName(first.name || "Untitled Workflow");
          setEnv(first.env || "dev");
          setVersionTag(first.versionTag || "v1");
          setApprovalRequired(!!first.approvalRequired);
          setApproverEmail(first.approverEmail || "");
          setSchemaJson(first.contract || schemaJson);
          setCanvas(first.definition?.steps || []);
          setStatus(first.status || "draft");
          setRevision(first.revision || null);
          setCanaryPercent(first.canaryPercent || 0);
          setShadowMode(!!first.shadowMode);
          setPerformanceBudgetMs(first.performanceBudgetMs || 0);
          setTestResults([]);
          loadHistoryAndComments(first.id);
          dirtySkipRef.current = true;
          setDirtySinceSave(false);
        }
      }
    } catch (err) {
      setError("Failed to load workflows: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [currentId, schemaJson]);

  const loadAnalytics = React.useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const resp = await apiFetch("/api/visual-workflow-builder/analytics");
      const data = await resp.json();
      if (data.ok) setAnalytics(data.analytics || []);
      const summaryResp = await apiFetch("/api/visual-workflow-builder/analytics/summary");
      const summaryData = await summaryResp.json();
      if (summaryData.ok) setAnalyticsSummary(summaryData.summary || {});
    } catch (err) {
      setError("Failed to load analytics");
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadWorkflows();
    loadAnalytics();
  }, [loadWorkflows, loadAnalytics]);

  // Load draft
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.canvas) setCanvas(parsed.canvas);
        if (parsed.workflowName) setWorkflowName(parsed.workflowName);
        if (parsed.env) setEnv(parsed.env);
        if (parsed.versionTag) setVersionTag(parsed.versionTag);
        if (typeof parsed.approvalRequired === "boolean") setApprovalRequired(parsed.approvalRequired);
        if (parsed.approverEmail) setApproverEmail(parsed.approverEmail);
        if (parsed.schemaJson) setSchemaJson(parsed.schemaJson);
        if (parsed.testPayload) setTestPayload(parsed.testPayload);
        if (parsed.status) setStatus(parsed.status);
        if (parsed.canaryPercent !== undefined) setCanaryPercent(parsed.canaryPercent);
        if (parsed.shadowMode !== undefined) setShadowMode(parsed.shadowMode);
        if (parsed.performanceBudgetMs !== undefined) setPerformanceBudgetMs(parsed.performanceBudgetMs);
        if (parsed.testName) setTestName(parsed.testName);
        if (parsed.testCasePayload) setTestCasePayload(parsed.testCasePayload);
        if (parsed.confirmationNote) setConfirmationNote(parsed.confirmationNote);
        if (parsed.lastSavedAt) setLastSavedAt(parsed.lastSavedAt);
        dirtySkipRef.current = true;
        setDirtySinceSave(false);
      } catch (err) {
        console.warn("Failed to parse draft", err);
      }
    }
  }, []);

  // Autosave
  useEffect(() => {
    if (typeof window === "undefined") return;
    setDraftStatus("saving");
    const handle = setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        canvas,
        workflowName,
        env,
        versionTag,
        approvalRequired,
        approverEmail,
        schemaJson,
        testPayload,
        status,
        canaryPercent,
        shadowMode,
        performanceBudgetMs,
        testName,
        testCasePayload,
        confirmationNote,
        lastSavedAt: Date.now()
      }));
      setDraftStatus("saved");
      setLastSavedAt(Date.now());
      setDirtySinceSave(false);
    }, 450);
    return () => clearTimeout(handle);
  }, [canvas, workflowName, env, versionTag, approvalRequired, approverEmail, schemaJson, testPayload, status, canaryPercent, shadowMode, performanceBudgetMs, testName, testCasePayload, confirmationNote]);

  const handleManualSave = () => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      canvas,
      workflowName,
      env,
      versionTag,
      approvalRequired,
      approverEmail,
      schemaJson,
      testPayload,
      status,
      canaryPercent,
      shadowMode,
      performanceBudgetMs,
      testName,
      testCasePayload,
      confirmationNote,
      lastSavedAt: Date.now()
    }));
    setDraftStatus("saved");
    setLastSavedAt(Date.now());
    setDirtySinceSave(false);
  };

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
  }, [canvas, workflowName, env, versionTag, approvalRequired, approverEmail, schemaJson, testPayload, status, canaryPercent, shadowMode, performanceBudgetMs, testName, testCasePayload, confirmationNote]);

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

  const runPreflight = () => {
    const issues = [];
    const trace = [];
    if (approvalRequired && !approverEmail) issues.push("Approver email required when approvals are on.");
    if (env === "prod" && !confirmationNote.trim()) issues.push("Add a prod ship note/intent before promoting.");
    if (!workflowName.trim()) issues.push("Workflow name is required.");
    if (canaryPercent < 0 || canaryPercent > 100) issues.push("Canary percent must be between 0 and 100.");
    if (performanceBudgetMs && performanceBudgetMs < 0) issues.push("Performance budget must be positive.");
    if (!canvas.length) issues.push("Add at least one step to the canvas.");

    canvas.forEach((b, idx) => {
      const blockIssues = [];
      const type = (b?.type || "action").toLowerCase();
      if (!b?.label?.trim()) blockIssues.push("Label missing");
      if (!["trigger", "action", "condition"].includes(type)) blockIssues.push("Type must be trigger | action | condition");
      if (type === "condition" && idx === 0) blockIssues.push("Condition needs a trigger before it");
      if (type === "action" && shadowMode && env !== "prod") blockIssues.push("Action in shadow/non-prod will be dry-run only");
      if (type === "condition" && !canvasStats.triggerFirst) blockIssues.push("Place a trigger first so conditions have context");
      if (idx === canvas.length - 1 && type !== "action") blockIssues.push("Consider ending with an action");
      if (canvasStats.duplicateLabels.includes(b.label)) blockIssues.push("Duplicate label");
      if (blockIssues.length) trace.push({ label: b.label || `Block ${idx + 1}`, idx, issues: blockIssues });
    });

    if (canvas.length && !(canvasStats.triggers > 0)) issues.push("Add a trigger to start the flow.");
    if (canvas.length && !canvasStats.triggerFirst) issues.push("Place a trigger as the first block.");
    if (canvas.length && !(canvasStats.actions > 0)) issues.push("Add at least one action block.");
    if (canvasStats.conditionWithoutTrigger) issues.push("Move conditions after a trigger so they have context.");
    if (canvasStats.duplicateLabels.length) issues.push(`Duplicate block labels detected: ${canvasStats.duplicateLabels.join(', ')}`);
    setPreflightIssues(issues);
    setPreflightTrace(trace);
    const status = { ok: issues.length === 0, ts: Date.now(), issues: issues.length };
    setPreflightStatus(status);
    try { window.localStorage.setItem("suite:status:visual-workflow-builder", JSON.stringify(status)); } catch (_) {}
    return issues;
  };

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (env === "prod" || approvalRequired) {
      runPreflight();
    }
  }, [env, approvalRequired, shadowMode, canaryPercent, performanceBudgetMs]);

  // Hotkeys
  useEffect(() => {
    const listener = e => {
      if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleManualSave();
      }
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleSimulate();
      }
      if (e.ctrlKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "z") || (e.ctrlKey && e.key.toLowerCase() === "y")) {
        e.preventDefault();
        handleRedo();
      }
      if (!e.ctrlKey && !e.metaKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        setTestName(`Smoke ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`);
      }
      if (e.ctrlKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
      if (e.altKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        runPreflight();
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [undoStack, redoStack]);

  const formatTime = ts => ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

  const diffSummary = useMemo(() => {
    if (!lastSimulatedSnapshot) return null;
    const prevCanvas = lastSimulatedSnapshot.canvas || [];
    const prevLen = prevCanvas.length;
    const curLen = canvas.length;
    const added = Math.max(curLen - prevLen, 0);
    const removed = Math.max(prevLen - curLen, 0);
    const changed = JSON.stringify(prevCanvas) === JSON.stringify(canvas) ? 0 : Math.min(curLen, prevLen);
    return { added, removed, changed };
  }, [canvas, lastSimulatedSnapshot]);

  const canvasStats = useMemo(() => {
    let triggers = 0;
    let actions = 0;
    let conditions = 0;
    let triggerFirst = false;
    let lastIsAction = false;
    let conditionWithoutTrigger = false;
    const duplicateLabels = [];
    const seenLabels = new Map();
    let seenTrigger = false;

    canvas.forEach((b, idx) => {
      const type = (b?.type || "action").toLowerCase();
      if (type === "trigger") {
        triggers += 1;
        seenTrigger = true;
        if (idx === 0) triggerFirst = true;
      }
      if (type === "action") actions += 1;
      if (type === "condition") {
        conditions += 1;
        if (!seenTrigger) conditionWithoutTrigger = true;
      }
      const labelKey = (b?.label || "").trim().toLowerCase();
      if (labelKey) {
        const count = (seenLabels.get(labelKey) || 0) + 1;
        seenLabels.set(labelKey, count);
        if (count === 2) duplicateLabels.push(b.label || labelKey);
      }
    });

    if (canvas.length) {
      const tailType = (canvas[canvas.length - 1]?.type || "action").toLowerCase();
      lastIsAction = tailType === "action";
    }

    return { triggers, actions, conditions, triggerFirst, lastIsAction, conditionWithoutTrigger, duplicateLabels };
  }, [canvas]);

  const launchHealth = useMemo(() => {
    const guardrailsOk = preflightIssues.length === 0;
    const approvalsOk = approvalRequired ? !!approverEmail : true;
    const steps = canvas.length;
    const triggerScore = canvasStats.triggers > 0 && canvasStats.triggerFirst ? 8 : 0;
    const actionScore = canvasStats.actions > 0 && canvasStats.lastIsAction ? 8 : 0;
    const coverage = Math.min(100, (steps * 12) + triggerScore + actionScore + (guardrailsOk ? 16 : 0) + (approvalsOk ? 10 : 0) + (canaryPercent ? 4 : 0) + (performanceBudgetMs ? 4 : 0));
    return {
      coverage,
      guardrailsOk,
      approvalsOk,
      steps,
      analytics: analyticsSummary?.successRate ? `${analyticsSummary.successRate}% success` : "No analytics yet"
    };
  }, [preflightIssues.length, approvalRequired, approverEmail, canvas.length, canaryPercent, performanceBudgetMs, analyticsSummary, canvasStats]);

  const perfDetail = useMemo(() => {
    if (performanceBudgetMs && performanceBudgetMs > 800) return `Perf detail: budget ${performanceBudgetMs}ms — tighten to <600ms.`;
    if (canvas.length >= 8 || canvasStats.actions >= 5) return `Perf detail: ${canvas.length} steps / ${canvasStats.actions} actions — consider splitting.`;
    return null;
  }, [performanceBudgetMs, canvas.length, canvasStats.actions]);

  const healthChecklist = useMemo(() => ([
    { label: "Preflight clear", ok: preflightIssues.length === 0 },
    { label: "Trigger starts the flow", ok: canvasStats.triggers > 0 && canvasStats.triggerFirst },
    { label: "Has at least one action", ok: canvasStats.actions > 0 },
    { label: "Conditions have a trigger before them", ok: !canvasStats.conditionWithoutTrigger },
    { label: "Approver email when approvals on", ok: approvalRequired ? !!approverEmail : true },
    { label: "Prod/shadow note added", ok: env !== "prod" ? true : !!confirmationNote.trim() }
  ]), [preflightIssues.length, canvasStats, approvalRequired, approverEmail, env, confirmationNote]);

  // Onboarding content
  const onboardingContent = (
    <div style={{ padding: 24, background: '#3f3f46', borderRadius: 12, marginBottom: 18, color: '#fafafa' }}>
      <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Visual Workflow Builder</h3>
      <ul style={{ margin: '16px 0 0 18px', color: '#52525b', fontSize: 16 }}>
        <li>Drag blocks (triggers, actions, conditions) from the palette onto the canvas</li>
        <li>Template gallery for common workflows</li>
        <li>Import/export workflows, analyze results</li>
        <li>Accessible, secure, and fully compliant</li>
      </ul>
      <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: '#09090b', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Get Started</button>
    </div>
  );

  // Import/export
  const handleImport = e => {
    if (isViewer) return setError("View-only mode: request access to import.");
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const parsed = JSON.parse(evt.target.result);
        const payloadCanvas = Array.isArray(parsed) ? parsed : (parsed.canvas || []);
        const meta = parsed.meta || {};
        const normalized = payloadCanvas.map(b => ({
          id: b.id || uniqueBlockId(),
          label: b.label || "Untitled block",
          type: b.type || "action",
          description: b.description || "",
        }));
        if (meta.hash) {
          const computed = hashString(JSON.stringify(normalized));
          if (computed !== meta.hash) throw new Error("Integrity check failed (hash mismatch)");
        }
        pushUndoSnapshot();
        setCanvas(normalized);
        setImported(file.name + (meta.version ? ` v${meta.version}` : ""));
        setError("");
      } catch (err) {
        setError("Import failed: " + err.message);
      }
    };
    reader.readAsText(file);
  };
  const handleExport = () => {
    if (isViewer) return setError("View-only mode: request access to export.");
    const normalized = canvas.map(b => ({ id: b.id || uniqueBlockId(), label: b.label || "Untitled block", type: b.type || "action", description: b.description || "" }));
    const meta = { version: 1, exportedAt: Date.now(), hash: hashString(JSON.stringify(normalized)) };
    const blob = new Blob([JSON.stringify({ meta, canvas: normalized }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setTimeout(() =>URL.revokeObjectURL(url), 10000);
  };

  const handleDropOnCanvas = (data) => {
    if (isViewer) return setError("View-only mode: request access to edit.");
    try {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      const block = Array.isArray(parsed) ? parsed[0] : parsed;
      if (!block || !block.label) return;
      pushUndoSnapshot();
      setCanvas(prev => [...prev, { id: uniqueBlockId(), label: block.label, type: block.type || "action", description: block.description || "" }]);
      setError("");
    } catch (err) {
      setError("Drop failed: " + err.message);
    }
  };

  const handleDragStart = (e, block) => {
    e.dataTransfer.setData("application/json", JSON.stringify(block));
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleAddBlockQuick = (block) => {
    if (isViewer) return setError("View-only mode: request access to edit.");
    pushUndoSnapshot();
    setCanvas(prev => [...prev, { id: uniqueBlockId(), label: block.label, type: block.type || "action", description: block.description || "" }]);
  };

  const handleBlockFieldChange = (idx, field, value) => {
    if (isViewer) return setError("View-only mode: request access to edit.");
    pushUndoSnapshot();
    setCanvas(prev => prev.map((b, i) => i === idx ? { ...b, [field]: value } : b));
  };

  const handleRemoveBlock = (idx) => {
    if (isViewer) return setError("View-only mode: request access to edit.");
    pushUndoSnapshot();
    setCanvas(prev => prev.filter((_, i) => i !== idx));
  };

  const handleMoveBlock = (idx, direction) => {
    if (isViewer) return setError("View-only mode: request access to edit.");
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= canvas.length) return;
    pushUndoSnapshot();
    setCanvas(prev => {
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.splice(newIdx, 0, item);
      return next;
    });
  };

  const validate = () => {
    const issues = [];
    if (approvalRequired && !approverEmail) issues.push("Approver email required");
    try {
      const parsed = JSON.parse(schemaJson || "{}");
      const warns = [];
      if (parsed.type === "object" && parsed.properties) {
        Object.entries(parsed.properties).forEach(([k, v]) => { if (v && v.type === "any") warns.push(`Field ${k} is 'any'`); });
      }
      setSchemaWarnings(warns);
    } catch { issues.push("Schema JSON invalid"); }
    if (canaryPercent < 0 || canaryPercent > 100) issues.push("Canary percent must be between 0 and 100");
    if (performanceBudgetMs && performanceBudgetMs < 0) issues.push("Performance budget must be positive");
    if (canvasStats.duplicateLabels.length) issues.push(`Duplicate block labels detected: ${canvasStats.duplicateLabels.join(', ')}`);
    setValidationIssues(issues);
    return issues;
  };

  const handleSimulate = () => {
    if (isViewer) return setError("View-only mode: request access to simulate.");
    if (devSandbox) {
      setError("Sandbox mode: switch to Stage or Prod to run full simulations.");
      return;
    }
    if (!currentId) {
      setError("Save the workflow before running a server simulation.");
      return;
    }
    try {
      const payload = JSON.parse(testPayload || "{}");
      apiFetch(`/api/visual-workflow-builder/workflows/${currentId}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload }),
      }).then(async resp => {
        const data = await resp.json();
        if (!data.ok) throw new Error(data.error || "Simulation failed");
        setSimulation(data.simulation);
        const snap = { canvas, env, versionTag, ts: Date.now(), approverEmail, approvalRequired, testPayload, confirmationNote, performanceBudgetMs, selectedPayloadPreset };
        setLastSimulatedSnapshot(snap);
        setSimulationHistory(prev => [snap, ...prev].slice(0, 5));
        setError("");
        setDirtySinceSave(false);
      }).catch(err => {
        setError("Simulation failed: " + err.message);
        setSimulation(null);
      });
    } catch (err) {
      setError("Simulation failed: " + err.message);
      setSimulation(null);
    }
  };

  const handleRunVariantSimulations = async () => {
    if (isViewer) return setError("View-only mode: request access to simulate.");
    if (!currentId) return setError("Save the workflow before running simulations.");
    let variants;
    try {
      variants = JSON.parse(testVariantsJson || "[]");
      if (!Array.isArray(variants)) throw new Error("Variants must be an array");
    } catch (err) {
      setError("Variant parse failed: " + err.message);
      return;
    }
    setError("");
    setVariantResults([]);
    setTestRunning(true);
    const results = [];
    for (const v of variants) {
      try {
        const payload = v.payload || {};
        const resp = await apiFetch(`/api/visual-workflow-builder/workflows/${currentId}/simulate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload }),
        });
        const data = await resp.json();
        if (!data.ok) throw new Error(data.error || "Simulation failed");
        results.push({ name: v.name || "variant", ok: true, warnings: data.simulation?.warnings || [], actions: data.simulation?.actions || [] });
      } catch (err) {
        results.push({ name: v.name || "variant", ok: false, error: err.message });
      }
    }
    setVariantResults(results);
    setTestRunning(false);
  };

  const handleFormatJson = (which) => {
    if (isViewer) return setError("View-only mode: request access to edit JSON.");
    try {
      if (which === 'contract') {
        const formatted = JSON.stringify(JSON.parse(schemaJson || "{}"), null, 2);
        setSchemaJson(formatted);
      } else if (which === 'payload') {
        const formatted = JSON.stringify(JSON.parse(testPayload || "{}"), null, 2);
        setTestPayload(formatted);
      }
      setError("");
    } catch (err) {
      setError("Format failed: " + err.message);
    }
  };

  const handleAddTestCase = async () => {
    if (isViewer) return setError("View-only mode: request access to add tests.");
    if (!currentId) return setError("Save the workflow before adding tests.");
    setError("");
    try {
      const payload = JSON.parse(testCasePayload || "{}");
      const resp = await apiFetch(`/api/visual-workflow-builder/workflows/${currentId}/tests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: testName, payload })
      });
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error || "Add test failed");
      await loadWorkflows();
    } catch (err) {
      setError("Add test failed: " + err.message);
    }
  };

  const handleRunTests = async () => {
    if (isViewer) return setError("View-only mode: request access to run tests.");
    if (!currentId) return setError("Save the workflow before running tests.");
    setError("");
    setTestRunning(true);
    try {
      const resp = await apiFetch(`/api/visual-workflow-builder/workflows/${currentId}/tests/run`, { method: "POST" });
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error || "Run tests failed");
      setTestResults(data.results || []);
    } catch (err) {
      setError("Run tests failed: " + err.message);
      setTestResults([]);
    } finally {
      setTestRunning(false);
    }
  };

  const handleSave = async () => {
    if (isViewer) return setError("View-only mode: request access to save.");
    const issues = [...validate(), ...runPreflight()];
    if (issues.length) return;
    setSaving(true);
    setError("");
    const body = {
      name: workflowName,
      env,
      versionTag,
      approvalRequired,
      approverEmail,
      contract: schemaJson,
      definition: { steps: canvas },
      status,
      canaryPercent,
      shadowMode,
      performanceBudgetMs: performanceBudgetMs || null,
    };
    try {
      let resp;
      if (currentId) {
        resp = await apiFetch(`/api/visual-workflow-builder/workflows/${currentId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(revision ? { "if-match-revision": String(revision) } : {}),
          },
          body: JSON.stringify(body),
        });
      } else {
        resp = await apiFetch(`/api/visual-workflow-builder/workflows`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error || "Save failed");
      const wf = data.workflow;
      setCurrentId(wf.id);
      setRevision(wf.revision || null);
      setStatus(wf.status || "draft");
      setDirtySinceSave(false);
      dirtySkipRef.current = true;
      await loadWorkflows();
      await loadAnalytics();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (isViewer) return setError("View-only mode: request access to approve.");
    if (!currentId) return setError("Save first");
    try {
      const resp = await apiFetch(`/api/visual-workflow-builder/workflows/${currentId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedBy: approverEmail || "system" })
      });
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error || "Approval failed");
      setStatus(data.workflow.status || status);
      setRevision(data.workflow.revision || revision);
      await loadWorkflows();
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePromote = async () => {
    if (isViewer) return setError("View-only mode: request access to promote.");
    if (devSandbox) {
      setError("Sandbox mode: set env to Stage/Prod before promoting.");
      return;
    }
    if (!currentId) return setError("Save first");
    try {
      const resp = await apiFetch(`/api/visual-workflow-builder/workflows/${currentId}/promote`, { method: "POST" });
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error || "Promote failed");
      setStatus(data.workflow.status || "active");
      setRevision(data.workflow.revision || revision);
      await loadWorkflows();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLoadWorkflow = async (id) => {
    if (!id) return;
    try {
      const resp = await apiFetch(`/api/visual-workflow-builder/workflows/${id}`);
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error || "Load failed");
      const wf = data.workflow;
      setCurrentId(wf.id);
      setWorkflowName(wf.name || "Untitled Workflow");
      setEnv(wf.env || "dev");
      setVersionTag(wf.versionTag || "v1");
      setApprovalRequired(!!wf.approvalRequired);
      setApproverEmail(wf.approverEmail || "");
      setSchemaJson(wf.contract || schemaJson);
      setCanvas(wf.definition?.steps || []);
      setStatus(wf.status || "draft");
      setRevision(wf.revision || null);
      setTestResults([]);
      setCanaryPercent(wf.canaryPercent || 0);
      setShadowMode(!!wf.shadowMode);
      setPerformanceBudgetMs(wf.performanceBudgetMs || 0);
      loadHistoryAndComments(wf.id);
      dirtySkipRef.current = true;
      setDirtySinceSave(false);
    } catch (err) {
      setError(err.message);
    }
  };

  // Feedback
  const handleFeedback = async () => {
    if (!feedback) return;
    setError("");
    try {
      await fetch("/api/visual-workflow-builder/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback })
      });
      setFeedback("");
    } catch (err) {
      setError("Failed to send feedback");
    }
  };

  const handleAddComment = async () => {
    if (!currentId || !newComment) return;
    try {
      const resp = await apiFetch(`/api/visual-workflow-builder/workflows/${currentId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: newComment })
      });
      const data = await resp.json();
      if (!data.ok) throw new Error(data.error || "Comment failed");
      setNewComment("");
      await loadHistoryAndComments(currentId);
    } catch (err) {
      setError(err.message);
    }
  };

  // Main UI
  return (
    <div style={{ padding: 24, background: "#09090b", color: "#fafafa", borderRadius: 16, border: "1px solid #27272a", boxShadow: "0 12px 48px #0007" }}>
      <BackButton label="← Back to Suite" onClick={goBackToSuite} />
      {devSandbox && !isViewer && (
        <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 12, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 800, color: "#f59e0b" }}>Sandbox only</div>
            <div style={{ color: "#a1a1aa", fontSize: 13 }}>Simulations and promotion are disabled in dev. Switch to Stage/Prod to exercise the full path.</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => setEnv("stage")} style={{ background: "#27272a", color: "#fafafa", border: "1px solid #52525b", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}>Switch to Stage</button>
            <button onClick={() => setEnv("prod")} style={{ background: "#22c55e", color: "#18181b", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}>Go Prod</button>
          </div>
        </div>
      )}
      {isViewer && (
        <div style={{ background: "#27272a", border: "1px solid #52525b", borderRadius: 12, padding: 12, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 800, color: "#fcd34d" }}>View-only mode</div>
            <div style={{ color: "#a1a1aa", fontSize: 13 }}>You can inspect workflows but need elevated access to edit, simulate, or promote.</div>
          </div>
          <button onClick={() => setAccessRequested(true)} disabled={accessRequested} style={{ background: accessRequested ? "#52525b" : "#22c55e", color: "#18181b", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: accessRequested ? "default" : "pointer" }}>
            {accessRequested ? "Request sent" : "Request edit access"}
          </button>
        </div>
      )}
      {simulationHistory.length > 0 && (
        <div style={{ marginBottom: 12, background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 10, display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 800 }}>Recent simulations</div>
            <div style={{ color: "#a1a1aa", fontSize: 12 }}>Last {Math.min(3, simulationHistory.length)} shown</div>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {simulationHistory.slice(0, 3).map((h, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "8px 10px" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#fafafa" }}>{h.versionTag || "Sim"} · {h.env}</div>
                  <div style={{ color: "#a1a1aa", fontSize: 12 }}>{h.ts ? `Simulated ${new Date(h.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Recent"}</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button aria-label={`Load simulation ${idx + 1}`} onClick={() => restoreSnapshot(h)} style={{ background: "#27272a", color: "#fafafa", border: "1px solid #52525b", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>Load</button>
                  <button aria-label={`Re-run simulation ${idx + 1}`} onClick={() => { restoreSnapshot(h); setTimeout(() => handleSimulate(), 0); }} disabled={devSandbox || isViewer} style={{ background: devSandbox ? "#27272a" : "#22c55e", color: devSandbox ? "#a1a1aa" : "#18181b", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: devSandbox || isViewer ? "not-allowed" : "pointer", opacity: devSandbox || isViewer ? 0.6 : 1 }}>{devSandbox ? "Sandbox" : "Re-run"}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {showCommandPalette && (
        <div style={{ position: "fixed", inset: 0, background: "#0009", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20 }}>
          <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: 16, width: "min(520px, 92vw)", boxShadow: "0 18px 60px #000" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 800, color: "#a5f3fc" }}>Command Palette</div>
              <button onClick={() => setShowCommandPalette(false)} style={{ background: "transparent", color: "#a1a1aa", border: "none", cursor: "pointer", fontWeight: 700 }}>Esc</button>
            </div>
            {[{ label: "Save draft", action: handleManualSave, hotkey: "Ctrl+S", disabled: false }, { label: "Run preflight", action: runPreflight, hotkey: "Alt+P", disabled: false }, { label: "Simulate", action: handleSimulate, hotkey: "Ctrl+Enter", disabled: isViewer || devSandbox }, { label: "Undo", action: handleUndo, hotkey: "Ctrl+Z", disabled: !undoStack.length || isViewer }, { label: "Redo", action: handleRedo, hotkey: "Ctrl+Shift+Z", disabled: !redoStack.length || isViewer }].map(cmd => (
              <button key={cmd.label} disabled={cmd.disabled} onClick={() => { cmd.action(); setShowCommandPalette(false); }} style={{ width: "100%", textAlign: "left", background: cmd.disabled ? "#27272a" : "#18181b", color: cmd.disabled ? "#71717a" : "#fafafa", border: "1px solid #27272a", borderRadius: 10, padding: "10px 12px", marginBottom: 8, cursor: cmd.disabled ? "not-allowed" : "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{cmd.label}</span>
                <span style={{ fontSize: 12, color: "#a1a1aa" }}>{cmd.hotkey}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div style={{ position: "sticky", top: 0, zIndex: 4, display: "flex", flexWrap: "wrap", gap: 10, background: "#09090b", paddingBottom: 10, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: "8px 12px" }}>
          <span style={{ color: "#a1a1aa", fontWeight: 700 }}>Env</span>
          {["dev", "stage", "prod"].map(opt => (
            <button key={opt} onClick={() => handleDirectChange(setEnv)(opt)} disabled={isViewer} style={{ background: env === opt ? "#0ea5e9" : "#18181b", color: env === opt ? "#18181b" : "#fafafa", border: "1px solid #27272a", borderRadius: 999, padding: "6px 12px", fontWeight: 800, cursor: isViewer ? "not-allowed" : "pointer", opacity: isViewer ? 0.7 : 1 }}>{opt.toUpperCase()}</button>
          ))}
          <span style={{ color: draftStatus === "saved" ? "#22c55e" : "#fbbf24", fontSize: 12 }}>{draftStatus === "saved" ? `Saved ${formatTime(lastSavedAt)}` : "Saving..."}</span>
          {dirtySinceSave && <span style={{ color: "#fbbf24", fontSize: 12 }}>· Unsaved changes</span>}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={runPreflight} disabled={isViewer} style={{ background: "#27272a", color: "#fcd34d", border: "1px solid #52525b", borderRadius: 12, padding: "10px 12px", fontWeight: 800, cursor: isViewer ? "not-allowed" : "pointer", opacity: isViewer ? 0.7 : 1 }}>Preflight (Alt+P)</button>
          {preflightStatus && (
            <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 999, border: "1px solid #52525b", background: preflightStatus.ok ? "#18181b" : "#27272a", color: preflightStatus.ok ? "#22c55e" : preflightStatus.issues ? "#fcd34d" : "#f87171", fontWeight: 800, fontSize: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: preflightStatus.ok ? "#22c55e" : preflightStatus.issues ? "#f59e0b" : "#ef4444" }} />
              <span>{preflightStatus.ok ? "Preflight pass" : preflightStatus.issues ? `${preflightStatus.issues} issues` : "Preflight failed"}</span>
              {preflightStatus.ts ? <span style={{ color: "#a1a1aa", fontWeight: 600 }}>· {new Date(preflightStatus.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span> : null}
              <button onClick={() => setShowPreflightPopover(v => !v)} style={{ background: "transparent", border: "none", color: "#fafafa", cursor: "pointer", fontWeight: 800 }}>Trace</button>
              <button onClick={clearPreflightStatus} style={{ marginLeft: 2, background: "transparent", border: "none", color: "#a1a1aa", cursor: "pointer", fontWeight: 800 }}>Clear</button>
              <button onClick={downloadPreflightReport} style={{ background: "transparent", border: "none", color: "#67e8f9", cursor: "pointer", fontWeight: 800 }}>Save</button>
              {showPreflightPopover && (
                <div style={{ position: "absolute", top: "110%", right: 0, minWidth: 240, background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: 10, boxShadow: "0 10px 30px rgba(0,0,0,0.4)", zIndex: 10 }}>
                  <div style={{ fontWeight: 800, color: "#fcd34d", marginBottom: 6 }}>Preflight issues</div>
                  <div style={{ color: "#a1a1aa", fontSize: 12, marginBottom: 6 }}>Why this matters: catches misconfig before Shopify customers see broken flows.</div>
                  {preflightIssues.length === 0 ? <div style={{ color: "#22c55e" }}>Clear</div> : (
                    <ul style={{ margin: 0, paddingLeft: 16, color: "#fafafa", maxHeight: 160, overflow: "auto" }}>
                      {preflightIssues.slice(0, 6).map((p, i) => <li key={i}>{p}</li>)}
                      {preflightIssues.length > 6 && <li style={{ color: "#a1a1aa" }}>…{preflightIssues.length - 6} more</li>}
                    </ul>
                  )}
                  <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button onClick={() => applyQuickFix("approver")} style={{ background: "#0ea5e9", color: "#18181b", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>Add approver</button>
                    <button onClick={() => applyQuickFix("prod-note")} style={{ background: "#f59e0b", color: "#18181b", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>Add prod note</button>
                    <button onClick={() => applyQuickFix("trigger-action")} style={{ background: "#22c55e", color: "#18181b", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>Add trigger/action</button>
                    <button onClick={() => applyQuickFix("dedupe-labels")} style={{ background: "#6366f1", color: "#fafafa", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>Fix duplicates</button>
                  </div>
                  {preflightTrace.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ color: "#67e8f9", fontWeight: 700 }}>Trace</div>
                      <ul style={{ margin: 0, paddingLeft: 16, color: "#fafafa", maxHeight: 140, overflow: "auto" }}>
                        {preflightTrace.slice(0, 5).map((t, i) => (
                          <li key={i}>{t.label}: {t.issues?.join("; ")}</li>
                        ))}
                        {preflightTrace.length > 5 && <li style={{ color: "#a1a1aa" }}>…{preflightTrace.length - 5} more</li>}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </span>
          )}
          <button onClick={handleSimulate} disabled={isViewer || devSandbox} style={{ background: devSandbox ? "#27272a" : "#22c55e", color: devSandbox ? "#a1a1aa" : "#18181b", border: "none", borderRadius: 12, padding: "10px 12px", fontWeight: 900, cursor: isViewer || devSandbox ? "not-allowed" : "pointer", opacity: isViewer || devSandbox ? 0.7 : 1 }}>{devSandbox ? "Sandbox (set Stage)" : "️ Simulate (Ctrl+Enter)"}</button>
          <button onClick={handleSave} disabled={isViewer} style={{ background: "#0ea5e9", color: "#18181b", border: "none", borderRadius: 12, padding: "10px 12px", fontWeight: 900, cursor: isViewer ? "not-allowed" : "pointer", opacity: isViewer ? 0.7 : 1 }}>{saving ? "Saving…" : "Save Draft"}</button>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 18, color: "#a5f3fc" }}>Visual Workflow Automation Builder</h2>
        <div style={{ color: "#a1a1aa", fontSize: 13, maxWidth: 520 }}>Hotkeys: Ctrl+S save draft, Ctrl+Enter simulate, Alt+P preflight, Ctrl+Z / Ctrl+Shift+Z undo/redo, Ctrl+K command palette, T rename test.</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select value={currentId || ""} onChange={e => handleLoadWorkflow(e.target.value)} style={{ background: "#18181b", color: "#fafafa", border: "1px solid #27272a", borderRadius: 10, padding: "8px 12px", minWidth: 180 }}>
            <option value="">Load workflow…</option>
            {workflows.map(w => (
              <option key={w.id} value={w.id}>{w.name || "Untitled"} · {w.env}/{w.versionTag} · {w.status}</option>
            ))}
          </select>
          <button onClick={loadWorkflows} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Loading…' : 'Refresh'}</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginBottom: 10 }}>
        <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 12 }}>
          <div style={{ color: "#a1a1aa", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.4 }}>Readiness</div>
          <div style={{ fontWeight: 800, fontSize: 22, color: launchHealth.coverage >= 85 ? "#22c55e" : "#fbbf24" }}>{launchHealth.coverage}%</div>
          <div style={{ color: "#a1a1aa", fontSize: 13 }}>{launchHealth.steps} steps on canvas</div>
        </div>
        <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Guardrails</div>
          <div style={{ color: launchHealth.guardrailsOk ? "#22c55e" : "#f59e0b", fontWeight: 700 }}>{launchHealth.guardrailsOk ? "Clear" : `${preflightIssues.length} issues`}</div>
          <div style={{ color: "#a1a1aa", fontSize: 12, marginBottom: preflightIssues.length ? 6 : 0 }}>Approvals: {launchHealth.approvalsOk ? "Ready" : "Need email"} · Analytics: {launchHealth.analytics}</div>
          {perfDetail && <div style={{ color: "#fbbf24", fontSize: 12, marginBottom: preflightIssues.length ? 6 : 0 }}>{perfDetail}</div>}
          {preflightIssues.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 16, color: "#fafafa", fontSize: 12, display: "grid", gap: 4 }}>
              {preflightIssues.slice(0, 3).map((issue, idx) => (
                <li key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span>{issue}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button aria-label={`Explain ${issue}`} onClick={() => { setIssueHelp(issue); issue?.includes("node") && setSelectedStep(prev => prev); }} style={{ background: "#27272a", border: "1px solid #52525b", color: "#a5f3fc", borderRadius: 8, padding: "2px 8px", fontWeight: 700, cursor: "pointer" }}>Explain</button>
                    {quickFixForIssue(issue) && (
                      <button aria-label={`Fix ${issue}`} onClick={() => applyQuickFix(quickFixForIssue(issue))} style={{ background: "#22c55e", color: "#18181b", border: "none", borderRadius: 8, padding: "2px 8px", fontWeight: 800, cursor: "pointer" }}>Fix</button>
                    )}
                  </div>
                </li>
              ))}
              {preflightIssues.length > 3 && <li style={{ color: "#a1a1aa" }}>+{preflightIssues.length - 3} more (open Trace)</li>}
            </ul>
          )}
        </div>
        {issueHelp && (
          <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: 10, display: "grid", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div style={{ color: "#a5f3fc", fontWeight: 800 }}>Issue help</div>
              <button onClick={() => setIssueHelp(null)} style={{ background: "#27272a", color: "#fafafa", border: "1px solid #52525b", borderRadius: 8, padding: "4px 8px", fontWeight: 700, cursor: "pointer" }}>Close</button>
            </div>
            <div style={{ color: "#fafafa" }}>{issueHelp}</div>
            <div style={{ color: "#a1a1aa", fontSize: 13 }}>Recommended fix: {issueHelp.toLowerCase().includes("node") ? "Select the node on canvas and update its config or connection." : issueHelp.toLowerCase().includes("approval") ? "Add an approver email or turn off approvals." : issueHelp.toLowerCase().includes("analytics") ? "Add event tracking or mark analytics as verified." : "Review the node referenced by this issue and rerun preflight."}</div>
          </div>
        )}
        <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Workflow hygiene</div>
          <div style={{ color: dirtySinceSave ? "#fbbf24" : "#22c55e", fontWeight: 700 }}>{dirtySinceSave ? "Unsaved edits" : "Clean"}</div>
          <div style={{ color: "#a1a1aa", fontSize: 12 }}>Last saved {lastSavedAt ? formatTime(lastSavedAt) : "—"}</div>
        </div>
      </div>

      <div style={{ marginBottom: 12, background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
          <div style={{ fontWeight: 800 }}>Operational checklist</div>
          <div style={{ color: "#a1a1aa", fontSize: 12 }}>Auto-refreshes as you tweak steps</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 8 }}>
          {healthChecklist.map(item => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "8px 10px" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.ok ? "#22c55e" : "#f97316" }} />
              <div style={{ color: "#fafafa", fontWeight: 600 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <input value={workflowName} onChange={handleInputChange(setWorkflowName)} disabled={isViewer} placeholder="Workflow name" style={{ background: "#18181b", color: "#fafafa", border: "1px solid #27272a", borderRadius: 10, padding: "8px 12px", minWidth: 200, opacity: isViewer ? 0.7 : 1 }} />
        <select value={env} onChange={handleInputChange(setEnv)} disabled={isViewer} style={{ background: "#18181b", color: "#fafafa", border: "1px solid #27272a", borderRadius: 10, padding: "8px 12px", fontWeight: 700, opacity: isViewer ? 0.7 : 1 }}>
          <option value="dev">Dev</option><option value="stage">Stage</option><option value="prod">Prod</option>
        </select>
        <input value={versionTag} onChange={handleInputChange(setVersionTag)} disabled={isViewer} placeholder="Version tag" style={{ background: "#18181b", color: "#fafafa", border: "1px solid #27272a", borderRadius: 10, padding: "8px 12px", minWidth: 120, opacity: isViewer ? 0.7 : 1 }} />
        <label style={{ display: "flex", alignItems: "center", gap: 6, background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "6px 10px", fontWeight: 700, opacity: isViewer ? 0.7 : 1 }}>
          <input type="checkbox" checked={approvalRequired} onChange={handleToggle(setApprovalRequired)} disabled={isViewer} />Approvals
        </label>
        <input value={approverEmail} onChange={handleInputChange(setApproverEmail)} disabled={isViewer} placeholder="Approver email" style={{ background: "#18181b", color: "#fafafa", border: "1px solid #27272a", borderRadius: 10, padding: "8px 12px", minWidth: 180, opacity: isViewer ? 0.7 : 1 }} />
        <div style={{ color: '#e4e4e7', fontWeight: 700 }}>Status: {status} {revision ? `· rev ${revision}` : ''}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, color: '#e4e4e7', fontSize: 14 }}>
          Canary rollout (% traffic)
          <input type="number" min={0} max={100} value={canaryPercent} onChange={handleInputChange(setCanaryPercent, Number)} disabled={isViewer} style={{ background: '#18181b', color: '#fafafa', border: '1px solid #27272a', borderRadius: 10, padding: '6px 10px', minWidth: 120, opacity: isViewer ? 0.7 : 1 }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#18181b', border: '1px solid #27272a', borderRadius: 10, padding: '6px 10px', fontWeight: 700, opacity: isViewer ? 0.7 : 1 }}>
          <input type="checkbox" checked={shadowMode} onChange={handleToggle(setShadowMode)} disabled={isViewer} />Shadow mode (observe only)
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, color: '#e4e4e7', fontSize: 14 }}>
          Performance budget (ms)
          <input type="number" value={performanceBudgetMs} onChange={handleInputChange(setPerformanceBudgetMs, Number)} disabled={isViewer} placeholder="e.g., 500" style={{ background: '#18181b', color: '#fafafa', border: '1px solid #27272a', borderRadius: 10, padding: '6px 10px', minWidth: 140, opacity: isViewer ? 0.7 : 1 }} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button onClick={handleSave} disabled={isViewer} style={{ background: '#22c55e', color: '#18181b', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 800, cursor: isViewer ? 'not-allowed' : 'pointer', opacity: isViewer ? 0.7 : 1 }}>{saving ? 'Saving…' : (currentId ? 'Save Draft' : 'Create Draft')}</button>
        <button onClick={handleApprove} disabled={isViewer} style={{ background: '#f59e0b', color: '#18181b', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 800, cursor: isViewer ? 'not-allowed' : 'pointer', opacity: isViewer ? 0.7 : 1 }}>Approve</button>
        <button onClick={handlePromote} disabled={isViewer || devSandbox} style={{ background: devSandbox ? '#27272a' : '#3b82f6', color: devSandbox ? '#a1a1aa' : '#fafafa', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 800, cursor: isViewer || devSandbox ? 'not-allowed' : 'pointer', opacity: isViewer || devSandbox ? 0.7 : 1 }}>{devSandbox ? 'Sandbox (set Stage)' : 'Promote'}</button>
      </div>
      <button onClick={() => setShowOnboarding(v => !v)} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginBottom: 16 }}>{showOnboarding ? "Hide" : "Show"} Onboarding</button>
      {showOnboarding && onboardingContent}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 320px) 1fr', gap: 12, marginBottom: 18, alignItems: 'start' }}>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 12, boxShadow: '0 12px 30px #00000033' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ fontWeight: 800, color: '#fafafa' }}>Palette</div>
            <div style={{ color: '#a1a1aa', fontSize: 12 }}>Drag blocks onto canvas</div>
          </div>
          <div style={{ display: 'grid', gap: 6, background: '#18181b', border: '1px dashed #27272a', borderRadius: 10, padding: 10, marginBottom: 10 }}>
            <div style={{ color: '#e4e4e7', fontWeight: 700 }}>How to use</div>
            <ul style={{ margin: '0 0 0 16px', padding: 0, color: '#a1a1aa', fontSize: 13, lineHeight: 1.5 }}>
              <li>Drag any block to the canvas</li>
              <li>Or click “Add instantly” to append</li>
              <li>Re-order later via JSON or your layout view</li>
            </ul>
          </div>
          <div style={{ display: 'grid', gap: 8 }}>
            {PALETTE_BLOCKS.map(block => (
              <div key={block.label} style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 10, padding: 10, display: 'grid', gap: 6, boxShadow: '0 8px 20px #00000022' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontWeight: 700, color: '#fafafa' }}>{block.label}</div>
                  <span style={{ background: '#0ea5e91a', color: '#67e8f9', padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{block.type}</span>
                </div>
                <div style={{ color: '#a1a1aa', fontSize: 13 }}>{block.description}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    title="Click and drag this block onto the canvas"
                    draggable
                    onDragStart={(e) => handleDragStart(e, block)}
                    disabled={isViewer}
                    style={{ background: '#27272a', color: '#fcd34d', border: '1px solid #52525b', borderRadius: 10, padding: '6px 10px', fontWeight: 700, cursor: isViewer ? 'not-allowed' : 'grab', opacity: isViewer ? 0.7 : 1 }}
                  >
                    Drag to canvas
                  </button>
                  <button
                    title="Append this block to the canvas instantly"
                    onClick={() => handleAddBlockQuick(block)}
                    disabled={isViewer}
                    style={{ background: '#22c55e', color: '#18181b', border: 'none', borderRadius: 10, padding: '6px 10px', fontWeight: 800, cursor: isViewer ? 'not-allowed' : 'pointer', opacity: isViewer ? 0.7 : 1 }}
                  >
                    Add instantly
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleDropOnCanvas(e.dataTransfer.getData('application/json')); }}
          style={{ background: '#18181b', borderRadius: 10, padding: 18, color: '#fafafa', border: '2px dashed #52525b', minHeight: 260, boxShadow: '0 12px 30px #00000033' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 10, flexWrap: 'wrap' }}>
            <div>
              <b>Workflow Canvas</b>
              <div style={{ color: '#a1a1aa', fontSize: 13 }}>Drop blocks here to assemble your workflow. Quick add also works.</div>
              <div style={{ color: '#fcd34d', fontSize: 12, marginTop: 4 }}>Tip: Drag the gold button or click green to append instantly.</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ color: '#a5f3fc', fontWeight: 700, background: '#0ea5e91a', borderRadius: 999, padding: '6px 12px' }}>{canvas.length} blocks</div>
              <div style={{ display: 'flex', gap: 6, background: '#18181b', border: '1px solid #27272a', borderRadius: 999, padding: 4 }}>
                <button onClick={() => setCanvasViewMode('cards')} style={{ background: canvasViewMode === 'cards' ? '#0ea5e9' : 'transparent', color: canvasViewMode === 'cards' ? '#18181b' : '#fafafa', border: 'none', borderRadius: 999, padding: '6px 10px', fontWeight: 700, cursor: 'pointer' }}>Card view</button>
                <button onClick={() => setCanvasViewMode('json')} style={{ background: canvasViewMode === 'json' ? '#0ea5e9' : 'transparent', color: canvasViewMode === 'json' ? '#18181b' : '#fafafa', border: 'none', borderRadius: 999, padding: '6px 10px', fontWeight: 700, cursor: 'pointer' }}>JSON</button>
              </div>
            </div>
          </div>

          {canvasViewMode === 'cards' ? (
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 12, minHeight: 160 }}>
              {canvas.length === 0 ? (
                <div style={{ color: '#a1a1aa', fontStyle: 'italic' }}>No blocks yet. Drag from the palette or use “Add instantly” to get started.</div>
              ) : (
                <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                  {canvas.map((block, idx) => (
                    <div key={block.id || idx} style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 10, padding: 10, display: 'grid', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <input
                          value={block.label || ''}
                          onChange={e => handleBlockFieldChange(idx, 'label', e.target.value)}
                          disabled={isViewer}
                          placeholder="Block label"
                          style={{ flex: 1, background: '#18181b', color: '#fafafa', border: '1px solid #27272a', borderRadius: 8, padding: '6px 8px', fontWeight: 700, opacity: isViewer ? 0.6 : 1 }}
                        />
                        <select
                          value={block.type || 'action'}
                          onChange={e => handleBlockFieldChange(idx, 'type', e.target.value)}
                          disabled={isViewer}
                          style={{ background: '#18181b', color: '#fafafa', border: '1px solid #27272a', borderRadius: 8, padding: '6px 8px', fontWeight: 700, opacity: isViewer ? 0.6 : 1 }}
                        >
                          <option value="trigger">trigger</option>
                          <option value="condition">condition</option>
                          <option value="action">action</option>
                        </select>
                      </div>
                      <textarea
                        value={block.description || ''}
                        onChange={e => handleBlockFieldChange(idx, 'description', e.target.value)}
                        disabled={isViewer}
                        rows={2}
                        placeholder="Description"
                        style={{ width: '100%', background: '#18181b', color: '#a1a1aa', border: '1px solid #27272a', borderRadius: 8, padding: 8, resize: 'vertical', opacity: isViewer ? 0.6 : 1 }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <div style={{ color: '#71717a', fontSize: 12 }}>Position: {idx + 1}</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => handleMoveBlock(idx, -1)}
                            disabled={isViewer || idx === 0}
                            title="Move up"
                            style={{ background: 'transparent', color: '#fafafa', border: '1px solid #27272a', borderRadius: 8, padding: '4px 8px', cursor: isViewer || idx === 0 ? 'not-allowed' : 'pointer', opacity: isViewer || idx === 0 ? 0.5 : 1 }}
                          >
                            ↑
                          </button>
                          <button
                            onClick={() => handleMoveBlock(idx, 1)}
                            disabled={isViewer || idx === canvas.length - 1}
                            title="Move down"
                            style={{ background: 'transparent', color: '#fafafa', border: '1px solid #27272a', borderRadius: 8, padding: '4px 8px', cursor: isViewer || idx === canvas.length - 1 ? 'not-allowed' : 'pointer', opacity: isViewer || idx === canvas.length - 1 ? 0.5 : 1 }}
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => handleRemoveBlock(idx)}
                            disabled={isViewer}
                            title="Remove block"
                            style={{ background: '#7f1d1d', color: '#fecdd3', border: '1px solid #b91c1c', borderRadius: 8, padding: '4px 10px', cursor: isViewer ? 'not-allowed' : 'pointer', opacity: isViewer ? 0.6 : 1 }}
                          >
                            
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 10, padding: 12 }}>
              <div style={{ color: '#e4e4e7', marginBottom: 6 }}>Canvas JSON</div>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'none', padding: 0, margin: 0, color: '#e4e4e7' }}>{JSON.stringify(canvas, null, 2)}</pre>
              {preflightTrace.length > 0 && (
                <div style={{ marginTop: 10, background: '#18181b', border: '1px solid #27272a', borderRadius: 10, padding: 10 }}>
                  <div style={{ color: '#fcd34d', fontWeight: 800, marginBottom: 6 }}>Preflight trace</div>
                  <ul style={{ margin: 0, paddingLeft: 16, color: '#fafafa' }}>
                    {preflightTrace.map((t, i) => (
                      <li key={i}>
                        <b>{t.label}</b>: {t.issues.join('; ')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 12, background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: '#fafafa' }}>Template Gallery</div>
        <div style={{ fontSize: 15, color: '#e4e4e7' }}>
          {templateGallery.length ? (
            <ul>{templateGallery.map((tpl, i) => (
              <li key={i} style={{ marginBottom: 8 }}>
                <button onClick={() => { if (isViewer) return; pushUndoSnapshot(); setSelectedTemplate(tpl); }} disabled={isViewer} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: isViewer ? 'not-allowed' : 'pointer', opacity: isViewer ? 0.7 : 1 }}>{tpl.name}</button>
              </li>
            ))}</ul>
          ) : (
            <span>No templates yet. Add or import to see results.</span>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 12, display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, color: '#fafafa', marginBottom: 6 }}>Data Contract</div>
          <textarea value={schemaJson} onChange={handleInputChange(setSchemaJson)} disabled={isViewer} rows={5} style={{ width: '100%', background: '#18181b', color: '#fafafa', border: '1px solid #27272a', borderRadius: 10, padding: 10, opacity: isViewer ? 0.7 : 1 }} />
          <button onClick={() => handleFormatJson('contract')} disabled={isViewer} style={{ marginTop: 8, background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700, cursor: isViewer ? 'not-allowed' : 'pointer', opacity: isViewer ? 0.7 : 1 }}>Format JSON</button>
        </div>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, color: '#fafafa', marginBottom: 6 }}>Simulation</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            {PAYLOAD_PRESETS.map(p => (
              <button key={p.id} onClick={() => { if (isViewer) return; pushUndoSnapshot(); setSelectedPayloadPreset(p.id); setTestPayload(JSON.stringify(p.payload, null, 2)); }} disabled={isViewer} style={{ background: selectedPayloadPreset === p.id ? '#0ea5e9' : '#18181b', color: selectedPayloadPreset === p.id ? '#18181b' : '#fafafa', border: '1px solid #27272a', borderRadius: 10, padding: '6px 10px', fontWeight: 700, cursor: isViewer ? 'not-allowed' : 'pointer', opacity: isViewer ? 0.7 : 1 }}>
                {p.name} <span style={{ marginLeft: 6, background: '#0ea5e91a', color: '#67e8f9', padding: '2px 6px', borderRadius: 999, fontSize: 12 }}>{p.badge}</span>
              </button>
            ))}
          </div>
          <textarea value={testPayload} onChange={handleInputChange(setTestPayload)} disabled={isViewer} rows={4} style={{ width: '100%', background: '#18181b', color: '#fafafa', border: '1px solid #27272a', borderRadius: 10, padding: 10, opacity: isViewer ? 0.7 : 1 }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            <button onClick={handleSimulate} disabled={isViewer || devSandbox} style={{ background: devSandbox ? '#27272a' : '#22c55e', color: devSandbox ? '#a1a1aa' : '#18181b', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 800, cursor: isViewer || devSandbox ? 'not-allowed' : 'pointer', opacity: isViewer || devSandbox ? 0.7 : 1 }}>{devSandbox ? 'Sandbox (set Stage)' : 'Run Simulation'}</button>
            <button onClick={() => handleFormatJson('payload')} disabled={isViewer} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 12px', fontWeight: 700, cursor: isViewer ? 'not-allowed' : 'pointer', opacity: isViewer ? 0.7 : 1 }}>Format JSON</button>
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ color: '#fafafa', fontWeight: 700, marginBottom: 6 }}>Variant table (optional)</div>
            <textarea value={testVariantsJson} onChange={e => setTestVariantsJson(e.target.value)} disabled={isViewer} rows={4} style={{ width: '100%', background: '#18181b', color: '#fafafa', border: '1px solid #27272a', borderRadius: 10, padding: 10, opacity: isViewer ? 0.7 : 1 }} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
              <button onClick={handleRunVariantSimulations} disabled={isViewer || testRunning} style={{ background: '#a855f7', color: '#18181b', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 800, cursor: isViewer ? 'not-allowed' : 'pointer', opacity: isViewer ? 0.7 : 1 }}>
                {testRunning ? 'Running variants…' : 'Run variant simulations'}
              </button>
            </div>
            {variantResults.length > 0 && (
              <div style={{ marginTop: 8, background: '#18181b', border: '1px solid #27272a', borderRadius: 10, padding: 10 }}>
                <div style={{ color: '#e4e4e7', marginBottom: 6 }}>Variant results</div>
                <ul style={{ margin: 0, paddingLeft: 16, color: '#fafafa' }}>
                  {variantResults.map((v, i) => (
                    <li key={i} style={{ color: v.ok ? '#22c55e' : '#f87171' }}>
                      {v.name}: {v.ok ? `ok · actions: ${v.actions?.length || 0}${v.warnings?.length ? ` · warnings: ${v.warnings.join(', ')}` : ''}` : `failed (${v.error})`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          {simulation && (
            <div style={{ marginTop: 6, color: '#a5f3fc' }}>
              <div>Env: {simulation.env} · Version: {simulation.version}</div>
              <div>Actions: {simulation.actions.join(', ')}</div>
                {simulation.warnings?.length ? <div style={{ color: '#fbbf24' }}>Warnings: {simulation.warnings.join(', ')}</div> : null}
              {diffSummary && (
                <div style={{ color: '#a1a1aa', marginTop: 6 }}>
                  <div style={{ color: '#fafafa', fontWeight: 700 }}>Changes since last simulation</div>
                  <div>Added: {diffSummary.added} · Removed: {diffSummary.removed} · Possible edits: {diffSummary.changed}</div>
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, color: '#fafafa', marginBottom: 6 }}>Test Cases</div>
          <input value={testName} onChange={handleInputChange(setTestName)} disabled={isViewer} placeholder="Test name" style={{ width: '100%', background: '#18181b', color: '#fafafa', border: '1px solid #27272a', borderRadius: 10, padding: 10, marginBottom: 8, opacity: isViewer ? 0.7 : 1 }} />
          <textarea value={testCasePayload} onChange={handleInputChange(setTestCasePayload)} disabled={isViewer} rows={4} style={{ width: '100%', background: '#18181b', color: '#fafafa', border: '1px solid #27272a', borderRadius: 10, padding: 10, marginBottom: 8, opacity: isViewer ? 0.7 : 1 }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={handleAddTestCase} disabled={isViewer} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 700, cursor: isViewer ? 'not-allowed' : 'pointer', opacity: isViewer ? 0.7 : 1 }}>Add Test</button>
            <button onClick={handleRunTests} disabled={isViewer} style={{ background: '#22c55e', color: '#18181b', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 800, cursor: isViewer ? 'not-allowed' : 'pointer', opacity: isViewer ? 0.7 : 1 }}>{testRunning ? 'Running…' : 'Run Tests'}</button>
          </div>
          {testResults && testResults.length > 0 && (
            <ul style={{ marginTop: 10, paddingLeft: 18, color: '#e4e4e7' }}>
              {testResults.map(r => (
                <li key={r.id || r.name} style={{ color: r.passed ? '#22c55e' : '#fca5a5' }}>
                  {r.name || r.id}: {r.passed ? 'passed' : `failed (${(r.errors || []).join(', ')})`}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, color: '#fafafa', marginBottom: 6 }}>Validation</div>
          {validationIssues.length === 0 ? <div style={{ color: '#22c55e' }}>No blocking issues.</div> : (
            <ul style={{ margin: 0, paddingLeft: 18, color: '#fca5a5' }}>{validationIssues.map((v, i) => <li key={i}>{v}</li>)}</ul>
          )}
          {schemaWarnings.length ? <div style={{ marginTop: 6, color: '#fbbf24' }}>Schema warnings: {schemaWarnings.join(', ')}</div> : null}
          {preflightIssues.length ? (
            <div style={{ marginTop: 8, background: '#18181b', border: '1px solid #27272a', borderRadius: 10, padding: 10 }}>
              <div style={{ color: '#fcd34d', fontWeight: 800 }}>Preflight</div>
              <ul style={{ margin: 6, paddingLeft: 18, color: '#fafafa' }}>
                {preflightIssues.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          ) : null}
          {env === 'prod' && (
            <div style={{ marginTop: 8, background: '#0ea5e91a', border: '1px solid #0ea5e9', borderRadius: 10, padding: 10 }}>
              <div style={{ color: '#67e8f9', fontWeight: 800 }}>Prod note required</div>
              <input value={confirmationNote} onChange={handleInputChange(setConfirmationNote)} disabled={isViewer} placeholder="Who approved? What changed?" style={{ marginTop: 6, width: '100%', background: '#18181b', color: '#fafafa', border: '1px solid #27272a', borderRadius: 8, padding: '8px 10px', opacity: isViewer ? 0.7 : 1 }} />
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <input type="file" accept="application/json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} disabled={isViewer} />
        <button onClick={() => fileInputRef.current.click()} disabled={isViewer} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: isViewer ? 'not-allowed' : 'pointer', marginRight: 12, opacity: isViewer ? 0.7 : 1 }}>Import Workflow</button>
        <button onClick={handleExport} disabled={isViewer} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: isViewer ? 'not-allowed' : 'pointer', opacity: isViewer ? 0.7 : 1 }}>Export Workflow</button>
        {imported && <span style={{ marginLeft: 12, color: '#6366f1' }}>Imported: {imported}</span>}
        {exported && <a href={exported} download="workflow.json" style={{ marginLeft: 12, color: '#22c55e', textDecoration: 'underline' }}>Download Export</a>}
      </div>

      <div style={{ marginBottom: 32, background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: '#fafafa' }}>Analytics</div>
        <div style={{ fontSize: 15, color: '#e4e4e7' }}>
          {analyticsLoading ? <span>Loading analytics…</span> : analytics.length ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 10 }}>
                {Object.entries(analyticsSummary).map(([k, v]) => (
                  <div key={k} style={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 10, padding: 8 }}>
                    <div style={{ color: '#a5f3fc', fontWeight: 700 }}>{k}</div>
                    <div style={{ color: '#fafafa', fontSize: 22 }}>{v}</div>
                  </div>
                ))}
              </div>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'none', padding: 0, margin: 0 }}>{JSON.stringify(analytics, null, 2)}</pre>
            </>
          ) : (
            <span>No analytics yet. Build or import workflows to see results.</span>
          )}
        </div>
      </div>

      {currentId && (
        <div style={{ marginBottom: 24, background: '#18181b', border: '1px solid #27272a', borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: '#fafafa' }}>Revision history & comments</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            <div>
              <div style={{ color: '#e4e4e7', marginBottom: 6, fontWeight: 600 }}>History</div>
              {history.length ? (
                <ul style={{ margin: 0, paddingLeft: 16, color: '#e4e4e7' }}>
                  {history.slice().reverse().slice(0, 8).map((h, idx) => (
                    <li key={idx} style={{ marginBottom: 4 }}>rev {h.revision}: {h.changes || 'update'} · {new Date(h.ts).toLocaleString()}</li>
                  ))}
                </ul>
              ) : <div style={{ color: '#a1a1aa' }}>No history yet.</div>}
            </div>
            <div>
              <div style={{ color: '#e4e4e7', marginBottom: 6, fontWeight: 600 }}>Comments</div>
              {comments.length ? (
                <ul style={{ margin: 0, paddingLeft: 16, color: '#e4e4e7' }}>
                  {comments.slice().reverse().slice(0, 8).map(c => (
                    <li key={c.id} style={{ marginBottom: 4 }}>{c.comment} · {new Date(c.ts).toLocaleString()}</li>
                  ))}
                </ul>
              ) : <div style={{ color: '#a1a1aa' }}>No comments yet.</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add comment" style={{ flex: 1, minWidth: 200, background: '#18181b', color: '#fafafa', border: '1px solid #27272a', borderRadius: 10, padding: '8px 12px' }} />
                <button onClick={handleAddComment} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 12px', fontWeight: 700, cursor: 'pointer' }}>Comment</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={e => { e.preventDefault(); validate(); handleFeedback(); }} style={{ marginTop: 12, background: '#18181b', borderRadius: 12, padding: 20, border: '1px solid #27272a' }} aria-label="Send feedback">
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8, color: '#fafafa' }}>Feedback</div>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          rows={3}
          style={{ width: '100%', fontSize: 16, padding: 12, borderRadius: 10, border: '1px solid #27272a', marginBottom: 12, background: '#18181b', color: '#fafafa' }}
          placeholder="Share your feedback or suggestions..."
          aria-label="Feedback"
        />
        <button type="submit" style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, padding: '7px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Send Feedback</button>
        {error && <div style={{ color: '#ef4444', marginTop: 8 }}>{error}</div>}
      </form>
      <div style={{ marginTop: 16, fontSize: 13, color: '#a1a1aa', textAlign: 'center' }}>
        <span>Accessibility: WCAG 2.1, keyboard navigation, color contrast. Feedback? <a href="mailto:support@aura-core.ai" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>Contact Support</a></span>
      </div>
    </div>
  );
}


