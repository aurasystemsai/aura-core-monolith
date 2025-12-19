// src/routes/fix-queue.js
// -------------------------------------
// Fix Queue API Routes
// -------------------------------------

const express = require("express");
const router = express.Router();

const fixQueue = require("../core/fix-queue");

// List fix queue items
// GET /projects/:projectId/fix-queue?status=open|done|all&limit=200
router.get("/projects/:projectId/fix-queue", (req, res) => {
  const projectId = req.params.projectId;
  const { status, limit } = req.query;

  try {
    const result = fixQueue.listFixQueue(projectId, {
      status: status || "open",
      limit: limit !== undefined ? Number(limit) : 200,
    });

    return res.json({
      ok: true,
      projectId,
      ...result,
    });
  } catch (err) {
    console.error("[FixQueue] list error", err);
    return res.status(400).json({
      ok: false,
      error: err.message || "Failed to list fix queue",
    });
  }
});

// Add / upsert an item into fix queue
// POST /projects/:projectId/fix-queue
// Body: { url, issues: [] }
router.post("/projects/:projectId/fix-queue", (req, res) => {
  const projectId = req.params.projectId;

  try {
    const { url, issues } = req.body || {};
    const result = fixQueue.addFixQueueItem(projectId, { url, issues });

    return res.json({
      ok: true,
      projectId,
      ...result,
    });
  } catch (err) {
    console.error("[FixQueue] add error", err);
    return res.status(400).json({
      ok: false,
      error: err.message || "Failed to add to fix queue",
    });
  }
});

// Update an item
// PATCH /projects/:projectId/fix-queue/:id
// Body: { owner?, notes?, status?, issues?, suggestedTitle?, suggestedMetaDescription?, suggestedH1? }
router.patch("/projects/:projectId/fix-queue/:id", (req, res) => {
  const projectId = req.params.projectId;
  const id = req.params.id;

  try {
    fixQueue.updateFixQueueItem(projectId, id, req.body || {});
    return res.json({ ok: true, projectId, id: Number(id) });
  } catch (err) {
    console.error("[FixQueue] patch error", err);
    return res.status(400).json({
      ok: false,
      error: err.message || "Failed to update fix queue item",
    });
  }
});

// Bulk mark done
// POST /projects/:projectId/fix-queue/bulk-done
// Body: { ids: [1,2,3] }
router.post("/projects/:projectId/fix-queue/bulk-done", (req, res) => {
  const projectId = req.params.projectId;

  try {
    const { ids } = req.body || {};
    const result = fixQueue.bulkMarkDone(projectId, ids);
    return res.json({ ok: true, projectId, ...result });
  } catch (err) {
    console.error("[FixQueue] bulk done error", err);
    return res.status(400).json({
      ok: false,
      error: err.message || "Failed to bulk mark done",
    });
  }
});

// Dedupe fix queue (keeps newest updatedAt per URL)
// POST /projects/:projectId/fix-queue/dedupe
router.post("/projects/:projectId/fix-queue/dedupe", (req, res) => {
  const projectId = req.params.projectId;

  try {
    const result = fixQueue.dedupeFixQueue(projectId);
    return res.json({ ok: true, projectId, ...result });
  } catch (err) {
    console.error("[FixQueue] dedupe error", err);
    return res.status(400).json({
      ok: false,
      error: err.message || "Failed to dedupe fix queue",
    });
  }
});

// Auto-fix a single item (AI)
// POST /projects/:projectId/fix-queue/:id/auto-fix
// Body: { brand?, tone?, market? }
router.post("/projects/:projectId/fix-queue/:id/auto-fix", async (req, res) => {
  const projectId = req.params.projectId;
  const id = req.params.id;

  try {
    const { brand, tone, market } = req.body || {};
    const result = await fixQueue.autoFixItem(projectId, id, {
      brand,
      tone,
      market,
    });

    return res.json({
      ok: true,
      projectId,
      ...result,
    });
  } catch (err) {
    console.error("[FixQueue] auto-fix error", err);
    return res.status(400).json({
      ok: false,
      error: err.message || "Failed to generate auto-fix",
    });
  }
});

// Fix Pack (AI) for multiple OPEN items
// POST /projects/:projectId/fix-queue/fixpack
// Body: { limit?, brand?, tone?, market? }
router.post("/projects/:projectId/fix-queue/fixpack", async (req, res) => {
  const projectId = req.params.projectId;

  try {
    const { limit, brand, tone, market } = req.body || {};
    const result = await fixQueue.buildFixPack(projectId, {
      limit: limit !== undefined ? Number(limit) : 250,
      brand,
      tone,
      market,
    });

    return res.json({
      ok: true,
      projectId,
      ...result,
    });
  } catch (err) {
    console.error("[FixQueue] fixpack error", err);
    return res.status(400).json({
      ok: false,
      error: err.message || "Failed to build Fix Pack",
    });
  }
});

module.exports = router;
