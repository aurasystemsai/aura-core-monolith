// Outbound webhook triggers for winback events
const db = require('./db');
const axios = require('axios');

async function triggerWebhooks(event, payload) {
  const { rows } = await db.query('SELECT * FROM winback_webhooks WHERE event = $1', [event]);
  for (const hook of rows) {
    try {
      await axios.post(hook.url, payload, {
        headers: { 'X-Winback-Event': event, 'X-Winback-Secret': hook.secret || '' },
        timeout: 5000,
      });
    } catch (err) {
      // Log or store failed webhook delivery
      console.error('[Winback] Webhook delivery failed', hook.url, err.message);
    }
  }
}

module.exports = { triggerWebhooks };
