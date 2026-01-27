const express = require("express");
const router = express.Router();
const { handleConditionalLogicQuery } = require("./conditionalLogicAutomationService");

// Lightweight in-memory stubs for UI demo/state (non-persistent)
const SAMPLE_LOGIC_BLOCKS = [
  { id: "lb_and", name: "AND Gate", description: "All conditions must be true" },
  { id: "lb_or", name: "OR Gate", description: "Any condition can be true" },
  { id: "lb_threshold", name: "Threshold", description: ">= X events within Y days" },
  { id: "lb_geo", name: "Geo Match", description: "Country/region/zip filters" },
];

const SAMPLE_WORKFLOWS = [
  { id: "wf_winback", name: "Churn Winback", steps: ["Geo Match", "Threshold", "AND"] },
  { id: "wf_highAov", name: "High AOV VIP", steps: ["Threshold", "OR"] },
];

const SAMPLE_TRIGGERS = [
  { id: "tr_cart", name: "Abandoned Cart" },
  { id: "tr_browse", name: "Browse Abandonment" },
  { id: "tr_ltv", name: "LTV Drops" },
];

// POST /api/conditional-logic-automation/query
router.post("/query", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.json({ ok: false, error: "Missing or invalid query" });
    }
    const result = await handleConditionalLogicQuery(query);
    res.json({ ok: true, result });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

// Logic blocks
router.get("/logic-blocks", (_req, res) => {
  res.json({ ok: true, logicBlocks: SAMPLE_LOGIC_BLOCKS });
});

// Workflows
router.get("/workflows", (_req, res) => {
  res.json({ ok: true, workflows: SAMPLE_WORKFLOWS });
});

// Triggers
router.get("/triggers", (_req, res) => {
  res.json({ ok: true, triggers: SAMPLE_TRIGGERS });
});

// Feedback (accept and ack)
router.post("/feedback", (req, res) => {
  const { feedback } = req.body || {};
  if (!feedback || typeof feedback !== "string") {
    return res.status(400).json({ ok: false, error: "Missing feedback" });
  }
  console.log("[Conditional Logic] Feedback received", feedback.slice(0, 200));
  res.json({ ok: true });
});

// Health check
router.get("/health", (req, res) => {
  res.json({ ok: true, status: "Conditional Logic Automation API running" });
});

module.exports = router;
