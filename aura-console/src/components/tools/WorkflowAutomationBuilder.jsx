import React, { useState } from "react";
import BackButton from "./BackButton";

export default function WorkflowAutomationBuilder() {
  const [workflow, setWorkflow] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [schemaJson, setSchemaJson] = useState("{\n  \"type\": \"object\",\n  \"properties\": {}\n}");
  const [testPayload, setTestPayload] = useState("{\n  \"event\": \"order_created\"\n}");
  const [simulation, setSimulation] = useState(null);
  const [validationIssues, setValidationIssues] = useState([]);
  const [env, setEnv] = useState("dev");
  const [versionTag, setVersionTag] = useState("v1");
  const [approvalRequired, setApprovalRequired] = useState(true);
  const [approverEmail, setApproverEmail] = useState("");

  const validate = () => {
    const issues = [];
    if (!workflow) issues.push("Workflow description is required");
    if (approvalRequired && !approverEmail) issues.push("Approver email required when approvals are on");
    try { JSON.parse(schemaJson || "{}"); } catch { issues.push("Schema JSON invalid"); }
    setValidationIssues(issues);
    return issues;
  };

  const handleBuild = async () => {
    const issues = validate();
    if (issues.length) {
      setError("Fix validation issues before building.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/workflow-automation-builder/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow, env, versionTag, approvalRequired, approverEmail, schema: schemaJson })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setResult(data.result);
      setHistory(prev => [{ workflow, result: data.result, env, versionTag, approvalRequired }, ...prev].slice(0, 10));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = () => {
    try {
      const payload = JSON.parse(testPayload || "{}");
      const schema = JSON.parse(schemaJson || "{}");
      if (schema.type && typeof payload !== "object") throw new Error("Payload must be an object");
      setSimulation({ payload, actions: ["evaluate", "notify"], env });
      setError("");
    } catch (err) {
      setError("Simulation failed: " + err.message);
      setSimulation(null);
    }
  };

  const onboardingContent = (
    <div>
      <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Workflow Automation Builder</h3>
      <ul style={{ margin: "16px 0 0 18px", color: darkMode ? "#a3e635" : "#334155", fontSize: 16 }}>
        <li>Visually design and automate workflows</li>
        <li>Integrate with Shopify, email, Slack, and more</li>
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
      <div style={{ marginBottom: 10, color: "#9ca3af", fontWeight: 600 }}>
        <span role="img" aria-label="robot">🤖</span> Design, validate, and simulate workflows with approvals and contracts.
      </div>
      <button onClick={() => setShowOnboarding(true)} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginBottom: 16 }}>{showOnboarding ? "Hide" : "Show"} Onboarding</button>
      {showOnboarding && onboardingContent}
      <textarea
        value={workflow}
        onChange={e => setWorkflow(e.target.value)}
        rows={5}
        style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 10, border: "1px solid #1f2937", marginBottom: 12, background: "#111827", color: "#e5e7eb" }}
        placeholder="Describe your workflow (e.g. 'When order is placed, send Slack notification and email customer')..."
        aria-label="Workflow input"
      />
      <button onClick={handleBuild} disabled={loading || !workflow} style={{ background: "#22c55e", color: "#0b1221", border: "none", borderRadius: 10, padding: "10px 22px", fontWeight: 800, fontSize: 16, cursor: loading || !workflow ? "not-allowed" : "pointer", marginBottom: 12 }}>{loading ? "Building..." : "Build Workflow"}</button>
      {error && <div style={{ color: "#fca5a5", marginBottom: 10 }}>{error}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, color: "#e5e7eb", marginBottom: 6 }}>Data Contract</div>
          <textarea value={schemaJson} onChange={e => setSchemaJson(e.target.value)} rows={5} style={{ width: "100%", background: "#0f172a", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: 10 }} />
        </div>
        <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, color: "#e5e7eb", marginBottom: 6 }}>Simulation</div>
          <textarea value={testPayload} onChange={e => setTestPayload(e.target.value)} rows={4} style={{ width: "100%", background: "#0f172a", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: 10 }} />
          <button onClick={handleSimulate} style={{ marginTop: 8, background: "#6366f1", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontWeight: 800, cursor: "pointer" }}>Run Simulation</button>
          {simulation && <div style={{ marginTop: 6, color: "#a5f3fc" }}>Simulated actions: {simulation.actions.join(", ")}</div>}
        </div>
        <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, color: "#e5e7eb", marginBottom: 6 }}>Validation</div>
          {validationIssues.length === 0 ? <div style={{ color: "#22c55e" }}>No blocking issues.</div> : (
            <ul style={{ margin: 0, paddingLeft: 18, color: "#fca5a5" }}>{validationIssues.map((v, i) => <li key={i}>{v}</li>)}</ul>
          )}
        </div>
      </div>
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
                <div><b>Workflow:</b> {h.workflow}</div>
                <div><b>Result:</b> {JSON.stringify(h.result).slice(0, 120)}{JSON.stringify(h.result).length > 120 ? "..." : ""}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div style={{ marginTop: 32, fontSize: 13, color: darkMode ? "#a3e635" : "#64748b", textAlign: "center" }}>
        <span>Best-in-class SaaS features. Feedback? <a href="mailto:support@aura-core.ai" style={{ color: darkMode ? "#a3e635" : "#0ea5e9", textDecoration: "underline" }}>Contact Support</a></span>
      </div>
    </div>
  );
}
