// src/tools/advanced-personalization-engine/slackNotify.js
// Slack notification utility for Advanced Personalization Engine
const fetch = require('node-fetch');

async function sendSlackNotification(webhookUrl, message) {
  if (!webhookUrl) throw new Error('Missing Slack webhook URL');
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: message })
  });
}

module.exports = { sendSlackNotification };