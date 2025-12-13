// ===============================================
// AURA Core API (monolith)
// Unified gateway for all AURA tools + Console UI
// ===============================================

const path = require("path");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

dotenv.config();

// ---------- config ----------

const PORT = Number(
  process.env.PORT || process.env.AURA_CORE_API_PORT || 4999
);

// Tools registry (CommonJS)
const toolsRegistry = require("./core/tools-registry.cjs");

// Projects store (JSON file)
const ProjectsStore = require("./data/projects-store");

// ---------- app setup ----------

const app = express();

const allowedOrigins = [
  // Local dev
  "http://localhost:4999",
  "http://localhost:5173",

  // Render Core API
  "https://aura-core-monolith.onrender.com",

  // AURA site (Framer)
  "https://aurasystemsai.com",
  "https://www.aurasystemsai.com",

  // DTP store
  "https://dtpjewellry.com",
  "https://www.dtpjewellry.com",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true); // server-to-server / Postman
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn("[CORS] Blocked origin:", origin);
      return callback(null, false);
    },
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders:
      "Content-Type,Authorization,x-core-client,x-aura-project-id",
  })
);

app.options("*", cors());
app.use(bodyParser.json());

// ===============================================
// CORE HEALTH + TOOLS
// ===============================================

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    status: "ok",
    env: process.env.NODE_ENV || "development",
    tools: Object.keys(toolsRegistry).length,
  });
});

app.get("/tools", (req, res) => {
  const tools = Object.entries(toolsRegistry).map(([id, mod]) => {
    const meta = (mod && mod.meta) || {};
    return {
      id,
      name: meta.name || mod.key || id,
      category: meta.category || "General",
      description: meta.description || "No description yet.",
    };
  });

  res.json({
    ok: true,
    count: tools.length,
    tools,
  });
});

app.post("/run/:tool", async (req, res) => {
  const toolKey = req.params.tool;
  const input = req.body || {};

  const tool = toolsRegistry[toolKey];

  if (!tool) {
    return res.status(404).json({
      ok: false,
      error: `Unknown AURA tool '${toolKey}'.`,
      knownTools: Object.keys(toolsRegistry),
    });
  }

  try {
    const ctx = {
      env: process.env,
      environment: process.env.NODE_ENV || "development",
      projectId: req.headers["x-aura-project-id"] || null,
    };

    const result = await tool.run(input, ctx);

    res.json({
      ok: true,
      tool: toolKey,
      result,
    });
  } catch (err) {
    console.error("Unhandled error in AURA tool:", toolKey, err);
    res.status(500).json({
      ok: false,
      error: err.message || "Unhandled error in AURA Core API tool.",
    });
  }
});

// ===============================================
// PROJECTS API (used by Connect Store + switcher)
// ===============================================

// List all projects
app.get("/projects", (req, res) => {
  const projects = ProjectsStore.listProjects();
  res.json({ ok: true, projects });
});

// Create project
app.post("/projects", (req, res) => {
  const { name, domain, platform } = req.body || {};

  if (!name || !domain || !platform) {
    console.warn("[Projects] Missing fields", req.body);
    return res.status(400).json({ ok: false, error: "Missing required fields" });
  }

  const project = ProjectsStore.createProject({ name, domain, platform });
  console.log("[Projects] Created", project);
  res.json({ ok: true, project });
});

// Get project
app.get("/projects/:id", (req, res) => {
  const project = ProjectsStore.getProject(req.params.id);
  if (!project) {
    return res.status(404).json({ ok: false, error: "Not found" });
  }
  res.json({ ok: true, project });
});

// Update project (rename, change domain/platform)
app.put("/projects/:id", (req, res) => {
  const patch = {};
  const { name, domain, platform } = req.body || {};
  if (name) patch.name = name;
  if (domain) patch.domain = domain;
  if (platform) patch.platform = platform;

  const updated = ProjectsStore.updateProject(req.params.id, patch);
  if (!updated) {
    return res.status(404).json({ ok: false, error: "Not found" });
  }
  res.json({ ok: true, project: updated });
});

// Delete project
app.delete("/projects/:id", (req, res) => {
  const removed = ProjectsStore.deleteProject(req.params.id);
  if (!removed) {
    return res.status(404).json({ ok: false, error: "Not found" });
  }
  res.json({ ok: true, removed: true });
});

// ===============================================
// STATIC CONSOLE UI
// ===============================================

const consoleBuildPath = path.join(__dirname, "..", "aura-console", "dist");

app.use(express.static(consoleBuildPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(consoleBuildPath, "index.html"));
});

// ===============================================
// START SERVER
// ===============================================

app.listen(PORT, () => {
  console.log(
    `[Core] AURA Core API running at http://localhost:${PORT} | Tools loaded: ${
      Object.keys(toolsRegistry).length
    }`
  );
});

module.exports = app;
