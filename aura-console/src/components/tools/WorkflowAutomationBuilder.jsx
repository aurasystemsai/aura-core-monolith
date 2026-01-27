
import React, { useState } from "react";
import BackButton from "./BackButton";

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
  const handleBuild = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/workflow-automation-builder/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps, env, versionTag, approvalRequired, approverEmail })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setResult(data.result);
      setHistory(prev => [{ steps, result: data.result, env, versionTag, approvalRequired }, ...prev].slice(0, 10));
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
      <BackButton />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ fontWeight: 800, fontSize: 32, margin: 0, color: "#a5f3fc" }}>Workflow Automation Builder</h2>
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
      <div style={{ marginTop: 32, fontSize: 13, color: "#a3e635", textAlign: "center" }}>
        <span>Best-in-class SaaS features. Feedback? <a href="mailto:support@aura-core.ai" style={{ color: "#a3e635", textDecoration: "underline" }}>Contact Support</a></span>
      </div>
    </div>
  );
}
