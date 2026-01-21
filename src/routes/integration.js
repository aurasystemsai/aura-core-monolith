const express = require('express');
const router = express.Router();

// Dummy status checkers for integrations (replace with real logic)
router.get('/shopify/status', (req, res) => {
  // TODO: Check Shopify API connectivity for this shop
  res.json({ status: 'ok' });
});

module.exports = router;
