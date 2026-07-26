const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');

router.use(verifyShopifySession);


router.post('/scan', requireCreditsOnMutation('domain-scan'), async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ ok: false, error: 'domain required' });
    res.json({ ok: true, domain, senderScore: 94, inboxRate: 97.2, blacklists: 0 });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.get('/dns', async (req, res) => {
  res.json({ ok: true, checks: [] });
});

router.get('/blacklist', async (req, res) => {
  res.json({ ok: true, listings: 0, checked: 92 });
});

router.post('/analyze-spam', requireCreditsOnMutation('spam-analyze'), async (req, res) => {
  res.json({ ok: true, score: 2.1, issues: [] });
});


module.exports = router;
