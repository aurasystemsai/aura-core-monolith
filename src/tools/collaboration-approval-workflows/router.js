const express = require("express");
const router = express.Router();
const { buildCollaborationWorkflow } = require("./collaborationApprovalService");

// POST /api/collaboration-approval-workflows/build
router.post("/build", async (req, res) => {
  try {
    const { workflow } = req.body;
    if (!workflow || typeof workflow !== "string") {
      return res.json({ ok: false, error: "Missing or invalid workflow" });
    }
    const result = await buildCollaborationWorkflow(workflow);
    res.json({ ok: true, result });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ ok: true, status: "Collaboration Approval Workflows API running" });
});

module.exports = router;
