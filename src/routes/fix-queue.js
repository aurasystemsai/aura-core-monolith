"use strict";

const express = require("express");
const fixQueueCore = require("../core/fix-queue");

const router = express.Router();

/**
 * POST /projects/:projectId/fix-queue
 */
router.post("/projects/:projectId/fix-queue", (req, res) => {
  const projectId = req.params.projectId;
  const { url, issues } = req.body || {};

  try {
    const result = fixQueueCore.addToFixQueue(projectId, url, issues);
    return res.json({ ok: true, result });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      ok: false,
      error: err.message || "Failed to add to Fix Queue",
    });
  }
});

/**
 * GET /projects/:projectId/fix-queue
 * ?status=open|fixed|ignored
 */
router.get("/projects/:projectId/fix-queue", (req, res) => {
  const projectId = req.params.projectId;
  const { status } = req.query;

  try {
    const items = fixQueueCore.listFixQueue(projectId, status);
    return res.json({ ok: true, items });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Failed to list Fix Queue",
    });
  }
});

/**
 * PATCH /projects/:projectId/fix-queue/:id
 */
router.patch("/projects/:projectId/fix-queue/:id", (req, res) => {
  const projectId = req.params.projectId;
  const { id } = req.params;
  const { status } = req.body || {};

  try {
    const result = fixQueueCore.updateFixStatus(projectId, id, status);
    return res.json({ ok: true, result });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      ok: false,
      error: err.message || "Failed to update Fix Queue item",
    });
  }
});

module.exports = router;
