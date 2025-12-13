// ===============================================
// AURA Core Monolith - Final Render Build
// - Fully open CORS
// - Logs all connect requests
// - Ready for hosted frontend
// ===============================================

const path = require("path");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4999);

// Load tools registry
const toolsRegistry = require("./core/tools-registry.cjs");

// -------------------------------------
// GLOBAL CORS (Allow everything for now)
// -------------------------------------
app.use(
  cors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "*"
  })
);
app.use(bodyParser.json());

// -------------------------------------
// HEALTH CHECK
// -------------------------------------
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    status: "ok",
    env: process.env.NODE_ENV || "production",
    tools: Object.keys(toolsRegistry).length
  });
});

// -------------------------------------
// CONNECT STORE / PROJECT ENDPOINT
// -------------------------------------
app.post("/api/projects", (req, res) => {
  const { name, domain, platform } = req.body || {};
  console.log("📦 New project connect:", { name, domain, platform });

  if (!name || !domain) {
    return res
      .status(400)
      .json({ ok: false, error: "Missing required fields: name or domain" });
  }

  res.json({
    ok: true,
    message: "Project connected successfully",
    project: { name, domain, platform }
  });
});

// -------------------------------------
// TOOL RUNNER
// -------------------------------------
app.post("/run/:tool", async (req, res) => {
  const toolKey = req.params.tool;
  const input = req.body || {};
  const tool = toolsRegistry[toolKey];

  if (!tool) {
    return res.status(404).json({
      ok: false,
      error: `Unknown tool '${toolKey}'.`,
      knownTools: Object.keys(toolsRegistry)
    });
  }

  try {
    const ctx = {
      env: process.env,
      environment: process.env.NODE_ENV || "production"
    };
    const result = await tool.run(input, ctx);
    res.json({ ok: true, tool: toolKey, result });
  } catch (err) {
    console.error("❌ Tool error:", toolKey, err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// -------------------------------------
// STATIC FRONTEND (Console UI)
// -------------------------------------
const consoleBuildPath = path.join(__dirname, "..", "aura-console", "dist");
app.use(express.static(consoleBuildPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(consoleBuildPath, "index.html"));
});

// -------------------------------------
// START SERVER
// -------------------------------------
app.listen(PORT, () => {
  console.log(`[Core] AURA Core API running on port ${PORT}`);
});

module.exports = app;
