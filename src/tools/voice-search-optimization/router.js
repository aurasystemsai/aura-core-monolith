const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');

router.use(verifyShopifySession);


router.get('/overview', async (req, res) => {
  res.json({ ok: true, voiceQueries: 12400, featuredSnippets: 8 });
});

router.post('/generate-answer', requireCreditsOnMutation('voice-answer'), async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ ok: false, error: 'question required' });
    res.json({ ok: true, answer: 'Yes, we offer free shipping on all orders over $50 with 2-3 day delivery.' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/mine-questions', requireCreditsOnMutation('voice-mine'), async (req, res) => {
  res.json({ ok: true, questions: [] });
});


module.exports = router;
