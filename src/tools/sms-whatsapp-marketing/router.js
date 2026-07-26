const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');

router.use(verifyShopifySession);


router.get('/campaigns', async (req, res) => {
  res.json({ ok: true, campaigns: [] });
});

router.post('/campaigns', requireCreditsOnMutation('sms-campaign'), async (req, res) => {
  res.json({ ok: true, campaign: req.body });
});

router.post('/generate', requireCreditsOnMutation('sms-generate'), async (req, res) => {
  res.json({ ok: true, message: 'Hey {{first_name}}! Check out our latest offers.' });
});

router.get('/analytics', async (req, res) => {
  res.json({ ok: true, delivered: 97.8, opens: 94.2, clicks: 18.4 });
});


module.exports = router;
