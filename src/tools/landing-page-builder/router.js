const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');

router.use(verifyShopifySession);


router.get('/pages', async (req, res) => {
  res.json({ ok: true, pages: [] });
});

router.post('/generate', requireCreditsOnMutation('page-generate'), async (req, res) => {
  res.json({ ok: true, page: req.body });
});

router.post('/ab-test', requireCreditsOnMutation('ab-test'), async (req, res) => {
  res.json({ ok: true, test: req.body });
});

router.get('/analytics', async (req, res) => {
  res.json({ ok: true, visitors: 28400, conversions: 2613, convRate: 9.2 });
});


module.exports = router;
