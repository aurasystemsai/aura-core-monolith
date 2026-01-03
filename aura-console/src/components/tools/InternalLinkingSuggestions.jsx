import React from "react";

export default function InternalLinkingSuggestions() {
  return (
    <div style={{ maxWidth: 900, margin: "40px auto", background: "#fff", borderRadius: 18, boxShadow: "0 2px 24px #0002", padding: 36, fontFamily: 'Inter, sans-serif' }}>
      <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 18 }}>Automated Internal Linking Suggestions</h2>
      <div style={{ color: "#0ea5e9", fontWeight: 600, marginBottom: 18 }}>
        <span role="img" aria-label="link">🔗</span> AI-powered suggestions for internal links to boost SEO.
      </div>
      <div style={{ background: "#f1f5f9", borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <b>Coming soon:</b> Link graph analysis, anchor text recommendations, and more.
      </div>
      <div style={{ color: "#64748b", fontSize: 15 }}>
        Improve your site's SEO with smart internal linking strategies.
      </div>
    </div>
  );
}
