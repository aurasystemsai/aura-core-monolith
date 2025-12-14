// src/server.js
// ----------------------------------------
// AURA Core Monolith API
// ----------------------------------------

const path = require("path");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const OpenAI = require("openai");

// Internal modules
const { getTool } = require("./core/tools-registry.cjs");
const projectsCore = require("./core/projects");
const metrics = require("./core/metrics"); // <-- make sure src/core/metrics.js exists

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// OpenAI client (used for deep health check)
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ---------- MIDDLEWARE ----------

app.use(cors());
app.use(
  bodyParser.json({
    limit: "1mb"
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

// Global metrics middleware: track every HTTP request
app.use((req, res, next) => {
  const started = Date.now();

  res.on("finish", () => {
    const latencyMs = Date.now() - started;

    const route =
      (req.route && req.route.path) ||
      req.path ||
      req.originalUrl ||
      "unknown";

    const ok = res.statusCode < 500;

    metrics.recordHttp(route, latencyMs, ok);
  });

  next();
});

// ---------- HEALTH CHECKS ----------

// Legacy lightweight health (kept as-is for compatibility)
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "aura-core-monolith",
    env: process.env.NODE_ENV || "production",
    timestamp: new Date().toISOString()
  });
});

// New JSON health snapshot for console UI
app.get("/api/health", (_req, res) => {
  const snap = metrics.snapshot();

  res.json({
    status: "ok",
    service: "aura-core-monolith",
    timestamp: new Date().toISOString(),
    env: {
      nodeEnv: process.env.NODE_ENV || "production",
      hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
      defaultModel: process.env.AURA_DEFAULT_MODEL || null
    },
    uptimeSeconds: Math.round(snap.uptimeMs / 1000),
    http: {
      totalRequests: snap.http.total,
      failures: snap.http.failures,
      avgLatencyMs: snap.http.avgLatencyMs,
      perRoute: snap.http.perRoute
    },
    openai: {
      totalCalls: snap.openai.total,
      failures: snap.openai.failures,
      avgLatencyMs: snap.openai.avgLatencyMs,
      lastError: snap.openai.lastError,
      lastSuccessAt: snap.openai.lastSuccessAt
    }
  });
});

// Deep health: actually ping OpenAI once
app.get("/api/health/deep", async (_req, res) => {
  const started = Date.now();

  try {
    // Cheap-ish call just to confirm OpenAI is reachable
    await openaiClient.models.list({ limit: 1 });

    const latencyMs = Date.now() - started;
    metrics.recordOpenAI(latencyMs, true);

    res.json({
      status: "ok",
      type: "deep",
      openaiReachable: true,
      latencyMs
    });
  } catch (err) {
    const latencyMs = Date.now() - started;

    const message =
      (err &&
        err.response &&
        err.response.data &&
        err.response.data.error &&
        err.response.data.error.message) ||
      err.message ||
      "Unknown OpenAI error";

    metrics.recordOpenAI(latencyMs, false, message);

    res.status(500).json({
      status: "error",
      type: "deep",
      openaiReachable: false,
      message
    });
  }
});

// ---------- PROJECTS API (Connect Store) ----------

// Create a new project from the Connect Store screen
app.post("/projects", (req, res) => {
  try {
    const { name, domain, platform } = req.body || {};

    if (!name || !domain) {
      return res.status(400).json({
        ok: false,
        error: "name and domain are required"
      });
    }

    const project = projectsCore.createProject({
      name: String(name).trim(),
      domain: String(domain).trim(),
      platform: (platform || "other").trim()
    });

    return res.json({
      ok: true,
      project
    });
  } catch (err) {
    console.error("[Core] Error creating project", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to create project"
    });
  }
});

// List all projects (used by console project switcher)
app.get("/projects", (_req, res) => {
  try {
    const projects = projectsCore.listProjects();
    return res.json({
      ok: true,
      projects
    });
  } catch (err) {
    console.error("[Core] Error listing projects", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to list projects"
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
      projectId: projectId || null
    };

    const result = await tool.run(input, ctx);

    return res.json({
      ok: true,
      toolId,
      result
    });
  } catch (err) {
    console.error(`[Core] Tool error: ${toolId}`, err);

    return res.status(500).json({
      ok: false,
      error: err.message || "Tool run failed"
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
