// src/server.js
// ----------------------------------------
// AURA Core Monolith API
// ----------------------------------------

const path = require("path");
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

dotenv.config();

const { getTool } = require("./core/tools-registry.cjs");
const projectsCore = require("./core/projects");
const contentCore = require("./core/content");

// NEW: Drafts API routes (Draft Library)
const draftsRoutes = require("./routes/drafts");

const app = express();
const PORT = process.env.PORT || 10000;

// ---------- MIDDLEWARE ----------

app.use(cors());
app.use(
  bodyParser.json({
    limit: "1mb",
  })
);

// Simple request logging
app.use((req, _res, next) => {
  console.log(
    `[Core] ${req.method} ${req.url} ${
      req.headers["x-aura-project-id"] || ""
    }`
  );
  next();
});

// ---------- API ROUTES (must be before static + catch-all) ----------

// Draft Library API
app.use(draftsRoutes);

// ---------- HEALTH CHECK ----------

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "aura-core-monolith",
    env: process.env.NODE_ENV || "production",
    timestamp: new Date().toISOString(),
  });
});

// ---------- PROJECTS API (Connect Store) ----------

// Create a new project from the Connect Store screen
app.post("/projects", (req, res) => {
  try {
    const { name, domain, platform } = req.body || {};

    if (!name || !domain) {
      return res.status(400).json({
        ok: false,
        error: "name and domain are required",
      });
    }

    const project = projectsCore.createProject({
      name: String(name).trim(),
      domain: String(domain).trim(),
      platform: (platform || "other").trim(),
    });

    return res.json({
      ok: true,
      project,
    });
  } catch (err) {
    console.error("[Core] Error creating project", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to create project",
    });
  }
});

// List all projects (used by console project switcher)
app.get("/projects", (_req, res) => {
  try {
    const projects = projectsCore.listProjects();
    return res.json({
      ok: true,
      projects,
    });
  } catch (err) {
    console.error("[Core] Error listing projects", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to list projects",
    });
  }
});

// ---------- CONTENT SEO API (generic, not just shops) ----------

/**
 * POST /projects/:projectId/content/batch
 *
 * Ingest / update content items for a project.
 * Used by any platform to push pages/posts/products into AURA.
 *
 * Body:
 * {
 *   "items": [
 *     {
 *       "type": "blog",          // optional, default "other"
 *       "platform": "wordpress", // optional
 *       "externalId": "123",     // optional
 *       "url": "https://site.com/blog/post-1",
 *       "title": "How to style waterproof jewellery",
 *       "metaDescription": "Our guide to styling waterproof jewellery…",
 *       "h1": "How to style waterproof jewellery",
 *       "bodyExcerpt": "In this guide we cover…",
 *       "raw": { ... }           // optional, raw source row
 *     }
 *   ]
 * }
 */
app.post("/projects/:projectId/content/batch", (req, res) => {
  const projectId = req.params.projectId;

  try {
    const { items } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "items[] array is required",
      });
    }

    const result = contentCore.upsertContentItems(projectId, items);

    return res.json({
      ok: true,
      projectId,
      inserted: result.inserted,
    });
  } catch (err) {
    console.error("[Core] Error in content batch", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to upsert content items",
    });
  }
});

/**
 * GET /projects/:projectId/content/health
 *
 * Returns "bad SEO" items for that project so the user knows what to fix.
 *
 * Query params:
 *  - type     (optional): product | blog | landing | category | docs | other
 *  - maxScore (optional): number (default 70) – return items at or below this score
 *  - limit    (optional): number (default 100)
 */
app.get("/projects/:projectId/content/health", (req, res) => {
  const projectId = req.params.projectId;
  const { type, maxScore, limit } = req.query;

  try {
    const items = contentCore.getContentHealth({
      projectId,
      type: type || undefined,
      maxScore:
        maxScore !== undefined && maxScore !== ""
          ? Number(maxScore)
          : 70,
      limit:
        limit !== undefined && limit !== "" ? Number(limit) : 100,
    });

    return res.json({
      ok: true,
      projectId,
      type: type || null,
      maxScore: maxScore !== undefined ? Number(maxScore) : 70,
      limit: limit !== undefined ? Number(limit) : 100,
      items,
    });
  } catch (err) {
    console.error("[Core] Error in content health", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to fetch content health",
    });
  }
});

// ---------- TOOL RUN ROUTE ----------

app.post("/run/:toolId", async (req, res) => {
  const toolId = req.params.toolId;
  const projectId = req.headers["x-aura-project-id"];

  try {
    const tool = getTool(toolId);
    const input = req.body || {};

    const ctx = {
      environment: process.env.NODE_ENV || "production",
      projectId: projectId || null,
    };

    const result = await tool.run(input, ctx);

    return res.json({
      ok: true,
      toolId,
      result,
    });
  } catch (err) {
    console.error(`[Core] Tool error: ${toolId}`, err);

    return res.status(500).json({
      ok: false,
      error: err.message || "Tool run failed",
    });
  }
});

// ---------- STATIC CONSOLE (built React app) ----------

const consoleDist = path.join(__dirname, "..", "aura-console", "dist");

app.use(express.static(consoleDist));

app.get("*", (_req, res) => {
  res.sendFile(path.join(consoleDist, "index.html"));
});

// ---------- START SERVER ----------

app.listen(PORT, () => {
  console.log(
    `[Core] AURA Core API running on port ${PORT}\n` +
      "==> Your service is live 🎉\n" +
      `==> Available at your primary URL ${
        process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`
      }\n`
  );
});
