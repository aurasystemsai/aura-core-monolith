// src/routes/fix-queue.js
// -------------------------------------
// Fix Queue API Routes
// -------------------------------------

const express = require("express");
const router = express.Router();

const fixQueue = require("../core/fix-queue");

function actorFromReq(req) {
  // Optional: pass x-aura-actor from console later (e.g. Darren)
  const h = req.headers["x-aura-actor"];
  return h ? String(h).trim() : "console";
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

// CSV EXPORT
router.get("/projects/:projectId/fix-queue/export.csv", (req, res) => {
  const projectId = req.params.projectId;
  const { status } = req.query;

  try {
    const result = fixQueue.listFixQueue(projectId, {
      status: status || "open",
      limit: 1000,
    });

    const rows = Array.isArray(result.items) ? result.items : [];

    const escapeCsv = (v) => {
      const s = String(v ?? "");
      if (s.includes('"') || s.includes(",") || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const header = [
      "id",
      "url",
      "status",
      "owner",
      "issues",
      "notes",
      "suggestedTitle",
      "suggestedMetaDescription",
      "suggestedH1",
      "lastSuggestedAt",
      "createdAt",
      "updatedAt",
      "doneAt",
    ];

    const lines = [header.join(",")];

    for (const r of rows) {
      lines.push(
        [
          r.id,
          r.url,
          r.status,
          r.owner || "",
          (Array.isArray(r.issues) ? r.issues.join("|") : "") || "",
          r.notes || "",
          r.suggestedTitle || "",
          r.suggestedMetaDescription || "",
          r.suggestedH1 || "",
          r.lastSuggestedAt || "",
          r.createdAt || "",
          r.updatedAt || "",
          r.doneAt || "",
        ]
          .map(escapeCsv)
          .join(",")
      );
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="fix-queue-${projectId}.csv"`);
    return res.send(lines.join("\n"));
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
    fixQueue.updateFixQueueItem(projectId, id, req.body || {}, actorFromReq(req));
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
    fixQueue.updateFixQueueItem(projectId, id, { status: "done" }, actorFromReq(req));
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
    const result = fixQueue.bulkMarkDone(projectId, ids, actorFromReq(req));
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
    const result = await fixQueue.autoFixItem(projectId, id, {
      brand,
      tone,
      market,
      actor: actorFromReq(req),
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

// BULK AUTO-FIX
router.post("/projects/:projectId/fix-queue/bulk-auto-fix", async (req, res) => {
  const projectId = req.params.projectId;

  try {
    const { ids, brand, tone, market, concurrency } = req.body || {};
    const result = await fixQueue.bulkAutoFix(projectId, ids, {
      brand,
      tone,
      market,
      concurrency,
      actor: actorFromReq(req),
    });

    return res.json({
      ok: true,
      projectId,
      ...result,
    });
  } catch (err) {
    console.error("[FixQueue] bulk auto-fix error", err);
    return res.status(400).json({
      ok: false,
      error: err.message || "Failed bulk auto-fix",
    });
  }
});

// APPLY SUGGESTION
router.post("/projects/:projectId/fix-queue/:id/apply", (req, res) => {
  const projectId = req.params.projectId;
  const id = req.params.id;

  try {
    const { field } = req.body || {};
    const result = fixQueue.applySuggestion(projectId, id, {
      field,
      actor: actorFromReq(req),
    });

    return res.json({
      ok: true,
      projectId,
      ...result,
    });
  } catch (err) {
    console.error("[FixQueue] apply error", err);
    return res.status(400).json({
      ok: false,
      error: err.message || "Failed to apply suggestion",
    });
  }
});

module.exports = router;
