// src/server.js
// ===============================================
// AURA Core Monolith API
// - Single gateway in front of all AURA tools
// - Deployed on Render, talks ONLY via /run/:tool
// ===============================================

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

dotenv.config();

// ---------- config ----------

const PORT = Number(process.env.PORT) || 10000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Load all tools from the registry
const tools = require("./core/tools-registry");

// ---------- helpers ----------

function logToolRequest({ toolKey, status, durationMs, error }) {
  const base = `[Core] tool=${toolKey} status=${status} duration=${durationMs}ms`;

  if (error) {
    // Log error details to stderr so Render flags it properly
    console.error(`${base} error=${error.message || error}`);
  } else {
    console.log(base);
  }
}

function buildCtx() {
  return {
    env: NODE_ENV,
    now: new Date().toISOString(),
  };
}

// ---------- app ----------

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Simple health check
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    message: "AURA Core API healthy",
    env: NODE_ENV,
    tools: Object.keys(tools),
  });
});

// Generic tool runner
app.post("/run/:tool", async (req, res) => {
  const toolKey = String(req.params.tool || "").trim();
  const payload = req.body || {};
  const tool = tools[toolKey];

  const start = Date.now();

  if (!tool) {
    const durationMs = Date.now() - start;
    logToolRequest({ toolKey, status: "NOT_FOUND", durationMs });

    return res.status(404).json({
      ok: false,
      error: `Unknown AURA tool '${toolKey}'.`,
      knownTools: Object.keys(tools),
      time_ms: durationMs,
    });
  }

  try {
    const ctx = buildCtx();
    const result = await tool.run(payload, ctx);

    const durationMs = Date.now() - start;
    logToolRequest({ toolKey, status: "OK", durationMs });

    res.json({
      ok: true,
      tool: toolKey,
      time_ms: durationMs,
      result,
    });
  } catch (err) {
    const durationMs = Date.now() - start;
    logToolRequest({ toolKey, status: "ERROR", durationMs, error: err });

    res.status(500).json({
      ok: false,
      tool: toolKey,
      time_ms: durationMs,
      error: err.message || "Unhandled error in AURA Core API tool runner.",
    });
  }
});

// ---------- start ----------

app.listen(PORT, () => {
  console.log(
    `[Core] AURA Core API listening on http://localhost:${PORT} (env=${NODE_ENV}, tools=${Object.keys(
      tools
    ).length})`
  );
});
