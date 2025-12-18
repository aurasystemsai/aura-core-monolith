// src/routes/fix-queue.js
// -------------------------------------
// Fix Queue Routes
// -------------------------------------

const express = require("express");
const router = express.Router();

// IMPORTANT: correct path + filename (kebab-case)
const fixQueueCore = require("../core/fix-queue");

// POST /projects/:projectId/fix-queue
// Body: { url: string, issues: string[] }
router.post("/projects/:projectId/fix-queue", (req, res) => {
  const projectId = req.params.projectId;

  try {
    const { url, issues } = req.body || {};
    const item = fixQueueCore.addToFixQueue(projectId, { url, issues });

    return res.json({
      ok: true,
      projectId,
      item,
    });
  } catch (err) {
    console.error("[FixQueue] add error", err);
    return res.status(400).json({
      ok: false,
      error: err.message || "Failed to add to fix queue",
    });
  }
});

// GET /projects/:projectId/fix-queue
// Optional query: ?status=open|done
router.get("/projects/:projectId/fix-queue", (req, res) => {
  const projectId = req.params.projectId;

  try {
    const { status } = req.query;
    const items = fixQueueCore.listFixQueue(projectId, { status });

    return res.json({
      ok: true,
      projectId,
      items,
    });
  } catch (err) {
    console.error("[FixQueue] list error", err);
    return res.status(400).json({
      ok: false,
      error: err.message || "Failed to fetch fix queue",
    });
  }
});

// POST /projects/:projectId/fix-queue/:id/done
router.post("/projects/:projectId/fix-queue/:id/done", (req, res) => {
  const projectId = req.params.projectId;
  const id = req.params.id;

  try {
    const result = fixQueueCore.markDone(projectId, id);
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

// POST /projects/:projectId/fix-queue/:id/remove
router.post("/projects/:projectId/fix-queue/:id/remove", (req, res) => {
  const projectId = req.params.projectId;
  const id = req.params.id;

  try {
    const result = fixQueueCore.removeItem(projectId, id);
    return res.json({
      ok: true,
      projectId,
      id: Number(id),
      ...result,
    });
  } catch (err) {
    console.error("[FixQueue] remove error", err);
    return res.status(400).json({
      ok: false,
      error: err.message || "Failed to remove item",
    });
  }
});

// POST /projects/:projectId/fix-queue/dedupe
router.post("/projects/:projectId/fix-queue/dedupe", (req, res) => {
  const projectId = req.params.projectId;

  try {
    const result = fixQueueCore.dedupeFixQueue(projectId);
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
