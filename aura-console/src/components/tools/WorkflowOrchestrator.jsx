import React, { useEffect, useMemo, useState } from "react";
import BackButton from "./BackButton";

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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [preflightIssues, setPreflightIssues] = useState([]);
  const [confirmationNote, setConfirmationNote] = useState("");
  const [testStatus, setTestStatus] = useState("idle"); // idle | running | passed
  const [stepStatuses, setStepStatuses] = useState({});
  const [payloadPreset, setPayloadPreset] = useState("abandoned-cart");
  const [lastRunSnapshot, setLastRunSnapshot] = useState(null);
  const [versionName, setVersionName] = useState("v1");
  const [versions, setVersions] = useState([]);

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

  const payloadPresets = [
    { id: "abandoned-cart", name: "Abandoned Cart", payload: { customer: "jane@example.com", subtotal: 120 } },
    { id: "seo-issue", name: "SEO Issue", payload: { url: "/product/slug", issue: "404 detected" } },
    { id: "high-aov", name: "High AOV", payload: { customer: "vip@example.com", subtotal: 820 } }
  ];

  const handleStepChange = (id, changes) => {
    setSteps(steps.map(s => s.id === id ? { ...s, ...changes } : s));
  };

  const runPreflight = () => {
    const issues = [];
    if (!workflowName.trim()) issues.push("Workflow name required.");
    if (!steps.some(s => s.type === "trigger")) issues.push("At least one trigger is required.");
    if (steps[0]?.type !== "trigger") issues.push("First step should be a trigger.");
    if (approvalRequired && !approverEmail) issues.push("Approver email required for approvals.");
    if (env === "prod" && (riskLevel === "high" || approvalRequired) && !confirmationNote.trim()) issues.push("Prod/high risk requires confirmation note.");
    steps.forEach((s, idx) => {
      if (!s.name.trim()) issues.push(`Step ${idx + 1} missing name.`);
      if (!s.config.trim()) issues.push(`Step ${idx + 1} missing config.`);
    });
    setPreflightIssues(issues);
    return issues;
  };

  const handleAddStep = (template = null, type = "action") => {
    const nextId = (Math.max(...steps.map(s => s.id)) || 0) + 1;
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
    const nextSteps = steps.filter(s => s.id !== id);
    setSteps(nextSteps);
    setSelectedStep(nextSteps[0]?.id || null);
  };

  const handleCloneStep = () => {
    const current = steps.find(s => s.id === selectedStep);
    if (!current) return;
    const nextId = (Math.max(...steps.map(s => s.id)) || 0) + 1;
    const clone = { ...current, id: nextId, name: `${current.name} Copy` };
    const idx = steps.findIndex(s => s.id === selectedStep);
    const next = [...steps.slice(0, idx + 1), clone, ...steps.slice(idx + 1)];
    setSteps(next);
    setSelectedStep(nextId);
  };

  const handleReorder = (id, direction) => {
    const idx = steps.findIndex(s => s.id === id);
    if (idx === -1) return;
    const swapWith = direction === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= steps.length) return;
    const next = [...steps];
    [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
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
      ]
    };
    const chosen = presets[playbook];
    if (chosen) {
      setSteps(chosen);
      setSelectedStep(chosen[0].id);
    }
  };

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
    steps
  }), [workflowName, objective, env, versionTag, tags, approvalRequired, approverEmail, riskLevel, owner, steps]);

  const validate = () => {
    if (!workflowName.trim()) return "Give this workflow a name.";
    if (!steps.some(s => s.type === "trigger")) return "At least one trigger is required.";
    if (approvalRequired && !approverEmail) return "Approver email is required when approvals are on.";
    return null;
  };

  const handleOrchestrate = async () => {
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
        workflowName
      }, ...prev].slice(0, 10));
      setLastRunSnapshot({ steps, env, versionTag, approvalRequired, riskLevel, confirmationNote, at: Date.now() });
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
      <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: "#23263a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Got it</button>
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

  const handleTestDev = () => {
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

  const handleSnapshotVersion = () => {
    const label = versionName || `v${versions.length + 1}`;
    setVersions(prev => [{ label, steps, env, approvalRequired, createdAt: Date.now() }, ...prev].slice(0, 6));
  };

  useEffect(() => {
    const listener = e => {
      if (e.ctrlKey && e.key === "s") { e.preventDefault(); runPreflight(); }
      if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); handleOrchestrate(); }
      if (!e.ctrlKey && !e.metaKey && e.key === "c") { e.preventDefault(); handleCloneStep(); }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  });

  return (
    <div style={{ background: "#0f1115", color: "#e5e7eb", padding: 24, borderRadius: 16, border: "1px solid #1f2937", boxShadow: "0 12px 48px #0007" }}>
      <BackButton />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 32, margin: 0, color: "#a5f3fc" }}>Workflow Orchestrator</h2>
          <div style={{ color: "#9ca3af", marginTop: 4 }}>Plan, run, and approve orchestrations before shipping. Hotkeys: Ctrl+S preflight, Ctrl+Enter run, c clone.</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <select value={env} onChange={e => setEnv(e.target.value)} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "8px 12px", fontWeight: 700 }}>
            <option value="dev">Dev</option><option value="stage">Stage</option><option value="prod">Prod</option>
          </select>
          <input value={versionTag} onChange={e => setVersionTag(e.target.value)} placeholder="Version tag" style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "8px 12px", minWidth: 120 }} />
          <label style={{ display: "flex", alignItems: "center", gap: 6, background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: "6px 10px", fontWeight: 700 }}>
            <input type="checkbox" checked={approvalRequired} onChange={e => setApprovalRequired(e.target.checked)} /> Approvals
          </label>
          <input value={approverEmail} onChange={e => setApproverEmail(e.target.value)} placeholder="Approver email" style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "8px 12px", minWidth: 180 }} />
        </div>
      </div>

      {(env === "prod" || riskLevel === "high") && (
        <div style={{ marginBottom: 8, background: "#1f2937", border: "1px solid #374151", borderRadius: 10, padding: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ color: "#fbbf24", fontWeight: 700 }}>Prod / high-risk confirmation</div>
          <input value={confirmationNote} onChange={e => setConfirmationNote(e.target.value)} placeholder="Add a confirmation note" style={{ flex: 1, minWidth: 220, background: "#0b1221", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "8px 12px" }} />
        </div>
      )}

      <div style={{ position: "sticky", top: 0, zIndex: 2, background: "#0f1115", paddingBottom: 6, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
          <button onClick={() => setPreflightIssues(runPreflight())} style={{ background: "#f59e0b", color: "#0b1221", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 800, cursor: "pointer" }}>Preflight</button>
          <button onClick={handleCloneStep} style={{ background: "#a855f7", color: "#0b1221", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 800, cursor: "pointer" }}>Clone step</button>
          <input value={versionName} onChange={e => setVersionName(e.target.value)} placeholder="Version name" style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "8px 12px", minWidth: 140 }} />
          <button onClick={handleSnapshotVersion} style={{ background: "#8b5cf6", color: "#0b1221", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 800, cursor: "pointer" }}>Snapshot</button>
          <select value={payloadPreset} onChange={e => setPayloadPreset(e.target.value)} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "8px 12px" }}>
            {payloadPresets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={handleTestDev} style={{ background: "#22c55e", color: "#0b1221", border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 800, cursor: "pointer" }}>{testStatus === "running" ? "Testing..." : "Test in dev"}</button>
          <button onClick={handleOrchestrate} disabled={loading} style={{ background: "#22c55e", color: "#0b1221", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer" }}>{loading ? "Orchestrating..." : "Orchestrate"}</button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 999, padding: "6px 10px", color: steps.some(s => s.type === "trigger") ? "#22c55e" : "#f97316", fontWeight: 700 }}>Trigger {steps.some(s => s.type === "trigger") ? "OK" : "Missing"}</span>
          <span style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 999, padding: "6px 10px", color: approvalRequired && !approverEmail ? "#f97316" : "#22c55e", fontWeight: 700 }}>Approvals {approvalRequired ? (approverEmail ? "Ready" : "Need email") : "Off"}</span>
          <span style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 999, padding: "6px 10px", color: riskLevel === "high" ? "#f87171" : riskLevel === "medium" ? "#fbbf24" : "#22c55e", fontWeight: 700 }}>Risk {riskLevel}</span>
          {env === "prod" && <span style={{ background: "#7c2d12", border: "1px solid #b45309", borderRadius: 999, padding: "6px 10px", color: confirmationNote ? "#facc15" : "#fca5a5", fontWeight: 700 }}>Prod note {confirmationNote ? "ready" : "required"}</span>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, alignItems: "start", marginBottom: 14 }}>
        <div style={{ display: "grid", gap: 8 }}>
          <input value={workflowName} onChange={e => setWorkflowName(e.target.value)} placeholder="Workflow name" style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "10px 12px", fontWeight: 700 }} />
          <textarea value={objective} onChange={e => setObjective(e.target.value)} placeholder="Objective / desired outcome" rows={2} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "10px 12px" }} />
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags (comma separated)" style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "10px 12px" }} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select value={riskLevel} onChange={e => setRiskLevel(e.target.value)} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "10px 12px", fontWeight: 700 }}>
              <option value="low">Low risk</option><option value="medium">Medium risk</option><option value="high">High risk</option>
            </select>
            <input value={owner} onChange={e => setOwner(e.target.value)} placeholder="Workflow owner" style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "10px 12px", flex: 1 }} />
          </div>
        </div>
      </div>

      <button onClick={() => setShowOnboarding(v => !v)} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginBottom: 16 }}>{showOnboarding ? "Hide" : "Show"} Quick Guide</button>
      {showOnboarding && onboardingContent}

      <div style={{ display: "flex", gap: 18, marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ minWidth: 240 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Workflow Steps</div>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {steps.map(step => (
              <li key={step.id} style={{ marginBottom: 8, background: selectedStep === step.id ? "#23263a" : "#18181b", borderRadius: 8, padding: 10, cursor: "pointer", border: selectedStep === step.id ? "2px solid #6366f1" : "1px solid #23263a", display: "flex", alignItems: "center", gap: 8 }} onClick={() => setSelectedStep(step.id)}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{step.name}</div>
                  <div style={{ color: "#a5f3fc", fontSize: 12 }}>({step.type})</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={e => { e.stopPropagation(); handleReorder(step.id, "up"); }} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #23263a", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>↑</button>
                  <button onClick={e => { e.stopPropagation(); handleReorder(step.id, "down"); }} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #23263a", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>↓</button>
                  {steps.length > 1 && <button onClick={e => { e.stopPropagation(); handleRemoveStep(step.id); }} style={{ background: "#111827", color: "#fca5a5", border: "1px solid #23263a", borderRadius: 6, padding: "4px 8px", cursor: "pointer" }}>✕</button>}
                </div>
              </li>
            ))}
          </ul>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => handleAddStep(null, "trigger")} style={{ background: "#22c55e", color: "#0b1221", border: "none", borderRadius: 8, padding: "6px 14px", fontWeight: 800, cursor: "pointer", marginTop: 4 }}>+ Add Trigger</button>
            <button onClick={() => handleAddStep()} style={{ background: "#10b981", color: "#0b1221", border: "none", borderRadius: 8, padding: "6px 14px", fontWeight: 800, cursor: "pointer", marginTop: 4 }}>+ Add Action</button>
          </div>
          <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
            <div style={{ color: "#9ca3af", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.4 }}>Playbooks</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button onClick={() => applyPlaybook("seoFix")} style={{ background: "#1f2937", color: "#a5f3fc", border: "1px solid #273449", borderRadius: 999, padding: "6px 12px", cursor: "pointer" }}>SEO Fix Queue</button>
              <button onClick={() => applyPlaybook("productSync")} style={{ background: "#1f2937", color: "#a5f3fc", border: "1px solid #273449", borderRadius: 999, padding: "6px 12px", cursor: "pointer" }}>Product Sync</button>
              <button onClick={() => applyPlaybook("winback")} style={{ background: "#1f2937", color: "#a5f3fc", border: "1px solid #273449", borderRadius: 999, padding: "6px 12px", cursor: "pointer" }}>Winback</button>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Step Configuration</div>
          {steps.map(step => step.id === selectedStep && (
            <div key={step.id}>
              <input value={step.name} onChange={e => handleStepChange(step.id, { name: e.target.value })} style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, width: "100%", borderRadius: 6, border: "1px solid #23263a", padding: 8, background: "#18181b", color: "#e5e7eb" }} />
              <select value={step.type} onChange={e => handleStepChange(step.id, { type: e.target.value })} style={{ marginBottom: 8, width: "100%", borderRadius: 6, border: "1px solid #23263a", padding: 8, background: "#18181b", color: "#e5e7eb" }}>
                <option value="trigger">Trigger</option>
                <option value="action">Action</option>
                <option value="condition">Condition</option>
              </select>
              <textarea value={step.config} onChange={e => handleStepChange(step.id, { config: e.target.value })} rows={5} style={{ width: "100%", borderRadius: 6, border: "1px solid #23263a", padding: 10, background: "#23263a", color: "#e5e7eb" }} placeholder={step.type === "trigger" ? "Describe the trigger (e.g. 'Order placed with AOV > $50')" : "Describe the action (e.g. 'Send Slack notification to #ops')"} />
              <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {step.type === "trigger" && triggerTemplates.map(t => (
                  <button key={t.label} onClick={() => handleStepChange(step.id, { config: t.config, name: t.label })} style={{ background: "#111827", color: "#a5f3fc", border: "1px solid #273449", borderRadius: 999, padding: "6px 10px", cursor: "pointer" }}>{t.label}</button>
                ))}
                {step.type !== "trigger" && actionTemplates.map(t => (
                  <button key={t.label} onClick={() => handleStepChange(step.id, { config: t.config, name: t.label })} style={{ background: "#111827", color: "#a5f3fc", border: "1px solid #273449", borderRadius: 999, padding: "6px 10px", cursor: "pointer" }}>{t.label}</button>
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
            <div style={{ marginTop: 8, background: "#111827", border: "1px solid #1f2937", borderRadius: 12, padding: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 4, color: "#e5e7eb" }}>Orchestration Output:</div>
              <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", color: "#cbd5f5", margin: 0 }}>{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
          {diffSummary && (
            <div style={{ marginTop: 12, background: "#0b1221", border: "1px solid #1f2937", borderRadius: 12, padding: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Changes since last run</div>
              <div style={{ color: "#9ca3af", fontSize: 13 }}>Added: {diffSummary.added.length} · Removed: {diffSummary.removed.length} · Edited: {diffSummary.changed.length}</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
                {diffSummary.added.length > 0 && <span style={{ color: "#22c55e", fontSize: 13 }}>+ {diffSummary.added.map(a => a.name).join(", ")}</span>}
                {diffSummary.removed.length > 0 && <span style={{ color: "#fca5a5", fontSize: 13 }}>- {diffSummary.removed.map(r => r.name).join(", ")}</span>}
                {diffSummary.changed.length > 0 && <span style={{ color: "#fbbf24", fontSize: 13 }}>~ {diffSummary.changed.map(c => c.name).join(", ")}</span>}
              </div>
            </div>
          )}
        </div>
        <div style={{ background: "#0b0f16", border: "1px solid #1f2937", borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Preview Payload</div>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", color: "#cbd5f5", margin: 0, maxHeight: 260, overflow: "auto" }}>{JSON.stringify(previewPayload, null, 2)}</pre>
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
                <div style={{ color: "#9ca3af", fontSize: 12 }}>{h.at ? new Date(h.at).toLocaleString() : ""}</div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginTop: 24, fontSize: 13, color: "#a5f3fc", textAlign: "center" }}>
        <span>Need more? Ping <a href="mailto:support@aura-core.ai" style={{ color: "#a5f3fc", textDecoration: "underline" }}>support@aura-core.ai</a> with your dream flow.</span>
      </div>
    </div>
  );
}
