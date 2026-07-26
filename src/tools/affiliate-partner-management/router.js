const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');

router.use(verifyShopifySession);


router.get('/affiliates', async (req, res) => {
  res.json({ ok: true, affiliates: [] });
});

router.post('/affiliates', requireCreditsOnMutation('affiliate-invite'), async (req, res) => {
  res.json({ ok: true, affiliate: req.body });
});

router.get('/analytics', async (req, res) => {
  res.json({ ok: true, clicks: 0, conversions: 0, revenue: 0, commissions: 0 });
});

router.post('/payouts', requireCreditsOnMutation('affiliate-payout'), async (req, res) => {
  res.json({ ok: true, processed: true });
});


module.exports = router;
