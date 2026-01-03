import React from "react";

export default function EntityTopicExplorer() {
  return (
    <div style={{ maxWidth: 900, margin: "40px auto", background: "#fff", borderRadius: 18, boxShadow: "0 2px 24px #0002", padding: 36, fontFamily: 'Inter, sans-serif' }}>
      <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 18 }}>Entity/Topic Explorer</h2>
      <div style={{ color: "#0ea5e9", fontWeight: 600, marginBottom: 18 }}>
        <span role="img" aria-label="entity">🧠</span> Semantic SEO: discover entities and topics for your content.
      </div>
      <div style={{ background: "#f1f5f9", borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <b>Coming soon:</b> Entity extraction, topic clustering, and semantic analysis.
      </div>
      <div style={{ color: "#64748b", fontSize: 15 }}>
        Enhance your SEO with advanced entity and topic insights.
      </div>
    </div>
  );
}
