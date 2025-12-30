// src/core/aiChatbot.js
// Simple AI chatbot integration (OpenAI GPT-4 API)

const fetch = require('node-fetch');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

async function chatWithAI(messages, { model = 'gpt-4', temperature = 0.7, max_tokens = 512 } = {}) {
  if (!OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY');
  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
    }),
  });
  if (!res.ok) throw new Error('OpenAI API error');
  const data = await res.json();
  return data.choices[0]?.message?.content || '';
}

module.exports = { chatWithAI };
