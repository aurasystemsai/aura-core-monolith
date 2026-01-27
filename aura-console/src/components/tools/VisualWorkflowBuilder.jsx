import React, { useEffect, useMemo, useRef, useState } from "react";
import BackButton from "./BackButton";
import { apiFetch } from "../../api";

const STORAGE_KEY = "visual-workflow-builder:draft";

const PAYLOAD_PRESETS = [
  { id: "order-created", name: "Order Created", payload: { event: "order_created", amount: 180, customer: "jane@example.com" }, badge: "dev" },
  { id: "checkout-abandoned", name: "Abandoned Checkout", payload: { event: "checkout_abandoned", cart_value: 220, segment: "VIP" }, badge: "dev" },
  { id: "performance", name: "Perf Budget", payload: { event: "order_created", latencyMs: 620, path: "checkout" }, badge: "dev" }
];

export default function VisualWorkflowBuilder() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [canvas, setCanvas] = useState([]);
  const [templateGallery, setTemplateGallery] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const [analytics, setAnalytics] = useState([]);
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
  const [testRunning, setTestRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsSummary, setAnalyticsSummary] = useState({});
  const [schemaWarnings, setSchemaWarnings] = useState([]);
  const [canaryPercent, setCanaryPercent] = useState(0);
  const [shadowMode, setShadowMode] = useState(false);
  const [performanceBudgetMs, setPerformanceBudgetMs] = useState(0);
  const [history, setHistory] = useState([]);
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
  const fileInputRef = useRef();
  const hydratedRef = useRef(false);
  const dirtySkipRef = useRef(true);

  const isViewer = role === "viewer";

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
    if (approvalRequired && !approverEmail) issues.push("Approver email required when approvals are on.");
    if (env === "prod" && !confirmationNote.trim()) issues.push("Add a prod ship note/intent before promoting.");
    if (!workflowName.trim()) issues.push("Workflow name is required.");
    if (canaryPercent < 0 || canaryPercent > 100) issues.push("Canary percent must be between 0 and 100.");
    if (performanceBudgetMs && performanceBudgetMs < 0) issues.push("Performance budget must be positive.");
    if (!canvas.length) issues.push("Add at least one step to the canvas.");
    setPreflightIssues(issues);
    return issues;
  };

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

  // Onboarding content
  const onboardingContent = (
    <div style={{ padding: 24, background: '#232336', borderRadius: 12, marginBottom: 18, color: '#e5e7eb' }}>
      <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Visual Workflow Builder</h3>
      <ul style={{ margin: '16px 0 0 18px', color: '#334155', fontSize: 16 }}>
        <li>Drag-and-drop canvas for building automations</li>
        <li>Template gallery for common workflows</li>
        <li>Import/export workflows, analyze results</li>
        <li>Accessible, secure, and fully compliant</li>
      </ul>
      <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: '#23263a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Get Started</button>
    </div>
  );

  // Import/export
  const handleImport = e => {
    if (isViewer) return setError("View-only mode: request access to import.");
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      pushUndoSnapshot();
      setCanvas(JSON.parse(evt.target.result));
      setImported(file.name);
    };
    reader.readAsText(file);
  };
  const handleExport = () => {
    if (isViewer) return setError("View-only mode: request access to export.");
    const blob = new Blob([JSON.stringify(canvas, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
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
    setValidationIssues(issues);
    return issues;
  };

  const handleSimulate = () => {
    if (isViewer) return setError("View-only mode: request access to simulate.");
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
        setLastSimulatedSnapshot({ canvas, env, versionTag, ts: Date.now() });
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
    <div style={{ padding: 24, background: "#0f1115", color: "#e5e7eb", borderRadius: 16, border: "1px solid #1f2937", boxShadow: "0 12px 48px #0007" }}>
      <BackButton label="← Back to Suite" onClick={goBackToSuite} />
      {isViewer && (
        <div style={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 12, padding: 12, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 800, color: "#fcd34d" }}>View-only mode</div>
            <div style={{ color: "#9ca3af", fontSize: 13 }}>You can inspect workflows but need elevated access to edit, simulate, or promote.</div>
          </div>
          <button onClick={() => setAccessRequested(true)} disabled={accessRequested} style={{ background: accessRequested ? "#374151" : "#22c55e", color: "#0b1221", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: accessRequested ? "default" : "pointer" }}>
            {accessRequested ? "Request sent" : "Request edit access"}
          </button>
        </div>
      )}
      {showCommandPalette && (
        <div style={{ position: "fixed", inset: 0, background: "#0009", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20 }}>
          <div style={{ background: "#0b1221", border: "1px solid #1f2937", borderRadius: 14, padding: 16, width: "min(520px, 92vw)", boxShadow: "0 18px 60px #000" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 800, color: "#a5f3fc" }}>Command Palette</div>
              <button onClick={() => setShowCommandPalette(false)} style={{ background: "transparent", color: "#9ca3af", border: "none", cursor: "pointer", fontWeight: 700 }}>Esc</button>
            </div>
            {[{ label: "Save draft", action: handleManualSave, hotkey: "Ctrl+S", disabled: false }, { label: "Run preflight", action: runPreflight, hotkey: "Alt+P", disabled: false }, { label: "Simulate", action: handleSimulate, hotkey: "Ctrl+Enter", disabled: isViewer }, { label: "Undo", action: handleUndo, hotkey: "Ctrl+Z", disabled: !undoStack.length || isViewer }, { label: "Redo", action: handleRedo, hotkey: "Ctrl+Shift+Z", disabled: !redoStack.length || isViewer }].map(cmd => (
              <button key={cmd.label} disabled={cmd.disabled} onClick={() => { cmd.action(); setShowCommandPalette(false); }} style={{ width: "100%", textAlign: "left", background: cmd.disabled ? "#1f2937" : "#111827", color: cmd.disabled ? "#6b7280" : "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "10px 12px", marginBottom: 8, cursor: cmd.disabled ? "not-allowed" : "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{cmd.label}</span>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>{cmd.hotkey}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div style={{ position: "sticky", top: 0, zIndex: 4, display: "flex", flexWrap: "wrap", gap: 10, background: "#0f1115", paddingBottom: 10, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#111827", border: "1px solid #1f2937", borderRadius: 12, padding: "8px 12px" }}>
          <span style={{ color: "#9ca3af", fontWeight: 700 }}>Env</span>
          {["dev", "stage", "prod"].map(opt => (
            <button key={opt} onClick={() => handleDirectChange(setEnv)(opt)} disabled={isViewer} style={{ background: env === opt ? "#0ea5e9" : "#0b1221", color: env === opt ? "#0b1221" : "#e5e7eb", border: "1px solid #1f2937", borderRadius: 999, padding: "6px 12px", fontWeight: 800, cursor: isViewer ? "not-allowed" : "pointer", opacity: isViewer ? 0.7 : 1 }}>{opt.toUpperCase()}</button>
          ))}
          <span style={{ color: draftStatus === "saved" ? "#22c55e" : "#fbbf24", fontSize: 12 }}>{draftStatus === "saved" ? `Saved ${formatTime(lastSavedAt)}` : "Saving..."}</span>
          {dirtySinceSave && <span style={{ color: "#fbbf24", fontSize: 12 }}>· Unsaved changes</span>}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={runPreflight} disabled={isViewer} style={{ background: "#1e293b", color: "#fcd34d", border: "1px solid #334155", borderRadius: 12, padding: "10px 12px", fontWeight: 800, cursor: isViewer ? "not-allowed" : "pointer", opacity: isViewer ? 0.7 : 1 }}>🔍 Preflight (Alt+P)</button>
          <button onClick={handleSimulate} disabled={isViewer} style={{ background: "#22c55e", color: "#0f172a", border: "none", borderRadius: 12, padding: "10px 12px", fontWeight: 900, cursor: isViewer ? "not-allowed" : "pointer", opacity: isViewer ? 0.7 : 1 }}>▶️ Simulate (Ctrl+Enter)</button>
          <button onClick={handleSave} disabled={isViewer} style={{ background: "#0ea5e9", color: "#0b1221", border: "none", borderRadius: 12, padding: "10px 12px", fontWeight: 900, cursor: isViewer ? "not-allowed" : "pointer", opacity: isViewer ? 0.7 : 1 }}>{saving ? "Saving…" : "Save Draft"}</button>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 18, color: "#a5f3fc" }}>Visual Workflow Automation Builder</h2>
        <div style={{ color: "#9ca3af", fontSize: 13, maxWidth: 520 }}>Hotkeys: Ctrl+S save draft, Ctrl+Enter simulate, Alt+P preflight, Ctrl+Z / Ctrl+Shift+Z undo/redo, Ctrl+K command palette, T rename test.</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select value={currentId || ""} onChange={e => handleLoadWorkflow(e.target.value)} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "8px 12px", minWidth: 180 }}>
            <option value="">Load workflow…</option>
            {workflows.map(w => (
              <option key={w.id} value={w.id}>{w.name || "Untitled"} · {w.env}/{w.versionTag} · {w.status}</option>
            ))}
          </select>
          <button onClick={loadWorkflows} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Loading…' : 'Refresh'}</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <input value={workflowName} onChange={handleInputChange(setWorkflowName)} disabled={isViewer} placeholder="Workflow name" style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "8px 12px", minWidth: 200, opacity: isViewer ? 0.7 : 1 }} />
        <select value={env} onChange={handleInputChange(setEnv)} disabled={isViewer} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "8px 12px", fontWeight: 700, opacity: isViewer ? 0.7 : 1 }}>
          <option value="dev">Dev</option><option value="stage">Stage</option><option value="prod">Prod</option>
        </select>
        <input value={versionTag} onChange={handleInputChange(setVersionTag)} disabled={isViewer} placeholder="Version tag" style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "8px 12px", minWidth: 120, opacity: isViewer ? 0.7 : 1 }} />
        <label style={{ display: "flex", alignItems: "center", gap: 6, background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: "6px 10px", fontWeight: 700, opacity: isViewer ? 0.7 : 1 }}>
          <input type="checkbox" checked={approvalRequired} onChange={handleToggle(setApprovalRequired)} disabled={isViewer} /> Approvals
        </label>
        <input value={approverEmail} onChange={handleInputChange(setApproverEmail)} disabled={isViewer} placeholder="Approver email" style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "8px 12px", minWidth: 180, opacity: isViewer ? 0.7 : 1 }} />
        <div style={{ color: '#cbd5f5', fontWeight: 700 }}>Status: {status} {revision ? `· rev ${revision}` : ''}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, color: '#cbd5f5', fontSize: 14 }}>
          Canary rollout (% traffic)
          <input type="number" min={0} max={100} value={canaryPercent} onChange={handleInputChange(setCanaryPercent, Number)} disabled={isViewer} style={{ background: '#111827', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 10, padding: '6px 10px', minWidth: 120, opacity: isViewer ? 0.7 : 1 }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#111827', border: '1px solid #1f2937', borderRadius: 10, padding: '6px 10px', fontWeight: 700, opacity: isViewer ? 0.7 : 1 }}>
          <input type="checkbox" checked={shadowMode} onChange={handleToggle(setShadowMode)} disabled={isViewer} /> Shadow mode (observe only)
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, color: '#cbd5f5', fontSize: 14 }}>
          Performance budget (ms)
          <input type="number" value={performanceBudgetMs} onChange={handleInputChange(setPerformanceBudgetMs, Number)} disabled={isViewer} placeholder="e.g., 500" style={{ background: '#111827', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 10, padding: '6px 10px', minWidth: 140, opacity: isViewer ? 0.7 : 1 }} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button onClick={handleSave} disabled={isViewer} style={{ background: '#22c55e', color: '#0b1221', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 800, cursor: isViewer ? 'not-allowed' : 'pointer', opacity: isViewer ? 0.7 : 1 }}>{saving ? 'Saving…' : (currentId ? 'Save Draft' : 'Create Draft')}</button>
        <button onClick={handleApprove} disabled={isViewer} style={{ background: '#f59e0b', color: '#0b1221', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 800, cursor: isViewer ? 'not-allowed' : 'pointer', opacity: isViewer ? 0.7 : 1 }}>Approve</button>
        <button onClick={handlePromote} disabled={isViewer} style={{ background: '#3b82f6', color: '#e5e7eb', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 800, cursor: isViewer ? 'not-allowed' : 'pointer', opacity: isViewer ? 0.7 : 1 }}>Promote</button>
      </div>
      <button onClick={() => setShowOnboarding(v => !v)} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginBottom: 16 }}>{showOnboarding ? "Hide" : "Show"} Onboarding</button>
      {showOnboarding && onboardingContent}

      <div style={{ background: '#111827', borderRadius: 10, padding: 18, marginBottom: 18, color: '#e5e7eb', border: '1px solid #1f2937' }}>
        <b>Workflow Canvas:</b> Drag and drop steps, triggers, and actions here.
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'none', padding: 0, margin: 0, color: '#cbd5f5' }}>{JSON.stringify(canvas, null, 2)}</pre>
      </div>

      <div style={{ marginBottom: 12, background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: '#e5e7eb' }}>Template Gallery</div>
        <div style={{ fontSize: 15, color: '#cbd5f5' }}>
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
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, color: '#e5e7eb', marginBottom: 6 }}>Data Contract</div>
          <textarea value={schemaJson} onChange={handleInputChange(setSchemaJson)} disabled={isViewer} rows={5} style={{ width: '100%', background: '#0f172a', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 10, padding: 10, opacity: isViewer ? 0.7 : 1 }} />
          <button onClick={() => handleFormatJson('contract')} disabled={isViewer} style={{ marginTop: 8, background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700, cursor: isViewer ? 'not-allowed' : 'pointer', opacity: isViewer ? 0.7 : 1 }}>Format JSON</button>
        </div>
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, color: '#e5e7eb', marginBottom: 6 }}>Simulation</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            {PAYLOAD_PRESETS.map(p => (
              <button key={p.id} onClick={() => { if (isViewer) return; pushUndoSnapshot(); setSelectedPayloadPreset(p.id); setTestPayload(JSON.stringify(p.payload, null, 2)); }} disabled={isViewer} style={{ background: selectedPayloadPreset === p.id ? '#0ea5e9' : '#0b1221', color: selectedPayloadPreset === p.id ? '#0b1221' : '#e5e7eb', border: '1px solid #1f2937', borderRadius: 10, padding: '6px 10px', fontWeight: 700, cursor: isViewer ? 'not-allowed' : 'pointer', opacity: isViewer ? 0.7 : 1 }}>
                {p.name} <span style={{ marginLeft: 6, background: '#0ea5e91a', color: '#67e8f9', padding: '2px 6px', borderRadius: 999, fontSize: 12 }}>{p.badge}</span>
              </button>
            ))}
          </div>
          <textarea value={testPayload} onChange={handleInputChange(setTestPayload)} disabled={isViewer} rows={4} style={{ width: '100%', background: '#0f172a', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 10, padding: 10, opacity: isViewer ? 0.7 : 1 }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            <button onClick={handleSimulate} disabled={isViewer} style={{ background: '#22c55e', color: '#0b1221', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 800, cursor: isViewer ? 'not-allowed' : 'pointer', opacity: isViewer ? 0.7 : 1 }}>Run Simulation</button>
            <button onClick={() => handleFormatJson('payload')} disabled={isViewer} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 12px', fontWeight: 700, cursor: isViewer ? 'not-allowed' : 'pointer', opacity: isViewer ? 0.7 : 1 }}>Format JSON</button>
          </div>
          {simulation && (
            <div style={{ marginTop: 6, color: '#a5f3fc' }}>
              <div>Env: {simulation.env} · Version: {simulation.version}</div>
              <div>Actions: {simulation.actions.join(', ')}</div>
                {simulation.warnings?.length ? <div style={{ color: '#fbbf24' }}>Warnings: {simulation.warnings.join(', ')}</div> : null}
              {diffSummary && (
                <div style={{ color: '#9ca3af', marginTop: 6 }}>
                  <div style={{ color: '#e5e7eb', fontWeight: 700 }}>Changes since last simulation</div>
                  <div>Added: {diffSummary.added} · Removed: {diffSummary.removed} · Possible edits: {diffSummary.changed}</div>
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, color: '#e5e7eb', marginBottom: 6 }}>Test Cases</div>
          <input value={testName} onChange={handleInputChange(setTestName)} disabled={isViewer} placeholder="Test name" style={{ width: '100%', background: '#0f172a', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 10, padding: 10, marginBottom: 8, opacity: isViewer ? 0.7 : 1 }} />
          <textarea value={testCasePayload} onChange={handleInputChange(setTestCasePayload)} disabled={isViewer} rows={4} style={{ width: '100%', background: '#0f172a', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 10, padding: 10, marginBottom: 8, opacity: isViewer ? 0.7 : 1 }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={handleAddTestCase} disabled={isViewer} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 700, cursor: isViewer ? 'not-allowed' : 'pointer', opacity: isViewer ? 0.7 : 1 }}>Add Test</button>
            <button onClick={handleRunTests} disabled={isViewer} style={{ background: '#22c55e', color: '#0b1221', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 800, cursor: isViewer ? 'not-allowed' : 'pointer', opacity: isViewer ? 0.7 : 1 }}>{testRunning ? 'Running…' : 'Run Tests'}</button>
          </div>
          {testResults && testResults.length > 0 && (
            <ul style={{ marginTop: 10, paddingLeft: 18, color: '#cbd5f5' }}>
              {testResults.map(r => (
                <li key={r.id || r.name} style={{ color: r.passed ? '#22c55e' : '#fca5a5' }}>
                  {r.name || r.id}: {r.passed ? 'passed' : `failed (${(r.errors || []).join(', ')})`}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, color: '#e5e7eb', marginBottom: 6 }}>Validation</div>
          {validationIssues.length === 0 ? <div style={{ color: '#22c55e' }}>No blocking issues.</div> : (
            <ul style={{ margin: 0, paddingLeft: 18, color: '#fca5a5' }}>{validationIssues.map((v, i) => <li key={i}>{v}</li>)}</ul>
          )}
          {schemaWarnings.length ? <div style={{ marginTop: 6, color: '#fbbf24' }}>Schema warnings: {schemaWarnings.join(', ')}</div> : null}
          {preflightIssues.length ? (
            <div style={{ marginTop: 8, background: '#0b1221', border: '1px solid #1f2937', borderRadius: 10, padding: 10 }}>
              <div style={{ color: '#fcd34d', fontWeight: 800 }}>Preflight</div>
              <ul style={{ margin: 6, paddingLeft: 18, color: '#e5e7eb' }}>
                {preflightIssues.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          ) : null}
          {env === 'prod' && (
            <div style={{ marginTop: 8, background: '#0ea5e91a', border: '1px solid #0ea5e9', borderRadius: 10, padding: 10 }}>
              <div style={{ color: '#67e8f9', fontWeight: 800 }}>Prod note required</div>
              <input value={confirmationNote} onChange={handleInputChange(setConfirmationNote)} disabled={isViewer} placeholder="Who approved? What changed?" style={{ marginTop: 6, width: '100%', background: '#0f172a', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 8, padding: '8px 10px', opacity: isViewer ? 0.7 : 1 }} />
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

      <div style={{ marginBottom: 32, background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: '#e5e7eb' }}>Analytics</div>
        <div style={{ fontSize: 15, color: '#cbd5f5' }}>
          {analyticsLoading ? <span>Loading analytics…</span> : analytics.length ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 10 }}>
                {Object.entries(analyticsSummary).map(([k, v]) => (
                  <div key={k} style={{ background: '#0f172a', border: '1px solid #1f2937', borderRadius: 10, padding: 8 }}>
                    <div style={{ color: '#a5f3fc', fontWeight: 700 }}>{k}</div>
                    <div style={{ color: '#e5e7eb', fontSize: 22 }}>{v}</div>
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
        <div style={{ marginBottom: 24, background: '#0b1221', border: '1px solid #1f2937', borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: '#e5e7eb' }}>Revision history & comments</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            <div>
              <div style={{ color: '#cbd5f5', marginBottom: 6, fontWeight: 600 }}>History</div>
              {history.length ? (
                <ul style={{ margin: 0, paddingLeft: 16, color: '#cbd5f5' }}>
                  {history.slice().reverse().slice(0, 8).map((h, idx) => (
                    <li key={idx} style={{ marginBottom: 4 }}>rev {h.revision}: {h.changes || 'update'} · {new Date(h.ts).toLocaleString()}</li>
                  ))}
                </ul>
              ) : <div style={{ color: '#9ca3af' }}>No history yet.</div>}
            </div>
            <div>
              <div style={{ color: '#cbd5f5', marginBottom: 6, fontWeight: 600 }}>Comments</div>
              {comments.length ? (
                <ul style={{ margin: 0, paddingLeft: 16, color: '#cbd5f5' }}>
                  {comments.slice().reverse().slice(0, 8).map(c => (
                    <li key={c.id} style={{ marginBottom: 4 }}>{c.comment} · {new Date(c.ts).toLocaleString()}</li>
                  ))}
                </ul>
              ) : <div style={{ color: '#9ca3af' }}>No comments yet.</div>}
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Add comment" style={{ flex: 1, minWidth: 200, background: '#0f172a', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 10, padding: '8px 12px' }} />
                <button onClick={handleAddComment} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 12px', fontWeight: 700, cursor: 'pointer' }}>Comment</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={e => { e.preventDefault(); validate(); handleFeedback(); }} style={{ marginTop: 12, background: '#111827', borderRadius: 12, padding: 20, border: '1px solid #1f2937' }} aria-label="Send feedback">
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8, color: '#e5e7eb' }}>Feedback</div>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          rows={3}
          style={{ width: '100%', fontSize: 16, padding: 12, borderRadius: 10, border: '1px solid #1f2937', marginBottom: 12, background: '#0f172a', color: '#e5e7eb' }}
          placeholder="Share your feedback or suggestions..."
          aria-label="Feedback"
        />
        <button type="submit" style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 10, padding: '7px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Send Feedback</button>
        {error && <div style={{ color: '#ef4444', marginTop: 8 }}>{error}</div>}
      </form>
      <div style={{ marginTop: 16, fontSize: 13, color: '#9ca3af', textAlign: 'center' }}>
        <span>Accessibility: WCAG 2.1, keyboard navigation, color contrast. Feedback? <a href="mailto:support@aura-core.ai" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>Contact Support</a></span>
      </div>
    </div>
  );
}
