// src/core/anthropicChat.js
// Simple Anthropic Claude Haiku 4.5 integration

const fetch = require('node-fetch');

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-3-haiku-20240307'; // Claude Haiku 4.5

async function chatWithClaude(messages, { model = DEFAULT_MODEL, temperature = 0.7, max_tokens = 512 } = {}) {
  if (!ANTHROPIC_API_KEY) throw new Error('Missing ANTHROPIC_API_KEY');
  const res = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens,
      temperature,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) throw new Error('Anthropic API error');
  const data = await res.json();
  // Claude returns the message in content[0].text
  return data.content?.[0]?.text || '';
}

module.exports = { chatWithClaude, DEFAULT_MODEL };