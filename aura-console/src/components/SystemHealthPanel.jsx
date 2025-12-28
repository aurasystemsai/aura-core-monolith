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
        <h2 className="card-title">System health</h2>
        <p className="card-subtitle">
          Quick snapshot of your AURA Core API status. If this is green, the
          Product SEO Engine can run.
        </p>
      </div>

      <div className="system-health-grid">
        <div className="system-health-main">
          <div className={statusClass}>
            <span className="system-health-dot" />
            <span className="system-health-text">
              {coreStatusLabel || statusText}
            </span>
          </div>
          <div className="system-health-meta">
            <span className="system-health-label">Last run</span>
            <span className="system-health-value">
              {lastRunAt || "Not run yet"}
            </span>
          </div>
        </div>

        <div className="system-health-help">
          <ul>
            <li>
              If status is <strong>offline</strong>, check your Render service
              and OpenAI API key.
            </li>
            <li>
              If status is <strong>checking</strong> for a long time, refresh
              the page or verify the Core URL.
            </li>
            <li>
              Once this is green, click <strong>Run Product SEO</strong> in the
              inspector panel.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default SystemHealthPanel;
