// src/routes/drafts.js
"use strict";

const express = require("express");
const {
  listDraftsByProject,
  getDraftById,
} = require("../core/drafts");

const router = express.Router();

// GET /projects/:projectId/drafts?limit=50&offset=0
router.get("/projects/:projectId/drafts", (req, res) => {
  try {
    const { projectId } = req.params;
    const { limit, offset } = req.query;

    const drafts = listDraftsByProject(projectId, limit, offset);
    return res.json({ ok: true, drafts });
  } catch (err) {
    console.error("Failed to list drafts", err);
    return res.status(500).json({ ok: false, error: "Failed to list drafts" });
  }
});

// GET /projects/:projectId/drafts/:draftId
router.get("/projects/:projectId/drafts/:draftId", (req, res) => {
  try {
    const { projectId, draftId } = req.params;

    const draft = getDraftById(projectId, draftId);
    if (!draft) {
      return res.status(404).json({ ok: false, error: "Draft not found" });
    }

    return res.json({ ok: true, draft });
  } catch (err) {
    console.error("Failed to read draft", err);
    return res.status(500).json({ ok: false, error: "Failed to read draft" });
  }
});

module.exports = router;
