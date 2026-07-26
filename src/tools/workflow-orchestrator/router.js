const express = require('express');
const router = express.Router();
const verifyShopifySession = require('../../middleware/verifyShopifySession');
const { requireCreditsOnMutation } = require('../../core/creditMiddleware');

router.use(verifyShopifySession);


router.get('/dags', async (req, res) => {
  res.json({ ok: true, dags: [] });
});

router.post('/dags', requireCreditsOnMutation('workflow-dag'), async (req, res) => {
  res.json({ ok: true, dag: req.body });
});

router.get('/queue', async (req, res) => {
  res.json({ ok: true, queue: [] });
});

router.get('/analytics', async (req, res) => {
  res.json({ ok: true, p50: 0.8, p95: 4.2, p99: 12.1, successRate: 99.2 });
});


module.exports = router;
