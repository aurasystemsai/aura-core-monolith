// src/routes/fix-queue.js
// -------------------------------------
// Fix Queue API Routes
// -------------------------------------

const express = require("express");
const router = express.Router();

const fixQueue = require("../core/fix-queue");

// LIST
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

// ADD (UPSERT BY projectId+url)
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

// UPDATE (OWNER / NOTES / STATUS / SUGGESTIONS)
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

// BACKWARDS-COMPAT: DONE endpoint (your UI currently calls this)
router.post("/projects/:projectId/fix-queue/:id/done", (req, res) => {
  const projectId = req.params.projectId;
  const id = req.params.id;

  try {
    fixQueue.updateFixQueueItem(projectId, id, { status: "done" });
    return res.json({ ok: true, projectId, id: Number(id) });
  } catch (err) {
    console.error("[FixQueue] done error", err);
    return res.status(400).json({
      ok: false,
      error: err.message || "Failed to mark done",
    });
  }
});

// BULK DONE
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

// DEDUPE
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

// AUTO-FIX (AI suggestions)
router.post("/projects/:projectId/fix-queue/:id/auto-fix", async (req, res) => {
  const projectId = req.params.projectId;
  const id = req.params.id;

  try {
    const { brand, tone, market } = req.body || {};
    const result = await fixQueue.autoFixItem(projectId, id, { brand, tone, market });

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

module.exports = router;
