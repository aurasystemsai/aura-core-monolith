const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');

router.use(verifyShopifySession);


router.get('/overview', async (req, res) => {
  res.json({ ok: true, videos: 48, totalViews: 284000 });
});

router.post('/optimize', requireCreditsOnMutation('video-optimize'), async (req, res) => {
  res.json({ ok: true, score: 78, recommendations: [] });
});

router.post('/mine-transcript', requireCreditsOnMutation('transcript-mine'), async (req, res) => {
  res.json({ ok: true, keywords: [], blogIdeas: [] });
});


module.exports = router;
