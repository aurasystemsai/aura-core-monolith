const express = require('express');
const sc = require('../core/searchConsole');
const meta = require('../core/metaAds');

const router = express.Router();

const page = (title, msg) => `<!doctype html><meta charset="utf-8"><title>${title}</title>
<body style="background:#09090b;color:#fafafa;font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center">
<div style="max-width:420px;text-align:center"><h2>${title}</h2><p style="color:#a1a1aa">${msg}</p></div></body>`;

// Public by necessity (Meta redirects the browser here); the signed state identifies the shop.
router.get('/callback', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const st = sc.verifyStatePayload(req.query.state);
  if (!st || st.purpose !== 'meta') return res.status(400).send(page('Link expired', 'Start the connection again from AURA.'));
  if (req.query.error || !req.query.code) return res.status(400).send(page('Not connected', 'Meta access was not granted. You can close this window and try again.'));
  try {
    await meta.completeConnection(req, String(req.query.code), st.shop);
    res.send(page('Meta connected', 'You can close this window and return to AURA.'));
  } catch (e) {
    res.status(502).send(page('Connection failed', 'Meta sign-in could not be completed. Close this window and try again.'));
  }
});

module.exports = router;