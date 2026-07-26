const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');

router.use(verifyShopifySession);


router.get('/overview', async (req, res) => {
  res.json({ ok: true, mau: 84200, dau: 28628, crashRate: 0.12 });
});

router.post('/ai-analyze', requireCreditsOnMutation('mobile-analyze'), async (req, res) => {
  res.json({ ok: true, insights: [] });
});

router.get('/funnel', async (req, res) => {
  res.json({ ok: true, steps: [] });
});

router.post('/push', requireCreditsOnMutation('push-campaign'), async (req, res) => {
  res.json({ ok: true, sent: true });
});


module.exports = router;
