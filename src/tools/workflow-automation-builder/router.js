const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');

router.use(verifyShopifySession);


router.get('/rules', async (req, res) => {
  res.json({ ok: true, rules: [] });
});

router.post('/rules', requireCreditsOnMutation('workflow-rule'), async (req, res) => {
  try {
    const { ruleName, trigger, operator, value, action } = req.body;
    if (!ruleName || !trigger) return res.status(400).json({ ok: false, error: 'ruleName and trigger required' });
    res.json({ ok: true, rule: { ruleName, trigger, operator, value, action, status: 'active' } });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.put('/rules/:id', requireCreditsOnMutation('workflow-rule'), async (req, res) => {
  res.json({ ok: true, updated: true });
});

router.get('/audit', async (req, res) => {
  res.json({ ok: true, events: [] });
});


module.exports = router;
