// aura-console/src/SystemHealthPanel.jsx
import React from "react";
import "./SystemHealthPanel.css";

function SystemHealthPanel({ coreStatus, coreStatusLabel, lastRunAt }) {
  // Map status to a simple label + tone
  const statusText =
    coreStatus === "ok"
      ? "Core API online"
      : coreStatus === "checking"
      ? "Checking Core API…"
      : coreStatus === "error"
      ? "Core API offline — check server or API key"
      : "Status not checked yet";

  const statusClass =
    coreStatus === "ok"
      ? "system-health-chip system-health-chip--ok"
      : coreStatus === "checking"
      ? "system-health-chip system-health-chip--loading"
      : coreStatus === "error"
      ? "system-health-chip system-health-chip--error"
      : "system-health-chip";

  return (
    <section className="system-health-card" style={{ marginTop: 10 }}>
      <div className="card-header">
        <h2 className="card-title" title="Check if your AURA Core API is online and healthy">System health
          <span style={{
            display: 'inline-block',
            marginLeft: 8,
            fontSize: 18,
            color: '#4f46e5',
            cursor: 'help',
          }}
          title="This panel shows if your backend (AURA Core API) is working. If it's green, all features should work. If not, check your server or API key.">
            
          </span>
        </h2>
        <p className="card-subtitle">
          Status of your AURA Core API. If this is green, everything is running smoothly.
          <span style={{color:'#4f46e5',marginLeft:8,cursor:'help'}} title="If this is not green, your app may not work. Check your server or API key.">?</span>
        </p>
      </div>
      <div className="system-health-grid">
        <div className="system-health-main">
          <div className={statusClass} title="Shows if your backend is online (green), checking, or offline (red)">
            <span className="system-health-dot" />
            <span className="system-health-text">
              {coreStatusLabel || statusText}
            </span>
          </div>
          <div className="system-health-meta">
            <span className="system-health-label" title="The last time a tool or check ran successfully">Last run</span>
            <span className="system-health-value" title="If this says 'Not run yet', you may need to use a tool or refresh.">
              {lastRunAt || "Not run yet"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SystemHealthPanel;
