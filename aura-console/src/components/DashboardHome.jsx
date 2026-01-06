
import React from "react";

function DashboardHome({ setActiveSection }) {
  return (
    <div className="aura-card" style={{ textAlign: "center", margin: "40px auto", padding: "36px 32px 32px 32px", maxWidth: 1100 }} role="region" aria-label="AURA Console Overview">
      <div style={{ fontWeight: 900, fontSize: 40, marginBottom: 16, color: "var(--text-primary)" }}>AURA Console Overview</div>
      <div style={{ fontSize: 20, color: "var(--text-accent)", marginBottom: 32 }}>
        Welcome! Here are your key metrics and quick links.
      </div>
      <div className="dashboard-home-actions" style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', marginTop: 32 }}>
        <button className="aura-btn" onClick={() => setActiveSection("products")}>Products</button>
        <button className="aura-btn" onClick={() => setActiveSection("content-health")}>Content Health</button>
        <button className="aura-btn" onClick={() => setActiveSection("fix-queue")}>Fix Queue</button>
        <button className="aura-btn" onClick={() => setActiveSection("tools")}>Tools</button>
        <button className="aura-btn" onClick={() => {/* Add automation logic here */}}>Run All Automations</button>
      </div>
    </div>
  );
}

export default DashboardHome;
