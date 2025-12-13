// src/server.js
// --------------------------------------------------
// AURA Core Monolith API
// Unified gateway for all AURA tools
// --------------------------------------------------

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const toolsRegistry = require("./core/tools-registry");
const projectRoutes = require("./core/projects");

const app = express();

// ---------------------------------------------------------------------------
// Basic config
// ---------------------------------------------------------------------------
const PORT = process.env.PORT || 10000;
const ENVIRONMENT = process.env.NODE_ENV || "production";

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// body parsing
app.use(bodyParser.json({ limit: "1mb" }));
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

// simple request logging (good for Render logs)
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(
      `[Core] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms)`
    );
  });
  next();
});

// ---------------------------------------------------------------------------
// Healthcheck
// ---------------------------------------------------------------------------
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "aura-core-monolith",
    env: ENVIRONMENT,
    time: new Date().toISOString(),
  });
});

// ---------------------------------------------------------------------------
// Project / store routes (Connect Store screen)
// ---------------------------------------------------------------------------
app.use(projectRoutes);

// ---------------------------------------------------------------------------
// Tool execution endpoint
// POST /run/:toolId
// ---------------------------------------------------------------------------
app.post("/run/:toolId", async (req, res) => {
  const toolId = req.params.toolId;
  const input = req.body || {};
  const projectId = req.header("x-aura-project-id") || null;

  const tool = toolsRegistry.getTool(toolId);

  if (!tool || typeof tool.run !== "function") {
    return res.status(404).json({
      ok: false,
      error: `Unknown tool '${toolId}'`,
    });
  }

  try {
    console.log(
      `[Core] Running tool '${toolId}' for project ${projectId || "unknown"}`
    );

    const result = await tool.run(input, {
      projectId,
      environment: ENVIRONMENT,
    });

    // Normalize the output a bit so the console can rely on a consistent shape.
    res.json({
      ok: true,
      tool: tool.meta || { id: toolId },
      result,
    });
  } catch (err) {
    console.error("[Core] Tool error:", toolId, err);

    const status = err.statusCode || err.status || 500;

    res.status(status).json({
      ok: false,
      error: err.message || "Tool execution failed",
    });
  }
});

// ---------------------------------------------------------------------------
// Fallback 404 handler
// ---------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ---------------------------------------------------------------------------
// Error handler (last resort)
// ---------------------------------------------------------------------------
app.use((err, req, res, next) => {
  console.error("[Core] Unhandled error:", err);
  res.status(500).json({
    ok: false,
    error: "Internal server error",
  });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(
    `[Core] AURA Core API running on port ${PORT}\n` +
      "==> Your service is live 🎉\n" +
      "==> ////////////////////////////////\n" +
      `==> Available at your primary URL\n` +
      "==> ////////////////////////////////"
  );
});

module.exports = app;
