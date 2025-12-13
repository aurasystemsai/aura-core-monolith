// src/data/projects-store.js
// Simple JSON-file backed store for AURA projects

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname);
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");

// Ensure data dir + file exist
function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PROJECTS_FILE)) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify({ nextId: 1, projects: [] }, null, 2));
  }
}

function loadState() {
  ensureStore();
  const raw = fs.readFileSync(PROJECTS_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      throw new Error("Invalid projects file");
    }
    return {
      nextId: parsed.nextId || 1,
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
    };
  } catch (err) {
    console.error("[ProjectsStore] Failed to parse projects.json, resetting", err);
    const state = { nextId: 1, projects: [] };
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(state, null, 2));
    return state;
  }
}

function saveState(state) {
  ensureStore();
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(state, null, 2));
}

function listProjects() {
  const state = loadState();
  return state.projects;
}

function getProject(id) {
  const state = loadState();
  return state.projects.find((p) => p.id === id) || null;
}

function createProject({ name, domain, platform }) {
  const state = loadState();
  const id = `proj_${state.nextId++}`;

  const project = {
    id,
    name,
    domain,
    platform,
    createdAt: new Date().toISOString(),
  };

  state.projects.push(project);
  saveState(state);
  return project;
}

function updateProject(id, patch) {
  const state = loadState();
  const idx = state.projects.findIndex((p) => p.id === id);
  if (idx === -1) return null;

  const updated = { ...state.projects[idx], ...patch, updatedAt: new Date().toISOString() };
  state.projects[idx] = updated;
  saveState(state);
  return updated;
}

function deleteProject(id) {
  const state = loadState();
  const before = state.projects.length;
  state.projects = state.projects.filter((p) => p.id !== id);
  const removed = state.projects.length !== before;
  if (removed) saveState(state);
  return removed;
}

module.exports = {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
};
