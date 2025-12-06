// src/server.js
// ===============================================
// AURA Core API (Monolith)
// - Single gateway and single process
// - All tools are just JS modules (no extra ports)
// - Clients (Postman / Framer / Shopify) hit this:
//     POST http://localhost:4999/run/:toolKey
//   e.g. POST http://localhost:4999/run/product-seo
// ===============================================

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

dotenv.config();

const tools = require("./core/tools-registry");

const PORT = Number(process.env.PORT) || 4999;

const app = express();

// ---------- middleware ----------
app.use(cors());
app.use(bodyParser.json({ limit: "2mb" }));

// ---------- helpers ----------
function listToolKeys() {
  return Object.keys(tools).sort();
}

// ---------- routes ----------

// Simple welcome
app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "AURA Core API (monolith)",
    port: PORT,
    tools: listToolKeys(),
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "AURA Core API (monolith)",
    port: PORT,
    tools: listToolKeys(),
    env: {
      node_env: process.env.NODE_ENV || "development",
      openai_enabled: !!process.env.OPENAI_API_KEY,
    },
  });
});

// Main entry: POST /run/:toolKey
app.post("/run/:toolKey", async (req, res) => {
  const toolKey = req.params.toolKey;
  const tool = tools[toolKey];

  if (!tool || typeof tool.run !== "function") {
    return res.status(404).json({
      ok: false,
      error: `Unknown AURA tool '${toolKey}'.`,
      knownTools: listToolKeys(),
    });
  }

  const payload = req.body || {};
  const started = Date.now();

  try {
    const result = await tool.run(payload, {
      toolKey,
      startedAt: new Date().toISOString(),
      env: process.env,
    });

    res.json({
      ok: true,
      tool: toolKey,
      time_ms: Date.now() - started,
      result,
    });
  } catch (err) {
    console.error(`[Core] Tool '${toolKey}' error:`, err);

    res.status(500).json({
      ok: false,
      tool: toolKey,
      error: err?.message || "Tool threw an error.",
      stack: process.env.NODE_ENV === "development" ? err?.stack : undefined,
    });
  }
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: "Route not found on AURA Core API.",
    path: req.path,
  });
});

// ---------- start server ----------
app.listen(PORT, () => {
  console.log(
    `[Core] AURA Core API listening on http://localhost:${PORT} (tools: ${listToolKeys().length})`
  );
});
