// src/server.js
// ===============================================
// AURA Core Monolith
// - Single gateway in front of all AURA tools
// - Shopify app, Framer, Console talk ONLY to this
// ===============================================

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

// ---------- config ----------

// Dedicated env var so it doesn't clash with other projects
const PORT = Number(
  process.env.AURA_CORE_API_PORT || process.env.PORT || 4999
);

// Map of toolId -> tool module
// Each tool module exports: { key, run(input, ctx) }
const toolsRegistry = require("./core/tools-registry");

// ---------- app setup ----------

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "1mb" }));

// Simple health check
app.get("/healthz", (req, res) => {
  res.json({
    ok: true,
    service: "aura-core-monolith",
    port: PORT,
    tools: Object.keys(toolsRegistry),
  });
});

// ---------- meta route: list tools ----------

app.get("/meta/tools", (req, res) => {
  try {
    const tools = Object.keys(toolsRegistry).map((id) => {
      const mod = toolsRegistry[id] || {};
      return {
        id,
        key: mod.key || id,
        stub: Boolean(mod.stub),
      };
    });

    res.json({
      ok: true,
      count: tools.length,
      tools,
    });
  } catch (err) {
    console.error("[core-api] /meta/tools error:", err);
    res.status(500).json({
      ok: false,
      error: err.message || "Unexpected error in /meta/tools",
    });
  }
});

// ---------- run route: /run/:toolId ----------

app.post("/run/:toolId", async (req, res) => {
  const toolId = req.params.toolId;
  const input = req.body || {};

  const tool = toolsRegistry[toolId];

  if (!tool) {
    return res.status(400).json({
      ok: false,
      error: `Unknown AURA tool '${toolId}'.`,
      knownTools: Object.keys(toolsRegistry),
      input,
    });
  }

  try {
    const ctx = {
      env: process.env,
      toolId,
      now: new Date().toISOString(),
    };

    const result = await tool.run(input, ctx);

    res.json({
      ok: true,
      tool: toolId,
      result,
    });
  } catch (err) {
    console.error(`[core-api] /run/${toolId} error:`, err);
    res.status(500).json({
      ok: false,
      tool: toolId,
      error: err.message || "Unexpected error while running tool",
    });
  }
});

// ---------- serve Console build ----------

// Built console output (Vite outDir = "dist")
const consolePath = path.join(process.cwd(), "aura-console", "dist");

// Serve static assets from the console build
app.use(express.static(consolePath));

// SPA fallback: for any GET that isn't an API route, send index.html
app.get("*", (req, res, next) => {
  // Let explicit API routes handle their paths
  if (
    req.path.startsWith("/meta/") ||
    req.path.startsWith("/run/") ||
    req.path === "/healthz"
  ) {
    return next();
  }

  return res.sendFile(path.join(consolePath, "index.html"));
});

// ---------- start server ----------

app.listen(PORT, () => {
  console.log(
    `[core-api] AURA Core Monolith listening on http://localhost:${PORT} (tools: ${Object.keys(
      toolsRegistry
    ).length})`
  );
});
