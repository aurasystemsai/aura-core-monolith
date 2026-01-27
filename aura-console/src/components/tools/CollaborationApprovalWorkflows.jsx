import React, { useState } from "react";

export default function CollaborationApprovalWorkflows() {
  const [workflow, setWorkflow] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  // Dark mode enforced, no toggle
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleBuild = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/collaboration-approval-workflows/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setResult(data.result);
      setHistory(prev => [{ workflow, result: data.result }, ...prev].slice(0, 10));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onboardingContent = (
    <div style={{ padding: 24, background: "#23263a", borderRadius: 12, marginBottom: 18 }}>
      <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Collaboration & Approval Workflows</h3>
      <ul style={{ margin: "16px 0 0 18px", color: "#a3e635", fontSize: 16 }}>
        <li>Design approval and collaboration workflows</li>
        <li>Integrate with Slack, email, and project tools</li>
        <li>Export, share, and review workflow history</li>
        <li>Accessible, secure, and fully compliant</li>
      </ul>
      <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: "#23263a", color: "#f3f4f6", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Get Started</button>
    </div>
  );

  // Flagship enhancements
  const [workflows, setWorkflows] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const [feedback, setFeedback] = useState("");
  const fileInputRef = React.useRef();

  // Fetch workflows
  const fetchWorkflows = async () => {
    try {
      const res = await fetch("/api/collaboration-approval-workflows/workflows");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setWorkflows(data.workflows || []);
    } catch (err) {
      setError(err.message);
    }
  };
  // Fetch approvals
  const fetchApprovals = async () => {
    try {
      const res = await fetch("/api/collaboration-approval-workflows/approvals");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setApprovals(data.approvals || []);
    } catch (err) {
      setError(err.message);
    }
  };

  // Import/Export
  const handleImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      setWorkflows(JSON.parse(evt.target.result));
      setImported(file.name);
    };
    reader.readAsText(file);
  };
  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ workflows, approvals }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // Feedback
  const handleFeedback = async () => {
    if (!feedback) return;
    setError("");
    try {
      await fetch("/api/collaboration-approval-workflows/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback })
      });
      setFeedback("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{
      
      margin: "40px auto",
      background: "#18181b",
      borderRadius: 18,
      boxShadow: "0 2px 24px #0002",
      padding: 36,
      color: "#a3e635",
      fontFamily: 'Inter, sans-serif',
      transition: "background 0.3s, color 0.3s"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ fontWeight: 800, fontSize: 32, margin: 0 }}>Collaboration & Approval Workflows</h2>
      </div>
      {showOnboarding && onboardingContent}
      <div style={{ marginBottom: 18 }}>
        <input
          value={workflow}
          onChange={e => setWorkflow(e.target.value)}
          style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: "1px solid #ccc", marginBottom: 12 }}
          placeholder="Describe your workflow or approval chain..."
          aria-label="Workflow input"
        />
        <button onClick={handleBuild} disabled={loading} style={{ background: "#6366f1", color: "#f3f4f6", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Build Workflow</button>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button onClick={fetchWorkflows} style={{ background: "#6366f1", color: "#f3f4f6", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Load Workflows</button>
        <button onClick={fetchApprovals} style={{ background: "#0ea5e9", color: "#f3f4f6", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginLeft: 12 }}>Load Approvals</button>
      </div>
      <div style={{ display: "flex", gap: 18, marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Workflows</div>
          <ul style={{ paddingLeft: 18 }}>
            {workflows.map((wf, idx) => (
              <li key={wf.id || idx} style={{ marginBottom: 8, background: "#232336", borderRadius: 8, padding: 8, color: '#e5e7eb' }}>{wf.name}</li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Approvals</div>
          <ul style={{ paddingLeft: 18 }}>
            {approvals.map((ap, idx) => (
              <li key={ap.id || idx} style={{ marginBottom: 8, background: "#18181b", borderRadius: 8, padding: 8, color: '#7fffd4' }}>{ap.name}</li>
            ))}
          </ul>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Import</button>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} aria-label="Import workflows" />
        <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#f3f4f6", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Export</button>
        {exported && <a href={exported} download="collaboration-workflows.json" style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 600 }}>Download</a>}
      </div>
      {imported && <div style={{ color: "#22c55e", marginBottom: 8 }}>Imported: {imported}</div>}
      {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
      <form onSubmit={e => { e.preventDefault(); handleFeedback(); }} style={{ marginTop: 32, background: "#232336", borderRadius: 12, padding: 20 }} aria-label="Send feedback">
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Feedback</div>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          rows={2}
          style={{ width: "100%", fontSize: 15, padding: 10, borderRadius: 8, border: "1px solid #555", marginBottom: 12, background: "#23263a", color: "#f3f4f6" }}
          placeholder="Share your feedback or suggestions..."
          aria-label="Feedback input"
        />
        <button type="submit" style={{ background: "#7fffd4", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Send Feedback</button>
      </form>
      {/* ...existing code... */}
      {result && (
        <div style={{ marginTop: 24, background: "#23263a", borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: 20 }}>Workflow Result</h3>
          <pre style={{ fontSize: 15, color: "#a3e635" }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      {history.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: 18 }}>History</h3>
          <ul style={{ paddingLeft: 18 }}>
            {history.map((h, idx) => (
              <li key={idx} style={{ marginBottom: 8, background: "#23263a", borderRadius: 8, padding: 8 }}>
                <b>Workflow:</b> {h.workflow} <br />
                <b>Result:</b> {JSON.stringify(h.result)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
