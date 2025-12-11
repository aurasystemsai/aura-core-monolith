// src/server.js
// ===============================================
// AURA Core API (monolith)
// - Single gateway in front of all AURA tools
// - Console / Shopify / Framer talk ONLY to this
// ===============================================

const path = require("path");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

// Load .env
dotenv.config();

// ---------- config ----------

// Use dedicated env var so it doesn't clash with other projects
const PORT = Number(process.env.PORT || process.env.AURA_CORE_API_PORT || 4999);

// Tools registry (CommonJS)
const toolsRegistry = require("./core/tools-registry.cjs");

// ---------- app setup ----------

const app = express();

// CORS config so Framer / AURA site / Shopify can call the Core API
const allowedOrigins = [
  // Local dev
  "http://localhost:4999",
  "http://localhost:5173",

  // Render Core API
  "https://aura-core-monolith.onrender.com",

  // AURA site (Framer)
  "https://aurasystemsai.com",
  "https://www.aurasystemsai.com",

  // DTP store
  "https://dtpjewellry.com",
  "https://www.dtpjewellry.com"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow server-to-server / curl / Postman (no origin header)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }

      console.warn("[CORS] Blocked origin:", origin);
      return callback(null, false);
    },
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization,x-core-client"
  })
);

// Pre-flight
app.options("*", cors());

app.use(bodyParser.json());

// ---------- API routes ----------

// Health check
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    status: "ok",
    env: process.env.NODE_ENV || "development",
    tools: Object.keys(toolsRegistry).length
  });
});

// List all available tools (for the console UI) with basic metadata
app.get("/tools", (req, res) => {
  const tools = Object.entries(toolsRegistry).map(([id, mod]) => {
    const meta = (mod && mod.meta) || {};

    return {
      id,
      name: meta.name || mod.key || id,
      category: meta.category || "General",
      description: meta.description || "No description yet."
    };
  });

  res.json({
    ok: true,
    count: tools.length,
    tools
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
      knownTools: Object.keys(toolsRegistry)
    });
  }

  try {
    const ctx = {
      env: process.env,
      environment: process.env.NODE_ENV || "development"
      // later: auth, user, shop, etc.
    };

    const result = await tool.run(input, ctx);

    res.json({
      ok: true,
      tool: toolKey,
      result
    });
  } catch (err) {
    console.error("Unhandled error in AURA tool:", toolKey, err);
    res.status(500).json({
      ok: false,
      error: err.message || "Unhandled error in AURA Core API tool."
    });
  }
});

// ---------- console static UI ----------

// Path to built console UI (Vite build output)
const consoleBuildPath = path.join(__dirname, "..", "aura-console", "dist");

// Serve static files (JS/CSS/assets) for the console
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
