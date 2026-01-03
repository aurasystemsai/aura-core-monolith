import React from "react";

export default function VisualWorkflowBuilder() {
  return (
    <div style={{ maxWidth: 1100, margin: "40px auto", background: "#fff", borderRadius: 18, boxShadow: "0 2px 24px #0002", padding: 36, fontFamily: 'Inter, sans-serif' }}>
      <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 18 }}>Visual Workflow Automation Builder</h2>
      <div style={{ color: "#6366f1", fontWeight: 600, marginBottom: 18 }}>
        <span role="img" aria-label="workflow">🔗</span> Drag-and-drop builder for cross-tool automations.
      </div>
      <div style={{ background: "#f1f5f9", borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <b>Coming soon:</b> Visual workflow canvas, automation templates, conditional logic, and API/webhook triggers.
      </div>
      <div style={{ color: "#64748b", fontSize: 15 }}>
        Build automations visually. Connect tools, set triggers, and automate workflows without code.
      </div>
    </div>
  );
}
