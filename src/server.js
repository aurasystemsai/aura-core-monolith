// src/server.js
// ----------------------------------------
// AURA Core Monolith API
// ----------------------------------------

const path = require("path");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

dotenv.config();

const { getTool } = require("./core/tools-registry.cjs");
const projectsCore = require("./core/projects");
const runsCore = require("./core/runs"); // NEW

const app = express();
const PORT = process.env.PORT || 10000;

// ---------- MIDDLEWARE ----------

app.use(cors());
app.use(
  bodyParser.json({
    limit: "1mb",
  })
);

// Simple request logging
app.use((req, _res, next) => {
  console.log(
    `[Core] ${req.method} ${req.url} ${
      req.headers["x-aura-project-id"] || ""
    }`
  );
  next();
});

// ---------- HEALTH CHECK ----------

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "aura-core-monolith",
    env: process.env.NODE_ENV || "production",
    timestamp: new Date().toISOString(),
  });
});

// ---------- PROJECTS API (Connect Store) ----------

// Create a new project from the Connect Store screen
app.post("/projects", (req, res) => {
  try {
    const { name, domain, platform } = req.body || {};

    if (!name || !domain) {
      return res.status(400).json({
        ok: false,
        error: "name and domain are required",
      });
    }

    const project = projectsCore.createProject({
      name: String(name).trim(),
      domain: String(domain).trim(),
      platform: (platform || "other").trim(),
    });

    return res.json({
      ok: true,
      project,
    });
  } catch (err) {
    console.error("[Core] Error creating project", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to create project",
    });
  }
});

// List all projects (used by console project switcher)
app.get("/projects", (_req, res) => {
  try {
    const projects = projectsCore.listProjects();
    return res.json({
      ok: true,
      projects,
    });
  } catch (err) {
    console.error("[Core] Error listing projects", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to list projects",
    });
  }
});

// ---------- RUNS API (SQLite-backed) ---------- // NEW

// List recent runs for a project
app.get("/projects/:projectId/runs", (req, res) => {
  try {
    const { projectId } = req.params;
    if (!projectId) {
      return res.status(400).json({ ok: false, error: "projectId is required" });
    }

    const runs = runsCore.listRuns({ projectId, limit: 50 });

    return res.json({
      ok: true,
      runs,
    });
  } catch (err) {
    console.error("[Core] Error listing runs", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to list runs",
    });
  }
});

// Record a new run
app.post("/projects/:projectId/runs", (req, res) => {
  try {
    const { projectId } = req.params;
    if (!projectId) {
      return res.status(400).json({ ok: false, error: "projectId is required" });
    }

    const {
      toolId,
      createdAt,
      market,
      device,
      score,
      titleLength,
      metaLength,
      input,
      output,
    } = req.body || {};

    if (!toolId) {
      return res.status(400).json({ ok: false, error: "toolId is required" });
    }

    runsCore.recordRun({
      projectId,
      toolId,
      createdAt,
      market,
      device,
      score,
      titleLength,
      metaLength,
      input,
      output,
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("[Core] Error recording run", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to record run",
    });
  }
});

// ---------- TOOL RUN ROUTE ----------

app.post("/run/:toolId", async (req, res) => {
  const toolId = req.params.toolId;
  const projectId = req.headers["x-aura-project-id"];

  try {
    const tool = getTool(toolId);
    const input = req.body || {};

    const ctx = {
      environment: process.env.NODE_ENV || "production",
      projectId: projectId || null,
    };

    const result = await tool.run(input, ctx);

    return res.json({
      ok: true,
      toolId,
      result,
    });
  } catch (err) {
    console.error(`[Core] Tool error: ${toolId}`, err);

    return res.status(500).json({
      ok: false,
      error: err.message || "Tool run failed",
    });
  }
});

// ---------- STATIC CONSOLE (built React app) ----------

const consoleDist = path.join(__dirname, "..", "aura-console", "dist");

app.use(express.static(consoleDist));

app.get("*", (_req, res) => {
  res.sendFile(path.join(consoleDist, "index.html"));
});

// ---------- START SERVER ----------

app.listen(PORT, () => {
  console.log(
    `[Core] AURA Core API running on port ${PORT}\n` +
      "==> Your service is live 🎉\n" +
      `==> Available at your primary URL ${
        process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`
      }\n`
  );
});
