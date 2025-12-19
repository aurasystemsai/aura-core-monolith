// src/routes/fix-queue.js
// -------------------------------------
// Fix Queue API Routes
// Adds: export.csv, audit, bulk-auto-fix (job + progress polling),
//       job history list, apply suggestion (webhook).
// -------------------------------------

const express = require("express");
const router = express.Router();

const fixQueue = require("../core/fix-queue");

function getUpdatedBy(req) {
  return (
    req.headers["x-aura-user"] ||
    req.headers["x-aura-updated-by"] ||
    (req.body && req.body.updatedBy) ||
    null
  );
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

// JOB HISTORY LIST
router.get("/projects/:projectId/fix-queue/jobs", (req, res) => {
  const projectId = req.params.projectId;
  const { limit } = req.query;

  try {
    const jobs = fixQueue.listJobs(projectId, { limit: limit !== undefined ? Number(limit) : 20 });
    return res.json({ ok: true, projectId, jobs });
  } catch (err) {
    console.error("[FixQueue] jobs list error", err);
    return res.status(400).json({
      ok: false,
      error: err.message || "Failed to list jobs",
    });
  }
});

// EXPORT CSV
router.get("/projects/:projectId/fix-queue/export.csv", (req, res) => {
  const projectId = req.params.projectId;
  const { status } = req.query;

  try {
    const csv = fixQueue.exportFixQueueCsv(projectId, { status: status || "open" });
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="fix-queue-${projectId}.csv"`);
    return res.status(200).send(csv);
  } catch (err) {
    console.error("[FixQueue] export error", err);
    return res.status(400).json({
      ok: false,
      error: err.message || "Failed to export fix queue",
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

// AUTO-FIX (AI suggestions) single item
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

// BULK AUTO-FIX (server-side job)
// POST -> returns jobId immediately
router.post("/projects/:projectId/fix-queue/bulk-auto-fix", (req, res) => {
  const projectId = req.params.projectId;

  try {
    const { ids, brand, tone, market, concurrency, delayMs } = req.body || {};
    const result = fixQueue.createBulkAutoFixJob(projectId, ids, {
      brand,
      tone,
      market,
      concurrency,
      delayMs,
      updatedBy: getUpdatedBy(req),
    });

    return res.json({ ok: true, projectId, ...result });
  } catch (err) {
    console.error("[FixQueue] bulk-auto-fix create error", err);
    return res.status(400).json({
      ok: false,
      error: err.message || "Failed to start bulk auto-fix",
    });
  }
});

// GET job progress
router.get("/projects/:projectId/fix-queue/bulk-auto-fix/:jobId", (req, res) => {
  const projectId = req.params.projectId;
  const jobId = req.params.jobId;
  const { includeItems, itemsLimit } = req.query;

  try {
    const job = fixQueue.getJob(projectId, jobId);
    if (!job) {
      return res.status(404).json({ ok: false, error: "job not found" });
    }

    const payload = { ok: true, projectId, job };

    if (String(includeItems || "") === "1") {
      payload.items = fixQueue.listJobItems(projectId, jobId, {
        limit: itemsLimit !== undefined ? Number(itemsLimit) : 200,
      });
    }

    return res.json(payload);
  } catch (err) {
    console.error("[FixQueue] bulk-auto-fix get error", err);
    return res.status(400).json({
      ok: false,
      error: err.message || "Failed to fetch job",
    });
  }
});

// Cancel job
router.post("/projects/:projectId/fix-queue/bulk-auto-fix/:jobId/cancel", (req, res) => {
  const projectId = req.params.projectId;
  const jobId = req.params.jobId;

  try {
    const result = fixQueue.cancelJob(projectId, jobId);
    return res.json({ ok: true, projectId, ...result });
  } catch (err) {
    console.error("[FixQueue] bulk-auto-fix cancel error", err);
    return res.status(400).json({
      ok: false,
      error: err.message || "Failed to cancel job",
    });
  }
});

// APPLY suggestion (webhook)
router.post("/projects/:projectId/fix-queue/:id/apply", async (req, res) => {
  const projectId = req.params.projectId;
  const id = req.params.id;

  try {
    const { field } = req.body || {};
    const result = await fixQueue.applySuggestion(projectId, id, {
      field,
      updatedBy: getUpdatedBy(req),
    });

    return res.json({ ok: true, projectId, ...result });
  } catch (err) {
    console.error("[FixQueue] apply error", err);
    return res.status(400).json({
      ok: false,
      error: err.message || "Failed to apply suggestion",
    });
  }
});

// AUDIT trail for a specific item
router.get("/projects/:projectId/fix-queue/:id/audit", (req, res) => {
  const projectId = req.params.projectId;
  const id = req.params.id;
  const { limit } = req.query;

  try {
    const items = fixQueue.listAudit(projectId, id, {
      limit: limit !== undefined ? Number(limit) : 200,
    });
    return res.json({ ok: true, projectId, id: Number(id), items });
  } catch (err) {
    console.error("[FixQueue] audit error", err);
    return res.status(400).json({
      ok: false,
      error: err.message || "Failed to load audit trail",
    });
  }
});

module.exports = router;
