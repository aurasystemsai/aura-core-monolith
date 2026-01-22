// src/tools/abandoned-checkout-winback/slackNotify.js
// Slack notification utility for winback tool
const fetch = (...args) => globalThis.fetch(...args);

async function sendSlackNotification(webhookUrl, message) {
  if (!webhookUrl) throw new Error('Missing Slack webhook URL');
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message })
  });
}

module.exports = { sendSlackNotification };