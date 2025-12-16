// src/routes/drafts.js
"use strict";

const express = require("express");
const draftsCore = require("../core/drafts");

const router = express.Router();

/**
 * GET /projects/:projectId/drafts
 * Query: limit, offset
 */
router.get("/projects/:projectId/drafts", (req, res) => {
  const projectId = req.params.projectId;
  const { limit, offset } = req.query;

  try {
    const drafts = draftsCore.listDraftsByProject(projectId, limit, offset);
    return res.json({
      ok: true,
      projectId,
      drafts,
    });
  } catch (err) {
    console.error("[Drafts] Error listing drafts", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to list drafts",
    });
  }
});

/**
 * GET /projects/:projectId/drafts/:draftId
 */
router.get("/projects/:projectId/drafts/:draftId", (req, res) => {
  const projectId = req.params.projectId;
  const draftId = req.params.draftId;

  try {
    const draft = draftsCore.getDraftById(projectId, draftId);
    if (!draft) {
      return res.status(404).json({
        ok: false,
        error: "Draft not found",
      });
    }

    return res.json({
      ok: true,
      projectId,
      draft,
    });
  } catch (err) {
    console.error("[Drafts] Error reading draft", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to read draft",
    });
  }
});

/**
 * POST /projects/:projectId/drafts
 *
 * Body:
 * {
 *   toolId: "blog-draft-engine",
 *   createdAt: "ISO" (optional),
 *   title, slug, metaDescription, primaryKeyword (optional),
 *   input: {...} (optional),
 *   output: {...} (optional),
 *   articleText: "...",
 *   articleHtml: "..."
 * }
 */
router.post("/projects/:projectId/drafts", (req, res) => {
  const projectId = req.params.projectId;

  try {
    const created = draftsCore.createDraft(projectId, req.body || {});
    return res.json({
      ok: true,
      projectId,
      draft: created,
    });
  } catch (err) {
    const status = err.statusCode || 500;
    console.error("[Drafts] Error creating draft", err);
    return res.status(status).json({
      ok: false,
      error: err.message || "Failed to create draft",
    });
  }
});

module.exports = router;
