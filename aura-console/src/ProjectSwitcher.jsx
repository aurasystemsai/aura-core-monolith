// src/ProjectSwitcher.jsx
import React, { useState } from "react";
import "./App.css";

/**
 * Props:
 *  - coreUrl: string (not used yet but kept for future)
 *  - currentProject: { id, name, domain, platform }
 *  - onSelectProject: (project) => void  // reserved for future multi-project
 *  - onDisconnect: () => void
 */
function ProjectSwitcher({ currentProject, onDisconnect }) {
  const [menuOpen, setMenuOpen] = useState(false);

  if (!currentProject) return null;

  const handleDisconnect = () => {
    // Clear local storage
    localStorage.removeItem("auraProjectId");
    localStorage.removeItem("auraProjectName");
    localStorage.removeItem("auraProjectDomain");
    localStorage.removeItem("auraPlatform");

    setMenuOpen(false);
    onDisconnect();
  };

  return (
    <div className="side-nav-footer">
      <div className="side-nav-footer-label">Project</div>
      <div className="side-nav-footer-value">
        {currentProject.domain || currentProject.name}
      </div>
      <div
        style={{
          marginTop: 4,
          fontSize: 11,
          color: "#9ca3af",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <span>
          Platform:{" "}
          {currentProject.platform || "Other / Manual (default)"}
        </span>
        <button
          type="button"
          className="button button--ghost"
          style={{ marginTop: 6, width: "100%", fontSize: 11, padding: "5px" }}
          onClick={() => setMenuOpen((open) => !open)}
        >
          Change / Manage
        </button>

        {menuOpen && (
          <div
            style={{
              marginTop: 6,
              padding: "6px 8px",
              borderRadius: 8,
              border: "1px solid rgba(55,65,81,0.9)",
              background: "#020617",
            }}
          >
            <button
              type="button"
              className="button button--ghost"
              style={{
                width: "100%",
                fontSize: 11,
                padding: "4px 6px",
                justifyContent: "flex-start",
              }}
              onClick={handleDisconnect}
            >
              Disconnect project
            </button>
            <div
              style={{
                marginTop: 4,
                fontSize: 10,
                color: "#6b7280",
                lineHeight: 1.4,
              }}
            >
              This only clears the project from your browser. Your Core API
              project stays intact.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectSwitcher;
