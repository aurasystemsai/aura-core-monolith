import React from "react";

export default function AutomationTemplates() {
  return (
    <div style={{ maxWidth: 900, margin: "40px auto", background: "#fff", borderRadius: 18, boxShadow: "0 2px 24px #0002", padding: 36, fontFamily: 'Inter, sans-serif' }}>
      <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 18 }}>Prebuilt Automation Templates</h2>
      <div style={{ color: "#6366f1", fontWeight: 600, marginBottom: 18 }}>
        <span role="img" aria-label="template">📄</span> Ready-to-use workflow and automation templates.
      </div>
      <div style={{ background: "#f1f5f9", borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <b>Coming soon:</b> Template gallery, one-click install, and customization.
      </div>
      <div style={{ color: "#64748b", fontSize: 15 }}>
        Accelerate automation with proven, prebuilt templates.
      </div>
    </div>
  );
}
