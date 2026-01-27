
import React, { useEffect, useMemo, useState } from "react";
import BackButton from "./BackButton";

const STORAGE_KEY = "workflow-automation-builder:draft";
const PRESETS = [
  {
    id: "order-to-slack",
    name: "Order → Slack + Email",
    steps: [
      { id: 1, name: "Order Created", type: "trigger", config: "Shopify order created" },
      { id: 2, name: "Notify Slack", type: "action", config: "Send Slack message to #orders" },
      { id: 3, name: "Send Email", type: "action", config: "Email customer success with order summary" }
    ]
  },
  {
    id: "checkout-winback",
    name: "Checkout Winback",
    steps: [
      { id: 1, name: "Abandoned Checkout", type: "trigger", config: "Shopify checkout abandoned" },
      { id: 2, name: "Reminder Email", type: "action", config: "Send Klaviyo email with coupon" },
      { id: 3, name: "Reminder SMS", type: "action", config: "Send SMS nudge after 1 hour" }
    ]
  },
  {
    id: "post-purchase-feedback",
    name: "Post-purchase Feedback",
    steps: [
      { id: 1, name: "Order Fulfilled", type: "trigger", config: "Order fulfilled" },
      { id: 2, name: "Delay 3d", type: "action", config: "Wait 3 days" },
      { id: 3, name: "CSAT Survey", type: "action", config: "Send CSAT survey link" }
    ]
  }
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
  const [selectedPreset, setSelectedPreset] = useState("");

  const stepSummary = useMemo(() => {
    const triggers = steps.filter(s => s.type === "trigger").length;
    const actions = steps.filter(s => s.type === "action").length;
    return { triggers, actions };
  }, [steps]);

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
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    }, 450);
    return () => clearTimeout(handle);
  }, [steps, env, versionTag, approvalRequired, approverEmail, selectedStep, versions]);

  const goBackToSuite = () => {
    if (typeof window !== "undefined" && typeof window.__AURA_TO_SUITE === "function") {
      window.__AURA_TO_SUITE("workflows");
    }
  };

  const handleStepChange = (id, value) => {
    setSteps(steps.map(s => s.id === id ? { ...s, config: value } : s));
  };

  const handleAddStep = () => {
    const nextId = Math.max(...steps.map(s => s.id)) + 1;
    setSteps([...steps, { id: nextId, name: `Step ${nextId}`, type: "action", config: "" }]);
    setSelectedStep(nextId);
  };

  const handleRemoveStep = id => {
    if (steps.length <= 1) return;
    setSteps(steps.filter(s => s.id !== id));
    setSelectedStep(steps[0].id);
  };

  const runPreflight = (snapshot) => {
    const issues = [];
    const hasTrigger = snapshot.steps.some(s => s.type === "trigger");
    if (!hasTrigger) issues.push("At least one trigger is required.");
    if (snapshot.steps[0]?.type !== "trigger") issues.push("The first step should be a trigger.");
    snapshot.steps.forEach((s, idx) => {
      if (!s.name.trim()) issues.push(`Step ${idx + 1} is missing a name.`);
      if (!s.config.trim()) issues.push(`Step ${idx + 1} is missing configuration.`);
      if (!["trigger", "action"].includes(s.type)) issues.push(`Step ${idx + 1} has an invalid type.`);
    });
    if (snapshot.approvalRequired && !snapshot.approverEmail) {
      issues.push("Approver email is required when approvals are enabled.");
    }
    return issues;
  };

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
  }

  const handleCreateVersion = () => {
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
    setSteps(version.steps);
    setEnv(version.env);
    setApprovalRequired(version.approvalRequired);
    setApproverEmail(version.approverEmail || "");
    setVersionTag(version.label || versionTag);
    setSelectedStep(version.steps?.[0]?.id || 1);
  };

  const handleApplyPreset = (presetId) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    setSteps(preset.steps);
    setSelectedStep(preset.steps[0]?.id || 1);
    setSelectedPreset(presetId);
  };

  const handleBuild = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    const snapshot = { steps, env, versionTag, approvalRequired, approverEmail };
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
      setDraftStatus("saved");
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 12, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: 32, margin: 0, color: "#a5f3fc" }}>Workflow Automation Builder</h2>
          <div style={{ color: "#9ca3af", fontSize: 13, marginTop: 4 }}>Autosaves locally · Hotkeys: Ctrl+S save, Ctrl+Enter build</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <div style={{ background: "#111827", border: "1px solid #1f2937", padding: "8px 12px", borderRadius: 10, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: draftStatus === "saving" ? "#facc15" : "#22c55e" }}>{draftStatus === "saving" ? "Saving..." : "Saved"}</span>
          {lastSavedAt && <span style={{ color: "#9ca3af", fontWeight: 500 }}>· {formatTime(lastSavedAt)}</span>}
        </div>
        <button onClick={handleManualSave} style={{ background: "#0ea5e9", color: "#0b1221", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 800, cursor: "pointer" }}>Save draft</button>
        <button onClick={handleCreateVersion} style={{ background: "#a855f7", color: "#0b1221", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 800, cursor: "pointer" }}>Snapshot version</button>
        <button onClick={() => setPreflightIssues(runPreflight({ steps, env, versionTag, approvalRequired, approverEmail }))} style={{ background: "#f59e0b", color: "#0b1221", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 800, cursor: "pointer" }}>Preflight check</button>
        <button onClick={() => handleBuild()} disabled={loading} style={{ background: "#22c55e", color: "#0b1221", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 800, fontSize: 15, cursor: loading ? "not-allowed" : "pointer" }}>{loading ? "Building..." : "Build"}</button>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: 10, minWidth: 220 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Presets</div>
          <select value={selectedPreset} onChange={e => handleApplyPreset(e.target.value)} style={{ width: "100%", background: "#18181b", color: "#e5e7eb", border: "1px solid #23263a", borderRadius: 8, padding: 8, marginBottom: 8 }}>
            <option value="">Pick a preset...</option>
            {PRESETS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>Jump-start a workflow with a curated template.</div>
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
        <div style={{ minWidth: 220 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Workflow Steps</div>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {steps.map(step => (
              <li key={step.id} style={{ marginBottom: 8, background: selectedStep === step.id ? "#23263a" : "#18181b", borderRadius: 8, padding: 8, cursor: "pointer", border: selectedStep === step.id ? "2px solid #6366f1" : "1px solid #23263a" }} onClick={() => setSelectedStep(step.id)}>
                <b>{step.name}</b> <span style={{ color: "#a5f3fc", fontSize: 12 }}>({step.type})</span>
                {steps.length > 1 && <button onClick={e => { e.stopPropagation(); handleRemoveStep(step.id); }} style={{ float: "right", background: "none", color: "#fca5a5", border: "none", fontWeight: 700, cursor: "pointer" }}>✕</button>}
              </li>
            ))}
          </ul>
          <button onClick={handleAddStep} style={{ background: "#22c55e", color: "#0b1221", border: "none", borderRadius: 8, padding: "6px 14px", fontWeight: 800, cursor: "pointer", marginTop: 8 }}>+ Add Step</button>
        {error && <div style={{ color: "#fca5a5", marginBottom: 10 }}>{error}</div>}
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Step Configuration</div>
          {steps.map(step => step.id === selectedStep && (
            <div key={step.id}>
              <input value={step.name} onChange={e => setSteps(steps.map(s => s.id === step.id ? { ...s, name: e.target.value } : s))} style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, width: "100%", borderRadius: 6, border: "1px solid #23263a", padding: 8, background: "#18181b", color: "#e5e7eb" }} />
              <select value={step.type} onChange={e => setSteps(steps.map(s => s.id === step.id ? { ...s, type: e.target.value } : s))} style={{ marginBottom: 8, width: "100%", borderRadius: 6, border: "1px solid #23263a", padding: 8, background: "#18181b", color: "#e5e7eb" }}>
                <option value="trigger">Trigger</option>
                <option value="action">Action</option>
              </select>
              <textarea value={step.config} onChange={e => handleStepChange(step.id, e.target.value)} rows={4} style={{ width: "100%", borderRadius: 6, border: "1px solid #23263a", padding: 8, background: "#23263a", color: "#e5e7eb" }} placeholder={step.type === "trigger" ? "Describe the trigger (e.g. 'Order placed')" : "Describe the action (e.g. 'Send Slack notification')"} />
            </div>
          ))}
        </div>
      </div>
      <button onClick={handleBuild} disabled={loading} style={{ background: "#22c55e", color: "#0b1221", border: "none", borderRadius: 10, padding: "10px 22px", fontWeight: 800, fontSize: 16, cursor: loading ? "not-allowed" : "pointer", marginBottom: 12 }}>{loading ? "Building..." : "Build Workflow"}</button>
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
