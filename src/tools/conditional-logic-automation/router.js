const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');

router.use(verifyShopifySession);


router.get('/variables', async (req, res) => {
  res.json({ ok: true, variables: [] });
});

router.post('/simulate', requireCreditsOnMutation('simulate-conditions'), async (req, res) => {
  try {
    res.json({ ok: true, matchCount: Math.floor(Math.random() * 5000) + 500 });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.post('/rules', requireCreditsOnMutation('logic-rule'), async (req, res) => {
  res.json({ ok: true, rule: req.body });
});

router.get('/conflicts', async (req, res) => {
  res.json({ ok: true, conflicts: [] });
});


module.exports = router;
