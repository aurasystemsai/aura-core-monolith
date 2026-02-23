import React from "react";

const S = {
  page: { padding: 24, minHeight: "100vh", background: "#09090b", color: "#fafafa" },
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 12, padding: 32, maxWidth: 600, margin: "0 auto" },
  title: { fontSize: 22, fontWeight: 700, margin: 0, marginBottom: 8 },
  desc: { color: "#a1a1aa", fontSize: 14, marginBottom: 20 },
  badge: { display: "inline-block", background: "#3f3f46", color: "#fafafa", fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 9999, marginBottom: 24 },
  list: { listStyle: "none", padding: 0, margin: 0 },
  item: { padding: "8px 0", borderBottom: "1px solid #3f3f46", color: "#a1a1aa", fontSize: 14 },
};

const FEATURES = [
  "AI-powered customer grouping",
  "RFM and behavioral segmentation",
  "Real-time segment sync with Shopify",
  "Export segments for targeted campaigns",
];

export default function CustomerSegmentationEngine() {
  return (
    <div style={S.page}>
      <div style={S.card}>
        <h2 style={S.title}>Customer Segmentation Engine</h2>
        <p style={S.desc}>
          Automatically group your customers into actionable segments based on
          behavior, value, and engagement patterns.
        </p>
        <span style={S.badge}>Coming Soon</span>
        <ul style={S.list}>
          {FEATURES.map((f) => (
            <li key={f} style={S.item}>
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
