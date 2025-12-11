// src/server.js
// ===============================================
// AURA Core API (monolith) + Console hosting
// - Single gateway in front of all AURA tools
// - Console / Shopify / Framer talk ONLY to this
// ===============================================

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const path = require("path");

// tools-registry is CommonJS
const toolsRegistry = require("./core/tools-registry.cjs");

dotenv.config();

// ---------- config ----------

const PORT = Number(
  process.env.PORT || process.env.AURA_CORE_API_PORT || 4999
);
const NODE_ENV = process.env.NODE_ENV || "development";

// ---------- app setup ----------

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ---------- API routes ----------

// Health check
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    status: "ok",
    env: NODE_ENV,
    tools: Object.keys(toolsRegistry).length,
  });
});

// List all available tools (for the console UI) with metadata
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

// Run a specific tool
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
      // later: user, auth, etc.
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

// ---------- serve console build ----------

const consoleBuildPath = path.join(__dirname, "..", "aura-console", "dist");

// Serve static files for the console UI
app.use(express.static(consoleBuildPath));

// Any non-API route returns the console's index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(consoleBuildPath, "index.html"));
});

// ---------- start server ----------

app.listen(PORT, () => {
  console.log(
    `[Core] AURA Core API running at http://localhost:${PORT} | Tools loaded: ${
      Object.keys(toolsRegistry).length
    }`
  );
});

module.exports = app;
