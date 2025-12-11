// ===============================================
// AURA Core API (Monolith)
// - Unified gateway for all AURA tools
// - Console / Shopify / Framer connect only here
// ===============================================

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import toolsRegistry from "./core/tools-registry.js";

// ---------- setup ----------

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || process.env.AURA_CORE_API_PORT || 4999);

// ---------- app ----------

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ---------- routes ----------

// Health check
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    status: "ok",
    env: process.env.NODE_ENV || "development",
    tools: Object.keys(toolsRegistry).length,
  });
});

// List all tools for the Console UI
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

const consoleBuildPath = path.join(__dirname, "aura-console", "dist");
app.use(express.static(consoleBuildPath));

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

export default app;
