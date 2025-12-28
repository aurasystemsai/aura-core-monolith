
import React from "react";

function DashboardHome({ setActiveSection }) {
  return (
    <div className="card dashboard-home" style={{ color: "#fff", textAlign: "center" }} role="region" aria-label="AURA Console Overview"> 
      <div style={{ fontWeight: 800, fontSize: 40, marginBottom: 16 }}>AURA Console Overview</div>
      <div style={{ fontSize: 20, color: "#7fffd4", marginBottom: 32 }}>
        Welcome! Here are your key metrics and quick links.
      </div>
      <div className="dashboard-home-cards-row">
        <div className="card dashboard-home-card">
          <div className="dashboard-home-card-label">Products</div>
          <div className="dashboard-home-card-value">SEO</div>
        </div>
        <div className="card dashboard-home-card">
          <div className="dashboard-home-card-label">Content Health</div>
          <div className="dashboard-home-card-value">Audit</div>
        </div>
        <div className="card dashboard-home-card">
          <div className="dashboard-home-card-label">Fix Queue</div>
          <div className="dashboard-home-card-value">0 Issues</div>
        </div>
      </div>
      <div className="dashboard-home-actions">
        <button className="button dashboard-home-action" onClick={() => setActiveSection("products")}>Go to Products</button>
        <button className="button dashboard-home-action" onClick={() => setActiveSection("content")}>Go to Content Health</button>
        <button className="button dashboard-home-action" onClick={() => setActiveSection("fixqueue")}>Go to Fix Queue</button>
      </div>
    </div>
  );
}

export default DashboardHome;
