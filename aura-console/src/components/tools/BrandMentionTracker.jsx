import React from "react";

export default function BrandMentionTracker() {
  return (
    <div style={{ maxWidth: 900, margin: "40px auto", background: "#fff", borderRadius: 18, boxShadow: "0 2px 24px #0002", padding: 36, fontFamily: 'Inter, sans-serif' }}>
      <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 18 }}>Brand Mention Tracker</h2>
      <div style={{ color: "#0ea5e9", fontWeight: 600, marginBottom: 18 }}>
        <span role="img" aria-label="brand">📣</span> Track brand mentions across the web and social media.
      </div>
      <div style={{ background: "#f1f5f9", borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <b>Coming soon:</b> Real-time monitoring, sentiment analysis, and alerts.
      </div>
      <div style={{ color: "#64748b", fontSize: 15 }}>
        Stay on top of your brand reputation with automated tracking.
      </div>
    </div>
  );
}
