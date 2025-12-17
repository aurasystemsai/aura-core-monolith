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
const { fetchPageMeta } = require("./core/fetchPageMeta");

// Drafts API routes (Draft Library)
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
 * POST /projects/:projectId/content/refresh
 *
 * Refreshes a single URL by fetching HTML and extracting <title>, meta description, and H1.
 * This helps with platforms where ingest-only URLs have no stored meta yet.
 *
 * Body:
 * { "url": "https://example.com/page", "type": "page" }
 */
app.post("/projects/:projectId/content/refresh", async (req, res) => {
  const projectId = req.params.projectId;

  try {
    const { url, type } = req.body || {};
    if (!url) {
      return res.status(400).json({
        ok: false,
        error: "url is required",
      });
    }

    // Preserve existing row metadata where possible (so refresh never breaks type/platform)
    const existing = contentCore.getContentItemByUrl(projectId, url);

    const fetched = await fetchPageMeta(url);
    if (!fetched.ok) {
      return res.status(502).json({
        ok: false,
        error: "Failed to fetch HTML meta for URL",
        details: fetched,
      });
    }

    // Upsert only non-null fetched values (contentCore uses COALESCE on conflict)
    contentCore.upsertContentItems(projectId, [
      {
        url: fetched.url,
        type: existing?.type || type || "other",
        platform: existing?.platform || null,
        externalId: existing?.externalId || null,
        title: fetched.title,
        metaDescription: fetched.metaDescription,
        h1: fetched.h1,
        raw: {
          fetchedAt: new Date().toISOString(),
          status: fetched.status,
          contentType: fetched.contentType,
          source: "fetchPageMeta",
        },
      },
    ]);

    // Return updated health row for convenience (optional)
    const items = contentCore.getContentHealth({
      projectId,
      type: null,
      maxScore: 100,
      limit: 200,
    });

    const updated = items.find((i) => i.url === fetched.url) || null;

    return res.json({
      ok: true,
      projectId,
      url: fetched.url,
      fetched,
      updated,
    });
  } catch (err) {
    console.error("[Core] Error refreshing content URL", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to refresh URL meta",
    });
  }
});

/**
 * GET /projects/:projectId/content/health
 */
app.get("/projects/:projectId/content/health", (req, res) => {
  const projectId = req.params.projectId;
  const { type, maxScore, limit } = req.query;

  try {
    const items = contentCore.getContentHealth({
      projectId,
      type: type || undefined,
      maxScore: maxScore !== undefined && maxScore !== "" ? Number(maxScore) : 70,
      limit: limit !== undefined && limit !== "" ? Number(limit) : 100,
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
