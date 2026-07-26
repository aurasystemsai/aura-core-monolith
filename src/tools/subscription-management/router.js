const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');

router.use(verifyShopifySession);


router.get('/subscribers', async (req, res) => {
  res.json({ ok: true, subscribers: [], mrr: 0 });
});

router.get('/analytics', async (req, res) => {
  res.json({ ok: true, mrr: 84200, churnRate: 2.1, ltv: 840 });
});

router.post('/plans', requireCreditsOnMutation('sub-plan'), async (req, res) => {
  res.json({ ok: true, plan: req.body });
});

router.post('/dunning/retry', requireCreditsOnMutation('dunning-retry'), async (req, res) => {
  res.json({ ok: true, recovered: true });
});


module.exports = router;
