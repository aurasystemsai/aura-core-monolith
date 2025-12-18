// src/routes/fix-queue.js
// -------------------------------------
// Fix Queue API routes
// -------------------------------------

const express = require("express");
const {
  addFixQueueItem,
  listFixQueueItems,
  markFixQueueDone,
  removeFixQueueItem,
  dedupeFixQueue,
} = require("../core/fixQueue");

const router = express.Router();

/**
 * POST /projects/:projectId/fix-queue
 * Body: { url: string, issues?: string[] }
 * Adds (deduped) queue item.
 */
router.post("/projects/:projectId/fix-queue", (req, res) => {
  const { projectId } = req.params;

  try {
    const { url, issues } = req.body || {};
    const item = addFixQueueItem(projectId, { url, issues });

    return res.json({
      ok: true,
      projectId,
      item,
    });
  } catch (err) {
    console.error("[FixQueue] add error", err);
    return res.status(400).json({
      ok: false,
      error: err.message || "Failed to add fix queue item",
    });
  }
});

/**
 * GET /projects/:projectId/fix-queue
 * Query: status=open|done (default open), limit=number (default 200)
 */
router.get("/projects/:projectId/fix-queue", (req, res) => {
  const { projectId } = req.params;
  const { status, limit } = req.query;

  try {
    const items = listFixQueueItems(projectId, {
      status: status || "open",
      limit: limit !== undefined ? Number(limit) : 200,
    });

    return res.json({
      ok: true,
      projectId,
      items,
    });
  } catch (err) {
    console.error("[FixQueue] list error", err);
    return res.status(400).json({
      ok: false,
      error: err.message || "Failed to list fix queue items",
    });
  }
});

/**
 * POST /projects/:projectId/fix-queue/:id/done
 * Marks a queue item as done.
 */
router.post("/projects/:projectId/fix-queue/:id/done", (req, res) => {
  const { projectId, id } = req.params;

  try {
    const result = markFixQueueDone(projectId, id);
    return res.json({
      ok: true,
      projectId,
      id: Number(id),
      ...result,
    });
  } catch (err) {
    console.error("[FixQueue] done error", err);
    return res.status(400).json({
      ok: false,
      error: err.message || "Failed to mark done",
    });
  }
});

/**
 * DELETE /projects/:projectId/fix-queue/:id
 * Removes a queue item (optional, but useful).
 */
router.delete("/projects/:projectId/fix-queue/:id", (req, res) => {
  const { projectId, id } = req.params;

  try {
    const result = removeFixQueueItem(projectId, id);
    return res.json({
      ok: true,
      projectId,
      id: Number(id),
      ...result,
    });
  } catch (err) {
    console.error("[FixQueue] delete error", err);
    return res.status(400).json({
      ok: false,
      error: err.message || "Failed to delete fix queue item",
    });
  }
});

/**
 * POST /projects/:projectId/fix-queue/dedupe
 * One-off cleanup for old duplicates already in DB.
 */
router.post("/projects/:projectId/fix-queue/dedupe", (req, res) => {
  const { projectId } = req.params;

  try {
    const result = dedupeFixQueue(projectId);
    return res.json({
      ok: true,
      projectId,
      ...result,
    });
  } catch (err) {
    console.error("[FixQueue] dedupe error", err);
    return res.status(400).json({
      ok: false,
      error: err.message || "Failed to dedupe fix queue",
    });
  }
});

module.exports = router;
