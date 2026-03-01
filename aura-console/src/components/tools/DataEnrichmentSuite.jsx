import React from "react";

const S = {
 page: { padding: 24, minHeight: "100vh", background: "#09090b", color: "#fafafa"},
 card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 12, padding: 32, maxWidth: 600, margin: "0 auto"},
 title: { fontSize: 22, fontWeight: 700, margin: 0, marginBottom: 8 },
 desc: { color: "#a1a1aa", fontSize: 14, marginBottom: 20 },
 badge: { display: "inline-block", background: "#3f3f46", color: "#fafafa", fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 9999, marginBottom: 24 },
 list: { listStyle: "none", padding: 0, margin: 0 },
 item: { padding: "8px 0", borderBottom: "1px solid #3f3f46", color: "#a1a1aa", fontSize: 14 },
};

const FEATURES = [
 "Append missing fields from third-party sources",
 "Auto-detect and normalize data formats",
 "Bulk enrichment for customer and product records",
 "Export enriched datasets as CSV",
];

export default function DataEnrichmentSuite() {
 return (
 <div style={S.page}>
 <div style={S.card}>
 <h2 style={S.title}>Data Enrichment Suite</h2>
 <p style={S.desc}>
 Fill gaps in your data by enriching customer and product records with
 verified information from external sources.
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
