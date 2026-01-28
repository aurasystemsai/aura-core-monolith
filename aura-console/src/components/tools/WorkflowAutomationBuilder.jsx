
import React, { useEffect, useMemo, useRef, useState } from "react";
import BackButton from "./BackButton";

const STORAGE_KEY = "workflow-automation-builder:draft";
const PRESETS = [
  {
    id: "order-to-slack",
    name: "Order → Slack + Email",
    tags: ["ops", "slack", "email"],
    steps: [
      { id: 1, name: "Order Created", type: "trigger", config: "Shopify order created" },
      { id: 2, name: "Notify Slack", type: "action", config: "Send Slack message to #orders" },
      { id: 3, name: "Send Email", type: "action", config: "Email customer success with order summary" }
    ]
  },
  {
    id: "checkout-winback",
    name: "Checkout Winback",
    tags: ["winback", "email", "sms"],
    steps: [
      { id: 1, name: "Abandoned Checkout", type: "trigger", config: "Shopify checkout abandoned" },
      { id: 2, name: "Reminder Email", type: "action", config: "Send Klaviyo email with coupon" },
      { id: 3, name: "Reminder SMS", type: "action", config: "Send SMS nudge after 1 hour" }
    ]
  },
  {
    id: "post-purchase-feedback",
    name: "Post-purchase Feedback",
    tags: ["seo", "feedback", "email"],
    steps: [
      { id: 1, name: "Order Fulfilled", type: "trigger", config: "Order fulfilled" },
      { id: 2, name: "Delay 3d", type: "action", config: "Wait 3 days" },
      { id: 3, name: "CSAT Survey", type: "action", config: "Send CSAT survey link" }
    ]
  }
];

const ACTION_LIBRARY = [
  { id: "slack", name: "Slack Alert", type: "action", tags: ["slack", "ops"], config: "Send Slack message to #alerts" },
  { id: "email", name: "Send Email", type: "action", tags: ["email", "marketing"], config: "Send email via Klaviyo" },
  { id: "webhook", name: "Webhook", type: "action", tags: ["webhook", "dev"], config: "POST to https://example.com/webhook" },
  { id: "jira", name: "Jira Ticket", type: "action", tags: ["jira", "ops"], config: "Create Jira issue in OPS project" },
  { id: "checkout", name: "Checkout Abandoned", type: "trigger", tags: ["winback", "shopify"], config: "Listen for checkout.abandoned" },
  { id: "order", name: "Order Created", type: "trigger", tags: ["shopify", "ops"], config: "Listen for order.created" }
];

const PAYLOAD_PRESETS = [
  { id: "abandoned-cart", name: "Abandoned Cart", payload: { customer: "jane@example.com", subtotal: 120, stage: "checkout_abandoned" } },
  { id: "seo-issue", name: "SEO Issue", payload: { url: "/blog/post", issue: "Missing meta description" } },
  { id: "high-aov", name: "High AOV", payload: { customer: "vip@example.com", subtotal: 820, segment: "VIP" } }
];

