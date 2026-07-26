const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');

router.use(verifyShopifySession);


router.get('/newsletters', async (req, res) => {
  res.json({ ok: true, newsletters: [] });
});

router.post('/generate', requireCreditsOnMutation('newsletter-generate'), async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) return res.status(400).json({ ok: false, error: 'topic required' });
    res.json({ ok: true, content: 'Generated newsletter content for: ' + topic });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.get('/analytics', async (req, res) => {
  res.json({ ok: true, openRate: 46, clickRate: 9, subscribers: 24800 });
});


module.exports = router;
