const express = require("express");
const router = express.Router();
const tool = require("./index");
const {
  ingestData,
  summarizePerformance,
  buildJourneys,
  simpleCohorts,
} = require("./analyticsAttributionService");

// POST /api/advanced-analytics-attribution/analyze
// Body: { query?, model?, events?, shopifyOrders?, adEvents?, offlineEvents?, options?, includeJourneys?, cohortKey? }
router.post("/analyze", async (req, res) => {
  try {
    const payload = req.body || {};
    const result = await tool.run(payload, { requestId: req.id || null });
    return res.json(result);
  } catch (err) {
    return res.json({ ok: false, error: err.message });
  }
});

// POST /api/advanced-analytics-attribution/ingest
// Quickly normalize inbound events and return summaries
router.post("/ingest", async (req, res) => {
  try {
    const { shopifyOrders, adEvents, offlineEvents, events, cohortKey, includeJourneys } = req.body || {};
    const normalized = ingestData({ shopifyOrders, adEvents, offlineEvents }).concat(events || []);
    const performance = summarizePerformance(normalized);
    const journeys = includeJourneys ? buildJourneys(normalized) : undefined;
    const cohorts = cohortKey ? simpleCohorts(normalized, cohortKey) : undefined;
    return res.json({ ok: true, events: normalized, performance, journeys, cohorts });
  } catch (err) {
    return res.json({ ok: false, error: err.message });
  }
});

// Health check
router.get("/health", (req, res) => {
  res.json({ ok: true, status: "Advanced Analytics Attribution API running" });
});

// GET /api/advanced-analytics-attribution/trends
router.get('/trends', async (req, res) => {
  // Stub: return sample SEO issues trend data
  res.json({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    seoIssues: [40, 37, 35, 32, 30, 28, 27]
  });
});

module.exports = router;
