import React, { useState, useRef } from "react";
import { apiFetch } from "../../api";

export default function ConditionalLogicAutomation() {
  const [logicBlocks, setLogicBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [triggers, setTriggers] = useState([]);
  const [error, setError] = useState("");
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const [feedback, setFeedback] = useState("");
  const fileInputRef = useRef();

  // Fetch logic blocks
  const fetchLogicBlocks = async () => {
    try {
      const res = await apiFetch("/api/conditional-logic-automation/logic-blocks");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setLogicBlocks(data.logicBlocks || []);
    } catch (err) {
      setError(err.message);
    }
  };
  // Fetch workflows
  const fetchWorkflows = async () => {
    try {
      const res = await apiFetch("/api/conditional-logic-automation/workflows");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setWorkflows(data.workflows || []);
    } catch (err) {
      setError(err.message);
    }
  };
  // Fetch triggers
  const fetchTriggers = async () => {
    try {
      const res = await apiFetch("/api/conditional-logic-automation/triggers");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setTriggers(data.triggers || []);
    } catch (err) {
      setError(err.message);
    }
  };

  // Add logic block to workflow
  const handleAddBlock = () => {
    if (!selectedBlock) return;
    setWorkflows([...workflows, { ...selectedBlock, id: Date.now() }]);
  };

  // Import/Export workflows
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
    const blob = new Blob([JSON.stringify(workflows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // Feedback
  const handleFeedback = async () => {
    if (!feedback) return;
    setError("");
    try {
      await apiFetch("/api/conditional-logic-automation/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback })
      });
      setFeedback("");
    } catch (err) {
      setError(err.message);
    }
  };

  // Select logic block (simplified)
  const handleSelectBlock = (idx) => {
    setSelectedBlock(logicBlocks[idx]);
  };

  return (
    <div style={{ background: "#18181b", borderRadius: 18, boxShadow: "0 2px 24px #0008", padding: 36, fontFamily: 'Inter, sans-serif', color: '#e5e7eb' }}>
      <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 18, color: '#7fffd4' }}>Conditional Logic & Branching</h2>
      <div style={{ color: "#6366f1", fontWeight: 600, marginBottom: 18 }}>
        <span role="img" aria-label="logic">🔀</span> Add conditional logic and branching to your automations.
      </div>
      <div style={{ marginBottom: 18 }}>
        <button onClick={fetchLogicBlocks} style={{ background: "#232336", color: "#7fffd4", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Load Logic Blocks</button>
        <button onClick={fetchWorkflows} style={{ background: "#232336", color: "#0ea5e9", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginLeft: 12 }}>Load Workflows</button>
        <button onClick={fetchTriggers} style={{ background: "#232336", color: "#22c55e", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginLeft: 12 }}>Load Triggers</button>
      </div>
      <div style={{ display: "flex", gap: 18, marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Logic Blocks</div>
          <ul style={{ paddingLeft: 18 }}>
            {logicBlocks.map((b, idx) => (
              <li key={b.id || idx} onClick={() => handleSelectBlock(idx)} style={{ marginBottom: 8, background: "#232336", borderRadius: 8, padding: 8, cursor: "pointer", color: '#e5e7eb' }}>{b.name}</li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 2 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Workflows</div>
          <ul style={{ paddingLeft: 18 }}>
            {workflows.map((w, idx) => (
              <li key={w.id} style={{ marginBottom: 8, background: "#18181b", borderRadius: 8, padding: 8, color: '#7fffd4' }}>{w.name}</li>
            ))}
          </ul>
          <button onClick={handleAddBlock} style={{ background: "#22c55e", color: "#18181b", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginTop: 8 }}>Add Logic Block</button>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Triggers</div>
          <ul style={{ paddingLeft: 18 }}>
            {triggers.map((t, idx) => (
              <li key={t.id || idx} style={{ marginBottom: 8, background: "#232336", borderRadius: 8, padding: 8, color: '#e5e7eb' }}>{t.name}</li>
            ))}
          </ul>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Import</button>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} aria-label="Import workflows" />
        <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Export</button>
        {exported && <a href={exported} download="workflows.json" style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 600 }}>Download</a>}
      </div>
      {imported && <div style={{ color: "#22c55e", marginBottom: 8 }}>Imported: {imported}</div>}
      {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
      <form onSubmit={e => { e.preventDefault(); handleFeedback(); }} style={{ marginTop: 32, background: "#232336", borderRadius: 12, padding: 20 }} aria-label="Send feedback">
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8, color: '#e5e7eb' }}>Feedback</div>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          rows={2}
          style={{ width: "100%", fontSize: 15, padding: 10, borderRadius: 8, border: "1px solid #6366f1", marginBottom: 12, background: "#18181b", color: "#e5e7eb" }}
          placeholder="Share your feedback or suggestions..."
          aria-label="Feedback input"
        />
        <button type="submit" style={{ background: "#7fffd4", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Send Feedback</button>
      </form>
    </div>
  );
}