export default function WorkflowAutomationBuilder() {
  const [steps, setSteps] = useState([
    { id: 1, name: "Trigger", type: "trigger", config: "" },
    { id: 2, name: "Action", type: "action", config: "" }
  ]);
  const [selectedStep, setSelectedStep] = useState(1);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [env, setEnv] = useState("dev");
  const [versionTag, setVersionTag] = useState("v1");
  const [approvalRequired, setApprovalRequired] = useState(true);
  const [approverEmail, setApproverEmail] = useState("");
  const [versions, setVersions] = useState([]);
  const [draftStatus, setDraftStatus] = useState("idle"); // idle | saving | saved
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [preflightIssues, setPreflightIssues] = useState([]);
  const [issueHelp, setIssueHelp] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState("");
  const [presetTag, setPresetTag] = useState("");
  const [actionSearch, setActionSearch] = useState("");
  const [actionTag, setActionTag] = useState("");
  const [selectedPayloadPreset, setSelectedPayloadPreset] = useState("abandoned-cart");
  const [testStatus, setTestStatus] = useState("idle"); // idle | running | passed | failed
  const [stepStatuses, setStepStatuses] = useState({});
  const [lastBuiltSnapshot, setLastBuiltSnapshot] = useState(null);
  const [disabled, setDisabled] = useState(false);
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [confirmationNote, setConfirmationNote] = useState("");
  const [newVersionLabel, setNewVersionLabel] = useState("");
  const [userTemplates, setUserTemplates] = useState([]);
  const [role] = useState(() => {
    if (typeof window === "undefined") return "admin";
    return window.__AURA_USER?.role || window.localStorage.getItem("aura-role") || "admin";
  });
  const [accessRequested, setAccessRequested] = useState(false);
  const [dirtySinceSave, setDirtySinceSave] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [preflightTrace, setPreflightTrace] = useState([]);
  const [preflightStatus, setPreflightStatus] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(window.localStorage.getItem("suite:status:workflow-automation-builder")) || null;
    } catch {
      return null;
    }
  });
  const [showPreflightPopover, setShowPreflightPopover] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const applyQuickFix = (kind) => {
    if (isViewer) return;
    if (kind === "approver") {
      setApprovalRequired(true);
      setApproverEmail(prev => prev || "ops@shopify-brand.com");
    }
    if (kind === "prod-note") {
      if (env === "prod" || riskLevel === "high") {
        setConfirmationNote(prev => prev || "Production rollout note: approvals captured.");
      } else {
        setEnv("prod");
        setConfirmationNote("Production rollout note: approvals captured.");
      }
    }
    if (kind === "trigger-action") {
      setSteps(prev => {
        if (!prev.length) {
          return [
            { id: 1, name: "Trigger", type: "trigger", config: "Shopify order created" },
            { id: 2, name: "Action", type: "action", config: "Send Slack alert to #ops" }
          ];
        }
        const next = [...prev];
        if (!next[0] || next[0].type !== "trigger") {
          const nextId = (Math.max(...next.map(s => s.id)) || 0) + 1;
          next.unshift({ id: nextId, name: "Trigger", type: "trigger", config: "Shopify order created" });
        }
        if (!next.find(s => s.type === "action")) {
          const nextId = (Math.max(...next.map(s => s.id)) || 0) + 1;
          next.push({ id: nextId, name: "Action", type: "action", config: "Send Slack alert to #ops" });
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
  const clearPreflightStatus = () => {
    setPreflightStatus(null);
    setPreflightIssues([]);
    setPreflightTrace([]);
    try { window.localStorage.removeItem("suite:status:workflow-automation-builder"); } catch (_) {}
  };

  const downloadPreflightReport = () => {
    const payload = { status: preflightStatus, issues: preflightIssues, trace: preflightTrace, generatedAt: Date.now() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workflow-automation-preflight.json";
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
    a.download = "workflow-automation-preflight-review.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const isViewer = role === "viewer";
  const hydratedRef = useRef(false);

  const stepSummary = useMemo(() => {
    const triggers = steps.filter(s => s.type === "trigger").length;
    const actions = steps.filter(s => s.type === "action").length;
    return { triggers, actions };
  }, [steps]);

  const riskLevel = useMemo(() => {
    const actions = stepSummary.actions;
    if (env === "prod" && actions >= 4) return "high";
    if (actions >= 3) return "medium";
    return "low";
  }, [env, stepSummary.actions]);

  const diffSummary = useMemo(() => {
    if (!lastBuiltSnapshot) return null;
    const prev = lastBuiltSnapshot.steps || [];
    const added = steps.filter(s => !prev.find(p => p.id === s.id));
    const removed = prev.filter(p => !steps.find(s => s.id === p.id));
    const changed = steps.filter(s => {
      const p = prev.find(prevStep => prevStep.id === s.id);
      if (!p) return false;
      return p.name !== s.name || p.type !== s.type || p.config !== s.config;
    });
    return { added, removed, changed };
  }, [steps, lastBuiltSnapshot]);

  const readinessSummary = useMemo(() => {
    const triggerOk = steps.some(s => s.type === "trigger");
    const approvalsOk = approvalRequired ? !!approverEmail : true;
    const guardrailsOk = preflightIssues.length === 0;
    const coverage = Math.min(100, (steps.length * 15) + (approvalsOk ? 15 : 0) + (triggerOk ? 10 : 0) - (preflightIssues.length * 5));
    return {
      coverage,
      triggerOk,
      approvalsOk,
      guardrailsOk,
      summary: `${steps.length} steps · ${steps.filter(s => s.type === "trigger").length} triggers`
    };
  }, [steps, approvalRequired, approverEmail, preflightIssues.length]);

  const checklist = useMemo(() => ([
    { label: "Trigger present", ok: steps.some(s => s.type === "trigger") },
    { label: "Approver email set when approvals on", ok: approvalRequired ? !!approverEmail : true },
    { label: "Preflight clear", ok: preflightIssues.length === 0 },
    { label: "Prod/high risk note added", ok: env !== "prod" && riskLevel !== "high" ? true : !!confirmationNote.trim() }
  ]), [steps, approvalRequired, approverEmail, preflightIssues.length, env, riskLevel, confirmationNote]);

  // Format a friendly timestamp
  const formatTime = ts => ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

  // Hotkeys (Ctrl+S save draft, Ctrl+Enter build)
  useEffect(() => {
    const listener = e => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        handleManualSave();
      }
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleBuild();
      }
      if (!e.ctrlKey && !e.metaKey && e.key === "a") {
        e.preventDefault();
        handleAddStep();
      }
      if (!e.ctrlKey && !e.metaKey && e.key === "t") {
        e.preventDefault();
        const nextId = Math.max(...steps.map(s => s.id)) + 1;
        setSteps([...steps, { id: nextId, name: `Trigger ${nextId}`, type: "trigger", config: "" }]);
        setSelectedStep(nextId);
      }
      if (!e.ctrlKey && !e.metaKey && e.key === "c") {
        e.preventDefault();
        handleCloneStep();
      }
      if (e.ctrlKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "z") || (e.ctrlKey && e.key.toLowerCase() === "y")) {
        e.preventDefault();
        handleRedo();
      }
      if (e.ctrlKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [steps]);

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

  // Load draft on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.steps) setSteps(parsed.steps);
        if (parsed.env) setEnv(parsed.env);
        if (parsed.versionTag) setVersionTag(parsed.versionTag);
        if (typeof parsed.approvalRequired === "boolean") setApprovalRequired(parsed.approvalRequired);
        if (parsed.approverEmail) setApproverEmail(parsed.approverEmail);
        if (parsed.selectedStep) setSelectedStep(parsed.selectedStep);
        if (parsed.versions) setVersions(parsed.versions);
        if (parsed.lastSavedAt) setLastSavedAt(parsed.lastSavedAt);
      } catch (err) {
        console.warn("Failed to parse draft", err);
      }
    }
  }, []);

  useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }
    setDirtySinceSave(true);
  }, [steps, env, versionTag, approvalRequired, approverEmail, selectedStep, confirmationNote]);

  // Autosave draft with debounce
  useEffect(() => {
    if (typeof window === "undefined") return;
    setDraftStatus("saving");
    const handle = setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        steps,
        env,
        versionTag,
        approvalRequired,
        approverEmail,
        selectedStep,
        versions,
        lastSavedAt: Date.now()
      }));
      setDraftStatus("saved");
      setLastSavedAt(Date.now());
      setDirtySinceSave(false);
    }, 450);
    return () => clearTimeout(handle);
  }, [steps, env, versionTag, approvalRequired, approverEmail, selectedStep, versions]);

  const goBackToSuite = () => {
    if (typeof window !== "undefined" && typeof window.__AURA_TO_SUITE === "function") {
      window.__AURA_TO_SUITE("workflows");
    }
  };

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

  const handleStepChange = (id, value) => {
    if (isViewer) return;
    pushUndoSnapshot();
    setSteps(steps.map(s => s.id === id ? { ...s, config: value } : s));
  };

  const handleAddStep = () => {
    if (isViewer) return;
    const nextId = Math.max(...steps.map(s => s.id)) + 1;
    pushUndoSnapshot();
    setSteps([...steps, { id: nextId, name: `Step ${nextId}`, type: "action", config: "" }]);
    setSelectedStep(nextId);
  };

  const handleRemoveStep = id => {
    if (steps.length <= 1) return;
    if (isViewer) return;
    pushUndoSnapshot();
    setSteps(steps.filter(s => s.id !== id));
    setSelectedStep(steps[0].id);
  };

  const runPreflight = (snapshot) => {
    const issues = [];
    const trace = [];
    const hasTrigger = snapshot.steps.some(s => s.type === "trigger");
    const hasAction = snapshot.steps.some(s => s.type === "action");
    const nameCounts = snapshot.steps.reduce((acc, s) => {
      const key = (s.name || "").trim().toLowerCase();
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    if (!hasTrigger) issues.push("At least one trigger is required.");
    if (snapshot.steps[0]?.type !== "trigger") issues.push("The first step should be a trigger.");
    if (!hasAction) issues.push("At least one action is required.");
    if (snapshot.steps.length && snapshot.steps[snapshot.steps.length - 1]?.type !== "action") issues.push("Consider ending with an action/terminal step.");

    snapshot.steps.forEach((s, idx) => {
      const localIssues = [];
      if (!s.name.trim()) localIssues.push("Name missing");
      if (!s.config.trim()) localIssues.push("Config missing");
      if (!["trigger", "action"].includes(s.type)) localIssues.push("Invalid type");
      const key = (s.name || "").trim().toLowerCase();
      if (key && nameCounts[key] > 1) localIssues.push("Duplicate name");
      if (s.type === "action" && idx === 0) localIssues.push("Action should not be first");
      if (localIssues.length) trace.push({ label: s.name || `Step ${idx + 1}`, idx, issues: localIssues });
    });

    if (snapshot.approvalRequired && !snapshot.approverEmail) {
      issues.push("Approver email is required when approvals are enabled.");
    }
    if (snapshot.env === "prod" && riskLevel === "high" && !confirmationNote.trim()) {
      issues.push("Prod/high risk requires a confirmation note.");
    }
    if (snapshot.env === "prod" && snapshot.approvalRequired && !confirmationNote.trim()) {
      issues.push("Approvals in prod require a confirmation note.");
    }
    setPreflightTrace(trace);
    setPreflightIssues(issues);
    const status = { ok: issues.length === 0, ts: Date.now(), issues: issues.length };
    setPreflightStatus(status);
    try { window.localStorage.setItem("suite:status:workflow-automation-builder", JSON.stringify(status)); } catch (_) {}
    return issues;
  };

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (env === "prod" || approvalRequired || riskLevel !== "low") {
      runPreflight({ steps, env, versionTag, approvalRequired, approverEmail, confirmationNote });
    }
  }, [env, approvalRequired, riskLevel, confirmationNote, steps.length]);

  function handleManualSave() {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      steps,
      env,
      versionTag,
      approvalRequired,
      approverEmail,
      selectedStep,
      versions,
      lastSavedAt: Date.now()
    }));
    setDraftStatus("saved");
    setLastSavedAt(Date.now());
    setDirtySinceSave(false);
  }

  const handleCreateVersion = () => {
    if (isViewer) return;
    const snapshot = {
      id: `${Date.now()}`,
      label: `${versionTag || "v"}${versions.length + 1}`,
      steps,
      env,
      approvalRequired,
      approverEmail,
      createdAt: Date.now()
    };
    setVersions(prev => [snapshot, ...prev].slice(0, 6));
  };

  const handleRestoreVersion = (version) => {
    if (isViewer) return;
    pushUndoSnapshot();
    setSteps(version.steps);
    setEnv(version.env);
    setApprovalRequired(version.approvalRequired);
    setApproverEmail(version.approverEmail || "");
    setVersionTag(version.label || versionTag);
    setSelectedStep(version.steps?.[0]?.id || 1);
  };

  const rollbackToLastBuild = () => {
    if (isViewer) return;
    if (!lastBuiltSnapshot) return;
    pushUndoSnapshot();
    setSteps(lastBuiltSnapshot.steps || steps);
    setEnv(lastBuiltSnapshot.env || env);
    setVersionTag(lastBuiltSnapshot.versionTag || versionTag);
    setApprovalRequired(lastBuiltSnapshot.approvalRequired ?? approvalRequired);
    setApproverEmail(lastBuiltSnapshot.approverEmail || "");
  };

  const handleApplyPreset = (presetId) => {
    const preset = PRESETS.find(p => p.id === presetId) || userTemplates.find(t => t.id === presetId);
    if (!preset) return;
    if (isViewer) return;
    pushUndoSnapshot();
    setSteps(preset.steps);
    setSelectedStep(preset.steps[0]?.id || 1);
    setSelectedPreset(presetId);
  };

  const handleClearDraft = () => {
    if (isViewer) return;
    pushUndoSnapshot();
    setSteps([
      { id: 1, name: "Trigger", type: "trigger", config: "" },
      { id: 2, name: "Action", type: "action", config: "" }
    ]);
    setSelectedStep(1);
    setEnv("dev");
    setVersionTag("v1");
    setApprovalRequired(true);
    setApproverEmail("");
    setVersions([]);
    setSelectedPreset("");
    setConfirmationNote("");
    setStepStatuses({});
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleCloneStep = () => {
    const current = steps.find(s => s.id === selectedStep);
    if (!current) return;
    if (isViewer) return;
    const nextId = Math.max(...steps.map(s => s.id)) + 1;
    const clone = { ...current, id: nextId, name: `${current.name} Copy` };
    const idx = steps.findIndex(s => s.id === selectedStep);
    const newSteps = [...steps.slice(0, idx + 1), clone, ...steps.slice(idx + 1)];
    pushUndoSnapshot();
    setSteps(newSteps);
    setSelectedStep(nextId);
  };

  const handleTestInDev = () => {
    if (isViewer) return;
    setTestStatus("running");
    const payload = PAYLOAD_PRESETS.find(p => p.id === selectedPayloadPreset)?.payload || {};
    const runningStatuses = {};
    steps.forEach(s => { runningStatuses[s.id] = "running"; });
    setStepStatuses(runningStatuses);
    setTimeout(() => {
      const passedStatuses = {};
      steps.forEach(s => { passedStatuses[s.id] = "passed"; });
      setStepStatuses(passedStatuses);
      setTestStatus("passed");
      setHistory(prev => [{ steps, result: { test: "dev", payload }, env: "dev", versionTag, approvalRequired }, ...prev].slice(0, 10));
    }, 800);
  };

  const handleExportJson = async () => {
    const json = JSON.stringify({ steps, env, versionTag, approvalRequired, approverEmail }, null, 2);
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(json);
      setError("Export copied to clipboard");
      setTimeout(() => setError(""), 1500);
    }
  };

  const handleCopySummary = async () => {
    const summary = `Workflow (${env}, risk: ${riskLevel})\nApprovals: ${approvalRequired ? "On" : "Off"}\nSteps:\n${steps.map((s, i) => `${i + 1}. [${s.type}] ${s.name} — ${s.config}`).join("\n")}`;
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(summary);
      setError("Summary copied");
      setTimeout(() => setError(""), 1200);
    }
  };

  const handleSaveTemplate = () => {
    if (isViewer) return;
    const id = `user-${Date.now()}`;
    setUserTemplates(prev => [{ id, name: versionTag || `Template ${prev.length + 1}`, steps }, ...prev].slice(0, 6));
  };

  const runDryRun = () => {
    if (isViewer) return;
    setEnv("dev");
    runPreflight({ steps, env: "dev", versionTag, approvalRequired, approverEmail, confirmationNote });
  };

  const handleBuild = async () => {
    if (isViewer) return;
    setLoading(true);
    setError("");
    setResult(null);
    const snapshot = { steps, env, versionTag, approvalRequired, approverEmail, confirmationNote };
    const issues = runPreflight(snapshot);
    setPreflightIssues(issues);
    if (issues.length) {
      setLoading(false);
      setError("Resolve preflight guardrails before building.");
      return;
    }
    try {
      const res = await fetch("/api/workflow-automation-builder/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot)
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setResult(data.result);
      setHistory(prev => [{ steps, result: data.result, env, versionTag, approvalRequired }, ...prev].slice(0, 10));
      setLastBuiltSnapshot({ steps, env, versionTag, approvalRequired, approverEmail, builtAt: Date.now() });
      setDraftStatus("saved");
      setDirtySinceSave(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onboardingContent = (
    <div>
      <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Workflow Automation Builder</h3>
      <ul style={{ margin: "16px 0 0 18px", color: "#a3e635", fontSize: 16 }}>
        <li>Visually design and automate workflows step by step</li>
        <li>Add triggers and actions, configure each step</li>
        <li>Export, share, and review workflow history</li>
        <li>Accessible, secure, and fully compliant</li>
      </ul>
      <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: "#23263a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Get Started</button>
    </div>
  );

  return (
    <div style={{ background: "#0f1115", color: "#e5e7eb", padding: 24, borderRadius: 16, border: "1px solid #1f2937", boxShadow: "0 12px 48px #0007" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, gap: 12, flexWrap: "wrap" }}>
        <BackButton label="← Back to Suite" onClick={goBackToSuite} />
        <div style={{ color: "#9ca3af", fontSize: 13 }}>Workflows Suite · Automation Builder</div>
      </div>
      {isViewer && (
        <div style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 12, padding: 12, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 800, color: "#fcd34d" }}>View-only mode</div>
            <div style={{ color: "#9ca3af", fontSize: 13 }}>You can inspect workflows but need elevated access to edit or ship changes.</div>
          </div>
          <button onClick={() => setAccessRequested(true)} disabled={accessRequested} style={{ background: accessRequested ? "#374151" : "#22c55e", color: "#0b1221", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: accessRequested ? "default" : "pointer" }}>
            {accessRequested ? "Request sent" : "Request edit access"}
          </button>
        </div>
      )}
      {issueHelp && (
        <div style={{ background: "#0b1221", border: "1px solid #1f2937", borderRadius: 10, padding: 10, display: "grid", gap: 8, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div style={{ color: "#a5f3fc", fontWeight: 800 }}>Issue help</div>
            <button onClick={() => setIssueHelp(null)} style={{ background: "#1f2937", color: "#e5e7eb", border: "1px solid #334155", borderRadius: 8, padding: "4px 8px", fontWeight: 700, cursor: "pointer" }}>Close</button>
          </div>
          <div style={{ color: "#e5e7eb" }}>{issueHelp}</div>
          <div style={{ color: "#9ca3af", fontSize: 13 }}>Recommended fix: {issueHelp.toLowerCase().includes("approv") ? "Add an approver email or disable approvals." : issueHelp.toLowerCase().includes("trigger") ? "Add a trigger step to start the automation." : "Adjust steps, approvals, or prod note, then rerun preflight."}</div>
        </div>
      )}
      {showCommandPalette && (
        <div style={{ position: "fixed", inset: 0, background: "#0009", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20 }}>
          <div style={{ background: "#0b1221", border: "1px solid #1f2937", borderRadius: 14, padding: 16, width: "min(520px, 92vw)", boxShadow: "0 18px 60px #000" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 800, color: "#a5f3fc" }}>Command Palette</div>
              <button onClick={() => setShowCommandPalette(false)} style={{ background: "transparent", color: "#9ca3af", border: "none", cursor: "pointer", fontWeight: 700 }}>Esc</button>
            </div>
            {[{ label: "Save draft", action: handleManualSave, hotkey: "Ctrl+S", disabled: false }, { label: "Run preflight", action: () => runPreflight({ steps, env, versionTag, approvalRequired, approverEmail, confirmationNote }), hotkey: "Alt+P", disabled: false }, { label: "Build", action: handleBuild, hotkey: "Ctrl+Enter", disabled: isViewer }, { label: "Undo", action: handleUndo, hotkey: "Ctrl+Z", disabled: !undoStack.length || isViewer }, { label: "Redo", action: handleRedo, hotkey: "Ctrl+Shift+Z", disabled: !redoStack.length || isViewer }].map(cmd => (
              <button key={cmd.label} disabled={cmd.disabled} onClick={() => { cmd.action(); setShowCommandPalette(false); }} style={{ width: "100%", textAlign: "left", background: cmd.disabled ? "#1f2937" : "#111827", color: cmd.disabled ? "#6b7280" : "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "10px 12px", marginBottom: 8, cursor: cmd.disabled ? "not-allowed" : "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{cmd.label}</span>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>{cmd.hotkey}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 32, margin: 0, color: "#a5f3fc" }}>Workflow Automation Builder</h2>
          <div style={{ color: "#9ca3af", fontSize: 13, marginTop: 4 }}>Autosaves locally · Hotkeys: Ctrl+S save, Ctrl+Enter build, a add action, t add trigger, c clone</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select value={env} onChange={e => setEnv(e.target.value)} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "8px 12px", fontWeight: 700 }}>
            <option value="dev">Dev</option><option value="stage">Stage</option><option value="prod">Prod</option>
          </select>
          <input value={versionTag} onChange={e => setVersionTag(e.target.value)} placeholder="Version tag" style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "8px 12px", minWidth: 120 }} />
          <label style={{ display: "flex", alignItems: "center", gap: 6, background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: "6px 10px", fontWeight: 700 }}>
            <input type="checkbox" checked={disabled} onChange={e => setDisabled(e.target.checked)} /> Disabled
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: "6px 10px", fontWeight: 700 }}>
            <input type="checkbox" checked={approvalRequired} onChange={e => setApprovalRequired(e.target.checked)} /> Approvals
          </label>
          <input value={approverEmail} onChange={e => setApproverEmail(e.target.value)} placeholder="Approver email" style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "8px 12px", minWidth: 180 }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginBottom: 10 }}>
        <div style={{ background: "#0b1221", border: "1px solid #1f2937", borderRadius: 12, padding: 12 }}>
          <div style={{ color: "#9ca3af", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.4 }}>Readiness</div>
          <div style={{ fontWeight: 800, fontSize: 22, color: readinessSummary.coverage >= 85 ? "#22c55e" : "#fbbf24" }}>{readinessSummary.coverage}%</div>
          <div style={{ color: "#9ca3af", fontSize: 13 }}>{readinessSummary.summary}</div>
        </div>
        <div style={{ background: "#0b1221", border: "1px solid #1f2937", borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Guardrails</div>
          <div style={{ color: preflightIssues.length ? "#f59e0b" : "#22c55e", fontWeight: 700 }}>{preflightIssues.length ? `${preflightIssues.length} issue${preflightIssues.length > 1 ? "s" : ""}` : "Clear"}</div>
          <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: preflightIssues.length ? 6 : 0 }}>Trigger: {readinessSummary.triggerOk ? "OK" : "Missing"} · Approvals: {readinessSummary.approvalsOk ? "Ready" : "Need email"}</div>
          {preflightIssues.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 16, color: "#e5e7eb", fontSize: 12, display: "grid", gap: 4 }}>
              {preflightIssues.slice(0, 3).map((issue, idx) => (
                <li key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span>{issue}</span>
                  <button onClick={() => setIssueHelp(issue)} style={{ background: "#1f2937", border: "1px solid #334155", color: "#a5f3fc", borderRadius: 8, padding: "2px 8px", fontWeight: 700, cursor: "pointer" }}>Explain</button>
                </li>
              ))}
              {preflightIssues.length > 3 && <li style={{ color: "#9ca3af" }}>+{preflightIssues.length - 3} more (open Trace)</li>}
            </ul>
          )}
        </div>
        <div style={{ background: "#0b1221", border: "1px solid #1f2937", borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Workflow hygiene</div>
          <div style={{ color: dirtySinceSave ? "#fbbf24" : "#22c55e", fontWeight: 700 }}>{dirtySinceSave ? "Unsaved edits" : "Clean"}</div>
          <div style={{ color: "#9ca3af", fontSize: 12 }}>Last saved {lastSavedAt ? formatTime(lastSavedAt) : "—"}</div>
        </div>
      </div>

      <div style={{ marginBottom: 12, background: "#0b1221", border: "1px solid #1f2937", borderRadius: 12, padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 800 }}>Operational checklist</div>
          <div style={{ color: "#9ca3af", fontSize: 12 }}>Auto-refresh as you edit</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 8 }}>
          {checklist.map(item => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, background: "#0f172a", border: "1px solid #1f2937", borderRadius: 10, padding: "8px 10px" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.ok ? "#22c55e" : "#f97316" }} />
              <div style={{ color: "#e5e7eb", fontWeight: 600 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

        {preflightTrace.length > 0 && (
          <div style={{ marginBottom: 12, background: "#0b1221", border: "1px solid #1f2937", borderRadius: 12, padding: 12 }}>
            <div style={{ fontWeight: 800, marginBottom: 6, color: "#fcd34d" }}>Preflight trace</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: "#e5e7eb" }}>
              {preflightTrace.map((t, i) => (
                <li key={i}>{t.label}: {t.issues.join("; ")}</li>
              ))}
            </ul>
          </div>
        )}

      {(env === "prod" || riskLevel === "high") && (
        <div style={{ marginBottom: 10, background: "#1f2937", border: "1px solid #374151", borderRadius: 10, padding: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ color: "#fbbf24", fontWeight: 700 }}>Prod / high-risk confirmation</div>
          <input value={confirmationNote} onChange={e => setConfirmationNote(e.target.value)} placeholder="Add a confirmation note" style={{ flex: 1, minWidth: 220, background: "#0b1221", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "8px 12px" }} />
        </div>
      )}

      <div style={{ position: "sticky", top: 0, zIndex: 2, background: "#0f1115", paddingBottom: 6, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
          <div style={{ background: "#111827", border: "1px solid #1f2937", padding: "8px 12px", borderRadius: 10, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: draftStatus === "saving" ? "#facc15" : "#22c55e" }}>{draftStatus === "saving" ? "Saving..." : "Saved"}</span>
            {lastSavedAt && <span style={{ color: "#9ca3af", fontWeight: 500 }}>· {formatTime(lastSavedAt)}</span>}
          </div>
          <button onClick={handleManualSave} style={{ background: "#0ea5e9", color: "#0b1221", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 800, cursor: "pointer" }}>Save draft</button>
          <input value={newVersionLabel} onChange={e => setNewVersionLabel(e.target.value)} placeholder="Version name" style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "8px 12px", minWidth: 140 }} />
          <button onClick={() => { if (newVersionLabel) setVersionTag(newVersionLabel); handleCreateVersion(); }} style={{ background: "#a855f7", color: "#0b1221", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 800, cursor: "pointer" }}>Snapshot version</button>
          <button onClick={() => runPreflight({ steps, env, versionTag, approvalRequired, approverEmail, confirmationNote })} style={{ background: "#f59e0b", color: "#0b1221", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 800, cursor: "pointer" }}>Preflight</button>
          <button onClick={runDryRun} style={{ background: "#22c55e", color: "#0b1221", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 800, cursor: "pointer" }}>Dry-run (dev)</button>
          <button onClick={() => handleApplyPreset("checkout-winback")} style={{ background: "#0ea5e9", color: "#0b1221", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 800, cursor: "pointer" }}>Shopify winback preset</button>
          <button onClick={rollbackToLastBuild} disabled={!lastBuiltSnapshot || isViewer} style={{ background: "#ef4444", color: "#0b1221", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 800, cursor: (!lastBuiltSnapshot || isViewer) ? "not-allowed" : "pointer", opacity: (!lastBuiltSnapshot || isViewer) ? 0.6 : 1 }}>Rollback to last build</button>
          {preflightStatus && (
            <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 999, border: "1px solid #1f2937", background: preflightStatus.ok ? "#0b1221" : "#1f2937", color: preflightStatus.ok ? "#22c55e" : preflightStatus.issues ? "#fcd34d" : "#f87171", fontWeight: 800, fontSize: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: preflightStatus.ok ? "#22c55e" : preflightStatus.issues ? "#f59e0b" : "#ef4444" }} />
              <span>{preflightStatus.ok ? "Preflight pass" : preflightStatus.issues ? `${preflightStatus.issues} issues` : "Preflight failed"}</span>
              {preflightStatus.ts ? <span style={{ color: "#9ca3af", fontWeight: 600 }}>· {new Date(preflightStatus.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span> : null}
              <button onClick={() => setShowPreflightPopover(v => !v)} style={{ background: "transparent", border: "none", color: "#e5e7eb", cursor: "pointer", fontWeight: 800 }}>Trace</button>
              <button onClick={clearPreflightStatus} style={{ marginLeft: 2, background: "transparent", border: "none", color: "#9ca3af", cursor: "pointer", fontWeight: 800 }}>Clear</button>
              <button onClick={downloadPreflightReport} style={{ background: "transparent", border: "none", color: "#67e8f9", cursor: "pointer", fontWeight: 800 }}>Save</button>
              {showPreflightPopover && (
                <div style={{ position: "absolute", top: "110%", right: 0, minWidth: 220, background: "#0b1221", border: "1px solid #1f2937", borderRadius: 10, padding: 10, boxShadow: "0 10px 30px rgba(0,0,0,0.4)", zIndex: 10 }}>
                  <div style={{ fontWeight: 800, color: "#fcd34d", marginBottom: 6 }}>Preflight issues</div>
                  <div style={{ color: "#9ca3af", fontSize: 12, marginBottom: 6 }}>Why this matters: blocks misfires before they hit Shopify customers.</div>
                  {preflightIssues.length === 0 ? <div style={{ color: "#22c55e" }}>Clear</div> : (
                    <ul style={{ margin: 0, paddingLeft: 16, color: "#e5e7eb", maxHeight: 160, overflow: "auto" }}>
                      {preflightIssues.slice(0, 6).map((p, i) => <li key={i}>{p}</li>)}
                      {preflightIssues.length > 6 && <li style={{ color: "#9ca3af" }}>…{preflightIssues.length - 6} more</li>}
                    </ul>
                  )}
                  <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button onClick={() => applyQuickFix("approver")} style={{ background: "#0ea5e9", color: "#0b1221", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>Add approver</button>
                    <button onClick={() => applyQuickFix("prod-note")} style={{ background: "#f59e0b", color: "#0b1221", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>Add prod note</button>
                    <button onClick={() => applyQuickFix("trigger-action")} style={{ background: "#22c55e", color: "#0f172a", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>Add trigger/action</button>
                    <button onClick={() => applyQuickFix("dedupe-labels")} style={{ background: "#6366f1", color: "#e5e7eb", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>Fix duplicates</button>
                  </div>
                  {preflightTrace.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ color: "#67e8f9", fontWeight: 700 }}>Trace</div>
                      <ul style={{ margin: 0, paddingLeft: 16, color: "#e5e7eb", maxHeight: 140, overflow: "auto" }}>
                        {preflightTrace.slice(0, 5).map((t, i) => (
                          <li key={i}>{t.label}: {t.issues?.join("; ")}</li>
                        ))}
                        {preflightTrace.length > 5 && <li style={{ color: "#9ca3af" }}>…{preflightTrace.length - 5} more</li>}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </span>
          )}
          <button onClick={handleExportJson} style={{ background: "#14b8a6", color: "#0b1221", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 800, cursor: "pointer" }}>Export JSON</button>
          <button onClick={handleCopySummary} style={{ background: "#8b5cf6", color: "#0b1221", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 800, cursor: "pointer" }}>Copy summary</button>
          <button onClick={handleSaveTemplate} style={{ background: "#22d3ee", color: "#0b1221", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 800, cursor: "pointer" }}>Save as template</button>
          <button onClick={() => handleBuild()} disabled={loading} style={{ background: "#22c55e", color: "#0b1221", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer" }}>{loading ? "Building..." : "Build"}</button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 999, padding: "6px 10px", color: preflightIssues.length ? "#f97316" : "#22c55e", fontWeight: 700 }}>Trigger: {steps.some(s => s.type === "trigger") ? "OK" : "Missing"}</span>
          <span style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 999, padding: "6px 10px", color: approvalRequired && !approverEmail ? "#f97316" : "#22c55e", fontWeight: 700 }}>Approvals: {approvalRequired ? (approverEmail ? "Ready" : "Email needed") : "Off"}</span>
          <span style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 999, padding: "6px 10px", color: riskLevel === "high" ? "#f87171" : riskLevel === "medium" ? "#fbbf24" : "#22c55e", fontWeight: 700 }}>Risk: {riskLevel}</span>
          <span style={{ background: "#0b1221", border: "1px solid #1f2937", borderRadius: 999, padding: "6px 10px", color: stepSummary.actions >= 4 ? "#f97316" : "#22c55e", fontWeight: 700 }}>Perf guardrail: {stepSummary.actions >= 4 ? "tighten" : "OK"}</span>
          {env === "prod" && <span style={{ background: "#7c2d12", border: "1px solid #b45309", borderRadius: 999, padding: "6px 10px", color: confirmationNote ? "#facc15" : "#fca5a5", fontWeight: 700 }}>Prod note {confirmationNote ? "ready" : "required"}</span>}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
          <input value={reviewerEmail} onChange={e => setReviewerEmail(e.target.value)} placeholder="Reviewer email" style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "6px 10px", minWidth: 200 }} />
          <button onClick={attachPreflightForReviewer} style={{ background: "#8b5cf6", color: "#0b1221", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 800, cursor: "pointer" }}>Attach preflight</button>
          <div style={{ background: "#0b1221", border: "1px solid #1f2937", borderRadius: 10, padding: "6px 10px", color: disabled ? "#f97316" : "#22c55e", fontWeight: 700 }}>Disabled: {disabled ? "Yes" : "No"}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: 10, minWidth: 220 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Presets</div>
          <select value={presetTag} onChange={e => setPresetTag(e.target.value)} style={{ width: "100%", background: "#18181b", color: "#e5e7eb", border: "1px solid #23263a", borderRadius: 8, padding: 8, marginBottom: 6 }}>
            <option value="">All tags</option>
            {Array.from(new Set(PRESETS.flatMap(p => p.tags))).map(tag => <option key={tag} value={tag}>{tag}</option>)}
          </select>
          <select value={selectedPreset} onChange={e => handleApplyPreset(e.target.value)} style={{ width: "100%", background: "#18181b", color: "#e5e7eb", border: "1px solid #23263a", borderRadius: 8, padding: 8, marginBottom: 8 }}>
            <option value="">Pick a preset...</option>
            {PRESETS.filter(p => !presetTag || p.tags.includes(presetTag)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            {userTemplates.map(t => <option key={t.id} value={t.id}>{t.name} (yours)</option>)}
          </select>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>Jump-start a workflow with a curated template.</div>
          <div style={{ marginTop: 6, padding: 10, borderRadius: 8, background: "#0b1221", border: "1px solid #1f2937", color: "#e5e7eb", fontSize: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Shopify help</div>
            <div>Use <b>Checkout Winback</b> for abandoned carts with email+SMS. Applies Shopify-safe triggers/actions.</div>
          </div>
          <button onClick={handleClearDraft} style={{ marginTop: 8, background: "#ef4444", color: "#0b1221", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer", width: "100%" }}>Reset draft</button>
        </div>
        <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: 10, flex: 1, minWidth: 260 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Preflight guardrails</div>
          {preflightIssues.length === 0 ? (
            <div style={{ color: "#22c55e", fontWeight: 700 }}>No blockers detected. 🚀</div>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18, color: "#fca5a5" }}>
              {preflightIssues.map((issue, idx) => <li key={idx}>{issue}</li>)}
            </ul>
          )}
          <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select value={selectedPayloadPreset} onChange={e => setSelectedPayloadPreset(e.target.value)} style={{ background: "#18181b", color: "#e5e7eb", border: "1px solid #23263a", borderRadius: 8, padding: 8 }}>
              {PAYLOAD_PRESETS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={handleTestInDev} style={{ background: "#22c55e", color: "#0b1221", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 800, cursor: "pointer" }}>{testStatus === "running" ? "Testing..." : "Test in dev"}</button>
          </div>
        </div>
        <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: 10, minWidth: 220 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Versions</div>
          {versions.length === 0 && <div style={{ color: "#9ca3af", fontSize: 13 }}>No snapshots yet.</div>}
          {versions.slice(0, 4).map(v => (
            <div key={v.id} style={{ padding: 8, borderRadius: 8, border: "1px solid #23263a", marginBottom: 6, background: "#0b1221" }}>
              <div style={{ fontWeight: 700 }}>{v.label}</div>
              <div style={{ color: "#9ca3af", fontSize: 12 }}>Saved {formatTime(v.createdAt)}</div>
              <button onClick={() => handleRestoreVersion(v)} style={{ marginTop: 6, background: "#22c55e", color: "#0b1221", border: "none", borderRadius: 6, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>Restore</button>
            </div>
          ))}
        </div>
      </div>

      <button onClick={() => setShowOnboarding(v => !v)} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginBottom: 16 }}>{showOnboarding ? "Hide" : "Show"} Onboarding</button>
      {showOnboarding && onboardingContent}
      <div style={{ display: "flex", gap: 18, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ minWidth: 260, maxWidth: 320 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Workflow Steps</div>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {steps.map(step => (
              <li key={step.id} style={{ marginBottom: 8, background: selectedStep === step.id ? "#23263a" : "#18181b", borderRadius: 8, padding: 8, cursor: "pointer", border: selectedStep === step.id ? "2px solid #6366f1" : "1px solid #23263a" }} onClick={() => setSelectedStep(step.id)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                  <div>
                    <b>{step.name}</b> <span style={{ color: "#a5f3fc", fontSize: 12 }}>({step.type})</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {stepStatuses[step.id] && <span style={{ background: stepStatuses[step.id] === "passed" ? "#14532d" : "#78350f", color: stepStatuses[step.id] === "passed" ? "#bbf7d0" : "#fed7aa", borderRadius: 999, padding: "4px 8px", fontSize: 11 }}>{stepStatuses[step.id]}</span>}
                    {steps.length > 1 && <button onClick={e => { e.stopPropagation(); handleRemoveStep(step.id); }} style={{ background: "none", color: "#fca5a5", border: "none", fontWeight: 700, cursor: "pointer" }}>✕</button>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            <button onClick={handleAddStep} style={{ background: "#22c55e", color: "#0b1221", border: "none", borderRadius: 8, padding: "6px 14px", fontWeight: 800, cursor: "pointer" }}>+ Add Action</button>
            <button onClick={() => { const nextId = Math.max(...steps.map(s => s.id)) + 1; setSteps([...steps, { id: nextId, name: `Trigger ${nextId}`, type: "trigger", config: "" }]); setSelectedStep(nextId); }} style={{ background: "#38bdf8", color: "#0b1221", border: "none", borderRadius: 8, padding: "6px 14px", fontWeight: 800, cursor: "pointer" }}>+ Add Trigger</button>
            <button onClick={handleCloneStep} style={{ background: "#a855f7", color: "#0b1221", border: "none", borderRadius: 8, padding: "6px 14px", fontWeight: 800, cursor: "pointer" }}>Clone step</button>
          </div>
          <div style={{ marginTop: 12, background: "#0b1221", border: "1px solid #1f2937", borderRadius: 10, padding: 10 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Action library</div>
            <input value={actionSearch} onChange={e => setActionSearch(e.target.value)} placeholder="Search actions/triggers" style={{ width: "100%", background: "#18181b", color: "#e5e7eb", border: "1px solid #23263a", borderRadius: 8, padding: 8, marginBottom: 6 }} />
            <select value={actionTag} onChange={e => setActionTag(e.target.value)} style={{ width: "100%", background: "#18181b", color: "#e5e7eb", border: "1px solid #23263a", borderRadius: 8, padding: 8, marginBottom: 8 }}>
              <option value="">All tags</option>
              {Array.from(new Set(ACTION_LIBRARY.flatMap(a => a.tags))).map(tag => <option key={tag} value={tag}>{tag}</option>)}
            </select>
            <div style={{ maxHeight: 180, overflowY: "auto", display: "grid", gap: 6 }}>
              {ACTION_LIBRARY.filter(a => (!actionTag || a.tags.includes(actionTag)) && (!actionSearch || a.name.toLowerCase().includes(actionSearch.toLowerCase()) || a.tags.some(t => t.includes(actionSearch.toLowerCase())))).map(item => (
                <div key={item.id} style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 8, padding: 8 }}>
                  <div style={{ fontWeight: 700 }}>{item.name} <span style={{ color: "#a5f3fc", fontSize: 11 }}>({item.type})</span></div>
                  <div style={{ color: "#9ca3af", fontSize: 12 }}>{item.config}</div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
                    {item.tags.map(t => <span key={t} style={{ background: "#0f172a", color: "#cbd5f5", borderRadius: 999, padding: "2px 8px", fontSize: 11 }}>{t}</span>)}
                  </div>
                  <button onClick={() => { const nextId = Math.max(...steps.map(s => s.id)) + 1; setSteps([...steps, { id: nextId, name: item.name, type: item.type, config: item.config }]); setSelectedStep(nextId); }} style={{ marginTop: 6, background: "#22c55e", color: "#0b1221", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer", width: "100%" }}>Add</button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Step Configuration</div>
          {steps.map(step => step.id === selectedStep && (
            <div key={step.id}>
              <input value={step.name} onChange={e => setSteps(steps.map(s => s.id === step.id ? { ...s, name: e.target.value } : s))} style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, width: "100%", borderRadius: 6, border: "1px solid #23263a", padding: 8, background: "#18181b", color: "#e5e7eb" }} />
              <select value={step.type} onChange={e => setSteps(steps.map(s => s.id === step.id ? { ...s, type: e.target.value } : s))} style={{ marginBottom: 8, width: "100%", borderRadius: 6, border: "1px solid #23263a", padding: 8, background: "#18181b", color: "#e5e7eb" }}>
                <option value="trigger">Trigger</option>
                <option value="action">Action</option>
              </select>
              <textarea value={step.config} onChange={e => handleStepChange(step.id, e.target.value)} rows={4} style={{ width: "100%", borderRadius: 6, border: "1px solid #23263a", padding: 8, background: "#23263a", color: "#e5e7eb" }} placeholder={step.type === "trigger" ? "Describe the trigger (e.g. 'Order placed')" : "Describe the action (e.g. 'Send Slack notification')"} />
              <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                <button onClick={() => handleStepChange(step.id, step.type === "trigger" ? "Auto-detected event with debounce" : "Send Slack + email with retry") } style={{ background: "#0ea5e9", color: "#0b1221", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>Suggest config</button>
                <button onClick={() => setStepStatuses(prev => ({ ...prev, [step.id]: "pending" }))} style={{ background: "#f59e0b", color: "#0b1221", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>Mark pending</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {error && <div style={{ color: "#fca5a5", marginBottom: 10 }}>{error}</div>}
      {result && (
        <div style={{ marginTop: 16, background: "#111827", border: "1px solid #1f2937", borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 4, color: "#e5e7eb" }}>Workflow Output:</div>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", color: "#cbd5f5" }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      {history.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Workflow History</div>
          <ul style={{ paddingLeft: 18 }}>
            {history.map((h, i) => (
              <li key={i} style={{ marginBottom: 10 }}>
                <div><b>Steps:</b> {h.steps.map(s => s.name).join(", ")}</div>
                <div><b>Result:</b> {JSON.stringify(h.result).slice(0, 120)}{JSON.stringify(h.result).length > 120 ? "..." : ""}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {diffSummary && (
        <div style={{ marginTop: 18, background: "#0b1221", border: "1px solid #1f2937", borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Changes since last build</div>
          <div style={{ color: "#9ca3af", fontSize: 13 }}>Added: {diffSummary.added.length} · Removed: {diffSummary.removed.length} · Edited: {diffSummary.changed.length}</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
            {diffSummary.added.length > 0 && <div style={{ color: "#22c55e", fontSize: 13 }}>+ {diffSummary.added.map(a => a.name).join(", ")}</div>}
            {diffSummary.removed.length > 0 && <div style={{ color: "#fca5a5", fontSize: 13 }}>- {diffSummary.removed.map(r => r.name).join(", ")}</div>}
            {diffSummary.changed.length > 0 && <div style={{ color: "#fbbf24", fontSize: 13 }}>~ {diffSummary.changed.map(c => c.name).join(", ")}</div>}
          </div>
        </div>
      )}
      <div style={{ marginTop: 18, background: "#0b1221", border: "1px solid #1f2937", borderRadius: 12, padding: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Execution summary</div>
          <div style={{ color: "#9ca3af", fontSize: 13 }}>Steps: {steps.length} · Triggers: {stepSummary.triggers} · Actions: {stepSummary.actions}</div>
          <div style={{ color: "#9ca3af", fontSize: 13 }}>Env: {env} · Approvals: {approvalRequired ? "On" : "Off"}</div>
        </div>
        <div style={{ minWidth: 220 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Quick tips</div>
          <div style={{ color: "#9ca3af", fontSize: 13 }}>Ctrl+S to save · Ctrl+Enter to build · Preflight to clear guardrails</div>
        </div>
      </div>
      <div style={{ marginTop: 32, fontSize: 13, color: "#a3e635", textAlign: "center" }}>
        <span>Best-in-class SaaS features. Feedback? <a href="mailto:support@aura-core.ai" style={{ color: "#a3e635", textDecoration: "underline" }}>Contact Support</a></span>
      </div>
    </div>
  );
}
