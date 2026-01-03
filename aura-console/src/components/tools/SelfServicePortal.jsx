import React from "react";

export default function SelfServicePortal() {
  return (
    <div style={{ maxWidth: 900, margin: "40px auto", background: "#fff", borderRadius: 18, boxShadow: "0 2px 24px #0002", padding: 36, fontFamily: 'Inter, sans-serif' }}>
      <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 18 }}>Self-Service Portal</h2>
      <div style={{ color: "#6366f1", fontWeight: 600, marginBottom: 18 }}>
        <span role="img" aria-label="portal">🛠️</span> Manage integrations, billing, and support in one place.
      </div>
      <div style={{ background: "#f1f5f9", borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <b>Coming soon:</b> Integration management, billing dashboard, support ticketing, and more.
      </div>
      <div style={{ color: "#64748b", fontSize: 15 }}>
        Empower merchants to self-manage their account, integrations, and support needs.
      </div>
    </div>
  );
}
