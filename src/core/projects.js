// src/core/projects.js
// ----------------------------------------
// Simple in-memory projects store for AURA Core
// ----------------------------------------

// Map<projectId, project>
const projects = new Map();

/**
 * Create a new project.
 *
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.domain
 * @param {string} [params.platform]
 */
function createProject({ name, domain, platform = "other" }) {
  const id = [
    Date.now().toString(36),
    Math.random().toString(36).slice(2, 8),
  ].join("-");

  const project = {
    id,
    name,
    domain,
    platform,
    createdAt: new Date().toISOString(),
  };

  projects.set(id, project);
  return project;
}

/**
 * Get a project by ID.
 */
function getProject(id) {
  return projects.get(id) || null;
}

/**
 * List all projects.
 */
function listProjects() {
  return Array.from(projects.values());
}

module.exports = {
  createProject,
  getProject,
  listProjects,
};
