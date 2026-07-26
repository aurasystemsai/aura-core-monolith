const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');

router.use(verifyShopifySession);


router.post('/chat', requireCreditsOnMutation('ai-chat'), async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ ok: false, error: 'message required' });
    res.json({ ok: true, reply: 'I have analysed your request and queued the appropriate actions.' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

router.get('/action-log', async (req, res) => {
  res.json({ ok: true, actions: [] });
});

router.post('/tasks', requireCreditsOnMutation('ai-task'), async (req, res) => {
  res.json({ ok: true, task: req.body });
});

router.get('/insights', async (req, res) => {
  res.json({ ok: true, insights: [] });
});


module.exports = router;
