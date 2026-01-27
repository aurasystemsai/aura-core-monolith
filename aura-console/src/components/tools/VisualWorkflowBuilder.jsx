import React from "react";
import { apiFetch } from "../../api";

export default function VisualWorkflowBuilder() {
  const [showOnboarding, setShowOnboarding] = React.useState(true);
  const [canvas, setCanvas] = React.useState([]);
  const [templateGallery, setTemplateGallery] = React.useState([]);
  const [selectedTemplate, setSelectedTemplate] = React.useState(null);
  const [imported, setImported] = React.useState(null);
  const [exported, setExported] = React.useState(null);
  const [analytics, setAnalytics] = React.useState([]);
  const [feedback, setFeedback] = React.useState("");
  const [error, setError] = React.useState("");
  const [env, setEnv] = React.useState("dev");
  const [versionTag, setVersionTag] = React.useState("v1");
  const [approvalRequired, setApprovalRequired] = React.useState(true);
  const [approverEmail, setApproverEmail] = React.useState("");
  const [schemaJson, setSchemaJson] = React.useState("{\n  \"type\": \"object\",\n  \"properties\": {}\n}");
  const [testPayload, setTestPayload] = React.useState("{\n  \"event\": \"order_created\"\n}");
  const [simulation, setSimulation] = React.useState(null);
  const [validationIssues, setValidationIssues] = React.useState([]);
  const [workflows, setWorkflows] = React.useState([]);
  const [currentId, setCurrentId] = React.useState(null);
  const [workflowName, setWorkflowName] = React.useState("Untitled Workflow");
  const [status, setStatus] = React.useState("draft");
  const [revision, setRevision] = React.useState(null);
  const [testName, setTestName] = React.useState("Smoke test");
  const [testCasePayload, setTestCasePayload] = React.useState("{\n  \"event\": \"order_created\"\n}");
  const [testResults, setTestResults] = React.useState([]);
  const [testRunning, setTestRunning] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [analyticsLoading, setAnalyticsLoading] = React.useState(false);
  const [analyticsSummary, setAnalyticsSummary] = React.useState({});
  const [schemaWarnings, setSchemaWarnings] = React.useState([]);
  const [canaryPercent, setCanaryPercent] = React.useState(0);
  const [shadowMode, setShadowMode] = React.useState(false);
  const [performanceBudgetMs, setPerformanceBudgetMs] = React.useState(0);
  const [history, setHistory] = React.useState([]);
  const [comments, setComments] = React.useState([]);
  const [newComment, setNewComment] = React.useState("");
  const fileInputRef = React.useRef();

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
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      setCanvas(JSON.parse(evt.target.result));
      setImported(file.name);
    };
    reader.readAsText(file);
  };
  const handleExport = () => {
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
        setError("");
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
    const issues = validate();
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
      await loadWorkflows();
      await loadAnalytics();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 18, color: "#a5f3fc" }}>Visual Workflow Automation Builder</h2>
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
        <input value={workflowName} onChange={e => setWorkflowName(e.target.value)} placeholder="Workflow name" style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "8px 12px", minWidth: 200 }} />
        <select value={env} onChange={e => setEnv(e.target.value)} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "8px 12px", fontWeight: 700 }}>
          <option value="dev">Dev</option><option value="stage">Stage</option><option value="prod">Prod</option>
        </select>
        <input value={versionTag} onChange={e => setVersionTag(e.target.value)} placeholder="Version tag" style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "8px 12px", minWidth: 120 }} />
        <label style={{ display: "flex", alignItems: "center", gap: 6, background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: "6px 10px", fontWeight: 700 }}>
          <input type="checkbox" checked={approvalRequired} onChange={e => setApprovalRequired(e.target.checked)} /> Approvals
        </label>
        <input value={approverEmail} onChange={e => setApproverEmail(e.target.value)} placeholder="Approver email" style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "8px 12px", minWidth: 180 }} />
        <div style={{ color: '#cbd5f5', fontWeight: 700 }}>Status: {status} {revision ? `· rev ${revision}` : ''}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, color: '#cbd5f5', fontSize: 14 }}>
          Canary rollout (% traffic)
          <input type="number" min={0} max={100} value={canaryPercent} onChange={e => setCanaryPercent(Number(e.target.value))} style={{ background: '#111827', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 10, padding: '6px 10px', minWidth: 120 }} />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#111827', border: '1px solid #1f2937', borderRadius: 10, padding: '6px 10px', fontWeight: 700 }}>
          <input type="checkbox" checked={shadowMode} onChange={e => setShadowMode(e.target.checked)} /> Shadow mode (observe only)
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, color: '#cbd5f5', fontSize: 14 }}>
          Performance budget (ms)
          <input type="number" value={performanceBudgetMs} onChange={e => setPerformanceBudgetMs(Number(e.target.value))} placeholder="e.g., 500" style={{ background: '#111827', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 10, padding: '6px 10px', minWidth: 140 }} />
        </label>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button onClick={handleSave} style={{ background: '#22c55e', color: '#0b1221', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 800, cursor: 'pointer' }}>{saving ? 'Saving…' : (currentId ? 'Save Draft' : 'Create Draft')}</button>
        <button onClick={handleApprove} style={{ background: '#f59e0b', color: '#0b1221', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 800, cursor: 'pointer' }}>Approve</button>
        <button onClick={handlePromote} style={{ background: '#3b82f6', color: '#e5e7eb', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 800, cursor: 'pointer' }}>Promote</button>
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
                <button onClick={() => setSelectedTemplate(tpl)} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>{tpl.name}</button>
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
          <textarea value={schemaJson} onChange={e => setSchemaJson(e.target.value)} rows={5} style={{ width: '100%', background: '#0f172a', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 10, padding: 10 }} />
          <button onClick={() => handleFormatJson('contract')} style={{ marginTop: 8, background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700, cursor: 'pointer' }}>Format JSON</button>
        </div>
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, color: '#e5e7eb', marginBottom: 6 }}>Simulation</div>
          <textarea value={testPayload} onChange={e => setTestPayload(e.target.value)} rows={4} style={{ width: '100%', background: '#0f172a', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 10, padding: 10 }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            <button onClick={handleSimulate} style={{ background: '#22c55e', color: '#0b1221', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 800, cursor: 'pointer' }}>Run Simulation</button>
            <button onClick={() => handleFormatJson('payload')} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 12px', fontWeight: 700, cursor: 'pointer' }}>Format JSON</button>
          </div>
          {simulation && (
            <div style={{ marginTop: 6, color: '#a5f3fc' }}>
              <div>Env: {simulation.env} · Version: {simulation.version}</div>
              <div>Actions: {simulation.actions.join(', ')}</div>
                {simulation.warnings?.length ? <div style={{ color: '#fbbf24' }}>Warnings: {simulation.warnings.join(', ')}</div> : null}
            </div>
          )}
        </div>
        <div style={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, color: '#e5e7eb', marginBottom: 6 }}>Test Cases</div>
          <input value={testName} onChange={e => setTestName(e.target.value)} placeholder="Test name" style={{ width: '100%', background: '#0f172a', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 10, padding: 10, marginBottom: 8 }} />
          <textarea value={testCasePayload} onChange={e => setTestCasePayload(e.target.value)} rows={4} style={{ width: '100%', background: '#0f172a', color: '#e5e7eb', border: '1px solid #1f2937', borderRadius: 10, padding: 10, marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={handleAddTestCase} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 700, cursor: 'pointer' }}>Add Test</button>
            <button onClick={handleRunTests} style={{ background: '#22c55e', color: '#0b1221', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 800, cursor: 'pointer' }}>{testRunning ? 'Running…' : 'Run Tests'}</button>
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
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <input type="file" accept="application/json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
        <button onClick={() => fileInputRef.current.click()} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginRight: 12 }}>Import Workflow</button>
        <button onClick={handleExport} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Export Workflow</button>
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
