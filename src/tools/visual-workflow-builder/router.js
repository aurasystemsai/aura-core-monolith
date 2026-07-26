const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');

router.use(verifyShopifySession);


router.post('/generate', requireCreditsOnMutation('workflow-generate'), async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ ok: false, error: 'prompt required' });
    res.json({ ok: true, workflow: { nodes: [], edges: [], prompt } });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.get('/templates', async (req, res) => {
  res.json({ ok: true, templates: [] });
});

router.get('/executions', async (req, res) => {
  res.json({ ok: true, executions: [] });
});

router.post('/activate', requireCreditsOnMutation('workflow-activate'), async (req, res) => {
  res.json({ ok: true, status: 'active' });
});


module.exports = router;
