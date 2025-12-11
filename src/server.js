/**
 * AURA Systems • Core Monolith API
 * Unified gateway for all AURA tools (Product SEO, UGC Engine, etc.)
 */

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs-extra";
import path from "path";

import toolsRegistry from "./core/tools-registry.cjs";

dotenv.config();
const app = express();

// -----------------------------
// Global Middleware
// -----------------------------

// Enable JSON parsing for incoming requests
app.use(bodyParser.json());

// Enable secure, explicit CORS headers
app.use(cors({
  origin: "*", // allow all origins for now — restrict later if needed
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// -----------------------------
// Routes
// -----------------------------

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "AURA Core Monolith API is online.",
    environment: process.env.NODE_ENV || "development",
    tools: Object.keys(toolsRegistry).length
  });
});

// Generic tool runner
app.post("/run/:tool", async (req, res) => {
  const toolId = req.params.tool;
  const input = req.body;

  const tool = toolsRegistry[toolId];
  if (!tool) {
    return res.status(404).json({ ok: false, error: `Tool '${toolId}' not found.` });
  }

  try {
    const result = await tool.run(input);
    res.json({
      ok: true,
      tool: toolId,
      environment: process.env.NODE_ENV || "development",
      result
    });
  } catch (err) {
    console.error(`[Error] Tool ${toolId}:`, err);
    res.status(500).json({
      ok: false,
      error: err.message || "Internal server error",
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
  }
});

// -----------------------------
// Server Start
// -----------------------------

const PORT = process.env.PORT || 4999;
app.listen(PORT, () => {
  console.log(
    `[Core] AURA Core API running at http://localhost:${PORT} | Tools loaded: ${Object.keys(toolsRegistry).length}`
  );
});

export default app;
