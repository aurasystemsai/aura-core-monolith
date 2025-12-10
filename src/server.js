// src/server.js
// ===============================================
// AURA Core Monolith
// - Single gateway in front of all AURA tools
// - Also serves the Automation Console (Vite build)
// ===============================================

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

// ---------- config ----------

// Dedicated env var so it doesn't clash with other projects
const PORT = Number(process.env.PORT || process.env.AURA_CORE_API_PORT || 4999);

// Map of toolId -> tool module
// Each module exports: { key, run(input, ctx) }
const toolsRegistry = require("./core/tools-registry");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Simple request logger (handy on Render logs)
app.use((req, _res, next) => {
  console.log(`[core-api] ${req.method} ${req.url}`);
  next();
});

// ---------- helpers ----------

function getTool(toolId) {
  if (!toolId) return null;
  return toolsRegistry[toolId] || null;
}

// Shared context we pass to tools
function buildCtx(req) {
  return {
    ip: req.ip,
    userAgent: req.get("user-agent") || "",
    requestId: req.get("x-request-id") || "",
    now: new Date().toISOString()
  };
}

// ===============================================
// API routes
// ===============================================

// Meta route: list all registered AURA tools
app.get("/meta/tools", (req, res) => {
  try {
    const tools = Object.keys(toolsRegistry).map((id) => {
      const mod = toolsRegistry[id] || {};
      return {
        id,
        key: mod.key || id,
        name: mod.name || mod.key || id,
        category: mod.category || "Uncategorised",
        description: mod.description || ""
      };
    });

    res.json({
      ok: true,
      count: tools.length,
      tools
    });
  } catch (err) {
    console.error("[core-api] /meta/tools error:", err);
    res.status(500).json({
      ok: false,
      error: err.message || "Unexpected error in /meta/tools"
    });
  }
});

// Run a specific tool
app.post("/run/:toolId", async (req, res) => {
  const toolId = req.params.toolId;
  const tool = getTool(toolId);

  if (!tool) {
    const known = Object.keys(toolsRegistry);
    return res.status(404).json({
      ok: false,
      error: `Unknown AURA tool '${toolId}'.`,
      knownTools: known
    });
  }

  try {
    const ctx = buildCtx(req);
    const result = await tool.run(req.body || {}, ctx);

    res.json({
      ok: true,
      tool: tool.key || toolId,
      result
    });
  } catch (err) {
    console.error(`[core-api] Error while running tool '${toolId}':`, err);
    res.status(500).json({
      ok: false,
      tool: tool.key || toolId,
      error: err.message || "Unexpected error while running tool"
    });
  }
});

// ===============================================
// Serve Automation Console (Vite build)
// ===============================================

// Built console output (Vite build.outDir = "dist")
const consolePath = path.join(process.cwd(), "aura-console", "dist");

// Serve static assets from the console build
app.use(express.static(consolePath));

// SPA fallback: for any GET that isn't an API route, send index.html
app.get("*", (req, res, next) => {
  // Let explicit API routes handle their own paths
  if (req.path.startsWith("/meta/") || req.path.startsWith("/run/")) {
    return next();
  }

  res.sendFile(path.join(consolePath, "index.html"));
});

// ===============================================
// Start server
// ===============================================

app.listen(PORT, () => {
  const count = Object.keys(toolsRegistry).length;
  console.log(
    `[core-api] AURA Core Monolith listening on http://localhost:${PORT} (tools: ${count})`
  );
});
