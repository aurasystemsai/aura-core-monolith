
import React from "react";

function DashboardHome({ setActiveSection }) {
  return (
    <div className="card dashboard-home" style={{ color: "#fff", textAlign: "center" }} role="region" aria-label="AURA Console Overview"> 
      <div style={{ fontWeight: 800, fontSize: 40, marginBottom: 16 }}>AURA Console Overview</div>
      <div style={{ fontSize: 20, color: "#7fffd4", marginBottom: 32 }}>
        Welcome! Here are your key metrics and quick links.
      </div>
      <div className="dashboard-home-actions" style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', marginTop: 32 }}>
        <button className="quick-link-btn" onClick={() => setActiveSection("products")}>Products</button>
        <button className="quick-link-btn" onClick={() => setActiveSection("content-health")}>Content Health</button>
        <button className="quick-link-btn" onClick={() => setActiveSection("fix-queue")}>Fix Queue</button>
        <button className="quick-link-btn" onClick={() => setActiveSection("tools")}>Tools</button>
        <button className="quick-link-btn" onClick={() => {/* Add automation logic here */}}>Run All Automations</button>
      </div>
    </div>
  );
}

export default DashboardHome;
