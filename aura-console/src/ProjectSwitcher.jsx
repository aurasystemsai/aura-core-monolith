import React, { useEffect, useState } from "react";

export default function ProjectSwitcher({
  coreUrl,
  currentProject,
  onSelectProject,
  onDisconnect,
}) {
  const [projects, setProjects] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${coreUrl}/projects`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Failed to load projects (${res.status}): ${text || res.statusText}`
        );
      }
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) loadProjects();
  }, [open]);

  const handleSelect = (project) => {
    localStorage.setItem("auraProjectId", project.id);
    localStorage.setItem("auraProjectName", project.name);
    localStorage.setItem("auraProjectDomain", project.domain);
    localStorage.setItem("auraPlatform", project.platform);
    onSelectProject(project);
    setOpen(false);
  };

  const handleDisconnect = () => {
    localStorage.removeItem("auraProjectId");
    localStorage.removeItem("auraProjectName");
    localStorage.removeItem("auraProjectDomain");
    localStorage.removeItem("auraPlatform");
    onDisconnect();
    setOpen(false);
  };

  return (
    <>
      <div className="side-nav-footer">
        <div className="side-nav-footer-label">Project</div>
        <div className="side-nav-footer-value">
          {currentProject?.domain || "Not connected"}
        </div>
        <div className="side-nav-footer-platform">
          Platform: {currentProject?.platform || "—"}
        </div>
        <button
          className="button button--ghost button--tiny side-nav-footer-button"
          onClick={() => setOpen(true)}
        >
          Change / Manage
        </button>
      </div>

      {open && (
        <div className="project-switcher-overlay">
          <div className="project-switcher-modal">
            <div className="modal-header">
              <h2>Switch project</h2>
              <button
                className="button button--ghost button--tiny"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>

            {loading && <div className="modal-status">Loading projects…</div>}
            {error && <div className="error-banner">{error}</div>}

            {!loading && projects.length === 0 && (
              <div className="modal-status">
                No projects yet. Use “Connect store” to create one.
              </div>
            )}

            {!loading && projects.length > 0 && (
              <ul className="project-list">
                {projects.map((p) => (
                  <li
                    key={p.id}
                    className={
                      "project-list-item" +
                      (currentProject && currentProject.id === p.id
                        ? " project-list-item--active"
                        : "")
                    }
                  >
                    <button
                      className="project-list-main"
                      type="button"
                      onClick={() => handleSelect(p)}
                    >
                      <div className="project-list-name">{p.name}</div>
                      <div className="project-list-domain">{p.domain}</div>
                      <div className="project-list-meta">
                        Platform: {p.platform} · Created{" "}
                        {new Date(p.createdAt).toLocaleDateString()}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="modal-footer">
              <button
                className="button button--ghost button--tiny"
                onClick={handleDisconnect}
              >
                Disconnect current project
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
