const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');

router.use(verifyShopifySession);


router.get('/opportunities', async (req, res) => {
  res.json({ ok: true, opportunities: [], estimatedLift: 0 });
});

router.post('/scan', requireCreditsOnMutation('cro-scan'), async (req, res) => {
  res.json({ ok: true, opportunities: [] });
});

router.post('/ab-test', requireCreditsOnMutation('ab-test'), async (req, res) => {
  res.json({ ok: true, test: req.body });
});

router.get('/analytics', async (req, res) => {
  res.json({ ok: true, convRate: 3.4, revenuePerVisitor: 1.84 });
});


module.exports = router;
