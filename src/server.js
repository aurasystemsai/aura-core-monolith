// src/server.js
// ===============================================
// AURA Core Monolith API
// - Single gateway in front of all AURA tools
// - Shopify app, Framer, anything else talks ONLY to this
// ===============================================

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

dotenv.config();

// ---------- config ----------

// Dedicated env var for core API so it doesn't clash with other projects
const PORT = Number(
  process.env.AURA_CORE_API_PORT || process.env.PORT || 4999
);

// Map of toolId -> tool module
// Each module exports: { key, run(input, ctx) }
const toolsRegistry = require("./core/tools-registry");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ---------- simple helpers ----------

function getTool(toolId) {
  if (!toolId) return null;
  const id = String(toolId).trim();
  return toolsRegistry[id] || null;
}

// ---------- routes ----------

// Root – simple health/info endpoint
app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "AURA Core Monolith API",
    metaEndpoint: "/meta/tools",
    runEndpoint: "/run/:toolId",
  });
});

// Meta route – list all registered tools
app.get("/meta/tools", (req, res) => {
  try {
    const tools = Object.keys(toolsRegistry).map((id) => {
      const mod = toolsRegistry[id] || {};
      return {
        id,
        name: mod.key || id,
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

// Run a tool
app.post("/run/:toolId", async (req, res) => {
  const { toolId } = req.params;
  const input = req.body || {};

  const tool = getTool(toolId);

  if (!tool) {
    return res.status(400).json({
      ok: false,
      error: `Unknown AURA tool '${toolId}'.`,
      knownTools: Object.keys(toolsRegistry),
    });
  }

  const ctx = {
    env: process.env,
    now: new Date().toISOString(),
  };

  try {
    const result = await tool.run(input, ctx);
    res.json({
      ok: true,
      tool: toolId,
      result,
    });
  } catch (err) {
    console.error(`[core-api] Error running tool '${toolId}':`, err);
    res.status(500).json({
      ok: false,
      tool: toolId,
      error: err.message || "Unexpected error running tool",
    });
  }
});

// ---------- start server ----------

app.listen(PORT, () => {
  const count = Object.keys(toolsRegistry).length;
  console.log(
    `[core-api] AURA Core Monolith listening on http://localhost:${PORT} (tools: ${count})`
  );
});

module.exports = app;
