import React from "react";

export default function DashboardHome({ setActiveSection }) {
  return (
    <div style={{ color: "#fff", padding: 48, textAlign: "center" }}>
      <div style={{ fontWeight: 800, fontSize: 40, marginBottom: 16 }}>AURA Console Overview</div>
      <div style={{ fontSize: 20, color: "#7fffd4", marginBottom: 32 }}>
        Welcome! Here are your key metrics and quick links.
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 40, marginBottom: 40 }}>
        <div style={{ background: "#23284a", borderRadius: 12, padding: 32, minWidth: 220 }}>
          <div style={{ fontSize: 18, color: "#aaa" }}>Products</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#7fffd4" }}>SEO</div>
        </div>
        <div style={{ background: "#23284a", borderRadius: 12, padding: 32, minWidth: 220 }}>
          <div style={{ fontSize: 18, color: "#aaa" }}>Content Health</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#7fffd4" }}>Audit</div>
        </div>
        <div style={{ background: "#23284a", borderRadius: 12, padding: 32, minWidth: 220 }}>
          <div style={{ fontSize: 18, color: "#aaa" }}>Fix Queue</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#7fffd4" }}>0 Issues</div>
        </div>
      </div>
      <div style={{ marginTop: 32 }}>
        <button onClick={() => setActiveSection("products")}
          style={{ margin: 8, padding: "12px 32px", borderRadius: 8, background: "#5c6ac4", color: "#fff", fontWeight: 700, border: 0, fontSize: 18 }}>
          Go to Products
        </button>
        <button onClick={() => setActiveSection("content")}
          style={{ margin: 8, padding: "12px 32px", borderRadius: 8, background: "#5c6ac4", color: "#fff", fontWeight: 700, border: 0, fontSize: 18 }}>
          Content Health
        </button>
        <button onClick={() => setActiveSection("fixqueue")}
          style={{ margin: 8, padding: "12px 32px", borderRadius: 8, background: "#5c6ac4", color: "#fff", fontWeight: 700, border: 0, fontSize: 18 }}>
          Fix Queue
        </button>
      </div>
    </div>
  );
}
