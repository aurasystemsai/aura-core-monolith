// src/routes/fix-queue.js
"use strict";

const express = require("express");
const fixQueueCore = require("../core/fix-queue");

const router = express.Router();

/**
 * POST /projects/:projectId/fix-queue
 * Body:
 * {
 *   url: "https://example.com/page",
 *   issues: ["NO_TITLE", "META_TOO_SHORT"]
 * }
 */
router.post("/projects/:projectId/fix-queue", (req, res) => {
  const projectId = req.params.projectId;
  const { url, issues } = req.body || {};

  if (!url || !Array.isArray(issues) || !issues.length) {
    return res.status(400).json({
      ok: false,
      error: "url and issues[] are required",
    });
  }

  try {
    const result = fixQueueCore.addIssues(projectId, url, issues);
    return res.json({
      ok: true,
      projectId,
      result,
    });
  } catch (err) {
    console.error("[FixQueue] add error", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to add to fix queue",
    });
  }
});

/**
 * GET /projects/:projectId/fix-queue
 */
router.get("/projects/:projectId/fix-queue", (req, res) => {
  const projectId = req.params.projectId;

  try {
    const rows = fixQueueCore.listFixQueue(projectId);
    return res.json({
      ok: true,
      projectId,
      items: rows,
    });
  } catch (err) {
    console.error("[FixQueue] list error", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to load fix queue",
    });
  }
});

/**
 * PATCH /projects/:projectId/fix-queue/:id
 * Body: { status: "open" | "fixed" | "ignored" }
 */
router.patch("/projects/:projectId/fix-queue/:id", (req, res) => {
  const projectId = req.params.projectId;
  const { id } = req.params;
  const { status } = req.body || {};

  if (!["open", "fixed", "ignored"].includes(status)) {
    return res.status(400).json({
      ok: false,
      error: "Invalid status",
    });
  }

  try {
    const ok = fixQueueCore.updateStatus(projectId, id, status);
    return res.json({ ok });
  } catch (err) {
    console.error("[FixQueue] update error", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to update status",
    });
  }
});

module.exports = router;
