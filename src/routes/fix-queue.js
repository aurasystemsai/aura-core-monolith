// src/routes/fix-queue.js
// -------------------------------------
// Fix Queue API Routes
// -------------------------------------

const express = require("express");
const router = express.Router();

const fixQueue = require("../core/fix-queue");

function getUpdatedBy(req) {
  const h = req.headers["x-aura-user"];
  return h ? String(h).trim() : null;
}

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
    fixQueue.updateFixQueueItem(projectId, id, req.body || {}, { updatedBy: getUpdatedBy(req) });
    return res.json({ ok: true, projectId, id: Number(id) });
  } catch (err) {
    console.error("[FixQueue] patch error", err);
    return res.status(400).json({
      ok: false,
      error: err.message || "Failed to update fix queue item",
    });
  }
});

// BACKWARDS-COMPAT: DONE endpoint (UI calls this)
router.post("/projects/:projectId/fix-queue/:id/done", (req, res) => {
  const projectId = req.params.projectId;
  const id = req.params.id;

  try {
    fixQueue.updateFixQueueItem(projectId, id, { status: "done" }, { updatedBy: getUpdatedBy(req) });
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
    const result = fixQueue.bulkMarkDone(projectId, ids, { updatedBy: getUpdatedBy(req) });
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
    const result = fixQueue.dedupeFixQueue(projectId, { updatedBy: getUpdatedBy(req) });
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
    const result = await fixQueue.autoFixItem(projectId, id, {
      brand,
      tone,
      market,
      updatedBy: getUpdatedBy(req),
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

// BULK AUTO-FIX (suggestions)
router.post("/projects/:projectId/fix-queue/bulk-auto-fix", async (req, res) => {
  const projectId = req.params.projectId;

  try {
    const { ids, brand, tone, market } = req.body || {};
    const result = await fixQueue.bulkAutoFix(projectId, ids, {
      brand,
      tone,
      market,
      updatedBy: getUpdatedBy(req),
    });

    return res.json({ ok: true, projectId, ...result });
  } catch (err) {
    console.error("[FixQueue] bulk auto-fix error", err);
    return res.status(400).json({
      ok: false,
      error: err.message || "Failed bulk auto-fix",
    });
  }
});

// APPLY (enqueue write-back for Framer plugin)
router.post("/projects/:projectId/fix-queue/:id/apply", (req, res) => {
  const projectId = req.params.projectId;
  const id = req.params.id;

  try {
    const { target, field, value } = req.body || {};
    if (String(target || "") !== "framer") {
      return res.status(400).json({ ok: false, error: "target must be 'framer' for now" });
    }

    const result = fixQueue.enqueueApplyToFramer(projectId, id, {
      field,
      value,
      updatedBy: getUpdatedBy(req),
    });

    return res.json({ ok: true, projectId, ...result });
  } catch (err) {
    console.error("[FixQueue] apply enqueue error", err);
    return res.status(400).json({
      ok: false,
      error: err.message || "Failed to enqueue apply",
    });
  }
});

// FRAMER APPLY QUEUE (plugin reads this)
router.get("/projects/:projectId/framer-apply-queue", (req, res) => {
  const projectId = req.params.projectId;
  const { status, limit } = req.query;

  try {
    const result = fixQueue.listApplyQueue(projectId, {
      status: status || "open",
      limit: limit !== undefined ? Number(limit) : 200,
    });
    return res.json({ ok: true, projectId, ...result });
  } catch (err) {
    console.error("[FixQueue] list apply queue error", err);
    return res.status(400).json({
      ok: false,
      error: err.message || "Failed to list apply queue",
    });
  }
});

// FRAMER APPLY QUEUE MARK (plugin reports applied/failed)
router.post("/projects/:projectId/framer-apply-queue/:queueId/mark", (req, res) => {
  const projectId = req.params.projectId;
  const queueId = req.params.queueId;
  const { status, error } = req.body || {};

  try {
    const result = fixQueue.markApplyQueueItem(projectId, queueId, { status, error });
    return res.json({ ok: true, projectId, ...result });
  } catch (err) {
    console.error("[FixQueue] mark apply queue error", err);
    return res.status(400).json({
      ok: false,
      error: err.message || "Failed to mark apply queue item",
    });
  }
});

// AUDIT (per item)
router.get("/projects/:projectId/fix-queue/:id/audit", (req, res) => {
  const projectId = req.params.projectId;
  const id = req.params.id;
  const { limit } = req.query;

  try {
    const result = fixQueue.getAudit(projectId, id, {
      limit: limit !== undefined ? Number(limit) : 200,
    });
    return res.json({ ok: true, projectId, ...result });
  } catch (err) {
    console.error("[FixQueue] audit error", err);
    return res.status(400).json({
      ok: false,
      error: err.message || "Failed to fetch audit",
    });
  }
});

module.exports = router;
