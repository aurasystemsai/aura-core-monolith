// src/routes/fix-queue.js
// -------------------------------------
// Fix Queue API routes
// -------------------------------------

const express = require("express");
const router = express.Router();

const fixQueue = require("../core/fixQueue");

/**
 * POST /projects/:projectId/fix-queue
 * Body: { url, issues?: [], owner?: string, notes?: string }
 *
 * Dedupes by (projectId + url) and MERGES issues.
 */
router.post("/projects/:projectId/fix-queue", (req, res) => {
  const projectId = req.params.projectId;

  try {
    const { url, issues, owner, notes } = req.body || {};

    const result = fixQueue.addOrMergeFixItem({
      projectId,
      url,
      issues,
      owner,
      notes,
    });

    if (!result.ok) {
      return res.status(400).json(result);
    }

    return res.json({
      ok: true,
      action: result.action,
      item: result.item,
    });
  } catch (err) {
    console.error("[FixQueue] POST error", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to add to Fix Queue",
    });
  }
});

/**
 * GET /projects/:projectId/fix-queue?status=open|done&limit=200
 */
router.get("/projects/:projectId/fix-queue", (req, res) => {
  const projectId = req.params.projectId;
  const { status, limit } = req.query;

  try {
    const items = fixQueue.listFixQueue({
      projectId,
      status: status || "open",
      limit: limit || 200,
    });

    return res.json({
      ok: true,
      projectId,
      status: status || "open",
      count: items.length,
      items,
    });
  } catch (err) {
    console.error("[FixQueue] GET error", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to fetch Fix Queue",
    });
  }
});

/**
 * POST /projects/:projectId/fix-queue/:id/done
 * Marks item done.
 */
router.post("/projects/:projectId/fix-queue/:id/done", (req, res) => {
  const projectId = req.params.projectId;
  const id = req.params.id;

  try {
    const result = fixQueue.setFixQueueStatus({
      projectId,
      id,
      status: "done",
    });

    if (!result.ok) {
      return res.status(400).json(result);
    }

    return res.json({
      ok: true,
      updated: result.updated,
    });
  } catch (err) {
    console.error("[FixQueue] DONE error", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to mark Fix Queue item done",
    });
  }
});

module.exports = router;
