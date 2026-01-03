import React from "react";

export default function InventoryForecasting() {
  return (
    <div style={{ maxWidth: 900, margin: "40px auto", background: "#fff", borderRadius: 18, boxShadow: "0 2px 24px #0002", padding: 36, fontFamily: 'Inter, sans-serif' }}>
      <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 18 }}>Inventory Forecasting</h2>
      <div style={{ color: "#0ea5e9", fontWeight: 600, marginBottom: 18 }}>
        <span role="img" aria-label="inventory">📦</span> Predict inventory needs and optimize stock levels.
      </div>
      <div style={{ background: "#f1f5f9", borderRadius: 10, padding: 18, marginBottom: 18 }}>
        <b>Coming soon:</b> Demand forecasting, reorder automation, and supply chain analytics.
      </div>
      <div style={{ color: "#64748b", fontSize: 15 }}>
        Prevent stockouts and overstock with AI-powered inventory forecasting.
      </div>
    </div>
  );
}
