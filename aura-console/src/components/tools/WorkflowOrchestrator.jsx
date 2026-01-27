import React, { useState } from "react";
export default function WorkflowOrchestrator() {
  const [input, setInput] = useState("");
  const [bulkUpload, setBulkUpload] = useState(null);
  const [channels, setChannels] = useState({ automation: true, email: false, slack: false, webhook: false, crm: false });
  const [aiModel, setAiModel] = useState("gpt-4");
  const [response, setResponse] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  const [collaborators, setCollaborators] = useState("");
  const [accessLevel, setAccessLevel] = useState("writer");
  const [privacy, setPrivacy] = useState("private");
  const [compliance, setCompliance] = useState({ gdpr: true, ccpa: false });
  const [notification, setNotification] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [reportUrl, setReportUrl] = useState("");
  const [education, setEducation] = useState("");
  const [env, setEnv] = useState("dev");
  const [versionTag, setVersionTag] = useState("v1");
  const [approvalRequired, setApprovalRequired] = useState(true);
  const [approverEmail, setApproverEmail] = useState("");
  const [rateLimit, setRateLimit] = useState(1000);
  const [concurrency, setConcurrency] = useState(5);
  const [circuitBreaker, setCircuitBreaker] = useState({ enabled: true, errorRate: 0.2 });
  const [schemaJson, setSchemaJson] = useState("{\n  \"type\": \"object\",\n  \"properties\": {}\n}");
  const [testPayload, setTestPayload] = useState("{\n  \"event\": \"order_created\"\n}");
  const [simulationResult, setSimulationResult] = useState(null);
  const [validationIssues, setValidationIssues] = useState([]);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const issues = [];
    if (!input) issues.push("Workflow input is required");
    if (!approverEmail && approvalRequired) issues.push("Approver email required when approvals are enabled");
    if (rateLimit <= 0) issues.push("Rate limit must be positive");
    if (concurrency <= 0) issues.push("Concurrency must be positive");
    try { JSON.parse(schemaJson || "{}"); } catch { issues.push("Schema JSON is invalid"); }
    setValidationIssues(issues);
    return issues;
  };

  const handleRun = async () => {
    const issues = validate();
    if (issues.length) {
      setError("Fix validation issues before running.");
      return;
    }
    setError("");
    setResponse("");
    setAnalytics(null);
    setNotification("");
    setLoading(true);
    try {
      setNotification("Orchestrating in progress...");
      const res = await fetch("/api/workflow-orchestrator/ai/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow: input,
          bulkUpload,
          channels,
          aiModel,
          collaborators,
          accessLevel,
          privacy,
          compliance,
          education,
          env,
          versionTag,
          approvalRequired,
          approverEmail,
          rateLimit,
          concurrency,
          circuitBreaker,
          schema: schemaJson
        })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setResponse(data.orchestration || "No orchestration generated");
      setAnalytics(data.analytics || null);
      setNotification("Orchestration generated and saved.");
      setHistory(prev => [{
        workflow: input,
        bulkUpload,
        channels,
        aiModel,
        collaborators,
        accessLevel,
        privacy,
        compliance,
        education,
        env,
        versionTag,
        approvalRequired,
        approverEmail,
        rateLimit,
        concurrency,
        circuitBreaker,
        orchestration: data.orchestration || "No orchestration generated",
        analytics: data.analytics || null
      }, ...prev].slice(0, 10));
      setReportUrl(window.location.origin + window.location.pathname + "?orchestration=" + encodeURIComponent(data.orchestration || ""));
    } catch (err) {
      setError(err.message);
      setNotification("");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = () => {
    try {
      const payload = JSON.parse(testPayload || "{}");
      const schema = JSON.parse(schemaJson || "{}");
      // Lightweight schema presence check
      if (schema.type && typeof payload !== "object") throw new Error("Payload must be an object");
      setSimulationResult({ payload, branch: "simulated", actions: Object.keys(channels).filter(k => channels[k]) });
      setError("");
    } catch (err) {
      setError("Simulation failed: " + err.message);
      setSimulationResult(null);
    }
  };

  const handleExport = () => {
    if (!response) return;
    const blob = new Blob([response], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workflow-orchestration.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    if (!reportUrl) return;
    navigator.clipboard.writeText(reportUrl);
    setNotification("Share link copied!");
    setTimeout(() => setNotification("Orchestration generated and saved."), 2000);
  };

  const handleFeedback = async () => {
    if (!feedback) return;
    setNotification("Sending feedback...");
    try {
      await fetch("/api/workflow-orchestrator/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback })
      });
      setNotification("Feedback sent. Thank you!");
      setFeedback("");
    } catch {
      setNotification("Failed to send feedback");
    }
  };

  return (
    <div
      style={{
        margin: "40px auto",
        background: "#0f1115",
        color: "#e5e7eb",
        borderRadius: 16,
        boxShadow: "0 12px 48px #0007",
        padding: 32,
        fontFamily: "Inter, Arial, sans-serif",
        border: "1px solid #1f2937"
      }}
      aria-live="polite"
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <h2 style={{ fontWeight: 800, fontSize: 28, marginBottom: 12, color: "#a5f3fc" }}>Workflow Orchestrator</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select value={env} onChange={e => setEnv(e.target.value)} style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "8px 12px", fontWeight: 700 }}>
            <option value="dev">Dev</option>
            <option value="stage">Stage</option>
            <option value="prod">Prod</option>
          </select>
          <input value={versionTag} onChange={e => setVersionTag(e.target.value)} placeholder="Version tag" style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "8px 12px", minWidth: 120 }} />
          <label style={{ display: "flex", alignItems: "center", gap: 6, background: "#111827", border: "1px solid #1f2937", borderRadius: 10, padding: "6px 10px", fontWeight: 700 }}>
            <input type="checkbox" checked={approvalRequired} onChange={e => setApprovalRequired(e.target.checked)} /> Approvals
          </label>
          <input value={approverEmail} onChange={e => setApproverEmail(e.target.value)} placeholder="Approver email" style={{ background: "#111827", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "8px 12px", minWidth: 180 }} />
        </div>
      </div>
      <p style={{ color: "#9ca3af", marginBottom: 18 }}>
        Enter a workflow or process below. The AI will orchestrate and optimize it with guardrails, approvals, and validation.
      </p>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        rows={3}
        style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", marginBottom: 18, background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#f3f4f6" : "#23263a" }}
        placeholder="Type your workflow or process here..."
        aria-label="Workflow input"
      />
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontWeight: 600, marginRight: 12 }}>Bulk Upload:</label>
        <input type="file" accept=".csv,.xlsx" onChange={e => setBulkUpload(e.target.files[0])} style={{ marginLeft: 8 }} />
        <label style={{ fontWeight: 600, marginLeft: 18 }}>Channels:</label>
        {Object.keys(channels).map((ch, i) => (
          <label key={ch} style={{ marginLeft: i === 0 ? 0 : 12 }}><input type="checkbox" checked={channels[ch]} onChange={e => setChannels(c => ({ ...c, [ch]: e.target.checked }))} /> {ch.charAt(0).toUpperCase() + ch.slice(1)}</label>
        ))}
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontWeight: 600, marginRight: 12 }}>AI Model:</label>
        <select value={aiModel} onChange={e => setAiModel(e.target.value)} style={{ fontSize: 15, padding: 8, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc" }}>
          <option value="gpt-4">GPT-4</option>
          <option value="gemini">Gemini</option>
          <option value="custom">Custom</option>
        </select>
        <label style={{ fontWeight: 600, marginLeft: 18 }}>Collaborators:</label>
        <input type="text" value={collaborators} onChange={e => setCollaborators(e.target.value)} placeholder="Emails, comma separated" style={{ fontSize: 15, padding: 8, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc" }} />
        <label style={{ fontWeight: 600, marginLeft: 18 }}>Access Level:</label>
        <select value={accessLevel} onChange={e => setAccessLevel(e.target.value)} style={{ fontSize: 15, padding: 8, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", marginLeft: 8 }}>
          <option value="writer">Writer</option>
          <option value="editor">Editor</option>
          <option value="reviewer">Reviewer</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontWeight: 600, marginRight: 12 }}>Privacy:</label>
        <select value={privacy} onChange={e => setPrivacy(e.target.value)} style={{ fontSize: 15, padding: 8, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc" }}>
          <option value="private">Private</option>
          <option value="public">Public</option>
        </select>
        <label style={{ fontWeight: 600, marginLeft: 18 }}>Compliance:</label>
        <label><input type="checkbox" checked={compliance.gdpr} onChange={e => setCompliance(c => ({ ...c, gdpr: e.target.checked }))} /> GDPR</label>
        <label style={{ marginLeft: 12 }}><input type="checkbox" checked={compliance.ccpa} onChange={e => setCompliance(c => ({ ...c, ccpa: e.target.checked }))} /> CCPA</label>
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontWeight: 600, marginRight: 12 }}>Education:</label>
        <input type="text" value={education} onChange={e => setEducation(e.target.value)} placeholder="Workflow topic or question" style={{ fontSize: 15, padding: 8, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc" }} />
      </div>
      <button
        onClick={handleRun}
        disabled={loading || !input}
        style={{ background: "#22c55e", color: "#0b1221", border: "none", borderRadius: 10, padding: "12px 32px", fontWeight: 800, fontSize: 17, cursor: loading || !input ? "not-allowed" : "pointer", boxShadow: "0 2px 18px #22c55e55", marginRight: 12 }}
        aria-label="Run orchestration"
      >
        {loading ? "Running..." : "Orchestrate"}
      </button>
      <button
        onClick={handleExport}
        disabled={!response}
        style={{ background: "#0ea5e9", color: "#0b1221", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 800, fontSize: 15, cursor: response ? "pointer" : "not-allowed", marginRight: 12 }}
        aria-label="Export orchestration"
      >
        Export
      </button>
      <button
        onClick={handleShare}
        disabled={!reportUrl}
        style={{ background: "#bae6fd", color: "#23263a", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 600, fontSize: 15, cursor: reportUrl ? "pointer" : "not-allowed", marginRight: 12 }}
        aria-label="Share orchestration"
      >
        Share
      </button>
      <button
        onClick={() => setInput("")}
        style={{ background: "#fca5a5", color: "#23263a", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}
        aria-label="Reset"
      >
        Reset
      </button>
      {notification && (
        <div style={{ color: "#67e8f9", marginTop: 12, fontWeight: 700 }}>{notification}</div>
      )}
      {error && <div style={{ color: "#fca5a5", marginTop: 18 }}>{error}</div>}

      <div style={{ marginTop: 18, background: "#111827", borderRadius: 12, padding: 14, border: "1px solid #1f2937" }}>
        <div style={{ fontWeight: 700, marginBottom: 6, color: "#e5e7eb" }}>Guardrails</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <label style={{ color: "#9ca3af" }}>Rate limit
            <input type="number" value={rateLimit} onChange={e => setRateLimit(Number(e.target.value))} style={{ marginLeft: 6, background: "#0f172a", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 8px", width: 120 }} />/min
          </label>
          <label style={{ color: "#9ca3af" }}>Concurrency
            <input type="number" value={concurrency} onChange={e => setConcurrency(Number(e.target.value))} style={{ marginLeft: 6, background: "#0f172a", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 8px", width: 120 }} />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#9ca3af" }}>
            <input type="checkbox" checked={circuitBreaker.enabled} onChange={e => setCircuitBreaker(cb => ({ ...cb, enabled: e.target.checked }))} /> Circuit breaker
          </label>
          <label style={{ color: "#9ca3af" }}>Error rate
            <input type="number" step="0.05" value={circuitBreaker.errorRate} onChange={e => setCircuitBreaker(cb => ({ ...cb, errorRate: Number(e.target.value) }))} style={{ marginLeft: 6, background: "#0f172a", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 8px", width: 120 }} />
          </label>
        </div>
      </div>

      <div style={{ marginTop: 18, background: "#111827", borderRadius: 12, padding: 14, border: "1px solid #1f2937" }}>
        <div style={{ fontWeight: 700, marginBottom: 6, color: "#e5e7eb" }}>Data Contract</div>
        <textarea value={schemaJson} onChange={e => setSchemaJson(e.target.value)} rows={5} style={{ width: "100%", background: "#0f172a", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: 10 }} />
      </div>

      <div style={{ marginTop: 18, background: "#111827", borderRadius: 12, padding: 14, border: "1px solid #1f2937" }}>
        <div style={{ fontWeight: 700, marginBottom: 6, color: "#e5e7eb" }}>Simulation</div>
        <textarea value={testPayload} onChange={e => setTestPayload(e.target.value)} rows={4} style={{ width: "100%", background: "#0f172a", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: 10 }} />
        <button onClick={handleSimulate} style={{ marginTop: 8, background: "#22c55e", color: "#0b1221", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}>Run Simulation</button>
        {simulationResult && (
          <div style={{ marginTop: 8, color: "#a5f3fc" }}>Actions: {simulationResult.actions.join(", ")}</div>
        )}
      </div>

      <div style={{ marginTop: 18, background: "#111827", borderRadius: 12, padding: 14, border: "1px solid #1f2937" }}>
        <div style={{ fontWeight: 700, marginBottom: 6, color: "#e5e7eb" }}>Validation</div>
        {validationIssues.length === 0 ? (
          <div style={{ color: "#22c55e" }}>No blocking issues detected.</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18, color: "#fca5a5" }}>
            {validationIssues.map((v, i) => <li key={i}>{v}</li>)}
          </ul>
        )}
      </div>
      {analytics && (
        <div style={{ marginTop: 24, background: "#111827", borderRadius: 12, padding: 18, border: "1px solid #1f2937" }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: "#e5e7eb" }}>Analytics</div>
          <div style={{ fontSize: 15, color: "#cbd5f5", whiteSpace: "pre-wrap" }}>{JSON.stringify(analytics, null, 2)}</div>
        </div>
      )}
      {response && (
        <div style={{ marginTop: 32, background: "#111827", borderRadius: 12, padding: 24, border: "1px solid #1f2937" }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: "#e5e7eb" }}>Orchestration:</div>
          <div style={{ fontSize: 15, color: "#cbd5f5", whiteSpace: "pre-wrap" }}>{response}</div>
        </div>
      )}
      {history.length > 0 && (
        <div style={{ marginTop: 32, background: darkMode ? "#23263a" : "#f8fafc", borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Orchestration History</div>
          <ul style={{ paddingLeft: 18 }}>
            {history.map((h, i) => (
              <li key={i} style={{ marginBottom: 10 }}>
                <div><b>Workflow:</b> {h.workflow.slice(0, 60)}{h.workflow.length > 60 ? "..." : ""}</div>
                <div><b>Bulk Upload:</b> {h.bulkUpload ? h.bulkUpload.name : "-"}</div>
                <div><b>Channels:</b> {Object.keys(h.channels).filter(k => h.channels[k]).join(", ")}</div>
                <div><b>AI Model:</b> {h.aiModel}</div>
                <div><b>Collaborators:</b> {h.collaborators}</div>
                <div><b>Access Level:</b> {h.accessLevel}</div>
                <div><b>Privacy:</b> {h.privacy}</div>
                <div><b>Compliance:</b> {Object.keys(h.compliance).filter(k => h.compliance[k]).join(", ")}</div>
                <div><b>Education:</b> {h.education}</div>
                <div><b>Analytics:</b> {h.analytics ? JSON.stringify(h.analytics) : "-"}</div>
                <div><b>Orchestration:</b> {h.orchestration.slice(0, 60)}{h.orchestration.length > 60 ? "..." : ""}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <form
        onSubmit={e => { e.preventDefault(); handleFeedback(); }}
        style={{ marginTop: 32, background: darkMode ? "#23263a" : "#f8fafc", borderRadius: 12, padding: 20 }}
        aria-label="Send feedback"
      >
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Feedback</div>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          rows={2}
          style={{ width: "100%", fontSize: 15, padding: 10, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", marginBottom: 12, background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#f3f4f6" : "#23263a" }}
          placeholder="Share your feedback or suggestions..."
          aria-label="Feedback input"
        />
        <button
          type="submit"
          style={{ background: "#7fffd4", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}
        >
          Send Feedback
        </button>
      </form>
    </div>
  );
}
