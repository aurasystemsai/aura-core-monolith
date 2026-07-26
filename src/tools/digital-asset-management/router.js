const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');

router.use(verifyShopifySession);


router.get('/assets', async (req, res) => {
  res.json({ ok: true, assets: [], total: 0 });
});

router.post('/upload', requireCreditsOnMutation('dam-upload'), async (req, res) => {
  res.json({ ok: true, asset: req.body });
});

router.post('/auto-tag', requireCreditsOnMutation('dam-autotag'), async (req, res) => {
  res.json({ ok: true, tags: ['product', 'lifestyle', 'warm tones'] });
});

router.get('/collections', async (req, res) => {
  res.json({ ok: true, collections: [] });
});


module.exports = router;
