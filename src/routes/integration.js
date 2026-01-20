const express = require('express');
const router = express.Router();

// Dummy status checkers for integrations (replace with real logic)
router.get('/shopify/status', (req, res) => {
  // TODO: Check Shopify API connectivity for this shop
  res.json({ status: 'ok' });
});
router.get('/klaviyo/status', (req, res) => {
  // TODO: Check Klaviyo API connectivity
  res.json({ status: 'ok' });
});
router.get('/google-analytics/status', (req, res) => {
  // TODO: Check Google Analytics API connectivity
  res.json({ status: 'ok' });
});
router.get('/slack/status', (req, res) => {
  // TODO: Check Slack API connectivity
  res.json({ status: 'ok' });
});
router.get('/segment/status', (req, res) => {
  // TODO: Check Segment API connectivity
  res.json({ status: 'ok' });
});

module.exports = router;
