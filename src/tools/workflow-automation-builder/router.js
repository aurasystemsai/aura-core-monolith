const express = require("express");
const router = express.Router();
const { buildWorkflow } = require("./workflowAutomationService");

// POST /api/workflow-automation-builder/build
router.post("/build", async (req, res) => {
  try {
    const { workflow } = req.body;
    if (!workflow || typeof workflow !== "string") {
      return res.json({ ok: false, error: "Missing or invalid workflow" });
    }
    const result = await buildWorkflow(workflow);
    res.json({ ok: true, result });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ ok: true, status: "Workflow Automation Builder API running" });
});

module.exports = router;
