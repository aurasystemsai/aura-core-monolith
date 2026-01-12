// aura-console/src/ProjectSwitcher.jsx
// -----------------------------------------
// Sidebar "Connected project" footer
// Pulls projects from Core /projects API
// Lets you switch / disconnect cleanly
// -----------------------------------------


import React, { useEffect, useState } from "react";

function ProjectSwitcher({ coreUrl, currentProject, onSelectProject, onDisconnect }) {
  const { t } = useTranslation();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);

  // Fetch projects from Core once (and when coreUrl changes)
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${coreUrl}/api/projects`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Core API returned ${res.status} for /projects`);
        }

        const data = await res.json();
        if (!data.ok || !Array.isArray(data.projects)) {
          throw new Error("Core API did not return a valid projects array.");
        }

        setProjects(data.projects);
      } catch (err) {
        console.error("[Console] Failed to load projects", err);
        setError(err.message || "Failed to load projects from Core.");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [coreUrl]);

  const handleSelect = (proj) => {
    if (!proj) return;

    // Persist selection for future sessions
    localStorage.setItem("auraProjectId", proj.id);
    localStorage.setItem("auraProjectName", proj.name || "");
    localStorage.setItem("auraProjectDomain", proj.domain || "");
    localStorage.setItem("auraPlatform", proj.platform || "other");

    if (onSelectProject) {
      onSelectProject(proj);
    }
    setOpen(false);
  };

  const handleDisconnect = () => {
    localStorage.removeItem("auraProjectId");
    localStorage.removeItem("auraProjectName");
    localStorage.removeItem("auraProjectDomain");
    localStorage.removeItem("auraPlatform");

    if (onDisconnect) {
      onDisconnect();
    }
    setOpen(false);
  };

  if (!currentProject) {
    return null;
  }

  // Build list of "other" projects (excluding the one currently selected)
  const otherProjects = projects.filter(
    (p) => p.id && currentProject.id && p.id !== currentProject.id
  );
  // If there is no current project at all, hide the footer
  if (!currentProject) {
    return null;
  }

  return (
    <div className="project-switcher-footer">
      <div className="project-switcher-label">{t('project_switcher_connected_project')}</div>
      <div className="project-switcher-current">
        <span className="project-switcher-name">{currentProject.name}</span>
        <span className="project-switcher-domain">{currentProject.domain}</span>
        <button onClick={handleDisconnect} className="project-switcher-disconnect">
          {t('project_switcher_disconnect')}
        </button>
      </div>
      {otherProjects.length > 0 && (
        <div className="project-switcher-other">
          <div className="project-switcher-other-label">{t('project_switcher_switch_to')}</div>
          <ul>
            {otherProjects.map(proj => (
              <li key={proj.id}>
                <button onClick={() => handleSelect(proj)}>{proj.name}</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && !loading && (
        <div style={{ fontSize: 11, color: "#fecaca" }}>{t(error) || error}</div>
      )}
      {!loading && !error && projects.length === 0 && (
        <div style={{ fontSize: 12, color: "#cbd5f5", marginTop: 8 }}>{t('project_switcher_no_projects')}</div>
      )}
    </div>
  );

  return (
    <div className="side-nav-footer">
      <div className="side-nav-footer-label">Connected project</div>

      <div className="side-nav-footer-value">
        {currentProject.name || "Untitled project"}
      </div>
      <div
        style={{
          fontSize: 11,
          color: "#9ca3af",
          marginTop: 2,
          wordBreak: "break-all",
        }}
      >
        {currentProject.domain || "Domain not set"}
      </div>

      <div
        style={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <button
          type="button"
          className="button button--ghost"
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? "Close project list" : "Switch project"}
        </button>

        <button
          type="button"
          className="button button--ghost"
          style={{ fontSize: 11, padding: "4px 10px" }}
          onClick={handleDisconnect}
        >
          Disconnect project
        </button>
      </div>

      {open && (
        <div
          style={{
            marginTop: 8,
            padding: "8px 9px",
            borderRadius: 10,
            border: "1px solid rgba(55,65,81,0.9)",
            background: "#020617",
            maxHeight: 180,
            overflowY: "auto",
            fontSize: 12,
          }}
        >
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              color: "#6b7280",
              marginBottom: 6,
            }}
          >
            Your projects
          </div>

          {loading && (
            <div style={{ fontSize: 11, color: "#9ca3af" }}>
              Loading projects from Core…
            </div>
          )}

          {error && !loading && (
            <div style={{ fontSize: 11, color: "#fecaca" }}>{error}</div>
          )}

          {!loading && !error && projects.length === 0 && (
            <div style={{ fontSize: 11, color: "#9ca3af" }}>
              No projects found in Core yet. Use “Connect store” first.
            </div>
          )}

          {!loading && !error && projects.length > 0 && (
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {/* Show the current project entry too, but mark it as active */}
              {projects.map((p) => {
                const isActive =
                  currentProject.id && p.id && currentProject.id === p.id;
                return (
                  <li key={p.id || p.name}>
                    <button
                      type="button"
                      onClick={() => !isActive && handleSelect(p)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        borderRadius: 8,
                        border: isActive
                          ? "1px solid rgba(34,211,238,0.5)"
                          : "1px solid rgba(55,65,81,0.9)",
                        background: isActive
                          ? "rgba(34,211,238,0.12)"
                          : "rgba(15,23,42,0.98)",
                        color: isActive ? "#e5e7eb" : "#cbd5f5",
                        padding: "6px 7px",
                        cursor: isActive ? "default" : "pointer",
                        fontSize: 12,
                      }}
                    >
                      <div style={{ fontWeight: 500 }}>
                        {p.name || "Untitled project"}
                        {isActive && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: 10,
                              textTransform: "uppercase",
                              letterSpacing: "0.14em",
                              color: "#22d3ee",
                            }}
                          >
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#9ca3af",
                          marginTop: 1,
                          wordBreak: "break-all",
                        }}
                      >
                        {p.domain || "Domain not set"}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default ProjectSwitcher;
