// Honest placeholder for tools that need an outside account (ad platforms, warehouses, app analytics) which
// is not connected yet. It reports what is needed and returns no numbers, so nothing on screen is invented.
const express = require('express');

function connectRouter(info) {
  const router = express.Router();
  router.get('/status', (req, res) => res.json({ ok: true, connected: false, ...info }));
  router.get('/health', (req, res) => res.json({ ok: true, connected: false }));
  router.use((req, res) => res.status(501).json({ ok: false, error: `${info.name} is not connected yet, so there is nothing to do here.` }));
  return router;
}
module.exports = { connectRouter };