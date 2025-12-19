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

// NEW: Auto-fetch title/meta for ingestion
const { fetchPageMeta } = require("./core/fetchPageMeta");

// NEW: Drafts API routes (Draft Library)
const draftsRoutes = require("./routes/drafts");

// NEW: Fix Queue API routes
const fixQueueRoutes = require("./routes/fix-queue");

// NEW: Make Webhook forwarder routes
const makeRoutes = require("./routes/make");

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
    `[Core] ${req.method} ${req.url} ${req.headers["x-aura-project-id"] || ""}`
  );
  next();
});

// ---------- API ROUTES (must be before static + catch-all) ----------

// Draft Library API
app.use(draftsRoutes);

// Fix Queue API
app.use(fixQueueRoutes);

// Make Integration API (forward to Make webhooks)
app.use(makeRoutes);

// ---------- HEALTH CHECK ----------

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "aura-core-monolith",
    env: process.env.NODE_ENV || "production",
    timestamp: new Date().toISOString(),
    integrations: {
      makeApplyFixQueueWebhookConfigured: !!process.env.MAKE_APPLY_FIX_QUEUE_WEBHOOK,
    },
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
 *
 * NEW BEHAVIOUR:
 * - If title/metaDescription are missing, Core will fetch the URL and attempt
 *   to fill them automatically before saving (beginner-friendly).
 */
app.post("/projects/:projectId/content/batch", async (req, res) => {
  const projectId = req.params.projectId;

  try {
    const { items } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "items[] array is required",
      });
    }

    // Normalise + enrich missing title/meta (with small concurrency limit)
    const concurrency = 5;
    let autoFilledTitle = 0;
    let autoFilledMeta = 0;
    let fetchErrors = 0;

    const queue = items.slice();
    const enriched = [];

    const worker = async () => {
      while (queue.length) {
        const item = queue.shift();
        if (!item || typeof item !== "object") {
          enriched.push(item);
          continue;
        }

        const next = { ...item };

        const hasUrl = !!next.url;
        const needsTitle = !next.title || String(next.title).trim() === "";
        const needsMeta =
          !next.metaDescription || String(next.metaDescription).trim() === "";

        if (hasUrl && (needsTitle || needsMeta)) {
          const fetched = await fetchPageMeta(String(next.url).trim());
          if (fetched.ok) {
            if (needsTitle && fetched.title) {
              next.title = fetched.title;
              autoFilledTitle += 1;
            }
            if (needsMeta && fetched.metaDescription) {
              next.metaDescription = fetched.metaDescription;
              autoFilledMeta += 1;
            }
          } else {
            fetchErrors += 1;
          }
        }

        enriched.push(next);
      }
    };

    const workers = Array.from({ length: concurrency }, () => worker());
    await Promise.all(workers);

    const result = contentCore.upsertContentItems(projectId, enriched);

    return res.json({
      ok: true,
      projectId,
      inserted: result.inserted,
      enriched: {
        autoFilledTitle,
        autoFilledMeta,
        fetchErrors,
      },
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
        maxScore !== undefined && maxScore !== "" ? Number(maxScore) : 70,
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
      "==> Your service is live\n" +
      `==> Available at your primary URL ${
        process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`
      }\n`
  );
});
